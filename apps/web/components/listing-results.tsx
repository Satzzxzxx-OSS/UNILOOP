import Link from "next/link";
import { EmptyFeed } from "@/components/empty-feed";
import { ListingCard } from "@/components/listing-card";
import type { ListingsResult } from "@/lib/listings/data";
import type { MarketMode } from "@/lib/catalog";

export function ListingResults({
  result, mode, search,
}: {
  result: ListingsResult; mode: MarketMode; search?: string;
}) {
  if (mode === "rent") return <EmptyFeed mode="rent" />;
  if (result.kind === "login")
    return <div className="feed-notice"><h3>Sign in to explore</h3>
      <p>Listings become available after your account is approved.</p>
      <Link href="/account" className="button button-dark">Go to account</Link></div>;
  if (result.kind === "unconfigured")
    return <div className="feed-notice"><h3>Marketplace is being prepared</h3>
      <p>Live listings aren&apos;t connected yet. No sample products are shown.</p></div>;
  if (result.kind === "not_eligible")
    return <div className="feed-notice"><h3>Access is not enabled</h3>
      <p>There are no listings available to this account.</p></div>;
  if (result.kind === "error")
    return <div className="feed-notice" role="alert"><h3>Unable to load listings</h3>
      <p>Please try again shortly. No cached or invented results are shown.</p></div>;

  if (!result.items.length) return <EmptyFeed mode={mode} search={search} />;

  return <div className="listing-grid">{result.items.map(item =>
    <ListingCard key={item.id} listing={item} />)}</div>;
}
