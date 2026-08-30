# junior.bradley.io to tinymachines.ai/junior: the draft

Drafted 2026-08-29. **Nothing here has been applied.** PUBLIC's own working
agreement says it plainly, and it is the right rule: *"The three live sites must
keep working. Anything that would change their nginx, their units or their ports
is a proposal, not an action."*

---

## The blocker, before anything else

**junior cannot be mounted at `/junior` by nginx alone.** It is a FastAPI app
built to live at a domain root, and it says so in three places:

| Where | What it emits |
|---|---|
| `server/app.py:61` | `app.mount("/static", ...)` |
| `server/app.py:414` | `app.mount("/term", ...)` |
| `server/templates/*.html` | `/static/tokens.static.css`, `/static/components.css`, `/static/junior.css`, `/doc/{slug}.md`, `/term/`, and `/` |

`FastAPI(...)` is constructed with no `root_path`. Proxy it under `/junior` and
the browser is told to fetch `https://tinymachines.ai/static/junior.css`, which
is not junior's stylesheet: it is a path on the tinymachines site, and it will
either 404 or, worse, hit something real. The page renders unstyled and the
terminal never connects.

So there are two honest routes, and the choice is yours.

---

## Option A: teach junior its prefix, then proxy (recommended)

The app change is small and belongs in the app, because the app is the thing
that knows where it lives.

**1. `server/app.py`** — one argument, plus the mounts follow it automatically:

```python
# Behind nginx at tinymachines.ai/junior. root_path makes FastAPI emit
# prefixed URLs without every template having to know the prefix.
ROOT_PATH = os.environ.get("JUNIOR_ROOT_PATH", "")
app = FastAPI(
    title="junior",
    docs_url=None, redoc_url=None, openapi_url=None,
    lifespan=lifespan,
    root_path=ROOT_PATH,
)
```

**2. The templates** — 16 root-absolute references become prefix-aware. In
Jinja that is `{{ request.scope.root_path }}` prepended, or a `url_for`. Either
way it is a mechanical pass over `base.html`, `doc.html` and `console.html`.

**3. The unit** — `JUNIOR_ROOT_PATH=/junior` in the systemd environment. With it
empty, junior still serves correctly at a bare domain, so `junior.lan` and
`junior.local` keep working for Armando on the LAN.

**4. nginx**, added to the `tinymachines.ai` server block:

```nginx
# junior, proxied under a prefix. The app is told its own root_path so it
# emits /junior/... URLs; nginx passes the prefix through untouched rather
# than stripping it, which is why proxy_pass has no trailing path.
location /junior/ {
    auth_request /_junior_authcheck;
    error_page 401 = @junior_gate;
    proxy_pass         http://junior_app;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header   X-Forwarded-Proto $scheme;
    proxy_set_header   X-Forwarded-Prefix /junior;
    client_max_body_size 64m;
}

# The PTY and the websocket. Both need the upgrade headers; neither works
# with the buffering on.
location /junior/pty {
    auth_request /_junior_authcheck;
    error_page 401 = @junior_gate;
    proxy_pass         http://junior_pty;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection $connection_upgrade;
    proxy_set_header   Host $host;
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
    proxy_buffering    off;
}

location = /junior/ws {
    auth_request /_junior_authcheck;
    error_page 401 = @junior_gate;
    proxy_pass         http://junior_app;
    proxy_http_version 1.1;
    proxy_set_header   Upgrade $http_upgrade;
    proxy_set_header   Connection $connection_upgrade;
    proxy_set_header   Host $host;
    proxy_read_timeout 86400;
    proxy_buffering    off;
}

location = /_junior_authcheck {
    internal;
    proxy_pass              http://junior_app/auth/check;
    proxy_pass_request_body off;
    proxy_set_header        Content-Length "";
    proxy_set_header        Host $host;
    proxy_set_header        X-Original-URI $request_uri;
}
location @junior_gate { return 302 /junior/; }
```

**Note `$connection_upgrade`, not the literal `"upgrade"`.** The existing junior
vhost hardcodes it. That works until a client sends no `Upgrade` header, at which
point the connection is still declared an upgrade and the proxy stalls. The map
belongs in `nginx.conf`:

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ''      close;
}
```

**5. Retire the old vhost** by redirecting rather than deleting, so anything
bookmarked survives:

```nginx
server {
    listen 443 ssl;
    server_name junior.bradley.io;
    # certs as now
    return 301 https://tinymachines.ai/junior$request_uri;
}
```

Keep `junior.isenbek.io`, `junior.lan` and `junior.local` pointing at the app
directly, unprefixed. Armando reaches it on the LAN and should not depend on the
public site being up.

---

## Option B: leave it on a subdomain, move the name

No app change at all. `junior.tinymachines.ai` instead of
`tinymachines.ai/junior`: the app keeps its root, every absolute path stays
correct, and the work is a DNS record plus a `server_name` edit.

This is not what was asked for, and it is worth saying why it might be the
better answer anyway: PUBLIC's CLAUDE.md notes that *"the subdomains stay for
now and move under the apex later"*, with a redirect map at the move. junior
would simply join that queue and move when the others do, once rather than
twice.

---

## DNS

For **Option A**, no new record is needed: `tinymachines.ai` already resolves and
already terminates TLS. Only the `junior.bradley.io` retirement record matters,
and only if you want the old name to stop resolving eventually.

For **Option B**:

| Type | Name | Value | Note |
|---|---|---|---|
| A | `junior.tinymachines.ai` | `104.11.127.142` | same host as the apex |
| AAAA | `junior.tinymachines.ai` | *(only if the apex has one)* | match the apex or omit |

Then a cert: `certbot certonly --webroot -w /var/www/html -d junior.tinymachines.ai`.

**The IPv4/IPv6 trap applies here.** A record published on only one family, with
the vhost listening on the other, fails for exactly the users whose resolver
prefers the missing one, and it fails intermittently enough to look like
something else. Publish both or neither.

---

## Verify, in this order

```bash
sudo nginx -t                       # never reload on a config that has not parsed
sudo systemctl reload nginx
curl -sI https://tinymachines.ai/junior/ | head -3
curl -sI https://junior.bradley.io/     | head -3   # expect 301 to the new home
```

Then the part a curl cannot check: open the console and confirm the terminal
attaches. The PTY is a websocket, and a websocket that fails to upgrade returns
a perfectly healthy-looking 200 on the page that hosts it.

---

## Already done, for the record

- **The 3D entropy views** are live at `tinymachines.ai/hotbits/space`, reading
  `/random/archive` and `/metrics` on `hotbits.tinymachines.ai`. Both are open
  and neither draws on the fresh pool.
- **`bradley.io/trng/space`** 308s to the new home. `bradley.io/trng` stays as
  the instrument's summary.
- Neither of those needed an nginx change.
