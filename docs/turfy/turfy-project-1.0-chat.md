
FUN PROJECT TIME! I have a simple sprinkler system at home. I’d like to make an AI driven, weather informed, maybe with cameras and sensors system.

I have raspberry pi’s, esp32s, relays - what I don’t have yet is a circuit diagram of the device and any gotchas related to irrigation systems :)


Excellent target — the ESP-6Si is about as simple as irrigation controllers get, which makes it easy to replace outright rather than tap into.

**The circuit, demystified**

There's almost nothing inside. It's a 24VAC transformer, a microcontroller, and one triac per station. Field wiring:

- **COM (common):** one wire shared by all valves, returns to one leg of the 24VAC transformer
- **Stations 1–6:** one wire each; controller connects station wire to the other 24VAC leg to open that valve
- Each valve is a 24VAC solenoid: ~300–400mA inrush, ~200–250mA holding, inductive load
- Possibly **MV/pump** terminal (master valve or pump start relay — energizes with any station)
- Possibly a rain sensor wired in series with the common (normally closed; opens to inhibit watering)

So your replacement is: 24VAC transformer (reuse the Rain Bird's) → relay/triac per zone → valve. That's it. You can literally unscrew the terminal block wires and move them to your own board.

**Gotchas**

- **It's AC, not DC.** Standard opto-isolated relay boards work fine for switching 24VAC, but solid-state alternatives must be triacs (e.g. MOC3041 opto-triac driving a BTA16), not MOSFETs. Put an MOV or RC snubber across each output — solenoids kick.
- **Never leave a zone latched on by software bug.** Add a hardware dead-man: master valve on its own relay, watchdog timer that kills the transformer via a mains-side relay if the MCU wedges, or both. A stuck valve = flooded yard = huge water bill. This is the #1 failure mode of DIY controllers.
- **One zone at a time** (maybe two). The transformer is typically 20–30VA and your water pressure drops with concurrent zones anyway. Sequence, don't parallelize.
- **Common wire integrity:** all zones share it. If your board's relay contacts switch the station side (correct), the common stays hot to the transformer permanently — fine, valves only energize when the circuit completes.
- **Soil moisture sensors:** capacitive only. Resistive probes electrolyze and die in weeks.
- **Flow meter is the killer feature:** an inline pulse flow meter lets you detect stuck valves, broken heads (flow too high), and clogged lines (flow too low) per zone. Learn each zone's baseline GPM, alarm on deviation.
- **Outdoor enclosure:** the valve wires run underground; expect induced noise and occasional moisture ingress. Keep GPIO away from field wiring — relays give you isolation for free.

**Software angle**

Worth knowing before you build from scratch: **OpenSprinkler** is fully open source (firmware + hardware schematics published — you can crib their triac output stage directly), and **ESPHome** has a first-class `sprinkler` component with zone sequencing, valve overlap, and run-time multipliers built in — that multiplier is exactly where weather-adjusted scaling plugs in.

For the weather logic, the principled approach is ET-based scheduling: compute daily ET₀ (Penman-Monteith, or the simpler Hargreaves if you only have temp data) from a weather API or your own sensors, subtract rainfall, and scale zone runtimes to replace the deficit. That's what the "Adjust Water %" knob on the Rain Bird crudely approximates. Camera + CV for turf stress detection would be genuinely novel on top of that — NDVI-ish greenness index from a cheap camera is doable.

Suggested first increment, in your usual style: pull the six station wires + common onto an ESP32 relay board, replicate dumb scheduling, validate valves actuate, then layer in flow metering and ET. Want a wiring diagram or the ESPHome config skeleton to start?


Sidecar is the right architecture — Rain Bird stays as the fallback brain, Turfy takes over only when healthy. There's one hard rule that shapes the whole design:

**Never parallel two 24VAC sources.** If Turfy has its own transformer and you just wire both controllers' station outputs together, the two secondaries are almost certainly out of phase and you get circulating current, backfeed into the Rain Bird's triacs, and dead controllers. Two clean ways around it:

**Option A — shared transformer (simplest).** Steal 24VAC from the Rain Bird's VT terminals as Turfy's valve supply. Now both controllers switch the *same* hot leg, so paralleled outputs are electrically harmless — worst case both energize a zone, which is a scheduling problem not a smoke problem. Set the Rain Bird dial to OFF when Turfy is active and it's a pure passthrough. Cheap, but the 20–30VA transformer now feeds both, and a bug in either controller can water the lawn.

**Option B — transfer relays (the proper sidecar).** SPDT relay per zone: Rain Bird station output on **NC**, Turfy output on **NO**, valve wire on the common pole. One "authority" line from the Pi pulls all the transfer relays. This gets you a genuinely fail-safe property: Turfy unpowered, crashed, or watchdog-tripped → relays drop → Rain Bird is back in control with zero software involved. This is the classic ATS pattern and it's what I'd build. You can even do it with a single DPDT on the hot+common feed instead of per-zone if you're happy switching wholesale.

**Pi-side control chain**

Pi GPIO → relay board has one gotcha you'll care about: **Pi GPIO state during boot is undefined-ish** — pins float, some default to pull-up, and a reboot can chatter the relays. Three mitigations, use at least one:

- Pick GPIOs that default to pull-*down* and use active-high relay boards (most cheap boards are active-low, so check)
- Put an I2C GPIO expander (MCP23017 / PCF8574) between Pi and relays — defined power-on state, all outputs off until you initialize
- Gate everything behind the authority relay: relays can chatter all they want during boot if the transfer switch hasn't handed over yet. This is the elegant one — boot sequence becomes: Pi up → turfy service starts → self-check → *then* assert authority

Relay vs triac: for a sidecar prototype, mechanical relays win. Full galvanic isolation, no snubber tuning, no leakage current holding a valve half-engaged (triacs leak a few mA; usually fine, occasionally a sensitive solenoid buzzes). A bog-standard 8-channel opto relay board is 6 zones + master valve + spare. Move to MOC3041+BTA16 triacs later if relay clicks offend you — they won't wear out at 2 cycles/day either way, so relays are honestly fine forever here.

**The watchdog, concretely**

Hardware timer (a 555 monostable retriggered by a Pi heartbeat GPIO, or an ATtiny/ESP32 doing the same job with more grace) in series with the authority relay coil. Pi must toggle the heartbeat every N seconds or authority drops and the Rain Bird resumes. Now a kernel panic mid-watering fails over instead of flooding.

**Bonus: learn before you leap**

Before Turfy ever takes authority, wire an AC-input optocoupler (H11AA1, or a small bridge + regular opto + series resistor) from each Rain Bird station output to Pi GPIOs. Turfy passively logs when the Rain Bird actually waters — you validate your sensing, your zone mapping, and collect baseline schedule data while the old brain is still driving. Zero risk instrumentation phase, very much your validate-each-layer pattern.

Want the actual schematic for the transfer-relay + watchdog board next, or the sensing front-end first?


Good — board photos will confirm the triac part numbers and whether there's an MV terminal. Meanwhile, here's the recipe.Full recipe above: transfer bank + zone bank as two stock 8-ch relay boards, 555 missing-pulse watchdog ANDed with an AUTHORITY GPIO via two series NPNs, MCP23017 for defined power-on state on the zone drive, and the H11AA1 sense bank for the passive logging phase.

Design decisions worth flagging: the heartbeat comes from the daemon main loop specifically (PWM or cron would keep ticking after a crash and defeat the whole point), and the one failure mode the watchdog *can't* catch — healthy daemon, latched zone — gets closed by a max-runtime cap in the driver layer plus the flow meter in v0.2.

When you get the board photo, the useful things to confirm: triac part numbers on the station outputs, whether there's an MV/pump terminal populated, and the transformer VA rating (usually printed on it) — that sets how many simultaneous coils the shared supply tolerates during transfer-relay handover.



Sheets 1, 3, 4 are close. Sheet 2 routing is tangled — rewriting it with explicit geometry.Six-page build package: cover with build rules, channel map, GPIO map, BOM, and a 5-step acceptance test, then four schematic sheets —

1. **Power + valve path** — 24VAC tap (fuse + MOV), one channel drawn through zone bank → transfer bank → valve, typical of 7
2. **Watchdog + authority** — 555 missing-pulse detector (datasheet topology: PNP discharges the timing cap on each heartbeat, pin 2 co-triggered) feeding the Q1/Q2 series AND that sinks the transfer bank's tied IN bus
3. **Sense front-end** — H11AA1 channel, typical of 7
4. **Zone drive** — Pi I2C → MCP23017 → zone bank inputs

The schemdraw source is included too — everything's parametric, so when the board photo tells us something (say, no MV terminal, or you want the timeout shorter), it's a one-line edit and re-render rather than redrawing.

One thing I put on the cover deliberately: acceptance test step 1 is a continuity check proving the de-energized transfer bank leaves the Rain Bird path fully intact — that's the property the whole design hangs on, so it gets verified with a meter before anything is powered.



Nice — these confirm the architecture and add a few useful details.

**What's on the boards**

- **Power board (949-26330 REV2):** the row of TO-92-ish black parts labeled TH1–TH8 are the station triacs — 8 positions because this board is shared across the ESP-4/6/8Si line. Red discs are per-output MOVs, plus MOV1/MOV10 near the input and a glass fuse on the 24VAC feed. So Rain Bird already fuses and clamps its side; our F1/RV1 protect the tap independently. Good.
- **Logic board (049-26062 REV4):** discrete transistor gate drivers (the TO-92 rows on the right) between the micro and the triacs, everything through the board-to-board pin header. The "NP" marks are unpopulated positions for sibling models.
- **COB daughtercard (x9-26326 REV2):** the epoxy blob is the microcontroller, with the crystal and that S1/S2 solder-jumper table — that's the station-count config (4/6/8) for the shared module. "OPEN:ACTIVE HIGH / CLOSE:ACTIVE LOW" is the jumper sense legend, not an I/O spec.
- That pink lithium pack wired to the BLACK/RED pads is an aftermarket coin-cell replacement someone soldered in. It's what holds time/program through outages — i.e., it's what makes the Rain Bird a *trustworthy* fallback after a power blip. Worth metering; if it's dead, the fallback boots into 12:00 default-program land.
- Green wire = earth to the chassis/GND pad. Leave it, and keep Turfy's logic ground unbonded from it per the build rules.

**Design impacts — all minor**

1. **Sidecar tap point confirmed:** field wires land on the screw terminal block on the power board. Zone wires lift straight off; nothing needs to touch these boards.
2. **Triac leakage vs. sense bank:** with the Rain Bird "off," each triac leaks a little through its MOV network into our H11AA1 path. With Rs=2.2k the LED needs ~1V+ before it conducts, so leakage almost certainly reads as off — but add it to the acceptance test: scope a SENSE line with the station idle and confirm a solid high before trusting the logger.
3. One photo detail I can't resolve: the terminal block legend. Snap the printed labels next to the screws when you're back at it — that settles whether MV is broken out on the 6Si (the 8th triac position suggests the board supports it even if the terminal isn't populated).

Blob micro, triacs, one fuse, and a hobbyist battery hack — 1990s Rain Bird engineering, fully mapped. The sidecar design stands as drawn.