#!/usr/bin/env python3
"""
Generate public/data/mcp-catalog.json for the /mcp page.

Two halves, from two live sources:

  1. MCP SERVERS. The Model Context Protocol endpoints actually run here. Each is
     probed with a real `tools/list` JSON-RPC call, so the tool list on the page
     is what the server answers with today, not what a doc said once.

  2. THE CAMPAIGN BRAIN SERVICE CATALOG. The REST fleet behind mcp.campaignbrain.dev.

WHY THIS WAS REWRITTEN (2026-08-29)
-----------------------------------
The previous version hardcoded the service list and fetched only the endpoint
COUNTS live. That gets the failure mode exactly backwards: a service could be
added to the fleet and never appear on the page, and nothing would look wrong,
because every service that WAS listed had a fresh, correct number beside it.

Measured when it was replaced, it was badly behind:

  * 44 services listed, 84 present in the unified spec
  * 275 endpoints claimed, 3,891 present
  * every URL still on the retired *.nominate.ai domain, now *.campaignbrain.dev

So the authority is inverted. The unified OpenAPI spec decides what exists and
how big it is. scripts/mcp-catalog-meta.json supplies only the human-readable
metadata (friendly name, category, auth, capabilities), because that is behind
cbauth and cannot be fetched unauthenticated. A service in the spec with no
metadata is reported as UNCATALOGUED rather than silently dropped: the page says
how many there are, which is the part that used to be invisible.

Usage:
  python3 scripts/generate-mcp-catalog.py [--verbose]
"""

import json
import sys
import urllib.error
import urllib.request
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
OUTPUT_FILE = PROJECT_ROOT / "public" / "data" / "mcp-catalog.json"
META_FILE = SCRIPT_DIR / "mcp-catalog-meta.json"

# One request for the whole fleet. Every path is prefixed with its service id
# (/cbai/..., /cbradio/...), which is what makes per-service counts possible
# without asking 84 hosts individually.
UNIFIED_SPEC = "https://mcp.campaignbrain.dev/openapi.json"

# The MCP endpoints themselves. `auth_expected` marks the ones that are supposed
# to refuse an unauthenticated probe, so a 401 from those is a PASS: the server
# answered, which is what is being tested. Treating it as an outage would put a
# red mark on a healthy server every night.
MCP_SERVERS = [
    {
        "id": "tinymachines",
        "name": "tinymachines",
        "url": "https://tinymachines.ai/api/mcp",
        "transport": "streamable HTTP",
        "auth": "None",
        "what": "The six pieces of the 6502 work, what each one is, and the licence position.",
        "auth_expected": False,
    },
    {
        "id": "6502",
        "name": "6502",
        "url": "https://6502.tinymachines.ai/api/mcp",
        "transport": "streamable HTTP",
        "auth": "None",
        "what": "Assemble, run and mint ROMs against a transistor-level 6502, and ask the die about any of its 1,725 nodes.",
        "auth_expected": False,
    },
    {
        "id": "junior",
        "name": "junior",
        "url": "https://junior.bradley.io/mcp",
        "transport": "streamable HTTP",
        "auth": "Bearer token",
        "what": "Home network management: the OpenWrt router, its dual WAN, and the fleet behind it.",
        "auth_expected": True,
    },
    {
        "id": "cbmcp",
        "name": "Campaign Brain catalog",
        "url": "https://mcp.campaignbrain.dev/sse",
        "transport": "SSE",
        "auth": "cbauth",
        "what": "Service discovery over the whole Campaign Brain fleet: search services, read endpoints, fetch OpenAPI specs.",
        # Gated at nginx, which answers 401 before the app sees the request, so
        # the probe gets HTML rather than JSON-RPC. Expected, not an outage.
        "auth_expected": True,
    },
]

VERBOSE = "--verbose" in sys.argv or "-v" in sys.argv
TIMEOUT = 20


