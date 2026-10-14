import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import fs from 'node:fs';
import vm from 'node:vm';
import {designClient} from './fixtures/design-client.mjs';
const client=()=>{const b=designClient({identity:true});assert.equal(b.autoPlanConcept(),true);return b;};

test('all 24 styles have measured exterior identities, retaining the actual plan and material selections',()=>{
 const b=client(),p=b.state.project,unchanged=JSON.stringify({plan:p.plan,materials:p.materials}),signatures=new Set();assert.equal(Object.keys(b.ARCHITECTURAL_IDENTITIES).length,24);
 for(const style of b.HOUSE_STYLES){assert.equal(b.selectHouseStyle(style.id),true);const parts=b.facadeComponents();assert.ok(parts.length>0&&parts.length<1000,style.id);assert.equal(new Set(parts.map(p=>p.id)).size,parts.length);
  signatures.add(JSON.stringify(parts.map(p=>[p.kind,p.x,p.y,p.z,p.w,p.h,p.d,p.polygon])));
  for(const part of parts){assert.equal(part.styleId,style.id);assert.equal(part.generic,true);assert.equal(part.structural,false);assert.equal(part.provisional,true);assert.ok([part.x,part.y,part.z,part.w,part.h,part.d].every(Number.isFinite));assert.ok(part.x>=0&&part.z>=0&&part.x+part.w<=p.site.width+1e-8&&part.z+part.d<=p.site.depth+1e-8);assert.ok(part.y>=part.floor*b.projectLevels().floorHeight-1e-8);assert.ok(b.facadeComponentArea(part)>0);}
  assert.equal(JSON.stringify({plan:p.plan,materials:p.materials}),unchanged);assert.equal(b.architecturalIdentityReview().exactReferenceMatch,null);
 }
 assert.equal(signatures.size,24,'each catalogue style has actual geometric differences');
});

test('batched boxes and curved profiles match the shared 2D extents at every floor, including exploded views',()=>{
 const b=client(),p=b.state.project;p.materials.finish.exterior={};
 for(const id of ['japandi','modern','indochine','neo','tudor','artdeco']){b.selectHouseStyle(id);const parts=b.facadeComponents(),scene=new THREE.Scene();b.addArchitecturalFacade({THREE,scene,W:p.site.width,D:p.site.depth,explode:1.25},parts);
  const count=scene.children.length;assert.ok(count<=b.projectLevels().floors*8,'profile batching has bounded draw meshes');
  for(const mesh of scene.children){const wanted=parts.filter(q=>mesh.userData.componentIds.includes(q.id)),expected=new THREE.Box3();for(const q of wanted)expected.union(new THREE.Box3(new THREE.Vector3(q.x-p.site.width/2,q.y+q.floor*1.25,q.z-p.site.depth/2),new THREE.Vector3(q.x+q.w-p.site.width/2,q.y+q.h+q.floor*1.25,q.z+q.d-p.site.depth/2)));const box=new THREE.Box3().setFromObject(mesh);for(const axis of ['x','y','z']){assert.ok(Math.abs(box.min[axis]-expected.min[axis])<1e-5,id+' min '+axis);assert.ok(Math.abs(box.max[axis]-expected.max[axis])<1e-5,id+' max '+axis);}assert.ok([...mesh.geometry.attributes.position.array,...mesh.geometry.attributes.normal.array,...mesh.geometry.attributes.uv.array].every(Number.isFinite));}
  for(const side of ['front','back','left','right']){const svg=b.architecturalElevationSheet(side);for(const q of parts.filter(q=>q.projectionSide===side))assert.ok(svg.includes('data-facade-component="'+q.id+'"'),id+' '+side+' '+q.kind);}
 }
});

