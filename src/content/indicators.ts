import { Q } from './dsl'
import type { Question } from './types'

export interface IndicatorInfo {
  id: string
  name: string
  short: string
  measures: string
  calculation: string
  formula: string
  values: string[]
  useful: string
  limitations: string
  mistakes: string
  example: [string, string][]
  questions: Question[]
}

export const indicators: IndicatorInfo[] = [
  {
    id: 'sma', name: 'Simple Moving Average (SMA)', short: 'SMA',
    measures: 'The average closing price over the last N candles — a smoothed line showing the underlying trend.',
    calculation: 'Add the last N closing prices and divide by N. Each new candle drops the oldest price and adds the newest.',
    formula: 'SMA(N) = (C₁ + C₂ + … + C_N) ÷ N',
    values: ['Price above a rising SMA: uptrend', 'Price below a falling SMA: downtrend', 'Common periods: 20 (short term), 50 (medium), 200 (long term)', 'A 50 crossing above the 200 is called a “golden cross”; below, a “death cross”'],
    useful: 'Identifying trend direction, and acting as dynamic support or resistance in trending markets.',
    limitations: 'Lags price — it reacts only after a move has happened. In sideways markets price whips back and forth across it, giving false signals.',
    mistakes: 'Treating every crossover as a buy or sell signal. Crossovers in a range-bound market lose money repeatedly.',
    example: [['Last 5 closes', '₹100, ₹102, ₹101, ₹104, ₹108'], ['5-period SMA', '515 ÷ 5 = ₹103'], ['Next close ₹110', 'Drop ₹100, add ₹110 → 525 ÷ 5 = ₹105']],
    questions: [
      Q('i-sma-1', 'Closes: ₹50, ₹52, ₹54, ₹56. What is the 4-period SMA?', ['₹53', '₹54', '₹52', '₹212'], '(50 + 52 + 54 + 56) ÷ 4 = 212 ÷ 4 = ₹53.'),
      Q('i-sma-2', 'Why do moving-average crossovers often fail in sideways markets?', ['Price keeps crossing the average back and forth, producing false signals', 'Moving averages stop updating', 'Volume is too high', 'They only work on Mondays'], 'Moving averages are trend tools; without a trend they whipsaw.'),
    ],
  },
  {
    id: 'ema', name: 'Exponential Moving Average (EMA)', short: 'EMA',
    measures: 'A moving average that gives more weight to recent prices, so it reacts faster than an SMA.',
    calculation: 'Start with an SMA, then each new EMA = (close × k) + (previous EMA × (1 − k)), where k = 2 ÷ (N + 1).',
    formula: 'EMA_today = Close × k + EMA_yesterday × (1 − k),  k = 2 ÷ (N + 1)',
    values: ['Same reading as an SMA (price above/below, slope)', 'Short EMAs (9, 20) hug price; long EMAs (50, 200) show the bigger trend', 'EMAs are the building blocks of MACD'],
    useful: 'Following trends while reacting faster to changes than an SMA. Popular with swing and intraday traders.',
    limitations: 'Faster also means noisier: more false signals than an SMA of the same length.',
    mistakes: 'Believing a faster average is “better”. It is a trade-off between speed and reliability.',
    example: [['N = 9 → k', '2 ÷ 10 = 0.2'], ['Yesterday’s EMA', '₹200'], ['Today’s close', '₹210'], ['Today’s EMA', '210 × 0.2 + 200 × 0.8 = ₹202']],
    questions: [
      Q('i-ema-1', 'For a 19-period EMA, what is the weighting factor k?', ['0.1', '0.19', '0.05', '0.2'], 'k = 2 ÷ (19 + 1) = 0.1.'),
      Q('i-ema-2', 'Compared with an SMA of the same length, an EMA:', ['Reacts faster to recent price changes', 'Reacts slower', 'Ignores recent prices', 'Is always more accurate'], 'Recent prices carry more weight in an EMA.'),
    ],
  },
  {
    id: 'rsi', name: 'Relative Strength Index (RSI)', short: 'RSI',
    measures: 'Momentum: how strong recent gains are compared with recent losses, on a 0–100 scale.',
    calculation: 'Average the gains and the losses over 14 candles (Wilder’s smoothing). RS = average gain ÷ average loss. RSI = 100 − 100 ÷ (1 + RS).',
    formula: 'RSI = 100 − 100 ÷ (1 + Avg gain ÷ Avg loss)',
    values: ['Above 70: “overbought” — strong recent buying', 'Below 30: “oversold” — strong recent selling', 'Above/below 50: momentum leaning bullish/bearish', 'Divergence: price makes a new high but RSI does not — momentum is weakening'],
    useful: 'Spotting stretched moves and weakening momentum, especially in range-bound markets.',
    limitations: 'In strong trends RSI can stay overbought or oversold for a long time while price keeps going.',
    mistakes: 'Selling just because RSI is above 70. Overbought is not the same as “about to fall”.',
    example: [['Average gain (14)', '₹1.50'], ['Average loss (14)', '₹0.50'], ['RS', '1.50 ÷ 0.50 = 3'], ['RSI', '100 − 100 ÷ 4 = 75 → overbought zone']],
    questions: [
      Q('i-rsi-1', 'Average gain ₹2, average loss ₹2. What is the RSI?', ['50', '100', '0', '70'], 'RS = 1, so RSI = 100 − 100 ÷ 2 = 50.'),
      Q('i-rsi-2', 'RSI has been above 70 for three weeks while price keeps rising. What does that show?', ['Overbought can persist in strong trends — it is not a sell signal by itself', 'The indicator is broken', 'A crash is certain tomorrow', 'Volume is low'], 'Strong trends keep momentum indicators stretched.'),
    ],
  },
  {
    id: 'macd', name: 'MACD', short: 'MACD',
    measures: 'Trend and momentum together: the gap between a fast and a slow EMA, and whether that gap is widening or narrowing.',
    calculation: 'MACD line = 12-EMA − 26-EMA. Signal line = 9-EMA of the MACD line. Histogram = MACD − signal.',
    formula: 'MACD = EMA12 − EMA26;  Signal = EMA9(MACD);  Histogram = MACD − Signal',
    values: ['MACD above zero: short-term average above long-term (bullish bias)', 'MACD crossing above the signal line: momentum turning up', 'Growing histogram bars: momentum strengthening', 'Divergence between MACD and price warns of weakening trends'],
    useful: 'Confirming trend direction and spotting momentum shifts in trending markets.',
    limitations: 'Built from moving averages, so it lags. Many signal-line crossovers in sideways markets are false.',
    mistakes: 'Trading every crossover, and ignoring where price is relative to support and resistance.',
    example: [['12-EMA', '₹512'], ['26-EMA', '₹505'], ['MACD', '₹7 (bullish bias)'], ['Signal line', '₹5'], ['Histogram', '₹2, positive and growing → momentum improving']],
    questions: [
      Q('i-macd-1', '12-EMA ₹300, 26-EMA ₹310. What is the MACD line and its bias?', ['−₹10, bearish bias', '+₹10, bullish bias', '₹610, bullish', '₹0, neutral'], 'MACD = 300 − 310 = −10: the fast average is below the slow one.'),
      Q('i-macd-2', 'What does the MACD histogram show?', ['The gap between the MACD line and its signal line', 'Trading volume', 'The RSI value', 'The price range'], 'Histogram = MACD − signal; its growth or shrinkage shows momentum.'),
    ],
  },
  {
    id: 'bollinger', name: 'Bollinger Bands', short: 'Bollinger',
    measures: 'Volatility around a moving average: bands widen when prices swing more and narrow when they calm down.',
    calculation: 'Middle band = 20-SMA. Upper/lower bands = middle ± 2 standard deviations of the last 20 closes.',
    formula: 'Upper = SMA20 + 2σ;  Lower = SMA20 − 2σ',
    values: ['Price near the upper band: relatively high versus recent prices', 'Price near the lower band: relatively low', 'A “squeeze” (very narrow bands) often comes before a big move — in either direction', 'In strong trends price can “walk the band” for many candles'],
    useful: 'Judging whether price is stretched, and spotting low-volatility squeezes.',
    limitations: 'Touching a band is not a signal by itself. A squeeze tells you a move may come, not which way.',
    mistakes: 'Automatically selling at the upper band or buying at the lower band during strong trends.',
    example: [['20-SMA', '₹500'], ['Standard deviation', '₹12'], ['Upper band', '500 + 24 = ₹524'], ['Lower band', '500 − 24 = ₹476'], ['Band width', '₹48 (9.6% of price)']],
    questions: [
      Q('i-bb-1', '20-SMA ₹200, standard deviation ₹5. Where is the upper band (2σ)?', ['₹210', '₹205', '₹220', '₹195'], '200 + 2 × 5 = ₹210.'),
      Q('i-bb-2', 'What does a Bollinger “squeeze” suggest?', ['Volatility is low and a larger move may follow — direction unknown', 'Price must rise', 'Price must fall', 'The stock is delisted'], 'Low volatility tends to be followed by higher volatility.'),
    ],
  },
  {
    id: 'vwap', name: 'VWAP (Volume Weighted Average Price)', short: 'VWAP',
    measures: 'The average price weighted by volume — the “fair” average price at which shares changed hands during the session.',
    calculation: 'For each candle multiply the typical price (H + L + C) ÷ 3 by its volume; add these up and divide by total volume. It resets at the start of every session.',
    formula: 'VWAP = Σ(Typical price × Volume) ÷ Σ Volume',
    values: ['Price above VWAP: buyers have paid up today — intraday bullish bias', 'Price below VWAP: intraday bearish bias', 'Institutions often benchmark their execution against VWAP'],
    useful: 'Mainly an intraday tool: judging whether today’s price is high or low relative to where most volume traded.',
    limitations: 'Resets every day, so it says little on daily charts (this app shows an anchored VWAP from the first candle there). Less meaningful late in the session after a lot of volume has accumulated.',
    mistakes: 'Using a daily-reset VWAP for multi-week analysis, or treating it as a magic support line.',
    example: [['Candle 1: typical ₹100, volume 1,000', '₹1,00,000'], ['Candle 2: typical ₹104, volume 3,000', '₹3,12,000'], ['VWAP', '4,12,000 ÷ 4,000 = ₹103'], ['Simple average of typical prices', '₹102 — VWAP leans towards where more volume traded']],
    questions: [
      Q('i-vwap-1', 'Candle A: typical ₹50, volume 100. Candle B: typical ₹60, volume 300. VWAP?', ['₹57.50', '₹55', '₹60', '₹52.50'], '(50 × 100 + 60 × 300) ÷ 400 = 23,000 ÷ 400 = ₹57.50.'),
      Q('i-vwap-2', 'VWAP is mainly designed for which timeframe?', ['Intraday — it resets each session', 'Monthly charts', 'Yearly charts', 'It has no timeframe'], 'Standard VWAP restarts every trading day.'),
    ],
  },
  {
    id: 'fibonacci', name: 'Fibonacci retracement', short: 'Fibonacci',
    measures: 'Possible pullback levels within a move, based on ratios: 23.6%, 38.2%, 50%, 61.8% and 78.6%.',
    calculation: 'Pick a swing low and swing high. For an up-move, level = high − ratio × (high − low). For a down-move, level = low + ratio × (high − low).',
    formula: 'Level = High − r × (High − Low),  r ∈ {0.236, 0.382, 0.5, 0.618, 0.786}',
    values: ['Shallow pullbacks (23.6%–38.2%) suggest a strong trend', '50%–61.8% is the most-watched pullback zone', 'Breaking below 78.6% suggests the original move may be over'],
    useful: 'Planning where a pullback in a trend might find support (or a bounce might meet resistance), alongside other evidence.',
    limitations: 'Results depend on which swing you choose. The ratios have no proven predictive power; they partly work because many traders watch them.',
    mistakes: 'Treating levels as exact prices. Use them as zones, and only with confirmation from candles or volume.',
    example: [['Swing low', '₹400'], ['Swing high', '₹500'], ['38.2% retracement', '500 − 0.382 × 100 = ₹461.80'], ['50% retracement', '₹450'], ['61.8% retracement', '₹438.20']],
    questions: [
      Q('i-fib-1', 'Swing low ₹200, swing high ₹300. Where is the 50% retracement?', ['₹250', '₹238.20', '₹261.80', '₹150'], '300 − 0.5 × 100 = ₹250.'),
      Q('i-fib-2', 'What is the main weakness of Fibonacci levels?', ['They depend on which swing points you choose and have no proven predictive power', 'They cannot be calculated', 'They only work on indices', 'They require paid data'], 'Different swing choices give different levels.'),
    ],
  },
  {
    id: 'atr', name: 'Average True Range (ATR)', short: 'ATR',
    measures: 'Volatility: the average size of a candle’s full movement, including gaps. It does not show direction.',
    calculation: 'True range = the largest of (high − low), |high − previous close| and |low − previous close|. ATR = Wilder-smoothed average of true range over 14 candles.',
    formula: 'TR = max(H − L, |H − Cₚ|, |L − Cₚ|);  ATR = Wilder average of TR over 14',
    values: ['Higher ATR: bigger swings — wider stop-losses needed', 'Lower ATR: calmer market', 'Expressed in rupees, so compare it with price (ATR ÷ price)'],
    useful: 'Setting stop-losses and position sizes that suit how much a stock normally moves (for example, a stop 2× ATR away).',
    limitations: 'Says nothing about direction. It changes with volatility regimes, so yesterday’s ATR may be too small in a sudden shock.',
    mistakes: 'Reading rising ATR as bullish. Volatility rises in crashes too.',
    example: [['Yesterday’s close', '₹100'], ['Today: high ₹106, low ₹101', 'H − L = ₹5'], ['|H − prev close|', '₹6 → true range = ₹6 (the gap counts)'], ['ATR ₹4 on a ₹100 stock', '4% typical daily movement'], ['Stop 2 × ATR below entry ₹100', '₹92']],
    questions: [
      Q('i-atr-1', 'Previous close ₹50. Today high ₹53, low ₹51. What is the true range?', ['₹3', '₹2', '₹1', '₹53'], 'max(53 − 51, |53 − 50|, |51 − 50|) = max(2, 3, 1) = ₹3.'),
      Q('i-atr-2', 'ATR jumps sharply. What do you know for sure?', ['Price swings have become larger — not which direction', 'Price will rise', 'Price will fall', 'Volume has dropped'], 'ATR measures volatility only.'),
    ],
  },
  {
    id: 'adx', name: 'ADX (Average Directional Index)', short: 'ADX',
    measures: 'Trend strength (not direction), on a 0–100 scale, with +DI and −DI lines showing which side is stronger.',
    calculation: 'Compare each candle’s up-move and down-move to get +DM and −DM, divide their smoothed sums by smoothed true range to get +DI and −DI, then ADX = smoothed average of |+DI − −DI| ÷ (+DI + −DI) × 100.',
    formula: 'DX = 100 × |+DI − −DI| ÷ (+DI + −DI);  ADX = Wilder average of DX (14)',
    values: ['ADX below 20: weak or no trend (range-bound)', 'ADX above 25: a trend is present', 'ADX rising: trend strengthening (up or down)', '+DI above −DI: buyers stronger; −DI above +DI: sellers stronger'],
    useful: 'Deciding whether to use trend-following tools (moving averages) or range tools (RSI, Bollinger).',
    limitations: 'Lags considerably, and a high ADX can coincide with the late stage of a trend.',
    mistakes: 'Reading a high ADX as bullish. A strong downtrend also has a high ADX.',
    example: [['+DI', '32'], ['−DI', '14'], ['DX', '100 × 18 ÷ 46 = 39.1'], ['ADX (smoothed)', '≈ 30 → a trend is present, buyers stronger']],
    questions: [
      Q('i-adx-1', 'ADX is 40 and −DI is well above +DI. What does this indicate?', ['A strong downtrend', 'A strong uptrend', 'No trend', 'Low volatility only'], 'High ADX = strong trend; −DI above +DI = sellers dominate.'),
      Q('i-adx-2', 'ADX is 15. Which approach suits this market better?', ['Range-trading tools — there is no strong trend', 'Trend-following breakouts', 'Ignoring all indicators', 'Buying every dip with leverage'], 'Below 20 suggests a weak or absent trend.'),
    ],
  },
  {
    id: 'stochastic', name: 'Stochastic oscillator', short: 'Stochastic',
    measures: 'Where the close sits within the recent high–low range (0–100) — a momentum gauge.',
    calculation: 'Raw %K = (close − lowest low of 14) ÷ (highest high of 14 − lowest low of 14) × 100. This app uses the slow version: %K is a 3-period average of raw %K, and %D is a 3-period average of %K.',
    formula: '%K = (C − LL₁₄) ÷ (HH₁₄ − LL₁₄) × 100;  %D = SMA3(%K)',
    values: ['Above 80: closing near the top of the recent range (overbought)', 'Below 20: near the bottom (oversold)', '%K crossing above %D in the oversold zone: momentum turning up'],
    useful: 'Timing entries in range-bound markets and spotting short-term turns.',
    limitations: 'Very sensitive: gives many signals, and stays pinned at extremes during strong trends.',
    mistakes: 'Using it alone in trending markets, or confusing “oversold” with “cheap”.',
    example: [['14-period high / low', '₹120 / ₹100'], ['Close', '₹117'], ['Raw %K', '(117 − 100) ÷ 20 × 100 = 85 → overbought zone']],
    questions: [
      Q('i-stoch-1', 'Highest high ₹80, lowest low ₹60, close ₹65. What is raw %K?', ['25', '75', '65', '20'], '(65 − 60) ÷ (80 − 60) × 100 = 25.'),
      Q('i-stoch-2', 'A stochastic reading of 90 means:', ['The close is near the top of the recent high–low range', 'The stock is 90% undervalued', 'Volume is 90% above average', 'There is a 90% chance of falling'], 'It is a position-in-range measure, not a probability.'),
    ],
  },
  {
    id: 'volume', name: 'Volume indicators (Volume, Volume average, OBV)', short: 'Volume',
    measures: 'Participation: how many shares traded. A volume moving average shows what is “normal”; On-Balance Volume (OBV) adds volume on up days and subtracts it on down days.',
    calculation: 'Volume bars come straight from the exchange data. Volume average = 20-period SMA of volume. OBV: if close > previous close, add the volume; if lower, subtract it.',
    formula: 'OBV_today = OBV_yesterday ± Volume_today (+ on up closes, − on down closes)',
    values: ['Breakouts on volume well above average are more trustworthy', 'Rallies on shrinking volume suggest fading interest', 'OBV rising while price is flat can hint at quiet accumulation', 'OBV falling while price rises (divergence) is a warning'],
    useful: 'Confirming whether a price move or pattern has genuine participation behind it.',
    limitations: 'Volume spikes can come from one-off events (block deals, index rebalancing). OBV’s absolute value is meaningless — only its direction matters.',
    mistakes: 'Ignoring volume completely, or reading every spike as bullish.',
    example: [['Average volume (20)', '10 lakh shares'], ['Breakout day volume', '28 lakh (2.8× average)'], ['OBV start', '0'], ['Day 1 up on 5 lakh, day 2 down on 2 lakh', 'OBV = +5 − 2 = +3 lakh']],
    questions: [
      Q('i-vol-1', 'A stock breaks above resistance on volume at 0.5× its average. How should you read it?', ['With caution — little participation backs the breakout', 'As a very strong confirmed breakout', 'Volume does not matter for breakouts', 'As a guaranteed reversal'], 'Low-volume breakouts fail more often.'),
      Q('i-vol-2', 'OBV starts at 0. Day 1 closes up on 4 lakh shares; day 2 closes down on 1 lakh. What is OBV?', ['+3 lakh', '+5 lakh', '−3 lakh', '0'], '+4 − 1 = +3 lakh.'),
    ],
  },
]

export const indicatorById: Record<string, IndicatorInfo> = Object.fromEntries(indicators.map((i) => [i.id, i]))
