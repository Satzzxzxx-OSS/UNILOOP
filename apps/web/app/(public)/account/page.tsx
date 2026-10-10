import type {Metadata} from "next";
import Link from "next/link";
import {AuthExperience} from "@/components/auth/auth-experience";
import {AccountSignOut} from "@/components/account-sign-out";
import {AccountProfileCard} from "@/components/experience/account-profile-card";
import {verifiedIdentity} from "@/lib/auth/session";
import {ExperienceIcon} from "@/components/experience/experience-header";

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
 return <div className="ux-account-page">
  <div className="ux-shell ux-account-signed">
    <p className="ux-kicker">YOUR PERSONAL LOOP</p>
    <h1>Hello{profile?.display_name?", "+profile.display_name:" again"}.</h1>
    <p className="ux-account-signed-intro">All your useful things, in one place.</p>
    <AccountProfileCard name={profile?.display_name?.trim()||user.email||"Your account"} email={user.email??""} marketplaceEnabled={approved}/>
    <div className="ul-profile-account-actions">
     <Link className="ul-primary-action" href="/dashboard">Open your workspace <ExperienceIcon name="arrow" size={16}/></Link>
     <AccountSignOut/>
    </div>
    <div className="ux-account-links">
      {[
        {href:"/saved",title:"Saved items",desc:"Things worth coming back to",icon:"heart" as const},
        {href:"/inbox",title:"Messages",desc:"Conversations and offers",icon:"chat" as const},
        {href:"/my/listings",title:"My listings",desc:"Everything you share",icon:"grid" as const},
        {href:"/settings",title:"Account settings",desc:"Personal details and preferences",icon:"user" as const},
      ].map(item=><Link href={item.href} key={item.href} className="ux-account-link">
        <span className="ux-account-link-icon"><ExperienceIcon name={item.icon} size={24}/></span>
        <span><strong>{item.title}</strong><small>{item.desc}</small></span>
        <ExperienceIcon name="arrow" size={20}/>
      </Link>)}
    </div>
  </div>
 </div>;
}
