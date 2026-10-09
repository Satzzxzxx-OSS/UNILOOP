import { NextResponse, type NextRequest } from "next/server";
import { isValidEmailTokenHash, AUTH_FAILURE_PATH, AUTH_SUCCESS_PATH } from "@/lib/auth/confirm";
import { serverSupabase } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const tokenHash = request.nextUrl.searchParams.get("token_hash");
  const type = request.nextUrl.searchParams.get("type");

  let destination = AUTH_FAILURE_PATH;

  if (type === "email" && isValidEmailTokenHash(tokenHash)) {
    const supabase = await serverSupabase();
    if (supabase) {
      const { error } = await supabase.auth.verifyOtp({
        type: "email",
        token_hash: tokenHash,
      });
      if (!error) destination = AUTH_SUCCESS_PATH;
    }
  }

  // Fixed destination: never redirect to untrusted query/header values.
  const response = NextResponse.redirect(new URL(destination, request.url), 303);
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
