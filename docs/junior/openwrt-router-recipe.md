---
title: OpenWrt Router Recipe
summary: What actually worked — a reusable recipe for turning a Pi into a filtered, dual-WAN home router, remotely
version: Rev 1
updated: 2026-08-17
---

# OpenWrt Router Recipe

**What actually worked.** Distilled from building Armando's Pi 5 into the router
for a 68-device house — remotely, over a tunnel, with the owner in an attic and
no second pair of hands.

**KEEP THIS.** It outlives the `/junior` page it currently sits behind. Move it
to `docs/` at teardown.

---

## The shape of it

```
ISP gateway (BRIDGED) ──→ USB NIC  "wan1"   ← primary
second ISP            ──→ USB NIC  "wan2"   ← backup
                              │
                            Pi 5    10.0.0.1
                              │     DHCP · DNS · firewall · NAT · filtering
                              ▼
                       built-in eth0 ──→ switch ──→ the house
```

A Pi has **one** ethernet port. Two USB 3 adapters make it a three-port router.
At ~200 Mbps per ISP that is ~25× more headroom than needed — do not overthink
the NICs.

---

## The rules that mattered most

### 1. Build a second way in *before* you need it

The single highest-value hour of the whole project was standing up a **recovery
Wi-Fi AP** on the Pi's own radio, on its own subnet, and **testing it with a
real phone** — association, DHCP lease, admin page — before touching anything
risky.

It changes the emotional character of the work. Once a proven fallback exists,
every subsequent step is reversible, and you can afford to break things.

Also keep a **wired** fallback that needs nothing at all: a static alias on the
LAN port (`192.168.99.1`), reachable by plugging a laptop straight in.

> Use clearly *different* numbers for different routes. `192.168.98.1` (Wi-Fi)
> and `192.168.99.1` (cable) look nearly identical on a phone screen in an
> attic. It cost us a confused exchange; make them distinct.

### 2. Never cut the branch you are sitting on

The remote-admin problem: the cable you must reconfigure is the cable you are
connected through.

**Solution — give the router a second, independent path first.** Run a cable
from a spare port on the *existing* gateway straight to a USB NIC. Now the
router has two ways out, nothing has changed for anyone, and the port you need
to convert is free.

Set the new path to a **higher metric** so it does not steal the route while
you are still using the old one.

### 3. Bind to what the hardware asserts, never to discovery order

USB NICs are numbered in whatever order the kernel finds them, so `eth1` and
`eth2` can **swap on any reboot** — silently exchanging primary and backup ISP.
Failover would still "work", against the wrong link.

Pin by MAC with a hotplug rule:

```sh
# /etc/hotplug.d/net/20-junior-nicnames
[ "$ACTION" = "add" ] || exit 0
mac=$(cat /sys/class/net/$DEVICENAME/address 2>/dev/null)
case "$mac" in
  6c:6e:07:2d:9d:10) want=wan1 ;;
  6c:6e:07:2d:a4:c2) want=wan2 ;;
  *) exit 0 ;;
esac
[ "$DEVICENAME" = "$want" ] && exit 0
ip link set "$DEVICENAME" down
ip link set "$DEVICENAME" name "$want"
ip link set "$want" up
```

Same principle throughout: let the ISP cable identify its own adapter (whichever
gets link becomes WAN1 — no labelling, no guessing), and give the Wi-Fi
controller a DHCP reservation so a dozen APs never have to go looking for it.

### 4. Scripts that refuse to run

Every dangerous step went into a script with **preflight checks that abort**:

- Is the WAN actually up and carrying the default route?
- Did bridge mode really engage — is the WAN address *public*, not `10.0.0.x`?
- Is the port about to become the LAN still plugged into the live switch?

That last one prevents starting a **second DHCP server** on a live network,
which is the worst available outcome. The script refused to run three times
during the build, and each refusal was correct.

```
x eth1 has no address — the WAN is not up. Do Phase 2/3 first.
```

### 5. Staged builds, not in-place ones

A failed build must not damage what is running. Build to a scratch directory,
swap in only on success, keep the previous version for rollback, and health-check
**more than the front page** — a half-broken deploy still returns 200 on `/`
while its stylesheet 500s.

---

## Order of work

| Phase | What | Risk |
|---|---|---|
| 1 | Recovery AP, packages installed **inactive**, NIC pinning, survey the LAN | none — purely additive |
| 2 | Second cable from the existing gateway to a USB NIC | none |
| 3 | Bridge the ISP gateway. **2–5 min outage.** Verify the WAN gets a *public* address | the real one |
| 4 | Convert the built-in port to LAN + DHCP, move the switch | brief |
| 5 | Second ISP, `mwan3`, **then unplug the primary to prove failover** | low |
| 6 | Filtering last | low, but noisy if done early |

**Filtering goes last on purpose.** It is the only part that makes working
things mysteriously stop working, and it is far easier to diagnose against a
network that is otherwise settled.

---

## The traps, in the order they bit

