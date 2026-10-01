import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as BaseThree from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const THREE={...BaseThree,RoundedBoxGeometry};

function client(){
  const BMH={state:{project:{site:{width:8,depth:8},plan:{rooms:[],openings:[]}},ui:{}},screen5:()=>'',screen7:()=>'',SCREENS:[],aiContext:()=>({}),esc:String};
  const context={BMH,document:{addEventListener(){}},window:{addEventListener(){},removeEventListener(){}},structuredClone,URL,setTimeout,clearTimeout,console,cancelAnimationFrame(){}};
  vm.runInNewContext(fs.readFileSync('src/43_scene_assets.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync('src/78_design_workflow.js','utf8'),context);
  return {b:BMH,context};
}

test('detailed furniture preserves every measured envelope and has finite smooth geometry',()=>{
  const {b}=client(),m=b.sceneAssetMaterials(THREE,new THREE.Scene());
  for(const [name,d] of Object.entries(b.FURNITURE_DIMENSIONS)){
    const root=b.createRoomAsset(name,d,THREE,m);assert.ok(root,name);root.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());
    for(const [actual,expected] of [[size.x,d.w],[size.y,d.h],[size.z,d.d],[bounds.min.y,0]])assert.ok(Math.abs(actual-expected)<1e-5,name);
    let meshes=0;root.traverse(o=>{if(!o.isMesh)return;meshes++;assert.ok(o.geometry.attributes.position.array.every(Number.isFinite),name);assert.ok(o.geometry.attributes.normal.array.every(Number.isFinite),name);});
    assert.ok(meshes>1,name);assert.equal(root.userData.generic,true);assert.equal(root.userData.source,'parametric');
  }
  assert.equal(b.createRoomAsset('unknown',{w:1,h:1,d:1},THREE,m),null);
  assert.equal(b.createRoomAsset('table',{w:0,h:1,d:1},THREE,m),null);
});

test('the detailed model uses the shared rotated placements and retains drawing footprints',()=>{
  const {b}=client();b.finishPalette=()=>({wall:'#ded8c9',accent:'#806549',fabric:'#a7b39a'});
  for(const type of ['living','bed','kitchen','bath'])for(const rotation of [0,90,180,270]){
    const room={id:'r',floor:0,type,x:1,y:1,w:5,h:5,furnitureRotation:rotation};b.state.project.plan.rooms=[room];
    const scene=new THREE.Scene(),before=JSON.stringify(b.state.project.plan),items=b.roomFurnitureLayout(room);
    b.addRoomSceneFurniture(room,.14,THREE,scene,{},b.state.project.site);
    const groups=scene.children.filter(o=>o.userData.kind==='furniture');assert.equal(groups.length,items.length);assert.equal(new Set(groups.map(g=>g.name)).size,items.length);assert.equal(JSON.stringify(b.state.project.plan),before);
    for(const group of groups){const i=group.userData.placement;group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group);
      assert.ok(Math.abs(bounds.min.x-(i.x-4))<1e-5,group.name);assert.ok(Math.abs(bounds.min.z-(i.y-4))<1e-5,group.name);
      assert.ok(Math.abs(bounds.max.x-(i.x+i.w-4))<1e-5,group.name);assert.ok(Math.abs(bounds.max.z-(i.y+i.d-4))<1e-5,group.name);
      assert.match(b.furnitureSvg(room),new RegExp(i.model));assert.equal(group.userData.roomId,room.id);
    }
  }
});

test('surface texture scale remains in metres across differently sized adjoining slabs',()=>{
  const {b}=client(),material=new THREE.MeshStandardMaterial();material.userData.surfaceScale=[.6,.6];
  const value=(width,x)=>{const g=new THREE.BoxGeometry(width,.14,2);b.sceneSurfaceUvs(g,material,{x,y:.07,z:1});const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;const points=[];for(let i=0;i<p.count;i++)if(n.getY(i)>.99)points.push({x:p.getX(i)+x,z:p.getZ(i)+1,u:uv.getX(i),v:uv.getY(i)});return points;};
  const left=value(2,1),right=value(4,4);
  for(const p of [...left,...right]){assert.ok(Math.abs(p.u-p.x/.6)<1e-5);assert.ok(Math.abs(p.v-p.z/.6)<1e-5);}
  const a=left.find(p=>p.x===2&&p.z===0),c=right.find(p=>p.x===2&&p.z===0);assert.ok(a&&c);assert.equal(a.u,c.u);assert.equal(a.v,c.v);
});

