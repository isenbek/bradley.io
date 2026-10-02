#!/usr/bin/env python3
"""
activity-pulse.py: minute-resolution Claude activity tracker for THIS HOST.

Runs every minute via cron. Detects session file changes by comparing
mtimes against a saved state, records active minutes in a rolling log,
and writes an hourly-bucketed JSON for a homepage sparkline.

State:  /tmp/activity-pulse-state.json   {filepath: mtime} snapshot
Log:    /tmp/activity-pulse-log.json     list of active minute timestamps
Output: public/data/activity-pulse.json  24h hourly buckets for the frontend

WHAT IT COVERS, AND WHY THE DC-1 MIRROR IS LEFT OUT (decided 2026-10-02)
------------------------------------------------------------------------
This script scans only ~/.claude/projects on this host. Most sessions run on
the other host (DC-1: 265 of 333 sessions in data/claude-activity.duckdb) and
are mirrored to ~/.claude-dc1 by scripts/sync-dc1-claude.sh. The mirror is
deliberately NOT scanned here, because it cannot tell the truth at minute
resolution:

  1. The mirror only changes when the sync runs, every 4 hours. This script
     counts a minute as active when a file's mtime moved since the previous
     minute's scan. Applied to the mirror, four hours of DC-1 work would show
     up as ONE active minute, in the hour the rsync happened to run, not the
     hours the work was done.

  2. rsync preserves mtimes, so a mirrored file carries the time of its LAST
     write on DC-1 and nothing else. Measured on 2026-10-02: 15 mirror files
     had an mtime inside the last 24 hours, while the DuckDB shows about 460
     distinct active minutes on DC-1 for the previous day. Counting mtimes
     would publish roughly 15 where the answer is roughly 460.

  3. The honest alternative is to parse the turn timestamps inside the synced
     JSONL files. Those files run to hundreds of MB each (the mirror is 2.2 GB)
     and this script runs every minute on a loaded box. Even done only after a
     sync, the newest four hours of a 24-hour pulse would always be missing
     most of the activity and then be rewritten after the fact.

So the output says what it is: this host only (see "scope" and "covers" in the
JSON). A reader must label it that way and must not present it as all Claude
activity. For a both-hosts figure use the DuckDB, which is refreshed by the
same 4-hourly run and has every turn's timestamp:

    select count(distinct date_trunc('minute', ts)) from turns where ts >= ...

That number is up to 4 hours old and should be published with its as-of time.

What the fields cover: "totalActiveMinutes" is the rolling last 24 hours up
to "generated". "buckets" are 24 clock hours ending with the last COMPLETED
hour, so the hour in progress is in the total but not in a bucket, and the
oldest bucket only holds the part of its hour that is still inside the 24-hour
window. The two therefore do not sum to each other; a reader should not expect
them to.

Testing: --out, --state-dir and --projects-dir move every file this script
touches, so a test run never writes public/data or the live /tmp state.
"""

import argparse
import json
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path

CLAUDE_DIR = Path.home() / ".claude" / "projects"
STATE_DIR = Path("/tmp")
STATE_NAME = "activity-pulse-state.json"
LOG_NAME = "activity-pulse-log.json"
OUTPUT_FILE = Path(__file__).parent.parent / "public" / "data" / "activity-pulse.json"

WINDOW_HOURS = 24

SCOPE = "local"
COVERS = (
    "Claude Code session files on this host only (~/.claude/projects). "
    "Sessions on the second host are not counted: its mirror syncs every "
    "4 hours and cannot say which minutes were active."
)


def scan_session_files(root: Path) -> dict[str, float]:
    """Return {filepath: mtime} for all session JSONL files."""
    mtimes = {}
    if not root.exists():
        return mtimes
    for f in root.rglob("*.jsonl"):
        try:
            mtimes[str(f)] = f.stat().st_mtime
        except OSError:
            pass
    return mtimes


def load_json(path: Path, default):
    try:
        with open(path) as f:
            data = json.load(f)
    except (FileNotFoundError, json.JSONDecodeError, OSError):
        return default
    # A file of the wrong shape is treated like a missing one.
    return data if isinstance(data, type(default)) else default


def save_json(path: Path, data):
    # Write beside the target and rename: the output is copied and read by
    # other processes every minute, and must never be seen half-written.
    tmp = path.with_name(path.name + ".tmp")
    with open(tmp, "w") as f:
        json.dump(data, f)
    os.replace(tmp, path)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[1])
    ap.add_argument("--out", type=Path, default=OUTPUT_FILE,
                    help="output JSON (default: public/data/activity-pulse.json)")
    ap.add_argument("--state-dir", type=Path, default=STATE_DIR,
                    help="directory for the state and log files (default: /tmp)")
    ap.add_argument("--projects-dir", type=Path, default=CLAUDE_DIR,
                    help="session directory to scan (default: ~/.claude/projects)")
    args = ap.parse_args()
    state_file = args.state_dir / STATE_NAME
    log_file = args.state_dir / LOG_NAME

    now = datetime.now(timezone.utc)
    now_ts = now.isoformat(timespec="seconds")
    cutoff = now - timedelta(hours=WINDOW_HOURS)

    # 1. Scan current mtimes
    current = scan_session_files(args.projects_dir)

    # 2. Load previous state
    previous = load_json(state_file, {})

    # 3. Detect changes. With no previous state (first run, or /tmp cleared by
    # a reboot) every file would look new; that is not evidence of activity in
    # this minute, so nothing is counted until there is a baseline.
    active = False
    if previous:
        for path, mtime in current.items():
            prev_mtime = previous.get(path)
            if prev_mtime is None or mtime > prev_mtime:
                active = True
                break

    # 4. Save new state
    args.state_dir.mkdir(parents=True, exist_ok=True)
    save_json(state_file, current)

    # 5. Update activity log
    log: list[str] = load_json(log_file, [])
    # One entry per clock minute at most, so a double-fired cron cannot turn
    # one active minute into two.
    this_minute = now_ts[:16]
    if active and not (log and isinstance(log[-1], str) and log[-1][:16] == this_minute):
        log.append(now_ts)

    # Prune to last 24h
    cutoff_str = cutoff.isoformat(timespec="seconds")
    log = [ts for ts in log if isinstance(ts, str) and ts >= cutoff_str]
    save_json(log_file, log)

    # 6. Build hourly buckets for the last 24 hours
    buckets: list[dict] = []
    for h in range(WINDOW_HOURS):
        bucket_start = (now - timedelta(hours=WINDOW_HOURS - h)).replace(
            minute=0, second=0, microsecond=0
        )
        bucket_end = bucket_start + timedelta(hours=1)
        start_str = bucket_start.isoformat(timespec="seconds")
        end_str = bucket_end.isoformat(timespec="seconds")
        minutes = sum(1 for ts in log if start_str <= ts < end_str)
        buckets.append({
            "hour": bucket_start.strftime("%Y-%m-%dT%H:%M"),
            "minutes": minutes,
        })

    # 7. Write output
    args.out.parent.mkdir(parents=True, exist_ok=True)
    output = {
        "generated": now_ts,
        "windowHours": WINDOW_HOURS,
        "totalActiveMinutes": len(log),
        "buckets": buckets,
        # What the numbers above cover. Added 2026-10-02; see the file header.
        "scope": SCOPE,
        "covers": COVERS,
    }
    save_json(args.out, output)

    if active:
        print(f"[{now_ts}] Active: {len(log)} minutes in last 24h")


if __name__ == "__main__":
    main()
