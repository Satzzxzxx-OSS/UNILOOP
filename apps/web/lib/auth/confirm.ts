/** Only consume a token hash supplied by an allowlisted Supabase email link. */
export function isValidEmailTokenHash(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length >= 32 &&
    value.length <= 256 &&
    /^[A-Za-z0-9_-]+$/.test(value)
  );
}

/** No arbitrary next/return URL: prevents open redirects from auth callback. */
export const AUTH_SUCCESS_PATH = "/account";
export const AUTH_FAILURE_PATH = "/account?error=link";
