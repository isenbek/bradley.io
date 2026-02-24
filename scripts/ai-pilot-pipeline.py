#!/usr/bin/env python3
"""
AI Pilot License Data Pipeline
Reads Claude Code local data and generates ai-pilot-data.json for the dashboard.
"""

import argparse
import json
import os
import re
import sys
from collections import Counter, defaultdict
from datetime import datetime, timedelta
from pathlib import Path

CLAUDE_DIR = Path.home() / ".claude"
STATS_CACHE = CLAUDE_DIR / "stats-cache.json"
PLANS_DIR = CLAUDE_DIR / "plans"
PROJECTS_DIR = CLAUDE_DIR / "projects"
HISTORY_FILE = CLAUDE_DIR / "history.jsonl"
USER_PROJECTS = Path.home() / "projects"

DEFAULT_OUTPUT = Path(__file__).parent.parent / "public" / "data" / "ai-pilot-data.json"

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


def read_stats_cache(verbose=False):
    """Read the pre-computed stats cache."""
    if not STATS_CACHE.exists():
        log("stats-cache.json not found", verbose)
        return {}
    log(f"Reading {STATS_CACHE}", verbose)
    with open(STATS_CACHE) as f:
        return json.load(f)


def read_session_data(verbose=False):
    """Read structured data from JSONL session files (replaces old SQLite store)."""
    if not PROJECTS_DIR.exists():
        log("Projects directory not found", verbose)
        return {"sessions": [], "projects": [], "models": []}

    # Collect all JSONL session files
    jsonl_files = []
    for proj_dir in PROJECTS_DIR.iterdir():
        if not proj_dir.is_dir():
            continue
        for f in proj_dir.glob("*.jsonl"):
            jsonl_files.append(f)

    log(f"Found {len(jsonl_files)} JSONL session files", verbose)

    sessions = []
    project_agg = defaultdict(lambda: {
        "sessions": 0, "messages": 0,
        "first_active": None, "last_active": None,
    })
    model_agg = defaultdict(lambda: {"msg_count": 0, "total_cost": 0, "total_duration": 0})

    for filepath in jsonl_files:
        try:
            messages = []
            cwd = None
            with open(filepath, errors="replace") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    if entry.get("type") not in ("user", "assistant"):
                        continue
                    if entry.get("isSidechain"):
                        continue
                    messages.append(entry)
                    if not cwd and entry.get("cwd"):
                        cwd = entry["cwd"]

            if not messages:
                continue

            session_id = filepath.stem
            first_ts = messages[0].get("timestamp", "")
            last_ts = messages[-1].get("timestamp", "")
            user_msgs = sum(1 for m in messages if m.get("type") == "user")
            asst_msgs = sum(1 for m in messages if m.get("type") == "assistant")

            # Parse timestamps to epoch ms
            first_epoch = None
            last_epoch = None
            try:
                first_dt = datetime.fromisoformat(first_ts.replace("Z", "+00:00"))
                last_dt = datetime.fromisoformat(last_ts.replace("Z", "+00:00"))
                first_epoch = int(first_dt.timestamp() * 1000)
                last_epoch = int(last_dt.timestamp() * 1000)
            except (ValueError, TypeError):
                pass

            sessions.append({
                "session_id": session_id,
                "cwd": cwd or "",
                "first_msg": first_epoch,
                "last_msg": last_epoch,
                "msg_count": len(messages),
                "user_msgs": user_msgs,
                "asst_msgs": asst_msgs,
            })

            # Aggregate per project
            if cwd:
                pa = project_agg[cwd]
                pa["sessions"] += 1
                pa["messages"] += len(messages)
                if first_epoch and (pa["first_active"] is None or first_epoch < pa["first_active"]):
                    pa["first_active"] = first_epoch
                if last_epoch and (pa["last_active"] is None or last_epoch > pa["last_active"]):
                    pa["last_active"] = last_epoch

            # Aggregate per model
            for msg in messages:
                if msg.get("type") != "assistant":
                    continue
                model = msg.get("message", {}).get("model", "")
                if not model or model == "<synthetic>":
                    continue
                model_agg[model]["msg_count"] += 1

        except Exception as e:
            log(f"Error reading {filepath}: {e}", verbose)

    # Build project list sorted by messages
    projects = sorted(
        [{"cwd": cwd, **v} for cwd, v in project_agg.items()],
        key=lambda p: p["messages"],
        reverse=True,
    )

    models = [{"model": m, **v} for m, v in model_agg.items()]

    log(f"Parsed {len(sessions)} sessions, {len(projects)} projects, {len(models)} models", verbose)
    return {"sessions": sessions, "projects": projects, "models": models}


