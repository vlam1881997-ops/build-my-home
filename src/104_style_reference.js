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
  const tx=db.transaction('images',mode),request=work(tx.objectStore('images'));
  request.onsuccess=()=>resolve(request.result||null);
  request.onerror=()=>reject(Error('Không đọc hoặc lưu được ảnh tham khảo.'));
  tx.onabort=()=>reject(Error('Không lưu được ảnh tham khảo.'));
 }));
 B.styleReferenceStore={get:id=>transaction('readonly',store=>store.get(id)),put:(id,data)=>transaction('readwrite',store=>store.put(data,id))};
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
   try{const data=await B.styleReferenceStore.get(row.id);if(B.state.project!==project||!rows.includes(row))return;
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
 const screen=B.screen7;
 B.screen7=()=>{
  const t=document.createElement('template');t.innerHTML=screen();
  const prompt=t.content.querySelector('.model-render-prompt');if(!prompt)return t.innerHTML;
  const images=(B.state.project.sourceRefs||[]).filter(x=>x.kind==='image'),selected=B.state.project.styleReferenceId,source=B.cinematicStyleReference();
  const box=document.createElement('div');box.className='model-style-reference';
  if(images.length){
   box.innerHTML='<label>Ảnh phong cách khách chọn <select data-style-reference><option value="">Chỉ dùng phong cách bằng chữ</option>'+images.map(x=>'<option value="'+B.esc(x.id)+'" '+(x.id===selected?'selected':'')+'>'+B.esc(x.name)+'</option>').join('')+'</select></label>'+(source?'<img src="'+source.image+'" alt="Ảnh phong cách của khách">':'')+'<small>'+(selected&&!source?'Ảnh này chưa có trên thiết bị. Tải lại ở tab Ý tưởng trước khi tạo phối cảnh.':'Ảnh này định hướng phong cách; mô hình 3D và bản vẽ giữ kích thước.')+'</small>';
  }else box.innerHTML='<small>Muốn bám sát mẫu nhà của bạn? Thêm ảnh ở tab Ý tưởng trước khi tạo phối cảnh.</small>';
  prompt.append(box);return t.innerHTML;
 };B.SCREENS[5]=B.screen7;
 document.addEventListener('change',e=>{if(!e.target.matches?.('[data-style-reference]'))return;B.rememberFinishCamera?.();B.state.project.styleReferenceId=e.target.value;B.save();B.render({preserveScroll:true});});
})();
