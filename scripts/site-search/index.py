#!/usr/bin/env python3
"""Build the bradley.io search index with vectl.

Reads every URL in the live sitemap, takes the readable text of each page's
<main>, splits it into passages, embeds them with the local model, and
writes a vectl store. The new store is built in its own directory and
swapped in with a symlink only when it is complete; the previous build is
kept for rollback and older ones are removed.

Run with the search environment:
  /mnt/nom01/envs/bradleyio-search/bin/python scripts/site-search/index.py
Exits non-zero, leaving the live index untouched, if the site cannot be
read or too few pages were indexed.
"""
import re
import shutil
import sys
import time
import json
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common  # noqa: E402

MIN_PAGES = 20          # fewer than this means something is wrong; keep the old index
CHUNK_CHARS = 900       # passage size, roughly 150 to 200 words
SKIP_PATHS = ("/resume/print",)
INLINE_BREAKS = {"span", "a", "b", "strong", "em", "i", "code", "kbd", "small", "div", "br", "dd", "dt", "label"}
SKIP_TAGS = {"script", "style", "noscript", "svg", "nav", "footer", "button", "template"}


class MainText(HTMLParser):
    """Collects title, h1 and the visible text inside <main>, by block."""

    BLOCKS = {"p", "li", "h1", "h2", "h3", "h4", "td", "th", "dd", "dt", "figcaption", "blockquote", "pre", "summary"}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.title = ""
        self.h1 = ""
        self.blocks = []
        self._in_main = 0
        self._skip = 0
        self._in_title = False
        self._in_h1 = False
        self._buf = []
        self._heading = ""
        self._in_heading = False

    def handle_starttag(self, tag, attrs):
        if tag == "br" and self._in_main:
            self._buf.append(" ")
        if tag == "title":
            self._in_title = True
        if tag == "main":
            self._in_main += 1
        if not self._in_main:
            return
        if tag in SKIP_TAGS:
            self._skip += 1
        if tag == "h1":
            self._in_h1 = True
        if tag in ("h2", "h3"):
            self._in_heading = True
        if tag in self.BLOCKS:
            self._flush()

    def handle_endtag(self, tag):
        if tag == "title":
            self._in_title = False
        if not self._in_main:
            return
        if tag in SKIP_TAGS and self._skip:
            self._skip -= 1
        # Inline elements that end a word in the layout (chips, tags, line
        # breaks, links) get a space, or "Pi" and "Custom" read "PiCustom".
        if tag in INLINE_BREAKS:
            self._buf.append(" ")
        if tag in self.BLOCKS:
            text = self._flush()
            if tag == "h1" and text:
                self.h1 = text
            if tag in ("h2", "h3") and text:
                self._heading = text
        if tag == "h1":
            self._in_h1 = False
        if tag in ("h2", "h3"):
            self._in_heading = False
        if tag == "main":
            self._flush()
            self._in_main -= 1

    def handle_data(self, data):
        if self._in_title:
            self.title += data
        if self._in_main and not self._skip:
            self._buf.append(data)

    def _flush(self):
        text = re.sub(r"\s+", " ", "".join(self._buf)).strip()
        self._buf = []
        if text:
            self.blocks.append((self._heading, text))
        return text


