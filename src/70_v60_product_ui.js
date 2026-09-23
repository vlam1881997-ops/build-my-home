/* Build My Home V6.0 — product UI reset.
 * One visual system for all 10 steps. Keeps the existing engines, removes patch-on-patch UI.
 */
BMH.VERSION='6.6.0';
BMH.VISUAL_RELEASE='cost-before-finance-workflow-v660';

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
    +'<nav class="v6-topnav"><button data-nav="1">Ngôi nhà của tôi</button><button data-cloud-open>Dự án</button><button data-v6-global="ideas">Thư viện ý tưởng</button><button data-nav="5">Báo giá vật liệu</button><button data-v6-global="ai">AI tư vấn</button></nav>'
    +'<div class="v6-head-actions"><label class="step01-search"><i>⌕</i><input id="globalSearch" placeholder="Tìm bước, vật liệu, hồ sơ…"></label><button class="step01-bell" data-v6-global="notifications" aria-label="Thông báo">♢'+(alertCount?'<em>'+alertCount+'</em>':'')+'</button><button class="step01-profile" data-v6-global="setup"><i>⌂</i><span><b>Hồ sơ đầu vào</b><small>'+BMH.v6Esc(s.district||s.province)+'</small></span><em>⌄</em></button></div>'
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
  return '<article class="v6-person"><div class="v6-person-head"><i>'+(m.kind==='child'?'☺':'♙')+'</i><div><b>'+BMH.v6Esc(m.name)+'</b><span>'+m.role+'</span></div><button class="danger" data-person-remove="'+m.kind+'" data-id="'+BMH.v6Esc(m.id)+'">Xóa</button></div><label>Tên<input data-v6-person="'+m.kind+'" data-id="'+BMH.v6Esc(m.id)+'" data-key="name" value="'+BMH.v6Esc(m.name)+'"></label><label>Năm sinh<input data-v6-person="'+m.kind+'" data-id="'+BMH.v6Esc(m.id)+'" data-key="birth" type="number" min="1900" max="2026" value="'+m.birth+'"></label></article>';
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
    {img:'assets/rooms/facade-render.jpg',eyebrow:'01 · LOCATION INTELLIGENCE',title:'Bắt đầu từ nơi ngôi nhà sẽ thuộc về.',copy:'Vị trí, khí hậu và quy mô khu đất là nền tảng để mọi đề xuất phía sau có lý do.',pills:['Khí hậu vùng','Quy mô khu đất','Số tầng dự kiến']},
    {img:'assets/design/hero-step1.jpg',eyebrow:'02 · FINANCIAL FRAME',title:'Đẹp đến đâu cũng phải nằm trong khả năng thực hiện.',copy:'Khóa một trần ngân sách thực tế trước khi AI tạo concept để tránh những phương án đẹp nhưng không thể xây.',pills:['Ngân sách mục tiêu','Thu nhập hộ gia đình','Không tự tăng ngân sách']},
    {img:'assets/rooms/living-local.jpg',eyebrow:'03 · FAMILY DNA',title:'Ngôi nhà được thiết kế cho những người sẽ sống trong đó.',copy:'AI cần hiểu gia đình trước khi nghĩ về phòng, ánh sáng, sự riêng tư và cách mọi người gặp nhau mỗi ngày.',pills:['Thành viên','Phòng ngủ gợi ý','Nhu cầu sinh hoạt']}
  ][stage-1];
  const progress=Math.round(stage/3*100);
  const stepper='<nav class="setup-stepper">'+BMH.v6SetupSteps.map((x,i)=>{const n=i+1;return '<button data-setup-jump="'+n+'" class="'+(stage===n?'active ':'')+(stage>n?'done':'')+'"><i>'+(stage>n?'✓':String(n).padStart(2,'0'))+'</i><span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></button>';}).join('')+'</nav>';
  const footer='<footer class="setup-footer"><button data-setup-back '+(stage===1?'disabled':'')+'>← Quay lại</button><div><small>HỒ SƠ NỀN</small><b>'+progress+'% hoàn tất</b></div>'+(stage<3?'<button class="primary" data-setup-next>Tiếp tục <span>→</span></button>':'<button class="primary" data-setup-finish>Vào AI Home Vision <span>→</span></button>')+'</footer>';
  return '<div class="setup-shell">'
    +'<header class="setup-top"><div class="setup-brand"><img src="assets/icon.svg" alt=""><span><b>Build My Home</b><small>KIẾN TẠO TỔ ẤM, CÙNG AI</small></span></div><div class="setup-top-progress"><span><i style="width:'+progress+'%"></i></span><small>'+stage+' / 3</small></div><button data-cloud-open><i>▣</i> Dự án đã lưu</button></header>'
    +'<main class="setup-main setup-premium">'
      +'<aside class="setup-visual"><img src="'+visual.img+'" alt=""><div class="setup-visual-shade"></div><div class="setup-visual-copy"><span>'+visual.eyebrow+'</span><h2>'+visual.title+'</h2><p>'+visual.copy+'</p><div>'+visual.pills.map(x=>'<em>✓ '+x+'</em>').join('')+'</div></div><div class="setup-visual-signature"><i>✦</i><span><b>Build My Home AI</b><small>Hồ sơ nền trước · concept sau</small></span></div></aside>'
      +'<section class="setup-workspace"><div class="setup-workspace-inner">'+stepper+bodies[stage-1]+footer+'</div></section>'
    +'</main>'
  +'</div>';
};

BMH.v6ConceptPrompt=()=>{
  const p=BMH.state.project,s=p.site,f=p.finance,needs=BMH.householdNeeds?.()||{};
  return 'Hãy tạo concept kiến trúc phù hợp cho khu đất '+BMH.num(s.width)+'×'+BMH.num(s.depth)+'m tại '+(s.district||s.province)+', '+s.floors+' tầng, ngân sách mục tiêu '+BMH.money(Number(f.targetBudget)||BMH.financeSummary().available)+', gia đình '+(needs.people||1)+' người. Tập trung vào phong cách, hình khối, ánh sáng, cây xanh và trải nghiệm sống; không thay đổi dữ liệu nền nếu chưa được người dùng xác nhận.';
};

BMH.v6RunFeng=async()=>{
  if(BMH.v6.feng.loading)return;
  if(!BMH.aiConfigured?.()){BMH.v6.feng={loading:false,error:'AI Production chưa được cấu hình.',result:null,citations:[]};BMH.render({preserveScroll:true});return;}
  const h=BMH.state.project.household,s=BMH.state.project.site;
  BMH.v6.feng={loading:true,error:'',result:null,citations:[]};BMH.render({preserveScroll:true});
  try{
    const prompt='Nghiên cứu phong thủy nhà ở bằng Google Search grounding. Hãy đối chiếu nhiều nguồn công khai, ưu tiên nguồn giải thích Bát trạch/Cung phi rõ ràng, không bịa sách hoặc tác giả. Tách rõ phần truyền thống tham khảo khỏi yêu cầu kiến trúc an toàn. Gia đình: '+JSON.stringify(BMH.v6Household().map(x=>({role:x.role,birth:Number(x.birth)||0,gender:x.gender})))+'; khu đất: '+JSON.stringify({province:s.province,district:s.district,frontDirection:s.frontDirection,width:s.width,depth:s.depth,floors:s.floors});
    const data=await BMH.aiCall('fengshui',prompt);
    BMH.v6.feng={loading:false,error:'',result:data.result||null,citations:Array.isArray(data.citations)?data.citations:[]};
  }catch(err){BMH.v6.feng={loading:false,error:err.message||String(err),result:null,citations:[]};}
  BMH.render({preserveScroll:true});
};

BMH.v6FengResult=()=>{
  const st=BMH.v6.feng;
  if(st.loading)return '<div class="v6-ai-research loading"><i>✦</i><div><b>AI đang nghiên cứu đa nguồn…</b><span>Google Search grounding đang đối chiếu các nguồn công khai.</span></div></div>';
  if(st.error)return '<div class="v6-ai-research error"><i>!</i><div><b>Chưa nghiên cứu được</b><span>'+BMH.v6Esc(st.error)+'</span></div></div>';
  if(!st.result)return '<div class="v6-ai-research"><i>✦</i><div><b>Chưa chạy nghiên cứu đa nguồn</b><span>Bấm nút bên trên để AI đối chiếu nguồn web hiện hành.</span></div></div>';
  const r=st.result;
  const rec=(r.home_recommendations||[]).slice(0,5).map(x=>'<article><b>'+BMH.v6Esc(x.area)+'</b><span>'+BMH.v6Esc(x.recommendation)+'</span><small>'+BMH.v6Esc(x.rationale)+'</small></article>').join('');
  const src=(st.citations||[]).slice(0,6).map((x,i)=>'<a target="_blank" rel="noopener noreferrer" href="'+BMH.v6Esc(x.url)+'">'+(i+1)+'. '+BMH.v6Esc(x.title||'Nguồn web')+'</a>').join('');
  return '<div class="v6-feng-result"><div><small>Độ tin cậy tổng hợp '+BMH.clamp(Number(r.confidence)||0,0,100)+'%</small><h4>'+BMH.v6Esc(r.headline||'Kết quả nghiên cứu')+'</h4><p>'+BMH.v6Esc(r.summary||'')+'</p></div><section>'+rec+'</section>'+(src?'<footer><b>Nguồn web</b>'+src+'</footer>':'')+'</div>';
};

