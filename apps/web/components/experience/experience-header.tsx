"use client";

import {Button} from "@/components/spaceui/button";
import {Input} from "@/components/spaceui/input";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";

type Glyph = "search"|"arrow"|"menu"|"close"|"home"|"grid"|"plus"|"heart"|"chat"|"user"|"chevron"|"shield";
export function ExperienceIcon({ name, size = 20 }: {name: Glyph; size?:number}) {
  const common={width:size,height:size,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:1.7,strokeLinecap:"round" as const,strokeLinejoin:"round" as const,"aria-hidden":true as const};
  const paths:Record<Glyph,React.ReactNode>={
    search:<><circle cx="10.8" cy="10.8" r="6.6"/><path d="m16 16 4.5 4.5"/></>,
    arrow:<><path d="M5 12h14m-6-6 6 6-6 6"/></>,
    menu:<><path d="M4 7h16M4 12h16M4 17h16"/></>,
    close:<><path d="M5 5l14 14M19 5 5 19"/></>,
    home:<><path d="m3.5 10.5 8.5-7 8.5 7V21h-6.3v-6h-4.4v6H3.5z"/></>,
    grid:<><rect x="3" y="3" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="2"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="2"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="2"/></>,
    plus:<><path d="M12 4v16M4 12h16"/></>,
    heart:<><path d="M20.1 5.9a5.1 5.1 0 0 0-7.2 0L12 6.8l-.9-.9a5.1 5.1 0 0 0-7.2 7.2L12 21l8.1-7.9a5.1 5.1 0 0 0 0-7.2z"/></>,
    chat:<><path d="M20.5 12a8.5 8.5 0 0 1-8.5 8.5 9 9 0 0 1-4-.9L3 21l1.5-5A8.5 8.5 0 1 1 20.5 12Z"/><path d="M8 12h8"/></>,
    user:<><circle cx="12" cy="8" r="3.5"/><path d="M5 20c.6-4 3-6 7-6s6.4 2 7 6"/></>,
    chevron:<><path d="m7 10 5 5 5-5"/></>,
    shield:<><path d="M12 2 4 5v6c0 6 3.4 9.4 8 11 4.6-1.6 8-5 8-11V5z"/><path d="m9 12 2 2 4-4"/></>,
  };
  return <svg {...common}>{paths[name]}</svg>;
}

const dockItems=[
  {label:"Home",href:"/",icon:"home" as Glyph},
  {label:"Explore",href:"/explore",icon:"grid" as Glyph},
  {label:"List",href:"/post",icon:"plus" as Glyph},
  {label:"Saved",href:"/saved",icon:"heart" as Glyph},
  {label:"Inbox",href:"/inbox",icon:"chat" as Glyph},
];

const sidebarGroups=[
  {label:"Marketplace",items:[
    {label:"Overview",href:"/",icon:"home" as Glyph},
    {label:"Buy",href:"/explore?mode=buy",icon:"grid" as Glyph},
    {label:"Rent",href:"/explore?mode=rent",icon:"grid" as Glyph},
    {label:"Saved items",href:"/saved",icon:"heart" as Glyph},
  ]},
  {label:"Your activity",items:[
    {label:"My listings",href:"/my/listings",icon:"grid" as Glyph},
    {label:"Rental listings",href:"/rent/my",icon:"grid" as Glyph},
    {label:"Messages",href:"/inbox",icon:"chat" as Glyph},
    {label:"Offers",href:"/offers",icon:"arrow" as Glyph},
    {label:"Transactions",href:"/transactions",icon:"arrow" as Glyph},
    {label:"Rental activity",href:"/rentals",icon:"chevron" as Glyph},
  ]},
  {label:"Account",items:[
    {label:"Notifications",href:"/notifications",icon:"chat" as Glyph},
    {label:"Settings",href:"/settings",icon:"user" as Glyph},
    {label:"Help & guidance",href:"/help",icon:"shield" as Glyph},
    {label:"Exchange safety",href:"/safety",icon:"shield" as Glyph},
  ]},
];
function DesktopNavigation({pathname}:{pathname:string}){
  const params=useSearchParams();
  const active=pathname==="/explore"
    ?"/explore?mode="+(params.get("mode")==="rent"?"rent":"buy"):pathname;
  return <nav className="ul-sidebar-nav" aria-label="Main navigation">
    {sidebarGroups.map(group=><section key={group.label}>
      <h2>{group.label}</h2>
      {group.items.map(item=>{
        const selected=item.href===active||(item.href!=="/"&&!item.href.includes("?")&&active.startsWith(item.href+"/"));
        return <Link key={item.href} href={item.href} aria-current={selected?"page":undefined}>
          <ExperienceIcon name={item.icon} size={17}/><span>{item.label}</span>
        </Link>;
      })}
    </section>)}
  </nav>;
}

