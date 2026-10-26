import {EventEmitter} from 'node:events';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir, writeFile, access, readdir, readFile, mkdtemp, rm, stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import os from 'node:os';
import {emptyModelCatalog,validateModelSettings,validateCatalogSettings} from './models.mjs';
import {readCodexModelCatalog} from './model-catalog.mjs';
import {redactProcessText} from './git-source.mjs';
import {MAX_WORKER_TIMEOUT_MS,workerTimeLimits} from './limits.mjs';

const exec = promisify(execFile);
export const scrub = value => redactProcessText(value).replace(/\beyJ[\w-]{20,}\.[\w-]+\.[\w-]+\b/g, '[ẩn thông tin đăng nhập]').replace(/((?:access_token|refresh_token|id_token|api_key|authorization)["']?\s*[=:]\s*["']?)(?:Bearer\s+)?[^\s,"';}]+/gi, '$1[ẩn]').replace(/\bBearer\s+[^\s,"';}]+/gi, 'Bearer [ẩn]').slice(0, 12000);

export function isolatedEnvironment(stateHome, inherited = process.env) {
  const env = {...inherited};
  for (const name of Object.keys(env)) if (/(?:API[_-]?KEY|ACCESS[_-]?TOKEN|AUTH[_-]?TOKEN|PASSWORD|SECRET|(?:^|_)TOKEN$)/i.test(name) || /^(?:OPENAI|ANTHROPIC|GEMINI|VERCEL|GOOGLE_APPLICATION_CREDENTIALS)(?:_|$)/i.test(name)) delete env[name];
  for (const name of ['OPENAI_API_KEY','CODEX_API_KEY','CODEX_ACCESS_TOKEN','OPENAI_BASE_URL','OPENAI_ORG_ID','OPENAI_ORGANIZATION','OPENAI_PROJECT_ID','CODEX_SQLITE_HOME','CODEX_REMOTE_TOKEN']) delete env[name];
  delete env.NODE_OPTIONS;
  // This is Codex's documented state-root option, scoped to this child process.
  // It does not change the user's global Codex configuration or authentication.
  env.CODEX_HOME = stateHome;
  return env;
}

export async function privateStateRoot(override) {
  const root = path.resolve(override || path.join(process.env.LOCALAPPDATA || path.join(os.homedir(), '.local', 'share'), 'BMHTeam'));
  await mkdir(root, {recursive:true, mode:0o700});
  if (process.platform === 'win32') {
    const identity = (await exec('whoami.exe', [], {timeout:10000, windowsHide:true})).stdout.trim();
    await exec('icacls.exe', [root, '/inheritance:r', '/grant:r', `${identity}:(OI)(CI)F`], {timeout:10000, windowsHide:true});
  }
  return root;
}

async function executable(name) {
  try {
    const result = await exec(process.platform === 'win32' ? 'where.exe' : 'which', [name], {timeout:5000, windowsHide:true});
    return result.stdout.split(/\r?\n/).find(Boolean) || null;
  } catch { return null; }
}

export async function findGit() {
  if (process.env.BMH_TEAM_GIT) { await access(process.env.BMH_TEAM_GIT); return process.env.BMH_TEAM_GIT; }
  const regular = await executable('git');
  if (regular) return regular;
  if (process.platform === 'win32' && process.env.LOCALAPPDATA) {
    const desktop = path.join(process.env.LOCALAPPDATA, 'GitHubDesktop');
    try {
      const versions = (await readdir(desktop)).filter(v => /^app-/.test(v)).sort().reverse();
      for (const version of versions) {
        const candidate = path.join(desktop, version, 'resources', 'app', 'git', 'cmd', 'git.exe');
        try { await access(candidate); return candidate; } catch {}
      }
    } catch {}
  }
  return null;
}

export async function findCodex() {
  const supplied = process.env.BMH_TEAM_CODEX;
  const binary = supplied || await executable('codex');
  if (!binary) return null;
  await access(binary);
  if (process.platform === 'win32' && /\.(cmd|ps1)$/i.test(binary)) {
    const script = path.join(path.dirname(binary), 'node_modules', '@openai', 'codex', 'bin', 'codex.js');
    await access(script);
    return {command:process.execPath, prefix:[script]};
  }
  return {command:binary, prefix:[]};
}

export function killTree(child) {
  if (!child) return;
  if (!child.pid) {child.kill?.();return;}
  if (process.platform === 'win32') {
    const command=path.join(process.env.SystemRoot || 'C:\\Windows','System32','taskkill.exe');
    const killer = spawn(command, ['/pid', String(child.pid), '/t', '/f'], {windowsHide:true, stdio:'ignore'});
    const timer=setTimeout(()=>{killer.kill();child.kill();},2000);timer.unref();
    killer.once('error',()=>{clearTimeout(timer);child.kill();});
    killer.once('close',code=>{clearTimeout(timer);if(code!==0)child.kill();});
  } else {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill(); }
    const timer = setTimeout(() => {try {process.kill(-child.pid, 'SIGKILL');} catch {}}, 1500);
    timer.unref();
  }
}

// Account labels come only from our own private CLI cache, after CLI login status
// confirms ChatGPT mode. Tokens are never returned, logged, copied or sent by BMH.
function accountLabel(auth) {
  if (auth.auth_mode && auth.auth_mode !== 'chatgpt') return null;
  const token = auth.tokens?.id_token;
  if (typeof token !== 'string' || token.length > 65536) return null;
  let claims;
  try {claims=JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));} catch {return null;}
  const profile=claims['https://api.openai.com/profile'] || {};
  const details=claims['https://api.openai.com/auth'] || {};
  const email=claims.email || profile.email;
  if(typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))return null;
  const subject=claims.sub || details.chatgpt_user_id;
  const identity=createHash('sha256').update(String(subject || email.trim().toLowerCase())).digest('hex');
  const plan=details.chatgpt_plan_type;
  return {account:{email,planType:typeof plan==='string' && /^[\w-]{1,40}$/.test(plan)?plan:null},identity};
}

