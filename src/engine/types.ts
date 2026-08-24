// ENERFLUX domain types. Single source of truth for the simulation engine.

export type CloudCondition = 'clear' | 'partly' | 'cloudy' | 'fluctuation'
export type TariffLevel = 'low' | 'normal' | 'peak'
export type BatteryState =
  | 'AVAILABLE'
  | 'ACTIVE'
  | 'LIMITED'
  | 'WARNING'
  | 'ISOLATED'
export type BatteryKind = 'second-life' | 'new'
export type SourceKind = 'solar' | 'second-life' | 'new-battery' | 'grid'
export type CaseId = 'worst' | 'normal' | 'best'

export interface EV {
  id: string
  name: string
  model: string
  capacityKWh: number // usable pack capacity
  nominalV: number
  maxPowerKW: number // max DC accept rate
  soc: number // 0-100
  targetSoc: number // 0-100
  priorityWeight: number // user multiplier ~0.5-2
  waitTimeS: number // seconds connected
  timeToDepartureS: number // seconds until deadline
  connected: boolean
  // derived (recomputed each tick):
  priorityScore: number
  chargePowerKW: number
  rank: number
}

export interface BatteryModule {
  id: string
  label: string
  kind: BatteryKind
  capacityKWh: number
  nominalV: number
  maxPowerKW: number
  soc: number // 0-100
  soh: number // 0-1 state of health
  tempC: number
  rInt: number // internal resistance (ohm, illustrative)
  r0: number // baseline internal resistance
  baseDegradationCost: number // ₹/kWh base
  socFloor: number // safety discharge floor %
  faulted: boolean // hard fault injected
  // derived:
  healthScore: number // 0-100
  state: BatteryState
  powerKW: number // + discharge, - charge (this tick)
  degCostPerKWh: number
}

export interface SolarState {
  capacityKW: number // installed capacity (0-500)
  cloud: CloudCondition
  faulted: boolean
  irradiance: number // 0-1
  outputKW: number
}

export interface GridState {
  online: boolean
  maxImportKW: number
  tariff: TariffLevel
  faulted: boolean
  importKW: number
  exportKW: number
  costRate: number // ₹/kWh current
}

export interface SourceContribution {
  source: SourceKind
  label: string
  powerKW: number
}

export interface SelectionResult {
  selected: SourceKind[]
  contributions: SourceContribution[]
  reason: string
  demandKW: number
  suppliedKW: number
  unmetKW: number
  key: string // stable signature to detect changes
}

export type LogLevel =
  | 'info'
  | 'decision'
  | 'fault'
  | 'reconfig'
  | 'tariff'
  | 'ev'
  | 'scenario'

export interface LogEntry {
  id: number
  clock: string
  level: LogLevel
  msg: string
}

export interface Totals {
  solarEnergyKWh: number
  evEnergyKWh: number
  batteryEnergyKWh: number // net discharge delivered
  gridImportKWh: number
  gridExportKWh: number
  degradationCost: number // ₹
  gridCost: number // ₹
  co2AvoidedKg: number
}

export interface Metrics {
  solarKW: number
  evDemandKW: number
  batteryKW: number // net (+discharge)
  gridKW: number // net (+import)
  gridExportKW: number
  totalLoadKW: number
  efficiencyPct: number
  renewablePct: number
}

export interface SimState {
  running: boolean
  speed: number // 1 | 2 | 5 | 10
  simTimeS: number
  evs: EV[]
  batteries: BatteryModule[]
  solar: SolarState
  grid: GridState
  losses: number // kW this tick
  balanceResidual: number // should be ~0
  selection: SelectionResult
  log: LogEntry[]
  totals: Totals
  metrics: Metrics
  activeScenario: string | null
  activeCase: CaseId
  faultCount: number
  reconfigCount: number
  seq: number
}

export type FaultTarget = 'SOLAR' | 'GRID' | 'SL_BATTERY'

export type Action =
  | { type: 'TOGGLE_RUN' }
  | { type: 'SET_RUNNING'; value: boolean }
  | { type: 'SET_SPEED'; value: number }
  | { type: 'RESET' }
  | { type: 'STEP' }
  | { type: 'SET_SOLAR_CAPACITY'; value: number }
  | { type: 'SET_CLOUD'; value: CloudCondition }
  | { type: 'SET_GRID_ONLINE'; value: boolean }
  | { type: 'SET_GRID_MAX'; value: number }
  | { type: 'SET_TARIFF'; value: TariffLevel }
  | { type: 'ADD_EV' }
  | { type: 'SET_CASE'; value: CaseId }
  | { type: 'REMOVE_EV'; id: string }
  | { type: 'UPDATE_EV'; id: string; patch: Partial<EV> }
  | { type: 'FAULT'; target: FaultTarget }
  | { type: 'CLEAR_FAULTS' }
  | { type: 'LOAD_SCENARIO'; id: string }
