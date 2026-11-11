import { allLessons, modules, terms, questionIndex } from '../content'
import type { AppState } from './store'
import { dueIds } from './srs'
import type { Level } from '../content/types'

export const PASS = 0.7

export function computeStats(s: AppState) {
  const done = (id: string) => !!s.lessons[id]?.completedAt
  const completed = allLessons.filter((l) => done(l.id))
  const scores = completed.map((l) => s.lessons[l.id].bestScore ?? 0)
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  const masteredShare = (lv: Level) => {
    const ls = allLessons.filter((l) => l.level === lv)
    return ls.length ? ls.filter((l) => (s.lessons[l.id]?.bestScore ?? 0) >= PASS).length / ls.length : 0
  }
  let level: Level = 'beginner'
  if (masteredShare('beginner') >= 0.8) level = 'intermediate'
  if (level === 'intermediate' && masteredShare('intermediate') >= 0.8) level = 'advanced'

  const weakLessons = completed.filter((l) => (s.lessons[l.id].bestScore ?? 0) < PASS)
  const weakTerms = terms.filter((t) => {
    const ids = [...t.questions.map((q) => q.id), `g-def-${t.id}`]
    const w = ids.reduce((a, id) => a + (s.answers[id]?.wrong ?? 0), 0)
    const c = ids.reduce((a, id) => a + (s.answers[id]?.correct ?? 0), 0)
    return w > 0 && w >= c
  })
  const mistakes = Object.entries(s.answers).filter(([id, a]) => !a.last && questionIndex[id]).map(([id]) => id)
  const due = dueIds(s.srs).filter((id) => questionIndex[id])
  const answered = Object.values(s.answers)
  const totalCorrect = answered.reduce((a, b) => a + b.correct, 0)
  const totalAnswers = answered.reduce((a, b) => a + b.correct + b.wrong, 0)

  const inProgress = allLessons.find((l) => !done(l.id) && (s.lessons[l.id]?.step ?? 0) > 0)
  const nextLesson = inProgress ?? allLessons.find((l) => !done(l.id))

  return {
    completed: completed.length,
    total: allLessons.length,
    progress: completed.length / allLessons.length,
    avg,
    level,
    weakLessons,
    weakTerms,
    mistakes,
    due,
    accuracy: totalAnswers ? totalCorrect / totalAnswers : 0,
    totalAnswers,
    termsViewed: Object.keys(s.termsViewed).length,
    nextLesson,
    moduleProgress: modules.map((m) => ({
      module: m,
      done: m.lessons.filter((l) => done(l.id)).length,
      total: m.lessons.length,
    })),
  }
}
