// Explicit one-batch operator command. Never invoked by the frontend or build.
import {backendServiceClient} from './backend-service-client.mjs';
import {processNotificationOutbox} from '../lib/jobs/outbox.ts';
import {createNotificationEmailHandler} from '../lib/jobs/email-delivery.ts';

async function main(){
 if(process.argv.slice(2).join(' ')!=='--once'||process.env.ENABLE_NOTIFICATION_EMAIL_DELIVERY!=='true')
  throw new Error('Worker not enabled');
 const {RESEND_API_KEY:apiKey,
  NOTIFICATION_EMAIL_FROM:from,APP_ORIGIN:appUrl}=process.env;
 if(!apiKey||!from||!appUrl)throw new Error('Worker configuration missing');
 const client=backendServiceClient();
 const rpc=(name,args)=>client.rpc(name,args);
 const handler=createNotificationEmailHandler({rpc,apiKey,from,appUrl});
 const stats=await processNotificationOutbox({rpc,handler,timeoutMs:20000});
 console.log(JSON.stringify({worker:'notification-outbox',...stats}));
 if(stats.failed||stats.leaseLost)process.exitCode=1;
}
try{await main();}catch{
 console.error('Notification worker unavailable. Check private configuration, migrations and provider status.');
 process.exitCode=1;
}
