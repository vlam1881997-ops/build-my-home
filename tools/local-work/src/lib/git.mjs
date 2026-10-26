import fs from "node:fs";
import path from "node:path";
import { must, run } from "./shell.mjs";
import { stateDir } from "./config.mjs";
const safe=s=>String(s).replace(/[^a-zA-Z0-9._-]+/g,"-").replace(/^-+|-+$/g,"").toLowerCase();
export async function ensureRepo(project){
  if(!fs.existsSync(path.join(project.repoPath,".git"))) throw new Error("Repo not found: "+project.repoPath);
  await must("git",["fetch","origin",project.defaultBranch],{cwd:project.repoPath});
}
export async function createWorktree(project,agentId,taskId){
  await ensureRepo(project);
  const branch="local-work/"+safe(taskId)+"/"+safe(agentId);
  const wtRoot=path.join(stateDir(),"worktrees"); fs.mkdirSync(wtRoot,{recursive:true});
  const dir=path.join(wtRoot,safe(taskId)+"-"+safe(agentId));
  if(fs.existsSync(dir)) await run("git",["worktree","remove","--force",dir],{cwd:project.repoPath});
  await run("git",["branch","-D",branch],{cwd:project.repoPath});
  await must("git",["worktree","add","-b",branch,dir,"origin/"+project.defaultBranch],{cwd:project.repoPath});
  return {dir,branch};
}
export async function diff(cwd){ return (await must("git",["diff","--no-ext-diff","--unified=3"],{cwd})).stdout; }
export async function commitAll(cwd,message){
  await must("git",["add","-A"],{cwd});
  const st=(await must("git",["status","--short"],{cwd})).stdout; if(!st.trim()) return null;
  await must("git",["commit","-m",message],{cwd});
  return (await must("git",["rev-parse","HEAD"],{cwd})).stdout.trim();
}
export async function pushBranch(cwd,branch,project){
  const env=project.githubProfileDir?{GH_CONFIG_DIR:project.githubProfileDir}:{};
  await must("git",["push","-u","origin",branch],{cwd,env});
}
export async function createPr(project,branch,title,body){
  const env=project.githubProfileDir?{GH_CONFIG_DIR:project.githubProfileDir}:{};
  const r=await must("gh",["pr","create","--repo",project.githubRepo,"--base",project.defaultBranch,"--head",branch,"--title",title,"--body",body],{cwd:project.repoPath,env});
  return r.stdout.trim();
}
