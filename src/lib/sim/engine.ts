// Paper-trading engine. Pure functions over a plain Account object (stored in IndexedDB).
// Long positions only (Indian cash-market delivery). Never connected to any broker.
import { charges, type BrokeragePlan } from './charges.ts'

export interface OHLC { time: number; open: number; high: number; low: number; close: number }
export interface TradePlan { setup: string; reason: string }
export interface Position {
  sym: string; qty: number; avg: number; stop?: number; target?: number; initialStop?: number
  openedAt: number; plan: TradePlan; buyCosts: number; riskAtEntry: number | null; equityAtEntry: number
  widenedStop: boolean; afterLoss: boolean
}
export interface PendingOrder {
  id: string; sym: string; side: 'buy' | 'sell'; type: 'market' | 'limit'; qty: number
  limit?: number; stop?: number; target?: number; plan: TradePlan; placedAt: number
}
export interface Fill { id: string; sym: string; side: 'buy' | 'sell'; qty: number; price: number; time: number; costs: number; via: 'market' | 'limit' | 'stop' | 'target' | 'manual' }
export interface ProcessReview { score: number; max: number; notes: { ok: boolean; text: string }[] }
export interface ClosedTrade {
  id: string; sym: string; qty: number; entry: number; exit: number; openedAt: number; closedAt: number
  grossPnl: number; costs: number; netPnl: number; exitVia: Fill['via']; plan: TradePlan
  initialStop?: number; riskAtEntry: number | null; rMultiple: number | null; review: ProcessReview
}
export interface Account {
  mode: 'practice' | 'real'
  startCapital: number
  cash: number
  plan: BrokeragePlan
  positions: Record<string, Position>
  orders: PendingOrder[]
  fills: Fill[]
  closed: ClosedTrade[]
  equity: { time: number; value: number }[]
  clock: number
  lastLossAt?: number
  /** Real-price mode: the last price you entered for each symbol. */
  marks?: Record<string, { price: number; at: number }>
}

export const SLIPPAGE = 0.0005 // 0.05% on market and stop fills
const r2 = (x: number) => Math.round(x * 100) / 100
const tick = (x: number) => Math.round(x * 20) / 20
let seq = 0
const uid = (p: string) => `${p}${Date.now().toString(36)}${(seq++).toString(36)}`

export function newAccount(mode: Account['mode'], capital: number, clock: number, time: number, plan: BrokeragePlan = 'zero'): Account {
  return { mode, startCapital: capital, cash: capital, plan, positions: {}, orders: [], fills: [], closed: [], equity: [{ time, value: capital }], clock }
}

export function equityOf(acc: Account, price: (sym: string) => number | undefined): number {
  return r2(acc.cash + Object.values(acc.positions).reduce((a, p) => a + p.qty * (price(p.sym) ?? p.avg), 0))
}

/** Checks done before an order is accepted. */
export function validateOrder(acc: Account, o: Omit<PendingOrder, 'id' | 'placedAt'>, refPrice: number): string | null {
  if (!Number.isInteger(o.qty) || o.qty <= 0) return 'Quantity must be a whole number above zero.'
  if (o.type === 'limit' && !(o.limit && o.limit > 0)) return 'Enter a limit price.'
  if (o.side === 'buy') {
    const px = o.type === 'limit' ? o.limit! : refPrice * (1 + SLIPPAGE)
    const need = o.qty * px + charges('buy', o.qty * px, acc.plan).total
    const reserved = acc.orders.filter((x) => x.side === 'buy').reduce((a, x) => a + x.qty * (x.limit ?? refPrice), 0)
    if (need > acc.cash - reserved) return `Not enough cash: need about ₹${Math.round(need).toLocaleString('en-IN')}, available ₹${Math.round(acc.cash - reserved).toLocaleString('en-IN')}.`
    if (o.stop !== undefined && o.stop >= px) return 'A stop-loss for a buy must be below the entry price.'
    if (o.target !== undefined && o.target <= px) return 'A target must be above the entry price.'
  } else {
    const held = acc.positions[o.sym]?.qty ?? 0
    const pending = acc.orders.filter((x) => x.side === 'sell' && x.sym === o.sym).reduce((a, x) => a + x.qty, 0)
    if (o.qty > held - pending) return `You can sell at most ${held - pending} shares (short selling is not supported).`
  }
  return null
}

