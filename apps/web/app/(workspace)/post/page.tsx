import type {Metadata} from "next";
import Link from "next/link";
import {verifiedMarketplaceContext} from "@/lib/listings/data";
import {ExperienceListingWizard} from "@/components/experience/listing-wizard";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"List an item · Sell",robots:{index:false}};

export default async function PostPage(){
  const context=await verifiedMarketplaceContext();
  const ready=context.kind==="ready"&&process.env.ENABLE_MARKETPLACE_WRITES==="true";
  return <div className="ux-post-page">
    <div className="ux-shell">
      <nav aria-label="Breadcrumb" className="ux-breadcrumb"><Link href="/dashboard">Home</Link>
        <span>›</span><Link href="/explore">Marketplace</Link><span>›</span> Sell</nav>
      <div className="ux-post-mode" aria-label="Choose listing type">
        <Link className="ux-post-mode-active" aria-current="page" href="/post">Sell an item</Link>
        <Link href="/rent/post">Rent out an item</Link>
      </div>
      <ExperienceListingWizard mode="sell" backendReady={ready}/>
    </div>
  </div>;
}
