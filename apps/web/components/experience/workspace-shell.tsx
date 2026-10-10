import Link from "next/link";
import type {ReactNode} from "react";
import {ExperienceIcon} from "./experience-header";

export function WorkspaceShell({eyebrow,title,description,action,children}:{
 eyebrow:string;title:string;description:string;
 action?:{href:string;label:string};children:ReactNode;
}){
 return <div className="ux-workspace ux-shell">
   <div className="ux-workspace-hero">
     <div><p className="ux-kicker">{eyebrow}</p><h1>{title}</h1>
       <p>{description}</p></div>
     {action&&<Link href={action.href} className="ux-workspace-action">
       {action.label}<ExperienceIcon name="arrow" size={19}/>
     </Link>}
   </div>
   <div className="ux-workspace-content">{children}</div>
 </div>;
}
export function WorkspaceEmpty({title,description,action,kind="neutral"}:{
  title:string;description:string;action?:{href:string;label:string};
  kind?:"neutral"|"auth"|"notice";
}){
  return <section className={"ux-workspace-empty ux-workspace-empty-"+kind}>
    <div className="ux-workspace-empty-art" aria-hidden="true">
      <span className="ux-workspace-empty-circle"/><span className="ux-workspace-empty-star">✳</span>
    </div>
    <h2>{title}</h2><p>{description}</p>
    {action&&<Link href={action.href} className="ux-workspace-action">
       {action.label}<ExperienceIcon name="arrow" size={18}/>
    </Link>}
  </section>;
}
