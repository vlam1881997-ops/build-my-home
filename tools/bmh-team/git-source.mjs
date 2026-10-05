import {promises as fs} from 'node:fs';
import path from 'node:path';

export const SOURCE_MODE_OPTIONS = [
  {id:'fetch',label:'Git tự lấy bản mới'},
  {id:'desktop',label:'GitHub Desktop — đã Fetch origin'}
];
export const DESKTOP_FETCH_MAX_AGE_MS = 15 * 60_000;

export function validateSourceMode(value = 'fetch') {
  if (value !== 'fetch' && value !== 'desktop') throw new Error('Chọn cách lấy mã nguồn: Git trực tiếp hoặc GitHub Desktop.');
  return value;
}

// Redact before bounding the diagnostic. Never return credential-helper
// contents, URL userinfo, GitHub tokens or authorization headers to the UI.
export function redactProcessText(value) {
  return String(value ?? '')
    .replace(/\x1b\[[0-9;]*[A-Za-z]/g,'')
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g,'')
    .replace(/\b(?:gh[pousr]_[A-Za-z0-9_]{8,}|github_pat_[A-Za-z0-9_]{8,})/g,'[redacted]')
    .replace(/AIza[\w-]{20,}/g,'[redacted]')
    .replace(/\bsk-[\w-]{12,}/g,'[redacted]')
    .replace(/((?:Bearer|Basic)\s+)[\w.+\/=-]{8,}/gi,'$1[redacted]')
    .replace(/((?:api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret|password|authorization|token)\s*[=:]\s*)[^\s,;]+/gi,'$1[redacted]')
    .replace(/https?:\/\/[^\s/@]+(?::[^\s/@]*)?@/gi,'https://[redacted]@');
}

export function gitFailureDiagnostic({operation='git',exitCode,output='',logPath=null}) {
  const details=redactProcessText(output).trim().slice(-3500);
  let cause='Xem chi tiết Git bên dưới để xác định nguyên nhân.';
  let help='Nếu dùng GitHub Desktop: mở đúng repo, bấm Fetch origin, rồi chọn “GitHub Desktop — đã Fetch origin” trong BMH Team và chạy lại.';
  if(/protected branch|branch protection|GH006|GH013|ruleset|non-fast-forward|fetch first|rejected.*refs\/heads\/main/i.test(details)) {
    cause='GitHub không chấp nhận cập nhật thẳng main (nhánh được bảo vệ hoặc main đã thay đổi). BMH Team không bỏ qua quy tắc và không force.';
    help='Giữ nguyên nhánh tích hợp để xem lại. Nếu repo bắt buộc Pull Request, dùng quy trình PR/auto-merge được GitHub cho phép; không tắt bảo vệ main chỉ để vượt lỗi.';
  } else if(/authentication failed|could not read (?:username|password)|terminal prompts disabled|repository[^\n]*(?:not found|does not exist)|invalid username|permission denied \(publickey\)|401|403/i.test(details)) {
    cause='Git chưa truy cập được repo riêng tư bằng phiên đăng nhập dòng lệnh.';
    help+=' Đăng nhập GitHub Desktop và hai thẻ ChatGPT là các phiên riêng. BMH Team cần Git Credential Manager/Git CLI của Windows đã đăng nhập đúng tài khoản có quyền ghi main; đăng nhập ChatGPT, GitHub connector hoặc Vercel không tự cấp credential cho git.exe.';
  } else if(/could not resolve|failed to connect|connection (?:timed out|reset)|unable to access|ssl certificate|certificate verify|schannel|proxy/i.test(details)) {
    cause='Git gặp lỗi mạng, proxy hoặc chứng chỉ khi kết nối GitHub.';
    help='Kiểm tra Fetch origin trong GitHub Desktop. Giữ kiểm tra chứng chỉ; không tắt SSL. Khi Fetch thành công, chọn chế độ GitHub Desktop để dùng bản vừa lấy.';
  } else if(/\.lock|another git process|cannot lock ref|unable to create[^\n]*lock/i.test(details)) {
    cause='Git đang bị khóa hoặc có một tiến trình Git khác đang dùng repo.';
    help='Chờ thao tác GitHub Desktop/Git hiện tại kết thúc rồi chạy lại. Giữ nguyên thay đổi; không xóa khóa hay reset repo tự động.';
  }
  const label=operation==='fetch'?'lấy origin/main':operation;
  return {operation,exitCode,summary:`Git thất bại khi ${label} (exit ${exitCode ?? 'unknown'}). ${cause}`,details,help,logPath};
}

function inside(parent,child) {
  const relative=path.relative(parent,child);
  return !relative || (!relative.startsWith('..'+path.sep) && relative!=='..' && !path.isAbsolute(relative));
}
const projectOrigin=/^(?:https:\/\/github\.com\/|(?:git@)?github\.com:|ssh:\/\/git@github\.com\/)(?:vlam1881997-ops\/build-my-home)(?:\.git)?\/?$/i;

export async function desktopFetchEvidence({repo,commonDir,baseCommit,git,now=Date.now(),maxAgeMs=DESKTOP_FETCH_MAX_AGE_MS}) {
  const retry='Trong GitHub Desktop, chọn đúng build-my-home và bấm Fetch origin; chờ hoàn tất rồi chạy lại BMH Team.';
  if(!/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(baseCommit || '')) throw new Error('Không có origin/main hợp lệ. '+retry);
  const raw=await git(['rev-parse','--git-path','FETCH_HEAD']);
  let filename,stat,contents;
  try {
    filename=await fs.realpath(path.resolve(repo,raw));
    const metadata=await fs.realpath(commonDir);
    if(!inside(metadata,filename))throw new Error('FETCH_HEAD nằm ngoài Git metadata.');
    stat=await fs.stat(filename);
    if(!stat.isFile() || stat.size>1024*1024)throw new Error('FETCH_HEAD không hợp lệ.');
    if(!Number.isFinite(stat.mtimeMs) || now-stat.mtimeMs>maxAgeMs || stat.mtimeMs-now>1000)throw new Error('FETCH_HEAD chưa mới.');
    contents=await fs.readFile(filename,'utf8');
    const after=await fs.stat(filename);
    if(stat.mtimeMs!==after.mtimeMs || stat.size!==after.size)throw new Error('FETCH_HEAD đang thay đổi.');
  } catch {
    throw new Error('Chưa xác nhận được lần Fetch origin trong 15 phút gần đây. '+retry);
  }
  const match=contents.split(/\r?\n/).some(line=>{
    const parsed=line.match(/^([a-f0-9]{40}|[a-f0-9]{64})\t(?:not-for-merge)?\tbranch 'main' of (.+)$/i);
    return parsed && parsed[1].toLowerCase()===baseCommit.toLowerCase() && projectOrigin.test(parsed[2]);
  });
  if(!match)throw new Error('Lần Fetch vừa ghi không khớp origin/main của dự án BMH. '+retry);
  if((await git(['rev-parse','--verify','refs/remotes/origin/main'])).trim()!==baseCommit)throw new Error('origin/main đang thay đổi. Chờ Fetch hoàn tất rồi chạy lại.');
  return {mode:'desktop',baseCommit,fetchedAt:new Date(stat.mtimeMs).toISOString()};
}
