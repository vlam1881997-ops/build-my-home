import test from 'node:test';import assert from 'node:assert/strict';
import {fixtures,fixture,target} from './team-a-massing-fixture.mjs';
const copy=x=>JSON.parse(JSON.stringify(x));
for(const f of fixtures.cases)for(const use of ['loggia','terrace'])test(f.id+' '+use+': measured open edges, roof, quantities, drawings, history and persistence',()=>{
 const B=fixture(f),p=B.state.project;p.measuredDesign.roof={type:'flat',overhang:0,pitchDeg:0};const before=copy(p.plan),room=target(B),prior=B.measuredQuantities(),revision=B.drawingRevision();
 const preview=B.previewRoomDepthChange({roomId:room.id,depth:f.id==='wide'?3:3.8,anchor:'rear',releasedUse:use,sourceReference:'TEST-ONLY customer outdoor option'});assert.ok(preview.ok,preview.reason);assert.deepEqual(copy(p.plan),before);
 assert.ok(B.applyRoomDepthChange(preview));assert.deepEqual(copy(p.plan),copy(preview.plan));assert.notEqual(B.drawingRevision(),revision);
 const r=p.plan.rooms.find(r=>r.id===preview.released.roomId),after=B.measuredQuantities(),g=B.scenePlanGeometry(p.plan,r.floor);
 assert.equal(r.outdoorSpace.kind,use);assert.equal(B.measuredGeometryIssues().length,0);assert.equal(B.circulationAnalysis(r.floor).unreachable.length,0);
 assert.ok(!g.walls.some(w=>w.roomIds.length===1&&w.roomIds[0]===r.id&&B.outdoorOpenEdge(r,w.horizontal,w.axis,w.a,w.b)));
 assert.ok(!B.wallSegments(r.floor).some(w=>w.count===1&&B.outdoorOpenEdge(r,w.o==='h',w.c,w.a,w.b)));
 assert.ok(Math.abs(after.grossArea-prior.grossArea)<1e-7);assert.ok(after.wallArea<prior.wallArea);
 const q=after.floors[r.floor].rooms.find(q=>q.roomId===r.id);assert.ok(q.floorFinish>0);assert.equal(q.outdoorKind,use);
 if(use==='terrace'){assert.equal(q.ceilingFinish,0);assert.ok(Math.abs(prior.roofArea-after.roofArea-r.w*r.h)<1e-6);for(const face of B.sceneRoofSpec().faces){const x=face.reduce((n,v)=>n+v[0],0)/face.length,y=face.reduce((n,v)=>n+v[2],0)/face.length;assert.ok(!(x>r.x&&x<r.x+r.w&&y>r.y&&y<r.y+r.h));}}else{assert.ok(q.ceilingFinish>0);assert.ok(Math.abs(after.roofArea-prior.roofArea)<1e-7);}
 const sheets=B.architecturalSheets();assert.ok(sheets.some(s=>s.svg.includes('data-outdoor-room="'+r.id+'"')));assert.ok(sheets.every(s=>s.svg.includes('data-revision="'+B.drawingRevision()+'"')));assert.doesNotMatch(sheets.map(s=>s.svg).join(''),/NaN|Infinity/);
 B.state.ui.planner.sectionCutX=r.x+r.w/2;if(use==='terrace')assert.ok(B.architecturalSectionSheet('x').includes('data-section-open-air="'+r.id+'"'));assert.ok(B.architecturalElevationSheet('front').includes('data-elevation-slab="'+r.floor+'"'));assert.match(B.planDxf(r.floor),/\$INSUNITS/);assert.ok(B.measuredDesignReview().warnings.some(s=>s.includes('lan can')));assert.equal(B.commercialBoq().rows.find(q=>q.code==='OUTDOOR-REVIEW-'+r.id).amount,null);
 const accepted=copy(p.plan);B.undoPlan();assert.deepEqual(copy(p.plan),before);B.redoPlan();assert.deepEqual(copy(p.plan),accepted);B.save();B.state=B.loadState();assert.deepEqual(copy(B.state.project.plan),accepted);
});
test('outdoor requires explicit source, supported roof and free exterior edge; invalid/locked proposals are atomic',()=>{
 const B=fixture(),p=B.state.project,r=target(B);p.measuredDesign.roof={type:'flat',overhang:0,pitchDeg:0};const req={roomId:r.id,depth:3.8,anchor:'rear',releasedUse:'terrace',sourceReference:'TEST choice'},before=copy(p.plan);
 assert.equal(B.previewRoomDepthChange({...req,sourceReference:''}).ok,false);p.measuredDesign.roof.type='gable';assert.equal(B.previewRoomDepthChange(req).ok,false);p.measuredDesign.roof.type='flat';p.measuredDesign.roof.overhang=.2;assert.equal(B.previewRoomDepthChange(req).ok,false);p.measuredDesign.roof.overhang=0;
 p.plan.lockedFloors=[r.floor];assert.equal(B.previewRoomDepthChange(req).ok,false);p.plan.lockedFloors=[];assert.deepEqual(copy(p.plan),before);
 assert.ok(B.previewRoomDepthChange(req).ok);assert.ok(B.compareOutdoorDepthOptions(req).every(o=>o.ok));
 const preview=B.previewRoomDepthChange(req);preview.plan.rooms.find(r=>r.outdoorSpace).outdoorSpace.openSides=[];assert.equal(B.applyRoomDepthChange(preview),false);assert.deepEqual(copy(p.plan),before);
});
test('legacy balcony retains its original geometry until an explicit outdoor declaration, including locks and history',()=>{
 const B=fixture(),p=B.state.project,r=target(B);p.measuredDesign.roof={type:'flat',overhang:0,pitchDeg:0};
 const proposal=B.previewRoomDepthChange({roomId:r.id,depth:3.8,anchor:'rear',releasedUse:'loggia',sourceReference:'TEST setup'});assert.ok(B.applyRoomDepthChange(proposal));
 const room=p.plan.rooms.find(r=>r.outdoorSpace);delete room.outdoorSpace;B.planHistory={undo:[],redo:[]};B.save();B.state=B.loadState();const before=copy(B.state.project.plan);
 assert.equal(B.outdoorSpaceRegister()[0].kind,'unknown');assert.ok(B.measuredDesignReview().warnings.some(s=>s.includes('ban công cũ')));
 const request={roomId:room.id,kind:'terrace',openSides:['north','west'],sourceReference:'TEST customer declaration'};
 const preview=B.previewOutdoorSpace(request);assert.ok(preview.ok,preview.reason);assert.deepEqual(copy(B.state.project.plan),before);
 B.state.project.plan.lockedRoomIds=[room.id];assert.equal(B.applyOutdoorSpace(preview),false);assert.equal(B.previewOutdoorSpace(request).ok,false);B.state.project.plan.lockedRoomIds=[];
 assert.ok(B.applyOutdoorSpace(B.previewOutdoorSpace(request)));assert.equal(B.outdoorSpaceRegister()[0].covered,false);B.undoPlan();assert.deepEqual(copy(B.state.project.plan),before);B.redoPlan();B.save();B.state=B.loadState();assert.equal(B.outdoorSpaceRegister()[0].kind,'terrace');
 const accepted=copy(B.state.project.plan);assert.equal(B.previewOutdoorSpace({...request,openSides:['north','invalid']}).ok,false);assert.equal(B.previewOutdoorSpace({...request,openSides:['east']}).ok,false);assert.deepEqual(copy(B.state.project.plan),accepted);
});
test('outdoor specialist document is source/reviewer/revision checked and becomes stale after a design change',()=>{
 const B=fixture(),p=B.state.project,r=target(B);p.measuredDesign.roof={type:'flat',overhang:0,pitchDeg:0};assert.ok(B.applyRoomDepthChange(B.previewRoomDepthChange({roomId:r.id,depth:3.8,anchor:'rear',releasedUse:'terrace',sourceReference:'TEST choice'})));
 const space=B.outdoorSpaceRegister()[0],key=space.technicalInputKey;assert.equal(space.detailsStatus,'missing');assert.ok(B.handoverStatus().missingConstruction.includes('outdoor-details:'+space.roomId));
 const input=p.constructionDesign.inputs[key]={value:{documentReference:'TEST-ONLY external guard/drainage/waterproof/structure details'},sourceReference:'TEST-ONLY specialist drawing',status:'reviewed',reportReference:'TEST review'};assert.equal(B.outdoorSpaceRegister()[0].detailsStatus,'awaiting-review');
 Object.assign(input,{reviewer:{name:'TEST professional',role:'KS'},reviewedAt:'2026-10-14',reviewedRevision:B.drawingRevision()});assert.equal(B.outdoorSpaceRegister()[0].detailsStatus,'reviewed');assert.ok(!B.handoverStatus().missingConstruction.includes('outdoor-details:'+space.roomId));assert.equal(B.handoverStatus().certifiedForConstruction,false);
 p.site.floorHeights[0]+=.1;assert.equal(B.outdoorSpaceRegister()[0].detailsStatus,'stale');assert.ok(B.handoverStatus().missingConstruction.includes('outdoor-details:'+space.roomId));
});
