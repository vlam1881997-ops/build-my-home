import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
import {designClient} from './fixtures/design-client.mjs';
test('stair editor completes a third landing, synchronizes dimensions/direction, and retains undo and locks',()=>{
 const b=designClient(),p=b.state.project;Object.assign(p.site,{width:10,depth:15,floors:3});
 p.plan.rooms=[0,1].map(f=>({id:'stair-'+f,name:'Thang',type:'stairs',floor:f,x:1,y:1,w:3.4,h:4,stairShape:'u',stairDirection:0}));p.plan.openings=[];p.plan.fixtures=[];p.plan.furniture=[];b.state.ui.planner.floor=0;b.state.ui.planner.selected='stair-0';
 assert.equal(b.editStairStack('stair-0',{},true),true);assert.equal(p.plan.rooms.length,3);assert.equal(b.stairAlignmentIssues().filter(i=>i.sev==='error').length,0);
 assert.equal(b.editDirectItem('room','stair-0','stairDirection','90'),true);assert.ok(p.plan.rooms.every(r=>r.stairDirection===90));
 assert.equal(b.editDirectItem('room','stair-0','w','3.6'),true);assert.ok(p.plan.rooms.every(r=>r.w===3.6));b.undoPlan();assert.ok(p.plan.rooms.every(r=>r.w===3.4));
 p.plan.lockedFloors=[2];const before=JSON.stringify(p.plan);assert.equal(b.editStairStack('stair-0',{stairDirection:180}),false);assert.equal(JSON.stringify(p.plan),before);
 p.plan.lockedFloors=[];assert.equal(b.editStairStack('stair-0',{stairDirection:45}),false);
 assert.match(b.directEditHtml(),/data-direct-stair-sync/);assert.match(b.directEditHtml(),/Hướng vế đầu đi lên/);
});
test('stair completion rejects an occupied third floor without moving or deleting its rooms',()=>{
 const b=designClient(),p=b.state.project;Object.assign(p.site,{width:10,depth:15,floors:3});
 p.plan.rooms=[{id:'stair',type:'stairs',name:'Thang',floor:0,x:1,y:1,w:3.4,h:4},{id:'bed',type:'bed',name:'Ngủ',floor:2,x:1,y:1,w:3.4,h:4}];p.plan.openings=[];p.plan.fixtures=[];
 const before=JSON.stringify(p.plan);assert.equal(b.editStairStack('stair',{},true),false);assert.equal(JSON.stringify(p.plan),before);assert.match(b.state.ui.planner.directNotice,/chồng|ranh/);
});
function client(){
 const storage=new Map();
 let id=0;const B={VERSION:'test',STORAGE_KEY:'architect-test',LEGACY_STORAGE_KEYS:[],SCREENS:[],planHistory:{undo:[],redo:[]},MATERIALS:{},REGIONS:{'TP. Hồ Chí Minh':{defaultDistrict:'Phường Sài Gòn',districts:[['Phường Sài Gòn',10,106]]}},REGION_ALIASES:{},regionPoint:()=>({district:'Phường Sài Gòn',lat:10,lng:106}),defaultDataEngineState:()=>({cost:{},quote:{},materialOverrides:{},status:{},snapshots:[]}),uid:p=>p+'-'+(++id),roundTo:(n,s)=>Math.round(n/s)*s,clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),esc:v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),render(){},toast(){},$:()=>null,screen1:()=>'',screen4:()=>'',screen5:()=>'',screen7:()=>'',screen8:()=>'',screen9:()=>'',screen10:()=>'',roomEditingPanel:()=>'',architecturalRenderControlsHtml:()=>'',architectDocument:()=>({}),studioStructureKey:()=>'',cinematicRender:{views:{}},customerDesignSnapshot:()=>({project:{},checks:[]}),customerPackageFiles:()=>[],exportCustomerPackage:async()=>true,finishPalette:id=>B.state.project.materials.finish.rooms[id]||B.state.project.materials.finish.exterior,navigateTo(step){B.state.ui.step=step;},externalSides:()=>['north','west'],num:String};
 const ctx={BMH:B,localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)},document:{addEventListener(){},querySelectorAll:()=>[]},window:{addEventListener(){}},performance:{now:()=>0},structuredClone,queueMicrotask(){},console,Date,Blob,TextEncoder,Uint8Array};
 for(const f of ['10_state','20_calc','30_planner','35_dossier','40_exports','44_house_styles','45_studio3d'])vm.runInNewContext(fs.readFileSync('src/'+f+'.js','utf8'),ctx);
 const source=fs.readFileSync('src/75_completion.js','utf8');vm.runInNewContext(source.slice(source.indexOf('BMH.HOUSE_STYLES.push'),source.indexOf('BMH.styleIllustration=')),ctx);vm.runInNewContext(source.slice(source.indexOf('BMH.sceneFootprintBounds='),source.indexOf('// Studio renders from this registry')),ctx);
 const architecture=fs.readFileSync('src/76_architecture.js','utf8');vm.runInNewContext(architecture.slice(architecture.indexOf('BMH.projectLevels='),architecture.indexOf('BMH.editOpening=')),ctx);B.householdNeeds=()=>({bedrooms:4});B.buildableEnvelope=()=>({buildWidth:8,buildDepth:16.776470588235296,originX:.5,originY:2,front:2,side:.5});B.projectLevels=()=>B.siteLevels();B.roomInsideParcel=()=>true;B.planMetrics=plan=>({area:plan.rooms.reduce((s,r)=>s+r.w*r.h,0)});B.DIRECTIONS=[['Bắc',0],['Đông Bắc',45],['Đông',90],['Đông Nam',135],['Nam',180],['Tây Nam',225],['Tây',270],['Tây Bắc',315]];B.directionAngle=n=>B.DIRECTIONS.find(([k])=>k===n)?.[1]??180;
 for(const f of ['78_design_workflow','79_stair_design','81_design_studio','85_interior_collections','86_visual_materials','90_product_polish','87_elevator_design','92_measured_design','94_architectural_design','95_architectural_documents','99_customer_design','100_customer_experience'])vm.runInNewContext(fs.readFileSync('src/'+f+'.js','utf8'),ctx);
 const p=B.state.project;Object.assign(p.site,{width:9,depth:22,floors:3,floorHeight:3.4,slabThickness:.14,ceilingDrop:.2});p.style='Việt Nam đương đại';p.household={ownerBirth:1988,ownerGender:'Nam',partnerEnabled:false,children:[{name:'Con'}],relatives:[{name:'Ông bà'}]};p.briefIdea='4 phòng ngủ, 2 WC, thang máy';p.designStudio={program:{mode:'custom',floors:[{bedrooms:0,bathrooms:1,living:true,kitchen:true,worship:'living'},{bedrooms:2,bathrooms:0},{bedrooms:1,bathrooms:1,worship:'room'}]}};p.materials={...p.materials,choices:{...p.materials.choices,floor:'CUSTOM-SKU'},finish:{exterior:{wall:'#eee7d9',floor:'#d4b78e',accent:'#7b513b'},rooms:{}}};p.plan={furniture:[],rooms:[],openings:[],outdoor:[],fixtures:[],lockedRoomIds:[],lockedFloors:[]};return B;
}
test('each floor keeps its requested rooms, zero WC floor and freely chosen worship location',()=>{
 const b=client();for(const strategy of ['climate','balanced','compact']){const result=b.architectureProposal(strategy);assert.equal(result.ok,true,result.reason);b.state.project.plan=result.plan;assert.deepEqual(Array.from({length:3},(_,f)=>['bed','bath','worship'].map(t=>result.plan.rooms.filter(r=>r.floor===f&&r.type===t).length)),[[0,1,0],[2,0,0],[1,1,1]]);assert.equal(result.plan.fixtures.length,2);assert.equal(b.measuredGeometryIssues().length,0);for(let f=0;f<3;f++)assert.equal(b.circulationAnalysis(f).unreachable.length,0);}
});
test('living altar shares exact SVG, CAD and schedule dimensions and supports delete undo redo',()=>{
 const b=client();assert.equal(b.autoPlanConcept(),true);const q=b.planFixtures()[0],room=b.state.project.plan.rooms.find(r=>r.id===q.roomId);assert.equal(room.type,'living');assert.match(b.furnitureSvg(room),/data-fixture-reference/);assert.ok(b.planDxf(q.floor).includes(q.name));const s=b.architecturalFurnitureSchedule(q.floor).find(x=>x.fixtureId===q.id);assert.equal(s.w,q.w);assert.equal(s.d,q.d);assert.equal(s.h,q.h);assert.equal(b.removePlanItem('fixture',q.id),true);assert.equal(b.planFixtures().length,1);b.undoPlan();assert.equal(b.planFixtures().length,2);b.redoPlan();assert.equal(b.planFixtures().length,1);
});
test('new style controls shapes while explicit materials and product bindings remain selected',()=>{
 const b=client();b.autoPlanConcept();const p=b.state.project,r=p.plan.rooms.find(r=>r.type==='living');p.style='Japandi';b.applyInteriorCollection('warm-oak');b.applyVisualMaterial('floor','white-marble');p.style='Đông Dương · Indochine';assert.equal(b.interiorCollection(r.id).id,'indochine');assert.equal(b.finishPalette(r.id).shape,'timber');assert.equal(b.finishPalette(r.id).visualMaterials.floor,'white-marble');assert.equal(p.materials.finish.rooms[r.id].visualMaterials.floor,'white-marble');p.materials.finish.rooms[r.id].catalogMaterials={floor:{id:'CLIENT-SKU',profileId:'white-marble'}};assert.equal(b.finishPalette(r.id).materialBindingStatuses.floor.valid,false);assert.equal(p.materials.finish.rooms[r.id].catalogMaterials.floor.id,'CLIENT-SKU');b.applyInteriorCollection('neo-elegance',r.id);assert.equal(b.styleOutputReview().rooms.find(x=>x.roomId===r.id).styleAligned,false);b.returnInteriorToStyle(r.id);assert.equal(b.interiorCollection(r.id).id,'indochine');
});
test('applying another spatial option remaps per-room finishes and supplier bindings semantically',()=>{
 const b=client();assert.equal(b.generateDesignKits(),true);assert.equal(b.applyDesignKit('A'),true);const p=b.state.project,r=p.plan.rooms.find(r=>r.type==='bed'&&r.floor===1);b.applyVisualMaterial('floor','walnut-floor',r.id);p.materials.finish.rooms[r.id].catalogMaterials={floor:{id:'MY-SKU',profileId:'walnut-floor'}};assert.equal(b.generateDesignKits(),true);assert.equal(b.applyDesignKit('B'),true);const next=p.plan.rooms.find(q=>q.floor===r.floor&&q.type===r.type&&q.name===r.name);assert.equal(b.finishPalette(next.id).visualMaterials.floor,'walnut-floor');assert.equal(p.materials.finish.rooms[next.id].catalogMaterials.floor.id,'MY-SKU');
});
test('a direct passage is a wall hole with no door leaf or door purchase area',()=>{
 const b=client(),p=b.state.project;p.plan={furniture:[],rooms:[{id:'room',type:'living',name:'Khách',floor:0,x:1,y:2,w:4,h:4}],openings:[],fixtures:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};const q=b.directOpeningAt('passage','room','north',{x:3,y:2});assert.ok(q);assert.equal(b.doorLeafGeometry(q),null);assert.equal(b.measuredQuantities().doorArea,0);assert.equal(b.openingSchedule()[0].passage,true);assert.match(b.openingSvg(q),/passage/);assert.doesNotMatch(b.openingSvg(q),/door-leaf/);b.removePlanItem('opening',q.id);assert.equal(p.plan.openings.length,0);b.undoPlan();assert.equal(p.plan.openings.length,1);
});
test('locked shared walls reject opening edits and deletion; invalid rooms do not alter history',()=>{
 const b=client(),p=b.state.project;p.plan={furniture:[],rooms:[{id:'a',type:'living',name:'A',floor:0,x:1,y:2,w:3,h:4},{id:'z',type:'bed',name:'Z',floor:0,x:4,y:2,w:3,h:4}],openings:[{id:'door',roomId:'a',floor:0,kind:'door',side:'east',offset:.5,width:.9}],fixtures:[],lockedRoomIds:['z'],lockedFloors:[]};const before=JSON.stringify(p.plan),count=b.planHistory.undo.length;assert.equal(b.directOpeningAt('window','a','east',{x:4,y:2.5}),false);assert.notEqual(b.removePlanItem('opening','door'),true);assert.equal(JSON.stringify(p.plan),before);assert.equal(b.addDirectRoom({x:2,y:2},{x:3,y:3},'office'),false);assert.equal(b.planHistory.undo.length,count);
});
test('floor intent, direct edit controls and measured fixtures survive schema merge',()=>{
 const b=client();b.autoPlanConcept();b.state.ui.planner.directTool='altar';b.state.ui.programFloor=2;const loaded=b.mergeState(b.defaultState(),b.state);assert.equal(loaded.ui.planner.directTool,'altar');assert.equal(loaded.ui.programFloor,2);assert.equal(loaded.project.designStudio.program.floors[2].worship,'room');assert.equal(loaded.project.plan.fixtures.length,2);assert.equal(b.defaultState().project.plan.fixtures.length,0);
});
test('moving a room translates its altar; shrinking across it rejects the whole edit',()=>{
 const b=client(),p=b.state.project;p.plan={furniture:[],rooms:[{id:'r',type:'worship',name:'Thờ',floor:0,x:1,y:2,w:4,h:4}],openings:[],fixtures:[],lockedRoomIds:[],lockedFloors:[]};assert.ok(b.addDirectAltar('r','north'));const old=clonePlain(p.plan);const plan=b.planSnapshot();plan.rooms[0].x+=1;assert.equal(b.commitDirectPlan(plan),true);assert.equal(p.plan.fixtures[0].x,old.fixtures[0].x+1);const duplicate={...p.plan.fixtures[0],id:'duplicate'};assert.equal(b.fixtureFits(duplicate,{...p.plan,fixtures:[...p.plan.fixtures,duplicate]}),false);const before=JSON.stringify(p.plan),bad=b.planSnapshot();bad.rooms[0].w=.8;assert.equal(b.commitDirectPlan(bad),false);assert.equal(JSON.stringify(p.plan),before);
});
function clonePlain(x){return structuredClone(x);}
test('altar facing uses surveyed front direction and marks unknown cultural criteria',()=>{
 const b=client();b.autoPlanConcept();const before=JSON.stringify(b.state.project.plan);b.state.project.site.frontDirection='Nam';let rows=b.worshipReview();assert.ok(rows.every(x=>x.coverage===100));b.state.project.site.frontDirection='Chưa rõ';rows=b.worshipReview();assert.ok(rows.every(x=>x.coverage===75&&x.facing===null));assert.equal(JSON.stringify(b.state.project.plan),before);
});
test('out-of-range imported floor count stays visible and blocks automatic proposal',()=>{
 const b=client();b.designState().program.floors[1].bedrooms=22;assert.equal(b.ensureFloorProgram(false)[1].bedrooms,22);assert.equal(b.ensureFloorProgram()[1].bedrooms,22);const before=JSON.stringify(b.state.project.plan);assert.equal(b.architectureProposal().ok,false);assert.equal(b.autoPlanConcept(),false);assert.equal(JSON.stringify(b.state.project.plan),before);
});
test('whole-house material choices cover office, worship, corridors and future rooms',()=>{
 const b=client();b.autoPlanConcept();b.applyVisualMaterial('floor','white-marble');for(const r of b.state.project.plan.rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type)))assert.equal(b.finishPalette(r.id).visualMaterials.floor,'white-marble');b.state.project.plan.rooms.push({id:'new',type:'office',name:'Mới',floor:2,x:0,y:0,w:1,h:1});assert.equal(b.finishPalette('new').visualMaterials.floor,'white-marble');assert.equal(b.finishPalette('new').floor,'#f0ede6');
});
test('room rotation carries altar dimensions and side, with invalid fixtures reported',()=>{
 const b=client(),p=b.state.project;p.plan={furniture:[],rooms:[{id:'r',type:'worship',name:'Thờ',floor:0,x:2,y:3,w:3,h:4}],openings:[],fixtures:[],lockedRoomIds:[],lockedFloors:[]};b.state.ui.planner.selected='r';const q=b.addDirectAltar('r','north'),old=clonePlain(q);assert.equal(b.rotateSelectedRoom(),true);const next=p.plan.fixtures[0];assert.equal(next.w,old.d);assert.equal(next.d,old.w);assert.equal(next.side,'east');assert.equal(b.fixtureFits(next),true);b.undoPlan();assert.equal(p.plan.fixtures[0].side,'north');p.plan.fixtures[0].x=-10;assert.ok(b.measuredGeometryIssues().some(i=>i.text.includes('Bàn thờ')));
});

