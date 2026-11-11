import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { terms } from '../content'
import { termById, glossaryQuestions } from '../content/glossary'
import { lessonForTerm } from '../content/module3'
import { lessonById } from '../content'
import { useStore } from '../lib/store'
import { go } from '../router'
import { Button, Card, Chip, Header, Rich } from '../components/ui'
import { QuizRunner, QuizSummary, type QuizResult } from '../components/Quiz'
import { NotFound } from './Learn'

const CATS = ['All', 'Valuation', 'Profitability', 'Balance sheet & cash', 'Ownership', 'Saved'] as const

export function GlossaryPage() {
  const { state } = useStore()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<(typeof CATS)[number]>('All')
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return terms
      .filter((t) => cat === 'All' || (cat === 'Saved' ? state.bookmarks.includes(t.id) : t.category === cat))
      .filter((t) => !s || [t.term, ...(t.aka ?? []), t.simple, t.detail].join(' ').toLowerCase().includes(s))
      .sort((a, b) => a.term.localeCompare(b.term))
  }, [q, cat, state.bookmarks])

  return (
    <div>
      <Header title="Glossary" subtitle={`${terms.length} key financial terms`} />
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search terms, e.g. ROE, margin, debt…" type="search"
        className="mb-3 h-12 w-full rounded-xl border border-line bg-card px-4 text-fg outline-none placeholder:text-muted focus:border-accent" />
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1">
        {CATS.map((c) => (
          <button key={c} onClick={() => setCat(c)}
            className={`shrink-0 rounded-full border px-3 py-1.5 text-sm ${cat === c ? 'border-accent bg-accent text-white' : 'border-line bg-card text-muted'}`}>{c}</button>
        ))}
      </div>
      <Button className="mb-4 w-full" variant="secondary" onClick={() => go('/glossary-quiz')}>🎯 Quiz me on terms (10 questions)</Button>
      <div className="grid gap-2">
        {list.map((t) => (
          <Card key={t.id} onClick={() => go(`/glossary/${t.id}`)}>
            <div className="flex items-center justify-between gap-2">
              <div className="font-semibold">{t.term}</div>
              <div className="flex gap-1">
                {state.bookmarks.includes(t.id) && <Chip tone="warn">★</Chip>}
                {state.termsViewed[t.id] && <Chip tone="up">read</Chip>}
              </div>
            </div>
            <div className="mt-1 text-sm text-muted">{t.simple}</div>
          </Card>
        ))}
        {list.length === 0 && <p className="py-8 text-center text-muted">No terms match. Try another word.</p>}
      </div>
    </div>
  )
}

function Section({ title, children, tone }: { title: string; children: ReactNode; tone?: string }) {
  return (
    <section className={`mb-3 rounded-2xl border p-4 ${tone ?? 'border-line bg-card'}`}>
      <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
      <div className="leading-relaxed">{children}</div>
    </section>
  )
}

export function TermPage({ id }: { id: string }) {
  const { state, actions } = useStore()
  const t = termById[id]
  useEffect(() => { if (t) actions.viewTerm(id) }, [id, t, actions])
  if (!t) return <NotFound />
  const saved = state.bookmarks.includes(id)
  const sorted = [...terms].sort((a, b) => a.term.localeCompare(b.term))
  const i = sorted.findIndex((x) => x.id === id)
  const prev = sorted[i - 1], next = sorted[i + 1]
  const lesson = lessonById[lessonForTerm[id]]

  return (
    <div>
      <Header title={t.term} subtitle={t.aka?.join(' · ') || t.category} back="/glossary"
        right={<button onClick={() => actions.toggleBookmark(id)} aria-label="Save term"
          className={`grid h-10 w-10 place-items-center rounded-full border border-line bg-card text-lg ${saved ? 'text-warn' : 'text-muted'}`}>{saved ? '★' : '☆'}</button>} />
      <Section title="1 · Simple definition" tone="border-accent/40 bg-accent/10"><span className="text-base font-medium">{t.simple}</span></Section>
      <Section title="2 · Detailed explanation"><Rich text={t.detail} /></Section>
      <Section title="3 · Numerical example (illustrative)">
        <div className="divide-y divide-line">
          {t.example.rows.map(([k, v], j) => (
            <div key={j} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 py-1.5 text-sm"><span className="text-muted">{k}</span><span className="font-medium tabular">{v}</span></div>
          ))}
        </div>
        {t.example.note && <p className="mt-2 text-xs text-muted">{t.example.note}</p>}
      </Section>
      <Section title="4 · Formula">{t.formula ? <div className="font-mono text-sm">{t.formula}</div> : <span className="text-sm text-muted">No formula — this is a disclosure you read from filings.</span>}</Section>
      <Section title="5 · Practical significance" tone="border-up/40 bg-up/10">{t.significance}</Section>
      <Section title="6 · Common misunderstanding" tone="border-warn/40 bg-warn/10">{t.mistake}</Section>
      {lesson && <Button variant="secondary" className="mb-3 w-full" onClick={() => go(`/lesson/${lesson.id}`)}>Study it in the lesson: {lesson.title}</Button>}
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" disabled={!prev} onClick={() => prev && go(`/glossary/${prev.id}`)}>← {prev?.term ?? ''}</Button>
        <Button variant="secondary" className="flex-1" disabled={!next} onClick={() => next && go(`/glossary/${next.id}`)}>{next?.term ?? ''} →</Button>
      </div>
    </div>
  )
}

export function GlossaryQuizPage() {
  const { actions } = useStore()
  const [round, setRound] = useState(0)
  const questions = useMemo(() => [...glossaryQuestions].sort(() => Math.random() - 0.5).slice(0, 10), [round])
  const [results, setResults] = useState<QuizResult[] | null>(null)
  return (
    <div>
      <Header title="Glossary quiz" subtitle="Definitions and calculations" back="/glossary" />
      {!results ? (
        <QuizRunner key={round} questions={questions} onAnswer={actions.answer}
          onFinish={(r) => { actions.recordQuiz('glossary', r.filter((x) => x.correct).length, r.length, false); setResults(r) }} />
      ) : (
        <>
          <QuizSummary results={results} questions={questions} />
          <div className="mt-4 grid gap-2">
            <Button onClick={() => { setResults(null); setRound((x) => x + 1) }}>New set of questions</Button>
            <Button variant="secondary" onClick={() => go('/glossary')}>Back to glossary</Button>
          </div>
        </>
      )}
    </div>
  )
}
