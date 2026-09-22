/* Build My Home V5.3 — visual parity + high-impact interaction pass.
 * Focus: Step 1, Step 5 and Step 7. Keeps all V5.2 data/AI/material/finance engines.
 */
BMH.VERSION='5.3.0';
BMH.VISUAL_RELEASE='visual-parity-v53';
BMH.v53UploadPreview=BMH.v53UploadPreview||null;

const v53BaseScanFile=BMH.geminiScanFile;
BMH.geminiScanFile=async(file,intent=BMH.scan?.intent||'reference')=>{
  if(!file)return;
  try{
    if((file.type||'').startsWith('image/')&&file.size<=15*1024*1024){
      const dataUrl=await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(String(fr.result||''));fr.onerror=reject;fr.readAsDataURL(file);});
      BMH.v53UploadPreview={kind:'image',dataUrl,name:file.name,size:file.size,type:file.type,at:Date.now()};
    }else{
      BMH.v53UploadPreview={kind:(file.type||'').startsWith('video/')?'video':file.type==='application/pdf'?'pdf':'file',dataUrl:'',name:file.name,size:file.size,type:file.type,at:Date.now()};
    }
    BMH.scan.fileName=file.name;BMH.scan.mimeType=file.type;BMH.render({preserveScroll:true});
  }catch(_){}
  return v53BaseScanFile(file,intent);
};

const v53Navigate=BMH.navigateTo;
BMH.navigateTo=(step)=>{
  const n=BMH.clamp(Number(step)||1,1,10);
  if(n===5&&BMH.state.ui.step!==5){
    const ui=BMH.state.ui.planner;
    ui.view='plan';ui.floor=0;ui.zoom=1;ui.tool='select';ui.showFurniture=true;ui.showDimensions=true;
    ui.showFeng=false;ui.showEnvironment=false;ui.showCirculation=false;ui.showClimate=false;ui.showEnvelope=false;ui.showSectionLine=false;ui.showBelow=false;
  }
  return v53Navigate(step);
};

BMH.v53UploadMeta=()=>{
  const p=BMH.v53UploadPreview;
  if(!p)return '';
  const kb=Math.max(1,Math.round((p.size||0)/1024));
  return '<div class="v53-upload-meta"><span class="type">'+(p.kind==='image'?'ẢNH':p.kind==='video'?'VIDEO':p.kind==='pdf'?'PDF':'TỆP')+'</span><div><b>'+BMH.esc(p.name||'Tài liệu')+'</b><small>'+new Intl.NumberFormat('vi-VN').format(kb)+' KB · '+BMH.esc(p.type||'')+'</small></div><button data-scan-upload>Đổi tệp</button></div>';
};

