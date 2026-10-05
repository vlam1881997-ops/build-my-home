import { test } from 'node:test';
import {EventEmitter} from 'node:events';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { TeamJob } from '../jobs.mjs';
import {fixtureSettings} from './model-fixtures.mjs';

const exec = promisify(execFile);
async function git(repo, ...args) { return (await exec('git', args, { cwd: repo })).stdout.trim(); }
function plan({ first = ['one.txt'], second = ['two.txt'], checks = [{ program: 'node', args: ['--test', 'test/result.test.mjs'] }] } = {}) {
  return { summary: 'Split isolated edits', tasks: [{ title: 'First task', instructions: 'Update first file.', ownedPaths: first }, { title: 'Second task', instructions: 'Update second file.', ownedPaths: second }], checks };
}
async function fixture(t, { badOrigin = false, checkFails = false } = {}) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'bmh-team-test-')); t.after(() => fs.rm(root, { recursive: true, force: true }));
  const repo = path.join(root, 'repo'); await fs.mkdir(repo); await fs.mkdir(path.join(repo, 'test'));
  await fs.writeFile(path.join(repo, 'one.txt'), 'old one\n'); await fs.writeFile(path.join(repo, 'two.txt'), 'old two\n');
  await fs.writeFile(path.join(repo, 'test/result.test.mjs'), `import {test} from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';test('combined edits',()=>{assert.equal(readFileSync('one.txt','utf8'),'new one\\n');assert.equal(readFileSync('two.txt','utf8'),'${checkFails ? 'wrong' : 'new two'}\\n');});`);
  await git(repo, 'init', '-b', 'main'); await git(repo, 'config', 'user.name', 'Fixture'); await git(repo, 'config', 'user.email', 'fixture@localhost');
  await git(repo, 'remote', 'add', 'origin', badOrigin ? 'https://github.com/unrelated/repo.git' : 'https://github.com/vlam1881997-ops/build-my-home.git');
  await git(repo, 'add', '.'); await git(repo, 'commit', '-m', 'Base');
  const base = await git(repo, 'rev-parse', 'HEAD'); await git(repo, 'update-ref', 'refs/remotes/origin/main', base);
  return { repo, base, stateRoot: path.join(root, 'state') };
}
function mockWorkers(value, { extra = false, hang = false, noChanges = false, onRun, afterWrite } = {}) {
  let firstArrived; let secondArrived;
  const first = new Promise(resolve => { firstArrived = resolve; }); const second = new Promise(resolve => { secondArrived = resolve; });
  return [0, 1].map(index => ({ id: index ? 'two' : 'one', interrupted: 0, async interrupt() { this.interrupted++; }, async run(prompt, options) {
    if (options.readOnly) { assert.ok(options.outputSchema); return JSON.stringify(value); }
    await onRun?.(options.cwd, index);
    if (hang) return new Promise(() => {});
    if (!noChanges) await fs.writeFile(path.join(options.cwd, index ? 'two.txt' : 'one.txt'), index ? 'new two\n' : 'new one\n');
    if (extra && !index) await fs.writeFile(path.join(options.cwd, 'unexpected.txt'), 'unexpected');
    await afterWrite?.(options.cwd, index);
    if (index) { secondArrived(); await first; } else { firstArrived(); await second; }
    return 'Completed assigned file.';
  } }));
}
function create(fix, workers, extras = {}) { return new TeamJob({ ...fix, goal: 'Improve the selected feature', workers, fetch: false, autoPublish:false, modelSettings:fixtureSettings(), ...extras }); }

test('two workers use separate worktrees and combine only into checked integration branch', async t => {
  const fix = await fixture(t); const paths = []; const workers = mockWorkers(plan(), { onRun: (cwd, index) => { paths[index] = cwd; } });
  const job = create(fix, workers); const result = await job.start();
  assert.equal(result.status, 'ready', result.error); assert.equal(result.results.length, 2); assert.notEqual(paths[0], paths[1]); assert.notEqual(paths[0], fix.repo);
  assert.equal(await git(fix.repo, 'rev-parse', 'main'), fix.base); assert.equal(await fs.readFile(path.join(fix.repo, 'one.txt'), 'utf8'), 'old one\n');
  assert.equal(await fs.readFile(path.join(result.path, 'one.txt'), 'utf8'), 'new one\n');
  assert.equal(await git(result.path, 'branch', '--show-current'), result.branch);
  assert.ok(result.events.some(event => event.message.startsWith('Check 1/')));
});

test('automatic publishing checks GitHub write access before account work starts',async t=>{
  const fix=await fixture(t);let workerCalls=0;const job=create(fix,mockWorkers(plan(),{onRun(){workerCalls++;}}),{autoPublish:true});
  const actual=job.git.bind(job);job.git=async(args,...rest)=>{
    if(args[0]==='push' && args.includes('--dry-run')){const error=new Error('Repository not found');error.gitDiagnostic={operation:'push',summary:'Git push preflight failed.'};throw error;}
    return actual(args,...rest);
  };
  const result=await job.start();assert.equal(result.status,'failed');assert.equal(workerCalls,0);assert.equal(result.workspaceReady,false);assert.equal(result.diagnostic.operation,'push');
  await assert.rejects(fs.stat(result.path),{code:'ENOENT'});assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);
});

