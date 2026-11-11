// Module 3 lessons are built from the glossary, so lessons and glossary never disagree.
import { p, table, tip, warn, info, formula, step, check } from './dsl'
import { termById, definitionQuestions } from './glossary'
import type { Block, LessonDef, Level, Step } from './types'

interface Group { id: string; title: string; level: Level; summary: string; terms: string[]; real: string }

const groups: Group[] = [
  { id: 'm3-l1', title: 'Earnings and valuation: EPS, P/E and PEG', level: 'intermediate', terms: ['eps', 'pe', 'peg'],
    summary: 'How much profit each share earns, and how much the market pays for it.',
    real: 'On any stock page (NSE, BSE or a free screener), find the EPS for the last four quarters and the current P/E. Then look at the P/E of two competitors in the same sector. Ask: is a higher P/E backed by faster, more reliable growth?' },
  { id: 'm3-l2', title: 'Book value and the P/B ratio', level: 'intermediate', terms: ['book-value', 'pb'],
    summary: 'Accounting net worth, and when price-to-book is useful.',
    real: 'P/B is the first ratio analysts check for banks and NBFCs. Compare P/B with ROE across a few large banks: the market usually pays a higher P/B for banks with a higher, steadier ROE and cleaner loan books.' },
  { id: 'm3-l3', title: 'Profitability: revenue growth, EBITDA and margins', level: 'intermediate', terms: ['revenue-growth', 'ebitda', 'operating-margin', 'net-margin'],
    summary: 'How fast a company grows, and how much of each rupee of sales it keeps.',
    real: 'Quarterly results in India typically report revenue, EBITDA, EBITDA margin and net profit (PAT) with YoY changes. Read them in that order: did sales grow, did margins hold, and did profit grow for operating reasons or because of “other income” and one-offs?' },
  { id: 'm3-l4', title: 'Returns on capital: ROE and ROCE', level: 'intermediate', terms: ['roe', 'roce'],
    summary: 'How efficiently a company turns capital into profit.',
    real: 'Look at a company’s ROE and ROCE over 5–10 years, not one year. Consistently high returns with low debt are a hallmark of businesses with a durable advantage. A high ROE with a low ROCE is a clue that borrowing is doing the work.' },
  { id: 'm3-l5', title: 'Balance-sheet health: debt, working capital and free cash flow', level: 'advanced', terms: ['de', 'working-capital', 'fcf'],
    summary: 'Whether the business can survive bad times and fund itself.',
    real: 'Many Indian corporate collapses involved rising debt, ballooning receivables and weak cash flow while reported profits still looked fine. Always read the cash flow statement alongside the profit and loss statement.' },
  { id: 'm3-l6', title: 'Valuing the whole business: market cap, EV, dividend yield, intrinsic value', level: 'advanced', terms: ['market-cap', 'ev', 'dividend-yield', 'intrinsic-value'],
    summary: 'From the market’s price tag to your own estimate of value.',
    real: 'Professional analysts usually triangulate: a multiple (P/E or EV/EBITDA) versus peers and history, plus a DCF estimate with conservative assumptions. If the methods disagree wildly, find out why before investing.' },
  { id: 'm3-l7', title: 'Ownership signals: promoter holding and pledged shares', level: 'intermediate', terms: ['promoter-holding', 'pledged-shares'],
    summary: 'Who owns the company, and warning signs in their holdings.',
    real: 'Each quarter, companies file their shareholding pattern with NSE and BSE. Track three numbers over time: promoter holding, the percentage of promoter shares pledged, and institutional (FPI + DII) holding.' },
]

function termStep(id: string): Step {
  const t = termById[id]
  const blocks: Block[] = [info(`**In simple words:** ${t.simple}`), p(t.detail)]
  if (t.formula) blocks.push(formula(t.formula))
  blocks.push(table('Numerical example (illustrative numbers)', t.example.rows, t.example.note))
  blocks.push(tip(`**Why it matters:** ${t.significance}`))
  blocks.push(warn(`**Common misunderstanding:** ${t.mistake}`))
  return step('concept', t.term, ...blocks)
}

const defQ = (id: string) => definitionQuestions.find((q) => q.id === `g-def-${id}`)!

export const module3Lessons: LessonDef[] = groups.map((g) => ({
  id: g.id,
  title: g.title,
  level: g.level,
  minutes: g.terms.length * 3 + 2,
  summary: g.summary,
  steps: [
    ...g.terms.map(termStep),
    step('real', 'Putting it to work', p(g.real)),
    check(defQ(g.terms[0])),
  ],
  quiz: g.terms.flatMap((id) => termById[id].questions),
}))

export const lessonForTerm: Record<string, string> = Object.fromEntries(groups.flatMap((g) => g.terms.map((t) => [t, g.id])))
