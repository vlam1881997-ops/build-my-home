const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {spawn}=require('node:child_process'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),port='3128',origin='http://127.0.0.1:'+port,out=path.join(root,process.env.BMH_EXPORT_MODEL?'docs/team-v1/evidence/B/W08-washer':'docs/team-v1/evidence/B/W08-export-sizes');
let server,browser;const results={runtime:process.version,cases:[],exactSupplierAssets:false};
(async()=>{
 fs.mkdirSync(out,{recursive:true});server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,env:{...process.env,PORT:port},stdio:['ignore','pipe','pipe']});
 await new Promise((ok,no)=>{server.stdout.on('data',s=>{if(s.toString().includes('local:'))ok();});server.on('error',no);});
 browser=await chromium.launch({executablePath:process.env.BMH_CHROMIUM_EXECUTABLE,args:['--no-sandbox','--disable-dev-shm-usage','--enable-unsafe-swiftshader','--use-gl=angle','--use-angle=swiftshader']});
 for(const device of ['desktop']){
  const ctx=await browser.newContext({viewport:device==='phone'?{width:390,height:844}:{width:1280,height:900},serviceWorkers:'block'}),page=await ctx.newPage(),errors=[];page.setDefaultTimeout(60000);
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(/THREE.WebGLProgram|Shader Error|WebGL: INVALID/.test(m.text()))errors.push(m.text());});
  await ctx.route('**/*',r=>{const q=r.request(),u=new URL(q.url());return u.origin===origin&&!u.pathname.startsWith('/api/')&&q.method()==='GET'?r.continue():r.fulfill({status:503,body:'Isolated test'});});
  await page.goto(origin);await page.waitForFunction(()=>window.__BMH_BOOT_OK);await page.evaluate(()=>BuildMyHome.projects.ready);
  const models=fs.readdirSync(path.join(root,'assets/architect3d/models')).filter(f=>f.endsWith('.glb')&&f!=='stairStep.glb').map(f=>f.slice(0,-4)).filter(id=>!process.env.BMH_EXPORT_MODEL||id===process.env.BMH_EXPORT_MODEL);
  const rows=await page.evaluate(async models=>{const B=BuildMyHome,T=await import('/vendor/three/three.module.js'),rows=[];for(const id of models){const mesh=await B.loadFurnitureModel(id);mesh.updateMatrixWorld(true);const size=new T.Box3().setFromObject(mesh,true).getSize(new T.Vector3()),d=B.FURNITURE_DIMENSIONS[id],item={id:'export-'+id,modelId:id,roomId:'export-room',floor:0,origin:'customer-added',placementStatus:'present',locked:false,pose:{x:3,y:3,z:0,rotationDeg:37},size:{width:d.w*1.17,height:d.h*1.11,depth:d.d*.83},materialBindings:[],costTreatment:'unconfirmed'};B.state.project.plan={rooms:[{id:'export-room',type:'custom',floor:0,x:0,y:0,w:10,h:10}],openings:[],fixtures:[],outdoor:[],furniture:[item],lockedRoomIds:[],lockedFloors:[]};const before=JSON.stringify(item),exported=B.architectDocument().items.find(i=>i.id===item.id);rows.push({id,source:{width:size.x,height:size.y,depth:size.z},saved:item,exported,measuredExport:{width:size.x*exported.scale_x/100,height:size.y*exported.scale_y/100,depth:size.z*exported.scale_z/100},unchanged:JSON.stringify(item)===before});}return rows;},models);
  for(const row of rows){assert.equal(row.unchanged,true);for(const axis of ['width','height','depth'])assert.ok(Math.abs(row.measuredExport[axis]-row.saved.size[axis])<.0001,row.id+' '+axis);assert.equal(row.exported.rotation,-37*Math.PI/180);assert.equal(row.exported.xpos,300);assert.equal(row.exported.zpos,300);}assert.deepEqual(errors,[]);
  if(process.env.BMH_EXPORT_MODEL==='washingMachine'){
   await page.evaluate(async()=>{const T=await import('/vendor/three/three.module.js'),model=await BuildMyHome.loadFurnitureModel('washingMachine');const renderer=new T.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});renderer.setSize(720,720);renderer.setPixelRatio(1);renderer.setClearColor('#e8ecef');document.body.replaceChildren(renderer.domElement);const scene=new T.Scene();scene.add(model);scene.add(new T.HemisphereLight(0xffffff,0x556677,3));const light=new T.DirectionalLight(0xffffff,3);light.position.set(2,3,4);scene.add(light);const camera=new T.PerspectiveCamera(38,1,.01,20);camera.position.set(.7,.6,1.0);camera.lookAt(0,.21,0);renderer.render(scene,camera);});
   await page.locator('canvas').screenshot({path:path.join(out,'washing-machine.png')});
  }
  fs.writeFileSync(path.join(out,'source-bounds.json'),JSON.stringify(rows,null,2)+'\n');console.log(rows.length+' decoded models passed measured export size, pose and identity');await ctx.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});
