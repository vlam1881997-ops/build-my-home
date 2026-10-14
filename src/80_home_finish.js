/* Customer finishing studio. Photos and generated media stay in IndexedDB;
 * project state contains only IDs, briefs and selected measurable model finishes. */
BMH.finishRuntime={images:new Map(),restoring:new Set(),busy:'',error:'',notice:'',controller:null,sequence:0,compare:50};
BMH.finishState=()=>{
  const p=BMH.state.project;
  if(!p.homeFinish||typeof p.homeFinish!=='object'||Array.isArray(p.homeFinish))p.homeFinish={};
  const s=p.homeFinish;
  if(!Array.isArray(s.photos))s.photos=[];
  s.photos=s.photos.filter(x=>x&&typeof x.id==='string').slice(0,3);
  s.preferences={style:'Hiện đại',budget:'balanced',notes:'',...(s.preferences||{})};
  s.analyses=s.analyses&&typeof s.analyses==='object'?s.analyses:{};
  s.selected=s.selected&&typeof s.selected==='object'?s.selected:{};
  s.satisfaction=s.satisfaction&&typeof s.satisfaction==='object'?s.satisfaction:{};
  if(!s.photos.some(x=>x.id===s.activePhotoId))s.activePhotoId=s.photos[0]?.id||'';
  return s;
};
BMH.finishPhoto=()=>{const s=BMH.finishState();return s.photos.find(x=>x.id===s.activePhotoId)||null;};
BMH.finishHash=value=>{let n=2166136261;for(const c of String(value))n=Math.imul(n^c.charCodeAt(0),16777619);return (n>>>0).toString(36);};
BMH.finishGeometryKey=()=>JSON.stringify({site:((s)=>({width:s.width,depth:s.depth,floors:s.floors,floorHeight:s.floorHeight,slabThickness:s.slabThickness}))(BMH.state.project.site),plan:BMH.state.project.plan});
BMH.finishAnalysisKey=()=>{const s=BMH.finishState(),p=BMH.finishPhoto();return JSON.stringify({photo:p?.id,target:p?.target,roomId:p?.roomId,preferences:s.preferences,geometry:BMH.finishGeometryKey()});};
BMH.finishAnalysis=()=>{const s=BMH.finishState(),a=s.analyses[s.activePhotoId];return a?.signature===BMH.finishAnalysisKey()?a:null;};
BMH.finishVariant=()=>{const s=BMH.finishState(),a=BMH.finishAnalysis();return a?.result?.variants?.find(x=>x.id===s.selected[s.activePhotoId])||null;};
BMH.finishRenderKey=variant=>{const p=BMH.finishPhoto();return p&&variant?'finish-render:'+p.id+':'+BMH.finishHash(BMH.finishAnalysisKey()+JSON.stringify(variant)):'';};
BMH.finishApprovalKey=()=>{const v=BMH.finishVariant();return v?BMH.finishRenderKey(v)+'|'+BMH.finishGeometryKey():'';};
BMH.finishSatisfied=()=>{const k=BMH.finishApprovalKey();return !!k&&BMH.finishState().satisfaction.signature===k&&!!BMH.finishRuntime.images.get(BMH.finishRenderKey(BMH.finishVariant()));};

