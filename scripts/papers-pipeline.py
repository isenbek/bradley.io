#!/usr/bin/env python3
"""Papers pipeline: reads TerraPulse workspace data and generates papers-data.json for bradley.io.

Usage:
  python3 scripts/papers-pipeline.py [--out PATH] [--prune]

  --out PATH   write the index to PATH instead of public/data/papers-data.json,
               and the preview images to a "papers" directory beside PATH
               instead of public/data/papers (for testing; never point a test
               at public/data)
  --prune      delete, from the preview directory, the figures and PDFs that an
               earlier run copied for studies that are now held or withdrawn.
               Without it they are only listed, with a warning, on every run.

Four things this pipeline decides on purpose rather than passing through:

  HOLD      studies that must not be published at all (list below)
  WITHDRAWN studies the source project took off its own site (its workspace
            says public: false, or carries a withdrawn status or note). The
            source's flag is honoured here; see WITHDRAWN_POLICY below
  AUTHORS   raw author strings are internal; only a small public vocabulary
            is ever emitted
  STATUS    raw status strings are internal workflow notes; only a small
            public vocabulary is ever emitted
"""

import json
import shutil
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# HOLD LIST. A study on this list is left out of the published index entirely:
# no entry, no preview image, no paper link, and its reference papers are not
# counted. Held studies are printed on every run so a hold cannot be forgotten.
# To release a study, delete its line here; do not work around the list.
#   slug   = the workspace slug (the directory name under terrapulse/workspaces)
#   reason = why it is held, in a sentence someone else can act on
#   date   = the day it was put on hold (YYYY-MM-DD)
# ---------------------------------------------------------------------------
HOLD = [
    {
        "slug": "cc-email-pressure",
        "reason": "pending the owner's decision: may derive from client data",
        "date": "2026-10-02",
    },
]

# ---------------------------------------------------------------------------
# WITHDRAWN AT SOURCE. The source project marks a workspace it has taken off
# its own site with "public": false, a status beginning "withdrawn", and a
# "withdrawn" note saying why (on 2026-10-02: 38 workspaces, withdrawn because
# the data they rest on does not allow commercial use, or because the source
# was rejected and its data deleted). Until 2026-10-02 this pipeline never read
# any of that and published all of them, 35 with a figure.
#
# A workspace counts as withdrawn if ANY of the three signals is present, so a
# half-edited workspace.json fails closed. The policy for those studies:
#   "omit"  nothing from them is published: no entry, no figure, no link. Only
#           their count is published (withdrawnCount), so the page can say how
#           many studies it is not showing. This is the default: the source
#           said "not public", and this script is not the place to overrule it.
#   "list"  title, domain, dates and the status "withdrawn" are published;
#           the description, figure, paper link and results summary are not.
# Which of the two is right is the owner's call. Change the word, nothing else.
# Either way no figure of a withdrawn study is copied, and one copied by an
# earlier run is reported on every run until it is removed (see --prune).
# ---------------------------------------------------------------------------
WITHDRAWN_POLICY = "omit"
WITHDRAWN_POLICIES = ("omit", "list")
WITHDRAWN_STATUS = "withdrawn"  # the public status word, as in STATUS_PUBLIC

# ---------------------------------------------------------------------------
# AUTHORS. The raw strings name internal personas, tools and projects. Each one
# seen in the data is mapped here to a public label; anything not listed is
# published as UNKNOWN_AUTHOR and printed as a warning, never passed through.
# Decided from the data on 2026-10-02 (84 workspaces):
#   PMA 41, TerraPulse Lab 20, claude 14, Claude (TerraPulse Lab) 3,
#   TerraPulse 1, Lab 1, Lab Notebook 1, bisenbek 1, (no author field) 1,
#   and one that names a third-party project (the held study above).
# Keys are compared lower-cased and stripped.
# ---------------------------------------------------------------------------
AUTHOR_AGENT = "Automated research agent"
AUTHOR_CLAUDE = "Claude"
AUTHOR_LAB = "Lab"
AUTHOR_OWNER = "Bradley Isenbek"
UNKNOWN_AUTHOR = "Unattributed"

