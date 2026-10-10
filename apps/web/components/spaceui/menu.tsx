/* Adapted from Space UI's public MIT Menu primitive:
 * https://www.spaceui.one/primitives/menu
 * Based on @base-ui/react/menu with focus management and keyboard navigation.
 * License: docs/licenses/SPACE-UI-MIT.txt. */
"use client";
import {Menu as Primitive} from "@base-ui/react/menu";
import type * as React from "react";
import {cn} from "@/lib/spaceui-utils";

type StaticClassName<P>=Omit<P,"className">&{className?:string};
export const Menu:typeof Primitive.Root=Primitive.Root;
export function MenuTrigger({className,...props}:Primitive.Trigger.Props):React.ReactElement{
 return <Primitive.Trigger data-slot="menu-trigger" className={className} {...props}/>;
}
export function MenuPopup({className,children,side="top",align="start",sideOffset=10,...props}:StaticClassName<Primitive.Popup.Props> & {
 side?:Primitive.Positioner.Props["side"];
 align?:Primitive.Positioner.Props["align"];
 sideOffset?:Primitive.Positioner.Props["sideOffset"];
}):React.ReactElement{
 return <Primitive.Portal><Primitive.Positioner side={side} align={align} sideOffset={sideOffset} className="z-[100]" data-slot="menu-positioner">
  <Primitive.Popup className={cn("ul-space-menu-popup",className)} data-slot="menu-popup" {...props}>
   <div className="ul-space-menu-scroll">{children}</div>
  </Primitive.Popup>
 </Primitive.Positioner></Primitive.Portal>;
}
export function MenuLinkItem({className,...props}:StaticClassName<Primitive.LinkItem.Props>):React.ReactElement{
 return <Primitive.LinkItem data-slot="menu-link-item" className={cn("ul-space-menu-item",className)} {...props}/>;
}
export function MenuItem({className,...props}:StaticClassName<Primitive.Item.Props>):React.ReactElement{
 return <Primitive.Item data-slot="menu-item" className={cn("ul-space-menu-item",className)} {...props}/>;
}
export function MenuSeparator({className,...props}:StaticClassName<Primitive.Separator.Props>):React.ReactElement{
 return <Primitive.Separator data-slot="menu-separator" className={cn("ul-space-menu-separator",className)} {...props}/>;
}
export function MenuLabel({className,...props}:StaticClassName<Primitive.GroupLabel.Props>):React.ReactElement{
 return <Primitive.GroupLabel data-slot="menu-label" className={cn("ul-space-menu-label",className)} {...props}/>;
}
export const MenuGroup:typeof Primitive.Group=Primitive.Group;