test('outside paint and selected accents remain independent of a room palette and preserve explicit choices across styles',()=>{
 const b=client(),p=b.state.project,r=p.plan.rooms.find(r=>r.type==='living');p.materials.finish.exterior={wall:'#dde8d7',accent:'#886644',visualMaterials:{wall:'grey-paint',accent:'dark-walnut'},explicitRoles:{wall:true,accent:true}};p.materials.finish.rooms[r.id]={wall:'#aabbdd',visualMaterials:{wall:'grey-paint'},explicitRoles:{wall:true}};
 for(const id of ['modern','japandi','neo']){b.selectHouseStyle(id);const f=b.facadeFinishPalette();assert.equal(f.wall,'#dde8d7');assert.equal(f.accent,'#886644');assert.equal(f.facadeSurface,'selected');assert.equal(b.finishPalette(r.id).wall,'#aabbdd');const scene=new THREE.Scene(),m=b.architecturalFacadeMaterial(THREE,scene,'accent');assert.equal(m.userData.visualMaterial,'dark-walnut');assert.equal(m.color.getHexString(),'886644');assert.equal(m.userData.facadeRole,'accent');}
 p.materials.finish.exterior={};b.selectHouseStyle('modern');assert.equal(b.facadeFinishPalette().facadeSurface,'metal');assert.ok(b.architecturalFacadeMaterial(THREE,new THREE.Scene(),'accent').metalness>0);b.selectHouseStyle('japandi');assert.equal(b.facadeFinishPalette().facadeSurface,'wood');
});

test('unknown custom styles keep their status and do not receive a claimed catalogue identity',()=>{
 const b=client();b.state.project.style='Phong cách riêng từ ảnh khách';const result=b.architecturalIdentityReview();assert.equal(result.styleId,null);assert.equal(result.recognized,false);assert.equal(result.engineeringApproved,false);assert.equal(result.exactReferenceMatch,null);assert.ok(b.facadeComponents().every(p=>p.styleId===null));
});

test('global facade finish refresh retains buffers and cannot update a stale or closed scene',()=>{
 const b=client(),p=b.state.project,scene=new THREE.Scene();b.selectHouseStyle('japandi');b.studioStructureKey=()=>JSON.stringify({style:p.style,plan:p.plan});b.addArchitecturalFacade({THREE,scene,W:p.site.width,D:p.site.depth,explode:0},b.facadeComponents());let frames=0;const s=b.studio3d={THREE,scene,project:p,structureKey:b.studioStructureKey(),renderer:{domElement:{isConnected:true}},requestRender(){frames++;}};b.state.ui.step=6;
 const buffers=scene.children.map(m=>[m,m.geometry.attributes.position.array]);assert.equal(b.applyVisualMaterial('wall','grey-paint'),true);assert.equal(b.refreshStudioFinishes('wall'),true);assert.ok(frames>0);assert.ok(buffers.every(([m,a])=>m.geometry.attributes.position.array===a));assert.ok(scene.children.filter(m=>m.userData.facadeRole==='wall').every(m=>m.material.color.getHexString()==='d2d5d1'));
 b.state.ui.step=4;b.applyVisualMaterial('wall','ivory-paint');assert.equal(b.refreshStudioFinishes('wall'),false);assert.ok(scene.children.filter(m=>m.userData.facadeRole==='wall').every(m=>m.material.color.getHexString()==='d2d5d1'));
 b.state.ui.step=6;b.selectHouseStyle('neo');assert.equal(b.refreshStudioFinishes('wall'),false);assert.equal(b.studio3d,s);assert.ok(scene.children.every(m=>m.userData.styleId==='japandi'));
});

test('collection wall treatments use solid bays, stay below the ceiling and follow a manually mixed room',()=>{
 const b=client(),p=b.state.project,r=p.plan.rooms.find(r=>r.type==='living'),plan=JSON.stringify(p.plan);p.materials.finish.interior={default:'',rooms:{[r.id]:'neo-elegance'},authored:{[r.id]:'manual'}};
 for(const id of ['modern','japandi','indochine']){b.selectHouseStyle(id);const parts=b.interiorFeatureComponents(r);assert.ok(parts.length>0);assert.ok(parts.every(q=>q.collectionId==='neo-elegance'));for(const q of parts){assert.ok(q.x>=r.x&&q.z>=r.y&&q.x+q.w<=r.x+r.w+1e-8&&q.z+q.d<=r.y+r.h+1e-8);assert.ok(q.y+q.h<=b.projectLevels().slab+b.projectLevels().clearHeight+1e-8);assert.equal(q.roomId,r.id);assert.equal(q.floor,r.floor);}assert.equal(JSON.stringify(p.plan),plan);}
});