AUTHOR_PUBLIC = {
    "pma": AUTHOR_AGENT,  # the paper-writing agent
    "claude": AUTHOR_CLAUDE,
    "claude (terrapulse lab)": AUTHOR_CLAUDE,
    "terrapulse lab": AUTHOR_LAB,
    "terrapulse": AUTHOR_LAB,
    "lab": AUTHOR_LAB,
    "lab notebook": AUTHOR_LAB,
    "bisenbek": AUTHOR_OWNER,
}

# ---------------------------------------------------------------------------
# STATUS. Ten raw strings were in the data on 2026-10-02, some of them workflow
# notes that name internal reviewers. Each is mapped to one of seven public
# words; anything not listed is published as UNKNOWN_STATUS and printed as a
# warning. app/papers/page.tsx turns these words into tag colours and must know
# every value on the right-hand side.
# ---------------------------------------------------------------------------
UNKNOWN_STATUS = "unknown"

STATUS_PUBLIC = {
    "draft": "draft",
    "active": "active",
    "revision-in-progress": "in revision",
    "draft-complete-pending-audit": "in review",
    "draft-complete-pending-hed-dek": "in review",
    "rewritten-after-sasha-round2-awaiting-round3": "in review",
    "complete": "complete",
    "accepted": "accepted",
    "published": "published",
    "withdrawn": "withdrawn",
    "withdrawn-permanent": "withdrawn",
}

# The only paper PDF this pipeline copies into public/. A study gets a paperUrl
# only if its own PDF is listed here. (Before 2026-10-02 every study with a
# paper.pdf was given THIS study's URL, so a second paper linked to the wrong
# document.)
PUBLISHED_PAPER_PDFS = {
    "cross-domain-clustering": "cross-domain-clustering-paper.pdf",
}

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TERRAPULSE_ROOT = PROJECT_ROOT.parent / "terrapulse"
WORKSPACES_DIR = TERRAPULSE_ROOT / "workspaces"
OUTPUT_FILE = PROJECT_ROOT / "public" / "data" / "papers-data.json"
PREVIEW_DIR = PROJECT_ROOT / "public" / "data" / "papers"

# DuckDB for indexed papers
PAPERS_DB = TERRAPULSE_ROOT / "data" / "duckdb" / "papers.duckdb"


def log(msg: str):
    print(f"  {msg}")


def parse_out(argv: list[str]) -> tuple[Path, Path]:
    """(index path, preview dir). With --out, both move away from public/data."""
    if "--out" in argv:
        i = argv.index("--out")
        if i + 1 >= len(argv):
            print("--out needs a path")
            sys.exit(2)
        out = Path(argv[i + 1]).resolve()
        return out, out.parent / "papers"
    return OUTPUT_FILE, PREVIEW_DIR


def withdrawn_signals(ws: dict) -> list[str]:
    """Why a raw workspace.json counts as withdrawn at source. Empty = it is not.

    Fails closed: a "public" key holding anything but true counts as not public.
    """
    signals = []
    if "public" in ws and ws["public"] is not True:
        signals.append("public flag")
    if str(ws.get("status") or "").strip().lower().startswith("withdrawn"):
        signals.append("status")
    if ws.get("withdrawn") or ws.get("withdrawn_permanent"):
        signals.append("note")
    return signals


def published_asset_names(slug: str) -> list[str]:
    """Every file name this pipeline has ever written to the preview dir for a slug."""
    names = [f"{slug}.png", f"{slug}-paper.pdf"]
    if slug in PUBLISHED_PAPER_PDFS:
        names.append(PUBLISHED_PAPER_PDFS[slug])
    return list(dict.fromkeys(names))


def public_author(raw) -> tuple[str, bool]:
    """(public label, recognised). Never returns the raw string."""
    if raw is None or not str(raw).strip():
        return UNKNOWN_AUTHOR, True  # no author recorded: say so, do not guess
    label = AUTHOR_PUBLIC.get(str(raw).strip().lower())
    if label is None:
        return UNKNOWN_AUTHOR, False
    return label, True


