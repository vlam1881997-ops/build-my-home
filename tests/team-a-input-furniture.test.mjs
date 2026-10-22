import test from 'node:test';
import assert from 'node:assert/strict';
import {designClient} from './fixtures/design-client.mjs';
const item=r=>({id:'furniture:'+r.id+':bedDouble:0',roomId:r.id,floor:r.floor,modelId:'bedDouble',origin:'customer-added',placementStatus:'present',locked:false,pose:{x:r.x+r.w/2,y:r.y+r.h/2,z:0,rotationDeg:37},size:{width:1.6,depth:2,height:.6},materialBindings:[{role:'accent',sku:'TEST-ONLY-SKU',costTreatment:'owned'}],costTreatment:'owned'});
test('C01 merge, normalization, history and storage preserve authored rows and tombstones',()=>{
 const B=designClient(),base=B.defaultState(),row=item(base.project.plan.rooms[0]);
 base.project.plan.furniture=[row,{...structuredClone(row),id:'removed-1',placementStatus:'removed'}];
 B.state=B.mergeState(B.defaultState(),base);B.normalizeState();
 assert.equal(B.state.project.plan.furniture.length,2);assert.equal(B.state.project.plan.furniture[0].pose.rotationDeg,37);
 assert.equal(B.state.project.plan.furniture[0].materialBindings[0].sku,'TEST-ONLY-SKU');
 const original=B.planSnapshot();B.pushPlanHistory();B.state.project.plan.furniture[0].pose.rotationDeg=63;
 B.undoPlan();assert.equal(B.state.project.plan.furniture[0].pose.rotationDeg,37);
 B.redoPlan();assert.equal(B.state.project.plan.furniture[0].pose.rotationDeg,63);
 B.save();assert.deepEqual(JSON.parse(JSON.stringify(B.loadState().project.plan.furniture)),JSON.parse(JSON.stringify(B.state.project.plan.furniture)));
 assert.equal(original.furniture[1].placementStatus,'removed');assert.equal(B.planFurnitureIssues().length,0);
});
test('C01 legacy plans gain an empty authored array without fabricating purchases',()=>{
 const B=designClient(),legacy=B.defaultState();delete legacy.project.plan.furniture;
 legacy.project.materials.choices.floor='CUSTOM-LEGACY';legacy.project.plan.rooms[0].name='Phòng khách riêng';
 B.state=B.mergeState(B.defaultState(),legacy);B.normalizeState();
 assert.equal(B.state.project.plan.furniture.length,0);assert.equal(B.state.project.materials.choices.floor,'CUSTOM-LEGACY');
 assert.equal(B.state.project.plan.rooms[0].name,'Phòng khách riêng');assert.ok(B.projectInputRegister().every(r=>r.confirmed===false));
});
test('invalid furniture stays recoverable and reports duplicate ID, geometry and room errors',()=>{
 const B=designClient();B.state=B.defaultState();const row=item(B.state.project.plan.rooms[0]);
 B.state.project.plan.furniture=[row,{...structuredClone(row),floor:8,pose:{...row.pose,x:null}}];B.normalizeState();
 assert.equal(B.state.project.plan.furniture.length,2);const codes=B.planFurnitureIssues().map(x=>x.code);
 for(const code of ['furniture-id','furniture-room','furniture-dimensions'])assert.ok(codes.includes(code));
});
test('entered zero differs from unknown and changed values stale confirmation without certifying sources',()=>{
 const B=designClient();B.set('project.finance.existingDebt',0,{render:false});
 let entry=B.projectInputRegister().find(r=>r.field==='finance.existingDebt');
 assert.equal(entry.value,0);assert.equal(entry.status,'provided');assert.equal(entry.confirmed,false);
 B.recordProjectInput('finance.existingDebt',{confirmed:true,status:'reviewed'});
 entry=B.projectInputRegister().find(r=>r.field==='finance.existingDebt');assert.equal(entry.status,'provided');assert.equal(entry.confirmed,true);
 B.state.project.finance.existingDebt=100;entry=B.projectInputRegister().find(r=>r.field==='finance.existingDebt');assert.equal(entry.status,'stale');assert.equal(entry.confirmed,false);
 assert.equal(B.recordProjectInput('secret',{confirmed:true}),false);
});
test('U2 north assessment rejects blank and non-text source references without changing the project',()=>{
 const B=designClient();
 for(const sourceReference of ['   ','\n\t',{},true,42]){
  B.state.project.site.north={azimuthDeg:37,datum:'true-north',sourceReference,observedAt:'2026-01-01',status:'provided'};
  const before=JSON.stringify(B.state.project);
  assert.equal(B.siteInputAssessment().north.usable,false,JSON.stringify(sourceReference));
  assert.ok(B.fengshuiPlacementAdvice().missing.includes('Hướng Bắc thật và nguồn đo'));
  assert.equal(JSON.stringify(B.state.project),before);
 }
 B.state.project.site.north.sourceReference='TEST-ONLY survey reference';
 assert.equal(B.siteInputAssessment().north.usable,true);
 assert.equal(B.siteInputAssessment().legalBoundaryVerified,false);
});
test('U2 shared Modern inputs and unknown approvals survive local save/load normalization',async()=>{
 const {modernReference}=await import('./team-b-modern-reference.mjs');
 const {B}=modernReference();
 // Apply the existing import defaults before comparing canonical saved states.
 B.state=B.mergeState(B.defaultState(),B.state);B.normalizeState();
 const before=structuredClone(B.state.project),revision=B.drawingRevision();
 B.save();B.state=B.loadState();B.normalizeState();
 for(const field of ['site','household','finance','briefIdea','style','plan','designStudio','inputEvidence']){
  assert.deepEqual(JSON.parse(JSON.stringify(B.state.project[field])),JSON.parse(JSON.stringify(before[field])),field);
 }
 assert.equal(B.drawingRevision(),revision);
 assert.ok(B.projectInputRegister().every(row=>!row.confirmed));
 assert.equal(B.siteInputAssessment().legalBoundaryVerified,false);
 assert.equal(B.siteInputAssessment().north.usable,false);
 const saved=JSON.stringify(B.state.project);
 B.siteInputAssessment();B.fengshuiPlacementAdvice();
 assert.equal(JSON.stringify(B.state.project),saved);
});
test('U2 an applied invalid polygon cannot be reported as a rectangular customer boundary',()=>{
 const B=designClient({nativeParcel:true}),s=B.state.project.site;
 Object.assign(s,{lotMode:'custom',useParcelGeometry:true,lotSource:'survey-local',boundaryEvidenceId:'missing-survey'});
 const before=JSON.stringify(B.state.project),review=B.siteInputAssessment();
 assert.equal(review.boundary.area,null);
 assert.equal(review.boundary.status,'invalid');
 assert.ok(review.boundary.errors.length>0);
 assert.equal(B.roomInsideParcel({x:2,y:3,w:2,h:2}),false);
 assert.equal(JSON.stringify(B.state.project),before);
});
test('U2 malformed measured parcel front edge is rejected without throwing or repairing coordinates',()=>{
 const B=designClient({nativeParcel:true}),s=B.state.project.site;
 Object.assign(s,{lotMode:'custom',useParcelGeometry:true,lotSource:'survey-local',boundaryEvidenceId:'test-boundary',frontEdge:.5});
 B.state.project.designEvidence={site:[{id:'test-boundary',unit:'m',sourceType:'survey',value:{sourceCrs:'LOCAL_METRES',surveyReference:'TEST-ONLY',localVertices:[{x:0,y:0},{x:5,y:0},{x:5,y:20},{x:0,y:20}]}}]};
 const before=JSON.stringify(B.state.project);
 assert.equal(B.parcelBoundaryReview().valid,false);
 assert.equal(B.parcelGeometry(),null);
 assert.equal(JSON.stringify(B.state.project),before);
 s.frontEdge=0;
 assert.equal(B.parcelBoundaryReview().valid,true);
 assert.equal(B.parcelGeometry().area,100);
});
test('U2 Modern floor requirements and rejected proposals do not overwrite the customer plan',async()=>{
 const {modernReference}=await import('./team-b-modern-reference.mjs');
 const {B}=modernReference(),p=B.state.project;
 for(const [floor,expected] of [[0,{bed:0,bath:1,living:1,kitchen:1}],[1,{bed:2,bath:1}]]){
  for(const [type,count] of Object.entries(expected))assert.equal(p.plan.rooms.filter(r=>r.floor===floor&&r.type===type).length,count);
 }
 const before=JSON.stringify(p.plan),requirements=JSON.stringify(p.designStudio.program);
 const proposal=B.architectureProposal('balanced');assert.equal(proposal.ok,true,proposal.reason);
 assert.equal(JSON.stringify(p.plan),before);assert.equal(JSON.stringify(p.designStudio.program),requirements);
 for(const floors of [0,1.5,11]){
  p.site.floors=floors;const input=JSON.stringify(p);
  const rejected=B.architectureProposal('balanced');assert.equal(rejected.ok,false);assert.ok(rejected.reason);
  assert.equal(JSON.stringify(p),input);
 }
});
