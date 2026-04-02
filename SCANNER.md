# 📡 Dexter Auto-Scanner — Complete Guide

> **📋 PAPER MODE** — All alerts are for learning and practice only. No real money is involved.

---

## Table of Contents

1. [What Is This?](#what-is-this)
2. [Quick Start](#quick-start)
3. [Setup Guide](#setup-guide)
4. [Your Watchlist](#your-watchlist)
5. [Your Portfolio (For Sell Alerts)](#your-portfolio-for-sell-alerts)
6. [Running Scans](#running-scans)
7. [Understanding Your Alerts](#understanding-your-alerts)
8. [Beginner Glossary](#beginner-glossary)
9. [FAQ](#faq)

---

## What Is This?

The Dexter Auto-Scanner watches a list of stocks for you and tells you:

- 🟢 **BUY** — "This stock looks undervalued. Here's exactly what to do."
- 🔴 **SELL** — "This stock you own looks overpriced. Consider selling."
- 🟡 **WATCH** — "Interesting, but not quite ready yet."

It does this by analyzing 8 technical indicators and combining them with a voting system. When enough indicators agree, it fires an alert.

**Everything is in PAPER MODE.** You are practicing with pretend money to learn how this works before risking real money.

---

## Quick Start

```bash
# 1. Make sure your .env has your Financial Datasets API key
echo "FINANCIAL_DATASETS_API_KEY=your_key_here" >> .env

# 2. Run a scan of your default watchlist (AAPL, NVDA, MSFT, GOOGL, AMZN)
bun run scan

# 3. See your watchlist
bun run watchlist

# 4. Add a stock you "own" (for sell alerts)
bun run portfolio add AAPL 10 178.50
```

---

## Setup Guide

### Step 1: Get Your API Key

The scanner uses the [Financial Datasets API](https://financialdatasets.ai) to fetch stock price data.

1. Go to [financialdatasets.ai](https://financialdatasets.ai)
2. Sign up for a free account
3. Copy your API key

> **Free tier note:** The free plan gives you access to AAPL, NVDA, and MSFT. Upgrade for more tickers.

### Step 2: Add Your API Key

Open (or create) the `.env` file in your project folder:

```
FINANCIAL_DATASETS_API_KEY=your_key_here
```

### Step 3: Install Dependencies

```bash
bun install
```

### Step 4: Run Your First Scan

```bash
bun run scan
```

You'll see output like:

```
🔍 Scanning 5 tickers...

  → AAPL... 🟡 WATCH (Moderate) — 3↑ 3↓
  → NVDA... 🟢 BUY (High) — 6↑ 1↓
  → MSFT... ⚪ HOLD — 2↑ 4↓ 2 neutral
  ...

🔔 1 alert found:
[full alert details for NVDA printed here]
```

---

## Your Watchlist

The watchlist is stored in `.dexter/watchlist.json`. You start with 5 default tickers.

### Commands

```bash
bun run watchlist                  # Show your current watchlist
bun run watchlist add TSLA         # Add Tesla
bun run watchlist add AMD          # Add AMD
bun run watchlist remove AMZN      # Remove Amazon
```

### Default Watchlist

```
AAPL, NVDA, MSFT, GOOGL, AMZN
```

---

## Your Portfolio (For Sell Alerts)

> **Important:** The scanner will ONLY send SELL alerts for stocks in your portfolio. This prevents noise from alerting you to sell things you don't own.

The portfolio is stored in `.dexter/portfolio.json`. It tracks:
- **Ticker** — the stock symbol
- **Quantity** — how many shares
- **Buy Price** — what you paid per share (used to show your profit/loss)

### Commands

```bash
bun run portfolio                              # View your holdings
bun run portfolio add AAPL 10 178.50          # 10 shares bought at $178.50 each
bun run portfolio add NVDA 5 450.00           # 5 shares bought at $450.00 each
bun run portfolio remove AAPL                 # Remove AAPL from your portfolio
```

### Example Portfolio

```
💼 Your Paper Portfolio:
TICKER   SHARES   BUY PRICE    TOTAL COST
AAPL     10       $178.50      $1,785.00
NVDA     5        $450.00      $2,250.00
────────────────────────────────────────
TOTAL                          $4,035.00
```

---

## Running Scans

### Single Scan

```bash
bun run scan
```

Scans all tickers in your watchlist once and shows you the results.

### Continuous Scanning

```bash
bun run scan:watch
```

Scans your watchlist every hour (by default) and prints new alerts.

To change the interval, set `SCAN_INTERVAL_MINUTES` in your `.env`:

```
SCAN_INTERVAL_MINUTES=30   # Scan every 30 minutes
```

### Scan History

Every scan is automatically saved to `.dexter/scans/` as a JSON file. You can review past scans to see what signals were generated and whether they were correct.

---

## Understanding Your Alerts

### 🟢 BUY Alert

A BUY alert fires when 55% or more of the indicators are bullish (pointing up). Here's what each section means:

```
🟢 BUY ALERT — NVDA
   Price: $438.20  |  Confidence: High  |  6/8 signals bullish
📋 PAPER MODE — This is for learning/testing only. No real money involved.
```

**ACTION: BUY NVDA**

```
📝 WHAT THIS MEANS:
  Multiple indicators suggest NVDA may be undervalued right now.
  This could be a good time to buy — but always use a stop loss.
```

This is a plain-English summary of what the analysis shows.

```
📊 WHY WE THINK THIS:
  🟢 RSI(14): RSI is 27.3 — below 30 means "oversold"...
  🟢 MACD: just crossed ABOVE its signal line...
  🟢 Bollinger Bands: Price is AT or BELOW the lower band...
```

Each indicator that voted bullish is listed with a simple explanation.

```
💰 IF YOU DECIDE TO BUY:
  • Entry price (buy now at market): $438.20
  • Better deal (limit order): $433.82
```

A **market order** buys at the current price immediately.
A **limit order** says "only buy if it drops to $433.82" — you might get a better deal, or the order might not fill if the price goes up.

```
🎯 WHEN TO SELL (set these the moment you buy!):
  • Target 1 — Sell HALF your shares at: $451.00  (+2.9%)
  • Target 2 — Sell the REST at: $475.00  (+8.4%)
  🛑 STOP LOSS — SELL EVERYTHING if price drops to: $421.00  (-3.9%)
```

- **Target 1** is where you take some profit safely
- **Target 2** is your bigger profit goal
- **Stop Loss** is your emergency exit — if the stock falls this far, you sell to stop further losses

```
📏 HOW MUCH TO BUY:
  • $500 account: ~1 share
  • $1,000 account: ~2 shares
  ℹ️  The 5% rule: never risk more than 5% of your account on one trade
```

---

### 🔴 SELL Alert

A SELL alert fires when 55% or more of indicators are bearish AND you have the stock in your portfolio.

```
🔴 SELL ALERT — AAPL
   Price: $195.40  |  Confidence: High  |  6/8 signals bearish

📦 YOUR POSITION:
  • You bought at: $178.50
  • Current price: $195.40
  • Current P&L:   +$16.90 profit (+9.5%)
  • Shares held:   10
```

The alert shows exactly how much profit/loss you're sitting on right now.

```
💡 WHAT TO DO:
  Option A: SELL ALL at $195.40 (take all profits)
  Option B: Sell HALF now, keep the other half
  Option C: Set a stop-loss at $185.00 to protect gains
```

Three options with no jargon — pick what feels right to you.

---

### 🟡 WATCH Alert

A WATCH alert fires when signals are mixed — not yet a buy or sell, but worth monitoring.

```
🟡 WATCH ALERT — MSFT
   Price: $380.20  |  3 bullish / 2 bearish / 3 neutral

👀 KEEP AN EYE ON: MSFT
  It's beginning to look undervalued — watch for more indicators to confirm before buying.
```

No action needed — just be aware.

---

## Beginner Glossary

### RSI (Relative Strength Index)
A number between 0 and 100 that measures how fast a stock has been moving.
- **Below 30** = "Oversold" → the stock has been falling fast and might bounce back (like a rubber band stretched too far)
- **Above 70** = "Overbought" → the stock has been rising fast and might start falling
- **Between 30-70** = Normal range, no signal

### MACD (Moving Average Convergence Divergence)
A way to measure momentum. Imagine two trains — one fast and one slow. When the fast one overtakes the slow one, that's a bullish crossover (momentum is increasing). When the fast one falls behind, that's bearish.

### Bollinger Bands
Three lines drawn around a stock's price:
- **Upper band** = "Unusually expensive" territory
- **Middle band** = The 20-day average price (SMA20)
- **Lower band** = "Unusually cheap" territory

When price touches the lower band, it's like an item going on sale — it might bounce back up.

### SMA (Simple Moving Average)
The average price over the last N days. SMA(20) = average of the last 20 days.
- Price above SMA = stock is trending up
- Price below SMA = stock is trending down

### EMA (Exponential Moving Average)
Same as SMA, but more recent prices count more. Responds faster to recent changes.

### ATR (Average True Range)
The average amount a stock moves in a day. Used to set stop-losses:
- Stop loss = entry price - 1.5 × ATR
- This gives the stock "room to breathe" without getting shaken out by normal daily movement

### Stochastic Oscillator
Similar to RSI — measures where the current price is relative to its recent high/low range.
- **Below 20** = Oversold
- **Above 80** = Overbought

### VWAP (Volume Weighted Average Price)
The average price adjusted by how much trading volume happened at each price level. It's like the "true fair value" price.
- Price above VWAP = bullish
- Price below VWAP = bearish

### Stop Loss
An automatic sell order you set below your purchase price. If the stock falls to that level, it automatically sells — limiting how much money you can lose.

**Example:** You buy AAPL at $180. You set a stop loss at $170. If AAPL falls to $170, it sells automatically. You lose $10/share, but you're protected from a bigger loss.

### Limit Order
An order to buy (or sell) only at a specific price or better.

**Example:** AAPL is at $180. You set a limit buy at $175. The order only fills if the price drops to $175. If the price goes up, your order doesn't fill.

### Market Order
An order to buy (or sell) immediately at whatever the current price is.

### Paper Trading
Practicing with fake/pretend money. All the analysis is real, but no actual cash changes hands. Great way to learn before risking real money.

### Confidence Level
How many indicators agreed on the signal:
- **High** = 75%+ of indicators agree (strong signal)
- **Moderate** = 55-74% agree (decent signal)
- **Low** = Mixed signals (treat with skepticism)

### Oversold / Overbought
- **Oversold** = A stock has been falling so much that it may be due for a bounce (bargain territory)
- **Overbought** = A stock has been rising so much that it may be due for a pullback (overpriced territory)

---

## FAQ

### Do I need real money to use this?

No. The scanner runs in **PAPER MODE** by default. It tells you what it would recommend, but you don't have to do anything. Think of it as a practice tool.

### Why is FINANCIAL_DATASETS_API_KEY needed?

The scanner fetches real stock price history from the Financial Datasets API to calculate the indicators. Without it, there's no data to analyze.

The free tier covers: AAPL, NVDA, MSFT. Sign up at [financialdatasets.ai](https://financialdatasets.ai).

### I got a WATCH alert — should I do anything?

Not necessarily. A WATCH alert means "this is getting interesting but not quite there." It's informational. Check back on the next scan.

### Why am I only getting WATCH alerts and no BUY alerts?

BUY signals require 55%+ of indicators to be bullish. If the market is calm or stocks are in a neutral zone, you'll mostly see WATCH and HOLD. This is normal.

### Why don't I get SELL alerts for all my watchlist tickers?

By design — SELL alerts only fire for stocks you have in your portfolio (`.dexter/portfolio.json`). This prevents alerting you to sell things you don't own.

To get SELL alerts for a stock, add it to your portfolio:
```bash
bun run portfolio add AAPL 10 178.50
```

### What does "confidence" mean?

- **High confidence** = 75%+ of indicators agree. Stronger signal.
- **Moderate confidence** = 55-74% agree. Decent signal, worth considering.
- **Low confidence** = Mixed signals. Treat with skepticism.

### Can I add more stocks to my watchlist?

Yes. The default is AAPL, NVDA, MSFT, GOOGL, AMZN, but you can add any ticker the Financial Datasets API supports:
```bash
bun run watchlist add TSLA
bun run watchlist add AMD
```

### How is this different from the main Dexter agent?

The main Dexter agent is a conversational AI you can ask financial questions. The scanner is an automated background process that proactively monitors your watchlist and pushes alerts to you — no questions needed.

### Is this financial advice?

**No.** This is a computer analysis tool based on mathematical indicators. Indicators can and do fail. The market can do unexpected things. Always do your own research. Never invest money you cannot afford to lose completely.

### Can I connect this to Alpaca to auto-trade?

Not currently. The scanner is intentionally PAPER MODE only — it gives recommendations, you decide whether to act. Future integration with PR #130's Alpaca trading tools would be a separate feature.

---

*Built with Dexter · Financial Datasets API · technicalindicators · Paper Mode Only*
