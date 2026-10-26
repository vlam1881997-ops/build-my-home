import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile,readdir,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {DEFAULT_MODEL_SETTINGS,defaultTeamSettings,validateModelSettings,validateCatalogSettings,normalizeModelOptions,modelSettingsWarning,loadModelSettings,saveModelSettings} from '../models.mjs';
import {fixtureCatalog,fixtureRows} from './model-fixtures.mjs';

async function root(t){const directory=await mkdtemp(path.join(os.tmpdir(),'bmh-models-'));t.after(()=>rm(directory,{recursive:true,force:true}));return directory;}
test('fresh accounts require an explicit model choice instead of assuming account access',async t=>{
  const directory=await root(t);const loaded=await loadModelSettings(directory);
  assert.equal(loaded.warning,null);assert.deepEqual(loaded.settings.one,DEFAULT_MODEL_SETTINGS);
  loaded.settings.one.model='gpt-6-astra';assert.equal(loaded.settings.two.model,null);
  assert.throws(()=>validateCatalogSettings(loaded.settings.two,fixtureCatalog()));
});
test('only safe identifiers present in this account catalog reach executable arguments',()=>{
  const catalog=fixtureCatalog();
  for(const option of catalog.options)assert.equal(validateCatalogSettings({model:option.id,reasoningEffort:'xhigh'},catalog).model,option.id);
  for(const invalid of [null,[],{}, {model:'gpt-6-astra; echo private',reasoningEffort:'high'},{model:'gpt-6.1-sol',reasoningEffort:'high" --shell'}])assert.throws(()=>validateModelSettings(invalid));
  assert.throws(()=>validateCatalogSettings({model:'unavailable-name',reasoningEffort:'high'},catalog));
  catalog.options[0].efforts=[{id:'medium',label:'Medium'}];
  assert.throws(()=>validateCatalogSettings({model:'gpt-6.1-sol',reasoningEffort:'xhigh'},catalog),/không hỗ trợ/);
});
test('saved choices survive restart and never read or change account credentials',async t=>{
  const directory=await root(t);const home=path.join(directory,'accounts','one');await mkdir(home,{recursive:true});
  const auth=path.join(home,'auth.json');await writeFile(auth,'fixture-auth-byte-preserved');
  const settings=defaultTeamSettings();settings.one={model:'gpt-6-astra',reasoningEffort:'xhigh'};
  await saveModelSettings(directory,settings);assert.deepEqual((await loadModelSettings(directory)).settings,settings);
  assert.equal(await readFile(auth,'utf8'),'fixture-auth-byte-preserved');
  const text=await readFile(path.join(directory,'model-settings.json'),'utf8');assert.ok(!text.includes('fixture-auth'));
  assert.deepEqual((await readdir(directory)).sort(),['accounts','model-settings.json']);
});
test('replacing choices is atomic and malformed updates retain the old saved settings',async t=>{
  const directory=await root(t);const settings=defaultTeamSettings();await saveModelSettings(directory,settings);
  const before=await readFile(path.join(directory,'model-settings.json'),'utf8');
  await assert.rejects(saveModelSettings(directory,{one:{model:'invalid; echo',reasoningEffort:'high'},two:settings.two}));
  assert.equal(await readFile(path.join(directory,'model-settings.json'),'utf8'),before);
  settings.two={model:'gpt-6-astra',reasoningEffort:'medium'};await saveModelSettings(directory,settings);
  assert.deepEqual((await loadModelSettings(directory)).settings,settings);assert.equal((await readdir(directory)).length,1);
});

test('legacy safe selections survive upgrade but absent models need a visible replacement',async t=>{
  const directory=await root(t);const settings=defaultTeamSettings();settings.one={model:'gpt-6.1-sol',reasoningEffort:'xhigh'};
  await saveModelSettings(directory,settings);const before=await readFile(path.join(directory,'model-settings.json'),'utf8');
  const loaded=await loadModelSettings(directory);const catalog=fixtureCatalog();catalog.options=catalog.options.filter(option=>option.id!=='gpt-6.1-sol');
  assert.deepEqual(loaded.settings,settings);assert.match(modelSettingsWarning(loaded.settings.one,catalog),/không có trong danh sách/);
  assert.equal(await readFile(path.join(directory,'model-settings.json'),'utf8'),before);
});
test('model catalog uses returned model slugs, efforts, defaults and visibility without guessing',()=>{
  const rows=fixtureRows();rows[0].id='picker-row-id';rows[1].hidden=true;
  const normalized=normalizeModelOptions(rows);assert.equal(normalized[0].id,'gpt-6.1-sol');assert.equal(normalized.length,2);
  assert.equal(normalized[0].defaultReasoningEffort,'medium');assert.deepEqual(normalized[0].efforts.map(x=>x.id),['medium','high','xhigh']);
  for(const rows of [[],[{model:'unsafe --shell'}],fixtureRows().map(entry=>({...entry,defaultReasoningEffort:'not-returned'})),[...fixtureRows(),fixtureRows()[0]]])assert.throws(()=>normalizeModelOptions(rows));
});
test('corrupt saved settings are preserved and require a visible new choice',async t=>{
  const directory=await root(t);const file=path.join(directory,'model-settings.json');
  for(const contents of ['invalid JSON',JSON.stringify({version:99}),JSON.stringify({version:1,workers:{one:{model:'unavailable',reasoningEffort:'high'}}})]){
    await writeFile(file,contents);assert.match((await loadModelSettings(directory)).warning,/Chọn lại model/);
    assert.equal(await readFile(file,'utf8'),contents);
  }
});
