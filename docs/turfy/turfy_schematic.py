"""TURFY sidecar board v0.1 -- build schematic, 4 sheets."""
import schemdraw
import schemdraw.elements as elm
from schemdraw.elements import Ic, IcPin

schemdraw.config(lw=1.4, fontsize=11)

TITLE_KW = dict(fontsize=14, color='black')

def titleblock(d, sheet, name):
    d += elm.Label().at((0, -1.6)).label(
        f'TURFY SIDECAR v0.1  --  SHEET {sheet}: {name}   '
        f'(Rain Bird ESP-6Si retrofit)', loc='right', fontsize=13, halign='left')

# ---------------------------------------------------------------- SHEET 1
# 24VAC power tap + one valve channel through zone bank & transfer bank
d1 = schemdraw.Drawing()

d1 += elm.Dot(open=True).label('Rain Bird VT1 (24VAC HOT)', loc='left')
d1 += elm.Line().right(1.2)
F = d1.add(elm.Fuse().right().label('F1\n1 A', loc='top'))
d1 += elm.Line().right(1.0)
tap = d1.add(elm.Dot())
# MOV across VT after fuse
d1 += elm.Line().at(tap.start).down(0.9)
d1 += (rv := elm.RBox().down().label('RV1\nMOV 39V', loc='bottom'))
d1 += elm.Line().down(0.5)
vt2a = d1.add(elm.Dot())
d1 += elm.Line().at(vt2a.start).left(5.6)
d1 += elm.Dot(open=True).label('Rain Bird VT2 / COM (24VAC RET)', loc='left')

# 24VAC_HOT rail to zone bank
d1 += elm.Line().at(tap.start).right(1.6).label('24VAC_HOT', loc='top')

zone = d1.add(Ic(pins=[
        IcPin(name='COM1', side='left', pin='C1'),
        IcPin(name='IN1', side='bottom', pin=''),
        IcPin(name='VCC', side='top', pin=''),
        IcPin(name='GND', side='bottom', pin=''),
        IcPin(name='NO1', side='right', pin=''),
    ], edgepadW=1.2, edgepadH=.6, pinspacing=1.5, leadlen=.8,
    label='ZONE BANK\n8-ch relay board\nrelay K1 shown\n(typ. of 7)')
    .anchor('COM1').at(d1.here))

d1 += elm.Line().at(zone.NO1).right(1.4)

xfer = d1.add(Ic(pins=[
        IcPin(name='NO1', side='left', pin=''),
        IcPin(name='NC1', side='left', pin=''),
        IcPin(name='C1', side='right', pin='COM1'),
        IcPin(name='IN', side='bottom', pin='IN1..8\n(tied)'),
        IcPin(name='VCC', side='top', pin=''),
        IcPin(name='GND', side='bottom', pin=''),
    ], edgepadW=1.4, edgepadH=.6, pinspacing=1.6, leadlen=.8,
    label='TRANSFER BANK\n8-ch relay board\nrelay K1 shown\n(typ. of 7)')
    .anchor('NO1').at(d1.here))

# Rain Bird station feed into NC
d1 += elm.Line().at(xfer.NC1).left(2.6)
d1 += elm.Dot(open=True).label('Rain Bird ST1', loc='left')

# valve out
d1 += elm.Line().at(xfer.C1).right(1.2).label('valve field wire 1', loc='top')
d1 += (sol := elm.Inductor2(loops=3).down().label('V1\n24VAC solenoid', loc='bottom'))
d1 += elm.Line().down(0.4)
d1 += elm.Line().left(3.0)
d1 += elm.Dot(open=True).label('valve COM field wire -> Rain Bird COM terminal', loc='bottom')

# IN bus notes
d1 += elm.Line().at(xfer.IN).down(0.8)
d1 += elm.Dot(open=True).label('AUTH_BUS (sheet 2)', loc='bottom')
d1 += elm.Line().at(zone.IN1).down(0.8)
d1 += elm.Dot(open=True).label('ZDRV1 (sheet 4)', loc='bottom')

d1 += elm.Line().at(zone.VCC).up(0.5).label('+5V (relay PSU)', loc='top')
d1 += elm.Line().at(xfer.VCC).up(0.5).label('+5V (relay PSU)', loc='top')
d1 += elm.Line().at(zone.GND).down(0.4)
d1 += elm.Ground()
d1 += elm.Line().at(xfer.GND).down(0.4)
d1 += elm.Ground()

titleblock(d1, 1, 'POWER + VALVE PATH  --  channel table: '
              'ch1..6 = zones 1..6, ch7 = MV/pump, ch8 spare')
d1.save('/home/claude/sheet1.pdf')
d1.save('/home/claude/sheet1.png', dpi=150)

