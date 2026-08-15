---
title: Two ISPs, One Pi
summary: Build guide — turning Armando's Pi 5 into a dual-WAN OpenWrt router
updated: 2026-08-15
---

# Two ISPs, One Pi

Turning Armando's Pi into the router for the house — two internet lines with
automatic failover, its own DHCP server, and filtering. Written in the order the
work has to happen, because that order is what keeps us from getting locked out
of it.

| | |
|---|---|
| Tunnel | ✅ up |
| SSH | ✅ working |
| Recovery Wi-Fi | ✅ **tested** |
| Phase 1 | ✅ complete |
| ISP cable | ⏳ not run |

---

## Where things stand

The Pi is built, reachable, and loaded with everything it needs. Nothing about
the current internet has been touched — that connection is also how we reach the
Pi, so it stays exactly as it is until there's a replacement path.

What's left is physical: a cable from the attic, and one deliberate switchover.

| Done | Detail |
|---|---|
| SSH access | Key auth repaired — two separate faults produced one identical error |
| Timezone | Eastern, with automatic daylight saving |
| Recovery Wi-Fi | Built *and tested* — a phone joined it and reached the admin page |
| Failover engine | `mwan3` installed but deliberately dormant |
| Filtering | `banip` + `adblock` installed, not yet switched on |
| Adapter naming | Both USB ports pinned to their MAC addresses |
| Network survey | 64 devices catalogued, including all UniFi gear |

---

## Where we're going

```
  BEFORE                                AFTER

  Xfinity router  10.0.0.1              Xfinity (bridged) ──→ eth1  WAN1
   ├─ DHCP for 10.0.0.0/24              ATT Fiber ──────────→ eth2  WAN2
   ├─ Switch ──→ ~64 devices                      │
   │             12 UniFi APs                     ▼
   └─ Pi (a guest, .76)                          Pi   10.0.10.1
                                                  │   DHCP · firewall · filtering
                                                  ▼
                                        eth0 ──→ Switch ──→ your devices

  Starlink stays separate — Wi-Fi only, a manual last resort, not wired in.
```

Both lines run around 200 Mbps, comfortably inside what every port here can
carry. **This build is about resilience, not speed.**

---

## The hardware, as the Pi sees it

| Port | MAC | What it is | Job |
|---|---|---|---|
| `eth0` | `88:a2:9e:99:4f:e7` | Built-in ethernet | **LAN** — switch and every device |
| `eth1` | `6c:6e:07:2d:9d:10` | ASIX AX88179A, USB 3 | **WAN1** — first ISP plugged in |
| `eth2` | `6c:6e:07:2d:a4:c2` | ASIX AX88179A, USB 3 | **WAN2** — the second ISP |
| `wlan0` | `88:a2:9e:99:4f:e8` | Built-in Wi-Fi | Recovery access point ✅ live |

Both USB adapters are the same model, so you can't tell them apart by looking.
**Don't try** — the MAC address is the only reliable name, and the cable decides
which is which.

The adapters landed on separate USB controllers, which is worth having: during a
failover both lines carry traffic at once, and this way they never compete for
the same bus.

---

## What's actually on the network

The Pi surveyed the LAN from the inside — 64 devices responding, 10 of them
Ubiquiti.

| Address | What | Matters because |
|---|---|---|
| `10.0.0.1` | Xfinity gateway | It keeps this address in bridge mode — the reason the LAN has to move |
| `10.0.0.3` | UniFi controller | Every AP reports to it. Gets a reserved address so it can't wander |
| `10.0.0.76` | The Pi (today) | Currently a DHCP guest; becomes the router |
| ×10 more | UniFi APs | All on plain DHCP — they renumber themselves, no work needed |
| ×53 more | Everything else | Full MAC inventory captured, in case something turns out to be static |

---

## Three things that will bite

### 1. Xfinity doesn't let go of `10.0.0.1`

The LAN is `10.0.0.x` because that's Comcast's factory default, and the survey
confirmed the gateway really is sitting on `10.0.0.1`. In bridge mode those boxes
typically **still answer there** for their own admin page, on the segment facing
the Pi's WAN port.

So if the Pi's LAN stayed `10.0.0.0/24`, the Pi would want `10.0.0.1` for itself
while the modem keeps claiming it from the other side. Same address, two
interfaces. That router does not work, and it fails in ways that look random.

> **Decided:** the LAN moves to `10.0.10.0/24`. Pi at `.1`, UniFi controller
> reserved at `.3`, DHCP pool `.100–.199`. The APs are on DHCP, so they renumber
> themselves and you touch nothing.

### 2. Bridging kills the Wi-Fi — *not a problem here* ✅

Bridge mode turns the Xfinity box into a plain modem: no DHCP, no Wi-Fi. That
usually means the household loses Wi-Fi mid-cutover and everyone notices within
ninety seconds.

Armando has 12 UniFi APs and never used the Xfinity radio, so this costs nothing.
Recorded as retired rather than forgotten.

### 3. The cutover is when we go blind

Brad reaches the Pi through a tunnel that runs over its current internet
connection. Bridging the Xfinity box drops that connection, so the tunnel dies
and remote help stops until the Pi has internet again through a WAN port.

That's expected. It just means the ways back in have to exist **before** we need
them.

> **Handled:** the recovery Wi-Fi is up and has been tested with a real phone —
> associated, got an address, loaded the admin page. Plus the wired fallback
> below, which needs nothing but a laptop and a cable.

