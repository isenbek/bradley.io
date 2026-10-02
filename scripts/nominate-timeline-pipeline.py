#!/usr/bin/env python3
"""
Platform Timeline Pipeline

Standalone script (not part of the 4-hourly pipeline, too heavy for that).
Fetches all repos + commits from a GitHub org or user, summarizes each repo
with a language model, then names cross-repo development phases.

Usage:
  python3 scripts/nominate-timeline-pipeline.py [--target ORG] [--verbose]
      [--skip-ai] [--skip-cache] [--out PATH] [--cache FILE] [--seed FILE]
      [--prefer-seed] [--limit-ai N] [--ai-budget-min M] [--refresh-phases]
      [--accept-shrink]

  --target ORG       GitHub org or user (default Nominate-AI)
  --out PATH         Write the timeline here instead of public/data. A path
                     ending in .json is the file; anything else is a directory
                     and the file is <dir>/<org-slug>-timeline.json. With --out
                     the cache is ALSO redirected next to the output (seeded
                     read-only from the real cache), so a test run changes
                     nothing the live site or the next cron run will read.
  --cache FILE       Explicit cache file (overrides the rule above).
  --seed FILE        A timeline-shaped JSON of earlier good AI results
                     (phases[], repos[]), for example names recovered from git
                     history. A seed phase covering exactly the same repos as
                     a current phase is RESTORED without a model call (marked
                     "reused" with its original date). Add --refresh-phases to
                     ask the model first and use the seed only if that fails.
                     Seed repo descriptions are only ever a failure fallback.
                     May be given more than once. A name already in the cache
                     or the previous output WINS over the seed (and a line is
                     printed saying the seed was ignored) unless --prefer-seed.
  --prefer-seed      Let a seed phase replace a cached or previously published
                     name for the same repos. This is how recovered names are
                     restored after an unseeded run has already named a phase.
                     Not combinable with --refresh-phases.
  --limit-ai N       Make at most N model calls in this run. Items past the
                     cap keep their earlier value and are retried next run.
  --ai-budget-min M  Stop asking the model after M minutes of model time in
                     this run (default 60, env AI_BUDGET_MIN, 0 = no limit).
                     Items past the budget keep their earlier value and are
                     retried next run; the summary line says how many.
  --refresh-phases   Ask the model again for every phase, even unchanged ones.
  --accept-shrink    Proceed although GitHub lists under 80 percent of the
                     repos the cache knows (normally a failed listing; the run
                     refuses and leaves the published file alone).
  --skip-ai          Make no model calls at all.
  --skip-cache       Ignore the cache (refetches GitHub and re-asks the model).

AI contract (the reason this file was reworked on 2026-10-02):
  - All model calls go through scripts/ai_client.py (CBAI gateway first, local
    Ollama second). Every failed call is printed to stderr, always, not only
    under --verbose.
  - A failure is NEVER cached. Only a real answer is stored, so a repo or a
    phase whose call failed is retried on the next run.
  - No downgrade: when a call fails (or is skipped by --limit-ai), an earlier
    real answer is kept and marked with the date it was generated. Earlier
    answers come from the cache, the previous output file, and any --seed.
    The "Phase N" placeholder is used only when there is nothing better.
  - Every phase carries source ("ai" this run, "reused" unchanged input,
    "kept" after a failure, "fallback" placeholder), generatedAt and model.
    Every repo carries descriptionSource and descriptionGeneratedAt. The file
    carries aiSummary with the counts for the run.
  - Phase startDate and endDate are computed from the repos' creation dates.
    A milestone is kept only when its repo really has a commit (or was
    created) on that day. The model is not trusted with dates.
  - Each run ends with one line: how many model calls succeeded, failed,
    were reused.
  - Bounded: the run stops asking when the time budget is used up or when
    ai_client has given up on every backend (3 timeouts in a row), instead of
    paying a full timeout for each of a few hundred items. One run per cache
    file at a time: a second one exits with code 75 and a line on stderr.
  - A phase keeps its earlier name through a small change of its repo set
    (a rename, a deleted repo, a listing that came back short) when the model
    cannot be asked: the earlier phase sharing at least 5 of 7 repos is kept,
    marked "kept" with generatedForRepos. Cached phase names are not deleted
    while most of their repos still exist.
"""

import argparse
import fcntl
import json
import math
import os
import re
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# scripts/__pycache__ is not gitignored; do not leave a .pyc in the work tree.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import ai_client  # noqa: E402  (scripts/ai_client.py)

# --- Config ---------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent


def _parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="Platform timeline pipeline")
    p.add_argument("--target", default="Nominate-AI")
    p.add_argument("--verbose", action="store_true")
    p.add_argument("--skip-ai", action="store_true")
    p.add_argument("--skip-cache", action="store_true")
    p.add_argument("--out", default=None)
    p.add_argument("--cache", default=None)
    p.add_argument("--seed", action="append", default=[])
    p.add_argument("--limit-ai", type=int, default=None)
    p.add_argument("--refresh-phases", action="store_true")
    p.add_argument("--prefer-seed", action="store_true")
    p.add_argument("--ai-budget-min", type=float, default=None)
    p.add_argument("--accept-shrink", action="store_true")
    args = p.parse_args()
    if args.prefer_seed and args.refresh_phases:
        p.error("--prefer-seed restores seed names without asking the model; "
                "--refresh-phases asks the model for every phase. Pick one.")
    if args.prefer_seed and not args.seed:
        p.error("--prefer-seed needs at least one --seed FILE")
    return args


ARGS = _parse_args()
ORG = ARGS.target

# Per-target file paths
ORG_SLUG = ORG.lower().replace(" ", "-")
CANONICAL_CACHE = PROJECT_ROOT / f".{ORG_SLUG}-timeline-cache.json"
CANONICAL_OUTPUT = PROJECT_ROOT / "public" / "data" / f"{ORG_SLUG}-timeline.json"

if ARGS.out:
    _out = Path(ARGS.out).expanduser()
    OUTPUT_FILE = _out if _out.suffix == ".json" else _out / f"{ORG_SLUG}-timeline.json"
else:
    OUTPUT_FILE = CANONICAL_OUTPUT

if ARGS.cache:
    CACHE_FILE = Path(ARGS.cache).expanduser()
elif ARGS.out:
    CACHE_FILE = OUTPUT_FILE.parent / f".{ORG_SLUG}-timeline-cache.json"
else:
    CACHE_FILE = CANONICAL_CACHE

VERBOSE = ARGS.verbose
SKIP_AI = ARGS.skip_ai
SKIP_CACHE = ARGS.skip_cache
LIMIT_AI = ARGS.limit_ai
REFRESH_PHASES = ARGS.refresh_phases
PREFER_SEED = ARGS.prefer_seed
ACCEPT_SHRINK = ARGS.accept_shrink
SEED_FILES = [Path(s).expanduser() for s in ARGS.seed]

# One run per cache file at a time. The name is chosen to match the existing
# .gitignore pattern for the caches (.*-timeline-cache.json).
LOCK_FILE = CACHE_FILE.parent / f".lock-{CACHE_FILE.name.lstrip('.')}"

# Seconds allowed per backend attempt. The local fallback model answered the
# two real prompts in 30 to 37 s on a saturated box, so 180 leaves room for a
# second client on the same Ollama server without hanging the run for long.
AI_TIMEOUT = float(os.environ.get("AI_TIMEOUT", "180"))

