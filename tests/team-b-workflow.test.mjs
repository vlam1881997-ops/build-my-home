import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {designClient} from './fixtures/design-client.mjs';
import {modernReference} from './team-b-modern-reference.mjs';

function lightExportClient({decode='load',encode='ready',context2d=true}={}){
 const B=designClient(),p=B.state.project;p.plan={rooms:[{id:'own-room',floor:0,type:'custom',name:'Phòng tự vẽ',x:0,y:0,w:6,h:6}],openings:[],furniture:[],fixtures:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};B.state.ui.sceneFocus='room:own-room';
 const saved={downloads:[],urls:[],revoked:[],buttons:[{disabled:false},{disabled:true}],status:[],caption:[],image:null,timer:null,draws:0,clears:0},host={};let active=true;
 const stage={querySelector:()=>active?host:null};B.$=s=>s==='#studio3dStage'?stage:null;B.archRenderStatus=s=>saved.status.push(s);B.download=(...args)=>saved.downloads.push(args);
 const canvas={width:0,height:0,getContext:()=>context2d?{fillRect(){},drawImage(){saved.draws++;},fillText(s){saved.caption.push(s);}}:null,toBlob(done,type){assert.equal(type,'image/png');saved.encode=()=>done(encode==='empty'?null:new Blob(['PNG TEST DOUBLE'],{type}));if(encode!=='defer')saved.encode();}};
 const image={set src(value){if(!value)return;saved.image=this;if(decode==='load')queueMicrotask(()=>this.onload?.());else if(decode==='error')queueMicrotask(()=>this.onerror?.());}};
 const ctx={BMH:B,Blob,URL:{createObjectURL(blob){saved.urls.push(blob);return 'blob:local-test';},revokeObjectURL(url){saved.revoked.push(url);}},document:{createElement:tag=>tag==='canvas'?canvas:image,querySelectorAll:()=>saved.buttons},performance:{now:()=>123},setTimeout(fn){saved.timer=fn;return 1;},clearTimeout(){saved.clears++;},console:{warn(){}}};
 const source=fs.readFileSync('src/78_design_workflow.js','utf8');vm.runInNewContext(source.slice(source.indexOf('BMH.lightPreviewFrame='),source.indexOf('const workflowMount=')),ctx);
 return {B,saved,canvas,ctx,hide:()=>active=false};
}

test('fallback PNG is bounded, revision-labelled and design-only; concurrent clicks do not duplicate downloads',async()=>{
 const {B,saved,canvas}=lightExportClient({decode:'defer'}),before=JSON.stringify(B.state.project),revision=B.drawingRevision();B.state.ui.sharpResolution=2560;
 const pending=B.captureLightPreview();assert.equal(B.lightExportBusy,true);assert.ok(saved.buttons.every(b=>b.disabled));assert.equal(await B.captureLightPreview(),false);saved.image.onload();assert.equal(await pending,true);
 assert.equal(saved.downloads.length,1);assert.match(saved.downloads[0][0],/^BMH-khoi-theo-so-do-room-own-room-/);assert.ok(saved.downloads[0][0].includes(revision));assert.equal(saved.downloads[0][2],'image/png');
 assert.ok(B.lastLightExport.width<=2560&&B.lastLightExport.height<=2560);assert.ok(B.lastLightExport.width*B.lastLightExport.height<=5000000);assert.equal(B.lastLightExport.mode,'lightweight');assert.equal(B.lastLightExport.designRevision,revision);assert.ok(saved.caption[0].includes('Khối theo số đo'));
 const svg=await saved.urls[0].text();assert.match(svg,/xmlns="http:\/\/www.w3.org\/2000\/svg"/);assert.ok(svg.includes('data-design-revision="'+revision+'"'));assert.equal(JSON.stringify(B.state.project),before);
 assert.deepEqual(saved.revoked,['blob:local-test']);assert.equal(canvas.width,1);assert.equal(canvas.height,1);assert.equal(B.lightExportBusy,false);assert.deepEqual(saved.buttons.map(b=>b.disabled),[false,true]);assert.equal(B.archRenderModules,undefined);
});

