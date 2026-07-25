import { NextResponse } from "next/server";

const symbols = [["Dow", "^DJI"],["Nasdaq", "^IXIC"],["S&P 500", "^GSPC"],["VIX", "^VIX"],["Bitcoin", "BTC-USD"],["Ether", "ETH.CM"],["Gold", "GC=F"],["Oil", "CL=F"]];

export async function GET() {
  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbols.map(s => encodeURIComponent(s[1])).join(",")}`;
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) throw new Error("Quote service unavailable");
    const json = await response.json();
    const rows = json.quoteResponse.result;
    return NextResponse.json(symbols.map(([name, symbol]) => {
      const q = rows.find(r => r.symbol === symbol) || {};
      const change = q.regularMarketChange ?? 0;
      return { name, symbol, amount: q.regularMarketPrice ?? "--", pointChange: change, change: q.regularMarketChangePercent ?? 0, direction: change >= 0 ? "up" : "down" };
    }));
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 502 });
  }
}
