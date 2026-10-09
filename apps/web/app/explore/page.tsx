import type { Metadata } from "next";
import Link from "next/link";
import { CategoryGrid } from "@/components/category-grid";
import { EmptyFeed } from "@/components/empty-feed";
import { categories, cleanSearchQuery, exploreHref, parseCategory, parseMarketMode } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Explore",
  description: "Explore items available to buy or rent.",
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function ExplorePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const mode = parseMarketMode(params.mode);
  const category = parseCategory(params.category);
  const query = cleanSearchQuery(params.q);
  const selectedCategory = categories.find((item) => item.slug === category);

  return (
    <div className="container explore-layout">
      <div className="page-heading">
        <p className="eyebrow">EXPLORE UNILOOP</p>
        <h1>Find your next great thing.</h1>
        <p>Browse useful items, whether you want to own them or borrow them for a while.</p>
      </div>
      <div className="market-tabs" role="group" aria-label="Marketplace mode">
        <Link href={exploreHref("buy", category)} className={mode === "buy" ? "market-tab active" : "market-tab"} aria-current={mode === "buy" ? "page" : undefined}>Buy items</Link>
        <Link href={exploreHref("rent", category)} className={mode === "rent" ? "market-tab active" : "market-tab"} aria-current={mode === "rent" ? "page" : undefined}>Rent items</Link>
      </div>
      <form role="search" action="/explore" method="get" className="explore-search">
        <label htmlFor="explore-query">Search listings</label>
        <div className="explore-search-line">
          <input id="explore-query" name="q" type="search" maxLength={100} defaultValue={query} placeholder="What do you need?" />
          <input type="hidden" name="mode" value={mode} />
          {category && <input type="hidden" name="category" value={category} />}
          <button className="button button-dark" type="submit">Search</button>
        </div>
      </form>
      <div className="explore-context">
        <div><p className="eyebrow">BROWSE BY CATEGORY</p><h2>{selectedCategory ? selectedCategory.label : mode === "rent" ? "Available for rent" : "Everything to explore"}</h2></div>
        {category && <Link className="text-link" href={exploreHref(mode)}>Clear category ×</Link>}
      </div>
      <CategoryGrid mode={mode} />
      <section className="explore-results" aria-labelledby="results-heading">
        <div className="result-heading"><h2 id="results-heading">Listings</h2><span className="result-status">No live items yet</span></div>
        <EmptyFeed mode={mode} search={query} />
      </section>
    </div>
  );
}
