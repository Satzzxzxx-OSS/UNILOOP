import type {ReactNode} from "react";
import {FRONTEND_PREVIEW} from "@/lib/auth/frontend-preview";
import {redirect} from "next/navigation";
import {verifiedIdentity} from "@/lib/auth/session";
import {WorkspaceFrame} from "@/components/experience/workspace-frame";

export default async function WorkspaceLayout({children}:{children:ReactNode}){
 const {user}=await verifiedIdentity();
 if(!user&&!FRONTEND_PREVIEW)redirect("/account?reason=signin");
 return <WorkspaceFrame>{children}</WorkspaceFrame>;
}
