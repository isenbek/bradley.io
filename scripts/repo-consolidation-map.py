#!/usr/bin/env python3
"""
repo-consolidation-map.py — cross-repo analysis toward merging cb* into one library.

Read-only. Works over the shallow clones that repo-code-stats.py already fetched
into ~/.cache/cb-code. For each repo it inventories the Python package structure,
dependency manifests, and imports; then across repos it computes the things that
actually decide a merge:

  - provided packages + top-level NAME COLLISIONS (same package in >1 repo)
  - internal IMPORT GRAPH (cbX imports a package cbY provides)
  - third-party DEPENDENCY frequency (what to unify / pin)
  - DUPLICATE files by content hash (copied code to dedupe)
  - DEAD / empty repos

  python3 scripts/repo-consolidation-map.py
  python3 scripts/repo-consolidation-map.py --cache ~/.cache/cb-code --json data/cb-consolidation.json

Run repo-code-stats.py first to populate the clone cache.
"""

import argparse
import ast
import hashlib
import json
import re
import tomllib
from collections import Counter, defaultdict
from datetime import datetime, timezone
from pathlib import Path

DEFAULT_CACHE = Path.home() / ".cache" / "cb-code"
DEFAULT_JSON = Path(__file__).resolve().parent.parent / "data" / "cb-consolidation.json"
SKIP_DIRS = {".git", "node_modules", ".venv", "venv", "__pycache__", "dist", "build",
             ".next", "vendor", "site-packages", ".mypy_cache", ".pytest_cache", "migrations"}
STDLIB = set(getattr(__import__("sys"), "stdlib_module_names", ()))  # py3.10+


def walk_py(root: Path):
    for p in root.rglob("*.py"):
        if any(part in SKIP_DIRS for part in p.parts):
            continue
        yield p


def provided_packages(root: Path) -> set[str]:
    """Top-level importable package/module names this repo provides."""
    names = set()
    for base in (root, root / "src"):
        if not base.is_dir():
            continue
        for child in base.iterdir():
            if child.is_dir() and (child / "__init__.py").exists() and child.name not in SKIP_DIRS:
                names.add(child.name)
            elif child.is_file() and child.suffix == ".py" and child.stem != "__init__":
                names.add(child.stem)
    return names


def imported_top_names(root: Path) -> Counter:
    c = Counter()
    for p in walk_py(root):
        try:
            tree = ast.parse(p.read_text(errors="replace"))
        except (SyntaxError, ValueError):
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.Import):
                for a in node.names:
                    c[a.name.split(".")[0]] += 1
            elif isinstance(node, ast.ImportFrom):
                if node.level == 0 and node.module:  # absolute import only
                    c[node.module.split(".")[0]] += 1
    return c


DEP_RE = re.compile(r"^([A-Za-z0-9._-]+)")


