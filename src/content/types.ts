export type Level = 'beginner' | 'intermediate' | 'advanced'

export interface Question {
  id: string
  q: string
  options: string[]
  answer: number
  explain: string
  visual?: string
}

export type Block =
  | { t: 'p'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'example'; text: string; title?: string }
  | { t: 'table'; title?: string; rows: [string, string][]; note?: string }
  | { t: 'visual'; id: string; caption?: string }
  | { t: 'callout'; tone: 'tip' | 'warn' | 'info'; text: string }
  | { t: 'formula'; text: string }
  | { t: 'check'; q: Question }
  | { t: 'pattern'; id: string }
  | { t: 'widget'; id: string }
  | { t: 'link'; text: string; href: string }

export type StepKind = 'concept' | 'example' | 'numbers' | 'visual' | 'real' | 'check'

export interface Step { kind: StepKind; title: string; blocks: Block[] }

export interface LessonDef {
  id: string
  title: string
  level: Level
  minutes: number
  summary: string
  steps: Step[]
  quiz: Question[]
}

export interface Lesson extends LessonDef { moduleId: string }

export interface Module {
  id: string
  num: number
  title: string
  description: string
  lessons: Lesson[]
}

export interface Term {
  id: string
  term: string
  aka?: string[]
  category: 'Valuation' | 'Profitability' | 'Balance sheet & cash' | 'Ownership'
  simple: string
  detail: string
  formula?: string
  example: { rows: [string, string][]; note?: string }
  significance: string
  mistake: string
  questions: Question[]
}
