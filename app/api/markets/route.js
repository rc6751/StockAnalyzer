import { NextResponse } from "next/server";

const symbols = [
  { name: "Dow Jones", symbol: "^DJI" },
  { name: "Nasdaq", symbol: "^IXIC" },
  { name: "S&P 500", symbol: "^GSPC" },
  { name: "VIX", symbol: "^VIX" },
  { name: "Bitcoin", symbol: "BTC-USD" },
  { name: "Ethereum", symbol: "ETH-USD" },
  { name: "Gold", symbol: "GC=F" },
  { name: "WTI Crude", symbol: "CL=F" },
];

export async function GET() {
  try {
    const result = await Promise.all(symbols.map(async (item) => {
      const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(item.symbol)}?range=5d&interval=1d`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(item.symbol);
      const json = await res.json();
      const r = json.chart.result?.[0];
      const meta = r?.meta || {};
      const closes = r?.indicators?.quote?.[0]?.close?.filter(Number.isFinite) || [];
      const price = meta.regularMarketPrice ?? closes.at(-1);
      const previous = meta.previousClose ?? closes.at(-2);
      const change = price != null && previous != null ? price - previous : null;
      const percent = change != null && previous ? (change / previous) * 100 : null;
      return { ...item, price, change, percent };
    }));
    return NextResponse.json({ markets: result, updated: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json({ error: "Market feed unavailable" }, { status: 502 });
  }
}
