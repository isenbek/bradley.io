#!/usr/bin/env python3
"""Visitors collector — the aggregation layer behind bradley.io/visitors.

Fuses three tiers of "who knocked" into one atomic snapshot:

  1. EDGE      spydr (OpenWrt) banIP counters — dropped before reaching the
               server at all. Read via `ssh root@spydr.local banip-blocked`,
               which is a pure nft counter readout: no syslog churn, no CPU
               cost. Packet drop-logging (`ban_logprerouting`) is deliberately
               NOT used — it pegged the EA7500 to 1-2s RTT in July 2026, and
               threat-feed drops are counted rather than logged anyway.
  2. TRAPPED   nginx scanner.log — the scanner-trap snippet 444s every
               .php/wp-*/.env/.git probe and logs it here.
  3. SERVED    nginx bradley.io.access.log — everything that got a real
               response, split into bots (by user-agent) and humans.

PRIVACY POSTURE (deliberate, see the page copy):
  - Humans are coarsened. Their IP never leaves this process: only a /24
    network label, city/region/country, and ASN are emitted.
  - Scanners and edge-dropped hosts are emitted at full IP. They are
    unsolicited automated traffic, not visitors.

Writes /var/lib/bradley-cam/visitors.json atomically for /api/visitors.
"""
import gzip
import json
import os
import re
import socket
import subprocess
import sys
import time
from collections import defaultdict
from datetime import datetime, timedelta, timezone

LOG_DIR = os.environ.get("VISITORS_LOG_DIR", "/var/log/nginx")
ACCESS_STEM = os.environ.get("VISITORS_ACCESS_STEM", "bradley.io.access.log")
SCANNER_STEM = os.environ.get("VISITORS_SCANNER_STEM", "scanner.log")
OUT_DIR = os.environ.get("CAM_CACHE_DIR", "/var/lib/bradley-cam")
OUT = os.path.join(OUT_DIR, "visitors.json")
GEO_DIR = os.environ.get("GEOIP_DIR", "/var/lib/GeoIP")
EDGE_HOST = os.environ.get("VISITORS_EDGE_HOST", "root@spydr.local")
# A dedicated key whose authorized_keys entry is pinned to
# command="/usr/bin/banip-blocked" — the collector cannot do anything else on
# the router even if this host is compromised. IdentitiesOnly + IdentityAgent
# =none matter: without them ssh offers the admin agent key first and the
# forced command never applies.
EDGE_KEY = os.environ.get(
    "VISITORS_EDGE_KEY", os.path.expanduser("~/.ssh/id_visitors_collector")
)

WINDOW_DAYS = int(os.environ.get("VISITORS_WINDOW_DAYS", "30"))
SESSION_GAP = 30 * 60          # seconds of silence that ends a session
TOP_N = 40

# Hosts that are us, not visitors. Kept out of the public counts so the
# numbers mean something; still tallied separately as `self`.
SELF_NETS = ("192.168.", "10.8.", "10.9.", "13.0.0.", "17.0.0.", "127.")

BOT_RE = re.compile(
    r"bot|crawl|spider|slurp|scrap|curl|wget|python-requests|python-urllib|go-http|"
    r"okhttp|java/|libwww|headless|phantomjs|puppeteer|playwright|monitor|uptime|"
    r"pingdom|statuscake|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|dataforseo|"
    r"gptbot|claudebot|anthropic|perplexity|ccbot|applebot|facebookexternalhit|"
    r"embedly|preview|feedfetcher|zgrab|masscan|nmap|censys|expanse|internet-measurement|"
    # Google ships several agents with no "bot" token at all.
    r"googleother|google-|lighthouse|chrome-privacy|feedburner|apis-google",
    re.I,
)
# Networks that are crawler infrastructure, not people. AS15169 is Google's own
# backbone (Googlebot et al) — some of its agents claim to be plain mobile
# Chrome with no bot token, so the user-agent alone is not enough. Deliberately
# NOT listing cloud ASNs like Hetzner/OVH here: those carry real VPN users.
BOT_ASNS = {15169}

