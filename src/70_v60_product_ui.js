/* Build My Home V6.0 — product UI reset.
 * One visual system for all 10 steps. Keeps the existing engines, removes patch-on-patch UI.
 */
BMH.VERSION='6.1.3';
BMH.VISUAL_RELEASE='step1-native-controls-v613';

BMH.v6={
  upload:null,
  uploads:[],
  ideaDraft:'',
  briefResult:null,
  briefLoading:false,
  briefError:'',
  s1HeroIndex:0,
  ideaExpanded:false,
  uploadBusy:false,
  aiStatus:{checkedAt:0,loading:false,error:''},
  feng:{loading:false,error:'',result:null,citations:[]}
};

BMH.V6_STEPS=[
  ['Khởi tạo','Ý tưởng → brief'],
  ['Tài chính','DTI & ngân sách'],
  ['Vị trí','Khí hậu & khu vực'],
  ['Đất & gia đình','Địa chất · phong thủy'],
  ['Bản vẽ','Mặt bằng tương tác'],
  ['Vật liệu','Showroom & năng lượng'],
  ['3D','Mô phỏng & đánh giá'],
  ['Dự toán','Chi phí & hồ sơ'],
  ['Thi công','Tiến độ & MEP'],
  ['Bàn giao','Hồ sơ hoàn chỉnh']
];

BMH.v6Esc=BMH.esc;
BMH.v6Kpi=(label,value,note='')=>'<article class="v6-kpi"><small>'+BMH.v6Esc(label)+'</small><b>'+value+'</b>'+(note?'<span>'+BMH.v6Esc(note)+'</span>':'')+'</article>';
BMH.v6Title=(step,eyebrow,title,desc)=>'<div class="v6-title"><span>BƯỚC '+step+'/10 · '+eyebrow+'</span><h1>'+title+'</h1><p>'+desc+'</p></div>';
BMH.v6PanelTitle=(icon,title,desc='')=>'<div class="v6-panel-title"><i>'+icon+'</i><div><b>'+title+'</b>'+(desc?'<span>'+desc+'</span>':'')+'</div></div>';

