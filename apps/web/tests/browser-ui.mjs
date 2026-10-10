// Real Chromium UI smoke tests for UNILOOP dark Space UI frontend.
// Run in GitHub Actions with ephemeral Playwright installed outside app dependencies.
// No backend keys, mock listings, network access to production or form mutations.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const {chromium}=require("/tmp/uniloop-playwright/node_modules/playwright");

const base="http://127.0.0.1:3155";
const output=path.join(process.cwd(),"apps","web","test-artifacts");
fs.mkdirSync(output,{recursive:true});
async function waitServer(){
  const started=Date.now();
  while(Date.now()-started<45_000){
    try{const r=await fetch(base);if(r.ok)return;}catch{}
    await new Promise(r=>setTimeout(r,800));
  }
  throw Error("Next.js preview did not start within 45 seconds");
}
await waitServer();
const browser=await chromium.launch({headless:true});
try{
  for(const width of [320,360,390,430,768,1024,1440]){
    const page=await browser.newPage({viewport:{width,height:860},deviceScaleFactor:1,reducedMotion:"reduce"});
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    const response=await page.goto(base+"/",{waitUntil:"networkidle",timeout:30_000});
    assert.equal(response?.status(),200,"Home HTTP at "+width);
    await page.getByRole("heading",{level:1}).waitFor();
    const metrics=await page.evaluate(()=>({
      viewport:window.innerWidth,
      docWidth:document.documentElement.scrollWidth,
      bodyWidth:document.body.scrollWidth,
      viewportMeta:document.querySelector('meta[name="viewport"]')?.getAttribute("content")??"",
      heroWidth:document.querySelector(".ux-hero")?.getBoundingClientRect().width,
    }));
    assert.match(metrics.viewportMeta,/width=device-width/,"Responsive viewport metadata");
    assert(metrics.docWidth<=width+2,"Horizontal overflow at "+width+": "+JSON.stringify(metrics));
    assert(metrics.bodyWidth<=width+2,"Body overflow at "+width+": "+JSON.stringify(metrics));
    assert(metrics.heroWidth!==undefined&&metrics.heroWidth<=width+2,"Hero overflow at "+width);
    if(width<=900){
      assert(await page.getByRole("navigation",{name:"Quick mobile navigation"}).isVisible(),
        "Mobile dock missing at "+width);
      const open=page.getByRole("button",{name:"Open navigation"});
      await open.click();
      const menu=page.getByRole("navigation",{name:"More navigation"});
      assert(await menu.isVisible(),"Mobile menu failed to open at "+width);
      await page.keyboard.press("Escape");
      assert(!(await menu.count()),"Mobile Escape did not close at "+width);
    }else{
      assert(await page.getByRole("navigation",{name:"Main navigation"}).isVisible(),
        "Desktop navigation absent at "+width);
    }
    await page.screenshot({path:path.join(output,"home-"+width+".png"),fullPage:true,animations:"disabled"});
    assert.deepEqual(errors,[],"JS page errors at "+width);
    await page.close();
  }

  // Connected search mode is a real navigation, not decorative toggle.
  const modePage=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  await modePage.goto(base+"/",{waitUntil:"networkidle"});
  await modePage.getByRole("radio",{name:"Rent something"}).check();
  await modePage.getByRole("searchbox",{name:"Search items"}).fill("camera");
  await modePage.getByRole("button",{name:/Explore/}).click();
  await modePage.waitForURL(/\/explore\?/);
  const address=new URL(modePage.url());
  assert.equal(address.searchParams.get("mode"),"rent");
  assert.equal(address.searchParams.get("q"),"camera");
  await modePage.screenshot({path:path.join(output,"explore-mobile.png"),fullPage:true,animations:"disabled"});
  assert(await modePage.getByRole("heading",{level:1}).isVisible());
  await modePage.close();

  // Multi-step frontend-only wizard must not imply a successful live listing.
  const wizard=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const post=await wizard.goto(base+"/post",{waitUntil:"networkidle"});
  assert.equal(post?.status(),200);
  await wizard.getByLabel("What are you listing?").fill("Premium student camera kit");
  await wizard.getByLabel("Category",{exact:true}).selectOption("cameras-creative");
  await wizard.getByLabel("A few more details").fill(
    "Working camera, charger and protective carrying bag with no hidden problems."
  );
  await wizard.getByRole("button",{name:/Continue/}).click();
  await wizard.getByText("Let the item speak.").waitFor();
  await wizard.getByRole("button",{name:/Continue/}).click();
  await wizard.getByRole("heading",{name:"What feels like a fair price?"}).waitFor();
  await wizard.screenshot({path:path.join(output,"sell-wizard-mobile.png"),fullPage:true,animations:"disabled"});
  await wizard.close();

  for(const route of ["/explore?mode=buy","/explore?mode=rent","/rent/post","/saved","/inbox","/help","/safety"]){
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
    const response=await page.goto(base+route,{waitUntil:"networkidle"});
    assert.equal(response?.status(),200,route+" must work without backend credentials");
    const layout=await page.evaluate(()=>({
      view:window.innerWidth,width:document.documentElement.scrollWidth,
    }));
    assert(layout.width<=layout.view+2,"Route overflows "+route+": "+JSON.stringify(layout));
    await page.close();
  }
  // The dark migration must cover secondary routes and real form controls as well as home.
  for(const route of ["/account","/settings","/notifications","/my/listings","/my/rentals",
    "/rentals","/transactions","/offers","/saved","/inbox","/help","/safety","/admin/reports",
    "/post","/rent/post","/explore?mode=buy","/explore?mode=rent"]){
    const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
    const response=await page.goto(base+route,{waitUntil:"networkidle"});
    assert.equal(response?.status(),200,"Dark route HTTP: "+route);
    const theme=await page.evaluate(()=>{
      function luminance(color){
        const rgb=color.match(/[\d.]+/g)?.slice(0,3).map(Number)??[255,255,255];
        const linear=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
        return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
      }
      const body=getComputedStyle(document.body);
      return {dark:document.documentElement.classList.contains("dark"),scheme:body.colorScheme,
        contrast:(luminance(body.color)+.05)/(luminance(body.backgroundColor)+.05),
        background:luminance(body.backgroundColor),width:document.documentElement.scrollWidth,
        surfaces:[...document.querySelectorAll(".ux-wizard-panel,.ux-workspace-empty,.post-form,.feed-notice,.ux-header,.ux-footer")]
          .map(el=>luminance(getComputedStyle(el).backgroundColor))};
    });
    assert(theme.dark&&theme.scheme==="dark","Native controls must use dark scheme: "+route);
    assert(theme.background<.03&&theme.contrast>=7,"Dark body needs readable text: "+route);
    assert(theme.surfaces.every(value=>value<.15),"Light panel left behind: "+route);
    assert(theme.width<=392,"Secondary route overflow: "+route);
    await page.screenshot({path:path.join(output,"dark-"+route.split("?")[0].replaceAll("/","-")+".png"),fullPage:true,animations:"disabled"});
    await page.close();
  }
  const search=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:"reduce"});
  await search.goto(base,{waitUntil:"networkidle"});
  await search.keyboard.press("/");
  const topSearch=search.getByRole("searchbox",{name:"Search the marketplace"});
  await topSearch.fill("headphones");
  await search.keyboard.press("Escape");
  assert(!(await topSearch.count()),"Escape should close the expanding search");
  await search.getByRole("button",{name:"Open item search"}).click();
  await topSearch.fill("headphones");
  await topSearch.press("Enter");
  await search.waitForURL(/q=headphones/);
  await search.close();

  const filters=await browser.newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  await filters.goto(base+"/explore?mode=rent&q=camera",{waitUntil:"networkidle"});
  await filters.getByRole("button",{name:"Categories",exact:true}).click();
  const dialog=filters.getByRole("dialog");
  assert(await dialog.isVisible(),"Category dialog should open");
  await filters.keyboard.press("Escape");
  assert(!(await dialog.count()),"Escape should dismiss the category dialog");
  await filters.getByRole("button",{name:"Categories",exact:true}).click();
  await dialog.getByRole("link",{name:"Creative gear"}).click();
  await filters.waitForURL(/category=cameras-creative/);
  const filtered=new URL(filters.url());
  assert.equal(filtered.searchParams.get("q"),"camera");
  assert.equal(filtered.searchParams.get("mode"),"rent");
  await filters.close();
  console.log("Chromium frontend navigation and responsive checks: PASSED");
}finally{
  await browser.close();
}
