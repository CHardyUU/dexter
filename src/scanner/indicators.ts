/**
 * Technical indicator computation using the `technicalindicators` library.
 * Fetches OHLCV data from the Financial Datasets API and computes all indicators.
 */

import { RSI, MACD, BollingerBands, EMA, SMA, ATR, Stochastic, VWAP } from 'technicalindicators';
import { api } from '../tools/finance/api.js';
import type { OHLCVBar, IndicatorResult, IndicatorVote } from './types.js';

// How many days of history to fetch for indicator calculation.
// 90 days ensures we have enough data for the most demanding indicator (SMA50 needs 50 bars,
// MACD needs 27+, and having extra data improves the accuracy of RSI and ATR warm-up values).
const LOOKBACK_DAYS = 90;

/** Format a date as YYYY-MM-DD */
function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

/** Fetch OHLCV bars for a ticker from Financial Datasets API */
export async function fetchOHLCV(ticker: string): Promise<OHLCVBar[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - LOOKBACK_DAYS);

  const { data } = await api.get('/prices/', {
    ticker: ticker.toUpperCase(),
    interval: 'day',
    start_date: toDateStr(startDate),
    end_date: toDateStr(endDate),
  });

  const prices = (data.prices as Record<string, unknown>[]) || [];

  return prices
    .map((p) => ({
      time: String(p.time ?? p.date ?? ''),
      open: Number(p.open),
      high: Number(p.high),
      low: Number(p.low),
      close: Number(p.close),
      volume: Number(p.volume),
    }))
    .filter((b) => b.time && !isNaN(b.close) && b.close > 0)
    .sort((a, b) => a.time.localeCompare(b.time)); // oldest first
}

/** Detect if MACD crossed over or under the signal line in the last two bars */
function detectMacdCrossover(
  values: Array<{ MACD?: number; signal?: number }>,
): 'bullish' | 'bearish' | 'none' {
  if (values.length < 2) return 'none';
  const prev = values[values.length - 2];
  const curr = values[values.length - 1];

  const prevMacd = prev.MACD ?? 0;
  const prevSig = prev.signal ?? 0;
  const currMacd = curr.MACD ?? 0;
  const currSig = curr.signal ?? 0;

  if (prevMacd < prevSig && currMacd >= currSig) return 'bullish';
  if (prevMacd > prevSig && currMacd <= currSig) return 'bearish';
  return 'none';
}

/** Compute all technical indicators from OHLCV data */
export function computeIndicators(ticker: string, bars: OHLCVBar[]): IndicatorResult {
  const closes = bars.map((b) => b.close);
  const highs = bars.map((b) => b.high);
  const lows = bars.map((b) => b.low);
  const volumes = bars.map((b) => b.volume);
  const price = closes[closes.length - 1] ?? 0;

  // RSI(14)
  let rsi: number | null = null;
  if (closes.length >= 15) {
    const rsiValues = RSI.calculate({ values: closes, period: 14 });
    rsi = rsiValues[rsiValues.length - 1] ?? null;
  }

  // MACD(12,26,9)
  let macd: IndicatorResult['macd'] = null;
  if (closes.length >= 27) {
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const last = macdValues[macdValues.length - 1];
    if (last) {
      macd = {
        macd: last.MACD ?? 0,
        signal: last.signal ?? 0,
        histogram: last.histogram ?? 0,
        crossover: detectMacdCrossover(macdValues),
      };
    }
  }

  // Bollinger Bands (20, 2)
  let bollingerBands: IndicatorResult['bollingerBands'] = null;
  if (closes.length >= 20) {
    const bbValues = BollingerBands.calculate({ values: closes, period: 20, stdDev: 2 });
    const last = bbValues[bbValues.length - 1];
    if (last) {
      bollingerBands = {
        upper: last.upper,
        middle: last.middle,
        lower: last.lower,
        bandwidth: ((last.upper - last.lower) / last.middle) * 100,
      };
    }
  }

  // EMA(12)
  let ema12: number | null = null;
  if (closes.length >= 12) {
    const vals = EMA.calculate({ values: closes, period: 12 });
    ema12 = vals[vals.length - 1] ?? null;
  }

  // EMA(26)
  let ema26: number | null = null;
  if (closes.length >= 26) {
    const vals = EMA.calculate({ values: closes, period: 26 });
    ema26 = vals[vals.length - 1] ?? null;
  }

  // SMA(20)
  let sma20: number | null = null;
  if (closes.length >= 20) {
    const vals = SMA.calculate({ values: closes, period: 20 });
    sma20 = vals[vals.length - 1] ?? null;
  }

  // SMA(50)
  let sma50: number | null = null;
  if (closes.length >= 50) {
    const vals = SMA.calculate({ values: closes, period: 50 });
    sma50 = vals[vals.length - 1] ?? null;
  }

  // ATR(14)
  let atr: number | null = null;
  if (bars.length >= 15) {
    const atrValues = ATR.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
    });
    atr = atrValues[atrValues.length - 1] ?? null;
  }

  // Stochastic(14,3,3)
  let stochastic: IndicatorResult['stochastic'] = null;
  if (bars.length >= 14) {
    const stochValues = Stochastic.calculate({
      high: highs,
      low: lows,
      close: closes,
      period: 14,
      signalPeriod: 3,
    });
    const last = stochValues[stochValues.length - 1];
    if (last) {
      stochastic = { k: last.k, d: last.d };
    }
  }

  // VWAP — requires timestamp, computed over the full dataset
  let vwap: number | null = null;
  if (bars.length >= 1) {
    try {
      const vwapValues = VWAP.calculate({
        high: highs,
        low: lows,
        close: closes,
        volume: volumes,
      });
      vwap = vwapValues[vwapValues.length - 1] ?? null;
    } catch {
      // VWAP can fail if data is insufficient; ignore gracefully
    }
  }

  return {
    ticker,
    price,
    rsi,
    macd,
    bollingerBands,
    ema12,
    ema26,
    sma20,
    sma50,
    atr,
    stochastic,
    vwap,
  };
}

