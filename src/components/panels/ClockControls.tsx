import { Pause, Play, RotateCcw, StepForward } from 'lucide-react'
import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import { simClock } from '../../lib/format'

const SPEEDS = [1, 2, 5, 10]

export function ClockControls() {
  const { state, dispatch } = useSim()

  return (
    <Panel title="Simulation Clock">
      <div className="flex items-center justify-between">
        <div>
          <div className="tabnum text-2xl font-medium tracking-wide text-primary">
            {simClock(state.simTimeS)}
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
            {state.running ? 'running' : 'paused'} · scenario clock
          </div>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => dispatch({ type: 'TOGGLE_RUN' })}
            className={`flex h-9 w-9 items-center justify-center border transition-colors ${
              state.running
                ? 'border-solar text-solar'
                : 'border-grid text-grid'
            }`}
            title={state.running ? 'Pause' : 'Start'}
          >
            {state.running ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </button>
          <button
            onClick={() => dispatch({ type: 'STEP' })}
            className="flex h-9 w-9 items-center justify-center border border-hairline text-muted transition-colors hover:text-primary"
            title="Step"
          >
            <StepForward className="h-4 w-4" />
          </button>
          <button
            onClick={() => dispatch({ type: 'RESET' })}
            className="flex h-9 w-9 items-center justify-center border border-hairline text-muted transition-colors hover:text-primary"
            title="Reset"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1">
        <span className="mr-1 text-[10px] uppercase tracking-[0.14em] text-muted">
          Speed
        </span>
        {SPEEDS.map((sp) => (
          <button
            key={sp}
            onClick={() => dispatch({ type: 'SET_SPEED', value: sp })}
            className={`tabnum flex-1 border px-2 py-1 text-xs transition-colors ${
              state.speed === sp
                ? 'border-primary text-primary'
                : 'border-hairline text-muted hover:text-primary'
            }`}
          >
            {sp}×
          </button>
        ))}
      </div>
    </Panel>
  )
}
