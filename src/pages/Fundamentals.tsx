import { useMemo, useState } from 'react'
import { stocks, stockBySym, SECTORS, displayName } from '../content/market'
import { moduleById } from '../content'
import { useStore, type Worksheet } from '../lib/store'
import { computeRatios, fmtRatio, FIELD_GROUPS, type Ratio } from '../lib/fundamentals'
import { go } from '../router'
import { Button, Card, Chip, Header } from '../components/ui'
import { TVWidget } from '../components/TVWidget'

const FIN_SECTORS = ['Banks', 'Financial services']
const isFinancial = (sector: string) => FIN_SECTORS.includes(sector)

export function FundamentalsPage() {
  const { state } = useStore()
  const m6 = moduleById['m6']
  const [sector, setSector] = useState<string>('IT services')
  const peers = stocks.filter((s) => s.sector === sector)
  const sheets = Object.values(state.worksheets)
  return (
    <div>
      <Header title="Fundamental analysis" subtitle="Analyse and compare companies" />
      <h2 className="mb-2 text-sm font-semibold text-muted">1 · Learn the method (Module 6)</h2>
      <div className="grid gap-2">
        {m6.lessons.map((l) => (
          <button key={l.id} onClick={() => go(`/lesson/${l.id}`)} className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-left text-sm">
            <span className="font-medium">{l.title}</span>{state.lessons[l.id]?.completedAt ? <span className="text-up">✓</span> : <span className="text-accent">→</span>}
          </button>
        ))}
      </div>

      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">2 · Compare companies in a sector</h2>
      <select value={sector} onChange={(e) => setSector(e.target.value)} className="mb-2 h-11 w-full rounded-xl border border-line bg-card px-3 text-fg">
        {SECTORS.map((x) => <option key={x}>{x}</option>)}
      </select>
      <div className="mb-2 flex flex-wrap gap-2">
        {peers.map((p) => <button key={p.sym} onClick={() => go(`/stock/${encodeURIComponent(p.sym)}`)} className="rounded-full border border-line bg-card px-3 py-1.5 text-sm">{p.name}</button>)}
      </div>
      <Button className="w-full" onClick={() => go(`/compare/${encodeURIComponent(peers.slice(0, 2).map((p) => p.sym).join(','))}`)}>Compare {peers[0]?.name} and {peers[1]?.name}</Button>

      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">3 · Your analysis worksheets ({sheets.length})</h2>
      <Card className="mb-2 text-sm text-muted">Copy key numbers from an annual report into a worksheet. The app calculates the ratios, flags strengths and weaknesses, and compares companies side by side. You record the source and date, so nothing is ever invented.</Card>
      <div className="grid gap-2">
        {sheets.sort((a, b) => b.updatedAt - a.updatedAt).map((w) => (
          <Card key={w.id} onClick={() => go(`/worksheet/${w.id}`)} className="py-3">
            <div className="font-semibold">{w.name}</div>
            <div className="text-xs text-muted">{w.sector} · {w.source || 'no source noted'} · as of {w.asOf || '—'}</div>
          </Card>
        ))}
        <Button variant="secondary" onClick={() => go('/worksheet/new/_')}>+ New worksheet</Button>
        {sheets.length >= 2 && <Button variant="secondary" onClick={() => go('/compare-sheets')}>Compare my worksheets</Button>}
      </div>
    </div>
  )
}

export function ComparePage({ syms }: { syms: string }) {
  const list = syms.split(',').filter((x) => /^[A-Z_]+:[A-Z0-9_&-]+$/.test(x)).slice(0, 3)
  const [sel, setSel] = useState(list)
  const sector = stockBySym[sel[0]]?.sector
  const options = stocks.filter((s) => !sector || s.sector === sector)
  const [active, setActive] = useState(0)
  const set = (i: number, v: string) => { const n = [...sel]; n[i] = v; setSel(n); go(`/compare/${encodeURIComponent(n.join(','))}`) }
  const cur = sel[Math.min(active, sel.length - 1)]
  return (
    <div>
      <Header title="Compare companies" subtitle={sector ? `${sector} sector` : 'Same-sector comparison'} back="/fundamentals" />
      <div className="mb-3 grid gap-2">
        {sel.map((s, i) => (
          <select key={i} value={s} onChange={(e) => set(i, e.target.value)} className="h-11 rounded-xl border border-line bg-card px-3 text-fg">
            {options.map((o) => <option key={o.sym} value={o.sym}>{o.name}</option>)}
          </select>
        ))}
        {sel.length < 3 && options.length > sel.length && <Button variant="secondary" className="text-sm" onClick={() => set(sel.length, options.find((o) => !sel.includes(o.sym))!.sym)}>+ Add a third company</Button>}
      </div>
      <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl border border-line bg-card p-1">
        {sel.map((s, i) => <button key={s} onClick={() => setActive(i)} className={`truncate rounded-lg px-2 py-2 text-xs font-semibold ${cur === s ? 'bg-accent text-white' : 'text-muted'}`}>{displayName(s)}</button>)}
      </div>
      <TVWidget key={cur} type="financials" height={760} config={{ symbol: cur, displayMode: 'regular' }} />
      <Card className="mt-3 text-sm leading-relaxed">
        <b>How to compare</b>
        <ul className="mt-1 list-disc pl-5">
          <li>Switch between companies with the tabs and note the same lines: revenue, net income, operating margin, ROE, debt to equity, operating cash flow, P/E, EV/EBITDA.</li>
          <li>Check both widgets show the same fiscal period before comparing.</li>
          <li>{sector && isFinancial(sector) ? 'For banks and lenders, focus on P/B, ROE and asset quality; debt ratios are not meaningful.' : 'A higher P/E is only justified by faster, more reliable growth or higher returns on capital.'}</li>
          <li>Want a clean side-by-side table? Enter each company’s numbers in a worksheet, then use “Compare my worksheets”.</li>
        </ul>
      </Card>
    </div>
  )
}

