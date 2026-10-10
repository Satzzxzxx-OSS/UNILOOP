import type {Metadata} from "next";
import {getMyListings} from "@/lib/listings/data";
import {ListingCard} from "@/components/listing-card";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"My listings",robots:{index:false}};
export default async function MyListingsPage(){
 const result=await getMyListings();
 return <WorkspaceShell eyebrow="YOUR MARKETPLACE" title="My listings"
    description="One thoughtful place for your drafts, available items and finished listings."
    action={{href:"/post",label:"List another item"}}>
   {result.kind==="ready"&&result.items.length?
     <div className="ux-workspace-grid">{result.items.map(item=>
       <ListingCard key={item.id} listing={item}/>)}</div>:
     <WorkspaceEmpty kind={result.kind!=="ready"?"auth":"neutral"}
       title={result.kind==="ready"?"Your first listing starts with one good thing.":"Your listings aren't available right now."}
       description={result.kind==="ready"?"Turn a useful item into its next great chapter.":
         "Sign in with approved access to manage your real listings when services are enabled."}
       action={{href:result.kind==="ready"?"/post":"/account",
         label:result.kind==="ready"?"Create your first listing":"Go to account"}}/>}
 </WorkspaceShell>;
}
