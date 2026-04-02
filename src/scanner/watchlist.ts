// Manages the user's watchlist stored at .dexter/watchlist.json
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Watchlist } from './types.js';

const DEXTER_DIR = '.dexter';
const WATCHLIST_PATH = join(DEXTER_DIR, 'watchlist.json');

// Default tickers shown when no watchlist file exists yet
const DEFAULT_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'];

/** Load the watchlist from disk, or return the defaults if missing */
export function loadWatchlist(): Watchlist {
  if (!existsSync(WATCHLIST_PATH)) {
    return { tickers: [...DEFAULT_TICKERS] };
  }
  try {
    const raw = readFileSync(WATCHLIST_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Watchlist;
    if (!Array.isArray(parsed.tickers)) {
      return { tickers: [...DEFAULT_TICKERS] };
    }
    return parsed;
  } catch {
    return { tickers: [...DEFAULT_TICKERS] };
  }
}

/** Save the watchlist to disk */
export function saveWatchlist(watchlist: Watchlist): void {
  if (!existsSync(DEXTER_DIR)) {
    mkdirSync(DEXTER_DIR, { recursive: true });
  }
  writeFileSync(WATCHLIST_PATH, JSON.stringify(watchlist, null, 2), 'utf-8');
}

/** Add a ticker (case-insensitive, stored uppercase). Returns true if added. */
export function addTicker(ticker: string): boolean {
  const upper = ticker.trim().toUpperCase();
  const watchlist = loadWatchlist();
  if (watchlist.tickers.includes(upper)) return false;
  watchlist.tickers.push(upper);
  saveWatchlist(watchlist);
  return true;
}

/** Remove a ticker. Returns true if removed. */
export function removeTicker(ticker: string): boolean {
  const upper = ticker.trim().toUpperCase();
  const watchlist = loadWatchlist();
  const idx = watchlist.tickers.indexOf(upper);
  if (idx === -1) return false;
  watchlist.tickers.splice(idx, 1);
  saveWatchlist(watchlist);
  return true;
}

/** List all tickers on the watchlist */
export function listTickers(): string[] {
  return loadWatchlist().tickers;
}
