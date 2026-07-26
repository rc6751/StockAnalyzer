"use client";
import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const HORIZON = "Multi-year";
const CAPS = { Valuation: 20, Growth: 20, Moat: 20, "Execution Risk": 10, Sentiment: 10, Macro: 20 };
const COLORS = { bg: "#10131A", panel: "#181D27", panel2: "#222938", text: "#F2F5FA", muted: "#AAB4C3", accent: "#4EA1FF", good: "#35C48D", warn: "#F6B94A", bad: "#F06A6A" };

const clamp = (v, low, high) => Math.max(low, Math.min(high, v));
const num = (v) => (v === null || v === undefined || !Number.isFinite(Number(v)) ? null : Number(v));
const round = (v) => Math.round(v * 100) / 100;
const lowerBetter = (value, tiers, max) => {
  value = num(value); if (value === null || value <= 0) return 0;
  for (const [threshold, fraction] of tiers) if (value <= threshold) return round(max * fraction);
  return 0;
};
const growthPoints = (value, max) => {
  value = num(value); if (value === null) return 0;
  if (value >= .20) return max; if (value >= .15) return max * .9; if (value >= .10) return max * .75;
  if (value >= .05) return max * .5; if (value > 0) return max * .25; return 0;
};
const qualityPoints = (value, thresholds, max) => {
  value = num(value); if (value === null) return 0;
  for (const [threshold, fraction] of thresholds) if (value >= threshold) return round(max * fraction);
  return 0;
};
const metric = (name, value, points, max, explanation) => ({ name, value, points: round(points), max, explanation });
const category = (name, metrics, max) => ({ name, metrics, max, score: round(metrics.reduce((s, m) => s + m.points, 0)) });

const scoreCompetitiveMoat = (d) => {
  const profile = `${d.company_name || ""} ${d.sector || ""} ${d.industry || ""} ${d.business_summary || ""}`.toLowerCase();
  const hasAny = (terms) => terms.some((term) => profile.includes(term));

  // This category measures duplication difficulty only; financial performance and ownership are scored elsewhere.
  if (hasAny([
    "proprietary platform", "proprietary technology", "patent-protected", "patented technology",
    "exclusive license", "exclusive rights", "sole-source", "only provider", "only manufacturer",
    "advanced lithography", "operating system ecosystem", "payment network"
  ])) {
    return { score: 20, label: "Cannot realistically duplicate", explanation: "The available company profile indicates a product, service, technology, platform, or ecosystem that competitors cannot realistically duplicate over a multi-year period." };
  }
  if (hasAny([
    "network effect", "ecosystem", "proprietary", "patent", "mission-critical", "switching costs",
    "installed base", "regulatory approval", "certified", "specialized technology", "unique technology"
  ])) {
    return { score: 15, label: "Very difficult to duplicate", explanation: "The available company profile indicates an advantage that would be very difficult for competitors to duplicate over a multi-year period." };
  }
  if (hasAny([
    "platform", "technology", "software", "brand", "subscription", "integrated", "specialized",
    "differentiated", "marketplace", "service network"
  ])) {
    return { score: 10, label: "Differentiated", explanation: "The business appears differentiated, but competitors could potentially catch up or offer a substitute." };
  }
  if (hasAny([
    "retail", "restaurant", "apparel", "consumer products", "consulting", "distribution",
    "manufacturing", "transportation", "construction", "real estate"
  ])) {
    return { score: 5, label: "Easy to copy or substitute", explanation: "The product or service appears comparatively easy for competitors to copy or substitute." };
  }
  return { score: 0, label: "No verified non-duplicable advantage", explanation: "The available company profile does not verify a product or service that competitors cannot realistically duplicate over a multi-year period." };
};

