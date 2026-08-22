---
title: Session Log
summary: Everything said in the shared terminal, as a page you can actually scroll
version: 2026-08-22 16:35
updated: 2026-08-22
---

# Session Log

**Last 60 messages · refreshed 2026-08-22 16:35 UTC**

> The terminal cannot scroll back — Claude Code redraws the screen instead of
> printing lines that scroll away, so there is no history to reach. This page
> is that history. Scroll it, search it, print it.

---


### 🤖 Jr · 20:58

Documented — **Rev 26**, including the one that would have bitten us again: `/etc/init.d/adblock reload` is a silent no-op that exits 0 and leaves the network unfiltered while reporting "running". The doc now says to call `sh /usr/bin/adblock.sh reload` directly and verify the count.

Also recorded that the method which actually worked was turning filtering off wholesale to prove the cause, rather than guessing domains — and that two hostnames I confidently named didn't exist at all.

Everything's steady. Hope the YouTube TV call goes smoothly.

---

### 🗣 You · 02:43

Lets do a checkpoint / compact / make a luncist of remaining items

---

### 🤖 Jr · 02:45

# 📍 Checkpoint — 21 Aug 2026

## Where things stand

```
AT&T Fiber   PRIMARY   99.150.197.107   5.8 ms   up 6h since restore
Xfinity      backup    online
72 devices · 46.8 °C · throttled 0x0 · Pi up 5 days
adblock 333,100 · NextDNS running · banIP both WANs
alerts → escalantea+router@gmail.com
```

## What happened over two days

**Dual-WAN went live.** AT&T Fiber via IP Passthrough, Xfinity as backup, failover proven both ways — cable pulled *and* the harder case where the link stays up but the ISP is dead (3s detect, 11s move, 8s failback).

**It earned its keep within 12 hours.** AT&T died at 00:20:20 for **5h 13m**. Nobody in the house noticed.

**Three real bugs found and fixed:** banIP was only inspecting Xfinity after the fibre arrived; failback silently stuck on the backup line; and `/etc/init.d/adblock reload` is a no-op that leaves you unfiltered while reporting healthy.

**Your AT&T login CAPTCHA** was adblock blocking the tracking scripts the page waits on. Five domains allowlisted.

---

# Remaining items

## Yours

1. **Watch AT&T tonight.** If it drops near 00:20 again that's a pattern, not construction. You'll get an email either way.
2. **Call AT&T when you have a pattern** — LuCI → *WAN — ISP reliability report* prints the evidence. Ask: *"Can you see my ONT registering on the PON?"*
3. **Download the recovery kit** to your PC — still only on the Pi and here.
4. **Gmail filter** for `to:escalantea+router@gmail.com` → label it, tick **never send to spam**.
5. **NextDNS categories** — adult/social/gaming, per device, at my.nextdns.io.
6. **Note your NextDNS allowlist** somewhere — it's the one thing no backup captures.

## When you're ready

7. **Starlink as a third line** — needs one USB adapter; both USB 2 ports are free.
8. **IPv6 from AT&T** — they support DHCPv6-PD.
9. **2.5 GbE upgrade** — 2× RTL8156B + a 2.5 G switch, if you want past 940 Mbps. Or drop to the 1 Gbps tier and save money.
10. **AT&T gateway Wi-Fi** — still on, but out of range, so low priority.

## Mine

11. **Tear down `/junior`** when you're done with it — keeping the reusable recipe.
12. **Remove the VPN trust** at teardown.

---

Recovery image is rebuilding now with today's allowlist. I'll update the kit link when it lands.

---

### 🗣 You · 02:48

ok, let me know when the image is done

---

### 🤖 Jr · 02:48

Watching for it — I'll tell you as soon as it's built and verified.

---

### 🗣 You · 03:00

ok, let me know when it's ready

---

### 🤖 Jr · 03:00

Still building. I'll ping you the moment it's done and verified — nothing needed from you until then.

---

### 🗣 You · 03:24

ok

---

### 🤖 Jr · 03:24

The build finished — my wait-loop was matching its own command line and would have waited forever. Verifying and installing now.

---

### 🤖 Jr · 03:26

# ✅ Image is ready

```
rpi5-router-recovery-20260821.img.gz   15 MB   7762197083ee02d2…
junior-config-20260821-2325.tar.gz     28 KB   14a52e7daafef514…
```

Verified inside the image before it went in the kit — the AT&T login allowlist, the plain-language alert script, the ISP report, the failback watchdog, the crontab that schedules them, and the NIC-pinning rule.

**Both are at https://bradley.io/junior** — download them to your PC when you get a chance. That's still the one open item that only takes you a minute; right now the only copies are here and on the Pi.

Flash that image to a blank card and the Pi comes up already being your router: both WANs, failover, filtering, alerts, LuCI buttons. Nothing to configure.

---

**Links**

- https://bradley.io/junior — recovery kit (image, config, checksums, 3 PDFs)
- https://bradley.io/junior/doc/two-isps-one-pi — router guide, **Rev 26**
- https://bradley.io/junior/doc/mywishes-codebase — codebase inventory
- Site **v1.0.302** · ⚠️ image and config contain secrets

