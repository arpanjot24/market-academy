import { useEffect, useState } from 'react'
import { modules, moduleById, lessonById, allLessons, upcomingModules } from '../content'
import type { Block, StepKind } from '../content/types'
import { useStore } from '../lib/store'
import { go } from '../router'
import { Bar, Button, Card, Chip, Header, Rich, levelTone, pct } from '../components/ui'
import { Visual } from '../components/Visuals'
import { MCQ, QuizRunner, QuizSummary, type QuizResult } from '../components/Quiz'
import { PASS } from '../lib/stats'

export function LearnPage() {
  const { state } = useStore()
  return (
    <div>
      <Header title="Learn" subtitle="Your structured curriculum" />
      <div className="grid gap-3">
        {modules.map((m) => {
          const done = m.lessons.filter((l) => state.lessons[l.id]?.completedAt).length
          return (
            <Card key={m.id} onClick={() => go(`/learn/${m.id}`)}>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Module {m.num}</div>
              <div className="text-base font-semibold">{m.title}</div>
              <p className="mt-1 text-sm text-muted">{m.description}</p>
              <div className="mt-3 flex items-center gap-3">
                <Bar value={done / m.lessons.length} tone="up" />
                <span className="shrink-0 text-xs text-muted tabular">{done}/{m.lessons.length}</span>
              </div>
            </Card>
          )
        })}
      </div>
      <h2 className="mt-6 mb-2 text-sm font-semibold text-muted">Coming in later phases</h2>
      <div className="grid gap-2">
        {upcomingModules.map((m) => (
          <div key={m.num} className="flex items-center justify-between rounded-xl border border-dashed border-line px-4 py-3 text-sm text-muted">
            <span>Module {m.num}: {m.title}</span>
            <Chip>Phase {m.phase}</Chip>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ModulePage({ id }: { id: string }) {
  const { state } = useStore()
  const m = moduleById[id]
  if (!m) return <NotFound />
  return (
    <div>
      <Header title={m.title} subtitle={`Module ${m.num} · ${m.lessons.length} lessons`} back="/learn" />
      <div className="grid gap-2">
        {m.lessons.map((l, i) => {
          const p = state.lessons[l.id]
          const best = p?.bestScore
          return (
            <Card key={l.id} onClick={() => go(`/lesson/${l.id}`)}>
              <div className="flex items-start gap-3">
                <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold ${p?.completedAt ? (best! >= PASS ? 'bg-up text-white' : 'bg-warn text-white') : 'bg-card2 text-muted'}`}>
                  {p?.completedAt ? (best! >= PASS ? '✓' : '!') : i + 1}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold leading-snug">{l.title}</div>
                  <div className="mt-0.5 text-sm text-muted">{l.summary}</div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Chip tone={levelTone(l.level)}>{l.level}</Chip>
                    <Chip>{l.minutes} min</Chip>
                    {best !== undefined && <Chip tone={best >= PASS ? 'up' : 'warn'}>Best {pct(best)}</Chip>}
                    {!p?.completedAt && (p?.step ?? 0) > 0 && <Chip tone="accent">In progress</Chip>}
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

const kindLabel: Record<StepKind, string> = {
  concept: 'Concept', example: 'Simple example', numbers: 'Numerical example', visual: 'Visual', real: 'Real-world application', check: 'Knowledge check',
}

function BlockView({ b, onCheck }: { b: Block; onCheck: (id: string, c: boolean) => void }) {
  switch (b.t) {
    case 'p': return <p className="mb-3 leading-relaxed text-fg/90"><Rich text={b.text} /></p>
    case 'list': return (
      <ul className="mb-3 grid gap-2">
        {b.items.map((it, i) => <li key={i} className="flex gap-2 leading-relaxed text-fg/90"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /><span><Rich text={it} /></span></li>)}
      </ul>
    )
    case 'example': return (
      <div className="mb-3 rounded-xl border border-accent/30 bg-accent/10 p-3 leading-relaxed">
        {b.title && <div className="mb-1 font-semibold">{b.title}</div>}<Rich text={b.text} />
      </div>
    )
    case 'table': return (
      <div className="mb-3 overflow-hidden rounded-xl border border-line">
        {b.title && <div className="bg-card2 px-3 py-2 text-xs font-semibold text-muted">{b.title}</div>}
        <div className="divide-y divide-line">
          {b.rows.map(([k, v], i) => (
            <div key={i} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-3 px-3 py-2 text-sm">
              <div className="text-muted">{k}</div><div className="font-medium tabular">{v}</div>
            </div>
          ))}
        </div>
        {b.note && <div className="bg-card2 px-3 py-2 text-xs text-muted"><Rich text={b.note} /></div>}
      </div>
    )
    case 'visual': return <Visual id={b.id} caption={b.caption} />
    case 'formula': return <div className="mb-3 rounded-xl bg-card2 px-3 py-2.5 font-mono text-sm">{b.text}</div>
    case 'callout': {
      const cls = { tip: 'border-up/40 bg-up/10', warn: 'border-warn/40 bg-warn/10', info: 'border-accent/40 bg-accent/10' }[b.tone]
      const icon = { tip: '💡', warn: '⚠️', info: 'ℹ️' }[b.tone]
      return <div className={`mb-3 flex gap-2 rounded-xl border p-3 text-sm leading-relaxed ${cls}`}><span>{icon}</span><span><Rich text={b.text} /></span></div>
    }
    case 'check': return <MCQ q={b.q} onChecked={(c) => onCheck(b.q.id, c)} />
  }
}

export function LessonPage({ id }: { id: string }) {
  const { state, actions } = useStore()
  const lesson = lessonById[id]
  const total = lesson?.steps.length ?? 0
  const saved = state.lessons[id]
  const [i, setI] = useState(() => Math.min(saved?.completedAt ? 0 : saved?.step ?? 0, Math.max(total - 1, 0)))
  const [phase, setPhase] = useState<'learn' | 'quiz' | 'done'>('learn')
  const [results, setResults] = useState<QuizResult[]>([])
  const [checked, setChecked] = useState<Record<number, boolean>>({})
  const [quizKey, setQuizKey] = useState(0)

  useEffect(() => { if (lesson && phase === 'learn') actions.setStep(id, i) }, [i, id, phase, lesson, actions])
  useEffect(() => { window.scrollTo(0, 0) }, [i, phase])

  if (!lesson) return <NotFound />
  const m = moduleById[lesson.moduleId]
  const s = lesson.steps[i]
  const needsCheck = s?.kind === 'check' && !checked[i]
  const idx = allLessons.findIndex((l) => l.id === id)
  const next = allLessons[idx + 1]
  const progress = phase === 'learn' ? i / (total + 1) : phase === 'quiz' ? total / (total + 1) : 1

  return (
    <div>
      <Header title={lesson.title} subtitle={`Module ${m.num} · ${m.title}`} back={`/learn/${m.id}`} />
      <div className="mb-4"><Bar value={progress} /></div>

      {phase === 'learn' && (
        <>
          <div className="mb-2 flex items-center justify-between">
            <Chip tone="accent">{kindLabel[s.kind]}</Chip>
            <span className="text-xs text-muted">Step {i + 1} of {total} · then quiz</span>
          </div>
          <h2 className="mb-3 text-lg font-bold">{s.title}</h2>
          <div key={i}>{s.blocks.map((b, k) => <BlockView key={k} b={b} onCheck={(qid, c) => { actions.answer(qid, c); setChecked((x) => ({ ...x, [i]: true })) }} />)}</div>
          <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+72px)] mt-6 flex gap-2 bg-bg/90 py-2 backdrop-blur">
            <Button variant="secondary" className="flex-1" disabled={i === 0} onClick={() => setI(i - 1)}>Back</Button>
            {i < total - 1
              ? <Button className="flex-[2]" disabled={needsCheck} onClick={() => setI(i + 1)}>{needsCheck ? 'Answer to continue' : 'Next'}</Button>
              : <Button className="flex-[2]" disabled={needsCheck} onClick={() => setPhase('quiz')}>{needsCheck ? 'Answer to continue' : `Start quiz (${lesson.quiz.length} questions)`}</Button>}
          </div>
        </>
      )}

      {phase === 'quiz' && (
        <>
          <h2 className="mb-3 text-lg font-bold">Lesson quiz</h2>
          <QuizRunner key={quizKey} questions={lesson.quiz} onAnswer={actions.answer}
            onFinish={(r) => { actions.recordQuiz(id, r.filter((x) => x.correct).length, r.length, true); setResults(r); setPhase('done') }} />
        </>
      )}

      {phase === 'done' && (
        <>
          <QuizSummary results={results} questions={lesson.quiz} />
          <div className="mt-4 grid gap-2">
            {next && <Button onClick={() => go(`/lesson/${next.id}`)}>Next lesson: {next.title}</Button>}
            <Button variant="secondary" onClick={() => { setResults([]); setQuizKey((k) => k + 1); setPhase('quiz') }}>Retake quiz</Button>
            <Button variant="secondary" onClick={() => { setI(0); setChecked({}); setPhase('learn') }}>Review lesson from start</Button>
            <Button variant="secondary" onClick={() => go(`/learn/${m.id}`)}>Back to module</Button>
          </div>
        </>
      )}
    </div>
  )
}

export function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="mb-4 text-muted">This page does not exist.</p>
      <Button onClick={() => go('/')}>Go home</Button>
    </div>
  )
}
