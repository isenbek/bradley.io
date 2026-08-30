# junior moves to junior.tinymachines.ai

Option B, decided 2026-08-29. The app keeps its domain root, so **nothing inside
junior changes**: no `root_path`, no template pass, no new failure modes. The
whole move is a DNS record, a `server_name`, and a certificate.

The config is written and **parse-tested**, at
`docs/junior/junior.conf.candidate`. It is **not installed**: PUBLIC's working
agreement says an nginx change is a proposal, and this one cannot go in before
the DNS exists anyway.

---

## Two corrections to the first draft

Both were wrong in the direction of more work, and both are worth recording.

1. **The `$connection_upgrade` map already exists**, at `nginx.conf` line 14.
   The draft said to add it. `junior.conf` simply never used it and hardcoded
   `Connection "upgrade"` in two places; the candidate now uses the map. A
   hardcoded upgrade declares every request an upgrade, including the ones that
   are not, and those stall rather than fail.
2. **No new vhost is needed.** junior's existing block already does the auth
   gate, the PTY and the websocket. Option B adds one name to two
   `server_name` lines.

---

## What the candidate changes

```
server_name junior.bradley.io junior.isenbek.io junior.lan junior.local;
         -> junior.tinymachines.ai junior.isenbek.io junior.lan junior.local;
```

on both the `:443` and the `:80` block, plus:

- a **new pair of blocks for `junior.bradley.io`** that serve nothing and 301 to
  `https://junior.tinymachines.ai$request_uri`. They sit ahead of the app blocks,
  and the old name is removed from those, so the app answers to exactly one
  public identity.
- the two hardcoded upgrade headers, fixed.

`junior.isenbek.io`, `junior.lan` and `junior.local` are untouched. Armando
keeps reaching it on the LAN whether or not the public site is up, which is the
point of them.

---

## Run it in this order

The order matters: certbot has to answer an HTTP challenge on a name that
resolves, and nginx will not start with a certificate path that does not exist.

**1. DNS — yours to do.** One record:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `junior.tinymachines.ai` | `104.11.127.142` | 300 while you watch it |

**No AAAA.** `tinymachines.ai` has no IPv6 address today, and publishing one for
a subdomain when the apex has none is the trap that fails only for the users
whose resolver prefers v6, intermittently, and looks like something else
entirely. Match the apex or omit it.

```bash
dig +short junior.tinymachines.ai @8.8.8.8    # wait for 104.11.127.142
```

**2. Install the config, HTTP only.** The `:443` block references a certificate
that does not exist yet, so bring the name up on port 80 first:

```bash
sudo cp /etc/nginx/sites-enabled/junior.conf \
        /etc/nginx/backups/junior.conf.bak-$(date +%Y%m%d-%H%M%S)
sudo cp docs/junior/junior.conf.candidate /etc/nginx/sites-enabled/junior.conf
# Temporarily drop junior.tinymachines.ai from the :443 server_name, leaving it
# on :80, so nginx starts without the cert.
sudo nginx -t && sudo systemctl reload nginx
```

**3. Extend the certificate.** One cert covering every name junior answers to,
including the old one so its redirect stops throwing a name mismatch:

```bash
sudo certbot certonly --webroot -w /var/www/html \
  --cert-name junior.isenbek.io \
  -d junior.isenbek.io -d junior.tinymachines.ai -d junior.bradley.io
```

**4. Put the name back on `:443`** and reload:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## Then check the part curl cannot

```bash
curl -sI https://junior.tinymachines.ai/  | head -3   # 200
curl -sI https://junior.bradley.io/       | head -3   # 301 to the new name
curl -sI http://junior.bradley.io/        | head -3   # 301 as well
```

Then **open the console and confirm the terminal attaches.** The PTY is a
websocket, and a websocket that fails to upgrade returns a perfectly healthy
200 on the page hosting it. The page will look right and the terminal will
simply never produce a prompt. That is the whole reason the upgrade header was
worth fixing in the same change.

---

## Rolling back

```bash
sudo cp /etc/nginx/backups/junior.conf.bak-<stamp> /etc/nginx/sites-enabled/junior.conf
sudo nginx -t && sudo systemctl reload nginx
```

The DNS record can stay: a name that resolves to a host with no vhost for it
falls through to the default server, which is not an outage for anything else.

---

## Already done, and needing nothing from you

- **The 3D entropy views** are live at `tinymachines.ai/hotbits/space`, reading
  `/random/archive` and `/metrics` on `hotbits.tinymachines.ai`. Both are open
  and neither draws on the fresh pool.
- **`bradley.io/trng/space`** 308s there; its components are deleted.
- **`/lab` is retired**, the Meatball field notes moved to `/meatball/notes/*`,
  and `/projects` is down to three with 296 dossier redirects.

None of those needed an nginx change.

## Why this was the better option

`tinymachines.ai/junior` would have meant a `root_path` argument, a pass over 16
root-absolute template paths, and a new class of bug where a junior asset
resolves against the tinymachines site. PUBLIC's own CLAUDE.md notes that the
subdomains **stay for now and move under the apex later**, with a redirect map at
the move. junior joins that queue and moves once, with everything else, instead
of twice.
