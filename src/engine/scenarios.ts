// Phase-1 demo scenarios. Each fully configures sources + load so it runs
// deterministically regardless of prior state.
import { TARIFF_RATES } from './constants'
import type { BatteryModule, EV, LogLevel, SimState } from './types'

export interface ScenarioMeta {
  id: string
  name: string
  blurb: string
}

export const SCENARIOS: ScenarioMeta[] = [
  { id: 'sunny-low', name: 'Sunny / Low demand', blurb: 'Solar surplus charges storage & exports.' },
  { id: 'sunny-high', name: 'Sunny / High demand', blurb: 'Demand exceeds solar → battery + grid.' },
  { id: 'cloudy-high', name: 'Cloudy / High demand', blurb: 'Weak solar, heavy battery + grid draw.' },
  { id: 'grid-failure', name: 'Grid Failure', blurb: 'Islanded on solar + second-life storage.' },
  { id: 'sl-degraded', name: 'Second-Life Degraded', blurb: 'Degraded SL modules isolate; load shifts.' },
]

function setEV(ev: EV | undefined, p: Partial<EV>) {
  if (!ev) return
  Object.assign(ev, p)
  ev.waitTimeS = 0
}

// Restore a second-life module to a healthy differentiated baseline.
const HEALTHY_SL: Record<string, Partial<BatteryModule>> = {
  'sl-1': { soc: 78, soh: 0.86, tempC: 32, rInt: 0.052 },
  'sl-2': { soc: 82, soh: 0.81, tempC: 29, rInt: 0.055 },
  'sl-3': { soc: 55, soh: 0.74, tempC: 38, rInt: 0.068 },
  'sl-4': { soc: 40, soh: 0.63, tempC: 47, rInt: 0.078 },
}

const DEGRADED_SL: Record<string, Partial<BatteryModule>> = {
  'sl-1': { soc: 60, soh: 0.71, tempC: 41, rInt: 0.066 },
  'sl-2': { soc: 45, soh: 0.58, tempC: 49, rInt: 0.079 },
  'sl-3': { soc: 35, soh: 0.5, tempC: 52, rInt: 0.086 },
  'sl-4': { soc: 30, soh: 0.44, tempC: 55, rInt: 0.092 },
}

function applyBattery(s: SimState, map: Record<string, Partial<BatteryModule>>) {
  for (const b of s.batteries) {
    if (map[b.id]) Object.assign(b, map[b.id])
    b.faulted = false
    b.powerKW = 0
  }
  // new pack always healthy
  const nb = s.batteries.find((b) => b.id === 'new-1')
  if (nb) Object.assign(nb, { soc: 60, soh: 0.98, tempC: 26, rInt: 0.031 })
}

export function applyScenario(
  s: SimState,
  id: string,
  log: (level: LogLevel, msg: string) => void,
) {
  // fresh accumulators for a clean demo run
  s.simTimeS = 0
  s.faultCount = 0
  s.reconfigCount = 0
  s.totals = {
    solarEnergyKWh: 0,
    evEnergyKWh: 0,
    batteryEnergyKWh: 0,
    gridImportKWh: 0,
    gridExportKWh: 0,
    degradationCost: 0,
    gridCost: 0,
    co2AvoidedKg: 0,
  }
  s.solar.faulted = false
  s.grid.faulted = false
  s.grid.online = true
  s.running = true
  s.activeScenario = id

  const [ev1, ev2, ev3] = s.evs
  const meta = SCENARIOS.find((m) => m.id === id)

  switch (id) {
    case 'sunny-low':
      s.solar.capacityKW = 400
      s.solar.cloud = 'clear'
      s.grid.tariff = 'normal'
      applyBattery(s, HEALTHY_SL)
      setEV(ev1, { soc: 74, targetSoc: 80, timeToDepartureS: 2400 })
      setEV(ev2, { soc: 84, targetSoc: 90, timeToDepartureS: 3000 })
      setEV(ev3, { soc: 80, targetSoc: 85, timeToDepartureS: 3000 })
      break
    case 'sunny-high':
      s.solar.capacityKW = 300
      s.solar.cloud = 'clear'
      s.grid.tariff = 'normal'
      applyBattery(s, HEALTHY_SL)
      setEV(ev1, { soc: 15, targetSoc: 90, timeToDepartureS: 1200 })
      setEV(ev2, { soc: 20, targetSoc: 90, timeToDepartureS: 1800 })
      setEV(ev3, { soc: 25, targetSoc: 90, timeToDepartureS: 2100 })
      break
    case 'cloudy-high':
      s.solar.capacityKW = 300
      s.solar.cloud = 'cloudy'
      s.grid.tariff = 'peak'
      applyBattery(s, HEALTHY_SL)
      setEV(ev1, { soc: 18, targetSoc: 90, timeToDepartureS: 1200 })
      setEV(ev2, { soc: 22, targetSoc: 90, timeToDepartureS: 1500 })
      setEV(ev3, { soc: 30, targetSoc: 85, timeToDepartureS: 1800 })
      break
    case 'grid-failure':
      s.solar.capacityKW = 250
      s.solar.cloud = 'partly'
      s.grid.tariff = 'peak'
      applyBattery(s, HEALTHY_SL)
      setEV(ev1, { soc: 30, targetSoc: 80, timeToDepartureS: 1500 })
      setEV(ev2, { soc: 35, targetSoc: 85, timeToDepartureS: 2100 })
      setEV(ev3, { soc: 40, targetSoc: 85, timeToDepartureS: 2400 })
      s.grid.faulted = true
      s.faultCount = 1
      s.reconfigCount = 1
      log('fault', 'GRID FAILURE DETECTED — utility connection isolated.')
      log(
        'reconfig',
        'GRID FAILURE DETECTED → SOURCE ISOLATED → ALTERNATIVE SOURCES EVALUATED → POWER PATH RECONFIGURED → EV CHARGING CONTINUED',
      )
      break
    case 'sl-degraded':
      s.solar.capacityKW = 250
      s.solar.cloud = 'clear'
      s.grid.tariff = 'normal'
      applyBattery(s, DEGRADED_SL)
      setEV(ev1, { soc: 25, targetSoc: 85, timeToDepartureS: 1500 })
      setEV(ev2, { soc: 35, targetSoc: 90, timeToDepartureS: 2100 })
      setEV(ev3, { soc: 45, targetSoc: 85, timeToDepartureS: 2400 })
      break
    default:
      log('info', `Unknown scenario "${id}".`)
      return
  }

  s.grid.costRate = TARIFF_RATES[s.grid.tariff]
  log('scenario', `SCENARIO LOADED: ${meta?.name ?? id} — ${meta?.blurb ?? ''}`)
}