test('fallback export cancels on project, revision, room, angle, zoom, retired host or upgraded renderer',async()=>{
 for(const change of [c=>c.B.state.project=structuredClone(c.B.state.project),c=>c.B.state.project.plan.rooms[0].w=6.1,c=>c.B.state.ui.sceneFocus='all',c=>c.B.lightPreviewAngle+=20,c=>c.B.lightPreviewZoom*=1.25,c=>c.hide(),c=>c.B.studio3d={renderer:{}}]){
  const c=lightExportClient({decode:'defer'}),pending=c.B.captureLightPreview();change(c);c.saved.image.onload();assert.equal(await pending,false);assert.equal(c.saved.downloads.length,0);assert.equal(c.saved.revoked.length,1);assert.equal(c.B.lightExportBusy,false);
 }
});

test('fallback encoding rejects later edits and every decode/canvas/timeout failure restores controls and releases resources',async()=>{
 const c=lightExportClient({encode:'defer'}),pending=c.B.captureLightPreview();await Promise.resolve();await Promise.resolve();assert.equal(typeof c.saved.encode,'function');c.B.state.project.plan.rooms[0].h=6.2;c.saved.encode();assert.equal(await pending,false);assert.equal(c.saved.downloads.length,0);assert.equal(c.saved.revoked.length,1);
 for(const options of [{decode:'error'},{encode:'empty'},{context2d:false},{decode:'defer'}]){
  const f=lightExportClient(options),work=f.B.captureLightPreview();if(options.decode==='defer')f.saved.timer();assert.equal(await work,false);assert.equal(f.saved.downloads.length,0);assert.equal(f.B.lightExportBusy,false);assert.deepEqual(f.saved.buttons.map(b=>b.disabled),[false,true]);assert.equal(f.saved.revoked.length,f.saved.urls.length);
 }
 const empty=lightExportClient();empty.B.state.project.plan.rooms=[];assert.equal(await empty.B.captureLightPreview(),false);assert.equal(empty.saved.urls.length,0);
});

test('existing quick and sharp buttons route only unavailable WebGL to the labelled fallback',async()=>{
 const {B,ctx,saved}=lightExportClient(),source=fs.readFileSync('src/46_architectural_render.js','utf8');
 vm.runInNewContext(source.slice(source.indexOf('BMH.captureStudioPreview='),source.indexOf('BMH.sharpStudioFrame='))+source.slice(source.indexOf('BMH.captureSharpStudioPreview='),source.indexOf('BMH.captureArchitecturalRender=')),ctx);
 let fallbacks=0;B.captureLightPreview=async()=>{fallbacks++;return true;};assert.equal(await B.captureStudioPreview(),true);assert.equal(await B.captureSharpStudioPreview(),true);assert.equal(fallbacks,2);
 let rendered=0;B.studio3d={scene:{},camera:{},renderer:{render(){rendered++;},domElement:{width:800,height:600,toBlob:done=>done(new Blob(['TEST'],{type:'image/png'}))}}};
 assert.equal(await B.captureStudioPreview(),true);assert.equal(fallbacks,2);assert.equal(rendered,1);assert.match(saved.downloads[0][0],/-xem-nhanh.png$/);
 B.sharpStudioFrame=async()=>({blob:new Blob(['TEST'],{type:'image/png'}),width:1280,height:720,designRevision:B.drawingRevision(),view:'all',cameraKey:'native'});assert.equal(await B.captureSharpStudioPreview(),true);assert.equal(fallbacks,2);assert.match(saved.downloads[1][0],/^BMH-anh-net-nhanh-/);
});

