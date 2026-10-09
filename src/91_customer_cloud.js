/* Team B evidence extensions. Keep the base dossier normalizer's allowlist,
 * then restore only these validated report/private-media fields by stable ID.
 * A's base normalizer predates these fields; no second evidence store. */
(()=>{
 const B=BMH,day=value=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(value||''))return '';const d=new Date(value+'T00:00:00Z');return Number.isFinite(d.getTime())&&d.toISOString().slice(0,10)===value?value:'';};
 B.teamBEvidenceReport=raw=>{
  if(!raw||typeof raw!=='object'||!['photo','inspection-note','defect','correction'].includes(raw.reportType)||!['open','reported-resolved'].includes(raw.reportStatus))return null;
  return {floor:Number.isInteger(raw.floor)&&raw.floor>=0?raw.floor:null,roomId:String(raw.roomId||'').slice(0,80),reportType:raw.reportType,reportStatus:raw.reportStatus,responsible:String(raw.responsible||'').slice(0,100),note:String(raw.note||'').slice(0,1000),observedAt:day(raw.observedAt),designRevision:String(raw.designRevision||'').slice(0,200),source:'user-report',engineeringAccepted:false};
 };
 B.restoreTeamBEvidenceFields=(rows,incoming)=>{
  const saved=new Map((Array.isArray(incoming)?incoming:[]).filter(x=>x&&typeof x==='object').map(x=>[x.id,x]));
  for(const row of rows||[]){const raw=saved.get(row.id);if(!raw)continue;
   const report=B.teamBEvidenceReport(raw.report);if(report)row.report=report;
   if(Array.isArray(raw.reportHistory))row.reportHistory=raw.reportHistory.slice(-20).flatMap(h=>{const r=B.teamBEvidenceReport(h);return r?[{at:String(h.at||'').slice(0,40),...r}]:[];});
   if(/^[0-9a-f-]{36}\/[0-9a-f-]{36}\/[A-Za-z0-9_-]{1,80}-[a-f0-9]{64}\.(jpg|png|webp|pdf)$/.test(raw.cloudKey||'')&&/^[a-f0-9]{64}$/.test(raw.cloudSha256||'')){
    for(const key of ['cloudKey','cloudSha256','cloudProjectId','uploadedAt'])row[key]=String(raw[key]||'').slice(0,280);
   }
  }
 };
 const normalize=B.normalizeState;B.normalizeState=()=>{const rows=structuredClone(B.state.project.dossier?.evidence||[]);const result=normalize();B.restoreTeamBEvidenceFields(B.state.project.dossier.evidence,rows);return result;};
 // Initial load already ran the older normalizer before this script executes.
 // Recover extensions only from the exact snapshot it selected, never another project.
 if(B.localStateLoaded&&typeof localStorage!=='undefined')for(const key of [B.STORAGE_KEY,...(B.LEGACY_STORAGE_KEYS||[])]){
  try{const raw=JSON.parse(localStorage.getItem(key)||'null');if(raw?.meta?.savedAt===B.state.meta.savedAt&&String(raw.meta.localProjectId||'')===String(B.state.meta.localProjectId||'')){B.restoreTeamBEvidenceFields(B.state.project.dossier.evidence,raw.project?.dossier?.evidence);break;}}catch(_){}
 }
})();

/* Project-scoped local media keys. Legacy bytes are claimed atomically by the
 * first project that actually references them; duplicate imported IDs cannot
 * read a different project's new bytes. Copies explicitly copy local media. */
(()=>{
 const B=BMH,get=B.evidenceGet,put=B.evidencePut,remove=B.evidenceRemoveBytes;
 B.projectMediaScope=async()=>{
  const project=B.state.project;let id=B.state.meta.localProjectId||B.projects?.activeId;
  if(!id&&B.saveCustomerProject)id=await B.saveCustomerProject();
  if(!id||B.state.project!==project)throw Error('Dự án đã đổi hoặc chưa lưu được trên thiết bị.');
  return String(id);
 };
 B.projectMediaKey=(scope,id)=>'project:'+scope+':'+id;
 B.evidencePut=async(id,blob)=>put(B.projectMediaKey(await B.projectMediaScope(),id),blob);
 B.evidenceGet=async id=>{
  const project=B.state.project,scope=await B.projectMediaScope(),key=B.projectMediaKey(scope,id),local=await get(key);
  if(B.state.project!==project)throw Error('Dự án đã đổi.');if(local)return local;
  if(![...(project.dossier.evidence||[]),...(project.sourceRefs||[])].some(r=>r.id===id))return null;
  const db=await B.evidenceDb();
  return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite'),store=tx.objectStore('files'),claimId='legacy-claim:'+id,claim=store.get(claimId);let blob=null;
   claim.onsuccess=()=>{if(claim.result&&claim.result.projectId!==scope)return;const request=store.get(id);request.onsuccess=()=>{if(!request.result?.blob)return;blob=request.result.blob;store.put({id:claimId,projectId:scope});store.put({id:key,blob});};};
   tx.oncomplete=()=>B.state.project===project?resolve(blob):reject(Error('Dự án đã đổi.'));tx.onabort=()=>reject(Error('Không khôi phục được tệp cũ.'));tx.onerror=()=>{};
  });
 };
 B.evidenceRemoveBytes=async id=>remove(B.projectMediaKey(await B.projectMediaScope(),id));
 if(B.newCustomerProject){const create=B.newCustomerProject;B.newCustomerProject=async options=>{
  const copyId=options?.copyId,source=copyId?await B.projectGet(copyId):null,ids=source?[...(source.state.project.dossier.evidence||[]),...(source.state.project.sourceRefs||[])].map(r=>r.id):[],media=[];
  for(const id of ids){const blob=await get(B.projectMediaKey(copyId,id));const image=await B.styleReferenceStore?.get(id,{scope:copyId,legacy:false});if(blob||image)media.push({id,blob,image});}
  const scope=await create(options);for(const row of media){if(row.blob)await put(B.projectMediaKey(scope,row.id),row.blob);if(row.image)await B.styleReferenceStore.put(row.id,row.image,{scope});}return scope;
 };}
})();

