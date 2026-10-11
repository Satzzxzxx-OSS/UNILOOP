import {timingSafeEqual} from "node:crypto";
/** Authenticate before loading a service client or disclosing health. */
export function authorizedJobRequest(header:string|null,secret:string|undefined){
 if(!secret||secret.length<32||secret.length>256||/\s/.test(secret)||!header)return false;
 const expected=Buffer.from("Bearer "+secret),actual=Buffer.from(header);
 return actual.length===expected.length&&timingSafeEqual(actual,expected);
}
