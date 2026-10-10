/* Identity avatar using Space UI's MIT Avatar Extended building blocks.
 * No remote image fetch, generated status or third-party identity API. */
import Image from "next/image";
import {Check} from "lucide-react";
import {AvatarExtended,AvatarRing,AvatarIcon} from "@/components/spaceui/avatar-extended";

export function ProfileAvatar({name,verified=false,size="medium"}:{
 name:string;verified?:boolean;size?:"small"|"medium"|"large";
}){
 return <AvatarExtended className={`un-profile-avatar un-profile-avatar-${size}`} data-testid="profile-spaceui-avatar">
  <div className="un-profile-avatar-face" role="img" aria-label={name?"Account avatar for "+name:"Account avatar"}>
   <Image src="/avatars/spaceui-squishmoji.svg" alt="" width={120} height={120} className="un-profile-squishmoji"/>
  </div>
  <AvatarRing className="un-profile-avatar-ring"/>
  {verified&&<AvatarIcon className="un-profile-avatar-verified" title="Email verified"><Check size={size==="large"?15:11} strokeWidth={2.8}/></AvatarIcon>}
 </AvatarExtended>;
}
