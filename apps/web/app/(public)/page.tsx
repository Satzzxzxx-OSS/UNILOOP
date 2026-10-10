import type {Metadata} from "next";
import Link from "next/link";
import {redirect} from "next/navigation";
import {verifiedIdentity} from "@/lib/auth/session";
import {Button} from "@/components/spaceui/button";
import {Card} from "@/components/spaceui/card";
import {Badge} from "@/components/spaceui/badge";
import {BouncyAccordion} from "@/components/spaceui/bouncy-accordion";
import {BlurRevealText} from "@/components/spaceui/blur-reveal-text";
import {GlassButton} from "@/components/spaceui/glass-button";
import {LandingArt} from "@/components/experience/landing-art";
import {CategoryIcon} from "@/components/category-icon";
import {categories} from "@/lib/catalog";
import {ArrowUpRight,ArrowRight,ShoppingBag,Package,KeyRound,ShieldCheck,MessageCircle,Search,Check} from "lucide-react";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:{absolute:"UNILOOP — More use. More possibility."},description:"Buy, sell and rent useful things in your campus community. Learn how UNILOOP works and create your account."};
export default async function LandingPage(){
 const {user}=await verifiedIdentity();if(user)redirect("/dashboard");
 return <div className="ul-landing">
  <section className="ul-landing-hero" aria-labelledby="landing-title">
   <div className="ul-landing-intro"><Badge variant="outline" className="ul-landing-eyebrow"><span/>THE CAMPUS MARKETPLACE</Badge>
    <h1 id="landing-title"><BlurRevealText as="span" text="Useful things."/><br/><BlurRevealText as="span" text="New possibilities." delay={0.2}/></h1>
    <p className="ul-landing-lead">Buy what you need. Pass on what you don’t.<br className="ul-desktop-break"/> Borrow for the moments in between.</p>
    <p className="ul-landing-subcopy">Your campus life, a little more connected. One place to discover, list and arrange thoughtful exchanges.</p>
    <div className="ul-landing-ctas"><Button size="xl" render={<Link href="/signup"/>}>Join the loop <ArrowRight size={18}/></Button><GlassButton size="xl" className="ul-glass-action" render={<Link href="#how-it-works"/>}>See how it works <ArrowUpRight size={18}/></GlassButton></div>
    <div className="ul-landing-assurances"><span><Check size={14}/>Buy, sell & rent</span><span><Check size={14}/>Your own workspace</span><span><Check size={14}/>Email-verified account</span></div>
   </div><LandingArt/>
  </section>
  <section className="ul-landing-section" id="possibilities" aria-labelledby="possibilities-title"><div className="ul-section-heading"><p className="ul-eyebrow">ONE LOOP. THREE WAYS IN.</p><h2 id="possibilities-title">Make room for what comes next.</h2><p>Different needs. The same simple starting point.</p></div>
   <div className="ul-intent-cards">{[{icon:ShoppingBag,title:"Find your next thing",copy:"From study essentials to everyday gear, discover what’s already out there.",tag:"BUY"},{icon:Package,title:"Give it a next chapter",copy:"Clear photos. Honest details. List something useful you’re ready to pass on.",tag:"SELL"},{icon:KeyRound,title:"Borrow for the occasion",copy:"Need it for a little while? Explore rentals and discuss the dates and terms.",tag:"RENT"}].map(({icon:Icon,title,copy,tag})=><Card key={tag} className="ul-landing-intent"><span className="ul-landing-card-icon"><Icon size={23}/></span><Badge variant="outline">{tag}</Badge><h3>{title}</h3><p>{copy}</p><Button variant="outline" render={<Link href="/signup"/>}>Get started <ArrowUpRight size={17}/></Button></Card>)}</div>
  </section>
  <section className="ul-landing-section ul-category-section" id="categories" aria-labelledby="landing-categories-title"><div className="ul-section-heading"><p className="ul-eyebrow">BUILT AROUND YOUR EVERYDAY</p><h2 id="landing-categories-title">A place for your kind of useful.</h2><p>Eight familiar categories. One connected marketplace.</p></div><div className="ul-landing-categories">{categories.map(c=><Card key={c.slug} className="ul-landing-category"><CategoryIcon name={c.symbol}/><h3>{c.label}</h3></Card>)}</div><p className="ul-category-footnote">Create your account to explore items available to your campus.</p></section>
  <section className="ul-landing-section" id="how-it-works" aria-labelledby="how-title"><div className="ul-section-heading"><p className="ul-eyebrow">FROM DISCOVERY TO HANDOVER</p><h2 id="how-title">Simple steps. Clear expectations.</h2><p>You stay in control of the conversation and the exchange.</p></div><ol className="ul-landing-steps">{[{icon:Search,title:"Find or list",copy:"Explore by category or create a listing with details, photos and a fair price."},{icon:MessageCircle,title:"Talk it through",copy:"Ask about the condition, agree on a price, or check rental dates before you commit."},{icon:Package,title:"Arrange the exchange",copy:"Agree on the handover. For rentals, keep track of the request, collection and return."}].map(({icon:Icon,title,copy},i)=><li key={title}><span className="ul-step-number">0{i+1}</span><Icon size={23}/><h3>{title}</h3><p>{copy}</p></li>)}</ol></section>
  <section className="ul-landing-safety" aria-labelledby="landing-safety-title"><div className="ul-safety-emblem"><ShieldCheck size={38}/></div><div><p className="ul-eyebrow">A LITTLE CARE GOES A LONG WAY</p><h2 id="landing-safety-title">Good exchanges start with good information.</h2><p>Check the item. Ask questions. Agree on the details and choose a sensible handover. UNILOOP does not provide payment custody, insurance or guaranteed transactions.</p><Button variant="outline" render={<Link href="/safety"/>}>Read the exchange guide <ArrowUpRight size={17}/></Button></div></section>
  <section className="ul-landing-section ul-landing-faq" aria-labelledby="landing-faq-title"><div className="ul-section-heading"><p className="ul-eyebrow">BEFORE YOU JOIN</p><h2 id="landing-faq-title">A few things worth knowing.</h2></div><BouncyAccordion items={[
   {title:"What can I do on UNILOOP?",description:"Buy and sell useful items, explore rentals, save finds, and follow conversations and exchanges from your personal workspace. Marketplace access depends on your campus eligibility."},
   {title:"How do I get into my workspace?",description:"Create an account or sign in using an email verification link. Once your email is verified, you can enter your workspace. Marketplace activity still requires eligible campus access."},
   {title:"Can I browse without an account?",description:"You can learn about the marketplace, categories and exchange process here. Sign in to access marketplace pages and your personal dashboard."},
   {title:"Does UNILOOP handle payments or insure rentals?",description:"No. UNILOOP does not provide in-app payment custody, insurance or guaranteed exchanges. Check the exchange guide before arranging a handover."}
  ]}/></section>
  <section className="ul-landing-final"><Badge variant="outline">YOUR NEXT CHAPTER</Badge><h2>Stay in the loop.</h2><p>Find something useful. Make something useful again.</p><Button size="xl" render={<Link href="/signup"/>}>Create your account <ArrowRight size={18}/></Button><span>Already part of the loop? <Link href="/login">Sign in</Link></span></section>
 </div>;
}
