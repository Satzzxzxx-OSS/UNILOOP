/** Validate private worker configuration without contacting a provider or echoing values. */
export function parseBackendServiceConfig(env: Record<string, string | undefined>) {
  const url = env.SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || /\s/.test(key)) throw new Error("Private backend configuration missing");
  const parsed = new URL(url);
  if (parsed.protocol !== "https:" || parsed.username || parsed.password ||
    parsed.pathname !== "/" || parsed.search || parsed.hash)
    throw new Error("Invalid private database URL");
  if (!key.startsWith("sb_secret_")) {
    // Shape validation only. The provider must verify signature/current authority.
    try {
      const parts = key.split(".");
      if (parts.length !== 3 || !parts.every(Boolean) ||
        JSON.parse(Buffer.from(parts[1], "base64url").toString()).role !== "service_role")
        throw new Error();
    } catch { throw new Error("A private backend service key is required"); }
  } else if (key.length < 24) throw new Error("A private backend service key is required");
  return { url: parsed.origin, key };
}
