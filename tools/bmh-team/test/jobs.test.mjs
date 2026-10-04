import { test } from 'node:test';
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
function create(fix, workers, extras = {}) { return new TeamJob({ ...fix, goal: 'Improve the selected feature', workers, fetch: false, modelSettings:fixtureSettings(), ...extras }); }

test('two workers use separate worktrees and combine only into checked integration branch', async t => {
  const fix = await fixture(t); const paths = []; const workers = mockWorkers(plan(), { onRun: (cwd, index) => { paths[index] = cwd; } });
  const job = create(fix, workers); const result = await job.start();
  assert.equal(result.status, 'ready', result.error); assert.equal(result.results.length, 2); assert.notEqual(paths[0], paths[1]); assert.notEqual(paths[0], fix.repo);
  assert.equal(await git(fix.repo, 'rev-parse', 'main'), fix.base); assert.equal(await fs.readFile(path.join(fix.repo, 'one.txt'), 'utf8'), 'old one\n');
  assert.equal(await fs.readFile(path.join(result.path, 'one.txt'), 'utf8'), 'new one\n');
  assert.equal(await git(result.path, 'branch', '--show-current'), result.branch);
  assert.ok(result.events.some(event => event.message.startsWith('Check 1/')));
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
