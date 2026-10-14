/* Build My Home V5.0.5 — functional demo-parity override for the highest-impact screens. */
BMH.VERSION='5.0.5';
BMH.VISUAL_RELEASE='demo-parity-functional-v505';

BMH.v505Hero=function(kicker,title,desc,actions){
  return '<section class="v505-hero"><div><span>'+kicker+'</span><h1>'+title+'</h1><p>'+desc+'</p></div>'+(actions?'<div class="v505-hero-actions">'+actions+'</div>':'')+'</section>';
};

BMH.screen1=function(){
  var e=BMH.estimate(),f=BMH.financeSummary(),r=BMH.designReview(),ready=!!BMH.cloud?.config?.geminiConfigured,existing=BMH.scanExisting?.();
  return '<div class="v505-home">'
    +'<section class="v505-home-grid">'
      +'<div class="v505-home-visual"><img src="assets/design/hero-step1.jpg" alt="Phối cảnh nhà hiện đại"><div class="v505-home-shade"></div>'
        +'<div class="v505-home-copy"><span>BUILD MY HOME · AI NATIVE STUDIO</span><h1>Nhìn thấy tổ ấm<br>trước khi bắt đầu xây.</h1><p>Đưa video, ảnh, bản phác hoặc ý tưởng. AI đọc đầu vào; hệ thống kiểm tra lại bằng tài chính, khí hậu, mặt bằng, vật liệu và dự toán.</p><div><i>AI Scan</i><i>Planner</i><i>3D</i><i>BOQ</i></div></div>'
      +'</div>'
      +'<div class="v505-intake"><div class="v505-intake-top"><span>✦ PHÂN TÍCH BẰNG AI</span><em class="'+(ready?'ok':'warn')+'">'+(ready?'Gemini sẵn sàng':'Chưa kết nối Gemini')+'</em></div>'
        +'<h2>Thao tác tối thiểu.<br><i>Kết quả tối đa.</i></h2><p>AI nhận diện quy mô, phong cách, vật liệu và dữ kiện nghe thấy trong video. Bạn chỉ xác nhận những thông tin quan trọng.</p>'
        +'<div class="v505-intent"><button class="'+(BMH.scan?.intent!=='my_home'?'active':'')+'" data-scan-intent="reference">Tôi thích căn nhà này</button><button class="'+(BMH.scan?.intent==='my_home'?'active':'')+'" data-scan-intent="my_home">Đây là nhà / đất của tôi</button></div>'
        +'<button class="v505-upload '+(BMH.scan?.busy?'busy':'')+'" data-scan-upload '+(ready?'':'disabled')+'><i>'+(BMH.scan?.busy?'◌':'＋')+'</i><b>'+(BMH.scan?.busy?'AI đang quan sát…':'Thả video, ảnh, PDF hoặc bản vẽ vào đây')+'</b><span>'+(BMH.scan?.busy?BMH.esc(BMH.scan.stage||'Đang phân tích'):'MP4 · JPG · PNG · PDF')+'</span></button>'
        +'<label class="v505-brief"><span>Hoặc mô tả bằng một câu</span><textarea id="aiStartPrompt" rows="3" placeholder="Đất 5×20m ở Cần Thơ, khoảng 1,4 tỷ, 3 phòng ngủ, có mẹ lớn tuổi…"></textarea></label>'
        +'<button class="studio-primary v505-full" data-ai-start>✦ Tạo phương án ban đầu</button>'+(BMH.scan?.error?'<div class="ai-error">'+BMH.esc(BMH.scan.error)+'</div>':'')
      +'</div>'
    +'</section>'
    +'<section class="v505-kpis">'
      +'<article><small>Tổng vốn dự kiến</small><b>'+BMH.money(e.total)+'</b><span class="'+(e.gap>=0?'good':'bad')+'">'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' dự phòng':'Vượt '+BMH.money(Math.abs(e.gap)))+'</span></article>'
      +'<article><small>Trả góp an toàn</small><b>'+BMH.money(f.peak)+'</b><span>DTI '+Math.round(f.dti*100)+'% thu nhập</span></article>'
      +'<article><small>Điểm tiện nghi</small><b>'+r.comfort+'/100</b><span>Ánh sáng · thông gió · công năng</span></article>'
      +'<article><small>Rủi ro phương án</small><b>'+(r.overall>=82?'Thấp':r.overall>=68?'Trung bình':'Cần xem lại')+'</b><span>Tổng hợp từ engine dự án</span></article>'
    +'</section>'
    +(existing?BMH.scanResultHtml():'')
    +'<section class="v505-flow"><article><i>01</i><b>AI hiểu ý tưởng</b><span>Video · ảnh · lời nói · bản phác.</span></article><article><i>02</i><b>Đặt vào khu đất thật</b><span>Gia đình · ngân sách · khí hậu · phong thủy.</span></article><article><i>03</i><b>Xem trước khi xây</b><span>2D · 3D · vật liệu · dự toán · hồ sơ.</span></article></section>'
  +'</div>';
};

