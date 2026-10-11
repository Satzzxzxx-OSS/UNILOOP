import {createClient} from '@supabase/supabase-js';
import {parseBackendServiceConfig} from '../lib/jobs/service-config.ts';

export function backendServiceClient(env=process.env){
 const {url,key}=parseBackendServiceConfig(env);
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
  global:{fetch:async(input,init)=>fetch(input,{...init,redirect:'error',signal:AbortSignal.timeout(10000)})}});
}
