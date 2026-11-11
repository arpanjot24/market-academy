// Deterministic SIMULATED practice data. These are not real stocks or real prices.
import type { Candle } from './types'

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function gauss(r: () => number) {
  let u = 0, v = 0
  while (!u) u = r()
  while (!v) v = r()
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
}
const tick = (p: number) => Math.max(0.05, Math.round(p * 20) / 20)

interface Regime { days: number; drift: number; vol: number; meanRevert?: number }
export interface Instrument {
  id: string
  name: string
  description: string
  start: number
  seed: number
  baseVolume: number
  regimes: Regime[]
}

export const instruments: Instrument[] = [
  { id: 'sim-a', name: 'Practice Stock A', description: 'Steady uptrend with pullbacks, then a top and a decline', start: 1250, seed: 11, baseVolume: 1_800_000,
    regimes: [{ days: 110, drift: 0.0022, vol: 0.014 }, { days: 30, drift: -0.003, vol: 0.016 }, { days: 70, drift: 0.0025, vol: 0.013 }, { days: 35, drift: 0, vol: 0.015 }, { days: 55, drift: -0.003, vol: 0.018 }] },
  { id: 'sim-b', name: 'Practice Stock B', description: 'Range-bound, swinging between support and resistance', start: 480, seed: 23, baseVolume: 900_000,
    regimes: [{ days: 300, drift: 0, vol: 0.015, meanRevert: 0.06 }] },
  { id: 'sim-c', name: 'Practice Stock C', description: 'Volatile small cap: rally, crash and recovery', start: 220, seed: 37, baseVolume: 4_000_000,
    regimes: [{ days: 90, drift: 0.004, vol: 0.028 }, { days: 40, drift: -0.009, vol: 0.035 }, { days: 80, drift: 0.001, vol: 0.025 }, { days: 90, drift: 0.003, vol: 0.024 }] },
  { id: 'sim-idx', name: 'Practice Index', description: 'Broad-market index behaviour with low volatility', start: 21500, seed: 5, baseVolume: 300_000_000,
    regimes: [{ days: 150, drift: 0.0008, vol: 0.008 }, { days: 40, drift: -0.002, vol: 0.011 }, { days: 110, drift: 0.001, vol: 0.008 }] },
]

export const instrumentById: Record<string, Instrument> = Object.fromEntries(instruments.map((i) => [i.id, i]))

function businessDays(n: number, start = Date.UTC(2023, 0, 2)) {
  const out: number[] = []
  for (let t = start; out.length < n; t += 864e5) {
    const d = new Date(t).getUTCDay()
    if (d !== 0 && d !== 6) out.push(t / 1000)
  }
  return out
}

function makeCandle(time: number, open: number, close: number, wickVol: number, volume: number, r: () => number): Candle {
  const hi = Math.max(open, close) * Math.exp(Math.abs(gauss(r)) * wickVol)
  const lo = Math.min(open, close) * Math.exp(-Math.abs(gauss(r)) * wickVol)
  const o = tick(open), c = tick(close)
  return { time, open: o, close: c, high: Math.max(tick(hi), o, c), low: Math.min(tick(lo), o, c), volume: Math.round(volume) }
}

const dailyCache = new Map<string, Candle[]>()
export function dailyCandles(id: string): Candle[] {
  const hit = dailyCache.get(id)
  if (hit) return hit
  const ins = instrumentById[id]
  const r = rng(ins.seed)
  const total = ins.regimes.reduce((a, g) => a + g.days, 0)
  const times = businessDays(total)
  const out: Candle[] = []
  let prev = ins.start
  for (const g of ins.regimes) {
    for (let d = 0; d < g.days; d++) {
      const drift = g.drift + (g.meanRevert ? g.meanRevert * Math.log(ins.start / prev) : 0)
      const ret = drift + g.vol * gauss(r)
      const open = prev * Math.exp(g.vol * 0.25 * gauss(r))
      const close = prev * Math.exp(ret)
      const move = Math.abs(ret) / g.vol
      const volume = ins.baseVolume * Math.exp(0.25 * gauss(r)) * (0.6 + 0.5 * move) * (r() < 0.04 ? 2.5 : 1)
      const c = makeCandle(times[out.length], open, close, g.vol * 0.45, volume, r)
      out.push(c)
      prev = c.close
    }
  }
  dailyCache.set(id, out)
  return out
}

/** 5-minute candles for 5 sessions (9:15 to 15:30), stored as IST wall-clock times. */
const intraCache = new Map<string, Candle[]>()
export function intradayCandles(id: string): Candle[] {
  const hit = intraCache.get(id)
  if (hit) return hit
  const ins = instrumentById[id]
  const daily = dailyCandles(id)
  const r = rng(ins.seed * 7 + 1)
  const dayVol = ins.regimes[ins.regimes.length - 1].vol
  const barVol = dayVol / Math.sqrt(75)
  const days = businessDays(daily.length + 5).slice(daily.length)
  const out: Candle[] = []
  let prev = daily[daily.length - 1].close
  for (const day of days) {
    let open = prev * Math.exp(dayVol * 0.3 * gauss(r))
    for (let k = 0; k < 75; k++) {
      const close = open * Math.exp(barVol * gauss(r))
      const u = (k - 37) / 37
      const volume = (ins.baseVolume / 75) * (0.6 + 1.6 * u * u) * Math.exp(0.3 * gauss(r))
      const c = makeCandle(day + 9 * 3600 + 15 * 60 + k * 300, open, close, barVol * 0.5, volume, r)
      out.push(c)
      open = c.close
    }
    prev = out[out.length - 1].close
  }
  intraCache.set(id, out)
  return out
}

export const SIM_NOTICE = 'Simulated practice data — not a real stock, not real prices. Dates are placeholders. Real NSE/BSE data arrives in Phase 3.'
