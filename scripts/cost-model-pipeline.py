#!/usr/bin/env python3
"""
Cost Model Pipeline: Campaign Brain (cb*) projects, one FIXED window.

Generates public/data/cost-model.json from ai-pilot-data.json and
nominate-ai-timeline.json. Standard library only.

THE PUBLISHED FILE IS FROZEN (2026-10-02). The model is a dated case study of
2025-12-01 to 2026-03-26. Its inputs no longer cover that window: the pilot
heatmap is a rolling recent window and the durable Claude activity database
starts 2026-03-08. Left on the 4-hourly cron, this script decayed the output
to activeDays 1 and a 1710x velocity multiplier. So:

  * It is no longer called from scripts/refresh-4h.sh.
  * It refuses to overwrite an output file that carries a top-level "frozen"
    object unless run with --unfreeze (exit 3).
  * Any run refuses to write when the result fails a sanity check (exit 4):
    a source that was generated before the window's last day had ended, too
    few active days in the window, or an implausible velocity multiplier.
  * --out PATH writes somewhere other than public/data/cost-model.json.

Why the "source generated before the window closed" check exists: the run that
was frozen (2026-03-26 23:05 local) read a commit timeline whose latest commit
was 2026-03-26T05:00:02Z and a pilot record generated 2026-03-26 20:01 local.
Its in-window commit count was 5,315; the first timeline generated after the
window closed (2026-04-03) counts 5,411 for the same days and the same 88
repositories. The frozen file carries the corrected count and says so in
"frozen.corrections".

Known limits of what the numbers cover (see "frozen.notes" in the JSON):
  * activeDays counts days with a recorded Claude Code session, not days worked.
  * actual.commits is the full-history commit count of the cb* repos that were
    active in the window, not commits inside the window. It runs to whenever
    the timeline was generated, so it includes commits made after the window.
  * timeSeries commits are org-wide, not cb* only. Commit days are UTC days
    (GitHub author dates).
  * A count of a closed window still depends on when it is taken: a repository
    whose history is rewritten later (cbos was, between 2026-04-24 and
    2026-05-08) changes the count for days long past.
"""

import argparse
import json
import subprocess
import sys
from collections import defaultdict
from datetime import datetime, date, timedelta
from pathlib import Path

# ---------- paths ----------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent
PUBLIC_DATA = ROOT / "public" / "data"

AI_PILOT_PATH = PUBLIC_DATA / "ai-pilot-data.json"
SITE_DATA_PATH = PUBLIC_DATA / "site-data.json"
TIMELINE_PATH = PUBLIC_DATA / "nominate-ai-timeline.json"
STATS_CACHE_PATH = Path.home() / ".claude" / "stats-cache.json"
OUTPUT_PATH = PUBLIC_DATA / "cost-model.json"

# ---------- scope ----------------------------------------------------------
SCOPE_START = date(2025, 12, 1)
SCOPE_END = date(2026, 3, 26)
CB_PREFIX = "cb"

# ---------- sanity floor ---------------------------------------------------
# The last correct run (2026-03-26) recorded 34 active days in this window. A
# fixed past window cannot lose active days, so fewer than that means the
# source heatmap no longer covers the window and every figure built on it is
# wrong. If SCOPE_START / SCOPE_END ever change, set this floor for the new
# window deliberately.
MIN_ACTIVE_DAYS = 34
# 1,710 modelled person-days over 34 active days is 50.3x. Anything far past
# that is a symptom of a collapsed active-day count, not a finding.
MAX_PLAUSIBLE_VELOCITY = 100.0

EXIT_FROZEN = 3
EXIT_INSANE = 4

# ---------- arguments ------------------------------------------------------

_parser = argparse.ArgumentParser(
    description="Regenerate the cost model for the fixed window "
    f"{SCOPE_START} to {SCOPE_END}. The published file is frozen; see the module docstring."
)
_parser.add_argument(
    "--out",
    type=Path,
    default=OUTPUT_PATH,
    help="where to write the JSON (default: public/data/cost-model.json)",
)
_parser.add_argument(
    "--unfreeze",
    action="store_true",
    help="allow overwriting an output file that carries a top-level 'frozen' object",
)
ARGS = _parser.parse_args()
OUTPUT_PATH = ARGS.out


