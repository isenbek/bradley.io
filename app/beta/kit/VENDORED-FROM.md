# Vendored: the tinymachines style kit

Nothing in this directory is authored here. It is a copy, and edits made to it
are lost the next time it is resynced.

| | |
|---|---|
| Source | `~/projects/tinymachines/public/style/` |
| Upstream repo | `tinymachines/public` |
| Commit | `e491d8615285e8b86031615ade442fbf18c741f9` |
| Dated | 2026-08-28 |
| Vendored | 2026-08-28 |
| Published at | https://tinymachines.ai/style and /style/zoo |

## What was copied

| File | What it is |
|---|---|
| `tokens.css` | The `@theme static` block: 70 tokens, palette sampled from the binder scans |
| `components.css` | The kit: 224 classes, plain CSS on the tokens, no framework |
| `fonts.css` | 29 `@font-face` rules over the woff2 files in `fonts/` |
| `fonts/` | Archivo + IBM Plex Sans/Mono/Serif, latin and latin-ext, all SIL OFL 1.1 |

## What was deliberately left behind

- **`fonts/og/`** (5.1 MB of TTFs). Upstream needs them because satori cannot
  read woff2 when it renders OpenGraph cards. bradley.io renders its own cards
  through `lib/og-card-v3.tsx` and does not use this kit's faces for them. If
  beta's OG cards are ever restyled onto Archivo, copy that directory then.
- **`STYLE.md`, `zoo.html`, `README.md`, the `check-*.py` scripts,
  `build-tokens.py`, `tokens.static.css`, `projects/`.** Those are upstream's
  documentation and enforcement, not the artifact. Read them at the source, or
  on the published site.

## Why a copy and not an import

Upstream's own `web/app/globals.css` imports `../../style/` directly, and its
README makes the case for one copy of a fact. That argument holds inside one
repo. Across two it buys drift-freedom with a hard dependency on a sibling
directory path, which breaks the moment either repo moves or is cloned alone,
and it asks Turbopack to resolve an asset outside the project root.

bradley.io already made this call once, for the same reason: the four v3
families in `app/fonts/` are vendored rather than fetched, because a build that
reaches off this machine is a build that fails when something off this machine
does. See `scripts/vendor-fonts.sh`.

The cost is drift, so drift is made visible rather than prevented:

```bash
./scripts/sync-style-kit.sh --check    # diff against upstream, change nothing
./scripts/sync-style-kit.sh            # re-copy, then rewrite this file's commit
```

## Do not fork the kit

STYLE.md rule 10 is "fix the component, do not fork it", and it applies here
even though the copy makes forking easy. A beta page that needs a rule the kit
does not have has two honest options: put the rule in `app/beta/beta.css`,
which is bradley.io's own file and is not part of this copy, or fix it upstream
and resync. Editing `components.css` in place is neither.

## Licence

The four families are SIL Open Font License 1.1. `fonts/OFL-Archivo.txt` and
the IBM Plex licence travel with the files and must keep travelling with any
redistribution.