export function ExperienceHeader({identity="Your account",subtitle="Personal marketplace"}:{identity?:string;subtitle?:string}){
  const pathname=usePathname();
  const [menuOpen,setMenuOpen]=useState(false);
  const menuRef=useRef<HTMLElement|null>(null);
  const menuToggleRef=useRef<HTMLButtonElement|null>(null);
  const [searchOpen,setSearchOpen]=useState(false);
  useEffect(()=>{
    function onSearchShortcut(event:KeyboardEvent){
      const target=event.target;
      if(target instanceof HTMLElement && (target.isContentEditable || target.closest("input,textarea,select")))return;
      if(event.key==="/" || ((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k")){
        event.preventDefault();setSearchOpen(true);
      }
      if(event.key==="Escape")setSearchOpen(false);
    }
    document.addEventListener("keydown",onSearchShortcut);
    return ()=>document.removeEventListener("keydown",onSearchShortcut);
  },[]);
  useEffect(()=>{
    if(!menuOpen)return;
    const before=document.body.style.overflow;
    document.body.style.overflow="hidden";
    const menu=menuRef.current;
    const links=Array.from(menu?.querySelectorAll<HTMLAnchorElement>('a[href]')??[]);
    links[0]?.focus();
    function onKeyDown(event:KeyboardEvent){
      if(event.key==="Escape"){
        event.preventDefault();
        setMenuOpen(false);
        menuToggleRef.current?.focus();
      }
      if(event.key!=="Tab"||!links.length)return;
      const first=links[0],last=links[links.length-1];
      if(event.shiftKey&&document.activeElement===first){
        event.preventDefault();last.focus();
      }else if(!event.shiftKey&&document.activeElement===last){
        event.preventDefault();first.focus();
      }
    }
    document.addEventListener("keydown",onKeyDown);
    return ()=>{document.removeEventListener("keydown",onKeyDown);document.body.style.overflow=before;};
  },[menuOpen]);
  return <>
    <aside className="ul-sidebar" aria-label="Workspace sidebar">
      <Link href="/" className="ul-sidebar-brand" aria-label="UNILOOP overview"><span className="ul-monogram">U</span><strong>UNILOOP</strong><span className="ul-brand-tag">Workspace</span></Link>
      <Button variant="ghost" className="ul-sidebar-search" type="button" aria-label="Open workspace search" onClick={()=>setSearchOpen(true)}><ExperienceIcon name="search" size={16}/><span>Search marketplace</span><kbd>⌘ K</kbd></Button>
      <Suspense fallback={<nav className="ul-sidebar-nav" aria-label="Main navigation"><Link href="/">Overview</Link></nav>}><DesktopNavigation pathname={pathname}/></Suspense>
      <div className="ul-sidebar-bottom">
        <Link href="/post" className="ul-sidebar-create"><ExperienceIcon name="plus" size={17}/>Create listing</Link>
        <details className="ul-account-menu">
          <summary><span className="ul-account-avatar"><ExperienceIcon name="user" size={17}/></span><span><strong>{identity}</strong><small>{subtitle}</small></span><ExperienceIcon name="chevron" size={15}/></summary>
          <nav aria-label="Account menu"><Link href="/account">Account & sign in</Link><Link href="/settings">Account settings</Link><Link href="/help">Help & guidance</Link></nav>
        </details>
      </div>
    </aside>
    <header className="ux-header">
      <div className="ux-shell ux-header-inner">
        <Link className="ux-brand" href="/" aria-label="UNILOOP home">
          <span className="ux-brand-symbol" aria-hidden="true"><i/><i/><b/></span>
          <span>uni<span>loop</span><sup>™</sup></span>
        </Link>
        <div className="ul-header-context"><span>Workspace</span><span aria-hidden="true">/</span><strong>{pathname==="/"?"Overview":pathname.startsWith("/explore")?"Marketplace":sidebarGroups.flatMap(g=>g.items).find(i=>i.href===pathname)?.label??"Your loop"}</strong></div>
        <div className="ux-header-controls">
          <Button variant="ghost" className="ux-icon-button ux-global-search" type="button"
            aria-label="Open item search" aria-controls="ux-global-search-panel" aria-expanded={searchOpen}
            onClick={()=>setSearchOpen(v=>!v)}><ExperienceIcon name="search"/><span>Search</span><kbd>/</kbd></Button>
          <Link href="/saved" className="ux-icon-button ux-desktop-control" aria-label="Saved items"><ExperienceIcon name="heart"/></Link>
          <Link href="/inbox" className="ux-icon-button ux-desktop-control" aria-label="Inbox"><ExperienceIcon name="chat"/></Link>
          <Link href="/account" className="ux-icon-button ux-desktop-control" aria-label="Your account"><ExperienceIcon name="user"/></Link>
          <Link href="/post" className="ux-header-list">List an item <ExperienceIcon name="arrow" size={17}/></Link>
          <Button variant="ghost" ref={menuToggleRef} type="button" className="ux-icon-button ux-menu-toggle"
            aria-label={menuOpen?"Close navigation":"Open navigation"}
            aria-controls="ux-mobile-menu" aria-expanded={menuOpen}
            onClick={()=>setMenuOpen(v=>!v)}><ExperienceIcon name={menuOpen?"close":"menu"}/></Button>
        </div>
      </div>
      {searchOpen&&<form id="ux-global-search-panel" className="ux-mobile-search-panel ux-shell" action="/explore" role="search">
        <label className="ux-visually-hidden" htmlFor="ux-top-search">Search the marketplace</label>
        <ExperienceIcon name="search" size={19}/>
        <Input nativeInput unstyled autoFocus id="ux-top-search" type="search" name="q"
          maxLength={100} onKeyDown={e=>{if(e.key==="Escape"){setSearchOpen(false);document.querySelector<HTMLButtonElement>('[aria-controls="ux-global-search-panel"]')?.focus();}}} placeholder="What are you looking for?"/>
        <Button type="submit">Search <ExperienceIcon name="arrow" size={15}/></Button>
      </form>}
      {menuOpen&&<div className="ux-mobile-backdrop" role="presentation" onClick={()=>{setMenuOpen(false);menuToggleRef.current?.focus();}}>
        <nav ref={menuRef} id="ux-mobile-menu" className="ux-menu-sheet" aria-label="More navigation"
          onClick={event=>event.stopPropagation()}>
          <p className="ux-menu-caption">EXPLORE THE LOOP</p>
          {[
            {name:"Discover",href:"/"},{name:"Buy something",href:"/explore?mode=buy"},
            {name:"Rent something",href:"/explore?mode=rent"},
            {name:"Sell an item",href:"/post"},{name:"Rent out an item",href:"/rent/post"},
            {name:"My listings",href:"/my/listings"},{name:"Rental listings",href:"/rent/my"},{name:"My rentals",href:"/rentals"},{name:"Offers",href:"/offers"},{name:"Saved items",href:"/saved"},{name:"Messages",href:"/inbox"},{name:"Account",href:"/account"},
            {name:"Transactions",href:"/transactions"},{name:"Notifications",href:"/notifications"},{name:"Help center",href:"/help"},
            {name:"Help & safety",href:"/safety"},{name:"Settings",href:"/settings"},
          ].map(item=><Link key={item.href} href={item.href} onClick={()=>setMenuOpen(false)}>
            {item.name}<ExperienceIcon name="arrow" size={16}/>
          </Link>)}
        </nav>
      </div>}
    </header>
    <nav aria-label="Quick mobile navigation" className="ux-bottom-dock">
      {dockItems.map(item=><Link key={item.label} href={item.href}
        aria-current={item.href==="/"&&pathname==="/"||item.href!=="/"&&pathname.startsWith(item.href)?"page":undefined}
        className={item.label==="List"?"ux-dock-post":""}>
        <ExperienceIcon name={item.icon} size={22}/><span>{item.label}</span>
      </Link>)}
    </nav>
  </>;
}
