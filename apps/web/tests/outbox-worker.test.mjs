import assert from "node:assert/strict";
import test from "node:test";
import {processNotificationOutbox} from "../lib/jobs/outbox.ts";

const event={event_id:"aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa",event_type:"notification.created",
 payload:{notification_id:"bbbbbbbb-1111-4111-8111-bbbbbbbbbbbb",user_id:"cccccccc-1111-4111-8111-cccccccccccc",category:"message"},
 lease_token:"dddddddd-1111-4111-8111-dddddddddddd",attempts:1};
function rpcWith(handler){return async(name,args)=>name==="claim_notification_events"
 ?{data:[event],error:null}:handler(name,args);}

test("worker acknowledges only after handler completion with stable idempotency key",async()=>{
 let handled=false;
 const stats=await processNotificationOutbox({handler:async(job,context)=>{
  assert.equal(job.event_id,event.event_id);assert.equal(context.idempotencyKey,event.event_id);
  assert.equal(context.signal.aborted,false);handled=true;
 },rpc:rpcWith(async(name,args)=>{
  assert.equal(handled,true);assert.equal(name,"acknowledge_notification_event");
  assert.equal(args.requested_lease,event.lease_token);return {data:true,error:null};
 })});
 assert.deepEqual(stats,{claimed:1,acknowledged:1,failed:0,leaseLost:0});
});
test("handler failure records a fixed code without persisting sensitive exception text",async()=>{
 const stats=await processNotificationOutbox({handler:async()=>{throw new Error("secret email/key");},
  rpc:rpcWith(async(name,args)=>{
   assert.equal(name,"fail_notification_event");assert.equal(args.error_code,"internal");
   assert.equal(JSON.stringify(args).includes("secret"),false);return {data:true,error:null};
  })});
 assert.equal(stats.failed,1);assert.equal(stats.acknowledged,0);
});
test("handler deadline cancels its signal and does not acknowledge",async()=>{
 let signal;
 const stats=await processNotificationOutbox({timeoutMs:5,handler:async(_job,context)=>{
  signal=context.signal;await new Promise(()=>{});
 },rpc:rpcWith(async(name,args)=>{
  assert.equal(name,"fail_notification_event");assert.equal(args.error_code,"timeout");
  return {data:true,error:null};
 })});
 assert.equal(signal.aborted,true);assert.equal(stats.failed,1);
});
test("uncertain or stale acknowledgement never creates a false success or failure update",async()=>{
 let calls=0;
 const stats=await processNotificationOutbox({handler:async()=>{},rpc:rpcWith(async(name)=>{
  calls++;assert.equal(name,"acknowledge_notification_event");return {data:false,error:null};
 })});
 assert.equal(calls,1);assert.equal(stats.leaseLost,1);assert.equal(stats.acknowledged,0);
});
test("unconfigured worker rejects before claiming work",async()=>{
 let called=false;
 await assert.rejects(()=>processNotificationOutbox({handler:undefined,rpc:async()=>{
  called=true;return {data:[],error:null};
 }}),/handler/);
 assert.equal(called,false);
});
