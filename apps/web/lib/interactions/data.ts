import "server-only";
import { verifiedMarketplaceContext } from "@/lib/listings/data";
import { isUuid } from "@/lib/interactions/validation";

export type SaleThread = {
  id: string; listing_id: string; buyer_id: string;
  seller_id: string; created_at: string;
};
export type SaleMessage = {
  id: string; conversation_id: string; sender_id: string;
  message_body: string; created_at: string;
};
export type SaleOffer = {
  id: string; conversation_id: string; listing_id: string;
  proposer_id: string; recipient_id: string; parent_offer_id: string | null;
  amount_inr: number; status: string; created_at: string;
};

export async function getSaleInbox() {
  const context = await verifiedMarketplaceContext();
  if (context.kind !== "ready") return { kind: context.kind, conversations: [] as Array<SaleThread & { title: string }> };

  const { data, error } = await context.client.from("sale_conversations")
    .select("id,listing_id,buyer_id,seller_id,created_at")
    .order("created_at", { ascending: false }).limit(50);
  if (error) return { kind: "error" as const, conversations: [] as Array<SaleThread & { title: string }> };

  const threads = (data ?? []) as SaleThread[];
  if (!threads.length) return { kind: "ready" as const, conversations: [] as Array<SaleThread & { title: string }> };
  const { data: listings } = await context.client.from("listings")
    .select("id,title").in("id", threads.map(t => t.listing_id));
  const names = new Map((listings ?? []).map(x => [x.id, x.title]));
  return { kind: "ready" as const, conversations: threads.map(t => ({
    ...t, title: names.get(t.listing_id) ?? "Listing no longer available",
  })) };
}

export async function getSaleThread(conversationId: string) {
  if (!isUuid(conversationId)) return null;
  const context = await verifiedMarketplaceContext();
  if (context.kind !== "ready") return null;

  const { data, error } = await context.client.from("sale_conversations")
    .select("id,listing_id,buyer_id,seller_id,created_at")
    .eq("id", conversationId).maybeSingle();
  if (error || !data) return null;
  const thread = data as SaleThread;

  const [messagesResult, offersResult, listingResult, blocksResult] = await Promise.all([
    context.client.from("sale_messages")
      .select("id,conversation_id,sender_id,message_body,created_at")
      .eq("conversation_id", thread.id)
      .order("created_at", { ascending: false }).limit(50),
    context.client.from("sale_offers")
      .select("id,conversation_id,listing_id,proposer_id,recipient_id,parent_offer_id,amount_inr,status,created_at")
      .eq("conversation_id",thread.id)
      .order("created_at",{ascending:false}).limit(30),
    context.client.from("listings").select("id,title,price_inr,status")
      .eq("id",thread.listing_id).maybeSingle(),
    context.client.from("user_blocks").select("blocked_id")
      .eq("blocker_id",context.userId),
  ]);
  if (messagesResult.error || offersResult.error || blocksResult.error) return null;
  const otherId = context.userId === thread.buyer_id ? thread.seller_id : thread.buyer_id;
  return {
    thread,
    myId: context.userId,
    otherId,
    messages: ((messagesResult.data ?? []) as SaleMessage[]).reverse(),
    offers: (offersResult.data ?? []) as SaleOffer[],
    listing: listingResult.data as { id:string; title:string; price_inr:number; status:string } | null,
    iBlockedOther: (blocksResult.data ?? []).some(b => b.blocked_id === otherId),
  };
}
