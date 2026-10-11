import {createHash} from "node:crypto";
import {readFile,readdir} from "node:fs/promises";
import {resolve,dirname} from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";
import {parsePublicSupabaseConfig} from "../lib/supabase/config.ts";
import {FRONTEND_PREVIEW} from "../lib/auth/frontend-preview.ts";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../../..");
const flags=["ENABLE_MARKETPLACE_WRITES","ENABLE_MARKETPLACE_INTERACTIONS",
  "ENABLE_MARKETPLACE_USER_ACTIONS","ENABLE_RENTAL_OPERATIONS","ENABLE_SALE_TRANSACTIONS"];

/** Offline inventory only: never contacts a provider, executes SQL or prints keys. */
export async function backendReadiness({repoRoot=root,env=process.env,preview=FRONTEND_PREVIEW}={}) {
  const directory=resolve(repoRoot,"supabase/migrations");
  const names=(await readdir(directory)).filter(name=>/^\d{14}_[a-z0-9_]+\.sql$/.test(name)).sort();
  if(names.length===0)throw new Error("No ordered backend migrations found");
  if(new Set(names.map(name=>name.slice(0,14))).size!==names.length)
    throw new Error("Duplicate migration timestamp");
  const migrations=await Promise.all(names.map(async name=>({
    file:name,sha256:createHash("sha256").update(await readFile(resolve(directory,name))).digest("hex"),
  })));
  const publicConfigValid=Boolean(parsePublicSupabaseConfig(
    env.NEXT_PUBLIC_SUPABASE_URL,env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ));
  const featureFlags=Object.fromEntries(flags.map(name=>[name,env[name]==="true"]));
  const blockers=["Hosted migration state has not been verified",
    "Hosted Auth/email/campus/Storage/RPC end-to-end evidence is required",
    "Operational rate limits, async delivery and recovery require verification"];
  if(!publicConfigValid)blockers.unshift("Valid public Supabase configuration is missing");
  if(preview)blockers.unshift("Frontend preview navigation is enabled");
  return {assessment:"not_verified",scope:"offline_source_and_configuration_only",
    publicConfigValid,frontendPreview:preview,featureFlags,migrations,blockers};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const args=process.argv.slice(2);
  if(args.some(arg=>arg!=="--release-check")){
    console.error("Usage: node --experimental-strip-types scripts/backend-readiness.mjs [--release-check]");
    process.exitCode=2;
  }else{
    try{
      const result=await backendReadiness();
      console.log(JSON.stringify(result,null,2));
      if(args.includes("--release-check"))process.exitCode=1;
    }catch{
      // Do not echo exceptions containing environment or provider values.
      console.error("Backend inventory could not be read. Check migration files and permissions.");
      process.exitCode=2;
    }
  }
}
