import type {Metadata} from "next";
import Link from "next/link";
import {Bell,ChevronRight,LockKeyhole,ShieldCheck,UserRound,ExternalLink} from "lucide-react";
import {verifiedIdentity} from "@/lib/auth/session";
import {ProfileSettingsForm,PreferenceSettingsForm} from "@/components/trust-forms";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";
import {AccountProfileCard} from "@/components/experience/account-profile-card";
import {Tabs,TabsList,TabsTab,TabsPanel} from "@/components/spaceui/tabs";
import {Card} from "@/components/spaceui/card";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Profile & account settings",robots:{index:false}};
export default async function SettingsPage(){
 const {client,user}=await verifiedIdentity();
 if(!client||!user){
  return <WorkspaceShell eyebrow="PERSONAL & PRIVATE" title="Account settings"
   description="Keep your details and notification preferences in one place.">
   <WorkspaceEmpty kind="auth" title="Sign in to see your settings."
    description="Private preferences are only accessible to your own authenticated account."
    action={{href:"/account",label:"Go to account"}}/>
  </WorkspaceShell>;
 }
 const [profile,prefs,scopes]=await Promise.all([
  client.from("profiles").select("display_name,account_status").eq("id",user.id).maybeSingle(),
  client.from("notification_preferences").select("email_messages,email_offers").eq("user_id",user.id).maybeSingle(),
  client.from("campuses").select("id").limit(1),
 ]);
 const name=profile.data?.display_name?.trim()||user.email||"Your account";
 const marketplaceEnabled=profile.data?.account_status==="active"&&Boolean(scopes.data?.length);
 const enabled=process.env.ENABLE_MARKETPLACE_USER_ACTIONS==="true";
 return <WorkspaceShell eyebrow="YOUR PERSONAL SPACE" title="Profile & settings"
  description="One place to understand your account, keep your details current and manage preferences.">
  <div className="ul-profile-settings">
   <AccountProfileCard name={name} email={user.email??""} marketplaceEnabled={marketplaceEnabled} context="settings"/>
   <Tabs defaultValue="profile" className="ul-profile-tabs">
    <TabsList className="ul-profile-tabs-list" aria-label="Settings sections">
     <TabsTab value="profile"><UserRound size={17}/> My profile</TabsTab>
     <TabsTab value="notifications"><Bell size={17}/> Notifications</TabsTab>
     <TabsTab value="privacy"><ShieldCheck size={17}/> Privacy & safety</TabsTab>
    </TabsList>
    <TabsPanel value="profile">
     <Card render={<section aria-label="Personal information"/>} className="ul-profile-settings-card">
      <div className="ul-profile-section-icon"><UserRound size={20}/></div>
      <p className="ul-profile-eyebrow">PERSONAL INFORMATION</p>
      <h2>Make it yours.</h2>
      <p>Your display name is what other eligible community members see. Your verified email belongs to your account.</p>
      <div className="ul-profile-field-pair"><span>EMAIL ADDRESS</span><strong>{user.email??"Unavailable"}</strong><small><LockKeyhole size={13}/> Verified email, managed by your authentication provider</small></div>
      {enabled?<ProfileSettingsForm name={profile.data?.display_name??""}/>:
       <div className="ul-profile-readonly">
        <div><span>DISPLAY NAME</span><strong>{profile.data?.display_name||"Not set"}</strong></div>
        <p><LockKeyhole size={16}/> Editing is temporarily disabled until the account service has passed hosted verification.</p>
       </div>}
     </Card>
    </TabsPanel>
    <TabsPanel value="notifications">
     <Card render={<section aria-label="Notification preferences"/>} className="ul-profile-settings-card">
      <div className="ul-profile-section-icon"><Bell size={20}/></div>
      <p className="ul-profile-eyebrow">NOTIFICATION PREFERENCES</p>
      <h2>Stay in the know.</h2>
      <p>Decide which email updates you want once the notification delivery service is enabled.</p>
      {enabled?<PreferenceSettingsForm messages={prefs.data?.email_messages??true} offers={prefs.data?.email_offers??true}/>:
       <div className="ul-profile-readonly"><p><LockKeyhole size={16}/> Preferences become editable after account operations are verified. Email delivery is not active yet.</p></div>}
     </Card>
    </TabsPanel>
    <TabsPanel value="privacy">
     <Card render={<section aria-label="Account security and privacy"/>} className="ul-profile-settings-card">
      <div className="ul-profile-section-icon"><ShieldCheck size={20}/></div>
      <p className="ul-profile-eyebrow">PRIVACY & ACCOUNT ACCESS</p>
      <h2>Your account stays yours.</h2>
      <p>UNILOOP uses email-verified access. Buying, selling and renting are protected by separate campus eligibility and database permissions.</p>
      <div className="ul-profile-safety-items">
       <div><LockKeyhole size={19}/><span><strong>Secure account access</strong><small>Sign-in links are sent to your verified email. Never share verification links or codes.</small></span></div>
       <div><ShieldCheck size={19}/><span><strong>Campus marketplace eligibility</strong><small>{marketplaceEnabled?"Marketplace access is currently enabled for this account.":"Marketplace access is not currently enabled for this account."}</small></span></div>
       <div><ExternalLink size={19}/><span><strong>Data controls</strong><small>Automated account deletion and data export are not yet available. Contact support for assistance.</small></span></div>
      </div>
      <div className="ul-profile-safety-links"><Link href="/safety">Exchange safety <ChevronRight size={16}/></Link><Link href="/help">Help & guidance <ChevronRight size={16}/></Link></div>
     </Card>
    </TabsPanel>
   </Tabs>
  </div>
 </WorkspaceShell>;
}
