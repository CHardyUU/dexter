// Core scanner: fetches price data, computes indicators, and builds alerts.
import { config } from 'dotenv';
import { api } from '../tools/finance/api.js';
import { computeIndicators } from './indicators.js';
import { buildAlert } from './alerts.js';
import { isOwned, getHolding } from './portfolio.js';
import type { PriceCandle, ScanResult } from './types.js';

// Load .env variables (API keys, etc.)
config({ quiet: true });

/** Number of calendar days to look back when fetching price history */
const LOOKBACK_DAYS = 90;

/** Get ISO date string (YYYY-MM-DD) for N days ago */
function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

/** Get today's date as YYYY-MM-DD */
function today(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Fetch ~90 days of daily OHLCV candles for a ticker.
 * Returns an empty array if the API key is missing or an error occurs.
 */
async function fetchCandles(ticker: string): Promise<PriceCandle[]> {
  const apiKey = process.env.FINANCIAL_DATASETS_API_KEY;
  if (!apiKey) {
    throw new Error(
      'FINANCIAL_DATASETS_API_KEY is not set in your .env file.\n' +
        'Get a free key at https://financialdatasets.ai',
    );
  }

  const params = {
    ticker: ticker.toUpperCase(),
    interval: 'day' as const,
    start_date: daysAgo(LOOKBACK_DAYS),
    end_date: today(),
  };

  const { data } = await api.get('/prices/', params);
  const prices = data.prices as PriceCandle[] | undefined;
  if (!Array.isArray(prices) || prices.length === 0) {
    throw new Error(`No price data returned for ${ticker}`);
  }

  // Sort oldest → newest (API sometimes returns newest first)
  return prices.sort((a, b) => a.time.localeCompare(b.time));
}

/**
 * Scan a single ticker.
 * Fetches price data, computes indicators, and generates an alert.
 */
export async function scanTicker(ticker: string): Promise<ScanResult> {
  const upper = ticker.trim().toUpperCase();
  const scannedAt = new Date().toISOString();

  try {
    const candles = await fetchCandles(upper);
    const latestCandle = candles[candles.length - 1];
    const price = latestCandle.close;

    const indicators = computeIndicators(candles);
    const owned = isOwned(upper);
    const holding = owned ? getHolding(upper) : null;
    const alert = buildAlert(upper, price, indicators, owned, holding);

    return { ticker: upper, scannedAt, price, alert };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ticker: upper, scannedAt, price: null, alert: null, error: message };
  }
}

/**
 * Scan a list of tickers sequentially.
 * Returns results for all tickers (including errors).
 */
export async function scanAll(tickers: string[]): Promise<ScanResult[]> {
  const results: ScanResult[] = [];
  for (const ticker of tickers) {
    // Small delay between requests to be polite to the API rate limiter
    if (results.length > 0) await sleep(API_REQUEST_DELAY_MS);
    const result = await scanTicker(ticker);
    results.push(result);
  }
  return results;
}

// Small delay between API requests to be polite to the rate limiter
const API_REQUEST_DELAY_MS = 300;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
