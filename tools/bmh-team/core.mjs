import {EventEmitter} from 'node:events';
import {spawn, execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {mkdir, writeFile, access, readdir} from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const exec = promisify(execFile);
export const scrub = value => String(value || '').replace(/\b(?:sk-[\w-]{12,}|eyJ[\w-]{20,}\.[\w-]+\.[\w-]+)\b/g, '[ẩn thông tin đăng nhập]').replace(/((?:access_token|refresh_token|id_token|api_key|authorization)\s*[=:]\s*)[^\s,;}]+/gi, '$1[ẩn]').slice(0, 12000);

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
  if (!child?.pid) return;
  if (process.platform === 'win32') {
    const killer = spawn('taskkill.exe', ['/pid', String(child.pid), '/t', '/f'], {windowsHide:true, stdio:'ignore'});
    killer.on('error', () => child.kill());
  } else {
    try { process.kill(-child.pid, 'SIGTERM'); } catch { child.kill(); }
    const timer = setTimeout(() => {try {process.kill(-child.pid, 'SIGKILL');} catch {}}, 1500);
    timer.unref();
  }
}

export class CodexWorker extends EventEmitter {
  constructor({id,stateRoot,codex,spawnImpl=spawn}) {
    super(); this.id=id; this.stateRoot=stateRoot; this.codex=codex; this.spawnImpl=spawnImpl;
    this.account=null; this.loginInfo=null; this.error=null; this.child=null; this.pending=new Map(); this.serial=0; this.current=null; this.starting=null;this.runEpoch=0;
  }
  get publicState() {return {id:this.id, account:this.account, connected:Boolean(this.child && !this.child.killed), login:this.loginInfo,error:this.error};}
  changed() {this.emit('change', this.publicState);}
  async start() {
    if (this.child && !this.child.killed) return;
    if (this.starting) return this.starting;
    this.starting=this.initialize().finally(()=>{this.starting=null;});
    return this.starting;
  }
  async initialize() {
    if (!this.codex) throw Error('Chưa có Codex. Mở start.ps1 để cài công cụ chính thức.');
    const home = path.join(this.stateRoot, 'accounts', this.id);
    await mkdir(home, {recursive:true, mode:0o700});
    await writeFile(path.join(home,'config.toml'), 'forced_login_method = "chatgpt"\ncli_auth_credentials_store = "file"\n[analytics]\nenabled = false\n', {mode:0o600});
    const child=this.spawnImpl(this.codex.command,[...this.codex.prefix,'app-server','--listen','stdio://'], {
      cwd:home,env:isolatedEnvironment(home),stdio:['pipe','pipe','pipe'],windowsHide:true,detached:process.platform!=='win32'
    });
    this.child=child; let buffer='';
    child.stdout.setEncoding('utf8'); child.stderr.setEncoding('utf8');
    child.stdout.on('data',chunk=>{
      buffer+=chunk;
      if(buffer.length>16*1024*1024){this.fail(Error('Phản hồi Codex quá lớn.'));killTree(child);return;}
      let at;
      while((at=buffer.indexOf('\n'))>=0){const line=buffer.slice(0,at);buffer=buffer.slice(at+1);if(!line.trim())continue;try{this.receive(JSON.parse(line));}catch{}}
    });
    // Keep raw stderr out of the browser; it can contain provider or authentication data.
    child.stderr.on('data',()=>{});
    child.on('error',()=>{this.fail(Error('Không khởi động được Codex. Kiểm tra bản cài trên máy.'));});
    child.on('exit',()=>{if(this.child===child)this.child=null;this.fail(Error('Phiên Codex đã đóng. Đăng nhập lại nếu cần.'));});
    try {
      await this.rpc('initialize',{clientInfo:{name:'bmh_team',title:'BMH Team',version:'0.1.0'},capabilities:{experimentalApi:false}});
      this.notify('initialized'); await this.refreshAccount(); this.error=null; this.changed();
    } catch(e) {killTree(child);throw e;}
  }
  fail(error) {
    this.error=scrub(error.message);
    for(const entry of this.pending.values()){clearTimeout(entry.timer);entry.reject(error);}
    this.pending.clear();if(this.current){clearTimeout(this.current.timer);this.current.reject(error);}this.current=null;this.changed();
  }
  write(value) {
    if(!this.child?.stdin?.writable)throw Error('Phiên Codex chưa kết nối.');
    this.child.stdin.write(JSON.stringify(value)+'\n');
  }
  notify(method,params) {this.write({method,...(params ? {params} : {})});}
  rpc(method,params={},timeout=20000) {
    const id=++this.serial;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{this.pending.delete(id);reject(Error(`Codex chưa trả lời ${method}.`));},timeout);
      this.pending.set(id,{resolve,reject,timer});
      try{this.write({id,method,params});}catch(e){clearTimeout(timer);this.pending.delete(id);reject(e);}
    });
  }
  receive(message) {
    if(message.id!==undefined && !message.method){
      const pending=this.pending.get(message.id);if(!pending)return;
      clearTimeout(pending.timer);this.pending.delete(message.id);
      if(message.error)pending.reject(Error(`Codex từ chối yêu cầu (${message.error.code || 'protocol'}). Kiểm tra phiên đăng nhập, quyền workspace và phiên bản Codex.`));
      else pending.resolve(message.result);
      return;
    }
    if(message.id!==undefined && message.method){
      // Bounded jobs never accept escalated filesystem/network access or ask the user in the background.
      if(message.method==='item/permissions/requestApproval')this.write({id:message.id,result:{permissions:{},scope:'turn'}});
      else if(/requestApproval$/.test(message.method))this.write({id:message.id,result:{decision:'decline'}});
      else if(message.method==='item/tool/requestUserInput')this.write({id:message.id,result:{answers:{}}});
      else this.write({id:message.id,error:{code:-32601,message:'BMH Team does not support this client request.'}});
      this.emit('progress',`Codex yêu cầu thao tác ngoài phạm vi tự động: ${message.method}.`);
      return;
    }
    const p=message.params||{};
    if(message.method==='account/login/completed'){
      this.loginInfo=null;
      if(p.success){this.refreshAccount().catch(()=>{this.error='Đăng nhập xong nhưng chưa đọc được trạng thái tài khoản.';this.changed();});}
      else {this.error='Đăng nhập chưa hoàn tất. Mở lại liên kết chính thức và thử lại.';this.changed();}
    } else if(message.method==='account/updated')this.refreshAccount().catch(()=>{});
    else if(message.method==='windowsSandbox/setupCompleted'){
      this.error=p.success?null:'Chưa thiết lập được sandbox Windows. Xem yêu cầu quyền của Codex trên máy.';this.changed();
    }
    const current=this.current;
    if(!current || p.threadId!==current.threadId)return;
    if(message.method==='item/completed' && p.item?.type==='agentMessage'){
      if(p.item.phase==='final_answer' || !p.item.phase)current.output=p.item.text || '';
      else this.emit('progress',scrub(p.item.text).slice(0,700));
    }
    if(message.method==='item/started' && ['commandExecution','fileChange'].includes(p.item?.type))this.emit('progress',p.item.type==='fileChange'?'Đang chỉnh sửa file trong nhánh riêng.':'Đang chạy lệnh trong thư mục nhiệm vụ.');
    if(message.method==='turn/completed'){
      this.current=null;clearTimeout(current.timer);
      if(p.turn?.status==='completed'){
        const final=(p.turn.items||[]).filter(i=>i.type==='agentMessage' && (!i.phase||i.phase==='final_answer')).at(-1)?.text;
        current.resolve(final || current.output || '');
      } else current.reject(Error(p.turn?.status==='interrupted'?'Nhiệm vụ đã dừng.':'Codex chưa hoàn thành. Kiểm tra hạn mức, model và quyền của tài khoản này.'));
    }
  }
  async refreshAccount() {
    const result=await this.rpc('account/read',{refreshToken:false});
    this.account=result?.account?.type==='chatgpt'?{email:result.account.email,planType:result.account.planType}:null;
    this.changed();return this.account;
  }
  async login(device=false) {
    await this.start();
    if(this.loginInfo?.loginId)await this.rpc('account/login/cancel',{loginId:this.loginInfo.loginId}).catch(()=>{});
    const info=await this.rpc('account/login/start',device?{type:'chatgptDeviceCode'}:{type:'chatgpt',useHostedLoginSuccessPage:true,appBrand:'codex'},45000);
    for(const field of ['authUrl','verificationUrl'])if(info[field]){
      const url=new URL(info[field]);if(url.protocol!=='https:' || !['auth.openai.com','chatgpt.com','auth0.openai.com'].includes(url.hostname))throw Error('Codex trả về địa chỉ đăng nhập không được hỗ trợ.');
    }
    this.loginInfo=info;this.error=null;this.changed();return this.publicState;
  }
  async logout() {
    await this.start();if(this.current)throw Error('Dừng nhiệm vụ trước khi đăng xuất.');
    if(this.loginInfo?.loginId)await this.rpc('account/login/cancel',{loginId:this.loginInfo.loginId}).catch(()=>{});
    await this.rpc('account/logout');this.account=null;this.loginInfo=null;this.changed();
  }
  async setupWindows() {
    await this.start();await this.rpc('windowsSandbox/setupStart',{mode:'unelevated'},60000);
  }
  async run(prompt,{cwd,readOnly=false,outputSchema,timeoutMs=20*60*1000}={}) {
    const epoch=this.runEpoch;
    await this.start();if(epoch!==this.runEpoch)throw Error('Nhiệm vụ đã dừng.');if(this.current)throw Error('Tài khoản đang có nhiệm vụ khác.');
    if(!this.account)throw Error('Đăng nhập tài khoản ChatGPT trước.');
    const start=await this.rpc('thread/start',{cwd,approvalPolicy:'never',sandbox:readOnly?'read-only':'workspace-write',ephemeral:false,
      config:{'features.multi_agent':false},developerInstructions:'Work only within the assigned repository task. Do not spawn other agents, push or merge branches, call paid external APIs, or modify account settings. Preserve measured BMH drawing/3D/material/cost contracts. Report actual blockers; never claim success without completed work.'});
    if(epoch!==this.runEpoch)throw Error('Nhiệm vụ đã dừng.');
    const threadId=start.thread.id;
    return new Promise((resolve,reject)=>{
      const current={threadId,turnId:null,output:'',resolve,reject,timer:null};this.current=current;
      current.timer=setTimeout(()=>{if(this.current===current){this.interrupt().catch(()=>{});reject(Error('Nhiệm vụ vượt thời gian. Kết quả đang có được giữ lại để xem.'));}},timeoutMs);
      this.rpc('turn/start',{threadId,input:[{type:'text',text:prompt}],...(outputSchema?{outputSchema}:{})}).then(r=>{current.turnId=r.turn.id;}).catch(e=>{
        clearTimeout(current.timer);if(this.current===current)this.current=null;reject(e);
      });
    });
  }
  async interrupt() {
    this.runEpoch++;
    const current=this.current;
    if(!current){if(this.child){killTree(this.child);this.fail(Error('Nhiệm vụ đã dừng.'));this.child=null;}return;}
    if(current.turnId)await this.rpc('turn/interrupt',{threadId:current.threadId,turnId:current.turnId},5000).catch(()=>{});
    if(this.current===current){clearTimeout(current.timer);this.current=null;current.reject(Error('Nhiệm vụ đã dừng.'));killTree(this.child);this.child=null;this.changed();}
  }
  close() {this.runEpoch++;this.fail(Error('Đã đóng BMH Team.'));killTree(this.child);this.child=null;}
}
