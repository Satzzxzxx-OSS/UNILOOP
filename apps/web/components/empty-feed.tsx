import Link from "next/link";
import type { MarketMode } from "@/lib/catalog";

export function EmptyFeed({
  mode,
  search,
}: {
  mode: MarketMode;
  search?: string;
}) {
  return (
    <div className="empty-state" role="status">
      <div className="empty-art" aria-hidden="true">
        <span className="empty-orbit one" />
        <span className="empty-orbit two" />
        <span className="empty-center">✦</span>
      </div>
      <p className="eyebrow">DISCOVERY</p>
      <h3>{search ? "Nothing to show for this search yet" : "Fresh finds will appear here"}</h3>
      <p>
        {search
          ? "There are no live items matching your request. Try a different search or browse a category."
          : mode === "rent"
            ? "Rental listings will appear here once the booking system is ready and real items are published."
            : "Items will appear here once real listings are published. We never fill the feed with made-up products."}
      </p>
      <Link href="/explore" className="text-link">Browse all categories <span aria-hidden="true">→</span></Link>
    </div>
  );
}
