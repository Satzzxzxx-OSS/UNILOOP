import type { Metadata } from "next";
import Link from "next/link";
import { CreateListingForm } from "@/components/create-listing-form";
import { verifiedMarketplaceContext } from "@/lib/listings/data";

export const metadata: Metadata = { title: "Create a listing", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function PostPage() {
  const context = await verifiedMarketplaceContext();
  const enabled = process.env.ENABLE_MARKETPLACE_WRITES === "true";

  if (context.kind !== "ready" || !enabled) {
    return <div className="container quiet-page">
      <span className="quiet-mark" aria-hidden="true">＋</span>
      <p className="eyebrow">SELL AN ITEM</p>
      <h1>{context.kind === "login" ? "Sign in to list your item." : "Listing creation is not yet available."}</h1>
      <p>{context.kind === "not_eligible"
        ? "This account does not currently have permission to publish listings."
        : "We're preparing verified accounts and safe listing tools. Nothing has been submitted."}</p>
      <Link href={context.kind === "login" ? "/account" : "/explore"} className="button button-dark">
        {context.kind === "login" ? "Go to account" : "Explore items"} <span aria-hidden="true">↗</span>
      </Link>
    </div>;
  }

  return <div className="container listing-create-page">
    <p className="eyebrow">YOUR NEXT LISTING</p>
    <h1>Give something a second life.</h1>
    <p>Create a sale listing draft. Publishing is a separate step so you can review everything first.</p>
    <div className="rental-crosslink"><strong>Want to lend instead?</strong>
      <Link href="/rent/post" className="text-link">Create a rental listing →</Link></div>
    <CreateListingForm />
    <Link href="/my/listings" className="text-link">View my listings →</Link>
  </div>;
}
