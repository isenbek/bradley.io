#!/usr/bin/env python3
"""
activity_db.py: durable Claude Code activity aggregates, read from DuckDB.

WHY THIS EXISTS
  The raw session logs under ~/.claude and ~/.claude-dc1 are a rolling window of
  roughly 30 days (Claude Code prunes them, and the DC-1 rsync runs with
  --delete). Anything that calls itself a lifetime total and is computed from
  those logs shrinks over time. scripts/claude-activity-export.py appends the
  same logs into data/claude-activity.duckdb every 4 hours, and that file keeps
  what the logs forget. This module is the one place the site's pipelines read
  it from.

API (import this module from another script in scripts/)
  load(db_path=DEFAULT_DB, day_tz="UTC", hour_tz=LOCAL_TZ, today=None)
      -> dict of aggregates, or None.
      None means "could not read the durable record" (file missing, locked,
      empty, duckdb not installed in this interpreter). A reason is printed to
      stderr. A caller that gets None must KEEP ITS PREVIOUS OUTPUT and must not
      write zeros.

  price_usage(models, cache_write_ttl=None)
      -> list-price cost of a load()["models"] list. See PRICES below. The total
         is None unless every model is priced and the cache-write TTL is known.

  compute_streaks(days, today) -> longest and current run of consecutive days.

  Run it directly to inspect:  python3 scripts/activity_db.py [--db PATH]

  The interpreter needs duckdb. The cron uses
  /home/bisenbek/.pyenv/versions/3.13.3/envs/tinymachines/bin/python3;
  /usr/bin/python3 does not have it (load() then returns None, it does not crash).

SHAPE OF load()  (dates are "YYYY-MM-DD" strings, counts are ints)
  source           "claude-activity.duckdb"
  day_tz, hour_tz  the zones days and hours were bucketed in
  coverage         first_day, last_day, first_ts, last_ts, recording_began
  totals           sessions, turns, user_turns, assistant_turns, tool_uses,
                   api_calls, projects, models,
                   tokens {input, output, cache_read, cache_creation}
  active_days      number of days with at least one turn
  daily[]          date, turns, sessions (active that day), sessions_started,
                   tool_uses, tokens {input, output, cache_read, cache_creation}
  hourly[24]       hour, sessions_started, turns
  models[]         model, api_calls, input_tokens, output_tokens,
                   cache_read_tokens, cache_creation_tokens, first_day, last_day
  projects[]       project, sessions, turns, tool_uses, first_active, last_active
  tools[]          tool, calls
  streaks          longest, longest_start, longest_end, current, as_of

WHAT THE NUMBERS MEAN (read before publishing any of them)
  turn       One transcript record: a prompt, a tool result, or ONE content
             block of a model reply. A single model reply with thinking, text
             and a tool call is three turns. It is not "a message somebody
             typed": the database stores no text, so typed prompts cannot be
             told apart from tool results.
  api_call   One model response. Claude Code writes one log line per content
             block and repeats the response's token usage on every line, so
             summing tokens over turns counts each response two to three times.
             The database does not store the response's message id, so a
             response is reconstructed (see _API_CALLS):
               1. Lines of one response share (model, input, cache_read,
                  cache_creation) inside a session. Output is NOT part of the
                  key: a response's first line can carry a provisional output
                  count (say 10) and a later line the final one (143). That is
                  routine in the March and April 2026 logs (Claude Code 2.1.7x
                  to 2.1.9x) and still happens now and then. The response's
                  output is the largest count seen on its lines.
               2. Two lines with the same key more than RESPONSE_GAP_S apart
                  are two responses (the same context sent again later).
             What was checked, 2026-10-02: every raw session log then on disk
             (142 files) was joined to the database by line uuid, which gave
             134,241 of the record's 338,095 responses with their message ids,
             610 of the 658 March responses among them. On those rows: input,
             cache_read and cache_creation never differ between the lines of a
             response; 334 responses change their output count between lines
             (315 of them in March) and the last line always carries the
             largest; and this rule gives the same response count and the same
             four token sums as grouping by message id, in total, per session
             (144 of 144) and per model. Per-line sums are about 2.6x too high.
             What was NOT checked: the other 60 percent of the record, whose
             logs were already pruned. That includes nearly all of April and
             May 2026 (550 of 12,517 responses checked). Those are counted by
             the same rule on the evidence above, not verified. Storing
             message.id in the exporter would remove the inference.
  session    One session log file. Subagent logs are not exported, so the
             turns, tool uses and tokens a subagent spent are NOT in any figure
             here. Token totals are therefore a floor on real usage.
  project    The basename of the working directory of a session's first turn.
             The exporter stores only the basename, so a session started in a
             subdirectory shows up under that subdirectory's name ("web",
             "public"). That cannot be repaired from the database.
  tool_uses  Taken from turns.n_tool_uses. The tool_calls table has no key and
             carries a few thousand re-inserted rows, so per-tool counts are
             scaled back per turn (see _tools).

COVERAGE, HONESTLY
  The earliest record is 2026-03-08, but the exporter first ran on 2026-07-07
  (RECORDING_BEGAN). What it holds from before that date is only the sessions
  whose logs were still on disk that day, so March to May are undercounted and
  nothing before March survived. Say so wherever these totals are published.
"""

