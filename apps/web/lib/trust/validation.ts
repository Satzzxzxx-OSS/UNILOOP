export const REPORT_REASONS = ["prohibited","fraud","misleading","harassment","other"] as const;
export type ReportReason = typeof REPORT_REASONS[number];
export function parseReportReason(value: unknown): ReportReason | null {
  return typeof value === "string" && REPORT_REASONS.includes(value as ReportReason)
    ? value as ReportReason : null;
}
export function parseReportDetails(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim();
  return text.length >= 15 && text.length <= 1500 ? text : null;
}
export function cleanProfileName(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const text = value.trim().replace(/\s+/g," ");
  if (text.length < 2 || text.length > 60 || /[\u0000-\u001f\u007f]/.test(text))
    return null;
  return text;
}
export type TrustActionState = { message: string; ok?: boolean };
export const initialTrustState: TrustActionState = { message: "" };
