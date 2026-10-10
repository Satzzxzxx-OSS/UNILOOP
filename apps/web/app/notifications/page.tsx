import type {Metadata} from "next";
import Link from "next/link";
import {serverSupabase} from "@/lib/supabase/server";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";
import {NotificationReadForm} from "@/components/notification-read-form";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Your updates",robots:{index:false}};
type Alert={id:string;title:string;category:string;link_path:string;read_at:string|null;created_at:string};
function safeUrl(raw:string):string{
 return /^\/(inbox|rentals|transactions)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw)
   ?raw:"/notifications";
}
export default async function NotificationsPage(){
 const client=await serverSupabase();
 const result=client?await client.auth.getUser():null;
 const user=result?.data.user;
 let data:Alert[]=[],error=false;
 if(client&&user){
   const r=await client.from("notifications")
     .select("id,title,category,link_path,read_at,created_at")
     .order("created_at",{ascending:false}).limit(50);
   data=(r.data??[]) as Alert[];error=Boolean(r.error);
 }
 const enabled=process.env.ENABLE_MARKETPLACE_USER_ACTIONS==="true";
 return <WorkspaceShell eyebrow="STAY IN THE KNOW" title="A little update for you."
   description="Only updates from real conversations and marketplace activity appear here.">
   {user&&enabled&&data.some(a=>!a.read_at)&&
     <div className="ux-notification-controls"><NotificationReadForm id="all"/></div>}
   {!user||error?
     <WorkspaceEmpty kind="auth" title="Your updates are private."
       description="Sign in to see messages and transaction updates when your account services are available."
       action={{href:"/account",label:"Go to account"}}/>:
     data.length?<div className="ux-activity-list">{data.map(n=>
       <article key={n.id} className={"ux-activity "+(!n.read_at?"ux-activity-new":"")}>
         <span className="ux-activity-symbol" aria-hidden="true">✦</span>
         <div className="ux-activity-description">
           <small>{n.category}</small>
           <Link href={safeUrl(n.link_path)}><strong>{n.title}</strong></Link>
           <time dateTime={n.created_at}>{new Date(n.created_at).toLocaleString("en-IN")}</time>
         </div>
         {enabled&&!n.read_at&&<NotificationReadForm id={n.id}/>}
       </article>)}</div>:
       <WorkspaceEmpty title="It's quiet here, for now."
         description="Your real message, offer and booking notifications will show up when something happens."
         action={{href:"/explore",label:"Explore the marketplace"}}/>}
   <p className="ux-activity-footnote">Most recent 50 alerts shown. Email and realtime push aren't active yet.</p>
 </WorkspaceShell>;
}