BMH.screen3=function(){
  var s=BMH.state.project.site,p=BMH.regionProfile(s),o=BMH.orientationAnalysis(s),feas=BMH.siteFeasibility(s);
  var dirs=BMH.DIRECTIONS.map(function(d){var n=d[0],a=d[1];return '<button class="'+(s.frontDirection===n?'active':'')+'" data-front-direction="'+n+'"><i style="transform:rotate('+a+'deg)">↑</i><b>'+n+'</b></button>';}).join('');
  return BMH.v505Hero('VỊ TRÍ & KHÍ HẬU','Đặt ngôi nhà đúng vào nơi nó sẽ sống.','Bản đồ là trung tâm. Nắng, gió, ngập và hướng nhà được chuyển thành quyết định dễ hiểu.','')
    +'<div class="v505-site"><section class="v505-map-panel"><div class="v505-map-head"><div><span>KHU ĐẤT HIỆN TẠI</span><b>'+BMH.esc(s.district)+' · '+BMH.esc(s.province)+'</b><small>'+s.lat.toFixed(5)+', '+s.lng.toFixed(5)+' · mặt tiền '+BMH.esc(s.frontDirection)+'</small></div><div><button data-map-style="hybrid" class="'+(s.mapStyle==='hybrid'?'active':'')+'">Vệ tinh</button><button data-map-style="roadmap" class="'+(s.mapStyle==='roadmap'?'active':'')+'">Đường phố</button><button data-map-center>◎ Về khu đất</button></div></div>'
      +'<div id="map" class="map map-loading"><div class="map-fallback"><div class="map-skeleton"><i></i><i></i><i></i></div><b>Đang kết nối bản đồ…</b><span>Nếu tile chậm, hệ thống tự chuyển sang bản đồ nhúng dự phòng.</span></div><div class="map-hud"><span id="mapHudCoords">'+s.lat.toFixed(5)+', '+s.lng.toFixed(5)+'</span><span id="mapHudZoom">Zoom '+s.mapZoom+'</span></div></div>'
      +'<div class="v505-map-search"><input data-path="project.site.address" value="'+BMH.esc(s.address||'')+'" placeholder="Nhập địa chỉ hoặc khu dân cư…"><button class="studio-primary" data-geocode>Định vị</button><button class="studio-secondary" data-device-location>GPS</button></div></section>'
      +'<aside class="v505-site-side"><article class="v505-site-score"><span>SITE FIT</span><b>'+feas.score+'<em>/100</em></b><p>'+BMH.esc(feas.notes[0]||'Quỹ đất phù hợp để phát triển phương án.')+'</p></article>'
      +'<article><i>☀</i><div><small>Nắng & nhiệt</small><b>'+p.heat+'</b><span>'+p.sun+'</span></div></article>'
      +'<article><i>☂</i><div><small>Mưa & ngập</small><b>'+p.flood+'</b><span>Mùa mưa '+p.wet+'</span></div></article>'
      +'<article><i>≋</i><div><small>Gió tự nhiên</small><b>'+o.windScore+'/100</b><span>'+p.wind+'</span></div></article>'
      +'<article><i>↗</i><div><small>Hướng hiện tại</small><b>'+BMH.esc(s.frontDirection)+'</b><span>Vi khí hậu '+o.score+'/100</span></div></article></aside></div>'
    +'<section class="v505-orientation"><div><span>XOAY NHÀ, XEM TÁC ĐỘNG NGAY</span><h2>Hướng mặt tiền</h2></div><div class="v505-directions">'+dirs+'</div></section>'
    +'<details class="advanced-panel"><summary>Thông tin lô đất & dữ liệu kỹ thuật</summary><div class="advanced-inner"><div class="fields four">'+BMH.field('Tỉnh/Thành','project.site.province',{options:BMH.regionOptions()})+BMH.field('Mặt tiền','project.site.width',{step:.1,suffix:'m'})+BMH.field('Chiều sâu','project.site.depth',{step:.1,suffix:'m'})+BMH.field('Số tầng','project.site.floors',{min:1,max:8,suffix:'tầng'})+BMH.field('Đường trước nhà','project.site.road',{step:.5,suffix:'m'})+BMH.field('Đất/nền sơ bộ','project.site.soil',{type:'text'})+'</div></div></details>';
};

