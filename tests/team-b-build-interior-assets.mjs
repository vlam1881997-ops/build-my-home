/* Authoring only: export the actual production parametric modules as metre GLBs.
 * Neutral surfaces are explicitly generic, never manufacturer product imagery.
 * Run with the pinned Node22 / Three0.160.1; no app dependency is added.
 */
import fs from 'node:fs';import path from 'node:path';import crypto from 'node:crypto';
import * as THREE from 'three';import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {designClient} from './fixtures/design-client.mjs';
class BlobReader{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();},error=>this.onerror?.(error));}}
globalThis.FileReader=BlobReader;
const T={...THREE,RoundedBoxGeometry},B=designClient({realHouse:true}),ids=['kitchenBaseCabinet','kitchenFillerPanel','kitchenWallCabinet','kitchenHood','wardrobeModern','bedsideLamp','bedBench'],folder='assets/interior/models';fs.mkdirSync(folder,{recursive:true});
const records=[];
for(const id of ids){
 const size=B.FURNITURE_DIMENSIONS[id],scene=new THREE.Scene(),materials=B.sceneAssetMaterials(T,scene,{wall:'#eee9df',floor:'#ddd9cf',accent:'#ad855a',fabric:'#dfd5c2',collectionId:'modern-natural',visualMaterials:{accent:'natural-oak',fabric:'natural-linen',floor:'ivory-tile',wall:'ivory-paint'},stoneVisualMaterial:'sand-travertine'}),root=B.createRoomAsset(id,size,T,materials);
 root.traverse(o=>{if(!o.material)return;for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const key of ['map','normalMap','roughnessMap','metalnessMap','aoMap','emissiveMap','alphaMap','bumpMap','displacementMap'])m[key]=null;m.userData={finishSlot:m.userData.finishSlot,generic:true};}});
 root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(root),actual=bounds.getSize(new THREE.Vector3());for(const [key,target]of [['x',size.w],['y',size.h],['z',size.d]])if(Math.abs(actual[key]-target)>1e-5)throw Error(id+' measured GLB size mismatch');
 const bytes=Buffer.from(await new GLTFExporter().parseAsync(root,{binary:true,onlyVisible:true})),file=path.join(folder,id+'.glb');fs.writeFileSync(file,bytes);
 const row={id,file,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length,dimensionsMetres:{...size},source:'BMH original parametric geometry from src/43_scene_assets.js',materialMode:'generic-neutral; native scene applies shared room/item selections',licence:'BMH project source; no third-party model geometry',exactness:'generic-design-module-not-manufacturer-SKU'};records.push(row);console.log(JSON.stringify(row));
}
fs.writeFileSync(path.join(folder,'modern-modules.provenance.json'),JSON.stringify({type:'actual-production-parametric-model-exports',units:'metres',sourceFactorySha256:crypto.createHash('sha256').update(fs.readFileSync('src/43_scene_assets.js')).digest('hex'),models:records},null,2)+'\n');
