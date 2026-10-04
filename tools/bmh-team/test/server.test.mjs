import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,readFile,writeFile} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {EventEmitter} from 'node:events';
import http from 'node:http';
import {createTeamServer,twoAccountsReady} from '../server.mjs';
import {fixtureCatalog,fixtureSettings} from './model-fixtures.mjs';
import {saveModelSettings} from '../models.mjs';

class FakeWorker extends EventEmitter {
  constructor(id,email){super();this.id=id;this.account=email?{email,planType:'plus'}:null;this.loginInfo=null;this.logins=0;this.modelCatalog=fixtureCatalog();this.modelReads=0;}
  get publicState(){return {id:this.id,account:this.account,connected:true,login:this.loginInfo,error:null,modelCatalog:this.modelCatalog};}
  async refreshAccount(){return this.account;}
  async refreshModels(){this.modelReads++;return this.modelCatalog;}
  async login(){this.logins++;this.loginInfo={authUrl:'https://auth.openai.com/authorize?state=fixture',loginId:'fixture'};}
  async logout(){this.account=null;}
  close(){}
}
async function fixture(t,{emails=['one@example.test','two@example.test'],jobFactory}={}) {
  const stateRoot=await mkdtemp(path.join(os.tmpdir(),'bmh-http-'));
  const workers=emails.map((email,i)=>new FakeWorker(i?'two':'one',email));
  await saveModelSettings(stateRoot,fixtureSettings());
  const app=await createTeamServer({stateRoot,workers,codex:{command:'fixture'},git:'fixture',repoDefault:'/tmp/fixture-repo',jobFactory});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${app.server.address().port}`;
  t.after(async()=>{await app.close();await rm(stateRoot,{recursive:true,force:true});});
  const post=(route,body,extra={})=>fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json','X-BMH-Team':app.token,Origin:url,...extra},body:JSON.stringify(body)});
  return {app,url,workers,post,stateRoot};
}

test('local dashboard injects session token, bounds routes and exposes no credentials',async t=>{
  const f=await fixture(t);const index=await fetch(f.url+'/');assert.equal(index.status,200);const html=await index.text();
  assert.ok(html.includes(f.app.token));assert.ok(!html.includes('__BMH_TOKEN__'));
  assert.match(index.headers.get('content-security-policy'),/frame-ancestors 'none'/);
  const state=await (await fetch(f.url+'/api/state')).json();assert.equal(state.workers.length,2);assert.ok(!JSON.stringify(state).includes(f.app.token));
  assert.equal((await fetch(f.url+'/../core.mjs')).status,404);
});
test('cross-origin, missing token and DNS-rebinding requests cannot start a login',async t=>{
  const f=await fixture(t);
  assert.equal((await f.post('/api/login',{worker:'one'},{Origin:'https://other.example'})).status,403);
  assert.equal((await f.post('/api/login',{worker:'one'},{'X-BMH-Team':''})).status,403);
  const rebound=await new Promise((resolve,reject)=>{const req=http.request(f.url+'/api/login',{method:'POST',headers:{Host:'other.example','Content-Type':'application/json','X-BMH-Team':f.app.token}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);req.end(JSON.stringify({worker:'one'}));});
  assert.equal(rebound,403);
  assert.equal(f.workers[0].logins,0);
});
test('official browser login is started for a selected account, one browser callback at a time',async t=>{
  const f=await fixture(t);assert.equal((await f.post('/api/login',{worker:'one'})).status,200);
  assert.equal((await f.post('/api/login',{worker:'two'})).status,400);
  assert.equal((await f.post('/api/login',{worker:'two',device:true})).status,400);
  assert.equal(f.workers[1].logins,0);
  f.workers[0].loginInfo=null;
  assert.equal((await f.post('/api/login',{worker:'two'})).status,200);
  assert.equal(f.workers[1].logins,1);
});
test('same or missing email cannot masquerade as two separate ChatGPT accounts',()=>{
  assert.throws(()=>twoAccountsReady([{account:{email:'A@example.test'}},{account:{email:' a@example.test '}}]),/cùng email/);
  assert.throws(()=>twoAccountsReady([{account:{email:'A@example.test'}},{account:null}]),/cả hai/);
  assert.throws(()=>twoAccountsReady([{account:{email:'A@example.test'},identity:'same-user'},{account:{email:'B@example.test'},identity:'same-user'}]),/cùng email hoặc tài khoản/);
});
test('one objective starts only one job and accounts cannot switch while it works',async t=>{
  let count=0,resolveJob;
  const f=await fixture(t,{jobFactory:()=>({publicState:{id:'fixture-job',status:'working',events:[]},start(){count++;return new Promise(resolve=>resolveJob=resolve);},async stop(){this.publicState.status='stopped';resolveJob?.();},note(){}})});
  assert.equal((await f.post('/api/run',{repo:'/tmp/fixture-repo',goal:'Upgrade measured rooms'})).status,202);
  assert.equal((await f.post('/api/run',{repo:'/tmp/fixture-repo',goal:'Other goal'})).status,400);
  assert.equal((await f.post('/api/logout',{worker:'one'})).status,400);assert.equal(count,1);
  assert.equal((await f.post('/api/stop',{})).status,200);assert.equal(f.app.state().run.status,'stopped');
});
test('two concurrent run requests cannot create overlapping jobs',async t=>{
  let count=0,resolveJob;
  const f=await fixture(t,{jobFactory:()=>({publicState:{id:'fixture-job',status:'working',events:[]},start(){count++;return new Promise(resolve=>resolveJob=resolve);},async stop(){this.publicState.status='stopped';resolveJob?.();},note(){}})});
  const pending=await Promise.all([f.post('/api/run',{repo:'/tmp/fixture-repo',goal:'First goal'}),f.post('/api/run',{repo:'/tmp/fixture-repo',goal:'Second goal'})]);
  assert.deepEqual(pending.map(r=>r.status).sort(),[202,400]);assert.equal(count,1);await f.post('/api/stop',{});
});

test('source modes are explicit and invalid values cannot start a job or request offline execution',async t=>{
  const selected=[];
  const f=await fixture(t,{jobFactory:options=>{selected.push(options);return {publicState:{id:'fixture-source',status:'ready'},start:async()=>{},stop:async()=>{}};}});
  const state=await (await fetch(f.url+'/api/state')).json();assert.equal(state.version,'1.1.2');assert.equal(state.sourceModeDefault,'fetch');
  assert.deepEqual(state.sourceModeOptions.map(item=>item.id),['fetch','desktop']);
  for(const mode of ['offline','fixture',false,null])assert.equal((await f.post('/api/run',{repo:'/tmp/fixture-repo',goal:'Use source safely',sourceMode:mode})).status,400);
  assert.equal(selected.length,0);
  assert.equal((await f.post('/api/run',{repo:'/tmp/fixture-repo',goal:'Use direct Git',fetch:false})).status,202);
  assert.equal(selected[0].sourceMode,'fetch');assert.equal(selected[0].fetch,undefined);
  assert.equal((await f.post('/api/run',{repo:'/tmp/fixture-repo',goal:'Use Desktop snapshot',sourceMode:'desktop'})).status,202);
  assert.equal(selected[1].sourceMode,'desktop');assert.equal(selected[1].modelSettings.one.model,'gpt-6.1-sol');
});

test('bundled GitHub Desktop Git suggests Desktop mode without changing API default or auth',async t=>{
  const stateRoot=await mkdtemp(path.join(os.tmpdir(),'bmh-source-default-'));
  const workers=[new FakeWorker('one','one@example.test'),new FakeWorker('two','two@example.test')];
  const app=await createTeamServer({stateRoot,workers,codex:{command:'fixture'},git:'C:\\Users\\fixture\\AppData\\Local\\GitHubDesktop\\app-3.5.0\\resources\\app\\git\\cmd\\git.exe'});
  t.after(async()=>{await app.close();await rm(stateRoot,{recursive:true,force:true});});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  assert.equal(app.state().sourceModeDefault,'desktop');assert.equal(workers[0].logins,0);assert.equal(workers[1].logins,0);
});
test('model selection is authenticated, validated, saved separately and restored after restart',async t=>{
  const f=await fixture(t);const selection={worker:'one',model:'gpt-6-astra',reasoningEffort:'xhigh'};
  assert.equal((await f.post('/api/settings',selection,{'X-BMH-Team':''})).status,403);
  assert.equal((await f.post('/api/settings',{...selection,model:'not-supported'})).status,400);
  assert.equal((await f.post('/api/settings',{...selection,worker:'other'})).status,400);
  const response=await f.post('/api/settings',selection);assert.equal(response.status,200);
  const updated=await response.json();assert.equal(updated.state.workers[0].modelSettings.model,'gpt-6-astra');
  assert.equal(updated.state.busy,false);assert.equal(updated.state.settingsRevision,1);
  assert.equal(f.workers[0].account.email,'one@example.test');assert.equal(f.workers[0].logins,0);
  const saved=JSON.parse(await readFile(path.join(f.stateRoot,'model-settings.json'),'utf8'));
  assert.equal(saved.workers.one.model,'gpt-6-astra');assert.equal(saved.workers.two.model,'gpt-6.1-sol');
  const other=await createTeamServer({stateRoot:f.stateRoot,workers:[new FakeWorker('one','one@example.test'),new FakeWorker('two','two@example.test')],codex:{command:'fixture'},git:'fixture'});
  assert.deepEqual(other.state().workers[0].modelSettings,{model:'gpt-6-astra',reasoningEffort:'xhigh'});
  assert.equal(JSON.stringify(other.state()).includes('access_token'),false);
});
test('job receives both saved choices and rejects model changes until the job ends',async t=>{
  let options,resolveJob;
  const f=await fixture(t,{jobFactory:args=>{options=args;return {publicState:{id:'models-job',status:'working',modelSettings:args.modelSettings,events:[]},start(){return new Promise(resolve=>resolveJob=resolve);},async stop(){this.publicState.status='stopped';resolveJob?.();},note(){}};}});
  await f.post('/api/settings',{worker:'one',model:'gpt-6-astra',reasoningEffort:'xhigh'});
  await f.post('/api/settings',{worker:'two',model:'gpt-6.1-sol',reasoningEffort:'medium'});
  const started=await f.post('/api/run',{repo:'/tmp/fixture-repo',goal:'Measured design with chosen models'});assert.equal(started.status,202);
  assert.deepEqual(options.modelSettings,{one:{model:'gpt-6-astra',reasoningEffort:'xhigh'},two:{model:'gpt-6.1-sol',reasoningEffort:'medium'}});
  assert.equal((await f.post('/api/settings',{worker:'one',model:'gpt-6-sol',reasoningEffort:'high'})).status,400);
  assert.equal(f.app.state().run.modelSettings.one.model,'gpt-6-astra');
  await f.post('/api/stop',{});
  assert.equal((await f.post('/api/settings',{worker:'one',model:'gpt-6.1-sol',reasoningEffort:'high'})).status,200);
  assert.equal(options.modelSettings.one.model,'gpt-6-astra');
});
test('corrupt persisted model settings block a run until a visible choice is saved',async t=>{
  const root=await mkdtemp(path.join(os.tmpdir(),'bmh-bad-settings-'));t.after(()=>rm(root,{recursive:true,force:true}));
  await writeFile(path.join(root,'model-settings.json'),'broken JSON');
  const app=await createTeamServer({stateRoot:root,workers:[new FakeWorker('one','one@example.test'),new FakeWorker('two','two@example.test')],codex:{command:'fixture'},git:'fixture'});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));t.after(()=>app.close());
  const url=`http://127.0.0.1:${app.server.address().port}`;
  const post=(route,body)=>fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json','X-BMH-Team':app.token},body:JSON.stringify(body)});
  assert.match(app.state().settingsWarning,/Chọn lại/);
  assert.equal((await post('/api/run',{repo:'/tmp/fixture',goal:'Measured upgrade'})).status,400);
  assert.equal((await post('/api/settings',{worker:'one',model:'gpt-6.1-sol',reasoningEffort:'high'})).status,200);
  assert.equal(app.state().settingsWarning,null);
});

