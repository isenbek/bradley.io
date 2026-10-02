#!/usr/bin/env python3
"""
AI Pilot License Data Pipeline
Generates public/data/ai-pilot-data.json for /ai-pilot, /pilot-analytics and
/the-shift (and, downstream, nightly-pipeline.py and cost-model-pipeline.py).

WHERE EACH SECTION COMES FROM

  The durable record, data/claude-activity.duckdb, through scripts/activity_db.py
  (covers 2026-03-08 onward and does not shrink):
    license, typeRatings, activityHeatmap, hourlyDistribution, missionLog,
    tokenEconomy, streaks, coverage, and the tool counts behind
    competencyRadar and pilotingStyle.

  The raw session logs under ~/.claude and ~/.claude-dc1, which are a rolling
  window of about 30 days. Kept only for what the database cannot supply,
  because it stores no message text:
    skillsCloud and instrumentRatings (technology and keyword mentions in a
    sample of transcripts).

  Other local files, none of them session logs:
    ~/projects/*/CLAUDE.md   domain and technologies per mission, ratings
    ~/.claude*/plans/*.md    the Planning axis and the plan-first score
    ~/.claude*/history.jsonl project switches for the Multi-Project axis

  ~/.claude/stats-cache.json is no longer read. It was the old source of every
  "lifetime" number and it is rebuilt from the same rolling window.

IF THE DURABLE RECORD CANNOT BE READ
  (file missing, /mnt/ursa unmounted, locked, duckdb absent from the
  interpreter) this script writes nothing and exits 0, so the previous output
  stays in place and the rest of the cron chain still runs. It also refuses to
  write if the durable session count is lower than the one it published last
  time, which is what a rebuilt or truncated database would look like.

Run under the interpreter that has duckdb:
  /home/bisenbek/.pyenv/versions/3.13.3/envs/tinymachines/bin/python3 \
      scripts/ai-pilot-pipeline.py [--output PATH] [--dry-run] [--quick] [-v]
"""

import argparse
import json
import math
import os
import re
import sys
from collections import Counter
from datetime import date, datetime, timedelta
from pathlib import Path

# Importing a sibling module would otherwise leave scripts/__pycache__ behind,
# which is not in .gitignore and would dirty the tree on every cron run.
sys.dont_write_bytecode = True
sys.path.insert(0, str(Path(__file__).resolve().parent))
import activity_db  # noqa: E402  (scripts/activity_db.py)

CLAUDE_DIR = Path.home() / ".claude"
CLAUDE_DC1_DIR = Path.home() / ".claude-dc1"
PLANS_DIRS = [CLAUDE_DIR / "plans"]
PROJECTS_DIRS = [CLAUDE_DIR / "projects"]
HISTORY_FILES = [CLAUDE_DIR / "history.jsonl"]
if CLAUDE_DC1_DIR.exists():
    if (CLAUDE_DC1_DIR / "plans").exists():
        PLANS_DIRS.append(CLAUDE_DC1_DIR / "plans")
    if (CLAUDE_DC1_DIR / "projects").exists():
        PROJECTS_DIRS.append(CLAUDE_DC1_DIR / "projects")
    dc1_history = CLAUDE_DC1_DIR / "history.jsonl"
    if dc1_history.exists():
        HISTORY_FILES.append(dc1_history)
USER_PROJECTS = Path.home() / "projects"

DEFAULT_OUTPUT = Path(__file__).parent.parent / "public" / "data" / "ai-pilot-data.json"
PIPELINE_VERSION = "2.0.0"

