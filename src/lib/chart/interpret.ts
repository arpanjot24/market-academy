// Turns candles into plain-language explanations for the Live Candle Interpreter.
// Everything here describes possibilities, never certainties.
import type { Candle } from './types'
import { atr, sma } from './indicators'
import { body, range, upperWick, lowerWick, shapeName, detectAt, patternStatus, type PatternHit, type PatternStatus } from './patterns'

export const inr = (x: number) => '₹' + x.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pctStr = (x: number) => `${x >= 0 ? '+' : ''}${(x * 100).toFixed(2)}%`

export interface PatternReading { hit: PatternHit; status: PatternStatus; confirmedThenFailed?: boolean; candlesAgo: number }
export interface Level { price: number; touches: number }
export interface Interpretation {
  last: Candle
  lastLines: string[]
  developingLines: string[]
  patterns: PatternReading[]
  pressure: string[]
  volume: string[]
  support?: Level
  resistance?: Level
  levelLines: string[]
  trendLines: string[]
  bullish: string[]
  bearish: string[]
  confirm: string[]
}

export function describeCandle(c: Candle, prevClose: number | undefined, avgVol: number): string[] {
  const r = range(c) || 1
  const dir = c.close > c.open ? '**Bullish (green)**' : c.close < c.open ? '**Bearish (red)**' : '**Neutral**'
  const lines = [
    `${dir} candle: opened ${inr(c.open)}, closed ${inr(c.close)}${prevClose ? ` (${pctStr(c.close / prevClose - 1)} vs previous close)` : ''}.`,
    `Range ${inr(c.low)} – ${inr(c.high)}. Body is ${Math.round((body(c) / r) * 100)}% of the range; upper wick ${Math.round((upperWick(c) / r) * 100)}%, lower wick ${Math.round((lowerWick(c) / r) * 100)}%.`,
  ]
  const sh = shapeName(c)
  if (sh) lines.push(`Shape: **${sh}**.`)
  if (upperWick(c) > 0.5 * r) lines.push('The long upper wick shows buyers pushed higher but sellers drove price back down.')
  if (lowerWick(c) > 0.5 * r) lines.push('The long lower wick shows sellers pushed lower but buyers drove price back up.')
  if (avgVol > 0) lines.push(`Volume ${(c.volume / avgVol).toFixed(1)}× its 20-candle average.`)
  return lines
}

function pressureLines(c: Candle): string[] {
  const r = range(c)
  if (!r) return ['No range — no information about pressure.']
  const clv = (c.close - c.low) / r
  if (clv >= 0.7) return [`Closed in the top ${Math.round((1 - clv) * 100 + 0.5)}% of its range: **buyers were in control at the close**.`]
  if (clv <= 0.3) return [`Closed in the bottom ${Math.round(clv * 100 + 0.5)}% of its range: **sellers were in control at the close**.`]
  return ['Closed near the middle of its range: **buyers and sellers were roughly balanced**.']
}

function findLevels(cs: Candle[], last: number, a: number): { supports: Level[]; resistances: Level[] } {
  const w = 3, from = Math.max(w, last - 150), piv: { price: number; kind: 'h' | 'l' }[] = []
  for (let k = from; k <= last - w; k++) {
    let isH = true, isL = true
    for (let j = k - w; j <= k + w; j++) {
      if (j === k) continue
      if (cs[j].high >= cs[k].high) isH = false
      if (cs[j].low <= cs[k].low) isL = false
    }
    if (isH) piv.push({ price: cs[k].high, kind: 'h' })
    if (isL) piv.push({ price: cs[k].low, kind: 'l' })
  }
  const clusters: Level[] = []
  for (const p of piv.sort((x, y) => x.price - y.price)) {
    const cl = clusters[clusters.length - 1]
    if (cl && p.price - cl.price <= 0.6 * a) { cl.price = (cl.price * cl.touches + p.price) / (cl.touches + 1); cl.touches++ }
    else clusters.push({ price: p.price, touches: 1 })
  }
  const close = cs[last].close
  return {
    supports: clusters.filter((l) => l.price < close).sort((x, y) => y.price - x.price),
    resistances: clusters.filter((l) => l.price > close).sort((x, y) => x.price - y.price),
  }
}

