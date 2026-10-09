"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicConfig } from "@/lib/supabase/config";

export function browserSupabase() {
  const config = supabasePublicConfig();
  if (!config) return null;

  return createBrowserClient(config.url, config.publishableKey);
}
