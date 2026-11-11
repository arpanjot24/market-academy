import { useMemo, useState } from 'react'
import { questionIndex, lessonById } from '../content'
import { useStore } from '../lib/store'
import { computeStats } from '../lib/stats'
import { nextDue, INTERVAL_DAYS } from '../lib/srs'
import { go } from '../router'
import { Bar, Button, Card, Chip, Header, Ring, levelTone, pct } from '../components/ui'
import { QuizRunner, QuizSummary, type QuizResult } from '../components/Quiz'

export function ProgressPage() {
  const { state } = useStore()
  const st = computeStats(state)
  const recent = [...state.quizLog].reverse().slice(0, 8)
  return (
    <div>
      <Header title="Learning progress" subtitle="What you know, and what to work on" />
      <Card className="mb-3">
        <div className="flex items-center gap-4">
          <Ring value={st.progress} size={80} />
          <div className="grid flex-1 grid-cols-2 gap-y-2 text-sm">
            <span className="text-muted">Level</span><span><Chip tone={levelTone(st.level)}>{st.level}</Chip></span>
            <span className="text-muted">Lessons</span><span className="font-semibold tabular">{st.completed}/{st.total}</span>
            <span className="text-muted">Avg best score</span><span className="font-semibold tabular">{st.completed ? pct(st.avg) : '—'}</span>
            <span className="text-muted">Accuracy</span><span className="font-semibold tabular">{st.totalAnswers ? pct(st.accuracy) : '—'}</span>
            <span className="text-muted">Terms read</span><span className="font-semibold tabular">{st.termsViewed}/20</span>
            <span className="text-muted">Best streak</span><span className="font-semibold tabular">{state.streak.best} day{state.streak.best === 1 ? '' : 's'}</span>
          </div>
        </div>
        <p className="mt-3 text-xs text-muted">Level rises when you score 70%+ on at least 80% of the lessons at your current level.</p>
      </Card>

      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Modules</h2>
      <div className="grid gap-2">
        {st.moduleProgress.map(({ module: m, done, total }) => (
          <Card key={m.id} onClick={() => go(`/learn/${m.id}`)}>
            <div className="mb-2 flex justify-between text-sm"><span className="font-semibold">{m.num}. {m.title}</span><span className="text-muted tabular">{done}/{total}</span></div>
            <Bar value={done / total} tone="up" />
          </Card>
        ))}
      </div>

      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Spaced revision</h2>
      <Card>
        <div className="mb-3 text-sm">
          <span className="text-2xl font-bold tabular">{st.due.length}</span> <span className="text-muted">{st.due.length === 1 ? 'question' : 'questions'} due now ·{Object.keys(state.srs).length} in your revision deck</span>
        </div>
        <Button className="w-full" onClick={() => go('/review')}>{st.due.length ? 'Start revision' : 'Open revision'}</Button>
        <p className="mt-2 text-xs text-muted">Each question you answer comes back after {INTERVAL_DAYS.slice(1, 5).join(', ')}… days as you keep getting it right. A wrong answer brings it back immediately.</p>
      </Card>

      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Weak topics</h2>
      {st.weakLessons.length + st.weakTerms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">No weak topics yet. Topics scoring below 70% will appear here.</p>
      ) : (
        <div className="grid gap-2">
          {st.weakLessons.map((l) => (
            <Card key={l.id} onClick={() => go(`/lesson/${l.id}`)}>
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">{l.title}</span><Chip tone="warn">{pct(state.lessons[l.id].bestScore ?? 0)}</Chip></div>
            </Card>
          ))}
          {st.weakTerms.map((t) => (
            <Card key={t.id} onClick={() => go(`/glossary/${t.id}`)}>
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-semibold">Glossary: {t.term}</span><Chip tone="warn">review</Chip></div>
            </Card>
          ))}
        </div>
      )}

      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Recent quizzes</h2>
      {recent.length === 0 ? <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">No quizzes taken yet.</p> : (
        <div className="divide-y divide-line rounded-2xl border border-line bg-card">
          {recent.map((r, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
              <span className="min-w-0 truncate">{r.id === 'glossary' ? 'Glossary quiz' : r.id === 'review' ? 'Revision session' : lessonById[r.id]?.title ?? r.id}</span>
              <span className={`shrink-0 font-semibold tabular ${r.score / r.total >= 0.7 ? 'text-up' : 'text-warn'}`}>{r.score}/{r.total}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function ReviewPage() {
  const { state, actions } = useStore()
  const st = computeStats(state)
  const [mode, setMode] = useState<'due' | 'mistakes' | null>(null)
  const [results, setResults] = useState<QuizResult[] | null>(null)
  const [round, setRound] = useState(0)
  // Freeze the question list when a session starts.
  const questions = useMemo(() => {
    const ids = mode === 'due' ? st.due : mode === 'mistakes' ? st.mistakes : []
    return ids.slice(0, 15).map((id) => questionIndex[id].q)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, round])
  const nd = nextDue(state.srs)

  if (mode && questions.length) {
    return (
      <div>
        <Header title={mode === 'due' ? 'Revision' : 'Practise mistakes'} subtitle={`${questions.length} question${questions.length === 1 ? '' : 's'}`} back="/progress" />
        {!results ? (
          <QuizRunner key={round} questions={questions} onAnswer={actions.answer}
            onFinish={(r) => { actions.recordQuiz('review', r.filter((x) => x.correct).length, r.length, false); setResults(r) }} />
        ) : (
          <>
            <QuizSummary results={results} questions={questions} />
            <Button className="mt-4 w-full" onClick={() => { setResults(null); setMode(null) }}>Done</Button>
          </>
        )}
      </div>
    )
  }

  return (
    <div>
      <Header title="Revision" subtitle="Spaced repetition of what you have learned" back="/progress" />
      <Card className="mb-3">
        <div className="text-3xl font-bold tabular">{st.due.length}</div>
        <div className="mb-3 text-sm text-muted">questions due now</div>
        <Button className="w-full" disabled={!st.due.length} onClick={() => { setRound((x) => x + 1); setMode('due') }}>Start revision</Button>
        {!st.due.length && (
          <p className="mt-2 text-xs text-muted">
            {Object.keys(state.srs).length === 0 ? 'Complete a lesson quiz to build your revision deck.' : `Nothing due. Next review: ${nd ? new Date(nd).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}.`}
          </p>
        )}
      </Card>
      <Card>
        <div className="text-3xl font-bold tabular">{st.mistakes.length}</div>
        <div className="mb-3 text-sm text-muted">questions you most recently got wrong</div>
        <Button variant="secondary" className="w-full" disabled={!st.mistakes.length} onClick={() => { setRound((x) => x + 1); setMode('mistakes') }}>Practise mistakes</Button>
      </Card>
    </div>
  )
}
