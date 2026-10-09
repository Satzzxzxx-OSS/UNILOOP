/**
 * Public discovery taxonomy. Product counts and real listings MUST come from
 * the backend, not this static taxonomy.
 */
export const categories = [
  { slug: "books-study", label: "Books & study", symbol: "book" },
  { slug: "laptops-computing", label: "Laptops & tech", symbol: "laptop" },
  { slug: "mobiles-gadgets", label: "Mobiles & gadgets", symbol: "phone" },
  { slug: "hostel-living", label: "Hostel & living", symbol: "home" },
  { slug: "cycles-mobility", label: "Cycles & mobility", symbol: "bike" },
  { slug: "fashion-accessories", label: "Fashion & bags", symbol: "bag" },
  { slug: "sports-fitness", label: "Sports & fitness", symbol: "ball" },
  { slug: "cameras-creative", label: "Creative gear", symbol: "camera" },
] as const;

export type MarketMode = "buy" | "rent";

export function parseMarketMode(value: unknown): MarketMode {
  return value === "rent" ? "rent" : "buy";
}

export function cleanSearchQuery(value: unknown): string {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, 100);
}

export function parseCategory(value: unknown): string | null {
  return typeof value === "string" &&
    categories.some((category) => category.slug === value)
    ? value
    : null;
}

export function exploreHref(mode: MarketMode, category?: string | null): string {
  const params = new URLSearchParams({ mode });
  if (category && parseCategory(category)) params.set("category", category);
  return "/explore?" + params.toString();
}
