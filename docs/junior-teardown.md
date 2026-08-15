# /junior — teardown checklist

`/junior` is a **temporary, unlisted, PIN-gated** page that fronts a writable
shell on this host. It exists to walk one person through flashing an OpenWrt
image onto a Raspberry Pi 5 while watching the work happen live.

**Take it down as soon as the job is done.** A writable shell behind an
8-digit PIN is not something to leave running.

## Bringing it up

```bash
./scripts/junior-up.sh    # deploy.sh, then sudo deploy/junior-setup.sh
```

Prints the PIN at the end. Run it as `bisenbek`, not root — it sudo's only
the part that needs it.

## What it stood up

| Piece | Where |
| --- | --- |
| PTY bridge | `junior-ttyd.service` → ttyd on `127.0.0.1:7682`, running `tmux new -A -s junior` |
| nginx route | `/etc/nginx/snippets/junior.conf`, included from `sites-enabled/bradley.io.nginx` |
| Gate secrets | `JUNIOR_PIN`, `JUNIOR_SECRET` in `/etc/bradley-io.env` |
| Page source | `app/junior/`, `app/api/junior/`, `components/junior/`, `lib/junior-session.ts` |
| Styles | the `/junior` block at the end of `app/v3.css` |
| robots | the `"/junior"` entry in `app/robots.ts` |

## How the gate works

The browser never sees the PIN. It posts to `/api/junior/auth`, which
compares against `JUNIOR_PIN` and, on success, sets an httpOnly HMAC-signed
cookie (8h TTL, `JUNIOR_SECRET`). Failed attempts are throttled per IP —
6 misses buys a 10-minute lockout.

ttyd itself has **no authentication**. The only thing between the internet
and the shell is the nginx `auth_request` subrequest to `/api/junior/check`.
It is bound to loopback so it cannot be reached directly.

## Teardown

```bash
# 1. server side — kills the shell, the route and the PIN
sudo ./deploy/junior-teardown.sh

# 2. source side
git rm -r app/junior app/api/junior components/junior \
          lib/junior-session.ts deploy/junior-* docs/junior-teardown.md
#    then delete the "/junior — TEMPORARY" block at the end of app/v3.css
#    and drop "/junior" from the disallow list in app/robots.ts
./deploy.sh
```

Optionally `sudo apt-get purge ttyd` afterwards. Note that installing ttyd
also enabled a stock `ttyd.service` (a root `login` shell on `127.0.0.1:7681`);
setup disabled it, but purging removes it for good.

## Verifying it is actually gone

```bash
curl -s -o /dev/null -w '%{http_code}\n' https://bradley.io/junior      # 404
curl -s -o /dev/null -w '%{http_code}\n' https://bradley.io/junior/pty/ # 404
ss -tln | grep 7682                                                     # nothing
systemctl is-active junior-ttyd                                         # inactive
```
