/* One review fixture, not a surveyed or approved customer house. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {designClient} from './fixtures/design-client.mjs';

export function modernReference(){
 const B=designClient({realHouse:true}),p=B.state.project;
 // Restore the production envelope/parcel functions: the general unit fixture
 // deliberately stubs an 8m envelope, unsuitable for this 5m reference house.
 const boot=fs.readFileSync('src/00_boot.js','utf8');
 vm.runInNewContext(boot.slice(boot.indexOf('BMH.siteParcelStats ='),boot.indexOf('BMH.siteFeasibility =')),{BMH:B});
 const architecture=fs.readFileSync('src/76_architecture.js','utf8');
 vm.runInNewContext(architecture.slice(architecture.indexOf('BMH.roomInsideParcel='),architecture.indexOf('const architectureRoomValid')),{BMH:B});
 p.name='BMH · Hiện đại 5×20 · mẫu kiểm chứng V01';p.source='review-fixture';p.style='Hiện đại';p.briefIdea='';
 Object.assign(p.site,{width:5,depth:20,floors:2,floorHeight:3.4,floorHeights:[3.4,3.4],setbackFront:2,setbackRear:1,setbackSide:0,useParcelGeometry:false});
 p.household={ownerBirth:1988,ownerGender:'Nam',partnerEnabled:false,children:[],relatives:[]};
 p.inputEvidence={schemaVersion:1,origin:'review-fixture',records:{}};
 p.sourceRefs=[];p.designEvidence={schemaVersion:1,research:[],site:[],fengSources:[],materialSources:[],context:{}};
 p.designStudio={program:{mode:'custom',elevator:false,floors:[{bedrooms:0,bathrooms:1,living:true,kitchen:true},{bedrooms:2,bathrooms:1}]}};
 p.materials.finish={exterior:null,rooms:{}};
 // Explicit unknown IDs prevent JSON import from filling absent categories
 // with default brands and silently changing the sample's design identity.
 p.materials.choices={floor:'UNCONFIRMED-FLOOR',paint:'UNCONFIRMED-PAINT',door:'UNCONFIRMED-DOOR'};
 p.plan={rooms:[],openings:[],fixtures:[],outdoor:[],furniture:[],lockedRoomIds:[],lockedFloors:[]};
 p.measuredDesign={roof:{type:'flat',pitchDeg:0,overhang:0,ridge:'auto',surface:'auto',color:'',parapetHeight:-1}};
 const proposal=B.architectureProposal('balanced');assert.equal(proposal.ok,true,proposal.reason);p.plan=proposal.plan;
 // The generated 3.58×3.20m well fits the first flight along X. The default
 // along-Y flight is too short for the engine's tread assumption.
 assert.equal(B.editStairStack(p.plan.rooms.find(r=>r.type==='stairs').id,{stairDirection:90}),true);
 assert.ok(p.plan.rooms.filter(r=>r.type==='stairs').every(r=>!B.stairSpec(r).warning));
 // One explicit review proposal, never applied to the user's saved project.
 // The terrace is represented in the shared plan instead of being drawn only
 // in the renderer to make a box look different.
 const bedroom=p.plan.rooms.find(r=>r.floor===1&&r.type==='bed');
 const depth=B.previewRoomDepthChange({roomId:bedroom.id,depth:3.8,anchor:'rear',releasedUse:'terrace',sourceReference:'BMH V01 review proposal; not a customer-approved or surveyed terrace.'});
 assert.equal(depth.ok,true,depth.reason);assert.equal(B.applyRoomDepthChange(depth),true);
 B.applyStyleMaterialSuggestions();
 const revision=B.drawingRevision();
 return {B,review:{id:'modern-5x20-2f-v01',status:'review-fixture-not-approved',styleId:'modern',revision,units:'m',
  source:'5×20m and 2 floors match the visible app example; all other values are explicit review assumptions, not a customer survey.',
  assumptions:['Front/rear/side setbacks 2/1/0m are a design scenario, not verified planning.','Two 3.4m storeys, two bedrooms, two bathrooms; no elevator.','Proposed front upper terrace 3.58×1.89m; adjoining bedroom depth3.8m. Requires customer/architect approval.','Family data are synthetic; no personal feng-shui approval.','Furniture and CC0 surface profiles are generic; no verified manufacturer SKU.'],
  proposalChanges:depth.changes,
  missing:['Survey and planning confirmation','Customer room/budget/style approval','Structural and MEP engineering','Supplier SKU assets and complete quotes','Actual shaded exterior/interior visual approval'],
  geometryIssues:B.measuredGeometryIssues(),stairs:B.stairAlignmentIssues(),
  stairDimensions:p.plan.rooms.filter(r=>r.type==='stairs').map(r=>({roomId:r.id,floor:r.floor,...B.stairSpec(r)})),
  rooms:p.plan.rooms.map(r=>({id:r.id,name:r.name,type:r.type,floor:r.floor,x:r.x,y:r.y,width:r.w,depth:r.h})),
  finishes:p.plan.rooms.filter(r=>!['stairs','corridor'].includes(r.type)).map(r=>({roomId:r.id,...B.visualMaterialContext(r.id)}))}};
}

if(process.argv[1]===new URL(import.meta.url).pathname){
 const out=process.argv[2]||'docs/team-v1/evidence/B/Modern-5x20-V01';fs.mkdirSync(out,{recursive:true});
 const {B,review}=modernReference();assert.equal(review.geometryIssues.filter(i=>i.sev==='error').length,0,JSON.stringify(review.geometryIssues));
 for(let f=0;f<2;f++)assert.equal(B.circulationAnalysis(f).unreachable.length,0);
 B.state.ui.onboardingComplete=true;B.state.ui.step=4;B.state.ui.planner.floor=0;
 fs.writeFileSync(path.join(out,'project.json'),JSON.stringify(B.state,null,2)+'\n');
 fs.writeFileSync(path.join(out,'review.json'),JSON.stringify(review,null,2)+'\n');
 for(let f=0;f<2;f++){
  fs.writeFileSync(path.join(out,'plan-T'+(f+1)+'.svg'),B.designDrawingSvg('plan',f));
  fs.writeFileSync(path.join(out,'plan-T'+(f+1)+'.dxf'),B.planDxf(f));
 }
 console.log(JSON.stringify({id:review.id,revision:review.revision,rooms:review.rooms.length,geometryIssues:review.geometryIssues,status:review.status}));
}
