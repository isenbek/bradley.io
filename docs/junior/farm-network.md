---
title: Farm Network & Cameras — Build Guide
summary: Starlink Mini, point-to-multipoint over 20 ft pines, three solar cluster sites and 10 self-powered cameras across 5 acres
version: Rev 4
updated: 2026-08-22
---

# Farm Network & Cameras

**5 acres · rural · Starlink Mini · ~10 Wi-Fi cameras · flaky mains at the
base · no power at all at the remote sections.**

---

## The three decisions that shape everything

Get these right and the rest is shopping. Get them wrong and you rebuild.

### 1. Record at the camera, not at the base

If the cameras are 500 ft away and the recorder is at the house, **all ten
video streams cross the radio link continuously** — 20–40 Mbps, day and night,
forever. Every hiccup in the link is a gap in your footage.

Instead: **each camera records to its own SD card.** The link then carries only
alerts and the occasional live view — a few hundred kbps.

That single decision:

- makes the radio link almost irrelevant to whether recording works
- lets you use a lower, tree-friendly frequency
- means a dead link costs you *live viewing*, not *evidence*

> You already said the cameras alert on movement rather than recording
> continuously. That fits this design exactly.

### 2. Let the cameras power themselves

The remote sections have no mains. The instinct is one big solar system feeding
everything — which means trenching or stringing cable to ten camera positions.

**Don't.** Use cameras with their **own panel and battery**. Then solar at the
remote site only has to run **the bridge radio and one access point — about
15 W**, instead of 60 W plus a wiring project.

This is the difference between a small sealed box on a pole and an off-grid
installation.

### 3. One antenna at the centre, not three links

Three remote clusters does **not** mean three point-to-point links. One sector
antenna at the middle serves all of them. Fewer radios, one alignment, and
adding a fourth cluster later costs one small radio instead of a whole pair.

---

## Build it in two phases — do not buy the bridges yet

You do not yet know how far coverage reaches from the centre, and the cluster
sites are the expensive part of this build (**$700–900 each**). So prove the
coverage before you buy anything for them.

### Phase 1 — centre only, then survey

Build the base station and put **one good outdoor access point on the
25–30 ft mast at the centre**. Nothing else.

Then take **one camera** to each place you eventually want cameras, mount it
temporarily — a fence post, a ladder, a stake — and see whether it connects and
*stays* connected for a day.

**Survey with the camera, not your phone.** This is the part people get wrong.
A phone has a far better radio and a much better antenna than a solar security
camera. The link is asymmetric: an AP on a 30 ft mast will reach 500 ft with no
trouble, but the question is whether the **camera** can be heard coming back.
Your phone showing four bars proves almost nothing about a camera.

Two more things about the survey:

- **Leave it a full day, not five minutes.** A camera that associates and then
  drops every hour is worse than one that never connects, because you will not
  notice until you need footage.
- **Test in bad conditions if you can** — after rain, with the foliage wet.
  That is the state that decides whether a marginal link is really a link.

At the end of phase 1 you will know exactly which clusters are covered and
which are not.

### Phase 2 — bridges only where the survey says

Build a cluster site **only** where phase 1 failed. Each one you avoid saves
$700–900 and one more thing to maintain.

You may well find that one cluster needs a bridge and the others are fine, or
that a slightly better AP at the centre covers everything. Either way you will
have spent the money on evidence rather than assumption.

### Why this order is safe

Nothing in phase 1 is wasted if phase 2 turns out to be needed — the mast,
the AP, the base station and the battery are all part of the final system
regardless. **The only thing you defer is the part you might not need.**

---

## The pines: resolved — go over the top

**The pines are about 20 ft.** That settles the biggest open question in this
build, and settles it the cheap way.

At 500 ft on 5 GHz the beam needs roughly **1.4 m of clearance radius** at the
mid-point, and you want ~60% of it free — so about **1 m above the treetops in
the middle of the path**.

With 20 ft pines that means masts of roughly **25–30 ft**. That is a push-up
mast, or a pole braced to a barn or the side of a building. Not a tower, no
guy-wire engineering, no crane.

**So: 5 GHz, above the canopy.** Full bandwidth, and weather stops mattering —
wet pine is only a problem when you are shooting *through* it.

> Earlier drafts of this guide budgeted for 50–65 ft masts and a possible drop
> to 2.4 GHz. Neither is needed. Measuring the trees was the single most useful
> thing you could have done.

**Still walk the path before mounting anything.** The middle of the path is
what matters — a tall pine near either end costs you far less than one halfway.
Note the highest tree in the middle third and size the masts from that.

