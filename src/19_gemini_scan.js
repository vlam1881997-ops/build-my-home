/* V5.0.2 · Gemini AI-Native Visual Scan
 * Direct resumable media upload to Gemini Files API through a server-created upload session.
 * The API key remains server-side; only the temporary upload URL is sent to the browser.
 */
BMH.scan={busy:false,stage:'',progress:0,error:'',fileName:'',mimeType:'',result:null,model:'',intent:'reference'};

BMH.geminiConfigured=()=>!!BMH.runtime?.config?.geminiConfigured;
BMH.scanState=()=>BMH.state.project.aiScan||(BMH.state.project.aiScan={sourceName:'',mimeType:'',scannedAt:'',model:'',provider:'',intent:'reference',appliedAt:'',result:{}});
BMH.scanExisting=()=>{const a=BMH.scanState();return BMH.scan.result&&Object.keys(BMH.scan.result).length?BMH.scan.result:a.result&&Object.keys(a.result).length?a.result:null;};
BMH.scanSetStage=(stage,progress)=>{BMH.scan.stage=stage;BMH.scan.progress=progress;BMH.render({preserveScroll:true});};
BMH.scanFetchJson=async(url,opts={})=>{const r=await fetch(url,opts);let data={};try{data=await r.json();}catch(_){}if(!r.ok)throw new Error(data?.error||`HTTP ${r.status}`);return data;};
BMH.geminiFileState=file=>String(file?.state?.name||file?.state||'ACTIVE').toUpperCase();

BMH.geminiUploadFile=async file=>{
  const start=await BMH.scanFetchJson('/api/gemini-upload-start',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:file.name,mime_type:file.type,size:file.size})});
  BMH.scanSetStage('Đang tải media trực tiếp lên Gemini…',28);
  const up=await fetch(start.uploadUrl,{method:'POST',headers:{'X-Goog-Upload-Offset':'0','X-Goog-Upload-Command':'upload, finalize'},body:file});
  let info={};try{info=await up.json();}catch(_){}
  if(!up.ok)throw new Error(info?.error?.message||`Gemini upload HTTP ${up.status}`);
  let gfile=info.file||info;if(!gfile?.name)throw new Error('Gemini không trả về thông tin tệp đã tải.');
  let state=BMH.geminiFileState(gfile),tries=0;
  while(state==='PROCESSING'&&tries<45){
    BMH.scanSetStage(`Gemini đang đọc ${file.type.startsWith('video/')?'video + lời nói':'tệp'}…`,Math.min(68,35+tries));
    await new Promise(r=>setTimeout(r,2000));
    const st=await BMH.scanFetchJson('/api/gemini-file-status',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:gfile.name})});
    gfile=st.file||gfile;state=BMH.geminiFileState(gfile);tries++;
  }
  if(state==='FAILED')throw new Error('Gemini không xử lý được tệp này. Hãy thử MP4/JPG/PDF khác.');
  if(state==='PROCESSING')throw new Error('Video vẫn đang xử lý quá lâu. Hãy thử lại sau hoặc giảm dung lượng video.');
  return gfile;
};

