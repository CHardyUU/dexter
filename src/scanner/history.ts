/**
 * Scan history logging — saves each scan run to .dexter/scans/
 * Format: YYYY-MM-DD-HHMMSS_scan.jsonl
 */

import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { dexterPath } from '../utils/paths.js';
import type { ScanHistoryEntry, ScanResult, Alert } from './types.js';

const SCANS_DIR = dexterPath('scans');

/** Ensure the scans directory exists */
function ensureScansDir(): void {
  if (!existsSync(SCANS_DIR)) {
    mkdirSync(SCANS_DIR, { recursive: true });
  }
}

/** Generate a filename for a scan run */
function scanFilename(date: Date): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  return `${y}-${mo}-${d}-${h}${mi}${s}_scan.jsonl`;
}

/** Save a scan run to history */
export function saveScanHistory(
  runId: string,
  startedAt: string,
  finishedAt: string,
  tickers: string[],
  results: ScanResult[],
  alerts: Alert[],
): void {
  ensureScansDir();

  const entry: ScanHistoryEntry = {
    runId,
    startedAt,
    finishedAt,
    tickers,
    results,
    alerts,
  };

  // Each scan is one JSON line in the file
  const filename = join(SCANS_DIR, scanFilename(new Date(startedAt)));
  writeFileSync(filename, JSON.stringify(entry) + '\n');
}

/** Load the most recent N scan history entries */
export function loadRecentScans(limit = 10): ScanHistoryEntry[] {
  if (!existsSync(SCANS_DIR)) return [];

  const files = readdirSync(SCANS_DIR)
    .filter((f) => f.endsWith('_scan.jsonl'))
    .sort()
    .reverse()
    .slice(0, limit);

  const entries: ScanHistoryEntry[] = [];
  for (const file of files) {
    try {
      const content = readFileSync(join(SCANS_DIR, file), 'utf-8');
      for (const line of content.split('\n').filter(Boolean)) {
        entries.push(JSON.parse(line) as ScanHistoryEntry);
      }
    } catch {
      // Skip corrupt files
    }
  }

  return entries;
}
