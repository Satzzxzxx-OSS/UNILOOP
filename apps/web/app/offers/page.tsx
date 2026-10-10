import type {Metadata} from "next";
import Link from "next/link";
import {getSaleOfferInbox} from "@/lib/interactions/data";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";
import {ExperienceIcon} from "@/components/experience/experience-header";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Offers",robots:{index:false}};
export default async function OffersPage(){
 const result=await getSaleOfferInbox();
 return <WorkspaceShell eyebrow="THE ART OF THE DEAL" title="Offers"
   description="Keep track of offers and counter-offers associated with real conversations."
   action={{href:"/inbox",label:"Go to inbox"}}>
   {result.kind==="ready"&&result.conversations.length?
     <div className="ux-workspace-threads">{result.conversations.map(item=>
       <Link href={"/inbox/"+item.id} key={item.id} className="ux-workspace-thread">
         <span className="ux-workspace-thread-icon ux-workspace-rupee">₹</span>
         <span><strong>{item.title}</strong><small>See real offers and messages</small></span>
         <span className="ux-workspace-thread-arrow"><ExperienceIcon name="arrow" size={19}/></span>
       </Link>)}</div>:
     <WorkspaceEmpty title="No offers to review yet."
       description="Accepted, pending and counter-offers will appear when real negotiations are recorded."
       action={{href:"/inbox",label:"View messages"}}/>}
 </WorkspaceShell>;
}
