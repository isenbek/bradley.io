#!/usr/bin/env python3
"""
Site-data pipeline for bradley.io: writes public/data/site-data.json.

The file is called nightly-pipeline.py for historical reasons. It is NOT
nightly: scripts/refresh-4h.sh runs it every 4 hours from cron.

WHAT IT READS
  data/claude-activity.duckdb   durable Claude Code record, through
                                scripts/activity_db.py: the stats block, the
                                Claude Code projects and the per-day feed items
  docs/spicy-claude-web/        a Claude Web export from February 2026 (static)
  gh repo view                  the featured GitHub repos (FEATURED_REPOS)
  public/data/*-timeline.json   repo descriptions already published by
                                scripts/nominate-timeline-pipeline.py
  ~/projects/<name>/CLAUDE.md   technology mentions for a Claude Code project
  public/data/ai-pilot-data.json  skills list for the about block, and the
                                fallback project list when the durable record
                                cannot be read
  the previous site-data.json   so that nothing good is lost on a bad run

WHAT IT WRITES
  site-data.json (atomically), then runs scripts/generate-mcp-catalog.py.

STATS AND WHAT THEY COVER
  totalSessions, totalMessages, activeDays and streak come from the durable
  record, never from the raw session logs (those are a rolling window of about
  30 days, which is how the site came to say "Active days 38" next to 434,797
  messages). stats.coverage states the first and last day covered and defines
  each number. totalMessages is a count of transcript records, not of messages
  somebody typed; the definition is in stats.coverage.definitions.
  If the durable record cannot be read, the previous stats are kept and
  stats.coverage.stale is true. If there is no previous file either, nothing
  is written and the exit code is 1: zeros are never published.

TEXT AND THE MODEL
  A description comes from, in this order: the Claude Web project's own note,
  but ONLY for a project on the publication list (next section); the GitHub
  repo's own description; the repo description in a published timeline file;
  the description already published. The model is never asked to write a
  description, because all it would have to go on is the project's name.
  A tagline is, in this order: the GitHub repo's description; a model tagline
  cached for the same description; the tagline already published (unless that
  one was only a copy of a short description, which has to follow the
  description); the description itself when it is at most 80 characters; a
  model compression of a longer description, asked through scripts/ai_client.py
  (gateway first, then local Ollama) and told to use only the facts in that
  description. Only a note on the publication list, a GitHub description or a
  timeline description is ever compressed or copied this way.
  A project with no description anywhere gets no tagline and no description.
  That is counted ("without evidence") and printed, not papered over.
  A failed model call is logged on stderr every time, is never cached, and
  never empties a field: the earlier tagline stays.
  Each project carries provenance {tagline, description} saying which of
  these happened.

CLAUDE WEB NOTES ARE PRIVATE UNLESS LISTED
  The "description" of a Claude Web project is a note its owner typed to
  himself ("Get a new job.", a relative's name, a client's business). It was
  not written for publication. A note is published only when its slug is in
  CLAUDE_WEB_NOTES_PUBLIC (the 25 notes that were already the published
  description on 2026-10-02) or in env CLAUDE_WEB_NOTES_ALLOW; env
  CLAUDE_WEB_NOTES_DENY takes one back. Every other note is withheld: it is
  not published, not sent to the model, and neither it nor a model tagline
  compressed from it is carried over from an earlier file or the cache.
  What a withheld project shows instead, by env CLAUDE_WEB_WITHHELD_TEXT:
    keep (default)  the description already published, unchanged. For the 37
                    projects this applies to on 2026-10-02 that is a model
                    expansion from before June 2026, and it is labelled
                    "ai-legacy" so that it can be told apart. Nothing is lost
                    and nothing new is exposed while the owner decides.
    empty           a timeline description when a repo of the same name has
                    one, else no description at all.
  --list-notes prints every note with its state and what is shown instead,
  and writes nothing. That list is what the owner says yes or no to.

REMOVED 2026-10-02 (see git history for the code)
  Big Ideas, Claude's Corner and claudeInvolvement. All three asked a model to
  invent text (themes of the week, a witty quote "from Claude", a first-person
  account of what Claude did on a project) and no page on this site reads any
  of the three keys. The gateway they called has been dead since June, so the
  keys have not been in the file for months.

EXIT CODE
  0 when site-data.json was written, including with a degraded or absent
  model, an unreadable durable record (previous stats kept) or a failed MCP
  catalog. 1 only when nothing usable could be written.

Usage:
  python3 scripts/nightly-pipeline.py [options]

  --out PATH           write site-data.json to PATH instead of public/data.
                       The cache and the MCP catalog then go next to PATH too,
                       so a test run touches nothing the site reads.
  --cache PATH         tagline cache (default .summary-cache.json in the repo
                       root, or next to --out)
  --limit-ai N         at most N model calls this run (0 = none)
  --ai-budget-min M    stop asking the model after M minutes (default 15,
                       env AI_BUDGET_MIN, 0 = no limit)
  --refresh-ai         ask again for every tagline the model may write
  --skip-ai            no model calls at all
  --skip-github        no gh calls; GitHub facts are carried over from the
                       previous file
  --skip-mcp           do not run generate-mcp-catalog.py
  --db PATH            DuckDB file to read (default data/claude-activity.duckdb)
  --accept-shrink      write even if the project list lost more than half
  --list-notes         print every Claude Web project note, whether it is
                       published or withheld, and what is shown instead; then
                       exit without writing anything
  --verbose, -v
"""

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from collections import Counter
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Any

# No .pyc files next to the scripts: scripts/__pycache__ is not git-ignored.
sys.dont_write_bytecode = True

# --- Configuration ----------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
DEFAULT_OUTPUT = PROJECT_ROOT / "public" / "data" / "site-data.json"
PUBLIC_DATA = PROJECT_ROOT / "public" / "data"
AI_PILOT_FILE = PUBLIC_DATA / "ai-pilot-data.json"
DEFAULT_CACHE = PROJECT_ROOT / ".summary-cache.json"
USER_PROJECTS = Path.home() / "projects"

# Load .env BEFORE importing ai_client: it reads CBAI_URL and friends at import.
ENV_FILE = PROJECT_ROOT / ".env"
if ENV_FILE.exists():
    for _line in ENV_FILE.read_text().splitlines():
        _line = _line.strip()
        if _line and not _line.startswith("#") and "=" in _line:
            _key, _val = _line.split("=", 1)
            os.environ.setdefault(_key.strip(), _val.strip())

sys.path.insert(0, str(SCRIPT_DIR))
import activity_db  # noqa: E402  (durable aggregates; needs duckdb to return data)
import ai_client  # noqa: E402  (gateway then Ollama, quality gate, loud failures)

CLAUDE_WEB_DATA_DIR = Path(os.environ.get(
    "CLAUDE_WEB_DATA_DIR",
    str(PROJECT_ROOT / "docs" / "spicy-claude-web")
))

FEATURED_REPOS = os.environ.get(
    "FEATURED_REPOS",
    "tinymachines/esp32,Sysforge-AI/sfproject,tinymachines/sovereign,tinymachines/hotbits"
).split(",")

RESEARCH_PROJECTS = os.environ.get(
    "RESEARCH_PROJECTS",
    "hotbits,sovereign,zephyr,spondr,addai"
).split(",")

PROJECT_ALIASES_RAW = os.environ.get(
    "PROJECT_ALIASES",
    '{"esp":"esp32","sfproject":"sysforge","sf":"sysforge"}'
)
try:
    PROJECT_ALIASES: dict[str, str] = json.loads(PROJECT_ALIASES_RAW)
except json.JSONDecodeError:
    PROJECT_ALIASES = {}

# Claude Web project notes that may be published as a description, by slug.
# These 25 were already the published description, word for word, in
# public/data/site-data.json on 2026-10-02 (v1.0.409), so keeping them exposes
# nothing new. The other notes in the export (37 of them) had never been
# published: the old pipeline replaced any note under 50 characters with model
# text. They stay unpublished until the owner lists them. See the module
# docstring, and run --list-notes to read them.
CLAUDE_WEB_NOTES_PUBLIC = frozenset({
    "6502", "a-game", "ai-chat", "assembly", "azure", "carai", "consulting",
    "crawl", "esp32", "ferett", "g-combinator", "how-to-use-claude", "myfw",
    "plumbr", "redteam", "resurrecter", "rural-amfm", "ruralamfm", "rust",
    "swrm", "umbra", "victory-modeling", "vt25", "watr", "zephyr",
})


def _slug_set(env_name: str) -> frozenset[str]:
    return frozenset(x.strip().lower() for x in os.environ.get(env_name, "").split(",") if x.strip())


