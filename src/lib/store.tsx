import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { idbGet, idbSet } from './db'
import { schedule } from './srs'
import type { Account } from './sim/engine'

export type Theme = 'dark' | 'light' | 'system'
export interface LessonProgress { step: number; attempts: number; bestScore?: number; lastScore?: number; completedAt?: number }
export interface AnswerStat { correct: number; wrong: number; last: boolean; at: number }
export interface SrsItem { box: number; due: number }
export interface QuizLogItem { id: string; score: number; total: number; at: number }

export interface Watchlist { id: string; name: string; symbols: string[] }
export interface Worksheet {
  id: string
  symbol: string
  name: string
  sector: string
  source: string
  asOf: string
  notes: string
  fields: Record<string, number | undefined>
  updatedAt: number
}

export interface AppState {
  version: 1
  createdAt: number
  settings: { theme: Theme; showUS: boolean }
  watchlists: Watchlist[]
  worksheets: Record<string, Worksheet>
  sim: { practice: Account | null; real: Account | null }
  lessons: Record<string, LessonProgress>
  answers: Record<string, AnswerStat>
  srs: Record<string, SrsItem>
  termsViewed: Record<string, number>
  bookmarks: string[]
  quizLog: QuizLogItem[]
  streak: { last: string; count: number; best: number }
  watchlist: string[]
}

export const defaultState = (): AppState => ({
  version: 1,
  createdAt: Date.now(),
  settings: { theme: 'dark', showUS: false },
  watchlists: [{ id: 'main', name: 'My watchlist', symbols: [] }],
  worksheets: {},
  sim: { practice: null, real: null },
  lessons: {},
  answers: {},
  srs: {},
  termsViewed: {},
  bookmarks: [],
  quizLog: [],
  streak: { last: '', count: 0, best: 0 },
  watchlist: [],
})

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normalize(raw: any): AppState {
  const d = defaultState()
  if (!raw || typeof raw !== 'object') return d
  const obj = (v: unknown, f: object) => (v && typeof v === 'object' && !Array.isArray(v) ? v : f)
  const arr = (v: unknown) => (Array.isArray(v) ? v : [])
  return {
    version: 1,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : d.createdAt,
    settings: { ...d.settings, ...obj(raw.settings, {}) },
    watchlists: Array.isArray(raw.watchlists) && raw.watchlists.length ? raw.watchlists : d.watchlists,
    worksheets: obj(raw.worksheets, {}) as AppState['worksheets'],
    sim: { practice: raw.sim?.practice ?? null, real: raw.sim?.real ?? null },
    lessons: obj(raw.lessons, {}) as AppState['lessons'],
    answers: obj(raw.answers, {}) as AppState['answers'],
    srs: obj(raw.srs, {}) as AppState['srs'],
    termsViewed: obj(raw.termsViewed, {}) as AppState['termsViewed'],
    bookmarks: arr(raw.bookmarks),
    quizLog: arr(raw.quizLog),
    streak: { ...d.streak, ...obj(raw.streak, {}) },
    watchlist: arr(raw.watchlist),
  }
}

const dayStr = (t: number) => new Date(t).toLocaleDateString('en-CA')

function touchStreak(s: AppState): AppState {
  const today = dayStr(Date.now())
  if (s.streak.last === today) return s
  const yesterday = dayStr(Date.now() - 864e5)
  const count = s.streak.last === yesterday ? s.streak.count + 1 : 1
  return { ...s, streak: { last: today, count, best: Math.max(s.streak.best, count) } }
}

