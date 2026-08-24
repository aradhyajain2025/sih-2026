// The one simulation engine. All math flows through here; components never
// compute physics, they only read snapshots and dispatch actions.
import {
  BASE_DEG_COST,
  BATTERY_CHARGE_CEILING,
  BATTERY_CHARGE_EFFICIENCY,
  CO2_GRID_KG_PER_KWH,
  DAY_START_SECONDS,
  EV_CHARGE_EFFICIENCY,
  EV_PROFILES,
  LOSS_FACTOR,
  SIM_STEP_SECONDS,
  TARIFF_RATES,
  WEAR_RATE,
} from './constants'
import {
  batteryState,
  clamp,
  degradationCostPerKWh,
  healthScore,
  priorityScore,
  socDeltaPct,
  solarIrradiance,
} from './model'
import {
  selectSources,
  type BatteryOption,
  type GridOption,
} from './sourceSelection'
import { applyScenario } from './scenarios'
import type {
  Action,
  BatteryModule,
  EV,
  FaultTarget,
  LogEntry,
  LogLevel,
  SelectionResult,
  SimState,
} from './types'

const AMBIENT_C = 25
const LOG_CAP = 250

let evCounter = 0

function makeEV(profileIndex: number, over: Partial<EV> = {}): EV {
  const p = EV_PROFILES[profileIndex % EV_PROFILES.length]
  evCounter += 1
  const n = evCounter
  return {
    id: `ev-${n}`,
    name: `EV-${String(n).padStart(2, '0')}`,
    model: p.model,
    capacityKWh: p.capacityKWh,
    nominalV: p.nominalV,
    maxPowerKW: p.maxPowerKW,
    soc: 40,
    targetSoc: 80,
    priorityWeight: 1,
    waitTimeS: 0,
    timeToDepartureS: 1800,
    connected: true,
    priorityScore: 0,
    chargePowerKW: 0,
    rank: 0,
    ...over,
  }
}

function initialEVs(): EV[] {
  evCounter = 0
  return [
    makeEV(0, { soc: 22, targetSoc: 80, timeToDepartureS: 1500 }), // Kia EV9
    makeEV(1, { soc: 40, targetSoc: 90, timeToDepartureS: 2400 }), // Compact
    makeEV(2, { soc: 55, targetSoc: 85, timeToDepartureS: 3000 }), // Sedan
  ]
}

function slMod(
  n: number,
  o: Partial<BatteryModule>,
): BatteryModule {
  return {
    id: `sl-${n}`,
    label: `SL-BATTERY-0${n}`,
    kind: 'second-life',
    capacityKWh: 85,
    nominalV: 350,
    maxPowerKW: 55,
    soc: 70,
    soh: 0.8,
    tempC: 30,
    rInt: 0.055,
    r0: 0.05,
    baseDegradationCost: BASE_DEG_COST['second-life'],
    socFloor: 15,
    faulted: false,
    healthScore: 0,
    state: 'AVAILABLE',
    powerKW: 0,
    degCostPerKWh: 0,
    ...o,
  }
}

function initialBatteries(): BatteryModule[] {
  return [
    slMod(1, { capacityKWh: 90, soc: 78, soh: 0.86, tempC: 32, rInt: 0.052, maxPowerKW: 60 }),
    slMod(2, { capacityKWh: 85, soc: 82, soh: 0.81, tempC: 29, rInt: 0.055, maxPowerKW: 55 }),
    slMod(3, { capacityKWh: 80, soc: 55, soh: 0.74, tempC: 38, rInt: 0.068, maxPowerKW: 50 }),
    slMod(4, { capacityKWh: 88, soc: 40, soh: 0.63, tempC: 47, rInt: 0.078, maxPowerKW: 55 }),
    {
      id: 'new-1',
      label: 'NEW-PACK-01',
      kind: 'new',
      capacityKWh: 120,
      nominalV: 800,
      maxPowerKW: 150,
      soc: 60,
      soh: 0.98,
      tempC: 26,
      rInt: 0.031,
      r0: 0.03,
      baseDegradationCost: BASE_DEG_COST['new'],
      socFloor: 15,
      faulted: false,
      healthScore: 0,
      state: 'AVAILABLE',
      powerKW: 0,
      degCostPerKWh: 0,
    },
  ]
}

