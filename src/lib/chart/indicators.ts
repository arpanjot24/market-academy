// Technical indicator calculations. Every output array is aligned with the input candles;
// positions without enough history are null.
import type { Candle, Series } from './types'

export function sma(v: number[], n: number): Series {
  const out: Series = new Array(v.length).fill(null)
  let sum = 0
  for (let i = 0; i < v.length; i++) {
    sum += v[i]
    if (i >= n) sum -= v[i - n]
    if (i >= n - 1) out[i] = sum / n
  }
  return out
}

export function ema(v: number[], n: number): Series {
  const out: Series = new Array(v.length).fill(null)
  if (v.length < n) return out
  const k = 2 / (n + 1)
  let e = v.slice(0, n).reduce((a, b) => a + b, 0) / n
  out[n - 1] = e
  for (let i = n; i < v.length; i++) { e = v[i] * k + e * (1 - k); out[i] = e }
  return out
}

/** EMA over a series that starts with nulls. */
function emaSeries(s: Series, n: number): Series {
  const start = s.findIndex((x) => x !== null)
  const out: Series = new Array(s.length).fill(null)
  if (start < 0) return out
  const part = ema(s.slice(start) as number[], n)
  part.forEach((x, i) => { out[start + i] = x })
  return out
}

function smaSeries(s: Series, n: number): Series {
  const start = s.findIndex((x) => x !== null)
  const out: Series = new Array(s.length).fill(null)
  if (start < 0) return out
  sma(s.slice(start) as number[], n).forEach((x, i) => { out[start + i] = x })
  return out
}

/** RSI with Wilder smoothing. */
export function rsi(close: number[], n = 14): Series {
  const out: Series = new Array(close.length).fill(null)
  if (close.length <= n) return out
  let gain = 0, loss = 0
  for (let i = 1; i <= n; i++) {
    const d = close[i] - close[i - 1]
    if (d > 0) gain += d; else loss -= d
  }
  gain /= n; loss /= n
  const val = () => (loss === 0 ? (gain === 0 ? 50 : 100) : 100 - 100 / (1 + gain / loss))
  out[n] = val()
  for (let i = n + 1; i < close.length; i++) {
    const d = close[i] - close[i - 1]
    gain = (gain * (n - 1) + Math.max(d, 0)) / n
    loss = (loss * (n - 1) + Math.max(-d, 0)) / n
    out[i] = val()
  }
  return out
}

export function macd(close: number[], fast = 12, slow = 26, signal = 9) {
  const f = ema(close, fast), s = ema(close, slow)
  const line: Series = close.map((_, i) => (f[i] !== null && s[i] !== null ? f[i]! - s[i]! : null))
  const sig = emaSeries(line, signal)
  const hist: Series = line.map((x, i) => (x !== null && sig[i] !== null ? x - sig[i]! : null))
  return { macd: line, signal: sig, hist }
}

export function bollinger(close: number[], n = 20, k = 2) {
  const mid = sma(close, n)
  const upper: Series = new Array(close.length).fill(null)
  const lower: Series = new Array(close.length).fill(null)
  for (let i = n - 1; i < close.length; i++) {
    const m = mid[i]!
    let v = 0
    for (let j = i - n + 1; j <= i; j++) v += (close[j] - m) ** 2
    const sd = Math.sqrt(v / n)
    upper[i] = m + k * sd; lower[i] = m - k * sd
  }
  return { mid, upper, lower }
}

export function trueRange(c: Candle[]): number[] {
  return c.map((x, i) => (i === 0 ? x.high - x.low : Math.max(x.high - x.low, Math.abs(x.high - c[i - 1].close), Math.abs(x.low - c[i - 1].close))))
}

/** Average True Range with Wilder smoothing. */
export function atr(c: Candle[], n = 14): Series {
  const tr = trueRange(c)
  const out: Series = new Array(c.length).fill(null)
  if (c.length < n) return out
  let a = tr.slice(0, n).reduce((x, y) => x + y, 0) / n
  out[n - 1] = a
  for (let i = n; i < c.length; i++) { a = (a * (n - 1) + tr[i]) / n; out[i] = a }
  return out
}

