import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { SeriesMarker, Time, UTCTimestamp } from 'lightweight-charts'
import PriceChart from '../components/PriceChart'
import { instruments, instrumentById, dailyCandles } from '../lib/chart/sim'
import { partialCandle } from '../lib/chart/patterns'
import { interpret, inr, type PatternReading } from '../lib/chart/interpret'
import { sma } from '../lib/chart/indicators'
import { patternName } from '../content/patterns'
import { useStore } from '../lib/store'
import { go } from '../router'
import { Button, Chip, Header, Rich } from '../components/ui'
import { SimNotice } from './Candles'

const TICKS = 4 // a candle forms over 4 steps: 25%, 50%, 75%, then closes

const statusInfo: Record<string, { label: string; tone: 'up' | 'down' | 'warn' | 'accent' | 'muted'; text: string }> = {
  developing: { label: 'Developing', tone: 'accent', text: 'The candle is still forming. This is only a possibility — it is NOT a pattern until the candle closes.' },
  awaiting: { label: 'Awaiting confirmation', tone: 'warn', text: 'Completed, but the next candle has not confirmed it yet.' },
  confirmed: { label: 'Confirmed', tone: 'up', text: 'The next candle closed in the pattern’s direction.' },
  'not-confirmed': { label: 'Not confirmed', tone: 'muted', text: 'The next candle did not follow through. A weak signal.' },
  failed: { label: 'Failed', tone: 'down', text: 'Price closed beyond the pattern’s extreme, which invalidates it.' },
  unresolved: { label: 'Indecision', tone: 'muted', text: 'Neutral pattern — price has not yet broken its high or low.' },
  'resolved-up': { label: 'Resolved upward', tone: 'up', text: 'Price later closed above this indecision candle’s high.' },
  'resolved-down': { label: 'Resolved downward', tone: 'down', text: 'Price later closed below this indecision candle’s low.' },
}

function Panel({ title, children, tone = 'border-line bg-card' }: { title: string; children: ReactNode; tone?: string }) {
  return <section className={`mb-3 rounded-2xl border p-3 ${tone}`}><h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>{children}</section>
}
const Lines = ({ items }: { items: string[] }) => (
  <ul className="grid gap-1.5 text-sm leading-relaxed">{items.map((x, i) => <li key={i} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /><span><Rich text={x} /></span></li>)}</ul>
)

function PatternRow({ pr }: { pr: PatternReading }) {
  const s = statusInfo[pr.status]
  const when = pr.candlesAgo < 0 ? 'in the developing candle' : pr.candlesAgo === 0 ? 'on the last completed candle' : `${pr.candlesAgo} candle${pr.candlesAgo > 1 ? 's' : ''} ago`
  return (
    <a href={`#/pattern/${pr.hit.id}`} className="block rounded-xl border border-line bg-card2 p-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{patternName(pr.hit.id)} <span className="font-normal text-muted">· {pr.hit.bias}</span></span>
        <Chip tone={s.tone}>{s.label}</Chip>
      </div>
      <div className="mt-1 text-xs text-muted">Ended {when}. {s.text}{pr.confirmedThenFailed ? ' (It was confirmed first, then failed.)' : ''}</div>
    </a>
  )
}

