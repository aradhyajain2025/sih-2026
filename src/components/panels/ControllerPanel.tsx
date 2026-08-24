import { Cpu } from 'lucide-react'
import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import { kw, sourceColor } from '../../lib/format'
import type { SourceKind } from '../../engine/types'

const SOURCE_LABEL: Record<SourceKind, string> = {
  solar: 'SOLAR',
  'second-life': 'SL BATTERY',
  'new-battery': 'NEW PACK',
  grid: 'GRID',
}

export function ControllerPanel() {
  const { state } = useSim()
  const sel = state.selection
  const balanceOk = Math.abs(state.balanceResidual) < 0.5

  return (
    <Panel
      title="Controller · Source Selection"
      right={
        <span className="flex items-center gap-1 text-[10px] uppercase tracking-[0.14em] text-grid">
          <Cpu className="h-3 w-3" /> Novelty 2
        </span>
      }
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
          Selected source
        </div>
        <div className="text-[10px] uppercase tracking-[0.14em] text-muted">
          Demand{' '}
          <span className="tabnum text-primary">{kw(sel.demandKW)}</span> kW ·
          Supplied{' '}
          <span className="tabnum text-primary">{kw(sel.suppliedKW)}</span> kW
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {sel.selected.length === 0 && (
          <span className="tabnum text-lg text-muted">— IDLE —</span>
        )}
        {sel.contributions.map((c) => (
          <span
            key={c.source}
            className="flex items-center gap-2 border px-2.5 py-1.5"
            style={{ borderColor: sourceColor(c.source) }}
          >
            <span
              className="h-2 w-2"
              style={{ background: sourceColor(c.source) }}
            />
            <span
              className="text-xs font-semibold tracking-wide"
              style={{ color: sourceColor(c.source) }}
            >
              {SOURCE_LABEL[c.source]}
            </span>
            <span className="tabnum text-sm text-primary">
              {kw(c.powerKW)} kW
            </span>
          </span>
        ))}
        {sel.unmetKW > 0.5 && (
          <span className="flex items-center gap-2 border border-fault px-2.5 py-1.5">
            <span className="text-xs font-semibold tracking-wide text-fault">
              UNMET
            </span>
            <span className="tabnum text-sm text-fault">
              {kw(sel.unmetKW)} kW
            </span>
          </span>
        )}
      </div>

      <div className="mt-3 border-l-2 border-grid bg-base/40 px-3 py-2">
        <div className="text-[9px] uppercase tracking-[0.16em] text-muted">
          Decision rationale
        </div>
        <p className="mt-0.5 text-[13px] leading-snug text-primary">
          {sel.reason}
        </p>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10px] text-muted">
        <span>
          Power balance:{' '}
          <span className={balanceOk ? 'text-grid' : 'text-fault'}>
            {balanceOk ? 'CLOSED' : 'RESIDUAL ' + kw(state.balanceResidual) + 'kW'}
          </span>
        </span>
        <span>
          Losses <span className="tabnum text-primary">{kw(state.losses)}</span> kW
        </span>
      </div>
    </Panel>
  )
}
