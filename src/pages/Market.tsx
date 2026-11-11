import { useMemo, useState } from 'react'
import { stocks, stockBySym, SECTORS, INDIA_INDICES, SECTOR_INDICES, GLOBAL_MACRO, US_MARKETS, DATA_NOTE, displayName, type Stock } from '../content/market'
import { useStore } from '../lib/store'
import { useNews, timeAgo } from '../lib/news'
import { go } from '../router'
import { Button, Card, Chip, Header } from '../components/ui'
import { QuoteBoard, TVWidget } from '../components/TVWidget'
import { NotFound } from './Learn'

export function DataNote() {
  return <div className="mb-3 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-xs"><b className="text-warn">DELAYED DATA · </b>{DATA_NOTE}</div>
}

const TABS = ['India', 'Sectors', 'Movers', 'Global'] as const

export function MarketPage() {
  const { state } = useStore()
  const tabs = state.settings.showUS ? [...TABS, 'US' as const] : TABS
  const [tab, setTab] = useState<string>('India')
  return (
    <div>
      <Header title="Market" subtitle="Indian market dashboard" />
      <div className="mb-3 grid grid-cols-3 gap-2">
        <Button className="text-sm" onClick={() => go('/stocks')}>🔎 Stocks</Button>
        <Button variant="secondary" className="text-sm" onClick={() => go('/watchlists')}>⭐ Watchlists</Button>
        <Button variant="secondary" className="text-sm" onClick={() => go('/news')}>📰 Briefing</Button>
      </div>
      <DataNote />
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        {tabs.map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${tab === t ? 'border-accent bg-accent text-white' : 'border-line bg-card text-muted'}`}>{t}</button>
        ))}
      </div>
      {tab === 'India' && (
        <>
          <QuoteBoard groups={[{ name: 'Benchmarks', symbols: INDIA_INDICES }]} />
          <Card className="mt-3 text-sm leading-relaxed">
            <b>Why is NIFTY shown as an ETF?</b> NSE does not license NIFTY indices for free embeddable widgets. NIFTY BeES and Bank BeES are exchange-traded funds that track NIFTY 50 and Nifty Bank, so their percentage moves are a close guide — but their prices are not index levels. SENSEX and the BSE indices are the real index values.
          </Card>
        </>
      )}
      {tab === 'Sectors' && (
        <>
          <QuoteBoard groups={[{ name: 'BSE sector indices', symbols: SECTOR_INDICES }]} />
          <p className="mt-2 text-xs text-muted">Sector rotation: compare which sectors lead and lag. Rate-sensitive sectors (financials, realty, auto) often react to RBI news; IT to the US economy and the rupee; metals to China and global demand.</p>
        </>
      )}
      {tab === 'Movers' && (
        <>
          <TVWidget type="hotlists" height={560} config={{ exchange: 'BSE', dateRange: '1D', showChart: true, showSymbolLogo: true, showFloatingTooltip: false }} />
          <p className="mt-2 text-xs text-muted">Most active, top gainers and top losers on BSE. Big moves in small, illiquid companies are common — a list of gainers is not a list of good investments. Use the chart’s range buttons to see weekly-to-yearly highs and lows.</p>
        </>
      )}
      {tab === 'Global' && <QuoteBoard groups={[{ name: 'Currency, commodities & global', symbols: GLOBAL_MACRO }]} />}
      {tab === 'US' && (
        <>
          <QuoteBoard groups={[{ name: 'US markets (delayed)', symbols: US_MARKETS }]} />
          <p className="mt-2 text-xs text-muted">US prices are delayed. S&P 500, Nasdaq 100 and Dow are shown through ETFs that track them. Turn this section off in Settings.</p>
        </>
      )}
    </div>
  )
}

export function StockSearchPage() {
  const [q, setQ] = useState('')
  const [sector, setSector] = useState('All')
  const list = useMemo(() => {
    const t = q.trim().toLowerCase()
    return stocks.filter((s) => (sector === 'All' || s.sector === sector) && (!t || `${s.name} ${s.nse} ${s.sector}`.toLowerCase().includes(t)))
  }, [q, sector])
  const custom = q.trim().toUpperCase().replace(/[^A-Z0-9_&-]/g, '')
  return (
    <div>
      <Header title="Stocks" subtitle={`${stocks.length} large Indian companies`} back="/market" />
      <input value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Search name or symbol, e.g. Infosys, ITC"
        className="mb-3 h-12 w-full rounded-xl border border-line bg-card px-4 text-fg outline-none placeholder:text-muted focus:border-accent" />
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {['All', ...SECTORS].map((x) => (
          <button key={x} onClick={() => setSector(x)} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${sector === x ? 'border-accent bg-accent text-white' : 'border-line bg-card text-muted'}`}>{x}</button>
        ))}
      </div>
      <div className="grid gap-2">
        {list.map((s) => <StockRow key={s.sym} s={s} />)}
      </div>
      {custom.length >= 2 && !stockBySym[`BSE:${custom}`] && (
        <Card className="mt-3" onClick={() => go(`/stock/${encodeURIComponent(`BSE:${custom}`)}`)}>
          <div className="text-sm">Not in the list? Open <b>BSE:{custom}</b> directly.</div>
          <div className="text-xs text-muted">Works if that is the company’s BSE ticker on TradingView; otherwise the widget will say the symbol does not exist.</div>
        </Card>
      )}
    </div>
  )
}