---

### 🗣 You · 15:36

Jr, hello

---

### 🤖 Jr · 15:36

Morning. **Good news — AT&T ran clean all night.**

```
AT&T Fiber   19h 04m unbroken
Xfinity      backup, online
no new events since 05:37 yesterday
67 devices · 42–54 °C overnight · never throttled
adblock 333,100 · watchdog: nothing to fix
```

That's the answer to last night's question: **no repeat at 00:20.** One bad night followed by nineteen clean hours fits your construction theory rather than a fault on your line. Still worth watching a few more nights before deciding, but nothing to call them about yet.

What do you need?

---

### 🗣 You · 15:37

Hey, last night I had your brother (Claude) write up all the legal LLC agreements etc. I needed I'm now going to hire an Attorney to check etc. as recommented by your brother

---

### 🤖 Jr · 15:38

Good — and that's the right order. Paying an attorney to *review* drafts is a fraction of paying one to write from scratch, and you'll get a better result because you've already thought through what you want the documents to do.

Two things worth doing when you engage them:

**Send everything as one package** and say plainly: *"These are drafts for review, not a request to draft."* Then ask for a **flat fee for the review** rather than hourly. Most will quote one, and it stops the meter running.

**Give them the three questions that actually matter**, so they focus there rather than on prose:

1. Does this structure actually achieve the liability separation between the entities that I intend?
2. Are the intercompany terms defensible if the IRS looks at them?
3. What does my state require that these drafts don't do — formalities, filings, signatures?

An attorney handed a clean draft and three specific questions will do a much better job than one handed a folder and "have a look at this."

Router's fine, nineteen hours clean. Anything you need on this side?

---

### 🗣 You · 15:40

ok, now a NEW project, completly unrelated. Let me explain. I have a farm (5 ac) in a rural area. I want to installa Starlink Mini and connect security cameras (wifi only) in the farm, some will be 500 feet away. The farm has power but may be flaky sometimes, so the base will need a small UPS, I may need a point to point bridge to reach further sections of the farm. What do you recommend?

---

### 🤖 Jr · 15:41

Good project. Let me give you the shape of it, then I'll write it up properly as a document you can read without scrolling.

## The thing that will bite you first: data

**Starlink Mini's plans have data caps, and WiFi cameras are data pigs.** Four cameras uploading continuously to a cloud service will chew through **300–600 GB/month**. That's the single most common way this build goes wrong, and it's expensive to discover later.

**Design around it from the start:** record locally at the base, upload only motion clips or nothing at all. That one decision shapes the camera choice, so settle it before buying anything.

## Topology

```
        BASE (power + shelter)
        Starlink Mini ─── Router ─── PoE switch
                                      ├── local AP
                                      ├── NVR (local recording)
                                      └── Bridge radio ──┐
                                                          │  500 ft
        REMOTE SECTION                                    │
        Bridge radio ─── PoE ─── AP ─── cameras ◄────────┘
```

## 500 feet is past WiFi, so bridge it

Not mesh — mesh at that range outdoors is unreliable and you'll spend months blaming the cameras. A dedicated point-to-point link is the right tool, and 500 ft is trivial for one (they're rated in kilometres).

**Since you already run UniFi at home**, stay in that ecosystem — same controller, same app, you already know it:

- **UniFi Building-to-Building Bridge (UBB)** — a matched pair, aims easily, ~500 ft is nothing for it
- Or **NanoStation 5AC Loco** pair — cheaper, more fiddly to aim

## Power — do it with DC, not a normal UPS

**Starlink Mini runs on USB-C PD.** That's a gift: you can power it straight from a battery instead of mains → inverter → power brick, which wastes 20–30% and fails in exactly the way cheap UPSs fail.

For flaky rural power I'd use a **LiFePO4 battery with USB-C PD output** rather than a conventional AC UPS. It's more efficient, tolerates deep cycling, and lasts years rather than the 2–3 you get from UPS lead-acid.

## Two things people skip and regret

**Surge protection.** Elevated radios on a rural property, on long ethernet runs, in Florida. **Ethernet surge protectors at both ends of the bridge, and proper grounding.** This is the difference between replacing a $30 protector and replacing everything attached to it.

**Starlink is behind CGNAT** — no inbound connections. Remote viewing has to go through the camera vendor's cloud, or a VPN you dial *out* to.

---

## Before I spec it properly, five questions

1. **Is there mains power at the remote section**, or does that end need solar?
2. **Clear line of sight** between base and remote — trees, barns, terrain?
3. **How many cameras**, and how many at the far end?
4. **Recording local, cloud, or both?** — this drives the data answer above.
5. **Which Starlink plan** — Residential, or Roam with a cap?

Answer what you know and I'll write the full build: specific models, quantities, wiring, power budget, and rough cost. Want that as a document like the router guide?

---

### 🗣 You · 15:44

1-No, remote locations have no power, will need solar. 2-Some trees in the middle, pine trees, not bad. 3-like 10 cameras (wifi only). 4-Recording local. 5-Residential plan. The cameras alert whe the see movement, so NO need for continus video.

