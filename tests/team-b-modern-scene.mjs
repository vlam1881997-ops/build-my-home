/* Offline scene extraction from the production constructor, no browser/WebGL.
 * Blender receives these exact transformed vertices, not a second house model.
 */
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
import * as BaseThree from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {modernReference} from './team-b-modern-reference.mjs';
const THREE={...BaseThree,RoundedBoxGeometry};
const {B,review}=modernReference();
const view=process.argv[2]||'exterior',out=process.argv[3]||'docs/team-v1/evidence/B/Modern-5x20-V01';fs.mkdirSync(out,{recursive:true});
const room=view==='exterior'?null:B.state.project.plan.rooms.find(r=>r.type===(view==='bed'?'bed':'living'));
B.state.ui.sceneFocus=room?'room:'+room.id:'all';B.state.ui.roomCamera='inside';B.state.ui.sceneExploded=false;
// The browser roof material paints a canvas; offline texture preparation is
// deferred to Blender. This adapter changes no roof vertices or dimensions.
B.roofSceneMaterial=()=>new THREE.MeshStandardMaterial({color:B.roofSurfaceSpec().color||'#777976',roughness:.85});
const source=fs.readFileSync('src/45_studio3d.js','utf8');
const body=source.slice(source.indexOf('  const mat=(color,rough='),source.indexOf('  const centerRoom='));
if(!body.includes('BMH.decorateStudioScene')||!body.includes('const roof='))throw Error('Production scene constructor changed; review extractor.');
const context={BMH:B,THREE,console};
vm.runInNewContext('const scene=new THREE.Scene(),palette=BMH.scenePalette();\n'+body+'\nglobalThis.output={scene,W,D,roomFocus,visibleFloors};',context);
const {scene,W,D}=context.output;scene.updateMatrixWorld(true);
const materials=new Map(),meshes=[];
const photoKinds={wood:'wood_table_001',woodVertical:'wood_table_001',plank:'wood_floor',marble:'marble_01',plaster:'white_plaster_02',fabric:'terlenka',leather:'brown_leather',concrete:'concrete_floor_02',terrazzo:'terrazzo_tiles'};
function material(m){
 if(materials.has(m.uuid))return m.uuid;
 const profile=B.VISUAL_MATERIALS.find(p=>p.id===m.userData.visualMaterial),slot=m.userData.finishSlot;
 const kind=profile?.kind||({wood:'wood',slattedWood:'woodVertical',fabric:'fabric',linen:'fabric',pillow:'fabric',rug:'fabric',wall:'plaster',plank:'plank'}[slot]);
 materials.set(m.uuid,{id:m.uuid,color:m.color?.toArray()||[.5,.5,.5],roughness:m.roughness??.6,metalness:m.metalness||0,opacity:m.opacity??1,transmission:m.transmission||0,slot:slot||null,profileId:profile?.id||null,photo:photoKinds[kind]||null});return m.uuid;
}
scene.traverse(o=>{if(!o.isMesh||!o.visible)return;const g=o.geometry,p=g.attributes.position;if(!p)return;
 const attrs={};for(const key of ['position','normal','uv'])if(g.attributes[key])attrs[key]=Array.from(g.attributes[key].array);
 const ms=Array.isArray(o.material)?o.material:[o.material];meshes.push({name:o.name||o.userData.kind||'mesh',identity:{kind:o.userData.kind||null,roomId:o.userData.roomId||null,floor:o.userData.floor??null,openingId:o.userData.openingId||null},castShadow:o.castShadow,receiveShadow:o.receiveShadow,matrix:o.matrixWorld.toArray(),attributes:attrs,index:g.index?Array.from(g.index.array):null,groups:g.groups,materials:ms.map(material)});
});
const camera=room?B.roomInteriorCamera(room,B.roomFurnitureLayout(room)):null;
const model={revision:review.revision,fixture:review.id,status:review.status,view,roomId:room?.id||null,room:room?{x:room.x,y:room.y,w:room.w,h:room.h}:null,site:{width:W,depth:D},camera,materials:[...materials.values()],meshes};
fs.writeFileSync(path.join(out,'scene-'+view+'.json'),JSON.stringify(model));
console.log(JSON.stringify({view,revision:review.revision,meshes:meshes.length,vertices:meshes.reduce((n,m)=>n+m.attributes.position.length/3,0),camera}));
