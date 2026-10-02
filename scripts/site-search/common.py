"""Shared settings for the bradley.io site search (indexer and server).

Search is vectl (the cbvector package, installed from
~/projects/nominate/cbvector into its own environment at
/mnt/nom01/envs/bradleyio-search) over embeddings from this box's own
Ollama (nomic-embed-text, through its OpenAI-compatible /v1/embeddings
endpoint). Nothing leaves the machine.

The store lives on the artifact disk (operator rule: generated output goes
to /mnt/ursa/bradleyio). The indexer builds a new store beside the live
one and swaps a symlink, so the server never reads a half-written index.
"""
import os
from pathlib import Path

EMBED_URL = os.environ.get("SEARCH_EMBED_URL", "http://127.0.0.1:11434/v1/embeddings")
EMBED_MODEL = os.environ.get("SEARCH_EMBED_MODEL", "nomic-embed-text")
DIMENSION = 768
ROOT = Path(os.environ.get("SEARCH_ROOT", "/mnt/ursa/bradleyio/vectl"))
CURRENT = ROOT / "site"            # symlink to the live build directory
STORE_NAME = "site"                # file stem inside a build directory
SITE_BASE = os.environ.get("SEARCH_SITE_BASE", "http://127.0.0.1:32221")
PUBLIC_BASE = "https://bradley.io"

# nomic-embed-text was trained with task prefixes; documents and queries
# must use the matching one or similarity degrades.
DOC_PREFIX = "search_document: "
QUERY_PREFIX = "search_query: "


def embedder():
    from vectl.embeddings import EmbeddingConfig, EmbeddingService
    return EmbeddingService(EmbeddingConfig(embed_url=EMBED_URL, model=EMBED_MODEL,
                                            dimension=DIMENSION, cache_enabled=True))


def open_store(directory: Path):
    from vectl.storage import VectorStore, VectorStoreConfig
    cfg = VectorStoreConfig(dimension=DIMENSION, use_native=False, fallback_format="json")
    return VectorStore(str(directory / STORE_NAME), cfg)
