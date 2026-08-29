#!/usr/bin/env bash
#
# Resync app/beta/kit/ from the tinymachines style kit.
#
# The kit is vendored rather than imported across repos; app/beta/kit/VENDORED-FROM.md
# says why. The cost of a copy is drift, so this script exists to make drift visible
# on demand instead of letting it accumulate silently.
#
#   ./scripts/sync-style-kit.sh --check   diff against upstream, change nothing, exit 1 if drifted
#   ./scripts/sync-style-kit.sh           re-copy, and rewrite the commit line in VENDORED-FROM.md
#
set -euo pipefail

SRC="${STYLE_KIT_SRC:-$HOME/projects/tinymachines/public}"
DST="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/app/beta/kit"

# The four things that are actually the artifact. Everything else upstream
# (STYLE.md, zoo.html, the check-*.py enforcement, tokens.static.css) is its
# documentation and stays at the source. fonts/og/ is excluded below: it is
# 5.1 MB of TTFs that only upstream's OpenGraph renderer needs.
FILES=(tokens.css components.css fonts.css)

if [[ ! -d "$SRC/style" ]]; then
  echo "✗ upstream not found: $SRC/style" >&2
  echo "  set STYLE_KIT_SRC if the repo lives elsewhere" >&2
  exit 2
fi

check_only=0
[[ "${1:-}" == "--check" ]] && check_only=1

drift=0
for f in "${FILES[@]}"; do
  if ! diff -q "$SRC/style/$f" "$DST/$f" >/dev/null 2>&1; then
    drift=1
    if (( check_only )); then
      echo "≠ $f"
      diff -u "$DST/$f" "$SRC/style/$f" | head -40 || true
    fi
  fi
done

# Fonts are compared by name and size only. They are binary and they do not
# change; a rename or a new weight is what this is actually watching for.
up_fonts="$(cd "$SRC/style/fonts" && find . -maxdepth 1 -name '*.woff2' -printf '%f %s\n' | sort)"
dn_fonts="$(cd "$DST/fonts"       && find . -maxdepth 1 -name '*.woff2' -printf '%f %s\n' | sort)"
if [[ "$up_fonts" != "$dn_fonts" ]]; then
  drift=1
  (( check_only )) && { echo "≠ fonts/"; diff <(echo "$dn_fonts") <(echo "$up_fonts") || true; }
fi

if (( check_only )); then
  if (( drift )); then
    echo
    echo "✗ app/beta/kit is behind $SRC/style — run without --check to resync"
    exit 1
  fi
  echo "✓ app/beta/kit matches $SRC/style"
  exit 0
fi

if (( ! drift )); then
  echo "✓ already in sync, nothing copied"
  exit 0
fi

for f in "${FILES[@]}"; do
  cp "$SRC/style/$f" "$DST/$f"
  echo "→ $f"
done

# rsync would be tidier but is not guaranteed present. Mirror by hand, and
# delete fonts upstream no longer ships so a rename does not leave both.
find "$DST/fonts" -maxdepth 1 -name '*.woff2' -delete
cp "$SRC"/style/fonts/*.woff2 "$SRC"/style/fonts/*.txt "$SRC"/style/fonts/README.md "$DST/fonts/"
echo "→ fonts/ ($(find "$DST/fonts" -name '*.woff2' | wc -l) faces)"

# Stamp provenance. A vendored copy whose recorded commit is stale is worse
# than one with no commit recorded, because it reads as verified.
#
# Done in python rather than sed: the rows being rewritten are markdown table
# cells, so every delimiter sed would accept is already in the pattern.
commit="$(git -C "$SRC" rev-parse HEAD 2>/dev/null || echo unknown)"
dated="$(git -C "$SRC" log -1 --format=%cs 2>/dev/null || echo unknown)"
today="$(date +%F)"
COMMIT="$commit" DATED="$dated" TODAY="$today" python3 - "$DST/VENDORED-FROM.md" <<'PY'
import os, re, sys
path = sys.argv[1]
rows = {
    "Commit":   "`%s`" % os.environ["COMMIT"],
    "Dated":    os.environ["DATED"],
    "Vendored": os.environ["TODAY"],
}
out, seen = [], set()
for line in open(path):
    m = re.match(r"^\| (\w+) \| .* \|$", line.rstrip("\n"))
    if m and m.group(1) in rows:
        seen.add(m.group(1))
        line = "| %s | %s |\n" % (m.group(1), rows[m.group(1)])
    out.append(line)
missing = set(rows) - seen
if missing:
    # Refuse a silent no-op: a stamp that did not land looks exactly like one
    # that did, which is the whole failure mode this file exists to avoid.
    sys.exit("✗ VENDORED-FROM.md has no row for: %s — stamp not written" % ", ".join(sorted(missing)))
open(path, "w").writelines(out)
PY

echo
echo "✓ resynced to $commit ($dated)"
echo "  review the diff before committing: git diff app/beta/kit"
