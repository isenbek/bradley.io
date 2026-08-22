---
title: Farm Network & Cameras — Build Guide
summary: Starlink Mini in the well house, point-to-multipoint over 20 ft pines, solar cluster sites and self-powered cameras across 5 unattended acres
version: Rev 7
updated: 2026-08-22
---

# Farm Network & Cameras

**5 fenced acres · rural · unattended for weeks · no house yet.**

---

## What you already have

| | |
|---|---|
| **Well house** | Walk-in, powered, locked, dry. **Gets very hot.** |
| **Possible shed** | 100 sq ft, no permit needed, next to the pole — a **future** upgrade, see below |
| **Power pole** | Treated wood, electrical panel on it, ~50 ft from the well house |
| **5 cellular cameras** | On tree trunks. Poor coverage, constant dropouts, monthly fees — **prepaid for a year** |
| **Pines** | ~20 ft |
| **The gate** | One way in, everything fenced |

## What we're adding

Starlink Mini for internet, coverage across the property, and **~10 Wi-Fi
cameras that record locally and cost nothing per month**.

---

## The five decisions that shape everything

### 1. Record at the camera, not centrally

If cameras 500 ft away stream to a central recorder, **every camera's video
crosses the radio link continuously** — and every hiccup is a gap in your
footage.

Instead: **each camera records to its own SD card**; the link carries only
alerts and the occasional live view.

A dead link then costs you *live viewing*, not *evidence*. On a property nobody
visits for weeks, that distinction is the whole ballgame.

### 2. Let the cameras power themselves

Cameras with their **own panel and battery** need nothing but Wi-Fi coverage.
Solar at each cluster then only runs **the radio and one access point, ~15 W** —
a sealed box on a pole instead of an off-grid installation.

### 3. Build in two phases

You do not yet know how far coverage reaches, and the cluster sites are the
expensive part. **Prove the coverage before buying anything for them.**

### 4. One antenna at the centre, not three links

Three remote clusters does **not** mean three point-to-point links.

### 5. Design for nobody being there

Unattended for weeks means **recovery matters more than performance**.

---

## The pines: settled

**Your pines are ~20 ft**, which resolves the biggest question the cheap way.

At 500 ft on 5 GHz the beam wants roughly **1.4 m of clearance radius** at the
mid-point, ~60% of it free — so about **1 m above the treetops in the middle of
the path**. That means antennas at **25–30 ft**.

**No tower, no guying, no crane.** 5 GHz over the canopy. Wet pine only matters
when you are shooting *through* it.

> **Walk each path before mounting.** The middle third is what counts — a tall
> tree near either end costs far less than one halfway.

---

## Layout

```
   WELL HOUSE or SHED  (locked, powered, sheltered — THE BASE STATION)
   ┌────────────────────────────────────────────┐
   │  Starlink feed · Router · PoE switch       │
   │  Battery / UPS                             │
   │  Thermostatic exhaust fan  ← see Heat      │
   └───────────────┬────────────────────────────┘
                   │  ~50 ft, BONDED + surge protected
        NEW POLE   │                    EXISTING POLE (electrical panel)
        ┌──────────┴──────────┐         ┌──────────────────────┐
        │  Starlink Mini      │  ⎓⎓⎓⎓⎓  │  SECTOR ANTENNA      │
        │  and/or sector      │  BONDED │  (whichever pole is  │
        └─────────────────────┘         │  taller / sees best) │
                                        └───────┬──────────────┘
                                        ╱       │       ╲
                          ~500 ft      ╱        │        ╲
                              CLUSTER A    CLUSTER B    CLUSTER C
                              radio + AP + solar at each
                                     ((( 2.4 GHz )))
                        cameras — own panel, own battery, own SD card
```

**Which pole gets what:** 50 ft of Ethernet is nothing, so choose by
**sightlines, not convenience**. Sector on whichever pole is taller and sees the
clusters best; Starlink wherever the sky is clearest. They need not share a pole.

---

## Where the equipment lives

### Now — the well house

Walk-in, powered, locked and dry. Everything you need except temperature
control.

A closed well house in Florida reaches **120–140 °F**, and that is a functional
problem, not a comfort one:

- **LiFePO4 stops charging above about 113 °F.** The BMS simply refuses. The
  battery quietly stops topping up in July and you discover it during an outage
  in August.
