"use client";

import {Button} from "@/components/spaceui/button";
import {Input} from "@/components/spaceui/input";
import {Textarea} from "@/components/spaceui/textarea";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import {
  openConversation, sendMessage, submitOffer, decideOffer, changeBlock,
} from "@/lib/interactions/actions";
import { initialInteractionState } from "@/lib/interactions/validation";

export function StartSaleConversation({ listingId }: { listingId: string }) {
  const [state, action, pending] = useActionState(openConversation, initialInteractionState);
  return <form action={action} className="interaction-action">
    <input type="hidden" name="listing" value={listingId} />
    <Button className="button button-dark" type="submit" disabled={pending}>
      {pending ? "Opening…" : "Chat with seller"}
    </Button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function ConversationRefresh() {
  const router = useRouter();
  return <Button type="button" className="text-link refresh-conversation"
    onClick={() => router.refresh()}>Refresh messages ↻</Button>;
}

export function SendSaleMessage({ conversationId, nonce }: {
  conversationId: string; nonce: string;
}) {
  const [state, action, pending] = useActionState(sendMessage, initialInteractionState);
  return <form action={action} className="message-compose">
    <input type="hidden" name="conversation" value={conversationId} />
    <input type="hidden" name="nonce" value={nonce} />
    <label htmlFor="compose-body">Your message</label>
    <Textarea unstyled id="compose-body" name="body" maxLength={2000} minLength={1}
      rows={3} placeholder="Ask a question about this item…" required disabled={pending} />
    <Button type="submit" className="button button-dark" disabled={pending}>
      {pending ? "Sending…" : "Send message"}
    </Button>
    <p role="status" aria-live="polite" className="interaction-feedback">{state.message}</p>
  </form>;
}

export function SaleOfferForm({
  conversationId, parentOfferId, nonce,
}: {
  conversationId: string; parentOfferId?: string | null; nonce: string;
}) {
  const [state, action, pending] = useActionState(submitOffer, initialInteractionState);
  return <form action={action} className="offer-compose">
    <input type="hidden" name="conversation" value={conversationId} />
    <input type="hidden" name="nonce" value={nonce} />
    <input type="hidden" name="parent_offer" value={parentOfferId ?? ""} />
    <label htmlFor={"offer-price-" + nonce}>{parentOfferId ? "Your counter-offer (₹)" : "Your offer (₹)"}</label>
    <div className="offer-form-row">
      <Input nativeInput unstyled id={"offer-price-" + nonce} type="number" name="amount" min={1}
        max={10000000} step={1} required inputMode="numeric" disabled={pending}
        placeholder="Amount in rupees"/>
      <Button type="submit" className="button button-dark" disabled={pending}>
        {pending ? "Submitting…" : parentOfferId ? "Counter" : "Submit offer"}
      </Button>
    </div>
    <p role="status" aria-live="polite" className="interaction-feedback">{state.message}</p>
  </form>;
}

export function SaleOfferDecision({
  conversationId, offerId, decision,
}: {
  conversationId: string; offerId: string; decision: "accept"|"reject"|"withdraw";
}) {
  const [state, action, pending] = useActionState(decideOffer, initialInteractionState);
  return <form action={action} className="decision-form">
    <input type="hidden" name="conversation" value={conversationId} />
    <input type="hidden" name="offer" value={offerId} />
    <input type="hidden" name="decision" value={decision} />
    <Button className={decision === "accept" ? "button button-dark" : "button button-outline"}
      type="submit" disabled={pending}>
      {pending ? "Updating…" : decision === "accept" ? "Accept offer" :
        decision === "reject" ? "Reject" : "Withdraw"}
    </Button>
    <p role="status" aria-live="polite" className="interaction-feedback">{state.message}</p>
  </form>;
}

export function ConversationBlockForm({
  conversationId, otherId, blocked,
}: {
  conversationId: string; otherId: string; blocked: boolean;
}) {
  const [state, action, pending] = useActionState(changeBlock, initialInteractionState);
  return <form action={action} className="block-form">
    <input type="hidden" name="conversation" value={conversationId} />
    <input type="hidden" name="other" value={otherId} />
    <input type="hidden" name="action" value={blocked ? "unblock" : "block"} />
    <Button type="submit" className="text-link" disabled={pending}>
      {blocked ? "Unblock user" : "Block user"}
    </Button>
    <p role="status" aria-live="polite" className="interaction-feedback">{state.message}</p>
  </form>;
}
