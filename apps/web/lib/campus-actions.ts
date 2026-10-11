"use server";
import {cookies} from "next/headers";
import {revalidatePath} from "next/cache";
import {serverSupabase} from "@/lib/supabase/server";
import {isUuid} from "@/lib/interactions/validation";
export async function selectCampus(form:FormData) {
 const id=form.get("campus");
 if(typeof id!=="string"||!isUuid(id))return;
 const client=await serverSupabase();
 if(!client)return;
 const {data:{user},error}=await client.auth.getUser();
 if(error||!user)return;
 // Cookie is a preference, never authorization. RLS rechecks every request.
 const campus=await client.from("campuses").select("id").eq("id",id).maybeSingle();
 if(campus.error||!campus.data)return;
 (await cookies()).set("uniloop-campus",id,{httpOnly:true,sameSite:"lax",secure:process.env.NODE_ENV==="production",path:"/",maxAge:2592000});
 revalidatePath("/","layout");
}
