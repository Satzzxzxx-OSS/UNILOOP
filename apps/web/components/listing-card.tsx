import Link from "next/link";
import Image from "next/image";
import {categories} from "@/lib/catalog";
import {CategoryIcon} from "@/components/category-icon";
import {Badge} from "@/components/spaceui/badge";
import {ExperienceIcon} from "@/components/experience/experience-header";
import type {Listing} from "@/lib/listings/data";

const format=(n:number)=>new Intl.NumberFormat("en-IN",{
 style:"currency",currency:"INR",maximumFractionDigits:0,
}).format(n);
export function ListingCard({listing}:{listing:Listing}){
  const category=categories.find(c=>c.slug===listing.category_slug);
  return <article className="ux-product-card">
    <Link href={"/listing/"+listing.id} className="ux-product-link">
      <div className="ux-product-image">
        {listing.photo_url?
          <Image src={listing.photo_url} alt={listing.title}
            width={520} height={390} unoptimized className="ux-product-cover"/>:
          <div className="ux-product-no-photo">
            {category&&<CategoryIcon name={category.symbol}/>}
            <span>Photo not available</span>
          </div>}
        <Badge className="ux-product-chip" variant="outline">For sale</Badge>
        <span className="ux-product-view" aria-hidden="true"><ExperienceIcon name="arrow" size={19}/></span>
      </div>
      <div className="ux-product-body">
        <p className="ux-product-category">{category?.label??"Item"} · {listing.item_condition.replaceAll("_"," ")}</p>
        <h3>{listing.title}</h3>
        <div className="ux-product-bottom">
          <strong>{format(listing.price_inr)}</strong>
          {listing.status!=="active"&&<span className="ux-product-status">{listing.status}</span>}
        </div>
      </div>
    </Link>
  </article>;
}
