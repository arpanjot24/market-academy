// Candlestick pattern recognition. Rule-based and deliberately conservative:
// patterns are probabilities that need confirmation, never guarantees.
import type { Candle } from './types'

export type Bias = 'bullish' | 'bearish' | 'neutral'
export type Trend = 'up' | 'down' | 'side'
export interface PatternHit { id: string; start: number; end: number; bias: Bias }

export const body = (c: Candle) => Math.abs(c.close - c.open)
export const range = (c: Candle) => c.high - c.low
export const upperWick = (c: Candle) => c.high - Math.max(c.open, c.close)
export const lowerWick = (c: Candle) => Math.min(c.open, c.close) - c.low
const bull = (c: Candle) => c.close > c.open
const bear = (c: Candle) => c.close < c.open
const mid = (c: Candle) => (c.open + c.close) / 2

function avg(cs: Candle[], i: number, f: (c: Candle) => number, n = 10) {
  const from = Math.max(0, i - n)
  if (from >= i) return f(cs[i])
  let s = 0
  for (let j = from; j < i; j++) s += f(cs[j])
  return s / (i - from)
}

/** Direction of the move over the `look` candles before index i, measured in average candle ranges. */
export function trendBefore(cs: Candle[], i: number, look = 5): Trend {
  if (i - 1 - look < 0) return 'side'
  const change = cs[i - 1].close - cs[i - 1 - look].close
  const ar = avg(cs, i, range, look) || 1
  const z = change / ar
  return z > 1.5 ? 'up' : z < -1.5 ? 'down' : 'side'
}

// Shape tests that ignore trend (also used by the candle builder).
export const isDoji = (c: Candle) => range(c) > 0 && body(c) <= 0.1 * range(c)
export const isHammerShape = (c: Candle) => range(c) > 0 && !isDoji(c) && upperWick(c) <= 0.15 * range(c) && lowerWick(c) >= 0.6 * range(c) && lowerWick(c) >= 2 * body(c)
export const isInvHammerShape = (c: Candle) => range(c) > 0 && !isDoji(c) && lowerWick(c) <= 0.15 * range(c) && upperWick(c) >= 0.6 * range(c) && upperWick(c) >= 2 * body(c)
export const isMarubozuShape = (c: Candle) => range(c) > 0 && body(c) >= 0.9 * range(c)
export const isSpinningTop = (c: Candle) => range(c) > 0 && !isDoji(c) && body(c) <= 0.35 * range(c) && upperWick(c) > body(c) && lowerWick(c) > body(c)

export function shapeName(c: Candle): string | null {
  if (isDoji(c)) return 'doji'
  if (isHammerShape(c)) return 'hammer-shaped (long lower wick)'
  if (isInvHammerShape(c)) return 'inverted-hammer-shaped (long upper wick)'
  if (isMarubozuShape(c)) return 'marubozu (almost no wicks)'
  if (isSpinningTop(c)) return 'spinning top'
  return null
}

/** All patterns whose final candle is index i. */
export function detectAt(cs: Candle[], i: number): PatternHit[] {
  const hits: PatternHit[] = []
  const add = (id: string, len: number, bias: Bias) => hits.push({ id, start: i - len + 1, end: i, bias })
  const c = cs[i]
  if (!c || range(c) <= 0) return hits
  const ab = avg(cs, i, body)
  const ar = avg(cs, i, range)
  const long = (x: Candle) => body(x) >= ab && body(x) >= 0.5 * range(x)

  // Single candle
  const t1 = trendBefore(cs, i)
  if (isDoji(c)) add('doji', 1, 'neutral')
  if (isHammerShape(c)) { if (t1 === 'down') add('hammer', 1, 'bullish'); if (t1 === 'up') add('hanging-man', 1, 'bearish') }
  if (isInvHammerShape(c)) { if (t1 === 'down') add('inverted-hammer', 1, 'bullish'); if (t1 === 'up') add('shooting-star', 1, 'bearish') }
  if (isMarubozuShape(c) && body(c) >= ab) add('marubozu', 1, bull(c) ? 'bullish' : 'bearish')
  if (isSpinningTop(c)) add('spinning-top', 1, 'neutral')

  // Two candles
  if (i >= 1) {
    const p = cs[i - 1]
    const t2 = trendBefore(cs, i - 1)
    const hiC = Math.max(c.open, c.close), loC = Math.min(c.open, c.close)
    if (t2 === 'down' && bear(p) && bull(c) && c.open <= p.close && c.close >= p.open && body(c) > body(p)) add('bullish-engulfing', 2, 'bullish')
    if (t2 === 'up' && bull(p) && bear(c) && c.open >= p.close && c.close <= p.open && body(c) > body(p)) add('bearish-engulfing', 2, 'bearish')
    if (t2 === 'down' && bear(p) && long(p) && hiC <= p.open && loC >= p.close && body(c) <= 0.5 * body(p)) add('bullish-harami', 2, 'bullish')
    if (t2 === 'up' && bull(p) && long(p) && hiC <= p.close && loC >= p.open && body(c) <= 0.5 * body(p)) add('bearish-harami', 2, 'bearish')
    if (t2 === 'down' && bear(p) && long(p) && bull(c) && c.open < p.close && c.close > mid(p) && c.close < p.open) add('piercing', 2, 'bullish')
    if (t2 === 'up' && bull(p) && long(p) && bear(c) && c.open > p.close && c.close < mid(p) && c.close > p.open) add('dark-cloud', 2, 'bearish')
    if (t2 === 'up' && bull(p) && bear(c) && Math.abs(p.high - c.high) <= 0.1 * ar) add('tweezer-top', 2, 'bearish')
    if (t2 === 'down' && bear(p) && bull(c) && Math.abs(p.low - c.low) <= 0.1 * ar) add('tweezer-bottom', 2, 'bullish')
  }

  // Three candles
  if (i >= 2) {
    const q = cs[i - 2], p = cs[i - 1]
    const t3 = trendBefore(cs, i - 2)
    if (t3 === 'down' && bear(q) && long(q) && body(p) <= 0.35 * body(q) && Math.max(p.open, p.close) <= q.close + 0.1 * body(q) && bull(c) && c.close > mid(q)) add('morning-star', 3, 'bullish')
    if (t3 === 'up' && bull(q) && long(q) && body(p) <= 0.35 * body(q) && Math.min(p.open, p.close) >= q.close - 0.1 * body(q) && bear(c) && c.close < mid(q)) add('evening-star', 3, 'bearish')
    const soldier = (x: Candle) => bull(x) && body(x) >= 0.5 * range(x) && body(x) >= 0.7 * ab && upperWick(x) <= 0.35 * body(x)
    const crow = (x: Candle) => bear(x) && body(x) >= 0.5 * range(x) && body(x) >= 0.7 * ab && lowerWick(x) <= 0.35 * body(x)
    if (t3 !== 'up' && soldier(q) && soldier(p) && soldier(c) && p.close > q.close && c.close > p.close && p.open > q.open && p.open <= q.close && c.open > p.open && c.open <= p.close) add('three-white-soldiers', 3, 'bullish')
    if (t3 !== 'down' && crow(q) && crow(p) && crow(c) && p.close < q.close && c.close < p.close && p.open < q.open && p.open >= q.close && c.open < p.open && c.open >= p.close) add('three-black-crows', 3, 'bearish')
  }
  return hits
}