function officialLoginUrl(line) {
  for(const match of line.matchAll(/https:\/\/[^\s<>"']+/g)) {
    try {
      const url=new URL(match[0]);
      if(['auth.openai.com','auth.chatgpt.com'].includes(url.hostname) && !url.port && !url.username && !url.password && /\/(?:oauth\/)?authorize\/?$/.test(url.pathname))return url.href;
    } catch {}
  }
  return null;
}

function commandError(result) {
  const message=scrub(result.stderr || result.stdout || '');
  if(/usage.limit|quota|rate.limit|429|limit.reached/i.test(message))return Error('Tài khoản đã chạm hạn mức Codex. Chờ hạn mức hồi phục hoặc dừng nhiệm vụ; BMH không chuyển sang API tính phí.');
  if(/model[_ -]?not[_ -]?found|(?:model|reasoning)[\s\S]{0,120}(?:not supported|unsupported|not available|not found|does not exist|access|permission)|(?:unsupported|not supported)[\s\S]{0,100}(?:model|reasoning)/i.test(message))return Error('Tài khoản hoặc Codex CLI chưa hỗ trợ model/mức suy luận đã chọn. Chọn lại model trên đúng thẻ; BMH giữ nguyên lựa chọn và dừng nhiệm vụ. '+message.slice(-1200));
  if(/401|unauthorized|not logged in|authentication|refresh.token/i.test(message))return Error('Phiên ChatGPT không còn sử dụng được. Đăng xuất và đăng nhập lại đúng thẻ tài khoản.');
  if(/sandbox|CreateProcess|1385|access.denied/i.test(message))return Error('Codex không chạy được trong sandbox trên máy này. Kiểm tra quyền thư mục và hướng dẫn Windows trong README. '+message.slice(-1000));
  return Error('Codex chưa hoàn thành nhiệm vụ. '+message.slice(-2000));
}

const itemTypes=new Set(['command_execution','file_change','agent_message','reasoning','mcp_tool_call','web_search','todo_list','image_generation']);
function meaningfulCodexEvent(event) {
  if(!event || typeof event!=='object' || Array.isArray(event))return false;
  if(event.type==='thread.started')return typeof event.thread_id==='string' && Boolean(event.thread_id);
  if(event.type==='turn.started' || event.type==='turn.completed')return true;
  if(event.type==='turn.failed')return typeof event.error?.message==='string';
  if(event.type==='error')return typeof event.message==='string' && Boolean(event.message);
  if(!['item.started','item.updated','item.completed'].includes(event.type) || !itemTypes.has(event.item?.type))return false;
  const item=event.item;
  if(['agent_message','reasoning'].includes(item.type))return typeof item.text==='string' && Boolean(item.text.trim());
  if(item.type==='command_execution')return typeof item.command==='string' && Boolean(item.command.trim());
  if(item.type==='file_change')return Array.isArray(item.changes) && item.changes.some(change=>typeof change?.path==='string' && Boolean(change.path));
  if(item.type==='mcp_tool_call')return typeof item.tool==='string' && Boolean(item.tool);
  if(item.type==='web_search')return typeof item.query==='string' && Boolean(item.query.trim());
  if(item.type==='todo_list')return Array.isArray(item.items);
  return item.type==='image_generation' && (typeof item.id==='string' || typeof item.status==='string');
}

function safeCommandLabel(value) {
  let command=String(value || '').trim();
  // Display known executable/verb labels, not shell arguments, inline scripts,
  // credentials or arbitrary remote command output.
  command=command.replace(/^\S*[\\/](?:bash|sh)(?:\s+-\w+)*\s+["']?/i,'').replace(/^(?:bash|sh)(?:\s+-\w+)*\s+["']?/i,'');
  const token=command.match(/^([\w.\\/:-]+)/)?.[1] || '';
  const executable=token.replace(/^.*[\\/]/,'').replace(/\.exe$/i,'').toLowerCase();
  const known=new Set(['rg','git','node','npm','pnpm','yarn','python','python3','ls','cat','sed','find','apply_patch','pwsh','powershell','bash','sh']);
  if(!known.has(executable))return 'thao tác trong thư mục nhiệm vụ';
  const verb=command.slice(token.length).trim().match(/^([a-z][a-z-]*)\b/)?.[1];
  const verbs={git:['status','diff','show','log','branch','rev-parse','fetch','add','commit'],npm:['test','run','ci','install'],pnpm:['test','run','build','install'],yarn:['test','run','build','install']};
  return executable+(verbs[executable]?.includes(verb)?' '+verb:'');
}

function timeoutError(type,duration) {
  const display=duration>=60000?`${Math.round(duration/60000)} phút`:`${duration} mili giây`;
  const error=Error(type==='idle'?`Codex hết thời gian chờ hoạt động (${display}); nhiệm vụ chưa hoàn thành. Mã nguồn được giữ để tiếp tục.`:`Codex hết thời gian tối đa (${display}); nhiệm vụ chưa hoàn thành. Mã nguồn được giữ để tiếp tục.`);
  error.code=type==='idle'?'CODEX_IDLE_TIMEOUT':'CODEX_TOTAL_TIMEOUT';
  error.timeoutType=type;error.timeoutMs=duration;return error;
}

export class CodexWorker extends EventEmitter {
  constructor({id,stateRoot,codex,spawnImpl=spawn,loginTimeoutMs=300000,modelTimeoutMs=20000}) {
    super();
    if(!['one','two'].includes(id))throw Error('Thẻ tài khoản không hợp lệ.');
    this.id=id;this.stateRoot=stateRoot;this.codex=codex;this.spawnImpl=spawnImpl;this.loginTimeoutMs=loginTimeoutMs;
    this.home=path.join(stateRoot,'accounts',id);
    this.account=null;this.identity=null;this.loginInfo=null;this.error=null;
    this.child=null;this.current=null;this.preparing=null;this.refreshing=null;this.loginProcess=null;
    this.processes=new Set();this.runEpoch=0;this.closed=false;
    this.modelCatalog=emptyModelCatalog();this.modelRefreshing=null;this.modelEntry=null;this.modelEpoch=0;this.modelTimeoutMs=modelTimeoutMs;
  }
  get publicState() {return {id:this.id,account:this.account,connected:Boolean(this.account),login:this.loginInfo,error:this.error,modelCatalog:structuredClone(this.modelCatalog)};}
  changed() {this.emit('change',this.publicState);}
  async prepare() {
    if(this.closed)throw Error('BMH Team đã đóng. Mở lại bộ điều phối.');
    if(!this.codex)throw Error('Chưa có Codex. Mở MO-BMH-TEAM.cmd để cài công cụ chính thức.');
    if(this.preparing)return this.preparing;
    this.preparing=(async()=>{
      await mkdir(this.home,{recursive:true,mode:0o700});
      // Only this helper's dedicated account config is managed here.
      let config='forced_login_method = "chatgpt"\ncli_auth_credentials_store = "file"\n[analytics]\nenabled = false\n';
      if(process.platform==='win32')config+='[windows]\nsandbox = "unelevated"\n';
      await writeFile(path.join(this.home,'config.toml'),config,{mode:0o600});
    })().finally(()=>{this.preparing=null;});
    return this.preparing;
  }
  async start() {await this.prepare();await this.refreshAccount();if(this.account)await this.refreshModels();return this.account;}

  // All invocations are direct, shell-free, bounded CLI processes. `close`
  // waits for stdio to drain; successful text alone is never a successful job.
  command(args,{cwd=this.home,input='',timeoutMs=20000,idleTimeoutMs,onLine,onActivity,keepStdinOpen=false}={}) {
    if(this.closed)throw Error('BMH Team đã đóng.');
    if(!Number.isSafeInteger(timeoutMs) || timeoutMs<1 || timeoutMs>MAX_WORKER_TIMEOUT_MS)throw Error('Thời gian tối đa của Codex không hợp lệ.');
    if(idleTimeoutMs!==undefined && (!Number.isSafeInteger(idleTimeoutMs) || idleTimeoutMs<1 || idleTimeoutMs>timeoutMs))throw Error('Thời gian chờ hoạt động của Codex không hợp lệ.');
    const child=this.spawnImpl(this.codex.command,[...this.codex.prefix,...args],{
      cwd,env:isolatedEnvironment(this.home),stdio:['pipe','pipe','pipe'],windowsHide:true,detached:process.platform!=='win32'
    });
    const entry={child,cancel:null,finished:null,touchActivity:null};this.processes.add(entry);
    let stdout='',stderr='',buffer='',settled=false,reason=null,total=0,timer,idleTimer,cancelTimer;
    let resolve,reject;
    entry.finished=new Promise((yes,no)=>{resolve=yes;reject=no;});
    const finish=(error,result)=>{
      if(settled)return;settled=true;clearTimeout(timer);clearTimeout(idleTimer);clearTimeout(cancelTimer);this.processes.delete(entry);
      if(error)reject(error);else resolve(result);
    };
    entry.cancel=(error=Error('Nhiệm vụ đã dừng.'))=>{
      if(settled || reason)return;reason=error;killTree(child);
      clearTimeout(timer);clearTimeout(idleTimer);
      // An elapsed shutdown grace period forces termination; it must not report
      // a released account while the actual process still owns the workspace.
      cancelTimer=setTimeout(()=>{
        if(process.platform!=='win32' && child.pid){try {process.kill(-child.pid,'SIGKILL');} catch {child.kill('SIGKILL');}}
        else child.kill('SIGKILL');
      },2500);cancelTimer.unref?.();
    };
    const resetIdle=()=>{
      if(idleTimeoutMs===undefined)return;
      clearTimeout(idleTimer);idleTimer=setTimeout(()=>entry.cancel(timeoutError('idle',idleTimeoutMs)),idleTimeoutMs);idleTimer.unref?.();
    };
    entry.touchActivity=metadata=>{
      if(settled || reason)return false;
      resetIdle();onActivity?.(metadata);return true;
    };
    timer=setTimeout(()=>entry.cancel(timeoutError('maximum',timeoutMs)),timeoutMs);timer.unref?.();resetIdle();
    child.stdout.setEncoding('utf8');child.stderr.setEncoding('utf8');
    child.stdout.on('data',chunk=>{
      if(settled)return;
      total+=Buffer.byteLength(chunk);
      if(total>16*1024*1024)return entry.cancel(Error('Phản hồi Codex quá lớn; nhiệm vụ chưa hoàn thành.'));
      // Exec events can be large; retain only a bounded diagnostic tail.
      stdout=(stdout+chunk).slice(-65536);buffer+=chunk;
      if(buffer.length>1024*1024)return entry.cancel(Error('Một sự kiện Codex quá lớn.'));
      let at;
      while((at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);onLine?.(line,'stdout');}
    });
    child.stderr.on('data',chunk=>{if(settled)return;stderr=(stderr+chunk).slice(-65536);onLine?.(chunk,'stderr');});
    child.on('error',()=>finish(Error('Không khởi động được Codex. Mở lại MO-BMH-TEAM.cmd và kiểm tra bản cài.')));
    child.on('close',(code,signal)=>{
      if(buffer.trim())onLine?.(buffer,'stdout');
      finish(reason,{code,signal,stdout,stderr});
    });
    child.stdin.on('error',()=>{});
    if(!keepStdinOpen)child.stdin.end(input);
    return entry;
  }

  async refreshAccount() {
    if(this.loginProcess || this.current || this.modelRefreshing)return this.account;
    if(this.refreshing)return this.refreshing;
    this.refreshing=(async()=>{
      await this.prepare();
      const result=await this.command(['login','status']).finished;
      let label=null;
      if(result.code===0 && /logged in using chatgpt/i.test(result.stdout+'\n'+result.stderr)) {
        const file=path.join(this.home,'auth.json');
        try {if((await stat(file)).size<=1024*1024)label=accountLabel(JSON.parse(await readFile(file,'utf8')));} catch {}
      }
      if(this.identity!==label?.identity){this.modelEpoch++;this.modelCatalog=emptyModelCatalog();}
      this.account=label?.account || null;this.identity=label?.identity || null;
      this.error=result.code===0 && !label?'Không nhận diện được tài khoản ChatGPT trong phiên riêng. Đăng xuất thẻ này và đăng nhập lại.':null;
      this.changed();return this.account;
    })().catch(error=>{this.account=null;this.identity=null;this.error=scrub(error.message);this.changed();throw error;}).finally(()=>{this.refreshing=null;});
    return this.refreshing;
  }

  async refreshModels({force=false}={}) {
    if(this.closed)throw Error('BMH Team đã đóng.');
    if(this.current || this.loginInfo)throw Error('Chờ nhiệm vụ hoặc đăng nhập kết thúc trước khi lấy model.');
    if(!this.account)throw Error('Đăng nhập tài khoản ChatGPT trên thẻ này trước khi lấy model.');
    if(this.modelRefreshing)return this.modelRefreshing;
    if(!force && this.modelCatalog.status==='ready')return this.modelCatalog;
    const ticket=++this.modelEpoch;const identity=this.identity;
    this.modelCatalog={...emptyModelCatalog(),status:'loading'};this.changed();
    this.modelRefreshing=(async()=>{
      await this.prepare();
      const options=await readCodexModelCatalog(onLine=>{
        const entry=this.command(['app-server'],{timeoutMs:this.modelTimeoutMs,onLine,keepStdinOpen:true});
        this.modelEntry=entry;return entry;
      });
      if(this.closed || ticket!==this.modelEpoch || identity!==this.identity)throw Error('Tài khoản thay đổi trong khi lấy model.');
      this.modelCatalog={status:'ready',options,updatedAt:new Date().toISOString(),error:null};
      this.changed();return this.modelCatalog;
    })().catch(error=>{
      if(!this.closed && ticket===this.modelEpoch){this.modelCatalog={...emptyModelCatalog(),status:'error',error:scrub(error.message)};this.changed();}
      throw error;
    }).finally(()=>{this.modelRefreshing=null;this.modelEntry=null;});
    return this.modelRefreshing;
  }

  async cancelModelRefresh() {
    this.modelEpoch++;
    this.modelEntry?.cancel(Error('Dừng lấy model vì tài khoản thay đổi.'));
    await this.modelRefreshing?.catch(()=>{});
    this.modelCatalog=emptyModelCatalog();
  }

  async login() {
    if(this.current)throw Error('Dừng nhiệm vụ trước khi thay đổi tài khoản.');
    if(this.loginProcess)return this.loginInfo;
    if(this.loginInfo)throw Error('Đăng nhập đang được chuẩn bị.');
    this.loginInfo={authUrl:null};this.error=null;this.account=null;this.identity=null;this.changed();
    await this.cancelModelRefresh();
    try {await this.prepare();} catch(error){this.loginInfo=null;throw error;}
    let readyResolve;const ready=new Promise(resolve=>{readyResolve=resolve;});
    let loginBuffer='';
    const entry=this.command(['login'],{timeoutMs:this.loginTimeoutMs,onLine:(line)=>{
      loginBuffer=(loginBuffer+line).slice(-32768);
      const url=officialLoginUrl(loginBuffer);
      if(url && this.loginProcess===entry){this.loginInfo={authUrl:url};this.changed();readyResolve();}
    }});
    this.loginProcess=entry;
    const finished=entry.finished.then(async result=>{
      if(this.loginProcess!==entry)return;
      this.loginProcess=null;this.loginInfo=null;
      if(result.code!==0)throw commandError(result);
      await this.refreshAccount();
      if(!this.account)throw Error('Chưa xác nhận được tài khoản ChatGPT. Đăng nhập lại trên thẻ này.');
      await this.refreshModels();
    }).catch(error=>{
      if(this.loginProcess && this.loginProcess!==entry)return;
      this.loginProcess=null;this.loginInfo=null;this.error=scrub(error.message);this.changed();
    }).finally(()=>readyResolve());
    // The CLI opens the browser itself; the page additionally offers the same
    // official URL for a separate Chrome profile for account two.
    let timer;
    await Promise.race([ready,finished,new Promise(resolve=>{timer=setTimeout(resolve,5000);timer.unref?.();})]);
    clearTimeout(timer);
    return this.loginInfo;
  }

  async logout() {
    if(this.current)throw Error('Dừng nhiệm vụ trước khi thay đổi tài khoản.');
    const previous=this.loginProcess;this.loginProcess=null;this.loginInfo=null;
    previous?.cancel(Error('Đã đóng cửa sổ đăng nhập.'));
    await previous?.finished.catch(()=>{});
    await this.cancelModelRefresh();await this.prepare();
    const result=await this.command(['logout']).finished;
    if(result.code!==0)throw commandError(result);
    this.account=null;this.identity=null;this.error=null;this.changed();
  }

  async run(prompt,{cwd,readOnly=false,outputSchema,timeoutMs,idleTimeoutMs,model,reasoningEffort}={}) {
    const selected=validateCatalogSettings(validateModelSettings({model,reasoningEffort}),this.modelCatalog);
    const limits=workerTimeLimits({reasoningEffort:selected.reasoningEffort,readOnly,timeoutMs,idleTimeoutMs});
    if(this.current)throw Error('Tài khoản đang làm một nhiệm vụ khác.');
    if(this.loginInfo)throw Error('Hoàn tất đăng nhập trước khi giao việc.');
    // Reserve before the first await; Stop must also cancel preparation.
    const marker={stopped:false,cancel:null,entry:null};const ticket=++this.runEpoch;
    this.current=marker;let runRoot;
    try {
      await this.prepare();
      if(ticket!==this.runEpoch || marker.stopped)throw Error('Nhiệm vụ đã dừng.');
      // Use the same stable CLI status check, even though this run is reserved.
      const statusEntry=this.command(['login','status']);marker.cancel=statusEntry.cancel;marker.entry=statusEntry;
      const status=await statusEntry.finished;
      if(status.code!==0 || !/logged in using chatgpt/i.test(status.stdout+'\n'+status.stderr))throw Error('Đăng nhập tài khoản ChatGPT trước khi giao việc.');
      if(ticket!==this.runEpoch || marker.stopped)throw Error('Nhiệm vụ đã dừng.');
      runRoot=await mkdtemp(path.join(this.home,'run-'));
      const output=path.join(runRoot,'result.txt');
      const args=['-a','never','exec','--model',selected.model,'-c',`model_reasoning_effort="${selected.reasoningEffort}"`,'--sandbox',readOnly?'read-only':'workspace-write','--cd',cwd,'--json','--color','never','--ephemeral','--output-last-message',output];
      if(outputSchema){const file=path.join(runRoot,'schema.json');await writeFile(file,JSON.stringify(outputSchema),{mode:0o600});args.push('--output-schema',file);}
      args.push('-');
      if(ticket!==this.runEpoch || marker.stopped)throw Error('Nhiệm vụ đã dừng.');
      let completed=false,failed=false,diagnostic='';const recentEvents=new Set();
      const entry=this.command(args,{cwd,input:String(prompt),...limits,onActivity:metadata=>this.emit('activity',{at:new Date().toISOString(),type:metadata.type}),onLine:(line,stream)=>{
        if(stream!=='stdout')return;
        let event;try {event=JSON.parse(line);} catch {return;}
        if(!event || typeof event!=='object' || Array.isArray(event))return;
        if(meaningfulCodexEvent(event)){
          const signature=createHash('sha256').update(line).digest('hex');
          if(!recentEvents.has(signature)){
            recentEvents.add(signature);if(recentEvents.size>256)recentEvents.delete(recentEvents.values().next().value);
            entry.touchActivity({type:event.type});
          }
        }
        if(event.type==='turn.completed')completed=true;
        if(event.type==='turn.failed'){failed=true;diagnostic=event.error?.message || 'Lượt Codex bị lỗi.';}
        if(event.type==='error')diagnostic=event.message || diagnostic;
        if(event.type==='item.completed' && event.item?.type==='agent_message')this.emit('progress',scrub(event.item.text).slice(0,1200));
        if(event.type==='item.started' && event.item?.type==='command_execution')this.emit('progress','Đang chạy: '+safeCommandLabel(event.item.command)+'.');
        if(event.type==='item.completed' && event.item?.type==='file_change' && Array.isArray(event.item.changes)){
          const files=event.item.changes.filter(change=>typeof change?.path==='string').slice(0,8).map(change=>scrub(change.path).replace(/\s+/g,' ').slice(0,160)).filter(Boolean);
          if(files.length)this.emit('progress','Đã sửa: '+files.join(', ')+(event.item.changes.length>8?', …':'')+'.');
        }
      }});
      marker.cancel=entry.cancel;marker.entry=entry;this.child=entry.child;
      if(ticket!==this.runEpoch || marker.stopped)entry.cancel(Error('Nhiệm vụ đã dừng.'));
      const result=await entry.finished;
      if(marker.stopped || ticket!==this.runEpoch)throw Error('Nhiệm vụ đã dừng.');
      if(result.code!==0 || !completed || failed)throw commandError({...result,stderr:diagnostic || result.stderr});
      let final='';
      try {if((await stat(output)).size<=1024*1024)final=(await readFile(output,'utf8')).trim();} catch {}
      if(!final)throw Error('Codex chưa có kết quả cuối cùng; nhiệm vụ chưa hoàn thành.');
      this.error=null;return final;
    } catch(error){this.error=scrub(error.message);this.changed();throw error;}
    finally {
      if(this.current===marker){this.current=null;this.child=null;}
      if(runRoot)await rm(runRoot,{recursive:true,force:true}).catch(()=>{});
    }
  }
  async interrupt() {
    this.runEpoch++;const marker=this.current;
    if(!marker)return;
    marker.stopped=true;marker.cancel?.(Error('Nhiệm vụ đã dừng.'));
    // Preparation has no child to wait for. Its epoch guard prevents a delayed
    // exec; an existing child must really exit before Stop reports completion.
    await marker.entry?.finished.catch(()=>{});
  }
  async close() {
    this.closed=true;this.runEpoch++;this.modelEpoch++;
    if(this.current)this.current.stopped=true;
    const pending=[...this.processes];
    for(const entry of pending)entry.cancel(Error('BMH Team đã đóng.'));
    this.loginProcess=null;this.loginInfo=null;
    await Promise.all(pending.map(entry=>entry.finished.catch(()=>{})));
  }
}
