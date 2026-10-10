import type {Metadata} from "next";
import Link from "next/link";
import {serverSupabase} from "@/lib/supabase/server";
import {ProfileSettingsForm,PreferenceSettingsForm} from "@/components/trust-forms";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Your settings",robots:{index:false}};
export default async function SettingsPage(){
 const client=await serverSupabase();
 const result=client?await client.auth.getUser():null;
 const user=result?.data.user;
 if(!client||!user){
   return <WorkspaceShell eyebrow="PERSONAL & PRIVATE" title="A little more about you."
     description="Keep your details and notification preferences in one place.">
       <WorkspaceEmpty kind="auth" title="Sign in to see your settings."
         description="Private preferences are only accessible to your own authenticated account."
         action={{href:"/account",label:"Go to account"}}/>
     </WorkspaceShell>;
 }
 const [profile,prefs]=await Promise.all([
   client.from("profiles").select("display_name").eq("id",user.id).maybeSingle(),
   client.from("notification_preferences").select("email_messages,email_offers")
     .eq("user_id",user.id).maybeSingle(),
 ]);
 const enabled=process.env.ENABLE_MARKETPLACE_USER_ACTIONS==="true";
 return <WorkspaceShell eyebrow="PERSONAL & PRIVATE" title="Make it yours."
   description="Your profile, notification choices and privacy settings.">
   <div className="ux-settings-grid">
     <div>
       <section className="ux-settings-card">
         <p className="ux-kicker">01 / PERSONAL INFO</p>
         <h2>How you show up.</h2>
         {enabled?<ProfileSettingsForm name={profile.data?.display_name??""}/>:
           <p>Account editing is safely disabled until your account service is verified.</p>}
       </section>
       <section className="ux-settings-card">
         <p className="ux-kicker">02 / UPDATES</p><h2>Stay in the know.</h2>
         {enabled?<PreferenceSettingsForm
            messages={prefs.data?.email_messages??true}
            offers={prefs.data?.email_offers??true}/>:
           <p>Notification preferences will become editable when services are enabled.</p>}
       </section>
     </div>
     <aside className="ux-settings-aside">
       <h3>Your privacy matters.</h3>
       <p>Marketplace details and conversations are private to eligible accounts.
         Full account deletion and data-retention controls are not yet automated.</p>
       <Link href="/account">Back to account →</Link>
     </aside>
   </div>
 </WorkspaceShell>;
}
