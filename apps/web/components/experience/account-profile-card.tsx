/* Account overview uses existing Space UI Card + Avatar Extended/Bage primitives,
 * with genuine profile fields passed from verified Supabase session data. */
import Link from "next/link";
import {ArrowUpRight, CheckCircle2, Clock3, Mail, ShieldCheck, Settings2} from "lucide-react";
import {Card} from "@/components/spaceui/card";
import {Badge} from "@/components/spaceui/badge";
import {AccountAvatar} from "@/components/experience/account-avatar";

export function AccountProfileCard({name,email,marketplaceEnabled,context="account"}:{
 name:string;email:string;marketplaceEnabled:boolean;context?:"account"|"settings";
}){
 return <Card render={<section aria-label="Your profile overview"/>} className="ul-profile-hero">
  <div className="ul-profile-hero-art" aria-hidden="true"><span/><span/><span/></div>
  <div className="ul-profile-hero-main">
   <div className="ul-profile-hero-avatar"><AccountAvatar name={name} size="lg"/></div>
   <div className="ul-profile-hero-text">
    <span className="ul-profile-eyebrow">YOUR UNILOOP IDENTITY</span>
    <h2>{name}</h2>
    <p><Mail size={15} aria-hidden="true"/>{email}</p>
    <div className="ul-profile-hero-badges">
     <Badge className="ul-profile-status-badge"><CheckCircle2 size={13}/> Email verified</Badge>
     {marketplaceEnabled?
      <Badge className="ul-profile-status-badge ul-profile-status-active"><ShieldCheck size={13}/> Marketplace access enabled</Badge>:
      <Badge className="ul-profile-status-badge ul-profile-status-pending"><Clock3 size={13}/> Marketplace access not enabled</Badge>}
    </div>
   </div>
  </div>
  <Link className="ul-profile-hero-action" href={context==="settings"?"/account":"/settings"}>
   <Settings2 size={17}/>{context==="settings"?"View account":"Manage profile"}<ArrowUpRight size={14}/>
  </Link>
 </Card>;
}