import json
import re
import sys
import time
from datetime import date, datetime, timedelta, timezone
from pathlib import Path

DEFAULT_DB = Path(__file__).resolve().parent.parent / "data" / "claude-activity.duckdb"
SOURCE_NAME = "claude-activity.duckdb"

# The day scripts/claude-activity-export.py first ran (commit bcc0ab7, and the
# oldest row in the database's _watermark table). Before this day the record is
# only what had not yet been pruned from the raw logs.
RECORDING_BEGAN = "2026-07-07"

# Where the pilot lives. Used only for hour-of-day, where UTC hours would put
# the working afternoon at 19:00.
LOCAL_TZ = "America/Detroit"

# Rows that are not a model: Claude Code's own placeholder replies.
_NOT_A_MODEL = "<synthetic>"

_TZ_RE = re.compile(r"^[A-Za-z0-9_+\-/]{1,64}$")


def _warn(msg: str) -> None:
    print(f"activity_db: {msg}", file=sys.stderr)


# ---------------------------------------------------------------------------
# Opening the database
# ---------------------------------------------------------------------------

def open_db(db_path=DEFAULT_DB, retries: int = 3, wait_s: float = 2.0):
    """Open the durable record read-only. Returns a connection or None.

    Never opens it writable: the exporter owns the file. The exporter holds a
    write lock for about 20 seconds every 4 hours, so a locked file is retried
    briefly before giving up.
    """
    try:
        import duckdb
    except ImportError:
        _warn(f"duckdb is not installed for {sys.executable}; durable record unavailable")
        return None

    path = Path(db_path)
    if not path.exists():  # follows the symlink, so a missing /mnt/ursa lands here
        _warn(f"{path} is missing (is /mnt/ursa mounted?); durable record unavailable")
        return None

    last_err = None
    for attempt in range(retries):
        try:
            return duckdb.connect(str(path), read_only=True)
        except Exception as e:  # duckdb.IOException on a held lock, others on corruption
            last_err = e
            if attempt + 1 < retries:
                time.sleep(wait_s)
    _warn(f"could not open {path} read-only after {retries} tries: {last_err}")
    return None


# ---------------------------------------------------------------------------
# SQL building blocks
# ---------------------------------------------------------------------------

def _local(col: str, tz: str) -> str:
    """SQL for a UTC timestamp column shifted into tz. turns.ts is naive UTC."""
    if tz == "UTC":
        return col
    if not _TZ_RE.match(tz):
        raise ValueError(f"not a timezone name: {tz!r}")
    return f"(({col} AT TIME ZONE 'UTC') AT TIME ZONE '{tz}')"


# Two lines with the same response key further apart than this are two
# responses. Measured over the whole record on 2026-10-02 (373,407 gaps between
# consecutive same-key lines): inside one response the largest gap is 512 s (a
# long reply whose first block is logged at the start and last block at the
# end); between two responses that share a key the smallest is 44,101 s. Nothing
# falls between, so one hour sits well inside the empty band. The rule cannot
# see a second response with the same key inside the hour (it would be merged
# into the first); none occurred in the 134,241 responses checked by message id.
RESPONSE_GAP_S = 3600

_RESPONSE_KEY = "session_id, model, input_tokens, cache_read_tokens, cache_creation_tokens"

