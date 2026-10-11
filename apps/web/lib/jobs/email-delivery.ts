import type { NotificationEventHandler } from "./outbox.ts";

type Rpc = (name: string, args: Record<string, unknown>) => PromiseLike<{ data: unknown; error: unknown }>;
type DeliveryContext = {
  eligible: boolean;
  recipient_email: string | null;
  title: string | null;
  link_path: string | null;
  suppression_code: string | null;
};
const email = /^[^\s<>\r\n@]+@[^\s<>\r\n@]+\.[^\s<>\r\n@]+$/;
const notificationPath = /^\/inbox\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/** Optional Resend transport. No network calls occur until a leased job is handled.
 * Provider acceptance is not proof of inbox delivery. Secrets stay in the worker. */
export function createNotificationEmailHandler({ rpc, apiKey, from, appUrl, fetcher = fetch }: {
  rpc: Rpc; apiKey: string; from: string; appUrl: string; fetcher?: typeof fetch;
}): NotificationEventHandler {
  const origin = new URL(appUrl);
  if (!apiKey || /\s/.test(apiKey) || !email.test(from) || origin.protocol !== "https:" ||
    origin.username || origin.password || origin.pathname !== "/" || origin.search || origin.hash)
    throw new Error("Invalid notification transport configuration");

  return async (event, { idempotencyKey, signal }) => {
    signal.throwIfAborted();
    const { data, error } = await rpc("get_notification_delivery_context", {
      requested_event: event.event_id, requested_lease: event.lease_token,
    });
    signal.throwIfAborted();
    if (error || !Array.isArray(data) || data.length !== 1)
      throw new Error("Notification eligibility unavailable");
    const context = data[0] as DeliveryContext;
    if (context.eligible === false && context.suppression_code &&
      context.recipient_email === null && context.title === null && context.link_path === null) return;
    if (context.eligible !== true || typeof context.recipient_email !== "string" ||
      !email.test(context.recipient_email) || typeof context.title !== "string" ||
      context.title.length < 3 || context.title.length > 120 || /[\r\n]/.test(context.title) ||
      typeof context.link_path !== "string" || !notificationPath.test(context.link_path))
      throw new Error("Invalid notification delivery context");
    const response = await fetcher("https://api.resend.com/emails", {
      method: "POST", redirect: "error", signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json",
        "Idempotency-Key": `uniloop-notification/${idempotencyKey}` },
      body: JSON.stringify({ from, to: [context.recipient_email], subject: context.title,
        text: `${context.title}\n\nOpen your private workspace:\n${origin.origin}${context.link_path}\n\nManage email preferences:\n${origin.origin}/settings` }),
    });
    if (!response.ok) throw new Error("Notification transport rejected the request");
    const accepted: unknown = await response.json();
    if (!accepted || typeof accepted !== "object" || !("id" in accepted) ||
      typeof accepted.id !== "string" || !accepted.id)
      throw new Error("Notification transport acknowledgement unavailable");
  };
}
