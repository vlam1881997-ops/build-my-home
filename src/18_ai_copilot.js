/* V5.0.2 · Gemini-first AI Decision Engine
 * Gemini is primary. OpenAI is optional fallback. Server-side keys only.
 */
BMH.ai={open:false,loading:false,mode:'review',error:'',result:null,model:'',provider:'',notice:'',lastAction:'',prompt:'',imageName:'',inflight:null};

BMH.aiConfigured=()=>!!BMH.cloud?.config?.aiConfigured;
// A separate allowlist for web research. Never reuse aiContext or send free-form file text.
BMH.designResearchContext=()=>{
  const p=BMH.state.project,s=p.site||{},scan=p.aiScan?.result||{},a=scan.building||{},finish=p.homeFinish||{};
  const n=(v,max,integer=false)=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max&&(!integer||Number.isInteger(v))?v:null;
  const styleId=name=>(BMH.HOUSE_STYLES||[]).find(x=>x.name===name)?.id||null;
  const refs=Array.isArray(p.sourceRefs)?p.sourceRefs:[],shell=BMH.state.ui.homeMode==='finish';
  const rows=Array.isArray(p.designStudio?.program?.floors)?p.designStudio.program.floors:[];
  const target=n(p.finance?.targetBudget,1e12);
  const analysis=shell?Object.values(finish.analyses||{}).some(x=>x?.result):Object.keys(scan).length>0;
  return {
    houseType:shell?'shell':BMH.state.ui.homeMode==='design'?'new':'unconfirmed',styleId:styleId(p.style),
    site:{widthM:n(s.width,200),depthM:n(s.depth,500),floors:n(s.floors,20,true),dimensionsStatus:((p.designEvidence?.site||[]).some(e=>e.kind==='dimensions'&&e.verifiedState!=='stale')||s.lotSource==='survey-local'&&BMH.parcelBoundaryReview?.().valid)?'customer_confirmed':shell&&BMH.state.ui.onboardingComplete!==false&&finish.geometryKey&&finish.geometryKey===BMH.finishGeometryKey?.()?'customer_confirmed':'unconfirmed'},
    budget:{targetMinVnd:target>0?target:null,targetMaxVnd:target>0?target:null,status:target>0?'customer_target':'unconfirmed'},
    floorProgram:rows.slice(0,20).map((f,i)=>({floor:i,bedrooms:n(f?.bedrooms,20,true),bathrooms:n(f?.bathrooms,20,true),living:f?.living===true,kitchen:f?.kitchen===true,office:f?.office===true,garage:f?.garage===true,worship:['none','room','living'].includes(f?.worship)?f.worship:'unconfirmed',extraRooms:(Array.isArray(f?.extraRooms)?f.extraRooms:[]).slice(0,20).map(q=>({type:['laundry','storage','office','gym','hobby','custom'].includes(q?.type)?q.type:'custom',count:n(q?.count,20,true),minAreaM2:n(q?.minArea,200)}))})),
    references:{imageCount:Math.min(6,refs.filter(x=>x.kind==='image').length+(shell?(finish.photos||[]).length:0)),videoCount:Math.min(6,refs.filter(x=>x.kind==='video').length),pdfCount:Math.min(6,refs.filter(x=>x.kind==='pdf').length),analysis:{available:analysis,status:'unconfirmed',styleId:styleId(a.style),estimatedFloors:n(a.estimated_floors,20,true)}}
  };
};
BMH.designResearchProfileKey=()=>{
  const p=BMH.state.project;
  // Local-only identities invalidate a response after an upload/project changes; never sent to Search.
  return JSON.stringify({context:BMH.designResearchContext(),refs:(p.sourceRefs||[]).map(x=>[x.id,x.name,x.status]),scanAt:p.aiScan?.scannedAt,photos:(p.homeFinish?.photos||[]).map(x=>x.id),finishGeometry:p.homeFinish?.geometryKey});
};
BMH.designResearchCall=async(context=BMH.designResearchContext())=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
    const r=await (BMH.aiFetch||fetch)('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,body:JSON.stringify({action:'design-research',researchContext:context})});
    let data={};try{data=await r.json();}catch{}
    if(!r.ok||!data.ok)throw new Error('Chưa nghiên cứu được mẫu. Thư viện BMH vẫn chọn được.');
    return data.result;
  }catch(err){throw new Error(err?.name==='AbortError'?'Nghiên cứu quá thời gian chờ. Thư viện BMH vẫn chọn được.':'Mạng hoặc Search chưa sẵn sàng. Thư viện BMH vẫn chọn được.');}
  finally{clearTimeout(timer);}
};
BMH.aiContext=({lightweight=false}={})=>{
  const p=BMH.state.project,safe=(label,fn,fallback={})=>{try{return fn()||fallback;}catch(err){console.warn('[BMH aiContext] '+label+' unavailable',err);return fallback;}};
  const e=safe('estimate',()=>BMH.estimate(),{}),needs=safe('householdNeeds',()=>BMH.householdNeeds?.(),{});
  const review=lightweight?{}:safe('designReview',()=>BMH.designReview(),{}),perf=lightweight?{}:safe('performance',()=>BMH.performancePlan?.(),{});
  const computed={
    estimate:{area:e.area,areaSource:e.areaSource,total:e.total,budget:e.budget,gap:e.gap,shell:e.shell,finish:e.finish,transport:e.transport,climatePrep:e.climatePrep,performanceUpgrade:e.performanceUpgrade,contingency:e.contingency},
    householdNeeds:needs
  };
  if(!lightweight){
    computed.designReview={overall:review.overall,budget:review.budget,function:review.function,climate:review.climate,daylight:review.daylight,ventilation:review.ventilation,circulation:review.circulation,siteFit:review.siteFit,durability:review.durability};
    computed.performance={energyScore:perf.energyScore,comfortScore:perf.comfortScore,waterScore:perf.waterScore,annualSavings:perf.annualSavings,payback:perf.payback,gridDemand:perf.gridDemand};
  }
  return {name:p.name,style:p.style,site:p.site,siteIntelligence:p.siteIntelligence,finance:p.finance,household:p.household,plan:p.plan,materials:p.materials,performance:p.performance,computed};
};

