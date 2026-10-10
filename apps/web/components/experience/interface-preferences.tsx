"use client";

import {useEffect,useRef,useSyncExternalStore} from "react";
import {Volume2,VolumeX,WifiOff} from "lucide-react";
import {Button} from "@/components/spaceui/button";
import {Tooltip,TooltipTrigger,TooltipPopup} from "@/components/spaceui/tooltip";

const preferenceKey="uniloop:interface-sounds:v1";
type SoundEngine=typeof import("@/lib/spaceui-sounds");
let memoryPreference=false;
const preferenceEvent="uniloop-interface-preference";
function getPreference(){try{return localStorage.getItem(preferenceKey)==="true";}catch{return memoryPreference;}}
function subscribePreference(callback:()=>void){window.addEventListener("storage",callback);window.addEventListener(preferenceEvent,callback);return ()=>{window.removeEventListener("storage",callback);window.removeEventListener(preferenceEvent,callback);};}
function subscribeNetwork(callback:()=>void){window.addEventListener("online",callback);window.addEventListener("offline",callback);return ()=>{window.removeEventListener("online",callback);window.removeEventListener("offline",callback);};}
function offlineSnapshot(){return !navigator.onLine;}
function serverSnapshot(){return false;}

/** Audio is opt-in, gesture-triggered, and never signals an unconfirmed server result. */
export function InterfacePreferences(){
  const enabled=useSyncExternalStore(subscribePreference,getPreference,serverSnapshot);
  const offline=useSyncExternalStore(subscribeNetwork,offlineSnapshot,serverSnapshot);
  const engine=useRef<SoundEngine|null>(null);
  useEffect(()=>{
    const click=(event:MouseEvent)=>{
      if(!getPreference()||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;
      const target=event.target instanceof Element?event.target.closest<HTMLElement>("button,a,summary"):null;
      if(!target||target.hasAttribute("disabled")||target.getAttribute("aria-disabled")==="true"||target.closest("[data-sound-control]"))return;
      const sound=target.dataset.spaceClick??"tap";
      void import("@/lib/spaceui-sounds").then(module=>{
        if(!getPreference())return;
        engine.current=module;module.setEnabled(true);module.setVolume(.16);module.setRespectReducedMotion(true);
        module.play(sound);
      }).catch(()=>{/* Sound never blocks the user's action. */});
    };
    document.addEventListener("click",click);
    return ()=>{document.removeEventListener("click",click);void engine.current?.destroy();};
  },[]);
  function toggle(){
    const next=!getPreference();memoryPreference=next;
    try{localStorage.setItem(preferenceKey,String(next));}catch{}
    window.dispatchEvent(new Event(preferenceEvent));
    engine.current?.setEnabled(next);
    if(!next)void engine.current?.destroy();
  }
  return <>
    <Tooltip><TooltipTrigger render={<Button variant="ghost" type="button" className="ux-icon-button ul-sound-toggle" data-sound-control aria-label="Interface sounds" aria-pressed={enabled} onClick={toggle}/>}>{enabled?<Volume2 size={17}/>:<VolumeX size={17}/>}</TooltipTrigger><TooltipPopup>{enabled?"Mute interface sounds":"Enable interface sounds"}</TooltipPopup></Tooltip>
    {offline&&<div className="ul-offline-notice" role="status"><WifiOff size={16}/>You’re offline. Reconnect before submitting changes.</div>}
  </>;
}
