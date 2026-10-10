import type {Metadata} from "next";
import {notFound} from "next/navigation";
import Link from "next/link";
import {getListing} from "@/lib/listings/data";
import {categories} from "@/lib/catalog";
import {serverSupabase} from "@/lib/supabase/server";
import {MediaGallery} from "@/components/experience/media-gallery";
import {ExperienceIcon} from "@/components/experience/experience-header";
import {ListingPhotoUpload} from "@/components/listing-photo-upload";
import {ListingStatusForm} from "@/components/listing-status-form";
import {SavedToggle} from "@/components/trust-forms";
import {StartSaleConversation} from "@/components/sale-interaction-forms";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Explore an item",robots:{index:false}};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{
  style:"currency",currency:"INR",maximumFractionDigits:0,
}).format(n);

export default async function SaleDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const result=await getListing(id);
 if(!result)notFound();
 const {listing,userId,photos,photoCount}=result;
 const owner=userId===listing.owner_id;
 const trust=process.env.ENABLE_MARKETPLACE_USER_ACTIONS==="true";
 const writes=process.env.ENABLE_MARKETPLACE_WRITES==="true";
 const interactions=process.env.ENABLE_MARKETPLACE_INTERACTIONS==="true";
 const client=trust&&!owner?await serverSupabase():null;
 const saved=client?Boolean((await client.from("favorites").select("listing_id")
   .eq("listing_id",listing.id).eq("user_id",userId).maybeSingle()).data):false;
 const category=categories.find(c=>c.slug===listing.category_slug);
 return <article className="ux-shell ux-detail-page">
   <nav className="ux-breadcrumb" aria-label="Breadcrumb">
     <Link href="/">Home</Link><span>›</span>
     <Link href="/explore?mode=buy">Buy</Link><span>›</span>
     <Link href={"/explore?mode=buy&category="+listing.category_slug}>{category?.label??"Category"}</Link>
   </nav>
   <div className="ux-detail-grid">
     <MediaGallery urls={photos} title={listing.title} kind="sale"/>
     <div className="ux-detail-content">
       <p className="ux-kicker">GIVE GOOD THINGS A NEW CHAPTER</p>
       <h1>{listing.title}</h1>
       <div className="ux-detail-price"><strong>{money(listing.price_inr)}</strong>
         <span>One-time asking price</span></div>
       <div className="ux-detail-tags">
         <span>{category?.label??"Item"}</span>
         <span>{listing.item_condition.replaceAll("_"," ")}</span>
         <span>{listing.status}</span>
       </div>
       <section className="ux-detail-description">
         <h2>The story so far</h2>
         <p>{listing.description}</p>
       </section>
       {owner?<section className="ux-detail-action-panel">
         <h2>Manage your listing</h2>
         <p>You own this item. It becomes discoverable only after a successful, eligible publication.</p>
         {writes&&(listing.status==="draft"||listing.status==="paused")&&
           <ListingPhotoUpload listingId={listing.id} count={photoCount}/>}
         {writes&&<ListingStatusForm id={listing.id} current={listing.status} hasPhoto={photoCount>0}/>}
         <Link href="/my/listings" className="ux-detail-text-link">View all my listings →</Link>
       </section>:<section className="ux-detail-action-panel">
         <h2>Interested in this item?</h2>
         <p>Ask a question and discuss a safe handover. Never share payment passwords or OTPs.</p>
         {listing.status==="active"&&interactions?
           <StartSaleConversation listingId={listing.id}/>:
           <div className="ux-detail-disabled-action">Messaging will be available when verified accounts and marketplace services are enabled.</div>}
         <div className="ux-detail-action-row">
           {trust&&listing.status==="active"&&<SavedToggle listingId={listing.id} saved={saved}/>}
           {trust&&<Link href={"/report/"+listing.id} className="ux-detail-text-link">Report this item</Link>}
         </div>
       </section>}
       <aside className="ux-detail-safe"><ExperienceIcon name="shield" size={22}/>
         <div><strong>A little care goes a long way.</strong>
         <p>Inspect before exchanging. Agree on condition, price and handover directly.</p></div>
       </aside>
     </div>
   </div>
   <section className="ux-detail-after">
      <p className="ux-kicker">KEEP LOOKING</p>
      <h2>There&apos;s more in the loop.</h2>
      <Link href={"/explore?mode=buy&category="+listing.category_slug} className="ux-text-arrow">
        Explore similar categories <ExperienceIcon name="arrow" size={19}/>
      </Link>
   </section>
 </article>;
}
