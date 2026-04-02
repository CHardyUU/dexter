/**
 * TypeScript interfaces for the Dexter auto-scanner and alert system.
 */

/** A single stock holding in the user's paper portfolio */
export interface PortfolioHolding {
  ticker: string;
  quantity: number;
  buyPrice: number;      // Average cost basis per share
  addedAt: string;       // ISO timestamp
}

/** The full portfolio stored in .dexter/portfolio.json */
export interface Portfolio {
  holdings: PortfolioHolding[];
  totalCash?: number;    // Optional: total account value for position sizing
}

/** The watchlist stored in .dexter/watchlist.json */
export interface Watchlist {
  tickers: string[];
  updatedAt: string;
}

/** A single OHLCV (Open/High/Low/Close/Volume) candle */
export interface OHLCVBar {
  time: string;   // ISO date string
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Computed technical indicator values for one ticker */
export interface IndicatorResult {
  ticker: string;
  price: number;        // Latest close price

  rsi: number | null;
  macd: {
    macd: number;
    signal: number;
    histogram: number;
    crossover: 'bullish' | 'bearish' | 'none';
  } | null;
  bollingerBands: {
    upper: number;
    middle: number;     // SMA20
    lower: number;
    bandwidth: number;
  } | null;
  ema12: number | null;
  ema26: number | null;
  sma20: number | null;
  sma50: number | null;
  atr: number | null;
  stochastic: {
    k: number;
    d: number;
  } | null;
  vwap: number | null;
}

/** Vote-based signal for a single indicator */
export interface IndicatorVote {
  name: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  value: string;         // Human-readable current value
  reason: string;        // Plain-English explanation
}

/** Aggregated scan result for one ticker */
export interface ScanResult {
  ticker: string;
  price: number;
  timestamp: string;   // ISO timestamp of scan

  indicators: IndicatorResult;
  votes: IndicatorVote[];
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;

  signal: 'BUY' | 'SELL' | 'WATCH' | 'HOLD';
  confidence: 'High' | 'Moderate' | 'Low';

  /** Only populated if signal is SELL and user owns the stock */
  holding?: PortfolioHolding;
}

/** A formatted alert ready to print to the terminal */
export interface Alert {
  ticker: string;
  type: 'BUY' | 'SELL' | 'WATCH';
  confidence: 'High' | 'Moderate' | 'Low';
  timestamp: string;
  text: string;   // Full formatted alert string
}

/** One full scan run saved to history */
export interface ScanHistoryEntry {
  runId: string;
  startedAt: string;
  finishedAt: string;
  tickers: string[];
  results: ScanResult[];
  alerts: Alert[];
}