BMH.v6MaterialImage=(cat,item)=>{
  if(item?.img)return item.img;
  const map={floor:'assets/materials/tile-viglacera.jpg',paint:'assets/materials/paint-fallback.jpg',door:'assets/materials/aluminium-fallback.jpg',cement:'assets/design/flow-c.jpg',steel:'assets/design/flow-a.jpg',waterproof:'assets/design/flow-b.jpg',mep:'assets/design/flow-c.jpg',sanitary:'assets/rooms/living-local.jpg',roof:'assets/rooms/facade-local.jpg',insulation:'assets/design/flow-b.jpg',lighting:'assets/rooms/living-local.jpg',cabinetry:'assets/rooms/living-local.jpg'};
  return map[cat]||'assets/design/flow-c.jpg';
};
BMH.v6MatMeta={
  floor:['▥','Gạch & sàn'],cement:['▰','Xi măng & bê tông'],steel:['◇','Thép xây dựng'],waterproof:['☂','Chống thấm'],paint:['▧','Sơn hoàn thiện'],mep:['⚙','Điện nước MEP'],door:['▤','Cửa & cửa sổ'],sanitary:['◫','Thiết bị vệ sinh'],roof:['⌂','Mái & chống nóng'],insulation:['≋','Cách nhiệt / cách âm'],lighting:['☀','Chiếu sáng'],cabinetry:['▣','Tủ & nội thất cố định']
};

