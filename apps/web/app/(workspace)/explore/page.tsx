import {Button} from "@/components/spaceui/button";
import {Input} from "@/components/spaceui/input";
import {CategoryFilterDialog} from "@/components/experience/category-filter-dialog";
import type {Metadata} from "next";
import Link from "next/link";
import {CategoryIcon} from "@/components/category-icon";
import {ListingResults} from "@/components/listing-results";
import {RentalResults} from "@/components/rental-results";
import {ExperienceIcon} from "@/components/experience/experience-header";
import {categories,cleanSearchQuery,parseCategory,parseMarketMode} from "@/lib/catalog";
import {discoverListings} from "@/lib/listings/data";
import {discoverRentals} from "@/lib/rentals/data";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Explore the marketplace",robots:{index:false}};
function hrefFor(mode:"buy"|"rent",q:string,category?:string|null){
  const p=new URLSearchParams({mode});
  if(q)p.set("q",q);
  if(category)p.set("category",category);
  return "/explore?"+p.toString();
}

export default async function ExplorePage({searchParams}:{
  searchParams:Promise<{mode?:string;q?:string;category?:string}>
}){
  const raw=await searchParams;
  const mode=parseMarketMode(raw.mode),q=cleanSearchQuery(raw.q);
  const category=parseCategory(raw.category);
  const chosen=categories.find(c=>c.slug===category);
  const result=mode==="buy"
    ?await discoverListings({category,search:q,limit:24})
    :await discoverRentals({category,search:q,limit:24});
  const number=result.items.length;
  return <div className="ux-explore">
    <section className="ux-explore-hero">
      <div className="ux-shell">
        <nav aria-label="Breadcrumb" className="ux-breadcrumb"><Link href="/dashboard">Home</Link><span>›</span> Explore</nav>
        <p className="ux-kicker">FIND YOUR KIND OF THING</p>
        <h1>Explore the marketplace</h1>
        <p>Find what you need. Explore things worth keeping in the loop.</p>
        <form className="ux-explore-search" action="/explore" role="search">
          <ExperienceIcon name="search" size={20}/>
          <label htmlFor="ux-explore-input" className="ux-visually-hidden">Search the marketplace</label>
          <Input nativeInput unstyled id="ux-explore-input" type="search" name="q" maxLength={100}
            defaultValue={q} placeholder="Search for something useful..."/>
          <input name="mode" type="hidden" value={mode}/>
          {category&&<input name="category" type="hidden" value={category}/>}
          <Button type="submit">Search <ExperienceIcon name="arrow" size={16}/></Button>
        </form>
      </div>
    </section>
    <section className="ux-shell ux-explore-body">
      <div className="ux-explore-bar">
        <div className="ux-explore-switch" aria-label="Marketplace mode">
          <Link href={hrefFor("buy",q,category)} aria-current={mode==="buy"?"page":undefined}
            className={mode==="buy"?"ux-explore-switch-active":""}>Buy</Link>
          <Link href={hrefFor("rent",q,category)} aria-current={mode==="rent"?"page":undefined}
            className={mode==="rent"?"ux-explore-switch-active":""}>Rent</Link>
        </div>
        <div className="ux-explore-meta">
          {result.kind==="ready"?<span>{number} visible {number===1?"item":"items"}</span>:
            <span>Browse requires account access</span>}
          <CategoryFilterDialog options={[
            {label:"All categories",href:hrefFor(mode,q),active:!category},
            ...categories.map(c=>({label:c.label,href:hrefFor(mode,q,c.slug),active:c.slug===category})),
          ]}/>

        </div>
      </div>
      <div className="ux-explore-columns">
        <aside className="ux-filter-sidebar" aria-labelledby="ux-category-filter-heading">
          <div className="ux-filter-heading"><h2 id="ux-category-filter-heading">Categories</h2>
            {category&&<Link href={hrefFor(mode,q)}>Clear</Link>}</div>
          <nav aria-label="Browse categories" className="ux-filter-list">
            <Link href={hrefFor(mode,q)} aria-current={!category?"page":undefined}
              className={!category?"ux-filter-current":""}>
              <ExperienceIcon name="grid" size={17}/> All categories
            </Link>
            {categories.map(c=><Link key={c.slug} href={hrefFor(mode,q,c.slug)}
              aria-current={c.slug===category?"page":undefined}
              className={c.slug===category?"ux-filter-current":""}>
              <CategoryIcon name={c.symbol}/>{c.label}
            </Link>)}
          </nav>
          <div className="ux-filter-help">
            <ExperienceIcon name="shield" size={20}/>
            <strong>Better exchanges start with care.</strong>
            <p>Always inspect items and agree on handover details directly.</p>
          </div>
        </aside>
        <div className="ux-explore-main">
          <div className="ux-explore-results-header">
            <div><p className="ux-kicker">{mode==="buy"?"BUY SOMETHING GREAT":"BORROW WHAT YOU NEED"}</p>
              <h2>{chosen?chosen.label:mode==="buy"?"Discover everything":"Find a rental"}</h2>
              {q&&<p className="ux-active-query">Showing matches for <strong>“{q}”</strong></p>}
            </div>
            {(q||category)&&<Link href={hrefFor(mode,"")} className="ux-clear-all">Clear all filters ×</Link>}
          </div>
          <div className="ux-results-panel">
            {mode==="buy"?
              <ListingResults mode="buy" result={result as Awaited<ReturnType<typeof discoverListings>>} search={q}/>:
              <RentalResults result={result as Awaited<ReturnType<typeof discoverRentals>>}/>}
          </div>
        </div>
      </div>
    </section>
  </div>;
}
