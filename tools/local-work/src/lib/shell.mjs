import { spawn } from "node:child_process";
export function run(cmd, args=[], opts={}){
  return new Promise((resolve,reject)=>{
    const child = spawn(cmd,args,{cwd:opts.cwd,env:{...process.env,...(opts.env||{})},shell:false,windowsHide:true});
    let stdout="", stderr="";
    child.stdout?.on("data",d=>stdout+=d); child.stderr?.on("data",d=>stderr+=d);
    child.on("error",reject); child.on("close",code=>resolve({code,stdout,stderr}));
  });
}
export async function must(cmd,args=[],opts={}){
  const r=await run(cmd,args,opts);
  if(r.code!==0) throw new Error(cmd+" failed ("+r.code+")\n"+(r.stderr||r.stdout));
  return r;
}
