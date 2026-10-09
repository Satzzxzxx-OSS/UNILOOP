"use client";
import {useActionState} from "react";
import {startSaleDeal,confirmSaleHandover,submitSaleReview} from "@/lib/sales/actions";
import {initialSaleAction} from "@/lib/sales/validation";

export function StartDealForm({offerId}:{offerId:string}){
  const [state,action,pending]=useActionState(startSaleDeal,initialSaleAction);
  return <form action={action} className="rental-decision-form">
    <input type="hidden" name="offer" value={offerId}/>
    <button className="button button-dark" disabled={pending}>Begin handover record</button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}
export function ConfirmDealForm({id,label}:{id:string;label:string}){
  const [state,action,pending]=useActionState(confirmSaleHandover,initialSaleAction);
  return <form action={action} className="rental-decision-form">
    <input type="hidden" name="transaction" value={id}/>
    <button className="button button-dark" disabled={pending}>{label}</button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}
export function SaleReviewForm({id}:{id:string}){
  const [state,action,pending]=useActionState(submitSaleReview,initialSaleAction);
  return <form action={action} className="rental-mini-form">
    <input type="hidden" name="transaction" value={id}/>
    <h3>Review the completed exchange</h3>
    <label htmlFor="sale-stars">Rating</label>
    <select id="sale-stars" name="stars" required defaultValue="5">
      <option value="5">5 — Excellent</option>
      <option value="4">4 — Good</option>
      <option value="3">3 — Okay</option>
      <option value="2">2 — Poor</option>
      <option value="1">1 — Very poor</option>
    </select>
    <label htmlFor="sale-review">Your review</label>
    <textarea id="sale-review" name="review" rows={4} required minLength={15}
      maxLength={1000} placeholder="Describe your first-hand exchange experience."/>
    <button className="button button-dark" disabled={pending}>Save review</button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}
