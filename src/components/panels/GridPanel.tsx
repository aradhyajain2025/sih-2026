import { PlugZap } from 'lucide-react'
import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import { kw, rupee } from '../../lib/format'
import { TARIFF_RATES } from '../../engine/constants'
import type { TariffLevel } from '../../engine/types'

const TARIFFS: TariffLevel[] = ['low', 'normal', 'peak']

export function GridPanel() {
  const { state, dispatch } = useSim()
  const grid = state.grid
  const off = grid.faulted || !grid.online

  return (
    <Panel
      title="Grid Interconnection"
      right={<PlugZap className="h-3.5 w-3.5 text-grid" />}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="tabnum text-xl font-medium text-grid">
            {off ? '—' : kw(grid.importKW)}
            <span className="ml-1 text-xs text-muted">kW in</span>
          </div>
          <div className="text-[10px] text-muted">
            export{' '}
            <span className="tabnum text-grid">{kw(grid.exportKW)}</span> kW ·
            cost{' '}
            <span className="tabnum text-primary">
              {rupee(state.totals.gridCost)}
            </span>
          </div>
        </div>
        <button
          onClick={() =>
            dispatch({ type: 'SET_GRID_ONLINE', value: !grid.online })
          }
          className={`border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide transition-colors ${
            grid.online
              ? 'border-grid text-grid'
              : 'border-hairline text-muted'
          }`}
        >
          {grid.online ? 'ON' : 'OFF'}
        </button>
      </div>

      <label className="mt-3 block">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-muted">
          <span>Max import</span>
          <span className="tabnum text-primary">{grid.maxImportKW} kW</span>
        </div>
        <input
          type="range"
          min={0}
          max={400}
          step={10}
          value={grid.maxImportKW}
          onChange={(e) =>
            dispatch({ type: 'SET_GRID_MAX', value: +e.target.value })
          }
          className="mt-1 w-full"
        />
      </label>

      <div className="mt-3">
        <div className="mb-1 text-[10px] uppercase tracking-[0.14em] text-muted">
          Tariff
        </div>
        <div className="grid grid-cols-3 gap-1">
          {TARIFFS.map((t) => (
            <button
              key={t}
              onClick={() => dispatch({ type: 'SET_TARIFF', value: t })}
              className={`flex flex-col items-center border px-1 py-1 transition-colors ${
                grid.tariff === t
                  ? 'border-grid text-grid'
                  : 'border-hairline text-muted hover:text-primary'
              }`}
            >
              <span className="text-[11px] font-semibold uppercase">{t}</span>
              <span className="tabnum text-[10px]">₹{TARIFF_RATES[t]}</span>
            </button>
          ))}
        </div>
      </div>
      {grid.faulted && (
        <div className="mt-2 border border-fault px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-fault">
          Grid fault — connection isolated
        </div>
      )}
    </Panel>
  )
}
