import type {Metadata} from "next";
import Link from "next/link";
import {EmailSignIn} from "@/components/email-sign-in";
import {AccountSignOut} from "@/components/account-sign-out";
import {serverSupabase} from "@/lib/supabase/server";
import {ExperienceIcon} from "@/components/experience/experience-header";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Your account",robots:{index:false,follow:false}};
export default async function AccountPage({searchParams}:{
 searchParams:Promise<{error?:string}>;
}){
 const params=await searchParams;
 const client=await serverSupabase();
 const result=client?await client.auth.getUser():null;
 const user=result?.data.user??null;
 if(!client||!user){
   return <div className="ux-account-page">
     <div className="ux-shell ux-account-layout">
       <div className="ux-account-intro">
         <span className="ux-account-orb" aria-hidden="true"><span>U</span></span>
         <p className="ux-kicker">ONE ACCOUNT. ALL THE POSSIBILITIES.</p>
         <h1>Your account</h1>
         <p>Find what you need, pass on what you don&apos;t and borrow the rest.
            A simpler, more thoughtful way to stay in the loop.</p>
         <div className="ux-account-benefits">
           <span><ExperienceIcon name="shield" size={19}/> Carefully designed private account access</span>
           <span><ExperienceIcon name="heart" size={19}/> Your saved items and messages, in one place</span>
         </div>
       </div>
       <section className="ux-account-card">
         <div className="ux-account-card-icon"><ExperienceIcon name="user" size={26}/></div>
         <p className="ux-kicker">WELCOME BACK</p>
         <h2>{client?"Continue to your loop.":"We’re getting things ready."}</h2>
         <p>{client?"Use the email associated with your approved account to receive a sign-in link.":
           "Sign-in will be available after the secure account service is connected."}</p>
         {params.error==="link"&&<p className="auth-error" role="alert">This sign-in link is invalid or has expired.</p>}
         {client?<EmailSignIn/>:
           <Link href="/explore" className="ux-workspace-action">Explore the marketplace <ExperienceIcon name="arrow" size={18}/></Link>}
         <p className="ux-account-footnote">Never share verification codes or passwords with anyone.</p>
       </section>
     </div>
   </div>;
 }
 const [{data:profile},{data:scopes}]=await Promise.all([
  client.from("profiles").select("display_name,account_status").eq("id",user.id).maybeSingle(),
  client.from("campuses").select("id").limit(1),
 ]);
 const approved=profile?.account_status==="active"&&Boolean(scopes?.length);
 return <div className="ux-account-page">
  <div className="ux-shell ux-account-signed">
    <p className="ux-kicker">YOUR PERSONAL LOOP</p>
    <h1>Hello{profile?.display_name?", "+profile.display_name:" again"}.</h1>
    <p className="ux-account-signed-intro">All your useful things, in one place.</p>
    <div className="ux-account-identity">
      <div className="ux-account-avatar"><ExperienceIcon name="user" size={30}/></div>
      <div><strong>{user.email??"Email unavailable"}</strong>
        <span>{approved?"Marketplace access enabled":"Marketplace access not currently enabled"}</span>
      </div>
      <AccountSignOut/>
    </div>
    <div className="ux-account-links">
      {[
        {href:"/saved",title:"Saved items",desc:"Things worth coming back to",icon:"heart" as const},
        {href:"/inbox",title:"Messages",desc:"Conversations and offers",icon:"chat" as const},
        {href:"/my/listings",title:"My listings",desc:"Everything you share",icon:"grid" as const},
        {href:"/settings",title:"Account settings",desc:"Personal details and preferences",icon:"user" as const},
      ].map(item=><Link href={item.href} key={item.href} className="ux-account-link">
        <span className="ux-account-link-icon"><ExperienceIcon name={item.icon} size={24}/></span>
        <span><strong>{item.title}</strong><small>{item.desc}</small></span>
        <ExperienceIcon name="arrow" size={20}/>
      </Link>)}
    </div>
  </div>
 </div>;
}