def read_plan_files(verbose=False):
    """Read plan files for competency evidence."""
    if not PLANS_DIR.exists():
        log("Plans directory not found", verbose)
        return []

    plans = []
    for f in sorted(PLANS_DIR.glob("*.md")):
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

    log(f"Read {len(plans)} plan files", verbose)
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
    for proj_dir in PROJECTS_DIR.glob("*/"):
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

    # Collect JSONL files from all projects
    all_jsonl = []
    for proj_dir in PROJECTS_DIR.glob("*/"):
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
    """Read history.jsonl for command patterns."""
    if not HISTORY_FILE.exists():
        return {"project_switches": 0, "total_commands": 0}

    project_switches = 0
    total_commands = 0
    last_cwd = None

    try:
        with open(HISTORY_FILE, errors="replace") as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue

                if entry.get("type") == "user":
                    total_commands += 1
                    cwd = entry.get("cwd", "")
                    if cwd and cwd != last_cwd:
                        project_switches += 1
                        last_cwd = cwd
    except Exception:
        pass

    log(f"History: {total_commands} commands, {project_switches} project switches", verbose)
    return {"project_switches": project_switches, "total_commands": total_commands}


def compute_license(stats, db_data):
    """Compute the license card data."""
    total_sessions = stats.get("totalSessions", 0)
    total_messages = stats.get("totalMessages", 0)
    first_date = stats.get("firstSessionDate", "")
    model_usage = stats.get("modelUsage", {})

    # Cost from stats-cache (may be 0 for Pro subscriptions)
    stats_cost = sum(m.get("costUSD", 0) for m in model_usage.values())
    # Also check SQLite for historical cost data
    db_cost = sum(m.get("total_cost", 0) for m in db_data.get("models", []))
    total_cost = max(stats_cost, db_cost)

    total_input = sum(m.get("inputTokens", 0) for m in model_usage.values())
    total_output = sum(m.get("outputTokens", 0) for m in model_usage.values())
    total_cache_read = sum(m.get("cacheReadInputTokens", 0) for m in model_usage.values())

    # Determine class based on usage
    if total_messages > 300000:
        license_class = "ATP"  # Airline Transport Pilot
    elif total_messages > 100000:
        license_class = "Commercial"
    elif total_messages > 10000:
        license_class = "Private"
    else:
        license_class = "Student"

    # Count unique models used (from both stats-cache and SQLite)
    model_count = len(model_usage)

    return {
        "number": f"AIP-{datetime.now().strftime('%Y')}-{str(total_sessions).zfill(4)}",
        "class": license_class,
        "issued": first_date[:10] if first_date else "",
        "expires": "NEVER",
        "totalSessions": total_sessions,
        "totalMessages": total_messages,
        "totalCostUSD": round(total_cost, 2),
        "totalInputTokens": total_input,
        "totalOutputTokens": total_output,
        "totalCacheTokens": total_cache_read,
        "modelCount": model_count,
        "projectCount": len(db_data.get("projects", [])),
    }