test('automatic publishing sends the tested commit to main without force after build and full tests',async t=>{
  const fix=await fixture(t);await fs.writeFile(path.join(fix.repo,'package.json'),JSON.stringify({scripts:{build:"node -e \"require('node:fs').mkdirSync('dist',{recursive:true})\"",test:'node --test test/result.test.mjs'}}));
  await git(fix.repo,'add','package.json');await git(fix.repo,'commit','-m','Add verified scripts');fix.base=await git(fix.repo,'rev-parse','HEAD');await git(fix.repo,'update-ref','refs/remotes/origin/main',fix.base);
  const pushCalls=[];let pushedCommit=null;const job=create(fix,mockWorkers(plan()),{autoPublish:true});const actual=job.git.bind(job);
  job.git=async(args,cwd=fix.repo,options)=>{
    if(args[0]==='push' && args.includes('--dry-run')){pushCalls.push(args);return '';}
    if(args[0]==='ls-remote')return `${fix.base}\trefs/heads/main`;
    if(args[0]==='push'){pushCalls.push(args);pushedCommit=await actual(['rev-parse','HEAD'],cwd);return '';}
    return actual(args,cwd,options);
  };
  const result=await job.start();assert.equal(result.status,'published',result.error);assert.equal(result.publishedCommit,pushedCommit);assert.equal(result.plan.checks[0].args[1],'build');assert.ok(result.plan.checks.some(check=>check.program==='npm' && check.args[1]==='test'));
  assert.equal(pushCalls.length,2);assert.ok(pushCalls[1].includes(`${pushedCommit}:refs/heads/main`));assert.ok(!pushCalls[1].some(arg=>arg==='--force'||arg.startsWith('--force=')));
  assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);assert.ok(result.events.some(event=>event.message.includes('origin/main')));
});

test('automatic publishing never pushes when the full verification fails',async t=>{
  const fix=await fixture(t,{checkFails:true});let realPushes=0;const job=create(fix,mockWorkers(plan()),{autoPublish:true});const actual=job.git.bind(job);
  job.git=async(args,...rest)=>{if(args[0]==='push' && args.includes('--dry-run'))return '';if(args[0]==='push')realPushes++;return actual(args,...rest);};
  const result=await job.start();assert.equal(result.status,'failed');assert.match(result.error,/command failed/);assert.equal(realPushes,0);assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);
});

test('automatic publishing stops if main changes during verification',async t=>{
  const fix=await fixture(t);let realPushes=0;const job=create(fix,mockWorkers(plan()),{autoPublish:true});const actual=job.git.bind(job);
  job.git=async(args,...rest)=>{if(args[0]==='push' && args.includes('--dry-run'))return '';if(args[0]==='ls-remote')return `${'f'.repeat(40)}\trefs/heads/main`;if(args[0]==='push')realPushes++;return actual(args,...rest);};
  const result=await job.start();assert.equal(result.status,'failed');assert.match(result.error,/origin\/main đã đổi/);assert.equal(realPushes,0);assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);assert.equal(await git(result.path,'branch','--show-current'),result.branch);
});
test('planning and parallel edits retain each chosen model from the job snapshot',async t=>{
  const fix=await fixture(t);const observed=[];
  const workers=mockWorkers(plan()).map(worker=>{const run=worker.run.bind(worker);worker.run=async(prompt,options)=>{observed.push({worker:worker.id,readOnly:options.readOnly,model:options.model,reasoningEffort:options.reasoningEffort});return run(prompt,options);};return worker;});
  const settings={one:{model:'gpt-6-astra',reasoningEffort:'xhigh'},two:{model:'gpt-6.1-sol',reasoningEffort:'high'}};
  const job=create(fix,workers,{modelSettings:settings});settings.one.model='gpt-6-sol';
  const result=await job.start();assert.equal(result.status,'ready',result.error);
  assert.deepEqual(observed.filter(item=>item.worker==='one').map(item=>[item.model,item.reasoningEffort]),[['gpt-6-astra','xhigh'],['gpt-6-astra','xhigh']]);
  assert.deepEqual(observed.find(item=>item.worker==='two'),{worker:'two',readOnly:false,model:'gpt-6.1-sol',reasoningEffort:'high'});
  assert.equal(result.modelSettings.one.model,'gpt-6-astra');assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);
});

