import test from 'node:test';
import assert from 'node:assert/strict';
import * as BaseThree from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {modernReference} from './team-b-modern-reference.mjs';
const THREE={...BaseThree,RoundedBoxGeometry};
test('Modern natural collection changes the measured render assets without changing plan, products or poses',()=>{
 const {B}=modernReference(),p=B.state.project,plan=JSON.stringify(p.plan),products=JSON.stringify(p.materials.choices),scene=new THREE.Scene();
 assert.equal(B.applyInteriorCollection('modern-natural'),true);
 assert.equal(JSON.stringify(p.plan),plan);assert.equal(JSON.stringify(p.materials.choices),products);
 const r=p.plan.rooms.find(r=>r.type==='living'),finish=B.finishPalette(r.id),m=B.sceneAssetMaterials(THREE,scene,finish);
 assert.equal(finish.collectionId,'modern-natural');assert.equal(finish.visualMaterials.floor,'oak-floor');assert.equal(finish.stoneVisualMaterial,'sand-travertine');assert.ok(m.fabric.isMeshPhysicalMaterial&&m.fabric.sheen>0);assert.equal(m.stone.userData.visualMaterial,'sand-travertine');
 for(const model of ['loungeDesignSofa','loungeChair','tableCoffee']){
  const d={...B.FURNITURE_DIMENSIONS[model]},root=B.createRoomAsset(model,d,THREE,m);root.updateMatrixWorld(true);
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3());
  for(const [actual,expected]of [[size.x,d.w],[size.y,d.h],[size.z,d.d],[box.min.y,0]])assert.ok(Math.abs(actual-expected)<1e-5,model+' approved envelope');
  let triangles=0;root.traverse(o=>{if(o.isMesh){assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));assert.ok(o.geometry.attributes.normal.array.every(Number.isFinite));triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});assert.ok(triangles<65000,model+' complexity');
  if(model==='loungeDesignSofa')assert.equal(root.children.filter(o=>o.userData.kind==='upholstery').length,8,'three seat/back cushions and two pillows');
 }
 const saved=structuredClone(p.materials.finish);p.materials.finish=saved;assert.equal(B.interiorCollection(r.id).id,'modern-natural');assert.equal(JSON.stringify(p.plan),plan);
});

test('focused room shadows follow the same sun vector and tighter measured room bounds',()=>{
 const {B}=modernReference(),sun=new THREE.DirectionalLight(),room={x:1,y:2,w:3.58,h:5.232};
 assert.equal(B.configureRoomShadows(THREE,sun,room,{width:5,depth:20}),true);
 const direction=sun.position.clone().sub(sun.target.position);assert.deepEqual(direction.toArray(),[-10,18,-12]);
 assert.ok(sun.shadow.camera.right<7&&sun.shadow.normalBias<.01);assert.equal(sun.shadow.camera.left,-sun.shadow.camera.right);
 assert.equal(B.configureRoomShadows(THREE,sun,null,{width:5,depth:20}),false);
});

test('presentation daylight follows a real opening while retaining the measured room',()=>{
 const {B}=modernReference(),r=B.state.project.plan.rooms.find(r=>r.type==='living'),before=JSON.stringify(B.state.project.plan),sun=new THREE.DirectionalLight();
 assert.equal(B.configureRoomShadows(THREE,sun,r,B.state.project.site),true);
 const chosen=B.state.project.plan.openings.find(o=>o.id===sun.userData.presentationLighting.openingId);
 assert.ok(chosen&&chosen.kind==='window'&&chosen.roomId===r.id);assert.equal(sun.userData.presentationLighting.solarStudy,false);
 const direction=sun.position.clone().sub(sun.target.position);assert.ok(direction.y>0);assert.equal(JSON.stringify(B.state.project.plan),before);
});

test('actual exported pixels retain matte cloth, artwork and green vertex colours',{skip:!process.env.BMH_REVIEW_SCENE},async()=>{
 const fs=await import('node:fs'),path=await import('node:path'),{createCanvas,loadImage}=await import('@napi-rs/canvas');
 const file=process.env.BMH_REVIEW_SCENE,s=JSON.parse(fs.readFileSync(file,'utf8')),m=s.materials.find(m=>m.slot==='fabric');
 assert.equal(s.planPreserved,true);assert.ok(s.meshes.some(o=>o.attributes.color&&o.attributes.color.some((v,i)=>i%3===1&&v>o.attributes.color[i-1])));
 assert.ok(s.materials.some(m=>m.maps.color?.width===384&&m.maps.color?.height===512),'actual production artwork');
 const pixels=async c=>{const image=await loadImage(fs.readFileSync(path.join(path.dirname(file),m.maps[c].file))),canvas=createCanvas(image.width,image.height),ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,image.width,image.height).data;};
 const rough=await pixels('roughness'),normal=await pixels('normal');let avg=0,variance=0;
 for(let i=0;i<rough.length;i+=4)avg+=rough[i]/(rough.length/4);
 assert.ok(avg>225&&avg<250,'cloth roughness stays matte');
 for(let i=0;i<normal.length;i+=4)variance+=(normal[i]-127.5)**2/(normal.length/4);
 assert.ok(Math.sqrt(variance)>8,'woven normal relief survives photographic map load');
});
