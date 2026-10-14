import test from 'node:test';
import assert from 'node:assert/strict';
import handler,{localBriefFallback} from '../api/ai.mjs';
import {geminiModelCandidates} from '../server/_gemini.mjs';

test('local Step 1 parser understands the exact Vietnamese brief pattern',()=>{
  const result=localBriefFallback('nhà 2 tầng, cho 5 người tài chính có 1 tỷ 200 triệu',{
    style:'Hiện đại',
    site:{floors:2,province:'TP. Hồ Chí Minh'},
    household:{requestedSize:0,children:[],relatives:[]},
    computed:{estimate:{total:1116677701,budget:730000000}}
  });
  assert.equal(result.brief.floors,2);
  assert.equal(result.brief.household_size,5);
  assert.equal(result.brief.budget_vnd,1200000000);
  assert.ok(result.brief.bedrooms>=3);
});

test('Gemini gateway keeps a low-cost fallback candidate',()=>{
  const oldModel=process.env.GEMINI_MODEL,oldFallback=process.env.GEMINI_FALLBACK_MODEL;
  process.env.GEMINI_MODEL='gemini-3.8-flash';
  delete process.env.GEMINI_FALLBACK_MODEL;
  const models=geminiModelCandidates();
  if(oldModel===undefined)delete process.env.GEMINI_MODEL;else process.env.GEMINI_MODEL=oldModel;
  if(oldFallback===undefined)delete process.env.GEMINI_FALLBACK_MODEL;else process.env.GEMINI_FALLBACK_MODEL=oldFallback;
  assert.ok(models.includes('gemini-flash-lite-latest'));
});


