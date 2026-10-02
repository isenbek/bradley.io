#!/usr/bin/env bash
# Sync DC-1 (Monroe) Claude Code data to local mirror for pipeline aggregation
set -uo pipefail
# Note: no -e so partial sync failures don't block the pipeline

DC1_HOST="campaignbrain.dev"
DC1_PORT="1223"
DC1_KEY="$HOME/.ssh/id_ed25519_knowsynet"
MIRROR_DIR="$HOME/.claude-dc1"
SSH_CMD="ssh -p $DC1_PORT -i $DC1_KEY -o IdentitiesOnly=yes -o StrictHostKeyChecking=no -o BatchMode=yes"

mkdir -p "$MIRROR_DIR"

# --delete makes the mirror follow DC-1 exactly, INCLUDING its pruning: when
# Claude Code on DC-1 expires an old session file, this rsync removes our copy
# too. The mirror is therefore NOT a durable record. History is only durable
# because scripts/refresh-4h.sh runs claude-activity-export.py (the DuckDB
# export, data/claude-activity.duckdb) immediately after this script on every
# run, so each session is captured before a later sync can prune it. Nothing
# enforces that order: if this sync is ever run on its own schedule, or the
# export is moved or removed, pruned sessions are lost for good. Keep them
# together, sync first, export second.
rsync -az --timeout=30 --delete -e "$SSH_CMD" \
    "$DC1_HOST:~/.claude/projects/" "$MIRROR_DIR/projects/"

# ~/.claude/plans no longer exists on DC-1 (gone since about 2026-07-18, the
# date of the newest file in the mirror). Syncing a missing directory made
# every run log 'rsync: change_dir "/home/bisenbek/.claude/plans" failed'
# (code 23) plus a broken pipe. Ask first, and only sync if it is there. The
# existing mirror copy is left untouched when the remote directory is absent:
# deleting it is a decision for a person, not for a guard.
$SSH_CMD -o ConnectTimeout=15 "$DC1_HOST" 'test -d ~/.claude/plans' 2>/dev/null
plans_rc=$?
if [ "$plans_rc" -eq 0 ]; then
    rsync -az --timeout=30 --delete -e "$SSH_CMD" \
        "$DC1_HOST:~/.claude/plans/" "$MIRROR_DIR/plans/"
elif [ "$plans_rc" -eq 1 ]; then
    echo "DC-1 has no ~/.claude/plans; plans sync skipped (mirror copy left as is)"
else
    echo "DC-1 plans check failed (ssh exit $plans_rc); plans sync skipped"
fi

rsync -az --timeout=30 -e "$SSH_CMD" \
    "$DC1_HOST:~/.claude/history.jsonl" "$MIRROR_DIR/history.jsonl" 2>/dev/null || true

echo "DC-1 sync complete: $(find "$MIRROR_DIR/projects/" -name '*.jsonl' -not -path '*/memory/*' -not -path '*/subagents/*' | wc -l) session files"
