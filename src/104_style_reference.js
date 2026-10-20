/* Customer-owned reference image stays on this device and is sent to Gemini
 * only when the customer requests a new perspective. It never sets dimensions. */
(()=>{
 const B=BMH,dbName='bmh-style-reference-images',imageTypes=new Set(['image/jpeg','image/png','image/webp']);
 let database;
 const open=()=>database||=new Promise((resolve,reject)=>{
  if(!globalThis.indexedDB)return reject(Error('Không có kho ảnh trên thiết bị.'));
  const request=indexedDB.open(dbName,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('images'))request.result.createObjectStore('images');};
  request.onsuccess=()=>{const db=request.result;db.onversionchange=()=>{db.close();database=null;};resolve(db);};
  request.onerror=()=>{database=null;reject(Error('Không lưu được ảnh tham khảo.'));};
  request.onblocked=()=>{database=null;reject(Error('Đóng tab BMH cũ để cập nhật kho ảnh.'));};
 }).catch(error=>{database=null;throw error;});
 const transaction=(mode,work)=>open().then(db=>new Promise((resolve,reject)=>{
  const tx=db.transaction('images',mode),request=work(tx.objectStore('images'));let result=null;
  request.onsuccess=()=>{result=request.result||null;};
  tx.oncomplete=()=>resolve(result);
  request.onerror=()=>reject(Error('Không đọc hoặc lưu được ảnh tham khảo.'));
  tx.onabort=()=>reject(Error('Không lưu được ảnh tham khảo.'));
 }));
 B.styleReferenceStore={
  put:async(id,data,options={})=>{const scope=options.scope||await B.projectMediaScope();return transaction('readwrite',store=>store.put(data,B.projectMediaKey(scope,id)));},
  get:async(id,options={})=>{
   const project=B.state.project,scope=options.scope||await B.projectMediaScope(),key=B.projectMediaKey(scope,id),data=await transaction('readonly',store=>store.get(key));
   if(data||options.legacy===false)return data;
   if(![...(project.sourceRefs||[]),...(B.v6?.uploads||[])].some(r=>r.id===id))return null;
   const db=await open();return new Promise((resolve,reject)=>{const tx=db.transaction('images','readwrite'),store=tx.objectStore('images'),claimId='legacy-claim:'+id,claim=store.get(claimId);let legacy=null;
    claim.onsuccess=()=>{if(claim.result&&claim.result!==scope)return;const request=store.get(id);request.onsuccess=()=>{if(!request.result)return;legacy=request.result;store.put(scope,claimId);store.put(legacy,key);};};
    tx.oncomplete=()=>B.state.project===project?resolve(legacy):reject(Error('Dự án đã đổi.'));tx.onabort=()=>reject(Error('Không khôi phục được ảnh cũ.'));tx.onerror=()=>{};
   });
  }
 };
 const preview=B.v6FilePreview;
 B.v6FilePreview=async file=>{
  const item=await preview(file);
  if(!imageTypes.has(file.type)||file.size>20*1024*1024)return item;
  try{
   const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas'),scale=Math.min(1,1024/Math.max(bitmap.width,bitmap.height));
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   let data=canvas.toDataURL('image/jpeg',.74);
   if(data.length>650000){const compact=document.createElement('canvas'),ratio=Math.min(1,768/Math.max(canvas.width,canvas.height));compact.width=Math.round(canvas.width*ratio);compact.height=Math.round(canvas.height*ratio);compact.getContext('2d').drawImage(canvas,0,0,compact.width,compact.height);data=compact.toDataURL('image/jpeg',.58);}
   if(data.length>750000)throw Error('Ảnh quá lớn cho phối cảnh.');
   item.dataUrl=data;
   try{await B.styleReferenceStore.put(item.id,data);}catch(_){item.status='Chỉ dùng trong phiên này · tải lại ảnh sau khi mở dự án';}
   if(!B.state.project.styleReferenceId)B.state.project.styleReferenceId=item.id;
  }catch(_){/* The original preview and reference metadata remain available. */}
  return item;
 };
 B.restoreStyleReferenceImages=async()=>{
  const project=B.state.project,rows=B.v6?.uploads||[];
  for(const row of rows.filter(x=>x.kind==='image'&&!x.dataUrl)){
   try{let data=await B.styleReferenceStore.get(row.id);const metadata=(project.sourceRefs||[]).find(x=>x.id===row.id);if(!data&&metadata?.cloudKey&&B.cloud?.config?.mediaConfigured){const blob=await B.evidenceGet(row.id);if(blob?.type==='image/jpeg')data=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});if(data)await B.styleReferenceStore.put(row.id,data);}if(B.state.project!==project||!rows.includes(row))return;
    if(/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(data||''))row.dataUrl=data;
   }catch(_){return;}
  }
  if(B.state.project!==project)return;
  B.v6.upload=rows.find(x=>x.id===project.styleReferenceId&&x.dataUrl)||rows.find(x=>x.dataUrl)||null;
  if([1,6].includes(B.state.ui.step))B.render({preserveScroll:true});
 };
 const restore=B.restoreProjectRuntime;
 B.restoreProjectRuntime=()=>{restore();queueMicrotask(()=>B.restoreStyleReferenceImages());};
 queueMicrotask(()=>B.restoreStyleReferenceImages());
 B.cinematicStyleReference=()=>{
  const id=B.state.project.styleReferenceId;
  const source=B.v6?.uploads?.find(x=>x.id===id&&x.kind==='image'&&/^data:image\/jpeg;base64,/.test(x.dataUrl||''));
  return source?{id:source.id,name:source.name,image:source.dataUrl}:null;
 };
 const signature=B.cinematicSignature;
 B.cinematicSignature=focus=>signature(focus)+'|style-reference:'+(B.state.project.styleReferenceId||'none');
 // Read-only bridge: reference, elevations and model use the current project.
 // A reference image is never converted into invented construction dimensions.
 B.referenceDesignReview=()=>{
  const p=B.state.project,id=p.styleReferenceId||null,source=(p.sourceRefs||[]).find(r=>r.id===id),levels=B.studioLevels(),parts=B.facadeComponents();
  return {revision:B.drawingRevision(),style:p.style,styleId:B.houseStyle()?.id||null,reference:{id,name:source?.name||null,available:!!B.cinematicStyleReference(),catalogStyleId:id?null:B.houseStyle()?.id||null,geometryMatch:'not-verified'},activeKit:p.designStudio?.activeKit||null,units:'m',site:{width:Number(p.site.width),depth:Number(p.site.depth)},floors:Array.from({length:Number(p.site.floors)},(_,floor)=>{const level=B.studioFloorLevel(floor);return {floor,base:level.base,height:level.height,rooms:p.plan.rooms.filter(r=>r.floor===floor).map(r=>({id:r.id,x:r.x,y:r.y,width:r.w,depth:r.h}))};}),openings:p.plan.openings.map(o=>({id:o.id,roomId:o.roomId,floor:o.floor,kind:o.kind,side:o.side,width:o.width,height:o.height,sill:o.sill||0})),facade:{componentIds:parts.map(c=>c.id),basis:'shared-measured-elevation-and-model',provisional:parts.some(c=>c.provisional===true)},roof:{...B.roofDesignSpec(),top:levels.roofBase},materials:{exterior:B.showroomFinishInfo?.()||[],rooms:p.plan.rooms.map(r=>({roomId:r.id,products:B.showroomFinishInfo?.(r.id)||[]}))},engineeringApproved:false};
 };
 B.referenceDesignReviewHtml=()=>{
  const p=B.state.project;if(!p.plan.rooms.length)return '';
  const r=B.referenceDesignReview(),source=B.cinematicStyleReference(),side=['front','back','left','right'].includes(B.state.ui.referenceElevation)?B.state.ui.referenceElevation:'front',esc=B.esc;
  const concept=!r.reference.id&&B.houseStyle()&&B.styleIllustration?B.styleIllustration(B.houseStyle()):'',svg=B.elevationSvg(side),drawing='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg),labels={front:'Mặt trước',back:'Mặt sau',left:'Mặt trái',right:'Mặt phải'};
  return '<details class="reference-design-review" data-guided-panel="reference-design-review" '+(B.state.ui.guidedPanels?.['reference-design-review']?'open':'')+'><summary>Đối chiếu mẫu nhà · bản vẽ · 3D</summary><p>'+esc(r.style)+' · '+r.site.width+' × '+r.site.depth+' m · '+r.floors.length+' tầng · bản '+esc(r.revision)+'</p><div class="reference-design-grid"><figure>'+(source?'<img src="'+esc(source.image)+'" alt="Ảnh thiết kế ban đầu: '+esc(source.name)+'">':concept||'<div class="reference-design-empty">'+(r.reference.id?'Ảnh đã chọn chưa có trên thiết bị. Tải lại ở Ý tưởng để đối chiếu.':'Thêm ảnh mẫu nhà tại Ý tưởng để đối chiếu.')+'</div>')+'<figcaption>Mẫu ban đầu'+(r.reference.catalogStyleId?' · minh họa '+esc(r.style):'')+(r.reference.name?' · '+esc(r.reference.name):'')+'</figcaption></figure><figure><label>Hướng bản vẽ<select data-reference-elevation>'+Object.entries(labels).map(([key,label])=>'<option value="'+key+'" '+(key===side?'selected':'')+'>'+label+'</option>').join('')+'</select></label><img data-reference-measured-elevation src="'+esc(drawing)+'" alt="'+labels[side]+' từ cùng dữ liệu dựng 3D"><figcaption>Bản vẽ đang dựng 3D · số đo bằng mm</figcaption></figure></div><p>Cao tầng: '+r.floors.map(f=>'T'+(f.floor+1)+' '+Math.round(f.height*1000)+' mm').join(' · ')+'</p><p>Ô cửa: '+r.openings.length+' · chi tiết mặt đứng: '+r.facade.componentIds.length+'. Bản vẽ và mô hình dùng cùng mã chi tiết. Ảnh mẫu chưa được xác nhận khớp hình học; chi tiết gợi ý cần được duyệt.</p><button type="button" data-nav="4">Chỉnh bản vẽ & kích thước</button></details>';
 };
 const snapshot=B.customerDesignSnapshot;
 B.customerDesignSnapshot=()=>{const result=snapshot();result.project.referenceDesign=B.referenceDesignReview();return result;};
 const screen=B.screen7;
 B.screen7=()=>{
  const t=document.createElement('template');t.innerHTML=screen();
  const workspace=t.content.querySelector('.model-scene-wrap')||t.content.querySelector('.design-canvas');
  if(workspace)workspace.insertAdjacentHTML('afterend',B.referenceDesignReviewHtml());
  const prompt=t.content.querySelector('.model-render-prompt');if(!prompt)return t.innerHTML;
  const images=(B.state.project.sourceRefs||[]).filter(x=>x.kind==='image'),selected=B.state.project.styleReferenceId,source=B.cinematicStyleReference();
  const box=document.createElement('div');box.className='model-style-reference';
  if(images.length){
   box.innerHTML='<label>Ảnh phong cách khách chọn <select data-style-reference><option value="">Chỉ dùng phong cách bằng chữ</option>'+images.map(x=>'<option value="'+B.esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+B.esc(x.name)+'</option>').join('')+'</select></label>'+(source?'<img src="'+source.image+'" alt="Ảnh phong cách của khách">':'')+'<small>'+(selected&&!source?'Ảnh này chưa có trên thiết bị. Tải lại ở tab Ý tưởng trước khi tạo phối cảnh.':'Ảnh này định hướng phong cách; mô hình 3D và bản vẽ giữ kích thước.')+'</small>';
  }else box.innerHTML='<small>Muốn bám sát mẫu nhà của bạn? Thêm ảnh ở tab Ý tưởng trước khi tạo phối cảnh.</small>';
  if(selected&&B.cloud?.config?.mediaConfigured)box.insertAdjacentHTML('beforeend','<button data-cloud-media-upload="'+B.esc(selected)+'">Lưu ảnh tham khảo lên tài khoản</button>');prompt.append(box);return t.innerHTML;
 };B.SCREENS[5]=B.screen7;
 document.addEventListener('change',e=>{if(!e.target.matches?.('[data-style-reference]'))return;B.rememberFinishCamera?.();B.state.project.styleReferenceId=e.target.value;B.save();B.render({preserveScroll:true});});
 document.addEventListener('change',e=>{if(!e.target.matches?.('[data-reference-elevation]')||!['front','back','left','right'].includes(e.target.value))return;B.state.ui.referenceElevation=e.target.value;B.state.ui.guidedPanels||={};B.state.ui.guidedPanels['reference-design-review']=true;const panel=e.target.closest('.reference-design-review');if(panel)panel.outerHTML=B.referenceDesignReviewHtml();});
})();

