/* Adapted Space UI useAutoHeight (MIT): ResizeObserver measurement with RAF cleanup. */
"use client";
import {useLayoutEffect,useRef,useState} from "react";
export function useAutoHeight(){
  const ref=useRef<HTMLDivElement>(null);
  const [height,setHeight]=useState(0);
  useLayoutEffect(()=>{
    const element=ref.current;if(!element)return;
    let frame=0;
    const measure=()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>setHeight(Math.ceil(element.getBoundingClientRect().height)));};
    measure();const observer=new ResizeObserver(measure);observer.observe(element);
    return ()=>{cancelAnimationFrame(frame);observer.disconnect();};
  },[]);
  return {ref,height};
}
