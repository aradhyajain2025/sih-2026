import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import type { LogLevel } from '../../engine/types'

const LEVEL_COLOR: Record<LogLevel, string> = {
  info: '#8A93A3',
  decision: '#35C4C1',
  fault: '#E24C4C',
  reconfig: '#E8A33D',
  tariff: '#35C4C1',
  ev: '#E7EAEE',
  scenario: '#6C8CFF',
}

export function DecisionLog() {
  const { state } = useSim()
  const entries = [...state.log].reverse()

  return (
    <Panel title="Decision Log">
      <div className="max-h-[240px] space-y-0.5 overflow-y-auto pr-1">
        {entries.map((e) => (
          <div
            key={e.id}
            className="flex items-start gap-2 border-b border-hairline/50 py-1 text-[11px] leading-snug"
          >
            <span className="tabnum shrink-0 text-muted">{e.clock}</span>
            <span
              className="mt-1 h-1.5 w-1.5 shrink-0"
              style={{ background: LEVEL_COLOR[e.level] }}
            />
            <span style={{ color: LEVEL_COLOR[e.level] }} className="break-words">
              {e.msg}
            </span>
          </div>
        ))}
        {entries.length === 0 && (
          <div className="py-3 text-xs text-muted">No events yet.</div>
        )}
      </div>
    </Panel>
  )
}
