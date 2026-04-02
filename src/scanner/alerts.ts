// Generates beginner-friendly alerts with plain English explanations,
// entry prices, sell targets, stop-losses, and position sizing guidance.
import type {
  Alert,
  AlertAction,
  IndicatorValues,
  SignalVote,
  VoteResult,
  Holding,
} from './types.js';

// ── Tunable Constants ─────────────────────────────────────────────────────────

// Discount applied to current price to suggest a limit-order entry (0.5% below market)
const ENTRY_DISCOUNT_FACTOR = 0.995;

// ATR multiplier for BUY stop-loss (stop = entry - ATR_STOP_MULTIPLIER_BUY × ATR)
const ATR_STOP_MULTIPLIER_BUY = 1.5;

// Fallback stop-loss as a fraction of entry when ATR is unavailable (4% below entry)
const DEFAULT_STOP_FACTOR_BUY = 0.96;

// ATR multiplier for SELL stop-loss (tighter; stop = price - ATR_STOP_MULTIPLIER_SELL × ATR)
const ATR_STOP_MULTIPLIER_SELL = 1.0;

// Fallback SELL stop-loss fraction when ATR is unavailable (3% below price)
const DEFAULT_STOP_FACTOR_SELL = 0.97;

// Maximum recommended percentage of total portfolio in one trade
const MAX_POSITION_SIZE_PCT = 5;

// ── Vote/Signal Logic ─────────────────────────────────────────────────────────

/**
 * Examine all indicator values and produce individual votes + a combined verdict.
 * Each indicator casts one vote: bullish, bearish, or neutral.
 */
export function computeVotes(price: number, ind: IndicatorValues): VoteResult {
  const votes: SignalVote[] = [];

  // RSI vote
  if (ind.rsi !== null) {
    if (ind.rsi < 30) {
      votes.push({ indicator: 'RSI', signal: 'bullish', reason: `RSI is ${ind.rsi.toFixed(1)} (below 30 = oversold — price may bounce back up)` });
    } else if (ind.rsi > 70) {
      votes.push({ indicator: 'RSI', signal: 'bearish', reason: `RSI is ${ind.rsi.toFixed(1)} (above 70 = overbought — price may pull back)` });
    } else {
      votes.push({ indicator: 'RSI', signal: 'neutral', reason: `RSI is ${ind.rsi.toFixed(1)} (between 30–70 = normal range)` });
    }
  }

  // MACD vote
  if (ind.macd !== null) {
    if (ind.macd.histogram > 0) {
      votes.push({ indicator: 'MACD', signal: 'bullish', reason: `MACD histogram is positive — short-term momentum is trending up` });
    } else if (ind.macd.histogram < 0) {
      votes.push({ indicator: 'MACD', signal: 'bearish', reason: `MACD histogram is negative — short-term momentum is trending down` });
    } else {
      votes.push({ indicator: 'MACD', signal: 'neutral', reason: `MACD histogram is near zero — no strong trend` });
    }
  }

  // EMA 12 vs EMA 26 (short-term trend)
  if (ind.ema12 !== null && ind.ema26 !== null) {
    if (ind.ema12 > ind.ema26) {
      votes.push({ indicator: 'EMA12/26', signal: 'bullish', reason: `Short-term EMA (12) is above long-term EMA (26) — uptrend in place` });
    } else {
      votes.push({ indicator: 'EMA12/26', signal: 'bearish', reason: `Short-term EMA (12) is below long-term EMA (26) — downtrend in place` });
    }
  }

  // Price vs SMA20
  if (ind.sma20 !== null) {
    if (price > ind.sma20) {
      votes.push({ indicator: 'SMA20', signal: 'bullish', reason: `Price ($${price.toFixed(2)}) is above 20-day average ($${ind.sma20.toFixed(2)}) — near-term bullish` });
    } else {
      votes.push({ indicator: 'SMA20', signal: 'bearish', reason: `Price ($${price.toFixed(2)}) is below 20-day average ($${ind.sma20.toFixed(2)}) — near-term bearish` });
    }
  }

  // Price vs SMA50
  if (ind.sma50 !== null) {
    if (price > ind.sma50) {
      votes.push({ indicator: 'SMA50', signal: 'bullish', reason: `Price ($${price.toFixed(2)}) is above 50-day average ($${ind.sma50.toFixed(2)}) — medium-term uptrend` });
    } else {
      votes.push({ indicator: 'SMA50', signal: 'bearish', reason: `Price ($${price.toFixed(2)}) is below 50-day average ($${ind.sma50.toFixed(2)}) — medium-term downtrend` });
    }
  }

  // Bollinger Bands vote
  if (ind.bollingerBands !== null) {
    const bb = ind.bollingerBands;
    if (price < bb.lower) {
      votes.push({ indicator: 'Bollinger Bands', signal: 'bullish', reason: `Price is below lower Bollinger Band ($${bb.lower.toFixed(2)}) — stock is "on sale" vs its normal range` });
    } else if (price > bb.upper) {
      votes.push({ indicator: 'Bollinger Bands', signal: 'bearish', reason: `Price is above upper Bollinger Band ($${bb.upper.toFixed(2)}) — stock is "expensive" vs its normal range` });
    } else {
      votes.push({ indicator: 'Bollinger Bands', signal: 'neutral', reason: `Price is within normal Bollinger Band range` });
    }
  }

  // Stochastic vote
  if (ind.stochastic !== null) {
    const k = ind.stochastic.k;
    if (k < 20) {
      votes.push({ indicator: 'Stochastic', signal: 'bullish', reason: `Stochastic %K is ${k.toFixed(1)} (below 20 = momentum oversold)` });
    } else if (k > 80) {
      votes.push({ indicator: 'Stochastic', signal: 'bearish', reason: `Stochastic %K is ${k.toFixed(1)} (above 80 = momentum overbought)` });
    } else {
      votes.push({ indicator: 'Stochastic', signal: 'neutral', reason: `Stochastic %K is ${k.toFixed(1)} (between 20–80 = normal)` });
    }
  }

  // VWAP vote
  if (ind.vwap !== null) {
    if (price > ind.vwap) {
      votes.push({ indicator: 'VWAP', signal: 'bullish', reason: `Price ($${price.toFixed(2)}) is above VWAP ($${ind.vwap.toFixed(2)}) — buyers are in control today` });
    } else {
      votes.push({ indicator: 'VWAP', signal: 'bearish', reason: `Price ($${price.toFixed(2)}) is below VWAP ($${ind.vwap.toFixed(2)}) — sellers are in control today` });
    }
  }

  // Tally the votes
  const bullish = votes.filter((v) => v.signal === 'bullish').length;
  const bearish = votes.filter((v) => v.signal === 'bearish').length;
  const neutral = votes.filter((v) => v.signal === 'neutral').length;
  const total = votes.length;

  // Confidence based on how dominant one side is
  let confidence: VoteResult['confidence'] = 'low';
  const majority = Math.max(bullish, bearish);
  if (total > 0) {
    const ratio = majority / total;
    if (ratio >= 0.75) confidence = 'high';
    else if (ratio >= 0.55) confidence = 'medium';
    else confidence = 'low';
  }

  return { bullish, bearish, neutral, total, confidence, votes };
}

