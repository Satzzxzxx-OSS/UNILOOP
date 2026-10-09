import type {Metadata} from "next";
import Link from "next/link";
import {getSaleDeals} from "@/lib/sales/data";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Sale exchanges",robots:{index:false}};
const money=(n:number)=>new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n);

export default async function TransactionsPage(){
  const result=await getSaleDeals();
  return <div className="container listings-dashboard">
    <div className="section-heading">
      <div><p className="eyebrow">SALE EXCHANGES</p><h1>Handover records</h1>
        <p>Track confirmed handovers separately from price offers.</p></div>
      <Link href="/inbox" className="button button-dark">Messages & offers</Link>
    </div>
    {result.kind!=="ready"?<section className="feed-notice">
      <h2>Records unavailable</h2>
      <p>Sign in with an approved account to view your sale handovers.</p>
      <Link className="text-link" href="/account">Account →</Link>
    </section>:result.items.length?<div className="thread-list">{result.items.map(item=>
      <Link key={item.id} href={"/transactions/"+item.id} className="thread-link">
        <span className="thread-indicator" aria-hidden="true">✓</span>
        <span><strong>{money(item.agreed_price_inr)} agreed price</strong>
          <small>{item.status.replaceAll("_"," ")}</small></span>
        <span className="thread-arrow" aria-hidden="true">→</span>
      </Link>)}</div>:
      <section className="feed-notice"><h2>No handover records yet</h2>
        <p>When a price offer is accepted, approved accounts can begin a mutual handover record.</p>
      </section>}
  </div>;
}