# One row per model response, see "api_call" in the module docstring. ts is the
# first line of the response, output_tokens the largest count on its lines.
# `part` numbers the runs of same-key lines that sit within RESPONSE_GAP_S of
# each other; almost every key has exactly one.
_API_CALLS = f"""
    SELECT session_id, model, input_tokens,
           max(output_tokens) AS output_tokens,
           cache_read_tokens, cache_creation_tokens,
           min(ts) AS ts
    FROM (
        SELECT *, sum(new_part) OVER (
                   PARTITION BY {_RESPONSE_KEY} ORDER BY ts, uuid
                   ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS part
        FROM (
            SELECT {_RESPONSE_KEY}, output_tokens, ts, uuid,
                   CASE WHEN epoch(ts) - epoch(lag(ts) OVER (
                                 PARTITION BY {_RESPONSE_KEY} ORDER BY ts, uuid))
                             > {RESPONSE_GAP_S}
                        THEN 1 ELSE 0 END AS new_part
            FROM turns
            WHERE role = 'assistant' AND model IS NOT NULL AND model <> '{_NOT_A_MODEL}'
        )
    )
    GROUP BY {_RESPONSE_KEY}, part
"""


def _iso_day(d) -> str:
    return d.isoformat() if isinstance(d, (date, datetime)) else str(d)[:10]


def _coverage(con) -> dict:
    first_ts, last_ts = con.execute("SELECT min(ts), max(ts) FROM turns").fetchone()
    return {
        "first_ts": first_ts.isoformat() + "Z",
        "last_ts": last_ts.isoformat() + "Z",
        "recording_began": RECORDING_BEGAN,
    }


def _totals(con) -> dict:
    sessions, turns, user_turns, assistant_turns, tool_uses = con.execute("""
        SELECT count(DISTINCT session_id), count(*),
               count(*) FILTER (WHERE role = 'user'),
               count(*) FILTER (WHERE role = 'assistant'),
               coalesce(sum(n_tool_uses), 0)
        FROM turns
    """).fetchone()
    api_calls, tin, tout, tcr, tcc = con.execute(f"""
        SELECT count(*), coalesce(sum(input_tokens), 0), coalesce(sum(output_tokens), 0),
               coalesce(sum(cache_read_tokens), 0), coalesce(sum(cache_creation_tokens), 0)
        FROM ({_API_CALLS})
    """).fetchone()
    return {
        "sessions": int(sessions),
        "turns": int(turns),
        "user_turns": int(user_turns),
        "assistant_turns": int(assistant_turns),
        "tool_uses": int(tool_uses),
        "api_calls": int(api_calls),
        "tokens": {
            "input": int(tin),
            "output": int(tout),
            "cache_read": int(tcr),
            "cache_creation": int(tcc),
        },
    }


def _daily(con, tz: str) -> list:
    day = f"CAST({_local('ts', tz)} AS DATE)"
    rows = con.execute(f"""
        WITH act AS (
            SELECT {day} AS d, count(*) AS turns,
                   count(DISTINCT session_id) AS sessions,
                   coalesce(sum(n_tool_uses), 0) AS tool_uses
            FROM turns GROUP BY 1
        ),
        started AS (
            SELECT d, count(*) AS n FROM (
                SELECT CAST({_local('min(ts)', tz)} AS DATE) AS d
                FROM turns GROUP BY session_id
            ) GROUP BY 1
        ),
        tok AS (
            SELECT {day} AS d,
                   sum(input_tokens) AS i, sum(output_tokens) AS o,
                   sum(cache_read_tokens) AS cr, sum(cache_creation_tokens) AS cc
            FROM ({_API_CALLS}) GROUP BY 1
        )
        SELECT act.d, act.turns, act.sessions, coalesce(started.n, 0), act.tool_uses,
               coalesce(tok.i, 0), coalesce(tok.o, 0), coalesce(tok.cr, 0), coalesce(tok.cc, 0)
        FROM act LEFT JOIN started USING (d) LEFT JOIN tok USING (d)
        ORDER BY act.d
    """).fetchall()
    return [
        {
            "date": _iso_day(d),
            "turns": int(turns),
            "sessions": int(sessions),
            "sessions_started": int(started),
            "tool_uses": int(tools),
            "tokens": {
                "input": int(i), "output": int(o),
                "cache_read": int(cr), "cache_creation": int(cc),
            },
        }
        for d, turns, sessions, started, tools, i, o, cr, cc in rows
    ]


def _hourly(con, tz: str) -> list:
    turns = dict(con.execute(
        f"SELECT hour({_local('ts', tz)}), count(*) FROM turns GROUP BY 1"
    ).fetchall())
    started = dict(con.execute(f"""
        SELECT hour({_local('s', tz)}), count(*)
        FROM (SELECT min(ts) AS s FROM turns GROUP BY session_id) GROUP BY 1
    """).fetchall())
    return [
        {"hour": h, "sessions_started": int(started.get(h, 0)), "turns": int(turns.get(h, 0))}
        for h in range(24)
    ]


