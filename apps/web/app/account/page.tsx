import type { Metadata } from "next";
import Link from "next/link";
import { EmailSignIn } from "@/components/email-sign-in";
import { AccountSignOut } from "@/components/account-sign-out";
import { serverSupabase } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const supabase = await serverSupabase();

  if (!supabase) {
    return (
      <div className="container quiet-page">
        <span className="quiet-mark" aria-hidden="true">◌</span>
        <p className="eyebrow">YOUR ACCOUNT</p>
        <h1>Account access is being prepared.</h1>
        <p>Sign-in will be available once the secure account service is connected.</p>
        <Link href="/" className="button button-dark">Back to home <span aria-hidden="true">↗</span></Link>
      </div>
    );
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return (
      <div className="container quiet-page">
        <span className="quiet-mark" aria-hidden="true">◌</span>
        <p className="eyebrow">SECURE SIGN-IN</p>
        <h1>Welcome back to the loop.</h1>
        <p>Sign in using the email associated with your account.</p>
        {params.error === "link" && (
          <p role="alert" className="auth-error">That sign-in link is invalid or expired. Request a new one.</p>
        )}
        <EmailSignIn />
      </div>
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, account_status")
    .eq("id", user.id)
    .maybeSingle();

  const { data: accessibleCampuses } = await supabase
    .from("campuses")
    .select("id")
    .limit(1);

  const eligible = profile?.account_status === "active" &&
    Boolean(accessibleCampuses?.length);

  return (
    <div className="container quiet-page">
      <span className="quiet-mark" aria-hidden="true">✓</span>
      <p className="eyebrow">SIGNED IN</p>
      <h1>{"Hello" + (profile?.display_name ? ", " + profile.display_name : " again") + "."}</h1>
      <p>Your identity is authenticated. {eligible
        ? "Your marketplace access is enabled."
        : "Marketplace access is not yet enabled for this account."}</p>
      <p className="auth-email">{user.email ?? "Email unavailable"}</p>
      <div className="account-quicklinks">
        <Link href="/settings" className="text-link">Settings →</Link>
        <Link href="/saved" className="text-link">Saved items →</Link>
        <Link href="/notifications" className="text-link">Notifications →</Link>
        <Link href="/my/listings" className="text-link">My listings →</Link>
      </div>
      <AccountSignOut />
    </div>
  );
}