BMH.screen1=()=>{
  const scan=BMH.scanExisting&&BMH.scanExisting(),ready=!!BMH.cloud?.config?.geminiConfigured,e=BMH.estimate(),review=BMH.designReview(),b=scan?.building||{};
  const preview=BMH.v53UploadPreview?.dataUrl||'assets/design/hero-step1.jpg';
  const hasUpload=!!BMH.v53UploadPreview;
  const people=(BMH.state.project.household.children||[]).length+(BMH.state.project.household.relatives||[]).length+(BMH.state.project.household.partnerEnabled?2:1);
  return '<div class="v53-step1">'
    +'<section class="v53-s1-intro card51"><div class="v53-eyebrow">BƯỚC 1/10 · KHỞI TẠO</div><h1>Biến ý tưởng nhà ở thành một phương án có thể kiểm tra.</h1><p>Đưa video, ảnh, PDF hoặc mô tả. Hệ thống giữ phần hình dung ở phía trước, còn dữ liệu kỹ thuật nằm phía sau để bạn chỉnh dần.</p><div class="v53-start-modes"><button data-scan-upload><i>↥</i><span><b>Tải ảnh / video / PDF</b><small>AI đọc nội dung và tạo brief sơ bộ</small></span></button><button data-ai-open><i>✦</i><span><b>Mô tả bằng lời</b><small>Ví dụ: nhà 3 tầng, 4 phòng ngủ, có ông bà</small></span></button></div>'
    +'<label class="v53-idea-box"><span>Mô tả điều bạn muốn</span><textarea id="aiStartPrompt" rows="4" placeholder="Ví dụ: đất 5×20m, gia đình 5 người, ưu tiên thông thoáng, có phòng cho ba mẹ ở tầng trệt, ngân sách 2,5 tỷ…"></textarea></label><button class="v53-main-cta" data-ai-start>✦ Tạo brief dự án bằng AI <span>→</span></button><div class="v53-trust-row"><span>✓ Không tự bịa kích thước</span><span>✓ Có bước xác nhận dữ liệu</span><span>✓ Giữ riêng lớp an toàn/kỹ thuật</span></div></section>'

    +'<section class="v53-s1-visual"><img src="'+preview+'" alt="Ngôi nhà tham khảo hoặc ảnh vừa tải"><div class="v53-visual-wash"></div><div class="v53-visual-copy"><span>'+(hasUpload?'TỆP BẠN VỪA CHỌN':'AI HOME VISION')+'</span><h2>'+(hasUpload?'Bắt đầu từ chính hình ảnh của bạn.':'Nhà là nơi bình yên bắt đầu.')+'</h2><p>'+(hasUpload?'Ảnh đã được nhận ở trình duyệt. AI sẽ phân tích khi dịch vụ máy chủ sẵn sàng.':'Bạn không cần hoàn thành mọi biểu mẫu trước khi nhìn thấy hướng đi của dự án.')+'</p></div><div class="v53-visual-stats"><article><small>Quy mô</small><b>~ '+(b.estimated_floors||BMH.state.project.site.floors)+' tầng</b></article><article><small>Phong cách</small><b>'+BMH.esc(b.style||BMH.state.project.style)+'</b></article><article><small>Gia đình</small><b>'+people+' người</b></article><article><small>Ngân sách</small><b>'+BMH.money(e.budget)+'</b></article></div>'+BMH.v53UploadMeta()+'</section>'

    +'<aside class="v53-s1-ai card51"><div class="v53-ai-head"><div><i>✦</i><span><b>AI hiểu trước</b><small>'+ (ready?'Đã kết nối dịch vụ AI':'Có thể chọn tệp trước · AI chưa sẵn sàng') +'</small></span></div><em class="'+(ready?'ok':'wait')+'">'+(ready?'Sẵn sàng':'Đang chờ')+'</em></div><div class="v53-ai-facts"><article><i>⌂</i><span><small>Phong cách</small><b>'+BMH.esc(b.style||BMH.state.project.style)+'</b></span></article><article><i>▥</i><span><small>Số tầng</small><b>'+(b.estimated_floors||BMH.state.project.site.floors)+' tầng</b></span></article><article><i>▣</i><span><small>Diện tích kế hoạch</small><b>'+BMH.num(BMH.planArea())+' m²</b></span></article><article><i>◔</i><span><small>Độ phù hợp tổng thể</small><b>'+review.overall+'/100</b></span></article></div><div class="v53-next-card"><div><span>Gợi ý bước tiếp theo</span><b>Khóa giới hạn tài chính trước khi đầu tư quá nhiều vào hình thức.</b></div><button data-nav="2">→</button></div></aside>'

    +'<section class="v53-s1-strip card51"><div><span><b>01</b><strong>AI hiểu điều bạn thích</strong><small>Ảnh · video · PDF · mô tả tự nhiên</small></span><span><b>02</b><strong>Hệ thống biến thành dữ liệu</strong><small>Gia đình · tài chính · khu đất · khí hậu</small></span><span><b>03</b><strong>Bạn nhìn thấy nhà trước</strong><small>Mặt bằng · vật liệu · 3D · dự toán</small></span></div></section>'
    +'<section class="v53-s1-gallery card51"><div class="v53-section-row"><div><b>Nguồn cảm hứng</b><small>Giữ hình ảnh ở đúng vai trò: giúp AI hiểu gu, không thay thế hồ sơ thiết kế.</small></div><button data-scan-upload>＋ Thêm tài liệu</button></div><div class="v53-gallery-grid"><article><img src="assets/design/flow-a.jpg" alt=""><span>Sân trong & khoảng xanh</span></article><article><img src="assets/design/flow-b.jpg" alt=""><span>Giếng trời & thông tầng</span></article><article><img src="assets/rooms/living-local.jpg" alt=""><span>Nội thất ấm cúng</span></article><article><img src="assets/design/flow-c.jpg" alt=""><span>Ngôn ngữ vật liệu</span></article></div></section>'
    +'</div>';
};
BMH.SCREENS[0]=BMH.screen1;

