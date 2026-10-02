#!/usr/bin/env python3
"""
ai_client: the one place the pipelines ask a language model for text.

Why it exists: the pipelines used to POST straight to the CBAI gateway
(127.0.0.1:3220) and swallow every error. When the gateway went down the
site quietly filled up with "Phase 25" placeholders and nobody was told.
This module makes failure loud and gives the pipelines a second backend.

API (stdlib only, safe under /usr/bin/python3 and the pyenv interpreter)
----------------------------------------------------------------------
    import ai_client

    text = ai_client.chat(
        prompt,                 # str, the user message
        system=None,            # optional system message
        max_tokens=800,         # output cap (num_predict on Ollama)
        timeout=90,             # seconds, PER BACKEND attempt
        min_chars=40,           # quality gate: shortest acceptable answer
        want_json=False,        # True: answer must contain one JSON object
        require=(),             # with want_json: top-level keys that must hold
                                # real text, e.g. ("name", "description")
        label="",               # short tag for the stderr line, e.g. "repo:cbapp"
    )                           # -> str on success, None on ANY failure

    obj  = ai_client.extract_json(text)   # -> dict | None (first {...} that parses)
    bad  = ai_client.is_non_answer(text)  # True for "", "Okay", "Please provide ...",
                                          # "I cannot ..." (use it on any field you publish)
    up   = ai_client.available()          # False once every backend has been given up on
    meta = ai_client.last_meta()          # {"backend","model","seconds"} of the last success
    s    = ai_client.stats()              # {"calls","ok","failed","cbai_ok","ollama_ok",
                                          #  "open_breakers": [...], ...}
    line = ai_client.summary_line()       # one printable line built from stats()

    ALWAYS pass require=(...) with want_json=True, naming the fields you are
    going to publish or cache. Without it a model can wrap a refusal in valid
    JSON ({"description": "Okay"}) and only the weaker checks below apply.

Behaviour
---------
- Backends are tried in order: CBAI gateway first, then the local Ollama
  server (POST /api/chat, stream false). The first answer that passes the
  quality gate wins.
- chat() NEVER raises and returns None on any failure. Callers must treat
  None as "no answer": do not cache it, do not publish a guess in its place.
- EVERY failed backend attempt writes one line to stderr, unconditionally:
      ai_client: FAIL backend=<cbai|ollama> label=<label> error=<what>
  and a call that ends with no answer writes one more:
      ai_client: NO ANSWER label=<label> (cbai: ..., ollama: ...)
- Circuit breaker: a backend is skipped for the rest of the process, with
  one stderr line saying so, after any of
      2 consecutive connection-level failures (refused, unreachable, DNS),
      3 consecutive timeouts (it accepts the connection and never answers),
      5 consecutive failures of any transport kind (HTTP errors, bad bodies).
  An answer, even one the quality gate rejects, resets the counts. This
  keeps a dead gateway from costing a log line, and a wedged one from
  costing a full timeout, on every one of several hundred calls: the worst
  case per backend is 3 x timeout, not calls x timeout. Once every backend
  is skipped, available() is False and chat() returns None at once; a
  caller with many items left should stop asking (and keep earlier values).
- Quality gate (applies to both backends): rejects an empty answer, an
  answer shorter than min_chars, a non-answer ("Okay", "Sure", "Please
  provide ...", "I cannot ..."), and, when want_json is set, an answer with
  no parseable JSON object. In JSON mode the same non-answer tests run on
  the VALUES: every top-level string is checked for a refusal or a request
  for input, each key in require must be present as real text, and with no
  require an object whose only strings are acknowledgements is rejected.
  <think>...</think> blocks are stripped first.
- chat() has no overall deadline of its own: a caller with hundreds of
  items should keep a wall-clock budget (the timeline pipeline does).

Environment
-----------
    CBAI_URL                default http://127.0.0.1:3220
    CBAI_PROVIDER           default ollama
    OLLAMA_URL              default http://127.0.0.1:11434
    AI_FALLBACK_MODEL       default gemma3:4b   (see MEASUREMENT below)
    AI_FALLBACK_KEEP_ALIVE  how long Ollama keeps the model after a call
                            (for example "2m"). Unset by default, so the
                            request carries no keep_alive of its own. Checked
                            2026-10-02: gemma3:4b, pinned forever by another
                            client, was still pinned after ten of our calls.
    AI_BACKENDS             default "cbai,ollama"; order and membership.
                            "ollama" skips the gateway; "cbai" disables the
                            fallback (useful to test the failure path).
    AI_BREAKER_TIMEOUTS     default 3; consecutive timeouts before a backend
                            is skipped for the rest of the process.

Command line (a quick probe; prints the answer and the timing)
--------------------------------------------------------------
    python3 scripts/ai_client.py "Say what a Geiger counter measures."
    python3 scripts/ai_client.py --json 'Return JSON: {"ok": true}'

MEASUREMENT (fallback model choice)
-----------------------------------
See the block comment above DEFAULT_FALLBACK_MODEL.
"""

