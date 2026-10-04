import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {PassThrough,Writable} from 'node:stream';
import {mkdtemp,rm,readFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {CodexWorker,isolatedEnvironment,scrub} from '../core.mjs';

function fakeServer({email='one@example.test',failTurn=false,delayTurn=false}={}) {
  const requests=[];const child=new EventEmitter();child.stdout=new PassThrough();child.stderr=new PassThrough();child.killed=false;
  const send=message=>queueMicrotask(()=>child.stdout.write(JSON.stringify(message)+'\n'));
  child.kill=()=>{child.killed=true;queueMicrotask(()=>child.emit('exit',0));};
  child.stdin=new Writable({write(chunk,_encoding,done){
    for(const line of chunk.toString().trim().split('\n')){
      const m=JSON.parse(line);requests.push(m);
      if(m.id && m.method){
        let result={};
        if(m.method==='account/read')result={account:{type:'chatgpt',email,planType:'plus'},requiresOpenaiAuth:true};
        if(m.method==='account/login/start')result=m.params.type==='chatgptDeviceCode'?{loginId:'login',type:'chatgptDeviceCode',verificationUrl:'https://auth.openai.com/codex/device',userCode:'ABCD-1234'}:{loginId:'login',type:'chatgpt',authUrl:'https://auth.openai.com/authorize?state=fixture'};
        if(m.method==='thread/start')result={thread:{id:'thread'}};
        if(m.method==='turn/start')result={turn:{id:'turn'}};
        send({id:m.id,result});
        if(m.method==='turn/start' && !delayTurn){
          send({method:'item/completed',params:{threadId:'other-thread',turnId:'turn',item:{type:'agentMessage',phase:'final_answer',text:'must ignore'}}});
          send({method:'item/completed',params:{threadId:'thread',turnId:'turn',item:{type:'agentMessage',phase:'final_answer',text:'actual completed answer'}}});
          send({method:'turn/completed',params:{threadId:'thread',turn:{id:'turn',status:failTurn?'failed':'completed'}}});
        }
      }
    }
    done();
  }});
  return {child,requests,send};
}

async function workerFixture(t,options={}) {
  const root=await mkdtemp(path.join(os.tmpdir(),'bmh-rpc-'));const fake=fakeServer(options);const calls=[];
  const worker=new CodexWorker({id:'one',stateRoot:root,codex:{command:'fixture',prefix:[]},spawnImpl:(...args)=>{calls.push(args);return fake.child;}});
  t.after(async()=>{worker.close();await rm(root,{recursive:true,force:true});});
  return {root,worker,calls,...fake};
}

test('account homes isolate auth and remove inherited billable/API credentials',()=>{
  const env=isolatedEnvironment('/tmp/account-one',{PATH:'local-path',CODEX_HOME:'/existing',CODEX_ACCESS_TOKEN:'private',CODEX_SQLITE_HOME:'/shared',OPENAI_API_KEY:'private',CODEX_API_KEY:'private',OPENAI_BASE_URL:'custom'});
  assert.equal(env.CODEX_HOME,'/tmp/account-one');assert.equal(env.PATH,'local-path');
  for(const key of ['CODEX_ACCESS_TOKEN','CODEX_SQLITE_HOME','OPENAI_API_KEY','CODEX_API_KEY','OPENAI_BASE_URL'])assert.equal(env[key],undefined);
});
test('managed auth initialization exposes only account email and plan',async t=>{
  const f=await workerFixture(t);await f.worker.start();
  assert.deepEqual(f.worker.publicState.account,{email:'one@example.test',planType:'plus'});
  const init=f.requests.find(x=>x.method==='initialize');assert.equal(init.params.clientInfo.name,'bmh_team');
  assert.ok(f.calls[0][2].env.CODEX_HOME.endsWith(path.join('accounts','one')));
  assert.match(await readFile(path.join(f.root,'accounts','one','config.toml'),'utf8'),/forced_login_method = "chatgpt"/);
  const twoHome=isolatedEnvironment(path.join(f.root,'accounts','two'));assert.notEqual(twoHome.CODEX_HOME,f.calls[0][2].env.CODEX_HOME);
});
test('login uses official managed browser or device flow without passing tokens',async t=>{
  const f=await workerFixture(t);await f.worker.login();assert.match(f.worker.publicState.login.authUrl,/^https:\/\/auth.openai.com\//);
  await f.worker.login(true);assert.equal(f.worker.publicState.login.userCode,'ABCD-1234');
  assert.ok(f.requests.some(x=>x.method==='account/login/cancel'));
  assert.ok(!JSON.stringify(f.requests).includes('chatgptAuthTokens'));
});
test('completed turn is thread-scoped and preserves sandbox boundaries/schema',async t=>{
  const f=await workerFixture(t);const schema={type:'object'};
  const output=await f.worker.run('task',{cwd:f.root,readOnly:true,outputSchema:schema,timeoutMs:1000});assert.equal(output,'actual completed answer');
  const thread=f.requests.find(x=>x.method==='thread/start');assert.equal(thread.params.sandbox,'read-only');assert.equal(thread.params.approvalPolicy,'never');
  assert.deepEqual(f.requests.find(x=>x.method==='turn/start').params.outputSchema,schema);
});
test('failed turn and stop are never converted into completed work',async t=>{
  const f=await workerFixture(t,{failTurn:true});await assert.rejects(f.worker.run('task',{cwd:f.root,timeoutMs:1000}),/chưa hoàn thành/);
  const waiting=await workerFixture(t,{delayTurn:true});const run=waiting.worker.run('task',{cwd:waiting.root,timeoutMs:2000});
  await new Promise(resolve=>setTimeout(resolve,10));await waiting.worker.interrupt();await assert.rejects(run,/đã dừng/);
});
test('permission/command requests are denied with appropriate protocol responses',async t=>{
  const f=await workerFixture(t);await f.worker.start();
  f.worker.receive({id:501,method:'item/permissions/requestApproval',params:{}});
  f.worker.receive({id:502,method:'item/commandExecution/requestApproval',params:{}});
  assert.deepEqual(f.requests.find(x=>x.id===501).result,{permissions:{},scope:'turn'});
  assert.equal(f.requests.find(x=>x.id===502).result.decision,'decline');
});
test('secret-like data is redacted from public errors',()=>{
  const message=scrub('authorization=BearerPrivate access_token=private refresh_token=private sk-abcdefghijk123456789');
  assert.ok(!message.includes('BearerPrivate'));assert.ok(!message.includes('=private'));assert.ok(!message.includes('sk-abcdefgh'));
});
