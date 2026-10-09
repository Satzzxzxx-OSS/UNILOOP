import Link from "next/link";
import Image from "next/image";
import { categories } from "@/lib/catalog";
import type { Listing } from "@/lib/listings/data";

export function ListingCard({ listing }: { listing: Listing }) {
  const label = categories.find(c => c.slug === listing.category_slug)?.label ?? "Item";
  return (
    <article className="listing-card">
      <Link href={"/listing/" + listing.id} className="listing-card-link">
        <div className="listing-card-visual">
          {listing.photo_url ? <Image src={listing.photo_url} alt={listing.title}
            width={520} height={390} unoptimized className="listing-cover-photo" /> :
            <><span className="listing-illustration">✳</span>
            <span className="listing-media-note">Photos not available</span></>}
        </div>
        <div className="listing-card-body">
          <p className="listing-category">{label}</p>
          <h3>{listing.title}</h3>
          <p className="listing-price">{new Intl.NumberFormat("en-IN", {
            style: "currency", currency: "INR", maximumFractionDigits: 0,
          }).format(listing.price_inr)}</p>
          <p className="listing-meta">{listing.item_condition.replaceAll("_", " ")} · {listing.status}</p>
        </div>
      </Link>
    </article>
  );
}
