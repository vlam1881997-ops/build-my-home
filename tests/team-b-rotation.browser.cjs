const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),port='3125',origin='http://127.0.0.1:'+port,out=path.join(root,'docs/team-v1/evidence/B/W08-rotation');
let server,browser;const results={runtime:process.version,cases:[],exactSupplierAssets:false};
(async()=>{
 fs.mkdirSync(out,{recursive:true});server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
 await new Promise((ok,no)=>{server.stdout.on('data',s=>{if(s.toString().includes('local:'))ok();});server.on('error',no);});
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 for(const device of process.env.BMH_DEVICE?[process.env.BMH_DEVICE]:['desktop','phone']){
  const ctx=await browser.newContext({viewport:device==='phone'?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.setDefaultTimeout(60000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/THREE.WebGLProgram|Shader Error|WebGL: INVALID/.test(m.text()))errors.push(m.text());});
  await ctx.route('**/*',r=>{const q=r.request(),u=new URL(q.url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&q.method()==='GET'?r.continue():r.fulfill({status:503,body:'Isolated test'});});
  await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
  await page.evaluate(()=>{const B=BuildMyHome,p=B.state.project;B.state.ui.onboardingComplete=true;Object.assign(p.site,{width:12,depth:12,floors:1,floorHeights:[3.5],useParcelGeometry:false});p.plan={rooms:[{id:'room',name:'Phòng kiểm mẫu',type:'custom',floor:0,x:1,y:1,w:10,h:10}],openings:[],fixtures:[],outdoor:[],furniture:[],lockedRoomIds:[],lockedFloors:[]};
   ['table','chair','cabinetTelevision','televisionModern','toilet'].forEach((modelId,n)=>{const d=B.FURNITURE_DIMENSIONS[modelId];p.plan.furniture.push({id:'sample-'+n,modelId,roomId:'room',floor:0,origin:'customer-added',placementStatus:'present',locked:false,pose:{x:3+n%3*3,y:3+Math.floor(n/3)*4,z:0,rotationDeg:0},size:{width:d.w,depth:d.d,height:d.h},materialBindings:[],costTreatment:'unconfirmed'});});B.state.ui.planner.selected='room';B.navigateTo(4);});
  let editor=page.locator('.team-b-furniture-editor');await editor.locator('summary').first().click();
  for(let n=0;n<5;n++){
   await editor.locator('[data-furniture-select]').selectOption('sample-'+n);
   await editor.locator('[data-furniture-turn-step]').selectOption('45');await editor.locator('[data-furniture-turn="-1"]').click();
   assert.equal(await page.evaluate(n=>BuildMyHome.resolvedFurniture().find(i=>i.id==='sample-'+n).pose.rotationDeg,n),315);
   await editor.locator('[data-furniture-turn="1"]').click();assert.equal(await page.evaluate(n=>BuildMyHome.resolvedFurniture().find(i=>i.id==='sample-'+n).pose.rotationDeg,n),0);
   await editor.locator('input[name="rotationDeg"]').fill('37');await editor.locator('[data-furniture-pose] button').click();
  }
  await editor.locator('[data-furniture-select]').selectOption('sample-1');await editor.getByText('Kích thước mẫu · Ghế',{exact:true}).click();
  for(const [key,value]of Object.entries({width:'.56',depth:'.61',height:'.88'}))await editor.locator('[data-furniture-size] [name="'+key+'"]').fill(value);
  await editor.locator('[data-furniture-size] button').click();await editor.locator('[data-furniture-lock]').click();assert.equal(await editor.locator('[data-furniture-turn="1"]').isDisabled(),true);await editor.locator('[data-furniture-lock]').click();
  const saved=await page.evaluate(()=>{BuildMyHome.save();return BuildMyHome.state.project.plan.furniture;});await page.reload();await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
  assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan.furniture),saved);
  await editor.locator('summary').first().click();await editor.locator('[data-furniture-select]').selectOption('sample-1');
  assert.equal(await editor.evaluate(el=>[...el.querySelectorAll('.team-b-pose-fields input')].filter(x=>x.getClientRects().length).every(x=>x.getBoundingClientRect().right<=el.getBoundingClientRect().right+1)),true,'inputs stay inside editor');
  await page.locator('.team-b-furniture-editor').screenshot({path:path.join(out,device+'-controls.png')});
  await page.evaluate(()=>{const B=BuildMyHome;B.state.ui.sceneFocus='room:room';B.state.ui.designView='room';B.state.ui.roomCamera='overview';B.navigateTo(6);});
  await page.locator('#studio3dStage').scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const B=BuildMyHome;return B.studio3d?.teamBFurnitureGroups?.length===5&&B.studio3d.structureKey===B.studioStructureKey();});
  const meshes=await page.evaluate(()=>BuildMyHome.studio3d.teamBFurnitureGroups.map(g=>({id:g.userData.furnitureId,angle:g.rotation.y,size:g.userData.measuredSize,model:g.userData.model})));
  for(const mesh of meshes){assert.ok(Math.abs(mesh.angle+37*Math.PI/180)<1e-8);const i=saved.find(i=>i.id===mesh.id);assert.deepEqual(mesh.size,i.size);}
  await page.locator('#studio3dCanvas').screenshot({path:path.join(out,device+'-model.png')});assert.deepEqual(errors,[]);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
  results.cases.push({device,items:saved,meshes,errors,overflow});fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(results,null,2)+'\n');console.log(device+' rotation/dimensions/reload/3D passed');await ctx.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
