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

  // Funds earn their moat from low-cost, rules-based diversification rather than a single-company product advantage.
  const diversifiedFund = hasAny([
    "exchange traded fund", "exchange-traded fund", "index fund", "index trust", "s&p 500 etf",
    "qqq trust", "tracks the performance", "seeks to track", "portfolio of securities", "diversified portfolio"
  ]);
  if (diversifiedFund) {
    return {
      score: 20,
      label: "Diversified index advantage",
      explanation: "The fund combines broad diversification, rules-based exposure, liquidity, and scale. Those structural advantages are difficult for a single operating company to replicate."
    };
  }

  // Weighted evidence model. Each block represents a distinct source of durable competitive advantage.
  // No ticker symbols or company-specific score overrides are used.
  let score = 0;
  const evidence = [];
  const add = (points, label, terms) => {
    if (hasAny(terms)) { score += points; evidence.push(label); }
  };

  add(5, "intellectual property / specialized technology", [
    "semiconductor", "software", "artificial intelligence", "accelerated computing", "patent", "proprietary",
    "advanced lithography", "biotechnology", "pharmaceutical", "cloud computing", "cybersecurity", "digital media"
  ]);
  add(4, "network effects or ecosystem", [
    "network", "ecosystem", "marketplace", "social media", "social network", "payment network", "platform",
    "developer", "advertising platform", "two-sided", "community"
  ]);
  add(3, "switching costs / recurring relationships", [
    "subscription", "recurring", "mission-critical", "installed base", "enterprise software", "creative cloud",
    "customer accounts", "brokerage accounts", "asset management", "health benefits", "managed care"
  ]);
  add(3, "scale or market leadership", [
    "leading", "largest", "global", "worldwide", "market leader", "scale", "hyperscale", "foundry",
    "manufactures", "data center", "distribution network", "financial services"
  ]);
  add(2, "brand or distribution strength", [
    "brand", "consumer", "retail", "beverage", "direct-to-consumer", "distribution", "merchant", "digital wallet"
  ]);
  add(3, "regulatory, cost, or infrastructure barrier", [
    "regulatory approval", "regulated", "license", "capital intensive", "fabrication", "infrastructure",
    "insurance", "banking", "clinical", "patent-protected", "manufacturing process", "risk management"
  ]);

  score = clamp(score, 0, 20);
  const label = score >= 18 ? "Exceptional durable moat" : score >= 15 ? "Strong durable moat" : score >= 11 ? "Meaningful moat" : score >= 6 ? "Moderate differentiation" : "Limited verified moat";
  const explanation = evidence.length
    ? `Weighted moat evidence: ${evidence.join(", ")}. The score reflects multiple independent advantages and is capped at 20.`
    : "The available profile does not provide enough evidence of durable structural advantages. No ticker-based assumptions are applied.";
  return { score, label, explanation };
};

