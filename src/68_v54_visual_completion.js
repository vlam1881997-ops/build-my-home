/* Build My Home V5.4 — visual completion + bank brand pass.
 * Completes the promised next visual round for Steps 2, 3, 4, 6, 8, 9, 10.
 */
BMH.VERSION='5.4.0';
BMH.VISUAL_RELEASE='visual-completion-v54';

const bankLogoMap={
  VPB:'assets/banks/vpb.svg',TPB:'assets/banks/tpb.svg',HDB:'assets/banks/hdb.svg',VIB:'assets/banks/vib.svg',
  SHB:'assets/banks/shb.svg',MSB:'assets/banks/msb.svg',OCB:'assets/banks/ocb.svg',STB:'assets/banks/stb.svg'
};
BMH.BANKS.forEach(b=>{if(bankLogoMap[b.id])b.img=bankLogoMap[b.id];});

BMH.v54BankCard=(b,f)=>{
  const selected=f.bank===b.id;
  const payment=BMH.monthlyPayment(f.loan,b.intro,Math.max(1,f.years*12));
  return '<button class="v54-bank '+(selected?'active':'')+'" data-bank="'+b.id+'">'
    +'<span class="v54-bank-logo"><img src="'+BMH.esc(b.img||'')+'" alt="'+BMH.esc(b.name)+'"></span>'
    +'<span class="v54-bank-copy"><b>'+BMH.esc(b.name)+'</b><small>Ưu đãi '+b.intro+'% · '+b.months+' tháng</small><em>Sau ưu đãi '+b.post+'%</em></span>'
    +'<span class="v54-bank-pay"><small>Ước tính tháng đầu</small><b>'+BMH.money(payment)+'</b></span>'
    +'<i class="v54-bank-radio">'+(selected?'✓':'')+'</i></button>';
};

