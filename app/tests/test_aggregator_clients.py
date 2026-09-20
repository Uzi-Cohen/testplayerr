"""Sanity test for aggregator_clients.py's full-JD-fetch logic — no real
network calls (this dev sandbox blocks outbound httpx to arbitrary domains
anyway; see the module docstrings). Mocks httpx.get/httpx.Response to
verify: (1) fetch_full_description prefers a recognized ATS's own JSON API
when the redirect lands there (and reports the resolved ats/slug back —
that's what feeds discover_companies.py), (2) falls back to scraping raw
HTML when it doesn't recognize the destination, (3) returns an empty
result cleanly on any failure, (4) fetch_adzuna only attempts the extra
fetch for jobs that already look like real candidates with a genuinely
thin snippet — not all ~2000 raw aggregator results, and (5) a resolved
Greenhouse/Lever match gets queued into DISCOVERED_COMPANIES for
main.py/discover_companies.py to pick up. Run with:
python -m pytest app/tests/test_aggregator_clients.py
"""
from unittest.mock import patch, MagicMock

from app import aggregator_clients


def _fake_response(url, json_data=None, text=""):
    resp = MagicMock()
    resp.url = url
    resp.text = text
    resp.raise_for_status = MagicMock()
    resp.json = MagicMock(return_value=json_data or {})
    return resp


def test_full_description_prefers_greenhouse_api():
    redirect_resp = _fake_response("https://job-boards.greenhouse.io/warnermusicgroup/jobs/1234567", text="<html>ignored</html>")
    job_resp = _fake_response("...", json_data={"content": "<p>Full JD from Greenhouse's own API.</p>"})

    with patch("httpx.get", side_effect=[redirect_resp, job_resp]) as mock_get:
        result = aggregator_clients.fetch_full_description("https://www.adzuna.ca/details/1")
    assert result["description"] == "<p>Full JD from Greenhouse's own API.</p>"
    assert result["ats"] == "greenhouse" and result["slug"] == "warnermusicgroup"
    assert mock_get.call_count == 2  # redirect follow, then the single-job API call
    print("fetch_full_description: Greenhouse single-job API preferred, ats/slug reported — OK")


def test_full_description_prefers_lever_api():
    posting_id = "22d02404-b9c9-4b77-9448-add55d961444"
    redirect_resp = _fake_response(f"https://jobs.lever.co/altaml/{posting_id}", text="<html>ignored</html>")
    job_resp = _fake_response("...", json_data={"descriptionPlain": "Full JD from Lever's own API."})

    with patch("httpx.get", side_effect=[redirect_resp, job_resp]):
        result = aggregator_clients.fetch_full_description("https://www.adzuna.ca/details/2")
    assert result["description"] == "Full JD from Lever's own API."
    assert result["ats"] == "lever" and result["slug"] == "altaml"
    print("fetch_full_description: Lever single-job API preferred, ats/slug reported — OK")


def test_full_description_falls_back_to_html_scrape():
    html = "<html><head><style>.x{color:red}</style></head><body><h1>Software Engineer</h1><p>We need Python.</p></body></html>"
    redirect_resp = _fake_response("https://careers.example.com/job/42", text=html)

    with patch("httpx.get", side_effect=[redirect_resp]):
        result = aggregator_clients.fetch_full_description("https://www.adzuna.ca/details/3")
    assert result["description"] is not None
    assert "Software Engineer" in result["description"] and "Python" in result["description"]
    assert "color:red" not in result["description"]  # style block dropped
    assert result["ats"] is None and result["slug"] is None  # unrecognized host -> no discovery signal
    print("fetch_full_description: unrecognized site falls back to HTML scrape, no discovery — OK")


def test_full_description_returns_none_on_failure():
    with patch("httpx.get", side_effect=Exception("connection refused")):
        result = aggregator_clients.fetch_full_description("https://www.adzuna.ca/details/4")
    assert result == {"description": None, "ats": None, "slug": None}
    print("fetch_full_description: network failure -> empty result, no crash — OK")

    assert aggregator_clients.fetch_full_description("") == {"description": None, "ats": None, "slug": None}
    print("fetch_full_description: empty url -> empty result — OK")