/** Convert computed indicators into a list of votes (bullish/bearish/neutral) */
export function buildVotes(ind: IndicatorResult): IndicatorVote[] {
  const votes: IndicatorVote[] = [];
  const price = ind.price;

  // RSI
  if (ind.rsi !== null) {
    const r = ind.rsi;
    if (r < 30) {
      votes.push({
        name: 'RSI(14)',
        signal: 'bullish',
        value: r.toFixed(1),
        reason: `RSI is ${r.toFixed(1)} — below 30 means "oversold" (the stock has been pushed down a lot and might bounce back, like a rubber band that's been stretched too far)`,
      });
    } else if (r > 70) {
      votes.push({
        name: 'RSI(14)',
        signal: 'bearish',
        value: r.toFixed(1),
        reason: `RSI is ${r.toFixed(1)} — above 70 means "overbought" (the stock has been pushed up a lot and might start to fall, like a rubber band stretched the other way)`,
      });
    } else {
      votes.push({
        name: 'RSI(14)',
        signal: 'neutral',
        value: r.toFixed(1),
        reason: `RSI is ${r.toFixed(1)} — in the neutral zone (between 30–70). No strong signal yet`,
      });
    }
  }

  // MACD
  if (ind.macd !== null) {
    const { crossover, macd: macdVal, signal } = ind.macd;
    if (crossover === 'bullish') {
      votes.push({
        name: 'MACD',
        signal: 'bullish',
        value: `${macdVal.toFixed(3)} / ${signal.toFixed(3)}`,
        reason: `MACD just crossed ABOVE its signal line — this is a bullish crossover, meaning short-term momentum is picking up (like a car that was slowing down just hit the accelerator)`,
      });
    } else if (crossover === 'bearish') {
      votes.push({
        name: 'MACD',
        signal: 'bearish',
        value: `${macdVal.toFixed(3)} / ${signal.toFixed(3)}`,
        reason: `MACD just crossed BELOW its signal line — this is a bearish crossover, meaning short-term momentum is weakening (the car is starting to slow down)`,
      });
    } else {
      const sig = macdVal > signal ? 'bullish' : macdVal < signal ? 'bearish' : 'neutral';
      votes.push({
        name: 'MACD',
        signal: sig,
        value: `${macdVal.toFixed(3)} / ${signal.toFixed(3)}`,
        reason: `MACD is ${sig === 'bullish' ? 'above' : 'below'} the signal line (no crossover yet, but ${sig === 'bullish' ? 'trending up' : 'trending down'})`,
      });
    }
  }

  // Bollinger Bands
  if (ind.bollingerBands !== null) {
    const { upper, middle, lower } = ind.bollingerBands;
    if (price <= lower) {
      votes.push({
        name: 'Bollinger Bands',
        signal: 'bullish',
        value: `$${price.toFixed(2)} (lower: $${lower.toFixed(2)})`,
        reason: `Price is AT or BELOW the lower Bollinger Band — this is a "dip", meaning the stock is trading at an unusually low price compared to recent history. Often a buy opportunity`,
      });
    } else if (price >= upper) {
      votes.push({
        name: 'Bollinger Bands',
        signal: 'bearish',
        value: `$${price.toFixed(2)} (upper: $${upper.toFixed(2)})`,
        reason: `Price is AT or ABOVE the upper Bollinger Band — the stock is trading at an unusually high price compared to recent history. Could be due for a pullback`,
      });
    } else {
      const pct = ((price - lower) / (upper - lower)) * 100;
      votes.push({
        name: 'Bollinger Bands',
        signal: 'neutral',
        value: `$${price.toFixed(2)} (${pct.toFixed(0)}% of range)`,
        reason: `Price is inside the Bollinger Bands (at ${pct.toFixed(0)}% of the normal range). No extreme reading`,
      });
    }
  }

  // EMA12 vs EMA26
  if (ind.ema12 !== null && ind.ema26 !== null) {
    const sig = ind.ema12 > ind.ema26 ? 'bullish' : 'bearish';
    votes.push({
      name: 'EMA 12/26',
      signal: sig,
      value: `EMA12: $${ind.ema12.toFixed(2)} / EMA26: $${ind.ema26.toFixed(2)}`,
      reason: `The 12-day average price is ${sig === 'bullish' ? 'ABOVE' : 'BELOW'} the 26-day average — ${sig === 'bullish' ? 'short-term trend is up' : 'short-term trend is down'}`,
    });
  }

  // Price vs SMA20
  if (ind.sma20 !== null) {
    const sig = price > ind.sma20 ? 'bullish' : 'bearish';
    votes.push({
      name: 'SMA(20)',
      signal: sig,
      value: `$${ind.sma20.toFixed(2)}`,
      reason: `Price is ${sig === 'bullish' ? 'ABOVE' : 'BELOW'} its 20-day average of $${ind.sma20.toFixed(2)} — ${sig === 'bullish' ? 'short-term uptrend' : 'short-term downtrend'}`,
    });
  }

  // Price vs SMA50
  if (ind.sma50 !== null) {
    const sig = price > ind.sma50 ? 'bullish' : 'bearish';
    votes.push({
      name: 'SMA(50)',
      signal: sig,
      value: `$${ind.sma50.toFixed(2)}`,
      reason: `Price is ${sig === 'bullish' ? 'ABOVE' : 'BELOW'} its 50-day average of $${ind.sma50.toFixed(2)} — ${sig === 'bullish' ? 'medium-term uptrend' : 'medium-term downtrend'}`,
    });
  }

  // Stochastic
  if (ind.stochastic !== null) {
    const { k } = ind.stochastic;
    if (k < 20) {
      votes.push({
        name: 'Stochastic',
        signal: 'bullish',
        value: `%K: ${k.toFixed(1)}`,
        reason: `Stochastic is ${k.toFixed(1)} — below 20 means oversold (momentum has fallen very low, similar to RSI, often seen before a bounce)`,
      });
    } else if (k > 80) {
      votes.push({
        name: 'Stochastic',
        signal: 'bearish',
        value: `%K: ${k.toFixed(1)}`,
        reason: `Stochastic is ${k.toFixed(1)} — above 80 means overbought (momentum is very high, often seen before a pullback)`,
      });
    } else {
      votes.push({
        name: 'Stochastic',
        signal: 'neutral',
        value: `%K: ${k.toFixed(1)}`,
        reason: `Stochastic is ${k.toFixed(1)} — in the neutral zone (20–80). No extreme signal`,
      });
    }
  }

  // VWAP
  if (ind.vwap !== null) {
    const sig = price > ind.vwap ? 'bullish' : 'bearish';
    votes.push({
      name: 'VWAP',
      signal: sig,
      value: `$${ind.vwap.toFixed(2)}`,
      reason: `Price is ${sig === 'bullish' ? 'ABOVE' : 'BELOW'} VWAP ($${ind.vwap.toFixed(2)}). VWAP is the average price people paid weighted by volume — it's like the "fair value" price. ${sig === 'bullish' ? 'Trading above it is bullish' : 'Trading below it suggests weakness'}`,
    });
  }

  return votes;
}
