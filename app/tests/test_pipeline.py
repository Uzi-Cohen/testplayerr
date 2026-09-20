"""Sanity test for filters.py + dedup.py, using QA/Israel sample data that
exercises the same edge cases the original SWE/Canada version covered:
non-QA titles leaking through, locations outside the allowlist, and
dedup by URL vs. by normalized company+title.
Run with: python -m app.tests.test_pipeline
"""
import os
from app import filters
from app import dedup

SAMPLE_JOBS = [
    # Should PASS: real fields, Tel Aviv on-site, matches title allowlist
    {"company": "Wiz", "title": "Senior QA Automation Engineer",
     "location": "Tel Aviv, Israel", "url": "https://job-boards.greenhouse.io/wiz/jobs/1111",
     "description": "Build and maintain our Java/Selenium regression suite."},
    # Should FAIL: excluded title keyword (compliance)
    {"company": "Wiz", "title": "Compliance Lead, Israel",
     "location": "Tel Aviv, Israel", "url": "https://job-boards.greenhouse.io/wiz/jobs/7788916003",
     "description": ""},
    # Should FAIL: location not in allowlist (Remote US)
    {"company": "Wiz", "title": "Staff QA Engineer",
     "location": "Remote US", "url": "https://job-boards.greenhouse.io/wiz/jobs/2222",
     "description": ""},
    # Should FAIL: location outside Israel — a bare "Remote" with no
    # Israel qualifier shouldn't leak through the allowlist.
    {"company": "Wiz", "title": "QA Analytics Engineer II",
     "location": "Remote Poland", "url": "https://job-boards.greenhouse.io/wiz/jobs/7764109003",
     "description": ""},
    # Should FAIL: real noise — title has no QA/test keyword at all,
    # exclusion-only filtering would have nothing to catch this on.
    {"company": "Wiz", "title": "Marketing Operations Manager",
     "location": "Tel Aviv, Israel", "url": "https://job-boards.greenhouse.io/wiz/jobs/9999",
     "description": ""},
    {"company": "Wiz", "title": "Senior Manager, Talent Brand",
     "location": "Tel Aviv, Israel", "url": "https://job-boards.greenhouse.io/wiz/jobs/9998",
     "description": ""},
    # Should PASS: real Israel on-site posting, different city
    {"company": "AppsFlyer", "title": "QA Engineer — Mobile SDK",
     "location": "Herzliya, Israel", "url": "https://job-boards.greenhouse.io/appsflyer/jobs/4911972004",
     "description": "Mobile SDK testing, iOS and Android."},
    # Should FAIL: excluded keyword (nurse)
    {"company": "Some Co", "title": "Occupational Health Nurse",
     "location": "Tel Aviv, Israel", "url": "https://example.com/jobs/9999",
     "description": ""},
    # Should PASS: title matches allowlist ("test"); JD stack-dealbreaker
    # check is disabled for this QA-focused config (see filters.yaml), so a
    # JD naming an unrelated implementation language never rejects a QA role.
    {"company": "BigCorp", "title": "Senior Test Engineer",
     "location": "Tel Aviv, Israel", "url": "https://example.com/jobs/8888",
     "description": "Our backend is Go and gRPC. No mention of Java/Appium anywhere."},
    # Should PASS: title matches, JD is thin/empty — never rejected on
    # stack alone regardless of what it does or doesn't mention
    {"company": "DualStackCo", "title": "Backend QA Engineer",
     "location": "Tel Aviv, Israel", "url": "https://example.com/jobs/7777",
     "description": "Our platform is a mix of Java services and a newer Python/FastAPI stack."},
    # Duplicate of the first PASS entry by URL -> should be filtered by dedup on 2nd pass
    {"company": "Wiz", "title": "Senior QA Automation Engineer",
     "location": "Tel Aviv, Israel", "url": "https://job-boards.greenhouse.io/wiz/jobs/1111",
     "description": "Build and maintain our Java/Selenium regression suite."},
    # Repost under a new URL, same company+title -> should be caught by company+title dedup
    {"company": "Wiz", "title": "Senior QA Automation Engineer",
     "location": "Tel Aviv, Israel", "url": "https://job-boards.greenhouse.io/wiz/jobs/3333-repost",
     "description": "Build and maintain our Java/Selenium regression suite."},
    # Should PASS: real Lever-shaped sample, Herzliya without "Israel" in the string
    {"company": "SomeLeverCo", "title": "QA Automation Engineer, Mobile",
     "location": "Herzliya, Ramat Hachayal", "url": "https://jobs.lever.co/someleverco/22d02404-b9c9-4b77-9448-add55d961444",
     "description": "Appium and Java experience preferred."},
    # Should PASS: unambiguous priority-title match rescues this from the
    # "marketing" substring in EXCLUSION_KEYWORDS.
    {"company": "Warner Music Group", "title": "QA Engineer, Automated Marketing",
     "location": "Tel Aviv, Israel", "url": "https://www.example.com/details/5702928490",
     "description": "Build automated marketing tooling. Java and Selenium."},
]

