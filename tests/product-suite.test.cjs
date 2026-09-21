const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');

test('v1.7 product suite includes official UI, project store, planner, materials and AI controls',()=>{
  const js=fs.readFileSync(path.join(root,'dist/product-suite.js'),'utf8');
  for(const token of ['bmh-project-store-v17','resize-handle','select-material','local-ai','cloud-ai','Mô phỏng 3D','Hồ sơ bàn giao'])assert.ok(js.includes(token),token);
  const css=fs.readFileSync(path.join(root,'dist/product-suite.css'),'utf8');
  for(const token of ['.suite-flow-grid','.suite-material-grid','.suite-ai-layout','.suite-estimate-layout','@media(max-width:560px)'])assert.ok(css.includes(token),token);
});

test('Vercel output references the v1.7 product assets',()=>{
  const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
  assert.match(html,/product-suite\.css/);assert.match(html,/product-suite\.js/);
  const prep=fs.readFileSync(path.join(root,'scripts/prepare-vercel.cjs'),'utf8');
  assert.match(prep,/product-suite\.js/);assert.match(prep,/product-suite\.css/);
});

test('AI Vercel function fails closed when server key/model are not configured',async()=>{
  const handler=require('../api/review.js');
  const oldKey=process.env.OPENAI_API_KEY,oldModel=process.env.OPENAI_MODEL;delete process.env.OPENAI_API_KEY;delete process.env.OPENAI_MODEL;
  let status=200,payload=null;const res={status(n){status=n;return this;},json(v){payload=v;return this;}};
  await handler({method:'POST',body:{}},res);
  if(oldKey!==undefined)process.env.OPENAI_API_KEY=oldKey;if(oldModel!==undefined)process.env.OPENAI_MODEL=oldModel;
  assert.equal(status,503);assert.equal(payload.error,'AI_NOT_CONFIGURED');
});