BMH.v53RoomInspector=(room)=>{
  if(!room)return '<div class="v53-no-room">Chọn một phòng trên bản vẽ để chỉnh chi tiết.</div>';
  const rev=BMH.roomPlacementReview(room),env=BMH.roomEnvironment?BMH.roomEnvironment(room):null;
  return '<div class="v53-room-editor"><div class="v53-room-title"><div><span>PHÒNG ĐANG CHỌN</span><h4>'+BMH.esc(room.name)+'</h4></div><button class="danger" data-room-delete>×</button></div><label>Tên phòng<input data-room-field="name" value="'+BMH.esc(room.name)+'"></label><div class="v53-room-size"><label>Rộng<input data-room-field="w" type="number" step=".1" value="'+room.w+'"><em>m</em></label><label>Dài<input data-room-field="h" type="number" step=".1" value="'+room.h+'"><em>m</em></label></div><div class="v53-room-size"><label>X<input data-room-field="x" type="number" step=".1" value="'+room.x+'"><em>m</em></label><label>Y<input data-room-field="y" type="number" step=".1" value="'+room.y+'"><em>m</em></label></div><div class="v53-room-score"><span><small>Vị trí</small><b>'+rev.score+'/100</b></span><span><small>Ánh sáng</small><b>'+(env?.daylight??'—')+'</b></span><span><small>Thông gió</small><b>'+(env?.ventilation??'—')+'</b></span></div><div class="v53-room-note '+rev.code+'"><b>'+rev.status+'</b><span>'+BMH.esc(rev.notes?.[0]||'Vị trí đang ở mức chấp nhận được.')+'</span></div></div>';
};

