import { useState } from 'react'
import type { Account, PendingOrder, TradePlan } from '../lib/sim/engine'
import { validateOrder, positionSize, SLIPPAGE } from '../lib/sim/engine'
import { charges } from '../lib/sim/charges'
import { SETUPS } from '../content/strategies'
import { inr0, inr2 } from '../lib/sim/context'
import { Button } from './ui'

export interface TicketResult { side: 'buy' | 'sell'; type: 'market' | 'limit'; qty: number; limit?: number; stop?: number; target?: number; plan: TradePlan }

const num = (s: string) => { const v = Number(s.replace(/,/g, '')); return s.trim() === '' || !Number.isFinite(v) ? undefined : v }

/** Order ticket with a built-in risk check. `refPrice` = latest close (practice) or the price you entered (real). */
export function OrderTicket({ acc, sym, name, refPrice, equity, allowLimit, fillNote, onSubmit }: {
  acc: Account; sym: string; name: string; refPrice: number | undefined; equity: number; allowLimit: boolean; fillNote: string
  onSubmit: (r: TicketResult) => void
}) {
  const [side, setSide] = useState<'buy' | 'sell'>('buy')
  const [type, setType] = useState<'market' | 'limit'>('market')
  const [qtyS, setQty] = useState('')
  const [limitS, setLimit] = useState('')
  const [stopS, setStop] = useState('')
  const [targetS, setTarget] = useState('')
  const [riskPct, setRiskPct] = useState(0.01)
  const [setup, setSetup] = useState('')
  const [reason, setReason] = useState('')
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  const held = acc.positions[sym]?.qty ?? 0
  const qty = num(qtyS) ?? 0
  const limit = num(limitS), stop = num(stopS), target = num(targetS)
  const entry = type === 'limit' ? limit : refPrice !== undefined ? refPrice * (side === 'buy' ? 1 + SLIPPAGE : 1 - SLIPPAGE) : undefined
  const value = entry ? qty * entry : 0
  const cost = value ? charges(side, value, acc.plan).total : 0
  const riskRs = side === 'buy' && entry && stop !== undefined && stop < entry ? qty * (entry - stop) : null
  const rr = side === 'buy' && entry && stop !== undefined && target !== undefined && stop < entry ? (target - entry) / (entry - stop) : null
  const suggestion = side === 'buy' && entry && stop !== undefined ? positionSize(equity, riskPct, entry, stop) : null
  const sizeCapQty = entry ? Math.floor((equity * 0.25) / entry) : 0

  const warnings: string[] = []
  if (side === 'buy' && qty > 0) {
    if (stop === undefined) warnings.push('No stop-loss: your possible loss is undefined.')
    if (riskRs !== null && riskRs / equity > 0.02) warnings.push(`Risk is ${((riskRs / equity) * 100).toFixed(1)}% of equity — above the 2% guideline.`)
    if (value / equity > 0.25) warnings.push(`Position would be ${((value / equity) * 100).toFixed(0)}% of equity — concentrated.`)
    if (rr !== null && rr < 1.5) warnings.push(`Reward : risk is only ${rr.toFixed(2)} : 1.`)
    if (!setup || setup === 'none') warnings.push('No setup chosen — what is your edge here?')
    if (reason.trim().length < 15) warnings.push('Write a reason (at least 15 characters) — it is reviewed after the trade.')
  }

  const submit = () => {
    if (refPrice === undefined) { setMsg({ ok: false, text: 'Enter the current price first.' }); return }
    const o: Omit<PendingOrder, 'id' | 'placedAt'> = { sym, side, type, qty, limit: type === 'limit' ? limit : undefined, stop: side === 'buy' ? stop : undefined, target: side === 'buy' ? target : undefined, plan: { setup: setup || 'none', reason: reason.trim() } }
    const err = validateOrder(acc, o, refPrice)
    if (err) { setMsg({ ok: false, text: err }); return }
    if (side === 'buy' && warnings.length && !confirm(`Place this order anyway?\n\n• ${warnings.join('\n• ')}`)) return
    onSubmit({ side, type, qty, limit: o.limit, stop: o.stop, target: o.target, plan: o.plan })
    setMsg({ ok: true, text: `${side === 'buy' ? 'Buy' : 'Sell'} order for ${qty} × ${name} ${fillNote}` })
    setQty(''); setReason('')
  }

  const inputCls = 'h-11 w-full rounded-xl border border-line bg-card2 px-3 text-fg tabular'
  return (
    <section className="rounded-2xl border border-line bg-card p-3">
      <div className="mb-3 grid grid-cols-2 gap-1 rounded-xl bg-card2 p-1">
        {(['buy', 'sell'] as const).map((s) => (
          <button key={s} onClick={() => { setSide(s); setMsg(null) }} className={`rounded-lg py-2 text-sm font-bold ${side === s ? (s === 'buy' ? 'bg-up text-white' : 'bg-down text-white') : 'text-muted'}`}>{s === 'buy' ? 'BUY' : 'SELL'}</button>
        ))}
      </div>
      {side === 'sell' && <p className="mb-2 text-xs text-muted">You hold {held} shares of {name}. Short selling is not available.</p>}
      {allowLimit && (
        <div className="mb-2 grid grid-cols-2 gap-2 text-sm">
          {(['market', 'limit'] as const).map((t) => (
            <button key={t} onClick={() => setType(t)} className={`rounded-xl border py-2 ${type === t ? 'border-accent bg-accent/15 text-accent' : 'border-line text-muted'}`}>{t === 'market' ? 'Market (next open)' : 'Limit'}</button>
          ))}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-muted">Quantity<input inputMode="numeric" value={qtyS} onChange={(e) => setQty(e.target.value.replace(/\D/g, ''))} className={inputCls} placeholder={side === 'sell' ? String(held) : '0'} /></label>
        {type === 'limit' ? <label className="text-xs text-muted">Limit price ₹<input inputMode="decimal" value={limitS} onChange={(e) => setLimit(e.target.value)} className={inputCls} /></label>
          : <div className="text-xs text-muted">Reference price<div className="mt-1 flex h-11 items-center rounded-xl bg-card2 px-3 text-fg tabular">{refPrice !== undefined ? inr2(refPrice) : '—'}</div></div>}
        {side === 'buy' && <label className="text-xs text-muted">Stop-loss ₹<input inputMode="decimal" value={stopS} onChange={(e) => setStop(e.target.value)} className={inputCls} /></label>}
        {side === 'buy' && <label className="text-xs text-muted">Target ₹ (optional)<input inputMode="decimal" value={targetS} onChange={(e) => setTarget(e.target.value)} className={inputCls} /></label>}
      </div>
      {side === 'sell' && held > 0 && <button onClick={() => setQty(String(held))} className="mt-2 text-xs text-accent">Sell all {held}</button>}

      {side === 'buy' && (
        <>
          <div className="mt-3 rounded-xl bg-card2 p-2.5 text-xs">
            <div className="mb-1 flex items-center gap-1.5"><span className="text-muted">Size for risk of</span>
              {[0.005, 0.01, 0.02].map((r) => <button key={r} onClick={() => setRiskPct(r)} className={`rounded-full px-2 py-0.5 ${riskPct === r ? 'bg-accent text-white' : 'border border-line'}`}>{r * 100}%</button>)}
            </div>
            {suggestion && suggestion.qty > 0 ? (
              <div className="flex items-center justify-between gap-2">
                <span>Suggested: <b className="tabular">{Math.min(suggestion.qty, sizeCapQty)}</b> shares (risk {inr0(Math.min(suggestion.qty, sizeCapQty) * (entry! - stop!))}{suggestion.qty > sizeCapQty ? ', capped at 25% of equity' : ''})</span>
                <button onClick={() => setQty(String(Math.min(suggestion.qty, sizeCapQty)))} className="rounded-lg bg-accent px-2 py-1 font-semibold text-white">Use</button>
              </div>
            ) : <span className="text-muted">Enter a stop-loss below the price to get a suggested quantity.</span>}
          </div>
          <label className="mt-2 block text-xs text-muted">Setup
            <select value={setup} onChange={(e) => setSetup(e.target.value)} className={inputCls}>
              <option value="">Choose…</option>
              {SETUPS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </label>
          <label className="mt-2 block text-xs text-muted">Why are you taking this trade?
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. Pullback to rising 20-day average with a hammer at support; stop below the low" className="w-full rounded-xl border border-line bg-card2 p-2 text-sm text-fg" />
          </label>
        </>
      )}

      {qty > 0 && entry !== undefined && (
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 rounded-xl border border-line p-2.5 text-xs">
          <span className="text-muted">Est. value</span><span className="text-right tabular">{inr0(value)}</span>
          <span className="text-muted">Est. charges</span><span className="text-right tabular">{inr2(cost)}</span>
          <span className="text-muted">% of equity</span><span className="text-right tabular">{((value / equity) * 100).toFixed(1)}%</span>
          {riskRs !== null && <><span className="text-muted">Risk to stop</span><span className="text-right tabular">{inr0(riskRs)} ({((riskRs / equity) * 100).toFixed(2)}%)</span></>}
          {rr !== null && <><span className="text-muted">Reward : risk</span><span className="text-right tabular">{rr.toFixed(2)} : 1</span></>}
        </div>
      )}
      {warnings.length > 0 && <ul className="mt-2 list-disc pl-5 text-xs text-warn">{warnings.map((w) => <li key={w}>{w}</li>)}</ul>}
      <Button className={`mt-3 w-full ${side === 'sell' ? 'bg-down!' : 'bg-up!'}`} disabled={qty <= 0} onClick={submit}>{side === 'buy' ? 'Place buy order' : 'Place sell order'}</Button>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? 'text-up' : 'text-down'}`}>{msg.text}</p>}
    </section>
  )
}