def public_status(raw) -> tuple[str, bool]:
    """(public status, recognised). Never returns the raw string."""
    label = STATUS_PUBLIC.get(str(raw or "").strip().lower())
    if label is None:
        return UNKNOWN_STATUS, False
    return label, True


def load_workspaces() -> list[dict]:
    """Load all workspace metadata from TerraPulse."""
    workspaces = []
    if not WORKSPACES_DIR.exists():
        log(f"Warning: {WORKSPACES_DIR} not found")
        return workspaces

    for ws_dir in sorted(WORKSPACES_DIR.iterdir()):
        ws_file = ws_dir / "workspace.json"
        if not ws_file.is_file():
            continue

        ws = json.loads(ws_file.read_text())
        if not ws.get("slug") or not ws.get("title"):
            continue

        www_dir = ws_dir / "www"
        data_dir = ws_dir / "data"

        # Check for outputs
        has_paper = (www_dir / "paper.pdf").is_file()
        has_viz = any(f.suffix == ".html" for f in www_dir.iterdir()) if www_dir.is_dir() else False
        preview_png = None
        if www_dir.is_dir():
            imgs = [f for f in www_dir.iterdir() if f.suffix in (".png", ".jpg", ".jpeg")]
            if imgs:
                preview_png = imgs[0].name

        # Count data files
        data_files = list(data_dir.iterdir()) if data_dir.is_dir() else []
        papers_dir = data_dir / "papers"
        ref_paper_count = len(list(papers_dir.glob("*.pdf"))) if papers_dir.is_dir() else 0

        # Try to load results for the cross-domain paper
        results = None
        results_file = data_dir / "results.json"
        if results_file.is_file():
            try:
                results = json.loads(results_file.read_text())
            except Exception:
                pass

        workspaces.append({
            "slug": ws["slug"],
            "title": ws["title"],
            "description": ws.get("description", ""),
            # Raw values, for the mapping step in main(). Neither is published.
            "rawStatus": ws.get("status"),
            "rawAuthor": ws.get("author"),
            # Non-empty when the source project has taken this study off its
            # own site. Read in apply_withdrawn(); not published.
            "withdrawnSignals": withdrawn_signals(ws),
            "createdAt": ws.get("created_at", ""),
            "updatedAt": ws.get("updated_at", ""),
            "hasPaper": has_paper,
            "hasViz": has_viz,
            "previewImage": preview_png,
            "dataFileCount": len(data_files),
            "refPaperCount": ref_paper_count,
            "results": results,
        })

    return workspaces


def load_indexed_papers() -> list[dict]:
    """Load indexed papers from DuckDB."""
    if not PAPERS_DB.is_file():
        log("No papers.duckdb found")
        return []

    try:
        import duckdb
        db = duckdb.connect(str(PAPERS_DB), read_only=True)
        rows = db.execute(
            "SELECT arxiv_id, title, abstract, workspace, published, categories "
            "FROM papers ORDER BY published DESC"
        ).fetchall()
        db.close()

        papers = []
        for row in rows:
            papers.append({
                "arxivId": row[0],
                "title": row[1],
                "abstract": (row[2] or "")[:300],
                "workspace": row[3],
                "published": str(row[4]) if row[4] else "",
                "categories": row[5] or "",
                "url": f"https://arxiv.org/abs/{row[0]}",
            })
        return papers
    except Exception as e:
        log(f"Error reading papers DB: {e}")
        return []


def copy_previews(workspaces: list[dict], preview_dir: Path) -> set[str]:
    """Copy workspace preview PNGs and the listed paper PDFs to the preview dir.

    Held studies never reach this function. Returns the slugs whose paper PDF
    was actually copied, so a paperUrl is only ever given to a file that exists.
    """
    preview_dir.mkdir(parents=True, exist_ok=True)

    for ws in workspaces:
        if not ws["previewImage"]:
            continue
        src = WORKSPACES_DIR / ws["slug"] / "www" / ws["previewImage"]
        dst = preview_dir / f"{ws['slug']}.png"
        if src.is_file():
            shutil.copy2(src, dst)

    published_pdfs: set[str] = set()
    slugs = {ws["slug"] for ws in workspaces}
    for slug, name in PUBLISHED_PAPER_PDFS.items():
        if slug not in slugs:
            continue
        paper_src = WORKSPACES_DIR / slug / "www" / "paper.pdf"
        if paper_src.is_file():
            shutil.copy2(paper_src, preview_dir / name)
            published_pdfs.add(slug)
    return published_pdfs