test('customer-added laundry and named rooms appear on the requested floor with minimum area and measured fittings',()=>{
 const b=client();const q=b.addProgramRoom(1,'laundry');assert.ok(q);b.editProgramRoom(1,q.id,'name','Giặt và sấy');b.editProgramRoom(1,q.id,'minArea',5);const custom=b.addProgramRoom(2,'custom');b.editProgramRoom(2,custom.id,'name','Phòng may của mẹ');const result=b.architectureProposal();assert.equal(result.ok,true,result.reason);b.state.project.plan=result.plan;const laundry=result.plan.rooms.find(r=>r.programRoomId===q.id),room=result.plan.rooms.find(r=>r.programRoomId===custom.id);assert.equal(laundry.floor,1);assert.equal(laundry.type,'laundry');assert.ok(laundry.w*laundry.h>=5);assert.equal(room.floor,2);assert.equal(room.name,'Phòng may của mẹ');const machine=b.roomFurnitureLayout(laundry).find(i=>i.model==='washingMachine');assert.ok(machine);assert.equal(machine.w,.6);assert.equal(machine.d,.65);assert.equal(machine.h,.85);assert.match(b.furnitureSvg(laundry),/washingMachine/);assert.ok(b.architecturalFurnitureSchedule(1).some(i=>i.model==='washingMachine'));assert.equal(b.circulationAnalysis(1).unreachable.length,0);const loaded=b.mergeState(b.defaultState(),b.state);assert.equal(loaded.project.designStudio.program.floors[1].extraRooms[0].name,'Giặt và sấy');
});
test('invalid or oversized room requests preserve the current plan; removing a request supports undo',()=>{
 const b=client();b.autoPlanConcept();const before=JSON.stringify(b.state.project.plan),q=b.addProgramRoom(1,'gym');b.editProgramRoom(1,q.id,'minArea',190);assert.equal(b.architectureProposal().ok,false);assert.equal(b.autoPlanConcept(),false);assert.equal(JSON.stringify(b.state.project.plan),before);b.editProgramRoom(1,q.id,'count',0);assert.match(b.floorProgramError(b.ensureFloorProgram(false)),/phòng thêm/);b.removeProgramRoom(1,q.id);assert.equal(b.requestedFloorProgram()[1].extraRooms.length,0);b.undoPlan();assert.equal(b.requestedFloorProgram()[1].extraRooms[0].count,0);
});

