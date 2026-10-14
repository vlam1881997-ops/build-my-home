/* Build My Home V5.1.1 — fixes verified from the 2026-09-22 screen recording.
 * Focus: data consistency, map fallback, planner default view, AI drawer behavior,
 * finance empty states and cleaner cinematic fallbacks. No engine is removed.
 */
BMH.VERSION='5.1.1';
BMH.VISUAL_RELEASE='video-qa-fixes-v511';

BMH.repairSiteData=()=>{
  const s=BMH.state?.project?.site;if(!s)return false;
  let changed=false;
  const raw=Array.isArray(s.province)?s.province.join(','):String(s.province||'').trim();
  const parts=raw.split(',').map(x=>x.trim()).filter(Boolean);
  const validPart=parts.find(x=>BMH.REGIONS?.[x]);
  const duplicateLike=parts.length>1&&validPart;
  if(duplicateLike){
    s.province=validPart;const r=BMH.REGIONS[validPart],pt=BMH.regionPoint(validPart,r.defaultDistrict);
    s.district=pt.district;s.lat=pt.lat;s.lng=pt.lng;s.geoSource='Đã đồng bộ lại tỉnh/thành';
    changed=true;
  }else if(!BMH.REGIONS?.[s.province]){
    const near=Number.isFinite(Number(s.lat))&&Number.isFinite(Number(s.lng))?BMH.nearestRegionPoint(Number(s.lat),Number(s.lng)):null;
    if(near&&BMH.REGIONS?.[near.province]){
      s.province=near.province;s.district=near.district;changed=true;
    }else{
      const fallback='TP. Hồ Chí Minh',r=BMH.REGIONS[fallback],pt=BMH.regionPoint(fallback,r.defaultDistrict);
      Object.assign(s,{province:fallback,district:pt.district,lat:pt.lat,lng:pt.lng,geoSource:'Dữ liệu vùng'});
      changed=true;
    }
  }
  const r=BMH.REGIONS?.[s.province];
  if(r){
    const validDistrict=(r.districts||[]).some(d=>d[0]===s.district);
    if(!validDistrict){
      const near=BMH.nearestRegionPoint(Number(s.lat),Number(s.lng));
      const useNear=near&&near.province===s.province&&near.km<180;
      const pt=useNear?near:BMH.regionPoint(s.province,r.defaultDistrict);
      s.district=pt.district;
      if(!useNear){s.lat=pt.lat;s.lng=pt.lng;s.geoSource='Đã đồng bộ lại khu vực';}
      changed=true;
    }
  }
  if(changed){BMH.liveWeather=null;BMH.liveWeatherKey='';BMH.save();}
  return changed;
};

const v511BaseNavigate=BMH.navigateTo;
BMH.navigateTo=(step)=>{
  step=BMH.clamp(Number(step)||1,1,10);
  const prev=BMH.state.ui.step;
  if(step!==prev&&BMH.ai)BMH.ai.open=false;
  if(step===3)BMH.repairSiteData();
  if(step===5&&prev!==5){
    const ui=BMH.state.ui.planner;
    ui.view='plan';ui.floor=0;ui.zoom=1;ui.tool='select';
    ui.showFeng=false;ui.showEnvironment=false;ui.showCirculation=false;ui.showClimate=false;ui.showEnvelope=false;ui.showSectionLine=false;ui.showBelow=false;
  }
  return v511BaseNavigate(step);
};

const v511BaseScreen2=BMH.screen2;
BMH.screen2=()=>{
  let html=v511BaseScreen2();
  const income=Number(BMH.state.project.finance.income)||0;
  if(income<=0){
    html=html.replace('<div class="v51-step2">','<div class="v51-step2"><div class="v511-data-warning"><i>!</i><span><b>Chưa đủ dữ liệu để tính DTI</b><small>Nhập thu nhập hàng tháng trước. Hệ thống sẽ không gọi 0% là “an toàn” khi dữ liệu chưa có.</small></span></div>');
    html=html.replace(/<div class="v51-dti-ring"([^>]*)><b>0%<\/b><span>DTI hiện tại<\/span><\/div>/,'<div class="v51-dti-ring empty"$1><b>—</b><span>Chưa đủ dữ liệu</span></div>');
    html=html.replace(/Tỷ lệ DTI đang ở vùng khá an toàn/g,'Chưa đủ dữ liệu để đánh giá DTI');
  }
  return html;
};

