export const isUuid = (v: unknown): v is string =>
  typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

export function parseMessage(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const value = v.trim();
  return value.length >= 1 && value.length <= 2000 ? value : null;
}

export function parseOfferRupees(v: unknown): number | null {
  if (typeof v !== "string" || !/^[1-9]\d{0,7}$/.test(v)) return null;
  const amount = Number(v);
  return Number.isSafeInteger(amount) && amount <= 10_000_000 ? amount : null;
}

export const isDecision = (value: unknown): value is "accept"|"reject"|"withdraw" =>
  value === "accept" || value === "reject" || value === "withdraw";

export type InteractionState = { message: string };
export const initialInteractionState: InteractionState = { message: "" };
