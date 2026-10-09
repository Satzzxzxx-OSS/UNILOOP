import type {Metadata} from "next";
import Link from "next/link";
import {getRentalBookings} from "@/lib/rentals/data";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"My rentals and bookings",robots:{index:false}};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{
 style:"currency",currency:"INR",maximumFractionDigits:0,
}).format(n);

export default async function RentalsDashboard(){
  const result=await getRentalBookings();
  return <div className="container listings-dashboard">
    <div className="section-heading">
      <div><p className="eyebrow">RENTAL ACTIVITY</p><h1>Rental bookings</h1>
        <p>View your own requests and items that others have asked to rent.</p></div>
      <Link className="button button-dark" href="/explore?mode=rent">Explore rentals</Link>
    </div>
    {result.kind!=="ready"?<section className="feed-notice">
      <h2>Bookings unavailable</h2><p>Sign in with an approved account to view rental activity.</p>
      <Link href="/account" className="text-link">Account →</Link>
    </section>:result.items.length?<div className="thread-list">{result.items.map(booking=>
      <Link key={booking.id} href={"/rentals/"+booking.id} className="thread-link">
        <span className="thread-indicator" aria-hidden="true">↻</span>
        <span><strong>{money(booking.rental_total_inr)} estimated rental</strong>
          <small>{booking.days_count} days · {booking.status}</small></span>
        <span className="thread-arrow" aria-hidden="true">→</span>
      </Link>)}</div>:
      <section className="feed-notice"><h2>No rental bookings yet</h2>
        <p>Your actual booking requests will show up here after submission.</p>
        <Link className="text-link" href="/rent/my">My rental items →</Link>
      </section>}
  </div>;
}