def compute_type_ratings(stats, db_data):
    """Compute per-model type ratings."""
    model_usage = stats.get("modelUsage", {})
    ratings = []

    # Model display names
    model_names = {
        "claude-opus-4-6": "Opus 4.6",
        "claude-opus-4-5-20251101": "Opus 4.5",
        "claude-sonnet-4-5-20250929": "Sonnet 4.5",
        "claude-sonnet-4-20250514": "Sonnet 4",
        "claude-haiku-3-5-20241022": "Haiku 3.5",
        "claude-3-7-sonnet-20250219": "Sonnet 3.7",
    }

    # Build cost map from SQLite (for models with real cost data)
    db_model_costs = {}
    for m in db_data.get("models", []):
        if m.get("model"):
            db_model_costs[m["model"]] = m.get("total_cost", 0)

    # Use total output tokens as primary metric for share (works for Pro subs)
    total_output = sum(m.get("outputTokens", 0) for m in model_usage.values())

    for model_id, usage in model_usage.items():
        input_tok = usage.get("inputTokens", 0)
        output_tok = usage.get("outputTokens", 0)
        cache_read = usage.get("cacheReadInputTokens", 0)
        cache_create = usage.get("cacheCreationInputTokens", 0)

        # Skip models with negligible usage or synthetic entries
        if output_tok == 0 and input_tok == 0:
            continue
        if "<" in model_id or "synthetic" in model_id.lower():
            continue

        # Use SQLite cost if stats-cache has 0
        cost = usage.get("costUSD", 0) or db_model_costs.get(model_id, 0)

        # Proficiency based on output token share
        share = output_tok / total_output * 100 if total_output > 0 else 0
        if share > 50:
            proficiency = "Expert"
        elif share > 20:
            proficiency = "Proficient"
        elif share > 5:
            proficiency = "Familiar"
        else:
            proficiency = "Exposure"

        ratings.append({
            "modelId": model_id,
            "displayName": model_names.get(model_id, model_id.split("-")[1].capitalize() if "-" in model_id else model_id),
            "inputTokens": input_tok,
            "outputTokens": output_tok,
            "cacheReadTokens": cache_read,
            "cacheCreationTokens": cache_create,
            "costUSD": round(cost, 2),
            "costShare": round(share, 1),
            "proficiency": proficiency,
            "contextWindow": usage.get("contextWindow", 0),
            "maxOutputTokens": usage.get("maxOutputTokens", 0),
        })

    # Also add models from SQLite not in stats-cache
    for m in db_data.get("models", []):
        model_id = m.get("model", "")
        if not model_id or model_id in model_usage:
            continue
        if "<" in model_id or "synthetic" in model_id.lower():
            continue
        if model_id:
            cost = m.get("total_cost", 0)
            msg_count = m.get("msg_count", 0)
            if msg_count == 0:
                continue
            ratings.append({
                "modelId": model_id,
                "displayName": model_names.get(model_id, model_id),
                "inputTokens": 0,
                "outputTokens": 0,
                "cacheReadTokens": 0,
                "cacheCreationTokens": 0,
                "costUSD": round(cost, 2),
                "costShare": 0,
                "proficiency": "Familiar" if cost > 50 else "Exposure",
                "contextWindow": 0,
                "maxOutputTokens": 0,
            })

    ratings.sort(key=lambda r: r["costShare"], reverse=True)
    return ratings


def compute_activity_heatmap(stats):
    """Compute GitHub-style activity heatmap from daily activity."""
    daily = stats.get("dailyActivity", [])
    if not daily:
        return []

    # Find max for intensity scaling
    max_count = max((d.get("messageCount", 0) for d in daily), default=1)
    if max_count == 0:
        max_count = 1

    heatmap = []
    for day in daily:
        count = day.get("messageCount", 0)
        sessions = day.get("sessionCount", 0)
        tools = day.get("toolCallCount", 0)

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
            "sessions": sessions,
            "toolCalls": tools,
            "intensity": intensity,
        })

    return heatmap


def compute_hourly_distribution(stats):
    """Compute 24-hour session distribution."""
    hour_counts = stats.get("hourCounts", {})
    distribution = []
    peak_hour = 0
    peak_count = 0

    for hour in range(24):
        count = hour_counts.get(str(hour), 0)
        if count > peak_count:
            peak_count = count
            peak_hour = hour
        distribution.append({
            "hour": hour,
            "label": f"{hour:02d}:00",
            "count": count,
        })

    return {"hours": distribution, "peakHour": peak_hour, "peakCount": peak_count}


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


def compute_competency_radar(stats, db_data, plans, jsonl_data, history):
    """Compute 6-axis competency radar."""
    total_messages = stats.get("totalMessages", 0)
    total_sessions = stats.get("totalSessions", 0)
    tool_counts = jsonl_data.get("tool_counts", Counter())

    import math

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
    project_count = len(db_data.get("projects", []))
    architecture = min(95, int(30 + min(40, project_count * 2) + min(25, len(plans) * 0.4)))

    # Iteration Speed: messages per session (700+ msgs/session is extreme)
    msgs_per_session = total_messages / max(1, total_sessions)
    iteration = min(95, int(30 + 40 * math.log2(msgs_per_session + 1) / math.log2(1000)))

    # Multi-project: based on project count and switches
    multi_project = min(95, int(20 + history.get("project_switches", 0) * 0.5 + project_count * 2))

    return [
        {"axis": "Planning", "score": round(planning_score), "detail": f"{len(plans)} plans created"},
        {"axis": "Tool Mastery", "score": round(tool_mastery), "detail": f"{unique_tools} tools, {tool_volume} calls"},
        {"axis": "Debugging", "score": round(debugging), "detail": f"{debug_tools} debug tool calls"},
        {"axis": "Architecture", "score": round(architecture), "detail": f"{project_count} projects designed"},
        {"axis": "Iteration", "score": round(iteration), "detail": f"{int(msgs_per_session)} msgs/session avg"},
        {"axis": "Multi-Project", "score": round(multi_project), "detail": f"{history.get('project_switches', 0)} context switches"},
    ]


