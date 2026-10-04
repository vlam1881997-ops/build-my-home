import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {EventEmitter} from 'node:events';
import http from 'node:http';
import {createTeamServer,twoAccountsReady} from '../server.mjs';

class FakeWorker extends EventEmitter {
  constructor(id,email){super();this.id=id;this.account=email?{email,planType:'plus'}:null;this.loginInfo=null;this.logins=0;}
  get publicState(){return {id:this.id,account:this.account,connected:true,login:this.loginInfo,error:null};}
  async refreshAccount(){return this.account;}
  async login(){this.logins++;this.loginInfo={authUrl:'https://auth.openai.com/authorize?state=fixture',loginId:'fixture'};}
  async logout(){this.account=null;}
  close(){}
}
async function fixture(t,{emails=['one@example.test','two@example.test'],jobFactory}={}) {
  const stateRoot=await mkdtemp(path.join(os.tmpdir(),'bmh-http-'));
  const workers=emails.map((email,i)=>new FakeWorker(i?'two':'one',email));
  const app=await createTeamServer({stateRoot,workers,codex:{command:'fixture'},git:'fixture',repoDefault:'/tmp/fixture-repo',jobFactory});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const url=`http://127.0.0.1:${app.server.address().port}`;
  t.after(async()=>{await app.close();await rm(stateRoot,{recursive:true,force:true});});
  const post=(route,body,extra={})=>fetch(url+route,{method:'POST',headers:{'Content-Type':'application/json','X-BMH-Team':app.token,Origin:url,...extra},body:JSON.stringify(body)});
  return {app,url,workers,post};
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
  assert.equal((await f.post('/api/login',{worker:'two',device:true})).status,200);
  assert.equal(f.workers[1].logins,1);
});
test('same or missing email cannot masquerade as two separate ChatGPT accounts',()=>{
  assert.throws(()=>twoAccountsReady([{account:{email:'A@example.test'}},{account:{email:' a@example.test '}}]),/cùng email/);
  assert.throws(()=>twoAccountsReady([{account:{email:'A@example.test'}},{account:null}]),/cả hai/);
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