BMH.screen1=()=>{
  const p=BMH.state.project,e=BMH.estimate(),review=BMH.designReview(),scan=BMH.scanExisting?.(),scanBuilding=scan?.building||{},brief=BMH.v6.briefResult?.brief||{};
  const ready=!!BMH.aiConfigured?.(),climate=BMH.regionProfile(p.site),structuredMembers=BMH.v6Household().length,members=Math.max(structuredMembers,Number(p.household?.requestedSize)||0),needs=BMH.householdNeeds?.()||{},projectedMembers=Math.max(0,members-structuredMembers),familyDetail=projectedMembers?structuredMembers+' hồ sơ chi tiết + '+projectedMembers+' chưa khai báo':structuredMembers+' hồ sơ chi tiết';
  const aiStyle=BMH.v6Esc(p.style||brief.style||scanBuilding.style||'Hiện đại, tối giản');
  const floors=Number(p.site.floors)||Number(brief.floors||scanBuilding.estimated_floors)||2;
  const area=BMH.planArea(),budget=Number(p.finance?.targetBudget)||e.budget||Number(brief.budget_vnd)||0;
  const bedrooms=Number(needs.bedrooms)||Number(brief.bedrooms)||Math.max(2,Math.round(members*.7));
  const uploads=Array.isArray(BMH.v6.uploads)?BMH.v6.uploads:[];
  const currentUpload=BMH.v6.upload;
  const heroSlides=[
    currentUpload?.dataUrl?{img:currentUpload.dataUrl,pos:'center center',kicker:'TỆP CỦA BẠN',title:'Bắt đầu từ chính hình ảnh bạn vừa chọn.',copy:'Tệp đã vào Step 1. Nếu AI online, hệ thống sẽ phân tích nội dung và tạo brief.'}:null,
    {img:'assets/rooms/facade-render.jpg',pos:'58% center',kicker:'CONCEPT THEO HỒ SƠ THẬT',title:aiStyle+' · '+floors+' tầng · '+members+' người',copy:BMH.v6Esc((p.site.district||p.site.province)+' · đất '+BMH.num(p.site.width)+'×'+BMH.num(p.site.depth)+'m · ngân sách '+BMH.money(budget))},
    {img:'assets/design/hero-step1.jpg',pos:'center 48%',kicker:'KHÔNG GIAN & ÁNH SÁNG',title:bedrooms+' phòng ngủ gợi ý cho '+members+' người',copy:'Ưu tiên ánh sáng tự nhiên, thông gió và khoảng xanh theo khí hậu '+BMH.v6Esc(p.site.province)+'.'},
    {img:'assets/rooms/facade-local.jpg',pos:'center 46%',kicker:'MẶT TIỀN THEO BỐI CẢNH',title:'Hình khối hiện đại, dễ bảo trì và bám ngân sách',copy:'Ảnh chỉ là định hướng thẩm mỹ. Quy mô, số tầng, gia đình và ngân sách luôn lấy từ hồ sơ dự án.'}
  ].filter(Boolean);
  const idx=BMH.clamp(Number(BMH.v6.s1HeroIndex)||0,0,Math.max(0,heroSlides.length-1)),slide=heroSlides[idx];
  const fit=Math.max(0,Math.min(100,Math.round((review.comfort+review.function+review.budget)/3)));
  const feasibility=e.gap>=0&&review.overall>=78?'Cao':e.gap>=-e.budget*.08?'Khá':'Cần tối ưu';
  const months=Math.max(5,Math.min(14,Math.round(3.5+p.site.floors*1.5)));
  const result=BMH.v6.briefResult;
  const summary=result?.summary||'AI sẽ rút ra phong cách, quy mô, ngân sách và ưu tiên sau khi bạn gửi ý tưởng hoặc tài liệu.';
  const priorities=(result?.brief?.priorities||[]).slice(0,4);
  const aiStatus=BMH.v6.aiStatus||{};
  const sourceCards=uploads.map(x=>{
    const visual=x.dataUrl?'<img src="'+x.dataUrl+'" alt="">':x.kind==='video'&&x.previewUrl?'<video src="'+BMH.v6Esc(x.previewUrl)+'" muted preload="metadata" playsinline></video>':'<div class="step01-file-icon">'+(x.kind==='video'?'▶':x.kind==='pdf'?'PDF':'DOC')+'</div>';
    const typeLabel=x.kind==='image'?'Ảnh':x.kind==='video'?'Video':x.kind==='pdf'?'PDF':'Tệp';
    return '<article class="step01-source-card uploaded">'+visual+'<button class="step01-remove-source" data-s1-remove="'+BMH.v6Esc(x.id)+'" aria-label="Xóa tài liệu">×</button><span><b>'+BMH.v6Esc(x.name)+'</b><small>'+typeLabel+' · '+BMH.v6Esc(BMH.v6FileSize(x.size))+' · '+BMH.v6Esc(x.status||'Đã nhận tệp')+'</small></span></article>';
  }).join('');
  return '<div class="v6-s1 step01-locked">'
   +'<section class="v6-s1-left v6-card step01-start">'
      +BMH.v6Title(1,'AI HOME VISION','Khám phá ý tưởng','Vị trí, tài chính và gia đình đã được khóa ở phần khởi tạo. Step 1 chỉ tập trung vào hình ảnh, cảm hứng và concept AI.')
      +'<label class="step01-drop" for="step1UploadAll" role="button" tabindex="0"><i>↥</i><b>Kéo thả file vào đây hoặc chọn từ thiết bị</b><span>JPG · PNG · WEBP · MP4 · MOV · PDF</span></label>'
      +'<div class="step01-upload-actions"><label for="step1UploadVideo" role="button" tabindex="0"><i>▶</i><span>Upload video</span></label><label for="step1UploadImage" role="button" tabindex="0"><i>▧</i><span>Upload ảnh</span></label><label for="step1UploadPdf" role="button" tabindex="0"><i class="pdf">PDF</i><span>Upload PDF</span></label><button data-s1-focus-prompt><i>▤</i><span>Nhập ý tưởng</span></button></div>'
      +'<label class="step01-prompt"><i>✎</i><textarea id="aiStartPrompt" maxlength="1000" rows="4" placeholder="Không bắt buộc. Ví dụ: tôi thích mặt tiền hiện đại nhiều cây xanh, ánh sáng ấm, vật liệu gỗ và bê tông, cảm giác nghỉ dưỡng nhưng dễ bảo trì…">'+BMH.v6Esc(BMH.v6.ideaDraft||p.briefIdea||'')+'</textarea><em><span id="step01PromptCount">'+String((BMH.v6.ideaDraft||p.briefIdea||'').length)+'</span>/1000</em></label>'
      +'<button class="step01-analyze '+(ready?'ready':'needs-key')+'" data-s1-analyze '+(BMH.v6.briefLoading?'disabled':'')+'>'+(BMH.v6.briefLoading?'◌ AI đang tạo concept…':'✦ AI tạo concept từ hồ sơ →')+'</button>'
      +'<div class="step01-connection '+(ready?'online':'offline')+'"><i>'+(ready?'✓':'!')+'</i><div><b>'+(ready?'AI server đã cấu hình':'AI server chưa cấu hình')+'</b><span>'+(ready?'Provider ưu tiên: '+BMH.v6Esc(BMH.cloud?.config?.aiProvider||'AI')+' · '+BMH.v6Esc(BMH.cloud?.config?.aiModel||'model server'):(aiStatus.error?BMH.v6Esc(aiStatus.error):'Website production chưa có provider AI khả dụng.'))+'</span></div><button data-s1-ai-refresh>'+(aiStatus.loading?'Đang kiểm tra…':'Kiểm tra trạng thái')+'</button></div>'
      +(BMH.v6.briefNotice?'<div class="step01-notice">'+BMH.v6Esc(BMH.v6.briefNotice)+'</div>':'')
      +(BMH.v6.briefError?'<div class="step01-error">'+BMH.v6Esc(BMH.v6.briefError)+'</div>':'')
    +'</section>'

   +'<section class="v6-s1-hero step01-hero">'
      +'<img src="'+slide.img+'" alt="" style="object-position:'+BMH.v6Esc(slide.pos||'center center')+'"><div class="v6-image-shade"></div>'
      +'<div class="step01-hero-quote"><span>'+slide.kicker+'</span><h2>'+slide.title+'</h2><p>'+slide.copy+'</p><div class="step01-hero-meta"><em>'+BMH.v6Esc(p.site.district||p.site.province)+'</em><em>'+floors+' tầng</em><em>'+members+' người</em><em>'+bedrooms+' PN</em></div></div>'
      +'<div class="step01-hero-badges">'
        +'<article><i>⌂</i><span><small>Số tầng ước tính</small><b>~ '+floors+' tầng</b></span></article>'
        +'<article><i>◇</i><span><small>Phong cách</small><b>'+aiStyle+'</b></span></article>'
        +'<article><i>◉</i><span><small>Ngân sách mục tiêu</small><b>'+BMH.money(budget)+'</b></span></article>'
        +'<article><i>♙</i><span><small>Phù hợp gia đình</small><b>'+members+' thành viên · '+bedrooms+' PN</b></span></article>'
      +'</div>'
      +'<button class="step01-arrow prev" data-s1-hero="-1">←</button><button class="step01-arrow next" data-s1-hero="1">→</button>'
      +'<div class="step01-dots">'+heroSlides.map((_,i)=>'<button data-s1-dot="'+i+'" class="'+(i===idx?'active':'')+'"></button>').join('')+'</div>'
    +'</section>'

   +'<aside class="v6-s1-right v6-card step01-ai">'
      +'<div class="step01-ai-head"><div><i>✦</i><span><b>AI hiểu hồ sơ nền</b><small>'+(result?'Concept vừa được tạo từ hồ sơ nền và cảm hứng của bạn.':'Vị trí, ngân sách và gia đình đã có; chờ AI bổ sung hướng thiết kế.')+'</small></span></div><em class="'+(result&&BMH.v6.briefProvider==='local-fallback'?'warn':ready?'ok':'warn')+'">'+(result&&BMH.v6.briefProvider==='local-fallback'?'Dự phòng':ready?'Sẵn sàng':'Chưa cấu hình')+'</em></div>'
      +'<div class="step01-ai-summary"><b>'+(result?BMH.v6Esc(result.headline||'Concept ban đầu đã sẵn sàng'):'Chưa tạo concept AI')+'</b><p>'+BMH.v6Esc(summary)+'</p>'+(priorities.length?'<div>'+priorities.map(x=>'<span>'+BMH.v6Esc(x)+'</span>').join('')+'</div>':'')+'</div>'
      +'<div class="step01-ai-facts">'
        +'<article><i>⌂</i><span><small>Phong cách</small><b>'+aiStyle+'</b></span><button data-s1-edit="style" title="Chỉnh phong cách">✎</button></article>'
        +'<article><i>▱</i><span><small>Số tầng (ước tính)</small><b>'+floors+' tầng</b></span><button data-s1-edit="floors" title="Chỉnh số tầng">✎</button></article>'
        +'<article><i>▣</i><span><small>Diện tích kế hoạch</small><b>~ '+BMH.num(area)+' m²</b></span><button data-s1-edit="area" title="Chỉnh mặt bằng">✎</button></article>'
        +'<article><i>◉</i><span><small>Ngân sách mục tiêu</small><b>'+BMH.money(budget)+'</b></span><button data-s1-edit="budget" title="Chỉnh tài chính">✎</button></article>'
        +'<article><i>☀</i><span><small>Khí hậu vùng</small><b>'+BMH.v6Esc(climate.climate)+'</b></span><button data-s1-edit="climate" title="Chỉnh vị trí và khí hậu">✎</button></article>'
        +'<article class="'+(projectedMembers?'needs-detail':'')+'"><i>♙</i><span><small>Hồ sơ gia đình</small><b>'+members+' thành viên</b><em>'+familyDetail+'</em></span><button data-s1-edit="household" title="Chỉnh hồ sơ gia đình">✎</button></article>'
      +'</div>'
      +'<div class="step01-next"><i>☼</i><div><small>Gợi ý bước tiếp theo</small><b>'+(result?'Concept đã có. Tiếp tục sang khảo sát khu đất và vị trí để khóa bối cảnh thực tế.':'Xem hình ảnh, tải tài liệu tham khảo hoặc để AI tự tạo concept từ hồ sơ nền.')+'</b></div><button data-nav="2">→</button></div>'
    +'</aside>'

   +'<section class="v6-card step01-reference">'
      +'<div class="step01-section-head"><div>'+BMH.v6PanelTitle('▧','Nguồn tham chiếu','Ảnh, video và PDF bạn đưa vào Step 1.')+'</div><label for="step1UploadAll" role="button" tabindex="0">Thêm tài liệu ＋</label></div>'
      +'<div class="step01-source-grid">'+sourceCards
        +(uploads.length<3?'<article class="step01-source-card"><img src="assets/design/flow-c.jpg" alt=""><span><b>Mẫu mặt tiền</b><small>Thư viện tham khảo</small></span></article>':'')
        +(uploads.length<2?'<article class="step01-source-card"><img src="assets/rooms/living-local.jpg" alt=""><span><b>Không gian phòng khách</b><small>Thư viện tham khảo</small></span></article>':'')
        +(uploads.length<4?'<label class="step01-add-source" for="step1UploadAll" role="button" tabindex="0"><i>＋</i><span>Thêm tài liệu</span></label>':'')
      +'</div>'
    +'</section>'

   +'<section class="v6-card step01-ideas">'
      +'<div class="step01-section-head"><div>'+BMH.v6PanelTitle('☼','Ý tưởng nổi bật','Gợi ý trực quan theo khí hậu và phong cách hiện tại.')+'</div><button data-s1-ideas-toggle>'+(BMH.v6.ideaExpanded?'Thu gọn ↑':'Xem tất cả →')+'</button></div>'
      +'<div class="step01-idea-grid '+(BMH.v6.ideaExpanded?'expanded':'')+'">'
        +'<article><img src="assets/rooms/facade-render.jpg" alt=""><span><b>Mặt tiền có chiều sâu</b><small>Tỷ lệ đứng gọn, lớp đệm nắng và cây xanh.</small></span></article>'
        +'<article><img src="assets/design/hero-step1.jpg" alt=""><span><b>Giếng trời & thông tầng</b><small>Tối ưu ánh sáng và thông thoáng.</small></span></article>'
        +'<article><img src="assets/rooms/living-local.jpg" alt=""><span><b>Nội thất ấm cúng</b><small>Vật liệu trung tính, ánh sáng ấm.</small></span></article>'
        +(BMH.v6.ideaExpanded?'<article><img src="assets/rooms/facade-local.jpg" alt=""><span><b>Khoảng xanh mặt đứng</b><small>Giảm nắng gắt và tạo lớp chuyển tiếp mềm.</small></span></article><article><img src="assets/rooms/living-local.jpg" alt=""><span><b>Không gian sinh hoạt chung</b><small>Liên kết phòng khách, bếp và khoảng sáng tự nhiên.</small></span></article><article><img src="assets/rooms/facade-render.jpg" alt=""><span><b>Phong cách hiện đại bền vững</b><small>Ưu tiên vật liệu dễ bảo trì và tỷ lệ lâu lỗi mốt.</small></span></article>':'')
      +'</div>'
    +'</section>'

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
  finally{BMH.v6.bankLogosLoading=false;if(BMH.state.ui.step===2)BMH.render({preserveScroll:true});}
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
  BMH.v6.bankRateLoading=true;BMH.v6.bankRateBankId=bank.id;BMH.v6.bankRateError='';BMH.v6.bankRateLastAttempt={bankId:bank.id,at:now};
  if(BMH.state.ui.step===2)BMH.render({preserveScroll:true});
  try{
    const res=await fetch('/api/bank-rate',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({bank_id:bank.id,bank_name:bank.name,full_name:bank.fullName||bank.name,swift:bank.swift||'',force})});
    let data={};try{data=await res.json();}catch(_){}
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
    BMH.v6.bankRateError=err.message||String(err);
    if(!silent)BMH.toast('Chưa cập nhật được lãi suất ngân hàng: '+BMH.v6.bankRateError);
    return false;
  }finally{
    BMH.v6.bankRateLoading=false;BMH.v6.bankRateBankId='';
    if(BMH.state.ui.step===2)BMH.render({preserveScroll:true});
  }
};

