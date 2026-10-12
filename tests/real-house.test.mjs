import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
import crypto from 'node:crypto';
import {designClient} from './fixtures/design-client.mjs';
const client=()=>{const b=designClient({realHouse:true});assert.equal(b.autoPlanConcept(),true);return b;};

test('pitched roofs survive a notched measured footprint without covering its courtyard',()=>{
 const b=client(),p=b.state.project;Object.assign(p.site,{width:9,depth:12,floors:1});
 p.plan.rooms=[{id:'a',floor:0,type:'living',x:1,y:1,w:5,h:4},{id:'b',floor:0,type:'bed',x:1,y:5,w:3,h:4}];p.plan.openings=[];p.plan.fixtures=[];
 const before=JSON.stringify(p.plan),d=b.measuredDesignSettings();d.roof.overhang=.25;
 for(const type of ['hip','gable','mono'])for(const ridge of ['depth','width']){
  Object.assign(d.roof,{type,ridge,pitchDeg:30});const roof=b.sceneRoofSpec();assert.ok(roof?.compound,type);assert.ok(roof.rise>0);assert.ok(roof.area>32);assert.equal(roof.overhang,0);assert.equal(roof.requestedOverhang,.25);
  let projected=0;for(const face of roof.faces){projected+=b.polygonArea3D(face.map(q=>[q[0],0,q[2]]));for(const point of face){assert.ok(point.every(Number.isFinite));assert.ok(point[0]<=4+1e-8||point[2]<=5+1e-8,'notch stays open');}}
  assert.ok(Math.abs(projected-32)<1e-7,'exact occupied footprint, no duplicate roof panels');assert.ok(roof.gables.length>0);assert.equal(JSON.stringify(p.plan),before);
  const exploded=b.sceneRoofSpec(1.2);assert.equal(exploded.area,roof.area);
 }
});

