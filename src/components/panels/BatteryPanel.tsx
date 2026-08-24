import { BatteryCharging } from 'lucide-react'
import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import { kw } from '../../lib/format'
import type { BatteryModule, BatteryState } from '../../engine/types'

const STATE_COLOR: Record<BatteryState, string> = {
  ACTIVE: '#6C8CFF',
  AVAILABLE: '#6C8CFF',
  LIMITED: '#E8A33D',
  WARNING: '#E24C4C',
  ISOLATED: '#E24C4C',
}

function Cell({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.1em] text-muted">
        {label}
      </div>
      <div className="tabnum text-xs" style={{ color: color ?? 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  )
}

function BatteryCard({ b }: { b: BatteryModule }) {
  const color = STATE_COLOR[b.state]
  const isCharging = b.powerKW < -0.5
  const isDischarging = b.powerKW > 0.5

  return (
    <div
      className="border transition-colors duration-500"
      style={{ borderColor: color, background: `${color}0D` }}
    >
      <div className="flex items-center justify-between px-2 py-1.5">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-primary">
            {b.label}
          </span>
          <span className="border border-hairline px-1 text-[8px] uppercase tracking-wide text-muted">
            {b.kind === 'second-life' ? 'SL' : 'NEW'}
          </span>
        </div>
        <span
          className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider transition-colors duration-500"
          style={{ color, border: `1px solid ${color}` }}
        >
          {b.state}
        </span>
      </div>

      {/* SOC bar */}
      <div className="px-2">
        <div className="relative h-2 w-full bg-base">
          <div
            className="absolute inset-y-0 left-0 transition-[width] duration-300"
            style={{ width: `${b.soc}%`, background: color, opacity: 0.7 }}
          />
          <div
            className="absolute inset-y-0 w-px bg-muted"
            style={{ left: `${b.socFloor}%` }}
            title="safety floor"
          />
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1 px-2 py-1.5">
        <Cell label="SOC" value={`${b.soc.toFixed(0)}%`} />
        <Cell label="SOH" value={`${(b.soh * 100).toFixed(0)}%`} />
        <Cell
          label="Temp"
          value={`${b.tempC.toFixed(0)}°C`}
          color={b.tempC > 45 ? '#E24C4C' : undefined}
        />
        <Cell label="Health" value={b.healthScore.toFixed(0)} color={color} />
      </div>
      <div className="flex items-center justify-between border-t border-hairline px-2 py-1 text-[9px] text-muted">
        <span className="tabnum">R {b.rInt.toFixed(3)}Ω</span>
        <span className="tabnum">₹{b.degCostPerKWh.toFixed(1)}/kWh</span>
        <span
          className="tabnum"
          style={{ color: isDischarging ? color : isCharging ? '#8FE3B0' : undefined }}
        >
          {b.powerKW >= 0 ? '' : '+'}
          {kw(Math.abs(b.powerKW))} kW
          {isCharging ? ' chg' : isDischarging ? ' dis' : ''}
        </span>
      </div>
    </div>
  )
}

export function BatteryPanel() {
  const { state } = useSim()

  return (
    <Panel
      title="Battery Storage (Novelty 3)"
      right={<BatteryCharging className="h-3.5 w-3.5 text-battery" />}
    >
      <div className="space-y-1.5">
        {state.batteries.map((b) => (
          <BatteryCard key={b.id} b={b} />
        ))}
      </div>
    </Panel>
  )
}
