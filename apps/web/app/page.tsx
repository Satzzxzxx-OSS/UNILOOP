import Link from "next/link";
import { CategoryGrid } from "@/components/category-grid";
import { ListingResults } from "@/components/listing-results";
import { discoverListings } from "@/lib/listings/data";

export default async function HomePage() {
  const result = await discoverListings({ limit: 6 });
  return (
    <>
      <section className="hero-section">
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="eyebrow hero-eyebrow"><span className="eyebrow-dot" /> THE EVERYDAY MARKETPLACE</span>
            <h1>Good things deserve <span className="accent-swoosh">another loop.</span></h1>
            <p className="hero-description">
              Find what you need, sell what you no longer use, and rent the things you only need for a little while.
            </p>
            <form action="/explore" method="get" role="search" className="hero-search">
              <label htmlFor="home-search" className="sr-only">Search items</label>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8"/>
                <path d="m15.5 15.5 5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
              </svg>
              <input id="home-search" name="q" type="search" maxLength={100} placeholder="Search books, devices, cycles and more" />
              <button className="button button-accent" type="submit">Search <span aria-hidden="true">↗</span></button>
            </form>
            <div className="hero-shortcuts">
              <span>Get started:</span>
              <Link href="/explore?mode=buy">Explore to buy <span aria-hidden="true">↗</span></Link>
              <Link href="/explore?mode=rent">Explore to rent <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
          <div className="hero-visual" aria-hidden="true">
            <div className="hero-aura" />
            <div className="hero-ring ring-outer" />
            <div className="hero-ring ring-inner" />
            <div className="hero-center-mark">
              <span className="center-spark">✳</span>
              <span>THE LOOP</span>
            </div>
            <div className="floating-card float-first">
              <span className="floating-icon">↗</span>
              <span><strong>Discover</strong><small>Find your next favourite</small></span>
            </div>
            <div className="floating-card float-second">
              <span className="floating-icon soft">✦</span>
              <span><strong>Reuse</strong><small>Give good things more life</small></span>
            </div>
            <div className="floating-note">BUY <span>·</span> SELL <span>·</span> RENT</div>
          </div>
        </div>
      </section>

      <section className="value-strip">
        <div className="container value-strip-inner">
          <span><b>01</b> Find something useful</span>
          <span className="value-separator" aria-hidden="true" />
          <span><b>02</b> Connect directly</span>
          <span className="value-separator" aria-hidden="true" />
          <span><b>03</b> Keep things moving</span>
        </div>
      </section>

      <section id="categories" className="section container">
        <div className="section-heading">
          <div><p className="eyebrow">EXPLORE YOUR WAY</p><h2>Something for every need.</h2><p>Start with what you are looking for.</p></div>
          <Link className="text-link" href="/explore">Explore all <span aria-hidden="true">↗</span></Link>
        </div>
        <CategoryGrid />
      </section>

      <section className="section section-feed">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow">JUST AROUND THE CORNER</p><h2>Fresh finds</h2><p>A place for real products from real people.</p></div>
            <Link className="text-link" href="/explore?mode=buy">Browse marketplace <span aria-hidden="true">↗</span></Link>
          </div>
          <ListingResults mode="buy" result={result} />
        </div>
      </section>

      <section id="how-it-works" className="section container how-section">
        <div className="section-heading">
          <div><p className="eyebrow">THE IDEA IS SIMPLE</p><h2>Make the most of what already exists.</h2></div>
        </div>
        <div className="steps-grid">
          <article className="step-card"><span className="step-number">01 / DISCOVER</span><h3>Explore</h3><p>Look for useful items with clear details, categories and prices.</p></article>
          <article className="step-card"><span className="step-number">02 / CONNECT</span><h3>Start a conversation</h3><p>Once messaging launches, reach out to arrange a trade or rental request.</p></article>
          <article className="step-card"><span className="step-number">03 / KEEP IT MOVING</span><h3>Pass it along</h3><p>Sell an item, find its next owner or make it available for rent.</p></article>
        </div>
      </section>

      <section className="cta-section">
        <div className="container cta-inner">
          <div><p className="eyebrow">A BETTER SECOND CHAPTER</p><h2>Have something worth sharing?</h2><p>Start with a draft, and review your listing before it goes live.</p></div>
          <Link href="/post" className="button button-accent">Start a listing <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </>
  );
}
