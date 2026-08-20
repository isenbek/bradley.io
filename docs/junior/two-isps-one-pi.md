---
title: Two ISPs, One Pi
summary: Armando's Raspberry Pi 5 router — built, cut over, and running
version: Rev 12
updated: 2026-08-20
---

# Two ISPs, One Pi

**Rev 12 — 20 August 2026** · Armando's Raspberry Pi 5 · OpenWrt 24.10.1
(r28597) · prepared by Brad

Latest version: `bradley.io/junior/doc/two-isps-one-pi`

> Working document — it changes as the build progresses. If you're reading a
> printout, check the revision above against the web version before relying on
> an address or a command.

**The cutover is done.** The Pi is the router for the house: DHCP, DNS,
firewall, NAT and filtering for ~55 devices, with Xfinity bridged behind it. One
WAN port is still free, waiting for AT&T Fiber and automatic failover.

---

## The numbers you'll actually need

| | |
|---|---|
| **Router (LuCI / ssh)** | **`http://10.0.0.1`** · `ssh root@10.0.0.1` |
| Public IP | `174.48.82.27` (Xfinity, bridged) |
| LAN | `10.0.0.0/24` — Pi is `.1` |
| Reserved | `.1`–`.19` (never handed out) |
| DHCP pool | `.20`–`.250`, 12h leases |
| UniFi controller | `10.0.0.3` (reserved to its MAC) |
| IPv6 | `2601:586:400:135::/64` delegated, dual-stack |
| Recovery Wi-Fi | join `pi-rescue` → `http://192.168.98.1` |
| Recovery cable | laptop `192.168.99.2/24` → `http://192.168.99.1` |

⚠️ **`192.168.98.1` is over the air. `192.168.99.1` is over a cable** plugged
straight into the Pi. They look alike and are completely different routes —
**98 = Wi-Fi, 99 = cable**.

---

## How it's wired

```
Xfinity gateway (BRIDGE MODE)  ──→  wan2   174.48.82.27   ← live
AT&T Fiber (not installed yet) ──→  wan1                  ← free
                                      │
                                     Pi     10.0.0.1
                                      │     DHCP · DNS · firewall · NAT
                                      ▼
                            eth0 ──→ attic switch ──→ ~55 devices, 12 UniFi APs

Starlink — standalone Wi-Fi, manual last resort, not wired to the Pi.
```

### The ports, by MAC

| Name | MAC | Hardware | Job |
|---|---|---|---|
| `eth0` | `88:a2:9e:99:4f:e7` | Built-in ethernet | **LAN** → the switch |
| `wan2` | `6c:6e:07:2d:a4:c2` | ASIX AX88179A, USB 3 | **Xfinity**, live |
| `wan1` | `6c:6e:07:2d:9d:10` | ASIX AX88179A, USB 3 | **free** — for the fiber |
| `phy0-ap0` | `88:a2:9e:99:4f:e8` | Built-in Wi-Fi | recovery AP `pi-rescue` |

The names are **pinned to MAC addresses** by
`/etc/hotplug.d/net/20-junior-nicnames`. USB devices are otherwise numbered in
whatever order the kernel finds them, so without this the two adapters could
swap on any reboot — silently exchanging your primary and backup ISP.

> Note `wan2` carries Xfinity and `wan1` is the spare. That reads backwards, and
> it's fine: the names were assigned before either had a cable, and `mwan3`
> chooses by *metric*, not by name. Moving the cable to make the numbers tidy
> would risk more than it's worth.

---

## What's running

| | State | |
|---|---|---|
| Routing / NAT | ✅ | ~55 devices, IPv4 + IPv6 |
| DHCP | ✅ | pool `.20`–`.250`, controller reserved at `.3` |
| Firewall | ✅ | `input REJECT`, `forward REJECT`, `lan→wan` only, SYN-flood protection |
| **adblock** | ✅ | 313,909 ad/tracker/malware domains |
| **NextDNS** | ✅ | profile `a41d67`, DNS-over-HTTPS, per-device reporting |
| **Force-DNS** | ✅ | every port-53 query intercepted — no device can bypass filtering |
| **banip** | ✅ | 7,985 addresses — malicious IPs **+ DoH providers**, guarding `wan2` |
| IPv6 | ✅ | delegated `/64`, RA + DHCPv6 serving the LAN |
| `mwan3` failover | ⏸ dormant | waiting for a second ISP |

