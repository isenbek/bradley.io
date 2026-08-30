# Dark bradley.io theme — palette snapshot

Captured from the original dark "vector x-ray" bio-mark tool (2026-06-28) when it
was converted to the light site standard. These are good bones for a future dark
bradley.io theme — they're a cohesive, already-tuned dark set that pairs with the
site's Bio-Blue accent. Full original markup preserved in `bio-mark-dark-snapshot.html`.

## Dark tokens (the snapshot) ↔ light v3 equivalents

| role            | dark (snapshot) | light v3 token            |
|-----------------|-----------------|---------------------------|
| body bg         | `#0a0f1c`       | `--v3-paper #F4F2E9`      |
| panel / card    | `#0e1525`       | `--v3-white #FFFFFF`      |
| panel tint      | `#0b1120`       | `#FBFAF4` (tint)          |
| inset tint      | `#0c1424`       | `#FBFAF4`                 |
| hairline        | `#1b2740`       | `--v3-line #E4E2D8`       |
| hairline 2      | `#243352`       | `#D9D6C9`                 |
| text (ink)      | `#e8edf7`       | `--v3-ink #33332E`        |
| text dim        | `#8493ad`       | `--v3-slate #6B6B62`      |
| text faint      | `#566179`       | `#9C9A8E`                 |
| brand blue      | `#2563eb`       | `--v3-blue-500 #13B8F3`   |
| blue accent     | `#93c5fd`       | `--v3-blue-600 #0A96C7`   |
| row highlight   | `#152138`       | `#ECF9FE` (blue-50)       |

## Accent / data colors (these largely survive a theme flip — just nudge for contrast)

| meaning              | dark        | light       |
|----------------------|-------------|-------------|
| chord (Δ=P₃−P₀)      | `#f0a23b`   | `#D97706`   |
| h_out handle         | `#ff5a8a`   | `#DB2777`   |
| h_in handle          | `#37d6c4`   | `#0D9488`   |
| anchor / neutral     | `#cdd8ef`   | `#64748B`   |
| plumb / gold accent  | `#ffd166`   | `#CA8A04`   |
| ok / on-axis green   | `#5fd98a`   | `#16A34A`   |
| warn                 | `#ffb454`   | `#D97706`   |

## Notes for the dark-theme build
- The graph-paper canvas was `radial-gradient(120% 120% at 30% 10%, #101a30 0%, #0a0f1c 70%)`
  with hairline grid lines — a nice dark "blueprint" backdrop worth reusing.
- Mono: JetBrains Mono · Sans: Hanken Grotesk (same as the site, both themes).
- The accent geometry colors read on BOTH backgrounds with only small shifts, so a
  `data-theme="dark"` token swap on `:root` would carry most of the design across.
