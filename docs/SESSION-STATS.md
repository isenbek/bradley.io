# SESSION-STATS — Lay of the Land

A map of where Claude Code session data lives on this stack, how it flows
through the bradley.io pipelines, and what comes out the other end. Written
for the modeling team building a world model from chat history.

> Hosts: **DC-0** = `impera` (this machine, dev/backup), **DC-1** = `Monroe`
> at `campaignbrain.dev:1223` (production). Most active work happens on
> DC-1; DC-0 receives a mirror every 4h.

---

## 1. Raw session data — where it lives

### On each host
```
~/.claude/
├── projects/                       # session JSONLs, one dir per cwd
│   └── -home-bisenbek-projects-<X>/
│       ├── <session-uuid>.jsonl    # line-delimited events
│       └── <session-uuid>/         # per-session sidecar (memory, plans, etc.)
├── plans/                          # saved plan-mode plans
├── history.jsonl                   # cross-session prompt history
├── stats-cache.json                # daily activity rollup (see §3)
├── todos/                          # active TodoWrite state per session
├── telemetry/                      # OTLP traces/logs
└── settings.json                   # harness config
```

### DC-1 mirror on DC-0
```
~/.claude-dc1/
├── projects/        # rsynced from Monroe every 4h
├── plans/
└── history.jsonl
```
Synced by `scripts/sync-dc1-claude.sh` over SSH (key: `~/.ssh/id_ed25519_knowsynet`,
port `1223`, host `campaignbrain.dev`). Rsync is `--delete` for
`projects/` and `plans/` (full mirror) and append-style for history.

### Volume (snapshot 2026-05-02)
| Path                          | Size   |
|-------------------------------|--------|
| `~/.claude/projects/`         | 649 MB |
| `~/.claude-dc1/`              | 1.3 GB |
| `~/.claude/history.jsonl`     | 3.5 MB |
| `~/.claude/stats-cache.json`  |  12 KB |

Project encoding: `/home/bisenbek/projects/bradleyio` →
`-home-bisenbek-projects-bradleyio`. Slashes become dashes; reverse with
a simple replace.

### Session JSONL shape
Each line is a single JSON object — an event in the session. Common types
include user/assistant messages, tool uses, tool results, snapshots,
sidechain (subagent) frames. Top-level keys vary by event but every line
has `type` and a routing identifier. Open one with `jq -c .` for a feel.

---

## 2. Pipeline flow

Two cron entry points drive everything:

```
* * * * *      activity-pulse.py             (lightweight, every minute)
0 */4 * * *    scripts/refresh-4h.sh         (full chain, every 4 hours)
```

### Every minute — `activity-pulse.py`
Walks `~/.claude/projects/**/*.jsonl`, compares mtimes against
`/tmp/activity-pulse-state.json`, appends active minutes to
`/tmp/activity-pulse-log.json`, and writes a 24h hourly-bucketed rollup
to `public/data/activity-pulse.json`. Then `cron` mirrors that file to
`cjgaldescom/public/data/`. Cheap heartbeat — no JSONL parsing.

### Every 4 hours — `scripts/refresh-4h.sh`
```
sync-dc1-claude.sh                    # pull DC-1 → ~/.claude-dc1/
└── refresh-stats-cache.py            # rebuild ~/.claude/stats-cache.json
    └── nightly-pipeline.py           # → public/data/site-data.json
        └── ai-pilot-pipeline.py      # → public/data/ai-pilot-data.json
            └── papers-pipeline.py    # → public/data/papers-data.json
                └── cost-model-pipeline.py    # → public/data/cost-model.json
                    └── mirror-to-cjgaldescom.sh   # rsync public/data/
```
All output is appended to `/tmp/bradleyio-pipeline.log`. Each step is
gated by `&&` so a failure halts the chain (except `sync-dc1`, which is
allowed to partial-fail without blocking).

### What each pipeline reads
| Script                       | Reads from                                                              | Writes                              |
|------------------------------|-------------------------------------------------------------------------|-------------------------------------|
| `refresh-stats-cache.py`     | `~/.claude/projects/**/*.jsonl`                                         | `~/.claude/stats-cache.json`        |
| `nightly-pipeline.py`        | `docs/spicy-claude-web/*.json` (Claude.ai export), `gh` CLI, ai-pilot, CBAI | `public/data/site-data.json`     |
| `ai-pilot-pipeline.py`       | `~/.claude/{projects,plans,history.jsonl,stats-cache.json}` + DC-1 mirror | `public/data/ai-pilot-data.json`  |
| `papers-pipeline.py`         | `../terrapulse/workspaces/`, `../terrapulse/data/duckdb/papers.duckdb`  | `public/data/papers-data.json` + `public/data/papers/` thumbs |
| `cost-model-pipeline.py`     | `ai-pilot-data.json`, `site-data.json`, `nominate-ai-timeline.json`, `stats-cache.json` | `public/data/cost-model.json`     |
| `nominate-timeline-pipeline.py` (manual) | `gh` CLI org/user repos, CBAI summarizer (`http://127.0.0.1:3220`) | `public/data/<org-slug>-timeline.json` |
| `generate-mcp-catalog.py` (manual)       | each CB service `*.nominate.ai/openapi.json`                            | `public/data/mcp-catalog.json`    |

