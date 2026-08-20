---
title: Two ISPs, One Pi
summary: Armando's Raspberry Pi 5 router — built, cut over, and running
version: Rev 21
updated: 2026-08-20
---

# Two ISPs, One Pi

**Rev 21 — 20 August 2026** · Armando's Raspberry Pi 5 · OpenWrt 24.10.1
(r28597) · prepared by Brad

Latest version: `bradley.io/junior/doc/two-isps-one-pi`

> Working document — it changes as the build progresses. If you're reading a
> printout, check the revision above against the web version before relying on
> an address or a command.

**The cutover is done.** The Pi is the router for the house: DHCP, DNS,
firewall, NAT and filtering for ~55 devices, with Xfinity bridged behind it. One
WAN port is still free, waiting for AT&T Fiber and automatic failover.

---

## ✅ Live as of 20 August 2026 — both ISPs, failover proven

```
AT&T Fiber   wan1   99.150.197.107   PRIMARY   ~6 ms
Xfinity      wan2   174.48.82.27     BACKUP
LAN          eth0   10.0.0.1/24      64 devices
```

**Failover was tested for real, both ways it can fail:**

| Test | Detect | Move | Result |
|---|---|---|---|
| Cable pulled from the Pi | immediate | seconds | ✅ moved to Xfinity |
| **ISP dead, link still up** | **3 s** | **11 s** | ✅ moved to Xfinity |
| Cable restored | — | ~8 s | ✅ failed back to fiber |

The second row is the one that matters. A pulled cable is the easy case; the
common real outage is the box keeping its light on while nothing reaches the
internet. That was simulated by blackholing the tracking IPs, and mwan3 caught
it in three seconds.

**IPv6 is currently off at the LAN** (see below), so failover covers 100% of
household traffic.

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

## Performance — the measured baseline

Taken 20 August 2026, so there is something real to compare against next time
instead of arguing from feel.

| Measured | Result |
|---|---|
| Gateway &rarr; internet (AT&T line itself) | **1.3 Gbps** |
| Phone &rarr; AT&T gateway Wi-Fi | 581 Mbps |
| Phone &rarr; Unifi Wi-Fi | 266 Mbps |
| Pi &rarr; internet, **single** TCP stream | 307 Mbps |
| Through the Pi, theoretical max | **~940 Mbps** (gigabit ports) |

**AT&T delivers the full plan.** The 1.3 Gbps figure is the line, and it is not
flowing through the Pi — it cannot, the Pi's ports are gigabit. Devices behind
the Pi top out around 940.

### How to measure without fooling yourself

**A single TCP stream never shows line rate.** Over any distance it is limited
by latency, not bandwidth. 307 Mbps single-stream is a healthy result on a
gigabit path, not a fault. Real speed tests use 8+ parallel streams.

**Test from a device that holds the public IP.** With IP Passthrough active,
anything else on the AT&T gateway — a phone on its Wi-Fi, for instance — is a
*non-passthrough* client stuck behind the gateway's own NAT, and those are
often badly degraded. Measuring there tells you nothing about the line.

**Separate the Wi-Fi hop from everything else.** Serve a large file from the
router's RAM and fetch it over the LAN — no internet involved, so the number is
purely your Wi-Fi:

```sh
mkdir -p /tmp/speedtest
head -c 300000000 /dev/zero > /tmp/speedtest/test.bin
uhttpd -h /tmp/speedtest -p 8080 -f &
```

Then browse `http://10.0.0.1:8080/test.bin`. Tear it down after:

```sh
killall uhttpd; rm -rf /tmp/speedtest; /etc/init.d/uhttpd start
```

⚠️ `killall uhttpd` also stops **LuCI** — restart it, as above.

### ⚠️ Tools that lie on OpenWrt

Chasing a phantom slowdown here burned an hour on broken measurements. All of
these silently produce believable nonsense:

| Tool | What it does |
|---|---|
| `ping -M do` | not supported by busybox &mdash; **every** size fails, looking like an MTU black hole |
| `stat -c %s` | returns nothing &mdash; byte counts read as 0, so working downloads look like failures |
| `date +%s%N` | no nanoseconds &mdash; elapsed time computes to 0 |
| `timeout`, `/dev/tcp` | do not exist &mdash; port scans report everything closed |