def _models(con, tz: str) -> list:
    day = f"CAST({_local('ts', tz)} AS DATE)"
    rows = con.execute(f"""
        SELECT model, count(*), sum(input_tokens), sum(output_tokens),
               sum(cache_read_tokens), sum(cache_creation_tokens),
               min({day}), max({day})
        FROM ({_API_CALLS}) GROUP BY model ORDER BY sum(output_tokens) DESC, model
    """).fetchall()
    return [
        {
            "model": m,
            "api_calls": int(n),
            "input_tokens": int(i),
            "output_tokens": int(o),
            "cache_read_tokens": int(cr),
            "cache_creation_tokens": int(cc),
            "first_day": _iso_day(a),
            "last_day": _iso_day(b),
        }
        for m, n, i, o, cr, cc, a, b in rows
    ]


def _projects(con, tz: str) -> list:
    # A session belongs to the project it started in (the basename of its first
    # working directory). Rolling up by each turn's directory instead splits one
    # session across every subdirectory it visited.
    rows = con.execute(f"""
        WITH s AS (
            SELECT session_id, arg_min(project, ts) AS project, count(*) AS turns,
                   coalesce(sum(n_tool_uses), 0) AS tool_uses,
                   min(ts) AS a, max(ts) AS b
            FROM turns GROUP BY session_id
        )
        SELECT coalesce(project, 'unknown'), count(*), sum(turns), sum(tool_uses),
               CAST({_local('min(a)', tz)} AS DATE), CAST({_local('max(b)', tz)} AS DATE)
        FROM s GROUP BY 1 ORDER BY sum(turns) DESC, 1
    """).fetchall()
    return [
        {
            "project": p,
            "sessions": int(n),
            "turns": int(t),
            "tool_uses": int(tu),
            "first_active": _iso_day(a),
            "last_active": _iso_day(b),
        }
        for p, n, t, tu, a, b in rows
    ]


def _tools(con) -> list:
    # tool_calls has no primary key, and when the exporter re-reads a line it
    # inserts that line's tool rows again (the turn itself is protected by its
    # uuid key). So each turn's rows are scaled to the count the turn recorded:
    # a turn that says it made 1 call and has 2 identical rows contributes 1.
    rows = con.execute("""
        WITH per AS (
            SELECT turn_uuid, tool_name, count(*) AS c FROM tool_calls GROUP BY 1, 2
        ),
        tot AS (SELECT turn_uuid, sum(c) AS s FROM per GROUP BY 1)
        SELECT coalesce(per.tool_name, 'unknown'),
               CAST(round(sum(per.c * t.n_tool_uses / tot.s)) AS BIGINT) AS calls
        FROM per JOIN tot USING (turn_uuid) JOIN turns t ON t.uuid = per.turn_uuid
        GROUP BY 1 ORDER BY calls DESC, 1
    """).fetchall()
    return [{"tool": name, "calls": int(c)} for name, c in rows if c > 0]


# ---------------------------------------------------------------------------
# Streaks
# ---------------------------------------------------------------------------

def compute_streaks(days, today) -> dict:
    """Longest and current run of consecutive active days.

    days: iterable of "YYYY-MM-DD". today: a date, in the same zone as the days.
    The current streak is the run ending on the last active day, and it counts
    only if that day is today or yesterday (today may simply not be over yet).
    Anything older means the streak is broken, so it is 0.
    """
    ds = sorted({date.fromisoformat(d) for d in days})
    if not ds:
        return {"longest": 0, "longest_start": None, "longest_end": None,
                "current": 0, "as_of": today.isoformat()}

    best_len, best_end = 0, ds[0]
    run = 0
    prev = None
    for d in ds:
        run = run + 1 if prev is not None and (d - prev).days == 1 else 1
        if run > best_len:
            best_len, best_end = run, d
        prev = d
    # `run` is now the length of the run that ends on the last active day.
    current = run if (today - ds[-1]).days <= 1 else 0

    return {
        "longest": best_len,
        "longest_start": (best_end - timedelta(days=best_len - 1)).isoformat(),
        "longest_end": best_end.isoformat(),
        "current": current,
        "as_of": today.isoformat(),
    }


def _today_in(tz: str) -> date:
    if tz == "UTC":
        return datetime.now(timezone.utc).date()
    from zoneinfo import ZoneInfo
    return datetime.now(ZoneInfo(tz)).date()


