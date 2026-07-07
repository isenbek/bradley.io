#!/usr/bin/env python3
"""
claude-activity-viz.py — roll the claude-activity DuckDB up into a compact
analytics JSON for the /pilot-analytics dashboard, and (optionally) emit Parquet
+ a zip bundle for offline analysis.

Reads:  data/claude-activity.duckdb   (built by claude-activity-export.py)
Writes: data/pilot-analytics.json     (private aggregates the viz renders)
        data/claude-parquet/*.parquet  (--parquet)
        data/claude-activity-export.zip (--zip: parquet + the json, bundled)

  python3 scripts/claude-activity-viz.py
  python3 scripts/claude-activity-viz.py --parquet --zip
"""

import argparse
import zipfile
from datetime import datetime, timezone
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parent.parent
DB = ROOT / "data" / "claude-activity.duckdb"
OUT_JSON = ROOT / "data" / "pilot-analytics.json"
PARQUET_DIR = ROOT / "data" / "claude-parquet"
ZIP_PATH = ROOT / "data" / "claude-activity-export.zip"


def rows(con, sql):
    cur = con.execute(sql)
    cols = [d[0] for d in cur.description]
    return [dict(zip(cols, r)) for r in cur.fetchall()]


def one(con, sql):
    return con.execute(sql).fetchone()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--parquet", action="store_true", help="also export tables to Parquet")
    ap.add_argument("--zip", action="store_true", help="bundle parquet + json into a zip")
    ap.add_argument("--db", default=str(DB))
    args = ap.parse_args()

    con = duckdb.connect(args.db, read_only=True)

    summary = one(con, """
        SELECT count(DISTINCT session_id), count(*),
               sum(input_tokens), sum(output_tokens),
               sum(cache_read_tokens), sum(cache_creation_tokens),
               min(ts), max(ts)
        FROM turns
    """)
    n_tools = one(con, "SELECT count(*) FROM tool_calls")[0]

    data = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "summary": {
            "sessions": summary[0],
            "turns": summary[1],
            "tool_calls": n_tools,
            "input_tokens": summary[2] or 0,
            "output_tokens": summary[3] or 0,
            "cache_read_tokens": summary[4] or 0,
            "cache_creation_tokens": summary[5] or 0,
            "first_ts": str(summary[6]) if summary[6] else None,
            "last_ts": str(summary[7]) if summary[7] else None,
        },
        "by_model": rows(con, """
            SELECT model,
                   count(*) turns,
                   sum(output_tokens) out_tokens,
                   sum(input_tokens) in_tokens
            FROM turns WHERE model IS NOT NULL
            GROUP BY 1 ORDER BY turns DESC
        """),
        "by_tool": rows(con, """
            SELECT tool_name, count(*) calls
            FROM tool_calls GROUP BY 1 ORDER BY calls DESC LIMIT 25
        """),
        "by_project": rows(con, """
            SELECT project,
                   count(DISTINCT session_id) sessions,
                   count(*) FILTER (WHERE role='assistant') asst_turns,
                   sum(output_tokens) out_tokens
            FROM turns WHERE project IS NOT NULL
            GROUP BY 1 ORDER BY out_tokens DESC LIMIT 30
        """),
        "by_host": rows(con, """
            SELECT host, count(DISTINCT session_id) sessions, count(*) turns,
                   sum(output_tokens) out_tokens
            FROM turns GROUP BY 1 ORDER BY turns DESC
        """),
        "weekly": rows(con, """
            SELECT date_trunc('week', ts)::date AS week,
                   count(*) FILTER (WHERE role='assistant') turns,
                   sum(output_tokens) out_tokens,
                   count(DISTINCT session_id) sessions
            FROM turns GROUP BY 1 ORDER BY 1
        """),
        "daily": rows(con, """
            SELECT ts::date AS day,
                   count(*) FILTER (WHERE role='assistant') turns,
                   sum(output_tokens) out_tokens
            FROM turns
            WHERE ts >= (SELECT max(ts) FROM turns) - INTERVAL 60 DAY
            GROUP BY 1 ORDER BY 1
        """),
        "hourly": rows(con, """
            SELECT extract('hour' FROM ts)::int AS hour,
                   count(*) FILTER (WHERE role='assistant') turns
            FROM turns GROUP BY 1 ORDER BY 1
        """),
        "top_sessions": rows(con, """
            SELECT session_id, project, host,
                   started_at::date AS started, duration_min,
                   n_assistant_turns AS turns, output_tokens, n_tool_uses AS tool_calls
            FROM sessions ORDER BY output_tokens DESC LIMIT 25
        """),
    }

    # dates → iso strings for JSON
    import json

    def default(o):
        return o.isoformat() if hasattr(o, "isoformat") else str(o)

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(data, default=default))
    print(f"  wrote {OUT_JSON.name} "
          f"({data['summary']['sessions']} sessions, {data['summary']['turns']:,} turns)")

    if args.parquet or args.zip:
        PARQUET_DIR.mkdir(parents=True, exist_ok=True)
        for tbl in ("turns", "tool_calls", "sessions"):
            con.execute(f"COPY {tbl} TO '{PARQUET_DIR / (tbl + '.parquet')}' (FORMAT PARQUET)")
        print(f"  wrote parquet → {PARQUET_DIR}")

    con.close()

    if args.zip:
        with zipfile.ZipFile(ZIP_PATH, "w", zipfile.ZIP_DEFLATED) as z:
            for p in sorted(PARQUET_DIR.glob("*.parquet")):
                z.write(p, arcname=f"claude-parquet/{p.name}")
            z.write(OUT_JSON, arcname=OUT_JSON.name)
        print(f"  wrote {ZIP_PATH.name} ({ZIP_PATH.stat().st_size/1e6:.1f} MB)")


if __name__ == "__main__":
    main()
