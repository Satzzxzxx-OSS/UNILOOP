import {BouncyAccordion} from "@/components/spaceui/bouncy-accordion";
import type {Metadata} from "next";
import Link from "next/link";
import {ExperienceIcon} from "@/components/experience/experience-header";

export const metadata:Metadata={title:"Help and guidance"};
const faqs=[
 {question:"What can I do on UNILOOP?",answer:"One account can explore items for sale and rent, create sale or rental listing drafts, and access private messages, offers and activity when the relevant account services are enabled."},
 {question:"Why can't I see items for sale?",answer:"Discovery only shows actual eligible listings. If accounts or data are not connected, the website shows a truthful unavailable state instead of demo products."},
 {question:"Can I save a draft right now?",answer:"The visual posting wizard lets you enter details and review local photo previews. Saving and uploading are only available when your approved account and marketplace features are enabled."},
 {question:"Does sending a rental request confirm my booking?",answer:"No. A request is not an approved rental. The owner must approve, and both participants must confirm the handover separately."},
 {question:"Do you process payments, deposits or refunds?",answer:"No. The current platform does not hold deposits, process checkout, provide escrow, insure goods or verify payments."},
 {question:"What should I do about a suspicious listing?",answer:"Do not transfer money or share sensitive details. Use the item's Report option once it is enabled. Reports do not automatically remove an item."},
 {question:"Where are my conversations and offers?",answer:"Your Inbox and Offers pages show only actual private conversations and negotiated prices. Live push and outbound email delivery are not active yet."},
];
export default function HelpPage(){
 return <article className="ux-shell ux-guide-page">
   <header className="ux-guide-hero"><p className="ux-kicker">A LITTLE GUIDANCE GOES A LONG WAY</p>
     <h1>Help & guidance</h1>
     <p>Answers about discovery, listing, borrowing and staying thoughtful along the way.</p></header>
   <section className="ux-help-topics" aria-label="Helpful places">
     {[
       {label:"Explore items",href:"/explore?mode=buy",text:"Browse real things people are selling.",icon:"grid" as const},
       {label:"Your account",href:"/account",text:"Understand access and sign-in.",icon:"user" as const},
       {label:"Exchange safely",href:"/safety",text:"A useful checklist before you meet.",icon:"shield" as const},
     ].map(x=><Link href={x.href} className="ux-help-topic" key={x.href}>
       <ExperienceIcon name={x.icon} size={25}/><h2>{x.label}</h2>
       <p>{x.text}</p><span>Explore <ExperienceIcon name="arrow" size={16}/></span>
     </Link>)}
   </section>
   <section className="ux-help-faq"><p className="ux-kicker">GOOD QUESTIONS</p>
     <h2>The answers, without the guesswork.</h2>
     <BouncyAccordion items={faqs.map(item=>({title:item.question,description:item.answer}))}/>
   </section>
   <div className="ux-help-disclosure"><strong>Service availability</strong>
     <p>Some account and marketplace capabilities are not enabled yet. This help center
       does not imply there is a staffed support desk or protected checkout service.</p>
   </div>
 </article>;
}