BMH.screen4=function(){
  var s=BMH.state.project.site,h=BMH.state.project.household,needs=BMH.householdNeeds(),ad=BMH.householdAdvice(),feng=BMH.fengProfile();
  var soilRisk=String(s.soil).toLowerCase().includes('trũng')||BMH.riskValue(BMH.regionProfile(s).flood)>=3;
  var members='<span>Gia chủ '+h.ownerBirth+'</span>'+(h.partnerEnabled?'<span>Đồng hành '+h.partnerBirth+'</span>':'')+h.children.map(function(c){return '<span>'+BMH.esc(c.name)+' · '+c.birth+'</span>';}).join('')+h.relatives.map(function(r){return '<span>'+BMH.esc(r.name)+' · '+r.birth+'</span>';}).join('');
  var advice=ad.slice(0,5).map(function(x){return '<article><i>✓</i><span>'+BMH.esc(x)+'</span></article>';}).join('');
  return BMH.v505Hero('ĐẤT · ĐỊA CHẤT · PHONG THỦY','Thiết kế cho cả gia đình, không chỉ cho gia chủ.','Người lớn tuổi, trẻ em, nền đất, khí hậu và thói quen sống được đưa vào cùng một quyết định kiến trúc.','')
    +'<div class="v505-family-grid"><section class="v505-panel"><span class="eyebrow">HỒ SƠ GIA ĐÌNH</span><h2>'+needs.people+' người · '+needs.bedrooms+' phòng ngủ · '+needs.bathrooms+'+ WC</h2><div class="v505-family-chips">'+members+'</div><div class="v505-family-advice">'+advice+'</div><div class="v505-family-actions"><button class="studio-secondary" data-household-add="child">+ Thêm con</button><button class="studio-secondary" data-household-add="relative">+ Thêm ba/mẹ/người thân</button></div></section>'
    +'<section class="v505-panel v505-foundation"><span class="eyebrow">NỀN MÓNG · SƠ BỘ</span><h2>'+(soilRisk?'Ưu tiên khảo sát địa chất trước khi chốt móng.':'Có thể phát triển phương án sơ bộ, nhưng vẫn cần khảo sát.')+'</h2><p>'+BMH.esc(s.soil)+' · '+BMH.esc(s.province)+'</p><div class="v505-foundation-options"><article class="'+(soilRisk?'active':'')+'"><b>Móng cọc</b><span>'+(soilRisk?'Đang được ưu tiên':'So sánh sau khảo sát')+'</span></article><article><b>Móng băng</b><span>So sánh sau khảo sát</span></article><article><b>Móng bè</b><span>So sánh sau khảo sát</span></article></div><small>AI không tự quyết chiều dài cọc, thép hoặc kết cấu chịu lực.</small></section>'
    +'<section class="v505-panel v505-feng"><span class="eyebrow">PHONG THỦY GIA ĐÌNH</span><h2>'+BMH.esc(feng.title)+'</h2>'+BMH.compass()+'<p>'+BMH.esc(feng.note)+'</p><div class="v505-feng-use"><b>Ứng dụng thực tế</b><span>Ưu tiên bố trí phòng ngủ, bàn học, bếp và không gian người lớn tuổi theo nhu cầu sống trước; phong thủy là lớp hỗ trợ để dung hòa.</span></div></section></div>'
    +'<details class="advanced-panel"><summary>Chỉnh thành viên & dữ liệu phong thủy</summary><div class="advanced-inner"><div class="fields four">'+BMH.field('Năm sinh gia chủ','project.household.ownerBirth',{min:1900,max:2100})+BMH.field('Giới tính','project.household.ownerGender',{options:['Nam','Nữ']})+BMH.field('Năm sinh đồng hành','project.household.partnerBirth',{min:1900,max:2100})+BMH.field('Giới tính đồng hành','project.household.partnerGender',{options:['Nữ','Nam']})+'</div></div></details>';
};

