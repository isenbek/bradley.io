---
title: "Tile recipe: the basemap on your own metal"
project: housecalls
status: kit documentation (pilot-support-plan.md, prerequisite 5)
created: 2026-09-06
---

# Serving your own map tiles

The hunt map's basemap comes from `territory.tilejson` in the operator
config, and the doctrine wants it on your own metal. This is how the
flagship's actually works (read off the running system, not from memory),
sized for a pilot, with an honest interim if the weekend runs short.

## What the map actually needs, which is almost nothing

The hunt map draws its own style: a dark panel background, ONE vector layer
from the tileset (`water`, for the lake and river lines), and then the
county choropleth and pins from the kit's own GeoJSON on top. You are not
standing up a street map. Any OpenMapTiles-schema tileset that covers your
state satisfies it. Two hard requirements:

1. **Coverage:** the tileset's bounds must contain your whole state. The
   flagship's covers the Great Lakes; a Texas pilot pointing at it gets a
   blank well where Texas should be.
2. **CORS:** if the tiles live on a different origin than the hunt page,
   the tile server must send `Access-Control-Allow-Origin` (mbtileserver
   does; verify with `curl -sI <tilejson-url> | grep -i access-control`).

## The flagship stack, top to bottom

**1. Build the tileset with Planetiler** (the flagship's is Planetiler
0.10.2, OpenMapTiles schema, zoom 0-14, 2.6 GB for the Great Lakes
region). For a single state this is a laptop-scale job:

```
wget https://github.com/onthegomap/planetiler/releases/latest/download/planetiler.jar
java -Xmx16g -jar planetiler.jar --download --area=michigan \
     --output=my-state.mbtiles
```

`--area` takes Geofabrik region names (`michigan`, `texas`, `ohio`...);
`--download` fetches the OSM extract for you. A state runs tens of minutes
and lands 1 to 3 GB. Keep the jar and the command: rebuilding yearly keeps
the map from fossilizing.

**2. Serve it with mbtileserver**, a single Go binary, loopback only. The
flagship's unit, trimmed to what matters:

```ini
[Unit]
Description=mbtileserver for the hunt basemap
After=network-online.target
RequiresMountsFor=/data

[Service]
User=you
ExecStart=/usr/local/bin/mbtileserver \
    --dir /data/tiles/mbtiles \
    --host 127.0.0.1 --port 8080 \
    --root-url /tiles/services \
    --enable-fs-watch --enable-reload-signal
Restart=on-failure
NoNewPrivileges=true
ProtectSystem=strict
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Notes that earn their place: `RequiresMountsFor` on the data disk means a
missing drive stops the service instead of serving nothing confusingly
(the flagship's tiles live on a disk with a history); `--root-url` must
match the nginx prefix below; fs-watch means dropping a new .mbtiles in
the directory publishes it without a restart. The service URL becomes
`/tiles/services/<filename-without-extension>` and returns TileJSON, which
is exactly what `territory.tilejson` wants.

**3. Front it with nginx** on whatever host serves your pages, with a
day of cache (tiles change yearly; browsers should not re-ask hourly):

```nginx
location /tiles/ {
    proxy_pass http://127.0.0.1:8080;
    proxy_set_header Host              $host;
    proxy_set_header X-Real-IP         $remote_addr;
    proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    add_header Cache-Control "public, max-age=86400" always;
}
```

**4. Point the config at it:**

```json
"territory": { "tilejson": "https://<your-host>/tiles/services/my-state" }
```

**5. Remember trap 2 from the subdomain recipe:** if this tile host
resolves to loopback from your workstation while the hunt page's origin
looks public, your own browser blocks the tiles and nobody else's does.
The /etc/hosts pin fixes it.

## Verification

1. `curl -s https://<host>/tiles/services/my-state | head -c 200` returns
   TileJSON with your state inside `bounds`.
2. One real tile: take a `tiles` URL template from that TileJSON, fetch
   z6 over your city, expect HTTP 200 and `content-type` protobuf.
3. The hunt map shows your lake/river lines under the counties, in your
   browser, from a machine outside your LAN too.

## The honest interim, if the weekend runs short

OpenFreeMap (openfreemap.org) serves the full planet in OpenMapTiles
schema, free, no key: point `territory.tilejson` at their planet TileJSON
and the map works today. It is a public dependency and therefore not the
doctrine; treat it like scaffolding, ship the weekend, and stand up your
own tiles the following week. Do NOT point at the flagship's tile server
from another state: the coverage ends at the Great Lakes, and coupling two
operators' uptime contradicts the whole design.

## Disk and memory budget, stated plainly

A state: 1-3 GB tileset, any modern disk. Planetiler build: 8-16 GB RAM
for a state (the `-Xmx` flag above), well within the pilot hardware the
stand-up checklist assumes. The flagship's multi-state region runs 2.6 GB
served from a spinning disk without complaint; this is not the hard part
of the weekend, it is just the unfamiliar part.
