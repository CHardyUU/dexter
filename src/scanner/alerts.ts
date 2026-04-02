/**
 * Alert formatting — produces beginner-friendly alert messages.
 * Every alert includes plain-English explanations and actionable steps.
 */

import type { ScanResult, Alert, IndicatorVote } from './types.js';

// All alerts are in PAPER MODE — no real trades are executed
const PAPER_BADGE = '📋 PAPER MODE — This is for learning/testing only. No real money involved.';
const DISCLAIMER =
  '⚠️  NOT FINANCIAL ADVICE — This is computer analysis only. Always do your own research. Never invest money you cannot afford to lose.';

/** Round a number to 2 decimal places */
function fmt(n: number): string {
  return n.toFixed(2);
}

/** Format a percentage change */
function pct(from: number, to: number): string {
  const change = ((to - from) / from) * 100;
  return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
}

/** Format a list of vote reasons as bullet points */
function formatVotes(votes: IndicatorVote[]): string {
  return votes
    .map((v) => {
      const icon = v.signal === 'bullish' ? '🟢' : v.signal === 'bearish' ? '🔴' : '⚪';
      return `  ${icon} ${v.name}: ${v.reason}`;
    })
    .join('\n');
}

// Maximum fraction of account to put in a single trade (5% risk rule)
const MAX_POSITION_PCT = 0.05;

/** Position sizing suggestion for small accounts */
function formatPositionSizing(price: number): string {
  const shares500 = Math.max(1, Math.floor((500 * MAX_POSITION_PCT) / price));
  const shares1000 = Math.max(1, Math.floor((1000 * MAX_POSITION_PCT) / price));
  return [
    `📏 HOW MUCH TO BUY (position sizing — max 5% of your account in one stock):`,
    `  • If you have a $500 account:  ~${shares500} share${shares500 > 1 ? 's' : ''} (≈ $${fmt(shares500 * price)})`,
    `  • If you have a $1,000 account: ~${shares1000} share${shares1000 > 1 ? 's' : ''} (≈ $${fmt(shares1000 * price)})`,
    `  ℹ️  The 5% rule means if the trade goes wrong, you only lose 5% of your account max`,
  ].join('\n');
}

/** Generate a BUY alert */
export function formatBuyAlert(result: ScanResult): Alert {
  const { ticker, price, votes, indicators, bullishCount, confidence } = result;
  const bb = indicators.bollingerBands;
  const atr = indicators.atr;

  // Entry and target prices
  const entryPrice = price;
  const betterDeal = price * 0.99; // 1% below current = limit order target
  const target1 = bb?.middle ?? price * 1.04;  // SMA20 or ~4% gain
  const target2 = bb?.upper ?? price * 1.08;   // Upper band or ~8% gain
  const stopLoss = atr ? price - 1.5 * atr : price * 0.96; // 1.5×ATR or 4% below

  const bullishVotes = votes.filter((v) => v.signal === 'bullish');
  const allVotes = votes;

  const lines: string[] = [
    '═'.repeat(60),
    `🟢 BUY ALERT — ${ticker}`,
    `   Price: $${fmt(price)}  |  Confidence: ${confidence}  |  ${bullishCount}/${allVotes.length} signals bullish`,
    PAPER_BADGE,
    '─'.repeat(60),
    '',
    `🎯 ACTION: BUY ${ticker}`,
    '',
    `📝 WHAT THIS MEANS:`,
    `  Multiple indicators suggest ${ticker} may be undervalued right now.`,
    `  This could be a good time to buy — but always use a stop loss (explained below).`,
    '',
    `📊 WHY WE THINK THIS (${bullishCount} bullish signals):`,
    formatVotes(bullishVotes),
    '',
    `💰 IF YOU DECIDE TO BUY:`,
    `  • Entry price (buy now at market): $${fmt(entryPrice)}`,
    `  • Better deal (limit order — wait for a dip): $${fmt(betterDeal)}`,
    `    ℹ️  A limit order means "only buy if the price drops to $${fmt(betterDeal)}"`,
    '',
    `🎯 WHEN TO SELL (set these the moment you buy!):`,
    `  • Target 1 — Sell HALF your shares at: $${fmt(target1)}  (${pct(entryPrice, target1)})`,
    `    ℹ️  This is around the 20-day average price — a safe, realistic first profit`,
    `  • Target 2 — Sell the REST of your shares at: $${fmt(target2)}  (${pct(entryPrice, target2)})`,
    `    ℹ️  This is the upper Bollinger Band — a more ambitious target`,
    `  🛑 STOP LOSS — SELL EVERYTHING if price drops to: $${fmt(stopLoss)}  (${pct(entryPrice, stopLoss)})`,
    `    ⚡ SET THIS NOW. This is your emergency exit. If the price falls here, get out.`,
    `    ℹ️  Based on 1.5× ATR (the stock's average daily range). Keeps your loss manageable.`,
    '',
    formatPositionSizing(price),
    '',
    `📋 REMINDERS:`,
    `  ✅ ALWAYS set your stop loss before anything else`,
    `  ✅ This is paper trading — pretend money only — to learn without risk`,
    `  ✅ Track your trade in 'bun run portfolio' to get SELL alerts later`,
    '',
    DISCLAIMER,
    '═'.repeat(60),
  ];

  return {
    ticker,
    type: 'BUY',
    confidence,
    timestamp: result.timestamp,
    text: lines.join('\n'),
  };
}

