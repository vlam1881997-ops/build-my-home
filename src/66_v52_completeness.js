/* Build My Home V5.2 — completeness upgrade requested from production QA. */
BMH.VERSION='5.2.0';
BMH.VISUAL_RELEASE='completeness-v52';
BMH.fengResearchState={loading:false,error:'',result:null,citations:[]};

BMH.materialImage=(cat,item)=>{
  if(item?.img)return item.img;
  if(cat==='paint')return'assets/materials/paint-fallback.jpg';
  if(cat==='door')return'assets/materials/aluminium-fallback.jpg';
  if(cat==='floor')return'assets/materials/tile-viglacera.jpg';
  const fallback={
    cement:'assets/design/flow-c.jpg',steel:'assets/design/flow-a.jpg',waterproof:'assets/design/flow-b.jpg',
    mep:'assets/design/flow-c.jpg',sanitary:'assets/rooms/living-local.jpg',roof:'assets/rooms/facade-local.jpg',
    insulation:'assets/design/flow-b.jpg',lighting:'assets/rooms/living-local.jpg',cabinetry:'assets/rooms/living-local.jpg'
  };
  return fallback[cat]||'assets/design/flow-c.jpg';
};

BMH.householdMembers=()=>{
  const h=BMH.state.project.household||{},list=[
    {kind:'owner',id:'owner',role:'Gia chủ',name:'Gia chủ',birth:h.ownerBirth,gender:h.ownerGender,removable:false},
  ];
  if(h.partnerEnabled!==false)list.push({kind:'partner',id:'partner',role:'Bạn đời',name:'Bạn đời',birth:h.partnerBirth,gender:h.partnerGender,removable:false});
  (h.children||[]).forEach(x=>list.push({kind:'child',id:x.id,role:'Con',name:x.name||'Con',birth:x.birth,gender:x.gender||'Trẻ em',removable:true,raw:x}));
  (h.relatives||[]).forEach(x=>list.push({kind:'relative',id:x.id,role:'Người thân',name:x.name||'Người thân',birth:x.birth,gender:x.gender||'Khác',removable:true,raw:x}));
  return list;
};

BMH.runFengResearch=async()=>{
  if(BMH.fengResearchState.loading)return;
  if(!BMH.aiConfigured?.()){BMH.fengResearchState.error='AI chưa được cấu hình trên máy chủ Production.';BMH.render({preserveScroll:true});return;}
  const h=BMH.state.project.household,s=BMH.state.project.site,members=BMH.householdMembers().map(x=>({role:x.role,name:x.name,birth:Number(x.birth)||0,gender:x.gender}));
  BMH.fengResearchState={loading:true,error:'',result:null,citations:[]};BMH.render({preserveScroll:true});
  try{
    const prompt=[
      'Nghiên cứu phong thủy nhà ở cho gia đình này bằng Google Search grounding.',
      'Đối chiếu nhiều nguồn công khai; ưu tiên nguồn giải thích Bát trạch/Cung phi rõ ràng và không bịa sách/tác giả.',
      'Phân biệt rõ phần truyền thống tham khảo với yêu cầu kiến trúc an toàn.',
      'Dữ liệu gia đình: '+JSON.stringify(members),
      'Khu đất: '+JSON.stringify({province:s.province,district:s.district,frontDirection:s.frontDirection,width:s.width,depth:s.depth,floors:s.floors})
    ].join('\n');
    const data=await BMH.aiCall('fengshui',prompt);
    BMH.fengResearchState={loading:false,error:'',result:data.result||null,citations:Array.isArray(data.citations)?data.citations:[]};
  }catch(err){BMH.fengResearchState={loading:false,error:err.message||String(err),result:null,citations:[]};}
  BMH.render({preserveScroll:true});
};

