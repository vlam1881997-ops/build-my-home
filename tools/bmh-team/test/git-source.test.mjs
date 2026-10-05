import test from 'node:test';
import assert from 'node:assert/strict';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {desktopFetchEvidence,redactProcessText,gitFailureDiagnostic,validateSourceMode,DESKTOP_FETCH_MAX_AGE_MS} from '../git-source.mjs';

const sha='a'.repeat(40);
async function fixture(t,contents=`${sha}\t\tbranch 'main' of https://github.com/vlam1881997-ops/build-my-home\n`) {
  const repo=await fs.mkdtemp(path.join(os.tmpdir(),'bmh-fetch-proof-'));
  t.after(()=>fs.rm(repo,{recursive:true,force:true}));
  const commonDir=path.join(repo,'.git');await fs.mkdir(commonDir);
  const head=path.join(commonDir,'FETCH_HEAD');await fs.writeFile(head,contents);
  const git=async args=>args[0]==='rev-parse'&&args.includes('--git-path')?'.git/FETCH_HEAD':sha;
  return {repo,commonDir,head,git,baseCommit:sha};
}

test('only direct or explicit Desktop source modes are accepted',()=>{
  assert.equal(validateSourceMode(),'fetch');assert.equal(validateSourceMode('desktop'),'desktop');
  for(const value of ['offline',false,null,'','fetch;anything'])assert.throws(()=>validateSourceMode(value),/Chọn cách/);
});
test('matching recent FETCH_HEAD permits Desktop snapshot with source SHA and time',async t=>{
  const fix=await fixture(t,`${'b'.repeat(40)}\tnot-for-merge\tbranch 'feature' of https://github.com/vlam1881997-ops/build-my-home\n${sha}\tnot-for-merge\tbranch 'main' of https://github.com/vlam1881997-ops/build-my-home.git\n`);
  const result=await desktopFetchEvidence(fix);
  assert.equal(result.mode,'desktop');assert.equal(result.baseCommit,sha);assert.ok(Number.isFinite(Date.parse(result.fetchedAt)));
});
test('stale or future FETCH_HEAD blocks cached-source execution',async t=>{
  const fix=await fixture(t);const now=Date.now();
  for(const stamp of [now-DESKTOP_FETCH_MAX_AGE_MS-2000,now+60_000]) {
    await fs.utimes(fix.head,new Date(stamp),new Date(stamp));
    await assert.rejects(desktopFetchEvidence({...fix,now}),/15 phút/);
  }
});
test('wrong SHA, branch or repository evidence cannot authorize Desktop execution',async t=>{
  const fix=await fixture(t);
  for(const row of [
    `${'b'.repeat(40)}\t\tbranch 'main' of https://github.com/vlam1881997-ops/build-my-home`,
    `${sha}\t\tbranch 'other' of https://github.com/vlam1881997-ops/build-my-home`,
    `${sha}\t\tbranch 'main' of https://github.com/other/build-my-home`,
    `${sha}\t\tbranch 'main' of https://github.com.evil.test/vlam1881997-ops/build-my-home`
  ]) {
    await fs.writeFile(fix.head,row+'\n');await assert.rejects(desktopFetchEvidence(fix),/không khớp/);
  }
});
test('missing FETCH_HEAD and changing remote ref block execution',async t=>{
  const fix=await fixture(t);
  const changing=async args=>args.includes('--git-path')?'.git/FETCH_HEAD':'b'.repeat(40);
  await assert.rejects(desktopFetchEvidence({...fix,git:changing}),/đang thay đổi/);
  await fs.unlink(fix.head);await assert.rejects(desktopFetchEvidence(fix),/15 phút/);
});
test('FETCH_HEAD outside Git metadata cannot supply source evidence',async t=>{
  const fix=await fixture(t);await fs.writeFile(path.join(fix.repo,'outside'),await fs.readFile(fix.head));
  await assert.rejects(desktopFetchEvidence({...fix,git:async()=>path.join(fix.repo,'outside')}),/15 phút/);
});
test('Git diagnostics redact tokens, userinfo, headers and secrets before truncation',()=>{
  const secrets=['ghp_'+'a'.repeat(30),'github_pat_'+'b'.repeat(40),'username:password','c'.repeat(40),'d'.repeat(40),'e'.repeat(40)];
  const text=`fatal: ${secrets[0]} ${secrets[1]} https://${secrets[2]}@github.com/repo https://${secrets[0]}@github.com\nAuthorization: Bearer ${secrets[3]}\nBasic ${secrets[4]}\ntoken=${secrets[5]}`;
  const sanitized=redactProcessText(text);for(const secret of secrets)assert.ok(!sanitized.includes(secret));
  const diagnostic=gitFailureDiagnostic({operation:'fetch',exitCode:128,output:'x'.repeat(7000)+'\nfatal: could not read Username: terminal prompts disabled\n'+text,logPath:'/private/fetch.log'});
  assert.equal(diagnostic.exitCode,128);assert.equal(diagnostic.operation,'fetch');assert.match(diagnostic.summary,/repo riêng tư/);
  assert.match(diagnostic.details,/could not read Username/);assert.match(diagnostic.help,/GitHub Desktop/);assert.equal(diagnostic.logPath,'/private/fetch.log');
  assert.ok(diagnostic.details.length<=3500);for(const secret of secrets)assert.ok(!JSON.stringify(diagnostic).includes(secret));
});
test('network and lock diagnostics give actionable help without disabling protection',()=>{
  const network=gitFailureDiagnostic({operation:'fetch',exitCode:128,output:'fatal: SSL certificate problem'});
  assert.match(network.summary,/chứng chỉ/);assert.match(network.help,/không tắt SSL/);
  const locked=gitFailureDiagnostic({operation:'worktree',exitCode:128,output:'fatal: cannot lock ref: another git process'});
  assert.match(locked.summary,/bị khóa/);assert.match(locked.help,/không xóa khóa/);
  const protectedBranch=gitFailureDiagnostic({operation:'push',exitCode:1,output:'remote: error GH006: Protected branch update failed'});
  assert.match(protectedBranch.summary,/nhánh được bảo vệ/);assert.match(protectedBranch.help,/không tắt bảo vệ main/);
});
