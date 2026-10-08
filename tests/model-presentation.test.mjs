import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import * as THREE from 'three';
function client(){
 const rooms=[{id:'r',type:'living',name:'Khách',floor:0,x:0,y:0,w:4,h:4}],project={site:{width:4,depth:4,floors:1},plan:{rooms},materials:{finish:{rooms:{}}}},ui={sceneFocus:'floor:0',modelWalls:'auto',modelLook:'neon',modelLightLevel:75};
 const b={state:{ui,project},defaultState:()=>({ui:{},project}),normalizeState(){},SCREENS:[],screen7:()=>'',cinematicSignature:()=>'',studioStructureKey:()=>'',mountStudio3D:async()=>{},disposeStudio3D(){},refreshStudioFinishes(){},startArchitecturalRender(){},updateModelRoomLabels(){},clamp:(n,a,z)=>Math.max(a,Math.min(n,z)),projectLevels:()=>({floorHeight:3.4,slab:.14}),floorRooms:()=>rooms,roomFurnitureLayout:()=>[],stairFloorHoles:()=>[],slabPanels:r=>[{x:r.x,y:r.y,w:r.w,d:r.h}],esc:String,sceneSurfaceUvs(){}};
 const ctx={BMH:b,document:{addEventListener(){},querySelector:()=>null,querySelectorAll:()=>[]},console,Blob,structuredClone,Uint8Array,performance:{now:()=>0},window:{}};
 vm.runInNewContext(fs.readFileSync('src/46_architectural_render.js','utf8'),ctx);vm.runInNewContext(fs.readFileSync('src/98_model_presentation.js','utf8'),ctx);return b;
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
 const trace=b.modelTraceability(),html=b.modelTraceabilityHtml();assert.equal(trace.styleName,'Japandi');assert.equal(trace.geometryLabel,'Theo mặt bằng 5 × 20 m');assert.equal(trace.materialLabel,'6/6 bề mặt đã gắn');assert.equal(trace.materialComplete,true);assert.match(html,/Revision rev-PA03/);assert.match(html,/KTS\/KS xác nhận/);assert.doesNotMatch(html,/đã duyệt kết cấu|đủ điều kiện thi công/i);
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
