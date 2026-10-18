/* Offline scene extraction from the production constructor, no browser/WebGL.
 * Blender receives these exact transformed vertices, not a second house model.
 */
import fs from 'node:fs';import path from 'node:path';import vm from 'node:vm';
import * as BaseThree from 'three';
import {createCanvas,loadImage} from '@napi-rs/canvas';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {modernReference} from './team-b-modern-reference.mjs';
class LocalTextureLoader{
 load(url,onLoad,_progress,onError){const texture=new BaseThree.Texture();loadImage(fs.readFileSync(url)).then(img=>{texture.image=img;onLoad(texture);},onError);return texture;}
}
const THREE={...BaseThree,RoundedBoxGeometry,TextureLoader:LocalTextureLoader};
const {B,review}=modernReference();
// Parse the same vendored licensed GLBs used by the lazy browser loader. The
// reviewed models have no external textures, decoder or network dependencies.
const modelLoader=new GLTFLoader(),modelCache=new Map();
B.loadFurnitureModel=asset=>{
 if(!modelCache.has(asset)){const file={"modern-armchair":"modern-armchair-facing.glb","modern-coffee-table":"modern-coffee-table.glb"}[asset];if(!file)return Promise.reject(Error('Unsupported review model '+asset));const bytes=fs.readFileSync('assets/interior/models/'+file);modelCache.set(asset,modelLoader.parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'').then(g=>g.scene));}
 return modelCache.get(asset);
};
const textureSource=fs.readFileSync('src/43_scene_assets.js','utf8'),artSource=fs.readFileSync('src/85_interior_collections.js','utf8');
// Rebind only production texture factories to a local Canvas implementation.
// This retains the browser's actual procedural/photo blend and artwork.
const canvasContext={BMH:B,document:{createElement:()=>createCanvas(1,1),createElementNS:()=>({})},setTimeout,clearTimeout,console};
vm.runInNewContext(textureSource.slice(textureSource.indexOf('BMH.sceneSurfaceTexture ='),textureSource.indexOf('// Project texture coordinates')),canvasContext);
vm.runInNewContext(artSource.slice(artSource.indexOf('BMH.collectionArtTexture='),artSource.indexOf('const collectionDecorate=')),canvasContext);
const beforePlan=JSON.stringify(B.state.project.plan),collection=process.env.BMH_REVIEW_COLLECTION;
if(collection){if(!B.applyInteriorCollection(collection))throw Error('Unknown collection '+collection);if(JSON.stringify(B.state.project.plan)!==beforePlan)throw Error('Finish edit changed measured plan');review.revision=B.drawingRevision();}
const view=process.argv[2]||'exterior',out=process.argv[3]||'docs/team-v1/evidence/B/Modern-5x20-V01';fs.mkdirSync(out,{recursive:true});
if(!['exterior','whole','living','bed','kitchen','bath','stairs','terrace'].includes(view))throw Error('Unsupported review view: '+view);
const houseView=['exterior','whole'].includes(view),inspection=['stairs','terrace'].includes(view);
const room=houseView?null:B.state.project.plan.rooms.find(r=>view==='terrace'?r.outdoorSpace?.kind==='terrace':r.type===view);
if(!houseView&&!room)throw Error('Missing measured room for view: '+view);
const measuredSnapshot=()=>JSON.stringify({site:B.state.project.site,plan:{...B.state.project.plan,furniture:undefined},furniture:B.resolvedFurniture().map(({materialBindings,...i})=>i)}),beforeGeometry=measuredSnapshot();
const itemFinishes=JSON.parse(process.env.BMH_REVIEW_ITEM_FINISHES||'[]');
for(const selection of itemFinishes){
 const item=B.resolvedFurniture(room?.id).find(i=>i.modelId===selection.modelId);
 if(!item||!B.setFurnitureVisualMaterial(item.id,selection.role,selection.profileId))throw Error('Cannot apply measured item finish '+JSON.stringify(selection));
}
if(measuredSnapshot()!==beforeGeometry)throw Error('Item finish changed measured geometry or placement');
review.revision=B.drawingRevision();
B.state.ui.sceneFocus=room?'room:'+room.id:'all';B.state.ui.roomCamera=inspection?'overview':'inside';B.state.ui.exteriorCamera=view==='exterior'?'front':'overview';B.state.ui.sceneExploded=false;
// The browser roof material paints a canvas; offline texture preparation is
// deferred to Blender. This adapter changes no roof vertices or dimensions.
B.roofSceneMaterial=()=>new THREE.MeshStandardMaterial({color:B.roofSurfaceSpec().color||'#777976',roughness:.85});
const source=fs.readFileSync('src/45_studio3d.js','utf8');
const body=source.slice(source.indexOf('  const mat=(color,rough='),source.indexOf('  const facadeCamera='));
if(!body.includes('BMH.decorateStudioScene')||!body.includes('const roof='))throw Error('Production scene constructor changed; review extractor.');
const context={BMH:B,THREE,console};
const lighting=source.slice(source.indexOf('  const hemi='),source.indexOf('  const mat=(color,rough='));
vm.runInNewContext('const scene=new THREE.Scene(),palette=BMH.scenePalette();\n'+lighting+body+'\nglobalThis.output={scene,W,D,roomFocus,visibleFloors,sun,ground,displayBase,focus,floorFocus,explode};',context);
const {scene,W,D}=context.output;
B.studio3d={scene,renderer:{shadowMap:{}},requestRender(){}};
const furnitureResults=await Promise.all(scene.userData.furnitureLoads||[]);
if(furnitureResults.some(ok=>!ok))throw Error('A licensed furniture upgrade failed; do not approve the fallback as the final model.');
// Apply the final production material/light pass too. GPU environment-map
// convolution is left to the renderer, not simulated by a second scene model.
B.configureHousePresentation({THREE,...context.output,renderer:{toneMappingExposure:1}});
await Promise.all(scene.userData.surfaceLoads||[]);scene.updateMatrixWorld(true);
const materials=new Map(),meshes=[],textureFiles=new Map();
fs.mkdirSync(path.join(out,'scene-textures'),{recursive:true});
function texture(t){
 if(!t?.image?.width)return null;if(textureFiles.has(t.uuid))return textureFiles.get(t.uuid);
 const im=t.image,canvas=createCanvas(im.width,im.height);canvas.getContext('2d').drawImage(im,0,0);
 const file='scene-textures/'+t.uuid+'.png';fs.writeFileSync(path.join(out,file),canvas.toBuffer('image/png'));
 const row={file,colorSpace:t.colorSpace||'',width:im.width,height:im.height};textureFiles.set(t.uuid,row);return row;
}
const photoKinds={wood:'wood_table_001',woodVertical:'wood_table_001',plank:'wood_floor',marble:'marble_01',plaster:'white_plaster_02',fabric:'terlenka',leather:'brown_leather',concrete:'concrete_floor_02',terrazzo:'terrazzo_tiles'};
function material(m){
 if(materials.has(m.uuid))return m.uuid;
 const profile=B.VISUAL_MATERIALS.find(p=>p.id===m.userData.visualMaterial),slot=m.userData.finishSlot;
 const kind=profile?.kind||({wood:'wood',slattedWood:'woodVertical',fabric:'fabric',linen:'fabric',pillow:'fabric',rug:'fabric',wall:'plaster',plank:'plank'}[slot]);
 materials.set(m.uuid,{id:m.uuid,color:m.color?.toArray()||[.5,.5,.5],roughness:m.roughness??.6,metalness:m.metalness||0,opacity:m.opacity??1,transmission:m.transmission||0,slot:slot||null,profileId:profile?.id||null,photo:photoKinds[kind]||null,photoAlpha:kind==='plaster'?.08:1,normalStrength:m.normalScale?.x??.2,vertexColors:!!m.vertexColors,sheen:m.sheen||0,sheenRoughness:m.sheenRoughness??1,sheenColor:m.sheenColor?.toArray()||null,clippingPlanes:(m.clippingPlanes||[]).map(p=>({normal:p.normal.toArray(),constant:p.constant})),maps:{color:texture(m.map),normal:texture(m.normalMap),roughness:texture(m.roughnessMap)}});return m.uuid;
}
scene.traverse(o=>{if(!o.isMesh||!o.visible)return;const g=o.geometry,p=g.attributes.position;if(!p)return;
 let parent=o,furniture;while(parent){if(parent.userData.kind==='furniture')furniture=parent.userData;parent=parent.parent;}
 const attrs={};for(const key of ['position','normal','uv','color'])if(g.attributes[key])attrs[key]=Array.from(g.attributes[key].array);
 const ms=Array.isArray(o.material)?o.material:[o.material];meshes.push({name:o.name||o.userData.kind||'mesh',identity:{kind:o.userData.kind||null,roomId:o.userData.roomId||furniture?.roomId||null,floor:o.userData.floor??furniture?.floor??null,furnitureId:furniture?.furnitureId||null,modelId:furniture?.model||null,openingId:o.userData.openingId||null},facadeSkin:!!o.userData.facadeSkin,castShadow:o.castShadow,receiveShadow:o.receiveShadow,matrix:o.matrixWorld.toArray(),attributes:attrs,index:g.index?Array.from(g.index.array):null,groups:g.groups,materials:ms.map(material)});
});
let camera=room&&!inspection?B.roomInteriorCamera(room,B.roomFurnitureLayout(room)):null;
if(inspection){const span=Math.max(room.w,room.h),height=view==='stairs'?B.studioFloorLevel(room.floor).height:1.2;camera={position:{x:room.x+room.w*.5+span*.9,y:room.y+room.h*.5-span,height:height+span*.6},target:{x:room.x+room.w/2,y:room.y+room.h/2},targetHeight:view==='stairs'?height*.45:.4,lens:32,basis:'Measured room inspection from the production north/east cutaway; no invented guard or drainage.'};}
if(houseView){const b=B.sceneFootprintBounds(B.state.project.plan.rooms),height=B.studioLevels().roofBase+B.studioLevels().slab,span=Math.max(b.width,b.depth,height);camera=view==='exterior'?{position:{x:b.cx+b.width*.6,y:b.y-Math.max(height*1.9,b.width*2),height:height*.46},target:{x:b.cx,y:b.y},targetHeight:height*.46,lens:45,basis:'Facade of measured envelope'}:{position:{x:b.cx+span*.85,y:b.y-span*.85,height:span*.85},target:{x:b.cx,y:b.cy},targetHeight:height*.45,lens:35,basis:'Whole measured envelope; roof retained'};}
const furnitureAssets=[];scene.traverse(o=>{if(o.userData.kind==='furniture')furnitureAssets.push({id:o.userData.furnitureId,modelId:o.userData.model,source:o.userData.source,asset:o.userData.asset||null,licence:o.userData.license||null});});
const model={sun:{position:context.output.sun.position.toArray(),target:context.output.sun.target.position.toArray(),color:context.output.sun.color.toArray(),intensity:context.output.sun.intensity},collection:collection||null,itemFinishes,furnitureAssets,geometryPreserved:measuredSnapshot()===beforeGeometry,planPreserved:JSON.stringify(B.state.project.plan)===beforePlan,revision:review.revision,rendererRevision:B.ARCH_RENDER_REVISION,fixture:review.id,status:review.status,view,roomId:room?.id||null,room:room?{x:room.x,y:room.y,w:room.w,h:room.h}:null,site:{width:W,depth:D},camera,materials:[...materials.values()],meshes};
fs.writeFileSync(path.join(out,'scene-'+view+'.json'),JSON.stringify(model));
console.log(JSON.stringify({view,revision:review.revision,meshes:meshes.length,vertices:meshes.reduce((n,m)=>n+m.attributes.position.length/3,0),camera}));

