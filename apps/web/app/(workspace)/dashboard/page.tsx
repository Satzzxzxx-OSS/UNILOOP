import Link from "next/link";
import {categories,exploreHref} from "@/lib/catalog";
import {CategoryIcon} from "@/components/category-icon";
import {ListingResults} from "@/components/listing-results";
import {RentalResults} from "@/components/rental-results";
import {discoverListings,getMyListings} from "@/lib/listings/data";
import {discoverRentals,getMyRentalListings,getRentalBookings} from "@/lib/rentals/data";
import {getSaleInbox} from "@/lib/interactions/data";
import {ExperienceIcon} from "@/components/experience/experience-header";
import {ExperienceSearch} from "@/components/experience/experience-search";
import {MarketplacePanel} from "@/components/experience/marketplace-panel";
import {Card} from "@/components/spaceui/card";

export const dynamic="force-dynamic";
function count(kind:string,length:number,cap:number){return kind==="ready"?(length===cap?"≥ "+length:String(length)):"—";}
export default async function HomePage(){
  const [buyResult,rentResult,listings,rentals,inbox,bookings]=await Promise.all([
    discoverListings({limit:6}),discoverRentals({limit:6}),getMyListings(),getMyRentalListings(),getSaleInbox(),getRentalBookings(),
  ]);
  const metrics=[
    {label:"Your listings",value:count(listings.kind,listings.items.length,24),note:listings.kind==="ready"?"Recent listings · up to 24":"Account access required",href:"/my/listings",icon:"grid" as const},
    {label:"Rental listings",value:count(rentals.kind,rentals.items.length,30),note:rentals.kind==="ready"?"Recent listings · up to 30":"Account access required",href:"/rent/my",icon:"grid" as const},
    {label:"Conversations",value:count(inbox.kind,inbox.conversations.length,50),note:inbox.kind==="ready"?"Recent conversations · up to 50":"Account access required",href:"/inbox",icon:"chat" as const},
    {label:"Rental bookings",value:count(bookings.kind,bookings.items.length,50),note:bookings.kind==="ready"?"Recent bookings · up to 50":"Account access required",href:"/rentals",icon:"calendar" as const},
  ];
  const recent=[...listings.items.map(item=>({id:item.id,title:item.title,status:item.status,href:"/listing/"+item.id,created:item.created_at,mode:"Sale"})),...rentals.items.map(item=>({id:item.id,title:item.title,status:item.status,href:"/rent/"+item.id,created:item.created_at,mode:"Rental"}))].sort((a,b)=>b.created.localeCompare(a.created)).slice(0,5);
  return <div className="ul-dashboard ux-shell">
    <div className="ul-page-heading"><div><p>Workspace</p><h1>Overview</h1><span>Manage your listings, discover items and follow your exchanges.</span></div><div className="ul-heading-actions"><Link className="ul-secondary-action" href="/rent/post">Rent out an item</Link><Link className="ul-primary-action" href="/post"><ExperienceIcon name="plus" size={16}/>Create listing</Link></div></div>
    <section className="ul-metrics" aria-label="Your activity summary">{metrics.map(metric=><Card render={<Link href={metric.href}/>} className="ul-metric" key={metric.label}><span className="ul-metric-label">{metric.label}<ExperienceIcon name={metric.icon} size={17}/></span><strong className="ul-metric-value">{metric.value}</strong><small>{metric.note}</small></Card>)}</section>
    {listings.kind!=="ready"&&<div className="ul-access-notice"><span className="ul-status-dot"/><div><strong>{listings.kind==="error"?"Your activity is temporarily unavailable":listings.kind==="not_eligible"?"Marketplace access is pending":"Connect to your personal marketplace"}</strong><p>{listings.kind==="unconfigured"?"Account services are being set up. Your dashboard will show real activity when access is available.":listings.kind==="error"?"Please try again shortly. Your existing items are kept safely in your account.":"Sign in with approved access to see your listings, messages and rental activity."}</p></div><Link href="/account">View account <ExperienceIcon name="arrow" size={16}/></Link></div>}
    <section className="ul-discover ul-panel" aria-labelledby="ul-discover-title"><div className="ul-panel-heading"><div><h2 id="ul-discover-title">Find your next thing</h2><p>Buy for the everyday. Borrow for the occasion.</p></div></div><ExperienceSearch/><nav className="ul-category-chips" aria-label="Browse marketplace categories">{categories.map(c=><Link href={exploreHref("buy",c.slug)} key={c.slug}><CategoryIcon name={c.symbol}/>{c.label}</Link>)}</nav></section>
    <div className="ul-dashboard-columns">
      <MarketplacePanel buy={<ListingResults mode="buy" result={buyResult}/>} rent={<RentalResults result={rentResult}/>}/>
      <div className="ul-dashboard-aside">
        <section className="ul-panel" aria-labelledby="ul-recent-title"><div className="ul-panel-heading"><h2 id="ul-recent-title">Your recent listings</h2><Link href="/my/listings">View all <span aria-hidden="true">↗</span></Link></div>{recent.length?<div className="ul-recent-list">{recent.map(item=><Link href={item.href} key={item.mode+item.id}><span className="ul-row-icon"><ExperienceIcon name="grid" size={16}/></span><span><strong>{item.title}</strong><small>{item.mode} · {item.status.replaceAll("_"," ")}</small></span><ExperienceIcon name="arrow" size={14}/></Link>)}</div>:<div className="ul-small-empty"><span className="ul-row-icon"><ExperienceIcon name="grid" size={20}/></span><strong>{listings.kind==="ready"&&rentals.kind==="ready"?"No listings yet":"Your listings belong here"}</strong><p>{listings.kind==="ready"&&rentals.kind==="ready"?"Create a listing to give something useful its next chapter.":"Once your account is ready, your real listings will appear here."}</p><Link href={listings.kind==="ready"?"/post":"/account"}>{listings.kind==="ready"?"Create a listing":"Open your account"}<ExperienceIcon name="arrow" size={15}/></Link></div>}</section>
        <section className="ul-panel ul-shortcuts" aria-labelledby="ul-shortcuts-title"><div className="ul-panel-heading"><h2 id="ul-shortcuts-title">Quick access</h2></div>{[{title:"Messages & offers",description:"Discuss an item or continue an exchange",href:"/inbox",icon:"chat" as const},{title:"Saved finds",description:"Come back to the things you liked",href:"/saved",icon:"heart" as const},{title:"Rental activity",description:"Requests, handovers and returns",href:"/rentals",icon:"calendar" as const}].map(item=><Link key={item.href} href={item.href}><span className="ul-row-icon"><ExperienceIcon name={item.icon} size={17}/></span><span><strong>{item.title}</strong><small>{item.description}</small></span><ExperienceIcon name="arrow" size={14}/></Link>)}</section>
        <section className="ul-safety-note"><ExperienceIcon name="shield" size={19}/><div><strong>A safer exchange starts here.</strong><p>Check the item, agree on the details and arrange a safe handover.</p><Link href="/safety">Read the exchange guide <span aria-hidden="true">↗</span></Link></div></section>
      </div>
    </div>
  </div>;
}
