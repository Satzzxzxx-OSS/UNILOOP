import {serverSupabase} from "@/lib/supabase/server";
import type {Metadata,Viewport} from "next";
import type {ReactNode} from "react";
import Link from "next/link";
import {ExperienceHeader} from "@/components/experience/experience-header";
import "./globals.css";
import "./experience.css";
import "./space-theme.css";
import "./dashboard.css";

export const metadata:Metadata={
  title:{default:"UNILOOP — Buy better. Borrow smarter.",template:"%s · UNILOOP"},
  description:"Find your next useful thing. Buy, sell, rent and lend with thoughtful local connections.",
  applicationName:"UNILOOP",
  robots:{index:false,follow:false},
};
export const viewport:Viewport={width:"device-width",initialScale:1,themeColor:"#000000"};

export default async function RootLayout({children}:{children:ReactNode}){
  const client=await serverSupabase();
  const auth=client?await client.auth.getUser():null;
  const user=auth?.data.user;
  const profile=user&&client?await client.from("profiles").select("display_name").eq("id",user.id).maybeSingle():null;
  const identity=profile?.data?.display_name||user?.email||"Your account";
  return <html lang="en" className="dark">
    <body>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <ExperienceHeader identity={identity} subtitle={user?"Personal marketplace":"Sign in to your loop"}/>
      <main id="main-content">{children}</main>
      <footer className="ul-app-footer"><span>© {new Date().getFullYear()} UNILOOP</span><nav aria-label="Workspace footer"><Link href="/help">Help</Link><Link href="/safety">Exchange safety</Link></nav></footer>
    </body>
  </html>;
}
