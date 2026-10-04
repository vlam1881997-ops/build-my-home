import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomBytes } from 'node:crypto';

const ORIGIN = 'vlam1881997-ops/build-my-home';
const SCHEMA = {
  type: 'object', additionalProperties: false, required: ['summary', 'tasks', 'checks'],
  properties: {
    summary: { type: 'string' },
    tasks: { type: 'array', minItems: 2, maxItems: 2, items: {
      type: 'object', additionalProperties: false, required: ['title', 'instructions', 'ownedPaths'],
      properties: { title: { type: 'string' }, instructions: { type: 'string' }, ownedPaths: { type: 'array', minItems: 1, items: { type: 'string' } } }
    } },
    checks: { type: 'array', minItems: 1, items: {
      type: 'object', additionalProperties: false, required: ['program', 'args'],
      properties: { program: { type: 'string', enum: ['node', 'npm'] }, args: { type: 'array', items: { type: 'string' } } }
    } }
  }
};
const INVARIANTS = `BMH invariants: measured 2D drawings and 3D use the same geometry, units, floor program, openings and materials. Preserve the customer's selected style, existing 10 tabs, banking/material features and persisted projects. Do not invent construction-ready structural accuracy. Read docs/BMH-CUSTOMER-DESIGN.md when present. Do not call paid external APIs, install global dependencies, log in, add accounts or delegate to subagents. Do not commit, push, merge, deploy, reset or change Git refs. Do not write secrets or credentials. Make only the assigned literal files; report actual changes and limits.`;