### From the internet, the Pi is invisible

Verified by scanning the public IP from a machine on another network:

```
tcp 22, 23, 53, 80, 443, 7547, 8080, 8443  →  all closed
ICMP ping (IPv4 and IPv6)                  →  no reply
LAN devices over IPv6                      →  no reply, no open ports
```

That last one matters: **IPv6 has no NAT**, so every device holds a globally
routable address. Nothing hides them except the firewall. Inbound forwarding is
rejected, and `echo-request` is no longer passed through, so the prefix can't be
swept for live hosts.

Deliberately **kept**: `packet-too-big`, `destination-unreachable`,
`time-exceeded` and the IPv6 neighbour/router messages. Those carry Path MTU
Discovery and IPv6 addressing itself — blocking "all ICMP" is how people create
networks where small pages load and large downloads stall forever.

---

## Are all DNS queries going through the Pi?

**Yes for ordinary DNS — proven, not assumed.** The Force-DNS rule counter:

```
udp dport 53 → redirect :53    counter 2,455 packets, 164 KB
```

Those are devices that tried to reach an outside DNS server (a smart TV
hardcoded to `8.8.8.8`, say) and were silently redirected to the Pi instead.

| Method | Port | Forced through the Pi? |
|---|---|---|
| Plain DNS | udp/tcp 53 | ✅ intercepted |
| DNS-over-TLS (DoT) | tcp 853 | ✅ visible — 0 flows, nothing uses it |
| **DNS-over-HTTPS (DoH)** | **tcp 443** | ⚠️ see below |

### The DoH hole, and what we did about it

DoH is deliberately built to look exactly like ordinary web traffic. At the
packet level it's indistinguishable from loading a website, so **no firewall
rule can catch it by port**. Firefox enables it by default in the US, Chrome
uses it when available, and some TVs and streaming sticks hardcode it
specifically so they can't be filtered.

**Mitigation: the `doh` feed was added to banIP** (2026-08-16). It blocks the
addresses of known DoH providers, so DoH fails and devices fall back to plain
DNS — which lands on the Pi. Blocklist went from 3,976 to **7,985** addresses.

It can't be perfect: it's an IP list, and new DoH endpoints appear. But it turns
"filtering works for cooperating devices" into "filtering works".

### ✅ Verified on a real device, 2026-08-16

Before the `doh` feed, a Mac could reach sites the filter was supposed to block
— its browser was doing DNS-over-HTTPS straight to `1.1.1.1`, invisible to a
port-53 rule. Installing the NextDNS app **on the Mac** fixed it, which was the
clue: that machine was not using the Pi's resolver at all.

After adding the feed, the NextDNS app was **switched off on the Mac** and the
site was **still blocked**. So the filtering is happening at the router, and no
device needs local software.

That matters because the devices you most want filtered — TVs, cameras,
streaming sticks — are exactly the ones you cannot install anything on.

Both Mac bypass routes are covered:

| Route | Status |
|---|---|
| Browser DoH (Safari / Chrome / Firefox) | blocked — 775-address feed incl. `1.1.1.1`, `8.8.8.8`, `9.9.9.9` |
| iCloud Private Relay | blocked — `mask.icloud.com`, `mask-h2.icloud.com` |

banIP hooks the `lan-forward` chain, so this applies to traffic **from** your
devices heading out, not just inbound attacks.

Keeping the NextDNS app on a laptop is still worthwhile — it filters when you're
away from home. You just don't need it on your own network.

### If something breaks because of it

