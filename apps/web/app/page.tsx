import Link from "next/link";
import {categories,exploreHref} from "@/lib/catalog";
import {CategoryIcon} from "@/components/category-icon";
import {ListingResults} from "@/components/listing-results";
import {RentalResults} from "@/components/rental-results";
import {discoverListings} from "@/lib/listings/data";
import {discoverRentals} from "@/lib/rentals/data";
import {ExperienceIcon} from "@/components/experience/experience-header";
import {ExperienceSearch} from "@/components/experience/experience-search";

export const dynamic="force-dynamic";

export default async function HomePage(){
  const [buyResult,rentResult]=await Promise.all([
    discoverListings({limit:8}),discoverRentals({limit:8}),
  ]);
  return <>
    <section className="ux-hero" aria-labelledby="ux-hero-title">
      <div className="ux-shell ux-hero-grid">
        <div className="ux-hero-copy">
          <p className="ux-eyebrow"><span className="ux-dot"/>A SMARTER WAY TO SHARE WHAT EXISTS</p>
          <h1 id="ux-hero-title">Everything you need. <em>Nothing you don&apos;t.</em></h1>
          <p className="ux-hero-lede">Buy better. Sell effortlessly. Borrow for the moments that matter.
            One beautiful place to keep good things moving.</p>
          <ExperienceSearch/>
          <div className="ux-hero-assurance">
            <span><ExperienceIcon name="shield" size={18}/> Designed for thoughtful local exchanges</span>
          </div>
        </div>
        <div className="ux-hero-art" aria-label="Abstract illustration of useful things moving in a loop" role="img">
          <span className="ux-art-halo ux-art-halo-outer"/><span className="ux-art-halo ux-art-halo-inner"/>
          <div className="ux-art-orbit"/>
          <div className="ux-art-arc ux-art-arc-top"/>
          <div className="ux-art-arc ux-art-arc-bottom"/>
          <div className="ux-art-object ux-art-notebook">
            <span className="ux-art-book-spine"/><span className="ux-art-book-line"/>
            <span className="ux-art-book-line ux-line-small"/><span className="ux-art-book-mark">01</span>
          </div>
          <div className="ux-art-object ux-art-headphones">
            <span className="ux-art-headset-band"/><span className="ux-art-ear ux-art-ear-left"/>
            <span className="ux-art-ear ux-art-ear-right"/>
          </div>
          <div className="ux-art-object ux-art-camera">
            <span className="ux-art-lens"/><span className="ux-art-camera-dot"/>
          </div>
          <div className="ux-art-core"><span>U</span><small>the loop</small></div>
          <span className="ux-art-caption ux-art-caption-one"><b>REUSE</b><small>More stories ahead</small></span>
          <span className="ux-art-caption ux-art-caption-two"><b>DISCOVER</b><small>Find your next thing</small></span>
          <span className="ux-art-signature">BUY / SELL / RENT / REPEAT</span>
        </div>
      </div>
      <div className="ux-hero-bottom" aria-hidden="true"><div className="ux-shell"><span>MADE FOR WHAT&apos;S NEXT</span><span>↓ SCROLL TO DISCOVER</span></div></div>
    </section>

    <section id="categories" className="ux-section ux-shell ux-categories-section">
      <div className="ux-section-heading">
        <div><p className="ux-kicker">DISCOVER YOUR THING</p>
          <h2>Whatever you&apos;re looking for, <em>start here.</em></h2>
          <p>Thoughtful categories for the things you actually use.</p></div>
        <Link href="/explore?mode=buy" className="ux-text-arrow">Explore all <ExperienceIcon name="arrow" size={18}/></Link>
      </div>
      <div className="ux-category-grid">
        {categories.map((c,index)=><Link key={c.slug}
          href={exploreHref("buy",c.slug)} className={"ux-category ux-category-"+(index+1)}>
          <span className="ux-category-icon" aria-hidden="true"><CategoryIcon name={c.symbol}/></span>
          <span className="ux-category-bottom">
            <strong>{c.label}</strong><span className="ux-category-round" aria-hidden="true"><ExperienceIcon name="arrow" size={19}/></span>
          </span>
          <span className="ux-category-shape ux-category-shape-first"/><span className="ux-category-shape ux-category-shape-second"/>
        </Link>)}
      </div>
    </section>

    <section className="ux-section ux-shell ux-dual-section">
      <div className="ux-section-heading">
        <div><p className="ux-kicker">ONE PLACE, MANY POSSIBILITIES</p>
          <h2>Make it yours. <em>Or just borrow it.</em></h2></div>
      </div>
      <div className="ux-dual-grid">
        <article className="ux-mode-card ux-mode-buy">
          <p className="ux-mode-number">01 / BUY & SELL</p>
          <span className="ux-mode-art ux-mode-art-buy" aria-hidden="true"><span/><span/><span/></span>
          <h3>New to you.<br/>Just right for you.</h3>
          <p>Find quality pre-loved things, or give yours a brilliant second chapter.</p>
          <Link href="/explore?mode=buy" className="ux-card-action">Explore to buy <ExperienceIcon name="arrow" size={19}/></Link>
        </article>
        <article className="ux-mode-card ux-mode-rent">
          <p className="ux-mode-number">02 / RENT & LEND</p>
          <span className="ux-mode-art ux-mode-art-rent" aria-hidden="true"><span/><span/><span/></span>
          <h3>Need it for now?<br/>Not forever?</h3>
          <p>Borrow the useful things you need, when you need them. Lend what you already own.</p>
          <Link href="/explore?mode=rent" className="ux-card-action">Explore to rent <ExperienceIcon name="arrow" size={19}/></Link>
        </article>
      </div>
    </section>

    <section className="ux-section ux-feed-section ux-buy-feed">
      <div className="ux-shell">
        <div className="ux-section-heading">
          <div><p className="ux-kicker">THE LATEST IN THE LOOP</p>
            <h2>Good finds, <em>new stories.</em></h2>
            <p>Real listings from real people. No manufactured inventory.</p></div>
          <Link className="ux-text-arrow" href="/explore?mode=buy">Browse all <ExperienceIcon name="arrow" size={18}/></Link>
        </div>
        <div className="ux-feed-content"><ListingResults mode="buy" result={buyResult}/></div>
      </div>
    </section>

    <section className="ux-section ux-shell ux-rental-feed">
      <div className="ux-section-heading">
        <div><p className="ux-kicker">BORROW SMARTER</p>
          <h2>More useful days. <em>Less stuff to store.</em></h2>
          <p>Rent the things you need without adding to your shelves.</p></div>
        <Link className="ux-text-arrow" href="/explore?mode=rent">Explore rentals <ExperienceIcon name="arrow" size={18}/></Link>
      </div>
      <div className="ux-feed-content"><RentalResults result={rentResult}/></div>
    </section>

    <section id="how-it-works" className="ux-section ux-how-section">
      <div className="ux-shell">
        <div className="ux-section-heading">
          <div><p className="ux-kicker">SIMPLE BY DESIGN</p>
            <h2>Three steps. <em>Endless possibilities.</em></h2>
            <p>Find it, connect, and keep the good things moving.</p></div>
        </div>
        <div className="ux-how-grid">
          {[
            {step:"01",title:"Find your next thing",info:"Explore categories, search for something specific and compare real listings.",symbol:"◎"},
            {step:"02",title:"Talk things through",info:"Ask questions, discuss an offer or request rental dates when messaging is enabled.",symbol:"↗"},
            {step:"03",title:"Make the exchange",info:"Arrange a safe handover. Buy, sell or borrow on your terms.",symbol:"↻"},
          ].map(c=><article key={c.step} className="ux-how-card">
            <span className="ux-how-step">{c.step}</span><span className="ux-how-symbol" aria-hidden="true">{c.symbol}</span>
            <h3>{c.title}</h3><p>{c.info}</p>
          </article>)}
        </div>
      </div>
    </section>

    <section className="ux-section ux-last-section ux-shell">
      <div className="ux-last-panel">
        <div><p className="ux-kicker">YOUR NEXT CHAPTER STARTS HERE</p>
          <h2>Something sitting unused? <em>Give it a new life.</em></h2>
          <p>When your account is ready, create a listing to sell or lend.</p></div>
        <div className="ux-last-actions">
          <Link href="/post" className="ux-last-primary">Sell an item <ExperienceIcon name="arrow" size={18}/></Link>
          <Link href="/rent/post" className="ux-last-secondary">Rent out an item <ExperienceIcon name="arrow" size={18}/></Link>
        </div>
      </div>
    </section>
  </>;
}
