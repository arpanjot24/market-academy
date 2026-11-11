// Indian equity transaction-cost estimates. Approximate published rates as of 2025–26;
// brokers and exchanges revise them, so every screen that uses this says “estimate”.

export type Product = 'delivery' | 'intraday'
export type BrokeragePlan = 'zero' | 'flat20' | 'full'

export const PLAN_LABELS: Record<BrokeragePlan, string> = {
  zero: 'Discount broker: ₹0 delivery, intraday min(₹20, 0.03%)',
  flat20: 'Flat ₹20 per executed order',
  full: 'Full-service: 0.3% delivery, 0.05% intraday',
}

export const RATES = {
  sttDelivery: 0.001,        // 0.1% on buy and sell
  sttIntradaySell: 0.00025,  // 0.025% on sell only
  exchange: 0.0000297,       // NSE equity transaction charge 0.00297% (BSE is similar)
  sebi: 0.000001,            // ₹10 per crore
  stampDelivery: 0.00015,    // 0.015% on buy only
  stampIntraday: 0.00003,    // 0.003% on buy only
  gst: 0.18,                 // on brokerage + exchange + SEBI fees
  dpPerSell: 15.93,          // typical depository charge per scrip on delivery sell (₹13.5 + GST)
}

export const CHARGES_NOTE = 'Estimates based on published rates as of 2025–26 (STT, exchange, SEBI, stamp duty, GST, DP). Your broker’s contract note is the final word.'

export interface Costs { brokerage: number; stt: number; exchange: number; sebi: number; stamp: number; gst: number; dp: number; total: number }

const r2 = (x: number) => Math.round(x * 100) / 100

export function charges(side: 'buy' | 'sell', value: number, plan: BrokeragePlan = 'zero', product: Product = 'delivery'): Costs {
  if (value <= 0) return { brokerage: 0, stt: 0, exchange: 0, sebi: 0, stamp: 0, gst: 0, dp: 0, total: 0 }
  let brokerage = 0
  if (plan === 'flat20') brokerage = Math.min(20, value * 0.025)
  else if (plan === 'full') brokerage = value * (product === 'delivery' ? 0.003 : 0.0005)
  else brokerage = product === 'delivery' ? 0 : Math.min(20, value * 0.0003)
  const stt = product === 'delivery' ? value * RATES.sttDelivery : side === 'sell' ? value * RATES.sttIntradaySell : 0
  const exchange = value * RATES.exchange
  const sebi = value * RATES.sebi
  const stamp = side === 'buy' ? value * (product === 'delivery' ? RATES.stampDelivery : RATES.stampIntraday) : 0
  const gst = (brokerage + exchange + sebi) * RATES.gst
  const dp = side === 'sell' && product === 'delivery' ? RATES.dpPerSell : 0
  const c = { brokerage: r2(brokerage), stt: r2(stt), exchange: r2(exchange), sebi: r2(sebi), stamp: r2(stamp), gst: r2(gst), dp: r2(dp), total: 0 }
  c.total = r2(c.brokerage + c.stt + c.exchange + c.sebi + c.stamp + c.gst + c.dp)
  return c
}

/** Capital-gains tax estimate for listed equity under rules effective 23 July 2024 (Budget 2024). Excludes surcharge. */
export function taxEstimate(shortTermNet: number, longTermNet: number) {
  const stcg = Math.max(0, shortTermNet) * 0.2
  const ltcg = Math.max(0, longTermNet - 125000) * 0.125
  const cess = (stcg + ltcg) * 0.04
  return { stcg: r2(stcg), ltcg: r2(ltcg), cess: r2(cess), total: r2(stcg + ltcg + cess) }
}
export const TAX_NOTE = 'Listed equity, STT paid, rules effective 23 July 2024: short-term (held ≤ 12 months) 20%; long-term (> 12 months) 12.5% on gains above ₹1.25 lakh a year; plus 4% cess; surcharge ignored. Intraday profits are business income taxed at your slab rate. Check later Budgets and consult a tax professional.'