test('light model uses the saved 37-degree footprint and mounting height rather than the collision box',()=>{
 const B=designClient(),p=B.state.project;
 p.plan={rooms:[{id:'custom',floor:0,type:'custom',name:'Tự bố trí',x:0,y:0,w:6,h:6}],openings:[],fixtures:[],outdoor:[],furniture:[{id:'angled',roomId:'custom',floor:0,modelId:'kitchenWallCabinet',origin:'customer-added',placementStatus:'present',pose:{x:2,y:3,z:1.6,rotationDeg:37},size:{width:.9,depth:.34,height:.72},materialBindings:[{role:'accent',visualProfileId:'dark-walnut'}]}],lockedRoomIds:[],lockedFloors:[]};
 B.state.ui.sceneFocus='room:custom';B.lightPreviewAngle=35;B.studioFloorLevel=()=>({base:4.1,slab:.23,clearHeight:3});
 const before=JSON.stringify(p),svg=B.lightPreviewSvg(),angle=37*Math.PI/180,view=35*Math.PI/180;
 const projected=(x,y,z)=>{x-=p.site.width/2;y-=p.site.depth/2;return (x*Math.cos(view)-y*Math.sin(view)).toFixed(4)+','+((x*Math.sin(view)+y*Math.cos(view))*.52-z*.85).toFixed(4);};
 const top=[[-.45,-.17],[.45,-.17],[.45,.17],[-.45,.17]].map(([x,y])=>projected(2+x*Math.cos(angle)-y*Math.sin(angle),3+x*Math.sin(angle)+y*Math.cos(angle),4.1+.23+1.6+.72)).join(' ');
 const faces=[...svg.matchAll(/<polygon[^>]*data-light-furniture-id="angled"[^>]*points="([^"]+)"[^>]*fill="([^"]+)"/g)];
 assert.equal(faces.length,5);assert.ok(faces.some(m=>m[1]===top),'top follows measured rotated corners and level/slab/mounting height');
 assert.ok(faces.every(m=>m[2]===B.VISUAL_MATERIALS.find(p=>p.id==='dark-walnut').color));assert.equal(JSON.stringify(p),before);
 p.plan.furniture[0].placementStatus='removed';assert.doesNotMatch(B.lightPreviewSvg(),/data-light-furniture-id="angled"/);
});

test('light model retains measured terrace slab, open edges and drawing identity without inventing furniture',()=>{
 const {B}=modernReference(),r=B.state.project.plan.rooms.find(r=>r.outdoorSpace?.kind==='terrace');B.state.ui.sceneFocus='room:'+r.id;
 const before=JSON.stringify(B.state.project),svg=B.lightPreviewSvg();
 assert.equal((svg.match(/data-light-kind="floor-slab"/g)||[]).length,5);
 assert.doesNotMatch(svg,/data-light-furniture-id=/);assert.ok(svg.includes('data-design-revision="'+B.drawingRevision()+'"'));
 const g=B.scenePlanGeometry({rooms:[r],openings:B.state.project.plan.openings,wallContext:B.state.project.plan.rooms},r.floor);
 assert.ok(g.walls.length);assert.ok(g.walls.every(w=>!B.outdoorOpenEdge(r,w.horizontal,w.axis,w.a,w.b)));
 assert.equal(JSON.stringify(B.state.project),before);
});