const v511BaseScreen3=BMH.screen3;
BMH.screen3=()=>{
  BMH.repairSiteData();
  let html=v511BaseScreen3();
  const s=BMH.state.project.site;
  const opts=Object.keys(BMH.REGIONS||{}).map(x=>'<option value="'+BMH.esc(x)+'" '+(s.province===x?'selected':'')+'>'+BMH.esc(x)+'</option>').join('');
  html=html.replace(/<select data-path="project\.site\.province">[\s\S]*?<\/select>/,'<select data-path="project.site.province">'+opts+'</select>');
  return html;
};

const v511BaseScreen7=BMH.screen7;
BMH.screen7=()=>{
  let html=v511BaseScreen7();
  if(!BMH.cinematicRender?.dataUrl)html=html.replaceAll('assets/rooms/facade-render.jpg','assets/design/hero-step1.jpg');
  return html;
};

const v511BaseScreen10=BMH.screen10;
BMH.screen10=()=>v511BaseScreen10().replaceAll('assets/rooms/facade-render.jpg','assets/design/hero-step1.jpg');

BMH.SCREENS[1]=BMH.screen2;
BMH.SCREENS[2]=BMH.screen3;
BMH.SCREENS[6]=BMH.screen7;
BMH.SCREENS[9]=BMH.screen10;

const v511BaseAiDock=BMH.aiDock;
BMH.aiDock=()=>{
  let html=v511BaseAiDock();
  if(!BMH.aiConfigured?.()){
    html=html.replace(/<div class="ai-setup">[\s\S]*?<\/div>/,
      '<div class="ai-setup v511-ai-offline"><b>AI trên máy chủ chưa được bật</b><span>Phần giao diện và engine dự án vẫn hoạt động. Khi GEMINI_API_KEY được cấu hình trong môi trường Production, AI sẽ tự chuyển sang trạng thái sẵn sàng.</span><small>Không hiển thị hướng dẫn kỹ thuật hoặc API key cho người dùng cuối.</small></div>');
  }
  return html;
};

const v511CoreAfterRender=BMH.afterRender;
BMH.afterRender=()=>{
  const step=BMH.state.ui.step;
  if(step===3){
    BMH.repairSiteData();
    BMH.loadLiveWeather?.();
    BMH.loadClimateHistory?.();
    const el=BMH.$('#map');
    const fallbackTimer=setTimeout(()=>{
      const now=BMH.$('#map');
      if(now&&now.classList.contains('map-loading'))BMH.renderMapIframeFallback('Đang dùng bản đồ dự phòng trong lúc tải lớp tương tác.');
    },700);
    Promise.resolve(BMH.initMapStudio?.()).catch(()=>BMH.renderMapIframeFallback('Không khởi tạo được bản đồ tương tác, đã chuyển sang bản đồ dự phòng.')).finally(()=>clearTimeout(fallbackTimer));
    const select=BMH.$('select[data-path="project.site.province"]');
    if(select)select.value=BMH.state.project.site.province;
    return;
  }
  if(step===7){BMH.mountStudio3D?.();return;}
  if(v511CoreAfterRender&&v511CoreAfterRender!==BMH.afterRender){
    // Current core afterRender only mounts map/3D. Other steps do not require a second call.
  }
};

(function activateV511(){
  BMH.repairSiteData();
  document.documentElement.classList.add('bmh-v511');
  document.documentElement.dataset.version=BMH.VERSION;
  try{BMH.render({preserveScroll:true});}catch(_){}
})();