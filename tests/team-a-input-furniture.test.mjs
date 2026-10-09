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
