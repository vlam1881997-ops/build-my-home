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
const visualPalette=BMH.finishPalette;
BMH.finishPalette=roomId=>{
 const palette=visualPalette?.(roomId)||{},profiles=Object.fromEntries(Object.entries(palette.visualMaterials||{}).map(([role,id])=>[role,BMH.VISUAL_MATERIALS.find(p=>p.id===id&&p.role===role)]).filter(([,p])=>p));
 return {...palette,...(profiles.floor?{surface:profiles.floor.surface}:{})};
};
BMH.applyVisualMaterial=(role,id,roomId=null)=>{
 const profile=BMH.VISUAL_MATERIALS.find(p=>p.id===id&&p.role===role),p=BMH.state.project;
 if(!profile||roomId&&!p.plan.rooms.some(r=>r.id===roomId))return false;
 BMH.rememberFinishCamera();
 const f=p.materials.finish||={exterior:null,rooms:{}};f.rooms||={};
 const rooms=roomId?p.plan.rooms.filter(r=>r.id===roomId):p.plan.rooms.filter(r=>['living','bed','kitchen','bath'].includes(r.type));
 for(const room of rooms){const previous=BMH.finishPalette(room.id);f.rooms[room.id]={...previous,[role]:profile.color,visualMaterials:{...previous.visualMaterials,[role]:id},...(role==='floor'?{surface:profile.surface}:{})};}
 if(!roomId&&role==='wall')f.exterior={...f.exterior,wall:profile.color};
 BMH.state.ui.renderMode='interactive';BMH.finishInvalidate?.();BMH.save();return true;
};
BMH.visualMaterialContext=roomId=>{
 const palette=BMH.finishPalette(roomId),collection=roomId?BMH.interiorCollection(roomId):null;
 return {collection:collection?{id:collection.id,name:collection.name,note:collection.note,shape:collection.shape,table:collection.table}:null,palette:Object.fromEntries(['wall','floor','accent','fabric','pillow','rug'].map(role=>[role,palette[role]]).filter(([,value])=>/^#[0-9a-f]{6}$/i.test(value||''))),surface:palette.surface||'auto',surfaces:Object.entries(palette.visualMaterials||{}).flatMap(([role,id])=>{const p=BMH.VISUAL_MATERIALS.find(p=>p.id===id&&p.role===role);return p?[{role,id,name:p.name,color:palette[role]||p.color,kind:p.kind,scale:p.scale,roughness:p.roughness,detail:p.detail}]:[];})};
};
BMH.visualMaterialsHtml=()=>{
 const focus=BMH.state.ui.sceneFocus||'',room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===focus),palette=BMH.finishPalette(room?.id),esc=BMH.esc;
 if(!room){const rooms=BMH.state.project.plan.rooms.filter(r=>['living','bed','kitchen','bath'].includes(r.type));palette.visualMaterials=Object.fromEntries(['floor','wall','accent','fabric'].map(role=>{const ids=[...new Set(rooms.map(r=>BMH.finishPalette(r.id).visualMaterials?.[role]))];return [role,ids.length===1?ids[0]:''];}));}
 return '<section class="visual-materials" aria-label="Vật liệu trong ảnh"><div><span>VẬT LIỆU TRONG ẢNH</span><h3>Đổi bề mặt, thấy ngay trong 3D.</h3><p>'+esc(room?'Áp dụng riêng cho '+room.name:'Áp dụng cho các phòng trong nhà')+'. Vân, độ nhám và độ bóng đổi cùng lựa chọn.</p></div><div class="visual-material-groups">'+[['floor','Sàn'],['wall','Tường'],['accent','Gỗ & tủ'],['fabric','Sofa & vải']].map(([role,label])=>'<fieldset><legend>'+label+'</legend>'+BMH.VISUAL_MATERIALS.filter(p=>p.role===role).map(p=>'<button type="button" data-visual-material="'+p.id+'" data-visual-role="'+role+'" aria-pressed="'+(palette.visualMaterials?.[role]===p.id)+'" title="'+esc(p.detail)+'"><i class="finish-swatch finish-'+p.kind+'" style="--finish-color:'+p.color+'" aria-hidden="true"></i><span>'+esc(p.name)+'</span></button>').join('')+'</fieldset>').join('')+'</div><small>Bề mặt mô phỏng. Mã hàng, ảnh sản phẩm và báo giá được chọn riêng tại showroom.</small></section>';
};
BMH.visualMaterialsQuickHtml=()=>{
 const room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===BMH.state.ui.sceneFocus),rooms=room?[room]:BMH.state.project.plan.rooms.filter(r=>['living','bed','kitchen','bath'].includes(r.type)),esc=BMH.esc;
 return '<div class="visual-material-quick"><b>Vật liệu trong ảnh</b><small>'+esc(room?'Riêng '+room.name:'Các phòng trong nhà')+'</small>'+[['floor','Sàn'],['wall','Tường'],['accent','Gỗ & tủ'],['fabric','Sofa & vải']].map(([role,label])=>{const ids=[...new Set(rooms.map(r=>BMH.finishPalette(r.id).visualMaterials?.[role]))],selected=ids.length===1?ids[0]:'';return '<label>'+label+'<select data-visual-material-select="'+role+'"><option value="" disabled '+(!selected?'selected':'')+'>Theo từng phòng</option>'+BMH.VISUAL_MATERIALS.filter(p=>p.role===role).map(p=>'<option value="'+p.id+'" '+(selected===p.id?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></label>';}).join('')+'<small>Đổi vân, độ nhám và độ bóng ngay trong 3D.</small></div>';
};
const materialsScreen=BMH.screen7;
BMH.screen7=()=>materialsScreen().replace('<section class="interior-collections">',BMH.visualMaterialsHtml()+'<section class="interior-collections">').replace('<details open><summary>Ngoại thất</summary>',BMH.visualMaterialsQuickHtml()+'<details open><summary>Ngoại thất</summary>');BMH.SCREENS[5]=BMH.screen7;
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-visual-material]');if(!button)return;const room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===BMH.state.ui.sceneFocus);if(BMH.applyVisualMaterial(button.dataset.visualRole,button.dataset.visualMaterial,room?.id)){BMH.render({preserveScroll:true});BMH.toast('Đã đổi bề mặt '+(room?room.name:'các phòng trong nhà')+'.');}});
document.addEventListener('change',event=>{const select=event.target;if(!select.matches?.('[data-visual-material-select]'))return;const room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===BMH.state.ui.sceneFocus);if(BMH.applyVisualMaterial(select.dataset.visualMaterialSelect,select.value,room?.id))BMH.render({preserveScroll:true});});
