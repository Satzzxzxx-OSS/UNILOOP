"use client";

import {useState} from "react";
import Link from "next/link";
import {useRouter} from "next/navigation";
import {ArrowUpRight,ChevronUp,HelpCircle,LogOut,Settings2,ShieldCheck,UserRound,Heart} from "lucide-react";
import {Menu,MenuTrigger,MenuPopup,MenuLinkItem,MenuItem,MenuSeparator} from "@/components/spaceui/menu";
import {ProfileAvatar} from "@/components/experience/profile-avatar";
import {FRONTEND_PREVIEW} from "@/lib/auth/frontend-preview";
import {browserSupabase} from "@/lib/supabase/browser";

export function WorkspaceAccountMenu({identity,email,subtitle,verified=true}:{
 identity:string;email:string;subtitle:string;verified?:boolean;
}){
 const router=useRouter();
 const [working,setWorking]=useState(false);
 const [feedback,setFeedback]=useState("");
 async function signOut(){
  if(working)return;
  if(FRONTEND_PREVIEW&&!email){router.push("/login");return;}
  setWorking(true);setFeedback("");
  try{
   const client=browserSupabase();
   if(!client){setFeedback("Sign-out is temporarily unavailable. Please retry.");return;}
   const {error}=await client.auth.signOut();
   if(error){setFeedback("Sign-out failed. Please retry.");return;}
   window.location.replace("/account");
  }catch{setFeedback("Sign-out failed. Please retry.");}
  finally{setWorking(false);}
 }
 return <div className="un-profile-menu-root">
  <Menu>
   <MenuTrigger className="un-profile-menu-trigger" aria-label="Open account menu">
    <ProfileAvatar name={identity} verified={verified} size="small"/>
    <span className="un-profile-menu-trigger-text"><strong>{identity}</strong><small>{subtitle}</small></span>
    <ChevronUp size={16} className="un-profile-menu-trigger-chevron" aria-hidden="true"/>
   </MenuTrigger>
   <MenuPopup aria-label="Account menu" align="start" side="top">
    <div className="un-profile-menu-identity">
     <ProfileAvatar name={identity} verified={verified} size="medium"/>
     <span><strong>{identity}</strong><small>{email||"Account details"}</small></span>
    </div>
    <div className="un-profile-menu-context"><ShieldCheck size={14}/><span>{verified?"Email verified":"Account profile"}</span></div>
    <MenuSeparator/>
    <p className="un-profile-menu-group-label">PERSONAL WORKSPACE</p>
    <MenuLinkItem render={<Link href="/account"/>}><UserRound size={17}/> My profile <ArrowUpRight size={14} className="un-profile-menu-end"/></MenuLinkItem>
    <MenuLinkItem render={<Link href="/settings"/>}><Settings2 size={17}/> Account settings <ArrowUpRight size={14} className="un-profile-menu-end"/></MenuLinkItem>
    <MenuLinkItem render={<Link href="/saved"/>}><Heart size={17}/> Saved items <ArrowUpRight size={14} className="un-profile-menu-end"/></MenuLinkItem>
    <MenuSeparator/>
    <MenuLinkItem render={<Link href="/help"/>}><HelpCircle size={17}/> Help & guidance <ArrowUpRight size={14} className="un-profile-menu-end"/></MenuLinkItem>
    <MenuItem className="un-profile-menu-logout" onClick={()=>void signOut()} disabled={working}>
     <LogOut size={17}/> {working?"Signing out…":"Sign out"}
    </MenuItem>
   </MenuPopup>
  </Menu>
  {feedback&&<p className="un-profile-menu-error" role="alert">{feedback}</p>}
 </div>;
}
