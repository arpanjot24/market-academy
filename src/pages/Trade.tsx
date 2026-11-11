import { useMemo, useState } from 'react'
import type { SeriesMarker, Time, UTCTimestamp } from 'lightweight-charts'
import PriceChart from '../components/PriceChart'
import { OrderTicket, type TicketResult } from '../components/OrderTicket'
import { TVWidget } from '../components/TVWidget'
import { Button, Card, Chip, Header } from '../components/ui'
import { useStore } from '../lib/store'
import { useDark } from '../lib/theme'
import { dailyCandles, instrumentById } from '../lib/chart/sim'
import { sma } from '../lib/chart/indicators'
import { advanceDay, cancelOrder, equityOf, executeBuy, executeSell, newAccount, placeOrder, updateManualPrice, type Account } from '../lib/sim/engine'
import { PLAN_LABELS, CHARGES_NOTE, type BrokeragePlan } from '../lib/sim/charges'
import { PRACTICE_SYMBOLS, PRACTICE_START, PRACTICE_END, candleAt, priceFn, simDate, inr0, inr2, pctS } from '../lib/sim/context'
import { stocks, stockBySym, displayName } from '../content/market'
import { go } from '../router'

export function ModeTabs({ mode, path }: { mode: 'practice' | 'real'; path: string }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-line bg-card p-1">
      {(['practice', 'real'] as const).map((m) => (
        <button key={m} onClick={() => go(`${path}/${m}`)} className={`rounded-lg py-2 text-sm font-semibold ${mode === m ? 'bg-accent text-white' : 'text-muted'}`}>{m === 'practice' ? 'Practice market' : 'Real stocks'}</button>
      ))}
    </div>
  )
}