export default function InterpreterPage({ insId, at: atParam }: { insId?: string; at?: string }) {
  const { state } = useStore()
  const dark = state.settings.theme === 'dark' || (state.settings.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches)
  const id = insId && instrumentById[insId] ? insId : 'sim-a'
  const data = useMemo(() => dailyCandles(id), [id])
  const initial = Math.min(Math.max(Number(atParam) || 80, 30), data.length - 1)
  const [at, setAt] = useState(initial) // index of the candle that is forming next; 0..at-1 are complete
  const [tick, setTick] = useState(0) // 0 = next candle not opened; 1..3 = partly formed
  const [playing, setPlaying] = useState(false)
  useEffect(() => { setAt(initial); setTick(0) }, [id, initial])

  const step = () => {
    if (tick + 1 >= TICKS) { if (at < data.length) { setAt(at + 1); setTick(0) } }
    else setTick(tick + 1)
  }
  useEffect(() => {
    if (!playing) return
    if (at >= data.length) { setPlaying(false); return }
    const h = setTimeout(step, 650)
    return () => clearTimeout(h)
  })

  const last = at - 1
  const developing = tick > 0 && at < data.length ? partialCandle(data[at], tick / TICKS) : null
  const completed = data.slice(0, at)
  const r = useMemo(() => interpret(data, last, developing, patternName), [data, last, developing?.close, developing?.high, developing?.low])
  const s20 = useMemo(() => sma(completed.map((x) => x.close), 20), [completed])
  const s50 = useMemo(() => sma(completed.map((x) => x.close), 50), [completed])

  const markers: SeriesMarker<Time>[] = r.patterns
    .filter((p) => p.status !== 'developing')
    .map((p) => {
      const bull = p.hit.bias === 'bullish', neutral = p.hit.bias === 'neutral'
      return {
        time: data[p.hit.end].time as UTCTimestamp,
        position: bull ? 'belowBar' : 'aboveBar',
        shape: neutral ? 'circle' : bull ? 'arrowUp' : 'arrowDown',
        color: neutral ? '#8e9fbe' : bull ? '#22c55e' : '#f05252',
        text: patternName(p.hit.id),
      } as SeriesMarker<Time>
    })
    .sort((a, b) => (a.time as number) - (b.time as number))
  if (developing && r.patterns.some((p) => p.status === 'developing')) {
    markers.push({ time: developing.time as UTCTimestamp, position: 'aboveBar', shape: 'circle', color: '#4f8cff', text: 'forming?' })
  }

  const priceLines = [
    ...(r.resistance ? [{ price: r.resistance.price, color: '#f05252', title: 'Resistance', dashed: true }] : []),
    ...(r.support ? [{ price: r.support.price, color: '#22c55e', title: 'Support', dashed: true }] : []),
  ]
  const fmtDate = (sec: number) => new Date(sec * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' })

  return (
    <div>
      <Header title="Candle interpreter" subtitle="Replay one candle at a time" back="/charts" />
      <SimNotice />
      <select value={id} onChange={(e) => go(`/interpreter/${e.target.value}`)}
        className="mb-3 h-11 w-full rounded-xl border border-line bg-card px-3 text-fg">
        {instruments.map((i) => <option key={i.id} value={i.id}>{i.name} — {i.description}</option>)}
      </select>

      <PriceChart candles={completed} developing={developing} dark={dark} viewKey={`${id}-${initial}`} follow
        overlays={[{ key: 's20', data: s20, color: '#4f8cff', width: 1 }, { key: 's50', data: s50, color: '#f59e0b', width: 1 }]}
        markers={markers} priceLines={priceLines} mainHeight={320} />
      <div className="mt-1 flex justify-between text-[11px] text-muted"><span><span className="text-accent">━</span> SMA 20 <span className="text-warn">━</span> SMA 50 · dashed: support/resistance</span><span>Faded candle = developing</span></div>

      <div className="sticky top-0 z-10 -mx-4 mt-2 bg-bg/95 px-4 py-2 backdrop-blur">
        <div className="mb-1 text-center text-xs text-muted tabular">
          Candle #{at + 1} of {data.length} · {at < data.length ? (tick === 0 ? 'not opened yet' : `forming (${Math.round((tick / TICKS) * 100)}% of session)`) : 'end of data'}
        </div>
        <div className="grid grid-cols-4 gap-2">
          <Button variant="secondary" className="px-1 text-sm" disabled={at <= 30} onClick={() => { setPlaying(false); setAt(at - 1); setTick(0) }}>◀ Back</Button>
          <Button variant="secondary" className="px-1 text-sm" disabled={at >= data.length} onClick={() => { setPlaying(false); step() }}>Tick ▸</Button>
          <Button className="px-1 text-sm" disabled={at >= data.length} onClick={() => { setPlaying(false); setAt(at + 1); setTick(0) }}>Close ⏭</Button>
          <Button variant="secondary" className="px-1 text-sm" disabled={at >= data.length} onClick={() => setPlaying(!playing)}>{playing ? '⏸ Pause' : '▶ Auto'}</Button>
        </div>
      </div>

      <div className="mt-2">
        <Panel title={`Last completed candle · ${fmtDate(r.last.time)} (placeholder date)`}><Lines items={r.lastLines} /></Panel>
        <Panel title="Developing candle" tone="border-accent/40 bg-accent/10"><Lines items={r.developingLines} /></Panel>
        <Panel title="Patterns (last 7 candles)">
          {r.patterns.length === 0 ? <p className="text-sm text-muted">No recognised pattern recently. Most candles are not patterns — that is normal.</p>
            : <div className="grid gap-2">{r.patterns.map((p, i) => <PatternRow key={i} pr={p} />)}</div>}
        </Panel>
        <Panel title="Buying vs selling pressure"><Lines items={[...r.pressure, ...r.trendLines]} /></Panel>
        <Panel title="Volume"><Lines items={r.volume} /></Panel>
        <Panel title="Support and resistance"><Lines items={r.levelLines} /></Panel>
        <Panel title="Possible bullish interpretation" tone="border-up/40 bg-up/10"><Lines items={r.bullish} /></Panel>
        <Panel title="Possible bearish interpretation" tone="border-down/40 bg-down/10"><Lines items={r.bearish} /></Panel>
        <Panel title="What would confirm or reject an idea" tone="border-warn/40 bg-warn/10"><Lines items={r.confirm.length ? r.confirm : ['Nothing specific — wait for a clear pattern near a key level.']} /></Panel>
        <p className="mb-2 text-center text-xs text-muted">These are possibilities, not predictions. Last close {inr(r.last.close)}.</p>
      </div>
    </div>
  )
}