/* Team B / B3: select and drag the same measured furniture in the real canvas.
 * Raster remains immediate; no implicit AI, path tracing or new renderer. */
(()=>{
 const B=BMH;
 const mount=B.mountStudio3D;
 B.mountStudio3D=async()=>{
  await mount();const s=B.studio3d;if(!s||s.teamBFurnitureMounted)return;s.teamBFurnitureMounted=true;
  const groups=[];s.scene.traverse(o=>{if(o.userData.kind==='furniture'&&o.userData.furnitureId)groups.push(o);});s.teamBFurnitureGroups=groups;
  for(const group of groups){const record=B.resolvedFurniture().find(i=>i.id===group.userData.furnitureId);if(record){group.userData.rotationDeg=record.pose.rotationDeg;group.userData.measuredSize={...record.size};}}
 };
 let drag;
 const groupFor=object=>{for(let o=object;o;o=o.parent)if(o.userData.kind==='furniture'&&o.userData.furnitureId)return o;return null;};
 const ray=(event,s)=>{const rect=s.renderer.domElement.getBoundingClientRect(),p=new s.THREE.Vector2((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1),raycaster=new s.THREE.Raycaster();raycaster.setFromCamera(p,s.camera);return raycaster;};
 document.addEventListener('pointerdown',e=>{
  if(e.target.id!=='studio3dCanvas'||BMH.state.ui.step!==6)return;const s=B.studio3d;if(!s)return;
  const hits=ray(e,s).intersectObjects(s.scene.children,true),hit=hits.find(h=>{if(!h.object.isMesh)return false;for(let o=h.object;o;o=o.parent)if(!o.visible||o.userData.presentationOnly)return false;const m=Array.isArray(h.object.material)?h.object.material[h.face?.materialIndex||0]:h.object.material;if(m?.opacity===0)return false;const clipped=m?.clippingPlanes?.map(p=>p.distanceToPoint(h.point)<0)||[];return !(m?.clipIntersection?clipped.length&&clipped.every(Boolean):clipped.some(Boolean));}),group=hit&&groupFor(hit.object);if(!group)return;
  const item=B.resolvedFurniture().find(i=>i.id===group.userData.furnitureId);if(!item)return;
  e.preventDefault();e.stopImmediatePropagation();B.state.ui.planner.selectedFurniture=item.id;B.state.ui.planner.selected=item.roomId;
  const plane=new s.THREE.Plane(new s.THREE.Vector3(0,1,0),-group.position.y),point=ray(e,s).ray.intersectPlane(plane,new s.THREE.Vector3());
  drag={s,group,item,plane,start:point,position:group.position.clone(),pointer:e.pointerId,last:item.pose,moved:false};e.target.setPointerCapture?.(e.pointerId);
 },true);
 document.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();e.stopImmediatePropagation();const d=drag;if(B.studio3d!==d.s){drag=null;return;}
  if(!d.start||d.item.locked||B.isRoomLocked(d.item.roomId)||!B.furnitureContractReady())return;
  const p=ray(e,d.s).ray.intersectPlane(d.plane,new d.s.THREE.Vector3());if(!p)return;
  const dx=p.x-d.start.x,dy=p.z-d.start.z;d.last={...d.item.pose,x:d.item.pose.x+dx,y:d.item.pose.y+dy};d.moved=Math.hypot(dx,dy)>.01;
  d.group.position.set(d.position.x+dx,d.position.y,d.position.z+dy);d.s.renderFrame();
 },true);
 const stop=e=>{
  if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();e.stopImmediatePropagation();const d=drag;drag=null;
  if(B.studio3d!==d.s)return;
  if(e.type==='pointercancel'){d.group.position.copy(d.position);d.s.renderFrame();return;}
  if(d.moved&&!B.editFurniture(d.item.id,{pose:d.last})){d.group.position.copy(d.position);d.s.renderFrame();}
  else if(!d.moved){B.rememberFinishCamera?.();B.render({preserveScroll:true});}
 };
 document.addEventListener('pointerup',stop,true);document.addEventListener('pointercancel',stop,true);
})();

