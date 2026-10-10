"use client";

import Link from "next/link";
import {useState} from "react";
import {ChevronUp, UserRound, Settings2, Bell, ShieldCheck, CircleHelp, LogOut, ArrowUpRight, LockKeyhole} from "lucide-react";
import {browserSupabase} from "@/lib/supabase/browser";
import {AccountAvatar} from "@/components/experience/account-avatar";
import {Menu,MenuTrigger,MenuPopup,MenuLinkItem,MenuItem,MenuSeparator} from "@/components/spaceui/menu";

export function SidebarAccountMenu({name,email,compact=false}:{
 name:string;email:string;compact?:boolean;
}){
 const [working,setWorking]=useState(false);
 const [error,setError]=useState("");
 async function signOut(){
  if(working)return;
  setWorking(true);
  setError("");
  try{
   const client=browserSupabase();
   if(!client){setError("Sign out is not available. Open your account to retry.");return;}
   const {error:signOutError}=await client.auth.signOut();
   if(signOutError){setError("Sign out failed. Please retry.");return;}
   window.location.replace("/account");
  }catch{
   setError("Sign out failed. Please retry.");
  }finally{setWorking(false);}
 }
 return <div className={compact?"ul-space-account-menu ul-space-account-menu-compact":"ul-space-account-menu"}>
  <Menu>
   <MenuTrigger className="ul-space-account-trigger" aria-label="Open account menu">
    <AccountAvatar name={name} size="sm"/>
    <span className="ul-space-account-trigger-text"><strong>{name}</strong><small>{compact?"Account & preferences":email||"Personal marketplace"}</small></span>
    <ChevronUp size={16} className="ul-space-account-chevron" aria-hidden="true"/>
   </MenuTrigger>
   <MenuPopup side={compact?"bottom":"top"} align="start" sideOffset={9} className="ul-space-account-popup" aria-label="Account menu">
    <div className="ul-space-menu-persona" aria-label="Signed in account">
     <AccountAvatar name={name} size="md"/>
     <div><strong>{name}</strong><span>{email}</span><small><LockKeyhole size={12}/> Signed in with verified email</small></div>
    </div>
    <div className="ul-space-menu-group-title">YOUR WORKSPACE</div>
    <MenuLinkItem render={<Link href="/account"/>}><UserRound size={17}/> My account <ArrowUpRight className="ul-space-menu-tail" size={14}/></MenuLinkItem>
    <MenuLinkItem render={<Link href="/settings"/>}><Settings2 size={17}/> Profile & settings <ArrowUpRight className="ul-space-menu-tail" size={14}/></MenuLinkItem>
    <MenuLinkItem render={<Link href="/notifications"/>}><Bell size={17}/> Notifications <ArrowUpRight className="ul-space-menu-tail" size={14}/></MenuLinkItem>
    <MenuSeparator/>
    <div className="ul-space-menu-group-title">SUPPORT & SAFETY</div>
    <MenuLinkItem render={<Link href="/safety"/>}><ShieldCheck size={17}/> Exchange safety</MenuLinkItem>
    <MenuLinkItem render={<Link href="/help"/>}><CircleHelp size={17}/> Help & guidance</MenuLinkItem>
    <MenuSeparator/>
    <MenuItem onClick={()=>{void signOut();}} disabled={working} className="ul-space-menu-signout"><LogOut size={17}/> {working?"Signing out…":"Sign out"}</MenuItem>
   </MenuPopup>
  </Menu>
  {error&&<p className="ul-space-account-error" role="status" aria-live="polite">{error}</p>}
 </div>;
}
