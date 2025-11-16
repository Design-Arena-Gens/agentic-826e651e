import type { Candle } from "./types";
export type { Candle } from "./types";

function toNumber(value: string): number {
  const n = Number(value);
  if (!isFinite(n)) throw new Error(`Invalid number: ${value}`);
  return n;
}

export function parseCsvTextToCandles(csv: string): Candle[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const idx = {
    date: header.indexOf('date'),
    open: header.indexOf('open'),
    high: header.indexOf('high'),
    low: header.indexOf('low'),
    close: header.indexOf('close'),
    volume: header.indexOf('volume'),
  };
  if (idx.date < 0 || idx.open < 0 || idx.high < 0 || idx.low < 0 || idx.close < 0) {
    throw new Error('Missing required headers');
  }

  const rows: Candle[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    if (parts.length < 5) continue;
    const dateRaw = parts[idx.date]?.trim();
    const date = new Date(dateRaw).toISOString();
    rows.push({
      date,
      open: toNumber(parts[idx.open]),
      high: toNumber(parts[idx.high]),
      low: toNumber(parts[idx.low]),
      close: toNumber(parts[idx.close]),
      volume: idx.volume >= 0 ? Number(parts[idx.volume]) : undefined,
    });
  }

  // Sort by date ascending just in case
  rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return rows;
}
