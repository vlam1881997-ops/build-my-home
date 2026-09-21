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


test('v1.7.1 design polish implements mockup-aligned UI and product honesty',()=>{
  const js=fs.readFileSync(path.join(root,'dist/design-polish.js'),'utf8');
  for(const token of ['vietqr-demo.png','paymentUnlocked','realMap','OpenStreetMap','Tải bảng dự tính trả nợ theo tháng','người đồng hành','MÃ DEMO','sceneZone','downloadEstimateExcel'])assert.ok(js.includes(token),token);
  const css=fs.readFileSync(path.join(root,'dist/design-polish.css'),'utf8');
  for(const token of ['.paywall-card','.polish-bank-row','.real-material-grid','.premium-overlay','.amountbar','.stepper .step.complete'])assert.ok(css.includes(token),token);
});

test('design polish assets are local and Vercel output includes polish bundle',()=>{
  for(const file of ['dist/design-polish.js','dist/design-polish.css','dist/assets/design/vietqr-demo.png','dist/assets/design/hero-step1.jpg','dist/assets/rooms/facade-render.jpg','dist/assets/banks/mb.jpg'])assert.ok(fs.existsSync(path.join(root,file)),file);
  const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
  assert.match(html,/design-polish\.css/);assert.match(html,/design-polish\.js/);assert.match(html,/leaflet@1\.9\.4/);
});

test('V2 stabilization locks premium flow and upgrades family/planner/material/lifecycle UX',()=>{
  const js=fs.readFileSync(path.join(root,'dist/v2.js'),'utf8');
  for(const token of ['paymentEntitlement','householdChildren','householdParents','plannerGrid','plannerIssues','wearYear','copy','sidebarCollapsed','Fix','Hồ sơ bàn giao'])assert.ok(js.includes(token),token);
  assert.match(js,/Number\(step\.dataset\.value\)>=8/);
  assert.match(js,/DEV_MODE&&e\.ctrlKey&&e\.shiftKey/);
  assert.match(js,/Không thể đặt phòng chồng/);
  const css=fs.readFileSync(path.join(root,'dist/v2.css'),'utf8');
  for(const token of ['.v2-stephead','.v2-family-row','.v2-validator','.v2-wear','.v2-pay','.v2-sidebar-collapsed'])assert.ok(css.includes(token),token);
});

test('V2 assets are referenced by both static build and Vercel preparer',()=>{
  const html=fs.readFileSync(path.join(root,'dist/index.html'),'utf8');
  assert.match(html,/v2\.css/);assert.match(html,/v2\.js/);
  const prep=fs.readFileSync(path.join(root,'scripts/prepare-vercel.cjs'),'utf8');
  assert.match(prep,/v2\.js/);assert.match(prep,/v2\.css/);
});
