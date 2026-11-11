import type { ReactNode } from 'react'
import { go } from '../router'

export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return <>{parts.map((s, i) => (s.startsWith('**') && s.endsWith('**') ? <strong key={i} className="font-semibold text-fg">{s.slice(2, -2)}</strong> : s))}</>
}

export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = `rounded-2xl border border-line bg-card p-4 ${onClick ? 'w-full text-left active:scale-[0.99] transition' : ''} ${className}`
  return onClick ? <button className={cls} onClick={onClick}>{children}</button> : <div className={cls}>{children}</div>
}

export function Header({ title, subtitle, back, right }: { title: string; subtitle?: string; back?: string; right?: ReactNode }) {
  return (
    <header className="mb-4 flex items-center gap-3">
      {back && (
        <button aria-label="Back" onClick={() => (history.length > 1 ? history.back() : go(back))}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-line bg-card text-fg">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
        </button>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-xl font-bold">{title}</h1>
        {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
      </div>
      {right}
    </header>
  )
}

export function Bar({ value, tone = 'accent' }: { value: number; tone?: 'accent' | 'up' | 'warn' | 'down' }) {
  const color = { accent: 'bg-accent', up: 'bg-up', warn: 'bg-warn', down: 'bg-down' }[tone]
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-card2">
      <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%` }} />
    </div>
  )
}

export function Ring({ value, size = 64, label }: { value: number; size?: number; label?: string }) {
  const r = size / 2 - 6, c = 2 * Math.PI * r
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-card2" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-up" strokeWidth="6" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0, Math.min(1, value)))} />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-sm font-bold tabular">{label ?? `${Math.round(value * 100)}%`}</div>
    </div>
  )
}

export function Chip({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'up' | 'down' | 'warn' | 'accent' }) {
  const cls = {
    muted: 'bg-card2 text-muted', up: 'bg-up/15 text-up', down: 'bg-down/15 text-down', warn: 'bg-warn/15 text-warn', accent: 'bg-accent/15 text-accent',
  }[tone]
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{children}</span>
}

export function Button({ children, onClick, variant = 'primary', className = '', disabled }: {
  children: ReactNode; onClick?: () => void; variant?: 'primary' | 'secondary' | 'danger'; className?: string; disabled?: boolean
}) {
  const v = {
    primary: 'bg-accent text-white',
    secondary: 'border border-line bg-card text-fg',
    danger: 'border border-down/40 bg-down/10 text-down',
  }[variant]
  return (
    <button disabled={disabled} onClick={onClick}
      className={`min-h-12 rounded-xl px-4 font-semibold transition active:scale-[0.98] disabled:opacity-40 ${v} ${className}`}>
      {children}
    </button>
  )
}

export const levelTone = (l: string) => (l === 'beginner' ? 'up' : l === 'intermediate' ? 'warn' : 'down') as 'up' | 'warn' | 'down'
export const pct = (v: number) => `${Math.round(v * 100)}%`
