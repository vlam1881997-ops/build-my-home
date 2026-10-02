/* Deterministic BMH assets for the legacy Architect3D adapter (its scale is 200%). */
import fs from 'node:fs';import vm from 'node:vm';import * as BaseThree from 'three';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const THREE={...BaseThree,RoundedBoxGeometry};
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const BMH={state:{project:{plan:{rooms:[]}},ui:{}}};vm.runInNewContext(fs.readFileSync('src/43_scene_assets.js','utf8'),{BMH});
const dims={sideTable:{w:.40,h:.65,d:.40},floorLamp:{w:.40,h:1.62,d:.40}},materials=BMH.sceneAssetMaterials(THREE,new THREE.Scene());
for(const [model,d]of Object.entries(dims)){
 const root=BMH.createRoomAsset(model,d,THREE,materials),container=new THREE.Group();container.name=model;container.add(root);container.scale.setScalar(.5);container.updateMatrixWorld(true);
 const bytes=await new GLTFExporter().parseAsync(container,{binary:true}),reimport=await new GLTFLoader().parseAsync(bytes,'');reimport.scene.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(reimport.scene),size=bounds.getSize(new THREE.Vector3()).multiplyScalar(2);
 for(const [actual,expected]of [[size.x,d.w],[size.y,d.h],[size.z,d.d],[bounds.min.y,0]])if(Math.abs(actual-expected)>1e-5)throw Error('Export envelope mismatch: '+model);
 fs.writeFileSync('assets/architect3d/models/'+model+'.glb',Buffer.from(bytes));console.log(model,bytes.byteLength,'measured envelope verified');
}
