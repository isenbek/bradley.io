#!/usr/bin/env bash
# bradleyio 4-hour data refresh + mirror to cjgaldescom.
# Invoked by cron every 4 hours. Preserves the exact pipeline chain
# that used to live inline in crontab (moved here for line-length reasons).

LOG=/tmp/bradleyio-pipeline.log
PY=/home/bisenbek/.pyenv/versions/3.13.3/envs/tinymachines/bin/python3
SCRIPTS=/home/bisenbek/projects/bradleyio/scripts
export PATH=/home/bisenbek/.nvm/versions/node/v24.0.1/bin:/usr/local/bin:/usr/bin:/bin

{
  "$SCRIPTS/sync-dc1-claude.sh"
  # Analytical export of Claude activity → data/claude-activity.duckdb (incremental,
  # ~20s). Standalone (not in the && chain) so a hiccup can't block the site pipeline.
  "$PY" "$SCRIPTS/claude-activity-export.py"
  "$PY" "$SCRIPTS/claude-activity-viz.py" --parquet --zip
  # Each pipeline stands alone (2026-10-02). They used to be chained with &&,
  # so one failing step silently skipped everything after it. Each now reads
  # the durable DuckDB above directly, keeps its previous output when it
  # cannot do its job, and says so in this log.
  "$PY" "$SCRIPTS/refresh-stats-cache.py"
  "$PY" "$SCRIPTS/ai-pilot-pipeline.py"
  "$PY" "$SCRIPTS/nightly-pipeline.py"
  "$PY" "$SCRIPTS/papers-pipeline.py" --prune
  # cost-model-pipeline.py is deliberately NOT run here any more (2026-10-02).
  # public/data/cost-model.json is a frozen case study of 2025-12-01 to
  # 2026-03-26; its inputs no longer cover that window, and regenerating it
  # every 4 hours had decayed it to "activeDays 1, velocity 1710x". The script
  # now refuses to overwrite a frozen file without --unfreeze.
  # Site search (vectl over every page; scripts/site-search/). Rebuilds into
  # a new directory and swaps a symlink only when complete, so a failed run
  # leaves the live index as it was.
  /mnt/nom01/envs/bradleyio-search/bin/python "$SCRIPTS/site-search/index.py"
  "$SCRIPTS/mirror-to-cjgaldescom.sh"
} >> "$LOG" 2>&1
