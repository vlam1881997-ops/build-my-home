/* Same measured house, real style controls and actual WebGL pixels. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright'),{PNG}=require('pngjs');
const root=path.resolve(__dirname,'..'),port=process.env.BMH_BROWSER_PORT||'3119';
const origin=process.env.BMH_BROWSER_URL||'http://127.0.0.1:'+port;
const out=process.env.BMH_EVIDENCE_OUT||path.join(root,'docs/team-v1/evidence/B/B3-style-switch');
let server,browser;
async function run(device,viewport){
 const context=await browser.newContext({viewport,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
 page.setDefaultTimeout(60000);
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',m=>{if(/THREE.WebGLProgram|Shader Error|WebGL: INVALID/.test(m.text()))errors.push(m.text());});
 await context.route('**/*',route=>{
  const req=route.request(),u=new URL(req.url());
  if(u.origin===origin&&!u.pathname.startsWith('/api/')&&['GET','HEAD'].includes(req.method()))return route.continue();
  return route.fulfill({status:503,body:'Isolated test services'});
 });
 await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);
 await page.evaluate(()=>BuildMyHome.projects.ready);
 await page.evaluate(()=>{
  const B=BuildMyHome,p=B.state.project;B.state.ui.onboardingComplete=true;
  Object.assign(p.site,{width:5,depth:20,floors:3,floorHeights:[3.8,3.4,3.1],setbackFront:1.5,setbackRear:.5,setbackSide:0,useParcelGeometry:false,targetCoverage:.85});
  p.style='Japandi';p.designStudio={program:{mode:'custom',bedrooms:3,bathrooms:3}};
  p.materials.finish={exterior:null,rooms:{}};
  p.plan={rooms:[],openings:[],outdoor:[],fixtures:[],furniture:[],lockedRoomIds:[],lockedFloors:[]};
  p.measuredDesign={roof:{type:'auto',pitchDeg:0,overhang:-1,ridge:'auto',surface:'auto',color:''}};
  if(!B.generateDesignKits()||!B.applyDesignKit('B'))throw Error('Measured fixture failed');
  B.state.ui.modelLook='materials';B.state.ui.sceneFocus='all';B.state.ui.designView='exterior';B.state.ui.exteriorCamera='front';B.navigateTo(6);
 });
 const plan=await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan));
 async function settle(){
  await page.locator('#studio3dStage').scrollIntoViewIfNeeded();
  await page.waitForFunction(()=>{const B=BuildMyHome,s=B.studio3d;return s?.scene.userData.modelPresentation&&s.structureKey===B.studioStructureKey()&&document.querySelector('#studio3dStage.three-ready');});
  await page.evaluate(async()=>{const s=BuildMyHome.studio3d;await Promise.allSettled([...(s.scene.userData.surfaceLoads||[]),...(s.scene.userData.furnitureLoads||[])]);s.renderFrame();});
 }
 await settle();const evidence=[],pixels=new Map();
 const selected=device==='desktop'?(process.env.BMH_STYLE_IDS?.split(',')||await page.evaluate(()=>BuildMyHome.HOUSE_STYLES.map(x=>x.id))):['japandi','industrial','scandi'];
 for(const id of selected){
  if(process.env.BMH_APPLY_FACADE==='1')await page.evaluate(plan=>{BuildMyHome.state.project.plan=JSON.parse(plan);},plan);
  const start=Date.now();await page.locator('[data-customer-style]').selectOption(id);await settle();
  assert.equal(await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan)),plan,id+' measured plan');
  let applied=null;
  if(process.env.BMH_APPLY_FACADE==='1'){
   applied=await page.evaluate(()=>{const v=BuildMyHome.styleFacadeProposal();return {reason:v.reason,plan:v.plan,changes:v.changes};});assert.equal(applied.reason,'',id+' proposal');assert.ok(applied.changes.length>0);
   await page.locator('.style-facade-proposal>summary').click();await page.locator('[data-style-facade-apply]').click();await settle();
   assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan),applied.plan);assert.deepEqual(applied.plan.rooms,JSON.parse(plan).rooms);assert.deepEqual(applied.plan.furniture,JSON.parse(plan).furniture);
   if(id==='neo'){await page.evaluate(()=>BuildMyHome.undoPlan());await settle();assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan),JSON.parse(plan));await page.evaluate(()=>BuildMyHome.redoPlan());await settle();assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan),applied.plan);await page.evaluate(()=>BuildMyHome.save());await page.reload();await settle();assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan),applied.plan);}
  }
  const row=await page.evaluate(()=>{
   const B=BuildMyHome,s=B.studio3d,rule=B.architecturalIdentity();
   return {id:rule.id,style:B.state.project.style,roof:B.roofDesignSpec(),surface:B.facadeFinishPalette().facadeSurface,features:B.architecturalIdentityReview().features,
    roofMeshCount:s.scene.children.filter(x=>x.userData.kind==='roof').length,roofGeometry:B.sceneRoofSpec()?{area:B.sceneRoofSpec().area,compound:!!B.sceneRoofSpec().compound}:null,
    renderedStyleIds:[...new Set(s.scene.children.filter(x=>x.userData.facadeFinish).map(x=>x.userData.styleId))],collection:B.customerStyleProfile().collection.id,facadeTextures:[...s.scene.userData.surfaceTextures].filter(([key])=>key.startsWith('brick:')).map(([key,t])=>({key,source:t?.userData.source||null}))};
  });
  assert.equal(row.id,id);assert.deepEqual(row.renderedStyleIds,[id]);
  assert.ok(row.roofMeshCount>0&&row.roofGeometry.area>0,id+' actual roof');row.proposalChanges=applied?.changes||[];
  if(id==='industrial'){assert.equal(row.facadeTextures.length,3);assert.ok(row.facadeTextures.every(x=>x.source==='brick_wall_001'),'actual photographic PBR must arrive, not just fallback');}
  const png=await page.locator('#studio3dCanvas').screenshot();pixels.set(id,PNG.sync.read(png));
  fs.writeFileSync(path.join(out,id+'-'+device+'-exterior.png'),png);
  row.visibleSwitchMs=Date.now()-start;evidence.push(row);console.log(device,id,row.visibleSwitchMs+' ms');
 }
 if(process.env.BMH_APPLY_FACADE==='1'){await page.evaluate(plan=>{BuildMyHome.state.project.plan=JSON.parse(plan);BuildMyHome.render();},plan);await settle();}
 function difference(a,b){
  assert.equal(a.width,b.width);assert.equal(a.height,b.height);let changed=0,count=0;
  // The canvas excludes the new style badge. Ignore the edges of its backdrop.
  for(let y=Math.floor(a.height*.12);y<a.height*.94;y++)for(let x=Math.floor(a.width*.15);x<a.width*.85;x++){
   const i=(y*a.width+x)*4;count++;if(Math.max(...[0,1,2].map(c=>Math.abs(a.data[i+c]-b.data[i+c])))>15)changed++;
  }return changed/count;
 }
 const comparisons=[['japandi','industrial'],['japandi','scandi']].map(([a,b])=>({a,b,changedPixelFraction:difference(pixels.get(a),pixels.get(b))}));
 for(const c of comparisons)assert.ok(c.changedPixelFraction>.025,JSON.stringify(c));
 if(device==='desktop'){
  // Whole-house style defaults, a subsequent authored finish, and a retained
  // per-room collection. The customer model is still the same saved plan.
  await page.evaluate(()=>{const B=BuildMyHome,r=B.state.project.plan.rooms.find(r=>r.type==='living');B.selectHouseStyle('japandi');B.applyInteriorCollection('warm-oak');B.applyVisualMaterial('floor','white-marble',r.id);B.state.ui.sceneFocus='room:'+r.id;B.state.ui.designView='room';B.state.ui.roomCamera='inside';B.render();});
  await settle();
  for(const id of ['japandi','industrial','neo']){
   await page.locator('[data-customer-style]').selectOption(id);await settle();
   assert.equal(await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan)),plan);
   const r=await page.evaluate(()=>{const B=BuildMyHome,r=B.state.project.plan.rooms.find(r=>r.type==='living');return {palette:B.finishPalette(r.id),collection:B.interiorCollection(r.id).id};});
   assert.equal(r.palette.visualMaterials.floor,'white-marble');
   if(id==='industrial'){assert.equal(r.palette.visualMaterials.fabric,'cognac-leather');assert.equal(r.collection,'loft-leather');}
   await page.locator('#studio3dCanvas').screenshot({path:path.join(out,id+'-'+device+'-interior.png')});
  }
  await page.locator('[data-customer-style]').selectOption('industrial');await settle();
  await page.evaluate(()=>{const B=BuildMyHome;B.applyFinishColor('wall','#abcdef');B.render();});await settle();
  await page.locator('.style-material-reset>summary').click();await page.locator('[data-style-material-suggestions]').click();await settle();
  const suggested=await page.evaluate(()=>{const B=BuildMyHome,r=B.state.project.plan.rooms.find(r=>r.type==='living');return {wall:B.facadeFinishPalette().wall,expected:B.houseStyle().wall,floor:B.finishPalette(r.id).visualMaterials.floor};});
  assert.equal(suggested.wall,suggested.expected);assert.equal(suggested.floor,'grey-concrete');
  await page.evaluate(()=>BuildMyHome.save());await page.reload();await settle();
  assert.equal(await page.evaluate(()=>BuildMyHome.houseStyle().id),'industrial');
  assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan),JSON.parse(plan));
 }
 assert.deepEqual(errors,[]);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);
 await context.close();return {device,styles:evidence,comparisons,measuredPlanUnchanged:true,errors,overflow};
}
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 if(!process.env.BMH_BROWSER_URL){server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});await new Promise((ok,no)=>{server.stdout.on('data',x=>{if(x.toString().includes('local:'))ok();});server.on('error',no);server.on('exit',code=>{if(code)no(Error('Local server failed'));});});}
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 const cases=[await run('desktop',{width:1440,height:1000}),await run('phone',{width:390,height:844})];
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify({runtime:process.version,browser:await browser.version(),cases,visualAcceptance:false},null,2)+'\n');
 console.log('Actual '+cases[0].styles.length+'-style geometry/pixel switch, interior defaults, persistence and phone checks passed.');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
