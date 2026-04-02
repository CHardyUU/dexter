// Computes technical indicators from OHLCV price data using the
// 'technicalindicators' library (https://github.com/anandanand84/technicalindicators)
import {
  RSI,
  MACD,
  EMA,
  SMA,
  BollingerBands,
  ATR,
  Stochastic,
  VWAP,
} from 'technicalindicators';
import type { PriceCandle, IndicatorValues } from './types.js';

// Minimum number of candles required for reliable indicator output.
// Most slow indicators (e.g. SMA50) need 50+ points; 30 ensures even
// the fast indicators have meaningful warm-up data.
const MIN_CANDLES_FOR_INDICATORS = 30;

// Number of recent candles to use for VWAP (rolling window).
const VWAP_LOOKBACK_DAYS = 20;

/** Return the last element of an array, or null if empty/undefined */
function last<T>(arr: T[] | undefined): T | null {
  if (!arr || arr.length === 0) return null;
  return arr[arr.length - 1] ?? null;
}

/**
 * Compute all technical indicators from an array of price candles.
 * Candles should be ordered oldest → newest.
 * Returns null for any indicator that couldn't be computed (e.g., not enough data).
 */
export function computeIndicators(candles: PriceCandle[]): IndicatorValues {
  if (candles.length < MIN_CANDLES_FOR_INDICATORS) {
    // Not enough data for reliable indicators — return all nulls
    return {
      rsi: null,
      macd: null,
      ema12: null,
      ema26: null,
      sma20: null,
      sma50: null,
      bollingerBands: null,
      atr: null,
      stochastic: null,
      vwap: null,
    };
  }

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const volumes = candles.map((c) => c.volume);

  // ── RSI (14-period) ────────────────────────────────────────────────
  let rsi: number | null = null;
  try {
    const rsiValues = RSI.calculate({ period: 14, values: closes });
    rsi = last(rsiValues);
  } catch {
    // Not enough data or error — leave null
  }

  // ── MACD (12/26/9 default) ─────────────────────────────────────────
  let macd: IndicatorValues['macd'] = null;
  try {
    const macdValues = MACD.calculate({
      values: closes,
      fastPeriod: 12,
      slowPeriod: 26,
      signalPeriod: 9,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    });
    const m = last(macdValues);
    if (m && m.MACD != null && m.signal != null && m.histogram != null) {
      macd = { value: m.MACD, signal: m.signal, histogram: m.histogram };
    }
  } catch {
    // Leave null
  }

  // ── EMA 12 ─────────────────────────────────────────────────────────
  let ema12: number | null = null;
  try {
    const ema12Values = EMA.calculate({ period: 12, values: closes });
    ema12 = last(ema12Values);
  } catch {
    // Leave null
  }

  // ── EMA 26 ─────────────────────────────────────────────────────────
  let ema26: number | null = null;
  try {
    const ema26Values = EMA.calculate({ period: 26, values: closes });
    ema26 = last(ema26Values);
  } catch {
    // Leave null
  }

  // ── SMA 20 ─────────────────────────────────────────────────────────
  let sma20: number | null = null;
  try {
    const sma20Values = SMA.calculate({ period: 20, values: closes });
    sma20 = last(sma20Values);
  } catch {
    // Leave null
  }

  // ── SMA 50 ─────────────────────────────────────────────────────────
  let sma50: number | null = null;
  try {
    const sma50Values = SMA.calculate({ period: 50, values: closes });
    sma50 = last(sma50Values);
  } catch {
    // Leave null
  }

  // ── Bollinger Bands (20-period, 2 std devs) ────────────────────────
  let bollingerBands: IndicatorValues['bollingerBands'] = null;
  try {
    const bbValues = BollingerBands.calculate({ period: 20, stdDev: 2, values: closes });
    const bb = last(bbValues);
    if (bb) {
      bollingerBands = { upper: bb.upper, middle: bb.middle, lower: bb.lower };
    }
  } catch {
    // Leave null
  }

  // ── ATR (14-period) ────────────────────────────────────────────────
  let atr: number | null = null;
  try {
    const atrValues = ATR.calculate({ period: 14, high: highs, low: lows, close: closes });
    atr = last(atrValues);
  } catch {
    // Leave null
  }

  // ── Stochastic (14-period, 3-period signal) ────────────────────────
  let stochastic: IndicatorValues['stochastic'] = null;
  try {
    const stochValues = Stochastic.calculate({
      period: 14,
      signalPeriod: 3,
      high: highs,
      low: lows,
      close: closes,
    });
    const s = last(stochValues);
    if (s) {
      stochastic = { k: s.k, d: s.d };
    }
  } catch {
    // Leave null
  }

  // ── VWAP ──────────────────────────────────────────────────────────
  // VWAP from 'technicalindicators' uses all supplied candles.
  // We use the most recent VWAP_LOOKBACK_DAYS days to get a rolling VWAP.
  let vwap: number | null = null;
  try {
    const recent = candles.slice(-VWAP_LOOKBACK_DAYS);
    const vwapValues = VWAP.calculate({
      high: recent.map((c) => c.high),
      low: recent.map((c) => c.low),
      close: recent.map((c) => c.close),
      volume: recent.map((c) => c.volume),
    });
    vwap = last(vwapValues);
  } catch {
    // Leave null
  }

  return { rsi, macd, ema12, ema26, sma20, sma50, bollingerBands, atr, stochastic, vwap };
}
