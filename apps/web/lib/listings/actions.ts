"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifiedMarketplaceContext } from "@/lib/listings/data";
import { isListingId, isTransitionTarget, parseListingInput } from "@/lib/listings/validation";

export type ActionState = { message: string };
const NOT_READY = "Listing changes are unavailable until the account and marketplace are activated.";

function listingMutationsEnabled() {
  return process.env.ENABLE_MARKETPLACE_WRITES === "true";
}

export async function createListingDraft(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!listingMutationsEnabled()) return { message: NOT_READY };
  const parsed = parseListingInput({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    price: formData.get("price"),
    condition: formData.get("condition"),
  });
  if (!parsed.ok) return { message: parsed.error };

  const context = await verifiedMarketplaceContext();
  if (context.kind !== "ready")
    return { message: "Sign in with an approved account before creating a listing." };

  const { data, error } = await context.client.from("listings").insert({
    ...parsed.value,
    owner_id: context.userId,
    campus_id: context.campusId,
    mode: "sell",
  }).select("id").single();

  if (error || !data) return { message: "Unable to save the draft. Please try again." };
  revalidatePath("/my/listings");
  redirect("/listing/" + data.id);
}

export async function changeListingStatus(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!listingMutationsEnabled()) return { message: NOT_READY };
  const id = formData.get("id");
  const status = formData.get("status");
  if (!isListingId(id) || !isTransitionTarget(status))
    return { message: "Invalid request." };

  const context = await verifiedMarketplaceContext();
  if (context.kind !== "ready")
    return { message: "Your account cannot perform this action." };

  // Database function independently checks live membership, owner, transition,
  // and serializes simultaneous status updates with row-level locking.
  const { error } = await context.client.rpc("transition_sale_listing", {
    listing_id: id,
    next_status: status,
  });
  if (error) return { message: "This change is not available for this listing." };
  revalidatePath("/explore");
  revalidatePath("/my/listings");
  revalidatePath("/listing/" + id);
  return { message: "Listing status updated." };
}
