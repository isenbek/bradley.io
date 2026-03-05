#!/usr/bin/env python3
"""
Nominate-AI Platform Timeline Pipeline

Standalone script (not part of nightly pipeline — too heavy to run daily).
Fetches all repos + commits from the Nominate-AI GitHub org,
summarizes per-repo via CBAI, then synthesizes cross-repo phases.

Usage:
  python3 scripts/nominate-timeline-pipeline.py [--verbose] [--skip-ai] [--skip-cache]
"""

import json
import os
import re
import subprocess
import sys
import time
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# ─── Config ──────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
CACHE_FILE = PROJECT_ROOT / ".nominate-timeline-cache.json"
OUTPUT_FILE = PROJECT_ROOT / "public" / "data" / "nominate-timeline.json"
ORG = "Nominate-AI"

CBAI_URL = os.environ.get("CBAI_URL", "https://ai.nominate.ai")
CBAI_PROVIDER = os.environ.get("CBAI_PROVIDER", "ollama")

VERBOSE = "--verbose" in sys.argv
SKIP_AI = "--skip-ai" in sys.argv
SKIP_CACHE = "--skip-cache" in sys.argv

NOISE_PREFIXES = (
    "bump:", "deploy:", "nightly:", "merge ", "chore: bump",
    "chore: deploy", "chore: nightly", "initial commit",
)


def log(msg: str):
    if VERBOSE:
        print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}")


def load_cache() -> dict:
    if not SKIP_CACHE and CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    return {}


def save_cache(cache: dict):
    CACHE_FILE.write_text(json.dumps(cache, indent=2))


