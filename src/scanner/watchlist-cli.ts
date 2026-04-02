#!/usr/bin/env bun
/**
 * Watchlist CLI — add, remove, and list tickers.
 * Usage:
 *   bun run watchlist           → show current watchlist
 *   bun run watchlist add AAPL  → add a ticker
 *   bun run watchlist remove AAPL → remove a ticker
 */

import { loadWatchlist, addTicker, removeTicker } from './watchlist.js';

function printHelp() {
  console.log('');
  console.log('📋 Watchlist Manager');
  console.log('');
  console.log('Usage:');
  console.log('  bun run watchlist                  — Show your watchlist');
  console.log('  bun run watchlist add <TICKER>     — Add a ticker');
  console.log('  bun run watchlist remove <TICKER>  — Remove a ticker');
  console.log('');
}

function showWatchlist() {
  const watchlist = loadWatchlist();

  console.log('');
  console.log('📋 Your Watchlist:');
  console.log('─'.repeat(30));

  if (watchlist.tickers.length === 0) {
    console.log('  (empty)');
    console.log('');
    console.log('  Add tickers with: bun run watchlist add AAPL');
  } else {
    for (const ticker of watchlist.tickers) {
      console.log(`  • ${ticker}`);
    }
    console.log('');
    console.log(`  Total: ${watchlist.tickers.length} ticker${watchlist.tickers.length > 1 ? 's' : ''}`);
    console.log(`  Updated: ${new Date(watchlist.updatedAt).toLocaleString()}`);
  }

  console.log('');
}

const [, , command, ticker] = process.argv;

switch (command) {
  case 'add':
    if (!ticker) {
      console.error('❌ Please provide a ticker symbol. Example: bun run watchlist add AAPL');
      process.exit(1);
    }
    const addResult = addTicker(ticker);
    console.log(addResult.message);
    break;

  case 'remove':
  case 'rm':
    if (!ticker) {
      console.error('❌ Please provide a ticker symbol. Example: bun run watchlist remove AAPL');
      process.exit(1);
    }
    const removeResult = removeTicker(ticker);
    console.log(removeResult.message);
    break;

  case 'list':
  case undefined:
    showWatchlist();
    break;

  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;

  default:
    // If no subcommand, treat as a ticker to add (convenience)
    if (command && !command.startsWith('-')) {
      console.log(`ℹ️  Tip: Use 'bun run watchlist add ${command}' to add a ticker`);
    }
    printHelp();
    showWatchlist();
}
