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
  assert.ok(models.includes('gemini-3.5-flash-lite'));
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
