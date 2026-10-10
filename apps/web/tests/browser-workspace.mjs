// Real Chromium UI smoke tests for UNILOOP minimalist Space UI frontend.
// Run in GitHub Actions with ephemeral Playwright installed outside app dependencies.
// No backend keys, mock listings, network access to production or form mutations.
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
const require=createRequire(import.meta.url);
const {chromium}=require("/tmp/uniloop-playwright/node_modules/playwright");

const base=process.env.UI_BASE_URL;
if(!base||!process.env.UI_TEST_SESSION)throw Error("Isolated QA fixture required; run browser-ui.mjs");
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
async function newPage(options){
 const page=await browser.newPage(options);
 await page.context().addCookies([{name:"sb-127-auth-token",value:process.env.UI_TEST_SESSION,url:base,httpOnly:false,sameSite:"Lax"}]);
 return page;
}
try{
  for(const width of [320,360,390,430,768,1024,1440]){
    const page=await newPage({viewport:{width,height:860},deviceScaleFactor:1,reducedMotion:"reduce"});
    const errors=[];
    page.on("pageerror",e=>errors.push(e.message));
    const response=await page.goto(base+"/dashboard",{waitUntil:"networkidle",timeout:30_000});
    assert.equal(response?.status(),200,"Dashboard HTTP at "+width);
    await page.getByRole("heading",{level:1}).waitFor();
    const metrics=await page.evaluate(()=>({
      viewport:window.innerWidth,
      docWidth:document.documentElement.scrollWidth,
      bodyWidth:document.body.scrollWidth,
      viewportMeta:document.querySelector('meta[name="viewport"]')?.getAttribute("content")??"",
      heroWidth:document.querySelector(".ul-dashboard")?.getBoundingClientRect().width,
      heroOpacity:Number(getComputedStyle(document.querySelector(".ul-page-heading")).opacity),
      categoryOpacity:Number(getComputedStyle(document.querySelector(".ul-category-chips")).opacity),
    }));
    assert.equal(metrics.heroOpacity,1,"Home text must remain visible with reduced motion at "+width);
    assert.equal(metrics.categoryOpacity,1,"Offscreen categories must not start hidden at "+width);
    assert.match(metrics.viewportMeta,/width=device-width/,"Responsive viewport metadata");
    assert(metrics.docWidth<=width+2,"Horizontal overflow at "+width+": "+JSON.stringify(metrics));
    assert(metrics.bodyWidth<=width+2,"Body overflow at "+width+": "+JSON.stringify(metrics));
    assert(metrics.heroWidth!==undefined&&metrics.heroWidth<=width+2,"Dashboard overflow at "+width);
    if(width<=900){
      assert(await page.getByRole("navigation",{name:"Quick mobile navigation"}).isVisible(),
        "Mobile dock missing at "+width);
      const open=page.getByRole("button",{name:"Open navigation"});
      await open.click();
      const menu=page.getByRole("navigation",{name:"More navigation"});
      assert(await menu.isVisible(),"Mobile menu failed to open at "+width);
      await page.keyboard.press("Escape");
      await menu.waitFor({state:"hidden"});
      assert(await open.evaluate(el=>el===document.activeElement),"Sidebar did not restore menu button focus");
      await open.click();
      const drawer=page.getByRole("dialog",{name:"UNILOOP"});
      await drawer.waitFor({state:"visible"});
      const bounds=await drawer.boundingBox();
      assert(bounds.x>=-1&&bounds.width<=width-40,"Mobile drawer must leave an outside dismissal area");
      assert.equal(await menu.getByRole("link").count(),15,"Sidebar must retain all desktop destinations and account");
      assert.equal(await menu.getByRole("link",{name:"Overview",exact:true}).getAttribute("aria-current"),"page");
      const navSizes=await menu.locator(".ul-sidebar-nav a").evaluateAll(links=>links.map(el=>el.getBoundingClientRect().height));
      assert(navSizes.every(height=>height>=44),"Mobile sidebar links must be touch sized");
      const scroller=menu;
      await scroller.evaluate(el=>{el.scrollTop=el.scrollHeight;});
      assert(await menu.getByRole("link",{name:"Exchange safety"}).isVisible(),"Lower navigation must remain reachable");
      if(width===390)await page.screenshot({path:path.join(output,"mobile-sidebar-390.png")});
      await drawer.getByRole("button",{name:"Close navigation"}).click();
      await drawer.waitFor({state:"hidden"});
      await open.click();
      await page.mouse.click(width-8,200);
      await drawer.waitFor({state:"hidden"});
      await open.click();
      await menu.getByRole("link",{name:"Overview",exact:true}).click();
      await drawer.waitFor({state:"hidden"});
    }else{
      assert(await page.getByRole("navigation",{name:"Main navigation"}).isVisible(),
        "Desktop navigation absent at "+width);
    }
    assert.deepEqual(await page.locator(".ul-metric-value").allTextContents(),["—","—","—","—"],"Unavailable services must not invent activity counts");
    if(width>900){
      const sidebar=page.getByRole("complementary",{name:"Workspace sidebar"});
      assert(await sidebar.isVisible(),"Persistent workspace sidebar must be visible");
      const sidebarWidth=await sidebar.evaluate(el=>el.getBoundingClientRect().width);
      assert.equal(sidebarWidth,240,"FinCo-style sidebar width");
      const accountTrigger=sidebar.getByRole("button",{name:"Open account menu"});
      await accountTrigger.click();
      const accountPopup=page.getByRole("menu",{name:"Account menu"});
      await accountPopup.waitFor({state:"visible",timeout:10000});
      assert(await accountPopup.getByRole("menuitem",{name:"My profile"}).isVisible(),"Profile destination is present");
      assert(await accountPopup.getByRole("menuitem",{name:"Account settings"}).isVisible(),"Settings destination is present");
      assert(await accountPopup.getByRole("menuitem",{name:"Sign out"}).isVisible(),"Real sign-out action is present");
      await page.keyboard.press("Escape");
      await accountPopup.waitFor({state:"hidden",timeout:10000});
      assert(await accountTrigger.evaluate(el=>el===document.activeElement),"Account menu focus returns to trigger");
    }
    await page.getByRole("tab",{name:"For rent",exact:true}).click();
    assert(await page.getByRole("tabpanel",{name:"For rent",exact:true}).isVisible(),"Rental tab displays existing rental state");
    await page.getByRole("tab",{name:"For sale",exact:true}).click();
    await page.evaluate(()=>window.scrollTo({top:0,left:0,behavior:"instant"}));
    await page.screenshot({path:path.join(output,"home-"+width+".png"),fullPage:true,animations:"disabled"});
    assert.deepEqual(errors,[],"JS page errors at "+width);
    await page.close();
  }

  // Focus-managed search, accessible tabs, bouncy FAQ and opt-in preferences.
  const polish=await newPage({viewport:{width:1440,height:900},reducedMotion:"reduce"});
  const polishErrors=[];polish.on("pageerror",error=>polishErrors.push(error.message));
  await polish.goto(base+"/dashboard",{waitUntil:"networkidle"});
  const sounds=polish.getByRole("switch",{name:"Interface sounds",exact:true});
  assert.equal(await sounds.getAttribute("aria-checked"),"false","Audio must be opt-in");
  await sounds.click();assert.equal(await sounds.getAttribute("aria-checked"),"true");
  assert.equal(await polish.evaluate(()=>localStorage.getItem("uniloop:interface-sounds:v1")),"true","Preference is written before reload");
  await polish.reload({waitUntil:"networkidle"});
  // SSR intentionally renders the opt-in control off; wait for client hydration.
  await polish.waitForFunction(()=>document.querySelector('[role="switch"][aria-label="Interface sounds"]')?.getAttribute("aria-checked")==="true");
  assert.equal(await polish.getByRole("switch",{name:"Interface sounds",exact:true}).getAttribute("aria-checked"),"true","Preference persists locally");
  await polish.getByRole("switch",{name:"Interface sounds",exact:true}).click();
  await sounds.focus();
  await polish.keyboard.press("Space");
  assert.equal(await sounds.getAttribute("aria-checked"),"true","Space toggles the native switch once");
  await polish.keyboard.press("Enter");
  assert.equal(await sounds.getAttribute("aria-checked"),"false","Enter toggles the native switch once");
  const soundBox=await sounds.boundingBox();
  assert(soundBox.width>=44&&soundBox.height>=44,"Sound switch preserves a 44px touch target");
  await polish.mouse.move(soundBox.x+8,soundBox.y+soundBox.height/2);
  await polish.mouse.down();
  await polish.mouse.move(soundBox.x+soundBox.width-8,soundBox.y+soundBox.height/2,{steps:5});
  await polish.mouse.up();
  assert.equal(await sounds.getAttribute("aria-checked"),"true","Drag turns sound on without a second native click toggle");
  await sounds.click();
  assert.equal(await sounds.getAttribute("aria-checked"),"false","Click still works after a drag");
  await polish.getByRole("button",{name:"Open workspace search",exact:true}).click();
  const searchDialog=polish.getByRole("dialog",{name:"Search your workspace"});
  await searchDialog.waitFor();
  await searchDialog.getByRole("searchbox").fill("messages");
  assert.equal(await searchDialog.getByRole("navigation",{name:"Workspace shortcuts"}).getByRole("link").count(),1,"Navigation is filtered by search");
  await polish.screenshot({path:path.join(output,"workspace-search-desktop.png"),fullPage:false,animations:"disabled"});
  await polish.keyboard.press("Escape");
  await searchDialog.waitFor({state:"hidden"});
  assert.equal(await polish.evaluate(()=>document.activeElement?.getAttribute("aria-label")),"Open workspace search","Search restores trigger focus");
  await polish.keyboard.press("Control+k");await searchDialog.waitFor();
  assert.equal(await searchDialog.getByRole("searchbox").inputValue(),"","Closed search resets the query");
  await polish.keyboard.press("Escape");await searchDialog.waitFor({state:"hidden"});
  await polish.getByRole("tab",{name:"For sale",exact:true}).focus();
  await polish.keyboard.press("ArrowRight");
  assert.equal(await polish.getByRole("tab",{name:"For rent",exact:true}).getAttribute("aria-selected"),"true","Base UI tabs support arrow navigation");
  await polish.goto(base+"/help",{waitUntil:"networkidle"});
  const faq=polish.getByRole("button",{name:"Can I save a draft right now?",exact:true});
  await faq.click();assert.equal(await faq.getAttribute("aria-expanded"),"true");
  await polish.getByRole("region",{name:"Can I save a draft right now?",exact:true}).waitFor({state:"visible"});
  assert.equal(await polish.getByRole("button",{name:"What can I do on UNILOOP?",exact:true}).getAttribute("aria-expanded"),"false");
  await polish.screenshot({path:path.join(output,"help-accordion-desktop.png"),fullPage:true,animations:"disabled"});
  await polish.goto(base+"/post",{waitUntil:"networkidle"});
  assert.equal(await polish.getByRole("progressbar",{name:"Listing steps completed"}).getAttribute("aria-valuenow"),"0","Progress represents completed steps, not fake upload progress");
  assert.deepEqual(polishErrors,[],"New interactions must not introduce browser errors");
  await polish.close();

  // Connected search mode is a real navigation, not decorative toggle.
  const modePage=await newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  await modePage.goto(base+"/dashboard",{waitUntil:"networkidle"});
  await modePage.getByRole("radio",{name:"Rent something"}).check();
  await modePage.getByRole("searchbox",{name:"Search items"}).fill("camera");
  await modePage.getByRole("button",{name:/Explore/}).click();
  await modePage.waitForURL(/\/explore\?/);
  const address=new URL(modePage.url());
  assert.equal(address.searchParams.get("mode"),"rent");
  assert.equal(address.searchParams.get("q"),"camera");
  await modePage.screenshot({path:path.join(output,"explore-mobile.png"),fullPage:true,animations:"disabled"});
  await modePage.getByRole("heading",{name:"Explore the marketplace"}).waitFor({state:"visible",timeout:15000});
  await modePage.close();

  // Multi-step frontend-only wizard must not imply a successful live listing.
  const wizard=await newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  const post=await wizard.goto(base+"/post",{waitUntil:"networkidle"});
  assert.equal(post?.status(),200);
  await wizard.getByLabel("What are you listing?").fill("Premium student camera kit");
  await wizard.getByLabel("Category",{exact:true}).selectOption("cameras-creative");
  await wizard.getByLabel("A few more details").fill(
    "Working camera, charger and protective carrying bag with no hidden problems."
  );
  await wizard.getByRole("button",{name:/Continue/}).click();
  await wizard.getByText("Let the item speak.").waitFor();
  await wizard.evaluate(()=>{
    const data=new DataTransfer();
    data.items.add(new File(["This is not an image"],"invalid.txt",{type:"text/plain"}));
    document.querySelector(".ux-photo-drop").dispatchEvent(new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer:data}));
  });
  await wizard.getByRole("alert").filter({hasText:"Use JPEG, PNG or WebP"}).waitFor();
  await wizard.evaluate(()=>{
    const bytes=Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBZkAAAAASUVORK5CYII="),c=>c.charCodeAt(0));
    const data=new DataTransfer();
    data.items.add(new File([bytes],"dark-preview.png",{type:"image/png"}));
    document.querySelector(".ux-photo-drop").dispatchEvent(new DragEvent("drop",{bubbles:true,cancelable:true,dataTransfer:data}));
  });
  await wizard.locator(".ux-photo-preview img").waitFor();
  assert.equal(await wizard.locator(".ux-photo-preview img").count(),1,"Valid drop creates one local preview");
  assert(await wizard.getByText(/Local preview only:/).isVisible(),"Drop must not imply persisted upload");
  await wizard.getByRole("button",{name:"Remove dark-preview.png"}).click();
  assert.equal(await wizard.locator(".ux-photo-preview img").count(),0,"Remove clears local preview");
  await wizard.getByRole("button",{name:/Continue/}).click();
  await wizard.getByRole("heading",{name:"What feels like a fair price?"}).waitFor();
  await wizard.evaluate(()=>window.scrollTo(0,0));
  await wizard.screenshot({path:path.join(output,"sell-wizard-mobile.png"),fullPage:true,animations:"disabled"});
  await wizard.getByRole("button",{name:/Photos/}).click();
  await wizard.getByRole("heading",{name:"Let the item speak."}).waitFor();
  await wizard.screenshot({path:path.join(output,"gradient-photo-picker-mobile.png"),fullPage:true,animations:"disabled"});
  await wizard.locator("#ux-photo-picker").setInputFiles({name:"review-cover.png",mimeType:"image/png",buffer:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aBZkAAAAASUVORK5CYII=","base64")});
  await wizard.locator(".ux-photo-preview img").waitFor();
  await wizard.getByRole("button",{name:/Continue/}).click();
  await wizard.getByLabel("Asking price (₹)").fill("750");
  await wizard.getByRole("button",{name:"Review listing"}).click();
  await wizard.getByRole("img",{name:"Your selected listing cover preview"}).waitFor();
  assert(await wizard.getByText("What happens next",{exact:true}).isVisible());
  assert(await wizard.getByRole("button",{name:"Save draft (not available yet)"}).isDisabled(),"Existing write gate must not be bypassed by signup");
  await wizard.screenshot({path:path.join(output,"listing-review-mobile.png"),fullPage:true,animations:"disabled"});
  await wizard.close();

  for(const route of ["/explore?mode=buy","/explore?mode=rent","/rent/post","/saved","/inbox","/help","/safety"]){
    const page=await newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
    const response=await page.goto(base+route,{waitUntil:"networkidle"});
    assert.equal(response?.status(),200,route+" must work with isolated verified-session fixture");
    const layout=await page.evaluate(()=>({
      view:window.innerWidth,width:document.documentElement.scrollWidth,
    }));
    assert(layout.width<=layout.view+2,"Route overflows "+route+": "+JSON.stringify(layout));
    await page.close();
  }
  // The dark migration must cover secondary routes and real form controls as well as home.
  for(const route of ["/account","/settings","/notifications","/my/listings","/rent/my",
    "/rentals","/transactions","/offers","/saved","/inbox","/help","/safety","/admin/reports",
    "/post","/rent/post","/explore?mode=buy","/explore?mode=rent"]){
    const page=await newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
    const response=await page.goto(base+route,{waitUntil:"networkidle"});
    // Moderation intentionally conceals itself from unauthenticated/non-admin accounts.
    assert.equal(response?.status(),route==="/admin/reports"?404:200,"Dark route HTTP: "+route);
    // Next.js owns the concealed moderation 404; it has no marketplace controls.
    if(route==="/admin/reports"){await page.close();continue;}
    const theme=await page.evaluate(()=>{
      function luminance(color){
        const rgb=color.match(/[\d.]+/g)?.slice(0,3).map(Number)??[255,255,255];
        if(color.startsWith("color(srgb"))for(let i=0;i<3;i++)rgb[i]*=255;
        const linear=rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
        return linear[0]*.2126+linear[1]*.7152+linear[2]*.0722;
      }
      const body=getComputedStyle(document.body);
      return {dark:document.documentElement.classList.contains("dark"),scheme:body.colorScheme,
        contrast:(Math.max(luminance(body.color),luminance(body.backgroundColor))+.05)/(Math.min(luminance(body.color),luminance(body.backgroundColor))+.05),
        background:luminance(body.backgroundColor),width:document.documentElement.scrollWidth,
        surfaces:[...document.querySelectorAll(".ux-wizard-panel,.ux-workspace-empty,.post-form,.feed-notice,.ux-header,.ux-footer")]
          .map(el=>luminance(getComputedStyle(el).backgroundColor))};
    });
    assert(!theme.dark&&theme.scheme==="light","Native controls must use light scheme: "+route);
    assert(theme.background>.9&&theme.contrast>=7,"Light body needs readable dark text: "+route);
    assert(theme.surfaces.every(value=>value>.75),"Dark panel left behind: "+route);
    assert(theme.width<=392,"Secondary route overflow: "+route);
    await page.screenshot({path:path.join(output,"dark-"+route.split("?")[0].replaceAll("/","-")+".png"),fullPage:true,animations:"disabled"});
    await page.close();
  }
  const search=await newPage({viewport:{width:1440,height:900},reducedMotion:"reduce"});
  await search.goto(base+"/dashboard",{waitUntil:"networkidle"});
  const topSearch=search.getByRole("searchbox",{name:"Search the marketplace"});
  // Document-level shortcuts attach after hydration and are not replayed by React.
  for(let attempt=0;attempt<10;attempt++){
    await search.keyboard.press("/");
    try{await topSearch.waitFor({state:"visible",timeout:1000});break;}
    catch(error){if(attempt===9)throw error;}
  }
  await topSearch.fill("headphones");
  await search.keyboard.press("Escape");
  await topSearch.waitFor({state:"hidden"});
  assert(!(await topSearch.isVisible()),"Escape should close the search dialog");
  await search.getByRole("button",{name:"Open item search"}).click();
  await topSearch.fill("headphones");
  await topSearch.press("Enter");
  await search.waitForURL(/q=headphones/);
  const selectedNav=search.getByRole("navigation",{name:"Main navigation"});
  assert.equal(await selectedNav.getByRole("link",{name:"Buy",exact:true}).getAttribute("aria-current"),"page");
  await selectedNav.getByRole("link",{name:"Rent",exact:true}).click();
  await search.waitForURL(/mode=rent/);
  assert.equal(await selectedNav.getByRole("link",{name:"Rent",exact:true}).getAttribute("aria-current"),"page");
  await search.close();

  const filters=await newPage({viewport:{width:390,height:844},reducedMotion:"reduce"});
  await filters.goto(base+"/explore?mode=rent&q=camera",{waitUntil:"networkidle"});
  await filters.getByRole("button",{name:"Categories",exact:true}).click();
  const dialog=filters.getByRole("dialog");
  assert(await dialog.isVisible(),"Category dialog should open");
  await filters.keyboard.press("Escape");
  await dialog.waitFor({state:"hidden"});
  assert(!(await dialog.isVisible()),"Escape should dismiss the category dialog");
  await filters.getByRole("button",{name:"Categories",exact:true}).click();
  await dialog.getByRole("link",{name:"Creative gear"}).click();
  await filters.waitForURL(/category=cameras-creative/);
  const filtered=new URL(filters.url());
  assert.equal(filtered.searchParams.get("q"),"camera");
  assert.equal(filtered.searchParams.get("mode"),"rent");
  await filters.getByRole("button",{name:"Open item search",exact:true}).click();
  const mobileSearch=filters.getByRole("dialog",{name:"Search your workspace"});
  await mobileSearch.waitFor();
  const searchWidth=await mobileSearch.evaluate(element=>element.getBoundingClientRect().width);
  assert(searchWidth<=390,"Mobile search dialog stays within the viewport");
  await filters.screenshot({path:path.join(output,"workspace-search-mobile.png"),fullPage:false,animations:"disabled"});
  await mobileSearch.getByRole("button",{name:"Close workspace search",exact:true}).click();
  await mobileSearch.waitFor({state:"hidden"});
  await filters.close();

  const audio=await newPage({viewport:{width:1024,height:860},reducedMotion:"no-preference"});
  const audioErrors=[];audio.on("pageerror",error=>audioErrors.push(error.message));
  await audio.goto(base+"/dashboard",{waitUntil:"networkidle"});
  await audio.getByRole("switch",{name:"Interface sounds",exact:true}).click();
  await audio.getByRole("tab",{name:"For rent",exact:true}).click();
  await audio.waitForFunction(()=>localStorage.getItem("spacesound-settings")!==null);
  const audioSettings=await audio.evaluate(()=>JSON.parse(localStorage.getItem("spacesound-settings")));
  assert.equal(audioSettings.enabled,true);assert.equal(audioSettings.volume,.16);assert.equal(audioSettings.respectReducedMotion,true);
  await audio.getByRole("switch",{name:"Interface sounds",exact:true}).click();
  assert.equal(await audio.getByRole("switch",{name:"Interface sounds",exact:true}).getAttribute("aria-checked"),"false");
  assert.deepEqual(audioErrors,[],"Opted-in lazy audio engine has no browser errors");
  await audio.close();
  console.log("Chromium frontend navigation and responsive checks: PASSED");
}finally{
  await browser.close();
}
