import React, { useMemo, useState } from "react";
import "./style.css";

type Status = "READY" | "APPROACHING" | "CONTINUATION" | "BASE" | "AVOID";

type Stock = {
  ticker: string;
  price: number;
  change: number;
  volumeSpike: boolean;
  breakout: boolean;
  pullback: boolean;
  strongTrend: boolean;
  base: boolean;
  nearResistance: boolean;
  aboveMA50: boolean;
  higherLow: boolean;
};

const stocks: Stock[] = [
  {
    ticker: "ACRS",
    price: 4.36,
    change: 3.1,
    volumeSpike: false,
    breakout: false,
    pullback: true,
    strongTrend: true,
    base: false,
    nearResistance: true,
    aboveMA50: true,
    higherLow: true,
  },
  {
    ticker: "NVAX",
    price: 8.72,
    change: 5.4,
    volumeSpike: true,
    breakout: true,
    pullback: false,
    strongTrend: true,
    base: false,
    nearResistance: false,
    aboveMA50: true,
    higherLow: true,
  },
  {
    ticker: "FOSL",
    price: 2.14,
    change: 1.8,
    volumeSpike: false,
    breakout: false,
    pullback: true,
    strongTrend: true,
    base: true,
    nearResistance: true,
    aboveMA50: true,
    higherLow: true,
  },
  {
    ticker: "GERN",
    price: 1.51,
    change: -2.2,
    volumeSpike: false,
    breakout: false,
    pullback: false,
    strongTrend: false,
    base: false,
    nearResistance: false,
    aboveMA50: false,
    higherLow: false,
  },
  {
    ticker: "HNST",
    price: 3.42,
    change: 2.6,
    volumeSpike: false,
    breakout: false,
    pullback: true,
    strongTrend: true,
    base: false,
    nearResistance: true,
    aboveMA50: true,
    higherLow: true,
  },
];

function getStatus(stock: Stock): Status {
  if (stock.breakout && stock.volumeSpike && stock.strongTrend) return "READY";

  if (
    stock.pullback &&
    stock.strongTrend &&
    stock.aboveMA50 &&
    stock.higherLow &&
    stock.nearResistance
  ) {
    return "CONTINUATION";
  }

  if (stock.base && stock.nearResistance && stock.aboveMA50) return "BASE";

  if (stock.pullback && stock.strongTrend) return "APPROACHING";

  return "AVOID";
}

function getStatusText(status: Status) {
  switch (status) {
    case "READY":
      return "READY / מוכן";
    case "CONTINUATION":
      return "CONTINUATION / המשכיות";
    case "BASE":
      return "BASE / בסיס";
    case "APPROACHING":
      return "APPROACHING / מתקרב";
    case "AVOID":
      return "AVOID / הימנע";
  }
}

function getStatusClass(status: Status) {
  switch (status) {
    case "READY":
      return "status ready";
    case "CONTINUATION":
      return "status continuation";
    case "BASE":
      return "status base";
    case "APPROACHING":
      return "status approaching";
    case "AVOID":
      return "status avoid";
  }
}

function getSetup(stock: Stock) {
  const status = getStatus(stock);

  if (status === "READY") return "Breakout + Volume";
  if (status === "CONTINUATION") return "Pullback Continuation";
  if (status === "BASE") return "Base / Range High";
  if (status === "APPROACHING") return "Watching Pullback";
  return "No Clean Setup";
}

function getAction(stock: Stock) {
  const status = getStatus(stock);

  if (status === "READY") return "אפשר מעקב לכניסה — לא לרדוף בגאפ";
  if (status === "CONTINUATION") return "לחכות ל־mini base או pullback קטן";
  if (status === "BASE") return "לסמן range high ולחכות reclaim";
  if (status === "APPROACHING") return "מעניין אבל צריך עוד הוכחה";
  return "לא מתאים כרגע לשיטה";
}

export default function App() {
  const [filter, setFilter] = useState<"ALL" | Status>("ALL");

  const rows = useMemo(() => {
    return stocks
      .map((s) => ({ ...s, status: getStatus(s) }))
      .filter((s) => filter === "ALL" || s.status === filter);
  }, [filter]);

  return (
    <div className="app">
      <header className="hero">
        <div>
          <h1>Freedom Trading Scanner V60</h1>
          <p>Wyckoff + VPA Scanner | Continuation Mode Added</p>
        </div>
        <div className="version">V60</div>
      </header>

      <section className="panel">
        <h2>מצב חדש שנוסף</h2>
        <p>
          🟠 <b>CONTINUATION</b> — מניה שלא פרצה עדיין, אבל המבנה חיובי:
          מעל MA50, יש Higher Low, יש Pullback מבוקר והיא קרובה להתנגדות.
        </p>
      </section>

      <div className="filters">
        {["ALL", "READY", "CONTINUATION", "BASE", "APPROACHING", "AVOID"].map(
          (f) => (
            <button
              key={f}
              onClick={() => setFilter(f as "ALL" | Status)}
              className={filter === f ? "active" : ""}
            >
              {f}
            </button>
          )
        )}
      </div>

      <section className="tableWrap">
        <table>
          <thead>
            <tr>
              <th>Ticker</th>
              <th>Price</th>
              <th>Change</th>
              <th>Status</th>
              <th>Setup</th>
              <th>Signals</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((stock) => {
              const status = stock.status;

              return (
                <tr key={stock.ticker}>
                  <td className="ticker">
                    <a
                      href={`https://www.tradingview.com/chart/?symbol=${stock.ticker}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {stock.ticker}
                    </a>
                  </td>

                  <td>${stock.price.toFixed(2)}</td>

                  <td className={stock.change >= 0 ? "green" : "red"}>
                    {stock.change >= 0 ? "+" : ""}
                    {stock.change.toFixed(1)}%
                  </td>

                  <td>
                    <span className={getStatusClass(status)}>
                      {getStatusText(status)}
                    </span>
                  </td>

                  <td>{getSetup(stock)}</td>

                  <td className="signals">
                    {stock.volumeSpike && <span>Volume Spike</span>}
                    {stock.breakout && <span>Breakout</span>}
                    {stock.pullback && <span>Pullback</span>}
                    {stock.strongTrend && <span>Strong Trend</span>}
                    {stock.base && <span>Base</span>}
                    {stock.nearResistance && <span>Near Resistance</span>}
                    {stock.higherLow && <span>Higher Low</span>}
                  </td>

                  <td>{getAction(stock)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}