/**
 * Decide what action to recommend based on votes.
 * SELL is only allowed when `isOwned` is true — we never tell users
 * to sell something they don't own.
 */
export function decideAction(
  voteResult: VoteResult,
  isOwned: boolean,
  confidence: 'high' | 'medium' | 'low',
): AlertAction {
  const { bullish, bearish, total } = voteResult;
  if (total === 0) return 'WATCH';

  const bullRatio = bullish / total;
  const bearRatio = bearish / total;

  if (bullRatio >= 0.6 && confidence !== 'low') return 'BUY';
  if (bearRatio >= 0.6 && isOwned) return 'SELL';
  if (bearRatio >= 0.6) return 'WATCH'; // bearish but not owned — just watch
  return 'WATCH';
}

// ── Alert Formatting ──────────────────────────────────────────────────────────

/** Format a dollar amount with 2 decimal places */
function dollar(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Format a percentage change */
function pct(from: number, to: number): string {
  const change = ((to - from) / from) * 100;
  const sign = change >= 0 ? '+' : '';
  return `${sign}${change.toFixed(1)}%`;
}

/**
 * Generate a BUY alert with beginner-friendly guidance.
 * Includes entry price, sell targets, stop-loss, and position sizing.
 */
export function formatBuyAlert(
  ticker: string,
  price: number,
  ind: IndicatorValues,
  voteResult: VoteResult,
): string {
  // Entry: suggest a limit slightly below current price
  const entry = price * ENTRY_DISCOUNT_FACTOR;

  // Sell targets:
  //   Target 1 = SMA20 or middle Bollinger Band (sell half)
  //   Target 2 = upper Bollinger Band (sell the rest)
  const target1 = ind.sma20 ?? ind.bollingerBands?.middle ?? price * 1.04;
  const target2 = ind.bollingerBands?.upper ?? price * 1.08;

  // Stop-loss: ATR_STOP_MULTIPLIER_BUY × ATR below entry (if ATR available), else DEFAULT_STOP_FACTOR_BUY below entry
  const stopLoss = ind.atr != null ? entry - ATR_STOP_MULTIPLIER_BUY * ind.atr : entry * DEFAULT_STOP_FACTOR_BUY;

  // Position sizing guidance
  const sharesFor500 = Math.floor(500 / entry);
  const sharesFor1000 = Math.floor(1000 / entry);

  const lines: string[] = [
    `📋 PAPER MODE — This is simulated analysis only. No real money is involved.`,
    ``,
    `🟢 ${ticker} — BUY SIGNAL (${voteResult.confidence.toUpperCase()} confidence)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🎯 ACTION: BUY`,
    ``,
    `📝 WHAT THIS MEANS:`,
    `   Multiple indicators suggest ${ticker} may be undervalued right now.`,
    `   This could be a good entry point based on technical analysis.`,
    ``,
    `📊 WHY WE THINK THIS (${voteResult.bullish}/${voteResult.total} indicators agree):`,
    ...voteResult.votes
      .filter((v) => v.signal === 'bullish')
      .map((v) => `   ✓ ${v.reason}`),
    ``,
    `   Bearish signals to watch:`,
    ...(voteResult.votes.filter((v) => v.signal === 'bearish').length > 0
      ? voteResult.votes.filter((v) => v.signal === 'bearish').map((v) => `   ⚠ ${v.reason}`)
      : [`   None — mostly bullish`]),
    ``,
    `💰 IF YOU DECIDE TO BUY:`,
    `   Current price : ${dollar(price)}`,
    `   Suggested entry: ${dollar(entry)} (set a LIMIT ORDER at this price — don't chase)`,
    ``,
    `🎯 WHEN TO SELL — Set these targets NOW:`,
    `   Target 1 (sell HALF your shares): ${dollar(target1)} (${pct(entry, target1)})`,
    `      → This is the 20-day average price; a realistic short-term target.`,
    `   Target 2 (sell REST of your shares): ${dollar(target2)} (${pct(entry, target2)})`,
    `      → This is the upper Bollinger Band; a more aggressive target.`,
    ``,
    `🛑 STOP-LOSS (YOUR EMERGENCY EXIT):`,
    `   Stop-loss: ${dollar(stopLoss)} (${pct(entry, stopLoss)})`,
    `   → If the price drops to ${dollar(stopLoss)}, SELL EVERYTHING immediately.`,
    `   → This limits your loss. ALWAYS set this before you buy.`,
    ...(ind.atr !== null ? [`   (Based on ${ATR_STOP_MULTIPLIER_BUY}× ATR of ${dollar(ind.atr)})`] : []),
    ``,
    `📏 HOW MUCH TO BUY:`,
    `   $500 account  → ~${sharesFor500} share${sharesFor500 !== 1 ? 's' : ''} (~${dollar(sharesFor500 * entry)})`,
    `   $1000 account → ~${sharesFor1000} share${sharesFor1000 !== 1 ? 's' : ''} (~${dollar(sharesFor1000 * entry)})`,
    `   📌 RULE: Never put more than ${MAX_POSITION_SIZE_PCT}% of your total savings into one trade.`,
    ``,
    `⚠️  REMINDERS:`,
    `   • This is NOT financial advice — it's computer-generated analysis.`,
    `   • Always set a stop-loss to protect yourself.`,
    `   • Never invest money you cannot afford to lose completely.`,
    `   • Paper trade first until you are consistently profitable.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  return lines.join('\n');
}

/**
 * Generate a SELL alert for a stock the user owns.
 * Explains why to sell and what to do with stop-losses.
 */
export function formatSellAlert(
  ticker: string,
  price: number,
  ind: IndicatorValues,
  voteResult: VoteResult,
  holding: Holding,
): string {
  const gainLoss = price - holding.averageCost;
  const gainLossPct = ((gainLoss / holding.averageCost) * 100).toFixed(1);
  const sign = gainLoss >= 0 ? '+' : '';
  const profitLossLabel = gainLoss >= 0 ? 'PROFIT' : 'LOSS';

  // Tightened stop-loss suggestion: ATR_STOP_MULTIPLIER_SELL × ATR below price
  const tightStop = ind.atr != null ? price - ATR_STOP_MULTIPLIER_SELL * ind.atr : price * DEFAULT_STOP_FACTOR_SELL;

  const lines: string[] = [
    `📋 PAPER MODE — This is simulated analysis only. No real money is involved.`,
    ``,
    `🔴 ${ticker} — SELL SIGNAL (${voteResult.confidence.toUpperCase()} confidence)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🎯 ACTION: SELL (you own this stock)`,
    ``,
    `📦 YOUR POSITION:`,
    `   Shares owned    : ${holding.qty}`,
    `   Average buy cost: ${dollar(holding.averageCost)}`,
    `   Current price   : ${dollar(price)}`,
    `   Current ${profitLossLabel}: ${sign}${dollar(Math.abs(gainLoss * holding.qty))} (${sign}${gainLossPct}%)`,
    ``,
    `📝 WHAT THIS MEANS:`,
    `   Indicators suggest ${ticker} may be overbought or breaking down.`,
    `   This could be a good time to lock in profits or cut losses.`,
    ``,
    `📊 WHY WE THINK THIS (${voteResult.bearish}/${voteResult.total} indicators agree):`,
    ...voteResult.votes
      .filter((v) => v.signal === 'bearish')
      .map((v) => `   ✓ ${v.reason}`),
    ``,
    `💡 WHAT TO DO:`,
    `   Option A — Sell ALL ${holding.qty} shares now at market price (~${dollar(price)})`,
    `              → Locks in your ${gainLoss >= 0 ? 'profit' : 'remaining value'} immediately.`,
    `   Option B — Sell HALF (${Math.floor(holding.qty / 2)} shares) now and keep the rest`,
    `              → Locks in some gain while staying in if it recovers.`,
    `   Option C — Keep holding but set a tight stop-loss:`,
    `              Tighten stop to ${dollar(tightStop)}`,
    `              → If it drops here, auto-sell to protect yourself.`,
    ...(ind.atr !== null ? [`              (Based on ${ATR_STOP_MULTIPLIER_SELL}× ATR of ${dollar(ind.atr)})`] : []),
    ``,
    `⚠️  REMINDERS:`,
    `   • This is NOT financial advice — it's computer-generated analysis.`,
    `   • Selling half locks in profit and reduces your risk.`,
    `   • If in doubt, taking profit is never wrong.`,
    `   • Paper trade until you are confident in your decision-making.`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  return lines.join('\n');
}

/**
 * Generate a WATCH alert — informational, no action required.
 */
export function formatWatchAlert(
  ticker: string,
  price: number,
  voteResult: VoteResult,
): string {
  const lines: string[] = [
    `📋 PAPER MODE — This is simulated analysis only. No real money is involved.`,
    ``,
    `👀 ${ticker} — WATCH (mixed signals)`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `🎯 ACTION: No trade right now — keep an eye on it`,
    ``,
    `   Current price: ${dollar(price)}`,
    `   Bullish indicators: ${voteResult.bullish}/${voteResult.total}`,
    `   Bearish indicators: ${voteResult.bearish}/${voteResult.total}`,
    ``,
    `📝 Signal is mixed — not strong enough to recommend a trade.`,
    `   Check back on the next scan for a clearer signal.`,
    ``,
    `📊 INDICATOR BREAKDOWN:`,
    ...voteResult.votes.map((v) => {
      const icon = v.signal === 'bullish' ? '🟢' : v.signal === 'bearish' ? '🔴' : '⚪';
      return `   ${icon} ${v.reason}`;
    }),
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
  ];

  return lines.join('\n');
}

// ── Main Alert Builder ────────────────────────────────────────────────────────

/**
 * Build a complete Alert object for a ticker.
 *
 * @param ticker      Stock symbol
 * @param price       Latest close price
 * @param ind         Computed indicator values
 * @param isOwned     Whether this ticker is in the user's portfolio
 * @param holding     The holding details (required when isOwned is true)
 */
export function buildAlert(
  ticker: string,
  price: number,
  ind: IndicatorValues,
  isOwned: boolean,
  holding: Holding | null,
): Alert {
  const voteResult = computeVotes(price, ind);
  const action = decideAction(voteResult, isOwned, voteResult.confidence);

  let formattedMessage: string;
  if (action === 'BUY') {
    formattedMessage = formatBuyAlert(ticker, price, ind, voteResult);
  } else if (action === 'SELL' && holding) {
    formattedMessage = formatSellAlert(ticker, price, ind, voteResult, holding);
  } else {
    formattedMessage = formatWatchAlert(ticker, price, voteResult);
  }

  return {
    ticker,
    action,
    confidence: voteResult.confidence,
    price,
    indicators: ind,
    votes: voteResult.votes,
    formattedMessage,
    timestamp: new Date().toISOString(),
  };
}
