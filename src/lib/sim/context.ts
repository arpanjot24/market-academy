// Glue between the engine and the app: price lookups and names for both modes.
import { dailyCandles, instruments, instrumentById } from '../chart/sim'
import { displayName } from '../../content/market'
import type { Account, OHLC } from './engine'

export const PRACTICE_SYMBOLS = instruments.filter((i) => i.id !== 'sim-idx').map((i) => i.id)
export const PRACTICE_START = 120
export const PRACTICE_END = 299

export const candleAt = (sym: string, day: number): OHLC | undefined => dailyCandles(sym)[day]

export function priceFn(acc: Account): (sym: string) => number | undefined {
  if (acc.mode === 'practice') return (sym) => candleAt(sym, acc.clock)?.close
  return (sym) => acc.marks?.[sym]?.price
}

export const symName = (acc: Account | null, sym: string) => (acc?.mode === 'practice' || instrumentById[sym] ? instrumentById[sym]?.name ?? sym : displayName(sym))

export const simDate = (sec: number) => new Date(sec * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
export const inr0 = (x: number) => '₹' + Math.round(x).toLocaleString('en-IN')
export const inr2 = (x: number) => '₹' + x.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
export const pctS = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(2)}%`
