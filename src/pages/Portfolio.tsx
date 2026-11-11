import { useState } from 'react'
import { useStore } from '../lib/store'
import { equityOf, metrics, placeOrder, setStopTarget, executeSell, type Account, type ClosedTrade } from '../lib/sim/engine'
import { charges, taxEstimate, PLAN_LABELS, CHARGES_NOTE, TAX_NOTE, type BrokeragePlan, type Product } from '../lib/sim/charges'
import { positionSize } from '../lib/sim/engine'
import { priceFn, symName, inr0, inr2, pctS, candleAt } from '../lib/sim/context'
import { stockBySym } from '../content/market'
import { strategyById } from '../content/strategies'
import { go } from '../router'
import { Button, Card, Chip, Header } from '../components/ui'

function Tabs({ mode, path }: { mode: 'practice' | 'real'; path: string }) {
  return (
    <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl border border-line bg-card p-1">
      {(['practice', 'real'] as const).map((m) => (
        <button key={m} onClick={() => go(`${path}/${m}`)} className={`rounded-lg py-2 text-sm font-semibold ${mode === m ? 'bg-accent text-white' : 'text-muted'}`}>{m === 'practice' ? 'Practice market' : 'Real stocks'}</button>
      ))}
    </div>
  )
}

function NoAccount({ mode }: { mode: 'practice' | 'real' }) {
  return <Card className="text-sm text-muted">No {mode === 'practice' ? 'practice' : 'real-stock'} account yet.<Button className="mt-3 w-full" onClick={() => go(`/trade/${mode}`)}>Open the simulator</Button></Card>
}

const COLORS = ['#4f8cff', '#22c55e', '#f59e0b', '#a78bfa', '#f472b6', '#2dd4bf', '#f05252', '#94a3b8']
const grade = (t: ClosedTrade) => { const r = t.review.score / t.review.max; return r >= 0.85 ? 'A' : r >= 0.7 ? 'B' : r >= 0.5 ? 'C' : 'D' }
const gradeTone = (g: string) => (g === 'A' ? 'up' : g === 'B' ? 'accent' : g === 'C' ? 'warn' : 'down') as 'up' | 'accent' | 'warn' | 'down'

export function PortfolioPage({ mode: m }: { mode?: string }) {
  const mode = m === 'real' ? 'real' : 'practice'
  const { state, actions } = useStore()
  const acc = state.sim[mode]
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div>
      <Header title="Virtual portfolio" subtitle="Holdings, allocation and history" back={`/trade/${mode}`} />
      <Tabs mode={mode} path="/portfolio" />
      {!acc ? <NoAccount mode={mode} /> : <PortfolioBody acc={acc} open={open} setOpen={setOpen} save={(a) => actions.setAccount(mode, a)} />}
    </div>
  )
}

