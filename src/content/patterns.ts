import { Q } from './dsl'
import type { Question } from './types'

export interface PatternInfo {
  id: string
  name: string
  candles: 1 | 2 | 3
  bias: 'bullish' | 'bearish' | 'neutral' | 'either'
  signal: string
  structure: string
  conditions: string[]
  psychology: string
  interpretation: string
  volume: string
  confirmation: string
  failure: string
  q: Question
}

const STD_BULL_CONFIRM = 'Wait for the next candle to close green and above this pattern’s close. Stronger if it happens at support or with rising volume.'
const STD_BEAR_CONFIRM = 'Wait for the next candle to close red and below this pattern’s close. Stronger if it happens at resistance or with rising volume.'

export const patterns: PatternInfo[] = [
  {
    id: 'doji', name: 'Doji', candles: 1, bias: 'neutral', signal: 'Indecision',
    structure: 'Open and close are almost equal, so the body is a thin line. Wicks can be any length. Variants: dragonfly (long lower wick), gravestone (long upper wick), long-legged (long wicks on both sides).',
    conditions: ['Body is 10% of the range or less', 'Most meaningful after a strong move, or at support/resistance'],
    psychology: 'Buyers and sellers fought all session and ended where they started. Neither side won. After a long rally or fall, that sudden balance can mean the dominant side is tiring.',
    interpretation: 'Neutral on its own. After an uptrend it warns the rally may be losing strength; after a downtrend, that selling may be exhausting. It signals a pause, not a direction.',
    volume: 'A doji on high volume shows a real battle and deserves more attention. On low volume it often just means a quiet session.',
    confirmation: 'Let the next candle decide: a close above the doji’s high leans bullish; a close below its low leans bearish.',
    failure: 'In strong trends, dojis frequently appear and the trend simply continues. Treating every doji as a reversal is a common beginner mistake.',
    q: Q('p-doji', 'What does a doji mainly represent?', ['Indecision between buyers and sellers', 'A guaranteed reversal', 'Strong buying pressure', 'A gap in prices'], 'Open ≈ close: neither side won the session. Direction comes only from later candles.'),
  },
  {
    id: 'hammer', name: 'Hammer', candles: 1, bias: 'bullish', signal: 'Bullish reversal (after a downtrend)',
    structure: 'Small body near the top of the range, a long lower wick (at least twice the body) and little or no upper wick. The body can be green or red; green is slightly stronger.',
    conditions: ['Appears after a downtrend', 'Lower wick ≥ 2× the body and ≥ 60% of the range', 'Little or no upper wick'],
    psychology: 'Sellers pushed price sharply lower during the session, but buyers stepped in and drove it back up near the open. The sellers’ attack was rejected.',
    interpretation: 'A possible bottom: selling pressure was absorbed. It suggests the downtrend may be ending — only a suggestion until confirmed.',
    volume: 'Higher-than-average volume strengthens it: many buyers were willing to absorb the selling.',
    confirmation: STD_BULL_CONFIRM,
    failure: 'If a later candle closes below the hammer’s low, the buyers’ defence has broken — the downtrend is likely continuing.',
    q: Q('p-hammer', 'Where must a hammer appear to be meaningful?', ['After a downtrend', 'After an uptrend', 'Only on Mondays', 'Anywhere — trend does not matter'], 'The same shape after an uptrend is called a hanging man and has a bearish meaning.'),
  },
  {
    id: 'inverted-hammer', name: 'Inverted hammer', candles: 1, bias: 'bullish', signal: 'Bullish reversal (after a downtrend)',
    structure: 'Small body near the bottom of the range, a long upper wick (at least twice the body) and little or no lower wick.',
    conditions: ['Appears after a downtrend', 'Upper wick ≥ 2× the body and ≥ 60% of the range', 'Little or no lower wick'],
    psychology: 'After a decline, buyers tried to push price higher. They could not hold the gains, but the attempt shows buying interest is returning.',
    interpretation: 'A weaker bullish signal than the hammer, because buyers failed to hold the high. It needs confirmation more than most patterns.',
    volume: 'Rising volume on the inverted hammer and especially on the confirmation candle adds weight.',
    confirmation: STD_BULL_CONFIRM,
    failure: 'A close below the inverted hammer’s low shows sellers remain in charge.',
    q: Q('p-inverted-hammer', 'An inverted hammer has:', ['A long upper wick and a small body near the low', 'A long lower wick and a small body near the high', 'No wicks at all', 'Equal open and close with no wicks'], 'Its long upper wick shows a failed but notable attempt by buyers.'),
  },
  {
    id: 'shooting-star', name: 'Shooting star', candles: 1, bias: 'bearish', signal: 'Bearish reversal (after an uptrend)',
    structure: 'Same shape as an inverted hammer — small body near the low, long upper wick — but it appears after an uptrend.',
    conditions: ['Appears after an uptrend', 'Upper wick ≥ 2× the body and ≥ 60% of the range', 'Little or no lower wick'],
    psychology: 'Buyers pushed price to a new high, then sellers took over and dragged it back near the open. The rally was rejected at higher prices.',
    interpretation: 'A possible top. It suggests buyers are exhausted at these levels.',
    volume: 'High volume shows heavy selling into the rally — a stronger warning.',
    confirmation: STD_BEAR_CONFIRM,
    failure: 'A close above the shooting star’s high shows buyers absorbed the selling, and the uptrend likely continues.',
    q: Q('p-shooting-star', 'A shooting star after a strong rally suggests:', ['Buyers were rejected at higher prices — a possible top', 'The rally is guaranteed to continue', 'Volume is irrelevant', 'A stock split is coming'], 'The long upper wick shows prices were pushed back down from the high.'),
  },
  {
    id: 'hanging-man', name: 'Hanging man', candles: 1, bias: 'bearish', signal: 'Bearish warning (after an uptrend)',
    structure: 'Same shape as a hammer — small body near the top, long lower wick — but it appears after an uptrend.',
    conditions: ['Appears after an uptrend', 'Lower wick ≥ 2× the body and ≥ 60% of the range', 'Little or no upper wick'],
    psychology: 'Even though price recovered by the close, the session showed that sellers could push price sharply lower — a sign that support for the rally is weakening.',
    interpretation: 'A warning, weaker than a shooting star. It needs bearish confirmation before it means much.',
    volume: 'High volume on the hanging man suggests large holders may have been selling during the dip.',
    confirmation: STD_BEAR_CONFIRM,
    failure: 'If the next candle closes above the hanging man’s high, the warning has failed and the uptrend is intact.',
    q: Q('p-hanging-man', 'What distinguishes a hanging man from a hammer?', ['The trend before it — a hanging man comes after an uptrend', 'Its colour', 'It has no lower wick', 'It always has huge volume'], 'Shape alone does not name the pattern; context does.'),
  },
  {
    id: 'marubozu', name: 'Marubozu', candles: 1, bias: 'either', signal: 'Strength / continuation',
    structure: 'A long body with almost no wicks. A green marubozu opens at its low and closes at its high; a red one opens at its high and closes at its low.',
    conditions: ['Body ≥ 90% of the range', 'Body larger than recent average candles'],
    psychology: 'One side controlled the entire session from open to close, without any meaningful pushback.',
    interpretation: 'Green: strong buying, often continuation of an up-move or the start of one. Red: strong selling. It shows conviction, not a reversal.',
    volume: 'Should come with high volume. A marubozu on thin volume is less convincing.',
    confirmation: 'Follow-through: the next candle should not quickly retrace more than half of the marubozu’s body.',
    failure: 'If the next candles reverse most of the marubozu, the strong move was a trap (for example, a false breakout).',
    q: Q('p-marubozu', 'A green marubozu shows:', ['Buyers controlled the session from open to close', 'Indecision', 'A reversal is certain', 'Sellers won the session'], 'No wicks means price never traded meaningfully below the open or above the close.'),
  },
  {
    id: 'spinning-top', name: 'Spinning top', candles: 1, bias: 'neutral', signal: 'Indecision',
    structure: 'A small body in the middle of the range, with upper and lower wicks both longer than the body.',
    conditions: ['Body ≤ 35% of the range (but larger than a doji)', 'Both wicks longer than the body'],
    psychology: 'Both buyers and sellers had moments of control, but neither could finish the session with a decisive move.',
    interpretation: 'Neutral. After a strong move it suggests momentum is fading. Very common, so it is weak on its own.',
    volume: 'More meaningful on high volume, at the end of a long trend, or at support/resistance.',
    confirmation: 'A close beyond the spinning top’s high or low shows which side has taken control.',
    failure: 'Often the trend just continues — a spinning top is a pause, not a signal by itself.',
    q: Q('p-spinning-top', 'How is a spinning top different from a doji?', ['It has a small but visible body; a doji’s body is almost zero', 'It has no wicks', 'It is always bullish', 'It needs three candles'], 'Both show indecision; the doji is the more extreme version.'),
  },
  {
    id: 'bullish-engulfing', name: 'Bullish engulfing', candles: 2, bias: 'bullish', signal: 'Bullish reversal (after a downtrend)',
    structure: 'A red candle followed by a larger green candle whose body completely covers (engulfs) the red body.',
    conditions: ['Appears after a downtrend', 'Candle 1 red, candle 2 green', 'Candle 2 opens at or below candle 1’s close and closes at or above candle 1’s open'],
    psychology: 'Sellers controlled day one. On day two, buyers overwhelmed them and erased the entire previous loss — a decisive shift in control.',
    interpretation: 'One of the stronger bullish reversal patterns, especially at support.',
    volume: 'Volume on the green candle should be higher than on the red one.',
    confirmation: STD_BULL_CONFIRM,
    failure: 'A close below the pattern’s low cancels the signal.',
    q: Q('p-bullish-engulfing', 'In a bullish engulfing pattern, the second candle’s body:', ['Completely covers the first (red) candle’s body', 'Is smaller than the first', 'Is a doji', 'Is red'], 'The green body “engulfs” the prior red body.'),
  },
  {
    id: 'bearish-engulfing', name: 'Bearish engulfing', candles: 2, bias: 'bearish', signal: 'Bearish reversal (after an uptrend)',
    structure: 'A green candle followed by a larger red candle whose body completely engulfs the green body.',
    conditions: ['Appears after an uptrend', 'Candle 1 green, candle 2 red', 'Candle 2 opens at or above candle 1’s close and closes at or below candle 1’s open'],
    psychology: 'Buyers controlled day one, then sellers overwhelmed them and wiped out the gain — buyers who entered recently are now losing.',
    interpretation: 'A strong bearish reversal signal, especially at resistance or after an extended rally.',
    volume: 'Higher volume on the red candle strengthens it.',
    confirmation: STD_BEAR_CONFIRM,
    failure: 'A close above the pattern’s high cancels it.',
    q: Q('p-bearish-engulfing', 'A bearish engulfing pattern is most significant:', ['After an uptrend, near resistance, on rising volume', 'After a long downtrend', 'On very low volume', 'When the second candle is small'], 'Context and volume decide how much weight a pattern deserves.'),
  },
  {
    id: 'morning-star', name: 'Morning star', candles: 3, bias: 'bullish', signal: 'Bullish reversal (after a downtrend)',
    structure: 'A long red candle, then a small-bodied candle (the “star”) at or below its close, then a green candle that closes above the middle of the first candle’s body.',
    conditions: ['Appears after a downtrend', 'Candle 1: long red body', 'Candle 2: small body, at or below candle 1’s close', 'Candle 3: green, closing above the midpoint of candle 1'],
    psychology: 'Selling is strong (candle 1), then stalls into indecision (candle 2), then buyers take over (candle 3). It is the story of a downtrend running out of fuel.',
    interpretation: 'A reliable-looking bullish reversal structure — still a probability, not a promise.',
    volume: 'Ideally volume rises on the third candle.',
    confirmation: 'The third candle is itself partial confirmation; further strength on the next candle adds more.',
    failure: 'A close below the star’s low (the pattern’s lowest point) means the reversal failed.',
    q: Q('p-morning-star', 'What is the middle candle of a morning star?', ['A small-bodied “star” showing indecision', 'A long green candle', 'A long red candle', 'A marubozu'], 'The star marks the moment selling stalls.'),
  },
  {
    id: 'evening-star', name: 'Evening star', candles: 3, bias: 'bearish', signal: 'Bearish reversal (after an uptrend)',
    structure: 'A long green candle, a small-bodied star at or above its close, then a red candle that closes below the middle of the first candle’s body.',
    conditions: ['Appears after an uptrend', 'Candle 1: long green body', 'Candle 2: small body, at or above candle 1’s close', 'Candle 3: red, closing below the midpoint of candle 1'],
    psychology: 'Buying is strong, then stalls, then sellers take over. The rally runs out of buyers.',
    interpretation: 'A bearish reversal structure, the mirror image of the morning star.',
    volume: 'Rising volume on the third (red) candle strengthens it.',
    confirmation: 'Further weakness on the following candle adds confirmation.',
    failure: 'A close above the star’s high means the reversal failed.',
    q: Q('p-evening-star', 'An evening star’s third candle should close:', ['Below the midpoint of the first candle’s body', 'Above the first candle’s high', 'Exactly at the first candle’s open', 'Anywhere — position does not matter'], 'Closing deep into candle 1 shows sellers erased much of the rally.'),
  },
  {
    id: 'three-white-soldiers', name: 'Three white soldiers', candles: 3, bias: 'bullish', signal: 'Bullish reversal / strong advance',
    structure: 'Three consecutive long green candles, each opening within the previous body and closing at a new high, with small upper wicks.',
    conditions: ['After a downtrend or a sideways phase', 'Three long green bodies', 'Each opens inside the prior body and closes higher', 'Small upper wicks (closes near the highs)'],
    psychology: 'Buyers win three sessions in a row and close near the highs each time — steady, determined accumulation.',
    interpretation: 'Strong bullish momentum. After a very long rally, though, it can mean the market is overextended.',
    volume: 'Steady or rising volume across the three candles is ideal.',
    confirmation: 'Follow-through without a sharp reversal. Watch for long upper wicks appearing — a sign of tiring buyers.',
    failure: 'A sharp reversal below the first soldier’s open would negate it.',
    q: Q('p-three-white-soldiers', 'Three white soldiers consist of:', ['Three long green candles, each closing higher', 'Three dojis', 'One green and two red candles', 'Three candles with long upper wicks'], 'Consecutive strong closes show persistent buying.'),
  },
  {
    id: 'three-black-crows', name: 'Three black crows', candles: 3, bias: 'bearish', signal: 'Bearish reversal / strong decline',
    structure: 'Three consecutive long red candles, each opening within the previous body and closing at a new low, with small lower wicks.',
    conditions: ['After an uptrend or a sideways phase', 'Three long red bodies', 'Each opens inside the prior body and closes lower', 'Small lower wicks'],
    psychology: 'Sellers win three sessions in a row, closing near the lows each time — persistent distribution.',
    interpretation: 'Strong bearish momentum. After a long decline it may instead signal oversold conditions.',
    volume: 'Rising volume confirms heavy selling.',
    confirmation: 'Continued weakness; no quick recovery above the crows’ bodies.',
    failure: 'A strong reversal above the first crow’s open would negate it.',
    q: Q('p-three-black-crows', 'Three black crows after a long rally suggest:', ['Sellers have taken firm control', 'A guaranteed crash', 'Buyers are accumulating', 'Indecision'], 'Three strong red closes in a row show persistent selling.'),
  },
  {
    id: 'bullish-harami', name: 'Bullish harami', candles: 2, bias: 'bullish', signal: 'Bullish reversal warning (after a downtrend)',
    structure: 'A long red candle followed by a small candle whose body sits entirely inside the red body. “Harami” is Japanese for “pregnant”.',
    conditions: ['Appears after a downtrend', 'Candle 1: long red body', 'Candle 2: small body (≤ half) inside candle 1’s body'],
    psychology: 'Strong selling is followed by a quiet, contained session. The sellers’ momentum has stalled.',
    interpretation: 'An early, weaker warning that the downtrend may be pausing. Weaker than an engulfing pattern.',
    volume: 'Lower volume on the small candle shows selling has dried up.',
    confirmation: STD_BULL_CONFIRM,
    failure: 'A close below the first candle’s low cancels the signal.',
    q: Q('p-bullish-harami', 'In a bullish harami, the second candle’s body:', ['Sits inside the first candle’s body', 'Engulfs the first candle', 'Has no relation to the first', 'Is always a marubozu'], 'Harami = small inside body, the opposite of engulfing.'),
  },
  {
    id: 'bearish-harami', name: 'Bearish harami', candles: 2, bias: 'bearish', signal: 'Bearish reversal warning (after an uptrend)',
    structure: 'A long green candle followed by a small candle whose body sits entirely inside the green body.',
    conditions: ['Appears after an uptrend', 'Candle 1: long green body', 'Candle 2: small body (≤ half) inside candle 1’s body'],
    psychology: 'Strong buying is followed by hesitation — buyers are no longer pushing to new highs.',
    interpretation: 'An early warning that the uptrend may be pausing.',
    volume: 'Shrinking volume on the second candle shows buying interest fading.',
    confirmation: STD_BEAR_CONFIRM,
    failure: 'A close above the first candle’s high cancels it.',
    q: Q('p-bearish-harami', 'How strong is a harami compared with an engulfing pattern?', ['Weaker — it is an early warning that needs confirmation', 'Stronger in all cases', 'Exactly the same', 'Haramis are always ignored'], 'Engulfing shows a takeover; harami shows only a stall.'),
  },
  {
    id: 'piercing', name: 'Piercing pattern', candles: 2, bias: 'bullish', signal: 'Bullish reversal (after a downtrend)',
    structure: 'A long red candle, then a green candle that opens below the red close and closes above the middle of the red body (but not above its open).',
    conditions: ['Appears after a downtrend', 'Candle 1: long red body', 'Candle 2 opens below candle 1’s close', 'Candle 2 closes above candle 1’s midpoint but below its open'],
    psychology: 'Sellers open the second session even lower, but buyers recover more than half of the previous loss.',
    interpretation: 'A bullish reversal signal — slightly weaker than a bullish engulfing.',
    volume: 'Higher volume on the green candle helps.',
    confirmation: STD_BULL_CONFIRM,
    failure: 'A close below the pattern’s low cancels it.',
    q: Q('p-piercing', 'A piercing pattern’s green candle must close:', ['Above the midpoint of the previous red body', 'Below the previous close', 'Above the previous high', 'At its own open'], 'Recovering more than half of the loss is what makes it meaningful.'),
  },
  {
    id: 'dark-cloud', name: 'Dark cloud cover', candles: 2, bias: 'bearish', signal: 'Bearish reversal (after an uptrend)',
    structure: 'A long green candle, then a red candle that opens above the green close and closes below the middle of the green body (but not below its open).',
    conditions: ['Appears after an uptrend', 'Candle 1: long green body', 'Candle 2 opens above candle 1’s close', 'Candle 2 closes below candle 1’s midpoint but above its open'],
    psychology: 'Optimism produces a higher open, but sellers take over and erase more than half of the previous gain.',
    interpretation: 'A bearish reversal signal, the mirror image of the piercing pattern.',
    volume: 'Higher volume on the red candle helps.',
    confirmation: STD_BEAR_CONFIRM,
    failure: 'A close above the pattern’s high cancels it.',
    q: Q('p-dark-cloud', 'Dark cloud cover is the bearish counterpart of which pattern?', ['Piercing pattern', 'Morning star', 'Hammer', 'Three white soldiers'], 'Both are two-candle patterns that retrace more than half of the prior body.'),
  },
  {
    id: 'tweezer-top', name: 'Tweezer top', candles: 2, bias: 'bearish', signal: 'Bearish reversal (after an uptrend)',
    structure: 'Two candles with almost identical highs; typically the first is green and the second red.',
    conditions: ['Appears after an uptrend', 'Highs nearly equal (within about 10% of a typical candle range)', 'First candle green, second red'],
    psychology: 'Buyers fail twice at the same price — a ceiling where sellers are waiting.',
    interpretation: 'Marks short-term resistance and a possible top.',
    volume: 'More meaningful if volume rises on the second (red) candle.',
    confirmation: STD_BEAR_CONFIRM,
    failure: 'A close above the twin highs breaks the ceiling and cancels the signal.',
    q: Q('p-tweezer-top', 'What defines a tweezer top?', ['Two candles with nearly equal highs after an uptrend', 'Two candles with nearly equal lows after a downtrend', 'Three rising candles', 'A single long wick'], 'The matching highs show a price level buyers could not break.'),
  },
  {
    id: 'tweezer-bottom', name: 'Tweezer bottom', candles: 2, bias: 'bullish', signal: 'Bullish reversal (after a downtrend)',
    structure: 'Two candles with almost identical lows; typically the first is red and the second green.',
    conditions: ['Appears after a downtrend', 'Lows nearly equal', 'First candle red, second green'],
    psychology: 'Sellers fail twice at the same price — a floor where buyers are waiting.',
    interpretation: 'Marks short-term support and a possible bottom.',
    volume: 'More meaningful with higher volume on the second (green) candle.',
    confirmation: STD_BULL_CONFIRM,
    failure: 'A close below the twin lows breaks the floor and cancels the signal.',
    q: Q('p-tweezer-bottom', 'A tweezer bottom shows:', ['A price floor where sellers failed twice', 'A guaranteed rally', 'A ceiling where buyers failed', 'No information'], 'Matching lows mark support.'),
  },
]

export const patternById: Record<string, PatternInfo> = Object.fromEntries(patterns.map((p) => [p.id, p]))
export const patternName = (id: string) => patternById[id]?.name ?? id

/** Chart-identification questions: show the illustration, ask for the pattern name. */
export const patternIdQuestions: Question[] = patterns.map((p, i) => {
  const n = patterns.length
  const others = [2, 5, 9].map((o) => patterns[(i + o) % n].name)
  return Q(`pid-${p.id}`, 'Chart identification: which pattern is highlighted in the picture?', [p.name, ...others], `This is a **${p.name}**: ${p.structure}`, `pattern:${p.id}`)
})