test('24 exterior palettes keep authored joinery while classical detail is projected into drawings',()=>{
 const b=client(),p=b.state.project;for(const style of b.HOUSE_STYLES){b.selectHouseStyle(style.id);assert.match(b.architecturalIdentity().frame,/^#[0-9a-f]{6}$/);assert.match(b.architecturalIdentity().base,/^#[0-9a-f]{6}$/);p.materials.finish.exterior={frame:'#123456'};assert.equal(b.scenePalette().frame,0x123456);}
 p.materials.finish.exterior={};b.selectHouseStyle('neo');const parts=b.facadeComponents();for(const kind of ['roof-crown','pilaster-flute','stone-course'])assert.ok(parts.some(q=>q.kind===kind),kind);
 const sheet=b.architecturalElevationSheet('front');for(const q of parts.filter(q=>q.kind==='roof-crown'))assert.ok(sheet.includes('data-facade-component="'+q.id+'"'));
});

test('24 facade proposals share validated opening edits, preserve room and furniture geometry and honor locks',()=>{
 const b=client(),p=b.state.project,original=JSON.stringify(p.plan),signatures=new Set();
 for(const style of b.HOUSE_STYLES){b.selectHouseStyle(style.id);const v=b.styleFacadeProposal();assert.equal(v.reason,'',style.id);assert.ok(v.changes.length>0,style.id);assert.equal(JSON.stringify(p.plan),original);assert.equal(JSON.stringify(v.plan.rooms),JSON.stringify(p.plan.rooms));assert.equal(JSON.stringify(v.plan.furniture),JSON.stringify(p.plan.furniture));assert.equal(JSON.stringify(v.plan.fixtures),JSON.stringify(p.plan.fixtures));assert.deepEqual(v.plan.openings.map(o=>o.id),p.plan.openings.map(o=>o.id));signatures.add(JSON.stringify(v.changes.map(q=>q.after)));
  for(const q of v.changes){if(q.floor>0)assert.ok(q.after.sill>=.9);const before=p.plan.openings.find(o=>o.id===q.id),after=v.plan.openings.find(o=>o.id===q.id),a=b.openingWallSpan(before),c=b.withPlan(v.plan,()=>b.openingWallSpan(after));assert.ok(Math.abs(a.a+a.b-c.a-c.b)<1e-8);}
 }
 assert.ok(signatures.size>=16,'distinct measured proportions, not just names');
 p.plan.lockedFloors=[0,1,2];assert.equal(b.styleFacadeProposal().changes.length,0);assert.equal(b.applyStyleFacadeProposal(),false);
});

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

test('photographic assets are licensed, bounded and have matching byte evidence',()=>{
 const p=JSON.parse(fs.readFileSync('assets/interior/photographic-provenance.json','utf8'));assert.equal(p.license,'CC0-1.0');assert.equal(p.licenseUrl,'https://polyhaven.com/license');assert.ok(p.files.length>=20);
 for(const a of p.files){const bytes=fs.readFileSync(a.file);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),a.sha256);assert.ok(bytes.length<800000);assert.match(a.sourceUrl,/^https:\/\/dl\.polyhaven\.org\//);}
});
test('detailed chair keeps measured local bounds, pose and semantic customer finishes',async()=>{
 const b=client();b.state.project.style='Japandi';const {GLTFLoader}=await import('three/addons/loaders/GLTFLoader.js'),bytes=fs.readFileSync('assets/interior/models/modern-armchair-facing.glb'),gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
 b.loadFurnitureModel=async()=>gltf.scene;const scene=new THREE.Scene(),group=new THREE.Group(),r=b.state.project.plan.rooms.find(r=>r.type==='living'),item={id:'measured-chair',model:'loungeChair',roomId:r.id,floor:r.floor,size:{width:.98,height:.92,depth:.82},pose:{x:2,y:3,rotationDeg:37}};
 group.name=item.id;group.userData={kind:'furniture',roomId:r.id,placement:item};group.position.set(2,.14,3);group.rotation.y=-37*Math.PI/180;group.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial()));scene.add(group);b.studio3d={scene,renderer:{shadowMap:{}},requestRender(){}};const plan=JSON.stringify(b.state.project.plan),pose=group.position.clone();assert.equal(await b.upgradeMeasuredFurniture(group,'modern-armchair',THREE,scene),true);assert.equal(group.name,item.id);assert.ok(group.position.equals(pose));assert.equal(group.rotation.y,-37*Math.PI/180);assert.equal(group.userData.source,'licensed-mesh');
 const local=group.children[0].clone(true);local.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(local).getSize(new THREE.Vector3());for(const [actual,expected]of [[size.x,.98],[size.y,.92],[size.z,.82]])assert.ok(Math.abs(actual-expected)<1e-5);
 let backZ=0,count=0;local.traverse(o=>{if(!o.isMesh)return;const p=o.geometry.attributes.position;for(let n=0;n<p.count;n++)if(p.getY(n)>.82){backZ+=p.getZ(n);count++;}});assert.ok(count>0&&backZ/count>.1,'backrest stays +Z; chair faces -Z like plan arrow');
 const slots=new Set();group.traverse(o=>{if(o.isMesh)slots.add(o.material.userData.finishSlot)});assert.deepEqual([...slots].sort(),['fabric','wood']);assert.equal(JSON.stringify(b.state.project.plan),plan);
 scene.userData.disposed=true;const before=group.children[0];assert.equal(await b.upgradeMeasuredFurniture(group,'modern-armchair',THREE,scene),false);assert.equal(group.children[0],before);
});