test('Desktop mode uses matching recently fetched main without a second authenticated fetch',async t=>{
  const fix=await fixture(t);
  await fs.writeFile(path.join(fix.repo,'.git','FETCH_HEAD'),`${fix.base}\t\tbranch 'main' of https://github.com/vlam1881997-ops/build-my-home\n`);
  const job=create(fix,mockWorkers(plan()),{fetch:true,sourceMode:'desktop'});
  const actualGit=job.git.bind(job);let fetches=0;
  job.git=async(args,...rest)=>{if(args[0]==='fetch'){fetches++;throw Error('Unexpected remote fetch');}return actualGit(args,...rest);};
  const result=await job.start();assert.equal(result.status,'ready',result.error);
  assert.equal(fetches,0);assert.equal(result.source.mode,'desktop');assert.equal(result.source.baseCommit,fix.base);assert.equal(result.workspaceReady,true);
  assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);assert.equal(result.modelSettings.one.model,'gpt-6.1-sol');
});
test('Desktop mode without recent fetch evidence blocks before planning and never falls back',async t=>{
  const fix=await fixture(t);let calls=0;
  const workers=['one','two'].map(id=>({id,run:async()=>{calls++;throw Error('Worker should not run');},interrupt:async()=>{}}));
  const job=create(fix,workers,{fetch:true,sourceMode:'desktop'});
  const actualGit=job.git.bind(job);let fetches=0;
  job.git=async(args,...rest)=>{if(args[0]==='fetch')fetches++;return actualGit(args,...rest);};
  const result=await job.start();assert.equal(result.status,'failed');assert.match(result.error,/Fetch origin/);
  assert.equal(calls,0);assert.equal(fetches,0);assert.equal(result.workspaceReady,false);assert.equal(result.source,null);
});
test('real child fetch failure exposes sanitized Git details and log path before model calls',async t=>{
  const fix=await fixture(t);let calls=0;
  const workers=['one','two'].map(id=>({id,run:async()=>{calls++;throw Error('Worker should not run');},interrupt:async()=>{}}));
  const job=create(fix,workers,{fetch:true});const actualGit=job.git.bind(job);
  const secret='ghp_'+'a'.repeat(35);
  job.git=async(args,...rest)=>{
    if(args[0]==='fetch')return (await job.command(process.execPath,['--eval',`process.stderr.write(${JSON.stringify('fatal: could not read Username: terminal prompts disabled '+secret)});process.exit(128)`],fix.repo,{gitOperation:'fetch',logName:'fetch.log'})).stdout;
    return actualGit(args,...rest);
  };
  const result=await job.start();assert.equal(result.status,'failed');assert.equal(calls,0);assert.equal(result.workspaceReady,false);
  assert.equal(result.diagnostic.exitCode,128);assert.match(result.diagnostic.details,/terminal prompts disabled/);
  assert.match(result.diagnostic.help,/GitHub Desktop/);assert.ok(!JSON.stringify(result).includes(secret));
  assert.match(await fs.readFile(result.diagnostic.logPath,'utf8'),/\[redacted\]/);
  assert.ok(!(await fs.readFile(result.diagnostic.logPath,'utf8')).includes(secret));
  await assert.rejects(fs.stat(result.path),{code:'ENOENT'});assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);
});

for (const [name, value] of [
  ['ownership overlap', plan({ second: ['one.txt'] })],
  ['path traversal', plan({ first: ['../one.txt'] })],
  ['Windows alternate data stream', plan({ first: ['one.txt:stream'] })],
  ['Windows reserved device', plan({ first: ['src/CON.js'] })],
  ['Windows trailing dot alias', plan({ first: ['src/one.js.'] })],
  ['protected secret path', plan({ first: ['.env'] })],
  ['shell command', plan({ checks: [{ program: 'sh', args: ['-c', 'true'] }] })],
  ['node arbitrary evaluation', plan({ checks: [{ program: 'node', args: ['--eval', '1'] }] })]
]) test(`rejects ${name} before writable worker turns`, async t => {
  const fix = await fixture(t); let writes = 0; const job = create(fix, mockWorkers(value, { onRun() { writes++; } }));
  const result = await job.start(); assert.equal(result.status, 'failed'); assert.equal(writes, 0); assert.equal(await git(fix.repo, 'rev-parse', 'main'), fix.base);
});

test('out-of-ownership edits fail and source main is preserved', async t => {
  const fix = await fixture(t); const result = await create(fix, mockWorkers(plan(), { extra: true })).start();
  assert.equal(result.status, 'failed'); assert.match(result.error, /unowned file/); assert.equal(await git(fix.repo, 'rev-parse', 'main'), fix.base);
});

test('failed combined verification cannot report ready', async t => {
  const fix = await fixture(t, { checkFails: true }); const result = await create(fix, mockWorkers(plan())).start();
  assert.equal(result.status, 'failed'); assert.match(result.error, /command failed/); assert.equal(result.results.length, 2); assert.equal(await git(fix.repo, 'rev-parse', 'main'), fix.base);
});

test('no-op task is incomplete, not ready', async t => {
  const fix = await fixture(t); const result = await create(fix, mockWorkers(plan(), { noChanges: true })).start(); assert.equal(result.status, 'failed'); assert.match(result.error, /no source changes/);
});

test('stop aborts hanging worker turns and returns stopped', async t => {
  const fix = await fixture(t); let entered; const writing = new Promise(resolve => { entered = resolve; });
  const workers = mockWorkers(plan(), { hang: true, onRun() { entered(); } }); const job = create(fix, workers);
  const running = job.start(); await writing; await job.stop();
  const result = await Promise.race([running, new Promise((_, reject) => { const timeout = setTimeout(() => reject(new Error('stop did not finish')), 2000); timeout.unref(); })]);
  assert.equal(result.status, 'stopped'); assert.ok(workers.every(worker => worker.interrupted)); assert.equal(job.children.size, 0); assert.equal(await git(fix.repo, 'rev-parse', 'main'), fix.base);
});

test('wrong repository origin is rejected', async t => {
  const fix = await fixture(t, { badOrigin: true }); const result = await create(fix, mockWorkers(plan())).start(); assert.equal(result.status, 'failed'); assert.match(result.error, /Repository origin/);
});