# Minutes of model time one run may spend (0 = no limit). Measured 2026-10-02:
# 15 to 20 s per call on the local fallback model, so 60 minutes is about 180
# to 240 calls, enough for the largest org's first catch-up run. Without a
# budget a slow backend (answers, but in 170 s) keeps the 05:00 cron job
# running for hours: failures are retried every run, by design.
AI_BUDGET_MIN = (
    ARGS.ai_budget_min if ARGS.ai_budget_min is not None
    else float(os.environ.get("AI_BUDGET_MIN", "60"))
)
# Share of the budget the per-repo stage may use while phases still need the
# model: phase names are the most visible output and come last.
REPO_STAGE_SHARE = 0.75
# A GitHub listing with fewer than this share of the cached repo count is
# treated as a failed fetch (see fetch_all_data).
SHRINK_FLOOR = 0.8
# An earlier phase name is kept for a changed repo set when at least this
# share of the repos is the same on both sides (5 of 7).
NEAR_MATCH = 5 / 7
# A last-good repo summary survives this many days of the repo being absent
# from the GitHub listing before it is dropped.
MISSING_GRACE_DAYS = 30

CACHE_VERSION = 2
# Raw GitHub data is refetched when older than this. It was 24, which made the
# daily 05:00 run alternate: the stamp is written when the fetch ENDS (a few
# minutes past the hour), so the next day's run found it 23h55m old, reused
# it, and published day-old commit counts under a fresh "generated" stamp.
RAW_MAX_AGE_HOURS = 20
BATCH_SIZE = 7
PHASE_CATEGORIES = ("systems", "ai-ml", "data", "hardware", "creative")
# Repos with this many meaningful commits or fewer are described from their
# GitHub description or commit subjects directly; there is nothing to summarize.
DIRECT_MAX_COMMITS = 5

NOISE_PREFIXES = (
    "bump:", "deploy:", "nightly:", "merge ", "chore: bump",
    "chore: deploy", "chore: nightly", "initial commit",
)

# Names this script writes when it has no model answer. A phase with one of
# these names is never treated as a real earlier result.
FALLBACK_NAME_RE = re.compile(r"^\s*(Phase \d+|\d{4}-Q\d: \d+ repos)\s*$")
DAY_RE = re.compile(r"\d{4}-\d{2}-\d{2}")

TODAY = datetime.now(timezone.utc).strftime("%Y-%m-%d")

# Run counters, printed as one line at the end.
AI = {
    "ok": 0,        # model calls that returned a usable answer
    "failed": 0,    # model calls that returned nothing usable
    "reused": 0,    # items served from an earlier real answer, input unchanged
    "kept": 0,      # items that kept an earlier real answer after a failure or skip
    "skipped": 0,   # items not attempted because of --limit-ai
    "skipped_budget": 0,  # items not attempted: the time budget was used up
    "skipped_down": 0,    # items not attempted: every backend was given up on
    "fallback": 0,  # items left with no model text at all
    "seed_restored": 0,   # phases restored from a seed file
    "seed_ignored": 0,    # seed phases not used because a cached name exists
}
# Started when the first model stage begins; the budget counts from there.
AI_CLOCK: dict = {"start": None, "told": set()}


def log(msg: str):
    if VERBOSE:
        print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}")


def warn(msg: str):
    """Unconditional, to stderr: cron sends both streams to the pipeline log."""
    print(f"timeline[{ORG_SLUG}]: {msg}", file=sys.stderr, flush=True)


def _write_json_atomic(path: Path, data: dict, indent: int = 2):
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(data, indent=indent))
    os.replace(tmp, path)


def load_cache() -> dict:
    if SKIP_CACHE:
        return {}
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    if CACHE_FILE != CANONICAL_CACHE and CANONICAL_CACHE.exists():
        # Test run (--out): start from the real cache, write the copy elsewhere.
        print(f"  cache: reading {CANONICAL_CACHE.name}, writing {CACHE_FILE}")
        return json.loads(CANONICAL_CACHE.read_text())
    return {}


def save_cache(cache: dict):
    # Keys starting with "_" are per-run scratch and never persisted.
    _write_json_atomic(CACHE_FILE, {k: v for k, v in cache.items() if not k.startswith("_")})


_LOCK_HANDLE = None  # kept open for the life of the process


def acquire_lock():
    """Refuse to run beside another run that writes the same cache file.

    The cache is rewritten after every model answer and the output at the
    end; two runs would overwrite each other's progress. flock is released by
    the kernel when the process ends, however it ends, so there is no stale
    lock to clean up. The file itself is left in place on purpose.
    """
    global _LOCK_HANDLE
    LOCK_FILE.parent.mkdir(parents=True, exist_ok=True)
    handle = open(LOCK_FILE, "a+")
    try:
        fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except OSError:
        handle.seek(0)
        holder = handle.read().strip() or "unknown"
        handle.close()
        warn(f"another run holds {LOCK_FILE} ({holder}); not starting a second one")
        sys.exit(75)
    handle.seek(0)
    handle.truncate()
    handle.write(json.dumps({"pid": os.getpid(), "started": datetime.now(timezone.utc).isoformat()}))
    handle.flush()
    _LOCK_HANDLE = handle


# --- AI helpers -----------------------------------------------------------

def ai_calls_made() -> int:
    return AI["ok"] + AI["failed"]


def ai_seconds_used() -> float:
    return 0.0 if AI_CLOCK["start"] is None else time.monotonic() - AI_CLOCK["start"]


def ai_blocked(*, reserve: int = 0, share: float = 1.0) -> str | None:
    """Why the model may not be asked right now, or None when it may.

    "limit"  --limit-ai reached (reserve holds calls back for a later stage)
    "budget" the run's time budget (or this stage's share of it) is used up
    "down"   ai_client has given up on every backend for this process
    The first time a run hits "budget" or "down" it says so on stderr.
    """
    if LIMIT_AI is not None and ai_calls_made() >= LIMIT_AI - reserve:
        return "limit"
    if AI_BUDGET_MIN > 0 and ai_seconds_used() >= AI_BUDGET_MIN * 60 * share:
        if ("budget", share) not in AI_CLOCK["told"]:
            AI_CLOCK["told"].add(("budget", share))
            stage = "the whole run" if share >= 1 else "the per-repo stage"
            warn(f"AI time budget for {stage} used up ({ai_seconds_used() / 60:.1f} of "
                 f"{AI_BUDGET_MIN:g} min, {ai_calls_made()} calls); the remaining items "
                 "keep their earlier values and are retried next run")
        return "budget"
    if not ai_client.available():
        if "down" not in AI_CLOCK["told"]:
            AI_CLOCK["told"].add("down")
            warn("no AI backend left (ai_client gave up on each of them); the remaining "
                 "items keep their earlier values and are retried next run")
        return "down"
    return None


def note_blocked(reason: str, tag: str):
    key = {"limit": "skipped", "budget": "skipped_budget", "down": "skipped_down"}[reason]
    AI[key] += 1
    why = {"limit": "--limit-ai", "budget": "time budget used up", "down": "no backend left"}[reason]
    log(f"  {tag}: not attempted ({why})")


def text_field(parsed: dict, key: str) -> str:
    """A model field as text, or "" when it is not a string. A nested object
    where a sentence was asked for must not be published as its repr."""
    value = parsed.get(key)
    return value if isinstance(value, str) else ""


