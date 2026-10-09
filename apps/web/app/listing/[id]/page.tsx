import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ListingPhotoUpload } from "@/components/listing-photo-upload";
import { getListing } from "@/lib/listings/data";
import { ListingStatusForm } from "@/components/listing-status-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Listing details", robots: { index: false } };

export default async function ListingDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getListing(id);
  if (!result) notFound();
  const { listing, userId, photos, photoCount } = result;
  const owner = userId === listing.owner_id;
  const writeControlsEnabled = process.env.ENABLE_MARKETPLACE_WRITES === "true";
  const price = new Intl.NumberFormat("en-IN", {
    style: "currency", currency: "INR", maximumFractionDigits: 0,
  }).format(listing.price_inr);

  return <article className="container listing-detail-page">
    <Link href="/explore" className="text-link">← Back to explore</Link>
    <div className="listing-detail-grid">
      <div className="listing-detail-photo">
        {photos.length ? <div className="listing-photo-gallery">{photos.map((url,index) =>
          <Image key={url} src={url} alt={"Photo " + (index + 1) + " of " + listing.title}
            width={700} height={580} unoptimized className="listing-detail-image" />
        )}</div> : <><span aria-hidden="true">✳</span><p>Photos not yet available</p></>}
      </div>
      <div className="listing-detail-content">
        <p className="eyebrow">SALE LISTING</p>
        <h1>{listing.title}</h1>
        <p className="listing-detail-price">{price}</p>
        <p className="listing-detail-attributes">
          <span>Condition: {listing.item_condition.replaceAll("_", " ")}</span>
          <span>State: {listing.status}</span>
        </p>
        <h2>Description</h2>
        <p className="listing-description">{listing.description}</p>
        {owner ?
          <>
            <p className="listing-owner-note">You own this listing. Only approved and active listings are discoverable by other accounts.</p>
            {writeControlsEnabled && (listing.status === "draft" || listing.status === "paused") &&
              <ListingPhotoUpload listingId={listing.id} count={photoCount}/>}
            {writeControlsEnabled && <ListingStatusForm id={listing.id} current={listing.status} hasPhoto={photoCount > 0}/>}
            <Link className="text-link" href="/my/listings">Manage all my listings →</Link>
          </> :
          <div className="feed-notice listing-contact-notice">
            <h2>Contact options are being prepared</h2>
            <p>Messaging and offers will become available once their real, secure workflows launch.</p>
          </div>
        }
      </div>
    </div>
  </article>;
}
