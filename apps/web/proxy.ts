import { type NextRequest } from "next/server";
import { refreshSupabaseSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return refreshSupabaseSession(request);
}

// Only session-reliant routes; never run auth network work for static assets.
export const config = {
  matcher: ["/account/:path*", "/auth/:path*"],
};
