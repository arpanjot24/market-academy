import { module1Lessons } from './module1'
import { module2Lessons } from './module2'
import { module3Lessons } from './module3'
import { module4Lessons, module5Lessons } from './module45'
import { module6Lessons } from './module6'
import { module7Lessons, module8Lessons } from './module78'
import { patternIdQuestions, patterns } from './patterns'
import { terms, glossaryQuestions } from './glossary'
import type { Lesson, LessonDef, Module, Question } from './types'

const mk = (id: string, num: number, title: string, description: string, defs: LessonDef[]): Module => ({
  id, num, title, description, lessons: defs.map((d) => ({ ...d, moduleId: id })),
})

export const modules: Module[] = [
  mk('m1', 1, 'Stock market fundamentals', 'Shares, exchanges, IPOs, SEBI, demat accounts, indices and order types.', module1Lessons),
  mk('m2', 2, 'Economics of the stock market', 'Inflation, RBI, bond yields, GDP, the rupee, oil, institutions and psychology.', module2Lessons),
  mk('m3', 3, 'Financial terminology', 'The ratios used to analyse companies, explained with worked numbers.', module3Lessons),
  mk('m4', 4, 'Candlestick education', 'Candle anatomy, 19 patterns, and how patterns develop, confirm and fail.', module4Lessons),
  mk('m5', 5, 'Technical indicators', 'SMA, EMA, RSI, MACD, Bollinger Bands, VWAP, Fibonacci, ATR, ADX, stochastic and volume.', module5Lessons),
  mk('m6', 6, 'Fundamental analysis', 'Financial statements, annual reports, quality checks, governance, moats and valuation.', module6Lessons),
  mk('m7', 7, 'Trading strategies', 'Intraday to long-term, trend, momentum, breakout, pullback, mean reversion, levels, volume and backtesting.', module7Lessons),
  mk('m8', 8, 'Risk management', 'Capital preservation, position sizing, stops, drawdown, leverage, psychology, Indian charges and tax.', module8Lessons),
]

// Modules planned for later phases (shown on the Learn screen, clearly labelled).
export const upcomingModules: { num: number; title: string; phase: number }[] = []

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

for (const p of patterns) {
  for (const q of [p.q, ...patternIdQuestions.filter((x) => x.id === `pid-${p.id}`)]) {
    questionIndex[q.id] ??= { q, label: `Pattern: ${p.name}`, href: `#/pattern/${p.id}` }
  }
}

export { terms }
