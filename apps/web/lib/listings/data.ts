import { serverSupabase } from "@/lib/supabase/server";
import { cleanSearchQuery, parseCategory } from "@/lib/catalog";
import { isListingId, type ItemCondition, type ListingStatus } from "./validation";

export type Listing = {
  id: string;
  owner_id: string;
  campus_id: string;
  category_slug: string;
  title: string;
  description: string;
  price_inr: number;
  item_condition: ItemCondition;
  status: ListingStatus;
  created_at: string;
  published_at: string | null;
};

export type ListingsResult =
  | { kind: "unconfigured" | "login" | "not_eligible" | "error"; items: Listing[] }
  | { kind: "ready"; items: Listing[] };

export async function verifiedMarketplaceContext() {
  const client = await serverSupabase();
  if (!client) return { kind: "unconfigured" as const };
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { kind: "login" as const };

  // Only rows permitted by campus RLS are selectable here.
  const { data: campus, error: campusError } = await client
    .from("campuses").select("id").order("id").limit(1).maybeSingle();
  if (campusError) return { kind: "error" as const };
  if (!campus) return { kind: "not_eligible" as const };
  return { kind: "ready" as const, client, userId: user.id, campusId: campus.id };
}

export async function discoverListings({
  category, search, limit = 18,
}: {
  category?: string | null;
  search?: string;
  limit?: number;
} = {}): Promise<ListingsResult> {
  const context = await verifiedMarketplaceContext();
  if (context.kind !== "ready") return { kind: context.kind, items: [] };

  let query = context.client.from("listings")
    .select("id, owner_id, campus_id, category_slug, title, description, price_inr, item_condition, status, created_at, published_at")
    .eq("campus_id", context.campusId)
    .eq("status", "active")
    .order("published_at", { ascending: false })
    .limit(Math.min(Math.max(1, limit), 24));

  const safeCategory = parseCategory(category);
  if (safeCategory) query = query.eq("category_slug", safeCategory);
  const text = cleanSearchQuery(search);
  if (text) {
    // Wildcard characters are treated as literal characters.
    const literal = text.replace(/[\\%_]/g, "\\$&");
    query = query.ilike("title", "%" + literal + "%");
  }

  const { data, error } = await query;
  if (error) return { kind: "error", items: [] };
  return { kind: "ready", items: (data ?? []) as Listing[] };
}

export async function getListing(listingId: string) {
  if (!isListingId(listingId)) return null;
  const context = await verifiedMarketplaceContext();
  if (context.kind !== "ready") return null;
  const { data, error } = await context.client
    .from("listings")
    .select("id, owner_id, campus_id, category_slug, title, description, price_inr, item_condition, status, created_at, published_at")
    .eq("id", listingId)
    .eq("campus_id", context.campusId)
    .maybeSingle();
  if (error || !data) return null;
  return { listing: data as Listing, userId: context.userId };
}

export async function getMyListings(): Promise<ListingsResult> {
  const context = await verifiedMarketplaceContext();
  if (context.kind !== "ready") return { kind: context.kind, items: [] };
  const { data, error } = await context.client
    .from("listings")
    .select("id, owner_id, campus_id, category_slug, title, description, price_inr, item_condition, status, created_at, published_at")
    .eq("owner_id", context.userId)
    .eq("campus_id", context.campusId)
    .neq("status", "removed")
    .order("created_at", { ascending: false })
    .limit(24);
  if (error) return { kind: "error", items: [] };
  return { kind: "ready", items: (data ?? []) as Listing[] };
}
