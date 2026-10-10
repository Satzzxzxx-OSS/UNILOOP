"use client";
import {ProximityGrid} from "@/components/spaceui/proximity-grid";
import {GradientBackground} from "@/components/spaceui/gradient-background";
import {LuminousBorder} from "@/components/spaceui/luminous-border";
import {ShoppingBag,Package,KeyRound,ArrowUpRight} from "lucide-react";

export function LandingArt(){
 return <div className="ul-landing-art" aria-label="Buy, sell and rent: three ways to stay in the loop">
  <GradientBackground className="ul-landing-gradient"/>
  <ProximityGrid cellSize={64} proximity={3} radius="rounded" className="ul-landing-grid" aria-hidden="true"/>
  <div className="ul-loop-mark" aria-hidden="true"><span/><span/></div>
  <LuminousBorder colorVariant="ocean" staticColors borderRadius={22} className="ul-intent-stack">
   {[{icon:ShoppingBag,title:"Buy",copy:"Find your everyday."},{icon:Package,title:"Sell",copy:"Give it a next chapter."},{icon:KeyRound,title:"Rent",copy:"More use. Less ownership."}].map(({icon:Icon,title,copy})=><div key={title} className="ul-intent-row"><span><Icon size={21}/></span><div><strong>{title}</strong><p>{copy}</p></div><ArrowUpRight size={18}/></div>)}
  </LuminousBorder>
  <span className="ul-art-caption">A little more possibility. A lot less waste.</span>
 </div>;
}
