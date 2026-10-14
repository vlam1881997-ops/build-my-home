import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import projects from '../api/projects.mjs';
import auth from '../api/auth.mjs';
import config from '../api/config.mjs';
import {withAiUsage,reserveAiUsage,markAiProviderAccepted,beginAiProviderCall,aiUsageHandler} from '../server/_ai_usage.mjs';
import ai from '../api/ai.mjs';
import bank from '../api/bank-rate.mjs';
import scan from '../api/gemini-scan.mjs';
import render from '../api/gemini-render.mjs';
import fileStatus from '../api/gemini-file-status.mjs';
import {send} from '../server/_lib.mjs';
const user={id:randomUUID(),email:'fixture@example.invalid'};
const invoke=async(handler,{method='POST',body={},headers={},url='/api/projects',query={}}={})=>{
 const res={status(n){this.statusCode=n;return this;},setHeader(){},end(raw){this.body=JSON.parse(raw);}};
 await handler({method,body,headers,url,query},res);return {status:res.statusCode,body:res.body};
};
test('customer API capability, account and quota boundaries',async t=>{
 const oldFetch=globalThis.fetch,env={...process.env},calls=[];
 Object.assign(process.env,{SUPABASE_URL:'https://fixture.supabase.invalid',SUPABASE_PUBLISHABLE_KEY:'public-fixture',SUPABASE_SECRET_KEY:'server-fixture',BMH_CLOUD_READY:'true',BMH_AI_QUOTA_READY:'true',BMH_AI_DAILY_LIMIT:'2'});
 let saveResult={saved:true,project:{id:randomUUID(),revision:1}},quotaResult={accepted:true},authStatus=200,fileOwner=user.id;
 globalThis.fetch=async(url,options={})=>{
  const path=new URL(url).pathname,body=options.body?JSON.parse(options.body):null;calls.push({url,path,options,body});
  if(path==='/auth/v1/user')return new Response(JSON.stringify(authStatus===200?user:{message:'Expired session'}),{status:authStatus});
  if(path==='/rest/v1/rpc/bmh_save_project')return Response.json(saveResult);
  if(path==='/rest/v1/rpc/bmh_ai_reserve')return Response.json(quotaResult);
  if(path==='/rest/v1/rpc/bmh_ai_usage')return Response.json({limit:2,used:1,pending:0,remaining:1,resetAt:'2026-10-04T00:00:00Z'});
  if(path==='/rest/v1/rpc/bmh_ai_settle')return Response.json({settled:true});
  if(path==='/v1beta/files/fixture')return Response.json({name:'files/fixture',displayName:'BMH-'+fileOwner+':fixture.jpg',state:'ACTIVE'});
  return Response.json({});
 };
 try{
  await t.test('flags require actual keys plus explicit migration readiness',async()=>{
   const yes=await invoke(config,{method:'GET'});assert.equal(yes.body.cloudConfigured,true);assert.equal(yes.body.aiUsage.mode,'account');assert.equal(yes.body.paymentConfigured,false);assert.doesNotMatch(JSON.stringify(yes.body),/server-fixture|public-fixture/);
   process.env.BMH_CLOUD_READY='false';assert.equal((await invoke(config,{method:'GET'})).body.cloudConfigured,false);assert.equal((await invoke(projects)).status,503);process.env.BMH_CLOUD_READY='true';
  });
  const state={project:{name:'Khách hàng'},access:{paid:true},meta:{localProjectId:'private-device',cloudOwnerId:'spoofed-user'}},body={id:randomUUID(),requestId:randomUUID(),expectedRevision:null,name:'Nhà',state};
  await t.test('cloud owner is verified by server token and never supplied in the write body',async()=>{
   assert.equal((await invoke(projects,{body})).status,401);
   const result=await invoke(projects,{body,headers:{authorization:'Bearer verified'}});assert.equal(result.status,200);
   const request=calls.findLast(x=>x.path.endsWith('bmh_save_project'));assert.equal(request.options.headers.Authorization,'Bearer verified');assert.equal(request.body.p_user,undefined);assert.equal(request.body.p_state.access.paid,false);assert.equal(request.body.p_state.meta.localProjectId,undefined);assert.equal(request.body.p_state.meta.cloudOwnerId,undefined);
  });
  await t.test('legacy upserts, array payloads and oversized designs are refused',async()=>{
   for(const invalid of [{...body,expectedRevision:undefined},{...body,requestId:'x'},{...body,state:[]},{...body,expectedRevision:0}])assert.equal((await invoke(projects,{body:invalid,headers:{authorization:'Bearer verified'}})).status,400);
   assert.equal((await invoke(projects,{body:{...body,state:{project:{huge:'x'.repeat(4194305)}}},headers:{authorization:'Bearer verified'}})).status,413);
  });
  await t.test('revision conflict returns a useful receipt without loading or overwriting design',async()=>{
   saveResult={saved:false,project:{id:body.id,revision:3}};const result=await invoke(projects,{body,headers:{authorization:'Bearer verified'}});assert.equal(result.status,409);assert.equal(result.body.code,'PROJECT_CONFLICT');assert.equal(result.body.project.revision,3);
  });
  await t.test('list requests always include verified owner filter and omit full designs',async()=>{
   await invoke(projects,{method:'GET',headers:{authorization:'Bearer verified'}});const url=new URL(calls.at(-1).url);assert.equal(url.searchParams.get('user_id'),'eq.'+user.id);assert.doesNotMatch(url.searchParams.get('select'),/state/);
  });
  await t.test('password recovery uses the trusted application URL',async()=>{
   process.env.BMH_PUBLIC_URL='https://www.huiminhbach.id.vn';const result=await invoke(auth,{url:'/api/auth',body:{action:'recover',email:'fixture@example.invalid'},headers:{origin:'https://attacker.invalid'}});assert.equal(result.status,200);const url=new URL(calls.findLast(x=>x.path==='/auth/v1/recover').url);assert.equal(url.searchParams.get('redirect_to'),'https://www.huiminhbach.id.vn/');
  });
  const headers={authorization:'Bearer verified','x-bmh-ai-request-id':randomUUID()};let providers=0;
  const provider=withAiUsage(async(req,res)=>{await Promise.all([reserveAiUsage(),reserveAiUsage()]);providers++;markAiProviderAccepted();send(res,200,{ok:true});},'image');
  await t.test('parallel provider work inside one request reserves and settles exactly once',async()=>{
   calls.length=0;assert.equal((await invoke(provider,{headers})).status,200);assert.equal(providers,1);assert.equal(calls.filter(x=>x.path.endsWith('bmh_ai_reserve')).length,1);const settle=calls.find(x=>x.path.endsWith('bmh_ai_settle'));assert.equal(settle.body.p_used,true);assert.equal(settle.body.p_user,user.id);assert.equal(settle.options.headers.apikey,'server-fixture');
  });
  await t.test('response ends only after settlement, and a settlement failure still delivers the result',async()=>{
   const savedFetch=globalThis.fetch;let ledgerDone=false,fail=false,delivered=0;
   globalThis.fetch=async(url,options)=>{if(new URL(url).pathname.endsWith('bmh_ai_settle')){assert.equal(options.signal instanceof AbortSignal,true);ledgerDone=true;if(fail)throw Error('Ledger temporarily offline');}return savedFetch(url,options);};
   const res={status(n){this.statusCode=n;return this;},setHeader(){},end(raw){assert.equal(ledgerDone,true,'settlement must precede HTTP completion');assert.equal(JSON.parse(raw).ok,true);delivered++;}};
   try{for(const broken of [false,true]){fail=broken;ledgerDone=false;await provider({method:'POST',headers,body:{},url:'/api/ai'},res);}assert.equal(delivered,2);}
   finally{globalThis.fetch=savedFetch;}
  });
  await t.test('exhausted quota or expired token prevents any provider invocation',async()=>{
   const before=providers;quotaResult={accepted:false,code:'AI_LIMIT_REACHED'};await assert.rejects(invoke(provider,{headers}),e=>e.statusCode===429&&e.code==='AI_LIMIT_REACHED');assert.equal(providers,before);
   authStatus=401;await assert.rejects(invoke(provider,{headers}),e=>e.statusCode===401&&e.code==='AI_LOGIN_REQUIRED');assert.equal(providers,before);authStatus=200;quotaResult={accepted:true};
  });
  await t.test('known failure settles unused while a cached response consumes nothing',async()=>{
   const failed=withAiUsage(async()=>{await reserveAiUsage();throw Error('Provider rejected request');},'scan');await assert.rejects(invoke(failed,{headers}));assert.equal(calls.findLast(x=>x.path.endsWith('bmh_ai_settle')).body.p_used,false);
   calls.length=0;const cached=withAiUsage(async(req,res)=>send(res,200,{cached:true}),'bank');await invoke(cached,{headers});assert.equal(calls.length,0);
  });
  await t.test('an unknown provider timeout counts as a used attempt',async()=>{
   const ambiguous=withAiUsage(async()=>{await reserveAiUsage();beginAiProviderCall();throw Error('Network timeout');},'image');await assert.rejects(invoke(ambiguous,{headers}));assert.equal(calls.findLast(x=>x.path.endsWith('bmh_ai_settle')).body.p_used,true);
  });
  await t.test('all production generation entry points stop before a provider when quota is exhausted',async()=>{
   process.env.GEMINI_API_KEY='fixture-key';process.env.GEMINI_IMAGE_ENABLED='true';process.env.GEMINI_SEARCH_ENABLED='true';process.env.GEMINI_MATERIAL_SEARCH_QUOTA='allowed';quotaResult={accepted:false,code:'AI_LIMIT_REACHED'};calls.length=0;
   const image='data:image/jpeg;base64,'+'A'.repeat(128);
   const routes=[
    [ai,'/api/ai',{action:'review',project:{}}],
    [ai,'/api/ai?operation=home-finish',{image,target:'interior',preferences:{}}],
    [ai,'/api/ai?operation=materials',{query:'Sàn gỗ',category:'floor'}],
    [bank,'/api/bank-rate',{bank_id:'TCB',bank_name:'Techcombank'}],
    [scan,'/api/gemini-scan',{file_uri:'https://generativelanguage.googleapis.com/v1beta/files/fixture',file_name:'files/fixture',mime_type:'image/jpeg'}],
    [render,'/api/gemini-render',{image,project:{}}]
   ];
   for(const [handler,url,body]of routes){const result=await invoke(handler,{headers:{...headers,'x-bmh-ai-request-id':randomUUID()},url,body});assert.equal(result.status,429,url);assert.equal(result.body.code,'AI_LIMIT_REACHED',url);}
   assert.equal(calls.filter(x=>/generativelanguage|api.openai/.test(x.url)&&/interactions|generateContent|responses/.test(x.url)).length,0);quotaResult={accepted:true};
  });
  await t.test('usage endpoint returns only verified owner allowance',async()=>{
   const result=await invoke(aiUsageHandler,{method:'GET',headers,url:'/api/ai?operation=usage'});assert.equal(result.body.usage.remaining,1);assert.equal(calls.findLast(x=>x.path.endsWith('bmh_ai_usage')).body.p_user,user.id);
  });
  await t.test('file reads and scans refuse a different owner and never delete that file',async()=>{
   fileOwner=randomUUID();calls.length=0;
   const status=await invoke(fileStatus,{headers,url:'/api/gemini-file-status',body:{name:'files/fixture'}});assert.equal(status.status,403);assert.equal(status.body.code,'AI_FILE_OWNER_REQUIRED');
   const result=await invoke(scan,{headers,url:'/api/gemini-scan',body:{file_uri:'https://generativelanguage.googleapis.com/v1beta/files/fixture',file_name:'files/fixture',mime_type:'image/jpeg'}});assert.equal(result.status,403);
   assert.equal(calls.filter(x=>x.options.method==='DELETE').length,0);assert.equal(calls.filter(x=>x.path.endsWith('bmh_ai_reserve')).length,0);
  });
 }finally{globalThis.fetch=oldFetch;for(const key of Object.keys(process.env))if(!(key in env))delete process.env[key];Object.assign(process.env,env);}
});
