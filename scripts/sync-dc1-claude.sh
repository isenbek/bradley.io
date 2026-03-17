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

rsync -az --timeout=30 --delete -e "$SSH_CMD" \
    "$DC1_HOST:~/.claude/projects/" "$MIRROR_DIR/projects/"

rsync -az --timeout=30 --delete -e "$SSH_CMD" \
    "$DC1_HOST:~/.claude/plans/" "$MIRROR_DIR/plans/"

rsync -az --timeout=30 -e "$SSH_CMD" \
    "$DC1_HOST:~/.claude/history.jsonl" "$MIRROR_DIR/history.jsonl" 2>/dev/null || true

echo "DC-1 sync complete: $(find "$MIRROR_DIR/projects/" -name '*.jsonl' -not -path '*/memory/*' -not -path '*/subagents/*' | wc -l) session files"