from __future__ import annotations

import json
import os
import re
import socket
import sys
import time
import urllib.error
import urllib.request

CBAI_URL = os.environ.get("CBAI_URL", "http://127.0.0.1:3220").rstrip("/")
CBAI_PROVIDER = os.environ.get("CBAI_PROVIDER", "ollama")
OLLAMA_URL = os.environ.get("OLLAMA_URL", "http://127.0.0.1:11434").rstrip("/")

# MEASUREMENT, 2026-10-02, this box (2x RTX 3070 8 GB, load average 16.9).
# VRAM before the test: 5.3 and 5.8 GB used of 8.2, i.e. 2.4 to 2.9 GB free
# per card. Ollama already held gemma3:4b (4.2 GB, 1.1 GB of it on GPU) and
# minicpm-v (4.5 GB on GPU), both pinned with an infinite keep-alive by another
# client (10.8.0.1) that calls /api/chat every few minutes.
#
# Two real prompts from the isenbek timeline cache, JSON mode, temperature 0.2:
#   A = summarize repo saas-myfw from 30 commits (2,886 chars in, 500 tokens out)
#   B = name the phase covering the first 7 repos (1,604 chars in, 800 out)
#
#   model         A       B       quality
#   gemma3:4b     30.2 s  37.1 s  A: correct 2-sentence summary in its own
#                                 words, 2 milestones with real commit dates.
#                                 B: "Early Experimentation & Tools", category
#                                 systems, a fair reading of 7 unrelated repos.
#   granite4:3b   31.9 s  17.4 s  A: copied the GitHub description verbatim
#                                 (emoji included), no summary. B: "AI and ML
#                                 Innovations", category ai-ml, for a batch
#                                 that is mostly CSS, a bloom filter and an
#                                 ngrok unit: wrong.
#
# Picked gemma3:4b: better on quality in both prompts, inside a minute, and it
# costs no extra memory because it is already loaded. Not measured, on
# purpose: ministral-3:8b (6.0 GB), gemma4:e4b (9.6 GB), phi4:14b (9.1 GB) and
# larger. None fits in the free VRAM, so loading one either runs mostly on a
# CPU that is already saturated or evicts the two pinned models that the other
# client depends on. If the GPUs are ever freed, set AI_FALLBACK_MODEL and
# rerun the two prompts before trusting a bigger model.
DEFAULT_FALLBACK_MODEL = "gemma3:4b"

AI_FALLBACK_MODEL = os.environ.get("AI_FALLBACK_MODEL", DEFAULT_FALLBACK_MODEL)
AI_FALLBACK_KEEP_ALIVE = os.environ.get("AI_FALLBACK_KEEP_ALIVE", "")
AI_BACKENDS = [
    b.strip().lower()
    for b in os.environ.get("AI_BACKENDS", "cbai,ollama").split(",")
    if b.strip()
]

# A backend is skipped for the rest of the process after this many
# consecutive failures of one kind. Connection failures are instant, so two
# are proof enough. A timeout costs the caller its whole timeout, so three in
# a row is where it stops: a backend that accepts the connection and never
# answers used to be retried at full timeout on every call of the run.
BREAKER_THRESHOLD = 2
BREAKER_TIMEOUTS = max(1, int(os.environ.get("AI_BREAKER_TIMEOUTS", "3")))
BREAKER_ANY = 5

_stats = {
    "calls": 0, "ok": 0, "failed": 0,
    "cbai_ok": 0, "cbai_fail": 0,
    "ollama_ok": 0, "ollama_fail": 0,
    "seconds": 0.0,
}
_conn_failures = {"cbai": 0, "ollama": 0}
_timeouts = {"cbai": 0, "ollama": 0}
_any_failures = {"cbai": 0, "ollama": 0}
_breaker_open = {"cbai": False, "ollama": False}
_last_meta: dict = {}


class _Rejected(Exception):
    """The backend answered, but the answer failed the quality gate."""


def _err(msg: str) -> None:
    print(f"ai_client: {msg}", file=sys.stderr, flush=True)