test('dirty source checkout is never reset or edited', async t => {
  const fix = await fixture(t); await fs.writeFile(path.join(fix.repo, 'one.txt'), 'user work\n');
  const result = await create(fix, mockWorkers(plan())).start(); assert.equal(result.status, 'failed'); assert.match(result.error, /uncommitted/); assert.equal(await fs.readFile(path.join(fix.repo, 'one.txt'), 'utf8'), 'user work\n');
});

test('unexpected shared Git ref changes prevent integration', async t => {
  const fix = await fixture(t);
  const workers = mockWorkers(plan(), { async onRun(cwd, index) { if (!index) await git(cwd, 'update-ref', 'refs/heads/unexpected', fix.base); } });
  const result = await create(fix, workers).start(); assert.equal(result.status, 'failed'); assert.match(result.error, /Git refs changed/); assert.equal(await git(fix.repo, 'rev-parse', 'main'), fix.base);
});

test('owned symlink cannot escape the worktree', async t => {
  const fix = await fixture(t);
  const workers = mockWorkers(plan(), { async afterWrite(cwd, index) { if (!index) { await fs.unlink(path.join(cwd, 'one.txt')); await fs.symlink(process.platform === 'win32' ? fix.repo : path.join(fix.repo, 'one.txt'), path.join(cwd, 'one.txt'), process.platform === 'win32' ? 'junction' : 'file'); } } });
  const result = await create(fix, workers).start(); assert.equal(result.status, 'failed'); assert.match(result.error, /symbolic links/);
});

test('recognizable provider credentials are rejected from source changes', async t => {
  const fix = await fixture(t);
  const workers = mockWorkers(plan(), { async afterWrite(cwd, index) { if (!index) await fs.writeFile(path.join(cwd, 'one.txt'), 'AIza' + 'z'.repeat(36)); } });
  const result = await create(fix, workers).start(); assert.equal(result.status, 'failed'); assert.match(result.error, /credentials/);
});

test('verification process does not inherit parent provider credentials', async t => {
  const fix = await fixture(t); const old = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY = 'fixture-secret-parent';
  t.after(() => { if (old === undefined) delete process.env.OPENAI_API_KEY; else process.env.OPENAI_API_KEY = old; });
  const filename = 'test/env.test.mjs'; await fs.writeFile(path.join(fix.repo, filename), "import{test}from'node:test';import assert from'node:assert/strict';test('no provider token',()=>assert.equal(process.env.OPENAI_API_KEY,undefined));");
  await git(fix.repo, 'add', filename); await git(fix.repo, 'commit', '-m', 'Environment test'); await git(fix.repo, 'update-ref', 'refs/remotes/origin/main', await git(fix.repo, 'rev-parse', 'HEAD'));
  const result = await create(fix, mockWorkers(plan({ checks: [{ program: 'node', args: ['--test', filename] }] }))).start(); assert.equal(result.status, 'ready', result.error);
});

test('stop terminates an outstanding verification child process', async t => {
  const fix = await fixture(t); const job = create(fix, mockWorkers(plan()));
  const command = job.command('node', ['-e', 'setInterval(()=>{},1000)'], fix.repo);
  assert.equal(job.children.size, 1); await job.stop(); await assert.rejects(command, /stopped/); assert.equal(job.children.size, 0); assert.equal(job.status, 'stopped');
});

test('worker timeout remains failed and interrupts both accounts', async t => {
  const fix = await fixture(t); const workers = mockWorkers(plan(), { hang: true }); const job = create(fix, workers, { workerTimeoutMs: 40 });
  const result = await job.start(); assert.equal(result.status, 'failed'); assert.match(result.error, /timed out/); assert.ok(workers.every(worker => worker.interrupted)); assert.equal(job.children.size, 0);
});

test('read-only planner gets the exact test-file rules and one repair for a malformed node check',async t=>{
  const fix=await fixture(t);const workers=mockWorkers(plan());const original=workers[0].run.bind(workers[0]);let planningCalls=0,writableCalls=0;
  workers[0].run=async(prompt,options)=>{
    if(options.readOnly) {
      planningCalls++;
      if(planningCalls===1){assert.match(prompt,/args exactly \["--test","tests\/actual-existing\.test\.mjs"\]/);assert.match(prompt,/test\/result\.test\.mjs/);return JSON.stringify(plan({checks:[{program:'node',args:['test/result.test.mjs']}]}));}
      assert.match(prompt,/previous draft was not accepted/i);assert.match(prompt,/--test must be args\[0\]/);
      assert.match(prompt,/Valid existing test paths: \["test\/result\.test\.mjs"\]/);
      return JSON.stringify(plan({checks:[{program:'node',args:['--test','test/result.test.mjs']}]}));
    }
    writableCalls++;return original(prompt,options);
  };
  const result=await create(fix,workers).start();assert.equal(result.status,'ready',result.error);
  assert.equal(planningCalls,2);assert.equal(writableCalls,1);
  assert.ok(result.events.some(event=>/yêu cầu TK1 sửa một lần/.test(event.message)));
  assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);
});