### Notable pipelines for world-model work
- **`refresh-stats-cache.py`** — independently parses every JSONL and
  rebuilds the same v2 stats schema Claude Code uses internally. Useful
  reference for token/turn counting from raw events.
- **`ai-pilot-pipeline.py`** — domain-classifies activity (Data
  Engineering / AI / IoT / etc.) via keyword dictionaries. Combines DC-0
  + DC-1 in one pass.
- **`activity-pulse.py`** — minute-resolution mtime delta, no parsing.
  Cheap signal of "was Claude active?" suitable for time-series features.

---

## 3. Outputs — `public/data/`

All world-facing aggregates land here. JSON, no auth, served by Next.js
at `/data/<file>.json`. Mirrored to `cjgaldescom/public/data/` at the
end of the 4h chain.

| File                          | Refresh   | Source                              | Purpose                                |
|-------------------------------|-----------|-------------------------------------|----------------------------------------|
| `activity-pulse.json`         | 1 min     | session JSONL mtimes                | 24h hourly active-minutes sparkline    |
| `ai-pilot-data.json`          | 4h        | DC-0 + DC-1 Claude data             | AI Pilot dashboard (sessions, domains, plans, tools) |
| `site-data.json`              | 4h        | Claude.ai export + GitHub + CBAI    | Homepage feed (projects, summaries)    |
| `papers-data.json`            | 4h        | TerraPulse workspaces + DuckDB      | `/papers` listing + previews           |
| `cost-model.json`             | 4h        | combined aggregates                 | `/cost-analysis` curves (cb* scope)    |
| `mcp-catalog.json`            | manual    | CB service OpenAPI specs            | `/mcp` showcase                        |
| `*-timeline.json`             | manual    | GitHub org/user via CBAI            | Per-org timelines (nominate-ai, sysforge-ai, tinymachines, isenbek) |
| `papers/*.{pdf,png}`          | 4h        | TerraPulse                          | Paper previews + thumbnails            |

### Stats-cache schema (v2)
```json
{
  "version": 2,
  "lastComputedDate": "YYYY-MM-DD",
  "dailyActivity": [
    {"date": "YYYY-MM-DD", "messageCount": N, "sessionCount": N, "toolCallCount": N},
    ...
  ]
}
```

---

## 4. Operational notes

- **Pipeline log**: `tail -f /tmp/bradleyio-pipeline.log` for live
  4h-chain output.
- **Python env**: `~/.pyenv/versions/3.13.3/envs/tinymachines/bin/python3`
  for most pipelines; `cost-model-pipeline.py` uses system
  `/usr/bin/python3` (stdlib only).
- **Optional env**: `CBAI_URL` (default `http://127.0.0.1:3220`),
  `CBAI_PROVIDER` (default `ollama`). `.env` in repo root is auto-loaded
  by `nightly-pipeline.py`.
- **Secrets to stay clear of when sharing data**:
  - `docs/spicy-claude-web/` — full Claude.ai conversation export
    (gitignored, ~40 MB, contains personal chats / memories / projects).
  - `~/.ssh/id_ed25519_knowsynet` — DC-1 sync key.
  - SSH host `campaignbrain.dev:1223` — production sync target.
- **Cjgaldescom mirror**: tail of every 4h chain rsyncs
  `bradleyio/public/data/` → `cjgaldescom/public/data/`. Safe (idempotent),
  but means cjgaldes.com displays bradley.io data until CJ owns the feed.

---

## 5. Suggested entry points for modeling

- **Raw turn-level corpus**: `~/.claude/projects/**/*.jsonl` + DC-1
  mirror. Line-delimited JSON, ~2 GB combined.
- **Plan corpus**: `~/.claude/plans/` and `~/.claude-dc1/plans/`
  (markdown, structured).
- **Daily aggregate ground truth**: `~/.claude/stats-cache.json` —
  message/session/tool counts per day.
- **Cross-session prompts**: `~/.claude/history.jsonl` — every prompt
  the user has typed across sessions.
- **Domain-labeled activity**: `public/data/ai-pilot-data.json` already
  has keyword-based domain classification you can use as weak labels.
