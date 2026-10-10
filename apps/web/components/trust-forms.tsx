"use client";

import {Button} from "@/components/spaceui/button";
import {Input} from "@/components/spaceui/input";
import {Textarea} from "@/components/spaceui/textarea";

import { useActionState } from "react";
import {
  toggleSaved,updateDisplayName,saveNotificationPrefs,sendListingReport,
  reviewListingReport,
} from "@/lib/trust/actions";
import { initialTrustState, REPORT_REASONS } from "@/lib/trust/validation";

export function SavedToggle({listingId,saved}: {listingId:string;saved:boolean}) {
  const [state,action,pending]=useActionState(toggleSaved,initialTrustState);
  return <form action={action} className="mini-form">
    <input type="hidden" name="listing" value={listingId} />
    <input type="hidden" name="target" value={saved?"remove":"add"} />
    <Button type="submit" className="button button-outline" disabled={pending}>
      {saved?"♥ Remove saved":"♡ Save item"}
    </Button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function ProfileSettingsForm({name}: {name:string}) {
  const [state,action,pending]=useActionState(updateDisplayName,initialTrustState);
  return <form action={action} className="post-form">
    <div className="form-field"><label htmlFor="settings-name">Display name</label>
      <Input nativeInput unstyled id="settings-name" name="display_name" defaultValue={name}
        maxLength={60} minLength={2} required autoComplete="nickname"/></div>
    <Button type="submit" className="button button-dark" disabled={pending}>Save profile</Button>
    <p className="form-helper" role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function PreferenceSettingsForm({messages,offers}:{
  messages:boolean;offers:boolean;
}) {
  const [state,action,pending]=useActionState(saveNotificationPrefs,initialTrustState);
  return <form action={action} className="post-form">
    <h2>Notification preferences</h2>
    <label className="checkbox-option">
      <input type="checkbox" name="email_messages" defaultChecked={messages}/>
      Message updates
    </label>
    <label className="checkbox-option">
      <input type="checkbox" name="email_offers" defaultChecked={offers}/>
      Offer updates
    </label>
    <p className="form-helper">Email delivery is not active yet. These choices are saved for future notifications.</p>
    <Button type="submit" className="button button-dark" disabled={pending}>Save preferences</Button>
    <p className="form-helper" role="status" aria-live="polite">{state.message}</p>
  </form>;
}

export function ListingReportForm({listingId}:{listingId:string}) {
  const [state,action,pending]=useActionState(sendListingReport,initialTrustState);
  return <form action={action} className="post-form">
    <input type="hidden" name="listing" value={listingId}/>
    <div className="form-field"><label htmlFor="report-reason">Reason</label>
      <select id="report-reason" name="reason" required defaultValue="">
        <option value="" disabled>Choose a reason</option>
        {REPORT_REASONS.map(reason=><option key={reason} value={reason}>
          {reason.replaceAll("_"," ")}
        </option>)}
      </select></div>
    <div className="form-field"><label htmlFor="report-details">Explain the issue</label>
      <Textarea unstyled id="report-details" name="details" rows={5} minLength={15}
        maxLength={1500} required placeholder="What should our review team know?"/></div>
    <Button type="submit" className="button button-dark" disabled={pending}>
      {pending?"Submitting…":"Submit report"}
    </Button>
    <p role="status" aria-live="polite" className="form-helper">{state.message}</p>
  </form>;
}

export function ReviewReportForm({id}:{id:string}) {
  const [state,action,pending]=useActionState(reviewListingReport,initialTrustState);
  return <form action={action} className="review-form">
    <input type="hidden" name="id" value={id}/>
    <label htmlFor={"resolve-"+id}>Decision</label>
    <select id={"resolve-"+id} name="decision" required defaultValue="dismiss">
      <option value="dismiss">Dismiss — insufficient evidence</option>
      <option value="remove_listing">Remove listing</option>
    </select>
    <Button type="submit" className="button button-dark" disabled={pending}>Record decision</Button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}