test('bad node-plan repair is attempted once and cannot create worker worktrees',async t=>{
  const fix=await fixture(t);const workers=mockWorkers(plan());const original=workers[0].run.bind(workers[0]);let planningCalls=0,writableCalls=0;
  workers[0].run=async(prompt,options)=>{
    if(options.readOnly){planningCalls++;return JSON.stringify(plan({checks:[{program:'node',args:['browser.cjs']}]}));}
    writableCalls++;return original(prompt,options);
  };
  const result=await create(fix,workers).start();assert.equal(result.status,'failed');
  assert.match(result.error,/Node verification needs args/);assert.equal(planningCalls,2);assert.equal(writableCalls,0);
  for(const account of ['account-1','account-2'])await assert.rejects(fs.stat(path.join(fix.stateRoot,result.id,account)),{code:'ENOENT'});
  assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);
});

async function stoppedWithEdits(t) {
  const fix=await fixture(t);let secondEntered,firstCompleted;
  const second=new Promise(resolve=>secondEntered=resolve);const first=new Promise(resolve=>firstCompleted=resolve);
  const workers=['one','two'].map((id,index)=>({id,async interrupt(){},async run(prompt,options){
    if(options.readOnly)return JSON.stringify(plan());
    await fs.writeFile(path.join(options.cwd,index?'two.txt':'one.txt'),index?'partial two\n':'new one\n');
    if(index){secondEntered();return new Promise(()=>{});}return 'First part completed.';
  }}));
  const job=create(fix,workers,{goal:'Original saved measured-house goal'});
  job.on('state',state=>{if(state.results[0]?.status==='completed')firstCompleted();});
  const running=job.start();await Promise.all([first,second]);await job.stop();await running;
  return {fix,snapshot:job.publicState};
}

test('legacy v1.1.2 interruption resumes original files and plan without fetch, replanning or new worktrees',async t=>{
  const {fix,snapshot}=await stoppedWithEdits(t);
  const legacy=structuredClone(snapshot);delete legacy.repo;delete legacy.worktreeId;delete legacy.resumedFrom;delete legacy.checkpoint;
  for(const result of legacy.results)if(result)delete result.fileHashes;
  const called=[];
  const workers=['one','two'].map((id,index)=>({id,async interrupt(){},async run(prompt,options){
    assert.equal(options.readOnly,false);assert.match(prompt,/continuation after interruption/);assert.match(prompt,/Original saved measured-house goal/);
    assert.equal(options.cwd,path.join(fix.stateRoot,snapshot.id,`account-${index+1}`));
    assert.equal(await fs.readFile(path.join(options.cwd,index?'two.txt':'one.txt'),'utf8'),index?'partial two\n':'new one\n');
    called.push(id);if(index)await fs.writeFile(path.join(options.cwd,'two.txt'),'new two\n');return 'Existing edits reviewed; unfinished part completed.';
  }}));
  const job=create(fix,workers,{resumeSnapshot:legacy,fetch:true,sourceMode:'desktop',goal:'Unrelated typed goal',modelSettings:{one:{model:'gpt-6-astra',reasoningEffort:'ultra'},two:{model:'gpt-6.1-sol',reasoningEffort:'ultra'}}});
  const actual=job.git.bind(job);job.git=async(args,...rest)=>{assert.ok(!['fetch','worktree'].includes(args[0]));return actual(args,...rest);};
  const result=await job.start();assert.equal(result.status,'ready',result.error);assert.deepEqual(called.sort(),['one','two']);
  assert.equal(result.path,snapshot.path);assert.equal(result.branch,snapshot.branch);assert.equal(result.worktreeId,snapshot.id);assert.notEqual(result.id,snapshot.id);
  assert.equal(result.goal,snapshot.goal);assert.equal(result.resumedFrom,snapshot.id);assert.equal(result.source.mode,'resume');assert.equal(result.source.baseCommit,fix.base);
  assert.equal(result.timing.maxMinutes,240);assert.equal(result.timing.idleMinutes,60);assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);
});

test('verified completed worker is reused while the unfinished worker continues',async t=>{
  const {fix,snapshot}=await stoppedWithEdits(t);let firstCalls=0,secondCalls=0;
  const workers=[{id:'one',async interrupt(){},async run(){firstCalls++;throw Error('Completed content must be reused');}},{id:'two',async interrupt(){},async run(prompt,options){secondCalls++;assert.equal(options.readOnly,false);await fs.writeFile(path.join(options.cwd,'two.txt'),'new two\n');return 'Finished remaining edits.';}}];
  const result=await create(fix,workers,{resumeSnapshot:snapshot}).start();
  assert.equal(result.status,'ready',result.error);assert.equal(firstCalls,0);assert.equal(secondCalls,1);assert.match(result.results[0].report,/First part completed/);
});

test('changed completed content is rechecked by its owner instead of trusting its saved hash',async t=>{
  const {fix,snapshot}=await stoppedWithEdits(t);const cwd=path.join(fix.stateRoot,snapshot.id,'account-1');await fs.writeFile(path.join(cwd,'one.txt'),'user changed after stop\n');let firstCalls=0;
  const workers=['one','two'].map((id,index)=>({id,async interrupt(){},async run(prompt,options){assert.equal(options.readOnly,false);if(!index){firstCalls++;assert.equal(await fs.readFile(path.join(options.cwd,'one.txt'),'utf8'),'user changed after stop\n');}await fs.writeFile(path.join(options.cwd,index?'two.txt':'one.txt'),index?'new two\n':'new one\n');return 'Reviewed current edits.';}}));
  const result=await create(fix,workers,{resumeSnapshot:snapshot}).start();assert.equal(result.status,'ready',result.error);assert.equal(firstCalls,1);
});

