"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const emptyForm = {
  ticker: "",
  company: "",
  revenueGrowth: "",
  epsGrowth: "",
  roe: "",
  debtToEquity: "",
  peRatio: "",
  freeCashFlowGrowth: "",
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function calculateScore(form) {
  const revenue = clamp(Number(form.revenueGrowth) || 0, -20, 40);
  const eps = clamp(Number(form.epsGrowth) || 0, -30, 50);
  const roe = clamp(Number(form.roe) || 0, 0, 40);
  const debt = clamp(Number(form.debtToEquity) || 0, 0, 3);
  const pe = clamp(Number(form.peRatio) || 0, 0, 80);
  const fcf = clamp(Number(form.freeCashFlowGrowth) || 0, -30, 50);

  const revenuePoints = clamp((revenue + 20) / 60 * 20, 0, 20);
  const epsPoints = clamp((eps + 30) / 80 * 20, 0, 20);
  const roePoints = clamp(roe / 40 * 20, 0, 20);
  const debtPoints = clamp((3 - debt) / 3 * 15, 0, 15);
  const pePoints = pe <= 0 ? 0 : pe <= 25 ? 15 : clamp((80 - pe) / 55 * 15, 0, 15);
  const fcfPoints = clamp((fcf + 30) / 80 * 10, 0, 10);

  return Math.round(
    revenuePoints +
      epsPoints +
      roePoints +
      debtPoints +
      pePoints +
      fcfPoints
  );
}

function ratingFromScore(score) {
  if (score >= 85) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 55) return "Fair";
  return "Weak";
}

function ratingColor(score) {
  if (score >= 85) return "#087f2f";
  if (score >= 70) return "#2563eb";
  if (score >= 55) return "#b7791f";
  return "#c22121";
}

