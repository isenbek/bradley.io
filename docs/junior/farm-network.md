---
title: Farm Network & Cameras — Build Guide
summary: Starlink Mini, a point-to-point bridge through pine, solar remote sites and 10 self-powered cameras across 5 acres
version: Rev 1
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

### 3. Decide now whether you can get above the pines

This is the one that costs money, so decide it before buying radios. See below.

---

## Pine trees are the real engineering problem

500 ft is *nothing* for a point-to-point radio — they are rated in kilometres.
Your obstacle is not distance, it is **pine**.

Pine needles are close in length to a 5 GHz wavelength, which makes them
unusually good at absorbing it. **Wet pine after rain is considerably worse.**
The failure mode is nasty: the link tests fine on a dry afternoon in August and
drops out in the storm when you actually want to see the property.

You have two honest options.

### Option A — go over the top (best, costs height)

Put both radios above the canopy with clear line of sight.

**How high?** You need the direct path plus a clearance margin. At 500 ft on
5 GHz, the radio beam needs roughly **1.4 m of clearance radius** at the
mid-point, and you want at least 60% of that free — so call it **1 m above the
treetops at the middle of the path**.

With 40–60 ft pines, that means masts in the **50–65 ft** range at both ends.
That is a real structure: a guyed pole or a small tower, properly anchored,
properly grounded — not a length of conduit strapped to a fence post.

**If you can do this, do it.** You get a rock-solid several-hundred-Mbps link
that will not care about weather.

### Option B — go lower in frequency (cheaper, less bandwidth)

Lower frequencies bend around and push through foliage far better.

- **2.4 GHz** point-to-point: noticeably better through trees than 5 GHz,
  still gives you ~50–100 Mbps, and the gear is common and cheap. **This is the
  sensible compromise.**
- **900 MHz**: better again through vegetation, but the gear has become a
  niche, expensive market and tops out around 20–50 Mbps.

**Given decision #1 — video never crosses the link — even 20 Mbps is plenty.**
You are carrying alerts and the occasional live stream, not ten recordings.

So: if the masts are a problem, **2.4 GHz on shorter poles is a perfectly good
answer**, and you can always add height later.

> ⚠️ **Whatever you choose, walk the path first.** Stand at each end and look.
> Note where the trees are tallest, and remember the middle of the path matters
> most — obstructions near either end matter far less.

---

## The shape of it

```
   BASE  (mains power, sheltered)
   ┌──────────────────────────────────────────────┐
   │  Starlink Mini ── Router ── PoE switch       │
   │                              ├── house AP    │
   │                              └── bridge ─────┼───┐
   │  LiFePO4 battery + DC power  (the "UPS")     │   │
   └──────────────────────────────────────────────┘   │  ~500 ft
                                                       │
   REMOTE SECTION  (no power — solar only)             │
   ┌──────────────────────────────────────────────┐   │
   │  bridge ◄────────────────────────────────────┼───┘
   │     └── PoE ── access point (2.4 GHz)        │
   │  150 W panel · MPPT · 100 Ah LiFePO4         │
   └──────────────────────────────────────────────┘
                      ((( Wi-Fi )))
        cameras — own solar panel, own battery, own SD card
```

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

## Rough budget

Approximate, and worth checking against current prices.

| | |
|---|---:|
| Starlink Mini hardware | $300–500 |
| Router + PoE switch + house AP | $300–400 |
| Bridge pair | $200–400 |
| Base battery + DC gear | $400–600 |
| **Remote site** (panel, MPPT, battery, box, AP, mounts) | **$700–900 each** |
| Masts | $200–800 depending on height |
| 10 solar cameras | $1,000–1,500 |
| Surge protection + grounding | $150 |
| **Total, one remote site** | **≈ $3,500–5,000** |

Plus Starlink Residential service monthly.

**The number that moves most is masts.** Option A with 60 ft towers at both
ends can add more than everything else combined. That is the real reason to
decide the tree question first.

---

## Build order

Do it in this sequence and you will never be debugging two unknowns at once.

1. **Starlink Mini at the base**, on mains, working. Confirm speed and that
   it stays up.
2. **Add the battery.** Pull the plug and time how long it runs. Do this
   before you depend on it.
3. **Walk the path.** Decide masts-or-2.4 GHz. Buy radios only after this.
4. **Put the bridge up temporarily** — both ends on tripods or ladders, aimed
   roughly. Check the signal *before* anything is permanently mounted.
5. **Mount properly**, ground it, fit surge protectors.
6. **Remote solar and AP.** Let it run a week untouched, ideally through some
   bad weather, before adding cameras.
7. **One camera.** Furthest, worst spot. Live with it a week.
8. **The other nine.**

Step 4 is the one everyone skips. Aiming radios from a ladder in a field is
unpleasant; aiming them twice because you mounted before testing is worse.

---

## What to decide first

**Can you get 50–65 ft masts up at both ends?**

- **Yes** → 5 GHz, huge bandwidth, weatherproof link, higher cost
- **No** → 2.4 GHz on short poles, ~50–100 Mbps, entirely adequate because
  video never crosses the link

Everything else follows from that one answer.

---

## Open questions

Worth settling before ordering:

1. **How many separate clusters** are the cameras in? Each cluster that is out
   of Wi-Fi range of the others needs its own bridge, AP and solar — that
   $700–900 is *per site*.
2. **Anything else out there needing network?** Gate, well pump, weather
   station? Cheaper to size the solar for it now than to revisit.
3. **How tall are the pines, really?** This is the number the whole design
   turns on, and it is worth measuring rather than estimating.
