"use client";
import {useActionState} from "react";
import {markNotificationsRead,initialNotificationState} from "@/lib/notifications/actions";

export function NotificationReadForm({id}:{id:string}){
  const [state,action,pending]=useActionState(markNotificationsRead,initialNotificationState);
  return <form action={action} className="notification-read-form">
    <input type="hidden" name="notification" value={id}/>
    <button type="submit" className="text-link" disabled={pending}>
      {id==="all"?"Mark all as read":"Mark as read"}
    </button>
    <p role="status" aria-live="polite">{state.message}</p>
  </form>;
}