BMH.fengResearchHtml=()=>{
  const st=BMH.fengResearchState;
  if(st.loading)return '<div class="v52-feng-loading"><i>✦</i><span><b>AI đang nghiên cứu đa nguồn…</b><small>Đang dùng Google Search grounding để đối chiếu các nguồn công khai về phong thủy nhà ở.</small></span></div>';
  if(st.error)return '<div class="v52-feng-error"><b>Chưa nghiên cứu được</b><span>'+BMH.esc(st.error)+'</span></div>';
  const r=st.result;if(!r)return '<div class="v52-feng-empty"><b>Chưa chạy nghiên cứu đa nguồn</b><span>Bấm “AI nghiên cứu phong thủy” để tổng hợp nguồn web hiện hành thay vì chỉ dùng công thức cứng trong ứng dụng.</span></div>';
  const rec=(r.home_recommendations||[]).slice(0,6).map(x=>'<article><i class="'+BMH.esc(x.priority)+'">'+(x.priority==='high'?'!':'✓')+'</i><span><b>'+BMH.esc(x.area)+'</b><strong>'+BMH.esc(x.recommendation)+'</strong><small>'+BMH.esc(x.rationale)+'</small></span></article>').join('');
  const fam=(r.family||[]).slice(0,8).map(x=>'<article><b>'+BMH.esc(x.role)+'</b><span>'+x.birth+' · Cung '+x.kua+' · '+BMH.esc(x.group)+'</span><small>'+BMH.esc((x.good_directions||[]).join(' · '))+'</small></article>').join('');
  const sources=(st.citations||[]).slice(0,8).map((x,i)=>'<a href="'+BMH.esc(x.url)+'" target="_blank" rel="noopener noreferrer">'+(i+1)+'. '+BMH.esc(x.title||'Nguồn web')+'</a>').join('');
  return '<div class="v52-feng-result"><div class="v52-feng-summary"><span>Độ tin cậy tổng hợp '+BMH.clamp(Number(r.confidence)||0,0,100)+'%</span><h4>'+BMH.esc(r.headline||'Kết quả nghiên cứu')+'</h4><p>'+BMH.esc(r.summary||'')+'</p></div><div class="v52-feng-family">'+fam+'</div><div class="v52-feng-recs">'+rec+'</div>'+(sources?'<div class="v52-feng-sources"><b>Nguồn web AI đã dùng</b>'+sources+'</div>':'<div class="v52-feng-sources"><b>Nguồn web</b><span>Model không trả citation trong lần chạy này; kết quả vẫn chỉ nên xem là tham khảo.</span></div>')+'</div>';
};

BMH.memberEditor=(m)=>{
  if(m.kind==='owner')return '<article class="v52-person-card primary"><div class="v52-person-top"><span class="v52-avatar">⌂</span><div><b>Gia chủ</b><small>Thông tin dùng cho lớp Bát trạch tham khảo</small></div></div><label>Giới tính<select data-path="project.household.ownerGender"><option '+(m.gender==='Nam'?'selected':'')+'>Nam</option><option '+(m.gender==='Nữ'?'selected':'')+'>Nữ</option></select></label><label>Năm sinh<input data-path="project.household.ownerBirth" type="number" min="1900" max="2026" value="'+m.birth+'"></label></article>';
  if(m.kind==='partner')return '<article class="v52-person-card"><div class="v52-person-top"><span class="v52-avatar">♡</span><div><b>Bạn đời</b><small>Có thể tắt nếu không cần tính chung</small></div><button data-partner-toggle="off">Ẩn</button></div><label>Giới tính<select data-path="project.household.partnerGender"><option '+(m.gender==='Nam'?'selected':'')+'>Nam</option><option '+(m.gender==='Nữ'?'selected':'')+'>Nữ</option></select></label><label>Năm sinh<input data-path="project.household.partnerBirth" type="number" min="1900" max="2026" value="'+m.birth+'"></label></article>';
  const isChild=m.kind==='child', raw=m.raw||{};
  return '<article class="v52-person-card"><div class="v52-person-top"><span class="v52-avatar">'+(isChild?'☺':'♙')+'</span><div><b>'+BMH.esc(m.name)+'</b><small>'+(isChild?'Con':'Người thân')+'</small></div><button class="danger" data-person-remove="'+m.kind+'" data-id="'+BMH.esc(m.id)+'">Xóa</button></div><label>Tên<input data-person="'+m.kind+'" data-id="'+BMH.esc(m.id)+'" data-key="name" value="'+BMH.esc(m.name)+'"></label><label>Năm sinh<input data-person="'+m.kind+'" data-id="'+BMH.esc(m.id)+'" data-key="birth" type="number" min="1900" max="2026" value="'+m.birth+'"></label>'+(isChild?'<label>Phòng<select data-person="child" data-id="'+BMH.esc(m.id)+'" data-key="room"><option '+(raw.room==='Riêng'?'selected':'')+'>Riêng</option><option '+(raw.room!=='Riêng'?'selected':'')+'>Ngủ chung</option></select></label>':'<label>Di chuyển<select data-person="relative" data-id="'+BMH.esc(m.id)+'" data-key="mobility"><option '+(raw.mobility==='Bình thường'?'selected':'')+'>Bình thường</option><option '+(raw.mobility!=='Bình thường'?'selected':'')+'>Hạn chế nhẹ</option></select></label>')+'</article>';
};

