#!/bin/bash
# Vendor the local-harness runtime into public/harness/: the hc-engine wasm
# (built in ~/projects/housecalls-harness) and the duckdb-wasm browser
# bundle (from node_modules). Style-kit vendoring discipline: copied with
# provenance, refreshed by re-running this, never edited in place.
set -euo pipefail
REPO="$(cd "$(dirname "$0")/.." && pwd)"
HARNESS="$HOME/projects/housecalls-harness"
OUT="$REPO/public/harness"
mkdir -p "$OUT/duckdb"

cp "$HARNESS/pkg/hc_engine.js" "$HARNESS/pkg/hc_engine_bg.wasm" "$OUT/"
DD="$REPO/node_modules/@duckdb/duckdb-wasm/dist"
cp "$DD/duckdb-browser.mjs" "$DD/duckdb-browser-eh.worker.js" "$DD/duckdb-eh.wasm" "$OUT/duckdb/"

ENGINE_COMMIT=$(git -C "$HARNESS" rev-parse --short HEAD)
DUCKDB_VER=$(node -p "require('$REPO/node_modules/@duckdb/duckdb-wasm/package.json').version")
cat > "$OUT/VENDORED-FROM.md" <<EOF
Vendored runtime for the House Calls local harness. Do not edit here.
- hc_engine: isenbek/housecalls-harness @ $ENGINE_COMMIT (wasm-pack --target web --release)
- duckdb-wasm: @duckdb/duckdb-wasm@$DUCKDB_VER dist (browser mjs + eh worker + eh wasm)
Refresh: ./scripts/vendor-harness.sh
EOF
ls -la "$OUT" "$OUT/duckdb" | grep -v "^total\|^d"
