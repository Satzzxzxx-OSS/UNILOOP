import type {Metadata} from "next";
import Link from "next/link";
import {getRentalBookings} from "@/lib/rentals/data";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";
import {ExperienceIcon} from "@/components/experience/experience-header";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Rental bookings",robots:{index:false}};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{
 style:"currency",currency:"INR",maximumFractionDigits:0,
}).format(n);
export default async function RentalsPage(){
 const result=await getRentalBookings();
 return <WorkspaceShell eyebrow="YOUR RENTAL JOURNEY" title="Borrowed and shared."
   description="Real requests, confirmed dates, handovers and returns in one place."
   action={{href:"/explore?mode=rent",label:"Explore rentals"}}>
   {result.kind==="ready"&&result.items.length?
     <div className="ux-workspace-threads">{result.items.map(item=>
       <Link href={"/rentals/"+item.id} key={item.id} className="ux-workspace-thread">
         <span className="ux-workspace-thread-icon">↻</span>
         <span><strong>{money(item.rental_total_inr)} rental estimate</strong>
           <small>{item.days_count} days · {item.status.replaceAll("_"," ")}</small></span>
         <span className="ux-workspace-thread-arrow"><ExperienceIcon name="arrow" size={18}/></span>
       </Link>)}</div>:
     <WorkspaceEmpty kind={result.kind!=="ready"?"auth":"neutral"}
       title="Your rental story begins here."
       description="When genuine booking requests are recorded, you can follow them here from approval through return."
       action={{href:result.kind==="ready"?"/explore?mode=rent":"/account",
         label:result.kind==="ready"?"Discover rentals":"Go to account"}}/>}
 </WorkspaceShell>;
}