---

## The order of work

Every phase ends in a check. If a check fails we stop and fix it there — we never
stack a risky step on top of an unverified one.

### Phase 1 — ✅ complete *(Brad, remote)*

- Recovery Wi-Fi access point — built and tested
- `mwan3`, `banip`, `adblock` installed, all inactive
- USB adapters pinned to their MAC addresses
- Timezone, and the LAN survey

**Checked:** the tunnel still works and the current internet is untouched.
73.5 MB of storage still free.

### Phase 2 — *Armando, hands on hardware*

Get a cable from the attic to the Pi.

1. Decide where the Pi lives. Attics cook electronics in summer — putting the Pi
   where you are and running one line up is usually the better trade.
2. Run ethernet from the Xfinity gear to the Pi.
3. Plug it into **either** USB adapter. Whichever gets link becomes WAN1 — no
   labelling, no guessing.

**Check:** Brad confirms which MAC got link and pins it as WAN1.

### Phase 3 — *together, the risky bit*

Flip Xfinity to bridge mode.

1. Enable bridge mode on the Xfinity gateway. Internet drops. The tunnel dies.
   Expected.
2. The Pi should pull a public address on WAN1 within a minute or two.
3. The tunnel returns on its own once it does.

**Check:** Brad is back in. If he isn't after five minutes, use a recovery path —
don't start improvising.

### Phase 4 — *together, the switchover*

Make the Pi the router.

1. Convert `eth0` from internet-facing to LAN, on `10.0.10.0/24`.
2. Start the DHCP server, with the controller reserved at `10.0.10.3`.
3. Move the switch's uplink from the Xfinity box to the Pi's `eth0`.
4. Reboot a device and confirm it gets an address from the Pi.
5. Check the UniFi controller sees its APs again — they may take a few minutes to
   rediscover it.

**Check:** a laptop on the switch reaches the internet, its gateway is the Pi, and
all 12 APs are online.

### Phase 5 — *together, when the fiber lands*

Add the second line and prove failover.

1. AT&T Fiber into the second adapter, and its gateway into **IP Passthrough** so
   the Pi gets the real public address.
2. Enable `mwan3`, set the primary, turn on health checks.
3. Then actually test it: **unplug the primary line** and watch traffic move.

Untested failover isn't failover — it's a belief. The point is that it works on
the day something breaks, and the only way to know is to break it yourself on a
day you chose.

### Phase 6 — *Brad, remote*

Switch on filtering.

1. `banip` — subscribes to threat feeds and drops known-malicious addresses in
   both directions.
2. `adblock` — blocks ad and malware domains at the DNS layer, for every device
   at once.
3. A firewall rule forcing all DNS through the Pi, so a device can't simply
   ignore it.

Left until last on purpose: filtering is the only part that can make working
things mysteriously stop working, and it's much easier to diagnose against a
network that's otherwise settled.

---

## If it all goes wrong

Three ways back into the Pi, in order of how much trouble you're in.

| Route | How | When |
|---|---|---|
| Local network | `http://10.0.0.76` | While the Pi is still a guest on the current LAN |
| **Recovery Wi-Fi** ✅ | Join `pi-rescue`, then `http://192.168.98.1` | **Any time.** Tested. Needs no cable, no internet |
| Direct cable | Set laptop to `192.168.99.2/24`, then `ssh root@192.168.99.1` | Always. Needs no internet, no DHCP, no Wi-Fi, no luck |

⚠️ Careful with those two `192.168.9x` addresses — they look almost identical and
are completely different routes. **98** is over the air; **99** is over a cable
plugged straight into the Pi.

That last address is permanent — it answers on the built-in ethernet port no
matter how badly the rest of the configuration is mangled. The first-boot log
lives at `/root/cb-rpi5-firstboot.log`.

Log in as `root`. **Passwords aren't written down here on purpose** — Brad has
them, the Wi-Fi passphrase is the one Armando chose, and passwords in documents
outlive the passwords themselves.

---

## The one open question

**Is the UniFi controller's `10.0.0.3` static, or from DHCP?**

- **From DHCP** → the reservation takes over and there's nothing to do.
- **Static on the device** → it will keep insisting on `10.0.0.3` after the move
  and drop off the network. One field, on the one box sitting in the office.

The low number suggests it was set deliberately at some point. Not worth digging
through admin panels for — we find out within a minute of the switchover either
way, and the fix is five minutes on a device you can physically reach.

---

## One habit worth stealing

Several times today the same rule saved us: **bind to what the hardware asserts
about itself, never to the order things happened to appear.**

- USB adapters get pinned by MAC, because `eth1` and `eth2` can trade places on
  any reboot — and if they do, the primary and backup ISP quietly swap. Failover
  would still "work", against the wrong link.
- The ISP cable identifies its own adapter, rather than anyone labelling one by
  guess.
- The UniFi controller gets a reserved address, so twelve access points never
  have to go looking for it.
- A USB speaker on another machine once went silent for exactly this reason: it
  was addressed by card number, and the numbers shifted after a reboot.

Names that describe *discovery order* are always temporary. Names that describe
*the thing itself* survive.

And the one from the ssh problem that opened the day: **when two faults produce
the same error message, fixing the first one changes nothing and looks like
failure.** Check the simple, checkable fact first — read the file, list the keys,
confirm the address — before building a theory that explains the symptom.
