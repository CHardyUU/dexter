/**
 * Watchlist management — load, save, add, remove tickers.
 * Stored at .dexter/watchlist.json
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { dexterPath } from '../utils/paths.js';
import type { Watchlist } from './types.js';

const WATCHLIST_FILE = dexterPath('watchlist.json');

/** Default starter tickers shown to new users */
const DEFAULT_TICKERS = ['AAPL', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'];

/** Load the watchlist from disk, creating a default one if it doesn't exist */
export function loadWatchlist(): Watchlist {
  if (!existsSync(WATCHLIST_FILE)) {
    const defaults: Watchlist = {
      tickers: DEFAULT_TICKERS,
      updatedAt: new Date().toISOString(),
    };
    saveWatchlist(defaults);
    return defaults;
  }

  try {
    const content = readFileSync(WATCHLIST_FILE, 'utf-8');
    return JSON.parse(content) as Watchlist;
  } catch {
    return { tickers: DEFAULT_TICKERS, updatedAt: new Date().toISOString() };
  }
}

/** Save the watchlist to disk */
export function saveWatchlist(watchlist: Watchlist): void {
  const dir = dirname(WATCHLIST_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(WATCHLIST_FILE, JSON.stringify(watchlist, null, 2));
}

/** Add a ticker to the watchlist (uppercased, no duplicates) */
export function addTicker(ticker: string): { added: boolean; message: string } {
  const watchlist = loadWatchlist();
  const upper = ticker.trim().toUpperCase();

  if (watchlist.tickers.includes(upper)) {
    return { added: false, message: `${upper} is already in your watchlist.` };
  }

  watchlist.tickers.push(upper);
  watchlist.updatedAt = new Date().toISOString();
  saveWatchlist(watchlist);
  return { added: true, message: `✅ Added ${upper} to your watchlist.` };
}

/** Remove a ticker from the watchlist */
export function removeTicker(ticker: string): { removed: boolean; message: string } {
  const watchlist = loadWatchlist();
  const upper = ticker.trim().toUpperCase();
  const idx = watchlist.tickers.indexOf(upper);

  if (idx === -1) {
    return { removed: false, message: `${upper} is not in your watchlist.` };
  }

  watchlist.tickers.splice(idx, 1);
  watchlist.updatedAt = new Date().toISOString();
  saveWatchlist(watchlist);
  return { removed: true, message: `✅ Removed ${upper} from your watchlist.` };
}
