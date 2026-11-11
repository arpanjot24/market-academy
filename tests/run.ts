// Run with: node tests/run.ts   (Node 23.6+ strips TypeScript types natively)
import { sma, ema, rsi, macd, bollinger, atr, adx, stochastic, vwap, obv, fibonacci } from '../src/lib/chart/indicators.ts'
import { detectAt, patternStatus, partialCandle, trendBefore, shapeName } from '../src/lib/chart/patterns.ts'
import { illustrations } from '../src/lib/chart/illustrations.ts'
import { dailyCandles, intradayCandles, instruments } from '../src/lib/chart/sim.ts'
import type { Candle } from '../src/lib/chart/types.ts'
import { computeRatios } from '../src/lib/fundamentals.ts'
import { charges, taxEstimate } from '../src/lib/sim/charges.ts'
import { newAccount, placeOrder, validateOrder, advanceDay, executeBuy, executeSell, setStopTarget, updateManualPrice, metrics, maxDrawdown, positionSize } from '../src/lib/sim/engine.ts'

let pass = 0, fail = 0
const ok = (cond: boolean, name: string, extra = '') => { if (cond) pass++; else { fail++; console.log('FAIL', name, extra) } }
const near = (a: number | null, b: number, eps = 1e-6) => a !== null && Math.abs(a - b) < eps
const mk = (o: number, h: number, l: number, c: number, v = 1000, t = 0): Candle => ({ time: t, open: o, high: h, low: l, close: c, volume: v })

