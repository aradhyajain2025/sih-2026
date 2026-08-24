import { useSim } from '../../state/SimContext'
import { kw } from '../../lib/format'

// ---- static node geometry (viewBox 0 0 1000 580) ----
const VB_W = 1000
const VB_H = 580

interface Box {
  x: number
  y: number
  w: number
  h: number
}
const N = {
  solar: { x: 40, y: 48, w: 150, h: 62 },
  mppt: { x: 250, y: 56, w: 96, h: 46 },
  sl: { x: 40, y: 194, w: 150, h: 62 },
  newb: { x: 40, y: 298, w: 150, h: 62 },
  grid: { x: 40, y: 450, w: 150, h: 62 },
  ctrl: { x: 430, y: 214, w: 170, h: 150 },
  evst: { x: 690, y: 250, w: 120, h: 78 },
} satisfies Record<string, Box>

const AMBER = '#E8A33D'
const BLUE = '#6C8CFF'
const TEAL = '#35C4C1'
const FAULT = '#E24C4C'
const HAIR = '#232933'
const TXT = '#E7EAEE'
const MUT = '#8A93A3'

type Pt = [number, number]

function Link({
  pts,
  color,
  power,
  maxPower,
  reverse = false,
  faulted = false,
}: {
  pts: Pt[]
  color: string
  power: number
  maxPower: number
  reverse?: boolean
  faulted?: boolean
}) {
  const d = pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`)
    .join(' ')
  const active = power > 0.5 && !faulted
  const width = active
    ? Math.max(1.6, Math.min(8, 1.6 + (Math.abs(power) / maxPower) * 6.4))
    : 1

  if (!active) {
    return (
      <path
        d={d}
        fill="none"
        stroke={faulted ? FAULT : HAIR}
        strokeWidth={faulted ? 1.4 : 1}
        strokeDasharray={faulted ? '2 4' : undefined}
        opacity={faulted ? 0.7 : 0.55}
      />
    )
  }
  return (
    <g>
      {/* faint static base so topology reads even mid-animation */}
      <path d={d} fill="none" stroke={color} strokeWidth={width} opacity={0.22} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeDasharray="7 7"
        className="animate-flow"
        style={reverse ? { animationDirection: 'reverse' } : undefined}
        strokeLinecap="round"
      />
    </g>
  )
}

function Node({
  box,
  title,
  value,
  sub,
  tone,
  alarm = false,
  emphasize = false,
}: {
  box: Box
  title: string
  value?: string
  sub?: string
  tone: string
  alarm?: boolean
  emphasize?: boolean
}) {
  const border = alarm ? FAULT : tone
  const cx = box.x + box.w / 2

  // Build the centered text stack so lines never overlap regardless of height.
  const lines: {
    text: string
    fill: string
    size: number
    weight: number
    mono: boolean
  }[] = [
    {
      text: title,
      fill: TXT,
      size: emphasize ? 14 : 12,
      weight: 600,
      mono: false,
    },
  ]
  if (value)
    lines.push({
      text: value,
      fill: alarm ? FAULT : tone,
      size: emphasize ? 15 : 14,
      weight: 500,
      mono: true,
    })
  if (sub) lines.push({ text: sub, fill: MUT, size: 9.5, weight: 400, mono: true })

  const gap = 16
  const firstY = box.y + box.h / 2 - ((lines.length - 1) * gap) / 2

  return (
    <g>
      <rect
        x={box.x}
        y={box.y}
        width={box.w}
        height={box.h}
        fill="#12161D"
        stroke={border}
        strokeWidth={emphasize ? 2 : 1.2}
      />
      <rect x={box.x} y={box.y} width={box.w} height={3} fill={border} />
      {lines.map((ln, i) => (
        <text
          key={i}
          x={cx}
          y={firstY + i * gap}
          textAnchor="middle"
          dominantBaseline="central"
          fill={ln.fill}
          fontSize={ln.size}
          fontWeight={ln.weight}
          fontFamily={
            ln.mono ? "'JetBrains Mono', monospace" : "'Space Grotesk', sans-serif"
          }
        >
          {ln.text}
        </text>
      ))}
    </g>
  )
}

export function FlowDiagram() {
  const { state } = useSim()
  const s = state
  const solarOut = s.solar.outputKW
  const slMods = s.batteries.filter((b) => b.kind === 'second-life')
  const newMod = s.batteries.find((b) => b.kind === 'new')
  const slNet = slMods.reduce((a, b) => a + b.powerKW, 0)
  const newNet = newMod ? newMod.powerKW : 0
  const gridNet = s.grid.importKW - s.grid.exportKW // + import / - export
  const evDelivered = s.evs.reduce((a, e) => a + e.chargePowerKW, 0)

  const connected = s.evs.filter((e) => e.connected)
  const maxPower = Math.max(
    50,
    solarOut,
    Math.abs(slNet),
    Math.abs(newNet),
    Math.abs(gridNet),
    evDelivered,
    ...connected.map((e) => e.chargePowerKW),
  )

  const slAlarm = slMods.some((b) => b.faulted || b.state === 'ISOLATED')
  const slFaultAll = slMods.every((b) => b.faulted)

  // EV node vertical layout
  const evBoxes = connected.map((e, i) => {
    const h = 44
    const step = Math.min(66, (VB_H - 60) / Math.max(connected.length, 1))
    const y = 46 + i * step
    return { ev: e, box: { x: 850, y, w: 140, h } as Box }
  })

  const cy = N.ctrl.y + N.ctrl.h / 2 // controller mid y

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      className="h-full w-full"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* ---- links (drawn under nodes) ---- */}
      {/* Solar → MPPT */}
      <Link
        pts={[
          [N.solar.x + N.solar.w, N.solar.y + N.solar.h / 2],
          [N.mppt.x, N.solar.y + N.solar.h / 2],
        ]}
        color={AMBER}
        power={solarOut}
        maxPower={maxPower}
        faulted={s.solar.faulted}
      />
      {/* MPPT → Controller */}
      <Link
        pts={[
          [N.mppt.x + N.mppt.w, N.mppt.y + N.mppt.h / 2],
          [395, N.mppt.y + N.mppt.h / 2],
          [395, 250],
          [N.ctrl.x, 250],
        ]}
        color={AMBER}
        power={solarOut}
        maxPower={maxPower}
        faulted={s.solar.faulted}
      />
      {/* SL Bank → Controller (reverse if net charging) */}
      <Link
        pts={[
          [N.sl.x + N.sl.w, N.sl.y + N.sl.h / 2],
          [380, N.sl.y + N.sl.h / 2],
          [380, 285],
          [N.ctrl.x, 285],
        ]}
        color={BLUE}
        power={Math.abs(slNet)}
        maxPower={maxPower}
        reverse={slNet < 0}
        faulted={slFaultAll}
      />
      {/* New Battery → Controller */}
      <Link
        pts={[
          [N.newb.x + N.newb.w, N.newb.y + N.newb.h / 2],
          [366, N.newb.y + N.newb.h / 2],
          [366, 315],
          [N.ctrl.x, 315],
        ]}
        color={BLUE}
        power={Math.abs(newNet)}
        maxPower={maxPower}
        reverse={newNet < 0}
        faulted={!!newMod?.faulted}
      />
      {/* Grid → Controller (reverse if exporting) */}
      <Link
        pts={[
          [N.grid.x + N.grid.w, N.grid.y + N.grid.h / 2],
          [352, N.grid.y + N.grid.h / 2],
          [352, 345],
          [N.ctrl.x, 345],
        ]}
        color={TEAL}
        power={Math.abs(gridNet)}
        maxPower={maxPower}
        reverse={gridNet < 0}
        faulted={s.grid.faulted}
      />
      {/* Controller → EV Station */}
      <Link
        pts={[
          [N.ctrl.x + N.ctrl.w, cy],
          [N.evst.x, cy],
        ]}
        color={TXT}
        power={evDelivered}
        maxPower={maxPower}
      />
      {/* Station → each EV */}
      {evBoxes.map(({ ev, box }) => (
        <Link
          key={ev.id}
          pts={[
            [N.evst.x + N.evst.w, cy],
            [835, cy],
            [835, box.y + box.h / 2],
            [box.x, box.y + box.h / 2],
          ]}
          color={ev.chargePowerKW > 0.5 ? '#8FE3B0' : TXT}
          power={ev.chargePowerKW}
          maxPower={maxPower}
        />
      ))}

      {/* ---- nodes ---- */}
      <Node
        box={N.solar}
        title="Solar PV"
        value={`${kw(solarOut)} kW`}
        sub={`${(s.solar.irradiance * 100).toFixed(0)}% irr · ${s.solar.capacityKW}kWp`}
        tone={AMBER}
        alarm={s.solar.faulted}
      />
      <Node box={N.mppt} title="MPPT" sub="tracking" tone={AMBER} />
      <Node
        box={N.sl}
        title="SL Battery Bank"
        value={`${slNet >= 0 ? '' : '+'}${kw(Math.abs(slNet))} kW`}
        sub={`${slMods.filter((b) => !b.faulted && b.state !== 'ISOLATED').length}/${slMods.length} online`}
        tone={BLUE}
        alarm={slAlarm}
      />
      <Node
        box={N.newb}
        title="New Battery"
        value={`${newNet >= 0 ? '' : '+'}${kw(Math.abs(newNet))} kW`}
        sub={newMod ? `${newMod.soc.toFixed(0)}% SOC` : ''}
        tone={BLUE}
        alarm={!!newMod?.faulted}
      />
      <Node
        box={N.grid}
        title="Grid"
        value={`${gridNet >= 0 ? '' : '−'}${kw(Math.abs(gridNet))} kW`}
        sub={s.grid.faulted ? 'FAULT' : gridNet < 0 ? 'exporting' : s.grid.tariff}
        tone={TEAL}
        alarm={s.grid.faulted}
      />
      <Node
        box={N.ctrl}
        title="ENERFLUX"
        value="CONTROLLER"
        sub={`η ${s.metrics.efficiencyPct.toFixed(1)}% · ${s.selection.selected.length} src`}
        tone={TXT}
        emphasize
      />
      <Node
        box={N.evst}
        title="EV Station"
        value={`${kw(evDelivered)} kW`}
        sub={`${connected.length} connected`}
        tone={TXT}
      />
      {evBoxes.map(({ ev, box }) => (
        <Node
          key={ev.id}
          box={box}
          title={ev.name}
          value={`${ev.soc.toFixed(0)}%`}
          sub={`${kw(ev.chargePowerKW)}kW · ${ev.model}`}
          tone={ev.chargePowerKW > 0.5 ? '#8FE3B0' : MUT}
        />
      ))}
    </svg>
  )
}
