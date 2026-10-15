const {chromium}=require('playwright'),{spawn}=require('node:child_process'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/team-v1/evidence/B/W11-plan-symbols'),origin='http://127.0.0.1:3156';let server,browser;
(async()=>{
 fs.mkdirSync(out,{recursive:true});server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,env:{...process.env,PORT:'3156'},stdio:['ignore','pipe','pipe']});
 await new Promise((ok,no)=>{server.stdout.on('data',d=>{if(d.toString().includes('local:'))ok();});server.on('error',no);});
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];
 for(const device of ['desktop','phone']){
  const ctx=await browser.newContext({viewport:device==='phone'?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));await ctx.route('**/*',r=>{const q=r.request(),u=new URL(q.url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&q.method()==='GET'?r.continue():r.fulfill({status:503,body:'Isolated fixture'});});
  await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
  const count=await page.evaluate(()=>{const B=BuildMyHome,p=B.state.project;B.state.ui.onboardingComplete=true;p.style='Modern';p.site.width=12;p.site.depth=14;p.site.floors=1;p.site.useParcelGeometry=false;
   p.plan={rooms:[{id:'symbols',floor:0,name:'Kiểm tra ký hiệu nội thất',type:'custom',x:.2,y:.2,w:11.6,h:13.6}],openings:[],fixtures:[],furniture:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};
   Object.entries(B.FURNITURE_DIMENSIONS).forEach(([modelId,d],n)=>p.plan.furniture.push({id:'symbol-'+n,roomId:'symbols',floor:0,modelId,placementStatus:'present',origin:'customer-added',pose:{x:1.5+n%5*2.2,y:1.7+Math.floor(n/5)*2.5,z:0,rotationDeg:n===0?37:0},size:{width:d.w,depth:d.d,height:d.h},materialBindings:[]}));
   B.state.ui.planner.selected='symbols';B.state.ui.planner.floor=0;B.navigateTo(4);return p.plan.furniture.length;
  });
  const svg=page.locator('#plannerSvg');await svg.waitFor();assert.equal(await svg.locator('.furniture-plan-symbol').count(),count);
  const measurements=await svg.locator('.furniture-plan-symbol').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBBox(),m=n.transform.baseVal.consolidate().matrix;return {model:n.dataset.symbolModel,bounds:{x:b.x,y:b.y,width:b.width,height:b.height},matrix:{a:m.a,b:m.b,c:m.c,d:m.d,e:m.e,f:m.f}};}));
  const records=await page.evaluate(()=>BuildMyHome.state.project.plan.furniture);
  for(let n=0;n<records.length;n++){const i=records[n],v=measurements[n],a=i.pose.rotationDeg*Math.PI/180;assert.ok(v.bounds.x>=-i.size.width/2-1e-6);assert.ok(v.bounds.y>=-i.size.depth/2-1e-6);assert.ok(v.bounds.x+v.bounds.width<=i.size.width/2+1e-6);assert.ok(v.bounds.y+v.bounds.height<=i.size.depth/2+1e-6);assert.ok(Math.abs(v.matrix.a-Math.cos(a))<1e-6);assert.ok(Math.abs(v.matrix.b-Math.sin(a))<1e-6);assert.ok(Math.abs(v.matrix.e-i.pose.x)<1e-6);}
  await svg.screenshot({path:path.join(out,device+'-plan.png')});
  await svg.locator('[data-furniture-id="symbol-0"]').click({force:true});assert.equal(await page.locator('[data-furniture-select]').inputValue(),'symbol-0');
  assert.deepEqual(errors,[]);results.push({device,count,measuredBoundsWithinSavedFootprints:true,rotation37:true,nativeSelection:true,measurements,errors});await ctx.close();
 }
 fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(results,null,2));console.log('desktop/phone measured symbols and native selection passed');
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
