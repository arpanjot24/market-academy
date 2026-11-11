import { module1Lessons } from './module1'
import { module2Lessons } from './module2'
import { module3Lessons } from './module3'
import { terms, glossaryQuestions } from './glossary'
import type { Lesson, LessonDef, Module, Question } from './types'

const mk = (id: string, num: number, title: string, description: string, defs: LessonDef[]): Module => ({
  id, num, title, description, lessons: defs.map((d) => ({ ...d, moduleId: id })),
})

export const modules: Module[] = [
  mk('m1', 1, 'Stock market fundamentals', 'Shares, exchanges, IPOs, SEBI, demat accounts, indices and order types.', module1Lessons),
  mk('m2', 2, 'Economics of the stock market', 'Inflation, RBI, bond yields, GDP, the rupee, oil, institutions and psychology.', module2Lessons),
  mk('m3', 3, 'Financial terminology', 'The ratios used to analyse companies, explained with worked numbers.', module3Lessons),
]

// Modules planned for later phases (shown on the Learn screen, clearly labelled).
export const upcomingModules = [
  { num: 4, title: 'Candlestick education', phase: 2 },
  { num: 5, title: 'Technical indicators', phase: 2 },
  { num: 6, title: 'Fundamental analysis of companies', phase: 3 },
  { num: 7, title: 'Trading strategies', phase: 4 },
  { num: 8, title: 'Risk management, charges and tax', phase: 4 },
]

export const allLessons: Lesson[] = modules.flatMap((m) => m.lessons)
export const lessonById: Record<string, Lesson> = Object.fromEntries(allLessons.map((l) => [l.id, l]))
export const moduleById: Record<string, Module> = Object.fromEntries(modules.map((m) => [m.id, m]))

export interface QuestionRef { q: Question; label: string; href: string }
export const questionIndex: Record<string, QuestionRef> = {}
for (const l of allLessons) {
  const href = `#/lesson/${l.id}`
  for (const q of l.quiz) questionIndex[q.id] = { q, label: l.title, href }
  for (const s of l.steps) for (const b of s.blocks) if (b.t === 'check') questionIndex[b.q.id] = { q: b.q, label: l.title, href }
}
for (const t of terms) {
  for (const q of [...t.questions, ...glossaryQuestions.filter((g) => g.id === `g-def-${t.id}`)]) {
    questionIndex[q.id] ??= { q, label: `Glossary: ${t.term}`, href: `#/glossary/${t.id}` }
  }
}

export { terms }
