import type {Metadata} from "next";
import Link from "next/link";
import {getSaleInbox} from "@/lib/interactions/data";
import {WorkspaceShell,WorkspaceEmpty} from "@/components/experience/workspace-shell";
import {ExperienceIcon} from "@/components/experience/experience-header";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Messages",robots:{index:false}};
export default async function InboxPage(){
 const result=await getSaleInbox();
 return <WorkspaceShell eyebrow="PRIVATE CONVERSATIONS" title="The conversation starts here."
   description="Ask questions, talk through the details and keep exchanges moving."
   action={{href:"/offers",label:"View offers"}}>
   {result.kind==="ready"&&result.conversations.length?
     <div className="ux-workspace-threads">{result.conversations.map(thread=>
       <Link key={thread.id} href={"/inbox/"+thread.id} className="ux-workspace-thread">
         <span className="ux-workspace-thread-icon"><ExperienceIcon name="chat" size={22}/></span>
         <span><strong>{thread.title}</strong><small>Private item conversation</small></span>
         <span className="ux-workspace-thread-arrow"><ExperienceIcon name="arrow" size={19}/></span>
       </Link>)}</div>:
     <WorkspaceEmpty kind={result.kind!=="ready"?"auth":"neutral"}
       title={result.kind==="ready"?"Your inbox is ready for good conversations.":"Messaging isn't connected yet."}
       description={result.kind==="ready"?
         "Once a real conversation starts, you'll find it right here.":
         "Sign in with an approved account to access private messages when services are available."}
       action={{href:result.kind==="ready"?"/explore":"/account",
         label:result.kind==="ready"?"Discover items":"Go to account"}}/>}
 </WorkspaceShell>;
}
