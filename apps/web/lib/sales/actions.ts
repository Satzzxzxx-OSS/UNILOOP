"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {verifiedMarketplaceContext} from "@/lib/listings/data";
import {isUuid} from "@/lib/interactions/validation";
import {parseStars,parseReviewText,type SaleActionState} from "./validation";

const enabled=()=>process.env.ENABLE_SALE_TRANSACTIONS==="true";
const unavailable="Sale completion isn't available yet. No transaction has been recorded.";

export async function startSaleDeal(
  _old:SaleActionState,form:FormData,
):Promise<SaleActionState>{
  if(!enabled())return {message:unavailable};
  const offer=form.get("offer");
  if(!isUuid(offer))return {message:"Invalid offer."};
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {message:"Approved account required."};
  const {data,error}=await context.client.rpc("start_sale_transaction",{requested_offer:offer});
  if(error||typeof data!=="string")return {message:"Could not start a handover record."};
  revalidatePath("/transactions");
  redirect("/transactions/"+data);
}

export async function confirmSaleHandover(
  _old:SaleActionState,form:FormData,
):Promise<SaleActionState>{
  if(!enabled())return {message:unavailable};
  const id=form.get("transaction");
  if(!isUuid(id))return {message:"Invalid transaction."};
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {message:"Approved account required."};
  const {error}=await context.client.rpc("confirm_sale_exchange",{requested_transaction:id});
  if(error)return {message:"Confirmation is not allowed for this transaction."};
  revalidatePath("/transactions");
  revalidatePath("/transactions/"+id);
  redirect("/transactions/"+id);
}

export async function submitSaleReview(
  _old:SaleActionState,form:FormData,
):Promise<SaleActionState>{
  if(!enabled())return {message:unavailable};
  const id=form.get("transaction");
  const stars=parseStars(form.get("stars"));
  const text=parseReviewText(form.get("review"));
  if(!isUuid(id)||stars===null||!text)
    return {message:"Choose 1–5 stars and write at least 15 characters."};
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {message:"Approved account required."};
  const {error}=await context.client.rpc("review_completed_sale",{
    requested_transaction:id,stars,details:text,
  });
  if(error)return {message:"Unable to save review. Only one review per completed exchange."};
  revalidatePath("/transactions/"+id);
  redirect("/transactions/"+id);
}