BMH.screen5=function(){
  var ui=BMH.state.ui.planner,view=ui.view||'plan',rooms=BMH.floorRooms(),issues=BMH.plannerIssues(),variants=BMH.state.project.planVariants||[];
  var drawing=view==='plan'?BMH.planSvg({interactive:true}):view==='elevation'?BMH.elevationSvg():BMH.sectionSvg();
  var floors=view==='plan'?Array.from({length:BMH.state.project.site.floors},function(_,i){return '<button class="'+(ui.floor===i?'active':'')+'" data-floor="'+i+'">Tầng '+(i+1)+'</button>';}).join(''):'';
  var roomRail=rooms.map(function(r){return '<button class="'+(ui.selected===r.id?'active':'')+'" data-room-select="'+r.id+'"><b>'+BMH.esc(r.name)+'</b><span>'+BMH.num(r.w*r.h)+'m²</span></button>';}).join('');
  var roomTools=[['living','Phòng khách'],['kitchen','Bếp + ăn'],['bed','Phòng ngủ'],['bath','WC'],['stairs','Cầu thang'],['garage','Gara'],['balcony','Ban công']].map(function(x){return '<button data-add-room="'+x[0]+'">'+x[1]+'</button>';}).join('');
  var variantHtml=variants.length?'<section class="v505-variants"><div><span>3 PHƯƠNG ÁN</span><h2>Chọn triết lý thiết kế trước, tinh chỉnh sau.</h2></div><div>'+variants.map(function(v){return '<article><span>'+v.code+'</span><h3>'+BMH.esc(v.label)+'</h3><b>'+v.metrics.score+'/100</b><p>'+BMH.num(v.metrics.area)+'m² · lưu thông '+v.metrics.circulation+'/100</p><button data-apply-variant="'+v.id+'">Dùng phương án '+v.code+'</button></article>';}).join('')+'</div></section>':'';
  return BMH.v505Hero('HOUSE PLANNER','Mặt bằng phải là trung tâm, không phải một hình bé nằm trong dashboard.','Kéo phòng, resize, thêm cửa, đổi tầng và xem đánh giá AI ngay trên cùng một không gian.','<button class="studio-secondary" data-generate-variants>✦ Tạo A/B/C</button><button class="studio-primary" data-auto-improve>AI tối ưu mặt bằng</button>')
    +'<div class="v505-planner"><section class="v505-planner-main"><div class="v505-planner-toolbar"><div><button class="'+(view==='plan'?'active':'')+'" data-plan-view="plan">Mặt bằng</button><button class="'+(view==='elevation'?'active':'')+'" data-plan-view="elevation">Mặt đứng</button><button class="'+(view==='section'?'active':'')+'" data-plan-view="section">Mặt cắt</button></div><div>'+floors+'<button data-plan-undo>↶</button><button data-plan-redo>↷</button><button data-planner-fit>Fit</button><button data-planner-fullscreen>⛶ Toàn màn hình</button></div></div>'
    +'<div class="planner-canvas-stage v505-canvas '+(view==='plan'?'is-plan':'')+'">'+drawing+'<div class="v505-plan-help"><b>✋ Kéo trực tiếp</b><span>Phòng = di chuyển · chấm góc = resize · cạnh = dịch vách · lăn chuột = zoom</span></div></div><div class="v505-room-rail">'+roomRail+'<button class="add" data-planner-panel="tools">+ Thêm phòng</button></div></section>'
    +'<aside class="v505-planner-side"><section class="v505-score-card"><span>KIỂM TRA PHƯƠNG ÁN</span><b>'+BMH.designReview().overall+'<em>/100</em></b><p>'+(issues.length?issues.length+' điểm cần xem trước khi chốt.':'Hình học cơ bản chưa phát hiện xung đột.')+'</p><button class="studio-secondary" data-ai-direct="review">✦ AI Architect Review</button></section><section class="v505-panel">'+BMH.plannerInspector()+'</section><details class="v505-panel" '+(ui.toolsOpen?'open':'')+'><summary>Thêm phòng & công cụ</summary><div class="space-tool-grid">'+roomTools+'</div></details></aside></div>'+variantHtml;
};