# Domain keyword dictionaries
DOMAIN_KEYWORDS = {
    "Data Engineering": [
        "sql", "etl", "duckdb", "snowflake", "pipeline", "warehouse", "spark",
        "kafka", "airflow", "parquet", "delta", "iceberg", "dbt", "bigquery",
        "redshift", "postgres", "mysql", "sqlite", "database", "schema",
        "data lake", "data mesh", "batch", "streaming", "ingestion",
    ],
    "Frontend": [
        "react", "next.js", "nextjs", "tailwind", "typescript", "d3", "css",
        "html", "svelte", "vue", "angular", "framer motion", "recharts",
        "component", "jsx", "tsx", "webpack", "vite", "responsive",
        "shadcn", "radix", "ui/ux",
    ],
    "Backend": [
        "fastapi", "python", "node", "express", "api", "rest", "graphql",
        "django", "flask", "websocket", "socket.io", "grpc", "microservice",
        "middleware", "endpoint", "route", "server", "http",
    ],
    "DevOps": [
        "docker", "nginx", "systemd", "ci/cd", "github actions", "terraform",
        "kubernetes", "k8s", "helm", "ansible", "jenkins", "deploy",
        "monitoring", "grafana", "prometheus", "vercel", "aws", "gcp",
        "azure", "linux", "ubuntu", "ssh", "pm2",
    ],
    "IoT / Edge": [
        "raspberry pi", "arduino", "mesh", "lora", "lorawan", "mqtt",
        "edge computing", "iot", "sensor", "gpio", "i2c", "spi",
        "microcontroller", "esp32", "zigbee", "bluetooth", "ble",
        "meshtastic", "firmware",
    ],
    "AI / ML": [
        "llm", "ollama", "embeddings", "vector", "rag", "transformer",
        "gpt", "claude", "openai", "anthropic", "machine learning",
        "neural", "tensorflow", "pytorch", "huggingface", "fine-tune",
        "prompt", "inference", "model", "ai", "nlp", "chatbot",
        "langchain", "agent",
    ],
    "Systems": [
        "c/c++", "rust", "protocol", "low-level", "assembly", "kernel",
        "memory", "performance", "concurrency", "threading", "async",
        "binary", "socket", "tcp", "udp", "serial",
    ],
    "Security": [
        "tls", "ed25519", "trng", "crypto", "encryption", "certificate",
        "auth", "oauth", "jwt", "ssl", "hash", "signing", "key",
        "security", "firewall", "vpn", "wireguard",
    ],
}

# Technology extraction patterns
TECH_PATTERNS = [
    "Python", "TypeScript", "JavaScript", "React", "Next.js", "Tailwind CSS",
    "D3.js", "Node.js", "FastAPI", "Flask", "Django", "Docker", "Nginx",
    "PostgreSQL", "SQLite", "DuckDB", "Redis", "MongoDB", "Snowflake",
    "AWS", "GCP", "Azure", "Vercel", "GitHub Actions", "Terraform",
    "Kubernetes", "Raspberry Pi", "Arduino", "ESP32", "MQTT", "LoRa",
    "Ollama", "LangChain", "OpenAI", "Anthropic", "Rust", "Go", "C++",
    "Svelte", "Vue.js", "Angular", "GraphQL", "REST API", "WebSocket",
    "Socket.IO", "Framer Motion", "Recharts", "Shadcn", "Radix UI",
    "Tailwind", "CSS", "HTML", "Bash", "Linux", "systemd", "PM2",
    "Git", "Markdown", "MDX", "JSON", "YAML", "TOML", "CSV",
    "Pandas", "NumPy", "Jupyter", "Matplotlib", "Seaborn",
    "TLS", "Ed25519", "JWT", "OAuth", "SSH", "WireGuard",
    "Meshtastic", "Zigbee", "Bluetooth", "I2C", "SPI", "GPIO",
    "SWR", "Zustand", "Redux", "MobX", "Prisma", "Drizzle",
    "Pydantic", "SQLAlchemy", "Alembic", "Pytest",
]


def log(msg, verbose=False):
    if verbose:
        print(f"  [*] {msg}", file=sys.stderr)


def read_plan_files(verbose=False):
    """Read plan files for competency evidence across DC-0 + DC-1."""
    plans = []
    seen_names = set()
    for plans_dir in PLANS_DIRS:
        if not plans_dir.exists():
            continue
        for f in sorted(plans_dir.glob("*.md")):
            if f.stem in seen_names:
                continue
            seen_names.add(f.stem)
            try:
                content = f.read_text(errors="replace")
                plans.append({
                    "name": f.stem,
                    "size": len(content),
                    "modified": datetime.fromtimestamp(f.stat().st_mtime).isoformat(),
                    "content_lower": content.lower(),
                })
            except Exception:
                pass

    log(f"Read {len(plans)} plan files ({len(PLANS_DIRS)} sources)", verbose)
    return plans


def read_claude_md_files(verbose=False):
    """Read CLAUDE.md files from user projects for domain expertise."""
    texts = []
    if not USER_PROJECTS.exists():
        return texts

    for md_file in USER_PROJECTS.glob("*/CLAUDE.md"):
        try:
            content = md_file.read_text(errors="replace")
            texts.append({
                "project": md_file.parent.name,
                "content_lower": content.lower(),
                "size": len(content),
            })
        except Exception:
            pass

    # Also check .claude/projects for additional CLAUDE.md refs
    for projects_dir in PROJECTS_DIRS:
        for proj_dir in projects_dir.glob("*/"):
            claude_md = proj_dir / "CLAUDE.md"
            if claude_md.exists():
                try:
                    content = claude_md.read_text(errors="replace")
                    texts.append({
                        "project": proj_dir.name,
                        "content_lower": content.lower(),
                        "size": len(content),
                    })
                except Exception:
                    pass

    log(f"Read {len(texts)} CLAUDE.md files", verbose)
    return texts


