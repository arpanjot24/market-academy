// Educational illustrations. Colours come from theme tokens so they work in dark and light mode.
import type { ReactElement } from 'react'

const T = 'fill-fg text-[11px]'
const M = 'fill-muted text-[10px]'

function Flow({ items }: { items: [string, string][] }) {
  return (
    <div className="flex flex-col items-stretch">
      {items.map(([a, b], i) => (
        <div key={i} className="flex flex-col items-center">
          <div className="w-full rounded-xl border border-line bg-card2 px-3 py-2 text-center">
            <div className="text-sm font-semibold">{a}</div>
            <div className="text-xs text-muted">{b}</div>
          </div>
          {i < items.length - 1 && <div className="py-0.5 text-accent">↓</div>}
        </div>
      ))}
    </div>
  )
}

const ownership = () => (
  <svg viewBox="0 0 220 72" className="w-full">
    {Array.from({ length: 100 }, (_, i) => (
      <rect key={i} x={(i % 20) * 11} y={Math.floor(i / 20) * 11} width="10" height="10" rx="2" className={i < 5 ? 'fill-up' : 'fill-card2'} />
    ))}
    <text x="0" y="68" className={M}>1 square = 10 shares · 5 green squares = 50 shares = 5%</text>
  </svg>
)

const mcapTiers = () => (
  <svg viewBox="0 0 300 160" className="w-full">
    {[
      { w: 120, y: 8, t: 'Large cap', s: 'Rank 1–100', o: 1 },
      { w: 200, y: 58, t: 'Mid cap', s: 'Rank 101–250', o: 0.7 },
      { w: 280, y: 108, t: 'Small cap', s: 'Rank 251 onwards', o: 0.45 },
    ].map((r) => (
      <g key={r.t}>
        <rect x={150 - r.w / 2} y={r.y} width={r.w} height="44" rx="8" className="fill-accent" opacity={r.o} />
        <text x="150" y={r.y + 20} textAnchor="middle" className="fill-white text-[12px] font-semibold">{r.t}</text>
        <text x="150" y={r.y + 35} textAnchor="middle" className="fill-white text-[10px]">{r.s}</text>
      </g>
    ))}
  </svg>
)

const indexWeights = () => {
  const rows = [{ n: 'A', w: 60, m: 2 }, { n: 'B', w: 30, m: -1 }, { n: 'C', w: 10, m: -3 }]
  return (
    <svg viewBox="0 0 300 120" className="w-full">
      {rows.map((r, i) => (
        <g key={r.n} transform={`translate(0 ${i * 32 + 6})`}>
          <text x="0" y="15" className={T}>Stock {r.n}</text>
          <rect x="52" y="4" width={r.w * 2.6} height="16" rx="4" className="fill-accent" opacity="0.8" />
          <text x={56} y="16" className="fill-white text-[10px]">{r.w}%</text>
          <text x="300" y="15" textAnchor="end" className={`text-[11px] font-semibold ${r.m > 0 ? 'fill-up' : 'fill-down'}`}>
            {r.m > 0 ? '+' : ''}{r.m}% → {((r.w * r.m) / 100 > 0 ? '+' : '')}{((r.w * r.m) / 100).toFixed(1)}%
          </text>
        </g>
      ))}
      <text x="0" y="114" className={M}>Index move = sum of (weight × move) = +0.6%</text>
    </svg>
  )
}

const BULL = '0,80 20,60 35,68 55,45 70,52 90,30 105,38 125,15 140,20'
const BEAR = '0,10 20,30 35,22 55,45 70,38 90,60 105,52 125,75 140,70'

const twoCharts = (labels: [string, string], colored: boolean) => (
  <svg viewBox="0 0 310 130" className="w-full">
    {[BULL, BEAR].map((pts, i) => (
      <g key={i} transform={`translate(${i * 165 + 5} 10)`}>
        <rect x="-5" y="-5" width="150" height="100" rx="8" className="fill-card2" />
        <polyline points={pts} fill="none" strokeWidth="2.5" strokeLinejoin="round"
          className={colored ? (i === 0 ? 'stroke-up' : 'stroke-down') : 'stroke-fg'} />
        <text x="70" y="112" textAnchor="middle" className={T}>{labels[i]}</text>
      </g>
    ))}
  </svg>
)

