// Symbols verified on 11 Nov 2026 to display in TradingView's free embeddable widgets.
// NSE symbols are not licensed for free widgets, so BSE listings are used (prices are the same company, BSE exchange).

export interface Stock { sym: string; nse: string; name: string; sector: string }

export const SECTORS = [
  'Banks', 'Financial services', 'IT services', 'Oil, gas & energy', 'FMCG', 'Automobiles', 'Metals & mining',
  'Pharma & healthcare', 'Infrastructure & capital goods', 'Cement & materials', 'Consumer & retail', 'Telecom',
] as const

const s = (sym: string, name: string, sector: string, nse = sym): Stock => ({ sym: `BSE:${sym}`, nse, name, sector })

export const stocks: Stock[] = [
  s('HDFCBANK', 'HDFC Bank', 'Banks'), s('ICICIBANK', 'ICICI Bank', 'Banks'), s('SBIN', 'State Bank of India', 'Banks'),
  s('AXISBANK', 'Axis Bank', 'Banks'), s('KOTAKBANK', 'Kotak Mahindra Bank', 'Banks'),
  s('BAJFINANCE', 'Bajaj Finance', 'Financial services'), s('BAJAJFINSV', 'Bajaj Finserv', 'Financial services'),
  s('SHRIRAMFIN', 'Shriram Finance', 'Financial services'), s('JIOFIN', 'Jio Financial Services', 'Financial services'),
  s('SBILIFE', 'SBI Life Insurance', 'Financial services'), s('HDFCLIFE', 'HDFC Life Insurance', 'Financial services'), s('LICI', 'Life Insurance Corporation of India', 'Financial services'),
  s('TCS', 'Tata Consultancy Services', 'IT services'), s('INFY', 'Infosys', 'IT services'), s('HCLTECH', 'HCL Technologies', 'IT services'),
  s('WIPRO', 'Wipro', 'IT services'), s('TECHM', 'Tech Mahindra', 'IT services'),
  s('RELIANCE', 'Reliance Industries', 'Oil, gas & energy'), s('ONGC', 'Oil & Natural Gas Corporation', 'Oil, gas & energy'), s('NTPC', 'NTPC', 'Oil, gas & energy'),
  s('POWERGRID', 'Power Grid Corporation', 'Oil, gas & energy'), s('COALINDIA', 'Coal India', 'Oil, gas & energy'), s('TATAPOWER', 'Tata Power', 'Oil, gas & energy'),
  s('HINDUNILVR', 'Hindustan Unilever', 'FMCG'), s('ITC', 'ITC', 'FMCG'), s('NESTLEIND', 'Nestlé India', 'FMCG'),
  s('BRITANNIA', 'Britannia Industries', 'FMCG'), s('TATACONSUM', 'Tata Consumer Products', 'FMCG'), s('DABUR', 'Dabur India', 'FMCG'),
  s('MARUTI', 'Maruti Suzuki India', 'Automobiles'), s('M_M', 'Mahindra & Mahindra', 'Automobiles', 'M&M'), s('TMPV', 'Tata Motors Passenger Vehicles', 'Automobiles'),
  s('BAJAJ_AUTO', 'Bajaj Auto', 'Automobiles', 'BAJAJ-AUTO'), s('EICHERMOT', 'Eicher Motors', 'Automobiles'), s('HEROMOTOCO', 'Hero MotoCorp', 'Automobiles'),
  s('TATASTEEL', 'Tata Steel', 'Metals & mining'), s('JSWSTEEL', 'JSW Steel', 'Metals & mining'), s('HINDALCO', 'Hindalco Industries', 'Metals & mining'),
  s('SUNPHARMA', 'Sun Pharmaceutical', 'Pharma & healthcare'), s('DRREDDY', "Dr. Reddy's Laboratories", 'Pharma & healthcare'), s('CIPLA', 'Cipla', 'Pharma & healthcare'),
  s('APOLLOHOSP', 'Apollo Hospitals', 'Pharma & healthcare'), s('MAXHEALTH', 'Max Healthcare', 'Pharma & healthcare'),
  s('LT', 'Larsen & Toubro', 'Infrastructure & capital goods'), s('ADANIPORTS', 'Adani Ports & SEZ', 'Infrastructure & capital goods'), s('ADANIENT', 'Adani Enterprises', 'Infrastructure & capital goods'),
  s('BEL', 'Bharat Electronics', 'Infrastructure & capital goods'), s('HAL', 'Hindustan Aeronautics', 'Infrastructure & capital goods'),
  s('ULTRACEMCO', 'UltraTech Cement', 'Cement & materials'), s('GRASIM', 'Grasim Industries', 'Cement & materials'), s('ASIANPAINT', 'Asian Paints', 'Cement & materials'), s('PIDILITIND', 'Pidilite Industries', 'Cement & materials'),
  s('TITAN', 'Titan Company', 'Consumer & retail'), s('TRENT', 'Trent', 'Consumer & retail'), s('DMART', 'Avenue Supermarts (DMart)', 'Consumer & retail'),
  s('ETERNAL', 'Eternal (Zomato)', 'Consumer & retail'), s('INDIGO', 'InterGlobe Aviation (IndiGo)', 'Consumer & retail'), s('IRCTC', 'IRCTC', 'Consumer & retail'),
  s('BHARTIARTL', 'Bharti Airtel', 'Telecom'),
]
export const stockBySym: Record<string, Stock> = Object.fromEntries(stocks.map((x) => [x.sym, x]))

