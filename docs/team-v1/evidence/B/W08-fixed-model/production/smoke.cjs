const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../../../..'),port='3127',origin=process.env.BMH_BROWSER_URL||'http://127.0.0.1:'+port,out=path.join(root,'docs/team-v1/evidence/B/W08-fixed-model/production');
let server,browser;const results={runtime:process.version,cases:[],exactSupplierAssets:false};
(async()=>{
 fs.mkdirSync(out,{recursive:true});if(!process.env.BMH_BROWSER_URL){server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
 await new Promise((ok,no)=>{server.stdout.on('data',s=>{if(s.toString().includes('local:'))ok();});server.on('error',no);});}
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 for(const device of process.env.BMH_DEVICE?[process.env.BMH_DEVICE]:['desktop','phone']){
  const ctx=await browser.newContext({viewport:device==='phone'?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.setDefaultTimeout(60000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/THREE.WebGLProgram|Shader Error|WebGL: INVALID/.test(m.text()))errors.push(m.text());});
  await ctx.route('**/*',async r=>{const q=r.request(),u=new URL(q.url());if(u.origin===origin&&!u.pathname.startsWith('/api/')&&q.method()==='GET'){const a=await fetch(q.url());return r.fulfill({status:a.status,body:Buffer.from(await a.arrayBuffer()),contentType:a.headers.get('content-type')||'application/octet-stream'});}return r.fulfill({status:503,body:'Isolated production fixture'});});
  await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
  await page.evaluate(()=>{const B=BuildMyHome,p=B.state.project;B.state.ui.onboardingComplete=true;Object.assign(p.site,{width:6,depth:6,floors:1,floorHeights:[3.5],useParcelGeometry:false});p.plan={rooms:[{id:'room',name:'Phòng kiểm mẫu',type:'custom',floor:0,x:1,y:1,w:4,h:4}],openings:[],fixtures:[],outdoor:[],furniture:[],lockedRoomIds:[],lockedFloors:[]};B.state.ui.planner.selected='room';B.navigateTo(4);});
  const editor=page.locator('.team-b-furniture-editor');await editor.locator('summary').first().click();await editor.getByText('Thêm món / đồ đã xóa',{exact:true}).click();await editor.locator('[data-furniture-add] select').selectOption('loungeChairModern');await editor.locator('[data-furniture-add] button').click();
  const id=await page.evaluate(()=>BuildMyHome.state.project.plan.furniture.find(i=>i.modelId==='loungeChairModern').id);
  await editor.locator('[data-furniture-select]').selectOption(id);for(const key of ['x','y'])await editor.locator('input[name="'+key+'"]').fill('3');await editor.locator('[data-furniture-pose] button').click();await editor.locator('[data-furniture-turn-step]').selectOption('45');await editor.locator('[data-furniture-turn="-1"]').click();
  assert.equal(await page.evaluate(id=>BuildMyHome.resolvedFurniture().find(i=>i.id===id).pose.rotationDeg,id),315);await editor.locator('[data-furniture-turn="1"]').click();
  await editor.locator('input[name="rotationDeg"]').fill('37');await editor.locator('[data-furniture-pose] button').click();
  await editor.getByText('Kích thước mẫu · Ghế thư giãn Modern',{exact:true}).click();assert.equal(await editor.locator('[data-furniture-size]').evaluate(f=>f.checkValidity()),true,'measured precision is accepted by native inputs');await editor.locator('[data-furniture-size] button').click();
  await editor.screenshot({path:path.join(out,device+'-controls.png')});
  const saved=await page.evaluate(()=>{BuildMyHome.save();return BuildMyHome.state.project.plan.furniture;});await page.reload();await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan.furniture),saved);
  const cases=[];
  for(const style of ['neo','japandi','industrial']){
   await page.evaluate(style=>{const B=BuildMyHome;B.selectHouseStyle(style);B.state.ui.sceneFocus='room:room';B.state.ui.designView='room';B.state.ui.roomCamera='overview';B.navigateTo(6);},style);
   await page.locator('#studio3dStage').scrollIntoViewIfNeeded();await page.waitForFunction(id=>{const B=BuildMyHome,g=B.studio3d?.teamBFurnitureGroups?.find(g=>g.userData.furnitureId===id);return g?.userData.source==='licensed-mesh'&&B.studio3d.structureKey===B.studioStructureKey();},id);
   const mesh=await page.evaluate(id=>{const B=BuildMyHome,g=B.studio3d.teamBFurnitureGroups.find(g=>g.userData.furnitureId===id);let n=0,z=0;g.traverse(m=>{const p=m.geometry?.attributes.position;if(p)for(let i=0;i<p.count;i++)if(p.getY(i)>.9){n++;z+=p.getZ(i);}});const doc=B.architectDocument(),item=doc.items.find(i=>i.id===id);return {id:g.userData.furnitureId,model:g.userData.model,asset:g.userData.asset,source:g.userData.source,angle:g.rotation.y,size:g.userData.measuredSize,backMeanZ:z/n,exported:item,pose:B.resolvedFurniture().find(i=>i.id===id).pose};},id);
   assert.equal(mesh.model,'loungeChairModern');assert.equal(mesh.asset,'modern-armchair');assert.ok(mesh.backMeanZ>.1,'back +Z matches plan front -Z');assert.ok(Math.abs(mesh.angle+37*Math.PI/180)<1e-8);assert.deepEqual(mesh.size,saved.find(i=>i.id===id).size);assert.equal(mesh.exported.model_url,'../interior/models/modern-armchair-facing.glb');for(const axis of ['x','y','z'])assert.ok(Math.abs(mesh.exported['scale_'+axis]-100)<1e-7);assert.ok(Math.abs(mesh.exported.rotation-mesh.angle)<1e-8);
   const assetUrl=new URL('assets/architect3d/'+mesh.exported.model_url,origin).href;assert.equal((await fetch(assetUrl)).status,200);
   await page.locator('#studio3dCanvas').screenshot({path:path.join(out,device+'-'+style+'.png')});cases.push({style,...mesh});
  }
  assert.deepEqual(errors,[]);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);results.cases.push({device,items:saved,styles:cases,errors,overflow});fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(results,null,2)+'\n');console.log(device+' explicit model/rotation/reload/3D/export passed');await ctx.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