BMH.screen5=()=>{
  const ui=BMH.state.ui.planner,view=ui.view||'plan',floor=ui.floor||0,rooms=BMH.floorRooms(floor),review=BMH.designReview(),issues=BMH.plannerIssues();
  const selected=rooms.find(r=>r.id===ui.selected)||rooms[0]||null;
  if(selected&&!ui.selected)ui.selected=selected.id;
  const drawing=view==='plan'?BMH.planSvg({interactive:true,floor}):view==='elevation'?BMH.elevationSvg():BMH.sectionSvg();
  const roomTypes=[['living','⌂','Phòng khách'],['kitchen','♨','Bếp + ăn'],['bed','▰','Phòng ngủ'],['bath','◫','WC'],['stairs','⌁','Cầu thang'],['garage','▣','Gara'],['balcony','▤','Ban công'],['corridor','↔','Hành lang']];
  const floorArea=rooms.reduce((a,r)=>a+r.w*r.h,0);
  return '<div class="v53-step5">'
    +'<section class="v53-plan-head card51"><div><span>BƯỚC 5/10 · BẢN VẼ THIẾT KẾ</span><h2>Mặt bằng là nơi mọi quyết định bắt đầu trở nên thật.</h2><p>Kéo phòng trực tiếp, đổi kích thước ở bảng bên phải và kiểm tra nhanh ánh sáng, thông gió, luồng di chuyển.</p></div><div class="v53-plan-kpis"><article><small>Tầng hiện tại</small><b>Tầng '+(floor+1)+'</b></article><article><small>Diện tích bố trí</small><b>'+BMH.num(floorArea)+' m²</b></article><article><small>Không gian</small><b>'+rooms.length+' phòng</b></article><article><small>Điểm thiết kế</small><b>'+review.overall+'/100</b></article></div></section>'

    +'<aside class="v53-plan-palette card51"><div class="v53-palette-head"><b>Thư viện không gian</b><small>Nhấp để thêm vào tầng '+(floor+1)+'</small></div><div class="v53-palette-grid">'+roomTypes.map(x=>'<button data-add-room="'+x[0]+'"><i>'+x[1]+'</i><span>'+x[2]+'</span></button>').join('')+'</div><div class="v53-divider"></div><div class="v53-palette-head"><b>Công cụ nhanh</b><small>Thao tác trực tiếp trên bản vẽ</small></div><div class="v53-tool-row"><button data-plan-tool="door">▯ Cửa đi</button><button data-plan-tool="window">▥ Cửa sổ</button><button data-plan-undo>↶ Hoàn tác</button><button data-plan-redo>↷ Làm lại</button></div><div class="v53-mini-tip"><i>✦</i><span><b>Gợi ý</b><small>'+(issues[0]?.message||'Bản vẽ hiện không có xung đột lớn.')+'</small></span></div></aside>'

    +'<section class="v53-plan-board card51"><div class="v53-plan-toolbar"><div class="v53-view-tabs"><button class="'+(view==='plan'?'active':'')+'" data-plan-view="plan">Mặt bằng</button>'+Array.from({length:BMH.state.project.site.floors},(_,i)=>'<button class="'+(floor===i&&view==='plan'?'floor-active':'')+'" data-floor="'+i+'">T'+(i+1)+'</button>').join('')+'<button class="'+(view==='elevation'?'active':'')+'" data-plan-view="elevation">Mặt đứng</button><button class="'+(view==='section'?'active':'')+'" data-plan-view="section">Mặt cắt</button></div><div class="v53-board-actions"><button data-planner-fit>◎ Fit</button><button data-planner-zoom="out">−</button><button data-planner-zoom="in">＋</button><button data-nav="7">▣ Xem 3D</button><button data-planner-fullscreen>⛶</button></div></div><div class="v53-plan-stage">'+drawing+'<div id="placementHint" class="v53-placement-hint"><strong>CHỌN PHÒNG</strong><b>—</b><span>Kéo để kiểm tra vị trí</span><small>Hệ thống sẽ đánh giá khi bạn di chuyển.</small></div></div><div class="v53-plan-foot"><span><i class="wall"></i>Tường</span><span><i class="door"></i>Cửa</span><span><i class="window"></i>Cửa sổ</span><span><i class="green"></i>Sân / cây xanh</span><strong>✋ Kéo phòng · chấm góc để resize · lăn chuột để zoom</strong></div></section>'

    +'<aside class="v53-plan-inspector card51"><div class="v53-inspector-head"><div><b>Thông tin bản vẽ</b><small>'+BMH.num(BMH.state.project.site.width)+' × '+BMH.num(BMH.state.project.site.depth)+'m · '+BMH.state.project.site.floors+' tầng</small></div><em>Đã lưu</em></div>'+BMH.v53RoomInspector(selected)+'<div class="v53-room-list"><div class="v53-section-row"><div><b>Danh sách không gian</b><small>Tầng '+(floor+1)+'</small></div></div>'+rooms.map(r=>'<button data-room-select="'+r.id+'" class="'+(selected?.id===r.id?'active':'')+'"><span>'+BMH.esc(r.name)+'</span><b>'+BMH.num(r.w*r.h)+' m²</b><em>'+((BMH.roomPlacementReview(r)?.score||0)>=74?'Tốt':'Xem lại')+'</em></button>').join('')+'</div><button class="v53-ai-review" data-ai-direct="review">✦ AI kiểm tra toàn bộ mặt bằng →</button></aside>'
    +'</div>';
};
BMH.SCREENS[4]=BMH.screen5;

