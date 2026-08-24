// Novelty 2 — least-cost source arbitration with a plain-English reason string.
import type {
  BatteryKind,
  SelectionResult,
  SourceContribution,
  SourceKind,
  TariffLevel,
} from './types'

const f0 = (n: number) => Math.round(n).toString()
const f1 = (n: number) => n.toFixed(1)

export interface BatteryOption {
  id: string
  label: string
  kind: BatteryKind
  dischargeableKW: number
  degCost: number
  soc: number
  soh: number
}

export interface GridOption {
  available: boolean
  availKW: number
  level: TariffLevel
  rate: number
}

export interface SelectionOutput {
  solarToEV: number
  batteryAlloc: Record<string, number> // module id -> kW to EV
  gridToEV: number
  result: SelectionResult
}

export function selectSources(
  demandKW: number,
  solarAvailKW: number,
  batteries: BatteryOption[],
  grid: GridOption,
): SelectionOutput {
  const batteryAlloc: Record<string, number> = {}
  const contributions: SourceContribution[] = []
  const selected: SourceKind[] = []

  const demand = Math.max(0, demandKW)

  // Solar always first when it can cover any demand.
  const solarToEV = Math.min(Math.max(0, solarAvailKW), demand)
  let rem = demand - solarToEV
  if (solarToEV > 0.01) {
    selected.push('solar')
    contributions.push({ source: 'solar', label: 'Solar PV', powerKW: solarToEV })
  }

  // Cost-ranked marginal options: every usable battery module + grid.
  type Opt = {
    kind: 'batt' | 'grid'
    id?: string
    label: string
    cap: number
    cost: number
    soc?: number
    battKind?: BatteryKind
  }
  const opts: Opt[] = []
  for (const b of batteries) {
    if (b.dischargeableKW > 0.01)
      opts.push({
        kind: 'batt',
        id: b.id,
        label: b.label,
        cap: b.dischargeableKW,
        cost: b.degCost,
        soc: b.soc,
        battKind: b.kind,
      })
  }
  if (grid.available && grid.availKW > 0.01)
    opts.push({ kind: 'grid', label: 'Grid', cap: grid.availKW, cost: grid.rate })
  opts.sort((a, b) => a.cost - b.cost)

  let gridToEV = 0
  const usedBatt: {
    label: string
    soc: number
    kW: number
    cost: number
    kind: BatteryKind
  }[] = []
  let usedGrid = false

  for (const o of opts) {
    if (rem <= 0.01) break
    const take = Math.min(o.cap, rem)
    if (take <= 0.01) continue
    rem -= take
    if (o.kind === 'batt') {
      batteryAlloc[o.id!] = take
      usedBatt.push({
        label: o.label,
        soc: o.soc!,
        kW: take,
        cost: o.cost,
        kind: o.battKind!,
      })
    } else {
      gridToEV += take
      usedGrid = true
    }
  }

  const slKW = usedBatt
    .filter((u) => u.kind === 'second-life')
    .reduce((s, u) => s + u.kW, 0)
  const newKW = usedBatt
    .filter((u) => u.kind === 'new')
    .reduce((s, u) => s + u.kW, 0)

  if (slKW > 0.01) {
    selected.push('second-life')
    contributions.push({
      source: 'second-life',
      label: 'SL Battery Bank',
      powerKW: slKW,
    })
  }
  if (newKW > 0.01) {
    selected.push('new-battery')
    contributions.push({
      source: 'new-battery',
      label: 'New Battery',
      powerKW: newKW,
    })
  }
  if (gridToEV > 0.01) {
    selected.push('grid')
    contributions.push({ source: 'grid', label: 'Grid', powerKW: gridToEV })
  }

  const supplied = solarToEV + slKW + newKW + gridToEV
  const unmet = Math.max(0, demand - supplied)

  // ---- reason string ----
  let reason: string
  if (demand < 0.01) {
    reason = 'No active EV charging demand — sources idle or diverted to storage.'
  } else if (solarToEV >= demand - 0.01) {
    reason = `Solar ${f0(solarToEV)} kW covers full EV demand ${f0(
      demand,
    )} kW. Battery reserves held; grid idle.`
  } else {
    const parts: string[] = []
    parts.push(
      `Solar ${f0(solarToEV)} kW short of ${f0(demand)} kW demand by ${f0(
        demand - solarToEV,
      )} kW.`,
    )
    if (usedBatt.length) {
      const named = usedBatt
        .slice(0, 2)
        .map((u) => `${u.label} (${f0(u.soc)}% SOC, ₹${f1(u.cost)}/kWh)`)
        .join(' + ')
      parts.push(`${named} dispatched`)
      if (usedGrid) parts.push(`then grid (${grid.level} ₹${f1(grid.rate)}/kWh).`)
      else if (grid.available)
        parts.push(`— below grid tariff ₹${f1(grid.rate)}/kWh.`)
      else parts.push('— grid offline.')
    } else if (usedGrid) {
      parts.push(
        `No battery within safety limits — grid import at ${grid.level} tariff ₹${f1(
          grid.rate,
        )}/kWh.`,
      )
    } else {
      parts.push('No dispatchable source available.')
    }
    const supl: string[] = []
    if (slKW > 0.01) supl.push(`${f0(slKW)} kW second-life`)
    if (newKW > 0.01) supl.push(`${f0(newKW)} kW new pack`)
    if (gridToEV > 0.01) supl.push(`${f0(gridToEV)} kW grid`)
    if (supl.length) parts.push(`Supplied: ${supl.join(', ')}.`)
    if (unmet > 0.5) parts.push(`⚠ ${f0(unmet)} kW UNMET — supply exhausted.`)
    reason = parts.join(' ')
  }

  const key = selected.join('>') + (unmet > 0.5 ? '|UNMET' : '')

  const result: SelectionResult = {
    selected,
    contributions,
    reason,
    demandKW: demand,
    suppliedKW: supplied,
    unmetKW: unmet,
    key,
  }

  return { solarToEV, batteryAlloc, gridToEV, result }
}
