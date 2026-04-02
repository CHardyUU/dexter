# 📊 Dexter Scanner — Beginner's Guide

The Dexter Scanner automatically watches a list of stocks, runs technical analysis, and gives you plain-English alerts telling you what to do — and why.

> 📋 **PAPER MODE**: All alerts are for simulated (paper) trading only. No real money is involved.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Commands](#commands)
3. [How the Watchlist Works](#how-the-watchlist-works)
4. [How the Portfolio Works](#how-the-portfolio-works)
5. [How to Read Alerts](#how-to-read-alerts)
6. [Glossary](#glossary)

---

## 🚀 Quick Start

### 1. Install dependencies

```bash
bun install
```

### 2. Set up your API key

You need a **Financial Datasets API key** to fetch stock price data.

Get a free key at [financialdatasets.ai](https://financialdatasets.ai) (free tier includes AAPL, NVDA, MSFT).

Add it to your `.env` file:

```
FINANCIAL_DATASETS_API_KEY=your-key-here
```

### 3. Run your first scan

```bash
bun run scan
```

This scans the default watchlist (AAPL, NVDA, MSFT, GOOGL, AMZN) and prints alerts.

---

## 🛠️ Commands

| Command | What it does |
|---------|-------------|
| `bun run scan` | Scan all watchlist tickers once and print alerts |
| `bun run scan:watch` | Scan every hour, print only BUY/SELL signals |
| `bun run watchlist list` | Show tickers on your watchlist |
| `bun run watchlist add AAPL` | Add a ticker to your watchlist |
| `bun run watchlist remove AAPL` | Remove a ticker from your watchlist |
| `bun run portfolio list` | Show your paper holdings |
| `bun run portfolio add AAPL 10 178.50` | Add 10 shares of AAPL at $178.50 avg cost |
| `bun run portfolio remove AAPL` | Remove a holding from your portfolio |

### Change scan interval

By default `bun run scan:watch` scans every 60 minutes. Override with:

```bash
SCAN_INTERVAL_MINUTES=30 bun run scan:watch
```

---

## 📋 How the Watchlist Works

The watchlist is the list of stocks the scanner will monitor.

- Stored at `.dexter/watchlist.json`
- Default tickers: **AAPL, NVDA, MSFT, GOOGL, AMZN**
- You can add any US stock ticker

```bash
# Add a stock
bun run watchlist add TSLA

# Remove a stock
bun run watchlist remove AMZN

# See your full list
bun run watchlist list
```

**BUY alerts** and **WATCH alerts** are generated for any ticker on the watchlist.

---

## 💼 How the Portfolio Works

The portfolio tracks your **paper (simulated) holdings** — the stocks you've "bought" in your imagination.

> ⚠️ **Important**: SELL alerts are ONLY generated for stocks in your portfolio. If you don't add a stock here, you'll never get a sell alert for it.

- Stored at `.dexter/portfolio.json`
- Format: ticker, number of shares, average purchase price

```bash
# You "bought" 10 shares of AAPL at $178.50
bun run portfolio add AAPL 10 178.50

# You "bought" 5 shares of NVDA at $450.00
bun run portfolio add NVDA 5 450.00

# See your holdings
bun run portfolio list

# Remove a position (e.g., you "sold" it)
bun run portfolio remove AAPL
```

---

## 📬 How to Read Alerts

### 🟢 BUY Alert

A BUY alert means indicators suggest the stock might be undervalued right now.

```
📋 PAPER MODE — This is simulated analysis only.

🟢 AAPL — BUY SIGNAL (HIGH confidence)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ACTION: BUY

📝 WHAT THIS MEANS:
   Multiple indicators suggest AAPL may be undervalued right now.

📊 WHY WE THINK THIS (5/8 indicators agree):
   ✓ RSI is 27.3 (below 30 = oversold — price may bounce back up)
   ✓ MACD histogram is positive — short-term momentum is trending up
   ...

💰 IF YOU DECIDE TO BUY:
   Current price:  $178.50
   Suggested entry: $177.61 (set a LIMIT ORDER here)

🎯 WHEN TO SELL:
   Target 1 (sell HALF your shares): $185.00 (+4.2%)
   Target 2 (sell REST of your shares): $192.00 (+8.1%)

🛑 STOP-LOSS (YOUR EMERGENCY EXIT):
   Stop-loss: $171.00 (-3.7%)
   → If the price drops here, SELL EVERYTHING immediately.

📏 HOW MUCH TO BUY:
   $500 account  → ~2 shares (~$355.22)
   $1000 account → ~5 shares (~$888.05)
   📌 RULE: Never put more than 5% of your total savings in one trade.
```

**What to do step by step:**
1. Set a **limit order** at the suggested entry price (not a market order — be patient)
2. Set a **stop-loss** at the stop-loss price immediately after buying
3. Plan to sell half at Target 1, and the rest at Target 2

### 🔴 SELL Alert

A SELL alert only fires for stocks in your portfolio when they look overbought or breaking down.

```
📋 PAPER MODE — This is simulated analysis only.

🔴 AAPL — SELL SIGNAL (HIGH confidence)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 ACTION: SELL (you own this stock)

📦 YOUR POSITION:
   Shares owned    : 10
   Average buy cost: $178.50
   Current price   : $195.00
   Current PROFIT: +$165.00 (+9.2%)

💡 WHAT TO DO:
   Option A — Sell ALL 10 shares now (~$195.00)
   Option B — Sell HALF (5 shares) and keep the rest
   Option C — Tighten your stop-loss to $191.50
```

### 👀 WATCH Alert

A WATCH alert means the signal is mixed — no clear buy or sell. Just keep an eye on the stock.

---

## 📚 Glossary

### RSI (Relative Strength Index)
A number from 0–100 that measures whether a stock is overbought or oversold.
- **Below 30** = Oversold — the stock has dropped a lot and may bounce back (potential buy signal)
- **Above 70** = Overbought — the stock has risen a lot and may pull back (potential sell signal)
- **30–70** = Normal range — no extreme signal

### MACD (Moving Average Convergence Divergence)
Shows the momentum (speed and direction) of a stock's price movement.
- **Positive histogram** = momentum trending up (bullish)
- **Negative histogram** = momentum trending down (bearish)
- Think of it like a car's accelerator — it shows if the stock is speeding up or slowing down.

### Bollinger Bands
Three lines drawn around a stock's price: upper, middle (SMA20), and lower.
- **Price below lower band** = stock is trading below its normal range — "on sale"
- **Price above upper band** = stock is trading above its normal range — "expensive"
- Used to spot when a stock has moved too far in one direction.

### EMA (Exponential Moving Average)
Like a regular average price, but recent days count more.
- **EMA12** = 12-day average (short-term)
- **EMA26** = 26-day average (medium-term)
- When EMA12 > EMA26, the short-term trend is up (bullish).

### SMA (Simple Moving Average)
The simple average price over N days.
- **SMA20** = average price over the last 20 days
- **SMA50** = average price over the last 50 days
- Price above SMA = stock is trending above its average (generally bullish).

### ATR (Average True Range)
Measures how much the stock typically moves in one day (its volatility).
- Used to calculate stop-losses: a tighter stock gets a tighter stop, a volatile stock gets more room.
- Higher ATR = more volatile stock = wider stop-loss needed.

### Stochastic Oscillator
Compares a stock's closing price to its recent price range. Shows momentum.
- **Below 20** = oversold (potential buy)
- **Above 80** = overbought (potential sell)
- Similar to RSI but calculated differently.

### VWAP (Volume-Weighted Average Price)
The average price of a stock weighted by trading volume.
- If price > VWAP: buyers are in control today (bullish)
- If price < VWAP: sellers are in control today (bearish)

### Stop-Loss
A price level where you decide to sell if the stock drops that far, to limit your losses.
- **Always set a stop-loss** before buying a stock.
- Example: Buy at $100, set stop-loss at $95. If it drops to $95, you automatically sell and only lose $5/share instead of more.

### Limit Order
An order to buy or sell at a specific price (or better). The trade won't happen unless the stock reaches that price.
- Better than a **market order** (which buys at whatever the current price is).
- Use limit orders when the scanner suggests an entry price.

### Paper Trading
Simulated trading where you track trades in your head (or a spreadsheet) without using real money.
- It's how you practice without risk.
- All Dexter Scanner alerts are paper mode only.

---

## 📁 Files Created by the Scanner

| File | What it is |
|------|-----------|
| `.dexter/watchlist.json` | Your watchlist tickers |
| `.dexter/portfolio.json` | Your paper holdings |
| `.dexter/scans/YYYY-MM-DD-HHMMSS_scan.jsonl` | Full scan results in JSON format |

---

## ⚠️ Disclaimer

> The Dexter Scanner is a **research and educational tool**, not a financial advisor. Technical indicators are not a guarantee of future performance. Always do your own research before making any investment decisions. Never invest money you cannot afford to lose.
