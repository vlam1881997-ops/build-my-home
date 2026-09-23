import test from 'node:test';
import assert from 'node:assert/strict';
import {localBriefFallback} from '../api/ai.mjs';
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
