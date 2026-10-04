#!/usr/bin/env bash
#
# Resync components/kit/family-data.ts from the family registry.
#
# The registry (which sites exist, their hues, their order) lives in
# meatball-labs/family/family.json, the parent's repo, and its build writes
# dist/family.ts. This copies that file in, so the dots in this site's
# footer agree with meatball.ai's and sysforge.ai's. The dots' look stays the
# tinymachines kit's .family component.
#
#   ./scripts/sync-family.sh --check   exit 1 if the copy has drifted
#   ./scripts/sync-family.sh           re-copy
#
set -euo pipefail

SRC="${FAMILY_KIT_SRC:-$HOME/projects/meatball-labs/family}/dist/family.ts"
DST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/components/kit/family-data.ts"

if [[ ! -f "$SRC" ]]; then
  echo "✗ registry not found: $SRC (run meatball-labs/family/build.py)" >&2
  exit 2
fi
if [[ "${1:-}" == "--check" ]]; then
  if cmp -s "$SRC" "$DST"; then echo "✓ family registry current"; exit 0; fi
  echo "✗ family registry drifted: run scripts/sync-family.sh" >&2
  exit 1
fi
cp "$SRC" "$DST"
echo "✓ copied $(basename "$SRC") -> components/kit/family-data.ts"
