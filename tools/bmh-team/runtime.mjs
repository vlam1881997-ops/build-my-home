import {spawn} from 'node:child_process';
import {access, mkdtemp, readFile, rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {isolatedEnvironment, killTree, scrub} from './core.mjs';

const PINNED_VERSION = '0.160.0';
const diagnostic = value => scrub(value).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');

// Only specs for the official package/version shipped with this release can
// become a repair command. A package.json value is never an arbitrary npm arg.
export function nativeRepairPackage(metadata, {expectedVersion = PINNED_VERSION, platform = process.platform, arch = process.arch} = {}) {
  if (platform !== 'win32' || !['x64', 'arm64'].includes(arch) || expectedVersion !== PINNED_VERSION) return null;
  if (metadata?.name !== '@openai/codex' || metadata?.version !== PINNED_VERSION) return null;
  const name = `@openai/codex-win32-${arch}`;
  const spec = metadata.optionalDependencies?.[name];
  const alias = `npm:@openai/codex@${PINNED_VERSION}-win32-${arch}`;
  if (spec === alias) return `${name}@${alias}`;
  if (spec === PINNED_VERSION) return `${name}@${PINNED_VERSION}`;
  return null;
}

function versionIn(value) {
  return value.match(/\bcodex(?:-cli)?\s+(\d+\.\d+\.\d+)(?:\b|$)/i)?.[1] || null;
}

export async function probeCodex(executable, {expectedVersion = PINNED_VERSION, timeoutMs = 15000, platform = process.platform, arch = process.arch} = {}) {
  const result = {ok:false, nodeArch:arch, platform, command:null, args:[], expectedVersion, version:null, exitCode:null, signal:null, stdout:'', stderr:'', error:null, repairPackage:null};
  if (!/^\d+\.\d+\.\d+$/.test(expectedVersion)) return {...result,error:'Phiên bản Codex yêu cầu không hợp lệ.'};
  if (platform === 'win32' && !['x64', 'arm64'].includes(arch)) return {...result,error:'Windows cần Node.js 64-bit (x64 hoặc arm64). Gỡ bản Node.js 32-bit và cài bản 64-bit từ nodejs.org rồi mở lại BMH Team.'};
  if (typeof executable !== 'string' || !executable.trim() || executable.length > 32768) return {...result,error:'Không nhận được đường dẫn Codex hợp lệ.'};

  let packageMetadata = null;
  let command = path.resolve(executable), args = ['--version'];
  let stateHome = null;
  try {
    await access(command);
    if (/\.(?:cmd|ps1)$/i.test(command)) {
      const packageRoot = path.join(path.dirname(command), 'node_modules', '@openai', 'codex');
      const script = path.join(packageRoot, 'bin', 'codex.js');
      await access(script);
      try {
        const metadataText = await readFile(path.join(packageRoot, 'package.json'), 'utf8');
        if (Buffer.byteLength(metadataText) <= 1024 * 1024) packageMetadata = JSON.parse(metadataText);
      } catch {}
      command = process.execPath;
      args = [script, '--version'];
    }
    result.command = diagnostic(command);
    result.args = args.map(diagnostic);
    stateHome = await mkdtemp(path.join(os.tmpdir(), 'bmh-team-probe-'));
    const timeout = Number.isFinite(Number(timeoutMs)) && Number(timeoutMs) > 0 ? Math.min(30000, Math.max(20, Number(timeoutMs))) : 15000;
    const outcome = await new Promise(resolve => {
      let child, stdout = '', stderr = '', settled = false, timedOut = false, outputExceeded = false, total = 0, timer, terminateTimer;
      const finish = value => {
        if (settled) return;
        settled = true;
        clearTimeout(timer); clearTimeout(terminateTimer);
        resolve({...value, stdout, stderr, timedOut, outputExceeded});
      };
      const stop = () => {
        killTree(child);
        terminateTimer = setTimeout(() => finish({code:null,signal:null}), 2500);
        terminateTimer.unref?.();
      };
      try {
        child = spawn(command, args, {env:isolatedEnvironment(stateHome), stdio:['ignore','pipe','pipe'], shell:false, windowsHide:true, detached:process.platform !== 'win32'});
      } catch (error) { finish({code:null,error:error.message}); return; }
      const collect = stream => chunk => {
        if (settled) return;
        total += Buffer.byteLength(chunk);
        if (stream === 'stdout') stdout = (stdout + chunk).slice(-32768); else stderr = (stderr + chunk).slice(-32768);
        if (total > 1024 * 1024 && !outputExceeded) { outputExceeded = true; stop(); }
      };
      child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
      child.stdout.on('data', collect('stdout')); child.stderr.on('data', collect('stderr'));
      child.once('error', error => finish({code:null,error:error.message}));
      child.once('close', (code, signal) => finish({code,signal}));
      timer = setTimeout(() => { timedOut = true; stop(); }, timeout);
      timer.unref?.();
    });
    result.stdout = diagnostic(outcome.stdout);
    result.stderr = diagnostic(outcome.stderr);
    result.exitCode = outcome.code;
    result.signal = outcome.signal || null;
    const stdoutVersion = versionIn(outcome.stdout), stderrVersion = versionIn(outcome.stderr);
    result.version = stdoutVersion || stderrVersion;
    const missingPackage = `@openai/codex-win32-${arch}`;
    if (platform === 'win32' && new RegExp(`Missing optional dependency ${missingPackage.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:\\b|$)`, 'i').test(outcome.stdout + '\n' + outcome.stderr)) {
      result.repairPackage = nativeRepairPackage(packageMetadata, {expectedVersion, platform, arch});
    }
    if (outcome.timedOut) result.error = 'Codex không trả về phiên bản trong thời gian chờ. Mở lại BMH Team và xem nhật ký khởi chạy.';
    else if (outcome.outputExceeded) result.error = 'Phản hồi kiểm tra phiên bản Codex vượt giới hạn.';
    else if (outcome.error) result.error = `Không khởi động được Codex: ${diagnostic(outcome.error)}`;
    else if (outcome.code !== 0) result.error = result.repairPackage ? 'Bản cài Codex thiếu gói thực thi Windows. Launcher có thể cài lại đúng gói native chính thức.' : `Codex thoát với mã ${outcome.code ?? outcome.signal ?? 'không xác định'} khi kiểm tra phiên bản.`;
    else if (stdoutVersion && stderrVersion && stdoutVersion !== stderrVersion) result.error = 'Codex trả về các phiên bản không nhất quán.';
    else if (result.version !== expectedVersion) result.error = result.version ? `BMH Team cần Codex ${expectedVersion}; bản hiện tại là ${result.version}.` : 'Codex chạy xong nhưng không trả về phiên bản hợp lệ.';
    else result.ok = true;
    return result;
  } catch (error) {
    result.command ||= diagnostic(command);
    result.args = args.map(diagnostic);
    result.error = `Không đọc hoặc khởi động được bản cài Codex: ${diagnostic(error.message)}`;
    return result;
  } finally {
    if (stateHome) await rm(stateHome, {recursive:true,force:true}).catch(() => {});
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const result = args.length === 2 && args[0] === '--probe' ? await probeCodex(args[1]) : {ok:false,nodeArch:process.arch,version:null,error:'Cách dùng: node runtime.mjs --probe <đường dẫn Codex>'};
  // Child stderr is data inside this JSON; it never escapes into PowerShell's
  // native-command stderr handling. Callers decide from ok, not warning text.
  process.stdout.write(JSON.stringify(result) + '\n');
}