BMH.header=()=>{
  const s=BMH.state.project.site;
  return '<header class="v6-header step01-shell">'
    +'<button class="v6-brand" data-nav="1"><img src="assets/icon.svg" alt=""><span><b>Build My Home</b><small>KIẾN TẠO TỔ ẤM, CÙNG AI</small></span></button>'
    +'<nav class="v6-topnav"><button data-nav="1">Ngôi nhà của tôi</button><button data-cloud-open>Dự án</button><button data-v6-global="ideas">Thư viện ý tưởng</button><button data-nav="6">Báo giá vật liệu</button><button data-v6-global="expert">Chuyên gia</button><button data-v6-global="community">Cộng đồng</button></nav>'
    +'<div class="v6-head-actions"><label class="step01-search"><i>⌕</i><input id="globalSearch" placeholder="Tìm ý tưởng, vật liệu, chuyên gia…"></label><button class="step01-bell" data-v6-global="notifications" aria-label="Thông báo">♢<em>1</em></button><button class="step01-profile" data-cloud-open><i>⌂</i><span><b>Gia đình của bạn</b><small>'+BMH.v6Esc(s.district||s.province)+'</small></span><em>⌄</em></button></div>'
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
  BMH.state.project.source='upload';BMH.save();
  if(chosen.length>6)BMH.toast('Đã nhận 6 tệp đầu tiên. Hãy thêm phần còn lại ở lượt tiếp theo.');
  BMH.render({preserveScroll:true});

  BMH.v6.uploadBusy=true;
  try{
    await BMH.v6RefreshAIConfig({force:true,render:false});
    const mediaReady=!!BMH.geminiConfigured?.();
    if(!mediaReady){
      accepted.forEach(({item})=>item.status='Đã nhận · chờ AI media');
      BMH.v6.briefError='Tài liệu đã được thêm vào Step 1. AI media chưa sẵn sàng nên hệ thống giữ file để bạn tiếp tục làm việc.';
      BMH.render({preserveScroll:true});
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
    BMH.toast('Đã thêm '+accepted.length+' tài liệu vào Nguồn tham chiếu.');
  }finally{BMH.v6.uploadBusy=false;}
};
if(v6BaseScan){
  BMH.geminiScanFile=(file,intent=BMH.scan?.intent||'reference')=>BMH.v6ReceiveFiles([file],intent);
}

BMH.v6AnalyzeBrief=async()=>{
  const t=BMH.$('#aiStartPrompt');
  const prompt=(t?.value||BMH.v6.ideaDraft||'').trim();
  if(!prompt){BMH.toast('Hãy nhập ý tưởng về ngôi nhà trước khi phân tích.');t?.focus();return;}
  BMH.v6.ideaDraft=prompt;
  BMH.state.project.briefIdea=prompt;
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
    BMH.ai.result=data.result||null;BMH.ai.model=data.model||'';BMH.ai.lastAction='brief';
    if(data.result)BMH.applyAIBrief(data.result);
    BMH.state.project.source='ai-brief';
    BMH.save();
    BMH.toast('AI đã tạo brief. Step 1 giữ nguyên để bạn kiểm tra trước khi sang Step 2.');
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
  const ready=!!BMH.aiConfigured?.(),climate=BMH.regionProfile(p.site),members=BMH.v6Household().length;
  const aiStyle=BMH.v6Esc(brief.style||scanBuilding.style||p.style||'Hiện đại, tối giản');
  const floors=Number(brief.floors||scanBuilding.estimated_floors)||p.site.floors;
  const area=BMH.planArea(),budget=Number(brief.budget_vnd)||e.budget;
  const bedrooms=Number(brief.bedrooms)||Math.max(2,Math.round(members*.7));
  const uploads=Array.isArray(BMH.v6.uploads)?BMH.v6.uploads:[];
  const currentUpload=BMH.v6.upload;
  const heroSlides=[
    currentUpload?.dataUrl?{img:currentUpload.dataUrl,pos:'center center',kicker:'TỆP CỦA BẠN',title:'Bắt đầu từ chính hình ảnh bạn vừa chọn.',copy:'Tệp đã vào Step 1. Nếu AI online, hệ thống sẽ phân tích nội dung và tạo brief.'}:null,
    {img:'assets/rooms/facade-render.jpg',pos:'58% center',kicker:'AI HOME VISION',title:'Một ngôi nhà tốt bắt đầu từ một ý tưởng rõ ràng.',copy:'Hình ảnh chất lượng cao làm mốc thẩm mỹ; dữ liệu phía sau kiểm tra tính khả thi.'},
    {img:'assets/design/hero-step1.jpg',pos:'center 48%',kicker:'KHÔNG GIAN & ÁNH SÁNG',title:'Tỷ lệ, ánh sáng và khoảng xanh tạo nên cảm giác sống dễ chịu.',copy:'AI biến cảm hứng thành tiêu chí để kiểm tra ở các bước tiếp theo.'},
    {img:'assets/rooms/facade-local.jpg',pos:'center 48%',kicker:'MẶT TIỀN THAM KHẢO',title:'Mặt đứng gọn, có chiều sâu và đủ khoảng thở cho nhà phố.',copy:'Ảnh tham khảo định hướng thẩm mỹ, không thay thế hồ sơ kiến trúc.'},
    {img:'assets/rooms/living-local.jpg',pos:'center 54%',kicker:'NỘI THẤT & TRẢI NGHIỆM',title:'Không gian ấm, gọn và đủ ánh sáng cho nhịp sống hằng ngày.',copy:'Vật liệu và công năng sẽ được kiểm tra sau khi brief được xác nhận.'}
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
      +BMH.v6Title(1,'KHỞI TẠO','Khởi tạo','Bắt đầu từ ý tưởng. AI biến hình dung của bạn thành một brief rõ ràng để kiểm tra trước khi sang tài chính.')
      +'<label class="step01-drop" for="step1UploadAll" role="button" tabindex="0"><i>↥</i><b>Kéo thả file vào đây hoặc chọn từ thiết bị</b><span>JPG · PNG · WEBP · MP4 · MOV · PDF</span></label>'
      +'<div class="step01-upload-actions"><label for="step1UploadVideo" role="button" tabindex="0"><i>▶</i><span>Upload video</span></label><label for="step1UploadImage" role="button" tabindex="0"><i>▧</i><span>Upload ảnh</span></label><label for="step1UploadPdf" role="button" tabindex="0"><i class="pdf">PDF</i><span>Upload PDF</span></label><button data-s1-focus-prompt><i>▤</i><span>Nhập ý tưởng</span></button></div>'
      +'<label class="step01-prompt"><i>✎</i><textarea id="aiStartPrompt" maxlength="1000" rows="4" placeholder="Ví dụ: nhà 3 tầng, đất 5×20m, gia đình 5 người, có phòng ông bà tầng trệt, nhiều cây xanh, 4 phòng ngủ, ngân sách khoảng 2,5 tỷ…">'+BMH.v6Esc(BMH.v6.ideaDraft||p.briefIdea||'')+'</textarea><em><span id="step01PromptCount">'+String((BMH.v6.ideaDraft||p.briefIdea||'').length)+'</span>/1000</em></label>'
      +'<button class="step01-analyze '+(ready?'ready':'needs-key')+'" data-s1-analyze '+(BMH.v6.briefLoading?'disabled':'')+'>'+(BMH.v6.briefLoading?'◌ AI đang tạo brief…':'✦ AI phân tích & tạo brief →')+'</button>'
      +'<div class="step01-connection '+(ready?'online':'offline')+'"><i>'+(ready?'✓':'!')+'</i><div><b>'+(ready?'AI production đã kết nối':'AI production chưa kết nối')+'</b><span>'+(ready?'Backend đang nhận '+BMH.v6Esc(BMH.cloud?.config?.aiProvider||'AI')+' · '+BMH.v6Esc(BMH.cloud?.config?.aiModel||'model server'):(aiStatus.error?BMH.v6Esc(aiStatus.error):'Website đang chạy trên Vercel nhưng chưa nhận GEMINI_API_KEY ở môi trường Production.'))+'</span></div><button data-s1-ai-refresh>'+(aiStatus.loading?'Đang kiểm tra…':'Kiểm tra lại')+'</button></div>'
      +(BMH.v6.briefError?'<div class="step01-error">'+BMH.v6Esc(BMH.v6.briefError)+'</div>':'')
    +'</section>'

   +'<section class="v6-s1-hero step01-hero">'
      +'<img src="'+slide.img+'" alt="" style="object-position:'+BMH.v6Esc(slide.pos||'center center')+'"><div class="v6-image-shade"></div>'
      +'<div class="step01-hero-quote"><span>'+slide.kicker+'</span><h2>'+slide.title+'</h2><p>'+slide.copy+'</p></div>'
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
      +'<div class="step01-ai-head"><div><i>✦</i><span><b>AI hiểu trước</b><small>'+(result?'Brief vừa được tạo từ nội dung của bạn.':'Dữ liệu hiện tại của dự án, chờ AI bổ sung.')+'</small></span></div><em class="'+(ready?'ok':'warn')+'">'+(ready?'Đã kết nối':'Chưa kết nối')+'</em></div>'
      +'<div class="step01-ai-summary"><b>'+(result?BMH.v6Esc(result.headline||'Brief ban đầu đã sẵn sàng'):'Chưa có brief AI')+'</b><p>'+BMH.v6Esc(summary)+'</p>'+(priorities.length?'<div>'+priorities.map(x=>'<span>'+BMH.v6Esc(x)+'</span>').join('')+'</div>':'')+'</div>'
      +'<div class="step01-ai-facts">'
        +'<article><i>⌂</i><span><small>Phong cách</small><b>'+aiStyle+'</b></span><button data-nav="6" title="Chỉnh">✎</button></article>'
        +'<article><i>▱</i><span><small>Số tầng (ước tính)</small><b>'+floors+' tầng</b></span><button data-nav="4" title="Chỉnh">✎</button></article>'
        +'<article><i>▣</i><span><small>Diện tích kế hoạch</small><b>~ '+BMH.num(area)+' m²</b></span><button data-nav="5" title="Chỉnh">✎</button></article>'
        +'<article><i>◉</i><span><small>Ngân sách mục tiêu</small><b>'+BMH.money(budget)+'</b></span><button data-nav="2" title="Chỉnh">✎</button></article>'
        +'<article><i>☀</i><span><small>Khí hậu vùng</small><b>'+BMH.v6Esc(climate.climate)+'</b></span><button data-nav="3" title="Chỉnh">✎</button></article>'
        +'<article><i>♙</i><span><small>Hồ sơ gia đình</small><b>'+members+' thành viên</b></span><button data-nav="4" title="Chỉnh">✎</button></article>'
      +'</div>'
      +'<div class="step01-next"><i>☼</i><div><small>Gợi ý bước tiếp theo</small><b>'+(result?'Brief đã có. Kiểm tra lại rồi mới sang Hồ sơ tài chính & DTI.':'Nhập ý tưởng hoặc tải tài liệu để AI hiểu ngôi nhà trước khi sang tài chính.')+'</b></div><button data-nav="2">→</button></div>'
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
      +'<div class="step01-section-head"><div>'+BMH.v6PanelTitle('▥','Kết quả phân tích sơ bộ',result?'Kết hợp AI brief và rule engine hiện tại.':'Rule engine hiện tại; AI sẽ bổ sung sau khi kết nối.')+'</div><button '+(result?'data-ai-open':'data-s1-analyze')+'>Xem chi tiết →</button></div>'
      +'<div class="step01-prelim-grid">'
        +'<article><i class="ring" style="--p:'+fit+'"><b>'+fit+'%</b></i><span><small>Độ phù hợp nhu cầu</small><b>'+(fit>=85?'Rất cao':fit>=75?'Khá cao':'Cần chỉnh')+'</b></span></article>'
        +'<article><i class="bars">▮▮▮</i><span><small>Mức độ khả thi</small><b>'+feasibility+'</b></span></article>'
        +'<article><i>◉</i><span><small>Chi phí ước tính</small><b>'+BMH.money(e.total)+'</b></span></article>'
        +'<article><i>◷</i><span><small>Thời gian dự kiến</small><b>~ '+months+' tháng</b></span></article>'
      +'</div>'
    +'</section>'
   +'</div>';
};

BMH.screen2=()=>{
  const f=BMH.state.project.finance,s=BMH.financeSummary(),e=BMH.estimate(),income=Number(f.income)||0,pct=income?Math.round(BMH.clamp(s.dti*100,0,100)):null,active=BMH.BANKS.find(x=>x.id===f.bank)||BMH.BANKS[0];
  return '<div class="v6-s2">'
   +'<section class="v6-card v6-fin-form">'+BMH.v6Title(2,'TÀI CHÍNH','Biết giới hạn an toàn trước khi mơ lớn hơn.','Nhập dòng tiền thật. Mọi con số vay bên phải chỉ là kịch bản mô phỏng để hỗ trợ quyết định.')+'<div class="v6-fields">'+[['Thu nhập / tháng','project.finance.income',f.income],['Chi phí sinh hoạt','project.finance.living',f.living],['Tiền hiện có','project.finance.cash',f.cash],['Quỹ dự phòng','project.finance.reserve',f.reserve],['Nợ trả mỗi tháng','project.finance.existingDebt',f.existingDebt],['Khoản vay mong muốn','project.finance.loan',f.loan]].map(x=>'<label><span>'+x[0]+'</span><div><input data-path="'+x[1]+'" data-scale="1000000" type="number" value="'+Number(x[2]||0)/1000000+'"><em>triệu</em></div></label>').join('')+'<label><span>Thời hạn vay</span><div><input data-path="project.finance.years" type="number" value="'+f.years+'"><em>năm</em></div></label></div><button class="v6-primary full" data-ai-direct="cost">✦ AI phân tích khả năng tài chính →</button></section>'
   +'<section class="v6-card v6-fin-center"><div class="v6-fin-overview"><div class="v6-ring" style="--p:'+(pct||0)+'"><div><b>'+(pct===null?'—':pct+'%')+'</b><span>DTI</span></div></div><div><span>Khả năng chi trả</span><h2>'+(pct===null?'Chưa đủ dữ liệu để kết luận':pct<=36?'Dòng tiền đang trong vùng kiểm soát':pct<=45?'Nên giảm áp lực vay':'Áp lực trả nợ đang cao')+'</h2><div class="v6-kpi-row">'+BMH.v6Kpi('Khoản trả đỉnh',BMH.money(s.peak))+BMH.v6Kpi('Còn lại / tháng',BMH.money(s.remainder))+BMH.v6Kpi('Ngân sách xây',BMH.money(e.budget))+'</div></div></div><div class="v6-section-head"><div><b>So sánh ngân hàng</b><span>Logo thật/brand asset tại local · preset lãi suất để mô phỏng UX.</span></div><div class="v6-bank-active"><img src="'+BMH.v6Esc(active.img||'')+'"><b>'+BMH.v6Esc(active.name)+'</b></div></div><div class="v6-banks">'+BMH.BANKS.map(b=>'<button class="'+(f.bank===b.id?'active':'')+'" data-bank="'+b.id+'"><img src="'+BMH.v6Esc(b.img||'')+'" alt=""><span><b>'+BMH.v6Esc(b.name)+'</b><small>Ưu đãi '+b.intro+'% · '+b.months+' tháng</small><em>Sau ưu đãi '+b.post+'%</em></span><strong>'+BMH.money(BMH.monthlyPayment(f.loan,b.intro,Math.max(1,f.years*12)))+'</strong><i>'+(f.bank===b.id?'✓':'')+'</i></button>').join('')+'</div></section>'
   +'<aside class="v6-card v6-fin-ai">'+BMH.v6PanelTitle('✦','AI tư vấn tài chính','Không coi 0% DTI là “an toàn” khi thiếu dữ liệu.')+'<div class="v6-advice"><article><i>'+(pct!==null&&pct<=36?'✓':'!')+'</i><div><b>DTI</b><span>'+(pct===null?'Nhập thu nhập để tính.':'Tỷ lệ mô phỏng '+pct+'%.')+'</span></div></article><article><i>◉</i><div><b>Quỹ dự phòng</b><span>'+BMH.money(f.reserve)+' đang được giữ riêng.</span></div></article><article><i>'+(e.gap>=0?'✓':'!')+'</i><div><b>Cân đối xây dựng</b><span>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' so với ngân sách.':'Thiếu '+BMH.money(Math.abs(e.gap))+' so với dự toán.')+'</span></div></article></div><div class="v6-callout"><small>Ngân hàng đang chọn</small><b>'+BMH.v6Esc(active.name)+'</b><span>Hãy thay preset bằng báo giá tín dụng thực tế trước khi ra quyết định vay.</span></div></aside>'
   +'</div>';
};

BMH.screen3=()=>{
  const s=BMH.state.project.site,p=BMH.regionProfile(s),near=BMH.regionNearbyPlaces?.(s)||[];
  const options=(BMH.VN_REGION_ORDER||Object.keys(BMH.REGIONS||{})).map(x=>'<option value="'+BMH.v6Esc(x)+'" '+(s.province===x?'selected':'')+'>'+BMH.v6Esc(x)+'</option>').join('');
  const embed=BMH.mapEmbedUrl?.(s)||'';
  return '<div class="v6-s3">'
   +'<section class="v6-card v6-location-form">'+BMH.v6Title(3,'VỊ TRÍ','Đặt ngôi nhà vào đúng bối cảnh thật.','Vị trí quyết định nắng, gió, mưa, tiếp cận công trường và nhiều chi phí ẩn.')+'<div class="v6-fields"><label><span>Tỉnh / thành</span><select data-path="project.site.province">'+options+'</select></label><label><span>Khu vực / phường xã</span><input data-path="project.site.district" value="'+BMH.v6Esc(s.district||'')+'"></label><label><span>Địa chỉ cụ thể</span><input data-path="project.site.address" value="'+BMH.v6Esc(s.address||'')+'" placeholder="Nhập tên đường, phường/xã…"></label></div><div class="v6-inline-actions"><button class="v6-primary" data-geocode>⌖ Tìm trên bản đồ</button><button class="v6-secondary" data-device-location>Dùng GPS</button></div><div class="v6-coordinate"><b>'+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</b><span>'+BMH.v6Esc(s.geoSource||'Tọa độ dự án')+'</span></div></section>'
   +'<section class="v6-card v6-map-panel"><div class="v6-map-toolbar"><div><button data-map-style="satellite" class="'+(s.mapStyle==='satellite'?'active':'')+'">Vệ tinh</button><button data-map-style="hybrid" class="'+(s.mapStyle==='hybrid'?'active':'')+'">Hybrid</button><button data-map-style="roadmap" class="'+(s.mapStyle==='roadmap'?'active':'')+'">Bản đồ</button><button data-map-style="terrain" class="'+(s.mapStyle==='terrain'?'active':'')+'">Địa hình</button></div><span id="mapHudCoords">'+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</span></div><div id="map" class="map fallback-only"><div class="map-fallback"><div class="map-embed-shell v61-map-first"><iframe class="map-embed-frame" loading="eager" referrerpolicy="no-referrer-when-downgrade" src="'+BMH.v6Esc(embed)+'" title="Bản đồ khu đất"></iframe><div class="v61-map-overlay"><span>Vị trí dự án</span><b>'+BMH.v6Esc(s.district||s.province)+'</b><small>'+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</small></div></div></div></div><div class="v6-nearby">'+near.slice(0,4).map(x=>'<button data-nearby="'+BMH.v6Esc(x.name)+'" data-lat="'+x.lat+'" data-lng="'+x.lng+'"><b>'+BMH.v6Esc(x.name)+'</b><span>'+BMH.v6Esc(x.note||'Điểm tham chiếu')+'</span></button>').join('')+'</div></section>'
   +'<aside class="v6-card v6-climate">'+BMH.v6PanelTitle('☀','Hồ sơ khí hậu khu vực',s.province+' · '+s.district)+'<div class="v6-climate-grid">'+BMH.v6Kpi('Nhiệt độ',BMH.v6Esc(p.temp))+BMH.v6Kpi('Độ ẩm',BMH.v6Esc(p.humidity))+BMH.v6Kpi('Mùa mưa',BMH.v6Esc(p.wet))+BMH.v6Kpi('Gió chính',BMH.v6Esc(p.wind))+BMH.v6Kpi('Nguy cơ ngập',BMH.v6Esc(p.flood))+BMH.v6Kpi('Nắng nóng',BMH.v6Esc(p.heat))+'</div><div class="v6-climate-tip"><i>✦</i><div><b>Khuyến nghị thiết kế</b><span>'+BMH.v6Esc((p.designTips||[])[0]||'Ưu tiên thông gió, che nắng và thoát nước phù hợp địa phương.')+'</span></div></div></aside>'
   +'</div>';
};

BMH.screen4=()=>{
  const s=BMH.state.project.site,h=BMH.state.project.household,p=BMH.regionProfile(s),feng=BMH.fengProfile(),members=BMH.v6Household();
  return '<div class="v6-s4">'
   +'<section class="v6-card v6-s4-head">'+BMH.v6Title(4,'ĐẤT · ĐỊA CHẤT · GIA ĐÌNH','Một nền đất tốt và một ngôi nhà hợp với người sống trong đó.','Phần kỹ thuật, nhu cầu gia đình và phong thủy được tách rõ để tránh trộn lẫn niềm tin với yêu cầu an toàn.')+'<div class="v6-kpi-row">'+BMH.v6Kpi('Diện tích đất',BMH.num(s.width*s.depth)+' m²')+BMH.v6Kpi('Thành viên',members.length+' người')+BMH.v6Kpi('Số tầng',s.floors+' tầng')+BMH.v6Kpi('Hướng mặt tiền',BMH.v6Esc(s.frontDirection))+'</div></section>'
   +'<section class="v6-card v6-land">'+BMH.v6PanelTitle('▣','Khu đất & địa chất sơ bộ','Dùng để định hướng, không thay thế khảo sát hiện trường.')+'<div class="v6-fields two"><label><span>Ngang</span><div><input data-path="project.site.width" type="number" step=".1" value="'+s.width+'"><em>m</em></div></label><label><span>Sâu</span><div><input data-path="project.site.depth" type="number" step=".1" value="'+s.depth+'"><em>m</em></div></label><label><span>Số tầng</span><div><input data-path="project.site.floors" type="number" value="'+s.floors+'"><em>tầng</em></div></label><label><span>Đường tiếp cận</span><div><input data-path="project.site.road" type="number" step=".5" value="'+s.road+'"><em>m</em></div></label></div><div class="v6-soils">'+['Đất thịt đồng bằng','Đất cát','Đất sét','Đất yếu / bùn','Đất đá'].map((x,i)=>'<button data-soil="'+x+'" class="'+(s.soil===x?'active':'')+'"><i>'+['▰','▱','▧','▤','◆'][i]+'</i><b>'+x+'</b></button>').join('')+'</div><div class="v6-land-note"><b>'+BMH.v6Esc(p.climate)+'</b><span>Ngập: '+BMH.v6Esc(p.flood)+' · Bão/gió: '+BMH.v6Esc(p.storm)+' · Nhiệt: '+BMH.v6Esc(p.heat)+'</span></div></section>'
   +'<section class="v6-card v6-family">'+BMH.v6PanelTitle('♙','Thành viên gia đình','Mỗi người có năm sinh riêng; thêm/xóa ngay tại đây.')+'<div class="v6-people">'+members.map(BMH.v6PersonCard).join('')+'</div><div class="v6-person-actions"><button data-household-add="child">＋ Thêm con</button><button data-household-add="relative">＋ Thêm người thân</button>'+(h.partnerEnabled===false?'<button data-v6-partner="on">＋ Hiện bạn đời</button>':'')+'</div></section>'
   +'<section class="v6-card v6-feng">'+BMH.v6PanelTitle('☯','Phong thủy gia đình + AI nghiên cứu web','Lớp tham khảo, có nguồn và luôn đứng sau an toàn/công năng.')+'<div class="v6-feng-base"><div>'+BMH.compass()+'</div><div><small>Kết quả công thức cục bộ</small><h3>'+BMH.v6Esc(feng.title)+'</h3><p>'+BMH.v6Esc(feng.note)+'</p><b>Hướng tham khảo: '+BMH.v6Esc((feng.dirs||[]).join(' · '))+'</b><button class="v6-primary" data-v6-feng>✦ AI nghiên cứu đa nguồn</button></div></div>'+BMH.v6FengResult()+'</section>'
   +'</div>';
};

BMH.screen5=()=>{
  const ui=BMH.state.ui.planner,view=ui.view||'plan',floor=Number(ui.floor)||0,rooms=BMH.floorRooms(floor),selected=rooms.find(r=>r.id===ui.selected)||rooms[0]||null,r=BMH.designReview(),drawing=view==='plan'?BMH.planSvg({interactive:true,floor}):view==='elevation'?BMH.elevationSvg():BMH.sectionSvg();
  if(selected&&!ui.selected)ui.selected=selected.id;
  return '<div class="v6-s5">'
   +'<section class="v6-card v6-plan-head">'+BMH.v6Title(5,'BẢN VẼ','Mặt bằng phải dễ đọc trước khi nó thông minh.','Kéo phòng trực tiếp, chỉnh kích thước bên phải và chỉ bật lớp phân tích khi bạn cần.')+'<div class="v6-kpi-row">'+BMH.v6Kpi('Tầng',String(floor+1))+BMH.v6Kpi('Không gian',rooms.length+' phòng')+BMH.v6Kpi('Diện tích',BMH.num(rooms.reduce((a,x)=>a+x.w*x.h,0))+' m²')+BMH.v6Kpi('Điểm thiết kế',r.overall+'/100')+'</div></section>'
   +'<aside class="v6-card v6-plan-tools">'+BMH.v6PanelTitle('＋','Thư viện không gian','Nhấp để thêm vào tầng hiện tại.')+'<div class="v6-room-types">'+[['living','⌂','Khách'],['kitchen','♨','Bếp + ăn'],['bed','▰','Ngủ'],['bath','◫','WC'],['stairs','⌁','Cầu thang'],['garage','▣','Gara'],['balcony','▤','Ban công'],['corridor','↔','Hành lang']].map(x=>'<button data-add-room="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>').join('')+'</div><div class="v6-tool-buttons"><button data-plan-tool="door">▯ Thêm cửa đi</button><button data-plan-tool="window">▥ Thêm cửa sổ</button><button data-plan-undo>↶ Hoàn tác</button><button data-plan-redo>↷ Làm lại</button></div></aside>'
   +'<section class="v6-card v6-plan-main"><div class="v6-plan-toolbar"><div><button data-plan-view="plan" class="'+(view==='plan'?'active':'')+'">Mặt bằng</button>'+Array.from({length:BMH.state.project.site.floors},(_,i)=>'<button data-floor="'+i+'" class="'+(view==='plan'&&floor===i?'floor active':'')+'">T'+(i+1)+'</button>').join('')+'<button data-plan-view="elevation" class="'+(view==='elevation'?'active':'')+'">Mặt đứng</button><button data-plan-view="section" class="'+(view==='section'?'active':'')+'">Mặt cắt</button></div><div><button data-planner-fit>Fit</button><button data-planner-zoom="out">−</button><button data-planner-zoom="in">＋</button><button data-planner-fullscreen>⛶</button></div></div><div class="v6-plan-canvas technical-sheet">'+drawing+'</div><div class="v6-plan-legend"><span><i class="wall"></i>Tường</span><span><i class="window"></i>Cửa sổ</span><span><i class="green"></i>Sân/cây xanh</span><b>✋ Kéo phòng · resize tại điểm góc · zoom bằng nút điều khiển</b></div></section>'
   +'<aside class="v6-card v6-inspector">'+BMH.v6PanelTitle('◎','Thông tin bản vẽ',BMH.num(BMH.state.project.site.width)+' × '+BMH.num(BMH.state.project.site.depth)+'m · '+BMH.state.project.site.floors+' tầng')+(selected?'<div class="v6-room-editor"><div><small>PHÒNG ĐANG CHỌN</small><h3>'+BMH.v6Esc(selected.name)+'</h3></div><label>Tên phòng<input data-v6-room="name" value="'+BMH.v6Esc(selected.name)+'"></label><div class="v6-fields two"><label><span>Rộng</span><div><input data-v6-room="w" type="number" step=".1" value="'+selected.w+'"><em>m</em></div></label><label><span>Dài</span><div><input data-v6-room="h" type="number" step=".1" value="'+selected.h+'"><em>m</em></div></label></div><button class="v6-danger" data-room-delete>Xóa phòng</button></div>':'<p class="v6-empty">Chọn một phòng để chỉnh.')+'<div class="v6-room-list">'+rooms.map(x=>'<button data-room-select="'+x.id+'" class="'+(selected?.id===x.id?'active':'')+'"><span>'+BMH.v6Esc(x.name)+'</span><b>'+BMH.num(x.w*x.h)+' m²</b></button>').join('')+'</div><button class="v6-secondary full" data-ai-direct="review">✦ AI kiểm tra mặt bằng →</button></aside>'
   +'</div>';
};

BMH.screen6=()=>{
  const m=BMH.state.project.materials,e=BMH.estimate(),perf=BMH.performancePlan(),cat=BMH.state.ui.materialCategory||'floor',items=BMH.MATERIALS[cat]||[],meta=BMH.v6MatMeta[cat]||['▥','Vật liệu'];
  return '<div class="v6-s6">'
   +'<section class="v6-card v6-mat-head">'+BMH.v6Title(6,'SHOWROOM VẬT LIỆU','Chọn vật liệu như đang phối cả ngôi nhà, không phải chọn từng món rời rạc.','So sánh thẩm mỹ, độ bền, khí hậu, chi phí và hiệu suất vận hành trên cùng một màn hình.')+'<div class="v6-tier">'+[['economy','Tiết kiệm'],['standard','Tiêu chuẩn'],['premium','Cao cấp']].map(x=>'<button data-tier="'+x[0]+'" class="'+(m.tier===x[0]?'active':'')+'"><b>'+x[1]+'</b><span>'+(x[0]==='economy'?'Ưu tiên chi phí':x[0]==='standard'?'Cân bằng nhất':'Ưu tiên trải nghiệm')+'</span></button>').join('')+'</div></section>'
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
   +'<section class="v6-card v6-s7-head">'+BMH.v6Title(7,'MÔ PHỎNG 3D THẬT','Xoay, zoom, tách tầng và xem từng không gian ngay trên mô hình.','Phối cảnh AI là lớp cảm xúc. Mô hình WebGL ở giữa màn hình mới là lớp 3D tương tác dùng để kiểm tra phương án.')+'<div class="v6-score-pill"><small>Điểm tổng thể</small><b>'+r.overall+'<em>/100</em></b></div></section>'
   +'<aside class="v6-card v6-score">'+BMH.v6PanelTitle('◎','Đánh giá tổng thể','Công năng, khí hậu, ngân sách và tiện nghi.')+'<div class="v6-score-ring" style="--p:'+r.overall+'"><div><b>'+r.overall+'</b><span>/100</span></div></div><div class="v6-bars">'+[['Công năng',r.function],['Tiện nghi',r.comfort],['Thông gió',r.ventilation],['Ngân sách',r.budget],['Năng lượng',perf.energyScore]].map(x=>'<article><span>'+x[0]+'</span><i><b style="width:'+x[1]+'%"></b></i><em>'+x[1]+'</em></article>').join('')+'</div><button class="v6-secondary full" data-ai-direct="review">Xem phân tích AI →</button></aside>'
   +'<section class="v61-live3d" id="studio3dStage"><div class="studio-3d-loading" id="studio3dLoading"><i>⌂</i><b>Đang dựng mô hình 3D từ mặt bằng thật…</b><span>Mô hình dùng kích thước, tầng và vật liệu đang có trong dự án.</span></div><canvas id="studio3dCanvas" aria-label="Mô hình 3D tương tác ngôi nhà"></canvas><div class="studio-3d-fallback"><img src="assets/rooms/facade-render.jpg" alt="Phối cảnh dự phòng"><span>WebGL/CDN chưa tải được · đang hiển thị ảnh dự phòng</span></div><div class="v61-3d-top"><div><button class="'+(ui.sceneFocus==='all'?'active':'')+'" data-scene-focus-btn="all">Toàn nhà</button>'+Array.from({length:p.site.floors},(_,i)=>'<button class="'+(ui.sceneFocus==='floor:'+i?'active':'')+'" data-scene-focus-btn="floor:'+i+'">Tầng '+(i+1)+'</button>').join('')+'<select data-scene-focus><option value="all">Chọn phòng…</option>'+roomOptions+'</select></div><div><button data-scene-theme>'+(ui.sceneTheme==='night'?'☾ Ban đêm':'☀ Ban ngày')+'</button><button data-scene-explode class="'+(ui.sceneExploded?'active':'')+'">'+(ui.sceneExploded?'Ghép tầng':'Tách tầng')+'</button><button data-studio3d-reset>⌂ Góc đẹp</button></div></div><div class="v61-3d-hud">'+BMH.v6Kpi('Diện tích',BMH.num(BMH.planArea())+' m²')+BMH.v6Kpi('Số tầng',p.site.floors+'')+BMH.v6Kpi('Dự toán',BMH.money(e.total))+BMH.v6Kpi('Tiện nghi',r.comfort+'/100')+'</div><div class="v61-3d-tip">Kéo chuột để xoay · lăn chuột để zoom · chọn tầng/phòng để tập trung</div></section>'
   +'<aside class="v6-card v6-3d-ai">'+BMH.v6PanelTitle('✦','AI đánh giá phương án','Đọc dữ liệu dự án hiện tại.')+'<div class="v6-advice"><article><i>⌖</i><div><b>Vị trí & khí hậu</b><span>'+r.ventilation+'/100 · nắng, gió và thông thoáng.</span></div></article><article><i>⌂</i><div><b>Công năng sống</b><span>'+r.comfort+'/100 · mức thoải mái cho gia đình.</span></div></article><article><i>☀</i><div><b>Năng lượng</b><span>'+perf.energyScore+'/100 · PV có thể phủ khoảng '+perf.solarCoverage+'% nhu cầu tự dùng.</span></div></article><article><i>'+(e.gap>=0?'✓':'!')+'</i><div><b>Ngân sách</b><span>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' dự phòng.':'Vượt '+BMH.money(Math.abs(e.gap))+' so với trần ngân sách.')+'</span></div></article></div><div class="v61-cinematic-card"><img src="'+BMH.v6Esc(BMH.cinematicRender?.dataUrl||'assets/rooms/facade-render.jpg')+'" alt=""><div><small>PHỐI CẢNH CẢM XÚC</small><b>'+(BMH.cinematicRender?.dataUrl?'Phối cảnh AI hiện tại':'Ảnh tham khảo hiện tại')+'</b><button data-cinematic-render>✦ '+(BMH.cinematicRender?.loading?'Đang tạo…':'Tạo phối cảnh AI')+'</button></div></div></aside>'
   +'</div>';
};

BMH.screen8=()=>{
  const e=BMH.estimate(),perf=BMH.performancePlan(),snap=BMH.createDossierSnapshot(),c=snap.summary.completeness,rows=[['Móng & nền',e.shell*.25],['Phần thô',e.shell*.75],['Hoàn thiện',e.finish*.58],['MEP',e.finish*.22],['Nội thất',e.finish*.20]].filter(x=>x[1]>0),max=Math.max(...rows.map(x=>x[1]),1);
  return '<div class="v6-s8">'
   +'<section class="v6-card v6-cost-head">'+BMH.v6Title(8,'DỰ TOÁN','Biết tiền đi đâu trước khi công trình bắt đầu.','Mỗi thay đổi ở quy mô, vật liệu và hiệu suất đều đi vào tổng dự toán này.')+'<div class="v6-cost-total"><small>TỔNG ƯỚC TÍNH</small><b>'+BMH.money(e.total)+'</b><span>Ngân sách mục tiêu '+BMH.money(e.budget)+'</span></div></section>'
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

BMH.SCREENS=[BMH.screen1,BMH.screen2,BMH.screen3,BMH.screen4,BMH.screen5,BMH.screen6,BMH.screen7,BMH.screen8,BMH.screen9,BMH.screen10];

BMH.afterRender=()=>{
  const step=BMH.state.ui.step;
  if(step===1){
    ['all','video','image','pdf'].forEach(x=>BMH.v6EnsureUploadInput?.(x));
    const last=Number(BMH.v6.aiStatus?.checkedAt)||0;
    if(Date.now()-last>15000)BMH.v6RefreshAIConfig?.({force:false,render:true});
  }
  if(step===3){
    BMH.loadLiveWeather?.();BMH.loadClimateHistory?.();
    setTimeout(()=>Promise.resolve(BMH.initMapStudio?.()).catch(()=>{}),120);
  }
  if(step===5)setTimeout(()=>BMH.v61OrientPlanner?.(),40);
  if(step===7)BMH.mountStudio3D?.();
};

document.addEventListener('click',e=>{
  const global=e.target.closest?.('[data-v6-global]');
  if(global){
    const action=global.dataset.v6Global;
    if(action==='ideas'){ if(BMH.state.ui.step!==1)BMH.navigateTo(1);BMH.v6.ideaExpanded=true;BMH.render({preserveScroll:true});setTimeout(()=>document.querySelector('.step01-ideas')?.scrollIntoView({behavior:'smooth',block:'center'}),60);return; }
    if(action==='expert'){ BMH.aiOpen?.(); return; }
    if(action==='community'){ BMH.toast?.('Cộng đồng sẽ được hoàn thiện ở một tab riêng sau khi khóa xong các bước cốt lõi.'); return; }
    if(action==='notifications'){ BMH.toast?.('Hiện chưa có cảnh báo dự án mới.'); return; }
  }
  if(e.target.closest?.('[data-s1-ideas-toggle]')){e.preventDefault();BMH.v6.ideaExpanded=!BMH.v6.ideaExpanded;BMH.render({preserveScroll:true});setTimeout(()=>document.querySelector('.step01-ideas')?.scrollIntoView({behavior:'smooth',block:'center'}),40);return;}
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
    if(BMH.v6.upload?.id===id)BMH.v6.upload=BMH.v6.uploads[0]||null;
    BMH.render({preserveScroll:true});return;
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
    BMH.ai.open=true; BMH.ai.mode='whatif'; BMH.ai.prompt=q; BMH.render({preserveScroll:true});
  }
});

document.addEventListener('click',e=>{
  if(!e.target.closest?.('#app'))return;
  const pt=e.target.closest('[data-v6-partner]');
  if(pt){BMH.state.project.household.partnerEnabled=pt.dataset.v6Partner==='on';BMH.save();BMH.render({preserveScroll:true});return;}
  if(e.target.closest('[data-v6-feng]')){e.preventDefault();BMH.v6RunFeng();return;}
});

document.addEventListener('change',e=>{
  const person=e.target.closest?.('[data-v6-person]');
  if(person){
    const h=BMH.state.project.household,key=person.dataset.v6Person==='child'?'children':'relatives',row=h[key].find(x=>x.id===person.dataset.id);
    if(row){row[person.dataset.key]=person.dataset.key==='birth'?Number(person.value):person.value;BMH.save();BMH.render({preserveScroll:true});}
    return;
  }
  const rf=e.target.closest?.('[data-v6-room]');
  if(rf){
    const id=BMH.state.ui.planner.selected,room=BMH.state.project.plan.rooms.find(x=>x.id===id);
    if(room){const key=rf.dataset.v6Room;room[key]=key==='name'?rf.value:Number(rf.value);BMH.save();BMH.render({preserveScroll:true});}
  }
});

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