def refuse(code: int, message: str) -> None:
    """Print why nothing was written and exit non-zero."""
    print(f"cost-model-pipeline: REFUSING TO WRITE {OUTPUT_PATH}", file=sys.stderr)
    print(f"  {message}", file=sys.stderr)
    sys.exit(code)


def check_not_frozen() -> None:
    """Stop before doing any work if the target file is a frozen case study."""
    if ARGS.unfreeze or not OUTPUT_PATH.exists():
        return
    try:
        with open(OUTPUT_PATH) as f:
            existing = json.load(f)
    except (OSError, ValueError) as exc:
        refuse(
            EXIT_FROZEN,
            f"the existing file could not be read ({exc}), so it cannot be shown to be "
            "unfrozen. Pass --unfreeze to overwrite it anyway.",
        )
    frozen = existing.get("frozen") if isinstance(existing, dict) else None
    if frozen:
        window = frozen.get("window", {}) if isinstance(frozen, dict) else {}
        as_of = frozen.get("asOf", "an unrecorded date") if isinstance(frozen, dict) else "an unrecorded date"
        refuse(
            EXIT_FROZEN,
            f"it is a frozen case study (window {window.get('start', '?')} to "
            f"{window.get('end', '?')}, as of {as_of}). Pass --unfreeze to overwrite it, "
            "or --out PATH to write somewhere else.",
        )


check_not_frozen()

# ---------- helpers --------------------------------------------------------

def load_json(path: Path) -> dict:
    with open(path) as f:
        return json.load(f)


def is_cb_repo(name: str) -> bool:
    """Return True if repo name starts with cb (case-insensitive)."""
    lower = name.lower()
    return lower.startswith(CB_PREFIX)


def date_in_scope(d: str) -> bool:
    """Check if an ISO date string falls within the scope window."""
    try:
        parsed = date.fromisoformat(d[:10])
        return SCOPE_START <= parsed <= SCOPE_END
    except (ValueError, TypeError):
        return False


# ---------- load data ------------------------------------------------------

ai_pilot = load_json(AI_PILOT_PATH)
timeline = load_json(TIMELINE_PATH)

# Optional: stats-cache (not required)
stats_cache = None
if STATS_CACHE_PATH.exists():
    try:
        stats_cache = load_json(STATS_CACHE_PATH)
    except Exception:
        pass

# When each source was generated. A source generated on or before the window's
# last day cannot hold that whole day, so the run is refused in the sanity
# guard below. The timeline stamp is UTC and its commit days are UTC days; the
# pilot stamp is local time with no zone.
timeline_generated = str(timeline.get("generated") or "")
timeline_latest_commit = str(timeline.get("latestCommit") or "")
pilot_generated = str(ai_pilot.get("generated") or "")

# ---------- 1. cb* projects from mission log ------------------------------

mission_log = ai_pilot.get("missionLog", [])
cb_projects = [p for p in mission_log if is_cb_repo(p["name"])]

total_cb_sessions = sum(p["sessions"] for p in cb_projects)
total_cb_messages = sum(p["messages"] for p in cb_projects)

top_projects = sorted(cb_projects, key=lambda p: p["messages"], reverse=True)
top_projects_out = [
    {"name": p["name"], "sessions": p["sessions"], "messages": p["messages"]}
    for p in top_projects
]

# ---------- 2. cb* repos from timeline -----------------------------------

all_repos = timeline.get("repos", [])
cb_repos = [r for r in all_repos if is_cb_repo(r["name"])]

# Filter to repos with activity in scope (lastCommit >= SCOPE_START)
cb_repos_in_scope = []
for repo in cb_repos:
    last = repo.get("lastCommit", "")
    first = repo.get("firstCommit", "")
    # Active in the window: a commit on or after its first day, and a first
    # commit on or before its last. Without the second test a timeline read
    # after the window closed counts repositories created later.
    if (
        last
        and date.fromisoformat(last[:10]) >= SCOPE_START
        and (not first or date.fromisoformat(first[:10]) <= SCOPE_END)
    ):
        cb_repos_in_scope.append(repo)

