import { useEffect, useState } from 'react'

export interface NewsItem { title: string; link: string; source: string; kind: 'official' | 'media'; published: string | null; category: string }
export interface NewsData { fetchedAt: string; feeds: { source: string; ok: boolean; count: number }[]; items: NewsItem[] }

let cache: NewsData | null = null

export function useNews() {
  const [data, setData] = useState<NewsData | null>(cache)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let alive = true
    fetch('./news.json', { cache: 'no-cache' })
      .then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json() })
      .then((d: NewsData) => { cache = d; if (alive) setData(d) })
      .catch((e) => { if (alive && !cache) setError(String(e.message ?? e)) })
    return () => { alive = false }
  }, [])
  return { data, error }
}

export function timeAgo(iso: string | null) {
  if (!iso) return 'date not given'
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} h ago`
  return `${Math.round(h / 24)} d ago`
}

export const fmtIST = (iso: string) => new Date(iso).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short' }) + ' IST'

export const CATEGORY_INFO: Record<string, { label: string; why: string; lesson?: string }> = {
  rbi: { label: 'RBI & monetary policy', why: 'RBI decisions on rates and liquidity change borrowing costs, bond yields and the value investors put on future profits. Banks, NBFCs, real estate and autos react first.', lesson: 'm2-l3' },
  regulation: { label: 'SEBI & regulation', why: 'SEBI rules decide how markets, brokers, IPOs and companies must behave. Orders against companies or people can signal governance problems.', lesson: 'm1-l4' },
  results: { label: 'Company results & earnings', why: 'Earnings drive share prices over the long run. Compare growth, margins and guidance with expectations — the reaction depends on the surprise.', lesson: 'm6-l4' },
  ipo: { label: 'IPOs & listings', why: 'New issues show where investor appetite is. Read who is selling (fresh issue vs offer for sale) before getting excited by listing gains.', lesson: 'm1-l3' },
  flows: { label: 'FII / DII flows', why: 'Large, sustained foreign or domestic institutional buying and selling can move the whole market for weeks.', lesson: 'm2-l7' },
  commodities: { label: 'Currency & commodities', why: 'The rupee, crude oil and gold affect inflation, import costs and exporters’ earnings — India imports most of its oil.', lesson: 'm2-l6' },
  economy: { label: 'Indian economy', why: 'Inflation, growth, the fiscal deficit and taxes shape interest rates and corporate earnings across sectors.', lesson: 'm2-l2' },
  global: { label: 'Global markets', why: 'US rates, the dollar and global risk appetite drive foreign flows into India and move export-heavy sectors such as IT.', lesson: 'm2-l8' },
  markets: { label: 'Indian markets', why: 'Day-to-day market moves. Useful context, but single-day moves rarely change a company’s long-term value.', lesson: 'm1-l6' },
  other: { label: 'Other business news', why: 'Company and industry developments. Ask: does this change the company’s earnings over the next several years?' },
}
