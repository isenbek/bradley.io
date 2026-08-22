#!/usr/bin/env bash
# Keep /junior/doc/session-log current. Armando cannot scroll the terminal —
# Claude Code redraws rather than scrolling — so this page IS his scrollback.
cd /home/bisenbek/projects/bradleyio || exit 1
SESSION_FILE=/home/bisenbek/.claude/projects/-home-bisenbek-projects-bradleyio/9c89bcb6-2c9d-42ca-b94f-2f288c8c5e8b.jsonl \
LIMIT=80 \
  /home/bisenbek/.nvm/versions/node/*/bin/node scripts/junior-session-log.mjs >/dev/null 2>&1 \
  || node scripts/junior-session-log.mjs >/dev/null 2>&1
