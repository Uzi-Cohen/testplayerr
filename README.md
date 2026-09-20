# Uzi's Job Search Pipeline

A personal, ready-to-run fork of an AI-powered job search pipeline,
customized for **Uzi Cohen — QA Engineer** (mobile/SDK testing, manual +
automation, iOS/Android, Java/Appium/Selenium/TestNG/REST Assured,
security testing), based in Petah Tikva, Israel.

Fetches open QA/SDET/automation roles directly from companies' ATS APIs
and job aggregators, filters out anything irrelevant, deduplicates against
everything already seen, optionally scores each candidate's fit against
Uzi's real profile with Claude, and reviews the results in a local web
board.

Nothing here talks to any service other than the job sources configured
and (for the optional AI step) the Anthropic API. All state — scraped
jobs, scores, notes — lives in a local SQLite database.

## What's already customized here (vs. the generic template)

Unlike the upstream template, **this repo is pre-configured and ready to
run** — no "fill in your own profile/filters/companies" step needed:

- **`profile.yaml`** — Uzi's real profile, built directly from his CV
  (experience at Digital Turbine and Mobile Research Labs, OWASP Top 10
  security testing, mobile SDK testing, Java/Appium/Selenium automation).
  Committed (not gitignored) since this is a personal tool, not a shared
  template — see `profile.example.yaml`/`profile.sample.yaml` if you ever
  need the blank template or a fully-worked example again.
- **`filters.yaml`** — title filters rewritten for QA/SDET/Automation
  Engineer roles (not generic "software engineer"); location filters set
  to Israel + the Tel Aviv-area cities employers actually use; the
  JD-stack-dealbreaker check is disabled (empty lists) — it doesn't map
  well onto QA hiring, where the product's implementation language says
  little about the QA/automation stack required.
- **`companies.yaml`** — replaced the original Alberta/Canada SWE company
  list with companies in mobile/ad-tech/SDK, security, and fintech with
  an Israel R&D presence. **Read the file's header comment** — it has two
  confidence tiers: the greenhouse/ashby entries are a best-effort guess
  from general knowledge (unverified), while the comeet entries are each
  backed by a real indexed URL found via web search (higher confidence,
  still not a live API hit). Confirm each with `python -m app.main
  --company <slug>` before trusting a real run, and expect to prune/
  extend the list as you go.
- **`app/ats_clients.py`** — added a 6th ATS fetcher, **Comeet**
  ("Spark Hire Recruit"), which powers a large share of Israeli tech
  careers pages that Greenhouse/Ashby/Workable/Lever/SmartRecruiters
  don't touch. Comeet's API needs a company UID + token that aren't
  guessable from a company name the way a Greenhouse slug is — they're
  pulled from a `COMPANY_DATA` object embedded on the company's own
  public careers page, so a comeet entry's `slug` in companies.yaml is
  the full board path from the URL (e.g. `monday/41.00B`), not a bare
  company name. See the CONFIDENCE NOTE in `app/ats_clients.py` — this
  one is the least-verified fetcher here (built from Comeet's public
  docs + third-party scraper writeups, no live test possible from this
  sandbox at all) — verify before trusting it.
- **`aggregators.yaml`** — Adzuna dropped (no Israel coverage, and the
  underlying client code hardcodes a Canada-only endpoint); Remotive kept,
  with QA-specific search keywords instead of "software engineer".

## How it works

1. **Fetch** (`app/main.py`) — pulls open roles from:
   - `companies.yaml` — known companies queried directly via their ATS
     (Greenhouse, Ashby, Workable, Lever, SmartRecruiters, Comeet) —
     precise, low noise.
   - `aggregators.yaml` — broad keyword search across many employers at
     once (Remotive) — wider reach, more noise, remote-only.
2. **Filter** (`app/filters.py`) — drops anything that isn't a QA/testing-
   shaped title or isn't in an allowed Israel-area location.
3. **Dedup** (`app/dedup.py`) — everything fetched is stored in a local
   SQLite database (`data/seen_jobs.sqlite3`), keyed by URL and by
   normalized company+title, so re-runs only ever surface genuinely new
   postings.
4. **AI evaluation** (`app/ai_evaluate.py`, optional, costs money) — sends
   each filtered candidate plus `profile.yaml` to Claude, which scores fit
   (0-100) and returns concrete gaps, transferable strengths, risk
   factors, and an apply/consider/skip recommendation.
5. **Review** (`web/`) — a local Next.js app reading/writing the same
   SQLite database directly, for browsing results and tracking your own
   `applied / interview / rejected / skipped / silence` status and notes.

## Setup

```bash
pip install -r requirements.txt
cp .env.example .env
# fill in ANTHROPIC_API_KEY in .env — only needed for the AI evaluation step
```

`profile.yaml`, `filters.yaml`, `companies.yaml`, and `aggregators.yaml`
are already filled in — you can run this as-is. Revisit `filters.yaml`'s
`location_allow_patterns` or `companies.yaml` any time your target list
changes.

## Usage

### 1. Fetch + filter (free)

```bash
python -m app.main                    # all companies + aggregators
python -m app.main --company wiz      # just one company, for debugging a fetcher
python -m app.main --skip-aggregators # companies.yaml only
python -m app.main --skip-companies   # aggregators.yaml only

make run                              # same thing, interactive prompts instead of flags
```