# Owner's switches, normally set in .env. ALLOW adds slugs ("all" publishes
# every note), DENY removes them and wins over both lists.
NOTES_ALLOW = _slug_set("CLAUDE_WEB_NOTES_ALLOW")
NOTES_DENY = _slug_set("CLAUDE_WEB_NOTES_DENY")
# What a project with a withheld note shows when no timeline describes it:
#   keep   the description already published (default; nothing changes on the
#          site and nothing is lost)
#   empty  no description. The earlier text is then gone from the file; it is
#          still in the git history of public/data/site-data.json.
WITHHELD_TEXT = os.environ.get("CLAUDE_WEB_WITHHELD_TEXT", "keep").strip().lower()
if WITHHELD_TEXT not in ("keep", "empty"):
    print(f"site-data: CLAUDE_WEB_WITHHELD_TEXT={WITHHELD_TEXT!r} is not 'keep' or 'empty'; using 'keep'",
          file=sys.stderr, flush=True)
    WITHHELD_TEXT = "keep"


def note_is_public(slug: str) -> bool:
    """May this Claude Web project's own note be published?"""
    if slug in NOTES_DENY:
        return False
    return slug in CLAUDE_WEB_NOTES_PUBLIC or slug in NOTES_ALLOW or "all" in NOTES_ALLOW


# How many Claude Code working directories become projects: the most active
# ones by transcript records. 20 is what the /ai-pilot mission log shows.
CODE_PROJECT_LIMIT = int(os.environ.get("SITE_DATA_CODE_PROJECTS", "20"))

# generate-mcp-catalog.py gives up by itself after 50 s and says why. This is
# the backstop for a child that hangs anyway, so it must stay above that.
MCP_TIMEOUT_S = int(os.environ.get("MCP_CATALOG_TIMEOUT_S", "90"))

# A timeline file older than this is a leftover (nominate-timeline.json has not
# been regenerated since March 2026) and is not used as evidence.
TIMELINE_MAX_AGE_DAYS = 30

TAGLINE_MAX = 80        # what the model is asked for
TAGLINE_HARD_MAX = 120  # what is accepted from it

VERBOSE = False
_WRITTEN = False  # set once site-data.json is on disk; decides the exit code


def log(msg: str) -> None:
    if VERBOSE:
        print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}")


def warn(msg: str) -> None:
    """One line on stderr, always. Failures are never verbose-only."""
    print(f"site-data: {msg}", file=sys.stderr, flush=True)


# Built from the code point so this file holds no em dash of its own.
_EM_DASH_RE = re.compile(r"\s*" + chr(0x2014) + r"\s*")


def clean_text(text: Any) -> str:
    """Published text: one line, no em dashes (site rule)."""
    if not isinstance(text, str):
        return ""
    text = re.sub(r"\s+", " ", text).strip()
    # A model summary now and then opens with a stray mark (an inverted question
    # mark heads one description in the published SysForge timeline).
    # An opening quotation mark is not stray: stripping it left "Spicy' is a
    # hardware project" with only its closing mark.
    text = re.sub(r"^[^\w\"'(\[\u2018\u201c]+", "", text)
    text = _EM_DASH_RE.sub(": ", text, count=1)
    text = _EM_DASH_RE.sub(", ", text)
    return text.strip(" :,")


def read_json(path: Path) -> Any:
    """Parsed JSON, or None with a stderr line when the file is unreadable."""
    try:
        return json.loads(path.read_text())
    except FileNotFoundError:
        return None
    except (OSError, ValueError) as e:
        warn(f"could not read {path}: {type(e).__name__}: {e}")
        return None