BMH.geminiScanFile=async(file,intent=BMH.scan.intent||'reference')=>{
  if(!file)return;
  if(!BMH.geminiConfigured()){BMH.scan.error='Chưa có GEMINI_API_KEY. Hãy điền key ở .env.local/Vercel Environment Variables.';BMH.render({preserveScroll:true});return;}
  const ok=/^(image\/|video\/|application\/pdf$)/i.test(file.type||'');if(!ok){BMH.toast('Chỉ hỗ trợ ảnh, video và PDF.');return;}
  const maxBytes=file.type==='application/pdf'?50*1024*1024:250*1024*1024;if(file.size>maxBytes){BMH.toast(file.type==='application/pdf'?'PDF vượt 50MB. Hãy giảm dung lượng trước khi quét.':'Tệp vượt 250MB. Hãy nén video trước khi quét.');return;}
  BMH.scan.busy=true;BMH.scan.error='';BMH.scan.fileName=file.name;BMH.scan.mimeType=file.type;BMH.scan.intent=intent;BMH.scanSetStage('Đang tạo phiên quét bảo mật…',8);
  try{
    const gfile=await BMH.geminiUploadFile(file);BMH.scanSetStage('AI đang bóc tách phong cách, quy mô và bằng chứng…',76);
    const data=await BMH.scanFetchJson('/api/gemini-scan',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({file_uri:gfile.uri,file_name:gfile.name,mime_type:gfile.mimeType||file.type,intent,project:BMH.aiContext?BMH.aiContext():BMH.state.project})});
    BMH.scan.result=data.result||{};BMH.scan.model=data.model||'';BMH.scanSetStage('Đã phân tích xong.',100);
    const a=BMH.scanState();Object.assign(a,{sourceName:file.name,mimeType:file.type,scannedAt:new Date().toISOString(),model:data.model||'',provider:'Gemini',intent,appliedAt:'',result:structuredClone(data.result||{})});
    BMH.state.project.source='scan';BMH.save();BMH.toast('Gemini đã quét xong. Hãy kiểm tra mức tin cậy rồi áp dụng dữ liệu phù hợp.');
  }catch(err){BMH.scan.error=err.message||String(err);BMH.scan.stage='Quét chưa hoàn tất';BMH.scan.progress=0;}
  finally{BMH.scan.busy=false;BMH.render({preserveScroll:true});}
};

BMH.applyGeminiScan=()=>{
  const r=BMH.scanExisting();if(!r)return;const b=r.building||{},safe=r.safe_auto_apply||{},p=BMH.state.project,changed=[];
  if(b.style&&String(b.style).length>1){p.style=String(b.style).slice(0,80);changed.push('phong cách');}
  const floors=Math.round(Number(b.estimated_floors)||0);if(safe.floors&&floors>=1&&floors<=5){p.site.floors=floors;changed.push('số tầng');}
  const width=Number(b.estimated_width_m)||0,depth=Number(b.estimated_depth_m)||0;
  if(safe.width&&width>=2.5&&width<=30){p.site.width=Math.round(width*10)/10;changed.push('ngang đất');}
  if(safe.depth&&depth>=5&&depth<=60){p.site.depth=Math.round(depth*10)/10;changed.push('chiều sâu');}
  const finish=String(b.finish_level||'').toLowerCase();if(/cao|premium|luxury/.test(finish))p.materials.tier='premium';else if(/cơ bản|tiết kiệm|economy/.test(finish))p.materials.tier='economy';
  const loc=String(r.location_hint||'');for(const province of Object.keys(BMH.REGIONS||{})){if(loc.toLowerCase().includes(province.toLowerCase())){p.site.province=province;const reg=BMH.REGIONS[province],pt=BMH.regionPoint(province,reg.defaultDistrict);Object.assign(p.site,{district:pt.district,lat:pt.lat,lng:pt.lng,geoSource:'Gemini scan · cần xác nhận'});changed.push('vị trí');break;}}
  BMH.scanState().appliedAt=new Date().toISOString();BMH.state.project.source='scan';
  if(typeof BMH.generatePlanVariants==='function'){
    try{const defs=[['A','climate','Ưu tiên khí hậu'],['B','balanced','Cân bằng'],['C','budget','Gọn chi phí']],variants=[];for(const [code,strategy,label] of defs){const plan=BMH.generateAutoPlanSnapshot(strategy);if(plan)variants.push({id:`variant-${code}`,code,strategy,label,metrics:BMH.planMetrics(plan),plan});}BMH.state.project.planVariants=variants;}catch(_){}
  }
  BMH.normalizeState();BMH.save();BMH.toast(`Đã dùng AI Scan làm phương án sơ bộ${changed.length?`: ${changed.join(', ')}`:''}. Hãy xác nhận kích thước trước khi dùng cho hồ sơ.`);BMH.render({preserveScroll:true});
};

