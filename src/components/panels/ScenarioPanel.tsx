import { PlayCircle } from 'lucide-react'
import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import { SCENARIOS } from '../../engine/scenarios'

export function ScenarioPanel() {
  const { state, dispatch } = useSim()

  return (
    <Panel title="Demo Scenarios">
      <div className="grid grid-cols-1 gap-1.5">
        {SCENARIOS.map((sc) => {
          const active = state.activeScenario === sc.id
          return (
            <button
              key={sc.id}
              onClick={() => dispatch({ type: 'LOAD_SCENARIO', id: sc.id })}
              className={`group flex items-start gap-2 border px-2.5 py-2 text-left transition-colors ${
                active
                  ? 'border-grid bg-grid/5'
                  : 'border-hairline hover:border-muted'
              }`}
            >
              <PlayCircle
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  active ? 'text-grid' : 'text-muted group-hover:text-primary'
                }`}
              />
              <span
                className={`text-xs font-semibold ${
                  active ? 'text-grid' : 'text-primary'
                }`}
              >
                {sc.name}
              </span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
