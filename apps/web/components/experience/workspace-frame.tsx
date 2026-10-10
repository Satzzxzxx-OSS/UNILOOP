import type {ReactNode} from "react";
import Link from "next/link";
import {verifiedIdentity} from "@/lib/auth/session";
import {ExperienceHeader} from "./experience-header";

export async function WorkspaceFrame({children}:{children:ReactNode}){
 const {client,user}=await verifiedIdentity();
 if(!user)return null;
 const profile=client?await client.from("profiles").select("display_name").eq("id",user.id).maybeSingle():null;
 return <><a href="#main-content" className="skip-link">Skip to content</a>
  <ExperienceHeader identity={profile?.data?.display_name||user.email||"Your account"} email={user.email??""} subtitle="Personal marketplace"/>
  <main id="main-content">{children}</main>
  <footer className="ul-app-footer"><span>© {new Date().getFullYear()} UNILOOP</span><nav aria-label="Workspace footer"><Link href="/help">Help</Link><Link href="/safety">Exchange safety</Link></nav></footer>
 </>;
}
