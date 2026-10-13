const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),port='3131',origin='http://127.0.0.1:'+port,out=path.join(root,'docs/team-v1/evidence/B/W08-catalogue');
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
  await page.evaluate(()=>{const B=BuildMyHome,p=B.state.project;B.state.ui.onboardingComplete=true;Object.assign(p.site,{width:6,depth:6,floors:1,floorHeights:[3.5],useParcelGeometry:false});p.plan={rooms:[{id:'room',name:'Phòng kiểm mẫu',type:'custom',floor:0,x:1,y:1,w:4,h:4}],openings:[],fixtures:[],outdoor:[],furniture:[],lockedRoomIds:[],lockedFloors:[]};B.state.ui.planner.selected='room';B.navigateTo(4);});
  const editor=page.locator('.team-b-furniture-editor');await editor.locator('summary').first().click();await editor.getByText('Thêm món / đồ đã xóa',{exact:true}).click();
  const before=await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan));
  const ids=await editor.locator('[data-furniture-add] option').evaluateAll(nodes=>nodes.map(n=>n.value));assert.equal(ids.length,24);
  for(const model of ids){await editor.locator('[data-furniture-add] select').selectOption(model);const preview=editor.locator('[data-catalogue-model="'+model+'"]');await preview.locator('img').evaluate(img=>img.decode());assert.equal(await preview.locator('img').evaluate(img=>img.naturalWidth),480);assert.match(await preview.textContent(),/mm/);}
  assert.equal(await page.evaluate(()=>JSON.stringify(BuildMyHome.state.project.plan)),before,'browsing does not mutate plan');
  await editor.locator('[data-furniture-add] select').selectOption('washingMachine');await editor.locator('[data-furniture-catalogue]').screenshot({path:path.join(out,device+'-washer.png')});await editor.locator('[data-furniture-add] button').click();
  const saved=await page.evaluate(()=>BuildMyHome.state.project.plan.furniture);assert.equal(saved.length,1);assert.equal(saved[0].modelId,'washingMachine');assert.equal(saved[0].size.width,.6);
  await page.reload();await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);assert.deepEqual(await page.evaluate(()=>BuildMyHome.state.project.plan.furniture),saved);
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(overflow,false);assert.deepEqual(errors,[]);results.cases.push({device,models:ids.length,browsingPreservesPlan:true,added:saved[0],reload:true,overflow,errors});fs.writeFileSync(path.join(out,'result.json'),JSON.stringify(results,null,2)+'\n');console.log(device+' 24 preview switches, native add and reload passed');await ctx.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
