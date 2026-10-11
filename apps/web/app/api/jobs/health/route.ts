import {authorizedJobRequest} from "@/lib/jobs/cron-auth";
import {backendServiceClient} from "@/lib/jobs/service-client";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:Request){
 if(!authorizedJobRequest(request.headers.get("authorization"),process.env.CRON_SECRET))
  return Response.json({error:"Unauthorized"},{status:401,headers});
 try{
 const {data,error}=await backendServiceClient().rpc("get_backend_job_health");
 const fields=["pending","leased","expired_leases","dead","oldest_pending_age_seconds"];
 if(error||!data||fields.some(k=>!Number.isSafeInteger(data[k])||data[k]<0))throw Error();
 const healthy=!data.dead&&!data.expired_leases&&data.oldest_pending_age_seconds<=3600;
 return Response.json({scope:"outbox_only",healthy,...Object.fromEntries(fields.map(k=>[k,data[k]]))},{status:healthy?200:503,headers});
 }catch{return Response.json({error:"Health unavailable"},{status:503,headers});}
}

export function HEAD(){return new Response(null,{status:405,headers:{"Cache-Control":"private, no-store"}});}