const orderTypes = () => {
  const lines = [
    { y: 25, t: 'Sell limit ₹520 — sells at ₹520 or higher', c: 'stroke-up', f: 'fill-up' },
    { y: 65, t: 'Current price ₹500', c: 'stroke-fg', f: 'fill-fg' },
    { y: 95, t: 'Buy limit ₹490 — buys at ₹490 or lower', c: 'stroke-accent', f: 'fill-accent' },
    { y: 135, t: 'Stop-loss trigger ₹470 — exit if hit', c: 'stroke-down', f: 'fill-down' },
  ]
  return (
    <svg viewBox="0 0 300 160" className="w-full">
      <polyline points="0,80 12,70 24,74 36,60 48,66 60,62 72,65" fill="none" strokeWidth="2" className="stroke-muted" />
      {lines.map((l) => (
        <g key={l.y}>
          <line x1="76" x2="300" y1={l.y} y2={l.y} strokeWidth="1.5" strokeDasharray={l.y === 65 ? '' : '4 3'} className={l.c} />
          <text x="80" y={l.y - 5} className={`text-[10px] ${l.f}`}>{l.t}</text>
        </g>
      ))}
    </svg>
  )
}

const circuitBand = () => (
  <svg viewBox="0 0 300 150" className="w-full">
    <rect x="40" y="20" width="250" height="100" className="fill-card2" />
    <line x1="40" x2="290" y1="20" y2="20" strokeWidth="1.5" className="stroke-up" />
    <line x1="40" x2="290" y1="120" y2="120" strokeWidth="1.5" className="stroke-down" />
    <line x1="40" x2="290" y1="70" y2="70" strokeDasharray="4 3" className="stroke-muted" />
    <text x="0" y="24" className="fill-up text-[10px]">₹105</text>
    <text x="0" y="74" className={M}>₹100</text>
    <text x="0" y="124" className="fill-down text-[10px]">₹95</text>
    <polyline points="40,70 70,64 95,76 115,88 130,104 140,120 290,120" fill="none" strokeWidth="2.5" className="stroke-fg" />
    <text x="150" y="112" className="fill-down text-[10px]">Locked at lower circuit: only sellers</text>
    <text x="150" y="14" className="fill-up text-[10px]">Upper circuit (+5%)</text>
    <text x="40" y="142" className={M}>Illustrative 5% band around yesterday’s close of ₹100</text>
  </svg>
)

const supplyDemand = () => (
  <svg viewBox="0 0 300 180" className="w-full">
    <line x1="30" y1="10" x2="30" y2="160" className="stroke-muted" />
    <line x1="30" y1="160" x2="290" y2="160" className="stroke-muted" />
    <text x="4" y="14" className={M}>Price</text>
    <text x="240" y="174" className={M}>Quantity</text>
    <line x1="50" y1="150" x2="250" y2="30" strokeWidth="2.5" className="stroke-warn" />
    <text x="252" y="30" className="fill-warn text-[11px]">Supply</text>
    <line x1="50" y1="30" x2="230" y2="150" strokeWidth="2.5" className="stroke-accent" />
    <text x="198" y="146" className="fill-accent text-[11px]">D1</text>
    <line x1="100" y1="30" x2="280" y2="150" strokeWidth="2.5" strokeDasharray="5 4" className="stroke-up" />
    <text x="262" y="142" className="fill-up text-[11px]">D2</text>
    <circle cx="146" cy="94" r="4" className="fill-fg" />
    <circle cx="174" cy="76" r="4" className="fill-up" />
    <line x1="30" x2="174" y1="76" y2="76" strokeDasharray="3 3" className="stroke-up" />
    <line x1="30" x2="146" y1="94" y2="94" strokeDasharray="3 3" className="stroke-muted" />
    <text x="34" y="72" className="fill-up text-[10px]">New, higher price</text>
    <text x="34" y="106" className={M}>Old price</text>
  </svg>
)

const purchasingPower = () => {
  const bars = [{ y: 'Today', v: 100 }, { y: '5 years', v: 74.7 }, { y: '10 years', v: 55.8 }, { y: '20 years', v: 31.2 }]
  return (
    <svg viewBox="0 0 300 150" className="w-full">
      {bars.map((b, i) => (
        <g key={b.y} transform={`translate(${i * 72 + 10} 0)`}>
          <rect x="0" y={120 - b.v} width="50" height={b.v} rx="4" className="fill-accent" opacity={1 - i * 0.18} />
          <text x="25" y={114 - b.v} textAnchor="middle" className={T}>₹{b.v}</text>
          <text x="25" y="138" textAnchor="middle" className={M}>{b.y}</text>
        </g>
      ))}
    </svg>
  )
}

const seesaw = () => (
  <svg viewBox="0 0 300 120" className="w-full">
    <polygon points="150,70 135,100 165,100" className="fill-muted" />
    <line x1="40" y1="90" x2="260" y2="50" strokeWidth="6" strokeLinecap="round" className="stroke-accent" />
    <text x="20" y="114" className="fill-down text-[12px] font-semibold">Bond price ↓</text>
    <text x="200" y="36" className="fill-up text-[12px] font-semibold">Yield ↑</text>
    <text x="150" y="116" textAnchor="middle" className={M}>When one goes up, the other goes down</text>
  </svg>
)

