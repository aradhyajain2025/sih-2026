import { DAY_START_SECONDS } from '../engine/constants'
import type { SourceKind } from '../engine/types'

/** Wall-clock string for the sim (starts at solar noon). */
export const simClock = (simTimeS: number) => {
  const total = Math.floor(DAY_START_SECONDS + simTimeS) % 86400
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const p = (x: number) => String(x).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}`
}

export const kw = (n: number) => `${n.toFixed(n >= 100 ? 0 : 1)}`
export const kw0 = (n: number) => `${Math.round(n)}`
export const pct = (n: number) => `${n.toFixed(1)}`
export const pct0 = (n: number) => `${Math.round(n)}`
export const rupee = (n: number) =>
  `₹${n.toLocaleString('en-IN', { maximumFractionDigits: n < 100 ? 2 : 0 })}`
export const kwh = (n: number) =>
  `${n.toLocaleString('en-IN', { maximumFractionDigits: n < 100 ? 2 : 1 })}`

/** Format seconds as m:ss for wait / departure countdowns. */
export const mmss = (s: number) => {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${String(sec).padStart(2, '0')}`
}

export const sourceColor = (s: SourceKind): string => {
  switch (s) {
    case 'solar':
      return '#E8A33D'
    case 'second-life':
    case 'new-battery':
      return '#6C8CFF'
    case 'grid':
      return '#35C4C1'
  }
}