export function interpret(cs: Candle[], last: number, developing: Candle | null, name: (id: string) => string): Interpretation {
  const c = cs[last]
  const closes = cs.slice(0, last + 1).map((x) => x.close)
  const vols = cs.slice(0, last + 1).map((x) => x.volume)
  const vAvg = sma(vols, 20)[last] ?? vols.reduce((a, b) => a + b, 0) / vols.length
  const a = atr(cs.slice(0, last + 1))[last] ?? range(c)
  const s20 = sma(closes, 20), s50 = sma(closes, 50)

  // Patterns among recently completed candles, with their status
  const patterns: PatternReading[] = []
  for (let k = Math.max(0, last - 6); k <= last; k++) {
    for (const hit of detectAt(cs.slice(0, last + 1), k)) {
      const st = patternStatus(cs, hit, last)
      patterns.push({ hit, status: st.status, confirmedThenFailed: st.confirmedThenFailed, candlesAgo: last - k })
    }
  }
  // Patterns that WOULD form if the developing candle closed as it is now
  if (developing) {
    const seq = [...cs.slice(0, last + 1), developing]
    for (const hit of detectAt(seq, seq.length - 1)) patterns.push({ hit, status: 'developing', candlesAgo: -1 })
  }
  patterns.sort((x, y) => x.candlesAgo - y.candlesAgo)

  const lastLines = describeCandle(c, cs[last - 1]?.close, vAvg)
  const developingLines = developing
    ? [
        '**This candle is not finished.** Its open is fixed, but its high, low and close can still change — so no pattern involving it can be confirmed yet.',
        `So far: open ${inr(developing.open)}, high ${inr(developing.high)}, low ${inr(developing.low)}, current ${inr(developing.close)} (${pctStr(developing.close / c.close - 1)} vs last close).`,
        developing.close > developing.open ? 'Currently trading above its open: buyers have the upper hand so far.' : developing.close < developing.open ? 'Currently trading below its open: sellers have the upper hand so far.' : 'Trading at its open: no side in control yet.',
        `Volume so far: ${(developing.volume / vAvg).toFixed(1)}× a full candle’s average.`,
      ]
    : ['The next candle has not opened yet.']

  const vr = c.volume / vAvg
  const up = c.close >= (cs[last - 1]?.close ?? c.open)
  const volume = [
    vr >= 1.5 ? `High volume (${vr.toFixed(1)}× average): many participants backed this ${up ? 'rise' : 'fall'} — the move carries more conviction.`
      : vr <= 0.7 ? `Low volume (${vr.toFixed(1)}× average): few participants — treat this ${up ? 'rise' : 'fall'} with caution.`
        : `Normal volume (${vr.toFixed(1)}× average): no strong signal from participation.`,
  ]

  const { supports, resistances } = findLevels(cs, last, a)
  const support = supports[0], resistance = resistances[0]
  const levelLines: string[] = []
  if (resistance) levelLines.push(`Nearest resistance ≈ **${inr(resistance.price)}** (${pctStr(resistance.price / c.close - 1)}), where earlier rallies stalled ${resistance.touches > 1 ? `${resistance.touches} times` : 'once'}.`)
  else levelLines.push('No resistance from earlier swing highs above the current price — price is at or near the top of its recent history.')
  if (support) levelLines.push(`Nearest support ≈ **${inr(support.price)}** (${pctStr(support.price / c.close - 1)}), where earlier declines stopped ${support.touches > 1 ? `${support.touches} times` : 'once'}.`)
  else levelLines.push('No support from earlier swing lows below the current price — price is at or near the bottom of its recent history.')
  levelLines.push(`Typical candle range (ATR 14) is ${inr(a)}, so levels within about one ATR are “nearby”.`)

  const trendLines: string[] = []
  const bullish: string[] = [], bearish: string[] = [], confirm: string[] = []
  if (s20[last] !== null) {
    const slope = s20[last]! - (s20[last - 5] ?? s20[last]!)
    trendLines.push(`Price is ${c.close > s20[last]! ? 'above' : 'below'} its 20-candle average (${inr(s20[last]!)}), which is ${slope > 0.1 * a ? 'rising' : slope < -0.1 * a ? 'falling' : 'flat'}.`)
    if (c.close > s20[last]! && slope > 0) bullish.push('Short-term trend is up: price above a rising 20-candle average.')
    if (c.close < s20[last]! && slope < 0) bearish.push('Short-term trend is down: price below a falling 20-candle average.')
  }
  if (s50[last] !== null) {
    trendLines.push(`Price is ${c.close > s50[last]! ? 'above' : 'below'} its 50-candle average (${inr(s50[last]!)}).`)
    ;(c.close > s50[last]! ? bullish : bearish).push(`Medium-term: price is ${c.close > s50[last]! ? 'above' : 'below'} the 50-candle average.`)
  }

  for (const pr of patterns) {
    const nm = name(pr.hit.id)
    const pat = cs.slice(pr.hit.start, Math.min(pr.hit.end, last) + 1)
    const hi = Math.max(...pat.map((x) => x.high)), lo = Math.min(...pat.map((x) => x.low))
    if (pr.status === 'confirmed') (pr.hit.bias === 'bullish' ? bullish : bearish).push(`A ${nm} ${pr.candlesAgo} candle${pr.candlesAgo === 1 ? '' : 's'} ago was confirmed by the next candle.`)
    if (pr.status === 'failed') (pr.hit.bias === 'bullish' ? bearish : bullish).push(`A ${nm} failed — price closed beyond its ${pr.hit.bias === 'bullish' ? 'low' : 'high'}. Failed signals often lead to moves the other way.`)
    if (pr.status === 'awaiting') {
      (pr.hit.bias === 'bullish' ? bullish : bearish).push(`The last candle completed a ${nm} — a possible ${pr.hit.bias} signal, not yet confirmed.`)
      confirm.push(pr.hit.bias === 'bullish'
        ? `For the ${nm}: the next candle should close green and above ${inr(cs[pr.hit.end].close)}. A close below ${inr(lo)} would mean it failed.`
        : `For the ${nm}: the next candle should close red and below ${inr(cs[pr.hit.end].close)}. A close above ${inr(hi)} would mean it failed.`)
    }
    if (pr.status === 'unresolved' && pr.candlesAgo <= 1) confirm.push(`The ${nm} shows indecision. A close above ${inr(hi)} or below ${inr(lo)} would show which side won.`)
    if (pr.status === 'developing') confirm.push(`A ${nm} may be forming in the developing candle. Wait for the candle to close — it is **not** a pattern until then.`)
  }
  if (vr >= 1.5) (up ? bullish : bearish).push(`High volume supported the last ${up ? 'rise' : 'fall'}.`)
  if (support && (c.close - support.price) <= a) bullish.push(`Price is within one ATR of support at ${inr(support.price)}, where buyers appeared before.`)
  if (resistance && (resistance.price - c.close) <= a) bearish.push(`Price is within one ATR of resistance at ${inr(resistance.price)}, where sellers appeared before.`)
  if (resistance) confirm.push(`A close above resistance ${inr(resistance.price)} on above-average volume would be a bullish breakout signal.`)
  if (support) confirm.push(`A close below support ${inr(support.price)} on above-average volume would be a bearish breakdown signal.`)
  if (!bullish.length) bullish.push('No clear bullish evidence right now.')
  if (!bearish.length) bearish.push('No clear bearish evidence right now.')

  return { last: c, lastLines, developingLines, patterns, pressure: pressureLines(c), volume, support, resistance, levelLines, trendLines, bullish, bearish, confirm }
}
