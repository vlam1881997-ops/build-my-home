/* Ten visible project functions; compact controls inside each workspace. */
(()=>{
 const B=BMH,esc=B.esc;
 B.guidedIcon=name=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+({plan:'<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 12h9V4m0 8v8m0-6h7"/>',cube:'<path d="m12 3 9 5v8l-9 5-9-5V8l9-5Zm0 9 9-4M12 12 3 8m9 4v9"/>',files:'<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 14h8m-8 3h5"/>',more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',plus:'<path d="M12 5v14M5 12h14"/>',settings:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="var(--guided-surface,#fff)"/><circle cx="15" cy="17" r="2" fill="var(--guided-surface,#fff)"/>'}[name]||'')+'</svg>';
 const template=html=>{const t=document.createElement('template');t.innerHTML=html;return t;};
 const element=html=>template(html).content.firstElementChild;
 const select=(attr,label,options,value)=>'<label class="guided-select">'+esc(label)+'<select '+attr+'>'+options.map(([id,title])=>'<option value="'+esc(id)+'" '+(String(value)===String(id)?'selected':'')+'>'+esc(title)+'</option>').join('')+'</select></label>';
 B.guidedDetails=(key,title,body,defaultOpen=false)=>'<details class="guided-details" data-guided-panel="'+esc(key)+'" '+((B.state.ui.guidedPanels?.[key]??defaultOpen)?'open':'')+'><summary>'+esc(title)+'</summary><div class="guided-details-body">'+body+'</div></details>';
 const menu=(name,title,body,icon='more')=>'<details class="guided-menu" data-guided-menu="'+name+'"><summary>'+B.guidedIcon(icon)+esc(title)+'</summary><div class="guided-menu-body">'+body+'</div></details>';
 const wrap=(node,key,title,open=false)=>{if(!node)return;const d=element(B.guidedDetails(key,title,'',open));node.replaceWith(d);d.querySelector('.guided-details-body').append(node);return d;};
 const viewInfo=()=>{const p=B.state.project,ui=B.state.ui,room=p.plan.rooms.find(r=>'room:'+r.id===ui.sceneFocus);return {p,ui,room,floor:room?.floor??(ui.sceneFocus?.startsWith('floor:')?Number(ui.sceneFocus.slice(6)):0)};};

 B.GUIDED_FUNCTIONS=['Ý tưởng','Khu đất','Gia đình','Bản vẽ','Vật liệu','3D','Dự toán','Ngân hàng','Thi công','Bàn giao'];
 B.header=()=>'<header class="v6-header guided-header"><button class="v6-brand" data-nav="1"><img src="assets/icon.svg" alt=""><span><b>Build My Home</b><small>Thiết kế ngôi nhà của bạn</small></span></button><div class="guided-header-actions"><span id="customerProjectSaveState" class="customer-project-save-state" role="status">Lưu tự động</span><button data-project-library>Dự án</button>'+menu('global','Công cụ khác','<button data-v6-global="ideas">Thư viện ý tưởng</button><button data-v6-global="ai">AI tư vấn</button><button data-project-save>Lưu dự án</button><label>Tìm công cụ<input id="globalSearch" placeholder="Bước, vật liệu, ngân hàng…"></label>')+'</div><input id="projectJsonUpload" type="file" accept="application/json,.json" hidden aria-label="Chọn bản sao dự án JSON"></header>';
 B.stepper=()=>'<nav class="v6-stepper guided-stepper guided-ten-tabs" aria-label="10 chức năng dự án">'+B.GUIDED_FUNCTIONS.map((title,i)=>{const id=i+1,description=id===8?'Tài chính, dòng tiền & khoản vay':B.V6_STEPS?.[i]?.[1]||title;return '<button data-nav="'+id+'" title="'+esc(title+' · '+description)+'" class="'+(B.state.ui.step===id?'active':'')+'" '+(B.state.ui.step===id?'aria-current="page"':'')+'><i aria-hidden="true">'+id+'</i><span><b>'+esc(title)+'</b></span></button>';}).join('')+'</nav>';
 B.footer=()=>{const n=B.state.ui.step,back=Math.max(1,n-1),next=Math.min(10,n+1);return '<div class="v6-footer guided-footer"><button class="v6-back" data-nav="'+back+'" '+(n===1?'disabled':'')+'>← Quay lại</button><span>Thiết kế của bạn được lưu tự động trên thiết bị.</span>'+(n<10?'<button class="v6-next" data-nav="'+next+'">Tiếp: '+esc(B.GUIDED_FUNCTIONS[next-1])+' →</button>':'')+'</div>';};

 const finance=B.screen2;
 B.screen2=()=>{const t=template(finance()),picker=t.content.querySelector('.v64-bank-picker');if(picker){picker.dataset.guidedPanel='bank-picker';picker.open=Boolean(B.state.ui.guidedPanels?.['bank-picker']);}return t.innerHTML;};B.SCREENS[7]=B.screen2;

 // Family input remains direct; occasional land data and the cultural method open on demand.
 const family=B.screen4;
 B.screen4=()=>{const t=template(family()),root=t.content.querySelector('.v6-s4');if(!root)return t.innerHTML;root.classList.add('guided-family-page');const land=wrap(root.querySelector('.v6-land'),'family-land','Khu đất & địa chất sơ bộ');land?.classList.add('guided-family-land');wrap(root.querySelector('.v70-feng-family'),'family-feng-method','Cung phi từng thành viên & phương pháp');return t.innerHTML;};B.SCREENS[2]=B.screen4;

 const planner=B.screen5;
 B.screen5=()=>{
  const t=template(planner()),root=t.content.querySelector('.v6-s5'),ui=B.state.ui.planner,p=B.state.project,floor=Number(ui.floor)||0,selected=B.selectedRoom();if(!root)return t.innerHTML;
  root.classList.add('guided-planner');
  root.querySelector('.v6-plan-head').innerHTML='<div class="guided-page-title"><span>THIẾT KẾ / MẶT BẰNG</span><h1>Mặt bằng của bạn</h1><p>'+esc(p.site.width+' × '+p.site.depth+' m · '+p.site.floors+' tầng')+'</p></div>';
  root.querySelector('.v68-plan-empty')?.remove();
  const proposals=root.querySelector('[data-design-proposals]');if(proposals){if(B.state.ui.designProposalsOpen===undefined&&p.plan.rooms.length)proposals.removeAttribute('open');const h=proposals.querySelector('h2');if(h)h.textContent='Phương án bố trí';}
  root.querySelector('.design-planner-next [data-nav="6"]')?.remove();
  const tools=root.querySelector('.v6-plan-tools'),main=root.querySelector('.v6-plan-main'),toolbar=main?.querySelector('.v6-plan-toolbar'),architecture=tools?.querySelector('.architecture-spec');
  if(toolbar){
   const extras=toolbar.children[1]?.innerHTML||'',roomTypes=tools?.querySelector('.v6-room-types')?.outerHTML||'',presentation=root.querySelector('.plan-presentation-controls');presentation?.remove();
   toolbar.innerHTML=select('data-guided-floor','Tầng',Array.from({length:p.site.floors},(_,f)=>[f,'Tầng '+(f+1)]),floor)+select('data-guided-plan-view','Đang xem',[['plan','Mặt bằng'],['elevation','Mặt đứng'],['section','Mặt cắt'],['openings','Bảng cửa'],['stairs','Chi tiết thang']],ui.view||'plan')+menu('add-room','Thêm phòng',roomTypes,'plus')+'<button data-plan-undo title="Hoàn tác thay đổi mặt bằng">↶ Hoàn tác</button>'+menu('plan-tools','Tùy chọn',select('data-guided-plan-tool','Thao tác',[['select','Chọn / kéo phòng'],['door','Thêm cửa đi'],['window','Thêm cửa sổ']],ui.tool||'select')+select('data-guided-presentation','Trình bày',[['technical','Bản vẽ kỹ thuật'],['presentation','Màu & nội thất']],ui.mode||'technical')+'<button data-plan-redo>↷ Làm lại</button>'+extras,'settings');
  }
  if(B.isFloorLocked(floor))main?.prepend(element('<p class="guided-lock" role="status">Tầng '+(floor+1)+' đang khóa. Mở khóa tại Tùy chọn để chỉnh.</p>'));
  if(architecture){tools.removeChild(architecture);root.append(element(B.guidedDetails('architecture','Kích thước nhà & bảng cửa',architecture.outerHTML)));}
  tools?.remove();
  wrap(main?.querySelector('.v70-plan-actions'),'alignment','Căn phòng với tầng dưới');
  const inspector=root.querySelector('.v6-inspector'),fields=inspector?.querySelector('.v6-fields.two');
  if(fields){const position=element('<div class="v6-fields two"></div>');for(const name of ['x','y']){const label=fields.querySelector('[data-v6-room="'+name+'"]')?.closest('label');if(label)position.append(label);}if(position.children.length)fields.after(element(B.guidedDetails('position:'+selected?.id,'Vị trí chính xác',position.outerHTML)));}
  const actions=inspector?.querySelector('.v72-room-actions');if(selected&&B.isRoomLocked(selected.id))actions?.before(element('<p class="guided-lock" role="status">Phòng đang khóa.</p>'));wrap(actions,'room-actions:'+selected?.id,'Thao tác phòng');
  wrap(inspector?.querySelector('.room-editing-panel'),'room-openings:'+selected?.id,'Cửa & hướng phòng',selected?.type==='stairs');
  wrap(inspector?.querySelector('.elevator-edit-panel'),'elevator:'+selected?.id,'Giếng thang máy',true);
  const review=inspector?.querySelector('.v72-review');if(review){for(const error of [...review.querySelectorAll('p.error')])review.before(error);wrap(review,'plan-review','Kiểm tra sơ bộ');}
  const ai=inspector?.querySelector('[data-ai-direct="review"]');wrap(ai,'plan-ai','Tư vấn về mặt bằng');
  return t.innerHTML;
 };B.SCREENS[3]=B.screen5;

 const renderControls=B.architecturalRenderControlsHtml;
 B.architecturalRenderControlsHtml=()=>{const t=template(renderControls()),actions=t.content.querySelector('.architectural-render-actions'),primary=actions?.querySelector('[data-sharp-download]');if(!primary)return t.innerHTML;primary.textContent='Tải ảnh nét ↓';primary.classList.add('guided-primary');actions.removeChild(primary);const advanced=element(menu('image-options','Tùy chọn ảnh',actions.innerHTML,'settings'));actions.replaceChildren(primary,advanced);return t.innerHTML;};
 const studioToolbar=B.customerStudioToolbar;
 B.customerStudioToolbar=()=>{
  const t=template(studioToolbar()),bar=t.content.querySelector('.customer-studio-toolbar'),actions=bar.querySelector('.customer-studio-actions'),strip=t.content.querySelector('.customer-view-strip'),check=t.content.querySelector('.customer-design-check');
  bar.querySelector('h2')?.remove();bar.querySelector('.studio-eyebrow')?.remove();actions.querySelector('[data-client-package]')?.remove();
  const extra=actions.innerHTML+(strip?.outerHTML||'');strip?.remove();actions.innerHTML=menu('studio-actions','Thêm',extra);bar.classList.add('guided-studio-toolbar');
  if(check){const errors=[...check.querySelectorAll('.check-error')];if(errors.length)check.before(element('<div class="guided-errors" role="alert">'+errors.map(e=>'<p>'+esc(e.textContent)+'</p>').join('')+'</div>'));}
  return t.innerHTML;
 };
 const studio=B.screen7;
 B.screen7=()=>{
  const t=template(studio()),root=t.content.querySelector('.design-studio'),{p,ui,room,floor}=viewInfo();if(!root)return t.innerHTML;root.classList.add('guided-studio');
  const heading=root.querySelector('.design-heading');if(heading)heading.innerHTML='<div class="guided-page-title"><span>THIẾT KẾ / KHÔNG GIAN</span><h1>Thiết kế 3D của bạn</h1><p>'+esc(p.site.width+' × '+p.site.depth+' m · '+p.site.floors+' tầng')+'</p></div>';
  const tabs=root.querySelector('.design-view-tabs'),view=(ui.sceneFocus||'all')==='all'?'exterior':room?'room':'layout';
  if(tabs)tabs.innerHTML=[['exterior','Ngoại thất'],['room','Nội thất'],['layout','Mặt bằng']].map(([id,label])=>'<button data-design-view="'+id+'" aria-pressed="'+(view===id)+'" class="'+(view===id?'active':'')+'">'+label+'</button>').join('');
  const controls=root.querySelector('.design-view-controls');if(controls){const advanced=[];for(const attr of ['data-scene-theme','data-scene-explode']){const node=controls.querySelector('['+attr+']');if(node){advanced.push(node.outerHTML);node.remove();}}if(view==='layout'){controls.insertAdjacentHTML('afterbegin',select('data-guided-layout-view','Cách xem',[['layout','3D tầng'],['drawing','Bản vẽ 2D']],ui.designView==='drawing'?'drawing':'layout'));}controls.insertAdjacentHTML('beforeend',menu('scene-options','Góc & ánh sáng',advanced.join('')+[['diagonal','Góc chéo'],['top','Từ trên'],['eye','Ngang tầm mắt']].map(([id,name])=>'<button data-camera-preset="'+id+'">'+name+'</button>').join(''),'settings'));}
  const brief=root.querySelector('.design-brief');
  if(brief&&room?.type!=='elevator'){
   const collection=B.interiorCollection(room?.id),colours=brief.querySelector('.design-brief-colors')?.outerHTML||'',surface=brief.querySelector('.design-surface-control')?.outerHTML||'',ai=brief.querySelector('[data-cinematic-render]')?.outerHTML||'',error=brief.querySelector('.design-error')?.outerHTML||'';
   const explanations=[...brief.querySelectorAll('details')].map(d=>{d.removeAttribute('open');return d.outerHTML;}).join('');
   brief.innerHTML='<span>PHONG CÁCH & VẬT LIỆU</span><h2>'+esc(room?.name||'Các phòng trong nhà')+'</h2>'+select('data-guided-collection','Bộ nội thất',B.INTERIOR_COLLECTIONS.map(c=>[c.id,c.name]),collection.id)+'<figure class="guided-collection-preview"><img src="assets/interior/collections/'+esc(collection.id)+'.jpg" alt="Phòng mẫu · '+esc(collection.name)+'" width="480" height="320"><figcaption>Phòng mẫu · '+esc(collection.name)+'</figcaption></figure>'+B.visualMaterialsQuickHtml()+B.guidedDetails('colours:'+room?.id,'Màu & chi tiết',colours+surface)+B.guidedDetails('ai-image','Phối cảnh AI',ai+'<p>Ảnh minh họa từ mô hình và góc đang xem.</p>')+error+B.guidedDetails('design-notes','Gợi ý thiết kế',explanations);
  }
  root.querySelector('.visual-materials')?.remove();
  wrap(root.querySelector('.interior-collections'),'collections','So sánh các phòng mẫu');
  wrap(root.querySelector('.design-room-list'),'rooms','Xem danh sách phòng');
  root.querySelector('.design-decision')?.remove();
  wrap(root.querySelector('[data-finish-open]'),'finish-photo','Hoàn thiện từ ảnh hiện trạng');
  return t.innerHTML;
 };B.SCREENS[5]=B.screen7;

 // Copy only a settled, displayed measured frame; no second WebGL/AI render on Next.
 B.customerFrameMatches=frame=>Boolean(frame&&frame.project===B.state.project&&frame.revision===B.drawingRevision()&&frame.designKey===B.cinematicSignature()&&frame.cameraKey&&frame.cameraKey===B.cinematicCameraKey());
 B.cacheCustomerFrame=()=>{
  B.customerFrameCache=null;const s=B.studio3d;if(!s?.renderer||s.raf||s.archRender||s.sharpExport||s.displayedCameraKey!==B.cinematicCameraKey()||s.displayedDesignKey!==B.cinematicSignature())return false;
  try{const source=s.renderer.domElement,scale=Math.min(1,960/Math.max(source.width,source.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(source.width*scale));canvas.height=Math.max(1,Math.round(source.height*scale));canvas.getContext('2d').drawImage(source,0,0,canvas.width,canvas.height);B.customerFrameCache={project:B.state.project,revision:B.drawingRevision(),designKey:B.cinematicSignature(),cameraKey:B.cinematicCameraKey(),dataUrl:canvas.toDataURL('image/png'),width:canvas.width,height:canvas.height};return true;}catch{return false;}
 };
 B.cachedCustomerFrame=()=>{const f=B.customerFrameCache;if(!B.customerFrameMatches(f))return null;const data=atob(f.dataUrl.split(',')[1]),bytes=Uint8Array.from(data,c=>c.charCodeAt(0));return {blob:new Blob([bytes],{type:'image/png'}),width:f.width,height:f.height};};
 const navigate=B.navigateTo;B.navigateTo=step=>{if(B.state.ui.step===6&&Number(step)===(B.workflowRoutes?.handover||10)){B.rememberFinishCamera();B.cacheCustomerFrame();}return navigate(step);};
 const dossier=B.screen10;
 B.screen10=()=>{
  const p=B.state.project,rooms=p.plan.rooms,frame=B.customerFrameMatches(B.customerFrameCache)?B.customerFrameCache:null,sheets=rooms.length?B.architecturalSheets():[],issues=B.plannerIssues(),errors=issues.filter(i=>i.sev==='error');
  return '<div class="guided-dossier"><div class="guided-page-title"><span>THIẾT KẾ / HỒ SƠ</span><h1>Hồ sơ của bạn</h1><p>Gom bản vẽ, số đo và vật liệu để gửi khách hoặc trao đổi thiết kế.</p></div><section class="guided-dossier-card"><div class="guided-dossier-cover">'+(frame?'<img src="'+esc(frame.dataUrl)+'" alt="Góc 3D của thiết kế hiện tại">':rooms.length?B.designPlanPreview(p.plan,0):'<p>Tạo mặt bằng để chuẩn bị hồ sơ.</p>')+'</div><div><span class="studio-eyebrow">BUILD MY HOME</span><h2>'+esc(p.name)+'</h2><p>'+esc(p.site.width+' × '+p.site.depth+' m · '+p.site.floors+' tầng')+'</p><p>'+rooms.length+' không gian · '+sheets.length+' tờ bản vẽ</p><div class="guided-dossier-actions"><button class="guided-primary" data-client-package '+(!rooms.length?'disabled':'')+'>Tải hồ sơ gửi khách · ZIP ↓</button><button data-export="drawing-pdf" '+(!rooms.length?'disabled':'')+'>In bản vẽ / Lưu PDF</button></div><p class="guided-hint">Gồm bản vẽ SVG, CAD DXF, bảng vật liệu và hồ sơ xem/in. '+(frame?'Có ảnh từ góc 3D vừa xem.':'Mở 3D rồi tới Hồ sơ để thêm ảnh phương án.')+'</p><p class="guided-hint">Phương án kiến trúc sơ bộ · cần KTS/KS và hãng thang máy xác nhận trước thi công.</p>'+(!rooms.length?'<button data-nav="4">Tạo mặt bằng →</button>':'')+'</div></section>'+(errors.length?'<div class="guided-errors" role="alert">'+errors.map(i=>'<p>'+esc(i.text)+'</p>').join(''):'')+(rooms.length?B.designDecisionHtml():'')+B.guidedDetails('handover-tools','Công cụ bàn giao nâng cao',dossier())+'</div>';
 };B.SCREENS[9]=B.screen10;

 document.addEventListener('toggle',e=>{const d=e.target;if(!d.matches?.('[data-guided-panel]')||!d.isConnected)return;const panels=B.state.ui.guidedPanels||={};if(panels[d.dataset.guidedPanel]!==d.open){panels[d.dataset.guidedPanel]=d.open;B.save();}},true);
 // Native toggle events are queued. Snapshot disclosures before an immediate edit redraw.
 const render=B.render;let renderedProject;
 B.render=opts=>{const project=B.state.project;if(renderedProject===project){const panels=B.state.ui.guidedPanels||={};let changed=false;for(const d of document.querySelectorAll('[data-guided-panel]')){if(panels[d.dataset.guidedPanel]!==d.open){panels[d.dataset.guidedPanel]=d.open;changed=true;}}if(changed)B.save();}const result=render(opts);renderedProject=project;return result;};
 const closeMenus=except=>document.querySelectorAll('[data-guided-menu][open]').forEach(d=>{if(d!==except&&!d.contains(except))d.open=false;});
 document.addEventListener('click',e=>{const picker=document.querySelector('.v64-bank-picker[open]');if(picker&&(e.target.closest?.('[data-bank]')||!picker.contains(e.target)))picker.open=false;},true);
 document.addEventListener('click',e=>{const d=e.target.closest?.('[data-guided-menu]');closeMenus(d);if(d&&e.target.closest?.('[data-camera-preset],[data-view-load]')){d.open=false;d.querySelector('summary')?.focus({preventScroll:true});}});
 document.addEventListener('keydown',e=>{if(e.key!=='Escape')return;const selector='[data-guided-menu][open],.v64-bank-picker[open]',d=document.activeElement?.closest?.(selector)||document.querySelector(selector);if(d){e.preventDefault();closeMenus(null);d.open=false;d.querySelector('summary')?.focus();}});
 document.addEventListener('change',e=>{
  const input=e.target,ui=B.state.ui,p=ui.planner;
  if(input.matches?.('[data-guided-collection]')){const {room}=viewInfo();if(B.applyInteriorCollection(input.value,room?.id||null)){ui.renderMode='interactive';B.render({preserveScroll:true});}return;}
  if(input.matches?.('[data-guided-layout-view]')){B.rememberFinishCamera();ui.designView=input.value;const {floor}=viewInfo();ui.sceneFocus='floor:'+floor;B.save();B.render({preserveScroll:true});return;}
  if(input.matches?.('[data-guided-floor]')){p.floor=B.clamp(Number(input.value)||0,0,B.state.project.site.floors-1);p.view='plan';p.selected=B.floorRooms(p.floor)[0]?.id||null;}
  else if(input.matches?.('[data-guided-plan-view]')){p.view=input.value;p.zoom=1;p.openingPage=0;p.tool='select';if(p.view==='stairs'){const {room}=B.stairDrawingSelection();if(room){p.floor=room.floor;p.selected=p.stairDrawingId=room.id;}}}
  else if(input.matches?.('[data-guided-plan-tool]'))p.tool=input.value;
  else if(input.matches?.('[data-guided-presentation]'))p.mode=input.value;
  else return;
  B.save();B.render({preserveScroll:true});
 });
})();