const verdictTone = (v: Ratio['verdict']) => (v === 'good' ? 'up' : v === 'ok' ? 'warn' : v === 'weak' ? 'down' : 'muted') as 'up' | 'warn' | 'down' | 'muted'

export function WorksheetPage({ id, sym }: { id: string; sym?: string }) {
  const { state, actions } = useStore()
  const existing = state.worksheets[id]
  const preset = sym && stockBySym[sym]
  const [w, setW] = useState<Worksheet>(() => existing ?? {
    id: `ws${Date.now()}`, symbol: preset ? preset.sym : '', name: preset ? preset.name : '', sector: preset ? preset.sector : SECTORS[0],
    source: '', asOf: '', notes: '', fields: {}, updatedAt: Date.now(),
  })
  const [saved, setSaved] = useState(!!existing)
  const ratios = useMemo(() => computeRatios(w.fields, isFinancial(w.sector)), [w.fields, w.sector])
  const upd = (patch: Partial<Worksheet>) => { setW((x) => ({ ...x, ...patch })); setSaved(false) }
  const setField = (k: string, raw: string) => {
    const v = raw.trim() === '' ? undefined : Number(raw.replace(/,/g, ''))
    upd({ fields: { ...w.fields, [k]: v !== undefined && Number.isFinite(v) ? v : undefined } })
  }
  const flagged = ratios.filter((r) => r.verdict)
  return (
    <div>
      <Header title={w.name || 'New worksheet'} subtitle="Company analysis worksheet" back="/fundamentals" />
      <Card className="mb-3">
        <label className="mb-2 block text-sm"><span className="text-muted">Company</span>
          <select value={w.symbol} onChange={(e) => { const s = stockBySym[e.target.value]; upd(s ? { symbol: s.sym, name: s.name, sector: s.sector } : { symbol: '' }) }}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-card2 px-3 text-fg">
            <option value="">Other company (type below)</option>
            {stocks.map((s) => <option key={s.sym} value={s.sym}>{s.name}</option>)}
          </select>
        </label>
        {!w.symbol && <input value={w.name} onChange={(e) => upd({ name: e.target.value })} placeholder="Company name" className="mb-2 h-11 w-full rounded-xl border border-line bg-card2 px-3 text-fg" />}
        {!w.symbol && (
          <select value={w.sector} onChange={(e) => upd({ sector: e.target.value })} className="mb-2 h-11 w-full rounded-xl border border-line bg-card2 px-3 text-fg">
            {SECTORS.map((x) => <option key={x}>{x}</option>)}
          </select>
        )}
        <input value={w.source} onChange={(e) => upd({ source: e.target.value })} placeholder="Source, e.g. Annual Report FY2026, consolidated" className="mb-2 h-11 w-full rounded-xl border border-line bg-card2 px-3 text-fg" />
        <input value={w.asOf} onChange={(e) => upd({ asOf: e.target.value })} placeholder="Period / date, e.g. FY ended 31 Mar 2026; price on 10 Nov 2026" className="h-11 w-full rounded-xl border border-line bg-card2 px-3 text-fg" />
      </Card>
      <p className="mb-2 text-xs text-muted">Enter amounts in <b>₹ crore</b> (1 crore = 1,00,00,000). Leave unknown fields blank. Use consolidated figures for groups.</p>
      {FIELD_GROUPS.map((gr) => (
        <section key={gr.title} className="mb-3 rounded-2xl border border-line bg-card p-3">
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{gr.title}</h3>
          <div className="grid gap-2">
            {gr.fields.map((fd) => (
              <label key={fd.key} className="grid grid-cols-[1fr_120px] items-center gap-2 text-sm">
                <span><span className="font-medium">{fd.label}</span><span className="block text-[11px] text-muted">{fd.hint} ({fd.unit})</span></span>
                <input inputMode="decimal" defaultValue={w.fields[fd.key] ?? ''} onChange={(e) => setField(fd.key, e.target.value)}
                  className="h-10 rounded-lg border border-line bg-card2 px-2 text-right text-fg tabular" />
              </label>
            ))}
          </div>
        </section>
      ))}
      <textarea value={w.notes} onChange={(e) => upd({ notes: e.target.value })} placeholder="Notes: business model, moat, management, risks…" rows={4}
        className="mb-3 w-full rounded-2xl border border-line bg-card p-3 text-sm text-fg" />

      <section className="mb-3 rounded-2xl border border-line bg-card p-3">
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Calculated ratios</h3>
        {isFinancial(w.sector) && <p className="mb-2 text-xs text-warn">Financial company: debt-based ratios are hidden because lending businesses borrow by design.</p>}
        <div className="divide-y divide-line">
          {ratios.map((r) => (
            <div key={r.key} className="py-2">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span>{r.glossary ? <a className="text-fg underline decoration-dotted" href={`#/glossary/${r.glossary}`}>{r.label}</a> : r.label}</span>
                <span className="flex items-center gap-2"><span className="font-semibold tabular">{fmtRatio(r)}</span>{r.verdict && <Chip tone={verdictTone(r.verdict)}>{r.verdict}</Chip>}</span>
              </div>
              <div className="text-[11px] text-muted">{r.note}</div>
            </div>
          ))}
        </div>
        <p className="mt-2 text-[11px] text-muted">“good / ok / weak” are general rules of thumb, not investment advice. Judge every company against its own industry and history.</p>
      </section>
      {flagged.length > 0 && (
        <Card className="mb-3 text-sm">
          <b>Summary:</b> {flagged.filter((r) => r.verdict === 'good').length} strengths, {flagged.filter((r) => r.verdict === 'ok').length} average, {flagged.filter((r) => r.verdict === 'weak').length} weak signals.
          {flagged.some((r) => r.verdict === 'weak') && <div className="mt-1 text-down">Investigate: {flagged.filter((r) => r.verdict === 'weak').map((r) => r.label).join(', ')}.</div>}
        </Card>
      )}
      <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] grid grid-cols-2 gap-2 bg-bg/90 py-2 backdrop-blur">
        <Button disabled={!w.name.trim()} onClick={() => { actions.saveWorksheet(w); setSaved(true); if (!existing) go(`/worksheet/${w.id}`) }}>{saved ? 'Saved ✓' : 'Save'}</Button>
        {existing ? <Button variant="danger" onClick={() => { if (confirm('Delete this worksheet?')) { actions.deleteWorksheet(w.id); go('/fundamentals') } }}>Delete</Button>
          : <Button variant="secondary" onClick={() => go('/fundamentals')}>Cancel</Button>}
      </div>
    </div>
  )
}