BMH.screen7=()=>{
  const r=BMH.designReview(),e=BMH.estimate(),p=BMH.state.project,perf=BMH.performancePlan(),hero=BMH.cinematicRender?.dataUrl||'assets/design/hero-step1.jpg';
  const living=p.plan.rooms.find(x=>x.type==='living'),kitchen=p.plan.rooms.find(x=>x.type==='kitchen');
  return '<div class="v53-step7">'
    +'<section class="v53-3d-head card51"><div><span>BƯỚC 7/10 · MÔ PHỎNG 3D & ĐÁNH GIÁ</span><h2>Nhìn thấy ngôi nhà trước khi bạn bỏ tiền để xây nó.</h2><p>Phối cảnh cảm xúc ở phía trước. Mô hình kỹ thuật, điểm số và dữ liệu hiệu suất nằm ngay bên dưới để kiểm chứng.</p></div><div class="v53-3d-head-score"><small>Điểm tổng thể</small><b>'+r.overall+'<em>/100</em></b><span>'+(r.overall>=88?'Phương án đang rất cân bằng':r.overall>=80?'Phương án đang ở mức tốt':'Vẫn còn các điểm nên tối ưu')+'</span></div></section>'

    +'<aside class="v53-score-panel card51"><div class="v53-score-circle" style="--score:'+r.overall+'"><div><b>'+r.overall+'</b><span>/100</span></div></div><h3>Đánh giá tổng thể</h3><p>Điểm số được tổng hợp từ khu đất, công năng, khí hậu, ngân sách và hiệu suất vận hành.</p><div class="v53-score-bars"><article><span>Vị trí & site fit</span><i><b style="width:'+(r.site||r.overall)+'%"></b></i><em>'+(r.site||r.overall)+'</em></article><article><span>Công năng</span><i><b style="width:'+r.function+'%"></b></i><em>'+r.function+'</em></article><article><span>Tiện nghi</span><i><b style="width:'+r.comfort+'%"></b></i><em>'+r.comfort+'</em></article><article><span>Thông gió</span><i><b style="width:'+r.ventilation+'%"></b></i><em>'+r.ventilation+'</em></article><article><span>Ngân sách</span><i><b style="width:'+r.budget+'%"></b></i><em>'+r.budget+'</em></article></div><button class="v53-outline full" data-ai-direct="review">Xem phân tích AI chi tiết →</button></aside>'

    +'<section class="v53-cinema"><img src="'+hero+'" alt="Phối cảnh ngôi nhà"><div class="v53-cinema-shade"></div><div class="v53-cinema-copy"><span>YOUR HOME · VISUAL PREVIEW</span><h3>Tổ ấm hôm nay.<br>Hạnh phúc mai sau.</h3><p>'+BMH.esc(p.style)+' · '+p.site.floors+' tầng · '+BMH.num(BMH.planArea())+' m² kế hoạch</p></div><div class="v53-cinema-top"><button data-scene-theme>'+(BMH.state.ui.sceneTheme==='night'?'☾ Ban đêm':'☀ Ban ngày')+'</button><button class="accent" data-cinematic-render>✦ '+(BMH.cinematicRender?.loading?'Đang tạo phối cảnh…':'Tạo phối cảnh AI mới')+'</button></div><div class="v53-scene-dock"><button class="active" data-scene-focus-btn="all">⌂<span>Ngoại thất</span></button><button data-scene-explode>◇<span>Cutaway</span></button>'+Array.from({length:p.site.floors},(_,i)=>'<button data-scene-focus-btn="floor:'+i+'">▱<span>Tầng '+(i+1)+'</span></button>').join('')+(living?'<button data-scene-focus-btn="room:'+living.id+'">▣<span>Phòng khách</span></button>':'')+(kitchen?'<button data-scene-focus-btn="room:'+kitchen.id+'">♨<span>Bếp</span></button>':'')+'</div></section>'

    +'<aside class="v53-ai-panel card51"><div class="v53-ai-head"><div><i>✦</i><span><b>AI đánh giá phương án</b><small>Đọc toàn bộ dữ liệu hiện tại</small></span></div><em class="ok">Đã phân tích</em></div><div class="v53-eval-list"><article><i>⌖</i><span><b>Vị trí & quy hoạch</b><small>'+(r.site||r.overall)+'/100 · mức phù hợp khu đất hiện tại</small></span></article><article><i>⌂</i><span><b>Công năng sống</b><small>'+r.comfort+'/100 · '+(r.comfort>=80?'khá cân bằng':'còn điểm cần chỉnh')+'</small></span></article><article><i>☀</i><span><b>Vi khí hậu</b><small>'+r.ventilation+'/100 · nắng, gió và thông thoáng</small></span></article><article><i>◔</i><span><b>Hiệu quả năng lượng</b><small>'+perf.energyScore+'/100 · PV có thể phủ khoảng '+perf.solarCoverage+'% nhu cầu tự dùng</small></span></article><article class="'+(e.gap>=0?'':'warn')+'"><i>'+(e.gap>=0?'✓':'!')+'</i><span><b>Ngân sách</b><small>'+(e.gap>=0?'Còn '+BMH.money(e.gap)+' dự phòng':'Vượt '+BMH.money(Math.abs(e.gap))+' so với ngân sách')+'</small></span></article></div><div class="v53-ai-action"><div><small>Khuyến nghị ưu tiên</small><b>'+(e.gap>=0?'Giữ quỹ dự phòng và nâng chất lượng ở khu vực sử dụng nhiều.':'Giảm chi phí hoàn thiện trước khi mở rộng thêm diện tích hoặc tính năng.')+'</b></div><button data-ai-direct="review">→</button></div></aside>'

    +'<section class="v53-life card51"><div class="v53-section-row"><div><b>Khám phá các kịch bản sống</b><small>Đổi góc nhìn từ “một căn nhà” sang “cách gia đình sẽ sống trong đó”.</small></div></div><div class="v53-life-grid"><article><img src="assets/rooms/living-local.jpg" alt=""><span><b>Cuộc sống hằng ngày</b><small>Ánh sáng · lưu thông · sinh hoạt chung</small></span></article><article><img src="assets/design/flow-a.jpg" alt=""><span><b>Tiệc gia đình</b><small>Khoảng mở · kết nối trong/ngoài</small></span></article><article><img src="assets/design/flow-b.jpg" alt=""><span><b>Làm việc tại nhà</b><small>Yên tĩnh · ánh sáng · riêng tư</small></span></article><article><img src="assets/design/flow-c.jpg" alt=""><span><b>Buổi tối thư giãn</b><small>Ánh sáng ấm · vật liệu · riêng tư</small></span></article></div></section>'

    +'<details class="v53-tech card51"><summary><span><b>◎ Mô hình 3D kỹ thuật tương tác</b><small>Xoay · zoom · tách tầng · kiểm tra hình học</small></span><em>Mở mô hình →</em></summary><div class="v53-tech-inner">'+BMH.studio3DHtml()+'</div></details>'
    +'</div>';
};
BMH.SCREENS[6]=BMH.screen7;

(function activateV53(){
  document.documentElement.classList.add('bmh-v53');
  document.documentElement.dataset.version=BMH.VERSION;
  try{BMH.render({preserveScroll:true});}catch(_){}
})();