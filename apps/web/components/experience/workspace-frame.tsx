import type {ReactNode} from "react";
import Link from "next/link";
import {verifiedIdentity} from "@/lib/auth/session";
import {FRONTEND_PREVIEW} from "@/lib/auth/frontend-preview";
import {ExperienceHeader} from "./experience-header";

export async function WorkspaceFrame({children}:{children:ReactNode}){
 const {client,user}=await verifiedIdentity();
 if(!user&&!FRONTEND_PREVIEW)return null;
 const profile=client&&user?await client.from("profiles").select("display_name").eq("id",user.id).maybeSingle():null;
 return <><a href="#main-content" className="skip-link">Skip to content</a>
  <ExperienceHeader identity={profile?.data?.display_name||user?.email||"Preview workspace"} email={user?.email||""} emailVerified={Boolean(user?.email_confirmed_at)} subtitle={user?"Personal marketplace":"Frontend preview"}/>
  <main id="main-content">{children}</main>
  <footer className="ul-app-footer"><span>© {new Date().getFullYear()} UNILOOP</span><nav aria-label="Workspace footer"><Link href="/help">Help</Link><Link href="/safety">Exchange safety</Link></nav></footer>
 </>;
}
