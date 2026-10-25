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
 B.catalogProductSample=product=>{
  if(!product?.id||!product.category)return null;
  const p=B.state.project,focus=B.state.ui.sceneFocus,rooms=regularRooms(),explicitRoom=typeof focus==='string'&&focus.startsWith('room:'),room=rooms.find(r=>'room:'+r.id===focus)||(!explicitRoom&&focus!=='all'?(rooms.find(r=>r.type==='living')||rooms[0]):null);
  const palette=focus==='all'?(B.facadeFinishPalette?.()||B.resolveFacadeMaterialBindings?.(p.materials.finish?.exterior||{})||{}):room?B.finishPalette(room.id):null;
  if(!palette)return null;const binding=palette.catalogMaterials?.[product.category];
  if(binding?.productId!==product.id||!B.catalogBindingStatus?.(product.category,binding,product,palette).valid)return null;
  const sample=B.materialSampleForBinding?.(binding);if(sample)return {roomId:room?.id||null,name:room?.name||'Ngoại thất',palette,binding,sample};
  return null;
 };
 B.showroomFinishInfo=roomId=>{
  const palette=roomId?B.finishPalette(roomId):B.facadeFinishPalette?.()||B.resolveFacadeMaterialBindings?.(B.state.project.materials.finish?.exterior||{})||B.finishPalette(),bindings=palette.catalogMaterials||{};
  return Object.entries(categories).flatMap(([category,config])=>{
   const binding=bindings[category],product=B.catalogBoundProduct(category,binding);
   if(!binding||!product||!B.catalogBindingStatus?.(category,binding,product,palette).valid)return [];
   const profile=B.VISUAL_MATERIALS.find(p=>p.id===(binding.visualProfileId||binding.profileId)&&p.role===config.role);
   const status=B.catalogBindingStatus(category,binding,product,palette);
   return profile?[{category,id:product.id,name:product.name,sku:product.sku||'',profileId:profile.id,profileName:profile.name,exactness:status.exactness,sampleStatus:status.status,sampleScale:binding.sample?.realWorldScale||null}]:[];
  });
 };
 // Original photographs are labelled independently of the supplier catalogue.
 // These are licensed surface studies, never invented photos of a chosen SKU.
 B.MATERIAL_PHOTOS=[
  {id:'wood_floor',name:'Sàn gỗ · ảnh bề mặt gốc',category:'floor',profileId:'oak-floor'},
  {id:'marble_01',name:'Đá lát · ảnh bề mặt gốc',category:'floor',profileId:'white-marble'},
  {id:'terrazzo_tiles',name:'Terrazzo · ảnh bề mặt gốc',category:'floor',profileId:'ivory-terrazzo'},
  {id:'concrete_floor_02',name:'Bê tông · ảnh bề mặt gốc',category:'floor',profileId:'grey-concrete'},
  {id:'white_plaster_02',name:'Vữa khoáng · ảnh bề mặt gốc',category:'paint',profileId:'ivory-paint'},
  {id:'wood_table_001',name:'Gỗ hoàn thiện · ảnh bề mặt gốc',category:'cabinetry',profileId:'natural-oak'},
  {id:'terlenka',name:'Vải dệt · ảnh bề mặt gốc',category:'cabinetry',profileId:'natural-linen'},
  {id:'brown_leather',name:'Da nâu · ảnh bề mặt gốc',category:'cabinetry',profileId:'cognac-leather'},
  {id:'brick_wall_001',name:'Gạch xây · ảnh bề mặt gốc',category:'brick'}
 ];
 B.applyMaterialPhoto=(photoId,roomId)=>{
  const photo=B.MATERIAL_PHOTOS.find(p=>p.id===photoId),profile=B.VISUAL_MATERIALS.find(p=>p.id===photo?.profileId),room=regularRooms().find(r=>r.id===roomId);
  if(!photo||!profile||!room)return false;
  return B.applyVisualMaterial(profile.role,profile.id,room.id);
 };
 B.showroomChoiceContext=()=>{
  const rooms=regularRooms(),room=rooms.find(r=>'room:'+r.id===B.state.ui.sceneFocus)||rooms.find(r=>r.type==='living')||rooms[0],category=['floor','paint','cabinetry'].includes(B.state.ui.materialCategory)?B.state.ui.materialCategory:'floor';
  return {rooms,room,category,palette:room?B.finishPalette(room.id):null};
 };
 B.selectShowroomFinish=(profileId,roomId)=>{
  const profile=B.VISUAL_MATERIALS.find(p=>p.id===profileId),room=regularRooms().find(r=>r.id===roomId);if(!profile||!room)return false;
  if(!B.applyVisualMaterial(profile.role,profile.id,room.id))return false;
  B.state.ui.sceneFocus='room:'+room.id;B.save();return true;
 };
 B.openShowroomFinishPreview=roomId=>{if(!regularRooms().some(r=>r.id===roomId))return false;B.state.ui.sceneFocus='room:'+roomId;B.state.ui.sceneExploded=false;B.state.ui.designView='room';B.state.ui.roomCamera='inside';B.state.ui.modelLook='materials';B.save();B.navigateTo(6);return true;};
 B.showroomRoomSample=(role,roomId)=>{
  if(!regularRooms().some(r=>r.id===roomId))return null;const category=Object.keys(categories).find(k=>categories[k].role===role);if(!category)return null;
  const palette=B.finishPalette(roomId),binding=palette.catalogMaterials?.[category],product=B.catalogBoundProduct?.(category,binding);
  if(!product||!B.catalogBindingStatus?.(category,binding,product,palette).valid)return null;const sample=B.materialSampleForBinding?.(binding);
  return sample?{sample,product,binding}:null;
 };
 B.saveShowroomSample=async(category,options)=>{
  const project=B.state.project,result=await B.applyCatalogSample(category,options);if(!result.ok)return result;
  if(B.state.project!==project||B.state.ui.step!==5)return {...result,showInMaterials:false};
  B.state.ui.sceneFocus=options.scope==='exterior'?'all':'room:'+options.roomId;B.save();return {...result,showInMaterials:true};
 };
 B.applyShowroomProduct=(category,profileId,target)=>{
  if(typeof target!=='string')return false;const roomId=target.startsWith('room:')?target.slice(5):null,scope=target.startsWith('room:')?'room':target;
  if(!B.applyCatalogMaterial?.(category,profileId,{roomId,scope}))return false;
  if(scope==='exterior')B.state.ui.sceneFocus='all';else{const room=regularRooms().find(r=>r.id===roomId)||regularRooms().find(r=>'room:'+r.id===B.state.ui.sceneFocus)||regularRooms()[0];if(room)B.state.ui.sceneFocus='room:'+room.id;}
  B.save();return true;
 };
 B.openShowroomProductPreview=(category,profileId,target)=>{
  if(typeof target!=='string'||!categories[category])return false;
  const exterior=target==='exterior',aggregate=['all','unassigned'].includes(target),rooms=regularRooms(),product=B.selectedShowroomProduct(category);
  const matches=palette=>{const binding=palette?.catalogMaterials?.[category];return !!binding&&binding.visualProfileId===profileId&&!!B.catalogBindingStatus?.(category,binding,product,palette).valid;};
  let roomId=target.startsWith('room:')?target.slice(5):null;
  if(aggregate){
   const matched=rooms.filter(r=>matches(B.finishPalette(r.id)));
   if(!matched.length||target==='all'&&matched.length!==rooms.length)return false;
   roomId=(matched.find(r=>'room:'+r.id===B.state.ui.sceneFocus)||matched[0]).id;
  }else if(!exterior&&!rooms.some(r=>r.id===roomId))return false;
  const palette=exterior?B.facadeFinishPalette?.()||B.resolveFacadeMaterialBindings?.(B.state.project.materials.finish?.exterior||{}):B.finishPalette(roomId);
  if(!matches(palette))return false;
  if(!exterior)return B.openShowroomFinishPreview(roomId);
  B.state.ui.sceneFocus='all';B.state.ui.sceneExploded=false;B.state.ui.designView='exterior';B.state.ui.modelLook='materials';B.save();B.navigateTo(6);return true;
 };
 B.saveAndPreviewShowroomProduct=(category,profileId,target)=>{
  if(!B.applyShowroomProduct(category,profileId,target))return {saved:false,opened:false};
  return {saved:true,opened:B.openShowroomProductPreview(category,profileId,target)};
 };
 B.materialSampleDetails=mediaId=>{
  const p=B.state.project,f=p.materials.finish||{},rows=[{name:'Ngoại thất',bindings:f.exterior?.facadeMaterials},...regularRooms().map(r=>({name:r.name,bindings:B.finishPalette(r.id)?.catalogMaterials}))];
  for(const row of rows)for(const [category,binding]of Object.entries(row.bindings||{})){
   if(binding?.sample?.mediaId!==mediaId)continue;const product=B.catalogBoundProduct?.(category,binding),match=product&&B.catalogProductSample(product);
   // Use the same active-scope resolver as the image card. Shared image IDs
   // must not pick another room's scale/source or reopen a stale room's image.
   if(match?.binding.sample?.mediaId===mediaId)return {name:match.name,product,binding:match.binding,sample:match.sample};
  }
  return null;
 };
 B.openMaterialSample=mediaId=>{
  const match=B.materialSampleDetails(mediaId);if(!match)return false;const {product,binding,sample,name}=match,esc=B.esc,focus=document.activeElement,dialog=document.createElement('dialog');
  dialog.className='material-sample-dialog';dialog.setAttribute('aria-label','Ảnh mẫu bề mặt '+(product.sku||product.name));
  dialog.innerHTML='<form method="dialog"><button aria-label="Đóng ảnh mẫu">Đóng ×</button></form><h2>'+esc(product.sku||product.name)+'</h2><p>Ảnh mẫu bề mặt · '+esc(name)+'</p><img src="'+esc(sample.image.src)+'" alt="Ảnh mẫu bề mặt '+esc(product.sku||product.name)+'"><p>'+esc(binding.specification||'Chưa xác nhận quy cách')+'<br>Phần ảnh đại diện: '+binding.sample.realWorldScale.map(n=>Math.round(n*1000)).join(' × ')+' mm · Góc vân '+binding.sample.rotationDeg+'°</p><p>Nguồn: '+esc(binding.sample.sourceReference)+'</p><small>Ảnh khách cung cấp; độ nhám và phản xạ trong 3D vẫn mô phỏng.</small>';
  dialog.addEventListener('close',()=>{dialog.remove();if(focus?.isConnected)focus.focus();},{once:true});document.body.appendChild(dialog);dialog.showModal();return true;
 };
 // Comparison is read-only and local to the Materials panel.
 B.showroomFinishComparisonHtml=(roomId,role='floor',candidateId=null)=>{
  const room=regularRooms().find(r=>r.id===roomId),labels={floor:'Sàn',wall:'Tường',accent:'Gỗ & tủ',fabric:'Sofa & vải'};
  if(!room||!labels[role])return '<p role="status">Phòng hoặc bề mặt đã đổi. Chọn lại phòng để so sánh.</p>';
  const esc=B.esc,palette=B.finishPalette(roomId),profiles=B.VISUAL_MATERIALS.filter(p=>p.role===role),current=profiles.find(p=>p.id===palette.visualMaterials?.[role]),candidate=profiles.find(p=>p.id===candidateId)||profiles.find(p=>p.id!==current?.id)||profiles[0],sample=B.showroomRoomSample(role,roomId);
  const card=(profile,isCurrent)=>{
   const match=isCurrent&&sample,colour=isCurrent?palette[role]:profile?.color,validColour=/^#[0-9a-f]{6}$/i.test(colour||'')?colour:null;
   const visual=match?'<i class="finish-swatch showroom-sample-preview"><img src="'+esc(match.sample.image.src)+'" alt="Ảnh mẫu của '+esc(room.name)+'"></i>':isCurrent&&!profile?'<i class="finish-swatch" style="background:'+(validColour||'#e5e8e2')+'"></i>':B.finishSampleHtml(isCurrent&&validColour?{...profile,color:validColour}:profile);
   const scale=match?match.binding.sample.realWorldScale:profile?.scale,name=match?'Ảnh mẫu · '+(match.product.sku||match.product.name):isCurrent&&!profile?'Màu riêng của phòng':profile?.name+(isCurrent&&validColour&&colour.toLowerCase()!==profile?.color.toLowerCase()?' · màu riêng':'');
   return '<article data-finish-comparison-side="'+(isCurrent?'current':'candidate')+'"><small>'+(isCurrent?'Đang dùng trong '+esc(room.name):'Mẫu đang xem · chưa áp dụng')+'</small>'+visual+'<b>'+esc(name||'Theo phong cách')+'</b><p>'+esc(match?'Ảnh mẫu bề mặt khách cung cấp':profile?.detail||'Chưa gắn mẫu vân riêng')+'</p><small>Màu mô phỏng: '+esc(validColour||'Chưa xác định')+'<br>'+(scale?(match?'Phần ảnh đại diện: ':'Ô lặp mô phỏng: ')+scale.map(n=>Math.round(n*1000)).join(' × ')+' mm':'Tỷ lệ mẫu chưa xác định')+(match?'<br>Góc vân: '+match.binding.sample.rotationDeg+'°<br>Nguồn: '+esc(match.binding.sample.sourceReference):'')+'</small></article>';
  };
  return '<div class="showroom-compare-controls"><label>Bề mặt<select data-finish-compare-role>'+Object.entries(labels).map(([id,name])=>'<option value="'+id+'" '+(id===role?'selected':'')+'>'+name+'</option>').join('')+'</select></label><label>Mẫu muốn so sánh<select data-finish-compare-candidate>'+profiles.map(p=>'<option value="'+p.id+'" '+(p.id===candidate.id?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></label></div><div class="showroom-compare-grid">'+card(current,true)+card(candidate,false)+'</div><p>So sánh chỉ để xem. Chọn mẫu ở bảng phía trên khi muốn áp dụng. Màu trên màn hình và phản xạ 3D là mô phỏng; đối chiếu mẫu thực trước khi đặt hàng.</p>';
 };
 B.showroomChoiceBoardHtml=()=>{
  const {rooms,room,category,palette}=B.showroomChoiceContext(),esc=B.esc,labels={floor:'Sàn',wall:'Tường',accent:'Gỗ & tủ',fabric:'Sofa & vải'},roles=category==='floor'?['floor']:category==='paint'?['wall']:['accent','fabric'];
  const photoKinds={wood:'wood_table_001',plank:'wood_floor',marble:'marble_01',plaster:'white_plaster_02',fabric:'terlenka',leather:'brown_leather',concrete:'concrete_floor_02',terrazzo:'terrazzo_tiles'};
  const customColour=profile=>/^#[0-9a-f]{6}$/i.test(palette?.[profile.role]||'')&&palette[profile.role].toLowerCase()!==profile.color.toLowerCase(),picked=profile=>palette?.visualMaterials?.[profile.role]===profile.id,samples=Object.fromEntries(Object.keys(labels).map(role=>[role,room?B.showroomRoomSample(role,room.id):null])),thumb=profile=>{const match=picked(profile)&&samples[profile.role];return match?'<i class="finish-swatch showroom-sample-preview"><img data-showroom-room-sample src="'+esc(match.sample.image.src)+'" alt="Ảnh mẫu đã gắn · '+esc(match.product.sku||match.product.name)+'"></i>':B.finishSampleHtml(picked(profile)&&customColour(profile)?{...profile,color:palette[profile.role]}:profile);};
  return '<section class="showroom-choice-board" aria-label="Chọn vật liệu bằng hình ảnh"><header><div><span>CHỌN BẰNG HÌNH ẢNH</span><h2>Phối vật liệu trước, xem 3D sau.</h2><p>Chọn phòng rồi bấm vào mẫu bạn thích. Bạn có thể phối tiếp ngay tại đây.</p></div><label>Phòng áp dụng<select data-showroom-choice-room '+(!rooms.length?'disabled':'')+'>'+(!rooms.length?'<option>Chưa có phòng</option>':rooms.map(r=>'<option value="'+esc(r.id)+'" '+(r===room?'selected':'')+'>T'+(r.floor+1)+' · '+esc(r.name)+'</option>').join(''))+'</select></label></header>'+
   '<nav class="showroom-choice-tabs" aria-label="Nhóm bề mặt">'+[['floor','Sàn'],['paint','Tường'],['cabinetry','Gỗ, tủ & vải']].map(([id,name])=>'<button type="button" data-material-view="'+id+'" aria-pressed="'+(id===category)+'">'+name+'</button>').join('')+'</nav>'+
   (!rooms.length?'<p role="status">Dựng phòng theo kích thước trước, sau đó chọn vật liệu và xem cùng thiết kế trong 3D.</p><button type="button" data-nav="4" class="showroom-primary">Mở bản vẽ để dựng nhà →</button>':'')+
   '<div class="showroom-choice-grid">'+B.VISUAL_MATERIALS.filter(p=>roles.includes(p.role)).map(profile=>{const photo=photoKinds[profile.kind],active=picked(profile);return '<article data-finish-choice="'+profile.id+'" '+(active?'class="selected"':'')+'><button type="button" data-showroom-finish="'+profile.id+'" aria-pressed="'+active+'" aria-label="Chọn '+esc(profile.name)+' cho '+labels[profile.role]+'" '+(!room?'disabled':'')+'>'+thumb(profile)+'<span class="showroom-choice-name">'+esc(profile.name)+'<small>'+labels[profile.role]+' · '+(active?'Đang chọn':'Bấm để chọn')+'</small></span></button><small class="showroom-choice-basis">'+(active&&samples[profile.role]?'Ảnh mẫu đã gắn · '+esc(samples[profile.role].product.sku||samples[profile.role].product.name):photo?'Ảnh bề mặt · phối màu BMH':'Mẫu bề mặt mô phỏng')+'</small><details><summary>Xem mẫu & thông tin</summary><p>'+esc(profile.detail)+'</p><p>Ô lặp mô phỏng '+profile.scale.map(n=>Math.round(n*1000)).join(' × ')+' mm</p>'+(photo?'<a href="assets/interior/photos/'+photo+'.jpg" target="_blank" rel="noopener">Xem ảnh bề mặt gốc ↗</a>':'')+'</details></article>';}).join('')+'</div>'+
   (room?'<details class="showroom-finish-comparison" data-finish-compare-room="'+esc(room.id)+'"><summary>So sánh mẫu trước khi chọn</summary><div data-finish-compare-content>'+B.showroomFinishComparisonHtml(room.id,roles[0])+'</div></details>':'')+
   '<footer><div><b>Bộ phối của '+esc(room?.name||'phòng đang chọn')+'</b><div class="showroom-chosen-finishes">'+Object.entries(labels).map(([role,name])=>{const profile=B.VISUAL_MATERIALS.find(v=>v.id===palette?.visualMaterials?.[role]&&v.role===role);return '<div data-picked-finish="'+role+'">'+(profile?thumb(profile):'<i class="showroom-custom-colour" style="background:'+esc(/^#[0-9a-f]{6}$/i.test(palette?.[role]||'')?palette[role]:'#e5e8e2')+'"></i>')+'<span><small>'+name+'</small><b>'+esc(profile?profile.name+(customColour(profile)?' · màu riêng':''):(room?'Màu riêng / theo phong cách':'Chưa chọn phòng'))+'</b></span></div>';}).join('')+'</div></div><button type="button" data-showroom-choice-view '+(!room?'disabled':'')+'>Xem bộ phối trong 3D →</button></footer><p class="showroom-choice-notice">Mẫu phối bề mặt, chưa phải ảnh đúng mã hàng (SKU). Ảnh gốc và texture có nguồn CC0; màu hoàn thiện và phản xạ là mô phỏng. Chọn sản phẩm hãng và báo giá ở danh mục bên dưới.</p></section>';
 };
 B.materialPhotoGallery=category=>{
  const matching=B.MATERIAL_PHOTOS.filter(p=>p.category===category),photos=matching.length?matching:B.MATERIAL_PHOTOS.filter(p=>['wood_floor','marble_01','white_plaster_02','brick_wall_001'].includes(p.id));
  const rooms=regularRooms(),selected=rooms.find(r=>'room:'+r.id===B.state.ui.sceneFocus)||rooms.find(r=>r.type==='living')||rooms[0],esc=B.esc;
  return '<section class="material-photo-library" aria-label="Ảnh bề mặt vật liệu thật"><header><span>ẢNH BỀ MẶT THẬT</span><h3>'+ (matching.length?'Chọn bề mặt để xem trong phòng':'Ảnh bề mặt tham khảo khác')+'</h3><p>'+ (matching.length?'Ảnh chụp/quét bề mặt gốc. Mô hình dùng bộ vân, độ nhám và pháp tuyến tương ứng; màu hoàn thiện theo mẫu BMH.':'Danh mục này chưa có ảnh bề mặt riêng; các ảnh dưới chỉ tham khảo, không phải mẫu sản phẩm đang chọn.')+'</p></header>'+(rooms.length&&matching.length?'<label class="material-photo-target">Phòng xem thử<select data-material-photo-room>'+rooms.map(r=>'<option value="'+esc(r.id)+'" '+(r===selected?'selected':'')+'>T'+(r.floor+1)+' · '+esc(r.name)+'</option>').join('')+'</select></label>':matching.length?'<p>Tạo phòng ở mục Bản vẽ để áp dụng bề mặt.</p>':'')+'<div class="material-photo-grid">'+photos.map(p=>{const profile=matching.length?B.VISUAL_MATERIALS.find(v=>v.id===p.profileId):null,role={floor:'Sàn',wall:'Tường',accent:'Gỗ & tủ',fabric:'Sofa & vải'}[profile?.role];return '<article><a href="assets/interior/photos/'+p.id+'.jpg" target="_blank" rel="noopener" aria-label="Phóng to '+esc(p.name)+'"><img data-material-surface-photo src="assets/interior/photos/'+p.id+'.jpg" alt="'+esc(p.name)+'" loading="lazy" decoding="async"><span>'+esc(p.name)+' ↗</span></a>'+(profile?'<small>'+role+' · '+esc(profile.name)+'<br>Ô lặp tham khảo '+profile.scale.map(n=>Math.round(n*1000)).join(' × ')+' mm</small><button type="button" data-material-photo-apply="'+p.id+'" '+(!rooms.length?'disabled':'')+'>Dùng '+esc(profile.name)+' trong 3D →</button>':'<small>Ảnh tham khảo · chưa hỗ trợ áp trực tiếp</small>')+'</article>';}).join('')+'</div><p role="status" data-material-photo-status aria-live="polite"></p><small>Ảnh và texture <a href="https://polyhaven.com/license" target="_blank" rel="noopener noreferrer">Poly Haven · CC0</a>. Thay bề mặt của phòng đã chọn; giữ nguyên hình học, mã sản phẩm và giá. Liên kết mô phỏng cũ của vai trò đó được bỏ. Đây chưa phải ảnh đúng mã hàng (SKU); đối chiếu mẫu hãng trước khi đặt hàng.</small></section>';
 };
 B.showroomPreviewHtml=category=>{
  const config=categories[category],product=B.selectedShowroomProduct(category);if(!config||!product)return '';
  const esc=B.esc,rooms=regularRooms(),room=rooms.find(r=>'room:'+r.id===B.state.ui.sceneFocus)||rooms.find(r=>r.type==='living')||rooms[0],palette=B.state.ui.sceneFocus==='all'&&['paint','cabinetry'].includes(category)?B.facadeFinishPalette?.()||B.resolveFacadeMaterialBindings?.(B.state.project.materials.finish?.exterior||{}):B.finishPalette(room?.id),applied=B.showroomFinishInfo(B.state.ui.sceneFocus==='all'&&['paint','cabinetry'].includes(category)?null:room?.id).find(x=>x.category===category),profile=B.VISUAL_MATERIALS.find(p=>p.id===(applied?.profileId||config.profile)),binding=palette.catalogMaterials?.[category],status=B.catalogBindingStatus?.(category,binding,product,palette);
  const outside=B.state.ui.sceneFocus==='all'&&['paint','cabinetry'].includes(category),scope='<label>Phạm vi áp dụng<select data-showroom-scope="'+category+'">'+(['paint','cabinetry'].includes(category)?'<option value="exterior" '+(outside?'selected':'')+'>Ngoại thất · giữ nội thất</option>':'')+rooms.map(r=>'<option value="room:'+esc(r.id)+'" '+(!outside&&r.id===room?.id?'selected':'')+'>Tầng '+(r.floor+1)+' · '+esc(r.name)+'</option>').join('')+'<option value="unassigned">Phòng chưa chọn riêng</option><option value="all">Toàn nhà · thay bề mặt đã chọn</option></select></label>';
  return '<section class="showroom-preview" aria-label="Vật liệu đã chọn và bề mặt 3D"><figure class="showroom-material-image showroom-surface-photo">'+B.finishSampleHtml(profile)+'<figcaption>Bề mặt dùng trong 3D · màu theo lựa chọn, chưa phải ảnh SKU</figcaption></figure><div><span>'+esc(config.label)+' đã chọn</span><h3>'+esc(product.name)+'</h3><small>'+esc(product.sku||'Chưa có mã hàng')+'</small><label>Bề mặt mô phỏng<select data-showroom-profile="'+category+'">'+B.VISUAL_MATERIALS.filter(p=>p.role===config.role).map(p=>'<option value="'+p.id+'" '+(p.id===profile.id?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></label>'+scope+'<p>Bề mặt mô phỏng chung, chưa phải ảnh hoặc texture đúng mã hàng. Báo giá giữ theo sản phẩm đã chọn.</p>'+(['stale','sample-unavailable'].includes(status?.status)?'<p role="status">'+esc(status.reason)+'</p>':'')+'<button type="button" data-showroom-apply="'+category+'" '+(!room?'disabled':'')+'>Chỉ lưu vật liệu</button><button type="button" data-showroom-3d="'+category+'" data-showroom-apply-view '+(!room?'disabled':'')+' class="showroom-primary">Lưu và xem 3D →</button>'+(!room?'<small>Tạo phòng ở mục Bản vẽ để xem vật liệu trong 3D.</small>':'')+'</div></section>';
 };
 const showroomRestoreAttempts=new WeakMap(),showroomScreen=B.screen6;
 if(typeof showroomScreen==='function')B.screen6=()=>{
  const p=B.state.project,f=p.materials.finish||{},bindings=[f.exterior?.catalogMaterials,f.exterior?.facadeMaterials,...Object.values(f.rooms||{}).map(r=>r?.catalogMaterials)].flatMap(row=>Object.values(row||{})).filter(v=>B.catalogSampleMetadataValid?.(v));
  const signature=JSON.stringify(bindings.map(v=>v.sample));
  if(bindings.some(v=>!B.materialSampleForBinding?.(v))&&showroomRestoreAttempts.get(p)!==signature){showroomRestoreAttempts.set(p,signature);queueMicrotask(async()=>{await B.restoreMaterialSamples?.();if(B.state.project===p&&B.state.ui.step===5&&bindings.some(v=>B.materialSampleForBinding?.(v)))B.render({preserveScroll:true});});}
  return showroomScreen().replace('<aside class="v6-card v6-mat-nav">',B.showroomChoiceBoardHtml()+'<aside class="v6-card v6-mat-nav">');
 };
 const sampleShowroom=B.showroomPreviewHtml;
 B.showroomPreviewHtml=category=>{
  let html=sampleShowroom(category);const product=B.selectedShowroomProduct(category),config=categories[category],rooms=regularRooms();if(!html||!product||!config||!rooms.length)return html;
  const room=rooms.find(r=>'room:'+r.id===B.state.ui.sceneFocus)||rooms.find(r=>r.type==='living')||rooms[0],match=B.catalogProductSample(product),outside=B.state.ui.sceneFocus==='all'&&['paint','cabinetry'].includes(category),roomBinding=(outside?(B.facadeFinishPalette?.()||B.resolveFacadeMaterialBindings?.(B.state.project.materials.finish?.exterior||{})):B.finishPalette(room.id))?.catalogMaterials?.[category],binding=match?.binding||(roomBinding?.productId===product.id?roomBinding:null),sample=match?.sample,profile=binding?.visualProfileId||config.profile,esc=B.esc;
  if(sample)html=html.replace(/<figure class="showroom-material-image[^"]*">[\s\S]*?<\/figure>/,'<figure class="showroom-material-image showroom-surface-photo"><button type="button" class="material-sample-zoom" data-material-sample-open="'+esc(binding.sample.mediaId)+'" aria-label="Xem lớn ảnh mẫu bề mặt"><img data-selected-material-sample src="'+esc(sample.image.src)+'" alt="Ảnh mẫu khách cung cấp · '+esc(product.sku||product.name)+'"></button><figcaption>Ảnh mẫu đã gắn · '+esc(product.sku||product.name)+' · '+binding.sample.realWorldScale.map(n=>Math.round(n*1000)).join(' × ')+' mm</figcaption></figure>');
  if(!sample&&(B.materialPhotoReference?.(product)||B.materialGeneratedIllustration?.(product)))html=html.replace(/<figure class="showroom-material-image[^"]*">[\s\S]*?<\/figure>/,B.materialPhotoReferenceHtml(product,'showroom-material-image showroom-source-reference'));
  return html+'<details class="material-sample-editor"><summary>Dùng ảnh mẫu bề mặt của mã hàng này</summary><p>Chọn ảnh chụp thẳng phần bề mặt đã cắt gọn, không có logo, phối cảnh hay đồ vật. Nhập kích thước phần ảnh đại diện để vân lặp đúng tỷ lệ.</p>'+(sample?'<figure><img src="'+esc(sample.image.src)+'" alt="Ảnh mẫu khách cung cấp cho '+esc(product.sku||product.name)+'"><figcaption>Ảnh mẫu đã gắn · '+esc(product.sku||product.name)+'</figcaption></figure>':binding?.sample?'<p role="status">Ảnh mẫu chưa có trên thiết bị này. Chọn lại file để thể hiện đúng mẫu.</p>':'')+'<form data-catalog-sample="'+category+'"><label>Nơi áp dụng<select name="roomId">'+(['paint','cabinetry'].includes(category)?'<option value="__exterior__"'+(outside?' selected':'')+'>Ngoại thất · giữ nội thất</option>':'')+rooms.map(r=>'<option value="'+esc(r.id)+'" '+(!outside&&r.id===room.id?'selected':'')+'>T'+(r.floor+1)+' · '+esc(r.name)+'</option>').join('')+'</select></label><input type="hidden" name="profileId" value="'+esc(profile)+'"><label>Ảnh mẫu JPG / PNG / WebP<input name="sample" type="file" accept="image/jpeg,image/png,image/webp" required></label><label>Rộng phần mẫu / mm<input name="widthMm" type="number" min="10" max="20000" step="any" required></label><label>Dài phần mẫu / mm<input name="depthMm" type="number" min="10" max="20000" step="any" required></label><label>Góc đặt vân / °<input name="rotationDeg" type="number" min="0" max="359.999" step="any" value="0" required></label><label>Nguồn ảnh / mẫu thực<input name="sourceReference" maxlength="240" placeholder="Mã mẫu, hãng hoặc ảnh khách cung cấp" required></label><button>Lưu ảnh mẫu vật liệu</button><p role="status" aria-live="polite"></p></form><small>Ảnh lưu trên thiết bị này và đi kèm bản sao JSON; chưa đồng bộ cloud. Chỉ dùng ảnh bạn có quyền sử dụng. Mẫu màu không xác nhận độ nhám, chống trượt hoặc thông số kỹ thuật của sản phẩm.</small></details>';
 };
 document.addEventListener('submit',async e=>{
  if(!e.target.matches?.('[data-catalog-sample]'))return;e.preventDefault();const form=e.target,button=form.querySelector('button'),notice=form.querySelector('[role="status"]'),data=new FormData(form);button.disabled=true;notice.textContent='Đang gắn mẫu bề mặt…';
  try{const result=await B.saveShowroomSample(form.dataset.catalogSample,{roomId:data.get('roomId')==='__exterior__'?null:data.get('roomId'),scope:data.get('roomId')==='__exterior__'?'exterior':'room',profileId:document.querySelector('[data-showroom-profile="'+form.dataset.catalogSample+'"]')?.value||data.get('profileId'),file:data.get('sample'),widthM:Number(data.get('widthMm'))/1000,depthM:Number(data.get('depthMm'))/1000,rotationDeg:Number(data.get('rotationDeg')),sourceReference:data.get('sourceReference')});if(!result.ok){notice.textContent=result.reason;return;}if(result.showInMaterials){B.render({preserveScroll:true});B.toast('Đã lưu ảnh mẫu. Kiểm tra ảnh tại Vật liệu trước khi mở 3D.');}}catch(_){notice.textContent='Chưa hoàn tất việc gắn ảnh mẫu. Kiểm tra file và thử lại.';}finally{button.disabled=false;}
 });
 B.styleMaterialBriefHtml=category=>{
  const spec=B.styleSpecification();if(!spec)return '<p class="style-material-brief">Phong cách riêng: cần chốt mẫu vật liệu trước khi xác nhận phù hợp.</p>';
  const roles=B.styleMaterialMatrix().filter(x=>x.category===category),esc=B.esc;if(!roles.length)return '';
  return '<section class="style-material-brief" aria-label="Vật liệu theo phong cách"><span>VẬT LIỆU THEO PHONG CÁCH</span><h3>'+esc(spec.name)+'</h3><p>'+roles.map(r=>esc(r.name)+': '+esc(r.intent)).slice(0,2).join(' · ')+'</p><details><summary>Quy cách cần chốt & cách tiết kiệm</summary>'+roles.map(r=>'<p><b>'+esc(r.name)+'</b> · '+r.requirements.map(esc).join(' · ')+'</p>').join('')+'<p>'+esc(spec.budgetOptions.economy)+'</p><small>Chưa tính mức tiết kiệm khi thiếu báo giá cùng quy cách. Màu và vật liệu bạn đã chọn được giữ.</small></details><small>Gợi ý BMH; đối chiếu mẫu hãng trước khi chốt mã hàng.</small></section>';
 };
 // Explicit catalogue suggestions are filterable; unreviewed products stay visible
 // with their uncertainty, rather than silently being called compatible.
 B.materialStyleFits=product=>!['different-style','different-role','unknown-style','missing-product'].includes(B.styleMaterialCompatibility(product).status);
 const productCard=B.webProductCard;if(productCard)B.webProductCard=product=>{
  const status=B.styleMaterialCompatibility(product),label=status.status==='design-suggestion'?'Gợi ý theo phong cách':status.status==='different-style'?'Gợi ý cho phong cách khác':'Cần đối chiếu mẫu';
  let html=productCard(product).replace('<h3>','<small class="style-material-status" title="'+B.esc(status.reason)+'">'+label+'</small><h3>');
  const match=B.catalogProductSample(product);
  if(match){const {binding,sample,name}=match,esc=B.esc;html=html.replace(/<figure class="material-product-visual">[\s\S]*?<\/figure>/,'<figure class="material-product-visual"><button type="button" class="material-sample-zoom" data-material-sample-open="'+esc(binding.sample.mediaId)+'" aria-label="Xem lớn ảnh mẫu bề mặt"><img data-material-customer-sample src="'+esc(sample.image.src)+'" alt="Ảnh mẫu bề mặt khách cung cấp · '+esc(product.sku||product.name)+'" loading="lazy" decoding="async"></button><figcaption>Ảnh mẫu bề mặt đã gắn · '+esc(name)+' · '+binding.sample.realWorldScale.map(n=>Math.round(n*1000)).join(' × ')+' mm</figcaption></figure>');}
  return html;
 };
 const catalog=B.materialCatalogHtml;if(catalog)B.materialCatalogHtml=category=>{const brief=B.styleMaterialBriefHtml(category),preview=B.showroomPreviewHtml(category),alternatives=catalog(category);return brief+preview+(preview&&B.guidedDetails&&!B.materialResearch.products.some(p=>p.category===category&&B.materialPhotoReference?.(p))?B.guidedDetails('showroom:'+category,'So sánh sản phẩm khác',alternatives):alternatives)+'<details class="showroom-original-photos"><summary>Thư viện ảnh bề mặt gốc</summary>'+B.materialPhotoGallery(category)+'</details>';};
 const studio=B.screen7;B.screen7=()=>{
  let html=studio();const room=B.state.project.plan.rooms.find(r=>'room:'+r.id===B.state.ui.sceneFocus),info=B.showroomFinishInfo(room?.id),esc=B.esc;
  const selected=info.length?'<section class="studio-supplier-choice"><b>Sản phẩm đã chọn</b>'+info.map(x=>'<p>'+esc(x.name)+'<small>'+esc([x.sku,'Mô phỏng: '+x.profileName].filter(Boolean).join(' · '))+'</small></p>').join('')+'<a href="#" data-nav="5">Mở showroom →</a></section>':'';
  return html.replace('<div class="visual-material-quick">',selected+'<div class="visual-material-quick">').replace('Đổi vân, độ nhám và độ bóng ngay trong 3D.</small>','Đổi vân, độ nhám và độ bóng ngay trong 3D.</small><output data-finish-update-status role="status" aria-live="polite"></output>');
 };B.SCREENS[5]=B.screen7;
 document.addEventListener('change',e=>{const select=e.target;if(!select.matches?.('[data-showroom-profile]'))return;const profile=B.VISUAL_MATERIALS.find(p=>p.id===select.value),preview=select.closest('.showroom-preview'),swatch=preview?.querySelector('.finish-swatch');if(profile&&swatch)swatch.outerHTML=B.finishSampleHtml(profile);});
 document.addEventListener('click',e=>{
  const view=e.target.closest?.('[data-showroom-choice-view]');if(view){const roomId=view.closest('.showroom-choice-board')?.querySelector('[data-showroom-choice-room]')?.value;if(!B.openShowroomFinishPreview(roomId))B.toast('Chọn phòng để xem bộ phối.');return;}
  const finish=e.target.closest?.('[data-showroom-finish]');if(finish){const roomId=finish.closest('.showroom-choice-board')?.querySelector('[data-showroom-choice-room]')?.value;if(!B.selectShowroomFinish(finish.dataset.showroomFinish,roomId)){B.toast('Chọn phòng còn tồn tại trước khi lưu vật liệu.');return;}B.render({preserveScroll:true});B.toast('Đã lưu vật liệu. Tiếp tục phối hoặc xem trong 3D.');return;}
  const photo=e.target.closest?.('[data-material-photo-apply]');if(photo){
   const gallery=photo.closest('.material-photo-library'),roomId=gallery?.querySelector('[data-material-photo-room]')?.value,notice=gallery?.querySelector('[data-material-photo-status]');
   if(!B.applyMaterialPhoto(photo.dataset.materialPhotoApply,roomId)){if(notice)notice.textContent='Phòng đã thay đổi; mở lại danh sách và chọn phòng trước khi áp dụng.';return;}
   B.state.ui.sceneFocus='room:'+roomId;B.save();B.render({preserveScroll:true});B.toast('Đã lưu bề mặt. Bạn có thể phối tiếp trước khi mở 3D.');return;
  }
  const zoom=e.target.closest?.('[data-material-sample-open]');if(zoom){if(!B.openMaterialSample(zoom.dataset.materialSampleOpen))B.toast('Ảnh mẫu không còn trong dự án đang mở.');return;}
  const button=e.target.closest?.('[data-showroom-apply],[data-showroom-3d]');if(!button)return;
  const category=button.dataset.showroomApply||button.dataset.showroom3d,preview=button.closest('.showroom-preview'),profileId=preview?.querySelector('[data-showroom-profile]')?.value,target=preview?.querySelector('[data-showroom-scope]')?.value;
  if(button.hasAttribute('data-showroom-apply-view')){const result=B.saveAndPreviewShowroomProduct(category,profileId,target);if(!result.opened)B.toast(result.saved?'Đã lưu vật liệu; chọn một phòng có bề mặt tương ứng để xem.':'Chọn phạm vi còn tồn tại trước khi lưu vật liệu.');return;}
  if(button.hasAttribute('data-showroom-apply')){if(!B.applyShowroomProduct(category,profileId,target)){B.toast('Chọn phòng cần áp dụng; các bề mặt đã chọn riêng được giữ lại.');return;}B.render({preserveScroll:true});B.toast('Đã lưu vật liệu. Tiếp tục chọn hoặc mở 3D khi bạn muốn.');return;}
  if(!B.openShowroomProductPreview(category,profileId,target))B.toast('Lưu vật liệu cho phòng hoặc ngoại thất đã chọn trước khi mở 3D.');
 });
 document.addEventListener('change',e=>{
  const select=e.target;if(!select.matches?.('[data-finish-compare-role],[data-finish-compare-candidate]'))return;
  const panel=select.closest('[data-finish-compare-room]'),content=panel?.querySelector('[data-finish-compare-content]');if(!content)return;
  if(B.state.ui.step!==5||B.showroomChoiceContext().room?.id!==panel.dataset.finishCompareRoom){content.textContent='Phòng đã đổi. Mở lại bảng vật liệu để so sánh.';return;}
  const role=panel.querySelector('[data-finish-compare-role]').value,candidate=select.matches('[data-finish-compare-role]')?null:select.value,focus=select.matches('[data-finish-compare-role]')?'[data-finish-compare-role]':'[data-finish-compare-candidate]';
  content.innerHTML=B.showroomFinishComparisonHtml(panel.dataset.finishCompareRoom,role,candidate);content.querySelector(focus)?.focus({preventScroll:true});
 });
 document.addEventListener('change',e=>{const select=e.target;if(!select.matches?.('[data-showroom-choice-room]'))return;if(!regularRooms().some(r=>r.id===select.value))return;B.state.ui.sceneFocus='room:'+select.value;B.save();B.render({preserveScroll:true});});
 const status=B.projectSaveStatus;if(status)B.projectSaveStatus=()=>{status();const p=B.projects,node=document.querySelector('.guided-footer>span');if(node){node.textContent=p.error?'Chưa lưu được. Mở Dự án để tải bản sao.':p.busy?'Đang lưu thiết kế trên thiết bị…':p.dirty?'Có thay đổi · Đang chờ lưu…':'Thiết kế đã lưu trên thiết bị.';node.dataset.state=p.error?'error':p.busy||p.dirty?'pending':'saved';}};
})();
