import {randomUUID} from "node:crypto";

export type NotificationEvent={
 event_id:string;event_type:"notification.created";
 payload:{notification_id:string;user_id:string;category:string};
 lease_token:string;attempts:number;
};
type RpcResult={data:unknown;error:unknown};
type Rpc=(name:string,args:Record<string,unknown>)=>PromiseLike<RpcResult>;
export type NotificationEventHandler=(event:NotificationEvent,context:{
 idempotencyKey:string;signal:AbortSignal;
})=>Promise<void>;

/** Server-only worker protocol. The operator supplies the delivery adapter;
 * acknowledged means the adapter completed, never proof of delivered email.
 * Transport must honor cancellation and use the stable event id for deduplication. */
export async function processNotificationOutbox({rpc,handler,timeoutMs=15000}:{
 rpc:Rpc;handler:NotificationEventHandler;timeoutMs?:number;
}){
 if(typeof handler!=="function"||!Number.isInteger(timeoutMs)||timeoutMs<1||timeoutMs>30000)
  throw new Error("An outbox handler and bounded timeout are required");
 const stats={claimed:0,acknowledged:0,failed:0,leaseLost:0};
 let claimed:RpcResult;
 try{claimed=await rpc("claim_notification_events",{requested_worker:randomUUID(),batch_size:5});}
 catch{throw new Error("Outbox claim failed");}
 if(claimed.error||!Array.isArray(claimed.data))throw new Error("Outbox claim failed");
 const jobs=claimed.data as NotificationEvent[];
 stats.claimed=jobs.length;
 await Promise.all(jobs.map(async job=>{
  const controller=new AbortController();
  let timer:ReturnType<typeof setTimeout>|undefined;
  let failure:"internal"|"timeout"|null=null;
  try{
   await Promise.race([
    Promise.resolve().then(()=>handler(job,{idempotencyKey:job.event_id,signal:controller.signal})),
    new Promise<never>((_,reject)=>{
     timer=setTimeout(()=>{failure="timeout";controller.abort();reject(new Error("Handler timeout"));},timeoutMs);
    }),
   ]);
  }catch{failure??="internal";}
  finally{if(timer)clearTimeout(timer);}
  if(failure){
   try{
    const result=await rpc("fail_notification_event",{
     requested_event:job.event_id,requested_lease:job.lease_token,error_code:failure,
    });
    if(!result.error&&result.data===true)stats.failed++;
    else stats.leaseLost++;
   }catch{stats.leaseLost++;}
   return;
  }
  // An uncertain ACK must not be converted to a definitive delivery failure.
  // An expired lease may retry; a real adapter therefore needs idempotency.
  try{
   const result=await rpc("acknowledge_notification_event",{
    requested_event:job.event_id,requested_lease:job.lease_token,
   });
   if(!result.error&&result.data===true)stats.acknowledged++;
   else stats.leaseLost++;
  }catch{stats.leaseLost++;}
 }));
 return stats;
}
