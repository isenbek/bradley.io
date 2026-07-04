# INTROSPECT-SERVICE — the Claude × GitHub activity aggregator

**What it is.** A cron-driven data pipeline that turns raw *operator activity* —
Claude Code sessions and GitHub/git history — into the live JSON feeds the site
renders (the homepage activity pulse, the AI-Pilot dashboard, cost model, project
dossiers, mission timelines). It is the site's introspection layer: bradley.io
watching itself being built.

It runs entirely **local** (anti-cloud): plain `cron` + Python scripts writing to
`public/data/*.json`. No service daemon, no queue — just scheduled scripts and a
log file. This doc describes the moving parts and how to introspect its health.

---

## TL;DR health check

```bash
# 1. Is the minutely pulse fresh? (should be < 60s old)
stat -c '%y' public/data/activity-pulse.json

# 2. Are the 4-hourly outputs fresh? (should be < 4h old)
ls -l --time-style=+%H:%M public/data/{site-data,ai-pilot-data,papers-data,cost-model}.json

# 3. Did the last run finish clean?
tail -30 /tmp/bradleyio-pipeline.log

# 4. Are the upstream deps alive?
gh auth status                                        # GitHub token (org timelines)
ssh -p 1223 -i ~/.ssh/id_ed25519_knowsynet campaignbrain.dev 'echo ok'   # DC-1 sync
```

Green = pulse < 60s, 4-hourly outputs < 4h, log tail ends with `Done!`, `gh`
logged in, DC-1 reachable.

---

## Cadences (cron, user `bisenbek`)

| When | Entry | Does |
|---|---|---|
| **every minute** | `activity-pulse.py` | minute-resolution Claude activity → homepage pulse, then copies to cjgaldescom |
| **every 4h (`:00`)** | `refresh-4h.sh` | the full aggregation chain (see below) |
| **daily 05:00** | `nominate-timeline-pipeline.py` ×4 targets | GitHub org → repo/commit timelines (`gh`-fed), then mirror |

`crontab -l` is the source of truth. The 4-hourly and daily chains both append to
`/tmp/bradleyio-pipeline.log`.

---

## The 4-hourly chain — `scripts/refresh-4h.sh`

Runs in strict order; a `&&` failure short-circuits the Python core (the sync and
mirror bookends always run). Python is the pyenv env
`~/.pyenv/versions/3.13.3/envs/tinymachines/bin/python3` unless noted.

```
sync-dc1-claude.sh          # 1. rsync remote Claude sessions → ~/.claude-dc1
  └─ refresh-stats-cache.py # 2. rebuild ~/.claude/stats-cache.json from JSONL
  └─ nightly-pipeline.py    # 3. → public/data/site-data.json   (the core aggregator)
  └─ ai-pilot-pipeline.py   # 4. → public/data/ai-pilot-data.json
  └─ papers-pipeline.py     # 5. → public/data/papers-data.json
  └─ cost-model-pipeline.py # 6. → public/data/cost-model.json   (/usr/bin/python3, stdlib)
mirror-to-cjgaldescom.sh    # 7. rsync public/data → ../cjgaldescom/public/data
```

### Components

| Script | Reads | Writes | Notes |
|---|---|---|---|
| `activity-pulse.py` | `~/.claude/projects/**/*.jsonl` mtimes | `activity-pulse.json` | minutely; state in `/tmp/activity-pulse-{state,log}.json`; **local sessions only** (not DC-1). 24h hourly buckets. |
| `sync-dc1-claude.sh` | DC-1 `~/.claude/{projects,plans,history.jsonl}` | `~/.claude-dc1/` | rsync over SSH to `campaignbrain.dev:1223` (key `id_ed25519_knowsynet`). No `-e`: partial failures don't block the chain. |
| `refresh-stats-cache.py` | `~/.claude` **+ `~/.claude-dc1`** JSONL | `~/.claude/stats-cache.json` | rebuilds the v2 stats cache without needing interactive `claude stats`. |
| `nightly-pipeline.py` | local git repos, Claude-web export (`docs/spicy-claude-web`), `ai-pilot-data.json`, CBAI | **`site-data.json`** | **the core aggregator.** Stage 1 = repos+commits (local git). Flags: `--skip-ai`, `--skip-github`, `--verbose`. Config via `.env`. |
| `ai-pilot-pipeline.py` | `~/.claude` **+ `~/.claude-dc1`** projects/plans/history, stats-cache | `ai-pilot-data.json` | the AI-Pilot License dashboard (sessions, messages, skills, streak). |
| `papers-pipeline.py` | `../terrapulse/workspaces` + `papers.duckdb` | `papers-data.json` (+ preview imgs) | research studies/references. |
| `cost-model-pipeline.py` | `ai-pilot-data.json`, `site-data.json`, `nominate-ai-timeline.json` | `cost-model.json` | stdlib only; derives velocity/cost-savings for the Understanding series. |
| `nominate-timeline-pipeline.py` | **GitHub org repos via `gh` CLI** | `{nominate-ai,tinymachines,sysforge-ai,isenbek}-timeline.json` | daily 05:00; has a guard that refuses to overwrite with 0 repos (protects against a failed fetch). |
| `mirror-to-cjgaldescom.sh` | `public/data/` | `../cjgaldescom/public/data/` | idempotent rsync so cjgaldes.com serves the same feed. |