function PortfolioBody({ acc, open, setOpen, save }: { acc: Account; open: string | null; setOpen: (s: string | null) => void; save: (a: Account) => void }) {
  const price = priceFn(acc)
  const eq = equityOf(acc, price)
  const pos = Object.values(acc.positions)
  const rows = pos.map((p) => { const px = price(p.sym) ?? p.avg; return { p, px, value: p.qty * px, pnl: (px - p.avg) * p.qty, risk: p.stop !== undefined ? Math.max(0, (px - p.stop) * p.qty) : null } })
  const invested = rows.reduce((a, r) => a + r.value, 0)
  const openRisk = rows.reduce((a, r) => a + (r.risk ?? 0), 0)
  const noStop = rows.filter((r) => r.risk === null).length
  const sectors: Record<string, number> = {}
  if (acc.mode === 'real') for (const r of rows) { const s = stockBySym[r.p.sym]?.sector ?? 'Other'; sectors[s] = (sectors[s] ?? 0) + r.value }

  return (
    <>
      <Card className="mb-3">
        <div className="grid grid-cols-3 gap-2 text-center text-sm">
          <div><div className="text-[11px] text-muted">Equity</div><b className="tabular">{inr0(eq)}</b></div>
          <div><div className="text-[11px] text-muted">Invested</div><b className="tabular">{inr0(invested)}</b></div>
          <div><div className="text-[11px] text-muted">Cash</div><b className="tabular">{inr0(acc.cash)}</b></div>
        </div>
        <div className="mt-3 flex h-4 overflow-hidden rounded-full bg-card2">
          {rows.map((r, i) => <div key={r.p.sym} style={{ width: `${(r.value / eq) * 100}%`, background: COLORS[i % COLORS.length] }} title={symName(acc, r.p.sym)} />)}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted">
          {rows.map((r, i) => <span key={r.p.sym}><span style={{ color: COLORS[i % COLORS.length] }}>■</span> {symName(acc, r.p.sym)} {((r.value / eq) * 100).toFixed(0)}%</span>)}
          <span>□ Cash {((acc.cash / eq) * 100).toFixed(0)}%</span>
        </div>
        <div className="mt-2 text-xs">
          Open risk if all stops hit: <b className="tabular">{inr0(openRisk)} ({((openRisk / eq) * 100).toFixed(1)}% of equity)</b>
          {noStop > 0 && <span className="text-down"> · {noStop} position{noStop > 1 ? 's' : ''} without a stop (unlimited risk)</span>}
        </div>
        {Object.keys(sectors).length > 0 && (
          <div className="mt-2 text-xs text-muted">Sectors: {Object.entries(sectors).map(([s, v]) => `${s} ${((v / eq) * 100).toFixed(0)}%`).join(' · ')}
            {Object.values(sectors).some((v) => v / eq > 0.3) && <span className="text-warn"> — one sector is above 30% of equity</span>}
          </div>
        )}
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-muted">Holdings ({rows.length})</h2>
      {rows.length === 0 && <p className="mb-3 rounded-xl border border-dashed border-line p-4 text-sm text-muted">No open positions.</p>}
      <div className="grid gap-2">
        {rows.map((r) => <Holding key={r.p.sym} acc={acc} row={r} eq={eq} save={save} />)}
      </div>

      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Closed trades ({acc.closed.length})</h2>
      <div className="grid gap-2">
        {[...acc.closed].reverse().map((t) => (
          <button key={t.id} onClick={() => setOpen(open === t.id ? null : t.id)} className="rounded-xl border border-line bg-card p-3 text-left text-sm">
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold">{symName(acc, t.sym)}</span>
              <span className="flex items-center gap-2"><span className={`tabular ${t.netPnl >= 0 ? 'text-up' : 'text-down'}`}>{inr0(t.netPnl)}</span><Chip tone={gradeTone(grade(t))}>Process {grade(t)}</Chip></span>
            </div>
            <div className="text-xs text-muted">{t.qty} @ {inr2(t.entry)} → {inr2(t.exit)} · exit: {t.exitVia}{t.rMultiple !== null ? ` · ${t.rMultiple.toFixed(2)}R` : ''} · {strategyById[t.plan.setup]?.name ?? 'no setup'}</div>
            {open === t.id && (
              <div className="mt-2 border-t border-line pt-2 text-xs">
                <div className="mb-1 text-muted">Reason: “{t.plan.reason || '—'}” · costs {inr2(t.costs)}</div>
                <ul className="grid gap-0.5">{t.review.notes.map((n, i) => <li key={i} className={n.ok ? 'text-up' : 'text-down'}>{n.ok ? '✓' : '✗'} {n.text}</li>)}</ul>
              </div>
            )}
          </button>
        ))}
      </div>

      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Order history ({acc.fills.length} fills)</h2>
      <div className="overflow-hidden rounded-2xl border border-line bg-card">
        {[...acc.fills].reverse().slice(0, 50).map((f) => (
          <div key={f.id} className="flex items-center justify-between gap-2 border-b border-line px-3 py-2 text-xs last:border-0">
            <span><Chip tone={f.side === 'buy' ? 'up' : 'down'}>{f.side}</Chip> {f.qty} × {symName(acc, f.sym)}</span>
            <span className="text-right tabular">{inr2(f.price)} · {f.via}<br /><span className="text-muted">{new Date(f.time * 1000).toLocaleDateString('en-IN', { timeZone: acc.mode === 'practice' ? 'UTC' : undefined })} · costs {inr2(f.costs)}</span></span>
          </div>
        ))}
        {acc.fills.length === 0 && <p className="p-3 text-sm text-muted">No trades yet.</p>}
      </div>
    </>
  )
}