test('style-specific glazing bars retain measured opening bounds and do not change saved openings',()=>{
 const b=client(),p=b.state.project,opening=p.plan.openings.find(o=>o.kind==='window'),original=JSON.stringify(p.plan.openings),span=b.openingWallSpan(opening);
 b.selectHouseStyle('classic');const parts=b.windowAssembly(opening);assert.ok(parts.some(p=>p.part.startsWith('glazing-bar-')));const g=b.sceneJoinedBoxes(THREE,parts,{W:p.site.width,D:p.site.depth});g.computeBoundingBox();const axis=span.o==='h'?'x':'z',offset=span.o==='h'?p.site.width/2:p.site.depth/2;assert.ok(Math.abs(g.boundingBox.min[axis]-(span.a-offset))<1e-5);assert.ok(Math.abs(g.boundingBox.max[axis]-(span.b-offset))<1e-5);assert.equal(JSON.stringify(p.plan.openings),original);
 b.selectHouseStyle('minimal');assert.equal(b.windowAssembly(opening).some(p=>p.part.startsWith('glazing-bar-')),false);
});

test('a facade projection cannot cross a concave parcel notch',()=>{
 const b=client(),p=b.state.project;p.site.useParcelGeometry=true;p.site.lotMode='custom';p.site.setbackFront=p.site.setbackRear=p.site.setbackSide=0;
 const points=[{x:0,y:0},{x:2,y:0},{x:2,y:1.8},{x:3,y:1.8},{x:3,y:0},{x:9,y:0},{x:9,y:22},{x:0,y:22}];b.parcelGeometry=()=>({points,frontEdge:0,rearEdges:[6]});const source=fs.readFileSync('src/76_architecture.js','utf8');vm.runInNewContext(source.slice(source.indexOf('BMH.pointInParcel='),source.indexOf('const architectureRoomValid=')),{BMH:b});
 b.selectHouseStyle('tropical');const parts=b.facadeComponents();assert.ok(parts.length>0);for(const q of parts)assert.equal(b.roomInsideParcel({x:q.x,y:q.z,w:q.w,h:q.d}),true,q.kind);
 assert.equal(b.roomInsideParcel({x:1.95,y:1.5,w:1.1,h:.6}),false,'edge intersections also reject the notch between valid corners');
});

test('explicit roof dimensions and stair/elevator voids survive every facade change',()=>{
 const b=client(),p=b.state.project,d=b.measuredDesignSettings();d.roof={...d.roof,type:'mono',pitchDeg:17,overhang:.11,ridge:'width'};p.site.floorHeight=3.8;const plan=JSON.stringify(p.plan),holes=p.plan.rooms.filter(r=>['stairs','elevator'].includes(r.type)).map(r=>[r.id,r.floor,JSON.stringify(b.slabPanels(r,b.stairFloorHoles(r.floor)))]);
 for(const id of ['modern','indochine','tudor']){b.selectHouseStyle(id);b.facadeComponents();assert.equal(b.roofDesignSpec().type,'mono');assert.equal(b.roofDesignSpec().pitchDeg,17);assert.equal(b.roofDesignSpec().overhang,.11);assert.equal(JSON.stringify(p.plan),plan);assert.deepEqual(p.plan.rooms.filter(r=>['stairs','elevator'].includes(r.type)).map(r=>[r.id,r.floor,JSON.stringify(b.slabPanels(r,b.stairFloorHoles(r.floor)))]),holes);}
});