BMH.screen6=function(){
  var m=BMH.state.project.materials,e=BMH.estimate(),cat=BMH.state.ui.materialCategory||'floor',items=BMH.MATERIALS[cat]||[],profile=BMH.regionProfile(BMH.state.project.site),perf=BMH.performancePlan();
  var labels={floor:'Gạch & sàn',paint:'Sơn',door:'Cửa & nhôm kính'},selected=items.find(function(x){return x.id===m.choices[cat];});
  var nav=[['floor','Sàn','▱'],['paint','Sơn','◫'],['door','Cửa','▥']].map(function(x){return '<button class="'+(cat===x[0]?'active':'')+'" data-material-view="'+x[0]+'"><i>'+x[2]+'</i><span>'+x[1]+'</span></button>';}).join('');
  var products=items.map(function(x){return '<button class="'+(m.choices[cat]===x.id?'active':'')+'" data-material-cat="'+cat+'" data-material="'+x.id+'"><img src="'+x.img+'" alt="'+BMH.esc(x.name)+'"><span><b>'+BMH.esc(x.name)+'</b><small>'+BMH.materialPriceLabel(cat,x)+'</small></span>'+(m.choices[cat]===x.id?'<i>✓</i>':'')+'</button>';}).join('');
  var tiers=[['economy','Tiết kiệm'],['standard','Cân bằng'],['premium','Cao cấp']].map(function(x){return '<button class="'+(m.tier===x[0]?'active':'')+'" data-tier="'+x[0]+'">'+x[1]+'</button>';}).join('');
  return BMH.v505Hero('MATERIAL STUDIO','Chọn vật liệu bằng mắt, hiểu tác động bằng tiền.','Mỗi lựa chọn phải cho thấy vẻ ngoài, chi phí, độ bền và mức phù hợp khí hậu.','')
    +'<div class="v505-material"><aside class="v505-material-nav">'+nav+'</aside><section class="v505-material-stage"><div class="v505-material-hero"><img src="'+(selected?.img||'assets/rooms/living-local.jpg')+'" alt="'+BMH.esc(selected?.name||'Vật liệu')+'"><div><span>'+(labels[cat]||'Vật liệu')+'</span><h2>'+BMH.esc(selected?.name||'Chọn vật liệu')+'</h2><p>'+BMH.esc(selected?.sub||'Chọn một phương án bên dưới để áp dụng.')+'</p></div></div><div class="v505-products">'+products+'</div></section>'
    +'<aside class="v505-material-impact"><span>TÁC ĐỘNG NGAY</span><article><small>Dự toán hiện tại</small><b>'+BMH.money(e.total)+'</b><em class="'+(m.lastDelta<=0?'good':'warn')+'">'+(m.lastDelta===0?'Chưa thay đổi':(m.lastDelta>0?'+':'')+BMH.money(m.lastDelta)+' so với trước')+'</em></article><article><small>Khí hậu khu vực</small><b>'+BMH.esc(profile.climate)+'</b><em>'+BMH.esc(BMH.climateMaterialGuide(cat))+'</em></article><article><small>Điện vận hành</small><b>'+BMH.money(perf.annualElectricCost)+'/năm</b><em>Ước tính từ cấu hình hiện tại</em></article><div class="v505-tier">'+tiers+'</div><button class="studio-primary v505-full" data-nav="7">Xem vật liệu trên nhà 3D →</button></aside></div>';
};

BMH.screen7=function(){
  var r=BMH.designReview(),e=BMH.estimate();
  return BMH.v505Hero('HOUSE STUDIO 3D','Đây phải là khoảnh khắc “wow” của sản phẩm.','Phối cảnh điện ảnh ở phía trước; mô hình 3D kỹ thuật vẫn ở phía sau để xoay, zoom, tách tầng và kiểm tra hình học.','')
    +'<div class="v505-kpis v505-3d-kpis"><article><small>Điểm tổng thể</small><b>'+r.overall+'/100</b><span>Công năng · khí hậu · ngân sách</span></article><article><small>Ánh sáng</small><b>'+r.daylight+'/100</b><span>'+(r.daylight>=75?'Khá tốt':'Nên tăng ô mở / giếng trời')+'</span></article><article><small>Thông gió</small><b>'+r.ventilation+'/100</b><span>'+(r.ventilation>=75?'Luồng gió ổn':'Nên tăng thông gió chéo')+'</span></article><article><small>Dự toán</small><b>'+BMH.money(e.total)+'</b><span class="'+(e.gap>=0?'good':'bad')+'">'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' dự phòng':'Vượt '+BMH.money(Math.abs(e.gap)))+'</span></article></div>'
    +BMH.studio3DHtml();
};

BMH.SCREENS[0]=BMH.screen1;
BMH.SCREENS[2]=BMH.screen3;
BMH.SCREENS[3]=BMH.screen4;
BMH.SCREENS[4]=BMH.screen5;
BMH.SCREENS[5]=BMH.screen6;
BMH.SCREENS[6]=BMH.screen7;

(function(){
  function activate(){
    document.documentElement.classList.add('bmh-v505');
    document.documentElement.dataset.version='5.0.5';
    document.documentElement.dataset.visualRelease=BMH.VISUAL_RELEASE;
    try{BMH.render({preserveScroll:true});}catch(_){}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',activate,{once:true});
  else queueMicrotask(activate);
})();