# Non-browser assets we don't want inflating "pageviews".
ASSET_RE = re.compile(r"\.(?:webp|png|jpe?g|svg|ico|css|js|woff2?|map|txt|xml|json)(?:$|\?)", re.I)

LINE_RE = re.compile(
    r'^(?P<ip>\S+) \S+ \S+ \[(?P<ts>[^\]]+)\] "(?P<req>[^"]*)" '
    r'(?P<status>\d{3}) (?P<bytes>\S+) "(?P<ref>[^"]*)" "(?P<ua>[^"]*)"'
)


# ----------------------------------------------------------------- geo ----
class Geo:
    """GeoLite2 lookups with a per-IP memo. Degrades to empty if unavailable."""

    def __init__(self):
        self.city = self.asn = None
        self.memo = {}
        try:
            import maxminddb

            self.city = maxminddb.open_database(os.path.join(GEO_DIR, "GeoLite2-City.mmdb"))
            self.asn = maxminddb.open_database(os.path.join(GEO_DIR, "GeoLite2-ASN.mmdb"))
        except Exception as e:  # noqa: BLE001 — geo is optional, never fatal
            print(f"geo: unavailable ({e})", file=sys.stderr)

    def get(self, ip):
        if ip in self.memo:
            return self.memo[ip]
        out = {
            "city": None, "region": None, "country": None, "cc": None,
            "lat": None, "lon": None, "asn": None, "org": None,
        }
        if self.city:
            try:
                r = self.city.get(ip) or {}
                names = lambda d: (d or {}).get("names", {}).get("en")  # noqa: E731
                out["city"] = names(r.get("city"))
                subs = r.get("subdivisions") or []
                out["region"] = names(subs[0]) if subs else None
                out["country"] = names(r.get("country"))
                out["cc"] = (r.get("country") or {}).get("iso_code")
                loc = r.get("location") or {}
                out["lat"], out["lon"] = loc.get("latitude"), loc.get("longitude")
            except Exception:  # noqa: BLE001
                pass
        if self.asn:
            try:
                a = self.asn.get(ip) or {}
                out["asn"] = a.get("autonomous_system_number")
                out["org"] = a.get("autonomous_system_organization")
            except Exception:  # noqa: BLE001
                pass
        self.memo[ip] = out
        return out


def net24(ip):
    """Coarsen a v4 address to its /24; v6 to its /48. Humans only ever
    surface at this resolution."""
    if ":" in ip:
        return ":".join(ip.split(":")[:3]) + "::/48"
    parts = ip.split(".")
    return ".".join(parts[:3]) + ".0/24" if len(parts) == 4 else ip


def is_self(ip):
    return any(ip.startswith(p) for p in SELF_NETS)


# --------------------------------------------------------------- parsing ---
def log_files(stem, days):
    """Current file plus enough rotations to cover the window, newest first."""
    out = [os.path.join(LOG_DIR, stem)]
    for i in range(1, days + 2):
        for cand in (f"{stem}.{i}", f"{stem}.{i}.gz"):
            p = os.path.join(LOG_DIR, cand)
            if os.path.exists(p):
                out.append(p)
    return out


def read_lines(path):
    op = gzip.open if path.endswith(".gz") else open
    try:
        with op(path, "rt", errors="replace") as fh:
            for line in fh:
                yield line
    except OSError as e:
        print(f"skip {path}: {e}", file=sys.stderr)


def parse_ts(s):
    # 12/Aug/2026:18:03:49 -0400
    try:
        return datetime.strptime(s, "%d/%b/%Y:%H:%M:%S %z")
    except ValueError:
        return None


