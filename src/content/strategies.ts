export interface StrategyInfo {
  id: string
  name: string
  horizon: string
  idea: string
  entry: string[]
  exit: string[]
  stop: string
  rr: string
  sizing: string
  suits: string
  fails: string
  backtest: string
  example: string
  practice?: string // practice instrument id that shows the behaviour
}

export const strategies: StrategyInfo[] = [
  {
    id: 'intraday', name: 'Intraday trading', horizon: 'Minutes to hours; all positions closed the same day',
    idea: 'Profit from small moves within one session, often using 5–15 minute charts, VWAP and the opening range.',
    entry: ['A clear intraday setup, e.g. a break of the first 15-minute range with volume above normal for that time of day', 'Price on the right side of VWAP for the direction traded'],
    exit: ['Pre-planned target, or a trailing stop', 'Mandatory exit before the close (brokers auto-square-off intraday positions)'],
    stop: 'Tight: below the breakout level or a recent 5-minute swing low — often 0.5–1% away.',
    rr: 'Aim for at least 1.5 : 1, because costs and slippage take a bigger share of small moves.',
    sizing: 'Size from the stop distance so a loss is ≤ 0.5–1% of capital. Intraday leverage magnifies losses — beginners should avoid it.',
    suits: 'Liquid large caps with tight spreads, on days with clear direction.',
    fails: 'Choppy, range-bound sessions; news spikes; when costs eat most of the edge. SEBI’s studies found most individual intraday and F&O traders lose money.',
    backtest: 'Needs intraday data and realistic costs (brokerage, STT, slippage). Many strategies that look good before costs are negative after them.',
    example: 'On the 5-minute practice chart, VWAP resets each session. Watch how price often crosses VWAP many times on quiet days — a trap for breakout traders.',
  },
  {
    id: 'swing', name: 'Swing trading', horizon: 'A few days to a few weeks',
    idea: 'Capture one “swing” within a larger trend using daily charts — buying pullbacks in uptrends or breakouts from short consolidations.',
    entry: ['Trend up on the daily chart (price above a rising 20/50-day average)', 'Pullback to support, then a bullish confirmation candle'],
    exit: ['Target near the previous swing high or the next resistance', 'Trail the stop below each new higher low'],
    stop: 'Below the pullback low or 1.5–2 × ATR below entry.',
    rr: '2 : 1 or better.',
    sizing: 'Risk 0.5–1% of capital per trade; hold 3–6 positions at once in different sectors.',
    suits: 'Trending markets with orderly pullbacks.',
    fails: 'Sharp trend reversals and overnight gaps on news (results, macro data).',
    backtest: 'Daily data is enough. Test across bull, bear and sideways years, and include gaps through stops.',
    example: 'Practice Stock A’s first 110 days: several pullbacks to the 20-day average followed by new highs.', practice: 'sim-a',
  },
  {
    id: 'positional', name: 'Positional trading', horizon: 'Weeks to months',
    idea: 'Ride a major trend or theme using weekly and daily charts, ignoring day-to-day noise.',
    entry: ['Weekly uptrend confirmed (higher highs and higher lows)', 'Entry on a breakout from a multi-week base or a pullback to the 50-day average'],
    exit: ['Weekly close below the 50-day average or the last major swing low', 'Trend exhaustion signals (climax volume, bearish weekly patterns)'],
    stop: 'Wide: below a major swing low — often 8–15% away. Position size must be smaller to compensate.',
    rr: '3 : 1 or more, because winners are allowed to run.',
    sizing: 'Risk ≤ 1% per position despite the wide stop — which means fewer shares.',
    suits: 'Strong sector trends supported by earnings growth.',
    fails: 'Trendless years; sudden regime changes (rate shocks, crashes).',
    backtest: 'Needs many years of data; there are few trades, so results are statistically fragile.',
    example: 'Practice Stock G: a long sideways base, then a sustained breakout trend.', practice: 'sim-g',
  },
  {
    id: 'long-term', name: 'Long-term investing', horizon: 'Years',
    idea: 'Own good businesses (or the whole index) bought at sensible prices, and let earnings growth compound.',
    entry: ['Business quality checks pass (growth, ROCE, low debt, cash conversion, governance)', 'Valuation reasonable versus peers, history and your intrinsic estimate; or regular SIP into an index fund'],
    exit: ['The investment thesis breaks (moat erodes, governance problems)', 'Extreme overvaluation, or a much better opportunity'],
    stop: 'Usually no price stop; risk is managed by diversification, position limits and re-checking the thesis every quarter.',
    rr: 'Not trade-based — the goal is long-run compounding above inflation.',
    sizing: 'Diversify: e.g. no single stock above 10–15% of the portfolio, no single sector above 25–30%.',
    suits: 'Anyone with a long horizon and patience — the approach with the best record for individuals.',
    fails: 'Paying absurd valuations; holding broken businesses out of hope; panic-selling in crashes.',
    backtest: 'Survivorship bias is the big trap: today’s index winners are not the ones you would have picked years ago.',
    example: 'In the 2008 global financial crisis, SENSEX fell about 60% from its January 2008 peak to March 2009, then recovered over the following years — long-term investors needed both patience and the stomach to hold.',
  },
  {
    id: 'momentum', name: 'Momentum trading', horizon: 'Weeks to months',
    idea: 'Buy what has been rising strongly (relative strength) and avoid what has been falling — trends tend to persist for a while.',
    entry: ['Stock among the strongest performers over the past 3–12 months', 'Price near its 52-week high, above rising averages'],
    exit: ['Momentum ranking falls, or price closes below the 50-day average', 'Regular rebalancing (e.g. monthly)'],
    stop: 'Trailing: below the 50-day average or 2–3 × ATR.',
    rr: 'Few big winners pay for many small losses — average win must clearly exceed average loss.',
    sizing: 'Equal-weight a basket of 10–20 names rather than betting on one.',
    suits: 'Bull markets with clear leadership.',
    fails: 'Sharp reversals (“momentum crashes”) when the market turns, e.g. at the end of bear markets when beaten-down stocks rebound fastest.',
    backtest: 'Rank on past data only (no look-ahead), include turnover costs, and check rebalancing frequency.',
    example: 'Practice Stock C rallies strongly, then crashes — momentum holders must exit quickly when the trend breaks.', practice: 'sim-c',
  },
  {
    id: 'breakout', name: 'Breakout strategy', horizon: 'Days to months',
    idea: 'Enter when price escapes a range or resistance level — the point where supply runs out.',
    entry: ['A clear, multi-touch resistance or range', 'Daily close above it on volume ≥ 1.5 × average'],
    exit: ['Measured move: range height added to the breakout level', 'Exit if price closes back inside the range (failed breakout)'],
    stop: 'Back inside the range — just below the breakout level or the range midpoint.',
    rr: 'Often 2–3 : 1 using the measured move.',
    sizing: 'Risk 0.5–1% per trade; many breakouts fail, so keep losses small.',
    suits: 'After long, tight bases; in rising markets.',
    fails: 'Low-volume breakouts, breakouts in weak markets, and “fake-outs” that reverse within days.',
    backtest: 'Count failed breakouts honestly; define “breakout” precisely before testing.',
    example: 'Practice Stock G around day 170: the range breaks and a trend begins.', practice: 'sim-g',
  },
  {
    id: 'pullback', name: 'Pullback strategy', horizon: 'Days to weeks',
    idea: 'In an established uptrend, buy temporary dips to support instead of chasing strength.',
    entry: ['Uptrend intact (higher highs and higher lows)', 'Price pulls back to a rising moving average, prior breakout level or 38.2–61.8% retracement', 'A bullish candle confirms buyers returning'],
    exit: ['Previous high, then trail', 'Exit if the pullback low breaks'],
    stop: 'Below the pullback low.',
    rr: '2 : 1 or better, because the entry is close to support.',
    sizing: 'Risk 0.5–1% per trade.',
    suits: 'Steady trends with orderly dips.',
    fails: 'When the “pullback” is actually the start of a reversal — which is why the stop below the low matters.',
    backtest: 'Define the trend filter and pullback depth precisely; test across bull and bear phases.',
    example: 'Practice Stock A’s pullbacks to its 20-day average in the first half of the data.', practice: 'sim-a',
  },
  {
    id: 'trend-following', name: 'Trend following', horizon: 'Weeks to months',
    idea: 'Follow mechanical rules (e.g. moving-average or channel breakouts) to stay in big trends and cut losers early. You never predict — you react.',
    entry: ['Fast average crosses above slow average (e.g. 20 over 50 days), or a 50-day-high breakout'],
    exit: ['Opposite signal, or a trailing stop (e.g. 3 × ATR)'],
    stop: 'Wide trailing stops so normal noise does not shake you out.',
    rr: 'Typically 35–45% win rate, with average winners several times average losers.',
    sizing: 'Volatility-based: smaller positions in more volatile stocks (risk a fixed % using ATR).',
    suits: 'Long, persistent trends.',
    fails: 'Sideways markets cause repeated small losses (“whipsaws”) that test discipline.',
    backtest: 'Needs long histories and many instruments; the edge comes from a few large trends.',
    example: 'Compare moving-average signals on Practice Stock A (trending) with Practice Stock B (range-bound) in the Technical Lab.', practice: 'sim-a',
  },
  {
    id: 'mean-reversion', name: 'Mean reversion', horizon: 'Days',
    idea: 'Prices that stretch far from their average tend to snap back — buy oversold extremes, sell overbought ones.',
    entry: ['Range-bound market (ADX below about 20)', 'Price at the lower Bollinger Band or RSI below 30, near known support'],
    exit: ['Return to the middle band or the moving average'],
    stop: 'Below the range low or the recent extreme.',
    rr: 'Often around 1–1.5 : 1, with a higher win rate.',
    sizing: 'Small; losses can be large when a range breaks into a trend.',
    suits: 'Sideways, range-bound markets and stable large caps.',
    fails: 'Strong trends — “oversold” keeps getting more oversold. Never average down without a stop.',
    backtest: 'Highly sensitive to costs and to the trend filter.',
    example: 'Practice Stock B swings between support and resistance — the classic mean-reversion environment.', practice: 'sim-b',
  },
  {
    id: 'support-resistance', name: 'Support and resistance trading', horizon: 'Days to weeks',
    idea: 'Trade the reactions at price levels where buyers or sellers have repeatedly appeared.',
    entry: ['Buy near tested support after a bullish confirmation candle', 'Or buy after resistance breaks and is retested as new support'],
    exit: ['Near the next resistance level'],
    stop: 'Just beyond the level — a close through support means it has failed.',
    rr: 'Measured from the entry to the next level versus entry to stop.',
    sizing: 'Risk 0.5–1% per trade.',
    suits: 'Markets with clear, respected levels.',
    fails: 'Levels that everyone watches can be run through by stop-hunting moves; levels weaken each time they are tested.',
    backtest: 'Hard to automate fairly — define levels mechanically (e.g. swing points) before testing.',
    example: 'The Candle Interpreter marks nearby support and resistance as you replay any practice chart.', practice: 'sim-b',
  },
  {
    id: 'volume', name: 'Volume-based trading', horizon: 'Days to weeks',
    idea: 'Use volume to judge conviction: trade moves that big participants support, avoid those they ignore.',
    entry: ['Breakouts or reversal candles on volume ≥ 1.5–2 × average', 'OBV making new highs with or before price'],
    exit: ['Climax volume after a long run (exhaustion)', 'Price rising on shrinking volume'],
    stop: 'Below the high-volume candle’s low.',
    rr: '2 : 1 or better.',
    sizing: 'Risk 0.5–1% per trade.',
    suits: 'Liquid stocks where volume reflects real participation.',
    fails: 'One-off volume from block deals, index rebalancing or results days can mislead.',
    backtest: 'Normalise volume (vs its own average) and account for event days.',
    example: 'Turn on Volume and OBV in the Technical Lab and compare breakouts with and without volume support.',
  },
]

export const strategyById: Record<string, StrategyInfo> = Object.fromEntries(strategies.map((s) => [s.id, s]))
export const SETUPS = [
  ['breakout', 'Breakout'], ['pullback', 'Pullback in an uptrend'], ['trend-following', 'Trend following'], ['momentum', 'Momentum'],
  ['mean-reversion', 'Mean reversion'], ['support-resistance', 'Support bounce'], ['volume', 'Volume signal'], ['long-term', 'Long-term investment'], ['none', 'No clear setup'],
] as const
