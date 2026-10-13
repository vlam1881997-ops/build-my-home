// Reproducible BMH-original generic appliance; no manufacturer/SKU claim.
import fs from 'node:fs';
import crypto from 'node:crypto';
import * as Three from 'three';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {GLTFExporter} from 'three/examples/jsm/exporters/GLTFExporter.js';
import {designClient} from './fixtures/design-client.mjs';
const THREE={...Three,RoundedBoxGeometry},B=designClient({realHouse:true});
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();});}};
const colors={white:0xf4f3ef,stone:0xd2d6d8,metal:0xaab2b8,screen:0x182630,dark:0x20282d,wood:0x967252};
const materials=Object.fromEntries(Object.entries(colors).map(([name,color])=>[name,new Three.MeshStandardMaterial({name,color,roughness:name==='screen'?.16:.42,metalness:name==='metal'?.85:.05})]));
const dimensions=B.FURNITURE_DIMENSIONS.washingMachine;
const model=B.createRoomAsset('washingMachine',dimensions,THREE,{...materials,collection:{id:'generic'}});
const wrapper=new Three.Group();wrapper.name='BMH generic front-load washing machine';wrapper.add(model);
// Architect3D vendored model convention: half-metre source, default scale 200.
wrapper.scale.setScalar(.5);wrapper.userData={source:'BMH original parametric geometry',generic:true,front:'+Z',manufacturer:null,sku:null};
const binary=await new GLTFExporter().parseAsync(wrapper,{binary:true});
const output='assets/architect3d/models/washingMachine.glb';fs.writeFileSync(output,Buffer.from(binary));
const provenance={modelId:'washingMachine',file:'models/washingMachine.glb',source:'src/43_scene_assets.js:createRoomAsset',generator:'tests/team-b-washer-asset.mjs',rights:'Original BMH geometry; no third-party model or manufacturer branding',generic:true,manufacturer:null,sku:null,front:'+Z',dimensionsMetres:dimensions,sourceScale:.5,architectDefaultScale:200,sha256:crypto.createHash('sha256').update(Buffer.from(binary)).digest('hex')};
fs.writeFileSync('assets/architect3d/bmh-washing-machine.json',JSON.stringify(provenance,null,2)+'\n');console.log(output,binary.byteLength,provenance.sha256);