// ---------- Indicators ----------
ok(near(sma([1, 2, 3, 4, 5], 3)[4], 4) && sma([1, 2, 3], 3)[1] === null, 'SMA')
const e = ema([1, 2, 3, 4, 5, 6], 3) // seed 2, k=0.5 → 3, 4, 5
ok(near(e[2], 2) && near(e[3], 3) && near(e[5], 5), 'EMA', JSON.stringify(e))
ok(near(rsi([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], 14)[15], 100), 'RSI all gains = 100')
ok(near(rsi([16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 14)[15], 0), 'RSI all losses = 0')
// Alternating +1/-1: first RSI (equal average gain and loss) is exactly 50
ok(near(rsi(Array.from({ length: 30 }, (_, i) => 10 + (i % 2)), 14)[14], 50), 'RSI equal gains/losses = 50')
const flat = Array(40).fill(100)
const m = macd(flat)
ok(near(m.macd[39], 0) && near(m.signal[39], 0) && near(m.hist[39], 0), 'MACD flat = 0')
ok(m.signal[33] !== null && m.signal[32] === null, 'MACD signal starts at index 33')
const bb = bollinger(flat)
ok(near(bb.upper[39], 100) && near(bb.lower[39], 100), 'Bollinger flat bands collapse')
const bb2 = bollinger([2, 4, 4, 4, 5, 5, 7, 9], 8, 2) // mean 5, population sd 2
ok(near(bb2.upper[7], 9) && near(bb2.lower[7], 1), 'Bollinger known sd')
const constRange = Array.from({ length: 30 }, (_, i) => mk(100, 102, 98, 100, 1000, i))
ok(near(atr(constRange)[29], 4), 'ATR constant range = 4')
const up = Array.from({ length: 60 }, (_, i) => mk(100 + i, 101.5 + i, 99.5 + i, 101 + i, 1000, i))
const ax = adx(up)
ok((ax.adx[59] ?? 0) > 50 && (ax.pdi[59] ?? 0) > (ax.mdi[59] ?? 0), 'ADX strong uptrend', JSON.stringify([ax.adx[59], ax.pdi[59], ax.mdi[59]]))
ok(ax.adx[27] !== null && ax.adx[26] === null, 'ADX first value at 2n-1 (index 27)')
const st = stochastic(up)
// Each candle: close = high - 0.5, 14-candle range = 15.5 + ... → raw %K = (160-145.5)/(160.5-145.5)*100 = 96.67
ok(near(st.k[59], ((160 - 145.5) / (160.5 - 145.5)) * 100) && (st.d[59] ?? 0) > 90, 'Stochastic %K known value', String(st.k[59]))
const vw = vwap([mk(10, 12, 8, 10, 100), mk(10, 15, 9, 12, 300)])
ok(near(vw[1], (10 * 100 + 12 * 300) / 400), 'VWAP weighted typical price')
const vw2 = vwap([mk(10, 12, 8, 10, 100, 0), mk(20, 22, 18, 20, 100, 86400)], (t) => String(Math.floor(t / 86400)))
ok(near(vw2[1], 20), 'VWAP resets each session')
ok(obv([mk(1, 1, 1, 10, 5), mk(1, 1, 1, 11, 7), mk(1, 1, 1, 9, 3)])[2] === 4, 'OBV')
const fb = fibonacci([mk(100, 101, 99, 100), mk(100, 121, 100, 120)])
ok(fb.upSwing && near(fb.levels.find((l) => l.ratio === 0.5)!.price, 110), 'Fibonacci 50% of 99→121 swing')

// ---------- Patterns: every textbook illustration must be recognised ----------
function trendRun(dir: 'up' | 'down' | 'side'): Candle[] {
  return Array.from({ length: 10 }, (_, k) => {
    if (dir === 'down') { const o = 101 + 3 * (10 - k); return mk(o, o + 0.5, o - 3.5, o - 3) }
    if (dir === 'up') { const o = 99 - 3 * (10 - k); return mk(o, o + 3.5, o - 0.5, o + 3) }
    const o = 100 + (k % 2 ? 0.5 : -0.5); return mk(o, o + 1, o - 1.5, o + (k % 2 ? -0.6 : 0.6))
  })
}
for (const [id, ill] of Object.entries(illustrations)) {
  const seq = [...trendRun(ill.trend), ...ill.pat.map(([o, h, l, c]) => mk(o, h, l, c))]
  const ids = detectAt(seq, seq.length - 1).map((h) => h.id)
  ok(ids.includes(id), `pattern ${id} recognised`, `got [${ids}] trend=${trendBefore(seq, seq.length - ill.pat.length)}`)
}
// Context matters: a hammer shape after an UPTREND is a hanging man, not a hammer.
{
  const seq = [...trendRun('up'), mk(98.5, 100.5, 94, 100.2)]
  const ids = detectAt(seq, seq.length - 1).map((h) => h.id)
  ok(!ids.includes('hammer') && ids.includes('hanging-man'), 'hammer shape in uptrend = hanging man', String(ids))
}
// Bullish engulfing must NOT be reported in an uptrend
{
  const seq = [...trendRun('up'), mk(101, 101.5, 98.5, 99), mk(98.6, 103, 98.2, 102.5)]
  ok(!detectAt(seq, seq.length - 1).some((h) => h.id === 'bullish-engulfing'), 'no bullish engulfing in uptrend')
}

// ---------- Pattern status: developing / awaiting / confirmed / not confirmed / failed ----------
{
  const base = [...trendRun('down'), mk(98.5, 100.5, 94, 100.2)]
  const hit = detectAt(base, base.length - 1).find((h) => h.id === 'hammer')!
  ok(patternStatus(base, hit, base.length - 2).status === 'developing', 'status developing when hammer candle incomplete')
  ok(patternStatus(base, hit, base.length - 1).status === 'awaiting', 'status awaiting confirmation')
  const conf = [...base, mk(100.3, 104, 100, 103.5)]
  ok(patternStatus(conf, hit, conf.length - 1).status === 'confirmed', 'status confirmed')
  const notc = [...base, mk(100.3, 100.8, 98, 99)]
  ok(patternStatus(notc, hit, notc.length - 1).status === 'not-confirmed', 'status not confirmed')
  const failed = [...base, mk(100.3, 104, 100, 103.5), mk(103, 103.2, 92, 93)]
  const s = patternStatus(failed, hit, failed.length - 1)
  ok(s.status === 'failed' && s.confirmedThenFailed === true, 'status failed after confirmation')
}

// ---------- Developing candle ----------
{
  const c = mk(100, 110, 95, 108)
  const p0 = partialCandle(c, 0), p1 = partialCandle(c, 1), ph = partialCandle(c, 0.5)
  ok(p0.high === 100 && p0.low === 100 && p0.close === 100, 'partial at 0 = open only')
  ok(p1.close === 108 && p1.high === 110 && p1.low === 95, 'partial at 1 = full candle')
  ok(ph.low === 95 && ph.high < 110 && ph.high >= ph.close, 'partial at 0.5 bounded', JSON.stringify(ph))
}

// ---------- Candle-builder presets must show the shape they are named after ----------
{
  const s = (o: number, h: number, l: number, c: number) => shapeName(mk(o, h, l, c)) ?? ''
  ok(s(100, 106, 94, 100.2) === 'doji', 'preset doji')
  ok(s(101, 105.5, 92, 104.5).startsWith('hammer'), 'preset hammer', s(101, 105.5, 92, 104.5))
  ok(s(98.5, 108, 95.5, 95.5).startsWith('inverted'), 'preset shooting star shape', s(98.5, 108, 95.5, 95.5))
  ok(s(94, 106.2, 93.8, 106).startsWith('marubozu'), 'preset marubozu')
  ok(s(99, 106, 93, 101) === 'spinning top', 'preset spinning top')
}

// ---------- Fundamental ratios (worksheet) ----------
{
  const r = Object.fromEntries(computeRatios({ revenue: 1100, revenuePrev: 1000, ebitda: 220, ebit: 170, interest: 34, netProfit: 105, netProfitPrev: 100, equity: 700, debt: 300, cash: 100, cfo: 150, capex: 60, shares: 10, price: 210, dps: 4.2, promoter: 55, pledged: 0 }).map((x) => [x.key, x]))
  ok(near(r.revG.value, 0.1) && near(r.profG.value, 0.05), 'growth ratios')
  ok(near(r.roe.value, 0.15) && near(r.roce.value, 0.17) && near(r.de.value, 3 / 7) && near(r.cover.value, 5), 'returns, leverage, coverage')
  ok(near(r.fcf.value, 90) && near(r.eps.value, 10.5) && near(r.pe.value, 20) && near(r.mcap.value, 2100), 'FCF, EPS, P/E, market cap')
  ok(near(r.evEbitda.value, 2300 / 220) && near(r.dy.value, 0.02) && near(r.pb.value, 3), 'EV/EBITDA, yield, P/B')
  ok(r.roe.verdict === 'good' && r.de.verdict === 'good' && r.cover.verdict === 'good' && r.revG.verdict === 'ok', 'verdict bands')
  const bank = Object.fromEntries(computeRatios({ debt: 9000, equity: 1000, ebit: 500 }, true).map((x) => [x.key, x]))
  ok(bank.de.value === null && bank.roce.value === null, 'D/E and ROCE suppressed for financials')
  ok(computeRatios({}).every((x) => x.value === null), 'empty worksheet gives no numbers')
}

// ---------- Charges and tax ----------
{
  const b = charges('buy', 100000, 'zero', 'delivery')
  // STT 100 + exchange 2.97 + SEBI 0.10 + stamp 15 + GST 18% of (2.97+0.10)=0.55 → 118.62
  ok(b.stt === 100 && b.stamp === 15 && b.brokerage === 0 && near(b.total, 118.62, 0.02), 'delivery buy charges', JSON.stringify(b))
  const s = charges('sell', 100000, 'zero', 'delivery')
  ok(s.stamp === 0 && s.dp === 15.93 && near(s.total, 100 + 2.97 + 0.1 + 0.55 + 15.93, 0.02), 'delivery sell charges', JSON.stringify(s))
  const i = charges('sell', 100000, 'zero', 'intraday')
  ok(i.brokerage === 20 && i.stt === 25 && i.dp === 0, 'intraday sell charges')
  const f = charges('buy', 100000, 'full', 'delivery')
  ok(f.brokerage === 300 && near(f.gst, (300 + 2.97 + 0.1) * 0.18, 0.02), 'full-service brokerage + GST')
  const tx = taxEstimate(50000, 200000)
  ok(tx.stcg === 10000 && tx.ltcg === 9375 && near(tx.cess, 775), 'tax estimate (STCG 20%, LTCG 12.5% above 1.25L, 4% cess)')
}

// ---------- Paper-trading engine ----------
{
  const day = (o: number, h: number, l: number, c: number, t: number) => ({ time: t * 86400, open: o, high: h, low: l, close: c })
  const series: Record<number, ReturnType<typeof day>> = {
    0: day(100, 101, 99, 100, 0), 1: day(100, 102, 99, 101, 1), 2: day(101, 104, 100, 103, 2),
    3: day(103, 112, 102, 111, 3), 4: day(95, 96, 90, 92, 4),
  }
  const at = (_s: string, d: number) => series[d]
  let acc = newAccount('practice', 100000, 0, 0)
  const plan = { setup: 'breakout', reason: 'Breaking above resistance on high volume' }
  const ps = positionSize(100000, 0.01, 100, 95)
  ok(ps.qty === 200 && ps.risk === 1000, 'position size: 1% risk, ₹5 stop → 200 shares')
  ok(validateOrder(acc, { sym: 'X', side: 'buy', type: 'market', qty: 2000, plan }, 100) !== null, 'rejects buy without enough cash')
  ok(validateOrder(acc, { sym: 'X', side: 'sell', type: 'market', qty: 1, plan }, 100) !== null, 'rejects short selling')
  ok(validateOrder(acc, { sym: 'X', side: 'buy', type: 'market', qty: 10, stop: 101, plan }, 100) !== null, 'rejects stop above entry')
  acc = placeOrder(acc, { sym: 'X', side: 'buy', type: 'market', qty: 200, stop: 95, target: 110, plan }, 0)
  let r = advanceDay(acc, at, ['X']); acc = r.acc
  const fillPx = Math.round(100 * 1.0005 * 20) / 20
  ok(acc.positions.X?.qty === 200 && acc.positions.X.avg === fillPx, 'market order fills at next open + slippage', JSON.stringify(acc.positions.X))
  ok(near(acc.cash, 100000 - 200 * fillPx - charges('buy', 200 * fillPx).total, 0.01), 'cash reduced by value + charges')
  r = advanceDay(acc, at, ['X']); acc = r.acc
  ok(!!acc.positions.X, 'no exit while price stays inside stop/target')
  r = advanceDay(acc, at, ['X']); acc = r.acc
  ok(!acc.positions.X && acc.closed[0].exitVia === 'target' && acc.closed[0].exit === 110, 'target fills at target price', JSON.stringify(acc.closed[0]?.exit))
  const t0 = acc.closed[0]
  ok(near(t0.grossPnl, (110 - fillPx) * 200, 0.01) && t0.netPnl < t0.grossPnl && t0.rMultiple !== null && t0.rMultiple > 1.5, 'closed trade P&L and R multiple', JSON.stringify([t0.netPnl, t0.rMultiple]))
  ok(t0.review.score === 7, 'perfect process score for a planned trade', JSON.stringify(t0.review.notes.filter((n) => !n.ok)))
  // Gap through a stop
  let g = newAccount('practice', 100000, 2, 2 * 86400)
  g = executeBuy(g, 'X', 100, 103, 2 * 86400, 'market', plan, 100000, 98)
  g = { ...g, clock: 3 }
  const rg = advanceDay(g, at, ['X'])
  ok(rg.acc.closed[0].exitVia === 'stop' && rg.acc.closed[0].exit < 98 && rg.events[0].includes('GAPPED'), 'gap below stop fills at the open, worse than the stop', JSON.stringify(rg.acc.closed[0]?.exit))
  // Bad process: no stop, huge size, widened stop
  let bad = newAccount('real', 100000, 0, 0)
  bad = executeBuy(bad, 'Y', 900, 100, 0, 'manual', { setup: 'none', reason: 'tip' }, 100000)
  bad = setStopTarget(bad, 'Y', 90); bad = setStopTarget(bad, 'Y', 80)
  bad = executeSell(bad, 'Y', 900, 85, 86400, 'manual')
  const br = bad.closed[0].review
  ok(br.score <= 2 && bad.closed[0].netPnl < 0, 'poor process scores low', JSON.stringify(br))
  ok(updateManualPrice(executeBuy(newAccount('real', 1e5, 0, 0), 'Z', 10, 100, 0, 'manual', plan, 1e5, 95), 'Z', 94, 1).acc.closed[0]?.exitVia === 'stop', 'manual price update triggers stop')
  ok(near(maxDrawdown([100, 120, 90, 130, 117]), 0.25), 'max drawdown 25% (120 → 90)')
  const m = metrics(acc, () => undefined)
  ok(m.trades === 1 && m.winRate === 1 && m.realised === t0.netPnl, 'metrics summary')
}

// ---------- Simulated data sanity ----------
for (const ins of instruments) {
  const d = dailyCandles(ins.id), i5 = intradayCandles(ins.id)
  const valid = (x: Candle) => x.high >= Math.max(x.open, x.close) && x.low <= Math.min(x.open, x.close) && x.low > 0 && x.volume > 0
  ok(d.length === 300 && d.every(valid), `${ins.id} daily valid`)
  ok(i5.length === 375 && i5.every(valid), `${ins.id} intraday valid`)
  ok(d.every((x, k) => k === 0 || x.time > d[k - 1].time), `${ins.id} times increasing`)
  const counts: Record<string, number> = {}
  for (let k = 0; k < d.length; k++) for (const h of detectAt(d, k)) counts[h.id] = (counts[h.id] ?? 0) + 1
  console.log(ins.id, 'pattern counts', JSON.stringify(counts))
}

console.log(`\n${pass} passed, ${fail} failed`)
if (fail) process.exit(1)
