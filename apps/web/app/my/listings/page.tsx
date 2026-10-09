import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { getMyListings } from "@/lib/listings/data";

export const metadata: Metadata = { title: "My listings", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function MyListingsPage() {
  const result = await getMyListings();

  return <div className="container listings-dashboard">
    <div className="section-heading">
      <div><p className="eyebrow">MY ITEMS</p><h1>My listings</h1>
        <p>Keep track of your sale drafts and published items.</p></div>
      <Link href="/post" className="button button-dark">Create listing +</Link>
    </div>
    {result.kind !== "ready" ?
      <div className="feed-notice"><h2>Listings are unavailable</h2>
        <p>{result.kind === "login" ? "Sign in to view your listings." :
          result.kind === "not_eligible" ? "Marketplace access is not enabled for this account." :
          "Unable to load your listings. Please try again later."}</p>
        <Link href="/account" className="text-link">Go to account →</Link>
      </div> :
      result.items.length ?
        <div className="listing-grid">{result.items.map(listing =>
          <ListingCard key={listing.id} listing={listing}/>)}</div> :
        <div className="feed-notice"><h2>No listings yet</h2>
          <p>Start with an accurate description and save your first draft.</p>
          <Link href="/post" className="button button-dark">Create a draft</Link></div>}
  </div>;
}
