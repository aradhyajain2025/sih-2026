// Pure engineering math. No state, no side effects. Section 2 of the brief.
import type { BatteryModule, CloudCondition, EV } from './types'
import {
  HS_RES,
  HS_SOC,
  HS_SOH,
  HS_TEMP,
  PRIORITY_W1,
  PRIORITY_W2,
  PRIORITY_W3,
  WAIT_NORM_SECONDS,
} from './constants'

export const clamp = (x: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, x))

/** P = V × I  →  kW from volts and amps */
export const powerKW = (volts: number, amps: number) => (volts * amps) / 1000

/** ΔSOC in percentage points. Section-2 formula scaled ×100 to land on 0-100. */
export function socDeltaPct(
  powerKW: number,
  dtHours: number,
  capacityKWh: number,
  efficiency = 1,
) {
  if (capacityKWh <= 0) return 0
  return (100 * powerKW * efficiency * dtHours) / capacityKWh
}

// ---- Battery health sub-scores (each returns 0-100) ----

/** Peaks in the 20-90% band, derates linearly outside it. */
export function socSuitability(soc: number): number {
  if (soc >= 20 && soc <= 90) return 100
  if (soc < 20) return clamp((soc / 20) * 100, 0, 100)
  return clamp(((100 - soc) / 10) * 100, 0, 100) // soc > 90
}

/** Peaks 15-40°C, derates outside toward 0 at -5°C / 60°C. */
export function tempScore(tempC: number): number {
  if (tempC >= 15 && tempC <= 40) return 100
  if (tempC < 15) return clamp(((tempC + 5) / 20) * 100, 0, 100)
  return clamp(((60 - tempC) / 20) * 100, 0, 100) // tempC > 40
}

/** Derates as internal resistance rises above baseline R0. */
export function resistanceScore(rInt: number, r0: number): number {
  if (r0 <= 0) return 100
  const ratio = rInt / r0
  return clamp(100 - (ratio - 1) * 200, 0, 100)
}

/** Weighted health score 0-100. SOH scaled to 0-100 here only. */
export function healthScore(b: {
  soh: number
  soc: number
  tempC: number
  rInt: number
  r0: number
}): number {
  return (
    HS_SOH * (b.soh * 100) +
    HS_SOC * socSuitability(b.soc) +
    HS_TEMP * tempScore(b.tempC) +
    HS_RES * resistanceScore(b.rInt, b.r0)
  )
}

/** Degradation cost per kWh. SOH used on its 0-1 scale here (Section 2). */
export function degradationCostPerKWh(baseCost: number, soh: number): number {
  return baseCost * (2 - soh)
}

// ---- EV charging priority ----

export function deadlineUrgency(timeToDepartureS: number): number {
  // 0 when far away, →1 as departure approaches (30 min horizon).
  const horizon = 1800
  return clamp(1 - timeToDepartureS / horizon, 0, 1)
}

export function priorityScore(ev: EV): number {
  const gap = clamp(1 - ev.soc / Math.max(ev.targetSoc, 1), 0, 1)
  const wait = clamp(ev.waitTimeS / WAIT_NORM_SECONDS, 0, 1)
  const deadline = deadlineUrgency(ev.timeToDepartureS)
  const raw = PRIORITY_W1 * gap + PRIORITY_W2 * wait + PRIORITY_W3 * deadline
  return raw * ev.priorityWeight
}

// ---- Solar generation curve ----

/**
 * Irradiance factor 0-1 driven by cloud condition. Deterministic pseudo-noise
 * from sim time — a physical model of cloud cover, not decorative randomness.
 */
export function solarIrradiance(
  cloud: CloudCondition,
  simTimeS: number,
): number {
  const t = simTimeS
  // deterministic layered oscillation in [-1,1]
  const osc = (period: number) => Math.sin((2 * Math.PI * t) / period)
  switch (cloud) {
    case 'clear':
      return clamp(0.93 + 0.02 * osc(240), 0, 1)
    case 'partly':
      return clamp(0.68 + 0.14 * osc(180) + 0.05 * osc(47), 0, 1)
    case 'cloudy':
      return clamp(0.34 + 0.08 * osc(300) + 0.04 * osc(63), 0, 1)
    case 'fluctuation':
      // rapid swings between ~0.2 and ~0.9
      return clamp(0.55 + 0.35 * osc(40) + 0.1 * osc(13), 0, 1)
  }
}

export function batteryState(
  score: number,
  faulted: boolean,
  discharging: boolean,
): BatteryModule['state'] {
  if (faulted) return 'ISOLATED'
  if (score >= 80) return discharging ? 'ACTIVE' : 'AVAILABLE'
  if (score >= 60) return 'LIMITED'
  if (score >= 40) return 'WARNING'
  return 'ISOLATED'
}
