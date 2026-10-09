import type { Metadata } from "next";
import Link from "next/link";
import { serverSupabase } from "@/lib/supabase/server";
import { ProfileSettingsForm, PreferenceSettingsForm } from "@/components/trust-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Account settings", robots: { index: false } };

export default async function SettingsPage() {
  const client=await serverSupabase();
  const {data:{user},error}=client
    ? await client.auth.getUser()
    : {data:{user:null},error:null};
  if(error || !user || !client) return <div className="container quiet-page">
    <p className="eyebrow">PRIVATE ACCOUNT</p>
    <h1>Sign in to manage your account.</h1>
    <p>Account settings are only available to the authenticated owner.</p>
    <Link className="button button-dark" href="/account">Account</Link>
  </div>;
  const [profile,prefs]=await Promise.all([
    client.from("profiles").select("display_name").eq("id",user.id).maybeSingle(),
    client.from("notification_preferences").select("email_messages,email_offers")
      .eq("user_id",user.id).maybeSingle(),
  ]);
  const editable=process.env.ENABLE_MARKETPLACE_USER_ACTIONS==="true";
  return <div className="container settings-page">
    <p className="eyebrow">ACCOUNT & PRIVACY</p>
    <h1>Settings</h1>
    <p className="conversation-intro">Manage your public display name and future notification preferences.</p>
    {editable ?
      <>
        <ProfileSettingsForm name={profile.data?.display_name??""}/>
        <PreferenceSettingsForm messages={prefs.data?.email_messages??true}
          offers={prefs.data?.email_offers??true}/>
      </> :
      <section className="feed-notice">
        <h2>Editing will be available soon</h2>
        <p>Changes are disabled until the account service passes real environment verification.</p>
      </section>}
    <section className="account-policy">
      <h2>Your data & account</h2>
      <p>For a full account deletion, contact the platform administrator. Automated deletion
      and associated retention controls are still being implemented. Avoid sharing passwords or OTPs.</p>
      <Link href="/account" className="text-link">Back to account →</Link>
    </section>
  </div>;
}