function Holding({ acc, row, eq, save }: { acc: Account; row: { p: Account['positions'][string]; px: number; value: number; pnl: number; risk: number | null }; eq: number; save: (a: Account) => void }) {
  const { p, px, value, pnl, risk } = row
  const [stop, setStop] = useState(p.stop !== undefined ? String(p.stop) : '')
  const [target, setTarget] = useState(p.target !== undefined ? String(p.target) : '')
  const n = (s: string) => (s.trim() && Number(s) > 0 ? Number(s) : undefined)
  const sellAll = () => {
    if (acc.mode === 'practice') save(placeOrder(acc, { sym: p.sym, side: 'sell', type: 'market', qty: p.qty, plan: p.plan }, candleAt(p.sym, acc.clock)!.time))
    else save(executeSell(acc, p.sym, p.qty, px, Math.floor(Date.now() / 1000), 'manual'))
  }
  return (
    <div className="rounded-xl border border-line bg-card p-3 text-sm">
      <div className="flex justify-between gap-2"><b>{symName(acc, p.sym)}</b><span className={`tabular ${pnl >= 0 ? 'text-up' : 'text-down'}`}>{inr0(pnl)} ({pctS(px / p.avg - 1)})</span></div>
      <div className="mt-0.5 text-xs text-muted">{p.qty} sh · avg {inr2(p.avg)} · last {inr2(px)} · value {inr0(value)} ({((value / eq) * 100).toFixed(0)}%) · risk to stop {risk !== null ? inr0(risk) : '∞'}</div>
      <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
        <input inputMode="decimal" value={stop} onChange={(e) => setStop(e.target.value)} placeholder="Stop ₹" className="h-9 rounded-lg border border-line bg-card2 px-2 text-xs text-fg" />
        <input inputMode="decimal" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="Target ₹" className="h-9 rounded-lg border border-line bg-card2 px-2 text-xs text-fg" />
        <button onClick={() => {
          const s = n(stop), t = n(target)
          if (s !== undefined && s >= px) { alert('A stop must be below the current price.'); return }
          if (p.stop !== undefined && s !== undefined && s < p.stop && !confirm('This moves your stop FURTHER away and increases risk. It will be recorded in the process review. Continue?')) return
          save(setStopTarget(acc, p.sym, s, t))
        }} className="rounded-lg bg-accent px-3 text-xs font-semibold text-white">Save</button>
      </div>
      <button onClick={() => { if (confirm(acc.mode === 'practice' ? `Queue a market sell of all ${p.qty} shares for the next open?` : `Sell all ${p.qty} shares at the last entered price ${inr2(px)}?`)) sellAll() }}
        className="mt-2 w-full rounded-lg border border-down/40 py-1.5 text-xs font-semibold text-down">{acc.mode === 'practice' ? 'Sell all at next open' : `Sell all at ${inr2(px)}`}</button>
    </div>
  )
}

function EquityCurve({ points, base }: { points: { time: number; value: number }[]; base: number }) {
  if (points.length < 2) return <p className="text-sm text-muted">The equity curve appears after a few sessions or price updates.</p>
  const W = 320, H = 140, pad = 6
  const vals = points.map((p) => p.value)
  const lo = Math.min(base, ...vals), hi = Math.max(base, ...vals)
  const x = (i: number) => pad + (i / (points.length - 1)) * (W - 2 * pad)
  const y = (v: number) => pad + ((hi - v) / (hi - lo || 1)) * (H - 2 * pad)
  const d = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(' ')
  const up = vals[vals.length - 1] >= base
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      <line x1={pad} x2={W - pad} y1={y(base)} y2={y(base)} strokeDasharray="4 3" className="stroke-muted" />
      <text x={pad} y={y(base) - 3} className="fill-muted text-[9px]">start {inr0(base)}</text>
      <path d={d} fill="none" strokeWidth="2" className={up ? 'stroke-up' : 'stroke-down'} />
    </svg>
  )
}

export function PerformancePage({ mode: m }: { mode?: string }) {
  const mode = m === 'real' ? 'real' : 'practice'
  const { state } = useStore()
  const acc = state.sim[mode]
  return (
    <div>
      <Header title="Performance" subtitle="Results — and the quality of your decisions" back={`/trade/${mode}`} />
      <Tabs mode={mode} path="/performance" />
      {!acc ? <NoAccount mode={mode} /> : <PerformanceBody acc={acc} />}
    </div>
  )
}