function Setup({ mode, onStart }: { mode: 'practice' | 'real'; onStart: (capital: number, plan: BrokeragePlan) => void }) {
  const [cap, setCap] = useState('100000')
  const [plan, setPlan] = useState<BrokeragePlan>('zero')
  return (
    <Card>
      <h2 className="mb-1 text-base font-bold">Open a virtual account</h2>
      <p className="mb-3 text-sm text-muted">
        {mode === 'practice'
          ? 'Trade 7 simulated practice stocks. You move time forward one session at a time; orders fill at realistic prices, including gaps through stop-losses.'
          : 'Paper-trade real BSE-listed stocks. You enter the price you see in the quote widget; trades fill at that price. Update prices whenever you check the market.'}
        {' '}No real money, no broker connection — ever.
      </p>
      <label className="mb-2 block text-sm"><span className="text-muted">Virtual capital (₹)</span>
        <input inputMode="numeric" value={cap} onChange={(e) => setCap(e.target.value.replace(/\D/g, ''))} className="mt-1 h-11 w-full rounded-xl border border-line bg-card2 px-3 text-fg tabular" />
      </label>
      <label className="mb-3 block text-sm"><span className="text-muted">Brokerage plan (for cost estimates)</span>
        <select value={plan} onChange={(e) => setPlan(e.target.value as BrokeragePlan)} className="mt-1 h-11 w-full rounded-xl border border-line bg-card2 px-3 text-fg">
          {Object.entries(PLAN_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </label>
      <Button className="w-full" disabled={Number(cap) < 1000} onClick={() => onStart(Number(cap), plan)}>Start with {inr0(Number(cap) || 0)}</Button>
      <p className="mt-2 text-[11px] text-muted">{CHARGES_NOTE}</p>
    </Card>
  )
}

function AccountBar({ acc, price }: { acc: Account; price: (s: string) => number | undefined }) {
  const eq = equityOf(acc, price)
  const ret = eq / acc.startCapital - 1
  return (
    <Card className="mb-3">
      <div className="grid grid-cols-3 gap-2 text-center">
        <div><div className="text-[11px] text-muted">Equity</div><div className="font-bold tabular">{inr0(eq)}</div></div>
        <div><div className="text-[11px] text-muted">Return</div><div className={`font-bold tabular ${ret >= 0 ? 'text-up' : 'text-down'}`}>{pctS(ret)}</div></div>
        <div><div className="text-[11px] text-muted">Cash</div><div className="font-bold tabular">{inr0(acc.cash)}</div></div>
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
        <button onClick={() => go(`/portfolio/${acc.mode}`)} className="rounded-lg border border-line py-1.5">Portfolio</button>
        <button onClick={() => go(`/performance/${acc.mode}`)} className="rounded-lg border border-line py-1.5">Performance</button>
        <button onClick={() => go('/risk-tools')} className="rounded-lg border border-line py-1.5">Risk tools</button>
      </div>
    </Card>
  )
}

export default function TradePage({ mode: modeParam }: { mode?: string }) {
  const mode = modeParam === 'real' ? 'real' : 'practice'
  const { state, actions } = useStore()
  const acc = state.sim[mode]
  return (
    <div>
      <Header title="Trading simulator" subtitle="Paper trading — virtual money only" />
      <ModeTabs mode={mode} path="/trade" />
      {!acc ? (
        <Setup mode={mode} onStart={(cap, plan) => {
          const t = mode === 'practice' ? dailyCandles(PRACTICE_SYMBOLS[0])[PRACTICE_START].time : Math.floor(Date.now() / 1000)
          actions.setAccount(mode, { ...newAccount(mode, cap, mode === 'practice' ? PRACTICE_START : 0, t, plan), marks: mode === 'real' ? {} : undefined })
        }} />
      ) : mode === 'practice' ? <Practice acc={acc} /> : <Real acc={acc} />}
    </div>
  )
}

function Practice({ acc }: { acc: Account }) {
  const { actions } = useStore()
  const dark = useDark()
  const [sym, setSym] = useState(PRACTICE_SYMBOLS[0])
  const [events, setEvents] = useState<string[]>([])
  const price = priceFn(acc)
  const data = dailyCandles(sym)
  const shown = useMemo(() => data.slice(0, acc.clock + 1), [data, acc.clock])
  const closes = shown.map((c) => c.close)
  const pos = acc.positions[sym]
  const ended = acc.clock >= PRACTICE_END

  const step = (n: number) => {
    let a = acc
    const log: string[] = []
    for (let i = 0; i < n && a.clock < PRACTICE_END; i++) {
      const r = advanceDay(a, candleAt, PRACTICE_SYMBOLS)
      a = r.acc
      log.push(...r.events.map((e) => `${simDate(candleAt(PRACTICE_SYMBOLS[0], a.clock)!.time)}: ${e.replace(/sim-[a-g]/g, (m) => instrumentById[m]?.name ?? m)}`))
    }
    actions.setAccount('practice', a)
    const quiet = `${simDate(candleAt(PRACTICE_SYMBOLS[0], a.clock)!.time)}: moved forward ${n} session${n > 1 ? 's' : ''} — nothing filled, no stops or targets hit.`
    setEvents((prev) => [...prev, ...(log.length ? log : [quiet])].slice(-12))
  }

  const markers: SeriesMarker<Time>[] = acc.fills.filter((f) => f.sym === sym).map((f) => ({
    time: f.time as UTCTimestamp, position: f.side === 'buy' ? 'belowBar' : 'aboveBar', shape: f.side === 'buy' ? 'arrowUp' : 'arrowDown',
    color: f.side === 'buy' ? '#4f8cff' : '#f59e0b', text: `${f.side === 'buy' ? 'B' : 'S'} ${f.qty}${f.via === 'stop' ? ' (stop)' : f.via === 'target' ? ' (target)' : ''}`,
  } as SeriesMarker<Time>)).sort((a, b) => (a.time as number) - (b.time as number))
  const lines = pos ? [
    { price: pos.avg, color: '#4f8cff', title: 'Avg' },
    ...(pos.stop !== undefined ? [{ price: pos.stop, color: '#f05252', title: 'Stop', dashed: true }] : []),
    ...(pos.target !== undefined ? [{ price: pos.target, color: '#22c55e', title: 'Target', dashed: true }] : []),
  ] : []

  const onSubmit = (r: TicketResult) => actions.setAccount('practice', placeOrder(acc, { sym, ...r }, candleAt(sym, acc.clock)!.time))

  return (
    <div>
      <div className="mb-3 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-xs"><b className="text-warn">SIMULATION · </b>Practice stocks and dates are simulated. Session {acc.clock - PRACTICE_START + 1} of {PRACTICE_END - PRACTICE_START + 1} · {simDate(candleAt(sym, acc.clock)!.time)}</div>
      <AccountBar acc={acc} price={price} />
      <div className="-mx-4 mb-2 flex gap-2 overflow-x-auto px-4 pb-1">
        {PRACTICE_SYMBOLS.map((s) => (
          <button key={s} onClick={() => setSym(s)} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${sym === s ? 'border-accent bg-accent text-white' : 'border-line bg-card text-muted'}`}>
            {instrumentById[s].name.replace('Practice Stock ', 'Stock ')}{acc.positions[s] ? ' ●' : ''}
          </button>
        ))}
      </div>
      <p className="mb-2 text-xs text-muted">{instrumentById[sym].description} · last close <b className="text-fg">{inr2(price(sym)!)}</b></p>
      <PriceChart candles={shown} dark={dark} viewKey={sym} follow markers={markers} priceLines={lines} mainHeight={300}
        overlays={[{ key: 's20', data: sma(closes, 20), color: '#4f8cff', width: 1 }, { key: 's50', data: sma(closes, 50), color: '#f59e0b', width: 1 }]} />
      <div className="sticky top-0 z-10 -mx-4 mt-2 grid grid-cols-2 gap-2 bg-bg/95 px-4 py-2 backdrop-blur">
        <Button disabled={ended} onClick={() => step(1)}>Next session ▸</Button>
        <Button variant="secondary" disabled={ended} onClick={() => step(5)}>+5 sessions ⏭</Button>
      </div>
      {ended && <Card className="mb-3 border-warn/40 bg-warn/10 text-sm">The practice period has ended. Review your performance, then reset the account below to practise again.</Card>}
      {events.length > 0 && (
        <Card className="mb-3 text-sm">
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">What happened</div>
          <ul className="grid gap-1">{[...events].reverse().map((e, i) => <li key={i} className={e.includes('GAPPED') ? 'text-warn' : e.includes('Stop-loss') ? 'text-down' : e.includes('Target') ? 'text-up' : ''}>{e}</li>)}</ul>
        </Card>
      )}
      {pos && (
        <Card className="mb-3 text-sm">
          <div className="flex justify-between"><b>Your position</b><span className={`tabular ${(price(sym)! - pos.avg) >= 0 ? 'text-up' : 'text-down'}`}>{inr0((price(sym)! - pos.avg) * pos.qty)} ({pctS(price(sym)! / pos.avg - 1)})</span></div>
          <div className="text-xs text-muted">{pos.qty} shares @ {inr2(pos.avg)} · stop {pos.stop !== undefined ? inr2(pos.stop) : 'none'} · target {pos.target !== undefined ? inr2(pos.target) : 'none'}</div>
          <button onClick={() => go('/portfolio/practice')} className="mt-1 text-xs text-accent">Edit stop/target in Portfolio →</button>
        </Card>
      )}
      <OrderTicket acc={acc} sym={sym} name={instrumentById[sym].name} refPrice={price(sym)} equity={equityOf(acc, price)} allowLimit
        fillNote="is queued — it is processed when you press “Next session” (market orders fill at the next open)." onSubmit={onSubmit} />
      <PendingOrders acc={acc} onCancel={(id) => actions.setAccount('practice', cancelOrder(acc, id))} />
      <ResetCard acc={acc} />
    </div>
  )
}

function PendingOrders({ acc, onCancel }: { acc: Account; onCancel: (id: string) => void }) {
  if (!acc.orders.length) return null
  return (
    <section className="mt-3 rounded-2xl border border-line bg-card p-3">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Pending orders</h3>
      {acc.orders.map((o) => (
        <div key={o.id} className="flex items-center justify-between gap-2 border-t border-line py-2 text-sm first:border-0">
          <span><Chip tone={o.side === 'buy' ? 'up' : 'down'}>{o.side}</Chip> {o.qty} × {instrumentById[o.sym]?.name ?? o.sym} · {o.type === 'market' ? 'at next open' : `limit ${inr2(o.limit!)}`}</span>
          <button onClick={() => onCancel(o.id)} className="rounded-lg border border-line px-2 py-1 text-xs">Cancel</button>
        </div>
      ))}
    </section>
  )
}

function ResetCard({ acc }: { acc: Account }) {
  const { actions } = useStore()
  return (
    <section className="mt-3 rounded-2xl border border-line bg-card p-3 text-sm">
      <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Account</h3>
      <p className="text-xs text-muted">Started with {inr0(acc.startCapital)} · {PLAN_LABELS[acc.plan]}</p>
      <Button variant="danger" className="mt-2 w-full text-sm" onClick={() => { if (confirm('Reset this virtual account? All trades and history in it will be erased.')) actions.setAccount(acc.mode, null) }}>Reset account (choose new capital)</Button>
    </section>
  )
}

function Real({ acc }: { acc: Account }) {
  const { actions } = useStore()
  const [sym, setSym] = useState(stocks[0].sym)
  const [priceS, setPriceS] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const typed = Number(priceS.replace(/,/g, ''))
  const priceNow = priceS && Number.isFinite(typed) && typed > 0 ? typed : undefined
  const price = priceFn(acc)
  const now = () => Math.floor(Date.now() / 1000)
  const withMark = (a: Account, s: string, p: number): Account => {
    const marks = { ...(a.marks ?? {}), [s]: { price: p, at: now() } }
    const b = { ...a, marks }
    return { ...b, equity: [...b.equity, { time: now(), value: equityOf(b, priceFn(b)) }] }
  }
  const onSubmit = (r: TicketResult) => {
    if (!priceNow) return
    let a = withMark(acc, sym, priceNow)
    a = r.side === 'buy'
      ? executeBuy(a, sym, r.qty, priceNow, now(), 'manual', r.plan, equityOf(a, priceFn(a)), r.stop, r.target)
      : executeSell(a, sym, r.qty, priceNow, now(), 'manual')
    actions.setAccount('real', { ...a, equity: [...a.equity, { time: now(), value: equityOf(a, priceFn(a)) }] })
  }
  const updatePrice = (s: string, p: number) => {
    let a = withMark(acc, s, p)
    const r = updateManualPrice(a, s, p, now())
    a = r.acc
    actions.setAccount('real', a)
    setMsg(r.event ?? `Price of ${displayName(s)} updated to ${inr2(p)}.`)
  }
  return (
    <div>
      <div className="mb-3 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-xs"><b className="text-warn">PAPER TRADING · </b>Trades fill at the price you type. Prices in the widget are end-of-day or delayed — note the time shown in it.</div>
      <AccountBar acc={acc} price={price} />
      <select value={sym} onChange={(e) => { setSym(e.target.value); setPriceS('') }} className="mb-2 h-11 w-full rounded-xl border border-line bg-card px-3 text-fg">
        {stocks.map((s) => <option key={s.sym} value={s.sym}>{s.name} ({s.sector})</option>)}
      </select>
      <TVWidget type="single-quote" height={110} caption={false} config={{ symbol: sym }} />
      <label className="mt-2 block text-sm"><span className="text-muted">Price you see now (₹) — required to trade</span>
        <input inputMode="decimal" value={priceS} onChange={(e) => setPriceS(e.target.value)} placeholder={acc.marks?.[sym] ? `last entered ${acc.marks[sym].price}` : 'e.g. 1153.90'}
          className="mt-1 h-11 w-full rounded-xl border border-line bg-card2 px-3 text-fg tabular" />
      </label>
      <div className="mt-3">
        <OrderTicket acc={acc} sym={sym} name={stockBySym[sym]?.name ?? sym} refPrice={priceNow} equity={equityOf(acc, price)} allowLimit={false}
          fillNote={`filled at ${priceNow ? inr2(priceNow) : 'your price'}.`} onSubmit={onSubmit} />
      </div>
      {msg && <p className="mt-2 text-sm text-up">{msg}</p>}
      {Object.values(acc.positions).length > 0 && (
        <section className="mt-3 rounded-2xl border border-line bg-card p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Update prices (checks your stops and targets)</h3>
          {Object.values(acc.positions).map((p) => <PriceUpdater key={p.sym} sym={p.sym} last={acc.marks?.[p.sym]} onUpdate={(v) => updatePrice(p.sym, v)} />)}
        </section>
      )}
      <ResetCard acc={acc} />
    </div>
  )
}

function PriceUpdater({ sym, last, onUpdate }: { sym: string; last?: { price: number; at: number }; onUpdate: (p: number) => void }) {
  const [v, setV] = useState('')
  return (
    <div className="flex items-center gap-2 border-t border-line py-2 first:border-0">
      <div className="min-w-0 flex-1 text-sm"><div className="truncate font-medium">{displayName(sym)}</div><div className="text-[11px] text-muted">{last ? `${inr2(last.price)} · entered ${new Date(last.at * 1000).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}` : 'no price yet'}</div></div>
      <input inputMode="decimal" value={v} onChange={(e) => setV(e.target.value)} placeholder="₹" className="h-9 w-24 rounded-lg border border-line bg-card2 px-2 text-right text-sm text-fg" />
      <button onClick={() => { const n = Number(v); if (n > 0) { onUpdate(n); setV('') } }} className="rounded-lg bg-accent px-3 py-2 text-xs font-semibold text-white">Update</button>
    </div>
  )
}
