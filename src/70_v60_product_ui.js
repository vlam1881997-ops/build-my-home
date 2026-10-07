/* Build My Home V6.0 — product UI reset.
 * One visual system for all 10 steps. Keeps the existing engines, removes patch-on-patch UI.
 */
BMH.VERSION='6.9.0';
BMH.VISUAL_RELEASE='parcel-provenance-feng-planner-v690';

const v6SavedBrief=BMH.state?.project?.brief||{},v6SavedResult=v6SavedBrief.result&&Object.keys(v6SavedBrief.result).length?v6SavedBrief.result:null;
const v6SavedSources=Array.isArray(BMH.state?.project?.sourceRefs)?BMH.state.project.sourceRefs.map(x=>({...x,status:x.status||'Đã lưu tham chiếu · chọn lại tệp nếu cần AI đọc lại'})):[];
BMH.v6={
  upload:null,
  uploads:v6SavedSources,
  ideaDraft:BMH.state?.project?.briefIdea||'',
  briefResult:v6SavedResult,
  briefLoading:false,
  briefError:'',
  s1HeroIndex:0,
  ideaExpanded:false,
  prelimExpanded:false,
  briefProvider:v6SavedBrief.provider||'',
  briefNotice:v6SavedBrief.notice||'',
  uploadBusy:false,
  aiStatus:{checkedAt:0,loading:false,error:''},
  feng:{loading:false,error:'',result:null,citations:[]},
  bankQuery:'',
  bankCategory:'all',
  bankRateLoading:false,
  bankRateBankId:'',
  bankRateError:'',
  bankRateLastAttempt:{bankId:'',at:0},
  bankLogos:{},
  bankLogosLoaded:false,
  bankLogosLoading:false
};

BMH.V6_STEPS=[
  ['AI Home Vision','Concept & cảm hứng'],
  ['Khu đất','Vị trí & khí hậu'],
  ['Gia đình','Địa chất · phong thủy'],
  ['Bản vẽ','Mặt bằng tương tác'],
  ['Vật liệu','Showroom & năng lượng'],
  ['3D','Mô phỏng & đánh giá'],
  ['Dự toán','Chi phí dự kiến'],
  ['Tài chính','Thiếu hụt vốn & ngân hàng'],
  ['Thi công','Tiến độ & MEP'],
  ['Bàn giao','Hồ sơ hoàn chỉnh']
];

BMH.v6Esc=BMH.esc;
BMH.v6Kpi=(label,value,note='')=>'<article class="v6-kpi"><small>'+BMH.v6Esc(label)+'</small><b>'+value+'</b>'+(note?'<span>'+BMH.v6Esc(note)+'</span>':'')+'</article>';
BMH.v6Title=(step,eyebrow,title,desc)=>'<div class="v6-title"><span>BƯỚC '+step+'/10 · '+eyebrow+'</span><h1>'+title+'</h1><p>'+desc+'</p></div>';
BMH.v6PanelTitle=(icon,title,desc='')=>'<div class="v6-panel-title"><i>'+icon+'</i><div><b>'+title+'</b>'+(desc?'<span>'+desc+'</span>':'')+'</div></div>';

BMH.header=()=>{
  const s=BMH.state.project.site,alertCount=BMH.v6?.briefError?1:0;
  return '<header class="v6-header step01-shell">'
    +'<button class="v6-brand" data-nav="1"><img src="assets/icon.svg" alt=""><span><b>Build My Home</b><small>KIẾN TẠO TỔ ẤM, CÙNG AI</small></span></button>'
    +'<nav class="v6-topnav"><button data-nav="1">Ngôi nhà của tôi</button><button data-project-save>Lưu dự án</button><button data-project-library>Mở dự án</button><button data-v6-global="ideas">Thư viện ý tưởng</button><button data-nav="5">Báo giá vật liệu</button><button data-v6-global="ai">AI tư vấn</button></nav>'
    +'<div class="v6-head-actions"><div class="v71-local-project"><button data-project-library title="Các thiết kế đã lưu trên thiết bị">Dự án</button><input id="projectJsonUpload" type="file" accept="application/json,.json" hidden aria-label="Chọn bản sao dự án JSON"></div><span id="customerProjectSaveState" class="customer-project-save-state" role="status">Lưu tự động</span><label class="step01-search"><i>⌕</i><input id="globalSearch" placeholder="Tìm bước, vật liệu, hồ sơ…"></label><button class="step01-bell" data-v6-global="notifications" aria-label="Thông báo">♢'+(alertCount?'<em>'+alertCount+'</em>':'')+'</button><button class="step01-profile" data-v6-global="setup"><i>⌂</i><span><b>Hồ sơ đầu vào</b><small>'+BMH.v6Esc(s.district||s.province)+'</small></span><em>⌄</em></button></div>'
    +'</header>';
};
BMH.stepper=()=>{
  const step=BMH.state.ui.step;
  return '<nav class="v6-stepper" aria-label="10 bước">'+BMH.V6_STEPS.map((x,i)=>{const n=i+1;return '<button data-nav="'+n+'" class="'+(n===step?'active ':'')+(n<step?'done':'')+'"><i>'+(n<step?'✓':n)+'</i><span><b>'+x[0]+'</b><small>'+x[1]+'</small></span></button>';}).join('')+'</nav>';
};
BMH.footer=()=>{
  const step=BMH.state.ui.step,e=BMH.estimate(),r=BMH.designReview();
  return '<div class="v6-footer">'
    +'<button class="v6-back" data-nav="'+Math.max(1,step-1)+'" '+(step===1?'disabled':'')+'>← <span>Quay lại</span></button>'
    +'<div class="v6-budgetbar">'+BMH.v6Kpi('Ngân sách',BMH.money(e.budget))+BMH.v6Kpi('Dự toán',BMH.money(e.total))+BMH.v6Kpi('Dự phòng',e.gap>=0?BMH.money(e.gap):'− '+BMH.money(Math.abs(e.gap)),e.gap>=0?'Trong ngân sách':'Cần tối ưu')+BMH.v6Kpi('Điểm tiện nghi',r.comfort+'/100')+'</div>'
    +(step<10?'<button class="v6-next" data-nav="'+(step+1)+'"><span>Tiếp theo</span> →</button>':'<button class="v6-next" data-nav="1"><span>Xem lại hành trình</span> ↻</button>')
    +'<button class="v6-copilot" data-ai-open>✦ <span><b>AI Copilot</b><small>Hỏi về dự án</small></span></button>'
    +'</div>';
};

BMH.v6UploadInputIds={all:'step1UploadAll',video:'step1UploadVideo',image:'step1UploadImage',pdf:'step1UploadPdf'};
BMH.v6UploadAccept=type=>type==='video'?'video/mp4,video/quicktime,video/webm,video/mpeg,.mp4,.mov,.webm,.mpeg,.mpg':type==='image'?'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp':type==='pdf'?'application/pdf,.pdf':'image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm,video/mpeg,application/pdf,.jpg,.jpeg,.png,.webp,.mp4,.mov,.webm,.mpeg,.mpg,.pdf';
BMH.v6EnsureUploadInput=(type='all')=>{
  const id=BMH.v6UploadInputIds[type]||BMH.v6UploadInputIds.all;
  let input=document.getElementById(id);
  if(input)return input;
  input=document.createElement('input');
  input.id=id;input.type='file';input.multiple=true;input.accept=BMH.v6UploadAccept(type);
  input.className='bmh-native-file-input';input.tabIndex=-1;input.setAttribute('aria-hidden','true');
  document.body.appendChild(input);
  return input;
};
BMH.v6OpenUploadPicker=(type='all')=>{
  const input=BMH.v6EnsureUploadInput(type);
  input.accept=BMH.v6UploadAccept(type);input.multiple=true;input.value='';
  try{if(typeof input.showPicker==='function'){input.showPicker();return true;}}catch(_){}
  try{input.click();return true;}catch(err){console.error(err);BMH.toast('Không mở được bộ chọn tệp.');return false;}
};

BMH.v6RefreshAIConfig=async({force=false,render=false}={})=>{
  const st=BMH.v6.aiStatus,now=Date.now();
  if(st.loading)return !!BMH.cloud?.config?.aiConfigured;
  if(!force&&st.checkedAt&&now-st.checkedAt<15000)return !!BMH.cloud?.config?.aiConfigured;
  st.loading=true;st.error='';
  const before=!!BMH.cloud?.config?.aiConfigured;
  try{
    const r=await fetch('/api/config?ts='+now,{cache:'no-store',headers:{'Accept':'application/json'}});
    let data={};try{data=await r.json();}catch(_){}
    if(!r.ok)throw new Error(data?.error||'Không đọc được cấu hình AI từ server.');
    BMH.cloud=BMH.cloud||{};BMH.cloud.config={...(BMH.cloud.config||{}),...data};
    st.checkedAt=Date.now();st.error='';
  }catch(err){
    st.checkedAt=Date.now();st.error=err.message||String(err);
  }finally{st.loading=false;}
  const after=!!BMH.cloud?.config?.aiConfigured;
  if(render&&(before!==after||st.error))BMH.render({preserveScroll:true});
  return after;
};

BMH.v6FilePreview=async file=>{
  const kind=(file.type||'').startsWith('image/')?'image':(file.type||'').startsWith('video/')?'video':file.type==='application/pdf'?'pdf':'file';
  let dataUrl='',previewUrl='';
  if(kind==='image'&&file.size<=20*1024*1024){
    try{dataUrl=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result||''));fr.onerror=rej;fr.readAsDataURL(file);});}catch(_){}
  }else if(kind==='video'){
    try{previewUrl=URL.createObjectURL(file);}catch(_){}
  }
  return {id:BMH.uid('src'),kind,dataUrl,previewUrl,name:file.name||'Tài liệu',type:file.type||'',size:file.size||0,file,status:'Đã nhận tệp'};
};
BMH.v6ValidateUpload=file=>{
  const type=String(file?.type||''),name=String(file?.name||'').toLowerCase();
  const kind=type.startsWith('image/')?'image':type.startsWith('video/')?'video':(type==='application/pdf'||name.endsWith('.pdf'))?'pdf':'file';
  if(kind==='file')return {ok:false,message:'Step 1 chỉ nhận JPG, PNG, WEBP, MP4, MOV, WEBM và PDF.'};
  const limit=kind==='pdf'?50*1024*1024:250*1024*1024;
  if(Number(file?.size||0)>limit)return {ok:false,message:kind==='pdf'?'PDF vượt 50MB.':'Ảnh/video vượt 250MB.'};
  return {ok:true,kind};
};
BMH.v6FileSize=size=>{
  const n=Number(size)||0;if(n<1024)return n+' B';if(n<1024*1024)return (n/1024).toFixed(1)+' KB';return (n/1024/1024).toFixed(1)+' MB';
};
BMH.v6PersistSourceRefs=()=>{
  BMH.state.project.sourceRefs=(BMH.v6.uploads||[]).slice(0,6).map(x=>({id:x.id,kind:x.kind,name:x.name,type:x.type,size:x.size,status:x.status||'Đã lưu tham chiếu'}));
};

const v6BaseScan=BMH.geminiScanFile;
BMH.v6ReceiveFiles=async(files,intent=BMH.scan?.intent||'reference')=>{
  if(BMH.v6.uploadBusy)return;
  const chosen=[...(files||[])].filter(Boolean);
  if(!chosen.length)return;
  const selected=chosen.slice(0,6),accepted=[];
  for(const file of selected){
    const check=BMH.v6ValidateUpload(file);
    if(!check.ok){BMH.toast(check.message);continue;}
    const old=(BMH.v6.uploads||[]).find(x=>x.name===file.name);
    if(old?.previewUrl)try{URL.revokeObjectURL(old.previewUrl);}catch(_){}
    const item=await BMH.v6FilePreview(file);accepted.push({file,item});
  }
  if(!accepted.length)return;
  const incoming=accepted.map(x=>x.item),names=new Set(incoming.map(x=>x.name));
  BMH.v6.uploads=[...incoming,...(BMH.v6.uploads||[]).filter(x=>!names.has(x.name))].slice(0,6);
  BMH.v6.upload=incoming.find(x=>x.dataUrl)||incoming[0]||BMH.v6.upload;
  BMH.state.project.source='upload';BMH.v6PersistSourceRefs();BMH.save();
  if(chosen.length>6)BMH.toast('Đã nhận 6 tệp đầu tiên. Hãy thêm phần còn lại ở lượt tiếp theo.');
  BMH.render({preserveScroll:true});

  BMH.v6.uploadBusy=true;
  try{
    await BMH.v6RefreshAIConfig({force:true,render:false});
    const mediaReady=!!BMH.geminiConfigured?.();
    if(!mediaReady){
      accepted.forEach(({item})=>item.status='Đã nhận · chờ AI media');
      BMH.v6.briefError='Tài liệu đã được thêm vào Step 1. AI media chưa sẵn sàng nên hệ thống giữ file để bạn tiếp tục làm việc.';
      BMH.v6PersistSourceRefs();BMH.save();BMH.render({preserveScroll:true});
      return;
    }
    BMH.v6.briefError='';
    for(const {file,item} of accepted){
      item.status='AI đang phân tích…';BMH.render({preserveScroll:true});
      try{
        await v6BaseScan(file,intent);
        item.status=BMH.scan?.error?'AI chưa phân tích xong':'AI đã phân tích';
      }catch(err){
        item.status='AI lỗi';
        BMH.v6.briefError=err.message||String(err);
      }
      BMH.render({preserveScroll:true});
    }
    BMH.v6PersistSourceRefs();BMH.save();
    BMH.toast('Đã thêm '+accepted.length+' tài liệu vào Nguồn tham chiếu.');
  }finally{BMH.v6.uploadBusy=false;}
};
if(v6BaseScan){
  BMH.geminiScanFile=(file,intent=BMH.scan?.intent||'reference')=>BMH.v6ReceiveFiles([file],intent);
}

BMH.v6AnalyzeBrief=async()=>{
  if(BMH.v6.briefLoading)return;
  const t=BMH.$('#aiStartPrompt');
  const typed=(t?.value||BMH.v6.ideaDraft||'').trim();
  const sync=typed&&BMH.applyExplicitRequirements?BMH.applyExplicitRequirements(typed,{save:false}):{summary:''};
  const prompt=typed||BMH.v6ConceptPrompt();
  BMH.v6.ideaDraft=typed;
  BMH.state.project.briefIdea=typed;
  BMH.save();
  BMH.v6.briefError='';
  BMH.v6.briefLoading=true;
  BMH.render({preserveScroll:true});
  const ready=await BMH.v6RefreshAIConfig({force:true,render:false});
  if(!ready){
    BMH.v6.briefLoading=false;
    BMH.v6.briefError='Website production chưa thấy GEMINI_API_KEY. .env.local chỉ áp dụng khi chạy local; Vercel cần GEMINI_API_KEY trong Environment Variables.';
    BMH.render({preserveScroll:true});
    return;
  }
  try{
    const data=await BMH.aiCall('brief',prompt);
    BMH.v6.briefResult=data.result||null;
    BMH.v6.briefProvider=data.provider||'';BMH.v6.briefNotice=data.notice||'';
    BMH.ai.result=data.result||null;BMH.ai.model=data.model||'';BMH.ai.provider=data.provider||'';BMH.ai.notice=data.notice||'';BMH.ai.lastAction='brief';
    if(data.result)BMH.applyAIBrief(data.result);
    BMH.state.project.source='ai-brief';
    BMH.state.project.brief={...(BMH.state.project.brief||{}),provider:data.provider||'',model:data.model||'',notice:data.notice||'',updatedAt:new Date().toISOString(),result:data.result||{}};
    BMH.save();
    const doneMsg=data.degraded?'AI cloud đang giới hạn · đã tạo brief bằng bộ phân tích dự phòng.':'AI đã tạo concept từ hồ sơ nền. Step 1 giữ nguyên để bạn xem và bổ sung cảm hứng.';
    BMH.toast(sync?.summary?sync.summary+' · '+doneMsg:doneMsg);
  }catch(err){
    BMH.v6.briefError=err.message||String(err);
  }finally{
    BMH.v6.briefLoading=false;
    BMH.render({preserveScroll:true});
  }
};

BMH.v6Household=()=>{
  const h=BMH.state.project.household,list=[
    {kind:'owner',id:'owner',role:'Gia chủ',name:'Gia chủ',birth:h.ownerBirth,gender:h.ownerGender,removable:false}
  ];
  if(h.partnerEnabled!==false)list.push({kind:'partner',id:'partner',role:'Bạn đời',name:'Bạn đời',birth:h.partnerBirth,gender:h.partnerGender,removable:false});
  (h.children||[]).forEach(x=>list.push({kind:'child',id:x.id,role:'Con',name:x.name||'Con',birth:x.birth,gender:x.gender||'',removable:true,raw:x}));
  (h.relatives||[]).forEach(x=>list.push({kind:'relative',id:x.id,role:'Người thân',name:x.name||'Người thân',birth:x.birth,gender:x.gender||'',removable:true,raw:x}));
  return list;
};

BMH.v6PersonCard=m=>{
  if(m.kind==='owner'||m.kind==='partner'){
    const prefix=m.kind==='owner'?'owner':'partner';
    return '<article class="v6-person '+(m.kind==='owner'?'primary':'')+'"><div class="v6-person-head"><i>'+(m.kind==='owner'?'⌂':'♡')+'</i><div><b>'+m.role+'</b><span>Năm sinh & giới tính</span></div>'+(m.kind==='partner'?'<button data-v6-partner="off">Ẩn</button>':'')+'</div><label>Năm sinh<input data-path="project.household.'+prefix+'Birth" type="number" min="1900" max="2026" value="'+m.birth+'"></label><label>Giới tính<select data-path="project.household.'+prefix+'Gender"><option '+(m.gender==='Nam'?'selected':'')+'>Nam</option><option '+(m.gender==='Nữ'?'selected':'')+'>Nữ</option></select></label></article>';
  }
  return '<article class="v6-person"><div class="v6-person-head"><i>'+(m.kind==='child'?'☺':'♙')+'</i><div><b>'+BMH.v6Esc(m.name)+'</b><span>'+m.role+'</span></div><button class="danger" data-person-remove="'+m.kind+'" data-id="'+BMH.v6Esc(m.id)+'">Xóa</button></div><label>Tên<input data-v6-person="'+m.kind+'" data-id="'+BMH.v6Esc(m.id)+'" data-key="name" value="'+BMH.v6Esc(m.name)+'"></label><label>Năm sinh<input data-v6-person="'+m.kind+'" data-id="'+BMH.v6Esc(m.id)+'" data-key="birth" type="number" min="1900" max="2026" value="'+m.birth+'"></label><label>Giới tính dùng tính cung phi<select data-v6-person="'+m.kind+'" data-id="'+BMH.v6Esc(m.id)+'" data-key="gender"><option value="" '+(!m.gender?'selected':'')+'>Chưa khai báo</option><option value="Nam" '+(m.gender==='Nam'?'selected':'')+'>Nam</option><option value="Nữ" '+(m.gender==='Nữ'?'selected':'')+'>Nữ</option></select></label></article>';
};

BMH.v6SetupSteps=[['⌖','Vị trí','Khu vực & quy mô đất'],['◉','Tài chính','Ngân sách sơ bộ'],['♙','Gia đình','Thành viên sinh sống']];

BMH.v6SetupValidate=stage=>{
  const p=BMH.state.project,s=p.site,f=p.finance,h=p.household;
  if(stage===1){
    if(!s.province||!s.district){BMH.toast('Hãy chọn khu vực xây nhà.');return false;}
    if(!(Number(s.width)>0&&Number(s.depth)>0)){BMH.toast('Hãy nhập kích thước khu đất.');return false;}
    if(!(Number(s.floors)>=1&&Number(s.floors)<=5)){BMH.toast('Số tầng dự kiến cần từ 1 đến 5.');return false;}
  }
  if(stage===2&&Number(f.targetBudget||0)<100000000){BMH.toast('Hãy nhập ngân sách dự kiến trước khi tiếp tục.');return false;}
  if(stage===3){
    BMH.syncHouseholdSize?.();
    if((Number(h.requestedSize)||0)<1){BMH.toast('Hãy khai báo ít nhất gia chủ.');return false;}
  }
  return true;
};

