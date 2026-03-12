#!/usr/bin/env bash
# Sync DC-1 (Monroe) Claude Code data to local mirror for pipeline aggregation
set -euo pipefail

DC1_HOST="campaignbrain.dev"
DC1_PORT="1223"
MIRROR_DIR="$HOME/.claude-dc1"

mkdir -p "$MIRROR_DIR"

rsync -az --timeout=30 --delete -e "ssh -p $DC1_PORT" \
    "$DC1_HOST:~/.claude/projects/" "$MIRROR_DIR/projects/"

rsync -az --timeout=30 --delete -e "ssh -p $DC1_PORT" \
    "$DC1_HOST:~/.claude/plans/" "$MIRROR_DIR/plans/"

rsync -az --timeout=30 -e "ssh -p $DC1_PORT" \
    "$DC1_HOST:~/.claude/history.jsonl" "$MIRROR_DIR/history.jsonl" 2>/dev/null || true

echo "DC-1 sync complete: $(find "$MIRROR_DIR/projects/" -name '*.jsonl' -not -path '*/memory/*' -not -path '*/subagents/*' | wc -l) session files"
