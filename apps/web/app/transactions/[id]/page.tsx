import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getSaleDeal} from "@/lib/sales/data";
import {ConfirmDealForm,SaleReviewForm} from "@/components/sale-deal-forms";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Sale handover details",robots:{index:false}};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);

export default async function TransactionDetails({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const result=await getSaleDeal(id);
  if(!result)notFound();
  const {deal,listing,myId,reviews}=result;
  const seller=deal.seller_id===myId;
  const alreadyConfirmed=seller?!!deal.seller_handed_over_at:!!deal.buyer_received_at;
  const reviewed=reviews.some(r=>r.reviewer_id===myId);
  const enabled=process.env.ENABLE_SALE_TRANSACTIONS==="true";
  return <div className="container rental-booking-page">
    <Link href="/transactions" className="text-link">← All sale handovers</Link>
    <p className="eyebrow">PRIVATE SALE HANDOVER</p>
    <h1>{listing?.title??"Item exchange"}</h1>
    <div className="booking-summary">
      <dl>
        <div><dt>Agreed price</dt><dd>{money(deal.agreed_price_inr)}</dd></div>
        <div><dt>Current state</dt><dd>{deal.status.replaceAll("_"," ")}</dd></div>
        <div><dt>Your role</dt><dd>{seller?"Seller":"Buyer"}</dd></div>
        <div><dt>Seller confirmation</dt><dd>{deal.seller_handed_over_at?"Recorded":"Pending"}</dd></div>
        <div><dt>Buyer confirmation</dt><dd>{deal.buyer_received_at?"Recorded":"Pending"}</dd></div>
      </dl>
      <p className="interaction-notice">This record reflects participants' confirmations.
        UNILOOP does not verify cash transfers, provide escrow or guarantee item condition.</p>
    </div>
    {enabled&&deal.status==="pending_handover"&&!alreadyConfirmed&&
      <section className="rental-control-panel">
        <h2>Confirm what actually happened</h2>
        <p className="interaction-note">Only confirm after the item has physically changed hands.
          Both people must confirm before this record is completed.</p>
        <ConfirmDealForm id={deal.id}
          label={seller?"I handed over the item":"I received the item"}/>
      </section>}
    {deal.status==="completed"&&
      <section className="rental-condition-section">
        <h2>Exchange reviews</h2>
        {reviews.length?<div className="rental-note-list">{reviews.map(review=>
          <article key={review.id} className="rental-note">
            <strong>{review.rating}/5 · {review.reviewer_id===myId?"You":"Other participant"}</strong>
            <p>{review.review_body}</p>
          </article>)}</div>:<p className="interaction-note">No reviews yet.</p>}
        {enabled&&!reviewed&&<SaleReviewForm id={deal.id}/>}
      </section>}
  </div>;
}