test('a fresh account catalog rejects old saved models before creating any Git job',async t=>{
  let jobs=0;
  const f=await fixture(t,{jobFactory:()=>{jobs++;throw Error('Should not create a worktree job');}});
  const before=await readFile(path.join(f.stateRoot,'model-settings.json'),'utf8');
  f.workers[0].refreshModels=async options=>{
    assert.equal(options.force,true);f.workers[0].modelReads++;
    f.workers[0].modelCatalog.options=f.workers[0].modelCatalog.options.filter(x=>x.id!=='gpt-6.1-sol');
    return f.workers[0].modelCatalog;
  };
  const response=await f.post('/api/run',{repo:'/tmp/fixture-repo',goal:'Upgrade actual customer design'});
  assert.equal(response.status,400);assert.match((await response.json()).error,/không có trong danh sách/);
  assert.equal(jobs,0);assert.equal(f.app.state().run,null);assert.equal(f.app.state().busy,false);
  assert.equal(f.app.state().workers[0].modelSettings.model,'gpt-6.1-sol');
  assert.match(f.app.state().workers[0].modelSettingsWarning,/không có trong danh sách/);
  assert.equal(await readFile(path.join(f.stateRoot,'model-settings.json'),'utf8'),before);
});

test('authenticated model refresh and settings are scoped to one account and its supported effort pair',async t=>{
  const f=await fixture(t);const before=await readFile(path.join(f.stateRoot,'model-settings.json'),'utf8');
  assert.equal((await f.post('/api/models',{worker:'one'},{'X-BMH-Team':''})).status,403);
  assert.equal((await f.post('/api/models',{worker:'other'})).status,400);
  f.workers[0].modelCatalog.options=f.workers[0].modelCatalog.options.filter(x=>x.id==='gpt-6-astra');
  f.workers[0].modelCatalog.options[0].efforts=[{id:'xhigh',label:'Extra High'}];
  const response=await f.post('/api/models',{worker:'one'});assert.equal(response.status,200);
  const state=(await response.json()).state;
  assert.equal(state.workers[0].modelCatalog.options.length,1);assert.equal(state.workers[1].modelCatalog.options.length,3);
  assert.equal(f.workers[0].modelReads,1);assert.equal(f.workers[1].modelReads,0);
  assert.equal(await readFile(path.join(f.stateRoot,'model-settings.json'),'utf8'),before);
  assert.equal((await f.post('/api/settings',{worker:'one',model:'gpt-6.1-sol',reasoningEffort:'high'})).status,400);
  assert.equal((await f.post('/api/settings',{worker:'one',model:'gpt-6-astra',reasoningEffort:'high'})).status,400);
  assert.equal((await f.post('/api/settings',{worker:'one',model:'gpt-6-astra',reasoningEffort:'xhigh'})).status,200);
  assert.equal(f.app.state().workers[0].modelSettingsWarning,null);
});

test('stop during model discovery cannot create a job after the discovery finishes',async t=>{
  let jobs=0,release,entered;
  const ready=new Promise(resolve=>entered=resolve);const gate=new Promise(resolve=>release=resolve);
  const f=await fixture(t,{jobFactory:()=>{jobs++;throw Error('Should not create a worktree job');}});
  f.workers[0].refreshModels=async()=>{entered();await gate;return f.workers[0].modelCatalog;};
  const request=f.post('/api/run',{repo:'/tmp/fixture-repo',goal:'Upgrade after discovery'});
  await ready;assert.equal((await f.post('/api/models',{worker:'two'})).status,400);
  assert.equal((await f.post('/api/stop',{})).status,200);release();
  assert.equal((await request).status,400);assert.equal(jobs,0);assert.equal(f.app.state().run,null);
});