def ask_json(prompt: str, *, max_tokens: int, label: str, require: tuple,
             min_chars: int = 60) -> dict | None:
    """One model call. Returns the parsed JSON object, or None.

    require names the fields that must hold real text; ai_client rejects the
    answer (and tries the next backend) when one is missing, is not a string,
    or is a non-answer such as "Okay" or "Please provide ...".
    ai_client has already written the reason to stderr when this is None.
    The caller decides whether the object is good enough and calls
    ai_rejected() when it is not, so the counters stay honest.
    """
    timeout = AI_TIMEOUT
    if AI_BUDGET_MIN > 0:
        # Do not let one call run far past the end of the budget.
        timeout = min(AI_TIMEOUT, max(30.0, AI_BUDGET_MIN * 60 - ai_seconds_used()))
    text = ai_client.chat(
        prompt,
        max_tokens=max_tokens,
        timeout=timeout,
        min_chars=min_chars,
        want_json=True,
        require=require,
        label=label,
    )
    time.sleep(1)  # the Ollama server is shared; leave a gap for its other client
    obj = ai_client.extract_json(text) if text else None
    if obj is None:
        AI["failed"] += 1
        return None
    AI["ok"] += 1
    return obj


def ai_rejected(label: str, why: str):
    """The model answered, the answer parsed, and it is still not usable."""
    AI["ok"] -= 1
    AI["failed"] += 1
    warn(f"AI answer rejected for {label}: {why}")


def clean_text(value, dash: str = ", ") -> str:
    """Tidy model prose for publication: one line, no em dashes (or spaced en
    dashes used as one), no stray lead-in characters."""
    s = str(value or "")
    s = re.sub("\\s*\\u2014\\s*|\\s+\\u2013\\s+", dash, s)
    s = re.sub(r"\s+", " ", s).strip()
    s = re.sub(r"^[^\w\"'(\[]+", "", s)
    return s


def _valid_day(day: str, repo: dict) -> bool:
    """A milestone date is accepted only when something really happened in
    that repo on that day: a commit, or the repo's creation. The model is
    told to copy dates from the facts it was given; this checks that it did."""
    if not DAY_RE.fullmatch(day or ""):
        return False
    if day == (repo.get("created_at") or "")[:10]:
        return True
    return any((c.get("date") or "")[:10] == day for c in repo.get("commits", []))


