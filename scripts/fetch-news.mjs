// Collects headlines from free, public RSS feeds and writes public/news.json.
// Only headline, link, source and publication time are stored — readers open the original article.
// Run: node scripts/fetch-news.mjs   (runs automatically in GitHub Actions every few hours)
import fs from 'node:fs'

const FEEDS = [
  { source: 'RBI', kind: 'official', url: 'https://www.rbi.org.in/pressreleases_rss.xml' },
  { source: 'SEBI', kind: 'official', url: 'https://www.sebi.gov.in/sebirss.xml' },
  { source: 'The Economic Times', kind: 'media', url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms' },
  { source: 'Mint', kind: 'media', url: 'https://www.livemint.com/rss/markets' },
  { source: 'Business Standard', kind: 'media', url: 'https://www.business-standard.com/rss/markets-106.rss' },
  { source: 'Moneycontrol', kind: 'media', url: 'https://www.moneycontrol.com/rss/marketreports.xml' },
]

const CATEGORIES = [
  ['rbi', /\b(rbi|repo|monetary policy|mpc|reserve bank|liquidity|crr)\b/i],
  ['ipo', /\b(ipo|listing|offer for sale|grey market|gmp|anchor investors?)\b/i],
  ['regulation', /\b(sebi|circular|regulat|penalt|order against|settlement order|consultation paper)\b/i],
  ['flows', /\b(fii|fpi|dii|foreign investors?|institutional|inflows?|outflows?)\b/i],
  ['global', /\b(fed|wall street|us markets?|dow|nasdaq|s&p|china|europe|global|tariff|war|geopolitic|sterling|euro|yen)\b/i],
  ['results', /\b(q[1-4]|quarter|results?|earnings|profit|revenue|ebitda|net income|guidance|dividend)\b/i],
  ['commodities', /\b(crude|oil|brent|gold|silver|rupee|dollar|forex|currency)\b/i],
  ['economy', /\b(gdp|inflation|cpi|wpi|fiscal|budget|tax|gst|pmi|iip|trade deficit|exports?|imports?|cabinet|ministry)\b/i],
  ['markets', /\b(sensex|nifty|market|stocks?|shares?|index|rally|sell-?off|bse|nse)\b/i],
]

const decode = (s) => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/<[^>]+>/g, '')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
  .replace(/\s+/g, ' ').trim()
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i')); return m ? decode(m[1]) : '' }

async function fetchFeed(f) {
  const res = await fetch(f.url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MarketAcademyNews/1.0)' }, signal: AbortSignal.timeout(20000) })
  if (!res.ok) throw new Error(`${res.status}`)
  const xml = await res.text()
  const items = xml.split(/<item[\s>]/i).slice(1)
  return items.map((it) => {
    const title = tag(it, 'title')
    const link = tag(it, 'link') || (it.match(/<guid[^>]*>([^<]+)<\/guid>/i)?.[1] ?? '')
    const date = Date.parse(tag(it, 'pubDate') || tag(it, 'dc:date') || '')
    const category = f.source === 'RBI' ? 'rbi' : f.source === 'SEBI' ? 'regulation' : (CATEGORIES.find(([, re]) => re.test(title)) ?? ['other'])[0]
    return { title, link: link.trim(), source: f.source, kind: f.kind, published: Number.isFinite(date) ? new Date(date).toISOString() : null, category }
  }).filter((x) => x.title && /^https?:\/\//.test(x.link))
}

const results = await Promise.allSettled(FEEDS.map(fetchFeed))
const status = FEEDS.map((f, i) => ({ source: f.source, ok: results[i].status === 'fulfilled', count: results[i].status === 'fulfilled' ? results[i].value.length : 0, error: results[i].status === 'rejected' ? String(results[i].reason?.message ?? results[i].reason) : undefined }))
const seen = new Set()
const cutoff = Date.now() - 4 * 864e5
const items = results.flatMap((r) => (r.status === 'fulfilled' ? r.value : []))
  .filter((x) => { const k = x.title.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true })
  .filter((x) => !x.published || Date.parse(x.published) >= cutoff)
  .sort((a, b) => (Date.parse(b.published ?? 0) || 0) - (Date.parse(a.published ?? 0) || 0))
  .slice(0, 200)

if (!items.length) { console.error('No items fetched; leaving existing news.json untouched'); process.exit(0) }
fs.mkdirSync('public', { recursive: true })
fs.writeFileSync('public/news.json', JSON.stringify({ fetchedAt: new Date().toISOString(), feeds: status, items }, null, 1))
console.log(`news.json: ${items.length} items`, status.map((s) => `${s.source}:${s.ok ? s.count : 'ERR ' + s.error}`).join(', '))