BMH.v6SetupScreen=()=>{
  const p=BMH.state.project,s=p.site,f=p.finance,h=p.household,stage=BMH.clamp(Number(BMH.state.ui.onboardingStep)||1,1,3);
  const region=BMH.REGIONS[s.province]||BMH.REGIONS['TP. Hồ Chí Minh'];
  const provinces=Object.keys(BMH.REGIONS).map(x=>'<option '+(x===s.province?'selected':'')+'>'+BMH.v6Esc(x)+'</option>').join('');
  const districts=(region?.districts||[]).map(x=>'<option '+(x[0]===s.district?'selected':'')+'>'+BMH.v6Esc(x[0])+'</option>').join('');
  const target=Math.max(0,Number(f.targetBudget)||0),needs=BMH.householdNeeds?.()||{},members=BMH.v6Household();
  const body1='<section class="setup-card setup-location"><div class="setup-heading"><span>KHỞI TẠO DỰ ÁN · 1/3</span><h1>Ngôi nhà sẽ được xây ở đâu?</h1><p>Chọn vị trí và quy mô nền trước. Các dữ liệu này sẽ đi xuyên suốt toàn bộ Studio và AI không được tự ý thay đổi.</p></div><div class="setup-fields"><label>Tỉnh / thành<select data-path="project.site.province">'+provinces+'</select></label><label>Khu vực<select data-path="project.site.district">'+districts+'</select></label><label>Mặt tiền<div><input data-path="project.site.width" type="number" min="2" step=".1" value="'+s.width+'"><em>m</em></div></label><label>Chiều sâu<div><input data-path="project.site.depth" type="number" min="4" step=".1" value="'+s.depth+'"><em>m</em></div></label><label>Số tầng dự kiến<div><input data-path="project.site.floors" type="number" min="1" max="5" value="'+s.floors+'"><em>tầng</em></div></label></div><div class="setup-insight"><i>☀</i><div><b>'+BMH.v6Esc(region?.climate||'Khí hậu vùng')+'</b><span>'+BMH.v6Esc(s.district||s.province)+' · dữ liệu này sẽ được dùng ở Step 1 và các bước phân tích sau.</span></div></div></section>';
  const body2='<section class="setup-card setup-finance"><div class="setup-heading"><span>KHỞI TẠO DỰ ÁN · 2/3</span><h1>Giới hạn tài chính ban đầu là bao nhiêu?</h1><p>Chỉ lấy ba con số nền. Phần này chỉ ghi nhận trần ngân sách ban đầu. Sau khi có dự toán ở Step 7, Step 8 mới tính thiếu hụt vốn, DTI và phương án vay.</p></div><div class="setup-budget-hero"><small>NGÂN SÁCH MỤC TIÊU</small><label><input data-path="project.finance.targetBudget" data-scale="1000000" type="number" min="100" step="50" value="'+Math.round(target/1000000)+'"><em>triệu đồng</em></label><b>'+BMH.money(target)+'</b></div><div class="setup-fields two"><label>Thu nhập hộ gia đình / tháng<div><input data-path="project.finance.income" data-scale="1000000" type="number" min="0" step="1" value="'+Math.round((Number(f.income)||0)/1000000)+'"><em>triệu</em></div></label><label>Chi phí sinh hoạt / tháng<div><input data-path="project.finance.living" data-scale="1000000" type="number" min="0" step="1" value="'+Math.round((Number(f.living)||0)/1000000)+'"><em>triệu</em></div></label></div><div class="setup-insight"><i>◉</i><div><b>Step 1 sẽ dùng '+BMH.money(target)+' làm trần ngân sách.</b><span>AI Home Vision chỉ đề xuất concept phù hợp với trần này; không được tự tăng ngân sách.</span></div></div></section>';
  const personCards=members.map(BMH.v6PersonCard).join('');
  const body3='<section class="setup-card setup-family"><div class="setup-heading"><span>KHỞI TẠO DỰ ÁN · 3/3</span><h1>Ai sẽ sống trong ngôi nhà này?</h1><p>Khai báo thành viên trước khi tạo concept để AI hiểu số phòng, khả năng tiếp cận và nhu cầu sinh hoạt thực tế.</p></div><div class="setup-family-summary"><article><small>Thành viên hiện có</small><b>'+members.length+' người</b></article><article><small>Phòng ngủ gợi ý</small><b>'+Number(needs.bedrooms||1)+' phòng</b></article><article><small>WC gợi ý</small><b>'+Number(needs.bathrooms||1)+' phòng</b></article></div><div class="setup-family-actions"><button data-household-add="child">＋ Thêm con</button><button data-household-add="relative">＋ Thêm người thân</button>'+(h.partnerEnabled===false?'<button data-v6-partner="on">＋ Thêm bạn đời</button>':'')+'</div><div class="v6-people setup-people">'+personCards+'</div><div class="setup-review"><b>Hồ sơ nền sắp hoàn tất</b><span>'+BMH.v6Esc(s.district||s.province)+' · '+BMH.money(target)+' · '+members.length+' thành viên · '+s.floors+' tầng dự kiến</span></div></section>';
  const bodies=[body1,body2,body3];
  const visual=[
    {img:'assets/design/intake-location.webp',alt:'Minh họa khu đất và ngôi nhà',eyebrow:'01 · LOCATION INTELLIGENCE',title:'Bắt đầu từ nơi ngôi nhà sẽ thuộc về.',copy:'Vị trí, khí hậu và quy mô khu đất là nền tảng để mọi đề xuất phía sau có lý do.',pills:['Khí hậu vùng','Quy mô khu đất','Số tầng dự kiến']},
    {img:'assets/design/intake-finance.webp',alt:'Minh họa lập ngân sách xây nhà',eyebrow:'02 · FINANCIAL FRAME',title:'Đẹp đến đâu cũng phải nằm trong khả năng thực hiện.',copy:'Khóa một trần ngân sách thực tế trước khi AI tạo concept để tránh những phương án đẹp nhưng không thể xây.',pills:['Ngân sách mục tiêu','Thu nhập hộ gia đình','Không tự tăng ngân sách']},
    {img:'assets/design/intake-family.webp',alt:'Minh họa tổ ấm gia đình',eyebrow:'03 · FAMILY DNA',title:'Ngôi nhà được thiết kế cho những người sẽ sống trong đó.',copy:'AI cần hiểu gia đình trước khi nghĩ về phòng, ánh sáng, sự riêng tư và cách mọi người gặp nhau mỗi ngày.',pills:['Thành viên','Phòng ngủ gợi ý','Nhu cầu sinh hoạt']}
  ][stage-1];
  const progress=Math.round(stage/3*100);
  const stepper='<nav class="setup-stepper">'+BMH.v6SetupSteps.map((x,i)=>{const n=i+1;return '<button data-setup-jump="'+n+'" class="'+(stage===n?'active ':'')+(stage>n?'done':'')+'"><i>'+(stage>n?'✓':String(n).padStart(2,'0'))+'</i><span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></button>';}).join('')+'</nav>';
  const footer='<footer class="setup-footer"><button data-setup-back '+(stage===1?'disabled':'')+'>← Quay lại</button><div><small>HỒ SƠ NỀN</small><b>'+progress+'% hoàn tất</b></div>'+(stage<3?'<button class="primary" data-setup-next>Tiếp tục <span>→</span></button>':'<button class="primary" data-setup-finish>Vào AI Home Vision <span>→</span></button>')+'</footer>';
  return '<div class="setup-shell">'
    +'<header class="setup-top"><div class="setup-brand"><img src="assets/icon.svg" alt=""><span><b>Build My Home</b><small>KIẾN TẠO TỔ ẤM, CÙNG AI</small></span></div><div class="setup-top-progress"><span><i style="width:'+progress+'%"></i></span><small>'+stage+' / 3</small></div><div class="v71-setup-files"><button data-export="json">↓ Lưu bản sao</button><button data-project-import>↑ Mở bản sao</button><input id="projectJsonUpload" type="file" accept="application/json,.json" hidden aria-label="Chọn bản sao dự án JSON"></div></header>'
    +'<main class="setup-main setup-premium">'
      +'<aside class="setup-visual"><img src="'+visual.img+'" alt="'+visual.alt+'" width="1120" height="630"><span class="setup-illustration-label">Ảnh minh họa · BMH</span><div class="setup-visual-shade"></div><div class="setup-visual-copy"><span>'+visual.eyebrow+'</span><h2>'+visual.title+'</h2><p>'+visual.copy+'</p><div>'+visual.pills.map(x=>'<em>✓ '+x+'</em>').join('')+'</div></div><div class="setup-visual-signature"><i>✦</i><span><b>Build My Home AI</b><small>Hồ sơ nền trước · concept sau</small></span></div></aside>'
      +'<section class="setup-workspace"><div class="setup-workspace-inner">'+stepper+bodies[stage-1]+footer+'</div></section>'
    +'</main>'
  +'</div>';
};

BMH.v6ConceptPrompt=()=>{
  const p=BMH.state.project,s=p.site,f=p.finance,needs=BMH.householdNeeds?.()||{};
  return 'Hãy tạo concept kiến trúc phù hợp cho khu đất '+BMH.num(s.width)+'×'+BMH.num(s.depth)+'m tại '+(s.district||s.province)+', '+s.floors+' tầng, ngân sách mục tiêu '+BMH.money(Number(f.targetBudget)||BMH.financeSummary().available)+', gia đình '+(needs.people||1)+' người. Phong cách đã chọn: '+p.style+'. '+(BMH.houseStyle()?.description||'')+' Tập trung vào hình khối, ánh sáng, cây xanh và trải nghiệm sống; không thay đổi dữ liệu nền nếu chưa được người dùng xác nhận.';
};

