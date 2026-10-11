import assert from "node:assert/strict";
import test from "node:test";
import {persistDisplayName} from "../lib/trust/profile.ts";

function clientWith(result){
  const query={update:()=>query,eq:()=>query,select:()=>query,maybeSingle:async()=>result};
  return {from:()=>query};
}
test("RLS zero-row profile update cannot claim success",async()=>{
  assert.equal(await persistDisplayName(clientWith({data:null,error:null}),"owner","Alex"),false);
});
test("profile save requires the owned returned row and no database error",async()=>{
  assert.equal(await persistDisplayName(clientWith({data:{id:"owner"},error:null}),"owner","Alex"),true);
  assert.equal(await persistDisplayName(clientWith({data:{id:"other"},error:null}),"owner","Alex"),false);
  assert.equal(await persistDisplayName(clientWith({data:null,error:{code:"42501"}}),"owner","Alex"),false);
});
