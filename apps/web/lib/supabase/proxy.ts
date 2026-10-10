import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isWorkspacePath } from "@/lib/auth/routes";
import { supabasePublicConfig } from "@/lib/supabase/config";

export async function refreshSupabaseSession(request: NextRequest) {
  const config = supabasePublicConfig();
  function requireSignIn(){
    const url=new URL("/account?reason=signin",request.url);
    const denied=NextResponse.redirect(url,307);
    denied.headers.set("Cache-Control","private, no-store");
    return denied;
  }
  if (!config) return isWorkspacePath(request.nextUrl.pathname)?requireSignIn():NextResponse.next({ request });

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
  const {data,error}=await supabase.auth.getClaims();
  if(isWorkspacePath(request.nextUrl.pathname)&&(error||!data?.claims?.sub)){
    const denied=requireSignIn();
    for(const cookie of response.cookies.getAll())denied.cookies.set(cookie);
    return denied;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
