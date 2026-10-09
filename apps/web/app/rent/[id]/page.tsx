import type {Metadata} from "next";
import {randomUUID} from "node:crypto";
import Link from "next/link";
import Image from "next/image";
import {notFound} from "next/navigation";
import {getRental} from "@/lib/rentals/data";
import {
  RentalStatusForm,RentalRequestForm,RentalBlockForm,
} from "@/components/rental-ui";
import {RentalPhotoUpload} from "@/components/rental-photo-upload";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Rental listing",robots:{index:false}};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{
  style:"currency",currency:"INR",maximumFractionDigits:0,
}).format(n);

export default async function RentalDetailPage({params}:{
  params:Promise<{id:string}>;
}){
  const {id}=await params;
  const record=await getRental(id);
  if(!record)notFound();
  const {item,myId,photos,photoCount,unavailable}=record;
  const owner=item.owner_id===myId;
  const enabled=process.env.ENABLE_RENTAL_OPERATIONS==="true";
  return <article className="container listing-detail-page">
    <Link href="/explore?mode=rent" className="text-link">← Browse rentals</Link>
    <div className="listing-detail-grid">
      <div className="listing-detail-photo">
        {photos.length?<div className="listing-photo-gallery">{photos.map((url,index)=>
          <Image key={url} src={url} alt={"Photo "+(index+1)+" of "+item.title}
            width={700} height={560} unoptimized className="listing-detail-image"/>
        )}</div>:<><span aria-hidden="true">✳</span><p>No uploaded image available</p></>}
      </div>
      <div className="listing-detail-content">
        <p className="eyebrow">RENTAL ITEM</p>
        <h1>{item.title}</h1>
        <p className="listing-detail-price">{money(item.daily_rate_inr)} / day</p>
        <p className="listing-detail-attributes">
          <span>Condition: {item.item_condition.replaceAll("_"," ")}</span>
          <span>{item.min_days}–{item.max_days} days</span>
          <span>Status: {item.status}</span>
        </p>
        <p className="interaction-notice">
          Deposit requested: {money(item.refundable_deposit_inr)}.
          Payments and deposits are arranged directly by participants.
          UNILOOP does not collect, insure or verify these amounts.
        </p>
        <h2>About this item</h2>
        <p className="listing-description">{item.description}</p>
        <section className="rental-availability">
          <h2>Unavailable date ranges</h2>
          {unavailable.length?
            <ul>{unavailable.map((range,i)=>
              <li key={range.start_date+range.return_date+i}>
                {range.start_date} to {range.return_date} (return day exclusive)
              </li>)}</ul>:
            <p className="interaction-note">No blocked or confirmed periods recorded.
              Approval is still required for every request.</p>}
        </section>
        {owner?
          <>
            <div className="account-quicklinks">
              <Link href="/rent/my" className="text-link">My rental items →</Link>
              <Link href="/rentals" className="text-link">Booking requests →</Link>
            </div>
            {enabled && (item.status==="draft"||item.status==="paused") &&
              <RentalPhotoUpload rentalId={item.id} count={photoCount}/>}
            {enabled&&<RentalStatusForm id={item.id} status={item.status}
              hasPhoto={photoCount>0}/>}
            {enabled&&item.status!=="removed"&&
              <RentalBlockForm id={item.id} nonce={randomUUID()}/>}
          </>:
          enabled&&item.status==="active"?
            <RentalRequestForm id={item.id} nonce={randomUUID()}
              minDays={item.min_days} maxDays={item.max_days}/>:
            <p className="interaction-notice">New rental requests are not available right now.</p>
        }
      </div>
    </div>
  </article>;
}
