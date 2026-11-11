export interface Candle {
  /** Unix time in seconds (UTC). Intraday times are stored as IST wall-clock values. */
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export type Series = (number | null)[]
