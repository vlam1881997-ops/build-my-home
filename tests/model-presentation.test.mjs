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
test('look, wall view, room and light preferences survive the real loader schema',()=>{
 const saved={ui:{modelLook:'materials',modelWalls:'full',modelRoomId:'living',modelLightLevel:31}},ctx={location:{hostname:'localhost'},localStorage:{getItem:()=>JSON.stringify(saved),setItem(){}},document:{addEventListener(){},querySelector:()=>null},window:{},structuredClone,console,setTimeout,clearTimeout,URL};
 vm.createContext(ctx);for(const file of ['00_boot','01_vn34_catalog','15_data_engine','10_state'])vm.runInContext(fs.readFileSync('src/'+file+'.js','utf8').replace('const BMH =','var BMH ='),ctx);
 for(const [key,value] of Object.entries(saved.ui))assert.equal(ctx.BMH.state.ui[key],value);
});
test('an image that finishes encoding after a look change is rejected',async()=>{
 const b=client();b.ensureThree=async()=>THREE;let size=new THREE.Vector2(800,500),ratio=1,finish;
 const renderer={capabilities:{maxTextureSize:4096},getSize:v=>v.copy(size),getPixelRatio:()=>ratio,getRenderTarget:()=>null,setPixelRatio:v=>ratio=v,setSize:(w,h)=>size.set(w,h),setRenderTarget(){},render(){},domElement:{toBlob:done=>{finish=done;}}};
 b.studio3d={renderer,scene:new THREE.Scene(),camera:new THREE.PerspectiveCamera(),renderFrame(){}};const image=b.sharpStudioFrame(1280);await new Promise(resolve=>setImmediate(resolve));assert.equal(typeof finish,'function');b.state.ui.modelLook='materials';finish(new Blob(['PNG']));assert.equal(await image,null);assert.deepEqual(size.toArray(),[800,500]);assert.equal(b.studio3d.sharpExport,null);
});
