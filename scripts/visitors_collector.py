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
  3. SERVED    EVERY nginx *.access.log on the box, discovered rather than
               listed — everything that got a real response, split into bots
               (by user-agent) and humans, tallied per site AND in aggregate.

SCANNERS ARE SITE-AGNOSTIC. nginx writes the scanner trap to one shared
scanner.log in the combined format, which carries no vhost field, so a trapped
probe cannot be attributed to a site. The page says so rather than implying the
count belongs to whichever site is on screen.

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
SCANNER_STEM = os.environ.get("VISITORS_SCANNER_STEM", "scanner.log")

# EVERY vhost, not just bradley.io.
#
# This used to read one access log. That made the page a report on one site
# while the box was serving eleven, and the interesting question, which is who
# is knocking on ANY of the doors here, could not be asked at all.
#
# Stems are discovered rather than listed: nginx names each log after its
# vhost, so the filesystem already knows the answer and a hand-maintained list
# would drift the first time a vhost was added. VISITORS_ACCESS_STEM still
# overrides, for a single-site run.
#
# Empty logs are skipped, which is most of them: 83 access logs exist and 11
# have ever been written to. Opening the other 72 plus their rotations costs
# real time and finds nothing.
ACCESS_STEM = os.environ.get("VISITORS_ACCESS_STEM", "")

# Vhosts that are infrastructure rather than a site someone visits. They are
# still counted in the aggregate (a knock is a knock) but are not offered as
# their own tab, because "who visited webhook-multiplexer" is not a question.
UTILITY_SITES = {"webhook-multiplexer", "catchall", "default"}

# A site with fewer human page reads than this gets folded into the aggregate
# without a tab of its own, and is named in `sitesFolded` so nothing is hidden.
#
# The threshold is on READS, not rows. comfy.nominate.ai logged 466 rows and
# three actual page reads: it is an API endpoint being polled, not a site anyone
# visits, and a tab reading "3" is noise on a page about who visited.
SITE_MIN_READS = int(os.environ.get("VISITORS_SITE_MIN_READS", "10"))
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


def discover_access_stems():
    """Every vhost access log that has anything in it, largest first.

    Size is measured across the current file and its in-window rotations,
    because a log that rotated yesterday reads as 0 bytes today while still
    holding a month of traffic.
    """
    if ACCESS_STEM:
        return [ACCESS_STEM]

    stems = {}
    try:
        names = os.listdir(LOG_DIR)
    except OSError as e:
        print(f"cannot list {LOG_DIR}: {e}", file=sys.stderr)
        return []

    # Only bytes written INSIDE the window count. Filtering on size alone
    # picked up 80 vhosts where 11 have current traffic: the nominate.ai hosts
    # are long dead but still hold months-old rotations, and walking all 32 of
    # each cost 28 of the 47 seconds a run took while finding nothing. mtime is
    # the cheap way to ask "did anything land here recently", and a rotation is
    # never written to after it rolls.
    #
    # One slack day, because a rotation that happened just before the cutoff can
    # still hold in-window lines.
    horizon = time.time() - (WINDOW_DAYS + 1) * 86400

    for name in names:
        if not name.endswith(".access.log"):
            continue
        total = 0
        for path in log_files(name, WINDOW_DAYS):
            try:
                st = os.stat(path)
            except OSError:
                continue
            if st.st_size and st.st_mtime >= horizon:
                total += st.st_size
        if total > 0:
            stems[name] = total

    return [s for s, _ in sorted(stems.items(), key=lambda kv: -kv[1])]


def site_name(stem):
    """`tinymachines.ai.access.log` -> `tinymachines.ai`."""
    return stem[: -len(".access.log")] if stem.endswith(".access.log") else stem