BMH.screen2=()=>{
  const f=BMH.state.project.finance,s=BMH.financeSummary(),e=BMH.estimate(),income=Number(f.income)||0,pct=income?Math.round(BMH.clamp(s.dti*100,0,100)):null;
  const active=BMH.BANKS.find(b=>b.id===f.bank)||BMH.BANKS[0];
  return '<div class="v54-step2">'
    +'<section class="v54-fin-hero card51"><div><span>BƯỚC 2/10 · TÀI CHÍNH</span><h1>Chọn căn nhà phù hợp với cuộc sống, không phải một khoản vay quá sức.</h1><p>Nhập dòng tiền thật, so sánh nhiều kịch bản và giữ một quỹ dự phòng rõ ràng trước khi chốt thiết kế.</p></div><div class="v54-fin-hero-kpi"><small>DTI mô phỏng</small><b>'+(pct===null?'—':pct+'%')+'</b><span>'+(pct===null?'Cần nhập thu nhập':pct<=36?'Trong vùng kiểm soát':pct<=45?'Cần cân nhắc':'Áp lực trả nợ cao')+'</span></div></section>'
    +'<section class="v54-fin-input card51"><div class="v54-section-title"><b>Hồ sơ tài chính</b><small>Những con số cốt lõi để AI và engine tính đúng.</small></div><div class="v54-fin-fields">'
    +[['Thu nhập / tháng','project.finance.income',f.income],['Chi phí sinh hoạt','project.finance.living',f.living],['Tiền hiện có','project.finance.cash',f.cash],['Quỹ dự phòng','project.finance.reserve',f.reserve],['Nợ trả mỗi tháng','project.finance.existingDebt',f.existingDebt],['Khoản vay mong muốn','project.finance.loan',f.loan]].map(x=>'<label><span>'+x[0]+'</span><div><input data-path="'+x[1]+'" data-scale="1000000" type="number" value="'+Number(x[2]||0)/1000000+'"><em>triệu</em></div></label>').join('')
    +'<label><span>Thời hạn vay</span><div><input data-path="project.finance.years" type="number" value="'+f.years+'"><em>năm</em></div></label></div><button class="v54-primary full" data-ai-direct="cost">✦ AI phân tích tài chính →</button><p class="v54-disclaimer">Các lãi suất trên màn hình là preset mô phỏng UX, không phải báo giá tín dụng trực tiếp từ ngân hàng.</p></section>'
    +'<section class="v54-fin-main card51"><div class="v54-dti-summary"><div class="v54-dti-ring '+(pct===null?'empty':'')+'" style="--p:'+(pct||0)+'"><div><b>'+(pct===null?'—':pct+'%')+'</b><span>DTI</span></div></div><div><small>Khả năng chi trả</small><h2>'+(pct===null?'Chưa đủ dữ liệu để kết luận':pct<=36?'Dòng tiền đang ở vùng kiểm soát':pct<=45?'Nên giảm áp lực vay hoặc tăng dự phòng':'Khoản vay đang tạo áp lực cao')+'</h2><div class="v54-money-kpis"><span><small>Khoản trả đỉnh</small><b>'+BMH.money(s.peak)+'</b></span><span><small>Còn lại mỗi tháng</small><b>'+BMH.money(s.remainder)+'</b></span><span><small>Ngân sách xây</small><b>'+BMH.money(e.budget)+'</b></span></div></div></div>'
    +'<div class="v54-bank-head"><div><b>So sánh ngân hàng</b><small>'+BMH.BANKS.length+' lựa chọn · chọn một kịch bản để cập nhật phép tính.</small></div><div class="v54-active-bank"><span>Đang chọn</span><img src="'+BMH.esc(active.img||'')+'" alt=""><b>'+BMH.esc(active.name)+'</b></div></div><div class="v54-bank-grid">'+BMH.BANKS.map(b=>BMH.v54BankCard(b,f)).join('')+'</div></section>'
    +'<aside class="v54-fin-ai card51"><div class="v53-ai-head"><div><i>✦</i><span><b>AI tư vấn tài chính</b><small>Đọc hồ sơ hiện tại, không thay thế quyết định tín dụng.</small></span></div><em class="'+(pct!==null&&pct<=36?'ok':'wait')+'">'+(pct===null?'Chờ dữ liệu':pct<=36?'Ổn':'Cần xem')+'</em></div><div class="v54-ai-facts"><article><i>◔</i><span><b>DTI</b><small>'+(pct===null?'Nhập thu nhập để tính.':'Tỷ lệ hiện tại '+pct+'%.')+'</small></span></article><article><i>▣</i><span><b>Quỹ dự phòng</b><small>'+BMH.money(f.reserve)+' đang được giữ ngoài ngân sách xây.</small></span></article><article><i>⌂</i><span><b>Cân đối xây dựng</b><small>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' so với trần ngân sách.':'Thiếu '+BMH.money(Math.abs(e.gap))+' so với dự toán.')+'</small></span></article><article><i>◎</i><span><b>Ngân hàng đang chọn</b><small>'+BMH.esc(active.name)+' · preset '+active.intro+'% ưu đãi.</small></span></article></div><button class="v54-secondary full" data-ai-direct="cost">Xem khuyến nghị chi tiết →</button></aside>'
    +'</div>';
};
BMH.SCREENS[1]=BMH.screen2;

const v54Screen3Base=BMH.screen3;
BMH.screen3=()=>{
  let html=v54Screen3Base();
  html=html.replace('<div class="v51-step3">','<div class="v51-step3 v54-step3"><section class="v54-step-banner card51"><div><span>BƯỚC 3/10 · VỊ TRÍ & KHÍ HẬU</span><h2>Đặt ngôi nhà vào đúng bối cảnh thật.</h2><p>Vị trí, nắng, gió, mưa và tiếp cận công trình quyết định rất nhiều đến cảm giác sống và chi phí vận hành.</p></div><i>⌖</i></section>');
  html=html.replace('Đang kết nối bản đồ…','Đang mở bản đồ khu đất…');
  html=html.replace('Nếu tile phản hồi chậm, hệ thống tự bật bản đồ dự phòng.','Bản đồ dự phòng hiển thị trước; lớp tương tác sẽ thay thế khi tải xong.');
  return html;
};
BMH.SCREENS[2]=BMH.screen3;

const v54Screen4Base=BMH.screen4;
BMH.screen4=()=>{
  let html=v54Screen4Base();
  html=html.replace('<div class="v52-step4">','<div class="v52-step4 v54-step4">');
  html=html.replace('AI nghiên cứu phong thủy','AI nghiên cứu đa nguồn');
  return html;
};
BMH.SCREENS[3]=BMH.screen4;

