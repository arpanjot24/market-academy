import { useMemo, useState } from 'react'
import type { SeriesMarker, Time, UTCTimestamp } from 'lightweight-charts'
import PriceChart, { type LineSpec, type PaneSpec, type PriceLineSpec } from '../components/PriceChart'
import { instruments, instrumentById, dailyCandles, intradayCandles } from '../lib/chart/sim'
import { sma, ema, rsi, macd, bollinger, vwap, fibonacci, atr, adx, stochastic, obv } from '../lib/chart/indicators'
import { detectRange } from '../lib/chart/patterns'
import { inr } from '../lib/chart/interpret'
import { indicators, indicatorById } from '../content/indicators'
import { patternName } from '../content/patterns'
import { useStore } from '../lib/store'
import { go } from '../router'
import { Chip, Header, Rich } from '../components/ui'
import { SimNotice } from './Candles'

const COLORS = { blue: '#4f8cff', amber: '#f59e0b', purple: '#a78bfa', pink: '#f472b6', teal: '#2dd4bf', grey: '#94a3b8' }
const lastOf = (s: (number | null)[]) => { for (let i = s.length - 1; i >= 0; i--) if (s[i] !== null) return s[i]!; return null }
const f2 = (x: number | null) => (x === null ? '—' : x.toFixed(2))

