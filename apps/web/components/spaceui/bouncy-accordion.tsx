/* Adapted from Space UI Bouncy Accordion (MIT); geometry and spring preserved.
 * Native buttons, inert closed panels and reduced-motion support for UNILOOP.
 * https://www.spaceui.one/components/bouncy-accordion */
"use client";
import {useId,useState,type ReactNode} from "react";
import {motion,useReducedMotion} from "motion/react";
import {ChevronDown} from "lucide-react";
import {useAutoHeight} from "@/hooks/spaceui/use-auto-height";
type Item={title:string;description:ReactNode};
function Row({item,id,open,top,bottom,toggle}:{item:Item;id:string;open:boolean;top:boolean;bottom:boolean;toggle:()=>void}){
 const {ref,height}=useAutoHeight();const reduced=useReducedMotion();
 const transition=reduced?{duration:0}:{type:"spring" as const,stiffness:300,damping:20};
 return <motion.li initial={false} animate={{marginBlock:open?10:0,borderTopLeftRadius:top?16:0,borderTopRightRadius:top?16:0,borderBottomLeftRadius:bottom?16:0,borderBottomRightRadius:bottom?16:0}} transition={transition} className="ul-bouncy-row">
   <button id={id+"-trigger"} type="button" aria-expanded={open} aria-controls={id} onClick={toggle}><span>{item.title}</span><ChevronDown size={17} aria-hidden="true"/></button>
   <motion.div id={id} role="region" aria-labelledby={id+"-trigger"} aria-hidden={!open} inert={!open} initial={false} animate={{height:open?height:0}} transition={transition} className="ul-bouncy-panel"><div ref={ref}><p>{item.description}</p></div></motion.div>
 </motion.li>;
}
export function BouncyAccordion({items}:{items:Item[]}){
 const [active,setActive]=useState<number|null>(0);const id=useId();
 return <ul className="ul-bouncy-accordion">{items.map((item,index)=><Row key={item.title} item={item} id={id+"-"+index} open={active===index} top={index===0||active===index||active===index-1} bottom={index===items.length-1||active===index||active===index+1} toggle={()=>setActive(active===index?null:index)}/>)}</ul>;
}
