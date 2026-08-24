// Illustrative constants. Every weight/threshold here is a labeled starting
// assumption (see ASSUMPTIONS.md), not a researched physical constant.

export const SIM_STEP_SECONDS = 30 // sim-seconds advanced per tick at 1x
export const REAL_INTERVAL_MS = 500 // wall-clock interval of the driver
export const DAY_START_SECONDS = 12 * 3600 // clock begins at 12:00 (solar noon)

export const LOSS_FACTOR = 0.04 // 4% conversion/transmission losses on throughput
export const EV_CHARGE_EFFICIENCY = 0.95
export const BATTERY_CHARGE_EFFICIENCY = 0.94
export const CO2_GRID_KG_PER_KWH = 0.71 // India grid emission factor (illustrative)

// EV charging priority weights — P_i = w1·U + w2·S + w3·D + w4·Q + w5·C
// EV charging priority weights — P_i = w1·U + w2·S + w3·D + w4·Q + w5·C
export const PRIORITY_W1 = 0.10 // U: wait urgency
export const PRIORITY_W2 = 0.25 // S: SOC deficit
export const PRIORITY_W3 = 0.25 // D: departure deadline
export const PRIORITY_W4 = 0.20 // Q: operator priority weight
export const PRIORITY_W5 = 0.20 // C: charge feasibility (time-to-full / time-available)
export const PRIORITY_HORIZON_S = 7200 // 2-hour normalization horizon for U and D

// Health-score sub-weights (Section 2)
export const HS_SOH = 0.4
export const HS_SOC = 0.2
export const HS_TEMP = 0.2
export const HS_RES = 0.2

// Grid tariffs (₹/kWh)
export const TARIFF_RATES = {
  low: 6,
  normal: 9,
  peak: 13,
} as const

export const BATTERY_CHARGE_CEILING = 95 // stop charging a module above this SOC

// Second-life packs: cheaper per kWh to cycle, but degrade faster.
// New pack: pricier to cycle (reserve), degrades slowly.
export const BASE_DEG_COST = {
  'second-life': 4, // ₹/kWh base
  new: 8,
} as const

export const WEAR_RATE = {
  'second-life': 8e-6, // SOH lost per kWh throughput
  new: 2e-6,
} as const

export interface EVProfile {
  model: string
  capacityKWh: number
  nominalV: number
  maxPowerKW: number
}

// EV1 / EV2 / EV3 — indices used by load-case selection.
export const EV_PROFILES: EVProfile[] = [
  { model: 'Kia EV9', capacityKWh: 99.8, nominalV: 552, maxPowerKW: 350 }, // EV1
  { model: 'Tata Punch EV', capacityKWh: 35, nominalV: 320, maxPowerKW: 50 }, // EV2
  { model: 'MG Comet EV', capacityKWh: 17, nominalV: 300, maxPowerKW: 7 }, // EV3
]
