import React, { useMemo, useState } from "react";
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
  qualityRank: string;
  status: Status;
  setup: string;
  entryZone: string;
  invalidation: string;
  trigger: string;
  action: string;
};

function avg(arr: number[]) {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
}

function ma(arr: number[], n: number) {
  return arr.length >= n ? avg(arr.slice(-n)) : 0;
}

function pct(a: number, b: number) {
  return b ? ((a - b) / b) * 100 : 0;
}

async function fetchYahoo(symbol: string) {
  const res = await fetch(`/api/data?symbol=${symbol}`);
  if (!res.ok) throw new Error("API failed");
  return res.json();
}

function fallback(symbol: string): Row {
  return {
    ticker: symbol,
    price: "-",
    change5d: "0.00%",
    range: "0.00%",
    compression: "NO DATA",
    higherLows: "NO DATA",
    nearHigh: "NO DATA",
    score: 0,
    qualityRank: "D",
    status: "AVOID",
    setup: "No live data / אין נתונים",
    entryZone: "-",
    invalidation: "-",
    trigger: "Check ticker / proxy",
    action: "לא לנתח בלי דאטה",
  };
}

function analyze(symbol: string, json: any): Row {
  const result = json?.chart?.result?.[0];
  const q = result?.indicators?.quote?.[0];

  const closes: number[] = (q?.close || []).filter((x: number | null) => x !== null);
  const highs: number[] = (q?.high || []).filter((x: number | null) => x !== null);
  const lows: number[] = (q?.low || []).filter((x: number | null) => x !== null);
  const vols: number[] = (q?.volume || []).filter((x: number | null) => x !== null);

  if (closes.length < 60) return fallback(symbol);

  const last = closes[closes.length - 1];
  const prev5 = closes[closes.length - 6] || closes[0];

  const ma20 = ma(closes, 20);
  const ma50 = ma(closes, 50);
  const ma150 = ma(closes, 150);

  const high20 = Math.max(...highs.slice(-20));
  const low20 = Math.min(...lows.slice(-20));
  const rangePct = pct(high20, low20);

  const nearHigh = last >= high20 * 0.92;
  const compression = rangePct <= 18;

  const higherLows =
    lows[lows.length - 1] > lows[lows.length - 6] &&
    lows[lows.length - 6] > lows[lows.length - 12];

  const volAvg20 = avg(vols.slice(-20));
  const volumeSpike = vols[vols.length - 1] > volAvg20 * 1.5;

  const aboveMA50 = last > ma50;
  const strongTrend = ma20 > ma50 && last > ma20;
  const longTrend = ma50 > ma150 || last > ma150;
  const momentum5d = pct(last, prev5);

  let score = 0;
  if (aboveMA50) score += 15;
  if (strongTrend) score += 20;
  if (longTrend) score += 15;
  if (higherLows) score += 20;
  if (nearHigh) score += 15;
  if (compression) score += 10;
  if (volumeSpike) score += 10;
  if (momentum5d >= 8) score += 10;

  let status: Status = "AVOID";
  let setup = "Avoid / Broken or Extended";
  let trigger = "Needs new structure";
  let action = "להתרחק";

  if (score >= 85 && volumeSpike && nearHigh) {
    status = "READY";
    setup = "Breakout + Volume / פריצה עם ווליום";
    trigger = "Hold above breakout level";
    action = "מעקב לכניסה — לא לרדוף";
  } else if (score >= 65 && nearHigh && higherLows && aboveMA50) {
    status = "CONTINUATION";
    setup = "Pullback Continuation / המשכיות";
    trigger = "Mini base / Close above range high";
    action = "להמתין לאישור";
  } else if (score >= 55 && compression && nearHigh) {
    status = "BASE";
    setup = "Base / Range High";
    trigger = "Reclaim range high";
    action = "לסמן ריינג׳ ולחכות";
  } else if (score >= 60 && !compression) {
    status = "HOT";
    setup = "Momentum Spike / תנועה חמה";
    trigger = "Wait for pullback / day-2 confirmation";
    action = "לא לרדוף — לחכות להתייצבות";
  }

  const rank =
    score >= 85 ? "A+" :
    score >= 75 ? "A" :
    score >= 65 ? "B+" :
    score >= 55 ? "B" :
    score >= 45 ? "C" : "D";

  const entryLow = last * 0.92;
  const entryHigh = last * 0.98;
  const invalidation = Math.min(...lows.slice(-10));

  return {
    ticker: symbol,
    price: `$${last.toFixed(2)}`,
    change5d: `${momentum5d.toFixed(2)}%`,
    range: `${rangePct.toFixed(2)}%`,
    compression: compression ? "YES" : "NO",
    higherLows: higherLows ? "YES" : "NO",
    nearHigh: nearHigh ? "YES" : "NO",
    score,
    qualityRank: rank,
    status,
    setup,
    entryZone: `$${entryLow.toFixed(2)} – $${entryHigh.toFixed(2)}`,
    invalidation: `$${invalidation.toFixed(2)}`,
    trigger,
    action,
  };
}

function statusHebrew(s: Status) {
  if (s === "READY") return "מוכן";
  if (s === "BASE") return "בסיס";
  if (s === "HOT") return "חם";
  if (s === "CONTINUATION") return "המשכיות";
  return "להימנע";
}

