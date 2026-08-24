import { Car, Plus, X } from 'lucide-react'
import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import { kw, mmss } from '../../lib/format'
import type { EV } from '../../engine/types'

function EVRow({ ev }: { ev: EV }) {
  const { dispatch } = useSim()
  const patch = (p: Partial<EV>) =>
    dispatch({ type: 'UPDATE_EV', id: ev.id, patch: p })
  const charging = ev.chargePowerKW > 0.5

  return (
    <div className="border border-hairline">
      <div className="flex items-center gap-2 border-b border-hairline px-2 py-1.5">
        <span
          className={`tabnum flex h-5 w-5 items-center justify-center text-[11px] font-bold ${
            ev.rank === 1 ? 'bg-grid text-base' : 'bg-hairline text-primary'
          }`}
        >
          {ev.rank}
        </span>
        <div className="flex-1">
          <div className="text-xs font-semibold text-primary">
            {ev.name}
            <span className="ml-1 text-[10px] font-normal text-muted">
              {ev.model}
            </span>
          </div>
        </div>
        <span
          className={`tabnum text-xs ${charging ? 'text-[#8FE3B0]' : 'text-muted'}`}
        >
          {kw(ev.chargePowerKW)} kW
        </span>
        <button
          onClick={() => dispatch({ type: 'REMOVE_EV', id: ev.id })}
          className="text-muted hover:text-fault"
          title="Disconnect"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* SOC bar */}
      <div className="px-2 py-1.5">
        <div className="relative h-2.5 w-full bg-base">
          <div
            className="absolute inset-y-0 left-0 bg-battery/70"
            style={{ width: `${ev.soc}%` }}
          />
          <div
            className="absolute inset-y-0 w-[2px] bg-primary"
            style={{ left: `${ev.targetSoc}%` }}
            title="target"
          />
        </div>
        <div className="mt-1 flex justify-between text-[10px] text-muted">
          <span className="tabnum">
            SOC <span className="text-primary">{ev.soc.toFixed(0)}%</span>
          </span>
          <span className="tabnum">
            P <span className="text-primary">{ev.priorityScore.toFixed(2)}</span>
          </span>
          <span className="tabnum">
            wait <span className="text-primary">{mmss(ev.waitTimeS)}</span>
          </span>
          <span className="tabnum">
            dep <span className="text-primary">{mmss(ev.timeToDepartureS)}</span>
          </span>
        </div>

        {/* live editors */}
        <div className="mt-1.5 space-y-1">
          <EditRow
            label="SOC"
            value={ev.soc}
            min={0}
            max={100}
            onChange={(v) => patch({ soc: v })}
          />
          <EditRow
            label="Target"
            value={ev.targetSoc}
            min={10}
            max={100}
            onChange={(v) => patch({ targetSoc: v })}
          />
          <EditRow
            label="Weight"
            value={ev.priorityWeight}
            min={0.5}
            max={2}
            step={0.1}
            fixed={1}
            onChange={(v) => patch({ priorityWeight: v })}
          />
        </div>
      </div>
    </div>
  )
}

function EditRow({
  label,
  value,
  min,
  max,
  step = 1,
  fixed = 0,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  fixed?: number
  onChange: (v: number) => void
}) {
  return (
    <label className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-[10px] uppercase tracking-wide text-muted">
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(+e.target.value)}
        className="flex-1"
      />
      <span className="tabnum w-9 shrink-0 text-right text-[10px] text-primary">
        {value.toFixed(fixed)}
      </span>
    </label>
  )
}

export function EVPanel() {
  const { state, dispatch } = useSim()
  const ranked = [...state.evs].sort((a, b) => a.rank - b.rank)

  return (
    <Panel
      title="EV Charging · Priority (Novelty 1)"
      right={
        <button
          onClick={() => dispatch({ type: 'ADD_EV' })}
          className="flex items-center gap-1 border border-hairline px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted hover:text-primary"
        >
          <Plus className="h-3 w-3" /> EV
        </button>
      }
    >
      <div className="space-y-2">
        {ranked.length === 0 && (
          <div className="flex items-center gap-2 py-4 text-xs text-muted">
            <Car className="h-4 w-4" /> No EVs connected.
          </div>
        )}
        {ranked.map((ev) => (
          <EVRow key={ev.id} ev={ev} />
        ))}
      </div>
    </Panel>
  )
}
