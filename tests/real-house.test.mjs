import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {designClient} from './fixtures/design-client.mjs';
const client=()=>{const b=designClient({realHouse:true});assert.equal(b.autoPlanConcept(),true);return b;};

test('3D facade and jambs consume cumulative floor bases from A without altering measured plan',()=>{
 const b=client(),p=b.state.project,original=JSON.stringify(p.plan),heights=[3.8,3.4,3.1],bases=[0,3.8,7.2];
 b.resolvedProjectLevels=()=>({...b.projectLevels(),roofBase:10.3,levels:heights.map((height,floor)=>({floor,base:bases[floor],height,slab:.14,ceilingDrop:.2,clearHeight:height-.34}))});
 b.floorLevel=f=>b.resolvedProjectLevels().levels[f];b.selectHouseStyle('japandi');
 const parts=b.facadeComponents(),jambs=b.houseConstructionDetails().filter(x=>x.kind==='opening-jamb');
 for(let floor=0;floor<3;floor++){
  const walls=parts.filter(x=>x.floor===floor&&x.kind==='exterior-finish');assert.ok(walls.length>0,'floor '+floor);
  assert.ok(walls.every(x=>x.y>=bases[floor]+.14-1e-8),'facade base '+floor);
  assert.ok(walls.every(x=>x.y+x.h<=bases[floor]+heights[floor]+1e-8),'facade head '+floor);
  for(const x of jambs.filter(x=>x.floor===floor)){
   const opening=p.plan.openings.find(o=>o.id===x.openingId);assert.ok(opening);assert.ok(Math.abs(x.y-(bases[floor]+.14+(opening.sill||0)))<1e-8);
  }
 }
 const scene=new THREE.Scene();b.addArchitecturalFacade({THREE,scene,W:p.site.width,D:p.site.depth,explode:1.1},parts);
 for(const mesh of scene.children)for(const id of mesh.userData.componentIds){const x=parts.find(q=>q.id===id),box=new THREE.Box3().setFromObject(mesh);assert.ok(box.min.y<=x.y+x.floor*1.1+1e-5&&box.max.y>=x.y+x.h+x.floor*1.1-1e-5);}
 assert.equal(JSON.stringify(p.plan),original);
});

test('flat-roof parapets distinguish a suggestion, an actual height and an explicit removal without changing the plan',()=>{
 const b=client(),p=b.state.project;b.guidedDetails=(id,title,html)=>html;b.selectHouseStyle('japandi');const plan=JSON.stringify(p.plan),products=JSON.stringify(p.materials.choices),d=b.measuredDesignSettings();
 assert.equal(b.roofParapetSpec().height,.38);assert.equal(b.roofParapetSpec().source,'design-suggestion');assert.match(b.measuredDesignPanel(),/là gợi ý phương án/);
 d.roof.parapetHeight=.47;const roof=b.sceneRoofSpec(),parts=b.houseConstructionDetails().filter(p=>p.kind==='roof-parapet');assert.equal(b.roofParapetSpec().source,'customer');assert.ok(parts.length>0);assert.ok(parts.every(p=>p.h===.47&&p.y===roof.eave));assert.ok(Math.abs(roof.envelopeTop-roof.eave-.495)<1e-8);
 d.roof.parapetHeight=0;assert.equal(b.houseConstructionDetails().some(p=>p.kind==='roof-parapet'||p.kind==='roof-coping'),false);assert.equal(b.sceneRoofSpec().envelopeTop,b.sceneRoofSpec().eave);
 d.roof.parapetHeight=.47;d.roof.type='mono';d.roof.pitchDeg=17;assert.equal(b.roofParapetSpec().height,0);assert.equal(b.sceneRoofSpec().pitchDeg,17);assert.equal(b.houseConstructionDetails().some(p=>p.kind==='roof-parapet'),false);
 assert.equal(JSON.stringify(p.plan),plan);assert.equal(JSON.stringify(p.materials.choices),products);assert.equal(b.architecturalIdentityReview().engineeringApproved,false);
});

test('new house details have matching measured 2D and 3D extents, including notched upper floors',()=>{
 const b=client(),p=b.state.project;b.selectHouseStyle('japandi');const top=b.projectLevels().floors-1;p.plan.rooms=p.plan.rooms.filter(r=>r.floor!==top);p.plan.rooms.push({id:'notch-a',type:'bedroom',floor:top,x:1,y:3,w:3,h:5},{id:'notch-b',type:'bedroom',floor:top,x:4,y:3,w:3,h:3});
 const original=JSON.stringify(p.plan),parts=b.facadeComponents(),details=parts.filter(p=>p.id.startsWith('measured-house-1')),scene=new THREE.Scene();assert.ok(details.some(p=>p.kind==='roof-parapet'));b.addArchitecturalFacade({THREE,scene,W:p.site.width,D:p.site.depth,explode:1.1},parts);
 for(const part of details){assert.ok(part.x>=0&&part.z>=0&&part.x+part.w<=p.site.width+1e-8&&part.z+part.d<=p.site.depth+1e-8);assert.equal(part.structural,false);assert.equal(part.provisional,true);assert.ok(b.architecturalElevationSheet(part.projectionSide).includes('data-facade-component="'+part.id+'"'));const mesh=scene.children.find(m=>m.userData.componentIds.includes(part.id));assert.ok(mesh);const box=new THREE.Box3().setFromObject(mesh);assert.ok(box.min.y<=part.y+part.floor*1.1+1e-5&&box.max.y>=part.y+part.h+part.floor*1.1-1e-5);}
 const parapets=details.filter(p=>p.kind==='roof-parapet');assert.ok(parapets.some(p=>p.projectionSide==='back'&&Math.abs(p.z-5.89)<.02),'the inner notch edge has its own measured parapet');assert.equal(JSON.stringify(p.plan),original);
});