test('terrace review exposes exact dimensions, real access and missing technical inputs without writing the design',()=>{
 const {B}=modernReference(),r=B.state.project.plan.rooms.find(r=>r.outdoorSpace?.kind==='terrace');B.state.ui.planner.selected=r.id;
 const before=JSON.stringify(B.state.project),history=B.planHistory.undo.length,html=B.roomDepthEditorHtml();
 for(const value of ['3.580 mm','1.890 mm','900 mm × 2.100 mm','ngưỡng 0 mm','Bắc, Tây','Không có mái che','Chưa có tài liệu','lan can','thoát nước','chống thấm'])assert.ok(html.includes(value),value);
 assert.ok(html.includes(r.outdoorSpace.sourceReference));assert.equal(JSON.stringify(B.state.project),before);assert.equal(B.planHistory.undo.length,history);
 B.state.project.plan.openings=B.state.project.plan.openings.filter(o=>!o.id.endsWith('-access'));assert.match(B.roomDepthEditorHtml(),/Chưa có cửa tiếp cận/);
 r.outdoorSpace.sourceReference='<img src=x onerror=alert(1)>';assert.ok(B.roomDepthEditorHtml().includes('&lt;img'));assert.doesNotMatch(B.roomDepthEditorHtml(),/<img src=x/);
});

