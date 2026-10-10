"use client";

import {Input} from "@/components/spaceui/input";

import { useState } from "react";
import Link from "next/link";
import { ExperienceIcon } from "./experience-header";
import {Button} from "@/components/spaceui/button";

export function ExperienceSearch(){
  const [mode,setMode]=useState<"buy"|"rent">("buy");
  return <div className="ux-search-module">
    <fieldset className="ux-search-mode">
      <legend className="ux-visually-hidden">What would you like to do?</legend>
      <label className={mode==="buy"?"ux-mode-selected":""}>
        <input type="radio" form="ux-home-query" name="mode" value="buy"
          checked={mode==="buy"} onChange={()=>setMode("buy")}/>
        Buy something
      </label>
      <label className={mode==="rent"?"ux-mode-selected":""}>
        <input type="radio" form="ux-home-query" name="mode" value="rent"
          checked={mode==="rent"} onChange={()=>setMode("rent")}/>
        Rent something
      </label>
    </fieldset>
    <form id="ux-home-query" action="/explore" role="search" className="ux-search-form">
      <div className="ux-search-input-wrap">
        <ExperienceIcon name="search" size={23}/>
        <label htmlFor="ux-home-search" className="ux-visually-hidden">Search items</label>
        <Input nativeInput unstyled id="ux-home-search" type="search" name="q" maxLength={100}
          placeholder={mode==="buy"?"Search books, devices, essentials...":"What would you like to borrow?"}/>
      </div>
      <Button type="submit" size="xl" className="ux-search-submit">Explore <ExperienceIcon name="arrow" size={19}/></Button>
    </form>
    <div className="ux-search-hints">
      <span>Quick start</span>
      <Link href="/explore?mode=buy&category=books-study">Books</Link>
      <Link href="/explore?mode=buy&category=mobiles-gadgets">Gadgets</Link>
      <Link href="/explore?mode=rent&category=cameras-creative">Creative gear</Link>
    </div>
  </div>;
}