export default function App() {
  const [tickers, setTickers] = useState("DNA, UAMY, ACRS, NVAX, FOSL, PLUG, AI");
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  async function run() {
    const symbols = tickers
      .split(/[,\s]+/)
      .map((x) => x.toUpperCase().trim())
      .filter(Boolean);

    setLoading(true);

    const results = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const json = await fetchYahoo(symbol);
          return analyze(symbol, json);
        } catch {
          return fallback(symbol);
        }
      })
    );

    setRows(results.sort((a, b) => b.score - a.score));
    setLoading(false);
  }

  const top5 = useMemo(() => rows.slice(0, 5), [rows]);

  const counts = rows.reduce(
    (a, r) => {
      a[r.status]++;
      return a;
    },
    { READY: 0, BASE: 0, HOT: 0, CONTINUATION: 0, AVOID: 0 }
  );

  return (
    <div className="scanner-page">
      <style>{`
        body { margin:0; background:#050505; color:white; font-family:Arial,sans-serif; }
        .scanner-page { min-height:100vh; background:#050505; color:white; direction:rtl; }
        .top { padding:14px 18px; border-bottom:1px solid #333; text-align:right; }
        .title { color:#d8b62f; font-size:32px; font-weight:900; margin:0; }
        .subtitle { margin-top:12px; color:white; font-size:15px; }
        .input-row { display:flex; gap:12px; padding:16px; border-bottom:1px solid #222; direction:ltr; }
        .input-row input { flex:1; background:#1a1a1a; color:white; border:1px solid #333; padding:13px; font-size:16px; text-align:left; }
        .input-row button { background:#d8b62f; border:0; color:#000; font-weight:800; padding:0 26px; border-radius:9px; cursor:pointer; }
        .cards { display:grid; grid-template-columns:repeat(5,1fr); gap:8px; padding:12px; }
        .card { background:#111; border:1px solid #2b2b2b; border-radius:12px; min-height:52px; padding:14px; text-align:center; font-weight:800; }
        .top5 { padding:10px 16px; border-top:1px solid #222; border-bottom:1px solid #222; direction:ltr; }
        .top5-title { color:#d8b62f; font-weight:900; margin-bottom:8px; }
        .top5-row { display:flex; gap:8px; flex-wrap:wrap; }
        .top-chip { background:#151515; border:1px solid #333; padding:8px 12px; border-radius:999px; }
        .ready { color:#00ff8a; }
        .base { color:#ffd400; }
        .hot { color:#ffff00; }
        .continuation { color:#ff9f1a; }
        .avoid { color:#ff3b3b; }
        table { width:100%; border-collapse:collapse; direction:ltr; }
        th { background:#050505; color:white; padding:10px 12px; border-bottom:1px solid #333; text-align:center; white-space:nowrap; }
        td { padding:10px 12px; border-bottom:1px solid #1f1f1f; text-align:center; white-space:nowrap; }
        tbody tr { background:#140606; }
        tbody tr:hover { background:#241010; }
        a { color:#7b6cff; }
        .pill { padding:6px 12px; border-radius:18px; font-weight:900; display:inline-block; }
        .pill.READY { background:#06351e; color:#00ff8a; }
        .pill.BASE { background:#3a3300; color:#ffd400; }
        .pill.HOT { background:#423600; color:#ffff00; }
        .pill.CONTINUATION { background:#3b2200; color:#ff9f1a; }
        .pill.AVOID { background:#5a1515; color:#ffb0b0; }
        .rank { font-weight:900; color:#d8b62f; }
      `}</style>

      <header className="top">
        <h1 className="title">סורק המסחר Freedom V72</h1>
        <div className="subtitle">Multi Ticker Ranking — Yahoo Live Data via Vercel Proxy</div>
      </header>

      <div className="input-row">
        <button onClick={run} disabled={loading}>
          {loading ? "Scanning..." : "Scan"}
        </button>
        <input value={tickers} onChange={(e) => setTickers(e.target.value)} />
      </div>

      <section className="cards">
        <div className="card ready">Ready: {counts.READY}</div>
        <div className="card base">Base: {counts.BASE}</div>
        <div className="card hot">Hot: {counts.HOT}</div>
        <div className="card continuation">Continuation: {counts.CONTINUATION}</div>
        <div className="card avoid">Avoid: {counts.AVOID}</div>
      </section>

      <section className="top5">
        <div className="top5-title">TOP 5 לפי איכות</div>
        <div className="top5-row">
          {top5.map((r, i) => (
            <div className="top-chip" key={r.ticker}>
              #{i + 1} {r.ticker} — {r.qualityRank} — {r.score} — {statusHebrew(r.status)}
            </div>
          ))}
        </div>
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
            <th>Rank</th>
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
                <a href={`https://www.tradingview.com/chart/?symbol=${r.ticker}`} target="_blank" rel="noreferrer">
                  Open
                </a>
              </td>
              <td>{r.action}</td>
              <td>{r.trigger}</td>
              <td>{r.invalidation}</td>
              <td>{r.entryZone}</td>
              <td>{r.setup}</td>
              <td><span className={`pill ${r.status}`}>{statusHebrew(r.status)}</span></td>
              <td className="rank">{r.qualityRank}</td>
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