function directFixture(b){
 const p=b.state.project;p.plan={furniture:[],rooms:[{id:'a',type:'living',name:'Khách',floor:0,x:1,y:2,w:3,h:4},{id:'b',type:'bed',name:'Ngủ',floor:0,x:4,y:2,w:3,h:4},{id:'upper',type:'office',name:'Làm việc',floor:1,x:1,y:2,w:4,h:4}],openings:[],fixtures:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};Object.assign(b.state.ui.planner,{floor:0,selected:'a',selectedOpening:'',selectedFixture:'',snap:.2,directTool:'select'});b.planHistory.undo.length=0;b.planHistory.redo.length=0;return p;
}
function unchanged(b,action,pattern){
 const before=JSON.stringify({plan:b.state.project.plan,history:b.planHistory,materials:b.state.project.materials,style:b.state.project.style,program:b.designState().program});assert.equal(action(),false);assert.equal(JSON.stringify({plan:b.state.project.plan,history:b.planHistory,materials:b.state.project.materials,style:b.state.project.style,program:b.designState().program}),before);assert.match(b.state.ui.planner.directNotice,pattern);
}
function aperture(b,o){
 const span=b.openingWallSpan(o),g=b.openingGeometry(o),walls=b.scenePlanGeometry(b.state.project.plan,o.floor).walls.filter(w=>w.openingId===o.id);assert.ok(span);assert.ok(walls.length);
 const a=Math.min(...walls.map(w=>w.a)),z=Math.max(...walls.map(w=>w.b));assert.ok(Math.abs(span.a-a)<=.001,'existing 3D wall segments use millimetre quantization');assert.ok(Math.abs(span.b-z)<=.001);assert.ok(walls.every(w=>Math.abs(w.axis-span.c)<=.001));assert.ok(Math.abs((a+z)/2-(span.o==='h'?g.x:g.y))<=.001);const svg=b.openingSvg(o),cut=svg.match(/<line class="opening-cut"[^>]+/)[0],n=key=>Number(cut.match(new RegExp(key+'="([^"]+)"'))[1]);assert.equal(n('x1'),span.o==='h'?span.a:span.c);assert.equal(n('y1'),span.o==='h'?span.c:span.a);assert.equal(n('x2'),span.o==='h'?span.b:span.c);assert.equal(n('y2'),span.o==='h'?span.c:span.b);return clonePlain({span,x:g.x,y:g.y,walls,leaf:b.doorLeafGeometry(o)});
}
test('off-centre door retains exact schema and measured SVG/3D aperture through delete undo redo and reload',()=>{
 const b=client(),p=directFixture(b),keep=clonePlain({style:p.style,materials:p.materials,program:b.designState().program});
 const door=b.directOpeningAt('door','a','north',{x:2.0173456789,y:2});assert.ok(door);assert.notEqual(door.offset,.5);const stored=clonePlain(door),shape=aperture(b,door),timeline=b.planHistory.undo.length;
 assert.equal(b.editDirectItem('opening',door.id,'offset',String(door.offset)),true);assert.equal(b.planHistory.undo.length,timeline);assert.deepEqual(p.plan.openings[0],stored);
 assert.equal(b.editDirectItem('opening',door.id,'distance',String((3-door.width)*door.offset)),true);assert.equal(b.planHistory.undo.length,timeline);assert.deepEqual(p.plan.openings[0],stored);
 b.state.ui.planner.selectedOpening=door.id;const html=b.directEditHtml();assert.ok(html.includes('value="'+door.offset+'"'));assert.ok(html.includes('ID '+door.id));assert.match(html,/TẦNG 1/);assert.match(html,/step="any"/);assert.deepEqual(p.plan.openings[0],stored);
 assert.equal(b.editDirectItem('opening',door.id,'height','2.123456789'),true);assert.equal(p.plan.openings[0].offset,stored.offset);b.undoPlan();assert.deepEqual(p.plan.openings[0],stored);
 assert.equal(b.removePlanItem('opening',door.id),true);assert.equal(p.plan.openings.length,0);b.undoPlan();assert.deepEqual(p.plan.openings[0],stored);assert.deepEqual(aperture(b,p.plan.openings[0]),shape);
 b.redoPlan();assert.equal(p.plan.openings.length,0);assert.equal(b.scenePlanGeometry(p.plan,0).walls.some(w=>w.openingId===door.id),false);b.undoPlan();assert.deepEqual(p.plan.openings[0],stored);assert.deepEqual(aperture(b,p.plan.openings[0]),shape);
 b.save();b.state=b.loadState();b.normalizeState();assert.deepEqual(clonePlain(b.state.project.plan.openings[0]),stored);assert.deepEqual(aperture(b,b.state.project.plan.openings[0]),shape);assert.deepEqual(clonePlain({style:b.state.project.style,materials:b.state.project.materials,program:b.designState().program}),keep);
});
test('numeric opening/room failures, collisions and impossible placements preserve undo and redo',()=>{
 const b=client();directFixture(b);const door=b.directOpeningAt('door','a','north',{x:1.9,y:2}),window=b.directOpeningAt('window','a','south',{x:2.5,y:6});assert.ok(window);b.undoPlan();assert.equal(b.planHistory.redo.length,1);
 for(const [key,value,reason]of [['width','',/hữu hạn/],['width','NaN',/hữu hạn/],['width','Infinity',/hữu hạn/],['width','.49',/0,50/],['width','3',/quá rộng/],['height','0',/0,30/],['height','4',/vượt/],['offset','-0.1',/0 đến 1/],['offset','1.1',/0 đến 1/],['sill','.1',/bậu bằng 0/],['distance','9',/Khoảng cách/],['side','invalid',/cạnh tường/]])unchanged(b,()=>b.editDirectItem('opening',door.id,key,value),reason);
 unchanged(b,()=>b.directOpeningAt('door','a','north',{x:1.9,y:2}),/trùng/);unchanged(b,()=>b.directOpeningAt('window','a','north',{x:NaN,y:2}),/tọa độ/);
 unchanged(b,()=>b.directOpeningAt('door','a','north',{x:20,y:2}),/ngoài phòng/);
 unchanged(b,()=>b.editDirectItem('room','a','w',''),/hữu hạn/);unchanged(b,()=>b.editDirectItem('room','a','w','.5'),/0,60/);unchanged(b,()=>b.editDirectItem('room','a','w','3.2'),/chồng/);unchanged(b,()=>b.editDirectItem('room','a','x','-1'),/ranh/);
 unchanged(b,()=>b.addDirectRoom({x:1,y:2},{x:2,y:3},'office'),/chồng/);unchanged(b,()=>b.addDirectRoom({x:1,y:9},{x:1.2,y:9.2},'office'),/0,60/);unchanged(b,()=>b.addDirectRoom({x:8,y:9},{x:10,y:11},'corridor'),/ranh/);
 unchanged(b,()=>b.addOpeningFromInspector({kind:'window',side:'west',width:1.2,height:'',sill:.9,offset:.2}),/0,30/);
 const narrow=b.planSnapshot();narrow.rooms[0].w=.65;unchanged(b,()=>b.commitDirectPlan(narrow),/quá rộng/);
 assert.equal(b.editDirectItem('opening',door.id,'offset','0.1234567890123'),true);assert.equal(b.state.project.plan.openings.find(o=>o.id===door.id).offset,.1234567890123);assert.equal(b.planHistory.redo.length,0);aperture(b,b.state.project.plan.openings[0]);
});
test('inverse SVG matrix keeps measured points through zoom, pan and landscape rotation',()=>{
 const b=client(),point={x:2.0173456789,y:4.123456789},matrix={a:0,b:-37.2,c:37.2,d:0,e:128.75,f:722.4},det=matrix.a*matrix.d-matrix.b*matrix.c,screen={x:matrix.a*point.x+matrix.c*point.y+matrix.e,y:matrix.b*point.x+matrix.d*point.y+matrix.f},inverse={a:matrix.d/det,b:-matrix.b/det,c:-matrix.c/det,d:matrix.a/det,e:(matrix.c*matrix.f-matrix.d*matrix.e)/det,f:(matrix.b*matrix.e-matrix.a*matrix.f)/det};let usedInverse=false;
 const svg={createSVGPoint:()=>({x:0,y:0,matrixTransform(m){return {x:m.a*this.x+m.c*this.y+m.e,y:m.b*this.x+m.d*this.y+m.f};}}),querySelector:()=>({getScreenCTM:()=>({inverse(){usedInverse=true;return inverse;}})}),getBoundingClientRect(){throw Error('Do not fall back to screen rectangle for an invertible CTM');}};
 const actual=b.svgPoint({clientX:screen.x,clientY:screen.y},svg);assert.equal(usedInverse,true);assert.ok(Math.abs(actual.x-point.x)<1e-12);assert.ok(Math.abs(actual.y-point.y)<1e-12);
});
test('room/floor locks and both sides of old/new shared walls reject every direct mutation',()=>{
 const b=client(),p=directFixture(b),door=b.directOpeningAt('door','a','east',{x:4,y:4.9});assert.ok(door);const other=b.directOpeningAt('window','a','north',{x:2,y:2});assert.ok(other);b.undoPlan();p.plan.lockedRoomIds=['b'];
 unchanged(b,()=>b.editOpening(door.id,{offset:.123}),/bên kia/);unchanged(b,()=>b.removePlanItem('opening',door.id),/bên kia/);unchanged(b,()=>b.directOpeningAt('passage','a','east',{x:4,y:2.8}),/bên kia/);
 unchanged(b,()=>b.addDirectRoom({x:4,y:6},{x:5,y:8},'corridor'),/Tường chung/);
 unchanged(b,()=>b.removePlanItem('room','a'),/Tường chung/);unchanged(b,()=>b.editDirectItem('room','a','x','.8'),/Tường chung/);unchanged(b,()=>b.editDirectItem('room','a','w','2.8'),/Tường chung/);unchanged(b,()=>b.rotateSelectedRoom(),/Tường chung|tường chung|bên kia/);
 p.plan.lockedRoomIds=[];p.plan.lockedFloors=[0];unchanged(b,()=>b.editOpening(door.id,{offset:.2}),/khóa/);unchanged(b,()=>b.removePlanItem('room','a'),/khóa/);unchanged(b,()=>b.addDirectRoom({x:1,y:9},{x:3,y:11},'office'),/khóa/);unchanged(b,()=>b.addDirectAltar('a','south'),/khóa/);
 p.plan.lockedFloors=[];p.plan.lockedRoomIds=['a'];unchanged(b,()=>b.directOpeningAt('window','a','west',{x:1,y:3}),/khóa/);
 p.plan.lockedRoomIds=['b'];const candidate=b.planSnapshot();candidate.rooms[0].x=1.2;candidate.rooms[0].w=2.8;unchanged(b,()=>b.commitDirectPlan(candidate),/Tường chung/);
 // A side edit also checks the destination shared wall.
 p.plan.lockedRoomIds=[];const north=b.directOpeningAt('window','a','north',{x:2,y:2});assert.ok(north);p.plan.lockedRoomIds=['b'];unchanged(b,()=>b.editOpening(north.id,{side:'east'}),/bên kia/);
});
test('detached room drag previews preserve the plan/history; rejected final drop has no undo entry',()=>{
 const b=client(),p=directFixture(b),q=b.addDirectAltar('upper','north');assert.ok(q);const room=b.addDirectRoom({x:1,y:9},{x:3,y:12},'custom');assert.ok(room);b.undoPlan();const before=JSON.stringify({plan:p.plan,history:b.planHistory});
 const d={id:'upper',mode:'move',startPoint:{x:2,y:3},originalPlan:b.planSnapshot()},valid=b.directRoomDragCandidate(d,{x:3,y:3});assert.equal(valid.reason,'');assert.equal(valid.plan.fixtures[0].x,q.x+1);assert.equal(JSON.stringify({plan:p.plan,history:b.planHistory}),before);
 const bad=b.directRoomDragCandidate({...d,id:'a',mode:'resize'},{x:2.8,y:3});assert.match(bad.reason,/chồng/);assert.equal(JSON.stringify({plan:p.plan,history:b.planHistory}),before);
 b.drag={...d,pointerId:7,captureEl:{releasePointerCapture(){}},selectionChanged:false};const svg={querySelector:()=>null,createSVGPoint:()=>({x:0,y:0,matrixTransform(){return {x:100,y:100};}}),getScreenCTM:()=>({inverse:()=>({})})};b.$=()=>svg;
 // The room clamps to the parcel, then overlaps the room on the same floor.
 b.drag.id='a';svg.createSVGPoint=()=>({matrixTransform:()=>({x:5,y:3})});
 unchanged(b,()=>b.finishDirectRoomDrag({pointerId:7,clientX:0,clientY:0}),/chồng/);assert.equal(b.drag,null);
 assert.equal(b.commitDirectPlan(valid.plan,null,{translateFixtures:false}),true);assert.equal(p.plan.fixtures[0].x,q.x+1);b.undoPlan();assert.equal(p.plan.fixtures[0].x,q.x);b.redoPlan();assert.equal(p.plan.fixtures[0].x,q.x+1);
});
test('passage and fixtures keep measured data, supplier finishes and floor intent after room edits and disk reload',()=>{
 const b=client(),p=directFixture(b);p.style='Japandi';p.materials.finish.rooms.a={floor:'#c4b18b',visualMaterials:{floor:'oak-floor'},catalogMaterials:{floor:{id:'EXACT-SKU',sku:'WOOD-01'}}};const keep=clonePlain({style:p.style,materials:p.materials,program:b.designState().program});
 const q=b.addDirectAltar('upper','north'),passage=b.directOpeningAt('passage','a','north',{x:1.85,y:2}),window=b.directOpeningAt('window','a','south',{x:2.8,y:6});assert.ok(q&&passage&&window);
 assert.equal(b.editDirectItem('opening',passage.id,'width','1.1234567'),true);assert.equal(b.doorLeafGeometry(p.plan.openings.find(o=>o.id===passage.id)),null);assert.doesNotMatch(b.openingSvg(p.plan.openings.find(o=>o.id===passage.id)),/door-leaf/);assert.equal(b.measuredQuantities().doorArea,0);
 assert.equal(b.editDirectItem('room','upper','x','1.123456789'),true);const fixture=clonePlain(p.plan.fixtures[0]),plan=clonePlain(p.plan);assert.ok(Math.abs(fixture.x-q.x-.123456789)<1e-12);b.save();b.state=b.loadState();b.normalizeState();
 assert.deepEqual(clonePlain(b.state.project.plan),plan);assert.deepEqual(clonePlain(b.planFixtures()[0]),fixture);assert.deepEqual(clonePlain({style:b.state.project.style,materials:b.state.project.materials,program:b.designState().program}),keep);for(const o of b.state.project.plan.openings)aperture(b,o);
 assert.equal(b.removePlanItem('room','upper'),true);assert.equal(b.planFixtures().length,0);b.undoPlan();assert.deepEqual(clonePlain(b.planFixtures()[0]),fixture);b.redoPlan();assert.equal(b.planFixtures().length,0);
});
test('too-small walls and fixture collisions reject placement without disturbing redo',()=>{
 const b=client();directFixture(b);const small=b.addDirectRoom({x:1,y:9},{x:1.6,y:11},'office');assert.ok(small);const other=b.addDirectRoom({x:3,y:9},{x:5,y:11},'office');assert.ok(other);b.undoPlan();
 unchanged(b,()=>b.directOpeningAt('door',small.id,'north',{x:1.3,y:9}),/0,50/);unchanged(b,()=>b.addDirectAltar(small.id,'north'),/Bàn thờ/);
 const door=b.directOpeningAt('door','a','east',{x:4,y:3.7});assert.ok(door);unchanged(b,()=>b.directOpeningAt('door','b','west',{x:4,y:3.7}),/trùng/);
});

