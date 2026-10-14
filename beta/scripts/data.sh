#!/usr/bin/env bash
# public/data/activity.json: commits a day over the last 60 days in the kit and every app built on it, read from
# their local git logs when the site is built. Real data for the widget bench's scrubber and ticker. Run by
# scripts/check.sh and scripts/site-deploy.sh before the build; never typed by hand.
set -euo pipefail
cd "$(dirname "$0")/.."
(cd .. && bun run beta/scripts/record.ts)
python3 - <<'PY'
import json, subprocess, datetime, pathlib
home = pathlib.Path.home() / "projects"
repos = {"bradleyio": "isenbek/bradley.io", "kit": "tinymachines/kit"}
today = datetime.date.today()
days = [(today - datetime.timedelta(days=i)).isoformat() for i in range(59, -1, -1)]
per = {d: 0 for d in days}
by_repo = {}
for name in repos:
    path = home / name
    if not (path / ".git").exists():
        continue
    out = subprocess.run(["git", "-C", str(path), "log", "--all", f"--since={days[0]}", "--format=%cs"],
                         capture_output=True, text=True).stdout.split()
    n = 0
    for d in out:
        if d in per:
            per[d] += 1; n += 1
    tag = subprocess.run(["git", "-C", str(path), "describe", "--tags", "--abbrev=0"], capture_output=True, text=True).stdout.strip()
    by_repo[name] = {"repo": repos[name], "commits60": n, "tag": tag or None}
data = {"generated": datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds"),
        "what": "commits a day in bradley.io and the kit, from their git logs",
        "days": [{"t": d, "v": per[d]} for d in days], "repos": by_repo}
p = pathlib.Path("public/data/activity.json"); p.parent.mkdir(parents=True, exist_ok=True)
p.write_text(json.dumps(data, indent=1) + "\n")
print(f"wrote {p}: {sum(per.values())} commits over 60 days across {len(by_repo)} repos")
PY

# The family's marks (isenbek/bradley.io #11): each site's one-colour mark from the meatball-labs registry checkout
# (family/sites/<n>-<hue>/assets/<name>-one-color.svg, the brand library's source of truth), copied to
# public/family/<hue>.svg with public/family/marks.json naming the ones that exist. Scene 8 draws each as a mask in the
# site's own colour; a site with no mark keeps its dot. A missing checkout keeps the last copy.
python3 - <<'MARKS'
import json, pathlib, re, shutil
src = pathlib.Path.home() / "projects/meatball-labs/family/sites"
out = pathlib.Path("public/family"); out.mkdir(parents=True, exist_ok=True)
if not src.exists():
    print("marks: no meatball-labs checkout; keeping public/family as it is"); raise SystemExit
marks = {}
for site in sorted(src.iterdir()):
    m = re.match(r"\d+-([a-z]+)$", site.name)
    j = site / "site.json"
    if not m or not j.exists(): continue
    hue, meta = m.group(1), json.loads(j.read_text())
    one = sorted((site / "assets").glob("*-one-color.svg")) if (site / "assets").exists() else []
    if meta.get("name") and one:
        shutil.copyfile(one[0], out / f"{hue}.svg"); marks[hue] = {"name": meta["name"], "file": f"/family/{hue}.svg", "from": one[0].name}
(out / "marks.json").write_text(json.dumps(marks, indent=1) + "\n")
print(f"marks: {len(marks)} family marks copied to public/family/")
MARKS
