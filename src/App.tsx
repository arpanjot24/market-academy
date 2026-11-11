import { useEffect, useState, type ReactElement } from 'react'
import { useRoute, go } from './router'
import { useStore } from './lib/store'
import { HomePage } from './pages/Home'
import { LearnPage, ModulePage, LessonPage, NotFound } from './pages/Learn'
import { GlossaryPage, TermPage, GlossaryQuizPage } from './pages/Glossary'
import { ProgressPage, ReviewPage } from './pages/Progress'
import { MorePage, SettingsPage, SoonPage } from './pages/More'

function useTheme() {
  const { state } = useStore()
  const pref = state.settings.theme
  const [sysDark, setSysDark] = useState(() => matchMedia('(prefers-color-scheme: dark)').matches)
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const f = () => setSysDark(mq.matches)
    mq.addEventListener('change', f)
    return () => mq.removeEventListener('change', f)
  }, [])
  const dark = pref === 'dark' || (pref === 'system' && sysDark)
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0a1222' : '#f3f6fb')
  }, [dark])
}

function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    addEventListener('online', on); addEventListener('offline', off)
    return () => { removeEventListener('online', on); removeEventListener('offline', off) }
  }, [])
  return online
}

const Icon = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
)

const tabs = [
  { key: 'home', label: 'Home', href: '/', d: 'M3 11l9-7 9 7v9a1 1 0 01-1 1h-5v-6h-6v6H4a1 1 0 01-1-1z' },
  { key: 'learn', label: 'Learn', href: '/learn', d: 'M4 5a2 2 0 012-2h13v16H6a2 2 0 00-2 2zM4 5v16M8 7h7' },
  { key: 'glossary', label: 'Glossary', href: '/glossary', d: 'M11 4a7 7 0 105.3 11.6L21 20M11 8v6M8 11h6' },
  { key: 'progress', label: 'Progress', href: '/progress', d: 'M4 20V10M10 20V4M16 20v-7M22 20H2' },
  { key: 'more', label: 'More', href: '/more', d: 'M4 6h16M4 12h16M4 18h16' },
]

function activeTab(path: string) {
  if (path.startsWith('/learn') || path.startsWith('/lesson')) return 'learn'
  if (path.startsWith('/glossary')) return 'glossary'
  if (path.startsWith('/progress') || path.startsWith('/review')) return 'progress'
  if (path === '/' || path === '') return 'home'
  return 'more'
}

export default function App() {
  useTheme()
  const online = useOnline()
  const path = useRoute()
  const [, a, b] = path.split('/')
  let page: ReactElement
  switch (a ?? '') {
    case '': page = <HomePage />; break
    case 'learn': page = b ? <ModulePage id={b} /> : <LearnPage />; break
    case 'lesson': page = <LessonPage key={b} id={b} />; break
    case 'glossary': page = b ? <TermPage key={b} id={b} /> : <GlossaryPage />; break
    case 'glossary-quiz': page = <GlossaryQuizPage />; break
    case 'progress': page = <ProgressPage />; break
    case 'review': page = <ReviewPage />; break
    case 'more': page = <MorePage />; break
    case 'settings': page = <SettingsPage />; break
    case 'soon': page = <SoonPage id={b} />; break
    default: page = <NotFound />
  }
  const active = activeTab(path)

  return (
    <div className="min-h-dvh bg-bg text-fg">
      {!online && <div className="sticky top-0 z-20 bg-warn px-4 py-1 pt-[calc(env(safe-area-inset-top)+4px)] text-center text-xs font-medium text-black">Offline — lessons, glossary and quizzes still work</div>}
      <main className="mx-auto max-w-xl px-4 pt-[calc(env(safe-area-inset-top)+16px)] pb-[calc(env(safe-area-inset-bottom)+92px)]">{page}</main>
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
        <div className="mx-auto grid max-w-xl grid-cols-5">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => go(t.href)} aria-current={active === t.key ? 'page' : undefined}
              className={`flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium ${active === t.key ? 'text-accent' : 'text-muted'}`}>
              <Icon d={t.d} />{t.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  )
}