function scrub(value) {
  return String(value ?? '').replace(/AIza[\w-]{20,}/g, '[redacted]').replace(/\bsk-[\w-]{12,}/g, '[redacted]')
    .replace(/(Bearer\s+)[\w.+\/-]{8,}/gi, '$1[redacted]')
    .replace(/((?:api[_-]?key|access[_-]?token|password|authorization)\s*[=:]\s*)[^\s,;]+/gi, '$1[redacted]')
    .replace(/https?:\/\/[^\s/@]+:[^\s/@]+@/gi, 'https://[redacted]@').slice(0, 6000);
}
function inside(parent, child) { const relative = path.relative(parent, child); return !relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)); }
function safeFile(value) {
  if (typeof value !== 'string' || !value || value.trim() !== value || value.length > 240 || value.includes('\\') || /[\x00-\x1f]/.test(value) || path.posix.isAbsolute(value) || /^[a-z]:/i.test(value)) throw new Error('Plan contains an invalid relative file path.');
  const parts = value.split('/');
  if (parts.some(p => !p || p === '.' || p === '..' || /[*?\[\]{}]/.test(p))) throw new Error('Plan paths must be exact relative filenames without traversal or globs.');
  if (parts.some(p => /^(?:\.git|\.ssh|\.codex|\.bmh-team|\.npmrc|\.netrc|\.pypirc|node_modules|dist|public)$/i.test(p) || /^\.env(?:\.|$)/i.test(p) || /(?:^|[._-])(?:auth|secrets?|credentials?|tokens?)(?:[._-]|$)/i.test(p) || /\.(?:pem|key|p12|pfx)$/i.test(p))) throw new Error('Plan includes a protected, credential or generated path.');
  return value;
}
function parseJson(text) {
  let raw = String(text).trim();
  if (raw.startsWith('```')) raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(raw); } catch { throw new Error('Account 1 did not return a valid JSON plan.'); }
}
async function optionalRead(filename) { try { return await fs.readFile(filename, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }

/** Local-only job: fetch defaults true. fetch:false is exclusively for offline fixture tests. */
export class TeamJob extends EventEmitter {
  constructor({ workers, repo, goal, gitCommand = 'git', stateRoot = path.join(os.homedir(), '.bmh-team', 'jobs'), onEvent, fetch = true, workerTimeoutMs = 20 * 60_000, commandTimeoutMs = 5 * 60_000 }) {
    super();
    if (!Array.isArray(workers) || workers.length !== 2 || workers.some(w => !w?.id || typeof w.run !== 'function' || typeof w.interrupt !== 'function') || workers[0].id === workers[1].id) throw new Error('Exactly two distinct workers are required.');
    this.workers = workers; this.repo = path.resolve(repo); this.goal = String(goal || '').trim();
    if (!this.goal || this.goal.length > 20_000) throw new Error('Provide a goal of 1–20,000 characters.');
    this.gitCommand = gitCommand; this.stateRoot = path.resolve(stateRoot);
    if (inside(this.repo, this.stateRoot)) throw new Error('Worktrees must be stored outside the source repository.');
    this.onEvent = onEvent; this.fetch = fetch; this.workerTimeoutMs = workerTimeoutMs; this.commandTimeoutMs = commandTimeoutMs;
    this.id = `${Date.now()}-${randomBytes(4).toString('hex')}`;
    this.status = 'preparing'; this.plan = null; this.results = []; this.artifacts = []; this.branch = `bmh-team/${this.id}/integration`;
    this.path = path.join(this.stateRoot, this.id, 'integration'); this.error = null; this.events = [];
    this.children = new Set(); this.timers = new Set(); this.aborted = false; this.started = false; this.activePromise = null;
  }
  get publicState() { return structuredClone({ id: this.id, status: this.status, goal: this.goal, plan: this.plan, results: this.results, artifacts: this.artifacts, branch: this.branch, path: this.path, error: this.error, events: this.events }); }
  note(message, worker) {
    this.events.push({ at: new Date().toISOString(), ...(worker ? { worker } : {}), message: scrub(message) });
    if (this.events.length > 200) this.events.shift();
    const state = this.publicState; this.emit('state', state);
    try { this.onEvent?.(state); } catch { /* An observer cannot alter the job outcome. */ }
  }
  phase(status, message) { if (this.aborted && status !== 'stopped') return; this.status = status; this.note(message); }
  assertActive() { if (this.aborted) throw new Error('Job stopped.'); }
  async kill(child) {
    if (child.exitCode !== null || !child.pid) return;
    if (process.platform === 'win32') {
      await new Promise(resolve => { const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' }); killer.once('error', resolve); killer.once('close', resolve); });
    } else {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch {} }
      await new Promise(resolve => { const timer = setTimeout(resolve, 100); child.once('close', () => { clearTimeout(timer); resolve(); }); });
      try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch {} }
    }
  }
  async command(program, args, cwd, { timeoutMs = this.commandTimeoutMs, logName, allowFailure = false } = {}) {
    this.assertActive();
    if (program === 'node') program = process.execPath;
    if (program === 'npm' && process.platform === 'win32') {
      const candidates = [process.env.npm_execpath, path.join(path.dirname(process.execPath), 'node_modules/npm/bin/npm-cli.js'), ...String(process.env.PATH || '').split(path.delimiter).map(p => path.join(p, 'node_modules/npm/bin/npm-cli.js'))].filter(Boolean);
      let cli;
      for (const filename of candidates) { try { if ((await fs.stat(filename)).isFile() && /npm-cli\.js$/i.test(filename)) { cli = filename; break; } } catch {} }
      if (!cli) throw new Error('npm CLI was not found. Install Node.js with npm, then restart BMH Team.');
      program = process.execPath; args = [cli, ...args];
    }
    return await new Promise((resolve, reject) => {
      const env = { ...process.env }; delete env.NODE_TEST_CONTEXT; delete env.NODE_OPTIONS;
      for (const key of Object.keys(env)) if (/(?:API[_-]?KEY|ACCESS[_-]?TOKEN|AUTH[_-]?TOKEN|PASSWORD|SECRET|(?:^|_)TOKEN$)/i.test(key) || /^(?:OPENAI|ANTHROPIC|GEMINI|VERCEL|GOOGLE_APPLICATION_CREDENTIALS)(?:_|$)/i.test(key)) delete env[key];
      const child = spawn(program, args, { cwd, env, shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
      this.children.add(child); let output = ''; let exceeded = false; let timedOut = false; let spawnError;
      const capture = bytes => { output += bytes.toString(); if (output.length > 2_000_000) { exceeded = true; output = output.slice(-200_000); void this.kill(child); } };
      child.stdout.on('data', capture); child.stderr.on('data', capture);
      const timer = setTimeout(() => { timedOut = true; void this.kill(child); }, timeoutMs); this.timers.add(timer);
      child.once('error', error => { spawnError = error; });
      child.once('close', async code => {
        clearTimeout(timer); this.timers.delete(timer); this.children.delete(child);
        try {
          if (logName) await fs.writeFile(path.join(this.stateRoot, this.id, logName), scrub(output), 'utf8');
          if (this.aborted) throw new Error('Job stopped.');
          if (timedOut) throw new Error(`Command timed out: ${path.basename(program)}. See local job logs.`);
          if (exceeded) throw new Error('Command output exceeded the safety limit.');
          if (spawnError) throw new Error(`Cannot start ${path.basename(program)}: ${spawnError.code || 'error'}.`);
          if (code !== 0 && !allowFailure) throw new Error(`${path.basename(program)} command failed (exit ${code}). See local job logs.`);
          resolve({ output, code });
        } catch (error) { reject(error); }
      });
    });
  }
  async git(args, cwd = this.repo, options) { return (await this.command(this.gitCommand, args, cwd, options)).output.trim(); }
  async runWorker(worker, prompt, options) {
    this.assertActive(); let timer; let onStop;
    const timeout = new Promise((_, reject) => { timer = setTimeout(() => { void Promise.resolve().then(() => worker.interrupt()).catch(() => {}); reject(new Error(`Account ${worker.id} timed out.`)); }, this.workerTimeoutMs); this.timers.add(timer); });
    const stopped = new Promise((_, reject) => { onStop = () => reject(new Error('Job stopped.')); this.once('stop', onStop); });
    try { return await Promise.race([worker.run(prompt, { ...options, timeoutMs: this.workerTimeoutMs }), timeout, stopped]); }
    finally { clearTimeout(timer); this.timers.delete(timer); this.removeListener('stop', onStop); }
  }
  validatePlan(value, scripts) {
    if (!value || typeof value.summary !== 'string' || !Array.isArray(value.tasks) || value.tasks.length !== 2 || !Array.isArray(value.checks) || !value.checks.length || value.checks.length > 12) throw new Error('Plan must contain exactly two tasks and at least one verification command.');
    const ownership = new Set();
    const tasks = value.tasks.map(task => {
      if (typeof task.title !== 'string' || !task.title.trim() || typeof task.instructions !== 'string' || !task.instructions.trim() || !Array.isArray(task.ownedPaths) || !task.ownedPaths.length || task.ownedPaths.length > 100) throw new Error('Each task needs a title, instructions and exact owned filenames.');
      const ownedPaths = task.ownedPaths.map(safeFile);
      for (const filename of ownedPaths) {
        const key = filename.toLowerCase();
        for (const existing of ownership) if (existing === key || existing.startsWith(key + '/') || key.startsWith(existing + '/')) throw new Error('Tasks have overlapping file ownership.');
        ownership.add(key);
      }
      return { title: task.title.slice(0, 200), instructions: task.instructions.slice(0, 20_000), ownedPaths };
    });
    const checks = value.checks.map(check => {
      if (!check || !Array.isArray(check.args) || check.args.some(arg => typeof arg !== 'string')) throw new Error('Verification commands must use argument arrays.');
      if (check.program === 'npm') {
        const [run, script] = check.args;
        if (check.args.length !== 2 || run !== 'run' || !/^(?:build|check|test|lint|typecheck)(?:[:_-][a-z0-9_-]+)?$/i.test(script || '') || /deploy|publish|release|upload|push|clean|reset|install|migrat/i.test(script) || typeof scripts[script] !== 'string') throw new Error('npm checks must run a declared non-destructive build, check, test, lint or typecheck script.');
      } else if (check.program === 'node') {
        if (check.args[0] !== '--test' || check.args.length < 2 || check.args.length > 33) throw new Error('node verification only supports --test with selected test files.');
        for (const filename of check.args.slice(1)) { safeFile(filename); if (!/^(?:tests?|[^/]+\/tests?)\/.+\.test\.(?:mjs|cjs|js)$/.test(filename)) throw new Error('node verification must select repository test files.'); }
      } else throw new Error('Only node or npm verification is supported.');
      return { program: check.program, args: [...check.args] };
    });
    return { summary: value.summary.slice(0, 2000), tasks, checks };
  }
  async verifyLiteral(cwd, filename, allowMissing = false) {
    const full = path.join(cwd, filename); let current = cwd;
    for (const part of filename.split('/')) {
      current = path.join(current, part);
      try { const stat = await fs.lstat(current); if (stat.isSymbolicLink()) throw new Error('Owned paths must not contain symbolic links.'); }
      catch (error) { if (allowMissing && error.code === 'ENOENT') return; throw error; }
    }
    try { if (!(await fs.lstat(full)).isFile()) throw new Error('Owned paths must be literal files, not directories.'); } catch (error) { if (allowMissing && error.code === 'ENOENT') return; throw error; }
  }
  async interruptWorkers() {
    await Promise.allSettled(this.workers.map(worker => new Promise(resolve => {
      const timer = setTimeout(resolve, 5000);
      Promise.resolve().then(() => worker.interrupt()).finally(() => { clearTimeout(timer); resolve(); }).catch(() => {});
    })));
  }
  async prepareDependencies(paths) {
    if (!this.packageJson || (!Object.keys(this.packageJson.dependencies || {}).length && !Object.keys(this.packageJson.devDependencies || {}).length)) return;
    const lock = await optionalRead(path.join(this.path, 'package-lock.json'));
    if (!lock) throw new Error('Dependency setup required: this repository needs a package-lock.json for reproducible npm ci.');
    const basePackage = await optionalRead(path.join(this.repo, 'package.json'));
    const baseLock = await optionalRead(path.join(this.repo, 'package-lock.json'));
    let source = path.join(this.path, 'node_modules');
    let reusable = false;
    try { reusable = basePackage === this.packageText && baseLock === lock && (await fs.stat(path.join(this.repo, 'node_modules'))).isDirectory(); } catch {}
    if (reusable) {
      source = path.join(this.repo, 'node_modules'); this.note('Using existing dependencies with the same package and lockfile.');
      await fs.symlink(source, path.join(this.path, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    } else {
      this.note('Preparing isolated dependencies with npm ci; lifecycle scripts are disabled.');
      await this.command('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], this.path, { logName: 'dependencies.log' });
    }
    for (const cwd of paths) await fs.symlink(source, path.join(cwd, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir');
    this.dependencyLock = lock;
  }
  start() {
    if (this.aborted) return Promise.resolve(this.publicState);
    if (this.started) return this.activePromise;
    this.started = true;
    this.activePromise = this.execute().catch(async error => {
      if (!this.aborted) { this.error = scrub(error.message); this.phase('failed', this.error); }
      await this.interruptWorkers();
      await Promise.allSettled([...this.children].map(child => this.kill(child)));
      return this.publicState;
    });
    return this.activePromise;
  }
  async execute() {
    this.phase('preparing', 'Checking BMH repository and preparing isolated branches.');
    await fs.mkdir(path.join(this.stateRoot, this.id), { recursive: true });
    const root = await this.git(['rev-parse', '--show-toplevel']);
    if (path.resolve(root) !== this.repo) throw new Error('Select the repository root directory.');
    const origin = await this.git(['remote', 'get-url', 'origin']);
    const accepted = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)(vlam1881997-ops\/build-my-home)(?:\.git)?\/?$/i;
    if (!accepted.test(origin)) throw new Error(`Repository origin must be github.com/${ORIGIN}.`);
    if (await this.git(['status', '--porcelain=v1', '--untracked-files=all'])) throw new Error('Source checkout has uncommitted files. Keep them safe; commit or stash them before starting a team job.');
    this.sourceHead = await this.git(['rev-parse', 'HEAD']);
    if (this.fetch) { this.note('Fetching the latest origin/main; the source checkout is not reset.'); await this.git(['fetch', '--no-tags', 'origin', 'main'], this.repo, { logName: 'fetch.log' }); }
    const base = await this.git(['rev-parse', '--verify', 'refs/remotes/origin/main']);
    await this.git(['worktree', 'add', '-b', this.branch, this.path, base]);
    this.packageText = await optionalRead(path.join(this.path, 'package.json'));
    try { this.packageJson = this.packageText ? JSON.parse(this.packageText) : null; } catch { throw new Error('Repository package.json is invalid.'); }
    const scripts = this.packageJson?.scripts || {};
    this.phase('planning', 'Account 1 is splitting the goal into two tasks with separate file ownership.');
    const prompt = `Plan this BMH development goal for exactly two accounts:\n${this.goal}\n\n${INVARIANTS}\nReturn JSON matching the provided schema. No edits. Each task must own exact literal relative file paths, never directories or globs. Account tasks may not share files. Do not include .git, secrets, auth, node_modules, dist or public paths. Use applicable npm build/check/test scripts or selected node --test files, never shell strings. Declared package scripts: ${JSON.stringify(scripts)}. Keep checks relevant and bounded; do not repeat every historical UI test.`;
    this.plan = this.validatePlan(parseJson(await this.runWorker(this.workers[0], prompt, { cwd: this.path, readOnly: true, outputSchema: SCHEMA })), scripts);
    this.assertActive();
    if (await this.git(['rev-parse', 'HEAD'], this.path) !== base || await this.git(['status', '--porcelain=v1', '--untracked-files=all'], this.path)) throw new Error('Planning changed the read-only worktree.');
    const paths = this.workers.map((_, index) => path.join(this.stateRoot, this.id, `account-${index + 1}`));
    const branches = this.workers.map((_, index) => `bmh-team/${this.id}/account-${index + 1}`);
    for (let index = 0; index < 2; index++) {
      await this.git(['worktree', 'add', '-b', branches[index], paths[index], base]);
      for (const filename of this.plan.tasks[index].ownedPaths) await this.verifyLiteral(paths[index], filename, true);
    }
    await this.prepareDependencies(paths);
    const refsBefore = await this.git(['for-each-ref', '--format=%(refname) %(objectname)']);
    this.phase('working', 'Both accounts are working simultaneously in separate worktrees.');
    const work = this.workers.map((worker, index) => (async () => {
      const task = this.plan.tasks[index]; this.note(`Started: ${task.title}`, worker.id);
      const report = await this.runWorker(worker, `Original goal:\n${this.goal}\n\nYour task: ${task.title}\n${task.instructions}\n\nYou may edit ONLY these exact files: ${JSON.stringify(task.ownedPaths)}. The other account owns different files. ${INVARIANTS}\nDo not change package/lock declarations when dependencies are shared. Finish with a short report of actual changes and checks.`, { cwd: paths[index], readOnly: false });
      this.assertActive();
      if (await this.git(['rev-parse', 'HEAD'], paths[index]) !== base || await this.git(['branch', '--show-current'], paths[index]) !== branches[index]) throw new Error(`Account ${worker.id} changed Git history or branch.`);
      await this.git(['diff', '--check'], paths[index]);
      await this.git(['diff', '--cached', '--check'], paths[index]);
      const tracked = await this.git(['diff', '--name-only', '-z', base], paths[index]);
      const untracked = await this.git(['ls-files', '--others', '--exclude-standard', '-z'], paths[index]);
      const files = [...new Set((tracked + '\0' + untracked).split('\0').filter(Boolean))];
      if (!files.length) throw new Error(`Account ${worker.id} made no source changes; the task is not complete.`);
      for (const filename of files) {
        safeFile(filename); if (!task.ownedPaths.includes(filename)) throw new Error(`Account ${worker.id} changed an unowned file: ${filename}.`);
        await this.verifyLiteral(paths[index], filename, true);
        const contents = await optionalRead(path.join(paths[index], filename));
        if (contents && /AIza[\w-]{25,}|\bsk-[\w-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(contents)) throw new Error('Source changes appear to contain credentials; review the isolated worker files.');
      }
      if (this.dependencyLock && (await optionalRead(path.join(paths[index], 'package.json')) !== this.packageText || await optionalRead(path.join(paths[index], 'package-lock.json')) !== this.dependencyLock)) throw new Error('Dependency declarations changed; rerun with isolated dependency preparation.');
      this.results[index] = { worker: worker.id, title: task.title, report: scrub(report), files, status: 'completed' };
      this.note(`Completed source changes in ${files.length} file(s).`, worker.id);
    })());
    try { await Promise.all(work); } catch (error) { await this.interruptWorkers(); this.emit('stop'); await Promise.allSettled(work); throw error; }
    this.assertActive();
    if (await this.git(['for-each-ref', '--format=%(refname) %(objectname)']) !== refsBefore) throw new Error('Git refs changed during worker execution; review the preserved worktrees.');
    if (await this.git(['status', '--porcelain=v1', '--untracked-files=all'], this.path)) throw new Error('A worker changed the integration worktree; review it before combining.');
    if (await this.git(['rev-parse', 'HEAD']) !== this.sourceHead) throw new Error('The source checkout changed during the job. No integration was applied to it.');
    const hooksPath = path.join(this.stateRoot, this.id, 'empty-hooks'); await fs.mkdir(hooksPath);
    for (let index = 0; index < this.results.length; index++) {
      const result = this.results[index];
      await this.git(['add', '--', ...result.files], paths[index]);
      await this.git(['diff', '--cached', '--check'], paths[index]);
      await this.git(['-c', 'user.name=BMH Team', '-c', 'user.email=bmh-team@localhost', '-c', `core.hooksPath=${hooksPath}`, 'commit', '-m', `BMH Team: ${result.title.replace(/[\r\n]/g, ' ')}`], paths[index]);
      result.commit = await this.git(['rev-parse', 'HEAD'], paths[index]);
    }
    this.phase('merging', 'Combining the two local commits into the isolated integration branch.');
    for (const result of this.results) {
      const cherry = await this.command(this.gitCommand, ['-c', 'user.name=BMH Team', '-c', 'user.email=bmh-team@localhost', '-c', `core.hooksPath=${hooksPath}`, 'cherry-pick', result.commit], this.path, { allowFailure: true, logName: `merge-${result.worker.replace(/[^a-z0-9_-]/gi, '_')}.log` });
      if (cherry.code !== 0) { await this.git(['cherry-pick', '--abort'], this.path, { allowFailure: true }); throw new Error('Integration conflict: separate worker branches are preserved for review.'); }
    }
    this.phase('checking', 'Running the plan’s bounded verification commands on the combined result.');
    const combinedText = await optionalRead(path.join(this.path, 'package.json'));
    const combinedPackage = combinedText ? JSON.parse(combinedText) : {};
    for (let index = 0; index < this.plan.checks.length; index++) {
      const check = this.plan.checks[index];
      if (check.program === 'npm' && combinedPackage.scripts?.[check.args[1]] !== scripts[check.args[1]]) throw new Error('A verification script changed during the job; review it before running.');
      if (check.program === 'node') for (const filename of check.args.slice(1)) await this.verifyLiteral(this.path, filename);
      this.note(`Check ${index + 1}/${this.plan.checks.length}: ${check.program} ${check.args.join(' ')}`);
      await this.command(check.program, check.args, this.path, { logName: `check-${index + 1}.log` });
    }
    this.assertActive();
    await this.git(['diff', '--check'], this.path);
    const changedAfterChecks = await this.git(['diff', '--name-only', '--no-renames', '-z', 'HEAD'], this.path);
    const untrackedAfterChecks = await this.git(['ls-files', '--others', '--exclude-standard', '-z'], this.path);
    const ignoredArtifacts = await this.git(['ls-files', '--others', '--ignored', '--exclude-standard', '-z', '--', 'dist', 'public'], this.path);
    const postCheckFiles = [...new Set((changedAfterChecks + '\0' + untrackedAfterChecks + '\0' + ignoredArtifacts).split('\0').filter(Boolean))];
    if (postCheckFiles.some(filename => !/^(?:dist|public)\/.+/.test(filename))) throw new Error('Verification changed source or produced files outside dist/public. Review the integration worktree before continuing.');
    this.artifacts = postCheckFiles;
    if (this.artifacts.length) this.note(`Preserved ${this.artifacts.length} generated dist/public artifact(s) for review; they are not committed.`);
    this.phase('ready', 'Both tasks and their checks passed. Review the local integration branch; nothing was pushed, merged into main or deployed.');
    return this.publicState;
  }
  async stop() {
    if (this.status === 'ready' || this.status === 'failed' || this.status === 'stopped') return this.publicState;
    this.aborted = true; this.error = null; this.phase('stopped', 'Stopped. Local branches and source changes are preserved for review.');
    this.emit('stop');
    for (const timer of this.timers) clearTimeout(timer);
    this.timers.clear();
    await this.interruptWorkers();
    await Promise.allSettled([...this.children].map(child => this.kill(child)));
    return this.publicState;
  }
}