**Always run a control first.** Fetch a file you know exists, count bytes in a
file you know the size of, probe a port you know is open. If the control fails,
the measurement means nothing &mdash; and a broken tool is far more likely than
the exotic fault it appears to show.

---

## Does every layer cover BOTH ISPs?

Yes — but two of them had to be **told**, and one of those lied about it.

| Layer | Both WANs | Why |
|---|---|---|
| **Firewall** | ✅ | `wan` zone contains `wan1`, `wan2`, `wan6` |
| **banIP** | ✅ | interface-bound — **had to be named explicitly** |
| **adblock** | ✅ | DNS layer, inherently |
| **NextDNS** | ✅ | DNS layer, inherently |

**The DNS layers cannot be WAN-dependent.** Blocking happens when a device asks
for a name — before the router has decided which line to send it out of. So
adblock and NextDNS covered the fiber from the moment it came up.

**banIP and the firewall match on interfaces**, so a new WAN is invisible to
them until it is named.

### The trap: banIP's status text was wrong

After adding the fiber, banIP reported:

```
active_devices : wan: wan2, wan1        <- looks correct
```

But the rules it had actually installed said:

```
chain wan-input   iifname != "wan2"  ->  accept
```

Which means **everything arriving on `wan1` skipped every banIP check** —
on the line carrying all the traffic.

**Read the rules, not the status.**

```sh
nft list table inet banIP | grep -E 'iifname|oifname'
```

Correct output names both:

```
iifname != { "wan1", "wan2" } ... accept
```

Fix, if it ever drifts again:

```sh
uci set banip.global.ban_autodetect='0'
uci -q delete banip.global.ban_dev
uci add_list banip.global.ban_dev='wan1'
uci add_list banip.global.ban_dev='wan2'
uci commit banip && /etc/init.d/banip restart
```

**Autodetect is deliberately off.** It follows the *current* uplink — but with
failover the current uplink changes by design, and banIP must cover both lines
whichever one happens to be live.

---

## When a site breaks — which layer is doing it?

Four things can block a name, and they fail in ways that look identical from a
laptop. Check them **in this order** — it takes about a minute and stops you
guessing.

### 0. First, prove the name exists at all

```sh
dig @1.1.1.1 the-broken-name.com
```

Run this from **any machine outside the house** — a phone on cellular is fine.
If that returns `NXDOMAIN`, the name is dead **on the internet** and nothing on
your network is at fault.

> This is not a theoretical step. Chasing "blocked" Let's Encrypt OCSP
> hostnames once cost real time here — they had simply been retired worldwide.
> Always get an outside reading before naming a culprit.

### 1. adblock (on the router)

```sh
ssh root@10.0.0.1
grep -rn "thedomain.com" /tmp/dnsmasq.cfg01411c.d/
```

A hit means adblock. Fix it in **LuCI → Services → Adblock → Allowlist**.

⚠️ Grep for the **whole domain**, not a fragment. Searching `lencr` matches
`elencrepre.cyou` and sends you down the wrong path.

### 2. NextDNS (in the cloud) — the most likely culprit

If adblock has no hit but the router still returns NXDOMAIN, it is NextDNS.

**my.nextdns.io → Logs** shows every query with a timestamp and *which list
blocked it*. That is the definitive record — no guessing.

Fix in **Settings → Allowlist**.

Common false positives: **Native Tracking Protection → Apple** blocks several
domains that turn out to be load-bearing for things people use daily.

### 3. banIP (blocks by IP, not by name)

DNS resolves fine but the connection still fails. Check
**LuCI → Services → banIP → Log**.

### 4. Deliberate blocks — check before "fixing"

| Blocked | Why |
|---|---|
| `mask.icloud.com`, `mask-h2.icloud.com` | **iCloud Private Relay.** Deliberate — it tunnels DNS out of your network, which is the same bypass DoH gives. |
| DoH endpoints (banIP `doh` feed) | Deliberate — this is what makes filtering apply to devices you cannot configure. |

If Private Relay stops working on a Mac or iPhone, that is this, working
correctly.

---

## ⚠️ Your NextDNS settings are NOT in any backup

The router stores exactly one thing about NextDNS:

```
nextdns.main.config = 'a41d67'
```

That is the profile ID and nothing else. **Every allowlist entry, category
rule and per-device setting lives in NextDNS's cloud**, not on the Pi.

So the config backup and the recovery image will faithfully restore a router
that points at profile `a41d67` — and if that profile were ever lost or badly
edited, nothing on your side could rebuild it.