BMH.v64BankOption=(b,f)=>{
  const active=f.bank===b.id,hasRate=BMH.bankHasPreset?.(b);
  return '<button type="button" data-bank="'+BMH.v6Esc(b.id)+'" data-bank-option data-bank-search="'+BMH.v6Esc([b.name,b.fullName,b.id,b.swift].join(' ').toLowerCase())+'" class="v64-bank-option '+(active?'active':'')+'">'
    +'<div>'+BMH.v6BankMark(b)+'</div>'
    +'<span><b>'+BMH.v6Esc(b.name)+'</b><small>'+BMH.v6Esc(BMH.bankCategoryLabel?.(b)||'Ngân hàng')+'</small></span>'
    +'<em class="'+(hasRate?'ready':'waiting')+'">'+(hasRate?b.intro+'% → '+b.post+'%':'Chờ báo giá')+'</em>'
    +'<i>'+(active?'✓':'')+'</i>'
    +'</button>';
};

BMH.screen2=()=>{
  const f=BMH.state.project.finance,s=BMH.financeSummary(),e=BMH.estimate(),income=Number(f.income)||0,pct=income?Math.round(BMH.clamp(s.dti*100,0,100)):null,active=BMH.BANKS.find(x=>x.id===f.bank)||BMH.BANKS[0];
  const withPreset=BMH.BANKS.filter(b=>BMH.bankHasPreset?.(b)).length;
  const postPayment=BMH.monthlyPayment(f.loan,f.postRate,Math.max(1,f.years*12));
  const promoPayment=BMH.monthlyPayment(f.loan,f.introRate,Math.max(1,f.years*12));
  const stress=[1,2,3].map(d=>{const rate=Number(f.postRate||0)+d,pay=BMH.monthlyPayment(f.loan,rate,Math.max(1,f.years*12)),dti=income?Math.round((pay+Number(f.existingDebt||0))/income*100):null;return {d,rate,pay,dti};});
  const capacity=Math.max(0,Number(s.capacity)||0),loanPct=capacity?Math.round(Number(f.loan||0)/capacity*100):0;
  const meta=f.rateMeta||{},metaMatches=meta.bankId===active.id,liveVerified=metaMatches&&meta.verified===true,rateLoading=BMH.v6.bankRateLoading&&BMH.v6.bankRateBankId===active.id;
  const activeRateStatus=rateLoading?'Gemini đang cập nhật…':liveVerified?'Đã xác minh từ web':metaMatches&&meta.status==='unverified'?'Chưa đủ nguồn xác minh':BMH.bankHasPreset?.(active)?'Preset · AI sẽ kiểm tra':'AI sẽ quét lãi suất';
  const updateDate=metaMatches?BMH.v65DateLabel(meta.sourceDate||meta.fetchedAt):'',rateCitations=metaMatches?BMH.v65SafeCitations(meta.citations):[];
  const bankOptions=BMH.BANKS.map(b=>BMH.v64BankOption(b,f)).join('');
  return '<div class="v6-s2 v63-finance v64-finance">'
   +'<section class="v6-card v6-fin-form v63-fin-input">'
      +BMH.v6Title(8,'TÀI CHÍNH SÂU','Biết giới hạn an toàn trước khi mơ lớn hơn.','Dự toán đã có ở Step 7. Bây giờ đối chiếu tiền đang có, dòng tiền và khoản thiếu hụt để quyết định vay thêm hay quay lại tối ưu thiết kế/vật liệu.')
      +'<div class="v63-fin-hero"><small>NGÂN SÁCH XÂY HIỆN TẠI</small><b>'+BMH.money(e.budget)+'</b><span>Tiền có thể dùng: '+BMH.money(capacity)+' · Vay chiếm '+loanPct+'%</span></div>'
      +'<div class="v6-fields v63-fin-fields">'
        +[['Thu nhập / tháng','project.finance.income',f.income],['Chi phí sinh hoạt','project.finance.living',f.living],['Tiền hiện có','project.finance.cash',f.cash],['Quỹ dự phòng','project.finance.reserve',f.reserve],['Nợ trả mỗi tháng','project.finance.existingDebt',f.existingDebt],['Khoản vay mong muốn','project.finance.loan',f.loan]].map(x=>'<label><span>'+x[0]+'</span><div><input data-path="'+x[1]+'" data-scale="1000000" type="number" value="'+Number(x[2]||0)/1000000+'"><em>triệu</em></div></label>').join('')
        +'<label><span>Thời hạn vay</span><div><input data-path="project.finance.years" type="number" min="1" max="35" value="'+f.years+'"><em>năm</em></div></label>'
      +'</div>'
      +'<button class="v6-primary full" data-ai-direct="cost">✦ AI phân tích khả năng tài chính →</button>'
   +'</section>'

   +'<section class="v6-card v6-fin-center v63-fin-dashboard">'
      +'<div class="v63-fin-top">'
        +'<div class="v6-ring v63-dti-ring" style="--p:'+(pct||0)+'"><div><b>'+(pct===null?'—':pct+'%')+'</b><span>DTI mô phỏng</span><small>'+(pct===null?'Chưa đủ dữ liệu':pct<=36?'Vùng kiểm soát':pct<=45?'Cần thận trọng':'Áp lực cao')+'</small></div></div>'
        +'<div class="v63-afford"><span>KHẢ NĂNG CHI TRẢ</span><h2>'+(pct===null?'Nhập thu nhập để bắt đầu':pct<=36?'Dòng tiền đang trong vùng kiểm soát':pct<=45?'Nên giảm áp lực vay':'Áp lực trả nợ đang cao')+'</h2><p>DTI dùng khoản trả nợ đỉnh hiện tại. Đây là mô phỏng tài chính, không phải phê duyệt tín dụng.</p><div class="v6-kpi-row">'+BMH.v6Kpi('Khoản trả đỉnh',BMH.money(s.peak))+BMH.v6Kpi('Còn lại / tháng',BMH.money(s.remainder))+BMH.v6Kpi('Quỹ dự phòng',BMH.money(f.reserve))+BMH.v6Kpi('Khoản vay',BMH.money(f.loan))+'</div></div>'
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
          +'<button class="v64-loan-export" data-export="loan">Tải lịch trả nợ ↓</button>'
        +'</div>'
        +'<div class="v65-rate-freshness '+(liveVerified?'verified':rateLoading?'loading':'')+'"><div><i>'+(liveVerified?'✓':rateLoading?'◌':'✦')+'</i><span><b>'+(rateLoading?'Gemini đang quét nguồn ngân hàng…':liveVerified?'Lãi suất đã được AI xác minh':'AI kiểm tra lãi suất từ web công khai')+'</b><small>'+(updateDate?'Cập nhật ngày '+updateDate+(meta.product?' · '+BMH.v6Esc(meta.product):''):(metaMatches&&meta.note?BMH.v6Esc(meta.note):'Ưu tiên website chính thức của ngân hàng; số chưa đủ nguồn sẽ không tự ghi đè.'))+'</small></span></div><button data-bank-rate-refresh '+(rateLoading?'disabled':'')+'>↻ Cập nhật</button></div>'
        +'<div class="v65-rate-sources">'+(rateCitations.length?rateCitations.map((x,i)=>'<a href="'+BMH.v6Esc(x.url)+'" target="_blank" rel="noopener noreferrer">Nguồn '+(i+1)+' · '+BMH.v6Esc(x.title||active.name)+'</a>').join(''):'')+'</div>'
        +'<div class="v63-rate-editor"><label><span>Lãi ưu đãi</span><div><input data-path="project.finance.introRate" type="number" min="0" max="30" step=".1" value="'+Number(f.introRate||0)+'"><em>%/năm</em></div></label><label><span>Thời gian ưu đãi</span><div><input data-path="project.finance.promoMonths" type="number" min="0" max="120" value="'+Number(f.promoMonths||0)+'"><em>tháng</em></div></label><label><span>Lãi sau ưu đãi</span><div><input data-path="project.finance.postRate" type="number" min="0" max="30" step=".1" value="'+Number(f.postRate||0)+'"><em>%/năm</em></div></label></div>'
        +'<div class="v63-payment-shift"><article><small>Trong ưu đãi</small><b>'+BMH.money(promoPayment)+'</b><span>/ tháng đầu</span></article><i>→</i><article><small>Sau ưu đãi</small><b>'+BMH.money(postPayment)+'</b><span>/ tháng ước tính</span></article><em class="'+(postPayment>promoPayment?'up':'')+'">'+(postPayment>=promoPayment?'+':'−')+BMH.money(Math.abs(postPayment-promoPayment))+'</em></div>'
      +'</div>'
      +'<div class="v63-stress"><div class="v6-section-head"><div><b>Stress test lãi suất</b><span>Nếu lãi sau ưu đãi tăng thêm 1–3 điểm %.</span></div></div><div class="v63-stress-grid">'+stress.map(x=>'<article><small>+'+x.d+' điểm %</small><b>'+x.rate.toFixed(1)+'%</b><span>'+BMH.money(x.pay)+'/tháng</span><em>DTI '+(x.dti===null?'—':x.dti+'%')+'</em></article>').join('')+'</div></div>'
   +'</section>'

   +'<aside class="v6-card v6-fin-ai v63-fin-ai">'
      +BMH.v6PanelTitle('✦','AI tư vấn tài chính','Đọc dòng tiền, dự toán và kịch bản lãi suất hiện tại.')
      +'<div class="v6-advice"><article><i>'+(pct!==null&&pct<=36?'✓':'!')+'</i><div><b>DTI</b><span>'+(pct===null?'Nhập thu nhập để tính.':'Tỷ lệ mô phỏng '+pct+'%.')+'</span></div></article><article><i>◉</i><div><b>Quỹ dự phòng</b><span>'+BMH.money(f.reserve)+' đang được giữ riêng.</span></div></article><article><i>'+(e.gap>=0?'✓':'!')+'</i><div><b>Cân đối xây dựng</b><span>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' so với ngân sách.':'Thiếu '+BMH.money(Math.abs(e.gap))+' so với dự toán.')+'</span></div></article></div>'
      +'<div class="v63-ai-score"><small>ĐỘ BỀN DÒNG TIỀN</small><b>'+(pct===null?'—':Math.max(0,100-Math.max(0,pct-30)*3))+'/100</b><span>Điểm nội bộ để so sánh kịch bản, không phải điểm tín dụng ngân hàng.</span></div>'
      +'<button class="v6-primary full" data-ai-direct="cost">✦ Phân tích phương án vay</button>'
      +'<div class="v6-callout"><small>Dữ liệu lãi suất</small><b>'+withPreset+' ngân hàng có preset mô phỏng</b><span>Danh mục '+BMH.BANKS.length+' ngân hàng Việt Nam nằm ngay trong ô chọn ngân hàng. Ngân hàng chưa có dữ liệu vẫn giữ trạng thái “chờ báo giá”, không tự gán lãi suất.</span></div>'
   +'</aside>'
   +'</div>';
};