def test_adzuna_only_fetches_full_jd_for_promising_thin_snippets():
    """Gating check: fetch_full_description should NOT be called for jobs
    that fail title/location, or whose snippet is already long enough —
    only for the subset that's both a real candidate AND thin. This is
    what keeps a 2000-result run from turning into 2000 extra requests."""
    base_result = lambda **kw: {
        "title": "QA Automation Engineer",
        "location": {"display_name": "Tel Aviv, Israel"},
        "company": {"display_name": "TestCo"},
        "redirect_url": "https://www.adzuna.ca/details/x",
        "created": "2026-08-01",
        "description": "Short teaser.",
        **kw,
    }
    results = [
        base_result(),  # promising + thin -> SHOULD fetch
        base_result(title="Marketing Operations Manager"),  # fails title -> should NOT fetch
        base_result(location={"display_name": "Remote Poland"}),  # fails location -> should NOT fetch
        base_result(description="A" * 500 + " already a full-length description, well past the floor."),  # not thin -> should NOT fetch
    ]
    page_resp = _fake_response("...", json_data={"results": results})

    import os
    with patch.dict(os.environ, {"ADZUNA_APP_ID": "id", "ADZUNA_APP_KEY": "key"}), \
         patch("httpx.get", return_value=page_resp), \
         patch("app.aggregator_clients.fetch_full_description",
               return_value={"description": "FULL JD TEXT, much longer than the original teaser snippet.",
                              "ats": None, "slug": None}) as mock_full:
        jobs = aggregator_clients.fetch_adzuna({"results_per_page": 50, "max_pages": 1})

    assert mock_full.call_count == 1, f"expected exactly 1 full-JD fetch, got {mock_full.call_count}"
    assert jobs[0]["description"].startswith("FULL JD TEXT")
    assert jobs[1]["description"] == "Short teaser."
    assert jobs[2]["description"] == "Short teaser."
    assert jobs[3]["description"].startswith("AAAA")
    print("fetch_adzuna: full-JD fetch gated to promising+thin results only — OK")


def test_adzuna_queues_discovered_companies():
    """When fetch_full_description resolves a Greenhouse/Lever match, that
    company should land in DISCOVERED_COMPANIES for discover_companies.py
    to pick up after the run — see main.py."""
    result = {
        "title": "QA Engineer, Automated Marketing",
        "location": {"display_name": "Tel Aviv, Israel"},
        "company": {"display_name": "Warner Music Group"},
        "redirect_url": "https://www.adzuna.ca/details/5702928490",
        "created": "2026-04-17",
        "description": "Short teaser…",
    }
    page_resp = _fake_response("...", json_data={"results": [result]})

    import os
    aggregator_clients.DISCOVERED_COMPANIES.clear()
    with patch.dict(os.environ, {"ADZUNA_APP_ID": "id", "ADZUNA_APP_KEY": "key"}), \
         patch("httpx.get", return_value=page_resp), \
         patch("app.aggregator_clients.fetch_full_description",
               return_value={"description": "Full JD text, much longer than the teaser snippet ever was.",
                              "ats": "greenhouse", "slug": "warnermusicgroup"}):
        aggregator_clients.fetch_adzuna({"results_per_page": 50, "max_pages": 1})

    assert aggregator_clients.DISCOVERED_COMPANIES == [
        {"name": "Warner Music Group", "ats": "greenhouse", "slug": "warnermusicgroup"}
    ]
    print("fetch_adzuna: resolved Greenhouse/Lever match queued into DISCOVERED_COMPANIES — OK")


def test_jooble_requires_api_key():
    import os
    with patch.dict(os.environ, {}, clear=True):
        try:
            aggregator_clients.fetch_jooble({"keywords": "QA Engineer", "location": "Israel"})
            assert False, "expected a RuntimeError"
        except RuntimeError as e:
            assert "JOOBLE_API_KEY" in str(e)
    print("fetch_jooble: missing API key raises a clear error — OK")