Output: `data/candidates.csv`, appended to on every run.

### 2. AI evaluation (optional, costs money)

```bash
python -m app.ai_evaluate --dry-run   # see what's queued, no API calls, no cost
python -m app.ai_evaluate --limit 20  # score just 20, to sanity-check quality/cost first
python -m app.ai_evaluate             # score everything unscored

make evaluate                         # interactive prompts instead of flags
```

Results are stored in SQLite (so re-running never re-pays for a job
already scored) and written to `data/scored_candidates.csv`, sorted
best-match-first.

### 3. Review results

```bash
cd web && npm install    # first time only
cd ..
make web                              # starts the board at http://localhost:3000
```

Reads/writes `data/seen_jobs.sqlite3` directly — no export/import step.
See [`web/README.md`](web/README.md) for details (custom `DB_PATH`,
production build, etc).

## Makefile commands

Thin wrappers over the commands above — run from the repo root:

| Command        | Equivalent to                    | What it does |
|-----------------|----------------------------------|--------------|
| `make run`      | `python -m app.main`             | Fetch + filter (step 1). Interactively asks whether to skip companies/aggregators/discovery and whether to limit to one company slug, instead of you remembering the flags. |
| `make evaluate` | `python -m app.ai_evaluate`       | AI evaluation (step 2). Interactively asks for `--dry-run` and an optional `--limit`. |
| `make web`      | `npm --prefix web run dev`       | Starts the Next.js review board, with `DB_PATH` already pointed at `data/seen_jobs.sqlite3`. |
| `make test`     | `pytest app/` + the standalone sanity-check scripts | Runs the full test suite (see the Tests section below). |

`make` with no target runs `make run` (the default goal).

## Configuration

- **`companies.yaml`** — the company registry (name, ATS type, slug). Add
  a company here once you've identified its ATS.
- **`aggregators.yaml`** — aggregator search config (keywords, pagination
  limits).
- **`filters.yaml`** — title allowlist/exclusion keywords and location
  allowlist patterns. Edit this directly as you refine what counts as
  in-scope — no code changes needed (matching logic lives in
  `app/filters.py`).
- **`profile.yaml`** — the experience profile fed to the AI evaluation
  step.

## Project layout

```
app/
  main.py                 orchestrates fetch -> filter -> dedup -> candidates.csv
  ats_clients.py           one fetch function per ATS
  aggregator_clients.py    one fetch function per aggregator
  filters.py               loads and applies filters.yaml's rules
  dedup.py                 SQLite store (seen_jobs, job_details)
  discover_companies.py    auto-appends newly-resolved companies to companies.yaml
  ai_evaluate.py           stage 2: Claude-based fit scoring
  inspect_job.py           CLI to look up a stored job or list recent rejections
  refilter.py              re-runs current filters.py against already-fetched jobs
  scripts/                 one-off diagnostic/maintenance scripts, not part of the pipeline
  tests/                   pytest + standalone sanity-check scripts
web/                       Next.js review board (see web/README.md)
companies.yaml             company -> ATS registry (Israel/mobile/security-focused)
aggregators.yaml           aggregator search config (Remotive, QA keywords)
filters.yaml               title/location filter rules (QA-focused, Israel locations)
profile.yaml               Uzi Cohen's real profile, fed to ai_evaluate.py
profile.example.yaml       blank template (kept for reference)
profile.sample.yaml        fully worked (fictional) example (kept for reference)
```

## Tests

```bash
make test
```

Runs the pytest suite plus the standalone sanity-check scripts
(`test_pipeline.py`, `test_discover_companies.py`, `test_ai_evaluate.py`).
None of them call live external APIs.

## Notes on scope

- ATS fetchers for Greenhouse, Ashby, Workable, and Lever were each
  validated against real live responses by the upstream template's
  author. SmartRecruiters and Comeet support is built from documentation
  and third-party corroboration only — Comeet in particular has never
  been hit live at all (see its CONFIDENCE NOTE in `app/ats_clients.py`).
- `companies.yaml`'s slugs in this fork are unverified (see the file's
  header comment for its two confidence tiers) — this dev environment had
  no outbound internet access to check them against real APIs. Run
  `python -m app.main --company <slug>` on each before trusting it in a
  real run.
- If a particular company's fetch fails, `main.py` logs a warning and
  continues with the rest rather than crashing the whole run.

## Possible next steps

- Verify/prune `companies.yaml` slugs against live APIs (see above) and
  keep adding companies as you find them while applying — Comeet
  especially, since its `comeet:` section here is a starting point, not a
  complete list of every Israeli company that runs on it.
- Workday support (`clio.wd3.myworkdayjobs.com`-style boards) — its
  job-search API is POST-based with a different pagination shape than the
  ATSes currently supported.
- A digest output (email/Sheet) beyond the current CSV/SQLite/web-board
  review flow.
- Scheduling: once you're happy with a full local run, a daily cron entry
  like `0 7 * * * cd /path/to/this/repo && python -m app.main && python -m app.ai_evaluate`.

## License

[MIT](LICENSE)