for(const violation of ['unowned','history','ignored','symlink'])test(`resume rejects saved ${violation} before any model call and preserves edits`,async t=>{
  const {fix,snapshot}=await stoppedWithEdits(t);const cwd=path.join(fix.stateRoot,snapshot.id,'account-2');let calls=0;
  if(violation==='unowned')await fs.writeFile(path.join(cwd,'unexpected.txt'),'keep this file');
  if(violation==='history'){await git(cwd,'add','two.txt');await git(cwd,'commit','-m','Unexpected saved history');}
  if(violation==='ignored'){await git(fix.repo,'config','core.excludesFile',path.join(fix.stateRoot,'ignore'));await fs.writeFile(path.join(fix.stateRoot,'ignore'),'ignored-output\n');await fs.writeFile(path.join(cwd,'ignored-output'),'keep ignored output');}
  if(violation==='symlink'){await fs.unlink(path.join(cwd,'two.txt'));await fs.symlink(path.join(fix.repo,'two.txt'),path.join(cwd,'two.txt'));}
  const workers=['one','two'].map(id=>({id,async interrupt(){},async run(){calls++;throw Error('Should not run');}}));
  const result=await create(fix,workers,{resumeSnapshot:snapshot}).start();assert.equal(result.status,'failed');assert.equal(calls,0);assert.equal(await git(fix.repo,'rev-parse','main'),fix.base);
  assert.equal(await fs.readFile(path.join(fix.stateRoot,snapshot.id,'account-1','one.txt'),'utf8'),'new one\n');
  if(violation==='unowned')assert.equal(await fs.readFile(path.join(cwd,'unexpected.txt'),'utf8'),'keep this file');
});

test('resume rejects another source repository instead of starting the saved plan there',async t=>{
  const original=await stoppedWithEdits(t);const other=await fixture(t);let calls=0;
  const workers=['one','two'].map(id=>({id,async interrupt(){},async run(){calls++;throw Error('Should not run');}}));
  const result=await create({...other,stateRoot:original.fix.stateRoot},workers,{resumeSnapshot:original.snapshot}).start();
  assert.equal(result.status,'failed');assert.match(result.error,/đúng repo/);assert.equal(calls,0);assert.equal(await fs.readFile(path.join(original.fix.stateRoot,original.snapshot.id,'account-2','two.txt'),'utf8'),'partial two\n');
});

test('job watchdog renews idle on activity but still enforces an absolute cap',async t=>{
  const fix=await fixture(t);const worker=new EventEmitter();Object.assign(worker,{id:'one',interrupt:async()=>{},run:async(prompt,options)=>{assert.equal(options.timeoutMs,200);assert.equal(options.idleTimeoutMs,70);return new Promise(()=>{});}});
  const job=create(fix,[worker,{id:'two',interrupt:async()=>{},run:async()=>{}}],{workerTimeoutMs:200,workerIdleTimeoutMs:70});
  const activity=setInterval(()=>worker.emit('activity',{type:'item.completed',at:new Date().toISOString()}),25);
  const before=Date.now();try {await assert.rejects(job.runWorker(worker,'work',{readOnly:false}),error=>error.timeoutType==='maximum');}finally {clearInterval(activity);}
  assert.ok(Date.now()-before>=175);assert.equal(worker.listenerCount('activity'),0);assert.equal(job.timers.size,0);
});

test('job watchdog stops silent activity and exposes the selected effort budgets',async t=>{
  const fix=await fixture(t);const worker=new EventEmitter();Object.assign(worker,{id:'one',interrupt:async()=>{},run:async()=>new Promise(()=>{})});
  const job=create(fix,[worker,{id:'two',interrupt:async()=>{},run:async()=>{}}],{workerTimeoutMs:300,workerIdleTimeoutMs:35});
  await assert.rejects(job.runWorker(worker,'work',{readOnly:false}),error=>error.timeoutType==='idle');assert.equal(worker.listenerCount('activity'),0);assert.equal(job.timers.size,0);
  const policies=[];
  const recorder={id:'one',interrupt:async()=>{},run:async(prompt,options)=>{policies.push([options.timeoutMs/60_000,options.idleTimeoutMs/60_000]);return 'done';}};
  const ultra=create(fix,[recorder,{id:'two',interrupt:async()=>{},run:async()=>{}}],{modelSettings:{one:{model:'gpt-6.1-sol',reasoningEffort:'ultra'},two:fixtureSettings().two}});
  await ultra.runWorker(recorder,'plan',{readOnly:true});await ultra.runWorker(recorder,'work',{readOnly:false});assert.deepEqual(policies,[[90,45],[240,60]]);
});

