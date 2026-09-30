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