It looks like **one app or device that won't load while everything else is
fine** — usually a smart TV, a streaming stick, or a browser that insisted on
DoH. Most fall back within seconds and you never notice.

**The undo, one command:**

```sh
ssh root@10.0.0.1 "uci del_list banip.global.ban_feed='doh'; uci commit banip; /etc/init.d/banip restart"
```

Or in LuCI: **Services → banIP → Feeds**, untick `doh`, Save & Apply. ~90
seconds to take effect, nothing else touched.

Verified working after the change: google, youtube, apple, icloud, nest, sonos,
spotify all resolve. Netflix, Amazon and Ring resolve but don't answer ping —
**that's normal for AWS/CloudFront**, not a symptom.

---

## Where do I configure NextDNS?

**Two different places, and the one you want is the website.**

| Where | What you set there |
|---|---|
| **nextdns.io** (your browser) | **All the filtering** — categories (adult, social, gaming), blocklists, allow/deny lists, per-device profiles, query logs |
| **LuCI → Services → NextDNS** | Only the plumbing — profile ID, on/off, client reporting. **Already done, needs nothing.** |

On nextdns.io: **Parental Control** for category toggles, **Privacy** for
blocklists, **Settings → Devices** for per-device rules. All ~55 devices now
appear there by name, because client reporting is enabled on the Pi.

Profile `a41d67` is connected over DNS-over-HTTPS and confirmed working.

---

## The recovery kit — download these

On **`/junior`**, above the terminal, there is a **Recovery kit** panel:

| File | What it's for |
|---|---|
| **Recovery image** (14.4 MB) | Write to a fresh SD card and the new Pi **is** the router — nothing to configure |
| **Config backup** (18 KB) | Restore onto a working Pi via LuCI |
| **sha256sums** | Verify a download before trusting it |

⚠️ **These contain secrets** — the WireGuard private key, the root password
hash, ssh host keys, the NextDNS profile. Keep them as private as a password.
Never put them anywhere public.

### What makes the image "flash and go"

Built from the **live configuration of the running router**, verified to
contain: the full network config (`lan 10.0.0.1`, `wan1`, `wan2`, `wan6`,
`wg0`, both recovery paths), firewall, DHCP, NextDNS, banIP, adblock, mwan3,
the MAC-pinning hotplug rule, ssh keys with correct `700`/`600` permissions,
and all the extra packages preinstalled — so a fresh card needs no internet to
become the router.

The original first-boot script is **deliberately excluded**: it rewrote network
and firewall settings on first boot, which was right for a blank Pi and would
now overwrite everything we baked in.

---

## Backup and recovery

### Where the config lives

Plain text in **`/etc/config/`** — `network`, `firewall`, `dhcp`, `wireless`,
`adblock`, `banip`, `nextdns`, `system`. On the overlay filesystem; survives
reboots and power cuts.

### Make your own backup — 30 seconds, do it before any change

**LuCI → System → Backup / Flash Firmware → Generate archive.** Downloads a
`.tar.gz` to your computer. Keep it somewhere that isn't the Pi.

Or over ssh:

```sh
ssh root@10.0.0.1 sysupgrade -b /tmp/backup.tar.gz
scp root@10.0.0.1:/tmp/backup.tar.gz .
```

### ⚠️ The trap: backups skip custom files by default

`sysupgrade` saves `/etc/config/` plus a fixed default list — **not** anything
custom. The first backup taken here was missing
`/etc/hotplug.d/net/20-junior-nicnames`. Since `/etc/config/network` refers to
the names that rule creates, restoring without it gives you a router with **no
WAN at all**.

Fixed by naming the extra paths in `/etc/sysupgrade.conf`:

```
/etc/hotplug.d/net/
/etc/adblock/
/etc/banip/
/etc/nextdns/
```

**Add any future custom file's path there too**, or it vanishes silently on the
next restore or firmware upgrade.

### Restoring

**LuCI → System → Backup / Flash Firmware → Upload archive**, then reboot. Or:

