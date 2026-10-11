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
 const {data,error}=await backendServiceClient().rpc("prune_marketplace_write_usage",{batch_size:1000});
 if(error||!Number.isSafeInteger(data)||data<0)throw Error();
 return Response.json({pruned:data},{headers});
 }catch{return Response.json({error:"Job unavailable"},{status:503,headers});}
}

export function HEAD(){return new Response(null,{status:405,headers:{"Cache-Control":"private, no-store"}});}
