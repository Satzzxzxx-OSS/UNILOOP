"use client";
import type {ReactNode} from "react";
import {motion,useReducedMotion} from "motion/react";

/** Progressive enhancement: content is visible during SSR and reduced-motion hydration. */
export function ExperienceReveal({children,delay=0,className=""}:{
 children:ReactNode;delay?:number;className?:string;
}){
 const reduced=useReducedMotion();
 return <motion.div className={className}
   initial={false}
   whileInView={reduced?undefined:{y:[12,0]}}
   viewport={{once:true,amount:0.08}}
   transition={{duration:0.53,delay,ease:[0.22,1,0.36,1]}}>
   {children}
 </motion.div>;
}
