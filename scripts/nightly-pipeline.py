#!/usr/bin/env python3
"""
Nightly data pipeline for new.bradley.io
Generates public/data/site-data.json from multiple sources:
  - Claude Web export (conversations.json, projects.json, memories.json)
  - GitHub repos (gh CLI)
  - Existing ai-pilot-data.json (Claude Code stats)
  - CBAI for AI enrichment

Usage:
  python3 scripts/nightly-pipeline.py [--verbose] [--skip-ai] [--skip-github]
"""

import json
import os
import sys
import time
import hashlib
import subprocess
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

# ─── Configuration ────────────────────────────────────────────────────────

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_FILE = PROJECT_ROOT / "public" / "data" / "site-data.json"
AI_PILOT_FILE = PROJECT_ROOT / "public" / "data" / "ai-pilot-data.json"
CACHE_FILE = PROJECT_ROOT / ".summary-cache.json"

# Load .env if exists
ENV_FILE = PROJECT_ROOT / ".env"
if ENV_FILE.exists():
    for line in ENV_FILE.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, val = line.split("=", 1)
            os.environ.setdefault(key.strip(), val.strip())

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

CBAI_URL = os.environ.get("CBAI_URL", "https://ai.nominate.ai")
CBAI_PROVIDER = os.environ.get("CBAI_PROVIDER", "ollama")

VERBOSE = "--verbose" in sys.argv or "-v" in sys.argv
SKIP_AI = "--skip-ai" in sys.argv
SKIP_GITHUB = "--skip-github" in sys.argv

# ─── Category Classification ─────────────────────────────────────────────

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


def classify_category(name: str, description: str, technologies: list[str]) -> str:
    """Classify a project into a category based on keyword matching."""
    text = f"{name} {description} {' '.join(technologies)}".lower()
    scores: dict[str, int] = {}
    for cat_id, keywords in CATEGORY_KEYWORDS.items():
        scores[cat_id] = sum(1 for kw in keywords if kw in text)
    best = max(scores, key=lambda k: scores[k])
    if scores[best] == 0:
        return "systems"  # default
    return best


def normalize_name(name: str) -> str:
    """Normalize a project name for fuzzy matching."""
    name = name.lower().strip()
    # Apply aliases
    for alias, canonical in PROJECT_ALIASES.items():
        if name == alias:
            return canonical
    # Remove common prefixes/suffixes
    name = re.sub(r"^(tinymachines|sysforge-ai)/", "", name)
    name = re.sub(r"\.(py|ts|js|rs)$", "", name)
    name = re.sub(r"[^a-z0-9]", "-", name)
    name = re.sub(r"-+", "-", name).strip("-")
    return name


def log(msg: str):
    if VERBOSE:
        print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}")


# ─── Stage 1: Collect ────────────────────────────────────────────────────

def collect_claude_web() -> dict[str, Any]:
    """Read Claude Web export data."""
    result: dict[str, Any] = {"projects": [], "conversations": [], "memories": []}

    projects_file = CLAUDE_WEB_DATA_DIR / "projects.json"
    conversations_file = CLAUDE_WEB_DATA_DIR / "conversations.json"
    memories_file = CLAUDE_WEB_DATA_DIR / "memories.json"

    if projects_file.exists():
        data = json.loads(projects_file.read_text())
        result["projects"] = data if isinstance(data, list) else []
        log(f"Claude Web: {len(result['projects'])} projects")

    if conversations_file.exists():
        data = json.loads(conversations_file.read_text())
        result["conversations"] = data if isinstance(data, list) else []
        log(f"Claude Web: {len(result['conversations'])} conversations")

    if memories_file.exists():
        data = json.loads(memories_file.read_text())
        result["memories"] = data if isinstance(data, list) else []
        log(f"Claude Web: {len(result['memories'])} memories")

    return result