def scan(stem, cutoff, on_row):
    """Walk a log family newest-first, stopping once a whole file predates the
    window. Returns (rows_seen, files_touched)."""
    rows = files = 0
    for path in log_files(stem, WINDOW_DAYS):
        if not os.path.exists(path):
            continue
        newest_in_file = None
        used = 0
        for line in read_lines(path):
            m = LINE_RE.match(line)
            if not m:
                continue
            ts = parse_ts(m.group("ts"))
            if ts is None:
                continue
            if newest_in_file is None or ts > newest_in_file:
                newest_in_file = ts
            if ts < cutoff:
                continue
            on_row(m, ts)
            used += 1
        rows += used
        files += 1
        # Rotations are ordered; once a file's newest entry is behind the
        # window there is nothing older worth opening.
        if newest_in_file is not None and newest_in_file < cutoff:
            break
    return rows, files


# ------------------------------------------------------------------ edge ---
def read_edge():
    """banIP counter readout off spydr. Never fatal — the page shows the tier
    as unreachable rather than inventing numbers."""
    out = {"ok": False, "error": None, "feeds": [], "flood": [],
           "blocklistIps": None, "sets": None, "allowNets": None, "host": EDGE_HOST}
    try:
        res = subprocess.run(
            ["ssh", "-o", "BatchMode=yes", "-o", "ConnectTimeout=8",
             "-o", "StrictHostKeyChecking=accept-new",
             "-o", "IdentitiesOnly=yes", "-o", "IdentityAgent=none",
             "-i", EDGE_KEY, EDGE_HOST, "banip-blocked"],
            capture_output=True, text=True, timeout=45,
        )
        if res.returncode != 0:
            out["error"] = (res.stderr or "ssh failed").strip()[:200]
            return out
        section = None
        for line in res.stdout.splitlines():
            s = line.strip()
            if s.startswith("blocklist:"):
                m = re.search(r"(\d+)\s+IPs across\s+(\d+)\s+sets", s)
                if m:
                    out["blocklistIps"], out["sets"] = int(m.group(1)), int(m.group(2))
            elif s.startswith("allowlisted nets:"):
                m = re.search(r"(\d+)", s)
                if m:
                    out["allowNets"] = int(m.group(1))
            elif "threat-feed drops" in s:
                section = "feeds"
            elif "flood-limiter drops" in s:
                section = "flood"
            elif section:
                m = re.match(r"([\w.\-]+)\s+(\d+)\s+pkts", s)
                if m:
                    out[section].append({"name": m.group(1), "pkts": int(m.group(2))})
        out["ok"] = out["blocklistIps"] is not None
    except Exception as e:  # noqa: BLE001
        out["error"] = str(e)[:200]
    return out


