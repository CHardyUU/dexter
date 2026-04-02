// Writes scan results to .dexter/scans/ as JSONL files.
// File names follow the pattern: YYYY-MM-DD-HHMMSS_scan.jsonl
import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import type { ScanResult } from './types.js';

const DEXTER_DIR = '.dexter';
const SCANS_DIR = join(DEXTER_DIR, 'scans');

/** Generate the JSONL file name for the current date/time */
export function buildScanFileName(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}-${hh}${min}${ss}_scan.jsonl`;
}

/**
 * Write an array of scan results to a JSONL file.
 * Each result is written as a separate JSON line.
 * Creates .dexter/scans/ if it doesn't exist.
 */
export function saveScanResults(results: ScanResult[]): string {
  if (!existsSync(SCANS_DIR)) {
    mkdirSync(SCANS_DIR, { recursive: true });
  }

  const fileName = buildScanFileName();
  const filePath = join(SCANS_DIR, fileName);

  for (const result of results) {
    const line = JSON.stringify(result) + '\n';
    appendFileSync(filePath, line, 'utf-8');
  }

  return filePath;
}