BMH.clearGeminiScan=()=>{const a=BMH.scanState();Object.assign(a,{sourceName:'',mimeType:'',scannedAt:'',model:'',provider:'',intent:'reference',appliedAt:'',result:{}});Object.assign(BMH.scan,{result:null,model:'',error:'',stage:'',progress:0,fileName:'',mimeType:''});BMH.save();BMH.render({preserveScroll:true});};

BMH.scanResultHtml=()=>{
  const r=BMH.scanExisting();if(!r)return'';const b=r.building||{},facts=(r.spoken_facts||[]).slice(0,5),ev=(r.evidence||[]).slice(0,6),ass=(r.assumptions||[]).slice(0,4),a=BMH.scanState(),engine=BMH.estimate?.();
  const scale=b.estimated_width_m>0&&b.estimated_depth_m>0?`${BMH.num(b.estimated_width_m,1)} × ${BMH.num(b.estimated_depth_m,1)}m`:b.estimated_floor_area_m2>0?`~${BMH.num(b.estimated_floor_area_m2,0)}m²/sàn`:'Chưa đủ tỷ lệ';
  return `<section class="scan-result card"><div class="scan-result-top"><div><span class="eyebrow">AI VISUAL SCAN</span><h2>${BMH.esc(r.headline||'Đã hiểu media tham khảo')}</h2><p>${BMH.esc(r.summary||'')}</p></div><div class="scan-confidence"><b>${BMH.clamp(Number(r.confidence)||0,0,100)}%</b><span>độ tin cậy tổng</span></div></div><div class="scan-kpis"><article><small>Quy mô phát hiện</small><b>${BMH.esc(scale)}</b><span>${Number(b.estimated_floors)||'—'} tầng · ${BMH.esc(b.building_type||'chưa rõ')}</span></article><article><small>Phong cách</small><b>${BMH.esc(b.style||'Chưa xác định')}</b><span>${BMH.esc(b.finish_level||'')}</span></article><article><small>Vật liệu mặt tiền</small><b>${(r.facade_materials||[]).length}</b><span>${BMH.esc((r.facade_materials||[]).slice(0,3).join(' · ')||'Chưa đủ bằng chứng')}</span></article><article><small>Dự toán hiện tại</small><b>${engine?BMH.money(engine.total):'—'}</b><span>Chỉ cập nhật sau khi áp dụng dữ liệu scan</span></article></div>${facts.length?`<div class="scan-evidence"><h3>🎙 Dữ kiện nghe trực tiếp trong media</h3>${facts.map(f=>`<div><b>${BMH.esc(f.label)}</b><span>${BMH.esc(f.value)} ${BMH.esc(f.unit||'')}</span><em>${BMH.esc(f.timestamp||'')} · ${f.confidence}%</em></div>`).join('')}</div>`:''}<details class="scan-details"><summary>Xem bằng chứng & giả định</summary><div class="scan-detail-grid"><div><h4>Bằng chứng</h4>${ev.map(x=>`<p><b>${BMH.esc(x.where||'Media')}</b> · ${BMH.esc(x.detail)} <small>${x.source} · ${x.confidence}%</small></p>`).join('')||'<p>Chưa có bằng chứng chi tiết.</p>'}</div><div><h4>AI đang giả định</h4>${ass.map(x=>`<p>• ${BMH.esc(x)}</p>`).join('')||'<p>Không có giả định đáng kể.</p>'}</div></div></details><div class="scan-actions"><button class="clay" data-scan-apply>✓ Dùng làm phương án sơ bộ</button><button class="secondary" data-scan-new>Quét tệp khác</button><button class="ghost" data-scan-clear>Xóa kết quả</button><small>Kích thước, móng và kết cấu quan trọng vẫn phải xác minh trước khi dùng cho thi công.</small></div></section>`;
};

