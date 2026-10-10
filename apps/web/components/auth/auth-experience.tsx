/* UNILOOP Auth V2: dark Space UI-inspired credential panel.
 * The public Sign In block is a visual reference only; no fake password or
 * social logins. Existing Supabase magic-link flow remains authoritative. */
import Link from "next/link";
import {ArrowLeft,ArrowRight,Check,LockKeyhole,Mail,ShieldCheck,Sparkles,MoveUpRight} from "lucide-react";
import {Badge} from "@/components/spaceui/badge";
import {Card} from "@/components/spaceui/card";
import {GradientBackground} from "@/components/spaceui/gradient-background";
import {AuthBotAvatar} from "@/components/auth/auth-bot-avatar";
import {EmailSignIn} from "@/components/email-sign-in";

type AuthIntent="signin"|"signup";
interface AuthExperienceProps{intent:AuthIntent;configured:boolean;error?:string;reason?:string}

export function AuthExperience({intent,configured,error,reason}:AuthExperienceProps){
 const signup=intent==="signup";
 return <section className="un-auth-shell un-auth-v2" aria-label="UNILOOP account access">
  <div className="un-v2-shell">
   <div className="un-v2-layout">
    <div className="un-v2-story" aria-label="Welcome to UNILOOP">
     <GradientBackground className="un-v2-story-gradient" aria-hidden="true"/>
     <div className="un-v2-orbit un-v2-orbit-one" aria-hidden="true"/>
     <div className="un-v2-orbit un-v2-orbit-two" aria-hidden="true"/>
     <div className="un-v2-story-content">
      <div className="un-v2-story-header"><span className="un-v2-story-label"><span/> A MORE HUMAN WAY TO EXCHANGE</span><span className="un-v2-story-index">01 / 02</span></div>
      <div className="un-v2-story-center">
       <div className="un-v2-story-bot"><AuthBotAvatar large/></div>
       <Badge variant="outline" className="un-v2-story-badge"><Sparkles size={13}/> YOUR CAMPUS COMPANION</Badge>
       <h2>{signup?"Good things start here.":"Welcome back to the loop."}</h2>
       <p>Find what you need. Share what you no longer use. Make every connection count.</p>
      </div>
      <div className="un-v2-story-footer">
       <div><span className="un-v2-story-dot"/> Discover <span className="un-v2-story-line"/> Connect <span className="un-v2-story-line"/> Exchange</div>
       <p>Thoughtful exchanges. One personal workspace.</p>
      </div>
     </div>
    </div>

    <div className="un-v2-right">
     <nav className="un-v2-topbar" aria-label="Account navigation">
      <Link href="/" className="un-v2-return"><ArrowLeft size={17}/> Back to home</Link>
      <span><LockKeyhole size={14}/> SECURE ACCOUNT ACCESS</span>
     </nav>
     <div className="un-v2-form-wrap">
      <header className="un-v2-intro">
       <div className="un-v2-intro-avatar"><AuthBotAvatar/><span>YOUR UNILOOP ACCOUNT</span></div>
       <h1>{signup?"Join the loop.":"Welcome back."}</h1>
       <p>{signup?"Create your account and get ready to explore a more thoughtful campus marketplace.":"Sign in to pick up where you left off. Your space is waiting."}</p>
      </header>
      <nav className="un-v2-tabs" aria-label="Account access">
       <Link href="/login" aria-current={!signup?"page":undefined}>Sign in</Link>
       <Link href="/signup" aria-current={signup?"page":undefined}>Create account</Link>
      </nav>
      <Card className="un-v2-auth-card">
       <div className="un-v2-card-top"><span className="un-v2-mail-icon"><Mail size={19}/></span><span className="un-v2-secure-tag"><ShieldCheck size={14}/> PASSWORDLESS</span></div>
       <h2>{signup?"Let's create your account.":"Sign in with your email."}</h2>
       <p className="un-v2-card-description">We'll send a secure, one-time verification link. No passwords to remember.</p>
       {error==="link"&&<p className="un-v2-notice un-v2-error" role="alert">This sign-in link is invalid or expired. Request a new link.</p>}
       {reason==="signin"&&<p className="un-v2-notice" role="status">Please sign in or create an account to continue.</p>}
       <EmailSignIn key={intent} intent={intent} configured={configured}/>
       {!configured&&<p className="un-v2-notice un-v2-unavailable" role="status">
        <LockKeyhole size={16} aria-hidden="true"/>
        <span>Sign-in will be available after the secure account service is connected. No email can be sent yet.</span>
       </p>}
       <div className="un-v2-card-footer"><ShieldCheck size={16}/><span>Private by design. Campus marketplace access requires separate verification.</span></div>
      </Card>
      <p className="un-v2-switch">{signup?"Already part of the loop?":"New to UNILOOP?"} <Link href={signup?"/login":"/signup"}>{signup?"Sign in":"Create an account"} <ArrowRight size={14}/></Link></p>
      <p className="un-v2-guidance">By continuing, you agree to use UNILOOP responsibly. <Link href="/safety">Safety guidance <MoveUpRight size={12}/></Link></p>
     </div>
     <footer className="un-v2-bottom"><span><Check size={14}/> Built for thoughtful exchanges</span><Link href="/help">Need help? <ArrowRight size={14}/></Link></footer>
    </div>
   </div>
  </div>
 </section>;
}
