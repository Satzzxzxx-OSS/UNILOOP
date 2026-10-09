import type { Metadata } from "next";
import { randomUUID } from "node:crypto";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSaleThread } from "@/lib/interactions/data";
import {
  ConversationRefresh, SendSaleMessage, SaleOfferForm,
  SaleOfferDecision, ConversationBlockForm,
} from "@/components/sale-interaction-forms";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Private conversation", robots: { index: false } };

const money = (n: number) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0,
}).format(n);

export default async function ConversationPage({ params }: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getSaleThread(id);
  if (!result) notFound();
  const { thread, myId, otherId, messages, offers, listing, iBlockedOther } = result;
  const enabled = process.env.ENABLE_MARKETPLACE_INTERACTIONS === "true";
  const pendingOffer = offers.find(o => o.status === "pending");
  const acceptedOffer = offers.find(o => o.status === "accepted");
  const showOffers = enabled && !iBlockedOther && listing?.status === "active";

  return <div className="container conversation-page">
    <Link href="/inbox" className="text-link">← All conversations</Link>
    <div className="conversation-heading">
      <div>
        <p className="eyebrow">PRIVATE SALE CONVERSATION</p>
        <h1>{listing?.title ?? "Item conversation"}</h1>
        <p className="conversation-intro">
          {listing ? "Asking price: " + money(listing.price_inr) + " · " + listing.status :
            "This item is no longer available in discovery."}
        </p>
      </div>
      <ConversationRefresh />
    </div>
    <div className="conversation-layout">
      <section className="conversation-pane" aria-label="Messages">
        <h2>Conversation</h2>
        <div className="message-history">
          {messages.length ? messages.map(message =>
            <div key={message.id} className={message.sender_id === myId ?
              "message-bubble mine" : "message-bubble theirs"}>
              <span className="message-sender">{message.sender_id === myId ? "You" : "Other participant"}</span>
              <p>{message.message_body}</p>
              <time dateTime={message.created_at}>
                {new Date(message.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Kolkata",
                })}
              </time>
            </div>
          ) : <p className="conversation-empty">No messages yet. Start with a question about the item.</p>}
        </div>
        {enabled && !iBlockedOther ?
          <SendSaleMessage conversationId={thread.id} nonce={randomUUID()} /> :
          <p className="interaction-notice">Messaging is currently unavailable for this conversation.</p>}
        <p className="interaction-note">Messages are saved securely. Use Refresh to check replies; live updates are not enabled yet.</p>
      </section>
      <aside className="negotiation-pane" aria-label="Offers and contact controls">
        <h2>Price offers</h2>
        <p className="interaction-note">An accepted offer is an agreement to discuss a trade, not proof of payment or completion.</p>
        <div className="offer-history">
          {offers.length ? offers.map(offer =>
            <div className="offer-card" key={offer.id}>
              <span className="offer-tag">{offer.proposer_id === myId ? "You proposed" : "Other participant proposed"}</span>
              <strong>{money(offer.amount_inr)}</strong>
              <span className={"offer-state status-" + offer.status}>{offer.status}</span>
            </div>
          ) : <p className="conversation-empty">No offers yet.</p>}
        </div>
        {showOffers && !acceptedOffer && (pendingOffer ?
          pendingOffer.recipient_id === myId ?
            <div className="offer-controls">
              <SaleOfferDecision conversationId={thread.id} offerId={pendingOffer.id} decision="accept" />
              <SaleOfferDecision conversationId={thread.id} offerId={pendingOffer.id} decision="reject" />
              <SaleOfferForm conversationId={thread.id} parentOfferId={pendingOffer.id}
                nonce={randomUUID()} />
            </div> :
            <div className="offer-controls">
              <p className="interaction-note">Waiting for the other participant to respond.</p>
              <SaleOfferDecision conversationId={thread.id} offerId={pendingOffer.id} decision="withdraw" />
            </div> :
          myId === thread.buyer_id ?
            <SaleOfferForm conversationId={thread.id} nonce={randomUUID()} /> :
            <p className="interaction-note">Waiting for the buyer to submit an offer.</p>
        )}
        {acceptedOffer && <p className="interaction-notice">Offer accepted. Arrange a safe handover separately.</p>}
        <div className="conversation-safety">
          <h3>Stay safe</h3>
          <p>Inspect the item first. Never share passwords, OTPs or sensitive payment information in messages.</p>
          {enabled && <ConversationBlockForm conversationId={thread.id}
            otherId={otherId} blocked={iBlockedOther} />}
          {iBlockedOther && <p>You have blocked this participant. Sending is paused.</p>}
        </div>
      </aside>
    </div>
  </div>;
}
