import type {Metadata} from "next";
import Link from "next/link";
import {verifiedMarketplaceContext} from "@/lib/listings/data";
import {ExperienceListingWizard} from "@/components/experience/listing-wizard";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"List an item · Rent out",robots:{index:false}};

export default async function RentOutPage(){
  const context=await verifiedMarketplaceContext();
  const ready=context.kind==="ready"&&process.env.ENABLE_RENTAL_OPERATIONS==="true";
  return <div className="ux-post-page">
    <div className="ux-shell">
      <nav aria-label="Breadcrumb" className="ux-breadcrumb"><Link href="/dashboard">Home</Link>
        <span>›</span><Link href="/explore?mode=rent">Rent</Link><span>›</span> Rent out</nav>
      <div className="ux-post-mode" aria-label="Choose listing type">
        <Link href="/post">Sell an item</Link>
        <Link className="ux-post-mode-active" aria-current="page" href="/rent/post">Rent out an item</Link>
      </div>
      <ExperienceListingWizard mode="rent" backendReady={ready}/>
    </div>
  </div>;
}
