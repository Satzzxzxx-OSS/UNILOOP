"use client";

import { useState } from "react";
import { browserSupabase } from "@/lib/supabase/browser";

export function AccountSignOut() {
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");

  async function signOut() {
    if (working) return;
    setWorking(true);
    try {
      const client = browserSupabase();
      if (!client) {
        setMessage("Sign-out is unavailable.");
        return;
      }
      const { error } = await client.auth.signOut();
      if (error) {
        setMessage("Sign-out failed. Please retry.");
        return;
      }
      window.location.replace("/account");
    } catch {
      setMessage("Sign-out failed. Please retry.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <div className="account-sign-out">
      <button type="button" className="button button-dark" onClick={signOut} disabled={working}>
        {working ? "Signing out…" : "Sign out"}
      </button>
      <p role="status" aria-live="polite">{message}</p>
    </div>
  );
}