function StockRow({ s }: { s: Stock }) {
  const { state } = useStore()
  const watched = state.watchlists.some((w) => w.symbols.includes(s.sym))
  return (
    <Card onClick={() => go(`/stock/${encodeURIComponent(s.sym)}`)} className="py-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0"><div className="truncate font-semibold">{s.name}</div><div className="text-xs text-muted">{s.nse} · {s.sector}</div></div>
        {watched && <span className="text-warn">★</span>}
      </div>
    </Card>
  )
}

const STOCK_TABS = ['Overview', 'Financials', 'News & filings', 'Analyse'] as const

export function StockPage({ sym }: { sym: string }) {
  const { state, actions } = useStore()
  const [tab, setTab] = useState<(typeof STOCK_TABS)[number]>('Overview')
  const [list, setList] = useState(state.watchlists[0]?.id)
  const { data } = useNews()
  if (!/^[A-Z_]+:[A-Z0-9_&!.-]+$/.test(sym)) return <NotFound />
  const st = stockBySym[sym]
  const name = st?.name ?? displayName(sym)
  const nse = st?.nse ?? sym.split(':')[1]
  const wl = state.watchlists.find((w) => w.id === list) ?? state.watchlists[0]
  const watched = wl.symbols.includes(sym)
  const firstWord = name.split(/[\s(]/)[0].replace(/[^A-Za-z&.-]/g, '')
  const keywords = [name.toLowerCase(), nse.toLowerCase(), ...(firstWord.length >= 4 ? [firstWord.toLowerCase()] : [])]
  const related = (data?.items ?? []).filter((n) => keywords.some((k) => n.title.toLowerCase().includes(k))).slice(0, 12)
  const peers = st ? stocks.filter((x) => x.sector === st.sector && x.sym !== sym) : []

  return (
    <div>
      <Header title={name} subtitle={`${sym}${st ? ` · ${st.sector}` : ''}`} back="/stocks"
        right={<button aria-label="Watch" onClick={() => actions.toggleWatch(wl.id, sym)} className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-lg ${watched ? 'text-warn' : 'text-muted'}`}>{watched ? '★' : '☆'}</button>} />
      {state.watchlists.length > 1 && (
        <select value={wl.id} onChange={(e) => setList(e.target.value)} className="mb-3 h-10 w-full rounded-xl border border-line bg-card px-3 text-sm text-fg">
          {state.watchlists.map((w) => <option key={w.id} value={w.id}>Star adds to: {w.name}</option>)}
        </select>
      )}
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        {STOCK_TABS.map((t) => <button key={t} onClick={() => setTab(t)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${tab === t ? 'border-accent bg-accent text-white' : 'border-line bg-card text-muted'}`}>{t}</button>)}
      </div>

      {tab === 'Overview' && (
        <>
          <TVWidget type="single-quote" height={110} caption={false} config={{ symbol: sym }} />
          <div className="mt-3">
            <TVWidget type="advanced-chart" height={460} config={{ symbol: sym, interval: 'D', timezone: 'Asia/Kolkata', style: '1', allow_symbol_change: false, hide_side_toolbar: true, withdateranges: true, save_image: false, calendar: false, support_host: 'https://www.tradingview.com' }} />
          </div>
          <Card className="mt-3 text-sm leading-relaxed">
            <b>Reading this chart:</b> each candle is one day (change the timeframe at the top of the chart). Volume bars sit underneath. Use the range buttons (1M, 1Y, 5Y…) to find the 52-week high and low and the long-term trend. Practise reading candles in the <a className="text-accent" href="#/interpreter">Candle interpreter</a> first.
          </Card>
        </>
      )}

      {tab === 'Financials' && (
        <>
          <TVWidget type="financials" height={760} config={{ symbol: sym, displayMode: 'regular' }} />
          <Card className="mt-3 text-sm leading-relaxed">
            <b>Source and dates:</b> figures come from TradingView’s fundamental data for this company. The widget shows the fiscal year end and the latest fiscal period (FQ = latest quarter, TTM = trailing twelve months). Amounts use K/M/B/T (thousand, million, billion, trillion) in rupees — <b>₹1 B = ₹100 crore</b>, <b>₹1 T = ₹1 lakh crore</b>.
            <div className="mt-2">Check every important number against the company’s annual report before relying on it.</div>
          </Card>
          <Card className="mt-3 text-sm">
            <b>What to look at first</b>
            <ul className="mt-1 list-disc pl-5 leading-relaxed">
              <li>Valuation: P/E, P/B, EV/EBITDA — compare with sector peers (<a className="text-accent" href="#/glossary/pe">what is P/E?</a>)</li>
              <li>Income statement: revenue and net income trend, margins (<a className="text-accent" href="#/lesson/m6-l1">P&L lesson</a>)</li>
              <li>Balance sheet: debt to equity, current ratio, book value (<a className="text-accent" href="#/lesson/m6-l2">balance sheet lesson</a>)</li>
              <li>Cash flow: operating cash flow vs net income, free cash flow (<a className="text-accent" href="#/lesson/m6-l3">cash flow lesson</a>)</li>
            </ul>
          </Card>
        </>
      )}

      {tab === 'News & filings' && (
        <>
          <h2 className="mb-2 text-sm font-semibold text-muted">Official announcements and filings</h2>
          <div className="grid gap-2">
            <ExtLink href={`https://www.nseindia.com/get-quotes/equity?symbol=${encodeURIComponent(nse)}`} title="NSE company page" text="Corporate announcements, results, shareholding pattern (official)" />
            <ExtLink href="https://www.bseindia.com/corporates/ann.html" title="BSE corporate announcements" text={`Search “${name}” for filings, results and board meetings (official)`} />
            <ExtLink href={`https://www.screener.in/company/${encodeURIComponent(nse)}/`} title="Screener.in (free)" text="10-year financials, annual reports and concall transcripts in one place" />
          </div>
          <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Recent headlines mentioning {name}</h2>
          {related.length === 0 ? <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">No headlines in the last few days’ collected news mention this company.</p> : (
            <div className="grid gap-2">{related.map((n) => <NewsRow key={n.link} n={n} />)}</div>
          )}
        </>
      )}

      {tab === 'Analyse' && (
        <>
          <Card className="mb-3 text-sm leading-relaxed">
            <b>Analyse {name} step by step</b>
            <ol className="mt-1 list-decimal pl-5">
              <li>Understand the business: what it sells, who buys, how it makes money (annual report).</li>
              <li>Read 5+ years of revenue, profit and margins — is growth steady?</li>
              <li>Check balance-sheet strength: debt, interest coverage, cash.</li>
              <li>Check cash conversion: does profit turn into operating cash?</li>
              <li>Judge management and governance: promoter holding, pledges, related-party deals.</li>
              <li>Find the competitive advantage and industry conditions.</li>
              <li>Value it versus peers and its own history.</li>
            </ol>
          </Card>
          <div className="grid gap-2">
            <Button onClick={() => go(`/worksheet/new/${encodeURIComponent(sym)}`)}>Start an analysis worksheet</Button>
            {peers.length > 0 && <Button variant="secondary" onClick={() => go(`/compare/${encodeURIComponent([sym, peers[0].sym].join(','))}`)}>Compare with {peers[0].name}</Button>}
            <Button variant="secondary" onClick={() => go('/learn/m6')}>Fundamental analysis lessons</Button>
          </div>
          {peers.length > 0 && (
            <>
              <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Sector peers</h2>
              <div className="flex flex-wrap gap-2">{peers.map((p) => <button key={p.sym} onClick={() => go(`/stock/${encodeURIComponent(p.sym)}`)} className="rounded-full border border-line bg-card px-3 py-1.5 text-sm">{p.name}</button>)}</div>
            </>
          )}
        </>
      )}
    </div>
  )
}

