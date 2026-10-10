/* Space UI Avatar Extended — locally generated initials, no external avatar API.
 * Visual status icon is decorative; eligibility is rendered separately from real data. */
import {Sparkles} from "lucide-react";
import {AvatarExtended,AvatarRing,AvatarIcon} from "@/components/spaceui/avatar-extended";

export function AccountAvatar({name,size="md"}:{name:string;size?:"sm"|"md"|"lg"}){
 const parts=name.trim().split(/\s+/).filter(Boolean);
 const initials=parts.length>1?(parts[0][0]+parts[parts.length-1][0]):(parts[0]??"U").slice(0,2);
 return <AvatarExtended className={"ul-profile-avatar ul-profile-avatar-"+size}>
   <span className="ul-profile-avatar-core" aria-label={"Avatar for "+name}>{initials.toLocaleUpperCase()}</span>
   <AvatarRing className="ul-profile-avatar-ring"/>
   <AvatarIcon className="ul-profile-avatar-accent"><Sparkles aria-hidden="true" size={size==="lg"?14:10}/></AvatarIcon>
 </AvatarExtended>;
}