def log(msg: str):
    if VERBOSE:
        print(f"  [{datetime.now().strftime('%H:%M:%S')}] {msg}")


def fetch_json(url: str, data: bytes | None = None, headers: dict | None = None):
    """GET or POST JSON. Returns (payload, error_string)."""
    req = urllib.request.Request(url, data=data, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
            body = r.read().decode("utf-8", "replace")
    except urllib.error.HTTPError as e:
        # An HTTP error still carries a body, and for a JSON-RPC endpoint that
        # body is the actual answer (e.g. an auth refusal). Read it.
        try:
            body = e.read().decode("utf-8", "replace")
        except Exception:
            return None, f"HTTP {e.code}"
        try:
            return json.loads(body), f"HTTP {e.code}"
        except json.JSONDecodeError:
            return None, f"HTTP {e.code}"
    except Exception as e:
        return None, str(e).split("\n")[0][:120]

    # An SSE endpoint answers a JSON-RPC POST with `data: {...}` frames.
    if body.lstrip().startswith("event:") or body.lstrip().startswith("data:"):
        for line in body.splitlines():
            if line.startswith("data:"):
                try:
                    return json.loads(line[5:].strip()), None
                except json.JSONDecodeError:
                    continue
        return None, "SSE frame carried no JSON"
    try:
        return json.loads(body), None
    except json.JSONDecodeError:
        return None, "response was not JSON"


def probe_mcp(server: dict) -> dict:
    """Ask an MCP server for its tool list."""
    payload = json.dumps(
        {"jsonrpc": "2.0", "id": 1, "method": "tools/list", "params": {}}
    ).encode()
    doc, err = fetch_json(
        server["url"],
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Accept": "application/json, text/event-stream",
        },
    )

    out = {k: v for k, v in server.items() if k != "auth_expected"}
    out["tools"] = []

    if doc is None:
        # A gate in front of the app (nginx auth_request, say) answers 401/403
        # with HTML, so there is no JSON to parse. Something is listening and it
        # refused us, which for an auth-gated server is the correct behaviour.
        gated = err and ("401" in err or "403" in err) and server.get("auth_expected")
        out["reachable"] = bool(gated)
        out["note"] = (
            "gated at the edge; tool list not enumerated" if gated else (err or "no response")
        )
        log(f"  {server['id']}: {'gated' if gated else 'unreachable'} ({out['note']})")
        return out

    if "error" in doc:
        # JSON-RPC says `error` is an object with a `message`, but not every
        # server obeys: cbmcp answers with a bare string. Accept both rather
        # than crashing the nightly pipeline on someone else's shape.
        err_obj = doc["error"]
        msg = str(
            err_obj.get("message", err_obj) if isinstance(err_obj, dict) else err_obj
        )[:120]
        # It answered. For a server that is meant to require a token, that is
        # the healthy outcome and the tool list is simply not ours to see.
        out["reachable"] = True
        out["note"] = (
            "requires a token; tool list not enumerated"
            if server.get("auth_expected")
            else f"responded with an error: {msg}"
        )
        log(f"  {server['id']}: responded, {out['note']}")
        return out

    tools = doc.get("result", {}).get("tools", []) or []
    out["reachable"] = True
    out["tools"] = [
        {"name": t.get("name", ""), "description": (t.get("description") or "").strip()}
        for t in tools
    ]
    log(f"  {server['id']}: {len(out['tools'])} tools")
    return out


def endpoint_counts() -> tuple[Counter, str | None]:
    """Operations per service id, from the unified spec."""
    log(f"fetching {UNIFIED_SPEC}")
    doc, err = fetch_json(UNIFIED_SPEC)
    if doc is None:
        return Counter(), err or "unreachable"
    counts: Counter = Counter()
    for path, ops in (doc.get("paths") or {}).items():
        service = path.strip("/").split("/")[0]
        if service:
            # Count only real HTTP operations; a path item also carries keys
            # like "parameters" and "summary" that are not endpoints.
            counts[service] += sum(
                1
                for k in ops
                if k.lower()
                in ("get", "post", "put", "patch", "delete", "head", "options")
            )
    log(f"  {len(counts)} services, {sum(counts.values())} operations")
    return counts, None


