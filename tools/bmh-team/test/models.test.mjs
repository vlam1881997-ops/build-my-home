import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,rm,writeFile,readFile,readdir,mkdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {MODEL_OPTIONS,DEFAULT_MODEL_SETTINGS,defaultTeamSettings,validateModelSettings,loadModelSettings,saveModelSettings} from '../models.mjs';

async function root(t){const directory=await mkdtemp(path.join(os.tmpdir(),'bmh-models-'));t.after(()=>rm(directory,{recursive:true,force:true}));return directory;}
test('fresh settings use an explicit strong model for both independent accounts',async t=>{
  const directory=await root(t);const loaded=await loadModelSettings(directory);
  assert.equal(loaded.warning,null);assert.deepEqual(loaded.settings.one,DEFAULT_MODEL_SETTINGS);
  loaded.settings.one.model='gpt-6-astra';assert.equal(loaded.settings.two.model,'gpt-6.1-sol');
});
test('only curated model and reasoning identifiers reach executable arguments',()=>{
  for(const option of MODEL_OPTIONS)assert.equal(validateModelSettings({model:option.id,reasoningEffort:'xhigh'}).model,option.id);
  for(const invalid of [null,[],{}, {model:'gpt-6-astra; echo private',reasoningEffort:'high'},{model:'gpt-6.1-sol',reasoningEffort:'high" --shell'},{model:'unavailable-name',reasoningEffort:'high'}])assert.throws(()=>validateModelSettings(invalid));
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
  await assert.rejects(saveModelSettings(directory,{one:{model:'invalid',reasoningEffort:'high'},two:settings.two}));
  assert.equal(await readFile(path.join(directory,'model-settings.json'),'utf8'),before);
  settings.two={model:'gpt-6-astra',reasoningEffort:'medium'};await saveModelSettings(directory,settings);
  assert.deepEqual((await loadModelSettings(directory)).settings,settings);assert.equal((await readdir(directory)).length,1);
});
test('corrupt saved settings are preserved and require a visible new choice',async t=>{
  const directory=await root(t);const file=path.join(directory,'model-settings.json');
  for(const contents of ['invalid JSON',JSON.stringify({version:99}),JSON.stringify({version:1,workers:{one:{model:'unavailable',reasoningEffort:'high'}}})]){
    await writeFile(file,contents);assert.match((await loadModelSettings(directory)).warning,/Chọn lại model/);
    assert.equal(await readFile(file,'utf8'),contents);
  }
});
