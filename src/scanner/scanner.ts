/**
 * Core scanning logic — fetches data, computes indicators, generates signals.
 */

import { randomUUID } from 'crypto';
import { fetchOHLCV, computeIndicators, buildVotes } from './indicators.js';
import { createAlert } from './alerts.js';
import { loadPortfolio, getHolding } from './portfolio.js';
import { saveScanHistory } from './history.js';
import type { ScanResult, Alert, IndicatorResult, IndicatorVote } from './types.js';

/** Determine the overall signal and confidence from votes */
function computeSignal(
  votes: IndicatorVote[],
  ticker: string,
  isInPortfolio: boolean,
): { signal: ScanResult['signal']; confidence: ScanResult['confidence'] } {
  const bullish = votes.filter((v) => v.signal === 'bullish').length;
  const bearish = votes.filter((v) => v.signal === 'bearish').length;
  const total = votes.length;

  if (total === 0) return { signal: 'HOLD', confidence: 'Low' };

  const bullishPct = bullish / total;
  const bearishPct = bearish / total;

  // Confidence based on how many indicators agree
  const maxPct = Math.max(bullishPct, bearishPct);
  const confidence: ScanResult['confidence'] =
    maxPct >= 0.75 ? 'High' : maxPct >= 0.55 ? 'Moderate' : 'Low';

  if (bullishPct >= 0.55) {
    return { signal: 'BUY', confidence };
  }

  if (bearishPct >= 0.55) {
    // Only issue SELL signal if user owns the stock
    return { signal: isInPortfolio ? 'SELL' : 'WATCH', confidence };
  }

  // Mixed signals → WATCH
  if (bullishPct > 0 || bearishPct > 0) {
    return { signal: 'WATCH', confidence };
  }

  return { signal: 'HOLD', confidence: 'Low' };
}

// Minimum number of bars required to compute all indicators reliably.
// SMA20 needs 20, SMA50 needs 50, but we gate at 20 here since insufficient
// bars for SMA50 just returns null gracefully — 20 is the smallest requirement.
const MIN_BARS_REQUIRED = 20;

/** Scan a single ticker and return the result */
async function scanTicker(ticker: string): Promise<ScanResult | null> {
  try {
    const bars = await fetchOHLCV(ticker);

    if (bars.length < MIN_BARS_REQUIRED) {
      console.warn(`  ⚠️  Not enough data for ${ticker} (${bars.length} bars — need ${MIN_BARS_REQUIRED}+)`);
      return null;
    }

    const indicators: IndicatorResult = computeIndicators(ticker, bars);
    const votes: IndicatorVote[] = buildVotes(indicators);

    const portfolio = loadPortfolio();
    const holding = getHolding(ticker, portfolio);
    const isOwned = !!holding;

    const { signal, confidence } = computeSignal(votes, ticker, isOwned);

    const bullishCount = votes.filter((v) => v.signal === 'bullish').length;
    const bearishCount = votes.filter((v) => v.signal === 'bearish').length;
    const neutralCount = votes.filter((v) => v.signal === 'neutral').length;

    return {
      ticker,
      price: indicators.price,
      timestamp: new Date().toISOString(),
      indicators,
      votes,
      bullishCount,
      bearishCount,
      neutralCount,
      signal,
      confidence,
      holding: isOwned ? holding : undefined,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  ❌ Error scanning ${ticker}: ${msg}`);
    return null;
  }
}

/** Run a full scan of the given tickers */
export async function runScan(tickers: string[]): Promise<{
  results: ScanResult[];
  alerts: Alert[];
}> {
  const startedAt = new Date().toISOString();
  const runId = randomUUID();
  const results: ScanResult[] = [];
  const alerts: Alert[] = [];

  console.log(`\n🔍 Scanning ${tickers.length} ticker${tickers.length > 1 ? 's' : ''}...\n`);

  for (const ticker of tickers) {
    process.stdout.write(`  → ${ticker}... `);
    const result = await scanTicker(ticker);
    if (!result) {
      console.log('skipped');
      continue;
    }

    results.push(result);
    const alert = createAlert(result);

    const signalIcon =
      result.signal === 'BUY'
        ? '🟢 BUY'
        : result.signal === 'SELL'
          ? '🔴 SELL'
          : result.signal === 'WATCH'
            ? '🟡 WATCH'
            : '⚪ HOLD';

    console.log(`${signalIcon} (${result.confidence}) — ${result.bullishCount}↑ ${result.bearishCount}↓`);

    if (alert) {
      alerts.push(alert);
    }
  }

  const finishedAt = new Date().toISOString();
  saveScanHistory(runId, startedAt, finishedAt, tickers, results, alerts);

  return { results, alerts };
}