BMH.screen4=()=>{
  const s=BMH.state.project.site,h=BMH.state.project.household,feng=BMH.fengProfile(),profile=BMH.regionProfile(s),members=BMH.householdMembers(),needs=BMH.householdNeeds();
  return '<div class="v52-step4">'
   +'<section class="v52-step-head card51"><div><span>Bước 4/10</span><h2>Đất, địa chất & phong thủy gia đình</h2><p>Thông tin thành viên được chỉnh trực tiếp; phong thủy là lớp tham khảo có AI nghiên cứu đa nguồn.</p></div><div class="v52-head-kpis"><article><small>Đất</small><b>'+BMH.num(s.width*s.depth)+'m²</b></article><article><small>Thành viên</small><b>'+members.length+'</b></article><article><small>Phòng ngủ cần</small><b>'+needs.bedrooms+'</b></article><article><small>Hướng hiện tại</small><b>'+BMH.esc(s.frontDirection)+'</b></article></div></section>'
   +'<section class="v52-family card51"><div class="v51-card-head"><div><i>♙</i><span><h3>Thành viên gia đình</h3><p>Chọn năm sinh cho từng người, thêm hoặc xóa ngay tại đây.</p></span></div></div><div class="v52-people">'+members.map(BMH.memberEditor).join('')+'</div><div class="v52-person-actions"><button data-household-add="child">＋ Thêm con</button><button data-household-add="relative">＋ Thêm người thân</button>'+(h.partnerEnabled===false?'<button data-partner-toggle="on">＋ Hiện bạn đời</button>':'')+'</div></section>'
   +'<section class="v52-land card51"><div class="v51-card-head"><div><i>▣</i><span><h3>Khu đất & địa chất sơ bộ</h3><p>Dữ liệu này ảnh hưởng bố trí, móng, thoát nước và dự toán.</p></span></div></div><div class="v52-land-fields"><label>Ngang<div><input data-path="project.site.width" type="number" step=".1" value="'+s.width+'"><em>m</em></div></label><label>Sâu<div><input data-path="project.site.depth" type="number" step=".1" value="'+s.depth+'"><em>m</em></div></label><label>Số tầng<div><input data-path="project.site.floors" type="number" value="'+s.floors+'"><em>tầng</em></div></label><label>Đường<div><input data-path="project.site.road" type="number" step=".5" value="'+s.road+'"><em>m</em></div></label></div><h4>Nền đất sơ bộ</h4><div class="v52-soils">'+['Đất thịt đồng bằng','Đất cát','Đất sét','Đất yếu / bùn','Đất đá'].map((x,i)=>'<button class="'+(s.soil===x?'active':'')+'" data-soil="'+x+'"><i>'+['▰','▱','▧','▤','◆'][i]+'</i><b>'+x+'</b></button>').join('')+'</div><div class="v52-site-note"><b>'+BMH.esc(profile.climate)+'</b><span>Ngập: '+BMH.esc(profile.flood)+' · Bão/gió: '+BMH.esc(profile.storm)+' · Nhiệt: '+BMH.esc(profile.heat)+'</span><small>Địa chất thật vẫn cần khảo sát hiện trường trước khi chốt móng.</small></div></section>'
   +'<section class="v52-feng card51"><div class="v51-card-head"><div><i>☯</i><span><h3>Phong thủy gia đình + AI nghiên cứu web</h3><p>Công thức cục bộ và kết quả AI được tách rõ để tránh biến niềm tin thành “sự thật kỹ thuật”.</p></span></div><button class="v52-research-btn" data-feng-research>✦ '+(BMH.fengResearchState.loading?'Đang nghiên cứu…':'AI nghiên cứu phong thủy')+'</button></div><div class="v52-feng-base"><div>'+BMH.compass()+'</div><div><h4>'+BMH.esc(feng.title)+'</h4><p>'+BMH.esc(feng.note)+'</p><strong>Hướng tham khảo: '+BMH.esc((feng.dirs||[]).join(' · '))+'</strong><small>Ưu tiên công năng, thông gió, chiếu sáng, an toàn và pháp lý trước lớp phong thủy.</small></div></div>'+BMH.fengResearchHtml()+'</section>'
   +'</div>';
};
BMH.SCREENS[3]=BMH.screen4;

