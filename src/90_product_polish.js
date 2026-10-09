/* Keep measured geometry alive while changing finishes; connect supplier choices to previews. */
(()=>{
 const B=BMH,roles={floor:['floor'],wall:['wall'],accent:['wood','slattedWood'],fabric:['fabric']};
 const regularRooms=()=>B.state.project.plan.rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type));
 B.studioStructureKey=()=>{
  const p=B.state.project,u=B.state.ui;
  return JSON.stringify({site:p.site,style:p.style,plan:p.plan,choices:p.materials.choices,tier:p.materials.tier,focus:u.sceneFocus,theme:u.sceneTheme,exploded:u.sceneExploded,roomCamera:u.roomCamera,exteriorCamera:u.exteriorCamera,collections:p.plan.rooms.map(r=>{const c=B.interiorCollection?.(r.id);return [r.id,c?.id,c?.shape,c?.table];})});
 };
 B.refreshStudioBrief=()=>{
  const old=document.querySelector('.design-brief');if(!old)return;
  const panels=B.state.ui.guidedPanels||={};let changed=false;
  for(const d of old.querySelectorAll('[data-guided-panel]'))if(panels[d.dataset.guidedPanel]!==d.open){panels[d.dataset.guidedPanel]=d.open;changed=true;}
  if(changed)B.save();
  const focused=old.contains(document.activeElement)?document.activeElement?.dataset.visualMaterialSelect:'';
  const t=document.createElement('template');t.innerHTML=B.screen7();const next=t.content.querySelector('.design-brief');if(!next)return;
  old.replaceWith(next);if(focused)next.querySelector('[data-visual-material-select="'+focused+'"]')?.focus({preventScroll:true});
 };
 B.refreshStudioFinishes=(role,roomId)=>{
  const started=performance.now(),s=B.studio3d,p=B.state.project,slots=roles[role],key=B.studioStructureKey();
  if(!slots||B.state.ui.step!==6||!s?.THREE||s.project!==p||!s.renderer.domElement.isConnected||s.scene.userData.disposed||s.archRender||s.sharpExport||!s.structureKey||s.structureKey!==key)return false;
  const target=new Set((roomId?p.plan.rooms.filter(r=>r.id===roomId):regularRooms()).map(r=>r.id)),changes=[],sets=new Map();let unknown=false;
  const focused=p.plan.rooms.find(r=>'room:'+r.id===B.state.ui.sceneFocus);
  const materials=(id,item)=>{const key=item?.id||id;if(!sets.has(key))sets.set(key,B.sceneAssetMaterials(s.THREE,s.scene,{...(item&&B.furnitureFinishPalette?B.furnitureFinishPalette(item):B.finishPalette(id)),...(id?{surface:B.roomSurfaceStyle(id)}:{})}));return sets.get(key);};
  s.scene.traverse(mesh=>{
   let parent=mesh,id,furniture;while(parent){id||=parent.userData.roomId;if(parent.userData.kind==='furniture')furniture=parent.userData.placement;parent=parent.parent;}
   if(mesh.userData.source==='glb'&&target.has(id)){unknown=true;return;}
   if(!mesh.isMesh)return;
   if(mesh.userData.kind==='wall')id=focused?.id||(mesh.userData.roomIds||[]).find(id=>p.materials.finish?.rooms?.[id]);
   if(!target.has(id)&&!(role==='wall'&&!roomId&&!id))return;
   const faces=Array.isArray(mesh.material)?mesh.material.map((old,index)=>({old,index})):[{old:mesh.material,index:null}];
   for(const {old,index}of faces){const slot=old?.userData.finishSlot;if(!slots.includes(slot))continue;
   const source=materials(id,furniture)[slot];if(!source||source===old)continue;
   // A cutaway wall owns its clipping plane; never attach it to a shared room material.
   const next=old.clippingPlanes?.length||old.userData.bmhWallView?source.clone():source;
   if(next!==source){next.clippingPlanes=old.clippingPlanes;next.clipShadows=old.clipShadows;next.side=old.side;}
   B.prepareModelMaterial?.(next,old,mesh,s.scene);changes.push({mesh,index,old,next,owned:next!==source});}
  });
  if(unknown){for(const {next,owned}of changes)if(owned)next.dispose();return false;}
  if(!changes.length)return false;
  const retired=new Set();
  for(const {mesh,index,old,next}of changes){if(index===null)mesh.material=next;else mesh.material[index]=next;B.sceneSurfaceUvs(mesh.geometry,next,mesh.position);retired.add(old);}
  const used=new Set();s.scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])used.add(m);});
  // Retain templates that still serve a mesh; release obsolete selections without releasing shared textures.
  for(const [cacheKey,entry]of s.scene.userData.finishMaterials||[]){if(Object.values(entry).some(m=>used.has(m)))continue;s.scene.userData.finishMaterials.delete(cacheKey);for(const m of Object.values(entry))if(m?.isMaterial)retired.add(m);}
  for(const m of retired)if(!used.has(m)&&![...(s.scene.userData.finishMaterials?.values()||[])].some(entry=>Object.values(entry).includes(m)))m.dispose();
  B.pendingFinishCamera=null;B.customerFrameCache=null;(s.requestRender||s.renderFrame).call(s);B.refreshCinematicHero();
  s.lastFinishUpdate={role,meshes:changes.length,ms:Math.round(performance.now()-started)};
  B.refreshStudioBrief();
  const status=document.querySelector('[data-finish-update-status]');if(status)status.textContent='Đã cập nhật '+({floor:'sàn',wall:'tường',accent:'gỗ & tủ',fabric:'sofa & vải'}[role])+'.';
  Promise.allSettled(s.scene.userData.surfaceLoads||[]).then(()=>{if(B.studio3d===s&&s.project===B.state.project&&!s.scene.userData.disposed)(s.requestRender||s.renderFrame).call(s);});
  return true;
 };
 const categories={floor:{role:'floor',profile:'ivory-tile',label:'Sàn'},paint:{role:'wall',profile:'ivory-paint',label:'Sơn tường'},cabinetry:{role:'accent',profile:'natural-oak',label:'Gỗ & tủ'}};
 B.selectedShowroomProduct=category=>{
  const id=B.state.project.materials.choices[category],product=B.state.project.dataEngine?.materialOverrides?.[id]?.product||B.materialResearch?.products.find(x=>x.id===id);
  return product&&product.id===id&&product.category===category?product:null;
 };
 B.showroomFinishInfo=roomId=>{
  const palette=B.finishPalette(roomId),bindings=palette.catalogMaterials||{};
  return Object.entries(categories).flatMap(([category,config])=>{
   const binding=bindings[category],product=B.selectedShowroomProduct(category);
   if(!binding||!product||!B.catalogBindingStatus?.(category,binding,product,palette).valid)return [];
   const profile=B.VISUAL_MATERIALS.find(p=>p.id===(binding.visualProfileId||binding.profileId)&&p.role===config.role);
   return profile?[{category,id:product.id,name:product.name,sku:product.sku||'',profileId:profile.id,profileName:profile.name,exactness:'generic'}]:[];
  });
 };
 B.showroomPreviewHtml=category=>{
  const config=categories[category],product=B.selectedShowroomProduct(category);if(!config||!product)return '';
  const esc=B.esc,rooms=regularRooms(),room=rooms.find(r=>'room:'+r.id===B.state.ui.sceneFocus)||rooms.find(r=>r.type==='living')||rooms[0],palette=B.finishPalette(room?.id),applied=B.showroomFinishInfo(room?.id).find(x=>x.category===category),profile=B.VISUAL_MATERIALS.find(p=>p.id===(applied?.profileId||config.profile)),binding=palette.catalogMaterials?.[category],status=B.catalogBindingStatus?.(category,binding,product,palette);
  const scope='<label>Phạm vi áp dụng<select data-showroom-scope="'+category+'"><option value="unassigned">Phòng chưa chọn riêng</option>'+rooms.map(r=>'<option value="room:'+esc(r.id)+'">Tầng '+(r.floor+1)+' · '+esc(r.name)+'</option>').join('')+'<option value="all">Toàn nhà · thay bề mặt đã chọn</option></select></label>';
  return '<section class="showroom-preview" aria-label="Vật liệu đã chọn và bề mặt 3D"><i class="finish-swatch finish-'+profile.kind+'" style="--finish-color:'+profile.color+'" aria-hidden="true"></i><div><span>'+esc(config.label)+' đã chọn</span><h3>'+esc(product.name)+'</h3><small>'+esc(product.sku||'Chưa có mã hàng')+'</small><label>Bề mặt mô phỏng<select data-showroom-profile="'+category+'">'+B.VISUAL_MATERIALS.filter(p=>p.role===config.role).map(p=>'<option value="'+p.id+'" '+(p.id===profile.id?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></label>'+scope+'<p>Bề mặt mô phỏng chung, chưa phải ảnh hoặc texture đúng mã hàng. Báo giá giữ theo sản phẩm đã chọn.</p>'+(status?.status==='stale'?'<p role="status">'+esc(status.reason)+'</p>':'')+'<button type="button" data-showroom-3d="'+category+'" '+(!room?'disabled':'')+'>Áp dụng & xem 3D →</button>'+(!room?'<small>Tạo phòng ở mục Bản vẽ để xem vật liệu trong 3D.</small>':'')+'</div></section>';
 };
 B.styleMaterialBriefHtml=category=>{
  const spec=B.styleSpecification();if(!spec)return '<p class="style-material-brief">Phong cách riêng: cần chốt mẫu vật liệu trước khi xác nhận phù hợp.</p>';
  const roles=B.styleMaterialMatrix().filter(x=>x.category===category),esc=B.esc;if(!roles.length)return '';
  return '<section class="style-material-brief" aria-label="Vật liệu theo phong cách"><span>VẬT LIỆU THEO PHONG CÁCH</span><h3>'+esc(spec.name)+'</h3><p>'+roles.map(r=>'<b>'+esc(r.name)+'</b>: '+esc(r.intent)).join('<br>')+'</p><details><summary>Quy cách cần chốt & cách tiết kiệm</summary>'+roles.map(r=>'<p><b>'+esc(r.name)+'</b> · '+r.requirements.map(esc).join(' · ')+'</p>').join('')+'<p>'+esc(spec.budgetOptions.economy)+'</p><small>Chưa tính mức tiết kiệm khi thiếu báo giá cùng quy cách. Màu và vật liệu bạn đã chọn được giữ.</small></details><small>Gợi ý BMH; đối chiếu mẫu hãng trước khi chốt mã hàng.</small></section>';
 };
 // Explicit catalogue suggestions are filterable; unreviewed products stay visible
 // with their uncertainty, rather than silently being called compatible.
 B.materialStyleFits=product=>!['different-style','different-role','unknown-style','missing-product'].includes(B.styleMaterialCompatibility(product).status);
 const productCard=B.webProductCard;if(productCard)B.webProductCard=product=>{
  const status=B.styleMaterialCompatibility(product),label=status.status==='design-suggestion'?'Gợi ý theo phong cách':status.status==='different-style'?'Gợi ý cho phong cách khác':'Cần đối chiếu mẫu';
  return productCard(product).replace('<h3>','<small class="style-material-status" title="'+B.esc(status.reason)+'">'+label+'</small><h3>');
 };
 const catalog=B.materialCatalogHtml;if(catalog)B.materialCatalogHtml=category=>{const brief=B.styleMaterialBriefHtml(category),preview=B.showroomPreviewHtml(category),alternatives=catalog(category);return brief+preview+(preview&&B.guidedDetails?B.guidedDetails('showroom:'+category,'So sánh sản phẩm khác',alternatives):alternatives);};
 const studio=B.screen7;B.screen7=()=>{
  let html=studio();const room=B.state.project.plan.rooms.find(r=>'room:'+r.id===B.state.ui.sceneFocus),info=B.showroomFinishInfo(room?.id),esc=B.esc;
  const selected=info.length?'<section class="studio-supplier-choice"><b>Sản phẩm đã chọn</b>'+info.map(x=>'<p>'+esc(x.name)+'<small>'+esc([x.sku,'Mô phỏng: '+x.profileName].filter(Boolean).join(' · '))+'</small></p>').join('')+'<a href="#" data-nav="5">Mở showroom →</a></section>':'';
  return html.replace('<div class="visual-material-quick">',selected+'<div class="visual-material-quick">').replace('Đổi vân, độ nhám và độ bóng ngay trong 3D.</small>','Đổi vân, độ nhám và độ bóng ngay trong 3D.</small><output data-finish-update-status role="status" aria-live="polite"></output>');
 };B.SCREENS[5]=B.screen7;
 document.addEventListener('change',e=>{const select=e.target;if(!select.matches?.('[data-showroom-profile]'))return;const profile=B.VISUAL_MATERIALS.find(p=>p.id===select.value),swatch=select.closest('.showroom-preview')?.querySelector('.finish-swatch');if(profile&&swatch){swatch.className='finish-swatch finish-'+profile.kind;swatch.style.setProperty('--finish-color',profile.color);}});
 document.addEventListener('click',e=>{
  const button=e.target.closest?.('[data-showroom-3d]');if(!button)return;
  const category=button.getAttribute('data-showroom-3d'),config=categories[category],product=B.selectedShowroomProduct(category),preview=button.closest('.showroom-preview'),profileId=preview?.querySelector('[data-showroom-profile]')?.value,target=preview?.querySelector('[data-showroom-scope]')?.value||'unassigned',rooms=regularRooms(),roomId=target.startsWith('room:')?target.slice(5):undefined,scope=roomId?'room':target;
  if(!config||!product||!rooms.length)return;
  if(!B.applyCatalogMaterial?.(category,profileId,{roomId,scope})){B.toast('Chọn phòng cần áp dụng; các bề mặt đã chọn riêng được giữ lại.');return;}
  const current=rooms.find(r=>r.id===roomId)||rooms.find(r=>B.showroomFinishInfo(r.id).some(x=>x.category===category))||rooms.find(r=>r.type==='living')||rooms[0];
  B.state.ui.designView='room';B.state.ui.sceneFocus='room:'+current.id;B.state.ui.roomCamera='inside';B.state.ui.modelLook='materials';B.save();B.navigateTo(6);
 });
 const status=B.projectSaveStatus;if(status)B.projectSaveStatus=()=>{status();const p=B.projects,node=document.querySelector('.guided-footer>span');if(node){node.textContent=p.error?'Chưa lưu được. Mở Dự án để tải bản sao.':p.busy?'Đang lưu thiết kế trên thiết bị…':p.dirty?'Có thay đổi · Đang chờ lưu…':'Thiết kế đã lưu trên thiết bị.';node.dataset.state=p.error?'error':p.busy||p.dirty?'pending':'saved';}};
})();