class Bucket:
    """One site's tallies, or the aggregate across all of them.

    Every accumulator that used to be a local in main() lives here, so a row
    can be counted into its own site and into the aggregate by calling add()
    twice. The aggregate is a real Bucket rather than a sum computed at the
    end, because sessions and unique networks do not add up: the same visitor
    reading two sites is one session in the aggregate and one in each site.
    """

    def __init__(self, name):
        self.name = name
        self.sessions = defaultdict(list)   # (ip, ua) -> [ts...]
        self.key_net = {}
        self.human_ips = set()
        self.bot_ips = set()
        self.self_hits = 0
        self.pageviews = 0
        self.bot_hits = 0
        self.prefetches = 0
        self.rows = 0
        self.day = defaultdict(lambda: {"humans": 0, "bots": 0})
        self.hour = [0] * 24
        self.paths = defaultdict(int)
        self.refs = defaultdict(int)
        self.place = {}
        self.countries = defaultdict(int)
        self.asns = defaultdict(lambda: {"sessions": 0, "org": None})
        self.statuses = defaultdict(int)
        self.session_count = 0

    def sessionise(self):
        """A gap longer than SESSION_GAP starts a new visit."""
        self.session_count = 0
        for k, stamps in self.sessions.items():
            stamps.sort()
            n = 1 + sum(1 for a, b in zip(stamps, stamps[1:]) if b - a > SESSION_GAP)
            self.session_count += n
            net = self.key_net.get(k)
            if net in self.place:
                self.place[net]["sessions"] += n
        # The raw stamps are the only place a visitor's IP survives past
        # on_access. Drop them as soon as they have been counted.
        self.sessions.clear()
        self.key_net.clear()

    def out(self, days_sorted, place_cap):
        return {
            "sessions": self.session_count,
            "uniqueNets": len(self.place),
            "uniqueIpsSeen": len(self.human_ips),  # count only, the IPs are discarded
            "pageviews": self.pageviews,
            "prefetches": self.prefetches,
            "botHits": self.bot_hits,
            "selfHits": self.self_hits,
            "byDay": [{"d": d, **self.day[d]} for d in days_sorted if d in self.day],
            "byHourUtc": self.hour,
            "places": sorted(
                self.place.values(), key=lambda p: (-p["reads"], -p["sessions"])
            )[:place_cap],
            "countries": sorted(
                ({"cc": cc, "hits": n} for cc, n in self.countries.items()),
                key=lambda c: -c["hits"],
            )[:TOP_N],
            "asns": sorted(
                ({"asn": a, "org": v["org"], "hits": v["sessions"]}
                 for a, v in self.asns.items()),
                key=lambda a: -a["hits"],
            )[:TOP_N],
            "topPaths": sorted(
                ({"path": p, "hits": n} for p, n in self.paths.items()),
                key=lambda p: -p["hits"],
            )[:TOP_N],
            "referrers": sorted(
                ({"ref": r, "hits": n} for r, n in self.refs.items()),
                key=lambda r: -r["hits"],
            )[:20],
            "statuses": dict(sorted(self.statuses.items())),
        }


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
    #
    # One pass per vhost, each row counted into that site's bucket and into the
    # aggregate. `all` is a real Bucket rather than a sum of the others because
    # sessions and unique networks do not add: one person reading two sites is
    # one aggregate session, and their /24 is one network, not two.
    stems = discover_access_stems()
    agg = Bucket("all")
    site_buckets = {}
    per_site_sources = []

    def make_on_access(site):
        def on_access(m, ts):
            ip, ua = m.group("ip"), m.group("ua")
            targets = (site, agg)
            if is_self(ip):
                for b in targets:
                    b.self_hits += 1
                return
            g = geo.get(ip)
            bot = bool(BOT_RE.search(ua)) or ua in ("-", "") or g["asn"] in BOT_ASNS
            req = m.group("req").split(" ")
            path = req[1] if len(req) > 1 else "-"
            d = ts.astimezone(timezone.utc).strftime("%Y-%m-%d")
            hr = ts.astimezone(timezone.utc).hour

            if bot:
                for b in targets:
                    b.bot_ips.add(ip)
                    b.bot_hits += 1
                    b.day[d]["bots"] += 1
                return

            # A "read" is a real page: assets and polled API endpoints are
            # excluded. This matters — a single tab left open on the homepage
            # polls /api/trng twice a minute, which would otherwise make it the
            # busiest "visitor" on the map without anyone reading anything.
            # Next.js <Link> prefetches every in-viewport route as an RSC
            # payload (`?_rsc=`). Sitewide that is ~42% of non-API requests: the
            # browser fetching pages nobody looked at. Counting them as reads
            # made anyone who merely LANDED on the homepage look like they
            # toured the site.
            prefetch = "_rsc=" in path
            read = (
                not ASSET_RE.search(path)
                and not path.startswith("/api/")
                and not prefetch
            )
            ref = m.group("ref")
            # A referrer from one of our own vhosts is internal navigation, not
            # a referral. Checking every known site rather than only bradley.io
            # is what stops the aggregate reporting itself as its own top
            # referrer now that eleven sites feed it.
            external_ref = bool(
                ref and ref != "-" and not any(s in ref for s in own_hosts)
            )
            key = net24(ip)  # <- the only identifier we keep
            status = m.group("status")
            short_path = path.split("?")[0][:120]

            for b in targets:
                b.human_ips.add(ip)
                b.day[d]["humans"] += 1
                b.hour[hr] += 1
                b.statuses[status] += 1
                b.sessions[(ip, ua)].append(ts.timestamp())
                if prefetch:
                    b.prefetches += 1
                if read:
                    b.pageviews += 1
                    b.paths[short_path] += 1
                if external_ref:
                    b.refs[ref[:160]] += 1
                b.key_net[(ip, ua)] = key
                p = b.place.get(key)
                if p is None:
                    p = b.place[key] = {
                        "net": key, "city": g["city"], "region": g["region"],
                        "country": g["country"], "cc": g["cc"],
                        "lat": g["lat"], "lon": g["lon"],
                        "asn": g["asn"], "org": g["org"],
                        "hits": 0, "reads": 0, "sessions": 0, "last": 0,
                    }
                p["hits"] += 1
                p["reads"] += 1 if read else 0
                p["last"] = max(p["last"], ts.timestamp())
                if g["cc"]:
                    b.countries[g["cc"]] += 1
                if g["asn"]:
                    a = b.asns[g["asn"]]
                    a["sessions"] += 1
                    a["org"] = a["org"] or g["org"]

        return on_access

    own_hosts = tuple(site_name(s) for s in stems) or ("bradley.io",)

    access_rows = access_files = 0
    for stem in stems:
        site = Bucket(site_name(stem))
        rows, files = scan(stem, cutoff, make_on_access(site))
        site.rows = rows
        access_rows += rows
        access_files += files
        per_site_sources.append({"site": site.name, "rows": rows, "files": files})
        if rows:
            site_buckets[site.name] = site

    for b in list(site_buckets.values()):
        b.sessionise()
    agg.sessionise()

    # Names kept so the rest of main() and the snapshot read unchanged.
    place = agg.place
    session_count = agg.session_count
    day = agg.day
    self_hits = agg.self_hits
    bot_hits = agg.bot_hits

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
            "access": {
                "sites": len(stems),
                "rows": access_rows,
                "files": access_files,
                "perSite": sorted(per_site_sources, key=lambda x: -x["rows"]),
            },
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
        # The aggregate, across every vhost. Shape unchanged from when this
        # was bradley.io alone, so anything reading it keeps working.
        "visitors": agg.out(days_sorted, place_cap=600),

        # Per site, largest first. Sessions and uniqueNets deliberately do NOT
        # sum to the aggregate: one person reading two sites is one aggregate
        # session and one /24, counted once there and once in each site.
        "sites": [
            {"site": b.name, "rows": b.rows, **b.out(days_sorted, place_cap=40)}
            for b in sorted(
                site_buckets.values(), key=lambda b: -b.pageviews or -b.rows
            )
            if b.name not in UTILITY_SITES and b.pageviews >= SITE_MIN_READS
        ],

        # Named so the page can say what it folded in rather than quietly
        # dropping it: these fed the aggregate but got no tab.
        "sitesFolded": [
            {"site": b.name, "rows": b.rows, "reads": b.pageviews}
            for b in sorted(site_buckets.values(), key=lambda b: -b.rows)
            if b.name in UTILITY_SITES or b.pageviews < SITE_MIN_READS
        ],

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
        f"visitors: {session_count} sessions / {len(place)} nets "
        f"across {len(stems)} sites, "
        f"{scan_hits} trapped from {len(scan_ips)} IPs, "
        f"edge {'ok' if edge['ok'] else 'DOWN'} ({edge_pkts} pkts) "
        f"in {snapshot['tookMs']}ms → {OUT}"
    )


if __name__ == "__main__":
    socket.setdefaulttimeout(20)
    main()
