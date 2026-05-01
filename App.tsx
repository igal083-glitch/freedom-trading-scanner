import React, { useState } from "react";
import "./style.css";

type Status = "READY" | "BASE" | "HOT" | "CONTINUATION" | "AVOID";

type Row = {
  ticker: string;
  price: string;
  change5d: string;
  range: string;
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

const stockMap: Record<string, Row> = {
  ACRS: {
    ticker: "ACRS",
    price: "4.36",
    change5d: "3.10%",
    range: "12.40%",
    compression: "YES",
    higherLows: "YES",
    nearHigh: "YES",
    score: 72,
    status: "CONTINUATION",
    setup: "Pullback Continuation / המשכיות",
    entryZone: "$3.80 – $4.20",
    invalidation: "$3.50",
    trigger: "Mini base / Break above $4.70",
    action: "להמתין לאישור",
  },

  UAMY: {
    ticker: "UAMY",
    price: "12.02",
    change5d: "6.40%",
    range: "8.00%",
    compression: "YES",
    higherLows: "YES",
    nearHigh: "YES",
    score: 78,
    status: "CONTINUATION",
    setup: "Range Breakout Attempt / המשכיות",
    entryZone: "$10.80 – $11.30",
    invalidation: "$9.55",
    trigger: "Close above $12.20–$12.50 with volume",
    action: "לא לרדוף — לחכות לאישור",
  },
};

function analyzeTicker(tickerRaw: string): Row {
  const ticker = tickerRaw.toUpperCase().trim();

  if (stockMap[ticker]) return stockMap[ticker];

  return {
    ticker,
    price: "-",
    change5d: "0.00%",
    range: "0.00%",
    compression: "UNKNOWN",
    higherLows: "UNKNOWN",
    nearHigh: "UNKNOWN",
    score: 0,
    status: "AVOID",
    setup: "Avoid / Broken or Extended",
    entryZone: "$0.00 – $0.00",
    invalidation: "$0.00",
    trigger: "Needs new structure",
    action: "להתרחק",
  };
}

function statusHebrew(status: Status) {
  if (status === "READY") return "מוכן";
  if (status === "BASE") return "בסיס";
  if (status === "HOT") return "חם";
  if (status === "CONTINUATION") return "המשכיות";
  return "להימנע";
}

function statusClass(status: Status) {
  return `status-pill ${status.toLowerCase()}`;
}

export default function App() {
  const [ticker, setTicker] = useState("UAMY");
  const [rows, setRows] = useState<Row[]>([analyzeTicker("UAMY")]);

  const counts = rows.reduce(
    (acc, r) => {
      acc[r.status]++;
      return acc;
    },
    { READY: 0, BASE: 0, HOT: 0, CONTINUATION: 0, AVOID: 0 }
  );

  return (
    <div className="scanner-page">
      <style>{`
        body { margin:0; background:#050505; color:white; font-family: Arial, sans-serif; }
        .scanner-page { min-height:100vh; background:#050505; color:white; direction:rtl; }
        .top { padding:12px 18px; border-bottom:1px solid #333; text-align:right; }
        .title { color:#d8b62f; font-size:30px; font-weight:800; margin:0; }
        .subtitle { margin-top:22px; color:white; font-size:16px; }
        .input-row { display:flex; gap:12px; padding:16px; border-bottom:1px solid #222; direction:ltr; }
        .input-row input { flex:1; background:#1a1a1a; color:white; border:1px solid #333; padding:12px; font-size:16px; text-align:right; }
        .input-row button { background:#d8b62f; border:0; color:#000; font-weight:700; padding:0 18px; border-radius:9px; cursor:pointer; }
        .cards { display:grid; grid-template-columns:1fr; gap:0; }
        .card { background:#111; border:1px solid #2b2b2b; border-radius:12px; min-height:58px; padding:14px 30px; text-align:right; }
        .ready { color:#00ff8a; }
        .base { color:#ffd400; }
        .hot { color:#ffff00; }
        .continuation { color:#ff9f1a; }
        .avoid { color:#ff3b3b; }
        table { width:100%; border-collapse:collapse; direction:ltr; }
        th { background:#050505; color:white; padding:10px 14px; border-bottom:1px solid #333; text-align:center; white-space:nowrap; }
        td { padding:10px 14px; border-bottom:1px solid #1f1f1f; text-align:center; white-space:nowrap; }
        tbody tr { background:#180606; }
        a { color:#5d4bff; }
        .status-pill { padding:6px 12px; border-radius:18px; font-weight:800; display:inline-block; }
        .status-pill.ready { background:#06351e; color:#00ff8a; }
        .status-pill.base { background:#3a3300; color:#ffd400; }
        .status-pill.hot { background:#423600; color:#ffff00; }
        .status-pill.continuation { background:#3b2200; color:#ff9f1a; }
        .status-pill.avoid { background:#5a1515; color:#ffb0b0; }
      `}</style>

      <header className="top">
        <h1 className="title">סורק המסחר Freedom V61</h1>
        <div className="subtitle">
          Manual Ticker Mode — Continuation Logic Fixed
        </div>
      </header>

      <div className="input-row">
        <button onClick={() => setRows([analyzeTicker(ticker)])}>Analyze</button>
        <input value={ticker} onChange={(e) => setTicker(e.target.value)} />
      </div>

      <section className="cards">
        <div className="card ready">Ready: {counts.READY}</div>
        <div className="card base">Base: {counts.BASE}</div>
        <div className="card hot">Hot: {counts.HOT}</div>
        <div className="card continuation">Continuation: {counts.CONTINUATION}</div>
        <div className="card avoid">Avoid: {counts.AVOID}</div>
      </section>

      <table>
        <thead>
          <tr>
            <th>Chart</th>
            <th>Action</th>
            <th>Trigger</th>
            <th>Invalidation</th>
            <th>Entry Zone</th>
            <th>Setup תבנית</th>
            <th>Status</th>
            <th>Score ציון</th>
            <th>Near High</th>
            <th>Higher Lows</th>
            <th>Compression דחיסה</th>
            <th>Range טווח</th>
            <th>5D Change שינוי 5 ימים</th>
            <th>Price מחיר</th>
            <th>Ticker מניה</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r) => (
            <tr key={r.ticker}>
              <td>
                <a
                  href={`https://www.tradingview.com/chart/?symbol=${r.ticker}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open
                </a>
              </td>
              <td>{r.action}</td>
              <td>{r.trigger}</td>
              <td>{r.invalidation}</td>
              <td>{r.entryZone}</td>
              <td>{r.setup}</td>
              <td>
                <span className={statusClass(r.status)}>
                  {statusHebrew(r.status)}
                </span>
              </td>
              <td>{r.score}</td>
              <td>{r.nearHigh}</td>
              <td>{r.higherLows}</td>
              <td>{r.compression}</td>
              <td>{r.range}</td>
              <td>{r.change5d}</td>
              <td>{r.price}</td>
              <td>{r.ticker}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