def call_cbai(prompt: str, max_tokens: int = 1000, timeout: int = 60) -> str:
    """Send a prompt to CBAI and return the text content."""
    payload = json.dumps({
        "messages": [{"role": "user", "content": prompt}],
        "provider": CBAI_PROVIDER,
        "max_tokens": max_tokens,
    }).encode()
    req = urllib.request.Request(
        f"{CBAI_URL}/api/v1/chat",
        data=payload,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        result = json.loads(resp.read())
        return result.get("content", "")


# ─── Stage 1: Fetch all repos + commits ─────────────────────────────

def fetch_all_repos() -> list[dict]:
    """Fetch all repos from the Nominate-AI org via gh CLI."""
    log(f"Fetching repos for {ORG}...")
    repos = []
    page = 1

    while True:
        result = subprocess.run(
            ["gh", "api", f"/orgs/{ORG}/repos?per_page=100&page={page}",
             "-q", '.[] | "\(.name)\t\(.language // "Unknown")\t\(.created_at)\t\(.pushed_at)\t\(.description // "")"'],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode != 0 or not result.stdout.strip():
            break

        for line in result.stdout.strip().splitlines():
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

        if len(result.stdout.strip().splitlines()) < 100:
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
                 "-q", '.[] | "\(.commit.message | split("\\n") | .[0])\t\(.commit.author.date)\t\(.sha[:7])\t\(.commit.author.name)"'],
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
        if age_hours < 24:
            log("Using cached raw data (< 24h old)")
            return cache

    repos = fetch_all_repos()
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


# ─── Stage 2: Per-repo summarization ────────────────────────────────

def summarize_repos(cache: dict) -> dict:
    """Stage 2: AI-summarize each repo's purpose and milestones."""
    repos = cache["raw_repos"]
    summaries = cache.get("repo_summaries", {})

    for i, repo in enumerate(repos):
        name = repo["name"]
        latest_sha = repo["commits"][0]["sha"] if repo["commits"] else "none"
        cache_key = f"{name}_{latest_sha}"

        if cache_key in summaries:
            log(f"  [{i+1}/{len(repos)}] {name}: cached")
            continue

        meaningful = repo["meaningful_commits"]

        if len(meaningful) <= 5:
            # Use commit messages directly
            msg_list = "; ".join(c["message"] for c in meaningful[:5])
            summaries[cache_key] = {
                "name": name,
                "description": repo.get("description", "") or f"Commits: {msg_list}",
                "milestones": [],
            }
            log(f"  [{i+1}/{len(repos)}] {name}: {len(meaningful)} commits (direct)")
            continue

        if SKIP_AI:
            msg_list = "; ".join(c["message"] for c in meaningful[:10])
            summaries[cache_key] = {
                "name": name,
                "description": repo.get("description", "") or f"Key commits: {msg_list}",
                "milestones": [],
            }
            continue

        # AI summarization
        commit_text = "\n".join(
            f"- {c['date'][:10]}: {c['message']}"
            for c in meaningful[:30]
        )
        prompt = (
            f"Summarize this GitHub repository in 2-3 sentences. "
            f"Repo: {name}\n"
            f"Language: {repo['language']}\n"
            f"Description: {repo.get('description', 'none')}\n"
            f"Recent commits (newest first):\n{commit_text}\n\n"
            f"Also identify 1-3 key milestones (date + short title).\n"
            f'Return JSON: {{"description": "...", "milestones": [{{"date": "YYYY-MM-DD", "title": "..."}}]}}'
        )

        try:
            content = call_cbai(prompt, max_tokens=500)
            match = re.search(r'\{[\s\S]*\}', content)
            if match:
                parsed = json.loads(match.group())
                summaries[cache_key] = {
                    "name": name,
                    "description": parsed.get("description", repo.get("description", "")),
                    "milestones": parsed.get("milestones", []),
                }
                log(f"  [{i+1}/{len(repos)}] {name}: AI summarized")
            else:
                summaries[cache_key] = {
                    "name": name,
                    "description": repo.get("description", ""),
                    "milestones": [],
                }
                log(f"  [{i+1}/{len(repos)}] {name}: AI response unparseable")
        except Exception as e:
            log(f"  [{i+1}/{len(repos)}] {name}: AI failed ({e})")
            summaries[cache_key] = {
                "name": name,
                "description": repo.get("description", ""),
                "milestones": [],
            }

        time.sleep(2)  # Rate limit

    cache["repo_summaries"] = summaries
    save_cache(cache)
    log(f"Stage 2 complete: {len(summaries)} repo summaries")
    return cache


# ─── Stage 3: Cross-repo phase synthesis ─────────────────────────────

def synthesize_phases(cache: dict) -> dict:
    """Stage 3: Group repos into development phases via AI."""
    repos = cache["raw_repos"]
    summaries = cache.get("repo_summaries", {})

    # Sort repos by creation date
    sorted_repos = sorted(repos, key=lambda r: r.get("created_at", ""))

    # Build repo summary lookup (match by name prefix)
    def get_summary(name: str) -> dict:
        for key, val in summaries.items():
            if key.startswith(f"{name}_"):
                return val
        return {"name": name, "description": "", "milestones": []}

    if SKIP_AI:
        # Auto-generate phases based on time quarters
        return _auto_phases(sorted_repos, get_summary, cache)

    # Batch repos chronologically (6-8 per batch)
    batch_size = 7
    batches = []
    for i in range(0, len(sorted_repos), batch_size):
        batches.append(sorted_repos[i:i + batch_size])

    phases = []
    for bi, batch in enumerate(batches):
        repo_descriptions = "\n".join(
            f"- {r['name']} ({r['language']}, created {r['created_at'][:10]}, "
            f"{r['total_commits']} commits): {get_summary(r['name'])['description'][:150]}"
            for r in batch
        )

        prompt = (
            f"These {len(batch)} repos were created in chronological order as part of the "
            f"Nominate-AI platform. What development phase do they represent?\n\n"
            f"{repo_descriptions}\n\n"
            f"Give the phase a descriptive name, the date range it covers, "
            f"a 2-3 sentence narrative of what was built, and categorize it as one of: "
            f"systems, ai-ml, data, hardware, creative.\n\n"
            f'Return JSON: {{"name": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", '
            f'"description": "...", "category": "...", '
            f'"milestones": [{{"date": "YYYY-MM-DD", "title": "...", "repo": "..."}}]}}'
        )

        try:
            content = call_cbai(prompt, max_tokens=800)
            match = re.search(r'\{[\s\S]*\}', content)
            if match:
                phase = json.loads(match.group())
                phase["repos"] = [r["name"] for r in batch]
                phase.setdefault("milestones", [])
                phase.setdefault("category", "systems")
                phases.append(phase)
                log(f"  Phase {bi+1}/{len(batches)}: {phase.get('name', '?')}")
            else:
                log(f"  Phase {bi+1}: AI response unparseable, using auto")
                phases.append(_make_auto_phase(batch, bi, get_summary))
        except Exception as e:
            log(f"  Phase {bi+1}: AI failed ({e}), using auto")
            phases.append(_make_auto_phase(batch, bi, get_summary))

        time.sleep(3)

    cache["phases"] = phases
    save_cache(cache)
    log(f"Stage 3 complete: {len(phases)} phases")
    return cache


def _make_auto_phase(batch: list, index: int, get_summary) -> dict:
    """Fallback: create a phase from a batch without AI."""
    dates = [r["created_at"][:10] for r in batch if r.get("created_at")]
    return {
        "name": f"Phase {index + 1}",
        "startDate": min(dates) if dates else "2025-04-01",
        "endDate": max(dates) if dates else "2025-06-30",
        "description": f"Development of {', '.join(r['name'] for r in batch[:3])} and {len(batch)-3} more repos."
        if len(batch) > 3 else f"Development of {', '.join(r['name'] for r in batch)}.",
        "repos": [r["name"] for r in batch],
        "milestones": [],
        "category": "systems",
    }


def _auto_phases(sorted_repos: list, get_summary, cache: dict) -> dict:
    """Generate phases purely from temporal grouping (no AI)."""
    from collections import defaultdict

    quarters = defaultdict(list)
    for r in sorted_repos:
        d = r.get("created_at", "2025-04-01")[:10]
        year = d[:4]
        month = int(d[5:7])
        q = (month - 1) // 3
        quarter_key = f"{year}-Q{q+1}"
        quarters[quarter_key].append(r)

    phases = []
    category_cycle = ["systems", "ai-ml", "data", "creative", "systems"]
    for i, (qkey, repos) in enumerate(sorted(quarters.items())):
        dates = [r["created_at"][:10] for r in repos if r.get("created_at")]
        phases.append({
            "name": f"{qkey}: {len(repos)} repos",
            "startDate": min(dates) if dates else "2025-04-01",
            "endDate": max(dates) if dates else "2025-06-30",
            "description": f"Repos created: {', '.join(r['name'] for r in repos[:5])}"
            + (f" and {len(repos)-5} more" if len(repos) > 5 else ""),
            "repos": [r["name"] for r in repos],
            "milestones": [],
            "category": category_cycle[i % len(category_cycle)],
        })

    cache["phases"] = phases
    save_cache(cache)
    log(f"Stage 3 (auto): {len(phases)} phases from quarters")
    return cache


# ─── Output generation ───────────────────────────────────────────────

def build_output(cache: dict) -> dict:
    """Build the final nominate-timeline.json from cached data."""
    repos_raw = cache.get("raw_repos", [])
    summaries = cache.get("repo_summaries", {})
    phases = cache.get("phases", [])

    def get_summary(name: str) -> dict:
        for key, val in summaries.items():
            if key.startswith(f"{name}_"):
                return val
        return {"name": name, "description": "", "milestones": []}

    # Language stats
    languages: dict[str, int] = {}
    for r in repos_raw:
        lang = r.get("language", "Unknown")
        if lang and lang != "Unknown":
            languages[lang] = languages.get(lang, 0) + 1

    # All commit dates
    all_dates = []
    total_commits = 0
    for r in repos_raw:
        total_commits += r.get("total_commits", 0)
        for c in r.get("commits", []):
            if c.get("date"):
                all_dates.append(c["date"])

    all_dates.sort()

    # Build repo list
    repo_list = []
    for r in repos_raw:
        summary = get_summary(r["name"])
        commits = r.get("commits", [])
        commit_dates = sorted([c["date"] for c in commits if c.get("date")])

        # Find which phase this repo belongs to
        phase_name = ""
        for p in phases:
            if r["name"] in p.get("repos", []):
                phase_name = p.get("name", "")
                break

        repo_list.append({
            "name": r["name"],
            "description": summary.get("description", r.get("description", "")),
            "language": r.get("language", "Unknown"),
            "commits": r.get("total_commits", 0),
            "firstCommit": commit_dates[0] if commit_dates else r.get("created_at", ""),
            "lastCommit": commit_dates[-1] if commit_dates else r.get("pushed_at", ""),
            "phase": phase_name,
        })

    output = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "org": ORG,
        "totalRepos": len(repos_raw),
        "firstCommit": all_dates[0] if all_dates else "",
        "latestCommit": all_dates[-1] if all_dates else "",
        "totalCommits": total_commits,
        "languages": dict(sorted(languages.items(), key=lambda x: -x[1])),
        "phases": phases,
        "repos": sorted(repo_list, key=lambda r: r.get("firstCommit", "")),
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(output, indent=2))
    print(f"\nOutput written to {OUTPUT_FILE}")
    print(f"  Repos: {output['totalRepos']}")
    print(f"  Commits: {output['totalCommits']}")
    print(f"  Phases: {len(output['phases'])}")
    print(f"  Languages: {len(output['languages'])}")

    return output


# ─── Main ─────────────────────────────────────────────────────────────

def main():
    print(f"Nominate-AI Timeline Pipeline")
    print(f"{'=' * 40}")

    cache = load_cache()

    # Stage 1
    print("\nStage 1: Fetching repos + commits...")
    cache = fetch_all_data(cache)

    # Stage 2
    print("\nStage 2: Per-repo summarization...")
    cache = summarize_repos(cache)

    # Stage 3
    print("\nStage 3: Cross-repo phase synthesis...")
    cache = synthesize_phases(cache)

    # Build output
    print("\nBuilding output...")
    build_output(cache)

    print("\nDone!")


if __name__ == "__main__":
    main()
