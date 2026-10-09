import "server-only";
import {verifiedMarketplaceContext} from "@/lib/listings/data";
import {isUuid} from "@/lib/interactions/validation";

export type SaleDeal={
  id:string;offer_id:string;listing_id:string;buyer_id:string;seller_id:string;
  agreed_price_inr:number;status:string;buyer_received_at:string|null;
  seller_handed_over_at:string|null;created_at:string;completed_at:string|null;
};
const select="id,offer_id,listing_id,buyer_id,seller_id,agreed_price_inr,status,buyer_received_at,seller_handed_over_at,created_at,completed_at";
export async function getSaleDeals(){
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {kind:context.kind,items:[] as SaleDeal[]};
  const {data,error}=await context.client.from("sale_transactions").select(select)
    .order("created_at",{ascending:false}).limit(40);
  return error?{kind:"error" as const,items:[] as SaleDeal[]}:
    {kind:"ready" as const,items:(data??[]) as SaleDeal[]};
}
export async function getSaleDeal(id:string){
  if(!isUuid(id))return null;
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return null;
  const {data,error}=await context.client.from("sale_transactions")
    .select(select).eq("id",id).maybeSingle();
  if(error||!data)return null;
  const deal=data as SaleDeal;
  const [listing,reviews]=await Promise.all([
    context.client.from("listings").select("id,title,status")
      .eq("id",deal.listing_id).maybeSingle(),
    context.client.from("sale_reviews")
      .select("id,reviewer_id,reviewed_user_id,rating,review_body,created_at")
      .eq("transaction_id",deal.id).order("created_at",{ascending:false}),
  ]);
  return {deal,listing:listing.data,myId:context.userId,reviews:reviews.data??[]};
}