/* Step 2: show a broader bank catalogue instead of only four rows. */
BMH.screen2=()=>{
  const f=BMH.state.project.finance,s=BMH.financeSummary(),e=BMH.estimate(),income=Number(f.income)||0,pct=income?Math.round(BMH.clamp(s.dti*100,0,100)):null;
  return '<div class="v52-step2">'
   +'<section class="v52-fin-input card51"><div class="v51-section-title"><span>Bước 2/10</span><h2>Hồ sơ tài chính & DTI</h2><p>Nhập dòng tiền thật rồi so sánh nhiều kịch bản vay. Lãi suất dưới đây chỉ là preset mô phỏng.</p></div><div class="v52-fin-fields"><label>Thu nhập/tháng<div><input data-path="project.finance.income" data-scale="1000000" type="number" value="'+f.income/1000000+'"><em>triệu</em></div></label><label>Chi phí sinh hoạt<div><input data-path="project.finance.living" data-scale="1000000" type="number" value="'+f.living/1000000+'"><em>triệu</em></div></label><label>Tiền hiện có<div><input data-path="project.finance.cash" data-scale="1000000" type="number" value="'+f.cash/1000000+'"><em>triệu</em></div></label><label>Quỹ dự phòng<div><input data-path="project.finance.reserve" data-scale="1000000" type="number" value="'+f.reserve/1000000+'"><em>triệu</em></div></label><label>Nợ trả mỗi tháng<div><input data-path="project.finance.existingDebt" data-scale="1000000" type="number" value="'+f.existingDebt/1000000+'"><em>triệu</em></div></label><label>Khoản vay mong muốn<div><input data-path="project.finance.loan" data-scale="1000000" type="number" value="'+f.loan/1000000+'"><em>triệu</em></div></label><label>Thời hạn vay<div><input data-path="project.finance.years" type="number" value="'+f.years+'"><em>năm</em></div></label></div><button class="v51-primary full" data-ai-direct="cost">✦ AI phân tích khả năng tài chính →</button></section>'
   +'<section class="v52-fin-dashboard card51"><div class="v52-dti-top"><div class="v52-dti-ring '+(pct===null?'empty':'')+'" style="--p:'+(pct||0)+'"><b>'+(pct===null?'—':pct+'%')+'</b><span>'+(pct===null?'Chưa đủ dữ liệu':'DTI mô phỏng')+'</span></div><div><span>Khả năng chi trả</span><h3>'+(pct===null?'Nhập thu nhập để bắt đầu':pct<=36?'Đang trong vùng kiểm soát':pct<=45?'Cần cân nhắc kỹ':'Áp lực trả nợ cao')+'</h3><p>Khoản trả đỉnh: <b>'+BMH.money(s.peak)+'/tháng</b></p><p>Còn lại sau sinh hoạt & nợ: <b>'+BMH.money(s.remainder)+'/tháng</b></p><p>Ngân sách xây dự kiến: <b>'+BMH.money(e.budget)+'</b></p></div></div><div class="v52-bank-title"><div><h3>Chọn ngân hàng / kịch bản vay</h3><p>'+BMH.BANKS.length+' lựa chọn để khách hàng mô phỏng; hãy cập nhật lãi thật khi có báo giá.</p></div></div><div class="v52-banks">'+BMH.BANKS.map(b=>'<button class="'+(f.bank===b.id?'active':'')+'" data-bank="'+b.id+'">'+(b.img?'<img src="'+b.img+'" alt="">':'<span class="v52-bank-logo">'+BMH.esc(b.id)+'</span>')+'<strong>'+BMH.esc(b.name)+'</strong><small>Ưu đãi '+b.intro+'% · '+b.months+' tháng</small><em>Sau ưu đãi '+b.post+'%</em><b>'+BMH.money(BMH.monthlyPayment(f.loan,b.intro,f.years*12))+'/tháng</b></button>').join('')+'</div></section>'
   +'<aside class="v52-fin-side card51"><div class="v51-card-head"><div><i>✦</i><span><h3>AI tư vấn tài chính</h3><p>Không coi 0% DTI là an toàn khi thiếu dữ liệu.</p></span></div></div><div class="v51-advice"><i>'+(pct!==null&&pct<=36?'✓':'!')+'</i><span><b>DTI</b><small>'+(pct===null?'Chưa đủ dữ liệu thu nhập để kết luận.':'Tỷ lệ mô phỏng '+pct+'%.')+'</small></span></div><div class="v51-advice"><i>◉</i><span><b>Dự phòng</b><small>'+BMH.money(f.reserve)+' đang được giữ ngoài ngân sách xây.</small></span></div><div class="v51-advice '+(e.gap>=0?'':'warn')+'"><i>'+(e.gap>=0?'✓':'!')+'</i><span><b>Cân đối xây dựng</b><small>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' so với dự toán hiện tại.':'Thiếu '+BMH.money(Math.abs(e.gap))+' so với dự toán hiện tại.')+'</small></span></div><div class="v52-fin-disclaimer">Preset ngân hàng là dữ liệu mô phỏng UX, không phải chào lãi suất hiện hành. Khi triển khai thương mại cần nối nguồn lãi suất có ngày cập nhật.</div></aside>'
   +'</div>';
};
BMH.SCREENS[1]=BMH.screen2;