---

### 🤖 Jr · 15:44

That changes the design in three important ways. Let me give you the headlines, then write it up properly.

## 1. Pine trees are your real problem, not distance

500 ft is nothing for a bridge radio. **Pine needles are almost the worst case for 5 GHz** — the needle length is close to the wavelength, so they absorb rather than pass it. Wet pine after rain is worse. A link that works in August fails in a storm, which is exactly when you want your cameras.

You have two ways out, and it determines everything else:

- **Get above the canopy** — masts at both ends with clear line of sight. Best performance, but 40–60 ft pine means a serious mast.
- **Go low-frequency** — 900 MHz gear pushes through foliage far better. Much less bandwidth (~20–50 Mbps), which is *fine* given decision #2 below.

## 2. Don't send video across the link

If the cameras are remote and the recorder is at the base, all ten video streams cross the bridge continuously — 20–40 Mbps, forever, and everything stops when the link hiccups.

**Record at the camera instead.** Onboard SD card, with only alerts and on-demand viewing crossing the link. The bridge then carries almost nothing, which is what makes the 900 MHz option viable and makes the whole system survive a bad link.

## 3. No power at the remote sites → use self-powered cameras

This is the big simplification. Rather than solar-powering ten cameras plus running cable to each:

- **Cameras with their own solar panel and battery** (Reolink Argus/Altas, Eufy SoloCam) — record to SD, need nothing but WiFi coverage
- **Solar at the remote site powers only the bridge radio and one access point** — about 15 W instead of 60 W

That's a ~150 W panel and a small LiFePO4 battery per site, rather than a small off-grid installation.

One detail: most WiFi cameras are **2.4 GHz only**, which is good news — better range and better tree penetration than 5 GHz.

---

Want me to write this up as a full build document — masts, specific models, solar sizing, power budget, surge protection and rough cost? Same format as the router guide, so you can read and print it properly instead of fighting the terminal.

---

### 🗣 You · 15:45