const v54Screen6Base=BMH.screen6;
BMH.screen6=()=>{
  let html=v54Screen6Base();
  html=html.replace('<div class="v52-step6">','<div class="v52-step6 v54-step6">');
  html=html.replace('Vật liệu, hiệu quả & năng lượng','Vật liệu, thẩm mỹ & hiệu suất ngôi nhà');
  return html;
};
BMH.SCREENS[5]=BMH.screen6;

BMH.screen8=()=>{
  const e=BMH.estimate(),perf=BMH.performancePlan(),snap=BMH.createDossierSnapshot(),c=snap.summary.completeness;
  const rows=[['Móng & nền',e.shell*.25,'⌁'],['Phần thô',e.shell*.75,'▰'],['Hoàn thiện',e.finish*.58,'▧'],['MEP',e.finish*.22,'⚙'],['Nội thất',e.finish*.20,'▣']].filter(x=>x[1]>0);
  const max=Math.max(...rows.map(x=>x[1]),1);
  return '<div class="v54-step8">'
    +'<section class="v54-cost-hero card51"><div><span>BƯỚC 8/10 · DỰ TOÁN</span><h1>Biết tiền đi đâu trước khi công trình bắt đầu.</h1><p>Dự toán kết nối trực tiếp với quy mô, vật liệu và các tùy chọn hiệu suất đã chọn ở những bước trước.</p></div><div class="v54-cost-total"><small>Tổng kinh phí ước tính</small><b>'+BMH.money(e.total)+'</b><span>Ngân sách mục tiêu '+BMH.money(e.budget)+'</span></div></section>'
    +'<section class="v54-cost-main card51"><div class="v54-cost-visual"><img src="assets/design/hero-step1.jpg" alt=""><div><span>NHÀ CỦA BẠN</span><b>'+BMH.state.project.site.floors+' tầng · '+BMH.num(BMH.planArea())+' m²</b><small>'+BMH.esc(BMH.state.project.style)+'</small></div></div><div class="v54-cost-breakdown"><div class="v54-section-title"><b>Cơ cấu chi phí</b><small>Các nhóm lớn để bạn thấy khoản nào đang nặng nhất.</small></div>'+rows.map(x=>'<article><i>'+x[2]+'</i><span><b>'+x[0]+'</b><small>'+Math.round(x[1]/Math.max(1,e.total)*100)+'% tổng dự toán</small><em><strong style="width:'+Math.max(8,Math.round(x[1]/max*100))+'%"></strong></em></span><b>'+BMH.money(x[1])+'</b></article>').join('')+'</div></section>'
    +'<aside class="v54-cost-side card51"><div class="v54-section-title"><b>Trạng thái hồ sơ</b><small>Không khóa chức năng trong bản phát triển.</small></div><div class="v54-complete-ring" style="--p:'+c.percent+'"><div><b>'+c.percent+'%</b><span>hoàn thiện</span></div></div><div class="v54-doc-list"><span>✓ Mặt bằng / mặt đứng / mặt cắt</span><span>✓ Dự toán tổng & BOQ</span><span>✓ Vật liệu & hiệu suất</span><span>✓ Checklist MEP</span><span>✓ Dòng tiền & tiến độ</span></div><button class="v54-secondary full" data-export="estimate">Tải dự toán hiện tại ↓</button><button class="v54-primary full" data-nav="9">Tiếp tục sang thi công →</button></aside>'
    +'<section class="v54-ops card51"><div><span><small>Điện vận hành / năm</small><b>'+BMH.money(perf.annualElectricCost)+'</b></span><span><small>Tiết kiệm năng lượng / năm</small><b>'+BMH.money(perf.annualEnergySavings)+'</b></span><span><small>Sản lượng PV</small><b>'+BMH.num(perf.solarYield,0)+' kWh</b></span><span><small>Tiết kiệm 10 năm</small><b>'+BMH.money(perf.tenYearSavings)+'</b></span></div></section>'
    +'</div>';
};
BMH.SCREENS[7]=BMH.screen8;

