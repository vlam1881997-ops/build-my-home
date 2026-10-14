/* Run after npm run build; this uses a real service worker and IndexedDB. */
const assert=require('node:assert/strict'),path=require('node:path'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
let browser,server;
const port=process.env.BMH_TEST_PORT||'3043',base='http://127.0.0.1:'+port;
(async()=>{
 server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:path.resolve(__dirname,'..'),env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.on('data',data=>{if(data.toString().includes('local:'))resolve();});server.on('error',reject);server.on('exit',code=>reject(Error('Server exited '+code)));});
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 // Seed existing caches before BMH installs; activation must preserve other apps.
 await page.goto(base+'/manifest.webmanifest');await page.evaluate(async()=>{await caches.open('other-app');await caches.open('bmh-old');});
 await page.goto(base,{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>__BMH_BOOT_OK);assert.equal(await page.evaluate(()=>BuildMyHome.installableApp.ready),true);await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 const online=await page.evaluate(async()=>{
  const keys=await caches.keys(),name=keys.find(k=>k.startsWith('bmh-')),cache=await caches.open(name),manifest=await (await fetch('./manifest.webmanifest')).json();
  const icons=await Promise.all(manifest.icons.map(async icon=>{const r=await fetch(icon.src);return r.ok&&r.headers.get('content-type')?.startsWith('image/png');}));
  const api=await fetch('/api/config');await api.text();await fetch('/missing-offline-module.js');await fetch('./vendor/three/three.module.js');
  return {keys,core:!!await cache.match('./index.html'),icons:icons.every(Boolean),display:manifest.display,name};
 });assert.ok(online.keys.includes('other-app'));assert.ok(!online.keys.includes('bmh-old'));assert.ok(online.core&&online.icons);assert.equal(online.display,'standalone');
 await page.waitForFunction(async name=>!!await (await caches.open(name)).match('./vendor/three/three.module.js'),online.name);
 const excluded=await page.evaluate(async name=>{const c=await caches.open(name);return {api:!!await c.match('/api/config'),missing:!!await c.match('/missing-offline-module.js')};},online.name);assert.deepEqual(excluded,{api:false,missing:false});
 const design=await page.evaluate(async()=>{const B=BuildMyHome;B.state.ui.onboardingComplete=true;B.generateDesignKits();B.applyDesignKit('B');B.state.project.name='Nhà vẫn dùng khi mất mạng';await B.saveCustomerProject();return {id:B.projects.activeId,plan:JSON.stringify(B.state.project.plan)};});
 await context.setOffline(true);await page.reload({waitUntil:'domcontentloaded'});await page.waitForFunction(()=>__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);assert.deepEqual(await page.evaluate(()=>({id:BuildMyHome.projects.activeId,plan:JSON.stringify(BuildMyHome.state.project.plan)})),design);
 const offline=await page.evaluate(async()=>{const B=BuildMyHome;B.state.project.plan.rooms[0].name='Phòng sửa khi mất mạng';B.save();await B.saveCustomerProject();await B.openProjectLibrary();const state=(await B.projectGet(B.projects.activeId)).state;let moduleFailed=false,apiFailed=false;try{await fetch('/missing-offline-module.js');}catch{moduleFailed=true;}try{await fetch('/api/config');}catch{apiFailed=true;}const vendor=await fetch('./vendor/three/three.module.js');return {saved:state.project.plan.rooms[0].name==='Phòng sửa khi mất mạng',library:!!document.querySelector('#customerProjects[open]'),moduleFailed,apiFailed,vendor:vendor.ok};});assert.deepEqual(offline,{saved:true,library:true,moduleFailed:true,apiFailed:true,vendor:true});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({offlineReload:true,offlineDrawingEdit:true,offlineProjectLibrary:true,warmed3DModule:true,apisExcluded:true,missingModulesFailSafely:true,otherCachesPreserved:true,manifestIcons:true}));await context.close();
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
