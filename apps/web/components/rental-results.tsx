import Link from "next/link";
import Image from "next/image";
import type {RentalItem,RentalResult} from "@/lib/rentals/data";
import {categories} from "@/lib/catalog";
import {CategoryIcon} from "@/components/category-icon";
import {Badge} from "@/components/spaceui/badge";
import {ExperienceIcon} from "@/components/experience/experience-header";

const money=(n:number)=>new Intl.NumberFormat("en-IN",{
 style:"currency",currency:"INR",maximumFractionDigits:0,
}).format(n);
export function RentalCard({rental}:{rental:RentalItem}){
  const category=categories.find(c=>c.slug===rental.category_slug);
  return <article className="ux-product-card">
    <Link href={"/rent/"+rental.id} className="ux-product-link">
      <div className="ux-product-image ux-product-image-rent">
        {rental.photo_url?
          <Image src={rental.photo_url} alt={rental.title} width={520} height={390}
            className="ux-product-cover" unoptimized/>:
          <div className="ux-product-no-photo">
            {category&&<CategoryIcon name={category.symbol}/>}
            <span>Photo not available</span>
          </div>}
        <Badge variant="outline" className="ux-product-chip">For rent</Badge>
        <span className="ux-product-view" aria-hidden="true"><ExperienceIcon name="arrow" size={19}/></span>
      </div>
      <div className="ux-product-body">
        <p className="ux-product-category">{category?.label??"Rental"} · {rental.item_condition.replaceAll("_"," ")}</p>
        <h3>{rental.title}</h3>
        <div className="ux-product-bottom"><strong>{money(rental.daily_rate_inr)} <small>/ day</small></strong>
          {rental.status!=="active"&&<span className="ux-product-status">{rental.status}</span>}</div>
        <p className="ux-product-sub">Rental period: {rental.min_days}–{rental.max_days} days</p>
      </div>
    </Link>
  </article>;
}
export function RentalResults({result}:{result:RentalResult}){
  if(result.kind!=="ready")return <section className="feed-notice">
    <h3>{result.kind==="login"?"Your next rental starts with your account":
      result.kind==="not_eligible"?"Marketplace access isn't available for this account":
      "Rental discovery is not connected yet"}</h3>
    <p>Sign in with approved access to browse rentals in your marketplace.</p>
    <Link href="/account" className="text-link">Account →</Link>
  </section>;
  if(!result.items.length)return <section className="feed-notice">
    <h3>Nothing up for rent right now.</h3>
    <p>As real rental listings become available, you&apos;ll find them here.</p>
    <Link href="/explore?mode=rent" className="text-link">Explore categories →</Link>
  </section>;
  return <div className="listing-grid">{result.items.map(item=>
    <RentalCard key={item.id} rental={item}/>)}</div>;
}
