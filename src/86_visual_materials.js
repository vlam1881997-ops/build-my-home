/* Visual finishes are independent of supplier SKUs, quotes and measured geometry. */
// Keep the customer's chosen angle while the scene is rebuilt with new finishes.
BMH.rememberFinishCamera=()=>{
 const s=BMH.studio3d,ui=BMH.state.ui;
 BMH.pendingFinishCamera=s?.state?{project:BMH.state.project,focus:ui.sceneFocus,preset:ui.roomCamera,exterior:ui.exteriorCamera,yaw:s.state.yaw,pitch:s.state.pitch,dist:s.state.dist,target:s.state.target.toArray()}:null;
};
const finishMount=BMH.mountStudio3D;
BMH.mountStudio3D=async()=>{
 const canvas=BMH.$('#studio3dCanvas');
 // Queued UI updates share one mount for the same canvas and WebGL context.
 if(canvas&&BMH.studio3d?.renderer?.domElement===canvas)return;
 if(canvas&&BMH.finishMountWork?.canvas===canvas)return BMH.finishMountWork.task;
 const pose=BMH.pendingFinishCamera;
 const task=(async()=>{
  await finishMount();const s=BMH.studio3d,ui=BMH.state.ui;
  if(!pose||!s?.state||pose.project!==BMH.state.project||pose.focus!==ui.sceneFocus||pose.preset!==ui.roomCamera||pose.exterior!==ui.exteriorCamera)return;
  s.state.resetCameraValidation?.();
  Object.assign(s.state,{yaw:pose.yaw,pitch:pose.pitch,dist:pose.dist,framed:true});s.state.target.fromArray(pose.target);s.state.updateCamera();
  if(BMH.pendingFinishCamera===pose)BMH.pendingFinishCamera=null;
 })();
 const work=canvas?{canvas,task}:null;if(work)BMH.finishMountWork=work;
 try{await task;}finally{if(work&&BMH.finishMountWork===work)BMH.finishMountWork=null;}
};
BMH.VISUAL_MATERIALS=[
 {id:'oak-floor',role:'floor',name:'Sồi sáng',color:'#ceb58d',kind:'plank',surface:'wood',scale:[1.7,1.7],roughness:.72,normalStrength:.18,detail:'Vân gỗ sồi sáng, bề mặt mờ, ánh phản xạ dịu.'},
 {id:'walnut-floor',role:'floor',name:'Óc chó trầm',color:'#795038',kind:'plank',surface:'wood',scale:[1.7,1.7],roughness:.65,normalStrength:.18,detail:'Vân gỗ tối, sắc nâu ấm, hoàn thiện satin.'},
 {id:'ivory-tile',role:'floor',name:'Gạch kem mờ',color:'#ded7c9',kind:'tile',surface:'tile',scale:[.6,.6],roughness:.82,normalStrength:.12,detail:'Gạch 600 × 600 mm, ron nhỏ, bề mặt mờ.'},
 {id:'white-marble',role:'floor',name:'Marble trắng',color:'#f0ede6',kind:'marble',surface:'stone',scale:[1.2,1.2],roughness:.24,normalStrength:.025,detail:'Đá trắng với vân xám mảnh, mặt đánh bóng, phản xạ rõ.'},
 {id:'sand-travertine',role:'floor',name:'Travertine cát',color:'#cfc0a0',kind:'travertine',surface:'stone',scale:[.8,.8],roughness:.88,normalStrength:.13,detail:'Đá màu cát, vân ngang và lỗ nhỏ, hoàn thiện honed mờ.'},
 {id:'grey-concrete',role:'floor',name:'Bê tông xám',color:'#a9aaa4',kind:'concrete',surface:'stone',scale:[2,2],roughness:.87,normalStrength:.07,detail:'Bê tông liền mạch, loang xám nhẹ, bề mặt mờ.'},
 {id:'ivory-terrazzo',role:'floor',name:'Terrazzo kem',color:'#e7e0cd',kind:'terrazzo',surface:'stone',scale:[.6,.6],roughness:.52,normalStrength:.025,detail:'Nền kem với hạt đá nhỏ nhiều sắc độ, hoàn thiện satin.'},
 {id:'ivory-paint',role:'wall',name:'Sơn trắng ấm',color:'#f2eee5',kind:'plaster',scale:[.35,.35],roughness:.93,normalStrength:.04,detail:'Sơn trắng ngà mờ, hạt bề mặt rất nhẹ.'},
 {id:'grey-paint',role:'wall',name:'Sơn xám dịu',color:'#d2d5d1',kind:'plaster',scale:[.35,.35],roughness:.93,normalStrength:.04,detail:'Sơn xám nhạt mờ, không có vân đá.'},
 {id:'sand-plaster',role:'wall',name:'Vữa màu cát',color:'#d8c7ac',kind:'concrete',scale:[1,1],roughness:.96,normalStrength:.09,detail:'Vữa khoáng màu cát, loang tự nhiên và nhám nhẹ.'},
 {id:'natural-oak',role:'accent',name:'Gỗ sồi',color:'#ae8658',kind:'wood',scale:[1.5,1.5],roughness:.72,normalStrength:.18,detail:'Gỗ sồi vân thẳng cho bàn, tủ và điểm nhấn.'},
 {id:'dark-walnut',role:'accent',name:'Gỗ óc chó',color:'#65432e',kind:'wood',scale:[1.5,1.5],roughness:.6,normalStrength:.16,detail:'Gỗ nâu trầm với vân dài, hoàn thiện satin.'},
 {id:'ivory-lacquer',role:'accent',name:'Sơn kem satin',color:'#e9e4d8',kind:'plaster',scale:[.35,.35],roughness:.32,normalStrength:.015,detail:'Bề mặt sơn kem nhẵn, ánh bóng satin, không có vân gỗ.'},
 {id:'natural-linen',role:'fabric',name:'Linen tự nhiên',color:'#d9cfbb',kind:'fabric',scale:[.3,.3],roughness:.98,normalStrength:.34,detail:'Vải linen dệt thô, sắc be tự nhiên, bề mặt mờ.'},
 {id:'cream-boucle',role:'fabric',name:'Bouclé kem',color:'#e8dfcc',kind:'boucle',scale:[.08,.08],roughness:.98,normalStrength:.22,detail:'Vải bouclé màu kem, sợi vòng nhỏ nổi rõ.'},
 {id:'olive-velvet',role:'fabric',name:'Nhung olive',color:'#6f7962',kind:'velvet',scale:[.15,.15],roughness:.88,normalStrength:.08,detail:'Nhung xanh olive, sợi mịn và ánh sheen dịu.'},
 {id:'cognac-leather',role:'fabric',name:'Da cognac',color:'#a66738',kind:'leather',scale:[.15,.15],roughness:.57,normalStrength:.16,detail:'Da màu cognac, hạt da nhỏ, ánh satin nhẹ.'}
];
BMH.catalogSurfaceSlots={floor:'floor',paint:'wall',cabinetry:'accent'};
BMH.catalogSelectedProduct=category=>{const id=BMH.state.project.materials.choices?.[category],q=BMH.state.project.dataEngine?.materialOverrides?.[id]?.product,x=q||BMH.materialResearch?.products?.find(x=>x.id===id);return x&&x.id===id&&x.category===category?x:null;};
BMH.createCatalogMaterialBinding=(product,profileId,{roomId=null}={})=>{
 const slot=BMH.catalogSurfaceSlots[product?.category],profile=BMH.VISUAL_MATERIALS.find(x=>x.id===profileId&&x.role===slot);if(!product?.id||!profile)return null;
 return {id:product.id,profileId:profile.id,productId:product.id,sku:product.sku||null,specification:product.specification||product.spec||null,quantityUnit:BMH.materialUnit?.(product.priceEvidence?.quantityUnit??product.unit)??product.unit??null,styleIds:[BMH.houseStyle?.()?.id].filter(Boolean),surfaceSlot:slot,roomId,visualProfileId:profile.id,textureAssetId:null,realWorldScale:[...profile.scale],exactness:'generic'};
};
BMH.catalogBindingStatus=(category,binding,product,palette=null)=>{
 const fail=reason=>({valid:false,status:binding?'stale':'missing',reason,exactness:'generic'}),slot=BMH.catalogSurfaceSlots[category];if(!binding)return fail('Chưa gắn sản phẩm với bề mặt.');if(!slot||!product||product.category!==category)return fail('Sản phẩm đã đổi; cần chọn lại bề mặt.');
 const profile=BMH.VISUAL_MATERIALS.find(x=>x.id===binding.visualProfileId&&x.role===slot),unit=BMH.materialUnit?.(product.priceEvidence?.quantityUnit??product.unit)??product.unit??null;
 if(binding.productId!==product.id||binding.id!==product.id||!Object.hasOwn(binding,'sku')||binding.sku!==(product.sku||null)||!Object.hasOwn(binding,'specification')||binding.specification!==(product.specification||product.spec||null)||!Object.hasOwn(binding,'quantityUnit')||binding.quantityUnit!==unit)return fail('Mã hàng, quy cách hoặc đơn vị đã đổi; chọn lại bề mặt.');
 if(!profile||binding.surfaceSlot!==slot||binding.profileId!==profile.id||!Array.isArray(binding.realWorldScale)||binding.realWorldScale.length!==profile.scale.length||!binding.realWorldScale.every((v,i)=>v===profile.scale[i])||binding.textureAssetId!==null)return fail('Bề mặt hoặc tỷ lệ mô phỏng đã đổi; cần chọn lại.');
 if(palette&&palette.visualMaterials?.[slot]!==profile.id)return fail('Bề mặt phòng đã được chỉnh riêng.');return {valid:true,status:'generic',reason:'Bề mặt BMH mô phỏng; đối chiếu mẫu và mã hàng tại hãng.',exactness:'generic'};
};
BMH.validatePaletteBindings=(roomId,palette={})=>{
 const f=BMH.state.project.materials.finish||{},room=roomId?f.rooms?.[roomId]||{}:{},global=f.exterior||{},bindings={...global.catalogMaterials,...room.catalogMaterials},result={...palette,visualMaterials:{...palette.visualMaterials},catalogMaterials:{},materialBindingStatuses:{}},collection=BMH.interiorCollection?.(roomId);
 const defaults=BMH.styleDefaultPalette?.(roomId)||collection;
 const automatic={...global.styleRoles,...room.styleRoles};for(const [role,usesStyle] of Object.entries(automatic))if(usesStyle===true){const profile=BMH.VISUAL_MATERIALS.find(x=>x.id===defaults?.visualMaterials?.[role]&&x.role===role);if(profile){result.visualMaterials[role]=profile.id;result[role]=profile.color;if(role==='floor')result.surface='auto';}}
 for(const [category,binding] of Object.entries(bindings)){
  const role=BMH.catalogSurfaceSlots[category];if(!role)continue;if(roomId&&!room.catalogMaterials?.[category]&&room.explicitRoles?.[role])continue;
  const product=BMH.catalogSelectedProduct(category),status=BMH.catalogBindingStatus(category,binding,product,palette);if(room.catalogMaterials?.[category]&&binding.roomId!==roomId){status.valid=false;status.status='stale';status.reason='Liên kết thuộc phòng khác; cần chọn lại bề mặt.';}result.materialBindingStatuses[category]=status;
  if(status.valid)result.catalogMaterials[category]=binding;else{const profile=BMH.VISUAL_MATERIALS.find(x=>x.id===defaults?.visualMaterials?.[role]&&x.role===role);if(profile){result.visualMaterials[role]=profile.id;result[role]=profile.color;if(role==='floor')result.surface=profile.surface;}else{delete result.visualMaterials[role];if(role==='wall')result.wall=BMH.houseStyle?.()?.wall||collection?.wall||'#f2efe8';}}
 }
 return result;
};
const visualPalette=BMH.finishPalette;
BMH.finishPalette=roomId=>{
 const palette=visualPalette?.(roomId)||{},profiles=Object.fromEntries(Object.entries(palette.visualMaterials||{}).map(([role,id])=>[role,BMH.VISUAL_MATERIALS.find(p=>p.id===id&&p.role===role)]).filter(([,p])=>p));
 return BMH.validatePaletteBindings(roomId,{...palette,...(profiles.floor?{surface:profiles.floor.surface}:{})});
};
BMH.clearCatalogSurface=(row,role)=>{const bindings={...row.catalogMaterials};for(const category of Object.keys(bindings))if(BMH.catalogSurfaceSlots[category]===role)delete bindings[category];return bindings;};
BMH.applyVisualMaterial=(role,id,roomId=null)=>{
 const profile=BMH.VISUAL_MATERIALS.find(p=>p.id===id&&p.role===role),p=BMH.state.project;if(!profile||roomId&&!p.plan.rooms.some(r=>r.id===roomId))return false;
 BMH.rememberFinishCamera();const f=p.materials.finish||={exterior:null,rooms:{}};f.rooms||={};const rooms=roomId?p.plan.rooms.filter(r=>r.id===roomId):p.plan.rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type));
 for(const room of rooms){const previous=BMH.finishPalette(room.id),raw=f.rooms[room.id]||{};f.rooms[room.id]={...previous,[role]:profile.color,visualMaterials:{...previous.visualMaterials,[role]:id},explicitRoles:{...raw.explicitRoles,[role]:true},styleRoles:{...raw.styleRoles,[role]:false},catalogMaterials:BMH.clearCatalogSurface(raw,role),...(role==='floor'?{surface:profile.surface}:{})};}
 if(!roomId){const raw=f.exterior||{};f.exterior={...raw,[role]:profile.color,visualMaterials:{...raw.visualMaterials,[role]:id},explicitRoles:{...raw.explicitRoles,[role]:true},styleRoles:{...raw.styleRoles,[role]:false},catalogMaterials:BMH.clearCatalogSurface(raw,role),...(role==='floor'?{surface:profile.surface}:{})};}
 BMH.state.ui.renderMode='interactive';BMH.finishInvalidate?.();BMH.save();return true;
};
BMH.applyCatalogMaterial=(category,profileId,{roomId=null,scope=roomId?'room':'unassigned'}={})=>{
 const p=BMH.state.project,product=BMH.catalogSelectedProduct(category),role=BMH.catalogSurfaceSlots[category],profile=BMH.VISUAL_MATERIALS.find(x=>x.id===profileId&&x.role===role);if(!product||!profile||!['room','unassigned','all'].includes(scope)||scope==='room'&&!p.plan.rooms.some(r=>r.id===roomId&&!['stairs','elevator','balcony'].includes(r.type)))return false;
 const f=p.materials.finish||={exterior:null,rooms:{}};f.rooms||={};const authored=row=>!!row&&(row.explicitRoles?row.explicitRoles[role]===true:!!row.visualMaterials?.[role]||Object.hasOwn(row,role)),rooms=p.plan.rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type)&&(scope!=='room'||r.id===roomId)).filter(r=>scope!=='unassigned'||!authored(f.rooms[r.id]));if(!rooms.length)return false;
 BMH.rememberFinishCamera();const write=(raw,previous,id)=>({...raw,...previous,[role]:profile.color,visualMaterials:{...previous.visualMaterials,[role]:profile.id},explicitRoles:{...raw.explicitRoles,[role]:true},styleRoles:{...raw.styleRoles,[role]:false},catalogMaterials:{...raw.catalogMaterials,[category]:BMH.createCatalogMaterialBinding(product,profile.id,{roomId:id})},...(role==='floor'?{surface:profile.surface}:{})});
 for(const r of rooms){const raw=f.rooms[r.id]||{};f.rooms[r.id]=write(raw,BMH.finishPalette(r.id),r.id);}if(scope==='all'||scope==='unassigned'&&!authored(f.exterior)){const raw=f.exterior||{};f.exterior=write(raw,raw,null);}
 BMH.state.ui.renderMode='interactive';BMH.finishInvalidate?.();BMH.save();return true;
};
BMH.applyFinishColor=(role,color,roomId=null)=>{
 const p=BMH.state.project;if(!['floor','wall','accent','fabric'].includes(role)||!/^#[0-9a-f]{6}$/i.test(color)||roomId&&!p.plan.rooms.some(r=>r.id===roomId))return false;
 BMH.rememberFinishCamera();const f=p.materials.finish||={exterior:null,rooms:{}};f.rooms||={};const rooms=p.plan.rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type)&&(!roomId||r.id===roomId)),write=(raw,palette)=>({...palette,[role]:color,explicitRoles:{...raw.explicitRoles,[role]:true},styleRoles:{...raw.styleRoles,[role]:false},catalogMaterials:BMH.clearCatalogSurface(raw,role)});for(const r of rooms)f.rooms[r.id]=write(f.rooms[r.id]||{},BMH.finishPalette(r.id));if(!roomId)f.exterior=write(f.exterior||{},f.exterior||{});BMH.state.ui.renderMode='interactive';BMH.finishInvalidate?.();BMH.save();return true;
};
BMH.applyFinishSurface=(surface,roomId=null)=>{
 if(!['auto','wood','tile','stone'].includes(surface))return false;if(surface!=='auto')return BMH.applyVisualMaterial('floor',{wood:'oak-floor',tile:'ivory-tile',stone:'sand-travertine'}[surface],roomId);
 const p=BMH.state.project;if(roomId&&!p.plan.rooms.some(r=>r.id===roomId))return false;BMH.rememberFinishCamera();const f=p.materials.finish||={exterior:null,rooms:{}};f.rooms||={};const rooms=p.plan.rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type)&&(!roomId||r.id===roomId)),write=(raw,palette)=>{const visualMaterials={...palette.visualMaterials};delete visualMaterials.floor;const row={...palette,surface:'auto',visualMaterials,explicitRoles:{...raw.explicitRoles,floor:true},styleRoles:{...raw.styleRoles,floor:true},catalogMaterials:BMH.clearCatalogSurface(raw,'floor')};delete row.floor;return row;};for(const r of rooms)f.rooms[r.id]=write(f.rooms[r.id]||{},BMH.finishPalette(r.id));if(!roomId)f.exterior=write(f.exterior||{},f.exterior||{});BMH.state.ui.renderMode='interactive';BMH.finishInvalidate?.();BMH.save();return true;
};
// Legacy colour/surface controls use the same finish boundary and in-place renderer path.
document.addEventListener('change',event=>{const t=event.target,color=t.dataset?.designColor,surface=t.hasAttribute?.('data-design-surface');if(!color&&!surface)return;const room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===BMH.state.ui.sceneFocus),role=color||'floor',changed=color?BMH.applyFinishColor(color,t.value,room?.id):BMH.applyFinishSurface(t.value,room?.id);if(!changed)return;event.stopImmediatePropagation();if(!BMH.refreshStudioFinishes?.(role,room?.id))BMH.render({preserveScroll:true});},true);
BMH.visualMaterialContext=roomId=>{
 const palette=BMH.finishPalette(roomId),collection=roomId?BMH.interiorCollection(roomId):null;
 return {collection:collection?{id:collection.id,name:collection.name,note:collection.note,shape:collection.shape,table:collection.table}:null,palette:Object.fromEntries(['wall','floor','accent','fabric','pillow','rug'].map(role=>[role,palette[role]]).filter(([,value])=>/^#[0-9a-f]{6}$/i.test(value||''))),surface:palette.surface||'auto',surfaces:Object.entries(palette.visualMaterials||{}).flatMap(([role,id])=>{const p=BMH.VISUAL_MATERIALS.find(p=>p.id===id&&p.role===role);return p?[{role,id,name:p.name,color:palette[role]||p.color,kind:p.kind,scale:p.scale,roughness:p.roughness,detail:p.detail}]:[];})};
};
BMH.finishSampleHtml=profile=>{
 const photos={wood:'wood_table_001',plank:'wood_floor',marble:'marble_01',plaster:'white_plaster_02',fabric:'terlenka'},asset=photos[profile.kind];
 return '<i class="finish-swatch finish-'+profile.kind+'" style="--finish-color:'+profile.color+'" aria-hidden="true">'+(asset?'<img class="finish-photo" src="assets/interior/textures/'+asset+'-diff.png" alt="" loading="lazy" decoding="async">':'')+'</i>';
};
BMH.visualMaterialsHtml=()=>{
 const focus=BMH.state.ui.sceneFocus||'',room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===focus),palette=BMH.finishPalette(room?.id),esc=BMH.esc;
 if(!room){const rooms=BMH.state.project.plan.rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type));palette.visualMaterials=Object.fromEntries(['floor','wall','accent','fabric'].map(role=>{const ids=[...new Set(rooms.map(r=>BMH.finishPalette(r.id).visualMaterials?.[role]))];return [role,ids.length===1?ids[0]:''];}));}
 return '<section class="visual-materials" aria-label="Vật liệu trong ảnh"><div><span>MẪU BỀ MẶT</span><h3>Chọn vật liệu, thấy ngay trong 3D.</h3><p>'+esc(room?'Áp dụng riêng cho '+room.name:'Áp dụng cho các phòng trong nhà')+'. Vân, độ nhám và độ bóng đổi cùng lựa chọn.</p></div><div class="visual-material-groups">'+[['floor','Sàn'],['wall','Tường'],['accent','Gỗ & tủ'],['fabric','Sofa & vải']].map(([role,label])=>'<fieldset><legend>'+label+'</legend>'+BMH.VISUAL_MATERIALS.filter(p=>p.role===role).map(p=>'<button type="button" data-visual-material="'+p.id+'" data-visual-role="'+role+'" aria-pressed="'+(palette.visualMaterials?.[role]===p.id)+'" title="'+esc(p.detail)+'">'+BMH.finishSampleHtml(p)+'<span>'+esc(p.name)+'</span></button>').join('')+'</fieldset>').join('')+'</div><small>Mẫu bề mặt chung, có texture CC0. Mã hàng, ảnh sản phẩm và báo giá chọn riêng tại showroom.</small></section>';
};
BMH.visualMaterialsQuickHtml=()=>{
 const room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===BMH.state.ui.sceneFocus),rooms=room?[room]:BMH.state.project.plan.rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type)),esc=BMH.esc;
 return '<div class="visual-material-quick"><b>Vật liệu trong ảnh</b><small>'+esc(room?'Riêng '+room.name:'Các phòng trong nhà')+'</small>'+[['floor','Sàn'],['wall','Tường'],['accent','Gỗ & tủ'],['fabric','Sofa & vải']].map(([role,label])=>{const ids=[...new Set(rooms.map(r=>BMH.finishPalette(r.id).visualMaterials?.[role]))],selected=ids.length===1?ids[0]:'';return '<label>'+label+'<select data-visual-material-select="'+role+'"><option value="" disabled '+(!selected?'selected':'')+'>Theo từng phòng</option>'+BMH.VISUAL_MATERIALS.filter(p=>p.role===role).map(p=>'<option value="'+p.id+'" '+(selected===p.id?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></label>';}).join('')+'<small>Đổi vân, độ nhám và độ bóng ngay trong 3D.</small></div>';
};
const materialsScreen=BMH.screen7;
BMH.screen7=()=>materialsScreen().replace('<section class="interior-collections">',BMH.visualMaterialsHtml()+'<section class="interior-collections">').replace('<details open><summary>Ngoại thất</summary>',BMH.visualMaterialsQuickHtml()+'<details open><summary>Ngoại thất</summary>');BMH.SCREENS[5]=BMH.screen7;
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-visual-material]');if(!button)return;const room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===BMH.state.ui.sceneFocus);if(BMH.applyVisualMaterial(button.dataset.visualRole,button.dataset.visualMaterial,room?.id)){if(!BMH.refreshStudioFinishes?.(button.dataset.visualRole,room?.id))BMH.render({preserveScroll:true});BMH.toast('Đã đổi bề mặt '+(room?room.name:'các phòng trong nhà')+'.');}});
document.addEventListener('change',event=>{const select=event.target;if(!select.matches?.('[data-visual-material-select]'))return;const room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===BMH.state.ui.sceneFocus);if(BMH.applyVisualMaterial(select.dataset.visualMaterialSelect,select.value,room?.id)&&!BMH.refreshStudioFinishes?.(select.dataset.visualMaterialSelect,room?.id))BMH.render({preserveScroll:true});});
