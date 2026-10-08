import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {designClient} from './fixtures/design-client.mjs';
const client=()=>{const b=designClient({realHouse:true});assert.equal(b.autoPlanConcept(),true);return b;};

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
