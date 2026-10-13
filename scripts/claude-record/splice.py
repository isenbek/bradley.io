#!/usr/bin/env python3
"""The whole Claude Code record, spliced from three sources, into public/data/claude-record.json.

The durable activity database (data/claude-activity.duckdb) began recording on
2026-07-07 and holds nothing before 2026-03-08; public/data/ai-pilot-data.json
is read from it. The months before that exist only as snapshots the old site's
pipeline committed, which counted the session logs still on disk that day:

  git 59a0b6c (2026-02-20)  2025-12-11 .. 2026-02-16  the fullest early snapshot
  git c648db2 (2026-03-06)  2026-02-01 .. 2026-03-06  used for the days 02-17 .. 03-07

Later snapshots of the same days show SMALLER totals (logs had rotated), so the
earliest snapshot of each day is the best record of it. Nothing here is
estimated: a day the snapshots do not hold is a day with no count.

Run from the repo root:  python3 scripts/claude-record/splice.py
"""
import json, subprocess, datetime as dt, shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "public" / "data" / "claude-record.json"
SNAPSHOTS = [  # (commit, first day, last day) in the order their days are taken
    ("59a0b6c", "2025-12-11", "2026-02-16"),
    ("c648db2", "2026-02-17", "2026-03-07"),
]

def git_json(commit, path):
    return json.loads(subprocess.run(["git", "show", f"{commit}:{path}"], cwd=ROOT, capture_output=True, text=True, check=True).stdout)

days = {}
sources = []
for commit, a, b in SNAPSHOTS:
    d = git_json(commit, "public/data/ai-pilot-data.json")
    taken = 0
    for h in d["activityHeatmap"]:
        if a <= h["date"] <= b and h["date"] not in days:
            days[h["date"]] = {"date": h["date"], "messages": h["count"], "sessions": h.get("sessions", 0), "toolCalls": h.get("toolCalls", 0), "source": commit}
            taken += 1
    sources.append({"commit": commit, "generated": d.get("generated", "")[:10], "days": taken, "from": a, "to": b,
                    "snapshotTotals": {k: d["license"].get(k) for k in ("totalSessions", "totalMessages", "totalCostUSD")}})

cur = json.loads((ROOT / "public" / "data" / "ai-pilot-data.json").read_text())
for h in cur["activityHeatmap"]:
    if h["date"] not in days:
        days[h["date"]] = {"date": h["date"], "messages": h["count"], "sessions": h.get("sessions", 0), "toolCalls": h.get("toolCalls", 0), "source": "db"}
sources.append({"commit": "working tree", "generated": cur.get("generated", "")[:10], "days": sum(1 for v in days.values() if v["source"] == "db"),
                "from": cur["coverage"]["since"], "to": cur["coverage"]["through"], "snapshotTotals": {k: cur["license"].get(k) for k in ("totalSessions", "totalMessages", "totalToolCalls")}})

def active_time():
    """Time with Claude Code since the database began: five-minute buckets with a turn in them, from the parquet export.
    A session's own start-to-end span is not time (sessions stay open for weeks), so the record counts minutes that
    held a message. Before 2026-03-08 there is no turn-level data, so there is no time figure for those months."""
    parquet = ROOT / "data" / "claude-parquet" / "turns.parquet"
    duck = shutil.which("duckdb") or str(Path.home() / ".local" / "bin" / "duckdb")
    if not parquet.exists() or not Path(duck).exists():
        return None
    q = f"""select count(distinct (epoch(ts)::bigint // 300)) b5, count(distinct date_trunc('minute', ts)) m1, count(distinct date_trunc('hour', ts)) h, min(ts)::date::varchar a, max(ts)::date::varchar z from '{parquet}';
    select strftime(date_trunc('month', ts), '%Y-%m') m, count(distinct (epoch(ts)::bigint // 300)) b5 from '{parquet}' group by 1 order by 1;"""
    out = subprocess.run([duck, "-json", "-c", q], capture_output=True, text=True, check=True).stdout
    # duckdb -json prints one JSON array per statement
    parts = [json.loads(x) for x in out.replace("]\n[", "]\x00[").split("\x00")]
    t = parts[0][0]
    return {"since": t["a"], "through": t["z"], "fiveMinuteBuckets": t["b5"], "hours": round(t["b5"] * 5 / 60), "minutesWithTurn": t["m1"], "hoursTouched": t["h"],
            "definition": "five-minute buckets with at least one message in them, times five minutes; a session's open span is not counted",
            "byMonth": [{"month": r["m"], "hours": round(r["b5"] * 5 / 60)} for r in parts[1]]}

series = sorted(days.values(), key=lambda r: r["date"])
first, last = series[0]["date"], series[-1]["date"]
span = (dt.date.fromisoformat(last) - dt.date.fromisoformat(first)).days + 1
early = [r for r in series if r["source"] != "db"]
record = {
    "generated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
    "first": first, "last": last, "calendarDays": span, "activeDays": len(series),
    "messages": sum(r["messages"] for r in series), "sessions": sum(r["sessions"] for r in series), "toolCalls": sum(r["toolCalls"] for r in series),
    "early": {"activeDays": len(early), "messages": sum(r["messages"] for r in early), "sessions": sum(r["sessions"] for r in early), "from": early[0]["date"], "to": early[-1]["date"]},
    "db": {"activeDays": len(series) - len(early), "messages": cur["license"]["totalMessages"], "sessions": cur["license"]["totalSessions"], "toolCalls": cur["license"]["totalToolCalls"], "from": cur["coverage"]["since"], "to": cur["coverage"]["through"]},
    "activeTime": active_time(),
    "sources": sources,
    "note": "Days before 2026-03-08 come from the old site's committed snapshots, which counted the logs still on disk that day; a day they do not hold is a day with no count. Sessions are counted per day, so a session that spans days is counted on each. Nothing is estimated.",
    "days": series,
}
OUT.write_text(json.dumps(record, indent=1) + "\n")
print(f"{first} .. {last}: {len(series)} active days of {span}, {record['messages']:,} messages, {record['sessions']:,} session-days, {record['toolCalls']:,} tool calls")
for s in sources: print(" ", s)
print(" active time:", {k: v for k, v in (record["activeTime"] or {}).items() if k != "byMonth"})
