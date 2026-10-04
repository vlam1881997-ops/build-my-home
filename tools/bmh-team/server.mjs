import http from 'node:http';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {randomBytes,timingSafeEqual} from 'node:crypto';
import {spawn} from 'node:child_process';
import {CodexWorker,privateStateRoot,findCodex,findGit,scrub} from './core.mjs';
import {TeamJob} from './jobs.mjs';
import {MODEL_OPTIONS,REASONING_OPTIONS,loadModelSettings,saveModelSettings,validateModelSettings} from './models.mjs';
import {SOURCE_MODE_OPTIONS,validateSourceMode} from './git-source.mjs';

const toolRoot=path.dirname(fileURLToPath(import.meta.url));
const terminalStates=new Set(['ready','failed','stopped']);
export function twoAccountsReady(workers) {
  const emails=workers.map(worker=>worker.account?.email?.trim().toLowerCase());
  if(emails.some(v=>!v))throw Error('Đăng nhập cả hai tài khoản ChatGPT và chờ email hiện trên hai thẻ.');
  if(emails[0]===emails[1] || (workers[0].identity && workers[0].identity===workers[1].identity))throw Error('Hai thẻ đang đăng nhập cùng email hoặc tài khoản. Đăng xuất thẻ thứ hai và chọn tài khoản ChatGPT khác.');
}

export async function createTeamServer({stateRoot,repoDefault='',codex,git,workers,jobFactory=options=>new TeamJob(options)}={}) {
  stateRoot ||= await privateStateRoot();
  if(codex===undefined)codex=await findCodex();
  if(git===undefined)git=await findGit();
  workers ||= ['one','two'].map(id=>new CodexWorker({id,stateRoot,codex}));
  const loadedSettings=await loadModelSettings(stateRoot);
  let modelSettings=loadedSettings.settings;let settingsWarning=loadedSettings.warning;let settingsSaving=false;let settingsRevision=0;
  const token=randomBytes(32).toString('hex');let job=null;let shuttingDown=false;let runPreparing=false;let runEpoch=0;
  const isBusy=()=>runPreparing || Boolean(job && !terminalStates.has(job.publicState.status));
  const sourceModeDefault=/(?:^|[\\/])GitHubDesktop(?:[\\/]|$)/i.test(String(git || ''))?'desktop':'fetch';
  const state=()=>({version:'1.1.1',workers:workers.map(w=>({...w.publicState,modelSettings:{...modelSettings[w.id]}})),modelOptions:MODEL_OPTIONS,reasoningOptions:REASONING_OPTIONS,sourceModeOptions:SOURCE_MODE_OPTIONS,sourceModeDefault,settingsWarning,settingsRevision,run:job?.publicState||null,repoDefault,capabilities:{git:Boolean(git),codex:Boolean(codex),windows:process.platform==='win32'},busy:isBusy()||settingsSaving});
  const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  const server=http.createServer(async(req,res)=>{
    const address=server.address();const allowedHost=`127.0.0.1:${address.port}`;const origin=`http://${allowedHost}`;
    if(req.headers.host!==allowedHost)return json(res,403,{ok:false,error:'BMH Team chỉ nhận kết nối localhost.'});
    if(req.headers.origin && req.headers.origin!==origin)return json(res,403,{ok:false,error:'Nguồn yêu cầu không hợp lệ.'});
    const pathname=new URL(req.url,origin).pathname;
    try {
      if(pathname==='/api/state' && req.method==='GET')return json(res,200,state());
      if(req.method==='POST' && pathname.startsWith('/api/')){
        const supplied=Buffer.from(String(req.headers['x-bmh-team']||''));const expected=Buffer.from(token);
        if(supplied.length!==expected.length || !timingSafeEqual(supplied,expected))return json(res,403,{ok:false,error:'Tải lại trang BMH Team để kết nối phiên này.'});
        if(!/^application\/json(?:;|$)/i.test(req.headers['content-type']||''))return json(res,415,{ok:false,error:'Yêu cầu JSON không hợp lệ.'});
        const chunks=[];let bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>64000)throw Error('Nội dung yêu cầu quá dài.');chunks.push(chunk);}
        const body=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');
        const worker=workers.find(w=>w.id===body.worker);
        if(pathname==='/api/settings'){
          if(isBusy() || settingsSaving || shuttingDown)throw Error('Chờ nhiệm vụ kết thúc trước khi đổi model.');
          if(!worker)throw Error('Chọn thẻ tài khoản 1 hoặc 2.');
          const selected=validateModelSettings(body);
          settingsSaving=true;
          try {
            const updated={...modelSettings,[worker.id]:selected};
            await saveModelSettings(stateRoot,updated);
            modelSettings=updated;settingsWarning=null;settingsRevision++;
            return json(res,200,{ok:true,modelSettings:selected,state:{...state(),busy:isBusy()}});
          } finally {settingsSaving=false;}
        }
        if(pathname==='/api/login'){
          if(isBusy())throw Error('Dừng nhiệm vụ trước khi thay đổi tài khoản.');
          if(!worker)throw Error('Chọn thẻ tài khoản 1 hoặc 2.');
          if(body.device)throw Error('BMH Team v1 dùng đăng nhập trình duyệt. Bấm Đăng nhập trên thẻ tài khoản.');
          if(workers.some(w=>w!==worker && w.loginInfo))throw Error('Hoàn tất đăng nhập thẻ đang mở trước, rồi đăng nhập tài khoản còn lại.');
          await worker.login();return json(res,200,{ok:true,worker:worker.publicState});
        }
        if(pathname==='/api/logout'){
          if(isBusy())throw Error('Dừng nhiệm vụ trước khi thay đổi tài khoản.');
          if(!worker)throw Error('Tài khoản không hợp lệ.');
          await worker.logout();return json(res,200,{ok:true});
        }
        if(pathname==='/api/run'){
          if(isBusy() || settingsSaving)throw Error('Đang có nhiệm vụ chạy hoặc cấu hình đang lưu. Chờ hoàn tất trước.');
          if(settingsWarning)throw Error(settingsWarning);
          const sourceMode=validateSourceMode(body.sourceMode);
          runPreparing=true;
          const ticket=++runEpoch;
          const runModels=structuredClone(modelSettings);
          try {
          if(!git || !codex)throw Error('Cần Git và Codex trên máy. Mở lại start.ps1 để kiểm tra cài đặt.');
          for(const w of workers)await w.refreshAccount();
          if(ticket!==runEpoch || shuttingDown)throw Error('Nhiệm vụ đã dừng trước khi bắt đầu.');
          twoAccountsReady(workers);
          const repo=String(body.repo||repoDefault).trim().replace(/^"|"$/g,'');const goal=String(body.goal||'').trim();
          if(!path.isAbsolute(repo))throw Error('Chọn đường dẫn đầy đủ tới thư mục BMH trên máy.');
          if(goal.length<5 || goal.length>12000)throw Error('Nhập mục tiêu từ 5 đến 12.000 ký tự.');
          repoDefault=repo;
          job=jobFactory({workers,repo,goal,gitCommand:git,stateRoot,sourceMode,modelSettings:runModels,onEvent:async update=>{
            // Save task summaries only; authentication remains in Codex-managed account storage.
            try{await mkdir(path.join(stateRoot,'reports'),{recursive:true,mode:0o700});await writeFile(path.join(stateRoot,'reports',`${update.id}.json`),JSON.stringify(update,null,2),{mode:0o600});}catch{}
          }});
          for(const w of workers)w.removeAllListeners('progress');
          for(const w of workers)w.on('progress',message=>{job?.note?.(scrub(message),w.id);});
          Promise.resolve(job.start()).catch(()=>{});
          return json(res,202,{ok:true,run:job.publicState});
          } finally {runPreparing=false;}
        }
        if(pathname==='/api/stop'){
          runEpoch++;
          if(job && isBusy())await job.stop();return json(res,200,{ok:true,run:job?.publicState||null});
        }
        return json(res,404,{ok:false,error:'Không có thao tác này.'});
      }
      if(req.method!=='GET')return json(res,405,{ok:false,error:'Phương thức không hỗ trợ.'});
      const files={'/':'index.html','/app.js':'app.js','/style.css':'style.css'};
      if(!files[pathname])return json(res,404,{ok:false,error:'Không tìm thấy trang.'});
      let contents=await readFile(path.join(toolRoot,'public',files[pathname]),'utf8');
      if(pathname==='/')contents=contents.replaceAll('__BMH_TOKEN__',token);
      res.writeHead(200,{'Content-Type':pathname==='/'?'text/html; charset=utf-8':pathname==='/app.js'?'text/javascript; charset=utf-8':'text/css; charset=utf-8',
        'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer',
        'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; img-src 'self' data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'"});
      res.end(contents);
    } catch(e) {json(res,400,{ok:false,error:scrub(e.message)});}
  });
  server.requestTimeout=60000;
  const close=async()=>{
    if(shuttingDown)return;shuttingDown=true;
    runEpoch++;
    if(isBusy() && job)await job.stop().catch(()=>{});
    await Promise.all(workers.map(w=>w.close()));await new Promise(resolve=>server.close(resolve));
  };
  return {server,state,workers,close,token};
}