def sample_jsonl_files(verbose=False, quick=False):
    """Sample JSONL conversation files for tool usage and tech mentions."""
    if quick:
        log("Quick mode: skipping JSONL sampling", verbose)
        return {"tool_counts": Counter(), "tech_mentions": Counter(), "files_sampled": 0}

    tool_counts = Counter()
    tech_mentions = Counter()
    files_sampled = 0
    max_files = 100

    # Collect JSONL files from all projects across DC-0 + DC-1
    all_jsonl = []
    for projects_dir in PROJECTS_DIRS:
        for proj_dir in projects_dir.glob("*/"):
            jsonl_files = sorted(proj_dir.glob("*.jsonl"), key=lambda f: f.stat().st_mtime)
            if len(jsonl_files) >= 2:
                all_jsonl.append(jsonl_files[0])   # oldest
                all_jsonl.append(jsonl_files[-1])  # newest
            elif jsonl_files:
                all_jsonl.append(jsonl_files[0])

    all_jsonl = all_jsonl[:max_files]
    log(f"Sampling {len(all_jsonl)} JSONL files", verbose)

    for jsonl_path in all_jsonl:
        try:
            with open(jsonl_path, errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue

                    msg = entry.get("message", {})
                    content = msg.get("content", "")

                    # Extract tool usage from assistant messages
                    if entry.get("type") == "assistant" and isinstance(content, list):
                        for block in content:
                            if isinstance(block, dict) and block.get("type") == "tool_use":
                                tool_counts[block.get("name", "unknown")] += 1
                            if isinstance(block, dict) and block.get("type") == "text":
                                text_lower = block.get("text", "").lower()
                                for tech in TECH_PATTERNS:
                                    if tech.lower() in text_lower:
                                        tech_mentions[tech] += 1

                    # Extract tech mentions from user messages
                    if entry.get("type") == "user" and isinstance(content, str):
                        content_lower = content.lower()
                        for tech in TECH_PATTERNS:
                            if tech.lower() in content_lower:
                                tech_mentions[tech] += 1

            files_sampled += 1
        except Exception:
            pass

    log(f"Sampled {files_sampled} files, found {len(tool_counts)} tools, {len(tech_mentions)} techs", verbose)
    return {
        "tool_counts": tool_counts,
        "tech_mentions": tech_mentions,
        "files_sampled": files_sampled,
    }


def read_history_file(verbose=False):
    """Read the prompt history (history.jsonl) across DC-0 + DC-1.

    One line per prompt typed, with the project directory it was typed in. A
    switch is a prompt typed in a different project from the one before it on
    the same host. (This used to look for "type" and "cwd" keys, which
    history.jsonl does not carry, so it always reported 0 switches.)
    """
    project_switches = 0
    total_commands = 0

    for history_file in HISTORY_FILES:
        if not history_file.exists():
            continue
        last_project = None
        try:
            with open(history_file, errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if "display" not in entry:
                        continue
                    total_commands += 1
                    project = entry.get("project") or ""
                    if project and project != last_project:
                        if last_project is not None:
                            project_switches += 1
                        last_project = project
        except Exception:
            pass

    log(f"History: {total_commands} commands, {project_switches} project switches ({len(HISTORY_FILES)} sources)", verbose)
    return {"project_switches": project_switches, "total_commands": total_commands}


def read_previous_output(output_path):
    """The last published output, or {}. Used only for the two never-go-down
    checks (licence serial, session count), never as a data source."""
    for candidate in (Path(output_path), DEFAULT_OUTPUT):
        try:
            if candidate.exists():
                return json.loads(candidate.read_text())
        except Exception:
            continue
    return {}


def display_name(model_id):
    """claude-opus-4-8 -> "Opus 4.8", claude-haiku-4-5-20251001 -> "Haiku 4.5".

    Derived, not looked up: the old lookup table fell back to the family name
    alone, so Opus 5, Opus 4.8 and Opus 4.7 were all published as "Opus".
    """
    parts = model_id.split("-")
    if parts and parts[0] == "claude":
        parts = parts[1:]
    if parts and re.fullmatch(r"\d{8}", parts[-1]):
        parts = parts[:-1]
    if not parts:
        return model_id
    version = ".".join(parts[1:])
    return f"{parts[0].capitalize()} {version}".strip()


def license_number(issued, durable_sessions, previous):
    """AIP-<year issued>-<serial>.

    The serial is the session count in the durable record, and it is never
    allowed to be lower than the serial already published.

    Why derived rather than frozen: the serial has always meant "sessions
    flown", and the card prints it next to the session count, so a frozen
    number would stop agreeing with the figure beside it. What made it go down
    (0408 in March 2026, 0061 in July, 0141 in October) was the source, a
    30-day window of raw logs, not the idea. The durable record only grows.
    The floor against the previous output covers the one case where it might
    not: a database rebuilt from whatever logs happen to be left.

    The year is the year of issue, not the year of the run, so the number does
    not change on 1 January.
    """
    serial = durable_sessions
    m = re.fullmatch(r"AIP-\d{4}-(\d+)", str(previous.get("license", {}).get("number", "")))
    if m:
        serial = max(serial, int(m.group(1)))
    year = issued[:4] if issued else datetime.now().strftime("%Y")
    return f"AIP-{year}-{str(serial).zfill(4)}"


def compute_license(agg, cost, previous):
    """Compute the license card data from the durable record."""
    totals = agg["totals"]
    tokens = totals["tokens"]
    total_messages = totals["turns"]
    issued = agg["coverage"]["first_day"]

    # Determine class based on usage
    if total_messages > 300000:
        license_class = "ATP"  # Airline Transport Pilot
    elif total_messages > 100000:
        license_class = "Commercial"
    elif total_messages > 10000:
        license_class = "Private"
    else:
        license_class = "Student"

    return {
        "number": license_number(issued, totals["sessions"], previous),
        "class": license_class,
        "issued": issued,
        "expires": "NEVER",
        "totalSessions": totals["sessions"],
        # A "message" is a transcript record (activity_db calls it a turn): a
        # prompt, a tool result, or one content block of a model reply.
        "totalMessages": total_messages,
        "totalUserRecords": totals["user_turns"],
        "totalAssistantRecords": totals["assistant_turns"],
        "totalApiCalls": totals["api_calls"],
        "totalToolCalls": totals["tool_uses"],
        # None, not 0, when it cannot be computed. See activity_db.price_usage.
        "totalCostUSD": cost["totalUSD"],
        "totalInputTokens": tokens["input"],
        "totalOutputTokens": tokens["output"],
        "totalCacheTokens": tokens["cache_read"],
        "modelCount": totals["models"],
        "projectCount": totals["projects"],
    }


def compute_type_ratings(agg, cost):
    """Compute per-model type ratings from the durable record."""
    models = agg["models"]
    # Output token share is the metric. The field is called costShare for the
    # pages that already read it, but it has never been a share of cost.
    total_output = sum(m["output_tokens"] for m in models)

    ratings = []
    for m in models:
        if m["output_tokens"] == 0 and m["input_tokens"] == 0:
            continue

        share = m["output_tokens"] / total_output * 100 if total_output > 0 else 0
        if share > 50:
            proficiency = "Expert"
        elif share > 20:
            proficiency = "Proficient"
        elif share > 5:
            proficiency = "Familiar"
        else:
            proficiency = "Exposure"

        ratings.append({
            "modelId": m["model"],
            "displayName": display_name(m["model"]),
            "apiCalls": m["api_calls"],
            "inputTokens": m["input_tokens"],
            "outputTokens": m["output_tokens"],
            "cacheReadTokens": m["cache_read_tokens"],
            "cacheCreationTokens": m["cache_creation_tokens"],
            "costUSD": cost["perModelUSD"].get(m["model"]),
            "costShare": round(share, 1),
            "proficiency": proficiency,
            "firstDay": m["first_day"],
            "lastDay": m["last_day"],
            # Never recorded by anything this pipeline reads. They were
            # published as 0, which is a claim; null is not.
            "contextWindow": None,
            "maxOutputTokens": None,
        })

    ratings.sort(key=lambda r: r["costShare"], reverse=True)
    return ratings


def compute_activity_heatmap(agg):
    """One entry per active day, from the durable record.

    count is the transcript records written that day, sessions is the sessions
    with any activity that day. (The old version put a whole session's records
    on the day the session started, so a week-long session was one huge day.)
    """
    daily = agg["daily"]
    max_count = max((d["turns"] for d in daily), default=1) or 1

    heatmap = []
    for day in daily:
        count = day["turns"]

        if count == 0:
            intensity = 0
        elif count <= max_count * 0.25:
            intensity = 1
        elif count <= max_count * 0.5:
            intensity = 2
        elif count <= max_count * 0.75:
            intensity = 3
        else:
            intensity = 4

        heatmap.append({
            "date": day["date"],
            "count": count,
            "sessions": day["sessions"],
            "sessionsStarted": day["sessions_started"],
            "toolCalls": day["tool_uses"],
            "intensity": intensity,
        })

    return heatmap


def compute_hourly_distribution(agg):
    """24-hour distribution of session starts, in agg["hour_tz"]."""
    distribution = []
    peak_hour = 0
    peak_count = 0

    for h in agg["hourly"]:
        count = h["sessions_started"]
        if count > peak_count:
            peak_count = count
            peak_hour = h["hour"]
        distribution.append({
            "hour": h["hour"],
            "label": f"{h['hour']:02d}:00",
            "count": count,
            "records": h["turns"],
        })

    return {
        "hours": distribution,
        "peakHour": peak_hour,
        "peakCount": peak_count,
        "timezone": agg["hour_tz"],
    }


def compute_instrument_ratings(plans, claude_mds, jsonl_data):
    """Compute domain expertise scores 0-100."""
    # Combine all text sources
    all_text = ""
    for p in plans:
        all_text += " " + p["content_lower"]
    for c in claude_mds:
        all_text += " " + c["content_lower"]

    # Add JSONL tech mentions
    tech_text = " ".join(jsonl_data.get("tech_mentions", {}).keys()).lower()
    all_text += " " + tech_text

    scores = {}
    all_hits = []
    for domain, keywords in DOMAIN_KEYWORDS.items():
        total_hits = 0
        matched_keywords = []
        for kw in keywords:
            count = all_text.count(kw.lower())
            if count > 0:
                total_hits += count
                matched_keywords.append(kw)
        all_hits.append((domain, total_hits, matched_keywords, len(keywords)))

    # Use relative scoring: highest domain gets ~95, others proportional
    max_hits = max(h[1] for h in all_hits) if all_hits else 1
    if max_hits == 0:
        max_hits = 1

    for domain, total_hits, matched_keywords, kw_count in all_hits:
        # Score based on keyword coverage (50%) and relative hit volume (50%)
        coverage_score = len(matched_keywords) / kw_count * 50
        volume_score = (total_hits / max_hits) * 50 if max_hits > 0 else 0
        score = min(98, int(coverage_score + volume_score))

        scores[domain] = {
            "score": score,
            "hits": total_hits,
            "matchedKeywords": matched_keywords[:8],
            "keywordCoverage": round(len(matched_keywords) / kw_count * 100, 1),
        }

    return scores


def compute_competency_radar(agg, plans, tool_counts, history):
    """Compute 6-axis competency radar."""
    total_messages = agg["totals"]["turns"]
    total_sessions = agg["totals"]["sessions"]

    # Planning: based on plan files (72 plans is very high, cap more aggressively)
    planning_score = min(95, int(40 + 30 * math.log2(len(plans) + 1) / math.log2(80)))

    # Tool Mastery: based on diversity and volume of tool usage
    unique_tools = len(tool_counts)
    tool_volume = sum(tool_counts.values())
    tool_mastery = min(95, int(30 + unique_tools * 2.5 + min(30, math.log2(tool_volume + 1) * 3)))

    # Debugging: inferred from Bash/Grep/Read usage relative to total
    debug_tools = tool_counts.get("Bash", 0) + tool_counts.get("Grep", 0) + tool_counts.get("Read", 0)
    debug_ratio = debug_tools / max(1, tool_volume)
    debugging = min(95, int(40 + debug_ratio * 60 + min(20, math.log2(debug_tools + 1) * 3)))

    # Architecture: based on project count and diversity
    project_count = agg["totals"]["projects"]
    architecture = min(95, int(30 + min(40, project_count * 2) + min(25, len(plans) * 0.4)))

    # Iteration Speed: messages per session (700+ msgs/session is extreme)
    msgs_per_session = total_messages / max(1, total_sessions)
    iteration = min(95, int(30 + 40 * math.log2(msgs_per_session + 1) / math.log2(1000)))

    # Multi-project: based on project count and switches
    multi_project = min(95, int(20 + history.get("project_switches", 0) * 0.5 + project_count * 2))

    return [
        {"axis": "Planning", "score": round(planning_score), "detail": f"{len(plans)} plan files on disk"},
        {"axis": "Tool Mastery", "score": round(tool_mastery), "detail": f"{unique_tools} tools, {tool_volume} calls"},
        {"axis": "Debugging", "score": round(debugging), "detail": f"{debug_tools} debug tool calls"},
        {"axis": "Architecture", "score": round(architecture), "detail": f"{project_count} projects"},
        {"axis": "Iteration", "score": round(iteration), "detail": f"{int(msgs_per_session)} records/session avg"},
        {"axis": "Multi-Project", "score": round(multi_project), "detail": f"{history.get('project_switches', 0)} project switches in the prompt history"},
    ]


def compute_piloting_style(agg, plans, tool_counts):
    """Compute piloting style: Directive/Collaborative x Plan-first/Iterate."""
    total_sessions = agg["totals"]["sessions"]

    # Directive vs Collaborative: based on tool call ratio
    edit_tools = tool_counts.get("Edit", 0) + tool_counts.get("Write", 0)
    total_tools = sum(tool_counts.values()) or 1

    directive_score = min(100, int((edit_tools / total_tools) * 200)) if total_tools > 0 else 50
    collaborative_score = 100 - directive_score

    # Plan-first vs Iterate: based on plan usage relative to sessions
    # 72 plans / 528 sessions = ~14% plan rate. Scale so 20%+ = 80, cap at 85
    plan_ratio = len(plans) / max(1, total_sessions)
    plan_first_score = min(85, int(50 + 35 * math.log2(plan_ratio * 20 + 1) / math.log2(10)))
    iterate_score = 100 - plan_first_score

    # Determine dominant style
    if plan_first_score > 60 and directive_score > 60:
        style = "Commander"
    elif plan_first_score > 60 and collaborative_score > 60:
        style = "Strategist"
    elif iterate_score > 60 and directive_score > 60:
        style = "Tactician"
    elif iterate_score > 60 and collaborative_score > 60:
        style = "Explorer"
    else:
        style = "Balanced"

    return {
        "directive": directive_score,
        "collaborative": collaborative_score,
        "planFirst": plan_first_score,
        "iterate": iterate_score,
        "label": style,
        "description": {
            "Commander": "Plans thoroughly, then executes decisively with specific tool directives.",
            "Strategist": "Designs detailed plans then collaborates on implementation nuances.",
            "Tactician": "Iterates rapidly with direct, precise instructions at each step.",
            "Explorer": "Explores collaboratively, discovering solutions through conversation.",
            "Balanced": "Flexibly adapts between planning and iteration as the task demands.",
        }.get(style, ""),
    }


def compute_mission_log(agg, claude_mds):
    """Top projects as missions, from the durable record.

    A session counts toward the project it started in; see "project" in
    activity_db for why a few names are subdirectories.
    """
    today = date.fromisoformat(agg["streaks"]["as_of"])

    missions = []
    for proj in agg["projects"][:30]:
        project_name = proj["project"]
        sessions = proj["sessions"]
        messages = proj["turns"]

        # Complexity score: logarithmic based on messages and sessions
        complexity = min(10, int(math.log2(messages + 1)))

        # Try to find matching CLAUDE.md
        techs = []
        domain = "General"
        for md in claude_mds:
            if project_name.lower() in md["project"].lower() or md["project"].lower() in project_name.lower():
                # Extract some tech keywords
                content = md["content_lower"]
                for tech in TECH_PATTERNS:
                    if tech.lower() in content:
                        techs.append(tech)
                # Guess domain
                for d, keywords in DOMAIN_KEYWORDS.items():
                    hits = sum(1 for kw in keywords if kw in content)
                    if hits >= 3:
                        domain = d
                        break
                break

        # Determine status
        days_ago = (today - date.fromisoformat(proj["last_active"])).days
        if days_ago <= 7:
            status = "active"
        elif days_ago <= 30:
            status = "recent"
        else:
            status = "archived"

        missions.append({
            "name": project_name,
            "sessions": sessions,
            "messages": messages,
            "toolCalls": proj["tool_uses"],
            "complexity": complexity,
            "domain": domain,
            "technologies": techs[:8],
            "status": status,
            "firstActive": proj["first_active"],
            "lastActive": proj["last_active"],
        })

    missions.sort(key=lambda m: m["messages"], reverse=True)
    return missions[:20]


def compute_token_economy(agg, cost):
    """Token totals from the durable record, counted once per model response.

    These are lower than a sum over log lines by a factor of two to three,
    because Claude Code repeats a response's usage on every line it writes for
    that response. See "api_call" in activity_db.
    """
    tokens = agg["totals"]["tokens"]
    total_input = tokens["input"]
    total_output = tokens["output"]
    total_cache_read = tokens["cache_read"]
    total_cache_create = tokens["cache_creation"]

    # Cache efficiency
    total_tokens = total_input + total_cache_read + total_cache_create
    cache_ratio = round(total_cache_read / max(1, total_tokens) * 100, 1)

    total_cost = cost["totalUSD"]
    total_sessions = agg["totals"]["sessions"]
    cost_per_session = (
        round(total_cost / total_sessions, 2) if total_cost is not None and total_sessions else None
    )

    # Input + output tokens per day, last 30 active days
    daily_tokens = [
        {"date": d["date"], "tokens": d["tokens"]["input"] + d["tokens"]["output"]}
        for d in agg["daily"][-30:]
    ]

    return {
        "totalInputTokens": total_input,
        "totalOutputTokens": total_output,
        "totalCacheReadTokens": total_cache_read,
        "totalCacheCreateTokens": total_cache_create,
        "totalCostUSD": total_cost,
        "cacheEfficiency": cache_ratio,
        "costPerSession": cost_per_session,
        # Not recorded in the durable record. It was published as 0.
        "webSearches": None,
        "dailyTokens": daily_tokens,
        "cost": cost,
    }


def compute_streaks(agg):
    """Streaks and peaks over the durable record's days (agg["day_tz"])."""
    daily = agg["daily"]
    streaks = agg["streaks"]

    peak_day = max(daily, key=lambda d: d["turns"])

    weekly_totals = Counter()
    for d in daily:
        dt = date.fromisoformat(d["date"])
        week_start = (dt - timedelta(days=dt.weekday())).isoformat()
        weekly_totals[week_start] += d["turns"]
    peak_week = max(weekly_totals.items(), key=lambda x: x[1])

    return {
        "current": streaks["current"],
        "longest": streaks["longest"],
        "longestStart": streaks["longest_start"],
        "longestEnd": streaks["longest_end"],
        "peakDay": peak_day["date"],
        "peakDayCount": peak_day["turns"],
        "peakWeek": peak_week[0],
        "peakWeekCount": peak_week[1],
        "totalActiveDays": agg["active_days"],
        "asOf": streaks["as_of"],
        "timezone": agg["day_tz"],
    }


def compute_coverage(agg, jsonl_data):
    """What the published numbers cover. The pages print this."""
    cov = agg["coverage"]
    return {
        "since": cov["first_day"],
        "through": cov["last_day"],
        "source": agg["source"],
        "recordingBegan": cov["recording_began"],
        "dayTimezone": agg["day_tz"],
        "hourTimezone": agg["hour_tz"],
        "note": (
            f"Totals, days, models and projects are read from the durable activity "
            f"database and cover {cov['first_day']} through {cov['last_day']} (UTC days). "
            f"The database started recording on {cov['recording_began']}. From before "
            f"that date it holds only the sessions whose logs were still on disk that "
            f"day, so the earlier months are incomplete and nothing before "
            f"{cov['first_day']} is included."
        ),
        "definitions": {
            "message": (
                "One transcript record: a prompt, a tool result, or one content "
                "block of a model reply. Not a count of prompts typed."
            ),
            "session": "One Claude Code session log. Subagent logs are not counted.",
            "project": "The directory a session started in, by its last path component.",
            "tokens": (
                "Counted once per model response, not once per log line. The "
                "record does not store response ids, so a response is "
                "reconstructed from the usage counts its log lines repeat. On "
                "2026-10-02 that rule was compared with response ids in the raw "
                "logs still on disk, about 40 percent of the record, and gave "
                "identical counts and token sums. The other 60 percent, whose "
                "logs were already pruned, is counted by the same rule and was "
                "not verified. Tokens used by subagents are not in the record."
            ),
        },
        # The sections that do NOT come from the durable record.
        "rollingWindow": {
            "sections": ["skillsCloud", "instrumentRatings"],
            "filesSampled": jsonl_data.get("files_sampled", 0),
            "note": (
                "Keyword and technology mentions need message text, which the "
                "database does not store. They are counted over a sample of the raw "
                "session logs still on disk (about the last 30 days) plus the "
                "CLAUDE.md and plan files, so they describe recent work, not the "
                "whole record."
            ),
        },
    }


def compute_skills_cloud(jsonl_data, claude_mds):
    """Compute top 30 technology tags with frequency."""
    tech_counts = Counter(jsonl_data.get("tech_mentions", {}))

    # Also count from CLAUDE.md files
    for md in claude_mds:
        content = md["content_lower"]
        for tech in TECH_PATTERNS:
            if tech.lower() in content:
                tech_counts[tech] += 3  # Weight CLAUDE.md mentions higher

    # Categorize
    tech_categories = {}
    for tech in TECH_PATTERNS:
        for domain, keywords in DOMAIN_KEYWORDS.items():
            if tech.lower() in [kw.lower() for kw in keywords]:
                tech_categories[tech] = domain
                break
        if tech not in tech_categories:
            tech_categories[tech] = "General"

    # Top 30
    top = tech_counts.most_common(30)
    return [
        {
            "name": name,
            "count": count,
            "category": tech_categories.get(name, "General"),
        }
        for name, count in top
        if count > 0
    ]


def main():
    parser = argparse.ArgumentParser(description="AI Pilot License Data Pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Print output to stdout instead of file")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    parser.add_argument("--quick", "-q", action="store_true", help="Skip JSONL sampling for faster run")
    parser.add_argument("--output", "-o", type=str, default=str(DEFAULT_OUTPUT), help="Output file path")
    parser.add_argument("--db", type=str, default=str(activity_db.DEFAULT_DB), help="Durable activity database (opened read-only)")
    parser.add_argument("--allow-shrink", action="store_true",
                        help="Write even if the durable session count is lower than the one last published")
    args = parser.parse_args()

    print("AI Pilot License Data Pipeline", file=sys.stderr)
    print("=" * 40, file=sys.stderr)

    # Phase 1: Read all data sources
    print("Reading the durable activity database...", file=sys.stderr)
    agg = activity_db.load(args.db)
    if agg is None:
        # Fail soft: the previous output is still true as of its own date, and
        # zeros would not be. Exit 0 so the rest of the cron chain still runs.
        print(f"DURABLE RECORD UNAVAILABLE. Nothing written; {args.output} is unchanged.", file=sys.stderr)
        return 0

    previous = read_previous_output(args.output)
    prev_sessions = previous.get("license", {}).get("totalSessions")
    if (
        previous.get("coverage", {}).get("source") == agg["source"]
        and isinstance(prev_sessions, int)
        and agg["totals"]["sessions"] < prev_sessions
        and not args.allow_shrink
    ):
        print(
            f"DURABLE RECORD SHRANK: {agg['totals']['sessions']} sessions now, "
            f"{prev_sessions} published last time. Was the database rebuilt? "
            f"Nothing written; {args.output} is unchanged. Pass --allow-shrink to override.",
            file=sys.stderr,
        )
        return 0

    print("Reading plan files...", file=sys.stderr)
    plans = read_plan_files(args.verbose)

    print("Reading CLAUDE.md files...", file=sys.stderr)
    claude_mds = read_claude_md_files(args.verbose)

    print("Sampling JSONL files...", file=sys.stderr)
    jsonl_data = sample_jsonl_files(args.verbose, args.quick)

    print("Reading history...", file=sys.stderr)
    history = read_history_file(args.verbose)

    # Tool counts come from the durable record (every call since coverage
    # began), not from the transcript sample, which is still used for the
    # technology mentions only the text can supply.
    tool_counts = Counter({t["tool"]: t["calls"] for t in agg["tools"]})

    # List-price cost. cache_write_ttl stays None because the database does not
    # record it, which makes the total None. See activity_db.price_usage.
    cost = activity_db.price_usage(agg["models"], cache_write_ttl=None)

    # Phase 2: Compute all sections
    print("Computing metrics...", file=sys.stderr)
    output = {
        "generated": datetime.now().isoformat(),
        "pipelineVersion": PIPELINE_VERSION,
        "coverage": compute_coverage(agg, jsonl_data),
        "license": compute_license(agg, cost, previous),
        "typeRatings": compute_type_ratings(agg, cost),
        "activityHeatmap": compute_activity_heatmap(agg),
        "hourlyDistribution": compute_hourly_distribution(agg),
        "instrumentRatings": compute_instrument_ratings(plans, claude_mds, jsonl_data),
        "competencyRadar": compute_competency_radar(agg, plans, tool_counts, history),
        "pilotingStyle": compute_piloting_style(agg, plans, tool_counts),
        "missionLog": compute_mission_log(agg, claude_mds),
        "tokenEconomy": compute_token_economy(agg, cost),
        "streaks": compute_streaks(agg),
        "skillsCloud": compute_skills_cloud(jsonl_data, claude_mds),
    }

    # Phase 3: Output
    json_str = json.dumps(output, indent=2)

    if args.dry_run:
        print(json_str)
    else:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        # Write beside the target and rename, so a page reading the file mid-run
        # never sees half of it.
        tmp_path = output_path.with_name(output_path.name + ".tmp")
        tmp_path.write_text(json_str)
        os.replace(tmp_path, output_path)
        size_kb = len(json_str) / 1024
        print(f"\nWritten to {output_path} ({size_kb:.1f} KB)", file=sys.stderr)

    # Summary
    cost_line = (
        f"${cost['totalUSD']}" if cost["totalUSD"] is not None
        else f"not computed ({cost['reason']})"
    )
    print(f"\nSummary:", file=sys.stderr)
    print(f"  Coverage: {output['coverage']['since']} through {output['coverage']['through']} ({output['coverage']['source']})", file=sys.stderr)
    print(f"  License: {output['license']['number']} class {output['license']['class']}", file=sys.stderr)
    print(f"  Sessions: {output['license']['totalSessions']}", file=sys.stderr)
    print(f"  Messages: {output['license']['totalMessages']}", file=sys.stderr)
    print(f"  Cost: {cost_line}", file=sys.stderr)
    print(f"  Projects: {output['license']['projectCount']} ({len(output['missionLog'])} in the mission log)", file=sys.stderr)
    print(f"  Active days: {output['streaks']['totalActiveDays']}", file=sys.stderr)
    print(f"  Current streak: {output['streaks']['current']} days", file=sys.stderr)
    print(f"  Skills found: {len(output['skillsCloud'])}", file=sys.stderr)
    print(f"  Domain ratings: {len(output['instrumentRatings'])}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
