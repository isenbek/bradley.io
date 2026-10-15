#!/usr/bin/env bash
# Ship beta.bradley.io after work on a GitHub issue, in the one order (Brad, 2026-10-14: "you worked items from gh;
# after testing + linting, push and commit to github, then deploy the site"):
#
#   1. refuse unless the work is committed (a real message, written by hand; nothing here writes one)
#   2. the check: data, typecheck, lint with zero warnings, build, the site in headless Chrome   (bun run check: kit check)
#   3. push to GitHub
#   4. deploy                                                                                    (bun run deploy: kit deploy)
#   5. the same browser check against the LIVE site
#   6. report on each issue named: live, which commit, checked; --close closes them as well
#
# Stops at the first step that fails, so nothing reaches GitHub unchecked and nothing is deployed unpushed.
#   ./scripts/ship.sh                  check, push, deploy, check live
#   ./scripts/ship.sh 11 12            ...and comment on issues #11 and #12 of isenbek/bradley.io
#   ./scripts/ship.sh --close 11       ...and close #11 with that comment
set -euo pipefail
cd "$(dirname "$0")/.."
export PATH="$HOME/.bun/bin:$PATH"
REPO=isenbek/bradley.io
SITE=https://beta.bradley.io
CLOSE= ISSUES=()
for a in "$@"; do case $a in --close) CLOSE=1 ;; [0-9]*) ISSUES+=("$a") ;; *) echo "ship: unknown argument $a"; exit 2 ;; esac; done
say() { printf '\n\033[1;36m== %s\033[0m\n' "$*"; }

say "1. committed?"
dirty=$(git status --porcelain -- . | grep -v -E '^\?\? (out|public/data)/' || true)
[[ -z "$dirty" ]] || { echo "refusing: beta/ has uncommitted changes; commit them with a real message first:"; echo "$dirty"; exit 1; }
head=$(git rev-parse --short HEAD); echo "HEAD $head: $(git log -1 --format=%s)"

say "2. test and lint"
bun run check 2>&1 | grep -E "^(FAIL|== )|ALL OK|FAILED" || true   # every FAIL line shows, not only the last few
[[ "$(cat out/check-ok 2>/dev/null)" == "$head" ]] || { echo "refusing: the check did not pass on $head"; exit 1; }

say "3. push"
git push -q && echo "pushed $head to $(git rev-parse --abbrev-ref --symbolic-full-name @{u})"

say "4. deploy"
bun run deploy 2>&1 | tail -2

say "5. check the live site"
bun run scripts/check-site.ts "$SITE" | tail -1 | tee /tmp/ship-live.$$ | grep -q "ALL OK" || { cat /tmp/ship-live.$$; rm -f /tmp/ship-live.$$; echo "the live check FAILED: deployed but not verified; look before reporting"; exit 1; }
rm -f /tmp/ship-live.$$; echo "live check: ALL OK"

if ((${#ISSUES[@]})); then
  say "6. report"
  msg="Live at $SITE, beta commit $head ($(git log -1 --format=%s)). Typecheck, lint, build and the browser check passed before the push, and the browser check passed again on the live site."
  for n in "${ISSUES[@]}"; do
    if [[ -n "$CLOSE" ]]; then gh issue close "$n" -R "$REPO" -c "$msg" >/dev/null && echo "closed #$n"
    else gh issue comment "$n" -R "$REPO" -b "$msg" >/dev/null && echo "commented on #$n"; fi
  done
fi
echo; echo "shipped $head"
