import {backendServiceClient} from './backend-service-client.mjs';
try{
 if(process.argv.length!==2)throw Error('Unexpected argument');
 const client=backendServiceClient();
 const {data,error}=await client.rpc('get_backend_job_health');
 const fields=['pending','leased','expired_leases','dead','oldest_pending_age_seconds'];
 if(error||!data||fields.some(name=>!Number.isSafeInteger(data[name])||data[name]<0))throw Error('Health unavailable');
 // Whitelist output fields, even if the provider response includes extra data.
 console.log(JSON.stringify({scope:'outbox_only',...Object.fromEntries(fields.map(name=>[name,data[name]]))}));
 if(data.dead||data.expired_leases||data.oldest_pending_age_seconds>3600)process.exitCode=1;
}catch{
 console.error('Backend job health unavailable. Check private configuration and migration state.');
 process.exitCode=1;
}
