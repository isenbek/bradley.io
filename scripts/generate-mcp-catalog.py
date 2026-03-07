#!/usr/bin/env python3
"""
Generate MCP catalog JSON from Campaign Brain service OpenAPI specs.

Fetches service details from each service's /openapi.json endpoint and writes
public/data/mcp-catalog.json for the /mcp showcase page.

Usage:
  python3 scripts/generate-mcp-catalog.py [--verbose]
"""

import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_FILE = PROJECT_ROOT / "public" / "data" / "mcp-catalog.json"

VERBOSE = "--verbose" in sys.argv or "-v" in sys.argv


def log(msg: str):
    if VERBOSE:
        print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}")


# Each service: (id, name, base_url, description, auth, capabilities)
SERVICES = {
    "ai": {
        "name": "AI & Intelligence",
        "services": [
            ("cbai", "AI API", "https://ai.nominate.ai",
             "Unified AI provider — Claude, Ollama, Mistral. Chat completions, embeddings, OCR, summarization, topic extraction.",
             "Optional API key", ["chat", "embeddings", "ocr", "summarization", "topics", "tool-use", "streaming"]),
            ("cbintel", "Intelligence API", "https://intel.nominate.ai",
             "Web crawling, screenshot capture, transcript generation, and intelligence gathering with vector search.",
             "X-API-Key", ["crawl", "screenshot", "transcript", "vector-search", "jobs"]),
            ("cbscout", "Agent Memory", "https://scout.nominate.ai",
             "Hierarchical memory for AI agents. Three layers: Resources (raw) → Items (facts) → Categories (summaries). Temporal awareness with decay.",
             "X-Campaign-ID header", ["memory-store", "memory-retrieve", "entity-profiles", "temporal-decay", "consolidation"]),
            ("cbindex", "Document Index", "https://index.nominate.ai",
             "Vectorless RAG document indexing using PageIndex. PDF/markdown indexing, YouTube transcripts, LLM-powered document chat.",
             "X-API-Key", ["index-pdf", "index-markdown", "ocr", "youtube-transcript", "rag-chat", "workspaces"]),
            ("cbunstruct", "Document Partitioning", "https://unstruct.nominate.ai",
             "Document parsing and element extraction via Unstructured library. PDF, DOCX, images, email, markdown.",
             "None", ["partition", "pdf", "docx", "images", "email"]),
            ("cbcomfy", "Generative AI Proxy", "https://comfy.nominate.ai",
             "Thin FastAPI proxy for ComfyUI generative AI backend. Health checks, GPU status, sprite generation, output management.",
             "None (PIN gate via cbauth)", ["image-generation", "comfyui", "gpu", "sprites"]),
            ("cbtts", "Text-to-Speech", "https://tts.nominate.ai",
             "Real-time neural text-to-speech powered by VibeVoice. Multiple voice presets, streaming PCM16, complete WAV generation.",
             "None", ["tts", "speech-synthesis", "audio", "streaming", "wav"]),
        ],
    },
    "data": {
        "name": "Data & Analytics",
        "services": [
            ("cbetl", "Contact Data ETL", "https://etl.nominate.ai",
             "Contact data processing ETL. Address normalization and parsing via libpostal, batch processing, deduplication hashes.",
             "None (PIN gate via cbauth)", ["etl", "address-normalization", "address-parsing", "batch-processing", "deduplication", "mcp-tools"]),
            ("cbdistricts", "Congressional Districts", "https://districts.nominate.ai",
             "119th Congress, 441 districts. Demographics, GeoJSON boundaries, radio coverage, state data.",
             "None (public)", ["districts", "demographics", "geojson", "states", "radio-coverage", "intersections"]),
            ("cbmodels", "Voter Analysis", "https://models.nominate.ai",
             "AI-powered voter segment analysis. Demographics vs baseline, behavioral enrichment, affinity scoring, donor propensity.",
             "X-API-Key", ["segment-analysis", "behavioral-enrichment", "affinity-scoring", "donor-propensity", "baseline-stats"]),
            ("cbsurveys", "Survey Platform (YASP)", "https://surveys.nominate.ai",
             "Create surveys, manage questions, collect and analyze responses.",
             "X-API-Key", ["surveys", "questions", "responses", "publish"]),
            ("cbfiles", "File Storage & CDN", "https://files.nominate.ai",
             "S3-compatible object storage via MinIO. Buckets, upload/download, presigned URLs, public CDN.",
             "X-API-Key", ["buckets", "upload", "download", "presigned-urls", "cdn"]),
            ("cbmaps", "City Map Posters", "https://maps.nominate.ai",
             "Minimalist city map poster generation from OpenStreetMap. Vector, raster, and district render modes, 17 themes, 300 DPI PNG output.",
             "None (PIN gate via cbauth)", ["map-generation", "poster", "openstreetmap", "geocoding", "cartography", "themes", "mcp-tools"]),
            ("cbtiles", "Map Tile Cache", "https://tiles.nominate.ai",
             "CartoDB tile caching proxy with look-ahead prefetching. 9 basemap styles for CB mapping apps.",
             "None (PIN gate via cbauth)", ["tiles", "map-tiles", "caching", "cartodb", "basemap", "prefetch", "mcp-tools"]),
            ("cbuserguide", "User Guide Generator", "https://userguide.nominate.ai",
             "Automated documentation generation for CB apps. Playwright-based crawling, screenshot capture, markdown generation.",
             "None (PIN gate via cbauth)", ["documentation", "screenshots", "playwright", "crawling", "markdown", "user-guide", "mcp-tools"]),
            ("cbgeo", "Geocoding Service", "https://geo.nominate.ai",
             "Geocoding service using Nominatim with OpenStreetMap data. Forward geocoding, reverse geocoding, and OSM object lookup.",
             "None (PIN gate via cbauth)", ["geocoding", "reverse-geocoding", "address-lookup", "coordinates", "osm", "mcp-tools"]),
            ("cbiterable", "Iterable API Wrapper", "https://iterable.nominate.ai",
             "Multi-tenant Iterable API wrapper with local DuckDB sync. Email marketing projects, contacts, campaigns, lists.",
             "None (PIN gate via cbauth)", ["iterable", "email-marketing", "contacts", "campaigns", "lists", "templates", "sync", "duckdb"]),
            ("cbairtable", "Airtable API Wrapper", "https://airtable.nominate.ai",
             "Multi-tenant Airtable API wrapper with local DuckDB sync. Proxies CRUD operations, syncs bases/tables for fast SQL querying.",
             "None (PIN gate via cbauth)", ["airtable", "bases", "tables", "records", "sync", "duckdb", "sql-query"]),
        ],
    },
    "communication": {
        "name": "Communication",
        "services": [
            ("cbsms", "SMS/MMS Gateway", "https://sms.nominate.ai",
             "Unified SMS/MMS gateway for Ejoin devices. Single send, bulk send, device management.",
             "Webhook secret", ["sms-send", "mms-send", "bulk-sms", "device-control", "delivery-reports"]),
            ("cbsocial", "WhatsApp Ingestion", "https://social.nominate.ai",
             "WhatsApp message ingestion via Node.js relay. Message processing pipeline, AI gist generation.",
             "None", ["whatsapp-messages", "message-processing", "ai-gists"]),
            ("cbwebhook", "Webhook Router", "https://webhook.nominate.ai",
             "Centralized webhook ingestion (Typeform, GitHub, Stripe). HMAC verification, async persistence, consumer-scoped access.",
             "X-API-Key / X-Admin-Key", ["typeform-webhooks", "event-storage", "form-responses", "consumer-management"]),
            ("cbfront", "Front Email Proxy", "https://front.nominate.ai",
             "Front App email integration — inboxes, conversations, messages, drafts, contacts, tags, canned responses, teammates, analytics.",
             "X-API-Key", ["email", "conversations", "messages", "drafts", "contacts", "tags", "templates", "analytics", "mcp-tools"]),
            ("cblinks", "URL Shortener", "https://links.nominate.ai",
             "Short links with privacy-preserving click analytics. Custom/auto slugs, expiry, enable/disable.",
             "X-API-Key", ["short-links", "click-analytics", "custom-slugs", "link-expiry"]),
            ("cbemail", "Headless Email Client", "https://email.nominate.ai",
             "Headless email client API for IMAP/SMTP mailbox management. Session-based access, folder management, message CRUD, send/batch-send.",
             "X-API-Key", ["imap", "smtp", "email-send", "email-read", "mailbox", "batch-send", "mcp-tools"]),
        ],
    },
    "infrastructure": {
        "name": "Infrastructure",
        "services": [
            ("cbinfra", "Infrastructure Manager", "https://infra.nominate.ai",
             "Infrastructure inventory, GitHub issues, project bootstrap, config management (nginx, systemd, DNS, certs), AI orchestration, deployment.",
             "None (PIN gate via cbauth)", ["inventory", "github-issues", "bootstrap", "config", "nginx", "systemd", "dns", "deploy", "mcp-tools"]),
            ("cbvpn", "Network Inventory", "https://network.nominate.ai",
             "Fleet management for OpenWRT router/VPN/Tor network. Inventory, topology, fleet status, device snapshots.",
             "None (internal)", ["fleet-status", "inventory", "topology", "device-snapshots"]),
            ("cbtor", "TOR Cluster", "https://tor.nominate.ai",
             "Anonymous web fetching through Tor worker pool. Load balancing: round_robin, sticky, random, least_connections.",
             "X-API-Key", ["anonymous-fetch", "tor-workers", "load-balancing"]),
            ("cbauth", "Authentication Platform", "https://auth.nominate.ai",
             "Domain-wide PIN authentication gateway for nominate.ai subdomains. HMAC-SHA256, 7-day sessions.",
             "Session cookie", ["pin-auth", "session-management", "nginx-auth-request"]),
            ("cboverseer", "System Monitor", "https://overseer.nominate.ai",
             "Central monitoring, 8 agents, incident management, SMS alerts, AI diagnosis, self-healing.",
             "X-API-Key", ["telemetry", "real-time-metrics", "incidents", "monitoring-agents", "sms-alerts", "dependency-map"]),
            ("cblogs", "Log Query & Analysis", "https://logs.nominate.ai",
             "Read-only log querying and analysis across DC0. 8 log groups, syslog analysis, nginx access/error logs, CB service journals.",
             "None (PIN gate via cbauth)", ["log-query", "log-analysis", "system-logs", "service-logs", "nginx-logs", "syslog-analysis", "mcp-tools"]),
            ("cbmcp", "MCP Service Catalog", "https://mcp.nominate.ai",
             "MCP server exposing the CB service catalog to LLM agents. SSE transport for remote clients, Inspector UI for humans.",
             "None (PIN gate via cbauth)", ["service-discovery", "endpoint-search", "openapi-specs", "mcp-tools", "mcp-resources"]),
            ("cbcron", "Scheduled Task Engine", "https://cron.nominate.ai",
             "Configurable scheduled task engine. Cron-based HTTP dispatch with retry logic, overlap protection, run history, timezone support.",
             "X-API-Key", ["cron-scheduling", "http-dispatch", "job-management", "retry-logic", "run-history", "mcp-tools"]),
            ("cbdocs", "Documentation Site", "https://docs.nominate.ai",
             "MkDocs Material documentation hub for the Campaign Brain platform. Architecture guides, service docs, API catalog.",
             "None (PIN gate via cbauth)", ["documentation", "architecture", "api-reference", "guides", "changelog"]),
            ("cbmesh", "API Mesh Gateway", "https://mesh.nominate.ai",
             "WebSocket gateway for the API Mesh network. Service discovery, cluster health, request proxying across all registered CB services.",
             "None", ["service-mesh", "service-discovery", "request-proxy", "websocket", "cluster-health"]),
            ("cbos", "Claude Code Session Manager", "https://os.nominate.ai",
             "Claude Code operating system — manage interactive Claude sessions, stash/apply context, AI-powered task routing and prioritization.",
             "None (PIN gate via cbauth)", ["claude-sessions", "session-management", "stash", "task-routing", "intelligence", "mcp-tools"]),
            ("cbrouter", "OpenWRT Router Manager", "https://router.nominate.ai",
             "MCP/API frontend for OpenWRT router management. UCI config CRUD with rollback, network/firewall/wireless monitoring, VPN rotation.",
             "None (PIN gate via cbauth)", ["openwrt", "uci-config", "network-monitoring", "firewall", "wireless", "vpn", "packages", "mcp-tools"]),
        ],
    },
    "business": {
        "name": "Business",
        "services": [
            ("cbapp", "Campaign Management Platform", "https://app.nominate.ai",
             "Core campaign management platform. Person/contact CRM, events, campaigns, surveys, walk lists, turf management, voter data, canvass forms.",
             "JWT (POST /api/auth/login)", ["persons", "contacts", "events", "campaigns", "surveys", "walk-lists", "turf", "voter-data", "canvass", "analytics"]),
            ("cbproject", "Project Management", "https://project.nominate.ai",
             "Project management and task tracking. Timeline views, kanban boards, resource allocation, milestones.",
             "None (PIN gate via cbauth)", ["projects", "tasks", "milestones", "kanban", "timeline"]),
            ("cbradio", "Rural AM/FM Rate Ingestion", "https://radio.nominate.ai",
             "Radio station political advertising rates for AI-powered media buying. 2,000+ stations, rate cards with OCR extraction, proposals, FCC data, Nielsen ratings.",
             "JWT (POST /api/auth/token)", ["stations", "rate-cards", "rates", "proposals", "radio-buys", "fcc-data", "nielsen-ratings", "geo-coverage", "ocr", "mcp-tools"]),
            ("cbmobile", "Mobile Canvassing", "https://mobile.nominate.ai",
             "Progressive Web App for door-knocking and canvassing. Offline-first with RxDB sync, DuckDB analytics, offline maps.",
             "None (PIN gate via cbauth)", ["contacts", "canvassing", "offline-sync", "mobile-pwa", "maps", "websocket", "mcp-tools"]),
            ("cbworkflow", "Workflow Engine", "https://workflow.nominate.ai",
             "Lightweight JSON-backed CRM workflow automation. Contacts, templates, instances, multi-tenant, SMS/email routing.",
             "None", ["contacts", "workflow-templates", "workflow-instances", "tenants", "sms-routing", "email-routing"]),
            ("cbpayments", "Donation Processing", "https://payments.nominate.ai",
             "Campaign donation processing (Transaxt migration). Authorize.Net CIM, 4 portals, 595K donations.",
             "Mixed (API key / JWT / public)", ["donations", "campaigns", "donors", "reporting", "merchant-accounts"]),
            ("cbpulse", "Hospitality BI (VIP)", "https://pulse.nominate.ai",
             "Virgin Islands Pulse — hospitality portfolio BI. Clover POS, Homebase, Cloudbeds, WebRezPro integration.",
             "JWT Bearer", ["auth", "businesses", "alerts", "financials", "occupancy", "daily-summaries"]),
            ("cbissues", "Issue Tracking", "https://issues.nominate.ai",
             "Unified GitHub issue management across CB repositories. Full CRUD, comments, project boards.",
             "X-API-Key", ["issues-crud", "comments", "labels", "project-boards", "multi-repo"]),
        ],
    },
}


