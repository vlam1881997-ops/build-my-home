import { test } from 'node:test';
import assert from 'node:assert/strict';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { TeamJob } from '../jobs.mjs';

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
function create(fix, workers, extras = {}) { return new TeamJob({ ...fix, goal: 'Improve the selected feature', workers, fetch: false, ...extras }); }

test('two workers use separate worktrees and combine only into checked integration branch', async t => {
  const fix = await fixture(t); const paths = []; const workers = mockWorkers(plan(), { onRun: (cwd, index) => { paths[index] = cwd; } });
  const job = create(fix, workers); const result = await job.start();
  assert.equal(result.status, 'ready', result.error); assert.equal(result.results.length, 2); assert.notEqual(paths[0], paths[1]); assert.notEqual(paths[0], fix.repo);
  assert.equal(await git(fix.repo, 'rev-parse', 'main'), fix.base); assert.equal(await fs.readFile(path.join(fix.repo, 'one.txt'), 'utf8'), 'old one\n');
  assert.equal(await fs.readFile(path.join(result.path, 'one.txt'), 'utf8'), 'new one\n');
  assert.equal(await git(result.path, 'branch', '--show-current'), result.branch);
  assert.ok(result.events.some(event => event.message.startsWith('Check 1/')));
});

for (const [name, value] of [
  ['ownership overlap', plan({ second: ['one.txt'] })],
  ['path traversal', plan({ first: ['../one.txt'] })],
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
  const workers = mockWorkers(plan(), { async afterWrite(cwd, index) { if (!index) { await fs.unlink(path.join(cwd, 'one.txt')); await fs.symlink(path.join(fix.repo, 'one.txt'), path.join(cwd, 'one.txt')); } } });
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
