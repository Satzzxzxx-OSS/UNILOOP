/* Identity avatar using Space UI's MIT Avatar Extended building blocks.
 * No remote image fetch, generated status or third-party identity API. */
import {Check,UserRound} from "lucide-react";
import {AvatarExtended,AvatarRing,AvatarIcon} from "@/components/spaceui/avatar-extended";

function initials(name:string) {
 const source=name.includes("@")?name.split("@")[0]:name;
 const words=source.trim().split(/[\s._-]+/).filter(Boolean);
 if(!words.length)return "";
 return (words.length===1?words[0].slice(0,2):words[0][0]+words[words.length-1][0]).toLocaleUpperCase().slice(0,2);
}

export function ProfileAvatar({name,verified=false,size="medium"}:{
 name:string;verified?:boolean;size?:"small"|"medium"|"large";
}){
 const letters=initials(name);
 return <AvatarExtended className={`un-profile-avatar un-profile-avatar-${size}`} data-testid="profile-spaceui-avatar">
  <div className="un-profile-avatar-face" role="img" aria-label={name?"Account avatar for "+name:"Account avatar"}>
   {letters||<UserRound size={size==="large"?34:19} aria-hidden="true"/>}
  </div>
  <AvatarRing className="un-profile-avatar-ring"/>
  {verified&&<AvatarIcon className="un-profile-avatar-verified" title="Email verified"><Check size={size==="large"?15:11} strokeWidth={2.8}/></AvatarIcon>}
 </AvatarExtended>;
}
