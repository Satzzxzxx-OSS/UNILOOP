import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Post an item" };

export default function PostPage() {
  return (
    <div className="container quiet-page">
      <span className="quiet-mark" aria-hidden="true">＋</span>
      <p className="eyebrow">LISTING TOOLS</p>
      <h1>Posting is on its way.</h1>
      <p>
        The sell and rent-out flows are still being developed. Publishing is
        unavailable until real accounts, secure image storage, and listings are connected.
        No item has been submitted from this page.
      </p>
      <Link href="/explore" className="button button-dark">Explore instead <span aria-hidden="true">↗</span></Link>
    </div>
  );
}
