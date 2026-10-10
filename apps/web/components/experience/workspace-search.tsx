"use client";

import Link from "next/link";
import {useState} from "react";
import {Search,ArrowUpRight,Package,KeyRound,MessageCircle,Heart,Settings,Plus} from "lucide-react";
import {Dialog,DialogClose,DialogPopup,DialogTitle,DialogDescription} from "@/components/spaceui/dialog";
import {Input} from "@/components/spaceui/input";
import {Button} from "@/components/spaceui/button";

const destinations=[
  {label:"Browse items for sale",hint:"Marketplace · Buy",href:"/explore?mode=buy",icon:Package},
  {label:"Find a rental",hint:"Marketplace · Rent",href:"/explore?mode=rent",icon:KeyRound},
  {label:"Create a listing",hint:"Share something useful",href:"/post",icon:Plus},
  {label:"Your messages",hint:"Conversations and offers",href:"/inbox",icon:MessageCircle},
  {label:"Saved items",hint:"Things worth coming back to",href:"/saved",icon:Heart},
  {label:"Account settings",hint:"Your personal preferences",href:"/settings",icon:Settings},
];

export function WorkspaceSearch({open,onOpenChange,onClosed}:{open:boolean;onOpenChange:(value:boolean)=>void;onClosed:()=>void}){
  const [query,setQuery]=useState("");
  const matches=destinations.filter(item=>(item.label+" "+item.hint).toLowerCase().includes(query.trim().toLowerCase()));
  return <Dialog open={open} onOpenChange={onOpenChange} onOpenChangeComplete={value=>{if(!value){setQuery("");onClosed();}}}>
    <DialogPopup className="ul-search-dialog" id="ux-global-search-panel" bottomStickOnMobile={false} showCloseButton={false}>
      <DialogTitle className="ux-visually-hidden">Search your workspace</DialogTitle>
      <DialogDescription className="ux-visually-hidden">Search marketplace items or choose a workspace destination.</DialogDescription>
      <form action="/explore" role="search" className="ul-command-search">
        <Search size={20} aria-hidden="true"/>
        <label htmlFor="ux-top-search" className="ux-visually-hidden">Search the marketplace</label>
        <Input nativeInput unstyled autoFocus id="ux-top-search" name="q" type="search" value={query} onChange={event=>setQuery(event.target.value)} maxLength={100} placeholder="Search items or jump to a page…"/>
        <Button type="submit" size="sm">Search</Button>
      </form>
      <div className="ul-command-results"><p>QUICK NAVIGATION</p><nav aria-label="Workspace shortcuts">
        {matches.map(item=><Link key={item.href} href={item.href} onClick={()=>onOpenChange(false)}><span className="ul-command-icon"><item.icon size={17}/></span><span><strong>{item.label}</strong><small>{item.hint}</small></span><ArrowUpRight size={16}/></Link>)}
        {!matches.length&&<p className="ul-command-empty">No matching page. Press Search to find marketplace items.</p>}
      </nav></div>
      <div className="ul-command-footer"><span>Tab to navigate · Enter to select</span><DialogClose render={<Button variant="ghost" size="sm" type="button" aria-label="Close workspace search"/>}>Close <kbd>esc</kbd></DialogClose></div>
    </DialogPopup>
  </Dialog>;
}