write it up, cant scroll back... :(

---

### 🤖 Jr · 15:48

Written up — read it properly rather than fighting the terminal.

**https://bradley.io/junior/doc/farm-network** (print and PDF buttons on the page)

## The short version

**One question decides the whole design: can you get 50–65 ft masts up at both ends?**

- **Yes** → 5 GHz over the treetops. Fast, weatherproof, expensive.
- **No** → 2.4 GHz on short poles. ~50–100 Mbps, and **entirely adequate** — because of the next point.

**Video never crosses the link.** Each camera records to its own SD card, so the radio carries only alerts and the occasional live view. That's what makes the cheap option viable, and it means a dropped link costs you live viewing, not evidence.

**Cameras power themselves.** Own panel, own battery. Remote solar then only runs the bridge and one AP — **15 W, not 60** — which is a sealed box on a pole rather than an off-grid installation.

Everything else — sizing, models, budget, build order — is in the document.

## Three things I'd want answered before you order

1. **How many separate camera clusters?** Each one out of Wi-Fi range of the others needs its own bridge + AP + solar. That's **$700–900 per site**, and it's the number most likely to surprise you.
2. **How tall are those pines, actually?** The whole mast decision turns on it. Worth measuring.
3. **Anything else out there needing network** — gate, well pump, weather station? Cheaper to size the solar for it now.

---

**Links**

- https://bradley.io/junior/doc/farm-network — **Farm Network & Cameras**, Rev 1
- PDF also in the kit at https://bradley.io/junior
- Site v1.0.303

---

### 🗣 You · 15:51

Maybe 3 remote camera clusters plus the central cluster, served by the central nore. Pines are like 20 feet. Weather station uses Solar on its own, Tempest Weather station, nothing else comes to mind right now

---

### 🤖 Jr · 15:51

That's much better news than I assumed — and it changes two things substantially.

## 20 ft pines makes this easy

I'd budgeted for 50–65 ft masts. At 20 ft you need roughly **25–30 ft** to clear the canopy with margin — that's a push-up mast or a pole braced to a barn, not a tower.

**So Option A is back on: 5 GHz over the top.** Full bandwidth, weatherproof, and you've just saved most of the mast budget.

## But three clusters changes the topology

Three separate point-to-point links means six radios and three masts' worth of hardware at the centre. Don't do that.

**Use point-to-multipoint instead** — one sector antenna at the centre serving all three, and one small radio at each cluster:

```
                    CENTRE
              sector antenna(s)
              ╱        │        ╲
        cluster A  cluster B  cluster C
        (small radio + AP + solar at each)
```

Four or five radios instead of six, one mast at the centre instead of three sets of gear, and one thing to aim rather than three pairs.

## The real cost driver is now the remote sites

Each cluster still needs its own radio, access point and solar — **$700–900 apiece**. Three of them is **$2,100–2,700**, which is more than everything else combined.

**Worth asking before you commit:** are those three clusters genuinely out of Wi-Fi range of each other, or could one well-placed AP on a pole cover two of them? Collapsing three sites into two saves you the better part of a thousand dollars.

Let me update the guide.

---

### 🤖 Jr · 15:53

That's the right call, and it saves you from buying gear you may not need. Let me restructure the guide around it.

**One thing that will make or break the phase 1 test:** survey with an **actual camera**, not your phone. A phone has a far better radio and a much better antenna than a $120 solar camera. The link is asymmetric — the AP on a 30 ft mast will be heard at 500 ft easily; the question is whether the *camera* can be heard back. Test with the thing that has the weak radio.

---

### 🤖 Jr · 15:54

Worth checking the details on that one — I'm not certain of the exact product name, and Starlink's accessory lineup changes. But whatever it's called, if it's their **mesh node**, the engineering caveat matters:

**Starlink mesh nodes are indoor Wi-Fi extenders, not point-to-point bridges.** Three reasons they won't replace the cluster sites:

1. **Indoor-rated.** Not weatherproof, no pole mount, no outdoor temperature range.
2. **Omnidirectional.** Mesh nodes spray signal in all directions. A bridge radio focuses it into a narrow beam — that's exactly where the 500 ft range comes from. An omni antenna at 500 ft outdoors is a different proposition entirely.
3. **They need mains power** — which is the thing your remote clusters don't have.

Where one *would* genuinely help: **around the centre.** If your house, barn and the central camera cluster are spread out, a mesh node extends that area cheaply and you already own the ecosystem.

So it's worth having in the mix for the central cluster — just don't plan on it reaching the far corners of five acres.

**It's also a good phase 1 experiment**, since it's cheap and needs no mast: try it before the sector antenna and see how far it actually gets you. If it covers two clusters, that's $1,400 you don't spend.

I'll add a note to the guide. And do check the actual spec when you're buying — if it turns out to be weatherproof and directional, that changes my answer, and I'd rather you check than take my word for a product I'm not certain about.

---

### 🗣 You · 15:54

woud that help in the cantral cluster?

---

### 🤖 Jr · 15:54

Yes — but honestly, **the mast-mounted outdoor AP you're already planning will do the central cluster better**, so the mesh node would be adding little.

The reason is height. **Getting an antenna 30 feet up buys you more coverage than almost any antenna upgrade at ground level.** A mesh node sitting indoors at 6 ft, behind a wall, has to fight through the building and the ground clutter your mast simply rises above.

**Where a mesh node genuinely earns its place:** a specific indoor space the mast doesn't serve well — a barn, workshop or outbuilding with mains power where you want coverage *inside*. Signal from outside doesn't get through a metal barn roof, and no amount of mast height fixes that. A node inside the barn does.

So:

| Need | Use |
|---|---|
| Cameras outdoors around the centre, out to a few hundred feet | **Outdoor AP on the mast** |
| Coverage *inside* a barn or shop with power | **Mesh node** |
| The far clusters at 500 ft | **Neither** — directional bridge |

**For phase 1 I'd still lead with the mast AP**, since it's the thing that tells you how far you can reach. Add a mesh node afterwards only if a specific building turns out to be a dead spot.

One practical point: if you have a barn or outbuilding **between** the centre and a far cluster, with power in it — that changes everything. It becomes a natural relay point, and a cluster served from there might not need its own solar at all. Worth looking at when you walk the property.

---

### 🗣 You · 15:55

I have a tall pole already, plan to install central ap on it. Note that the Cameras all have SOlar built in, so only need power for the remote AP

---

### 🤖 Jr · 15:55

That's two good pieces of news — the mast cost is gone, and it confirms the power design: remote sites only ever run **the bridge radio and the AP, ~15 W**, which is a small panel and a sealed box rather than an off-grid build.

**Two things about the existing pole:**

**How tall is it?** This is now the number that decides your phase 1 results. Every extra 10 ft meaningfully extends what you'll reach, and it may well determine whether you need one cluster site or three. Worth measuring properly rather than eyeballing.

**How far is the pole from the base station?** Ethernet caps at **328 ft (100 m)** including the run up the pole. Past that the link just won't come up, and it's a frustrating thing to discover after you've dressed the cable. If it's further, you'd need either a mid-span PoE switch or fibre — solvable, but worth knowing now.

**Also, since it's an existing pole:** check what's already on it and how it's grounded. Putting a radio at the top of a tall metal pole in Florida without a proper ground and a surge protector on the ethernet is asking for an expensive lesson — and if the pole already carries something else, you want to know what before adding to it.

Tell me the height and the distance to the base and I'll fold both into the guide.

---

### 🗣 You · 15:56

I had the pole installed! Its in the main area. Treated wood POWER pole, very strong, the Electric panel is installed on the lower part of the pole

---

### 🤖 Jr · 15:57

That's close to ideal, and it changes the base station design for the better.

**Put the whole base at the pole.** Starlink Mini, router, switch and battery in a weatherproof enclosure at the bottom, AP at the top. Power is right there, and the ethernet run from equipment to antenna becomes a few feet instead of a few hundred — the 328 ft limit stops being a consideration at all.

## The grounding point matters more than anything else here

You have an electrical panel on that pole, which means there's already a **ground rod and a service ground**.

**Bond the AP's ground to that same ground system.** Do not drive a separate rod for the radio.

This is the mistake that kills equipment. Two separate grounds sit at slightly different potentials during a strike anywhere nearby, and your ethernet cable becomes the path between them. Everything on that cable dies. One bonded ground system, one point of reference, and the surge has nowhere interesting to go.

Put a **surge protector on the ethernet where it enters the enclosure**, grounded to the same bond.

## Two practical things

**Heat.** A sealed box in Florida sun with a lithium battery inside is a bad combination. Mount it on the **north face** of the pole, use a vented enclosure, and consider a sun shield. Heat is what kills batteries, not cycles.

**Getting connectivity to the house.** If the base now lives at the pole rather than indoors, how does the house get internet? Usually the pole-top AP covers it — but worth confirming the house is within range and not behind anything metal.

**One question:** is the pole's electrical work yours to modify, or does it belong to the utility? If the panel is your service entrance, an electrician should make the ground bond rather than you — it's a half-hour job and it's the difference between a code-compliant install and an insurance conversation.

---

### 🗣 You · 15:57

No house... not yet

---

### 🤖 Jr · 15:58

That changes several assumptions, and mostly for the harder.

**No building means the enclosure *is* the shelter.** Everything outdoor-rated, no exceptions — and the enclosure stops being an accessory and becomes a real component. In Florida that means heat, condensation and insects, all of which get into cheap boxes. Vented with a filter, or sealed with desiccant, mounted on the north face.

**Nobody is there to power-cycle anything.** This is the big one. At your house, if something wedges, you walk over and unplug it. On an empty farm, a hung radio means a drive out.

Worth designing for from the start:

- A **PoE switch you can power-cycle remotely**, per port — so a stuck AP or radio can be rebooted from your phone
- Or a simple **watchdog** that pings something and cuts power if it stops answering

That's a small amount of money now against a lot of driving later.

**Nobody will notice an outage either.** Same alerting logic as your house router — you want an email when the farm link drops, or you'll find out when you go looking for footage that isn't there.

**And theft.** Equipment on a pole, rural, unattended. Lockable enclosure, mounted high enough to need a ladder, and nothing valuable at eye level.

---

**Two questions this raises:**

1. **Is the farm attended at all** — do you or anyone go out regularly, or could it sit alone for weeks?
2. **Is a house coming later?** If so, roughly where? Worth knowing now, because it may become the natural place for the base station, and I'd rather design something that migrates cleanly than something you rebuild.

I'll fold all of this into the guide once you answer — the "no building" version is a meaningfully different design from what's written now.

---

### 🗣 You · 15:59

The farm stays unattended for weeks, all fenced and a gate on the entrace, but... shit happens. The house will be near the pole, near the Electrical panel and well house

---

### 🤖 Jr · 15:59

That fills in the picture — and one word in there is important.

**You have a well house.** Is it near the pole, does it have power, and is it dry? If so, **that's your base station**, not a box on a pole. A small building beats any enclosure: room to work, shade, somewhere to put a battery that isn't cooking, and no ladder needed when something needs attention.

If the well house works, the pole becomes purely an antenna mast, which is what it's good at.

## Unattended for weeks changes the priorities

Performance stops mattering and **recovery** starts mattering. Three things become non-negotiable:

**Remote power cycling.** A PoE switch with per-port control, so a wedged radio is a tap on your phone rather than a drive. This is the single highest-value item in the whole build for an unattended site.

**Alerting.** Same as your house router — you get an email when the link drops. Otherwise you discover it when you go looking for footage of the thing that happened.

**Bigger solar margin.** My earlier sizing assumed you'd notice a problem. Unattended for weeks, I'd **oversize the panel rather than the battery** — 200–300 W instead of 150 W, keeping the 100 Ah. Panels are cheaper than batteries, and a fat panel means even a run of grey days still tops up. A site that dies in week two of a three-week absence has failed at its only job.

## The gate is your most important camera

Fenced with one gate means one way in. That camera earns more than the other nine combined — it should be the first one you mount, the one with the best coverage, and the one you're most confident about.

## Design it to move

The house is coming near the pole. So the base station wants to migrate indoors later. Keep the runs and mounts arranged so that's a relocation, not a rebuild — the mast stays, the enclosure moves.

Tell me about the well house and I'll rewrite the guide properly around all of this.

---

### 🗣 You · 16:00

if you can, recommend brads for AP's Bridge, UPS, etc.

---

### 🤖 Jr · 16:02

That's genuinely useful information — those five cameras are worth more to you as a **survey map** than as cameras.

## You've already done phase 1 without realising

Five cameras already sited where you want coverage means **you don't have to guess where the clusters are or how far apart** — you have real positions, chosen for real reasons. That's the expensive part of the planning already done.

And their cellular behaviour is a rough proxy for how exposed each spot is. The ones that drop coverage most are likely the ones furthest from the pole or most obstructed — worth noting which is which before you plan the sectors.

## The monthly fees change the economics

Five cellular plans at typical trail-camera pricing is somewhere around **$50–75 a month, so $600–900 a year**. That reframes the build: it isn't only a capability upgrade, it's replacing a recurring bill with hardware you own — *and* fixing the reliability problem at the same time. Cameras that drop coverage constantly aren't really doing their job.

**One caution:** cellular trail cameras generally can't be converted to Wi-Fi. The radio is the product. So plan on replacing them rather than repurposing — and factor the ones you already own as sunk.

**Don't remove them until the Wi-Fi ones are proven.** Run both for a few weeks. You lose nothing but a month of fees, and you get a direct comparison at each position.

## The well house

Small and locked is still better than a pole box **if it's dry and has power** — locked is exactly what you want for equipment on an unattended property.

How small is small? A base station is roughly a shoebox of gear plus a battery. If there's a spare shelf or even floor space in a corner, it beats anything mounted outdoors. If it's genuinely just a pressure tank and no room, then pole-mounted enclosure it is.

**Which cameras drop coverage worst?** That'll tell me where the hardest link is, and I'll size the sectors around it.

---

### 🗣 You · 16:04

The celular cameras will stay for a while (prepaid service for 1 year each) the well house is not that small, I can walk in, etc, it has roon for equipment, get HOT but no rain no direct sun. I will have to add a new Pole near it as its like 50 feet from the existing pole. And it does have power alredy

---

### 🤖 Jr · 16:04

That's a proper base station — shelter, power, a locked door. Two things to get right.

## Heat is now your main enemy

A closed well house in Florida can hit 120–140 °F. That matters more than you'd think:

- **LiFePO4 stops charging safely above about 113 °F.** A good BMS will simply refuse — so your battery quietly stops topping up in July and you find out during an outage.
- Most network gear is rated to about 105–115 °F ambient. Above that they throttle, then reboot, then fail early.

**The fix is cheap: a thermostatic exhaust fan.** A small 12 V fan with a thermostat, high on one wall, plus a low vent on the opposite side for intake. Passive stack ventilation alone helps a lot; add the fan and you'll hold close to outside air temperature.

Also: **battery low, electronics higher, nothing on the floor.** Heat stratifies, and the battery is the part that cares most.

That's a $40 fix for the thing most likely to kill this installation.

## Two poles — bond them together

This is the important one. You'll have the existing pole with the electrical panel, a new pole by the well house, and **Ethernet running between them**.

**Two poles with separate ground rods, joined by a copper cable, is exactly the arrangement that destroys equipment.** During a nearby strike the two grounds sit at different potentials, and your Ethernet becomes the path between them.

So:
- **Bond both poles to the same ground system** with a heavy conductor
- **Surge protector at both ends** of that 50 ft run
- If the panel is your service entrance, have an electrician make the bond

Get this right and lightning is a non-event. Get it wrong and you replace everything, once a year.

## Which pole gets what

The 50 ft between them is nothing for Ethernet, so choose by sightlines, not convenience:

- **Sector antenna** → whichever pole is **taller** and sees the three clusters best
- **Starlink Mini** → wherever it has the clearest sky, no tree canopy overhead
- They don't have to be on the same pole

Worth standing at the top of each — or flying a drone up — before deciding.

**Since the prepaid cellular runs a year**, you've got time to do this properly and in phases, with the existing cameras still watching. That's a comfortable position to build from.

---

### 🗣 You · 16:05

go for it, write the document

---

### 🤖 Jr · 16:09

**Rev 5 is up** — https://bradley.io/junior/doc/farm-network

The tree-trunk detail turned out to matter, so it got its own section. **Your cameras dropping cellular constantly is probably not mainly about cell towers** — it's that a camera at 6–8 ft on a trunk is transmitting through leaves and branches in every direction. The same physics will hit Wi-Fi.

Four things that follow from it:

1. **Mount on the side of the trunk facing the access point.** The trunk is a solid obstacle — you don't want it between the camera and the AP.
2. **Trim a couple of branches.** Often does more than any equipment upgrade.
3. **Straps, not screws** — adjustable, doesn't wound the tree, and moveable when the survey says somewhere else is better.
4. **A 10 ft post in open ground beats a trunk in a thicket**, every time. Since these cameras are self-powered and record locally, a clear line to the AP is worth more than a marginally better view.

Everything else is in there: the well house as base station, the heat problem and its $40 fix, the two-pole bonding hazard, phase 1/phase 2, specific hardware, budget, and build order.

**First job isn't networking — it's ventilating the well house.** Do that before anything electronic goes in, or you'll be replacing a battery that quietly stopped charging in July.

---

**Links**

- https://bradley.io/junior/doc/farm-network — **Rev 5**, print and PDF buttons on the page
- Site v1.0.307

---

### 🗣 You · 16:13

Jr, doc been printed. One comment: I can have my guys build a new 100 sq feet (no permit needed) "storage" shed, next to the electrical panel/pole. The shed will have  metal walls (so the heat) but I can heve them add insulation (spray dense foam) in the inside surfaces and drywall over that. Also add a exhaust fan to ventilate? What do you think?

---

### 🤖 Jr · 16:14

That's a significant upgrade on the well house — purpose-built, next to the power, and room to work. Worth doing. Four things to get right.

## Closed-cell foam, not open-cell — and this matters more than R-value

Sprayed **directly onto the metal, no gap**.

The reason isn't insulation, it's **condensation**. Humid Florida air against cool metal produces water on the inside of your walls. Closed-cell foam is a vapour barrier and eliminates the condensing surface entirely.

**Open-cell foam would be actively wrong here** — it's vapour-permeable, so moisture passes through, reaches the metal, condenses behind the insulation where you'll never see it, and rusts the shed from the inside out.

Make sure whoever sprays it knows it's closed-cell on metal.

## The roof is where the heat comes from

Most of your solar gain is overhead, not through the walls. **Insulate the roof most heavily** — and if you have any say in it, **specify a light-coloured or reflective roof**. White or bare Galvalume against dark metal is worth a genuine 20–30 °F of interior temperature for no extra effort.

If the site allows, orient the door north and put the shed where it gets afternoon shade.

## Drywall over the foam — yes, and it's required

Spray foam needs a **15-minute thermal barrier** by code, and ½" drywall is the standard way to do it. You'd already planned it; just don't let anyone talk you out of it to save a day.

## ⚠️ Bond the metal shed to the ground system

A **metal building**, next to a **pole with an electrical panel**, with **Ethernet running to antennas on that pole**. Everything metal there needs to be bonded to the same ground — the shed, both poles, the panel.

This is the same hazard as the two-pole problem, but worse: a metal building is a large conductive surface. Bond it properly and it's a benefit. Leave it floating and it's one more thing at a different potential during a strike.

Your electrician should handle it as part of the shed's electrical work.

---

## On the exhaust fan — yes, but know its ceiling

A thermostatic exhaust fan plus a low intake vent is the right baseline, and with good insulation it'll hold you close to outside air.

**But ventilation can never get you below ambient.** Florida afternoon at 95 °F means the shed sits around 100–105 °F with your equipment's own heat added. **LiFePO4 stops charging around 113 °F**, so you'd be running with less margin than I'd like on an unattended site.

**So: measure before you decide.** Put a **$20 temperature logger** in the shed once it's built and leave it through a hot spell. Then you'll know whether ventilation is enough or whether you want a small through-wall air conditioner — a 5,000 BTU unit would hold 100 sq ft at 75 °F trivially.

Insulate and ventilate now, measure, and add cooling only if the data says so. Don't guess in either direction.

Want me to fold all this into the guide?

---

### 🗣 You · 16:14

if good, add it as an option in the document

---

### 🤖 Jr · 16:16

**Rev 7** — the shed is now framed as a **later upgrade**, not something to wait for.

The section reads: build on the well house now, ventilate it, and the shed is worth doing when it suits you. Everything you buy — including the ventilation kit — moves across unchanged. It's out of the main budget and noted separately at $4,000–8,000.

All the build detail is still there for when you do it: closed-cell foam onto the metal (open-cell would rust the shed from the inside), reflective roof, drywall thermal barrier, and bonding the metal building to the same ground as the poles.

**The one line I'd keep in mind:** the only thing you'd gain by waiting for the shed is a delay. A $40 fan in the well house gets you started this month.

---

**Links**

- https://bradley.io/junior/doc/farm-network — **Rev 7**, reprint when convenient
- Site v1.0.309

---

### 🗣 You · 16:18

I can later install a small mini split in the Shed

---

### 🤖 Jr · 16:18

A mini-split is better than a through-wall unit for this, and for a reason that isn't obvious.

## Humidity, not just temperature

Florida plus electronics means **moisture matters as much as heat**. And here's the thing:

- **A ventilation fan brings humid outside air *in*.** It controls temperature at the cost of importing moisture.
- **Air conditioning removes moisture continuously** as a side effect of cooling.

For a sealed, insulated shed full of equipment, that dehumidification is worth as much as the cooling.

## Which means the two strategies conflict

**Ventilation and air conditioning are opposites.** One deliberately exchanges inside air for outside; the other seals and conditions. Run both properly and they fight — you'll cool and dehumidify air, then blow it outside.

So the design forks:

| Approach | Shed is | Fan |
|---|---|---|
| **Ventilate** (now) | vented, low intake + high exhaust | thermostatic, primary cooling |
| **Mini-split** (later) | **sealed** | **failsafe only** |

**The good combination:** mini-split as primary, and keep a thermostatic exhaust fan wired as a **high-temperature failsafe** — set to something like 100 °F, so it only runs if the AC has failed. On a property you visit every few weeks, that's real insurance: a dead compressor in July becomes a warm shed rather than a cooked battery.

## Two practical notes

**Set it to 78–80 °F, not 68.** You're protecting equipment, not people. Far less runtime, far less power, and still miles below the 113 °F where LiFePO4 stops charging.

**Seal the line-set penetration properly.** That hole through an insulated metal wall is the obvious path for humid air and insects, and it's the one thing installers routinely do carelessly.

Adding this to the guide as part of the future-shed section.

---

### 🤖 Jr · 16:19

Fullscreen first — **that's my regression.** I added an iframe reload on fullscreen change yesterday and it's likely breaking on the query string I appended.

---

### 🤖 Jr · 16:19

Route's fine with the query string, so the problem is the reload itself — replacing content inside the fullscreen element makes the browser bail out of fullscreen.

Better approach: don't reload, just tell the terminal to re-measure. Same origin, so I can dispatch a resize event straight into the iframe.

---

### 🤖 Jr · 16:20

**Document:** https://bradley.io/junior/doc/farm-network

**Clear the screen:** type `clear` then Enter. Or **Ctrl+L**.

Let me clean it up for you.

---

### 🤖 Jr · 16:21

Found the real problem — there are now **three panes**, and mine is squeezed into **49×12**. That's why it looks like a mess.

The other two are just leftover shells. Clearing them out.

---

### 🤖 Jr · 16:21

One pane now, full **99×26** instead of 49×12. Reload the page and it should be readable again.

**Fullscreen is fixed too** (v1.0.311) — my change yesterday reloaded the terminal on fullscreen, which made the browser drop straight back out. It now just tells the terminal to re-measure instead.

**Document:** https://bradley.io/junior/doc/farm-network — **Rev 8**, with the mini-split section added.

---

On **$289 for 9,000 BTU** — that's cheap enough to be worth checking two things before ordering:

- **Is it a complete DIY kit** with a pre-charged line set and quick-connect fittings? If it needs vacuuming and charging, you need an EPA-certified tech and that's $300–600 of labour on top.
- **9,000 BTU is oversized for 100 sq ft** — that's fine on an inverter unit, which modulates down. On a fixed-speed compressor it'll short-cycle and dehumidify poorly, which for an electronics shed is the wrong failure.

At that price it's still worth having. Just don't be surprised if installation costs more than the unit.

---

### 🗣 You · 16:23

ok, printing. Ill review, check with my AC guys about installation. Talk to you later

---

### 🤖 Jr · 16:23

Good. One thing worth asking your AC guys while you have them: whether that unit is a **DIY pre-charged kit** or needs proper evacuation and charging — it changes the install cost more than the unit price does.

Everything on this side is quiet. The farm doc is Rev 8, the router's been clean for a day, and the terminal should behave now.

Talk later.

---

### 🗣 You · 16:24

in the mean time, try to fix this window, can't scroll back, cnt Ful scree and cant copy and past

---

### 🤖 Jr · 16:24

Let me fix all three properly rather than patching. Checking what's actually in the way.

---

### 🤖 Jr · 16:25

Three separate causes, all now clear:

- **Paste fails** because the iframe has `allow="fullscreen"` only — no clipboard permission
- **Scrollback fails** because `screen` uses the alternate screen buffer, so nothing ever scrolls into tmux's 50,000-line history
- **Fullscreen** is already fixed in v1.0.311; needs a page reload

Fixing the first two.

---

### 🤖 Jr · 16:25

All three applied to the running session, not just saved for next time.

**Reload the page**, then:

| | |
|---|---|
| **Scroll** | **Mouse wheel** should now work directly |
| **Copy** | **Shift + drag** to select, then **Cmd+C** |
| **Paste** | **Cmd+V** |
| **Full screen** | The blue button — fixed in v1.0.312 |

**Shift is the important bit for copying.** Without it, tmux grabs the mouse for its own selection; holding Shift bypasses that and gives you a normal browser selection you can copy.

## What was actually wrong

**Paste** — the iframe only had permission for fullscreen. Clipboard access has to be granted twice for an embedded frame: once in the `allow` attribute and once in the page's Permissions-Policy header. It had neither, so Chrome silently refused. Both are now set.

**Scrollback** — `screen` was using the alternate screen buffer, which draws in place and never scrolls anything anywhere. tmux had a 50,000-line history sitting completely empty, and the browser's scrollbar had nothing to show. Turning that off lets output flow into tmux's history where the wheel can reach it.

**Fullscreen** — my own regression, already fixed.

If the wheel still doesn't scroll after a reload, tell me — the fallback is **Ctrl-B then `[`**, arrow keys or PageUp to scroll, `q` to exit. But it should just work now.

---

### 🗣 You · 16:33

Full screen now goes full screen but smal window work area, rest filled with dots

---

### 🤖 Jr · 16:33

Fullscreen works now but the terminal isn't re-measuring — so my resize event isn't reaching ttyd. Let me force a real layout change instead of a synthetic event.

---

### 🤖 Jr · 16:35

I've been fixing the wrong thing, and I should have seen it sooner.

**You cannot scroll back, and no terminal setting will change that.** Claude Code is a full-screen application — it *redraws* the screen rather than printing lines that scroll upward. There's no scrollback to reach, because nothing ever scrolls off. tmux's 50,000-line history is empty for that pane and always will be.

So let me give you what you actually want instead: **a web page with everything I've said, that you scroll in the browser like any other page.**

---
