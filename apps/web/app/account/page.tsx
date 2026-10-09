import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Account" };

export default function AccountPage() {
  return (
    <div className="container quiet-page">
      <span className="quiet-mark" aria-hidden="true">◌</span>
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h1>A more personal loop is coming.</h1>
      <p>
        Account registration and sign-in are not available yet. Authentication
        will be enabled only after secure session handling and permissions are implemented.
      </p>
      <Link href="/" className="button button-dark">Back to home <span aria-hidden="true">↗</span></Link>
    </div>
  );
}