def _plain(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", text.lower())


def clean_repo_milestones(raw, repo: dict) -> list[dict]:
    out = []
    for m in raw if isinstance(raw, list) else []:
        if not isinstance(m, dict):
            continue
        day = str(m.get("date", ""))[:10]
        title = clean_text(text_field(m, "title"))[:120]
        if title and not ai_client.is_non_answer(title) and _valid_day(day, repo):
            out.append({"date": day, "title": title})
    return out[:3]


def clean_phase_milestones(raw, batch_by_name: dict) -> list[dict]:
    """Keep only milestones tied to a repo in this phase, dated on a day that
    repo really has a commit (or was created), and titled with more than the
    repo's own name."""
    out = []
    lower_names = {n.lower(): n for n in batch_by_name}
    for m in raw if isinstance(raw, list) else []:
        if not isinstance(m, dict):
            continue
        repo_val = m.get("repo", "")
        # The model sometimes returns the repo as an object or a list.
        if isinstance(repo_val, dict):
            repo_val = repo_val.get("name", "")
        elif isinstance(repo_val, list):
            repo_val = repo_val[0] if repo_val else ""
        repo_name = lower_names.get(str(repo_val).strip().lower())
        if repo_name is None:
            continue  # names a repo that is not in this phase
        repo = batch_by_name[repo_name]
        day = str(m.get("date", ""))[:10]
        title = clean_text(text_field(m, "title"))[:120]
        if not title or _plain(title) == _plain(repo_name) or ai_client.is_non_answer(title):
            continue  # a title that is only the repo's name says nothing
        if not _valid_day(day, repo):
            continue
        item = {"date": day, "title": title, "repo": repo_name}
        if item not in out:
            out.append(item)
    out.sort(key=lambda m: m["date"])
    return out[:6]


def snap_to_repo_milestones(raw, resolved: dict) -> list:
    """Line a phase's milestones up with the per-repo milestones they were
    chosen from. The model is asked to copy them and sometimes pairs one
    milestone's title with another's date; the repo-level record wins."""
    out = []
    for m in raw if isinstance(raw, list) else []:
        if isinstance(m, dict) and isinstance(m.get("repo"), str):
            known = resolved.get(m["repo"].strip(), {}).get("milestones", [])
            title = _plain(str(m.get("title", "")))
            day = str(m.get("date", ""))[:10]
            by_title = next((k for k in known if _plain(k["title"]) == title), None)
            by_day = next((k for k in known if k["date"] == day), None)
            if by_title:
                m = {**m, "date": by_title["date"], "title": by_title["title"]}
            elif by_day:
                m = {**m, "title": by_day["title"]}
        out.append(m)
    return out


# --- Stage 1: Fetch all repos + commits -----------------------------------

_REPO_LIST_QUERY = (
    r'.[] | "\(.name)\t\(.language // "Unknown")\t\(.created_at)\t\(.pushed_at)'
    r'\t\(.description // "")"'
)


def _gh_repo_page(scope: str, page: int) -> tuple[list[str] | None, str]:
    """One page of the repo listing. (lines, "") on success, where an empty
    list means the listing has ended; (None, error) when the call failed."""
    try:
        result = subprocess.run(
            ["gh", "api", f"/{scope}/{ORG}/repos?per_page=100&page={page}", "-q", _REPO_LIST_QUERY],
            capture_output=True, text=True, timeout=30,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError) as e:
        return None, f"{type(e).__name__}: {e}"
    if result.returncode != 0:
        stderr = (result.stderr or "").strip()
        return None, (stderr.splitlines()[-1][:200] if stderr else f"exit {result.returncode}")
    return result.stdout.strip().splitlines(), ""


def fetch_all_repos() -> list[dict] | None:
    """Fetch all repos from the target org (or user) via gh CLI.

    Returns None when the listing FAILED part way. It used to treat a failed
    page as the end of the list, so a failed page 2 silently cut a 171-repo
    org down to its first 100 and every phase was regrouped around the gap.
    """
    log(f"Fetching repos for {ORG}...")
    repos = []
    page = 1
    scope = None  # "orgs" or "users", fixed by whichever answers page 1

    while True:
        lines = None
        error = ""
        # Try org API first, fall back to user API. Once one of them has
        # answered, stay with it: the user API lists only an org's public repos.
        for candidate in ([scope] if scope else ["orgs", "users"]):
            got, error = _gh_repo_page(candidate, page)
            if got is not None and (got or scope):
                lines, scope = got, candidate
                break
        if lines is None:
            if page == 1:
                warn(f"repo listing for {ORG} failed or is empty: {error or 'no repos returned'}")
                return []
            warn(f"repo listing for {ORG} failed on page {page} after {len(repos)} repos: {error}")
            return None

        for line in lines:
            parts = line.split("\t")
            if len(parts) < 4:
                continue
            repos.append({
                "name": parts[0].strip(),
                "language": parts[1].strip(),
                "created_at": parts[2].strip(),
                "pushed_at": parts[3].strip(),
                "description": parts[4].strip() if len(parts) > 4 else "",
            })

        if len(lines) < 100:
            break
        page += 1

    log(f"Found {len(repos)} repos")
    return repos


def fetch_repo_commits(repo_name: str) -> list[dict]:
    """Fetch all commits for a single repo, paginating."""
    commits = []
    page = 1

    while True:
        try:
            result = subprocess.run(
                ["gh", "api",
                 f"/repos/{ORG}/{repo_name}/commits?per_page=100&page={page}",
                 "-q", r'.[] | "\(.commit.message | split("\n") | .[0])\t\(.commit.author.date)\t\(.sha[:7])\t\(.commit.author.name)"'],
                capture_output=True, text=True, timeout=30,
            )
            if result.returncode != 0 or not result.stdout.strip():
                break

            lines = result.stdout.strip().splitlines()
            for line in lines:
                parts = line.split("\t")
                if len(parts) < 3:
                    continue
                msg = parts[0].strip()
                date = parts[1].strip()
                sha = parts[2].strip()
                author = parts[3].strip() if len(parts) > 3 else ""

                commits.append({
                    "message": msg[:200],
                    "date": date,
                    "sha": sha,
                    "author": author,
                })

            if len(lines) < 100:
                break
            page += 1

        except (subprocess.TimeoutExpired, FileNotFoundError):
            break

    return commits


def is_noise(msg: str) -> bool:
    lower = msg.lower().strip()
    return any(lower.startswith(p) for p in NOISE_PREFIXES) or len(lower) < 10


def fetch_all_data(cache: dict) -> dict:
    """Stage 1: Fetch all repos and their commits."""
    # Check cache for raw data
    if "raw_repos" in cache and not SKIP_CACHE:
        age_hours = (
            datetime.now(timezone.utc) -
            datetime.fromisoformat(cache.get("raw_fetched_at", "2000-01-01T00:00:00+00:00"))
        ).total_seconds() / 3600
        if age_hours < RAW_MAX_AGE_HOURS:
            log(f"Using cached raw data (< {RAW_MAX_AGE_HOURS}h old)")
            return cache

    repos = fetch_all_repos()
    if not repos:
        # Do not store an empty or failed fetch: it would be served from the
        # cache as "fresh" on the next run. build_output refuses to write and
        # exits 1, leaving the published file and the cache as they were.
        warn("GitHub repo listing failed or returned 0 repos; raw cache left untouched")
        cache["raw_repos"] = []
        return cache

    # A listing that shrank sharply is almost always a fetch that came back
    # short, not a real mass deletion. Carrying on would regroup every phase
    # around the missing repos and throw their names away.
    known = len(cache.get("raw_repos") or [])
    if known >= 5 and len(repos) < known * SHRINK_FLOOR and not ACCEPT_SHRINK:
        warn(f"GitHub lists {len(repos)} repos but the cache knows {known} "
             f"(under {SHRINK_FLOOR:.0%}); treating this as a failed fetch. Nothing was "
             "written. If the repos really are gone, rerun with --accept-shrink.")
        sys.exit(1)
    all_repo_data = []

    for i, repo in enumerate(repos):
        name = repo["name"]
        log(f"  [{i+1}/{len(repos)}] Fetching commits for {name}...")
        commits = fetch_repo_commits(name)
        meaningful = [c for c in commits if not is_noise(c["message"])]

        all_repo_data.append({
            **repo,
            "commits": commits,
            "meaningful_commits": meaningful,
            "total_commits": len(commits),
            "meaningful_count": len(meaningful),
        })

        if (i + 1) % 10 == 0:
            log(f"  Progress: {i+1}/{len(repos)} repos fetched")

    cache["raw_repos"] = all_repo_data
    cache["raw_fetched_at"] = datetime.now(timezone.utc).isoformat()
    save_cache(cache)
    log(f"Stage 1 complete: {len(all_repo_data)} repos, "
        f"{sum(r['total_commits'] for r in all_repo_data)} total commits")
    return cache


# --- Earlier good results (the no-downgrade sources) ----------------------

def summary_key(repo: dict) -> str:
    latest_sha = repo["commits"][0]["sha"] if repo.get("commits") else "none"
    return f"{repo['name']}_{latest_sha}"


def phase_sig(names) -> str:
    """Identity of a phase: the set of repos it covers."""
    return "|".join(sorted(names))


def _looks_like_ai_description(desc: str, gh_desc: str) -> bool:
    """For records written before source markers existed: was this text
    written by the model? GitHub descriptions are one-liners and the direct
    path writes "Commits: ..."; a model summary is two or three sentences."""
    d = (desc or "").strip()
    if not d or d.startswith(("Commits:", "Key commits:")):
        return False
    return d != (gh_desc or "").strip() and len(d) >= 120


def migrate_cache(cache: dict):
    """Purge cached failures and stale entries; keep one last-good per repo.

    Before 2026-10-02 a failed model call was stored under the repo's sha
    (description = the GitHub description, no milestones), so it was never
    retried. This drops those, drops entries for shas that are no longer
    current, and remembers the newest real summary per repo in last_good so a
    later failure has something to fall back on.
    """
    repos_by_name = {r["name"]: r for r in cache["raw_repos"]}
    old = cache.get("repo_summaries", {})
    last_good = cache.setdefault("last_good", {})
    kept: dict = {}
    purged_failures = purged_stale = 0

    # JSON object order is insertion order, so later entries are newer.
    for key, v in old.items():
        name = v.get("name") or key.rsplit("_", 1)[0]
        repo = repos_by_name.get(name)
        if repo is None:
            purged_stale += 1
            continue
        current = key == summary_key(repo)
        ai_eligible = repo.get("meaningful_count", 0) > DIRECT_MAX_COMMITS
        if "source" in v:
            good = v["source"] == "ai"
        else:
            good = bool(v.get("milestones")) or _looks_like_ai_description(
                v.get("description", ""), repo.get("description", ""))
        if not good:
            if current and ai_eligible:
                purged_failures += 1
            else:
                purged_stale += 1
            continue
        entry = {
            "name": name,
            "description": clean_text(v.get("description", "")),
            "milestones": clean_repo_milestones(v.get("milestones", []), repo),
            "source": "ai",
            # Unknown for records that predate the marker: null, not a guess.
            "generatedAt": v.get("generatedAt"),
            "model": v.get("model") or "cbai",
        }
        last_good[name] = {**entry, "sha": key[len(name) + 1:]}
        if current and ai_eligible:
            kept[key] = entry
        else:
            purged_stale += 1

    # A repo missing from the listing keeps its last-good summary for a grace
    # period: a rename or a short listing must not erase the only copy.
    for name in list(last_good):
        entry = last_good[name]
        if name in repos_by_name:
            entry.pop("missingSince", None)
            continue
        since = entry.setdefault("missingSince", TODAY)
        try:
            gone_days = (datetime.fromisoformat(TODAY) - datetime.fromisoformat(since)).days
        except ValueError:
            gone_days = 0
        if gone_days > MISSING_GRACE_DAYS:
            del last_good[name]

    cache["repo_summaries"] = kept
    migrated = cache.get("cache_version") != CACHE_VERSION
    cache["cache_version"] = CACHE_VERSION
    if purged_failures or purged_stale or migrated:
        print(
            f"  cache: purged {purged_failures} cached failures (will be retried) and "
            f"{purged_stale} stale entries; {len(kept)} current summaries kept, "
            f"{len(last_good)} repos have a last-good summary"
        )


def load_previous(cache: dict) -> dict:
    """Earlier real results from the previous output file and any seed file.

    Returns {"phases": {sig: phase}, "repos": {name: {...}}}. The first source
    that knows an item wins: the file being replaced, then the live
    public/data file (when --out points elsewhere), then seeds in the order given.
    """
    gh_desc = {r["name"]: r.get("description", "") for r in cache["raw_repos"]}
    # seed_phases holds what the --seed files say, whether or not an earlier
    # source already knew that phase, so --prefer-seed can let the seed win
    # and so an ignored seed can be reported.
    prev: dict = {"phases": {}, "repos": {}, "seed_phases": {}}

    sources: list[Path] = []
    if OUTPUT_FILE.exists():
        sources.append(OUTPUT_FILE)
    if CANONICAL_OUTPUT != OUTPUT_FILE and CANONICAL_OUTPUT.exists():
        sources.append(CANONICAL_OUTPUT)
    sources.extend(SEED_FILES)

    for path in sources:
        try:
            data = json.loads(path.read_text())
        except (OSError, json.JSONDecodeError) as e:
            warn(f"cannot read earlier results from {path}: {e}")
            continue
        file_day = str(data.get("generated", ""))[:10] or None
        n_phases = n_repos = 0

        for p in data.get("phases", []):
            name = str(p.get("name", ""))
            if not p.get("repos") or p.get("source") == "fallback" or FALLBACK_NAME_RE.match(name):
                continue
            description = clean_text(p.get("description", ""))
            if len(description) < 40:
                continue  # a name with no narrative is not a result worth keeping
            # A phase kept after a failure may have been written for fewer
            # repos than it now lists. Its identity is what it was written
            # for, so it never counts as an exact match for the larger batch
            # and the model is asked again.
            covered = p.get("generatedForRepos") or p["repos"]
            sig = phase_sig(covered)
            is_seed = path in SEED_FILES
            if sig in prev["phases"] and not (is_seed and sig not in prev["seed_phases"]):
                continue
            entry = {
                "name": clean_text(name, dash=": "),
                "description": description,
                "category": p.get("category", "systems"),
                "milestones": p.get("milestones", []),
                "repos": list(covered),
                # Before the marker existed phases were regenerated on every
                # run, so the file's own stamp is the generation date.
                "generatedAt": p.get("generatedAt") or file_day,
                "model": p.get("model") or "cbai",
            }
            if is_seed:
                prev["seed_phases"][sig] = entry
            if sig not in prev["phases"]:
                prev["phases"][sig] = entry
            n_phases += 1

        for r in data.get("repos", []):
            name = r.get("name")
            if not name or name in prev["repos"] or name not in gh_desc:
                continue
            src = r.get("descriptionSource")
            if src is not None:
                real = src in ("ai", "reused", "kept")
            else:
                real = _looks_like_ai_description(r.get("description", ""), gh_desc[name])
            if not real:
                continue
            prev["repos"][name] = {
                "description": clean_text(r.get("description", "")),
                # A description may be older than the file it sits in, so an
                # unmarked one has an unknown date: null, not the file stamp.
                "generatedAt": r.get("descriptionGeneratedAt"),
                "model": r.get("descriptionModel") or "cbai",
            }
            n_repos += 1

        if n_phases or n_repos:
            print(f"  earlier results: {n_phases} phases, {n_repos} repo descriptions from {path}")

    return prev


# --- Stage 2: Per-repo summarization --------------------------------------

def _direct_summary(repo: dict, limit: int = 5) -> dict:
    """No model: the GitHub description, else the commit subjects, else nothing."""
    gh = (repo.get("description") or "").strip()
    if gh:
        return {"description": gh, "milestones": [], "source": "github",
                "generatedAt": None, "model": None}
    msgs = "; ".join(c["message"] for c in repo.get("meaningful_commits", [])[:limit])
    if msgs:
        return {"description": f"Commits: {msgs}", "milestones": [], "source": "commits",
                "generatedAt": None, "model": None}
    return {"description": "", "milestones": [], "source": "none",
            "generatedAt": None, "model": None}


def _sample_commits(meaningful: list[dict], n: int = 30) -> list[dict]:
    """Up to n commits spread over the repo's whole life, newest first.

    The newest 30 alone describe last week, not the repository: bradley.io
    (4,000+ commits) came back as "manages build artifacts for housecalls".
    A third newest, a third oldest, a third evenly spaced between.
    """
    if len(meaningful) <= n:
        return meaningful
    third = n // 3
    middle = meaningful[third:-third]
    step = len(middle) / (n - 2 * third)
    spread = [middle[int(i * step)] for i in range(n - 2 * third)]
    return meaningful[:third] + spread + meaningful[-third:]


def _repo_prompt(repo: dict) -> str:
    meaningful = repo["meaningful_commits"]
    sample = _sample_commits(meaningful)
    commit_text = "\n".join(f"- {c['date'][:10]}: {c['message']}" for c in sample)
    if len(sample) < len(meaningful):
        heading = (
            f"Commits (a sample of {len(sample)} spread across all {len(meaningful)}, "
            f"from {meaningful[-1]['date'][:10]} to {meaningful[0]['date'][:10]}, newest first)"
        )
    else:
        heading = "Commits (all of them, newest first)"
    return (
        "You are documenting a software repository from its commit log. "
        "Use ONLY the facts below. Do not invent features, users or technologies "
        "that the commits do not mention, and do not guess: if the purpose is "
        "not clear, describe what the commits show.\n\n"
        f"Repo: {repo['name']}\n"
        f"Language: {repo['language']}\n"
        f"GitHub description: {repo.get('description') or 'none'}\n"
        f"{heading}:\n{commit_text}\n\n"
        "Write what this repository is and does, as a whole and not only its "
        "latest work, in 2 to 3 plain sentences. "
        "Then pick 1 to 3 key milestones from the commits above: copy each date "
        "exactly from its commit and give it a short title.\n"
        'Return only JSON: {"description": "...", '
        '"milestones": [{"date": "YYYY-MM-DD", "title": "..."}]}'
    )


def _batches(cache: dict) -> list[list[dict]]:
    sorted_repos = sorted(cache["raw_repos"], key=lambda r: r.get("created_at", ""))
    return [sorted_repos[i:i + BATCH_SIZE] for i in range(0, len(sorted_repos), BATCH_SIZE)]


def _phases_needing_ai(cache: dict, previous: dict) -> int:
    if SKIP_AI:
        return 0
    if REFRESH_PHASES:
        return len(_batches(cache))
    live = {phase_sig(r["name"] for r in b) for b in _batches(cache)}
    known = set(cache.get("phase_cache", {})) | set(previous["phases"])
    return len(live - known)


def summarize_repos(cache: dict, previous: dict) -> dict:
    """Stage 2: describe each repo. Results for this run land in cache["_resolved"]."""
    repos = cache["raw_repos"]
    migrate_cache(cache)
    summaries = cache["repo_summaries"]
    last_good = cache["last_good"]
    resolved: dict = {}

    # Under --limit-ai, hold back up to half the budget (rounded up) for phase
    # names: they are the most visible output and each one covers seven repos.
    phases_waiting = _phases_needing_ai(cache, previous)
    reserve = 0
    if LIMIT_AI is not None:
        reserve = min(phases_waiting, math.ceil(LIMIT_AI / 2))
    # The same idea for the time budget: leave a quarter of it for phase names.
    share = REPO_STAGE_SHARE if phases_waiting else 1.0
    if AI_CLOCK["start"] is None:
        AI_CLOCK["start"] = time.monotonic()

    for i, repo in enumerate(repos):
        name = repo["name"]
        tag = f"[{i+1}/{len(repos)}] {name}"
        key = summary_key(repo)

        if repo.get("meaningful_count", 0) <= DIRECT_MAX_COMMITS:
            earlier = last_good.get(name)
            if earlier and earlier.get("description") and repo.get("total_commits", 0) == 0:
                # A repo that had a model summary now reports no commits at
                # all: that is a failed commit fetch, not a rewrite of
                # history. Keep the summary rather than downgrade it.
                resolved[name] = {
                    "description": earlier["description"],
                    "milestones": [],
                    "source": "kept",
                    "generatedAt": earlier.get("generatedAt"),
                    "model": earlier.get("model"),
                }
                AI["kept"] += 1
                warn(f"{name}: commit fetch returned nothing; kept the earlier summary")
                continue
            resolved[name] = _direct_summary(repo)
            log(f"  {tag}: {repo.get('meaningful_count', 0)} commits (direct)")
            continue

        cached = summaries.get(key)
        if not cached and (last_good.get(name) or {}).get("sha") == key[len(name) + 1:]:
            # Back from an absence (see MISSING_GRACE_DAYS) at the same commit.
            cached = {k: v for k, v in last_good[name].items() if k not in ("sha", "missingSince")}
            summaries[key] = cached
        if cached:
            resolved[name] = {**cached, "source": "reused"}
            AI["reused"] += 1
            log(f"  {tag}: reused")
            continue

        answer = None
        blocked = None if SKIP_AI else ai_blocked(reserve=reserve, share=share)
        if SKIP_AI:
            pass
        elif blocked:
            note_blocked(blocked, tag)
        else:
            parsed = ask_json(_repo_prompt(repo), max_tokens=500, label=f"repo:{name}",
                              require=("description",))
            if parsed is not None:
                description = clean_text(text_field(parsed, "description"))
                if len(description) < 40:
                    ai_rejected(f"repo {name}", f"description too short ({len(description)} chars)")
                elif ai_client.is_non_answer(description):
                    ai_rejected(f"repo {name}", f"non-answer {description[:60]!r}")
                else:
                    meta = ai_client.last_meta()
                    answer = {
                        "name": name,
                        "description": description,
                        "milestones": clean_repo_milestones(parsed.get("milestones"), repo),
                        "source": "ai",
                        "generatedAt": TODAY,
                        "model": meta.get("model"),
                    }
                    log(f"  {tag}: summarized by {meta.get('model')} in {meta.get('seconds')}s")

        if answer is not None:
            # Only a real answer is ever cached.
            summaries[key] = answer
            last_good[name] = {**answer, "sha": key[len(name) + 1:]}
            resolved[name] = answer
            save_cache(cache)
            continue

        # No answer this run. Never downgrade: keep the newest earlier real one.
        earlier = last_good.get(name) or previous["repos"].get(name)
        if earlier and earlier.get("description"):
            resolved[name] = {
                "description": earlier["description"],
                "milestones": earlier.get("milestones", []),
                "source": "kept",
                "generatedAt": earlier.get("generatedAt"),
                "model": earlier.get("model"),
            }
            AI["kept"] += 1
            log(f"  {tag}: kept earlier summary ({earlier.get('generatedAt') or 'date unknown'})")
        else:
            resolved[name] = _direct_summary(repo)
            AI["fallback"] += 1
            log(f"  {tag}: no model summary, using {resolved[name]['source']}")

    cache["_resolved"] = resolved
    save_cache(cache)
    log(f"Stage 2 complete: {len(resolved)} repos described")
    return cache


# --- Stage 3: Cross-repo phase synthesis ----------------------------------

def _phase_prompt(batch: list[dict], resolved: dict) -> str:
    lines = []
    for r in batch:
        s = resolved.get(r["name"], {})
        lines.append(
            f"- {r['name']} ({r['language']}, created {r['created_at'][:10]}, "
            f"{r['total_commits']} commits): {(s.get('description') or 'no description')[:200]}"
        )
        for m in s.get("milestones", [])[:2]:
            lines.append(f"    milestone {m['date']}: {m['title']}")
    owner = f"the {ORG} GitHub account"
    return (
        f"These {len(batch)} repositories were created one after another in {owner}. "
        "Together they are one phase of development. Use ONLY the facts below; do not invent.\n\n"
        + "\n".join(lines) + "\n\n"
        'Give the phase a short descriptive name (2 to 6 words, no numbering, do not use the word "Phase"), '
        "a 2 to 3 sentence narrative of what was built, one category from: "
        f"{', '.join(PHASE_CATEGORIES)}, and up to 4 milestones. Choose milestones only from "
        "the milestone lines above, keeping each date and its repo exactly; if there are no "
        "milestone lines, return an empty list.\n"
        'Return only JSON: {"name": "...", "description": "...", "category": "...", '
        '"milestones": [{"date": "YYYY-MM-DD", "title": "...", "repo": "..."}]}'
    )


def _phase_from_answer(parsed: dict, label: str) -> dict | None:
    """Validate a model answer for a phase. None (and a stderr line) when unusable."""
    name = clean_text(text_field(parsed, "name"), dash=": ")
    name = re.sub(r"^phase\s*\d*\s*[:.\-]\s*", "", name, flags=re.IGNORECASE).strip()
    description = clean_text(text_field(parsed, "description"))
    if (len(name) < 3 or len(name) > 80 or FALLBACK_NAME_RE.match(name)
            or name.lower() == "phase" or ai_client.is_non_answer(name)):
        ai_rejected(label, f"unusable name {name!r}")
        return None
    if len(description) < 40:
        ai_rejected(label, f"description too short ({len(description)} chars)")
        return None
    if ai_client.is_non_answer(description):
        ai_rejected(label, f"non-answer {description[:60]!r}")
        return None
    category = str(parsed.get("category", "")).strip().lower()
    return {
        "name": name,
        "description": description,
        "category": category if category in PHASE_CATEGORIES else "systems",
        "milestones": parsed.get("milestones", []),
    }


def _kept_candidate(names: set, cache: dict, previous: dict) -> dict | None:
    """After a failure: the closest earlier real phase for these repos.

    Accepted when the earlier phase was written for
      - a subset of this batch covering at least half of it (the batch grew), or
      - a near match: at least 5 of 7 repos shared, measured against both the
        batch and the earlier phase (a repo was renamed, deleted or
        transferred, or the listing came back one short and every batch
        shifted by one).
    The caller marks the result "kept" with generatedForRepos, so the page
    can say the name was written for a slightly different set.
    """
    floor = max(1, math.ceil(len(names) / 2))
    best = None
    candidates = list(cache.get("phase_cache", {}).values()) + list(previous["phases"].values())
    if PREFER_SEED:
        candidates = list(previous["seed_phases"].values()) + candidates
    for p in candidates:
        covered = set(p.get("repos", []))
        shared = covered & names
        if not shared:
            continue
        grew = covered <= names and len(covered) >= floor
        near = (len(shared) >= math.ceil(len(names) * NEAR_MATCH)
                and len(shared) >= math.ceil(len(covered) * NEAR_MATCH))
        if not (grew or near):
            continue
        rank = (len(shared), -len(covered ^ names), str(p.get("generatedAt") or ""))
        if best is None or rank > best[0]:
            best = (rank, p)
    return best[1] if best else None


def _prune_phase_cache(phase_cache: dict, batches: list, phases: list, cache: dict):
    """Drop cached phases that can no longer be of use, and only those.

    An entry whose repo set is not a current batch used to be deleted at
    once. With the model down, one renamed repo then cost the phase its name
    for good: the cache entry was gone and the output had been overwritten
    with "Phase N". Now a non-live entry stays while at least half of its
    repos still exist and some of them sit in a phase that has no fresh name
    of its own. The total is capped so the cache cannot grow without bound.
    """
    live = {phase_sig(r["name"] for r in b) for b in batches}
    existing = {r["name"] for r in cache["raw_repos"]}
    named = set()  # repos whose current phase has its own real, exact name
    for p in phases:
        if p.get("source") in ("ai", "reused"):
            named.update(p["repos"])
    for sig in [s for s in phase_cache if s not in live]:
        covered = set(phase_cache[sig].get("repos", []))
        still = covered & existing
        if len(still) * 2 < len(covered) or still <= named:
            del phase_cache[sig]
    spare = sorted((s for s in phase_cache if s not in live),
                   key=lambda s: str(phase_cache[s].get("generatedAt") or ""), reverse=True)
    for sig in spare[len(batches) + 10:]:
        del phase_cache[sig]
    kept_spare = sum(1 for s in phase_cache if s not in live)
    if kept_spare:
        log(f"  phase cache: {kept_spare} earlier names retained for repo sets that changed")


def synthesize_phases(cache: dict, previous: dict) -> dict:
    """Stage 3: name each chronological batch of repos as a development phase."""
    resolved = cache.get("_resolved", {})
    phase_cache = cache.setdefault("phase_cache", {})
    batches = _batches(cache)

    phases = []
    for bi, batch in enumerate(batches):
        names = [r["name"] for r in batch]
        by_name = {r["name"]: r for r in batch}
        sig = phase_sig(names)
        label = f"phase {bi+1}/{len(batches)}"
        dates = [r["created_at"][:10] for r in batch if r.get("created_at")]

        body = None
        source = None

        # 1. Same repos as an earlier real answer: reuse it, no model call.
        #    The cache and the previous output win over a seed unless
        #    --prefer-seed; an ignored seed is always reported.
        seed_hit = previous["seed_phases"].get(sig)
        if not REFRESH_PHASES:
            cached_hit = phase_cache.get(sig) or previous["phases"].get(sig)
            hit = seed_hit if (PREFER_SEED and seed_hit) else cached_hit
            if hit:
                body, source = hit, "reused"
                phase_cache[sig] = {**hit, "repos": names}
                AI["reused"] += 1
                if seed_hit and hit["name"] == seed_hit["name"]:
                    AI["seed_restored"] += hit is seed_hit
                elif seed_hit:
                    AI["seed_ignored"] += 1
                    print(f"  {label}: seed name {seed_hit['name']!r} ({seed_hit.get('generatedAt')}) "
                          f"IGNORED, the cache already has {hit['name']!r} "
                          f"({hit.get('generatedAt')}); pass --prefer-seed to restore the seed")
                if hit is seed_hit and cached_hit and cached_hit["name"] != hit["name"]:
                    print(f"  {label}: seed name {hit['name']!r} ({hit.get('generatedAt')}) "
                          f"replaces cached {cached_hit['name']!r} (--prefer-seed)")

        # 2. Ask the model.
        if body is None and not SKIP_AI:
            blocked = ai_blocked()
            if blocked:
                note_blocked(blocked, label)
            else:
                parsed = ask_json(_phase_prompt(batch, resolved), max_tokens=500,
                                  label=f"phase:{bi+1}", require=("name", "description"))
                answer = _phase_from_answer(parsed, label) if parsed is not None else None
                if answer is not None:
                    answer["milestones"] = clean_phase_milestones(
                        snap_to_repo_milestones(answer["milestones"], resolved), by_name)
                    meta = ai_client.last_meta()
                    body = {**answer, "repos": names, "generatedAt": TODAY,
                            "model": meta.get("model")}
                    source = "ai"
                    # Only a real answer is ever cached.
                    phase_cache[sig] = body
                    save_cache(cache)
                    log(f"  {label}: {body['name']} ({meta.get('model')}, {meta.get('seconds')}s)")

        # 3. No answer: never downgrade below an earlier real one.
        if body is None:
            earlier = phase_cache.get(sig) or previous["phases"].get(sig) \
                or _kept_candidate(set(names), cache, previous)
            if earlier:
                body, source = earlier, "kept"
                AI["kept"] += 1
                log(f"  {label}: kept {earlier['name']!r} from {earlier.get('generatedAt')}")

        if body is None:
            AI["fallback"] += 1
            phases.append(_make_auto_phase(batch, bi))
            continue

        phase = {
            "name": body["name"],
            # Dates are computed, never taken from the model.
            "startDate": min(dates) if dates else "",
            "endDate": max(dates) if dates else "",
            "description": body["description"],
            "repos": names,
            "milestones": clean_phase_milestones(body.get("milestones", []), by_name),
            "category": body.get("category") if body.get("category") in PHASE_CATEGORIES else "systems",
            "source": source,
            "generatedAt": body.get("generatedAt"),
            "model": body.get("model"),
        }
        if source == "kept" and set(body.get("repos", names)) != set(names):
            # Written when the phase had fewer repos; say which ones it covered.
            phase["generatedForRepos"] = list(body["repos"])
        phases.append(phase)

    _prune_phase_cache(phase_cache, batches, phases, cache)

    cache["phases"] = phases
    save_cache(cache)
    log(f"Stage 3 complete: {len(phases)} phases")
    return cache


def _make_auto_phase(batch: list, index: int) -> dict:
    """Placeholder for a phase with no model answer, now or earlier."""
    dates = [r["created_at"][:10] for r in batch if r.get("created_at")]
    return {
        "name": f"Phase {index + 1}",
        "startDate": min(dates) if dates else "",
        "endDate": max(dates) if dates else "",
        "description": f"Development of {', '.join(r['name'] for r in batch[:3])} and {len(batch)-3} more repos."
        if len(batch) > 3 else f"Development of {', '.join(r['name'] for r in batch)}.",
        "repos": [r["name"] for r in batch],
        "milestones": [],
        "category": "systems",
        "source": "fallback",
        "generatedAt": None,
        "model": None,
    }


# --- Output generation ----------------------------------------------------

def build_output(cache: dict) -> dict:
    """Build the final <org>-timeline.json from cached data."""
    repos_raw = cache.get("raw_repos", [])
    resolved = cache.get("_resolved", {})
    phases = cache.get("phases", [])

    # Guard: never overwrite a good timeline with an empty stub.
    # A 0-repo result almost always means the GitHub fetch failed
    # (rate limit / transient network / expired token), not that the
    # org genuinely has no repos. Writing the stub silently guts the
    # site, so bail loudly and leave the last-good file in place.
    if not repos_raw:
        existing_repos = 0
        if OUTPUT_FILE.exists():
            try:
                existing_repos = json.loads(OUTPUT_FILE.read_text()).get("totalRepos", 0)
            except (json.JSONDecodeError, OSError):
                existing_repos = 0
        print(
            f"\nERROR: fetched 0 repos for {ORG}, refusing to overwrite "
            f"{OUTPUT_FILE.name} (existing has {existing_repos} repos). "
            f"This usually means the GitHub fetch failed; not a real empty org.",
            file=sys.stderr,
        )
        sys.exit(1)

    # Language stats
    languages: dict[str, int] = {}
    for r in repos_raw:
        lang = r.get("language", "Unknown")
        if lang and lang != "Unknown":
            languages[lang] = languages.get(lang, 0) + 1

    # All commit dates + daily heatmap
    all_dates = []
    total_commits = 0
    daily_counts: dict[str, dict] = {}
    for r in repos_raw:
        total_commits += r.get("total_commits", 0)
        for c in r.get("commits", []):
            if c.get("date"):
                all_dates.append(c["date"])
                day_key = c["date"][:10]
                if day_key not in daily_counts:
                    daily_counts[day_key] = {"date": day_key, "commits": 0, "repos": set()}
                daily_counts[day_key]["commits"] += 1
                daily_counts[day_key]["repos"].add(r["name"])

    all_dates.sort()

    # Build heatmap with intensity levels (0-4)
    max_commits = max((d["commits"] for d in daily_counts.values()), default=1)
    heatmap = []
    for day_key in sorted(daily_counts.keys()):
        d = daily_counts[day_key]
        ratio = d["commits"] / max_commits
        if ratio == 0:
            intensity = 0
        elif ratio < 0.15:
            intensity = 1
        elif ratio < 0.35:
            intensity = 2
        elif ratio < 0.6:
            intensity = 3
        else:
            intensity = 4
        heatmap.append({
            "date": d["date"],
            "commits": d["commits"],
            "repos": len(d["repos"]),
            "intensity": intensity,
        })

    # Build repo list
    repo_list = []
    description_sources: dict[str, int] = {}
    for r in repos_raw:
        summary = resolved.get(r["name"]) or _direct_summary(r)
        commits = r.get("commits", [])
        commit_dates = sorted([c["date"] for c in commits if c.get("date")])

        # Find which phase this repo belongs to
        phase_name = ""
        for p in phases:
            if r["name"] in p.get("repos", []):
                phase_name = p.get("name", "")
                break

        src = summary.get("source", "none")
        description_sources[src] = description_sources.get(src, 0) + 1
        repo_list.append({
            "name": r["name"],
            "description": summary.get("description", ""),
            "language": r.get("language", "Unknown"),
            "commits": r.get("total_commits", 0),
            "firstCommit": commit_dates[0] if commit_dates else r.get("created_at", ""),
            "lastCommit": commit_dates[-1] if commit_dates else r.get("pushed_at", ""),
            "phase": phase_name,
            # Where the description came from: "ai" (model, this run), "reused"
            # (model, earlier run, repo unchanged), "kept" (model, earlier run,
            # after a failed or skipped call), "github" (the repo's own
            # description), "commits" (commit subjects), "none" (empty).
            "descriptionSource": src,
            "descriptionGeneratedAt": summary.get("generatedAt"),
            "descriptionModel": summary.get("model"),
        })

    phase_sources: dict[str, int] = {}
    for p in phases:
        phase_sources[p.get("source", "fallback")] = phase_sources.get(p.get("source", "fallback"), 0) + 1

    output = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "org": ORG,
        "totalRepos": len(repos_raw),
        "firstCommit": all_dates[0] if all_dates else "",
        "latestCommit": all_dates[-1] if all_dates else "",
        "totalCommits": total_commits,
        "languages": dict(sorted(languages.items(), key=lambda x: -x[1])),
        "activityHeatmap": heatmap,
        "phases": phases,
        "repos": sorted(repo_list, key=lambda r: r.get("firstCommit", "")),
        # What the model did in the run that wrote this file, so a page can
        # say how much of the prose is fresh, old, or missing.
        "aiSummary": {
            "callsOk": AI["ok"],
            "callsFailed": AI["failed"],
            "reused": AI["reused"],
            "kept": AI["kept"],
            "skippedByLimit": AI["skipped"],
            "skippedByBudget": AI["skipped_budget"],
            "skippedBackendsDown": AI["skipped_down"],
            "withoutModelText": AI["fallback"],
            "phaseSources": phase_sources,
            "descriptionSources": description_sources,
            "limitAi": LIMIT_AI,
            "budgetMin": AI_BUDGET_MIN or None,
            "skipAi": SKIP_AI,
        },
    }

    _write_json_atomic(OUTPUT_FILE, output)
    print(f"\nOutput written to {OUTPUT_FILE}")
    print(f"  Repos: {output['totalRepos']}")
    print(f"  Commits: {output['totalCommits']}")
    print(f"  Phases: {len(output['phases'])}")
    print(f"  Languages: {len(output['languages'])}")
    for i, p in enumerate(phases):
        stamp = f"{p.get('source')} {p.get('generatedAt') or ''}".strip()
        print(f"  phase {i+1:2d} [{stamp}] {p['name']} ({len(p.get('milestones', []))} milestones)")

    return output


