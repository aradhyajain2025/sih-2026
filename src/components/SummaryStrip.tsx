import { useSim } from '../state/SimContext'
import { kwh, pct, rupee } from '../lib/format'

function Item({
  label,
  value,
  unit,
  color,
}: {
  label: string
  value: string
  unit?: string
  color?: string
}) {
  return (
    <div className="flex min-w-[104px] flex-1 flex-col border-l border-hairline px-3 py-2">
      <span className="text-[9px] uppercase tracking-[0.13em] text-muted">
        {label}
      </span>
      <span className="tabnum text-sm font-medium" style={{ color }}>
        {value}
        {unit && <span className="ml-1 text-[9px] text-muted">{unit}</span>}
      </span>
    </div>
  )
}

export function SummaryStrip() {
  const { state } = useSim()
  const t = state.totals

  return (
    <div className="flex flex-wrap border border-hairline bg-panel">
      <div className="flex items-center px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
        Session Totals
      </div>
      <Item label="Solar Energy" value={kwh(t.solarEnergyKWh)} unit="kWh" color="#E8A33D" />
      <Item label="EV Delivered" value={kwh(t.evEnergyKWh)} unit="kWh" />
      <Item label="Battery Energy" value={kwh(t.batteryEnergyKWh)} unit="kWh" color="#6C8CFF" />
      <Item label="Grid Import" value={kwh(t.gridImportKWh)} unit="kWh" color="#35C4C1" />
      <Item label="Grid Export" value={kwh(t.gridExportKWh)} unit="kWh" color="#35C4C1" />
      <Item label="Renewable" value={pct(state.metrics.renewablePct)} unit="%" color="#E8A33D" />
      <Item label="Degrade Cost" value={rupee(t.degradationCost)} color="#6C8CFF" />
      <Item label="Grid Cost" value={rupee(t.gridCost)} color="#35C4C1" />
      <Item label="Faults" value={String(state.faultCount)} color={state.faultCount ? '#E24C4C' : undefined} />
      <Item label="Reconfigs" value={String(state.reconfigCount)} color="#E8A33D" />
    </div>
  )
}
