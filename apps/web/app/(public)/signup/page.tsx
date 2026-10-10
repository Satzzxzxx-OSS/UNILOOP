import type {Metadata} from "next";
import {redirect} from "next/navigation";
import {verifiedIdentity} from "@/lib/auth/session";
import {AuthExperience} from "@/components/auth/auth-experience";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Create account",robots:{index:false,follow:false}};
export default async function SignupPage(){
  const {client,user}=await verifiedIdentity();
  if(user)redirect("/dashboard");
  return <AuthExperience intent="signup" configured={Boolean(client)}/>;
}
