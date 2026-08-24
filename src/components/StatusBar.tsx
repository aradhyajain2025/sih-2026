import { Activity, Zap } from 'lucide-react'
import { useSim } from '../state/SimContext'
import { kw, pct } from '../lib/format'

function Stat({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: string
  unit: string
  color?: string
}) {
  return (
    <div className="flex min-w-[92px] flex-col border-l border-hairline px-3">
      <span className="text-[9px] uppercase tracking-[0.14em] text-muted">
        {label}
      </span>
      <span className="tabnum text-base font-medium leading-tight" style={{ color }}>
        {value}
        <span className="ml-1 text-[9px] text-muted">{unit}</span>
      </span>
    </div>
  )
}

export function StatusBar() {
  const { state } = useSim()
  const m = state.metrics
  const battLabel = (m.batteryKW >= 0 ? '+' : '') + kw(m.batteryKW)

  return (
    <header className="flex flex-wrap items-center gap-y-2 border-b border-hairline bg-panel">
      <div className="flex items-center gap-3 px-4 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center border border-hairline">
          <Zap className="h-4 w-4 text-solar" />
        </div>
        <div>
          <div className="text-sm font-bold tracking-[0.2em] text-primary">
            ENERFLUX
          </div>
          <div className="text-[9px] uppercase tracking-[0.16em] text-muted">
            Adaptive Multi-Source EMS
          </div>
        </div>
        <div className="ml-2 flex items-center gap-1.5 border border-hairline px-2 py-1">
          <Activity className="h-3 w-3 text-grid animate-pulse" />
          <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-grid">
            System Online
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap items-center justify-end gap-y-2 py-1.5">
        <Stat label="Solar" value={kw(m.solarKW)} unit="kW" color="#E8A33D" />
        <Stat label="EV Demand" value={kw(m.evDemandKW)} unit="kW" color = "#FF0000"/>
        <Stat label="Battery" value={battLabel} unit="kW" color="#6C8CFF" />
        <Stat label="Grid" value={kw(m.gridKW)} unit="kW" color="#35C4C1" />
        <Stat label="Export" value={kw(m.gridExportKW)} unit="kW" color="#35C4C1" />
        <Stat label="Total Load" value={kw(m.totalLoadKW)} unit="kW" color="#FFFFFF" />
        <Stat label="Efficiency" value={pct(m.efficiencyPct)} unit="%" color = "#35C4C1"/>
        <Stat
          label="Renewable"
          value={pct(m.renewablePct)}
          unit="%"
          color="#E8A33D"
        />
      </div>
    </header>
  )
}