BMH.scanDropHtml=()=>{
  const c=BMH.runtime?.config,ready=!!c?.geminiConfigured,existing=BMH.scanExisting();
  return `<section class="native-scan-shell consumer-scan">
    <div class="scan-visual"><img src="assets/rooms/facade-render.jpg" alt="Không gian nhà tham khảo"><div class="scan-visual-shade"></div><div class="scan-visual-copy"><span>AI HOME VISION</span><h2>Cho AI xem điều bạn đang hình dung.</h2><p>Video ngoài đời, ảnh nhà mẫu, bản vẽ tay hay PDF đều có thể trở thành điểm bắt đầu.</p><div><i>Video</i><i>Ảnh</i><i>Bản phác</i><i>PDF</i></div></div>${BMH.scan.busy?`<div class="scan-live-progress"><b>${BMH.esc(BMH.scan.stage)}</b><span>${BMH.scan.progress}%</span><i><u style="width:${BMH.scan.progress}%"></u></i></div>`:''}</div>
    <div class="native-scan-copy"><div class="scan-kicker"><span>✦ PHÂN TÍCH BẰNG AI</span><em class="${ready?'ok':'warn'}">${ready?'Sẵn sàng':'Chưa kết nối'}</em></div><h1>Thấy kết quả trước.<br><em>Chỉnh chi tiết sau.</em></h1><p>AI nhận diện quy mô, phong cách, vật liệu và những dữ kiện nghe thấy trong video. Bạn chỉ cần xác nhận các thông tin quan trọng trước khi hệ thống đưa chúng vào thiết kế.</p><div class="scan-intent"><button class="${BMH.scan.intent==='reference'?'active':''}" data-scan-intent="reference">Tôi thích căn nhà này</button><button class="${BMH.scan.intent==='my_home'?'active':''}" data-scan-intent="my_home">Đây là nhà / đất của tôi</button></div><button class="scan-dropzone ${BMH.scan.busy?'busy':''}" data-scan-upload ${ready?'':'disabled'}><i>${BMH.scan.busy?'◌':'+'}</i><b>${BMH.scan.busy?'AI đang quan sát…':'Thả tệp vào đây hoặc chọn từ máy'}</b><span>${BMH.scan.busy?BMH.esc(BMH.scan.stage):'Video · ảnh · PDF'}</span></button><div class="scan-privacy"><i>✓</i><span>AI chỉ đưa ra dữ liệu sơ bộ. Kích thước và kết cấu quan trọng luôn yêu cầu xác nhận.</span></div>${!ready&&BMH.DEV?`<div class="scan-setup"><b>Chế độ phát triển:</b><span>Điền GEMINI_API_KEY trong <code>.env.local</code> rồi khởi động lại server.</span></div>`:''}${BMH.scan.error?`<div class="ai-error">${BMH.esc(BMH.scan.error)}</div>`:''}</div>
  </section>${existing?BMH.scanResultHtml():''}`;
};

document.addEventListener('click',e=>{
  const intent=e.target.closest?.('[data-scan-intent]');if(intent){BMH.scan.intent=intent.dataset.scanIntent==='my_home'?'my_home':'reference';BMH.render({preserveScroll:true});return;}
  if(e.target.closest?.('[data-scan-upload]')||e.target.closest?.('[data-scan-new]')){if(!BMH.scan.busy)BMH.$('#uploadScan')?.click();return;}
  if(e.target.closest?.('[data-scan-apply]')){BMH.applyGeminiScan();return;}
  if(e.target.closest?.('[data-scan-clear]')){BMH.clearGeminiScan();return;}
});

document.addEventListener('change',e=>{const t=e.target;if(t?.id==='uploadScan'&&t.files?.[0]){const f=t.files[0];t.value='';BMH.geminiScanFile(f,BMH.scan.intent);}});

document.addEventListener('dragover',e=>{const z=e.target.closest?.('[data-scan-upload]');if(z){e.preventDefault();z.classList.add('dragging');}});
document.addEventListener('dragleave',e=>{const z=e.target.closest?.('[data-scan-upload]');if(z)z.classList.remove('dragging');});
document.addEventListener('drop',e=>{const z=e.target.closest?.('[data-scan-upload]');if(z){e.preventDefault();z.classList.remove('dragging');const f=e.dataTransfer?.files?.[0];if(f&&!BMH.scan.busy)BMH.geminiScanFile(f,BMH.scan.intent);}});
