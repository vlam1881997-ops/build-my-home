/* Real WebGL verification: immediate PNG, visible finish changes, collection geometry and saved choices. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{spawn}=require('node:child_process'),{chromium}=require('playwright');
let browser,server;
async function isolate(context){await context.route('**/*',route=>{const r=route.request(),u=new URL(r.url());if(['http:','https:'].includes(u.protocol)&&(u.origin!==new URL(origin).origin||!['GET','HEAD'].includes(r.method())||u.pathname.startsWith('/api/')&&u.pathname!=='/api/config'))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Isolated fixture"}'});return route.continue();});}

const root=path.resolve(__dirname,'..'),output=process.env.BMH_BROWSER_OUTPUT,port=process.env.BMH_BROWSER_PORT||'3052',origin=process.env.BMH_BROWSER_URL||'http://127.0.0.1:'+port;
(async()=>{
 if(!process.env.BMH_BROWSER_URL){server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{server.stdout.on('data',b=>{if(b.toString().includes('local:'))resolve();});server.stderr.on('data',b=>process.stderr.write(b));server.on('error',reject);server.on('exit',code=>reject(new Error('Server exited '+code)));});}
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const context=await browser.newContext({viewport:{width:1280,height:1000},serviceWorkers:'block'}),page=await context.newPage(),errors=[];let heavyRequests=0,aiRequests=0;
 await isolate(context);page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/(?:GL_|WebGL: )INVALID|Shader Error/.test(m.text()))errors.push(m.text());});
 page.on('request',r=>{if(r.url().endsWith('/pathtracer.js'))heavyRequests++;if(r.url().includes('/api/gemini-render'))aiRequests++;});
 await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);
 const ids=await page.evaluate(()=>{const B=BuildMyHome;B.state.ui.onboardingComplete=true;B.generateDesignKits();B.applyDesignKit('B');const living=B.state.project.plan.rooms.find(r=>r.type==='living'),bed=B.state.project.plan.rooms.find(r=>r.type==='bed');B.state.ui.sceneFocus='room:'+living.id;B.state.ui.roomCamera='inside';B.navigateTo(6);return {living:living.id,bed:bed.id};});
 const ready=()=>page.waitForFunction(()=>BuildMyHome.studio3d?.renderer&&document.querySelector('#studio3dStage.three-ready'));
 await ready();const plan=await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan));
 await page.evaluate(()=>Promise.all([BuildMyHome.mountStudio3D(),BuildMyHome.mountStudio3D(),BuildMyHome.mountStudio3D()]));await ready();
 // This click must work without importing the ray tracer or calling an AI service.
 const started=Date.now(),download=page.waitForEvent('download');await page.locator('[data-preview-download]').click();const png=await download,exportMs=Date.now()-started;
 assert.match(png.suggestedFilename(),/xem-nhanh\.png$/);const file=await png.path();assert.equal(fs.readFileSync(file).subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.equal(heavyRequests,0);assert.equal(aiRequests,0);
 console.log(JSON.stringify({quickPngMs:exportMs,heavyRequests,aiRequests,pngBytes:fs.statSync(file).size}));
 const pose=await page.evaluate(()=>{const s=BuildMyHome.studio3d;s.state.yaw+=.18;s.state.dist*=.94;s.state.target.x+=.06;s.state.updateCamera();return {yaw:s.state.yaw,pitch:s.state.pitch,dist:s.state.dist,target:s.state.target.toArray()};});
 const samePose=async()=>assert.deepEqual(await page.evaluate(()=>{const s=BuildMyHome.studio3d;return {yaw:s.state.yaw,pitch:s.state.pitch,dist:s.state.dist,target:s.state.target.toArray()};}),pose,'finish changes keep the chosen camera angle');
 const newCollections=['nordic-light','mid-century','loft-leather','neo-elegance'];
 for(const id of newCollections){
  await page.locator('[data-interior-collection="'+id+'"]').click();await ready();await page.evaluate(()=>Promise.allSettled(BuildMyHome.studio3d.scene.userData.surfaceLoads||[]));
  await samePose();
  assert.equal(await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan)),plan);
  assert.equal(await page.evaluate(()=>BuildMyHome.interiorCollection(BuildMyHome.state.ui.sceneFocus.slice(5)).id),id);
  const jpg=await page.evaluate(()=>{const s=BuildMyHome.studio3d;s.renderFrame();const canvas=document.createElement('canvas'),source=s.renderer.domElement;canvas.width=640;canvas.height=Math.round(640*source.height/source.width);canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.88);});
  if(process.env.BMH_UPDATE_COLLECTION_PREVIEWS==='1')fs.writeFileSync(path.join(root,'assets/interior/collections',id+'.jpg'),Buffer.from(jpg.split(',')[1],'base64'));
 }
 const pixels=[];
 for(const id of ['white-marble','walnut-floor','grey-concrete','ivory-terrazzo']){
  const started=Date.now();await page.locator('[data-visual-material-select="floor"]').selectOption(id);await ready();await page.evaluate(()=>Promise.allSettled(BuildMyHome.studio3d.scene.userData.surfaceLoads||[]));
  await samePose();
  const result=await page.evaluate(()=>{const B=BuildMyHome,s=B.studio3d;s.renderFrame();return {id:B.finishPalette(B.state.ui.sceneFocus.slice(5)).visualMaterials.floor,image:s.renderer.domElement.toDataURL(),floor:s.scene.children.find(o=>o.userData.kind==='floor-slab').material[2].userData.visualMaterial};});
  assert.equal(result.id,id);assert.equal(result.floor,id);pixels.push(result.image);console.log(JSON.stringify({finish:id,changeMs:Date.now()-started}));
 }
 assert.equal(new Set(pixels).size,4,'different surfaces visibly change rendered pixels');
 await page.locator('[data-visual-material-select="fabric"]').selectOption('cream-boucle');await ready();
 if(output){fs.mkdirSync(output,{recursive:true});await page.locator('.design-workspace').screenshot({path:path.join(output,'instant-materials-desktop.png')});}
 await page.reload();await page.waitForFunction(()=>window.__BMH_BOOT_OK);await ready();
 assert.equal(await page.evaluate(()=>BuildMyHome.finishPalette(BuildMyHome.state.ui.sceneFocus.slice(5)).visualMaterials.floor),'ivory-terrazzo');
 assert.equal(await page.evaluate(()=>BuildMyHome.finishPalette(BuildMyHome.state.ui.sceneFocus.slice(5)).visualMaterials.fabric),'cream-boucle');
 assert.equal(await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan)),plan);
 await page.evaluate(({bed})=>{const B=BuildMyHome;B.state.ui.sceneFocus='room:'+bed;B.render();},ids);await ready();
 assert.notEqual(await page.evaluate(()=>BuildMyHome.finishPalette(BuildMyHome.state.ui.sceneFocus.slice(5)).visualMaterials.floor),'ivory-terrazzo','room finish changes stay isolated');
 const savedId=await page.evaluate(()=>BuildMyHome.saveCustomerProject());
 await page.evaluate(()=>BuildMyHome.newCustomerProject());
 await page.evaluate(id=>BuildMyHome.openCustomerProject(id),savedId);await ready();
 assert.equal(await page.evaluate(id=>BuildMyHome.finishPalette(id).visualMaterials.floor,ids.living),'ivory-terrazzo');
 assert.equal(await page.evaluate(id=>BuildMyHome.finishPalette(id).visualMaterials.fabric,ids.living),'cream-boucle');
 assert.equal(await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan)),plan);
 assert.equal(heavyRequests,0);assert.deepEqual(errors,[]);await context.close();
 const mobile=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'}),phone=await mobile.newPage();
 await isolate(mobile);phone.on('pageerror',e=>errors.push(e.message));await phone.goto(origin);await phone.waitForFunction(()=>window.__BMH_BOOT_OK);
 await phone.evaluate(()=>{const B=BuildMyHome;B.state.ui.onboardingComplete=true;B.state.ui.sceneFocus='room:r1';B.state.ui.roomCamera='inside';B.navigateTo(6);});
 await phone.waitForFunction(()=>BuildMyHome.studio3d?.renderer&&document.querySelector('#studio3dStage.three-ready'));
 await phone.locator('[data-visual-material="white-marble"]').click();await phone.waitForFunction(()=>BuildMyHome.studio3d?.renderer&&document.querySelector('#studio3dStage.three-ready'));
 assert.equal(await phone.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 const phoneDownload=phone.waitForEvent('download');await phone.locator('[data-preview-download]').click();assert.match((await phoneDownload).suggestedFilename(),/xem-nhanh\.png$/);
 if(output)await phone.locator('.visual-materials').screenshot({path:path.join(output,'instant-materials-mobile.png')});
 assert.deepEqual(errors,[]);console.log('desktop, phone, immediate PNG, surface pixels, reload, saved projects, room isolation and camera preservation verified');await mobile.close();
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
