#!/usr/bin/env python3
"""Papers pipeline — reads TerraPulse workspace data and generates papers-data.json for bradley.io."""

import json
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent
TERRAPULSE_ROOT = PROJECT_ROOT.parent / "terrapulse"
WORKSPACES_DIR = TERRAPULSE_ROOT / "workspaces"
OUTPUT_FILE = PROJECT_ROOT / "public" / "data" / "papers-data.json"
PREVIEW_DIR = PROJECT_ROOT / "public" / "data" / "papers"

# DuckDB for indexed papers
PAPERS_DB = TERRAPULSE_ROOT / "data" / "duckdb" / "papers.duckdb"


def log(msg: str):
    print(f"  {msg}")


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
            "status": ws.get("status", "draft"),
            "author": ws.get("author", "TerraPulse Lab"),
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


def copy_previews(workspaces: list[dict]):
    """Copy workspace preview PNGs to public/data/papers/."""
    PREVIEW_DIR.mkdir(parents=True, exist_ok=True)

    for ws in workspaces:
        if not ws["previewImage"]:
            continue
        src = WORKSPACES_DIR / ws["slug"] / "www" / ws["previewImage"]
        dst = PREVIEW_DIR / f"{ws['slug']}.png"
        if src.is_file():
            shutil.copy2(src, dst)

    # Also copy the paper PDF if it exists
    paper_src = WORKSPACES_DIR / "cross-domain-clustering" / "www" / "paper.pdf"
    paper_dst = PREVIEW_DIR / "cross-domain-clustering-paper.pdf"
    if paper_src.is_file():
        shutil.copy2(paper_src, paper_dst)


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

    log("Loading workspaces...")
    workspaces = load_workspaces()
    log(f"Found {len(workspaces)} workspaces")

    log("Loading indexed papers...")
    indexed_papers = load_indexed_papers()
    log(f"Found {len(indexed_papers)} indexed reference papers")

    log("Copying preview images...")
    copy_previews(workspaces)

    # Build output
    studies = []
    for ws in workspaces:
        category = categorize_workspace(ws)
        refs = [p for p in indexed_papers if p["workspace"] == ws["slug"]]

        study = {
            "slug": ws["slug"],
            "title": ws["title"],
            "description": ws["description"],
            "status": ws["status"],
            "author": ws["author"],
            "category": category,
            "createdAt": ws["createdAt"],
            "hasPaper": ws["hasPaper"],
            "hasViz": ws["hasViz"],
            "previewImage": f"/data/papers/{ws['slug']}.png" if ws["previewImage"] else None,
            "paperUrl": f"/data/papers/cross-domain-clustering-paper.pdf" if ws["hasPaper"] else None,
            "dataFileCount": ws["dataFileCount"],
            "refPaperCount": ws["refPaperCount"],
            "references": refs,
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
        "studies": studies,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(output, indent=2))
    log(f"Written to {OUTPUT_FILE} ({OUTPUT_FILE.stat().st_size / 1024:.1f} KB)")
    log(f"Studies: {len(studies)}, References: {len(indexed_papers)}, Categories: {len(categories)}")

    print("\nDone!")


if __name__ == "__main__":
    main()
