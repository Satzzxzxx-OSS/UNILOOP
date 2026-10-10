/**
 * Production-build HTTP smoke tests; do not require a live Supabase project.
 * This validates honest logged-out behavior, safe 404s and response headers.
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const appRoot = fileURLToPath(new URL("../", import.meta.url));
const nextScript = path.join(appRoot, "node_modules/next/dist/bin/next");
const port = 3177;
const base = "http://127.0.0.1:" + port;
const server = spawn(process.execPath, [nextScript, "start", "-p", String(port),"-H","127.0.0.1"], {
  cwd: appRoot,
  env: {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "",
    ENABLE_MARKETPLACE_WRITES: "false",
    ENABLE_MARKETPLACE_INTERACTIONS: "false",
    ENABLE_MARKETPLACE_USER_ACTIONS: "false",
    ENABLE_RENTAL_OPERATIONS: "false",
    ENABLE_SALE_TRANSACTIONS: "false",
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let serverOutput = "";
server.stdout.on("data", data => {serverOutput += data.toString();});
server.stderr.on("data", data => {serverOutput += data.toString();});
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

try {
  let ready = false;
  for (let i=0;i<50;i++) {
    if (server.exitCode !== null) throw new Error("Next server exited: " + serverOutput);
    try {
      const response = await fetch(base + "/", { signal: AbortSignal.timeout(1700) });
      if (response.ok) {ready=true;break;}
    } catch { /* start is in progress */ }
    await sleep(400);
  }
  if (!ready) throw new Error("Next server not reachable: " + serverOutput);

  const pages = [
    ["/",200],["/login",200],["/signup",200],["/account",200],["/account?mode=signup",200],["/help",200],["/safety",200],
    ...["/dashboard","/explore?mode=buy","/explore?mode=rent","/post","/saved","/settings","/inbox","/offers","/rent/post","/rentals","/transactions","/notifications","/my/listings","/rent/my","/listing/not-a-uuid","/rent/not-a-uuid"].map(route=>[route,307]),
    ["/admin/reports",404],
  ];
  for(const [route,expected] of pages){
    const response = await fetch(base + route, {redirect:"manual"});
    assert.equal(response.status,expected,route+" response status");
    assert.equal(response.headers.get("x-content-type-options"),"nosniff");
    assert.equal(response.headers.get("x-frame-options"),"DENY");
    assert.equal(response.headers.get("referrer-policy"),"no-referrer");
    if(expected===307){assert.equal(new URL(response.headers.get("location"),base).pathname,"/account");assert.match(response.headers.get("cache-control"),/no-store/);}
    if(expected===200){
      const html = await response.text();
      assert.match(html,/UNILOOP|UNI/,"Expected brand/page chrome at "+route);
    }
  }
  const auth = await fetch(base+"/auth/confirm?type=email&token_hash=invalid",
    {redirect:"manual"});
  assert.equal(auth.status,303,"Malformed auth link must not authenticate");
  assert.equal(new URL(auth.headers.get("location"),base).pathname,"/account");

  const robots = await fetch(base+"/robots.txt");
  assert.equal(robots.status,200);
  assert.match(await robots.text(),/Disallow:\s*\//i);
  console.log("HTTP smoke verified: "+pages.length+" routes, auth denial, security headers, robots.");
} finally {
  server.kill("SIGTERM");
}
