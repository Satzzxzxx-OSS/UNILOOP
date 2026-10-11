/** Display only our fixed message; database errors can contain private details. */
export function mutationErrorMessage(error: { code?: string } | null, fallback: string): string {
  return error?.code === "PT429" ? "You have reached the limit for this action. Please try again later." : fallback;
}
