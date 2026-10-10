import {cache} from "react";
import {serverSupabase} from "@/lib/supabase/server";

// Verified, request-scoped identity. A session alone never grants campus access.
export const verifiedIdentity=cache(async()=>{
  const client=await serverSupabase();
  if(!client)return {client:null,user:null};
  const {data,error}=await client.auth.getUser();
  return {client,user:error||!data.user?.email_confirmed_at?null:data.user};
});
