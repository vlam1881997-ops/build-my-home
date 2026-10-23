import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';

const source=fs.readFileSync('src/91_customer_cloud.js','utf8');
function client(hooks={}){
 const record={id:'image-1'},blob=new Blob(['image fixture'],{type:'image/jpeg'}),requests=[],writes=[];
 const B={state:{project:{dossier:{evidence:[record]},sourceRefs:[]},meta:{cloudProjectId:'project-a',cloudOwnerId:'user-a',cloudRevision:3}},cloud:{epoch:1,user:{id:'user-a'},verified:true,config:{mediaConfigured:true},syncStatus:'synced'},
  evidenceGet:async()=>hooks.local?hooks.local(B):blob,evidencePut:async(id,data)=>writes.push({id,data}),save(){},cloudSaveProject:async()=>true,
  cloudApi:async(path,options)=>{requests.push({path,options});if(hooks.api)return hooks.api(B,path,options);return options?.method==='POST'?{file:{cloudKey:'saved-key'}}:{url:'https://fixture.invalid/image'};}};
 class FileReader{readAsDataURL(){queueMicrotask(()=>{hooks.read?.(B);this.result='data:image/jpeg;base64,aW1hZ2U=';this.onload();});}}
 vm.runInNewContext(source.slice(source.indexOf('/* Team B / B5: opt-in private evidence transfer')),{BMH:B,document:{addEventListener(){}},FileReader,fetch:async()=>hooks.fetch?hooks.fetch(B):{ok:true,blob:async()=>blob},crypto:webcrypto,Uint8Array});
 return {B,record,blob,requests,writes};
}
function switchProject(B){B.state={project:{dossier:{evidence:[{id:'image-1'}]},sourceRefs:[]},meta:{cloudProjectId:'project-b',cloudOwnerId:'user-a',cloudRevision:9}};}
test('unchanged project uploads and saves metadata normally',async()=>{
 const {B,record,requests}=client();await B.uploadProjectEvidence(record.id);
 assert.equal(requests.length,1);assert.equal(requests[0].options.body.projectId,'project-a');assert.equal(requests[0].options.body.expectedRevision,3);assert.equal(record.cloudKey,'saved-key');
});
test('project switch, logout and removed attachment during encoding prevent upload',async()=>{
 for(const read of [switchProject,B=>{B.cloud.epoch++;B.cloud.user=null;},B=>{B.state.project.dossier.evidence=[];}]){
  const {B,record,requests}=client({read});await assert.rejects(B.uploadProjectEvidence(record.id),/đã đổi/);assert.equal(requests.length,0);assert.equal(record.cloudKey,undefined);
 }
});
test('project switch while local bytes load prevents returning or uploading stale bytes',async()=>{
 const {B,requests}=client({local:async B=>{switchProject(B);return new Blob(['old']);}});
 await assert.rejects(B.uploadProjectEvidence('image-1'),/đã đổi/);assert.equal(requests.length,0);
 const next=client({local:async B=>{switchProject(B);return new Blob(['old']);}});
 await assert.rejects(next.B.evidenceGet('image-1'),/đã đổi/);
});
test('project switch during upload cannot attach response to old or new project',async()=>{
 const {B,record}=client({api:async B=>{switchProject(B);return {file:{cloudKey:'old-key'}};}});
 await assert.rejects(B.uploadProjectEvidence(record.id),/đã đổi/);assert.equal(record.cloudKey,undefined);assert.equal(B.state.project.dossier.evidence[0].cloudKey,undefined);
});
test('download refuses a changed project or removed attachment before caching bytes',async()=>{
 for(const change of [switchProject,B=>{B.state.project.dossier.evidence=[];}]){
  const {B,record,writes}=client({local:async()=>null,fetch:async B=>({ok:true,blob:async()=>{change(B);return new Blob(['old']);}})});
  Object.assign(record,{cloudKey:'key',cloudProjectId:'project-a'});await assert.rejects(B.evidenceGet(record.id),/đã đổi/);assert.equal(writes.length,0);
 }
});
test('unchanged project downloads and caches its own cloud attachment',async()=>{
 const {B,record,blob,writes}=client({local:async()=>null});Object.assign(record,{cloudKey:'key',cloudProjectId:'project-a'});
 assert.equal(await B.evidenceGet(record.id),blob);assert.equal(writes.length,1);assert.equal(writes[0].id,record.id);
});

test('reference-image hydration keeps its original project scope across encoding',async()=>{
 const source=fs.readFileSync('src/104_style_reference.js','utf8');
 for(const changed of [false,true]){
  const row={id:'image-1',kind:'image'},writes=[];
  const B={state:{project:{sourceRefs:[{id:row.id,cloudKey:'key'}]},ui:{step:1}},v6:{uploads:[row]},cloud:{epoch:1,config:{mediaConfigured:true}},projectMediaScope:async()=>'local-a',evidenceGet:async()=>new Blob(['image'],{type:'image/jpeg'}),styleReferenceStore:{get:async()=>null,put:async(id,data,options)=>writes.push({id,options})},render(){}};
  class FileReader{readAsDataURL(){queueMicrotask(()=>{if(changed){B.state.project={sourceRefs:[]};B.v6={uploads:[]};}this.result='data:image/jpeg;base64,aW1hZ2U=';this.onload();});}}
  vm.runInNewContext(source.slice(source.indexOf(' B.restoreStyleReferenceImages=async()=>{'),source.indexOf(' const restore=B.restoreProjectRuntime;')),{B,FileReader});
  await B.restoreStyleReferenceImages();assert.equal(writes.length,changed?0:1);
  if(changed){assert.equal(row.dataUrl,undefined);assert.equal(B.v6.upload,undefined);}else{assert.equal(writes[0].options.scope,'local-a');assert.equal(B.v6.upload,row);assert.match(row.dataUrl,/^data:image/);}
 }
});
