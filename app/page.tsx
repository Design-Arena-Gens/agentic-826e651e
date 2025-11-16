"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CandlestickChart } from "@/app/components/CandlestickChart";
import { PatternList } from "@/app/components/PatternList";
import { parseCsvTextToCandles, Candle } from "@/utils/csv";
import { analyzePatterns } from "@/utils/patterns";

export default function HomePage() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [symbol, setSymbol] = useState<string>("SAMPLE");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Load sample data on first render
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/sample-data.csv");
        const text = await res.text();
        const parsed = parseCsvTextToCandles(text);
        setCandles(parsed);
      } catch (e) {
        setError("Failed to load sample data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const onFile = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const text = await file.text();
      const parsed = parseCsvTextToCandles(text);
      setCandles(parsed);
      setSymbol(file.name.replace(/\.[^.]+$/, '').toUpperCase());
    } catch (e) {
      setError("Failed to parse CSV. Expected columns: date,open,high,low,close,volume");
    } finally {
      setLoading(false);
    }
  }, []);

  const patterns = useMemo(() => analyzePatterns(candles), [candles]);

  return (
    <div className="section">
      <div className="card">
        <div className="row">
          <div className="label">Symbol</div>
          <input className="input" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
          <span className="badge">{candles.length} candles</span>
        </div>
        <div className="row">
          <input
            className="input"
            type="file"
            accept=".csv"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          <button className="button secondary" onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch("/sample-data.csv");
              const text = await res.text();
              const parsed = parseCsvTextToCandles(text);
              setCandles(parsed);
              setSymbol("SAMPLE");
            } catch (e) {
              setError("Failed to reload sample data");
            } finally {
              setLoading(false);
            }
          }}>Load sample</button>
        </div>
        {error && <div className="hint" style={{color: '#b91c1c'}}>{error}</div>}
      </div>

      <div className="grid">
        <div className="card">
          <CandlestickChart symbol={symbol} candles={candles} loading={loading} />
        </div>
        <div className="card">
          <PatternList items={patterns} />
        </div>
      </div>

      <div className="hint">CSV format required: date,open,high,low,close,volume ? date can be YYYY-MM-DD or ISO 8601</div>
    </div>
  );
}
