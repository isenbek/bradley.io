# junior moved to junior.tinymachines.ai

**Done 2026-08-29.** Option B: the app keeps its domain root, so nothing inside
junior changed except the name it calls itself. DNS is served by BIND on this
box, so the whole move happened here.

| | |
|---|---|
| `https://junior.tinymachines.ai/` | 200, the app |
| `https://junior.isenbek.io/` | 200, unchanged |
| `https://junior.bradley.io/` | 301, path preserved |
| `junior.lan`, `junior.local` | unchanged, LAN only |

---

## What was changed, in order

**1. DNS — both views.** `tinymachines.ai` is split-horizon here: three BIND
views (`localhost`, `internal`, `external`), with `internal` and `external`
loading different zone files. A record added to only one would resolve for half
the house.

```
/etc/bind/zones/tinymachines.ai.zone            junior IN A 104.11.127.142
/etc/bind/zones/internal/tinymachines.ai.zone   junior IN A 13.0.0.252
```

Serial `2026082002` to `2026082901` in both. `named-checkzone` before install,
`rndc reload` after. **No AAAA**: the apex has none, and publishing one for a
subdomain when the apex has none fails only for the users whose resolver prefers
v6, intermittently.

Note `/etc/bind/named.conf.local` also declares this zone and **is not included
by `named.conf`**. It is dead config. Editing it would have done nothing, which
is the kind of thing that costs an afternoon.

**2. nginx.** `junior.bradley.io` swapped for `junior.tinymachines.ai` on the
app's `:80` and `:443` blocks, and the old name given its own pair of blocks
that serve nothing and 301. Two other fixes went in the same change:

- **The hardcoded `Connection "upgrade"`**, twice, replaced with
  `$connection_upgrade`. The map was already defined at `nginx.conf:14`; this
  file simply never used it. A hardcoded upgrade declares every request an
  upgrade, including the ones that are not, and those stall rather than fail.
- **The `:80` block was certbot's generated form**: per-host `if` guards and a
  final `return 404`. A server-level `return` runs in the rewrite phase and
  short-circuits before any location is chosen, so the ACME challenge for a NEW
  name would have 404'd and the certificate could never have been issued. It is
  now a normal `location /.well-known/acme-challenge/` plus a `$host` redirect,
  which also stops needing a new `if` per name.

The webroot was proved before running certbot, by fetching a file placed in it.

**3. Certificate.** One cert over all three names, so the old name's redirect no
longer throws a mismatch on the way through:

```bash
certbot certonly --webroot -w /var/www/html --cert-name junior.isenbek.io \
  -d junior.isenbek.io -d junior.tinymachines.ai -d junior.bradley.io --expand
```

`subjectAltName` now reads `junior.bradley.io, junior.isenbek.io,
junior.tinymachines.ai`, and all three answer over TLS without `-k`.

**4. The app's own name.** `JUNIOR_SITE` in `/etc/junior.env` pointed at the old
host, so every page titled itself `junior.bradley.io` while living somewhere
else. Now `junior.tinymachines.ai`; `junior-web` restarted.

---

## Backups

| | |
|---|---|
| `/etc/bind/backups/zones-tinymachines.ai.zone.bak-20260829-223203` | external zone |
| `/etc/bind/backups/internal-tinymachines.ai.zone.bak-20260829-223203` | internal zone |
| `/etc/nginx/backups/junior.conf.bak-20260829-223445` | vhost |
| `/etc/junior.env.bak-*` | app env |

Rolling back is a `cp` and a reload in each case. The DNS record can stay
either way: a name resolving to a host with no vhost falls through to the
default server.

---

## Not verified, and it needs a human

**The terminal.** `/ws` and `/pty` sit behind the auth gate, so an
unauthenticated probe gets the gate's 302 rather than an upgrade. That confirms
the gate still fires under the new name, and nothing more. A websocket that
fails to upgrade returns a perfectly healthy 200 on the page hosting it: the
console will look right and simply never produce a prompt.

**Open the console and confirm it attaches.** That is the one check curl cannot
stand in for, and it is exactly what the upgrade-header fix above was for.

---

## Still saying the old name

Ten files in `~/projects/junior` mention `junior.bradley.io` in prose:
`README.md`, `START-HERE.md`, `CLAUDE.md`, `server/mcp.py` (an example
`claude mcp add` command), `terminal/README.md`, and five docs under `docs/`.
None of them affect what runs. `server/mcp.py` is the one worth fixing soon,
because it is an instruction someone will copy.

---

## Also done, elsewhere

- **The 3D entropy views** are live at `tinymachines.ai/hotbits/space`, reading
  `/random/archive` and `/metrics` on `hotbits.tinymachines.ai`. Neither draws
  on the fresh pool.
- **`bradley.io/trng/space`** 308s there; its components are deleted.
- **`/lab` is retired**, the Meatball field notes moved to `/meatball/notes/*`,
  and `/projects` is down to three with 296 dossier redirects.