# ---------------------------------------------------------------------------
# The one call most callers want
# ---------------------------------------------------------------------------

def load(db_path=DEFAULT_DB, day_tz: str = "UTC", hour_tz: str = LOCAL_TZ, today=None):
    """All durable aggregates as one dict, or None (reason on stderr).

    day_tz buckets days, first/last dates and streaks. It defaults to UTC, which
    is what the database's own span is expressed in. hour_tz buckets the
    hour-of-day distribution; if that zone cannot be resolved the hours fall
    back to UTC and the returned hour_tz says so.
    """
    con = open_db(db_path)
    if con is None:
        return None
    try:
        n_turns = con.execute("SELECT count(*) FROM turns").fetchone()[0]
        if not n_turns:
            _warn(f"{db_path} has no turns (mid-rebuild?); durable record unavailable")
            return None

        try:
            hourly = _hourly(con, hour_tz)
        except Exception as e:
            _warn(f"hour-of-day in {hour_tz} failed ({e}); using UTC hours")
            hour_tz = "UTC"
            hourly = _hourly(con, hour_tz)

        daily = _daily(con, day_tz)
        models = _models(con, day_tz)
        projects = _projects(con, day_tz)
        totals = _totals(con)
        totals["projects"] = len(projects)
        totals["models"] = len(models)

        coverage = _coverage(con)
        coverage["first_day"] = daily[0]["date"]
        coverage["last_day"] = daily[-1]["date"]

        return {
            "source": SOURCE_NAME,
            "db_path": str(db_path),
            "day_tz": day_tz,
            "hour_tz": hour_tz,
            "coverage": coverage,
            "totals": totals,
            "active_days": len(daily),
            "daily": daily,
            "hourly": hourly,
            "models": models,
            "projects": projects,
            "tools": _tools(con),
            "streaks": compute_streaks(
                [d["date"] for d in daily], today or _today_in(day_tz)
            ),
        }
    except Exception as e:
        _warn(f"query against {db_path} failed: {type(e).__name__}: {e}")
        return None
    finally:
        con.close()


# ---------------------------------------------------------------------------
# Cost at list price
# ---------------------------------------------------------------------------
#
# THE price table. One place, dated. USD per million tokens, Anthropic
# first-party API, standard speed.
#
# Taken 2026-10-02 from the claude-api skill bundled with Claude Code 2.1.287,
# whose model table is stamped "cached: 2026-09-25":
#   input and output   the "Current Models" table
#   cache_read         0.1x input, except Fable 5.1 (0.025x, $0.25) and
#                      Opus 5.5 (0.05x, $0.20), both stated outright there
#   cache writes       1.25x input for the 5 minute TTL, 2x input for the
#                      1 hour TTL, on every model
#
# To add a model: confirm its price against the current skill or the pricing
# page, add the row, move PRICES_AS_OF. A model that is not in this table makes
# the total None. Never guess a row.
PRICES_AS_OF = "2026-09-25"
PRICES_SOURCE = "claude-api skill model table (Anthropic API list prices)"
CACHE_WRITE_MULTIPLIER = {"5m": 1.25, "1h": 2.0}

PRICES = {
    #                      input  output  cache_read
    "claude-fable-5-1":   (10.00, 50.00, 0.25),
    "claude-fable-5":     (10.00, 50.00, 1.00),
    "claude-opus-5-5":    (4.00, 20.00, 0.20),
    "claude-opus-5":      (5.00, 25.00, 0.50),
    "claude-opus-4-8":    (5.00, 25.00, 0.50),
    "claude-opus-4-7":    (5.00, 25.00, 0.50),
    "claude-opus-4-6":    (5.00, 25.00, 0.50),
    "claude-sonnet-5-5":  (2.00, 10.00, 0.20),
    "claude-sonnet-5":    (2.00, 10.00, 0.20),
    "claude-sonnet-4-6":  (3.00, 15.00, 0.30),
    "claude-haiku-4-5":   (1.00, 5.00, 0.10),
}
# Dated ids the catalog lists as the full id of a priced alias.
PRICE_ALIASES = {"claude-haiku-4-5-20251001": "claude-haiku-4-5"}


