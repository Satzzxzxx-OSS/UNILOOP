/* Original UNILOOP bot mark. Space UI Avatar Extended's ring/icon composition,
 * rendered as local SVG so no avatar service receives identity or browser data. */
import {Check, Sparkles} from "lucide-react";
import {AvatarExtended,AvatarIcon,AvatarRing} from "@/components/spaceui/avatar-extended";

export function AuthBotAvatar({large=false}:{large?:boolean}){
 return <AvatarExtended className={large?"un-v2-avatar un-v2-avatar-large":"un-v2-avatar"} data-testid="uniloop-auth-avatar">
  <div className="un-v2-avatar-glow" aria-hidden="true"/>
  <div className="un-v2-avatar-core" role="img" aria-label="UNILOOP friendly companion">
   <svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <defs>
     <linearGradient id="botShell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#fafbff"/><stop offset="1" stopColor="#aaa7c9"/></linearGradient>
     <linearGradient id="botFace" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#171824"/><stop offset="1" stopColor="#101014"/></linearGradient>
    </defs>
    <path d="M60 20v-7" stroke="#b8b8e9" strokeWidth="5" strokeLinecap="round"/>
    <circle cx="60" cy="12" r="5" fill="#d9d4ff"/>
    <rect x="15" y="25" width="90" height="78" rx="30" fill="url(#botShell)" stroke="#ffffff" strokeWidth="2"/>
    <rect x="23" y="35" width="74" height="54" rx="21" fill="url(#botFace)"/>
    <path d="M17 58h-7v16h7m86-16h7v16h-7" fill="#c9c5e6"/>
    <ellipse cx="43" cy="60" rx="6" ry="8" fill="#b9b3ff"/>
    <ellipse cx="77" cy="60" rx="6" ry="8" fill="#b9b3ff"/>
    <circle cx="45" cy="57" r="2" fill="#ffffff" opacity=".85"/>
    <circle cx="79" cy="57" r="2" fill="#ffffff" opacity=".85"/>
    <path d="M51 74q9 8 18 0" fill="none" stroke="#c5beff" strokeWidth="3" strokeLinecap="round"/>
    <path d="M49 96h22" stroke="#8f89b9" strokeWidth="3" strokeLinecap="round"/>
   </svg>
  </div>
  <AvatarRing className="un-v2-avatar-ring"/>
  <AvatarIcon className="un-v2-avatar-sparkle"><Sparkles size={large?17:12}/><span className="sr-only">Companion avatar</span></AvatarIcon>
  <span className="un-v2-avatar-check" aria-hidden="true"><Check size={large?13:10}/></span>
 </AvatarExtended>;
}
