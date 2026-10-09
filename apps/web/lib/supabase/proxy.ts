import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { supabasePublicConfig } from "@/lib/supabase/config";

export async function refreshSupabaseSession(request: NextRequest) {
  const config = supabasePublicConfig();
  if (!config) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet, headers) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        // Protect refreshed session cookies from intermediary cache replay.
        for (const [key, value] of Object.entries(headers ?? {})) {
          response.headers.set(key, value);
        }
        response.headers.set("Cache-Control", "private, no-store");
      },
    },
  });

  // Trust verified claims, never the unvalidated getSession() cookie payload.
  await supabase.auth.getClaims();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