function PerformanceBody({ acc }: { acc: Account }) {
  const price = priceFn(acc)
  const mt = metrics(acc, price)
  const fmt = (v: number | null, f: (x: number) => string) => (v === null ? '—' : f(v))
  const cells: [string, string, string?][] = [
    ['Total return', pctS(mt.totalReturn), mt.totalReturn >= 0 ? 'text-up' : 'text-down'],
    ['Equity', inr0(mt.equity)],
    ['Realised P&L', inr0(mt.realised), mt.realised >= 0 ? 'text-up' : 'text-down'],
    ['Unrealised P&L', inr0(mt.unrealised), mt.unrealised >= 0 ? 'text-up' : 'text-down'],
    ['Closed trades', String(mt.trades)],
    ['Win rate', fmt(mt.winRate, (x) => `${(x * 100).toFixed(0)}%`)],
    ['Average profit', fmt(mt.avgWin, inr0), 'text-up'],
    ['Average loss', fmt(mt.avgLoss, inr0), 'text-down'],
    ['Profit factor', fmt(mt.profitFactor, (x) => x.toFixed(2))],
    ['Expectancy', fmt(mt.expectancyR, (x) => `${x.toFixed(2)}R / trade`)],
    ['Max drawdown', `${(mt.maxDrawdown * 100).toFixed(1)}%`, mt.maxDrawdown > 0.15 ? 'text-down' : ''],
    ['Avg risk / trade', fmt(mt.avgRiskPct, (x) => `${(x * 100).toFixed(2)}% of capital`)],
    ['Charges paid', inr0(mt.costs)],
    ['Process score', fmt(mt.avgProcess, (x) => `${Math.round(x * 100)}%`)],
  ]
  const good = (t: ClosedTrade) => t.review.score / t.review.max >= 0.7
  const quad = {
    gw: acc.closed.filter((t) => good(t) && t.netPnl > 0).length, gl: acc.closed.filter((t) => good(t) && t.netPnl <= 0).length,
    bw: acc.closed.filter((t) => !good(t) && t.netPnl > 0).length, bl: acc.closed.filter((t) => !good(t) && t.netPnl <= 0).length,
  }
  const insights: string[] = []
  if (mt.trades === 0) insights.push('Close a few trades to see insights.')
  if (mt.avgWin !== null && mt.avgLoss !== null && Math.abs(mt.avgLoss) > mt.avgWin) insights.push('Your average loss is larger than your average profit — cut losers sooner or let winners run longer.')
  if (acc.closed.some((t) => t.initialStop === undefined)) insights.push(`${acc.closed.filter((t) => t.initialStop === undefined).length} trade(s) had no stop-loss at entry.`)
  if (acc.closed.some((t) => t.review.notes.some((n) => n.text.startsWith('Moved the stop')))) insights.push('You widened a stop at least once — decide risk before entry and stick to it.')
  if (mt.avgRiskPct !== null && mt.avgRiskPct > 0.02) insights.push('Your average risk per trade is above 2% of capital — a losing streak could hurt badly.')
  if (quad.bw > 0) insights.push(`${quad.bw} winning trade(s) came from a weak process — treat those profits as luck, not skill.`)
  if (quad.gl > 0) insights.push(`${quad.gl} losing trade(s) followed a good process — that is normal variance. Keep going.`)
  if (mt.trades >= 5 && mt.expectancyR !== null && mt.expectancyR > 0) insights.push('Positive expectancy so far — but small samples are unreliable. Aim for 30+ trades before drawing conclusions.')
  const holdDays = (t: ClosedTrade) => (t.closedAt - t.openedAt) / 86400
  const st = acc.closed.filter((t) => holdDays(t) <= 365).reduce((a, t) => a + t.netPnl, 0)
  const lt = acc.closed.filter((t) => holdDays(t) > 365).reduce((a, t) => a + t.netPnl, 0)
  const tax = taxEstimate(st, lt)

  return (
    <>
      <section className="mb-3 rounded-2xl border border-line bg-card p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Equity curve</h3>
        <EquityCurve points={[...acc.equity, { time: Date.now() / 1000, value: mt.equity }]} base={acc.startCapital} />
      </section>
      <div className="mb-3 grid grid-cols-2 gap-2">
        {cells.map(([k, v, cls]) => (
          <div key={k} className="rounded-xl border border-line bg-card p-2.5"><div className="text-[11px] text-muted">{k}</div><div className={`font-bold tabular ${cls ?? ''}`}>{v}</div></div>
        ))}
      </div>
      <section className="mb-3 rounded-2xl border border-line bg-card p-3 text-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Process vs outcome</h3>
        <div className="grid grid-cols-[auto_1fr_1fr] gap-1 text-center text-xs">
          <span /><span className="text-muted">Profit</span><span className="text-muted">Loss</span>
          <span className="text-left text-muted">Good process</span><span className="rounded-lg bg-up/15 p-2"><b>{quad.gw}</b><br />deserved</span><span className="rounded-lg bg-accent/15 p-2"><b>{quad.gl}</b><br />bad luck — fine</span>
          <span className="text-left text-muted">Weak process</span><span className="rounded-lg bg-warn/15 p-2"><b>{quad.bw}</b><br />lucky — danger</span><span className="rounded-lg bg-down/15 p-2"><b>{quad.bl}</b><br />deserved</span>
        </div>
        <p className="mt-2 text-xs text-muted">Process = setup named, reason written, stop at entry, risk ≤ 2%, reward:risk ≥ 1.5, position ≤ 25%, stop never widened (and not a revenge trade).</p>
      </section>
      <section className="mb-3 rounded-2xl border border-line bg-card p-3 text-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Insights</h3>
        <ul className="grid gap-1">{insights.map((x) => <li key={x}>• {x}</li>)}</ul>
      </section>
      <section className="mb-3 rounded-2xl border border-line bg-card p-3 text-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Illustrative tax on realised gains</h3>
        <div className="grid grid-cols-2 gap-1 text-xs">
          <span className="text-muted">Short-term net</span><span className="text-right tabular">{inr0(st)}</span>
          <span className="text-muted">Long-term net</span><span className="text-right tabular">{inr0(lt)}</span>
          <span className="text-muted">Estimated tax incl. cess</span><span className="text-right font-semibold tabular">{inr0(tax.total)}</span>
        </div>
        <p className="mt-2 text-[11px] text-muted">{TAX_NOTE}</p>
      </section>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" className="text-sm" onClick={() => go(`/portfolio/${acc.mode}`)}>Trade history</Button>
        <Button variant="secondary" className="text-sm" onClick={() => go('/learn/m8')}>Risk lessons</Button>
      </div>
    </>
  )
}

