import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {CodexWorker,isolatedEnvironment,scrub} from '../core.mjs';
import {fixtureCatalog} from './model-fixtures.mjs';

const fakeAuth=(email='one@example.test',subject=email)=>({auth_mode:'chatgpt',tokens:{id_token:'eyJmaXh0dXJlIjp0cnVlfQ.'+Buffer.from(JSON.stringify({sub:subject,email,'https://api.openai.com/auth':{chatgpt_plan_type:'plus'}})).toString('base64url')+'.not-a-real-signature',access_token:'fixture-access-never-public',refresh_token:'fixture-refresh-never-public'}});

// A real spawned process exercises CLI arguments, stdout/stderr, stdin, output
// files, nonzero exits and termination. It never sends a model/network request.
const fixtureCli=String.raw`
import {readFile,writeFile,unlink} from 'node:fs/promises';
import path from 'node:path';
const args=process.argv.slice(2), home=process.env.CODEX_HOME;
const mode=process.env.BMH_TEST_CASE || 'complete';
const authFile=path.join(home,'auth.json');
if(args[0]==='app-server') {
  const {createInterface}=await import('node:readline');
  for await(const line of createInterface({input:process.stdin})) {
    const request=JSON.parse(line);
    if(request.method==='initialize')process.stdout.write(JSON.stringify({id:request.id,result:{userAgent:'fixture'}})+'\n');
    if(request.method==='model/list')process.stdout.write(JSON.stringify({id:request.id,result:{data:['gpt-6.1-sol','gpt-6-astra','gpt-6-sol'].map(model=>({id:model,model,displayName:model,hidden:false,isDefault:model==='gpt-6.1-sol',defaultReasoningEffort:'medium',supportedReasoningEfforts:['medium','high','xhigh'].map(reasoningEffort=>({reasoningEffort,description:'Fixture'}))})),nextCursor:null}})+'\n');
  }
  process.exit(0);
}
if(args[0]==='login' && args[1]==='status') {
  let auth;try{auth=JSON.parse(await readFile(authFile,'utf8'));}catch{}
  process.stderr.write(auth?'Logged in using '+(auth.auth_mode==='chatgpt'?'ChatGPT':'an API key')+'\n':'Not logged in\n');
  process.exit(auth?0:1);
}
if(args[0]==='login') {
  process.stderr.write('Opening browser...\nhttps://auth.openai.com/oauth/authorize?state=fixture');
  process.stderr.write('&client_id=fixture\n');
  await new Promise(resolve=>setTimeout(resolve,150));
  await writeFile(authFile,JSON.stringify(JSON.parse(await readFile(path.join(home,'fixture-auth.json'),'utf8'))));
  process.exit(0);
}
if(args[0]==='logout'){await unlink(authFile).catch(()=>{});process.exit(0);}
if(args.includes('exec')) {
  let input='';for await(const chunk of process.stdin)input+=chunk;
  const schemaAt=args.indexOf('--output-schema');
  const schema=schemaAt>=0?JSON.parse(await readFile(args[schemaAt+1],'utf8')):null;
  const output=args[args.indexOf('--output-last-message')+1];
  const send=event=>process.stdout.write(JSON.stringify(event)+'\n');
  send({type:'thread.started',thread_id:'fixture'});
  send({type:'item.started',item:{id:'initial',type:'command_execution',command:'fixture'}});
  if(mode==='hang'){setInterval(()=>{},1000);}
  else if(mode==='heartbeat-only') {
    setInterval(()=>{
      send({type:'heartbeat',at:Date.now()});
      send({type:'item.started',item:{id:'initial',type:'command_execution',command:'fixture'}});
      process.stdout.write('not a Codex JSON event\n');
      process.stderr.write('CLI heartbeat, no model progress\n');
    },50);
  }
  else {
    if(mode==='activity' || mode==='continuous-activity') {
      let count=0;
      const timer=setInterval(()=>send({type:'item.completed',item:{id:'active-'+(++count),type:'command_execution',command:'git diff',status:'completed',exit_code:0}}),100);
      if(mode==='continuous-activity')await new Promise(()=>{});
      await new Promise(resolve=>setTimeout(resolve,1500));clearInterval(timer);
    }
    await writeFile(output,JSON.stringify({prompt:input,schema,sandbox:args[args.indexOf('--sandbox')+1],approval:args[args.indexOf('-a')+1],cwd:args[args.indexOf('--cd')+1],model:args[args.indexOf('--model')+1],reasoning:args[args.indexOf('-c')+1]}));
    if(mode==='progress-redaction') {
      send({type:'item.started',item:{id:'safe-command',type:'command_execution',command:'/bin/bash -lc "git diff --token ghp_abcdefghijklmnopqrstuvwxyz123456"'}});
      send({type:'item.completed',item:{id:'files',type:'file_change',changes:[{path:'src/layout.js',kind:'update'},{path:'src/ghp_abcdefghijklmnopqrstuvwxyz123456.js',kind:'update'}]}});
    }
    send({type:'item.completed',item:{type:'agent_message',text:'Đã hoàn thành phần được giao.'}});
    if(mode==='failed-turn')send({type:'turn.failed',error:{message:'fixture turn failed'}});
    else if(mode!=='missing-completion')send({type:'turn.completed',usage:{output_tokens:4}});
    if(mode==='quota')process.stderr.write('429 usage limit reached\n');
    if(mode==='unsupported-model')process.stderr.write('The selected model is not available for this account\n');
    if(mode==='secret-error')process.stderr.write('authorization=Bearer private-value refresh_token="fixture-secret"\n');
    process.exit(['nonzero','quota','secret-error','unsupported-model'].includes(mode)?1:0);
  }
}
`;

