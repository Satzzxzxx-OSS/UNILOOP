/* Space UI Avatar Extended concept (MIT, https://www.spaceui.one/components/avatar-extended)
 * Adapted for a fully local UNILOOP brand avatar. No external avatar API calls.
 * License: docs/licenses/SPACE-UI-MIT.txt. */
import type {HTMLAttributes,ReactNode} from "react";
import {cn} from "@/lib/spaceui-utils";

export function AvatarExtended({children,className,...props}:HTMLAttributes<HTMLDivElement>){
  return <div className={cn("relative inline-flex",className)} {...props}>{children}</div>;
}
export function AvatarRing({className,...props}:HTMLAttributes<HTMLSpanElement>){
  return <span data-slot="avatar-ring" className={cn("pointer-events-none absolute inset-0 rounded-full",className)} aria-hidden="true" {...props}/>;
}
export function AvatarIcon({children,className,...props}:HTMLAttributes<HTMLSpanElement>&{children:ReactNode}){
  return <span data-slot="avatar-icon" className={cn("absolute bottom-0 right-0 inline-flex items-center justify-center",className)} aria-hidden="true" {...props}>{children}</span>;
}
