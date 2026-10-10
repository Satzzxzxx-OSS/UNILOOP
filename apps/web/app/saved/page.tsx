import type {Metadata} from "next";
import {ListingCard} from "@/components/listing-card";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";
import {verifiedMarketplaceContext,type Listing} from "@/lib/listings/data";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Saved items",robots:{index:false}};
export default async function SavedPage(){
  const context=await verifiedMarketplaceContext();
  let items:Listing[]=[];
  let failure=false;
  if(context.kind==="ready"){
    const {data:saved,error}=await context.client.from("favorites").select("listing_id")
      .eq("user_id",context.userId).order("created_at",{ascending:false}).limit(24);
    if(error)failure=true;
    else if(saved?.length){
      const ids=saved.map(item=>item.listing_id);
      const {data:listings,error:listError}=await context.client.from("listings")
        .select("id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition,status,created_at,published_at")
        .in("id",ids).eq("status","active");
      if(listError)failure=true;
      else{
        const ordered=new Map((listings??[]).map(row=>[row.id,row]));
        items=ids.map(id=>ordered.get(id)).filter((value):value is NonNullable<typeof value>=>!!value) as Listing[];
      }
    }
  }
  return <WorkspaceShell eyebrow="THE THINGS YOU LOVE" title="Your saved finds."
    description="A little collection of the useful things worth coming back to."
    action={{href:"/explore",label:"Keep exploring"}}>
    {context.kind!=="ready"||failure?
      <WorkspaceEmpty kind="auth" title="Your collection is waiting."
        description={context.kind==="login"?"Sign in to see the items you've saved.":
          context.kind==="not_eligible"?"Marketplace access isn't currently enabled for this account.":
          "Saved items are unavailable until account services are connected."}
        action={{href:"/account",label:"Go to account"}}/>:
      items.length?<div className="ux-workspace-grid">{items.map(item=>
        <ListingCard listing={item} key={item.id}/>)}</div>:
        <WorkspaceEmpty title="Nothing saved just yet." description="Discover something useful, and you can come back to it here when saving is enabled."
          action={{href:"/explore",label:"Find something great"}}/>}
  </WorkspaceShell>;
}
