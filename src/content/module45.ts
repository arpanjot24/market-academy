// Module 4 (candlesticks) and Module 5 (indicators).
import { p, ul, ex, table, tip, warn, info, formula, Q, step, check } from './dsl'
import { patternById, patternIdQuestions } from './patterns'
import { indicatorById } from './indicators'
import type { Block, LessonDef, Level, Step } from './types'

const pattern = (id: string): Block => ({ t: 'pattern', id })
const widget = (id: string): Block => ({ t: 'widget', id })
const link = (text: string, href: string): Block => ({ t: 'link', text, href })
const idQ = (id: string) => patternIdQuestions.find((q) => q.id === `pid-${id}`)!

function patternStep(id: string): Step {
  const pt = patternById[id]
  return step('concept', pt.name,
    pattern(id),
    info(`**${pt.signal}.** ${pt.structure}`),
    p('**Formation conditions:**'), ul(...pt.conditions),
    p(`**Market psychology:** ${pt.psychology}`),
    p(`**Interpretation:** ${pt.interpretation}`),
    p(`**Volume:** ${pt.volume}`),
    tip(`**Confirmation:** ${pt.confirmation}`),
    warn(`**When it fails:** ${pt.failure}`),
    link(`Open the ${pt.name} page and find examples on practice charts`, `#/pattern/${id}`),
  )
}

function patternLesson(id: string, title: string, level: Level, summary: string, ids: string[], real: string): LessonDef {
  return {
    id, title, level, summary, minutes: ids.length * 3 + 2,
    steps: [...ids.map(patternStep), step('real', 'On a real chart', p(real), link('Practise in the Live Candle Interpreter', '#/interpreter')), check(idQ(ids[0]))],
    quiz: [...ids.map((x) => patternById[x].q), ...ids.slice(1).map(idQ)],
  }
}