---

## The shape of it

Three remote clusters plus the central one. **Do not build three separate
point-to-point links** — that is six radios and three lots of gear at the
centre. Use **point-to-multipoint**: one sector antenna at the middle, one
small radio at each cluster.

```
                        CENTRE  (mains + battery)
              Starlink Mini ── Router ── PoE switch
                                   ├── house AP
                                   └── SECTOR ANTENNA on a 25-30 ft mast
                                          ╱      │      ╲
                          ~500 ft        ╱       │       ╲
                                        ╱        │        ╲
                                  CLUSTER A  CLUSTER B  CLUSTER C
                                  each: small radio + AP + solar
                                            ((( Wi-Fi )))
                                   cameras - own panel, battery, SD card
```

**Why point-to-multipoint wins here:**

| | Three PtP links | Point-to-multipoint |
|---|---|---|
| Radios | 6 | 4–5 |
| Kit at the centre | 3 sets, 3 alignments | 1 sector (or 2), aimed once |
| Adding a 4th cluster later | another pair + mast space | one small radio |

If the three clusters are spread widely around the compass you may want **two
120° sectors** rather than one. Decide that by standing at the mast position
and looking at where they actually are — if they fall within about 120° of each
other, one sector does it.

---

## Base station

| Item | Why |
|---|---|
| **Starlink Mini** | Has a built-in Ethernet port and runs on **USB-C PD** — which matters enormously for the power design below |
| **Router** | Do not rely on Starlink's built-in Wi-Fi. You want your own DHCP, your own SSID, and somewhere to plug the bridge in |
| **PoE switch**, 5–8 port | Powers the bridge radio and the house AP over their Ethernet cables |
| **Access point** | Coverage around the house and outbuildings |

**Stay with UniFi if you can.** You already run it at home, you know the
controller, and one app managing both sites is worth a lot when something
misbehaves and you are standing in a field.

### Power — use DC, not a computer UPS

Here is the trick: **Starlink Mini takes USB-C Power Delivery.** So you do not
need mains → inverter → power brick, which throws away 20–30% and fails in
precisely the way cheap UPSs fail.

Run the base off a **LiFePO4 battery that is always charging**, with the loads
fed directly from DC.

**Base load, roughly:**

| | |
|---|---:|
| Starlink Mini | ~40 W |
| Router | ~10 W |
| PoE switch | ~10 W |
| Bridge radio | ~8 W |
| House AP | ~8 W |
| **Total** | **~75 W** |

A **100 Ah 12 V LiFePO4** holds about 1,280 Wh, so roughly **14 hours** of
everything running after the power goes. A 50 Ah gives you about 7.

**Why LiFePO4 and not a normal UPS:** a consumer UPS uses lead-acid, dies after
two or three years, and is sized for minutes, not hours. LiFePO4 tolerates
being deeply cycled, lasts the better part of a decade, and is the right shape
for rural power that goes off for hours rather than seconds.

---

## Remote site

Only two things need power out there, because the cameras look after
themselves.

| Load | Draw |
|---|---:|
| Bridge radio | ~7 W |
| Access point (PoE) | ~8 W |
| **Total** | **~15 W** — about **360 Wh/day** |

**Sizing, with Florida sun and honest margins:**

| Component | Spec | Reasoning |
|---|---|---|
| **Solar panel** | **150–200 W** | 360 Wh ÷ 4 usable sun-hours ÷ 0.7 for losses ≈ 130 W. Round up — winter and cloud are the cases that matter |
| **Charge controller** | MPPT, 20 A, 12 V | MPPT rather than PWM; it is worth the difference at this size |
| **Battery** | **100 Ah 12 V LiFePO4** | ~1,280 Wh ≈ **3 days** with no sun at all |
| **Enclosure** | IP65, vented | Batteries and heat are not friends; keep it shaded |
| **PoE injector** | 12 V native if possible | Avoid a 12 V → 120 V → 48 V round trip just to feed a radio |

**Do not undersize the battery to save money.** Three days of autonomy is what
turns a system you have to think about into one you forget exists. A run of
grey days with a 30 Ah battery means driving out there to reset things.

---

## Cameras

**Choose self-contained solar cameras.** Own panel, own battery, own SD card,
PIR motion detection, alerts to your phone. Reolink's Argus/Altas line and
Eufy's SoloCam range are the usual choices.

They need **nothing but Wi-Fi coverage** — no power run, no data cable, no
trenching. On a 5-acre farm that is the whole difference between a weekend and
a month.