export function placeOrder(acc: Account, o: Omit<PendingOrder, 'id' | 'placedAt'>, time: number): Account {
  return { ...acc, orders: [...acc.orders, { ...o, id: uid('o'), placedAt: time }] }
}

export function cancelOrder(acc: Account, id: string): Account {
  return { ...acc, orders: acc.orders.filter((o) => o.id !== id) }
}

function review(p: Position, exitVia: Fill['via']): ProcessReview {
  const notes: ProcessReview['notes'] = []
  const add = (ok: boolean, text: string) => notes.push({ ok, text })
  const riskPct = p.riskAtEntry !== null ? p.riskAtEntry / p.equityAtEntry : null
  const sizePct = (p.qty * p.avg) / p.equityAtEntry
  add(p.plan.setup !== '' && p.plan.setup !== 'none', p.plan.setup && p.plan.setup !== 'none' ? `Named a setup (${p.plan.setup})` : 'No setup named')
  add(p.plan.reason.trim().length >= 15, p.plan.reason.trim().length >= 15 ? 'Wrote down the reason for the trade' : 'Reason missing or too short')
  add(p.initialStop !== undefined, p.initialStop !== undefined ? 'Had a stop-loss from the start' : 'No stop-loss at entry')
  add(riskPct !== null && riskPct <= 0.02, riskPct === null ? 'Risk unknown (no stop)' : `Risked ${(riskPct * 100).toFixed(1)}% of equity${riskPct <= 0.02 ? ' (≤ 2%)' : ' — above the 2% guideline'}`)
  const rr = p.initialStop !== undefined && p.target !== undefined ? (p.target - p.avg) / (p.avg - p.initialStop) : null
  add(rr !== null && rr >= 1.5, rr === null ? 'No planned reward:risk (needs stop and target)' : `Planned reward:risk ${rr.toFixed(1)} : 1${rr >= 1.5 ? '' : ' — below 1.5 : 1'}`)
  add(sizePct <= 0.25, `Position was ${(sizePct * 100).toFixed(0)}% of equity${sizePct <= 0.25 ? '' : ' — concentrated (> 25%)'}`)
  add(!p.widenedStop, p.widenedStop ? 'Moved the stop-loss further away (increased risk)' : 'Never widened the stop')
  let score = notes.filter((n) => n.ok).length
  if (p.afterLoss) { notes.push({ ok: false, text: 'Opened right after a losing trade — check for revenge trading' }); score = Math.max(0, score - 1) }
  if (exitVia === 'stop') notes.push({ ok: true, text: 'Exited at the planned stop — loss kept to plan' })
  if (exitVia === 'target') notes.push({ ok: true, text: 'Exited at the planned target' })
  return { score, max: 7, notes }
}

export function executeBuy(acc: Account, sym: string, qty: number, price: number, time: number, via: Fill['via'], plan: TradePlan, equityNow: number, stop?: number, target?: number): Account {
  const value = qty * price
  const c = charges('buy', value, acc.plan).total
  const prev = acc.positions[sym]
  const recentLoss = acc.lastLossAt !== undefined && time - acc.lastLossAt <= 2 * 86400
  const pos: Position = prev
    ? { ...prev, qty: prev.qty + qty, avg: r2((prev.avg * prev.qty + value) / (prev.qty + qty)), buyCosts: prev.buyCosts + c, stop: stop ?? prev.stop, target: target ?? prev.target }
    : { sym, qty, avg: price, stop, target, initialStop: stop, openedAt: time, plan, buyCosts: c, riskAtEntry: null, equityAtEntry: equityNow, widenedStop: false, afterLoss: recentLoss }
  pos.riskAtEntry = pos.initialStop !== undefined ? r2((pos.avg - pos.initialStop) * pos.qty) : null
  return {
    ...acc,
    cash: r2(acc.cash - value - c),
    positions: { ...acc.positions, [sym]: pos },
    fills: [...acc.fills, { id: uid('f'), sym, side: 'buy', qty, price, time, costs: c, via }],
  }
}

