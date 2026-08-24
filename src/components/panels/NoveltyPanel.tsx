import { useSim } from '../../state/SimContext'
import { Panel } from '../ui/Panel'
import { kw } from '../../lib/format'
import { solarIrradiance } from '../../engine/model'

interface NoveltyCard {
  n: number
  title: string
  input: string
  decision: string
  output: string
  value: string
}

export function NoveltyPanel() {
  const { state } = useSim()
  const s = state

  const ranked = [...s.evs].filter((e) => e.connected).sort((a, b) => a.rank - b.rank)
  const top = ranked[0]
  const slMods = s.batteries.filter((b) => b.kind === 'second-life')
  const slAvail = slMods.filter((b) => !b.faulted && b.state !== 'ISOLATED').length
  const avgHealth =
    slMods.reduce((a, b) => a + b.healthScore, 0) / Math.max(slMods.length, 1)

  // Novelty 4 — simplified 15-min forecast
  const fcSolar =
    s.solar.faulted || s.solar.capacityKW <= 0
      ? 0
      : s.solar.capacityKW * solarIrradiance(s.solar.cloud, s.simTimeS + 900)
  const solarTrend = fcSolar - s.metrics.solarKW
  const fcAction =
    solarTrend > 10 ? 'HOLD reserves' : solarTrend < -10 ? 'PRE-CHARGE now' : 'STEADY'

  // Novelty 5 — degradation vs grid
  const usable = s.batteries.filter(
    (b) => !b.faulted && b.state !== 'ISOLATED' && b.soc > b.socFloor,
  )
  const cheapestBatt = usable.length
    ? Math.min(...usable.map((b) => b.degCostPerKWh))
    : Infinity
  const gridRate = s.grid.faulted ? Infinity : s.grid.costRate
  const optimal =
    cheapestBatt <= gridRate ? 'BATTERY' : gridRate < Infinity ? 'GRID' : 'SOLAR'
  const spread =
    isFinite(cheapestBatt) && isFinite(gridRate)
      ? Math.abs(gridRate - cheapestBatt)
      : 0

  const activeFaults =
    (s.solar.faulted ? 1 : 0) +
    (s.grid.faulted ? 1 : 0) +
    s.batteries.filter((b) => b.faulted).length

  const cards: NoveltyCard[] = [
    {
      n: 1,
      title: 'Priority EV Charging',
      input: `${ranked.length} EV connected`,
      decision: top ? `${top.name} rank #1` : 'idle',
      output: top ? `${kw(top.chargePowerKW)} kW allocated` : '0 kW',
      value: top ? `score ${top.priorityScore.toFixed(2)}` : '—',
    },
    {
      n: 2,
      title: 'Adaptive Source Selection',
      input: `demand ${kw(s.selection.demandKW)} kW`,
      decision: s.selection.selected.length
        ? s.selection.selected.join(' + ')
        : 'idle',
      output: `${kw(s.selection.suppliedKW)} kW supplied`,
      value: `η ${s.metrics.efficiencyPct.toFixed(1)}%`,
    },
    {
      n: 3,
      title: 'SL Battery Health',
      input: `${slMods.length} SL modules`,
      decision: `${slAvail} online · ${slMods.length - slAvail} derated`,
      output: `avg health ${avgHealth.toFixed(0)}`,
      value: `${s.batteries.filter((b) => b.state === 'WARNING' || b.state === 'ISOLATED').length} flagged`,
    },
    {
      n: 4,
      title: 'Predictive Management',
      input: `+15min ${kw(fcSolar)} kW`,
      decision: fcAction,
      output: `trend ${solarTrend >= 0 ? '+' : ''}${kw(solarTrend)} kW`,
      value: `renew ${s.metrics.renewablePct.toFixed(0)}%`,
    },
    {
      n: 5,
      title: 'Degradation-Aware Cost',
      input: `batt ₹${isFinite(cheapestBatt) ? cheapestBatt.toFixed(1) : '—'} vs grid ₹${isFinite(gridRate) ? gridRate.toFixed(1) : '—'}`,
      decision: `optimal: ${optimal}`,
      output: `spread ₹${spread.toFixed(1)}/kWh`,
      value: `deg ₹${s.totals.degradationCost.toFixed(0)}`,
    },
    {
      n: 6,
      title: 'Fault-Tolerant Reconfig',
      input: `${activeFaults} active fault(s)`,
      decision: `${s.reconfigCount} reconfigurations`,
      output: s.selection.unmetKW > 0.5 ? `${kw(s.selection.unmetKW)} kW unmet` : 'load continuous',
      value: `${s.faultCount} faults total`,
    },
  ]

  return (
    <Panel title="Novelty Verification">
      <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => (
          <div key={c.n} className="border border-hairline p-2">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-semibold text-primary">
                N{c.n} · {c.title}
              </span>
            </div>
            <div className="mb-1.5 inline-flex items-center gap-1">
              <span className="h-1.5 w-1.5 animate-pulse bg-grid" />
              <span className="text-[8px] font-bold uppercase tracking-wider text-grid">
                Status: Active
              </span>
            </div>
            <dl className="space-y-0.5 text-[9.5px] leading-tight">
              <Row k="IN" v={c.input} />
              <Row k="DEC" v={c.decision} />
              <Row k="OUT" v={c.output} />
              <Row k="VAL" v={c.value} />
            </dl>
          </div>
        ))}
      </div>
    </Panel>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-1.5">
      <dt className="w-7 shrink-0 text-muted">{k}</dt>
      <dd className="tabnum text-primary">{v}</dd>
    </div>
  )
}
