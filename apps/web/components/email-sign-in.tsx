"use client";

import {Button} from "@/components/spaceui/button";
import {Input} from "@/components/spaceui/input";

import { useState, type FormEvent } from "react";
import { browserSupabase } from "@/lib/supabase/browser";

export function EmailSignIn({intent="signin"}:{intent?:"signin"|"signup"}) {
  const [email, setEmail] = useState("");
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (working) return;
    setWorking(true);
    setMessage("");

    try {
      const supabase = browserSupabase();
      if (!supabase) {
        setMessage("Sign-in is not available right now.");
        return;
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          // Explicit signup creates identity only; existing campus RLS still gates access.
          shouldCreateUser: intent === "signup",
          emailRedirectTo: new URL("/auth/confirm", window.location.origin).toString(),
        },
      });

      if (error) {
        // Avoid propagating provider errors that could enumerate accounts.
        setMessage("Unable to send a sign-in email. Please try later.");
      } else {
        setSent(true);
        setMessage("Check your inbox for a verification link. Marketplace access still depends on your account eligibility.");
      }
    } catch {
      setMessage("Unable to connect right now. Please try again later.");
    } finally {
      setWorking(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      <label htmlFor="email-sign-in">Email address</label>
      <Input nativeInput unstyled
        type="email"
        id="email-sign-in"
        name="email"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        maxLength={254}
        required
        disabled={working || sent}
        placeholder="you@example.com"
      />
      <Button type="submit" className="button button-dark" disabled={working || sent}>
        {working ? "Sending…" : sent ? "Email requested" : intent === "signup" ? "Create account by email" : "Email me a sign-in link"}
      </Button>
      <p className="auth-feedback" role="status" aria-live="polite">{message}</p>
      {sent && (
        <Button
          type="button"
          className="text-link auth-reset"
          onClick={() => { setSent(false); setMessage(""); }}
        >
          Use a different email
        </Button>
      )}
    </form>
  );
}