export default function ScorecardPage() {
  const [activeTab, setActiveTab] = useState("scorecard");
  const [form, setForm] = useState(emptyForm);
  const [stocks, setStocks] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("stockAnalyzerScores") || "[]");
      if (Array.isArray(saved)) setStocks(saved);
    } catch {
      setStocks([]);
    }
  }, []);

  const sortedStocks = useMemo(
    () => [...stocks].sort((a, b) => b.score - a.score),
    [stocks]
  );

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function saveScorecard(event) {
    event.preventDefault();

    if (!form.ticker.trim() || !form.company.trim()) {
      setMessage("Enter both a ticker and company name.");
      return;
    }

    const score = calculateScore(form);
    const record = {
      ...form,
      ticker: form.ticker.trim().toUpperCase(),
      company: form.company.trim(),
      score,
      rating: ratingFromScore(score),
      createdAt: new Date().toISOString(),
    };

    const withoutDuplicate = stocks.filter(
      (stock) => stock.ticker !== record.ticker
    );
    const updated = [record, ...withoutDuplicate];

    setStocks(updated);
    localStorage.setItem("stockAnalyzerScores", JSON.stringify(updated));
    setMessage(`${record.ticker} scored ${score}/100 — ${record.rating}.`);
    setForm(emptyForm);
  }

  function deleteStock(ticker) {
    const updated = stocks.filter((stock) => stock.ticker !== ticker);
    setStocks(updated);
    localStorage.setItem("stockAnalyzerScores", JSON.stringify(updated));
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#eef3f8",
        fontFamily: "Arial, sans-serif",
        color: "#0b1f3a",
      }}
    >
      <header
        style={{
          background: "#0b2d5c",
          color: "#ffffff",
          padding: "18px 22px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.15)",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "32px" }}>Stock Analyzer</h1>
            <div style={{ color: "#dceaff", marginTop: "4px" }}>
              Company Score Card for 2+ Years
            </div>
          </div>

          <Link
            href="/"
            style={{
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 800,
              border: "1px solid rgba(255,255,255,0.5)",
              borderRadius: "8px",
              padding: "10px 16px",
            }}
          >
            Home
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "26px 18px" }}>
        <div
          style={{
            display: "flex",
            gap: "8px",
            borderBottom: "2px solid #c7d3e3",
            marginBottom: "22px",
          }}
        >
          {[
            ["scorecard", "Stock Scorecard"],
            ["top10", "Top 10"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              style={{
                border: "none",
                cursor: "pointer",
                padding: "14px 22px",
                borderRadius: "10px 10px 0 0",
                fontSize: "17px",
                fontWeight: 800,
                background: activeTab === key ? "#0b2d5c" : "#d9e3ef",
                color: activeTab === key ? "#ffffff" : "#0b2d5c",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "scorecard" ? (
          <section
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "26px",
              boxShadow: "0 8px 24px rgba(15,45,80,0.10)",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: "30px" }}>Stock Scorecard</h2>
            <p style={{ color: "#4b5f78", lineHeight: 1.6 }}>
              Enter the company metrics below. The score is calculated out of 100
              and saved in this browser.
            </p>

            <form onSubmit={saveScorecard}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                  gap: "16px",
                  marginTop: "22px",
                }}
              >
                {[
                  ["ticker", "Ticker", "AAPL"],
                  ["company", "Company Name", "Apple Inc."],
                  ["revenueGrowth", "Revenue Growth %", "8"],
                  ["epsGrowth", "EPS Growth %", "12"],
                  ["roe", "Return on Equity %", "28"],
                  ["debtToEquity", "Debt-to-Equity", "1.2"],
                  ["peRatio", "P/E Ratio", "24"],
                  ["freeCashFlowGrowth", "Free Cash Flow Growth %", "10"],
                ].map(([name, label, placeholder]) => (
                  <label key={name} style={{ fontWeight: 700 }}>
                    {label}
                    <input
                      name={name}
                      value={form[name]}
                      onChange={updateField}
                      placeholder={placeholder}
                      type={name === "ticker" || name === "company" ? "text" : "number"}
                      step="any"
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        marginTop: "7px",
                        padding: "12px 13px",
                        borderRadius: "8px",
                        border: "1px solid #b9c6d6",
                        fontSize: "16px",
                      }}
                    />
                  </label>
                ))}
              </div>

              <button
                type="submit"
                style={{
                  marginTop: "22px",
                  background: "#16a34a",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "9px",
                  padding: "14px 24px",
                  fontSize: "18px",
                  fontWeight: 800,
                  cursor: "pointer",
                }}
              >
                Calculate and Save Score
              </button>

              {message && (
                <div
                  style={{
                    marginTop: "18px",
                    background: "#eef8f1",
                    border: "1px solid #b7dfc2",
                    borderRadius: "8px",
                    padding: "14px",
                    fontWeight: 800,
                  }}
                >
                  {message}
                </div>
              )}
            </form>
          </section>
        ) : (
          <section
            style={{
              background: "#ffffff",
              borderRadius: "14px",
              padding: "26px",
              boxShadow: "0 8px 24px rgba(15,45,80,0.10)",
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: "30px" }}>Top 10 Stocks</h2>
            <p style={{ color: "#4b5f78", lineHeight: 1.6 }}>
              The ten highest-scoring companies saved in your browser appear here.
            </p>

            {sortedStocks.length === 0 ? (
              <div
                style={{
                  marginTop: "24px",
                  padding: "30px",
                  textAlign: "center",
                  background: "#f5f8fc",
                  borderRadius: "10px",
                  color: "#52667f",
                  fontWeight: 700,
                }}
              >
                No stocks have been scored yet.
              </div>
            ) : (
              <div style={{ overflowX: "auto", marginTop: "22px" }}>
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    minWidth: "700px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#0b2d5c", color: "#ffffff" }}>
                      {["Rank", "Ticker", "Company", "Score", "Rating", "Action"].map(
                        (heading) => (
                          <th
                            key={heading}
                            style={{ padding: "13px", textAlign: "left" }}
                          >
                            {heading}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedStocks.slice(0, 10).map((stock, index) => (
                      <tr
                        key={stock.ticker}
                        style={{
                          borderBottom: "1px solid #d9e1ea",
                          background: index % 2 === 0 ? "#ffffff" : "#f7f9fc",
                        }}
                      >
                        <td style={{ padding: "13px", fontWeight: 800 }}>
                          {index + 1}
                        </td>
                        <td style={{ padding: "13px", fontWeight: 800 }}>
                          {stock.ticker}
                        </td>
                        <td style={{ padding: "13px" }}>{stock.company}</td>
                        <td
                          style={{
                            padding: "13px",
                            fontWeight: 900,
                            color: ratingColor(stock.score),
                          }}
                        >
                          {stock.score}
                        </td>
                        <td
                          style={{
                            padding: "13px",
                            fontWeight: 800,
                            color: ratingColor(stock.score),
                          }}
                        >
                          {stock.rating}
                        </td>
                        <td style={{ padding: "13px" }}>
                          <button
                            onClick={() => deleteStock(stock.ticker)}
                            style={{
                              border: "none",
                              background: "#c22121",
                              color: "#ffffff",
                              borderRadius: "7px",
                              padding: "8px 12px",
                              fontWeight: 800,
                              cursor: "pointer",
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