---

## Data sources

- **Claude Code sessions (local)** — `~/.claude/projects/**/*.jsonl` on this host (`impera`).
- **Claude Code sessions (DC-1)** — mirrored from `campaignbrain.dev` (Monroe) into
  `~/.claude-dc1/` by `sync-dc1-claude.sh`, then merged by the stats-cache and
  ai-pilot pipelines. The homepage *pulse* is local-only; the *dashboards* are local + DC-1.
- **git / commits** — local clones under `~/projects/*`, read directly (no network).
- **GitHub org repo lists / timelines** — the **`gh` CLI** (needs a valid token).
- **Claude web export** — `docs/spicy-claude-web/` (conversations/projects/memories).
- **CBAI enrichment** — `http://127.0.0.1:3220` (ollama), used by `nightly-pipeline.py`
  for AI summaries; skip with `--skip-ai`.

## Outputs → consumers

All land in `public/data/` (and are mirrored to cjgaldescom):

| File | Feeds |
|---|---|
| `activity-pulse.json` | homepage `ActivityPulse` (live 24h pulse) |
| `site-data.json` | projects index, dossiers, activity feed, stat strip, about |
| `ai-pilot-data.json` | `/ai-pilot` dashboard |
| `cost-model.json` | Understanding-series cost model |
| `papers-data.json` | papers/research pages |
| `mcp-catalog.json` | `/mcp` catalog (generated by `generate-mcp-catalog.py`) |
| `{org}-timeline.json` | mission timelines + per-repo dossier sparklines |

> Note: the pipeline writes into the working tree, so `git status` will always show
> `public/data/*.json` as modified. That is expected churn, not a pending edit.

---

## Configuration (`.env`, read by `nightly-pipeline.py`)

`CLAUDE_WEB_DATA_DIR`, `FEATURED_REPOS`, `RESEARCH_PROJECTS`, `PROJECT_ALIASES`,
`CBAI_URL`, `CBAI_PROVIDER`, `BIG_IDEAS_ORGS`. All have in-script defaults, so a
missing `.env` degrades gracefully rather than crashing.

---

## Failure modes & fixes

| Symptom | Cause | Fix |
|---|---|---|
| `activity-pulse.json` stale (> a few min) | minutely cron not firing, or `~/.claude/projects` gone | `crontab -l`; check cron is running; verify the dir exists |
| 4-hourly outputs stale (> 4h) | `refresh-4h.sh` erroring early | read `/tmp/bradleyio-pipeline.log`; run the chain by hand |
| **`ERROR: fetched 0 repos for <org>`** in log | **`gh` token expired** | **`gh auth login -h github.com`** (interactive) — timelines are preserved by the guard until then |
| `DC-1 sync complete: 0 session files` / rsync errors | DC-1 unreachable or key rotated | test the SSH one-liner above; check `id_ed25519_knowsynet` |
| CBAI timeouts in log | ollama at `:3220` down | start CBAI, or run `nightly-pipeline.py --skip-ai` |
| pipeline uses wrong Python | pyenv env missing | confirm `~/.pyenv/versions/3.13.3/envs/tinymachines` exists |

### Run the whole chain manually

```bash
./scripts/refresh-4h.sh                 # exactly what cron runs; logs to /tmp/bradleyio-pipeline.log
# or a single stage, verbose:
~/.pyenv/versions/3.13.3/envs/tinymachines/bin/python3 scripts/nightly-pipeline.py --verbose
```

---

## Status snapshot — 2026-07-04

- ✅ **Running & healthy.** `activity-pulse.json` fresh (~1 min); the 16:00 four-hourly
  run completed cleanly through `cost-model` (`Done!`). Claude aggregation (local + DC-1)
  and local-git commits both working; DC-1 SSH reachable live.
- ⚠️ **GitHub arm degraded.** The `gh` CLI token is **expired (401)**, so the daily
  05:00 org-timeline refresh fetched 0 repos and the safety guard held the previous
  data — the four `*-timeline.json` files are frozen at **2026-07-03 05:00**. Re-auth
  with `gh auth login -h github.com` to resume org-timeline / GitHub-issue updates.
  (The core 4-hourly aggregator does **not** depend on `gh` — it reads local git — so
  it is unaffected.)