/* Optional customer account. Local design, cloud receipts and AI allowance are separate. */
(()=>{
 const B=BMH,c=B.cloud,esc=B.esc;
 Object.assign(c,{verified:false,epoch:0,mode:'signin',writeTail:Promise.resolve(),refreshPromise:null,usage:null,lastDesign:'',conflict:null});
 const owner=()=>c.verified?String(c.user?.id||''):'';
 const design=()=>JSON.stringify(B.state.project);
 const current=(ref,id,user,epoch)=>B.state===ref&&B.projects.activeId===id&&owner()===user&&c.epoch===epoch;
 B.clearCloudLink=state=>Object.assign(state.meta,{cloudProjectId:'',cloudOwnerId:'',cloudRevision:null,cloudUpdatedAt:null});
 const linked=()=>!!(owner()&&B.state.meta.cloudOwnerId===owner()&&B.state.meta.cloudProjectId);
 B.restoreCloudLink=()=>{
  clearTimeout(c.saveTimer);c.activeProjectId=linked()?B.state.meta.cloudProjectId:'';c.lastDesign=design();c.conflict=null;c.error='';c.syncStatus=c.activeProjectId?'linked':'local';
  try{localStorage.removeItem(B.CLOUD_ACTIVE_KEY);}catch(_){}
 };
 const restore=B.restoreProjectRuntime;B.restoreProjectRuntime=()=>{restore();B.restoreCloudLink();};
 B.cloudOverlay=()=>'';
 B.cloudFetchRaw=async(path,opts={})=>{
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),30000),options={method:opts.method||'GET',signal:ctl.signal,headers:{'Content-Type':'application/json',...(opts.headers||{})}};
  if(opts.auth&&c.session?.access_token)options.headers.Authorization='Bearer '+c.session.access_token;
  if(opts.body!==undefined)options.body=JSON.stringify(opts.body);
  try{const r=await fetch(path,options),data=await r.json().catch(()=>({}));return {r,data};}finally{clearTimeout(timer);}
 };
 B.refreshCloudSession=()=>{
  if(c.refreshPromise)return c.refreshPromise;
  const token=c.session?.refresh_token,epoch=c.epoch,user=String(c.session?.user?.id||'');if(!token)return Promise.resolve(false);
  const run=(async()=>{
   let out;try{out=await B.cloudFetchRaw('/api/auth',{method:'POST',body:{action:'refresh',refresh_token:token}});}catch(_){return false;}
   if(c.epoch!==epoch||c.session?.refresh_token!==token)return false;
   const session=out.r.ok?B.cloudSessionData(out.data):null;
   if(!session||!session.user?.id||(user&&String(session.user.id)!==user)){if([400,401,403].includes(out.r.status)){B.persistCloudSession(null);c.verified=false;c.epoch++;B.restoreCloudLink();}return false;}
   B.persistCloudSession(session);c.verified=true;return true;
  })();c.refreshPromise=run;run.finally(()=>{if(c.refreshPromise===run)c.refreshPromise=null;});return run;
 };
 B.cloudApi=async(path,opts={})=>{
  const epoch=c.epoch;let out=await B.cloudFetchRaw(path,opts);
  if(out.r.status===401&&opts.auth&&opts.retry!==false&&await B.refreshCloudSession()&&c.epoch===epoch)out=await B.cloudFetchRaw(path,{...opts,retry:false});
  if(opts.auth&&c.epoch!==epoch)throw new Error('Tài khoản đã thay đổi. Yêu cầu cũ đã dừng.');
  if(!out.r.ok)throw Object.assign(new Error(out.data.error||'Chưa kết nối được. Hãy thử lại.'),{status:out.r.status,code:out.data.code,project:out.data.project});
  return out.data;
 };
 const statusText=()=>({local:'Chỉ lưu trên thiết bị',linked:'Đã liên kết · sẽ kiểm tra khi lưu',pending:'Có thay đổi chờ đồng bộ',saving:'Đang lưu lên máy chủ…',synced:'Đã đồng bộ',error:'Chưa đồng bộ · bản trên máy vẫn được giữ',conflict:'Thiết bị khác đã sửa · cần chọn cách lưu'})[c.syncStatus]||'Chỉ lưu trên thiết bị';
 const accountHtml=()=>{
  const configured=c.config?.cloudConfigured,logged=!!owner(),disabled=c.loading?'disabled':'',messages=(c.error?'<p class="customer-cloud-alert bad" role="alert">'+esc(c.error)+'</p>':'')+(c.message?'<p class="customer-cloud-alert good" role="status">'+esc(c.message)+'</p>':'');
  let content;
  if(!configured)content='<div class="customer-cloud-empty"><h3>Giữ thiết kế để mở trên máy khác</h3><p>Dịch vụ đồng bộ tài khoản chưa được mở. Tải bản sao JSON rồi mở tệp đó trên thiết bị mới để tiếp tục.</p><button class="clay" data-cloud-backup>Tải bản sao thiết kế</button></div>';
  else if(!logged||c.mode==='password'){
   const mode=c.mode,recover=mode==='recover',password=mode==='password',signup=mode==='signup';
   content='<form id="customerCloudAuth"><h3>'+esc(password?'Đặt mật khẩu mới':recover?'Lấy lại mật khẩu':signup?'Tạo tài khoản':'Đăng nhập để lưu nhiều thiết bị')+'</h3>'+(!password?'<label>Email<input name="email" id="cloudEmail" type="email" autocomplete="email" maxlength="254" required></label>':'')+(!recover?'<label>Mật khẩu<input name="password" id="cloudPassword" type="password" autocomplete="'+(signup||password?'new-password':'current-password')+'" minlength="8" maxlength="128" required><small>Từ 8 đến 128 ký tự</small></label>':'')+'<button class="clay" type="submit" '+disabled+'>'+(c.loading?'Đang xử lý…':password?'Lưu mật khẩu':recover?'Gửi liên kết đặt lại':signup?'Tạo tài khoản':'Đăng nhập')+'</button></form><div class="customer-cloud-links">'+(mode!=='signin'?'<button data-customer-auth-mode="signin">Quay lại đăng nhập</button>':'<button data-customer-auth-mode="signup">Chưa có tài khoản?</button><button data-customer-auth-mode="recover">Quên mật khẩu?</button>')+'</div>';
  }else{
   const rows=c.projects.map(p=>'<article><div><b>'+esc(p.name||'Ngôi nhà của mình')+'</b><small>Phiên bản '+Number(p.revision)+' · '+esc(new Date(p.updated_at).toLocaleString('vi-VN'))+'</small></div>'+(c.deleteId===p.id?'<div class="customer-cloud-delete-confirm"><small>Xóa bản trên tài khoản? Bản trên thiết bị được giữ.</small><button data-customer-cloud-delete-confirm="'+esc(p.id)+'" '+disabled+'>Xóa bản này</button><button data-customer-cloud-delete-cancel>Giữ lại</button></div>':'<button data-cloud-load="'+esc(p.id)+'" '+disabled+'>Mở</button><details class="customer-cloud-row-tools"><summary aria-label="Thao tác với '+esc(p.name)+'">⋯</summary><button data-customer-cloud-delete="'+esc(p.id)+'" '+disabled+'>Xóa bản trên tài khoản</button></details>')+'</article>').join('');
   const usage=c.usage?'<details class="customer-ai-usage"><summary>Lượt AI · còn '+Number(c.usage.remaining)+' / '+Number(c.usage.limit)+'</summary><span>'+Number(c.usage.used)+' đã dùng'+(c.usage.pending?' · '+Number(c.usage.pending)+' đang xử lý':'')+'</span><small>Đặt lại '+esc(new Date(c.usage.resetAt).toLocaleString('vi-VN'))+'. Tác vụ dùng kết quả có sẵn không trừ lượt.</small></details>':'';
   content='<div class="customer-cloud-user"><span>'+esc(c.user.email||'Tài khoản của tôi')+'</span><button data-cloud-logout '+disabled+'>Đăng xuất</button></div><section class="customer-cloud-sync"><b>'+esc(B.state.project.name)+'</b><p role="status" data-customer-cloud-status>'+esc(statusText())+'</p>'+usage+(c.syncStatus==='conflict'?'<div class="customer-cloud-conflict"><p>Bản trên máy này chưa bị thay đổi. Lưu thành bản riêng để giữ cả hai phương án, hoặc tải bản mới từ máy chủ. Khi tải bản mới, phương án trên máy được giữ thành một bản sao.</p><button class="clay" data-cloud-save-copy '+disabled+'>Giữ thành bản riêng</button><button data-cloud-conflict-load '+disabled+'>Tải bản mới từ máy chủ</button></div>':'<button class="clay" data-cloud-save-now '+disabled+'>'+(c.loading?'Đang xử lý…':c.syncStatus==='error'?'Thử đồng bộ lại':'Lưu thiết kế đang mở')+'</button>')+'</section><details class="customer-cloud-list" '+(c.projects.length?'open':'')+'><summary>Thiết kế trên tài khoản ('+c.projects.length+')</summary><button data-cloud-refresh '+disabled+'>Làm mới danh sách</button>'+ (rows||'<p>Chưa có thiết kế được lưu lên tài khoản.</p>')+'</details>';
  }
  return '<header><div><small>BUILD MY HOME</small><h2 id="customerCloudTitle">Lưu nhiều thiết bị</h2><p>Tài khoản tùy chọn để giữ và mở thiết kế trên máy khác.</p></div><button data-cloud-close aria-label="Đóng">×</button></header>'+messages+content+'<footer>Ảnh và tệp hiện trường lưu riêng trên thiết bị. Bản sao JSON là cách giữ thêm một bản thiết kế.</footer>';
 };
 const saveStatus=B.projectSaveStatus;B.projectSaveStatus=()=>{saveStatus();const node=document.querySelector('.guided-footer>span');if(node&&linked()&&!B.projects.error){if(c.syncStatus==='conflict'||c.syncStatus==='error'){node.textContent+=' · '+(c.syncStatus==='conflict'?'Thiết bị khác đã sửa.':'Chưa đồng bộ.')+' Mở Dự án để xử lý.';node.dataset.state='error';}else if(c.syncStatus==='pending'||c.syncStatus==='saving')node.textContent+=' · Đang chờ đồng bộ…';else if(c.syncStatus==='synced')node.textContent+=' · Đã đồng bộ.';}};
 B.paintCustomerCloud=()=>{B.projectSaveStatus();const dialog=B.$('#customerCloud');if(!dialog?.open)return;dialog.innerHTML=accountHtml();};
 B.openCloud=()=>{
  B.closeProjectLibrary();c.focus=document.activeElement;c.open=true;c.error='';c.message='';
  let dialog=B.$('#customerCloud');if(!dialog){dialog=document.createElement('dialog');dialog.id='customerCloud';dialog.className='customer-cloud-dialog';dialog.setAttribute('aria-labelledby','customerCloudTitle');document.body.appendChild(dialog);dialog.addEventListener('close',()=>{c.open=false;c.focus?.focus?.();});}
  dialog.innerHTML=accountHtml();dialog.showModal();if(owner())Promise.all([B.cloudLoadProjects(),B.cloudLoadUsage()]).catch(()=>{});
 };
 B.closeCloud=()=>{c.open=false;B.$('#customerCloud')?.close();};
 B.cloudAuth=async action=>{
  if(c.loading)return;const email=B.$('#cloudEmail')?.value||'',password=B.$('#cloudPassword')?.value||'',epoch=c.epoch;
  c.loading=true;c.error='';c.message='';B.paintCustomerCloud();
  try{
   const data=await B.cloudApi('/api/auth',{method:'POST',auth:action==='password',body:{action,email,password}});if(c.epoch!==epoch)return;
   if(action==='recover'){c.message=data.message;c.mode='signin';}
   else if(action==='password'){c.mode='signin';c.message='Đã đổi mật khẩu.';}
   else {const session=B.cloudSessionData(data);if(session){if(!session.user?.id)throw new Error('Chưa xác nhận được tài khoản.');B.persistCloudSession(session);c.verified=true;c.epoch++;B.restoreCloudLink();c.message='Đã đăng nhập.';await Promise.all([B.cloudLoadProjects(false),B.cloudLoadUsage(false)]);}else{c.mode='signin';c.message='Hãy kiểm tra email xác nhận rồi đăng nhập.';}}
  }catch(err){c.error=err.message;}finally{c.loading=false;B.paintCustomerCloud();B.paintProjectLibrary();}
 };
 B.cloudLogout=async()=>{
  const token=c.session?.access_token;B.persistCloudSession(null);c.verified=false;c.epoch++;c.projects=[];c.usage=null;c.refreshPromise=null;c.deleteId='';B.restoreCloudLink();c.mode='signin';c.message='Đã đăng xuất. Thiết kế trên máy vẫn được giữ.';B.paintCustomerCloud();B.paintProjectLibrary();
  if(token)try{await B.cloudFetchRaw('/api/auth',{method:'POST',headers:{Authorization:'Bearer '+token},body:{action:'logout'}});}catch(_){}
 };
 B.cloudLoadProjects=async(paint=true)=>{
  if(!owner()||!c.config?.cloudConfigured)return;const user=owner(),epoch=c.epoch;
  try{const data=await B.cloudApi('/api/projects',{auth:true});if(user===owner()&&epoch===c.epoch)c.projects=data.projects||[];}catch(err){if(epoch===c.epoch)c.error=err.message;}
  if(paint)B.paintCustomerCloud();
 };
 B.cloudLoadUsage=async(paint=true)=>{
  if(!owner()||!c.config?.aiUsage?.enabled)return;const epoch=c.epoch;
  try{const data=await B.cloudApi('/api/ai?operation=usage',{auth:true});if(epoch===c.epoch)c.usage=data.usage;}catch(err){if(epoch===c.epoch)c.usage=null;}
  if(paint)B.paintCustomerCloud();
 };
 const pendingKey=(user,id)=>'cloud-request:'+user+':'+id;
 const pendingGet=key=>B.projectTransaction(['settings'],'readonly',(tx,result)=>{const r=tx.objectStore('settings').get(key);r.onsuccess=()=>result(r.result?.value||null);});
 const pendingPut=(key,value)=>B.projectTransaction(['settings'],'readwrite',tx=>value?tx.objectStore('settings').put({key,value}):tx.objectStore('settings').delete(key));
 B.cloudStatePayload=()=>{const snap=B.projectSnapshot(B.state);snap.meta={createdAt:snap.meta.createdAt,savedAt:snap.meta.savedAt};return snap;};
 B.cloudSaveProject=({createIfMissing=false}={})=>{
  const ref=B.state,user=owner(),epoch=c.epoch;
  const run=async()=>{
   if(!user||!c.config?.cloudConfigured||owner()!==user||c.epoch!==epoch||B.state!==ref)return false;
   if(c.syncStatus==='conflict'||(!linked()&&!createIfMissing))return false;
   const id=await B.saveCustomerProject();if(!current(ref,id,user,epoch))return false;
   const key=pendingKey(user,id);let pending=await pendingGet(key);
   if(!pending){
    pending={body:{id:linked()?ref.meta.cloudProjectId:B.newCloudId(),requestId:B.newCloudId(),expectedRevision:linked()?ref.meta.cloudRevision:null,name:ref.project.name,version:B.VERSION,state:B.cloudStatePayload()},fingerprint:design()};
    await pendingPut(key,pending);
   }
   if(!current(ref,id,user,epoch))return false;c.syncStatus='saving';B.paintCustomerCloud();
   try{
    const data=await B.cloudApi('/api/projects',{method:'POST',auth:true,body:pending.body});
    if(!current(ref,id,user,epoch))return false;
    const p=data.project;if(!p?.id||!Number.isSafeInteger(p.revision)||p.revision<1)throw new Error('Chưa nhận được xác nhận lưu hợp lệ. Hãy thử lại.');
    Object.assign(ref.meta,{cloudProjectId:p.id,cloudOwnerId:user,cloudRevision:p.revision,cloudUpdatedAt:p.updated_at});c.activeProjectId=p.id;c.lastDesign=pending.fingerprint;c.lastSyncedAt=p.updated_at;c.error='';c.conflict=null;
    // Save the receipt before clearing the durable request. Lost acknowledgements replay safely.
    B.projects.dirty=true;await B.saveCustomerProject();await pendingPut(key,null);
    if(!current(ref,id,user,epoch))return false;
    c.syncStatus=design()===pending.fingerprint?'synced':'pending';
    const i=c.projects.findIndex(x=>x.id===p.id);if(i>=0)c.projects[i]=p;else c.projects.unshift(p);
    if(c.syncStatus==='pending')B.queueCloudSave();B.paintCustomerCloud();return true;
   }catch(err){
    if(current(ref,id,user,epoch)){c.error=err.name==='AbortError'?'Kết nối quá lâu. Bản trên máy được giữ; bấm thử lại để kiểm tra lần lưu.':err.message;c.syncStatus=err.code==='PROJECT_CONFLICT'?'conflict':'error';c.conflict=err.code==='PROJECT_CONFLICT'?{id:pending.body.id,project:err.project}:null;
     if(err.status>=400&&err.status<500)await pendingPut(key,null);B.paintCustomerCloud();}
    return false;
   }
  };
  const next=c.writeTail.catch(()=>{}).then(run).catch(err=>{if(B.state===ref&&c.epoch===epoch){c.error=err.message;c.syncStatus='error';B.paintCustomerCloud();}return false;});c.writeTail=next;return next;
 };
 B.queueCloudSave=()=>{
  if(c.suppressSave||!owner()||!linked()||!c.config?.cloudConfigured||['error','conflict'].includes(c.syncStatus)||design()===c.lastDesign)return;
  c.syncStatus='pending';clearTimeout(c.saveTimer);c.saveTimer=setTimeout(()=>B.cloudSaveProject(),1600);
 };
 B.cloudSaveNow=async()=>{if(c.loading)return;c.loading=true;c.error='';c.message='';B.paintCustomerCloud();try{const ok=await B.cloudSaveProject({createIfMissing:true});if(ok)c.message=c.syncStatus==='synced'?'Thiết kế đã được lưu lên tài khoản.':'Đã lưu bản trước; đang đồng bộ thay đổi mới.';}finally{c.loading=false;B.paintCustomerCloud();B.paintProjectLibrary();}};
 B.cloudSaveCopy=async()=>{
  if(c.loading)return;const user=owner(),id=await B.saveCustomerProject();await pendingPut(pendingKey(user,id),null);B.clearCloudLink(B.state);B.restoreCloudLink();B.projects.dirty=true;await B.saveCustomerProject();return B.cloudSaveNow();
 };
 B.cloudLoadProject=async(id,{preserveDraft=false}={})=>{
  if(c.loading||B.projects.actionBusy)return;
  if(B.v6?.briefLoading||B.v6?.uploadBusy||B.v6?.feng?.loading||B.v6?.bankRateLoading||B.ai?.loading||B.scan?.busy||B.cinematicRender?.loading||B.state.project.siteIntelligence?.status==='loading'){c.error='Hãy chờ tác vụ đang chạy hoàn tất trước khi mở thiết kế khác.';B.paintCustomerCloud();return;}
  c.loading=true;c.error='';const ref=B.state,user=owner(),epoch=c.epoch;B.paintCustomerCloud();
  try{
   await B.saveCustomerProject();const data=await B.cloudApi('/api/projects?id='+encodeURIComponent(id),{auth:true});if(B.state!==ref||owner()!==user||c.epoch!==epoch)return;
   const p=data.project;if(!p?.state||!Number.isSafeInteger(p.revision))throw new Error('Không tìm thấy thiết kế trên tài khoản.');
   // Always preserve a differing local draft before replacing its linked copy.
   const rows=await B.projectList(),existing=rows.find(x=>x.cloudProjectId===id&&x.cloudOwnerId===user),record=existing?await B.projectGet(existing.id):null;
   if(record&&(preserveDraft||JSON.stringify(record.state.project)!==JSON.stringify(p.state.project))){const copy=B.projectSnapshot(record.state),copyId=B.newCloudId();B.clearCloudLink(copy);copy.meta.localProjectId=copyId;copy.project.name=String(copy.project.name).slice(0,100)+' · bản trước đồng bộ';copy.meta.savedAt=copy.meta.createdAt=new Date().toISOString();await B.projectEnqueue(()=>B.projectTransaction(['designs','summaries'],'readwrite',tx=>{tx.objectStore('designs').put({id:copyId,state:copy});tx.objectStore('summaries').put(B.projectSummary(copy,copyId));}));}
   if(B.state!==ref||owner()!==user||c.epoch!==epoch)return;
   const localId=existing?.id||B.newCloudId(),state=B.mergeState(B.defaultState(),p.state);Object.assign(state.meta,{localProjectId:localId,cloudProjectId:p.id,cloudOwnerId:user,cloudRevision:p.revision,cloudUpdatedAt:p.updated_at,savedAt:new Date().toISOString()});
   await pendingPut(pendingKey(user,localId),null);await B.projectEnqueue(()=>B.projectPut(state,localId));if(B.state!==ref||owner()!==user||c.epoch!==epoch)return;B.useCustomerProject({id:localId,state});await B.projects.activation;B.closeCloud();B.toast('Đã mở '+p.name+'.');
  }catch(err){c.error=err.message;}finally{c.loading=false;B.paintCustomerCloud();}
 };
 // Rechecking obsolete payOS entitlement is independent of customer design access.
 const entitlement=B.refreshEntitlement;B.refreshEntitlement=(render=true)=>c.config?.paymentConfigured?entitlement(render):Promise.resolve(false);
 B.cloudDeleteProject=async id=>{
  if(c.loading)return;const p=c.projects.find(p=>p.id===id),epoch=c.epoch;if(!p)return;c.loading=true;c.error='';B.paintCustomerCloud();
  try{await B.cloudApi('/api/projects?id='+encodeURIComponent(id)+'&revision='+p.revision,{method:'DELETE',auth:true});if(c.epoch!==epoch)return;c.projects=c.projects.filter(x=>x.id!==id);c.deleteId='';if(B.state.meta.cloudProjectId===id&&B.state.meta.cloudOwnerId===owner()){B.clearCloudLink(B.state);B.restoreCloudLink();B.projects.dirty=true;await B.saveCustomerProject();}c.message='Đã xóa bản trên tài khoản. Thiết kế trên thiết bị vẫn được giữ.';}catch(err){c.error=err.message;}finally{c.loading=false;B.paintCustomerCloud();B.paintProjectLibrary();}
 };
 const library=B.projectLibraryHtml;B.projectLibraryHtml=()=>library().replace('<div class="customer-project-tools">','<section class="customer-project-account"><div><b>'+(owner()?esc(c.user.email):'Lưu nhiều thiết bị')+'</b><small>'+(owner()?esc(statusText()):'Tài khoản tùy chọn · thiết kế vẫn lưu trên máy')+'</small></div><button data-cloud-open>'+(owner()?'Mở tài khoản':'Tài khoản & đồng bộ')+'</button></section><div class="customer-project-tools">');
 document.addEventListener('submit',e=>{if(e.target.id!=='customerCloudAuth')return;e.preventDefault();B.cloudAuth(c.mode);});
 document.addEventListener('click',e=>{
  // The main shell deliberately ignores native dialogs outside #app.
  if(!e.target.closest?.('#app')){
   if(e.target.closest?.('[data-cloud-open]')){e.preventDefault();B.openCloud();return;}
   if(e.target.closest?.('[data-cloud-close]')){B.closeCloud();return;}
   if(e.target.closest?.('[data-cloud-logout]')){B.cloudLogout();return;}
   if(e.target.closest?.('[data-cloud-save-now]')){B.cloudSaveNow();return;}
   if(e.target.closest?.('[data-cloud-refresh]')){B.cloudLoadProjects();return;}
   const load=e.target.closest?.('[data-cloud-load]');if(load){B.cloudLoadProject(load.dataset.cloudLoad);return;}
  }
  const del=e.target.closest?.('[data-customer-cloud-delete]');if(del){c.deleteId=del.dataset.customerCloudDelete;B.paintCustomerCloud();return;}
  if(e.target.closest?.('[data-customer-cloud-delete-cancel]')){c.deleteId='';B.paintCustomerCloud();return;}
  const confirmed=e.target.closest?.('[data-customer-cloud-delete-confirm]');if(confirmed){B.cloudDeleteProject(confirmed.dataset.customerCloudDeleteConfirm);return;}
  const mode=e.target.closest?.('[data-customer-auth-mode]');if(mode){c.mode=mode.dataset.customerAuthMode;c.error='';c.message='';B.paintCustomerCloud();}
  if(e.target.closest?.('[data-cloud-backup]'))B.exportProjectJson();
  if(e.target.closest?.('[data-cloud-save-copy]'))B.cloudSaveCopy().catch(err=>{c.error=err.message;B.paintCustomerCloud();});
  if(e.target.closest?.('[data-cloud-conflict-load]')&&c.conflict)B.cloudLoadProject(c.conflict.id,{preserveDraft:true});
 });
 B.aiFetch=async(url,options={})=>{
  const u=new URL(url,location.href);if(u.origin!==location.origin||!/^\/api\/(ai|bank-rate|gemini-scan|gemini-render|gemini-upload-start|gemini-file-status|material-search|material-catalog)$/.test(u.pathname))return fetch(url,options);
  const epoch=c.epoch,headers=new Headers(options.headers||{});headers.set('X-BMH-AI-Request-Id',B.newCloudId());if(c.session?.access_token&&c.verified)headers.set('Authorization','Bearer '+c.session.access_token);
  let response=await fetch(url,{...options,headers});
  if(epoch!==c.epoch)return new Response(JSON.stringify({error:'Tài khoản đã thay đổi. Kết quả yêu cầu cũ đã được bỏ qua.'}),{status:409,headers:{'Content-Type':'application/json'}});
  if(response.status===401&&c.verified&&await B.refreshCloudSession()){headers.set('Authorization','Bearer '+c.session.access_token);response=await fetch(url,{...options,headers});}
  if(epoch!==c.epoch)return new Response(JSON.stringify({error:'Tài khoản đã thay đổi. Kết quả yêu cầu cũ đã được bỏ qua.'}),{status:409,headers:{'Content-Type':'application/json'}});
  if([401,429].includes(response.status)&&c.config?.aiUsage?.enabled){const data=await response.clone().json().catch(()=>({}));if(data.code==='AI_LOGIN_REQUIRED'){c.message='Đăng nhập để sử dụng lượt AI của tài khoản.';B.openCloud();}}
  if(c.config?.aiUsage?.enabled)B.cloudLoadUsage().catch(()=>{});return response;
 };
 B.customerCloudReady=(async()=>{
  await B.projects.ready;
  // cloudInit was started by the original shell before this final module loaded.
  if(!c.config){try{const {r,data}=await B.cloudFetchRaw('/api/config');c.config=r.ok?data:{cloudConfigured:false};}catch(_){c.config={cloudConfigured:false};}}
  const fragment=new URLSearchParams(location.hash.slice(1)),access=fragment.get('access_token'),refresh=fragment.get('refresh_token'),recovery=fragment.get('type')==='recovery';
  if(access||fragment.has('error'))history.replaceState({},'',location.pathname+location.search);
  if(!c.config.cloudConfigured){B.restoreCloudLink();return;}
  if(access)B.persistCloudSession({access_token:access,refresh_token:refresh||'',expires_at:Date.now()/1000+Number(fragment.get('expires_in')||3600),user:null});
  if(c.session?.access_token){
   const epoch=c.epoch;try{const data=await B.cloudApi('/api/auth',{method:'POST',auth:true,body:{action:'session'}});if(c.epoch!==epoch)return;B.persistCloudSession({...c.session,user:data.user});c.verified=true;B.restoreCloudLink();await Promise.all([B.cloudLoadProjects(false),B.cloudLoadUsage(false)]);if(recovery){c.mode='password';B.openCloud();}}
   catch(err){if(c.epoch===epoch){c.verified=false;c.error=err.message;B.restoreCloudLink();}}
  }
  B.paintProjectLibrary();
 })();
})();

