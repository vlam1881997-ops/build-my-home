import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as BaseThree from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const THREE={...BaseThree,RoundedBoxGeometry};

test('soft upholstery keeps finite geometry and its piping follows cushion rotations',()=>{
 const {b}=client(),m=b.sceneAssetMaterials(THREE,new THREE.Scene());
 for(const name of ['loungeDesignSofa','bedDouble']){
  const root=b.createRoomAsset(name,b.FURNITURE_DIMENSIONS[name],THREE,m);let count=0,triangles=0;
  root.traverse(o=>{if(!o.isMesh)return;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;if(o.userData.kind!=='upholstery')return;count++;assert.equal(o.geometry.type,'SphereGeometry');assert.ok(o.geometry.attributes.normal.array.every(Number.isFinite));const seam=o.children.find(c=>c.userData.kind==='upholstery-seam');assert.ok(seam);assert.equal(seam.parent,o);assert.equal(seam.position.length(),0);const before=seam.getWorldPosition(new THREE.Vector3());o.rotation.z+=.2;root.updateMatrixWorld(true);assert.ok(seam.getWorldPosition(new THREE.Vector3()).distanceTo(o.getWorldPosition(new THREE.Vector3()))<1e-7);assert.ok(before.length()>0);});
  assert.ok(count>=2);assert.ok(triangles<65000,'bounded furniture detail');
 }
});
test('interior collections change real furniture shapes within the same measured envelopes',()=>{
 const {b,context}=client();b.state.project.materials={finish:{rooms:{}}};b.finishPalette=()=>null;b.screen7=()=>'<section class="design-room-list">';vm.runInNewContext(fs.readFileSync('src/85_interior_collections.js','utf8'),context);
 const signatures=new Set();
 for(const c of b.INTERIOR_COLLECTIONS){
  const m=b.sceneAssetMaterials(THREE,new THREE.Scene(),c),geometry=[];
  for(const model of ['loungeDesignSofa','tableCoffee','bedDouble','cabinetTelevision','sideTable','floorLamp']){
   const d=b.FURNITURE_DIMENSIONS[model],root=b.createRoomAsset(model,d,THREE,m);root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3());let triangles=0;
   for(const [actual,expected]of [[size.x,d.w],[size.y,d.h],[size.z,d.d],[bounds.min.y,0]])assert.ok(Math.abs(actual-expected)<1e-5,c.id+' '+model);
   root.traverse(o=>{if(o.isMesh){assert.ok(o.geometry.attributes.normal.array.every(Number.isFinite));triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});assert.ok(triangles<65000,c.id+' '+model);geometry.push(triangles);
  }
  signatures.add(geometry.join(','));
 }
 assert.ok(signatures.size>=5,'collections have different meshes, not only paint');
});
test('a room collection changes finishes while preserving the approved plan, openings and selected product IDs',()=>{
 const {b,context}=client(),room={id:'living',floor:0,type:'living',x:0,y:0,w:5,h:4};b.state.project.plan.rooms=[room];b.state.project.materials={choices:{floor:'approved-sku'},finish:{rooms:{}}};b.finishPalette=id=>b.state.project.materials.finish.rooms[id];b.save=()=>{};vm.runInNewContext(fs.readFileSync('src/85_interior_collections.js','utf8'),context);
 const before=JSON.stringify(b.state.project.plan);assert.equal(b.applyInteriorCollection('soft-curves',room.id),true);assert.equal(JSON.stringify(b.state.project.plan),before);assert.equal(b.state.project.materials.choices.floor,'approved-sku');assert.equal(b.finishPalette(room.id).shape,'curved');assert.equal(b.interiorCollection(room.id).id,'soft-curves');assert.equal(b.applyInteriorCollection('unknown',room.id),false);assert.equal(b.applyInteriorCollection('warm-oak','missing'),false);
 const saved=structuredClone(b.state.project.materials.finish);b.state.project.materials.finish=saved;assert.equal(b.interiorCollection(room.id).id,'soft-curves');
});
test('photographed material loads retain colour/data channels and ignore a disposed scene',async()=>{
 const {b,context}=client();context.document.createElementNS=()=>({});context.document.createElement=()=>{const canvas={};canvas.getContext=()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}});return canvas;};
 const callbacks=[],images={};class Loader{load(url,done){callbacks.push({url,done});}}
 const scene=new THREE.Scene(),m=b.sceneAssetMaterials({...THREE,TextureLoader:Loader},scene,{surface:'wood'}),before=m.plank.map.image;
 for(const c of callbacks){const loaded=new THREE.Texture();loaded.image=images[c.url]={width:512,height:512};c.done(loaded);}await Promise.all(scene.userData.surfaceLoads);assert.notEqual(m.plank.map.image,before);assert.equal(m.plank.map.colorSpace,THREE.SRGBColorSpace);assert.equal(m.plank.normalMap.colorSpace,THREE.NoColorSpace);assert.equal(m.plank.roughnessMap.colorSpace,THREE.NoColorSpace);assert.equal(m.plank.map.userData.license,'CC0-1.0');
 callbacks.length=0;const stale=new THREE.Scene(),material=b.sceneAssetMaterials({...THREE,TextureLoader:Loader},stale),original=material.wood.map.image;stale.userData.disposed=true;for(const c of callbacks){const loaded=new THREE.Texture();loaded.image={width:512};c.done(loaded);}assert.equal((await Promise.all(stale.userData.surfaceLoads)).every(x=>x===false),true);assert.equal(material.wood.map.image,original);
});
test('bundled photographed maps have recorded CC0 provenance and a bounded 512px resolution',()=>{
 const manifest=JSON.parse(fs.readFileSync('assets/interior/texture-provenance.json','utf8'));assert.equal(manifest.license,'CC0-1.0');assert.equal(manifest.assets.length,3);let bytes=0;
 for(const asset of manifest.assets){assert.match(asset.source,/^https:\/\/polyhaven.com\/a\//);assert.equal(asset.files.length,3);for(const file of asset.files){const data=fs.readFileSync(file.file);assert.equal(data.readUInt32BE(16),512);assert.equal(data.readUInt32BE(20),512);assert.match(file.sourceUrl,/^https:\/\/dl.polyhaven.org\//);bytes+=data.length;}}
 assert.ok(bytes<2000000,'all texture maps stay under 2MB');
});
test('slow material downloads settle on the fallback, deduplicate photographs and ignore late completion',async()=>{
 const {b,context}=client();b.SCENE_TEXTURE_TIMEOUT=10;context.document.createElementNS=()=>({});context.document.createElement=()=>({getContext:()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(){}})});
 const callbacks=[];class Loader{load(url,done){callbacks.push({url,done});}}
 const scene=new THREE.Scene(),m=b.sceneAssetMaterials({...THREE,TextureLoader:Loader},scene),before=m.wood.map.image;
 assert.equal(callbacks.length,9,'wood and vertical wood share the decoded photograph');
 assert.equal(new Set(callbacks.map(c=>c.url)).size,9);
 assert.ok((await Promise.all(scene.userData.surfaceLoads)).every(ok=>ok===false));
 for(const {done}of callbacks){const loaded=new THREE.Texture();loaded.image={width:512};done(loaded);}
 await Promise.resolve();assert.equal(m.wood.map.image,before);assert.equal(scene.userData.surfaceCancels.size,0);
});
test('oak collection tables have an oval footprint rather than only rounded rectangle edges',()=>{
 const {b}=client(),scene=new THREE.Scene(),m=b.sceneAssetMaterials(THREE,scene,{table:'oak'}),root=b.createRoomAsset('tableCoffee',b.FURNITURE_DIMENSIONS.tableCoffee,THREE,m);
 const top=root.children.find(o=>o.userData.kind==='oval-tabletop');assert.ok(top);top.geometry.computeBoundingBox();const bounds=top.geometry.boundingBox,p=top.geometry.attributes.position;
 // A corner must be outside an ellipse while an ordinary rounded box fills it.
 for(let i=0;i<p.count;i++)assert.ok(Math.abs(p.getX(i))<bounds.max.x*.93||Math.abs(p.getZ(i))<bounds.max.z*.93);
});
test('full-height drapery follows actual openings and clears the sofa behind all four orientations',()=>{
 const {b}=client();b.projectLevels=()=>({slab:.14,clearHeight:3.06});
 for(const side of ['north','south','west','east']){
  const r={id:'r',floor:0,type:'living',x:1,y:1,w:5,h:5};b.state.project.plan.rooms=[r];b.state.project.plan.openings=[{id:'w',roomId:'r',kind:'window',side,width:1.6,height:1.4,sill:.9}];
  b.openingWallSpan=()=>({o:['north','south'].includes(side)?'h':'v',a:2,b:3.6,c:{north:1,south:6,west:1,east:6}[side]});const scene=new THREE.Scene();b.addWindowDrapery(THREE,scene,r,0,b.state.project.site);
  const curtains=scene.children.filter(o=>o.geometry.type==='PlaneGeometry');assert.equal(curtains.length,2);for(const curtain of curtains){const box=new THREE.Box3().setFromObject(curtain);assert.ok(Math.abs(box.min.y-.17)<1e-5);assert.ok(Math.abs(box.max.y-3.08)<1e-5);const axis=['north','south'].includes(side)?'z':'x',inward=['north','west'].includes(side)?1:-1,wall={north:1,south:6,west:1,east:6}[side]-4;for(const n of [box.min[axis],box.max[axis]])assert.ok((n-wall)*inward>=.11-1e-5&&(n-wall)*inward<.17);}
 }
});

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

