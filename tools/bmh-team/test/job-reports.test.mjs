import test from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createJobReportStore} from '../job-reports.mjs';

async function fixture(t) {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'bmh-reports-'));t.after(()=>fs.rm(root,{recursive:true,force:true}));
  const id='1791111468736-5ca72725';
  for(const name of ['integration','account-1','account-2']){const cwd=path.join(root,id,name);await fs.mkdir(cwd,{recursive:true});await fs.writeFile(path.join(cwd,'.git'),'gitdir: fixture\n');}
  const snapshot={id,status:'failed',goal:'Original customer-design goal',workspaceReady:true,source:{mode:'desktop',baseCommit:'a'.repeat(40)},plan:{summary:'Saved plan',tasks:[{ownedPaths:['one.txt']},{ownedPaths:['two.txt']}],checks:[{program:'node',args:['--test','test/result.test.mjs']}]},results:[{worker:'one',status:'completed',files:['one.txt']}],error:'Account two timed out.'};
  return {root,snapshot,store:createJobReportStore(root)};
}

test('serial atomic snapshots preserve the latest terminal progress instead of an earlier event',async t=>{
  const {store,snapshot,root}=await fixture(t);
  const writes=Array.from({length:35},(_,index)=>store.save({...snapshot,status:'working',events:[{message:'event '+index}]}));
  writes.push(store.save({...snapshot,status:'stopped',events:[{message:'terminal checkpoint'}]}));
  await Promise.all(writes);await store.flush();
  const saved=await store.read(snapshot.id);assert.equal(saved.status,'stopped');assert.equal(saved.events[0].message,'terminal checkpoint');
  assert.deepEqual(await fs.readdir(path.join(root,'reports')),[snapshot.id+'.json']);
});

test('legacy report produces a recovery choice derived from safe paths with original goal and plan',async t=>{
  const {store,snapshot,root}=await fixture(t);await fs.mkdir(path.join(root,'reports'));
  await fs.writeFile(path.join(root,'reports',snapshot.id+'.json'),JSON.stringify(snapshot));
  const candidate=await store.latestRecoverable();assert.equal(candidate.recovery.id,snapshot.id);assert.equal(candidate.recovery.worktreeId,snapshot.id);
  assert.equal(candidate.recovery.goal,snapshot.goal);assert.equal(candidate.recovery.completedWorkers,1);assert.ok(candidate.recovery.updatedAt);
  assert.equal(candidate.recovery.path,path.join(root,snapshot.id,'integration'));assert.deepEqual(candidate.snapshot.plan,snapshot.plan);
});

test('completed or active continuation suppresses its older failed checkpoint after restart',async t=>{
  const {store,snapshot}=await fixture(t);await store.save(snapshot);
  await store.save({...snapshot,id:'1791111468740-11111111',worktreeId:snapshot.id,resumedFrom:snapshot.id,status:'ready'});
  assert.equal(await store.latestRecoverable(),null);
  await store.save({...snapshot,id:'1791111468750-22222222',worktreeId:snapshot.id,status:'working'});
  assert.equal(await store.latestRecoverable(),null);
});

test('missing, unsafe, unfinished and already integrated snapshots cannot offer automatic continuation',async t=>{
  const {store,snapshot,root}=await fixture(t);
  for(const value of [{...snapshot,status:'working'},{...snapshot,workspaceReady:false},{...snapshot,plan:null},{...snapshot,checkpoint:{integrationStarted:true}},{...snapshot,results:[{status:'completed',commit:'b'.repeat(40)}]}])assert.equal(await store.candidate(value),null);
  await fs.rm(path.join(root,snapshot.id,'account-2'),{recursive:true});assert.equal(await store.candidate(snapshot),null);
  await assert.rejects(store.read('../account/auth'),/Mã công việc/);
  assert.throws(()=>store.save({...snapshot,id:'../account/auth'}),/Mã công việc/);
});

test('damaged reports and credential-like errors cannot leak into recovery state',async t=>{
  const {store,snapshot,root}=await fixture(t);await store.save({...snapshot,error:'failed ghp_'+'a'.repeat(35)});
  await fs.writeFile(path.join(root,'reports','1791111469999-33333333.json'),'{truncated');
  const value=await store.latestRecoverable();assert.equal(value.recovery.id,snapshot.id);assert.ok(!value.recovery.error.includes('ghp_'));assert.match(value.recovery.error,/redacted/);
});

test('report reads reject symbolic links and oversized data instead of probing arbitrary files',async t=>{
  const {store,snapshot,root}=await fixture(t);await store.save(snapshot);
  const destination=path.join(root,'reports',snapshot.id+'.json');await fs.unlink(destination);
  const outside=path.join(root,'private-file');await fs.writeFile(outside,JSON.stringify(snapshot));await fs.symlink(outside,destination);
  await assert.rejects(store.read(snapshot.id),/Báo cáo công việc/);
  assert.throws(()=>store.save({...snapshot,goal:'x'.repeat(2_000_001)}),/quá lớn/);
});
