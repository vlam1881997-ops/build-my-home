import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import os from 'node:os';import path from 'node:path';
import {CodexWorker} from '../core.mjs';

// Real child-process protocol fixture. No network or model inference is used.
const cli=String.raw`
import {createInterface} from 'node:readline';
import {appendFile} from 'node:fs/promises';import path from 'node:path';
const home=process.env.CODEX_HOME,mode=process.env.BMH_CATALOG_CASE;
const send=async value=>{
 const line=JSON.stringify(value)+'\n';
 process.stdout.write(line.slice(0,11));await new Promise(resolve=>setTimeout(resolve,2));process.stdout.write(line.slice(11));
};
const model=(name,efforts=['medium','high'])=>({id:name,model:name,displayName:name,hidden:false,isDefault:true,defaultReasoningEffort:efforts[0],supportedReasoningEfforts:efforts.map(reasoningEffort=>({reasoningEffort,description:'Fixture'}))});
let initialized=false;
for await(const line of createInterface({input:process.stdin})) {
 const request=JSON.parse(line);await appendFile(path.join(home,'rpc-fixture.log'),JSON.stringify(request)+'\n');
 if(request.method==='initialize'){initialized=true;await send({id:request.id,result:{userAgent:'fixture'}});continue;}
 if(request.method==='initialized')continue;
 if(!initialized || request.method!=='model/list')process.exit(4);
 if(mode==='hang'){setInterval(()=>{},1000);await new Promise(()=>{});}
 if(mode==='early-exit')process.exit(0);
 if(mode==='malformed'){process.stdout.write('null\n');continue;}
 if(mode==='error'){await send({id:request.id,error:{code:-32600,message:'access_token=fixture-private-value model/list denied'}});continue;}
 if(mode==='repeat-cursor'){await send({id:request.id,result:{data:[model('fixture-one')],nextCursor:'repeat'}});continue;}
 const isTwo=path.basename(home)==='two';
 const first=model(isTwo?'fixture-account-two':'fixture-account-one',isTwo?['low','medium']:['high','xhigh']);
 const paginated=mode==='pagination';
 await send({method:'irrelevant/notification',params:{value:'ignored'}});
 await send({id:request.id,result:{data:[request.params.cursor?model('fixture-page-two'):first],nextCursor:paginated && !request.params.cursor?'next-page':null}});
}
process.exit(mode==='nonzero'?1:0);
`;

async function fixture(t,{mode='complete',id='one',timeoutMs=1500}={}) {
  const stateRoot=await mkdtemp(path.join(os.tmpdir(),'bmh-catalog-'));
  const script=path.join(stateRoot,'catalog-cli.mjs');await writeFile(script,cli);
  const calls=[];
  const worker=new CodexWorker({id,stateRoot,codex:{command:process.execPath,prefix:[script]},modelTimeoutMs:timeoutMs,spawnImpl:(command,args,options)=>{
    calls.push({args,env:options.env});return spawn(command,args,{...options,env:{...options.env,BMH_CATALOG_CASE:mode}});
  }});
  worker.account={email:id+'@example.test',planType:'plus'};worker.identity=id;
  t.after(async()=>{await worker.close();await rm(stateRoot,{recursive:true,force:true});});
  return {worker,calls,home:worker.home};
}

test('each account reads its own model/effort catalog with initialize and read-only model/list',async t=>{
  const one=await fixture(t),two=await fixture(t,{id:'two'});
  await Promise.all([one.worker.refreshModels(),two.worker.refreshModels()]);
  assert.equal(one.worker.modelCatalog.options[0].id,'fixture-account-one');assert.equal(two.worker.modelCatalog.options[0].id,'fixture-account-two');
  assert.deepEqual(one.worker.modelCatalog.options[0].efforts.map(x=>x.id),['high','xhigh']);assert.deepEqual(two.worker.modelCatalog.options[0].efforts.map(x=>x.id),['low','medium']);
  for(const f of [one,two]){
    const requests=(await readFile(path.join(f.home,'rpc-fixture.log'),'utf8')).trim().split('\n').map(JSON.parse);
    assert.deepEqual(requests.map(x=>x.method),['initialize','initialized','model/list']);
    assert.equal(requests[2].params.includeHidden,false);assert.equal(f.calls[0].env.CODEX_HOME,f.home);
    assert.ok(!f.calls[0].args.includes('exec'));assert.equal(f.worker.processes.size,0);
    const count=f.calls.length;await f.worker.refreshModels();assert.equal(f.calls.length,count);
    await f.worker.refreshModels({force:true});assert.equal(f.calls.length,count+1);
  }
});
test('fragmented stdout, notifications and pagination produce one bounded visible catalog',async t=>{
  const f=await fixture(t,{mode:'pagination'});await f.worker.refreshModels();
  assert.deepEqual(f.worker.modelCatalog.options.map(x=>x.id),['fixture-account-one','fixture-page-two']);
  assert.equal(f.worker.modelCatalog.status,'ready');assert.ok(f.worker.modelCatalog.updatedAt);
});
test('RPC error, malformed result, early exit, repeated cursor and nonzero process cannot advertise ready models',async t=>{
  for(const mode of ['error','malformed','early-exit','repeat-cursor','nonzero']){
    const f=await fixture(t,{mode});await assert.rejects(f.worker.refreshModels());
    assert.equal(f.worker.modelCatalog.status,'error');assert.deepEqual(f.worker.modelCatalog.options,[]);
    assert.ok(!JSON.stringify(f.worker.publicState).includes('fixture-private-value'));assert.equal(f.worker.processes.size,0);
  }
});
test('a hung discovery is bounded and closing cancels the account process without inference',async t=>{
  const hung=await fixture(t,{mode:'hang',timeoutMs:100});await assert.rejects(hung.worker.refreshModels());assert.equal(hung.worker.modelCatalog.status,'error');
  const f=await fixture(t,{mode:'hang'});const pending=f.worker.refreshModels();
  const rejected=assert.rejects(pending);await new Promise(resolve=>setTimeout(resolve,30));await f.worker.close();await rejected;
  assert.equal(f.worker.processes.size,0);assert.ok(!f.calls.some(call=>call.args.includes('exec')));
});
test('missing account or unavailable selection stops before an inference process starts',async t=>{
  const f=await fixture(t);f.worker.account=null;await assert.rejects(f.worker.refreshModels(),/Đăng nhập/);assert.equal(f.calls.length,0);
  f.worker.account={email:'one@example.test'};await f.worker.refreshModels();const count=f.calls.length;
  await assert.rejects(f.worker.run('task',{cwd:f.home,model:'gpt-6.1-sol',reasoningEffort:'xhigh'}),/không có trong danh sách/);
  await assert.rejects(f.worker.run('task',{cwd:f.home,model:'fixture-account-one',reasoningEffort:'medium'}),/không hỗ trợ/);
  await assert.rejects(f.worker.run('task',{cwd:f.home}),/Model/);
  assert.equal(f.calls.length,count);
});
