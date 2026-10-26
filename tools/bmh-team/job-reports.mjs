import {promises as fs} from 'node:fs';
import path from 'node:path';
import {randomBytes} from 'node:crypto';
import {redactProcessText} from './git-source.mjs';

const ID=/^\d{10,16}-[a-f0-9]{8}$/;
const MAX_BYTES=2_000_000;
export function jobId(value) {
  if(typeof value!=='string' || !ID.test(value))throw Error('Mã công việc đã lưu không hợp lệ.');
  return value;
}
export function worktreeId(snapshot) {return jobId(snapshot.worktreeId || snapshot.id);}

// Reports contain development summaries, never Codex account files. Queue each
// immutable snapshot, then rename a complete file: progress cannot overwrite a
// newer terminal checkpoint or leave truncated JSON after a launcher restart.
export function createJobReportStore(stateRoot) {
  const root=path.join(path.resolve(stateRoot),'reports');
  let tail=Promise.resolve();
  const checkRoot=async create=>{
    if(create)await fs.mkdir(root,{recursive:true,mode:0o700});
    const stat=await fs.lstat(root);
    if(!stat.isDirectory() || stat.isSymbolicLink())throw Error('Thư mục báo cáo công việc không hợp lệ.');
  };
  const save=snapshot=>{
    const id=jobId(snapshot.id);
    const text=JSON.stringify({...structuredClone(snapshot),updatedAt:new Date().toISOString()},null,2);
    if(Buffer.byteLength(text)>MAX_BYTES)throw Error('Báo cáo công việc quá lớn để lưu.');
    const pending=tail.catch(()=>{}).then(async()=>{
      await checkRoot(true);
      const temp=path.join(root,`${id}.${randomBytes(6).toString('hex')}.tmp`);
      try {await fs.writeFile(temp,text,{mode:0o600,flag:'wx'});await fs.rename(temp,path.join(root,`${id}.json`));}
      finally {await fs.rm(temp,{force:true}).catch(()=>{});}
    });
    tail=pending;
    return pending;
  };
  const read=async id=>{
    const filename=path.join(root,`${jobId(id)}.json`);
    await checkRoot(false);
    const stat=await fs.lstat(filename);
    if(!stat.isFile() || stat.isSymbolicLink() || stat.size>MAX_BYTES)throw Error('Báo cáo công việc không hợp lệ.');
    const snapshot=JSON.parse(await fs.readFile(filename,'utf8'));
    if(snapshot?.id!==id)throw Error('Mã báo cáo không khớp với công việc.');
    if(!snapshot.updatedAt)snapshot.updatedAt=stat.mtime.toISOString();
    return snapshot;
  };
  const candidate=async snapshot=>{
    if(!['failed','stopped'].includes(snapshot?.status) || !snapshot.workspaceReady || snapshot.checkpoint?.integrationStarted || (snapshot.results || []).some(result=>result?.commit) || !Array.isArray(snapshot.plan?.tasks) || snapshot.plan.tasks.length!==2 || !/^[a-f0-9]{40}$/i.test(snapshot.source?.baseCommit || ''))return null;
    const savedId=worktreeId(snapshot);
    const paths=['integration','account-1','account-2'].map(name=>path.join(path.resolve(stateRoot),savedId,name));
    for(const cwd of paths) {
      try {const stat=await fs.lstat(cwd);if(!stat.isDirectory() || stat.isSymbolicLink())return null;await fs.access(path.join(cwd,'.git'));}
      catch {return null;}
    }
    return {id:snapshot.id,goal:snapshot.goal,worktreeId:savedId,branch:`bmh-team/${savedId}/integration`,path:paths[0],sourceCommit:snapshot.source.baseCommit,status:snapshot.status,error:redactProcessText(snapshot.error || '').slice(0,6000),completedWorkers:(snapshot.results || []).filter(result=>result?.status==='completed').length,updatedAt:snapshot.updatedAt};
  };
  const latestRecoverable=async()=>{
    let files;try {await checkRoot(false);files=await fs.readdir(root);}catch(error){if(error.code==='ENOENT')return null;throw error;}
    const names=files.filter(name=>name.endsWith('.json') && ID.test(name.slice(0,-5))).sort((a,b)=>Number(b.split('-')[0])-Number(a.split('-')[0])).slice(0,1000);
    const seen=new Set();
    for(const name of names) {
      try {
        const snapshot=await read(name.slice(0,-5));const savedId=worktreeId(snapshot);
        if(seen.has(savedId))continue;seen.add(savedId);
        const recovery=await candidate(snapshot);
        if(recovery)return {snapshot,recovery};
      } catch { /* A damaged or incomplete legacy report is not a recovery plan. */ }
    }
    return null;
  };
  return {save,read,candidate,latestRecoverable,flush:()=>tail};
}