function fairValue(d) {
  const price = num(d.current_price), pe = num(d.forward_pe) ?? num(d.trailing_pe), growth = num(d.earnings_growth), target = num(d.target_mean_price);
  const estimates = [];
  if (price && pe && pe > 0) {
    const eps = price / pe, growthPct = clamp((growth ?? .08) * 100, 5, 20), justifiedPe = clamp(10 + growthPct * .75, 12, 25);
    estimates.push(eps * justifiedPe);
  }
  if (target && target > 0) estimates.push(target);
  return estimates.length ? estimates.reduce((a, b) => a + b, 0) / estimates.length : null;
}
function analyze(d, macro) {
  let items = [];
  const pe = num(d.forward_pe) ?? num(d.trailing_pe);
  items.push(metric("P/E and Forward P/E", pe, lowerBetter(pe, [[12,1],[18,.85],[25,.6],[35,.3]],4),4,"Lower positive earnings multiples receive more points."));
  items.push(metric("PEG Ratio", d.peg, lowerBetter(d.peg, [[1,1],[1.5,.8],[2,.55],[3,.25]],3),3,"Rewards growth purchased at a reasonable multiple."));
  items.push(metric("EV / Free Cash Flow", d.ev_to_fcf, lowerBetter(d.ev_to_fcf, [[15,1],[22,.75],[30,.45],[40,.2]],4),4,"Cash-flow valuation is favored over accounting earnings alone."));
  items.push(metric("EV / EBITDA", d.enterprise_to_ebitda, lowerBetter(d.enterprise_to_ebitda, [[10,1],[15,.75],[22,.4],[30,.2]],3),3,"Lower enterprise-value multiples score better."));
  const fv = fairValue(d), price = num(d.current_price), mos = !fv || !price ? null : (fv-price)/fv;
  const mosPoints = mos === null ? 0 : mos >= .30 ? 4 : mos >= .15 ? 3.25 : mos >= 0 ? 2 : mos >= -.15 ? 1 : 0;
  items.push(metric("Fair Value Margin of Safety", mos, mosPoints,4,"A larger discount to estimated fair value earns more points."));
  const candidates = [num(d.price_to_sales), num(d.price_to_book)].filter((x) => x && x > 0), candidate = candidates.length ? Math.min(...candidates) : null;
  items.push(metric("Price / Sales or Price / Book", candidate, lowerBetter(candidate, [[2,1],[4,.75],[7,.4],[12,.2]],2),2,"Uses the more favorable available asset or sales multiple."));
  const categories = [category("Valuation", items, 20)];

  const revenue = num(d.revenue_growth), earnings = num(d.earnings_growth), knownGrowth = [revenue, earnings].filter((x) => x !== null);
  const fcfProxy = knownGrowth.length ? knownGrowth.reduce((a,b)=>a+b,0)/knownGrowth.length : null;
  const positive = [revenue, earnings, fcfProxy].filter((x)=>x !== null && x > 0).length, known = [revenue, earnings, fcfProxy].filter((x)=>x !== null).length;
  items = [
    metric("Revenue Growth", revenue, growthPoints(revenue,5),5,"Sustained top-line growth supports compounding."),
    metric("EPS Growth", earnings, growthPoints(earnings,5),5,"Earnings growth is weighted heavily for an investment holding period."),
    metric("Free Cash Flow Growth Proxy", fcfProxy, growthPoints(fcfProxy,4),4,"Uses available revenue and earnings growth as a conservative cash-flow proxy."),
    metric("Market Compounding", d.price_5y_cagr, growthPoints(d.price_5y_cagr,2),2,"Five-year price CAGR is a supporting, not dominant, signal."),
    metric("Dividend Growth", d.dividend_growth, growthPoints(d.dividend_growth,2),2,"Dividend growers receive credit; non-payers are not automatically penalized beyond this item."),
    metric("Growth Consistency", known ? positive/known : null, known ? 2*positive/known : 0,2,"Rewards multiple growth measures moving in the same positive direction."),
  ]; categories.push(category("Growth", items,20));

  const institutions=num(d.held_percent_institutions);
  const moat=scoreCompetitiveMoat(d);
  items=[metric("Competitive Moat",moat.label,moat.score,20,moat.explanation)];
  categories.push(category("Moat",items,20));

  const debt=num(d.debt_to_equity), current=num(d.current_ratio), fcf=num(d.free_cash_flow), vol=num(d.volatility);
  const debtPts=debt===null?0:debt<=50?2.5:debt<=100?2:debt<=175?1:0, currentPts=current===null?0:current>=1.5?2:current>=1?1.25:current>=.75?.5:0;
  const volPts=vol===null?0:vol<=.25?1.5:vol<=.40?1:vol<=.60?.5:0;
  items=[metric("Debt Discipline",debt,debtPts,2.5,"Lower debt relative to equity reduces execution risk."),metric("Liquidity",current,currentPts,2,"A stronger current ratio provides operating flexibility."),metric("Free Cash Flow Execution",fcf,fcf!==null&&fcf>0?2:0,2,"Positive free cash flow supports self-funded execution."),metric("Earnings Execution",earnings,earnings!==null&&earnings>0?2:earnings!==null&&earnings>-.05?1:0,2,"Positive earnings momentum earns full credit."),metric("Business / Market Stability Proxy",vol,volPts,1.5,"Lower volatility earns modest risk-control credit.")];
  categories.push(category("Execution Risk",items,10));

  const rec=num(d.recommendation_mean), target=num(d.target_mean_price), insiders=num(d.held_percent_insiders), shortFloat=num(d.short_percent_float), upside=!target||!price?null:(target-price)/price;
  const recPts=rec===null?0:rec<=1.8?2:rec<=2.3?1.5:rec<=3?1:rec<=3.5?.5:0, upPts=upside===null?0:upside>=.25?2:upside>=.10?1.5:upside>=0?1:upside>=-.10?.5:0;
  const shortPts=shortFloat===null?0:shortFloat<=.03?2:shortFloat<=.07?1.5:shortFloat<=.12?.75:0;
  items=[metric("Analyst Consensus",rec,recPts,2,"Lower recommendation means generally indicate stronger analyst sentiment."),metric("Analyst Target Upside",upside,upPts,2,"Consensus target upside is capped to avoid dominating fundamentals."),metric("Institutional Ownership",institutions,qualityPoints(institutions,[[.75,1],[.50,.75],[.30,.5],[.10,.25]],2),2,"Institutional sponsorship can support liquidity and market confidence."),metric("Insider Alignment",insiders,qualityPoints(insiders,[[.10,1],[.05,.75],[.02,.5],[.005,.25]],2),2,"Meaningful insider ownership can align management with shareholders."),metric("Short Interest",shortFloat,shortPts,2,"Lower short interest earns more points.")];
  categories.push(category("Sentiment",items,10));

  items=[metric("Industry Growth Outlook",macro.industry,macro.industry,4,"User assessment of the industry's growth runway."),metric("Interest Rate Resilience",macro.rates,macro.rates,3,"Higher scores indicate lower sensitivity to financing costs."),metric("Economic Cycle Resilience",macro.cycle,macro.cycle,4,"Rewards demand that can persist through recessions."),metric("Geopolitical / Regulatory Resilience",macro.regulation,macro.regulation,3,"Higher scores indicate lower structural policy and geopolitical risk."),metric("Currency / Commodity Resilience",macro.currency,macro.currency,2,"Rewards limited exposure or strong hedging ability."),metric("Secular Tailwinds",macro.tailwinds,macro.tailwinds,4,"Rewards durable multi-year demand drivers.")];
  categories.push(category("Macro",items,20));

  const total=round(categories.reduce((s,c)=>s+c.score,0));
  const grade=total>=92?"A+":total>=87?"A":total>=82?"A-":total>=77?"B+":total>=72?"B":total>=67?"B-":total>=62?"C+":total>=57?"C":total>=52?"C-":total>=45?"D":"F";
  const recommendation=total>=80&&mos!==null&&mos>=.15?"STRONG BUY":total>=72&&(mos===null||mos>=0)?"BUY":total>=58?"HOLD / WATCH":total>=45?"CAUTION":"AVOID";
  const metricValues=categories.filter(c=>c.name!=="Macro").flatMap(c=>c.metrics.map(m=>m.value)), available=metricValues.filter(v=>v!==null&&v!==undefined).length, pct=available/Math.max(metricValues.length,1), confidence=pct>=.85?"High":pct>=.65?"Moderate":"Low";
  const strengths=categories.filter(c=>c.score/c.max>=.75).map(c=>`${c.name}: ${c.score.toFixed(1)}/${c.max}`), weaknesses=categories.filter(c=>c.score/c.max<.45).map(c=>`${c.name}: ${c.score.toFixed(1)}/${c.max}`);
  const risks=[]; if(debt!==null&&debt>150)risks.push("Elevated debt-to-equity may reduce flexibility during a downturn."); if(shortFloat!==null&&shortFloat>.10)risks.push("High short interest signals meaningful market skepticism."); if(revenue!==null&&revenue<0)risks.push("Revenue is currently contracting."); if(earnings!==null&&earnings<0)risks.push("Earnings momentum is negative."); if(mos!==null&&mos<-.15)risks.push("Shares appear materially above the model's fair-value estimate."); if(!risks.length)risks.push("No single quantitative red flag dominates, but qualitative company-specific risks still require review.");
  return { categories,total,grade,recommendation,confidence,fairValue:fv,mos,strengths:strengths.length?strengths:["No category reached the high-conviction threshold."],weaknesses:weaknesses.length?weaknesses:["No category fell below the risk threshold."],risks,thesis:`${d.company_name||d.ticker} scores ${total.toFixed(1)}/100 for a ${HORIZON} holding period. The model emphasizes valuation, durable growth, competitive advantage, execution quality, market sentiment, and macro conditions. Recommendation: ${recommendation}. This is a screening opinion, not personalized financial advice.`};
}