def write_json_atomic(path: Path, data: Any) -> None:
    """Write through a temp file and rename, so a reader never sees half a file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(f".{path.name}.tmp-{os.getpid()}")
    tmp.write_text(json.dumps(data, indent=2, default=str))
    os.replace(tmp, path)


# --- Category classification --------------------------------------------------

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "hardware": [
        "esp32", "raspberry pi", "rpi", "arduino", "lora", "mesh", "ble",
        "bluetooth", "wifi", "802.11", "probe", "sensor", "gpio", "uart",
        "spi", "i2c", "firmware", "zephyr", "rtos", "nrf52", "stm32",
        "platformio", "freertos", "pcb", "antenna", "rf", "radio",
        "rtl-sdr", "sdr", "usb", "entropy",
    ],
    "ai-ml": [
        "claude", "llm", "gpt", "language model", "nlp", "prompt",
        "embedding", "transformer", "inference", "fine-tune", "rag",
        "agent", "sovereign", "compiler", "lexer", "parser", "repl",
        "language design", "type system",
    ],
    "data": [
        "snowflake", "duckdb", "etl", "pipeline", "data warehouse",
        "dimensional", "dbt", "airflow", "spark", "kafka", "sql",
        "analytics", "schema", "migration", "parquet", "arrow",
    ],
    "systems": [
        "docker", "kubernetes", "nginx", "deployment", "ci/cd",
        "microservice", "api", "fastapi", "distributed", "devops",
        "monitoring", "terraform", "infrastructure", "campaign brain",
        "sysforge", "mcp", "webhook", "gateway",
    ],
    "creative": [
        "eeg", "brainwave", "generative", "art", "music", "experiment",
        "research", "prototype", "trng", "random", "entropy", "creative",
        "visualization", "three.js", "d3", "interactive",
    ],
}

# Whole words only (a plural "s" is allowed). The old test was a bare substring,
# so "art" matched "smart" and "start", "rf" matched "interface", "ble" matched
# "available", "api" matched "rapid" and "rag" matched "storage".
_CATEGORY_RES: dict[str, list[re.Pattern]] = {
    cat: [re.compile(r"(?<![a-z0-9])" + re.escape(kw) + r"s?(?![a-z0-9])") for kw in kws]
    for cat, kws in CATEGORY_KEYWORDS.items()
}


def classify_category(name: str, description: str, technologies: list[str]) -> tuple[str, str]:
    """(category, basis). basis is "keywords" when at least one keyword
    matched, "default" when nothing did and "systems" is only the fallback."""
    text = f"{name} {description} {' '.join(technologies)}".lower()
    scores = {cat: sum(1 for rx in rxs if rx.search(text)) for cat, rxs in _CATEGORY_RES.items()}
    best = max(scores, key=lambda k: scores[k])
    if scores[best] == 0:
        return "systems", "default"
    return best, "keywords"


def normalize_name(name: str) -> str:
    """Normalize a project name for matching across sources."""
    name = name.lower().strip()
    for alias, canonical in PROJECT_ALIASES.items():
        if name == alias:
            return canonical
    name = re.sub(r"^(tinymachines|sysforge-ai)/", "", name)
    name = re.sub(r"\.(py|ts|js|rs)$", "", name)
    name = re.sub(r"[^a-z0-9]", "-", name)
    name = re.sub(r"-+", "-", name).strip("-")
    return name


def _alnum(name: str) -> str:
    return re.sub(r"[^a-z0-9]", "", name.lower())


# --- Technology detection ------------------------------------------------------
#
# The technologies of a Claude Code project are the ones its own CLAUDE.md
# mentions. This used to be copied from ai-pilot-data.json's mission log, whose
# detector is `tech.lower() in content.lower()`. What that matched, checked
# 2026-10-02 against the six CLAUDE.md files it had results for:
#   tinychase  "Docker"  from "No branches, no PRs, no Docker."  (a prohibition)
#   terrapulse "Docker"  from "systemd + nginx. No Docker."
#   every one  "Go"      from logo, goes, category, government
#   four       "Rust"    from trust, trusted, trusting
#   three      "AWS"     from draws, redraws, withdraws
#   three      "SPI"     from spinning, despite, aspirational
#   proton     "Git"     from digital, legitimate
#   others     "TLS" from starttls, "HTML" from fasthtml, "JWT" from pyjwt
# It also kept the first 8 hits in list order, so a real technology late in the
# list lost its place to a false one early in it.
#
# This detector: whole words only, on the original text; a mention that follows
# a negation ("no Docker", "instead of Redis") does not count; names that are
# also English words are case-sensitive; the 8 most mentioned are kept, file
# formats and everyday tools last.

def _word(pattern: str, flags: int = re.IGNORECASE) -> re.Pattern:
    return re.compile(r"(?<![A-Za-z0-9_])(?:" + pattern + r")(?![A-Za-z0-9_])", flags)


# "Go" on its own is a verb. Count it only where it is plainly the language.
_GO_RE = re.compile(
    r"(?<![A-Za-z0-9_])(?:"
    r"[Gg]olang"
    r"|go\.mod|go\.sum"
    r"|go (?:build|run|test|install|get|vet|mod|generate)(?![A-Za-z0-9_])"
    r"|(?:in|with|a|the|pure) Go(?![A-Za-z0-9_])(?! to)"
    r"|Go (?:binary|service|module|program|code|toolchain|daemon|server|worker|package|compiler|runtime|\d)"
    r"|Go(?=,|/|\s+(?:and|or)\s+[A-Z])"
    r")"
)

_TECH_SPECIAL: dict[str, re.Pattern] = {
    "Python": _word(r"python3?"),
    "SQLite": _word(r"sqlite3?"),
    "Tailwind CSS": _word(r"tailwind(?:\s?css)?"),
    "Next.js": _word(r"next\.?js"),
    "Node.js": _word(r"node\.?js"),
    "Vue.js": _word(r"vue\.?js"),
    "D3.js": _word(r"d3(?:\.js)?"),
    "PostgreSQL": _word(r"postgres(?:ql)?"),
    "Docker": _word(r"docker(?:file)?"),
    "Kubernetes": _word(r"kubernetes|k8s"),
    "REST API": _word(r"rest(?:ful)? apis?"),
    "WebSocket": _word(r"websockets?"),
    "JWT": _word(r"jwts?"),
    "C++": re.compile(r"(?<![A-Za-z0-9_])c\+\+", re.IGNORECASE),
    "Go": _GO_RE,
    # Also English words: only the capitalised form counts.
    "Rust": _word(r"Rust", 0),
    "Angular": _word(r"Angular", 0),
}

_TECH_NAMES = [
    "Python", "TypeScript", "JavaScript", "React", "Next.js", "Tailwind CSS",
    "D3.js", "Node.js", "FastAPI", "Flask", "Django", "Docker", "Nginx",
    "PostgreSQL", "SQLite", "DuckDB", "Redis", "MongoDB", "Snowflake",
    "AWS", "GCP", "Azure", "Vercel", "GitHub Actions", "Terraform",
    "Kubernetes", "Raspberry Pi", "Arduino", "ESP32", "MQTT", "LoRa",
    "Ollama", "LangChain", "OpenAI", "Anthropic", "Rust", "Go", "C++",
    "Svelte", "Vue.js", "Angular", "GraphQL", "REST API", "WebSocket",
    "Socket.IO", "Framer Motion", "Recharts", "Shadcn", "Radix UI",
    "CSS", "HTML", "Bash", "Linux", "systemd", "PM2",
    "Git", "Markdown", "MDX", "JSON", "YAML", "TOML", "CSV",
    "Pandas", "NumPy", "Jupyter", "Matplotlib", "Seaborn",
    "TLS", "Ed25519", "JWT", "OAuth", "SSH", "WireGuard",
    "Meshtastic", "Zigbee", "Bluetooth", "I2C", "SPI", "GPIO",
    "SWR", "Zustand", "Redux", "MobX", "Prisma", "Drizzle",
    "Pydantic", "SQLAlchemy", "Alembic", "Pytest",
]
TECH_PATTERNS: list[tuple[str, re.Pattern]] = [
    (name, _TECH_SPECIAL.get(name) or _word(re.escape(name))) for name in _TECH_NAMES
]

# File formats and everyday tools. Every CLAUDE.md mentions them (a ```bash
# fence, a .json path, "git add"), so by count alone they crowd out the
# languages, frameworks and databases that say what the project is. They are
# listed only after everything else.
_TECH_GENERIC = {
    "CSS", "HTML", "JSON", "YAML", "TOML", "CSV", "Markdown", "MDX",
    "Git", "Bash", "Linux", "SSH", "TLS",
}

# The words just before a mention that turn it into "we do not use this". At
# most one word may sit between ("no more Docker", "never use Docker").
_NEGATED_RE = re.compile(
    r"(?:\bno|\bnot|\bnever|\bwithout|\bzero|\binstead of|\brather than|\bno longer"
    r"|\bdon't use|\bdo not use|\bavoid(?:s|ing)?|\bremoved|\bdropped|\breplaced"
    r"|\bretired|\bforbids?|\bforbidden)\s+(?:[\w'-]+\s+)?$",
    re.IGNORECASE,
)


def detect_technologies_in(text: str, limit: int = 8) -> list[str]:
    """Technology names mentioned in text, most mentioned first."""
    counts: dict[str, int] = {}
    for name, rx in TECH_PATTERNS:
        n = 0
        for m in rx.finditer(text):
            before = re.sub(r"[*`_]", "", text[max(0, m.start() - 40):m.start()])
            if _NEGATED_RE.search(before):
                continue
            n += 1
        if n:
            counts[name] = n
    order = {name: i for i, (name, _) in enumerate(TECH_PATTERNS)}
    return sorted(counts, key=lambda k: (k in _TECH_GENERIC, -counts[k], order[k]))[:limit]


def detect_technologies(project_name: str) -> list[str]:
    """Technologies of a Claude Code project, from ~/projects/<name>/CLAUDE.md.

    Only an exact directory name counts. The old matcher accepted any CLAUDE.md
    whose directory name contained, or was contained in, the project name. A
    project with no CLAUDE.md of its own gets an empty list, not a neighbour's.
    """
    if not project_name or "/" in project_name or project_name.startswith("."):
        return []
    md = USER_PROJECTS / project_name / "CLAUDE.md"
    try:
        text = md.read_text(errors="replace")
    except OSError:
        return []
    return detect_technologies_in(text)


# --- Stage 1: Collect ----------------------------------------------------------

def collect_claude_web() -> dict[str, Any]:
    """Read the Claude Web export (static since February 2026)."""
    result: dict[str, Any] = {"projects": [], "conversations": [], "memories": []}
    for key in ("projects", "conversations", "memories"):
        data = read_json(CLAUDE_WEB_DATA_DIR / f"{key}.json")
        result[key] = data if isinstance(data, list) else []
        log(f"Claude Web: {len(result[key])} {key}")
    if not result["projects"]:
        warn(f"no Claude Web projects found in {CLAUDE_WEB_DATA_DIR}")
    return result


def _carried_repo(repo_spec: str, previous_by_repo: dict[str, dict]) -> dict[str, Any] | None:
    """A repo record rebuilt from the previous site-data.json, for when gh
    cannot be asked. The repo's own description is carried only where the
    previous file shows it was one: labelled "github", or, in a file from
    before labels, a tagline identical to the description (which is what a
    GitHub description produced). Otherwise the text is left empty and the
    published text is kept further down."""
    prev = previous_by_repo.get(repo_spec)
    if not prev:
        return None
    gh = (prev.get("sources") or {}).get("github") or {}
    label = (prev.get("provenance") or {}).get("tagline")
    tagline = prev.get("tagline") or ""
    was_github_text = label == "github" or (
        label is None and bool(tagline) and tagline == prev.get("description"))
    return {
        "name": repo_spec.split("/")[-1],
        "description": tagline if was_github_text else None,
        "pushedAt": prev.get("lastActivity") or gh.get("lastPush") or "",
        "stargazerCount": gh.get("stars", 0),
        "primaryLanguage": {"name": gh.get("language", "")},
        "fullName": repo_spec,
        "carried": True,
    }


def collect_github(previous_by_repo: dict[str, dict], skip: bool) -> list[dict[str, Any]]:
    """Fetch the featured repos with the gh CLI.

    A repo that cannot be fetched keeps what the previous file said about it,
    with a stderr line. It used to vanish from the file for that run.
    """
    repos = []
    for repo_spec in FEATURED_REPOS:
        repo_spec = repo_spec.strip()
        if not repo_spec:
            continue
        failure = "--skip-github" if skip else None
        if not skip:
            try:
                result = subprocess.run(
                    ["gh", "repo", "view", repo_spec, "--json",
                     "name,description,url,pushedAt,stargazerCount,primaryLanguage,isPrivate"],
                    capture_output=True, text=True, timeout=20,
                )
                if result.returncode == 0:
                    data = json.loads(result.stdout)
                    data["fullName"] = repo_spec
                    repos.append(data)
                    log(f"GitHub: fetched {repo_spec}")
                    continue
                failure = f"gh exited {result.returncode}: {result.stderr.strip()[:160]}"
            except (subprocess.TimeoutExpired, FileNotFoundError, ValueError) as e:
                failure = f"{type(e).__name__}: {e}"

        carried = _carried_repo(repo_spec, previous_by_repo)
        if carried:
            repos.append(carried)
        if skip:
            log(f"GitHub: {repo_spec} " + ("carried over from the previous file" if carried else "skipped"))
        else:
            warn(f"GitHub FAIL {repo_spec}: {failure}; "
                 + ("kept what the previous file said" if carried
                    else "nothing earlier to keep, the repo is left out of this run"))
    return repos


def collect_ai_pilot() -> dict[str, Any] | None:
    data = read_json(AI_PILOT_FILE)
    if isinstance(data, dict):
        log(f"AI Pilot: loaded ({len(data.get('missionLog', []))} missions)")
        return data
    warn(f"{AI_PILOT_FILE} is missing or unreadable; the about block falls back to the built-in skills list")
    return None


def _status_for(last_active: str, today: date) -> str:
    """Same rule as the /ai-pilot mission log."""
    try:
        days_ago = (today - date.fromisoformat(last_active[:10])).days
    except ValueError:
        return "active"
    if days_ago <= 7:
        return "active"
    if days_ago <= 30:
        return "recent"
    return "archived"


def code_projects_from_record(agg: dict) -> list[dict[str, Any]]:
    """The most active Claude Code working directories in the durable record."""
    today = date.fromisoformat(agg["streaks"]["as_of"])
    return [
        {
            "name": p["project"],
            "sessions": p["sessions"],
            "messages": p["turns"],
            "lastActive": p["last_active"],
            "status": _status_for(p["last_active"], today),
        }
        for p in agg["projects"][:CODE_PROJECT_LIMIT]
    ]


def code_projects_from_ai_pilot(ai_pilot: dict | None) -> list[dict[str, Any]]:
    """Fallback when the durable record cannot be read: the mission log that
    ai-pilot-pipeline.py last published. Its technologies are not used."""
    out = []
    for m in (ai_pilot or {}).get("missionLog", []):
        if not m.get("name"):
            continue
        out.append({
            "name": m["name"],
            "sessions": m.get("sessions", 0),
            "messages": m.get("messages", 0),
            "lastActive": m.get("lastActive") or "",
            "status": m.get("status", "active"),
        })
    return out


def code_days_from_record(agg: dict) -> list[dict[str, Any]]:
    last_ts = agg["coverage"].get("last_ts") or ""
    days = []
    for d in agg["daily"]:
        stamp = d["date"] + "T23:59:00Z"
        if d["date"] == agg["coverage"].get("last_day") and last_ts:
            stamp = min(stamp, last_ts)  # today is not over: do not date it in the future
        days.append({"date": d["date"], "stamp": stamp, "records": d["turns"],
                     "sessions": d["sessions"], "toolCalls": d["tool_uses"]})
    return days


def code_days_from_ai_pilot(ai_pilot: dict | None) -> list[dict[str, Any]]:
    return [
        {"date": d["date"], "stamp": d["date"] + "T23:59:00Z", "records": d.get("count", 0),
         "sessions": d.get("sessions", 0), "toolCalls": d.get("toolCalls", 0)}
        for d in (ai_pilot or {}).get("activityHeatmap", [])
        if d.get("date") and d.get("count", 0) > 0
    ]


def load_timeline_repos() -> dict[str, dict[str, Any]]:
    """Repo descriptions the site already publishes, keyed by the repo name
    reduced to letters and digits. Where two orgs have a repo of the same name
    the one with more commits wins."""
    repos: dict[str, dict[str, Any]] = {}
    cutoff = datetime.now(timezone.utc) - timedelta(days=TIMELINE_MAX_AGE_DAYS)
    for path in sorted(PUBLIC_DATA.glob("*-timeline.json")):
        data = read_json(path)
        if not isinstance(data, dict):
            continue
        try:
            generated = datetime.fromisoformat(str(data.get("generated", "")).replace("Z", "+00:00"))
            if generated.tzinfo is None:
                generated = generated.replace(tzinfo=timezone.utc)
        except ValueError:
            generated = None
        if generated is None or generated < cutoff:
            log(f"Timeline: {path.name} skipped (generated {data.get('generated')!r} is older than "
                f"{TIMELINE_MAX_AGE_DAYS} days or unreadable)")
            continue
        for r in data.get("repos", []):
            raw = r.get("description")
            description = clean_text(raw)
            source = r.get("descriptionSource")
            # "Commits: a; b; c" is the timeline's no-description fallback, not a
            # description. Tested on the raw text: for a repo with no commits it
            # is "Commits: ", which clean_text reduces to the bare word.
            if not description or source in ("commits", "none") \
                    or str(raw).lstrip().startswith("Commits:"):
                continue
            if ai_client.is_non_answer(description):
                continue
            entry = {
                "org": data.get("org", ""),
                "repo": r.get("name", ""),
                "description": description,
                "commits": r.get("commits", 0) or 0,
                "descriptionSource": source or "unknown",
            }
            key = _alnum(entry["repo"])
            if key and (key not in repos or entry["commits"] > repos[key]["commits"]):
                repos[key] = entry
    log(f"Timeline: {len(repos)} repo descriptions available as evidence")
    return repos


# --- Stage 2: Merge & deduplicate ----------------------------------------------

def _new_project(norm: str, name: str) -> dict[str, Any]:
    return {
        "slug": norm,
        "name": name,
        "tagline": "",
        "description": "",
        "category": "systems",
        "isResearch": norm in RESEARCH_PROJECTS,
        "isFeatured": False,
        "status": "active",
        "technologies": [],
        "lastActivity": "",
        "totalMessages": 0,
        "sources": {},
        "provenance": {"tagline": "none", "description": "none"},
    }


def merge_projects(
    claude_web: dict[str, Any],
    github_repos: list[dict[str, Any]],
    code_projects: list[dict[str, Any]],
) -> tuple[list[dict[str, Any]], dict[str, str]]:
    """Build unified project records with linked sources.

    Returns (projects, withheld): withheld maps a slug to the Claude Web note
    that is NOT cleared for publication. It is kept out of the project records
    on purpose, so that nothing downstream can publish it by accident."""
    projects: dict[str, dict[str, Any]] = {}  # keyed by normalized name
    withheld: dict[str, str] = {}

    convo_name_index: dict[str, list[dict]] = {}
    for convo in claude_web.get("conversations", []):
        name = convo.get("name", "")
        if name:
            key = normalize_name(name.split(" - ")[0].split(":")[0])
            convo_name_index.setdefault(key, []).append(convo)

    # Claude Web projects
    for proj in claude_web.get("projects", []):
        name = proj.get("name", "Untitled")
        norm = normalize_name(name)
        if norm not in projects:
            p = _new_project(norm, name)
            note = clean_text(proj.get("description", ""))
            if note and note_is_public(norm):
                p["description"] = note
                p["provenance"]["description"] = "claude-web"
            elif note:
                withheld[norm] = note
            p["lastActivity"] = proj.get("updated_at", "")
            projects[norm] = p

        matched_convos = convo_name_index.get(norm, [])
        total_msgs = sum(len(c.get("chat_messages", [])) for c in matched_convos)
        last_convo = max((c.get("updated_at", "") for c in matched_convos), default="")
        if total_msgs > 0:
            projects[norm]["sources"]["claudeWeb"] = {
                "conversationCount": len(matched_convos),
                "totalMessages": total_msgs,
                "lastConversation": last_convo[:10] if last_convo else "",
            }
            projects[norm]["totalMessages"] += total_msgs

    # GitHub repos
    for repo in github_repos:
        name = repo.get("name", "")
        norm = normalize_name(name)
        if norm not in projects:
            projects[norm] = _new_project(norm, name)
        p = projects[norm]

        # The repo's own description is the tagline, and the description too
        # when the project has none. A carried-over repo has no text here: the
        # published text is kept further down.
        gh_description = clean_text(repo.get("description"))
        if gh_description:
            p["tagline"] = gh_description
            p["provenance"]["tagline"] = "github"
            if not p["description"]:
                p["description"] = gh_description
                p["provenance"]["description"] = "github"

        lang = repo.get("primaryLanguage") or {}
        pushed = repo.get("pushedAt", "") or ""
        p["sources"]["github"] = {
            "repo": repo.get("fullName", ""),
            "stars": repo.get("stargazerCount", 0),
            "language": lang.get("name", "") or "",
            "lastPush": pushed[:10],
        }
        p["isFeatured"] = True
        if pushed > p.get("lastActivity", ""):
            p["lastActivity"] = pushed

    # Claude Code working directories
    for cp in code_projects:
        name = cp["name"]
        norm = normalize_name(name)
        if not norm:
            continue
        if norm not in projects:
            p = _new_project(norm, name)
            p["status"] = cp["status"]
            p["lastActivity"] = cp["lastActive"]
            projects[norm] = p
        p = projects[norm]

        p["sources"]["claudeCode"] = {
            "totalSessions": cp["sessions"],
            "totalMessages": cp["messages"],
            "lastSession": cp["lastActive"][:10],
        }
        p["totalMessages"] += cp["messages"]
        p["technologies"] = detect_technologies(name)
        if cp["lastActive"] > p.get("lastActivity", ""):
            p["lastActivity"] = cp["lastActive"]
        if cp["status"] == "active":
            p["status"] = "active"

    return list(projects.values()), withheld


# --- Stage 3: Text, and the model for taglines only ---------------------------

# Provenance values a tagline may be compressed from: text somebody wrote, or
# text the site already publishes. "previous" is not one of them: its origin is
# not recorded, and a good share of it is model text from before June 2026.
GROUNDED = ("claude-web", "github", "timeline")
# Tagline labels that mean "this is the project's short description, repeated".
COPIED_FROM_DESCRIPTION = ("claude-web", "timeline")
PROVENANCE_LABELS = ("claude-web", "github", "timeline", "ai", "ai-cached", "ai-legacy", "previous")


def _kept_label(prev: dict, field: str) -> str:
    """The provenance of a value carried over from the previous file: what
    that file said about it, or "previous" when it said nothing (files written
    before October 2026 carry no provenance; much of their text is model text)."""
    label = (prev.get("provenance") or {}).get(field)
    if label == "ai":
        return "ai-cached"  # written by the model, but not on this run
    return label if label in PROVENANCE_LABELS else "previous"


def load_cache(path: Path) -> dict[str, Any]:
    """The tagline cache. Model taglines live under "v2", keyed by slug.

    The keys next to "v2" in the real file are the pre-October-2026 format
    (slug_hash and big_ideas_date, about 1,200 of them). They are never read
    and never written here; they are left in place so nothing is destroyed.
    """
    data = read_json(path)
    if not isinstance(data, dict):
        data = {}
    if not isinstance(data.get("v2"), dict):
        data["v2"] = {}
    return data


def _evidence_hash(name: str, description: str) -> str:
    return hashlib.md5(f"{name}|{description}".encode()).hexdigest()[:12]


def evidence_hash(proj: dict) -> str:
    return _evidence_hash(proj["name"], proj["description"])


def _tagline_prompt(proj: dict) -> str:
    techs = ", ".join(proj.get("technologies", [])[:6]) or "not recorded"
    return (
        "Write one tagline for the software project described below.\n"
        f"Rules: at most {TAGLINE_MAX} characters, one line, plain words. Use only facts "
        "stated in the description. Do not add features, numbers or claims that are not "
        "there. No marketing words (unlock, unleash, revolutionize, seamless, powerful), "
        "no exclamation marks, no quotation marks.\n\n"
        f"Project name: {proj['name']}\n"
        f"Description: {proj['description'][:600]}\n"
        f"Technologies: {techs}\n\n"
        'Return only JSON: {"tagline": "..."}'
    )


def _tagline_from_answer(answer: str | None) -> tuple[str | None, str]:
    """(tagline, why_not). The model's field is checked again here: it is about
    to be published and cached."""
    if answer is None:
        return None, "no answer"
    obj = ai_client.extract_json(answer) or {}
    raw = obj.get("tagline")
    if not isinstance(raw, str) or ai_client.is_non_answer(raw):
        return None, f"tagline is not usable text ({str(raw)[:40]!r})"
    tagline = clean_text(raw).strip("\"'“” ")
    if len(tagline) < 8:
        return None, f"tagline too short ({tagline!r})"
    if len(tagline) > TAGLINE_HARD_MAX:
        return None, f"tagline too long ({len(tagline)} characters, {TAGLINE_HARD_MAX} accepted)"
    return tagline, ""


def fill_text(
    projects: list[dict[str, Any]],
    timeline: dict[str, dict[str, Any]],
    previous_by_slug: dict[str, dict],
    cache: dict[str, Any],
    opt: argparse.Namespace,
    withheld: dict[str, str],
) -> dict[str, Any]:
    """Fill descriptions and taglines by the rules in the module docstring.
    Returns the counters for the summary lines. Mutates projects and cache.

    withheld is {slug: note} for the Claude Web notes that may not be
    published. Nothing equal to such a note, and no model tagline compressed
    from one, is carried over from the previous file or from the cache."""
    v2 = cache["v2"]
    counts = {
        "succeeded": 0, "failed": 0, "reused": 0, "keptPrevious": 0,
        "notAttempted": 0, "skippedByLimit": 0, "skippedByBudget": 0,
        "skippedBackendsDown": 0, "skippedNoAi": 0, "noEvidence": 0,
        "fromDescription": 0, "fromSource": 0,
        "notesPublished": sum(1 for p in projects if p["provenance"]["description"] == "claude-web"),
        "notesWithheld": len(withheld), "withheldTimeline": 0, "withheldOtherSource": 0,
        "withheldKeptEarlier": 0, "withheldEmpty": 0,
    }
    to_ask: list[dict] = []

    for p in projects:
        prev = previous_by_slug.get(p["slug"]) or {}
        prov = p["provenance"]
        note = withheld.get(p["slug"])
        prev_description = clean_text(prev.get("description"))
        prev_tagline = clean_text(prev.get("tagline"))
        prev_description_label = _kept_label(prev, "description") if prev_description else "none"
        entry = v2.get(p["slug"]) if isinstance(v2.get(p["slug"]), dict) else None
        if note:
            # The earlier file or the cache may hold the note itself (it was
            # public once and has been taken back) or a model tagline that was
            # compressed from it. Neither is carried over.
            if prev_description == note:
                prev_description = ""
            if prev_tagline == note:
                prev_tagline = ""
            if entry and entry.get("evidenceHash") == _evidence_hash(p["name"], note):
                if prev_tagline == clean_text(entry.get("tagline")):
                    prev_tagline = ""
                entry = None
            if prev_description and prev_description_label == "previous":
                # A file from before provenance, a note that was never
                # published, and a description that is not the note: the only
                # other thing the old pipeline could put there was model text.
                prev_description_label = "ai-legacy"
            if WITHHELD_TEXT == "empty" and prev_description_label in ("ai-legacy", "claude-web"):
                prev_description = ""
            if p["description"]:
                counts["withheldOtherSource"] += 1  # the GitHub repo's own description
            elif prev_description and prev_description_label == "ai-legacy":
                # Keep mode: the published text stays exactly as it is. It is
                # not swapped for a timeline description here, because the only
                # link between a 2025 Claude Web project and a repo is the name
                # (tinymachines/spydr is described there as a blockchain project).
                p["description"] = prev_description
                prov["description"] = "ai-legacy"
                counts["withheldKeptEarlier"] += 1
                prev_description = ""

        # Description: the project's own, else the published timeline's, else
        # whatever was published before. Never the model.
        if not p["description"]:
            hit = timeline.get(_alnum(p["name"])) or timeline.get(_alnum(p["slug"]))
            if hit:
                p["description"] = hit["description"]
                prov["description"] = "timeline"
                p["sources"]["timeline"] = {
                    "org": hit["org"], "repo": hit["repo"], "commits": hit["commits"],
                    "descriptionSource": hit["descriptionSource"],
                }
                if note:
                    counts["withheldTimeline"] += 1
        if not p["description"] and prev_description:
            p["description"] = prev_description
            prov["description"] = prev_description_label
            if note:
                counts["withheldKeptEarlier"] += 1
        if note and not p["description"]:
            counts["withheldEmpty"] += 1

        # Tagline.
        if p["tagline"]:
            counts["fromSource"] += 1
            continue
        grounded = bool(p["description"]) and prov["description"] in GROUNDED
        short = grounded and len(p["description"]) <= TAGLINE_MAX
        fallback = clean_text((entry or {}).get("tagline")) or prev_tagline
        p["_fallback"] = fallback
        p["_fallback_label"] = "ai-cached" if clean_text((entry or {}).get("tagline")) \
            else _kept_label(prev, "tagline")
        # An earlier tagline that was only a copy of a short description is not
        # worth keeping for its own sake: it has to follow the description.
        prev_was_copy = (prev.get("provenance") or {}).get("tagline") in COPIED_FROM_DESCRIPTION \
            and not entry

        if grounded and entry and entry.get("evidenceHash") == evidence_hash(p) \
                and entry.get("tagline") and not opt.refresh_ai:
            p["tagline"] = clean_text(entry["tagline"])
            prov["tagline"] = "ai-cached"
            counts["reused"] += 1
        elif short and (prev_was_copy or opt.refresh_ai or not fallback):
            p["tagline"] = p["description"]
            prov["tagline"] = prov["description"]
            counts["fromDescription"] += 1
        elif grounded and not short and (opt.refresh_ai or entry or prev_was_copy or not fallback):
            # Asked now: a forced refresh, a description that changed since the
            # tagline was written, or no tagline anywhere.
            to_ask.append(p)
        elif fallback:
            p["tagline"] = fallback
            prov["tagline"] = p["_fallback_label"]
            counts["keptPrevious"] += 1
        else:
            counts["noEvidence"] += 1

    # The model, most visible projects first.
    to_ask.sort(key=lambda p: (not p["isFeatured"], -p.get("totalMessages", 0), p["slug"]))
    deadline = time.monotonic() + opt.ai_budget_min * 60 if opt.ai_budget_min > 0 else None
    asked = 0
    cache_dirty = False
    for p in to_ask:
        skip = None
        if opt.skip_ai:
            skip = "skippedNoAi"
        elif opt.limit_ai is not None and asked >= opt.limit_ai:
            skip = "skippedByLimit"
        elif not ai_client.available():
            skip = "skippedBackendsDown"
        elif deadline is not None and time.monotonic() >= deadline:
            skip = "skippedByBudget"

        tagline = None
        if skip:
            counts[skip] += 1
            counts["notAttempted"] += 1
        else:
            asked += 1
            log(f"AI tagline: {p['name']}")
            answer = ai_client.chat(
                _tagline_prompt(p),
                max_tokens=120,
                timeout=90,
                min_chars=20,
                want_json=True,
                require=("tagline",),
                label=f"tagline:{p['slug']}",
            )
            tagline, why_not = _tagline_from_answer(answer)
            if tagline is None:
                counts["failed"] += 1
                if answer is not None:  # ai_client already reported its own failures
                    warn(f"AI FAIL label=tagline:{p['slug']} error={why_not}")
            else:
                counts["succeeded"] += 1
                meta = ai_client.last_meta()
                v2[p["slug"]] = {
                    "tagline": tagline,
                    "evidenceHash": evidence_hash(p),
                    "generatedAt": datetime.now(timezone.utc).isoformat(),
                    "backend": meta.get("backend"),
                    "model": meta.get("model"),
                }
                cache_dirty = True

        if tagline:
            p["tagline"] = tagline
            p["provenance"]["tagline"] = "ai"
        elif p.get("_fallback"):
            # Never emptied: the earlier tagline stays until the model answers.
            p["tagline"] = p["_fallback"]
            p["provenance"]["tagline"] = p["_fallback_label"]
            counts["keptPrevious"] += 1

    for p in projects:
        p.pop("_fallback", None)
        p.pop("_fallback_label", None)

    # Last check before anything is written: whatever path a text took, a
    # withheld note is not published. (The same words coming from the GitHub
    # repo or a timeline file are public already and are left alone.)
    for p in projects:
        note = withheld.get(p["slug"])
        for field in ("description", "tagline"):
            if note and p[field] == note and p["provenance"][field] not in ("github", "timeline"):
                warn(f"WITHHELD NOTE reached the {field} of {p['slug']!r}; the field is emptied. "
                     "This is a bug in fill_text, please report it.")
                p[field] = ""
                p["provenance"][field] = "none"

    if deadline is not None and counts["skippedByBudget"]:
        warn(f"AI time budget of {opt.ai_budget_min:g} min reached; "
             f"{counts['skippedByBudget']} taglines left for the next run")
    if counts["skippedBackendsDown"]:
        warn(f"no AI backend left; {counts['skippedBackendsDown']} taglines not asked for, earlier values kept")

    counts["cacheDirty"] = cache_dirty
    return counts


def ai_summary_line(c: dict[str, Any], opt: argparse.Namespace) -> str:
    why = []
    if c["skippedNoAi"]:
        why.append(f"--skip-ai {c['skippedNoAi']}")
    if c["skippedByLimit"]:
        why.append(f"--limit-ai {opt.limit_ai}: {c['skippedByLimit']}")
    if c["skippedByBudget"]:
        why.append(f"time budget {c['skippedByBudget']}")
    if c["skippedBackendsDown"]:
        why.append(f"no backend left {c['skippedBackendsDown']}")
    not_attempted = f"{c['notAttempted']} not attempted" + (f" ({', '.join(why)})" if why else "")
    return (
        f"AI taglines: {c['succeeded']} succeeded, {c['failed']} failed, "
        f"{c['reused']} reused from cache, {c['keptPrevious']} kept from the previous file, "
        f"{not_attempted}, {c['noEvidence']} projects without evidence left empty"
    )


def notes_summary_line(c: dict[str, Any]) -> str:
    if not c["notesWithheld"]:
        return f"Claude Web notes: {c['notesPublished']} published as descriptions, none withheld"
    shown = []
    if c["withheldKeptEarlier"]:
        shown.append(f"{c['withheldKeptEarlier']} keep the description already published")
    if c["withheldTimeline"]:
        shown.append(f"{c['withheldTimeline']} use a timeline description")
    if c["withheldOtherSource"]:
        shown.append(f"{c['withheldOtherSource']} use the GitHub description")
    if c["withheldEmpty"]:
        shown.append(f"{c['withheldEmpty']} have no description")
    return (
        f"Claude Web notes: {c['notesPublished']} published as descriptions, "
        f"{c['notesWithheld']} withheld ({', '.join(shown)}). --list-notes prints them."
    )


def print_notes_report(claude_web: dict[str, Any], previous_by_slug: dict[str, dict]) -> None:
    """--list-notes: every Claude Web project note, its state, and what the
    current file shows for that project. Local output for the owner; nothing
    is written anywhere."""
    seen: set[str] = set()
    public: list[tuple[str, str]] = []
    held: list[tuple[str, str, str]] = []
    for proj in claude_web.get("projects", []):
        slug = normalize_name(proj.get("name", "Untitled"))
        if slug in seen:
            continue
        seen.add(slug)
        note = clean_text(proj.get("description", ""))
        if not note:
            continue
        if note_is_public(slug):
            public.append((slug, note))
        else:
            held.append((slug, note, clean_text((previous_by_slug.get(slug) or {}).get("description"))))
    print(f"\nClaude Web project notes in {CLAUDE_WEB_DATA_DIR / 'projects.json'}: "
          f"{len(public) + len(held)} projects have one.")
    print(f"\nPUBLISHED ({len(public)}): the note itself is the project's description.")
    for slug, note in sorted(public):
        print(f"  {slug:<20} {note}")
    print(f"\nWITHHELD ({len(held)}): the note is not published anywhere.")
    for slug, note, shown in sorted(held):
        print(f"  {slug:<20} note:  {note}")
        if shown == note:
            print(f"  {'':<20} now:   THE NOTE ITSELF is in the current file; the next run removes it")
        else:
            print(f"  {'':<20} now:   {shown or '(no description)'}")
    print(
        "\nTo publish a withheld note, add its slug to CLAUDE_WEB_NOTES_ALLOW in .env "
        "(comma separated; 'all' publishes every note).\n"
        "To take a published note back, add its slug to CLAUDE_WEB_NOTES_DENY.\n"
        "To blank the model-written descriptions of withheld projects instead of keeping them, "
        "set CLAUDE_WEB_WITHHELD_TEXT=empty."
    )


# --- Stage 4: Activity feed ------------------------------------------------------

def _feed_project(norm: str, projects: list[dict[str, Any]]) -> dict | None:
    """The project an event belongs to: the same slug, or one name containing
    the other when the shorter is at least 5 characters. Without that floor a
    two-letter slug ("os", "cc") claimed every conversation with those letters
    in its title."""
    for proj in projects:
        if proj["slug"] == norm:
            return proj
    for proj in projects:
        a, b = sorted((proj["slug"], norm), key=len)
        if len(a) >= 5 and a in b:
            return proj
    return None


def build_activity_feed(
    projects: list[dict[str, Any]],
    claude_web: dict[str, Any],
    github_repos: list[dict[str, Any]],
    code_days: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    """Merge recent events, sort newest-first, cap at 50."""
    feed: list[dict[str, Any]] = []

    for convo in claude_web.get("conversations", []):
        updated = convo.get("updated_at", "")
        name = convo.get("name", "Untitled conversation")
        msg_count = len(convo.get("chat_messages", []))
        if msg_count < 2:
            continue

        summary = convo.get("summary", "")
        if not summary and convo.get("chat_messages"):
            for msg in convo["chat_messages"]:
                if msg.get("sender") == "human" and msg.get("text"):
                    summary = msg["text"][:200]
                    break
        if summary:
            summary = re.sub(r'\*?\*?Conversation [Oo]verview\*?\*?\s*', '', summary)
            summary = re.sub(r'\*\*([^*]+)\*\*', r'\1', summary)
            summary = clean_text(summary)

        matched = _feed_project(normalize_name(name.split(" - ")[0].split(":")[0]), projects)
        feed.append({
            "type": "claude-web",
            "title": clean_text(name)[:100],
            "description": summary[:250] if summary else f"Conversation with {msg_count} messages",
            "projectSlug": matched["slug"] if matched else None,
            "category": matched["category"] if matched else None,
            "date": updated,
            "metadata": {"messages": msg_count},
        })

    by_slug = {p["slug"]: p for p in projects}
    for repo in github_repos:
        name = repo.get("name", "")
        matched = by_slug.get(normalize_name(name))
        feed.append({
            "type": "github",
            "title": f"Activity on {repo.get('fullName', name)}",
            "description": clean_text(repo.get("description")) or f"Repository {name}",
            "projectSlug": matched["slug"] if matched else None,
            "category": matched["category"] if matched else None,
            "date": repo.get("pushedAt", "") or "",
            "metadata": {"repo": repo.get("fullName", "")},
        })

    for day in code_days:
        if day["records"] <= 0:
            continue
        feed.append({
            "type": "claude-code",
            "title": f"Claude Code: {day['records']:,} transcript records",
            "description": f"{day['sessions']} sessions active, {day['toolCalls']:,} tool calls",
            "projectSlug": None,
            "category": None,
            "date": day["stamp"],
            "metadata": {"messages": day["records"], "sessions": day["sessions"]},
        })

    feed.sort(key=lambda x: x.get("date", ""), reverse=True)
    return feed[:50]


# --- Stage 5: Output -------------------------------------------------------------

def build_stats(
    projects: list[dict[str, Any]],
    agg: dict | None,
    previous: dict | None,
) -> dict[str, Any] | None:
    """The stats block, from the durable record. None when there is neither a
    readable record nor a previous file to keep: the caller then writes nothing."""
    project_def = (
        "Entries in this file's project list: the Claude Web projects of the "
        "February 2026 export, the featured GitHub repos and the "
        f"{CODE_PROJECT_LIMIT} most active Claude Code working directories, merged by name."
    )
    if agg is not None:
        cov = agg["coverage"]
        since, through = cov["first_day"], cov["last_day"]
        return {
            "totalProjects": len(projects),
            "totalSessions": agg["totals"]["sessions"],
            "totalMessages": agg["totals"]["turns"],
            "activeDays": agg["active_days"],
            "streak": agg["streaks"]["current"],
            "coverage": {
                "since": since,
                "through": through,
                "source": agg["source"],
                "recordingBegan": cov["recording_began"],
                "dayTimezone": agg["day_tz"],
                "stale": False,
                "note": (
                    f"Sessions, records, active days and the streak are read from the durable "
                    f"activity database and cover {since} through {through} ({agg['day_tz']} days). "
                    f"The database started recording on {cov['recording_began']}. From before that "
                    f"date it holds only the sessions whose logs were still on disk that day, so "
                    f"the earlier months are incomplete and nothing before {since} is included."
                ),
                "definitions": {
                    "totalSessions": "Claude Code session logs in the record. Subagent logs are not counted.",
                    "totalMessages": (
                        "Transcript records in those sessions: a prompt, a tool result, or one "
                        "content block of a model reply. Not a count of messages somebody typed."
                    ),
                    "activeDays": "Days with at least one transcript record.",
                    "streak": (
                        "Consecutive active days ending today or yesterday, as of "
                        f"{agg['streaks']['as_of']}. 0 when the last active day is older."
                    ),
                    "totalProjects": project_def,
                },
            },
        }

    prev_stats = (previous or {}).get("stats")
    needed = ("totalSessions", "totalMessages", "activeDays", "streak")
    if not isinstance(prev_stats, dict) or not all(isinstance(prev_stats.get(k), int) for k in needed):
        return None
    coverage = dict(prev_stats.get("coverage") or {
        "since": None, "through": None, "source": "previous site-data.json",
        "note": "Kept from a file written before coverage was recorded. The period these numbers cover is not known.",
        "definitions": {"totalProjects": project_def},
    })
    coverage["stale"] = True
    coverage["staleReason"] = (
        "The durable activity database could not be read on this run, so sessions, records, "
        f"active days and the streak are the ones published on {str(previous.get('generated', ''))[:10] or 'an earlier run'}."
    )
    return {
        "totalProjects": len(projects),
        **{k: prev_stats[k] for k in needed},
        "coverage": coverage,
    }


def build_category_summaries(projects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    cat_counts = Counter(p["category"] for p in projects)
    CATEGORY_META = {
        "hardware": {"label": "Hardware & Edge", "color": "var(--brand-primary)", "icon": "Cpu"},
        "ai-ml": {"label": "AI & Language", "color": "var(--brand-secondary)", "icon": "Brain"},
        "data": {"label": "Data Engineering", "color": "var(--brand-info)", "icon": "Database"},
        "systems": {"label": "Systems & Infra", "color": "var(--brand-steel)", "icon": "Server"},
        "creative": {"label": "Creative & Research", "color": "var(--brand-warning)", "icon": "Lightbulb"},
    }
    return [
        {"id": cat_id, **meta, "count": cat_counts.get(cat_id, 0)}
        for cat_id, meta in CATEGORY_META.items()
    ]


def build_about(ai_pilot: dict[str, Any] | None) -> dict[str, Any]:
    """Build about section (mostly static)."""
    skills = []
    if ai_pilot:
        skills = [s["name"] for s in ai_pilot.get("skillsCloud", [])[:30] if s.get("name")]

    if not skills:
        skills = [
            "Python", "Bash", "C#/.NET", "Rust", "C/C++", "SQL",
            "Claude API", "OpenAI GPT-4", "RAG Pipelines", "Pinecone",
            "LangChain", "Agentic Frameworks", "Prompt Engineering",
            "FastAPI", "AWS", "Docker", "Snowflake", "PostgreSQL",
            "DynamoDB", "Redis", "Elasticsearch", "Apache Solr",
            "ESP32", "LoRa", "Distributed Systems",
        ]

    return {
        "bio": (
            "AI-focused Software Architect with 15+ years designing secure, large-scale data systems "
            "for government and enterprise clients. Extensive hands-on experience with frontier AI models, "
            "agentic programming frameworks, and AI-augmented development workflows. Proven track record "
            "leading technical teams on classified projects and building high-availability infrastructure "
            "processing billions of records. Expert in AI/ML pipelines, distributed systems, cloud "
            "infrastructure, and secure data management. Active builder of open-source AI tools and "
            "agentic systems."
        ),
        "skills": skills,
        "timeline": [
            {"year": "2024-present", "title": "Founder & AI Systems Architect: SysForge.ai",
             "description": "AI consulting and development firm delivering frontier AI solutions. Architecting AI-powered systems integrating frontier language models into enterprise workflows. Building custom agentic AI pipelines and AI-augmented development toolchains."},
            {"year": "2022-present", "title": "Architect & Developer: Enterprise Messaging Platform",
             "description": "Enterprise-grade, high-volume messaging platform. Architected high-availability system handling millions of messages with 99.9% uptime. Built RESTful API layer with FastAPI integrating multiple carriers with automated failover."},
            {"year": "2018-2022", "title": "Architect & Developer: Enterprise Data Platform",
             "description": "Large-scale ESP data management processing billions of messages and 100M+ contact records. Integrated 4.9 billion data points for ML model training and relationship discovery across 10,000+ data sources."},
            {"year": "2014-2018", "title": "Senior Architect: Fortune 500 Financial Services",
             "description": "Investigative intelligence platform serving law enforcement and government agencies. Lead developer on classified project with the United States Government. Built ML models for entity resolution and relationship mapping."},
        ],
    }


# --- Stage 6: MCP catalog ----------------------------------------------------------

def run_mcp_catalog(out_dir: Path | None) -> str:
    """Run generate-mcp-catalog.py and say plainly how it went. Returns
    "ok", "failed", "timeout" or "missing". Never raises, and never changes
    this script's exit code: the site data is already written."""
    mcp_script = SCRIPT_DIR / "generate-mcp-catalog.py"
    if not mcp_script.exists():
        warn(f"MCP catalog NOT refreshed: {mcp_script} does not exist")
        return "missing"
    args = [sys.executable, "-B", str(mcp_script)]
    if VERBOSE:
        args.append("--verbose")
    if out_dir is not None:
        args += ["--out", str(out_dir / "mcp-catalog.json")]
    sys.stdout.flush()
    started = time.monotonic()
    try:
        result = subprocess.run(args, timeout=MCP_TIMEOUT_S)
    except subprocess.TimeoutExpired:
        warn(f"MCP catalog NOT refreshed: generate-mcp-catalog.py was still running after "
             f"{MCP_TIMEOUT_S} s and was killed; the catalog on disk is the earlier one")
        return "timeout"
    except OSError as e:
        warn(f"MCP catalog NOT refreshed: could not start generate-mcp-catalog.py: {e}")
        return "failed"
    took = time.monotonic() - started
    if result.returncode != 0:
        warn(f"MCP catalog NOT refreshed: generate-mcp-catalog.py exited {result.returncode} "
             f"after {took:.0f} s (its own message is above); the catalog on disk is the earlier one")
        return "failed"
    print(f"  MCP catalog refreshed in {took:.0f} s")
    return "ok"


