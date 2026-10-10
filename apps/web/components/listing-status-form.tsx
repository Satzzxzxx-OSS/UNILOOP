"use client";

import {Button} from "@/components/spaceui/button";

import { useActionState } from "react";
import { changeListingStatus, type ActionState } from "@/lib/listings/actions";
import type { ListingStatus } from "@/lib/listings/validation";

const initialState: ActionState = { message: "" };

export function ListingStatusForm({
  id, current, hasPhoto,
}: { id: string; current: ListingStatus; hasPhoto: boolean }) {
  const [state, action, pending] = useActionState(changeListingStatus, initialState);
  const targets = current === "draft" ? [
    ["active", "Publish"], ["removed", "Remove draft"],
  ] : current === "active" ? [
    ["paused", "Pause"], ["sold", "Mark sold (self-reported)"], ["removed", "Remove"],
  ] : current === "paused" ? [
    ["active", "Resume"], ["removed", "Remove"],
  ] : [];
  const permitted = hasPhoto ? targets : targets.filter(([target]) => target !== "active");
  if (!permitted.length) return null;

  return <form action={action} className="listing-status-form">
    <input type="hidden" name="id" value={id}/>
    <label htmlFor="listing-next-status">Manage listing</label>
    <select id="listing-next-status" name="status" required disabled={pending}>
      {permitted.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select>
    <Button type="submit" className="button button-dark" disabled={pending}>
      {pending ? "Saving…" : "Apply change"}
    </Button>
    {!hasPhoto && <p className="photo-help">Add at least one valid photo before publishing.</p>}
    <p className="auth-feedback" role="status" aria-live="polite">{state.message}</p>
  </form>;
}
