import { useMemo, useState } from 'react'
import type { Question } from '../content/types'
import { Button, Rich, Bar } from './ui'
import { Visual } from './Visuals'

function shuffleQuestion(q: Question) {
  const order = q.options.map((_, i) => i)
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]]
  }
  return { options: order.map((i) => q.options[i]), answer: order.indexOf(q.answer) }
}

export function MCQ({ q, onChecked }: { q: Question; onChecked: (correct: boolean) => void }) {
  const s = useMemo(() => shuffleQuestion(q), [q])
  const [chosen, setChosen] = useState<number | null>(null)
  const [checked, setChecked] = useState(false)
  const correct = chosen === s.answer

  return (
    <div>
      {q.visual && <Visual id={q.visual} />}
      <p className="mb-3 text-base font-semibold leading-snug"><Rich text={q.q} /></p>
      <div className="grid gap-2">
        {s.options.map((o, i) => {
          let cls = 'border-line bg-card'
          if (checked && i === s.answer) cls = 'border-up bg-up/15'
          else if (checked && i === chosen) cls = 'border-down bg-down/15'
          else if (!checked && i === chosen) cls = 'border-accent bg-accent/10'
          return (
            <button key={i} disabled={checked} onClick={() => setChosen(i)}
              className={`min-h-12 rounded-xl border px-3 py-2.5 text-left text-sm transition ${cls}`}>
              <span className="mr-2 font-semibold text-muted">{String.fromCharCode(65 + i)}.</span>{o}
            </button>
          )
        })}
      </div>
      {!checked ? (
        <Button className="mt-4 w-full" disabled={chosen === null} onClick={() => { setChecked(true); onChecked(correct) }}>Check answer</Button>
      ) : (
        <div className={`mt-4 rounded-xl border p-3 text-sm ${correct ? 'border-up/40 bg-up/10' : 'border-down/40 bg-down/10'}`}>
          <div className={`mb-1 font-bold ${correct ? 'text-up' : 'text-down'}`}>{correct ? '✓ Correct' : `✗ Not quite — the answer is ${String.fromCharCode(65 + s.answer)}`}</div>
          <div className="text-fg/90"><Rich text={q.explain} /></div>
        </div>
      )}
    </div>
  )
}

export interface QuizResult { id: string; correct: boolean }

export function QuizRunner({ questions, onAnswer, onFinish }: {
  questions: Question[]
  onAnswer?: (id: string, correct: boolean) => void
  onFinish: (results: QuizResult[]) => void
}) {
  const [idx, setIdx] = useState(0)
  const [results, setResults] = useState<QuizResult[]>([])
  const q = questions[idx]
  const answered = results.length > idx
  const last = idx === questions.length - 1

  return (
    <div>
      <div className="mb-3 flex items-center justify-between text-xs text-muted">
        <span>Question {idx + 1} of {questions.length}</span>
        <span>{results.filter((r) => r.correct).length} correct</span>
      </div>
      <div className="mb-4"><Bar value={(idx + (answered ? 1 : 0)) / questions.length} /></div>
      <MCQ key={q.id + idx} q={q} onChecked={(c) => { onAnswer?.(q.id, c); setResults((r) => [...r, { id: q.id, correct: c }]) }} />
      {answered && (
        <Button className="mt-3 w-full" onClick={() => (last ? onFinish(results) : setIdx(idx + 1))}>
          {last ? 'See results' : 'Next question'}
        </Button>
      )}
    </div>
  )
}

export function QuizSummary({ results, questions }: { results: QuizResult[]; questions: Question[] }) {
  const score = results.filter((r) => r.correct).length
  const p = results.length ? score / results.length : 0
  const wrong = results.filter((r) => !r.correct).map((r) => questions.find((q) => q.id === r.id)!).filter(Boolean)
  const msg = p >= 0.9 ? 'Excellent — you have mastered this.' : p >= 0.7 ? 'Good work. You have passed this topic.' : p >= 0.5 ? 'Getting there. Review the explanations and try again.' : 'This topic needs another look. Re-read the lesson, then retry.'
  return (
    <div>
      <div className="mb-4 rounded-2xl border border-line bg-card p-5 text-center">
        <div className={`text-4xl font-bold tabular ${p >= 0.7 ? 'text-up' : p >= 0.5 ? 'text-warn' : 'text-down'}`}>{score} / {results.length}</div>
        <div className="mt-1 text-sm text-muted">{msg}</div>
        {wrong.length > 0 && <div className="mt-2 text-xs text-muted">Missed questions are added to your revision queue.</div>}
      </div>
      {wrong.length > 0 && (
        <div className="grid gap-2">
          <h3 className="text-sm font-semibold text-muted">Review what you missed</h3>
          {wrong.map((q) => (
            <div key={q.id} className="rounded-xl border border-line bg-card p-3 text-sm">
              <div className="mb-1 font-medium"><Rich text={q.q} /></div>
              <div className="text-up">Answer: {q.options[q.answer]}</div>
              <div className="mt-1 text-muted"><Rich text={q.explain} /></div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