def main() -> int:
    meta = json.loads(META_FILE.read_text())
    cat_names: dict = meta["categories"]
    by_id = {s["id"]: s for s in meta["services"]}

    counts, spec_err = endpoint_counts()
    if spec_err:
        # Refuse rather than write a catalog whose numbers are all zero: that
        # would look exactly like a fleet that shrank overnight.
        print(f"✗ could not read the unified spec ({spec_err}). Refusing to write.")
        return 1

    log("probing MCP servers")
    servers = [probe_mcp(s) for s in MCP_SERVERS]

    categories = []
    for cid, cname in cat_names.items():
        services = []
        for s in meta["services"]:
            if s["category"] != cid:
                continue
            services.append(
                {
                    "id": s["id"],
                    "name": s["name"],
                    "url": s["url"],
                    "description": s["description"],
                    "auth": s["auth"],
                    "capabilities": s["capabilities"],
                    # 0 means the spec has no paths under this prefix, which is
                    # normal for a service that is a UI or is proxied elsewhere.
                    "endpointCount": counts.get(s["id"], 0),
                }
            )
        services.sort(key=lambda x: (-x["endpointCount"], x["name"]))
        categories.append({"id": cid, "name": cname, "services": services})

    # Present in the fleet, absent from the metadata. Named, not just counted,
    # so the gap is actionable: each one is a line to add to the meta file.
    uncatalogued = sorted(
        ({"id": sid, "endpointCount": n} for sid, n in counts.items() if sid not in by_id),
        key=lambda x: -x["endpointCount"],
    )

    catalogued_endpoints = sum(counts.get(s["id"], 0) for s in meta["services"])

    doc = {
        "generated": datetime.now(timezone.utc).isoformat(),
        "sources": {
            "unifiedSpec": UNIFIED_SPEC,
            "metadata": f"scripts/{META_FILE.name} (pulled {meta.get('_pulled', 'unknown')})",
        },
        "stats": {
            "totalServices": len(by_id),
            "totalEndpoints": catalogued_endpoints,
            "totalCategories": len(categories),
            "mcpServers": len(servers),
            "mcpServersReachable": sum(1 for s in servers if s.get("reachable")),
            # The honest denominators.
            "fleetServices": len(counts),
            "fleetEndpoints": sum(counts.values()),
            "uncataloguedServices": len(uncatalogued),
        },
        "mcpServers": servers,
        "categories": categories,
        "uncatalogued": uncatalogued,
    }

    OUTPUT_FILE.write_text(json.dumps(doc, indent=2) + "\n")

    st = doc["stats"]
    print(f"✓ {OUTPUT_FILE.relative_to(PROJECT_ROOT)}")
    print(
        f"  MCP servers:  {st['mcpServersReachable']}/{st['mcpServers']} reachable, "
        f"{sum(len(s['tools']) for s in servers)} tools enumerated"
    )
    print(
        f"  Catalog:      {st['totalServices']} services, "
        f"{st['totalEndpoints']} endpoints, {st['totalCategories']} categories"
    )
    print(
        f"  Whole fleet:  {st['fleetServices']} services, {st['fleetEndpoints']} endpoints"
    )
    if uncatalogued:
        names = ", ".join(u["id"] for u in uncatalogued[:8])
        more = f" (+{len(uncatalogued) - 8} more)" if len(uncatalogued) > 8 else ""
        print(f"  Uncatalogued: {len(uncatalogued)} in the spec with no metadata: {names}{more}")
        print(f"                add them to scripts/{META_FILE.name} to surface them")
    return 0


if __name__ == "__main__":
    sys.exit(main())
