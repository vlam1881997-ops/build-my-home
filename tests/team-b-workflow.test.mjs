import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {designClient} from './fixtures/design-client.mjs';

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
 const r=B.addDirectRoom({x:.317,y:2.113},{x:3.454,y:5.956},'living',{snap:false});
 assert.ok(r,B.state.ui.planner.directNotice);assert.equal(r.x,.317);assert.ok(Math.abs(r.w-3.137)<1e-9);
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
