const marketTickers = [
  "S&P 500",
  "Nasdaq",
  "Dow",
  "VIX",
  "Bitcoin",
  "Ethereum",
  "WTI Oil",
];

export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        fontFamily: "Arial, sans-serif",
        color: "#ffffff",
        background:
          "linear-gradient(180deg, #0b2d5c 0%, #081d3b 55%, #06152c 100%)",
      }}
    >
      <div
        style={{
          width: "100%",
          overflowX: "auto",
          whiteSpace: "nowrap",
          background: "#020d20",
          borderBottom: "1px solid rgba(255,255,255,0.16)",
          boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            minWidth: "100%",
            padding: "14px 20px",
            boxSizing: "border-box",
          }}
        >
          {marketTickers.map((ticker) => (
            <div
              key={ticker}
              style={{
                marginRight: "34px",
                fontSize: "15px",
                fontWeight: 700,
                letterSpacing: "0.3px",
              }}
            >
              {ticker}
            </div>
          ))}
        </div>
      </div>

      <section
        style={{
          minHeight: "calc(100vh - 50px)",
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
              fontSize: "clamp(52px, 9vw, 110px)",
              lineHeight: 1,
              fontWeight: 800,
              letterSpacing: "-2px",
              textShadow: "0 8px 30px rgba(0,0,0,0.32)",
            }}
          >
            Stock Analyzer
          </h1>

          <p
            style={{
              margin: "24px 0 0",
              fontSize: "clamp(22px, 3vw, 38px)",
              fontWeight: 600,
              letterSpacing: "0.4px",
              color: "#d9e8ff",
            }}
          >
            Company Score Card for 2+ Years
          </p>
        </div>
      </section>
    </main>
  );
}
