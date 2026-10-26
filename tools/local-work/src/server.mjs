import http from "node:http"; import fs from "node:fs"; import path from "node:path"; import { fileURLToPath } from "node:url";
import { loadConfig } from "./lib/config.mjs"; import { getRuns,startRun } from "./lib/orchestrator.mjs";
const here=path.dirname(fileURLToPath(import.meta.url)), cfg=loadConfig(), host=cfg.server?.host||"127.0.0.1", port=cfg.server?.port||4317;
function json(res,status,obj){const b=JSON.stringify(obj);res.writeHead(status,{"content-type":"application/json; charset=utf-8","content-length":Buffer.byteLength(b)});res.end(b);}
function body(req){return new Promise((resolve,reject)=>{let s="";req.on("data",d=>{s+=d;if(s.length>1e6)reject(new Error("body too large"));});req.on("end",()=>{try{resolve(s?JSON.parse(s):{});}catch(e){reject(e);}});});}
function file(res,name,type){const b=fs.readFileSync(path.join(here,"public",name));res.writeHead(200,{"content-type":type,"content-length":b.length});res.end(b);}
http.createServer(async(req,res)=>{try{
 if(req.method==="GET"&&req.url==="/")return file(res,"index.html","text/html; charset=utf-8");
 if(req.method==="GET"&&req.url==="/app.js")return file(res,"app.js","text/javascript; charset=utf-8");
 if(req.method==="GET"&&req.url==="/api/config")return json(res,200,{projects:cfg.projects,agents:cfg.agents.map(a=>({...a,apiKeyConfigured:Boolean(process.env[a.apiKeyEnv])})),workflow:cfg.workflow});
 if(req.method==="GET"&&req.url==="/api/runs")return json(res,200,getRuns());
 if(req.method==="POST"&&req.url==="/api/runs"){const input=await body(req);if(!input.goal?.trim())return json(res,400,{error:"goal is required"});return json(res,200,await startRun(input));}
 return json(res,404,{error:"not found"});
}catch(e){return json(res,500,{error:String(e?.message||e)});}}).listen(port,host,()=>console.log("Local Work running at http://"+host+":"+port));
