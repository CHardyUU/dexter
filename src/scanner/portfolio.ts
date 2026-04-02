// Manages the user's paper portfolio stored at .dexter/portfolio.json
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Portfolio, Holding } from './types.js';

const DEXTER_DIR = '.dexter';
const PORTFOLIO_PATH = join(DEXTER_DIR, 'portfolio.json');

/** Load portfolio from disk, or return empty portfolio if missing */
export function loadPortfolio(): Portfolio {
  if (!existsSync(PORTFOLIO_PATH)) {
    return { holdings: [] };
  }
  try {
    const raw = readFileSync(PORTFOLIO_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as Portfolio;
    if (!Array.isArray(parsed.holdings)) {
      return { holdings: [] };
    }
    return parsed;
  } catch {
    return { holdings: [] };
  }
}

/** Save portfolio to disk */
export function savePortfolio(portfolio: Portfolio): void {
  if (!existsSync(DEXTER_DIR)) {
    mkdirSync(DEXTER_DIR, { recursive: true });
  }
  writeFileSync(PORTFOLIO_PATH, JSON.stringify(portfolio, null, 2), 'utf-8');
}

/**
 * Add or update a holding.
 * If the ticker already exists, updates qty and averageCost.
 */
export function addHolding(ticker: string, qty: number, averageCost: number): void {
  const upper = ticker.trim().toUpperCase();
  const portfolio = loadPortfolio();
  const existing = portfolio.holdings.find((h) => h.ticker === upper);
  if (existing) {
    // Update average cost using weighted average
    const totalShares = existing.qty + qty;
    const totalCost = existing.qty * existing.averageCost + qty * averageCost;
    existing.qty = totalShares;
    existing.averageCost = totalCost / totalShares;
  } else {
    portfolio.holdings.push({ ticker: upper, qty, averageCost });
  }
  savePortfolio(portfolio);
}

/** Remove a holding. Returns true if removed. */
export function removeHolding(ticker: string): boolean {
  const upper = ticker.trim().toUpperCase();
  const portfolio = loadPortfolio();
  const idx = portfolio.holdings.findIndex((h) => h.ticker === upper);
  if (idx === -1) return false;
  portfolio.holdings.splice(idx, 1);
  savePortfolio(portfolio);
  return true;
}

/** List all holdings */
export function listHoldings(): Holding[] {
  return loadPortfolio().holdings;
}

/** Check if a ticker is in the portfolio */
export function isOwned(ticker: string): boolean {
  const upper = ticker.trim().toUpperCase();
  return loadPortfolio().holdings.some((h) => h.ticker === upper);
}

/** Get a specific holding by ticker (or null) */
export function getHolding(ticker: string): Holding | null {
  const upper = ticker.trim().toUpperCase();
  return loadPortfolio().holdings.find((h) => h.ticker === upper) ?? null;
}
