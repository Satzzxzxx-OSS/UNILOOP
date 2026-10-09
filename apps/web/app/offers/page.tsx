import type { Metadata } from "next";
import Link from "next/link";
import { getSaleOfferInbox } from "@/lib/interactions/data";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Offers", robots: { index: false } };

export default async function OffersPage() {
  const inbox = await getSaleOfferInbox();
  return <div className="container conversation-page">
    <p className="eyebrow">PRICE NEGOTIATION</p>
    <h1>Offers</h1>
    <p className="conversation-intro">Purchase discussions and seller counter-offers are organized by conversation.</p>
    {inbox.kind === "ready" && inbox.conversations.length ?
      <div className="thread-list">{inbox.conversations.map(conversation =>
        <Link key={conversation.id} className="thread-link" href={"/inbox/" + conversation.id}>
          <span className="thread-indicator" aria-hidden="true">₹</span>
          <span><strong>{conversation.title}</strong><small>View offers and messages</small></span>
          <span className="thread-arrow" aria-hidden="true">→</span>
        </Link>
      )}</div> :
      <section className="feed-notice"><h2>No available negotiations</h2>
        <p>Approved accounts can view price discussions from their sale conversations.</p>
        <Link className="button button-dark" href="/inbox">Go to messages</Link>
      </section>}
  </div>;
}
