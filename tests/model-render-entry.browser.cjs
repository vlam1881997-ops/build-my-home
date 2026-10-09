/* Check the real customer entry point without spending Gemini credits. */
const assert=require('node:assert/strict'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
const port='3083',origin='http://127.0.0.1:'+port;let server,browser;
async function check(viewport){
 const context=await browser.newContext({viewport,serviceWorkers:'block'});
 await context.route('**/api/gemini-render',route=>route.fulfill({status:503,contentType:'application/json',body:'{"error":"Isolated test"}'}));
 const page=await context.newPage();await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);
 await page.evaluate(()=>{const B=BuildMyHome,p=B.state.project;B.state.ui.onboardingComplete=true;Object.assign(p.site,{width:9,depth:20,floors:2,useParcelGeometry:false});p.style='Việt Nam đương đại';p.designStudio={program:{mode:'custom',bedrooms:3,bathrooms:2}};p.plan={rooms:[],openings:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};B.generateDesignKits();B.applyDesignKit('B');B.navigateTo(6);});
 const prompt=page.locator('.model-render-prompt');await prompt.waitFor();assert.equal(await prompt.locator('[data-cinematic-render]').count(),1);assert.equal(await page.locator('.design-brief [data-cinematic-render]').count(),0);assert.equal(await page.locator('[data-cinematic-render]').count(),1);
 assert.ok(await prompt.evaluate(e=>e.compareDocumentPosition(document.querySelector('.design-workspace'))&Node.DOCUMENT_POSITION_FOLLOWING));
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 await prompt.locator('[data-cinematic-render]').click();await page.waitForFunction(()=>!BuildMyHome.cinematicRender.loading);assert.ok(await page.locator('.design-error').count()||await page.locator('[role="alert"]').count());
 await context.close();
}
(async()=>{server=spawn(process.execPath,['scripts/dev.cjs'],{env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.on('data',s=>{if(s.toString().includes('local:'))resolve();});server.stderr.on('data',s=>process.stderr.write(s));server.on('error',reject);server.on('exit',n=>reject(Error('Server '+n)));});browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});await check({width:1440,height:900});await check({width:390,height:844});console.log('Visible model render entry passed on desktop and phone.');})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