/* Team B / C03: semantic route adapter. Old saved indices and ?step links are
 * migrated once. Screen function names stay stable for A's domain consumers. */
(()=>{
 const B=BMH,key='workflow-route-v1';
 B.workflowRoutes=Object.freeze({ideas:1,site:2,family:3,drawing:4,materials:5,model:6,cost:7,bank:8,handover:9,construction:10});
 B.migrateWorkflowRoute=state=>{
  state.ui.guidedPanels||={};if(state.ui.guidedPanels[key])return state;
  if(state.ui.step===9)state.ui.step=10;else if(state.ui.step===10)state.ui.step=9;
  state.ui.guidedPanels[key]=true;return state;
 };
 B.migrateWorkflowRoute(B.state);
 const restore=B.restoreProjectRuntime;B.restoreProjectRuntime=()=>{B.migrateWorkflowRoute(B.state);return restore();};
 B.SCREENS[8]=()=>B.screen10();B.SCREENS[9]=()=>B.screen9();
 for(const array of [B.GUIDED_FUNCTIONS,B.V6_STEPS,B.STUDIO_NAV,B.STEPS])if(array?.length===10)[array[8],array[9]]=[array[9],array[8]];
 const query=new URLSearchParams(location.search),tab=query.get('tab'),step=Number(query.get('step'));
 if(tab&&B.workflowRoutes[tab])B.state.ui.step=B.workflowRoutes[tab];
 else if(query.has('step')&&Number.isInteger(step)&&step>=1&&step<=10)B.state.ui.step=query.get('workflow')==='v1'?step:step===9?10:step===10?9:step;
 const handover=B.screen10;B.screen10=()=>'<section class="team-b-handover-stage"><small>09 / BÀN GIAO THIẾT KẾ</small><h2>Duyệt hồ sơ trước khi xây</h2><p>Bản vẽ, 3D, vật liệu, dự toán và vốn cần cùng phiên bản. Hồ sơ hoàn công được cập nhật sau thi công.</p></section>'+handover();
 const construction=B.screen9;B.screen9=()=>'<section class="team-b-handover-stage"><small>10 / THI CÔNG & GIÁM SÁT</small><h2>Theo dõi công trình đã duyệt</h2><p>Kiểm tra hồ sơ bàn giao và các xác nhận chuyên môn trước khi triển khai công việc.</p><button data-nav="9">Xem hồ sơ bàn giao</button></section>'+construction();
})();

