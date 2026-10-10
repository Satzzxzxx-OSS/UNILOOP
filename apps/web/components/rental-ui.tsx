"use client";

import {Button} from "@/components/spaceui/button";
import {Input} from "@/components/spaceui/input";
import {Textarea} from "@/components/spaceui/textarea";

import { useActionState } from "react";
import {
  createRentalDraft,changeRentalStatus,requestRental,blockRentalDates,
  decideRental,saveRentalNote,
} from "@/lib/rentals/actions";
import { initialRentalAction } from "@/lib/rentals/validation";
import {categories} from "@/lib/catalog";

export function CreateRentalForm(){
  const [state,action,pending]=useActionState(createRentalDraft,initialRentalAction);
  return <form action={action} className="post-form">
    <div className="form-field"><label htmlFor="rental-title">Item title</label>
      <Input nativeInput unstyled id="rental-title" name="title" required minLength={8} maxLength={120}
        placeholder="e.g. Portable projector with remote"/></div>
    <div className="form-field"><label htmlFor="rental-category">Category</label>
      <select id="rental-category" name="category" required defaultValue="">
        <option value="" disabled>Select category</option>
        {categories.map(c=><option value={c.slug} key={c.slug}>{c.label}</option>)}
      </select></div>
    <div className="form-field"><label htmlFor="rental-description">Description</label>
      <Textarea unstyled id="rental-description" name="description" required rows={5}
        minLength={20} maxLength={5000}
        placeholder="What is included, how it works and any limitations?"/></div>
    <div className="form-field"><label htmlFor="rental-condition">Condition</label>
      <select id="rental-condition" name="condition" defaultValue="good">
        <option value="new">New</option>
        <option value="like_new">Like new</option>
        <option value="good">Good</option>
        <option value="fair">Fair</option>
      </select></div>
    <div className="rental-field-row">
      <div className="form-field"><label htmlFor="rental-rate">Price per day (₹)</label>
        <Input nativeInput unstyled id="rental-rate" name="daily_rate" type="number" inputMode="numeric" min={1}
          max={1000000} step={1} required placeholder="250"/></div>
      <div className="form-field"><label htmlFor="rental-deposit">Requested deposit (₹)</label>
        <Input nativeInput unstyled id="rental-deposit" name="deposit" type="number" inputMode="numeric" min={0}
          max={10000000} step={1} required defaultValue={0}/></div>
    </div>
    <div className="rental-field-row">
      <div className="form-field"><label htmlFor="rental-min">Minimum days</label>
        <Input nativeInput unstyled id="rental-min" name="min_days" type="number" min={1} max={90}
          required defaultValue={1}/></div>
      <div className="form-field"><label htmlFor="rental-max">Maximum days</label>
        <Input nativeInput unstyled id="rental-max" name="max_days" type="number" min={1} max={90}
          required defaultValue={30}/></div>
    </div>
    <p className="form-helper">Draft only. Add photos before publishing. Rental payments and deposits
      are arranged directly between participants; the platform does not hold or verify money.</p>
    <Button type="submit" className="button button-dark" disabled={pending}>{pending?"Saving…":"Save rental draft"}</Button>
    <p className="form-helper" role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function RentalStatusForm({id,status,hasPhoto}:{
  id:string;status:string;hasPhoto:boolean;
}){
  const [state,action,pending]=useActionState(changeRentalStatus,initialRentalAction);
  const options=status==="draft" ?
    [["active","Publish"],["removed","Remove"]] :
    status==="active" ? [["paused","Pause"],["removed","Remove"]] :
    status==="paused" ? [["active","Resume"],["removed","Remove"]] : [];
  const filtered=hasPhoto?options:options.filter(([value])=>value!=="active");
  if(!filtered.length)return <p className="interaction-note">Add a photo before publishing.</p>;
  return <form action={action} className="rental-mini-form">
    <input type="hidden" name="rental" value={id}/>
    <label htmlFor="rent-status">Listing status</label>
    <select id="rent-status" name="status" required>
      {filtered.map(([value,label])=><option value={value} key={value}>{label}</option>)}
    </select>
    <Button type="submit" className="button button-dark" disabled={pending}>Update listing</Button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function RentalRequestForm({id,nonce,minDays,maxDays}:{
  id:string;nonce:string;minDays:number;maxDays:number;
}){
  const [state,action,pending]=useActionState(requestRental,initialRentalAction);
  return <form action={action} className="rental-mini-form">
    <input type="hidden" name="rental" value={id}/>
    <input type="hidden" name="nonce" value={nonce}/>
    <h3>Request dates</h3>
    <label htmlFor="rental-start">Pickup date</label>
    <Input nativeInput unstyled id="rental-start" type="date" name="start" required disabled={pending}/>
    <label htmlFor="rental-return">Return date (exclusive)</label>
    <Input nativeInput unstyled id="rental-return" type="date" name="return" required disabled={pending}/>
    <p className="form-helper">{minDays}–{maxDays} days. The return date is the day
      the item becomes available again. Requests are not confirmed bookings.</p>
    <Button type="submit" className="button button-dark" disabled={pending}>
      {pending?"Submitting…":"Request rental"}
    </Button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function RentalBlockForm({id,nonce}:{id:string;nonce:string}){
  const [state,action,pending]=useActionState(blockRentalDates,initialRentalAction);
  return <form action={action} className="rental-mini-form">
    <input type="hidden" name="rental" value={id}/>
    <input type="hidden" name="nonce" value={nonce}/>
    <h3>Block unavailable dates</h3>
    <label htmlFor="block-from">Unavailable from</label>
    <Input nativeInput unstyled id="block-from" type="date" name="start" required/>
    <label htmlFor="block-until">Available again on</label>
    <Input nativeInput unstyled id="block-until" type="date" name="return" required/>
    <Button type="submit" className="button button-outline" disabled={pending}>
      {pending?"Saving…":"Block dates"}
    </Button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function RentalBookingDecision({id,decision,label}:{
  id:string;decision:"approve"|"decline"|"cancel"|"confirm_handover"|"confirm_return";
  label:string;
}){
  const [state,action,pending]=useActionState(decideRental,initialRentalAction);
  return <form action={action} className="rental-decision-form">
    <input type="hidden" name="booking" value={id}/>
    <input type="hidden" name="decision" value={decision}/>
    <Button type="submit" className={decision==="approve"?"button button-dark":"button button-outline"}
      disabled={pending}>{pending?"Updating…":label}</Button>
    <p className="form-helper" role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function RentalConditionForm({id}:{id:string}){
  const [state,action,pending]=useActionState(saveRentalNote,initialRentalAction);
  return <form action={action} className="rental-mini-form">
    <input type="hidden" name="booking" value={id}/>
    <h3>Condition notes</h3>
    <label htmlFor="condition-stage">Stage</label>
    <select id="condition-stage" name="stage" defaultValue="pickup">
      <option value="pickup">Pickup</option>
      <option value="return">Return</option>
      <option value="incident">Damage or other incident</option>
    </select>
    <label htmlFor="condition-note">Your observation</label>
    <Textarea unstyled id="condition-note" name="note" rows={4} minLength={10}
      maxLength={1200} required placeholder="Describe condition and included accessories."/>
    <Button type="submit" className="button button-outline" disabled={pending}>Save note</Button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}