# --- Quality gate ---------------------------------------------------------

_THINK_RE = re.compile(r"<think>[\s\S]*?</think>", re.IGNORECASE)

# Whole-answer acknowledgements: the model said it was ready and stopped.
_ACK_RE = re.compile(
    r"^(ok(ay)?|sure|certainly|understood|got it|alright|yes|no|ready|done)"
    r"[\s.!,:;]*$",
    re.IGNORECASE,
)
# The model asked for input instead of answering. Looked for in the first 160
# characters only, so a real answer that ends "please provide feedback" passes.
_ASKING_RE = re.compile(
    r"(please (provide|share|supply|give|paste|send)"
    r"|(could|can|would) you (please )?(provide|share|clarify|give)"
    r"|what would you like"
    r"|how can i (help|assist)"
    r"|no (repositories|repos|commits|information|content|text|input) (were|was|is|are) provided"
    r"|you (haven't|have not|didn't|did not) (provided|provide|included|include|given|give))",
    re.IGNORECASE,
)
# The model refused or stalled. Anchored at the START of the answer (after an
# optional "Okay," or "Sorry,"), so a real answer that later says "I cannot
# tell from the commits whether ..." is not thrown away.
_REFUSAL_RE = re.compile(
    r"^\W*((ok(ay)?|sure|sorry|well|hmm+)\W+)*"
    r"(i (need|require) (more|additional|the|some)"
    r"|i('m| am) (sorry|unable|not able|ready|afraid)"
    r"|i (cannot|can't|can not|do not have|don't have|won't|am not)"
    r"|as an ai\b"
    r"|unfortunately\b)",
    re.IGNORECASE,
)


def extract_json(text: str | None) -> dict | None:
    """Return the first JSON object in text that parses, or None.

    Tries the widest {...} span first (the common case: the whole answer is
    one object, perhaps inside a code fence), then walks forward from each
    opening brace with a real decoder so trailing prose does not break it.
    """
    if not text:
        return None
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            obj = json.loads(match.group())
            if isinstance(obj, dict):
                return obj
        except (json.JSONDecodeError, ValueError):
            pass
    decoder = json.JSONDecoder()
    for m in re.finditer(r"\{", text):
        try:
            obj, _ = decoder.raw_decode(text[m.start():])
        except (json.JSONDecodeError, ValueError):
            continue
        if isinstance(obj, dict):
            return obj
    return None


def _stalling(text: str) -> bool:
    """A refusal at the start, or a request for input in the first 160 chars."""
    return bool(_REFUSAL_RE.match(text) or _ASKING_RE.search(text[:160]))


def is_non_answer(text) -> bool:
    """True when text is not an answer: not a string, empty, a bare
    acknowledgement ("Okay"), a refusal ("I cannot ..."), or a request for
    input ("Please provide ..."). Callers should run this on every model
    field they are about to publish or cache."""
    if not isinstance(text, str):
        return True
    cleaned = _THINK_RE.sub("", text).strip()
    return not cleaned or bool(_ACK_RE.match(cleaned)) or _stalling(cleaned)


def _gate_json(obj: dict, require: tuple) -> None:
    """Non-answer tests on the VALUES of a JSON answer. A model in JSON mode
    cannot open with "Please provide ...", so it puts it in a field instead."""
    for key in require:
        value = obj.get(key)
        if not isinstance(value, str) or not value.strip():
            raise _Rejected(f"required field {key!r} is missing or not text")
        if _ACK_RE.match(value.strip()):
            raise _Rejected(f"non-answer in field {key!r} ({value.strip()[:30]!r})")
    strings = {k: v.strip() for k, v in obj.items() if isinstance(v, str)}
    for key, value in strings.items():
        if value and _stalling(value):
            raise _Rejected(f"non-answer in field {key!r} ({value[:60]!r})")
    if not require and strings and all(
        not v or _ACK_RE.match(v) for v in strings.values()
    ):
        # No field was named as required, and no string in the object says
        # anything: {"description": "Okay", "milestones": [...]}.
        raise _Rejected(f"no real text in any field ({json.dumps(obj)[:60]!r})")


