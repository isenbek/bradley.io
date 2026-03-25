#!/usr/bin/env python3
"""
activity-pulse.py — minute-resolution Claude activity tracker.

Runs every minute via cron. Detects session file changes by comparing
mtimes against a saved state, records active minutes in a rolling log,
and writes an hourly-bucketed JSON for the homepage sparkline.

State:  /tmp/activity-pulse-state.json   — {filepath: mtime} snapshot
Log:    /tmp/activity-pulse-log.json     — list of active minute timestamps
Output: public/data/activity-pulse.json  — 24h hourly buckets for frontend
"""

import json
import os
import time
from datetime import datetime, timezone, timedelta
from pathlib import Path

CLAUDE_DIR = Path.home() / ".claude" / "projects"
STATE_FILE = Path("/tmp/activity-pulse-state.json")
LOG_FILE = Path("/tmp/activity-pulse-log.json")
OUTPUT_FILE = Path(__file__).parent.parent / "public" / "data" / "activity-pulse.json"

WINDOW_HOURS = 24


def scan_session_files() -> dict[str, float]:
    """Return {filepath: mtime} for all session JSONL files."""
    mtimes = {}
    if not CLAUDE_DIR.exists():
        return mtimes
    for f in CLAUDE_DIR.rglob("*.jsonl"):
        try:
            mtimes[str(f)] = f.stat().st_mtime
        except OSError:
            pass
    return mtimes


def load_json(path: Path) -> list | dict:
    try:
        with open(path) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {} if "state" in path.name else []


def save_json(path: Path, data):
    with open(path, "w") as f:
        json.dump(data, f)


def main():
    now = datetime.now(timezone.utc)
    now_ts = now.isoformat(timespec="seconds")
    cutoff = now - timedelta(hours=WINDOW_HOURS)

    # 1. Scan current mtimes
    current = scan_session_files()

    # 2. Load previous state
    previous = load_json(STATE_FILE)

    # 3. Detect changes
    active = False
    for path, mtime in current.items():
        prev_mtime = previous.get(path)
        if prev_mtime is None or mtime > prev_mtime:
            active = True
            break

    # 4. Save new state
    save_json(STATE_FILE, current)

    # 5. Update activity log
    log: list[str] = load_json(LOG_FILE)
    if active:
        log.append(now_ts)

    # Prune to last 24h
    cutoff_str = cutoff.isoformat(timespec="seconds")
    log = [ts for ts in log if ts >= cutoff_str]
    save_json(LOG_FILE, log)

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
    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    output = {
        "generated": now_ts,
        "windowHours": WINDOW_HOURS,
        "totalActiveMinutes": len(log),
        "buckets": buckets,
    }
    save_json(OUTPUT_FILE, output)

    if active:
        print(f"[{now_ts}] Active — {len(log)} minutes in last 24h")


if __name__ == "__main__":
    main()