BMH.screen3=()=>{
  const s=BMH.state.project.site,p=BMH.regionProfile(s),near=BMH.regionNearbyPlaces?.(s)||[];
  const options=(BMH.VN_REGION_ORDER||Object.keys(BMH.REGIONS||{})).map(x=>'<option value="'+BMH.v6Esc(x)+'" '+(s.province===x?'selected':'')+'>'+BMH.v6Esc(x)+'</option>').join('');
  const embed=BMH.mapEmbedUrl?.(s)||'';
  return '<div class="v6-s3">'
   +'<section class="v6-card v6-location-form">'+BMH.v6Title(2,'VỊ TRÍ','Đặt ngôi nhà vào đúng bối cảnh thật.','Vị trí quyết định nắng, gió, mưa, tiếp cận công trường và nhiều chi phí ẩn.')+'<div class="v6-fields"><label><span>Tỉnh / thành</span><select data-path="project.site.province">'+options+'</select></label><label><span>Khu vực / phường xã</span><input data-path="project.site.district" value="'+BMH.v6Esc(s.district||'')+'"></label><label><span>Địa chỉ cụ thể</span><input data-path="project.site.address" value="'+BMH.v6Esc(s.address||'')+'" placeholder="Nhập tên đường, phường/xã…"></label></div><div class="v6-inline-actions"><button class="v6-primary" data-geocode>⌖ Tìm trên bản đồ</button><button class="v6-secondary" data-device-location>Dùng GPS</button></div><div class="v6-coordinate"><b>'+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</b><span>'+BMH.v6Esc(s.geoSource||'Tọa độ dự án')+'</span></div></section>'
   +'<section class="v6-card v6-map-panel"><div class="v6-map-toolbar"><div><button data-map-style="satellite" class="'+(s.mapStyle==='satellite'?'active':'')+'">Vệ tinh</button><button data-map-style="hybrid" class="'+(s.mapStyle==='hybrid'?'active':'')+'">Hybrid</button><button data-map-style="roadmap" class="'+(s.mapStyle==='roadmap'?'active':'')+'">Bản đồ</button><button data-map-style="terrain" class="'+(s.mapStyle==='terrain'?'active':'')+'">Địa hình</button></div><span id="mapHudCoords">'+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</span></div><div id="map" class="map fallback-only"><div class="map-fallback"><div class="map-embed-shell v61-map-first"><iframe class="map-embed-frame" loading="eager" referrerpolicy="no-referrer-when-downgrade" src="'+BMH.v6Esc(embed)+'" title="Bản đồ khu đất"></iframe><div class="v61-map-overlay"><span>Vị trí dự án</span><b>'+BMH.v6Esc(s.district||s.province)+'</b><small>'+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</small></div></div></div></div><div class="v6-nearby">'+near.slice(0,4).map(x=>'<button data-nearby="'+BMH.v6Esc(x.name)+'" data-lat="'+x.lat+'" data-lng="'+x.lng+'"><b>'+BMH.v6Esc(x.name)+'</b><span>'+BMH.v6Esc(x.note||'Điểm tham chiếu')+'</span></button>').join('')+'</div></section>'
   +'<aside class="v6-card v6-climate">'+BMH.v6PanelTitle('☀','Hồ sơ khí hậu khu vực',s.province+' · '+s.district)+'<div class="v6-climate-grid">'+BMH.v6Kpi('Nhiệt độ',BMH.v6Esc(p.temp))+BMH.v6Kpi('Độ ẩm',BMH.v6Esc(p.humidity))+BMH.v6Kpi('Mùa mưa',BMH.v6Esc(p.wet))+BMH.v6Kpi('Gió chính',BMH.v6Esc(p.wind))+BMH.v6Kpi('Nguy cơ ngập',BMH.v6Esc(p.flood))+BMH.v6Kpi('Nắng nóng',BMH.v6Esc(p.heat))+'</div><div class="v6-climate-tip"><i>✦</i><div><b>Khuyến nghị thiết kế</b><span>'+BMH.v6Esc((p.designTips||[])[0]||'Ưu tiên thông gió, che nắng và thoát nước phù hợp địa phương.')+'</span></div></div></aside>'
   +'</div>';
};

BMH.screen4=()=>{
  const s=BMH.state.project.site,h=BMH.state.project.household,p=BMH.regionProfile(s),feng=BMH.fengProfile(),members=BMH.v6Household(),targetMembers=Math.max(members.length,Number(h.requestedSize)||0),pendingMembers=Math.max(0,targetMembers-members.length);
  return '<div class="v6-s4">'
   +'<section class="v6-card v6-s4-head">'+BMH.v6Title(3,'ĐẤT · ĐỊA CHẤT · GIA ĐÌNH','Một nền đất tốt và một ngôi nhà hợp với người sống trong đó.','Phần kỹ thuật, nhu cầu gia đình và phong thủy được tách rõ để tránh trộn lẫn niềm tin với yêu cầu an toàn.')+'<div class="v6-kpi-row">'+BMH.v6Kpi('Diện tích đất',BMH.num(s.width*s.depth)+' m²')+BMH.v6Kpi('Thành viên',targetMembers+' người',pendingMembers?pendingMembers+' người chưa khai báo chi tiết':'Đã đủ hồ sơ')+BMH.v6Kpi('Số tầng',s.floors+' tầng')+BMH.v6Kpi('Hướng mặt tiền',BMH.v6Esc(s.frontDirection))+'</div></section>'
   +'<section class="v6-card v6-land">'+BMH.v6PanelTitle('▣','Khu đất & địa chất sơ bộ','Dùng để định hướng, không thay thế khảo sát hiện trường.')+'<div class="v6-fields two"><label><span>Ngang</span><div><input data-path="project.site.width" type="number" step=".1" value="'+s.width+'"><em>m</em></div></label><label><span>Sâu</span><div><input data-path="project.site.depth" type="number" step=".1" value="'+s.depth+'"><em>m</em></div></label><label><span>Số tầng</span><div><input data-path="project.site.floors" type="number" value="'+s.floors+'"><em>tầng</em></div></label><label><span>Đường tiếp cận</span><div><input data-path="project.site.road" type="number" step=".5" value="'+s.road+'"><em>m</em></div></label></div><div class="v6-soils">'+['Đất thịt đồng bằng','Đất cát','Đất sét','Đất yếu / bùn','Đất đá'].map((x,i)=>'<button data-soil="'+x+'" class="'+(s.soil===x?'active':'')+'"><i>'+['▰','▱','▧','▤','◆'][i]+'</i><b>'+x+'</b></button>').join('')+'</div><div class="v6-land-note"><b>'+BMH.v6Esc(p.climate)+'</b><span>Ngập: '+BMH.v6Esc(p.flood)+' · Bão/gió: '+BMH.v6Esc(p.storm)+' · Nhiệt: '+BMH.v6Esc(p.heat)+'</span></div></section>'
   +'<section class="v6-card v6-family">'+BMH.v6PanelTitle('♙','Thành viên gia đình',pendingMembers?'Hồ sơ yêu cầu '+targetMembers+' người · còn '+pendingMembers+' người chưa khai báo chi tiết.':'Đã đồng bộ đủ '+targetMembers+' thành viên.')+(pendingMembers?'<div class="v6-family-sync-warn"><i>!</i><span><b>Còn '+pendingMembers+' thành viên chưa khai báo</b><small>Hệ thống vẫn dùng tổng '+targetMembers+' người để tính nhu cầu phòng. Thêm hồ sơ chi tiết nếu muốn AI hiểu tuổi, giới tính và nhu cầu riêng.</small></span></div>':'')+'<div class="v6-people">'+members.map(BMH.v6PersonCard).join('')+'</div><div class="v6-person-actions"><button data-household-add="child">＋ Thêm con</button><button data-household-add="relative">＋ Thêm người thân</button>'+(h.partnerEnabled===false?'<button data-v6-partner="on">＋ Hiện bạn đời</button>':'')+'</div></section>'
   +'<section class="v6-card v6-feng">'+BMH.v6PanelTitle('☯','Phong thủy gia đình + AI nghiên cứu web','Lớp tham khảo, có nguồn và luôn đứng sau an toàn/công năng.')+'<div class="v6-feng-base"><div>'+BMH.compass()+'</div><div><small>Kết quả công thức cục bộ</small><h3>'+BMH.v6Esc(feng.title)+'</h3><p>'+BMH.v6Esc(feng.note)+'</p><b>Hướng tham khảo: '+BMH.v6Esc((feng.dirs||[]).join(' · '))+'</b><button class="v6-primary" data-v6-feng>✦ AI nghiên cứu đa nguồn</button></div></div>'+BMH.v6FengResult()+'</section>'
   +'</div>';
};

