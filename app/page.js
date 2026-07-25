import Link from "next/link";

const markets = [
  { name: "S&P 500", value: "6,388.64", change: "+0.40%", up: true },
  { name: "Nasdaq", value: "21,108.32", change: "+0.24%", up: true },
  { name: "Dow", value: "44,901.92", change: "-0.32%", up: false },
  { name: "Russell 2000", value: "2,251.06", change: "+0.18%", up: true },
  { name: "VIX", value: "15.44", change: "-2.03%", up: false },
  { name: "Bitcoin", value: "$117,420", change: "+1.12%", up: true },
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        fontFamily: "Arial, sans-serif",
        color: "#0b1f3a",
      }}
    >
      <section
        style={{
          display: "flex",
          gap: "12px",
          overflowX: "auto",
          padding: "14px",
          background: "#f3f6fa",
          borderBottom: "1px solid #d7e0eb",
        }}
      >
        {markets.map((market) => {
          const accent = market.up ? "#07852f" : "#c22121";

          return (
            <div
              key={market.name}
              style={{
                minWidth: "150px",
                background: "#ffffff",
                border: "1px solid #d7e0eb",
                borderRadius: "10px",
                padding: "12px 16px",
                boxShadow: "0 3px 10px rgba(0,0,0,0.08)",
              }}
            >
              <div style={{ color: accent, fontWeight: 800, fontSize: "15px" }}>
                {market.name}
              </div>
              <div
                style={{
                  color: "#111111",
                  fontWeight: 800,
                  fontSize: "20px",
                  marginTop: "5px",
                }}
              >
                {market.value}
              </div>
              <div
                style={{
                  color: accent,
                  fontWeight: 800,
                  fontSize: "14px",
                  marginTop: "4px",
                }}
              >
                {market.up ? "▲" : "▼"} {market.change}
              </div>
            </div>
          );
        })}
      </section>

      <section
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "calc(100vh - 110px)",
          padding: "50px 22px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            width: "min(980px, 100%)",
            background: "linear-gradient(135deg, #0b2d5c, #123f79)",
            color: "#ffffff",
            borderRadius: "18px",
            padding: "70px 30px",
            textAlign: "center",
            boxShadow: "0 18px 40px rgba(11,45,92,0.22)",
          }}
        >
          <h1
            style={{
              margin: 0,
              fontSize: "clamp(52px, 8vw, 96px)",
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: "-2px",
            }}
          >
            Stock Analyzer
          </h1>

          <p
            style={{
              margin: "24px 0 36px",
              fontSize: "clamp(22px, 3vw, 36px)",
              fontWeight: 600,
              color: "#dceaff",
            }}
          >
            Company Score Card for 2+ Years
          </p>

          <Link
            href="/scorecard"
            style={{
              display: "inline-block",
              background: "#16a34a",
              color: "#ffffff",
              padding: "18px 34px",
              borderRadius: "10px",
              fontSize: "22px",
              fontWeight: 800,
              textDecoration: "none",
              boxShadow: "0 8px 20px rgba(0,0,0,0.22)",
            }}
          >
            Open Stock Scorecard
          </Link>
        </div>
      </section>
    </main>
  );
}
