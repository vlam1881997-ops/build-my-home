import test from 'node:test';
import assert from 'node:assert/strict';
import * as BaseThree from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {designClient} from './fixtures/design-client.mjs';
const THREE={...BaseThree,RoundedBoxGeometry};
test('washer front door and controls stay visible within the saved measured envelope',()=>{
 const B=designClient({realHouse:true}),materials={};
 for(const name of ['white','stone','metal','screen','dark'])materials[name]=new THREE.MeshStandardMaterial({name});
 const d=B.FURNITURE_DIMENSIONS.washingMachine,model=B.createRoomAsset('washingMachine',d,THREE,{...materials,collection:{}});
 model.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(model),size=bounds.getSize(new THREE.Vector3());
 for(const [axis,key]of [['x','w'],['y','h'],['z','d']])assert.ok(Math.abs(size[axis]-d[key])<1e-6);
 assert.ok(Math.abs(bounds.min.y)<1e-6);
 for(const material of [materials.screen,materials.dark]){
  const target=model.children.find(o=>o.material===material),center=new THREE.Box3().setFromObject(target).getCenter(new THREE.Vector3());
  const ray=new THREE.Raycaster(new THREE.Vector3(center.x,center.y,2),new THREE.Vector3(0,0,-1));
  assert.equal(ray.intersectObject(model,true)[0].object,target,'front ray reaches '+material.name+' before cabinet');
 }
});