test('Step 1 brief endpoint degrades to local parser when cloud AI is unavailable',async()=>{
  const oldGemini=process.env.GEMINI_API_KEY,oldOpenAI=process.env.OPENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;delete process.env.OPENAI_API_KEY;
  let status=0,payload=null;
  const req={method:'POST',headers:{'x-forwarded-for':'127.0.0.55'},body:{action:'brief',prompt:'nhà 2 tầng cho 5 người, ngân sách 1 tỷ 200 triệu',project:{style:'Hiện đại',site:{floors:2,province:'TP. Hồ Chí Minh'},finance:{targetBudget:0},household:{requestedSize:0,children:[],relatives:[]},computed:{estimate:{total:1100000000,budget:900000000}}}}};
  const res={status(n){status=n;return this;},setHeader(){return this;},end(raw){payload=JSON.parse(raw);return this;}};
  await handler(req,res);
  if(oldGemini===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldGemini;
  if(oldOpenAI===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=oldOpenAI;
  assert.equal(status,200);
  assert.equal(payload.provider,'local-fallback');
  assert.equal(payload.result.brief.household_size,5);
  assert.equal(payload.result.brief.budget_vnd,1200000000);
});

test('model discovery prefers stable Flash and removes retired and non-text models',async()=>{const {rankGeminiModels}=await import('../server/_gemini_models.mjs');const models=['gemini-9-flash','gemini-10-pro','gemini-10-flash-preview','gemini-9-flash-image','gemini-flash-latest'].map(name=>({name:'models/'+name,supportedGenerationMethods:['generateContent']}));const ranked=rankGeminiModels(models,{configured:'gemini-retired',auto:true});assert.equal(ranked[0],'gemini-flash-latest');assert.ok(ranked.includes('gemini-9-flash'));assert.ok(!ranked.includes('gemini-retired'));assert.ok(!ranked.includes('gemini-10-pro'));assert.ok(!ranked.includes('gemini-9-flash-image'));assert.deepEqual(rankGeminiModels(models,{kind:'image'}),['gemini-9-flash-image']);});

test('gateway uses generateContent when the advertised model rejects Interactions',async()=>{
 const {geminiGenerate}=await import('../server/_gemini.mjs'),previous=global.fetch,env={...process.env},calls=[];
 process.env.GEMINI_API_KEY='test-gateway-standard-unique';process.env.GEMINI_AUTO_UPGRADE='true';
 global.fetch=async(url)=>{calls.push(String(url));const list=String(url).includes('/models?'),interaction=String(url).endsWith('/interactions');const body=list?{models:[{name:'models/gemini-9-flash',supportedGenerationMethods:['generateContent']}]}:interaction?{error:{message:'Interactions unavailable'}}:{candidates:[{content:{parts:[{text:'{"answer":"ok"}'}]},groundingMetadata:{groundingChunks:[{web:{uri:'https://example.com/product',title:'Source'}}]}}]};return {ok:!interaction,status:interaction?404:200,text:async()=>JSON.stringify(body)};};
 try{const result=await geminiGenerate({parts:[{text:'Test'}],schema:{type:'object',properties:{answer:{type:'string'}}}});assert.equal(result.result.answer,'ok');assert.equal(result.model,'gemini-9-flash');assert.equal(result.citations[0].url,'https://example.com/product');assert.ok(calls.some(x=>x.endsWith(':generateContent')));}finally{global.fetch=previous;for(const k of ['GEMINI_API_KEY','GEMINI_AUTO_UPGRADE'])if(env[k]===undefined)delete process.env[k];else process.env[k]=env[k];}
});

test('image routing selects Flash without silently upgrading to Pro, and respects an explicit image pin',async()=>{
 const {rankGeminiModels}=await import('../server/_gemini_models.mjs'),models=['gemini-3-pro-image','gemini-3.1-flash-image','gemini-2.5-flash-image'].map(name=>({name:'models/'+name,supportedGenerationMethods:['generateContent']}));assert.equal(rankGeminiModels(models,{kind:'image'})[0],'gemini-3.1-flash-image');assert.ok(!rankGeminiModels(models,{kind:'image'}).includes('gemini-3-pro-image'));assert.equal(rankGeminiModels(models,{kind:'image',configured:'gemini-3-pro-image'})[0],'gemini-3-pro-image');
});
test('text generation goes directly to the content API and zero quota stops model retries',async()=>{
 const {geminiGenerate}=await import('../server/_gemini.mjs'),old=global.fetch,key=process.env.GEMINI_API_KEY,transport=process.env.GEMINI_TRANSPORT;process.env.GEMINI_API_KEY='bounded-test-key';delete process.env.GEMINI_TRANSPORT;let calls=[];
 global.fetch=async(url)=>{calls.push(String(url));const list=String(url).includes('/models?');return {status:list?200:429,ok:list,text:async()=>JSON.stringify(list?{models:['gemini-9-flash','gemini-8-flash'].map(name=>({name:'models/'+name,supportedGenerationMethods:['generateContent']}))}:{error:{message:'Quota exceeded for metric generate_content_free_tier_requests, limit: 0'}})};};
 try{await assert.rejects(geminiGenerate({parts:[{text:'Short request'}]}),e=>e.code==='GEMINI_QUOTA_EXHAUSTED'&&e.statusCode===429);assert.equal(calls.length,2);assert.ok(calls[1].endsWith(':generateContent'));assert.ok(!calls.some(u=>u.endsWith('/interactions')));}finally{global.fetch=old;if(key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=key;if(transport===undefined)delete process.env.GEMINI_TRANSPORT;else process.env.GEMINI_TRANSPORT=transport;}
});

async function researchEnv(overrides,run){
 const values={GEMINI_API_KEY:'fixture-research-api',GEMINI_MODEL:'gemini-fixture-pinned',GEMINI_FALLBACK_MODEL:'gemini-fixture-other',GEMINI_AUTO_UPGRADE:'true',GEMINI_TRANSPORT:'',GEMINI_API_VERSION:'auto',GEMINI_DESIGN_RESEARCH_ENABLED:'true',GEMINI_SEARCH_ENABLED:'true',GEMINI_DESIGN_RESEARCH_QUOTA:'allowed',BMH_AI_QUOTA_READY:'false',...overrides},prior={};
 for(const [key,value] of Object.entries(values)){prior[key]=process.env[key];process.env[key]=value;}
 const oldFetch=global.fetch;
 try{return await run();}finally{global.fetch=oldFetch;for(const [key,value] of Object.entries(prior))if(value===undefined)delete process.env[key];else process.env[key]=value;}
}
async function researchRequest(body,ip='127.0.0.201'){
 let status,payload;const res={status(n){status=n;return this;},setHeader(){return this;},end(raw){payload=JSON.parse(raw);return this;}};
 await handler({method:'POST',headers:{'x-forwarded-for':ip},body:{action:'design-research',...body}},res);return {status,payload};
}
const researchProfile={houseType:'new',styleId:'japandi',site:{widthM:5,depthM:20,floors:2,dimensionsStatus:'unconfirmed'},budget:{targetMinVnd:1.2e9,targetMaxVnd:1.2e9,status:'customer_target'},references:{imageCount:1,analysis:{available:true}},floorProgram:[]};

test('research endpoint uses only its allowlist and returns provider metadata evidence without raw responses',async()=>researchEnv({},async()=>{
 const calls=[],claim='Hiên sâu giúp che nắng.',result=JSON.stringify({options:[{title:'Hiên thoáng',claims:[claim],url:'https://invented.example.com/fake',limitations:['Chưa đo thực địa.']},{title:'Sân xanh',claims:['Cần kiểm tra diện tích sân.'],limitations:[]}]});
 global.fetch=async(url,options)=>{calls.push({url:String(url),body:JSON.parse(options.body)});return {ok:true,status:200,text:async()=>JSON.stringify({candidates:[{content:{parts:[{text:result}]},groundingMetadata:{groundingChunks:[{web:{uri:'https://architecture.example.com/real',title:'Nguồn thực từ fixture metadata'}}],groundingSupports:[{segment:{text:claim},groundingChunkIndices:[0]}]}}],privateProviderField:'PRIVATE-RAW'})};};
 const project=Object.defineProperty({},'finance',{get(){throw new Error('cleanProject must not run');}});
 const request={researchContext:{...researchProfile,finance:{income:99,bank:'PRIVATE-BANK'},birth:1988,references:{...researchProfile.references,fileName:'PRIVATE-FILE',content:'PRIVATE-TEXT'}},project,prompt:'PRIVATE-PROMPT',image_data_url:'PRIVATE-IMAGE'};
 const [a,b]=await Promise.all([researchRequest(request),researchRequest(request)]);assert.equal(a.status,200);assert.deepEqual(a,b);assert.equal(calls.length,1);
 assert.ok(calls[0].url.endsWith('/models/gemini-fixture-pinned:generateContent'));assert.deepEqual(calls[0].body.tools,[{googleSearch:{}}]);assert.doesNotMatch(JSON.stringify(calls[0].body),/PRIVATE|income|bank|birth|1988/);
 const output=a.payload.result;assert.equal(output.status,'ready');assert.equal(output.options.length,2);assert.equal(output.sources[0].url,'https://architecture.example.com/real');assert.equal(output.options[0].claims[0].verified,true);assert.equal(output.options[1].claims[0].verified,false);assert.ok(Number.isFinite(Date.parse(output.searchedAt)));assert.ok(output.options[0].fitReasons.length);assert.ok(output.limitations.length);
 assert.doesNotMatch(JSON.stringify(a.payload),/PRIVATE|invented|fixture-research-api|"raw"|"usage"/);
}));

test('research endpoint needs independent Search/quota permission and always leaves library available',async()=>{
 for(const flag of [{GEMINI_SEARCH_ENABLED:'false'},{GEMINI_DESIGN_RESEARCH_QUOTA:'unknown'},{GEMINI_API_KEY:''}])await researchEnv(flag,async()=>{
  let calls=0;global.fetch=async()=>{calls++;throw new Error('No external request permitted');};const {status,payload}=await researchRequest({researchContext:researchProfile},'127.0.0.202');assert.equal(status,200);assert.equal(payload.result.allowLibrary,true);assert.equal(payload.result.options.length,0);assert.equal(payload.result.searchedAt,null);assert.equal(calls,0);
 });
});

test('research quota rejection is one request on the configured model, with no model/provider/transport retry',async()=>researchEnv({GEMINI_API_KEY:'fixture-research-quota'},async()=>{
 const urls=[];global.fetch=async url=>{urls.push(String(url));return {ok:false,status:429,text:async()=>JSON.stringify({error:{message:'Quota exceeded, limit: 10. PRIVATE-KEY'}})};};
 const first=await researchRequest({researchContext:researchProfile},'127.0.0.203'),second=await researchRequest({researchContext:{...researchProfile,styleId:'tropical'}},'127.0.0.204');
 assert.equal(urls.length,1);assert.ok(urls[0].endsWith('/models/gemini-fixture-pinned:generateContent'));assert.equal(first.payload.result.status,'quota');assert.equal(second.payload.result.status,'quota_or_permission_blocked');assert.equal(first.payload.result.allowLibrary,true);assert.equal(process.env.GEMINI_MODEL,'gemini-fixture-pinned');assert.doesNotMatch(JSON.stringify(first.payload),/PRIVATE-KEY/);
}));

test('configured research keeps the selected transport and does not discover or substitute models on errors',async()=>{
 const {geminiGenerate}=await import('../server/_gemini.mjs');
 for(const transport of ['', 'interactions'])await researchEnv({GEMINI_TRANSPORT:transport},async()=>{
  const calls=[];global.fetch=async(url,options)=>{calls.push({url:String(url),body:JSON.parse(options.body)});return {ok:false,status:404,text:async()=>JSON.stringify({error:{message:'Search/model unavailable'}})};};
  await assert.rejects(geminiGenerate({parts:[{text:'Fixture only'}],configuredOnly:true,tools:[{type:'google_search'}]}),e=>e.statusCode===404);assert.equal(calls.length,1);
  if(transport){assert.ok(calls[0].url.endsWith('/interactions'));assert.equal(calls[0].body.model,'gemini-fixture-pinned');}else assert.ok(calls[0].url.endsWith('/models/gemini-fixture-pinned:generateContent'));
 });
});

test('configured research aborts its only provider call on deadline',async()=>researchEnv({},async()=>{
 const {geminiGenerate}=await import('../server/_gemini.mjs');let calls=0;
 global.fetch=async(_,options)=>{calls++;return new Promise((resolve,reject)=>{options.signal.addEventListener('abort',()=>reject(Object.assign(new Error('aborted'),{name:'AbortError'})),{once:true});});};
 await assert.rejects(geminiGenerate({parts:[{text:'Fixture timeout'}],configuredOnly:true,timeoutMs:1550,tools:[{type:'google_search'}]}),e=>e.statusCode===504);assert.equal(calls,1);
}));
