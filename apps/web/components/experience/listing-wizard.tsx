"use client";

import Link from "next/link";
import {useRouter} from "next/navigation";
import {useActionState,useEffect,useRef,useState,type ChangeEvent} from "react";
import {categories} from "@/lib/catalog";
import {createListingDraft} from "@/lib/listings/actions";
import {createRentalDraft} from "@/lib/rentals/actions";
import {ExperienceIcon} from "./experience-header";

type Type="sell"|"rent";
type Draft={
  title:string;category:string;condition:string;description:string;
  price:string;dailyRate:string;deposit:string;minDays:string;maxDays:string;
};
type LocalPhoto={id:string;url:string;name:string};
const steps=["Item details","Photos","Pricing","Review"] as const;
const initial:Draft={title:"",category:"",condition:"good",description:"",price:"",
  dailyRate:"",deposit:"0",minDays:"1",maxDays:"30"};
const initialAction={message:""};

export function ExperienceListingWizard({mode,backendReady}:{
  mode:Type;backendReady:boolean;
}){
  const router=useRouter();
  const [step,setStep]=useState(0);
  const [draft,setDraft]=useState<Draft>(initial);
  const [photos,setPhotos]=useState<LocalPhoto[]>([]);
  const [warning,setWarning]=useState("");
  const urls=useRef<string[]>([]);
  useEffect(()=>()=>{for(const path of urls.current)URL.revokeObjectURL(path);},[]);
  const actionFn=mode==="sell"?createListingDraft:createRentalDraft;
  const [state,action,pending]=useActionState(actionFn,initialAction);
  const rental=mode==="rent";
  function patch(key:keyof Draft,value:string){setDraft(old=>({...old,[key]:value}));setWarning("");}
  function handleNext(){
    if(step===0){
      if(draft.title.trim().length<8||draft.title.trim().length>120){
        setWarning("Add a descriptive title (8–120 characters).");return;
      }
      if(!categories.some(c=>c.slug===draft.category)){
        setWarning("Choose a category.");return;
      }
      if(draft.description.trim().length<20){
        setWarning("Add at least 20 characters explaining your item.");return;
      }
    }
    if(step===2){
      const amount=Number(rental?draft.dailyRate:draft.price);
      if(!Number.isSafeInteger(amount)||amount<1||amount>(rental?1000000:10000000)){
        setWarning("Enter a valid whole-rupee price.");return;
      }
      if(rental){
        const dep=Number(draft.deposit),min=Number(draft.minDays),max=Number(draft.maxDays);
        if(!Number.isSafeInteger(dep)||dep<0||dep>10000000||
          !Number.isInteger(min)||!Number.isInteger(max)||min<1||max>90||max<min){
          setWarning("Check your deposit and minimum/maximum days.");return;
        }
      }
    }
    setWarning("");setStep(n=>Math.min(steps.length-1,n+1));
  }
  function handlePhotoFiles(event:ChangeEvent<HTMLInputElement>){
    const selected=[...(event.target.files??[])];
    event.target.value="";
    if(!selected.length)return;
    if(selected.length+photos.length>5){
      setWarning("You can preview up to five photos.");return;
    }
    if(selected.some(p=>!["image/jpeg","image/png","image/webp"].includes(p.type)||p.size>5*1024*1024||p.size===0)){
      setWarning("Use JPEG, PNG or WebP under 5 MB per photo.");return;
    }
    const items=selected.map(p=>{
      const url=URL.createObjectURL(p);urls.current.push(url);
      return {id:crypto.randomUUID(),url,name:p.name};
    });
    setPhotos(old=>[...old,...items]);setWarning("");
  }
  function removePhoto(item:LocalPhoto){
    setPhotos(old=>old.filter(p=>p.id!==item.id));
    URL.revokeObjectURL(item.url);
    urls.current=urls.current.filter(s=>s!==item.url);
  }
  const currency=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});
  const priceText=(mode==="sell"?draft.price:draft.dailyRate);
  const priceValue=Number(priceText);
  return <div className="ux-wizard">
    <div className="ux-wizard-heading">
      <div><p className="ux-kicker">{rental?"RENT OUT":"SELL SOMETHING"}</p>
        <h1>{rental?"Let others make more of it.":"Give it a next chapter."}</h1>
        <p>Details matter. Build a clear, thoughtful listing one step at a time.</p></div>
      <div className="ux-wizard-progress-ring" aria-label={"Step "+(step+1)+" of 4"}>
        <span>{String(step+1).padStart(2,"0")}<small>/ 04</small></span>
      </div>
    </div>
    <nav className="ux-wizard-steps" aria-label="Listing form progress">
      {steps.map((name,i)=><button type="button" key={name} disabled={i>step}
        onClick={()=>{setStep(i);setWarning("");}}
        aria-current={i===step?"step":undefined}
        className={i===step?"ux-step-current":i<step?"ux-step-complete":""}>
        <span>{i<step?"✓":i+1}</span><strong>{name}</strong>
      </button>)}
    </nav>
    <div className="ux-wizard-layout">
      <section className="ux-wizard-panel" aria-labelledby="ux-wizard-step-title">
        {step===0&&<>
          <p className="ux-form-step-kicker">01 — THE ESSENTIALS</p>
          <h2 id="ux-wizard-step-title">Tell us about the item.</h2>
          <p className="ux-form-explanation">A specific title, real condition and honest details help people decide.</p>
          <div className="ux-field"><label htmlFor="ux-item-title">What are you listing?</label>
            <input id="ux-item-title" value={draft.title} maxLength={120}
              placeholder="e.g. Scientific calculator in great condition"
              onChange={e=>patch("title",e.target.value)}/>
            <small>{draft.title.length}/120 characters</small></div>
          <div className="ux-field-row">
            <div className="ux-field"><label htmlFor="ux-item-category">Category</label>
              <select id="ux-item-category" value={draft.category}
                onChange={e=>patch("category",e.target.value)}>
                <option value="">Choose category</option>
                {categories.map(c=><option key={c.slug} value={c.slug}>{c.label}</option>)}
              </select></div>
            <div className="ux-field"><label htmlFor="ux-item-condition">Condition</label>
              <select id="ux-item-condition" value={draft.condition}
                onChange={e=>patch("condition",e.target.value)}>
                <option value="new">New</option><option value="like_new">Like new</option>
                <option value="good">Good</option><option value="fair">Fair</option>
              </select></div>
          </div>
          <div className="ux-field"><label htmlFor="ux-item-description">A few more details</label>
            <textarea id="ux-item-description" rows={6} maxLength={5000}
              value={draft.description} onChange={e=>patch("description",e.target.value)}
              placeholder="What's included? Any marks, missing accessories or important details?"/>
            <small>{draft.description.length}/5000 characters · minimum 20</small>
          </div>
        </>}
        {step===1&&<>
          <p className="ux-form-step-kicker">02 — SHOW IT OFF</p>
          <h2 id="ux-wizard-step-title">Let the item speak.</h2>
          <p className="ux-form-explanation">Clear photos build confidence. The first one becomes your cover.</p>
          <label className="ux-photo-drop" htmlFor="ux-photo-picker">
            <span className="ux-photo-plus"><ExperienceIcon name="plus" size={30}/></span>
            <strong>Add up to 5 photos</strong>
            <span>JPEG, PNG or WebP · max 5 MB each</span>
            <input id="ux-photo-picker" type="file" accept="image/jpeg,image/png,image/webp"
              multiple onChange={handlePhotoFiles}/>
          </label>
          <div className="ux-photo-preview-grid">
            {photos.map((photo,index)=><div className="ux-photo-preview" key={photo.id}>
              {/* URLs are local object URLs generated only from user-selected images. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt={"Selected photo "+(index+1)}/>
              <button type="button" onClick={()=>removePhoto(photo)} aria-label={"Remove "+photo.name}>×</button>
              {index===0&&<span>Cover</span>}
            </div>)}
          </div>
          <p className="ux-preview-note">Local preview only: these photos are not uploaded or saved yet.
            Upload real images after creating a draft when account services are enabled.</p>
        </>}
        {step===2&&<>
          <p className="ux-form-step-kicker">03 — SET YOUR TERMS</p>
          <h2 id="ux-wizard-step-title">{rental?"Choose a fair daily rate.":"What feels like a fair price?"}</h2>
          <p className="ux-form-explanation">{rental?
            "Show the daily rate, any requested deposit, and the rental duration upfront.":
            "Choose your asking price. Buyers can discuss an offer later when messaging is enabled."}</p>
          <div className="ux-field">
            <label htmlFor="ux-item-price">{rental?"Daily rental price (₹)":"Asking price (₹)"}</label>
            <div className="ux-price-field"><span>₹</span><input id="ux-item-price"
              type="number" min={1} max={rental?1000000:10000000} step={1}
              inputMode="numeric" value={priceText}
              onChange={e=>patch(rental?"dailyRate":"price",e.target.value)}
              placeholder={rental?"150":"750"}/></div>
          </div>
          {rental&&<>
            <div className="ux-field"><label htmlFor="ux-rental-deposit">Requested refundable deposit (₹)</label>
              <div className="ux-price-field"><span>₹</span><input id="ux-rental-deposit"
                type="number" min={0} max={10000000} step={1} value={draft.deposit}
                onChange={e=>patch("deposit",e.target.value)}/></div></div>
            <div className="ux-field-row">
              <div className="ux-field"><label htmlFor="ux-rental-min">Minimum rental days</label>
                <input id="ux-rental-min" type="number" min={1} max={90} value={draft.minDays}
                  onChange={e=>patch("minDays",e.target.value)}/></div>
              <div className="ux-field"><label htmlFor="ux-rental-max">Maximum rental days</label>
                <input id="ux-rental-max" type="number" min={1} max={90} value={draft.maxDays}
                  onChange={e=>patch("maxDays",e.target.value)}/></div>
            </div>
            <p className="ux-preview-note">No in-app deposit custody, insurance, or verified payments are provided.</p>
          </>}
        </>}
        {step===3&&<>
          <p className="ux-form-step-kicker">04 — THE FINAL LOOK</p>
          <h2 id="ux-wizard-step-title">Looking good. One more check.</h2>
          <p className="ux-form-explanation">Here&apos;s the preview of the information you&apos;ve entered.</p>
          <div className="ux-draft-review">
            <span className="ux-draft-review-photo">{photos.length?"Selected cover ready":"Photo not selected"}</span>
            <p className="ux-kicker">{draft.category?categories.find(c=>c.slug===draft.category)?.label:"Category missing"}</p>
            <h3>{draft.title||"Your item title"}</h3>
            <strong>{priceValue>0?currency.format(priceValue):"Price not set"}{rental?" / day":""}</strong>
            <p>{draft.description}</p>
            <dl>
              <div><dt>Condition</dt><dd>{draft.condition.replace("_"," ")}</dd></div>
              {rental&&<div><dt>Deposit requested</dt><dd>{currency.format(Number(draft.deposit)||0)}</dd></div>}
              {rental&&<div><dt>Duration</dt><dd>{draft.minDays}–{draft.maxDays} days</dd></div>}
              <div><dt>Photo previews</dt><dd>{photos.length}</dd></div>
            </dl>
          </div>
          {backendReady?
            <form action={action} className="ux-final-submit">
              <input type="hidden" name="title" value={draft.title}/>
              <input type="hidden" name="description" value={draft.description}/>
              <input type="hidden" name="category" value={draft.category}/>
              <input type="hidden" name="condition" value={draft.condition}/>
              {rental?<>
                <input type="hidden" name="daily_rate" value={draft.dailyRate}/>
                <input type="hidden" name="deposit" value={draft.deposit}/>
                <input type="hidden" name="min_days" value={draft.minDays}/>
                <input type="hidden" name="max_days" value={draft.maxDays}/>
              </>:<input type="hidden" name="price" value={draft.price}/>}
              <button type="submit" className="ux-wizard-primary" disabled={pending}>
                {pending?"Saving…":"Save real draft"} <ExperienceIcon name="arrow" size={18}/>
              </button>
              <p role="status" aria-live="polite">{state.message}</p>
            </form>:
            <div className="ux-wizard-disabled">
              <strong>Your frontend preview is ready.</strong>
              <p>Nothing has been submitted, uploaded or saved. Real draft saving stays
                disabled until approved accounts and backend services are connected.</p>
              <button type="button" disabled>Save draft (not available yet)</button>
            </div>}
        </>}
        {warning&&<p className="ux-form-warning" role="alert">{warning}</p>}
        {step<3&&<div className="ux-form-footer">
          <button type="button" className="ux-wizard-secondary"
            onClick={()=>{if(step===0)router.push("/");else{setStep(n=>n-1);setWarning("");}}}>
            {step===0?"Cancel":"Back"}
          </button>
          <button type="button" className="ux-wizard-primary" onClick={handleNext}>
            {step===2?"Review listing":"Continue"} <ExperienceIcon name="arrow" size={18}/>
          </button>
        </div>}
        {step===3&&<button type="button" className="ux-back-step" onClick={()=>setStep(2)}>← Back to pricing</button>}
      </section>
      <aside className="ux-wizard-aside">
        <div className="ux-wizard-tip-card">
          <span className="ux-tip-symbol" aria-hidden="true">✳</span>
          <p className="ux-kicker">A BETTER LISTING</p>
          <h3>Good details make great connections.</h3>
          <p>Be clear about the item, its condition and your terms.
            Quality photos and honest descriptions help everyone.</p>
          <Link href="/explore">See what&apos;s already listed →</Link>
        </div>
        <div className="ux-wizard-privacy"><ExperienceIcon name="shield" size={19}/>
          <p>Never include passwords, personal IDs, OTPs or financial details in listing descriptions.</p>
        </div>
      </aside>
    </div>
  </div>;
}