def count_endpoints(base_url: str) -> int | None:
    """Try to fetch endpoint count from OpenAPI spec."""
    try:
        url = f"{base_url}/openapi.json"
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=5) as resp:
            spec = json.loads(resp.read())
            paths = spec.get("paths", {})
            count = sum(len(methods) for methods in paths.values())
            log(f"  {base_url}: {count} endpoints from OpenAPI")
            return count
    except Exception as e:
        log(f"  {base_url}: OpenAPI fetch failed ({e})")
        return None


def main():
    print("Generating MCP catalog...")

    total_endpoints = 0
    total_services = 0
    categories_out = []

    for cat_id, cat_def in SERVICES.items():
        services_out = []
        for sid, name, url, desc, auth, caps in cat_def["services"]:
            # Try to get live endpoint count, fall back to capabilities length
            live_count = count_endpoints(url)
            endpoint_count = live_count if live_count is not None else len(caps)

            services_out.append({
                "id": sid,
                "name": name,
                "url": url,
                "description": desc,
                "auth": auth,
                "capabilities": caps,
                "endpointCount": endpoint_count,
            })
            total_endpoints += endpoint_count
            total_services += 1
            log(f"Added {sid} ({name})")

        categories_out.append({
            "id": cat_id,
            "name": cat_def["name"],
            "services": services_out,
        })

    catalog = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "totalServices": total_services,
            "totalEndpoints": total_endpoints,
            "totalCategories": len(SERVICES),
        },
        "categories": categories_out,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(catalog, indent=2))
    print(f"Wrote {OUTPUT_FILE}")
    print(f"  {total_services} services, {total_endpoints} endpoints, {len(SERVICES)} categories")


if __name__ == "__main__":
    main()
