import { NextResponse } from "next/server";

const raw = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "object" && "raw" in value) return raw(value.raw);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const text = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object") return value.longFmt || value.fmt || value.raw || null;
  return String(value);
};

const yahooSession = async () => {
  const userAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36";
  const cookieResponse = await fetch("https://fc.yahoo.com", {
    headers: { "User-Agent": userAgent, Accept: "text/html,*/*" },
    cache: "no-store",
    redirect: "manual",
  });

  const setCookie = cookieResponse.headers.get("set-cookie") || "";
  const cookie = setCookie
    .split(/,(?=[^;,]+=)/)
    .map((part) => part.split(";")[0].trim())
    .filter(Boolean)
    .join("; ");

  if (!cookie) throw new Error("Yahoo did not provide a session cookie.");

  const crumbResponse = await fetch("https://query1.finance.yahoo.com/v1/test/getcrumb", {
    headers: { "User-Agent": userAgent, Cookie: cookie, Accept: "text/plain" },
    cache: "no-store",
  });
  if (!crumbResponse.ok) throw new Error(`Yahoo authentication returned ${crumbResponse.status}.`);

  const crumb = (await crumbResponse.text()).trim();
  if (!crumb || crumb.toLowerCase().includes("unauthorized")) {
    throw new Error("Yahoo did not provide a valid authentication token.");
  }
  return { cookie, crumb, userAgent };
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const ticker = (searchParams.get("ticker") || "").trim().toUpperCase();
  if (!/^[A-Z0-9.^=-]{1,15}$/.test(ticker)) {
    return NextResponse.json({ error: "Enter a valid ticker symbol." }, { status: 400 });
  }

  try {
    const modules = [
      "price",
      "summaryDetail",
      "defaultKeyStatistics",
      "financialData",
      "assetProfile",
      "recommendationTrend",
    ].join(",");
    const session = await yahooSession();
    const summaryUrl = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(ticker)}?modules=${modules}&crumb=${encodeURIComponent(session.crumb)}`;
    const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=10y&interval=1d&events=history&crumb=${encodeURIComponent(session.crumb)}`;

    const headers = {
      "User-Agent": session.userAgent,
      Cookie: session.cookie,
      Accept: "application/json,text/plain,*/*",
      Referer: `https://finance.yahoo.com/quote/${encodeURIComponent(ticker)}`,
    };
    const [summaryResponse, chartResponse] = await Promise.all([
      fetch(summaryUrl, { headers, cache: "no-store" }),
      fetch(chartUrl, { headers, cache: "no-store" }),
    ]);

    if (!summaryResponse.ok) {
      const detail = await summaryResponse.text().catch(() => "");
      throw new Error(`Yahoo Finance returned ${summaryResponse.status}${detail ? `: ${detail.slice(0, 120)}` : ""}`);
    }
    const summaryJson = await summaryResponse.json();
    const root = summaryJson?.quoteSummary?.result?.[0];
    if (!root) throw new Error(summaryJson?.quoteSummary?.error?.description || "Ticker data was not found.");

    let closes = [];
    if (chartResponse.ok) {
      const chartJson = await chartResponse.json();
      closes = (chartJson?.chart?.result?.[0]?.indicators?.quote?.[0]?.close || []).filter((x) => Number.isFinite(x));
    }

    let price5yCagr = null;
    let volatility = null;
    if (closes.length > 1) {
      const years = Math.min(5 * 252, closes.length - 1);
      const start = closes[closes.length - years - 1];
      const end = closes[closes.length - 1];
      if (start > 0 && end > 0) price5yCagr = Math.pow(end / start, 1 / Math.max(years / 252, 1)) - 1;
      const returns = [];
      for (let i = 1; i < closes.length; i += 1) {
        if (closes[i - 1] > 0) returns.push(closes[i] / closes[i - 1] - 1);
      }
      if (returns.length > 10) {
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((a, b) => a + (b - mean) ** 2, 0) / (returns.length - 1);
        volatility = Math.sqrt(variance) * Math.sqrt(252);
      }
    }

    const p = root.price || {};
    const s = root.summaryDetail || {};
    const k = root.defaultKeyStatistics || {};
    const f = root.financialData || {};
    const a = root.assetProfile || {};

    const enterpriseValue = raw(k.enterpriseValue);
    const freeCashFlow = raw(f.freeCashflow);

    return NextResponse.json({
      ticker,
      company_name: text(p.longName) || text(p.shortName) || ticker,
      sector: text(a.sector) || "Unknown",
      industry: text(a.industry) || "Unknown",
      current_price: raw(f.currentPrice) ?? raw(p.regularMarketPrice),
      market_cap: raw(p.marketCap),
      trailing_pe: raw(s.trailingPE),
      forward_pe: raw(k.forwardPE),
      peg: raw(k.pegRatio),
      price_to_sales: raw(s.priceToSalesTrailing12Months),
      price_to_book: raw(k.priceToBook),
      enterprise_to_ebitda: raw(k.enterpriseToEbitda),
      free_cash_flow: freeCashFlow,
      enterprise_value: enterpriseValue,
      ev_to_fcf: enterpriseValue && freeCashFlow > 0 ? enterpriseValue / freeCashFlow : null,
      revenue_growth: raw(f.revenueGrowth),
      earnings_growth: raw(f.earningsGrowth) ?? raw(k.earningsQuarterlyGrowth),
      gross_margin: raw(f.grossMargins),
      operating_margin: raw(f.operatingMargins),
      profit_margin: raw(f.profitMargins),
      roe: raw(f.returnOnEquity),
      roa: raw(f.returnOnAssets),
      debt_to_equity: raw(f.debtToEquity),
      current_ratio: raw(f.currentRatio),
      quick_ratio: raw(f.quickRatio),
      dividend_growth: raw(s.fiveYearAvgDividendYield) ? null : raw(k.dividendYield),
      payout_ratio: raw(s.payoutRatio),
      short_percent_float: raw(k.shortPercentOfFloat),
      held_percent_institutions: raw(k.heldPercentInstitutions),
      held_percent_insiders: raw(k.heldPercentInsiders),
      recommendation_mean: raw(f.recommendationMean),
      target_mean_price: raw(f.targetMeanPrice),
      beta: raw(k.beta),
      price_5y_cagr: price5yCagr,
      volatility,
      analyst_count: raw(f.numberOfAnalystOpinions),
      currency: text(p.currency) || "USD",
    });
  } catch (error) {
    return NextResponse.json({ error: error.message || "Unable to load market data." }, { status: 502 });
  }
}
