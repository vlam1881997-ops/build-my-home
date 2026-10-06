import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
import { loadConfig, loadState, saveState } from "./config.mjs";
import { createWorktree, diff, commitAll, pushBranch, createPr } from "./git.mjs";
import { chat } from "./providers.mjs";
import { executeTool, parseTool, toolSpec } from "./tools.mjs";
const id=()=>crypto.randomUUID().slice(0,8), now=()=>new Date().toISOString();
export function getRuns(){return loadState("runs.json",[]);}
function updateRun(run){const all=getRuns().filter(x=>x.id!==run.id);all.unshift(run);saveState("runs.json",all.slice(0,50));}
function log(run,msg){run.logs.push({at:now(),msg});updateRun(run);}
async function runAgent(agent,cwd,goal,context,project,cfg,run){
 const pkg=JSON.parse(fs.readFileSync(path.join(project.repoPath,"package.json"),"utf8")); const allowed=Object.keys(pkg.scripts||{});
 const system="You are "+agent.name+", role="+agent.role+", working in an isolated Git worktree. Solve safely and minimally. "+toolSpec()+" When finished use done. Never claim tests passed unless you ran them.";
 const messages=[{role:"system",content:system},{role:"user",content:"Task:\n"+goal+"\n\nContext:\n"+(context||"(none)")}];
 for(let turn=0;turn<(cfg.workflow.maxAgentTurns||18);turn++){
  const answer=await chat(agent,messages);messages.push({role:"assistant",content:answer});const req=parseTool(answer);
  if(!req){messages.push({role:"user",content:"Use one tool JSON call, or done."});continue;}
  log(run,agent.name+": "+req.tool+(req.path?" "+req.path:""));const out=await executeTool(cwd,req,allowed);
  if(out.startsWith("__DONE__"))return out.slice(9).trim();messages.push({role:"user",content:"Tool result:\n"+out);
 } throw new Error(agent.name+" exceeded max turns");
}
async function reviewerVerdict(agent,goal,patch){
 const txt=await chat(agent,[{role:"system",content:"You are a strict senior reviewer. Return JSON only: {\"approved\":boolean,\"summary\":string,\"risks\":[string],\"fixes\":[string]}."},{role:"user",content:"Goal:\n"+goal+"\n\nDiff:\n"+patch.slice(0,70000)}]);
 try{return JSON.parse(txt.match(/\{[\s\S]*\}/)?.[0]||"{}");}catch{return {approved:false,summary:"Reviewer returned invalid JSON",risks:[txt],fixes:[]};}
}
export async function startRun(input){
 const cfg=loadConfig(), project=cfg.projects.find(x=>x.id===input.projectId); if(!project)throw new Error("Unknown project");
 const enabled=cfg.agents.filter(x=>x.enabled), planner=enabled.find(x=>x.id===input.plannerId), worker=enabled.find(x=>x.id===input.workerId), reviewer=enabled.find(x=>x.id===input.reviewerId);
 if(!planner||!worker||!reviewer)throw new Error("Choose planner, worker and reviewer");
 const run={id:id(),projectId:input.projectId,goal:input.goal,status:"running",createdAt:now(),logs:[]};updateRun(run);
 try{
  log(run,"Planner is preparing implementation context");
  const plan=await chat(planner,[{role:"system",content:"Create a concise implementation plan for another coding agent: scope, likely files, acceptance checks, regression risks."},{role:"user",content:input.goal}]);
  const wt=await createWorktree(project,worker.id,run.id);run.branch=wt.branch;run.worktree=wt.dir;updateRun(run);log(run,"Worker started in isolated worktree "+wt.branch);
  const summary=await runAgent(worker,wt.dir,input.goal,plan,project,cfg,run);let patch=await diff(wt.dir);if(!patch.trim())throw new Error("Worker finished without code changes");
  if(cfg.workflow.requireTests&&project.testScript){const pkg=JSON.parse(fs.readFileSync(path.join(project.repoPath,"package.json"),"utf8"));if(pkg.scripts?.[project.testScript]){log(run,"Running required npm script: "+project.testScript);const out=await executeTool(wt.dir,{tool:"run_npm",script:project.testScript},Object.keys(pkg.scripts||{}));if(!out.startsWith("exit=0"))throw new Error("Required tests failed\n"+out.slice(-8000));}}
  log(run,"Reviewer is checking diff");let verdict=await reviewerVerdict(reviewer,input.goal,patch);run.review=verdict;updateRun(run);
  if(!verdict.approved&&verdict.fixes?.length){log(run,"Reviewer requested fixes; worker gets one repair pass");await runAgent(worker,wt.dir,input.goal,"Plan:\n"+plan+"\n\nReviewer fixes:\n- "+verdict.fixes.join("\n- "),project,{...cfg,workflow:{...cfg.workflow,maxAgentTurns:8}},run);patch=await diff(wt.dir);verdict=await reviewerVerdict(reviewer,input.goal,patch);run.review=verdict;updateRun(run);}
  if(!verdict.approved)throw new Error("Reviewer rejected changes: "+verdict.summary);
  run.commit=await commitAll(wt.dir,"Local Work: "+input.goal.slice(0,72));
  if(cfg.workflow.autoPush){log(run,"Pushing reviewed branch");await pushBranch(wt.dir,wt.branch,project);run.pushed=true;if(cfg.workflow.autoPr)run.prUrl=await createPr(project,wt.branch,"Local Work: "+input.goal.slice(0,72),"Automated reviewed change.\n\nWorker: "+worker.name+"\nReviewer: "+reviewer.name+"\n\n"+summary);}
  run.status="done";run.result={plan,summary,review:verdict,diff:patch.slice(0,80000)};log(run,"Run completed");return run;
 }catch(e){run.status="failed";run.error=String(e?.stack||e);log(run,"FAILED: "+String(e?.message||e));return run;}
}
