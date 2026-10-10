import type {Metadata} from "next";
import Link from "next/link";
import {AuthExperience} from "@/components/auth/auth-experience";
import {AccountSignOut} from "@/components/account-sign-out";
import {verifiedIdentity} from "@/lib/auth/session";
import {ExperienceIcon} from "@/components/experience/experience-header";
import {ProfileAvatar} from "@/components/experience/profile-avatar";
import {Card} from "@/components/spaceui/card";
import {ArrowRight,Mail,ShieldCheck,Settings2,Sparkles} from "lucide-react";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Your account",robots:{index:false,follow:false}};
export default async function AccountPage({searchParams}:{
 searchParams:Promise<{error?:string;mode?:string;reason?:string}>;
}){
 const params=await searchParams;
 const signup=params.mode==="signup";
 const {client,user}=await verifiedIdentity();
 if(!client||!user) return <AuthExperience intent={signup?"signup":"signin"} configured={Boolean(client)} error={params.error} reason={params.reason}/>;
 const [{data:profile},{data:scopes}]=await Promise.all([
  client.from("profiles").select("display_name,account_status").eq("id",user.id).maybeSingle(),
  client.from("campuses").select("id").limit(1),
 ]);
 const approved=profile?.account_status==="active"&&Boolean(scopes?.length);
 const displayName=profile?.display_name?.trim()||user.email?.split("@")[0]||"UNILOOP member";
 return <div className="ux-account-page un-spaceui-profile-page">
  <div className="ux-shell ux-account-signed un-spaceui-profile-shell">
   <header className="un-profile-page-heading">
    <div><p className="ux-kicker">YOUR PERSONAL LOOP / PROFILE</p><h1>Your account.</h1>
     <p className="ux-account-signed-intro">Your space for identity, connections and trusted exchanges.</p></div>
    <Link href="/settings" className="un-profile-page-edit"><Settings2 size={17}/> Account settings <ArrowRight size={16}/></Link>
   </header>
   <Card className="un-profile-hero-card">
    <div className="un-profile-hero-glow" aria-hidden="true"/>
    <div className="un-profile-hero-top"><span><Sparkles size={14}/> UNILOOP IDENTITY</span><span className="un-profile-hero-number">01 / ACCOUNT</span></div>
    <div className="un-profile-hero-main">
     <ProfileAvatar name={displayName} verified={Boolean(user.email_confirmed_at)} size="large"/>
     <div className="un-profile-hero-name"><p>WELCOME TO YOUR LOOP</p><h2>{displayName}</h2>
      <span className="un-profile-hero-email"><Mail size={16}/>{user.email||"Email unavailable"}</span>
     </div>
    </div>
    <div className="un-profile-hero-bottom">
     <span className="un-profile-verified-pill"><ShieldCheck size={16}/>{user.email_confirmed_at?"Email verified":"Email confirmation required"}</span>
     <span className={approved?"un-profile-access-pill is-active":"un-profile-access-pill"}>
      <span aria-hidden="true"/>{approved?"Marketplace access enabled":"Marketplace access not currently enabled"}
     </span>
    </div>
   </Card>
   <div className="un-profile-action-line">
    <Link className="un-profile-workspace-link" href="/dashboard">Open your workspace <ArrowRight size={16}/></Link>
    <AccountSignOut/>
   </div>
   <div className="un-profile-section-top"><span>YOUR WORKSPACE</span><p>Everything you need, in one connected place.</p></div>
   <div className="ux-account-links un-profile-destination-grid">
    {[
      {href:"/saved",title:"Saved items",desc:"Things worth coming back to",icon:"heart" as const},
      {href:"/inbox",title:"Messages",desc:"Your conversations and offers",icon:"chat" as const},
      {href:"/my/listings",title:"My listings",desc:"Everything you share",icon:"grid" as const},
      {href:"/settings",title:"Account settings",desc:"Personal details and preferences",icon:"user" as const},
    ].map(item=><Link href={item.href} key={item.href} className="ux-account-link un-profile-destination">
      <span className="ux-account-link-icon"><ExperienceIcon name={item.icon} size={22}/></span>
      <span><strong>{item.title}</strong><small>{item.desc}</small></span>
      <ArrowRight size={19} aria-hidden="true"/>
    </Link>)}
   </div>
  </div>
 </div>;
}