# --- Main ------------------------------------------------------------------------

def parse_args(argv: list[str]) -> argparse.Namespace:
    ap = argparse.ArgumentParser(
        description="Write site-data.json for bradley.io (runs every 4 hours from scripts/refresh-4h.sh)")
    ap.add_argument("--out", metavar="PATH", help="write site-data.json here instead of public/data")
    ap.add_argument("--cache", metavar="PATH", help="tagline cache file")
    ap.add_argument("--limit-ai", type=int, default=None, metavar="N", help="at most N model calls")
    ap.add_argument("--ai-budget-min", type=float,
                    default=float(os.environ.get("AI_BUDGET_MIN", "15")), metavar="M",
                    help="stop asking the model after M minutes (0 = no limit)")
    ap.add_argument("--refresh-ai", action="store_true", help="ask again for every model tagline")
    ap.add_argument("--skip-ai", action="store_true", help="no model calls")
    ap.add_argument("--skip-github", action="store_true", help="no gh calls; carry GitHub facts over")
    ap.add_argument("--skip-mcp", action="store_true", help="do not run generate-mcp-catalog.py")
    ap.add_argument("--db", metavar="PATH", default=str(activity_db.DEFAULT_DB),
                    help="DuckDB file to read (opened read-only)")
    ap.add_argument("--accept-shrink", action="store_true",
                    help="write even if the project list lost more than half its entries")
    ap.add_argument("--list-notes", action="store_true",
                    help="print the Claude Web project notes and their publication state, write nothing")
    ap.add_argument("--verbose", "-v", action="store_true")
    opt = ap.parse_args(argv)
    if opt.limit_ai is not None and opt.limit_ai < 0:
        ap.error("--limit-ai must be 0 or more")
    return opt