for (const outside of [false, true]) test(`verification ${outside ? 'source writes fail' : 'dist/public artifacts are retained without committing'}`, async t => {
  const fix = await fixture(t); const filename = 'test/artifacts.test.mjs';
  const writer = outside ? "mkdirSync('src',{recursive:true});writeFileSync('src/unexpected.js','changed source');" : "mkdirSync('dist',{recursive:true});mkdirSync('public',{recursive:true});writeFileSync('dist/app.js','generated app');writeFileSync('public/index.html','generated page');";
  await fs.writeFile(path.join(fix.repo, filename), `import{test}from'node:test';import{mkdirSync,writeFileSync}from'node:fs';test('build output',()=>{${writer}});`);
  await git(fix.repo, 'add', filename); await git(fix.repo, 'commit', '-m', 'Artifact fixture');
  const base = await git(fix.repo, 'rev-parse', 'HEAD'); await git(fix.repo, 'update-ref', 'refs/remotes/origin/main', base);
  const result = await create(fix, mockWorkers(plan({ checks: [{ program: 'node', args: ['--test', filename] }] }))).start();
  assert.equal(result.status, outside ? 'failed' : 'ready', result.error);
  assert.equal(await git(fix.repo, 'rev-parse', 'main'), base);
  if (outside) assert.match(result.error, /outside dist\/public/);
  else {
    assert.deepEqual(result.artifacts.sort(), ['dist/app.js', 'public/index.html']);
    assert.equal(await fs.readFile(path.join(result.path, 'dist/app.js'), 'utf8'), 'generated app');
    assert.equal(await git(result.path, 'ls-files', 'dist', 'public'), '');
    assert.ok(result.events.some(event => /Preserved 2 generated/.test(event.message)));
  }
});

test('stateRoot symlink/junction cannot place worktrees under source', async t => {
  const fix = await fixture(t); const alias = path.join(path.dirname(fix.repo), 'alias');
  await fs.symlink(fix.repo, alias, process.platform === 'win32' ? 'junction' : 'dir');
  const result = await create(fix, mockWorkers(plan()), { stateRoot: path.join(alias, 'jobs') }).start();
  assert.equal(result.status, 'failed'); assert.match(result.error, /outside the source repository/); await assert.rejects(fs.stat(path.join(fix.repo, 'jobs')), { code: 'ENOENT' });
});

test('signed-commit user defaults do not block local team integration', async t => {
  const fix = await fixture(t); await git(fix.repo, 'config', 'commit.gpgsign', 'true'); await git(fix.repo, 'config', 'gpg.program', 'nonexistent-bmh-gpg');
  const result = await create(fix, mockWorkers(plan())).start(); assert.equal(result.status, 'ready', result.error); assert.equal(await git(fix.repo, 'config', 'commit.gpgsign'), 'true');
});

test('worker-generated ignored artifacts fail before integration', async t => {
  const fix = await fixture(t); await fs.writeFile(path.join(fix.repo, '.gitignore'), 'dist/\npublic/\n.env\nnode_modules/\n');
  await git(fix.repo, 'add', '.gitignore'); await git(fix.repo, 'commit', '-m', 'Ignore generated files'); await git(fix.repo, 'update-ref', 'refs/remotes/origin/main', await git(fix.repo, 'rev-parse', 'HEAD'));
  const workers = mockWorkers(plan(), { async afterWrite(cwd, index) { if (!index) { await fs.mkdir(path.join(cwd, 'dist')); await fs.writeFile(path.join(cwd, 'dist/app.js'), 'worker build'); } } });
  const result = await create(fix, workers).start(); assert.equal(result.status, 'failed'); assert.match(result.error, /protected or ignored files/);
});

test('failed dependency link falls back to isolated npm ci without changing base', async t => {
  const fix = await fixture(t); const job = create(fix, mockWorkers(plan()));
  job.packageJson = { dependencies: { fixture: '1.0.0' } }; job.packageText = JSON.stringify(job.packageJson);
  await fs.writeFile(path.join(fix.repo, 'package.json'), job.packageText); await fs.writeFile(path.join(fix.repo, 'package-lock.json'), 'fixture-lock'); await fs.mkdir(path.join(fix.repo, 'node_modules'));
  await fs.mkdir(job.path, { recursive: true }); await fs.writeFile(path.join(job.path, 'package-lock.json'), 'fixture-lock');
  const worker = path.join(fix.stateRoot, 'worker'); await fs.mkdir(worker, { recursive: true });
  const original = fs.symlink; let calls = 0; fs.symlink = async (...args) => { if (++calls === 1) throw Object.assign(new Error('cross-volume fixture'), { code: 'EXDEV' }); return original(...args); };
  t.after(() => { fs.symlink = original; });
  let installed = false; job.command = async (program, args, cwd) => { assert.equal(program, 'npm'); assert.deepEqual(args, ['ci', '--ignore-scripts', '--no-audit', '--no-fund']); assert.equal(cwd, job.path); await fs.mkdir(path.join(cwd, 'node_modules')); installed = true; };
  await job.prepareDependencies([worker]); assert.equal(installed, true); assert.equal(await fs.realpath(path.join(worker, 'node_modules')), await fs.realpath(path.join(job.path, 'node_modules')));
  assert.equal((await fs.lstat(path.join(fix.repo, 'node_modules'))).isDirectory(), true);
});

