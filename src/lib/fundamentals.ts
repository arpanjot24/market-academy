// Ratio calculations for the company analysis worksheet. All money values in ₹ crore; shares in crore; price in ₹.

export interface FieldDef { key: string; label: string; hint: string; unit: '₹ cr' | 'cr shares' | '₹' | '%' }
export const FIELD_GROUPS: { title: string; fields: FieldDef[] }[] = [
  { title: 'Profit & loss (latest full year)', fields: [
    { key: 'revenue', label: 'Revenue', hint: 'Revenue from operations', unit: '₹ cr' },
    { key: 'revenuePrev', label: 'Revenue, previous year', hint: 'Same line, one year earlier', unit: '₹ cr' },
    { key: 'ebitda', label: 'EBITDA', hint: 'Operating profit before depreciation', unit: '₹ cr' },
    { key: 'ebit', label: 'EBIT (operating profit)', hint: 'Profit before interest and tax', unit: '₹ cr' },
    { key: 'interest', label: 'Interest / finance costs', hint: 'Finance costs line', unit: '₹ cr' },
    { key: 'netProfit', label: 'Net profit (PAT)', hint: 'Attributable to shareholders', unit: '₹ cr' },
    { key: 'netProfitPrev', label: 'Net profit, previous year', hint: 'One year earlier', unit: '₹ cr' },
  ] },
  { title: 'Balance sheet (year end)', fields: [
    { key: 'equity', label: 'Shareholders’ equity', hint: 'Share capital + reserves (net worth)', unit: '₹ cr' },
    { key: 'debt', label: 'Total borrowings', hint: 'Long-term + short-term borrowings', unit: '₹ cr' },
    { key: 'cash', label: 'Cash & liquid investments', hint: 'Cash, bank balances, liquid funds', unit: '₹ cr' },
  ] },
  { title: 'Cash flow (latest full year)', fields: [
    { key: 'cfo', label: 'Cash from operations', hint: 'Net cash from operating activities', unit: '₹ cr' },
    { key: 'capex', label: 'Capital expenditure', hint: 'Purchase of property, plant & equipment (enter as positive)', unit: '₹ cr' },
  ] },
  { title: 'Market & ownership', fields: [
    { key: 'shares', label: 'Shares outstanding', hint: 'In crore (e.g. 362 for 362 crore)', unit: 'cr shares' },
    { key: 'price', label: 'Share price', hint: 'Price on the date you note', unit: '₹' },
    { key: 'dps', label: 'Dividend per share (year)', hint: 'Total dividends declared for the year', unit: '₹' },
    { key: 'promoter', label: 'Promoter holding', hint: 'From the shareholding pattern', unit: '%' },
    { key: 'pledged', label: 'Promoter shares pledged', hint: '% of promoter holding', unit: '%' },
  ] },
]

export type Verdict = 'good' | 'ok' | 'weak' | null
export interface Ratio { key: string; label: string; value: number | null; fmt: 'pct' | 'x' | 'rs' | 'cr'; verdict: Verdict; better: 'high' | 'low' | null; note: string; glossary?: string }

const div = (a?: number, b?: number) => (a === undefined || b === undefined || !Number.isFinite(a) || !Number.isFinite(b) || b === 0 ? null : a / b)
const band = (v: number | null, good: number, ok: number, higherBetter = true): Verdict => {
  if (v === null) return null
  if (higherBetter) return v >= good ? 'good' : v >= ok ? 'ok' : 'weak'
  return v <= good ? 'good' : v <= ok ? 'ok' : 'weak'
}

