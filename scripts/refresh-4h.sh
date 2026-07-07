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
  "$PY" "$SCRIPTS/refresh-stats-cache.py" \
    && "$PY" "$SCRIPTS/nightly-pipeline.py" \
    && "$PY" "$SCRIPTS/ai-pilot-pipeline.py" \
    && "$PY" "$SCRIPTS/papers-pipeline.py" \
    && /usr/bin/python3 "$SCRIPTS/cost-model-pipeline.py"
  "$SCRIPTS/mirror-to-cjgaldescom.sh"
} >> "$LOG" 2>&1