BMH.aiCall=async(action,prompt='',extra={})=>{
  if(!BMH.aiConfigured())throw new Error('AI chưa được cấu hình trên server.');
  const stamp=String(BMH.state?.meta?.savedAt||''),key=action+'|'+String(prompt||'').trim()+'|'+stamp;
  if(BMH.ai.inflight?.key===key)return BMH.ai.inflight.promise;
  const promise=(async()=>{
    const r=await (BMH.aiFetch||fetch)('/api/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,prompt,project:BMH.aiContext({lightweight:action==='brief'}),...extra})});
    let data={};try{data=await r.json();}catch(_){}
    if(!r.ok){
      const message=data?.error||(r.status===429?'AI đang chạm hạn mức. Đợi một lúc trước khi thử lại.':`AI HTTP ${r.status}`);
      const err=new Error(message);err.status=r.status;err.details=data?.details;throw err;
    }
    return data;
  })();
  BMH.ai.inflight={key,promise};
  try{return await promise;}finally{if(BMH.ai.inflight?.promise===promise)BMH.ai.inflight=null;}
};

BMH.aiSeverityLabel=s=>s==='high'?'Cần xử lý':s==='medium'?'Nên tối ưu':'Gợi ý';

BMH.aiPresetPrompt=mode=>({review:'Đánh giá mặt bằng hiện tại. Ưu tiên công năng, người già/trẻ em, ánh sáng, thông gió, giao thông, an toàn và những việc đáng sửa trước khi chốt với KTS.',cost:'Tìm các cơ hội tiết kiệm chi phí có cơ sở nhưng không làm giảm an toàn, chống thấm, tiện nghi thiết yếu hay độ bền. Xếp ưu tiên theo số tiền có thể tiết kiệm và mức ảnh hưởng.',whatif:'Nếu tôi thay đổi một điều trong dự án, hãy so sánh tác động lên chi phí, công năng, tiện nghi và rủi ro. Hãy hỏi lại nếu thiếu giả định quan trọng.'})[mode]||'';
BMH.aiInlineCTA=(mode,title,desc)=>`<section class="ai-inline-cta ai-${mode}"><div><span>✦ AI DECISION ENGINE</span><b>${BMH.esc(title)}</b><small>${BMH.esc(desc)}</small></div><button class="clay" data-ai-direct="${mode}">${BMH.aiConfigured()?'Mở AI phân tích':'Bật AI'} →</button></section>`;
BMH.aiMoney=n=>Number(n)>0?BMH.money(n):'—';
BMH.aiResultHtml=result=>{
  if(!result)return '<div class="ai-empty"><i>✦</i><b>AI Decision Engine đang chờ dự án của bạn</b><span>Hãy yêu cầu đánh giá, tối ưu chi phí hoặc thử một kịch bản “nếu như”.</span></div>';
  const recs=(result.recommendations||[]).map((x,i)=>`<article class="ai-rec"><div><i>${i+1}</i><span><b>${BMH.esc(x.title)}</b><small>${BMH.esc(x.detail)}</small></span></div><div class="ai-rec-meta"><em>${x.estimated_saving_vnd>0?`Tiết kiệm ~${BMH.money(x.estimated_saving_vnd)}`:BMH.esc(x.benefit||'')}</em><button data-ai-goto="${x.step}">Bước ${x.step} →</button></div></article>`).join('');
  const findings=(result.findings||[]).map(x=>`<article class="ai-finding ${BMH.esc(x.severity)}"><span>${BMH.aiSeverityLabel(x.severity)}</span><b>${BMH.esc(x.title)}</b><p>${BMH.esc(x.detail)}</p></article>`).join('');
  const qs=(result.questions||[]).map(q=>`<button class="ai-question" data-ai-question="${BMH.esc(q)}">${BMH.esc(q)}</button>`).join('');
  return `<div class="ai-result-head"><div><span>AI ANALYSIS</span><h3>${BMH.esc(result.headline||'Phân tích dự án')}</h3></div><strong>${BMH.clamp(Number(result.confidence)||0,0,100)}%</strong></div><p class="ai-summary">${BMH.esc(result.summary||'')}</p><div class="ai-kpis"><span><small>Chi phí hiện tại</small><b>${BMH.money(result.metrics?.current_cost_vnd||BMH.estimate().total)}</b></span><span><small>Cơ hội tiết kiệm</small><b>${BMH.aiMoney(result.metrics?.target_saving_vnd)}</b></span><span><small>Rủi ro tiện nghi</small><b>${BMH.esc(result.metrics?.comfort_risk||'—')}</b></span></div>${findings?`<div class="ai-section"><h4>Điểm AI phát hiện</h4>${findings}</div>`:''}${recs?`<div class="ai-section"><h4>Đề xuất hành động</h4>${recs}</div>`:''}${result.metrics?.safety_note?`<div class="ai-safety"><b>🛡 An toàn trước tiết kiệm</b><span>${BMH.esc(result.metrics.safety_note)}</span></div>`:''}${qs?`<div class="ai-followups"><b>Hỏi tiếp</b>${qs}</div>`:''}`;
};

BMH.aiDock=()=>{
  const c=BMH.cloud?.config,status=!c?'checking':c.aiConfigured?'ok':'warn',label=!c?'Đang kiểm tra AI':c.aiConfigured?`${BMH.esc(c.aiProvider||'AI')} · ${BMH.esc(BMH.ai.model||c.aiModel||'model')}`:'AI chưa cấu hình';
  return `<div class="ai-copilot ${BMH.ai.open?'open':''}"><button class="ai-fab" data-ai-open aria-label="Mở AI phân tích"><i>✦</i><span>AI phân tích</span><em class="${status}"></em></button>${BMH.ai.open?`<section class="ai-panel" role="dialog" aria-label="Build My Home AI Decision Engine"><header><div><span class="ai-status ${status}">${label}</span><h2>AI Decision Engine</h2><p>Đọc toàn bộ dự án · tối ưu chi phí · tiện nghi · an toàn</p></div><button data-ai-close aria-label="Đóng">×</button></header><div class="ai-tabs">${[['review','Đánh giá'],['cost','Tiết kiệm'],['whatif','What-if']].map(([id,n])=>`<button class="${BMH.ai.mode===id?'active':''}" data-ai-mode="${id}">${n}</button>`).join('')}</div>${!BMH.aiConfigured()?`<div class="ai-setup"><b>1 phút để bật AI thật</b><span>Mở <code>.env.example</code>, copy thành <code>.env.local</code>, điền <code>GEMINI_API_KEY</code>; khi deploy Vercel thêm cùng biến này trong Environment Variables. <code>gemini-flash-latest</code> tự theo bản Flash mới của Google.</span><small>API key chỉ nằm ở server, không xuất hiện trong trình duyệt.</small></div>`:`<div class="ai-prompt"><textarea id="aiPrompt" rows="3" placeholder="${BMH.ai.mode==='whatif'?'Ví dụ: Nếu giảm ngân sách còn 1,2 tỷ thì nên đổi gì?':BMH.ai.mode==='cost'?'Tìm cách tiết kiệm nhưng không ảnh hưởng an toàn và tiện nghi…':BMH.ai.mode==='review'?'Đánh giá căn nhà hiện tại và chỉ ra 5 việc đáng sửa nhất…':'Mô tả thay đổi bạn muốn kiểm tra…'}">${BMH.esc(BMH.ai.prompt||'')}</textarea><button class="clay" data-ai-run ${BMH.ai.loading?'disabled':''}>${BMH.ai.loading?'AI đang phân tích…':'✦ Phân tích dự án'}</button></div>`}${BMH.ai.error?`<div class="ai-error">${BMH.esc(BMH.ai.error)}</div>`:''}<div class="ai-result">${BMH.ai.loading?'<div class="ai-thinking"><i></i><i></i><i></i><span>AI đang đọc mặt bằng, khí hậu, ngân sách và vật liệu…</span></div>':BMH.aiResultHtml(BMH.ai.result)}</div><footer>AI đưa ra phương án sơ bộ. Kết cấu, MEP, pháp lý và hồ sơ thi công cần KTS/kỹ sư có chuyên môn xác nhận.</footer></section>`:''}</div>`;
};

BMH.aiOpen=()=>{BMH.ai.open=true;BMH.render({preserveScroll:true});};
BMH.aiClose=()=>{BMH.ai.open=false;BMH.render({preserveScroll:true});};
BMH.aiRun=async(action=BMH.ai.mode,prompt='')=>{
  if(BMH.ai.loading)return;
  BMH.ai.open=true;BMH.ai.mode=action;BMH.ai.prompt=prompt||BMH.$('#aiPrompt')?.value||'';BMH.ai.loading=true;BMH.ai.error='';BMH.render({preserveScroll:true});
  try{const data=await BMH.aiCall(action,BMH.ai.prompt);BMH.ai.result=data.result;BMH.ai.model=data.model||'';BMH.ai.provider=data.provider||'';BMH.ai.notice=data.notice||'';BMH.ai.lastAction=action;}
  catch(err){BMH.ai.error=err.message;}
  finally{BMH.ai.loading=false;BMH.render({preserveScroll:true});}
};

BMH.aiNumberToken=value=>{
  const raw=String(value||'').trim();
  if(!raw)return 0;
  if(raw.includes(','))return Number(raw.replace(/\./g,'').replace(',','.'))||0;
  if(/^\d{1,3}(?:\.\d{3})+$/.test(raw))return Number(raw.replace(/\./g,''))||0;
  return Number(raw)||0;
};
BMH.extractExplicitRequirements=text=>{
  const s=String(text||'').toLowerCase(),one=re=>{const m=s.match(re);return m?BMH.aiNumberToken(m[1]):0;};
  const billion=one(/(\d+(?:[.,]\d+)?)\s*t(?:ỷ|y)/i),million=one(/(\d+(?:[.,]\d+)?)\s*tri(?:ệu|eu)/i);
  const people=Math.round(one(/(\d{1,2})\s*(?:người|nguoi|thành\s*viên|thanh\s*vien)/i));
  const floors=Math.round(one(/(\d{1,2})\s*tầng/i)),bedrooms=Math.round(one(/(\d{1,2})\s*(?:phòng\s*ngủ|phong\s*ngu|pn)\b/i));
  const dim=s.match(/(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*m?\b/i);
  const styles=['tân cổ điển','indochine','scandinavian','tối giản','hiện đại','nhật bản','japandi'];
  const style=styles.find(x=>s.includes(x))||'';
  return {
    people:people>=1&&people<=20?people:0,
    floors:floors>=1&&floors<=5?floors:0,
    bedrooms:bedrooms>=1&&bedrooms<=12?bedrooms:0,
    budget_vnd:(billion>0?billion*1e9:0)+(million>0?million*1e6:0),
    width:dim?BMH.aiNumberToken(dim[1]):0,
    depth:dim?BMH.aiNumberToken(dim[2]):0,
    style
  };
};
BMH.applyExplicitRequirements=(text,{save=true}={})=>{
  const req=BMH.extractExplicitRequirements(text),p=BMH.state.project,h=p.household,s=p.site,f=p.finance,labels=[];
  p.brief=p.brief||{};p.brief.userRequirements={...(p.brief.userRequirements?.designReference?{designReference:p.brief.userRequirements.designReference}:{}),...req,sourceText:String(text||'').slice(0,1000),updatedAt:new Date().toISOString()};
  if(req.people){h.requestedSize=req.people;labels.push(req.people+' người');}
  if(req.floors){s.floors=req.floors;labels.push(req.floors+' tầng');}
  if(req.budget_vnd>=100000000&&req.budget_vnd<=20000000000){f.targetBudget=Math.round(req.budget_vnd);labels.push(BMH.money(f.targetBudget));}
  if(req.width>=2&&req.width<=30&&req.depth>=4&&req.depth<=80){s.width=req.width;s.depth=req.depth;labels.push(BMH.num(req.width)+'×'+BMH.num(req.depth)+'m');}
  if(req.style){p.style=req.style.replace(/^./,x=>x.toUpperCase());labels.push(p.style);}
  BMH.normalizeState?.();
  if(save)BMH.save();
  return {requirements:req,summary:labels.length?'Đã đồng bộ yêu cầu: '+labels.join(' · '):''};
};

BMH.applyAIBrief=result=>{
  const b=result?.brief||{},p=BMH.state.project;
  // V6.1.7: Location, finance and household are canonical inputs collected before Step 1.
  // AI Home Vision may enrich creative direction, but must not silently overwrite those foundations.
  if(b.style)p.style=String(b.style).slice(0,80);
  p.brief=p.brief||{};
  p.brief.aiSuggestions={
    budget_vnd:Number(b.budget_vnd)||0,
    province:String(b.province||'').slice(0,80),
    floors:Number(b.floors)||0,
    bedrooms:Number(b.bedrooms)||0,
    household_size:Number(b.household_size)||0,
    priorities:Array.isArray(b.priorities)?b.priorities.slice(0,8).map(String):[]
  };
};

BMH.aiStartBrief=async()=>{
  if(BMH.ai.loading)return;
  const prompt=BMH.$('#aiStartPrompt')?.value?.trim()||'';
  if(!prompt){BMH.toast('Hãy kể ngắn gọn về khu đất, gia đình và ngân sách.');return;}
  BMH.applyExplicitRequirements?.(prompt);
  if(!BMH.aiConfigured()){BMH.ai.open=true;BMH.ai.error='AI chưa có API key. Hãy cấu hình GEMINI_API_KEY trước.';BMH.render({preserveScroll:true});return;}
  BMH.ai.open=true;BMH.ai.mode='review';BMH.ai.prompt=prompt;BMH.ai.loading=true;BMH.ai.error='';BMH.render({preserveScroll:true});
  try{const data=await BMH.aiCall('brief',prompt);BMH.ai.result=data.result;BMH.ai.model=data.model||'';BMH.ai.provider=data.provider||'';BMH.ai.notice=data.notice||'';BMH.applyAIBrief(data.result);BMH.state.project.source='suggest';BMH.state.ui.step=2;BMH.save();BMH.toast('AI đã tạo brief ban đầu. Tiếp tục khảo sát khu đất và vị trí để khóa bối cảnh thực tế.');}
  catch(err){BMH.ai.error=err.message;}
  finally{BMH.ai.loading=false;BMH.render();}
};

BMH.fileToDataUrl=file=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Không đọc được ảnh.'));r.readAsDataURL(file);});
BMH.imageForAI=async file=>{
  if(file.size<=1.8*1024*1024)return BMH.fileToDataUrl(file);
  try{
    const bitmap=await createImageBitmap(file),maxSide=1600,scale=Math.min(1,maxSide/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close?.();return canvas.toDataURL('image/jpeg',.82);
  }catch(_){if(file.size<=3*1024*1024)return BMH.fileToDataUrl(file);throw new Error('Ảnh quá lớn để gửi AI an toàn. Hãy dùng ảnh dưới 3MB hoặc giảm độ phân giải.');}
};
BMH.aiAnalyzeImage=async(file,kind='photo')=>{
  if(!file||!file.type?.startsWith('image/'))return false;
  if(!BMH.aiConfigured())return false;
  if(file.size>12*1024*1024){BMH.toast('Ảnh quá lớn; hãy chọn ảnh dưới 12MB. Hệ thống sẽ tự nén ảnh phù hợp trước khi gửi AI.');return false;}
  BMH.ai.open=true;BMH.ai.mode='review';BMH.ai.imageName=file.name;BMH.ai.loading=true;BMH.ai.error='';BMH.render({preserveScroll:true});
  try{const image_data_url=await BMH.imageForAI(file);const prompt=kind==='plan'?'Đây là bản vẽ/mặt bằng tham khảo. Hãy nhận diện tổ chức không gian, điểm mạnh/yếu và những câu hỏi cần xác minh trước khi dùng làm cơ sở thiết kế.':'Đây là ảnh nhà mẫu người dùng thích. Hãy nhận diện phong cách, vật liệu, hình khối, giải pháp mặt tiền và những yếu tố có thể áp dụng thực tế cho dự án hiện tại.';const data=await BMH.aiCall('vision',prompt,{image_data_url});BMH.ai.result=data.result;BMH.ai.model=data.model||'';BMH.state.project.source=kind==='plan'?'plan':'photo';BMH.save();BMH.toast('AI đã phân tích ảnh tham khảo.');return true;}
  catch(err){BMH.ai.error=err.message;return false;}
  finally{BMH.ai.loading=false;BMH.state.ui.step=2;BMH.save();BMH.render();}
};

document.addEventListener('click',e=>{
  const direct=e.target.closest?.('[data-ai-direct]');if(direct){e.preventDefault();const mode=direct.dataset.aiDirect||'review';BMH.ai.open=true;BMH.ai.mode=mode;BMH.ai.prompt=BMH.aiPresetPrompt(mode);BMH.ai.error='';BMH.render({preserveScroll:true});return;}
  if(e.target.closest?.('[data-ai-review-open]')){e.preventDefault();BMH.ai.open=true;BMH.ai.mode='review';BMH.ai.prompt=BMH.aiPresetPrompt('review');BMH.ai.error='';BMH.render({preserveScroll:true});return;}
  if(e.target.closest?.('[data-ai-open]')){e.preventDefault();BMH.aiOpen();return;}
  if(e.target.closest?.('[data-ai-close]')){e.preventDefault();BMH.aiClose();return;}
  const mode=e.target.closest?.('[data-ai-mode]');if(mode){BMH.ai.mode=mode.dataset.aiMode;BMH.ai.prompt='';BMH.ai.error='';BMH.render({preserveScroll:true});return;}
  if(e.target.closest?.('[data-ai-run]')){BMH.aiRun();return;}
  if(e.target.closest?.('[data-ai-start]')){BMH.aiStartBrief();return;}
  const go=e.target.closest?.('[data-ai-goto]');if(go){BMH.navigateTo(Number(go.dataset.aiGoto));return;}
  const q=e.target.closest?.('[data-ai-question]');if(q){BMH.ai.prompt=q.dataset.aiQuestion||'';BMH.ai.mode='whatif';BMH.render({preserveScroll:true});return;}
});

document.addEventListener('change',e=>{
  const t=e.target;if(!t)return;
  if(t.id==='uploadPhoto'&&t.files?.[0]&&BMH.aiConfigured()){e.stopImmediatePropagation();BMH.aiAnalyzeImage(t.files[0],'photo');t.value='';}
  if(t.id==='uploadPlan'&&t.files?.[0]&&t.files[0].type?.startsWith('image/')&&BMH.aiConfigured()){e.stopImmediatePropagation();BMH.aiAnalyzeImage(t.files[0],'plan');t.value='';}
});

BMH.aiHeaderChip=()=>{const c=BMH.cloud?.config,status=!c?'checking':c.aiConfigured?'ok':'warn';return `<button class="ai-header-chip ${status}" data-ai-open title="AI Decision Engine"><i>✦</i><span>${!c?'AI':c.aiConfigured?'AI online':'Bật AI'}</span></button>`;};
BMH.aiInsightCard=()=>{const r=BMH.ai.result,fromAI=!!r&&BMH.ai.lastAction==='review';return `<article class="card ai-review-card"><div class="between"><h2>✦ AI Review thật</h2><button class="secondary" data-ai-review-open>${fromAI?'Phân tích lại':'Phân tích bằng AI'}</button></div><p>${fromAI?BMH.esc(r.summary):'Rule engine đang kiểm tra hình học và điểm số. Bấm để Gemini đọc toàn bộ dự án và đưa ra nhận xét có ngữ cảnh.'}</p>${fromAI?`<small>${(r.recommendations||[]).slice(0,2).map(x=>BMH.esc(x.title)).join(' · ')}</small>`:'<small>AI key được giữ ở backend; trình duyệt không nhận secret.</small>'}</article>`;};
