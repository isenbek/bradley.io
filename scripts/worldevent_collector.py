#!/usr/bin/env python3
"""WorldEvent collector — the perception bus snapshot for bradley.io.

Subscribes to the worldevent/1 UDP firehose (broadcast on :31415) and aggregates
it GENERICALLY — it knows nothing about ADS-B, GPS, or any specific producer. It
groups by event `type`, `host`, and `schema`, tracks rate + a 60s sparkline per
type, keeps a small rolling tail, and writes an atomic snapshot every second to
/var/lib/bradley-cam/worldevent.json for the Next.js /api/worldevent route.

Coexists with dragonfli-feed and any other readers via SO_REUSEPORT (the bus is
a broadcast, so the kernel delivers a copy to every bound socket).
"""
import json
import os
import socket
import time
from collections import defaultdict, deque

PORT = int(os.environ.get("WORLDEVENT_PORT", "31415"))
OUT_DIR = os.environ.get("CAM_CACHE_DIR", "/var/lib/bradley-cam")
OUT = os.path.join(OUT_DIR, "worldevent.json")
WINDOW = 60          # sparkline / rate window, seconds
TAIL = 48            # rolling recent-event tail length
FLUSH_SEC = 1.0      # snapshot cadence


def now():
    return time.time()


class TypeAgg:
    __slots__ = ("count", "first", "last", "buckets", "sample", "last_bytes")

    def __init__(self, t0):
        self.count = 0
        self.first = t0
        self.last = t0
        self.buckets = defaultdict(int)   # int(second) -> count
        self.sample = None                # last data payload (trimmed)
        self.last_bytes = 0

    def hit(self, sec, data, nbytes):
        self.count += 1
        self.last = now()
        self.buckets[sec] += 1
        self.sample = trim(data)
        self.last_bytes = nbytes

    def spark(self, sec):
        return [self.buckets.get(sec - i, 0) for i in range(WINDOW - 1, -1, -1)]

    def per_min(self, sec):
        return sum(self.buckets.get(sec - i, 0) for i in range(WINDOW))

    def prune(self, sec):
        for k in [k for k in self.buckets if k <= sec - WINDOW]:
            del self.buckets[k]


def trim(data):
    """Generic, type-agnostic compaction of a payload for display."""
    if not isinstance(data, dict):
        return {"value": _scalar(data)}
    out = {}
    for k, v in list(data.items())[:18]:
        if isinstance(v, list):
            out[k] = f"[{len(v)} items]"
        elif isinstance(v, dict):
            out[k] = "{…}"
        else:
            out[k] = _scalar(v)
    return out


def _scalar(v):
    if isinstance(v, str) and len(v) > 64:
        return v[:61] + "…"
    if isinstance(v, float):
        return round(v, 5)
    return v


def summarize(data):
    """One-line, generic summary: up to 3 scalar key=value pairs."""
    if not isinstance(data, dict):
        return str(data)[:80]
    parts = []
    for k, v in data.items():
        if isinstance(v, (list, dict)):
            continue
        if isinstance(v, float):
            v = round(v, 3)
        parts.append(f"{k}={v}")
        if len(parts) >= 3:
            break
    return "  ".join(parts)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    try:
        s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEPORT, 1)
    except (AttributeError, OSError):
        pass
    s.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
    s.bind(("", PORT))
    s.settimeout(FLUSH_SEC)

    started = now()
    total = 0
    total_bytes = 0
    peak_eps = 0.0
    types = {}                                   # type -> TypeAgg
    hosts = defaultdict(lambda: {"count": 0, "last": 0.0})
    schemas = {}                                 # schema -> count
    tail = deque(maxlen=TAIL)
    global_buckets = defaultdict(int)            # int(second) -> count
    last_flush = 0.0

    while True:
        try:
            pkt, _ = s.recvfrom(8192)
            t = now()
            sec = int(t)
            try:
                ev = json.loads(pkt.decode("utf-8", "replace"))
            except Exception:
                continue
            etype = str(ev.get("type", "unknown"))
            ehost = str(ev.get("host", "?"))
            eschema = str(ev.get("schema", "?"))
            data = ev.get("data", {})

            total += 1
            total_bytes += len(pkt)
            global_buckets[sec] += 1
            schemas[eschema] = schemas.get(eschema, 0) + 1

            agg = types.get(etype)
            if agg is None:
                agg = types[etype] = TypeAgg(t)
            agg.hit(sec, data, len(pkt))

            h = hosts[ehost]
            h["count"] += 1
            h["last"] = t

            tail.appendleft({
                "ts": round(ev.get("ts", t), 3),
                "type": etype,
                "host": ehost,
                "id": str(ev.get("id", ""))[:8],
                "summary": summarize(data),
            })
        except socket.timeout:
            pass
        except Exception:
            pass

        t = now()
        if t - last_flush >= FLUSH_SEC:
            sec = int(t)
            # prune old buckets
            for k in [k for k in global_buckets if k <= sec - WINDOW]:
                del global_buckets[k]
            for agg in types.values():
                agg.prune(sec)

            recent10 = sum(global_buckets.get(sec - i, 0) for i in range(10))
            eps = round(recent10 / 10.0, 2)
            peak_eps = max(peak_eps, eps)

            type_list = []
            for name, agg in sorted(types.items(), key=lambda kv: -kv[1].count):
                pm = agg.per_min(sec)
                type_list.append({
                    "type": name,
                    "count": agg.count,
                    "perMin": pm,
                    "perSec": round(pm / 60.0, 2),
                    "share": round(agg.count / total, 4) if total else 0,
                    "lastTs": round(agg.last, 3),
                    "ageSec": round(t - agg.last, 1),
                    "firstSeen": round(agg.first, 3),
                    "bytes": agg.last_bytes,
                    "spark": agg.spark(sec),
                    "sample": agg.sample,
                })

            host_list = [
                {"host": hn, "count": hv["count"], "ageSec": round(t - hv["last"], 1)}
                for hn, hv in sorted(hosts.items(), key=lambda kv: -kv[1]["count"])
            ]

            snap = {
                "generatedAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(t)),
                "uptimeSec": int(t - started),
                "source": {
                    "port": PORT,
                    "transport": "udp/broadcast",
                    "schemas": [{"schema": k, "count": v} for k, v in
                                sorted(schemas.items(), key=lambda kv: -kv[1])],
                },
                "totals": {
                    "events": total,
                    "bytes": total_bytes,
                    "eventsPerSec": eps,
                    "eventsPerSecPeak": round(peak_eps, 2),
                    "distinctTypes": len(types),
                    "distinctHosts": len(hosts),
                },
                "spark": [global_buckets.get(sec - i, 0) for i in range(WINDOW - 1, -1, -1)],
                "types": type_list,
                "hosts": host_list,
                "tail": list(tail),
            }

            tmp = OUT + ".tmp"
            try:
                with open(tmp, "w") as f:
                    json.dump(snap, f, separators=(",", ":"))
                os.replace(tmp, OUT)
            except Exception:
                pass
            last_flush = t


if __name__ == "__main__":
    main()
