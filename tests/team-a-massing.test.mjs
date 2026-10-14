import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {fixtures,fixture,target} from './team-a-massing-fixture.mjs';
const plain=x=>JSON.parse(JSON.stringify(x));
const request=B=>({roomId:target(B).id,depth:3.8,anchor:'rear'});
for(const f of fixtures.cases)test(f.id+': real parcel/envelope, explicit depth preview, apply, history and reload',()=>{
 const B=fixture(f),p=B.state.project,before=plain(p.plan),rev=B.drawingRevision(),r=target(B),area=B.measuredQuantities().grossArea;
 assert.equal(B.siteInputAssessment().boundary.area,f.expectedArea);assert.ok(before.rooms.every(q=>B.roomInsideParcel(B.roomWithWallClearance(q))));
 if(f.id==='townhouse'){assert.ok(Math.abs(r.w-3.98)<1e-9);assert.ok(Math.abs(r.h-12.38)<1e-9);}
 const preview=B.previewRoomDepthChange(request(B));assert.equal(preview.ok,true,preview.reason);assert.deepEqual(plain(p.plan),before);assert.equal(B.planHistory.undo.length,0);
 assert.equal(preview.cost.amount,null);assert.equal(preview.released.use,'unassigned');assert.equal(preview.released.reviewStatus,'awaiting-review');
 assert.ok(Math.abs(preview.room.before.area-preview.room.after.area-preview.released.area)<1e-9);
 assert.equal(B.applyRoomDepthChange(preview),true);assert.deepEqual(plain(p.plan),plain(preview.plan));assert.notEqual(B.drawingRevision(),rev);
 assert.ok(Math.abs(area-B.measuredQuantities().grossArea-preview.released.area)<1e-7);
 assert.deepEqual(plain(p.plan.rooms.filter(q=>q.id!==r.id)),before.rooms.filter(q=>q.id!==r.id));assert.deepEqual(plain(p.plan.openings),before.openings);
 assert.equal(B.applyRoomDepthChange(preview),false);assert.equal(B.planHistory.undo.length,1);
 const after=plain(p.plan),afterRevision=B.drawingRevision();B.undoPlan();assert.deepEqual(plain(p.plan),before);B.redoPlan();assert.deepEqual(plain(p.plan),after);
 B.save();B.state=B.loadState();assert.deepEqual(plain(B.state.project.plan),after);assert.equal(B.drawingRevision(),afterRevision);
 if(process.env.BMH_MASSING_REPORT){const dir=process.env.BMH_MASSING_REPORT;fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(dir+'/'+f.id+'.json',JSON.stringify({testOnly:true,fixture:f.id,runtime:process.version,units:'m',sourceRevision:rev,revision:afterRevision,room:preview.room,released:preview.released,cost:preview.cost,before,after},null,2)+'\n');}
});
test('invalid dimensions, room/floor/shared-wall locks, stale and tampered previews are atomic',()=>{
 const B=fixture(),p=B.state.project,r=target(B),before=plain(p.plan);
 for(const depth of [null,'3.8',NaN,Infinity,0,2.94,r.h,r.h+1])assert.equal(B.previewRoomDepthChange({...request(B),depth}).ok,false);
 for(const key of ['lockedRoomIds','lockedFloors']){p.plan[key]=[key==='lockedRoomIds'?r.id:r.floor];const state=plain(p.plan);assert.equal(B.previewRoomDepthChange(request(B)).ok,false);assert.deepEqual(plain(p.plan),state);p.plan[key]=[];}
 p.plan.lockedRoomIds=[p.plan.rooms.find(q=>q.floor===r.floor&&q.type==='corridor').id];assert.equal(B.previewRoomDepthChange(request(B)).ok,false);p.plan.lockedRoomIds=[];
 const preview=B.previewRoomDepthChange(request(B));preview.plan.rooms.find(q=>q.id===r.id).w+=.1;assert.equal(B.applyRoomDepthChange(preview),false);
 const stale=B.previewRoomDepthChange(request(B));p.site.floorHeights[0]+=.1;assert.equal(B.applyRoomDepthChange(stale),false);assert.deepEqual(plain(p.plan),before);assert.equal(B.planHistory.undo.length,0);
});
test('authored furniture identity, 37-degree angle, SKU and tombstone survive one translation',()=>{
 const B=fixture(),p=B.state.project,r=target(B);
 const chair={id:'authored-37',roomId:r.id,floor:r.floor,modelId:'chair',origin:'customer-added',placementStatus:'present',locked:false,pose:{x:r.x+1,y:r.y+1,z:0,rotationDeg:37},size:{width:.4,depth:.4,height:.94},materialBindings:[{sku:'TEST-ONLY'}],costTreatment:'purchase'};
 p.plan.furniture=[chair,{...plain(chair),id:'removed',placementStatus:'removed'}];const preview=B.previewRoomDepthChange(request(B));assert.equal(preview.ok,true,preview.reason);assert.equal(B.applyRoomDepthChange(preview),true);assert.deepEqual(plain(p.plan),plain(preview.plan));
 for(const item of p.plan.furniture){assert.equal(item.pose.rotationDeg,37);assert.equal(item.pose.x,chair.pose.x);assert.ok(Math.abs(item.pose.y-(chair.pose.y+r.h-3.8))<1e-9);assert.equal(item.materialBindings[0].sku,'TEST-ONLY');}assert.equal(p.plan.furniture[1].placementStatus,'removed');
 B.undoPlan();p.plan.furniture[0].locked=true;assert.equal(B.previewRoomDepthChange(request(B)).ok,false);p.plan.furniture[0].locked=false;p.plan.furniture[0].pose.y=r.y+8;assert.equal(B.previewRoomDepthChange(request(B)).ok,false);
});
for(const f of fixtures.cases)test(f.id+': explicit allocation has its own corridor door and preserves total area',()=>{
 for(const releasedUse of ['office','laundry','storage'])for(const anchor of ['front','rear']){
  const B=fixture(f),before=plain(B.state.project.plan),r=target(B),area=B.measuredQuantities().grossArea;
  const preview=B.previewRoomDepthChange({...request(B),depth:f.id==='wide'?3:3.8,anchor,releasedUse});if(f.id==='wide'&&releasedUse==='office'){assert.equal(preview.ok,false);assert.deepEqual(plain(B.state.project.plan),before);continue;}assert.equal(preview.ok,true,preview.reason);
  assert.deepEqual(plain(B.state.project.plan),before);const added=preview.plan.rooms.find(q=>q.id===preview.released.roomId);assert.equal(added.type,releasedUse);
  const door=preview.plan.openings.find(o=>o.id===added.id+'-access');assert.equal(door.kind,'door');assert.equal(door.width,.9);
  assert.equal(B.applyRoomDepthChange(preview),true);assert.deepEqual(plain(B.state.project.plan),plain(preview.plan));assert.ok(Math.abs(B.measuredQuantities().grossArea-area)<1e-7);
  assert.equal(B.circulationAnalysis(r.floor).unreachable.length,0);assert.deepEqual(plain(B.state.project.plan.rooms.filter(q=>q.type==='bed').map(q=>q.id)),before.rooms.filter(q=>q.type==='bed').map(q=>q.id));
  for(const id of preview.changes.filter(c=>c.kind==='window-room').map(c=>c.id)){const o=B.state.project.plan.openings.find(o=>o.id===id);assert.equal(o.roomId,added.id);assert.equal(o.kind,'window');assert.equal(o.side,anchor==='rear'?'north':'south');}
  const after=plain(B.state.project.plan);B.undoPlan();assert.deepEqual(plain(B.state.project.plan),before);B.redoPlan();assert.deepEqual(plain(B.state.project.plan),after);B.save();B.state=B.loadState();assert.deepEqual(plain(B.state.project.plan),after);
 }
});
test('unsupported, undersized or duplicate allocation is rejected without changing state',()=>{
 const B=fixture(),r=target(B),before=plain(B.state.project.plan);
 for(const releasedUse of ['balcony','terrace','__proto__'])assert.equal(B.previewRoomDepthChange({...request(B),releasedUse}).ok,false);
 assert.equal(B.previewRoomDepthChange({...request(B),depth:r.h-.7,releasedUse:'office'}).ok,false);
 const options=B.compareRoomDepthOptions(request(B));assert.equal(options.length,4);assert.ok(options.every(o=>o.ok&&o.cost.amount===null));assert.deepEqual(plain(B.state.project.plan),before);
 assert.equal(B.applyRoomDepthChange(options[1]),true);const snapshot=plain(B.state.project.plan);assert.equal(B.previewRoomDepthChange({roomId:r.id,depth:3,releasedUse:'storage',anchor:'rear'}).ok,false);assert.deepEqual(plain(B.state.project.plan),snapshot);
});