def main(argv: list[str] | None = None) -> int:
    global VERBOSE, _WRITTEN
    opt = parse_args(sys.argv[1:] if argv is None else argv)
    VERBOSE = opt.verbose

    out_path = Path(opt.out).resolve() if opt.out else DEFAULT_OUTPUT
    is_real_run = out_path == DEFAULT_OUTPUT.resolve()
    cache_path = Path(opt.cache).resolve() if opt.cache else (
        DEFAULT_CACHE if is_real_run else out_path.parent / DEFAULT_CACHE.name)

    if opt.list_notes:
        prev = read_json(out_path)
        if not isinstance(prev, dict):
            prev = read_json(DEFAULT_OUTPUT)
        prev_by_slug = {
            p["slug"]: p for p in (prev if isinstance(prev, dict) else {}).get("projects", [])
            if isinstance(p, dict) and p.get("slug")
        }
        print_notes_report(collect_claude_web(), prev_by_slug)
        return 0

    if opt.skip_ai:
        ai_mode = "off (--skip-ai)"
    else:
        limit = "no call limit" if opt.limit_ai is None else f"at most {opt.limit_ai} calls"
        budget = "no time limit" if opt.ai_budget_min <= 0 else f"{opt.ai_budget_min:g} min budget"
        ai_mode = f"taglines only, through ai_client ({', '.join(ai_client.AI_BACKENDS)}), {limit}, {budget}"

    print("=" * 72)
    print("  bradley.io site-data pipeline (scripts/nightly-pipeline.py)")
    print("  Runs every 4 hours from scripts/refresh-4h.sh. Not nightly, despite the name.")
    print(f"  started {datetime.now(timezone.utc).isoformat(timespec='seconds')}")
    print(f"  output  {out_path}" + ("" if is_real_run else "   (test run: public/data is not written)"))
    print(f"  cache   {cache_path}")
    print(f"  AI      {ai_mode}")
    print("=" * 72)

    # The file this run replaces, or the live one on a test run into an empty
    # directory. Read only; it is what "keep the earlier value" refers to.
    previous = read_json(out_path)
    previous_from = out_path
    if not isinstance(previous, dict) and not is_real_run:
        previous = read_json(DEFAULT_OUTPUT)
        previous_from = DEFAULT_OUTPUT
    if not isinstance(previous, dict):
        previous = None
        warn("no previous site-data.json to fall back on; a failed source has nothing earlier to keep")
    prev_projects = [p for p in (previous or {}).get("projects", []) if isinstance(p, dict) and p.get("slug")]
    previous_by_slug = {p["slug"]: p for p in prev_projects}
    previous_by_repo = {
        p["sources"]["github"]["repo"]: p for p in prev_projects
        if isinstance(p.get("sources"), dict) and isinstance(p["sources"].get("github"), dict)
        and p["sources"]["github"].get("repo")
    }
    if previous:
        print(f"  previous file: {previous_from} ({len(prev_projects)} projects, generated {previous.get('generated')})")

    # Stage 1: Collect
    print("\n[Stage 1] Collecting data sources...")
    agg = activity_db.load(opt.db)
    if agg is None:
        warn("DURABLE RECORD UNAVAILABLE (reason above). Stats are kept from the previous file "
             "and marked stale; Claude Code projects fall back to ai-pilot-data.json.")
    claude_web = collect_claude_web()
    github_repos = collect_github(previous_by_repo, opt.skip_github)
    ai_pilot = collect_ai_pilot()
    timeline = load_timeline_repos()
    if agg is not None:
        code_projects = code_projects_from_record(agg)
        code_days = code_days_from_record(agg)
    else:
        code_projects = code_projects_from_ai_pilot(ai_pilot)
        code_days = code_days_from_ai_pilot(ai_pilot)
    print(f"  Claude Web projects {len(claude_web['projects'])}, GitHub repos {len(github_repos)}, "
          f"Claude Code projects {len(code_projects)}, timeline repo descriptions {len(timeline)}")

    # Stage 2: Merge & deduplicate
    print("\n[Stage 2] Merging & deduplicating projects...")
    projects, withheld = merge_projects(claude_web, github_repos, code_projects)
    print(f"  {len(projects)} unique projects")

    # Stage 3: Text and taglines
    print("\n[Stage 3] Descriptions from sources, taglines (model only where needed)...")
    cache = load_cache(cache_path)
    counts = fill_text(projects, timeline, previous_by_slug, cache, opt, withheld)
    if counts.pop("cacheDirty"):
        try:
            write_json_atomic(cache_path, cache)
        except OSError as e:
            warn(f"could not write the tagline cache {cache_path}: {e} (the taglines are still published)")

    # Categories are decided after the text is final. They used to be decided
    # before, so a description found later never reached the classifier.
    for p in projects:
        p["category"], p["categoryBasis"] = classify_category(
            p["name"], p["description"], p.get("technologies", []))

    projects.sort(key=lambda p: p.get("lastActivity", ""), reverse=True)

    # Stage 4: Activity feed
    print("\n[Stage 4] Building activity feed...")
    activity_feed = build_activity_feed(projects, claude_web, github_repos, code_days)
    print(f"  {len(activity_feed)} items")

    # Stage 5: Output
    print("\n[Stage 5] Writing output...")
    stats = build_stats(projects, agg, previous)
    if stats is None:
        warn("NOTHING WRITTEN: the durable record is unavailable and there is no previous "
             "site-data.json with usable stats. Zeros are not published.")
        return 1
    if not projects:
        warn("NOTHING WRITTEN: no projects from any source.")
        return 1
    if len(prev_projects) >= 10 and len(projects) * 2 < len(prev_projects) and not opt.accept_shrink:
        warn(f"NOTHING WRITTEN: {len(projects)} projects now against {len(prev_projects)} in the previous "
             f"file. A source is probably missing (see above). Pass --accept-shrink if this is real.")
        return 1

    s = ai_client.stats()
    site_data = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "stats": stats,
        "activityFeed": activity_feed,
        "projects": projects,
        "categories": build_category_summaries(projects),
        "about": build_about(ai_pilot),
        "labProjects": [p for p in projects if p.get("isResearch")],
        "aiSummary": {
            **{k: counts[k] for k in (
                "succeeded", "failed", "reused", "keptPrevious", "notAttempted",
                "skippedByLimit", "skippedByBudget", "skippedBackendsDown", "noEvidence")},
            "limit": opt.limit_ai,
            "budgetMin": opt.ai_budget_min,
            "skipped": bool(opt.skip_ai),
            "calls": s["calls"],
            "answeredByGateway": s["cbai_ok"],
            "answeredByOllama": s["ollama_ok"],
            "fallbackModel": ai_client.AI_FALLBACK_MODEL,
            "scope": "Taglines only. Descriptions are never written by the model.",
        },
    }

    try:
        write_json_atomic(out_path, site_data)
    except OSError as e:
        warn(f"NOTHING WRITTEN: could not write {out_path}: {e}")
        return 1
    _WRITTEN = True

    # Said once, on the run that replaces a file from before stats.coverage:
    # the same field names now carry numbers for a much longer period.
    prev_stats = (previous or {}).get("stats") or {}
    if agg is not None and prev_stats and not prev_stats.get("coverage"):
        warn(
            "STATS BASIS CHANGED on this run. Before: "
            f"{prev_stats.get('totalSessions')} sessions, {prev_stats.get('totalMessages')} messages, "
            f"{prev_stats.get('activeDays')} active days (rolling window of raw logs, period not stated). "
            f"Now: {stats['totalSessions']} sessions, {stats['totalMessages']} transcript records, "
            f"{stats['activeDays']} active days, {stats['coverage']['since']} through "
            f"{stats['coverage']['through']}. app/page.tsx and app/about/page.tsx read this file at "
            "render time (revalidate 3600), so the new numbers are live within the hour WITHOUT a "
            "deploy. Those pages must print stats.coverage and must not call totalMessages "
            "'Messages exchanged'; deploy that change before, or together with, this file."
            + ("" if is_real_run else " (Test run: public/data was not written.)")
        )

    empty_taglines = sum(1 for p in projects if not p["tagline"])
    empty_descriptions = sum(1 for p in projects if not p["description"])
    by_basis = Counter(p["categoryBasis"] for p in projects)
    cov = stats["coverage"]
    print(f"\n  Wrote {out_path}")
    print(f"  {len(projects)} projects, {len(activity_feed)} activity items")
    print(f"  Stats: {json.dumps({k: v for k, v in stats.items() if k != 'coverage'})}")
    print(f"  Coverage: {cov.get('since')} through {cov.get('through')} from {cov.get('source')}"
          + (" (STALE: kept from the previous file)" if cov.get("stale") else ""))
    print(f"  Empty taglines: {empty_taglines} of {len(projects)}; "
          f"empty descriptions: {empty_descriptions} of {len(projects)}")
    print(f"  Categories: {dict(Counter(p['category'] for p in projects))}; "
          f"{by_basis.get('default', 0)} are 'systems' only because no keyword matched")
    print(f"  {notes_summary_line(counts)}")
    print(f"  {ai_summary_line(counts, opt)}")
    if s["calls"]:
        print(f"  {ai_client.summary_line()}")

    # Stage 6: MCP catalog (its own script; a failure here is logged, not fatal)
    if opt.skip_mcp:
        print("\n[Stage 6] MCP catalog skipped (--skip-mcp)")
    else:
        print("\n[Stage 6] Refreshing MCP catalog (scripts/generate-mcp-catalog.py)...")
        run_mcp_catalog(None if is_real_run else out_path.parent)

    print(f"\n{'=' * 72}")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except Exception as e:  # noqa: BLE001 - say what happened, then fail honestly
        import traceback
        traceback.print_exc()
        if _WRITTEN:
            # The site data is on disk and good; only a later step died.
            warn(f"site-data.json WAS written; a later step failed: {type(e).__name__}: {e}")
            sys.exit(0)
        warn(f"NOTHING WRITTEN: {type(e).__name__}: {e}")
        sys.exit(1)