/** Generate a SELL alert (only for stocks the user owns) */
export function formatSellAlert(result: ScanResult): Alert {
  const { ticker, price, votes, indicators, bearishCount, confidence, holding } = result;
  const atr = indicators.atr;
  const bb = indicators.bollingerBands;

  const stopLoss = atr ? price - 1.5 * atr : price * 0.96;
  const buyPrice = holding?.buyPrice ?? price;
  const gainLoss = price - buyPrice;
  const gainLossPct = ((gainLoss / buyPrice) * 100).toFixed(1);
  const gainLossLabel = gainLoss >= 0 ? `+$${fmt(gainLoss)} profit` : `-$${fmt(Math.abs(gainLoss))} loss`;

  const bearishVotes = votes.filter((v) => v.signal === 'bearish');
  const allVotes = votes;

  // Determine action strength
  const action = confidence === 'High' ? 'SELL ALL' : 'CONSIDER SELLING HALF';
  const emoji = confidence === 'High' ? '🔴' : '🟠';

  const lines: string[] = [
    '═'.repeat(60),
    `${emoji} SELL ALERT — ${ticker}`,
    `   Price: $${fmt(price)}  |  Confidence: ${confidence}  |  ${bearishCount}/${allVotes.length} signals bearish`,
    PAPER_BADGE,
    '─'.repeat(60),
    '',
    `🎯 ACTION: ${action}`,
    '',
    ...(holding
      ? [
          `📦 YOUR POSITION:`,
          `  • You bought at: $${fmt(buyPrice)} per share`,
          `  • Current price: $${fmt(price)} per share`,
          `  • Current P&L:   ${gainLossLabel} (${gainLossPct}%)`,
          `  • Shares held:   ${holding.quantity}`,
          '',
        ]
      : []),
    `📝 WHAT THIS MEANS:`,
    `  Indicators suggest ${ticker} might be getting overpriced or losing momentum.`,
    confidence === 'High'
      ? `  With ${bearishCount} bearish signals, now may be a good time to take profits.`
      : `  With mixed signals, consider selling half to lock in gains while keeping some upside.`,
    '',
    `📊 WHY WE THINK THIS (${bearishCount} bearish signals):`,
    formatVotes(bearishVotes),
    '',
    `💡 WHAT TO DO:`,
    `  Option A (Cautious): ${action} at the current price (~$${fmt(price)})`,
    `  Option B (Hold some): Sell HALF now, keep the other half`,
    `  Option C (Do nothing): Set a tight stop-loss at $${fmt(stopLoss)} to protect your gains`,
    '',
    `🛑 STOP LOSS (if you keep the stock):`,
    `  Set your stop at: $${fmt(stopLoss)}`,
    `  ℹ️  If price falls below this level, the stock has weakened significantly — sell then`,
    '',
    ...(bb
      ? [
          `🎯 RESISTANCE LEVELS (where it might bounce back down):`,
          `  • Upper band: $${fmt(bb.upper)} — strong resistance, good place to sell`,
          `  • Middle band: $${fmt(bb.middle)} — support/resistance zone`,
          '',
        ]
      : []),
    DISCLAIMER,
    '═'.repeat(60),
  ];

  return {
    ticker,
    type: 'SELL',
    confidence,
    timestamp: result.timestamp,
    text: lines.join('\n'),
  };
}

/** Generate a WATCH alert (informational — stock is approaching a signal) */
export function formatWatchAlert(result: ScanResult): Alert {
  const { ticker, price, votes, bullishCount, bearishCount, confidence } = result;
  const total = votes.length;
  const dominant = bullishCount >= bearishCount ? 'bullish' : 'bearish';
  const dominantVotes = votes.filter((v) => v.signal === (dominant as 'bullish' | 'bearish'));

  const lines: string[] = [
    '─'.repeat(60),
    `🟡 WATCH ALERT — ${ticker}`,
    `   Price: $${fmt(price)}  |  ${bullishCount} bullish / ${bearishCount} bearish / ${total - bullishCount - bearishCount} neutral`,
    PAPER_BADGE,
    '',
    `👀 KEEP AN EYE ON: ${ticker}`,
    '',
    `📝 WHAT THIS MEANS:`,
    `  ${ticker} isn't quite at a buy or sell level yet, but it's starting to show signs.`,
    dominant === 'bullish'
      ? `  It's beginning to look undervalued — watch for more indicators to confirm before buying.`
      : `  It's beginning to look overvalued — watch in case you want to take profits soon.`,
    '',
    `📊 WHAT'S INTERESTING RIGHT NOW:`,
    formatVotes(dominantVotes.slice(0, 3)),
    '',
    `⏰ WHAT TO DO: No action needed yet. Check back next scan.`,
    '',
    DISCLAIMER,
    '─'.repeat(60),
  ];

  return {
    ticker,
    type: 'WATCH',
    confidence,
    timestamp: result.timestamp,
    text: lines.join('\n'),
  };
}

/** Create an alert from a scan result */
export function createAlert(result: ScanResult): Alert | null {
  switch (result.signal) {
    case 'BUY':
      return formatBuyAlert(result);
    case 'SELL':
      // Only send SELL alerts for stocks the user actually owns
      if (!result.holding) return null;
      return formatSellAlert(result);
    case 'WATCH':
      return formatWatchAlert(result);
    default:
      return null;
  }
}
