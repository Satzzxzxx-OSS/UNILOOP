import Link from "next/link";
import Image from "next/image";
import type { RentalItem,RentalResult } from "@/lib/rentals/data";

const money=(value:number)=>new Intl.NumberFormat("en-IN",{
  style:"currency",currency:"INR",maximumFractionDigits:0,
}).format(value);

export function RentalCard({rental}:{rental:RentalItem}){
  return <article className="listing-card">
    <Link href={"/rent/"+rental.id} className="listing-card-link">
      <div className="listing-card-visual">
        {rental.photo_url?
          <Image src={rental.photo_url} alt={rental.title} unoptimized
            width={520} height={390} className="listing-cover-photo"/>:
          <><span className="listing-illustration" aria-hidden="true">✳</span>
            <span className="listing-media-note">Photo not available</span></>}
      </div>
      <div className="listing-card-body">
        <p className="listing-category">RENTAL · {rental.category_slug.replaceAll("-"," ")}</p>
        <h3>{rental.title}</h3>
        <p className="listing-price">{money(rental.daily_rate_inr)} <span className="unit">/ day</span></p>
        <p className="listing-meta">{rental.min_days}–{rental.max_days} days · {rental.item_condition.replaceAll("_"," ")}</p>
      </div>
    </Link>
  </article>;
}

export function RentalResults({result}:{result:RentalResult}){
  if(result.kind!=="ready")return <section className="feed-notice">
    <h3>{result.kind==="login"?"Sign in to explore rental items":
      result.kind==="not_eligible"?"Rental browsing is not enabled for this account":
      "Rental catalog is unavailable"}</h3>
    <p>Listings are only shown when real account access and data are available.</p>
    <Link href="/account" className="text-link">Account →</Link>
  </section>;
  if(!result.items.length)return <section className="feed-notice">
    <h3>No rental items here yet</h3>
    <p>Real rental listings will appear when published. No sample items are shown.</p>
  </section>;
  return <div className="listing-grid">{result.items.map(r=><RentalCard key={r.id} rental={r}/>)}</div>;
}