# ------------------------------------------------------------------ main ---
def main():
    t0 = time.time()
    geo = Geo()
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=WINDOW_DAYS)

    # --- served traffic -------------------------------------------------
    sessions = defaultdict(list)          # (ip, ua) -> [ts...]
    key_net = {}                          # (ip, ua) -> /24, to attribute sessions to a place
    human_ips, bot_ips, self_hits = set(), set(), 0
    pageviews = bot_hits = 0
    day = defaultdict(lambda: {"humans": 0, "bots": 0})
    hour = [0] * 24
    paths = defaultdict(int)
    refs = defaultdict(int)
    place = {}                            # net24 -> aggregate
    countries = defaultdict(int)
    asns = defaultdict(lambda: {"sessions": 0, "org": None})
    statuses = defaultdict(int)

    def on_access(m, ts):
        nonlocal pageviews, bot_hits, self_hits
        ip, ua = m.group("ip"), m.group("ua")
        if is_self(ip):
            self_hits += 1
            return
        g = geo.get(ip)
        bot = bool(BOT_RE.search(ua)) or ua in ("-", "") or g["asn"] in BOT_ASNS
        req = m.group("req").split(" ")
        path = req[1] if len(req) > 1 else "-"
        d = ts.astimezone(timezone.utc).strftime("%Y-%m-%d")
        if bot:
            bot_ips.add(ip)
            bot_hits += 1
            day[d]["bots"] += 1
            return

        human_ips.add(ip)
        day[d]["humans"] += 1
        hour[ts.astimezone(timezone.utc).hour] += 1
        statuses[m.group("status")] += 1
        sessions[(ip, ua)].append(ts.timestamp())
        # A "read" is a real page: assets and polled API endpoints are excluded.
        # This matters — a single tab left open on the homepage polls /api/trng
        # twice a minute, which would otherwise make it the busiest "visitor"
        # on the map without anyone reading anything.
        read = not ASSET_RE.search(path) and not path.startswith("/api/")
        if read:
            pageviews += 1
            paths[path.split("?")[0][:120]] += 1
        ref = m.group("ref")
        if ref and ref != "-" and "bradley.io" not in ref:
            refs[ref[:160]] += 1

        key = net24(ip)                    # <- the only identifier we keep
        key_net[(ip, ua)] = key
        p = place.get(key)
        if p is None:
            p = place[key] = {
                "net": key, "city": g["city"], "region": g["region"],
                "country": g["country"], "cc": g["cc"], "lat": g["lat"], "lon": g["lon"],
                "asn": g["asn"], "org": g["org"],
                "hits": 0, "reads": 0, "sessions": 0, "last": 0,
            }
        p["hits"] += 1
        p["reads"] += 1 if read else 0
        p["last"] = max(p["last"], ts.timestamp())
        if g["cc"]:
            countries[g["cc"]] += 1
        if g["asn"]:
            a = asns[g["asn"]]
            a["sessions"] += 1
            a["org"] = a["org"] or g["org"]

    access_rows, access_files = scan(ACCESS_STEM, cutoff, on_access)

    # Sessionise: a gap longer than SESSION_GAP starts a new visit.
    session_count = 0
    for k, stamps in sessions.items():
        stamps.sort()
        n = 1 + sum(1 for a, b in zip(stamps, stamps[1:]) if b - a > SESSION_GAP)
        session_count += n
        net = key_net.get(k)
        if net in place:
            place[net]["sessions"] += n

    # --- trapped scanners ----------------------------------------------
    scan_ips = defaultdict(lambda: {"hits": 0, "last": 0, "target": None})
    scan_paths = defaultdict(int)
    scan_hits = 0
    scan_day = defaultdict(int)

    def on_scanner(m, ts):
        nonlocal scan_hits
        ip = m.group("ip")
        if is_self(ip):
            return
        scan_hits += 1
        e = scan_ips[ip]
        e["hits"] += 1
        e["last"] = max(e["last"], ts.timestamp())
        req = m.group("req").split(" ")
        path = (req[1] if len(req) > 1 else "-").split("?")[0][:100]
        e["target"] = e["target"] or path
        scan_paths[path] += 1
        scan_day[ts.astimezone(timezone.utc).strftime("%Y-%m-%d")] += 1

    scanner_rows, scanner_files = scan(SCANNER_STEM, cutoff, on_scanner)

    top_scanners = sorted(scan_ips.items(), key=lambda kv: -kv[1]["hits"])[:TOP_N]
    scanners_out = []
    for ip, e in top_scanners:
        g = geo.get(ip)
        scanners_out.append({
            "ip": ip, "hits": e["hits"], "last": e["last"], "target": e["target"],
            "city": g["city"], "country": g["country"], "cc": g["cc"],
            "lat": g["lat"], "lon": g["lon"], "asn": g["asn"], "org": g["org"],
        })

    # Every scanner that geolocates, for the map layer (not just the top N).
    scan_places = {}
    for ip, e in scan_ips.items():
        g = geo.get(ip)
        if g["lat"] is None:
            continue
        key = f"{round(g['lat'], 1)},{round(g['lon'], 1)}"
        p = scan_places.setdefault(key, {
            "lat": round(g["lat"], 1), "lon": round(g["lon"], 1),
            "city": g["city"], "country": g["country"], "cc": g["cc"],
            "hits": 0, "ips": 0,
        })
        p["hits"] += e["hits"]
        p["ips"] += 1

    edge = read_edge()
    edge_pkts = sum(f["pkts"] for f in edge.get("feeds", []))

    days_sorted = sorted(set(list(day.keys()) + list(scan_day.keys())))
    snapshot = {
        "generated": time.time(),
        "windowDays": WINDOW_DAYS,
        "tookMs": round((time.time() - t0) * 1000),
        "privacy": {
            "humans": "coarsened to /24 network, city and ASN — no visitor IP is stored or served",
            "automated": "scanners and edge-dropped hosts are shown at full IP",
        },
        "sources": {
            "access": {"stem": ACCESS_STEM, "rows": access_rows, "files": access_files},
            "scanner": {"stem": SCANNER_STEM, "rows": scanner_rows, "files": scanner_files},
            "edge": {"ok": edge["ok"], "host": EDGE_HOST, "error": edge.get("error")},
        },
        "funnel": {
            "edgeDropped": edge_pkts,
            "trapped": scan_hits,
            "botsServed": bot_hits,
            "humanHits": sum(d["humans"] for d in day.values()),
            "sessions": session_count,
        },
        "visitors": {
            "sessions": session_count,
            "uniqueNets": len(place),
            "uniqueIpsSeen": len(human_ips),   # count only — the IPs are discarded
            "pageviews": pageviews,
            "selfHits": self_hits,
            "byDay": [{"d": d, **day[d]} for d in days_sorted if d in day],
            "byHourUtc": hour,
            "places": sorted(place.values(), key=lambda p: (-p["reads"], -p["sessions"])),
            "countries": sorted(
                ({"cc": cc, "hits": n} for cc, n in countries.items()),
                key=lambda c: -c["hits"],
            )[:TOP_N],
            "asns": sorted(
                ({"asn": a, "org": v["org"], "hits": v["sessions"]} for a, v in asns.items()),
                key=lambda a: -a["hits"],
            )[:TOP_N],
            "topPaths": sorted(
                ({"path": p, "hits": n} for p, n in paths.items()), key=lambda p: -p["hits"]
            )[:TOP_N],
            "referrers": sorted(
                ({"ref": r, "hits": n} for r, n in refs.items()), key=lambda r: -r["hits"]
            )[:20],
            "statuses": dict(sorted(statuses.items())),
        },
        "scanners": {
            "hits": scan_hits,
            "uniqueIps": len(scan_ips),
            "byDay": [{"d": d, "hits": scan_day[d]} for d in days_sorted if d in scan_day],
            "top": scanners_out,
            "places": sorted(scan_places.values(), key=lambda p: -p["hits"])[:400],
            "paths": sorted(
                ({"path": p, "hits": n} for p, n in scan_paths.items()), key=lambda p: -p["hits"]
            )[:TOP_N],
        },
        "edge": edge,
        # Tiers that are sketched on the page but not yet wired to a source.
        "planned": {
            "wanScans": {
                "status": "planned",
                "note": "non-HTTP knocks on forwarded ports (SSH 1223, DNS 53, wg 51900). "
                        "Needs a counter-based collector on spydr — packet drop-logging is "
                        "off-limits after the July 2026 EA7500 overload.",
            },
            "fleet": {
                "status": "planned",
                "note": "the 17.x WireGuard + TOR fleet: per-node exit health, egress geo, "
                        "and which sessions arrived through it.",
            },
            "mcp": {
                "status": "planned",
                "note": "an OpenWrt control/telemetry interface so these reads stop being "
                        "ssh + text scraping.",
            },
        },
    }

    os.makedirs(OUT_DIR, exist_ok=True)
    tmp = OUT + ".tmp"
    with open(tmp, "w") as fh:
        json.dump(snapshot, fh, separators=(",", ":"))
    os.replace(tmp, OUT)
    print(
        f"visitors: {session_count} sessions / {len(place)} nets, "
        f"{scan_hits} trapped from {len(scan_ips)} IPs, "
        f"edge {'ok' if edge['ok'] else 'DOWN'} ({edge_pkts} pkts) "
        f"in {snapshot['tookMs']}ms → {OUT}"
    )


if __name__ == "__main__":
    socket.setdefaulttimeout(20)
    main()