def declared_deps(root: Path) -> set[str]:
    deps = set()
    for req in list(root.glob("requirements*.txt")) + list(root.glob("**/requirements*.txt"))[:5]:
        try:
            for line in req.read_text(errors="replace").splitlines():
                line = line.strip()
                if line and not line.startswith(("#", "-")):
                    m = DEP_RE.match(line)
                    if m:
                        deps.add(m.group(1).lower())
        except OSError:
            pass
    pp = root / "pyproject.toml"
    if pp.exists():
        try:
            data = tomllib.loads(pp.read_text(errors="replace"))
            proj = data.get("project", {}).get("dependencies", []) or []
            poetry = ((data.get("tool", {}).get("poetry", {}) or {}).get("dependencies", {}) or {})
            for d in proj:
                m = DEP_RE.match(str(d))
                if m:
                    deps.add(m.group(1).lower())
            for k in poetry:
                if k.lower() != "python":
                    deps.add(k.lower())
        except (tomllib.TOMLDecodeError, OSError):
            pass
    return deps


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--cache", default=str(DEFAULT_CACHE))
    ap.add_argument("--json", default=str(DEFAULT_JSON))
    args = ap.parse_args()
    cache = Path(args.cache)
    repo_dirs = sorted(
        d for org in cache.iterdir() if org.is_dir()
        for d in org.iterdir() if d.is_dir()
    ) if cache.exists() else []
    if not repo_dirs:
        print(f"no clones under {cache} — run scripts/repo-code-stats.py first")
        return

    per_repo = {}
    provided_index = defaultdict(list)  # package -> [repos]
    dep_freq = Counter()
    file_hashes = defaultdict(list)     # (basename, hash) -> [repo/path]
    imports_by_repo = {}

    for d in repo_dirs:
        key = f"{d.parent.name}/{d.name}"
        prov = provided_packages(d)
        deps = declared_deps(d)
        imps = imported_top_names(d)
        py_files = sum(1 for _ in walk_py(d))
        has_tests = any((d / t).exists() for t in ("tests", "test")) or any(
            p.name.startswith("test_") for p in list(walk_py(d))[:2000]
        )
        per_repo[key] = {
            "provides": sorted(prov),
            "n_deps": len(deps),
            "n_py_files": py_files,
            "has_tests": has_tests,
            "has_pyproject": (d / "pyproject.toml").exists(),
            "has_dockerfile": (d / "Dockerfile").exists(),
        }
        imports_by_repo[key] = imps
        for pk in prov:
            provided_index[pk].append(key)
        for dep in deps:
            dep_freq[dep] += 1
        # duplicate-file scan (small text files only)
        for p in walk_py(d):
            try:
                b = p.read_bytes()
            except OSError:
                continue
            if len(b) > 200_000 or len(b) < 40:
                continue
            h = hashlib.sha1(b).hexdigest()
            file_hashes[(p.name, h)].append(f"{key}:{p.relative_to(d)}")

    all_provided = set(provided_index)
    # internal import graph: cbX -> cbY if cbX imports a top-name cbY provides
    edges = []
    for repo, imps in imports_by_repo.items():
        own = set(per_repo[repo]["provides"])
        for name, cnt in imps.items():
            if name in all_provided and name not in own:
                for target in provided_index[name]:
                    if target != repo:
                        edges.append({"from": repo, "to": target, "via": name, "count": cnt})

    collisions = {pk: repos for pk, repos in provided_index.items() if len(repos) > 1}
    dup_files = {
        f"{name}": repos
        for (name, _h), repos in file_hashes.items()
        if len(repos) > 1
    }
    dead = [r for r, m in per_repo.items() if m["n_py_files"] == 0]

    out = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "n_repos": len(per_repo),
        "n_provided_packages": len(all_provided),
        "name_collisions": dict(sorted(collisions.items(), key=lambda kv: -len(kv[1]))),
        "internal_edges": edges,
        "top_shared_deps": dep_freq.most_common(40),
        "duplicate_files": dict(sorted(dup_files.items(), key=lambda kv: -len(kv[1]))[:60]),
        "dead_repos": dead,
        "per_repo": per_repo,
    }
    outp = Path(args.json)
    outp.parent.mkdir(parents=True, exist_ok=True)
    outp.write_text(json.dumps(out, indent=2))

    # summary
    print("\n=== consolidation map ===")
    print(f"  repos {out['n_repos']} · provided packages {out['n_provided_packages']} · "
          f"internal edges {len(edges)} · name collisions {len(collisions)}")
    if collisions:
        print("\n  ⚠ top-level NAME COLLISIONS (must namespace on merge):")
        for pk, repos in list(out["name_collisions"].items())[:12]:
            print(f"    {pk:22} ← {', '.join(r.split('/')[-1] for r in repos)}")
    print("\n  most cross-imported repos (merge these first):")
    tgt = Counter(e["to"] for e in edges)
    for r, c in tgt.most_common(10):
        print(f"    {r:28} imported by {c} edges")
    print("\n  top shared dependencies (unify/pin):")
    for dep, c in out["top_shared_deps"][:12]:
        print(f"    {dep:22} {c} repos")
    dupn = sum(len(v) for v in dup_files.values())
    print(f"\n  duplicate files across repos: {len(dup_files)} names, {dupn} copies")
    for name, repos in list(out["duplicate_files"].items())[:6]:
        print(f"    {name:26} ×{len(repos)}")
    if dead:
        print(f"\n  dead/empty repos ({len(dead)}): {', '.join(r.split('/')[-1] for r in dead)}")
    print(f"\n  → {outp}")


if __name__ == "__main__":
    main()
