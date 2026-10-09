import type {Metadata} from "next";
import Link from "next/link";
import {verifiedMarketplaceContext} from "@/lib/listings/data";
import {CreateRentalForm} from "@/components/rental-ui";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Rent out an item",robots:{index:false}};
export default async function RentOutPage(){
  const context=await verifiedMarketplaceContext();
  const enabled=process.env.ENABLE_RENTAL_OPERATIONS==="true";
  if(context.kind!=="ready"||!enabled)return <div className="container quiet-page">
    <p className="eyebrow">RENT OUT</p>
    <h1>Rental listings are being prepared.</h1>
    <p>Verified rentals, safe date handling and condition records must be active before publishing.</p>
    <Link href="/explore?mode=rent" className="button button-dark">Explore rentals</Link>
  </div>;
  return <div className="container listing-create-page">
    <p className="eyebrow">RENT OUT YOUR ITEM</p>
    <h1>Useful things are worth sharing.</h1>
    <p>Start with a draft. Set a clear daily rate, disclose any requested deposit,
      and upload an image before publication.</p>
    <CreateRentalForm/>
    <Link href="/rent/my" className="text-link">My rental listings →</Link>
  </div>;
}