BMH.screen5=()=>{
  const ui=BMH.state.ui.planner,view=ui.view||'plan',floor=Number(ui.floor)||0,rooms=BMH.floorRooms(floor),selected=rooms.find(r=>r.id===ui.selected)||rooms[0]||null,r=BMH.designReview(),drawing=view==='plan'?BMH.planSvg({interactive:true,floor}):view==='elevation'?BMH.elevationSvg():BMH.sectionSvg();
  if(selected&&!ui.selected)ui.selected=selected.id;
  return '<div class="v6-s5">'
   +'<section class="v6-card v6-plan-head">'+BMH.v6Title(4,'BẢN VẼ','Mặt bằng phải dễ đọc trước khi nó thông minh.','Kéo phòng trực tiếp, chỉnh kích thước bên phải và chỉ bật lớp phân tích khi bạn cần.')+'<div class="v6-kpi-row">'+BMH.v6Kpi('Tầng',String(floor+1))+BMH.v6Kpi('Không gian',rooms.length+' phòng')+BMH.v6Kpi('Diện tích',BMH.num(rooms.reduce((a,x)=>a+x.w*x.h,0))+' m²')+BMH.v6Kpi('Điểm thiết kế',r.overall+'/100')+'</div></section>'
   +'<aside class="v6-card v6-plan-tools">'+BMH.v6PanelTitle('＋','Thư viện không gian','Nhấp để thêm vào tầng hiện tại.')+'<div class="v6-room-types">'+[['living','⌂','Khách'],['kitchen','♨','Bếp + ăn'],['bed','▰','Ngủ'],['bath','◫','WC'],['stairs','⌁','Cầu thang'],['garage','▣','Gara'],['balcony','▤','Ban công'],['corridor','↔','Hành lang']].map(x=>'<button data-add-room="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>').join('')+'</div><div class="v6-tool-buttons"><button data-plan-tool="door">▯ Thêm cửa đi</button><button data-plan-tool="window">▥ Thêm cửa sổ</button><button data-plan-undo>↶ Hoàn tác</button><button data-plan-redo>↷ Làm lại</button></div></aside>'
   +'<section class="v6-card v6-plan-main"><div class="v6-plan-toolbar"><div><button data-plan-view="plan" class="'+(view==='plan'?'active':'')+'">Mặt bằng</button>'+Array.from({length:BMH.state.project.site.floors},(_,i)=>'<button data-floor="'+i+'" class="'+(view==='plan'&&floor===i?'floor active':'')+'">T'+(i+1)+'</button>').join('')+'<button data-plan-view="elevation" class="'+(view==='elevation'?'active':'')+'">Mặt đứng</button><button data-plan-view="section" class="'+(view==='section'?'active':'')+'">Mặt cắt</button></div><div><button data-planner-fit>Fit</button><button data-planner-zoom="out">−</button><button data-planner-zoom="in">＋</button><button data-planner-fullscreen>⛶</button></div></div><div class="v6-plan-canvas technical-sheet">'+drawing+'</div><div class="v6-plan-legend"><span><i class="wall"></i>Tường</span><span><i class="window"></i>Cửa sổ</span><span><i class="green"></i>Sân/cây xanh</span><b>✋ Kéo phòng · resize tại điểm góc · zoom bằng nút điều khiển</b></div></section>'
   +'<aside class="v6-card v6-inspector">'+BMH.v6PanelTitle('◎','Thông tin bản vẽ',BMH.num(BMH.state.project.site.width)+' × '+BMH.num(BMH.state.project.site.depth)+'m · '+BMH.state.project.site.floors+' tầng')+(selected?'<div class="v6-room-editor"><div><small>PHÒNG ĐANG CHỌN</small><h3>'+BMH.v6Esc(selected.name)+'</h3></div><label>Tên phòng<input data-v6-room="name" value="'+BMH.v6Esc(selected.name)+'"></label><div class="v6-fields two"><label><span>Rộng</span><div><input data-v6-room="w" type="number" step=".1" value="'+selected.w+'"><em>m</em></div></label><label><span>Dài</span><div><input data-v6-room="h" type="number" step=".1" value="'+selected.h+'"><em>m</em></div></label></div><button class="v6-danger" data-room-delete>Xóa phòng</button></div>':'<p class="v6-empty">Chọn một phòng để chỉnh.')+'<div class="v6-room-list">'+rooms.map(x=>'<button data-room-select="'+x.id+'" class="'+(selected?.id===x.id?'active':'')+'"><span>'+BMH.v6Esc(x.name)+'</span><b>'+BMH.num(x.w*x.h)+' m²</b></button>').join('')+'</div><button class="v6-secondary full" data-ai-direct="review">✦ AI kiểm tra mặt bằng →</button></aside>'
   +'</div>';
};