export function detectRange(cs: Candle[], from: number, to: number): PatternHit[] {
  const out: PatternHit[] = []
  for (let i = Math.max(0, from); i <= Math.min(to, cs.length - 1); i++) out.push(...detectAt(cs, i))
  return out
}

export type PatternStatus = 'developing' | 'awaiting' | 'confirmed' | 'not-confirmed' | 'failed' | 'resolved-up' | 'resolved-down' | 'unresolved'

/**
 * Status of a pattern given candles up to and including `last` (all completed).
 * Bullish: confirmed when the next candle is green and closes above the pattern's last close;
 * failed if any of the next 5 candles closes below the pattern's lowest low. Bearish mirrors this.
 * Neutral (indecision) patterns resolve when price closes beyond their high or low.
 */
export function patternStatus(cs: Candle[], hit: PatternHit, last: number): { status: PatternStatus; confirmedThenFailed?: boolean } {
  if (hit.end >= last + 1) return { status: 'developing' }
  if (hit.end === last) return { status: hit.bias === 'neutral' ? 'unresolved' : 'awaiting' }
  const pat = cs.slice(hit.start, hit.end + 1)
  const hi = Math.max(...pat.map((x) => x.high)), lo = Math.min(...pat.map((x) => x.low))
  const endC = cs[hit.end], nx = cs[hit.end + 1]
  const window = cs.slice(hit.end + 1, Math.min(last, hit.end + 5) + 1)
  if (hit.bias === 'neutral') {
    for (const x of window) { if (x.close > hi) return { status: 'resolved-up' }; if (x.close < lo) return { status: 'resolved-down' } }
    return { status: 'unresolved' }
  }
  const confirmed = hit.bias === 'bullish' ? nx.close > nx.open && nx.close > endC.close : nx.close < nx.open && nx.close < endC.close
  const failed = window.some((x) => (hit.bias === 'bullish' ? x.close < lo : x.close > hi))
  if (failed) return { status: 'failed', confirmedThenFailed: confirmed }
  return { status: confirmed ? 'confirmed' : 'not-confirmed' }
}

/** Builds the partially formed candle at fraction f (0–1) of its life: open → first extreme → second extreme → close. */
export function partialCandle(c: Candle, f: number): Candle {
  if (f >= 1) return { ...c }
  const first = c.close >= c.open ? c.low : c.high
  const second = c.close >= c.open ? c.high : c.low
  const pts = [c.open, first, second, c.close]
  const seg = [Math.abs(first - c.open), Math.abs(second - first), Math.abs(c.close - second)]
  const total = seg.reduce((a, b) => a + b, 0) || 1
  let dist = f * total, price = c.open, hi = c.open, lo = c.open
  for (let s = 0; s < 3; s++) {
    if (dist >= seg[s]) { price = pts[s + 1]; dist -= seg[s] }
    else { price = pts[s] + Math.sign(pts[s + 1] - pts[s]) * dist; dist = 0 }
    hi = Math.max(hi, price); lo = Math.min(lo, price)
    if (dist === 0) break
  }
  const round = (x: number) => Math.round(x * 20) / 20
  return { time: c.time, open: c.open, high: round(hi), low: round(lo), close: round(price), volume: Math.round(c.volume * f) }
}
