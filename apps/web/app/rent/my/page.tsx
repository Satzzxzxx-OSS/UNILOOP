import type {Metadata} from "next";
import Link from "next/link";
import {getMyRentalListings} from "@/lib/rentals/data";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";
import {ExperienceIcon} from "@/components/experience/experience-header";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"My rental items",robots:{index:false}};
export default async function MyRentalsPage(){
 const result=await getMyRentalListings();
 return <WorkspaceShell eyebrow="YOUR LENDING ACTIVITY" title="Things you're lending."
   description="The useful things you share deserve a thoughtful home."
   action={{href:"/rent/post",label:"Rent out an item"}}>
   {result.kind==="ready"&&result.items.length?
     <div className="ux-workspace-threads">{result.items.map(item=>
       <Link key={item.id} href={"/rent/"+item.id} className="ux-workspace-thread">
         <span className="ux-workspace-thread-icon">↻</span>
         <span><strong>{item.title}</strong>
           <small>₹{item.daily_rate_inr} per day · {item.status}</small></span>
         <span className="ux-workspace-thread-arrow"><ExperienceIcon name="arrow" size={18}/></span>
       </Link>)}</div>:
     <WorkspaceEmpty kind={result.kind!=="ready"?"auth":"neutral"}
       title={result.kind==="ready"?"Nothing to lend yet.":"Your rental collection is waiting."}
       description="Create a beautiful rental draft with real details and photos when account services are ready."
       action={{href:result.kind==="ready"?"/rent/post":"/account",
        label:result.kind==="ready"?"Create rental draft":"Go to account"}}/>}
 </WorkspaceShell>;
}