/** ADX with +DI and −DI (Wilder). */
export function adx(c: Candle[], n = 14) {
  const len = c.length
  const adxOut: Series = new Array(len).fill(null)
  const pdi: Series = new Array(len).fill(null)
  const mdi: Series = new Array(len).fill(null)
  if (len < 2 * n + 1) return { adx: adxOut, pdi, mdi }
  const tr = trueRange(c)
  let sTR = 0, sP = 0, sM = 0
  const dx: number[] = []
  for (let i = 1; i < len; i++) {
    const up = c[i].high - c[i - 1].high
    const down = c[i - 1].low - c[i].low
    const pDM = up > down && up > 0 ? up : 0
    const mDM = down > up && down > 0 ? down : 0
    if (i <= n) { sTR += tr[i]; sP += pDM; sM += mDM; if (i < n) continue }
    else { sTR = sTR - sTR / n + tr[i]; sP = sP - sP / n + pDM; sM = sM - sM / n + mDM }
    const p = sTR ? (100 * sP) / sTR : 0
    const m = sTR ? (100 * sM) / sTR : 0
    pdi[i] = p; mdi[i] = m
    dx.push(p + m ? (100 * Math.abs(p - m)) / (p + m) : 0)
    if (dx.length === n) adxOut[i] = dx.reduce((a, b) => a + b, 0) / n
    else if (dx.length > n) adxOut[i] = (adxOut[i - 1]! * (n - 1) + dx[dx.length - 1]) / n
  }
  return { adx: adxOut, pdi, mdi }
}

/** Slow stochastic: %K smoothed over `smooth` periods, %D = SMA of %K. */
export function stochastic(c: Candle[], k = 14, d = 3, smooth = 3) {
  const raw: Series = new Array(c.length).fill(null)
  for (let i = k - 1; i < c.length; i++) {
    let hh = -Infinity, ll = Infinity
    for (let j = i - k + 1; j <= i; j++) { hh = Math.max(hh, c[j].high); ll = Math.min(ll, c[j].low) }
    raw[i] = hh === ll ? 50 : (100 * (c[i].close - ll)) / (hh - ll)
  }
  const kLine = smaSeries(raw, smooth)
  return { k: kLine, d: smaSeries(kLine, d) }
}

/** VWAP. With `sessionOf`, it resets each session; otherwise it is anchored at the first candle. */
export function vwap(c: Candle[], sessionOf?: (t: number) => string): Series {
  let pv = 0, vol = 0, key = ''
  return c.map((x) => {
    if (sessionOf) { const k = sessionOf(x.time); if (k !== key) { key = k; pv = 0; vol = 0 } }
    pv += ((x.high + x.low + x.close) / 3) * x.volume
    vol += x.volume
    return vol ? pv / vol : null
  })
}

export function obv(c: Candle[]): Series {
  let v = 0
  return c.map((x, i) => {
    if (i > 0) v += x.close > c[i - 1].close ? x.volume : x.close < c[i - 1].close ? -x.volume : 0
    return v
  })
}

export const FIB_RATIOS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1]

/** Fibonacci retracement of the largest swing in the last `lookback` candles. */
export function fibonacci(c: Candle[], lookback = 120) {
  const from = Math.max(0, c.length - lookback)
  let hi = from, lo = from
  for (let i = from; i < c.length; i++) {
    if (c[i].high > c[hi].high) hi = i
    if (c[i].low < c[lo].low) lo = i
  }
  const high = c[hi].high, low = c[lo].low, upSwing = lo < hi
  const levels = FIB_RATIOS.map((r) => ({ ratio: r, price: upSwing ? high - r * (high - low) : low + r * (high - low) }))
  return { high, low, highIndex: hi, lowIndex: lo, upSwing, levels }
}