async function main() {
  const args=process.argv.slice(2);const arg=name=>{const at=args.indexOf(name);return at<0?null:args[at+1];};
  let repoDefault=arg('--repo') || '';
  if(!repoDefault){const candidate=path.resolve(toolRoot,'../..');try{await access(path.join(candidate,'.git'));await access(path.join(candidate,'package.json'));repoDefault=candidate;}catch{}}
  const app=await createTeamServer({repoDefault});
  await new Promise((resolve,reject)=>{app.server.once('error',reject);app.server.listen(0,'127.0.0.1',resolve);});
  const url=`http://127.0.0.1:${app.server.address().port}/`;
  process.stdout.write(`\nBMH Team v1.1.1: ${url}\nGiữ cửa sổ này mở. Chọn nguồn code, model, mức suy luận và giao việc cho hai tài khoản.\n`);
  if(!args.includes('--no-browser')){
    const command=process.platform==='win32'?'rundll32.exe':process.platform==='darwin'?'open':'xdg-open';
    const openArgs=process.platform==='win32'?['url.dll,FileProtocolHandler',url]:[url];
    const browser=spawn(command,openArgs,{stdio:'ignore',windowsHide:true});browser.on('error',()=>{});
  }
  for(const worker of app.workers)worker.start().catch(e=>{worker.error=scrub(e.message);worker.changed();});
  const refresh=setInterval(()=>{for(const w of app.workers)if(!w.current && !w.loginInfo)w.refreshAccount().catch(()=>{});},15000);
  refresh.unref();
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{clearInterval(refresh);app.close().finally(()=>process.exit(0));});
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(e=>{process.stderr.write(scrub(e.message)+'\n');process.exitCode=1;});