async function workerFixture(t,{mode='complete',loggedIn=true,auth=fakeAuth(),loginTimeoutMs=1000}={}) {
  const root=await mkdtemp(path.join(os.tmpdir(),'bmh-cli-'));
  const script=path.join(root,'fixture-cli.mjs');await writeFile(script,fixtureCli);
  const home=path.join(root,'accounts','one');await mkdir(home,{recursive:true});
  await writeFile(path.join(home,'fixture-auth.json'),JSON.stringify(auth));
  if(loggedIn)await writeFile(path.join(home,'auth.json'),JSON.stringify(auth));
  const calls=[];
  const worker=new CodexWorker({id:'one',stateRoot:root,codex:{command:process.execPath,prefix:[script]},loginTimeoutMs,spawnImpl:(command,args,options)=>{
    calls.push({command,args,options});return spawn(command,args,{...options,env:{...options.env,BMH_TEST_CASE:mode}});
  }});
  worker.modelCatalog=fixtureCatalog();
  t.after(async()=>{await worker.close();await rm(root,{recursive:true,force:true});});
  return {root,home,worker,calls};
}

const runSelected=(worker,prompt,options={})=>worker.run(prompt,{model:'gpt-6.1-sol',reasoningEffort:'high',...options});

const waitFor=async(predicate)=>{for(let i=0;i<100 && !predicate();i++)await new Promise(resolve=>setTimeout(resolve,10));assert.ok(predicate(),'fixture timed out');};

