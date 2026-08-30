# TURFY Sidecar Board v0.1 — Transfer Relay + Hardware Watchdog

Sidecar controller for Rain Bird ESP-6Si. Rain Bird remains default authority;
Turfy (RPi) takes over only when its daemon is alive and asserting. Any failure
(power, kernel panic, daemon crash, wedged I2C) reverts to Rain Bird with zero
software involvement.

---

## 1. Architecture

```
                         24VAC (Rain Bird VT terminals, shared transformer)
                              │
                    ┌─────────┴──────────┐
                    │ fuse 1A + MOV       │
                    │                     │
   ┌────────────┐   │   ┌─────────────┐   │
   │ Rain Bird  │   └──▶│ ZONE BANK   │   │
   │ ESP-6Si    │       │ 8ch relay   │◀──┼── MCP23017 (I2C 0x20) ◀── Pi I2C
   │ ST1..ST6   │       │ (Turfy out) │   │
   └─────┬──────┘       └──────┬──────┘   │
         │ NC                  │ NO       │
         ▼                     ▼          │
   ┌──────────────────────────────────┐   │
   │ TRANSFER BANK  8ch SPDT relay    │◀──┴── AUTHORITY line
   │ COM ──▶ valve field wires 1..6+MV│       (Pi GPIO ∧ watchdog, via
   └──────────────────────────────────┘        2× NPN series AND)
                                                    ▲
                                        555 missing-pulse detector
                                                    ▲
                                        HEARTBEAT GPIO (daemon-toggled)
```

Valve common wire: **stays on Rain Bird COM terminal.** Never moves. Shared
transformer = both controllers switch the same hot leg = paralleled outputs are
harmless even during relay bounce.

**Rule that must survive all future revisions: no second 24VAC transformer while
the NC path to the Rain Bird exists.** Out-of-phase secondaries through the
transfer relay = circulating current, dead triacs.

---

## 2. Per-zone signal path

| Zone n | Transfer relay NC | Transfer relay NO | Transfer relay COM |
|--------|-------------------|-------------------|--------------------|
| 1–6    | Rain Bird STn terminal | Zone-bank relay n NO | Valve field wire n |
| MV (ch7) | Rain Bird MV terminal | Zone-bank relay 7 NO | MV/pump field wire |

Zone-bank relay n: COM → 24VAC HOT (fused tap from VT), NO → transfer relay NO.
NC unused. Channel 8 spare on both banks.

De-energized transfer bank = Rain Bird wired exactly as today. You can pull
Turfy's power mid-cycle and the system is stock.

---

## 3. Authority chain (the safety core)

Both relay boards are the standard opto-isolated **active-LOW** type. All 8 IN
pins of the transfer bank tied together = AUTHORITY line. It is pulled low
(relays engage, Turfy in control) only through two NPNs in series:

```
TRANSFER BANK IN1..8 (tied) ──┬── board's internal pull-up to VCC
                              │
                            C Q1  2N2222
   555 pin 3 ──[10k]── B Q1
                            E Q1
                              │
                            C Q2  2N2222
   Pi AUTHORITY GPIO ──[10k]── B Q2
                            E Q2
                              │
                             GND
```

Authority asserted ⇔ (daemon heartbeat alive) ∧ (Pi explicitly says yes).
Either transistor off → line floats high → transfer bank drops → Rain Bird.

### 555 missing-pulse detector

Classic retriggerable monostable: PNP (2N3906) across the timing cap, base
driven by the heartbeat. Each pulse discharges C and restarts the cycle;
pin 3 stays HIGH while pulses keep arriving.

- Timeout t = 1.1·R·C. **R = 220k, C = 100µF low-leakage electrolytic → ~24s.**
- Heartbeat: Pi GPIO, active-low pulse ~50ms, toggled from the **turfy daemon
  main loop** — never a cron job, never hardware PWM. The heartbeat must prove
  application liveness, not kernel liveness.
- 555 runs on the 5V rail. Decouple with 100nF at pin 8, 10nF at pin 5.

### Boot sequence

1. Pi boots. AUTHORITY GPIO configured with pull-down → Q2 off → Rain Bird in
   control regardless of any GPIO chatter.
2. MCP23017 powers up with all pins as inputs (POR default) → zone bank
   pull-ups keep all zone relays off. Defined state, no init race.
