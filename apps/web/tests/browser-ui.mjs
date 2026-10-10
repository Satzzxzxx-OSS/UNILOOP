// Production public/gate checks plus existing workspace QA against a disposable local
// provider fixture. Fixture only lives in this test process; no app auth bypass exists.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import {spawn} from 'node:child_process';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require('/tmp/uniloop-playwright/node_modules/playwright');
const base='http://127.0.0.1:3155';
const output=path.join(process.cwd(),'apps/web/test-artifacts');fs.mkdirSync(output,{recursive:true});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
async function wait(url){for(let i=0;i<90;i++){try{if((await fetch(url)).ok)return;}catch{}await delay(500);}throw Error('QA server unavailable: '+url);}
await wait(base);
let browser=await chromium.launch({headless:true,args:['--no-sandbox']});
try{
 for(const width of [320,360,390,430,768,1024,1440]){
  const page=await browser.newPage({viewport:{width,height:900},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const response=await page.goto(base,{waitUntil:'networkidle'});assert.equal(response.status(),200);
  assert(await page.getByRole('heading',{name:'Useful things. New possibilities.',exact:true}).isVisible());
  assert.equal(await page.locator('.ul-landing-category').count(),8);
  assert(await page.locator('#landing-title').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>=42),'Landing heading must not inherit compact dashboard typography');
  const primary=page.getByRole('link',{name:'Join the loop',exact:true}).first();
  assert.equal(await primary.evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)','Primary CTA text must be visible');
  assert.equal(await page.locator('.ul-sidebar').count(),0,'Landing must not expose private workspace chrome');
  assert.equal(await page.locator('.ul-metric-value').count(),0,'Landing must not fabricate dashboard counts');
  assert(await page.getByRole('link',{name:'Join the loop',exact:true}).first().isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Landing overflow at '+width);
  await page.screenshot({path:path.join(output,'landing-'+width+'.png'),fullPage:true});
  await page.getByRole('link',{name:'See how it works'}).click();
  await page.waitForURL('**/#how-it-works');
  await page.getByRole('button',{name:'How do I get into my workspace?'}).click();
  assert.equal(await page.getByRole('button',{name:'How do I get into my workspace?'}).getAttribute('aria-expanded'),'true');
  await page.getByRole('link',{name:'Create your account',exact:true}).click();
  await page.waitForURL(/\/signup/);
  assert.equal(await page.getByRole('link',{name:'Create account',exact:true}).getAttribute('aria-current'),'page');
  assert(await page.getByText('Sign-in will be available after the secure account service is connected.').isVisible());
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Account overflow at '+width);
  assert.deepEqual(errors,[],'Public JS errors at '+width);await page.close();
 }
 // Dedicated auth pages must be usable without a provider, never show fake login.
 const authRoute=await browser.newPage({viewport:{width:360,height:780},reducedMotion:'reduce'});
 for(const route of ['/login','/signup','/account?mode=signup']){
  const response=await authRoute.goto(base+route,{waitUntil:'networkidle'});
  assert.equal(response.status(),200,route+' public auth route');
  assert.equal(await authRoute.getByRole('textbox',{name:'Email address'}).count(),0,'No input without provider');
  assert.equal(await authRoute.locator('input[type="password"]').count(),0,'No fake password login');
  assert.equal(await authRoute.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'Auth overflow: '+route);
  await authRoute.screenshot({path:path.join(output,'auth-'+route.split('?')[0].replaceAll('/','-')+'.png'),fullPage:true,animations:'disabled'});
 }
 await authRoute.close();
 const denied=await browser.newPage({viewport:{width:390,height:844}});
 for(const route of ['/dashboard','/explore','/post','/rent/post','/saved','/inbox','/settings','/my/listings','/rent/my','/rentals','/offers','/transactions','/notifications']){
  await denied.goto(base+route,{waitUntil:'networkidle'});assert.equal(new URL(denied.url()).pathname,'/account',route+' requires verified session');
  assert.equal(await denied.locator('.ul-sidebar').count(),0,'No workspace chrome for guest');
 }
 await denied.context().addCookies([{name:'sb-127-auth-token',value:'fabricated-session',url:base}]);
 await denied.goto(base+'/dashboard',{waitUntil:'networkidle'});assert.equal(new URL(denied.url()).pathname,'/account','Unverified cookie cannot enter workspace');
 await denied.close();
 console.log('Production landing, onboarding and anonymous workspace gates: PASSED');
}finally{await browser.close();}

// Emulate provider protocol, not user production data. No live credentials/emails.
const user={id:'11111111-1111-4111-8111-111111111111',aud:'authenticated',role:'authenticated',email:'qa@example.test',email_confirmed_at:new Date().toISOString(),app_metadata:{provider:'email'},user_metadata:{},created_at:new Date().toISOString()};
const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
const token=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:user.id,aud:'authenticated',role:'authenticated',email:user.email,exp:Math.floor(Date.now()/1000)+3600})+'.fixture-only';
const session={access_token:token,refresh_token:'local-fixture-refresh',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
const cookie='base64-'+encode(session);let signupRequest=null,signinRequest=null;
const fixture=http.createServer(async(req,res)=>{
 res.setHeader('Access-Control-Allow-Origin','http://localhost:3158');res.setHeader('Access-Control-Allow-Headers','authorization,apikey,content-type,x-client-info,x-supabase-api-version');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');res.setHeader('Content-Type','application/json');
 if(req.method==='OPTIONS'){res.end();return;}
 let body='';for await(const part of req)body+=part;
 const url=new URL(req.url,'http://127.0.0.1:3156');
 if(url.pathname==='/auth/v1/otp'){const payload=JSON.parse(body);if(payload.create_user)signupRequest=payload;else signinRequest=payload;res.end('{}');return;}
 if(url.pathname==='/auth/v1/verify'){const payload=JSON.parse(body);if(payload.token_hash!=='a'.repeat(64)){res.statusCode=400;res.end(JSON.stringify({message:'invalid test token'}));return;}res.end(JSON.stringify(session));return;}
 if(url.pathname==='/auth/v1/user'){if(req.headers.authorization!=='Bearer '+token){res.statusCode=401;res.end(JSON.stringify({message:'unauthenticated'}));return;}res.end(JSON.stringify(user));return;}
 if(url.pathname==='/auth/v1/logout'){res.statusCode=204;res.end();return;}
 if(url.pathname.startsWith('/rest/v1/rpc/')){res.statusCode=403;res.end(JSON.stringify({code:'42501',message:'No staff access in fixture'}));return;}
 if(url.pathname.startsWith('/rest/v1/')){res.end(req.headers.accept?.includes('vnd.pgrst.object')?'null':'[]');return;}
 res.statusCode=404;res.end('{}');
});await new Promise(r=>fixture.listen(3156,'127.0.0.1',r));
const app=path.join(process.cwd(),'apps/web');
const dev=spawn(process.execPath,[path.join(app,'node_modules/next/dist/bin/next'),'dev','-p','3158','-H','127.0.0.1'],{cwd:app,env:{...process.env,NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:3156',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_local_fixture_only',ENABLE_MARKETPLACE_WRITES:'false',ENABLE_RENTAL_OPERATIONS:'false',ENABLE_MARKETPLACE_INTERACTIONS:'false',ENABLE_MARKETPLACE_USER_ACTIONS:'false',ENABLE_SALE_TRANSACTIONS:'false'},stdio:['ignore','pipe','pipe']});
const log=fs.createWriteStream('/tmp/uniloop-fixture-dev.log');dev.stdout.pipe(log);dev.stderr.pipe(log);
try{
 await wait('http://localhost:3158');
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await page.context().addCookies([{name:'sb-127-auth-token',value:'base64-'+encode({...session,access_token:token.replace('fixture-only','fixture-invalid')}),url:'http://localhost:3158'}]);
 await page.goto('http://localhost:3158/dashboard',{waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,'/account','Configured provider must reject unverified session tokens');
 await page.context().clearCookies();
 await page.goto('http://localhost:3158/signup',{waitUntil:'networkidle'});assert(await page.getByRole('heading',{name:'Create your account.'}).isVisible());
 await page.goto('http://localhost:3158/account?mode=signup',{waitUntil:'networkidle'});
 await page.getByLabel('Email address').fill('new@example.test');await page.getByRole('button',{name:'Create account by email'}).click();
 await page.getByText(/Check your inbox for a verification link/).waitFor();assert.equal(signupRequest.create_user,true,'Only signup requests enrollment');assert.equal(signupRequest.email,'new@example.test');
 assert.equal(new URL(page.url()).pathname,'/account','Requesting email alone does not authenticate');
 await page.goto('http://localhost:3158/login',{waitUntil:'networkidle'});assert(await page.getByRole('heading',{name:'Sign in to UNILOOP.'}).isVisible());await page.getByLabel('Email address').fill(user.email);await page.getByRole('button',{name:'Email me a sign-in link'}).click();
 await page.getByText(/Check your inbox for a verification link/).waitFor();assert.equal(signinRequest.create_user,false,'Sign-in must not enroll');
 await page.goto('http://localhost:3158/auth/confirm?type=email&token_hash='+'a'.repeat(64),{waitUntil:'networkidle'});
 await page.waitForURL('**/dashboard');assert(await page.getByRole('heading',{name:'Overview',exact:true}).isVisible());
 await page.goto('http://localhost:3158/',{waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,'/dashboard','Returning verified users enter workspace');
 await page.goto('http://localhost:3158/account',{waitUntil:'networkidle'});
 assert(await page.getByRole('link',{name:'Open your workspace'}).isVisible());
 await page.getByRole('button',{name:'Sign out',exact:true}).click();
 await page.getByRole('button',{name:'Email me a sign-in link'}).waitFor();
 await page.goto('http://localhost:3158/dashboard',{waitUntil:'networkidle'});assert.equal(new URL(page.url()).pathname,'/account','Signout must revoke workspace navigation');
 await page.close();await browser.close();browser=null;
 const qa=spawn(process.execPath,['apps/web/tests/browser-workspace.mjs'],{cwd:process.cwd(),env:{...process.env,UI_BASE_URL:'http://localhost:3158',UI_TEST_SESSION:cookie},stdio:'inherit'});
 const code=await new Promise(r=>qa.on('exit',r));assert.equal(code,0,'Existing workspace regression suite');
 console.log('Isolated provider signup, verify, workspace and existing-flow regression checks: PASSED');
}finally{
 if(browser)await browser.close();dev.kill('SIGTERM');await new Promise(r=>fixture.close(r));log.end();
}