export function executeSell(acc: Account, sym: string, qty: number, price: number, time: number, via: Fill['via']): Account {
  const p = acc.positions[sym]
  if (!p || qty <= 0) return acc
  qty = Math.min(qty, p.qty)
  const value = qty * price
  const c = charges('sell', value, acc.plan).total
  const share = qty / p.qty
  const buyCostShare = p.buyCosts * share
  const gross = (price - p.avg) * qty
  const net = gross - c - buyCostShare
  const risk = p.riskAtEntry !== null ? p.riskAtEntry * share : null
  const ct: ClosedTrade = {
    id: uid('t'), sym, qty, entry: p.avg, exit: price, openedAt: p.openedAt, closedAt: time,
    grossPnl: r2(gross), costs: r2(c + buyCostShare), netPnl: r2(net), exitVia: via, plan: p.plan,
    initialStop: p.initialStop, riskAtEntry: risk !== null ? r2(risk) : null,
    rMultiple: risk ? r2(net / risk) : null, review: review(p, via),
  }
  const positions = { ...acc.positions }
  if (qty >= p.qty) delete positions[sym]
  else positions[sym] = { ...p, qty: p.qty - qty, buyCosts: p.buyCosts - buyCostShare, riskAtEntry: p.riskAtEntry !== null ? r2(p.riskAtEntry * (1 - share)) : null }
  return {
    ...acc,
    cash: r2(acc.cash + value - c),
    positions,
    orders: qty >= p.qty ? acc.orders.filter((o) => !(o.sym === sym && o.side === 'sell')) : acc.orders,
    fills: [...acc.fills, { id: uid('f'), sym, side: 'sell', qty, price, time, costs: c, via }],
    closed: [...acc.closed, ct],
    lastLossAt: net < 0 ? time : acc.lastLossAt,
  }
}

export function setStopTarget(acc: Account, sym: string, stop?: number, target?: number): Account {
  const p = acc.positions[sym]
  if (!p) return acc
  const widened = p.stop !== undefined && stop !== undefined && stop < p.stop
  const removed = p.stop !== undefined && stop === undefined
  const initialStop = p.initialStop ?? stop
  return { ...acc, positions: { ...acc.positions, [sym]: { ...p, stop, target, initialStop, riskAtEntry: initialStop !== undefined ? r2((p.avg - initialStop) * p.qty) : null, widenedStop: p.widenedStop || widened || removed } } }
}

/**
 * Practice market: advance one session. Orders placed after the previous close are processed
 * against the new candle: market orders at the open (plus slippage); limits if the range reaches them;
 * then stop-losses and targets on open positions. Gaps fill at the open — exactly like real markets.
 */
export function advanceDay(acc: Account, candleAt: (sym: string, day: number) => OHLC | undefined, symbols: string[]): { acc: Account; events: string[] } {
  const day = acc.clock + 1
  const events: string[] = []
  let a: Account = { ...acc, clock: day }
  const priceNow = (sym: string) => candleAt(sym, acc.clock)?.close
  for (const o of acc.orders) {
    const c = candleAt(o.sym, day)
    if (!c) continue
    let px: number | null = null
    if (o.type === 'market') px = tick(o.side === 'buy' ? c.open * (1 + SLIPPAGE) : c.open * (1 - SLIPPAGE))
    else if (o.side === 'buy' && c.low <= o.limit!) px = Math.min(c.open, o.limit!)
    else if (o.side === 'sell' && c.high >= o.limit!) px = Math.max(c.open, o.limit!)
    if (px === null) continue
    a = { ...a, orders: a.orders.filter((x) => x.id !== o.id) }
    if (o.side === 'buy') {
      const cost = o.qty * px + charges('buy', o.qty * px, a.plan).total
      if (cost > a.cash) { events.push(`Buy ${o.qty} ${o.sym} cancelled: not enough cash at the fill price.`); continue }
      a = executeBuy(a, o.sym, o.qty, px, c.time, o.type, o.plan, equityOf(a, priceNow), o.stop, o.target)
      events.push(`Bought ${o.qty} × ${o.sym} at ₹${px.toFixed(2)} (${o.type === 'market' ? 'at the open' : 'limit reached'}).`)
    } else {
      a = executeSell(a, o.sym, o.qty, px, c.time, o.type)
      events.push(`Sold ${o.qty} × ${o.sym} at ₹${px.toFixed(2)}.`)
    }
  }
  for (const p of Object.values(a.positions)) {
    const c = candleAt(p.sym, day)
    if (!c) continue
    if (p.stop !== undefined && c.low <= p.stop) {
      const px = tick(Math.min(c.open, p.stop) * (1 - SLIPPAGE))
      a = executeSell(a, p.sym, p.qty, px, c.time, 'stop')
      events.push(`Stop-loss hit on ${p.sym}: sold ${p.qty} at ₹${px.toFixed(2)}${c.open < p.stop ? ' — the price GAPPED below your stop, so the fill was worse than planned' : ''}.`)
    } else if (p.target !== undefined && c.high >= p.target) {
      const px = Math.max(c.open, p.target)
      a = executeSell(a, p.sym, p.qty, px, c.time, 'target')
      events.push(`Target reached on ${p.sym}: sold ${p.qty} at ₹${px.toFixed(2)}.`)
    }
  }
  const t = candleAt(symbols[0], day)?.time ?? 0
  a.equity = [...a.equity, { time: t, value: equityOf(a, (s) => candleAt(s, day)?.close) }]
  return { acc: a, events }
}

