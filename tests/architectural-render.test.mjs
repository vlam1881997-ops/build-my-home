import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as BaseThree from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
const THREE={...BaseThree,RoundedBoxGeometry};
function client(){
 const b={state:{ui:{sceneFocus:'room:r',roomCamera:'inside'},project:{site:{width:5,depth:8},plan:{rooms:[{id:'r',type:'living',floor:0,x:0,y:0,w:5,h:4}],openings:[]}}},$:()=>null,save(){},mountStudio3D:async()=>{},disposeStudio3D(){},projectLevels:()=>({floorHeight:3.4,slab:.14,ceilingDrop:.2}),stairFloorHoles:()=>[],slabPanels:r=>[{x:r.x,y:r.y,w:r.w,d:r.h}]};
 const context={BMH:b,document:{addEventListener(){},querySelectorAll:()=>[]},cancelAnimationFrame(){},console};vm.runInNewContext(fs.readFileSync('src/46_architectural_render.js','utf8'),context);return b;
}
test('render snapshots bake rotated leaves without changing measured dimensions or the editor mesh',()=>{
 const b=client(),mesh=new THREE.Mesh(new THREE.BoxGeometry(.9,2.1,.045),new THREE.MeshStandardMaterial());mesh.position.set(2,1.05,3);mesh.rotation.y=.7;mesh.updateMatrixWorld(true);const before=Array.from(mesh.geometry.attributes.position.array),expected=new THREE.Box3().setFromObject(mesh),geometry=b.renderMeshGeometry(THREE,mesh);geometry.computeBoundingBox();
 assert.ok(geometry.boundingBox.min.distanceTo(expected.min)<.004);assert.ok(geometry.boundingBox.max.distanceTo(expected.max)<.004);assert.deepEqual(Array.from(mesh.geometry.attributes.position.array),before);assert.ok(geometry.attributes.normal.array.every(Number.isFinite));
});
test('cutaway walls are solid at both cut edges and obey every clipping plane',()=>{
 const b=client(),material=new THREE.MeshStandardMaterial();material.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),.5),new THREE.Plane(new THREE.Vector3(1,0,0),0)];const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,2,.2),material);mesh.updateMatrixWorld();const result=b.renderMeshGeometry(THREE,mesh),p=result.attributes.position,n=result.attributes.normal;let upperCap=0,sideCap=0;
 for(let i=0;i<p.count;i++){const point=new THREE.Vector3().fromBufferAttribute(p,i);assert.ok(material.clippingPlanes.every(plane=>plane.distanceToPoint(point)>=-1e-6));if(Math.abs(p.getY(i)-.5)<1e-6&&n.getY(i)>.99)upperCap++;if(Math.abs(p.getX(i))<1e-6&&n.getX(i)<-.99)sideCap++;}
 assert.ok(upperCap>=3);assert.ok(sideCap>=3);assert.equal(material.clippingPlanes.length,2);
});
test('inside photographs preserve finishes and restore the measured ceiling; inspection keeps it open',()=>{
 const b=client(),scene=new THREE.Scene(),map=new THREE.Texture(),wall=new THREE.MeshStandardMaterial({color:'#ded9cb',map}),glass=new THREE.MeshPhysicalMaterial({transparent:true,opacity:.28,color:'#dde5df'});scene.add(new THREE.Mesh(new THREE.BoxGeometry(1,1,1),wall),new THREE.Mesh(new THREE.BoxGeometry(.9,1.4,.02),glass));const parent=new THREE.Group();parent.visible=false;parent.add(new THREE.Mesh(new THREE.BoxGeometry(),wall));scene.add(parent);
 const before=JSON.stringify(b.state.project.plan),copy=b.architecturalRenderScene(THREE,scene),mesh=copy.children.find(o=>o.isMesh&&!o.userData.kind);assert.equal(mesh.material.map,map);assert.notEqual(mesh.material,wall);assert.equal(mesh.material.color.getHex(),wall.color.getHex());assert.equal(copy.children.filter(o=>o.userData.kind==='ceiling-slab').length,1);const ceiling=copy.children.find(o=>o.userData.kind==='ceiling-slab');assert.ok(Math.abs(ceiling.position.y-3.27)<1e-8);
 const tracedGlass=copy.children.find(o=>o.isMesh&&o.material.transmission);assert.equal(tracedGlass.material.thickness,0);assert.equal(glass.transmission,0);assert.equal(JSON.stringify(b.state.project.plan),before);b.state.ui.roomCamera='overview';assert.equal(b.architecturalRenderScene(THREE,scene).children.some(o=>o.userData.kind==='ceiling-slab'),false);
});
test('cancelling a render releases snapshots once and keeps editor textures alive',()=>{
 const b=client(),scene=new THREE.Scene(),map=new THREE.Texture(),material=new THREE.MeshStandardMaterial({map}),geometry=new THREE.BoxGeometry();scene.add(new THREE.Mesh(geometry,material));scene.userData.ownedMaterials=new Set([material]);let textures=0,materials=0,geometries=0;map.addEventListener('dispose',()=>textures++);material.addEventListener('dispose',()=>materials++);geometry.addEventListener('dispose',()=>geometries++);b.studio3d={archRender:{scene,raf:1}};b.disposeArchitecturalRender();b.disposeArchitecturalRender();assert.deepEqual([textures,materials,geometries],[0,1,1]);assert.equal(b.studio3d.archRender,null);
});
test('unsupported devices return to editable 3D without altering the plan',async()=>{
 const b=client();let renders=0;b.cinematicSignature=()=> 'current';b.studio3d={renderer:{capabilities:{isWebGL2:false}},renderFrame(){renders++}};const before=JSON.stringify(b.state.project.plan);assert.equal(await b.startArchitecturalRender(),false);assert.equal(b.state.ui.renderMode,'interactive');assert.equal(renders,1);assert.equal(JSON.stringify(b.state.project.plan),before);
});

test('already rounded furniture keeps its authored shape instead of the base box constructor parameters',()=>{
 const b=client(),mesh=new THREE.Mesh(new THREE.RoundedBoxGeometry(2.1,.28,.82,2,.035),new THREE.MeshStandardMaterial());mesh.position.set(1,.3,2);mesh.updateMatrixWorld();const expected=new THREE.Box3().setFromObject(mesh),copy=b.renderMeshGeometry(THREE,mesh);copy.computeBoundingBox();assert.ok(copy.boundingBox.min.distanceTo(expected.min)<1e-6);assert.ok(copy.boundingBox.max.distanceTo(expected.max)<1e-6);assert.equal(copy.attributes.position.count,mesh.geometry.attributes.position.count);
});
