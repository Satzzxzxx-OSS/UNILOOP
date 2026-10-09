"use client";

import { useActionState } from "react";
import { changeListingStatus, type ActionState } from "@/lib/listings/actions";
import type { ListingStatus } from "@/lib/listings/validation";

const initialState: ActionState = { message: "" };

export function ListingStatusForm({
  id, current,
}: { id: string; current: ListingStatus }) {
  const [state, action, pending] = useActionState(changeListingStatus, initialState);
  const targets = current === "draft" ? [
    ["active", "Publish"], ["removed", "Remove draft"],
  ] : current === "active" ? [
    ["paused", "Pause"], ["sold", "Mark sold"], ["removed", "Remove"],
  ] : current === "paused" ? [
    ["active", "Resume"], ["removed", "Remove"],
  ] : [];
  if (!targets.length) return null;

  return <form action={action} className="listing-status-form">
    <input type="hidden" name="id" value={id}/>
    <label htmlFor="listing-next-status">Manage listing</label>
    <select id="listing-next-status" name="status" required disabled={pending}>
      {targets.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    <button className="button button-dark" disabled={pending}>
      {pending ? "Saving…" : "Apply change"}
    </button>
    <p className="auth-feedback" role="status" aria-live="polite">{state.message}</p>
  </form>;
}