const scoreMacroEnvironment = (d) => {
  const profile = `${d.company_name || ""} ${d.sector || ""} ${d.industry || ""} ${d.business_summary || ""}`.toLowerCase();
  const hasAny = (terms) => terms.some((term) => profile.includes(term));

  // Classification is based on the company/fund profile, never on ticker symbols.
  const diversifiedFund = hasAny([
    "exchange traded fund", "exchange-traded fund", "index fund", "index trust",
    "tracks the performance", "seeks to track", "portfolio of securities", "diversified portfolio"
  ]);

  let scores = diversifiedFund
    ? { industry: 4, rates: 3, cycle: 4, regulation: 3, currency: 2, tailwinds: 4 }
    : { industry: 2, rates: 2, cycle: 2, regulation: 2, currency: 1, tailwinds: 2 };
  let label = diversifiedFund ? "Broadly diversified macro resilience" : "Balanced macro exposure";

  if (!diversifiedFund && hasAny(["software", "cloud", "subscription", "digital media", "cybersecurity", "enterprise software"])) {
    scores = { industry: 4, rates: 3, cycle: 3, regulation: 3, currency: 2, tailwinds: 4 };
    label = "Asset-light recurring technology";
  }
  if (!diversifiedFund && hasAny(["artificial intelligence", "accelerated computing", "data center", "graphics processor", "gpu"])) {
    scores = { industry: 4, rates: 3, cycle: 3, regulation: 2, currency: 1, tailwinds: 4 };
    label = "AI-led growth with policy exposure";
  }
  if (!diversifiedFund && hasAny(["semiconductor", "memory", "foundry", "lithography", "fabrication", "integrated circuits"])) {
    scores = { industry: 4, rates: 3, cycle: 2, regulation: 2, currency: 1, tailwinds: 4 };
    label = "Secular semiconductor growth with cyclicality";
  }
  if (!diversifiedFund && hasAny(["memory semiconductor", "dram", "nand", "memory and storage"])) {
    scores = { industry: 3, rates: 3, cycle: 1, regulation: 2, currency: 1, tailwinds: 3 };
    label = "Highly cyclical memory exposure";
  }
  if (!diversifiedFund && hasAny(["social media", "social network", "advertising platform", "digital advertising"])) {
    scores = { industry: 4, rates: 3, cycle: 3, regulation: 2, currency: 2, tailwinds: 3 };
    label = "Asset-light platform with advertising cyclicality";
  }
  if (!diversifiedFund && hasAny(["e-commerce", "electronic commerce", "online retail", "internet retail", "web services"])) {
    scores = { industry: 4, rates: 3, cycle: 3, regulation: 2, currency: 2, tailwinds: 3 };
    label = "Diversified digital commerce and cloud exposure";
  }
  if (!diversifiedFund && hasAny(["managed health", "health benefits", "health insurance", "managed care"])) {
    scores = { industry: 3, rates: 3, cycle: 4, regulation: 1, currency: 2, tailwinds: 3 };
    label = "Defensive demand with regulatory exposure";
  }
  if (!diversifiedFund && hasAny(["insurance", "property and casualty", "underwriting"])) {
    scores = { industry: 3, rates: 2, cycle: 3, regulation: 2, currency: 2, tailwinds: 3 };
    label = "Defensive insurance with rate sensitivity";
  }
  if (!diversifiedFund && hasAny(["bank", "banking", "consumer banking", "commercial banking"])) {
    scores = { industry: 2, rates: 1, cycle: 2, regulation: 2, currency: 2, tailwinds: 2 };
    label = "Rate- and credit-cycle-sensitive banking";
  }
  if (!diversifiedFund && hasAny(["brokerage", "capital markets", "securities brokerage", "trading platform", "financial services platform"])) {
    scores = { industry: 3, rates: 1, cycle: 2, regulation: 2, currency: 2, tailwinds: 2 };
    label = "Market-activity and rate-sensitive brokerage";
  }
  if (!diversifiedFund && hasAny(["beverage", "energy drink", "consumer staples", "consumer defensive"])) {
    scores = { industry: 3, rates: 3, cycle: 2, regulation: 2, currency: 1, tailwinds: 2 };
    label = "Consumer brand with input-cost exposure";
  }

  const total = round(Object.values(scores).reduce((sum, value) => sum + value, 0));
  return { ...scores, total, label };
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
function analyze(d) {
  const macro = scoreMacroEnvironment(d);
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

  items=[metric("Industry Growth Outlook",macro.industry,macro.industry,4,`${macro.label}. Industry runway is inferred from the company profile.`),metric("Interest Rate Resilience",macro.rates,macro.rates,3,"Higher scores indicate lower direct sensitivity to borrowing costs and financing conditions."),metric("Economic Cycle Resilience",macro.cycle,macro.cycle,4,"Rewards recurring or defensive demand; cyclical industries receive fewer points."),metric("Geopolitical / Regulatory Resilience",macro.regulation,macro.regulation,3,"Reflects structural exposure to regulation, export controls, and geopolitical concentration."),metric("Currency / Commodity Resilience",macro.currency,macro.currency,2,"Rewards diversified revenue and limited commodity or input-cost exposure."),metric("Secular Tailwinds",macro.tailwinds,macro.tailwinds,4,"Rewards durable multi-year demand drivers such as AI, cloud, digitization, and healthcare demand.")];
  categories.push(category("Macro",items,20));

  const total=round(categories.reduce((s,c)=>s+c.score,0));
  const grade=total>=92?"A+":total>=87?"A":total>=82?"A-":total>=77?"B+":total>=72?"B":total>=67?"B-":total>=62?"C+":total>=57?"C":total>=52?"C-":total>=45?"D":"F";
  const recommendation=total>=80&&mos!==null&&mos>=.15?"STRONG BUY":total>=72&&(mos===null||mos>=0)?"BUY":total>=58?"HOLD / WATCH":total>=45?"CAUTION":"AVOID";
  const metricValues=categories.filter(c=>c.name!=="Macro").flatMap(c=>c.metrics.map(m=>m.value)), available=metricValues.filter(v=>v!==null&&v!==undefined).length, pct=available/Math.max(metricValues.length,1), confidence=pct>=.85?"High":pct>=.65?"Moderate":"Low";
  const strengths=categories.filter(c=>c.score/c.max>=.75).map(c=>`${c.name}: ${c.score.toFixed(1)}/${c.max}`), weaknesses=categories.filter(c=>c.score/c.max<.45).map(c=>`${c.name}: ${c.score.toFixed(1)}/${c.max}`);
  const risks=[]; if(debt!==null&&debt>150)risks.push("Elevated debt-to-equity may reduce flexibility during a downturn."); if(shortFloat!==null&&shortFloat>.10)risks.push("High short interest signals meaningful market skepticism."); if(revenue!==null&&revenue<0)risks.push("Revenue is currently contracting."); if(earnings!==null&&earnings<0)risks.push("Earnings momentum is negative."); if(mos!==null&&mos<-.15)risks.push("Shares appear materially above the model's fair-value estimate."); if(!risks.length)risks.push("No single quantitative red flag dominates, but qualitative company-specific risks still require review.");
  return { categories,total,grade,recommendation,confidence,fairValue:fv,mos,strengths:strengths.length?strengths:["No category reached the high-conviction threshold."],weaknesses:weaknesses.length?weaknesses:["No category fell below the risk threshold."],risks,thesis:`${d.company_name||d.ticker} scores ${total.toFixed(1)}/100 for a ${HORIZON} holding period. The model emphasizes valuation, durable growth, competitive advantage, execution quality, market sentiment, and macro conditions. Recommendation: ${recommendation}. This is a screening opinion, not personalized financial advice.`};
}

const money=(v)=>v===null||v===undefined?"N/A":new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(v);
const displayValue=(name,v)=>{if(v===null||v===undefined)return"N/A"; if(typeof v==="number"&&v>=-1&&v<=1&&/growth|margin|return|ownership|interest|upside|safety|resilience|tailwind|outlook/i.test(name))return`${(v*100).toFixed(1)}%`; return typeof v==="number"?v.toLocaleString("en-US",{maximumFractionDigits:2}):String(v)};

export default function ScorecardPage(){
  const [ticker,setTicker]=useState("AAPL"),[data,setData]=useState(null),[status,setStatus]=useState("Ready"),[tab,setTab]=useState("Overview"),[loading,setLoading]=useState(false);
  const [rankings,setRankings]=useState({dow:[],nasdaq:[],sp500:[]}),[scanStatus,setScanStatus]=useState({}),[scanProgress,setScanProgress]=useState({}),[scanUpdated,setScanUpdated]=useState({});
  const cancelRef=useRef({});
  const result=useMemo(()=>data?analyze(data):null,[data]);
  useEffect(()=>{try{const saved=JSON.parse(localStorage.getItem("stockAnalyzerTop10")||"{}");if(saved.rankings)setRankings(saved.rankings);if(saved.updated)setScanUpdated(saved.updated)}catch{}},[]);
  const persist=(next,updated)=>{try{localStorage.setItem("stockAnalyzerTop10",JSON.stringify({rankings:next,updated}))}catch{}};
  const run=async(symbolOverride)=>{const symbol=(symbolOverride||ticker).trim().toUpperCase();if(!symbol)return;setLoading(true);setStatus("Loading market data…");try{const r=await fetch(`/api/stock?ticker=${encodeURIComponent(symbol)}`);const j=await r.json();if(!r.ok)throw new Error(j.error||"Data load failed");setData(j);setTicker(symbol);setTab("Overview");setStatus("Analysis complete");}catch(e){setStatus("Data load failed");alert(`Could not load ${symbol}.\n\n${e.message}`);}finally{setLoading(false)}};
  useEffect(()=>{
    try {
      const selected = localStorage.getItem("stockAnalyzerSelectedTicker");
      if (selected) {
        localStorage.removeItem("stockAnalyzerSelectedTicker");
        setTicker(selected);
        run(selected);
      }
    } catch {}
  },[]);
  const exportReport=()=>{if(!result)return alert("Run an analysis first.");const payload={...result,ticker:data.ticker,company_name:data.company_name,horizon:HORIZON,generated_at:new Date().toISOString(),raw_metrics:data};const blob=new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`${data.ticker}_long_term_analysis.json`;a.click();URL.revokeObjectURL(url)};
  const scanMarket=async market=>{
    if(scanStatus[market]==="Scanning")return;
    cancelRef.current[market]=false;setScanStatus(x=>({...x,[market]:"Scanning"}));setScanProgress(x=>({...x,[market]:{done:0,total:0}}));
    try{
      const listResponse=await fetch(`/api/markets?market=${market}`),listJson=await listResponse.json();if(!listResponse.ok)throw new Error(listJson.error||"Could not load constituents.");
      const symbols=listJson.tickers||[];setScanProgress(x=>({...x,[market]:{done:0,total:symbols.length}}));
      const scored=[];let cursor=0,done=0;
      const worker=async()=>{while(cursor<symbols.length&&!cancelRef.current[market]){const symbol=symbols[cursor++];try{const response=await fetch(`/api/stock?ticker=${encodeURIComponent(symbol)}`);const stock=await response.json();if(response.ok){const score=analyze(stock);scored.push({ticker:stock.ticker,company_name:stock.company_name,total:score.total,grade:score.grade,recommendation:score.recommendation,current_price:stock.current_price,fair_value:score.fairValue,mos:score.mos});}}catch{}finally{done+=1;setScanProgress(x=>({...x,[market]:{done,total:symbols.length}}));}}};
      await Promise.all(Array.from({length:market==="sp500"?3:4},worker));
      if(cancelRef.current[market]){setScanStatus(x=>({...x,[market]:"Stopped"}));return;}
      const top=scored.sort((a,b)=>b.total-a.total).slice(0,10),updated=new Date().toISOString();
      setRankings(prev=>{const next={...prev,[market]:top};const nextUpdated={...scanUpdated,[market]:updated};persist(next,nextUpdated);return next});setScanUpdated(prev=>({...prev,[market]:updated}));setScanStatus(x=>({...x,[market]:`Complete — ${scored.length} scored`}));
    }catch(e){setScanStatus(x=>({...x,[market]:"Scan failed"}));alert(e.message||"Market scan failed.");}
  };
  const stopScan=market=>{cancelRef.current[market]=true};
  const mainTabs=["Overview"];
  const marketForTab={};
  return <main style={{minHeight:"100vh",background:COLORS.bg,color:COLORS.text,fontFamily:"Arial, sans-serif"}}>
    <header style={{padding:"16px 18px 8px",display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}><div><h1 style={{margin:0,fontSize:32,fontWeight:900,letterSpacing:"1px"}}>STOCK ANALYZER</h1><div style={{marginTop:5,color:"#3B82F6",fontSize:17,fontStyle:"italic",fontWeight:600}}>Strictly for Individual Stocks</div></div><Link href="/" style={{marginLeft:"auto",display:"inline-flex",alignItems:"center",justifyContent:"center",minWidth:112,padding:"12px 22px",background:"#FFFFFF",color:"#000000",fontSize:17,fontWeight:800,textDecoration:"none",borderRadius:8,boxShadow:"0 4px 12px rgba(0,0,0,.22)"}}>Home</Link></header>
    <section style={{margin:"8px 18px",padding:14,background:COLORS.panel,borderRadius:8,display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}><strong>Ticker</strong><input value={ticker} onChange={e=>setTicker(e.target.value)} onKeyDown={e=>e.key==="Enter"&&run()} style={{width:130,padding:"9px 10px",fontSize:18,fontWeight:700,background:COLORS.panel2,color:COLORS.text,border:"1px solid #354055",borderRadius:5}}/><button onClick={()=>run()} disabled={loading} style={{...buttonStyle,background:COLORS.accent}}>{loading?"Analyzing…":"Analyze"}</button>{data&&<strong style={{fontSize:18,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",minWidth:0}}>{data.company_name} ({data.ticker})</strong>}</section>
    <div style={{display:"grid",gridTemplateColumns:"minmax(260px,300px) minmax(0,1fr)",gap:10,padding:"4px 18px 18px"}}>
      <aside style={{background:COLORS.panel,padding:14,borderRadius:8}}><h3 style={{margin:"0 0 14px"}}>Stock Score Breakdown</h3>{CAPS&&Object.entries(CAPS).map(([name,max])=>{const categoryScore=result?.categories.find(c=>c.name===name)?.score??0;const pct=Math.max(0,Math.min(100,(categoryScore/max)*100));return <div key={name} style={{marginBottom:16}}><div style={{display:"grid",gridTemplateColumns:"minmax(105px,1fr) auto",gap:10,alignItems:"center",marginBottom:6,fontWeight:700,fontSize:14}}><span>{name} {result?categoryScore.toFixed(1):"—"}</span><span></span></div><div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) 28px",gap:9,alignItems:"center"}}><div role="progressbar" aria-label={`${name} score`} aria-valuemin="0" aria-valuemax={max} aria-valuenow={result?categoryScore:0} style={{height:10,background:COLORS.panel2,borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:`${result?pct:0}%`,background:COLORS.accent,borderRadius:20}}/></div><span style={{fontWeight:800,textAlign:"right"}}>{max}</span></div></div>})}</aside>
      <section style={{minWidth:0}}>{data&&result?<ValuationMeter data={data} result={result}/>:<div style={{height:"100%",minHeight:520,background:COLORS.panel,border:"1px solid #2E3A4D",borderRadius:14,display:"grid",placeItems:"center",color:COLORS.muted,fontSize:18,fontWeight:700}}>Analyze a ticker to display the valuation meter.</div>}</section>
    </div><style jsx global>{`@media(max-width:1100px){.meterTop{grid-template-columns:1fr!important}.meterStats{grid-template-columns:repeat(2,minmax(150px,1fr))!important}.meterStats>div{border-left:none!important;border-top:1px solid #314155;padding:16px 22px!important}} @media(max-width:900px){main>div{grid-template-columns:1fr!important} section>div:first-child{grid-template-columns:repeat(2,minmax(130px,1fr))!important}} @media(max-width:620px){.meterStats{grid-template-columns:1fr!important}.meterTop>div:first-child{min-height:320px!important}} button:hover{filter:brightness(1.08)} button:disabled{opacity:.55;cursor:not-allowed} input[type=range]{accent-color:${COLORS.accent}}`}</style>
  </main>
}
function ValuationMeter({data,result}){
  const score=clamp(Number(result.total)||0,0,100);
  const angle=-90+(score/100)*180;
  const fair=result.fairValue;
  const upside=fair&&data.current_price?fair/data.current_price-1:null;
  const pe=num(data.forward_pe)??num(data.trailing_pe);
  const eps=data.current_price&&pe?data.current_price/pe:null;
  const growth=num(data.earnings_growth);
  const dividend=num(data.dividend_yield)??num(data.dividend_growth);
  const signal=result.recommendation.replace(" / WATCH","");
  const zone=score<20?"OVERVALUED":score<40?"SLIGHTLY OVERVALUED":score<60?"FAIR VALUE":score<80?"UNDERVALUED":"DEEP VALUE";
  const zoneColor=score<20?"#ff1738":score<40?"#ff8a00":score<60?"#ffd500":"#45d12d";
  const note=score<40?"Valuation looks stretched. Consider waiting for a better entry.":score<60?"Neutral valuation. Consider waiting for confirmation.":score<80?"Attractive valuation with a favorable risk/reward profile.":"Deep-value range with strong modeled upside.";
  const analysis=pe===null?"N/A":pe<18?"Below Average":pe<25?"Near Average":pe<35?"Slightly Above":"Well Above";
  const fmtPct=v=>v===null||v===undefined?"N/A":`${v>=0?"+":""}${(v*100).toFixed(1)}%`;
  const polar=(cx,cy,r,a)=>{const rad=(a-90)*Math.PI/180;return {x:cx+r*Math.cos(rad),y:cy+r*Math.sin(rad)}};
  const arc=(cx,cy,r,start,end)=>{const a=polar(cx,cy,r,end),b=polar(cx,cy,r,start);return `M ${a.x} ${a.y} A ${r} ${r} 0 ${end-start<=180?0:1} 0 ${b.x} ${b.y}`};
  const ticks=Array.from({length:21},(_,i)=>i*5);
  return <div style={{background:"linear-gradient(145deg,#07111e,#091522 55%,#07101b)",border:"1px solid #2a3b50",borderRadius:16,padding:20,boxShadow:"inset 0 0 45px rgba(0,0,0,.28)",minHeight:520}}>
    <div style={{display:"grid",gridTemplateColumns:"minmax(420px,1.35fr) minmax(300px,.9fr)",gap:22,alignItems:"center"}} className="meterTop">
      <div style={{position:"relative",minHeight:350,maxWidth:560,width:"100%",margin:"0 auto"}}>
        <svg viewBox="0 0 700 430" role="img" aria-label={`Valuation score ${score.toFixed(1)} out of 100`} style={{width:"100%",height:"auto",display:"block",overflow:"visible"}}>
          <defs><filter id="needleShadow"><feDropShadow dx="0" dy="3" stdDeviation="4" floodOpacity=".55"/></filter><linearGradient id="scoreText" x1="0" x2="1"><stop offset="0" stopColor="#71df32"/><stop offset="1" stopColor="#0aa82c"/></linearGradient></defs>
          <path d={arc(350,350,270,-90,-54)} fill="none" stroke="#e3002d" strokeWidth="42"/>
          <path d={arc(350,350,270,-54,-18)} fill="none" stroke="#ff6500" strokeWidth="42"/>
          <path d={arc(350,350,270,-18,18)} fill="none" stroke="#ffd600" strokeWidth="42"/>
          <path d={arc(350,350,270,18,54)} fill="none" stroke="#69cf2c" strokeWidth="42"/>
          <path d={arc(350,350,270,54,90)} fill="none" stroke="#10913a" strokeWidth="42"/>
          {ticks.map(v=>{const a=-90+(v/100)*180,p1=polar(350,350,v%20===0?244:250,a),p2=polar(350,350,270,a);return <line key={v} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#f6f7fb" strokeWidth={v%20===0?5:2} opacity={v%20===0?1:.7}/>})}
          {[20,40,60,80].map(v=>{const a=-90+(v/100)*180,p1=polar(350,350,242,a),p2=polar(350,350,292,a);return <line key={`b${v}`} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="#fff" strokeWidth="7"/>})}
          <g transform={`rotate(${angle} 350 350)`} filter="url(#needleShadow)"><polygon points="342,350 358,350 350,116" fill="#f4f4f4"/><polygon points="350,116 358,350 350,350" fill="#cfd3d8"/></g>
          <circle cx="350" cy="350" r="15" fill="#e7e9ed"/><circle cx="350" cy="350" r="6" fill="#aeb4bd"/>
          <text x="350" y="270" textAnchor="middle" fontSize="86" fontWeight="900" fill="url(#scoreText)">{score.toFixed(1)}</text>
          <text x="350" y="310" textAnchor="middle" fontSize="26" fontWeight="700" fill="#b9c1d2">OUT OF 100</text>
          <text x="350" y="408" textAnchor="middle" fontSize="42" fontWeight="900" fill={zoneColor}>{signal}</text>
          <text x="55" y="382" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">0</text><text x="645" y="382" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">100</text>
        </svg>
        <div style={{position:"absolute",left:0,right:0,top:0,display:"grid",gridTemplateColumns:"repeat(5,1fr)",textAlign:"center",fontWeight:900,fontSize:13,lineHeight:1.2}}>
          {[['OVERVALUED','0 – 20','#ff1738'],['SLIGHTLY\nOVERVALUED','20 – 40','#ff8a00'],['FAIR VALUE','40 – 60','#ffd500'],['UNDERVALUED','60 – 80','#45d12d'],['DEEP VALUE','80 – 100','#45d12d']].map(([t,r,c])=><div key={t} style={{whiteSpace:"pre-line",color:c}}>{t}<div style={{color:"#c5cad6",fontWeight:700,marginTop:8}}>{r}</div></div>)}
        </div>
        <div style={{textAlign:"center",fontSize:18,color:"#f1f3f7",marginTop:-2}}>{note}</div>
      </div>
      <div style={{border:"1px solid #314155",borderRadius:14,padding:"4px 22px",background:"rgba(2,10,20,.28)"}}>
        {[
          ["◉","Fair Value",money(fair),"#75ea33"],
          ["↗","Upside","Price vs. Fair Value",fmtPct(upside),"#4bd12e"],
          ["◌","Signal",signal,"#ffd600"],
          ["$","Dividend Yield",dividend===null?"N/A":`${(dividend*100).toFixed(2)}%`,"#d56cff"]
        ].map((row,i)=>{const hasSub=row.length===5;const icon=row[0],label=row[1],sub=hasSub?row[2]:null,value=hasSub?row[3]:row[2],color=hasSub?row[4]:row[3];return <div key={label} style={{display:"grid",gridTemplateColumns:"58px minmax(0,1fr) auto",gap:14,alignItems:"center",padding:"24px 0",borderBottom:i<3?"1px solid #314155":"none"}}><div style={{width:52,height:52,borderRadius:"50%",display:"grid",placeItems:"center",fontSize:28,fontWeight:900,color,background:`${color}18`,border:`1px solid ${color}30`}}>{icon}</div><div><div style={{fontSize:22,fontWeight:800}}>{label}</div>{sub&&<div style={{color:"#c5cad6",fontSize:15}}>{sub}</div>}</div><div style={{fontSize:28,fontWeight:900,color:label==="Signal"||label==="Upside"?color:"#fff",textAlign:"right"}}>{value}</div></div>})}
      </div>
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(150px,1fr))",marginTop:22,border:"1px solid #314155",borderRadius:14,padding:"18px 6px",background:"rgba(2,10,20,.26)"}} className="meterStats">
      {[
        ["EPS (TTM)",money(eps),"Trailing Twelve Months"],
        ["EPS Growth (YoY)",fmtPct(growth),growth!==null&&growth>=.1?"Very Good":"Current Growth"],
        ["P/E Ratio",pe===null?"N/A":pe.toFixed(2),"Forward / Trailing"],
        ["P/E Analysis",analysis,"vs. Market Range"]
      ].map(([label,value,sub],i)=><div key={label} style={{padding:"0 22px",borderLeft:i?"1px solid #314155":"none"}}><div style={{fontSize:20,fontWeight:700,marginBottom:12}}>{label}</div><div style={{fontSize:i===3?24:31,fontWeight:900,color:i===1?"#39d83d":i===3?"#ffd600":"#fff"}}>{value}</div><div style={{color:"#c5cad6",fontSize:15,marginTop:8}}>{sub}</div></div>)}
    </div>
    <div style={{marginTop:16,border:"1px solid #24384e",borderRadius:12,padding:"14px 18px",color:"#c8cfdb",fontSize:15}}>ⓘ Valuation based on the stock score model, market conditions, and timing indicators. Current zone: <strong style={{color:zoneColor}}>{zone}</strong>.</div>
  </div>
}

function TopTen({market,rows,status,progress,updated,onScan,onStop,onOpen}){const labels={dow:"Dow Jones 30",nasdaq:"NASDAQ-100",sp500:"S&P 500"},scanning=status==="Scanning",pct=progress?.total?Math.round(progress.done/progress.total*100):0;return <div><div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap",marginBottom:14}}><div><h2 style={{margin:"0 0 4px"}}>{labels[market]} — Top 10</h2><div style={{color:COLORS.muted}}>Ranks every available constituent with the same 100-point scorecard. Cached results remain until refreshed.</div></div><button onClick={()=>onScan(market)} disabled={scanning} style={{...buttonStyle,background:COLORS.accent,marginLeft:"auto"}}>{rows.length?"Refresh Scan":"Run Full Scan"}</button>{scanning&&<button onClick={()=>onStop(market)} style={{...buttonStyle,background:COLORS.bad}}>Stop</button>}</div>{scanning&&<div style={{marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5,fontWeight:700}}><span>Scanning constituents…</span><span>{progress?.done||0}/{progress?.total||0} ({pct}%)</span></div><div style={{height:10,background:COLORS.panel2,borderRadius:20,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:COLORS.accent}}/></div></div>}<div style={{display:"flex",gap:16,color:COLORS.muted,fontSize:13,marginBottom:12}}><span>Status: {status||"Not scanned"}</span><span>Updated: {updated?new Date(updated).toLocaleString():"Never"}</span></div>{!rows.length?<div style={{padding:"50px 20px",textAlign:"center",background:COLORS.panel2,borderRadius:8}}><h3>No ranking cached</h3><p>Run the full scan to calculate the ten highest scores in this index.</p></div>:<div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:980}}><thead><tr>{["Rank","Ticker","Company","Score","Grade","View","Price","Fair Value","Margin of Safety","Action"].map(h=><th key={h} style={cell(true)}>{h}</th>)}</tr></thead><tbody>{rows.map((r,i)=><tr key={r.ticker}><td style={cell()}><strong>{i+1}</strong></td><td style={cell()}><strong style={{color:COLORS.accent}}>{r.ticker}</strong></td><td style={cell()}>{r.company_name}</td><td style={cell()}><strong>{Number(r.total).toFixed(1)}</strong></td><td style={cell()}>{r.grade}</td><td style={cell()}>{r.recommendation}</td><td style={cell()}>{money(r.current_price)}</td><td style={cell()}>{money(r.fair_value)}</td><td style={cell()}>{r.mos===null||r.mos===undefined?"N/A":`${(r.mos*100).toFixed(1)}%`}</td><td style={cell()}><button onClick={()=>onOpen(r.ticker)} style={{...buttonStyle,padding:"7px 10px"}}>Open Scorecard</button></td></tr>)}</tbody></table></div>}<p style={{color:COLORS.muted,fontSize:12,marginTop:14}}>Scanning hundreds of stocks can take several minutes and may be affected by Yahoo Finance rate limits. Rankings are a quantitative screen, not personalized financial advice.</p></div>}

const buttonStyle={border:0,cursor:"pointer",padding:"9px 13px",fontSize:14,fontWeight:800,borderRadius:5,background:"#30394A",color:"white"};
function Overview({data,result}){const mos=result.mos===null?"N/A":`${(result.mos*100).toFixed(1)}%`;return <div style={{lineHeight:1.6}}><h2 style={{marginTop:0}}>{data.company_name} ({data.ticker})</h2><div>Generated: {new Date().toLocaleString()}</div><div>Investment approach: {HORIZON}</div><div>Model confidence: {result.confidence}</div><h3>TOTAL SCORE: {result.total.toFixed(1)}/100 &nbsp; | &nbsp; GRADE: {result.grade} &nbsp; | &nbsp; VIEW: {result.recommendation}</h3><div>Current price: {money(data.current_price)}</div><div>Estimated fair value: {money(result.fairValue)}</div><div>Margin of safety: {mos}</div><h3>CATEGORY SCORES</h3>{result.categories.map(c=><div key={c.name}>• {c.name}: {c.score.toFixed(1)}/{c.max}</div>)}<h3>STRENGTHS</h3>{result.strengths.map(x=><div key={x}>• {x}</div>)}<h3>WEAKNESSES</h3>{result.weaknesses.map(x=><div key={x}>• {x}</div>)}<h3>KEY RISKS</h3>{result.risks.map(x=><div key={x}>• {x}</div>)}<h3>INVESTMENT THESIS</h3><p>{result.thesis}</p></div>}
function Breakdown({result}){return <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",minWidth:850}}><thead><tr>{["Category","Metric","Value","Points","Max","Why"].map(h=><th key={h} style={cell(true)}>{h}</th>)}</tr></thead><tbody>{result.categories.flatMap(c=>c.metrics.map(m=><tr key={`${c.name}-${m.name}`}><td style={cell()}>{c.name}</td><td style={cell()}>{m.name}</td><td style={cell()}>{displayValue(m.name,m.value)}</td><td style={cell()}>{m.points.toFixed(2)}</td><td style={cell()}>{m.max}</td><td style={cell()}>{m.explanation}</td></tr>))}</tbody></table></div>}
const cell=(head=false)=>({padding:"9px",borderBottom:"1px solid #303848",textAlign:"left",background:head?COLORS.panel2:"transparent",fontWeight:head?800:400,verticalAlign:"top"});
