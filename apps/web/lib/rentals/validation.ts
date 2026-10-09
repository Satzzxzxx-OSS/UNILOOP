import { parseCategory } from "../catalog.ts";

export type RentalInput={
  title:string;description:string;category_slug:string;
  daily_rate_inr:number;refundable_deposit_inr:number;
  min_days:number;max_days:number;
  item_condition:"new"|"like_new"|"good"|"fair";
};
export type RentalParseResult={ok:true;value:RentalInput}|{ok:false;error:string};

function rupees(raw:unknown, allowZero:boolean, ceiling:number):number|null{
  if(typeof raw!=="string"||!new RegExp(allowZero?"^(0|[1-9][0-9]*)$":"^[1-9][0-9]*$").test(raw))
    return null;
  const parsed=Number(raw);
  return Number.isSafeInteger(parsed)&&parsed<=ceiling ? parsed : null;
}
function days(raw:unknown):number|null{
  if(typeof raw!=="string"||!/^[1-9]\d?$/.test(raw)) return null;
  const value=Number(raw);
  return value<=90?value:null;
}
export function parseRentalInput(input:{
  title?:unknown;description?:unknown;category?:unknown;
  daily_rate?:unknown;deposit?:unknown;min_days?:unknown;
  max_days?:unknown;condition?:unknown;
}):RentalParseResult{
  const title=typeof input.title==="string"?input.title.trim():"";
  const description=typeof input.description==="string"?input.description.trim():"";
  const category=parseCategory(input.category);
  const daily=rupees(input.daily_rate,false,1000000);
  const deposit=rupees(input.deposit,true,10000000);
  const min=days(input.min_days), max=days(input.max_days);
  const condition=input.condition;
  if(title.length<8||title.length>120) return {ok:false,error:"Item title must be 8–120 characters."};
  if(description.length<20||description.length>5000)
    return {ok:false,error:"Description must be 20–5000 characters."};
  if(!category) return {ok:false,error:"Choose a valid category."};
  if(daily===null||deposit===null)
    return {ok:false,error:"Daily rate/deposit must be valid whole rupees."};
  if(min===null||max===null||min>max)
    return {ok:false,error:"Choose a valid minimum and maximum rental duration."};
  if(condition!=="new"&&condition!=="like_new"&&condition!=="good"&&condition!=="fair")
    return {ok:false,error:"Choose a valid condition."};
  return {ok:true,value:{
    title,description,category_slug:category,daily_rate_inr:daily,
    refundable_deposit_inr:deposit,min_days:min,max_days:max,
    item_condition:condition,
  }};
}
export function isCalendarDate(value:unknown):value is string{
  if(typeof value!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date=new Date(value+"T00:00:00.000Z");
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0,10)===value;
}
export function parseRentalDecision(value:unknown):"approve"|"decline"|"cancel"|"confirm_handover"|"confirm_return"|null{
  return value==="approve"||value==="decline"||value==="cancel"||
    value==="confirm_handover"||value==="confirm_return"?value:null;
}
export type RentalActionState={message:string};
export const initialRentalAction:RentalActionState={message:""};