BMH.screen9=()=>{
  const d=BMH.state.project.dossier||{},schedule=BMH.dossierSchedule(),mep=BMH.mepChecklistRows(),progress=BMH.clamp(Number(d.progress)||0,0,100),checked=mep.filter(x=>x.checked).length,next=schedule.find(x=>x.status!=='done')||schedule.at(-1);
  const openMep=Math.max(0,mep.length-checked);
  return '<div class="v54-step9">'
    +'<section class="v54-build-head card51"><div><span>BƯỚC 9/10 · GIÁM SÁT THI CÔNG</span><h1>Một màn hình để biết công trình đang ở đâu và việc gì chưa được phép bỏ sót.</h1></div><div class="v54-progress"><small>Tổng tiến độ</small><b>'+progress+'%</b><i><span style="width:'+progress+'%"></span></i></div></section>'
    +'<aside class="v54-timeline card51"><div class="v54-section-title"><b>Tiến độ thi công</b><small>Dựa trên lịch dự án hiện tại.</small></div><div class="v54-time-list">'+schedule.map(x=>'<article class="'+x.status+'"><i>'+(x.status==='done'?'✓':x.status==='active'?'●':'○')+'</i><span><b>'+BMH.esc(x.name)+'</b><small>'+BMH.dateLabel(x.start)+' → '+BMH.dateLabel(x.end)+'</small></span><em>'+(x.status==='done'?'Hoàn thành':x.status==='active'?'Đang làm':'Sắp tới')+'</em></article>').join('')+'</div></aside>'
    +'<section class="v54-build-main"><div class="v54-build-kpis card51"><span><small>Công việc hiện tại</small><b>'+BMH.esc(next?.name||'Theo kế hoạch')+'</b></span><span><small>MEP đã kiểm</small><b>'+checked+'/'+mep.length+'</b></span><span><small>MEP còn mở</small><b>'+openMep+'</b></span><span><small>Ngày hoàn thành</small><b>'+BMH.dateLabel(schedule.at(-1)?.end||d.startDate)+'</b></span></div><div class="v54-site-work card51"><div class="v54-section-title"><b>Nhật ký hiện trường</b><small>Không giả ảnh công trường khi chưa có dữ liệu thật.</small></div><div class="v54-site-empty"><i>＋</i><div><b>Chưa có ảnh thực địa</b><span>Khi module nhật ký ảnh được nối, AI có thể nhóm ảnh theo giai đoạn, phát hiện issue và đối chiếu checklist.</span></div></div></div><div class="v54-mep card51"><div class="v54-section-title"><b>Checklist nghiệm thu MEP</b><small>Ưu tiên kiểm tra trước khi hạng mục bị che khuất.</small></div><div>'+mep.map(x=>'<label><input type="checkbox" data-check="'+x.id+'" '+(x.checked?'checked':'')+'><i>'+(x.checked?'✓':'○')+'</i><span>'+BMH.esc(x.name)+'</span><em>'+(x.checked?'Đã kiểm':'Chưa kiểm')+'</em></label>').join('')+'</div></div></section>'
    +'<aside class="v54-supervisor card51"><div class="v53-ai-head"><div><i>✦</i><span><b>AI Giám sát viên</b><small>Chỉ phân tích dữ liệu đã có trong dự án.</small></span></div><em class="'+(openMep<=3?'ok':'wait')+'">'+(openMep<=3?'Ổn':'Còn việc')+'</em></div><div class="v54-super-list"><article><i>✓</i><span><b>Tiến độ</b><small>'+progress+'% dự án đã được ghi nhận.</small></span></article><article class="'+(openMep>4?'warn':'')+'"><i>'+(openMep>4?'!':'✓')+'</i><span><b>MEP</b><small>'+openMep+' hạng mục chưa đánh dấu kiểm tra.</small></span></article><article class="warn"><i>!</i><span><b>Dữ liệu hiện trường</b><small>Chưa có ảnh hoặc issue thực địa để AI xác minh chất lượng thi công.</small></span></article></div><div class="v53-ai-action"><div><small>Khuyến nghị</small><b>Khóa checklist kỹ thuật trước khi đóng trần, tô tường và che hệ MEP.</b></div><button data-ai-open>→</button></div></aside>'
    +'</div>';
};
BMH.SCREENS[8]=BMH.screen9;

