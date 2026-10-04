/* Visible inspiration, customer room requests and a measured room walkthrough. */
(()=>{
 const B=BMH,esc=B.esc,template=html=>{const t=document.createElement('template');t.innerHTML=html;return t;};
 const select=(attr,label,items,value)=>'<label>'+label+'<select '+attr+'>'+items.map(([id,name])=>'<option value="'+esc(id)+'" '+(String(id)===String(value)?'selected':'')+'>'+esc(name)+'</option>').join('')+'</select></label>';
 const repaint=()=>{B.save();B.render({preserveScroll:true});};
 const aiFetch=B.aiFetch;B.aiFetch=async(url,options={})=>{
  if(options.signal||!String(url).startsWith('/api/'))return aiFetch(url,options);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),String(url).includes('gemini-scan')?150000:85000);
  try{return await aiFetch(url,{...options,signal:controller.signal});}catch(error){if(error.name==='AbortError')throw new Error('AI chưa trả kết quả trong thời gian chờ. Kiểm tra trạng thái Gemini trước khi thử lại.');throw error;}finally{clearTimeout(timer);}
 };
 B.addProgramRoom=(floor,type='laundry')=>{
  const rows=B.ensureFloorProgram(false),entry=B.EXTRA_ROOM_TYPES.find(([id])=>id===type);if(!rows[floor]||!entry)return false;
  B.pushPlanHistory();const room={id:B.uid('request'),type,name:entry[1],count:1,minArea:['gym','hobby'].includes(type)?9:4};rows[floor].extraRooms.push(room);
  B.designState().program={...B.designState().program,mode:'custom',floors:rows};B.designState().programNotice='';repaint();return room;
 };
 B.editProgramRoom=(floor,id,field,value)=>{
  const rows=B.ensureFloorProgram(false),r=rows[floor]?.extraRooms.find(x=>x.id===id);if(!r||!['name','count','minArea','type'].includes(field))return false;
  if(field==='type'&&!B.EXTRA_ROOM_TYPES.some(([k])=>k===value))return false;
  B.pushPlanHistory();if(field==='type'){if(B.EXTRA_ROOM_TYPES.some(([,n])=>n===r.name))r.name=B.EXTRA_ROOM_TYPES.find(([k])=>k===value)[1];r.type=value;}else r[field]=['count','minArea'].includes(field)?Number(value):String(value).trim().slice(0,60);
  B.designState().program={...B.designState().program,mode:'custom',floors:rows};B.designState().programNotice='';repaint();return true;
 };
 B.removeProgramRoom=(floor,id)=>{const rows=B.ensureFloorProgram(false);if(!rows[floor]?.extraRooms.some(x=>x.id===id))return false;B.pushPlanHistory();rows[floor].extraRooms=rows[floor].extraRooms.filter(x=>x.id!==id);B.designState().program={...B.designState().program,mode:'custom',floors:rows};repaint();return true;};
 B.extraRoomProgramHtml=floor=>{
  const rows=B.ensureFloorProgram(false),rooms=rows[floor]?.extraRooms||[];
  return '<section class="customer-extra-rooms"><div><h3>Thêm phòng theo ý bạn</h3><button type="button" data-program-room-add="'+floor+'">+ Thêm phòng</button></div><p>Phòng giặt, kho, phòng tập hoặc một không gian bạn tự đặt tên.</p>'+rooms.map(r=>'<article data-program-room-id="'+esc(r.id)+'" data-program-room-floor="'+floor+'">'+select('data-program-room-field="type"','Loại phòng',B.EXTRA_ROOM_TYPES,r.type)+'<label>Tên phòng<input data-program-room-field="name" maxlength="60" value="'+esc(r.name)+'"></label><label>Số phòng<input type="number" min="1" max="20" step="1" data-program-room-field="count" value="'+r.count+'"></label><label>DT tối thiểu · m²<input type="number" min="2" max="200" step=".5" data-program-room-field="minArea" value="'+r.minArea+'"></label><button type="button" data-program-room-remove="'+esc(r.id)+'" aria-label="Xóa yêu cầu '+esc(r.name)+'">×</button></article>').join('')+(rooms.length?'<small>Bố trí sẽ dành ít nhất diện tích này. Không đủ đất: giữ thiết kế hiện tại và báo để bạn điều chỉnh.</small>':'')+'</section>';
 };
 const chooser=B.programChooserHtml;B.programChooserHtml=()=>{const t=template(chooser()),f=B.clamp(Number(B.state.ui.programFloor)||0,0,Number(B.state.project.site.floors)-1);t.content.querySelector('.customer-program-fields')?.insertAdjacentHTML('beforeend',B.extraRoomProgramHtml(f));return t.innerHTML;};

 // Reference pictures are visible; product/material detail remains available below.
 const styleHtml=B.styleOutputHtml;
 B.styleOutputHtml=()=>{
  const t=template(styleHtml()),details=t.content.firstElementChild,selector=details.querySelector('[data-customer-style]')?.closest('label'),profile=B.customerStyleProfile(),palette=B.finishPalette(),mixed=B.styleOutputReview().rooms.filter(r=>!r.styleAligned).length;
  selector?.remove();details.className='customer-style-details';details.querySelector('summary').innerHTML='<span><b>Vật liệu & công năng từng phòng</b><small>'+ (mixed?mixed+' phòng đang phối riêng':'Đối chiếu thiết kế đang chọn')+'</small></span><span>Xem chi tiết</span>';
  const illustration=profile.style?B.styleIllustration(profile.style):'<div class="customer-custom-style">Thêm ảnh tham khảo ở Ý tưởng để mô tả phong cách riêng.</div>';
  return '<section class="customer-style-output customer-moodboard"><div class="customer-moodboard-heading"><div><span>PHONG CÁCH CỦA BẠN</span><h2>'+esc(profile.name)+'</h2><p>'+esc(profile.style?.description||'Phong cách riêng từ ý tưởng của bạn')+'</p></div>'+ (selector?.outerHTML||'')+'</div><div class="customer-inspiration-grid"><figure>'+illustration+'<figcaption>Kiến trúc tham khảo · '+esc(profile.name)+'</figcaption></figure><figure><img src="assets/interior/collections/'+esc(profile.collection.id)+'.jpg" alt="Nội thất tham khảo '+esc(profile.collection.name)+'" width="480" height="320" loading="lazy"><figcaption>Nội thất tham khảo · '+esc(profile.collection.name)+'</figcaption></figure><div class="customer-picked-finishes"><b>Vật liệu đang chọn</b>'+[['floor','Sàn'],['wall','Tường'],['accent','Gỗ / tủ'],['fabric','Vải']].map(([role,name])=>{const v=B.VISUAL_MATERIALS.find(v=>v.role===role&&v.id===palette.visualMaterials?.[role]);return '<div><i style="background:'+esc(palette[role]||'#eee')+'"></i><span><small>'+name+'</small><b>'+esc(v?.name||'Màu riêng')+'</b></span></div>';}).join('')+'<small>Ảnh mẫu để chọn phong cách. Mô hình 3D bên dưới dùng mặt bằng và vật liệu của dự án.</small></div></div>'+details.outerHTML+'</section>';
 };

 B.customerRoomWalkHtml=()=>{
  const p=B.state.project,u=B.state.ui,focus=u.sceneFocus||'all',current=p.plan.rooms.find(r=>'room:'+r.id===focus),floor=current?.floor??(focus.startsWith('floor:')?Number(focus.slice(6)):0),rooms=p.plan.rooms.filter(r=>r.floor===floor&&!['stairs','elevator','corridor','utility'].includes(r.type));
  return '<section class="customer-room-walk"><div class="customer-room-walk-head"><div><span>KHÁM PHÁ KHÔNG GIAN</span><h2>'+esc(current?.name||'Đi qua từng phòng')+'</h2></div>'+select('data-experience-floor','Tầng',Array.from({length:p.site.floors},(_,i)=>[i,'Tầng '+(i+1)]),floor)+'<button type="button" data-experience-floor-view="'+floor+'">Xem 3D tầng '+(floor+1)+'</button></div><div class="customer-room-walk-cards">'+rooms.map(r=>{const key=B.cinematicSignature('room:'+r.id),image=B.cinematicRender.views[key];return '<button type="button" data-design-room="'+esc(r.id)+'" aria-pressed="'+(r.id===current?.id)+'"><div>'+ (image?'<img src="'+esc(image)+'" alt="Phối cảnh '+esc(r.name)+'">':B.designPlanPreview({rooms:[r],openings:p.plan.openings},floor))+'</div><b>'+esc(r.name)+'</b><small>'+B.num(r.w*r.h,1)+' m² · '+B.num(r.w,2)+' × '+B.num(r.h,2)+' m</small></button>';}).join('')+'</div><p>Chọn phòng để xem 3D theo số đo. Xoay, phóng to hoặc bước vào phòng.</p></section>';
 };
 const studio=B.screen7;B.screen7=()=>{
  const t=template(studio()),root=t.content.querySelector('.design-studio');if(!root)return t.innerHTML;
  const old=root.querySelector('[data-guided-panel="rooms"]')||root.querySelector('.design-room-list');if(old){const previous=old.querySelector('.design-room-actions')?.outerHTML||'',walk=template(B.customerRoomWalkHtml()).content.firstElementChild;old.replaceWith(walk);if(previous)walk.insertAdjacentHTML('beforeend','<details class="customer-room-ai-options"><summary>Phối cảnh & tư vấn cho nhiều phòng</summary>'+previous+'<button data-room-review>AI phân tích bản vẽ & các phòng</button></details>');}
  const ai=root.querySelector('[data-cinematic-render]'),brief=root.querySelector('.design-brief');if(ai&&brief){ai.textContent=B.cinematicRender.loading?'Gemini đang tạo ảnh…':'✦ Tạo ảnh phối cảnh · Gemini';ai.classList.add('customer-visible-ai');const options=ai.closest('[data-guided-panel="ai-image"]');options?.remove();brief.append(ai);brief.insertAdjacentHTML('beforeend','<small class="customer-ai-caption">Tạo khi bạn bấm. Ảnh AI dùng góc 3D, phong cách và vật liệu đang chọn.</small>');}
  return t.innerHTML;
 };B.SCREENS[5]=B.screen7;
 const planner=B.screen5;B.screen5=()=>{const t=template(planner());if(B.state.ui.planner.directTool==='room'&&B.state.ui.planner.drawRoomType==='custom')t.content.querySelector('.customer-direct-tools')?.insertAdjacentHTML('beforeend','<label>Tên phòng muốn thêm<input data-direct-custom-name maxlength="60" value="'+esc(B.state.ui.planner.drawRoomName||'')+'" placeholder="Ví dụ: Phòng may / phòng nhạc"></label>');return t.innerHTML;};B.SCREENS[3]=B.screen5;
 B.setCustomerFloorView=f=>{f=Number(f);if(!Number.isInteger(f)||f<0||f>=B.state.project.site.floors)return false;B.state.ui.sceneFocus='floor:'+f;B.state.ui.designView='layout';B.state.ui.sceneExploded=false;repaint();return true;};
 document.addEventListener('click',e=>{
  const add=e.target.closest?.('[data-program-room-add]');if(add){B.addProgramRoom(Number(add.dataset.programRoomAdd));return;}
  const remove=e.target.closest?.('[data-program-room-remove]');if(remove){const row=remove.closest('[data-program-room-floor]');B.removeProgramRoom(Number(row.dataset.programRoomFloor),remove.dataset.programRoomRemove);return;}
  const floor=e.target.closest?.('[data-experience-floor-view]');if(floor)B.setCustomerFloorView(floor.dataset.experienceFloorView);
 });
 document.addEventListener('change',e=>{const t=e.target;if(t.matches?.('[data-program-room-field]')){const row=t.closest('[data-program-room-id]');B.editProgramRoom(Number(row.dataset.programRoomFloor),row.dataset.programRoomId,t.dataset.programRoomField,t.value);return;}if(t.matches?.('[data-experience-floor]'))B.setCustomerFloorView(t.value);});
 document.addEventListener('input',e=>{if(e.target.matches?.('[data-direct-custom-name]')){B.state.ui.planner.drawRoomName=e.target.value.slice(0,60);B.save();}});
})();
