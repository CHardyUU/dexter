#!/usr/bin/env bun
/**
 * Continuous monitoring — scans the watchlist on a regular interval.
 * Usage: bun run scan:watch
 * Default interval: 60 minutes (configurable via SCAN_INTERVAL_MINUTES env var)
 */

import 'dotenv/config';
import { loadWatchlist } from './watchlist.js';
import { runScan } from './scanner.js';

const INTERVAL_MINUTES = parseInt(process.env.SCAN_INTERVAL_MINUTES ?? '60', 10);
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

function printHeader() {
  console.log('');
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║   📡 DEXTER CONTINUOUS SCANNER               ║');
  console.log('║   📋 PAPER MODE — No real trades             ║');
  console.log(`║   ⏱  Scanning every ${String(INTERVAL_MINUTES).padEnd(3)} minutes             ║`);
  console.log('║   Press Ctrl+C to stop                       ║');
  console.log('╚══════════════════════════════════════════════╝');
  console.log('');
}

async function runOnce() {
  const watchlist = loadWatchlist();

  if (watchlist.tickers.length === 0) {
    console.log('Your watchlist is empty. Add tickers with: bun run watchlist add AAPL');
    return;
  }

  console.log(`📋 Watching: ${watchlist.tickers.join(', ')}`);

  const { alerts } = await runScan(watchlist.tickers);

  if (alerts.length === 0) {
    console.log('\n✅ No actionable alerts. Market looks calm.\n');
  } else {
    console.log(`\n\n🔔 ${alerts.length} alert${alerts.length > 1 ? 's' : ''} fired:\n`);
    for (const alert of alerts) {
      console.log(alert.text);
      console.log('');
    }
  }

  console.log(`Next scan in ${INTERVAL_MINUTES} minutes... (${new Date(Date.now() + INTERVAL_MS).toLocaleTimeString()})`);
}

async function main() {
  printHeader();

  // Run immediately on startup
  await runOnce();

  // Then repeat on the interval
  setInterval(async () => {
    console.log('\n' + '─'.repeat(50));
    console.log(`🔄 Running scheduled scan at ${new Date().toLocaleString()}`);
    await runOnce();
  }, INTERVAL_MS);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
