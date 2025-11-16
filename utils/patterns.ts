import type { Candle } from "./types";
import type { TrendDirection } from "./types";

export interface AnalysisItem {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  explanation: string;
  window: { startIndex: number; endIndex: number };
}

function bodySize(c: Candle) { return Math.abs(c.close - c.open); }
function candleRange(c: Candle) { return c.high - c.low; }
function isBull(c: Candle) { return c.close > c.open; }
function isBear(c: Candle) { return c.open > c.close; }

function trendDirection(candles: Candle[], lookback = 20): TrendDirection {
  if (candles.length < lookback + 1) return 'sideways';
  const recent = candles.slice(-lookback);
  const gains = recent.filter(c => isBull(c)).length;
  const losses = recent.filter(c => isBear(c)).length;
  if (gains >= losses + Math.ceil(lookback * 0.2)) return 'uptrend';
  if (losses >= gains + Math.ceil(lookback * 0.2)) return 'downtrend';
  return 'sideways';
}

function detectDoji(c: Candle): boolean {
  const b = bodySize(c);
  const r = candleRange(c);
  return r > 0 && b / r < 0.1; // very small body relative to range
}

function detectHammerLike(c: Candle): { isHammer: boolean; isInverted: boolean } {
  const upperWick = c.high - Math.max(c.open, c.close);
  const lowerWick = Math.min(c.open, c.close) - c.low;
  const body = bodySize(c);
  const range = candleRange(c);
  if (range === 0) return { isHammer: false, isInverted: false };
  const longLower = lowerWick >= body * 2 && upperWick <= body;
  const longUpper = upperWick >= body * 2 && lowerWick <= body;
  return { isHammer: longLower, isInverted: longUpper };
}

function detectEngulfing(prev: Candle, curr: Candle): 'bullish' | 'bearish' | null {
  const prevBodyLow = Math.min(prev.open, prev.close);
  const prevBodyHigh = Math.max(prev.open, prev.close);
  const currBodyLow = Math.min(curr.open, curr.close);
  const currBodyHigh = Math.max(curr.open, curr.close);
  const engulfs = currBodyLow <= prevBodyLow && currBodyHigh >= prevBodyHigh;
  if (!engulfs) return null;
  if (isBull(curr) && isBear(prev)) return 'bullish';
  if (isBear(curr) && isBull(prev)) return 'bearish';
  return null;
}

function detectHarami(prev: Candle, curr: Candle): 'bullish' | 'bearish' | null {
  const prevBodyLow = Math.min(prev.open, prev.close);
  const prevBodyHigh = Math.max(prev.open, prev.close);
  const currBodyLow = Math.min(curr.open, curr.close);
  const currBodyHigh = Math.max(curr.open, curr.close);
  const inside = currBodyLow >= prevBodyLow && currBodyHigh <= prevBodyHigh;
  if (!inside) return null;
  if (isBull(curr) && isBear(prev)) return 'bullish';
  if (isBear(curr) && isBull(prev)) return 'bearish';
  return null;
}

function detectMorningEveningStar(a: Candle, b: Candle, c: Candle): 'morning' | 'evening' | null {
  // Simplified: big move -> small indecision -> big reversal
  const aBig = bodySize(a) >= candleRange(a) * 0.5;
  const cBig = bodySize(c) >= candleRange(c) * 0.5;
  const bSmall = bodySize(b) <= candleRange(b) * 0.25;
  if (!(aBig && bSmall && cBig)) return null;
  if (isBear(a) && isBull(c) && c.close > (a.open + a.close) / 2) return 'morning';
  if (isBull(a) && isBear(c) && c.close < (a.open + a.close) / 2) return 'evening';
  return null;
}

export function analyzePatterns(candles: Candle[]): AnalysisItem[] {
  const items: AnalysisItem[] = [];
  if (candles.length < 2) return items;

  const dir = trendDirection(candles, 20);
  const N = candles.length;

  // Scan sliding windows
  for (let i = 1; i < N; i++) {
    const prev = candles[i - 1];
    const curr = candles[i];

    const engulf = detectEngulfing(prev, curr);
    if (engulf) {
      items.push({
        name: `${engulf === 'bullish' ? 'Bullish' : 'Bearish'} Engulfing`,
        type: engulf,
        explanation: `${engulf} engulfing after ${dir} trend` + (engulf === 'bullish' && dir === 'downtrend' ? ' (reversal hint)' : engulf === 'bearish' && dir === 'uptrend' ? ' (reversal hint)' : ''),
        window: { startIndex: i - 1, endIndex: i },
      });
    }

    const harami = detectHarami(prev, curr);
    if (harami) {
      items.push({
        name: `${harami === 'bullish' ? 'Bullish' : 'Bearish'} Harami`,
        type: harami,
        explanation: `${harami} harami (inside body) during ${dir}`,
        window: { startIndex: i - 1, endIndex: i },
      });
    }

    const { isHammer, isInverted } = detectHammerLike(curr);
    if (isHammer && (dir === 'downtrend' || dir === 'sideways')) {
      items.push({
        name: 'Hammer',
        type: 'bullish',
        explanation: 'Long lower shadow after decline suggests demand stepping in',
        window: { startIndex: i, endIndex: i },
      });
    }
    if (isInverted && (dir === 'uptrend' || dir === 'sideways')) {
      items.push({
        name: 'Inverted Hammer / Shooting Star',
        type: 'bearish',
        explanation: 'Long upper shadow after advance suggests supply overhead',
        window: { startIndex: i, endIndex: i },
      });
    }

    if (detectDoji(curr)) {
      items.push({
        name: 'Doji',
        type: 'neutral',
        explanation: 'Small body (indecision); context matters for signal',
        window: { startIndex: i, endIndex: i },
      });
    }
  }

  // 3-candle patterns
  for (let i = 2; i < N; i++) {
    const a = candles[i - 2];
    const b = candles[i - 1];
    const c = candles[i];
    const star = detectMorningEveningStar(a, b, c);
    if (star === 'morning') {
      items.push({
        name: 'Morning Star',
        type: 'bullish',
        explanation: 'Down move, indecision, strong up candle ? potential reversal',
        window: { startIndex: i - 2, endIndex: i },
      });
    }
    if (star === 'evening') {
      items.push({
        name: 'Evening Star',
        type: 'bearish',
        explanation: 'Up move, indecision, strong down candle ? potential reversal',
        window: { startIndex: i - 2, endIndex: i },
      });
    }
  }

  return items;
}