# --- Main -----------------------------------------------------------------

def main():
    started = time.monotonic()
    print(f"{ORG} Timeline Pipeline -> {OUTPUT_FILE}")
    print(f"{'=' * 40}")

    acquire_lock()
    cache = load_cache()

    # Stage 1
    print("\nStage 1: Fetching repos + commits...")
    cache = fetch_all_data(cache)

    previous = load_previous(cache) if cache.get("raw_repos") else \
        {"phases": {}, "repos": {}, "seed_phases": {}}

    # Stage 2
    print("\nStage 2: Per-repo summarization...")
    cache = summarize_repos(cache, previous) if cache.get("raw_repos") else cache

    # Stage 3
    print("\nStage 3: Cross-repo phase synthesis...")
    cache = synthesize_phases(cache, previous) if cache.get("raw_repos") else cache

    # Build output
    print("\nBuilding output...")
    build_output(cache)

    calls = ai_calls_made()
    not_attempted = AI["skipped"] + AI["skipped_budget"] + AI["skipped_down"]
    print(
        f"\nAI summary [{ORG}]: {calls} model calls, {AI['ok']} succeeded, {AI['failed']} failed; "
        f"{AI['reused']} reused, {AI['kept']} kept from an earlier run, "
        f"{not_attempted} not attempted (--limit-ai {AI['skipped']}, time budget "
        f"{AI['skipped_budget']}, no backend left {AI['skipped_down']}), "
        f"{AI['fallback']} left without model text. "
        f"{time.monotonic() - started:.0f}s total."
    )
    if SEED_FILES:
        print(f"  seed: {AI['seed_restored']} phase names restored from the seed, "
              f"{AI['seed_ignored']} seed names ignored because the cache already had one"
              + (" (pass --prefer-seed to restore them)" if AI["seed_ignored"] else ""))
    if calls:
        print(f"  {ai_client.summary_line()}")
    if calls and AI["ok"] == 0:
        warn(f"WARNING: all {calls} model calls failed; nothing new was generated this run")
    if AI["skipped_budget"] or AI["skipped_down"]:
        warn(f"WARNING: {AI['skipped_budget'] + AI['skipped_down']} items were not sent to the "
             "model (time budget or no backend); they keep earlier values and are retried next run")

    print("\nDone!")


if __name__ == "__main__":
    main()