test('facade photographic PBR uses scene-owned shared maps and metre UVs, retaining authored paint',()=>{
 const b=client(),scene=new THREE.Scene(),calls=[],maps=new Map();b.state.project.materials.finish.exterior=null;b.selectHouseStyle('industrial');
 b.sceneMaterialTexture=(T,s,kind,channel)=>{assert.equal(s,scene);calls.push([kind,channel]);const key=kind+channel;if(!maps.has(key)){const t=new T.Texture();t.userData={source:'test-photo',kind,channel};maps.set(key,t);}return maps.get(key);};
 const m=b.architecturalFacadeMaterial(THREE,scene,'accent');assert.deepEqual(calls.filter(x=>x[0]==='brick'),[['brick','color'],['brick','normal'],['brick','roughness']]);assert.equal(m.map,maps.get('brickcolor'));assert.equal(m.normalMap,maps.get('bricknormal'));assert.deepEqual(Array.from(m.userData.surfaceScale),[1.1,1.04]);
 const g=new THREE.BoxGeometry(1.1,1.04,.01);b.sceneSurfaceUvs(g,m);const uv=g.attributes.uv;assert.ok([...uv.array].every(Number.isFinite));
 const before=b.state.project.materials.choices;b.applyFinishColor('accent','#aaccee');const custom=b.architecturalFacadeMaterial(THREE,scene,'accent');assert.equal(custom.color.getHexString(),'aaccee');assert.equal(custom.map?.userData.kind==='brick',false);assert.equal(b.state.project.materials.choices,before);
});

test('all interior collection meshes fit measured envelopes and tufted backrests contain recessed textiles',()=>{
 const b=client(),plan=JSON.stringify(b.state.project.plan),signatures=new Set();
 for(const collection of b.INTERIOR_COLLECTIONS){
  const scene=new THREE.Scene(),materials=b.sceneAssetMaterials(THREE,scene,{...collection}),size={w:2.24,h:.87,d:.94};
  const model=b.createRoomAsset('loungeDesignSofa',size,THREE,materials);model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),actual=bounds.getSize(new THREE.Vector3());
  for(const [a,e]of [[actual.x,size.w],[actual.y,size.h],[actual.z,size.d],[bounds.min.y,0]])assert.ok(Math.abs(a-e)<1e-5,collection.id);
  let triangles=0,tufts=0,rolls=0;model.traverse(o=>{if(o.isMesh){triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;if(o.userData.tufted)tufts++;if(o.userData.kind==='rolled-arm')rolls++;}});
  assert.ok(triangles<90000,collection.id+' bounded triangles '+triangles);signatures.add(triangles);
  if(collection.shape==='tufted'){assert.equal(tufts,2);assert.equal(rolls,2);}
  assert.equal(JSON.stringify(b.state.project.plan),plan);
 }
 assert.ok(signatures.size>=6,'collection shapes are geometrically distinct');
});

test('facade bay frames and battens stay on measured solid bands and preserve every opening',()=>{
 const b=client(),p=b.state.project,before=JSON.stringify(p.plan);let frames=0,battens=0;
 for(const id of ['modern','contemporary','japandi','brutalist','artdeco','scandi']){
  b.selectHouseStyle(id);for(const q of b.facadeComponents().filter(x=>/^bay-frame-|^timber-batten$/.test(x.kind))){
   if(q.kind==='timber-batten')battens++;else frames++;
   assert.ok(q.x>=0&&q.z>=0&&q.x+q.w<=p.site.width+1e-8&&q.z+q.d<=p.site.depth+1e-8);
   for(const o of p.plan.openings.filter(x=>x.floor===q.floor)){
    const s=b.openingWallSpan(o);if(!s||s.o!=='h'||Math.abs(s.c-q.z)>.4)continue;
    const bottom=b.studioFloorLevel(o.floor).base+b.studioLevels().slab+(o.sill||0),top=bottom+o.height;
    const overlapX=Math.min(q.x+q.w,s.b)-Math.max(q.x,s.a),overlapY=Math.min(q.y+q.h,top)-Math.max(q.y,bottom);
    assert.ok(overlapX<.001||overlapY<.001,'finish must not occlude '+o.id);
   }
   assert.equal(q.structural,false);
  }assert.equal(JSON.stringify(p.plan),before);
 }
 assert.ok(frames>0);assert.ok(battens>0);
});
