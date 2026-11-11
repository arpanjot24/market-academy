// Small helpers that keep lesson content readable.
// Convention: the FIRST option of every question is the correct one; options are shuffled when shown.
import type { Block, Question, Step, StepKind } from './types'

export const p = (text: string): Block => ({ t: 'p', text })
export const ul = (...items: string[]): Block => ({ t: 'list', items })
export const ex = (text: string, title?: string): Block => ({ t: 'example', text, title })
export const table = (title: string | undefined, rows: [string, string][], note?: string): Block => ({ t: 'table', title, rows, note })
export const vis = (id: string, caption?: string): Block => ({ t: 'visual', id, caption })
export const tip = (text: string): Block => ({ t: 'callout', tone: 'tip', text })
export const warn = (text: string): Block => ({ t: 'callout', tone: 'warn', text })
export const info = (text: string): Block => ({ t: 'callout', tone: 'info', text })
export const formula = (text: string): Block => ({ t: 'formula', text })

export const Q = (id: string, q: string, options: string[], explain: string, visual?: string): Question => ({
  id, q, options, answer: 0, explain, visual,
})

export const step = (kind: StepKind, title: string, ...blocks: Block[]): Step => ({ kind, title, blocks })
export const check = (q: Question): Step => ({ kind: 'check', title: 'Knowledge check', blocks: [{ t: 'check', q }] })
