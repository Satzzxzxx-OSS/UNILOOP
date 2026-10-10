"use client";

import Image from "next/image";
import {useState} from "react";
import {ExperienceIcon} from "./experience-header";

export function MediaGallery({urls,title,kind}:{urls:string[];title:string;kind:"sale"|"rental"}){
  const [active,setActive]=useState(0);
  const visible=Math.min(active,Math.max(0,urls.length-1));
  return <section className="ux-gallery" aria-label={title+" photos"}>
    <div className={"ux-gallery-stage ux-gallery-"+kind}>
      {urls[visible]?<Image src={urls[visible]}
        alt={title+" — image "+(visible+1)+" of "+urls.length}
        fill sizes="(max-width:800px) 100vw, 58vw"
        unoptimized className="ux-gallery-photo"/>:
        <div className="ux-gallery-placeholder" role="img"
          aria-label="No real product photos are available">
          <span className="ux-gallery-placeholder-symbol" aria-hidden="true">✳</span>
          <strong>No photos available yet</strong>
          <small>Actual seller-uploaded photos appear here.</small>
        </div>}
      {urls.length>1&&<div className="ux-gallery-arrows">
        <button type="button" aria-label="Previous item photo"
          onClick={()=>setActive(i=>(i-1+urls.length)%urls.length)}>←</button>
        <span aria-live="polite">{visible+1} / {urls.length}</span>
        <button type="button" aria-label="Next item photo"
          onClick={()=>setActive(i=>(i+1)%urls.length)}>
          <ExperienceIcon name="arrow"/>
        </button>
      </div>}
      <span className="ux-gallery-kind">{kind==="sale"?"For sale":"For rent"}</span>
    </div>
    {urls.length>1&&<div className="ux-gallery-thumbs" aria-label="Choose a photo">
      {urls.map((url,i)=><button type="button" key={i}
        aria-label={"Show image "+(i+1)} aria-pressed={visible===i}
        className={visible===i?"ux-gallery-thumb-selected":""}
        onClick={()=>setActive(i)}>
        <Image src={url} alt="" width={92} height={75}
          unoptimized className="ux-gallery-thumb-photo"/>
      </button>)}
    </div>}
  </section>;
}