TEST_DB = "data/test_seen_jobs.sqlite3"


def main():
    if os.path.exists(TEST_DB):
        os.remove(TEST_DB)

    print("=== Filter results ===")
    filtered = []
    for job in SAMPLE_JOBS:
        ok = filters.passes_filters(job)
        print(f"{'PASS' if ok else 'DROP':5s} | {job['company']:14s} | {job['title'][:50]:50s} | {job['location']}")
        if ok:
            filtered.append(job)

    print(f"\n{len(filtered)}/{len(SAMPLE_JOBS)} passed title+location filters\n")

    print("=== Dedup results (processing filtered jobs in order) ===")
    kept = []
    with dedup.connect(TEST_DB) as conn:
        for job in filtered:
            if dedup.is_new(conn, job):
                dedup.mark_seen(conn, job)
                kept.append(job)
                print(f"NEW  | {job['company']:14s} | {job['title'][:50]:50s} | {job['url']}")
            else:
                print(f"DUPE | {job['company']:14s} | {job['title'][:50]:50s} | {job['url']}")

    print(f"\nFinal candidates after filters+dedup: {len(kept)}")

    # Assertions to make this a real check, not just eyeballing.
    # PASS: Wiz Senior QA Automation Engineer (x1 unique after dedup),
    # AppsFlyer, BigCorp, DualStackCo, SomeLeverCo, Warner Music Group.
    # DROP: Compliance Lead, Remote US, Remote Poland, Marketing Ops
    # Manager, Senior Manager Talent Brand, Occupational Health Nurse.
    assert len(filtered) == 8, f"expected 8 to pass all filters, got {len(filtered)}"
    assert len(kept) == 6, f"expected 6 unique candidates after dedup, got {len(kept)}"

    # Targeted unit checks.
    assert not filters.location_is_allowed("Remote Poland")
    assert not filters.location_is_allowed("Remote Spain")
    assert not filters.location_is_allowed("Remote US")
    assert filters.location_is_allowed("Tel Aviv, Israel")
    assert filters.location_is_allowed("Herzliya, Ramat Hachayal")
    assert not filters.title_is_relevant("Marketing Operations Manager")
    assert not filters.title_is_relevant("Senior Manager, Talent Brand")
    assert not filters.title_is_relevant("Compliance Lead, Israel")
    assert filters.title_is_relevant("Senior QA Automation Engineer")
    assert filters.title_is_relevant("QA Engineer, Automated Marketing")
    assert not filters.title_is_relevant("Sales Engineer")  # priority list shouldn't rescue this
    # Stack-dealbreaker check is disabled (empty lists) for this QA config —
    # a JD never gets rejected on implementation-language grounds alone.
    assert not filters.jd_stack_mismatch("5+ years of Go and gRPC required.")
    assert not filters.jd_stack_mismatch("Java services and a Python/FastAPI stack.")
    assert not filters.jd_stack_mismatch("")  # no JD available -> don't reject on stack alone

    print("\nAll assertions passed.")


if __name__ == "__main__":
    main()