BMH.finishMedia=async(mode,key,value)=>{
  if(!window.indexedDB)throw new Error('Trình duyệt chưa hỗ trợ lưu ảnh. Hãy mở BMH bằng Chrome hoặc Safari.');
  const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('bmh-home-finish',1);r.onupgradeneeded=()=>r.result.createObjectStore('media',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  try{return await new Promise((resolve,reject)=>{const tx=db.transaction('media',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('media');let found;
    const r=mode==='put'?store.put({key,value,at:Date.now()}):mode==='delete'?store.delete(key):store.get(key);
    r.onsuccess=()=>{found=r.result?.value;};tx.oncomplete=()=>resolve(mode==='get'?found:null);tx.onerror=()=>reject(tx.error||new Error('Không lưu được ảnh.'));tx.onabort=()=>reject(tx.error||new Error('Không lưu được ảnh.'));
  });}finally{db.close();}
};
BMH.finishRestore=key=>{
  const rt=BMH.finishRuntime;if(!key||rt.images.has(key)||rt.restoring.has(key))return;
  rt.restoring.add(key);queueMicrotask(()=>BMH.finishMedia('get',key).then(image=>{if(image&&/^data:image\/(jpeg|png|webp);base64,/.test(image)){rt.images.set(key,image);if([1,6].includes(BMH.state.ui.step))BMH.render({preserveScroll:true});}}).catch(()=>{}));
};
BMH.finishCancel=()=>{const rt=BMH.finishRuntime;rt.controller?.abort();rt.controller=null;rt.sequence++;rt.busy='';};
BMH.finishInvalidate=()=>{BMH.finishCancel();BMH.finishState().satisfaction={};BMH.finishRuntime.error='';BMH.finishRuntime.notice='';};
BMH.finishCompress=async file=>{
  if(!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>20*1024*1024)throw new Error('Chọn ảnh JPG, PNG hoặc WEBP dưới 20 MB.');
  let bitmap;try{bitmap=await createImageBitmap(file);const scale=Math.min(1,1280/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
    for(const quality of [.84,.7,.55]){const image=canvas.toDataURL('image/jpeg',quality);if(image.length<1_450_000)return image;}
    throw new Error('Ảnh còn quá lớn. Hãy chọn ảnh có độ phân giải thấp hơn.');
  }catch(err){if(!bitmap&&file.size<900_000)return BMH.fileToDataUrl(file);throw err;}finally{bitmap?.close?.();}
};
BMH.finishAddPhotos=async files=>{
  const rt=BMH.finishRuntime,s=BMH.finishState();if(rt.busy)return;
  const list=Array.from(files||[]).slice(0,3-s.photos.length);if(!list.length)return BMH.toast('Mỗi dự án lưu tối đa ba góc chụp. Xóa một ảnh để thêm ảnh khác.');
  const sequence=++rt.sequence;rt.busy='upload';rt.error='';BMH.render({preserveScroll:true});
  try{for(const file of list){const image=await BMH.finishCompress(file);if(sequence!==rt.sequence||BMH.finishState()!==s)return;const photo={id:BMH.uid('home-photo'),name:file.name.slice(0,150),target:'exterior',roomId:'',addedAt:new Date().toISOString()},key='finish-photo:'+photo.id;await BMH.finishMedia('put',key,image);if(sequence!==rt.sequence||BMH.finishState()!==s){await BMH.finishMedia('delete',key).catch(()=>{});return;}rt.images.set(key,image);s.photos.push(photo);s.activePhotoId=photo.id;s.satisfaction={};BMH.save();}
    rt.notice='Đã lưu ảnh. Chọn không gian và sở thích, rồi nhận ba phương án.';
  }catch(error){if(sequence===rt.sequence)rt.error=error.message;}finally{if(sequence===rt.sequence){rt.busy='';BMH.render({preserveScroll:true});}}
};
BMH.finishRemovePhoto=async id=>{
  const s=BMH.finishState(),rt=BMH.finishRuntime;BMH.finishInvalidate();const a=s.analyses[id];
  const keys=['finish-photo:'+id,...(a?.renderKeys||[])];s.photos=s.photos.filter(x=>x.id!==id);delete s.analyses[id];delete s.selected[id];if(s.activePhotoId===id)s.activePhotoId=s.photos[0]?.id||'';
  for(const key of keys){rt.images.delete(key);rt.restoring.delete(key);await BMH.finishMedia('delete',key).catch(()=>{});}BMH.save();BMH.render({preserveScroll:true});
};
BMH.finishFetch=async(url,body,timeout=70_000)=>{
  const rt=BMH.finishRuntime,controller=new AbortController();rt.controller=controller;const timer=setTimeout(()=>controller.abort(),timeout);
  try{const r=await (BMH.aiFetch||fetch)(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal}),data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'Chưa xử lý được yêu cầu. Hãy thử lại.');return data;}
  catch(error){if(error.name==='AbortError')throw new Error('Đã dừng yêu cầu hoặc xử lý quá lâu. Ảnh gốc vẫn được giữ.');throw error;}
  finally{clearTimeout(timer);if(rt.controller===controller)rt.controller=null;}
};
BMH.finishAnalyze=async()=>{
  const s=BMH.finishState(),photo=BMH.finishPhoto(),rt=BMH.finishRuntime;if(!photo||rt.busy)return;
  const signature=BMH.finishAnalysisKey(),sequence=++rt.sequence;rt.busy='analyze';rt.error='';rt.notice='';s.satisfaction={};BMH.render({preserveScroll:true});
  try{const image=rt.images.get('finish-photo:'+photo.id)||await BMH.finishMedia('get','finish-photo:'+photo.id).catch(()=>null);
    if(sequence!==rt.sequence||BMH.finishState()!==s||signature!==BMH.finishAnalysisKey())return;
    if(!image)throw new Error('Không tìm thấy ảnh trên thiết bị này. Hãy chọn lại ảnh gốc.');
    const p=BMH.state.project,verified=BMH.state.ui.onboardingComplete!==false&&s.geometryKey===BMH.finishGeometryKey(),room=verified?p.plan.rooms.find(r=>r.id===photo.roomId):null;
    const data=await BMH.finishFetch('/api/ai?operation=home-finish',{image,target:photo.target,preferences:s.preferences,project:{style:s.preferences.style,site:{province:p.site.province,frontDirection:p.site.frontDirection},room}});
    if(sequence!==rt.sequence||signature!==BMH.finishAnalysisKey())return;
    if(!Array.isArray(data.result?.variants)||data.result.variants.length!==3)throw new Error('Chưa nhận đủ ba phương án. Hãy thử lại.');
    s.analyses[photo.id]={signature,result:data.result,generatedAt:data.generatedAt,renderKeys:s.analyses[photo.id]?.renderKeys||[]};s.selected[photo.id]=data.result.variants[0].id;BMH.save();rt.notice='Chọn phương án thích nhất hoặc đổi bảng màu trước khi tạo ảnh.';
  }catch(error){if(sequence===rt.sequence)rt.error=error.message;}finally{if(sequence===rt.sequence){rt.busy='';BMH.render({preserveScroll:true});}}
};
BMH.finishGenerate=async()=>{
  const s=BMH.finishState(),photo=BMH.finishPhoto(),variant=BMH.finishVariant(),rt=BMH.finishRuntime;if(!photo||!variant||rt.busy)return;
  const key=BMH.finishRenderKey(variant),signature=BMH.finishAnalysisKey(),sequence=++rt.sequence;rt.busy='render';rt.error='';s.satisfaction={};BMH.render({preserveScroll:true});
  try{const image=rt.images.get('finish-photo:'+photo.id)||await BMH.finishMedia('get','finish-photo:'+photo.id).catch(()=>null);
    if(sequence!==rt.sequence||BMH.finishState()!==s||key!==BMH.finishRenderKey(BMH.finishVariant())||signature!==BMH.finishAnalysisKey())return;
    if(!image)throw new Error('Hãy chọn lại ảnh gốc trên thiết bị này.');
    const data=await BMH.finishFetch('/api/gemini-render',{mode:'home-finish',image,target:photo.target,variant,notes:s.preferences.notes});
    if(sequence!==rt.sequence||key!==BMH.finishRenderKey(BMH.finishVariant())||signature!==BMH.finishAnalysisKey())return;
    if(!data.image||!/^image\/(png|jpeg|webp)$/.test(data.mimeType))throw new Error('Chưa nhận được ảnh phối cảnh hoàn thiện.');
    const result='data:'+data.mimeType+';base64,'+data.image;let saved=true;await BMH.finishMedia('put',key,result).catch(()=>{saved=false;});
    if(sequence!==rt.sequence||key!==BMH.finishRenderKey(BMH.finishVariant())){if(saved)await BMH.finishMedia('delete',key).catch(()=>{});return;}
    rt.images.set(key,result);const a=s.analyses[photo.id],keys=[...new Set([...(a.renderKeys||[]),key])],expired=keys.slice(0,-12);a.renderKeys=keys.slice(-12);BMH.save();
    for(const old of expired){rt.images.delete(old);rt.restoring.delete(old);BMH.finishMedia('delete',old).catch(()=>{});}
    rt.notice=saved?'Kéo thanh so sánh để xem nhà thô và phương án hoàn thiện.':'Phối cảnh đã sẵn sàng. Thiết bị hết chỗ lưu; ảnh này chỉ giữ trong phiên đang mở.';
  }catch(error){if(sequence===rt.sequence)rt.error=error.message;}finally{if(sequence===rt.sequence){rt.busy='';BMH.render({preserveScroll:true});}}
};
BMH.finishApply=()=>{
  const s=BMH.finishState(),photo=BMH.finishPhoto(),v=BMH.finishVariant(),p=BMH.state.project;if(!v||!photo)return false;
  if(BMH.state.ui.onboardingComplete===false||s.geometryKey!==BMH.finishGeometryKey()){BMH.toast('Kiểm tra mặt bằng và xác nhận số đo trước khi xem phương án này trong 3D.');return false;}
  if(photo.target==='interior'&&!p.plan.rooms.some(r=>r.id===photo.roomId)){BMH.toast('Chọn phòng trong mặt bằng để đặt bảng màu vào đúng không gian.');return false;}
  const finish=p.materials.finish||(p.materials.finish={exterior:null,rooms:{}});finish.rooms=finish.rooms||{};
  const colors={wall:v.palette.wall.hex,accent:v.palette.accent.hex,floor:v.palette.floor.hex,name:v.name};
  if(photo.target==='interior')finish.rooms[photo.roomId]=colors;else finish.exterior=colors;
  BMH.state.ui.sceneFocus=photo.target==='interior'?'room:'+photo.roomId:'all';BMH.state.ui.architectureEngine='existing';BMH.save();BMH.navigateTo(6);return true;
};
BMH.finishPalette=roomId=>{const f=BMH.state.project.materials.finish;return roomId?f?.rooms?.[roomId]||f?.exterior:f?.exterior;};
BMH.finishAccept=()=>{
  const rt=BMH.finishRuntime,v=BMH.finishVariant(),key=BMH.finishRenderKey(v);if(!v||!rt.images.get(key))return BMH.toast('Tạo và xem phối cảnh của phương án đang chọn trước khi xác nhận.');
  BMH.finishState().satisfaction={signature:BMH.finishApprovalKey(),confirmedAt:new Date().toISOString()};BMH.save();BMH.render({preserveScroll:true});
};
BMH.finishEntryHtml=()=>'<section class="finish-entry"><div><span class="finish-eyebrow">NGÔI NHÀ CỦA BẠN</span><h2>Bắt đầu từ ý tưởng hay ngôi nhà đang xây?</h2><p>Thiết kế, xem trước và chỉnh lại cho đến khi bạn hài lòng.</p></div><div class="finish-entry-actions"><button data-finish-mode="design" class="'+(BMH.state.ui.homeMode!=='finish'?'active':'')+'">Thiết kế nhà mới</button><button data-finish-mode="finish" class="'+(BMH.state.ui.homeMode==='finish'?'active':'')+'">Hoàn thiện từ ảnh nhà thô</button></div></section>';
BMH.finishStudioHtml=()=>{
  const s=BMH.finishState(),photo=BMH.finishPhoto(),a=BMH.finishAnalysis(),v=BMH.finishVariant(),rt=BMH.finishRuntime,esc=BMH.esc;
  for(const p of s.photos)BMH.finishRestore('finish-photo:'+p.id);
  const original=photo?rt.images.get('finish-photo:'+photo.id)||'':'';
  const key=BMH.finishRenderKey(v);BMH.finishRestore(key);const after=rt.images.get(key)||'',busy=!!rt.busy;
  const colors=v?Object.entries(v.palette).map(([role,c])=>'<label><span>'+esc({wall:'Tường / sơn',accent:'Điểm nhấn',floor:'Sàn'}[role])+'</span><input type="color" data-finish-color="'+role+'" value="'+esc(c.hex)+'" '+(busy?'disabled':'')+'><small>'+esc(c.name)+' · '+esc(c.hex)+'</small></label>').join(''):'';
  const variants=a?.result?.variants?.map(x=>{const k=BMH.finishRenderKey(x);BMH.finishRestore(k);const image=rt.images.get(k);return '<button class="finish-variant '+(v?.id===x.id?'active':'')+'" data-finish-variant="'+x.id+'" aria-pressed="'+(v?.id===x.id)+'" '+(busy?'disabled':'')+'>'+(image?'<img src="'+esc(image)+'" alt="Phối cảnh phương án '+x.id+'">':'<div class="finish-swatches">'+Object.values(x.palette).map(c=>'<i style="background:'+esc(c.hex)+'"></i>').join('')+'</div>')+'<span>PHƯƠNG ÁN '+x.id+'</span><h3>'+esc(x.name)+'</h3><p>'+esc(x.description)+'</p><small>'+esc(x.budgetNote)+'</small></button>';}).join('')||'';
  const ready=BMH.state.ui.onboardingComplete!==false,confirmed=ready&&s.geometryKey===BMH.finishGeometryKey(),satisfied=BMH.finishSatisfied();
  return '<section class="finish-studio" aria-label="Hoàn thiện từ ảnh nhà thô"><header class="finish-heading"><div><span class="finish-eyebrow">TỪ NHÀ THÔ ĐẾN TỔ ẤM</span><h1>Nhìn thấy ngôi nhà hoàn thiện.<br>Trước khi bạn quyết định.</h1><p>Chụp mặt tiền hoặc một căn phòng đang xây. Khám phá màu sơn, vật liệu và cách bố trí phù hợp với chính ngôi nhà của bạn.</p></div><span class="finish-free">Xem trước rồi quyết định</span></header><div class="finish-layout"><aside class="finish-controls"><section class="finish-card"><h2>1. Ảnh nhà của bạn</h2><p>Thêm tối đa ba góc chụp. Mỗi ảnh có phương án riêng.</p><div class="finish-upload-actions"><label class="finish-upload">＋ Chọn ảnh<input type="file" data-finish-upload multiple accept="image/jpeg,image/png,image/webp" '+(busy?'disabled':'')+'></label><label class="finish-upload secondary">Chụp ảnh<input type="file" data-finish-upload accept="image/jpeg,image/png,image/webp" capture="environment" '+(busy?'disabled':'')+'></label></div><div class="finish-photo-list">'+s.photos.map(p=>'<article><button data-finish-photo="'+esc(p.id)+'" class="'+(p.id===photo?.id?'active':'')+'" '+(busy?'disabled':'')+'>'+(rt.images.get('finish-photo:'+p.id)?'<img src="'+esc(rt.images.get('finish-photo:'+p.id))+'" alt="'+esc(p.name)+'">':'<span>Đang đọc ảnh…</span>')+'<b>'+esc(p.name)+'</b></button><button class="finish-delete" data-finish-remove="'+esc(p.id)+'" aria-label="Xóa ảnh '+esc(p.name)+'">×</button></article>').join('')+'</div><small>Ảnh lưu trên thiết bị này; chỉ gửi đi khi bạn bấm phân tích hoặc tạo phối cảnh.</small></section><section class="finish-card"><h2>2. Bạn muốn hoàn thiện gì?</h2><label>Không gian<select data-finish-target '+(!photo||busy?'disabled':'')+'><option value="exterior" '+(photo?.target!=='interior'?'selected':'')+'>Ngoại thất / mặt tiền</option><option value="interior" '+(photo?.target==='interior'?'selected':'')+'>Nội thất một căn phòng</option></select></label>'+(photo?.target==='interior'?'<label>Phòng tương ứng trên mặt bằng<select data-finish-room '+(busy?'disabled':'')+'><option value="">Chọn phòng để xem trong 3D</option>'+BMH.state.project.plan.rooms.map(r=>'<option value="'+esc(r.id)+'" '+(photo.roomId===r.id?'selected':'')+'>Tầng '+(r.floor+1)+' · '+esc(r.name)+' · '+r.w+' × '+r.h+' m</option>').join('')+'</select></label>':'')+'<label>Phong cách<select data-finish-pref="style" '+(busy?'disabled':'')+'>'+BMH.HOUSE_STYLES.map(x=>'<option '+(s.preferences.style===x.name?'selected':'')+'>'+esc(x.name)+'</option>').join('')+'</select></label><label>Mức hoàn thiện<select data-finish-pref="budget" '+(busy?'disabled':'')+'>'+[['economy','Tiết kiệm, dễ bảo trì'],['balanced','Cân bằng thẩm mỹ và chi phí'],['premium','Đầu tư cho chi tiết']].map(([k,n])=>'<option value="'+k+'" '+(s.preferences.budget===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label><label>Điều bạn thích<textarea data-finish-pref="notes" maxlength="1000" rows="3" placeholder="Ví dụ: sơn kem, gỗ sáng, nhiều cây; giữ nguyên cửa và ban công…" '+(busy?'disabled':'')+'>'+esc(s.preferences.notes)+'</textarea></label><button class="finish-primary" data-finish-analyze '+(!photo||busy?'disabled':'')+'>'+(rt.busy==='analyze'?'Đang quan sát nhà của bạn…':'Gợi ý ba phương án hoàn thiện')+'</button></section></aside><div class="finish-main"><section class="finish-card finish-visual"><div class="finish-section-title"><h2>Ảnh thật & phương án hoàn thiện</h2>'+(after?'<span>Phối cảnh minh họa từ ảnh của bạn</span>':'')+'</div>'+(original?'<div class="finish-comparison '+(after?'has-result':'')+'" style="--split:'+rt.compare+'%"><img src="'+esc(after||original)+'" alt="'+(after?'Phương án hoàn thiện đang chọn':'Ảnh nhà thô gốc')+'">'+(after?'<div class="finish-before" style="clip-path:inset(0 '+(100-rt.compare)+'% 0 0)"><img src="'+esc(original)+'" alt="Nhà thô trước hoàn thiện"></div><div class="finish-divider"></div><span class="finish-before-label">Nhà thô</span><span class="finish-after-label">Sau hoàn thiện</span>':'<span class="finish-before-label">Ảnh nhà của bạn</span>')+'</div>'+(after?'<label class="finish-compare-control">Kéo để so sánh trước / sau<input type="range" data-finish-compare min="0" max="100" value="'+rt.compare+'" aria-label="So sánh nhà thô và hoàn thiện"></label>':''):'<div class="finish-empty"><span>⌂</span><h3>Ngôi nhà thật là điểm bắt đầu.</h3><p>Chọn ảnh hoặc chụp nhà đang xây. Phương án của bạn sẽ xuất hiện tại đây.</p></div>')+(busy?'<div class="finish-progress" role="status"><i></i>'+({upload:'Đang lưu ảnh trên thiết bị…',analyze:'Đang quan sát hiện trạng và phối ba bảng màu…',render:'Đang hoàn thiện phối cảnh từ ảnh thật…'}[rt.busy]||'Đang xử lý…')+'<button data-finish-cancel>Dừng</button></div>':'')+(rt.error?'<p class="finish-error" role="alert">'+esc(rt.error)+'</p>':'')+(rt.notice?'<p class="finish-notice" role="status">'+esc(rt.notice)+'</p>':'')+'</section>'+(a?'<section class="finish-card"><h2>3. Chọn cách ngôi nhà sẽ hoàn thiện</h2><p>'+esc(a.result.summary)+'</p><div class="finish-variants">'+variants+'</div></section>':'')+(v?'<section class="finish-card finish-detail"><div><span class="finish-eyebrow">PHƯƠNG ÁN '+esc(v.id)+'</span><h2>'+esc(v.name)+'</h2><div class="finish-color-fields">'+colors+'</div><h3>'+ (photo.target==='interior'?'Nội thất & ánh sáng':'Mặt tiền & không gian ngoài trời')+'</h3><ul>'+(v[photo.target]||[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><p>'+esc(v.lighting)+'</p><button class="finish-primary" data-finish-generate '+(busy?'disabled':'')+'>'+(rt.busy==='render'?'Đang tạo phối cảnh…':after?'Tạo lại phối cảnh phương án này':'Tạo phối cảnh từ ảnh nhà tôi')+'</button><small>Ảnh tạo theo phương án đã chọn. Đổi màu hoặc sở thích sẽ cần tạo lại.</small></div><aside><h3>Giữ lại từ ngôi nhà hiện tại</h3><ul>'+(a.result.keep||[]).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>'+(a.result.questions?.length?'<h3>Cần bạn xác nhận</h3><ul>'+a.result.questions.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'')+'<h3>Vật liệu nên tham khảo</h3><ul>'+(v.materials||[]).map(x=>'<li>'+esc(x.description)+'</li>').join('')+'</ul><button class="finish-secondary" data-nav="5">Xem sản phẩm & vật liệu</button></aside></section><section class="finish-card finish-model-link"><div><h2>4. Xem không gian trong 3D</h2><p>'+ (ready?'3D xoay được dùng mặt bằng hiện tại: '+BMH.state.project.site.width+' × '+BMH.state.project.site.depth+' m · '+BMH.state.project.site.floors+' tầng.':'Bạn chưa nhập mặt bằng của ngôi nhà. Hoàn tất số đo trước khi mở mô hình 3D.')+' Ảnh không đủ để đo phần nhà khuất; kiểm tra số đo và liên kết đúng phòng trước khi áp dụng bảng màu.</p><button class="finish-secondary" data-nav="4">Kiểm tra / chỉnh mặt bằng</button></div><div><label class="finish-checkbox"><input type="checkbox" data-finish-geometry '+(confirmed?'checked':'')+' '+(!ready||busy?'disabled':'')+'>Tôi đã kiểm tra mặt bằng và số đo của ngôi nhà.</label><button class="finish-primary" data-finish-apply '+(!confirmed||busy?'disabled':'')+'>Áp dụng bảng màu & xem 3D</button></div></section><section class="finish-card finish-decision"><div><span class="finish-eyebrow">BẠN LÀ NGƯỜI QUYẾT ĐỊNH</span><h2>'+ (satisfied?'Đã lưu phương án bạn hài lòng.':'Xem kỹ, chỉnh lại, rồi mới quyết định.')+'</h2><p>'+ (satisfied?'Bạn vẫn có thể đổi ý. BMH giữ lại ảnh và phương án để tiếp tục hoàn thiện.':'Bạn có thể đổi bảng màu, phong cách hoặc tạo lại phối cảnh trước khi chọn dịch vụ.')+'</p></div><div><button class="finish-primary" data-finish-accept '+(!after||busy?'disabled':'')+'>'+ (satisfied?'✓ Đã hài lòng với phương án này':'Tôi hài lòng với phương án này')+'</button>'+(satisfied?'<button class="finish-secondary" data-finish-service>Xem hồ sơ & dịch vụ</button><small>Thanh toán đang tạm đóng trong bản hoàn thiện sản phẩm.</small>':'')+'</div></section>':'')+'</div></div></section>';
};
const finishScreen1=BMH.screen1;
const finishSetupScreen=BMH.v6SetupScreen;
BMH.v6SetupScreen=()=>BMH.finishEntryHtml()+finishSetupScreen();
const finishFooter=BMH.footer;
BMH.footer=()=>BMH.state.ui.step===1&&BMH.state.ui.homeMode==='finish'?'<div class="demo-nextbar finish-footer"><div><b>Thiết kế theo ngôi nhà của bạn</b><span>Xem trước và chỉnh phương án trước khi chọn dịch vụ.</span></div><button class="finish-secondary" data-nav="4">Mặt bằng & số đo →</button></div>':finishFooter();
BMH.screen1=()=>BMH.finishEntryHtml()+(BMH.state.ui.homeMode==='finish'?BMH.finishStudioHtml():finishScreen1());BMH.SCREENS[0]=BMH.screen1;
const finishScreen7=BMH.screen7;
BMH.screen7=()=>'<section class="finish-return"><div><b>Thiết kế & hoàn thiện theo ngôi nhà của bạn</b><span>Đổi màu, so sánh ảnh nhà thô và tiếp tục chỉnh phương án.</span></div><button data-finish-open>Hoàn thiện từ ảnh nhà thô →</button></section>'+finishScreen7();BMH.SCREENS[5]=BMH.screen7;
document.addEventListener('click',e=>{
  const target=e.target.closest?.('[data-finish-mode],[data-finish-open],[data-finish-photo],[data-finish-remove],[data-finish-variant],[data-finish-analyze],[data-finish-generate],[data-finish-apply],[data-finish-accept],[data-finish-service],[data-finish-cancel]');if(!target)return;
  const s=BMH.finishState(),rt=BMH.finishRuntime,d=target.dataset;
  if(d.finishMode||'finishOpen'in d){BMH.finishInvalidate();BMH.state.ui.homeMode=d.finishMode||'finish';BMH.navigateTo(1);return;}
  if(d.finishPhoto){BMH.finishInvalidate();s.activePhotoId=d.finishPhoto;BMH.save();BMH.render({preserveScroll:true});return;}
  if(d.finishRemove){BMH.finishRemovePhoto(d.finishRemove);return;}
  if(d.finishVariant){BMH.finishInvalidate();s.selected[s.activePhotoId]=d.finishVariant;BMH.save();BMH.render({preserveScroll:true});return;}
  if('finishAnalyze'in d)return void BMH.finishAnalyze();
  if('finishGenerate'in d)return void BMH.finishGenerate();
  if('finishApply'in d)return void BMH.finishApply();
  if('finishAccept'in d)return void BMH.finishAccept();
  if('finishService'in d){if(BMH.finishSatisfied())BMH.navigateTo(BMH.workflowRoutes?.handover||10);return;}
  if('finishCancel'in d){BMH.finishCancel();rt.notice='Đã dừng. Ảnh và phương án đã có vẫn được giữ.';BMH.render({preserveScroll:true});}
});
document.addEventListener('change',e=>{
  const t=e.target,s=BMH.finishState(),photo=BMH.finishPhoto(),rt=BMH.finishRuntime;
  if(t.matches?.('[data-finish-upload]')){const files=[...t.files];t.value='';BMH.finishAddPhotos(files);return;}
  if(t.matches?.('[data-finish-geometry]')){s.geometryKey=t.checked?BMH.finishGeometryKey():'';s.satisfaction={};BMH.save();BMH.render({preserveScroll:true});return;}
  if(t.dataset.finishColor){const v=BMH.finishVariant();if(!v||!/^#[0-9a-f]{6}$/i.test(t.value))return;BMH.finishInvalidate();v.palette[t.dataset.finishColor]={name:'Màu bạn chọn',hex:t.value};BMH.save();BMH.render({preserveScroll:true});return;}
  if(t.dataset.finishPref){BMH.finishInvalidate();s.preferences[t.dataset.finishPref]=t.value.slice(0,1000);BMH.save();BMH.render({preserveScroll:true});return;}
  if(t.matches?.('[data-finish-target],[data-finish-room]')&&photo){BMH.finishInvalidate();if(t.hasAttribute('data-finish-target')){photo.target=t.value;photo.roomId='';}else photo.roomId=t.value;s.geometryKey='';BMH.save();BMH.render({preserveScroll:true});}
});
document.addEventListener('input',e=>{if(!e.target.matches?.('[data-finish-compare]'))return;const n=Number(e.target.value);BMH.finishRuntime.compare=n;const host=BMH.$('.finish-comparison');host?.style.setProperty('--split',n+'%');const before=host?.querySelector('.finish-before');if(before)before.style.clipPath='inset(0 '+(100-n)+'% 0 0)';});
queueMicrotask(()=>BMH.render({preserveScroll:true}));