**Three things to check before buying ten of anything:**

1. **2.4 GHz only?** Most are, and that is good news — better range and better
   tree penetration than 5 GHz. Just make sure your remote AP broadcasts 2.4.
2. **Local SD recording without a subscription.** Some vendors gate local
   playback behind a cloud plan. Check before, not after.
3. **Buy one first.** Mount it at the furthest, most awkward spot you have and
   live with it for a week. Then buy the other nine.

That last one is worth repeating. Ten of the wrong camera is an expensive
lesson; one of the wrong camera is a Tuesday.

---

## The two things people skip and regret

### Surge protection

Elevated radios, long Ethernet runs, rural property, Florida thunderstorms.
This is not optional.

- **Ethernet surge protectors at both ends of every outdoor run** — where the
  cable enters a building and at the mast
- **A ground rod at each mast**, bonded properly
- Radios grounded to the mast

A surge protector costs about the same as lunch. Replacing a switch, a router,
a Starlink and two radios does not.

### Starlink is behind CGNAT

You do not get a public IP, so **nothing can connect inward.** In practice:

- Camera apps still work — they reach the vendor's cloud, which relays
- **You cannot** port-forward to an NVR, or reach anything on the farm directly
- If you want direct access, use a service that dials *outward* — Tailscale or
  similar — rather than trying to open a port that does not exist

---

## What to actually buy

**Prices and model numbers move.** Treat these as "the right shape of thing" and
check current availability — but the reasoning behind each pick is the part
worth keeping.

**Stay in the Ubiquiti/UniFi family where you can.** You already run it at
home, one app manages both properties, and when something misbehaves while you
are standing in a field, familiarity is worth more than specifications.

### Base station

| Role | Pick | Why |
|---|---|---|
| **Router + controller** | **UniFi Express (UX)** | Router, controller and an AP in one small box, ~10 W. For a site this size it removes a whole component. Alternative: **Cloud Gateway Ultra** if you want the AP separate |
| **Switch** | **UniFi Switch Lite 8 PoE** | The important part is **per-port power control** — you can reboot a wedged radio from your phone instead of driving out. On an unattended site this is the highest-value item in the build |
| **Pole-top AP** | **UniFi U6 Mesh** | Outdoor-rated, dual band, PoE. Budget/range alternative: **UAP-AC-M-PRO**, older but with noticeably better antennas |

### The link

| Role | Pick | Why |
|---|---|---|
| **Centre (point-to-multipoint)** | **UniFi LiteAP AC** — 120° sector | One antenna serves all three clusters. Two if they are spread wider than 120° |
| **Each cluster** | **UISP NanoStation 5AC Loco** | Small, cheap, low power, easy to aim. **LiteBeam 5AC Gen2** if you want more gain |
| **Cluster AP** | **UniFi AC Mesh (UAP-AC-M)** | Lower draw than the U6 Mesh, which matters when solar is carrying it. 2.4 GHz is what the cameras need anyway |

### Power at the base

Two approaches, and the first is far less work.

**Turnkey — a power station with UPS pass-through**

**EcoFlow Delta 2** or **Bluetti AC180**, roughly 1 kWh. Starlink Mini plugs
into the **USB-C PD** port directly; everything else into the AC outlets. Mains
in, automatic switchover, done.

- *For:* nothing to design, no wiring, monitors itself, you can carry it
- *Against:* more expensive per watt-hour, and the fans and screen draw a
  little continuously

**Proper — a DC system**

**LiTime or Renogy 100 Ah 12 V LiFePO4** + a **Victron** charger, feeding the
loads at 12 V with a USB-C PD trigger for the Starlink.

- *For:* cheaper per watt-hour, more efficient, lasts longer, expandable
- *Against:* you are building it

**For a farm you visit every few weeks, I would take the power station.**
Fewer parts is worth more than efficiency when nobody is there to notice a
failure.

### Solar at each cluster

| Component | Pick | Note |
|---|---|---|
| **Panel** | **200–300 W** rigid — Renogy, Rich Solar, Newpowa | **Oversize the panel, not the battery.** Panels are cheap; a fat panel keeps a site alive through a grey week |
| **Controller** | **Victron SmartSolar MPPT 75/15** | Bluetooth. You can check its history from the truck without opening the box — that is worth the premium on an unattended site |
| **Battery** | **100 Ah 12 V LiFePO4** — LiTime, Chins, Renogy | ~1,280 Wh ≈ 3 days at 15 W, more with the bigger panel |
| **Enclosure** | NEMA 4X fibreglass, vented with a filter | North face, shaded. **Heat kills batteries faster than cycling does** |

