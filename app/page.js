import Link from "next/link";

const fallbackMarkets = [
  { name: "Dow", symbol: "^DJI", amount: "--", pointChange: "--", change: "--", direction: "down" },
];


export default async function Home() {
  let markets = fallbackMarkets;
  try {
    const data = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/quotes`, { cache: "no-store" });
    if (data.ok) markets = await data.json();
  } catch {}
  return (
    <main
      style={{
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "20px 24px 28px",
        fontFamily: "Arial, sans-serif",
        color: "#13233a",
        background: "#ffffff",
      }}
    >
      <div style={{ width: "100%", maxWidth: "1180px", margin: "0 auto" }}>
        <section aria-label="Market snapshot" style={{ padding: "0 0 24px" }}>
          <div style={{ marginBottom: "14px" }}>
            <h2 style={{ margin: 0, fontSize: "24px", color: "#13233a" }}>
              Market Snapshot
            </h2>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(128px, 1fr))",
              gap: "10px",
            }}
          >
            {markets.map((market) => {
              const positive = market.direction === "up";
              const movementColor = positive ? "#16813a" : "#c13d3d";

              return (
                <article
                  key={market.name}
                  style={{
                    minWidth: 0,
                    padding: "13px 14px",
                    border: "1px solid #dce5f0",
                    borderRadius: "10px",
                    background: "#ffffff",
                    boxShadow: "0 4px 13px rgba(25, 54, 91, 0.08)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "7px",
                    }}
                  >
                    <span
                      style={{
                        overflow: "hidden",
                        color: movementColor,
                        fontSize: "14px",
                        fontWeight: 800,
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {market.name}
                    </span>
                    <span style={{ color: "#8290a3", fontSize: "11px", fontWeight: 700 }}>
                      {market.symbol}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "8px",
                      color: "#111111",
                      fontSize: "18px",
                      fontWeight: 800,
                      lineHeight: 1.15,
                    }}
                  >
                    {typeof market.amount === "number" ? market.amount.toLocaleString(undefined, { maximumFractionDigits: 2 }) : market.amount}
                  </div>

                  <div
                    style={{
                      marginTop: "6px",
                      color: movementColor,
                      fontSize: "12px",
                      fontWeight: 800,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {positive ? "▲" : "▼"} {typeof market.pointChange === "number" ? market.pointChange.toFixed(2) : market.pointChange}
                  </div>
                </article>
              );
            })}
          </div>
        </section>

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
            background: "linear-gradient(135deg, #073b78 0%, #031f43 100%)",
            boxShadow: "0 18px 45px rgba(3, 31, 67, 0.28)",
          }}
        >
          <div style={{ maxWidth: "800px" }}>
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
              Company Score Card
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
      </div>
    </main>
  );
}
