import type {Metadata} from "next";
import Link from "next/link";
import {serverSupabase} from "@/lib/supabase/server";
import {ProfileSettingsForm,PreferenceSettingsForm} from "@/components/trust-forms";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";
import {ProfileAvatar} from "@/components/experience/profile-avatar";
import {Card} from "@/components/spaceui/card";
import {BellRing,ShieldCheck,UserRound,ArrowUpRight,LockKeyhole} from "lucide-react";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Your settings",robots:{index:false}};
export default async function SettingsPage(){
 const client=await serverSupabase();
 const result=client?await client.auth.getUser():null;
 const user=result?.data.user;
 if(!client||!user){
   return <WorkspaceShell eyebrow="PERSONAL & PRIVATE" title="Account settings"
     description="Keep your details and notification preferences in one place.">
       <WorkspaceEmpty kind="auth" title="Sign in to see your settings."
         description="Private preferences are only accessible to your own authenticated account."
         action={{href:"/account",label:"Go to account"}}/>
     </WorkspaceShell>;
 }
 const [profile,prefs]=await Promise.all([
   client.from("profiles").select("display_name,account_status").eq("id",user.id).maybeSingle(),
   client.from("notification_preferences").select("email_messages,email_offers")
     .eq("user_id",user.id).maybeSingle(),
 ]);
 const displayName=profile.data?.display_name?.trim()||user.email?.split("@")[0]||"UNILOOP member";
 const enabled=process.env.ENABLE_MARKETPLACE_USER_ACTIONS==="true";
 return <WorkspaceShell eyebrow="PERSONAL & PRIVATE" title="Account settings"
   description="Your profile, notification choices and privacy settings.">
   <section className="un-profile-settings-banner" aria-label="Your profile overview">
     <ProfileAvatar name={displayName} verified={Boolean(user.email_confirmed_at)} size="large"/>
     <div className="un-profile-settings-banner-copy">
       <p className="ux-kicker">YOUR UNILOOP PROFILE</p>
       <h2>{displayName}</h2>
       <p>{user.email||"Email unavailable"}</p>
       <span className="un-profile-verified-pill"><ShieldCheck size={15}/>{user.email_confirmed_at?"Email verified":"Email not yet verified"}</span>
     </div>
     <Link className="un-profile-view-account" href="/account">View account <ArrowUpRight size={16}/></Link>
   </section>
   <div className="ux-settings-grid un-profile-settings-grid">
     <div className="un-profile-settings-main">
       <Card className="ux-settings-card un-profile-settings-card">
         <div className="un-profile-settings-icon"><UserRound size={20}/></div>
         <p className="ux-kicker">01 / PERSONAL INFO</p>
         <h2>Make it yours.</h2>
         <p className="un-profile-settings-description">Choose the name people see in your marketplace conversations and listings.</p>
         {enabled?<ProfileSettingsForm name={profile.data?.display_name??""}/>:
           <p className="un-profile-settings-disabled"><LockKeyhole size={16}/> Profile editing is temporarily unavailable while account services are being verified.</p>}
       </Card>
       <Card className="ux-settings-card un-profile-settings-card">
         <div className="un-profile-settings-icon"><BellRing size={20}/></div>
         <p className="ux-kicker">02 / NOTIFICATIONS</p>
         <h2>Stay in the know.</h2>
         <p className="un-profile-settings-description">Choose which future email notifications you want to receive.</p>
         {enabled?<PreferenceSettingsForm
            messages={prefs.data?.email_messages??true}
            offers={prefs.data?.email_offers??true}/>:
           <p className="un-profile-settings-disabled"><LockKeyhole size={16}/> Notification preferences can be edited after account services are enabled.</p>}
       </Card>
     </div>
     <aside className="ux-settings-aside un-profile-privacy-card">
       <span className="un-profile-privacy-icon"><ShieldCheck size={23}/></span>
       <p className="ux-kicker">SECURITY & PRIVACY</p>
       <h3>Your privacy matters.</h3>
       <p>Marketplace details and conversations are private to eligible accounts. Full account deletion and data-retention controls are not yet automated.</p>
       <p className="un-profile-privacy-footnote">Account access is verified separately from campus marketplace eligibility.</p>
       <Link href="/account">Back to account <ArrowUpRight size={15}/></Link>
     </aside>
   </div>
 </WorkspaceShell>;
}