### Surge protection — do not skip

| | |
|---|---|
| **Ubiquiti ETH-SP-G2** | One at **each end** of every outdoor Ethernet run. About the price of lunch |

Bond everything to the **existing service ground** at the pole. **Never drive a
separate rod for the radio** — two grounds at different potentials during a
nearby strike turn your Ethernet cable into the path between them, and
everything on it dies.

### Cameras

**Reolink** is the usual answer, because local SD recording works without a
subscription — check that before buying ten of anything, as some vendors gate
playback behind a cloud plan.

- **Reolink Argus 4 Pro** or **Argus PT** with the matching solar panel
- **Reolink Altas PT Ultra** if you want pre-roll recording
- **Eufy SoloCam S340** is the main alternative

All 2.4 GHz, all self-powered, all record locally. **Buy one first**, mount it
at the worst spot you have, and use it as your phase 1 survey tool.

---

## Rough budget

Approximate, and worth checking against current prices.

| | |
|---|---:|
| Starlink Mini hardware | $300–500 |
| Router + PoE switch + house AP | $300–400 |
| Bridge pair | $200–400 |
| Base battery + DC gear | $400–600 |
| Sector antenna at the centre (1–2) | $150–350 |
| **Cluster site × 3** (radio, AP, panel, MPPT, battery, box, mounts) | **$700–900 each → $2,100–2,700** |
| Masts, 25–30 ft × 4 | $400–800 |
| 10 solar cameras | $1,000–1,500 |
| Surge protection + grounding | $250 |
| **Total, three clusters** | **≈ $5,000–6,500** |

Plus Starlink Residential service monthly.

**The number that moves most is now the cluster count.** Three sites at
$700–900 each is more than everything else combined, and the masts turned out
cheap once the pines measured 20 ft rather than 50.

**So the money question is: are three sites genuinely necessary?** If two of
the clusters are within Wi-Fi range of one well-placed access point on a pole,
collapsing them saves close to a thousand dollars. Worth walking the property
with that specific question in mind before ordering.

---

## Build order

Two unknowns at once is how these projects stall. This sequence never has more
than one.

### Phase 1

1. **Starlink Mini at the base**, on mains, working. Confirm speed and that it
   stays up.
2. **Add the battery.** Pull the plug and time how long it runs — before you
   depend on it.
3. **Mast at the centre**, 25–30 ft, braced and grounded. Surge protector on
   the cable where it enters the building.
4. **One good outdoor AP** on the mast, 2.4 GHz enabled and strong.
5. **Buy ONE camera.** Mount it at the furthest, most awkward spot you have.
   Live with it a week.
6. **Survey**: move that same camera to each intended location, a day at a
   time. Write down what works.

### Phase 2 — only where phase 1 fell short

7. **Sector antenna** at the centre, aimed at the clusters that failed.
8. **One cluster site**: radio, AP, solar, battery. Let it run a week
   untouched, ideally through bad weather, before adding cameras.
9. **Repeat** for any other cluster that needs it.
10. **The remaining cameras.**

Step 5 is worth insisting on. Ten of the wrong camera is an expensive lesson;
one of the wrong camera is a Tuesday — and that single camera doubles as your
survey instrument.

## What to decide first

The tree question is settled — 20 ft pines, 25–30 ft masts, 5 GHz over the top.

**The open decision is now how many cluster sites you actually build.** Three
is the assumption above and it is the expensive part. Before ordering, walk the
property asking one question: *could one access point on a pole cover two of
these clusters?*

Each site you can eliminate saves **$700–900** and one more thing to maintain.

---

## Open questions

1. **Are all three cluster sites necessary?** The money question. See above.
2. **How are the clusters distributed around the compass?** If they fall within
   about 120° of the mast, one sector antenna does it; if they are scattered,
   budget for two.
3. **Is there anywhere to brace a mast** at each cluster — a barn, a fence
   corner, an existing post? A braced pole is far easier than a free-standing
   one.

### Already answered

- **Pines: ~20 ft** → 25–30 ft masts, 5 GHz, no tower needed
- **Three remote clusters plus the central one**
- **Weather station: Tempest** — self-powered, and its station talks to its own
  hub on sub-GHz rather than Wi-Fi, so it needs nothing from this build. Just
  make sure the hub sits indoors within range of the station.
- **Starlink Residential** — unlimited standard data, so the data-cap worry
  that shapes most Starlink camera builds does not apply to you. Recording at
  the camera is still right, but for link resilience rather than for data.
