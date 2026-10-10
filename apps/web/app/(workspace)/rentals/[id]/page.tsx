import {ExchangeTimeline} from "@/components/experience/exchange-timeline";
import {ItemStatus} from "@/components/experience/item-status";
import type {Metadata} from "next";
import Link from "next/link";
import {notFound} from "next/navigation";
import {getRentalBooking} from "@/lib/rentals/data";
import {RentalBookingDecision,RentalConditionForm} from "@/components/rental-ui";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Rental booking details",robots:{index:false}};

const money=(n:number)=>new Intl.NumberFormat("en-IN",{
  style:"currency",currency:"INR",maximumFractionDigits:0,
}).format(n);
function periodDates(value:string){
  const match=/^[[(](\d{4}-\d{2}-\d{2}),(\d{4}-\d{2}-\d{2})[)\]]$/.exec(value);
  return match?match[1]+" → "+match[2]+" (return date)":value;
}

export default async function BookingDetails({params}:{
  params:Promise<{id:string}>;
}){
  const {id}=await params;
  const result=await getRentalBooking(id);
  if(!result)notFound();
  const {booking,item,myId,notes}=result;
  const owner=booking.owner_id===myId;
  const enabled=process.env.ENABLE_RENTAL_OPERATIONS==="true";
  const confirmedPickup=owner?!!booking.owner_handover_at:!!booking.renter_handover_at;
  const confirmedReturn=owner?!!booking.owner_return_at:!!booking.renter_return_at;

  return <div className="ux-shell ux-private-detail rental-booking-page">
    <Link href="/rentals" className="ux-detail-text-link">← Your rentals</Link>
    <p className="ux-kicker">YOUR RENTAL JOURNEY</p>
    <h1>{item?.title??"Rental booking"}</h1>
    <p className="listing-detail-attributes"><ItemStatus status={booking.status}/>
      <span>{owner?"You are lending this item":"You requested this item"}</span></p>
    <div className="booking-summary">
      <dl>
        <div><dt>Dates</dt><dd>{periodDates(booking.booking_period)}</dd></div>
        <div><dt>Duration</dt><dd>{booking.days_count} days</dd></div>
        <div><dt>Daily rate at request</dt><dd>{money(booking.daily_rate_snapshot_inr)}</dd></div>
        <div><dt>Rental total (estimate)</dt><dd>{money(booking.rental_total_inr)}</dd></div>
        <div><dt>Requested deposit</dt><dd>{money(booking.deposit_snapshot_inr)}</dd></div>
      </dl>
      <p className="interaction-notice">
        No in-app payment, deposit custody, insurance or automatic refund is provided.
        The platform records request and confirmations only; discuss handover safely.
      </p>
    </div>
    <ExchangeTimeline title="Your booking timeline" steps={[
      {title:"Request created",description:"Your rental request has been recorded.",done:true},
      {title:"Booking approved",description:["declined","cancelled"].includes(booking.status)?"Request ended: "+booking.status:"The lender approves the requested dates.",done:booking.status==="cancelled"?undefined:["approved","active","returned"].includes(booking.status)},
      {title:"Item handed over",description:"Both participants confirm collection.",done:Boolean(booking.owner_handover_at&&booking.renter_handover_at)},
      {title:"Item returned",description:"Both participants confirm the return.",done:Boolean(booking.owner_return_at&&booking.renter_return_at)},
    ]}/>
    {enabled&&<section className="rental-control-panel">
      <h2>Booking actions</h2>
      <div className="rental-actions">
        {owner&&booking.status==="requested"&&
          <>
            <RentalBookingDecision id={booking.id} decision="approve" label="Approve booking"/>
            <RentalBookingDecision id={booking.id} decision="decline" label="Decline"/>
          </>}
        {!owner&&(booking.status==="requested"||booking.status==="approved")&&
          <RentalBookingDecision id={booking.id} decision="cancel" label="Cancel request"/>}
        {booking.status==="approved"&&!confirmedPickup&&
          <RentalBookingDecision id={booking.id} decision="confirm_handover"
            label="Confirm item handover"/>}
        {booking.status==="active"&&!confirmedReturn&&
          <RentalBookingDecision id={booking.id} decision="confirm_return"
            label="Confirm item returned"/>}
      </div>
      {booking.status==="approved"&&<p className="interaction-note">
        Both the lender and borrower must confirm handover before the rental becomes active.</p>}
      {booking.status==="active"&&<p className="interaction-note">
        Both participants must confirm return before the rental is closed.</p>}
    </section>}
    <section className="rental-condition-section">
      <h2>Condition and incident notes</h2>
      {notes.length?<div className="rental-note-list">{notes.map(note=>
        <article className="rental-note" key={note.id}>
          <strong>{note.stage} · {note.author_id===myId?"You":"Other participant"}</strong>
          <p>{note.note}</p>
          <time dateTime={note.created_at}>{new Date(note.created_at).toLocaleString("en-IN")}</time>
        </article>)}</div>:
        <p className="interaction-note">No condition notes have been recorded yet.</p>}
      {enabled&&["approved","active","returned"].includes(booking.status)&&
        <RentalConditionForm id={booking.id}/>}
    </section>
  </div>;
}
