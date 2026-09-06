---
title: "Subdomain recipe: DNS, nginx, cert, and the two traps"
project: housecalls
status: kit documentation (pilot-support-plan.md, prerequisite 4)
created: 2026-09-06
---

# Standing up the hunt subdomain

How housecalls.bradley.io actually got its address, generalized for the next
operator. Five steps in strict order (each depends on the one before), two
traps that each cost the flagship real debugging time, and a verification
list. Assumes the anti-cloud shape: your own box, your own nginx, a Next.js
app on a local port, and possibly your own DNS.

The pattern: `housecalls.<your-domain>` fronts the same app that serves your
main site, with the subdomain's root mounted on the `/housecalls` route.
One app, two doors.

## Step 1: DNS

Point the subdomain at the same address as your apex.

- **Hosted DNS (most pilots):** one A record (and AAAA if the apex has one),
  same target as the apex. Done.
- **Self-hosted BIND, split-horizon (the flagship):** there are TWO zone
  files per domain, one per view, and both must change or the subdomain
  works only inside or only outside, which is the most confusing possible
  failure. The flagship's records:

  ```
  external view (zones/bradley.io.zone):          housecalls  IN  A  <public IP>
  internal view (zones/internal/bradley.io.zone): housecalls  IN  A  <LAN IP>
  ```

  Bump the serial in BOTH files, then:

  ```
  named-checkzone bradley.io /etc/bind/zones/bradley.io.zone
  named-checkzone bradley.io /etc/bind/zones/internal/bradley.io.zone
  rndc reload
  ```

  Verify from both sides: `dig +short housecalls.<domain>` on the LAN and
  `dig +short housecalls.<domain> @8.8.8.8` for the world.

## Step 2: nginx, HTTP first

Create the vhost with ONLY the port-80 server block to start; the 443 block
references certificate files that do not exist yet, and nginx refuses to
load a config that points at missing files.

**Trap 1, which blocked the flagship's cert on a previous subdomain: the
ACME challenge must be a real `location`, first, serving from a real root.**
The tempting shortcut of a server-level `return 301` short-circuits the
challenge and the certificate can never be issued:

```nginx
server {
    server_name housecalls.<your-domain>;
    listen 80;
    listen [::]:80;

    # ACME first, as a real location, BEFORE the redirect.
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}
```

`nginx -t`, enable the site, reload.

## Step 3: the certificate

Webroot mode against the location from step 2:

```
certbot certonly --webroot -w /var/www/html -d housecalls.<your-domain>
```

Confirm the renewal timer is real: `systemctl list-timers certbot.timer`
and, the first time, `certbot renew --dry-run`. A cert you cannot renew is
a 90-day outage on a schedule.

## Step 4: nginx, the 443 block

Now the certificate files exist, add the TLS server. The mounting trick is
two locations: exact `/` proxies to the app's `/housecalls` route (the
subdomain's front door), and everything else passes straight through so
assets, RSC payloads, opengraph images, and deep links like
`/housecalls/plain` all work unchanged:

```nginx
server {
    server_name housecalls.<your-domain>;

    location = / {
        proxy_pass http://127.0.0.1:<app-port>/housecalls;
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:<app-port>;
        proxy_redirect off;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection $connection_upgrade;
    }

    listen 443 ssl;
    listen [::]:443 ssl;
    ssl_certificate     /etc/letsencrypt/live/housecalls.<your-domain>/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/housecalls.<your-domain>/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}
```

Flagship extras worth copying if you run the equivalents: a scanner-trap
include, and real-IP handling plus a shared access log so the subdomain's
traffic lands in the same visitor analytics as the apex.

## Step 5: the workstation /etc/hosts pin

**Trap 2, which broke the flagship's own map while the world saw it fine.**
If any resource the page loads (the tile server, an API) resolves to a
loopback or LAN address from your workstation, Chrome's private-network
protection blocks the fetch when the PAGE's own origin resolves to a
public-looking address. The error names the "loopback address space" and
only appears in *your* browser: external visitors are untouched, so it
looks like a heisenbug.

Fix: pin the subdomain to loopback on the workstation, next to the apex:

```
127.0.0.1  <your-domain> www.<your-domain> housecalls.<your-domain>
```

Now page origin and resources agree about which network they live on.

## Verification, all five before calling it done

1. `dig` from inside and outside agree with your intent (step 1).
2. `curl -I http://housecalls.<domain>/.well-known/acme-challenge/x` is a
   404 from nginx, not a redirect (the ACME path stays open for renewals).
3. `curl -sI https://housecalls.<domain>/` is a 200 with your app's
   headers; `/housecalls/plain` deep link too.
4. The map renders IN YOUR BROWSER, not just in curl (trap 2 hides there).
5. `certbot renew --dry-run` passes.

## Order matters

DNS before certbot (the challenge must resolve), the HTTP block before
certbot (the challenge must be served), certbot before the 443 block (the
files must exist). Skipping ahead produces errors two steps away from
their cause, which is where the flagship's debugging time actually went.
