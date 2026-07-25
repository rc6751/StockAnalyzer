"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

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
const money=(v)=>v===null||v===undefined?"N/A":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(v);
const displayValue=(name,v)=>{if(v===null||v===undefined)return"N/A"; if(typeof v==="number"&&v>=-1&&v<=1&&/growth|margin|return|ownership|interest|upside|safety|resilience|tailwind|outlook/i.test(name))return`${(v*100).toFixed(1)}%`; return typeof v==="number"?v.toLocaleString("en-US",{maximumFractionDigits:2}):String(v)};

export default function ScorecardPage(){
  const [ticker,setTicker]=useState("AAPL"),[data,setData]=useState(null),[macro]=useState(initialMacro),[status,setStatus]=useState("Ready"),[tab,setTab]=useState("Overview"),[loading,setLoading]=useState(false);
  const [rankings,setRankings]=useState({dow:[],nasdaq:[],sp500:[]}),[scanStatus,setScanStatus]=useState({}),[scanProgress,setScanProgress]=useState({}),[scanUpdated,setScanUpdated]=useState({});
  const cancelRef=useRef({});
  const result=useMemo(()=>data?analyze(data,macro):null,[data,macro]);
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("stockAnalyzerTop10")||"{}");if(saved.rankings)setRankings(saved.rankings);if(saved.updated)setScanUpdated(saved.updated)}catch{}},[]);
  const persist=(next,updated)=>{try{localStorage.setItem("stockAnalyzerTop10",JSON.stringify({rankings:next,updated}))}catch{}};
  const run=async(symbolOverride)=>{const symbol=(symbolOverride||ticker).trim().toUpperCase();if(!symbol)return;setLoading(true);setStatus("Loading market data…");try{const r=await fetch(`/api/stock?ticker=${encodeURIComponent(symbol)}`);const j=await r.json();if(!r.ok)throw new Error(j.error||"Data load failed");setData(j);setTicker(symbol);setTab("Overview");setStatus("Analysis complete");}catch(e){setStatus("Data load failed");alert(`Could not load ${symbol}.\n\n${e.message}`);}finally{setLoading(false)}};
  const exportReport=()=>{if(!result)return alert("Run an analysis first.");const payload={...result,ticker:data.ticker,company_name:data.company_name,horizon:HORIZON,generated_at:new Date().toISOString(),raw_metrics:data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${data.ticker}_long_term_analysis.json`;a.click();URL.revokeObjectURL(url)};
  const scanMarket=async market=>{
    if(scanStatus[market]==="Scanning")return;
    cancelRef.current[market]=false;setScanStatus(x=>({...x,[market]:"Scanning"}));setScanProgress(x=>({...x,[market]:{done:0,total:0}}));
    try{
      const listResponse=await fetch(`/api/markets?market=${market}`),listJson=await listResponse.json();if(!listResponse.ok)throw new Error(listJson.error||"Could not load constituents.");
      const symbols=listJson.tickers||[];setScanProgress(x=>({...x,[market]:{done:0,total:symbols.length}}));
      const scored=[];let cursor=0,done=0;
      const worker=async()=>{while(cursor<symbols.length&&!cancelRef.current[market]){const symbol=symbols[cursor++];try{const response=await fetch(`/api/stock?ticker=${encodeURIComponent(symbol)}`);const stock=await response.json();if(response.ok){const score=analyze(stock,macro);scored.push({ticker:stock.ticker,company_name:stock.company_name,total:score.total,grade:score.grade,recommendation:score.recommendation,current_price:stock.current_price,fair_value:score.fairValue,mos:score.mos});}}catch{}finally{done+=1;setScanProgress(x=>({...x,[market]:{done,total:symbols.length}}));}}};
      await Promise.all(Array.from({length:market==="sp500"?3:4},worker));
      if(cancelRef.current[market]){setScanStatus(x=>({...x,[market]:"Stopped"}));return;}
      const top=scored.sort((a,b)=>b.total-a.total).slice(0,10),updated=new Date().toISOString();
      setRankings(prev=>{const next={...prev,[market]:top};const nextUpdated={...scanUpdated,[market]:updated};persist(next,nextUpdated);return next});setScanUpdated(prev=>({...prev,[market]:updated}));setScanStatus(x=>({...x,[market]:`Complete — ${scored.length} scored`}));
    }catch(e){setScanStatus(x=>({...x,[market]:"Scan failed"}));alert(e.message||"Market scan failed.");}
  };
  const stopScan=market=>{cancelRef.current[market]=true};
  const mainTabs=["Overview","Dow Top 10","NASDAQ Top 10","S&P Top 10"];
  const marketForTab={"Dow Top 10":"dow","NASDAQ Top 10":"nasdaq","S&P Top 10":"sp500"};
  return <main style={{minHeight:"100vh",background:COLORS.bg,color:COLORS.text,fontFamily:"Arial, sans-serif"}}>
    <header style={{padding:"16px 18px 8px",display:"flex",alignItems:"baseline",gap:16,flexWrap:"wrap"}}><h1 style={{margin:0,fontSize:30}}>Stock Analyzer</h1><span style={{color:COLORS.muted}}>Investment scorecard</span><Link href="/" style={{marginLeft:"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",minWidth:112,padding:"12px 22px",background:"#FFFFFF",color:"#000000",fontSize:17,fontWeight:800,textDecoration:"none",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,.22)"}}>Home</Link></header>
    <section style={{margin:"8px 18px",padding:14,background:COLORS.panel,borderRadius:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><strong>Ticker</strong><input value={ticker} onChange={e=>setTicker(e.target.value)} onKeyDown={e=>e.key==="Enter"&&run()} style={{width:130,padding:"9px 10px",fontSize:18,fontWeight:700,background:COLORS.panel2,color:COLORS.text,border:"1px solid #354055",borderRadius:5}}/><button onClick={()=>run()} disabled={loading} style={{...buttonStyle,background:COLORS.accent}}>{loading?"Analyzing…":"Analyze"}</button><span style={{marginLeft:"auto",fontWeight:700}}>{status}</span><button onClick={exportReport} style={buttonStyle}>Export Report</button></section>
    <div style={{display:"grid",gridTemplateColumns:"minmax(260px,300px) minmax(0,1fr)",gap:10,padding:"4px 18px 18px"}}>
      <aside style={{background:COLORS.panel,padding:14,borderRadius:8}}><h3 style={{margin:"0 0 14px"}}>Stock Score Breakdown</h3>{CAPS&&Object.entries(CAPS).map(([name,max])=>{const categoryScore=result?.categories.find(c=>c.name===name)?.score??0;const pct=Math.max(0,Math.min(100,(categoryScore/max)*100));return <div key={name} style={{marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"minmax(105px,1fr) auto",gap:10,alignItems:"center",marginBottom:6,fontWeight:700,fontSize:14}}><span>{name}</span><span>{result?categoryScore.toFixed(1):"—"}</span></div><div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 28px",gap:9,alignItems:"center"}}><div role="progressbar" aria-label={`${name} score`} aria-valuemin="0" aria-valuemax={max} aria-valuenow={result?categoryScore:0} style={{height:10,background:COLORS.panel2,borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:`${result?pct:0}%`,background:COLORS.accent,borderRadius:20}}/></div><span style={{fontWeight:800,textAlign:"right"}}>{max}</span></div></div>})}</aside>
      <section style={{minWidth:0}}><div style={{display:"grid",gridTemplateColumns:"repeat(5,minmax(120px,1fr))",gap:10,marginBottom:10}}>{[["Total Score",result?`${result.total.toFixed(1)}/100`:"—"],["Grade",result?.grade||"—"],["View",result?.recommendation||"—"],["Current Price",data?money(data.current_price):"—"],["Fair Value",result?money(result.fairValue):"—"]].map(([title,value],i)=><div key={title} style={{background:COLORS.panel,padding:14,textAlign:"center",borderRadius:8,minHeight:78}}><div style={{fontWeight:700}}>{title}</div><div style={{fontSize:i===0?28:18,fontWeight:800,color:i===0?COLORS.accent:COLORS.text,marginTop:10}}>{value}</div></div>)}</div>
      <div style={{display:"flex",background:COLORS.panel2,borderRadius:"8px 8px 0 0",overflowX:"auto"}}>{mainTabs.map(t=><button key={t} onClick={()=>setTab(t)} style={{...buttonStyle,borderRadius:0,background:tab===t?COLORS.accent:COLORS.panel2,padding:"11px 16px",whiteSpace:"nowrap"}}>{t}</button>)}</div>
      <div style={{background:COLORS.panel,minHeight:480,padding:16,borderRadius:"0 0 8px 8px",overflow:"auto"}}>{marketForTab[tab]?<TopTen market={marketForTab[tab]} rows={rankings[marketForTab[tab]]||[]} status={scanStatus[marketForTab[tab]]} progress={scanProgress[marketForTab[tab]]} updated={scanUpdated[marketForTab[tab]]} onScan={scanMarket} onStop={stopScan} onOpen={run}/>:!result?<p>Run an analysis to view the scorecard.</p>:tab==="Overview"?<Overview data={data} result={result}/>:tab==="Score Breakdown"?<Breakdown result={result}/>:<pre style={{whiteSpace:"pre-wrap",fontFamily:"Courier New",fontSize:13}}>{JSON.stringify(data,null,2)}</pre>}</div></section>
    </div><style jsx global>{`@media(max-width:900px){main>div{grid-template-columns:1fr!important} section>div:first-child{grid-template-columns:repeat(2,minmax(130px,1fr))!important}} button:hover{filter:brightness(1.08)} button:disabled{opacity:.55;cursor:not-allowed} input[type=range]{accent-color:${COLORS.accent}}`}</style>
  </main>
}
function TopTen({market,rows,status,progress,updated,onScan,onStop,onOpen}){const labels={dow:"Dow Jones 30",nasdaq:"NASDAQ-100",sp500:"S&P 500"},scanning=status==="Scanning",pct=progress?.total?Math.round(progress.done/progress.total*100):0;return <div><div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:14}}><div><h2 style={{margin:"0 0 4px"}}>{labels[market]} — Top 10</h2><div style={{color:COLORS.muted}}>Ranks every available constituent with the same 100-point scorecard. Cached results remain until refreshed.</div></div><button onClick={()=>onScan(market)} disabled={scanning} style={{...buttonStyle,background:COLORS.accent,marginLeft:"auto"}}>{rows.length?"Refresh Scan":"Run Full Scan"}</button>{scanning&&<button onClick={()=>onStop(market)} style={{...buttonStyle,background:COLORS.bad}}>Stop</button>}</div>{scanning&&<div style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontWeight:700}}><span>Scanning constituents…</span><span>{progress?.done||0}/{progress?.total||0} ({pct}%)</span></div><div style={{height:10,background:COLORS.panel2,borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:COLORS.accent}}/></div></div>}<div style={{display:"flex",gap:16,color:COLORS.muted,fontSize:13,marginBottom:12}}><span>Status: {status||"Not scanned"}</span><span>Updated: {updated?new Date(updated).toLocaleString():"Never"}</span></div>{!rows.length?<div style={{padding:"50px 20px",textAlign:"center",background:COLORS.panel2,borderRadius:8}}><h3>No ranking cached</h3><p>Run the full scan to calculate the ten highest scores in this index.</p></div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:980}}><thead><tr>{["Rank","Ticker","Company","Score","Grade","View","Price","Fair Value","Margin of Safety","Action"].map(h=><th key={h} style={cell(true)}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.ticker}><td style={cell()}><strong>{i+1}</strong></td><td style={cell()}><strong style={{color:COLORS.accent}}>{r.ticker}</strong></td><td style={cell()}>{r.company_name}</td><td style={cell()}><strong>{Number(r.total).toFixed(1)}</strong></td><td style={cell()}>{r.grade}</td><td style={cell()}>{r.recommendation}</td><td style={cell()}>{money(r.current_price)}</td><td style={cell()}>{money(r.fair_value)}</td><td style={cell()}>{r.mos===null||r.mos===undefined?"N/A":`${(r.mos*100).toFixed(1)}%`}</td><td style={cell()}><button onClick={()=>onOpen(r.ticker)} style={{...buttonStyle,padding:"7px 10px"}}>Open Scorecard</button></td></tr>)}</tbody></table></div>}<p style={{color:COLORS.muted,fontSize:12,marginTop:14}}>Scanning hundreds of stocks can take several minutes and may be affected by Yahoo Finance rate limits. Rankings are a quantitative screen, not personalized financial advice.</p></div>}

const buttonStyle={border:0,cursor:"pointer",padding:"9px 13px",fontSize:14,fontWeight:800,borderRadius:5,background:"#30394A",color:"white"};
function Overview({data,result}){const mos=result.mos===null?"N/A":`${(result.mos*100).toFixed(1)}%`;return <div style={{lineHeight:1.6}}><h2 style={{marginTop:0}}>{data.company_name} ({data.ticker})</h2><div>Generated: {new Date().toLocaleString()}</div><div>Investment approach: {HORIZON}</div><div>Model confidence: {result.confidence}</div><h3>TOTAL SCORE: {result.total.toFixed(1)}/100 &nbsp; | &nbsp; GRADE: {result.grade} &nbsp; | &nbsp; VIEW: {result.recommendation}</h3><div>Current price: {money(data.current_price)}</div><div>Estimated fair value: {money(result.fairValue)}</div><div>Margin of safety: {mos}</div><h3>CATEGORY SCORES</h3>{result.categories.map(c=><div key={c.name}>• {c.name}: {c.score.toFixed(1)}/{c.max}</div>)}<h3>STRENGTHS</h3>{result.strengths.map(x=><div key={x}>• {x}</div>)}<h3>WEAKNESSES</h3>{result.weaknesses.map(x=><div key={x}>• {x}</div>)}<h3>KEY RISKS</h3>{result.risks.map(x=><div key={x}>• {x}</div>)}<h3>INVESTMENT THESIS</h3><p>{result.thesis}</p></div>}
function Breakdown({result}){return <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:850}}><thead><tr>{["Category","Metric","Value","Points","Max","Why"].map(h=><th key={h} style={cell(true)}>{h}</th>)}</tr></thead><tbody>{result.categories.flatMap(c=>c.metrics.map(m=><tr key={`${c.name}-${m.name}`}><td style={cell()}>{c.name}</td><td style={cell()}>{m.name}</td><td style={cell()}>{displayValue(m.name,m.value)}</td><td style={cell()}>{m.points.toFixed(2)}</td><td style={cell()}>{m.max}</td><td style={cell()}>{m.explanation}</td></tr>))}</tbody></table></div>}
const cell=(head=false)=>({padding:"9px",borderBottom:"1px solid #303848",textAlign:"left",background:head?COLORS.panel2:"transparent",fontWeight:head?800:400,verticalAlign:"top"});
