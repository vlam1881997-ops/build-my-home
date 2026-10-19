import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import * as THREE from 'three';
function client(visual=false,documentOverrides={}){
 const rooms=[{id:'r',type:'living',name:'Khách',floor:0,x:0,y:0,w:4,h:4}],project={site:{width:4,depth:4,floors:1},plan:{rooms},materials:{finish:{rooms:{}}}},ui={sceneFocus:'floor:0',modelWalls:'auto',modelLook:'neon',modelLightLevel:75};
 const b={state:{ui,project},defaultState:()=>({ui:{},project}),normalizeState(){},SCREENS:[],screen7:()=>'',cinematicSignature:()=>'',studioStructureKey:()=>'',mountStudio3D:async()=>{},disposeStudio3D(){},refreshStudioFinishes(){},startArchitecturalRender(){},updateModelRoomLabels(){},clamp:(n,a,z)=>Math.max(a,Math.min(n,z)),projectLevels:()=>({floorHeight:3.4,slab:.14}),floorRooms:()=>rooms,roomFurnitureLayout:()=>[],stairFloorHoles:()=>[],slabPanels:r=>[{x:r.x,y:r.y,w:r.w,d:r.h}],esc:String,sceneSurfaceUvs(){}};
 const ctx={BMH:b,document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[],...documentOverrides},console,Blob,structuredClone,Uint8Array,performance:{now:()=>0},window:{}};
 vm.runInNewContext(fs.readFileSync('src/46_architectural_render.js','utf8'),ctx);vm.runInNewContext(fs.readFileSync('src/98_model_presentation.js','utf8'),ctx);
 if(visual){
  const completion=fs.readFileSync('src/75_completion.js','utf8');
  vm.runInNewContext(completion.slice(completion.indexOf('BMH.materialUnit='),completion.indexOf('BMH.materialProductIdentity=')),ctx);
  b.render=()=>true;ctx.window.requestAnimationFrame=fn=>fn();
  vm.runInNewContext(fs.readFileSync('src/101_visual_studio.js','utf8'),ctx);
 }
 return b;
}
function fixture(b){
 const scene=new THREE.Scene();scene.background=new THREE.Color('#eeeeee');scene.fog=new THREE.Fog('#eeeeee',30,100);const camera=new THREE.PerspectiveCamera();camera.position.set(5,5,-5);
 const floor=new THREE.Mesh(new THREE.BoxGeometry(4,.14,4),new THREE.MeshStandardMaterial({color:'#d4b78e'}));floor.position.y=.07;floor.material.userData.finishSlot='floor';floor.userData={kind:'floor-slab',roomId:'r',floor:0};scene.add(floor);
 const wall=new THREE.Mesh(new THREE.BoxGeometry(.22,3.26,4),new THREE.MeshStandardMaterial({color:'#eee7d9'}));wall.position.set(2,1.77,0);wall.material.userData.finishSlot='wall';wall.material.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),1.05)];wall.userData={kind:'wall',roomIds:['r'],floor:0,wallAxis:'x',wallCoordinate:4,wallSurface:'solid'};scene.add(wall);
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial()),displayBase=new THREE.Mesh(new THREE.BoxGeometry(4.2,.06,4.2),new THREE.MeshStandardMaterial());ground.userData=displayBase.userData={presentationOnly:true};scene.add(ground,displayBase);
 const renderer={toneMappingExposure:1};const c={THREE,scene,camera,renderer,ground,displayBase,visibleFloors:[0],floorFocus:0,roomFocus:null,W:4,D:4,fh:3.4,explode:0,focus:'floor:0'};return {c,floor,wall};
}
test('presentation preserves measured buffers and colour selections; export restores opaque real walls',()=>{
 const b=client(),{c,floor,wall}=fixture(b),plan=JSON.stringify(b.state.project),position=wall.geometry.attributes.position.array,colour=wall.material.color.getHex(),height=new THREE.Box3().setFromObject(wall).max.y;
 b.configureModelPresentation(c);assert.equal(wall.geometry.attributes.position.array,position);assert.equal(wall.material.color.getHex(),colour);assert.equal(JSON.stringify(b.state.project),plan);assert.equal(wall.material.clippingPlanes.length,0);assert.equal(new THREE.Box3().setFromObject(wall).max.y,height);assert.ok(c.scene.userData.modelPresentation.edgeVertices>0);
 const model=b.architecturalRenderScene(THREE,c.scene),exported=model.children.find(o=>o.userData.kind==='wall');assert.ok(exported);assert.equal(exported.material.transparent,false);assert.equal(exported.material.depthWrite,true);assert.equal(exported.material.color.getHex(),colour);assert.equal(model.children.some(o=>o.userData.presentationOnly),false);assert.equal(model.children.filter(o=>o.isMesh).length,2,'no grid, glowing floor or display base in measured export');
 b.state.ui.modelLook='materials';b.applyModelLook(c);assert.equal(c.scene.userData.modelPresentation.look.value,0);assert.equal(c.scene.userData.modelPresentation.edges.visible,false);assert.equal(floor.geometry.parameters.width,4);assert.equal(wall.geometry.attributes.position.array,position);
});
test('cutaway outlines and caps stop at the viewing cut while source wall height is retained',()=>{
 const b=client();b.state.ui.modelWalls='cut';const {c,wall}=fixture(b);b.configureModelPresentation(c);const caps=c.scene.children.find(o=>o.userData.kind==='model-cut-caps');assert.equal(caps.children.length,1);assert.ok(Math.abs(caps.children[0].position.y-1.045)<1e-6);assert.equal(wall.geometry.parameters.height,3.26);const exported=b.architecturalRenderScene(THREE,c.scene).children.find(o=>o.userData.kind==='wall'),bounds=new THREE.Box3().setFromObject(exported);assert.ok(Math.abs(bounds.max.y-1.05)<1e-6);
});
test('material inspection skips technical geometry and lazily caches it without changing the design or camera',()=>{
 const b=client();b.state.ui.modelLook='materials';b.state.ui.modelWalls='cut';const {c,wall}=fixture(b),before=JSON.stringify(b.state.project),position=wall.geometry.attributes.position.array,camera=c.camera.matrixWorld.clone();
 b.configureModelPresentation(c);const st=c.scene.userData.modelPresentation,kinds=()=>c.scene.children.map(o=>o.userData.kind);
 for(const kind of ['model-site-grid','model-outlines','model-room-light','model-lamp-glows'])assert.equal(kinds().includes(kind),false,kind+' must not delay material inspection');
 assert.equal(st.cutCaps.children.length,1,'the neutral wall cut cap is still required');
 const exportBefore=b.architecturalRenderScene(THREE,c.scene,{purpose:'model'}),boundsBefore=new THREE.Box3().setFromObject(exportBefore);
 b.state.ui.modelLook='neon';b.applyModelLook(c);const cached=[st.grid,st.edges,st.lightSurface,st.lampGlows];assert.ok(st.edgeVertices>0);assert.ok(cached.every(o=>o.visible));
 b.state.ui.modelLook='materials';b.applyModelLook(c);assert.ok(cached.every(o=>!o.visible));b.state.ui.modelLook='neon';b.applyModelLook(c);assert.ok([st.grid,st.edges,st.lightSurface,st.lampGlows].every((o,i)=>o===cached[i]),'switches reuse the same bounded helpers');
 for(const kind of ['model-site-grid','model-outlines','model-room-light','model-lamp-glows'])assert.equal(kinds().filter(x=>x===kind).length,1);
 const exportAfter=b.architecturalRenderScene(THREE,c.scene,{purpose:'model'}),boundsAfter=new THREE.Box3().setFromObject(exportAfter);
 assert.equal(exportBefore.children.length,exportAfter.children.length);assert.ok(boundsBefore.equals(boundsAfter));assert.equal(exportAfter.children.some(o=>o.userData.presentationOnly),false);
 assert.equal(wall.geometry.attributes.position.array,position);assert.ok(c.camera.matrixWorld.equals(camera));assert.equal(JSON.stringify(b.state.project),before);
});
function asyncModelFixture(look='materials'){
 const b=client(false,{querySelector:selector=>selector==='#studio3dStage'?{classList:{toggle(){}}}:null});b.state.ui.modelLook=look;const {c}=fixture(b);b.configureModelPresentation(c);c.requestRender=()=>{c.requestCount=(c.requestCount||0)+1;};c.modelPickBound=true;c.structureKey='test';c.renderer.shadowMap={};b.studio3d=c;
 let resolve;c.scene.userData.furnitureLoads=[new Promise(done=>resolve=done)];return {b,c,resolve};
}
test('late furniture stays out of technical work in material mode and appears in the first technical view',async()=>{
 const {b,c,resolve}=asyncModelFixture();await b.mountStudio3D();const st=c.scene.userData.modelPresentation;
 const model=new THREE.Group();model.userData={model:'cabinet',roomId:'r'};const mesh=new THREE.Mesh(new THREE.BoxGeometry(.8,1.8,.5),new THREE.MeshStandardMaterial());model.add(mesh);c.scene.add(model);
 resolve(true);await new Promise(done=>setImmediate(done));assert.equal(c.scene.children.some(o=>o.userData.kind==='model-outlines'),false);assert.equal(st.edgeVertices||0,0);
 b.state.ui.modelLook='neon';b.applyModelLook(c);const values=st.edges.children.flatMap(o=>Array.from(o.geometry.attributes.position.array));assert.ok(values.length>0);assert.ok(st.edgeVertices>48,'new cabinet participates in the outlines');assert.ok(values.some((v,i)=>i%3===0&&Math.abs(v-.402)<1e-5&&Math.abs(values[i+1]-.902)<1e-5&&Math.abs(values[i+2]-.252)<1e-5),'the saved cabinet bounds are projected, not merely a larger edge count');assert.equal(st.edges.visible,true);
});
test('a hidden cached outline is rebuilt once after furniture arrives and retires its resources once',async()=>{
 const {b,c,resolve}=asyncModelFixture('neon');await b.mountStudio3D();const st=c.scene.userData.modelPresentation,old=st.edges,retired=[];
 for(const line of old.children)for(const resource of [line.geometry,line.material]){let count=0;resource.addEventListener('dispose',()=>count++);retired.push(()=>count);}
 b.state.ui.modelLook='materials';b.applyModelLook(c);resolve(true);await new Promise(done=>setImmediate(done));assert.equal(st.edges===old,true);assert.ok(retired.every(count=>count()===0));
 b.state.ui.modelLook='neon';b.applyModelLook(c);assert.equal(st.edges===old,false);assert.equal(c.scene.children.includes(old),false);assert.ok(retired.every(count=>count()===1));const current=st.edges;b.applyModelLook(c);assert.equal(st.edges===current,true);assert.ok(retired.every(count=>count()===1));
});
test('furniture finishing in the active technical view refreshes its visible outline immediately',async()=>{
 const {b,c,resolve}=asyncModelFixture('neon');await b.mountStudio3D();const st=c.scene.userData.modelPresentation,old=st.edges,count=st.edgeVertices,mesh=new THREE.Mesh(new THREE.BoxGeometry(.7,1.2,.6),new THREE.MeshStandardMaterial());mesh.userData={model:'wardrobe',roomId:'r'};mesh.position.set(0,.6,0);c.scene.add(mesh);
 resolve(true);await new Promise(done=>setImmediate(done));assert.equal(st.edges===old,false);assert.equal(st.edges.visible,true);assert.ok(st.edgeVertices>count);assert.equal(c.scene.children.filter(o=>o.userData.kind==='model-outlines').length,1);
});
test('pending furniture cannot allocate helpers or redraw after its scene is disposed or superseded',async()=>{
 for(const stale of ['disposed','superseded']){const {b,c,resolve}=asyncModelFixture();await b.mountStudio3D();const count=c.requestCount;c.scene.userData.disposed=stale==='disposed';if(stale==='superseded')b.studio3d=null;resolve(true);await new Promise(done=>setImmediate(done));assert.equal(c.requestCount,count);assert.equal(c.scene.children.some(o=>o.userData.kind==='model-outlines'),false);}
});
test('changing presentation light before the first technical view remains safe and keeps that preference',()=>{
 const handlers=new Map(),b=client(false,{addEventListener:(name,fn)=>handlers.set(name,fn)});b.state.ui.modelLook='materials';const {c}=fixture(b);b.configureModelPresentation(c);b.studio3d=c;c.requestRender=()=>{};
 handlers.get('input')({target:{matches:()=>true,value:'23'}});assert.equal(b.state.ui.modelLightLevel,23);assert.equal(c.scene.children.some(o=>o.userData.kind==='model-room-light'),false);
 b.state.ui.modelLook='neon';b.applyModelLook(c);assert.equal(c.scene.userData.modelPresentation.lightSurface.material.opacity,.23);
});
test('batching repetitive rug details preserves triangle count, world bounds and material',()=>{
 const b=client(),scene=new THREE.Scene(),material=new THREE.MeshStandardMaterial(),group=new THREE.Group();group.position.set(2,3,4);scene.add(group);let originalTriangles=0;
 for(let i=0;i<20;i++){const mesh=new THREE.Mesh(new THREE.BoxGeometry(.008,.003,.035),material);mesh.position.set(i*.02,0,0);mesh.userData={kind:'interior-rug',roomId:'r',generic:true};group.add(mesh);originalTriangles+=mesh.geometry.index.count/3;}const before=new THREE.Box3().setFromObject(group);b.mergeModelFringes(THREE,scene);const merged=scene.children.find(o=>o.userData.kind==='interior-rug-fringes');assert.equal(merged.userData.mergedCount,20);assert.equal(merged.geometry.attributes.position.count/3,originalTriangles);assert.equal(merged.material,material);const after=new THREE.Box3().setFromObject(merged);assert.ok(before.min.distanceTo(after.min)<1e-6&&before.max.distanceTo(after.max)<1e-6);assert.equal(group.children.length,0);
});
test('room inspection cannot reuse a selected room from another floor or a removed room',()=>{
 const b=client();b.state.ui.modelRoomId='r';assert.equal(b.modelSelectedRoom().id,'r');b.state.ui.sceneFocus='floor:1';assert.equal(b.modelSelectedRoom(),null);b.state.ui.sceneFocus='floor:0';b.state.project.plan.rooms.splice(0);assert.equal(b.modelSelectedRoom(),null);
});
test('3D traceability names the chosen style, measured revision and material bindings without claiming engineering approval',()=>{
 const b=client(),p=b.state.project;Object.assign(p.site,{width:5,depth:20});p.style='Japandi';
 const visualMaterials={floor:'oak-floor',wall:'ivory-paint',accent:'natural-oak',fabric:'cream-boucle'};p.materials.finish.exterior={visualMaterials:{wall:'ivory-paint',accent:'natural-oak'}};
 b.VISUAL_MATERIALS=Object.entries({...visualMaterials,exteriorWall:'ivory-paint',exteriorAccent:'natural-oak'}).map(([name,id])=>({id,role:name==='exteriorWall'?'wall':name==='exteriorAccent'?'accent':name,name:id}));
 b.finishPalette=()=>({visualMaterials});b.facadeFinishPalette=()=>p.materials.finish.exterior;b.houseStyle=()=>({id:'japandi',name:'Japandi'});b.architecturalIdentityReview=()=>({recognized:true,name:'Japandi'});b.drawingRevision=()=>'rev-PA03';
 const trace=b.modelTraceability(),html=b.modelTraceabilityHtml();assert.equal(trace.styleName,'Japandi');assert.equal(trace.geometryLabel,'Khu đất 5 × 20 m');assert.equal(trace.materialLabel,'6/6 lựa chọn bề mặt hợp lệ');assert.equal(trace.materialComplete,true);assert.match(html,/Revision rev-PA03/);assert.match(html,/KTS\/KS xác nhận/);assert.doesNotMatch(html,/đã duyệt kết cấu|đủ điều kiện thi công/i);
});
test('traceability excludes missing profiles, wrong surface roles and deleted rooms',()=>{
 const b=client(true),p=b.state.project;
 b.VISUAL_MATERIALS=[{id:'oak',role:'floor',name:'Sàn sồi'},{id:'paint',role:'wall',name:'Sơn'}];
 b.finishPalette=()=>({visualMaterials:{floor:'oak',wall:'oak',accent:'missing',fabric:'missing'}});
 p.materials.finish.rooms.deleted={visualMaterials:{floor:'orphan'}};
 p.materials.finish.exterior={visualMaterials:{wall:'paint',accent:'missing'}};
 const trace=b.modelTraceability();assert.equal(trace.materialLabel,'2/6 lựa chọn bề mặt hợp lệ');assert.equal(trace.materialComplete,false);assert.deepEqual([...trace.materialProfileIds],['oak','paint']);assert.equal(b.materialContext().surfaces,2);
 p.plan.rooms=[];assert.equal(b.modelTraceability().materialComplete,false);assert.match(b.modelTraceability().materialLabel,/Chưa có phòng/);
});
test('showroom uses canonical price evidence, distinguishes missing from explicit zero and excludes expired prices',()=>{
 const b=client(true),p=b.state.project;
 const products={
  floor:{id:'floor',unit:'m²',priceEvidence:{amountVnd:320000,priceType:'reference'}},
  paint:{id:'paint',unit:'lít',priceEvidence:{amountVnd:null}},
  door:{id:'door',unit:'bộ',priceEvidence:{amountVnd:0,priceType:'verified-zero'}},
  stone:{id:'stone',unit:'m²',priceEvidence:{amountVnd:900000,validUntil:'2000-01-01'}},
  lamp:{id:'lamp',unit:'bộ',priceEvidence:{amountVnd:0,priceType:'unverified'}},
  misc:{id:'misc',priceEvidence:{amountVnd:200000}}
 };
 p.materials.choices=Object.fromEntries([...Object.keys(products),'entered'].map(id=>[id,id]));
 p.dataEngine={materialOverrides:{entered:{value:450000,unit:'m²',source:'Nhà cung cấp',date:'2026-10-01'}}};
 b.catalogSelectedProduct=category=>products[category];
 const before=JSON.stringify(p),summary=b.materialContext();assert.equal(summary.products,7);assert.equal(summary.priced,3);assert.match(b.materialContextHtml(),/3\/7 nhóm có dữ liệu đơn giá; chưa xác nhận dự toán/);assert.equal(JSON.stringify(p),before);
 p.dataEngine.materialOverrides.entered.value=null;assert.equal(b.materialContext().priced,2);
 p.dataEngine.materialOverrides.entered.value=0;assert.equal(b.materialContext().priced,3);
});
test('visual navigation retains every route and does not claim a successful save',()=>{
 const b=client(true);b.GUIDED_FUNCTIONS=['Ý tưởng','Khu đất','Gia đình','Bản vẽ','Vật liệu','3D','Dự toán','Ngân hàng','Thi công','Bàn giao'];b.state.ui.step=8;b.localSaveFailed=true;b.projects={error:'QuotaExceededError'};
 const html=b.stepper();assert.equal((html.match(/data-nav=/g)||[]).length,10);assert.match(html,/Bước 8 \/ 10 · Ngân hàng/);assert.match(html,/data-nav="8" class="active" aria-current="page"/);assert.doesNotMatch(html,/Đã lưu/);assert.equal(b.render(),true,'render works without matchMedia');
});
test('look, wall view, room and light preferences survive the real loader schema',()=>{
 const saved={ui:{modelLook:'materials',modelWalls:'full',modelRoomId:'living',modelLightLevel:31,exteriorCamera:'overview'}},ctx={location:{hostname:'localhost'},localStorage:{getItem:()=>JSON.stringify(saved),setItem(){}},document:{addEventListener(){},querySelector:()=>null},window:{},structuredClone,console,setTimeout,clearTimeout,URL};
 vm.createContext(ctx);for(const file of ['00_boot','01_vn34_catalog','15_data_engine','10_state'])vm.runInContext(fs.readFileSync('src/'+file+'.js','utf8').replace('const BMH =','var BMH ='),ctx);
 for(const [key,value] of Object.entries(saved.ui))assert.equal(ctx.BMH.state.ui[key],value);
});
test('an image that finishes encoding after a look change is rejected',async()=>{
 const b=client();b.ensureThree=async()=>THREE;let size=new THREE.Vector2(800,500),ratio=1,finish;
 const renderer={capabilities:{maxTextureSize:4096},getSize:v=>v.copy(size),getPixelRatio:()=>ratio,getRenderTarget:()=>null,setPixelRatio:v=>ratio=v,setSize:(w,h)=>size.set(w,h),setRenderTarget(){},render(){},domElement:{toBlob:done=>{finish=done;}}};
 b.studio3d={renderer,scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(),renderFrame(){}};const image=b.sharpStudioFrame(1280);await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof finish,'function');b.state.ui.modelLook='materials';finish(new Blob(['PNG']));assert.equal(await image,null);assert.deepEqual(size.toArray(),[800,500]);assert.equal(b.studio3d.sharpExport,null);
});

