import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getListing } from "@/lib/listings/data";
import { ListingReportForm } from "@/components/trust-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Report listing", robots: { index: false } };

export default async function ReportPage({params}:{
  params:Promise<{id:string}>;
}){
  const {id}=await params;
  const result=await getListing(id);
  if(!result || result.listing.owner_id===result.userId) notFound();
  const enabled=process.env.ENABLE_MARKETPLACE_USER_ACTIONS==="true";
  return <div className="container listing-create-page">
    <p className="eyebrow">HELP US KEEP IT SAFE</p>
    <h1>Report a listing</h1>
    <p>Tell our review team what looks wrong with <strong>{result.listing.title}</strong>.
      Reports are not public and do not automatically remove an item.</p>
    {enabled?<ListingReportForm listingId={id}/>:
      <section className="feed-notice"><h2>Reports are temporarily unavailable</h2>
        <p>Reporting will be activated only after the moderation workflow has passed staging checks.</p></section>}
    <Link className="text-link" href={"/listing/"+id}>← Back to item</Link>
  </div>;
}
