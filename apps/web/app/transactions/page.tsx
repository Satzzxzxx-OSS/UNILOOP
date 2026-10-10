import type {Metadata} from "next";
import Link from "next/link";
import {getSaleDeals} from "@/lib/sales/data";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";
import {ExperienceIcon} from "@/components/experience/experience-header";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Sale handovers",robots:{index:false}};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{
 style:"currency",currency:"INR",maximumFractionDigits:0,
}).format(n);
export default async function TransactionsPage(){
 const result=await getSaleDeals();
 return <WorkspaceShell eyebrow="THE EXCHANGE JOURNEY" title="Transactions"
   description="Real two-sided handover records, kept separate from payments and offers."
   action={{href:"/inbox",label:"View conversations"}}>
   {result.kind==="ready"&&result.items.length?
     <div className="ux-workspace-threads">{result.items.map(item=>
       <Link key={item.id} href={"/transactions/"+item.id} className="ux-workspace-thread">
         <span className="ux-workspace-thread-icon">✓</span>
         <span><strong>{money(item.agreed_price_inr)} agreed price</strong>
           <small>{item.status.replaceAll("_"," ")}</small></span>
         <span className="ux-workspace-thread-arrow"><ExperienceIcon name="arrow" size={18}/></span>
       </Link>)}</div>:
     <WorkspaceEmpty kind={result.kind!=="ready"?"auth":"neutral"}
       title="No handovers to track yet."
       description="Once an accepted offer leads to a real exchange, both participants can track handover here."
       action={{href:result.kind==="ready"?"/inbox":"/account",
         label:result.kind==="ready"?"Go to messages":"Go to account"}}/>}
 </WorkspaceShell>;
}