3. turfy.service starts, self-checks (I2C ack from MCP, config sane, time
   synced), starts heartbeat, *then* raises AUTHORITY.
4. Watchdog charges within one timeout period; transfer bank engages.

---

## 4. Zone drive

MCP23017 @ 0x20, GPA0–GPA7 → zone bank IN1–IN8 (active low: write 0 = valve on).
POR state = high-Z inputs = all off. Initialize IODIRA=0x00, OLATA=0xFF, then
clear individual bits to fire zones. **Software interlock: max one zone bit low
at a time** (transformer VA budget + water pressure).

GPB0–GPB7 reserved (flow meter pulse counting is better on Pi GPIO with edge
IRQs, but GPB gives you 8 spare driven outputs for status LEDs / future).

---

## 5. Sensing front-end (phase 0 — passive logging)

One H11AA1 per Rain Bird station output (AC-input opto, back-to-back LEDs, no
polarity concern):

```
Rain Bird STn ──[2.2k 1W]── H11AA1 pins 1,2 ── Rain Bird COM
H11AA1 pin 5 (C) ──┬── 10k pull-up to 3.3V ──── Pi GPIO n
                   └── 1µF to GND   (smooths 120Hz half-cycle pulsing)
pin 4 (E) ── GND
```

~10mA LED current at 24VAC. Output is a clean low while the station is
energized. Six of these + MV = 7 GPIOs. Run this bank for a couple of weeks
before ever asserting authority: validates zone mapping, logs the Rain Bird's
actual schedule as baseline, exercises your whole software stack risk-free.

---

## 6. Power & grounding

- Pi: its own 5V USB-C supply. Do not derive from the 24VAC in v0.1.
- Relay boards: 5V from a separate 2A 5V supply (7 transfer coils ≈ 500mA
  alone). Keep JD-VCC jumper installed for prototype; split later if opto
  isolation to the coil side is wanted.
- Grounds: Pi GND, relay board GND, 555 GND, opto emitter GND — single point.
- 24VAC side floats relative to logic ground. Never bond them.
- Fuse the VT hot tap at 1A; MOV (e.g. V39ZA05, ~39V clamp) across VT.
- Field wiring and logic wiring on opposite sides of the enclosure.

---

## 7. GPIO map (BCM)

| GPIO | Function | Notes |
|------|----------|-------|
| 17   | AUTHORITY | pull-down default, active high |
| 27   | HEARTBEAT | toggled by daemon loop |
| 2,3  | I2C1 SDA/SCL | MCP23017 @ 0x20 |
| 5,6,13,19,26,16,20 | SENSE 1–6, MV | H11AA1 inputs, pull-up, active low |
| 21   | spare (flow meter pulses) | edge IRQ |

---

## 8. BOM

| Qty | Part | Role |
|-----|------|------|
| 2 | 8-ch 5V opto relay board (SPDT, NO/NC exposed) | transfer bank, zone bank |
| 1 | MCP23017 | zone drive, defined POR state |
| 1 | NE555 + 2N3906 + 220k + 100µF + decoupling | watchdog |
| 2 | 2N2222 + 10k | authority AND |
| 7 | H11AA1 + 2.2k 1W + 10k + 1µF | sense bank |
| 1 | 1A fuse + holder, MOV 39V | 24VAC tap protection |
| 1 | 5V 2A supply | relay coils |
| — | terminal blocks, DIN enclosure | field wiring |

---

## 9. Failure mode table

| Failure | Result |
|---------|--------|
| Pi power loss / kernel panic | heartbeat stops → watchdog drops → Rain Bird |
| Daemon crash / hang | same (heartbeat is daemon-owned) |
| Pi reboot GPIO chatter | AUTHORITY pull-down + MCP POR = no valve action |
| I2C bus wedge | zones frozen, but daemon detects NAK → drops AUTHORITY |
| Relay board 5V supply dies | transfer coils drop → Rain Bird |
| Software leaves zone latched | watchdog still fed → **not covered**; mitigate with daemon-internal max-runtime timer per zone + (v0.2) flow meter alarm |
| Both controllers energize same zone | harmless (shared transformer, same phase) |

The one hole (latched zone with healthy daemon) is a software invariant:
hard-cap every zone activation at max_runtime in the driver layer itself, not
the scheduler.
