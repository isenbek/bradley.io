#!/usr/bin/env python3
"""
claude-activity-export.py — analytical export of Claude Code activity.

Flattens the raw session JSONL (local ~/.claude + the DC-1 mirror ~/.claude-dc1)
into a queryable DuckDB with three grains, for productivity / cost / tool-usage
analysis:

  turns       1 row per user|assistant message — ts, model, token usage, #tools
  tool_calls  1 row per tool_use block — tool_name, caller
  sessions    VIEW derived from turns — per-session totals + span

Metrics only (no message text) — compact and free of sensitive content.

Incremental by default: a per-file watermark (size + byte offset) means each run
only reads *new lines in changed files* and appends. Append-only JSONL makes this
safe; a uuid primary key on `turns` + ON CONFLICT makes re-reads idempotent.

  python3 scripts/claude-activity-export.py            # incremental
  python3 scripts/claude-activity-export.py --full     # wipe + rebuild
  python3 scripts/claude-activity-export.py --parquet data/claude-parquet
  python3 scripts/claude-activity-export.py --db /path/to/other.duckdb

Requires: duckdb (pyenv tinymachines env).
"""

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import duckdb

HOME = Path.home()
# (root, host-label). Local sessions win over the mirror on a stem collision.
SOURCES = [
    (HOME / ".claude" / "projects", "dc0"),
    (HOME / ".claude-dc1" / "projects", "dc1"),
]
DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "claude-activity.duckdb"

BATCH = 5000


def log(msg: str):
    print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}", flush=True)


def discover_files() -> list[tuple[Path, str]]:
    """All session JSONL files, deduped by stem (prefer local/dc0)."""
    seen: dict[str, tuple[Path, str]] = {}
    for root, host in SOURCES:
        if not root.exists():
            continue
        for f in root.rglob("*.jsonl"):
            p = str(f)
            if "/memory/" in p or "/subagents/" in p:
                continue
            seen.setdefault(f.stem, (f, host))  # first source wins
    return list(seen.values())


def ensure_schema(con: duckdb.DuckDBPyConnection):
    con.execute("""
        CREATE TABLE IF NOT EXISTS turns (
            uuid VARCHAR PRIMARY KEY,
            session_id VARCHAR,
            host VARCHAR,
            project VARCHAR,
            git_branch VARCHAR,
            ts TIMESTAMP,
            role VARCHAR,
            model VARCHAR,
            input_tokens BIGINT,
            output_tokens BIGINT,
            cache_read_tokens BIGINT,
            cache_creation_tokens BIGINT,
            n_tool_uses INTEGER,
            is_sidechain BOOLEAN,
            version VARCHAR
        );
    """)
    con.execute("""
        CREATE TABLE IF NOT EXISTS tool_calls (
            turn_uuid VARCHAR,
            session_id VARCHAR,
            host VARCHAR,
            ts TIMESTAMP,
            tool_name VARCHAR,
            caller VARCHAR,
            is_sidechain BOOLEAN
        );
    """)
    con.execute("""
        CREATE TABLE IF NOT EXISTS _watermark (
            file_path VARCHAR PRIMARY KEY,
            host VARCHAR,
            size_bytes BIGINT,
            offset_bytes BIGINT,
            updated_at TIMESTAMP
        );
    """)
    # sessions is a derived view — always consistent with turns.
    con.execute("""
        CREATE OR REPLACE VIEW sessions AS
        SELECT
            session_id,
            any_value(host)        AS host,
            any_value(project)     AS project,
            min(ts)                AS started_at,
            max(ts)                AS ended_at,
            date_diff('minute', min(ts), max(ts)) AS duration_min,
            count(*)                                   AS n_turns,
            count(*) FILTER (WHERE role = 'user')      AS n_user_turns,
            count(*) FILTER (WHERE role = 'assistant') AS n_assistant_turns,
            sum(input_tokens)          AS input_tokens,
            sum(output_tokens)         AS output_tokens,
            sum(cache_read_tokens)     AS cache_read_tokens,
            sum(cache_creation_tokens) AS cache_creation_tokens,
            sum(n_tool_uses)           AS n_tool_uses,
            count(DISTINCT model) FILTER (WHERE model IS NOT NULL) AS n_models,
            list(DISTINCT model) FILTER (WHERE model IS NOT NULL)  AS models,
            list(DISTINCT git_branch) FILTER (WHERE git_branch IS NOT NULL) AS branches
        FROM turns
        GROUP BY session_id;
    """)


def usage_tokens(msg: dict) -> tuple[int, int, int, int]:
    u = msg.get("usage") or {}
    return (
        int(u.get("input_tokens") or 0),
        int(u.get("output_tokens") or 0),
        int(u.get("cache_read_input_tokens") or 0),
        int(u.get("cache_creation_input_tokens") or 0),
    )


def parse_line(entry: dict, host: str, session_id: str):
    """Return (turn_row | None, [tool_rows])."""
    t = entry.get("type")
    if t not in ("user", "assistant"):
        return None, []
    uuid = entry.get("uuid")
    if not uuid:
        return None, []
    ts = entry.get("timestamp")
    project = None
    cwd = entry.get("cwd")
    if cwd:
        project = Path(cwd).name
    branch = entry.get("gitBranch") or None
    version = entry.get("version") or None
    sidechain = bool(entry.get("isSidechain"))
    msg = entry.get("message") or {}
    model = msg.get("model") if t == "assistant" else None
    in_tok, out_tok, cr_tok, cc_tok = usage_tokens(msg) if t == "assistant" else (0, 0, 0, 0)

    tool_rows = []
    content = msg.get("content")
    if isinstance(content, list):
        for c in content:
            if isinstance(c, dict) and c.get("type") == "tool_use":
                tool_rows.append(
                    (uuid, session_id, host, ts, c.get("name"), c.get("caller"), sidechain)
                )
    n_tools = len(tool_rows)

    turn_row = (
        uuid, session_id, host, project, branch, ts, t, model,
        in_tok, out_tok, cr_tok, cc_tok, n_tools, sidechain, version,
    )
    return turn_row, tool_rows