def apply_hold(workspaces: list[dict]) -> list[dict]:
    """Drop held studies and say so, every run."""
    held = {h["slug"]: h for h in HOLD}
    present = {ws["slug"] for ws in workspaces}
    print(f"  HELD studies (excluded from the published index): {len(HOLD)}")
    for h in HOLD:
        where = "present in workspaces" if h["slug"] in present else "NOT FOUND in workspaces"
        title = next((ws["title"] for ws in workspaces if ws["slug"] == h["slug"]), "")
        print(f"    HELD {h['slug']} (since {h['date']}): {h['reason']} [{where}]")
        if title:
            print(f"         title: {title}")
    return [ws for ws in workspaces if ws["slug"] not in held]


def apply_withdrawn(workspaces: list[dict]) -> tuple[list[dict], list[str]]:
    """Honour the source project's withdrawals, and say so, every run.

    Returns (workspaces to publish, slugs withdrawn at source). Under "omit"
    the withdrawn ones are dropped. Under "list" they stay, stripped to a
    title: no description, no figure, no paper, no results.
    """
    withdrawn = [ws for ws in workspaces if ws["withdrawnSignals"]]
    slugs = [ws["slug"] for ws in withdrawn]
    what = ("nothing from them is published, only their count"
            if WITHDRAWN_POLICY == "omit"
            else "listed by title and status only, no figure or description")
    print(f"  WITHDRAWN at source: {len(withdrawn)} (policy \"{WITHDRAWN_POLICY}\": {what})")
    if withdrawn:
        by_signal = Counter(sig for ws in withdrawn for sig in ws["withdrawnSignals"])
        print("    signals: " + ", ".join(f"{k} {n}" for k, n in sorted(by_signal.items())))
        print("    " + ", ".join(slugs))
        # Withdrawn by status or note but never flagged public: false. Treated
        # as withdrawn all the same; named so the source can be put right.
        unflagged = [ws["slug"] for ws in withdrawn if "public flag" not in ws["withdrawnSignals"]]
        if unflagged:
            print(f"    withdrawn by status or note with no public: false flag: {', '.join(unflagged)}")

    if WITHDRAWN_POLICY == "omit":
        return [ws for ws in workspaces if not ws["withdrawnSignals"]], slugs

    for ws in withdrawn:
        ws["bare"] = True
        ws["previewImage"] = None  # so copy_previews copies nothing for it
        ws["results"] = None
    return workspaces, slugs


def report_leftovers(withheld: dict[str, str], preview_dir: Path, prune: bool) -> int:
    """Files an earlier run published for a study that is now held or withdrawn.

    They are still served from the preview dir whatever the index says. Without
    --prune they are listed on every run; deleting a published file is a
    person's decision, and --prune is how that person says so. Returns how many
    are still there afterwards.
    """
    found = []
    if preview_dir.is_dir():
        for slug, why in withheld.items():
            for name in published_asset_names(slug):
                f = preview_dir / name
                if f.is_file():
                    found.append((f, why))
    if not found:
        log("No published files left over from held or withdrawn studies")
        return 0
    if prune:
        for f, why in found:
            f.unlink()
            print(f"    PRUNED {f} ({why})")
        print(f"  Pruned {len(found)} file(s) left over from held or withdrawn studies")
        return 0
    print(f"  WARNING: {len(found)} file(s) from held or withdrawn studies are still in "
          f"{preview_dir} and still public. Run again with --prune, or remove them by hand:")
    for f, why in found:
        print(f"    STILL PUBLIC {f} ({why})")
    return len(found)


