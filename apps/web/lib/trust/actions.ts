"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isUuid } from "@/lib/interactions/validation";
import { verifiedMarketplaceContext } from "@/lib/listings/data";
import { serverSupabase } from "@/lib/supabase/server";
import { cleanProfileName, parseReportReason, parseReportDetails, type TrustActionState } from "./validation";

const enabled = () => process.env.ENABLE_MARKETPLACE_USER_ACTIONS === "true";

export async function toggleSaved(
  _previous: TrustActionState, data: FormData,
): Promise<TrustActionState> {
  if (!enabled()) return { message: "Saved items aren't available yet." };
  const listing = data.get("listing");
  const target = data.get("target");
  if (!isUuid(listing) || (target !== "add" && target !== "remove"))
    return { message: "Invalid item request." };
  const context = await verifiedMarketplaceContext();
  if (context.kind !== "ready") return { message: "An approved account is required." };
  const { error } = target === "add"
    ? await context.client.from("favorites").insert({
      user_id: context.userId, listing_id: listing,
    })
    : await context.client.from("favorites").delete()
      .eq("user_id", context.userId).eq("listing_id", listing);
  if (error && error.code !== "23505") return { message: "Unable to update saved items." };
  revalidatePath("/saved");
  revalidatePath("/listing/" + listing);
  return { message: target === "add" ? "Added to saved items." : "Removed from saved items.", ok:true };
}

export async function updateDisplayName(
  _previous: TrustActionState, data: FormData,
): Promise<TrustActionState> {
  if (!enabled()) return { message: "Account changes aren't available yet." };
  const name = cleanProfileName(data.get("display_name"));
  if (!name) return { message: "Enter a name between 2 and 60 characters." };
  const client = await serverSupabase();
  if (!client) return { message: "Account service unavailable." };
  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return { message: "Sign in before editing your profile." };
  const { error } = await client.from("profiles").update({ display_name:name }).eq("id",user.id);
  if (error) return { message: "Could not save your profile." };
  revalidatePath("/account");
  revalidatePath("/settings");
  return { message: "Profile name saved.", ok:true };
}

export async function saveNotificationPrefs(
  _previous: TrustActionState, form: FormData,
): Promise<TrustActionState> {
  if (!enabled()) return { message: "Preferences aren't available yet." };
  const client=await serverSupabase();
  if (!client) return { message: "Service unavailable." };
  const { data:{user}, error:authError }=await client.auth.getUser();
  if (authError || !user) return {message:"Sign in to edit your preferences."};
  const prefs={
    email_messages:form.get("email_messages")==="on",
    email_offers:form.get("email_offers")==="on",
  };
  const { data: existing, error: readError }=await client.from("notification_preferences")
    .select("user_id").eq("user_id",user.id).maybeSingle();
  if (readError) return {message:"Unable to load your preferences."};
  const {error}=existing
    ? await client.from("notification_preferences").update(prefs).eq("user_id",user.id)
    : await client.from("notification_preferences").insert({...prefs,user_id:user.id});
  if(error) return {message:"Unable to save preferences."};
  revalidatePath("/settings");
  return {message:"Preferences saved.",ok:true};
}

export async function sendListingReport(
  _previous: TrustActionState, form: FormData,
): Promise<TrustActionState> {
  if (!enabled()) return {message:"Reporting is not available yet."};
  const listing=form.get("listing");
  const reason=parseReportReason(form.get("reason"));
  const details=parseReportDetails(form.get("details"));
  if (!isUuid(listing) || !reason || !details)
    return {message:"Choose a reason and write at least 15 characters."};
  const context=await verifiedMarketplaceContext();
  if(context.kind!=="ready") return {message:"Sign in with an approved account to report."};
  const {error}=await context.client.from("listing_reports").insert({
    listing_id:listing,reason,details,reporter_id:context.userId,
  });
  if(error){
    if(error.code==="23505") return {message:"You already reported this reason for this item."};
    return {message:"Unable to submit report. Please try again."};
  }
  revalidatePath("/report/"+listing);
  return {message:"Report received for moderation review.",ok:true};
}

export async function reviewListingReport(
  _previous: TrustActionState, data: FormData,
): Promise<TrustActionState> {
  if (!enabled()) return {message:"Moderation operations are not enabled."};
  const id=data.get("id"),decision=data.get("decision");
  if (!isUuid(id) || (decision!=="dismiss" && decision!=="remove_listing"))
    return {message:"Invalid request."};
  const context=await verifiedMarketplaceContext();
  if (context.kind!=="ready") return {message:"Access denied."};
  const {error}=await context.client.rpc("review_listing_report",{
    report_id:id,resolution:decision,
  });
  if(error) return {message:"Review was not permitted or is no longer pending."};
  revalidatePath("/admin/reports");
  redirect("/admin/reports");
}
