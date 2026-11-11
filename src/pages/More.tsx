import { useEffect, useRef, useState } from 'react'
import { useStore, normalize, type Theme } from '../lib/store'
import { go } from '../router'
import { Button, Card, Chip, Header } from '../components/ui'
import { useInstallPrompt, isStandalone } from '../lib/install'
import { NotFound } from './Learn'

export const sections: { key: string; icon: string; title: string; href: string; phase?: number }[] = [
  { key: 'home', icon: '🏠', title: 'Home dashboard', href: '/' },
  { key: 'learn', icon: '📚', title: 'Learn', href: '/learn' },
  { key: 'market', icon: '📈', title: 'Live market', href: '/soon/market', phase: 3 },
  { key: 'candles', icon: '🕯️', title: 'Candle academy', href: '/soon/candles', phase: 2 },
  { key: 'technical', icon: '📊', title: 'Technical analysis', href: '/soon/technical', phase: 2 },
  { key: 'fundamental', icon: '🏢', title: 'Fundamental analysis', href: '/soon/fundamental', phase: 3 },
  { key: 'simulator', icon: '🎮', title: 'Trading simulator', href: '/soon/simulator', phase: 4 },
  { key: 'portfolio', icon: '💼', title: 'Virtual portfolio', href: '/soon/portfolio', phase: 4 },
  { key: 'news', icon: '📰', title: 'Market news', href: '/soon/news', phase: 3 },
  { key: 'glossary', icon: '📖', title: 'Financial glossary', href: '/glossary' },
  { key: 'progress', icon: '🎯', title: 'Learning progress', href: '/progress' },
  { key: 'settings', icon: '⚙️', title: 'Settings & backup', href: '/settings' },
]

export function MorePage() {
  return (
    <div>
      <Header title="All sections" subtitle="Everything in Market Academy" />
      <div className="grid grid-cols-2 gap-3">
        {sections.map((s) => (
          <Card key={s.key} onClick={() => go(s.href)} className={s.phase ? 'opacity-70' : ''}>
            <div className="text-2xl">{s.icon}</div>
            <div className="mt-2 text-sm font-semibold leading-snug">{s.title}</div>
            <div className="mt-1">{s.phase ? <Chip>Phase {s.phase}</Chip> : <Chip tone="up">Ready</Chip>}</div>
          </Card>
        ))}
      </div>
    </div>
  )
}

const soon: Record<string, { title: string; phase: number; items: string[]; data: string }> = {
  candles: { title: 'Candle academy', phase: 2, items: ['Candle anatomy: open, high, low, close, body, wicks, volume, timeframe', '7 single-candle and 11 multi-candle patterns with illustrations', 'Psychology, confirmation and failure scenarios for each pattern', 'Live candle interpreter that separates developing, confirmed and failed patterns', 'Historical replay, one candle at a time'], data: 'Uses free historical price data, clearly labelled with its source and date. Replay is a simulation of past data, not live trading.' },
  technical: { title: 'Technical analysis lab', phase: 2, items: ['SMA, EMA, RSI, MACD, Bollinger Bands, VWAP, ATR, ADX, Stochastic, volume', 'Fibonacci retracement', 'Toggle indicators on an interactive chart', 'What each measures, how it is calculated, limitations and common mistakes'], data: 'Indicators are calculated inside the app from free historical data — no paid services.' },
  market: { title: 'Indian market dashboard', phase: 3, items: ['NIFTY 50, BANK NIFTY, SENSEX and sector indices', 'Stock search and watchlists', 'Daily changes, historical prices, volume, highs and lows', 'Optional US markets section'], data: 'Only legitimate free sources (such as TradingView’s free widgets and free historical datasets). Data will be labelled delayed or historical with timestamps — never presented as real-time unless verified.' },
  fundamental: { title: 'Fundamental analysis', phase: 3, items: ['Reading balance sheets, P&L and cash flow statements', 'Annual reports and quarterly earnings', 'Management quality, governance and competitive advantages', 'Comparing companies in the same sector'], data: 'Real Indian companies as examples, with the date and source of every number. No invented financials.' },
  news: { title: 'Market news & daily briefing', phase: 3, items: ['Major Indian market moves, sectors, earnings, RBI decisions', 'Global markets and geopolitical developments', 'Why each development matters to investors'], data: 'Will link to free public sources (for example RSS feeds from exchanges, RBI and news publishers) showing publication dates. Nothing will be invented.' },
  simulator: { title: 'Paper trading simulator', phase: 4, items: ['Configurable virtual capital, starting at ₹1,00,000', 'Virtual buy/sell, stop-loss, targets, position sizing', 'Risk/reward and Indian transaction-cost estimates', 'Trades judged on reasoning and risk management, not just profit'], data: 'Purely virtual. It will never connect to a real brokerage account.' },
  portfolio: { title: 'Virtual portfolio', phase: 4, items: ['Holdings and average purchase price', 'Realised and unrealised profit/loss, allocation', 'Win rate, average win/loss, maximum drawdown, total return'], data: 'Stored only on your phone, included in your backup file.' },
}

