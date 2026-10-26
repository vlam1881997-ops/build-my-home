import test from 'node:test';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdtemp,mkdir,writeFile,rm,access} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {nativeRepairPackage,probeCodex} from '../runtime.mjs';

const exec = promisify(execFile);
const alias = '@openai/codex-win32-x64@npm:@openai/codex@0.160.0-win32-x64';
const metadata = {name:'@openai/codex',version:'0.160.0',optionalDependencies:{'@openai/codex-win32-x64':'npm:@openai/codex@0.160.0-win32-x64','@openai/codex-win32-arm64':'npm:@openai/codex@0.160.0-win32-arm64'}};

async function fixture(t, source, {manifest = metadata, shim = 'codex.cmd'} = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'BMH Đội hai tài khoản '));
  const packageRoot = path.join(root,'node_modules','@openai','codex');
  await mkdir(path.join(packageRoot,'bin'), {recursive:true});
  await writeFile(path.join(packageRoot,'package.json'), JSON.stringify(manifest));
  await writeFile(path.join(packageRoot,'bin','codex.js'), source);
  const executable = path.join(root,shim);
  // This shim must never be executed. Only its adjacent official JS entrypoint
  // should run, including on systems that cannot launch Windows cmd files.
  await writeFile(executable, 'echo SHIM_WAS_EXECUTED\r\nexit /b 88\r\n');
  t.after(() => rm(root,{recursive:true,force:true}));
  return {root,executable};
}

