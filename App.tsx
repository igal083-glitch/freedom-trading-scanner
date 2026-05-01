import React, { useMemo, useState } from 'react';
import './style.css';

type Status = 'READY' | 'BASE' | 'HOT' | 'AVOID';

type Row = {
  symbol: string;
  price: number;
  changePct: number;
  rangePct: number;
  compression: string;
  higherLows: string;
  nearHigh: string;
  score: number;
  status: Status;
  setup: string;
  entryZone: string;
  invalidation: string;
  trigger: string;
  action: string;
};

const MOCK_LIBRARY: Record<string, Row> = {
  NVAX: makeRow('NVAX', 7.92, -0.56, 4.35, 'NO', 'NO', 'NO', 42, 'AVOID'),
  FOSL: makeRow('FOSL', 4.43, -0.23, 3.39, 'YES', 'YES', 'NO', 72, 'BASE'),
  UUUU: makeRow('UUUU', 21.64, 10.52, 8.13, 'YES', 'YES', 'NO', 61, 'HOT'),
  HNST: makeRow('HNST', 3.5, 5.74, 6.0, 'YES', 'YES', 'YES', 86, 'READY'),
  SLDB: makeRow('SLDB', 7.26, 2.98, 3.86, 'YES', 'YES', 'YES', 91, 'READY'),
  APPS: makeRow('APPS', 3.53, 4.75, 6.52, 'YES', 'YES', 'YES', 82, 'READY'),
  PLUG: makeRow('PLUG', 3.13, -8.21, 12.14, 'NO', 'NO', 'NO', 18, 'AVOID'),
  DNA: makeRow('DNA', 8.46, 12.8, 12.94, 'NO', 'YES', 'YES', 35, 'AVOID'),
};

function money(n: number) {
  return `$${n.toFixed(2)}`;
}

function makeRow(
  symbol: string,
  price: number,
  changePct: number,
  rangePct: number,
  compression: string,
  higherLows: string,
  nearHigh: string,
  score: number,
  status: Status
): Row {
  let setup = 'Avoid';
  let trigger = 'No trigger';
  let action = 'Do nothing';
  let entryLow = price * 0.97;
  let entryHigh = price * 1.01;
  let invalidation = price * 0.92;

  if (status === 'READY') {
    setup = 'Ready Base / Near Breakout';
    entryLow = price * 0.99;
    entryHigh = price * 1.02;
    invalidation = price * 0.93;
    trigger = `Break/reclaim above ${money(entryHigh)}`;
    action = 'Ready — wait for trigger';
  }

  if (status === 'BASE') {
    setup = 'Base Building';
    entryLow = price * 0.94;
    entryHigh = price * 1.01;
    invalidation = price * 0.91;
    trigger = `Reclaim range high ${money(entryHigh)}`;
    action = 'Track — not ready yet';
  }

  if (status === 'HOT') {
    setup = 'Hot / No Chase';
    entryLow = price * 0.92;
    entryHigh = price * 0.96;
    invalidation = price * 0.88;
    trigger = '1–3 day consolidation';
    action = 'No entry now';
  }

  if (status === 'AVOID') {
    setup = 'Avoid / Broken or Extended';
    trigger = 'Needs new structure';
    action = 'Stay away';
  }

  return {
    symbol,
    price,
    changePct,
    rangePct,
    compression,
    higherLows,
    nearHigh,
    score,
    status,
    setup,
    entryZone: `${money(entryLow)} - ${money(entryHigh)}`,
    invalidation: money(invalidation),
    trigger,
    action,
  };
}

function buildFallback(symbol: string): Row {
  return makeRow(symbol, 0, 0, 0, 'UNKNOWN', 'UNKNOWN', 'UNKNOWN', 0, 'AVOID');
}

export default function App() {
  const [input, setInput] = useState('NVAX,FOSL,UUUU,HNST,SLDB,APPS');
  const [rows, setRows] = useState<Row[]>([]);

  function analyzeManual() {
    const tickers = input
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    const result = tickers.map((ticker) => {
      return MOCK_LIBRARY[ticker] || buildFallback(ticker);
    });

    const rank = { READY: 4, BASE: 3, HOT: 2, AVOID: 1 };

    setRows(
      result.sort((a, b) => {
        if (rank[b.status] !== rank[a.status]) {
          return rank[b.status] - rank[a.status];
        }
        return b.score - a.score;
      })
    );
  }

  const counts = useMemo(() => {
    return {
      ready: rows.filter((r) => r.status === 'READY').length,
      base: rows.filter((r) => r.status === 'BASE').length,
      hot: rows.filter((r) => r.status === 'HOT').length,
      avoid: rows.filter((r) => r.status === 'AVOID').length,
    };
  }, [rows]);
const statusMap: any = {
const actionMap: any = {
  "Ready — wait for trigger": "מוכן — חכה לאישור",
  "Track — not ready yet": "מעקב — עדיין לא מוכן",
  "No entry now": "אין כניסה כרגע",
  "Stay away": "להתרחק",
};
  READY: "מוכן",
  BASE: "בסיס",
  HOT: "חם",
  AVOID: "להימנע",
};
  return (
    <div className="app">
      <h1>סורק המסחר Freedom V59</h1>
      <p>Manual Ticker Mode — Stable Final Version</p>

      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="NVAX,FOSL,UUUU,HNST"
      />

      <div className="controls">
        <button onClick={analyzeManual}>Analyze</button>
      </div>

      <section className="summary">
        <div className="card green">Ready: {counts.ready}</div>
        <div className="card yellow">Base: {counts.base}</div>
        <div className="card yellow">Hot: {counts.hot}</div>
        <div className="card red">Avoid: {counts.avoid}</div>
      </section>

      <table className="scanner">
        <thead>
          <tr>
            <th> מניה Ticker</th>
            <th> מחיר Price</th>
            <th>  שינוי 5 ימים 5D Change</th>
            <th> תווך Range</th>
            <th> דחיסה Compression</th>
            <th>Higher Lows</th>
            <th>Near High</th>
            <th>  ציון core</th>
            <th>Status</th>
            <th> תבנית Setup</th>
            <th>Entry Zone</th>
            <th>Invalidation</th>
            <th>Trigger</th>
            <th>Action</th>
            <th>Chart</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.symbol} className={`row-${r.status.toLowerCase()}`}>
              <td className="ticker">{r.symbol}</td>
              <td>{r.price ? money(r.price) : '-'}</td>
              <td>{r.changePct.toFixed(2)}%</td>
              <td>{r.rangePct.toFixed(2)}%</td>
              <td>{r.compression}</td>
              <td>{r.higherLows}</td>
              <td>{r.nearHigh}</td>
              <td>{r.score}</td>
              <span className={`status-badge ${r.status.toLowerCase()}`}>
 {statusMap[r.status] || r.status}
</span>
              <td>{r.setup}</td>
              <td>{r.entryZone}</td>
              <td>{r.invalidation}</td>
              <td>{r.trigger}</td>
              <td>{r.action}</td>
              <td>
                <a
                  href={`https://www.tradingview.com/chart/?symbol=${r.symbol}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
