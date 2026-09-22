/* Build My Home V6.0 — product UI reset.
 * One visual system for all 10 steps. Keeps the existing engines, removes patch-on-patch UI.
 */
BMH.VERSION='6.0.0';
BMH.VISUAL_RELEASE='product-ui-reset-v60';

BMH.v6={
  upload:null,
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
  return '<header class="v6-header">'
    +'<button class="v6-brand" data-nav="1"><img src="assets/icon.svg" alt=""><span><b>Build My Home</b><small>AI HOME STUDIO</small></span></button>'
    +'<nav class="v6-topnav"><button data-nav="1">Ngôi nhà của tôi</button><button data-nav="5">Thiết kế</button><button data-nav="6">Vật liệu</button><button data-nav="8">Dự toán</button><button data-nav="9">Thi công</button></nav>'
    +'<div class="v6-head-actions"><button class="v6-location" data-nav="3">⌖ <span>'+BMH.v6Esc(s.district||s.province)+'</span></button><button class="v6-save" data-cloud-open>↥ Lưu dự án</button></div>'
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

const v6BaseScan=BMH.geminiScanFile;
if(v6BaseScan){
  BMH.geminiScanFile=async(file,intent=BMH.scan?.intent||'reference')=>{
    if(file){
      try{
        if((file.type||'').startsWith('image/')&&file.size<18*1024*1024){
          const dataUrl=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(String(fr.result||''));fr.onerror=rej;fr.readAsDataURL(file);});
          BMH.v6.upload={kind:'image',dataUrl,name:file.name,type:file.type,size:file.size};
        }else BMH.v6.upload={kind:(file.type||'').startsWith('video/')?'video':file.type==='application/pdf'?'pdf':'file',dataUrl:'',name:file.name,type:file.type,size:file.size};
        BMH.render({preserveScroll:true});
      }catch(_){}
    }
    return v6BaseScan(file,intent);
  };
}

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
  const p=BMH.state.project,e=BMH.estimate(),scan=BMH.scanExisting?.(),b=scan?.building||{},img=BMH.v6.upload?.dataUrl||'assets/design/hero-step1.jpg';
  return '<div class="v6-s1">'
   +'<section class="v6-s1-left v6-card">'+BMH.v6Title(1,'KHỞI TẠO','Cho AI xem điều bạn đang hình dung.','Bắt đầu bằng ảnh, video, PDF hoặc lời mô tả. Bạn nhìn thấy hướng đi trước, rồi mới chỉnh dữ liệu chi tiết.')+'<div class="v6-upload-zone" data-scan-upload><i>↥</i><b>Thả tệp vào đây hoặc chọn từ máy</b><span>JPG · PNG · MP4 · PDF · tối đa theo cấu hình máy chủ</span></div><div class="v6-upload-actions"><button data-scan-upload>▧ Ảnh / Video / PDF</button><button data-ai-open>✦ Mô tả bằng lời</button></div><label class="v6-textarea"><span>Mô tả ngắn về ngôi nhà</span><textarea id="aiStartPrompt" rows="5" placeholder="Ví dụ: đất 5×20m, nhà 3 tầng, gia đình 5 người, có phòng ông bà tầng trệt, nhiều cây xanh, ngân sách khoảng 2,5 tỷ…"></textarea></label><button class="v6-primary full" data-ai-start>✦ Tạo brief dự án bằng AI →</button></section>'
   +'<section class="v6-s1-hero"><img src="'+img+'" alt=""><div class="v6-image-shade"></div><div class="v6-hero-copy"><span>AI HOME VISION</span><h2>'+(BMH.v6.upload?'Ảnh của bạn đã sẵn sàng để phân tích.':'Một ngôi nhà tốt bắt đầu từ một ý tưởng đẹp.')+'</h2><p>Hình ảnh dẫn cảm xúc. Dữ liệu phía sau sẽ kiểm tra tính khả thi.</p></div><div class="v6-hero-facts">'+BMH.v6Kpi('Phong cách',BMH.v6Esc(b.style||p.style))+BMH.v6Kpi('Quy mô',p.site.floors+' tầng')+BMH.v6Kpi('Kế hoạch',BMH.num(BMH.planArea())+' m²')+BMH.v6Kpi('Ngân sách',BMH.money(e.budget))+'</div></section>'
   +'<aside class="v6-s1-right v6-card">'+BMH.v6PanelTitle('✦','AI hiểu trước','Các dữ liệu có thể chỉnh ở bước sau.')+'<div class="v6-fact-list"><article><i>⌂</i><div><small>Phong cách</small><b>'+BMH.v6Esc(b.style||p.style)+'</b></div></article><article><i>▱</i><div><small>Số tầng ước tính</small><b>'+(b.estimated_floors||p.site.floors)+' tầng</b></div></article><article><i>▣</i><div><small>Diện tích kế hoạch</small><b>'+BMH.num(BMH.planArea())+' m²</b></div></article><article><i>◉</i><div><small>Vùng khí hậu</small><b>'+BMH.v6Esc(BMH.regionProfile(p.site).climate)+'</b></div></article></div><div class="v6-next-card"><small>Gợi ý bước tiếp theo</small><b>Khóa trần ngân sách và DTI trước khi đầu tư quá sâu vào thiết kế.</b><button data-nav="2">Đi tài chính →</button></div></aside>'
   +'<section class="v6-wide-card v6-s1-gallery">'+BMH.v6PanelTitle('◫','Nguồn cảm hứng','Ảnh tham chiếu chỉ dùng để hiểu gu thẩm mỹ.')+'<div class="v6-gallery"><article><img src="assets/design/flow-a.jpg"><span>Sân trong & cây xanh</span></article><article><img src="assets/design/flow-b.jpg"><span>Giếng trời & thông tầng</span></article><article><img src="assets/rooms/living-local.jpg"><span>Nội thất ấm cúng</span></article><article><img src="assets/design/flow-c.jpg"><span>Ngôn ngữ vật liệu</span></article></div></section>'
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
  return '<div class="v6-s3">'
   +'<section class="v6-card v6-location-form">'+BMH.v6Title(3,'VỊ TRÍ','Đặt ngôi nhà vào đúng bối cảnh thật.','Vị trí quyết định nắng, gió, mưa, tiếp cận công trường và nhiều chi phí ẩn.')+'<div class="v6-fields"><label><span>Tỉnh / thành</span><select data-path="project.site.province">'+options+'</select></label><label><span>Khu vực / phường xã</span><input data-path="project.site.district" value="'+BMH.v6Esc(s.district||'')+'"></label><label><span>Địa chỉ cụ thể</span><input data-path="project.site.address" value="'+BMH.v6Esc(s.address||'')+'" placeholder="Nhập tên đường, phường/xã…"></label></div><div class="v6-inline-actions"><button class="v6-primary" data-geocode>⌖ Tìm trên bản đồ</button><button class="v6-secondary" data-device-location>Dùng GPS</button></div><div class="v6-coordinate"><b>'+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</b><span>'+BMH.v6Esc(s.geoSource||'Tọa độ dự án')+'</span></div></section>'
   +'<section class="v6-card v6-map-panel"><div class="v6-map-toolbar"><div><button data-map-style="satellite" class="'+(s.mapStyle==='satellite'?'active':'')+'">Vệ tinh</button><button data-map-style="hybrid" class="'+(s.mapStyle==='hybrid'?'active':'')+'">Hybrid</button><button data-map-style="roadmap" class="'+(s.mapStyle==='roadmap'?'active':'')+'">Bản đồ</button><button data-map-style="terrain" class="'+(s.mapStyle==='terrain'?'active':'')+'">Địa hình</button></div><span id="mapHudCoords">'+Number(s.lat).toFixed(5)+', '+Number(s.lng).toFixed(5)+'</span></div><div id="map" class="map map-loading"><div class="map-fallback"><div class="v6-map-loading"><i>⌖</i><b>Đang mở bản đồ khu đất…</b><span>Nếu lớp tương tác chậm, bản đồ nhúng sẽ hiển thị trước.</span></div></div></div><div class="v6-nearby">'+near.slice(0,4).map(x=>'<button data-nearby="'+BMH.v6Esc(x.name)+'" data-lat="'+x.lat+'" data-lng="'+x.lng+'"><b>'+BMH.v6Esc(x.name)+'</b><span>'+BMH.v6Esc(x.note||'Điểm tham chiếu')+'</span></button>').join('')+'</div></section>'
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
  const p=BMH.state.project,r=BMH.designReview(),e=BMH.estimate(),perf=BMH.performancePlan(),hero=BMH.cinematicRender?.dataUrl||'assets/rooms/facade-render.jpg';
  return '<div class="v6-s7">'
   +'<section class="v6-card v6-s7-head">'+BMH.v6Title(7,'MÔ PHỎNG 3D','Nhìn thấy ngôi nhà trước khi bạn bỏ tiền để xây nó.','Phối cảnh cảm xúc ở trung tâm; dữ liệu đánh giá và mô hình kỹ thuật ở hai bên để kiểm chứng.')+'<div class="v6-score-pill"><small>Điểm tổng thể</small><b>'+r.overall+'<em>/100</em></b></div></section>'
   +'<aside class="v6-card v6-score">'+BMH.v6PanelTitle('◎','Đánh giá tổng thể','Tổng hợp từ công năng, khí hậu, ngân sách và tiện nghi.')+'<div class="v6-score-ring" style="--p:'+r.overall+'"><div><b>'+r.overall+'</b><span>/100</span></div></div><div class="v6-bars">'+[['Công năng',r.function],['Tiện nghi',r.comfort],['Thông gió',r.ventilation],['Ngân sách',r.budget],['Năng lượng',perf.energyScore]].map(x=>'<article><span>'+x[0]+'</span><i><b style="width:'+x[1]+'%"></b></i><em>'+x[1]+'</em></article>').join('')+'</div><button class="v6-secondary full" data-ai-direct="review">Xem phân tích AI →</button></aside>'
   +'<section class="v6-cinema"><img src="'+hero+'" alt=""><div class="v6-image-shade"></div><div class="v6-cinema-copy"><span>YOUR HOME · VISUAL PREVIEW</span><h2>Tổ ấm hôm nay.<br>Hạnh phúc mai sau.</h2><p>'+BMH.v6Esc(p.style)+' · '+p.site.floors+' tầng · '+BMH.num(BMH.planArea())+' m² kế hoạch</p></div><div class="v6-cinema-actions"><button data-scene-theme>'+(BMH.state.ui.sceneTheme==='night'?'☾ Ban đêm':'☀ Ban ngày')+'</button><button class="primary" data-cinematic-render>✦ '+(BMH.cinematicRender?.loading?'Đang tạo…':'Tạo phối cảnh AI mới')+'</button></div><div class="v6-scene-dock"><button class="active" data-scene-focus-btn="all">⌂<span>Ngoại thất</span></button><button data-scene-explode>◇<span>Cutaway</span></button>'+Array.from({length:p.site.floors},(_,i)=>'<button data-scene-focus-btn="floor:'+i+'">▱<span>Tầng '+(i+1)+'</span></button>').join('')+'<button data-scene-focus-btn="room:r1">▣<span>Phòng khách</span></button></div></section>'
   +'<aside class="v6-card v6-3d-ai">'+BMH.v6PanelTitle('✦','AI đánh giá phương án','Đọc dữ liệu dự án hiện tại.')+'<div class="v6-advice"><article><i>⌖</i><div><b>Vị trí & khí hậu</b><span>'+r.ventilation+'/100 · nắng, gió và thông thoáng.</span></div></article><article><i>⌂</i><div><b>Công năng sống</b><span>'+r.comfort+'/100 · mức thoải mái cho gia đình.</span></div></article><article><i>☀</i><div><b>Năng lượng</b><span>'+perf.energyScore+'/100 · PV có thể phủ khoảng '+perf.solarCoverage+'% nhu cầu tự dùng.</span></div></article><article><i>'+(e.gap>=0?'✓':'!')+'</i><div><b>Ngân sách</b><span>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' dự phòng.':'Vượt '+BMH.money(Math.abs(e.gap))+' so với trần ngân sách.')+'</span></div></article></div><details class="v6-tech"><summary>Mở mô hình 3D kỹ thuật →</summary><div>'+BMH.studio3DHtml()+'</div></details></aside>'
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
  if(step===3){
    BMH.loadLiveWeather?.();BMH.loadClimateHistory?.();
    BMH.renderMapIframeFallback?.('Bản đồ dự phòng đang hiển thị trước; lớp tương tác sẽ thay thế khi tải xong.');
    setTimeout(()=>Promise.resolve(BMH.initMapStudio?.()).catch(()=>{}),80);
  }
  if(step===7)BMH.mountStudio3D?.();
};

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
