#!/usr/bin/env bash
# =============================================================================
# Re-download the vendored webfonts into app/fonts/.
#
# WHY THESE ARE VENDORED
#   They used to be next/font/google. On 2026-08-15 Turbopack's Google-font
#   resolution began failing intermittently — three build failures inside an
#   hour, each only clearable with `rm -rf .next/cache`, and one of them left
#   bradley.io serving a 500 on its stylesheet. A build that fetches from
#   Google every time fails whenever Google, DNS or a cache feels like it.
#   Anti-Cloud, Host Local: the build now touches nothing off this machine.
#
#   This is also a privacy win — no visitor request ever reaches Google.
#
# WHAT IT GRABS
#   The VARIABLE font for each family, latin subset. One file covers every
#   weight, which is why app/layout.tsx declares `weight: "min max"` ranges
#   instead of a list. If Google ever serves a static instance instead, the
#   verification step below fails loudly rather than silently shipping a site
#   where every weight looks identical.
#
# Run:  ./scripts/vendor-fonts.sh
#       (only needed to update a family or add a new one — NOT part of deploy)
# =============================================================================
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1
OUT="app/fonts"
mkdir -p "$OUT"

# A modern UA is required or Google serves TTF instead of woff2.
UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

say() { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
ok()  { printf '\033[1;32m ok\033[0m %s\n' "$*"; }
bad() { printf '\033[1;31m  x\033[0m %s\n' "$*"; }

fetch() {  # fetch <label> <css2-family-query> <outfile>
  local label="$1" query="$2" out="$OUT/$3" css url tmp
  css=$(curl -s --max-time 25 -H "User-Agent: $UA" \
        "https://fonts.googleapis.com/css2?family=${query}&display=swap")
  if [[ -z "$css" ]]; then bad "$label: empty CSS from Google"; return 1; fi

  # Prefer the block carrying basic latin; fall back to the last woff2 listed.
  url=$(printf '%s' "$css" \
        | awk '/unicode-range: U\+0000-00FF/{f=1} {if(f) print}' \
        | grep -o 'https://[^)]*\.woff2' | head -1)
  [[ -z "$url" ]] && url=$(printf '%s' "$css" | grep -o 'https://[^)]*\.woff2' | tail -1)
  if [[ -z "$url" ]]; then bad "$label: no woff2 URL in the CSS"; return 1; fi

  tmp="$(mktemp)"
  if ! curl -s --max-time 30 -o "$tmp" "$url"; then bad "$label: download failed"; rm -f "$tmp"; return 1; fi
  # wOF2 magic — never overwrite a good font with an error page.
  if [[ "$(head -c4 "$tmp")" != "wOF2" ]]; then
    bad "$label: not a woff2 file (got $(head -c16 "$tmp" | tr -dc '[:print:]'))"
    rm -f "$tmp"; return 1
  fi
  mv "$tmp" "$out"
  ok "$(printf '%-22s %s' "$label" "$(du -h "$out" | cut -f1)")"
}

say "downloading variable fonts"
fetch "Bricolage Grotesque" "Bricolage+Grotesque:opsz,wdth,wght@12..96,75..100,200..800" bricolage.woff2
fetch "Hanken Grotesk"      "Hanken+Grotesk:wght@100..900"                                hanken.woff2
fetch "Baloo 2"             "Baloo+2:wght@400..800"                                       baloo2.woff2
fetch "JetBrains Mono"      "JetBrains+Mono:wght@100..800"                                jetbrains.woff2

say "verifying each file is VARIABLE with the expected axis range"
python3 - <<'PY'
import glob, sys
try:
    from fontTools.ttLib import TTFont
except ImportError:
    print("    fontTools not installed — skipping verification")
    print("    (pip install fonttools brotli  to enable it)")
    sys.exit(0)

# family file -> minimum wght range the site actually uses
NEED = {
    "bricolage.woff2": (400, 800),
    "hanken.woff2":    (400, 700),
    "baloo2.woff2":    (600, 800),
    "jetbrains.woff2": (400, 700),
}
bad = False
for f in sorted(glob.glob("app/fonts/*.woff2")):
    key = f.split("/")[-1]
    t = TTFont(f)
    if "fvar" not in t:
        print(f"    ✗ {key}: STATIC, not variable — weights will all look the same")
        bad = True
        continue
    axes = {a.axisTag: (a.minValue, a.maxValue) for a in t["fvar"].axes}
    lo, hi = axes.get("wght", (None, None))
    need_lo, need_hi = NEED.get(key, (lo, hi))
    if lo is None or lo > need_lo or hi < need_hi:
        print(f"    ✗ {key}: wght {lo}..{hi} does not cover {need_lo}..{need_hi}")
        bad = True
    else:
        extra = " ".join(f"{k}" for k in axes if k != "wght")
        print(f"    ✓ {key}: wght {lo:.0f}..{hi:.0f}{(' + ' + extra) if extra else ''}")
sys.exit(1 if bad else 0)
PY

if [[ $? -ne 0 ]]; then
  bad "verification FAILED — do not deploy these"
  exit 1
fi

say "done. app/layout.tsx reads these via next/font/local."
echo "    Weight ranges there must still cover what the CSS asks for."
