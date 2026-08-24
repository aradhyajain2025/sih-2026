import { AlertTriangle, ShieldCheck } from 'lucide-react'
import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import type { FaultTarget } from '../../engine/types'

const FAULTS: { target: FaultTarget; label: string }[] = [
  { target: 'SOLAR', label: 'Fail Solar' },
  { target: 'GRID', label: 'Fail Grid' },
  { target: 'SL_BATTERY', label: 'Fail SL Battery' },
]

export function FaultPanel() {
  const { state, dispatch } = useSim()
  const anyFault =
    state.solar.faulted ||
    state.grid.faulted ||
    state.batteries.some((b) => b.faulted)

  return (
    <Panel
      title="Fault Injection"
      right={
        <span className="tabnum text-[10px] text-muted">
          F:{state.faultCount} · R:{state.reconfigCount}
        </span>
      }
    >
      <div className="grid grid-cols-1 gap-1.5">
        {FAULTS.map((f) => (
          <button
            key={f.target}
            onClick={() => dispatch({ type: 'FAULT', target: f.target })}
            className="flex items-center gap-2 border border-fault/50 px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-wide text-fault transition-colors hover:bg-fault/10"
          >
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {f.label}
          </button>
        ))}
        <button
          onClick={() => dispatch({ type: 'CLEAR_FAULTS' })}
          disabled={!anyFault}
          className={`flex items-center gap-2 border px-2.5 py-2 text-left text-xs font-semibold uppercase tracking-wide transition-colors ${
            anyFault
              ? 'border-grid text-grid hover:bg-grid/10'
              : 'border-hairline text-muted'
          }`}
        >
          <ShieldCheck className="h-4 w-4 shrink-0" />
          Clear All Faults
        </button>
      </div>
    </Panel>
  )
}
