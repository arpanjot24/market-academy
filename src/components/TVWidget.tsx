import { useEffect, useRef, useState } from 'react'
import { useDark } from '../lib/theme'

/** Embeds a free TradingView widget. Needs internet; shows a notice when offline. */
export function TVWidget({ type, config, height, caption = true }: { type: string; config: Record<string, unknown>; height: number; caption?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  const dark = useDark()
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    addEventListener('online', on); addEventListener('offline', off)
    return () => { removeEventListener('online', on); removeEventListener('offline', off) }
  }, [])
  const json = JSON.stringify({ locale: 'en', width: '100%', height, isTransparent: true, colorTheme: dark ? 'dark' : 'light', theme: dark ? 'dark' : 'light', ...config })
  useEffect(() => {
    const el = ref.current
    if (!el || !online) return
    el.innerHTML = ''
    const inner = document.createElement('div')
    inner.className = 'tradingview-widget-container__widget'
    el.appendChild(inner)
    const sc = document.createElement('script')
    sc.type = 'text/javascript'
    sc.async = true
    sc.src = `https://s3.tradingview.com/external-embedding/embed-widget-${type}.js`
    sc.textContent = json
    el.appendChild(sc)
    return () => { el.innerHTML = '' }
  }, [type, json, online])
  if (!online) {
    return <div className="grid place-items-center rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted" style={{ minHeight: 120 }}>You are offline. Market widgets need an internet connection — lessons and saved data still work.</div>
  }
  return (
    <div>
      <div ref={ref} className="tradingview-widget-container overflow-hidden rounded-2xl border border-line bg-card" style={{ height }} />
      {caption && <p className="mt-1 text-[11px] text-muted">Widget by TradingView · data may be delayed or end-of-day · tapping inside opens tradingview.com</p>}
    </div>
  )
}

export function QuoteBoard({ groups, height }: { groups: { name: string; symbols: { name: string; displayName: string }[] }[]; height?: number }) {
  const rows = groups.reduce((a, g) => a + g.symbols.length + 1, 0)
  return <TVWidget type="market-quotes" height={height ?? Math.min(900, 60 + rows * 42)} config={{ symbolsGroups: groups, showSymbolLogo: true }} />
}