def _gate(text: str | None, *, min_chars: int, want_json: bool, require: tuple = ()) -> str:
    """Return the cleaned answer, or raise _Rejected saying why."""
    if text is None:
        raise _Rejected("empty answer (no content field)")
    cleaned = _THINK_RE.sub("", str(text)).strip()
    if not cleaned:
        raise _Rejected("empty answer")
    if _ACK_RE.match(cleaned):
        raise _Rejected(f"non-answer ({cleaned[:30]!r})")
    if want_json:
        obj = extract_json(cleaned)
        if obj is None:
            raise _Rejected(f"no parseable JSON object ({cleaned[:60]!r})")
        if not obj:
            raise _Rejected("empty JSON object")
        # The opening words of a JSON answer are a brace, so the non-answer
        # tests run on the field values instead.
        _gate_json(obj, tuple(require or ()))
        if len(json.dumps(obj)) < min_chars:
            raise _Rejected(f"too short ({len(json.dumps(obj))} < {min_chars} chars)")
        return cleaned
    if _stalling(cleaned):
        raise _Rejected(f"non-answer ({cleaned[:60]!r})")
    if len(cleaned) < min_chars:
        raise _Rejected(f"too short ({len(cleaned)} < {min_chars} chars)")
    return cleaned


# --- Backends -------------------------------------------------------------

def _post_json(url: str, payload: dict, timeout: float) -> dict:
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def _messages(prompt: str, system: str | None) -> list[dict]:
    msgs = []
    if system:
        msgs.append({"role": "system", "content": system})
    msgs.append({"role": "user", "content": prompt})
    return msgs


def _call_cbai(prompt, system, max_tokens, timeout, want_json) -> tuple[str | None, str]:
    result = _post_json(
        f"{CBAI_URL}/api/v1/chat",
        {
            "messages": _messages(prompt, system),
            "provider": CBAI_PROVIDER,
            "max_tokens": max_tokens,
        },
        timeout,
    )
    return result.get("content"), f"cbai:{CBAI_PROVIDER}"


def _call_ollama(prompt, system, max_tokens, timeout, want_json) -> tuple[str | None, str]:
    payload: dict = {
        "model": AI_FALLBACK_MODEL,
        "messages": _messages(prompt, system),
        "stream": False,
        # Low temperature: these are summaries of facts, not creative writing.
        # num_ctx is deliberately NOT set: asking for a different context size
        # makes Ollama reload a model that another service already has loaded.
        "options": {"num_predict": max_tokens, "temperature": 0.2},
    }
    if want_json:
        payload["format"] = "json"
    if AI_FALLBACK_KEEP_ALIVE:
        payload["keep_alive"] = AI_FALLBACK_KEEP_ALIVE
    result = _post_json(f"{OLLAMA_URL}/api/chat", payload, timeout)
    if result.get("error"):
        raise RuntimeError(f"ollama error: {result['error']}")
    return (result.get("message") or {}).get("content"), f"ollama:{AI_FALLBACK_MODEL}"


_BACKENDS = {"cbai": _call_cbai, "ollama": _call_ollama}


def _is_connection_error(exc: BaseException) -> bool:
    """True when the backend could not be reached at all (not a slow answer)."""
    reason = getattr(exc, "reason", exc)
    if isinstance(reason, (ConnectionRefusedError, ConnectionResetError, socket.gaierror)):
        return True
    if isinstance(reason, OSError) and not isinstance(reason, (socket.timeout, TimeoutError)):
        # ENETUNREACH, EHOSTUNREACH and friends.
        return getattr(reason, "errno", None) is not None
    return False


def _is_timeout(exc: BaseException) -> bool:
    """True when the backend was reached and then did not answer in time."""
    reason = getattr(exc, "reason", exc)
    return isinstance(exc, (socket.timeout, TimeoutError)) or isinstance(
        reason, (socket.timeout, TimeoutError))


def _reset_breaker_counts(name: str) -> None:
    _conn_failures[name] = 0
    _timeouts[name] = 0
    _any_failures[name] = 0


def _count_failure(name: str, exc: BaseException) -> None:
    """Count a transport failure and open the breaker when a limit is hit."""
    _any_failures[name] += 1
    why = None
    if _is_connection_error(exc):
        _conn_failures[name] += 1
        _timeouts[name] = 0
        if _conn_failures[name] >= BREAKER_THRESHOLD:
            why = f"unreachable {_conn_failures[name]} times in a row"
    elif _is_timeout(exc):
        _timeouts[name] += 1
        _conn_failures[name] = 0
        if _timeouts[name] >= BREAKER_TIMEOUTS:
            why = f"timed out {_timeouts[name]} times in a row"
    else:
        _conn_failures[name] = 0
        _timeouts[name] = 0
    if why is None and _any_failures[name] >= BREAKER_ANY:
        why = f"failed {_any_failures[name]} times in a row"
    if why:
        _breaker_open[name] = True
        _err(f"backend={name} {why}; skipping it for the rest of this run")


