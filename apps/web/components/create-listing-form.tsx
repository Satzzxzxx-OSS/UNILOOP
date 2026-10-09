"use client";

import { useActionState } from "react";
import { categories } from "@/lib/catalog";
import { createListingDraft, type ActionState } from "@/lib/listings/actions";

const initialState: ActionState = { message: "" };

export function CreateListingForm() {
  const [state, action, pending] = useActionState(createListingDraft, initialState);
  return <form action={action} className="post-form">
    <div className="form-field"><label htmlFor="item-title">Item title</label>
      <input id="item-title" name="title" required minLength={8} maxLength={120}
        placeholder="e.g. Used calculus textbook, 3rd edition" /></div>
    <div className="form-field"><label htmlFor="item-category">Category</label>
      <select id="item-category" name="category" required defaultValue="">
        <option value="" disabled>Select a category</option>
        {categories.map(c => <option value={c.slug} key={c.slug}>{c.label}</option>)}
      </select></div>
    <div className="form-field"><label htmlFor="item-condition">Condition</label>
      <select id="item-condition" name="condition" defaultValue="good">
        <option value="new">New</option><option value="like_new">Like new</option>
        <option value="good">Good</option><option value="fair">Fair</option>
      </select></div>
    <div className="form-field"><label htmlFor="item-price">Asking price (INR)</label>
      <input id="item-price" name="price" inputMode="numeric"
        type="number" min={1} max={10000000} step={1} required placeholder="e.g. 700"/></div>
    <div className="form-field"><label htmlFor="item-description">Description</label>
      <textarea id="item-description" name="description" minLength={20} maxLength={5000}
        rows={6} required placeholder="Describe the item, its condition and what's included." /></div>
    <p className="form-helper">Save as a draft first. Photo uploads and additional protection tools are in progress. Posting never counts as published until you explicitly publish the listing.</p>
    <button type="submit" className="button button-dark" disabled={pending}>
      {pending ? "Saving…" : "Save draft"}
    </button>
    <p className="auth-feedback" role="status" aria-live="polite">{state.message}</p>
  </form>;
}