export const module4Lessons: LessonDef[] = [
  {
    id: 'm4-l1', title: 'Anatomy of a candlestick', level: 'beginner', minutes: 7,
    summary: 'Open, high, low, close, body, wicks — and what each tells you.',
    steps: [
      step('concept', 'One candle, four prices',
        p('A candlestick summarises all the trading in one period (a day, an hour, 5 minutes…) using four prices:'),
        ul('**Open (O)**: the first traded price of the period.', '**High (H)**: the highest price reached.', '**Low (L)**: the lowest price reached.', '**Close (C)**: the last traded price of the period — usually the most important.'),
        p('The thick **body** spans the open and the close. The thin lines are **wicks** (or shadows): the **upper wick** runs from the body up to the high, the **lower wick** from the body down to the low.'),
      ),
      step('concept', 'Bullish and bearish candles',
        ul('**Bullish (green)**: close above open — price rose during the period. The open is at the bottom of the body.', '**Bearish (red)**: close below open — price fell. The open is at the top of the body.'),
        p('A long body shows one side was in control. A small body shows balance. Long wicks show prices that were tried and **rejected**.'),
        tip('Colour compares close with **open**, not with yesterday’s close. A green candle can still close lower than the previous candle if it opened even lower.'),
      ),
      step('visual', 'Build your own candle', p('Move the sliders to change open, high, low and close. Watch how the candle and its description change.'), widget('candle-builder')),
      step('example', 'Reading a candle',
        ex('A stock opens at ₹500, falls to ₹488 during the morning, rallies to ₹512 in the afternoon, and closes at ₹509. The candle is green (close ₹509 > open ₹500), with a ₹9 body, a ₹3 upper wick (₹512 − ₹509) and a ₹12 lower wick (₹500 − ₹488). Sellers tried early, buyers won the day.'),
      ),
      step('numbers', 'Measuring the parts',
        table('Candle from the example', [
          ['Range (high − low)', '₹512 − ₹488 = ₹24'],
          ['Body (|close − open|)', '₹509 − ₹500 = ₹9 → 37.5% of range'],
          ['Upper wick (high − top of body)', '₹512 − ₹509 = ₹3 → 12.5%'],
          ['Lower wick (bottom of body − low)', '₹500 − ₹488 = ₹12 → 50%'],
          ['Close position in range', '(509 − 488) ÷ 24 = 87.5% → closed near the high'],
        ]),
      ),
      step('real', 'Volume and timeframe',
        p('Most charts show **volume** as bars under the candles: how many shares traded in that period. A candle on high volume carries more weight than the same candle on thin volume.'),
        p('Every candle belongs to a **timeframe**. A daily candle contains 75 five-minute candles (9:15 am to 3:30 pm). The same day can look calm on a daily chart and wild on a 5-minute chart.'),
      ),
      check(Q('m4-l1-c1', 'Open ₹200, high ₹215, low ₹198, close ₹202. How long is the upper wick?', ['₹13', '₹2', '₹15', '₹17'], 'Upper wick = high − top of body = 215 − 202 = ₹13. A long upper wick: higher prices were rejected.')),
    ],
    quiz: [
      Q('m4-l1-q1', 'A candle is green. What does that tell you?', ['It closed above its open', 'It closed above the previous candle’s close', 'Volume was high', 'The next candle will be green'], 'Colour compares the close with the same candle’s open.'),
      Q('m4-l1-q2', 'What does a long lower wick show?', ['Sellers pushed price down but buyers pushed it back up', 'Buyers controlled the whole session', 'The market was closed', 'The close was the lowest price'], 'The wick marks prices that were reached and rejected.'),
      Q('m4-l1-q3', 'Open ₹100, close ₹96, high ₹101, low ₹95. What is the body size?', ['₹4', '₹6', '₹1', '₹5'], 'Body = |96 − 100| = ₹4; it is a red candle.'),
      Q('m4-l1-q4', 'Which price is generally considered the most important in a candle?', ['The close', 'The open', 'The high', 'The low'], 'The close is the final agreed value for the period, and most indicators use it.'),
    ],
  },
  {
    id: 'm4-l2', title: 'Timeframes and volume', level: 'beginner', minutes: 5,
    summary: 'How candles combine across timeframes, and why volume matters.',
    steps: [
      step('concept', 'Same market, different lenses',
        p('A **timeframe** is the period one candle covers: 1 minute, 5 minutes, 1 hour, 1 day, 1 week. Longer timeframes are combined from shorter ones:'),
        ul('Open = the open of the first small candle', 'High = the highest high of all of them', 'Low = the lowest low', 'Close = the close of the last small candle', 'Volume = the sum of their volumes'),
        tip('Patterns on higher timeframes (daily, weekly) involve more participants and are generally more meaningful than those on 1-minute charts.'),
      ),
      step('numbers', 'Combining five candles into one',
        table('Five 5-minute candles → one 25-minute candle', [
          ['Candle 1', 'O ₹100, H ₹101, L ₹99, C ₹100.5, Vol 8,000'],
          ['Candle 2', 'O ₹100.5, H ₹102, L ₹100, C ₹101.8, Vol 6,000'],
          ['Candle 3', 'O ₹101.8, H ₹102.5, L ₹100.8, C ₹101, Vol 5,000'],
          ['Candle 4', 'O ₹101, H ₹101.2, L ₹98.5, C ₹99, Vol 9,000'],
          ['Candle 5', 'O ₹99, H ₹100.2, L ₹98.8, C ₹100, Vol 7,000'],
          ['Combined', 'O ₹100, H ₹102.5, L ₹98.5, C ₹100, Vol 35,000'],
        ], 'Five busy candles become one doji-like candle: the bigger picture was indecision.'),
      ),
      step('concept', 'Volume: who showed up',
        p('**Volume** is the number of shares traded. Think of it as the number of votes behind a price move.'),
        ul('A breakout or reversal on volume well above average is more trustworthy.', 'A move on very low volume can reverse easily.', 'Volume spikes at important levels show where big participants acted.'),
      ),
      step('real', 'On Indian charts',
        p('NSE trading runs 9:15 am to 3:30 pm. On 5-minute charts, volume is usually highest near the open and the close, and quieter at midday — so compare volume with the same time of day, not just the overall average.'),
        link('Switch timeframes in the Technical Analysis Lab', '#/technical'),
      ),
      check(Q('m4-l2-c1', 'When combining candles into a longer timeframe, the combined HIGH is:', ['The highest high of all the smaller candles', 'The high of the last candle', 'The average of all highs', 'The close of the first candle'], 'The combined candle covers the full range traded in the period.')),
    ],
    quiz: [
      Q('m4-l2-q1', 'Combining candles: what is the close of the combined candle?', ['The close of the last smaller candle', 'The highest close', 'The average close', 'The first open'], 'The period ends with the last trade of its final sub-candle.'),
      Q('m4-l2-q2', 'A reversal pattern forms on volume at 3× average. Compared with the same pattern on 0.5× volume, it is:', ['More meaningful — many participants were involved', 'Less meaningful', 'Exactly as meaningful', 'Meaningless'], 'Participation adds conviction.'),
      Q('m4-l2-q3', 'Generally, which timeframe gives more meaningful patterns?', ['Higher timeframes, such as daily or weekly', '1-minute charts', 'Tick charts', 'They are all equal'], 'More participants and more data stand behind each higher-timeframe candle.'),
    ],
  },
  patternLesson('m4-l3', 'Single-candle patterns: doji, spinning top, marubozu', 'beginner', 'Indecision and conviction in one candle.', ['doji', 'spinning-top', 'marubozu'],
    'These three appear constantly. Dojis and spinning tops are common in quiet markets and mean little there. They matter most after a long move or at an important level. A marubozu breaking out of a range on high volume is a classic sign of conviction.'),
  patternLesson('m4-l4', 'Hammers and stars: hammer, hanging man, inverted hammer, shooting star', 'intermediate', 'Long wicks that reject prices — and why trend context names the pattern.', ['hammer', 'hanging-man', 'inverted-hammer', 'shooting-star'],
    'Look for these at the end of clear trends and near support or resistance. The identical shape means opposite things depending on the trend before it — which is why the interpreter always checks the trend first.'),
  patternLesson('m4-l5', 'Two-candle reversals: engulfing, harami, piercing, dark cloud', 'intermediate', 'How control changes hands over two sessions.', ['bullish-engulfing', 'bearish-engulfing', 'bullish-harami', 'bearish-harami', 'piercing', 'dark-cloud'],
    'Indian stocks often open near the previous close, so textbook “gaps” are rarer than in older Japanese rice markets where these patterns were named. This app’s detector therefore allows small tolerances, as many charting tools do.'),
  patternLesson('m4-l6', 'Stars, soldiers, crows and tweezers', 'intermediate', 'Three-candle reversals and twin highs/lows.', ['morning-star', 'evening-star', 'three-white-soldiers', 'three-black-crows', 'tweezer-top', 'tweezer-bottom'],
    'Three-candle patterns take longer to form, so by the time they complete, part of the move has already happened. Tweezers are best read as support and resistance markers.'),
  {
    id: 'm4-l7', title: 'Developing, confirmed and failed patterns', level: 'intermediate', minutes: 7,
    summary: 'The discipline that separates pattern-spotting from pattern-trading.',
    steps: [
      step('concept', 'A candle is not finished until it closes',
        p('While a candle is still forming, its high, low and close can change completely. A beautiful hammer at 2:00 pm can become an ordinary red candle by 3:30 pm.'),
        ul(
          '**Developing**: the last candle is still forming. A pattern “may be forming” — nothing more.',
          '**Completed, awaiting confirmation**: the pattern’s candles have closed, but the next candle has not yet confirmed it.',
          '**Confirmed**: the next candle closed in the pattern’s direction (e.g. green and higher after a bullish pattern).',
          '**Not confirmed**: the next candle did not follow through. The signal is weak.',
          '**Failed**: price closed beyond the pattern’s extreme (below a bullish pattern’s low, or above a bearish pattern’s high).',
        ),
        warn('Never treat a developing candle as a confirmed pattern. The Live Candle Interpreter in this app always labels incomplete candles as developing.'),
      ),
      step('concept', 'Context decides how much a pattern is worth',
        ul(
          '**Trend**: reversal patterns need something to reverse.',
          '**Location**: a bullish pattern at support, or a bearish one at resistance, is more meaningful than one in the middle of nowhere.',
          '**Volume**: patterns on high volume show real participation.',
          '**Timeframe**: daily and weekly patterns outweigh 5-minute ones.',
          '**Confluence**: several independent signals agreeing (pattern + support + volume + RSI) are better than one.',
        ),
      ),
      step('example', 'A failed hammer',
        ex('A stock falls from ₹600 to ₹520. A hammer forms with a low of ₹508 and a close of ₹524. The next day closes green at ₹531 — confirmed. Two days later, bad news: the stock closes at ₹502, below the hammer’s ₹508 low. The pattern has **failed**. A trader with a stop-loss just below ₹508 exits with a small, planned loss; one without a stop hopes and loses more.'),
      ),
      step('numbers', 'Planning around a pattern',
        table('Illustrative bullish engulfing trade plan', [
          ['Pattern low (invalidation level)', '₹970'],
          ['Entry after confirmation close', '₹1,010'],
          ['Stop-loss just below the pattern low', '₹965'],
          ['Risk per share', '₹1,010 − ₹965 = ₹45'],
          ['Nearest resistance (target)', '₹1,100'],
          ['Reward per share', '₹90'],
          ['Reward : risk', '90 ÷ 45 = 2 : 1'],
        ], 'The pattern tells you where you are wrong. That is its most practical use.'),
      ),
      step('real', 'Probabilities, not predictions',
        p('Candlestick patterns describe what happened and suggest what might happen next. Studies of candlestick patterns have given mixed results, and their reliability varies by market and period. Treat every pattern as one piece of evidence.'),
        link('Practise with replay: watch patterns develop, confirm and fail', '#/interpreter'),
      ),
      check(Q('m4-l7-c1', 'At 2 pm today’s candle looks like a perfect hammer. What is its correct status?', ['Developing — it may change before the close', 'Confirmed', 'Failed', 'Awaiting confirmation'], 'The candle is not complete until the session closes.')),
    ],
    quiz: [
      Q('m4-l7-q1', 'A bullish engulfing pattern completed yesterday. Today closed red and lower. What is its status?', ['Not confirmed', 'Confirmed', 'Developing', 'Guaranteed to work'], 'The confirmation candle did not follow through.'),
      Q('m4-l7-q2', 'A hammer’s low is ₹200. Two days later price closes at ₹195. The hammer has:', ['Failed', 'Been confirmed', 'Become a doji', 'Not formed yet'], 'A close below a bullish pattern’s low invalidates it.'),
      Q('m4-l7-q3', 'Which bullish pattern is most meaningful?', ['A hammer at a well-tested support level on high volume after a downtrend', 'A hammer in the middle of a sideways range on low volume', 'A hammer after a strong uptrend', 'Any hammer — they are all equal'], 'Trend, location and volume add weight.'),
      Q('m4-l7-q4', 'What is the most practical use of a pattern’s low or high?', ['It marks where your idea is proven wrong — a logical stop-loss level', 'It guarantees a target', 'It is always the day’s VWAP', 'It has no use'], 'Invalidation levels make risk measurable.'),
    ],
  },
]

