"use client";

import Link from "next/link";
import {useEffect} from "react";
import {ExperienceIcon} from "@/components/experience/experience-header";

export default function ErrorPage({error,reset}:{error:Error & {digest?:string};reset:()=>void}){
 useEffect(()=>{
   // No personal listing/message data is printed into public UI.
   if(process.env.NODE_ENV!=="production")console.error("UNILOOP UI error",error);
 },[error]);
 return <section className="ux-shell ux-not-found" role="alert">
   <span className="ux-404-mark" aria-hidden="true">✳</span>
   <p className="ux-kicker">THAT DIDN'T LOAD AS EXPECTED</p>
   <h1>Let&apos;s try <em>that again.</em></h1>
   <p>Something interrupted this page. Your action may not have completed.</p>
   <div className="ux-error-actions">
     <button type="button" onClick={()=>reset()} className="ux-workspace-action">
       Try again <ExperienceIcon name="arrow" size={18}/>
     </button>
     <Link href="/explore" className="ux-detail-text-link">Explore instead →</Link>
   </div>
 </section>;
}