total_cb_commits = sum(r["commits"] for r in cb_repos_in_scope)
total_cb_repo_count = len(cb_repos_in_scope)

# ---------- 3. Active days from ai-pilot heatmap -------------------------
# Use the ai-pilot heatmap (actual Claude Code working days) for active days.
# The org-wide timeline heatmap covers all repos; the pilot heatmap is more
# representative of the single-operator's actual working cadence.

pilot_heatmap = ai_pilot.get("activityHeatmap", [])
active_dates_in_scope = set()
for entry in pilot_heatmap:
    d = entry.get("date", "")
    if date_in_scope(d):
        active_dates_in_scope.add(d)

active_days = len(active_dates_in_scope)
# Inclusive calendar days in the window (116 for Dec 1 to Mar 26).
total_days = (SCOPE_END - SCOPE_START).days + 1

# ---------- 4. Tool calls from ai-pilot heatmap --------------------------

total_tool_calls = sum(
    entry.get("toolCalls", 0)
    for entry in pilot_heatmap
    if date_in_scope(entry.get("date", ""))
)

# ---------- 5. Domains and skills -----------------------------------------

instrument_ratings = ai_pilot.get("instrumentRatings", {})
domains = [
    {"name": domain, "score": info["score"]}
    for domain, info in sorted(
        instrument_ratings.items(),
        key=lambda x: x[1]["score"],
        reverse=True,
    )
]

skills_cloud = ai_pilot.get("skillsCloud", [])
skills = [
    {"name": s["name"], "count": s["count"]}
    for s in sorted(skills_cloud, key=lambda s: s["count"], reverse=True)
]

# ---------- 6. License totals (all sessions, for context) -----------------

license_data = ai_pilot.get("license", {})
total_sessions = license_data.get("totalSessions", 0)
total_messages = license_data.get("totalMessages", 0)

# ---------- 7. Legacy cost model ------------------------------------------

legacy_roles = [
    {"title": "Full-Stack Developer", "count": 2, "annualSalary": 120000, "loadedCost": 168000},
    {"title": "Data Engineer", "count": 2, "annualSalary": 135000, "loadedCost": 189000},
    {"title": "DevOps Engineer", "count": 1, "annualSalary": 140000, "loadedCost": 196000},
    {"title": "Frontend Developer", "count": 1, "annualSalary": 115000, "loadedCost": 161000},
    {"title": "ML/AI Engineer", "count": 1, "annualSalary": 155000, "loadedCost": 217000},
    {"title": "QA Engineer", "count": 1, "annualSalary": 95000, "loadedCost": 133000},
    {"title": "Project Manager", "count": 1, "annualSalary": 145000, "loadedCost": 203000},
    {"title": "Biz/Workflow SME + UI Builder", "count": 1, "annualSalary": 130000, "loadedCost": 182000, "halfTime": True},
]

# Half-time roles count as 0.5 headcount
legacy_team_size = sum(0.5 if r.get("halfTime") else r["count"] for r in legacy_roles)
est_months_low = 6
est_months_high = 12
# Person-months: full headcount (half-time roles contribute half)
effective_headcount = sum(0.5 if r.get("halfTime") else r["count"] for r in legacy_roles)
person_months_low = effective_headcount * est_months_low
person_months_high = effective_headcount * est_months_high

# Cost per person-month: blended compensation rate
cost_per_person_month = 15000

overhead_multiplier = 1.4
# totalCost = person-months * costPerPersonMonth (overhead already baked
# into loaded salary figures; multiplier listed for reference)
total_legacy_low = person_months_low * cost_per_person_month
total_legacy_high = person_months_high * cost_per_person_month
legacy_midpoint = (total_legacy_low + total_legacy_high) / 2

# ---------- 8. Actual costs -----------------------------------------------

