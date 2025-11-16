"use client";

import { useEffect, useRef } from 'react';
import type { UTCTimestamp } from 'lightweight-charts';
import type { Candle } from "@/utils/csv";

export function CandlestickChart({ symbol, candles, loading }: { symbol: string; candles: Candle[]; loading: boolean }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);

  useEffect(() => {
    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    async function init() {
      const { createChart } = await import('lightweight-charts');
      if (!containerRef.current || disposed) return;

      // Dispose previous chart
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
      }

      const chart = createChart(containerRef.current, {
        layout: { background: { color: '#ffffff' }, textColor: '#0f172a' },
        grid: { vertLines: { color: '#f1f5f9' }, horzLines: { color: '#f1f5f9' } },
        width: containerRef.current.clientWidth,
        height: 480,
        timeScale: { timeVisible: true, secondsVisible: false },
        rightPriceScale: { borderVisible: false },
      });

      const series = chart.addCandlestickSeries({
        upColor: '#16a34a', downColor: '#dc2626', borderVisible: false, wickUpColor: '#16a34a', wickDownColor: '#dc2626'
      });

      chartRef.current = chart;
      seriesRef.current = series;

      // Map candles to library format
      const data = candles.map(c => ({
        time: Math.floor(new Date(c.date).getTime() / 1000) as UTCTimestamp,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
      }));
      series.setData(data);
      chart.timeScale().fitContent();

      resizeObserver = new ResizeObserver(() => {
        if (!containerRef.current || !chartRef.current) return;
        chartRef.current.applyOptions({ width: containerRef.current.clientWidth });
      });
      resizeObserver.observe(containerRef.current);
    }

    init();

    return () => {
      disposed = true;
      if (resizeObserver && containerRef.current) resizeObserver.unobserve(containerRef.current);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
      seriesRef.current = null;
    };
  }, [symbol, candles]);

  return (
    <div>
      <div className="row" style={{marginBottom: 8}}>
        <div className="label">{symbol}</div>
        {loading && <span className="hint">Loading?</span>}
      </div>
      <div ref={containerRef} style={{width: '100%', height: 480}} />
    </div>
  );
}
