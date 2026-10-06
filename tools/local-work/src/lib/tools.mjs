import fs from "node:fs"; import path from "node:path"; import { run } from "./shell.mjs";
function inside(root,p){const full=path.resolve(root,p||".");if(full!==root&&!full.startsWith(root+path.sep))throw new Error("Path escapes worktree");return full;}
export function toolSpec(){return "Tools: output exactly one JSON object on one line. list={tool:list,path:.}; read={tool:read,path:file}; write={tool:write,path:file,content:complete}; patch={tool:patch,path:file,find:exact,replace:new}; run npm={tool:run_npm,script:test}; diff={tool:git_diff}; finish={tool:done,summary:text}. Never read .env, .git, node_modules or outside worktree.";}
export function parseTool(text){for(const line of String(text).split(/\r?\n/).map(x=>x.trim())){if(line.startsWith("{")&&line.endsWith("}")){try{const j=JSON.parse(line);if(j.tool)return j;}catch{}}}return null;}
export async function executeTool(cwd,req,allowedScripts=[]){
 if(req.tool==="list"){return fs.readdirSync(inside(cwd,req.path||"."),{withFileTypes:true}).filter(x=>![".git","node_modules",".local-work"].includes(x.name)).slice(0,150).map(x=>(x.isDirectory()?"[D] ":"[F] ")+x.name).join("\n");}
 if(req.tool==="read"){if(/(^|\/)(\.env|\.git)(\/|$)/.test(req.path))throw new Error("Blocked sensitive path");const b=fs.readFileSync(inside(cwd,req.path));if(b.length>180000)throw new Error("File too large");return b.toString("utf8");}
 if(req.tool==="write"){if(/(^|\/)(\.env|\.git)(\/|$)/.test(req.path))throw new Error("Blocked sensitive path");const p=inside(cwd,req.path);fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,String(req.content??""),"utf8");return "written";}
 if(req.tool==="patch"){const p=inside(cwd,req.path),s=fs.readFileSync(p,"utf8"),f=String(req.find??"");if(!f||!s.includes(f))throw new Error("Patch text not found");fs.writeFileSync(p,s.replace(f,String(req.replace??"")),"utf8");return "patched";}
 if(req.tool==="run_npm"){if(!allowedScripts.includes(req.script))throw new Error("Script not allowed");const r=await run(process.platform==="win32"?"npm.cmd":"npm",["run",req.script],{cwd});return "exit="+r.code+"\nSTDOUT:\n"+r.stdout.slice(-30000)+"\nSTDERR:\n"+r.stderr.slice(-20000);}
 if(req.tool==="git_diff"){return (await run("git",["diff","--no-ext-diff","--unified=3"],{cwd})).stdout.slice(0,70000);}
 if(req.tool==="done")return "__DONE__ "+String(req.summary||""); throw new Error("Unknown tool");
}
