import { NextResponse } from "next/server";

const SOURCES = {
  dow: "https://en.wikipedia.org/wiki/Dow_Jones_Industrial_Average",
  nasdaq: "https://en.wikipedia.org/wiki/Nasdaq-100",
  sp500: "https://en.wikipedia.org/wiki/List_of_S%26P_500_companies",
};
const EXPECTED = { dow: 30, nasdaq: 100, sp500: 500 };

const decode = (value) => value
  .replace(/<[^>]*>/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&#160;|&nbsp;/g, " ")
  .replace(/&#39;/g, "'")
  .replace(/&quot;/g, '"')
  .trim();

function extractTickers(html, market) {
  const tableMatches = [...html.matchAll(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/gi)].map(m => m[1]);
  let best = [];
  for (const table of tableMatches) {
    const rows = [...table.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)].map(m => m[1]);
    const tickers = [];
    for (const row of rows) {
      const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map(m => decode(m[1]));
      if (!cells.length) continue;
      const candidates = market === "nasdaq" ? cells.slice(0, 2) : cells.slice(0, 1);
      const ticker = candidates.map(v => v.replace(/\[[^\]]*\]/g, "").replace(/\s+/g, "").replace(/\./g, "-").toUpperCase()).find(v => /^[A-Z][A-Z0-9-]{0,9}$/.test(v));
      if (ticker && !tickers.includes(ticker)) tickers.push(ticker);
    }
    if (Math.abs(tickers.length - EXPECTED[market]) < Math.abs(best.length - EXPECTED[market])) best = tickers;
  }
  const max = market === "dow" ? 35 : market === "nasdaq" ? 110 : 520;
  return best.slice(0, max);
}

export async function GET(request) {
  const market = new URL(request.url).searchParams.get("market");
  if (!SOURCES[market]) return NextResponse.json({ error: "Unknown market." }, { status: 400 });
  try {
    const response = await fetch(SOURCES[market], { next: { revalidate: 86400 }, headers: { "User-Agent": "StockAnalyzer/1.0" } });
    if (!response.ok) throw new Error(`Constituent source returned ${response.status}.`);
    const tickers = extractTickers(await response.text(), market);
    const minimum = market === "dow" ? 25 : market === "nasdaq" ? 85 : 450;
    if (tickers.length < minimum) throw new Error(`Only ${tickers.length} constituents were found.`);
    return NextResponse.json({ market, tickers, count: tickers.length, source: "Wikipedia", updated_at: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to load index constituents." }, { status: 502 });
  }
}