# ---------------------------------------------------------------- SHEET 2
# 555 missing-pulse watchdog + authority AND
d2 = schemdraw.Drawing()

ic555 = d2.add(elm.Ic555().label('U1\nNE555', loc='top', ofst=.3))
# pins: TRG(-1,1) THR(-1,2.5) DIS(-1,4) left; OUT(4.5,3.25) CTL(4.5,1.75) right;
#       RST(1,6) Vcc(2.5,6) top; GND(1.75,-1) bottom

# --- Vcc rail (y=7) ---
d2 += elm.Line().at(ic555.Vcc).up(1.0)
d2 += elm.Line().at(ic555.RST).up(1.0)
d2 += elm.Line().at((-6.5, 7)).to((2.5, 7))
d2 += elm.Dot().at((1, 7))
d2 += elm.Dot().at((-3, 7))
d2 += elm.Line().at((2.5, 7)).up(0.4).label('+5V', loc='top')
d2 += elm.Capacitor().at((-6.5, 7)).down(1.4).label('C3\n100n', loc='left')
d2 += elm.Ground()

# --- timing network, left of chip ---
d2 += elm.Resistor().at((-3, 7)).down(3.0).label('R1\n220k', loc='left')
d2 += elm.Dot().at((-3, 4))                              # cap-top node N
d2 += elm.Line().at((-3, 4)).to(ic555.DIS)
d2 += elm.Line().at((-3, 4)).down(1.5)
d2 += elm.Dot().at((-3, 2.5))
d2 += elm.Line().at((-3, 2.5)).to(ic555.THR)
d2 += elm.Capacitor().at((-3, 2.5)).down(1.4).label('C1\n100uF\nlow-leak', loc='left')
d2 += elm.Ground()

# --- Q3 discharge PNP: emitter on node N, collector to GND ---
d2 += elm.Line().at((-3, 4)).left(1.5)
q3 = d2.add(elm.BjtPnp(circle=True).right().flip()
            .anchor('emitter').at((-4.5, 4)).label('Q3\n2N3906', loc='top', ofst=.4))
d2 += elm.Line().at(q3.collector).down(0.25)
d2 += elm.Ground()
d2 += elm.Resistor().at(q3.base).left(1.5).label('R2\n10k', loc='top')
hbx, hby = float(d2.here[0]), float(d2.here[1])
d2 += elm.Dot()
d2 += elm.Line().at((hbx, hby)).left(1.0)
d2 += elm.Dot(open=True).label('HEARTBEAT\nPi GPIO27\nidle HIGH\n50ms LOW pulses', loc='left')
# heartbeat also drives TRG (pin 2): drop below everything, run right
d2 += elm.Line().at((hbx, hby)).toy(-0.5)
d2 += elm.Line().tox(-1.8)
d2 += elm.Line().toy(1.0)
d2 += elm.Line().to(ic555.TRG)

# --- CTL bypass + chip GND ---
d2 += elm.Capacitor().at(ic555.CTL).down(1.2).label('C2\n10n', loc='right')
d2 += elm.Ground()
d2 += elm.Line().at(ic555.GND).down(0.4)
d2 += elm.Ground()

# --- authority AND chain, right side ---
d2 += elm.Line().at(ic555.OUT).right(1.2)
d2 += elm.Resistor().right(2.0).label('R3 10k', loc='top')
q1 = d2.add(elm.BjtNpn(circle=True).right()
            .anchor('base').at(d2.here).label('Q1\n2N2222', loc='right', ofst=.3))
d2 += elm.Line().at(q1.collector).up(1.2)
d2 += elm.Line().right(1.5)
d2 += elm.Dot(open=True).label('AUTH_BUS -> transfer bank\nIN1..8 tied (active LOW)', loc='right')
q2 = d2.add(elm.BjtNpn(circle=True).right()
            .anchor('collector').at(q1.emitter).label('Q2\n2N2222', loc='right', ofst=.3))
d2 += elm.Resistor().at(q2.base).left(2.0).label('R4 10k', loc='top')
d2 += elm.Line().toy(-1.8)
d2 += elm.Dot(open=True).label('AUTHORITY  Pi GPIO17 (pull-down, active HIGH)', loc='bottom')
d2 += elm.Line().at(q2.emitter).down(0.3)
d2 += elm.Ground()

titleblock(d2, 2, 'WATCHDOG (missing-pulse detector, t=1.1*R1*C1 ~ 24 s) '
              '+ AUTHORITY AND GATE')
d2.save('/home/claude/sheet2.pdf')
d2.save('/home/claude/sheet2.png', dpi=150)
# ---------------------------------------------------------------- SHEET 3
# Sense channel, typical of 7
d3 = schemdraw.Drawing()

