"use client";
import type {ReactNode} from "react";
import {motion,useReducedMotion} from "motion/react";

/** Lightweight first-view animation; honors reduced-motion system setting. */
export function ExperienceReveal({children,delay=0,className=""}:{
 children:ReactNode;delay?:number;className?:string;
}){
 const reduced=useReducedMotion();
 return <motion.div className={className}
   initial={reduced?false:{opacity:0,y:18}}
   whileInView={reduced?undefined:{opacity:1,y:0}}
   viewport={{once:true,amount:0.08}}
   transition={{duration:0.53,delay,ease:[0.22,1,0.36,1]}}>
   {children}
 </motion.div>;
}
