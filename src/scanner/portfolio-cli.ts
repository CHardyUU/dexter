#!/usr/bin/env bun
/**
 * Portfolio CLI — add, remove, and view paper trading holdings.
 * SELL alerts only fire for stocks in this portfolio.
 *
 * Usage:
 *   bun run portfolio                               → show holdings
 *   bun run portfolio add AAPL 10 178.50            → add 10 shares at $178.50
 *   bun run portfolio remove AAPL                   → remove holding
 */

import { loadPortfolio, addHolding, removeHolding } from './portfolio.js';

function printHelp() {
  console.log('');
  console.log('💼 Portfolio Manager (Paper Trading)');
  console.log('');
  console.log('Usage:');
  console.log('  bun run portfolio                              — Show your holdings');
  console.log('  bun run portfolio add <TICKER> <QTY> <PRICE>  — Add a holding');
  console.log('  bun run portfolio remove <TICKER>              — Remove a holding');
  console.log('');
  console.log('Examples:');
  console.log('  bun run portfolio add AAPL 10 178.50   → 10 shares of AAPL at $178.50 each');
  console.log('  bun run portfolio add NVDA 5 450.00    → 5 shares of NVDA at $450.00 each');
  console.log('  bun run portfolio remove AAPL          → Remove AAPL from your portfolio');
  console.log('');
  console.log('ℹ️  SELL alerts will ONLY fire for stocks in this portfolio.');
  console.log('');
}

function showPortfolio() {
  const portfolio = loadPortfolio();

  console.log('');
  console.log('💼 Your Paper Portfolio:');
  console.log('─'.repeat(55));

  if (portfolio.holdings.length === 0) {
    console.log('  (empty — no holdings tracked)');
    console.log('');
    console.log('  Add your paper trades with:');
    console.log('    bun run portfolio add AAPL 10 178.50');
    console.log('');
    console.log('  ℹ️  SELL alerts only fire for stocks you have here.');
  } else {
    console.log(`  ${'TICKER'.padEnd(8)} ${'SHARES'.padEnd(8)} ${'BUY PRICE'.padEnd(12)} ${'TOTAL COST'}`);
    console.log('  ' + '─'.repeat(38));

    let totalCost = 0;
    for (const h of portfolio.holdings) {
      const cost = h.quantity * h.buyPrice;
      totalCost += cost;
      console.log(
        `  ${h.ticker.padEnd(8)} ${String(h.quantity).padEnd(8)} $${h.buyPrice.toFixed(2).padEnd(11)} $${cost.toFixed(2)}`,
      );
    }

    console.log('  ' + '─'.repeat(38));
    console.log(`  ${'TOTAL'.padEnd(8)} ${' '.padEnd(8)} ${' '.padEnd(11)} $${totalCost.toFixed(2)}`);
    console.log('');
    console.log(`  Holdings: ${portfolio.holdings.length}`);
  }

  console.log('');
}

const [, , command, ticker, qtyStr, priceStr] = process.argv;

switch (command) {
  case 'add': {
    if (!ticker || !qtyStr || !priceStr) {
      console.error('❌ Usage: bun run portfolio add <TICKER> <QUANTITY> <BUY_PRICE>');
      console.error('   Example: bun run portfolio add AAPL 10 178.50');
      process.exit(1);
    }
    const qty = parseFloat(qtyStr);
    const price = parseFloat(priceStr);
    if (isNaN(qty) || qty <= 0) {
      console.error('❌ Quantity must be a positive number');
      process.exit(1);
    }
    if (isNaN(price) || price <= 0) {
      console.error('❌ Price must be a positive number');
      process.exit(1);
    }
    const result = addHolding(ticker, qty, price);
    console.log(result.message);
    break;
  }

  case 'remove':
  case 'rm': {
    if (!ticker) {
      console.error('❌ Please provide a ticker symbol. Example: bun run portfolio remove AAPL');
      process.exit(1);
    }
    const result = removeHolding(ticker);
    console.log(result.message);
    break;
  }

  case 'list':
  case undefined:
    showPortfolio();
    break;

  case 'help':
  case '--help':
  case '-h':
    printHelp();
    break;

  default:
    printHelp();
    showPortfolio();
}
