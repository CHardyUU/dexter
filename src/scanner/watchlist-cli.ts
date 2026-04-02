#!/usr/bin/env bun
// watchlist-cli.ts — Manage your stock watchlist from the command line.
// Usage:
//   bun run watchlist list
//   bun run watchlist add AAPL
//   bun run watchlist remove AAPL
import { addTicker, removeTicker, listTickers } from './watchlist.js';

const [,, command, ticker] = process.argv;

function printHelp() {
  console.log(`
Dexter Watchlist Manager
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Commands:
  bun run watchlist list            — Show all tickers on your watchlist
  bun run watchlist add <TICKER>    — Add a ticker (e.g., AAPL)
  bun run watchlist remove <TICKER> — Remove a ticker

Examples:
  bun run watchlist add TSLA
  bun run watchlist remove AMZN
  bun run watchlist list
`);
}

switch (command) {
  case 'list': {
    const tickers = listTickers();
    if (tickers.length === 0) {
      console.log('Your watchlist is empty. Add tickers with: bun run watchlist add AAPL');
    } else {
      console.log(`\n📋 Your Watchlist (${tickers.length} ticker${tickers.length !== 1 ? 's' : ''}):`);
      tickers.forEach((t) => console.log(`   • ${t}`));
      console.log('');
    }
    break;
  }

  case 'add': {
    if (!ticker) {
      console.error('Error: Please provide a ticker. Example: bun run watchlist add AAPL');
      process.exit(1);
    }
    const added = addTicker(ticker);
    if (added) {
      console.log(`✅ Added ${ticker.toUpperCase()} to your watchlist.`);
    } else {
      console.log(`⚠️  ${ticker.toUpperCase()} is already on your watchlist.`);
    }
    break;
  }

  case 'remove': {
    if (!ticker) {
      console.error('Error: Please provide a ticker. Example: bun run watchlist remove AAPL');
      process.exit(1);
    }
    const removed = removeTicker(ticker);
    if (removed) {
      console.log(`✅ Removed ${ticker.toUpperCase()} from your watchlist.`);
    } else {
      console.log(`⚠️  ${ticker.toUpperCase()} was not found on your watchlist.`);
    }
    break;
  }

  default: {
    printHelp();
    break;
  }
}