d3 += elm.Dot(open=True).label('Rain Bird STn', loc='left')
d3 += elm.Resistor().right().label('Rs\n2.2k 1W', loc='top')
opto = d3.add(Ic(pins=[
        IcPin(name='A1', side='left', pin='1'),
        IcPin(name='A2', side='left', pin='2'),
        IcPin(name='C', side='right', pin='5'),
        IcPin(name='E', side='right', pin='4'),
    ], edgepadW=.8, edgepadH=.5, pinspacing=1.4, leadlen=.6,
    label='U_n\nH11AA1\n(AC-input opto)')
    .anchor('A1').at(d3.here))
d3 += elm.Line().at(opto.A2).left(1.6)
d3 += elm.Line().down(1.2)
d3 += elm.Line().left(1.0)
d3 += elm.Dot(open=True).label('Rain Bird COM', loc='left')

d3 += elm.Line().at(opto.C).right(1.0)
cnode = d3.add(elm.Dot())
d3 += elm.Resistor().up().label('Rp 10k', loc='right')
d3 += elm.Line().up(0.3).label('+3.3V (Pi)', loc='top')
d3 += elm.Capacitor().at(cnode.start).down().label('Cf 1uF', loc='left')
d3 += elm.Ground()
d3 += elm.Line().at(cnode.start).right(1.6)
d3 += elm.Dot(open=True).label('SENSE_n -> Pi GPIO\n(LOW = station energized)', loc='right')
d3 += elm.Line().at(opto.E).right(0.6)
d3 += elm.Line().down(1.6)
d3 += elm.Ground()

titleblock(d3, 3, 'SENSE FRONT-END (typ. of 7)  --  n: ST1..ST6 -> GPIO 5,6,13,19,26,16;  MV -> GPIO 20')
d3.save('/home/claude/sheet3.pdf')
d3.save('/home/claude/sheet3.png', dpi=150)

# ---------------------------------------------------------------- SHEET 4
# Pi I2C -> MCP23017 -> zone bank inputs
d4 = schemdraw.Drawing()

mcp = d4.add(Ic(pins=[
        IcPin(name='SDA', side='left', pin='13'),
        IcPin(name='SCL', side='left', pin='12'),
        IcPin(name='RESETn', side='left', pin='18'),
        IcPin(name='A0', side='bottom', pin='15'),
        IcPin(name='A1', side='bottom', pin='16'),
        IcPin(name='A2', side='bottom', pin='17'),
        IcPin(name='VSS', side='bottom', pin='10'),
        IcPin(name='VDD', side='top', pin='9'),
        IcPin(name='GPA0', side='right', pin='21'),
        IcPin(name='GPA7', side='right', pin='28'),
    ], edgepadW=1.4, edgepadH=.8, pinspacing=1.4, leadlen=.8,
    label='U2\nMCP23017\naddr 0x20'))

d4 += elm.Line().at(mcp.SDA).left(1.4)
d4 += elm.Dot(open=True).label('Pi SDA (GPIO2)', loc='left')
d4 += elm.Line().at(mcp.SCL).left(1.4)
d4 += elm.Dot(open=True).label('Pi SCL (GPIO3)', loc='left')

d4 += elm.Resistor().at(mcp.RESETn).left(1.2).label('10k', loc='top')
d4 += elm.Line().up(1.0).label('+3.3V', loc='top')

for a in ('A0', 'A1', 'A2', 'VSS'):
    d4 += elm.Line().at(getattr(mcp, a)).down(0.5)
    d4 += elm.Ground()

d4 += elm.Line().at(mcp.VDD).up(0.5).label('+3.3V (Pi)', loc='top')

d4 += elm.Line().at(mcp.GPA0).right(1.6)
d4 += elm.Dot(open=True).label('-> ZONE BANK IN1  (ZDRV1)', loc='right')
d4 += elm.Line().at(mcp.GPA7).right(1.6)
d4 += elm.Dot(open=True).label('-> ZONE BANK IN8  (GPA0..7 -> IN1..8)', loc='right')
d4 += elm.Label().at((mcp.GPA0[0]+0.8, (mcp.GPA0[1]+mcp.GPA7[1])/2)).label(
    '(GPA1..6 -> IN2..7)', fontsize=10)
d4 += elm.Label().at((mcp.VSS[0]+3.5, mcp.VSS[1]-1.8)).label(
    'active LOW = valve on;  POR: all pins hi-Z -> relays OFF', fontsize=10)

titleblock(d4, 4, 'ZONE DRIVE  --  init IODIRA=0x00, OLATA=0xFF; '
              'one bit low at a time (software interlock)')
d4.save('/home/claude/sheet4.pdf')
d4.save('/home/claude/sheet4.png', dpi=150)

print('sheets rendered')
