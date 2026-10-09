"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifiedMarketplaceContext } from "@/lib/listings/data";
import { isUuid } from "@/lib/interactions/validation";
import {
  parseRentalInput,isCalendarDate,parseRentalDecision,
  type RentalActionState,
} from "./validation";

const enabled=()=>process.env.ENABLE_RENTAL_OPERATIONS==="true";
const NOT_READY="Renting isn't available yet. No request has been submitted.";

export async function createRentalDraft(
  _old:RentalActionState,form:FormData,
):Promise<RentalActionState>{
  if(!enabled())return {message:NOT_READY};
  const values=parseRentalInput({
    title:form.get("title"),description:form.get("description"),
    category:form.get("category"),daily_rate:form.get("daily_rate"),
    deposit:form.get("deposit"),min_days:form.get("min_days"),
    max_days:form.get("max_days"),condition:form.get("condition"),
  });
  if(!values.ok)return {message:values.error};
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {message:"Approved account required."};
  const {data,error}=await context.client.from("rental_listings").insert({
    ...values.value,owner_id:context.userId,campus_id:context.campusId,
  }).select("id").single();
  if(error||!data)return {message:"Unable to save rental draft."};
  revalidatePath("/rent/my");
  redirect("/rent/"+data.id);
}

export async function changeRentalStatus(
  _old:RentalActionState,form:FormData,
):Promise<RentalActionState>{
  if(!enabled())return {message:NOT_READY};
  const item=form.get("rental"),next=form.get("status");
  if(!isUuid(item)||(next!=="active"&&next!=="paused"&&next!=="removed"))
    return {message:"Invalid rental status."};
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {message:"Approved account required."};
  const {error}=await context.client.rpc("change_rental_listing",{
    requested_rental:item,target_status:next,
  });
  if(error)return {message:"Change unavailable. Add a photo before publishing and review the current state."};
  revalidatePath("/rent/"+item);
  revalidatePath("/rent/my");
  revalidatePath("/explore");
  redirect("/rent/"+item);
}

export async function requestRental(
  _old:RentalActionState,form:FormData,
):Promise<RentalActionState>{
  if(!enabled())return {message:NOT_READY};
  const rental=form.get("rental"),nonce=form.get("nonce");
  const from=form.get("start"),until=form.get("return");
  if(!isUuid(rental)||!isUuid(nonce)||!isCalendarDate(from)||!isCalendarDate(until)
    ||from>=until)return {message:"Choose valid pickup and return dates."};
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {message:"Approved account required."};
  const {data,error}=await context.client.rpc("request_rental_booking",{
    requested_rental:rental,start_date:from,return_date:until,p_nonce:nonce,
  });
  if(error||typeof data!=="string")return {message:"These dates could not be requested. Check availability and duration."};
  revalidatePath("/rentals");
  redirect("/rentals/"+data);
}

export async function blockRentalDates(
  _old:RentalActionState,form:FormData,
):Promise<RentalActionState>{
  if(!enabled())return {message:NOT_READY};
  const rental=form.get("rental"),nonce=form.get("nonce"),
    start=form.get("start"),until=form.get("return");
  if(!isUuid(rental)||!isUuid(nonce)||!isCalendarDate(start)
    ||!isCalendarDate(until)||start>=until)
    return {message:"Enter a valid unavailable date range."};
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {message:"Approved account required."};
  const {error}=await context.client.rpc("block_rental_period",{
    requested_rental:rental,start_date:start,return_date:until,p_nonce:nonce,
  });
  if(error)return {message:"Cannot block these dates. They may already be confirmed."};
  revalidatePath("/rent/"+rental);
  redirect("/rent/"+rental);
}

export async function decideRental(
  _old:RentalActionState,form:FormData,
):Promise<RentalActionState>{
  if(!enabled())return {message:NOT_READY};
  const id=form.get("booking"),decision=parseRentalDecision(form.get("decision"));
  if(!isUuid(id)||!decision)return {message:"Invalid rental action."};
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {message:"Approved account required."};
  const {error}=await context.client.rpc("decide_rental_booking",{
    requested_booking:id,decision,
  });
  if(error)return {message:"This action isn't available in the current rental state."};
  revalidatePath("/rentals");
  revalidatePath("/rentals/"+id);
  redirect("/rentals/"+id);
}

export async function saveRentalNote(
  _old:RentalActionState,form:FormData,
):Promise<RentalActionState>{
  if(!enabled())return {message:NOT_READY};
  const id=form.get("booking"),stage=form.get("stage"),note=form.get("note");
  if(!isUuid(id)||!(stage==="pickup"||stage==="return"||stage==="incident")
    ||typeof note!=="string"||note.trim().length<10||note.trim().length>1200)
    return {message:"Enter a condition note between 10 and 1200 characters."};
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready")return {message:"Approved account required."};
  const {error}=await context.client.rpc("add_rental_condition_note",{
    requested_booking:id,stage,content:note.trim(),
  });
  if(error)return {message:"This note could not be saved."};
  revalidatePath("/rentals/"+id);
  redirect("/rentals/"+id);
}
