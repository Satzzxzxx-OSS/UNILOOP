export function isStars(value:unknown):value is number{
  return typeof value==="number"&&Number.isInteger(value)&&value>=1&&value<=5;
}
export function parseStars(value:unknown):number|null{
  if(typeof value!=="string"||!/^[1-5]$/.test(value))return null;
  return Number(value);
}
export function parseReviewText(value:unknown):string|null{
  if(typeof value!=="string")return null;
  const text=value.trim();
  return text.length>=15&&text.length<=1000?text:null;
}
export type SaleActionState={message:string};
export const initialSaleAction:SaleActionState={message:""};
