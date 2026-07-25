"use client";

import Link from "next/link";
import { useState } from "react";

const markets = [
  { name: "S&P 500", direction: "up" },
  { name: "Nasdaq", direction: "up" },
  { name: "Dow", direction: "down" },
  { name: "Russell 2000", direction: "up" },
  { name: "VIX", direction: "down" },
  { name: "Bitcoin", direction: "up" },
  { name: "Gold", direction: "down" },
  { name: "Oil", direction: "up" },
];

export default function ScorecardPage() {
  const [activeTab, setActiveTab] = useState("scorecard");

  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        background: "#eef3f9",
        color: "#0b1f3a",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          padding: "14px",
          background: "#03142d",
        }}
      >
        {markets.map((market) => (
          <div
            key={market.name}
            style={{
              background: "#ffffff",
              color: market.direction === "up" ? "#008a2e" : "#c00000",
              padding: "11px 18px",
              borderRadius: "8px",
              fontWeight: 700,
              whiteSpace: "nowrap",
              boxShadow: "0 3px 10px rgba(0,0,0,0.22)",
            }}
          >
            {market.name}
          </div>
        ))}
      </div>

      <header
        style={{
          background: "#0b2d5c",
          color: "#ffffff",
          padding: "22px 24px",
        }}
      >
        <div
          style={{
            maxWidth: "1180px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "32px" }}>Stock Analyzer</h1>
          <Link
            href="/"
            style={{
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 700,
            }}
          >
            Home
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "26px 20px" }}>
        <div
          style={{
            display: "flex",
            gap: "10px",
            borderBottom: "2px solid #c9d5e5",
            marginBottom: "24px",
          }}
        >
          <button
            onClick={() => setActiveTab("scorecard")}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "14px 22px",
              fontSize: "17px",
              fontWeight: 800,
              borderRadius: "8px 8px 0 0",
              background: activeTab === "scorecard" ? "#0b2d5c" : "#dbe5f2",
              color: activeTab === "scorecard" ? "#ffffff" : "#0b2d5c",
            }}
          >
            Stock Scorecard
          </button>

          <button
            onClick={() => setActiveTab("top10")}
            style={{
              border: "none",
              cursor: "pointer",
              padding: "14px 22px",
              fontSize: "17px",
              fontWeight: 800,
              borderRadius: "8px 8px 0 0",
              background: activeTab === "top10" ? "#0b2d5c" : "#dbe5f2",
              color: activeTab === "top10" ? "#ffffff" : "#0b2d5c",
            }}
          >
            Top 10
          </button>
        </div>

        <section
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "30px",
            minHeight: "360px",
            boxShadow: "0 8px 24px rgba(20,45,80,0.12)",
          }}
        >
          {activeTab === "scorecard" ? (
            <>
              <h2 style={{ marginTop: 0, fontSize: "30px" }}>Stock Scorecard</h2>
              <p style={{ fontSize: "18px", lineHeight: 1.6 }}>
                The stock analysis scorecard will be built here.
              </p>
            </>
          ) : (
            <>
              <h2 style={{ marginTop: 0, fontSize: "30px" }}>Top 10</h2>
              <p style={{ fontSize: "18px", lineHeight: 1.6 }}>
                Your ten highest-scoring stocks will be generated here.
              </p>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
