const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('pre-Studio onboarding is Location -> Finance -> Family before Step 1',()=>{
  const js=read('dist/app.js');
  assert.match(js,/onboardingComplete:false,\s*onboardingStep:1/);
  assert.match(js,/\['⌖','Vị trí','Khu vực & quy mô đất'\],\['◉','Tài chính','Ngân sách sơ bộ'\],\['♙','Gia đình','Thành viên sinh sống'\]/);
  assert.match(js,/data-setup-next/);
  assert.match(js,/data-setup-finish/);
  assert.match(js,/onboardingComplete=true/);
  assert.match(js,/state\.ui\.step=1/);
});

test('stable Step 1 AI and upload capabilities are preserved',()=>{
  const js=read('dist/app.js');
  for(const token of ['BMH.v6ReceiveFiles','BMH.v6OpenUploadPicker','data-s1-analyze','step1UploadVideo','step1UploadImage','step1UploadPdf','BMH.v6AnalyzeBrief','BMH.aiCall'])assert.ok(js.includes(token),token);
  assert.match(js,/AI HOME VISION/);
  assert.match(js,/BMH\.v6ConceptPrompt/);
});

test('AI Home Vision cannot silently overwrite setup foundations',()=>{
  const src=read('src/18_ai_copilot.js');
  const start=src.indexOf('BMH.applyAIBrief=result=>');
  const end=src.indexOf('BMH.aiStartBrief=',start);
  assert.ok(start>=0&&end>start);
  const fn=src.slice(start,end);
  assert.match(fn,/p\.style=/);
  assert.match(fn,/p\.brief\.aiSuggestions/);
  assert.doesNotMatch(fn,/p\.finance\.targetBudget\s*=/);
  assert.doesNotMatch(fn,/p\.site\.floors\s*=/);
  assert.doesNotMatch(fn,/p\.household\.requestedSize\s*=/);
  assert.doesNotMatch(fn,/p\.site\.province\s*=/);
});

test('Step 1 edits reopen the matching setup stage for foundation data',()=>{
  const js=read('dist/app.js');
  assert.match(js,/key==='floors'\|\|key==='climate'[\s\S]*onboardingStep=1/);
  assert.match(js,/key==='budget'[\s\S]*onboardingStep=2/);
  assert.match(js,/key==='household'[\s\S]*onboardingStep=3/);
});


test('finishing setup invalidates stale AI concept but keeps media/upload stack',()=>{
  const js=read('dist/app.js');
  assert.match(js,/Hồ sơ nền vừa được cập nhật\. Hãy tạo lại concept AI để đồng bộ\./);
  assert.match(js,/BMH\.v6\.briefResult=null/);
  assert.match(js,/aiSuggestions:\{\}/);
  assert.match(js,/BMH\.v6PersistSourceRefs/);
});


test('premium onboarding uses architectural split-screen hierarchy',()=>{
  const js=read('dist/app.js'),css=read('dist/styles.css');
  for(const token of ['setup-premium','setup-visual','setup-workspace','setup-visual-copy','setup-top-progress'])assert.ok(js.includes(token),token);
  assert.match(css,/\.setup-main\.setup-premium/);
  assert.match(css,/grid-template-columns:minmax\(360px,42%\) minmax\(0,58%\)/);
  assert.match(css,/\.setup-visual-copy h2/);
});