export function ExtLink({ href, title, text }: { href: string; title: string; text: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-line bg-card px-3 py-2.5">
      <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{title}</span><span className="text-accent">↗</span></div>
      <div className="text-xs text-muted">{text}</div>
    </a>
  )
}

export function NewsRow({ n }: { n: { title: string; link: string; source: string; published: string | null; kind: string } }) {
  return (
    <a href={n.link} target="_blank" rel="noopener noreferrer" className="block rounded-xl border border-line bg-card px-3 py-2.5">
      <div className="text-sm font-medium leading-snug">{n.title}</div>
      <div className="mt-1 flex items-center gap-2 text-xs text-muted">
        {n.kind === 'official' && <Chip tone="accent">official</Chip>}
        <span>{n.source}</span><span>·</span><span>{timeAgo(n.published)}</span><span className="ml-auto text-accent">↗</span>
      </div>
    </a>
  )
}

export function WatchlistsPage() {
  const { state, actions } = useStore()
  const [active, setActive] = useState(state.watchlists[0].id)
  const wl = state.watchlists.find((w) => w.id === active) ?? state.watchlists[0]
  return (
    <div>
      <Header title="Watchlists" subtitle="Saved on this phone" back="/market" />
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        {state.watchlists.map((w) => (
          <button key={w.id} onClick={() => setActive(w.id)} className={`shrink-0 rounded-full border px-4 py-1.5 text-sm ${wl.id === w.id ? 'border-accent bg-accent text-white' : 'border-line bg-card text-muted'}`}>{w.name} ({w.symbols.length})</button>
        ))}
        <button onClick={() => { const n = prompt('Name for the new watchlist'); if (n?.trim()) actions.addWatchlist(n.trim()) }} className="shrink-0 rounded-full border border-dashed border-line px-4 py-1.5 text-sm text-muted">+ New</button>
      </div>
      {wl.symbols.length === 0 ? (
        <Card className="text-sm text-muted">This watchlist is empty. Open any stock and tap ☆ to add it.<Button className="mt-3 w-full" onClick={() => go('/stocks')}>Browse stocks</Button></Card>
      ) : (
        <>
          <QuoteBoard groups={[{ name: wl.name, symbols: wl.symbols.map((x) => ({ name: x, displayName: displayName(x) })) }]} />
          <h2 className="mt-4 mb-2 text-sm font-semibold text-muted">Manage</h2>
          <div className="grid gap-2">
            {wl.symbols.map((x) => (
              <div key={x} className="flex items-center gap-2 rounded-xl border border-line bg-card px-3 py-2">
                <button onClick={() => go(`/stock/${encodeURIComponent(x)}`)} className="min-w-0 flex-1 truncate text-left text-sm font-medium">{displayName(x)} <span className="text-muted">· {x}</span></button>
                <button onClick={() => actions.toggleWatch(wl.id, x)} className="rounded-lg border border-down/40 px-2 py-1 text-xs text-down">Remove</button>
              </div>
            ))}
          </div>
        </>
      )}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button variant="secondary" className="text-sm" onClick={() => { const n = prompt('Rename watchlist', wl.name); if (n?.trim()) actions.renameWatchlist(wl.id, n.trim()) }}>Rename</Button>
        <Button variant="danger" className="text-sm" disabled={state.watchlists.length <= 1} onClick={() => { if (confirm(`Delete “${wl.name}”?`)) { actions.deleteWatchlist(wl.id); setActive(state.watchlists[0].id) } }}>Delete list</Button>
      </div>
    </div>
  )
}
