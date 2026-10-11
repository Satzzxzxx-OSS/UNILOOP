import {processNotificationOutbox} from "@/lib/jobs/outbox";
import {createNotificationEmailHandler} from "@/lib/jobs/email-delivery";
import {authorizedJobRequest} from "@/lib/jobs/cron-auth";
import {backendServiceClient} from "@/lib/jobs/service-client";
export const runtime="nodejs";
export const dynamic="force-dynamic";
export const maxDuration=60;
const headers={"Cache-Control":"private, no-store"};
export async function GET(request:Request){
 if(!authorizedJobRequest(request.headers.get("authorization"),process.env.CRON_SECRET))
  return Response.json({error:"Unauthorized"},{status:401,headers});
 if(process.env.ENABLE_NOTIFICATION_EMAIL_DELIVERY!=="true")return Response.json({state:"disabled"},{status:503,headers});
 try{
 const client=backendServiceClient();
 const rpc=(name:string,args:Record<string,unknown>)=>client.rpc(name,args);
 const handler=createNotificationEmailHandler({rpc,apiKey:process.env.RESEND_API_KEY??"",from:process.env.NOTIFICATION_EMAIL_FROM??"",appUrl:process.env.APP_ORIGIN??""});
 const stats=await processNotificationOutbox({rpc,handler,timeoutMs:20000});
 return Response.json(stats,{status:stats.failed||stats.leaseLost?503:200,headers});
 }catch{return Response.json({error:"Job unavailable"},{status:503,headers});}
}

export function HEAD(){return new Response(null,{status:405,headers:{"Cache-Control":"private, no-store"}});}