export function computeRatios(f: Record<string, number | undefined>, isFinancial = false): Ratio[] {
  const g = (k: string) => f[k]
  const revG = div((g('revenue') ?? NaN) - (g('revenuePrev') ?? NaN), g('revenuePrev'))
  const profG = div((g('netProfit') ?? NaN) - (g('netProfitPrev') ?? NaN), g('netProfitPrev') !== undefined ? Math.abs(g('netProfitPrev')!) : undefined)
  const eps = div(g('netProfit'), g('shares'))
  const mcap = g('price') !== undefined && g('shares') !== undefined ? g('price')! * g('shares')! : null
  const ev = mcap !== null && g('debt') !== undefined && g('cash') !== undefined ? mcap + g('debt')! - g('cash')! : null
  const fcf = g('cfo') !== undefined && g('capex') !== undefined ? g('cfo')! - Math.abs(g('capex')!) : null
  const capEmployed = g('equity') !== undefined && g('debt') !== undefined ? g('equity')! + g('debt')! : undefined
  const roe = div(g('netProfit'), g('equity'))
  const roce = div(g('ebit'), capEmployed)
  const de = div(g('debt'), g('equity'))
  const cover = div(g('ebit'), g('interest'))
  const fcfConv = fcf !== null ? div(fcf, g('netProfit')) : null
  const pe = div(g('price'), eps ?? undefined)
  return [
    { key: 'revG', label: 'Revenue growth (YoY)', value: revG, fmt: 'pct', verdict: band(revG, 0.12, 0.05), better: 'high', note: 'Above inflation (~4–6%) means real growth. One year can mislead — check 5 years.', glossary: 'revenue-growth' },
    { key: 'profG', label: 'Net profit growth (YoY)', value: profG, fmt: 'pct', verdict: band(profG, 0.12, 0.05), better: 'high', note: 'Check whether one-off gains or losses drove the change.', glossary: 'eps' },
    { key: 'ebitdaM', label: 'EBITDA margin', value: div(g('ebitda'), g('revenue')), fmt: 'pct', verdict: null, better: 'high', note: 'Compare only with companies in the same industry.', glossary: 'ebitda' },
    { key: 'opM', label: 'Operating (EBIT) margin', value: div(g('ebit'), g('revenue')), fmt: 'pct', verdict: null, better: 'high', note: 'Industry-specific. Watch the trend over years.', glossary: 'operating-margin' },
    { key: 'netM', label: 'Net profit margin', value: div(g('netProfit'), g('revenue')), fmt: 'pct', verdict: null, better: 'high', note: 'Includes interest, tax and one-offs.', glossary: 'net-margin' },
    { key: 'roe', label: 'Return on equity (ROE)', value: roe, fmt: 'pct', verdict: band(roe, 0.15, 0.1), better: 'high', note: 'Uses year-end equity (simplified). High ROE driven by debt is lower quality.', glossary: 'roe' },
    { key: 'roce', label: 'Return on capital employed (ROCE)', value: isFinancial ? null : roce, fmt: 'pct', verdict: isFinancial ? null : band(roce, 0.15, 0.1), better: 'high', note: isFinancial ? 'Not meaningful for banks and lenders.' : 'Should beat the cost of borrowing comfortably.', glossary: 'roce' },
    { key: 'de', label: 'Debt to equity', value: isFinancial ? null : de, fmt: 'x', verdict: isFinancial ? null : band(de, 0.5, 1, false), better: 'low', note: isFinancial ? 'Lenders borrow by design — judge capital adequacy and bad loans instead.' : 'Rule of thumb: below 1 for non-financial companies.', glossary: 'de' },
    { key: 'cover', label: 'Interest coverage (EBIT ÷ interest)', value: isFinancial ? null : cover, fmt: 'x', verdict: isFinancial ? null : band(cover, 5, 2), better: 'high', note: 'Below 2× means a profit dip could make interest hard to pay.' },
    { key: 'netDebt', label: 'Net debt (debt − cash)', value: g('debt') !== undefined && g('cash') !== undefined ? g('debt')! - g('cash')! : null, fmt: 'cr', verdict: null, better: 'low', note: 'Negative means more cash than debt (net cash).' },
    { key: 'fcf', label: 'Free cash flow', value: fcf, fmt: 'cr', verdict: fcf === null ? null : fcf > 0 ? 'good' : 'weak', better: 'high', note: 'Negative FCF can be fine during heavy, high-return investment.', glossary: 'fcf' },
    { key: 'fcfConv', label: 'FCF ÷ net profit', value: fcfConv, fmt: 'pct', verdict: band(fcfConv, 0.7, 0.3), better: 'high', note: 'How much reported profit turns into free cash.' },
    { key: 'eps', label: 'EPS', value: eps, fmt: 'rs', verdict: null, better: null, note: 'Net profit ÷ shares.', glossary: 'eps' },
    { key: 'mcap', label: 'Market cap', value: mcap, fmt: 'cr', verdict: null, better: null, note: 'Price × shares.', glossary: 'market-cap' },
    { key: 'pe', label: 'P/E', value: pe, fmt: 'x', verdict: null, better: 'low', note: 'Compare with peers and the company’s own history.', glossary: 'pe' },
    { key: 'pb', label: 'P/B', value: mcap !== null ? div(mcap, g('equity')) : null, fmt: 'x', verdict: null, better: 'low', note: 'Most useful for banks and financials.', glossary: 'pb' },
    { key: 'evEbitda', label: 'EV / EBITDA', value: isFinancial || ev === null ? null : div(ev, g('ebitda')), fmt: 'x', verdict: null, better: 'low', note: isFinancial ? 'Not meaningful for lenders.' : 'Accounts for debt and cash.', glossary: 'ev' },
    { key: 'dy', label: 'Dividend yield', value: div(g('dps'), g('price')), fmt: 'pct', verdict: null, better: 'high', note: 'A very high yield can signal an expected cut.', glossary: 'dividend-yield' },
    { key: 'promoter', label: 'Promoter holding', value: g('promoter') !== undefined ? g('promoter')! / 100 : null, fmt: 'pct', verdict: null, better: null, note: 'Context matters; many good companies have no promoter.', glossary: 'promoter-holding' },
    { key: 'pledged', label: 'Promoter shares pledged', value: g('pledged') !== undefined ? g('pledged')! / 100 : null, fmt: 'pct', verdict: g('pledged') === undefined ? null : g('pledged')! === 0 ? 'good' : g('pledged')! < 10 ? 'ok' : 'weak', better: 'low', note: 'High pledging is a risk signal.', glossary: 'pledged-shares' },
  ]
}

export function fmtRatio(r: Ratio): string {
  if (r.value === null || !Number.isFinite(r.value)) return '—'
  const v = r.value
  switch (r.fmt) {
    case 'pct': return `${(v * 100).toFixed(1)}%`
    case 'x': return `${v.toFixed(2)}×`
    case 'rs': return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`
    case 'cr': return `₹${Math.round(v).toLocaleString('en-IN')} cr`
  }
}