/** Real-price mode: you enter the price you see; stops and targets are checked against it. */
export function updateManualPrice(acc: Account, sym: string, price: number, time: number): { acc: Account; event?: string } {
  const p = acc.positions[sym]
  if (!p) return { acc }
  if (p.stop !== undefined && price <= p.stop) return { acc: executeSell(acc, sym, p.qty, price, time, 'stop'), event: `Stop-loss triggered on ${sym} at ₹${price}.` }
  if (p.target !== undefined && price >= p.target) return { acc: executeSell(acc, sym, p.qty, price, time, 'target'), event: `Target reached on ${sym} at ₹${price}.` }
  return { acc }
}

export interface Metrics {
  equity: number; totalReturn: number; realised: number; unrealised: number; costs: number
  trades: number; wins: number; winRate: number | null; avgWin: number | null; avgLoss: number | null
  profitFactor: number | null; expectancyR: number | null; maxDrawdown: number; avgRiskPct: number | null; avgProcess: number | null
}

export function maxDrawdown(values: number[]): number {
  let peak = -Infinity, dd = 0
  for (const v of values) { peak = Math.max(peak, v); if (peak > 0) dd = Math.max(dd, (peak - v) / peak) }
  return dd
}

export function metrics(acc: Account, price: (sym: string) => number | undefined): Metrics {
  const eq = equityOf(acc, price)
  const wins = acc.closed.filter((t) => t.netPnl > 0), losses = acc.closed.filter((t) => t.netPnl <= 0)
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
  const rs = acc.closed.map((t) => t.rMultiple).filter((x): x is number => x !== null)
  const risks = acc.closed.filter((t) => t.riskAtEntry !== null).map((t) => t.riskAtEntry! / Math.max(1, acc.startCapital))
  const grossLoss = Math.abs(sum(losses.map((t) => t.netPnl)))
  return {
    equity: eq,
    totalReturn: eq / acc.startCapital - 1,
    realised: r2(sum(acc.closed.map((t) => t.netPnl))),
    unrealised: r2(Object.values(acc.positions).reduce((a, p) => a + ((price(p.sym) ?? p.avg) - p.avg) * p.qty, 0)),
    costs: r2(sum(acc.fills.map((f) => f.costs))),
    trades: acc.closed.length,
    wins: wins.length,
    winRate: acc.closed.length ? wins.length / acc.closed.length : null,
    avgWin: wins.length ? sum(wins.map((t) => t.netPnl)) / wins.length : null,
    avgLoss: losses.length ? sum(losses.map((t) => t.netPnl)) / losses.length : null,
    profitFactor: grossLoss > 0 ? sum(wins.map((t) => t.netPnl)) / grossLoss : null,
    expectancyR: rs.length ? sum(rs) / rs.length : null,
    maxDrawdown: maxDrawdown([...acc.equity.map((e) => e.value), eq]),
    avgRiskPct: risks.length ? sum(risks) / risks.length : null,
    avgProcess: acc.closed.length ? sum(acc.closed.map((t) => t.review.score / t.review.max)) / acc.closed.length : null,
  }
}

/** Position size that risks `riskPct` of capital between entry and stop. */
export function positionSize(capital: number, riskPct: number, entry: number, stop: number): { qty: number; risk: number; value: number } {
  if (!(entry > stop) || stop <= 0 || capital <= 0 || riskPct <= 0) return { qty: 0, risk: 0, value: 0 }
  const qty = Math.floor((capital * riskPct) / (entry - stop))
  return { qty, risk: r2(qty * (entry - stop)), value: r2(qty * entry) }
}
