import { useMemo, useState } from 'react'
import { useNews, fmtIST, timeAgo, CATEGORY_INFO } from '../lib/news'
import { lessonById } from '../content'
import { INDIA_INDICES, GLOBAL_MACRO } from '../content/market'
import { Card, Chip, Header } from '../components/ui'
import { QuoteBoard, TVWidget } from '../components/TVWidget'
import { NewsRow } from './Market'

const ORDER = ['rbi', 'regulation', 'economy', 'flows', 'results', 'ipo', 'commodities', 'global', 'markets', 'other']

export function NewsPage() {
  const { data, error } = useNews()
  const [filter, setFilter] = useState<string>('briefing')
  const items = data?.items ?? []
  const recent = useMemo(() => items.filter((i) => !i.published || Date.now() - Date.parse(i.published) < 36 * 3600e3), [items])
  const byCat = useMemo(() => {
    const m: Record<string, typeof items> = {}
    for (const i of recent) (m[i.category] ??= []).push(i)
    return m
  }, [recent])
  const official = items.filter((i) => i.kind === 'official')
  const list = filter === 'all' ? items : filter === 'official' ? official : items.filter((i) => i.category === filter)
  const ageH = data ? (Date.now() - Date.parse(data.fetchedAt)) / 3600e3 : 0

  return (
    <div>
      <Header title="Market briefing" subtitle="News with sources and times" back="/market" />
      {data && (
        <div className={`mb-3 rounded-xl border px-3 py-2 text-xs ${ageH > 12 ? 'border-warn/40 bg-warn/10' : 'border-line bg-card'}`}>
          Headlines collected <b>{fmtIST(data.fetchedAt)}</b> ({timeAgo(data.fetchedAt)}) from {data.feeds.filter((f) => f.ok).map((f) => f.source).join(', ')}.
          {ageH > 12 && ' This copy is old — connect to the internet to refresh, or the automatic update may be paused.'} Tap a headline to read it at the source.
        </div>
      )}
      {error && !data && <Card className="mb-3 text-sm text-muted">News could not be loaded ({error}). Connect to the internet and reopen this page.</Card>}
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {[['briefing', 'Daily briefing'], ['all', 'All'], ['official', 'Official (RBI/SEBI)'], ...ORDER.map((c) => [c, CATEGORY_INFO[c].label])].map(([k, l]) => (
          <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${filter === k ? 'border-accent bg-accent text-white' : 'border-line bg-card text-muted'}`}>{l}</button>
        ))}
      </div>

      {filter === 'briefing' ? (
        <>
          <h2 className="mb-2 text-sm font-semibold text-muted">Market snapshot</h2>
          <QuoteBoard groups={[{ name: 'India', symbols: INDIA_INDICES.slice(0, 4) }, { name: 'Global & macro', symbols: GLOBAL_MACRO }]} />
          <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">What happened (last 36 hours) — and why it matters</h2>
          {ORDER.filter((c) => byCat[c]?.length).map((c) => {
            const info = CATEGORY_INFO[c]
            const lesson = info.lesson ? lessonById[info.lesson] : undefined
            return (
              <section key={c} className="mb-4 rounded-2xl border border-line bg-card p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <h3 className="font-semibold">{info.label}</h3><Chip>{byCat[c].length}</Chip>
                </div>
                <p className="mb-2 text-xs leading-relaxed text-muted"><b className="text-fg">Why it matters: </b>{info.why}</p>
                <div className="grid gap-2">{byCat[c].slice(0, 3).map((n) => <NewsRow key={n.link} n={n} />)}</div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs">
                  {byCat[c].length > 3 && <button className="text-accent" onClick={() => setFilter(c)}>All {byCat[c].length} →</button>}
                  {lesson && <a className="text-accent" href={`#/lesson/${lesson.id}`}>Lesson: {lesson.title} →</a>}
                </div>
              </section>
            )
          })}
          <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Economic calendar (India & US)</h2>
          <TVWidget type="events" height={480} config={{ importanceFilter: '0,1', countryFilter: 'in,us' }} />
          <p className="mt-3 text-xs text-muted">Headlines are grouped by keywords automatically, so a few may sit in the wrong group. This app never writes or changes news; it links to the original publisher.</p>
        </>
      ) : (
        <div className="grid gap-2">
          {filter !== 'all' && filter !== 'official' && <p className="text-xs text-muted"><b className="text-fg">Why it matters: </b>{CATEGORY_INFO[filter].why}</p>}
          {list.length === 0 ? <p className="py-8 text-center text-sm text-muted">No headlines in this group right now.</p> : list.map((n) => <NewsRow key={n.link} n={n} />)}
        </div>
      )}
    </div>
  )
}
