/* Native source, isolated synthetic data. No paid requests, no 3D visual acceptance. */
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),fixtures=require('./team-a-massing-fixtures.json');
const out=process.env.BMH_EVIDENCE_OUT||path.join(root,'docs/team-v1/evidence/A/R1-R2'),port=process.env.BMH_BROWSER_PORT||'3140',origin='http://127.0.0.1:'+port;
let server,browser;const report={testOnly:true,runtime:process.version,cases:[],visualAcceptance:false};
(async()=>{
 fs.mkdirSync(out,{recursive:true});server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
 await new Promise((ok,no)=>{server.stdout.on('data',x=>{if(x.toString().includes('local:'))ok();});server.on('error',no);server.on('exit',c=>no(Error('server '+c)));});
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']});
 for(const device of ['desktop','phone'])for(const fixture of fixtures.cases)for(const releasedUse of ['loggia','terrace']){
  const context=await browser.newContext({viewport:device==='phone'?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await context.route('**/*',r=>{const u=new URL(r.request().url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&['GET','HEAD'].includes(r.request().method())?r.continue():r.fulfill({status:503,body:'Isolated test'});});
  await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
  const result=await page.evaluate(({f,releasedUse})=>{
   const B=BuildMyHome,p=B.state.project;Object.assign(p.site,f.site,{useParcelGeometry:!!f.vertices,targetCoverage:.8,north:{status:'unknown'},elevation:{status:'unknown'}});
   if(f.vertices){Object.assign(p.site,{lotMode:'custom',lotSource:'survey-local',frontEdge:0,boundaryEvidenceId:'test-concave'});p.designEvidence.site=[{id:'test-concave',kind:'boundary',unit:'m',sourceType:'customer',verifiedState:'provided',sourceTitle:'TEST-ONLY local coordinates',value:{sourceCrs:'LOCAL_METRES',surveyReference:'TEST-ONLY A/AB',localVertices:f.vertices}}];}
   p.measuredDesign.roof={type:'flat',overhang:0,pitchDeg:0};p.style='Japandi';p.briefIdea='';p.household.relatives=[];p.designStudio={program:{mode:'custom',bedrooms:3,bathrooms:3}};
   p.plan={rooms:[],openings:[],fixtures:[],furniture:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};B.state.ui.onboardingComplete=true;B.state.ui.step=4;
   if(!B.generateDesignKits()||!B.applyDesignKit('B'))throw Error('Generate: '+B.designState().programNotice);
   B.planHistory={undo:[],redo:[]};const before=B.planSnapshot(),revision=B.drawingRevision();
   const room=before.rooms.filter(r=>r.type==='bed').sort((a,b)=>b.h-a.h)[0];
   const snapshot=JSON.stringify({plan:p.plan,history:B.planHistory});const preview=B.previewRoomDepthChange({roomId:room.id,depth:f.id==='wide'?3:3.8,anchor:'rear',releasedUse,sourceReference:'TEST-ONLY customer outdoor choice'});
   if(JSON.stringify({plan:p.plan,history:B.planHistory})!==snapshot)throw Error('Preview mutated state');
   if(!preview.ok)throw Error('Preview: '+preview.reason);
   if(!B.applyRoomDepthChange(preview))throw Error('Apply: '+B.state.ui.planner.directNotice);
   const after=B.planSnapshot(),afterRevision=B.drawingRevision();if(JSON.stringify(after)!==JSON.stringify(preview.plan))throw Error('Preview/commit mismatch');
   if(B.applyRoomDepthChange(preview)!==false)throw Error('Stale preview accepted');
   B.undoPlan();if(JSON.stringify(p.plan)!==JSON.stringify(before))throw Error('Undo mismatch');B.redoPlan();if(JSON.stringify(p.plan)!==JSON.stringify(after))throw Error('Redo mismatch');
   B.save();B.render();return {fixture:f.id,sourceRevision:revision,revision:afterRevision,area:B.siteInputAssessment().boundary.area,beforeRoom:room,afterRoom:p.plan.rooms.find(r=>r.id===room.id),released:preview.released,cost:preview.cost,plan:after,unchangedRoomIds:before.rooms.filter(r=>r.id!==room.id&&JSON.stringify(r)===JSON.stringify(after.rooms.find(q=>q.id===r.id))).map(r=>r.id),roomCount:before.rooms.length};
  },{f:fixture,releasedUse});
  assert.equal(result.area,fixture.expectedArea);assert.notEqual(result.sourceRevision,result.revision);assert.equal(result.afterRoom.h,fixture.id==='wide'?3:3.8);assert.equal(result.unchangedRoomIds.length,result.roomCount-1);assert.equal(result.cost.amount,null);
  await page.reload();await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
  assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan),result.plan);assert.equal(await page.evaluate(()=>BuildMyHome.drawingRevision()),result.revision);assert.deepEqual(errors,[]);
  const screenshot=device+'-'+fixture.id+'-'+releasedUse+'.png';await page.screenshot({path:path.join(out,screenshot)});report.cases.push({...result,device,releasedUse,screenshot,errors});await context.close();
 }
 report.complete=true;
})().catch(e=>{report.error=e.stack;console.error(e);process.exitCode=1;}).finally(async()=>{fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(report,null,2)+'\n');await browser?.close();server?.kill();});
