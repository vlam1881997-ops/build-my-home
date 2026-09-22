'use strict';
(()=>{
  const doc=typeof document!=='undefined'?document:null;
  if(!doc)return;
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent||'') || (navigator.platform==='MacIntel' && navigator.maxTouchPoints>1);
  const isMobile=/Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent||'') || Math.min(globalThis.screen?.width||9999,globalThis.screen?.height||9999)<900;
  const inApp=/FBAN|FBAV|Instagram|Zalo|Line\//i.test(navigator.userAgent||'');
  const savedAtKey='bmh-v13-saved-at';
  let inputTimer=0,force3d=false;

  function updateSavedLabel(prefix='Đã lưu'){
    const node=doc.querySelector('.saved');
    if(!node)return;
    let label=prefix;
    try{const raw=localStorage.getItem(savedAtKey);if(raw){const d=new Date(Number(raw));label=`${prefix} ${d.toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'})}`;}}catch{}
    node.textContent=label;
  }

  const baseSave=save;
  save=function(){
    const ok=baseSave();
    if(ok){try{localStorage.setItem(savedAtKey,String(Date.now()));}catch{} updateSavedLabel();}
    return ok;
  };

  function valueFromInput(t){
    if(t.type==='checkbox')return t.checked;
    if(t.type==='number'||t.type==='range')return Number(t.value);
    return t.value;
  }
  function validNativeNumber(t,v){
    if(typeof v!=='number')return true;
    if(!Number.isFinite(v))return false;
    if(t.min!==''&&v<Number(t.min))return false;
    if(t.max!==''&&v>Number(t.max))return false;
    return true;
  }
  function persistActiveInput(t){
    if(!t?.dataset?.key)return;
    const key=t.dataset.key,value=valueFromInput(t);
    if(!validNativeNumber(t,value))return;
    const before=structuredClone(state);
    try{
      state[key]=value;
      if(['width','depth','floors'].includes(key))clampRooms();
      if(globalThis.BMHCore)Core.buildSnapshot(state);
      save();
    }catch{
      state=before;
    }
  }
  doc.addEventListener('input',e=>{
    const t=e.target;
    if(!t?.dataset?.key)return;
    clearTimeout(inputTimer);
    inputTimer=setTimeout(()=>persistActiveInput(t),500);
  },{passive:true});
  doc.addEventListener('change',e=>{if(e.target?.dataset?.key){clearTimeout(inputTimer);setTimeout(()=>save(),0);}},true);
  const flush=()=>{clearTimeout(inputTimer);persistActiveInput(doc.activeElement);save();};
  addEventListener('pagehide',flush);
  addEventListener('beforeunload',flush);
  doc.addEventListener('visibilitychange',()=>{if(doc.visibilityState==='hidden')flush();});

  function processCameraFile(file){
    if(!file)return;
    if(file.size>20*1024*1024||!String(file.type).startsWith('image/')){toast('Ảnh chụp tối đa 20 MB.');return;}
    if(uploadURL)URL.revokeObjectURL(uploadURL);
    uploadURL=URL.createObjectURL(file);uploadType=file.type||'image/jpeg';uploadName=file.name||`anh-chup-${Date.now()}.jpg`;
    go(4);toast('Đã nhận ảnh từ camera.');
  }
  const camera=doc.querySelector('#cameraUpload');
  camera?.addEventListener('change',e=>{const f=e.target.files?.[0];processCameraFile(f);e.target.value='';});

  const priorEditor=editor;
  editor=function(c){return priorEditor(c)+`<section class="card mobile-upload-card"><div class="row between mobile-stack"><div><h3>Ảnh / bản vẽ trên điện thoại</h3><p class="hint">Chọn ảnh/PDF từ thư viện hoặc chụp ảnh trực tiếp bằng camera sau.</p></div><div class="row mobile-actions"><button class="small" data-action="uploadLibrary">${icon('upload')}Chọn ảnh / PDF</button><button class="small" data-action="uploadCamera">${icon('image')}Chụp ảnh</button></div></div>${isIOS?'<p class="hint">iPhone/iPad: nếu trình duyệt trong Facebook/Zalo hạn chế camera, hãy mở trang bằng Safari.</p>':''}</section>`;};

  function xmlEsc(v){return String(v??'').replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]));}
  function excelXml(s){
    const rows=[['Snapshot',s.id],['Trạng thái',s.status],[],['Hạng mục','Khối lượng','Đơn vị','Đơn giá','Thuế','Thành tiền','Nguồn','Ngày','Vùng'],...s.quote.items.map(i=>[i.description,i.quantityWithWaste,i.unit,i.unitPrice,i.taxRate,i.total,i.priceSource,i.priceDate,i.region]),['Dự phòng','','','','',s.quote.constructionContingency],['Tổng','','','','',s.quote.total]];
    const cells=rows.map(r=>`<Row>${r.map(v=>`<Cell><Data ss:Type="${typeof v==='number'?'Number':'String'}">${xmlEsc(v)}</Data></Cell>`).join('')}</Row>`).join('');
    return `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Du toan"><Table>${cells}</Table></Worksheet></Workbook>`;
  }

  const baseDownload=download;
  download=async function(name,text,type='text/plain'){
    const blob=text instanceof Blob?text:new Blob([text],{type});
    const canShareFile=isIOS&&typeof File!=='undefined'&&navigator.share&&navigator.canShare&&/\.(csv|xls|xlsx|zip)$/i.test(name);
    if(canShareFile){
      try{
        const file=new File([blob],name,{type:blob.type||type});
        if(navigator.canShare({files:[file]})){await navigator.share({files:[file],title:'Build My Home'});return;}
      }catch(err){if(err?.name==='AbortError')return;}
    }
    try{
      const url=URL.createObjectURL(blob),a=doc.createElement('a');
      a.href=url;a.download=name;a.rel='noopener';a.style.display='none';doc.body.appendChild(a);a.click();
      setTimeout(()=>{a.remove();URL.revokeObjectURL(url);},5000);
    }catch{baseDownload(name,text,type);}
  };

  const oldStep8=screens[7];
  screens[7]=c=>oldStep8(c)+`<section class="card mobile-export-card"><h2>Tải hồ sơ trên điện thoại</h2><div class="row mobile-actions"><button data-action="print">${icon('file')}Xem / lưu PDF</button><button data-resilience="excel">${icon('download')}Tải Excel</button></div><p class="hint">iPhone/iPad: với PDF, chọn Chia sẻ → Lưu vào Tệp trong màn hình in. Tệp Excel sẽ mở bảng chia sẻ khi Safari hỗ trợ.</p></section>`;
  const oldStep10=screens[9];
  screens[9]=c=>oldStep10(c)+`<section class="card mobile-export-card"><h2>Xuất nhanh cho điện thoại</h2><div class="row mobile-actions"><button data-action="print">${icon('file')}PDF</button><button data-resilience="excel">${icon('chart')}Excel</button></div><p class="hint">Không mở popup tự động. Mọi tệp chỉ được tạo sau thao tác bấm của người dùng.</p></section>`;

  function hasWebGL(){
    try{const c=doc.createElement('canvas');return !!(c.getContext('webgl2',{failIfMajorPerformanceCaveat:true})||c.getContext('webgl',{failIfMajorPerformanceCaveat:true}));}catch{return false;}
  }
  function lowPower(){
    if(!isMobile)return false;
    const memory=Number(navigator.deviceMemory||0),cores=Number(navigator.hardwareConcurrency||0);
    return (memory>0&&memory<=4)||(cores>0&&cores<=4)||globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  }
  function fallbackScene(canvas,reason){
    if(!canvas||canvas.dataset.fallback==='1')return;
    canvas.dataset.fallback='1';canvas.style.display='none';
    const box=doc.createElement('div');box.className='scene-fallback';box.innerHTML=`<img src="assets/house.jpg" alt="Phối cảnh tĩnh dự phòng"><div class="scene-fallback-copy"><b>Đang dùng chế độ nhẹ</b><span>${xmlEsc(reason)}</span><button class="small" data-resilience="try3d">Vẫn thử mô hình 3D</button></div>`;
    canvas.insertAdjacentElement('afterend',box);
  }
  const originalMount=globalThis.BMHScene?.mount;
  if(originalMount){
    globalThis.BMHScene.mount=function(canvas,s,select){
      if(!canvas)return;
      const noWebGL=!hasWebGL();
      if(!force3d&&(noWebGL||lowPower())){fallbackScene(canvas,noWebGL?'Thiết bị/trình duyệt không báo tăng tốc WebGL ổn định.':'Thiết bị di động cấu hình vừa; ưu tiên ảnh tĩnh để giảm nóng máy.');return;}
      const start=globalThis.performance?.now?.()??Date.now();
      try{
        originalMount(canvas,s,select);
        const elapsed=(globalThis.performance?.now?.()??Date.now())-start;
        if(!force3d&&elapsed>3000)fallbackScene(canvas,`Mô hình mất ${(elapsed/1000).toFixed(1)} giây để dựng, vượt ngưỡng 3 giây.`);
        else canvas.dataset.sceneReady='1';
      }catch(err){fallbackScene(canvas,'Không thể khởi tạo mô hình 3D trên thiết bị này.');}
    };
  }

  function enhanceTables(){
    doc.querySelectorAll('.tablewrap').forEach((box,i)=>{
      box.tabIndex=0;box.setAttribute('role','region');box.setAttribute('aria-label',box.getAttribute('aria-label')||`Bảng dữ liệu có thể vuốt ngang ${i+1}`);
      if(box.scrollWidth>box.clientWidth+4)box.classList.add('is-scrollable');
    });
  }
  function mobileHints(){
    if(!isMobile)return;
    doc.documentElement.classList.add('mobile-device');
    if(inApp)doc.documentElement.classList.add('in-app-browser');
  }

  const previousRender=render;
  render=function(){previousRender();enhanceTables();mobileHints();updateSavedLabel(localStorage.getItem('bmh-v12')?'Đã lưu':'Lưu trên thiết bị');};

  doc.addEventListener('click',e=>{
    const b=e.target.closest('[data-action],[data-resilience]');if(!b)return;
    if(b.dataset.action==='uploadCamera'){camera?.click();return;}
    if(b.dataset.action==='uploadLibrary'){doc.querySelector('#upload')?.click();return;}
    if(b.dataset.resilience==='excel'){
      const s=snapshot();download(`${s.id}-du-toan.xls`,excelXml(s),'application/vnd.ms-excel;charset=utf-8');return;
    }
    if(b.dataset.resilience==='try3d'){force3d=true;render();return;}
  },true);

  enhanceTables();mobileHints();updateSavedLabel(localStorage.getItem('bmh-v12')?'Đã khôi phục':'Lưu trên thiết bị');
})();