test('surface channels keep colour separate from relief and roughness across finish changes',()=>{
 const {b,context}=client();context.document.createElement=()=>{const canvas={};canvas.getContext=()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:p=>{canvas.pixels=p.data;}});return canvas;};
 const scene=new THREE.Scene(),wood=b.sceneAssetMaterials(THREE,scene,{surface:'wood'}),stone=b.sceneAssetMaterials(THREE,scene,{surface:'stone'});
 assert.equal(wood.floor,wood.plank);assert.equal(stone.floor,stone.floorStone);assert.notEqual(wood,stone);assert.equal(wood.plank.map,stone.plank.map);
 for(const m of [wood.plank,wood.slattedWood,stone.floorStone,wood.fabric]){assert.equal(m.map.colorSpace,THREE.SRGBColorSpace);assert.equal(m.bumpMap.colorSpace,THREE.NoColorSpace);assert.equal(m.roughnessMap.colorSpace,THREE.NoColorSpace);assert.notEqual(m.map,m.bumpMap);assert.notEqual(m.bumpMap,m.roughnessMap);assert.notDeepEqual(m.map.image.pixels,m.roughnessMap.image.pixels);assert.notDeepEqual(m.bumpMap.image.pixels,m.roughnessMap.image.pixels);}
 assert.deepEqual(Array.from(wood.plank.userData.surfaceScale),[1.6,.18]);assert.deepEqual(Array.from(stone.floorStone.userData.surfaceScale),[.8,.8]);
});

test('room camera selects clear space inside the room for all furniture orientations',()=>{
  const {b}=client();
  for(const type of ['living','bed','kitchen','bath'])for(const rotation of [0,90,180,270]){
    const r={id:'r',floor:0,type,x:1,y:1,w:5,h:5,furnitureRotation:rotation},items=b.roomFurnitureLayout(r),view=b.roomInteriorCamera(r,items);assert.ok(view,type);
    assert.ok(view.camera.x>=r.x+.12&&view.camera.x<=r.x+r.w-.12);assert.ok(view.camera.y>=r.y+.12&&view.camera.y<=r.y+r.h-.12);
    assert.equal(items.some(i=>view.camera.x>i.x-.08&&view.camera.x<i.x+i.w+.08&&view.camera.y>i.y-.08&&view.camera.y<i.y+i.d+.08),false);
  }
  assert.equal(b.roomInteriorCamera({x:0,y:0,w:1,h:1},[{x:0,y:0,w:1,d:1}]),null);
});

test('unavailable rounded geometry keeps a bounded detailed fallback',()=>{
  const {b}=client(),m=b.sceneAssetMaterials(BaseThree,new BaseThree.Scene()),d=b.FURNITURE_DIMENSIONS.bedDouble;
  const root=b.createRoomAsset('bedDouble',d,BaseThree,m),size=new BaseThree.Box3().setFromObject(root).getSize(new BaseThree.Vector3());assert.ok(Math.abs(size.x-d.w)<1e-5);assert.ok(Math.abs(size.y-d.h)<1e-5);assert.ok(Math.abs(size.z-d.d)<1e-5);
});

test('a bedroom camera sees past the wardrobe instead of filling the view with its side',()=>{
  const {b}=client(),room={id:'r',floor:0,type:'bed',x:0,y:0,w:3.4,h:3.68},items=b.roomFurnitureLayout(room),view=b.roomInteriorCamera(room,items);assert.ok(view);
  const wardrobe=items.find(i=>i.model==='bookcaseClosedWide');assert.ok(wardrobe);
  const origin=new THREE.Vector3(view.camera.x,1.15+view.distance*Math.sin(view.pitch),view.camera.y),target=new THREE.Vector3(view.target.x,1.15,view.target.y);
  const box=new THREE.Box3(new THREE.Vector3(wardrobe.x,0,wardrobe.y),new THREE.Vector3(wardrobe.x+wardrobe.w,wardrobe.h,wardrobe.y+wardrobe.d));
  const hit=new THREE.Ray(origin,target.clone().sub(origin).normalize()).intersectBox(box,new THREE.Vector3());assert.ok(!hit||hit.distanceTo(origin)>target.distanceTo(origin));
});

