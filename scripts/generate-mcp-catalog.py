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
        ],
    },
    "data": {
        "name": "Data & Analytics",
        "services": [
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
            ("cblinks", "URL Shortener", "https://links.nominate.ai",
             "Short links with privacy-preserving click analytics. Custom/auto slugs, expiry, enable/disable.",
             "X-API-Key", ["short-links", "click-analytics", "custom-slugs", "link-expiry"]),
        ],
    },
    "infrastructure": {
        "name": "Infrastructure",
        "services": [
            ("cbvpn", "VPN Cluster", "https://network.nominate.ai",
             "Distributed VPN cluster with OpenWRT workers and WireGuard tunnels. Geographic routing for intelligence.",
             "X-API-Key", ["vpn-banks", "worker-management", "geographic-routing", "cluster-deploy", "health-check"]),
            ("cbtor", "TOR Cluster", "https://tor.nominate.ai",
             "Anonymous web fetching through Tor worker pool. Load balancing: round_robin, sticky, random, least_connections.",
             "X-API-Key", ["anonymous-fetch", "tor-workers", "load-balancing"]),
            ("cbauth", "PIN Gate Authentication", "https://auth.nominate.ai",
             "Domain-wide PIN authentication gateway for nominate.ai subdomains. HMAC-SHA256, 7-day sessions.",
             "Session cookie", ["pin-auth", "session-management", "nginx-auth-request"]),
            ("cboverseer", "System Monitor", "https://overseer.nominate.ai",
             "Central monitoring, 8 agents, incident management, SMS alerts, AI diagnosis, self-healing.",
             "X-API-Key", ["telemetry", "real-time-metrics", "incidents", "monitoring-agents", "sms-alerts", "dependency-map"]),
            ("cbmcp", "MCP Service Catalog", "https://mcp.nominate.ai",
             "MCP server exposing the CB service catalog to LLM agents. SSE transport for remote clients, Inspector UI for humans.",
             "None (PIN gate via cbauth)", ["service-discovery", "endpoint-search", "openapi-specs", "mcp-tools", "mcp-resources"]),
        ],
    },
    "business": {
        "name": "Business",
        "services": [
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
