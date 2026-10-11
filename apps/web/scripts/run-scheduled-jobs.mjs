// External scheduler entry point. Never runs during app build.
const {APP_ORIGIN,CRON_SECRET}=process.env;
try{
 const origin=new URL(APP_ORIGIN??"");
 if(origin.protocol!=="https:"||origin.pathname!=="/"||origin.search||origin.hash||origin.username||origin.password||!CRON_SECRET||CRON_SECRET.length<32)throw Error();
 async function run(job){
  const response=await fetch(origin.origin+"/api/jobs/"+job,{headers:{Authorization:"Bearer "+CRON_SECRET},redirect:"error",signal:AbortSignal.timeout(55000)});
  if(!response.ok)throw Error();
  const data=await response.json();
  console.log(JSON.stringify({job,status:response.status}));
  return data;
 }
 if(process.env.ENABLE_NOTIFICATION_EMAIL_DELIVERY==="true"){
  for(let batch=0;batch<5;batch++){
   const data=await run("notifications");
   if(!Number.isInteger(data.claimed)||data.claimed<0||data.claimed>5)throw Error();
   if(data.claimed<5)break;
  }
 }
 await run("maintenance");
 await run("health");
}catch{
 console.error("Scheduled backend check failed. Review deployment, private configuration and worker health.");
 process.exitCode=1;
}
