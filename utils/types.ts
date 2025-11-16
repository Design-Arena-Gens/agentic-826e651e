export type TrendDirection = 'uptrend' | 'downtrend' | 'sideways';

export interface Candle {
  date: string; // ISO string
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}