/* Step 6: complete material categories + solar/energy module. */
BMH.screen6=()=>{
  const m=BMH.state.project.materials,e=BMH.estimate(),cat=BMH.state.ui.materialCategory||'floor',items=BMH.MATERIALS[cat]||[],perf=BMH.performancePlan(),score=BMH.materialClimateScore(),meta=BMH.MATERIAL_CATEGORY_META.find(x=>x[0]===cat)||['floor','▥','Vật liệu'];
  return '<div class="v52-step6">'
   +'<section class="v52-material-head card51"><div><span>Bước 6/10</span><h2>Vật liệu, hiệu quả & năng lượng</h2><p>Không chỉ chọn đẹp: theo dõi khí hậu, độ bền, chi phí, điện mặt trời và vận hành.</p></div><div class="v52-tier-row">'+[['economy','Tiết kiệm'],['standard','Tiêu chuẩn'],['premium','Cao cấp']].map(x=>'<button data-tier="'+x[0]+'" class="'+(m.tier===x[0]?'active':'')+'"><b>'+x[1]+'</b><small>'+(x[0]==='economy'?'Ưu tiên chi phí':x[0]==='standard'?'Cân bằng':'Ưu tiên trải nghiệm')+'</small></button>').join('')+'</div><div class="v52-material-score"><small>Phù hợp khí hậu</small><b>'+score+'%</b><span>Dự toán '+BMH.money(e.total)+'</span></div></section>'
   +'<section class="v52-material-menu card51">'+BMH.MATERIAL_CATEGORY_META.map(x=>'<button data-material-view="'+x[0]+'" class="'+(cat===x[0]?'active':'')+'"><i>'+x[1]+'</i><span>'+x[2]+'</span><em>'+(BMH.MATERIALS[x[0]]||[]).length+'</em></button>').join('')+'</section>'
   +'<section class="v52-material-products card51"><div class="v51-card-title"><span><i>'+meta[1]+'</i><b>'+meta[2]+'</b></span><small>'+items.length+' phương án</small></div><div class="v52-product-grid">'+items.map((x,i)=>'<article class="'+(m.choices[cat]===x.id?'active':'')+'"><img src="'+BMH.materialImage(cat,x)+'" alt=""><div><span class="tag">'+(i===0?'Cơ bản':i===items.length-1?'Nâng cấp':'Cân bằng')+'</span><h4>'+BMH.esc(x.name)+'</h4><p>'+BMH.esc(x.sub||'')+'</p><div class="metrics"><span>Khí hậu <b>'+Math.max(60,score-i)+'%</b></span><span>Bảo trì <b>'+(78+i*7)+'/100</b></span><span>Độ bền <b>'+(80+i*6)+'/100</b></span></div><strong>'+BMH.esc(BMH.materialPriceLabel(cat,x))+'</strong><button data-material-cat="'+cat+'" data-material="'+x.id+'">'+(m.choices[cat]===x.id?'✓ Đã chọn':'Chọn phương án')+'</button></div></article>').join('')+'</div><div class="v52-material-guide"><i>☀</i><span><b>Gợi ý theo khí hậu</b><small>'+BMH.esc(BMH.climateMaterialGuide(cat))+'</small></span></div></section>'
   +'<aside class="v52-energy card51"><div class="v51-card-head"><div><i>☀</i><span><h3>Năng lượng & điện mặt trời</h3><p>Tính toán sơ bộ đã quay trở lại màn vật liệu.</p></span></div></div><div class="v52-energy-kpis"><article><small>Diện tích mái khả dụng</small><b>'+BMH.num(perf.usableSolarArea,1)+' m²</b></article><article><small>Công suất PV đề xuất</small><b>'+BMH.num(perf.solarCapacity,1)+' kWp</b></article><article><small>Sản lượng ước tính</small><b>'+BMH.num(perf.solarYield,0)+' kWh/năm</b></article><article><small>Tỷ lệ tự dùng</small><b>'+perf.solarCoverage+'%</b></article><article><small>Tiết kiệm năng lượng</small><b>'+BMH.money(perf.annualEnergySavings)+'/năm</b></article><article><small>Hoàn vốn tổng gói</small><b>'+(perf.payback?BMH.num(perf.payback,1)+' năm':'—')+'</b></article></div><div class="v52-performance-toggles"><button data-performance="solarEnabled" class="'+(BMH.state.project.performance.solarEnabled?'active':'')+'">☀ Điện mặt trời</button><button data-performance="rainwaterEnabled" class="'+(BMH.state.project.performance.rainwaterEnabled?'active':'')+'">☂ Thu nước mưa</button><button data-performance="coolRoof" class="'+(BMH.state.project.performance.coolRoof?'active':'')+'">⌂ Mái chống nóng</button><button data-performance="smartShading" class="'+(BMH.state.project.performance.smartShading?'active':'')+'">▤ Lam che nắng</button></div><div class="v52-energy-note"><b>Ước tính sơ bộ</b><span>Sản lượng phụ thuộc bức xạ thực tế, bóng đổ, hướng/độ nghiêng mái, inverter và tổn hao hệ thống. Thi công cần đơn vị điện mặt trời khảo sát.</span></div></aside>'
   +'</div>';
};
BMH.SCREENS[5]=BMH.screen6;