BMH.screen10=()=>{
  const snap=BMH.createDossierSnapshot(),e=BMH.estimate(),c=snap.summary.completeness,progress=BMH.clamp(Number(BMH.state.project.dossier?.progress)||0,0,100),perf=BMH.performancePlan();
  const docs=[['dossier-pdf','⌂','Hồ sơ kiến trúc','PDF tổng hợp'],['drawings','▱','Bộ bản vẽ','Mặt bằng · đứng · cắt'],['dossier-excel','▤','Workbook dự án','BOQ · vật liệu · MEP'],['estimate','◔','Dự toán tổng','Chi phí · tỷ trọng'],['mep-pdf','⚙','Hồ sơ MEP','Checklist kỹ thuật'],['bundle','▣','Trọn bộ hồ sơ','Toàn bộ dữ liệu dự án']];
  return '<div class="v54-step10">'
    +'<section class="v54-handover card51"><div class="v54-handover-copy"><span>BƯỚC 10/10 · HỒ SƠ BÀN GIAO</span><h1>Mọi quyết định của ngôi nhà được gom lại thành một hồ sơ có thể mang đi làm việc thật.</h1><p>Dùng bộ hồ sơ này để trao đổi với kiến trúc sư, kỹ sư, nhà thầu và gia đình. Hồ sơ thi công chính thức vẫn cần người có chuyên môn kiểm tra và ký xác nhận.</p><blockquote>“Không chỉ là một ngôi nhà,<br>mà là nơi bắt đầu những hành trình hạnh phúc.”</blockquote></div><div class="v54-handover-image"><img src="assets/design/hero-step1.jpg" alt=""><div><span>BUILD MY HOME</span><b>Hành trình kiến tạo tổ ấm</b></div></div><div class="v54-handover-status"><article><i>✓</i><span><small>Phương án</small><b>Đã hình thành</b></span></article><article><i>✓</i><span><small>Dự toán</small><b>Đã tổng hợp</b></span></article><article><i>'+(progress>=100?'✓':'○')+'</i><span><small>Thi công</small><b>'+progress+'%</b></span></article><article><i>'+(c.percent>=80?'✓':'○')+'</i><span><small>Hồ sơ</small><b>'+c.percent+'% sẵn sàng</b></span></article></div></section>'
    +'<section class="v54-docs card51"><div class="v54-section-title"><b>Bộ hồ sơ bàn giao</b><small>'+c.done+'/'+c.total+' nhóm dữ liệu đã hoàn thiện.</small></div><div class="v54-doc-grid">'+docs.map(x=>'<button data-export="'+x[0]+'"><i>'+x[1]+'</i><span><b>'+x[2]+'</b><small>'+x[3]+'</small></span><em>Tải xuống ↓</em></button>').join('')+'</div></section>'
    +'<aside class="v54-summary card51"><div class="v54-section-title"><b>Tổng kết tổ ấm</b><small>Những con số đáng nhớ của dự án.</small></div><div class="v54-summary-grid"><article><i>▣</i><span><small>Diện tích</small><b>'+BMH.num(snap.summary.grossArea,1)+' m²</b></span></article><article><i>⌂</i><span><small>Số tầng</small><b>'+BMH.state.project.site.floors+' tầng</b></span></article><article><i>◔</i><span><small>Dự toán cuối</small><b>'+BMH.money(e.total)+'</b></span></article><article><i>☀</i><span><small>PV ước tính</small><b>'+BMH.num(perf.solarCapacity,1)+' kWp</b></span></article><article><i>♧</i><span><small>Tiết kiệm 10 năm</small><b>'+BMH.money(perf.tenYearSavings)+'</b></span></article><article><i>✓</i><span><small>Độ hoàn thiện hồ sơ</small><b>'+c.percent+'%</b></span></article></div><button class="v54-primary full" data-nav="1">Xem lại hành trình dự án →</button></aside>'
    +'</div>';
};
BMH.SCREENS[9]=BMH.screen10;

(function activateV54(){
  document.documentElement.classList.add('bmh-v54');
  document.documentElement.dataset.version=BMH.VERSION;
  try{BMH.render({preserveScroll:true});}catch(_){}
})();