def price_usage(models, cache_write_ttl=None) -> dict:
    """List-price cost of a load()["models"] list.

    The total is a number only when BOTH hold:
      1. every model with tokens is in PRICES, and
      2. cache_write_ttl is "5m" or "1h".
    Otherwise totalUSD is None and `reason` says why. The database does not
    record which TTL a cache write used, and the two are priced 1.25x and 2x
    input, so callers reading claude-activity.duckdb must pass None. (Raw logs
    from September 2026 show 1 hour writes only, but that says nothing certain
    about March.)

    What can be stated without that knowledge is returned separately and is
    never to be shown as a total: the input, output and cache-read components,
    and the cache-write component under each TTL.

    This is list price for the tokens, not an invoice. It assumes standard
    speed; the database does not record fast-mode requests, which bill at 2x.
    """
    unpriced = []
    comp = {"input": 0.0, "output": 0.0, "cacheRead": 0.0}
    cw_base = 0.0  # cache-write tokens priced at 1x input, multiplier applied below
    cw_tokens = 0
    per_model = {}

    for m in models:
        mid = m["model"]
        tokens = (m["input_tokens"] + m["output_tokens"]
                  + m["cache_read_tokens"] + m["cache_creation_tokens"])
        if tokens == 0:
            continue
        price = PRICES.get(PRICE_ALIASES.get(mid, mid))
        if price is None:
            unpriced.append(mid)
            continue
        p_in, p_out, p_cr = price
        c_in = m["input_tokens"] * p_in / 1e6
        c_out = m["output_tokens"] * p_out / 1e6
        c_cr = m["cache_read_tokens"] * p_cr / 1e6
        c_cw = m["cache_creation_tokens"] * p_in / 1e6
        comp["input"] += c_in
        comp["output"] += c_out
        comp["cacheRead"] += c_cr
        cw_base += c_cw
        cw_tokens += m["cache_creation_tokens"]
        per_model[mid] = (
            round(c_in + c_out + c_cr + c_cw * CACHE_WRITE_MULTIPLIER[cache_write_ttl], 2)
            if cache_write_ttl in CACHE_WRITE_MULTIPLIER else None
        )

    reasons = []
    if unpriced:
        reasons.append("no confirmed price for: " + ", ".join(sorted(unpriced)))
    if cache_write_ttl not in CACHE_WRITE_MULTIPLIER:
        reasons.append(
            "the durable record does not say whether cache writes used the "
            "5 minute or the 1 hour TTL, which are priced differently"
        )

    total = None
    if not reasons:
        total = round(sum(comp.values()) + cw_base * CACHE_WRITE_MULTIPLIER[cache_write_ttl], 2)

    return {
        "totalUSD": total,
        "reason": "; ".join(reasons) if reasons else None,
        "basis": "Anthropic API list price, standard speed. Not an invoice.",
        "pricesAsOf": PRICES_AS_OF,
        "pricesSource": PRICES_SOURCE,
        "unpricedModels": sorted(unpriced),
        "cacheWriteTtl": cache_write_ttl if cache_write_ttl in CACHE_WRITE_MULTIPLIER else None,
        # Parts, not a total. With unpriced models these cover priced models only.
        "componentsUSD": {k: round(v, 2) for k, v in comp.items()},
        "cacheWrite": {
            "tokens": cw_tokens,
            "usdIfAll5m": round(cw_base * CACHE_WRITE_MULTIPLIER["5m"], 2),
            "usdIfAll1h": round(cw_base * CACHE_WRITE_MULTIPLIER["1h"], 2),
        },
        "perModelUSD": per_model if total is not None else {},
    }


# ---------------------------------------------------------------------------
# Inspection
# ---------------------------------------------------------------------------

def main() -> int:
    import argparse
    ap = argparse.ArgumentParser(description="Print durable Claude activity aggregates as JSON")
    ap.add_argument("--db", default=str(DEFAULT_DB), help="DuckDB path (opened read-only)")
    ap.add_argument("--day-tz", default="UTC", help="zone for days and streaks (default UTC)")
    ap.add_argument("--hour-tz", default=LOCAL_TZ, help=f"zone for hour of day (default {LOCAL_TZ})")
    ap.add_argument("--summary", action="store_true",
                    help="leave out the per-day, per-project and per-tool lists")
    args = ap.parse_args()

    agg = load(args.db, day_tz=args.day_tz, hour_tz=args.hour_tz)
    if agg is None:
        return 1
    agg["list_price"] = price_usage(agg["models"])
    if args.summary:
        for key in ("daily", "projects", "tools"):
            agg[key] = f"{len(agg[key])} rows (omitted by --summary)"
    print(json.dumps(agg, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
