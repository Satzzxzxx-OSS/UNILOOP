import type {Metadata} from "next";
import Link from "next/link";
import {serverSupabase} from "@/lib/supabase/server";
import {NotificationReadForm} from "@/components/notification-read-form";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Notifications",robots:{index:false}};
type Alert={id:string;title:string;category:string;link_path:string;read_at:string|null;created_at:string};

function safeNotificationLink(value:string):string{
  return /^\/(inbox|rentals|transactions)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
    ?value:"/notifications";
}

export default async function NotificationsPage(){
  const client=await serverSupabase();
  const {data:{user},error:authError}=client?
    await client.auth.getUser():{data:{user:null},error:null};
  let notifications:Alert[]=[];
  let error=false;
  if(user&&client){
    const result=await client.from("notifications")
      .select("id,title,category,link_path,read_at,created_at")
      .order("created_at",{ascending:false}).limit(50);
    error=Boolean(result.error);
    notifications=(result.data??[]) as Alert[];
  }
  const enabled=process.env.ENABLE_MARKETPLACE_USER_ACTIONS==="true";
  return <div className="container listings-dashboard">
    <div className="section-heading">
      <div><p className="eyebrow">PRIVATE ACTIVITY</p><h1>Notifications</h1>
        <p>Recent message, offer, rental and sale updates.</p></div>
      {user&&enabled&&notifications.some(n=>!n.read_at)&&
        <NotificationReadForm id="all"/>}
    </div>
    {!user||error?<section className="feed-notice">
      <h2>Notifications unavailable</h2>
      <p>{!user?"Sign in to view updates.":"Unable to load recent activity."}</p>
      <Link className="text-link" href="/account">Account →</Link>
    </section>:notifications.length?
      <div className="notification-list">{notifications.map(n=>
        <article key={n.id} className={"notification-entry"+(!n.read_at?" unread":"")}>
          <span className="notification-symbol" aria-hidden="true">✦</span>
          <div className="notification-body">
            <span className="notification-type">{n.category}</span>
            <Link href={safeNotificationLink(n.link_path)}><strong>{n.title}</strong></Link>
            <time dateTime={n.created_at}>{new Date(n.created_at).toLocaleString("en-IN")}</time>
          </div>
          {enabled&&!n.read_at&&<NotificationReadForm id={n.id}/>}
        </article>)}</div>:
      <section className="feed-notice"><h2>No new activity</h2>
        <p>Only events that actually occurred will appear here.</p>
      </section>}
    <p className="interaction-note">Recent 50 items shown. Email delivery and real-time push are not active yet.</p>
  </div>;
}
