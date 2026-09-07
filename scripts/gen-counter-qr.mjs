#!/usr/bin/env node
// Regenerates the counter-card QR (components/housecalls/card-qr.ts).
import QR from "qrcode"
import { writeFileSync } from "node:fs"
const url = "https://housecalls.bradley.io/tools"
const svg = await QR.toString(url, { type: "svg", errorCorrectionLevel: "M", margin: 0 })
writeFileSync(
  "components/housecalls/card-qr.ts",
  `/**\n * Generated QR for the counter cards: ${url}\n * Regenerate: node scripts/gen-counter-qr.mjs\n * Error correction M, margin 0 (the card supplies its own quiet zone).\n */\nexport const QR_TOOLS_SVG = ${JSON.stringify(svg)}\n`
)
console.log("regenerated for", url)
