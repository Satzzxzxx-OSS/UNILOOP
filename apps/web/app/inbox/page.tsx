import type { Metadata } from "next";
import Link from "next/link";
import { getSaleInbox } from "@/lib/interactions/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Messages", robots: { index: false } };

export default async function InboxPage() {
  const results = await getSaleInbox();
  return <div className="container conversation-page">
    <p className="eyebrow">YOUR CONVERSATIONS</p>
    <h1>Messages</h1>
    <p className="conversation-intro">Questions, price discussions and conversations about your items.</p>
    {results.kind !== "ready" ?
      <section className="feed-notice">
        <h2>Messages unavailable</h2>
        <p>{results.kind === "login" ? "Sign in to check your messages." :
          results.kind === "not_eligible" ? "Your account does not currently have marketplace access." :
          "Conversations aren't available right now."}</p>
        <Link className="button button-dark" href="/account">Go to account</Link>
      </section> :
      results.conversations.length ?
        <div className="thread-list">{results.conversations.map(thread =>
          <Link href={"/inbox/" + thread.id} className="thread-link" key={thread.id}>
            <span className="thread-indicator" aria-hidden="true">◌</span>
            <span><strong>{thread.title}</strong><small>Private sale conversation</small></span>
            <span className="thread-arrow" aria-hidden="true">→</span>
          </Link>
        )}</div> :
        <section className="feed-notice"><h2>No conversations yet</h2>
          <p>When you connect with someone about an active item, the conversation will appear here.</p>
          <Link className="button button-dark" href="/explore?mode=buy">Browse listings</Link>
        </section>}
  </div>;
}