**Keep your own note of the allowlist entries**, somewhere off the router. A
text file on your PC is enough. It is the one part of this system that has no
local copy.

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

> **The image carries the password you set**, not the original placeholder —
> `/etc/shadow` is baked in. Verified 20 August 2026: the root password is no
> longer the default.

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

## Heat — how to check it, and what the numbers mean

The Pi feels hot to the touch. That is the heatsink doing its job: conducting
heat *out* of the chip. A cool case would mean the heat was staying inside.

### Check it in one command

```sh
ssh root@10.0.0.1
cat /root/thermal/temp.log | tail -20
```

Each line is:

```
2026-08-20T15:40   52.3   3607   75   0x0   0.69
     time          degC   fanRPM  pwm  throt load
```

A sample is taken every 5 minutes and about 30 days are kept. The logger is
listed in `/etc/sysupgrade.conf`, so restoring a backup will not silently drop
it.

For a single reading right now:

```sh
vcgencmd measure_temp        # temperature
vcgencmd get_throttled       # the number that actually matters
cat /sys/class/hwmon/hwmon*/fan1_input   # fan RPM - 0 means not spinning
```

### What the numbers mean

| Reading | Meaning |
|---|---|
| **under 60 °C** | normal. Nothing to do. |
| 60–70 °C | warm but fine. Worth knowing why — hot day, or heavy traffic. |
| 70–80 °C | getting close. Check airflow and where it is sitting. |
| **80 °C+** | the Pi starts slowing itself down to survive. |
| 85 °C | hard limit. |

**`get_throttled` is the number to trust.** It is a *sticky* flag: once the Pi
throttles or browns out, the bit stays set until reboot. So a clean `0x0` after
days of uptime is proof it has never been in trouble — far better evidence than
any single temperature reading.

```
throttled=0x0     ← never throttled, never undervolted. Good.
anything else     ← it has happened at least once. Investigate.
```

### The attic

Ambient temperature is the real risk, not the workload. The Pi runs roughly
25–30 °C above the air around it, so:

```
25 °C room   →  ~52 °C chip     fine
40 °C attic  →  ~67 °C chip     warm, still fine
55 °C attic  →  ~82 °C chip     THROTTLING
```

Measured at 15:40 on 20 August — close to the worst moment of a Florida
afternoon — it read **52.3 °C with `0x0`**. That means wherever it is sitting
is much cooler than the attic's peak. Good news, but one afternoon is not a
summer, which is why it is now logged.

**If the log ever shows sustained 70 °C+, or `get_throttled` stops being
`0x0`, move the Pi out of the attic.** Better cooling cannot help when the air
itself is hot — a fan can only move air that is already too warm. It does not
need to live up there; it only needs to be where the cables are.

Meanwhile: keep the vents clear and do not sit it on carpet, insulation, or
anything that traps heat underneath.

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

## IPv6 — currently OFF at the LAN

Turned off deliberately on 20 August. The reason is worth understanding.

IPv4 exits via AT&T, but IPv6 was still exiting via **Comcast** — `wan6` rides
`wan2`. Since almost every large site is dual-stack and devices *prefer* IPv6,
a large share of household traffic was still leaving on the demoted line, and
**outside the failover entirely**. Failing over IPv4 while IPv6 quietly stayed
on the other ISP is the worst of both worlds.

Two ways to fix that: get IPv6 from AT&T, or switch it off. You chose off for
now.

```sh
dhcp.lan.ra='disabled'
dhcp.lan.dhcpv6='disabled'
dhcp.lan.ndp='disabled'
network.lan.ip6assign          removed
dhcp.@dnsmasq[0].filter_aaaa='1'
```

**`filter_aaaa` is the line that makes it immediate.** Disabling RA only stops
*new* advertisements — devices keep the IPv6 addresses they already hold until
the lifetimes expire, which can take hours. Making the resolver stop returning
AAAA records is what changes behaviour now.

`wan6` is deliberately **left intact**, so the router keeps its own IPv6
upstream and re-enabling later (or moving it to AT&T) is a small change.

### The two AAAA records that remain, and why they should

`www.google.com` and `www.youtube.com` still return IPv6. That is not a leak —
it is **adblock's SafeSearch** feature, which rewrites those names to
`forcesafesearch.google.com` as *local authoritative* records. `filter-AAAA`
only strips answers dnsmasq **forwards**, so locally-answered records pass
through untouched.

