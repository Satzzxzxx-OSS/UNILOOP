import "server-only";
import {createClient} from "@supabase/supabase-js";
import {parseBackendServiceConfig} from "./service-config";
export function backendServiceClient(){
 const {url,key}=parseBackendServiceConfig(process.env);
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false},
 global:{fetch:(input,init)=>fetch(input,{...init,redirect:"error",signal:AbortSignal.timeout(10000)})}});
}