def flush(con, turns, tools):
    if turns:
        con.executemany(
            "INSERT INTO turns VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT (uuid) DO NOTHING",
            turns,
        )
        turns.clear()
    if tools:
        con.executemany("INSERT INTO tool_calls VALUES (?,?,?,?,?,?,?)", tools)
        tools.clear()


def process_file(con, path: Path, host: str, start_offset: int):
    """Read complete new lines from start_offset; return (new_offset, n_turns, n_tools)."""
    turns, tools = [], []
    nt = ntc = 0
    with open(path, "rb") as f:
        f.seek(start_offset)
        data = f.read()
    if not data:
        return start_offset, 0, 0
    # Only advance past the last complete line (handles a mid-write tail).
    last_nl = data.rfind(b"\n")
    if last_nl == -1:
        return start_offset, 0, 0  # no complete line yet
    complete = data[: last_nl + 1]
    new_offset = start_offset + last_nl + 1

    for raw in complete.split(b"\n"):
        if not raw.strip():
            continue
        try:
            entry = json.loads(raw)
        except (json.JSONDecodeError, UnicodeDecodeError):
            continue
        turn_row, tool_rows = parse_line(entry, host, path.stem)
        if turn_row:
            turns.append(turn_row)
            nt += 1
        if tool_rows:
            tools.extend(tool_rows)
            ntc += len(tool_rows)
        if len(turns) >= BATCH:
            flush(con, turns, tools)
    flush(con, turns, tools)
    return new_offset, nt, ntc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--full", action="store_true", help="wipe tables + reparse from scratch")
    ap.add_argument("--db", default=str(DEFAULT_DB), help="output DuckDB path")
    ap.add_argument("--parquet", metavar="DIR", help="also export each table to Parquet in DIR")
    args = ap.parse_args()

    db_path = Path(args.db)
    db_path.parent.mkdir(parents=True, exist_ok=True)
    con = duckdb.connect(str(db_path))
    ensure_schema(con)

    if args.full:
        log("--full: dropping turns / tool_calls / watermark")
        con.execute("DELETE FROM turns")
        con.execute("DELETE FROM tool_calls")
        con.execute("DELETE FROM _watermark")

    wm = {
        row[0]: (row[1], row[2])  # path -> (size, offset)
        for row in con.execute("SELECT file_path, size_bytes, offset_bytes FROM _watermark").fetchall()
    }

    files = discover_files()
    log(f"{len(files)} session files; DB={db_path.name}; mode={'FULL' if args.full else 'incremental'}")

    processed = skipped = tot_turns = tot_tools = 0
    for path, host in files:
        p = str(path)
        try:
            size = path.stat().st_size
        except OSError:
            continue
        prev_size, prev_off = wm.get(p, (None, 0))
        offset = prev_off or 0
        if prev_size is not None and size == prev_size:
            skipped += 1
            continue
        if size < offset:  # file truncated / rewritten → reparse whole file
            con.execute("DELETE FROM turns WHERE session_id = ?", [path.stem])
            con.execute("DELETE FROM tool_calls WHERE session_id = ?", [path.stem])
            offset = 0
        new_off, nt, ntc = process_file(con, path, host, offset)
        con.execute(
            "INSERT INTO _watermark VALUES (?,?,?,?,now()) "
            "ON CONFLICT (file_path) DO UPDATE SET size_bytes=excluded.size_bytes, "
            "offset_bytes=excluded.offset_bytes, updated_at=now()",
            [p, host, size, new_off],
        )
        processed += 1
        tot_turns += nt
        tot_tools += ntc

    con.execute("CHECKPOINT")
    log(f"processed {processed} files ({skipped} unchanged) · +{tot_turns} turns · +{tot_tools} tool calls")

    if args.parquet:
        out = Path(args.parquet)
        out.mkdir(parents=True, exist_ok=True)
        for tbl in ("turns", "tool_calls", "sessions"):
            con.execute(f"COPY {tbl} TO '{out / (tbl + '.parquet')}' (FORMAT PARQUET)")
        log(f"parquet written to {out}")

    # Summary
    n_turns = con.execute("SELECT count(*) FROM turns").fetchone()[0]
    n_sess = con.execute("SELECT count(*) FROM sessions").fetchone()[0]
    n_tools = con.execute("SELECT count(*) FROM tool_calls").fetchone()[0]
    span = con.execute("SELECT min(ts), max(ts) FROM turns").fetchone()
    print("\n=== claude-activity export ===")
    print(f"  sessions   {n_sess:,}")
    print(f"  turns      {n_turns:,}")
    print(f"  tool_calls {n_tools:,}")
    print(f"  span       {span[0]} → {span[1]}")
    top_tools = con.execute(
        "SELECT tool_name, count(*) c FROM tool_calls GROUP BY 1 ORDER BY c DESC LIMIT 8"
    ).fetchall()
    if top_tools:
        print("  top tools  " + ", ".join(f"{t}:{c:,}" for t, c in top_tools))
    top_models = con.execute(
        "SELECT model, count(*) c FROM turns WHERE model IS NOT NULL GROUP BY 1 ORDER BY c DESC LIMIT 6"
    ).fetchall()
    if top_models:
        print("  models     " + ", ".join(f"{m}:{c:,}" for m, c in top_models))
    con.close()


if __name__ == "__main__":
    sys.exit(main())
