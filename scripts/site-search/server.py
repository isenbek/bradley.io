#!/usr/bin/env python3
"""The bradley.io site search service: vectl over the site's own pages.

GET /search?q=...&k=8   -> {"ok": true, "q", "results": [{path, url, title,
                            heading, snippet, score}], "index": {...}}
GET /health             -> {"ok": true, "passages", "built"}

Listens on 127.0.0.1 only; the site reaches it through app/api/search. The
query is embedded by the local model (nomic-embed-text via Ollama) and
searched in the vectl store the indexer built. Results are grouped by page
so one long page cannot fill the list. The store is reloaded when the
indexer swaps in a new build. Run by systemd (bradley-io-search.service).
"""
import json
import os
import re
import sys
import threading
import time
from collections import OrderedDict
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common  # noqa: E402

HOST, PORT = "127.0.0.1", int(os.environ.get("SEARCH_PORT", "32295"))
MAX_Q = 200
MIN_SCORE = float(os.environ.get("SEARCH_MIN_SCORE", "0.60"))
# nomic scores bunch up, so also drop anything far below the best hit.
BAND = float(os.environ.get("SEARCH_BAND", "0.12"))
TITLE_BONUS = 0.06
HUBS = {"/", "/bench", "/projects"}
HUB_PENALTY = 0.07
SHORT_PENALTY = 0.04

_lock = threading.Lock()
_state = {"target": None, "store": None, "manifest": {}}
_cache: "OrderedDict[str, list]" = OrderedDict()   # query -> vector
_emb = common.embedder()


def current_store():
    """Open the live build, reopening when the symlink moves."""
    try:
        target = os.path.realpath(common.CURRENT)
    except OSError:
        return None, {}
    with _lock:
        if target != _state["target"] or _state["store"] is None:
            if not os.path.isdir(target):
                return None, {}
            store = common.open_store(Path(target))
            try:
                store.load_index()
            except Exception:
                pass
            try:
                manifest = json.loads((Path(target) / "manifest.json").read_text())
            except Exception:
                manifest = {}
            _state.update(target=target, store=store, manifest=manifest)
        return _state["store"], _state["manifest"]


def embed_query(q):
    key = q.lower()
    with _lock:
        if key in _cache:
            _cache.move_to_end(key)
            return _cache[key]
    vec = _emb.embed_sync(common.QUERY_PREFIX + q)
    with _lock:
        _cache[key] = vec
        while len(_cache) > 512:
            _cache.popitem(last=False)
    return vec


def snippet(text, q, width=220):
    words = [w for w in re.findall(r"\w{3,}", q.lower())]
    low = text.lower()
    at = min([low.find(w) for w in words if low.find(w) >= 0] or [0])
    start = max(0, at - 60)
    s = text[start:start + width].strip()
    return ("..." if start else "") + s + ("..." if start + width < len(text) else "")


def search(q, k):
    store, manifest = current_store()
    if store is None or store.count == 0:
        return {"ok": False, "reason": "no-index", "results": []}
    raw = store.search(embed_query(q), k=max(k * 4, 20))
    # Index pages (/bench, /projects, /about) mention everything in a line
    # each, so they out-score the page a thing actually lives on. A small
    # bonus when a query word is in the page's own title puts the page
    # itself first; the vector score still decides everything else.
    words = {w for w in re.findall(r"[a-z0-9]{3,}", q.lower())}
    def boosted(item):
        _i, s, m = item
        m = m or {}
        title = m.get("title", "").lower()
        s += TITLE_BONUS if words and any(w in title for w in words) else 0.0
        # Hubs and one-line blurbs describe a page; they should send you
        # there, not outrank it.
        s -= HUB_PENALTY if m.get("path") in HUBS else 0.0
        s -= SHORT_PENALTY if len(m.get("text", "")) < 220 else 0.0
        return s
    raw = sorted(((i, boosted((i, s, m)), m) for i, s, m in raw), key=lambda x: -x[1])
    by_page = OrderedDict()
    top = max((s for _i, s, _m in raw), default=0.0)
    for _id, score, meta in raw:
        if score < MIN_SCORE or score < top - BAND or not meta:
            continue
        path = meta.get("path", "/")
        if path in by_page:
            continue
        by_page[path] = {
            "path": path,
            "url": common.PUBLIC_BASE + path,
            "title": meta.get("title") or path,
            "heading": meta.get("heading") or "",
            "snippet": snippet(meta.get("text", ""), q),
            "score": round(float(score), 3),
        }
        if len(by_page) >= k:
            break
    return {"ok": True, "q": q, "results": list(by_page.values()),
            "index": {"built": manifest.get("built"), "pages": manifest.get("pages"),
                      "passages": manifest.get("passages"), "engine": "vectl", "model": common.EMBED_MODEL}}


class Handler(BaseHTTPRequestHandler):
    server_version = "bradleyio-search/1"

    def _send(self, code, obj):
        body = json.dumps(obj).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        u = urlparse(self.path)
        try:
            if u.path == "/health":
                store, manifest = current_store()
                return self._send(200, {"ok": store is not None, "passages": store.count if store else 0,
                                        "built": manifest.get("built")})
            if u.path == "/search":
                qs = parse_qs(u.query)
                q = (qs.get("q", [""])[0] or "").strip()[:MAX_Q]
                try:
                    k = min(max(int(qs.get("k", ["8"])[0]), 1), 20)
                except ValueError:
                    k = 8
                if len(q) < 2:
                    return self._send(200, {"ok": True, "q": q, "results": []})
                t = time.time()
                out = search(q, k)
                out["ms"] = int((time.time() - t) * 1000)
                return self._send(200, out)
            return self._send(404, {"ok": False, "reason": "not-found"})
        except Exception as ex:
            print(f"search error: {type(ex).__name__}: {ex}", file=sys.stderr)
            return self._send(503, {"ok": False, "reason": "unavailable"})

    def log_message(self, fmt, *args):
        pass


if __name__ == "__main__":
    current_store()
    print(f"site search on http://{HOST}:{PORT} (vectl, {common.EMBED_MODEL})", flush=True)
    ThreadingHTTPServer((HOST, PORT), Handler).serve_forever()