def compute_piloting_style(stats, plans, jsonl_data):
    """Compute piloting style: Directive/Collaborative x Plan-first/Iterate."""
    total_messages = stats.get("totalMessages", 0)
    total_sessions = stats.get("totalSessions", 0)
    tool_counts = jsonl_data.get("tool_counts", Counter())

    # Directive vs Collaborative: based on tool call ratio
    edit_tools = tool_counts.get("Edit", 0) + tool_counts.get("Write", 0)
    read_tools = tool_counts.get("Read", 0) + tool_counts.get("Grep", 0) + tool_counts.get("Glob", 0)
    total_tools = sum(tool_counts.values()) or 1

    directive_score = min(100, int((edit_tools / total_tools) * 200)) if total_tools > 0 else 50
    collaborative_score = 100 - directive_score

    # Plan-first vs Iterate: based on plan usage relative to sessions
    # 72 plans / 528 sessions = ~14% plan rate. Scale so 20%+ = 80, cap at 85
    import math
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


def compute_mission_log(db_data, claude_mds):
    """Compute top projects as missions."""
    projects = db_data.get("projects", [])
    claude_md_map = {c["project"]: c for c in claude_mds}

    missions = []
    for proj in projects[:30]:
        cwd = proj["cwd"]
        project_name = os.path.basename(cwd) if cwd else "unknown"
        sessions = proj["sessions"]
        messages = proj["messages"]

        # Complexity score: logarithmic based on messages and sessions
        import math
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
        last_active = proj.get("last_active", 0)
        if last_active:
            last_dt = datetime.fromtimestamp(last_active / 1000)
            days_ago = (datetime.now() - last_dt).days
            if days_ago <= 7:
                status = "active"
            elif days_ago <= 30:
                status = "recent"
            else:
                status = "archived"
        else:
            status = "unknown"

        missions.append({
            "name": project_name,
            "sessions": sessions,
            "messages": messages,
            "complexity": complexity,
            "domain": domain,
            "technologies": techs[:8],
            "status": status,
            "firstActive": datetime.fromtimestamp(proj["first_active"] / 1000).strftime("%Y-%m-%d") if proj.get("first_active") else "",
            "lastActive": datetime.fromtimestamp(proj["last_active"] / 1000).strftime("%Y-%m-%d") if proj.get("last_active") else "",
        })

    missions.sort(key=lambda m: m["messages"], reverse=True)
    return missions[:20]


def compute_token_economy(stats):
    """Compute token usage and cost breakdown."""
    model_usage = stats.get("modelUsage", {})

    total_input = sum(m.get("inputTokens", 0) for m in model_usage.values())
    total_output = sum(m.get("outputTokens", 0) for m in model_usage.values())
    total_cache_read = sum(m.get("cacheReadInputTokens", 0) for m in model_usage.values())
    total_cache_create = sum(m.get("cacheCreationInputTokens", 0) for m in model_usage.values())
    total_cost = sum(m.get("costUSD", 0) for m in model_usage.values())
    web_searches = sum(m.get("webSearchRequests", 0) for m in model_usage.values())

    # Cache efficiency
    total_tokens = total_input + total_cache_read + total_cache_create
    cache_ratio = round(total_cache_read / max(1, total_tokens) * 100, 1)

    # Cost per session
    total_sessions = stats.get("totalSessions", 1)
    cost_per_session = round(total_cost / total_sessions, 2)

    # Daily cost trend
    daily_model = stats.get("dailyModelTokens", [])
    daily_costs = []
    for day in daily_model[-30:]:
        day_total = sum(day.get("tokensByModel", {}).values())
        daily_costs.append({
            "date": day["date"],
            "tokens": day_total,
        })

    return {
        "totalInputTokens": total_input,
        "totalOutputTokens": total_output,
        "totalCacheReadTokens": total_cache_read,
        "totalCacheCreateTokens": total_cache_create,
        "totalCostUSD": round(total_cost, 2),
        "cacheEfficiency": cache_ratio,
        "costPerSession": cost_per_session,
        "webSearches": web_searches,
        "dailyTokens": daily_costs,
    }