const emotionCycle = () => {
  const pts: [number, number, string][] = [
    [20, 112, 'Optimism'], [70, 50, 'Excitement'], [118, 18, 'Euphoria'], [165, 55, 'Anxiety'], [195, 95, 'Fear'], [222, 128, 'Panic'], [258, 120, 'Despair'], [290, 92, 'Hope'],
  ]
  return (
    <svg viewBox="0 0 320 150" className="w-full">
      <path d="M10,120 C60,110 85,18 120,18 C160,18 185,135 225,135 C255,135 275,110 310,85" fill="none" strokeWidth="2.5" className="stroke-accent" />
      {pts.map(([x, y, t]) => (
        <g key={t}>
          <circle cx={x} cy={y} r="3" className="fill-fg" />
          <text x={x} y={y < 70 ? y - 7 : y + 15} textAnchor="middle" className="fill-fg text-[9px]">{t}</text>
        </g>
      ))}
      <text x="128" y="12" className="fill-down text-[9px]">greatest risk</text>
      <text x="228" y="148" className="fill-up text-[9px]">greatest opportunity?</text>
    </svg>
  )
}

const primarySecondary = () => (
  <div className="grid gap-3">
    <div className="rounded-xl border border-line bg-card2 p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-accent">Primary market</div>
      <div className="text-sm">Company <span className="text-accent">→</span> new shares (IPO / FPO) <span className="text-accent">→</span> Investors</div>
      <div className="mt-1 text-xs text-muted">Money flows to the company (fresh issue).</div>
    </div>
    <div className="rounded-xl border border-line bg-card2 p-3">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-up">Secondary market</div>
      <div className="text-sm">Investor A <span className="text-up">⇄</span> Exchange (NSE/BSE) <span className="text-up">⇄</span> Investor B</div>
      <div className="mt-1 text-xs text-muted">Money moves between investors. The company receives nothing.</div>
    </div>
  </div>
)

export const visuals: Record<string, () => ReactElement> = {
  ownership,
  'mcap-tiers': mcapTiers,
  'index-weights': indexWeights,
  'bull-bear': () => twoCharts(['Bull: higher highs & lows', 'Bear: lower highs & lows'], true),
  'trend-ab': () => twoCharts(['Chart A', 'Chart B'], false),
  'order-types': orderTypes,
  'circuit-band': circuitBand,
  'supply-demand': supplyDemand,
  'purchasing-power': purchasingPower,
  seesaw,
  'emotion-cycle': emotionCycle,
  'primary-secondary': primarySecondary,
  'trade-flow': () => <Flow items={[
    ['You place an order', 'in your broker app'],
    ['Broker', 'checks your funds and sends the order'],
    ['Exchange (NSE / BSE)', 'matches buyer and seller'],
    ['Clearing corporation', 'guarantees and settles the trade'],
    ['Depository (NSDL / CDSL)', 'credits shares to your demat on T+1'],
  ]} />,
  ecosystem: () => <Flow items={[
    ['SEBI', 'regulates everyone below'],
    ['You, the investor', 'with PAN + KYC'],
    ['Broker / Depository Participant', 'places orders, opens your demat'],
    ['Exchange', 'NSE, BSE — order matching'],
    ['Clearing corporation', 'NSE Clearing, ICCL — settlement'],
    ['Depository', 'NSDL, CDSL — holds your shares'],
  ]} />,
  'rate-chain': () => <Flow items={[
    ['RBI raises repo rate', 'set by the Monetary Policy Committee'],
    ['Banks’ funding costs rise', 'they raise lending rates'],
    ['Loans and EMIs get costlier', 'home, auto and business loans'],
    ['Spending and investment slow', 'demand cools'],
    ['Inflation eases — and stock valuations face pressure', 'future profits are discounted at a higher rate'],
  ]} />,
  'oil-chain': () => <Flow items={[
    ['Crude oil price rises', 'India imports most of its oil'],
    ['Import bill grows', 'more dollars needed'],
    ['Rupee comes under pressure', 'imports cost even more'],
    ['Inflation rises', 'fuel, transport, raw materials'],
    ['RBI stays cautious on rates', 'rate-sensitive stocks feel it'],
  ]} />,
}

export function Visual({ id, caption }: { id: string; caption?: string }) {
  const V = visuals[id]
  if (!V) return null
  return (
    <figure className="my-3 rounded-2xl border border-line bg-card p-3">
      <V />
      {caption && <figcaption className="mt-2 text-xs text-muted">{caption}</figcaption>}
    </figure>
  )
}
