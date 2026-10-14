import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as BaseThree from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {PathTracingSceneGenerator} from 'three-gpu-pathtracer/src/core/PathTracingSceneGenerator.js';
const THREE={...BaseThree,RoundedBoxGeometry};
test('the pinned path tracer retains slab face finishes and the materials of following walls and glass',()=>{
 const b=client();b.state.ui.sceneFocus='all';const source=new THREE.Scene(),body=new THREE.MeshStandardMaterial({color:'#e2ddd3'}),top=new THREE.MeshStandardMaterial({color:'#8c592c'}),wall=new THREE.MeshStandardMaterial({color:'#e8e4dc'}),glass=new THREE.MeshPhysicalMaterial({transmission:.72});
 for(const [x,material]of [[0,[body,body,top,body,body,body]],[10,wall],[20,glass]]){const mesh=new THREE.Mesh(new THREE.BoxGeometry(2,.2,2),material);mesh.position.x=x;mesh.userData.kind=x===0?'floor-slab':x===10?'wall':'window-glass';source.add(mesh);}
 const photo=b.architecturalRenderScene(THREE,source),generator=new PathTracingSceneGenerator(photo);generator.generateBVH=false;const {geometry,materials}=generator.generate(),position=geometry.attributes.position,indices=geometry.attributes.materialIndex;
 assert.ok(photo.children.filter(o=>o.isMesh).every(o=>!Array.isArray(o.material)));
 const used=new Set(Array.from(geometry.index.array));assert.ok(used.size>0);for(const i of used){const m=materials[indices.getX(i)],x=position.getX(i);if(x>15)assert.equal(m.transmission,.72);else if(x>5)assert.equal(m.color.getHex(),wall.color.getHex());else assert.equal(m.color.getHex(),position.getY(i)>.09&&geometry.attributes.normal.getY(i)>.9?top.color.getHex():body.color.getHex());}
 const model=b.architecturalRenderScene(THREE,source,{purpose:'model'}),slab=model.children.find(o=>o.userData.kind==='floor-slab');assert.equal(slab.material.length,6);assert.equal(slab.geometry.groups.length,6);assert.equal(slab.material[2].color.getHex(),top.color.getHex());
 assert.equal(source.children[0].geometry.groups.length,6);assert.equal(source.children[0].material[2],top);
});
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
 const b=client();b.state.ui.renderQuality='fine';let renders=0;b.cinematicSignature=()=> 'current';b.studio3d={renderer:{capabilities:{isWebGL2:false}},renderFrame(){renders++}};const before=JSON.stringify(b.state.project.plan);assert.equal(await b.startArchitecturalRender(),false);assert.equal(b.state.ui.renderMode,'interactive');assert.equal(renders,1);assert.equal(JSON.stringify(b.state.project.plan),before);
});

test('already rounded furniture keeps its authored shape instead of the base box constructor parameters',()=>{
 const b=client(),mesh=new THREE.Mesh(new THREE.RoundedBoxGeometry(2.1,.28,.82,2,.035),new THREE.MeshStandardMaterial());mesh.position.set(1,.3,2);mesh.updateMatrixWorld();const expected=new THREE.Box3().setFromObject(mesh),copy=b.renderMeshGeometry(THREE,mesh);copy.computeBoundingBox();assert.ok(copy.boundingBox.min.distanceTo(expected.min)<1e-6);assert.ok(copy.boundingBox.max.distanceTo(expected.max)<1e-6);assert.equal(copy.attributes.position.count,mesh.geometry.attributes.position.count);
});

test('daylight helpers follow edited opening dimensions and illuminate towards the measured room',()=>{
 const b=client(),r=b.state.project.plan.rooms[0];b.openingWallSpan=o=>({o:['north','south'].includes(o.side)?'h':'v',c:{north:r.y,south:r.y+r.h,west:r.x,east:r.x+r.w}[o.side],a:1,b:1+o.width});b.state.project.plan.openings=['north','south','west','east'].map((side,i)=>({id:'window'+i,roomId:r.id,floor:0,kind:'window',side,width:1.2+i*.1,height:1.4,sill:.9}));const before=JSON.stringify(b.state.project.plan),scene=b.architecturalRenderScene(THREE,new THREE.Scene()),lights=scene.children.filter(l=>l.userData.openingId);
 assert.equal(lights.length,4);scene.updateMatrixWorld();for(const light of lights){const o=b.state.project.plan.openings.find(o=>o.id===light.userData.openingId),direction=new THREE.Vector3(0,0,-1).applyQuaternion(light.quaternion),centre=new THREE.Vector3(0,light.position.y,-2);assert.ok(Math.abs(light.width-o.width)<1e-8);assert.equal(light.height,o.height);assert.ok(Math.abs(light.position.y-1.74)<1e-6);assert.ok(direction.dot(centre.sub(light.position))>0);}
 assert.equal(JSON.stringify(b.state.project.plan),before);b.state.ui.sceneTheme='night';assert.equal(b.architecturalRenderScene(THREE,new THREE.Scene()).children.filter(l=>l.userData.openingId).length,0);
});

