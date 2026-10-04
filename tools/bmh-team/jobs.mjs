import { EventEmitter } from 'node:events';
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { randomBytes, createHash } from 'node:crypto';
import {DEFAULT_MODEL_SETTINGS,validateModelSettings} from './models.mjs';
import {validateSourceMode,desktopFetchEvidence,redactProcessText,gitFailureDiagnostic} from './git-source.mjs';
import {workerTimeLimits} from './limits.mjs';
import {jobId,worktreeId} from './job-reports.mjs';

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
  return redactProcessText(value).slice(0, 6000);
}
function inside(parent, child) { const relative = path.relative(parent, child); return !relative || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative)); }
async function canonicalPath(filename) {
  let current = path.resolve(filename); const missing = [];
  while (true) {
    try { return path.join(await fs.realpath(current), ...missing.reverse()); }
    catch (error) { if (error.code !== 'ENOENT') throw error; const parent = path.dirname(current); if (parent === current) throw error; missing.push(path.basename(current)); current = parent; }
  }
}
function samePath(left, right) { return process.platform === 'win32' ? left.toLowerCase() === right.toLowerCase() : left === right; }
function safeFile(value) {
  if (typeof value !== 'string' || !value || value.trim() !== value || value.length > 240 || value.includes('\\') || /[\x00-\x1f]/.test(value) || path.posix.isAbsolute(value) || /^[a-z]:/i.test(value)) throw new Error('Plan contains an invalid relative file path.');
  const parts = value.split('/');
  if (parts.some(p => !p || p === '.' || p === '..' || /[*?\[\]{}]/.test(p))) throw new Error('Plan paths must be exact relative filenames without traversal or globs.');
  if (parts.some(p => /[:<>"|]/.test(p) || /[ .]$/.test(p) || /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(p))) throw new Error('Plan contains a filename unsafe on Windows.');
  if (parts.some(p => /^(?:\.git|\.ssh|\.codex|\.bmh-team|\.npmrc|\.netrc|\.pypirc|node_modules|dist|public)$/i.test(p) || /^\.env(?:\.|$)/i.test(p) || /(?:^|[._-])(?:auth|secrets?|credentials?|tokens?)(?:[._-]|$)/i.test(p) || /\.(?:pem|key|p12|pfx)$/i.test(p))) throw new Error('Plan includes a protected, credential or generated path.');
  return value;
}
function parseJson(text) {
  let raw = String(text).trim();
  if (raw.startsWith('```')) raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(raw); } catch { throw new Error('Account 1 did not return a valid JSON plan.'); }
}
async function optionalRead(filename) { try { return await fs.readFile(filename, 'utf8'); } catch (e) { if (e.code === 'ENOENT') return null; throw e; } }

/** Local-only job. Desktop mode requires matching recent FETCH_HEAD evidence.
 * fetch:false remains exclusively for offline fixture tests. */
export class TeamJob extends EventEmitter {
  constructor({ workers, repo, goal, gitCommand = 'git', stateRoot = path.join(os.homedir(), '.bmh-team', 'jobs'), onEvent, fetch = true, sourceMode = 'fetch', workerTimeoutMs, workerIdleTimeoutMs, commandTimeoutMs = 5 * 60_000, modelSettings, resumeSnapshot }) {
    super();
    if (!Array.isArray(workers) || workers.length !== 2 || workers.some(w => !w?.id || typeof w.run !== 'function' || typeof w.interrupt !== 'function') || workers[0].id === workers[1].id) throw new Error('Exactly two distinct workers are required.');
    this.resumeSnapshot=resumeSnapshot?structuredClone(resumeSnapshot):null;
    if(this.resumeSnapshot && (!['failed','stopped'].includes(this.resumeSnapshot.status) || !this.resumeSnapshot.workspaceReady || !this.resumeSnapshot.plan || !/^[a-f0-9]{40}$/i.test(this.resumeSnapshot.source?.baseCommit || '')))throw Error('Công việc đã lưu chưa có kế hoạch và thư mục để tiếp tục.');
    this.workers = workers; this.repo = path.resolve(repo); this.goal = String(this.resumeSnapshot?.goal || goal || '').trim();
    this.modelSettings=Object.fromEntries(workers.map(worker=>[worker.id,Object.freeze(validateModelSettings(modelSettings?.[worker.id] || DEFAULT_MODEL_SETTINGS))]));
    Object.freeze(this.modelSettings);
    if (!this.goal || this.goal.length > 20_000) throw new Error('Provide a goal of 1–20,000 characters.');
    this.gitCommand = gitCommand; this.stateRoot = path.resolve(stateRoot);
    if (inside(this.repo, this.stateRoot)) throw new Error('Worktrees must be stored outside the source repository.');
    this.onEvent = onEvent; this.fetch = fetch; this.sourceMode=validateSourceMode(sourceMode); this.workerTimeoutMs = workerTimeoutMs; this.workerIdleTimeoutMs=workerIdleTimeoutMs; this.commandTimeoutMs = commandTimeoutMs;
    this.id = `${Date.now()}-${randomBytes(4).toString('hex')}`;
    this.worktreeId=this.resumeSnapshot?worktreeId(this.resumeSnapshot):this.id;
    this.resumedFrom=this.resumeSnapshot?jobId(this.resumeSnapshot.id):null;
    this.status = 'preparing'; this.plan = null; this.results = []; this.artifacts = []; this.branch = `bmh-team/${this.worktreeId}/integration`;
    this.path = path.join(this.stateRoot, this.worktreeId, 'integration'); this.error = null; this.events = [];
    this.diagnostic=null; this.source=null; this.workspaceReady=false;
    this.checkpoint=null; this.timing=null;
    this.children = new Set(); this.timers = new Set(); this.aborted = false; this.failing = false; this.started = false; this.activePromise = null;
  }
  get publicState() { return structuredClone({ id: this.id, repo:this.repo, worktreeId:this.worktreeId, resumedFrom:this.resumedFrom, status: this.status, goal: this.goal, modelSettings:this.modelSettings, sourceMode:this.sourceMode, source:this.source, workspaceReady:this.workspaceReady, diagnostic:this.diagnostic, plan: this.plan, results: this.results, artifacts: this.artifacts, branch: this.branch, path: this.path, error: this.error, events: this.events, checkpoint:this.checkpoint, timing:this.timing }); }
  note(message, worker) {
    this.events.push({ at: new Date().toISOString(), ...(worker ? { worker } : {}), message: scrub(message) });
    if (this.events.length > 200) this.events.shift();
    const state = this.publicState; this.emit('state', state);
    try { Promise.resolve(this.onEvent?.(state)).catch(()=>{}); } catch { /* An observer cannot alter the job outcome. */ }
  }
  phase(status, message) { if (this.aborted && status !== 'stopped') return; this.status = status; if(this.checkpoint)this.checkpoint.phase=status; this.note(message); }
  assertActive() { if (this.aborted) throw new Error('Job stopped.'); if (this.failing) throw new Error('Job is cancelling after a task failure.'); }
  async kill(child) {
    if (child.exitCode !== null || child.signalCode !== null || !child.pid) return;
    if (process.platform === 'win32') {
      await new Promise(resolve => {
        const executable = path.join(process.env.SystemRoot || 'C:\\Windows', 'System32', 'taskkill.exe');
        const killer = spawn(executable, ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true, stdio: 'ignore' });
        const timer = setTimeout(() => { try { killer.kill(); child.kill(); } catch {} resolve(); }, 2000);
        const done = () => { clearTimeout(timer); if (child.exitCode === null && child.signalCode === null) { try { child.kill(); } catch {} } resolve(); };
        killer.once('error', done); killer.once('close', done);
      });
    } else {
      try { process.kill(-child.pid, 'SIGTERM'); } catch { try { child.kill('SIGTERM'); } catch {} }
      await new Promise(resolve => { const timer = setTimeout(resolve, 100); child.once('close', () => { clearTimeout(timer); resolve(); }); });
      try { process.kill(-child.pid, 'SIGKILL'); } catch { try { child.kill('SIGKILL'); } catch {} }
    }
    if (this.children.has(child)) await new Promise(resolve => { const timer = setTimeout(resolve, 2000); child.once('close', () => { clearTimeout(timer); resolve(); }); });
  }
  async command(program, args, cwd, { timeoutMs = this.commandTimeoutMs, logName, allowFailure = false, gitOperation } = {}) {
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
      const env = { ...process.env }; delete env.NODE_TEST_CONTEXT; delete env.NODE_OPTIONS; delete env.CODEX_HOME;
      for (const key of ['GIT_DIR', 'GIT_WORK_TREE', 'GIT_COMMON_DIR', 'GIT_INDEX_FILE', 'GIT_OBJECT_DIRECTORY', 'GIT_ALTERNATE_OBJECT_DIRECTORIES', 'GIT_CONFIG_COUNT']) delete env[key];
      for (const key of Object.keys(env)) if (/(?:API[_-]?KEY|ACCESS[_-]?TOKEN|AUTH[_-]?TOKEN|PASSWORD|SECRET|(?:^|_)TOKEN$)/i.test(key) || /^(?:OPENAI|ANTHROPIC|GEMINI|VERCEL|GOOGLE_APPLICATION_CREDENTIALS)(?:_|$)/i.test(key)) delete env[key];
      if (gitOperation) { env.GIT_TERMINAL_PROMPT='0'; env.GCM_INTERACTIVE='never'; }
      const child = spawn(program, args, { cwd, env, shell: false, windowsHide: true, detached: process.platform !== 'win32', stdio: ['ignore', 'pipe', 'pipe'] });
      this.children.add(child); let output = ''; let stdout=''; let stderr=''; let exceeded = false; let timedOut = false; let spawnError;
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
      const capture = stream => bytes => { output += bytes; if(stream==='stdout')stdout+=bytes;else stderr+=bytes; if (output.length > 2_000_000) { exceeded = true; output = output.slice(-200_000); stdout=stdout.slice(-100_000); stderr=stderr.slice(-100_000); void this.kill(child); } };
      child.stdout.on('data', capture('stdout')); child.stderr.on('data', capture('stderr'));
      const timer = setTimeout(() => { timedOut = true; void this.kill(child); }, timeoutMs); this.timers.add(timer);
      child.once('error', error => { spawnError = error; });
      child.once('close', async code => {
        clearTimeout(timer); this.timers.delete(timer); this.children.delete(child);
        try {
          const logPath=logName?path.join(this.stateRoot, this.id, logName):null;
          if (logPath) await fs.writeFile(logPath, redactProcessText(output).slice(-100_000), {encoding:'utf8',mode:0o600});
          this.assertActive();
          if (timedOut) throw new Error(`Command timed out: ${path.basename(program)}. See local job logs.`);
          if (exceeded) throw new Error('Command output exceeded the safety limit.');
          if (spawnError) throw new Error(`Cannot start ${path.basename(program)}: ${spawnError.code || 'error'}.`);
          if (code !== 0 && !allowFailure) {
            if(gitOperation) {
              const diagnostic=gitFailureDiagnostic({operation:gitOperation,exitCode:code,output:stderr || stdout,logPath});
              const failure=new Error(diagnostic.summary); failure.gitDiagnostic=diagnostic; throw failure;
            }
            throw new Error(`${path.basename(program)} command failed (exit ${code}). See local job logs.`);
          }
          resolve({ output, stdout, stderr, code });
        } catch (error) { reject(error); }
      });
    });
  }
  async git(args, cwd = this.repo, options) { return (await this.command(this.gitCommand, process.platform === 'win32' ? ['-c', 'core.longpaths=true', ...args] : args, cwd, {...options,gitOperation:args[0]})).stdout.trim(); }
  async runWorker(worker, prompt, options) {
    this.assertActive(); let timer; let idleTimer; let onStop;
    const selected=this.modelSettings[worker.id];
    const limits=workerTimeLimits({...selected,readOnly:Boolean(options.readOnly),timeoutMs:this.workerTimeoutMs,idleTimeoutMs:this.workerIdleTimeoutMs});
    const budget={maxMinutes:limits.timeoutMs/60_000,idleMinutes:limits.idleTimeoutMs/60_000,lastActivityAt:new Date().toISOString(),status:'working'};
    this.timing ||= {workers:{}};this.timing.workers[worker.id]=budget;
    Object.assign(this.timing,{maxMinutes:Math.max(...Object.values(this.timing.workers).filter(v=>v.status==='working').map(v=>v.maxMinutes)),idleMinutes:Math.max(...Object.values(this.timing.workers).filter(v=>v.status==='working').map(v=>v.idleMinutes)),lastActivityAt:budget.lastActivityAt});
    let rejectTimeout;
    const timeout=new Promise((_,reject)=>{rejectTimeout=reject;});
    const expire=kind=>{
      void Promise.resolve().then(()=>worker.interrupt()).catch(()=>{});
      const error=new Error(`Account ${worker.id} timed out: ${kind==='idle'?'không có hoạt động mới trong thời gian chờ':'đã đạt thời gian tối đa của lượt làm'}. Các file đã làm được giữ lại để tiếp tục.`);
      error.timeoutType=kind;rejectTimeout(error);
    };
    const resetIdle=()=>{clearTimeout(idleTimer);this.timers.delete(idleTimer);idleTimer=setTimeout(()=>expire('idle'),limits.idleTimeoutMs);this.timers.add(idleTimer);};
    const onActivity=event=>{
      if(!event || typeof event.type!=='string' || !event.type)return;
      budget.lastActivityAt=new Date().toISOString();this.timing.lastActivityAt=budget.lastActivityAt;resetIdle();
    };
    worker.on?.('activity',onActivity);
    timer=setTimeout(()=>expire('maximum'),limits.timeoutMs);this.timers.add(timer);resetIdle();
    const stopped = new Promise((_, reject) => { onStop = () => reject(new Error('Job stopped.')); this.once('stop', onStop); });
    this.note(`Giao bằng ${selected.model} · ${selected.reasoningEffort}`,worker.id);
    try { return await Promise.race([worker.run(prompt, { ...options, ...selected, ...limits }), timeout, stopped]); }
    finally { clearTimeout(timer);clearTimeout(idleTimer);this.timers.delete(timer);this.timers.delete(idleTimer);worker.removeListener?.('activity',onActivity);this.removeListener('stop',onStop);budget.status='finished'; }
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
    // BMH tests and previews consume generated bundles. Rebuild merged source
    // before selected checks so a stale tracked dist/app.js cannot pass them.
    if (typeof scripts.build === 'string') {
      const withoutBuild = checks.filter(check => !(check.program === 'npm' && check.args[0] === 'run' && check.args[1] === 'build'));
      checks.splice(0, checks.length, { program: 'npm', args: ['run', 'build'] }, ...withoutBuild);
    }
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
    // The core interrupt resolves after the real child has exited. A timer here
    // could mark a job terminal while Codex still writes into its saved files.
    await Promise.allSettled(this.workers.map(worker=>Promise.resolve().then(()=>worker.interrupt())));
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
    let existing;
    try {existing=await fs.lstat(source);}catch(error){if(error.code!=='ENOENT')throw error;}
    if(existing) {
      if(!this.resumeSnapshot || !(await fs.stat(source)).isDirectory())throw Error('Dependency folder already exists unexpectedly; existing files were preserved.');
      if(existing.isSymbolicLink()) {
        if(!reusable || !samePath(await canonicalPath(source),await canonicalPath(path.join(this.repo,'node_modules'))))throw Error('Saved dependencies link to a different folder or package version; existing files were preserved.');
        source=path.join(this.repo,'node_modules');
      }
      reusable=true;this.note('Tiếp tục dùng thư mục dependencies đã chuẩn bị cho kế hoạch cũ.');
    } else if (reusable) {
      source = path.join(this.repo, 'node_modules'); this.note('Using existing dependencies with the same package and lockfile.');
      try { await fs.symlink(path.resolve(source), path.join(this.path, 'node_modules'), process.platform === 'win32' ? 'junction' : 'dir'); }
      catch (error) {
        if (!['EPERM', 'EACCES', 'EINVAL', 'ENOTSUP', 'EXDEV'].includes(error.code)) throw error;
        reusable = false; source = path.join(this.path, 'node_modules'); this.note('The existing dependency folder cannot be linked here; preparing isolated dependencies instead.');
      }
    }
    if (!reusable) {
      this.note('Preparing isolated dependencies with npm ci; lifecycle scripts are disabled.');
      await this.command('npm', ['ci', '--ignore-scripts', '--no-audit', '--no-fund'], this.path, { logName: 'dependencies.log' });
    }
    for (const cwd of paths) {
      try {
        const target=path.join(cwd,'node_modules');let current;
        try {current=await fs.lstat(target);}catch(error){if(error.code!=='ENOENT')throw error;}
        if(current) {
          if(!this.resumeSnapshot || !current.isSymbolicLink() || !samePath(await canonicalPath(target),await canonicalPath(source)))throw Error('Saved worker dependencies point to a different folder.');
        } else await fs.symlink(path.resolve(source),target,process.platform === 'win32' ? 'junction' : 'dir');
      }
      catch (error) { throw new Error(`Cannot create a dependency ${process.platform === 'win32' ? 'junction' : 'link'} (${error.code || 'error'}). Choose a local writable disk for the job folder; existing files were preserved.`); }
    }
    this.dependencyLock = lock;
  }
  async validateWorkerChanges(index,paths,branches,base,ignoredBefore,{allowEmpty=false}={}) {
    const worker=this.workers[index];const task=this.plan.tasks[index];const cwd=paths[index];
    if(await this.git(['rev-parse','HEAD'],cwd)!==base || await this.git(['branch','--show-current'],cwd)!==branches[index])throw Error(`Account ${worker.id} changed Git history or branch. Existing files were preserved; review this branch before continuing.`);
    if(await this.git(['ls-files','--unmerged','-z'],cwd))throw Error('Saved worker has unresolved merge conflicts; existing files were preserved.');
    await this.git(['diff','--check'],cwd);await this.git(['diff','--cached','--check'],cwd);
    const tracked=await this.git(['diff','--name-only','--no-renames','-z',base],cwd);
    const untracked=await this.git(['ls-files','--others','--exclude-standard','-z'],cwd);
    if(await this.git(['ls-files','--others','--ignored','--exclude-standard','-z','--','.',':(exclude)node_modules'],cwd)!==ignoredBefore[index])throw Error(`Account ${worker.id} created protected or ignored files outside its source ownership.`);
    const files=[...new Set((tracked+'\0'+untracked).split('\0').filter(Boolean))].sort();const fileHashes={};
    if(!files.length && !allowEmpty)throw Error(`Account ${worker.id} made no source changes; the task is not complete.`);
    for(const filename of files) {
      safeFile(filename);if(!task.ownedPaths.includes(filename))throw Error(`Account ${worker.id} changed an unowned file: ${filename}.`);
      await this.verifyLiteral(cwd,filename,true);
      const contents=await optionalRead(path.join(cwd,filename));
      if(contents && /AIza[\w-]{25,}|\bsk-[\w-]{20,}|-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(contents))throw Error('Source changes appear to contain credentials; review the isolated worker files.');
      fileHashes[filename]=contents===null?'deleted':createHash('sha256').update(await fs.readFile(path.join(cwd,filename))).digest('hex');
    }
    if(this.dependencyLock && (await optionalRead(path.join(cwd,'package.json'))!==this.packageText || await optionalRead(path.join(cwd,'package-lock.json'))!==this.dependencyLock))throw Error('Dependency declarations changed; rerun with isolated dependency preparation.');
    return {files,fileHashes};
  }
  start() {
    if (this.aborted) return Promise.resolve(this.publicState);
    if (this.started) return this.activePromise;
    this.started = true;
    this.activePromise = this.execute().catch(async error => {
      this.failing = true; this.emit('stop');
      await Promise.allSettled([this.interruptWorkers(), ...[...this.children].map(child => this.kill(child))]);
      if (!this.aborted) { this.error = scrub(error.message); this.diagnostic=error.gitDiagnostic || null; this.phase('failed', this.error); }
      return this.publicState;
    });
    return this.activePromise;
  }
  async execute() {
    this.phase('preparing', this.resumeSnapshot?'Kiểm tra thư mục đã lưu để tiếp tục đúng công việc cũ.':'Checking BMH repository and preparing isolated branches.');
    this.repo = await canonicalPath(this.repo); this.stateRoot = await canonicalPath(this.stateRoot);
    if (inside(this.repo, this.stateRoot)) throw new Error('Worktrees must be stored outside the source repository, including junction/symlink paths.');
    this.path = path.join(this.stateRoot, this.worktreeId, 'integration');
    const root = await this.git(['rev-parse', '--show-toplevel']);
    if (!samePath(await canonicalPath(root), this.repo)) throw new Error('Select the repository root directory.');
    const commonDir = await canonicalPath(path.resolve(this.repo, await this.git(['rev-parse', '--git-common-dir'])));
    if (inside(commonDir, this.stateRoot)) throw new Error('Worktrees must be stored outside Git metadata.');
    await fs.mkdir(path.join(this.stateRoot, this.id), { recursive: true });
    const origin = await this.git(['remote', 'get-url', 'origin']);
    const accepted = /^(?:https:\/\/github\.com\/|git@github\.com:|ssh:\/\/git@github\.com\/)(vlam1881997-ops\/build-my-home)(?:\.git)?\/?$/i;
    if (!accepted.test(origin)) throw new Error(`Repository origin must be github.com/${ORIGIN}.`);
    if (await this.git(['status', '--porcelain=v1', '--untracked-files=all'])) throw new Error('Source checkout has uncommitted files. Keep them safe; commit or stash them before starting a team job.');
    this.sourceHead = await this.git(['rev-parse', 'HEAD']);
    let base;
    if(this.resumeSnapshot) {
      if(this.resumeSnapshot.repo && !samePath(await canonicalPath(this.resumeSnapshot.repo),this.repo))throw Error('Chọn đúng repo của công việc đã lưu. Các thư mục đang làm được giữ nguyên.');
      base=this.resumeSnapshot.source.baseCommit;
      this.source={...this.resumeSnapshot.source,mode:'resume',previousMode:this.resumeSnapshot.source.mode};
      this.note(`Tiếp tục từ bản nguồn ${base.slice(0,12)} và các file đã làm; không Fetch hoặc tạo lại thư mục.`);
    } else {
      if(this.sourceMode==='fetch' && this.fetch) {this.note('Fetching the latest origin/main; the source checkout is not reset.');await this.git(['fetch','--no-tags','origin','main'],this.repo,{logName:'fetch.log'});}
      base=await this.git(['rev-parse','--verify','refs/remotes/origin/main']);
      if(this.sourceMode==='desktop') {
        this.source=await desktopFetchEvidence({repo:this.repo,commonDir,baseCommit:base,git:args=>this.git(args)});
        this.note(`Dùng origin/main ${base.slice(0,12)} vừa Fetch qua GitHub Desktop lúc ${this.source.fetchedAt}.`);
      } else this.source={mode:this.fetch?'fetch':'fixture',baseCommit:base,fetchedAt:this.fetch?new Date().toISOString():null};
      await this.git(['worktree', 'add', '-b', this.branch, this.path, base]);
    }
    const paths=this.workers.map((_,index)=>path.join(this.stateRoot,this.worktreeId,`account-${index+1}`));
    const branches=this.workers.map((_,index)=>`bmh-team/${this.worktreeId}/account-${index+1}`);
    if(this.resumeSnapshot) {
      for(const [index,cwd] of [this.path,...paths].entries()) {
        const stat=await fs.lstat(cwd);
        if(!stat.isDirectory() || stat.isSymbolicLink() || !samePath(await canonicalPath(cwd),cwd))throw Error('Saved worktree path changed; existing files were preserved.');
        const actualRoot=await this.git(['rev-parse','--show-toplevel'],cwd);
        const actualCommon=await canonicalPath(path.resolve(cwd,await this.git(['rev-parse','--git-common-dir'],cwd)));
        if(!samePath(await canonicalPath(actualRoot),cwd) || !samePath(actualCommon,commonDir))throw Error('Saved worktrees belong to a different repository; existing files were preserved.');
        if(await this.git(['rev-parse','HEAD'],cwd)!==base || await this.git(['branch','--show-current'],cwd)!==(index===0?this.branch:branches[index-1]))throw Error('Saved branches have already changed history or started integration. Existing files were preserved for branch review.');
      }
      if(await this.git(['status','--porcelain=v1','--untracked-files=all'],this.path) || await this.git(['ls-files','--others','--ignored','--exclude-standard','-z','--','.',':(exclude)node_modules'],this.path))throw Error('Saved integration workspace has unexpected edits; existing files were preserved for review.');
    }
    this.workspaceReady=true;
    this.packageText = await optionalRead(path.join(this.path, 'package.json'));
    try { this.packageJson = this.packageText ? JSON.parse(this.packageText) : null; } catch { throw new Error('Repository package.json is invalid.'); }
    const scripts = this.packageJson?.scripts || {};
    if(this.resumeSnapshot)this.plan=this.validatePlan(this.resumeSnapshot.plan,scripts);
    else {
      this.phase('planning', 'Account 1 is splitting the goal into two tasks with separate file ownership.');
      const prompt = `Plan this BMH development goal for exactly two accounts:\n${this.goal}\n\n${INVARIANTS}\nReturn JSON matching the provided schema. No edits. Each task must own exact literal relative file paths, never directories or globs. Account tasks may not share files. Do not include .git, secrets, auth, node_modules, dist or public paths. Use applicable npm build/check/test scripts or selected node --test files, never shell strings. Declared package scripts: ${JSON.stringify(scripts)}. Keep checks relevant and bounded; do not repeat every historical UI test.`;
      this.plan = this.validatePlan(parseJson(await this.runWorker(this.workers[0], prompt, { cwd: this.path, readOnly: true, outputSchema: SCHEMA })), scripts);
      this.assertActive();
      if (await this.git(['rev-parse', 'HEAD'], this.path) !== base || await this.git(['status', '--porcelain=v1', '--untracked-files=all'], this.path)) throw new Error('Planning changed the read-only worktree.');
      for (let index = 0; index < 2; index++) {
        await this.git(['worktree', 'add', '-b', branches[index], paths[index], base]);
        for (const filename of this.plan.tasks[index].ownedPaths) await this.verifyLiteral(paths[index], filename, true);
      }
    }
    const ignoredBefore = [];
    if(this.resumeSnapshot) {
      const saved=this.resumeSnapshot.checkpoint?.ignoredBefore;
      if(saved!==undefined && (!Array.isArray(saved) || saved.length!==2 || saved.some(value=>typeof value!=='string' || value.length>200_000)))throw Error('Saved ownership checkpoint is invalid; existing files were preserved.');
      ignoredBefore.push(...(saved || ['','']));
      if(this.packageJson && (Object.keys(this.packageJson.dependencies || {}).length || Object.keys(this.packageJson.devDependencies || {}).length))this.dependencyLock=await optionalRead(path.join(this.path,'package-lock.json'));
      // Check existing diffs before dependencies or any new model execution.
      for(let index=0;index<2;index++) {
        for(const filename of this.plan.tasks[index].ownedPaths)await this.verifyLiteral(paths[index],filename,true);
        await this.validateWorkerChanges(index,paths,branches,base,ignoredBefore,{allowEmpty:true});
      }
    } else for(const cwd of paths)ignoredBefore.push(await this.git(['ls-files','--others','--ignored','--exclude-standard','-z','--','.',':(exclude)node_modules'],cwd));
    await this.prepareDependencies(paths);
    const refsBefore=await this.git(['for-each-ref','--format=%(refname) %(objectname)']);
    this.checkpoint={baseCommit:base,ignoredBefore,phase:'working'};
    this.phase('working', this.resumeSnapshot?'Hai tài khoản tiếp tục kế hoạch cũ trên đúng file đang làm.':'Both accounts are working simultaneously in separate worktrees.');
    const work = this.workers.map((worker, index) => (async () => {
      const task = this.plan.tasks[index]; this.note(`Started: ${task.title}`, worker.id);
      const saved=this.resumeSnapshot?.results?.[index];
      if(saved?.status==='completed' && saved.worker===worker.id && saved.fileHashes && !saved.commit) {
        const current=await this.validateWorkerChanges(index,paths,branches,base,ignoredBefore);
        if(JSON.stringify(current.files)===JSON.stringify([...(saved.files || [])].sort()) && current.files.every(filename=>current.fileHashes[filename]===saved.fileHashes[filename])) {
          this.results[index]={...saved,...current};this.note(`Giữ lại phần đã hoàn thành, nội dung ${current.files.length} file khớp bản đã lưu.`,worker.id);return;
        }
      }
      const resumeInstructions=this.resumeSnapshot?'\nThis is a continuation after interruption. Read your current Git diff and existing files first. Preserve valid completed edits, finish only missing work, and do not recreate the project or redo completed work. The saved plan and file ownership below remain authoritative.\n':'';
      const report = await this.runWorker(worker, `Original goal:\n${this.goal}\n${resumeInstructions}\nYour task: ${task.title}\n${task.instructions}\n\nYou may edit ONLY these exact files: ${JSON.stringify(task.ownedPaths)}. The other account owns different files. ${INVARIANTS}\nDo not change package/lock declarations when dependencies are shared. Do not run builds or tests that write dist/public in your worker worktree; the coordinator will run the planned verification after integration. Finish with a short report of actual changes and checks.`, { cwd: paths[index], readOnly: false });
      this.assertActive();
      const {files,fileHashes}=await this.validateWorkerChanges(index,paths,branches,base,ignoredBefore);
      this.results[index] = { worker: worker.id, title: task.title, report: scrub(report), files, fileHashes, status: 'completed' };
      this.note(`Completed source changes in ${files.length} file(s).`, worker.id);
    })());
    try { await Promise.all(work); } catch (error) {
      this.failing = true; this.emit('stop');
      await Promise.allSettled([this.interruptWorkers(), ...[...this.children].map(child => this.kill(child)), ...work]);
      throw error;
    }
    this.assertActive();
    if (await this.git(['for-each-ref', '--format=%(refname) %(objectname)']) !== refsBefore) throw new Error('Git refs changed during worker execution; review the preserved worktrees.');
    if (await this.git(['status', '--porcelain=v1', '--untracked-files=all'], this.path)) throw new Error('A worker changed the integration worktree; review it before combining.');
    if (await this.git(['rev-parse', 'HEAD']) !== this.sourceHead) throw new Error('The source checkout changed during the job. No integration was applied to it.');
    this.checkpoint.integrationStarted=true;this.note('Đã kiểm tra phạm vi file; chuẩn bị các commit cục bộ để gộp.');
    const hooksPath = path.join(this.stateRoot, this.id, 'empty-hooks'); await fs.mkdir(hooksPath,{recursive:true});
    for (let index = 0; index < this.results.length; index++) {
      const result = this.results[index];
      await this.git(['add', '--', ...result.files], paths[index]);
      await this.git(['diff', '--cached', '--check'], paths[index]);
      await this.git(['-c', 'user.name=BMH Team', '-c', 'user.email=bmh-team@localhost', '-c', 'commit.gpgsign=false', '-c', `core.hooksPath=${hooksPath}`, 'commit', '-m', `BMH Team: ${result.title.replace(/[\r\n]/g, ' ')}`], paths[index]);
      result.commit = await this.git(['rev-parse', 'HEAD'], paths[index]);
    }
    this.phase('merging', 'Combining the two local commits into the isolated integration branch.');
    for (const result of this.results) {
      const cherry = await this.command(this.gitCommand, ['-c', 'core.longpaths=true', '-c', 'user.name=BMH Team', '-c', 'user.email=bmh-team@localhost', '-c', 'commit.gpgsign=false', '-c', `core.hooksPath=${hooksPath}`, 'cherry-pick', result.commit], this.path, { allowFailure: true, logName: `merge-${result.worker.replace(/[^a-z0-9_-]/gi, '_')}.log` });
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
    await this.git(['diff', '--check', '--', '.', ':(exclude)dist', ':(exclude)public'], this.path);
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
    await Promise.allSettled([this.interruptWorkers(), ...[...this.children].map(child => this.kill(child))]);
    if(this.activePromise)await this.activePromise;
    return this.publicState;
  }
}
