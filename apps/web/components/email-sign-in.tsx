"use client";

import {useEffect,useState,type FormEvent} from "react";
import {ArrowRight,LockKeyhole,Mail,MailCheck,RefreshCw} from "lucide-react";
import {Button} from "@/components/spaceui/button";
import {Input} from "@/components/spaceui/input";
import {browserSupabase} from "@/lib/supabase/browser";

/** Both forms use the real Supabase email provider. No simulated success
 * state or password/social provider is presented to the user. */
export function EmailSignIn({intent="signin"}:{intent?:"signin"|"signup"}) {
  const [email,setEmail]=useState("");
  const [deliveredEmail,setDeliveredEmail]=useState("");
  const [working,setWorking]=useState(false);
  const [message,setMessage]=useState("");
  const [sent,setSent]=useState(false);
  const [cooldown,setCooldown]=useState(0);

  useEffect(()=>{
    if(cooldown<=0)return;
    const id=window.setInterval(()=>setCooldown(value=>Math.max(0,value-1)),1000);
    return ()=>window.clearInterval(id);
  },[cooldown]);

  async function requestLink(rawEmail:string) {
    if(working)return;
    const normalized=rawEmail.trim().toLowerCase();
    setWorking(true);
    setMessage("");
    try{
      const supabase=browserSupabase();
      if(!supabase){
        setMessage("Sign-in is not available right now.");
        return;
      }
      const {error}=await supabase.auth.signInWithOtp({
        email:normalized,
        options:{
          shouldCreateUser:intent==="signup",
          emailRedirectTo:new URL("/auth/confirm",window.location.origin).toString(),
        },
      });
      if(error){
        // A generic error avoids exposing account existence/provider details.
        setMessage("Unable to send a sign-in email. Please try again later.");
        return;
      }
      setDeliveredEmail(normalized);
      setSent(true);
      setCooldown(60); // UX throttle only: actual provider rate limits must still be enforced.
      setMessage("");
    }catch{
      setMessage("Unable to connect right now. Please try again later.");
    }finally{
      setWorking(false);
    }
  }

  function submit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    void requestLink(email);
  }

  if(sent){
    return <div className="un-auth-sent-state" aria-live="polite">
      <span className="un-auth-sent-icon"><MailCheck size={25}/></span>
      <h3>Check your inbox.</h3>
      <p>Check your inbox for a verification link. If an email can be sent for <strong>{deliveredEmail}</strong>, follow the link to continue. Check your spam folder too.</p>
      <p>Creating an identity does not automatically grant access to the campus marketplace.</p>
      {message&&<p className="un-auth-feedback" data-status="error" role="alert">{message}</p>}
      <div className="un-auth-sent-actions">
        <Button type="button" disabled={working||cooldown>0} onClick={()=>void requestLink(deliveredEmail)}>
          <RefreshCw size={15}/> {working?"Requesting…":cooldown>0?`Resend in ${cooldown}s`:"Resend email link"}
        </Button>
        <Button type="button" onClick={()=>{setSent(false);setEmail(deliveredEmail);setMessage("");setCooldown(0);}} disabled={working}>Use a different email</Button>
      </div>
    </div>;
  }

  return <form className="auth-form" onSubmit={submit}>
    <label htmlFor="email-sign-in">Email address</label>
    <div className="un-auth-email-field"><Mail size={18} aria-hidden="true"/>
      <Input nativeInput unstyled type="email" id="email-sign-in" name="email" autoComplete="email"
        inputMode="email" spellCheck={false} value={email}
        onChange={event=>setEmail(event.target.value)} maxLength={254}
        required disabled={working} placeholder="you@example.com" aria-describedby="un-auth-input-hint"/>
    </div>
    <p id="un-auth-input-hint" className="un-auth-method-hint"><LockKeyhole size={14}/> Secure email link, no password needed.</p>
    <Button type="submit" className="un-auth-submit" loading={working} disabled={working}>
      {working?"Sending secure link…":intent==="signup"?"Create account by email":"Email me a sign-in link"}
      {!working&&<ArrowRight size={17} aria-hidden="true"/>}
    </Button>
    {message&&<p className="un-auth-feedback" data-status="error" role="alert">{message}</p>}
  </form>;
}