- Most network gear is rated to ~105–115 °F ambient. Past that it throttles,
  reboots, then fails early.

**The fix is cheap:**

- **Thermostatic exhaust fan** high on one wall — a 12 V fan and a thermostat
- **Low intake vent** opposite, screened against insects
- **Battery low, electronics higher, nothing on the floor** — heat stratifies
  and the battery cares most

**A $40 fix for the most likely failure.** Do it before anything electronic goes
in there.

### Later — a purpose-built 100 sq ft shed

**This is a future upgrade, not a prerequisite.** Build on the well house now;
the shed is worth doing when it suits you, and nothing you buy for the well
house is wasted when you move.

A small shed beside the pole, insulated properly, is a materially better home
for this: room to work, room to grow, and control over the temperature that the
well house does not give you.

When the time comes, four things matter.

#### 1. Closed-cell foam, sprayed directly on the metal

**This matters more than the R-value.** Humid air against cool metal produces
condensation on the inside of your walls.

- **Closed-cell** is a vapour barrier and removes the condensing surface
  entirely
- **Open-cell would be actively wrong** — it is vapour-permeable, so moisture
  passes through, reaches the metal, condenses *behind* the insulation where
  you will never see it, and rusts the shed from the inside

Make sure whoever sprays it knows it is closed-cell, onto metal, with no gap.

#### 2. The roof is where the heat comes from

Most solar gain is overhead, not through the walls.

- **Insulate the roof most heavily**
- **Specify a light or reflective roof** — white or bare Galvalume against dark
  metal is worth a genuine **20–30 °F** of interior temperature for no extra
  cost
- If the site allows, face the door north and put it where it gets afternoon
  shade

#### 3. Drywall over the foam — and it is required

Spray foam needs a **15-minute thermal barrier** by code, and ½" drywall is the
standard way to provide it. Do not let anyone skip it to save a day.

#### 4. ⚠️ Bond the shed to the ground system

A **metal building**, beside a **pole carrying an electrical panel**, with
**Ethernet running up to antennas**. Every metal thing there — shed, both poles,
panel — must be bonded to the same ground.

This is the two-pole hazard again, but larger: a metal building is a big
conductive surface. Bonded, it helps. Left floating, it is one more object at a
different potential during a strike. Your electrician should handle it as part
of the shed's electrical work.

#### Ventilation — yes, but know its ceiling

A thermostatic exhaust fan plus a low intake vent is the right baseline, and
with good insulation it will hold close to outside air.

**But ventilation can never get you below ambient.** A Florida afternoon at
95 °F means the shed sits around **100–105 °F** with equipment heat added —
and LiFePO4 stops charging at about 113 °F. That is less margin than is
comfortable on a site nobody visits.

**So measure before deciding.** Put a **$20 temperature logger** in the finished
shed and leave it through a hot spell. Then you will know whether ventilation
is enough, or whether you want a small **5,000 BTU through-wall air
conditioner** — which would hold 100 sq ft at 75 °F trivially.

**Insulate and ventilate now, measure, add cooling only if the data says so.**
Do not guess in either direction.

#### Other things worth specifying while they are building it

- **Concrete pad**, not bare ground — keeps damp out
- **A dedicated circuit** for the equipment
- **Weatherproof cable entries** with drip loops, positioned for the pole run
- **Shelving on the cool wall**, with the battery low

> **Do not wait for the shed to start.** The well house works today, and every
> piece of equipment — plus the ventilation kit — moves across unchanged when
> the shed exists. The only thing you would gain by waiting is a delay.

---

## ⚠️ Grounding — two poles is the dangerous case

Two poles, separate ground rods, and **Ethernet running between them** is
precisely the arrangement that destroys equipment. During a nearby strike the
two grounds sit at different potentials and your Ethernet becomes the path
between them. Everything on that cable dies at once.

1. **Bond both poles to the same ground system** with a heavy conductor. One
   reference, not two.
2. **Surge protector at both ends** of every outdoor run (Ubiquiti
   **ETH-SP-G2** or equivalent).
3. **Never leave a radio on its own isolated rod.**
4. If the panel is your service entrance, **have an electrician make the bond.**

Done right, a nearby strike is a non-event. Done wrong, you replace everything
about once a year.

