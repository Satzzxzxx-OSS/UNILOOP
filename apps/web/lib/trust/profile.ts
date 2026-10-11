import type {SupabaseClient} from "@supabase/supabase-js";

/** RLS can deny an UPDATE by filtering every row without returning an error.
 * Only acknowledge a profile save when the owned row was actually returned. */
export async function persistDisplayName(client:SupabaseClient,userId:string,name:string):Promise<boolean>{
  const {data,error}=await client.from("profiles")
    .update({display_name:name}).eq("id",userId).select("id").maybeSingle();
  return !error&&data?.id===userId;
}
