"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { verifiedMarketplaceContext } from "@/lib/listings/data";
import { isUuid, isDecision, parseMessage, parseOfferRupees, type InteractionState } from "./validation";

const NOT_READY = "Messaging and offers are not available until the marketplace is activated.";
const enabled = () => process.env.ENABLE_MARKETPLACE_INTERACTIONS === "true";

async function getContext() {
  const context = await verifiedMarketplaceContext();
  return context.kind === "ready" ? context : null;
}

export async function openConversation(
  _previous: InteractionState, form: FormData,
): Promise<InteractionState> {
  if (!enabled()) return { message: NOT_READY };
  const listing = form.get("listing");
  if (!isUuid(listing)) return { message: "Invalid listing." };
  const context = await getContext();
  if (!context) return { message: "An approved account is required." };
  const { data, error } = await context.client.rpc("open_sale_conversation", {
    requested_listing: listing,
  });
  if (error || typeof data !== "string" || !isUuid(data))
    return { message: "Unable to start this conversation." };
  redirect("/inbox/" + data);
}

export async function sendMessage(
  _previous: InteractionState, form: FormData,
): Promise<InteractionState> {
  if (!enabled()) return { message: NOT_READY };
  const conversation = form.get("conversation");
  const nonce = form.get("nonce");
  const body = parseMessage(form.get("body"));
  if (!isUuid(conversation) || !isUuid(nonce) || !body)
    return { message: "Enter a message between 1 and 2000 characters." };
  const context = await getContext();
  if (!context) return { message: "Account access is required." };

  const { error } = await context.client.rpc("send_sale_message", {
    requested_conversation: conversation, content: body, request_nonce: nonce,
  });
  if (error) return { message: "Could not send. You may need to wait before sending again." };
  revalidatePath("/inbox");
  revalidatePath("/inbox/" + conversation);
  redirect("/inbox/" + conversation);
}

export async function submitOffer(
  _previous: InteractionState, form: FormData,
): Promise<InteractionState> {
  if (!enabled()) return { message: NOT_READY };
  const conversation = form.get("conversation");
  const nonce = form.get("nonce");
  const parentValue = form.get("parent_offer");
  const amount = parseOfferRupees(form.get("amount"));
  const parent = parentValue === "" ? null : parentValue;
  if (!isUuid(conversation) || !isUuid(nonce) || amount === null ||
    (parent !== null && !isUuid(parent)))
    return { message: "Enter a valid offer in whole rupees." };

  const context = await getContext();
  if (!context) return { message: "Account access is required." };
  const { error } = await context.client.rpc("submit_sale_offer", {
    requested_conversation: conversation,
    requested_amount: amount,
    parent_offer: parent,
    request_nonce: nonce,
  });
  if (error) return { message: "Offer could not be placed. Refresh to see the latest negotiation state." };
  revalidatePath("/inbox/" + conversation);
  redirect("/inbox/" + conversation);
}

export async function decideOffer(
  _previous: InteractionState, form: FormData,
): Promise<InteractionState> {
  if (!enabled()) return { message: NOT_READY };
  const id = form.get("offer");
  const conversation = form.get("conversation");
  const decision = form.get("decision");
  if (!isUuid(id) || !isUuid(conversation) || !isDecision(decision))
    return { message: "Invalid offer decision." };

  const context = await getContext();
  if (!context) return { message: "Account access is required." };
  const { error } = await context.client.rpc("resolve_sale_offer", {
    requested_offer: id, decision,
  });
  if (error) return { message: "Offer changed or the action is not allowed." };
  revalidatePath("/inbox/" + conversation);
  redirect("/inbox/" + conversation);
}

export async function changeBlock(
  _previous: InteractionState, form: FormData,
): Promise<InteractionState> {
  if (!enabled()) return { message: NOT_READY };
  const other = form.get("other");
  const thread = form.get("conversation");
  const action = form.get("action");
  if (!isUuid(other) || !isUuid(thread) ||
    (action !== "block" && action !== "unblock"))
    return { message: "Invalid request." };
  const context = await getContext();
  if (!context) return { message: "Account access is required." };

  // Verify the other identity belongs to THIS readable conversation.
  const { data: conversation, error: threadError } = await context.client
    .from("sale_conversations").select("buyer_id,seller_id")
    .eq("id", thread).maybeSingle();
  if (threadError || !conversation ||
    !([conversation.buyer_id,conversation.seller_id].includes(context.userId)) ||
    (conversation.buyer_id === context.userId ? conversation.seller_id : conversation.buyer_id) !== other)
    return { message: "Conversation unavailable." };

  const query = context.client.from("user_blocks");
  const { error } = action === "block"
    ? await query.upsert({ blocker_id: context.userId, blocked_id: other })
    : await query.delete().eq("blocker_id",context.userId).eq("blocked_id",other);
  if (error) return { message: "Unable to change contact preference." };
  revalidatePath("/inbox/" + thread);
  redirect("/inbox/" + thread);
}