test('resume reuses existing dependency links without reinstalling or removing worker files',async t=>{
  const {fix,snapshot}=await stoppedWithEdits(t);const job=create(fix,mockWorkers(plan()),{resumeSnapshot:snapshot});
  job.packageJson={dependencies:{fixture:'1.0.0'}};job.packageText=JSON.stringify(job.packageJson);
  const lock='fixture lock';await fs.writeFile(path.join(fix.repo,'package.json'),job.packageText);await fs.writeFile(path.join(fix.repo,'package-lock.json'),lock);
  await fs.mkdir(path.join(fix.repo,'node_modules'));await fs.writeFile(path.join(fix.repo,'node_modules','keep'),'dependency fixture');
  await fs.writeFile(path.join(job.path,'package-lock.json'),lock);
  const paths=[1,2].map(index=>path.join(fix.stateRoot,snapshot.id,`account-${index}`));
  for(const cwd of [job.path,...paths])await fs.symlink(path.join(fix.repo,'node_modules'),path.join(cwd,'node_modules'),process.platform==='win32'?'junction':'dir');
  job.command=async()=>{throw Error('Dependencies should not be reinstalled');};
  await job.prepareDependencies(paths);assert.equal(job.dependencyLock,lock);
  assert.equal(await fs.readFile(path.join(paths[1],'two.txt'),'utf8'),'partial two\n');assert.equal(await fs.readFile(path.join(paths[1],'node_modules','keep'),'utf8'),'dependency fixture');
});

test('resume refuses an unexpected dependency target and preserves it',async t=>{
  const {fix,snapshot}=await stoppedWithEdits(t);const job=create(fix,mockWorkers(plan()),{resumeSnapshot:snapshot});
  job.packageJson={dependencies:{fixture:'1.0.0'}};job.packageText=JSON.stringify(job.packageJson);
  await fs.writeFile(path.join(job.path,'package-lock.json'),'fixture lock');
  const outside=path.join(fix.stateRoot,'unexpected-dependencies');await fs.mkdir(outside);await fs.writeFile(path.join(outside,'keep'),'kept');
  await fs.symlink(outside,path.join(job.path,'node_modules'),process.platform==='win32'?'junction':'dir');
  job.command=async()=>{throw Error('Should not reinstall or overwrite existing dependencies');};
  await assert.rejects(job.prepareDependencies([path.join(fix.stateRoot,snapshot.id,'account-1')]),/different folder or package version/);
  assert.equal(await fs.readFile(path.join(outside,'keep'),'utf8'),'kept');
});

test('tracked generated outputs remain reviewable without source whitespace failure', async t => {
  const fix = await fixture(t); const filename = 'test/tracked-artifact.test.mjs';
  await fs.mkdir(path.join(fix.repo, 'dist')); await fs.writeFile(path.join(fix.repo, 'dist/app.js'), 'old output\n');
  await fs.writeFile(path.join(fix.repo, filename), "import{test}from'node:test';import{writeFileSync}from'node:fs';test('generated output',()=>writeFileSync('dist/app.js','generated output  \\n'));");
  await git(fix.repo, 'add', '.'); await git(fix.repo, 'commit', '-m', 'Tracked artifact'); const base = await git(fix.repo, 'rev-parse', 'HEAD'); await git(fix.repo, 'update-ref', 'refs/remotes/origin/main', base);
  const result = await create(fix, mockWorkers(plan({ checks: [{ program: 'node', args: ['--test', filename] }] }))).start();
  assert.equal(result.status, 'ready', result.error); assert.deepEqual(result.artifacts, ['dist/app.js']);
  assert.equal(await git(result.path, 'show', 'HEAD:dist/app.js'), 'old output'); assert.equal(await fs.readFile(path.join(result.path, 'dist/app.js'), 'utf8'), 'generated output  \n');
  assert.equal(await git(fix.repo, 'rev-parse', 'main'), base);
});

test('declared build runs before selected tests to avoid stale BMH bundles', async t => {
  const fix = await fixture(t); const filename = 'test/bundle.test.mjs'; await fs.mkdir(path.join(fix.repo, 'scripts'));
  await fs.writeFile(path.join(fix.repo, 'package.json'), JSON.stringify({ scripts: { build: 'node scripts/build.cjs' } }));
  await fs.writeFile(path.join(fix.repo, 'scripts/build.cjs'), "const fs=require('node:fs');fs.mkdirSync('dist',{recursive:true});fs.writeFileSync('dist/bundle.txt',fs.readFileSync('one.txt','utf8'));");
  await fs.writeFile(path.join(fix.repo, filename), "import{test}from'node:test';import assert from'node:assert/strict';import{readFileSync}from'node:fs';test('rebuilt merged source',()=>assert.equal(readFileSync('dist/bundle.txt','utf8'),'new one\\n'));");
  await fs.writeFile(path.join(fix.repo, '.gitignore'), 'dist/\n'); await git(fix.repo, 'add', '.'); await git(fix.repo, 'commit', '-m', 'Build fixture'); await git(fix.repo, 'update-ref', 'refs/remotes/origin/main', await git(fix.repo, 'rev-parse', 'HEAD'));
  const result = await create(fix, mockWorkers(plan({ checks: [{ program: 'node', args: ['--test', filename] }] }))).start();
  assert.equal(result.status, 'ready', result.error); assert.deepEqual(result.plan.checks[0], { program: 'npm', args: ['run', 'build'] }); assert.deepEqual(result.artifacts, ['dist/bundle.txt']);
});
