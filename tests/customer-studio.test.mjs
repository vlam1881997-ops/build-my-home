import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';

function client(){
 let id=0;const b={state:{ui:{planner:{floor:0,snap:.2,selected:null},sceneFocus:'all',renderQuality:'draft'},project:{name:'Nhà khách',style:'Japandi',site:{width:5,depth:12,floors:3,floorHeight:3.4},plan:{rooms:[],openings:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]},materials:{choices:{floor:'approved-floor'},finish:{rooms:{}}},designStudio:{},finance:{cash:987654321,income:12345678},household:{ownerBirth:1988,children:[{name:'PRIVATE-CHILD'}]}}},SCREENS:[],planHistory:{undo:[],redo:[]},uid:p=>p+'-'+(++id),clamp:(v,a,z)=>Math.min(z,Math.max(a,v)),roundTo:(v,s)=>Math.round(v/s)*s,esc:v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),save(){},render(){},toast(){},normalizeState(){},$:()=>null,roomFurnitureLayout:()=>[],screen7:()=>'<div class="design-studio"><div class="design-workspace"></div></div>',mountStudio3D:async()=>{},disposeStudio3D(){},roomEditingPanel:()=>'',furnitureSvg:()=>'',addRoomSceneFurniture(){},stairSpec:()=>({direction:0}),architectDocument:()=>({levels:[],items:[]}),architecturalSheets:()=>[],aiContext:()=>({}),cinematicSignature:()=> 'current',scenePlanGeometry:()=>({walls:[]}),projectLevels:()=>({floors:b.state.project.site.floors,floorHeight:3.4,slab:.14,ceilingDrop:.2}),visualMaterialContext:()=>({collection:{id:'japandi',name:'Japandi',private:'HIDDEN'},palette:{floor:'#123456',cash:'HIDDEN'},surfaces:[{id:'oak',role:'floor',name:'Sàn sồi',financial:'HIDDEN'}]}),designState:()=>b.state.project.designStudio,rememberFinishCamera(){},ensureThree:async()=>THREE};
 const context={BMH:b,document:{addEventListener(){},querySelectorAll:()=>[]},window:{matchMedia:()=>({matches:false})},structuredClone,console,Blob,TextEncoder,Uint8Array,atob,cancelAnimationFrame(){},requestAnimationFrame:()=>1,performance:{now:()=>100}};
 for(const file of ['30_planner.js','40_exports.js','79_stair_design.js'])vm.runInNewContext(fs.readFileSync('src/'+file,'utf8'),context);
 b.plannerIssues=()=>[];b.architecturalSheets=()=>[];
 for(const file of ['46_architectural_render.js','87_elevator_design.js','88_customer_studio.js','89_guided_interface.js'])vm.runInNewContext(fs.readFileSync('src/'+file,'utf8'),context);
 return {b,context};
}
test('a lift reserves the same shaft and a sliding landing at every floor, without replacing rooms',()=>{
 const {b}=client();const living={id:'living',type:'living',name:'Khách',floor:0,x:0,y:0,w:5,h:4};b.state.project.plan.rooms.push(living);assert.equal(b.addElevator(),true);
 const lifts=b.state.project.plan.rooms.filter(r=>r.type==='elevator');assert.equal(lifts.length,3);assert.equal(b.state.project.plan.rooms[0].id,'living');assert.equal(new Set(lifts.map(r=>r.elevator.shaftId)).size,1);assert.equal(new Set(lifts.map(r=>[r.x,r.y,r.w,r.h].join(','))).size,1);
 assert.equal(b.state.project.plan.openings.length,3);assert.ok(b.state.project.plan.openings.every(o=>o.motion==='sliding'&&b.openingFits(o)));assert.equal(b.planHistory.undo.length,1);
 assert.match(b.elevatorDetailSheetSvg(lifts[0]),/Chưa xác nhận/);assert.match(b.elevatorDetailSheetSvg(lifts[0]),/không in theo tỷ lệ/);
 const dxf=b.planDxf(1);assert.match(dxf,/ELEVATOR/);assert.match(dxf,/1100x1300/);assert.match(dxf,/\$INSUNITS\r\n70\r\n4/);
});
test('shaft edits are atomic across floors, reject an obstruction above and honor every lock',()=>{
 const {b}=client();b.addElevator();const lifts=b.state.project.plan.rooms,selected=lifts[0];b.state.ui.planner.selected=selected.id;
 assert.equal(b.editElevatorGeometry('x',.4),true);assert.ok(b.state.project.plan.rooms.every(r=>Math.abs(r.x-.4)<1e-6));const before=JSON.stringify(b.state.project.plan);
 b.state.project.plan.lockedFloors=[2];assert.equal(b.editElevatorGeometry('x',.8),false);assert.equal(JSON.stringify({...b.state.project.plan,lockedFloors:[]}),before);
 b.state.project.plan.lockedFloors=[];b.state.project.plan.rooms.push({id:'obstruction',name:'Phòng tầng trên',type:'bed',floor:2,x:2.2,y:0,w:2,h:3});const obstructed=JSON.stringify(b.state.project.plan);assert.equal(b.editElevatorGeometry('x',1.0),false);assert.equal(JSON.stringify(b.state.project.plan),obstructed);
});
test('new upper floors receive a matching shaft and undo/deletion restores the complete group',()=>{
 const {b}=client();b.state.project.site.floors=2;b.addElevator();const selected=b.state.project.plan.rooms[0];b.state.ui.planner.selected=selected.id;b.state.project.site.floors=3;assert.match(b.elevatorIssues().map(i=>i.text).join(' '),/Chưa có ô giếng/);assert.equal(b.syncElevatorFloors(),true);assert.equal(b.elevatorRooms(selected).length,3);
 const before=JSON.stringify(b.state.project.plan);assert.equal(b.deleteElevatorShaft(),true);assert.equal(b.state.project.plan.rooms.length,0);assert.equal(b.state.project.plan.openings.length,0);b.undoPlan();assert.equal(JSON.stringify(b.state.project.plan),before);
});
test('floor slabs leave the shaft open and 3D contains a single whole-house cabin plus every landing',()=>{
 const {b}=client();b.addElevator();const lifts=b.state.project.plan.rooms;for(const r of lifts.filter(r=>r.floor>0)){const panels=b.slabPanels(r,b.stairFloorHoles(r.floor)),area=panels.reduce((n,p)=>n+p.w*p.d,0);assert.ok(area<r.w*r.h*.4);assert.ok(panels.every(p=>p.w>0&&p.d>0));}
 const scene=new THREE.Scene(),mats={dark:new THREE.MeshStandardMaterial()};for(const r of lifts)b.addRoomSceneFurniture(r,r.floor*3.4,THREE,scene,mats,b.state.project.site);
 assert.equal(scene.children.filter(o=>o.userData.kind==='elevator-door').length,6);assert.equal(scene.children.filter(o=>o.userData.kind==='elevator-control').length,1);assert.ok(scene.children.every(o=>o.geometry.attributes.position.array.every(Number.isFinite)));
 const cabin=b.elevatorGeometry(lifts[0]).find(p=>p.kind==='elevator-cabin');assert.equal(cabin.w,1.1);assert.equal(cabin.d,1.3);assert.equal(b.stairFloorHoles(3).length,0);
});
test('unconfirmed installation data and an oversized cabin cannot be marked ready',()=>{
 const {b}=client();b.addElevator();b.state.ui.planner.selected=b.state.project.plan.rooms[0].id;assert.ok(b.elevatorIssues().some(i=>/hồ sơ hãng/.test(i.text)));assert.equal(b.editElevatorSettings('cabinWidth',2),true);assert.ok(b.elevatorIssues().some(i=>i.sev==='error'&&/Cabin vượt/.test(i.text)));b.editElevatorSettings('headroom',4);assert.ok(b.elevatorIssues().some(i=>/cao hơn/.test(i.text)));assert.equal(b.customerDesignSnapshot().status,'preliminary-architecture');
});
test('a client handoff excludes personal finances, family, account data and unknown finish fields',()=>{
 const {b}=client();b.state.access={orderCode:'PRIVATE-ORDER'};b.state.project.plan.rooms=[{id:'r',name:'Khách <script>',type:'living',floor:0,x:0,y:0,w:4,h:4,private:'HIDDEN'}];const snap=b.customerDesignSnapshot(),data=JSON.stringify(snap);assert.doesNotMatch(data,/987654321|12345678|PRIVATE-CHILD|PRIVATE-ORDER|HIDDEN|ownerBirth/);assert.match(data,/approved-floor/);
 const sheets=[{name:'Mặt bằng',svg:'<svg xmlns="http://www.w3.org/2000/svg"/>'}],html=b.customerPresentationHtml(snap,sheets);assert.match(html,/Khách &lt;script&gt;/);assert.doesNotMatch(html,/987654321|PRIVATE-CHILD/);const files=b.customerPackageFiles(snap,sheets,html);assert.equal(files.filter(([p])=>p.startsWith('cad/')).length,3);assert.equal(files.filter(([p])=>p.endsWith('.json')).length,1);assert.doesNotMatch(JSON.stringify(files),/project-backup|PRIVATE/);
});
test('saved camera views stay in their project and reject a deleted room',()=>{
 const {b}=client();b.state.project.plan.rooms=[{id:'r',name:'Khách',type:'living',floor:0,x:0,y:0,w:4,h:4}];b.state.ui.sceneFocus='room:r';b.state.ui.designView='room';b.studio3d={state:{yaw:.4,pitch:.3,dist:6,target:new THREE.Vector3(1,2,3)}};b.saveDesignView();assert.equal(b.savedDesignViews().length,1);const id=b.savedDesignViews()[0].id;assert.equal(b.loadDesignView(id),true);assert.deepEqual(Array.from(b.pendingFinishCamera.target),[1,2,3]);b.state.project.plan.rooms=[];assert.equal(b.loadDesignView(id),false);b.state.project.designStudio={};assert.equal(b.savedDesignViews().length,0);
});
test('sharp raster capture restores renderer, camera, composer and a running light render',async()=>{
 const {b}=client();let size=new THREE.Vector2(800,500),ratio=2,target={},draws=0,restored=0,download;const originalTarget=target,camera=new THREE.PerspectiveCamera(58,1.6),pose=camera.matrixWorld.toArray(),blob=new Blob(['PNG']);
 const renderer={capabilities:{maxTextureSize:4096},getSize:v=>v.copy(size),getPixelRatio:()=>ratio,getRenderTarget:()=>target,setPixelRatio:v=>ratio=v,setSize:(x,y)=>size.set(x,y),setRenderTarget:v=>target=v,domElement:{toBlob(done){assert.ok(size.x>=1280);assert.equal(ratio,1);done(blob);}}};
 const s={renderer,camera,scene:{},ao:{enabled:true},fxaa:{material:{uniforms:{resolution:{value:new THREE.Vector2(1/800,1/500)}}}},composer:{setSize(){},render(){draws++;}},renderFrame(){},archRender:{samples:1,denoise:{render(){restored++;}}}};b.studio3d=s;b.download=(...args)=>download=args;
 assert.equal(await b.captureSharpStudioPreview(),true);assert.equal(draws,1);assert.equal(restored,1);assert.equal(ratio,2);assert.deepEqual(size.toArray(),[800,500]);assert.equal(target,originalTarget);assert.equal(s.ao.enabled,true);assert.deepEqual(s.fxaa.material.uniforms.resolution.value.toArray(),[1/800,1/500]);assert.deepEqual(camera.matrixWorld.toArray(),pose);assert.equal(b.archRenderModules,null);assert.equal(download[1],blob);assert.match(download[0],/1280x800/);
});
test('the default sharpening action uses raster and never starts light transport',async()=>{
 const {b}=client();let calls=0;b.studio3d={renderer:{}};b.captureSharpStudioPreview=async()=>{calls++;return true;};assert.equal(await b.startArchitecturalRender(),true);assert.equal(calls,1);assert.equal(b.archRenderModules,null);assert.equal(b.state.ui.renderQuality,'draft');
});
test('a cached customer cover is isolated by project, drawing, finish and camera',async()=>{
 const {b}=client();let revision='R1',design='finish-1',camera='camera-1';b.drawingRevision=()=>revision;b.cinematicSignature=()=>design;b.cinematicCameraKey=()=>camera;
 const project=b.state.project,frame={project,revision,designKey:design,cameraKey:camera,width:2,height:1,dataUrl:'data:image/png;base64,UE5H'};b.customerFrameCache=frame;
 assert.equal(b.customerFrameMatches(frame),true);assert.equal(await b.cachedCustomerFrame().blob.text(),'PNG');
 b.state.project=structuredClone(project);assert.equal(b.cachedCustomerFrame(),null);b.state.project=project;
 revision='R2';assert.equal(b.cachedCustomerFrame(),null);revision='R1';design='finish-2';assert.equal(b.cachedCustomerFrame(),null);design='finish-1';camera='camera-2';assert.equal(b.cachedCustomerFrame(),null);camera='';assert.equal(b.cachedCustomerFrame(),null);
});
test('navigation never copies an unfinished, stale, or advanced-light frame into the dossier',()=>{
 const {b}=client();b.cinematicCameraKey=()=> 'camera-1';b.cinematicSignature=()=> 'finish-1';b.studio3d={renderer:{},raf:1,displayedCameraKey:'camera-1',displayedDesignKey:'finish-1'};
 assert.equal(b.cacheCustomerFrame(),false);b.studio3d.raf=0;b.studio3d.displayedCameraKey='camera-0';assert.equal(b.cacheCustomerFrame(),false);b.studio3d.displayedCameraKey='camera-1';b.studio3d.archRender={};assert.equal(b.cacheCustomerFrame(),false);assert.equal(b.customerFrameCache,null);
});
test('an immediate edit keeps a just-opened disclosure without copying it to another project',()=>{
 const {b,context}=client();b.render();context.document.querySelectorAll=()=>[{dataset:{guidedPanel:'colours:r'},open:true}];b.render({preserveScroll:true});assert.equal(b.state.ui.guidedPanels['colours:r'],true);
 b.state.project=structuredClone(b.state.project);b.state.ui.guidedPanels={};b.render();assert.equal(b.state.ui.guidedPanels['colours:r'],undefined);
});
test('failed sharp image rendering restores the display and shadow-update state',async()=>{
 const {b}=client();let size=new THREE.Vector2(800,500),ratio=2,target=null;const renderer={shadowMap:{enabled:true,autoUpdate:true,needsUpdate:false},capabilities:{maxTextureSize:4096},getSize:v=>v.copy(size),getPixelRatio:()=>ratio,getRenderTarget:()=>target,setPixelRatio:v=>ratio=v,setSize:(x,y)=>size.set(x,y),setRenderTarget:v=>target=v};
 const s={renderer,scene:{traverse(fn){fn({isLight:true,castShadow:true,shadow:{map:{},needsUpdate:false}});}},ao:{enabled:true},composer:{setSize(){},render(){throw Error('GPU failed');}},renderFrame(){throw Error('Redraw failed');}};b.studio3d=s;
 assert.equal(await b.captureSharpStudioPreview(),false);assert.equal(renderer.shadowMap.autoUpdate,true);assert.equal(ratio,2);assert.deepEqual(size.toArray(),[800,500]);assert.equal(s.ao.enabled,true);assert.equal(s.sharpExport,null);
});
