"use client";
import {useState,type ReactNode} from "react";
import Link from "next/link";
import {Button} from "@/components/spaceui/button";

export function MarketplacePanel({buy,rent}:{buy:ReactNode;rent:ReactNode}){
  const [mode,setMode]=useState<"buy"|"rent">("buy");
  return <section className="ul-panel ul-marketplace-panel" aria-labelledby="marketplace-panel-title">
    <div className="ul-panel-heading"><div><h2 id="marketplace-panel-title">Marketplace</h2><p>Find something useful, close to you.</p></div><Link href={"/explore?mode="+mode}>View all <span aria-hidden="true">↗</span></Link></div>
    <div className="ul-feed-tabs" role="tablist" aria-label="Marketplace listings">
      <Button variant="ghost" role="tab" id="ul-buy-tab" aria-selected={mode==="buy"} aria-controls="ul-buy-panel" tabIndex={mode==="buy"?0:-1} onClick={()=>setMode("buy")} onKeyDown={e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){setMode("rent");document.getElementById("ul-rent-tab")?.focus();}}}>For sale</Button>
      <Button variant="ghost" role="tab" id="ul-rent-tab" aria-selected={mode==="rent"} aria-controls="ul-rent-panel" tabIndex={mode==="rent"?0:-1} onClick={()=>setMode("rent")} onKeyDown={e=>{if(e.key==="ArrowRight"||e.key==="ArrowLeft"){setMode("buy");document.getElementById("ul-buy-tab")?.focus();}}}>For rent</Button>
    </div>
    <div role="tabpanel" tabIndex={0} id={mode==="buy"?"ul-buy-panel":"ul-rent-panel"} aria-labelledby={mode==="buy"?"ul-buy-tab":"ul-rent-tab"} className="ul-panel-body">{mode==="buy"?buy:rent}</div>
  </section>;
}
