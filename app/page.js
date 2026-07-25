import Link from "next/link";

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

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
        background:
          "linear-gradient(180deg, #0b2d5c 0%, #081d3b 55%, #06152c 100%)",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          padding: "14px",
          background: "#03142d",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
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
              boxShadow: "0 3px 10px rgba(0,0,0,0.25)",
            }}
          >
            {market.name}
          </div>
        ))}
      </div>

      <section
        style={{
          minHeight: "calc(100vh - 68px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 24px",
          boxSizing: "border-box",
          textAlign: "center",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(54px, 9vw, 108px)",
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: "-2px",
            }}
          >
            Stock Analyzer
          </h1>

          <p
            style={{
              margin: "22px 0 34px",
              fontSize: "clamp(22px, 3vw, 36px)",
              fontWeight: 600,
              color: "#d8e7ff",
            }}
          >
            Company Score Card for 2+ Years
          </p>

          <Link
            href="/scorecard"
            style={{
              display: "inline-block",
              background: "#ffffff",
              color: "#0a2a57",
              padding: "16px 30px",
              borderRadius: "10px",
              fontSize: "20px",
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 8px 22px rgba(0,0,0,0.28)",
            }}
          >
            Open Stock Scorecard
          </Link>
        </div>
      </section>
    </main>
  );
}