function emptySelection(): SelectionResult {
  return {
    selected: [],
    contributions: [],
    reason: 'Initializing…',
    demandKW: 0,
    suppliedKW: 0,
    unmetKW: 0,
    key: '',
  }
}

export function createInitialState(): SimState {
  return {
    running: false,
    speed: 1,
    simTimeS: 0,
    evs: initialEVs(),
    batteries: initialBatteries(),
    solar: {
      capacityKW: 250,
      cloud: 'clear',
      faulted: false,
      irradiance: 0,
      outputKW: 0,
    },
    grid: {
      online: true,
      maxImportKW: 150,
      tariff: 'normal',
      faulted: false,
      importKW: 0,
      exportKW: 0,
      costRate: TARIFF_RATES.normal,
    },
    losses: 0,
    balanceResidual: 0,
    selection: emptySelection(),
    log: [],
    totals: {
      solarEnergyKWh: 0,
      evEnergyKWh: 0,
      batteryEnergyKWh: 0,
      gridImportKWh: 0,
      gridExportKWh: 0,
      degradationCost: 0,
      gridCost: 0,
      co2AvoidedKg: 0,
    },
    metrics: {
      solarKW: 0,
      evDemandKW: 0,
      batteryKW: 0,
      gridKW: 0,
      gridExportKW: 0,
      totalLoadKW: 0,
      efficiencyPct: 100,
      renewablePct: 0,
    },
    activeScenario: null,
    faultCount: 0,
    reconfigCount: 0,
    seq: 0,
  }
}