That is the SafeSearch enforcement you asked for as part of content filtering.
Leave it.

---

## Failover alerts — log now, email when you're ready

Every mwan3 transition is recorded automatically. mwan3 calls
`/etc/mwan3.user` on each event, which runs `/usr/bin/junior-wan-alert`.

**The log works with no setup at all:**

```sh
ssh root@10.0.0.1
cat /root/wan/events.log
```

```
2026-08-20 15:29:01  DOWN      AT&T Fiber (wan1) - traffic now on Xfinity
2026-08-20 15:30:07  RESTORED  AT&T Fiber (wan1) after 66s down - traffic now on AT&T Fiber
```

Last 2000 events are kept, and the log is listed in `/etc/sysupgrade.conf` so a
restore does not lose it. **This is the evidence to quote at an ISP** when they
tell you the line never went down.

### Turning on email

Edit `/etc/junior-alert.conf` (mode `600`):

```sh
MAIL_TO="you@example.com"
MAIL_FROM="router.alerts@gmail.com"
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="router.alerts@gmail.com"
SMTP_PASS="16-character-app-password"
```

Nothing else to restart — the next failover sends mail.

> ### ⚠️ Do not use Comcast's or AT&T's SMTP server
>
> During an outage on that line the alert would fail to send — exactly when you
> need it. Use Gmail or similar, which goes out over whichever WAN is still up.

**Gmail needs an App Password, not your account password:**

1. Google Account → **Security** → enable **2-Step Verification**
2. Go to **myaccount.google.com/apppasswords**
3. Create one named "router" → you get 16 characters
4. Put that in `SMTP_PASS`

**Use a dedicated or secondary account.** That password is stored on the router
and `/etc` is baked into the recovery image. An app password can be revoked on
its own without touching the main account — which is the whole reason to use
one.

Test without waiting for a real outage:

```sh
/usr/bin/junior-wan-alert wan1 disconnected
/usr/bin/junior-wan-alert wan1 connected
```

---

## Still to do

1. **Get IPv6 from AT&T.** They support DHCPv6-PD, so `wan1` can carry both
   stacks and failover would cover IPv6 as well. IPv6 is currently switched off
   at the LAN precisely because it was leaving via the *other* ISP and sitting
   outside the failover.

2. **Starlink as a third line.** Both USB 3 ports are used, but **both USB 2
   ports are free** — a third adapter there caps around 300 Mbps, which is
   irrelevant for Starlink. That gives AT&T → Xfinity → Starlink, all
   automatic.

   **Needs: one more USB ethernet adapter.** Same model as the two already
   fitted is the safe choice.

   ⚠️ **Starlink needs far more forgiving thresholds than a wired link.** It
   drops for a second or two routinely — satellite handoffs, obstructions,
   reroutes — which is normal, not a fault. On the settings used for the wired
   lines it would be marked dead constantly and flap traffic back and forth.
   Also, Starlink is behind **CGNAT**, so no inbound connections while failed
   over to it.

