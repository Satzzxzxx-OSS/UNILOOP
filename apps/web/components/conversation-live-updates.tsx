"use client";
import {useEffect,useState} from "react";
import {useRouter} from "next/navigation";
import {browserSupabase} from "@/lib/supabase/browser";
export function ConversationLiveUpdates({conversationId,enabled}:{conversationId:string;enabled:boolean}){
 const router=useRouter();
 const [state,setState]=useState("Connecting live updates…");
 useEffect(()=>{
 if(!enabled)return;
 const client=browserSupabase();
 if(!client)return;
 let alive=true,refreshTimer:ReturnType<typeof setTimeout>|undefined;
 const refresh=()=>{
 if(!alive||document.visibilityState!=="visible"||refreshTimer)return;
 refreshTimer=setTimeout(()=>{refreshTimer=undefined;if(alive)router.refresh();},750);
 };
 const channel=client.channel("conversation-"+conversationId)
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"sale_messages",filter:"conversation_id=eq."+conversationId},refresh)
 .on("postgres_changes",{event:"INSERT",schema:"public",table:"sale_offers",filter:"conversation_id=eq."+conversationId},refresh)
 .on("postgres_changes",{event:"UPDATE",schema:"public",table:"sale_offers",filter:"conversation_id=eq."+conversationId},refresh)
 .subscribe(status=>{if(alive)setState(status==="SUBSCRIBED"?"Live updates connected":"Refresh available while live updates reconnect");});
 // Re-fetch authoritative RLS data periodically, even without a new message,
 // and after foregrounding. Never render websocket payloads directly.
 const interval=setInterval(refresh,60000);
 document.addEventListener("visibilitychange",refresh);
 const {data:{subscription}}=client.auth.onAuthStateChange(()=>refresh());
 return ()=>{alive=false;clearInterval(interval);if(refreshTimer)clearTimeout(refreshTimer);document.removeEventListener("visibilitychange",refresh);subscription.unsubscribe();void client.removeChannel(channel);};
 },[conversationId,enabled,router]);
 return enabled?<span role="status" className="interaction-note">{state}</span>:null;
}
