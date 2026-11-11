import { useState } from 'react'
import { illustrations, PRE, type OHLC } from '../lib/chart/illustrations'
import { shapeName } from '../lib/chart/patterns'
import type { Candle } from '../lib/chart/types'

export function CandleStrip({ data, hl, post = 0, preCount = 0, h = 150, labels = true }: { data: OHLC[]; hl?: [number, number]; post?: number; preCount?: number; h?: number; labels?: boolean }) {
  const w = 300, pad = 8, bottom = labels ? 18 : 4
  const hi = Math.max(...data.map((d) => d[1])), lo = Math.min(...data.map((d) => d[2]))
  const y = (v: number) => pad + ((hi - v) / (hi - lo || 1)) * (h - pad - bottom - pad)
  const slot = (w - 2 * pad) / data.length
  const cw = Math.min(24, slot * 0.6)
  const xc = (i: number) => pad + (i + 0.5) * slot
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Candlestick illustration">
      {hl && <rect x={pad + hl[0] * slot + 2} y={2} width={(hl[1] - hl[0] + 1) * slot - 4} height={h - bottom - 2} rx="8" className="fill-accent" opacity="0.13" />}
      {data.map(([o, hh, l, c], i) => {
        const isPost = i >= data.length - post
        const cls = c >= o ? 'up' : 'down'
        return (
          <g key={i} opacity={isPost ? 0.45 : 1}>
            <line x1={xc(i)} x2={xc(i)} y1={y(hh)} y2={y(l)} strokeWidth="1.6" className={`stroke-${cls}`} />
            <rect x={xc(i) - cw / 2} y={y(Math.max(o, c))} width={cw} height={Math.max(1.6, Math.abs(y(o) - y(c)))} rx="1.5" className={`fill-${cls}`} />
          </g>
        )
      })}
      {labels && (
        <g className="fill-muted text-[10px]">
          {preCount > 0 && <text x={pad + (preCount * slot) / 2} y={h - 4} textAnchor="middle">prior trend</text>}
          {hl && <text x={pad + ((hl[0] + hl[1] + 1) * slot) / 2} y={h - 4} textAnchor="middle" className="fill-accent font-semibold">pattern</text>}
          {post > 0 && <text x={pad + (data.length - post / 2) * slot} y={h - 4} textAnchor="middle">confirmation</text>}
        </g>
      )}
    </svg>
  )
}

export function PatternIllustration({ id, h = 150, labels = true }: { id: string; h?: number; labels?: boolean }) {
  const ill = illustrations[id]
  if (!ill) return null
  const pre = PRE[ill.trend]
  const post = ill.post ?? []
  return <CandleStrip data={[...pre, ...ill.pat, ...post]} hl={[pre.length, pre.length + ill.pat.length - 1]} post={post.length} preCount={pre.length} h={h} labels={labels} />
}

const presets: Record<string, [number, number, number, number]> = {
  Doji: [100, 106, 94, 100.2],
  Hammer: [101, 105.5, 92, 104.5],
  'Shooting star': [98.5, 108, 95.5, 95.5],
  Marubozu: [94, 106.2, 93.8, 106],
  'Spinning top': [99, 106, 93, 101],
}

export function CandleBuilder() {
  const [v, setV] = useState({ o: 98, h: 108, l: 94, c: 105 })
  const set = (k: 'o' | 'h' | 'l' | 'c', x: number) => setV((s) => {
    const n = { ...s, [k]: x }
    if (k === 'o' || k === 'c') { n.h = Math.max(n.h, n.o, n.c); n.l = Math.min(n.l, n.o, n.c) }
    if (k === 'h') n.h = Math.max(x, n.o, n.c)
    if (k === 'l') n.l = Math.min(x, n.o, n.c)
    return n
  })
  const { o, h, l, c } = v
  const r = h - l || 1
  const W = 300, H = 220, pad = 14
  const y = (p: number) => pad + ((112 - p) / 24) * (H - 2 * pad)
  const cls = c > o ? 'up' : c < o ? 'down' : 'muted'
  const candle: Candle = { time: 0, open: o, high: h, low: l, close: c, volume: 1 }
  const shape = shapeName(candle)
  const pct = (x: number) => `${Math.round((x / r) * 100)}%`
  const label = (price: number, text: string) => (
    <g>
      <line x1="150" x2="200" y1={y(price)} y2={y(price)} strokeDasharray="3 3" className="stroke-muted" />
      <text x="204" y={y(price) + 4} className="fill-fg text-[11px]">{text} ₹{price.toFixed(1)}</text>
    </g>
  )
  return (
    <div className="my-3 rounded-2xl border border-line bg-card p-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
        <line x1="120" x2="120" y1={y(h)} y2={y(l)} strokeWidth="3" className={`stroke-${cls}`} />
        <rect x="95" y={y(Math.max(o, c))} width="50" height={Math.max(2, Math.abs(y(o) - y(c)))} rx="3" className={`fill-${cls}`} />
        {label(h, 'High')}
        {label(l, 'Low')}
        <text x="10" y={y(o) + 4} className="fill-fg text-[11px]">Open ₹{o.toFixed(1)}</text>
        <text x="10" y={y(c) + (Math.abs(y(o) - y(c)) < 14 ? 16 : 4)} className="fill-fg text-[11px] font-semibold">Close ₹{c.toFixed(1)}</text>
        <line x1="70" x2="95" y1={y(o)} y2={y(o)} className="stroke-muted" />
        <line x1="70" x2="95" y1={y(c)} y2={y(c)} className="stroke-muted" />
      </svg>
      <div className="mt-2 grid gap-2">
        {(['o', 'h', 'l', 'c'] as const).map((k) => (
          <label key={k} className="grid grid-cols-[52px_1fr_52px] items-center gap-2 text-sm">
            <span className="text-muted">{{ o: 'Open', h: 'High', l: 'Low', c: 'Close' }[k]}</span>
            <input type="range" min={88} max={112} step={0.5} value={v[k]} onChange={(e) => set(k, Number(e.target.value))} className="accent-[var(--accent)]" />
            <span className="text-right tabular">{v[k].toFixed(1)}</span>
          </label>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {Object.entries(presets).map(([name, [po, ph, pl, pc]]) => (
          <button key={name} onClick={() => setV({ o: po, h: ph, l: pl, c: pc })} className="rounded-full border border-line bg-card2 px-3 py-1 text-xs">{name}</button>
        ))}
      </div>
      <div className="mt-3 rounded-xl bg-card2 p-3 text-sm leading-relaxed">
        <div className={`font-semibold text-${cls === 'muted' ? 'fg' : cls}`}>{c > o ? 'Bullish (green): closed above its open' : c < o ? 'Bearish (red): closed below its open' : 'Neutral: closed exactly at its open'}</div>
        <div className="text-muted">Body {pct(Math.abs(c - o))} of range · upper wick {pct(h - Math.max(o, c))} · lower wick {pct(Math.min(o, c) - l)}</div>
        <div className="text-muted">Close sits {pct(c - l)} of the way up the range{(c - l) / r > 0.7 ? ' — buyers in control at the close' : (c - l) / r < 0.3 ? ' — sellers in control at the close' : ''}.</div>
        <div className="mt-1">Shape: <b>{shape ?? 'ordinary candle'}</b>{shape && ' — but its meaning depends on the trend before it.'}</div>
      </div>
    </div>
  )
}
