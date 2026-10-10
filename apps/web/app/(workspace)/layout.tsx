import type {ReactNode} from "react";
import {redirect} from "next/navigation";
import {verifiedIdentity} from "@/lib/auth/session";
import {WorkspaceFrame} from "@/components/experience/workspace-frame";

export default async function WorkspaceLayout({children}:{children:ReactNode}){
 const {user}=await verifiedIdentity();
 if(!user)redirect("/account?reason=signin");
 return <WorkspaceFrame>{children}</WorkspaceFrame>;
}