def compute_streaks(stats):
    """Compute current streak, longest streak, and peak day."""
    daily = stats.get("dailyActivity", [])
    if not daily:
        return {"current": 0, "longest": 0, "peakDay": "", "peakCount": 0}

    # Sort by date
    sorted_days = sorted(daily, key=lambda d: d["date"])
    active_dates = set(d["date"] for d in sorted_days if d.get("messageCount", 0) > 0)

    # Current streak (from most recent active day backwards)
    today = datetime.now().strftime("%Y-%m-%d")
    current_streak = 0
    check_date = datetime.now()
    while True:
        date_str = check_date.strftime("%Y-%m-%d")
        if date_str in active_dates:
            current_streak += 1
            check_date -= timedelta(days=1)
        else:
            # Allow one gap day (yesterday might not be active yet)
            if current_streak == 0:
                check_date -= timedelta(days=1)
                date_str2 = check_date.strftime("%Y-%m-%d")
                if date_str2 in active_dates:
                    current_streak += 1
                    check_date -= timedelta(days=1)
                    continue
            break

    # Longest streak
    longest = 0
    streak = 0
    prev_date = None
    for date_str in sorted(active_dates):
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        if prev_date and (dt - prev_date).days == 1:
            streak += 1
        else:
            streak = 1
        longest = max(longest, streak)
        prev_date = dt

    # Peak day
    peak_day = max(sorted_days, key=lambda d: d.get("messageCount", 0))

    # Peak week
    weekly_totals = defaultdict(int)
    for d in sorted_days:
        dt = datetime.strptime(d["date"], "%Y-%m-%d")
        week_start = (dt - timedelta(days=dt.weekday())).strftime("%Y-%m-%d")
        weekly_totals[week_start] += d.get("messageCount", 0)

    peak_week = max(weekly_totals.items(), key=lambda x: x[1]) if weekly_totals else ("", 0)

    return {
        "current": current_streak,
        "longest": longest,
        "peakDay": peak_day["date"],
        "peakDayCount": peak_day.get("messageCount", 0),
        "peakWeek": peak_week[0],
        "peakWeekCount": peak_week[1],
        "totalActiveDays": len(active_dates),
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
    args = parser.parse_args()

    print("AI Pilot License Data Pipeline", file=sys.stderr)
    print("=" * 40, file=sys.stderr)

    # Phase 1: Read all data sources
    print("Reading stats cache...", file=sys.stderr)
    stats = read_stats_cache(args.verbose)

    print("Reading JSONL session files...", file=sys.stderr)
    db_data = read_session_data(args.verbose)

    print("Reading plan files...", file=sys.stderr)
    plans = read_plan_files(args.verbose)

    print("Reading CLAUDE.md files...", file=sys.stderr)
    claude_mds = read_claude_md_files(args.verbose)

    print("Sampling JSONL files...", file=sys.stderr)
    jsonl_data = sample_jsonl_files(args.verbose, args.quick)

    print("Reading history...", file=sys.stderr)
    history = read_history_file(args.verbose)

    # Phase 2: Compute all sections
    print("Computing metrics...", file=sys.stderr)
    output = {
        "generated": datetime.now().isoformat(),
        "pipelineVersion": "1.0.0",
        "license": compute_license(stats, db_data),
        "typeRatings": compute_type_ratings(stats, db_data),
        "activityHeatmap": compute_activity_heatmap(stats),
        "hourlyDistribution": compute_hourly_distribution(stats),
        "instrumentRatings": compute_instrument_ratings(plans, claude_mds, jsonl_data),
        "competencyRadar": compute_competency_radar(stats, db_data, plans, jsonl_data, history),
        "pilotingStyle": compute_piloting_style(stats, plans, jsonl_data),
        "missionLog": compute_mission_log(db_data, claude_mds),
        "tokenEconomy": compute_token_economy(stats),
        "streaks": compute_streaks(stats),
        "skillsCloud": compute_skills_cloud(jsonl_data, claude_mds),
    }

    # Phase 3: Output
    json_str = json.dumps(output, indent=2)

    if args.dry_run:
        print(json_str)
    else:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(json_str)
        size_kb = len(json_str) / 1024
        print(f"\nWritten to {output_path} ({size_kb:.1f} KB)", file=sys.stderr)

    # Summary
    print(f"\nSummary:", file=sys.stderr)
    print(f"  License class: {output['license']['class']}", file=sys.stderr)
    print(f"  Sessions: {output['license']['totalSessions']}", file=sys.stderr)
    print(f"  Messages: {output['license']['totalMessages']}", file=sys.stderr)
    print(f"  Cost: ${output['license']['totalCostUSD']}", file=sys.stderr)
    print(f"  Projects: {len(output['missionLog'])}", file=sys.stderr)
    print(f"  Active days: {output['streaks']['totalActiveDays']}", file=sys.stderr)
    print(f"  Current streak: {output['streaks']['current']} days", file=sys.stderr)
    print(f"  Skills found: {len(output['skillsCloud'])}", file=sys.stderr)
    print(f"  Domain ratings: {len(output['instrumentRatings'])}", file=sys.stderr)


if __name__ == "__main__":
    main()
