import assert from "node:assert/strict";
import test from "node:test";
import {mkdtemp,mkdir,writeFile,rm} from "node:fs/promises";
import {tmpdir} from "node:os";
import {join} from "node:path";
import {backendReadiness} from "../scripts/backend-readiness.mjs";

test("filled configuration and enabled flags never substitute for hosted evidence",async()=>{
  const env={NEXT_PUBLIC_SUPABASE_URL:"https://example.test",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_publishable_DO_NOT_PRINT_ME",
    ENABLE_MARKETPLACE_WRITES:"true",ENABLE_RENTAL_OPERATIONS:"TRUE",
    SUPABASE_SERVICE_ROLE_KEY:"sb_secret_DO_NOT_PRINT_ME"};
  const result=await backendReadiness({env,preview:false});
  assert.equal(result.publicConfigValid,true);
  assert.equal(result.assessment,"not_verified");
  assert.equal(result.featureFlags.ENABLE_MARKETPLACE_WRITES,true);
  assert.equal(result.featureFlags.ENABLE_RENTAL_OPERATIONS,false);
  assert.ok(result.blockers.some(item=>item.includes("end-to-end")));
  assert.equal(JSON.stringify(result).includes("DO_NOT_PRINT_ME"),false);
});

test("secret-shaped client configuration fails closed and preview remains visible",async()=>{
  const result=await backendReadiness({env:{NEXT_PUBLIC_SUPABASE_URL:"https://example.test",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"sb_secret_NOT_A_PUBLIC_KEY"},preview:true});
  assert.equal(result.publicConfigValid,false);
  assert.equal(result.frontendPreview,true);
  assert.equal(JSON.stringify(result).includes("NOT_A_PUBLIC_KEY"),false);
  assert.ok(result.blockers.some(item=>item.includes("preview")));
});

test("inventory hashes ordered migrations and excludes historical SQL and fixtures",async()=>{
  const repoRoot=await mkdtemp(join(tmpdir(),"uniloop-readiness-"));
  try{
    const dir=join(repoRoot,"supabase/migrations");
    await mkdir(dir,{recursive:true});
    await writeFile(join(dir,"20261011000002_second.sql"),"select 2;");
    await writeFile(join(dir,"20261011000001_first.sql"),"select 1;");
    await writeFile(join(dir,"uniloop_completeALL.sql"),"historical SQL");
    const first=await backendReadiness({repoRoot,env:{},preview:false});
    assert.deepEqual(first.migrations.map(item=>item.file),[
      "20261011000001_first.sql","20261011000002_second.sql"]);
    await writeFile(join(dir,"20261011000001_first.sql"),"select 3;");
    const second=await backendReadiness({repoRoot,env:{},preview:false});
    assert.notEqual(first.migrations[0].sha256,second.migrations[0].sha256);
    await writeFile(join(dir,"20261011000001_conflict.sql"),"select 4;");
    await assert.rejects(()=>backendReadiness({repoRoot}),/Duplicate migration/);
  }finally{await rm(repoRoot,{recursive:true,force:true});}
});
