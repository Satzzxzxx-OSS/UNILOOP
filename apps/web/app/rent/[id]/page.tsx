import type {Metadata} from "next";
import Link from "next/link";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {getRental} from "@/lib/rentals/data";
import {categories} from "@/lib/catalog";
import {MediaGallery} from "@/components/experience/media-gallery";
import {ExperienceIcon} from "@/components/experience/experience-header";
import {RentalStatusForm,RentalRequestForm,RentalBlockForm} from "@/components/rental-ui";
import {RentalPhotoUpload} from "@/components/rental-photo-upload";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Explore a rental",robots:{index:false}};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{
 style:"currency",currency:"INR",maximumFractionDigits:0,
}).format(n);

export default async function RentalDetail({params}:{params:Promise<{id:string}>}){
 const {id}=await params;
 const record=await getRental(id);
 if(!record)notFound();
 const {item,myId,photos,photoCount,unavailable}=record;
 const owner=item.owner_id===myId,enabled=process.env.ENABLE_RENTAL_OPERATIONS==="true";
 const category=categories.find(c=>c.slug===item.category_slug);
 return <article className="ux-shell ux-detail-page">
   <nav aria-label="Breadcrumb" className="ux-breadcrumb">
     <Link href="/">Home</Link><span>›</span><Link href="/explore?mode=rent">Rent</Link>
     <span>›</span><span>{category?.label??"Rental"}</span>
   </nav>
   <div className="ux-detail-grid">
     <MediaGallery urls={photos} title={item.title} kind="rental"/>
     <div className="ux-detail-content">
       <p className="ux-kicker">BORROW SMARTER, OWN LESS</p>
       <h1>{item.title}</h1>
       <div className="ux-detail-price"><strong>{money(item.daily_rate_inr)}</strong><span>per day</span></div>
       <div className="ux-detail-tags"><span>{category?.label??"Rental item"}</span>
         <span>{item.item_condition.replaceAll("_"," ")}</span><span>{item.status}</span></div>
       <section className="ux-rental-terms" aria-label="Rental terms">
         <div><span>Rental duration</span><strong>{item.min_days}–{item.max_days} days</strong></div>
         <div><span>Requested deposit</span><strong>{money(item.refundable_deposit_inr)}</strong></div>
       </section>
       <div className="ux-detail-legal">
         Deposit is requested by the owner. UNILOOP does not hold funds,
         insure items, process refunds, or verify payments.
       </div>
       <section className="ux-detail-description"><h2>Get to know this item</h2>
         <p>{item.description}</p></section>
       <section className="ux-rental-busy">
         <h2>Availability</h2>
         {unavailable.length?
           <ul>{unavailable.map((r,i)=><li key={r.start_date+r.return_date+i}>
             <span>{r.start_date}</span><span aria-hidden="true">→</span>
             <span>{r.return_date}</span><small>Return date exclusive</small></li>)}</ul>:
           <p>There are no recorded unavailable periods at this time.
             Requests still require owner approval and can be declined.</p>}
       </section>
       {owner?<section className="ux-detail-action-panel">
         <h2>Manage your rental</h2>
         <p>Photos, available dates and owner approval matter before accepting a request.</p>
         <div className="ux-detail-action-row">
           <Link href="/rent/my" className="ux-detail-text-link">My rental items →</Link>
           <Link href="/rentals" className="ux-detail-text-link">Booking requests →</Link>
         </div>
         {enabled&&(item.status==="draft"||item.status==="paused")&&
           <RentalPhotoUpload rentalId={item.id} count={photoCount}/>}
         {enabled&&<RentalStatusForm id={item.id} status={item.status} hasPhoto={photoCount>0}/>}
         {enabled&&item.status!=="removed"&&<RentalBlockForm id={item.id} nonce={randomUUID()}/>}
       </section>:<section className="ux-detail-action-panel">
         <h2>Borrow this item</h2><p>Choose dates carefully. Sending a request does not confirm a booking.</p>
         {enabled&&item.status==="active"?
           <RentalRequestForm id={item.id} nonce={randomUUID()}
             minDays={item.min_days} maxDays={item.max_days}/>:
           <div className="ux-detail-disabled-action">Rental date requests are not available until verified marketplace services are enabled.</div>}
       </section>}
       <aside className="ux-detail-safe"><ExperienceIcon name="shield" size={22}/>
         <div><strong>Take care before you borrow.</strong>
           <p>Confirm all accessories and document item condition at pickup and return.</p></div>
       </aside>
     </div>
   </div>
   <section className="ux-detail-after">
     <p className="ux-kicker">WORTH EXPLORING</p>
     <h2>Discover more useful things.</h2>
     <Link href="/explore?mode=rent" className="ux-text-arrow">Browse all rentals <ExperienceIcon name="arrow" size={19}/></Link>
   </section>
 </article>;
}