function personalPlanClient(){
 const B=designClient({nativeParcel:true}),p=B.state.project;
 // This fixture uses the real parcel/proposal/editor; omit only climate scoring.
 B.planMetrics=plan=>({area:plan.rooms.reduce((n,r)=>n+r.w*r.h,0)});
 Object.assign(p.site,{width:5,depth:20,floors:2,setbackFront:2,setbackRear:1,setbackSide:.2,targetCoverage:.85,useParcelGeometry:false});
 p.household.relatives=[];p.briefIdea='';p.style='Hiện đại';
 p.designStudio={program:{mode:'custom',floors:[{bedrooms:0,bathrooms:0,living:true,kitchen:true,garage:true},{bedrooms:2,bathrooms:1}]}};
 return B;
}
test('spatial suggestions validate their own openings after a customer changes the existing plan',()=>{
 const B=personalPlanClient(),p=B.state.project;
 assert.equal(B.generateDesignKits(),true);assert.equal(B.applyDesignKit('B'),true);
 const room=p.plan.rooms.find(r=>r.type==='living'),old=room.id;room.id='customer-living';
 for(const o of p.plan.openings)if(o.roomId===old)o.roomId=room.id;
 const before=JSON.stringify(p.plan),history=B.planHistory.undo.length;
 assert.equal(B.architectureProposal().ok,true);
 assert.equal(B.generateDesignKits(),true);
 assert.equal(JSON.stringify(p.plan),before);assert.equal(B.planHistory.undo.length,history);
 for(const k of B.designState().kits)assert.equal(B.withPlan(k.plan,()=>B.layoutValid(k.plan.rooms)),true);
});
test('an unsupported auto layout retains exact requests and offers personal drawing with its specific reason',()=>{
 const B=personalPlanClient(),p=B.state.project;p.site.depth=12;
 const before=JSON.stringify(p.plan),program=JSON.stringify(B.requestedFloorProgram());
 assert.equal(B.createProgramDesign(false),false);
 assert.equal(JSON.stringify(p.plan),before);assert.equal(JSON.stringify(B.requestedFloorProgram()),program);
 assert.match(B.designState().programNotice,/chiều sâu/);
 assert.equal(B.openPersonalPlanner(),true);assert.equal(B.state.ui.step,4);
 assert.equal(JSON.stringify(p.plan),before);
});
test('deleting the last room opens drawing tools; empty land survives reload and precise rooms share undo/redo',()=>{
 const B=personalPlanClient(),p=B.state.project;
 p.plan.rooms=[{id:'only',floor:0,type:'living',name:'Khách',x:.3,y:2.1,w:3,h:4}];
 assert.equal(B.removePlanItem('room','only'),true);assert.equal(p.plan.rooms.length,0);
 assert.equal(B.state.ui.planner.directTool,'room');
 B.state=B.mergeState(B.defaultState(),JSON.parse(JSON.stringify(B.state)));B.normalizeState();
 assert.equal(B.state.project.plan.rooms.length,0);const history=B.planHistory.undo.length;
 assert.equal(B.openPersonalPlanner(),true);assert.equal(B.state.ui.designProposalsOpen,false);
 assert.equal(B.planHistory.undo.length,history);assert.equal(B.state.project.plan.rooms.length,0);
 assert.match(B.directEditHtml(),/data-direct-room-form/);
 const r=B.addDirectRoom({x:.317,y:2.113},{x:3.454,y:5.956},'living',{snap:false,dimensions:{width:3.137,depth:3.843}});
 assert.ok(r,B.state.ui.planner.directNotice);assert.equal(r.x,.317);assert.equal(r.w,3.137);assert.equal(r.h,3.843);
 const exact=JSON.stringify(B.state.project.plan);B.undoPlan();assert.equal(B.state.project.plan.rooms.length,0);
 B.redoPlan();assert.equal(JSON.stringify(B.state.project.plan),exact);
 B.state=B.mergeState(B.defaultState(),JSON.parse(JSON.stringify(B.state)));B.normalizeState();
 assert.equal(B.state.project.plan.rooms[0].id,r.id);assert.equal(B.state.project.plan.rooms[0].x,.317);
 const saved=JSON.stringify(B.state.project.plan);assert.equal(B.addDirectRoom({x:.3,y:2.2},{x:2,y:4},'bed',{snap:false}),false);
 assert.equal(JSON.stringify(B.state.project.plan),saved);
 assert.equal(B.addDirectRoom({x:0,y:0},{x:2,y:2},'bed',{snap:false}),false);
});
test('personal drawing preserves existing rooms, selected floor, choices and locks',()=>{
 const B=personalPlanClient(),p=B.state.project;
 p.plan.rooms=[{id:'kept',floor:1,type:'bed',name:'Giữ nguyên',x:.3,y:2.1,w:3,h:4}];
 p.plan.lockedFloors=[1];B.state.ui.planner.floor=1;
 const before=JSON.stringify(p),history=B.planHistory.undo.length;
 assert.equal(B.openPersonalPlanner(),true);assert.equal(B.state.ui.planner.floor,1);
 assert.equal(JSON.stringify(p.plan.rooms),JSON.stringify(JSON.parse(before).plan.rooms));
 assert.equal(JSON.stringify(p.materials),JSON.stringify(JSON.parse(before).materials));
 assert.equal(JSON.stringify(p.designStudio.program),JSON.stringify(JSON.parse(before).designStudio.program));
 assert.equal(B.planHistory.undo.length,history);
 assert.equal(B.addDirectRoom({x:.3,y:7},{x:3,y:10},'living',{snap:false}),false);
 assert.match(B.state.ui.planner.directNotice,/khóa/);
});
const source=fs.readFileSync('src/104_style_reference.js','utf8');
function client(){const B=designClient();B.STEPS=Array.from({length:10},(_,i)=>[i,'step-'+i]);B.V6_STEPS=Array.from({length:10},(_,i)=>['step-'+i,'description']);B.GUIDED_FUNCTIONS=['Ý tưởng','Khu đất','Gia đình','Bản vẽ','Vật liệu','3D','Dự toán','Ngân hàng','Thi công','Bàn giao'];B.restoreProjectRuntime=()=>{};B.screen10=()=>'';B.screen9=()=>'';const ctx={BMH:B,URLSearchParams,location:{search:''},structuredClone,Date,document:{addEventListener(){}},console};vm.runInNewContext(fs.readFileSync('src/91_customer_cloud.js','utf8').split('/* Optional customer account.')[0],ctx);vm.runInNewContext(source.slice(source.indexOf('/* Team B / C03')),ctx);return B;}
test('ten functions retain materials/banking and design handover precedes supervision',()=>{const B=client();assert.equal(B.workflowRoutes.handover,9);assert.equal(B.workflowRoutes.construction,10);assert.equal(B.GUIDED_FUNCTIONS[4],'Vật liệu');assert.equal(B.GUIDED_FUNCTIONS[7],'Ngân hàng');assert.equal(B.GUIDED_FUNCTIONS[8],'Bàn giao');assert.equal(B.GUIDED_FUNCTIONS[9],'Thi công');assert.match(B.SCREENS[8](),/BÀN GIAO THIẾT KẾ/);assert.match(B.SCREENS[9](),/THI CÔNG & GIÁM SÁT/);});
test('legacy route migration is once-only and survives the known dynamic state merge',()=>{const B=client(),s=B.defaultState();s.ui.step=10;B.migrateWorkflowRoute(s);assert.equal(s.ui.step,9);B.migrateWorkflowRoute(s);assert.equal(s.ui.step,9);const merged=B.mergeState(B.defaultState(),s);B.migrateWorkflowRoute(merged);assert.equal(merged.ui.step,9);const old=B.defaultState();old.ui.step=9;B.migrateWorkflowRoute(old);assert.equal(old.ui.step,10);});
test('evidence report links measured location and revision, preserves bytes metadata and remains uncertified through reload',()=>{const B=client();B.state.project.plan.rooms=[{id:'room',floor:1,name:'Phòng ngủ',type:'bed',x:0,y:0,w:4,h:4}];B.state.project.dossier.evidence=[{id:'file-1',name:'ảnh.jpg',stage:'structure',type:'image/jpeg',size:1234,cloudKey:'keep-key'}];const input={floor:1,roomId:'room',reportType:'defect',reportStatus:'open',responsible:'Người kiểm tra',note:'Nứt cần kiểm tra',observedAt:'2026-10-09'};assert.equal(B.annotateProjectEvidence('file-1',input),true);const row=B.state.project.dossier.evidence[0];assert.equal(row.cloudKey,'keep-key');assert.equal(row.size,1234);assert.equal(row.report.engineeringAccepted,false);assert.equal(row.report.designRevision,B.drawingRevision());B.state=B.mergeState(B.defaultState(),JSON.parse(JSON.stringify(B.state)));B.normalizeState();assert.equal(B.supervisionReports().rows[0].report.roomId,'room');assert.equal(B.supervisionReports().certified,false);assert.match(B.supervisionWorkspaceHtml(),/biên bản nghiệm thu kỹ thuật/);});
test('invalid location/status cannot change report and user resolution never certifies',()=>{const B=client();B.state.project.dossier.evidence=[{id:'f',name:'a.pdf'}];const input={floor:'',roomId:'',reportType:'inspection-note',reportStatus:'reported-resolved'};assert.equal(B.annotateProjectEvidence('f',{...input,reportStatus:'approved'}),false);assert.equal(B.annotateProjectEvidence('f',{...input,roomId:'foreign-room',floor:0}),false);assert.equal(B.annotateProjectEvidence('f',input),true);assert.equal(B.state.project.dossier.evidence[0].report.engineeringAccepted,false);assert.equal(B.state.project.dossier.evidence[0].report.source,'user-report');});

test('normalization retains report and private metadata only, rejects impossible dates and cannot import approval',()=>{const B=client(),sha='a'.repeat(64);B.state.project.dossier.evidence=[{id:'file',name:'x.pdf',type:'application/pdf',cloudKey:'12345678-1234-1234-1234-123456789012/12345678-1234-1234-1234-123456789013/file-'+sha+'.pdf',cloudSha256:sha,cloudProjectId:'12345678-1234-1234-1234-123456789013',uploadedAt:'2026-10-09T07:00:00Z',privateToken:'should-drop',report:{reportType:'defect',reportStatus:'open',observedAt:'2026-02-31',engineeringAccepted:true,note:'Keep'}}];B.normalizeState();const row=B.state.project.dossier.evidence[0];assert.equal(row.report.note,'Keep');assert.equal(row.report.engineeringAccepted,false);assert.equal(row.report.observedAt,'');assert.equal(row.cloudSha256,sha);assert.equal(row.privateToken,undefined);assert.equal(row.uploadedAt,'2026-10-09T07:00:00Z');});
