import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {designClient} from './fixtures/design-client.mjs';

test('bedroom presentation frames the bed corners past tall furniture, preserving measured objects',()=>{
 const b=designClient({realHouse:true});
 const room={id:'review-bed',type:'bed',floor:0,x:.11,y:1.61,w:3.98,h:12.38};
 b.state.project.plan.rooms=[room];
 for(const rotation of [0,90,180,270]){
  room.furnitureRotation=rotation;const items=b.roomFurnitureLayout(room),before=JSON.stringify(items),view=b.bedroomPresentationCamera(room,items);
  assert.ok(view,'framed view '+rotation);assert.equal(JSON.stringify(items),before);
  const level=b.studioFloorLevel(0),eye=view.targetHeight+Math.sin(view.pitch)*view.distance;
  assert.ok(Math.abs(eye-1.65)<1e-8);assert.equal(b.interiorCameraIsClear(room,{...view.camera,height:eye},items),true);
  const bed=items.find(i=>/^bed(Double|Single)$/.test(i.model)),camera=new THREE.PerspectiveCamera(58,1,.05,140);
  camera.position.set(view.camera.x,eye,view.camera.y);camera.lookAt(view.target.x,view.targetHeight,view.target.y);camera.updateMatrixWorld();
  for(const [u,v]of [[.12,.12],[.88,.12],[.12,.88],[.88,.88]]){
   const point=new THREE.Vector3(bed.x+bed.w*u,view.targetHeight,bed.y+bed.d*v),screen=point.clone().project(camera);
   assert.ok(Math.abs(screen.x)<1&&Math.abs(screen.y)<1&&screen.z>-1&&screen.z<1,'bed fits viewport');
   const ray=new THREE.Ray(camera.position,point.clone().sub(camera.position).normalize());
   for(const item of items.filter(i=>i!==bed)){
    const bottom=level.slab+(item.base||0),box=new THREE.Box3(new THREE.Vector3(item.x,bottom,item.y),new THREE.Vector3(item.x+item.w,bottom+item.h,item.y+item.d));
    const hit=ray.intersectBox(box,new THREE.Vector3());assert.ok(!hit||hit.distanceTo(camera.position)>=point.distanceTo(camera.position),'unobstructed corner '+item.model);
   }
  }
 }
});