**`ignore` on one interface disables DHCP for the whole *device*.** A recovery
alias sharing the LAN port had `dhcp.<name>.ignore='1'`, which emits
`no-dhcp-interface=eth0` — killing DHCP for every subnet on that port. Devices
with existing leases kept working, so a dozen were online and the network looked
healthy. Only devices needing a *new* address failed.

*The diagnostic:* every `DHCPDISCOVER` arrived on the wrong interface and none
on the LAN. **Check which interface requests arrive on, not just whether the
server is running.**

**Deleting the old WAN takes IPv6 with it.** Removing `network.wan` also removed
`wan6`, so the router had no IPv6 path — while its DNS kept handing out AAAA
records. Symptom: *"worked for a bit then stopped."* Stopgap `filter_aaaa='1'`;
real fix is to recreate `wan6` on the new device and confirm IPv6 actually
reaches the internet **before** removing the filter.

**A dead default route outranks a live one.** After bridging, the old port still
held a route to a gateway that had ceased to exist, at a better metric. Metrics
chosen to protect the current path become a trap the moment that path dies.

**Backups silently omit custom files.** `sysupgrade -b` saves `/etc/config/`
plus a fixed list — nothing else. Ours was missing the NIC-pinning rule, so a
restore would have produced a router with **no WAN**, for no visible reason. Name
extra paths in `/etc/sysupgrade.conf`, then **verify inside the archive**.

**DoH walks straight through DNS filtering.** Forcing port 53 to the router
catches hardcoded resolvers, but DNS-over-HTTPS rides port 443 and is
indistinguishable from web traffic. The lever is banIP's **`doh` feed** — block
the endpoints and devices fall back to plain DNS. On Apple hardware also block
`mask.icloud.com` (Private Relay).

---

## Verification habits that actually caught things

**Test from outside, not from the config.** "The firewall says REJECT" is not
the same claim as "nothing answers." Scanning the public IP from another network
found that **LAN devices were pingable over IPv6** — because IPv6 has no NAT and
nothing hides them but the firewall.

**One failed check is not a diagnosis.** A single dropped ping nearly got
reported as an outage; four targets all answered.

**Probes lie if the tool is missing.** `timeout` and `/dev/tcp` do not exist on
OpenWrt, so an entire port scan returned "closed" for open ports — exit code
127, silently. **Validate a probe against something known-open before trusting a
negative.**

**Prove the path, not the rule.** The filtering was verified by turning off the
DNS app on a laptop and confirming a site was *still* blocked. Only that proves
the router is doing it, and that devices you cannot install software on — TVs,
cameras, doorbells — are covered too.

**When two faults produce the same error, fixing the first changes nothing and
looks like failure.** The ssh problem that opened the project was a permissions
bug *and* a wrong key. The cutover was a dead route *and* a disabled DHCP
server. Check the simple, checkable fact first — read the file, list the keys,
look at which interface — before building a theory that explains the symptom.

---

## Working with someone on the other end

The person at the hardware is not a remote pair of hands; they see things you
cannot.

- **Their instinct is data.** "It worked for a bit then stopped" was the clue
  that cracked the IPv6 fault. "I could reach blocked sites" found a real hole
  in the filtering.
- **They will ask the question you skipped.** *"If we unplug Xfinity, we lose
  internet — so how do you configure anything?"* caught a genuine ordering
  error: enable bridge mode **while you still have access**, then pull the
  cable during the reboot.
- **Keep instructions to one step at a time when they are up a ladder.** Long
  explanations are unreadable on a phone in an attic, and scrollback usually
  is not available.
- **Put the reference in a document, not in chat.** A page they can print, with
  page numbers, beats scrolling back through a conversation.

---

## Reusable pieces

| Script | Does |
|---|---|
| `junior-phase1.sh` | Recovery AP, packages installed inactive, NIC pinning |
| `junior-phase4-lan.sh` | The cutover, with preflight checks that refuse |
| `junior-build-recovery-image.sh` | Flash-and-go image from the **live** config |
| `junior-doc-pdf.mjs` | Paginated PDF (browsers cannot do CSS page counters) |
| `junior-nic-watch.sh` | One line per link-state change |
| `junior-local-access.sh` | LAN ssh/LuCI access, scoped to one subnet |

Package set that ended up right:

```sh
opkg install mwan3 luci-app-mwan3 banip luci-app-banip \
             adblock luci-app-adblock nextdns luci-app-nextdns \
             luci-app-commands
```

`luci-app-commands` gives a **Power Off** button — OpenWrt has no `shutdown`
command, only `poweroff`, and LuCI ships no shutdown menu entry at all.

---

## What it adds up to

A router that filters ads, trackers, malware and categories for every device
including the ones that cannot run software; blocks known-malicious addresses in
both directions; closes the DoH bypass; is invisible from the internet on both
IPv4 and IPv6; has two tested ways back in; and can be rebuilt onto a blank SD
card in the time it takes to write the image.

Built remotely, on a live household network, with about ten minutes of total
downtime.