```sh
scp backup.tar.gz root@10.0.0.1:/tmp/
ssh root@10.0.0.1 "sysupgrade -r /tmp/backup.tar.gz && reboot"
```

### Restoring onto a freshly flashed Pi

The backup holds **configuration, not software**. Install the packages *first*,
then restore — otherwise installing them overwrites the restored config with
defaults:

```sh
opkg update
opkg install mwan3 luci-app-mwan3 banip luci-app-banip \
             adblock luci-app-adblock nextdns luci-app-nextdns \
             luci-app-commands
```

### Off-device copy

Brad holds one on impera at `~/junior-backups/` — 18 KB, 53 files, taken
2026-08-16 11:52 right after the cutover, plus `packages.txt`. Known-good.

**Take your own copy as well.** A backup only Brad has is a dependency, not a
safety net.

---

## Failover, when the fiber arrives

### First: AT&T's version of bridge mode is called **IP Passthrough**

You cannot truly bridge an AT&T Fiber gateway. The BGW320 authenticates to the
fiber line itself (802.1X, with a certificate baked into the box), so it can
never be removed from the path the way the Xfinity modem was. Don't chase it —
people burn weekends on this.

**IP Passthrough** is the supported equivalent and it is good enough: the
gateway keeps running, but hands its **public IP straight to one device you
name**, and takes its own NAT and firewall out of that device's way.

**Set it up like this:**

1. Plug a laptop into any **yellow LAN port** on the BGW320 and open
   `http://192.168.1.254`
2. **Device Access Code** — printed on the sticker on the side of the gateway
3. **Firewall → IP Passthrough**
4. Allocation Mode: **Passthrough**
5. Passthrough Mode: **DHCPS-fixed** — this pins it to one MAC, which is what
   you want. `Manual` and the DHCP-lease modes drift.
6. Passthrough Fixed MAC Address: the Pi's free USB adapter —

   ```
   6c:6e:07:2d:9d:10        ← wan1, the empty one
   ```

7. **Save.** The gateway reboots, about two minutes.
8. Now run a cable from a BGW LAN port to that same USB adapter on the Pi.

**The good news: this one is not a cutover.** Unlike the Xfinity day, AT&T is a
*new* line that isn't carrying anybody's internet yet. Nothing you do to that
gateway can take the house offline. Take your time.

**Leave yourself a way back in.** Keep a free LAN port on the BGW so a laptop
can always reach `192.168.1.254` to undo the passthrough. Same rule as the
recovery AP: build the way back *before* you need it.

**Turn the gateway's Wi-Fi OFF.**

Passthrough does not disable it. The BGW320 keeps broadcasting its own SSID,
and anything that joins it lands on the gateway's `192.168.1.x` network —
**behind the gateway, in front of the Pi**. Those devices get:

- no adblock, no NextDNS, no banIP — **none of the filtering**
- no access to your `10.0.0.x` LAN, printers or Unifi gear
- no visibility to you at all

It is a shadow network that walks straight around everything we built. Exactly
the same class of hole as a laptop using its own DNS — and harder to spot,
because it looks like working Wi-Fi.

You already have Unifi APs covering the house, so there is nothing to lose:

```
Home Network → Wi-Fi → disable 2.4 GHz and 5 GHz
```

The **wired** LAN ports keep working, so your `192.168.1.254` escape hatch is
unaffected.

> **This applies to AT&T only.** The Xfinity box needs nothing — bridge mode
> already switched its radios off. See below.

**Two things to know afterwards:**

- The gateway still runs its own network on `192.168.1.x` for anything else
  plugged into it. That's fine — it doesn't collide with your `10.0.0.x`.
- Once passthrough is live, `wan1` should get a **public** address. If it comes
  up holding a `192.168.1.x`, passthrough did not take — re-check the MAC.

**Before the cable goes in**, `wan1` is deliberately inert:

```sh
network.wan1.disabled='1'   # nothing happens when you plug in
network.wan1.metric='40'    # can never steal the route from Xfinity
network.wan1.peerdns='0'    # AT&T's DNS can never reach dnsmasq
```