// -------- Module 5: technical indicators --------
function indicatorStep(id: string): Step {
  const ind = indicatorById[id]
  return step('concept', ind.name,
    info(`**What it measures:** ${ind.measures}`),
    p(`**How it is calculated:** ${ind.calculation}`),
    formula(ind.formula),
    p('**What the values mean:**'), ul(...ind.values),
    table('Practical example (illustrative numbers)', ind.example),
    tip(`**When it is useful:** ${ind.useful}`),
    warn(`**Limitations:** ${ind.limitations}`),
    warn(`**Common mistake:** ${ind.mistakes}`),
  )
}

function indicatorLesson(id: string, title: string, level: Level, summary: string, ids: string[], real: string): LessonDef {
  const qs = ids.flatMap((x) => indicatorById[x].questions)
  return {
    id, title, level, summary, minutes: ids.length * 4 + 2,
    steps: [...ids.map(indicatorStep), step('real', 'Try it on a chart', p(real), link('Open the Technical Analysis Lab', `#/technical/${ids[0]}`)), check(qs[0])],
    quiz: qs.slice(1),
  }
}

export const module5Lessons: LessonDef[] = [
  indicatorLesson('m5-l1', 'Moving averages: SMA and EMA', 'beginner', 'The foundation of trend analysis.', ['sma', 'ema'],
    'Turn on SMA 20, SMA 50 and EMA 20 in the lab. On Practice Stock A, see how price stays above the averages during the uptrend. On the range-bound Practice Stock B, see how price keeps crossing them.'),
  indicatorLesson('m5-l2', 'Momentum oscillators: RSI and stochastic', 'intermediate', 'Measuring the speed of price moves.', ['rsi', 'stochastic'],
    'Turn on RSI on Practice Stock B (range-bound): extremes often line up with swing points. Then try Practice Stock A’s uptrend, where RSI stays high for long stretches.'),
  indicatorLesson('m5-l3', 'MACD', 'intermediate', 'Trend and momentum in one indicator.', ['macd'],
    'Turn on MACD and compare histogram growth with the price trend. Notice how crossovers lag the actual turns.'),
  indicatorLesson('m5-l4', 'Volatility: Bollinger Bands and ATR', 'intermediate', 'How much prices are swinging.', ['bollinger', 'atr'],
    'Compare Practice Stock C (volatile) with the Practice Index (calm): ATR and band width differ hugely. Look for squeezes before big moves.'),
  indicatorLesson('m5-l5', 'Trend strength and volume: ADX, volume, OBV and VWAP', 'advanced', 'Is there a trend, and who is participating?', ['adx', 'volume', 'vwap'],
    'Switch to the 5-minute timeframe to see VWAP reset each session. On daily charts, compare ADX on the trending and the range-bound practice stocks.'),
  indicatorLesson('m5-l6', 'Fibonacci retracement', 'advanced', 'Mapping possible pullback zones.', ['fibonacci'],
    'Turn on Fibonacci: the lab automatically uses the biggest swing in the last 120 candles. Watch whether pullbacks paused near the 38.2%–61.8% zone — and notice how often they did not.'),
]