def categorize_workspace(ws: dict) -> str:
    """Assign a category based on title/description keywords."""
    text = (ws["title"] + " " + ws["description"]).lower()
    if "cross-domain" in text or "compound" in text or "granger" in text:
        return "cross-domain"
    if "earthquake" in text or "seismic" in text:
        return "seismology"
    if "solar" in text or "geomagnetic" in text or "space weather" in text:
        return "space-weather"
    if "enso" in text or "drought" in text or "el nino" in text or "la nina" in text:
        return "climate"
    if "radiation" in text:
        return "radiation"
    if "fireball" in text or "meteor" in text:
        return "space-weather"
    if "temperature" in text or "warming" in text or "urban" in text:
        return "climate"
    if "streamflow" in text or "water" in text or "flood" in text:
        return "hydrology"
    return "research"


def main():
    print("Papers Pipeline")
    print("=" * 40)

    out_file, preview_dir = parse_out(sys.argv)
    prune = "--prune" in sys.argv
    if WITHDRAWN_POLICY not in WITHDRAWN_POLICIES:
        print(f"  REFUSING TO RUN: WITHDRAWN_POLICY is {WITHDRAWN_POLICY!r}; "
              f"it must be one of {WITHDRAWN_POLICIES}")
        sys.exit(2)

    log("Loading workspaces...")
    workspaces = load_workspaces()
    log(f"Found {len(workspaces)} workspaces")

    workspaces = apply_hold(workspaces)
    held_slugs = {h["slug"] for h in HOLD}
    workspaces, withdrawn_slugs = apply_withdrawn(workspaces)
    # Slugs with no entry at all in the output: the holds, plus the withdrawn
    # studies when the policy is to omit them.
    absent_slugs = held_slugs | (set(withdrawn_slugs) if WITHDRAWN_POLICY == "omit" else set())
    log(f"Publishing {len(workspaces)} workspaces after holds and withdrawals")

    report_leftovers(
        {**{s: "withdrawn at source" for s in withdrawn_slugs}, **{s: "held" for s in held_slugs}},
        preview_dir,
        prune,
    )

    log("Loading indexed papers...")
    indexed_papers = [p for p in load_indexed_papers() if p["workspace"] not in absent_slugs]
    log(f"Found {len(indexed_papers)} indexed reference papers")

    log("Copying preview images...")
    published_pdfs = copy_previews(workspaces, preview_dir)

    # Map the internal author and status strings onto the public vocabulary.
    unknown_authors: Counter = Counter()
    unknown_statuses: Counter = Counter()
    for ws in workspaces:
        ws["author"], ok = public_author(ws["rawAuthor"])
        if not ok:
            unknown_authors[str(ws["rawAuthor"])] += 1
        ws["status"], ok = public_status(ws["rawStatus"])
        if not ok:
            unknown_statuses[str(ws["rawStatus"])] += 1
        if ws.get("bare"):
            # Withdrawn at source whatever its status string says.
            ws["status"] = WITHDRAWN_STATUS
    log("Authors (public label: studies): " + ", ".join(
        f"{a}: {n}" for a, n in Counter(ws["author"] for ws in workspaces).most_common()))
    log("Statuses (public word: studies): " + ", ".join(
        f"{a}: {n}" for a, n in Counter(ws["status"] for ws in workspaces).most_common()))
    for raw, n in unknown_authors.items():
        print(f"  WARNING: unrecognised author {raw!r} on {n} study(ies); published as "
              f"{UNKNOWN_AUTHOR!r}. Add it to AUTHOR_PUBLIC.")
    for raw, n in unknown_statuses.items():
        print(f"  WARNING: unrecognised status {raw!r} on {n} study(ies); published as "
              f"{UNKNOWN_STATUS!r}. Add it to STATUS_PUBLIC and to statusTag in app/papers/page.tsx.")

    # Build output
    studies = []
    for ws in workspaces:
        category = categorize_workspace(ws)
        refs = [p for p in indexed_papers if p["workspace"] == ws["slug"]]

        bare = bool(ws.get("bare"))
        study = {
            "slug": ws["slug"],
            "title": ws["title"],
            # A withdrawn study is listed by title only (policy "list").
            "description": "" if bare else ws["description"],
            "status": ws["status"],
            "author": ws["author"],
            "category": category,
            "createdAt": ws["createdAt"],
            "hasPaper": ws["hasPaper"],
            "hasViz": ws["hasViz"],
            "previewImage": f"/data/papers/{ws['slug']}.png" if ws["previewImage"] else None,
            # Only a PDF this run actually copied, and only for its own study.
            "paperUrl": (
                f"/data/papers/{PUBLISHED_PAPER_PDFS[ws['slug']]}"
                if ws["slug"] in published_pdfs and not bare
                else None
            ),
            "dataFileCount": ws["dataFileCount"],
            "refPaperCount": ws["refPaperCount"],
            "references": refs,
            # True only under policy "list"; under "omit" no such study is here.
            "withdrawn": bare,
        }

        # Add results summary for cross-domain paper
        if ws["results"] and isinstance(ws["results"], list) and all("label" in r for r in ws["results"][:1]):
            study["resultsSummary"] = {
                "totalStreams": len(ws["results"]),
                "clustered": sum(1 for r in ws["results"] if r.get("cv", 0) > 1.0),
                "highlights": [
                    {
                        "label": r.get("label", ""),
                        "category": r.get("category", ""),
                        "cv": round(r.get("cv", 0), 2),
                        "events": r.get("n_events", 0),
                        "verdict": r.get("verdict", ""),
                    }
                    for r in ws["results"][:6]
                ],
            }

        studies.append(study)

    # Sort: papers first, then by created date
    studies.sort(key=lambda s: (not s["hasPaper"], s.get("createdAt", "")))

    # Category counts
    categories = {}
    for s in studies:
        cat = s["category"]
        categories[cat] = categories.get(cat, 0) + 1

    output = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "totalStudies": len(studies),
        "totalReferences": len(indexed_papers),
        "categories": categories,
        # Studies the source project took off its own site. "omitted": they are
        # not in `studies` and totalStudies does not count them. "listed": they
        # are in `studies` by title only, flagged withdrawn, and are counted.
        "withdrawnCount": len(withdrawn_slugs),
        "withdrawnPolicy": "omitted" if WITHDRAWN_POLICY == "omit" else "listed",
        "studies": studies,
    }

    # Last line of defence. A held slug (and, under "omit", a withdrawn one)
    # must not be anywhere in the output; under "list" a withdrawn study must
    # carry nothing but its title. Refuse to write otherwise.
    blob = json.dumps(output, indent=2)
    for slug in sorted(absent_slugs):
        if f'"{slug}"' in blob or f"/{slug}." in blob:
            print(f"  REFUSING TO WRITE: held or withdrawn study {slug} is still in the output")
            sys.exit(1)
    by_slug = {s["slug"]: s for s in studies}
    for slug in withdrawn_slugs:
        s = by_slug.get(slug)
        if s is None:
            continue
        leaks = [k for k in ("description", "previewImage", "paperUrl", "resultsSummary") if s.get(k)]
        if leaks or not s["withdrawn"] or s["status"] != WITHDRAWN_STATUS or f"/{slug}." in blob:
            print(f"  REFUSING TO WRITE: withdrawn study {slug} would be published with {leaks or 'a file link or the wrong status'}")
            sys.exit(1)

    out_file.parent.mkdir(parents=True, exist_ok=True)
    tmp = out_file.with_name(out_file.name + ".tmp")
    tmp.write_text(blob)
    tmp.replace(out_file)
    log(f"Written to {out_file} ({out_file.stat().st_size / 1024:.1f} KB)")
    log(f"Studies: {len(studies)}, References: {len(indexed_papers)}, Categories: {len(categories)}, "
        f"Withdrawn at source ({output['withdrawnPolicy']}): {len(withdrawn_slugs)}")

    print("\nDone!")


if __name__ == "__main__":
    main()
