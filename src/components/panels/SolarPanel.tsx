import { Sun } from 'lucide-react'
import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import { kw } from '../../lib/format'
import type { CloudCondition } from '../../engine/types'

const CLOUDS: { id: CloudCondition; label: string }[] = [
  { id: 'clear', label: 'Clear' },
  { id: 'partly', label: 'Partly' },
  { id: 'cloudy', label: 'Cloudy' },
  { id: 'fluctuation', label: 'Rapid flux' },
]

export function SolarPanel() {
  const { state, dispatch } = useSim()
  const solar = state.solar

  return (
    <Panel
      title="Solar PV Array"
      right={<Sun className="h-3.5 w-3.5 text-solar" />}
    >
      <div className="flex items-end justify-between">
        <div>
          <div className="tabnum text-2xl font-medium text-solar">
            {kw(solar.outputKW)}
            <span className="ml-1 text-xs text-muted">kW</span>
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
            {(solar.irradiance * 100).toFixed(0)}% irradiance
            {solar.faulted && <span className="ml-1 text-fault">· FAULT</span>}
          </div>
        </div>
      </div>

      <label className="mt-3 block">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-muted">
          <span>Capacity</span>
          <span className="tabnum text-primary">{solar.capacityKW} kWp</span>
        </div>
        <input
          type="range"
          min={0}
          max={500}
          step={10}
          value={solar.capacityKW}
          onChange={(e) =>
            dispatch({ type: 'SET_SOLAR_CAPACITY', value: +e.target.value })
          }
          className="mt-1 w-full"
        />
      </label>

      <div className="mt-3">
        <div className="mb-1 text-[10px] uppercase tracking-[0.14em] text-muted">
          Cloud condition
        </div>
        <div className="grid grid-cols-2 gap-1">
          {CLOUDS.map((c) => (
            <button
              key={c.id}
              onClick={() => dispatch({ type: 'SET_CLOUD', value: c.id })}
              className={`border px-2 py-1 text-xs transition-colors ${
                solar.cloud === c.id
                  ? 'border-solar text-solar'
                  : 'border-hairline text-muted hover:text-primary'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </Panel>
  )
}
