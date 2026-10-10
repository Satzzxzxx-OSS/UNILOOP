import Link from 'next/link';
import {ArrowLeft,ArrowRight,Box,MessagesSquare,KeyRound,Sparkles} from 'lucide-react';
import {GradientBackground} from '@/components/spaceui/gradient-background';
import {ProximityGrid} from '@/components/spaceui/proximity-grid';
import {SignInBlock} from '@/components/spaceui/sign-in-block';
import {AuthBotAvatar} from '@/components/auth/auth-bot-avatar';
import {EmailSignIn} from '@/components/email-sign-in';
import {FRONTEND_PREVIEW} from '@/lib/auth/frontend-preview';

type AuthIntent='signin'|'signup';
interface AuthExperienceProps{intent:AuthIntent;configured:boolean;error?:string;reason?:string}

export function AuthExperience({intent,configured,error}:AuthExperienceProps){
 const signup=intent==='signup';
 return <section className="un-auth-split" aria-label="UNILOOP account access">
  <aside className="un-auth-story" aria-label="Your campus, your community">
   <GradientBackground className="un-auth-space-gradient" aria-hidden="true"/>
   <ProximityGrid className="un-auth-story-grid" cellSize={64} gap={4} interactive={false} aria-hidden="true"/>
   <div className="un-auth-story-top"><Link href="/" className="un-auth-story-brand"><span>U</span> UNILOOP</Link><span className="un-auth-story-tag"><Sparkles size={13}/> A better way to exchange</span></div>
   <div className="un-auth-story-body">
    <p className="un-auth-eyebrow">YOUR CAMPUS. YOUR COMMUNITY.</p>
    <h2>{signup?'Everything useful begins with a connection.':'Welcome back to your next possibility.'}</h2>
    <p>Find something worth keeping. Pass something forward. Borrow what you need for a little while. All from one personal workspace.</p>
    <div className="un-auth-story-steps">{[{title:'Discover',text:'Find or share useful things',Icon:Box},{title:'Connect',text:'Discuss the details',Icon:MessagesSquare},{title:'Exchange',text:'Arrange a handover',Icon:KeyRound}].map(({title,text,Icon})=><div key={title}><span><Icon size={20}/></span><strong>{title}</strong><p>{text}</p></div>)}</div>
   </div>
   <div className="un-auth-story-bottom"><span/> Useful things. Thoughtful exchanges.</div>
  </aside>
  <div className="un-auth-form-side">
   <nav className="un-auth-topbar" aria-label="Account navigation"><Link href="/"><ArrowLeft size={16}/> Back to home</Link><span>{FRONTEND_PREVIEW?'FRONTEND PREVIEW':'ACCOUNT ACCESS'}</span></nav>
   <div className="un-auth-form-center">
    <nav className="un-auth-mode" aria-label="Account access"><Link href="/login" aria-current={!signup?'page':undefined}>Sign in</Link><Link href="/signup" aria-current={signup?'page':undefined}>Create account</Link></nav>
    <SignInBlock signup={signup} preview={FRONTEND_PREVIEW} avatar={<AuthBotAvatar/>}>
     {error==='link'&&<p role="alert">This sign-in link is invalid or expired. Request a new link.</p>}
     <EmailSignIn key={intent} intent={intent} configured={configured}/>
     {!configured&&<p className="un-auth-preview-note">Account services are not connected yet.</p>}
    </SignInBlock>
    <p className="un-auth-terms">By continuing, use UNILOOP responsibly.<br/><Link href="/safety">Read the exchange safety guide <ArrowRight size={12}/></Link></p>
   </div>
   <footer className="un-auth-form-bottom"><span>Built for thoughtful exchanges.</span><Link href="/help">Need help? <ArrowRight size={14}/></Link></footer>
  </div>
 </section>;
}