def collect_github() -> list[dict[str, Any]]:
    """Fetch GitHub repo data using gh CLI."""
    if SKIP_GITHUB:
        log("Skipping GitHub collection (--skip-github)")
        return []

    repos = []
    for repo_spec in FEATURED_REPOS:
        repo_spec = repo_spec.strip()
        if not repo_spec:
            continue
        try:
            result = subprocess.run(
                ["gh", "repo", "view", repo_spec, "--json",
                 "name,description,url,pushedAt,stargazerCount,primaryLanguage,isPrivate"],
                capture_output=True, text=True, timeout=15,
            )
            if result.returncode == 0:
                data = json.loads(result.stdout)
                data["fullName"] = repo_spec
                repos.append(data)
                log(f"GitHub: fetched {repo_spec}")
            else:
                log(f"GitHub: failed {repo_spec}: {result.stderr.strip()}")
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            log(f"GitHub: error {repo_spec}: {e}")

    return repos


def collect_ai_pilot() -> dict[str, Any] | None:
    """Read existing ai-pilot-data.json."""
    if AI_PILOT_FILE.exists():
        data = json.loads(AI_PILOT_FILE.read_text())
        log(f"AI Pilot: loaded ({len(data.get('missionLog', []))} missions)")
        return data
    log("AI Pilot: file not found")
    return None


# ─── Stage 2: Merge & Deduplicate ────────────────────────────────────────

