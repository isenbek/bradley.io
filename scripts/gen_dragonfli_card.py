#!/usr/bin/env python3
"""Regenerate the /dragonfli OG share card as a live radar scope from the ADS-B
feed. Fault-tolerant by design: on ANY failure (no matplotlib, feed down, bad
data) it prints a note and exits non-zero WITHOUT touching the committed image,
so a deploy never ships a blank card.

Usage: gen_dragonfli_card.py [ADSB_BASE_URL]
"""
import sys
import os
import json
import math
import urllib.request

BASE = sys.argv[1] if len(sys.argv) > 1 else "https://dragonfli.tinymachines.ai"
OUT = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "public", "dragonfli", "og-card.png"))

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.patches import Circle
except Exception as e:  # noqa: BLE001
    print(f"matplotlib unavailable ({e}); keeping existing dragonfli card")
    sys.exit(1)


def get(path):
    with urllib.request.urlopen(BASE + path, timeout=8) as r:
        return json.load(r)


try:
    rx = get("/receiver")
    rlat, rlon = rx["lat"], rx["lon"]
    ac = get("/aircraft/active").get("aircraft", [])
    pts = [(a["lon"], a["lat"], a.get("icao", "")) for a in ac if a.get("lat") and a.get("lon")]
except Exception as e:  # noqa: BLE001
    print(f"ADS-B fetch failed ({e}); keeping existing dragonfli card")
    sys.exit(1)

BG, CY, DIM = "#0a1018", "#38bdf8", "#1c2b3a"
fig = plt.figure(figsize=(8.4, 4.58), dpi=100)
fig.patch.set_facecolor(BG)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_facecolor(BG)
ax.set_aspect("equal")
clat = math.cos(math.radians(rlat))

for r in (0.5, 1.0, 1.5, 2.0):
    ax.add_patch(Circle((0, 0), r, fill=False, ec=DIM, lw=1.1, zorder=1))
    ax.text(0, r, f"{int(r * 60)}nm", color="#2f4a63", fontsize=6.5, ha="center", va="bottom", family="monospace")
for ang in range(0, 360, 30):
    a = math.radians(ang)
    ax.plot([0, 2.1 * math.sin(a)], [0, 2.1 * math.cos(a)], color=DIM, lw=0.5, zorder=1)

ax.plot(0, 0, marker="D", ms=8, mfc=CY, mec="#0a1018", mew=1.2, zorder=5)
ax.text(0, -0.13, "RX", color=CY, fontsize=7, ha="center", va="top", family="monospace", weight="bold")

for lon, lat, ic in pts:
    x, y = (lon - rlon) * clat, lat - rlat
    ax.scatter([x], [y], s=260, color=CY, alpha=0.12, zorder=3)
    ax.scatter([x], [y], s=42, color=CY, edgecolors="#cbeafe", linewidths=0.6, zorder=4)
    ax.text(x + 0.05, y + 0.05, ic, color="#9fd8f5", fontsize=6.5, family="monospace")

ax.text(-2.0, 1.75, "LIVE · 1090 MHz", color=CY, fontsize=9, family="monospace", weight="bold")
ax.text(-2.0, 1.55, f"{len(pts)} aircraft in range", color="#5f7d97", fontsize=7.5, family="monospace")
ax.set_xlim(-2.15, 2.15)
ax.set_ylim(-1.65, 1.9)
ax.axis("off")

os.makedirs(os.path.dirname(OUT), exist_ok=True)
tmp = OUT + ".tmp.png"
fig.savefig(tmp, facecolor=BG, dpi=100)
os.replace(tmp, OUT)  # atomic — never leaves a half-written card
print(f"dragonfli card refreshed ({len(pts)} aircraft)")
