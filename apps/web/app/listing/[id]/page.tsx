import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ListingPhotoUpload } from "@/components/listing-photo-upload";
import { getListing } from "@/lib/listings/data";
import { ListingStatusForm } from "@/components/listing-status-form";
import { SavedToggle } from "@/components/trust-forms";
import { serverSupabase } from "@/lib/supabase/server";
import { StartSaleConversation } from "@/components/sale-interaction-forms";

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
  const trustEnabled = process.env.ENABLE_MARKETPLACE_USER_ACTIONS === "true";
  const privateClient = trustEnabled ? await serverSupabase() : null;
  const saved = !owner && privateClient ? Boolean((await privateClient.from("favorites")
    .select("listing_id").eq("listing_id", listing.id).eq("user_id", userId)
    .maybeSingle()).data) : false;
  const writeControlsEnabled = process.env.ENABLE_MARKETPLACE_WRITES === "true";
  const interactionsEnabled = process.env.ENABLE_MARKETPLACE_INTERACTIONS === "true";
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
            <h2>Connect about this item</h2>
            <p>Message the seller, or discuss a price in a private conversation.</p>
            {trustEnabled && listing.status === "active" &&
              <SavedToggle listingId={listing.id} saved={saved}/>}
            {listing.status === "active" && interactionsEnabled ?
              <StartSaleConversation listingId={listing.id} /> :
              <p>Messaging and offers are not available for this listing yet.</p>}
            {listing.status === "active" && trustEnabled && <Link href={"/report/"+listing.id} className="text-link">Report this listing →</Link>}
          </div>
        }
      </div>
    </div>
  </article>;
}