export function CompareSheetsPage() {
  const { state } = useStore()
  const sheets = Object.values(state.worksheets).sort((a, b) => a.name.localeCompare(b.name))
  const [sel, setSel] = useState<string[]>(sheets.slice(0, 3).map((s) => s.id))
  const chosen = sheets.filter((s) => sel.includes(s.id))
  const table = chosen.map((s) => computeRatios(s.fields, isFinancial(s.sector)))
  const rows = table[0]?.map((r) => r.key) ?? []
  return (
    <div>
      <Header title="Compare worksheets" subtitle="Your own numbers, side by side" back="/fundamentals" />
      <div className="mb-3 flex flex-wrap gap-2">
        {sheets.map((s) => (
          <button key={s.id} onClick={() => setSel((x) => (x.includes(s.id) ? x.filter((y) => y !== s.id) : x.length < 4 ? [...x, s.id] : x))}
            className={`rounded-full border px-3 py-1.5 text-sm ${sel.includes(s.id) ? 'border-accent bg-accent text-white' : 'border-line bg-card text-muted'}`}>{s.name}</button>
        ))}
      </div>
      {chosen.length < 2 ? <p className="text-sm text-muted">Select at least two worksheets.</p> : (
        <div className="overflow-x-auto rounded-2xl border border-line bg-card">
          <table className="w-full min-w-[360px] text-sm">
            <thead><tr className="border-b border-line text-left text-xs text-muted"><th className="p-2">Ratio</th>{chosen.map((c) => <th key={c.id} className="p-2 text-right">{c.name}</th>)}</tr></thead>
            <tbody>
              {rows.map((key, ri) => {
                const cells = table.map((t) => t[ri])
                const vals = cells.map((c) => c.value).filter((v): v is number => v !== null)
                const better = cells[0].better
                const best = vals.length > 1 && better ? (better === 'high' ? Math.max(...vals) : Math.min(...vals)) : null
                return (
                  <tr key={key} className="border-b border-line last:border-0">
                    <td className="p-2 text-muted">{cells[0].label}</td>
                    {cells.map((c, i) => <td key={i} className={`p-2 text-right tabular ${best !== null && c.value === best ? 'font-bold text-up' : ''}`}>{fmtRatio(c)}</td>)}
                  </tr>
                )
              })}
              <tr><td className="p-2 text-muted">Source / period</td>{chosen.map((c) => <td key={c.id} className="p-2 text-right text-[11px] text-muted">{c.source || '—'} · {c.asOf || '—'}</td>)}</tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-2 text-xs text-muted">Green = best value in each row where higher or lower is clearly better. Make sure all worksheets use the same period and consolidated/standalone basis.</p>
    </div>
  )
}
