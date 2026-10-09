import type {Metadata} from "next";
import Link from "next/link";
import {getMyRentalListings} from "@/lib/rentals/data";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"My rental items",robots:{index:false}};
export default async function MyRentalsPage(){
  const result=await getMyRentalListings();
  return <div className="container listings-dashboard">
    <div className="section-heading">
      <div><p className="eyebrow">YOUR LENDING ACTIVITY</p><h1>My rental items</h1>
        <p>Your drafts, available items and paused rental listings.</p></div>
      <Link className="button button-dark" href="/rent/post">Rent out an item +</Link>
    </div>
    {result.kind!=="ready"?<section className="feed-notice">
      <h2>Rental items unavailable</h2>
      <p>Sign in with an approved account to view and manage your rental listings.</p>
      <Link className="text-link" href="/account">Account →</Link>
    </section>:result.items.length?
      <div className="rental-owner-list">{result.items.map(item=>
        <Link key={item.id} href={"/rent/"+item.id} className="thread-link">
          <span className="thread-indicator" aria-hidden="true">↻</span>
          <span><strong>{item.title}</strong>
            <small>₹{item.daily_rate_inr} / day · {item.status}</small></span>
          <span className="thread-arrow" aria-hidden="true">→</span>
        </Link>
      )}</div>:
      <section className="feed-notice"><h2>No rental drafts yet</h2>
        <p>Create an accurate rental draft to get started.</p>
        <Link href="/rent/post" className="button button-dark">Create draft</Link>
      </section>}
  </div>;
}