test('Architect3D serializes the measured height of each floor in centimetres',()=>{
 const project={site:{floors:3},plan:{rooms:[],openings:[]}},heights=[3.8,3.4,3.1];
 const b={state:{project,ui:{}},projectLevels:()=>({floors:3,floorHeight:3.4,slab:.14}),studioLevels:()=>({floors:3,floorHeight:3.4,slab:.14}),studioFloorLevel:f=>({base:heights.slice(0,f).reduce((a,n)=>a+n,0),height:heights[f],slab:.14}),wallSegments:()=>[{o:'h',a:0,b:5,c:0}],floorRooms:()=>[],disposeStudio3D(){},resetStudio3D(){},mountStudio3D(){},$:()=>null};
 vm.runInNewContext(fs.readFileSync('src/77_architect3d.js','utf8'),{BMH:b,window:{},document:{},console});
 const document=b.architectDocument();assert.deepEqual(Array.from(document.levels,x=>x.height),[380,340,310]);
 assert.ok(Object.values(document.floorplan.corners).every(x=>Math.abs(x.elevation-366)<1e-8));
});

test('facade styles change profiles without changing measured rooms, openings or room finishes',()=>{
 const project={style:'Hiện đại',site:{width:8,depth:12,floors:2},plan:{rooms:[{id:'a',floor:0,type:'living',x:1,y:2,w:6,h:7},{id:'b',floor:1,type:'bed',x:1,y:2,w:6,h:7}],openings:[{id:'wa',roomId:'a',floor:0,kind:'window',side:'north',width:2.4,offset:.137,height:1.4,sill:.9},{id:'wb',roomId:'b',floor:1,kind:'window',side:'north',width:1.6,offset:.5,height:1.4,sill:.9}]},materials:{finish:{rooms:{a:{wall:'#ffedda',accent:'#443322'}}}}};let style={id:'modern'};
 const b={state:{project,ui:{}},houseStyle:()=>style,finishPalette:id=>project.materials.finish.rooms[id]||{},projectLevels:()=>({floors:2,floorHeight:3.4,slab:.14}),measuredWallThickness:()=>.22,sceneRoofSpec:()=>null,sceneFootprintBounds:rooms=>rooms.length?{x:rooms[0].x,y:rooms[0].y,width:rooms[0].w,depth:rooms[0].h,cx:rooms[0].x+rooms[0].w/2,cy:rooms[0].y+rooms[0].h/2,rectangular:true}:null,floorRooms:f=>project.plan.rooms.filter(r=>r.floor===f),furnitureSvg:()=>'',esc:String,clamp:(n,a,z)=>Math.max(a,Math.min(z,n)),measuredDesignSettings:()=>({roof:{overhang:0}})},ctx={BMH:b,window:{},document:{addEventListener(){}},structuredClone,console};
 for(const file of ['30_planner','45_studio3d','94_architectural_design'])vm.runInNewContext(fs.readFileSync('src/'+file+'.js','utf8'),ctx);
 b.sceneRoofSpec=()=>null;const unchanged=JSON.stringify({plan:project.plan,materials:project.materials}),signatures=new Set(),profiles={};
 for(const id of ['modern','minimal','japandi','tropical','neo','classic','french']){
  style=id==='french'?null:{id};project.style=id==='french'?'Biệt thự Pháp':id;const parts=b.facadeComponents();profiles[id]=new Set(parts.map(p=>p.kind));assert.ok(parts.length>0,id);assert.ok(parts.length<300,id);assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);signatures.add(JSON.stringify(parts.map(p=>[p.kind,p.w,p.h,p.d])));
  for(const p of parts){assert.ok(p.x>=0&&p.z>=0&&p.x+p.w<=8+1e-8&&p.z+p.d<=12+1e-8);assert.equal(p.structural,false);assert.equal(p.generic,true);assert.equal(p.styleId,id);if(p.roomId==='a'&&p.role==='wall')assert.equal(p.color,'#ffedda');}
  assert.equal(JSON.stringify({plan:project.plan,materials:project.materials}),unchanged);
 }
 assert.ok(signatures.size>=6);assert.ok(profiles.classic.has('pilaster-capital')&&profiles.classic.has('cornice-step'));assert.ok(profiles.neo.has('pilaster-base')&&!profiles.neo.has('cornice-step'));assert.ok(profiles.tropical.has('shade-blade'));assert.ok(profiles.modern.has('horizontal-band')&&!profiles.modern.has('pilaster'));assert.ok(profiles.french.has('window-pediment'));assert.equal(profiles.modern.has('wood-slat'),false);assert.equal(profiles.minimal.has('wood-slat'),false);assert.equal(profiles.japandi.has('shade-blade'),false);assert.ok(profiles.japandi.has('timber-panel')&&profiles.japandi.has('window-reveal'));
 const o=project.plan.openings[0],span=b.openingWallSpan(o),walls=b.scenePlanGeometry(project.plan,0).walls.filter(w=>w.openingId===o.id);assert.equal(Math.min(...walls.map(w=>w.a)),span.a);assert.equal(Math.max(...walls.map(w=>w.b)),span.b);assert.equal(span.a,1+(6-2.4)*.137);
});

test('furniture close-up removes the front-wall veil only in the viewer and restores automatically',()=>{const b=client(),{c,wall}=fixture(b);b.state.ui.designView='room';b.state.ui.roomCamera='overview';b.configureModelPresentation(c);const shader={uniforms:{},fragmentShader:'#include <common>\n#include <opaque_fragment>'};wall.material.onBeforeCompile(shader,{});assert.equal(shader.uniforms.bmhWallAlpha.value,.16);c.scene.userData.furnitureCloseup='selected';b.updateModelPresentation(c);assert.equal(shader.uniforms.bmhWallAlpha.value,0);assert.equal(wall.visible,true);const snapshot=b.architecturalRenderScene(THREE,c.scene,{purpose:'model'}),exported=snapshot.children.find(o=>o.userData.kind==='wall');assert.ok(exported);assert.equal(exported.material.transparent,false);assert.equal(exported.geometry.attributes.position.count,wall.geometry.attributes.position.count);c.scene.userData.furnitureCloseup=null;b.updateModelPresentation(c);assert.equal(shader.uniforms.bmhWallAlpha.value,.16);});
