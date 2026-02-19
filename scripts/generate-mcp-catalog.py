#!/usr/bin/env python3
"""
Generate MCP catalog JSON from Campaign Brain service catalog.

Fetches service details from https://mcp.nominate.ai and writes
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

MCP_BASE_URL = "https://mcp.nominate.ai"
VERBOSE = "--verbose" in sys.argv or "-v" in sys.argv

# Category definitions matching the CB catalog
CATEGORIES = [
    {"id": "ai", "name": "AI & Intelligence", "service_ids": ["cbai", "cbintel", "cbscout", "cbindex", "cbunstruct"]},
    {"id": "data", "name": "Data & Analytics", "service_ids": ["cbdistricts", "cbmodels", "cbsurveys", "cbfiles"]},
    {"id": "communication", "name": "Communication", "service_ids": ["cbsms", "cbsocial", "cbwebhook", "cblinks"]},
    {"id": "infrastructure", "name": "Infrastructure", "service_ids": ["cbvpn", "cbtor", "cbauth", "cboverseer", "cbmcp"]},
    {"id": "business", "name": "Business", "service_ids": ["cbworkflow", "cbpayments", "cbpulse", "cbissues"]},
]


def log(msg: str):
    if VERBOSE:
        print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}")


def fetch_service_detail(service_id: str) -> dict | None:
    """Fetch service detail from the MCP catalog API."""
    try:
        url = f"{MCP_BASE_URL}/api/services/{service_id}"
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read())
            log(f"Fetched {service_id}: {data.get('name', 'unknown')}")
            return data
    except Exception as e:
        log(f"Failed to fetch {service_id}: {e}")
        return None


def main():
    print("Generating MCP catalog...")

    total_endpoints = 0
    total_services = 0
    categories_out = []

    for cat_def in CATEGORIES:
        services_out = []
        for sid in cat_def["service_ids"]:
            detail = fetch_service_detail(sid)
            if detail:
                service = {
                    "id": detail.get("id", sid),
                    "name": detail.get("name", sid),
                    "url": detail.get("url", ""),
                    "description": detail.get("description", ""),
                    "auth": detail.get("auth", "None"),
                    "capabilities": detail.get("capabilities", []),
                    "endpointCount": detail.get("endpoint_count", 0),
                }
                services_out.append(service)
                total_endpoints += service["endpointCount"]
                total_services += 1
            else:
                log(f"Skipping {sid} (fetch failed)")

        categories_out.append({
            "id": cat_def["id"],
            "name": cat_def["name"],
            "services": services_out,
        })

    catalog = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "stats": {
            "totalServices": total_services,
            "totalEndpoints": total_endpoints,
            "totalCategories": len(CATEGORIES),
        },
        "categories": categories_out,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(catalog, indent=2))
    print(f"Wrote {OUTPUT_FILE}")
    print(f"  {total_services} services, {total_endpoints} endpoints, {len(CATEGORIES)} categories")


if __name__ == "__main__":
    main()
