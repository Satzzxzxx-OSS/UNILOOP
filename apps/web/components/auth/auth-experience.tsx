/* UNILOOP auth composition inspired by Space UI's public MIT Sign In Page block.
 * Unlike the demo block, auth here is wired to Supabase's existing email flow.
 * Motion, visual grid and gradients reuse already-vendored free Space UI primitives.
 * Source research: docs/SPACE_UI_AUTH_IMPLEMENTATION.md. */
import Link from "next/link";
import {ArrowLeft,ArrowRight,Check,KeyRound,LockKeyhole,Mail,MessagesSquare,Package,ShieldCheck,Sparkles} from "lucide-react";
import {Badge} from "@/components/spaceui/badge";
import {Card} from "@/components/spaceui/card";
import {GradientBackground} from "@/components/spaceui/gradient-background";
import {ProximityGrid} from "@/components/spaceui/proximity-grid";
import {EmailSignIn} from "@/components/email-sign-in";

type AuthIntent = "signin" | "signup";
interface AuthExperienceProps {
  intent: AuthIntent;
  configured: boolean;
  error?: string;
  reason?: string;
}

// Text is visible in server HTML; the blur is a progressive CSS enhancement.
// This follows Space UI Blur Reveal Text's stagger pattern without a hydration
// dependency or inaccessible first-frame opacity.
function RevealHeading({text}:{text:string}) {
  return <h2 className="un-auth-visual-title" aria-label={text}>
    {text.split(" ").map((word,index)=><span aria-hidden="true" className="un-auth-reveal-word" key={index}
      style={{animationDelay:`${Math.min(index*0.085,0.6)}s`}}>{word}&nbsp;</span>)}
  </h2>;
}

export function AuthExperience({intent,configured,error,reason}:AuthExperienceProps) {
  const signup=intent==="signup";
  return <section className="un-auth-shell" aria-label="UNILOOP account access">
    <div className="un-auth-layout">
      <aside className="un-auth-visual-panel">
        <ProximityGrid className="un-auth-visual" cellSize={66} gap={5} proximity={4} inset={5}>
          <GradientBackground aria-hidden="true" className="un-auth-gradient"/>
          <div className="un-auth-visual-content">
            <div className="un-auth-visual-top">
              <span className="un-auth-visual-brand"><span className="un-auth-brand-mark">U</span> UNILOOP <span className="un-auth-brand-dot"/></span>
              <Badge variant="outline" className="un-auth-glass-badge"><Sparkles size={12}/> A better way to exchange</Badge>
            </div>
            <div className="un-auth-visual-main">
              <p className="un-auth-overline"><span/> YOUR CAMPUS. YOUR COMMUNITY.</p>
              <RevealHeading text={signup?"Everything useful begins with a connection.":"Welcome back to your next possibility."}/>
              <p className="un-auth-visual-description">Find something worth keeping. Pass something forward. Borrow what you need for a little while. All from one personal workspace.</p>
              <div className="un-auth-journey" aria-label="Discover, connect and exchange">
                <div><span><Package size={17}/></span><strong>Discover</strong><small>Find or share useful things</small></div>
                <div className="un-auth-journey-line" aria-hidden="true"/>
                <div><span><MessagesSquare size={17}/></span><strong>Connect</strong><small>Discuss the details</small></div>
                <div className="un-auth-journey-line" aria-hidden="true"/>
                <div><span><KeyRound size={17}/></span><strong>Exchange</strong><small>Arrange a handover</small></div>
              </div>
            </div>
            <div className="un-auth-visual-bottom"><ShieldCheck size={18}/> Email-verified entry. Campus marketplace access requires separate approval.</div>
          </div>
        </ProximityGrid>
      </aside>
      <div className="un-auth-form-panel">
        <div className="un-auth-form-top">
          <Link href="/" className="un-auth-back"><ArrowLeft size={16}/> Back to home</Link>
          <span className="un-auth-top-label"><LockKeyhole size={15}/> Account access</span>
        </div>
        <div className="un-auth-form-content">
          <div className="un-auth-form-eyebrow"><span className="un-auth-pulse-dot"/> {signup?"JOIN THE LOOP":"GOOD TO SEE YOU AGAIN"}</div>
          <h1>{signup?"Create your account.":"Sign in to UNILOOP."}</h1>
          <p className="un-auth-lead">{signup?"One account for buying, selling and renting within your campus community.":"Pick up where you left off. Your listings, saved finds and conversations are right where you left them."}</p>
          <nav className="un-auth-intent-tabs" aria-label="Account access">
            <Link href="/login" aria-current={signup?undefined:"page"}>Sign in</Link>
            <Link href="/signup" aria-current={signup?"page":undefined}>Create account</Link>
          </nav>
          <Card className="un-auth-form-card">
            <div className="un-auth-form-card-head">
              <span className="un-auth-form-icon"><Mail size={20}/></span>
              <span className="un-auth-form-chip"><Check size={13}/> Passwordless access</span>
            </div>
            <h2>{signup?"A fresh start, one email away.":"Your inbox is the key."}</h2>
            <p>{signup?"Use your email to create an identity. Your campus will still need to approve marketplace access.":"We'll send you a secure one-time sign-in link. No password to remember."}</p>
            {error==="link"&&<div className="un-auth-notice un-auth-notice-error" role="alert">This sign-in link is invalid or has expired. Request a fresh link below.</div>}
            {reason==="signin"&&<div className="un-auth-notice" role="status">Sign in or create an account to enter your workspace.</div>}
            {configured?<EmailSignIn key={intent} intent={intent}/>:
              <div className="un-auth-unavailable" role="status"><LockKeyhole size={19}/><span>Sign-in will be available after the secure account service is connected.</span></div>}
            <div className="un-auth-form-foot"><ShieldCheck size={16}/><span>We never ask for your password or verification code. Only use links you requested.</span></div>
          </Card>
          <p className="un-auth-switch-copy">{signup?"Already a member?":"New around here?"} <Link href={signup?"/login":"/signup"}>{signup?"Sign in":"Create an account"} <ArrowRight size={15}/></Link></p>
          <p className="un-auth-legal">By continuing, you agree to use UNILOOP responsibly. <Link href="/safety">Read our exchange safety guide</Link>.</p>
        </div>
        <div className="un-auth-form-bottom"><span>Built for thoughtful exchanges.</span><Link href="/help">Need help? <ArrowRight size={14}/></Link></div>
      </div>
    </div>
  </section>;
}