BMH.screen6=()=>{
  const m=BMH.state.project.materials,e=BMH.estimate(),perf=BMH.performancePlan(),cat=BMH.state.ui.materialCategory||'floor',items=BMH.MATERIALS[cat]||[],meta=BMH.v6MatMeta[cat]||['▥','Vật liệu'];
  return '<div class="v6-s6">'
   +'<section class="v6-card v6-mat-head">'+BMH.v6Title(5,'SHOWROOM VẬT LIỆU','Chọn vật liệu như đang phối cả ngôi nhà, không phải chọn từng món rời rạc.','So sánh thẩm mỹ, độ bền, khí hậu, chi phí và hiệu suất vận hành trên cùng một màn hình.')+'<div class="v6-tier">'+[['economy','Tiết kiệm'],['standard','Tiêu chuẩn'],['premium','Cao cấp']].map(x=>'<button data-tier="'+x[0]+'" class="'+(m.tier===x[0]?'active':'')+'"><b>'+x[1]+'</b><span>'+(x[0]==='economy'?'Ưu tiên chi phí':x[0]==='standard'?'Cân bằng nhất':'Ưu tiên trải nghiệm')+'</span></button>').join('')+'</div></section>'
   +'<aside class="v6-card v6-mat-nav">'+BMH.v6PanelTitle('◫','Danh mục','12 nhóm chính')+'<div>'+Object.keys(BMH.v6MatMeta).map(k=>'<button data-material-view="'+k+'" class="'+(cat===k?'active':'')+'"><i>'+BMH.v6MatMeta[k][0]+'</i><span>'+BMH.v6MatMeta[k][1]+'</span><em>'+(BMH.MATERIALS[k]||[]).length+'</em></button>').join('')+'</div></aside>'
   +'<section class="v6-card v6-showroom"><div class="v6-section-head"><div><b>'+meta[1]+'</b><span>'+items.length+' phương án đang có trong thư viện.</span></div></div><div class="v6-products">'+items.map((x,i)=>'<article class="'+(m.choices[cat]===x.id?'active':'')+'"><img src="'+BMH.v6MaterialImage(cat,x)+'" alt=""><div><small>'+(i===0?'Cơ bản':i===items.length-1?'Nâng cấp':'Cân bằng')+'</small><h3>'+BMH.v6Esc(x.name)+'</h3><p>'+BMH.v6Esc(x.sub||'')+'</p><div class="v6-product-score"><span>Khí hậu <b>'+Math.max(68,94-i*3)+'</b></span><span>Độ bền <b>'+(84+i*4)+'</b></span><span>Bảo trì <b>'+(78+i*5)+'</b></span></div><strong>'+BMH.v6Esc(BMH.materialPriceLabel(cat,x))+'</strong><button data-material="'+x.id+'" data-material-cat="'+cat+'">'+(m.choices[cat]===x.id?'✓ Đã chọn':'Chọn phương án')+'</button></div></article>').join('')+'</div><div class="v6-showroom-note"><i>✦</i><div><b>Gợi ý theo khí hậu</b><span>'+BMH.v6Esc(BMH.climateMaterialGuide(cat))+'</span></div></div></section>'
   +'<aside class="v6-card v6-energy">'+BMH.v6PanelTitle('☀','Năng lượng & vận hành','Điện mặt trời và các lớp giảm tải nhiệt.')+'<div class="v6-energy-hero"><b>'+BMH.num(perf.solarCapacity,1)+' kWp</b><span>công suất PV đề xuất</span></div><div class="v6-kpi-grid">'+BMH.v6Kpi('Mái khả dụng',BMH.num(perf.usableSolarArea,1)+' m²')+BMH.v6Kpi('Sản lượng',BMH.num(perf.solarYield,0)+' kWh/năm')+BMH.v6Kpi('Tự dùng',perf.solarCoverage+'%')+BMH.v6Kpi('Tiết kiệm / năm',BMH.money(perf.annualEnergySavings))+BMH.v6Kpi('Hoàn vốn',perf.payback?BMH.num(perf.payback,1)+' năm':'—')+BMH.v6Kpi('Dự toán hiện tại',BMH.money(e.total))+'</div><div class="v6-toggle-grid">'+[['solarEnabled','☀','Điện mặt trời'],['rainwaterEnabled','☂','Thu nước mưa'],['coolRoof','⌂','Mái chống nóng'],['smartShading','▤','Lam che nắng']].map(x=>'<button data-performance="'+x[0]+'" class="'+(BMH.state.project.performance[x[0]]?'active':'')+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>').join('')+'</div></aside>'
   +'</div>';
};

BMH.screen7=()=>{
  const p=BMH.state.project,r=BMH.designReview(),e=BMH.estimate(),perf=BMH.performancePlan(),ui=BMH.state.ui;
  const rooms=p.plan.rooms||[];
  const roomOptions=rooms.map(x=>'<option value="room:'+x.id+'" '+(ui.sceneFocus==='room:'+x.id?'selected':'')+'>T'+(x.floor+1)+' · '+BMH.v6Esc(x.name)+'</option>').join('');
  return '<div class="v6-s7 v61-s7-live">'
   +'<section class="v6-card v6-s7-head">'+BMH.v6Title(6,'MÔ PHỎNG 3D THẬT','Xoay, zoom, tách tầng và xem từng không gian ngay trên mô hình.','Phối cảnh AI là lớp cảm xúc. Mô hình WebGL ở giữa màn hình mới là lớp 3D tương tác dùng để kiểm tra phương án.')+'<div class="v6-score-pill"><small>Điểm tổng thể</small><b>'+r.overall+'<em>/100</em></b></div></section>'
   +'<aside class="v6-card v6-score">'+BMH.v6PanelTitle('◎','Đánh giá tổng thể','Công năng, khí hậu, ngân sách và tiện nghi.')+'<div class="v6-score-ring" style="--p:'+r.overall+'"><div><b>'+r.overall+'</b><span>/100</span></div></div><div class="v6-bars">'+[['Công năng',r.function],['Tiện nghi',r.comfort],['Thông gió',r.ventilation],['Ngân sách',r.budget],['Năng lượng',perf.energyScore]].map(x=>'<article><span>'+x[0]+'</span><i><b style="width:'+x[1]+'%"></b></i><em>'+x[1]+'</em></article>').join('')+'</div><button class="v6-secondary full" data-ai-direct="review">Xem phân tích AI →</button></aside>'
   +'<section class="v61-live3d" id="studio3dStage"><div class="studio-3d-loading" id="studio3dLoading"><i>⌂</i><b>Đang dựng mô hình 3D từ mặt bằng thật…</b><span>Mô hình dùng kích thước, tầng và vật liệu đang có trong dự án.</span></div><canvas id="studio3dCanvas" aria-label="Mô hình 3D tương tác ngôi nhà"></canvas><div class="studio-3d-fallback"><img src="assets/rooms/facade-render.jpg" alt="Phối cảnh dự phòng"><span>WebGL/CDN chưa tải được · đang hiển thị ảnh dự phòng</span></div><div class="v61-3d-top"><div><button class="'+(ui.sceneFocus==='all'?'active':'')+'" data-scene-focus-btn="all">Toàn nhà</button>'+Array.from({length:p.site.floors},(_,i)=>'<button class="'+(ui.sceneFocus==='floor:'+i?'active':'')+'" data-scene-focus-btn="floor:'+i+'">Tầng '+(i+1)+'</button>').join('')+'<select data-scene-focus><option value="all">Chọn phòng…</option>'+roomOptions+'</select></div><div><button data-scene-theme>'+(ui.sceneTheme==='night'?'☾ Ban đêm':'☀ Ban ngày')+'</button><button data-scene-explode class="'+(ui.sceneExploded?'active':'')+'">'+(ui.sceneExploded?'Ghép tầng':'Tách tầng')+'</button><button data-studio3d-reset>⌂ Góc đẹp</button></div></div><div class="v61-3d-hud">'+BMH.v6Kpi('Diện tích',BMH.num(BMH.planArea())+' m²')+BMH.v6Kpi('Số tầng',p.site.floors+'')+BMH.v6Kpi('Dự toán',BMH.money(e.total))+BMH.v6Kpi('Tiện nghi',r.comfort+'/100')+'</div><div class="v61-3d-tip">Kéo chuột để xoay · lăn chuột để zoom · chọn tầng/phòng để tập trung</div></section>'
   +'<aside class="v6-card v6-3d-ai">'+BMH.v6PanelTitle('✦','AI đánh giá phương án','Đọc dữ liệu dự án hiện tại.')+'<div class="v6-advice"><article><i>⌖</i><div><b>Vị trí & khí hậu</b><span>'+r.ventilation+'/100 · nắng, gió và thông thoáng.</span></div></article><article><i>⌂</i><div><b>Công năng sống</b><span>'+r.comfort+'/100 · mức thoải mái cho gia đình.</span></div></article><article><i>☀</i><div><b>Năng lượng</b><span>'+perf.energyScore+'/100 · PV có thể phủ khoảng '+perf.solarCoverage+'% nhu cầu tự dùng.</span></div></article><article><i>'+(e.gap>=0?'✓':'!')+'</i><div><b>Ngân sách</b><span>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' dự phòng.':'Vượt '+BMH.money(Math.abs(e.gap))+' so với trần ngân sách.')+'</span></div></article></div><div class="v61-cinematic-card"><img src="'+BMH.v6Esc(BMH.cinematicRender?.dataUrl||'assets/rooms/facade-render.jpg')+'" alt=""><div><small>PHỐI CẢNH CẢM XÚC</small><b>'+(BMH.cinematicRender?.dataUrl?'Phối cảnh AI hiện tại':'Ảnh tham khảo hiện tại')+'</b><button data-cinematic-render>✦ '+(BMH.cinematicRender?.loading?'Đang tạo…':'Tạo phối cảnh AI')+'</button></div></div></aside>'
   +'</div>';
};

BMH.screen8=()=>{
  const e=BMH.estimate(),perf=BMH.performancePlan(),snap=BMH.createDossierSnapshot(),c=snap.summary.completeness,rows=[['Móng & nền',e.shell*.25],['Phần thô',e.shell*.75],['Hoàn thiện',e.finish*.58],['MEP',e.finish*.22],['Nội thất',e.finish*.20]].filter(x=>x[1]>0),max=Math.max(...rows.map(x=>x[1]),1);
  return '<div class="v6-s8">'
   +'<section class="v6-card v6-cost-head">'+BMH.v6Title(7,'DỰ TOÁN','Biết tiền đi đâu trước khi công trình bắt đầu.','Mỗi thay đổi ở quy mô, vật liệu và hiệu suất đều đi vào tổng dự toán này.')+'<div class="v6-cost-total"><small>TỔNG ƯỚC TÍNH</small><b>'+BMH.money(e.total)+'</b><span>Ngân sách mục tiêu '+BMH.money(e.budget)+'</span></div></section>'
   +'<section class="v6-card v6-cost-main"><div class="v6-cost-image"><img src="assets/design/hero-step1.jpg"><div><span>NHÀ CỦA BẠN</span><b>'+BMH.state.project.site.floors+' tầng · '+BMH.num(BMH.planArea())+' m²</b></div></div><div class="v6-cost-bars">'+BMH.v6PanelTitle('≋','Cơ cấu chi phí','Nhóm nào đang chiếm tỷ trọng lớn nhất?')+rows.map(x=>'<article><div><b>'+x[0]+'</b><span>'+Math.round(x[1]/Math.max(1,e.total)*100)+'%</span></div><i><b style="width:'+Math.max(8,Math.round(x[1]/max*100))+'%"></b></i><strong>'+BMH.money(x[1])+'</strong></article>').join('')+'</div></section>'
   +'<aside class="v6-card v6-doc-status">'+BMH.v6PanelTitle('▣','Mức hoàn thiện hồ sơ','Không khóa tính năng trong bản phát triển.')+'<div class="v6-ring compact" style="--p:'+c.percent+'"><div><b>'+c.percent+'%</b><span>hoàn thiện</span></div></div><div class="v6-doc-list"><span>✓ Bản vẽ cơ bản</span><span>✓ Vật liệu & hiệu suất</span><span>✓ Dự toán & BOQ</span><span>✓ Checklist MEP</span><span>✓ Dòng tiền / tiến độ</span></div><button class="v6-secondary full" data-export="estimate">Tải dự toán ↓</button></aside>'
   +'<section class="v6-card v6-ops">'+BMH.v6Kpi('Điện vận hành / năm',BMH.money(perf.annualElectricCost))+BMH.v6Kpi('Tiết kiệm / năm',BMH.money(perf.annualEnergySavings))+BMH.v6Kpi('Sản lượng PV',BMH.num(perf.solarYield,0)+' kWh')+BMH.v6Kpi('Tiết kiệm 10 năm',BMH.money(perf.tenYearSavings))+'</section>'
   +'</div>';
};

BMH.screen9=()=>{
  const d=BMH.state.project.dossier||{},schedule=BMH.dossierSchedule(),mep=BMH.mepChecklistRows(),progress=BMH.clamp(Number(d.progress)||0,0,100),checked=mep.filter(x=>x.checked).length;
  return '<div class="v6-s9">'
   +'<section class="v6-card v6-build-head">'+BMH.v6Title(9,'GIÁM SÁT THI CÔNG','Một màn hình để biết công trình đang ở đâu và việc gì chưa được phép bỏ sót.','Tiến độ, checklist MEP và nhật ký hiện trường được gom về một chỗ.')+'<div class="v6-progress"><small>Tổng tiến độ</small><b>'+progress+'%</b><i><span style="width:'+progress+'%"></span></i></div></section>'
   +'<aside class="v6-card v6-timeline">'+BMH.v6PanelTitle('✓','Tiến độ thi công','Theo lịch dự án hiện tại.')+'<div>'+schedule.map(x=>'<article class="'+x.status+'"><i>'+(x.status==='done'?'✓':x.status==='active'?'●':'○')+'</i><div><b>'+BMH.v6Esc(x.name)+'</b><span>'+BMH.dateLabel(x.start)+' → '+BMH.dateLabel(x.end)+'</span></div><em>'+(x.status==='done'?'Hoàn thành':x.status==='active'?'Đang làm':'Sắp tới')+'</em></article>').join('')+'</div></aside>'
   +'<section class="v6-build-main"><div class="v6-card v6-site-log">'+BMH.v6PanelTitle('▧','Nhật ký hiện trường','Không dùng ảnh minh họa giả khi chưa có dữ liệu thật.')+'<div class="v6-site-empty"><i>＋</i><div><b>Chưa có ảnh thực địa</b><span>Khi module nhật ký được nối, ảnh sẽ được nhóm theo giai đoạn và AI có thể đối chiếu issue / checklist.</span></div></div></div><div class="v6-card v6-mep">'+BMH.v6PanelTitle('⚙','Checklist nghiệm thu MEP',checked+'/'+mep.length+' hạng mục đã kiểm')+'<div>'+mep.map(x=>'<label><input type="checkbox" data-check="'+x.id+'" '+(x.checked?'checked':'')+'><i>'+(x.checked?'✓':'○')+'</i><span>'+BMH.v6Esc(x.name)+'</span><em>'+(x.checked?'Đã kiểm':'Chưa kiểm')+'</em></label>').join('')+'</div></div></section>'
   +'<aside class="v6-card v6-supervisor">'+BMH.v6PanelTitle('✦','AI Giám sát viên','Chỉ phân tích dữ liệu dự án thật đang có.')+'<div class="v6-advice"><article><i>✓</i><div><b>Tiến độ</b><span>'+progress+'% dự án đã được ghi nhận.</span></div></article><article><i>'+(mep.length-checked>4?'!':'✓')+'</i><div><b>MEP</b><span>'+(mep.length-checked)+' hạng mục chưa đánh dấu kiểm.</span></div></article><article><i>!</i><div><b>Dữ liệu hiện trường</b><span>Chưa có ảnh thực địa để AI xác minh chất lượng.</span></div></article></div><div class="v6-next-card"><small>Ưu tiên</small><b>Khóa checklist kỹ thuật trước khi tô tường, đóng trần hoặc che hệ MEP.</b><button data-ai-open>Hỏi AI →</button></div></aside>'
   +'</div>';
};

BMH.screen10=()=>{
  const snap=BMH.createDossierSnapshot(),e=BMH.estimate(),c=snap.summary.completeness,perf=BMH.performancePlan(),progress=BMH.clamp(Number(BMH.state.project.dossier?.progress)||0,0,100),docs=[['dossier-pdf','⌂','Hồ sơ kiến trúc'],['drawings','▱','Bộ bản vẽ'],['dossier-excel','▤','Workbook dự án'],['estimate','◔','Dự toán tổng'],['mep-pdf','⚙','Hồ sơ MEP'],['bundle','▣','Trọn bộ hồ sơ']];
  return '<div class="v6-s10">'
   +'<section class="v6-card v6-handover"><div>'+BMH.v6Title(10,'BÀN GIAO','Mọi quyết định của ngôi nhà được gom thành một hồ sơ có thể mang đi làm việc thật.','Dùng bộ hồ sơ này để trao đổi với kiến trúc sư, kỹ sư, nhà thầu và gia đình. Hồ sơ thi công chính thức vẫn cần người có chuyên môn kiểm tra và ký xác nhận.')+'<blockquote>“Không chỉ là một ngôi nhà,<br>mà là nơi bắt đầu những hành trình hạnh phúc.”</blockquote></div><div class="v6-handover-image"><img src="assets/design/hero-step1.jpg"><span>BUILD MY HOME · HOÀN TẤT HÀNH TRÌNH</span></div><div class="v6-handover-status">'+BMH.v6Kpi('Phương án','Đã hình thành')+BMH.v6Kpi('Dự toán','Đã tổng hợp')+BMH.v6Kpi('Thi công',progress+'%')+BMH.v6Kpi('Hồ sơ',c.percent+'% sẵn sàng')+'</div></section>'
   +'<section class="v6-card v6-docs">'+BMH.v6PanelTitle('▣','Bộ hồ sơ bàn giao',c.done+'/'+c.total+' nhóm dữ liệu đã hoàn thiện.')+'<div>'+docs.map(x=>'<button data-export="'+x[0]+'"><i>'+x[1]+'</i><span><b>'+x[2]+'</b><small>Tải xuống / xuất file</small></span><em>↓</em></button>').join('')+'</div></section>'
   +'<aside class="v6-card v6-summary">'+BMH.v6PanelTitle('⌂','Tổng kết tổ ấm','Những con số đáng nhớ của dự án.')+'<div class="v6-kpi-grid">'+BMH.v6Kpi('Diện tích',BMH.num(snap.summary.grossArea,1)+' m²')+BMH.v6Kpi('Số tầng',BMH.state.project.site.floors+' tầng')+BMH.v6Kpi('Dự toán',BMH.money(e.total))+BMH.v6Kpi('PV ước tính',BMH.num(perf.solarCapacity,1)+' kWp')+BMH.v6Kpi('Tiết kiệm 10 năm',BMH.money(perf.tenYearSavings))+BMH.v6Kpi('Hồ sơ',c.percent+'%')+'</div><button class="v6-primary full" data-nav="1">Xem lại hành trình →</button></aside>'
   +'</div>';
};

BMH.SCREENS=[BMH.screen1,BMH.screen3,BMH.screen4,BMH.screen5,BMH.screen6,BMH.screen7,BMH.screen8,BMH.screen2,BMH.screen9,BMH.screen10];

BMH.afterRender=()=>{
  const step=BMH.state.ui.step;
  if(step===1){
    ['all','video','image','pdf'].forEach(x=>BMH.v6EnsureUploadInput?.(x));
    const last=Number(BMH.v6.aiStatus?.checkedAt)||0;
    if(Date.now()-last>15000)BMH.v6RefreshAIConfig?.({force:false,render:true});
  }
  if(step===8){
    BMH.v65LoadBankLogos?.();
    const bank=BMH.BANKS.find(x=>x.id===BMH.state.project.finance.bank)||BMH.BANKS[0];
    setTimeout(()=>BMH.v65RefreshBankRate?.(bank,{force:false,silent:true}),80);
  }
  if(step===2){
    BMH.loadLiveWeather?.();BMH.loadClimateHistory?.();
    setTimeout(()=>Promise.resolve(BMH.initMapStudio?.()).catch(()=>{}),120);
  }
  if(step===4)setTimeout(()=>BMH.v61OrientPlanner?.(),40);
  if(step===6)BMH.mountStudio3D?.();
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
  const pt=e.target.closest('[data-v6-partner]');
  if(pt){BMH.state.project.household.partnerEnabled=pt.dataset.v6Partner==='on';BMH.syncHouseholdSize?.();BMH.save();BMH.render({preserveScroll:true});return;}
  if(e.target.closest('[data-v6-feng]')){e.preventDefault();BMH.v6RunFeng();return;}
});

document.addEventListener('change',e=>{
  const person=e.target.closest?.('[data-v6-person]');
  if(person){
    const h=BMH.state.project.household,key=person.dataset.v6Person==='child'?'children':'relatives',row=h[key].find(x=>x.id===person.dataset.id);
    if(row){row[person.dataset.key]=person.dataset.key==='birth'?Number(person.value):person.value;BMH.syncHouseholdSize?.();BMH.save();BMH.render({preserveScroll:true});}
    return;
  }
  const rf=e.target.closest?.('[data-v6-room]');
  if(rf){
    const id=BMH.state.ui.planner.selected,room=BMH.state.project.plan.rooms.find(x=>x.id===id);
    if(room){const key=rf.dataset.v6Room;room[key]=key==='name'?rf.value:Number(rf.value);BMH.save();BMH.render({preserveScroll:true});}
  }
});

BMH.renderStudio=BMH.render;
BMH.render=(opts={})=>{
  if(BMH.state?.ui?.onboardingComplete===false&&typeof BMH.v6SetupScreen==='function'){
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
  if(step===5&&BMH.state.ui.step!==5){
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