test('interior photographic light avoids duplicate tiny emitters while inspection retains the source lighting',()=>{
 const b=client(),source=new THREE.Scene(),fixture=new THREE.MeshStandardMaterial({emissive:'#f3c077',emissiveIntensity:.5});source.add(new THREE.Mesh(new THREE.CylinderGeometry(.17,.25,.2),fixture),new THREE.PointLight('#ffe2b5',2),new THREE.DirectionalLight('#ffffff',1.65));
 for(const theme of ['day','night']){b.state.ui.sceneTheme=theme;const copy=b.architecturalRenderScene(THREE,source);assert.equal(copy.children.some(o=>o.isPointLight||o.isDirectionalLight),false);assert.equal(copy.children.find(o=>o.isMesh&&!o.userData.kind).material.emissiveIntensity,0);assert.ok(copy.children.some(o=>o.isRectAreaLight));assert.equal(fixture.emissiveIntensity,.5);}
 b.state.ui.roomCamera='overview';const copy=b.architecturalRenderScene(THREE,source);assert.ok(copy.children.some(o=>o.isPointLight));assert.ok(copy.children.some(o=>o.isDirectionalLight));assert.equal(copy.children.find(o=>o.isMesh&&!o.userData.kind).material.emissiveIntensity,.5);
});

test('model exports retain measured vertices, glass, ceiling and inherited design IDs without photographic additions',()=>{
 const b=client();b.drawingRevision=()=> 'REV-MEASURED';const source=new THREE.Scene(),group=new THREE.Group();group.userData={roomId:'r',openingId:'door-1',fixtureId:'altar-1',shaftId:'shaft-1',componentId:'component-1',floor:0};group.position.set(1,2,3);group.rotation.y=.137;source.add(group);
 const material=new THREE.MeshPhysicalMaterial({transparent:true,opacity:.28,color:'#aac9ba',roughness:.19,transmission:0}),mesh=new THREE.Mesh(new THREE.BoxGeometry(.93,2.2,.045),material);mesh.userData.roomIds=['r','next'];group.add(mesh);const ceiling=new THREE.Mesh(new THREE.BoxGeometry(5,.14,4),new THREE.MeshStandardMaterial());ceiling.userData={kind:'ceiling-slab',roomId:'r'};source.add(ceiling);const light=new THREE.PointLight('#ffffff',1.2);source.add(light);source.updateMatrixWorld(true);
 const input=mesh.geometry.attributes.position,positions=Array.from(input.array),model=b.architecturalRenderScene(THREE,source,{purpose:'model'}),copy=model.children.find(o=>o.userData.openingId==='door-1');assert.ok(copy);assert.equal(copy.geometry.attributes.position.count,input.count);
 for(let i=0;i<input.count;i++){const expected=new THREE.Vector3().fromBufferAttribute(input,i).applyMatrix4(mesh.matrixWorld),actual=new THREE.Vector3().fromBufferAttribute(copy.geometry.attributes.position,i);assert.ok(expected.distanceTo(actual)<1e-6);}
 assert.deepEqual(Array.from(input.array),positions);for(const key of ['roomId','openingId','fixtureId','shaftId','componentId','floor'])assert.equal(copy.userData[key],group.userData[key]);assert.deepEqual(copy.userData.roomIds,['r','next']);assert.equal(copy.userData.designRevision,'REV-MEASURED');assert.equal(model.userData.designRevision,'REV-MEASURED');assert.equal(copy.material.color.getHex(),material.color.getHex());assert.equal(copy.material.transmission,0);assert.equal(copy.material.roughness,.19);assert.equal(copy.material.opacity,.28);
 assert.equal(model.children.filter(o=>o.userData.kind==='ceiling-slab').length,1);assert.equal(model.children.some(o=>o.isRectAreaLight||o.userData.kind==='render-lighting'),false);assert.equal(model.children.filter(o=>o.isPointLight).length,1);
});
