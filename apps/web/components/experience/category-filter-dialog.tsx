"use client";

import Link from "next/link";
import {useState} from "react";
import {Button} from "@/components/spaceui/button";
import {Dialog,DialogTrigger,DialogPopup,DialogTitle,DialogDescription} from "@/components/spaceui/dialog";
import {ExperienceIcon} from "./experience-header";

export function CategoryFilterDialog({options}:{options:{label:string;href:string;active:boolean}[]}){
  const [open,setOpen]=useState(false);
  return <Dialog open={open} onOpenChange={setOpen}>
    <DialogTrigger render={<Button variant="outline" className="ux-category-dialog-trigger"/>}>
      <ExperienceIcon name="grid" size={17}/> Categories
    </DialogTrigger>
    <DialogPopup className="ux-category-dialog" bottomStickOnMobile={false}>
      <DialogTitle>Browse categories</DialogTitle>
      <DialogDescription>Choose a category. Your search and marketplace mode stay selected.</DialogDescription>
      <nav className="ux-filter-list" aria-label="Mobile browse categories">
        {options.map(option=><Link key={option.href} href={option.href}
          aria-current={option.active?"page":undefined}
          className={option.active?"ux-filter-current":""}
          onClick={()=>setOpen(false)}>{option.label}</Link>)}
      </nav>
    </DialogPopup>
  </Dialog>;
}