test('foliage stays inside its measured envelope with valid shaded leaves and a bounded mesh',()=>{
 const {b}=client(),material=new THREE.MeshStandardMaterial({color:'#79935a'}),dimensions={w:.38,h:.7,d:.38};
 const plant=b.createSceneFoliage(THREE,dimensions,material),repeat=b.createSceneFoliage(THREE,dimensions,material);
 const bounds=new THREE.Box3().setFromObject(plant),size=bounds.getSize(new THREE.Vector3());
 for(const [actual,expected] of [[size.x,dimensions.w],[size.y,dimensions.h],[size.z,dimensions.d],[bounds.min.y,0]])assert.ok(Math.abs(actual-expected)<1e-6);
 const {position,normal,color}=plant.geometry.attributes;assert.ok(position.count/3<1200);assert.ok(color.count===position.count);assert.ok(new Set(color.array).size>20);
 for(let i=0;i<normal.count;i++)assert.ok(Math.abs(Math.hypot(normal.getX(i),normal.getY(i),normal.getZ(i))-1)<1e-5);
 assert.deepEqual(position.array,repeat.geometry.attributes.position.array);assert.ok(plant.material.vertexColors);assert.equal(plant.material.side,THREE.DoubleSide);assert.equal(material.vertexColors,false);assert.equal(plant.userData.generic,true);
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
 for(const m of [wood.plank,wood.slattedWood,stone.floorStone,wood.fabric]){assert.equal(m.map.colorSpace,THREE.SRGBColorSpace);assert.equal(m.normalMap.colorSpace,THREE.NoColorSpace);assert.equal(m.roughnessMap.colorSpace,THREE.NoColorSpace);assert.notEqual(m.map,m.normalMap);assert.notEqual(m.normalMap,m.roughnessMap);assert.notDeepEqual(m.map.image.pixels,m.roughnessMap.image.pixels);assert.notDeepEqual(m.normalMap.image.pixels,m.roughnessMap.image.pixels);}
 assert.deepEqual(Array.from(wood.plank.userData.surfaceScale),[1.7,1.7]);assert.deepEqual(Array.from(stone.floorStone.userData.surfaceScale),[.8,.8]);
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
test('daylight, night, exploded views and renderer revisions cannot reuse the same room image',()=>{
 const {b,context}=client();vm.runInNewContext(fs.readFileSync('src/45_studio3d.js','utf8'),context);b.state.ui.sceneFocus='room:r';b.state.ui.sceneTheme='day';const day=b.cinematicSignature();
 b.state.ui.sceneTheme='night';assert.notEqual(b.cinematicSignature(),day);b.state.ui.sceneTheme='day';assert.equal(b.cinematicSignature(),day);
 b.state.ui.sceneExploded=true;assert.notEqual(b.cinematicSignature(),day);b.state.ui.sceneExploded=false;assert.equal(b.cinematicSignature(),day);
 b.ARCH_RENDER_REVISION='new-materials';assert.notEqual(b.cinematicSignature(),day);
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


test('stair presentation keeps all measured tops and rotates coherent flights without tall wood blocks',()=>{
 const {b,context}=client();b.state.project.site.floors=3;b.projectLevels=()=>({floorHeight:3.4,floors:3});b.stairSpec=()=>({});b.architectDocument=()=>({levels:[],items:[]});b.cinematicSignature=()=>'';vm.runInNewContext(fs.readFileSync('src/79_stair_design.js','utf8'),context);
 for(const direction of [0,90,180,270]){
  const r={id:'s',type:'stairs',floor:0,x:1,y:1,w:4,h:4,stairDirection:direction},scene=new THREE.Scene();b.state.project.plan.rooms=[r];const before=JSON.stringify(r),parts=b.stairGeometry(r);b.addRoomSceneFurniture(r,.14,THREE,scene,{},b.state.project.site);
  const treads=scene.children.filter(m=>m.userData.kind==='stair-tread');assert.equal(treads.length,parts.length);for(let i=0;i<parts.length;i++){const p=parts[i],m=treads[i];assert.ok(Math.abs(m.position.y+m.geometry.parameters.height/2-.14-p.base-p.h)<1e-6);assert.ok(m.geometry.parameters.height<=.035);assert.ok(Math.abs(m.position.x+4-p.x-p.w/2)<1e-6);assert.ok(Math.abs(m.position.z+4-p.y-p.d/2)<1e-6);}
  assert.equal(scene.children.filter(m=>m.userData.kind==='stair-flight').length,2);assert.ok(scene.children.some(m=>m.userData.kind==='stair-guard'));for(const m of scene.children)assert.ok(m.geometry.attributes.position.array.every(Number.isFinite));assert.equal(JSON.stringify(r),before);
  const top=new THREE.Scene();b.addRoomSceneFurniture({...r,floor:2},.14,THREE,top,{},b.state.project.site);assert.equal(top.children.length,0);
 }
});


test('detailed car retains its actual vehicle envelope in both garage orientations',()=>{
 const {b}=client(),before=JSON.stringify(b.state.project.plan);for(const [w,h] of [[3,5.5],[5.5,3]]){const r={id:'g',type:'garage',x:1,y:1,w,h},scene=new THREE.Scene(),v=b.garageVehicle(r);assert.equal(b.addGarageVehicle(r,.14,THREE,scene,b.state.project.site),true);const g=scene.children[0];g.updateMatrixWorld(true);const size=new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3());assert.ok(Math.abs(size.x-v.w)<1e-5);assert.ok(Math.abs(size.z-v.d)<1e-5);assert.ok(Math.abs(size.y-1.45)<1e-5);assert.ok(g.children.length>10);}
 assert.equal(b.addGarageVehicle({id:'tiny',x:0,y:0,w:1,h:1},.14,THREE,new THREE.Scene(),b.state.project.site),false);assert.equal(JSON.stringify(b.state.project.plan),before);
});

test('matte paint and upholstery have subtle relief rather than coarse random surface normals',()=>{
 const {b,context}=client();context.document.createElement=()=>{const canvas={};canvas.getContext=()=>({createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:p=>{canvas.pixels=p.data;}});return canvas;};const materials=b.sceneAssetMaterials(THREE,new THREE.Scene());
 for(const material of [materials.wall,materials.fabric,materials.linen]){const pixels=material.normalMap.image.pixels;for(let i=0;i<pixels.length;i+=4){assert.ok(pixels[i+2]>=253);assert.ok(Math.abs(pixels[i]-128)<=14);assert.ok(Math.abs(pixels[i+1]-128)<=14);}}
 assert.equal(materials.stone.map.userData.kind,'stone');assert.equal(materials.wall.map.userData.kind,'plaster');
});