3. **Buying faster USB dongles — read this first.**

   **Buy TWO fast ones, not three.** The Pi has only **two USB 3 ports**, and
   a 2.5 GbE dongle in a USB 2 port is capped around **300 Mbps** — money spent
   on speed the port cannot carry.

   **Chipset: RTL8156B (2.5 GbE).** `kmod-usb-net-rtl8152` is already
   installed, so it works with nothing to configure. Aquantia 5 GbE
   (`kmod-usb-net-aqc111`) is available but not installed, runs hotter, and has
   patchier support — only worth it if you actually go past 2.5 G.

   **Where to put them.** Both gigabit bottlenecks matter — the WAN coming in
   *and* the LAN going out. Put the fast links there and give the slow ISPs the
   slow ports:

   | Port | Speed | Use |
   |---|---|---|
   | USB 3 #1 | 2.5 G | **AT&T Fiber** |
   | USB 3 #2 | 2.5 G | **LAN** — otherwise the house is still capped at 940 |
   | `eth0` built-in | 1 G | **Xfinity backup** (~200 Mbps, fits) |
   | USB 2 | 1 G | **Starlink** (~200 Mbps, fits) |

   This frees the built-in port for a slow WAN instead of spending a 2.5 G slot
   on one. For the Starlink slot, one of the existing AX88179A adapters is
   fine — no need to buy a third.

   ⚠️ **A 2.5 G WAN alone changes nothing** if the LAN side stays gigabit. They
   have to be upgraded as a pair, along with a 2.5 GbE switch, or the ceiling
   does not move.

   #### What to actually buy

   **The chipset matters more than the brand.** Insist the listing says
   **RTL8156B** (or RTL8156). That is the part `kmod-usb-net-rtl8152` already
   drives. Many cheap adapters do not say which chip they use — skip those,
   because the ones that hide it are usually the ones with poor Linux support.

   Known-good RTL8156B USB-A 2.5 GbE adapters:

   | Adapter | Chipset | Note |
   |---|---|---|
   | **Plugable USB3-E2500** | RTL8156B | states Linux support explicitly |
   | **UGREEN CM275** (a.k.a. 30287) | RTL8156B | widely available |
   | **CableCreation CD0673** | RTL8156B | common, inexpensive |
   | **StarTech US2GA30** | RTL8156 | pricier, well documented |

   *Buy 2.* Availability changes constantly — verify the chipset on the
   listing rather than trusting the model number alone.

   2.5 GbE switches (unmanaged is fine):

   | Switch | Ports |
   |---|---|
   | **TP-Link TL-SG105-M2** | 5 × 2.5 G |
   | **TP-Link TL-SG108-M2** | 8 × 2.5 G |
   | **QNAP QSW-1105-5T** | 5 × 2.5 G |
   | **Netgear MS105** | 5 × 2.5 G |

   **Already fitted, for reference:** 2 × **ASIX AX88179A** USB 3 gigabit
   (`6c:6e:07:2d:9d:10` = wan1, `6c:6e:07:2d:a4:c2` = wan2). One of these moves
   to the Starlink slot — do not buy a third adapter for it.

   #### Verifying a new adapter after it arrives

   ```sh
   lsusb                                  # should show Realtek
   dmesg | grep -i r8152                  # driver bound?
   cat /sys/class/net/<name>/speed         # must read 2500, not 1000
   ```

   If `speed` reads **1000**, either the cable is Cat5e-or-worse, the switch
   port is gigabit, or the adapter is not what the listing claimed.

   ⚠️ **Cat5e is the practical minimum** and **Cat6 is safer** for 2.5 G over
   any real distance. An old Cat5 run will silently negotiate down and you will
   spend an evening blaming the adapter.

4. **Faster than 1 Gbps? Decide before paying for it.** The current plan is
   1200 Mbps and this router can pass about **940** — both USB adapters and the
   Pi's own LAN port are gigabit. Two options, and they point in opposite
   directions:

   - **Down:** drop to the 1 Gbps tier and lose nothing real.
   - **Up:** to actually exceed a gigabit you need a **2.5 GbE USB adapter on
     the WAN**, another **on the LAN**, a **2.5 GbE switch**, and the BGW320's
     **5 Gb port** instead of a 1 Gb one. Then the Pi 5's CPU becomes the
     limit — realistically **1.4–1.9 Gbps** with flow offloading on. Beyond
     that the Pi is the wrong box.

   Worth noting every device in the house is gigabit today, so nothing can
   currently use more than 940 anyway.

5. **Turn off the AT&T gateway's Wi-Fi.** Anything joining it lands on
   `192.168.1.x`, behind the gateway and in front of the Pi — **no adblock, no
   NextDNS, no banIP**, and no access to your LAN.

6. **Configure email alerts** — see the section above. The log already works.

7. **Write down your NextDNS allowlist entries.** They live only in NextDNS's
   cloud and are in no backup.

8. **NextDNS categories** — the dashboard sees all devices by name, so this is
   the moment to set adult/social/gaming rules, per device if you want.

9. **Remove the VPN trust** — Brad's WireGuard tunnel reaches the Pi only
   (LAN forwarding already removed). Drop it entirely when `/junior` is torn
   down.

### Throughput ceiling, so it isn't a surprise

The AT&T plan is 1200 Mbps. **This router can pass about 940.** Both USB
adapters and the Pi's own LAN port are gigabit — two independent caps. Since
every device in the house is gigabit too, nothing can actually use more, but
you are paying for headroom that physically cannot arrive. Dropping to the
1 Gbps tier would cost you nothing real.

Software **flow offloading is enabled**, which is what gets the Pi close to
that ceiling instead of making the CPU touch every packet.

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