/* Team B / B5: opt-in private evidence transfer, backed by the existing project
 * revision. A failed upload never deletes local bytes or changes entitlement. */
(()=>{
 const B=BMH,c=B.cloud;
 const same=(project,epoch,id)=>B.state.project===project&&c.epoch===epoch&&B.state.meta.cloudProjectId===id;
 const refs=p=>[...(p.dossier.evidence||[]),...(p.sourceRefs||[])];
 const dataUrl=blob=>new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(Error('Không đọc được tệp.'));reader.readAsDataURL(blob);});
 B.uploadProjectEvidence=async id=>{
  const project=B.state.project,epoch=c.epoch,projectId=B.state.meta.cloudProjectId,record=refs(project).find(r=>r.id===id);
  if(!record)throw Error('Tệp không còn trong dự án.');
  if(!c.verified||!c.config?.mediaConfigured||!projectId||B.state.meta.cloudOwnerId!==c.user?.id)throw Error('Lưu dự án lên tài khoản và mở kho tệp trước.');
  if(c.syncStatus==='conflict')throw Error('Xử lý xung đột thiết kế trước khi tải tệp.');
  if(!await B.cloudSaveProject({createIfMissing:false}))throw Error(c.error||'Chưa đồng bộ thiết kế.');
  if(!same(project,epoch,projectId))throw Error('Dự án / tài khoản đã đổi.');
  let blob=await B.evidenceGet(id);
  if(!blob&&B.styleReferenceStore){const preview=await B.styleReferenceStore.get(id);if(preview)blob=await (await fetch(preview)).blob();}
  if(!blob)throw Error('Tệp gốc chưa có trên thiết bị này.');
  if(blob.size>2*1024*1024)throw Error('Tệp đồng bộ tối đa 2 MB. Giữ bản gốc trong ZIP; dùng ảnh thu nhỏ hoặc PDF nhỏ hơn.');
  const base64=String(await dataUrl(blob)).split(',')[1];
  const result=await B.cloudApi('/api/projects?operation=media',{method:'POST',auth:true,body:{projectId,evidenceId:id,expectedRevision:B.state.meta.cloudRevision,type:blob.type,base64}});
  if(!same(project,epoch,projectId)||!refs(project).includes(record))throw Error('Dự án / tệp đã đổi; kết quả cũ không áp dụng.');
  Object.assign(record,result.file);B.save();const saved=await B.cloudSaveProject({createIfMissing:false});
  if(!saved)throw Error('Bytes đã tải; metadata chưa đồng bộ. Bản trên máy còn nguyên. Thử lưu dự án lại.');
  return result.file;
 };
 const get=B.evidenceGet;B.evidenceGet=async id=>{
  const local=await get(id);if(local)return local;
  const project=B.state.project,epoch=c.epoch,projectId=B.state.meta.cloudProjectId,record=refs(project).find(r=>r.id===id);
  if(!record?.cloudKey||record.cloudProjectId!==projectId||!c.verified||!c.config?.mediaConfigured)return null;
  const result=await B.cloudApi('/api/projects?operation=media&projectId='+encodeURIComponent(projectId)+'&evidenceId='+encodeURIComponent(id),{auth:true});
  const response=await fetch(result.url);if(!response.ok)throw Error('Không tải được tệp từ tài khoản.');const blob=await response.blob();
  if(blob.size>2*1024*1024)throw Error('Tệp tải về vượt dung lượng cho phép.');
  if(result.sha256){const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await blob.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join('');if(hash!==result.sha256)throw Error('Tệp tải về không khớp bản đã lưu.');}
  if(!same(project,epoch,projectId))throw Error('Dự án / tài khoản đã đổi.');
  await B.evidencePut(id,blob);return blob;
 };
 document.addEventListener('click',async e=>{const button=e.target.closest?.('[data-cloud-media-upload]');if(!button)return;button.disabled=true;
  try{await B.uploadProjectEvidence(button.dataset.cloudMediaUpload);B.toast('Đã đồng bộ tệp riêng của dự án.');}catch(error){B.toast(error.message);}finally{button.disabled=false;B.render({preserveScroll:true});}
 });
})();