function clockString(simTimeS: number): string {
  const total = Math.floor(DAY_START_SECONDS + simTimeS) % 86400
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const p = (x: number) => String(x).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}`
}

export class SimulationEngine {
  state: SimState

  constructor() {
    this.state = createInitialState()
    this.recompute() // populate derived values without advancing time
    this.log('info', 'ENERFLUX controller online. Awaiting simulation start.')
  }

  private log(level: LogLevel, msg: string) {
    const s = this.state
    s.seq += 1
    const entry: LogEntry = {
      id: s.seq,
      clock: clockString(s.simTimeS),
      level,
      msg,
    }
    s.log.push(entry)
    if (s.log.length > LOG_CAP) s.log.splice(0, s.log.length - LOG_CAP)
  }

  /** Driver entry point — advances only while running. */
  tick() {
    if (!this.state.running) return
    this.advance(SIM_STEP_SECONDS * this.state.speed)
  }

  /** Single manual step regardless of running state. */
  step() {
    this.advance(SIM_STEP_SECONDS * this.state.speed)
  }

  /** Refresh derived state (selection, health, metrics) without advancing time. */
  private recompute() {
    this.advance(0)
  }

  private advance(dtS: number) {
    const s = this.state
    const dtH = dtS / 3600
    const capDtH = dtH > 0 ? dtH : SIM_STEP_SECONDS / 3600 // for headroom caps on dt=0
    s.simTimeS += dtS

    // ---- 1. Solar ----
    const solar = s.solar
    const irr =
      solar.faulted || solar.capacityKW <= 0
        ? 0
        : solarIrradiance(solar.cloud, s.simTimeS)
    solar.irradiance = irr
    solar.outputKW = Math.max(0, solar.capacityKW * irr)

    // ---- 2. Grid ----
    const grid = s.grid
    grid.costRate = TARIFF_RATES[grid.tariff]
    const gridAvailable = grid.online && !grid.faulted

    // ---- 3. Battery derived (pre-selection) ----
    for (const b of s.batteries) {
      b.degCostPerKWh = degradationCostPerKWh(b.baseDegradationCost, b.soh)
      b.healthScore = healthScore(b)
    }

    // ---- 4. EV demand + priority ----
    let totalDemand = 0
    const requested: Record<string, number> = {}
    for (const ev of s.evs) {
      let req = 0
      if (ev.connected && ev.soc < ev.targetSoc) {
        const gapKWh = ((ev.targetSoc - ev.soc) / 100) * ev.capacityKWh
        const maxByGap = gapKWh / (EV_CHARGE_EFFICIENCY * capDtH)
        req = Math.min(ev.maxPowerKW, maxByGap)
      }
      requested[ev.id] = req
      totalDemand += req
      ev.priorityScore = ev.connected ? priorityScore(ev) : 0
    }

    // ---- 5. Build source options ----
    const batteryOptions: BatteryOption[] = s.batteries.map((b) => {
      const usable =
        !b.faulted && b.healthScore >= 40 && b.soc > b.socFloor + 0.1
      const roomKWh = ((b.soc - b.socFloor) / 100) * b.capacityKWh
      const powerFromSOC = roomKWh / capDtH
      const dischargeableKW = usable
        ? Math.min(b.maxPowerKW, powerFromSOC)
        : 0
      return {
        id: b.id,
        label: b.label,
        kind: b.kind,
        dischargeableKW,
        degCost: b.degCostPerKWh,
        soc: b.soc,
        soh: b.soh,
      }
    })
    const gridOption: GridOption = {
      available: gridAvailable,
      availKW: grid.maxImportKW,
      level: grid.tariff,
      rate: grid.costRate,
    }

    // ---- 6. Source selection (Novelty 2) ----
    const sel = selectSources(
      totalDemand,
      solar.outputKW,
      batteryOptions,
      gridOption,
    )
    const battAllocToEV = sel.batteryAlloc
    const battToEV = Object.values(battAllocToEV).reduce((a, b) => a + b, 0)
    // Power the controller places on the bus for EV charging.
    const busForEV = sel.solarToEV + battToEV + sel.gridToEV
    // Delivery losses (Section-2 P_losses) come out of the bus power, so they are
    // always sourced and the balance closes even when supply is saturated.
    const losses = LOSS_FACTOR * busForEV
    const evDelivered = Math.max(0, busForEV - losses)

    // ---- 7. Allocate delivered power to EVs by priority ----
    const ranked = s.evs
      .filter((e) => e.connected)
      .slice()
      .sort((a, b) => b.priorityScore - a.priorityScore)
    ranked.forEach((e, i) => (e.rank = i + 1))
    for (const e of s.evs) if (!e.connected) e.rank = 0
    let remainingSupply = evDelivered
    for (const ev of ranked) {
      const give = Math.min(requested[ev.id] || 0, remainingSupply)
      ev.chargePowerKW = give > 0.01 ? give : 0
      remainingSupply -= ev.chargePowerKW
    }
    for (const ev of s.evs) if (!ev.connected) ev.chargePowerKW = 0

    // ---- 8. Solar surplus → charge storage, then export ----
    const surplus = Math.max(0, solar.outputKW - sel.solarToEV)
    const battChargeAlloc: Record<string, number> = {}
    let surplusLeft = surplus
    const chargeCandidates = s.batteries
      .filter(
        (b) =>
          !b.faulted &&
          b.state !== 'ISOLATED' &&
          b.healthScore >= 40 &&
          b.soc < BATTERY_CHARGE_CEILING,
      )
      .sort((a, b) => a.soc - b.soc) // fill emptiest first
    for (const b of chargeCandidates) {
      if (surplusLeft <= 0.01) break
      const roomKWh = ((BATTERY_CHARGE_CEILING - b.soc) / 100) * b.capacityKWh
      const maxByRoom = roomKWh / (BATTERY_CHARGE_EFFICIENCY * capDtH)
      const take = Math.min(b.maxPowerKW, maxByRoom, surplusLeft)
      if (take <= 0.01) continue
      battChargeAlloc[b.id] = take
      surplusLeft -= take
    }
    const battChargeTotal = Object.values(battChargeAlloc).reduce(
      (a, b) => a + b,
      0,
    )
    const surplus2 = Math.max(0, surplus - battChargeTotal)

    // ---- 9. Route surplus, close the balance ----
    // Export surplus solar if the grid can take it; otherwise the inverter
    // curtails what it cannot place (islanded with storage full).
    const gridExport = gridAvailable ? surplus2 : 0
    const curtailed = gridAvailable ? 0 : surplus2
    const solarSourced = solar.outputKW - curtailed
    solar.outputKW = solarSourced // display the actually-injected solar
    const gridImport = sel.gridToEV
    const balanceResidual =
      solarSourced +
      battToEV +
      gridImport -
      (evDelivered + battChargeTotal + gridExport + losses)

    // ---- 10. Apply SOC / physical updates to batteries ----
    let degradationCostTick = 0
    for (const b of s.batteries) {
      const dis = battAllocToEV[b.id] || 0
      const cha = battChargeAlloc[b.id] || 0
      const net = dis - cha // + discharge
      if (net >= 0) {
        b.soc -= socDeltaPct(net, dtH, b.capacityKWh, 1)
      } else {
        b.soc += socDeltaPct(-net, dtH, b.capacityKWh, BATTERY_CHARGE_EFFICIENCY)
      }
      b.soc = clamp(b.soc, 0, 100)
      b.powerKW = net
      // thermal drift
      const dtMin = dtS / 60
      b.tempC +=
        (0.004 * Math.abs(net) - 0.06 * (b.tempC - AMBIENT_C)) * dtMin
      // wear
      const throughputKWh = Math.abs(net) * dtH
      b.soh = clamp(b.soh - WEAR_RATE[b.kind] * throughputKWh * 100, 0, 1)
      b.rInt += 1e-6 * throughputKWh
      // degradation cost on discharge only
      if (dis > 0) degradationCostTick += dis * dtH * b.degCostPerKWh
      // refresh derived after physical change
      b.healthScore = healthScore(b)
      b.degCostPerKWh = degradationCostPerKWh(b.baseDegradationCost, b.soh)
      const wasIsolated = b.state === 'ISOLATED'
      b.state = batteryState(b.healthScore, b.faulted, b.powerKW > 0.01)
      if (dtS > 0 && b.state === 'ISOLATED' && !wasIsolated && !b.faulted) {
        this.log(
          'fault',
          `${b.label} auto-isolated — health score ${b.healthScore.toFixed(
            0,
          )} below threshold.`,
        )
      }
    }

    // ---- 11. Apply EV SOC updates ----
    for (const ev of s.evs) {
      if (ev.chargePowerKW > 0) {
        ev.soc += socDeltaPct(
          ev.chargePowerKW,
          dtH,
          ev.capacityKWh,
          EV_CHARGE_EFFICIENCY,
        )
        ev.soc = clamp(ev.soc, 0, 100)
      }
      if (ev.connected) {
        ev.waitTimeS += dtS
        ev.timeToDepartureS = Math.max(0, ev.timeToDepartureS - dtS)
      }
    }

    // ---- 12. Metrics ----
    const supply = solarSourced + battToEV + gridImport
    const efficiencyPct = supply > 0.01 ? ((supply - losses) / supply) * 100 : 100
    const renewablePct =
      busForEV > 0.01
        ? clamp(((sel.solarToEV + battToEV) / busForEV) * 100, 0, 100)
        : solarSourced > 0
        ? 100
        : 0
    s.metrics = {
      solarKW: solarSourced,
      evDemandKW: totalDemand,
      batteryKW: battToEV - battChargeTotal,
      gridKW: gridImport - gridExport,
      gridExportKW: gridExport,
      totalLoadKW: evDelivered + battChargeTotal,
      efficiencyPct,
      renewablePct,
    }

    grid.importKW = gridImport
    grid.exportKW = gridExport
    s.losses = losses
    s.balanceResidual = balanceResidual

    // ---- 13. Totals ----
    const t = s.totals
    t.solarEnergyKWh += solarSourced * dtH
    t.evEnergyKWh += evDelivered * dtH
    t.batteryEnergyKWh += battToEV * dtH
    t.gridImportKWh += gridImport * dtH
    t.gridExportKWh += gridExport * dtH
    t.degradationCost += degradationCostTick
    t.gridCost += gridImport * dtH * grid.costRate
    t.co2AvoidedKg += (sel.solarToEV + battToEV) * dtH * CO2_GRID_KG_PER_KWH

    // ---- 14. Selection change → decision log ----
    const prevKey = s.selection.key
    s.selection = sel.result
    if (dtS > 0 && sel.result.key !== prevKey) {
      this.log('decision', `SOURCE SELECTED: ${sel.result.reason}`)
    }
  }

  dispatch(action: Action) {
    const s = this.state
    switch (action.type) {
      case 'TOGGLE_RUN':
        s.running = !s.running
        this.log('info', s.running ? 'Simulation RUNNING.' : 'Simulation PAUSED.')
        break
      case 'SET_RUNNING':
        s.running = action.value
        break
      case 'SET_SPEED':
        s.speed = action.value
        this.log('info', `Simulation speed set to ${action.value}×.`)
        break
      case 'RESET': {
        const wasRunning = s.running
        this.state = createInitialState()
        this.state.running = wasRunning
        this.recompute()
        this.log('info', 'Simulation RESET to initial conditions.')
        break
      }
      case 'STEP':
        this.step()
        break
      case 'SET_SOLAR_CAPACITY':
        s.solar.capacityKW = clamp(action.value, 0, 500)
        this.recompute()
        break
      case 'SET_CLOUD':
        s.solar.cloud = action.value
        this.log('info', `Cloud condition → ${action.value}.`)
        this.recompute()
        break
      case 'SET_GRID_ONLINE':
        s.grid.online = action.value
        this.log('info', `Grid connection ${action.value ? 'ENABLED' : 'DISABLED'}.`)
        this.recompute()
        break
      case 'SET_GRID_MAX':
        s.grid.maxImportKW = clamp(action.value, 0, 500)
        this.recompute()
        break
      case 'SET_TARIFF':
        s.grid.tariff = action.value
        this.log(
          'tariff',
          `Tariff → ${action.value.toUpperCase()} (₹${TARIFF_RATES[action.value]}/kWh).`,
        )
        this.recompute()
        break
      case 'ADD_EV': {
        const ev = makeEV(s.evs.length, { soc: 30, targetSoc: 80 })
        s.evs.push(ev)
        this.log('ev', `${ev.name} (${ev.model}) connected — charging requested.`)
        this.recompute()
        break
      }
      case 'REMOVE_EV': {
        const ev = s.evs.find((e) => e.id === action.id)
        s.evs = s.evs.filter((e) => e.id !== action.id)
        if (ev) this.log('ev', `${ev.name} disconnected.`)
        this.recompute()
        break
      }
      case 'UPDATE_EV': {
        const ev = s.evs.find((e) => e.id === action.id)
        if (ev) Object.assign(ev, action.patch)
        this.recompute()
        break
      }
      case 'FAULT':
        this.injectFault(action.target)
        break
      case 'CLEAR_FAULTS':
        this.clearFaults()
        break
      case 'LOAD_SCENARIO':
        applyScenario(this.state, action.id, (level, msg) => this.log(level, msg))
        this.recompute()
        break
    }
  }

  private logReconfig(trigger: string) {
    const s = this.state
    s.reconfigCount += 1
    this.log(
      'reconfig',
      `${trigger} → SOURCE ISOLATED → ALTERNATIVE SOURCES EVALUATED → POWER PATH RECONFIGURED → EV CHARGING CONTINUED`,
    )
  }

  private injectFault(target: FaultTarget) {
    const s = this.state
    s.faultCount += 1
    switch (target) {
      case 'SOLAR':
        s.solar.faulted = true
        this.log('fault', 'SOLAR ARRAY FAULT DETECTED — PV output isolated.')
        this.logReconfig('SOLAR FAILURE DETECTED')
        break
      case 'GRID':
        s.grid.faulted = true
        this.log('fault', 'GRID FAILURE DETECTED — utility connection isolated.')
        this.logReconfig('GRID FAILURE DETECTED')
        break
      case 'SL_BATTERY': {
        const b = s.batteries.find(
          (m) => m.kind === 'second-life' && !m.faulted,
        )
        if (b) {
          b.faulted = true
          this.log('fault', `${b.label} MODULE FAULT — battery isolated.`)
          this.logReconfig(`${b.label} FAILURE DETECTED`)
        } else {
          s.faultCount -= 1
          this.log('info', 'No healthy second-life module left to fault.')
        }
        break
      }
    }
    this.recompute()
  }

  private clearFaults() {
    const s = this.state
    s.solar.faulted = false
    s.grid.faulted = false
    for (const b of s.batteries) b.faulted = false
    s.reconfigCount += 1
    this.log('reconfig', 'ALL FAULTS CLEARED → sources restored → power paths re-optimized.')
    this.recompute()
  }

  getSnapshot(): SimState {
    const s = this.state
    return {
      ...s,
      evs: s.evs.map((e) => ({ ...e })),
      batteries: s.batteries.map((b) => ({ ...b })),
      solar: { ...s.solar },
      grid: { ...s.grid },
      selection: {
        ...s.selection,
        selected: [...s.selection.selected],
        contributions: s.selection.contributions.map((c) => ({ ...c })),
      },
      totals: { ...s.totals },
      metrics: { ...s.metrics },
      log: [...s.log],
    }
  }
}