def test_jooble_only_fetches_full_jd_for_promising_thin_snippets():
    """Same gating idea as fetch_adzuna's version above, against Jooble's
    response shape (jobs: [{title, location, snippet, link, company,
    updated}])."""
    base_job = lambda **kw: {
        "title": "QA Automation Engineer",
        "location": "Tel Aviv, Israel",
        "company": "TestCo",
        "link": "https://jooble.org/desc/123",
        "updated": "2026-08-01",
        "snippet": "Short teaser.",
        **kw,
    }
    results = [
        base_job(),  # promising + thin -> SHOULD fetch
        base_job(title="Marketing Operations Manager"),  # fails title -> should NOT fetch
        base_job(location="Remote Poland"),  # fails location -> should NOT fetch
        base_job(snippet="A" * 500 + " already a full-length description, well past the floor."),
    ]
    page_resp = _fake_response("...", json_data={"jobs": results})

    import os
    with patch.dict(os.environ, {"JOOBLE_API_KEY": "key"}), \
         patch("httpx.post", return_value=page_resp), \
         patch("app.aggregator_clients.fetch_full_description",
               return_value={"description": "FULL JD TEXT, much longer than the original teaser snippet.",
                              "ats": None, "slug": None}) as mock_full:
        jobs = aggregator_clients.fetch_jooble({"keywords": "QA Automation Engineer", "location": "Israel", "max_pages": 1})

    assert mock_full.call_count == 1, f"expected exactly 1 full-JD fetch, got {mock_full.call_count}"
    assert jobs[0]["description"].startswith("FULL JD TEXT")
    assert jobs[1]["description"] == "Short teaser."
    assert jobs[2]["description"] == "Short teaser."
    assert jobs[3]["description"].startswith("AAAA")
    print("fetch_jooble: full-JD fetch gated to promising+thin results only — OK")


def test_jooble_queues_discovered_companies():
    result = {
        "title": "QA Engineer",
        "location": "Tel Aviv, Israel",
        "company": "Warner Music Group",
        "link": "https://jooble.org/desc/456",
        "updated": "2026-04-17",
        "snippet": "Short teaser…",
    }
    page_resp = _fake_response("...", json_data={"jobs": [result]})

    import os
    aggregator_clients.DISCOVERED_COMPANIES.clear()
    with patch.dict(os.environ, {"JOOBLE_API_KEY": "key"}), \
         patch("httpx.post", return_value=page_resp), \
         patch("app.aggregator_clients.fetch_full_description",
               return_value={"description": "Full JD text, much longer than the teaser snippet ever was.",
                              "ats": "greenhouse", "slug": "warnermusicgroup"}):
        aggregator_clients.fetch_jooble({"keywords": "QA Engineer", "location": "Israel", "max_pages": 1})

    assert aggregator_clients.DISCOVERED_COMPANIES == [
        {"name": "Warner Music Group", "ats": "greenhouse", "slug": "warnermusicgroup"}
    ]
    print("fetch_jooble: resolved Greenhouse/Lever match queued into DISCOVERED_COMPANIES — OK")


def test_remotive_discovers_companies_from_direct_urls():
    """fetch_remotive doesn't need fetch_full_description at all — Remotive
    already gives the real posting URL directly, so if that URL is itself
    a recognized ATS link, discovery should fire with no extra request."""
    jobs_data = [
        {
            "company_name": "Warner Music Group",
            "title": "QA Engineer",
            "candidate_required_location": "Worldwide",
            "url": "https://job-boards.greenhouse.io/warnermusicgroup/jobs/1234567",
            "publication_date": "2026-04-17",
            "description": "Full JD text.",
        },
        {
            "company_name": "SomeCo",
            "title": "QA Engineer",
            "candidate_required_location": "Worldwide",
            "url": "https://somecoawesome.com/careers/qa-engineer",  # not a recognized ATS -> no discovery
            "publication_date": "2026-04-17",
            "description": "Full JD text.",
        },
    ]
    page_resp = _fake_response("...", json_data={"jobs": jobs_data})

    aggregator_clients.DISCOVERED_COMPANIES.clear()
    with patch("httpx.get", return_value=page_resp):
        aggregator_clients.fetch_remotive({"search": "QA Engineer"})

    assert aggregator_clients.DISCOVERED_COMPANIES == [
        {"name": "Warner Music Group", "ats": "greenhouse", "slug": "warnermusicgroup"}
    ]
    print("fetch_remotive: discovers companies straight from direct ATS URLs, no extra request — OK")


if __name__ == "__main__":
    test_full_description_prefers_greenhouse_api()
    test_full_description_prefers_lever_api()
    test_full_description_falls_back_to_html_scrape()
    test_full_description_returns_none_on_failure()
    test_adzuna_only_fetches_full_jd_for_promising_thin_snippets()
    test_adzuna_queues_discovered_companies()
    test_jooble_requires_api_key()
    test_jooble_only_fetches_full_jd_for_promising_thin_snippets()
    test_jooble_queues_discovered_companies()
    test_remotive_discovers_companies_from_direct_urls()
    print("\nAll assertions passed.")