---

## Phase 1 — centre only, then survey

Build the base station, put **one good outdoor AP on the pole**, and find out
what it actually reaches.

### Survey with a camera, not your phone

**A phone has a far better radio and antenna than a $120 solar camera.** The
link is asymmetric: an AP at 30 ft will be heard at 500 ft easily — the question
is whether the *camera* can be heard coming back. Four bars on your phone proves
almost nothing.

**Buy one camera first.** Mount it temporarily at each position you want and see
whether it connects and *stays* connected.

- **Leave it a full day.** A camera that associates then drops hourly is worse
  than one that never connects, because you will not notice until you need the
  footage.
- **Test after rain**, foliage wet. That is the state that decides whether a
  marginal link is really a link.

### You already have a survey map

**Your five cellular cameras are sited where you want coverage**, chosen for
real reasons. That is the expensive part of the planning already done — and
**the ones that drop cellular worst are your hardest positions**, worth
designing the sectors around.

**The prepaid year means no rush.** Build in stages with the existing cameras
still watching.

---

## ⚠️ Tree trunks are poor radio positions

Your existing cameras are on trunks, and the new ones probably will be too.
Worth knowing what that costs you:

- **Low and surrounded by foliage.** A camera at 6–8 ft on a trunk is shooting
  through leaves and branches in every direction. This is very likely a large
  part of why the cellular ones drop.
- **Trees sway.** Aim drifts in wind — for the camera's view *and* for its
  antenna.
- **Trees grow**, and they grow *around* fixings.

**What to do about it:**

1. **Mount as high as you can safely reach**, and on the side of the trunk
   **facing the access point** — the trunk itself is a solid RF obstacle, so the
   camera wants a clear line back to the AP, not a tree between them.
2. **Clear a sight line.** Trimming two branches often does more than any
   equipment upgrade.
3. **Use straps, not screws.** Ratchet or lag-strap mounts let you adjust, do
   not wound the tree, and can be moved when the survey says elsewhere is
   better.
4. **Where you have a choice, use a post instead.** A 10 ft 4×4 in open ground
   beats a trunk in a thicket every time, and it does not move or grow.

Given the cameras are self-powered and record locally, **a position with a clear
line to the AP is worth more than a position with a slightly better view.** You
can usually adjust the view; you cannot argue with physics.

---

## Phase 2 — cluster sites, only where the survey says

Build a site **only** where phase 1 fell short. Each one avoided saves
**$700–900** and one more thing to maintain.

**Nothing in phase 1 is wasted if phase 2 is needed** — poles, AP, base station
and battery are all part of the final system regardless.

---

## Base station

| Role | Pick | Why |
|---|---|---|
| **Router + controller** | **UniFi Express (UX)** | Router, controller and AP in one box, ~10 W |
| **Switch** | **UniFi Switch Lite 8 PoE** | **Per-port power control** — reboot a wedged radio from your phone instead of driving out. Highest-value item on an unattended site |
| **Pole AP** | **UniFi U6 Mesh** | Outdoor, dual band, PoE. **UAP-AC-M-PRO** is older with better antennas if range beats speed |

**Stay with UniFi.** One app for both properties is worth more than
specifications when you are standing in a field.

### Power

**Turnkey — power station with UPS pass-through.** **EcoFlow Delta 2** or
**Bluetti AC180**, ~1 kWh. Starlink Mini plugs into **USB-C PD** directly;
everything else into AC. Mains in, automatic switchover.

**Proper — a DC system.** 100 Ah LiFePO4 + **Victron** charger, loads at 12 V.
Cheaper per watt-hour and more efficient, but you are building it.

**For a farm visited every few weeks, take the power station.** Fewer parts
beats efficiency when nobody is there to notice a failure.

**Base load ≈ 75 W** → about **14 hours** from 1 kWh.

---

## The link

| Role | Pick | Why |
|---|---|---|
| **Centre** | **UniFi LiteAP AC**, 120° sector | One antenna serves all three clusters; two if spread wider than 120° |
| **Each cluster** | **UISP NanoStation 5AC Loco** | Small, cheap, low power, easy to aim. **LiteBeam 5AC Gen2** for more gain |
| **Cluster AP** | **UniFi AC Mesh (UAP-AC-M)** | Lower draw than U6 Mesh, which matters on solar |

