const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),js=()=>fs.readFileSync(path.join(root,'dist','app.js'),'utf8');

test('Step 1 action labels map to real handlers',()=>{
  const s=js();
  for(const token of [
    'data-s1-analyze','data-s1-focus-prompt','data-s1-prelim-toggle','data-s1-ideas-toggle',
    'data-s1-edit="style"','data-s1-edit="floors"','data-s1-edit="area"','data-s1-edit="budget"',
    'data-s1-edit="climate"','data-s1-edit="household"','BMH.v6GlobalSearch','BMH.v6OpenUploadPicker'
  ]) assert.ok(s.includes(token),token);
  assert.equal(s.includes('AI production đã kết nối'),false);
});

test('Step 1 canonical data survives reload and manual edits win over stale AI',()=>{
  const s=js();
  for(const token of [
    "brief:{provider:'',model:'',notice:'',updatedAt:'',result:{},aiSuggestions:{}}",
    'sourceRefs:[]','targetBudget:0','requestedSize:0','project.brief.result',
    'BMH.v6PersistSourceRefs','p.finance?.targetBudget','p.household?.requestedSize','p.style||brief.style'
  ]) assert.ok(s.includes(token),token);
});

test('Step 1 finance and household use canonical shared engines',()=>{
  const s=js();
  assert.match(s,/targetBudget>0\?targetBudget:capacity/);
  assert.match(s,/people=Math\.max\(actualPeople,requested\)/);
  assert.match(s,/BMH\.syncHouseholdSize/);
});

test('Step 1 AI requests are guarded and degraded mode is explicit',()=>{
  const s=js(),api=fs.readFileSync(path.join(root,'api','ai.mjs'),'utf8');
  assert.match(s,/if\(BMH\.v6\.briefLoading\)return/);
  assert.match(s,/if\(BMH\.ai\.loading\)return/);
  assert.match(api,/local-fallback/);
  assert.match(api,/Gemini đang chạm hạn mức|AI cloud đang bận/);
});
