"""Thin clients for each ATS's public job-board API.

Every function returns a list of plain dicts with a common shape:
    {"company": str, "title": str, "location": str, "url": str,
     "posted_at": str|None, "description": str}

`description` is HTML or plain text, whatever the ATS gives us, and is
consumed by filters.jd_stack_mismatch() for the JD-based stack dealbreaker
check. It's fetched from the SAME request as the listing wherever the ATS
supports that (Greenhouse ?content=true, Ashby/Lever include it by
default) — no extra per-job request needed, so this doesn't multiply your
call volume. Workable's widget API may or may not include it depending on
account; if absent, `description` is just "" and the stack check is
skipped for that job (title/location filters still apply).

NOTE ON THIS SANDBOX: outbound HTTP to arbitrary domains (e.g.
boards-api.greenhouse.io) is blocked by this cloud environment's network
allowlist — that's a property of THIS dev sandbox, not of the ATS APIs
themselves (verified working via WebFetch during development). Run this
module on a machine/server with normal internet access — your laptop, a
cron box, a small VM — and it will work as-is.

CONFIDENCE NOTE on fetch_smartrecruiters specifically (2026-08-12): unlike
Greenhouse/Ashby/Workable/Lever, which were each confirmed against a real
live response during development, SmartRecruiters' shape here is built
from their docs (developers.smartrecruiters.com) plus two independent
third-party integrations that describe the same shape (jobspipe.dev,
an Apify scraper) — this sandbox's WebFetch got blocked by
api.smartrecruiters.com's robots.txt, so it's NOT been hit live the way
the others were. Verify it the same way Coveo/Treewalk's slugs got
verified: `python -m app.main --company <slug>` against a real
SmartRecruiters company before trusting it in a real run.

CONFIDENCE NOTE on fetch_comeet (2026-09-20): built from Comeet/Spark Hire
Recruit's public developer docs (developers.comeet.com) plus independent
third-party scraper writeups (jobspipe.dev, Apify listings) — this
sandbox has no outbound network access at all, so unlike Greenhouse/
Ashby/Workable/Lever this has NEVER been hit live, not even against a
robots.txt-blocked WebFetch the way SmartRecruiters was. Comeet powers a
large share of Israeli tech careers pages, which is why it's worth
having despite the lower confidence — verify with `python -m app.main
--company <slug>` before trusting it. See fetch_comeet's own docstring
for why its `slug` format is different from every other ATS here.
"""
import json
import re

import httpx

from app import filters

USER_AGENT = "job-search-pipeline/0.1 (personal use)"
TIMEOUT = 20.0

_COMEET_COMPANY_DATA_RE = re.compile(r"COMPANY_DATA\s*=\s*(\{.*?\})\s*;", re.DOTALL)


def fetch_greenhouse(company_display_name: str, slug: str) -> list[dict]:
    url = f"https://boards-api.greenhouse.io/v1/boards/{slug}/jobs"
    resp = httpx.get(
        url, params={"content": "true"}, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT
    )
    resp.raise_for_status()
    data = resp.json()
    jobs = []
    for j in data.get("jobs", []):
        jobs.append({
            "company": company_display_name,
            "title": j.get("title", ""),
            "location": (j.get("location") or {}).get("name", ""),
            "url": j.get("absolute_url", ""),
            "posted_at": j.get("first_published") or j.get("updated_at"),
            "description": j.get("content", ""),  # HTML
        })
    return jobs