def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers={"User-Agent": "bradley.io site-search indexer"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read().decode("utf-8", "replace")


def sitemap_paths():
    """The sitemap, plus every internal page /bench links to.

    The sitemap lists the pages meant for search engines; /bench is the hand-
    kept list of every live page on the server, which is what site search
    should cover. Both are read from the running site.
    """
    xml = fetch(f"{common.SITE_BASE}/sitemap.xml")
    paths = []

    def add(p):
        p = p.split("#")[0].split("?")[0].rstrip("/") or "/"
        if p.startswith("/") and not p.startswith("/api") and not p.startswith(SKIP_PATHS) \
                and not re.search(r"\.(png|jpe?g|webp|svg|pdf|json|xml|txt|ico|html)$", p) and p not in paths:
            paths.append(p)

    for loc in re.findall(r"<loc>([^<]+)</loc>", xml):
        add(re.sub(r"^https?://[^/]+", "", loc.strip()) or "/")
    try:
        bench = fetch(f"{common.SITE_BASE}/bench")
        main = bench.split("<main", 1)[-1]
        for href in re.findall(r'href="(/[^"]*)"', main):
            add(href)
    except Exception as ex:
        print(f"  /bench unreadable, sitemap only: {ex}", file=sys.stderr)
    return paths


def passages(blocks):
    """Group consecutive blocks under the same heading into ~CHUNK_CHARS passages."""
    out, cur, head = [], [], ""
    for heading, text in blocks:
        if len(text) < 3:
            continue
        if cur and (heading != head or sum(len(t) for t in cur) + len(text) > CHUNK_CHARS):
            out.append((head, " ".join(cur)))
            cur = []
        head = heading
        cur.append(text)
    if cur:
        out.append((head, " ".join(cur)))
    return [(h, t) for h, t in out if len(t) >= 40]


def clean_title(raw, h1, path):
    t = re.sub(r"\s+", " ", raw).strip()
    t = re.split(r"\s+[|·]\s+", t)[0].strip()
    return h1 or t or path


def main():
    t0 = time.time()
    emb = common.embedder()
    paths = sitemap_paths()
    docs = []
    for path in paths:
        try:
            p = MainText()
            p.feed(fetch(common.SITE_BASE + path))
        except Exception as ex:  # one bad page must not sink the index
            print(f"  skip {path}: {type(ex).__name__}: {ex}", file=sys.stderr)
            continue
        title = clean_title(p.title, p.h1, path)
        for i, (heading, text) in enumerate(passages(p.blocks)):
            docs.append({"path": path, "title": title, "heading": heading, "text": text, "i": i})
    # The resume's availability line is the one sentence a hiring manager
    # searches for, and on the page it shares a passage with the headline and
    # the button labels. Index it on its own, from the resume's JSON.
    try:
        r = json.loads(fetch(f"{common.SITE_BASE}/api/resume"))
        detail = r.get("availabilityDetail")
        if isinstance(detail, dict):
            detail = " ".join(str(v) for v in detail.values() if isinstance(v, str))
        avail = " ".join(x for x in (r.get("availability"), r.get("location"), detail if isinstance(detail, str) else "") if x)
        if avail:
            docs.append({"path": "/resume", "title": "Resume", "heading": "Availability: hiring",
                         "text": f"{avail} Hiring? Read the resume, download the PDF, or get in touch.", "i": 9999})
    except Exception as ex:
        print(f"  resume availability not indexed: {ex}", file=sys.stderr)
    pages = len({d["path"] for d in docs})
    print(f"read {pages} of {len(paths)} sitemap pages, {len(docs)} passages")
    if pages < MIN_PAGES:
        print(f"SEARCH INDEX NOT WRITTEN: only {pages} pages readable (floor {MIN_PAGES}).", file=sys.stderr)
        return 2

    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    build = common.ROOT / f"build-{stamp}"
    build.mkdir(parents=True, exist_ok=False)
    store = common.open_store(build)
    import asyncio

    async def embed_all():
        n = 0
        for start in range(0, len(docs), 32):
            batch = docs[start:start + 32]
            vecs = await emb.embed_batch([common.DOC_PREFIX + f"{d['title']}. {d['heading']}. {d['text']}" for d in batch])
            for d, v in zip(batch, vecs):
                if not v or len(v) != common.DIMENSION:
                    continue
                store.add(f"{d['path']}#{d['i']}", list(v), {
                    "path": d["path"], "title": d["title"], "heading": d["heading"], "text": d["text"][:600],
                })
                n += 1
        return n

    added = asyncio.run(embed_all())
    store.save_index()
    store.close()
    (build / "manifest.json").write_text(json.dumps({
        "built": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "pages": pages, "passages": added, "model": common.EMBED_MODEL, "engine": "vectl",
    }, indent=1))
    if added < len(docs) * 0.9:
        print(f"SEARCH INDEX NOT WRITTEN: embedded {added} of {len(docs)} passages.", file=sys.stderr)
        shutil.rmtree(build, ignore_errors=True)
        return 3

    # Atomic swap: point a temp symlink at the build, rename it over CURRENT.
    tmp = common.ROOT / f".site-{stamp}"
    tmp.symlink_to(build.name)
    previous = common.CURRENT.resolve() if common.CURRENT.is_symlink() else None
    tmp.rename(common.CURRENT)
    keep = {build.resolve()} | ({previous} if previous else set())
    for old in common.ROOT.glob("build-*"):
        if old.resolve() not in keep:
            shutil.rmtree(old, ignore_errors=True)
    print(f"search index: {pages} pages, {added} passages, {time.time() - t0:.0f}s -> {build.name}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
