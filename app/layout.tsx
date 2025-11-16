import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
  title: 'Candlestick Expert System',
  description: 'Analyze OHLC data with candlestick pattern rules',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="container">
          <header className="header">
            <h1>Candlestick Expert System</h1>
          </header>
          <main className="main">{children}</main>
          <footer className="footer">Built for rapid insights on OHLC data</footer>
        </div>
      </body>
    </html>
  );
}
