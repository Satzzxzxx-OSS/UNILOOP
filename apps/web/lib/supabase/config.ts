export interface PublicSupabaseConfig {
  url: string;
  publishableKey: string;
}

/** Reject missing/secret-shaped client config; no service role key belongs here. */
export function parsePublicSupabaseConfig(
  url: string | undefined,
  publishableKey: string | undefined,
): PublicSupabaseConfig | null {
  if (!url || !publishableKey || !publishableKey.trim()) return null;
  try {
    const parsed = new URL(url);
    const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) {
      return null;
    }
    if (parsed.username || parsed.password || parsed.search || parsed.hash) return null;
    if (publishableKey.startsWith("sb_secret_")) return null;
    if (publishableKey.length < 16) return null;
    return { url: parsed.origin, publishableKey };
  } catch {
    return null;
  }
}

export function supabasePublicConfig(): PublicSupabaseConfig | null {
  return parsePublicSupabaseConfig(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
}
