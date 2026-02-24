#!/usr/bin/env python3
"""
Refresh ~/.claude/stats-cache.json by parsing JSONL session files.

Claude Code's stats-cache only updates when `claude stats` is run interactively.
This script reads all JSONL session files and builds the cache independently,
keeping the same format Claude Code expects (version 2).

Usage:
  python3 scripts/refresh-stats-cache.py [--verbose] [--dry-run]
"""

import json
import os
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path

CLAUDE_DIR = Path.home() / ".claude"
PROJECTS_DIR = CLAUDE_DIR / "projects"
STATS_CACHE = CLAUDE_DIR / "stats-cache.json"
CACHE_VERSION = 2

VERBOSE = "--verbose" in sys.argv or "-v" in sys.argv
DRY_RUN = "--dry-run" in sys.argv


def log(msg):
    if VERBOSE:
        print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}", file=sys.stderr)


def collect_jsonl_files():
    """Find all JSONL session files across all project directories."""
    files = []
    if not PROJECTS_DIR.exists():
        return files

    for proj_dir in PROJECTS_DIR.iterdir():
        if not proj_dir.is_dir():
            continue
        # Main session files
        for f in proj_dir.glob("*.jsonl"):
            files.append(f)
        # Subagent files
        for session_dir in proj_dir.iterdir():
            if session_dir.is_dir():
                subagents_dir = session_dir / "subagents"
                if subagents_dir.exists():
                    for f in subagents_dir.glob("agent-*.jsonl"):
                        files.append(f)

    log(f"Found {len(files)} JSONL files across {sum(1 for d in PROJECTS_DIR.iterdir() if d.is_dir())} projects")
    return files


def parse_session_file(filepath):
    """Parse a single JSONL session file, return messages (excluding sidechains)."""
    messages = []
    speculation_time = 0
    try:
        with open(filepath, errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                if entry.get("type") in ("user", "assistant"):
                    messages.append(entry)
                elif entry.get("type") == "speculation-accept":
                    speculation_time += entry.get("timeSavedMs", 0)
    except Exception as e:
        log(f"Failed to read {filepath}: {e}")

    # Filter out sidechain messages
    main_messages = [m for m in messages if not m.get("isSidechain", False)]
    return main_messages, speculation_time


def build_stats_cache(jsonl_files):
    """Process all JSONL files and build the stats cache."""
    daily_activity = defaultdict(lambda: {"messageCount": 0, "sessionCount": 0, "toolCallCount": 0})
    daily_model_tokens = defaultdict(lambda: defaultdict(int))
    model_usage = defaultdict(lambda: {
        "inputTokens": 0, "outputTokens": 0,
        "cacheReadInputTokens": 0, "cacheCreationInputTokens": 0,
        "webSearchRequests": 0, "costUSD": 0,
        "contextWindow": 0, "maxOutputTokens": 0,
    })
    hour_counts = Counter()
    total_sessions = 0
    total_messages = 0
    total_speculation_ms = 0
    longest_session = None
    first_session_date = None
    session_stats = []

    for filepath in jsonl_files:
        messages, spec_time = parse_session_file(filepath)
        total_speculation_ms += spec_time

        if not messages:
            continue

        total_sessions += 1
        total_messages += len(messages)

        # Session timing
        first_msg = messages[0]
        last_msg = messages[-1]
        first_ts = first_msg.get("timestamp", "")
        last_ts = last_msg.get("timestamp", "")

        try:
            first_dt = datetime.fromisoformat(first_ts.replace("Z", "+00:00"))
            last_dt = datetime.fromisoformat(last_ts.replace("Z", "+00:00"))
            duration_ms = int((last_dt - first_dt).total_seconds() * 1000)
        except (ValueError, TypeError):
            first_dt = None
            last_dt = None
            duration_ms = 0

        if first_dt:
            date_str = first_dt.strftime("%Y-%m-%d")
            hour = first_dt.hour
            hour_counts[hour] += 1

            # Track daily activity
            daily_activity[date_str]["messageCount"] += len(messages)
            daily_activity[date_str]["sessionCount"] += 1

            # Track first session date
            if first_session_date is None or first_ts < first_session_date:
                first_session_date = first_ts

            # Track longest session
            session_id = filepath.stem
            if longest_session is None or duration_ms > longest_session.get("duration", 0):
                longest_session = {
                    "sessionId": session_id,
                    "duration": duration_ms,
                    "messageCount": len(messages),
                    "timestamp": first_ts,
                }

            # Process assistant messages for model/token data and tool calls
            for msg in messages:
                if msg.get("type") != "assistant":
                    continue

                content = msg.get("message", {}).get("content", [])
                if isinstance(content, list):
                    for block in content:
                        if isinstance(block, dict) and block.get("type") == "tool_use":
                            daily_activity[date_str]["toolCallCount"] += 1

                usage = msg.get("message", {}).get("usage", {})
                model = msg.get("message", {}).get("model", "")
                if not model or not usage:
                    continue

                input_tok = usage.get("input_tokens", 0)
                output_tok = usage.get("output_tokens", 0)
                cache_read = usage.get("cache_read_input_tokens", 0)
                cache_create = usage.get("cache_creation_input_tokens", 0)

                model_usage[model]["inputTokens"] += input_tok
                model_usage[model]["outputTokens"] += output_tok
                model_usage[model]["cacheReadInputTokens"] += cache_read
                model_usage[model]["cacheCreationInputTokens"] += cache_create

                total_tok = input_tok + output_tok
                if total_tok > 0:
                    daily_model_tokens[date_str][model] += total_tok

    # Build final structure matching Claude Code's cache format (version 2)
    sorted_daily = sorted(
        [{"date": d, **v} for d, v in daily_activity.items()],
        key=lambda x: x["date"],
    )
    sorted_model_tokens = sorted(
        [{"date": d, "tokensByModel": dict(v)} for d, v in daily_model_tokens.items()],
        key=lambda x: x["date"],
    )
    today = datetime.now().strftime("%Y-%m-%d")

    return {
        "version": CACHE_VERSION,
        "lastComputedDate": today,
        "dailyActivity": sorted_daily,
        "dailyModelTokens": sorted_model_tokens,
        "modelUsage": {k: dict(v) for k, v in model_usage.items()},
        "totalSessions": total_sessions,
        "totalMessages": total_messages,
        "longestSession": longest_session,
        "firstSessionDate": first_session_date,
        "hourCounts": dict(hour_counts),
        "totalSpeculationTimeSavedMs": total_speculation_ms,
    }


def main():
    print("Refreshing stats-cache.json from JSONL files...", file=sys.stderr)

    jsonl_files = collect_jsonl_files()
    if not jsonl_files:
        print("No JSONL files found", file=sys.stderr)
        return

    cache = build_stats_cache(jsonl_files)

    if DRY_RUN:
        print(json.dumps(cache, indent=2))
    else:
        STATS_CACHE.write_text(json.dumps(cache, indent=2))
        print(f"Wrote {STATS_CACHE}", file=sys.stderr)

    print(f"  Sessions: {cache['totalSessions']}", file=sys.stderr)
    print(f"  Messages: {cache['totalMessages']}", file=sys.stderr)
    print(f"  Models: {len(cache['modelUsage'])}", file=sys.stderr)
    print(f"  Active days: {len(cache['dailyActivity'])}", file=sys.stderr)
    print(f"  First session: {(cache['firstSessionDate'] or '')[:10]}", file=sys.stderr)
    print(f"  Last computed: {cache['lastComputedDate']}", file=sys.stderr)


if __name__ == "__main__":
    main()