export interface Quote { name: string; displayName: string }
const q = (name: string, displayName: string): Quote => ({ name, displayName })

export const INDIA_INDICES: Quote[] = [
  q('BSE:SENSEX', 'SENSEX'), q('BSE:NIFTYBEES', 'NIFTY 50 ETF (proxy)'), q('BSE:BANKBEES', 'Nifty Bank ETF (proxy)'),
  q('BSE:SNSX50', 'Sensex 50'), q('BSE:BSE100', 'BSE 100'), q('BSE:BSE500', 'BSE 500'), q('BSE:MID150', 'BSE Midcap 150'), q('BSE:SML250', 'BSE Smallcap 250'),
]
export const SECTOR_INDICES: Quote[] = [
  q('BSE:IT', 'IT'), q('BSE:FINSER', 'Financial Services'), q('BSE:FMCG', 'FMCG'), q('BSE:AUTO', 'Auto'), q('BSE:METAL', 'Metal'),
  q('BSE:HC', 'Healthcare'), q('BSE:OILGAS', 'Oil & Gas'), q('BSE:ENERGY', 'Energy'), q('BSE:POWER', 'Power'), q('BSE:REALTY', 'Realty'),
  q('BSE:TELCOM', 'Telecom'), q('BSE:INDSTR', 'Industrials'), q('BSE:CDGS', 'Consumer Discretionary'), q('BSE:CPSE', 'CPSE (public sector)'),
]
export const GLOBAL_MACRO: Quote[] = [q('FX_IDC:USDINR', 'USD / INR'), q('TVC:UKOIL', 'Brent crude ($/bbl)'), q('TVC:GOLD', 'Gold ($/oz)'), q('AMEX:SPY', 'S&P 500 ETF (US)')]
export const US_MARKETS: Quote[] = [
  q('AMEX:SPY', 'S&P 500 ETF'), q('NASDAQ:QQQ', 'Nasdaq 100 ETF'), q('AMEX:DIA', 'Dow Jones ETF'),
  q('NASDAQ:AAPL', 'Apple'), q('NASDAQ:MSFT', 'Microsoft'), q('NASDAQ:NVDA', 'Nvidia'), q('NASDAQ:AMZN', 'Amazon'), q('NASDAQ:GOOGL', 'Alphabet'),
]

export const displayName = (sym: string) => stockBySym[sym]?.name ?? [...INDIA_INDICES, ...SECTOR_INDICES, ...GLOBAL_MACRO, ...US_MARKETS].find((x) => x.name === sym)?.displayName ?? sym.split(':')[1] ?? sym

export const DATA_NOTE = 'Prices and charts: TradingView free widgets using BSE data, usually end-of-day (marked “E”) or delayed — never real-time. Check the time shown in each widget. NIFTY indices are not licensed for free widgets, so NIFTY ETFs are shown as proxies.'
