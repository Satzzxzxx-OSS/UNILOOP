/* Space UI Menu primitive (MIT): https://www.spaceui.one/r/primitives-menu.json
 * Adapted for UNILOOP account menu. See docs/licenses/SPACE-UI-MIT.txt. */
"use client";

import {Menu as MenuPrimitive} from "@base-ui/react/menu";
import type React from "react";
import {cn} from "@/lib/spaceui-utils";

type StaticClassName<Props>=Omit<Props,"className">&{className?:string};

export const Menu:typeof MenuPrimitive.Root=MenuPrimitive.Root;

export function MenuTrigger(props:MenuPrimitive.Trigger.Props):React.ReactElement {
 return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props}/>;
}

export function MenuPopup({className,children,side="top",align="start",sideOffset=12,...props}:
 StaticClassName<MenuPrimitive.Popup.Props>&{
  side?:MenuPrimitive.Positioner.Props["side"];
  align?:MenuPrimitive.Positioner.Props["align"];
  sideOffset?:MenuPrimitive.Positioner.Props["sideOffset"];
 }):React.ReactElement {
 return <MenuPrimitive.Portal>
  <MenuPrimitive.Positioner side={side} align={align} sideOffset={sideOffset} className="un-profile-menu-positioner" data-slot="menu-positioner">
   <MenuPrimitive.Popup className={cn("un-profile-menu-popup",className)} data-slot="menu-popup" {...props}>
    <div className="un-profile-menu-scroll">{children}</div>
   </MenuPrimitive.Popup>
  </MenuPrimitive.Positioner>
 </MenuPrimitive.Portal>;
}

export function MenuLinkItem({className,...props}:StaticClassName<MenuPrimitive.LinkItem.Props>):React.ReactElement {
 return <MenuPrimitive.LinkItem className={cn("un-profile-menu-item",className)} data-slot="menu-link-item" {...props}/>;
}
export function MenuItem({className,...props}:StaticClassName<MenuPrimitive.Item.Props>):React.ReactElement {
 return <MenuPrimitive.Item className={cn("un-profile-menu-item",className)} data-slot="menu-item" {...props}/>;
}
export function MenuSeparator(props:MenuPrimitive.Separator.Props):React.ReactElement {
 return <MenuPrimitive.Separator className="un-profile-menu-separator" data-slot="menu-separator" {...props}/>;
}
