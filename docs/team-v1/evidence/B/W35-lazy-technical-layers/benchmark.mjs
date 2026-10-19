import fs from 'node:fs';
import vm from 'node:vm';
import {performance} from 'node:perf_hooks';
import * as THREE from 'three';
const input=process.argv[2],output=process.argv[3],source=fs.readFileSync(input,'utf8');
const helper=fs.readFileSync('tests/model-presentation.test.mjs','utf8');
const reader={readFileSync:(path,...args)=>path==='src/98_model_presentation.js'?source:fs.readFileSync(path,...args)};
const {client,fixture}=new Function('THREE','fs','vm',helper.slice(helper.indexOf('function client('),helper.indexOf('\ntest('))+'\nreturn {client,fixture};')(THREE,reader,vm);
const samples=[];
for(let run=0;run<7;run++){
 const b=client();b.state.ui.modelLook='materials';const {c}=fixture(b),g=new THREE.BoxGeometry(.3,.8,.4),m=new THREE.MeshStandardMaterial();
 for(let i=0;i<500;i++){const mesh=new THREE.Mesh(g,m);mesh.userData={model:'cabinet',roomId:'r'};mesh.position.set((i%20)*.4,.4,Math.floor(i/20)*.5);c.scene.add(mesh);}
 const start=performance.now();b.configureModelPresentation(c);const elapsedMs=performance.now()-start;let helperVertices=0,helperBytes=0,helperMeshes=0;
 c.scene.traverse(o=>{if(!['model-outlines','model-room-light','model-site-grid','model-lamp-glows'].includes(o.userData.kind)&&!['model-outlines','model-lamp-glows'].includes(o.parent?.userData.kind))return;helperMeshes++;for(const a of Object.values(o.geometry?.attributes||{})){helperVertices+=a.count;helperBytes+=a.array.byteLength;}});
 samples.push({run,elapsedMs,helperVertices,helperBytes,helperMeshes});const geometries=new Set(),materials=new Set();c.scene.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);});for(const x of geometries)x.dispose();for(const x of materials)x.dispose();
}
const times=samples.slice(1).map(x=>x.elapsedMs).sort((a,b)=>a-b),result={scope:'CPU-only synthetic 500-mesh presentation fixture; no WebGL renderer, native device or first-visible-model benchmark',three:THREE.REVISION,node:process.version,mode:'materials',warmupExcluded:1,samples,medianMs:(times[2]+times[3])/2};
fs.mkdirSync(output.slice(0,output.lastIndexOf('/')),{recursive:true});fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({output,medianMs:result.medianMs,helperBytes:samples.at(-1).helperBytes}));
