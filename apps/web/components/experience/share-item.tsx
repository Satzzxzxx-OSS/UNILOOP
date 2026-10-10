"use client";

import {useState} from "react";
import {Check,Link2,Share2} from "lucide-react";
import {Button} from "@/components/spaceui/button";
import {useClipboard} from "@/hooks/spaceui/use-clipboard";

export function ShareItem({title}:{title:string}){
  const [error,setError]=useState("");
  const {copy,copied}=useClipboard({onError:()=>setError("Copy is unavailable. You can copy this page’s address from your browser.")});
  async function share(){
    setError("");
    const url=window.location.href;
    if(navigator.share){
      try{await navigator.share({title,url});return;}catch(error){if(error instanceof Error&&error.name==="AbortError")return;}
    }
    await copy(url);
  }
  return <div className="ul-share-item"><Button variant="outline" type="button" onClick={share}>{copied&&!error?<Check size={16}/>:<Share2 size={16}/>} {copied&&!error?"Link copied":"Share item"}</Button><Button variant="ghost" type="button" aria-label="Copy item link" onClick={()=>{setError("");void copy(window.location.href);}}><Link2 size={16}/></Button><span role="status" className={error?"ul-share-error":"ux-visually-hidden"}>{error||(copied?"Item link copied to clipboard":"")}</span></div>;
}