test('isolated account environments exclude API billing keys and shared state',()=>{
  const env=isolatedEnvironment('/tmp/account-one',{PATH:'local-path',CODEX_HOME:'/existing',CODEX_ACCESS_TOKEN:'private',CODEX_SQLITE_HOME:'/shared',OPENAI_API_KEY:'private',CODEX_API_KEY:'private',OPENAI_BASE_URL:'custom',NODE_OPTIONS:'untrusted',GEMINI_API_KEY:'private'});
  assert.equal(env.CODEX_HOME,'/tmp/account-one');assert.equal(env.PATH,'local-path');
  for(const key of ['CODEX_ACCESS_TOKEN','CODEX_SQLITE_HOME','OPENAI_API_KEY','CODEX_API_KEY','OPENAI_BASE_URL','NODE_OPTIONS','GEMINI_API_KEY'])assert.equal(env[key],undefined);
});
test('stable login status exposes only account label from its own private cache',async t=>{
  const f=await workerFixture(t);await f.worker.start();
  assert.deepEqual(f.worker.publicState.account,{email:'one@example.test',planType:'plus'});
  assert.equal(f.worker.publicState.connected,true);
  assert.ok(f.calls.every(call=>call.options.env.CODEX_HOME===f.home));
  assert.deepEqual(f.calls[0].args.slice(1),['login','status']);
  assert.match(await readFile(path.join(f.home,'config.toml'),'utf8'),/forced_login_method = "chatgpt"/);
  assert.ok(!JSON.stringify(f.worker.publicState).includes('fixture-access'));
  assert.ok(!JSON.stringify(f.worker.publicState).includes('not-a-real-signature'));
  assert.equal(typeof f.worker.identity,'string');assert.ok(!JSON.stringify(f.worker.publicState).includes(f.worker.identity));
});
test('API auth or absent/unreadable account metadata cannot masquerade as ChatGPT',async t=>{
  for(const auth of [{auth_mode:'api',OPENAI_API_KEY:'fixture-api'}, {auth_mode:'chatgpt',tokens:{id_token:'invalid'}}]) {
    const f=await workerFixture(t,{auth});await f.worker.start();assert.equal(f.worker.account,null);assert.equal(f.worker.publicState.connected,false);
  }
  const none=await workerFixture(t,{loggedIn:false});await none.worker.start();assert.equal(none.worker.account,null);assert.equal(none.worker.error,null);
});
test('browser login uses stable CLI login, confirms status after exit and logout removes only this account',async t=>{
  const f=await workerFixture(t,{loggedIn:false});await f.worker.login();
  assert.match(f.worker.publicState.login.authUrl,/^https:\/\/auth.openai.com\/oauth\/authorize\?/);
  assert.equal(f.worker.account,null);
  await waitFor(()=>Boolean(f.worker.account));assert.equal(f.worker.loginInfo,null);
  await f.worker.logout();assert.equal(f.worker.account,null);
  assert.ok(f.calls.some(call=>call.args.at(-1)==='logout'));
  assert.ok(f.calls.every(call=>!call.args.includes('--device-auth') && !call.args.includes('exec')));
  assert.ok(f.calls.some(call=>call.args.includes('app-server')));
});
test('exec uses stdin, explicit sandbox/approval, JSON schema and actual final output file',async t=>{
  const f=await workerFixture(t);const schema={type:'object',properties:{answer:{type:'string'}}};
  const progress=[];f.worker.on('progress',text=>progress.push(text));
  const output=JSON.parse(await runSelected(f.worker,'Bản vẽ tầng 2 — không mất vật liệu',{cwd:f.root,readOnly:true,outputSchema:schema,timeoutMs:2000}));
  assert.equal(output.prompt,'Bản vẽ tầng 2 — không mất vật liệu');assert.deepEqual(output.schema,schema);
  assert.equal(output.sandbox,'read-only');assert.equal(output.approval,'never');assert.equal(output.cwd,f.root);
  assert.equal(output.model,'gpt-6.1-sol');assert.equal(output.reasoning,'model_reasoning_effort="high"');
  const call=f.calls.find(call=>call.args.includes('exec'));
  assert.ok(call.args.includes('--ephemeral'));assert.ok(call.args.includes('--json'));
  assert.ok(!call.args.includes('--dangerously-bypass-approvals-and-sandbox'));
  assert.ok(!call.args.includes(output.prompt));assert.ok(progress.length>=2);
  assert.ok(!(await readdir(f.home)).some(file=>file.startsWith('run-')));
});
test('write tasks retain workspace-write sandbox',async t=>{
  const f=await workerFixture(t);const output=JSON.parse(await runSelected(f.worker,'task',{cwd:f.root}));assert.equal(output.sandbox,'workspace-write');
});
test('a chosen model and effort override defaults in the actual child process',async t=>{
  const f=await workerFixture(t);const authBefore=await readFile(path.join(f.home,'auth.json'),'utf8');
  const output=JSON.parse(await runSelected(f.worker,'Astra measured design',{cwd:f.root,model:'gpt-6-astra',reasoningEffort:'xhigh'}));
  assert.equal(output.model,'gpt-6-astra');assert.equal(output.reasoning,'model_reasoning_effort="xhigh"');
  assert.equal(output.sandbox,'workspace-write');assert.equal(await readFile(path.join(f.home,'auth.json'),'utf8'),authBefore);
});
test('invalid model input is rejected before any CLI or authentication process',async t=>{
  const f=await workerFixture(t);
  await assert.rejects(runSelected(f.worker,'task',{cwd:f.root,model:'gpt-6-astra --yolo'}),/Model/);
  await assert.rejects(runSelected(f.worker,'task',{cwd:f.root,reasoningEffort:'ultra;echo bad'}),/suy luận/);
  assert.equal(f.calls.length,0);assert.equal(f.worker.current,null);
});
test('an unsupported model stops once without a smaller model or another provider',async t=>{
  const f=await workerFixture(t,{mode:'unsupported-model'});
  await assert.rejects(runSelected(f.worker,'task',{cwd:f.root,model:'gpt-6-astra',reasoningEffort:'high'}),/chưa hỗ trợ model/);
  const calls=f.calls.filter(call=>call.args.includes('exec'));assert.equal(calls.length,1);
  assert.equal(calls[0].args[calls[0].args.indexOf('--model')+1],'gpt-6-astra');
});
test('nonzero exit, failed turn or missing completion never report completed work',async t=>{
  for(const mode of ['nonzero','failed-turn','missing-completion']) {
    const f=await workerFixture(t,{mode});await assert.rejects(runSelected(f.worker,'task',{cwd:f.root}),/chưa hoàn thành/);assert.equal(f.worker.current,null);
  }
});
test('Stop cancels a real running CLI process and releases the worker',async t=>{
  const f=await workerFixture(t,{mode:'hang'});
  const run=runSelected(f.worker,'task',{cwd:f.root,timeoutMs:5000});const stopped=assert.rejects(run,/đã dừng/);
  await waitFor(()=>Boolean(f.worker.child));const child=f.worker.child;
  await f.worker.interrupt();assert.ok(child.exitCode!==null || child.signalCode!==null,'Stop must await actual child exit');
  assert.equal(f.worker.processes.size,0);await stopped;
  assert.equal(f.worker.current,null);assert.equal(f.worker.processes.size,0);
});
test('meaningful stdout activity keeps real execution alive past its idle window',async t=>{
  const f=await workerFixture(t,{mode:'activity'});const activities=[];
  f.worker.on('activity',activity=>activities.push(activity));const start=Date.now();
  const output=JSON.parse(await runSelected(f.worker,'active work',{cwd:f.root,timeoutMs:5000,idleTimeoutMs:600}));
  assert.equal(output.prompt,'active work');assert.ok(Date.now()-start>=1500);
  assert.ok(activities.length>=10);assert.ok(activities.every(activity=>Object.keys(activity).sort().join(',')==='at,type' && !Number.isNaN(Date.parse(activity.at))));
  assert.equal(f.worker.processes.size,0);assert.equal(f.calls.filter(call=>call.args.includes('exec')).length,1);
});
test('stderr, unknown heartbeats, malformed stdout and duplicate events cannot renew idle timeout',async t=>{
  const f=await workerFixture(t,{mode:'heartbeat-only'});const activities=[];f.worker.on('activity',value=>activities.push(value));
  await assert.rejects(runSelected(f.worker,'silent work',{cwd:f.root,timeoutMs:4000,idleTimeoutMs:500}),error=>{
    assert.equal(error.code,'CODEX_IDLE_TIMEOUT');assert.equal(error.timeoutType,'idle');assert.match(error.message,/chờ hoạt động/);assert.match(error.message,/Mã nguồn được giữ/);return true;
  });
  assert.equal(activities.length,2);assert.equal(f.worker.processes.size,0);assert.equal(f.worker.current,null);
});
test('continuous real activity cannot extend the absolute execution cap or trigger a provider fallback',async t=>{
  const f=await workerFixture(t,{mode:'continuous-activity'});const activities=[];f.worker.on('activity',value=>activities.push(value));
  await assert.rejects(runSelected(f.worker,'bounded work',{cwd:f.root,timeoutMs:1300,idleTimeoutMs:600}),error=>{
    assert.equal(error.code,'CODEX_TOTAL_TIMEOUT');assert.equal(error.timeoutType,'maximum');assert.match(error.message,/tối đa/);return true;
  });
  assert.ok(activities.length>2);assert.equal(f.calls.filter(call=>call.args.includes('exec')).length,1);assert.equal(f.worker.processes.size,0);
});
test('progress exposes useful command labels and redacted file paths without forwarding event payloads',async t=>{
  const f=await workerFixture(t,{mode:'progress-redaction'});const progress=[],activities=[];
  f.worker.on('progress',text=>progress.push(text));f.worker.on('activity',value=>activities.push(value));
  await runSelected(f.worker,'show progress',{cwd:f.root});
  assert.ok(progress.includes('Đang chạy: git diff.'));assert.ok(progress.some(text=>text.includes('src/layout.js')));
  const exposed=JSON.stringify({progress,activities});assert.ok(!exposed.includes('ghp_abcdefghijklmnopqrstuvwxyz123456'));assert.ok(!exposed.includes('--token'));
  assert.ok(activities.every(value=>!('item' in value) && !('command' in value)));
});
test('Stop during preparation prevents a later exec from starting',async t=>{
  const f=await workerFixture(t);let release;
  f.worker.prepare=()=>new Promise(resolve=>{release=resolve;});
  const run=runSelected(f.worker,'task',{cwd:f.root});const stopped=assert.rejects(run,/đã dừng/);
  await f.worker.interrupt();release();await stopped;assert.equal(f.calls.length,0);
});
test('hung CLI times out, duplicate task is rejected and quota failure has no API fallback',async t=>{
  const f=await workerFixture(t,{mode:'hang'});
  const run=runSelected(f.worker,'task',{cwd:f.root,timeoutMs:100});const timed=assert.rejects(run,/hết thời gian/);
  await assert.rejects(runSelected(f.worker,'other',{cwd:f.root}),/nhiệm vụ khác/);await timed;
  const quota=await workerFixture(t,{mode:'quota'});await assert.rejects(runSelected(quota.worker,'task',{cwd:quota.root}),/hạn mức/);
  assert.equal(quota.calls.filter(call=>call.args.includes('exec')).length,1);
});
test('public CLI errors redact JSON-shaped credentials and bearer values',async t=>{
  const message=scrub('Authorization: Bearer private-value "access_token":"fixture-value" refresh_token="fixture-secret" sk-abcdefghijk123456789');
  for(const secret of ['private-value','fixture-value','fixture-secret','sk-abcdefgh'])assert.ok(!message.includes(secret));
  const f=await workerFixture(t,{mode:'secret-error'});await assert.rejects(runSelected(f.worker,'task',{cwd:f.root}));
  assert.ok(!JSON.stringify(f.worker.publicState).includes('private-value'));assert.ok(!JSON.stringify(f.worker.publicState).includes('fixture-secret'));
});
