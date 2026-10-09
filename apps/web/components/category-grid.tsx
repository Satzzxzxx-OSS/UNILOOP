import Link from "next/link";
import { CategoryIcon } from "@/components/category-icon";
import { categories, type MarketMode, exploreHref } from "@/lib/catalog";

export function CategoryGrid({ mode = "buy" }: { mode?: MarketMode }) {
  return (
    <div className="category-grid">
      {categories.map((category, index) => (
        <Link key={category.slug} href={exploreHref(mode, category.slug)} className="category-tile">
          <span className={"category-visual visual-" + (index % 4)} aria-hidden="true">
            <CategoryIcon name={category.symbol} />
          </span>
          <span>{category.label}</span>
          <span className="category-chevron" aria-hidden="true">↗</span>
        </Link>
      ))}
    </div>
  );
}
