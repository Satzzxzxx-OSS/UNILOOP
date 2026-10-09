import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabasePublicConfig } from "@/lib/supabase/config";

/**
 * Request-scoped cookie client. Never use service role credentials for user
 * requests. Authorization is enforced in the database as well as at the API.
 */
export async function serverSupabase() {
  const config = supabasePublicConfig();
  if (!config) return null;

  const store = await cookies();
  return createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return store.getAll();
      },
      setAll(toSet) {
        try {
          toSet.forEach(({ name, value, options }) => store.set(name, value, options));
        } catch {
          // Server Components cannot modify cookies; Next.js Proxy refreshes
          // sessions before rendering. Route handlers and actions may write.
        }
      },
    },
  });
}
