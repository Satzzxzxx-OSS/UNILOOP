import assert from "node:assert/strict";
import {spawn} from "node:child_process";
import {mkdir} from "node:fs/promises";
import path from "node:path";
import {pathToFileURL,fileURLToPath} from "node:url";

const root=fileURLToPath(new URL("../",import.meta.url));
const lib=process.env.PLAYWRIGHT_MODULE_PATH;
if(!lib)throw new Error("PLAYWRIGHT_MODULE_PATH required for standalone CI browser tests");
const {chromium}=await import(pathToFileURL(lib).href);
const target="http://127.0.0.1:3192";
const server=spawn(process.execPath,[path.join(root,"node_modules/next/dist/bin/next"),"start","-p","3192"],{
 cwd:root,env:{
 ...process.env,NEXT_PUBLIC_SUPABASE_URL:"",NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"",
 ENABLE_MARKETPLACE_WRITES:"false",ENABLE_RENTAL_OPERATIONS:"false",
 ENABLE_MARKETPLACE_INTERACTIONS:"false",ENABLE_MARKETPLACE_USER_ACTIONS:"false",
 ENABLE_SALE_TRANSACTIONS:"false",
 },stdio:["ignore","pipe","pipe"]
});
let log="";
server.stdout.on("data",c=>{log+=c;});
server.stderr.on("data",c=>{log+=c;});
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
let browser;
try{
 let ready=false;
 for(let i=0;i<60;i++){
  if(server.exitCode!==null)throw new Error("Server failed: "+log);
  try{const r=await fetch(target+"/");if(r.ok){ready=true;break;}}catch{}
  await sleep(500);
 }
 assert.ok(ready,"Next.js server must start: "+log);
 browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
 await mkdir("/tmp/ux-mobile-screens",{recursive:true});
 const widths=[320,360,390,430,768,1024,1440];
 const routes=["/","/explore?mode=buy","/explore?mode=rent","/post","/rent/post"];
 for(const width of widths){
  const ctx=await browser.newContext({viewport:{width,height:810},deviceScaleFactor:1});
  const page=await ctx.newPage();
  for(const route of routes){
   const response=await page.goto(target+route,{waitUntil:"networkidle"});
   assert.equal(response?.status(),200,"route "+route+" at "+width);
   const metrics=await page.evaluate(()=>{
    const viewport=document.documentElement.clientWidth;
    const body=document.body.getBoundingClientRect();
    const important=Array.from(document.querySelectorAll(".ux-shell,.ux-hero-art,.ux-header-inner"))
      .filter(el=>getComputedStyle(el).display!=="none"&&!el.closest(".ux-menu-sheet"))
      .map(el=>({className:el.className,left:el.getBoundingClientRect().left,
        right:el.getBoundingClientRect().right}));
    return {viewport,bodyWidth:body.width,items:important};
   });
   assert.equal(metrics.viewport,width,"device viewport width");
   assert.ok(metrics.bodyWidth<=width+2,"Body larger than viewport: "+JSON.stringify({width,route,metrics}));
   for(const entry of metrics.items){
    assert.ok(entry.left>=-3 && entry.right<=width+3,
      "Layout overflows viewport: "+JSON.stringify({width,route,entry}));
   }
   if(width===390||width===1440){
    const slug=route.replace(/[^a-z0-9]/gi,"-").replace(/-+/g,"-");
    await page.screenshot({path:"/tmp/ux-mobile-screens/"+width+"-"+slug+".png",fullPage:true});
   }
  }
  await page.goto(target+"/",{waitUntil:"networkidle"});
  const dock=page.getByRole("navigation",{name:"Quick mobile navigation"});
  if(width<=900){
   assert.equal(await dock.isVisible(),true,"Mobile dock must be visible");
   await page.getByRole("button",{name:"Open navigation"}).click();
   assert.equal(await page.getByRole("navigation",{name:"More navigation"}).isVisible(),true);
   await page.getByRole("button",{name:"Close navigation"}).click();
  }else{
   assert.equal(await dock.isVisible(),false,"Mobile dock must be hidden on desktop");
   assert.equal(await page.getByRole("navigation",{name:"Main navigation"}).isVisible(),true);
  }
  await ctx.close();
 }
 // This flow is intentionally client-only; verify no fabricated saving.
 const ctx=await browser.newContext({viewport:{width:390,height:810}});
 const p=await ctx.newPage();
 await p.goto(target+"/post",{waitUntil:"networkidle"});
 await p.getByLabel("What are you listing?").fill("Scientific calculator, lightly used");
 await p.getByLabel("Category").selectOption("books-study");
 await p.getByLabel("A few more details").fill("Used for one semester, all keys work and manual is included.");
 await p.getByRole("button",{name:/Continue/}).click();
 await p.getByRole("button",{name:/Continue/}).click();
 await p.getByLabel("Asking price (₹)").fill("650");
 await p.getByRole("button",{name:/Review listing/}).click();
 assert.equal(await p.getByText("Your frontend preview is ready.").isVisible(),true);
 assert.equal(await p.getByRole("button",{name:/Save draft \(not available yet\)/}).isDisabled(),true);
 await ctx.close();
 console.log("Browser mobile visual smoke passed: 5 routes x 7 widths, modal/dock and Sell wizard.");
}finally{
 if(browser)await browser.close();
 server.kill("SIGTERM");
}
