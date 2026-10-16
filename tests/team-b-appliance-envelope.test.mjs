import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as BaseThree from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const THREE={...BaseThree,RoundedBoxGeometry};
test('fridge has enamel doors, measured bounds and a consistent rotatable front',()=>{
 const BMH={};vm.runInNewContext(fs.readFileSync(process.env.BMH_ASSET_SOURCE||'src/43_scene_assets.js','utf8'),{BMH,console});
 BMH.sceneSurfaceUvs=()=>{};
 const m={};for(const key of ['wood','white','dark','metal'])m[key]=new THREE.MeshStandardMaterial({name:key});
 for(const d of [{w:.7,h:1.8,d:.7},{w:.9,h:2.1,d:.8}]){
  const root=BMH.createRoomAsset('kitchenFridge',d,THREE,m);
  const doors=root.children.filter(o=>/^(freezer-door|refrigerator-door)$/.test(o.userData.kind));
  assert.equal(doors.length,2);assert.ok(doors.every(o=>o.material===m.white));
  assert.ok(root.children.every(o=>o.material!==m.wood));
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
  for(const [actual,expected]of [[size.x,d.w],[size.y,d.h],[size.z,d.d],[bounds.min.y,0]])assert.ok(Math.abs(actual-expected)<1e-6);
  const original=root.clone();const pivot=new THREE.Group();pivot.add(root);
  for(const angle of [0,37,90,180,270]){
   pivot.rotation.y=angle*Math.PI/180;pivot.updateMatrixWorld(true);
   const front=doors[0].getWorldPosition(new THREE.Vector3());const expected=new THREE.Vector3(0,0,1).applyAxisAngle(new THREE.Vector3(0,1,0),angle*Math.PI/180);
   assert.ok(front.dot(expected)>0);
  }
  assert.equal(root.userData.generic,true);
  root.traverse(o=>{if(o.isMesh){assert.ok(o.geometry.attributes.position.array.every(Number.isFinite));o.geometry.dispose();}});
 }
 Object.values(m).forEach(x=>x.dispose());
});
