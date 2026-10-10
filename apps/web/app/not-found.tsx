import Link from "next/link";
import {ExperienceIcon} from "@/components/experience/experience-header";

export default function NotFound(){
 return <main className="ux-shell ux-not-found">
   <span className="ux-404-mark" aria-hidden="true">404<span>✳</span></span>
   <p className="ux-kicker">THE LOOP TOOK A TURN</p>
   <h1>This page took a <em>different path.</em></h1>
   <p>Nothing here right now. Let&apos;s find something useful together.</p>
   <Link href="/" className="ux-workspace-action">Back to Discover <ExperienceIcon name="arrow" size={19}/></Link>
 </main>;
}
