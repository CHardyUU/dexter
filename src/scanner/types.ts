// Types for the Dexter auto-scanner system

/** One price candle (OHLCV) from the Financial Datasets API */
export interface PriceCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/** Computed values from technical indicators */
export interface IndicatorValues {
  rsi: number | null;
  macd: { value: number; signal: number; histogram: number } | null;
  ema12: number | null;
  ema26: number | null;
  sma20: number | null;
  sma50: number | null;
  bollingerBands: { upper: number; middle: number; lower: number } | null;
  atr: number | null;
  stochastic: { k: number; d: number } | null;
  vwap: number | null;
}

/** A single indicator's vote on the current signal */
export interface SignalVote {
  indicator: string;
  signal: 'bullish' | 'bearish' | 'neutral';
  reason: string;
}

/** The overall verdict from all indicators combined */
export interface VoteResult {
  bullish: number;
  bearish: number;
  neutral: number;
  total: number;
  confidence: 'high' | 'medium' | 'low';
  votes: SignalVote[];
}

/** What action the alert recommends */
export type AlertAction = 'BUY' | 'SELL' | 'WATCH' | 'HOLD';

/** A fully formatted alert for one ticker */
export interface Alert {
  ticker: string;
  action: AlertAction;
  confidence: 'high' | 'medium' | 'low';
  price: number;
  indicators: IndicatorValues;
  votes: SignalVote[];
  formattedMessage: string;
  timestamp: string;
}

/** A stock holding in the portfolio */
export interface Holding {
  ticker: string;
  qty: number;
  averageCost: number;
}

/** The user's paper portfolio */
export interface Portfolio {
  holdings: Holding[];
}

/** The user's watchlist */
export interface Watchlist {
  tickers: string[];
}

/** The result of scanning one ticker */
export interface ScanResult {
  ticker: string;
  scannedAt: string;
  price: number | null;
  alert: Alert | null;
  error?: string;
}