test('real child stdout version plus stderr warning is ready, paths with spaces and Vietnamese work', async t => {
  const f = await fixture(t, `console.error('Warning: harmless native stderr');console.log('codex-cli 0.160.0');`);
  const result = await probeCodex(f.executable);
  assert.equal(result.ok,true); assert.equal(result.version,'0.160.0'); assert.equal(result.exitCode,0);
  assert.match(result.stderr,/harmless native stderr/); assert.equal(result.command,process.execPath);
  assert.ok(result.args[0].includes('Đội hai tài khoản')); assert.equal(result.args.at(-1),'--version');
  assert.ok(!result.stdout.includes('SHIM_WAS_EXECUTED'));
});
test('stderr version is supported, but the same success text with exit 1 never becomes ready', async t => {
  const valid = await fixture(t, `console.error('codex-cli 0.160.0');`);
  assert.equal((await probeCodex(valid.executable)).ok,true);
  const invalid = await fixture(t, `console.log('codex-cli 0.160.0');process.exitCode=1;`);
  const result = await probeCodex(invalid.executable);
  assert.equal(result.ok,false); assert.equal(result.version,'0.160.0'); assert.equal(result.exitCode,1); assert.match(result.error,/mã 1/);
});
test('wrong, conflicting or absent CLI version fails rather than treating exit 0 alone as success', async t => {
  for (const source of [`console.log('codex-cli 0.157.0');`,`console.log('codex-cli 0.160.0');console.error('codex-cli 0.157.0');`,`console.log('complete');`]) {
    const f = await fixture(t,source); assert.equal((await probeCodex(f.executable)).ok,false);
  }
});
test('ps1 npm shim uses adjacent JS without invoking PowerShell', async t => {
  const f = await fixture(t,`console.log('codex-cli 0.160.0');`,{shim:'codex.ps1'});
  const result = await probeCodex(f.executable); assert.equal(result.ok,true); assert.equal(result.command,process.execPath);
});
test('missing native dependency reports only an exact validated official pinned repair spec', async t => {
  const f = await fixture(t,`console.error('Missing optional dependency @openai/codex-win32-x64. Reinstall Codex');process.exitCode=1;`);
  const result = await probeCodex(f.executable,{platform:'win32',arch:'x64'});
  assert.equal(result.ok,false); assert.equal(result.repairPackage,alias);
  const unsafe = await fixture(t,`console.error('Missing optional dependency @openai/codex-win32-x64. Reinstall Codex');process.exitCode=1;`,{manifest:{...metadata,optionalDependencies:{'@openai/codex-win32-x64':'npm:untrusted-package@0.160.0'}}});
  assert.equal((await probeCodex(unsafe.executable,{platform:'win32',arch:'x64'})).repairPackage,null);
});
test('repair metadata never permits URLs, ranges, shell syntax, different official version or package name', () => {
  const options = {platform:'win32',arch:'x64'};
  assert.equal(nativeRepairPackage(metadata,options),alias);
  assert.equal(nativeRepairPackage(metadata,{platform:'win32',arch:'arm64'}),'@openai/codex-win32-arm64@npm:@openai/codex@0.160.0-win32-arm64');
  assert.equal(nativeRepairPackage({...metadata,optionalDependencies:{'@openai/codex-win32-x64':'0.160.0'}},options),'@openai/codex-win32-x64@0.160.0');
  for (const spec of ['https://example.test/pkg.tgz','^0.160.0','latest','npm:@openai/codex@0.159.0-win32-x64','npm:@openai/codex@0.160.0-win32-arm64','npm:@openai/codex@0.160.0-win32-x64;echo secret']) {
    assert.equal(nativeRepairPackage({...metadata,optionalDependencies:{'@openai/codex-win32-x64':spec}},options),null);
  }
  assert.equal(nativeRepairPackage({...metadata,name:'other'},options),null);
  assert.equal(nativeRepairPackage({...metadata,version:'0.159.0'},options),null);
  assert.equal(nativeRepairPackage(metadata,{...options,expectedVersion:'0.159.0'}),null);
  assert.equal(nativeRepairPackage(metadata,{platform:'linux',arch:'x64'}),null);
  assert.equal(nativeRepairPackage(metadata,{platform:'win32',arch:'ia32'}),null);
});
test('probe timeout terminates a real hung version child and never reports ready', async t => {
  const f = await fixture(t,`setInterval(()=>{},1000);`);
  const start = Date.now(), result = await probeCodex(f.executable,{timeoutMs:100});
  assert.equal(result.ok,false); assert.match(result.error,/thời gian chờ/); assert.ok(Date.now()-start<3500);
});
test('missing executable or JS entrypoint produces an actionable bounded failure', async t => {
  const f = await fixture(t,`console.log('codex-cli 0.160.0');`);
  await rm(path.join(f.root,'node_modules','@openai','codex','bin','codex.js'));
  const missingScript = await probeCodex(f.executable); assert.equal(missingScript.ok,false); assert.match(missingScript.error,/Không đọc/);
  const missingBinary = await probeCodex(path.join(f.root,'missing.exe')); assert.equal(missingBinary.ok,false); assert.match(missingBinary.error,/Không đọc/);
});
test('Windows 32-bit Node gets an explicit 64-bit install message before a process starts', async () => {
  const result = await probeCodex('not-run.exe',{platform:'win32',arch:'ia32'});
  assert.equal(result.ok,false); assert.equal(result.nodeArch,'ia32'); assert.equal(result.command,null); assert.match(result.error,/Node.js 64-bit/);
});
test('probe isolates CODEX_HOME, strips provider secrets and cleans the temporary home', async t => {
  const previous = process.env.OPENAI_API_KEY; process.env.OPENAI_API_KEY='fixture-billing-key';
  t.after(() => {if(previous === undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=previous;});
  const f = await fixture(t,`console.log('codex-cli 0.160.0');console.log(JSON.stringify({home:process.env.CODEX_HOME,billing:process.env.OPENAI_API_KEY || null}));`);
  const result = await probeCodex(f.executable); assert.equal(result.ok,true);
  const environment = JSON.parse(result.stdout.trim().split('\n').at(-1));
  assert.equal(environment.billing,null); assert.ok(environment.home.includes('bmh-team-probe-'));
  await assert.rejects(access(environment.home));
});
test('runtime CLI emits exactly JSON on stdout and captures/scrubs child stderr instead of exposing it to PowerShell', async t => {
  const f = await fixture(t,`console.error('Warning: harmless warning');console.error('access_token=fixture-private-value authorization=Bearer fixture-bearer');console.log('codex-cli 0.160.0');`);
  const runtime = fileURLToPath(new URL('../runtime.mjs',import.meta.url));
  const output = await exec(process.execPath,[runtime,'--probe',f.executable]);
  assert.equal(output.stderr,''); const result = JSON.parse(output.stdout); assert.equal(result.ok,true);
  assert.match(result.stderr,/harmless warning/); assert.ok(!output.stdout.includes('fixture-private-value')); assert.ok(!output.stdout.includes('fixture-bearer'));
  const usage = await exec(process.execPath,[runtime]); assert.equal(usage.stderr,''); assert.equal(JSON.parse(usage.stdout).ok,false);
});
