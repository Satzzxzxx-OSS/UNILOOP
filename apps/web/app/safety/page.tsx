import type {Metadata} from "next";
import Link from "next/link";
import {ExperienceIcon} from "@/components/experience/experience-header";

export const metadata:Metadata={title:"Safety and good exchanges"};
const steps=[
  {n:"01",title:"Inspect in person",description:"Before you pay or exchange anything, verify the real item and its condition. Check all accessories and that it works as represented."},
  {n:"02",title:"Keep your codes private",description:"Never share one-time passwords, login codes, financial credentials or identity documents in conversations or listing descriptions."},
  {n:"03",title:"Choose a sensible handover",description:"Agree on a public, well-lit meeting location and clearly confirm the item, price, accessories and timing in advance."},
  {n:"04",title:"Take care when renting",description:"Agree on the return date, duration, deposit amount and condition checklist. Record condition at pickup and return."},
  {n:"05",title:"Check claims independently",description:"An accepted price offer is not proof of payment, and a handover record is based on participants' confirmations. The platform cannot independently verify these."},
  {n:"06",title:"Use reporting thoughtfully",description:"If a listing appears misleading or unsafe, use the Report action on the actual item when reporting is enabled. Avoid sending personal data in a report."},
];
export default function SafetyPage(){
 return <article className="ux-shell ux-guide-page">
   <header className="ux-guide-hero"><p className="ux-kicker">LOOK OUT FOR EACH OTHER</p>
     <h1>Exchange safety</h1>
     <p>A few practical ways to make buying, selling, lending and renting feel safer for everyone.</p>
   </header>
   <div className="ux-guide-banner">
     <ExperienceIcon name="shield" size={35}/>
     <div><h2>Stay in control of the exchange.</h2>
       <p>UNILOOP does not offer escrow, hold deposits, verify cash transfers, insure goods,
       or guarantee item condition. Don&apos;t assume a status label proves payment or protection.</p></div>
   </div>
   <section className="ux-guide-grid" aria-label="Safety recommendations">
     {steps.map(x=><article key={x.n} className="ux-guide-tile">
       <span>{x.n}</span><h2>{x.title}</h2><p>{x.description}</p>
     </article>)}
   </section>
   <footer className="ux-guide-footer">
     <div><p className="ux-kicker">NEED A HAND?</p>
       <h2>Questions along the way?</h2><p>Learn where marketplace actions belong and what is available today.</p></div>
     <Link href="/help" className="ux-workspace-action">Visit help center <ExperienceIcon name="arrow" size={18}/></Link>
   </footer>
 </article>;
}
