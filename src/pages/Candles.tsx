import { useMemo, useState, type ReactNode } from 'react'
import { patterns, patternById, patternIdQuestions } from '../content/patterns'
import { lessonById } from '../content'
import { instruments, dailyCandles, SIM_NOTICE } from '../lib/chart/sim'
import { detectRange, patternStatus } from '../lib/chart/patterns'
import { useStore } from '../lib/store'
import { go } from '../router'
import { Button, Card, Chip, Header } from '../components/ui'
import { CandleBuilder, PatternIllustration } from '../components/CandleSVG'
import { QuizRunner, QuizSummary, type QuizResult } from '../components/Quiz'
import { NotFound } from './Learn'

const biasTone = (b: string) => (b === 'bullish' ? 'up' : b === 'bearish' ? 'down' : b === 'either' ? 'accent' : 'muted') as 'up' | 'down' | 'accent' | 'muted'
const biasLabel = (b: string) => (b === 'either' ? 'bullish or bearish' : b)

export function SimNotice() {
  return <div className="mb-3 rounded-xl border border-warn/40 bg-warn/10 px-3 py-2 text-xs text-fg"><b className="text-warn">SIMULATION · </b>{SIM_NOTICE}</div>
}

export function ChartsHub() {
  const items = [
    { href: '/candles', icon: '🕯️', title: 'Candle Academy', text: 'Candle anatomy, a candle builder, and all 19 patterns with pictures, psychology, confirmation and failure.' },
    { href: '/interpreter', icon: '🔍', title: 'Live Candle Interpreter & Replay', text: 'Step through a chart one candle (and one tick) at a time. Every candle, pattern, level and volume reading is explained.' },
    { href: '/technical', icon: '📊', title: 'Technical Analysis Lab', text: 'Toggle SMA, EMA, RSI, MACD, Bollinger Bands, VWAP, Fibonacci, ATR, ADX, stochastic and volume — each with an explanation and its current reading.' },
    { href: '/pattern-quiz', icon: '🎯', title: 'Pattern identification quiz', text: 'Ten chart pictures. Name the pattern.' },
  ]
  return (
    <div>
      <Header title="Charts" subtitle="Candlesticks and technical analysis" />
      <SimNotice />
      <div className="grid gap-3">
        {items.map((it) => (
          <Card key={it.href} onClick={() => go(it.href)}>
            <div className="flex gap-3">
              <div className="text-2xl">{it.icon}</div>
              <div><div className="font-semibold">{it.title}</div><div className="mt-0.5 text-sm text-muted">{it.text}</div></div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

export function CandleAcademy() {
  const single = patterns.filter((p) => p.candles === 1)
  const multi = patterns.filter((p) => p.candles > 1)
  const lessons = ['m4-l1', 'm4-l2', 'm4-l3', 'm4-l4', 'm4-l5', 'm4-l6', 'm4-l7'].map((id) => lessonById[id])
  const grid = (list: typeof patterns) => (
    <div className="grid grid-cols-2 gap-2">
      {list.map((p) => (
        <Card key={p.id} onClick={() => go(`/pattern/${p.id}`)} className="p-2.5">
          <PatternIllustration id={p.id} h={80} labels={false} />
          <div className="mt-1 text-sm font-semibold leading-tight">{p.name}</div>
          <div className="mt-1"><Chip tone={biasTone(p.bias)}>{biasLabel(p.bias)}</Chip></div>
        </Card>
      ))}
    </div>
  )
  return (
    <div>
      <Header title="Candle Academy" subtitle="Read what every candle is saying" back="/charts" />
      <h2 className="mb-2 text-sm font-semibold text-muted">Candle anatomy — try it</h2>
      <CandleBuilder />
      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Guided lessons (Module 4)</h2>
      <div className="grid gap-2">
        {lessons.map((l) => (
          <button key={l.id} onClick={() => go(`/lesson/${l.id}`)} className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3 text-left text-sm">
            <span className="font-medium">{l.title}</span><span className="text-accent">→</span>
          </button>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Button onClick={() => go('/interpreter')}>Candle interpreter</Button>
        <Button variant="secondary" onClick={() => go('/pattern-quiz')}>Pattern quiz</Button>
      </div>
      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Single-candle patterns ({single.length})</h2>
      {grid(single)}
      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Multi-candle patterns ({multi.length})</h2>
      {grid(multi)}
      <p className="mt-4 text-center text-xs text-muted">Patterns describe probabilities, never certainties. Always wait for confirmation.</p>
    </div>
  )
}

function Sec({ title, children, tone = 'border-line bg-card' }: { title: string; children: ReactNode; tone?: string }) {
  return <section className={`mb-3 rounded-2xl border p-4 ${tone}`}><h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3><div className="text-sm leading-relaxed">{children}</div></section>
}

const statusText: Record<string, string> = {
  confirmed: 'confirmed', 'not-confirmed': 'not confirmed', failed: 'failed', awaiting: 'awaiting confirmation',
  'resolved-up': 'resolved upward', 'resolved-down': 'resolved downward', unresolved: 'unresolved', developing: 'developing',
}

export function PatternPage({ id }: { id: string }) {
  const pt = patternById[id]
  const examples = useMemo(() => {
    if (!pt) return []
    const out: { ins: string; name: string; end: number; time: number; status: string }[] = []
    for (const ins of instruments) {
      const cs = dailyCandles(ins.id)
      for (const h of detectRange(cs, 0, cs.length - 1)) {
        if (h.id !== id) continue
        const last = Math.min(cs.length - 1, h.end + 5)
        out.push({ ins: ins.id, name: ins.name, end: h.end, time: cs[h.end].time, status: statusText[patternStatus(cs, h, last).status] })
      }
    }
    return out.slice(0, 8)
  }, [id, pt])
  if (!pt) return <NotFound />
  const idx = patterns.findIndex((p) => p.id === id)
  const prev = patterns[idx - 1], next = patterns[idx + 1]
  return (
    <div>
      <Header title={pt.name} subtitle={`${pt.candles}-candle pattern · ${pt.signal}`} back="/candles" />
      <figure className="mb-3 rounded-2xl border border-line bg-card p-3"><PatternIllustration id={id} h={180} /></figure>
      <div className="mb-3 flex flex-wrap gap-1.5"><Chip tone={biasTone(pt.bias)}>{biasLabel(pt.bias)}</Chip><Chip>{pt.candles} candle{pt.candles > 1 ? 's' : ''}</Chip></div>
      <Sec title="Candle structure">{pt.structure}</Sec>
      <Sec title="Formation conditions"><ul className="list-disc pl-5">{pt.conditions.map((c) => <li key={c}>{c}</li>)}</ul></Sec>
      <Sec title="Market psychology">{pt.psychology}</Sec>
      <Sec title="Interpretation">{pt.interpretation}</Sec>
      <Sec title="Volume considerations">{pt.volume}</Sec>
      <Sec title="Confirmation required" tone="border-up/40 bg-up/10">{pt.confirmation}</Sec>
      <Sec title="Failure scenarios" tone="border-warn/40 bg-warn/10">{pt.failure}</Sec>
      <Sec title="Practical chart examples (simulated practice data)">
        {examples.length === 0 ? (
          <p className="text-muted">This pattern is rare and does not occur in the current practice charts. Study the illustration above, and watch for it in the interpreter.</p>
        ) : (
          <>
            <p className="mb-2 text-muted">Found by the pattern detector. Tap one to open the interpreter right after the pattern completed, then step forward to see whether it was confirmed or failed.</p>
            <div className="grid gap-2">
              {examples.map((e) => (
                <button key={`${e.ins}-${e.end}`} onClick={() => go(`/interpreter/${e.ins}/${e.end + 1}`)}
                  className="flex items-center justify-between gap-2 rounded-xl border border-line bg-card2 px-3 py-2 text-left">
                  <span>{e.name} · candle #{e.end + 1}</span>
                  <Chip tone={e.status === 'confirmed' || e.status.startsWith('resolved') ? 'up' : e.status === 'failed' ? 'down' : 'muted'}>{e.status}</Chip>
                </button>
              ))}
            </div>
          </>
        )}
      </Sec>
      <div className="flex gap-2">
        <Button variant="secondary" className="flex-1" disabled={!prev} onClick={() => prev && go(`/pattern/${prev.id}`)}>← {prev?.name ?? ''}</Button>
        <Button variant="secondary" className="flex-1" disabled={!next} onClick={() => next && go(`/pattern/${next.id}`)}>{next?.name ?? ''} →</Button>
      </div>
    </div>
  )
}

export function PatternQuizPage() {
  const { actions } = useStore()
  const [round, setRound] = useState(0)
  const questions = useMemo(() => [...patternIdQuestions].sort(() => Math.random() - 0.5).slice(0, 10), [round])
  const [results, setResults] = useState<QuizResult[] | null>(null)
  return (
    <div>
      <Header title="Pattern quiz" subtitle="Identify the highlighted pattern" back="/charts" />
      {!results ? (
        <QuizRunner key={round} questions={questions} onAnswer={actions.answer}
          onFinish={(r) => { actions.recordQuiz('pattern-quiz', r.filter((x) => x.correct).length, r.length, false); setResults(r) }} />
      ) : (
        <>
          <QuizSummary results={results} questions={questions} />
          <div className="mt-4 grid gap-2">
            <Button onClick={() => { setResults(null); setRound((x) => x + 1) }}>New set of pictures</Button>
            <Button variant="secondary" onClick={() => go('/candles')}>Back to Candle Academy</Button>
          </div>
        </>
      )}
    </div>
  )
}
