import { serverSupabase } from "@/lib/supabase/server";

export type AuthorizationResult =
  | { allowed: true; userId: string }
  | { allowed: false; reason: "not_configured" | "not_authenticated" | "not_eligible" };

/**
 * A valid session does NOT imply market eligibility.
 * The campuses SELECT is protected by private.can_access_campus() via RLS.
 * Every future mutation must also check permissions independently.
 */
export async function checkCampusAccess(campusId: string): Promise<AuthorizationResult> {
  if (!/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(campusId)) {
    return { allowed: false, reason: "not_eligible" };
  }
  const supabase = await serverSupabase();
  if (!supabase) return { allowed: false, reason: "not_configured" };

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return { allowed: false, reason: "not_authenticated" };

  const { data: campus, error: campusError } = await supabase
    .from("campuses")
    .select("id")
    .eq("id", campusId)
    .maybeSingle();

  if (campusError || !campus) return { allowed: false, reason: "not_eligible" };
  return { allowed: true, userId: user.id };
}
