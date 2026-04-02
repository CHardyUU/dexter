#!/usr/bin/env bun
// watch.ts — Runs the scanner on a repeating interval.
// Default interval: 1 hour. Override with SCAN_INTERVAL_MINUTES env var.
// Usage: bun run scan:watch
import { config } from 'dotenv';
import { loadWatchlist } from './watchlist.js';
import { scanAll } from './scanner.js';
import { saveScanResults } from './history.js';

config({ quiet: true });

// How many minutes between scans (default = 60)
const INTERVAL_MINUTES = parseInt(process.env.SCAN_INTERVAL_MINUTES ?? '60', 10);
const INTERVAL_MS = INTERVAL_MINUTES * 60 * 1000;

async function runScan() {
  const watchlist = loadWatchlist();
  const tickers = watchlist.tickers;

  if (tickers.length === 0) {
    console.log('Your watchlist is empty. Add tickers with: bun run watchlist add AAPL');
    return;
  }

  const now = new Date().toLocaleString();
  console.log(`\n⏰ [${now}] Running scan — ${tickers.length} ticker(s): ${tickers.join(', ')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = await scanAll(tickers);

  // Only print actionable alerts (BUY or SELL) in watch mode to reduce noise
  const actionable = results.filter((r) => r.alert?.action === 'BUY' || r.alert?.action === 'SELL');
  const errors = results.filter((r) => r.error);

  if (actionable.length === 0 && errors.length === 0) {
    console.log('   No actionable signals this scan — all tickers showing WATCH/neutral.\n');
  }

  for (const result of actionable) {
    console.log(result.alert!.formattedMessage);
    console.log('');
  }

  for (const result of errors) {
    console.error(`❌ ${result.ticker}: ${result.error}\n`);
  }

  // Save scan to history
  const saved = saveScanResults(results);
  console.log(`💾 Saved: ${saved}`);
  console.log(`⏭️  Next scan in ${INTERVAL_MINUTES} minute(s)...\n`);
}

async function main() {
  console.log(`\n🚀 Dexter Scanner — Watch Mode`);
  console.log(`   Scanning every ${INTERVAL_MINUTES} minute(s).`);
  console.log(`   Override with: SCAN_INTERVAL_MINUTES=30 bun run scan:watch`);
  console.log(`   Press Ctrl+C to stop.\n`);

  // Run immediately, then repeat on the configured interval
  await runScan();
  const intervalId = setInterval(() => {
    runScan().catch((err) => {
      console.error('Scan error:', err instanceof Error ? err.message : err);
    });
  }, INTERVAL_MS);

  // Allow clean shutdown on Ctrl+C
  process.on('SIGINT', () => {
    clearInterval(intervalId);
    console.log('\n👋 Scanner stopped.');
    process.exit(0);
  });
}

main().catch((err) => {
  console.error('Scanner error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