export function RiskToolsPage() {
  const { state } = useStore()
  const p = state.sim.practice
  const defCap = p ? Math.round(equityOf(p, priceFn(p))) : 100000
  const [cap, setCap] = useState(String(defCap))
  const [risk, setRisk] = useState('1')
  const [entry, setEntry] = useState('500')
  const [stop, setStop] = useState('475')
  const [target, setTarget] = useState('550')
  const [val, setVal] = useState('100000')
  const [product, setProduct] = useState<Product>('delivery')
  const [plan, setPlan] = useState<BrokeragePlan>('zero')
  const [stg, setStg] = useState('50000')
  const [ltg, setLtg] = useState('200000')
  const n = (s: string) => Number(s.replace(/,/g, '')) || 0
  const ps = positionSize(n(cap), n(risk) / 100, n(entry), n(stop))
  const rr = n(entry) > n(stop) ? (n(target) - n(entry)) / (n(entry) - n(stop)) : 0
  const be = rr > 0 ? 1 / (1 + rr) : null
  const buy = charges('buy', n(val), plan, product), sell = charges('sell', n(val), plan, product)
  const tax = taxEstimate(n(stg), n(ltg))
  const inp = 'h-10 w-full rounded-lg border border-line bg-card2 px-2 text-right text-fg tabular'
  const F = ({ l, v, s }: { l: string; v: string; s: (x: string) => void }) => <label className="grid grid-cols-[1fr_120px] items-center gap-2 text-sm"><span className="text-muted">{l}</span><input inputMode="decimal" value={v} onChange={(e) => s(e.target.value)} className={inp} /></label>
  const rowsC: [string, keyof typeof buy][] = [['Brokerage', 'brokerage'], ['STT', 'stt'], ['Exchange charges', 'exchange'], ['SEBI fee', 'sebi'], ['Stamp duty', 'stamp'], ['GST', 'gst'], ['DP charge', 'dp'], ['Total', 'total']]
  return (
    <div>
      <Header title="Risk tools" subtitle="Calculators for every trade" back="/trade" />
      <section className="mb-3 grid gap-2 rounded-2xl border border-line bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Position size</h3>
        {F({ l: 'Capital ₹', v: cap, s: setCap })}{F({ l: 'Risk per trade %', v: risk, s: setRisk })}{F({ l: 'Entry ₹', v: entry, s: setEntry })}{F({ l: 'Stop-loss ₹', v: stop, s: setStop })}
        <div className="rounded-xl bg-card2 p-3 text-sm">
          {ps.qty > 0 ? <>Buy <b className="tabular">{ps.qty}</b> shares · position {inr0(ps.value)} ({((ps.value / n(cap)) * 100).toFixed(1)}% of capital) · max loss {inr0(ps.risk)}
            {ps.value / n(cap) > 0.25 && <div className="text-warn">Position above 25% of capital — consider capping it.</div>}</> : <span className="text-muted">The stop must be below the entry.</span>}
        </div>
      </section>
      <section className="mb-3 grid gap-2 rounded-2xl border border-line bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Reward : risk and break-even win rate</h3>
        {F({ l: 'Target ₹', v: target, s: setTarget })}
        <div className="rounded-xl bg-card2 p-3 text-sm">Reward : risk <b>{rr.toFixed(2)} : 1</b>{be !== null && <> · you need to win more than <b>{(be * 100).toFixed(0)}%</b> of such trades to break even (before costs)</>}.</div>
      </section>
      <section className="mb-3 grid gap-2 rounded-2xl border border-line bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Charges calculator</h3>
        {F({ l: 'Trade value ₹', v: val, s: setVal })}
        <div className="grid grid-cols-2 gap-2">
          <select value={product} onChange={(e) => setProduct(e.target.value as Product)} className="h-10 rounded-lg border border-line bg-card2 px-2 text-sm text-fg"><option value="delivery">Delivery</option><option value="intraday">Intraday</option></select>
          <select value={plan} onChange={(e) => setPlan(e.target.value as BrokeragePlan)} className="h-10 rounded-lg border border-line bg-card2 px-2 text-sm text-fg">{Object.entries(PLAN_LABELS).map(([k, l]) => <option key={k} value={k}>{l.split(':')[0]}</option>)}</select>
        </div>
        <div className="overflow-hidden rounded-xl border border-line text-xs">
          <div className="grid grid-cols-3 bg-card2 px-2 py-1.5 font-semibold"><span>Charge</span><span className="text-right">Buy</span><span className="text-right">Sell</span></div>
          {rowsC.map(([l, k]) => <div key={k} className={`grid grid-cols-3 border-t border-line px-2 py-1.5 ${k === 'total' ? 'font-bold' : ''}`}><span>{l}</span><span className="text-right tabular">{inr2(buy[k])}</span><span className="text-right tabular">{inr2(sell[k])}</span></div>)}
        </div>
        <div className="text-sm">Round trip ≈ <b>{inr2(buy.total + sell.total)}</b> = {n(val) ? (((buy.total + sell.total) / n(val)) * 100).toFixed(3) : 0}% — the price must move this much just to break even.</div>
        <p className="text-[11px] text-muted">{CHARGES_NOTE}</p>
      </section>
      <section className="mb-3 grid gap-2 rounded-2xl border border-line bg-card p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Capital-gains tax estimate</h3>
        {F({ l: 'Short-term gains (net) ₹', v: stg, s: setStg })}{F({ l: 'Long-term gains (net) ₹', v: ltg, s: setLtg })}
        <div className="rounded-xl bg-card2 p-3 text-sm">STCG {inr0(tax.stcg)} + LTCG {inr0(tax.ltcg)} + cess {inr0(tax.cess)} = <b>{inr0(tax.total)}</b></div>
        <p className="text-[11px] text-muted">{TAX_NOTE}</p>
      </section>
      <section className="mb-3 rounded-2xl border border-line bg-card p-3 text-sm">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Loss recovery</h3>
        <div className="grid grid-cols-3 gap-1 text-center text-xs">{[10, 20, 30, 40, 50, 75].map((l) => <div key={l} className="rounded-lg bg-card2 p-2">−{l}% needs<br /><b className="text-up">+{((1 / (1 - l / 100) - 1) * 100).toFixed(0)}%</b></div>)}</div>
      </section>
    </div>
  )
}
