"use client";
import {useState,type ReactNode} from "react";
import Link from "next/link";
import {Tabs,TabsList,TabsTab,TabsPanel} from "@/components/spaceui/tabs";
export function MarketplacePanel({buy,rent}:{buy:ReactNode;rent:ReactNode}){
 const [mode,setMode]=useState("buy");
 return <section className="ul-panel ul-marketplace-panel" aria-labelledby="marketplace-panel-title">
  <div className="ul-panel-heading"><div><h2 id="marketplace-panel-title">Marketplace</h2><p>Find something useful, close to you.</p></div><Link href={"/explore?mode="+mode}>View all <span aria-hidden="true">↗</span></Link></div>
  <Tabs value={mode} onValueChange={value=>setMode(String(value))} className="ul-marketplace-tabs">
   <TabsList variant="underline" activateOnFocus className="ul-feed-tabs" aria-label="Marketplace listings"><TabsTab value="buy">For sale</TabsTab><TabsTab value="rent">For rent</TabsTab></TabsList>
   <TabsPanel value="buy" className="ul-panel-body">{buy}</TabsPanel><TabsPanel value="rent" className="ul-panel-body">{rent}</TabsPanel>
  </Tabs>
 </section>;
}