def merge_projects(
    claude_web: dict[str, Any],
    github_repos: list[dict[str, Any]],
    ai_pilot: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    """Build unified project records with linked sources."""
    projects: dict[str, dict[str, Any]] = {}  # keyed by normalized name

    # Group conversations by name similarity to projects
    convo_name_index: dict[str, list[dict]] = {}
    for convo in claude_web.get("conversations", []):
        name = convo.get("name", "")
        if name:
            key = normalize_name(name.split(" - ")[0].split(":")[0])
            if key not in convo_name_index:
                convo_name_index[key] = []
            convo_name_index[key].append(convo)

    # Claude Web projects
    for proj in claude_web.get("projects", []):
        name = proj.get("name", "Untitled")
        norm = normalize_name(name)
        if norm not in projects:
            projects[norm] = {
                "slug": norm,
                "name": name,
                "tagline": "",
                "description": proj.get("description", ""),
                "category": "systems",
                "isResearch": norm in RESEARCH_PROJECTS,
                "isFeatured": False,
                "status": "active",
                "technologies": [],
                "lastActivity": proj.get("updated_at", ""),
                "totalMessages": 0,
                "sources": {},
            }

        # Count messages from conversations matching this project
        matched_convos = convo_name_index.get(norm, [])
        total_msgs = sum(
            len(c.get("chat_messages", []))
            for c in matched_convos
        )
        last_convo = max(
            (c.get("updated_at", "") for c in matched_convos),
            default=""
        )

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
            projects[norm] = {
                "slug": norm,
                "name": name,
                "tagline": repo.get("description", "") or "",
                "description": repo.get("description", "") or "",
                "category": "systems",
                "isResearch": norm in RESEARCH_PROJECTS,
                "isFeatured": True,
                "status": "active",
                "technologies": [],
                "lastActivity": repo.get("pushedAt", ""),
                "totalMessages": 0,
                "sources": {},
            }

        lang = repo.get("primaryLanguage", {})
        projects[norm]["sources"]["github"] = {
            "repo": repo.get("fullName", ""),
            "stars": repo.get("stargazerCount", 0),
            "language": lang.get("name", "") if lang else "",
            "lastPush": (repo.get("pushedAt", "") or "")[:10],
        }
        projects[norm]["isFeatured"] = True

        # Update lastActivity
        pushed = repo.get("pushedAt", "")
        if pushed > projects[norm].get("lastActivity", ""):
            projects[norm]["lastActivity"] = pushed

    # AI Pilot missions → Claude Code stats
    if ai_pilot:
        for mission in ai_pilot.get("missionLog", []):
            name = mission.get("name", "")
            norm = normalize_name(name)
            if norm not in projects:
                projects[norm] = {
                    "slug": norm,
                    "name": name,
                    "tagline": "",
                    "description": "",
                    "category": "systems",
                    "isResearch": norm in RESEARCH_PROJECTS,
                    "isFeatured": False,
                    "status": mission.get("status", "active"),
                    "technologies": mission.get("technologies", []),
                    "lastActivity": mission.get("lastActive", ""),
                    "totalMessages": 0,
                    "sources": {},
                }

            projects[norm]["sources"]["claudeCode"] = {
                "totalSessions": mission.get("sessions", 0),
                "totalMessages": mission.get("messages", 0),
                "lastSession": mission.get("lastActive", "")[:10] if mission.get("lastActive") else "",
            }
            projects[norm]["totalMessages"] += mission.get("messages", 0)

            # Merge technologies
            existing_techs = set(projects[norm].get("technologies", []))
            existing_techs.update(mission.get("technologies", []))
            projects[norm]["technologies"] = sorted(existing_techs)

            # Update status
            if mission.get("status") == "active":
                projects[norm]["status"] = "active"

    # Classify categories
    for norm, proj in projects.items():
        proj["category"] = classify_category(
            proj["name"],
            proj["description"],
            proj.get("technologies", []),
        )

    return list(projects.values())


# ─── Stage 3: AI Enrichment ──────────────────────────────────────────────

def load_cache() -> dict[str, Any]:
    if CACHE_FILE.exists():
        return json.loads(CACHE_FILE.read_text())
    return {}


def save_cache(cache: dict[str, Any]):
    CACHE_FILE.write_text(json.dumps(cache, indent=2))


def project_hash(proj: dict) -> str:
    """Hash key fields to detect changes."""
    key = f"{proj['name']}|{proj['description']}|{proj.get('totalMessages', 0)}"
    return hashlib.md5(key.encode()).hexdigest()[:12]


def enrich_with_ai(projects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Use CBAI to generate taglines and descriptions for projects missing them."""
    if SKIP_AI:
        log("Skipping AI enrichment (--skip-ai)")
        return projects

    cache = load_cache()
    updated = False

    for proj in projects:
        phash = project_hash(proj)
        cache_key = f"{proj['slug']}_{phash}"

        # Check cache
        if cache_key in cache:
            cached = cache[cache_key]
            if not proj.get("tagline"):
                proj["tagline"] = cached.get("tagline", "")
            if not proj.get("description") or len(proj["description"]) < 50:
                proj["description"] = cached.get("description", proj["description"])
            continue

        # Only call AI if we need tagline or description
        if proj.get("tagline") and len(proj.get("description", "")) > 50:
            continue

        log(f"AI enrichment: {proj['name']}")
        try:
            import urllib.request
            prompt = (
                f"Generate a short tagline (under 80 chars) and a 2-3 sentence description "
                f"for a technical project called '{proj['name']}'. "
                f"Category: {proj['category']}. "
                f"Technologies: {', '.join(proj.get('technologies', [])[:5])}. "
                f"Existing description: {proj.get('description', 'none')[:200]}. "
                f"Return JSON: {{\"tagline\": \"...\", \"description\": \"...\"}}"
            )
            payload = json.dumps({
                "messages": [{"role": "user", "content": prompt}],
                "provider": CBAI_PROVIDER,
                "max_tokens": 300,
            }).encode()
            req = urllib.request.Request(
                f"{CBAI_URL}/api/v1/chat",
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read())
                content = result.get("content", "")
                # Try to parse JSON from response
                match = re.search(r'\{[^}]+\}', content)
                if match:
                    enriched = json.loads(match.group())
                    if not proj.get("tagline"):
                        proj["tagline"] = enriched.get("tagline", "")
                    if not proj.get("description") or len(proj["description"]) < 50:
                        proj["description"] = enriched.get("description", proj["description"])
                    cache[cache_key] = enriched
                    updated = True

            time.sleep(2)  # Rate limit
        except Exception as e:
            log(f"AI enrichment failed for {proj['name']}: {e}")

    if updated:
        save_cache(cache)

    return projects


def generate_claude_corner(
    projects: list[dict[str, Any]],
    stats: dict[str, Any],
) -> dict[str, Any] | None:
    """Generate a witty AI commentary for Claude's Corner."""
    if SKIP_AI:
        log("Skipping Claude Corner (--skip-ai)")
        return None

    import urllib.request

    active = [p for p in projects if p.get("status") == "active"]
    top_projects = ", ".join(p["name"] for p in active[:5])
    moods = ["excited", "reflective", "impressed", "curious", "amused"]

    prompt = (
        f"You are Claude, an AI co-developer. Write a witty 2-3 sentence commentary about Brad's recent work. "
        f"Stats: {stats.get('totalProjects', 0)} projects, {stats.get('totalMessages', 0):,} messages, "
        f"{stats.get('streak', 0)}-day streak. Top active projects: {top_projects}. "
        f"Pick a mood from: {', '.join(moods)}. "
        f'Return JSON: {{"quote": "...", "context": "...", "mood": "..."}}'
    )

    try:
        payload = json.dumps({
            "messages": [{"role": "user", "content": prompt}],
            "provider": CBAI_PROVIDER,
            "max_tokens": 400,
        }).encode()
        req = urllib.request.Request(
            f"{CBAI_URL}/api/v1/chat",
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            result = json.loads(resp.read())
            content = result.get("content", "")
            match = re.search(r'\{[^}]+\}', content)
            if match:
                parsed = json.loads(match.group())
                if parsed.get("mood") not in moods:
                    parsed["mood"] = "impressed"
                parsed["generatedAt"] = datetime.now(timezone.utc).isoformat()
                log(f"Claude Corner generated: mood={parsed['mood']}")
                return parsed
    except Exception as e:
        log(f"Claude Corner generation failed: {e}")

    return None


def generate_claude_recommendations(projects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Generate AI co-developer involvement text for featured/active projects."""
    if SKIP_AI:
        log("Skipping Claude recommendations (--skip-ai)")
        return projects

    import urllib.request

    featured = [p for p in projects if p.get("isFeatured") and p.get("status") == "active"]

    for proj in featured:
        if proj.get("claudeInvolvement"):
            continue

        log(f"Generating Claude involvement for: {proj['name']}")
        prompt = (
            f"You are Claude, an AI co-developer. In 2-3 sentences, describe your involvement "
            f"in the project '{proj['name']}'. Category: {proj['category']}. "
            f"Technologies: {', '.join(proj.get('technologies', [])[:5])}. "
            f"Description: {proj.get('description', 'none')[:200]}. "
            f"Messages: {proj.get('totalMessages', 0)}. "
            f"Write in first person. Be specific about what you helped with. "
            f"Return only the text, no JSON."
        )

        try:
            payload = json.dumps({
                "messages": [{"role": "user", "content": prompt}],
                "provider": CBAI_PROVIDER,
                "max_tokens": 200,
            }).encode()
            req = urllib.request.Request(
                f"{CBAI_URL}/api/v1/chat",
                data=payload,
                headers={"Content-Type": "application/json"},
            )
            with urllib.request.urlopen(req, timeout=30) as resp:
                result = json.loads(resp.read())
                content = result.get("content", "").strip()
                if content and len(content) > 20:
                    proj["claudeInvolvement"] = content
                    log(f"  Generated {len(content)} chars")

            time.sleep(2)  # Rate limit
        except Exception as e:
            log(f"  Failed: {e}")

    return projects


# ─── Stage 4: Build Activity Feed ────────────────────────────────────────

def build_activity_feed(
    projects: list[dict[str, Any]],
    claude_web: dict[str, Any],
    github_repos: list[dict[str, Any]],
    ai_pilot: dict[str, Any] | None,
) -> list[dict[str, Any]]:
    """Merge recent events, sort newest-first, cap at 50."""
    feed: list[dict[str, Any]] = []

    # Claude Web conversations (recent ones)
    for convo in claude_web.get("conversations", []):
        updated = convo.get("updated_at", "")
        name = convo.get("name", "Untitled conversation")
        msg_count = len(convo.get("chat_messages", []))
        if msg_count < 2:
            continue

        summary = convo.get("summary", "")
        if not summary and convo.get("chat_messages"):
            # Use first human message as summary
            for msg in convo["chat_messages"]:
                if msg.get("sender") == "human" and msg.get("text"):
                    summary = msg["text"][:200]
                    break
        # Strip markdown formatting from summaries
        if summary:
            summary = re.sub(r'\*?\*?Conversation [Oo]verview\*?\*?\s*', '', summary)
            summary = re.sub(r'\*\*([^*]+)\*\*', r'\1', summary)
            summary = summary.strip()

        # Try to match to a project
        convo_norm = normalize_name(name.split(" - ")[0].split(":")[0])
        matched_project = None
        matched_category = None
        for proj in projects:
            if proj["slug"] == convo_norm or convo_norm in proj["slug"] or proj["slug"] in convo_norm:
                matched_project = proj["slug"]
                matched_category = proj["category"]
                break

        feed.append({
            "type": "claude-web",
            "title": name[:100],
            "description": summary[:250] if summary else f"Conversation with {msg_count} messages",
            "projectSlug": matched_project,
            "category": matched_category,
            "date": updated,
            "metadata": {"messages": msg_count},
        })

    # GitHub pushes
    for repo in github_repos:
        pushed = repo.get("pushedAt", "")
        name = repo.get("name", "")
        norm = normalize_name(name)
        matched_project = None
        matched_category = None
        for proj in projects:
            if proj["slug"] == norm:
                matched_project = proj["slug"]
                matched_category = proj["category"]
                break

        feed.append({
            "type": "github",
            "title": f"Activity on {repo.get('fullName', name)}",
            "description": repo.get("description", "") or f"Repository {name}",
            "projectSlug": matched_project,
            "category": matched_category,
            "date": pushed,
            "metadata": {"repo": repo.get("fullName", "")},
        })

    # AI Pilot active days (from heatmap)
    if ai_pilot:
        for day in ai_pilot.get("activityHeatmap", []):
            if day.get("count", 0) > 0:
                feed.append({
                    "type": "claude-code",
                    "title": f"Claude Code session ({day['count']} messages)",
                    "description": f"{day.get('sessions', 0)} sessions, {day.get('toolCalls', 0)} tool calls",
                    "projectSlug": None,
                    "category": None,
                    "date": day["date"] + "T23:59:00Z",
                    "metadata": {
                        "messages": day["count"],
                        "sessions": day.get("sessions", 0),
                    },
                })

    # Sort newest-first, cap at 50
    feed.sort(key=lambda x: x.get("date", ""), reverse=True)
    return feed[:50]


# ─── Stage 5: Output ─────────────────────────────────────────────────────

def build_stats(
    projects: list[dict[str, Any]],
    ai_pilot: dict[str, Any] | None,
) -> dict[str, Any]:
    """Compute aggregate stats."""
    total_messages = sum(p.get("totalMessages", 0) for p in projects)
    total_sessions = 0
    if ai_pilot and ai_pilot.get("license"):
        total_sessions = ai_pilot["license"].get("totalSessions", 0)
        total_messages = max(total_messages, ai_pilot["license"].get("totalMessages", 0))

    streak = 0
    active_days = 0
    if ai_pilot and ai_pilot.get("streaks"):
        streak = ai_pilot["streaks"].get("current", 0)
        active_days = ai_pilot["streaks"].get("totalActiveDays", 0)

    return {
        "totalProjects": len(projects),
        "totalSessions": total_sessions,
        "totalMessages": total_messages,
        "activeDays": active_days,
        "streak": streak,
    }


def build_category_summaries(projects: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Build category summary with counts."""
    from collections import Counter
    cat_counts = Counter(p["category"] for p in projects)

    CATEGORY_META = {
        "hardware": {"label": "Hardware & Edge", "color": "var(--brand-primary)", "icon": "Cpu"},
        "ai-ml": {"label": "AI & Language", "color": "var(--brand-secondary)", "icon": "Brain"},
        "data": {"label": "Data Engineering", "color": "var(--brand-info)", "icon": "Database"},
        "systems": {"label": "Systems & Infra", "color": "var(--brand-steel)", "icon": "Server"},
        "creative": {"label": "Creative & Research", "color": "var(--brand-warning)", "icon": "Lightbulb"},
    }

    return [
        {
            "id": cat_id,
            **meta,
            "count": cat_counts.get(cat_id, 0),
        }
        for cat_id, meta in CATEGORY_META.items()
    ]


def build_about(ai_pilot: dict[str, Any] | None) -> dict[str, Any]:
    """Build about section (mostly static)."""
    skills = []
    if ai_pilot:
        skills = [s["name"] for s in ai_pilot.get("skillsCloud", [])[:30]]

    if not skills:
        skills = [
            "Python", "TypeScript", "Rust", "C/C++", "SQL",
            "Snowflake", "DuckDB", "PostgreSQL", "Redis",
            "FastAPI", "Next.js", "Docker",
            "ESP32", "Raspberry Pi", "LoRa", "BLE",
            "Claude API", "LLM Integration",
        ]

    return {
        "bio": (
            "Frontier technologist with 20+ years spanning Fortune 500 data architecture, "
            "edge computing, and AI systems. Building at the intersection of enterprise scale "
            "and maker culture — from Snowflake data warehouses to ESP32 mesh networks, "
            "from political campaign platforms to experimental programming languages. "
            "Currently exploring the boundaries of human-AI collaboration through intensive "
            "Claude usage and open-source hardware projects."
        ),
        "skills": skills,
        "timeline": [
            {"year": "2025-present", "title": "AI Pilot & Independent Consultant",
             "description": "Full-time AI-augmented development. Building Campaign Brain platform, hardware projects, and experimental languages with Claude as co-pilot."},
            {"year": "2020-2025", "title": "Senior Data Architect",
             "description": "Enterprise data warehouse design and implementation. Led migration of legacy systems to modern cloud-native architectures."},
            {"year": "2015-2020", "title": "Data Engineering Lead",
             "description": "Built ETL pipelines processing millions of records daily. Introduced real-time streaming with Kafka and Spark."},
            {"year": "2010-2015", "title": "Software Engineer",
             "description": "Full-stack development with focus on data-intensive applications. First production ML models."},
            {"year": "2005-2010", "title": "Junior Developer & Maker",
             "description": "Started with Arduino and web development. Built first IoT projects connecting hardware to software."},
        ],
    }


def main():
    print("=" * 60)
    print(f"  new.bradley.io nightly pipeline")
    print(f"  {datetime.now(timezone.utc).isoformat()}")
    print("=" * 60)

    # Stage 1: Collect
    print("\n[Stage 1] Collecting data sources...")
    claude_web = collect_claude_web()
    github_repos = collect_github()
    ai_pilot = collect_ai_pilot()

    # Stage 2: Merge & Deduplicate
    print("\n[Stage 2] Merging & deduplicating projects...")
    projects = merge_projects(claude_web, github_repos, ai_pilot)
    log(f"Merged: {len(projects)} unique projects")

    # Stage 3: AI Enrichment
    print("\n[Stage 3] AI enrichment...")
    projects = enrich_with_ai(projects)
    projects = generate_claude_recommendations(projects)

    # Sort projects by lastActivity (newest first)
    projects.sort(key=lambda p: p.get("lastActivity", ""), reverse=True)

    # Stage 4: Build Activity Feed
    print("\n[Stage 4] Building activity feed...")
    activity_feed = build_activity_feed(projects, claude_web, github_repos, ai_pilot)
    log(f"Activity feed: {len(activity_feed)} items")

    # Stage 5: Output
    print("\n[Stage 5] Writing output...")
    stats = build_stats(projects, ai_pilot)
    claude_corner = generate_claude_corner(projects, stats)

    site_data = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "stats": stats,
        "activityFeed": activity_feed,
        "projects": projects,
        "categories": build_category_summaries(projects),
        "about": build_about(ai_pilot),
        "labProjects": [p for p in projects if p.get("isResearch")],
    }
    if claude_corner:
        site_data["claudeCorner"] = claude_corner

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(site_data, indent=2, default=str))
    print(f"\n  Wrote {OUTPUT_FILE}")
    print(f"  {len(projects)} projects, {len(activity_feed)} activity items")
    print(f"  Stats: {json.dumps(stats)}")

    # Refresh MCP catalog
    mcp_script = SCRIPT_DIR / "generate-mcp-catalog.py"
    if mcp_script.exists():
        print("\n[Stage 6] Refreshing MCP catalog...")
        try:
            args = [sys.executable, str(mcp_script)]
            if VERBOSE:
                args.append("--verbose")
            subprocess.run(args, timeout=60)
        except Exception as e:
            log(f"MCP catalog refresh failed: {e}")

    print(f"\n{'=' * 60}")


if __name__ == "__main__":
    main()
