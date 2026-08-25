import { Car } from 'lucide-react'
import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import { kw, mmss } from '../../lib/format'
import type { EV } from '../../engine/types'

function EVRow({ ev }: { ev: EV }) {
  const charging = ev.chargePowerKW > 0.5

  return (
    <div className={`ev-row border border-hairline ${charging ? 'ev-row-charging' : ''}`}>
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
      </div>

      {/* SOC bar — target fixed at 100% */}
      <div className="px-2 py-1.5">
        <div className="relative h-2.5 w-full bg-base">
          <div
            className="absolute inset-y-0 left-0 bg-battery/70"
            style={{ width: `${ev.soc}%` }}
          />
          <div
            className="absolute inset-y-0 right-0 w-[2px] bg-primary"
            title="target 100%"
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
      </div>
    </div>
  )
}

export function EVPanel() {
  const { state } = useSim()
  const ranked = [...state.evs].sort((a, b) => a.rank - b.rank)

  return (
    <Panel title="EV Charging · Priority">
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