test('window handles stay inside each measured clear span and do not change saved windows or floor voids',()=>{
 const b=client(),p=b.state.project,original=JSON.stringify(p.plan),voids=p.plan.rooms.filter(r=>['stairs','elevator'].includes(r.type)).map(r=>JSON.stringify(b.slabPanels(r,b.stairFloorHoles(r.floor))));
 for(const id of ['japandi','indochine','classic']){b.selectHouseStyle(id);for(const o of p.plan.openings.filter(o=>o.kind==='window')){const span=b.openingWallSpan(o),handles=b.windowAssembly(o).filter(q=>q.part.startsWith('sash-handle'));assert.ok(handles.length>0);for(const h of handles){const at=span.o==='h'?h.x:h.z,size=span.o==='h'?h.w:h.d;assert.ok(at>=span.a-1e-8&&at+size<=span.b+1e-8);assert.ok(h.h>0&&h.h<o.height);}}
  assert.equal(JSON.stringify(p.plan),original);assert.deepEqual(p.plan.rooms.filter(r=>['stairs','elevator'].includes(r.type)).map(r=>JSON.stringify(b.slabPanels(r,b.stairFloorHoles(r.floor)))),voids);}
});

test('bundled house photographs and daylight have provenance, matching hashes and bounded sizes',()=>{
 const manifest=JSON.parse(fs.readFileSync('assets/interior/real-house-provenance.json','utf8'));assert.equal(manifest.license,'CC0-1.0');let bytes=0;
 for(const asset of manifest.assets)for(const file of asset.files){const data=fs.readFileSync(file.file);assert.equal(crypto.createHash('sha256').update(data).digest('hex'),file.sha256);if(file.file.endsWith('.png')){assert.equal(data.readUInt32BE(16),512);assert.equal(data.readUInt32BE(20),512);}assert.match(file.sourceUrl,/^https:\/\/dl.polyhaven.org\//);bytes+=data.length;}
 assert.ok(bytes<4000000);assert.ok(manifest.assets.some(a=>a.files.some(f=>f.file.endsWith('.hdr'))));
});

test('interior finish details for all 24 styles stay inside measured rooms, stop at openings and use each floor height',()=>{
 const b=client(),p=b.state.project;Object.assign(p.site,{width:10,depth:12,floors:2,floorHeights:[3.8,3.1]});
 p.plan.rooms=[{id:'finish-living',floor:0,name:'Khách',type:'living',x:.4,y:.4,w:4.6,h:4.6},{id:'finish-bed',floor:1,name:'Ngủ',type:'bed',x:.4,y:.4,w:4.6,h:4.6},{id:'finish-shaft',floor:0,name:'Giếng',type:'elevator',x:5,y:.4,w:1.8,h:1.8}];
 p.plan.openings=[{id:'finish-door',roomId:'finish-living',floor:0,kind:'door',side:'north',offset:.2,width:1.1,height:2.3,sill:0},{id:'finish-low-glazing',roomId:'finish-bed',floor:1,kind:'window',side:'east',offset:.25,width:1.5,height:2.5,sill:.05}];p.plan.fixtures=[];const before=JSON.stringify(p.plan),span=b.openingWallSpan(p.plan.openings[0]);
 let styles=0;for(const style of b.HOUSE_STYLES){b.selectHouseStyle(style.id);styles++;for(const r of p.plan.rooms){const parts=b.interiorFinishDetails(r);if(r.type==='elevator'){assert.equal(parts.length,0);continue;}assert.ok(parts.some(x=>x.kind==='skirting'));for(const q of parts){assert.ok(q.x>=r.x-1e-8&&q.z>=r.y-1e-8&&q.x+q.w<=r.x+r.w+1e-8&&q.z+q.d<=r.y+r.h+1e-8);assert.equal(q.structural,false);assert.ok(q.y+q.h<=b.studioFloorLevel(r.floor).height+1e-8);if(r.floor===0&&q.kind==='skirting'&&q.horizontal&&q.z<r.y+.2)assert.ok(q.x+q.w<=span.a+.001||q.x>=span.b-.001,'door clearance remains open');}}
 assert.equal(JSON.stringify(p.plan),before);}
 assert.equal(styles,24);
});
