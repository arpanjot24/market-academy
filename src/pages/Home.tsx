import { terms } from '../content'
import { useStore } from '../lib/store'
import { computeStats } from '../lib/stats'
import { go } from '../router'
import { Button, Card, Chip, Ring, levelTone } from '../components/ui'
import { useInstallPrompt } from '../lib/install'

export function HomePage() {
  const { state } = useStore()
  const st = computeStats(state)
  const install = useInstallPrompt()
  const hour = new Date().getHours()
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const dayIndex = Math.floor((Date.now() - new Date().getTimezoneOffset() * 6e4) / 864e5)
  const tod = terms[dayIndex % terms.length]
  const next = st.nextLesson
  const nextStep = next ? state.lessons[next.id]?.step ?? 0 : 0

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <p className="text-sm text-muted">{greet}</p>
          <h1 className="text-2xl font-bold">Market Academy</h1>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-line bg-card px-3 py-1.5 text-sm">
          <span>🔥</span><span className="font-semibold tabular">{state.streak.count}</span><span className="text-muted">day{state.streak.count === 1 ? '' : 's'}</span>
        </div>
      </div>

      <Card className="mb-3">
        <div className="flex items-center gap-4">
          <Ring value={st.progress} size={72} />
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2"><span className="text-sm text-muted">Your level</span><Chip tone={levelTone(st.level)}>{st.level}</Chip></div>
            <div className="text-sm"><span className="font-semibold tabular">{st.completed}</span> of {st.total} lessons done</div>
            <div className="text-sm text-muted">Average quiz score: <span className="tabular">{st.completed ? `${Math.round(st.avg * 100)}%` : '—'}</span></div>
          </div>
        </div>
      </Card>

      {next ? (
        <Card className="mb-3 border-accent/40 bg-accent/10" onClick={() => go(`/lesson/${next.id}`)}>
          <div className="text-xs font-semibold uppercase tracking-wide text-accent">{nextStep > 0 ? 'Continue where you left off' : st.completed ? 'Up next' : 'Start here'}</div>
          <div className="mt-1 text-base font-semibold">{next.title}</div>
          <div className="mt-0.5 text-sm text-muted">{next.summary}</div>
          <div className="mt-2 flex gap-1.5"><Chip tone={levelTone(next.level)}>{next.level}</Chip><Chip>{next.minutes} min</Chip></div>
        </Card>
      ) : (
        <Card className="mb-3 border-up/40 bg-up/10">
          <div className="font-semibold text-up">All Phase 1 lessons completed 🎉</div>
          <div className="text-sm text-muted">Keep your knowledge fresh with revision and retake weak topics.</div>
        </Card>
      )}

      <div className="mb-3 grid grid-cols-2 gap-3">
        <Card onClick={() => go('/review')}>
          <div className="text-2xl font-bold tabular">{st.due.length}</div>
          <div className="text-sm text-muted">questions due for revision</div>
        </Card>
        <Card onClick={() => go('/progress')}>
          <div className="text-2xl font-bold tabular">{st.weakLessons.length + st.weakTerms.length}</div>
          <div className="text-sm text-muted">weak topics to strengthen</div>
        </Card>
      </div>

      <Card className="mb-3" onClick={() => go(`/glossary/${tod.id}`)}>
        <div className="text-xs font-semibold uppercase tracking-wide text-warn">Term of the day</div>
        <div className="mt-1 text-base font-semibold">{tod.term}</div>
        <div className="mt-0.5 text-sm text-muted">{tod.simple}</div>
      </Card>

      {install.canInstall && (
        <Card className="mb-3">
          <div className="font-semibold">Install Market Academy</div>
          <div className="mb-3 text-sm text-muted">Add it to your home screen to use it like a normal app — even offline.</div>
          <Button className="w-full" onClick={install.prompt}>Install app</Button>
        </Card>
      )}

      <h2 className="mt-5 mb-2 text-sm font-semibold text-muted">Academy roadmap</h2>
      <div className="grid gap-2">
        {[
          ['Phase 1', 'Lessons, glossary, quizzes, revision, progress', 'Available'],
          ['Phase 2', 'Candlestick charts, pattern illustrations, replay, indicators', 'Next'],
          ['Phase 3', 'Market dashboard, company analysis, news, watchlists', 'Planned'],
          ['Phase 4', 'Paper trading, virtual portfolio, risk & analytics', 'Planned'],
        ].map(([p, d, s]) => (
          <div key={p} className="flex items-center gap-3 rounded-xl border border-line bg-card px-4 py-3">
            <div className="w-16 shrink-0 text-sm font-semibold">{p}</div>
            <div className="min-w-0 flex-1 text-sm text-muted">{d}</div>
            <Chip tone={s === 'Available' ? 'up' : s === 'Next' ? 'accent' : 'muted'}>{s}</Chip>
          </div>
        ))}
      </div>
      <p className="mt-4 text-center text-xs text-muted">Educational content only. Not investment advice. No live market data is shown in Phase 1.</p>
    </div>
  )
}