export default function TechLabPage({ sel }: { sel?: string }) {
  const { state } = useStore()
  const dark = state.settings.theme === 'dark' || (state.settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  const [ins, setIns] = useState('sim-a')
  const [tf, setTf] = useState<'D' | '5m'>('D')
  const [on, setOn] = useState<Set<string>>(() => new Set(['volume', sel && indicatorById[sel] ? sel : 'sma']))
  const [focus, setFocus] = useState(sel && indicatorById[sel] ? sel : 'sma')
  const [showPatterns, setShowPatterns] = useState(false)

  const cs = useMemo(() => (tf === 'D' ? dailyCandles(ins) : intradayCandles(ins)), [ins, tf])
  const close = useMemo(() => cs.map((c) => c.close), [cs])
  const calc = useMemo(() => ({
    sma20: sma(close, 20), sma50: sma(close, 50), ema20: ema(close, 20),
    rsi: rsi(close), macd: macd(close), bb: bollinger(close),
    vwap: tf === '5m' ? vwap(cs, (t) => String(Math.floor(t / 86400))) : vwap(cs),
    fib: fibonacci(cs), atr: atr(cs), adx: adx(cs), stoch: stochastic(cs), obv: obv(cs), volAvg: sma(cs.map((c) => c.volume), 20),
  }), [cs, close, tf])

  // First tap: show it and explain it. Tapping the explained chip again hides/shows it.
  const toggle = (id: string) => {
    if (focus !== id) { setFocus(id); setOn((s) => new Set(s).add(id)); return }
    setOn((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n })
  }

  const overlays: LineSpec[] = []
  const panes: PaneSpec[] = []
  const priceLines: PriceLineSpec[] = []
  if (on.has('sma')) overlays.push({ key: 'sma20', data: calc.sma20, color: COLORS.blue, width: 1 }, { key: 'sma50', data: calc.sma50, color: COLORS.amber, width: 1 })
  if (on.has('ema')) overlays.push({ key: 'ema20', data: calc.ema20, color: COLORS.pink, width: 1 })
  if (on.has('bollinger')) overlays.push({ key: 'bbu', data: calc.bb.upper, color: COLORS.purple, width: 1 }, { key: 'bbm', data: calc.bb.mid, color: COLORS.purple, width: 1, dashed: true }, { key: 'bbl', data: calc.bb.lower, color: COLORS.purple, width: 1 })
  if (on.has('vwap')) overlays.push({ key: 'vwap', data: calc.vwap, color: COLORS.teal, width: 2 })
  if (on.has('fibonacci')) for (const l of calc.fib.levels) priceLines.push({ price: l.price, color: COLORS.amber, title: `${(l.ratio * 100).toFixed(1)}%`, dashed: l.ratio !== 0 && l.ratio !== 1 })
  if (on.has('rsi')) panes.push({ key: 'rsi', title: 'RSI 14', lines: [{ key: 'rsi', data: calc.rsi, color: COLORS.purple }], levels: [30, 50, 70] })
  if (on.has('macd')) panes.push({ key: 'macd', title: 'MACD', hist: { data: calc.macd.hist }, lines: [{ key: 'm', data: calc.macd.macd, color: COLORS.blue }, { key: 's', data: calc.macd.signal, color: COLORS.amber }], levels: [0] })
  if (on.has('stochastic')) panes.push({ key: 'stoch', title: 'Stoch %K', lines: [{ key: 'k', data: calc.stoch.k, color: COLORS.blue }, { key: 'd', data: calc.stoch.d, color: COLORS.amber }], levels: [20, 80] })
  if (on.has('atr')) panes.push({ key: 'atr', title: 'ATR 14', lines: [{ key: 'atr', data: calc.atr, color: COLORS.teal }] })
  if (on.has('adx')) panes.push({ key: 'adx', title: 'ADX 14', lines: [{ key: 'adx', data: calc.adx.adx, color: COLORS.grey, width: 2 }, { key: 'pdi', data: calc.adx.pdi, color: '#22c55e', width: 1 }, { key: 'mdi', data: calc.adx.mdi, color: '#f05252', width: 1 }], levels: [20, 25] })
  if (on.has('volume')) panes.push({ key: 'obv', title: 'OBV', lines: [{ key: 'obv', data: calc.obv, color: COLORS.blue }] })

  const markers: SeriesMarker<Time>[] = showPatterns
    ? detectRange(cs, 0, cs.length - 1).filter((h) => h.bias !== 'neutral').map((h) => ({
        time: cs[h.end].time as UTCTimestamp, position: h.bias === 'bullish' ? 'belowBar' : 'aboveBar', shape: h.bias === 'bullish' ? 'arrowUp' : 'arrowDown',
        color: h.bias === 'bullish' ? '#22c55e' : '#f05252', text: patternName(h.id),
      } as SeriesMarker<Time>))
    : []

  const info = indicatorById[focus]
  const c = cs[cs.length - 1]
  const reading = (): string[] => {
    switch (focus) {
      case 'sma': { const a = lastOf(calc.sma20), b = lastOf(calc.sma50); return [`SMA 20 = ${inr(a!)}, SMA 50 = ${inr(b!)}. Close ${inr(c.close)} is ${c.close > a! ? 'above' : 'below'} SMA 20 and ${c.close > b! ? 'above' : 'below'} SMA 50.`, a! > b! ? 'SMA 20 is above SMA 50: short-term trend stronger than medium-term (bullish alignment).' : 'SMA 20 is below SMA 50: short-term trend weaker (bearish alignment).'] }
      case 'ema': { const e = lastOf(calc.ema20)!, s = lastOf(calc.sma20)!; return [`EMA 20 = ${inr(e)} vs SMA 20 = ${inr(s)}.`, e > s ? 'EMA above SMA: recent prices are higher than older ones in the window — momentum has been rising lately.' : 'EMA below SMA: recent prices are lower than older ones in the window — momentum has been fading lately.'] }
      case 'rsi': { const v = lastOf(calc.rsi)!; return [`RSI = ${v.toFixed(1)}.`, v >= 70 ? 'Overbought zone: strong recent buying. In a strong uptrend it can stay here — not a sell signal alone.' : v <= 30 ? 'Oversold zone: strong recent selling. In a strong downtrend it can stay here — not a buy signal alone.' : v >= 50 ? 'Between 50 and 70: momentum leans bullish.' : 'Between 30 and 50: momentum leans bearish.'] }
      case 'macd': { const m = lastOf(calc.macd.macd)!, s = lastOf(calc.macd.signal)!, h = lastOf(calc.macd.hist)!; const hp = calc.macd.hist[calc.macd.hist.length - 2] ?? h; return [`MACD ${f2(m)}, signal ${f2(s)}, histogram ${f2(h)}.`, `${m > 0 ? 'Above zero: fast EMA above slow EMA (bullish bias).' : 'Below zero: fast EMA below slow EMA (bearish bias).'} ${m > s ? 'MACD above signal' : 'MACD below signal'}; histogram ${Math.abs(h) > Math.abs(hp) ? 'expanding' : 'shrinking'} — momentum ${Math.abs(h) > Math.abs(hp) ? 'strengthening' : 'weakening'}.`] }
      case 'bollinger': { const u = lastOf(calc.bb.upper)!, l = lastOf(calc.bb.lower)!, m = lastOf(calc.bb.mid)!; const pos = (c.close - l) / (u - l); return [`Bands: ${inr(l)} – ${inr(u)} (width ${(((u - l) / m) * 100).toFixed(1)}% of price).`, `Close sits ${(pos * 100).toFixed(0)}% of the way from the lower to the upper band${pos > 0.9 ? ' — pressing the upper band' : pos < 0.1 ? ' — pressing the lower band' : ''}.`] }
      case 'vwap': { const v = lastOf(calc.vwap)!; return [`${tf === '5m' ? 'Session VWAP' : 'Anchored VWAP (from the first candle)'} = ${inr(v)}.`, `Close is ${c.close > v ? 'above' : 'below'} VWAP: ${c.close > v ? 'buyers have paid more than the volume-weighted average' : 'price is below where most volume traded'}.`, tf === 'D' ? 'Switch to 5-minute to see the standard intraday VWAP that resets each session.' : 'Notice it resets at each session’s open.'] }
      case 'fibonacci': { const fb = calc.fib; return [`Swing ${fb.upSwing ? 'up' : 'down'} from ${inr(fb.upSwing ? fb.low : fb.high)} to ${inr(fb.upSwing ? fb.high : fb.low)} (largest swing in the last 120 candles).`, `50% level ${inr(fb.levels[3].price)}, 61.8% level ${inr(fb.levels[4].price)}. Close ${inr(c.close)}.`] }
      case 'atr': { const a = lastOf(calc.atr)!; return [`ATR = ${inr(a)} (${((a / c.close) * 100).toFixed(2)}% of price).`, `A stop-loss 2 × ATR from the close would be about ${inr(c.close - 2 * a)} for a long position.`] }
      case 'adx': { const a = lastOf(calc.adx.adx)!, p = lastOf(calc.adx.pdi)!, m = lastOf(calc.adx.mdi)!; return [`ADX ${a.toFixed(1)}, +DI ${p.toFixed(1)}, −DI ${m.toFixed(1)}.`, `${a >= 25 ? 'A trend is present' : a < 20 ? 'Weak or no trend (range-bound behaviour)' : 'A trend may be forming'}; ${p > m ? 'buyers' : 'sellers'} are the stronger side.`] }
      case 'stochastic': { const k = lastOf(calc.stoch.k)!, d = lastOf(calc.stoch.d)!; return [`%K ${k.toFixed(1)}, %D ${d.toFixed(1)}.`, k >= 80 ? 'Close near the top of its 14-candle range (overbought zone).' : k <= 20 ? 'Close near the bottom of its 14-candle range (oversold zone).' : 'Mid-range.', k > d ? '%K above %D: short-term momentum turning up.' : '%K below %D: short-term momentum turning down.'] }
      case 'volume': { const va = lastOf(calc.volAvg)!; return [`Last volume ${c.volume.toLocaleString('en-IN')} = ${(c.volume / va).toFixed(2)}× its 20-candle average.`, `OBV is ${calc.obv[calc.obv.length - 1]! > calc.obv[Math.max(0, calc.obv.length - 21)]! ? 'higher' : 'lower'} than 20 candles ago — volume has favoured ${calc.obv[calc.obv.length - 1]! > calc.obv[Math.max(0, calc.obv.length - 21)]! ? 'up' : 'down'} days.`] }
    }
    return []
  }

  return (
    <div>
      <Header title="Technical Analysis Lab" subtitle="Toggle indicators and read them" back="/charts" />
      <SimNotice />
      <div className="mb-2 grid grid-cols-[1fr_auto] gap-2">
        <select value={ins} onChange={(e) => setIns(e.target.value)} className="h-11 rounded-xl border border-line bg-card px-3 text-fg">
          {instruments.map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
        </select>
        <div className="grid grid-cols-2 rounded-xl border border-line bg-card p-1">
          {(['D', '5m'] as const).map((x) => <button key={x} onClick={() => setTf(x)} className={`rounded-lg px-3 text-sm font-semibold ${tf === x ? 'bg-accent text-white' : 'text-muted'}`}>{x === 'D' ? 'Daily' : '5-min'}</button>)}
        </div>
      </div>
      <p className="mb-2 text-xs text-muted">{instrumentById[ins].description}. {tf === 'D' ? '300 daily candles.' : '5 sessions of 5-minute candles (9:15–15:30).'}</p>
      <div className="-mx-4 mb-2 flex gap-1.5 overflow-x-auto px-4 pb-1">
        {indicators.map((i) => (
          <button key={i.id} onClick={() => toggle(i.id)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${on.has(i.id) ? 'border-accent bg-accent text-white' : 'border-line bg-card text-muted'} ${focus === i.id ? 'ring-2 ring-accent/50' : ''}`}>{i.short}</button>
        ))}
        <button onClick={() => setShowPatterns(!showPatterns)} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${showPatterns ? 'border-warn bg-warn text-black' : 'border-line bg-card text-muted'}`}>Patterns</button>
      </div>

      <PriceChart candles={cs} dark={dark} viewKey={`${ins}-${tf}`} overlays={overlays} panes={panes} priceLines={priceLines} markers={markers} timeVisible={tf === '5m'} showVolume={on.has('volume')} mainHeight={300} />

      <section className="mt-3 rounded-2xl border border-line bg-card p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="text-base font-bold">{info.name}</h2>
          <Chip tone={on.has(focus) ? 'up' : 'muted'}>{on.has(focus) ? 'on chart' : 'hidden'}</Chip>
        </div>
        <div className="mb-3 rounded-xl border border-accent/40 bg-accent/10 p-3 text-sm">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Reading on the latest candle</div>
          {reading().map((x, i) => <p key={i} className="leading-relaxed"><Rich text={x} /></p>)}
        </div>
        <dl className="grid gap-3 text-sm leading-relaxed">
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">What it measures</dt><dd>{info.measures}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">How it is calculated</dt><dd>{info.calculation}</dd><dd className="mt-1 rounded-lg bg-card2 px-2 py-1.5 font-mono text-xs">{info.formula}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">What the values mean</dt><dd><ul className="list-disc pl-5">{info.values.map((v) => <li key={v}>{v}</li>)}</ul></dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-muted">Practical example</dt><dd className="divide-y divide-line">{info.example.map(([k, v]) => <div key={k} className="grid grid-cols-2 gap-2 py-1"><span className="text-muted">{k}</span><span className="tabular">{v}</span></div>)}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-up">When it is useful</dt><dd>{info.useful}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-warn">Limitations</dt><dd>{info.limitations}</dd></div>
          <div><dt className="text-xs font-semibold uppercase tracking-wide text-down">Common mistakes</dt><dd>{info.mistakes}</dd></div>
        </dl>
        <button onClick={() => go('/learn/m5')} className="mt-3 w-full rounded-xl border border-line bg-card2 py-2.5 text-sm font-semibold">Study indicators in Module 5 →</button>
      </section>
      <p className="mt-3 text-center text-xs text-muted">Tap a chip to show it and read its explanation; tap it again to hide it. No indicator predicts the future.</p>
    </div>
  )
}
