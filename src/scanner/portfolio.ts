/**
 * Portfolio management — load, save, add, remove holdings.
 * Stored at .dexter/portfolio.json
 *
 * SELL alerts only fire for stocks the user has in this portfolio.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { dexterPath } from '../utils/paths.js';
import type { Portfolio, PortfolioHolding } from './types.js';

const PORTFOLIO_FILE = dexterPath('portfolio.json');

/** Load the portfolio from disk. Returns empty portfolio if none exists. */
export function loadPortfolio(): Portfolio {
  if (!existsSync(PORTFOLIO_FILE)) {
    return { holdings: [] };
  }

  try {
    const content = readFileSync(PORTFOLIO_FILE, 'utf-8');
    return JSON.parse(content) as Portfolio;
  } catch {
    return { holdings: [] };
  }
}

/** Save the portfolio to disk */
export function savePortfolio(portfolio: Portfolio): void {
  const dir = dirname(PORTFOLIO_FILE);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(PORTFOLIO_FILE, JSON.stringify(portfolio, null, 2));
}

/** Add or update a holding in the portfolio */
export function addHolding(
  ticker: string,
  quantity: number,
  buyPrice: number,
): { added: boolean; message: string } {
  const portfolio = loadPortfolio();
  const upper = ticker.trim().toUpperCase();

  // If already exists, update it
  const existing = portfolio.holdings.find((h) => h.ticker === upper);
  if (existing) {
    // Average down/up: weighted average cost basis
    const totalShares = existing.quantity + quantity;
    const totalCost = existing.quantity * existing.buyPrice + quantity * buyPrice;
    existing.quantity = totalShares;
    existing.buyPrice = totalCost / totalShares;
    existing.addedAt = new Date().toISOString();
    savePortfolio(portfolio);
    return {
      added: true,
      message: `✅ Updated ${upper}: ${totalShares} shares @ avg $${existing.buyPrice.toFixed(2)}`,
    };
  }

  const holding: PortfolioHolding = {
    ticker: upper,
    quantity,
    buyPrice,
    addedAt: new Date().toISOString(),
  };

  portfolio.holdings.push(holding);
  savePortfolio(portfolio);
  return {
    added: true,
    message: `✅ Added ${upper}: ${quantity} shares @ $${buyPrice.toFixed(2)} each`,
  };
}

/** Remove a holding from the portfolio */
export function removeHolding(ticker: string): { removed: boolean; message: string } {
  const portfolio = loadPortfolio();
  const upper = ticker.trim().toUpperCase();
  const idx = portfolio.holdings.findIndex((h) => h.ticker === upper);

  if (idx === -1) {
    return { removed: false, message: `${upper} is not in your portfolio.` };
  }

  portfolio.holdings.splice(idx, 1);
  savePortfolio(portfolio);
  return { removed: true, message: `✅ Removed ${upper} from your portfolio.` };
}

/** Check if a ticker is in the portfolio */
export function isInPortfolio(ticker: string, portfolio: Portfolio): boolean {
  return portfolio.holdings.some((h) => h.ticker === ticker.toUpperCase());
}

/** Get the holding for a specific ticker, or undefined */
export function getHolding(ticker: string, portfolio: Portfolio): PortfolioHolding | undefined {
  return portfolio.holdings.find((h) => h.ticker === ticker.toUpperCase());
}
