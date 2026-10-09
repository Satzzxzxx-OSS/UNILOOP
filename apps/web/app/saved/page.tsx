import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { verifiedMarketplaceContext, type Listing } from "@/lib/listings/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Saved items", robots: { index: false } };

export default async function SavedPage() {
  const context=await verifiedMarketplaceContext();
  let items: Listing[]=[];
  let error=false;
  if(context.kind==="ready"){
    const {data:saved,error:saveError}=await context.client.from("favorites")
      .select("listing_id").eq("user_id",context.userId)
      .order("created_at",{ascending:false}).limit(24);
    if(saveError) error=true;
    else if(saved?.length){
      const ids=saved.map(row=>row.listing_id);
      const {data:listings,error:listError}=await context.client.from("listings")
        .select("id,owner_id,campus_id,category_slug,title,description,price_inr,item_condition,status,created_at,published_at")
        .in("id",ids).eq("status","active");
      if(listError) error=true;
      else {
        const byId=new Map((listings??[]).map(item=>[item.id,item]));
        items=ids.map(id=>byId.get(id)).filter((item):item is NonNullable<typeof item>=>Boolean(item)) as Listing[];
      }
    }
  }
  return <div className="container listings-dashboard">
    <div className="section-heading">
      <div><p className="eyebrow">YOUR COLLECTION</p><h1>Saved items</h1>
        <p>Return to items you want to explore later.</p></div>
      <Link className="button button-dark" href="/explore?mode=buy">Find something</Link>
    </div>
    {context.kind!=="ready" || error ?
      <section className="feed-notice">
        <h2>Saved items unavailable</h2>
        <p>{context.kind==="login"?"Sign in to access your saved items.":
          context.kind==="not_eligible"?"Marketplace access is not enabled for this account.":
          "Unable to load your saved items right now."}</p>
        <Link href="/account" className="text-link">Go to account →</Link>
      </section> :
      items.length ? <div className="listing-grid">{items.map(item=>
        <ListingCard listing={item} key={item.id}/>)}</div> :
        <section className="feed-notice"><h2>No saved listings yet</h2>
          <p>Save a live listing and it will appear here. Unavailable items are hidden.</p>
          <Link className="text-link" href="/explore">Browse items →</Link>
        </section>}
  </div>;
}