test('exact laundry request keeps nullable metres, count and stable request ID across transfer undo and disk reload',()=>{
 const b=client(),q=b.addProgramRoom(1,'laundry');assert.equal(q.width,null);assert.equal(q.depth,null);
 b.editProgramRoom(1,q.id,'name','Giặt đồ và sấy');b.editProgramRoom(1,q.id,'width','2.4');b.editProgramRoom(1,q.id,'depth','2.2');b.editProgramRoom(1,q.id,'count',2);
 const before=clonePlain(b.requestedFloorProgram()[1].extraRooms[0]);assert.equal(b.floorProgramError(b.requestedFloorProgram()),'');
 assert.equal(b.moveProgramRoom(1,q.id,2),true);assert.equal(b.requestedFloorProgram()[1].extraRooms.length,0);assert.deepEqual(clonePlain(b.requestedFloorProgram()[2].extraRooms[0]),before);
 b.undoPlan();assert.deepEqual(clonePlain(b.requestedFloorProgram()[1].extraRooms[0]),before);b.redoPlan();assert.deepEqual(clonePlain(b.requestedFloorProgram()[2].extraRooms[0]),before);
 b.save();b.state=b.loadState();b.normalizeState();assert.deepEqual(clonePlain(b.requestedFloorProgram()[2].extraRooms[0]),before);
});
test('exact requested room dimensions reach measured geometry without shrinking or inventing optional rooms',()=>{
 const b=client(),q=b.addProgramRoom(1,'laundry');b.editProgramRoom(1,q.id,'width',2.4);b.editProgramRoom(1,q.id,'depth',2.2);
 for(const strategy of ['balanced','climate','compact']){const result=b.architectureProposal(strategy);assert.equal(result.ok,true,result.reason);const r=result.plan.rooms.find(r=>r.programRoomId===q.id);assert.equal(r.w,2.4);assert.equal(r.h,2.2);assert.equal(r.floor,1);assert.equal(result.plan.rooms.some(r=>r.name==='Không gian linh hoạt'),false);}
});
test('incomplete, conflicting or oversized exact request retains intent and the current measured plan/history',()=>{
 const b=client();b.autoPlanConcept();const q=b.addProgramRoom(1,'laundry');b.editProgramRoom(1,q.id,'width',2.4);assert.match(b.floorProgramError(b.requestedFloorProgram()),/cả chiều rộng/);
 b.editProgramRoom(1,q.id,'depth',2.2);b.editProgramRoom(1,q.id,'minArea',9);assert.match(b.floorProgramError(b.requestedFloorProgram()),/nhỏ hơn/);
 b.editProgramRoom(1,q.id,'minArea',4);b.editProgramRoom(1,q.id,'width',20);const before=JSON.stringify({plan:b.state.project.plan,history:b.planHistory});assert.equal(b.autoPlanConcept(),false);assert.equal(JSON.stringify({plan:b.state.project.plan,history:b.planHistory}),before);assert.equal(b.requestedFloorProgram()[1].extraRooms[0].width,20);
});
test('floor request transfers reject locked targets without moving intent or adding undo entries',()=>{
 const b=client(),q=b.addProgramRoom(1,'custom');b.state.project.plan.lockedFloors=[2];const before=JSON.stringify({program:b.designState().program,history:b.planHistory,plan:b.state.project.plan});assert.equal(b.moveProgramRoom(1,q.id,2),false);assert.equal(JSON.stringify({program:b.designState().program,history:b.planHistory,plan:b.state.project.plan}),before);
});
test('numeric floor height changes reject tall openings and locked floors atomically and undo with stable IDs',()=>{
 const b=client();b.autoPlanConcept();const p=b.state.project,ids=p.plan.rooms.map(r=>r.id),before=b.drawingRevision(),undo=b.planHistory.undo.length;
 assert.equal(b.editFloorHeight(0,3.8),true);assert.notEqual(b.drawingRevision(),before);assert.equal(b.floorLevel(0).height,3.8);assert.equal(b.planHistory.undo.length,undo+1);b.undoPlan();assert.equal(b.drawingRevision(),before);b.redoPlan();assert.equal(b.floorLevel(0).height,3.8);assert.deepEqual(Array.from(p.plan.rooms,r=>r.id),Array.from(ids));
 const saved=JSON.stringify(p.site.floorHeights),history=b.planHistory.undo.length;assert.equal(b.editFloorHeight(0,2.4),false);assert.equal(JSON.stringify(p.site.floorHeights),saved);assert.equal(b.planHistory.undo.length,history);assert.equal(b.editFloorHeight(1,NaN),false);assert.equal(b.planHistory.undo.length,history);
 p.plan.lockedFloors=[2];assert.equal(b.editFloorHeight(0,4),false);assert.equal(JSON.stringify(p.site.floorHeights),saved);assert.equal(b.planHistory.undo.length,history);
});
test('direct room floor transfer is atomic and retains opening/fixture IDs, offsets, manual finishes and numeric dimensions',()=>{
 const b=client(),p=directFixture(b);p.style='Japandi';p.plan.rooms=p.plan.rooms.filter(r=>r.id!=='upper');const door=b.directOpeningAt('door','a','south',{x:1.85,y:6}),altar=b.addDirectAltar('a','north');assert.ok(door&&altar);b.applyInteriorCollection('neo-elegance','a');b.applyVisualMaterial('floor','walnut-floor','a');const material=clonePlain(p.materials.finish),old=clonePlain(p.plan);b.state.ui.planner.selected='a';
 assert.equal(b.editDirectItem('room','a','floor','2'),true);assert.equal(p.plan.rooms.find(r=>r.id==='a').floor,2);assert.deepEqual(clonePlain(p.plan.rooms.find(r=>r.id==='a')),{...old.rooms.find(r=>r.id==='a'),floor:2});assert.deepEqual(clonePlain(p.plan.openings.find(o=>o.id===door.id)),{...old.openings.find(o=>o.id===door.id),floor:2});assert.deepEqual(clonePlain(p.plan.fixtures.find(q=>q.id===altar.id)),{...old.fixtures.find(q=>q.id===altar.id),floor:2});assert.deepEqual(clonePlain(p.materials.finish),material);
 p.style='Đông Dương · Indochine';assert.equal(b.interiorCollection('a').id,'neo-elegance');assert.equal(b.finishPalette('a').visualMaterials.floor,'walnut-floor');b.undoPlan();assert.deepEqual(clonePlain(p.plan),old);b.redoPlan();assert.equal(p.plan.fixtures[0].floor,2);b.save();b.state=b.loadState();b.normalizeState();assert.equal(b.state.project.plan.rooms.find(r=>r.id==='a').floor,2);assert.equal(b.interiorCollection('a').id,'neo-elegance');
});
test('direct floor transfer rejects collisions, source/target locks and independent vertical circulation changes',()=>{
 const b=client(),p=directFixture(b);unchanged(b,()=>b.moveDirectRoomFloor('a',1),/chồng/);p.plan.lockedFloors=[2];unchanged(b,()=>b.moveDirectRoomFloor('a',2),/khóa/);p.plan.lockedFloors=[];p.plan.lockedRoomIds=['a'];unchanged(b,()=>b.moveDirectRoomFloor('a',2),/khóa/);p.plan.lockedRoomIds=[];p.plan.rooms.push({id:'stair',floor:0,type:'stairs',name:'Thang',x:1,y:9,w:3,h:4});unchanged(b,()=>b.moveDirectRoomFloor('stair',2),/đồng bộ/);unchanged(b,()=>b.moveDirectRoomFloor('a',3),/Tầng đích/);
});
test('manual room collection survives a house style change and layout option remapping',()=>{
 const b=client();b.generateDesignKits();b.applyDesignKit('A');const r=b.state.project.plan.rooms.find(r=>r.type==='bed'&&r.floor===1);b.applyInteriorCollection('neo-elegance',r.id);assert.equal(b.state.project.materials.finish.interior.authored[r.id],'manual');b.state.project.style='Đông Dương · Indochine';assert.equal(b.interiorCollection(r.id).id,'neo-elegance');b.generateDesignKits();b.applyDesignKit('B');const next=b.state.project.plan.rooms.find(q=>q.type===r.type&&q.floor===r.floor&&q.name===r.name);assert.equal(b.interiorCollection(next.id).id,'neo-elegance');assert.equal(b.state.project.materials.finish.interior.authored[next.id],'manual');
});

test('requested room dimensions disclosure stays open across width edits and saving the project',()=>{
 const b=client(),q=b.addProgramRoom(1,'laundry'),key='room-request:'+q.id;b.state.ui.guidedPanels[key]=true;b.editProgramRoom(1,q.id,'width',2.4);let html=b.extraRoomProgramHtml(1);assert.ok(html.includes('data-guided-panel="'+key+'" open'));assert.ok(html.includes('data-program-room-field="depth"'));assert.ok(html.includes('data-program-room-field="floor"'));b.save();b.state=b.loadState();b.normalizeState();assert.equal(b.state.ui.guidedPanels[key],true);assert.ok(b.extraRoomProgramHtml(1).includes('data-guided-panel="'+key+'" open'));
});
