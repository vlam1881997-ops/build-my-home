/* W01: repeatable measured prototype review, not a visual-acceptance oracle. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),out=process.env.BMH_EVIDENCE_OUT||path.join(root,'docs/team-v1/evidence/B/W01-prototypes');
const port=process.env.BMH_BROWSER_PORT||'3123',origin='http://127.0.0.1:'+port;
const fixtures=[{id:'townhouse',width:5.4,depth:20,floors:3,setbackFront:1.5,setbackRear:.5,setbackSide:0},{id:'wide',width:14,depth:20,floors:2,setbackFront:3,setbackRear:2,setbackSide:1.5}];
let server,browser;
const report={task:'W01.1',testOnly:true,runtime:process.version,device:process.env.BMH_DEVICE||'desktop',visualAcceptance:false,cases:[]};
const save=()=>fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');
(async()=>{
 fs.mkdirSync(out,{recursive:true});
 server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
 await new Promise((ok,no)=>{server.stdout.on('data',x=>{if(x.toString().includes('local:'))ok();});server.on('error',no);server.on('exit',c=>no(Error('server exited '+c)));});
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});report.browser=await browser.version();
 for(const fixture of fixtures.filter(f=>!process.env.BMH_FIXTURE_ID||f.id===process.env.BMH_FIXTURE_ID)){
  const context=await browser.newContext({viewport:process.env.BMH_DEVICE==='phone'?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(90000);page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(/THREE.WebGLProgram|Shader Error|WebGL: INVALID/.test(m.text()))errors.push(m.text());});
  await context.route('**/*',route=>{const r=route.request(),u=new URL(r.url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&['GET','HEAD'].includes(r.method())?route.continue():route.fulfill({status:503,body:'Isolated test'});});
  await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
  await page.evaluate(f=>{const B=BuildMyHome,p=B.state.project;B.state.ui.onboardingComplete=true;Object.assign(p.site,f,{floorHeights:[3.8,3.4,3.1],useParcelGeometry:false,targetCoverage:.8});delete p.site.id;
   p.style='Japandi';p.designStudio={program:{mode:'custom',bedrooms:3,bathrooms:3}};p.materials.finish={exterior:null,rooms:{}};
   p.plan={rooms:[],openings:[],outdoor:[],fixtures:[],furniture:[],lockedRoomIds:[],lockedFloors:[]};p.measuredDesign={roof:{type:'auto',pitchDeg:0,overhang:-1,ridge:'auto',surface:'auto',color:''}};
   if(!B.generateDesignKits()||!B.applyDesignKit('B'))throw Error('Fixture generation failed');
   B.state.ui.modelLook='materials';B.state.ui.sceneFocus='all';B.state.ui.designView='exterior';B.state.ui.exteriorCamera='front';B.navigateTo(6);
  },fixture);
  const base=await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan));
  async function settle(){await page.locator('#studio3dStage').scrollIntoViewIfNeeded();await page.waitForFunction(()=>{const B=BuildMyHome,s=B.studio3d;return s?.scene.userData.modelPresentation&&s.structureKey===B.studioStructureKey()&&document.querySelector('#studio3dStage.three-ready');});await page.evaluate(async()=>{const s=BuildMyHome.studio3d;await Promise.allSettled([...(s.scene.userData.surfaceLoads||[]),...(s.scene.userData.furnitureLoads||[])]);s.renderFrame();});}
  await settle();
  for(const style of process.env.BMH_STYLE_IDS?.split(',')||['neo','japandi','industrial']){
   const started=Date.now();await page.evaluate(base=>{const B=BuildMyHome;B.state.project.plan=JSON.parse(base);B.state.ui.sceneFocus='all';B.state.ui.designView='exterior';},base);
   await page.locator('[data-customer-style]').selectOption(style);await settle();
   assert.equal(await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan)),base);
   const proposal=await page.evaluate(()=>{const v=BuildMyHome.styleFacadeProposal();return {reason:v.reason,changes:v.changes,plan:v.plan};});
   assert.equal(proposal.reason,'');await page.locator('.style-facade-proposal>summary').click();await page.locator('[data-style-facade-apply]').click();await settle();
   const row=await page.evaluate(()=>{const B=BuildMyHome,r=B.sceneRoofSpec();return {style:B.houseStyle().id,plan:B.state.project.plan,site:B.state.project.site,revision:B.drawingRevision(),roof:r,identity:B.architecturalIdentityReview(),views:[]};});
   assert.deepEqual(row.plan,proposal.plan);assert.ok(row.roof?.area>0);row.fixture=fixture.id;row.proposalChanges=proposal.changes;
   for(const view of process.env.BMH_PROTOTYPE_VIEWS?.split(',')||['exterior','living','bed']){
    const data=await page.evaluate(view=>{const B=BuildMyHome,r=view==='exterior'?null:B.state.project.plan.rooms.find(r=>r.type===view);if(view!=='exterior'&&!r)throw Error('Missing '+view);B.state.ui.sceneFocus=r?'room:'+r.id:'all';B.state.ui.designView=r?'room':'exterior';B.state.ui.roomCamera='inside';B.render();return {roomId:r?.id||null,palette:r?B.finishPalette(r.id):B.facadeFinishPalette(),collection:r?B.interiorCollection(r.id).id:null};},view);
    await settle();assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan),row.plan);
    const filename=fixture.id+'-'+style+'-'+view+'.png';await page.locator('#studio3dCanvas').screenshot({path:path.join(out,filename)});row.views.push({view,filename,...data});
   }
   row.renderRevision=await page.evaluate(()=>BuildMyHome.ARCH_RENDER_REVISION);row.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(row.overflow,false);
   row.elapsedMs=Date.now()-started;row.errors=[...errors];assert.deepEqual(errors,[]);report.cases.push(row);save();console.log(fixture.id,style,row.elapsedMs+' ms');
  }
  await context.close();
 }
 report.complete=true;save();
})().catch(e=>{report.error=e.message;save();console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