test('inside and overview cameras cannot reuse an image belonging to the other preset',()=>{
  const {b,context}=client();vm.runInNewContext(fs.readFileSync('src/45_studio3d.js','utf8'),context);b.state.ui.sceneFocus='room:r';b.state.ui.roomCamera='inside';const inside=b.cinematicSignature();b.state.ui.roomCamera='overview';assert.notEqual(b.cinematicSignature(),inside);b.state.ui.roomCamera='inside';assert.equal(b.cinematicSignature(),inside);
});

test('a narrow bathroom frames its fixtures instead of only the wall above them',()=>{
  const {b}=client(),room={id:'r',floor:0,type:'bath',x:.2,y:14,w:3.4,h:1.8};
  // A door can exclude the sink in this plan; the remaining equipment still
  // needs to be visible when entering the room.
  const items=b.roomFurnitureLayout(room).filter(i=>i.model!=='bathroomSink'),view=b.roomInteriorCamera(room,items);assert.ok(view);
  const camera=new THREE.PerspectiveCamera(58,1,.05,140);
  camera.position.set(view.camera.x,view.targetHeight+view.distance*Math.sin(view.pitch),view.camera.y);
  camera.lookAt(view.target.x,view.targetHeight,view.target.y);camera.updateMatrixWorld();
  for(const item of items){const p=new THREE.Vector3(item.x+item.w/2,item.h*.5,item.y+item.d/2).project(camera);assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z>-1&&p.z<1,item.model);}
  assert.ok(Math.abs(camera.position.y-1.55)<1e-5);
});

test('a bathroom keeps all fixtures and door clearance by choosing another placement',()=>{
 const {b}=client();b.clamp=(n,a,c)=>Math.max(a,Math.min(c,n));
 const source=fs.readFileSync('src/30_planner.js','utf8');vm.runInNewContext(source.slice(source.indexOf('BMH.openingGeometry ='),source.indexOf('BMH.neighborAcrossOpening =')),{BMH:b});
 for(const rotation of [0,90,180,270])for(const side of ['east','west','north','south']){
  const room={id:'bath',floor:0,type:'bath',x:1,y:1,w:3.4,h:1.8,furnitureRotation:rotation};b.state.project.plan.rooms=[room];b.state.project.plan.openings=[{roomId:room.id,floor:0,kind:'door',side,offset:.5,width:.9}];
  const before=JSON.stringify(b.state.project.plan),items=b.roomFurnitureLayout(room);assert.equal(items.length,3,side);assert.equal(new Set(items.map(i=>i.model)).size,3);const door=b.openingGeometry(b.state.project.plan.openings[0]);
  for(const i of items)assert.equal(i.x<door.x+.45&&i.x+i.w>door.x-.45&&i.y<door.y+.45&&i.y+i.d>door.y-.45,false,side+' '+i.model);
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++){const a=items[i],c=items[j];assert.equal(a.x<c.x+c.w+.05&&a.x+a.w>c.x-.05&&a.y<c.y+c.d+.05&&a.y+a.d>c.y-.05,false);}
  assert.equal(JSON.stringify(b.state.project.plan),before);
 }
});

test('scene cleanup disposes shared maps and environment targets exactly once',()=>{
  const {b,context}=client();vm.runInNewContext(fs.readFileSync('src/45_studio3d.js','utf8'),context);
  const scene=new THREE.Scene(),texture=new THREE.Texture(),material=new THREE.MeshStandardMaterial({map:texture,bumpMap:texture});const geometry=new THREE.BoxGeometry();
  scene.add(new THREE.Mesh(geometry,material),new THREE.Mesh(geometry,[material,material]));let textures=0,materials=0,geometries=0,environment=0,renderer=0;
  texture.addEventListener('dispose',()=>textures++);material.addEventListener('dispose',()=>materials++);geometry.addEventListener('dispose',()=>geometries++);scene.userData.environmentTarget={dispose(){environment++}};
  b.studio3d={scene,renderer:{dispose(){renderer++}}};b.disposeStudio3D();assert.deepEqual([textures,materials,geometries,environment,renderer],[1,1,1,1,1]);assert.equal(b.studio3d,null);
});
