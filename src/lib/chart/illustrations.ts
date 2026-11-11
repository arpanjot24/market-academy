// Textbook candle sequences used to draw each pattern. [open, high, low, close]
// `pre` shows the prior trend, `pat` the pattern, `post` a typical confirmation candle.
export type OHLC = [number, number, number, number]
export interface Illustration { trend: 'up' | 'down' | 'side'; pat: OHLC[]; post?: OHLC[] }

const DOWN: OHLC[] = [[110, 111, 106, 107], [107, 108, 103, 104], [104, 105, 100, 101]]
const UP: OHLC[] = [[90, 94, 89, 93], [93, 97, 92, 96], [96, 100, 95, 99]]
const SIDE: OHLC[] = [[100, 101.5, 99, 100.5], [100.5, 101.2, 99.4, 99.8], [99.8, 101, 99, 100.4]]
export const PRE = { up: UP, down: DOWN, side: SIDE }

export const illustrations: Record<string, Illustration> = {
  doji: { trend: 'up', pat: [[99, 102, 96, 99.1]] },
  hammer: { trend: 'down', pat: [[98.5, 100.5, 94, 100.2]], post: [[100.3, 104, 100, 103.5]] },
  'inverted-hammer': { trend: 'down', pat: [[100, 106, 99.8, 101.6]], post: [[101.8, 105, 101.5, 104.6]] },
  'shooting-star': { trend: 'up', pat: [[100.6, 105.5, 99.2, 99.4]], post: [[99.2, 99.5, 95, 95.5]] },
  'hanging-man': { trend: 'up', pat: [[99.3, 101, 94.5, 100.8]], post: [[100.5, 100.8, 96, 96.4]] },
  marubozu: { trend: 'side', pat: [[100.4, 107.1, 100.3, 107]] },
  'spinning-top': { trend: 'up', pat: [[99.5, 102.5, 96.5, 100.2]] },
  'bullish-engulfing': { trend: 'down', pat: [[101, 101.5, 98.5, 99], [98.6, 103, 98.2, 102.5]], post: [[102.6, 105, 102, 104.6]] },
  'bearish-engulfing': { trend: 'up', pat: [[99, 101.6, 98.6, 101], [101.4, 101.8, 97.3, 97.6]], post: [[97.5, 98, 94.5, 95]] },
  'morning-star': { trend: 'down', pat: [[101, 101.5, 95.5, 96], [95.4, 96.2, 94.4, 95.6], [96, 101, 95.8, 100.5]], post: [[100.6, 103, 100.2, 102.6]] },
  'evening-star': { trend: 'up', pat: [[99, 104.6, 98.5, 104], [104.4, 105.6, 103.8, 104.6], [104.2, 104.4, 99.2, 99.6]], post: [[99.5, 99.8, 96.6, 97]] },
  'three-white-soldiers': { trend: 'down', pat: [[100.5, 103.4, 100.2, 103], [102.4, 106.4, 102.1, 106], [105.4, 109.4, 105.1, 109]] },
  'three-black-crows': { trend: 'up', pat: [[99.5, 99.8, 96.4, 96.8], [97.4, 97.7, 93.6, 94], [94.6, 94.9, 90.6, 91]] },
  'bullish-harami': { trend: 'down', pat: [[101.5, 102, 95.5, 96], [97, 98.8, 96.6, 98.4]], post: [[98.6, 101.5, 98.4, 101.2]] },
  'bearish-harami': { trend: 'up', pat: [[98.5, 104.5, 98, 104], [103, 103.4, 101.2, 101.6]], post: [[101.4, 101.6, 98.5, 98.8]] },
  piercing: { trend: 'down', pat: [[101.5, 102, 96.5, 97], [96, 100.5, 95.6, 100]], post: [[100.2, 102.8, 100, 102.5]] },
  'dark-cloud': { trend: 'up', pat: [[98.5, 103.6, 98, 103], [104, 104.4, 99.8, 100.2]], post: [[100, 100.3, 97.4, 97.8]] },
  'tweezer-top': { trend: 'up', pat: [[99, 103, 98.6, 102.6], [102.5, 103.05, 99.6, 100]], post: [[99.8, 100, 97.5, 97.8]] },
  'tweezer-bottom': { trend: 'down', pat: [[101, 101.4, 97, 97.5], [97.6, 100.4, 96.95, 100]], post: [[100.2, 102.6, 99.9, 102.3]] },
}