months_elapsed = max(1, round(total_days / 30))
actual_operator_cost = 15000 * months_elapsed     # Operator compensation ($15K/mo)
actual_ai_cost = 200 * months_elapsed              # Claude Max plan ($200/mo)
actual_total_cost = actual_operator_cost + actual_ai_cost

# ---------- 9. Comparison metrics ------------------------------------------

# Cost savings: 1 - (actual / legacy midpoint)
cost_savings_pct = round((1 - actual_total_cost / legacy_midpoint) * 100, 1)

# Velocity multiplier: (legacy person-months midpoint * 20 workdays) / actual active days
legacy_pm_midpoint = (person_months_low + person_months_high) / 2
velocity_multiplier = round((legacy_pm_midpoint * 20) / active_days, 1) if active_days > 0 else 0

# Time compression
legacy_months_midpoint = (est_months_low + est_months_high) / 2
time_compression = f"{legacy_months_midpoint:.0f} months -> {active_days} days"

# ---------- 9b. Sanity guard ----------------------------------------------
# Runs before the slow GitHub calls and long before anything is written.

_heatmap_dates = sorted(e.get("date", "") for e in pilot_heatmap if e.get("date"))
_heatmap_range = (
    f"{_heatmap_dates[0]} to {_heatmap_dates[-1]}" if _heatmap_dates else "empty"
)
for _label, _stamp in (
    ("commit timeline (nominate-ai-timeline.json)", timeline_generated),
    ("pilot record (ai-pilot-data.json)", pilot_generated),
):
    if _stamp[:10] <= SCOPE_END.isoformat():
        refuse(
            EXIT_INSANE,
            f"sanity check failed: the {_label} was generated "
            f"{_stamp or 'at an unrecorded time'}, which is not after the window's last day "
            f"({SCOPE_END}). It cannot hold that whole day, so counts for the window would "
            "come out short. Nothing was written.",
        )
if active_days < MIN_ACTIVE_DAYS:
    refuse(
        EXIT_INSANE,
        f"sanity check failed: {active_days} active days in {SCOPE_START} to {SCOPE_END}, "
        f"below the floor of {MIN_ACTIVE_DAYS}. The source heatmap covers {_heatmap_range} "
        f"({len(_heatmap_dates)} days), so it no longer holds this window. "
        "Nothing was written.",
    )
if not (0 < velocity_multiplier <= MAX_PLAUSIBLE_VELOCITY):
    refuse(
        EXIT_INSANE,
        f"sanity check failed: velocity multiplier {velocity_multiplier}x is outside "
        f"(0, {MAX_PLAUSIBLE_VELOCITY}]. Nothing was written.",
    )

# ---------- 10. Time-series curves (weekly buckets) -----------------------

# Generate week labels for the full scope
def iso_week(d: date) -> str:
    return f"{d.isocalendar()[0]}-W{d.isocalendar()[1]:02d}"

def week_start_date(iso: str) -> str:
    """Return Monday date for an ISO week string like '2026-W05'."""
    year, week = iso.split("-W")
    d = date.fromisocalendar(int(year), int(week), 1)
    return d.isoformat()

# Collect all weeks in scope
scope_weeks = []
d = SCOPE_START
while d <= SCOPE_END:
    wk = iso_week(d)
    if not scope_weeks or scope_weeks[-1] != wk:
        scope_weeks.append(wk)
    d += timedelta(days=1)

# --- Commit curve from activityHeatmap ---
commit_heatmap = timeline.get("activityHeatmap", [])
commits_by_week = defaultdict(int)
for entry in commit_heatmap:
    ed = entry.get("date", "")
    if ed >= SCOPE_START.isoformat() and ed <= SCOPE_END.isoformat():
        c = entry.get("commits", 0)
        if c > 0:
            wk = iso_week(date.fromisoformat(ed))
            commits_by_week[wk] += c

# --- Claude session curve from ai-pilot heatmap ---
claude_by_week = defaultdict(lambda: {"messages": 0, "sessions": 0, "toolCalls": 0})
for entry in pilot_heatmap:
    ed = entry.get("date", "")
    if date_in_scope(ed):
        wk = iso_week(date.fromisoformat(ed))
        claude_by_week[wk]["messages"] += entry.get("count", 0)
        claude_by_week[wk]["sessions"] += entry.get("sessions", 0)
        claude_by_week[wk]["toolCalls"] += entry.get("toolCalls", 0)