Four or five radios instead of six, one alignment instead of three, and a fourth
cluster later costs one small radio.

---

## Cluster sites

| Load | Draw |
|---|---:|
| Radio | ~7 W |
| Access point | ~8 W |
| **Total** | **~15 W** ≈ 360 Wh/day |

| Component | Spec | Note |
|---|---|---|
| **Panel** | **200–300 W** | **Oversize the panel, not the battery.** Panels are cheap; a fat panel survives a grey week when nobody is coming |
| **Controller** | **Victron SmartSolar MPPT 75/15** | Bluetooth — read its history from the truck |
| **Battery** | **100 Ah 12 V LiFePO4** | ~1,280 Wh, several days at 15 W |
| **Enclosure** | NEMA 4X, vented + filtered | North face, shaded |

---

## Cameras

- **Reolink Argus 4 Pro** / **Argus PT** with matching solar panel
- **Reolink Altas PT Ultra** for pre-roll recording
- **Eufy SoloCam S340** as the alternative

All 2.4 GHz, self-powered, local SD.

**Check before buying ten:**

1. **Local SD playback without a subscription** — some vendors gate it
2. **2.4 GHz** — good news for range; make sure your APs broadcast it strongly
3. **Buy one.** Worst spot. A week. It doubles as your survey tool

### The gate camera matters most

One way in, everything fenced. **It earns more than the other nine combined** —
mount it first, best coverage, the one you are most confident about.

### Transition

**Do not remove the cellular cameras until the Wi-Fi ones are proven.** Run both
for a few weeks and compare at each position. Cellular trail cameras cannot be
converted — the radio is the product — so plan to replace, not repurpose.

---

## Designing for an empty property

- **Remote power cycling** — a wedged radio should be a tap, not a drive
- **Alerting** — an email when the link drops, or you find out when the footage
  is missing
- **Solar margin** — sized above for a site nobody checks
- **Theft** — the well house locks; pole gear high enough to need a ladder
- **CGNAT** — Starlink gives no inbound. Camera apps work via the vendor cloud;
  for direct access use something that dials *outward*, like Tailscale

---

## Rough budget

| | |
|---|---:|
| Starlink Mini hardware | $300–500 |
| Router + PoE switch + pole AP | $400–500 |
| Power station (~1 kWh) | $600–900 |
| Well house ventilation | $40–100 |
| Temperature logger | $20 |
| New pole + mounts | $200–500 |
| Grounding + bonding (electrician) | $200–400 |
| Surge protectors | $100–150 |
| **Phase 1 subtotal** | **≈ $1,900–3,000** |
| Sector antenna | $150–350 |
| **Cluster site × up to 3** | **$700–900 each** |
| 10 solar cameras | $1,000–1,500 |
| **Full build** | **≈ $5,000–7,000** |

Plus Starlink Residential monthly — offset against the **$600–900/year** the
five cellular plans cost today.

**Future, not costed above:** the 100 sq ft insulated shed, roughly
**$4,000–8,000** depending on who builds it. A better home for the equipment,
but not something to wait for.

---

## Build order

### Phase 1

1. **Ventilate the well house** — before anything electronic goes in. Drop a
   temperature logger in and leave it through a hot spell
2. **Bond the poles**, fit surge protectors (electrician if it is the service
   entrance)
3. **Starlink Mini** on mains, working
4. **Add the battery.** Pull the plug and time it — before you depend on it
5. **Pole AP**, 2.4 GHz strong
6. **Buy ONE camera.** Worst spot. A week
7. **Survey** — that camera at each position, a day at a time. Write it down

### Phase 2 — only where phase 1 fell short

8. **Sector antenna**, aimed at the clusters that failed
9. **One cluster site.** A week untouched, through bad weather, before cameras
10. **Repeat** only where needed
11. **The remaining cameras**, gate first
12. **Retire the cellular cameras** as their prepaid year expires

---

## Open questions

1. **Which of the five cellular cameras drops worst?** That is your hardest
   link — design the sectors around it
2. **How are the clusters distributed around the compass?** Within ~120°, one
   sector does it
3. **How tall is the existing pole**, really?
4. **Can any camera move from a trunk to a post?** Often the cheapest
   improvement available