const initialMacro={industry:2,rates:1.5,cycle:2,regulation:1.5,currency:1,tailwinds:2};


const PRESET_STOCKS = ["NVDA","TSM","META","QQQ","VOO","MRVL","AMZN","UNH","MU","HOOD","PGR","ADBE","BAC","ASML","AMD","CELH","SCHW","MSFT"];
const BREAKDOWN_COLUMNS = ["Valuation","Growth","Moat","Execution Risk","Sentiment","Macro"];

export default function Home() {
  const router = useRouter();
  const [markets, setMarkets] = React.useState([]);
  const [stocks, setStocks] = React.useState(PRESET_STOCKS);
  const [rows, setRows] = React.useState([]);
  const [newTicker, setNewTicker] = React.useState("");
  const [status, setStatus] = React.useState("Loading stock scores…");
  const [loading, setLoading] = React.useState(false);
  const [storageReady, setStorageReady] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/markets").then(r => r.json()).then(d => setMarkets(d.markets || [])).catch(() => {});
    try {
      const storedV2 = localStorage.getItem("stockAnalyzerWatchlistV2");
      if (storedV2 !== null) {
        const saved = JSON.parse(storedV2);
        if (Array.isArray(saved)) setStocks([...new Set(saved)]);
      } else {
        // Migrate the older watchlist without losing the built-in preset stocks.
        const legacyStored = localStorage.getItem("stockAnalyzerWatchlist");
        const legacySaved = legacyStored === null ? [] : JSON.parse(legacyStored);
        const migrated = [...new Set([...PRESET_STOCKS, ...(Array.isArray(legacySaved) ? legacySaved : [])])];
        setStocks(migrated);
        localStorage.setItem("stockAnalyzerWatchlistV2", JSON.stringify(migrated));
      }
    } catch {
      setStocks(PRESET_STOCKS);
    }
    setStorageReady(true);
  }, []);

  const loadScores = React.useCallback(async (symbols) => {
    setLoading(true);
    setStatus(`Scoring 0 of ${symbols.length} stocks…`);
    let completed = 0;
    const results = [];
    const queue = [...symbols];

    const worker = async () => {
      while (queue.length) {
        const ticker = queue.shift();
        try {
          const response = await fetch(`/api/stock?ticker=${encodeURIComponent(ticker)}`);
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Data load failed");
          const result = analyze(data, initialMacro);
          const scores = Object.fromEntries(result.categories.map(category => [category.name, category.score]));
          results.push({ ticker, total: result.total, scores });
        } catch (error) {
          results.push({ ticker, error: error.message || "Unable to score" });
        } finally {
          completed += 1;
          setStatus(`Scoring ${completed} of ${symbols.length} stocks…`);
          setRows([...results].sort((a, b) => (b.total ?? -1) - (a.total ?? -1)));
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(3, symbols.length) }, worker));
    const successful = results.filter(row => !row.error).length;
    setRows([...results].sort((a, b) => (b.total ?? -1) - (a.total ?? -1)));
    setStatus(`Loaded ${successful} of ${symbols.length} stock scores`);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (storageReady) loadScores(stocks);
  }, [stocks, loadScores, storageReady]);

  const addStock = (event) => {
    event.preventDefault();
    const ticker = newTicker.trim().toUpperCase();
    if (!/^[A-Z0-9.^=-]{1,15}$/.test(ticker) || stocks.includes(ticker)) return;
    const next = [...stocks, ticker];
    setStocks(next);
    setNewTicker("");
    try { localStorage.setItem("stockAnalyzerWatchlistV2", JSON.stringify(next)); } catch {}
  };

  const openStock = (ticker) => {
    try { localStorage.setItem("stockAnalyzerSelectedTicker", ticker); } catch {}
    router.push("/scorecard");
  };

  const deleteStock = (ticker) => {
    const next = stocks.filter(symbol => symbol !== ticker);
    setStocks(next);
    setRows(current => current.filter(row => row.ticker !== ticker));
    try { localStorage.setItem("stockAnalyzerWatchlistV2", JSON.stringify(next)); } catch {}
  };

  const cell = (header = false) => ({
    padding: "11px 12px", borderBottom: "1px solid #dce5f0", textAlign: "center", verticalAlign: "middle",
    background: header ? "#eef4fb" : "#ffffff", fontWeight: header ? 800 : 700, whiteSpace: "nowrap"
  });

  return (
    <main style={{ minHeight:"100vh", boxSizing:"border-box", padding:"20px 24px 28px", fontFamily:"Arial, sans-serif", color:"#13233a", background:"#ffffff" }}>
      <div style={{ width:"100%", maxWidth:"1380px", margin:"0 auto" }}>
        <section aria-label="Market snapshot" style={{ padding:"0 0 24px" }}>
          <h2 style={{ margin:"0 0 14px", fontSize:24 }}>Market Snapshot</h2>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit, minmax(128px, 1fr))", gap:10 }}>
            {markets.map(market => {
              const positive=(market.change||0)>=0, movementColor=positive?"#16813a":"#c13d3d";
              return <article key={market.name} style={{minWidth:0,padding:"13px 14px",border:"1px solid #dce5f0",borderRadius:10,background:"#fff",boxShadow:"0 4px 13px rgba(25,54,91,.08)"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:7}}><span style={{color:movementColor,fontSize:14,fontWeight:800}}>{market.name}</span><span style={{color:"#8290a3",fontSize:11,fontWeight:700}}>{market.symbol}</span></div>
                <div style={{marginTop:8,color:"#111",fontSize:18,fontWeight:800}}>{market.price==null?"--":market.price.toLocaleString(undefined,{maximumFractionDigits:2})}</div>
                <div style={{marginTop:6,color:movementColor,fontSize:12,fontWeight:800}}>{market.change==null?"--":`${market.change>=0?"▲":"▼"} ${market.change.toFixed(2)} (${market.percent?.toFixed(2)}%)`}</div>
              </article>;
            })}
          </div>
        </section>

        <section style={{padding:20,border:"1px solid #dce5f0",borderRadius:14,boxShadow:"0 8px 24px rgba(25,54,91,.10)",background:"#fff"}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:16,flexWrap:"wrap",marginBottom:14}}>
            <div><h1 style={{margin:0,fontSize:28}}>Stock Score List</h1><div style={{marginTop:5,color:"#66758a",fontWeight:700}}>{status}</div></div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
              <form onSubmit={addStock} style={{display:"flex",gap:8}}>
                <input value={newTicker} onChange={e=>setNewTicker(e.target.value)} placeholder="Add ticker" aria-label="Add ticker" style={{width:120,padding:"10px 12px",border:"1px solid #b9c7d8",borderRadius:8,fontSize:15,fontWeight:700,textTransform:"uppercase"}} />
                <button type="submit" style={{border:0,borderRadius:8,padding:"10px 15px",background:"#16813a",color:"white",fontWeight:800,cursor:"pointer"}}>Add Stock</button>
              </form>
              <button onClick={()=>loadScores(stocks)} disabled={loading} style={{border:0,borderRadius:8,padding:"10px 15px",background:"#073b78",color:"white",fontWeight:800,cursor:loading?"default":"pointer",opacity:loading?.65:1}}>Refresh Scores</button>
              <Link href="/scorecard" style={{padding:"10px 15px",borderRadius:8,background:"#30394a",color:"white",fontWeight:800,textDecoration:"none"}}>Open Scorecard</Link>
            </div>
          </div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed",minWidth:920}}>
              <thead><tr><th style={cell(true)}>Stock</th><th style={cell(true)}>Score</th>{BREAKDOWN_COLUMNS.map(name=><th key={name} style={cell(true)}>{name}</th>)}<th style={cell(true)}>Action</th></tr></thead>
              <tbody>{rows.map(row=><tr key={row.ticker} onClick={()=>openStock(row.ticker)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openStock(row.ticker);}}} tabIndex={0} role="link" aria-label={`Open ${row.ticker} on scorecard`} style={{cursor:"pointer"}}>
                <td style={{...cell(),color:"#073b78",fontWeight:900,textDecoration:"underline"}}>{row.ticker}</td>
                {row.error ? <td colSpan={7} style={{...cell(),color:"#c13d3d"}}>{row.error}</td> : <><td style={cell()}>{row.total.toFixed(1)}</td>{BREAKDOWN_COLUMNS.map(name=><td key={name} style={cell()}>{Number(row.scores[name] ?? 0).toFixed(1)}</td>)}</>}
                <td style={cell()}><button type="button" onClick={event=>{event.stopPropagation();deleteStock(row.ticker);}} onKeyDown={event=>event.stopPropagation()} aria-label={`Delete ${row.ticker}`} style={{border:0,borderRadius:7,padding:"7px 12px",background:"#c13d3d",color:"#fff",fontWeight:800,cursor:"pointer"}}>Delete</button></td>
              </tr>)}</tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