/* Team B / B6: evidence annotations use the existing project evidence records.
 * These are user reports, not professional acceptance certificates. A6's future
 * supervision adapter supplies attachment-free logs and signed decisions. */
(()=>{
 const B=BMH,esc=B.esc;
 B.annotateProjectEvidence=(id,input)=>{
  const p=B.state.project,item=(p.dossier.evidence||[]).find(i=>i.id===id);if(!item)return false;
  const floor=input.floor===''?null:Number(input.floor),roomId=String(input.roomId||''),room=p.plan.rooms.find(r=>r.id===roomId);
  if(floor!==null&&(!Number.isInteger(floor)||floor<0||floor>=p.site.floors)||roomId&&(!room||room.floor!==floor))return false;
  if(!['photo','inspection-note','defect','correction'].includes(input.reportType)||!['open','reported-resolved'].includes(input.reportStatus))return false;
  const report={floor,roomId,reportType:input.reportType,reportStatus:input.reportStatus,responsible:String(input.responsible||'').trim().slice(0,100),note:String(input.note||'').trim().slice(0,1000),observedAt:/^\d{4}-\d{2}-\d{2}$/.test(input.observedAt||'')?input.observedAt:'',designRevision:B.drawingRevision(),source:'user-report',engineeringAccepted:false};
  if(input.observedAt&&B.teamBEvidenceReport&&B.teamBEvidenceReport(report).observedAt!==input.observedAt)return false;
  item.report=report;item.reportHistory=[...(item.reportHistory||[]).slice(-19),{at:new Date().toISOString(),...structuredClone(report)}];B.save();return true;
 };
 B.supervisionReports=()=>({revision:B.drawingRevision(),rows:(B.state.project.dossier.evidence||[]).map(i=>({id:i.id,name:i.name,stage:i.stage,report:i.report||null,stale:!!(i.report?.designRevision&&i.report.designRevision!==B.drawingRevision()),cloud:!!i.cloudKey})),certified:false});
 B.supervisionWorkspaceHtml=()=>{
  const p=B.state.project,rows=B.supervisionReports().rows,stages=B.DOSSIER_STAGE_DEFS||[],adapter=B.supervisionAdapter;
  const options=(items,value)=>items.map(([id,name])=>'<option value="'+esc(id)+'" '+(String(value)===String(id)?'selected':'')+'>'+esc(name)+'</option>').join('');
  const field=(name,label,value,type='text')=>'<label>'+label+'<input name="'+name+'" type="'+type+'" value="'+esc(value||'')+'" '+(name==='note'?'maxlength="1000"':'maxlength="100"')+'></label>';
  const cards=rows.map(row=>{const item=p.dossier.evidence.find(i=>i.id===row.id),r=row.report||{};
   return '<article class="team-b-evidence-card"><header><div><b>'+esc(row.name)+'</b><small>'+esc(stages.find(s=>s.id===row.stage)?.name||row.stage)+(row.stale?' · báo cáo thuộc bản thiết kế cũ':'')+'</small></div><span>'+esc(r.reportStatus==='reported-resolved'?'Khai báo đã xử lý':r.reportType==='defect'?'Lỗi đang báo':'Chứng cứ')+'</span></header><div class="team-b-evidence-actions"><button data-evidence-view="'+esc(row.id)+'">Mở tệp</button>'+(B.cloud?.config?.mediaConfigured?'<button data-cloud-media-upload="'+esc(row.id)+'">'+(row.cloud?'Đồng bộ lại tệp':'Lưu tệp lên tài khoản')+'</button>':'<small>Tệp trên thiết bị · sao lưu ZIP</small>')+'</div><details><summary>Vị trí, người phụ trách & tình trạng</summary><form data-evidence-report="'+esc(row.id)+'" class="team-b-report-fields"><label>Loại báo cáo<select name="reportType">'+options([['photo','Ảnh công trình'],['inspection-note','Ghi nhận kiểm tra'],['defect','Báo lỗi'],['correction','Xử lý lỗi']],r.reportType||'photo')+'</select></label><label>Tình trạng khai báo<select name="reportStatus">'+options([['open','Đang theo dõi'],['reported-resolved','Đã xử lý · người dùng khai báo']],r.reportStatus||'open')+'</select></label><label>Vị trí<select name="location">'+options([['','Toàn công trình'],...Array.from({length:p.site.floors},(_,f)=>['floor:'+f,'Tầng '+(f+1)]),...p.plan.rooms.map(q=>['room:'+q.id,'T'+(q.floor+1)+' · '+q.name])],r.roomId?'room:'+r.roomId:r.floor!==null&&r.floor!==undefined?'floor:'+r.floor:'')+'</select></label>'+field('responsible','Người phụ trách',r.responsible)+field('observedAt','Ngày quan sát',r.observedAt,'date')+'<label class="team-b-report-note">Ghi chú<textarea name="note" maxlength="1000" rows="3">'+esc(r.note||'')+'</textarea></label><button>Lưu ghi nhận</button><small>Khai báo này chưa phải biên bản nghiệm thu kỹ thuật.</small></form></details></article>';
  }).join('');
  return '<section class="team-b-supervision"><header><div><small>NHẬT KÝ / CHỨNG CỨ</small><h2>Theo dõi từng vị trí, từng việc</h2><p>Giữ ảnh, ghi nhận lỗi và người phụ trách cùng phiên bản thiết kế. Checklist do bạn đánh dấu vẫn là khai báo riêng.</p></div><span>'+rows.length+' tệp · '+rows.filter(r=>r.report?.reportType==='defect'&&r.report.reportStatus==='open').length+' lỗi đang báo</span></header><form data-team-b-evidence-upload><label>Giai đoạn<select name="stage">'+options(stages.map(s=>[s.id,s.name]),p.dossier.currentStage)+'</select></label><label>Ảnh / PDF<input name="files" type="file" multiple accept="image/jpeg,image/png,image/webp,application/pdf" required></label><button>Thêm chứng cứ</button></form><div class="team-b-evidence-grid">'+(cards||'<p>Chưa có ảnh / tài liệu hiện trường. Chọn giai đoạn và thêm tệp đầu tiên.</p>')+'</div><details><summary>Nhật ký không kèm tệp & nghiệm thu chuyên môn</summary>'+(adapter?.html?adapter.html():'<p>Nhật ký công việc và biên bản nghiệm thu chưa được mở trong bản này. Bạn có thể lưu ảnh và ghi chú phía trên.</p>')+'</details></section>';
 };
 const construction=B.screen9;B.screen9=()=>construction()+B.supervisionWorkspaceHtml();
 document.addEventListener('submit',async e=>{
  const form=e.target;if(form.matches?.('[data-evidence-report]')){
   e.preventDefault();const values=Object.fromEntries(new FormData(form)),location=String(values.location||'');let floor='',roomId='';
   if(location.startsWith('floor:'))floor=location.slice(6);else if(location.startsWith('room:')){roomId=location.slice(5);floor=B.state.project.plan.rooms.find(r=>r.id===roomId)?.floor;}
   if(B.annotateProjectEvidence(form.dataset.evidenceReport,{...values,floor,roomId})){B.render({preserveScroll:true});B.toast('Đã lưu ghi nhận.');}else B.toast('Vị trí / tình trạng không hợp lệ.');
  }else if(form.matches?.('[data-team-b-evidence-upload]')){
   e.preventDefault();const values=new FormData(form);await B.addEvidenceFiles(values.getAll('files').filter(f=>f.size),values.get('stage'));
  }
 });
})();

