import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {renderFinishDescription,renderRequestPayload} from '../api/gemini-render.mjs';

function client({mount=async()=>{}}={}){
 const b={state:{ui:{sceneFocus:'room:living'},project:{style:'Japandi',site:{width:5,depth:8,floors:1},materials:{choices:{floor:'approved-floor',paint:'approved-paint'},finish:{rooms:{}}},plan:{rooms:[{id:'living',name:'Khách',type:'living',floor:0,x:0,y:0,w:5,h:4},{id:'bed',name:'Ngủ',type:'bed',floor:0,x:0,y:4,w:5,h:4}],openings:[]}}},screen7:()=>'<section class="interior-collections">',SCREENS:[],esc:String,$:()=>null,save(){},render(){},mountStudio3D:mount,disposeStudio3D(){}};
 b.finishPalette=id=>id?b.state.project.materials.finish.rooms[id]:b.state.project.materials.finish.exterior;
 const context={BMH:b,document:{addEventListener(){},querySelectorAll:()=>[],createElement(){const canvas={toDataURL(){return canvas.reference?.toDataURL()||'';}};canvas.getContext=()=>({drawImage(reference){canvas.reference=reference;},createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData(data){canvas.pixels=data.data;}});return canvas;}},window:{},console,setTimeout,clearTimeout,cancelAnimationFrame(){},requestAnimationFrame:()=>1,performance:{now:()=>200},structuredClone};
 for(const file of ['43_scene_assets.js','85_interior_collections.js','86_visual_materials.js','46_architectural_render.js'])vm.runInNewContext(fs.readFileSync('src/'+file,'utf8'),context);
 return {b,context};
}
test('a visual finish changes only the selected room and preserves the plan, approved SKUs and saved scheme',()=>{
 const {b}=client(),before=JSON.stringify(b.state.project.plan),other=JSON.stringify(b.finishPalette('bed'));
 assert.equal(b.applyVisualMaterial('floor','white-marble','living'),true);
 assert.equal(b.finishPalette('living').surface,'stone');assert.equal(b.finishPalette('living').visualMaterials.floor,'white-marble');
 assert.equal(JSON.stringify(b.finishPalette('bed')),other);assert.equal(JSON.stringify(b.state.project.plan),before);
 assert.deepEqual(b.state.project.materials.choices,{floor:'approved-floor',paint:'approved-paint'});
 const snapshot=structuredClone(b.state.project);b.state.project=snapshot;assert.equal(b.visualMaterialContext('living').surfaces.find(p=>p.role==='floor').id,'white-marble');
 assert.equal(b.applyVisualMaterial('wall','white-marble','living'),false);assert.equal(b.applyVisualMaterial('floor','white-marble','missing'),false);
});
test('selected marble, concrete and upholstery have different physical finishes, not just a new tint',()=>{
 const {b}=client();b.applyVisualMaterial('floor','white-marble','living');const marble=b.sceneAssetMaterials(THREE,new THREE.Scene(),b.finishPalette('living')).floor;
 b.applyVisualMaterial('floor','grey-concrete','living');const concrete=b.sceneAssetMaterials(THREE,new THREE.Scene(),b.finishPalette('living')).floor;
 assert.ok(marble.roughness<concrete.roughness);assert.equal(marble.map.userData.kind,'marble');assert.equal(concrete.map.userData.kind,'concrete');assert.notDeepEqual(marble.map.image.pixels,concrete.map.image.pixels);
 assert.equal(marble.map.colorSpace,THREE.SRGBColorSpace);assert.equal(marble.normalMap.colorSpace,THREE.NoColorSpace);
 b.applyVisualMaterial('fabric','olive-velvet','living');const velvet=b.sceneAssetMaterials(THREE,new THREE.Scene(),b.finishPalette('living')).fabric;
 assert.ok(velvet.isMeshPhysicalMaterial);assert.ok(velvet.sheen>0);assert.equal(velvet.userData.visualMaterial,'olive-velvet');assert.equal(velvet.map.userData.kind,'velvet');
});
test('repeat visits reuse immutable texture templates with independent scene-owned textures',()=>{
 const {b}=client(),first=b.sceneAssetMaterials(THREE,new THREE.Scene()),second=b.sceneAssetMaterials(THREE,new THREE.Scene());
 assert.notEqual(first.wood.map,second.wood.map);assert.equal(first.wood.map.image,second.wood.map.image);
 const pixels=second.wood.map.image.pixels.slice();first.wood.map.dispose();assert.deepEqual(second.wood.map.image.pixels,pixels);
});
test('changing collection resets its surface scheme and a legacy explicit floor still takes priority',()=>{
 const {b}=client();b.applyVisualMaterial('floor','white-marble','living');b.applyInteriorCollection('mid-century','living');
 assert.equal(b.finishPalette('living').visualMaterials.floor,'walnut-floor');assert.equal(b.finishPalette('living').shape,'midcentury');
 b.state.project.materials.finish.rooms.living={surface:'tile',floor:'#dddccc'};
 assert.equal(b.finishPalette('living').surface,'tile');assert.equal(b.finishPalette('living').visualMaterials.floor,'ivory-tile');
});
test('all selected colours, collection and surface details reach the image prompt without palette truncation',()=>{
 const {b}=client();b.applyInteriorCollection('neo-elegance','living');const finish=b.visualMaterialContext('living'),description=renderFinishDescription(finish);
 for(const hex of Object.values(finish.palette))assert.ok(description.includes(hex),hex);assert.match(description,/Tân cổ điển thanh lịch/);assert.match(description,/Marble trắng/);assert.match(description,/mặt đánh bóng/);
 const request=renderRequestPayload({image:'data:image/png;base64,'+'A'.repeat(120),project:{site:b.state.project.site,materials:{finish},view:{kind:'room',roomName:'Khách'}}});
 assert.match(request.prompt,/Preserve its viewpoint/);assert.match(request.prompt,/Nhung olive/);assert.match(request.prompt,/Do not substitute a different collection/);
 const legacy=renderRequestPayload({image:'data:image/png;base64,'+'A'.repeat(120),project:{materials:{choices:{finishPalette:JSON.stringify(finish.palette)}}}});assert.ok(legacy.prompt.includes(finish.palette.rug));
});
test('malformed finish metadata is bounded and cannot invent colour or scale values',()=>{
 const result=renderFinishDescription({palette:{wall:'#123456',floor:'bad'},collection:{name:'x'.repeat(10000)},surfaces:[{role:'floor',name:'y'.repeat(10000),detail:'z'.repeat(10000),scale:[-1,1000],roughness:100},{role:'invalid',name:'discard'}]});
 assert.ok(result.length<650);assert.match(result,/#123456/);assert.doesNotMatch(result,/bad|discard|texture repeat/);assert.match(result,/roughness 1/);
});
test('PNG export works in interactive 3D without starting or waiting for the physical renderer',async()=>{
 const {b}=client();let draws=0,download;const blob={type:'image/png'},s={scene:{},camera:{},renderer:{render(){draws++;},domElement:{toBlob(done,type){assert.equal(type,'image/png');done(blob);}}}};
 b.studio3d=s;b.download=(...args)=>download=args;assert.equal(await b.captureStudioPreview(),true);assert.equal(draws,1);assert.equal(download[1],blob);assert.match(download[0],/xem-nhanh\.png$/);assert.equal(b.archRenderModules,null);assert.equal(b.studio3d,s);
});
test('quick export preserves a running render and ignores a scene retired during encoding',async()=>{
 const {b}=client();let encoded,downloaded=0,restored=0;const render={samples:2,denoise:{render(){restored++;}}},s={scene:{},camera:{},archRender:render,renderer:{render(){},domElement:{toBlob(done){encoded=done;}}}};
 b.studio3d=s;b.download=()=>downloaded++;const pending=b.captureStudioPreview();assert.equal(restored,1);assert.equal(s.archRender,render);b.studio3d=null;encoded({});assert.equal(await pending,false);assert.equal(downloaded,0);
});
test('quick PNG carries the measured revision and rejects a changed camera during encoding',async()=>{
 const {b}=client();let finish,downloaded;let key='camera-1';b.drawingRevision=()=> 'REV-123';b.cinematicSignature=()=> 'design';b.cinematicCameraKey=()=>key;b.studio3d={scene:{},camera:{},renderer:{render(){},domElement:{width:800,height:500,toBlob(done){finish=done;}}}};b.download=(name,blob)=>downloaded={name,blob};
 const pending=b.captureStudioPreview();key='camera-2';finish({type:'image/png'});assert.equal(await pending,false);assert.equal(downloaded,undefined);const next=b.captureStudioPreview(),blob={type:'image/png'};finish(blob);assert.equal(await next,true);assert.match(downloaded.name,/REV-123-xem-nhanh\.png$/);assert.equal(downloaded.blob,blob);assert.equal(b.lastQuickExport.designRevision,'REV-123');assert.equal(b.lastQuickExport.cameraKey,'camera-2');assert.equal(b.lastQuickExport.width,800);
});
test('reopening a saved quality view does not silently start expensive rendering',async()=>{
 const {b}=client();b.state.ui.renderMode='quality';await b.mountStudio3D();assert.equal(b.state.ui.renderMode,'interactive');assert.equal(b.archRenderModules,null);
});
test('queued scene mounts share one renderer for the same canvas',async()=>{
 let builds=0,release;const canvas={},gate=new Promise(resolve=>release=resolve);
 const {b}=client({mount:async()=>{builds++;await gate;b.studio3d={renderer:{domElement:canvas}};}});b.$=()=>canvas;
 const tasks=[b.mountStudio3D(),b.mountStudio3D(),b.mountStudio3D()];assert.equal(builds,1);
 release();await Promise.all(tasks);await b.mountStudio3D();assert.equal(builds,1);assert.equal(b.finishMountWork,null);
});
test('a paused render resumes its existing work and rejects an outdated design',()=>{
 const {b}=client();b.cinematicSignature=()=> 'current';const r={paused:true,samples:3,draw(){},signature:'current'};b.studio3d={archRender:r};assert.equal(b.resumeArchitecturalRender(),true);assert.equal(r.samples,3);assert.equal(r.startedAt,200);assert.equal(b.resumeArchitecturalRender(),false);r.paused=true;r.signature='old';assert.equal(b.resumeArchitecturalRender(),false);
});
test('AI image caching matches the captured view as well as the design',async()=>{
 const {b,context}=client();let reference='first-view',requests=0;
 b.MATERIALS={};b.cinematicSignature=()=> 'same-design';b.finishHash=value=>value;b.toast=()=>{};
 b.cinematicRender={loading:false,views:{'same-design':'old-image'},referenceHashes:{'same-design':'old-view'}};
 b.studio3d={scene:{userData:{}},renderFrame(){},renderer:{domElement:{width:2560,height:1600,toDataURL:()=>reference}}};
 context.fetch=async()=>{requests++;return {ok:true,json:async()=>({image:'new-image',mimeType:'image/png'})};};
 const source=fs.readFileSync('src/45_studio3d.js','utf8');vm.runInNewContext(source.slice(source.indexOf('BMH.cinematicReferenceImage=')),context);
 await b.generateCinematicRender();assert.equal(requests,1,'a different captured view requires a new image');
 await b.generateCinematicRender();assert.equal(requests,1,'the identical captured view reuses its image');
 reference='rotated-view';await b.generateCinematicRender();assert.equal(requests,2,'rotating the camera cannot reuse the previous image');
 assert.equal(b.cinematicRender.loading,false);
});
test('an AI reply from an earlier camera is rejected and its hero image becomes hidden',async()=>{
 const {b,context}=client();let reply;
 b.MATERIALS={};b.cinematicSignature=()=> 'same-design';b.finishHash=value=>value;b.toast=()=>{};b.cinematicRender={loading:false,views:{}};
 b.studio3d={state:{yaw:.2,pitch:.3,dist:5,target:new THREE.Vector3(1,2,3)},scene:{userData:{}},renderFrame(){},renderer:{domElement:{width:2560,height:1600,toDataURL:()=> 'camera-reference'}}};
 const source=fs.readFileSync('src/45_studio3d.js','utf8');vm.runInNewContext(source.slice(source.indexOf('BMH.cinematicCameraKey=()=>'),source.indexOf('BMH.generateCinematicRender = async () => {')),context);
 vm.runInNewContext(source.slice(source.indexOf('BMH.cinematicReferenceImage=')),context);
 const key=b.cinematicCameraKey();b.cinematicRender.views['same-design']='old-image';b.cinematicRender.cameraKeys={'same-design':key};assert.equal(b.currentCinematicImage(),'old-image');
 context.fetch=()=>new Promise(resolve=>reply=resolve);const pending=b.generateCinematicRender();await Promise.resolve();b.studio3d.state.yaw+=.3;assert.equal(b.currentCinematicImage(),'');
 const hero={hidden:false};b.$=()=>hero;b.refreshCinematicHero();assert.equal(hero.hidden,true);
 reply({ok:true,json:async()=>({image:'WRONG-CAMERA',mimeType:'image/png'})});await pending;assert.equal(b.cinematicRender.views['same-design'],'old-image');assert.match(b.cinematicRender.error,/góc nhìn/);assert.equal(b.cinematicRender.loading,false);
});
