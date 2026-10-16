/* Anonymous project library. Full designs stay on this device until exported. */
BMH.projects={db:null,dbPromise:null,tail:Promise.resolve(),dirty:false,mutation:0,timer:0,busy:false,open:false,error:'',rows:[],confirmDelete:'',activeId:String(BMH.state.meta.localProjectId||'')};
BMH.projectSnapshot=state=>{
 const snap=structuredClone(state);snap.access={paid:false,source:'server-required',paidAt:null,verifiedAt:null,orderCode:null};
 snap.ui.renderMode='interactive';return snap;
};
BMH.projectSummary=(state,id)=>{
 const p=state.project,s=p.site,rooms=p.plan.rooms;
 return {id,cloudProjectId:state.meta.cloudProjectId||'',cloudOwnerId:state.meta.cloudOwnerId||'',name:String(p.name||'Ngôi nhà của mình').slice(0,120),updatedAt:state.meta.savedAt,createdAt:state.meta.createdAt||state.meta.savedAt,width:Number(s.width),depth:Number(s.depth),floors:Number(s.floors),roomCount:rooms.length,rooms:rooms.filter(r=>r.floor===0).slice(0,160).map(r=>({x:r.x,y:r.y,w:r.w,h:r.h,type:r.type}))};
};
BMH.projectDb=()=>{
 const p=BMH.projects;if(p.db)return Promise.resolve(p.db);if(p.dbPromise)return p.dbPromise;
 p.dbPromise=new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB)return reject(new Error('Trình duyệt chưa cho phép lưu nhiều dự án. Bạn vẫn có thể tải bản sao JSON.'));
  const request=indexedDB.open('bmh-customer-projects',2);
  request.onupgradeneeded=()=>{const db=request.result;if(!db.objectStoreNames.contains('designs'))db.createObjectStore('designs',{keyPath:'id'});if(!db.objectStoreNames.contains('summaries')){const summaries=db.createObjectStore('summaries',{keyPath:'id'});summaries.createIndex('updatedAt','updatedAt');}if(!db.objectStoreNames.contains('settings'))db.createObjectStore('settings',{keyPath:'key'});};
  request.onerror=()=>reject(new Error('Chưa mở được kho dự án trên thiết bị. Hãy tải bản sao JSON để giữ thiết kế.'));
  request.onblocked=()=>reject(new Error('Kho dự án đang mở trong một tab cũ. Đóng tab đó và thử lại; bạn vẫn có thể tải bản sao JSON.'));
  request.onsuccess=()=>{p.db=request.result;p.db.onversionchange=()=>{p.db.close();p.db=null;p.dbPromise=null;};resolve(p.db);};
 }).catch(error=>{p.dbPromise=null;throw error;});return p.dbPromise;
};
BMH.projectTransaction=async(stores,mode,operation)=>{
 const db=await BMH.projectDb();return new Promise((resolve,reject)=>{
  const transaction=db.transaction(stores,mode);let result;
  transaction.oncomplete=()=>resolve(result);transaction.onabort=()=>reject(new Error('Không lưu được dự án trên thiết bị. Dữ liệu hiện tại vẫn còn; hãy tải bản sao JSON.'));
  transaction.onerror=()=>{};
  try{operation(transaction,value=>{result=value;});}catch(error){transaction.abort();reject(error);}
 });
};
BMH.projectEnqueue=operation=>{const p=BMH.projects,next=p.tail.catch(()=>{}).then(operation);p.tail=next;return next;};
BMH.projectPut=(state,id)=>BMH.projectTransaction(['designs','summaries','settings'],'readwrite',transaction=>{
 transaction.objectStore('designs').put({id,state});transaction.objectStore('summaries').put(BMH.projectSummary(state,id));
 transaction.objectStore('settings').put({key:'active',id,updatedAt:state.meta.savedAt});
});
BMH.projectActive=()=>BMH.projectTransaction(['settings'],'readonly',(transaction,result)=>{const r=transaction.objectStore('settings').get('active');r.onsuccess=()=>result(r.result||null);});
BMH.projectActivate=id=>BMH.projectTransaction(['settings'],'readwrite',transaction=>transaction.objectStore('settings').put({key:'active',id,updatedAt:new Date().toISOString()}));
BMH.projectGet=id=>BMH.projectTransaction(['designs'],'readonly',(transaction,result)=>{const r=transaction.objectStore('designs').get(id);r.onsuccess=()=>result(r.result||null);});
BMH.projectList=()=>BMH.projectTransaction(['summaries'],'readonly',(transaction,result)=>{
 const rows=[],r=transaction.objectStore('summaries').index('updatedAt').openCursor(null,'prev');r.onsuccess=()=>{const cursor=r.result;if(cursor){rows.push(cursor.value);cursor.continue();}else result(rows);};
});
BMH.projectSaveStatus=()=>{
 const p=BMH.projects,text=p.error?'Chưa lưu được':p.busy?'Đang lưu…':p.dirty?'Có thay đổi':p.activeId?'Đã lưu trên thiết bị':'Lưu tự động trên thiết bị';
 const node=BMH.$('#customerProjectSaveState');if(node){node.textContent=text;node.dataset.state=p.error?'error':p.busy||p.dirty?'pending':'saved';}
};
BMH.queueProjectSave=()=>{const p=BMH.projects;p.dirty=true;p.mutation++;clearTimeout(p.timer);p.timer=setTimeout(()=>BMH.saveCustomerProject().catch(()=>{}),1200);BMH.projectSaveStatus();};
BMH.saveCustomerProject=async()=>{
 const p=BMH.projects;clearTimeout(p.timer);p.timer=0;
 if(!p.dirty&&p.activeId){await p.tail;return p.activeId;}
 p.activeId||=globalThis.crypto?.randomUUID?.()||BMH.uid('home');BMH.state.meta.localProjectId=p.activeId;BMH.state.meta.savedAt=new Date().toISOString();BMH.state.meta.createdAt||=BMH.state.meta.savedAt;
 const id=p.activeId,snapshot=BMH.projectSnapshot(BMH.state),mutation=p.mutation;p.dirty=false;p.writes=(p.writes||0)+1;p.busy=true;p.error='';BMH.projectSaveStatus();
 try{await BMH.projectEnqueue(()=>BMH.projectPut(snapshot,id));if(mutation===p.mutation)p.dirty=false;if(id===p.activeId)p.error='';BMH.saveBeforeProjects();return id;}
 catch(error){p.error=error.message;p.dirty=true;throw error;}
 finally{p.writes--;p.busy=p.writes>0;BMH.projectSaveStatus();}
};
BMH.detachProjectCloud=()=>{if(!BMH.cloud)return;clearTimeout(BMH.cloud.saveTimer);BMH.cloud.activeProjectId='';BMH.cloud.syncStatus='local';try{localStorage.removeItem(BMH.CLOUD_ACTIVE_KEY);}catch(_){}};
BMH.restoreProjectRuntime=()=>{
 const project=BMH.state.project;
 BMH.finishCancel?.();if(BMH.finishRuntime){BMH.finishRuntime.error='';BMH.finishRuntime.notice='';}
 if(BMH.v6){for(const source of BMH.v6.uploads||[])if(source.previewUrl?.startsWith('blob:'))URL.revokeObjectURL(source.previewUrl);Object.assign(BMH.v6,{upload:null,uploads:structuredClone(project.sourceRefs||[]),ideaDraft:project.briefIdea||'',briefResult:Object.keys(project.brief?.result||{}).length?structuredClone(project.brief.result):null,briefProvider:project.brief?.provider||'',briefNotice:project.brief?.notice||'',briefError:'',feng:{loading:false,error:'',result:null,citations:[]},bankRateError:''});}
 if(BMH.scan)Object.assign(BMH.scan,{busy:false,stage:'',progress:0,error:'',fileName:project.aiScan?.sourceName||'',mimeType:project.aiScan?.mimeType||'',result:structuredClone(project.aiScan?.result||{}),model:project.aiScan?.model||'',intent:project.aiScan?.intent||'reference'});
 if(BMH.ai)Object.assign(BMH.ai,{open:false,result:null,error:'',prompt:'',imageName:''});
};
BMH.useCustomerProject=(record,{close=true}={})=>{
 const access=structuredClone(BMH.state.access);BMH.detachProjectCloud();BMH.state=BMH.mergeState(BMH.defaultState(),record.state);BMH.state.access=access;BMH.state.meta.localProjectId=record.id;BMH.state.ui.renderMode='interactive';BMH.normalizeState();
 BMH.projects.activeId=record.id;BMH.projects.dirty=false;BMH.projects.error='';BMH.planHistory={undo:[],redo:[]};BMH.suggestionCache?.clear();BMH.restoreProjectRuntime();BMH.saveBeforeProjects();
 BMH.projects.activation=BMH.projectEnqueue(()=>BMH.projectActivate(record.id)).catch(error=>{BMH.projects.error=error.message;BMH.projectSaveStatus();});
 if(close)BMH.closeProjectLibrary();BMH.render();BMH.projectSaveStatus();
};
BMH.openCustomerProject=async id=>{await BMH.saveCustomerProject();const record=await BMH.projectGet(id);if(!record)throw new Error('Bản lưu này không còn trên thiết bị.');BMH.useCustomerProject(record);await BMH.projects.activation;BMH.toast('Đã mở '+record.state.project.name+'.');};
BMH.newCustomerProject=async({copyId=''}={})=>{
 await BMH.saveCustomerProject();const source=copyId?await BMH.projectGet(copyId):null;if(copyId&&!source)throw new Error('Không tìm thấy thiết kế để tạo bản sao.');
 const state=source?BMH.projectSnapshot(source.state):BMH.defaultState(),id=globalThis.crypto?.randomUUID?.()||BMH.uid('home'),now=new Date().toISOString();
 BMH.clearCloudLink?.(state);state.meta.localProjectId=id;state.meta.createdAt=state.meta.savedAt=now;state.project.name=source?String(source.state.project.name||'Ngôi nhà').slice(0,110)+' · bản sao':'Ngôi nhà mới';state.ui.renderMode='interactive';state.ui.onboardingComplete=BMH.state.ui.onboardingComplete;state.ui.step=source?state.ui.step:1;
 await BMH.projectEnqueue(()=>BMH.projectPut(state,id));BMH.useCustomerProject({id,state});BMH.toast(source?'Đã tạo thiết kế riêng từ bản sao.':'Đã tạo dự án mới; thiết kế trước vẫn được giữ.');return id;
};
BMH.deleteCustomerProject=async id=>{
 if(id===BMH.projects.activeId)throw new Error('Hãy mở một dự án khác trước khi xóa bản đang dùng.');
 await BMH.projectEnqueue(()=>BMH.projectTransaction(['designs','summaries'],'readwrite',transaction=>{transaction.objectStore('designs').delete(id);transaction.objectStore('summaries').delete(id);}));
 BMH.projects.confirmDelete='';await BMH.refreshProjectLibrary();
};
BMH.projectThumbnail=row=>{
 const rooms=row.rooms||[],colors={living:'#d2d9bf',bed:'#e5daca',kitchen:'#cad9d2',bath:'#c9dae4',stairs:'#d0c9bd',garage:'#d9d6ce'},w=Math.max(1,row.width),d=Math.max(1,row.depth);
 return '<svg viewBox="0 0 '+w+' '+d+'" role="img" aria-label="Mặt bằng thu nhỏ"><rect width="'+w+'" height="'+d+'" fill="#f6f4ed"/>'+rooms.map(r=>'<rect x="'+Number(r.x)+'" y="'+Number(r.y)+'" width="'+Number(r.w)+'" height="'+Number(r.h)+'" fill="'+(colors[r.type]||'#e1dfd5')+'" stroke="#707b6a" stroke-width=".06"/>').join('')+'</svg>';
};
BMH.projectLibraryHtml=()=>{
 const p=BMH.projects,esc=BMH.esc,visible=p.visibleCount||20,rows=p.rows.slice(0,visible).map(row=>{
  const current=row.id===p.activeId,confirm=p.confirmDelete===row.id;
  return '<article class="customer-project-card">'+BMH.projectThumbnail(row)+'<div><h3>'+esc(row.name)+'</h3><p>'+BMH.num(row.width)+' × '+BMH.num(row.depth)+' m · '+row.floors+' tầng · '+row.roomCount+' phòng</p><small>'+esc(new Date(row.updatedAt).toLocaleString('vi-VN'))+(current?' · Đang mở':'')+'</small><div class="customer-project-card-actions">'+(confirm?'<span>Xóa bản lưu này?</span><button data-project-delete-confirm="'+esc(row.id)+'">Xóa bản lưu</button><button data-project-delete-cancel>Giữ lại</button>':'<button data-project-open="'+esc(row.id)+'">'+(current?'Tiếp tục thiết kế':'Mở thiết kế')+'</button><button data-project-copy="'+esc(row.id)+'">Tạo bản sao</button><button data-project-delete="'+esc(row.id)+'" '+(current?'disabled title="Mở dự án khác trước khi xóa"':'')+'>Xóa</button>')+'</div></div></article>';
 }).join('');
 return '<header><div><small>BUILD MY HOME</small><h2 id="customerProjectsTitle">Dự án của tôi</h2><p>Thiết kế được lưu trên thiết bị này, không cần đăng nhập.</p></div><button data-project-library-close aria-label="Đóng">×</button></header><form id="customerProjectNameForm"><label>Tên thiết kế đang mở<input name="projectName" maxlength="120" value="'+esc(BMH.state.project.name||'')+'" required></label><button type="submit">Lưu tên</button></form><div class="customer-project-tools"><button data-project-new>+ Thiết kế mới</button><button data-project-backup>↓ Tải bản sao JSON</button><button data-project-import>↑ Mở tệp JSON</button><input id="customerProjectJsonUpload" type="file" accept="application/json,.json" hidden aria-label="Chọn bản sao dự án JSON trong hộp dự án"><button data-app-install>Cài BMH vào thiết bị</button></div>'+(p.error?'<p class="customer-project-error" role="alert">'+esc(p.error)+'</p>':'')+'<div class="customer-project-list">'+(rows||'<p>Chưa có bản lưu. Thiết kế đang mở vẫn được giữ trên màn hình.</p>')+'</div>'+(p.rows.length>visible?'<button data-project-load-more>Xem thêm thiết kế ('+(p.rows.length-visible)+')</button>':'')+'<footer>Để chuyển máy hoặc giữ thêm một bản, hãy tải bản sao JSON. Ảnh và tệp hiện trường lưu riêng trên thiết bị.</footer>';
};
BMH.paintProjectLibrary=()=>{const dialog=BMH.$('#customerProjects');if(!dialog||!BMH.projects.open)return;const input=dialog.querySelector('[name="projectName"]'),focused=input&&document.activeElement===input,value=input?.value,start=input?.selectionStart,end=input?.selectionEnd;dialog.innerHTML=BMH.projectLibraryHtml();if(focused){const next=dialog.querySelector('[name="projectName"]');next.value=value;next.focus();next.setSelectionRange(start,end);}};
BMH.refreshProjectLibrary=async()=>{try{BMH.projects.rows=await BMH.projectList();}catch(error){BMH.projects.error=error.message;}BMH.paintProjectLibrary();};
BMH.openProjectLibrary=async()=>{
 const p=BMH.projects;if(p.open)return;p.open=true;p.visibleCount=20;p.focus=document.activeElement;
 let dialog=BMH.$('#customerProjects');if(!dialog){dialog=document.createElement('dialog');dialog.id='customerProjects';dialog.className='customer-project-dialog';dialog.setAttribute('aria-labelledby','customerProjectsTitle');document.body.appendChild(dialog);dialog.addEventListener('close',()=>{p.open=false;p.confirmDelete='';p.focus?.focus?.();});dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});}
 BMH.paintProjectLibrary();dialog.querySelector('h2').id='customerProjectsTitle';dialog.showModal();
 try{await BMH.saveCustomerProject();}catch(error){p.error=error.message;}await BMH.refreshProjectLibrary();
};
BMH.closeProjectLibrary=()=>{BMH.projects.open=false;BMH.projects.confirmDelete='';BMH.$('#customerProjects')?.close();};
BMH.saveBeforeProjects=BMH.save;BMH.save=()=>{const result=BMH.saveBeforeProjects();BMH.queueProjectSave();return result;};
const customerProjectRender=BMH.render;BMH.render=options=>{customerProjectRender(options);BMH.projectSaveStatus();};
const customerProjectImport=BMH.importProjectJson;BMH.importProjectJson=async file=>{
 const available=await BMH.projectDb().then(()=>true,()=>false);if(available)await BMH.saveCustomerProject();const imported=await customerProjectImport(file);clearTimeout(BMH.projects.timer);BMH.projects.activeId='';delete imported.meta.localProjectId;BMH.clearCloudLink?.(imported);BMH.projects.dirty=true;
 BMH.restoreProjectRuntime();if(available)await BMH.saveCustomerProject();else BMH.saveBeforeProjects();BMH.closeProjectLibrary();BMH.render();BMH.projectSaveStatus();return imported;
};
// A slow disk write cannot let a second project switch replace the first one.
for(const name of ['openCustomerProject','newCustomerProject','deleteCustomerProject','importProjectJson']){
 const action=BMH[name];BMH[name]=async(...args)=>{const p=BMH.projects;if(p.actionBusy)throw new Error('Đang xử lý dự án. Hãy chờ hoàn tất rồi chọn lại.');if(name!=='deleteCustomerProject'&&(BMH.v6?.briefLoading||BMH.v6?.uploadBusy||BMH.v6?.feng?.loading||BMH.v6?.bankRateLoading||BMH.ai?.loading||BMH.scan?.busy||BMH.cinematicRender?.loading||BMH.cloud?.loading||BMH.state.project.siteIntelligence?.status==='loading'))throw new Error('Hãy chờ tác vụ đang chạy hoàn tất trước khi chuyển thiết kế.');p.actionBusy=true;try{return await action(...args);}finally{p.actionBusy=false;}};
}
document.addEventListener('click',event=>{
 const button=event.target.closest?.('[data-project-library],[data-project-save],[data-project-library-close],[data-project-new],[data-project-open],[data-project-copy],[data-project-delete],[data-project-delete-confirm],[data-project-delete-cancel],[data-project-backup],[data-project-load-more]');if(!button)return;
 const run=async()=>{const d=button.dataset;if('projectLibrary'in d)return BMH.openProjectLibrary();if('projectLibraryClose'in d)return BMH.closeProjectLibrary();if('projectBackup'in d)return BMH.exportProjectJson();if('projectLoadMore'in d){BMH.projects.visibleCount=(BMH.projects.visibleCount||20)+20;return BMH.paintProjectLibrary();}if('projectDelete'in d){BMH.projects.confirmDelete=d.projectDelete;return BMH.paintProjectLibrary();}if('projectDeleteCancel'in d){BMH.projects.confirmDelete='';return BMH.paintProjectLibrary();}button.disabled=true;
  if('projectSave'in d){await BMH.saveCustomerProject();BMH.toast('Đã lưu thiết kế trên thiết bị.');}else if('projectNew'in d)await BMH.newCustomerProject();else if('projectOpen'in d)await BMH.openCustomerProject(d.projectOpen);else if('projectCopy'in d)await BMH.newCustomerProject({copyId:d.projectCopy});else if('projectDeleteConfirm'in d)await BMH.deleteCustomerProject(d.projectDeleteConfirm);
 };
 run().catch(error=>{BMH.projects.error=error.message;BMH.projectSaveStatus();BMH.paintProjectLibrary();BMH.toast(error.message);}).finally(()=>{button.disabled=false;});
});
// A modal makes the header's file input inert. Keep its chooser inside the
// active dialog so importing a saved plan remains a real user gesture.
document.addEventListener('click',event=>{
 const button=event.target.closest?.('#customerProjects [data-project-import]');if(!button)return;
 event.preventDefault();event.stopImmediatePropagation();BMH.$('#customerProjectJsonUpload')?.click();
},true);
document.addEventListener('change',event=>{
 const input=event.target;if(input?.id!=='customerProjectJsonUpload')return;
 const file=input.files?.[0];input.value='';if(file)BMH.importProjectJson(file).catch(error=>BMH.toast(error.message||'Không đọc được bản sao dự án.'));
});
document.addEventListener('submit',event=>{if(event.target.id!=='customerProjectNameForm')return;event.preventDefault();const name=String(new FormData(event.target).get('projectName')||'').trim().slice(0,120);if(!name)return;BMH.state.project.name=name;BMH.save();BMH.saveCustomerProject().then(()=>BMH.refreshProjectLibrary()).catch(error=>{BMH.projects.error=error.message;BMH.paintProjectLibrary();});});
BMH.projects.ready=(async()=>{
 const initial=BMH.state,mutation=BMH.projects.mutation;
 try{await BMH.projectDb();const active=await BMH.projectActive();if(BMH.state!==initial||mutation!==BMH.projects.mutation)return true;if(active?.id&&(!BMH.localStateLoaded||!BMH.projects.activeId||String(active.updatedAt)>=String(initial.meta.savedAt)))BMH.projects.activeId=active.id;if(BMH.projects.activeId){const record=await BMH.projectGet(BMH.projects.activeId);if(BMH.state===initial&&mutation===BMH.projects.mutation){if(record&&(!BMH.localStateLoaded||record.id!==initial.meta.localProjectId||String(record.state.meta.savedAt)>String(initial.meta.savedAt)))BMH.useCustomerProject(record,{close:false});else if(!record||String(initial.meta.savedAt)>String(record.state.meta.savedAt))BMH.queueProjectSave();}}return true;}
 catch(error){BMH.projects.error=error.message;BMH.projectSaveStatus();return false;}
})();