# --- GitHub Issues (pull live from gh CLI) ---
issues_by_week = defaultdict(lambda: {"opened": 0, "closed": 0})
total_issues = {"opened": 0, "closed": 0, "bugs": 0, "features": 0, "other": 0}

try:
    # Get all cb* repos
    cb_repo_names = [r["name"] for r in cb_repos_in_scope]  # all cb* repos

    for repo_name in cb_repo_names:
        try:
            result = subprocess.run(
                ["gh", "issue", "list", "-R", f"nominate-ai/{repo_name}",
                 "--state", "all", "--limit", "500",
                 "--json", "number,state,labels,createdAt,closedAt"],
                capture_output=True, text=True, timeout=15,
            )
            if result.returncode != 0:
                continue
            issues = json.loads(result.stdout)
            for issue in issues:
                created = issue.get("createdAt", "")[:10]
                closed = issue.get("closedAt")
                labels = [l.get("name", "").lower() for l in issue.get("labels", [])]

                if date_in_scope(created):
                    total_issues["opened"] += 1
                    wk = iso_week(date.fromisoformat(created))
                    issues_by_week[wk]["opened"] += 1

                    # Categorize
                    if any("bug" in l for l in labels):
                        total_issues["bugs"] += 1
                    elif any(l in ("feature", "enhancement") for l in labels):
                        total_issues["features"] += 1
                    else:
                        total_issues["other"] += 1

                if closed and date_in_scope(closed):
                    total_issues["closed"] += 1
                    wk = iso_week(date.fromisoformat(closed[:10]))
                    issues_by_week[wk]["closed"] += 1
        except Exception:
            continue
except Exception:
    pass  # gh CLI may not be available

# --- Build weekly time-series ---
cumulative_actual = 0
cumulative_legacy = 0
weekly_actual_rate = actual_total_cost / len(scope_weeks) if scope_weeks else 0
weekly_legacy_rate = legacy_midpoint / (legacy_months_midpoint * 4.33) if legacy_months_midpoint else 0
cumulative_commits = 0
cumulative_issues_opened = 0
cumulative_issues_closed = 0

time_series = []
for wk in scope_weeks:
    wk_commits = commits_by_week.get(wk, 0)
    wk_claude = claude_by_week.get(wk, {"messages": 0, "sessions": 0, "toolCalls": 0})
    wk_issues = issues_by_week.get(wk, {"opened": 0, "closed": 0})

    cumulative_actual += weekly_actual_rate
    cumulative_legacy += weekly_legacy_rate
    cumulative_commits += wk_commits
    cumulative_issues_opened += wk_issues["opened"]
    cumulative_issues_closed += wk_issues["closed"]

    time_series.append({
        "week": wk,
        "weekStart": week_start_date(wk),
        "commits": wk_commits,
        "cumulativeCommits": cumulative_commits,
        "messages": wk_claude["messages"],
        "sessions": wk_claude["sessions"],
        "toolCalls": wk_claude["toolCalls"],
        "issuesOpened": wk_issues["opened"],
        "issuesClosed": wk_issues["closed"],
        "cumulativeIssuesOpened": cumulative_issues_opened,
        "cumulativeIssuesClosed": cumulative_issues_closed,
        "cumulativeCostActual": round(cumulative_actual),
        "cumulativeCostLegacy": round(cumulative_legacy),
    })

# ---------- 11. Industry benchmarks ----------------------------------------

industry_benchmarks = {
    "locPerDevPerDay": {"low": 50, "high": 100},
    "codingTimePercent": 35,
    "meetingTimePercent": 20,
    "codeReviewPercent": 12,
    "aiProductivityMultiplier": {"conservative": 1.5, "aggressive": 5.0},
    "studies": [
        {"source": "GitHub/Microsoft 2022", "finding": "55% faster task completion"},
        {"source": "McKinsey 2023", "finding": "20-45% productivity improvement"},
        {"source": "Google 2024", "finding": "25%+ of new code AI-generated"},
        {"source": "BCG/Harvard 2023", "finding": "40% higher quality output"},
        {"source": "Deloitte 2024", "finding": "25-35% project cost savings"},
    ],
}

