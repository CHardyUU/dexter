#!/usr/bin/env bun
// portfolio-cli.ts — Manage your paper portfolio from the command line.
// SELL alerts are ONLY generated for tickers you've added here.
// Usage:
//   bun run portfolio list
//   bun run portfolio add AAPL 10 178.50     (ticker, qty, average cost)
//   bun run portfolio remove AAPL
import { addHolding, removeHolding, listHoldings } from './portfolio.js';

const [,, command, ticker, qtyStr, costStr] = process.argv;

function printHelp() {
  console.log(`
Dexter Portfolio Manager (Paper Trading)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 PAPER MODE — This tracks your paper (simulated) trades only.
   Sell alerts will ONLY fire for stocks listed in your portfolio.

Commands:
  bun run portfolio list                         — Show your holdings
  bun run portfolio add <TICKER> <QTY> <COST>    — Add a holding
  bun run portfolio remove <TICKER>              — Remove a holding

Arguments:
  TICKER  — Stock symbol, e.g. AAPL
  QTY     — Number of shares you "bought"
  COST    — Your average purchase price per share

Examples:
  bun run portfolio add AAPL 10 178.50   (bought 10 shares of AAPL at $178.50 each)
  bun run portfolio add NVDA 5 450.00
  bun run portfolio remove AAPL
  bun run portfolio list
`);
}

switch (command) {
  case 'list': {
    const holdings = listHoldings();
    if (holdings.length === 0) {
      console.log(`\n📋 Your paper portfolio is empty.`);
      console.log(`   Add a holding with: bun run portfolio add AAPL 10 178.50\n`);
    } else {
      console.log(`\n📋 Your Paper Portfolio (${holdings.length} position${holdings.length !== 1 ? 's' : ''}):`);
      console.log(`   ${'Ticker'.padEnd(10)} ${'Qty'.padStart(6)} ${'Avg Cost'.padStart(12)}`);
      console.log(`   ${'─'.repeat(32)}`);
      holdings.forEach((h) => {
        console.log(
          `   ${h.ticker.padEnd(10)} ${String(h.qty).padStart(6)} ${`$${h.averageCost.toFixed(2)}`.padStart(12)}`
        );
      });
      console.log('');
    }
    break;
  }

  case 'add': {
    if (!ticker) {
      console.error('Error: Please provide a ticker, qty, and cost.');
      console.error('Example: bun run portfolio add AAPL 10 178.50');
      process.exit(1);
    }
    const qty = parseFloat(qtyStr ?? '');
    const cost = parseFloat(costStr ?? '');
    if (isNaN(qty) || qty <= 0) {
      console.error(`Error: Invalid quantity "${qtyStr}". Must be a positive number.`);
      process.exit(1);
    }
    if (isNaN(cost) || cost <= 0) {
      console.error(`Error: Invalid average cost "${costStr}". Must be a positive number.`);
      process.exit(1);
    }
    addHolding(ticker, qty, cost);
    console.log(`✅ Added ${ticker.toUpperCase()}: ${qty} shares @ $${cost.toFixed(2)}`);
    console.log(`   Sell alerts will now fire for ${ticker.toUpperCase()} when overbought.`);
    break;
  }

  case 'remove': {
    if (!ticker) {
      console.error('Error: Please provide a ticker. Example: bun run portfolio remove AAPL');
      process.exit(1);
    }
    const removed = removeHolding(ticker);
    if (removed) {
      console.log(`✅ Removed ${ticker.toUpperCase()} from your portfolio.`);
    } else {
      console.log(`⚠️  ${ticker.toUpperCase()} was not found in your portfolio.`);
    }
    break;
  }

  default: {
    printHelp();
    break;
  }
}
