import { parseCategory } from "../catalog.ts";

export const allowedConditions = ["new", "like_new", "good", "fair"] as const;
export type ItemCondition = (typeof allowedConditions)[number];

export type ListingInput = {
  title: string;
  description: string;
  category_slug: string;
  price_inr: number;
  item_condition: ItemCondition;
};
export type ValidationResult =
  | { ok: true; value: ListingInput }
  | { ok: false; error: string };

export function parseListingInput(values: {
  title?: unknown;
  description?: unknown;
  category?: unknown;
  price?: unknown;
  condition?: unknown;
}): ValidationResult {
  const title = typeof values.title === "string" ? values.title.trim() : "";
  const description = typeof values.description === "string"
    ? values.description.trim()
    : "";
  if (title.length < 8 || title.length > 120)
    return { ok: false, error: "Enter a title between 8 and 120 characters." };
  if (description.length < 20 || description.length > 5000)
    return { ok: false, error: "Enter a description between 20 and 5000 characters." };

  const category = parseCategory(values.category);
  if (!category) return { ok: false, error: "Choose a valid category." };
  if (typeof values.price !== "string" || !/^[1-9]\d{0,7}$/.test(values.price))
    return { ok: false, error: "Price must be a whole-rupee amount between ₹1 and ₹10,000,000." };
  const price = Number(values.price);
  if (price < 1 || price > 10_000_000 || !Number.isSafeInteger(price))
    return { ok: false, error: "Price is out of range." };
  if (!allowedConditions.includes(values.condition as ItemCondition))
    return { ok: false, error: "Choose a valid item condition." };

  return { ok: true, value: {
    title, description, category_slug: category, price_inr: price,
    item_condition: values.condition as ItemCondition,
  } };
}

export function isListingId(value: unknown): value is string {
  return typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

export type ListingStatus = "draft" | "active" | "paused" | "sold" | "removed";
export function isTransitionTarget(value: unknown): value is Exclude<ListingStatus, "draft"> {
  return value === "active" || value === "paused" || value === "sold" || value === "removed";
}
