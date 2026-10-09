/* Real showroom/3D interactions; external and paid services are isolated. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),port=process.env.BMH_BROWSER_PORT||'3109';
const origin=process.env.BMH_BROWSER_URL||'http://127.0.0.1:'+port;
const output=process.env.BMH_BROWSER_OUTPUT||path.join(root,'docs/team-v1/evidence/B/B1-browser');
let server,browser;const evidence=[];
async function run(device,options){
 const context=await browser.newContext({...options,serviceWorkers:'block'}),errors=[];
 await context.route('**/*',route=>{const req=route.request(),url=new URL(req.url());
  if(url.origin===origin&&url.pathname==='/api/config')return route.fulfill({status:200,contentType:'application/json',body:'{"ok":true,"aiConfigured":false,"cloudConfigured":false}'});
  if(['http:','https:'].includes(url.protocol)&&(url.origin!==origin||url.pathname.startsWith('/api/')||!['GET','HEAD'].includes(req.method())))return route.fulfill({status:503,contentType:'application/json',body:'{"error":"Isolated test"}'});
  return route.continue();
 });
 const page=await context.newPage();page.setDefaultTimeout(45000);page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(/THREE.WebGLProgram|Shader Error|WebGL: INVALID/.test(m.text()))errors.push(m.text());});
 await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
 await page.evaluate(()=>{
  const B=BuildMyHome,p=B.state.project;B.state.ui.onboardingComplete=true;
  Object.assign(p.site,{width:8,depth:12,floors:1,useParcelGeometry:false,setbackFront:0,setbackRear:0,setbackSide:0});p.style='Japandi';
  p.plan={rooms:[{id:'b1-living',floor:0,name:'Khách',type:'living',x:.4,y:.4,w:3.5,h:4},{id:'b1-bed',floor:0,name:'Ngủ',type:'bed',x:3.9,y:.4,w:3.5,h:4}],openings:[{id:'b1-door',floor:0,roomId:'b1-living',kind:'door',side:'south',offset:.137,width:.9}],fixtures:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};
  p.materials.finish={exterior:null,rooms:{'b1-bed':{visualMaterials:{floor:'white-marble'},explicitRoles:{floor:true}}}};
  B.save();B.navigateTo(5);
 });
 const measured=await page.evaluate(()=>BuildMyHome.state.project.plan);
 const brief=page.locator('.style-material-brief');await brief.scrollIntoViewIfNeeded();assert.match(await brief.innerText(),/Japandi/);
 await brief.locator('summary').click();assert.match(await brief.innerText(),/Kích thước tấm/);assert.equal(await brief.locator('button').count(),0);
 await page.screenshot({path:path.join(output,'showroom-'+device+'.png'),fullPage:false});
 await page.locator('[data-web-product]').first().click();
 const product=await page.evaluate(()=>BuildMyHome.state.project.materials.choices.floor);assert.ok(product);
 await page.locator('[data-showroom-profile="floor"]').selectOption('oak-floor');
 await page.locator('[data-showroom-scope="floor"]').selectOption('unassigned');
 await page.locator('[data-showroom-3d="floor"]').click();
 const settle=async()=>{await page.locator('#studio3dStage').scrollIntoViewIfNeeded();await page.waitForFunction(()=>BuildMyHome.studio3d?.scene.userData.modelPresentation&&document.querySelector('#studio3dStage.three-ready')&&!BuildMyHome.studio3d.raf);};
 await settle();
 assert.equal(await page.evaluate(()=>BuildMyHome.finishPalette('b1-living').visualMaterials.floor),'oak-floor');
 assert.equal(await page.evaluate(()=>BuildMyHome.finishPalette('b1-bed').visualMaterials.floor),'white-marble');
 const selectedAt=Date.now();await page.locator('[data-visual-material-select="floor"]').selectOption('walnut-floor');await settle();
 const materialSwitchMs=Date.now()-selectedAt;
 await page.locator('[data-customer-style]').selectOption('industrial');await settle();
 assert.equal(await page.evaluate(()=>BuildMyHome.houseStyle().id),'industrial');
 assert.equal(await page.evaluate(()=>BuildMyHome.finishPalette('b1-living').visualMaterials.floor),'walnut-floor');
 assert.equal(await page.evaluate(()=>BuildMyHome.finishPalette('b1-living').visualMaterials.fabric),'cognac-leather');
 assert.equal(await page.evaluate(()=>BuildMyHome.finishPalette('b1-living').visualMaterials.wall),'grey-paint');
 assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan),measured);
 assert.equal(await page.evaluate(()=>BuildMyHome.state.project.materials.choices.floor),product);
 await page.screenshot({path:path.join(output,'studio-'+device+'.png'),fullPage:false});
 await page.locator('.guided-ten-tabs [data-nav="5"]').click();
 assert.match(await page.locator('.style-material-brief').innerText(),/Industrial/);
 await page.reload();await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
 assert.equal(await page.evaluate(()=>BuildMyHome.houseStyle().id),'industrial');
 assert.equal(await page.evaluate(()=>BuildMyHome.finishPalette('b1-living').visualMaterials.floor),'walnut-floor');
 assert.equal(await page.evaluate(()=>BuildMyHome.state.project.materials.choices.floor),product);
 assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan),measured);
 assert.equal(await page.locator('.guided-ten-tabs [data-nav]').count(),10);
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2));assert.deepEqual(errors,[]);
 evidence.push({device,viewport:options.viewport,materialSwitchMs,styleAfterReload:'industrial',skuSelectionRetained:true,measuredPlanRetained:true,tenTabs:true,jsWebglErrors:errors});
 console.log(device+': showroom, real material/style controls, 3D, reload and no overflow passed; finish '+materialSwitchMs+'ms');
 await context.close();
}
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 if(!process.env.BMH_BROWSER_URL){server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{server.stdout.on('data',s=>{if(s.toString().includes('local:'))resolve();});server.on('error',reject);server.on('exit',c=>reject(Error('Server exit '+c)));});}
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 await run('desktop',{viewport:{width:1440,height:1040}});await run('phone',{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 fs.writeFileSync(path.join(output,'result.json'),JSON.stringify({runtime:process.version,browser:await browser.version(),isolatedServices:true,evidence},null,2)+'\n');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
