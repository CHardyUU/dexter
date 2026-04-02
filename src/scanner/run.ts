#!/usr/bin/env bun
// run.ts — One-shot scanner: scans all tickers on the watchlist and prints alerts.
// Usage: bun run scan
import { config } from 'dotenv';
import { loadWatchlist } from './watchlist.js';
import { scanAll } from './scanner.js';
import { saveScanResults } from './history.js';

config({ quiet: true });

async function main() {
  const watchlist = loadWatchlist();
  const tickers = watchlist.tickers;

  if (tickers.length === 0) {
    console.log('Your watchlist is empty. Add tickers with: bun run watchlist add AAPL');
    process.exit(0);
  }

  console.log(`\n🔍 Dexter Scanner — scanning ${tickers.length} ticker(s): ${tickers.join(', ')}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  const results = await scanAll(tickers);

  // Print alerts
  for (const result of results) {
    if (result.error) {
      console.error(`❌ ${result.ticker}: ${result.error}\n`);
    } else if (result.alert) {
      console.log(result.alert.formattedMessage);
      console.log('');
    }
  }

  // Save to .dexter/scans/
  const saved = saveScanResults(results);
  console.log(`\n💾 Scan results saved to: ${saved}`);

  // Summary
  const buyCount = results.filter((r) => r.alert?.action === 'BUY').length;
  const sellCount = results.filter((r) => r.alert?.action === 'SELL').length;
  const watchCount = results.filter((r) => r.alert?.action === 'WATCH').length;
  const errCount = results.filter((r) => r.error).length;

  console.log(`\n📊 Scan Summary:`);
  console.log(`   🟢 BUY signals  : ${buyCount}`);
  console.log(`   🔴 SELL signals : ${sellCount}`);
  console.log(`   👀 WATCH        : ${watchCount}`);
  if (errCount > 0) console.log(`   ❌ Errors       : ${errCount}`);
  console.log('');
}

main().catch((err) => {
  console.error('Scanner error:', err instanceof Error ? err.message : err);
  process.exit(1);
});