/* Keep Step 1 upload always clickable. AI availability is reported after the file is chosen. */
const v52Screen1Base=BMH.screen1;
BMH.screen1=()=>{
  let html=v52Screen1Base();
  html=html.replaceAll('data-scan-upload disabled','data-scan-upload');
  html=html.replace('Chưa kết nối','Chọn tệp được');
  html=html.replace('AI tạo phương án sơ bộ →','AI tạo phương án sơ bộ →');
  return html;
};
BMH.SCREENS[0]=BMH.screen1;

/* Step 3: the embedded map is visible immediately, interactive Leaflet upgrades it when available. */
const v52Screen3Base=BMH.screen3;
BMH.screen3=()=>v52Screen3Base().replace('v51-map-main card51','v51-map-main card51 maps-studio');
BMH.SCREENS[2]=BMH.screen3;

const v52PrevAfterRender=BMH.afterRender;
BMH.afterRender=()=>{
  const step=BMH.state.ui.step;
  if(step===3){
    BMH.repairSiteData?.();
    BMH.loadLiveWeather?.();BMH.loadClimateHistory?.();
    BMH.renderMapIframeFallback?.('Bản đồ dự phòng đang hiển thị ngay; lớp tương tác sẽ thay thế nếu tải thành công.');
    setTimeout(()=>{Promise.resolve(BMH.initLeafletMap?.()).catch(()=>{});},50);
    return;
  }
  if(step===7){BMH.mountStudio3D?.();return;}
};

document.addEventListener('click',e=>{
  if(!e.target.closest?.('#app'))return;
  if(e.target.closest('[data-feng-research]')){e.preventDefault();BMH.runFengResearch();return;}
  const pt=e.target.closest('[data-partner-toggle]');
  if(pt){BMH.state.project.household.partnerEnabled=pt.dataset.partnerToggle==='on';BMH.save();BMH.render({preserveScroll:true});return;}
});

(function activateV52(){
  document.documentElement.classList.add('bmh-v52');
  document.documentElement.dataset.version=BMH.VERSION;
  BMH.repairSiteData?.();
  try{BMH.render({preserveScroll:true});}catch(_){}
})();