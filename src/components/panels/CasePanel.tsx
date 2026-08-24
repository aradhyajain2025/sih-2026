import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import type { CaseId } from '../../engine/types'

const CASES: { id: CaseId; label: string; sub: string }[] = [
  { id: 'worst', label: 'Worst Case', sub: '3 × Kia EV9 · 99.8 kWh' },
  { id: 'normal', label: 'Normal Case', sub: 'Kia EV9 · Tata Punch · MG Comet' },
  { id: 'best', label: 'Best Case', sub: '3 × MG Comet EV · 17 kWh' },
]

export function CasePanel() {
  const { state, dispatch } = useSim()

  return (
    <Panel title="Load Case">
      <div className="grid grid-cols-1 gap-1.5">
        {CASES.map((c) => {
          const active = state.activeCase === c.id
          return (
            <button
              key={c.id}
              onClick={() => dispatch({ type: 'SET_CASE', value: c.id })}
              className={`border px-3 py-2.5 text-left transition-colors ${
                active
                  ? 'border-grid bg-grid/5'
                  : 'border-hairline hover:border-muted'
              }`}
            >
              <span
                className={`block text-sm font-semibold ${
                  active ? 'text-grid' : 'text-primary'
                }`}
              >
                {c.label}
              </span>
              <span className="block text-[10px] text-muted">{c.sub}</span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
