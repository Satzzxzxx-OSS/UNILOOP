"use server";
import {revalidatePath} from "next/cache";
import {serverSupabase} from "@/lib/supabase/server";
import {isUuid} from "@/lib/interactions/validation";

export type NotificationActionState={message:string};
export const initialNotificationState:NotificationActionState={message:""};
export async function markNotificationsRead(
  _old:NotificationActionState,form:FormData,
):Promise<NotificationActionState>{
  if(process.env.ENABLE_MARKETPLACE_USER_ACTIONS!=="true")
    return {message:"Notifications are not enabled yet."};
  const selected=form.get("notification");
  if(selected!=="all"&&!isUuid(selected))return {message:"Invalid notification."};
  const client=await serverSupabase();
  if(!client)return {message:"Account service unavailable."};
  const {data:{user},error:authError}=await client.auth.getUser();
  if(authError||!user)return {message:"Sign in to view your notifications."};
  let update=client.from("notifications")
    .update({read_at:new Date().toISOString()})
    .eq("user_id",user.id).is("read_at",null);
  if(selected!=="all")update=update.eq("id",selected);
  const {error}=await update;
  if(error)return {message:"Could not mark notification read."};
  revalidatePath("/notifications");
  return {message:"Marked as read."};
}