That second and third line are permanent. The metric keeps DHCP timing from
ever deciding who's primary — once `mwan3` runs, **`mwan3` decides**. The
`peerdns` line stops AT&T's resolvers being appended to dnsmasq's upstream
list, which would quietly punch a hole straight through NextDNS and adblock for
a share of every lookup.

Bring `wan1` up only when someone's watching:

```sh
uci del network.wan1.disabled
uci commit network && /etc/init.d/network reload
```

### Then the failover itself

You never touch it — that's `mwan3`'s whole job.

Each WAN pings **tracking IPs** continuously out its own interface.
Deliberately *not* the ISP's gateway: that stays up even when the ISP's upstream
is broken, which is exactly the outage that matters.

```
track_ip     1.1.1.1  8.8.8.8  9.9.9.9
interval     5      # seconds between checks
down         3      # consecutive failures → offline
up           3      # consecutive successes → back online
```

≈15 seconds to detect an outage, then traffic moves on its own. When the link
returns and holds, traffic goes back — **failback is automatic too**. Priority
is set by **metric**: lower wins, so fiber gets 1 and Xfinity 2.

### The part nobody mentions until it bites

**Failover breaks connections that are already open** — not the internet, the
*connections*. Your public IP changes, so anything mid-flight dies: video calls
drop, SSH freezes, big downloads fail. Anything started afterwards is fine. It
feels like "everything hiccuped for ten seconds", not "the internet went out."

**Failback does the same thing**, which is why the `up` threshold isn't eager —
better to sit on the backup than bounce and break connections every minute.
Avoiding it entirely needs your own IP block and BGP. Not a house-scale thing.

**Blocking inbound ping does not affect this.** `mwan3` sends *outbound* pings
and the replies return as established flows. Verified: all four tracking IPs
answer through `wan2`.

---

## Where things are in LuCI

`http://10.0.0.1`

| What | Menu path |
|---|---|
| **Power Off / Reboot buttons** | System → **Custom Commands** → Dashboard |
| Ad / malware blocking | Services → **Adblock** |
| Bot / malicious IPs | Services → **banIP** |
| Category filtering | Services → **NextDNS** |
| ISP failover | Status → **MultiWAN Manager** |
| Firewall | Network → **Firewall** |
| DHCP & DNS | Network → **DHCP and DNS** |
| Interfaces | Network → **Interfaces** |
| Backup / restore | System → **Backup / Flash Firmware** |

⚠️ It's **MultiWAN Manager**, not "Load Balancing" — that was the old name and
it's easy to hunt for the wrong label. It sits under *Status*, not *Network*.

⚠️ **Power Off has no confirmation prompt.** One click and the household router
halts, in the attic. Be deliberate.

There is no `shutdown` command on OpenWrt — it's `poweroff`, `reboot`, `halt`.
The LED stays lit after `poweroff`; wait for the activity light to stop
flickering, then unplug.

---

## If it all goes wrong

| Route | How | When |
|---|---|---|
| Normal | `http://10.0.0.1` | Any time the LAN works |
| **Recovery Wi-Fi** ✅ tested | join `pi-rescue` → `http://192.168.98.1` | No internet, no LAN, no cable needed |
| Direct cable | laptop → `192.168.99.2/24`, then `http://192.168.99.1` | Always. Needs nothing but the Pi |

The first-boot log is at `/root/cb-rpi5-firstboot.log`. Log in as `root` —
passwords aren't written here on purpose.

**Everything is reversible.** Plug the switch back into the Xfinity gateway and
turn bridge mode off, and you're back to where you started in about ten minutes.

### The Xfinity box has no admin IP now. That's correct, not broken.

Bridge mode tells the modem to **stop being a router**. It deliberately gives
up three things:

- its DHCP server
- its LAN admin page
- **its Wi-Fi radios** — which is why the Xfinity box needs no Wi-Fi cleanup

