import Link from "next/link";

const markets = [
  { name: "S&P 500", symbol: "SPX", change: "+0.42%", direction: "up" },
  { name: "Nasdaq", symbol: "IXIC", change: "+0.71%", direction: "up" },
  { name: "Dow", symbol: "DJI", change: "-0.18%", direction: "down" },
  { name: "ETHU", symbol: "ETHU", change: "+1.24%", direction: "up" },
  { name: "Bitcoin", symbol: "BTC", change: "+0.83%", direction: "up" },
  { name: "Gold", symbol: "GC", change: "-0.09%", direction: "down" },
  { name: "Oil", symbol: "WTI", change: "+0.36%", direction: "up" },
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "24px",
        fontFamily: "Arial, sans-serif",
        color: "#13233a",
        background: "#ffffff",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1180px",
          margin: "0 auto",
        }}
      >
        <section
          style={{
            minHeight: "430px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxSizing: "border-box",
            padding: "72px 28px",
            textAlign: "center",
            borderRadius: "22px",
            color: "#ffffff",
            background: "linear-gradient(135deg, #0d56a6 0%, #08386f 100%)",
            boxShadow: "0 18px 45px rgba(8, 56, 111, 0.2)",
          }}
        >
          <div style={{ maxWidth: "800px" }}>
            <p
              style={{
                margin: "0 0 14px",
                fontSize: "14px",
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#cfe4ff",
              }}
            >
              Long-Term Equity Research
            </p>

            <h1
              style={{
                margin: 0,
                fontSize: "clamp(48px, 8vw, 86px)",
                lineHeight: 1.02,
                fontWeight: 800,
                letterSpacing: "-2px",
              }}
            >
              Stock Analyzer
            </h1>

            <p
              style={{
                margin: "22px 0 34px",
                fontSize: "clamp(21px, 3vw, 32px)",
                lineHeight: 1.3,
                fontWeight: 600,
                color: "#e3efff",
              }}
            >
              Company Score Card for 2+ Years
            </p>

            <Link
              href="/scorecard"
              style={{
                display: "inline-block",
                padding: "15px 28px",
                borderRadius: "10px",
                background: "#27a844",
                color: "#ffffff",
                fontSize: "18px",
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 9px 22px rgba(0, 0, 0, 0.22)",
              }}
            >
              Open Stock Scorecard
            </Link>
          </div>
        </section>

        <section
          aria-label="Market snapshot"
          style={{
            padding: "32px 0 8px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "end",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "16px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <h2
                style={{
                  margin: 0,
                  fontSize: "22px",
                  color: "#13233a",
                }}
              >
                Market Snapshot
              </h2>
              <p
                style={{
                  margin: "6px 0 0",
                  color: "#637086",
                  fontSize: "14px",
                }}
              >
                Compact reference cards for major markets and assets
              </p>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))",
              gap: "12px",
            }}
          >
            {markets.map((market) => {
              const positive = market.direction === "up";
              return (
                <article
                  key={market.name}
                  style={{
                    minWidth: 0,
                    padding: "14px 15px",
                    border: "1px solid #dce5f0",
                    borderRadius: "10px",
                    background: "#ffffff",
                    boxShadow: "0 5px 16px rgba(25, 54, 91, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "8px",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        color: "#172c49",
                        fontSize: "14px",
                        fontWeight: 800,
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {market.name}
                    </span>
                    <span
                      style={{
                        color: "#8290a3",
                        fontSize: "11px",
                        fontWeight: 700,
                      }}
                    >
                      {market.symbol}
                    </span>
                  </div>
                  <div
                    style={{
                      marginTop: "9px",
                      color: positive ? "#16813a" : "#c13d3d",
                      fontSize: "15px",
                      fontWeight: 800,
                    }}
                  >
                    {positive ? "▲" : "▼"} {market.change}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
