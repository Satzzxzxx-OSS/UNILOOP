import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {FRONTEND_PREVIEW} from "@/lib/auth/frontend-preview";
import { isWorkspacePath } from "@/lib/auth/routes";
import { supabasePublicConfig } from "@/lib/supabase/config";

export async function refreshSupabaseSession(request: NextRequest) {
  const config = supabasePublicConfig();
  // Preview opens only page navigation; configured sessions still refresh normally.
  const previewNavigation=FRONTEND_PREVIEW&&isWorkspacePath(request.nextUrl.pathname)&&["GET","HEAD"].includes(request.method);
  function requireSignIn(){
    const url=new URL("/account?reason=signin",request.url);
    const denied=NextResponse.redirect(url,307);
    denied.headers.set("Cache-Control","private, no-store");
    return denied;
  }
  if (!config) {
    if(isWorkspacePath(request.nextUrl.pathname)&&!previewNavigation)return requireSignIn();
    const response=NextResponse.next({request});
    if(previewNavigation)response.headers.set("Cache-Control","private, no-store");
    return response;
  }

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
  if(isWorkspacePath(request.nextUrl.pathname)&&!previewNavigation&&(error||!data?.claims?.sub)){
    const denied=requireSignIn();
    for(const cookie of response.cookies.getAll())denied.cookies.set(cookie);
    return denied;
  }
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