So "I can't reach it" is the expected result, not a failure. The proof it is
healthy is that the house is online through it and the Pi holds a public
address handed straight past it.

**It is still reachable if you want it.** Cable modems keep a hardcoded
diagnostic page that survives bridge mode:

```
http://192.168.100.1
```

Plug a laptop directly into the modem and give it a static address:

```
IP      192.168.100.10
Mask    255.255.255.0
```

Signal levels, uptime, firmware. Read-only, but it tells you whether the line
itself is healthy — useful when you cannot tell if an outage is Comcast or us.

*(Confirmed from the Pi with a TTL-1 ping: something answered without crossing
a single router, so the responder is the modem on the local link — not
Comcast's equipment upstream pretending to be it.)*

**To turn bridge mode off you do not need the box at all.** It is toggled from
the **Xfinity app** — *WiFi → View WiFi equipment → Advanced Settings → Bridge
Mode* — or at `xfinity.com/myaccount`.

Last resort is the paperclip reset, held 30 seconds, which returns it to router
mode. That also wipes its Wi-Fi names and passwords, so it is a last resort,
not a first move.

---

## Still to do

1. **Starlink as the second WAN** — AT&T Fiber isn't available yet, but
   Starlink can be bridged, so failover can be **built and tested now** rather
   than waited for. When fiber arrives it takes whichever port suits.

   ⚠️ **Starlink needs much more forgiving thresholds than a wired link.** It
   drops for a second or two regularly — satellite handoffs, obstructions,
   reroutes — which is normal, not a fault. On `mwan3` defaults it would be
   marked dead constantly and your traffic would flip back and forth, breaking
   connections every time. Higher `down`/`up` counts and a longer interval.
   This is the one part of the build that genuinely needs care.

   Also: Starlink is behind **CGNAT**, so no inbound connections while failed
   over to it. Fine for a backup.
2. **NextDNS categories** — the dashboard now sees all 55 devices by name, so
   this is the moment to set adult/social/gaming rules, per device if you want.
3. **Rotate the root password** — still the placeholder, and this is real
   infrastructure now.
4. **Remove the VPN trust** — Brad's WireGuard tunnel currently has full access
   to the LAN (`vpn2lan` / `lan2vpn` forwarding). Fine while he's helping;
   remove it when `/junior` is torn down.

---

## What went wrong on cutover day, and why

Three faults, all found and fixed. Worth reading before the next one.

**IPv6 pointed nowhere.** The Phase 4 script deleted the old `wan6` interface
along with the old WAN, so the Pi had no IPv6 path — but its DNS kept answering
with IPv6 addresses. Devices tried a road that didn't exist. Now properly
restored with a delegated prefix.

**`no-dhcp-interface=eth0`** — the big one. The recovery interface
(`192.168.99.1`) shares the physical port with the LAN, and its "don't hand out
addresses here" flag applied to the **whole device**, silently disabling DHCP
for the entire LAN. Devices holding old leases kept working perfectly, so a
dozen things were online and everything looked healthy. Only devices needing a
*new* address failed.

The evidence that cracked it: every DHCP request in the log arrived on
`phy0-ap0`, and not one on `eth0`.

**A dead default route.** After bridge mode engaged, `eth0` still held a route
to `10.0.0.1` — the gateway that had just ceased to exist — at a better metric
than the working WAN. The Pi kept sending traffic to a machine that was gone.

---

## Two habits worth stealing

**Bind to what the hardware asserts about itself, never to the order things
happened to appear.** USB adapters pinned by MAC; the ISP cable identifying its
own adapter rather than anyone labelling by guess; the UniFi controller given a
reserved address so twelve APs never go looking. Names that describe *discovery
order* are temporary. Names that describe *the thing itself* survive.

**When two faults produce the same error, fixing the first changes nothing and
looks like failure.** The ssh problem that opened this project was a
permissions bug *and* a wrong key. The cutover was a dead route *and* a disabled
DHCP server. Check the simple, checkable fact first — read the file, list the
keys, look at the log — before building a theory that explains the symptom.