BMH.v6FengKey=()=>JSON.stringify(BMH.fengResearchContext());
BMH.v6FengRestoreResult=(key=BMH.v6FengKey())=>{
  const rows=BMH.state.project.designEvidence?.fengSources||[];
  const row=[...rows].reverse().find(r=>r.kind==='feng-research-response'&&r.verifiedState!=='stale'&&r.scope?.fengContextKey===key&&r.value?.result);
  return row?structuredClone(row.value.result):null;
};
BMH.v6SaveFengResult=(result,key=BMH.v6FengKey())=>{
  const evidence=BMH.state.project.designEvidence;if(!evidence||!result?.retrievedAt)return;
  // Every completed response supersedes its predecessor, including the SAME context.
  // Source IDs are local to the immutable response; they can never resolve to a newer URL.
  for(const row of evidence.fengSources)if(row.kind==='feng-research-response'||row.kind==='feng-source')row.verifiedState='stale';
  const responseId=BMH.uid('feng-response'),copy=structuredClone(result);
  evidence.fengSources.push({id:responseId,kind:'feng-research-response',sourceUrl:null,sourceTitle:result.headline,publisher:null,retrievedAt:result.retrievedAt,effectiveAt:null,scope:{fengContextKey:key,responseId},sourceType:'ai',verifiedState:result.status==='ready'?'cited':'unverified',value:{result:copy},unit:null,notes:'Tham khảo văn hóa; không áp dụng thay đổi mặt bằng.'});
  for(const source of result.sources||[])evidence.fengSources.push({id:responseId+'-'+source.id,kind:'feng-source',sourceUrl:source.url,sourceTitle:source.title,publisher:source.bibliography?.publisher||null,retrievedAt:source.retrievedAt,effectiveAt:null,scope:{fengContextKey:key,responseId,sourceId:source.id},sourceType:'web',verifiedState:source.pageStatus==='retrieved'?'cited':'unverified',value:{bibliography:source.bibliography,pageStatus:source.pageStatus,claims:(result.claims||[]).filter(c=>c.sourceIds?.includes(source.id))},unit:null,notes:'Chỉ metadata đã truy xuất; chương/trang chưa có nguồn để trống.'});
  evidence.fengSources=evidence.fengSources.slice(-200);BMH.save();
};
BMH.v6RunFeng=async()=>{
  const key=BMH.v6FengKey(),project=BMH.state.project;
  if(BMH.v6.feng.loading&&BMH.v6.feng.key===key&&BMH.v6.feng.project===project)return;
  const requestId=BMH.v6.fengRequestId=(BMH.v6.fengRequestId||0)+1;
  BMH.v6.feng={key,project,loading:true,error:'',result:null,citations:[]};BMH.render({preserveScroll:true});
  try{
    const data=await BMH.aiCall('fengshui');
    if(requestId!==BMH.v6.fengRequestId||project!==BMH.state.project||key!==BMH.v6FengKey())return;
    BMH.v6SaveFengResult(data.result,key);
    BMH.v6.feng={key,project,loading:false,error:'',result:data.result||null,citations:data.citations||[]};
  }catch(err){if(requestId!==BMH.v6.fengRequestId||project!==BMH.state.project||key!==BMH.v6FengKey())return;BMH.v6.feng={key,project,loading:false,error:err.status===429?'Nghiên cứu web tạm hết lượt. Công thức cục bộ và lựa chọn bố trí vẫn dùng được.':err.message||String(err),result:null,citations:[]};}
  BMH.render({preserveScroll:true});
};
BMH.v6FengControls=()=>{
  const s=BMH.state.project.site,confirmed=BMH.fengResearchContext().site.directionStatus==='customer_confirmed',dirs=['Bắc','Đông Bắc','Đông','Đông Nam','Nam','Tây Nam','Tây','Tây Bắc'];
  return '<div class="feng-input-confirmation"><label>Hướng mặt tiền theo hồ sơ<select data-v6-feng-direction>'+dirs.map(d=>'<option '+(d===s.frontDirection?'selected':'')+'>'+d+'</option>').join('')+'</select></label><label class="feng-check"><input type="checkbox" data-v6-feng-confirm '+(confirmed?'checked':'')+'> Tôi xác nhận hướng này để tham khảo</label><small>Xác nhận của chủ nhà; chưa phải số đo phương vị khảo sát. Giường, bếp và bàn thờ dự trù chưa được xem là vị trí đã chốt.</small></div>';
};
BMH.v6FengResult=()=>{
  const key=BMH.v6FengKey(),st=BMH.v6.feng.project===BMH.state.project?BMH.v6.feng:{};
  if(st.key&&st.key!==key)return '<div class="v6-ai-research"><i>↻</i><div><b>Hồ sơ đã đổi</b><span>Nguồn cũ không áp dụng cho hướng hoặc bố trí mới. Nghiên cứu lại khi muốn đối chiếu.</span></div></div>';
  if(st.loading)return '<div class="v6-ai-research loading" role="status"><i>✦</i><div><b>Đang đối chiếu nguồn công khai…</b><span>Một lượt nghiên cứu có giới hạn thời gian; không thay đổi mặt bằng.</span></div></div>';
  if(st.error)return '<div class="v6-ai-research error" role="status"><i>!</i><div><b>Nguồn web chưa sẵn sàng</b><span>'+BMH.v6Esc(st.error)+'</span></div></div>';
  const r=st.result||BMH.v6FengRestoreResult(key);
  if(!r)return '<div class="v6-ai-research"><i>✦</i><div><b>Tham khảo văn hóa theo hồ sơ</b><span>Nghiên cứu web chỉ chạy khi có quyền Search và hạn mức miễn phí được xác nhận. Bạn vẫn tự chọn vị trí phòng thờ ở phòng khách hoặc bất kỳ tầng phù hợp.</span></div></div>';
  const esc=BMH.v6Esc,missingNames={confirmed_house_direction:'hướng nhà đã xác nhận',measured_dimensions:'số đo đất đã xác nhận',measured_rooms:'mặt bằng có số đo',member_kua:'cung phi từng thành viên',confirmed_bed_position:'vị trí/hướng giường đã chốt',confirmed_stove_position:'vị trí/hướng bếp đã chốt',confirmed_altar_position:'vị trí/hướng bàn thờ đã chốt'},areaNames={house:'Hướng nhà',room:'Hướng phòng',bed:'Giường',kitchen:'Bếp',altar:'Không gian thờ'};
  const valid=(r.sources||[]).filter(s=>/^https:\/\//i.test(s.url||'')),sourceById=new Map(valid.map(s=>[s.id,s]));
  const claims=(r.claims||[]).map(c=>'<article class="feng-source-claim"><small>'+esc(areaNames[c.area]||'Nhà')+' · '+esc(c.school||'Chưa rõ trường phái')+'</small><b>'+esc(c.recommendation)+'</b><span>'+esc(c.rationale||'')+'</span><div>'+((c.sourceIds||[]).filter(id=>sourceById.has(id)).map(id=>{const x=sourceById.get(id);return '<a target="_blank" rel="noopener noreferrer" href="'+esc(x.url)+'">'+esc(x.title)+' ↗</a>';}).join('')||'<em>Gợi ý chưa có nguồn truy xuất gắn với lời này.</em>')+'</div>'+((c.missingCriteria||[]).length?'<small>Còn thiếu: '+esc((c.missingCriteria||[]).map(k=>missingNames[k]||k).join(' · '))+'</small>':'')+'<small>Chủ nhà tự quyết định · không tự sửa bố trí.</small></article>').join('');
  const sources=valid.map(x=>{const b=x.bibliography||{},field=(name,value)=>'<span><b>'+name+'</b> '+esc(value||'Chưa xác minh')+'</span>';return '<article class="feng-book-source"><a target="_blank" rel="noopener noreferrer" href="'+esc(x.url)+'">'+esc(x.title)+' ↗</a><div>'+field('Tên sách / tài liệu',b.title)+field('Tác giả',b.author)+field('Ấn bản',b.edition)+field('Nhà xuất bản',b.publisher)+field('Chương',b.chapter)+field('Trang',b.page)+'</div><small>'+esc(x.retrievedAt?'Truy xuất: '+x.retrievedAt:'Chưa truy xuất được trang nguồn')+' · liên kết nguồn không chứng minh quy tắc.</small></article>';}).join('');
  const coverage=r.coverage||{},missing=(r.missingCriteria||[]).map(k=>missingNames[k]||k).join(' · ');
  return '<div class="v6-feng-result"><div><small>Tham khảo văn hóa · mức bao phủ dữ liệu</small><h4>'+esc(r.headline||'Kết quả nghiên cứu')+'</h4><p>'+esc(r.notice||r.summary||'')+'</p><p>'+Number(coverage.linkedClaims||0)+' / '+Number(coverage.totalClaims||0)+' gợi ý có liên kết nguồn đã truy xuất; '+Number(coverage.enteredCriteria||0)+' / '+Number(coverage.totalCriteria||7)+' nhóm dữ liệu đã nhập. Không phải điểm đúng/sai phong thủy.</p>'+(missing?'<p class="feng-missing"><b>Còn thiếu:</b> '+esc(missing)+'</p>':'')+'</div><section>'+claims+'</section>'+(sources?'<details class="feng-source-details"><summary>Nguồn & metadata sách đã đối chiếu</summary>'+sources+'</details>':'')+'<details class="feng-source-details"><summary>Giới hạn của gợi ý</summary>'+(r.limitations||[]).map(x=>'<p>'+esc(x)+'</p>').join('')+'</details></div>';
};
document.addEventListener('change',e=>{
  if(!e.target.matches?.('[data-v6-feng-direction],[data-v6-feng-confirm]'))return;
  const p=BMH.state.project,rows=p.designEvidence?.site;if(!rows)return;
  for(const r of rows)if(r.kind==='direction')r.verifiedState='stale';
  if(e.target.matches('[data-v6-feng-direction]'))p.site.frontDirection=e.target.value;
  else if(e.target.checked)rows.push({id:BMH.uid('direction'),kind:'direction',sourceUrl:null,sourceTitle:'Hướng mặt tiền do chủ nhà xác nhận',publisher:null,retrievedAt:null,effectiveAt:new Date().toISOString(),scope:{locationKey:BMH.siteLocationKey?.()},sourceType:'customer',verifiedState:'provided',value:{frontDirection:p.site.frontDirection,measured:false},unit:null,notes:'Thông tin chủ nhà nhập; chưa phải phương vị khảo sát.'});
  BMH.save();BMH.render({preserveScroll:true});
});
BMH.v6FengFamily=()=>{
  const rows=BMH.v6Household().map(m=>{
    const f=BMH.fengIdentity(m.birth,m.gender);
    return '<tr><th>'+BMH.v6Esc(m.name||m.role)+'<small>'+BMH.v6Esc(m.role)+'</small></th><td>'+BMH.v6Esc(String(m.birth||'—'))+(f?' · '+BMH.v6Esc(f.canChi):'')+'</td><td>'+(f?'Cung '+f.kua+' · '+BMH.v6Esc(f.element):'Cần giới tính/năm sinh')+'</td><td>'+(f?BMH.v6Esc(f.group)+'<small>'+BMH.v6Esc(f.dirs.join(' · '))+'</small>':'—')+'</td></tr>';
  });
  return '<div class="v70-feng-family"><h3>Từng thành viên · Cung phi Bát trạch</h3><p>Năm sinh Dương lịch chỉ là đầu vào tạm. Người sinh gần Tết âm lịch / Lập xuân cần ngày tháng sinh để chốt năm dùng trong từng trường phái. Ngũ hành ở đây là <b>ngũ hành cung phi</b>, không phải nạp âm hay kết luận vận mệnh.</p><div class="v70-feng-table"><table><thead><tr><th>Thành viên</th><th>Năm / Can Chi tạm</th><th>Cung / hành</th><th>Nhóm / hướng tham khảo</th></tr></thead><tbody>'+rows.join('')+'</tbody></table></div><details><summary>Phương pháp và nguồn sách</summary><p>Công thức cung phi cộng rút gọn các chữ số năm sinh, phân nhánh theo giới tính và trước/sau năm 2000; cung 5 quy về 2 (Nam) hoặc 8 (Nữ). Thứ tự hướng đang là quy ước Bát trạch của ứng dụng, chưa đối chiếu đầy đủ vị trí Sinh Khí/Thiên Y cho từng cung. Không dùng như chứng cứ khoa học hoặc thay chỉ tiêu kỹ thuật.</p><a href="https://zh.wikisource.org/wiki/%E5%AE%85%E7%B6%93/%E5%8D%B7%E4%B8%8A" target="_blank" rel="noopener noreferrer">《宅經》 · bản chép chữ Hán (Wikisource) ↗</a><a href="https://zh.wikisource.org/zh-hant/%E6%98%93%E5%82%B3/%E8%AA%AA%E5%8D%A6" target="_blank" rel="noopener noreferrer">《易傳·說卦》 · hệ quẻ/hướng (Wikisource) ↗</a><a href="https://www.keepds.com/book/read?bo=bazhaimingjing" target="_blank" rel="noopener noreferrer">《八宅明鏡》 · bản chép trực tuyến, chưa xác minh ấn bản ↗</a><a href="https://opac.nlv.gov.vn/" target="_blank" rel="noopener noreferrer">Tra cứu ấn bản phong thủy Việt Nam · Thư viện Quốc gia ↗</a><small>Các bản cổ cung cấp bối cảnh truyền thống; chúng không trực tiếp chứng minh phép tính cung phi ở trên. Chưa đối chiếu được một ấn bản Việt Nam cụ thể, nên không gán tác giả/trang sách tùy tiện.</small></details></div>';
};

BMH.v6MaterialImage=(cat,item)=>{
  if(item?.img)return item.img;
  const map={floor:'assets/materials/tile-viglacera.jpg',paint:'assets/materials/paint-fallback.jpg',door:'assets/materials/aluminium-fallback.jpg',cement:'assets/design/flow-c.jpg',steel:'assets/design/flow-a.jpg',waterproof:'assets/design/flow-b.jpg',mep:'assets/design/flow-c.jpg',sanitary:'assets/rooms/living-local.jpg',roof:'assets/rooms/facade-local.jpg',insulation:'assets/design/flow-b.jpg',lighting:'assets/rooms/living-local.jpg',cabinetry:'assets/rooms/living-local.jpg'};
  return map[cat]||'assets/design/flow-c.jpg';
};
BMH.v71SafeHttps=value=>{try{const url=new URL(String(value||''));return url.protocol==='https:'&&!url.username&&!url.password?url.href:'';}catch{return '';}};
BMH.v71MaterialCard=(cat,m,x,i)=>{
  const quote=BMH.materialOverride(x.id),productUrl=BMH.v71SafeHttps(quote?.productUrl),imageUrl=BMH.v71SafeHttps(quote?.imageUrl);
  const exactPhoto=!!(quote?.sku&&productUrl&&imageUrl),src=exactPhoto?imageUrl:BMH.v6MaterialImage(cat,x),title=exactPhoto?`Ảnh nhập cho mã ${quote.sku} · cần đối chiếu trang nguồn`:'Ảnh minh họa · chưa có ảnh đúng mã sản phẩm';
  const field=(key,label,value='',type='text')=>'<label>'+label+'<input data-product-field="'+key+'" type="'+type+'" value="'+BMH.v6Esc(value)+'"></label>';
  return '<article class="'+(m.choices[cat]===x.id?'active':'')+'"><div class="v71-product-image"><img src="'+BMH.v6Esc(src)+'" alt="'+BMH.v6Esc(title)+'" loading="lazy" referrerpolicy="no-referrer"><span class="'+(exactPhoto?'exact':'')+'">'+BMH.v6Esc(title)+'</span></div><div><small>'+(i===0?'Cơ bản':i===BMH.MATERIALS[cat].length-1?'Nâng cấp':'Cân bằng')+'</small><h3>'+BMH.v6Esc(x.name)+'</h3><p>'+BMH.v6Esc(x.sub||'')+'</p>'+(quote?.sku?'<p class="v71-product-sku">Mã hàng: '+BMH.v6Esc(quote.sku)+'</p>':'<p class="v71-product-sku">Chưa có mã hàng cụ thể</p>')+(productUrl?'<a class="v71-product-source" href="'+BMH.v6Esc(productUrl)+'" target="_blank" rel="noopener noreferrer">Trang sản phẩm để đối chiếu ↗</a>':'')+'<strong>'+BMH.v6Esc(BMH.materialPriceLabel(cat,x))+'</strong><small class="v69-material-source">'+BMH.v6Esc(BMH.materialSourceLabel(x))+'</small><button data-material="'+BMH.v6Esc(x.id)+'" data-material-cat="'+cat+'">'+(m.choices[cat]===x.id?'✓ Đã chọn':'Chọn phương án')+'</button><details class="v71-product-evidence" data-product-card="'+BMH.v6Esc(x.id)+'"><summary>Gắn mã hàng, ảnh thật và báo giá</summary><div class="v71-product-fields">'+field('sku','Mã sản phẩm',quote?.sku||'')+field('productUrl','Trang sản phẩm HTTPS',quote?.productUrl||'','url')+field('imageUrl','Ảnh sản phẩm HTTPS',quote?.imageUrl||'','url')+field('value','Giá VND / đơn vị',quote?.value||'','number')+field('unit','Đơn vị (m², lít, bộ...)',quote?.unit||'m²')+field('source','Nhà bán / nguồn báo giá',quote?.source||'')+field('date','Ngày báo giá',quote?.date||'','date')+'</div><button data-product-save="'+BMH.v6Esc(x.id)+'">Lưu thông tin sản phẩm</button><p>Ảnh do người dùng nhập; cần mở trang sản phẩm để kiểm tra đúng mã, màu và quy cách. Giá chỉ vào dự toán nếu đơn vị m² phù hợp.</p></details></div></article>';
};
BMH.v6MatMeta={
  floor:['▥','Gạch & sàn'],cement:['▰','Xi măng & bê tông'],steel:['◇','Thép xây dựng'],waterproof:['☂','Chống thấm'],paint:['▧','Sơn hoàn thiện'],mep:['⚙','Điện nước MEP'],door:['▤','Cửa & cửa sổ'],sanitary:['◫','Thiết bị vệ sinh'],roof:['⌂','Mái & chống nóng'],insulation:['≋','Cách nhiệt / cách âm'],lighting:['☀','Chiếu sáng'],cabinetry:['▣','Tủ & nội thất cố định']
};

// Capture BMH's existing vector illustration before later photo-moodboard extensions.
const v6ReferenceIllustration=BMH.styleIllustration;
BMH.v6DesignResearch={loading:false,result:null,error:'',key:'',inflight:null,filter:'all',styleFilter:'',cacheUntil:0,blockedUntil:0,attempts:{start:0,count:0}};
BMH.v6DesignMissingLabels={house_type:'Loại nhà',style:'Phong cách',measured_dimensions:'Số đo thực địa',floors:'Số tầng',floor_program:'Công năng từng tầng',target_budget:'Ngân sách mục tiêu',file_analysis_verification:'Phân tích tệp cần xác nhận'};
BMH.v6DesignMissing=()=>{
  const c=BMH.designResearchContext(),missing=[];
  if(c.houseType==='unconfirmed')missing.push('house_type');if(!c.styleId)missing.push('style');
  if(!c.site.widthM||!c.site.depthM||c.site.dimensionsStatus!=='customer_confirmed')missing.push('measured_dimensions');
  if(!c.site.floors)missing.push('floors');
  if(c.floorProgram.length!==c.site.floors||c.floorProgram.some(f=>f.bedrooms===null||f.bathrooms===null||f.worship==='unconfirmed'||f.extraRooms.some(q=>q.count===null||q.minAreaM2===null)))missing.push('floor_program');
  if(c.budget.status!=='customer_target')missing.push('target_budget');if(c.references.analysis.available)missing.push('file_analysis_verification');return missing;
};
BMH.v6DesignSourceUrl=value=>{try{const u=new URL(String(value||''));return u.protocol==='https:'&&!u.username&&!u.password&&(!u.port||u.port==='443')&&/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(u.hostname)&&! /\.(local|internal|test|invalid)$/i.test(u.hostname)&&u.href.length<=1800&&![...u.searchParams.keys()].some(k=>/^(?:key|api_?key|token|password|secret|credential)$/i.test(k))?u.href:'';}catch{return '';}};
BMH.v6DesignList=v=>Array.isArray(v)?v:[];
BMH.v6DesignFit=style=>{
  const c=BMH.designResearchContext(),current=BMH.houseStyle?.();
  return [style.id===c.styleId?'Cùng phong cách đã chọn.':'Phương án thẩm mỹ để đối chiếu với '+(current?.name||'phong cách riêng')+'.','Điểm tham khảo: '+style.description,c.houseType==='shell'?'Nhà thô: cần đối chiếu và giữ hiện trạng.':c.houseType==='new'?'Nhà mới: tham khảo hình khối trước khi triển khai.':'Cần xác nhận loại nhà.',c.site.widthM&&c.site.depthM?'Khung hồ sơ '+c.site.widthM+' × '+c.site.depthM+' m · '+(c.site.floors||'?')+' tầng; mẫu chưa chứng minh vừa đất.':'Cần bổ sung số đo.',c.budget.targetMaxVnd?'Sàng lọc theo ngân sách mục tiêu '+BMH.money(c.budget.targetMaxVnd)+'; cần báo giá riêng.':'Chưa có ngân sách mục tiêu xác nhận.'];
};
BMH.v6DesignLibrary=()=>{
  const current=BMH.designResearchContext().styleId,missing=BMH.v6DesignMissing();
  return [...(BMH.HOUSE_STYLES||[])].sort((a,b)=>Number(b.id===current)-Number(a.id===current)).map(s=>({id:'library-'+s.id,origin:'library',styleId:s.id,title:s.name,claims:[],fitReasons:BMH.v6DesignFit(s),missingCriteria:missing,limitations:['Minh họa hình khối BMH, không phải mẫu đã đo hoặc có báo giá.',s.materials,'Phong cách, vật liệu và mặt bằng dự án vẫn theo lựa chọn hiện tại.'],sources:[],searchedAt:null}));
};
BMH.v6DesignOptions=()=>{
  const st=BMH.v6DesignResearch,current=BMH.designResearchProfileKey(),r=st.key===current?st.result:null;
  const researched=BMH.v6DesignList(r?.options).slice(0,6).map(o=>({...o,origin:'research',sources:BMH.v6DesignList(r.sources),searchedAt:r.searchedAt||null}));
  return [...researched,...BMH.v6DesignLibrary()];
};
BMH.v6RunDesignResearch=()=>{
  const st=BMH.v6DesignResearch,p=BMH.state.project;
  if(st.inflight)return st.inflight;
  const notes=BMH.$('#aiStartPrompt');if(notes){BMH.v6.ideaDraft=String(notes.value||'').slice(0,1000);p.briefIdea=BMH.v6.ideaDraft;BMH.save();}
  const key=BMH.designResearchProfileKey(),now=Date.now();
  if(st.key===key&&st.result?.searchedAt&&st.cacheUntil>now){BMH.toast('Đang dùng kết quả đã tìm cho hồ sơ này.');return Promise.resolve(st.result);}
  if(now-st.attempts.start>=600000)st.attempts={start:now,count:0};
  if(st.blockedUntil>now||st.attempts.count>=3){st.error='Đã dừng nghiên cứu do quyền, quota hoặc giới hạn lượt. Thư viện BMH vẫn chọn được.';BMH.render({preserveScroll:true});return Promise.resolve();}
  st.attempts.count++;
  st.key=key;st.loading=true;st.error='';st.result=null;BMH.render({preserveScroll:true});
  const promise=(async()=>{
    try{const result=await BMH.designResearchCall(BMH.designResearchContext());if(['quota','denied','quota_or_permission_blocked','call_limit'].includes(result?.status))st.blockedUntil=Date.now()+900000;if(BMH.state.project!==p||BMH.designResearchProfileKey()!==key)return;st.result=result;st.cacheUntil=result?.searchedAt?Date.now()+900000:0;return result;}
    catch(err){if(BMH.state.project===p&&BMH.designResearchProfileKey()===key)st.error=err.message||'Chưa nghiên cứu được. Thư viện vẫn chọn được.';}
    finally{st.loading=false;st.inflight=null;BMH.render({preserveScroll:true});}
  })();st.inflight=promise;return promise;
};
BMH.v6SelectDesignReference=id=>{
  const option=BMH.v6DesignOptions().find(o=>o.id===id);if(!option)return false;
  const p=BMH.state.project,copy=structuredClone(option);
  copy.sources=BMH.v6DesignList(copy.sources).map(s=>({id:String(s.id||'').slice(0,60),title:String(s.title||'Nguồn').slice(0,180),url:BMH.v6DesignSourceUrl(s.url)})).filter(s=>s.url).slice(0,18);
  p.brief=p.brief||{};p.brief.userRequirements=p.brief.userRequirements||{};
  // userRequirements is already a persisted dynamic field; no state-schema change is needed.
  p.brief.userRequirements.designReference={...copy,contextKey:BMH.designResearchProfileKey(),selectedAt:new Date().toISOString()};
  if(p.designEvidence){
    const sources=copy.sources.length?copy.sources:[{url:null,title:'Thư viện hình khối BMH'}];
    for(const source of sources)p.designEvidence.research.push({id:BMH.uid('research-evidence'),kind:'design-reference',sourceUrl:source.url,sourceTitle:source.title,publisher:copy.origin==='library'?'BMH':null,retrievedAt:copy.searchedAt||null,effectiveAt:null,scope:{contextKey:BMH.designResearchProfileKey()},sourceType:copy.origin==='library'?'library':'ai',verifiedState:copy.origin==='library'?'provided':'cited',value:{referenceId:copy.id,styleId:copy.styleId,title:copy.title,reasons:copy.fitReasons,constraints:copy.limitations,selectedAsIntent:true},unit:null,notes:'Mẫu tham chiếu; không thay số đo, vật liệu hoặc ngân sách.'});
  }
  BMH.save();BMH.render({preserveScroll:true});BMH.toast('Đã lưu mẫu tham chiếu thiết kế.');return true;
};
BMH.v6DesignEvidenceHtml=option=>{
  const esc=BMH.v6Esc,sources=BMH.v6DesignList(option.sources).slice(0,18),link=s=>{const url=BMH.v6DesignSourceUrl(s.url);return url?'<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">'+esc(s.title||'Nguồn web')+' ↗</a>':'';};
  const claims=BMH.v6DesignList(option.claims).slice(0,4).map(c=>{
    const evidence=sources.filter(s=>BMH.v6DesignList(c.sourceIds).includes(s.id)&&BMH.v6DesignSourceUrl(s.url));
    return '<li>'+esc(c.text||'')+' <small>'+(evidence.length?evidence.map(link).join(' · '):'Chưa có bằng chứng riêng xác minh kết luận này.')+'</small></li>';
  }).join('');
  const date=option.searchedAt&&Number.isFinite(Date.parse(option.searchedAt))?new Date(option.searchedAt).toLocaleString('vi-VN'):'Chưa tìm Google';
  return '<p><small>Ngày tìm: '+esc(date)+' · không phải ngày xuất bản</small></p>'+(claims?'<ul>'+claims+'</ul>':'<p>Thư viện minh họa BMH · chưa có nguồn web xác minh.</p>')
    +'<p>'+BMH.v6DesignList(option.fitReasons).slice(0,6).map(esc).join(' ')+'</p><small>Cần xác nhận: '+BMH.v6DesignList(option.missingCriteria).map(k=>esc(BMH.v6DesignMissingLabels[k]||k)).join(' · ')+'</small><p>'+BMH.v6DesignList(option.limitations).slice(0,5).map(esc).join(' ')+'</p>';
};
BMH.v6DesignResearchActionHtml=()=>'<button type="button" class="step01-analyze" data-s1-research '+(BMH.v6DesignResearch.loading?'disabled':'')+'>'+(BMH.v6DesignResearch.loading?'◌ Đang tìm mẫu có nguồn…':'✦ Tìm mẫu theo hồ sơ →')+'</button>';
BMH.v6DesignResearchHtml=()=>{
  const st=BMH.v6DesignResearch,c=BMH.designResearchContext(),esc=BMH.v6Esc,key=BMH.designResearchProfileKey(),stale=st.key&&st.key!==key,r=stale?null:st.result;
  const selected=BMH.state.project.brief?.userRequirements?.designReference,all=BMH.v6DesignOptions();
  const filtered=all.filter(o=>(st.filter==='all'||o.origin===st.filter)&&(!st.styleFilter||o.styleId===st.styleFilter)),shown=BMH.v6.ideaExpanded?filtered:filtered.slice(0,6);
  const notice=stale?'Hồ sơ hoặc tệp đã đổi; kết quả tìm cũ không còn áp dụng.':st.loading?'Đang nghiên cứu. Bạn vẫn chọn được thư viện BMH.':st.error||r?.notice||'Chưa tìm Google. 24 phong cách BMH có thể chọn ngay.';
  const missing=BMH.v6DesignMissing().map(k=>esc(BMH.v6DesignMissingLabels[k])).join(' · ');
  const program=c.floorProgram.map(f=>'T'+(f.floor+1)+': '+(f.bedrooms??'?')+' PN, '+(f.bathrooms??'?')+' WC'+(f.living?', khách':'')+(f.kitchen?', bếp':'')+(f.office?', làm việc':'')+(f.garage?', gara':'')+(f.worship!=='none'?', thờ '+f.worship:'')+(f.extraRooms.length?', '+f.extraRooms.map(q=>(q.count??'?')+' '+q.type).join(', '):'')).join(' · ');
  return '<section class="v6-card step01-ideas" data-s1-research-panel><div class="step01-section-head"><div>'+BMH.v6PanelTitle('⌂','Mẫu nhà theo hồ sơ','Chọn trực tiếp để lưu ý định/tham chiếu thiết kế.')+'</div><button type="button" data-s1-ideas-toggle>'+(BMH.v6.ideaExpanded?'Thu gọn ↑':'Xem tất cả →')+'</button></div>'
    +'<p>'+esc(c.houseType==='shell'?'Nhà thô':c.houseType==='new'?'Nhà mới':'Loại nhà chưa xác nhận')+' · '+esc(c.site.widthM??'?')+' × '+esc(c.site.depthM??'?')+' m · '+esc(c.site.floors??'?')+' tầng · '+esc(BMH.state.project.style||'Phong cách chưa xác nhận')+'</p><p>'+esc(program||'Công năng từng tầng chưa xác nhận')+'</p>'
    +'<p><small>'+c.references.imageCount+' ảnh · '+c.references.videoCount+' video · '+c.references.pdfCount+' PDF'+(c.references.analysis.available?' · Có phân tích hiện có, cần đối chiếu.':' · Chưa có phân tích tệp.')+' Nội dung riêng trong tệp không gửi tới Search.</small></p>'
    +'<p><small>Cần xác nhận: '+(missing||'Đối chiếu mẫu với số đo và báo giá')+'. Không suy số đo từ ảnh.</small></p><p role="status">'+esc(notice)+'</p>'
    +(selected?'<details open><summary>Đã chọn tham chiếu: '+esc(selected.title||'Mẫu')+'</summary>'+(selected.contextKey!==key?'<p>Tham chiếu được giữ từ hồ sơ trước; cần đối chiếu lại với hồ sơ hiện tại.</p>':'')+BMH.v6DesignEvidenceHtml(selected)+'</details>':'')
    +'<div class="v6-input-row"><label>Nguồn mẫu<select data-s1-research-filter="filter">'+[['all','Tất cả'],['library','Thư viện BMH'],['research','Kết quả Search']].map(([id,name])=>'<option value="'+id+'" '+(st.filter===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label><label>Phong cách tham chiếu<select data-s1-research-filter="styleFilter"><option value="">Tất cả phong cách</option>'+(BMH.HOUSE_STYLES||[]).map(s=>'<option value="'+esc(s.id)+'" '+(st.styleFilter===s.id?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></label></div>'
    +'<div class="house-style-grid">'+shown.map(o=>{
      const s=(BMH.HOUSE_STYLES||[]).find(s=>s.id===o.styleId)||BMH.houseStyle?.(),active=selected?.id===o.id&&(o.origin==='library'||selected.contextKey===key),preview=BMH.v6DesignList(o.claims).find(c=>c.verified);
      return '<article><button type="button" class="house-style-card '+(active?'selected':'')+'" data-s1-reference="'+esc(o.id)+'" aria-pressed="'+active+'">'+(s&&v6ReferenceIllustration?v6ReferenceIllustration(s):'<span>⌂</span>')+'<span><b>'+esc(o.title)+(active?' ✓':'')+'</b><small>'+(o.origin==='research'?'Tham chiếu Search · xem bằng chứng':'Minh họa hình khối BMH')+'</small><small>'+esc(preview?.text||s?.description||'Đối chiếu theo hồ sơ')+'</small><small>'+esc(BMH.v6DesignList(o.fitReasons)[0]||'Đối chiếu theo hồ sơ')+'</small></span></button><details><summary>Lý do, nguồn & giới hạn</summary>'+BMH.v6DesignEvidenceHtml(o)+'</details></article>';
    }).join('')+'</div>'+(shown.length?'':'<p>Chưa có mẫu cho bộ lọc này. Chọn Thư viện BMH hoặc Tất cả để tiếp tục.</p>')
    +'<p><small>Chọn mẫu chỉ lưu tham chiếu. Đất, mặt bằng, phong cách, vật liệu và ngân sách tiếp tục theo hồ sơ. Search không cấp quyền tải hoặc bán ảnh.</small></p></section>';
};
// The later finishing screen replaces screen1; add the same panel only inside that Tab 1 view.
BMH.v6MountShellResearch=()=>{
  const host=document.querySelector('.finish-studio');if(!host||host.querySelector('[data-s1-research-panel]'))return;
  const section=document.createElement('section');section.innerHTML=BMH.v6DesignResearchActionHtml()+BMH.v6DesignResearchHtml();host.append(section);
};

BMH.screen1=()=>{
  const p=BMH.state.project,e=BMH.estimate(),review=BMH.designReview(),scan=BMH.scanExisting?.(),scanBuilding=scan?.building||{},brief=BMH.v6.briefResult?.brief||{};
  const ready=!!BMH.aiConfigured?.(),climate=BMH.regionProfile(p.site),structuredMembers=BMH.v6Household().length,members=Math.max(structuredMembers,Number(p.household?.requestedSize)||0),needs=BMH.householdNeeds?.()||{},projectedMembers=Math.max(0,members-structuredMembers),familyDetail=projectedMembers?structuredMembers+' hồ sơ chi tiết + '+projectedMembers+' chưa khai báo':structuredMembers+' hồ sơ chi tiết';
  const aiStyle=BMH.v6Esc(p.style||brief.style||scanBuilding.style||'Hiện đại, tối giản');
  const floors=Number(p.site.floors)||Number(brief.floors||scanBuilding.estimated_floors)||2;
  const area=BMH.planArea(),budget=Number(p.finance?.targetBudget)||0;
  const bedrooms=Number(needs.bedrooms)||Number(brief.bedrooms)||Math.max(2,Math.round(members*.7));
  const uploads=Array.isArray(BMH.v6.uploads)?BMH.v6.uploads:[];
  const currentUpload=BMH.v6.upload;
  const referenceStyle=BMH.houseStyle?.()||(BMH.HOUSE_STYLES||[])[0],referenceVisual=referenceStyle&&v6ReferenceIllustration?v6ReferenceIllustration(referenceStyle):'';
  const heroSlides=[
    currentUpload?.dataUrl?{img:currentUpload.dataUrl,pos:'center center',kicker:'TỆP CỦA BẠN',title:'Bắt đầu từ chính hình ảnh bạn vừa chọn.',copy:'Tệp đã vào Step 1. Nếu AI online, hệ thống sẽ phân tích nội dung và tạo brief.'}:null,
    {visual:referenceVisual,kicker:'MINH HỌA BMH',title:aiStyle+' · '+floors+' tầng theo hồ sơ',copy:'Minh họa hình khối, không phải bản vẽ của dự án. Số đo và dữ kiện chưa xác nhận cần được đối chiếu riêng.'},
    {visual:referenceVisual,kicker:'TIÊU CHÍ THEO HỒ SƠ',title:'Đối chiếu mẫu với khu đất và ngân sách mục tiêu',copy:BMH.v6Esc('Đất '+BMH.num(p.site.width)+'×'+BMH.num(p.site.depth)+'m theo hồ sơ · '+(p.finance?.targetBudget>0?'ngân sách mục tiêu '+BMH.money(p.finance.targetBudget):'ngân sách mục tiêu chưa xác nhận'))}
  ].filter(Boolean);
  const idx=BMH.clamp(Number(BMH.v6.s1HeroIndex)||0,0,Math.max(0,heroSlides.length-1)),slide=heroSlides[idx];
  const fit=Math.max(0,Math.min(100,Math.round((review.comfort+review.function+review.budget)/3)));
  const feasibility=e.gap>=0&&review.overall>=78?'Cao':e.gap>=-e.budget*.08?'Khá':'Cần tối ưu';
  const months=Math.max(5,Math.min(14,Math.round(3.5+p.site.floors*1.5)));
  const result=BMH.v6.briefResult;
  const summary=result?.summary||'Hồ sơ và phân tích đã lưu được giữ để đối chiếu mẫu. Kết quả tìm chỉ làm tham chiếu; cần xác nhận số đo, công năng và báo giá.';
  const priorities=(result?.brief?.priorities||[]).slice(0,4);
  const aiStatus=BMH.v6.aiStatus||{};
  const sourceCards=uploads.map(x=>{
    const visual=x.dataUrl?'<img src="'+x.dataUrl+'" alt="">':x.kind==='video'&&x.previewUrl?'<video src="'+BMH.v6Esc(x.previewUrl)+'" muted preload="metadata" playsinline></video>':'<div class="step01-file-icon">'+(x.kind==='video'?'▶':x.kind==='pdf'?'PDF':'DOC')+'</div>';
    const typeLabel=x.kind==='image'?'Ảnh':x.kind==='video'?'Video':x.kind==='pdf'?'PDF':'Tệp';
    return '<article class="step01-source-card uploaded">'+visual+'<button class="step01-remove-source" data-s1-remove="'+BMH.v6Esc(x.id)+'" aria-label="Xóa tài liệu">×</button><span><b>'+BMH.v6Esc(x.name)+'</b><small>'+typeLabel+' · '+BMH.v6Esc(BMH.v6FileSize(x.size))+' · '+BMH.v6Esc(x.status||'Đã nhận tệp')+'</small></span></article>';
  }).join('');
  return '<div class="v6-s1 step01-locked">'
   +'<section class="v6-s1-left v6-card step01-start">'
      +BMH.v6Title(1,'AI HOME VISION','Khám phá ý tưởng','Dùng hồ sơ đã lưu để đối chiếu nhiều mẫu. Số đo và dữ kiện chưa xác nhận tiếp tục giữ trạng thái cần kiểm tra.')
      +'<label class="step01-drop" for="step1UploadAll" role="button" tabindex="0"><i>↥</i><b>Kéo thả file vào đây hoặc chọn từ thiết bị</b><span>JPG · PNG · WEBP · MP4 · MOV · PDF</span></label>'
      +'<div class="step01-upload-actions"><label for="step1UploadVideo" role="button" tabindex="0"><i>▶</i><span>Upload video</span></label><label for="step1UploadImage" role="button" tabindex="0"><i>▧</i><span>Upload ảnh</span></label><label for="step1UploadPdf" role="button" tabindex="0"><i class="pdf">PDF</i><span>Upload PDF</span></label><button data-s1-focus-prompt><i>▤</i><span>Nhập ý tưởng</span></button></div>'
      +'<label class="step01-prompt"><i>✎</i><textarea id="aiStartPrompt" maxlength="1000" rows="4" aria-label="Ghi chú thiết kế riêng" placeholder="Ghi chú thiết kế riêng; nội dung này được lưu trong dự án và không gửi tới Google Search.">'+BMH.v6Esc(BMH.v6.ideaDraft||p.briefIdea||'')+'</textarea><em><span id="step01PromptCount">'+String((BMH.v6.ideaDraft||p.briefIdea||'').length)+'</span>/1000</em></label>'
      +BMH.v6DesignResearchActionHtml()
      +'<div class="step01-connection '+(ready?'online':'offline')+'"><i>'+(ready?'✓':'!')+'</i><div><b>'+(ready?'AI server đã cấu hình':'AI server chưa cấu hình')+'</b><span>'+(ready?'Search chỉ chạy khi server cho phép quyền và quota; danh sách model không chứng minh quota.':(aiStatus.error?BMH.v6Esc(aiStatus.error):'Thư viện 24 phong cách vẫn chọn được.'))+'</span></div></div>'
      +(BMH.v6.briefNotice?'<div class="step01-notice">'+BMH.v6Esc(BMH.v6.briefNotice)+'</div>':'')
      +(BMH.v6.briefError?'<div class="step01-error">'+BMH.v6Esc(BMH.v6.briefError)+'</div>':'')
    +'</section>'

   +'<section class="v6-s1-hero step01-hero">'
      +(slide.img?'<img src="'+BMH.v6Esc(slide.img)+'" alt="Tệp tham khảo của khách" style="object-position:'+BMH.v6Esc(slide.pos||'center center')+'">':'<div class="step01-reference-illustration" style="position:absolute;inset:0">'+slide.visual.replace('<svg ','<svg width="100%" height="100%" preserveAspectRatio="xMidYMid slice" ')+'</div>')+'<div class="v6-image-shade"></div>'
      +'<div class="step01-hero-quote"><span>'+slide.kicker+'</span><h2>'+slide.title+'</h2><p>'+slide.copy+'</p><div class="step01-hero-meta"><em>'+BMH.v6Esc(p.site.district||p.site.province)+'</em><em>'+floors+' tầng</em><em>'+members+' người</em><em>'+bedrooms+' PN</em></div></div>'
      +'<div class="step01-hero-badges">'
        +'<article><i>⌂</i><span><small>Số tầng ước tính</small><b>~ '+floors+' tầng</b></span></article>'
        +'<article><i>◇</i><span><small>Phong cách</small><b>'+aiStyle+'</b></span></article>'
        +'<article><i>◉</i><span><small>Ngân sách mục tiêu</small><b>'+(budget>0?BMH.money(budget):'Chưa xác nhận')+'</b></span></article>'
        +'<article><i>♙</i><span><small>Phù hợp gia đình</small><b>'+members+' thành viên · '+bedrooms+' PN</b></span></article>'
      +'</div>'
      +'<button class="step01-arrow prev" data-s1-hero="-1">←</button><button class="step01-arrow next" data-s1-hero="1">→</button>'
      +'<div class="step01-dots">'+heroSlides.map((_,i)=>'<button data-s1-dot="'+i+'" class="'+(i===idx?'active':'')+'"></button>').join('')+'</div>'
    +'</section>'

   +'<aside class="v6-s1-right v6-card step01-ai">'
      +'<div class="step01-ai-head"><div><i>✦</i><span><b>AI hiểu hồ sơ nền</b><small>'+(result?'Concept vừa được tạo từ hồ sơ nền và cảm hứng của bạn.':'Vị trí, ngân sách và gia đình đã có; chờ AI bổ sung hướng thiết kế.')+'</small></span></div><em class="'+(result&&BMH.v6.briefProvider==='local-fallback'?'warn':ready?'ok':'warn')+'">'+(result&&BMH.v6.briefProvider==='local-fallback'?'Dự phòng':ready?'Sẵn sàng':'Chưa cấu hình')+'</em></div>'
      +'<div class="step01-ai-summary"><b>'+(result?BMH.v6Esc(result.headline||'Concept ban đầu đã sẵn sàng'):'Hồ sơ dùng để đối chiếu mẫu')+'</b><p>'+BMH.v6Esc(summary)+'</p>'+(priorities.length?'<div>'+priorities.map(x=>'<span>'+BMH.v6Esc(x)+'</span>').join('')+'</div>':'')+'</div>'
      +'<div class="step01-ai-facts">'
        +'<article><i>⌂</i><span><small>Phong cách</small><b>'+aiStyle+'</b></span><button data-s1-edit="style" title="Chỉnh phong cách">✎</button></article>'
        +'<article><i>▱</i><span><small>Số tầng (ước tính)</small><b>'+floors+' tầng</b></span><button data-s1-edit="floors" title="Chỉnh số tầng">✎</button></article>'
        +'<article><i>▣</i><span><small>Diện tích kế hoạch</small><b>~ '+BMH.num(area)+' m²</b></span><button data-s1-edit="area" title="Chỉnh mặt bằng">✎</button></article>'
        +'<article><i>◉</i><span><small>Ngân sách mục tiêu</small><b>'+(budget>0?BMH.money(budget):'Chưa xác nhận')+'</b></span><button data-s1-edit="budget" title="Chỉnh tài chính">✎</button></article>'
        +'<article><i>☀</i><span><small>Khí hậu vùng</small><b>'+BMH.v6Esc(climate.climate)+'</b></span><button data-s1-edit="climate" title="Chỉnh vị trí và khí hậu">✎</button></article>'
        +'<article class="'+(projectedMembers?'needs-detail':'')+'"><i>♙</i><span><small>Hồ sơ gia đình</small><b>'+members+' thành viên</b><em>'+familyDetail+'</em></span><button data-s1-edit="household" title="Chỉnh hồ sơ gia đình">✎</button></article>'
      +'</div>'
      +'<div class="step01-next"><i>☼</i><div><small>Gợi ý bước tiếp theo</small><b>'+(result?'Concept đã có. Tiếp tục sang khảo sát khu đất và vị trí để khóa bối cảnh thực tế.':'Xem hình ảnh, tải tài liệu tham khảo hoặc để AI tự tạo concept từ hồ sơ nền.')+'</b></div><button data-nav="2">→</button></div>'
    +'</aside>'

   +'<section class="v6-card step01-reference">'
      +'<div class="step01-section-head"><div>'+BMH.v6PanelTitle('▧','Nguồn tham chiếu','Ảnh, video và PDF bạn đưa vào Step 1.')+'</div><label for="step1UploadAll" role="button" tabindex="0">Thêm tài liệu ＋</label></div>'
      +'<div class="step01-source-grid">'+sourceCards
        +(uploads.length<4?'<label class="step01-add-source" for="step1UploadAll" role="button" tabindex="0"><i>＋</i><span>Thêm tài liệu</span></label>':'')
      +'</div>'
    +'</section>'

   +BMH.v6DesignResearchHtml()

   +'<section class="v6-card step01-prelim">'
      +'<div class="step01-section-head"><div>'+BMH.v6PanelTitle('▥','Kết quả phân tích sơ bộ',result?'Kết hợp concept AI và rule engine hiện tại.':'Rule engine hiện tại; không cần gọi AI để xem chi tiết.')+'</div><button data-s1-prelim-toggle>'+(BMH.v6.prelimExpanded?'Thu gọn ↑':'Xem chi tiết →')+'</button></div>'
      +'<div class="step01-prelim-grid">'
        +'<article><i class="ring" style="--p:'+fit+'"><b>'+fit+'%</b></i><span><small>Độ phù hợp nhu cầu</small><b>'+(fit>=85?'Rất cao':fit>=75?'Khá cao':'Cần chỉnh')+'</b></span></article>'
        +'<article><i class="bars">▮▮▮</i><span><small>Mức độ khả thi</small><b>'+feasibility+'</b></span></article>'
        +'<article><i>◉</i><span><small>Chi phí ước tính</small><b>'+BMH.money(e.total)+'</b></span></article>'
        +'<article><i>◷</i><span><small>Thời gian dự kiến</small><b>~ '+months+' tháng</b></span></article>'
      +'</div>'
      +(BMH.v6.prelimExpanded?'<div class="step01-prelim-detail"><article><small>Công năng</small><b>'+review.function+'/100</b><span>Bố trí và khả năng sử dụng hiện tại.</span></article><article><small>Tiện nghi</small><b>'+review.comfort+'/100</b><span>Mức phù hợp với nhu cầu sinh hoạt.</span></article><article><small>Thông gió</small><b>'+review.ventilation+'/100</b><span>Khả năng thông thoáng theo rule engine.</span></article><article><small>Ngân sách</small><b>'+review.budget+'/100</b><span>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' dự phòng.':'Đang vượt '+BMH.money(Math.abs(e.gap))+' so với ngân sách.')+'</span></article></div>':'')
    +'</section>'
   +'</div>';
};

BMH.v64BankHue=b=>{
  const s=String(b?.id||b?.name||'BANK');let n=0;
  for(let i=0;i<s.length;i++)n=(n*31+s.charCodeAt(i))%360;
  return n;
};
BMH.v64BankInitials=b=>{
  const words=String(b?.name||'BANK').replace(/[^A-Za-z0-9 ]/g,' ').trim().split(/\s+/).filter(Boolean);
  const short=(words.length>1?words.map(x=>x[0]).join(''):words[0]||'BK').slice(0,3).toUpperCase();
  return short;
};
BMH.v65Norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
BMH.v65LoadBankLogos=async()=>{
  if(BMH.v6.bankLogosLoaded||BMH.v6.bankLogosLoading)return;
  BMH.v6.bankLogosLoading=true;
  try{
    const r=await fetch('/api/bank-directory'),data=await r.json();
    const rows=Array.isArray(data?.data)?data.data:[],logos={...BMH.v6.bankLogos};
    for(const b of BMH.BANKS){
      if(b.img){logos[b.id]=b.img;continue;}
      const id=BMH.v65Norm(b.id),name=BMH.v65Norm(b.name),full=BMH.v65Norm(b.fullName);
      let best=null,bestScore=0;
      for(const row of rows){
        const code=BMH.v65Norm(row.code),short=BMH.v65Norm(row.shortName),legal=BMH.v65Norm(row.name);let score=0;
        if(code&&code===id)score+=120;
        if(short&&short===name)score+=110;
        if(legal&&full&&(legal===full||legal.includes(full)||full.includes(legal)))score+=90;
        if(short&&name&&Math.min(short.length,name.length)>=3&&(short.includes(name)||name.includes(short)))score+=55;
        if(code&&name&&Math.min(code.length,name.length)>=3&&(code.includes(name)||name.includes(code)))score+=40;
        if(score>bestScore){bestScore=score;best=row;}
      }
      if(best?.logo&&bestScore>=40)logos[b.id]=best.logo;
    }
    BMH.v6.bankLogos=logos;BMH.v6.bankLogosLoaded=true;
  }catch(err){console.warn('[BMH bank logos]',err);}
  finally{BMH.v6.bankLogosLoading=false;if(BMH.state.ui.step===8)BMH.render({preserveScroll:true});}
};
BMH.v6BankMark=b=>{
  const logo=b?.img||BMH.v6.bankLogos?.[b?.id]||'';
  if(logo)return '<img class="v64-bank-real-logo" src="'+BMH.v6Esc(logo)+'" alt="'+BMH.v6Esc(b.name)+'">';
  const hue=BMH.v64BankHue(b),short=BMH.v64BankInitials(b);
  return '<svg class="v64-bank-vector-logo" viewBox="0 0 120 48" role="img" aria-label="'+BMH.v6Esc(b?.name||'Ngân hàng')+'">'
    +'<rect x="1" y="1" width="118" height="46" rx="12" fill="hsl('+hue+' 42% 96%)" stroke="hsl('+hue+' 26% 84%)"/>'
    +'<circle cx="24" cy="24" r="14" fill="hsl('+hue+' 58% 40%)"/>'
    +'<path d="M17 26h14M18.5 21.5h11M20 17h8M20 30.5h8" stroke="#fff" stroke-width="2.3" stroke-linecap="round"/>'
    +'<text x="45" y="28" fill="hsl('+hue+' 46% 28%)" font-family="Arial, sans-serif" font-size="14" font-weight="800">'+BMH.v6Esc(short)+'</text>'
    +'</svg>';
};
BMH.v65DateLabel=value=>{
  const raw=String(value||'').trim();if(!raw)return '';
  const d=new Date(raw.length===10?raw+'T12:00:00Z':raw);if(Number.isNaN(d.getTime()))return raw;
  return 'ngày '+String(d.getDate()).padStart(2,'0')+' tháng '+String(d.getMonth()+1).padStart(2,'0')+' năm '+d.getFullYear();
};
BMH.v65SafeCitations=list=>(Array.isArray(list)?list:[]).filter(x=>/^https:\/\//i.test(String(x?.url||''))).slice(0,3);
BMH.v65RefreshBankRate=async(bank,{force=false,silent=false}={})=>{
  if(!bank?.id)return false;
  if(!BMH.cloud?.config?.geminiConfigured)await BMH.v6RefreshAIConfig?.({force:false,render:false});
  if(!BMH.cloud?.config?.geminiConfigured)return false;
  const f=BMH.state.project.finance,meta=f.rateMeta||{},now=Date.now(),fetched=Date.parse(meta.fetchedAt||'')||0,last=BMH.v6.bankRateLastAttempt||{};
  if(BMH.v6.bankRateLoading&&BMH.v6.bankRateBankId===bank.id)return false;
  if(!force&&meta.bankId===bank.id&&fetched&&now-fetched<24*60*60*1000)return false;
  if(!force&&last.bankId===bank.id&&now-Number(last.at||0)<10*60*1000)return false;
  const requestId=BMH.v6.bankRateRequestId=(BMH.v6.bankRateRequestId||0)+1;
  BMH.v6.bankRateLoading=true;BMH.v6.bankRateBankId=bank.id;BMH.v6.bankRateError='';BMH.v6.bankRateLastAttempt={bankId:bank.id,at:now};
  if(BMH.state.ui.step===8)BMH.render({preserveScroll:true});
  try{
    const res=await (BMH.aiFetch||fetch)('/api/bank-rate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bank_id:bank.id,bank_name:bank.name,full_name:bank.fullName||bank.name,swift:bank.swift||'',force})});
    let data={};try{data=await res.json();}catch(_){}
    if(requestId!==BMH.v6.bankRateRequestId||BMH.state.project.finance.bank!==bank.id)return false;
    if(!res.ok)throw new Error(data?.error||('HTTP '+res.status));
    const x=data.result||{},verified=x.verified===true,intro=Math.max(0,Math.min(30,Number(x.intro_rate_pct)||0)),post=Math.max(0,Math.min(30,Number(x.post_rate_pct)||0)),months=Math.max(0,Math.min(120,Number(x.intro_months)||0));
    f.rateMeta={
      bankId:bank.id,status:verified?'verified':'unverified',verified,
      product:String(x.product||'').slice(0,180),sourceDate:String(x.source_date||'').slice(0,40),
      fetchedAt:String(data.fetched_at||new Date().toISOString()),provider:String(data.provider||'gemini').slice(0,40),model:String(data.model||'').slice(0,120),
      introRate:intro,postRate:post,promoMonths:months,citations:BMH.v65SafeCitations(data.citations),note:String(x.note||'').slice(0,400)
    };
    if(verified){
      if(intro>0)f.introRate=intro;
      if(post>0)f.postRate=post;
      if(months>0)f.promoMonths=months;
    }
    BMH.save();
    if(!silent)BMH.toast(verified?'Gemini đã cập nhật lãi suất '+bank.name+' từ nguồn web công khai.':'Gemini chưa tìm đủ nguồn để xác minh lãi suất '+bank.name+'.');
    return verified;
  }catch(err){
    if(requestId!==BMH.v6.bankRateRequestId||BMH.state.project.finance.bank!==bank.id)return false;
    BMH.v6.bankRateError=err.message||String(err);
    if(!silent)BMH.toast('Chưa cập nhật được lãi suất ngân hàng: '+BMH.v6.bankRateError);
    return false;
  }finally{
    if(requestId===BMH.v6.bankRateRequestId){BMH.v6.bankRateLoading=false;BMH.v6.bankRateBankId='';if(BMH.state.ui.step===8)BMH.render({preserveScroll:true});}
  }
};

BMH.v64BankOption=(b,f)=>{
  const active=f.bank===b.id,hasRate=BMH.bankHasPreset?.(b);
  return '<button type="button" data-bank="'+BMH.v6Esc(b.id)+'" data-bank-option data-bank-search="'+BMH.v6Esc([b.name,b.fullName,b.id,b.swift].join(' ').toLowerCase())+'" class="v64-bank-option '+(active?'active':'')+'">'
    +'<div>'+BMH.v6BankMark(b)+'</div>'
    +'<span><b>'+BMH.v6Esc(b.name)+'</b><small>'+BMH.v6Esc(BMH.bankCategoryLabel?.(b)||'Ngân hàng')+'</small></span>'
    +'<em class="'+(hasRate?'ready':'waiting')+'">'+(hasRate?'Có kịch bản thử':'Chờ nguồn lãi suất')+'</em>'
    +'<i>'+(active?'✓':'')+'</i>'
    +'</button>';
};

BMH.screen2=()=>{
  const f=BMH.state.project.finance,s=BMH.financeSummary(),e=BMH.estimate(),income=Number(f.income)||0,hasRateScenario=Number(f.postRate)>0&&Number(f.introRate)>0;
  const pct=income&&hasRateScenario?Math.round(BMH.clamp(s.dti*100,0,100)):null,active=BMH.BANKS.find(x=>x.id===f.bank)||BMH.BANKS[0];
  const withPreset=BMH.BANKS.filter(b=>BMH.bankHasPreset?.(b)).length;
  const postPayment=BMH.monthlyPayment(f.loan,f.postRate,Math.max(1,f.years*12));
  const promoPayment=BMH.monthlyPayment(f.loan,f.introRate,Math.max(1,f.years*12));
  const stress=[1,2,3].map(d=>{const rate=Number(f.postRate||0)+d,pay=BMH.monthlyPayment(f.loan,rate,Math.max(1,f.years*12)),dti=income?Math.round((pay+Number(f.existingDebt||0))/income*100):null;return {d,rate,pay,dti};});
  const capacity=Math.max(0,Number(s.capacity)||0),loanPct=capacity?Math.round(Number(f.loan||0)/capacity*100):0;
  const ownCapital=Math.max(0,(Number(f.cash)||0)-(Number(f.reserve)||0));
  const missingBeforeLoan=Math.max(0,e.total-ownCapital),remainingGap=Math.max(0,missingBeforeLoan-(Number(f.loan)||0));
  const meta=f.rateMeta||{},metaMatches=meta.bankId===active.id,sourceAge=Date.now()-Date.parse(String(meta.sourceDate||'')+'T00:00:00Z'),sourceFresh=Number.isFinite(sourceAge)&&sourceAge>=0&&sourceAge<=180*86400000;
  const liveVerified=metaMatches&&meta.verified===true&&sourceFresh&&BMH.v65SafeCitations(meta.citations).length>0,rateLoading=BMH.v6.bankRateLoading&&BMH.v6.bankRateBankId===active.id;
  const activeRateStatus=rateLoading?'Gemini đang cập nhật…':liveVerified?'Đã xác minh từ web':!hasRateScenario?'Chưa có lãi suất · hãy nhập kịch bản':metaMatches&&meta.status==='unverified'?'Chưa đủ nguồn xác minh':'Kịch bản thử · chưa xác minh';
  const updateDate=liveVerified?BMH.v65DateLabel(meta.sourceDate):'',rateCitations=metaMatches?BMH.v65SafeCitations(meta.citations):[];
  const bankOptions=BMH.BANKS.map(b=>BMH.v64BankOption(b,f)).join('');
  return '<div class="v6-s2 v63-finance v64-finance">'
   +'<section class="v6-card v6-fin-form v63-fin-input">'
      +BMH.v6Title(8,'TÀI CHÍNH SÂU','Biết giới hạn an toàn trước khi mơ lớn hơn.','Dự toán đã có ở Step 7. Bây giờ đối chiếu tiền đang có, dòng tiền và khoản thiếu hụt để quyết định vay thêm hay quay lại tối ưu thiết kế/vật liệu.')
      +'<div class="v63-fin-hero"><small>NGÂN SÁCH XÂY HIỆN TẠI</small><b>'+BMH.money(e.budget)+'</b><span>Tiền có thể dùng: '+BMH.money(capacity)+' · Vay chiếm '+loanPct+'%</span></div>'
      +'<div class="v68-funding-plan"><b>'+BMH.money(e.total)+'</b><span>Tổng dự toán'+(e.areaSource==='provisional'?' sơ bộ':'')+'</span><i>−</i><b>'+BMH.money(ownCapital)+'</b><span>Tiền tự có dành xây (đã giữ lại quỹ dự phòng '+BMH.money(f.reserve)+')</span><i>=</i><strong>'+BMH.money(missingBeforeLoan)+'</strong><span>Vốn cần bổ sung trước khoản vay</span></div>'
      +(missingBeforeLoan>0?'<button class="v71-fund-button" data-fund-gap>Thử vay đúng phần vốn còn thiếu: '+BMH.money(missingBeforeLoan)+' →</button>':'<p class="v71-fund-note">Tiền tự có đã đủ dự toán hiện tại. Không cần giả định thêm khoản vay.</p>')
      +(Number(f.loan)>missingBeforeLoan?'<p class="v71-fund-note">Khoản vay đang nhập cao hơn phần thiếu '+BMH.money(Number(f.loan)-missingBeforeLoan)+'. Cân nhắc giảm để bớt áp lực trả nợ.</p>':'')
      +(e.areaSource==='provisional'?'<p class="v68-fin-warning">Mặt bằng chưa đủ để chốt diện tích. Hãy hoàn thiện Bước 4 và kiểm tra lại Bước 7 trước khi quyết định khoản vay.</p>':'')
      +'<div class="v6-fields v63-fin-fields">'
        +[['Thu nhập / tháng','project.finance.income',f.income],['Chi phí sinh hoạt','project.finance.living',f.living],['Tiền hiện có','project.finance.cash',f.cash],['Quỹ dự phòng','project.finance.reserve',f.reserve],['Nợ trả mỗi tháng','project.finance.existingDebt',f.existingDebt],['Khoản vay mong muốn','project.finance.loan',f.loan]].map(x=>'<label><span>'+x[0]+'</span><div><input data-path="'+x[1]+'" data-scale="1000000" type="number" value="'+Number(x[2]||0)/1000000+'"><em>triệu</em></div></label>').join('')
        +'<label><span>Thời hạn vay</span><div><input data-path="project.finance.years" type="number" min="1" max="35" value="'+f.years+'"><em>năm</em></div></label>'
      +'</div>'
      +'<button class="v6-primary full" data-ai-direct="cost">✦ AI phân tích khả năng tài chính →</button>'
   +'</section>'

   +'<section class="v6-card v6-fin-center v63-fin-dashboard">'
      +'<div class="v63-fin-top">'
        +'<div class="v6-ring v63-dti-ring" style="--p:'+(pct||0)+'"><div><b>'+(pct===null?'—':pct+'%')+'</b><span>DTI mô phỏng</span><small>'+(pct===null?'Chưa đủ dữ liệu':pct<=36?'Vùng kiểm soát':pct<=45?'Cần thận trọng':'Áp lực cao')+'</small></div></div>'
        +'<div class="v63-afford"><span>KHẢ NĂNG CHI TRẢ</span><h2>'+(pct===null?(hasRateScenario?'Nhập thu nhập để bắt đầu':'Chưa có lãi suất để tính dòng tiền'):pct<=36?'Dòng tiền đang trong vùng kiểm soát':pct<=45?'Nên giảm áp lực vay':'Áp lực trả nợ đang cao')+'</h2><p>DTI dùng khoản trả nợ đỉnh hiện tại. Đây là mô phỏng tài chính, không phải phê duyệt tín dụng.</p><div class="v6-kpi-row">'+BMH.v6Kpi('Khoản trả đỉnh',hasRateScenario?BMH.money(s.peak):'—')+BMH.v6Kpi('Còn lại / tháng',hasRateScenario?BMH.money(s.remainder):'—')+BMH.v6Kpi('Quỹ dự phòng',BMH.money(f.reserve))+BMH.v6Kpi('Khoản vay',BMH.money(f.loan))+'</div></div>'
      +'</div>'
      +'<div class="v63-selected-bank v64-selected-bank">'
        +'<div class="v64-selected-row">'
          +'<details class="v64-bank-picker">'
            +'<summary><div class="v64-picker-logo">'+BMH.v6BankMark(active)+'</div><span><small>NGÂN HÀNG ĐANG CHỌN</small><b>'+BMH.v6Esc(active.name)+'</b><em>'+BMH.v6Esc(activeRateStatus)+'</em></span><i>＋</i></summary>'
            +'<div class="v64-bank-menu">'
              +'<label class="v64-bank-search"><i>⌕</i><input data-bank-menu-search placeholder="Tìm trong '+BMH.BANKS.length+' ngân hàng…"></label>'
              +'<div class="v64-bank-menu-meta"><b data-bank-menu-count>'+BMH.BANKS.length+' ngân hàng</b><span>Việt Nam</span></div>'
              +'<div class="v64-bank-menu-list">'+bankOptions+'</div>'
            +'</div>'
          +'</details>'
          +'<button class="v64-loan-export" data-export="loan" '+(hasRateScenario?'':'disabled title="Nhập lãi suất kịch bản trước khi tải lịch trả nợ"')+'>Tải lịch trả nợ ↓</button>'
        +'</div>'
        +'<div class="v65-rate-freshness '+(liveVerified?'verified':rateLoading?'loading':'')+'"><div><i>'+(liveVerified?'✓':rateLoading?'◌':'✦')+'</i><span><b>'+(rateLoading?'Gemini đang quét nguồn ngân hàng…':liveVerified?'Lãi suất đã được AI xác minh':'Lãi suất chưa xác minh')+'</b><small>'+(updateDate?'Lãi suất cập nhật '+updateDate+(meta.product?' · '+BMH.v6Esc(meta.product):''):(metaMatches&&meta.note?BMH.v6Esc(meta.note):'Ưu tiên website chính thức của ngân hàng; số chưa đủ nguồn sẽ không tự ghi đè.'))+'</small></span></div><button data-bank-rate-refresh '+(rateLoading?'disabled':'')+'>↻ Cập nhật</button></div>'
        +'<div class="v65-rate-sources">'+(rateCitations.length?rateCitations.map((x,i)=>'<a href="'+BMH.v6Esc(x.url)+'" target="_blank" rel="noopener noreferrer">Nguồn '+(i+1)+' · '+BMH.v6Esc(x.title||active.name)+'</a>').join(''):'')+'</div>'
        +(liveVerified?'':'<p class="v68-fin-warning">Lãi suất bên dưới là giả định để thử dòng tiền, chưa phải báo giá từ ngân hàng. Chỉ dùng mức được công bố cùng sản phẩm, ngày cập nhật và nguồn kiểm chứng để ra quyết định vay.</p>')
        +'<div class="v63-rate-editor"><label><span>Lãi ưu đãi</span><div><input data-path="project.finance.introRate" type="number" min="0" max="30" step=".1" value="'+Number(f.introRate||0)+'"><em>%/năm</em></div></label><label><span>Thời gian ưu đãi</span><div><input data-path="project.finance.promoMonths" type="number" min="0" max="120" value="'+Number(f.promoMonths||0)+'"><em>tháng</em></div></label><label><span>Lãi sau ưu đãi</span><div><input data-path="project.finance.postRate" type="number" min="0" max="30" step=".1" value="'+Number(f.postRate||0)+'"><em>%/năm</em></div></label></div>'
        +'<div class="v63-payment-shift"><article><small>Trong ưu đãi</small><b>'+(hasRateScenario?BMH.money(promoPayment):'—')+'</b><span>/ tháng đầu</span></article><i>→</i><article><small>Sau ưu đãi</small><b>'+(hasRateScenario?BMH.money(postPayment):'—')+'</b><span>/ tháng ước tính</span></article>'+(hasRateScenario?'<em class="'+(postPayment>promoPayment?'up':'')+'">'+(postPayment>=promoPayment?'+':'−')+BMH.money(Math.abs(postPayment-promoPayment))+'</em>':'')+'</div>'
      +'</div>'
      +'<div class="v63-stress"><div class="v6-section-head"><div><b>Stress test lãi suất</b><span>Kịch bản thử nếu lãi sau ưu đãi tăng thêm 1–3 điểm %.</span></div></div>'+(hasRateScenario?'<div class="v63-stress-grid">'+stress.map(x=>'<article><small>+'+x.d+' điểm %</small><b>'+x.rate.toFixed(1)+'%</b><span>'+BMH.money(x.pay)+'/tháng</span><em>DTI '+(x.dti===null?'—':x.dti+'%')+'</em></article>').join('')+'</div>':'<p class="v68-fin-warning">Chưa có lãi suất cơ sở. Nhập lãi ưu đãi và lãi sau ưu đãi để chạy stress test.</p>')+'</div>'
   +'</section>'

   +'<aside class="v6-card v6-fin-ai v63-fin-ai">'
      +BMH.v6PanelTitle('✦','AI tư vấn tài chính','Đọc dòng tiền, dự toán và kịch bản lãi suất hiện tại.')
      +'<div class="v6-advice"><article><i>'+(pct!==null&&pct<=36?'✓':'!')+'</i><div><b>DTI</b><span>'+(pct===null?'Nhập thu nhập để tính.':'Tỷ lệ mô phỏng '+pct+'%.')+'</span></div></article><article><i>◉</i><div><b>Quỹ dự phòng</b><span>'+BMH.money(f.reserve)+' đang được giữ riêng.</span></div></article><article><i>'+(e.gap>=0?'✓':'!')+'</i><div><b>Cân đối xây dựng</b><span>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' so với ngân sách.':'Thiếu '+BMH.money(Math.abs(e.gap))+' so với dự toán.')+'</span></div></article></div>'
      +'<div class="v63-ai-score"><small>ĐỘ BỀN DÒNG TIỀN</small><b>'+(pct===null?'—':Math.max(0,100-Math.max(0,pct-30)*3))+'/100</b><span>Điểm nội bộ để so sánh kịch bản, không phải điểm tín dụng ngân hàng.</span></div>'
      +'<button class="v6-primary full" data-ai-direct="cost">✦ Phân tích phương án vay</button>'
      +(remainingGap>0?'<div class="v68-fin-warning">Sau khoản vay mong muốn vẫn thiếu '+BMH.money(remainingGap)+'. Hãy điều chỉnh diện tích hoặc vật liệu để giảm nhu cầu vốn.<div class="v68-fin-actions"><button data-nav="4">Chỉnh mặt bằng</button><button data-nav="5">Đổi vật liệu</button></div></div>':'')
      +'<div class="v6-callout"><small>Dữ liệu lãi suất</small><b>'+withPreset+' ngân hàng có preset mô phỏng</b><span>Danh mục '+BMH.BANKS.length+' ngân hàng Việt Nam nằm ngay trong ô chọn ngân hàng. Ngân hàng chưa có dữ liệu vẫn giữ trạng thái “chờ báo giá”, không tự gán lãi suất.</span></div>'
   +'</aside>'
   +'</div>';
};

BMH.v67RiskText=(kind,value)=>{
  const v=String(value||'').toLowerCase();
  if(kind==='flood'){if(v==='high')return 'Cao';if(v==='medium')return 'Trung bình';if(v==='low')return 'Thấp';if(v==='unknown')return 'Chưa đủ dữ liệu';}
  if(kind==='access'){if(v==='good')return 'Thuận tiện';if(v==='medium')return 'Trung bình';if(v==='difficult')return 'Khó tiếp cận';if(v==='unknown')return 'Chưa đủ dữ liệu';}
  return value||'Chưa đánh giá';
};
BMH.v67PlaceCard=(x,type='supplier')=>{
  const url=/^https:\/\//i.test(String(x?.website||''))?String(x.website):'',km=Number(x?.distanceKm);
  return '<article class="v67-place-card"><i>'+(type==='supplier'?'▦':'⌂')+'</i><div><b>'+BMH.v6Esc(x?.name||'Chưa có tên')+'</b><span>'+BMH.v6Esc(x?.category||x?.reason||(type==='supplier'?'Nhà cung cấp vật liệu':'Đơn vị xây dựng'))+'</span>'+(Number.isFinite(km)?'<small>~ '+BMH.num(km,1)+' km từ khu đất</small>':x?.address?'<small>'+BMH.v6Esc(x.address)+'</small>':'')+'</div>'+(url?'<a href="'+BMH.v6Esc(url)+'" target="_blank" rel="noopener noreferrer">Mở ↗</a>':'')+'</article>';
};
BMH.screen3=()=>{
  const s=BMH.state.project.site,p=BMH.regionProfile(s),near=BMH.regionNearbyPlaces?.(s)||[],confirmed=BMH.sitePinConfirmed?.(s),rawIntel=BMH.state.project.siteIntelligence||{},si=confirmed&&rawIntel.key===BMH.siteIntelClientKey(s)?rawIntel:BMH.defaultState().project.siteIntelligence,e=BMH.estimate();
  const weatherKey=`${s.lat.toFixed(3)},${s.lng.toFixed(3)}`;
  const live=BMH.liveWeather?.key===weatherKey&&!BMH.liveWeather.error?BMH.liveWeather:null;
  const options=(BMH.VN_REGION_ORDER||Object.keys(BMH.REGIONS||{})).map(x=>'<option value="'+BMH.v6Esc(x)+'" '+(s.province===x?'selected':'')+'>'+BMH.v6Esc(x)+'</option>').join('');
  const embed=BMH.mapEmbedUrl?.(s)||'',loading=si.status==='loading'||BMH.siteIntelLoading,ready=si.status==='ready';
  const floodAI=si.flood?.aiLevel?BMH.v67RiskText('flood',si.flood.aiLevel):si.flood?.level||'Chưa đủ dữ liệu';
  const accessAI=si.access?.aiLevel?BMH.v67RiskText('access',si.access.aiLevel):si.access?.level||'Chưa đánh giá';
  const surcharge=Number(si.transport?.surchargePct)||Math.round((BMH.siteAdaptation?.(s)?.roadPct||0)*100);
  const localSup=(si.suppliers||[]).slice(0,5),webSup=(si.webSuppliers||[]).slice(0,3),localBuilders=(si.builders||[]).slice(0,4),webBuilders=(si.webBuilders||[]).slice(0,3);
  const sourceLinks=(si.citations||[]).filter(x=>/^https:\/\//i.test(String(x?.url||''))).slice(0,5);
  const parcel=BMH.siteParcelStats(s),deedArea=Number(s.deedArea)||0,parcelDifference=deedArea&&s.lotMode==='custom'?Math.abs(parcel.area-deedArea):0;
  return '<div class="v6-s3 v67-site">'
   +'<section class="v6-card v6-location-form">'+BMH.v6Title(2,'KHU ĐẤT & VỊ TRÍ','Ghim đúng miếng đất, AI tự quét xung quanh.','Bấm trực tiếp lên bản đồ hoặc kéo ghim KHU ĐẤT tới đúng vị trí. Mỗi lần ghim thay đổi, hệ thống tự cập nhật thời tiết, rủi ro, giao thông, logistics, nhà cung cấp vật liệu và đơn vị thi công quanh điểm đó.')+'<div class="v67-pin-flow"><i>1</i><span><b>Ghim vị trí</b><small>Bấm vào bản đồ hoặc kéo ghim đỏ.</small></span><em>→</em><i>2</i><span><b>AI tự quét</b><small>Không cần bấm thêm nút quét.</small></span></div><div class="v6-fields"><label><span>Tỉnh / thành</span><select data-path="project.site.province">'+options+'</select></label><label><span>Khu vực / phường xã</span><input data-path="project.site.district" value="'+BMH.v6Esc(s.district||'')+'"></label><label><span>Địa chỉ cụ thể</span><input data-path="project.site.address" value="'+BMH.v6Esc(s.address||'')+'" placeholder="Hoặc tìm nhanh bằng địa chỉ…"></label><label><span>Đường tiếp cận công trình</span><div><input data-path="project.site.road" type="number" min="1" step=".5" value="'+Number(s.road||0)+'"><em>m</em></div></label></div><div class="v6-inline-actions"><button class="v6-primary" data-geocode>⌖ Tìm địa chỉ</button><button class="v6-secondary" data-device-location>Dùng GPS</button></div><div class="v6-coordinate '+(loading?'scanning':'')+'"><b>● '+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</b><span>'+(loading?'AI đang quét quanh ghim…':BMH.v6Esc(confirmed?s.geoSource:'Điểm khu vực tham khảo · hãy ghim đất'))+'</span></div>'+(s.pinAddressNeedsReview?'<p class="v67-location-review">Ghim là vị trí đang phân tích. Tỉnh/thành, phường xã và địa chỉ trong hồ sơ có thể thuộc vị trí cũ; hãy kiểm tra lại trước khi dùng dữ liệu vùng hoặc gửi báo giá.</p>':'')+'</section>'
   +'<section class="v6-card v6-map-panel"><div class="v6-map-toolbar"><div><button data-map-style="satellite" class="'+(s.mapStyle==='satellite'?'active':'')+'">Vệ tinh</button><button data-map-style="hybrid" class="'+(s.mapStyle==='hybrid'?'active':'')+'">Hybrid</button><button data-map-style="roadmap" class="'+(s.mapStyle==='roadmap'?'active':'')+'">Bản đồ</button><button data-map-style="terrain" class="'+(s.mapStyle==='terrain'?'active':'')+'">Địa hình</button></div><span id="mapHudCoords">'+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</span></div><div id="map" class="map fallback-only"><div class="map-fallback"><div class="map-embed-shell v61-map-first"><iframe class="map-embed-frame" loading="eager" referrerpolicy="no-referrer-when-downgrade" src="'+BMH.v6Esc(embed)+'" title="Bản đồ khu đất"></iframe><div class="v67-fallback-site-pin"><i>⌂</i><b>'+(confirmed?'KHU ĐẤT':'ĐIỂM VÙNG')+'</b></div><div class="v61-map-overlay"><span>'+(confirmed?'Vị trí dự án':'Điểm khu vực · chưa là thửa đất')+'</span><b>'+BMH.v6Esc(s.pinAddressNeedsReview?'Vị trí ghim · địa chỉ cần kiểm tra':s.district||s.province)+'</b><small>'+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</small></div></div></div></div><div class="v67-map-legend"><span><i class="site"></i>Khu đất</span><span><i class="supplier"></i>Nhà cung cấp VLXD</span><span><i class="builder"></i>Đơn vị thi công</span></div></section>'
   +'<section class="v6-card v70-parcel">'+BMH.v6PanelTitle('▱','Ranh đất & quy hoạch','Ghim định vị không xác định số thửa, ranh pháp lý hoặc diện tích được xây.')+'<div class="v70-parcel-stats"><article><small>Diện tích từ ranh đang có</small><b>~ '+BMH.num(parcel.area,1)+' m²</b><span>'+(s.lotMode==='custom'?(s.lotSource==='geojson-user'?'GeoJSON do bạn nhập · chưa đối chiếu':'Vẽ tay trên bản đồ · sai số theo ảnh nền'):'Hình chữ nhật từ kích thước tự nhập')+'</span></article><article><small>Diện tích trên hồ sơ</small><b>'+(deedArea?BMH.num(deedArea,1)+' m²':'Chưa nhập')+'</b><span>Chỉ là số bạn khai báo, chưa được hệ thống xác thực.</span></article><article><small>Diện tích được phép xây</small><b>Chưa xác minh</b><span>Cần quy hoạch được duyệt, lộ giới, mật độ, khoảng lùi và giấy tờ thửa đất.</span></article></div>'
   +'<div class="v70-parcel-tools"><button data-map-draw-lot>✎ Vẽ ranh tham khảo</button><button data-map-finish-lot '+(BMH.state.ui.location?.drawingLot?'':'disabled')+'>✓ Hoàn tất ranh</button><button data-parcel-import>↑ Nhập GeoJSON WGS84</button><button data-map-clear-lot>↶ Về kích thước chữ nhật</button><span id="lotDrawStatus">'+(BMH.state.ui.location?.drawingLot?'Đang vẽ · '+(s.lotPoints?.length||0)+' điểm':s.lotMode==='custom'?'Ranh tùy chỉnh · '+(s.lotPoints?.length||0)+' điểm':'Chưa có ranh thửa xác minh')+'</span></div>'
   +'<div class="v70-parcel-fields"><label>Diện tích ghi trên trích lục / sổ (m²)<input data-path="project.site.deedArea" type="number" min="0" step=".1" value="'+deedArea+'"></label><label>Số hiệu hồ sơ / ghi chú nguồn<input data-path="project.site.deedReference" value="'+BMH.v6Esc(s.deedReference||'')+'" placeholder="Ví dụ: bản trích lục ngày…"></label></div>'
   +(parcelDifference>Math.max(2,deedArea*.03)?'<p class="v70-parcel-alert">Chênh khoảng '+BMH.num(parcelDifference,1)+' m² giữa ranh hiển thị và diện tích hồ sơ. Kiểm tra hệ tọa độ, tỷ lệ ảnh nền và trích lục trước khi thiết kế.</p>':'')
   +'<p class="v70-parcel-note">Bản đồ nền và polygon này chỉ giúp định vị. Muốn biết đúng hình thửa và phần được xây, cần trích lục địa chính, thông tin quy hoạch hiện hành và chỉ tiêu xây dựng tại chính thửa đó. Bản vẽ cùng dự toán đang dùng kích thước mặt tiền × chiều sâu do bạn nhập, chưa tự suy diện tích xây từ polygon.</p><div class="v70-parcel-links"><a href="https://quyhoach.xaydung.gov.vn/vn/Pages/Trangchu.aspx" target="_blank" rel="noopener noreferrer">Cổng quy hoạch Bộ Xây dựng ↗</a>'+(s.province==='TP. Hồ Chí Minh'?'<a href="https://thongtinquyhoach.hochiminhcity.gov.vn/ban-do-quy-hoach" target="_blank" rel="noopener noreferrer">Quy hoạch TP.HCM ↗</a>':'')+'</div></section>'
   +'<aside class="v6-card v6-climate">'+BMH.v6PanelTitle('☀','Khí hậu & rủi ro khu vực',s.pinAddressNeedsReview?'Dữ liệu vùng hồ sơ · cần kiểm tra':s.province+' · '+s.district)+'<div class="v6-climate-grid">'+BMH.v6Kpi('Nhiệt độ',live&&Number.isFinite(live.temp)?BMH.num(live.temp,1)+'°C':'Đang lấy').replace('<article','<article data-weather-temp')+BMH.v6Kpi('Độ ẩm',live&&Number.isFinite(live.humidity)?BMH.num(live.humidity,0)+'%':'Đang lấy').replace('<article','<article data-weather-humidity')+BMH.v6Kpi('Mùa mưa',BMH.v6Esc(p.wet))+BMH.v6Kpi('Gió chính',BMH.v6Esc(p.wind))+BMH.v6Kpi('Ngập sơ bộ',BMH.v6Esc(floodAI))+BMH.v6Kpi('Cao độ',si.elevation_m==null?'Chưa có dữ liệu':BMH.num(si.elevation_m,0)+' m')+'</div><p class="v67-weather-source" data-weather-source>'+(live?'Open-Meteo · cập nhật '+new Date(live.ts).toLocaleString('vi-VN'):(confirmed?'Đang lấy thời tiết tại ghim · khí hậu mùa là dữ liệu vùng tham khảo':'Thời tiết tại điểm đại diện khu vực · hãy ghim miếng đất'))+(s.pinAddressNeedsReview?' · Tỉnh/phường chưa xác nhận với ghim':'')+'</p><div class="v6-climate-tip"><i>✦</i><div><b>Khuyến nghị thiết kế</b><span>'+BMH.v6Esc((p.designTips||[])[0]||'Ưu tiên thông gió, che nắng và thoát nước phù hợp địa phương.')+'</span></div></div></aside>'
   +'<section class="v6-card v67-intelligence">'
      +'<div class="v67-intel-head"><div><span>SITE INTELLIGENCE</span><h2>'+(confirmed?'AI tự quét quanh ghim khu đất':'Chờ ghim miếng đất')+'</h2><p>'+(loading?'Đang lấy cao độ, đường, sông/kênh, nhà cung cấp và đối chiếu nguồn web quanh chính ghim hiện tại…':ready?(BMH.v6Esc(si.aiSummary||'Đã quét dữ liệu quanh tọa độ ghim khu đất.')):si.status==='error'?'Lần quét này chưa hoàn tất. Bấm Quét lại khi đường truyền ổn định.':'Bấm hoặc kéo ghim trên bản đồ để hệ thống tự quét khu vực xung quanh.')+'</p></div><button data-site-intel-refresh '+(loading?'disabled':'')+'>↻ '+(loading?'Đang quét':'Quét lại')+'</button></div>'
      +'<div class="v67-intel-kpis">'
        +'<article><small>Ngập / thoát nước</small><b>'+BMH.v6Esc(floodAI)+'</b><span>'+BMH.v6Esc(si.flood?.aiReason||si.flood?.note||'Sàng lọc theo vùng; cần dữ liệu chấm đất để đánh giá kỹ hơn.')+'</span></article>'
        +'<article><small>Tiếp cận công trình</small><b>'+BMH.v6Esc(accessAI)+'</b><span>'+BMH.v6Esc(si.access?.aiReason||si.access?.note||('Đường tiếp cận khai báo '+s.road+' m.'))+'</span></article>'
        +'<article><small>Phụ phí vận chuyển</small><b>~ '+surcharge+'%</b><span>'+BMH.money(e.transport)+' đang nằm trong dự toán vận chuyển hiện tại.</span></article>'
        +'<article><small>Đường chính gần nhất</small><b>'+(si.access?.majorRoadDistanceKm==null?'Chưa có dữ liệu':'~ '+BMH.num(si.access.majorRoadDistanceKm,1)+' km')+'</b><span>'+BMH.v6Esc(si.access?.majorRoadName||'OpenStreetMap sẽ được quét theo tọa độ.')+'</span></article>'
      +'</div>'
      +'<div class="v67-data-status"><b>Dữ liệu tại ghim</b><span>'+(si.fetchedAt?'Cập nhật '+new Date(si.fetchedAt).toLocaleString('vi-VN')+' · ':'')+'OSM: '+(si.sourceStatus?.osm==='verified'?'đã lấy':'chưa xác minh')+' · Cao độ: '+(si.sourceStatus?.elevation==='verified'?'đã lấy':'chưa xác minh')+' · Web: '+(si.sourceStatus?.web==='cited'?'có nguồn':'chưa xác minh')+'</span></div>'
      +((si.warnings||[]).length?'<div class="v67-data-warnings">'+si.warnings.slice(0,3).map(x=>'<p>! '+BMH.v6Esc(x)+'</p>').join('')+'</div>':'')
      +'<div class="v67-market-grid"><div><div class="v67-list-title"><span><b>Nhà cung cấp vật liệu gần công trình</b><small>Điểm có tọa độ được đánh dấu trực tiếp trên bản đồ.</small></span><em>'+localSup.length+' địa điểm OSM</em></div><div class="v67-place-list">'+(localSup.length?localSup.map(x=>BMH.v67PlaceCard(x,'supplier')).join(''):'<div class="v67-empty">Chưa thấy điểm VLXD có dữ liệu địa lý trong bán kính quét.</div>')+(webSup.length?'<div class="v67-web-label">Gemini tìm thêm trên web</div>'+webSup.map(x=>BMH.v67PlaceCard(x,'supplier')).join(''):'')+'</div></div>'
        +'<div><div class="v67-list-title"><span><b>Đơn vị xây dựng tham khảo</b><small>Đề xuất để người xây dựng liên hệ khảo sát/báo giá, chưa phải xếp hạng chất lượng.</small></span><em>'+localBuilders.length+' địa điểm OSM</em></div><div class="v67-place-list">'+(localBuilders.length?localBuilders.map(x=>BMH.v67PlaceCard(x,'builder')).join(''):'<div class="v67-empty">Chưa thấy nhà thầu có dữ liệu địa lý gần khu đất.</div>')+(webBuilders.length?'<div class="v67-web-label">Gemini tìm thêm trên web</div>'+webBuilders.map(x=>BMH.v67PlaceCard(x,'builder')).join(''):'')+'</div></div></div>'
      +(sourceLinks.length?'<div class="v67-sources"><b>Nguồn đối chiếu</b>'+sourceLinks.map((x,i)=>'<a href="'+BMH.v6Esc(x.url)+'" target="_blank" rel="noopener noreferrer">'+(i+1)+'. '+BMH.v6Esc(x.title||'Nguồn web')+'</a>').join('')+'</div>':'')
      +'<div class="v67-disclaimer"><i>!</i><span><b>Ngập là đánh giá sàng lọc, không phải kết luận khảo sát.</b><small>Trước thi công vẫn cần kiểm tra cao độ thực địa, hệ thống thoát nước, lịch sử ngập tại đúng tuyến đường và khảo sát địa chất khi cần.</small></span></div>'
   +'</section>'
   +'</div>';
};

BMH.screen4=()=>{
  const s=BMH.state.project.site,h=BMH.state.project.household,p=BMH.regionProfile(s),feng=BMH.fengProfile(),members=BMH.v6Household(),targetMembers=Math.max(members.length,Number(h.requestedSize)||0),pendingMembers=Math.max(0,targetMembers-members.length);
  return '<div class="v6-s4">'
   +'<section class="v6-card v6-s4-head">'+BMH.v6Title(3,'ĐẤT · ĐỊA CHẤT · GIA ĐÌNH','Một nền đất tốt và một ngôi nhà hợp với người sống trong đó.','Phần kỹ thuật, nhu cầu gia đình và phong thủy được tách rõ để tránh trộn lẫn niềm tin với yêu cầu an toàn.')+'<div class="v6-kpi-row">'+BMH.v6Kpi('Diện tích đất',BMH.num(s.width*s.depth)+' m²')+BMH.v6Kpi('Thành viên',targetMembers+' người',pendingMembers?pendingMembers+' người chưa khai báo chi tiết':'Đã đủ hồ sơ')+BMH.v6Kpi('Số tầng',s.floors+' tầng')+BMH.v6Kpi('Hướng mặt tiền',BMH.v6Esc(s.frontDirection))+'</div></section>'
   +'<section class="v6-card v6-land">'+BMH.v6PanelTitle('▣','Khu đất & địa chất sơ bộ','Dùng để định hướng, không thay thế khảo sát hiện trường.')+'<div class="v6-fields two"><label><span>Ngang</span><div><input data-path="project.site.width" type="number" step=".1" value="'+s.width+'"><em>m</em></div></label><label><span>Sâu</span><div><input data-path="project.site.depth" type="number" step=".1" value="'+s.depth+'"><em>m</em></div></label><label><span>Số tầng</span><div><input data-path="project.site.floors" type="number" value="'+s.floors+'"><em>tầng</em></div></label><label><span>Đường tiếp cận</span><div><input data-path="project.site.road" type="number" step=".5" value="'+s.road+'"><em>m</em></div></label></div><div class="v6-soils">'+['Đất thịt đồng bằng','Đất cát','Đất sét','Đất yếu / bùn','Đất đá'].map((x,i)=>'<button data-soil="'+x+'" class="'+(s.soil===x?'active':'')+'"><i>'+['▰','▱','▧','▤','◆'][i]+'</i><b>'+x+'</b></button>').join('')+'</div><div class="v6-land-note"><b>'+BMH.v6Esc(p.climate)+'</b><span>Ngập: '+BMH.v6Esc(p.flood)+' · Bão/gió: '+BMH.v6Esc(p.storm)+' · Nhiệt: '+BMH.v6Esc(p.heat)+'</span></div></section>'
   +'<section class="v6-card v6-family">'+BMH.v6PanelTitle('♙','Thành viên gia đình',pendingMembers?'Hồ sơ yêu cầu '+targetMembers+' người · còn '+pendingMembers+' người chưa khai báo chi tiết.':'Đã đồng bộ đủ '+targetMembers+' thành viên.')+(pendingMembers?'<div class="v6-family-sync-warn"><i>!</i><span><b>Còn '+pendingMembers+' thành viên chưa khai báo</b><small>Hệ thống vẫn dùng tổng '+targetMembers+' người để tính nhu cầu phòng. Thêm hồ sơ chi tiết nếu muốn AI hiểu tuổi, giới tính và nhu cầu riêng.</small></span></div>':'')+'<div class="v6-people">'+members.map(BMH.v6PersonCard).join('')+'</div><div class="v6-person-actions"><button data-household-add="child">＋ Thêm con</button><button data-household-add="relative">＋ Thêm người thân</button>'+(h.partnerEnabled===false?'<button data-v6-partner="on">＋ Hiện bạn đời</button>':'')+'</div></section>'
   +'<section class="v6-card v6-feng">'+BMH.v6PanelTitle('☯','Phong thủy tham khảo có nguồn','Chủ nhà tự quyết định; gợi ý không thay công năng hoặc an toàn.')+BMH.v6FengControls()+'<div class="v6-feng-base"><div>'+BMH.compass()+'</div><div><small>Kết quả công thức cục bộ</small><h3>'+BMH.v6Esc(feng.title)+'</h3><p>'+BMH.v6Esc(feng.note)+'</p><b>Hướng tham khảo: '+BMH.v6Esc((feng.dirs||[]).join(' · '))+'</b><button class="v6-primary" data-v6-feng>✦ AI nghiên cứu đa nguồn</button></div></div>'+BMH.v6FengFamily()+BMH.v6FengResult()+'</section>'
   +'</div>';
};

BMH.stairDrawingOptionsHtml=()=>{
  const {rooms,room}=BMH.stairDrawingSelection();if(!room)return '';
  const s=BMH.stairSpec(room);
  return '<div class="drawing-view-options stair-drawing-options"><label>Thang nối tầng <select data-stair-drawing aria-label="Chọn thang nối tầng">'+rooms.map(r=>'<option value="'+BMH.v6Esc(r.id)+'" '+(r.id===room.id?'selected':'')+'>Tầng '+(r.floor+1)+' → '+(r.floor+2)+' · '+BMH.v6Esc(r.name)+'</option>').join('')+'</select></label><button data-edit-stair-drawing>Chỉnh thang trên mặt bằng</button><button data-view-stair-drawing>Xem thang trong 3D</button><span>'+s.count+' cao bậc · '+Math.round(s.riser*1000)+' mm · mặt bậc '+Math.round(s.tread*1000)+' mm</span>'+(s.warning?'<p role="status">'+BMH.v6Esc(s.warning)+'</p>':'')+'</div>';
};

BMH.screen5=()=>{
  const ui=BMH.state.ui.planner,view=ui.view||'plan',floor=Number(ui.floor)||0,rooms=BMH.floorRooms(floor),selected=rooms.find(r=>r.id===ui.selected)||rooms[0]||null,r=BMH.designReview(),drawing=view==='plan'?BMH.planSvg({interactive:true,floor}):view==='elevation'?BMH.elevationSvg():view==='openings'?BMH.openingSheetSvg(floor,ui.openingPage):view==='stairs'?(BMH.currentDrawingSvg()||'<div class="drawing-empty"><h3>Chưa có thang nối tầng</h3><p>Thêm cầu thang vào mặt bằng của nhà từ hai tầng để xem chi tiết.</p><button data-plan-view="plan">Trở về mặt bằng</button></div>'):BMH.sectionSvg();
  const review=selected?BMH.roomPlacementReview(selected):null,issues=BMH.plannerIssues(),locked=selected?BMH.isRoomLocked(selected.id):false;
  if(selected&&!ui.selected)ui.selected=selected.id;
  return '<div class="v6-s5 '+(!BMH.state.project.plan.rooms.length?'v68-has-empty':'')+'">'
   +'<section class="v6-card v6-plan-head">'+BMH.v6Title(4,'BẢN VẼ','Mặt bằng, kích thước và hồ sơ kiến trúc.','Chọn phương án rồi chỉnh phòng, cửa và thang. Mặt đứng, mặt cắt và bộ bản vẽ cập nhật cùng thiết kế.')+'<div class="v6-kpi-row">'+BMH.v6Kpi('Tầng',String(floor+1))+BMH.v6Kpi('Không gian',rooms.length+' phòng')+BMH.v6Kpi('Diện tích',BMH.num(rooms.reduce((a,x)=>a+x.w*x.h,0))+' m²')+BMH.v6Kpi('Điểm thiết kế',rooms.length?r.overall+'/100':'Chưa đánh giá')+'</div></section>'
   +(!BMH.state.project.plan.rooms.length?'<section class="v6-card v68-plan-empty"><div><small>BẮT ĐẦU MẶT BẰNG</small><h3>Tạo mặt bằng sơ bộ từ khu đất và gia đình</h3><p>Hệ thống sẽ bố trí các không gian ban đầu trên từng tầng để bạn kéo, đổi kích thước và điều chỉnh. Bản vẽ cần kiến trúc sư kiểm tra trước khi thi công.</p></div><button data-auto-plan>Tạo phương án ban đầu →</button></section>':'')
   +'<aside class="v6-card v6-plan-tools">'+BMH.v6PanelTitle('＋','Thêm & chỉnh sửa','Chọn loại phòng rồi đặt ở tầng hiện tại.')+'<div class="v6-room-types">'+[['living','⌂','Khách'],['kitchen','♨','Bếp + ăn'],['bed','▰','Ngủ'],['bath','◫','WC'],['stairs','⌁','Cầu thang'],['elevator','↕','Thang máy'],['garage','▣','Gara'],['balcony','▤','Ban công'],['corridor','↔','Hành lang']].map(x=>'<button data-add-room="'+x[0]+'" '+(BMH.isFloorLocked(floor)?'disabled':'')+'><i>'+x[1]+'</i><span>'+x[2]+'</span></button>').join('')+'</div><div class="v6-tool-buttons"><button data-plan-tool="select" class="'+(ui.tool==='select'?'active':'')+'">↖ Chọn / kéo</button><button data-plan-tool="door" class="'+(ui.tool==='door'?'active':'')+'">▯ Thêm cửa</button><button data-plan-tool="window" class="'+(ui.tool==='window'?'active':'')+'">▥ Thêm cửa sổ</button><button data-plan-undo>↶ Hoàn tác</button><button data-plan-redo>↷ Làm lại</button></div><p class="v72-tool-help">Chọn cửa rồi chạm lên tường của phòng. Bấm Chọn / kéo để quay lại di chuyển phòng.</p>'+(BMH.architecturePanel?.()||'')+'</aside>'
   +'<section class="v6-card v6-plan-main"><div class="v72-plan-intro"><div><small>'+({plan:'MẶT BẰNG TẦNG '+(floor+1),stairs:'CHI TIẾT THANG NỐI TẦNG',openings:'BẢNG CỬA TẦNG '+(floor+1),section:'MẶT CẮT A–A',elevation:'MẶT ĐỨNG'}[view]||'BẢN VẼ')+'</small><h2>'+(view==='plan'?'Sắp xếp ngôi nhà theo cách bạn muốn':view==='stairs'?'Kiểm tra thang nối các tầng':'Đối chiếu bản vẽ với thiết kế')+'</h2></div><span>'+BMH.num(BMH.state.project.site.width)+' × '+BMH.num(BMH.state.project.site.depth)+' m · '+rooms.length+' không gian</span></div><div class="v6-plan-toolbar"><div><button data-plan-view="plan" class="'+(view==='plan'?'active':'')+'">Mặt bằng</button>'+Array.from({length:BMH.state.project.site.floors},(_,i)=>'<button data-floor="'+i+'" class="'+(view==='plan'&&floor===i?'floor active':'')+'">Tầng '+(i+1)+'</button>').join('')+'<button data-plan-view="elevation" class="'+(view==='elevation'?'active':'')+'">Mặt đứng</button><button data-plan-view="section" class="'+(view==='section'?'active':'')+'">Mặt cắt</button><button data-plan-view="openings" class="'+(view==='openings'?'active':'')+'">Bảng cửa</button><button data-plan-view="stairs" class="'+(view==='stairs'?'active':'')+'">Chi tiết thang</button></div><div><button data-floor-lock="'+floor+'">'+(BMH.isFloorLocked(floor)?'🔒 Mở khóa':'♧ Khóa tầng')+'</button><button data-plan-clean title="Ẩn lớp phân tích để xem tường, cửa, cầu thang và kích thước">Bản vẽ kỹ thuật</button><button data-export="plan">Tải SVG · bản in</button><button data-export="drawing-pdf">Bộ bản vẽ A3 / PDF</button>'+(view==='plan'?'<button data-export="plan-dxf">Tải CAD · mm</button>':'')+'<button data-planner-fit>Vừa khung</button><button data-planner-zoom="out" aria-label="Thu nhỏ">−</button><button data-planner-zoom="in" aria-label="Phóng to">＋</button><button data-planner-fullscreen aria-label="Toàn màn hình">⛶</button></div></div>'+(view==='section'?'<div class="drawing-view-options"><label>Đường cắt A–A · X / m <input data-section-cut type="number" min="0" max="'+BMH.state.project.site.width+'" step=".01" value="'+BMH.sectionCutX()+'"></label><span>Đường cắt được đánh dấu trên bản vẽ xuất.</span></div>':view==='openings'?'<div class="drawing-view-options"><label>Trang bảng cửa <select data-opening-page>'+Array.from({length:Math.max(1,Math.ceil(BMH.state.project.plan.openings.filter(o=>o.floor===floor).length/24))},(_,i)=>'<option value="'+i+'" '+((Number(ui.openingPage)||0)===i?'selected':'')+'>Trang '+(i+1)+'</option>').join('')+'</select></label><span>Kích thước, bậu và vị trí lấy từ các cửa đang chỉnh.</span></div>':view==='stairs'?BMH.stairDrawingOptionsHtml():'')+'<div class="v6-plan-canvas technical-sheet '+(view==='plan'?'':'paper-sheet')+'">'+drawing+(view==='plan'&&review?'<div id="placementHint" class="placement-hint placement-'+BMH.v6Esc(review.code)+'" role="status" aria-live="polite"><strong>'+BMH.v6Esc(review.status)+'</strong><b>'+review.score+'/100</b><span>'+BMH.v6Esc(review.name)+' · '+BMH.v6Esc(review.sector)+'</span><small>'+BMH.v6Esc(review.notes[0]||'Chọn phòng để kiểm tra vị trí.')+'</small></div>':'')+'</div><div class="v6-plan-legend"><span><i class="wall"></i>Tường</span><span><i class="window"></i>Cửa sổ</span><b>'+(view==='plan'?'Chạm phòng để chọn · kéo để di chuyển · kéo điểm góc để đổi kích thước':'Phóng to để đọc chi tiết · tải bản in A3 đúng tỷ lệ')+'</b></div><div class="v70-plan-actions"><button data-align-floor="stairs" '+(floor===0?'disabled':'')+'>Căn cầu thang với tầng dưới</button><button data-align-floor="bath" '+(floor===0?'disabled':'')+'>Căn khu WC với tầng dưới</button><span>Bản vẽ sơ bộ. Kết cấu, PCCC và hệ kỹ thuật cần kỹ sư kiểm tra.</span></div></section>'
   +'<aside class="v6-card v6-inspector">'+BMH.v6PanelTitle('◎','Phòng đang chọn',BMH.num(BMH.state.project.site.width)+' × '+BMH.num(BMH.state.project.site.depth)+' m · '+BMH.state.project.site.floors+' tầng')+(selected?'<div class="v6-room-editor"><div><small>PHÒNG · '+BMH.num(selected.w*selected.h)+' m²</small><h3>'+BMH.v6Esc(selected.name)+'</h3></div><label>Tên phòng<input data-v6-room="name" value="'+BMH.v6Esc(selected.name)+'" '+(locked?'disabled':'')+'></label><div class="v6-fields two"><label><span>Rộng</span><div><input data-v6-room="w" type="number" min=".6" step=".1" value="'+Number(selected.w.toFixed(3))+'" '+(locked?'disabled':'')+'><em>m</em></div></label><label><span>Dài</span><div><input data-v6-room="h" type="number" min=".6" step=".1" value="'+Number(selected.h.toFixed(3))+'" '+(locked?'disabled':'')+'><em>m</em></div></label><label><span>Vị trí X</span><div><input data-v6-room="x" type="number" min="0" step=".1" value="'+Number(selected.x.toFixed(3))+'" '+(locked?'disabled':'')+'><em>m</em></div></label><label><span>Vị trí Y</span><div><input data-v6-room="y" type="number" min="0" step=".1" value="'+Number(selected.y.toFixed(3))+'" '+(locked?'disabled':'')+'><em>m</em></div></label></div><div class="v72-room-actions"><button data-room-lock="'+BMH.v6Esc(selected.id)+'" '+(BMH.isFloorLocked(floor)?'disabled':'')+'>'+(BMH.isFloorLocked(floor)?'🔒 Tầng đang khóa':locked?'🔒 Mở khóa phòng':'♧ Khóa phòng')+'</button><button class="v6-danger" data-room-delete '+(locked?'disabled':'')+'>Xóa phòng</button></div></div>':'<p class="v6-empty">Chọn một phòng trên bản vẽ để chỉnh.')+'<div class="v72-review"><b>Kiểm tra mặt bằng <span>'+issues.length+' lưu ý</span></b>'+(issues.length?issues.slice(0,3).map(x=>'<p class="'+BMH.v6Esc(x.sev)+'">'+BMH.v6Esc(x.text)+'</p>').join(''):'<p>Chưa thấy xung đột trong các quy tắc sơ bộ.</p>')+'<small>Quy tắc sơ bộ, chưa thay thế thẩm định kiến trúc và kết cấu.</small></div><details class="v72-room-list"><summary>Danh sách '+rooms.length+' phòng trên tầng</summary><div class="v6-room-list">'+rooms.map(x=>'<button data-room-select="'+BMH.v6Esc(x.id)+'" class="'+(selected?.id===x.id?'active':'')+'"><span>'+BMH.v6Esc(x.name)+'</span><b>'+BMH.num(x.w*x.h)+' m²</b></button>').join('')+'</div></details><button class="v6-secondary full" data-ai-direct="review">✦ Hỏi AI về mặt bằng →</button></aside>'
   +BMH.houseStylePanel()+'</div>';
};

BMH.screen6=()=>{
  const m=BMH.state.project.materials,e=BMH.estimate(),perf=BMH.performancePlan(),cat=BMH.state.ui.materialCategory||'floor',items=BMH.MATERIALS[cat]||[],meta=BMH.v6MatMeta[cat]||['▥','Vật liệu'],de=BMH.dataEngineState(),localSources=BMH.localMarketSources?.()||[];
  return '<div class="v6-s6">'
   +'<section class="v6-card v6-mat-head">'+BMH.v6Title(5,'SHOWROOM VẬT LIỆU','Chọn vật liệu như đang phối cả ngôi nhà, không phải chọn từng món rời rạc.','So sánh kiểu dáng và chi phí lập kế hoạch; kiểm tra thông số và báo giá với nhà cung cấp trước khi chốt.')+'<div class="v6-tier">'+[['economy','Tiết kiệm'],['standard','Tiêu chuẩn'],['premium','Cao cấp']].map(x=>'<button data-tier="'+x[0]+'" class="'+(m.tier===x[0]?'active':'')+'"><b>'+x[1]+'</b><span>'+(x[0]==='economy'?'Ưu tiên chi phí':x[0]==='standard'?'Cân bằng nhất':'Ưu tiên trải nghiệm')+'</span></button>').join('')+'</div></section>'
   +'<aside class="v6-card v6-mat-nav">'+BMH.v6PanelTitle('◫','Danh mục','12 nhóm · '+(BMH.materialResearch?.products.length||0)+' lựa chọn từ hãng')+'<div>'+Object.keys(BMH.v6MatMeta).map(k=>'<button data-material-view="'+k+'" class="'+(cat===k?'active':'')+'"><i>'+BMH.v6MatMeta[k][0]+'</i><span>'+BMH.v6MatMeta[k][1]+'</span><em>'+(BMH.materialResearch?.products.filter(x=>x.category===k).length||BMH.MATERIALS[k]?.length||'Chờ')+'</em></button>').join('')+'</div></aside>'
   +'<section class="v6-card v6-showroom"><div class="v6-section-head"><div><b>'+meta[1]+'</b><span>'+(BMH.materialResearch?.products.filter(x=>x.category===cat).length||items.length)+' lựa chọn · báo giá theo nguồn.</span></div>'+(m.lastDelta?'<strong class="v69-material-delta">Chi phí ước tính '+(m.lastDelta>0?'+':'−')+BMH.money(Math.abs(m.lastDelta))+' sau thay đổi gần nhất</strong>':'')+'</div>'+(BMH.materialCatalogHtml?BMH.materialCatalogHtml(cat):items.length?'<div class="v6-products">'+items.map((x,i)=>BMH.v71MaterialCard(cat,m,x,i)).join('')+'</div>':'<div class="v70-mat-empty"><b>Chưa có sản phẩm và báo giá xác minh cho nhóm này.</b><span>Danh mục được giữ để lập kế hoạch. Khi có mã hàng, quy cách và báo giá nhà cung cấp, mới đưa vào lựa chọn và khối lượng.</span></div>')+'<div class="v6-showroom-note"><i>✦</i><div><b>Gợi ý theo khí hậu</b><span>'+BMH.v6Esc(BMH.climateMaterialGuide(cat))+'</span></div></div><div class="v70-quote-panel"><div><small>GIÁ THEO NGUỒN</small><b>'+(de.quote?.name?BMH.v6Esc(de.quote.name)+' · '+BMH.v6Esc(de.quote.date):'Chưa nhập báo giá tại khu đất')+'</b><span>CSV cần cột key,value,unit,source,date,reference; ngày dạng YYYY-MM-DD, giá nhập là VND nguyên. Giá m² của gạch, sơn và cửa đang chọn sẽ thay phần phân bổ tương ứng trong dự toán. Đơn vị khác chỉ hiển thị, cần quy đổi khối lượng trước khi tính.</span></div><button data-price-import>↑ Nhập báo giá CSV / JSON</button></div><div class="v70-quote-sources"><b>Nguồn công bố để đối chiếu vùng</b>'+(localSources.length?localSources.slice(0,3).map(x=>'<a href="'+BMH.v6Esc(x.url)+'" target="_blank" rel="noopener noreferrer">'+BMH.v6Esc(x.name)+' · '+BMH.v6Esc(x.date||'')+' ↗</a>').join(''):'<span>Chưa có nguồn công bố giá địa phương trong dữ liệu hiện tại.</span>')+'</div><button class="v69-supplier-link" data-nav="2">Xem nhà cung cấp quanh khu đất →</button></section>'
   +'<aside class="v6-card v6-energy">'+BMH.v6PanelTitle('☀','Năng lượng & vận hành','Điện mặt trời và các lớp giảm tải nhiệt.')+'<div class="v6-energy-hero"><b>'+BMH.num(perf.solarCapacity,1)+' kWp</b><span>công suất PV đề xuất</span></div><div class="v6-kpi-grid">'+BMH.v6Kpi('Mái khả dụng',BMH.num(perf.usableSolarArea,1)+' m²')+BMH.v6Kpi('Sản lượng',BMH.num(perf.solarYield,0)+' kWh/năm')+BMH.v6Kpi('Tự dùng',perf.solarCoverage+'%')+BMH.v6Kpi('Tiết kiệm / năm',BMH.money(perf.annualEnergySavings))+BMH.v6Kpi('Hoàn vốn',perf.payback?BMH.num(perf.payback,1)+' năm':'—')+BMH.v6Kpi('Dự toán hiện tại',BMH.money(e.total))+'</div><div class="v6-toggle-grid">'+[['solarEnabled','☀','Điện mặt trời'],['rainwaterEnabled','☂','Thu nước mưa'],['coolRoof','⌂','Mái chống nóng'],['smartShading','▤','Lam che nắng']].map(x=>'<button data-performance="'+x[0]+'" class="'+(BMH.state.project.performance[x[0]]?'active':'')+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>').join('')+'</div></aside>'
   +'</div>';
};

BMH.screen7=()=>{
  const p=BMH.state.project,r=BMH.designReview(),e=BMH.estimate(),perf=BMH.performancePlan(),ui=BMH.state.ui;
  const currentRender=BMH.cinematicRender?.views?.[BMH.cinematicSignature()]||'';
  const rooms=p.plan.rooms||[];
  const roomOptions=rooms.map(x=>'<option value="room:'+x.id+'" '+(ui.sceneFocus==='room:'+x.id?'selected':'')+'>T'+(x.floor+1)+' · '+BMH.v6Esc(x.name)+'</option>').join('');
  const renderHero=currentRender?'<section class="v72-render-hero"><img src="'+BMH.v6Esc(currentRender)+'" alt="Phối cảnh AI theo phương án dự án"><div><small>PHỐI CẢNH AI · '+BMH.v6Esc(BMH.cinematicRender.generatedAt?new Date(BMH.cinematicRender.generatedAt).toLocaleDateString('vi-VN'):'')+'</small><h2>Hình dung ngôi nhà của bạn</h2><p>Ảnh tạo từ mô hình hiện tại, phong cách và lựa chọn vật liệu. Đối chiếu kích thước, cửa và vật liệu bằng mặt bằng và mã sản phẩm trước khi thi công.</p><button data-render-download>Tải ảnh này ↓</button></div></section>':'<section class="v72-render-empty"><div><small>PHỐI CẢNH CHẤT LƯỢNG CAO</small><b>Tạo ảnh riêng từ phương án đang thiết kế</b><span>Ảnh tham khảo không thể đại diện đúng khu đất và vật liệu của bạn. Khi dịch vụ ảnh AI được bật, ảnh tạo mới sẽ hiển thị lớn ở đây.</span></div><button data-cinematic-render '+(BMH.cinematicRender?.loading?'disabled':'')+'>'+(BMH.cinematicRender?.loading?'Đang tạo ảnh…':'Tạo phối cảnh AI ↗')+'</button></section>';
  return '<div class="v6-s7 v61-s7-live">'+renderHero
   +'<section class="v6-card v6-s7-head">'+BMH.v6Title(6,'MÔ HÌNH 3D & PHỐI CẢNH','Xoay, zoom, tách tầng và xem từng không gian trên mô hình kỹ thuật.','Mô hình từ mặt bằng hiện tại: chọn phòng, xoay, phóng to và tách tầng. Máy không hỗ trợ đồ họa sẽ tự chuyển sang chế độ xem nhẹ.')+'<div class="v6-score-pill"><small>Điểm tổng thể</small><b>'+r.overall+'<em>/100</em></b></div></section>'
   +'<aside class="v6-card v6-score">'+BMH.v6PanelTitle('◎','Đánh giá tổng thể','Công năng, khí hậu, ngân sách và tiện nghi.')+'<div class="v6-score-ring" style="--p:'+r.overall+'"><div><b>'+r.overall+'</b><span>/100</span></div></div><div class="v6-bars">'+[['Công năng',r.function],['Tiện nghi',r.comfort],['Thông gió',r.ventilation],['Ngân sách',r.budget],['Năng lượng',perf.energyScore]].map(x=>'<article><span>'+x[0]+'</span><i><b style="width:'+x[1]+'%"></b></i><em>'+x[1]+'</em></article>').join('')+'</div><button class="v6-secondary full" data-ai-direct="review">Xem phân tích AI →</button></aside>'
   +'<section class="v61-live3d" id="studio3dStage"><div class="studio-3d-loading" id="studio3dLoading"><i>⌂</i><b>Đang dựng mô hình 3D từ mặt bằng…</b><span>Mô hình kiểm tra khối tích và màu vật liệu đã chọn; chưa có cấu tạo kiến trúc chi tiết.</span></div><canvas id="studio3dCanvas" aria-label="Mô hình 3D tương tác ngôi nhà"></canvas><div class="studio-3d-fallback"><img src="assets/rooms/facade-render.jpg" alt="Ảnh tham khảo khi không tải được mô hình"><span>Chưa tải được WebGL · ảnh tham khảo, không phải ngôi nhà trong dự án</span></div><div class="v61-3d-top"><div><button class="'+(ui.sceneFocus==='all'?'active':'')+'" data-scene-focus-btn="all">Toàn nhà</button>'+Array.from({length:p.site.floors},(_,i)=>'<button class="'+(ui.sceneFocus==='floor:'+i?'active':'')+'" data-scene-focus-btn="floor:'+i+'">Tầng '+(i+1)+'</button>').join('')+'<select data-scene-focus><option value="all">Chọn phòng…</option>'+roomOptions+'</select></div><div><button data-scene-theme>'+(ui.sceneTheme==='night'?'☾ Ban đêm':'☀ Ban ngày')+'</button><button data-scene-explode class="'+(ui.sceneExploded?'active':'')+'">'+(ui.sceneExploded?'Ghép tầng':'Tách tầng')+'</button><button data-studio3d-reset>⌂ Góc đẹp</button></div></div><div class="v61-3d-hud">'+BMH.v6Kpi('Diện tích',BMH.num(BMH.planArea())+' m²')+BMH.v6Kpi('Số tầng',p.site.floors+'')+BMH.v6Kpi('Dự toán',BMH.money(e.total))+BMH.v6Kpi('Tiện nghi',r.comfort+'/100')+'</div><div class="v61-3d-tip">Kéo để xoay · lăn chuột hoặc chụm hai ngón để zoom</div></section>'
   +'<aside class="v6-card v6-3d-ai">'+BMH.v6PanelTitle('✦','AI đánh giá phương án','Đọc dữ liệu dự án hiện tại.')+'<div class="v6-advice"><article><i>⌖</i><div><b>Vị trí & khí hậu</b><span>'+r.ventilation+'/100 · nắng, gió và thông thoáng.</span></div></article><article><i>⌂</i><div><b>Công năng sống</b><span>'+r.comfort+'/100 · mức thoải mái cho gia đình.</span></div></article><article><i>☀</i><div><b>Năng lượng</b><span>'+perf.energyScore+'/100 · PV có thể phủ khoảng '+perf.solarCoverage+'% nhu cầu tự dùng.</span></div></article><article><i>'+(e.gap>=0?'✓':'!')+'</i><div><b>Ngân sách</b><span>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' dự phòng.':'Vượt '+BMH.money(Math.abs(e.gap))+' so với trần ngân sách.')+'</span></div></article></div><div class="v61-cinematic-card"><img src="'+BMH.v6Esc(currentRender||'assets/rooms/facade-render.jpg')+'" alt=""><div><small>PHỐI CẢNH CẢM XÚC</small><b>'+(currentRender?'Phối cảnh AI hiện tại':'Ảnh tham khảo · chưa là nhà của bạn')+'</b><button data-cinematic-render '+(BMH.cinematicRender?.loading?'disabled':'')+'>✦ '+(BMH.cinematicRender?.loading?'Đang tạo…':'Tạo phối cảnh AI')+'</button><span class="v69-render-note">Ảnh AI có thể phát sinh phí Gemini; chỉ gửi khi bạn bấm. 3D kỹ thuật vẫn miễn phí.</span>'+(BMH.cinematicRender?.error?'<span class="v69-render-error">'+BMH.v6Esc(BMH.cinematicRender.error)+'</span>':'')+'</div></div></aside>'
   +BMH.houseStylePanel()+'</div>';
};

BMH.v71PriceEvidence=e=>{
  const b=e.basis,labels={floor:'Sàn/gạch',paint:'Sơn',door:'Cửa/kính'},quotes=e.materialQuotes||[];
  return '<section class="v6-card v71-price-evidence">'+BMH.v6PanelTitle('▤','Giá nào đang tính vào dự toán?','Tổng tiền cập nhật ngay khi giá m² có nguồn được nhập cho vật liệu đang chọn.')
    +'<div class="v71-price-basis"><article><small>PHẦN THÔ / m²</small><b>'+BMH.money(b.shellPerM2)+'</b><span>'+BMH.v6Esc(b.sourceLabel)+'</span></article><article><small>HOÀN THIỆN / m²</small><b>'+BMH.money(b.finishPerM2)+'</b><span>'+BMH.v6Esc(b.sourceDate||'Chưa có ngày báo giá · baseline lập kế hoạch')+'</span></article><article><small>LOGISTICS</small><b>'+BMH.money(e.transport)+'</b><span>'+BMH.v6Esc(e.adaptation.transportSource||'Ước tính theo đường khai báo')+'</span></article></div>'
    +(quotes.length?'<div class="v71-price-quotes">'+quotes.map(q=>'<article><div><b>'+labels[q.category]+'</b><span>'+BMH.v6Esc(q.source)+' · '+BMH.v6Esc(q.date)+'</span><small>'+BMH.num(q.quantity,1)+' m² × '+BMH.money(q.unitPrice)+'/m²</small></div><strong>'+BMH.money(q.amount)+'</strong><em class="'+(q.delta>0?'up':'')+'">'+(q.delta>=0?'+':'−')+BMH.money(Math.abs(q.delta))+' so với phần phân bổ ban đầu</em></article>').join('')+'</div>':'<p>Chưa có giá vật liệu m² có nguồn được tính vào tổng. Giá trưng bày ở showroom chỉ để tham khảo.</p>')
    +'<p class="v71-price-warning">'+(e.areaSource==='plan'?'Diện tích lấy từ phòng trên mặt bằng không chồng lấn.':'Mặt bằng chưa đủ hoặc có xung đột; diện tích đang tạm tính.')+' Giá kết cấu, nhân công và MEP chưa được bóc tách/chốt với kỹ sư và nhà thầu.</p><button class="v6-secondary" data-nav="5">Xem vật liệu và nhập báo giá →</button></section>';
};
BMH.screen8=()=>{
  const e=BMH.estimate(),perf=BMH.performancePlan(),snap=BMH.createDossierSnapshot(),c=snap.summary.completeness,rows=[['Móng & nền',e.shell*.25],['Phần thô',e.shell*.75],['Hoàn thiện',e.finish*.58],['MEP',e.finish*.22],['Nội thất',e.finish*.20],['Vận chuyển',e.transport],['Thích ứng khí hậu',e.climatePrep],['Năng lượng & nước',e.performanceUpgrade],['Chuẩn bị',e.prep],['Dự phòng',e.contingency]].filter(x=>x[1]>0),max=Math.max(...rows.map(x=>x[1]),1);
  return '<div class="v6-s8">'
   +'<section class="v6-card v6-cost-head">'+BMH.v6Title(7,'DỰ TOÁN','Biết tiền đi đâu trước khi công trình bắt đầu.','Mỗi thay đổi ở quy mô, vật liệu và hiệu suất đều đi vào tổng dự toán này.')+'<div class="v6-cost-total"><small>'+(e.areaSource==='plan'?'TỔNG ƯỚC TÍNH':'ƯỚC TÍNH SƠ BỘ · CHƯA CHỐT MẶT BẰNG')+'</small><b>'+BMH.money(e.total)+'</b><span>Diện tích tính '+BMH.num(e.area,1)+' m² · Ngân sách mục tiêu '+BMH.money(e.budget)+'</span></div></section>'
   +'<section class="v6-card v6-cost-main"><div class="v6-cost-image"><img src="assets/design/hero-step1.jpg"><div><span>NHÀ CỦA BẠN</span><b>'+BMH.state.project.site.floors+' tầng · '+BMH.num(e.area,1)+' m²'+(e.areaSource==='plan'?' theo mặt bằng':' sơ bộ')+'</b></div></div><div class="v6-cost-bars">'+BMH.v6PanelTitle('≋','Cơ cấu chi phí','Từng nhóm chi phí đã cộng vào tổng; khối lượng vẫn cần bóc tách từ hồ sơ kỹ thuật.')+(e.areaSource==='provisional'?'<p class="v68-estimate-caveat">Chưa đủ phòng trên các tầng. Diện tích hiện ước theo khung xây dựng và số tầng; hãy tạo/chốt mặt bằng ở Bước 4 để dự toán bám sát bản vẽ.</p>':'')+rows.map(x=>'<article><div><b>'+x[0]+'</b><span>'+Math.round(x[1]/Math.max(1,e.total)*100)+'%</span></div><i><b style="width:'+Math.max(8,Math.round(x[1]/max*100))+'%"></b></i><strong>'+BMH.money(x[1])+'</strong></article>').join('')+'</div></section>'
   +'<aside class="v6-card v6-doc-status">'+BMH.v6PanelTitle('▣','Mức hoàn thiện hồ sơ','Theo dữ liệu đã có trong dự án.')+'<div class="v6-ring compact" style="--p:'+c.percent+'"><div><b>'+c.percent+'%</b><span>hoàn thiện</span></div></div><div class="v6-doc-list">'+c.parts.map(x=>'<span>'+(x.ok?'✓':'○')+' '+BMH.v6Esc(x.name)+'</span>').join('')+'</div><button class="v6-secondary full" data-export="estimate">Tải dự toán ↓</button></aside>'
   +BMH.v71PriceEvidence(e)
   +'<section class="v6-card v6-ops">'+BMH.v6Kpi('Điện vận hành / năm',BMH.money(perf.annualElectricCost))+BMH.v6Kpi('Tiết kiệm / năm',BMH.money(perf.annualEnergySavings))+BMH.v6Kpi('Sản lượng PV',BMH.num(perf.solarYield,0)+' kWh')+BMH.v6Kpi('Tiết kiệm 10 năm',BMH.money(perf.tenYearSavings))+'</section>'
   +'</div>';
};

BMH.v69EvidenceCard=(x,stages)=>'<article class="v69-evidence-row"><i>'+(x.type==='application/pdf'?'▤':'▧')+'</i><div><b>'+BMH.v6Esc(x.name)+'</b><span>'+BMH.v6Esc(stages[x.stage]||'Giai đoạn')+' · '+BMH.num(x.size/1048576,1)+' MB · '+BMH.v6Esc(x.addedAt?new Date(x.addedAt).toLocaleDateString('vi-VN'):'')+'</span></div><button data-evidence-open="'+BMH.v6Esc(x.id)+'">Xem</button><button data-evidence-delete="'+BMH.v6Esc(x.id)+'" aria-label="Xóa '+BMH.v6Esc(x.name)+'">×</button></article>';
BMH.screen9=()=>{
  const d=BMH.state.project.dossier||{},schedule=BMH.dossierSchedule(),mep=BMH.mepChecklistRows(),progress=BMH.clamp(Number(d.progress)||0,0,100),checked=mep.filter(x=>x.checked).length,spent=schedule.reduce((sum,x)=>sum+x.actualSpent,0),planned=schedule.reduce((sum,x)=>sum+x.amount,0),evidence=d.evidence||[],stages=Object.fromEntries(BMH.DOSSIER_STAGE_DEFS.map(x=>[x.id,x.name]));
  return '<div class="v6-s9">'
   +'<section class="v6-card v6-build-head">'+BMH.v6Title(9,'GIÁM SÁT THI CÔNG','Một màn hình để biết công trình đang ở đâu và việc gì chưa được phép bỏ sót.','Tiến độ, checklist MEP và nhật ký hiện trường được gom về một chỗ.')+'<div class="v6-progress"><small>Tổng tiến độ</small><b>'+progress+'%</b><i><span style="width:'+progress+'%"></span></i></div></section>'
   +'<aside class="v6-card v6-timeline">'+BMH.v6PanelTitle('✓','Tiến độ thi công','Nhập số liệu thực tế để theo dõi chênh lệch.')+'<div class="v68-build-inputs"><label>Ngày dự kiến khởi công<input data-path="project.dossier.startDate" type="date" value="'+BMH.v6Esc(d.startDate||'')+'"></label><label>Tiến độ thực tế (%)<input data-path="project.dossier.progress" type="number" min="0" max="100" value="'+progress+'"></label></div><div class="v68-build-total"><span>Đã ghi chi phí: <b>'+BMH.money(spent)+'</b></span><span>Dự toán: <b>'+BMH.money(planned)+'</b></span></div><div>'+schedule.map(x=>'<article class="'+x.status+'"><i>'+(x.status==='done'?'✓':x.status==='active'?'●':'○')+'</i><div><b>'+BMH.v6Esc(x.name)+'</b><span>'+(x.start?BMH.dateLabel(x.start)+' → '+BMH.dateLabel(x.end):'Chưa đặt ngày khởi công')+'</span><label class="v68-build-cost">Chi phí thực tế (triệu)<input type="number" min="0" step="1" data-scale="1000000" data-path="project.dossier.actualCosts.'+x.id+'" value="'+Math.round(x.actualSpent/1000000)+'"></label><small>Kế hoạch '+BMH.money(x.amount)+(x.actualSpent>x.amount?' · Vượt phân bổ '+BMH.money(x.actualSpent-x.amount):'')+'</small></div><em>'+(x.status==='done'?'Hoàn thành':x.status==='active'?'Đang làm':'Chưa bắt đầu')+'</em></article>').join('')+'</div></aside>'
   +'<section class="v6-build-main"><div class="v6-card v6-site-log">'+BMH.v6PanelTitle('▧','Nhật ký hiện trường',evidence.length+' tệp thực tế theo giai đoạn')+'<div class="v69-evidence-upload"><label>Giai đoạn<select data-path="project.dossier.currentStage">'+BMH.DOSSIER_STAGE_DEFS.map(x=>'<option value="'+x.id+'" '+(d.currentStage===x.id?'selected':'')+'>'+BMH.v6Esc(x.name)+'</option>').join('')+'</select></label><label class="v69-file-picker">＋ Thêm ảnh hoặc PDF<input type="file" data-evidence-upload multiple accept="image/jpeg,image/png,image/webp,application/pdf"></label></div><p class="v69-evidence-note">Tệp lưu trên trình duyệt này, tối đa 8 MB/tệp và 30 tệp. Tải ZIP ở Bước 10 để sao lưu cùng hồ sơ.</p>'+(evidence.length?'<div class="v69-evidence-list">'+evidence.map(x=>BMH.v69EvidenceCard(x,stages)).join('')+'</div>':'<div class="v6-site-empty"><i>＋</i><div><b>Chưa có ảnh/hồ sơ thực địa</b><span>Chọn giai đoạn rồi thêm ảnh hoặc PDF để lưu chứng cứ thi công thật.</span></div></div>')+'</div><div class="v6-card v6-mep">'+BMH.v6PanelTitle('⚙','Checklist nghiệm thu MEP',checked+'/'+mep.length+' hạng mục đã kiểm')+'<div>'+mep.map(x=>'<label><input type="checkbox" data-check="'+x.id+'" '+(x.checked?'checked':'')+'><i>'+(x.checked?'✓':'○')+'</i><span>'+BMH.v6Esc(x.name)+'</span><em>'+(x.checked?'Đã kiểm':'Chưa kiểm')+'</em></label>').join('')+'</div></div></section>'
   +'<aside class="v6-card v6-supervisor">'+BMH.v6PanelTitle('✦','AI Giám sát viên','Chỉ phân tích dữ liệu dự án thật đang có.')+'<div class="v6-advice"><article><i>✓</i><div><b>Tiến độ</b><span>'+progress+'% dự án đã được ghi nhận.</span></div></article><article><i>'+(mep.length-checked>4?'!':'✓')+'</i><div><b>MEP</b><span>'+(mep.length-checked)+' hạng mục chưa đánh dấu kiểm.</span></div></article><article><i>!</i><div><b>Dữ liệu hiện trường</b><span>'+evidence.length+' tệp đã lưu cục bộ. AI chưa tự xác minh chất lượng ảnh/hồ sơ.</span></div></article></div><div class="v6-next-card"><small>Ưu tiên</small><b>Khóa checklist kỹ thuật trước khi tô tường, đóng trần hoặc che hệ MEP.</b><button data-ai-open>Hỏi AI →</button></div></aside>'
   +'</div>';
};

BMH.screen10=()=>{
  const snap=BMH.createDossierSnapshot(),e=BMH.estimate(),c=snap.summary.completeness,perf=BMH.performancePlan(),progress=BMH.clamp(Number(BMH.state.project.dossier?.progress)||0,0,100),docs=[['dossier-pdf','⌂','Hồ sơ kiến trúc'],['drawings','▱','Bộ bản vẽ'],['dossier-excel','▤','Workbook dự án'],['estimate','◔','Dự toán tổng'],['mep-pdf','⚙','Hồ sơ MEP'],['bundle','▣','Trọn bộ hồ sơ']];
  return '<div class="v6-s10">'
   +'<section class="v6-card v6-handover"><div>'+BMH.v6Title(10,'BÀN GIAO','Mọi quyết định của ngôi nhà được gom thành một hồ sơ có thể mang đi làm việc thật.','Dùng bộ hồ sơ này để trao đổi với kiến trúc sư, kỹ sư, nhà thầu và gia đình. Hồ sơ thi công chính thức vẫn cần người có chuyên môn kiểm tra và ký xác nhận.')+'<blockquote>“Không chỉ là một ngôi nhà,<br>mà là nơi bắt đầu những hành trình hạnh phúc.”</blockquote></div><div class="v6-handover-image"><img src="assets/design/hero-step1.jpg"><span>BUILD MY HOME · HỒ SƠ DỰ ÁN</span></div><div class="v6-handover-status">'+BMH.v6Kpi('Phương án',c.parts.find(x=>x.name.startsWith('Bản vẽ sơ bộ'))?.ok?'Có mặt bằng':'Chưa hoàn thiện')+BMH.v6Kpi('Dự toán',e.areaSource==='plan'?'Theo bản vẽ':'Sơ bộ')+BMH.v6Kpi('Thi công',progress+'%')+BMH.v6Kpi('Hồ sơ',c.percent+'% sẵn sàng')+'</div></section>'
   +'<section class="v6-card v6-docs">'+BMH.v6PanelTitle('▣','Bộ hồ sơ bàn giao',c.done+'/'+c.total+' nhóm dữ liệu đã hoàn thiện.')+'<div>'+docs.map(x=>'<button data-export="'+x[0]+'"><i>'+x[1]+'</i><span><b>'+x[2]+'</b><small>Tải xuống / xuất file</small></span><em>↓</em></button>').join('')+'</div></section>'
   +'<aside class="v6-card v6-summary">'+BMH.v6PanelTitle('⌂','Tổng kết tổ ấm','Những con số đáng nhớ của dự án.')+'<div class="v6-kpi-grid">'+BMH.v6Kpi('Diện tích',BMH.num(snap.summary.grossArea,1)+' m²')+BMH.v6Kpi('Số tầng',BMH.state.project.site.floors+' tầng')+BMH.v6Kpi('Dự toán',BMH.money(e.total))+BMH.v6Kpi('PV ước tính',BMH.num(perf.solarCapacity,1)+' kWp')+BMH.v6Kpi('Tiết kiệm 10 năm',BMH.money(perf.tenYearSavings))+BMH.v6Kpi('Hồ sơ',c.percent+'%')+'</div><button class="v6-primary full" data-nav="1">Xem lại hành trình →</button></aside>'
   +'</div>';
};

BMH.SCREENS=[BMH.screen1,BMH.screen3,BMH.screen4,BMH.screen5,BMH.screen6,BMH.screen7,BMH.screen8,BMH.screen2,BMH.screen9,BMH.screen10];

BMH.afterRender=()=>{
  const step=BMH.state.ui.step;
  if(step===1){
    ['all','video','image','pdf'].forEach(x=>BMH.v6EnsureUploadInput?.(x));
    if(BMH.state.ui.homeMode==='finish')BMH.v6MountShellResearch();
    const last=Number(BMH.v6.aiStatus?.checkedAt)||0;
    if(Date.now()-last>15000)BMH.v6RefreshAIConfig?.({force:false,render:true});
  }
  if(step===8){
    BMH.v65LoadBankLogos?.();
  }
  if(step===2){
    BMH.installFallbackPinCapture?.();
    BMH.loadLiveWeather?.();BMH.loadClimateHistory?.();BMH.loadSiteIntelligence?.();
    setTimeout(()=>Promise.resolve(BMH.initMapStudio?.()).catch(()=>{}),120);
  }
  if(step===4)setTimeout(()=>BMH.v61OrientPlanner?.(),40);
  if(step===6)Promise.resolve(BMH.mountStudio3D?.()).catch(()=>{document.querySelector('#studio3dStage')?.classList.add('three-failed');document.querySelector('#studio3dLoading')?.remove();});
};

BMH.v6EditFact=key=>{
  const jump=(step,selector,label)=>{BMH.navigateTo(step);setTimeout(()=>{const el=document.querySelector(selector);el?.scrollIntoView({behavior:'smooth',block:'center'});if(el?.matches?.('input,select,textarea'))el.focus();},140);if(label)BMH.toast(label);};
  if(key==='style'){
    const current=String(BMH.state.project.style||'Hiện đại, tối giản'),next=window.prompt('Phong cách mong muốn cho ngôi nhà:',current);
    if(next!==null&&next.trim()){BMH.state.project.style=next.trim().slice(0,80);BMH.save();BMH.render({preserveScroll:true});BMH.toast('Đã cập nhật phong cách.');}
    return;
  }
  if(key==='floors'||key==='climate'){BMH.state.ui.onboardingComplete=false;BMH.state.ui.onboardingStep=1;BMH.save();BMH.render();BMH.toast('Đã mở lại phần Vị trí & quy mô nền.');return;}
  if(key==='budget'){BMH.state.ui.onboardingComplete=false;BMH.state.ui.onboardingStep=2;BMH.save();BMH.render();BMH.toast('Đã mở lại phần Tài chính sơ bộ.');return;}
  if(key==='household'){BMH.state.ui.onboardingComplete=false;BMH.state.ui.onboardingStep=3;BMH.save();BMH.render();BMH.toast('Đã mở lại hồ sơ Gia đình.');return;}
  if(key==='area')return jump(4,'.v6-plan-main','Đã mở Bản vẽ để chỉnh diện tích và phòng.');
};
BMH.v6GlobalSearch=q=>{
  const s=String(q||'').trim().toLowerCase();if(!s)return;
  const go=(step,label)=>{BMH.navigateTo(step);BMH.toast('Đã mở '+label+'.');};
  if(/vật liệu|vat lieu|báo giá|bao gia|sơn|gạch|thep|thép/.test(s))return go(5,'Gói vật liệu');
  if(/tài chính|tai chinh|ngân sách|ngan sach|vay|dti/.test(s))return go(8,'Hồ sơ tài chính & DTI');
  if(/vị trí|vi tri|khí hậu|khi hau|bản đồ|ban do/.test(s))return go(2,'Vị trí & khí hậu');
  if(/phong thủy|phong thuy|địa chất|dia chat|gia đình|gia dinh/.test(s))return go(3,'Đất, địa chất & gia đình');
  if(/bản vẽ|ban ve|mặt bằng|mat bang|phòng|phong/.test(s))return go(4,'Bản vẽ thiết kế');
  if(/3d|mô phỏng|mo phong/.test(s))return go(6,'Mô phỏng 3D');
  if(/dự toán|du toan|chi phí|chi phi|thanh toán|thanh toan/.test(s))return go(7,'Dự toán & thanh toán');
  if(/thi công|thi cong|mep|giám sát|giam sat/.test(s))return go(9,'Giám sát thi công');
  if(/hồ sơ|ho so|bàn giao|ban giao|giải ngân|giai ngan/.test(s))return go(10,'Hồ sơ bàn giao');
  if(/ai|tư vấn|tu van|chuyên gia|chuyen gia/.test(s)){BMH.aiOpen?.();return;}
  if(BMH.state.ui.step!==1)BMH.navigateTo(1);BMH.v6.ideaExpanded=true;BMH.render({preserveScroll:true});setTimeout(()=>document.querySelector('.step01-ideas')?.scrollIntoView({behavior:'smooth',block:'center'}),80);BMH.toast('Đã mở Thư viện ý tưởng gần nhất với từ khóa.');
};

document.addEventListener('click',e=>{
  const jump=e.target.closest?.('[data-setup-jump]');
  if(jump){const next=BMH.clamp(Number(jump.dataset.setupJump)||1,1,3),current=BMH.state.ui.onboardingStep||1;if(next>current&&!BMH.v6SetupValidate(current))return;BMH.state.ui.onboardingStep=next;BMH.save();BMH.render();return;}
  if(e.target.closest?.('[data-setup-back]')){BMH.state.ui.onboardingStep=Math.max(1,(BMH.state.ui.onboardingStep||1)-1);BMH.save();BMH.render();return;}
  if(e.target.closest?.('[data-setup-next]')){const current=BMH.state.ui.onboardingStep||1;if(!BMH.v6SetupValidate(current))return;BMH.state.ui.onboardingStep=Math.min(3,current+1);BMH.save();BMH.render();return;}
  if(e.target.closest?.('[data-setup-finish]')){if(!BMH.v6SetupValidate(3))return;BMH.syncHouseholdSize?.();BMH.state.ui.onboardingComplete=true;BMH.state.ui.onboardingStep=3;BMH.state.ui.step=1;BMH.state.project.source='setup';BMH.state.project.brief={...(BMH.state.project.brief||{}),provider:'',model:'',notice:'Hồ sơ nền vừa được cập nhật. Hãy tạo lại concept AI để đồng bộ.',updatedAt:new Date().toISOString(),result:{},aiSuggestions:{}};BMH.v6.briefResult=null;BMH.v6.briefProvider='';BMH.v6.briefNotice=BMH.state.project.brief.notice;BMH.save();BMH.render();BMH.toast('Hồ sơ nền đã sẵn sàng · bắt đầu AI Home Vision.');return;}
});

document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-bank-rate-refresh]')){
    e.preventDefault();
    const bank=BMH.BANKS.find(x=>x.id===BMH.state.project.finance.bank)||BMH.BANKS[0];
    BMH.v65RefreshBankRate?.(bank,{force:true,silent:false});return;
  }
  const bankFilter=e.target.closest?.('[data-bank-filter]');
  if(bankFilter){e.preventDefault();BMH.v6.bankCategory=bankFilter.dataset.bankFilter||'all';BMH.render({preserveScroll:true});return;}
  const global=e.target.closest?.('[data-v6-global]');
  if(global){
    const action=global.dataset.v6Global;
    if(action==='ideas'){ if(BMH.state.ui.step!==1)BMH.navigateTo(1);BMH.v6.ideaExpanded=true;BMH.render({preserveScroll:true});setTimeout(()=>document.querySelector('.step01-ideas')?.scrollIntoView({behavior:'smooth',block:'center'}),60);return; }
    if(action==='ai'){ BMH.aiOpen?.(); return; }
    if(action==='setup'){ BMH.state.ui.onboardingComplete=false;BMH.state.ui.onboardingStep=1;BMH.save();BMH.render();return; }
    if(action==='notifications'){
      if(BMH.v6.briefError){if(BMH.state.ui.step!==1)BMH.navigateTo(1);setTimeout(()=>document.querySelector('.step01-error')?.scrollIntoView({behavior:'smooth',block:'center'}),80);}
      else BMH.toast?.('Không có thông báo mới.');
      return;
    }
  }
  if(e.target.closest?.('[data-s1-ideas-toggle]')){e.preventDefault();BMH.v6.ideaExpanded=!BMH.v6.ideaExpanded;BMH.render({preserveScroll:true});setTimeout(()=>document.querySelector('.step01-ideas')?.scrollIntoView({behavior:'smooth',block:'center'}),40);return;}
  if(e.target.closest?.('[data-s1-prelim-toggle]')){e.preventDefault();BMH.v6.prelimExpanded=!BMH.v6.prelimExpanded;BMH.render({preserveScroll:true});setTimeout(()=>document.querySelector('.step01-prelim')?.scrollIntoView({behavior:'smooth',block:'center'}),40);return;}
  const edit=e.target.closest?.('[data-s1-edit]');if(edit){e.preventDefault();BMH.v6EditFact(edit.dataset.s1Edit);return;}
  const upload=e.target.closest?.('[data-s1-upload]');
  if(upload){
    e.preventDefault();
    BMH.v6OpenUploadPicker?.(upload.dataset.s1Upload||'all');return;
  }
  if(e.target.closest?.('[data-s1-focus-prompt]')){ e.preventDefault();const t=BMH.$('#aiStartPrompt'); t?.focus(); t?.scrollIntoView({behavior:'smooth',block:'center'}); return; }
  const hero=e.target.closest?.('[data-s1-hero]');
  if(hero){
    e.preventDefault();
    const total=Math.max(1,document.querySelectorAll('[data-s1-dot]').length),delta=Number(hero.dataset.s1Hero)||0,current=Number(BMH.v6.s1HeroIndex)||0;
    BMH.v6.s1HeroIndex=(current+delta+total)%total;
    BMH.render({preserveScroll:true}); return;
  }
  const dot=e.target.closest?.('[data-s1-dot]');
  if(dot){ e.preventDefault();BMH.v6.s1HeroIndex=Number(dot.dataset.s1Dot)||0; BMH.render({preserveScroll:true}); return; }
});

document.addEventListener('change',e=>{
  const t=e.target;
  if(!t?.id||!Object.values(BMH.v6UploadInputIds||{}).includes(t.id))return;
  const files=[...(t.files||[])];t.value='';
  if(files.length){BMH.toast('Đã nhận '+files.length+' tệp · đang đưa vào Step 1…');BMH.v6ReceiveFiles(files,BMH.scan?.intent||'reference');}
});

document.addEventListener('input',e=>{
  if(e.target?.matches?.('[data-bank-menu-search]')){
    const menu=e.target.closest('.v64-bank-menu'),q=String(e.target.value||'').trim().toLowerCase();
    if(menu){
      let visible=0;
      menu.querySelectorAll('[data-bank-option]').forEach(row=>{
        const ok=!q||String(row.dataset.bankSearch||'').includes(q);
        row.hidden=!ok;if(ok)visible++;
      });
      const n=menu.querySelector('[data-bank-menu-count]');if(n)n.textContent=visible+' ngân hàng';
    }
    return;
  }
  if(e.target?.id==='bankSearch'){
    BMH.v6.bankQuery=e.target.value||'';
    clearTimeout(BMH.v6.bankSearchTimer);
    BMH.v6.bankSearchTimer=setTimeout(()=>BMH.render({preserveScroll:true}),120);
    return;
  }
  if(e.target?.id==='aiStartPrompt'){
    BMH.v6.ideaDraft=e.target.value;
    const n=document.querySelector('#step01PromptCount'); if(n)n.textContent=String(e.target.value.length);
  }
});

document.addEventListener('click',e=>{
  if(e.target.closest?.('[data-s1-research]')){e.preventDefault();BMH.v6RunDesignResearch();return;}
  const reference=e.target.closest?.('[data-s1-reference]');if(reference){e.preventDefault();BMH.v6SelectDesignReference(reference.dataset.s1Reference);return;}
  if(e.target.closest?.('[data-s1-analyze]')){e.preventDefault();BMH.v6AnalyzeBrief();return;}
  if(e.target.closest?.('[data-s1-ai-refresh]')){e.preventDefault();BMH.v6RefreshAIConfig({force:true,render:true});return;}
  const rm=e.target.closest?.('[data-s1-remove]');
  if(rm){
    e.preventDefault();
    const id=rm.dataset.s1Remove;
    const row=(BMH.v6.uploads||[]).find(x=>x.id===id);
    if(row?.previewUrl)try{URL.revokeObjectURL(row.previewUrl);}catch(_){}
    BMH.v6.uploads=(BMH.v6.uploads||[]).filter(x=>x.id!==id);
    if(BMH.v6.upload?.id===id)BMH.v6.upload=BMH.v6.uploads.find(x=>x.dataUrl||x.previewUrl)||null;
    BMH.v6PersistSourceRefs();BMH.save();BMH.render({preserveScroll:true});return;
  }
});

document.addEventListener('change',e=>{
  const t=e.target;if(!t?.matches?.('[data-s1-research-filter]'))return;
  const key=t.dataset.s1ResearchFilter,value=String(t.value||'');
  if(key==='filter'&&['all','library','research'].includes(value)||key==='styleFilter'&&(!value||(BMH.HOUSE_STYLES||[]).some(s=>s.id===value))){BMH.v6DesignResearch[key]=value;BMH.render({preserveScroll:true});}
});

document.addEventListener('dragover',e=>{
  const z=e.target.closest?.('.step01-drop');if(z){e.preventDefault();z.classList.add('dragging');}
});
document.addEventListener('dragleave',e=>{
  const z=e.target.closest?.('.step01-drop');if(z)z.classList.remove('dragging');
});
document.addEventListener('drop',e=>{
  const z=e.target.closest?.('.step01-drop');if(!z)return;
  e.preventDefault();z.classList.remove('dragging');
  const files=[...(e.dataTransfer?.files||[])];if(files.length)BMH.v6ReceiveFiles(files,BMH.scan?.intent||'reference');
});

document.addEventListener('keydown',e=>{
  if(e.target?.id==='globalSearch'&&e.key==='Enter'){
    const q=e.target.value.trim(); if(!q)return;
    BMH.v6GlobalSearch(q);
  }
});

document.addEventListener('click',e=>{
  if(!e.target.closest?.('#app'))return;
  const evidenceOpen=e.target.closest('[data-evidence-open]');
  if(evidenceOpen){e.preventDefault();BMH.openEvidence(evidenceOpen.dataset.evidenceOpen);return;}
  const evidenceDelete=e.target.closest('[data-evidence-delete]');
  if(evidenceDelete){e.preventDefault();BMH.deleteEvidence(evidenceDelete.dataset.evidenceDelete);return;}
  const pt=e.target.closest('[data-v6-partner]');
  if(pt){BMH.state.project.household.partnerEnabled=pt.dataset.v6Partner==='on';BMH.syncHouseholdSize?.();BMH.save();BMH.render({preserveScroll:true});return;}
  if(e.target.closest('[data-v6-feng]')){e.preventDefault();BMH.v6RunFeng();return;}
});

document.addEventListener('change',e=>{
  if(e.target?.matches?.('[data-evidence-upload]')){
    const files=[...(e.target.files||[])],stage=BMH.state.project.dossier.currentStage;e.target.value='';
    if(files.length)BMH.addEvidenceFiles(files,stage);
    return;
  }
  const person=e.target.closest?.('[data-v6-person]');
  if(person){
    const h=BMH.state.project.household,key=person.dataset.v6Person==='child'?'children':'relatives',row=h[key].find(x=>x.id===person.dataset.id);
    if(row){row[person.dataset.key]=person.dataset.key==='birth'?Number(person.value):person.value;BMH.syncHouseholdSize?.();BMH.save();BMH.render({preserveScroll:true});}
    return;
  }
  const rf=e.target.closest?.('[data-v6-room]');
  if(rf){
    const id=BMH.state.ui.planner.selected,room=BMH.state.project.plan.rooms.find(x=>x.id===id);
    if(room){
      if(BMH.isRoomLocked(id)){BMH.toast('Phòng hoặc tầng đang khóa.');BMH.render({preserveScroll:true});return;}
      const key=rf.dataset.v6Room,next=key==='name'?rf.value.trim().slice(0,80):Number(rf.value);
      if(room.type==='elevator'&&['x','y','w','h'].includes(key)&&BMH.editElevatorGeometry){BMH.editElevatorGeometry(key,next);return;}
      if(key==='name'&&!next){BMH.toast('Hãy nhập tên phòng.');BMH.render({preserveScroll:true});return;}
      const candidate=structuredClone(BMH.state.project.plan.rooms),changed=candidate.find(x=>x.id===id);
      changed[key]=next;
      if(key!=='name'&&!BMH.layoutValid(candidate)){BMH.toast('Kích thước làm phòng chồng nhau, quá ranh hoặc nhỏ hơn 0,6 m.');BMH.render({preserveScroll:true});return;}
      BMH.pushPlanHistory();BMH.state.project.plan.rooms=candidate;BMH.save();BMH.render({preserveScroll:true});
    }
  }
});

BMH.renderStudio=BMH.render;
BMH.render=(opts={})=>{
  if(BMH.state?.ui?.onboardingComplete===false&&!(BMH.state.ui.homeMode==='finish'&&BMH.state.ui.step===1)&&typeof BMH.v6SetupScreen==='function'){
    const sy=window.scrollY,appRoot=BMH.root();BMH.disposeStudio3D?.();
    if(appRoot)appRoot.innerHTML=BMH.v6SetupScreen();
    document.documentElement.dataset.version=BMH.VERSION;
    document.title='Build My Home · Khởi tạo dự án';
    if(opts.preserveScroll)window.scrollTo(0,sy);else window.scrollTo(0,0);
    return;
  }
  return BMH.renderStudio(opts);
};

BMH.navigateTo=((base)=>step=>{
  step=BMH.clamp(Number(step)||1,1,10);
  if(step===4&&BMH.state.ui.step!==4){
    Object.assign(BMH.state.ui.planner,{view:'plan',floor:0,zoom:1,tool:'select',showFeng:false,showEnvironment:false,showCirculation:false,showClimate:false,showEnvelope:false,showSectionLine:false,showBelow:false,showFurniture:true,showDimensions:true});
  }
  return base(step);
})(BMH.navigateTo);

document.documentElement.className=document.documentElement.className.replace(/\bbmh-v\d+\b/g,'').trim();
document.documentElement.classList.add('bmh-v60');
document.documentElement.dataset.version=BMH.VERSION;
try{BMH.render({preserveScroll:true});}catch(_){}


/* V6.1 critical runtime helpers */
BMH.v61OrientPlanner=()=>{
  const box=document.querySelector('.v6-plan-canvas'),svg=box?.querySelector('svg[data-auto-rotate="1"]');
  if(!box)return;
  box.classList.toggle('v61-landscape-plan',!!svg);
  if(!svg)return;
  const w=Math.max(640,box.clientWidth),h=Math.max(500,box.clientHeight);
  svg.style.position='absolute';svg.style.left='50%';svg.style.top='50%';
  svg.style.width=h+'px';svg.style.height=w+'px';
  svg.style.transform='translate(-50%,-50%) rotate(-90deg)';
  svg.style.transformOrigin='50% 50%';
};
