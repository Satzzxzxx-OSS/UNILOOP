import type {ReactNode} from "react";
import Link from "next/link";
import {verifiedIdentity} from "@/lib/auth/session";
import {WorkspaceFrame} from "@/components/experience/workspace-frame";
import {Button} from "@/components/spaceui/button";

export default async function PublicLayout({children}:{children:ReactNode}){
 const {user}=await verifiedIdentity();
 if(user)return <WorkspaceFrame>{children}</WorkspaceFrame>;
 return <div className="ul-public-shell"><a href="#main-content" className="skip-link">Skip to content</a>
  <header className="ul-public-header"><Link href="/" className="ul-public-brand" aria-label="UNILOOP home"><span className="ul-monogram">U</span>UNILOOP</Link>
   <nav aria-label="Public navigation"><Link href="/#how-it-works">How it works</Link><Link href="/#categories">Categories</Link><Link href="/help">Help</Link></nav>
   <div className="ul-public-account"><Button variant="outline" render={<Link href="/account"/>}>Sign in</Button><Button render={<Link href="/account?mode=signup"/>}>Get started</Button></div>
  </header>
  <main id="main-content">{children}</main>
  <footer className="ul-public-footer"><Link href="/" className="ul-public-brand"><span className="ul-monogram">U</span>UNILOOP</Link><p>Useful things. Thoughtful exchanges.</p><nav aria-label="Public footer"><Link href="/help">Help & guidance</Link><Link href="/safety">Exchange safety</Link><Link href="/account?mode=signup">Join the loop</Link></nav><small>© {new Date().getFullYear()} UNILOOP</small></footer>
 </div>;
}
