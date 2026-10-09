import { serverSupabase } from "@/lib/supabase/server";

type UserDbClient = NonNullable<Awaited<ReturnType<typeof serverSupabase>>>;
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
  photo_url?: string | null;
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


async function withCoverImages(client: UserDbClient, listings: Listing[]): Promise<Listing[]> {
  if (!listings.length) return listings;
  const ids = listings.map(item => item.id);
  const { data, error } = await client.from("listing_photos")
    .select("listing_id,storage_path,position")
    .in("listing_id", ids)
    .order("position", { ascending: true });
  if (error || !data?.length) return listings;
  const covers = new Map<string, string>();
  for (const row of data) {
    if (!covers.has(row.listing_id)) covers.set(row.listing_id, row.storage_path);
  }
  return Promise.all(listings.map(async item => {
    const path = covers.get(item.id);
    if (!path) return { ...item, photo_url: null };
    const { data: signed, error: signError } = await client.storage
      .from("listing-media").createSignedUrl(path, 120);
    return { ...item, photo_url: !signError ? signed?.signedUrl ?? null : null };
  }));
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
  return { kind: "ready", items: await withCoverImages(context.client, (data ?? []) as Listing[]) };
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
  const listing = data as Listing;
  const { data: media } = await context.client.from("listing_photos")
    .select("storage_path,position").eq("listing_id", listing.id)
    .order("position", { ascending: true }).limit(5);
  const photos = await Promise.all((media ?? []).map(async row => {
    const { data: signed, error: signError } = await context.client.storage
      .from("listing-media").createSignedUrl(row.storage_path, 120);
    return signError ? null : signed?.signedUrl ?? null;
  }));
  return { listing, userId: context.userId, photos: photos.filter((v): v is string => Boolean(v)), photoCount: media?.length ?? 0 };
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
  return { kind: "ready", items: await withCoverImages(context.client, (data ?? []) as Listing[]) };
}
