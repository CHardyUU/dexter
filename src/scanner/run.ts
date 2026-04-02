#!/usr/bin/env bun
/**
 * Single scan entry point — run once and print results.
 * Usage: bun run scan
 */

import 'dotenv/config';
import { loadWatchlist } from './watchlist.js';
import { runScan } from './scanner.js';

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════╗');
  console.log('║   📡 DEXTER MARKET SCANNER           ║');
  console.log('║   📋 PAPER MODE — No real trades     ║');
  console.log('╚══════════════════════════════════════╝');
  console.log('');

  const watchlist = loadWatchlist();

  if (watchlist.tickers.length === 0) {
    console.log('Your watchlist is empty!');
    console.log('Add tickers with: bun run watchlist add AAPL');
    process.exit(0);
  }

  console.log(`📋 Watchlist: ${watchlist.tickers.join(', ')}`);

  const { alerts } = await runScan(watchlist.tickers);

  if (alerts.length === 0) {
    console.log('\n✅ Scan complete. No actionable alerts at this time.');
    console.log('   All stocks are in the neutral zone — nothing to buy or sell right now.');
  } else {
    console.log(`\n\n🔔 ${alerts.length} alert${alerts.length > 1 ? 's' : ''} found:\n`);
    for (const alert of alerts) {
      console.log(alert.text);
      console.log('');
    }
  }

  console.log(`\n⏰ Scan completed at ${new Date().toLocaleString()}`);
  console.log('💾 Results saved to .dexter/scans/');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