export function SoonPage({ id }: { id: string }) {
  const s = soon[id]
  if (!s) return <NotFound />
  return (
    <div>
      <Header title={s.title} subtitle={`Arrives in Phase ${s.phase}`} back="/more" />
      <Card className="mb-3 border-accent/40 bg-accent/10">
        <div className="text-sm">This section is not built yet. It is scheduled for <b>Phase {s.phase}</b>. Here is what it will include:</div>
      </Card>
      <ul className="mb-3 grid gap-2">
        {s.items.map((it) => <li key={it} className="flex gap-2 rounded-xl border border-line bg-card px-3 py-2.5 text-sm"><span className="text-accent">•</span>{it}</li>)}
      </ul>
      <Card><div className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">Data & cost plan</div><div className="text-sm">{s.data}</div></Card>
      <Button className="mt-4 w-full" onClick={() => go('/learn')}>Continue learning in the meantime</Button>
    </div>
  )
}

export function SettingsPage() {
  const { state, actions } = useStore()
  const install = useInstallPrompt()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [storage, setStorage] = useState<{ used?: number; persisted?: boolean }>({})

  useEffect(() => {
    (async () => {
      try {
        const est = await navigator.storage?.estimate?.()
        const persisted = await navigator.storage?.persisted?.()
        setStorage({ used: est?.usage, persisted })
      } catch { /* not supported */ }
    })()
  }, [])

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ app: 'market-academy', exportedAt: new Date().toISOString(), state }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `market-academy-backup-${new Date().toLocaleDateString('en-CA')}.json`
    document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(a.href), 2000)
    setMsg({ ok: true, text: 'Backup file downloaded. Keep it somewhere safe (e.g. Google Drive).' })
  }

  const importData = async (file: File) => {
    try {
      const json = JSON.parse(await file.text())
      if (json?.app !== 'market-academy' || !json.state) throw new Error('Not a Market Academy backup file.')
      if (!confirm('Replace your current progress with this backup?')) return
      actions.replaceAll(normalize(json.state))
      setMsg({ ok: true, text: `Backup restored (exported ${new Date(json.exportedAt).toLocaleString('en-IN')}).` })
    } catch (e) {
      setMsg({ ok: false, text: `Could not import: ${(e as Error).message}` })
    }
  }

  const themes: [Theme, string][] = [['dark', 'Dark'], ['light', 'Light'], ['system', 'System']]

  return (
    <div>
      <Header title="Settings" subtitle="Appearance, backup and app info" back="/more" />

      <h2 className="mb-2 text-sm font-semibold text-muted">Appearance</h2>
      <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-line bg-card p-1.5">
        {themes.map(([k, l]) => (
          <button key={k} onClick={() => actions.setTheme(k)}
            className={`min-h-11 rounded-xl text-sm font-semibold ${state.settings.theme === k ? 'bg-accent text-white' : 'text-muted'}`}>{l}</button>
        ))}
      </div>

      <h2 className="mb-2 text-sm font-semibold text-muted">Backup & restore</h2>
      <Card className="mb-5">
        <p className="mb-3 text-sm text-muted">Your progress is saved only on this phone (IndexedDB). Export a backup file regularly, and import it to restore on a new phone.</p>
        <div className="grid gap-2">
          <Button onClick={exportData}>Export backup (JSON)</Button>
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>Import backup</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = '' }} />
        </div>
        {msg && <p className={`mt-3 text-sm ${msg.ok ? 'text-up' : 'text-down'}`}>{msg.text}</p>}
        <p className="mt-3 text-xs text-muted">
          Storage used: {storage.used !== undefined ? `${(storage.used / 1024).toFixed(0)} KB` : 'unknown'} ·
          {storage.persisted ? ' protected from automatic clearing' : ' browser may clear it if the phone runs low on space — keep backups'}
        </p>
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-muted">App</h2>
      <Card className="mb-5">
        {isStandalone() ? <p className="text-sm text-up">✓ Running as an installed app.</p>
          : install.canInstall ? <Button className="w-full" onClick={install.prompt}>Install on home screen</Button>
            : <p className="text-sm text-muted">To install: open Chrome’s ⋮ menu → “Add to Home screen” or “Install app”.</p>}
        <p className="mt-3 text-sm text-muted">Works offline: all lessons, glossary and quizzes are stored on the phone after the first load.</p>
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-muted">About</h2>
      <Card className="mb-5 text-sm leading-relaxed text-muted">
        <p className="mb-2"><b className="text-fg">Market Academy · Phase 1</b> — free, open-source tools only, no accounts, no ads, no tracking.</p>
        <p className="mb-2">Educational content was written in November 2026 from general knowledge of Indian market rules in effect up to mid-2026. Rules, rates and charges change — verify current details at sebi.gov.in, nseindia.com, bseindia.com and rbi.org.in.</p>
        <p>Numerical examples use illustrative numbers unless a source is named. Nothing in this app is investment advice.</p>
      </Card>

      <h2 className="mb-2 text-sm font-semibold text-down">Danger zone</h2>
      <Button variant="danger" className="w-full" onClick={() => { if (confirm('Erase all progress, scores and settings on this phone? This cannot be undone unless you have a backup.')) { actions.reset(); setMsg({ ok: true, text: 'All progress erased.' }) } }}>
        Reset all progress
      </Button>
    </div>
  )
}