function makeActions(set: (fn: (s: AppState) => AppState) => void) {
  return {
    setTheme: (theme: Theme) => set((s) => ({ ...s, settings: { ...s.settings, theme } })),
    setAccount: (mode: 'practice' | 'real', acc: Account | null) => set((s) => ({ ...s, sim: { ...s.sim, [mode]: acc } })),
    setShowUS: (showUS: boolean) => set((s) => ({ ...s, settings: { ...s.settings, showUS } })),
    toggleWatch: (listId: string, symbol: string) =>
      set((s) => ({
        ...s,
        watchlists: s.watchlists.map((w) => (w.id !== listId ? w : { ...w, symbols: w.symbols.includes(symbol) ? w.symbols.filter((x) => x !== symbol) : [...w.symbols, symbol] })),
      })),
    addWatchlist: (name: string) => set((s) => ({ ...s, watchlists: [...s.watchlists, { id: `w${Date.now()}`, name, symbols: [] }] })),
    renameWatchlist: (id: string, name: string) => set((s) => ({ ...s, watchlists: s.watchlists.map((w) => (w.id === id ? { ...w, name } : w)) })),
    deleteWatchlist: (id: string) => set((s) => (s.watchlists.length <= 1 ? s : { ...s, watchlists: s.watchlists.filter((w) => w.id !== id) })),
    saveWorksheet: (w: Worksheet) => set((s) => ({ ...s, worksheets: { ...s.worksheets, [w.id]: { ...w, updatedAt: Date.now() } } })),
    deleteWorksheet: (id: string) => set((s) => { const ws = { ...s.worksheets }; delete ws[id]; return { ...s, worksheets: ws } }),
    setStep: (lessonId: string, step: number) =>
      set((s) => {
        const cur = s.lessons[lessonId] ?? { step: 0, attempts: 0 }
        if (cur.step === step) return s
        return { ...s, lessons: { ...s.lessons, [lessonId]: { ...cur, step } } }
      }),
    answer: (qid: string, correct: boolean) =>
      set((s) => {
        const prev = s.answers[qid] ?? { correct: 0, wrong: 0, last: false, at: 0 }
        const stat: AnswerStat = {
          correct: prev.correct + (correct ? 1 : 0),
          wrong: prev.wrong + (correct ? 0 : 1),
          last: correct,
          at: Date.now(),
        }
        return touchStreak({
          ...s,
          answers: { ...s.answers, [qid]: stat },
          srs: { ...s.srs, [qid]: schedule(s.srs[qid], correct) },
        })
      }),
    recordQuiz: (id: string, score: number, total: number, isLesson: boolean) =>
      set((s) => {
        const pct = total ? score / total : 0
        const next: AppState = { ...s, quizLog: [...s.quizLog, { id, score, total, at: Date.now() }].slice(-300) }
        if (isLesson) {
          const cur = s.lessons[id] ?? { step: 0, attempts: 0 }
          next.lessons = {
            ...s.lessons,
            [id]: {
              ...cur,
              attempts: cur.attempts + 1,
              lastScore: pct,
              bestScore: Math.max(cur.bestScore ?? 0, pct),
              completedAt: cur.completedAt ?? Date.now(),
            },
          }
        }
        return touchStreak(next)
      }),
    viewTerm: (id: string) =>
      set((s) => (s.termsViewed[id] ? s : touchStreak({ ...s, termsViewed: { ...s.termsViewed, [id]: Date.now() } }))),
    toggleBookmark: (id: string) =>
      set((s) => ({
        ...s,
        bookmarks: s.bookmarks.includes(id) ? s.bookmarks.filter((b) => b !== id) : [...s.bookmarks, id],
      })),
    replaceAll: (state: AppState) => set(() => state),
    reset: () => set(() => defaultState()),
  }
}

export type Actions = ReturnType<typeof makeActions>
const Ctx = createContext<{ state: AppState; actions: Actions } | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState | null>(null)
  const latest = useRef<AppState | null>(null)
  latest.current = state

  useEffect(() => {
    idbGet<AppState>('state').then((s) => setState(normalize(s)))
    navigator.storage?.persist?.().catch(() => {})
  }, [])

  useEffect(() => {
    if (!state) return
    const t = setTimeout(() => idbSet('state', state), 250)
    return () => clearTimeout(t)
  }, [state])

  useEffect(() => {
    const flush = () => { if (latest.current) idbSet('state', latest.current) }
    const onVis = () => { if (document.visibilityState === 'hidden') flush() }
    addEventListener('pagehide', flush)
    document.addEventListener('visibilitychange', onVis)
    return () => { removeEventListener('pagehide', flush); document.removeEventListener('visibilitychange', onVis) }
  }, [])

  const actions = useMemo(() => makeActions((fn) => setState((s) => (s ? fn(s) : s))), [])

  if (!state) {
    return <div className="grid min-h-dvh place-items-center bg-bg text-muted">Loading Market Academy…</div>
  }
  return <Ctx.Provider value={{ state, actions }}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useStore outside provider')
  return v
}