def _describe(exc: BaseException) -> str:
    if isinstance(exc, urllib.error.HTTPError):
        body = ""
        try:
            body = exc.read().decode("utf-8", "replace")[:120].replace("\n", " ")
        except Exception:  # noqa: BLE001 - the body is a nicety, never fatal
            pass
        return f"HTTP {exc.code} {exc.reason} {body}".strip()
    if _is_timeout(exc):
        return "timeout"
    if isinstance(exc, urllib.error.URLError):
        return f"{type(exc.reason).__name__}: {exc.reason}"
    return f"{type(exc).__name__}: {exc}"


# --- Public API -----------------------------------------------------------

def chat(
    prompt: str,
    *,
    system: str | None = None,
    max_tokens: int = 800,
    timeout: float = 90,
    min_chars: int = 40,
    want_json: bool = False,
    require: tuple = (),
    label: str = "",
) -> str | None:
    """Ask the model. Return the answer text, or None on any failure.

    Never raises. Every failed attempt is reported on stderr. See the module
    docstring for the full contract.
    """
    _stats["calls"] += 1
    tag = label or "-"
    reasons: list[str] = []

    for name in AI_BACKENDS:
        fn = _BACKENDS.get(name)
        if fn is None:
            reasons.append(f"{name}: unknown backend")
            _err(f"FAIL backend={name} label={tag} error=unknown backend in AI_BACKENDS")
            continue
        if _breaker_open[name]:
            reasons.append(f"{name}: skipped, given up on earlier in this run")
            continue

        started = time.monotonic()
        try:
            raw, model = fn(prompt, system, max_tokens, timeout, want_json)
            text = _gate(raw, min_chars=min_chars, want_json=want_json, require=require)
        except _Rejected as exc:
            _reset_breaker_counts(name)  # it answered; the link is fine
            _stats[f"{name}_fail"] += 1
            reasons.append(f"{name}: rejected, {exc}")
            _err(f"FAIL backend={name} label={tag} error=rejected by quality gate: {exc}")
            continue
        except Exception as exc:  # noqa: BLE001 - the contract is "never raise"
            _stats[f"{name}_fail"] += 1
            what = _describe(exc)
            reasons.append(f"{name}: {what}")
            _err(f"FAIL backend={name} label={tag} error={what}")
            _count_failure(name, exc)
            continue

        elapsed = time.monotonic() - started
        _reset_breaker_counts(name)
        _stats["ok"] += 1
        _stats[f"{name}_ok"] += 1
        _stats["seconds"] += elapsed
        _last_meta.clear()
        _last_meta.update({"backend": name, "model": model, "seconds": round(elapsed, 1)})
        return text

    _stats["failed"] += 1
    _err(f"NO ANSWER label={tag} ({'; '.join(reasons) or 'no backends configured'})")
    return None


def available() -> bool:
    """False once every configured backend has been given up on for this
    process (or none is configured). chat() would return None at once."""
    return any(name in _BACKENDS and not _breaker_open[name] for name in AI_BACKENDS)


def last_meta() -> dict:
    """Backend, model and seconds of the most recent successful chat()."""
    return dict(_last_meta)


def stats() -> dict:
    """Counters for this process. 'failed' counts calls that returned None.
    'open_breakers' lists the backends given up on."""
    return {**_stats, "open_breakers": [n for n, is_open in _breaker_open.items() if is_open]}


def summary_line() -> str:
    s = _stats
    avg = (s["seconds"] / s["ok"]) if s["ok"] else 0.0
    given_up = [n for n, is_open in _breaker_open.items() if is_open]
    return (
        f"ai_client: {s['calls']} calls, {s['ok']} ok "
        f"(cbai {s['cbai_ok']}, ollama {s['ollama_ok']}), {s['failed']} failed, "
        f"avg {avg:.1f}s per answer, fallback model {AI_FALLBACK_MODEL}"
        + (f", gave up on: {', '.join(given_up)}" if given_up else "")
    )


def _main(argv: list[str]) -> int:
    args = [a for a in argv if not a.startswith("--")]
    if not args:
        print(__doc__)
        return 2
    started = time.monotonic()
    answer = chat(args[0], want_json="--json" in argv, min_chars=2, label="cli")
    took = time.monotonic() - started
    if answer is None:
        print(f"(no answer after {took:.1f}s)", file=sys.stderr)
        return 1
    print(answer)
    print(f"\n[{last_meta().get('model')} in {took:.1f}s]", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(_main(sys.argv[1:]))