# ---------- 11. Assemble output --------------------------------------------

output = {
    "generated": datetime.now().isoformat(),
    "scope": f"Campaign Brain (cb*) repositories, {SCOPE_START.isoformat()} to {SCOPE_END.isoformat()}",
    "timespan": {
        "start": SCOPE_START.isoformat(),
        "end": SCOPE_END.isoformat(),
        "days": total_days,
        "activeDays": active_days,
    },
    # What the counts were taken from, and when, so the file says what it covers.
    "sources": {
        "pilotGenerated": pilot_generated,
        "timelineGenerated": timeline_generated,
        "timelineLatestCommit": timeline_latest_commit,
        "commitsInWindow": sum(commits_by_week.values()),
        # Org repositories whose first commit is on or before the window's last
        # day: the set the in-window commits can have come from.
        "commitsInWindowRepos": sum(
            1 for r in all_repos
            if r.get("firstCommit") and r["firstCommit"][:10] <= SCOPE_END.isoformat()
        ),
    },
    "actual": {
        "teamSize": 1,
        "sessions": total_cb_sessions,
        "messages": total_cb_messages,
        "toolCalls": total_tool_calls,
        "commits": total_cb_commits,
        "repos": total_cb_repo_count,
        "projects": len(cb_projects),
        "operatorCost": actual_operator_cost,
        "aiCost": actual_ai_cost,
        "totalCost": actual_total_cost,
        "domains": domains,
        "skills": skills,
        "topProjects": top_projects_out,
    },
    "legacy": {
        "roles": legacy_roles,
        "teamSize": legacy_team_size,
        "estimatedMonths": {"low": est_months_low, "high": est_months_high},
        "personMonths": {"low": person_months_low, "high": person_months_high},
        "costPerPersonMonth": cost_per_person_month,
        "totalCost": {"low": total_legacy_low, "high": total_legacy_high},
        "overheadMultiplier": overhead_multiplier,
    },
    "comparison": {
        "costSavingsPercent": cost_savings_pct,
        "velocityMultiplier": velocity_multiplier,
        "timeCompression": time_compression,
    },
    "industryBenchmarks": industry_benchmarks,
    "timeSeries": time_series,
    "issues": total_issues,
}

# ---------- 12. Write output -----------------------------------------------

OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
with open(OUTPUT_PATH, "w") as f:
    json.dump(output, f, indent=2)

print(f"Generated: {OUTPUT_PATH}")
print(f"  Scope: {SCOPE_START} to {SCOPE_END} ({total_days} days, {active_days} active)")
print(f"  cb* projects (mission log): {len(cb_projects)}")
print(f"  cb* repos (timeline, in scope): {total_cb_repo_count}")
print(f"  cb* commits: {total_cb_commits}")
print(f"  cb* sessions: {total_cb_sessions}, messages: {total_cb_messages}")
print(f"  Tool calls (all): {total_tool_calls}")
print(f"  Legacy team: {legacy_team_size} people, {person_months_low}-{person_months_high} person-months")
print(f"  Legacy cost: ${total_legacy_low:,} - ${total_legacy_high:,}")
print(f"  Actual cost: ${actual_total_cost:,} (operator ${actual_operator_cost:,} + AI ${actual_ai_cost:,})")
print(f"  Time-series: {len(time_series)} weeks")
print(f"  Issues: {total_issues['opened']} opened, {total_issues['closed']} closed ({total_issues['bugs']} bugs, {total_issues['features']} features)")
print(f"  Velocity multiplier: {velocity_multiplier}x")
print(f"  Time compression: {time_compression}")
print(f"  Cost savings: {cost_savings_pct}%")
print(f"  Velocity multiplier: {velocity_multiplier}x")
print(f"  Time compression: {time_compression}")