def fetch_ashby(company_display_name: str, slug: str) -> list[dict]:
    # Ashby's public posting-API endpoint (no auth needed for public boards).
    url = f"https://api.ashbyhq.com/posting-api/job-board/{slug}"
    resp = httpx.get(url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    jobs = []
    for j in data.get("jobs", []):
        loc = j.get("location") or j.get("locationName") or ""
        jobs.append({
            "company": company_display_name,
            "title": j.get("title", ""),
            "location": loc,
            "url": j.get("jobUrl") or j.get("applyUrl", ""),
            "posted_at": j.get("publishedAt"),
            "description": j.get("descriptionPlain") or j.get("descriptionHtml") or "",
        })
    return jobs


def fetch_workable(company_display_name: str, slug: str) -> list[dict]:
    # Workable's public widget API.
    url = f"https://apply.workable.com/api/v1/widget/accounts/{slug}?details=true"
    resp = httpx.get(url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    jobs = []
    for j in data.get("jobs", []):
        loc = j.get("location") or {}
        loc_str = ", ".join(filter(None, [loc.get("city"), loc.get("region"), loc.get("country")]))
        if loc.get("workplace") == "remote":
            loc_str = f"Remote ({loc_str})" if loc_str else "Remote"
        jobs.append({
            "company": company_display_name,
            "title": j.get("title", ""),
            "location": loc_str,
            "url": j.get("url") or j.get("shortlink", ""),
            "posted_at": j.get("published_on") or j.get("created_at"),
            # Workable's widget API doesn't reliably include a description
            # field across all accounts — treat missing as unknown, not
            # as "no dealbreaker language", filters.py handles empty safely.
            "description": j.get("description", ""),
        })
    return jobs


def fetch_lever(company_display_name: str, slug: str) -> list[dict]:
    # Lever's public postings API.
    url = f"https://api.lever.co/v0/postings/{slug}?mode=json"
    resp = httpx.get(url, headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT)
    resp.raise_for_status()
    data = resp.json()
    jobs = []
    for j in data:
        cats = j.get("categories", {}) or {}
        loc = cats.get("location", "")
        all_locs = cats.get("allLocations") or []
        if all_locs:
            loc = ", ".join(all_locs)
        jobs.append({
            "company": company_display_name,
            "title": j.get("text", ""),
            "location": loc,
            "url": j.get("hostedUrl", ""),
            "posted_at": j.get("createdAt"),  # epoch millis
            "description": j.get("descriptionPlain") or j.get("description", ""),
        })
    return jobs


def _fetch_smartrecruiters_description(slug: str, posting_id: str) -> str:
    """SmartRecruiters' list endpoint (fetch_smartrecruiters below) doesn't
    include the JD text — only the per-posting detail endpoint does, one
    extra request per job. Best-effort: any failure (private board, 404,
    timeout) just means no description, not a crashed run; filters.py
    treats an empty description as "unknown, don't reject on stack alone"."""
    try:
        resp = httpx.get(
            f"https://api.smartrecruiters.com/v1/companies/{slug}/postings/{posting_id}",
            headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT,
        )
        resp.raise_for_status()
        sections = (resp.json().get("jobAd") or {}).get("sections") or {}
        parts = [
            (sections.get(key) or {}).get("text", "")
            for key in ("jobDescription", "qualifications", "additionalInformation")
        ]
        return "\n\n".join(p for p in parts if p)
    except Exception:
        return ""


def fetch_smartrecruiters(company_display_name: str, slug: str) -> list[dict]:
    # SmartRecruiters' public Posting API — only enabled per-account (not
    # every customer turns it on), same "might just 404" caveat as the
    # other ATSes here. Paginated via limit/offset, 100 postings per page.
    jobs = []
    offset = 0
    limit = 100
    while True:
        url = f"https://api.smartrecruiters.com/v1/companies/{slug}/postings"
        resp = httpx.get(
            url, params={"limit": limit, "offset": offset},
            headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT,
        )
        resp.raise_for_status()
        data = resp.json()
        content = data.get("content", [])
        if not content:
            break

        for p in content:
            loc = p.get("location") or {}
            loc_str = ", ".join(filter(None, [loc.get("city"), loc.get("region"), loc.get("country")]))
            if loc.get("remote"):
                loc_str = f"Remote ({loc_str})" if loc_str else "Remote"

            title = p.get("name", "")
            posting_id = p.get("id", "")
            job_url = p.get("applyUrl") or p.get("ref") or (
                f"https://jobs.smartrecruiters.com/{slug}/{posting_id}" if posting_id else ""
            )
            if not job_url:
                # No applyUrl/ref/id to build any identifier from — skip
                # rather than store url="", which would make dedup.is_new()
                # treat every subsequent url-less posting as a duplicate of
                # the first one (an exact-match dedup key collision).
                continue

            description = ""
            # Only worth the extra per-job request (see
            # _fetch_smartrecruiters_description) for postings that
            # already look like real candidates — same gating idea as
            # aggregator_clients.fetch_adzuna uses for its full-JD fetch,
            # so a company with hundreds of postings doesn't turn into
            # hundreds of extra requests for roles that'd get filtered
            # out on title/location alone anyway.
            if posting_id and filters.title_is_relevant(title) and filters.location_is_allowed(loc_str):
                description = _fetch_smartrecruiters_description(slug, posting_id)

            jobs.append({
                "company": company_display_name,
                "title": title,
                "location": loc_str,
                "url": job_url,
                "posted_at": p.get("releasedDate"),
                "description": description,
            })

        if len(content) < limit:
            break
        offset += limit
    return jobs


def _fetch_comeet_company_data(board_path: str) -> tuple[str, str]:
    """Comeet's Careers API needs a company UID + a public per-company
    token — but unlike a Greenhouse/Lever slug, neither is guessable from
    a company name. Both live in a `COMPANY_DATA` JS object embedded on
    the company's own public careers page, so fetch that page first and
    pull them out of it. Raises with a clear message if the page doesn't
    look like a Comeet board — a wrong `board_path` should read as an
    error, not silently return zero jobs."""
    resp = httpx.get(
        f"https://www.comeet.com/jobs/{board_path}",
        headers={"User-Agent": USER_AGENT}, timeout=TIMEOUT,
    )
    resp.raise_for_status()
    m = _COMEET_COMPANY_DATA_RE.search(resp.text)
    if not m:
        raise RuntimeError(
            f"No COMPANY_DATA found on the Comeet careers page for "
            f"'{board_path}' — check that this is a valid Comeet board "
            f"path (the part of the URL after comeet.com/jobs/)."
        )
    data = json.loads(m.group(1))
    uid = data.get("uid") or data.get("company_uid")
    token = data.get("token")
    if not uid or not token:
        raise RuntimeError(f"COMPANY_DATA for '{board_path}' is missing uid/token: {data}")
    return uid, token


def _comeet_description(position: dict) -> str:
    """With `details=true`, Comeet returns a `details` array of rich
    per-position sections (job description, requirements, etc) — exact
    key names weren't confirmed against a live response (see the
    CONFIDENCE NOTE at the top of this file), so this reads whatever
    shape shows up rather than assuming one, and degrades to "" (not a
    crash) if the shape doesn't match either guess."""
    details = position.get("details") or (position.get("custom_fields") or {}).get("details") or []
    parts = []
    for item in details:
        if isinstance(item, dict):
            text = item.get("value") or item.get("text") or item.get("description") or ""
            if text:
                parts.append(filters.strip_html(str(text)))
        elif isinstance(item, str):
            parts.append(item)
    return "\n\n".join(p for p in parts if p)


def fetch_comeet(company_display_name: str, slug: str) -> list[dict]:
    """Comeet (rebranded "Spark Hire Recruit") powers a large share of
    Israeli tech careers pages that the other 5 ATSes here don't touch.

    `slug` here is NOT a bare company name — it's the full board path
    from the company's public careers URL, e.g. "monday/41.00B" for
    https://www.comeet.com/jobs/monday/41.00B. Find it by opening the
    company's real careers page and copying everything after '/jobs/'.
    This is unavoidable: Comeet's API is scoped by an opaque company UID
    (the ".00B"-style suffix), not a predictable name-based slug the way
    Greenhouse/Lever/Ashby are, so it can't be guessed the way those can.
    """
    uid, token = _fetch_comeet_company_data(slug)
    resp = httpx.get(
        f"https://www.comeet.co/careers-api/2.0/company/{uid}/positions",
        params={"token": token, "details": "true"},
        headers={"User-Agent": USER_AGENT, "Accept": "application/json"},
        timeout=TIMEOUT,
    )
    resp.raise_for_status()
    data = resp.json()
    positions = data if isinstance(data, list) else data.get("positions", [])

    jobs = []
    for p in positions:
        loc = p.get("location") or {}
        loc_str = loc.get("name") or ", ".join(filter(None, [loc.get("city"), loc.get("country")]))
        if (p.get("workplace_type") or "").lower() == "remote":
            loc_str = f"Remote ({loc_str})" if loc_str else "Remote"
        jobs.append({
            "company": company_display_name,
            "title": p.get("name", ""),
            "location": loc_str,
            "url": p.get("url_recruit_hosted_page") or p.get("position_url", ""),
            "posted_at": p.get("time_updated"),
            "description": _comeet_description(p),
        })
    return jobs


FETCHERS = {
    "greenhouse": fetch_greenhouse,
    "ashby": fetch_ashby,
    "workable": fetch_workable,
    "lever": fetch_lever,
    "smartrecruiters": fetch_smartrecruiters,
    "comeet": fetch_comeet,
}


def fetch_company(company: dict) -> list[dict]:
    fetcher = FETCHERS.get(company["ats"])
    if fetcher is None:
        raise ValueError(f"No fetcher for ATS type: {company['ats']}")
    jobs = fetcher(company["name"], company["slug"])
    for j in jobs:
        j["source"] = company["ats"]
    return jobs