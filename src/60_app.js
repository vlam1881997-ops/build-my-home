BMH.root = () => document.getElementById('app');
BMH.STUDIO_NAV = [
  ['⌂','Khởi tạo'],['₫','Hồ sơ tài chính & DTI'],['⌖','Vị trí & khí hậu vùng'],['♡','Đất, địa chất & phong thủy'],['▱','Bản vẽ thiết kế'],['◫','Gói vật liệu'],['◇','Mô phỏng 3D & đánh giá'],['≋','Dự toán & thanh toán'],['✓','Giám sát thi công & MEP'],['↓','Hồ sơ bàn giao & giải ngân']
];
BMH.sidebar = () => '';
BMH.header = () => {const s=BMH.state.project.site;return `<header class="studio-topbar demo-topbar"><button class="studio-brand demo-brand" data-nav="1"><img src="assets/icon.svg" alt=""><span><b>Build My Home</b><small>Kiến tạo tổ ấm, cùng AI</small></span></button><nav class="demo-header-nav" aria-label="Điều hướng nhanh"><span>Ngôi nhà của tôi</span><span>Dự án</span><span>Thư viện ý tưởng</span><span>Báo giá vật liệu</span><span>Chuyên gia</span></nav><div class="studio-top-actions demo-top-actions"><button class="studio-location" data-nav="3">${BMH.icon('pin')} <span>${BMH.esc(s.district||s.province)}</span></button><button class="studio-save" data-cloud-open>↥ Lưu dự án</button></div></header>`};
BMH.stepper = () => {const step=BMH.state.ui.step;return `<nav class="demo-stepper" aria-label="10 bước xây nhà">${BMH.STUDIO_NAV.map(([ico,name],i)=>{const n=i+1,active=step===n,done=n<step;return `<button data-nav="${n}" class="demo-step ${active?'active':''} ${done?'done':''}"><i>${done?'✓':n}</i><span>${name}</span></button>`}).join('')}</nav>`};
BMH.footer = () => {const step=BMH.state.ui.step,e=BMH.estimate(),review=BMH.designReview();return `<div class="demo-nextbar"><button class="studio-back" data-nav="${Math.max(1,step-1)}" ${step===1?'disabled':''}>${BMH.icon('back')} <span>Quay lại</span></button><div class="demo-budget-summary"><span><small>Ngân sách tối đa</small><b>${BMH.money(e.budget)}</b></span><span><small>Dự toán hiện tại</small><b>${BMH.money(e.total)}</b></span><span><small>Còn dự phòng</small><b class="${e.gap>=0?'good':'bad'}">${e.gap>=0?BMH.money(e.gap):'− '+BMH.money(Math.abs(e.gap))}</b></span><span><small>Điểm tiện nghi</small><b>${review.comfort}/100</b></span></div>${step<10?`<button class="studio-primary studio-next" data-nav="${step+1}">Tiếp theo ${BMH.icon('arrow')}</button>`:`<button class="studio-primary studio-next" data-nav="10">Hoàn tất dự án ✓</button>`}</div>`};
BMH.runtimeError = (step,err) => `<section class="runtime-error studio-card"><div>⚠</div><h2>Bước ${step} gặp lỗi hiển thị</h2><p>Dữ liệu dự án vẫn được giữ nguyên. Hãy quay lại hoặc tải lại trang.</p>${BMH.DEV&&err?`<code>${BMH.esc(err.message||String(err))}</code>`:''}<div><button class="studio-secondary" data-nav="${Math.max(1,step-1)}">${BMH.icon('back')} Quay lại</button><button class="studio-primary" data-nav="1">Về Studio</button></div></section>`;
BMH.render = ({preserveScroll=false}={}) => {
  const sy=window.scrollY,step=BMH.state.ui.step;BMH.disposeStudio3D?.();const screen=BMH.SCREENS[step-1]||BMH.screen1;let body='';
  try{body=screen();}catch(err){console.error(`Build My Home render error at step ${step}`,err);body=BMH.runtimeError(step,err);}
  try{const appRoot=BMH.root();if(!appRoot)throw new Error('Missing #app root');appRoot.innerHTML=`${BMH.header()}<main class="studio-main demo-main step-${step} ${step===5?'planner-page':''} ${step===7?'house-studio-page':''}">${BMH.stepper()}<div class="studio-screen demo-screen">${body}</div>${BMH.footer()}</main>${BMH.cloudOverlay?BMH.cloudOverlay():''}${BMH.ai?.open&&BMH.aiDock?BMH.aiDock():''}`;}catch(err){console.error('Build My Home shell render error',err);const appRoot=BMH.root();if(appRoot)appRoot.innerHTML=BMH.runtimeError(step,err);}
  document.documentElement.dataset.version=BMH.VERSION;document.title=`Build My Home · ${BMH.STEPS[step-1][1]}`;if(preserveScroll)window.scrollTo(0,sy);requestAnimationFrame(BMH.afterRender);
};
BMH.navigateTo = step => {step=BMH.clamp(Number(step)||1,1,10);BMH.state.ui.step=step;if(step!==5){BMH.drag=null;BMH.state.ui.planner.tool='select';}BMH.save();BMH.render();window.scrollTo({top:0,behavior:'smooth'});return true;};
BMH.openPaywall = () => {BMH.navigateTo(8);BMH.toast('Thanh toán đang tạm tắt để hoàn thiện sản phẩm. Toàn bộ hồ sơ hiện được mở để kiểm thử.');};
BMH.amountBar = () => BMH.decisionCards?.()||'';
BMH.loadExternalScript = (url, timeout=6000) => new Promise((resolve,reject)=>{
  const script=document.createElement('script'); let settled=false;
  const finish=(ok,err)=>{if(settled)return;settled=true;clearTimeout(timer);ok?resolve():reject(err||new Error('Load failed'));};
  script.src=url;script.async=true;script.crossOrigin='anonymous';script.onload=()=>finish(true);script.onerror=()=>finish(false,new Error('Script unavailable'));
  const timer=setTimeout(()=>finish(false,new Error('Script timeout')),timeout);document.head.appendChild(script);
});
BMH.ensureLeaflet = () => {
  if(window.L)return Promise.resolve(window.L);
  if(BMH.leafletPromise)return BMH.leafletPromise;
  const sources=[
    {js:'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',css:'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'},
    {js:'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',css:'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'}
  ];
  BMH.leafletPromise=(async()=>{
    for(const src of sources){
      try{
        if(!document.querySelector(`link[data-leaflet-css="${src.css}"]`)){const link=document.createElement('link');link.rel='stylesheet';link.href=src.css;link.dataset.leafletCss=src.css;document.head.appendChild(link);}
        await BMH.loadExternalScript(src.js);if(window.L)return window.L;
      }catch(e){}
    }
    return null;
  })();
  return BMH.leafletPromise;
};
BMH.ensureGoogleMaps = () => {
  if(window.google?.maps)return Promise.resolve(window.google.maps);
  if(!BMH.GOOGLE_MAPS_KEY)return Promise.resolve(null);
  if(BMH.googleMapsPromise)return BMH.googleMapsPromise;
  const url=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(BMH.GOOGLE_MAPS_KEY)}&loading=async&v=weekly&language=vi&region=VN`;
  BMH.googleMapsPromise=BMH.loadExternalScript(url,8000).then(()=>window.google?.maps||null).catch(()=>null);
  return BMH.googleMapsPromise;
};
BMH.mapEmbedUrl = (site=BMH.state.project.site) => {
  const lat=Number(site.lat)||10.77,lng=Number(site.lng)||106.69,z=BMH.clamp(Number(site.mapZoom)||17,3,20);
  if(['satellite','hybrid'].includes(site.mapStyle)) return `https://maps.google.com/maps?q=${lat},${lng}&t=k&z=${z}&ie=UTF8&iwloc=&output=embed`;
  const span=Math.max(.004,0.04/Math.max(1,z/6));
  const bbox=[lng-span,lat-span,lng+span,lat+span].map(v=>Number(v).toFixed(6)).join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat.toFixed(6)}%2C${lng.toFixed(6)}`;
};
BMH.renderMapIframeFallback = (reason='') => {
  const el=BMH.$('#map'),s=BMH.state.project.site;if(!el)return;
  const fallback=el.querySelector('.map-fallback');
  if(!fallback)return;
  const title=['satellite','hybrid'].includes(s.mapStyle)?'Bản đồ nhúng dự phòng (vệ tinh)':'Bản đồ nhúng dự phòng';
  fallback.innerHTML=`<div class="fallback-grid"></div><div class="map-embed-shell"><div class="map-embed-head"><b>${title}</b><span>${reason||'Đã bật lớp dự phòng để luôn nhìn thấy vị trí khu đất.'}</span></div><iframe class="map-embed-frame" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${BMH.mapEmbedUrl(s)}" title="Bản đồ dự phòng"></iframe><div class="map-embed-foot"><b>${BMH.esc(s.district||s.province)}</b><span>${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}</span><small>Bạn vẫn có thể dùng tìm địa chỉ, đổi khu vực và mở Google Maps để kiểm tra chi tiết.</small></div></div>`;
  el.classList.remove('map-loading');
  el.classList.add('fallback-only');
};
BMH.updateLocationMeta = () => {
  const s=BMH.state.project.site,box=BMH.$('.location-coord');
  if(box){const span=box.querySelector('span'),em=box.querySelector('em');if(span)span.textContent=`${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}`;if(em)em.textContent=s.geoSource||'Tọa độ dự án';}
  const hud=BMH.$('#mapHudCoords');if(hud)hud.textContent=`${s.lat.toFixed(5)}, ${s.lng.toFixed(5)}`;
};
BMH.destroyMap = () => {
  try{if(BMH.mapEngine==='leaflet'&&BMH.map?.remove)BMH.map.remove();}catch(_){}
  try{if(BMH.mapEngine==='google'){BMH.mapMarker?.setMap?.(null);BMH.mapLot?.setMap?.(null);(BMH.mapContext||[]).forEach(x=>x?.setMap?.(null));(BMH.mapLotPoints||[]).forEach(x=>x?.setMap?.(null));}}catch(_){}
  BMH.map=null;BMH.mapMarker=null;BMH.mapLot=null;BMH.mapLabels=null;BMH.mapContext=[];BMH.mapLotPoints=[];BMH.mapEngine=null;
};
BMH.meterOffset = (lat,lng,east,north) => ({lat:lat+north/111320,lng:lng+east/(111320*Math.max(.2,Math.cos(lat*Math.PI/180)))});
BMH.lotCorners = (site=BMH.state.project.site) => {
  const h=BMH.directionAngle(site.frontDirection||'Nam')*Math.PI/180, back=h+Math.PI, right=h+Math.PI/2, hw=(Number(site.width)||5)/2, hd=(Number(site.depth)||20)/2;
  const v=(ang,len)=>({e:Math.sin(ang)*len,n:Math.cos(ang)*len}),w=v(right,hw),d=v(back,hd),c={lat:Number(site.lat),lng:Number(site.lng)};
  return [[w.e+d.e,w.n+d.n],[-w.e+d.e,-w.n+d.n],[-w.e-d.e,-w.n-d.n],[w.e-d.e,w.n-d.n]].map(([e,n])=>BMH.meterOffset(c.lat,c.lng,e,n));
};
BMH.lotPath = (site=BMH.state.project.site) => site.lotMode==='custom'&&Array.isArray(site.lotPoints)&&site.lotPoints.length>=2?site.lotPoints:BMH.lotCorners(site);
BMH.syncMapHud = (zoom) => {const z=BMH.$('#mapHudZoom');if(z)z.textContent=`Zoom ${Math.round(Number(zoom)||BMH.state.project.site.mapZoom||17)}`;};
BMH.clearMapExtras = () => {
  if(BMH.mapEngine==='leaflet'&&BMH.map){(BMH.mapContext||[]).forEach(x=>{try{BMH.map.removeLayer(x)}catch(_){}});(BMH.mapLotPoints||[]).forEach(x=>{try{BMH.map.removeLayer(x)}catch(_){}});}
  else {(BMH.mapContext||[]).forEach(x=>x?.setMap?.(null));(BMH.mapLotPoints||[]).forEach(x=>x?.setMap?.(null));}
  BMH.mapContext=[];BMH.mapLotPoints=[];
};
BMH.updateMapContext = () => {
  const s=BMH.state.project.site;BMH.clearMapExtras();
  if(s.showContextRings){
    if(BMH.mapEngine==='leaflet'&&window.L&&BMH.map){[250,500].forEach((r,i)=>BMH.mapContext.push(L.circle([s.lat,s.lng],{radius:r,color:i?'#6b8068':'#7b8ea1',weight:1,opacity:.55,fillOpacity:.02,dashArray:i?'7 6':'3 5',interactive:false}).addTo(BMH.map)));}
    if(BMH.mapEngine==='google'&&window.google?.maps&&BMH.map){[250,500].forEach((r,i)=>BMH.mapContext.push(new google.maps.Circle({center:{lat:s.lat,lng:s.lng},radius:r,strokeColor:i?'#6b8068':'#7b8ea1',strokeOpacity:.55,strokeWeight:1,fillOpacity:.01,map:BMH.map,clickable:false})));}
  }
  if(s.lotMode==='custom'&&Array.isArray(s.lotPoints)){
    if(BMH.mapEngine==='leaflet'&&window.L&&BMH.map)s.lotPoints.forEach((pt,i)=>BMH.mapLotPoints.push(L.circleMarker([pt.lat,pt.lng],{radius:5,color:'#fff',weight:2,fillColor:i===0?'#b95f43':'#53735a',fillOpacity:1,interactive:false}).addTo(BMH.map)));
    if(BMH.mapEngine==='google'&&window.google?.maps&&BMH.map)s.lotPoints.forEach((pt,i)=>BMH.mapLotPoints.push(new google.maps.Marker({position:pt,map:BMH.map,label:{text:String(i+1),color:'#fff',fontSize:'10px'},icon:{path:google.maps.SymbolPath.CIRCLE,scale:7,fillColor:i===0?'#b95f43':'#53735a',fillOpacity:1,strokeColor:'#fff',strokeWeight:2},clickable:false})));
  }
};
BMH.updateLotOverlay = () => {
  const s=BMH.state.project.site,path=BMH.lotPath(s),drawing=BMH.state.ui.location?.drawingLot;
  if(BMH.mapEngine==='leaflet'&&window.L&&BMH.map){if(BMH.mapLot)BMH.map.removeLayer(BMH.mapLot);BMH.mapLot=null;if(s.showLotOverlay&&path.length>=2){BMH.mapLot=path.length>=3?L.polygon(path.map(x=>[x.lat,x.lng]),{color:drawing?'#d25d3f':'#c16f50',weight:drawing?3:2,fillColor:'#d99070',fillOpacity:path.length>=3?.18:0,dashArray:drawing?'4 4':'7 5'}).addTo(BMH.map):L.polyline(path.map(x=>[x.lat,x.lng]),{color:'#d25d3f',weight:3,dashArray:'4 4'}).addTo(BMH.map);}}
  if(BMH.mapEngine==='google'&&window.google?.maps&&BMH.map){BMH.mapLot?.setMap?.(null);BMH.mapLot=null;if(s.showLotOverlay&&path.length>=2){if(path.length>=3)BMH.mapLot=new google.maps.Polygon({paths:path,strokeColor:drawing?'#d25d3f':'#b76246',strokeOpacity:1,strokeWeight:drawing?3:2,fillColor:'#d98d70',fillOpacity:.2,map:BMH.map,clickable:false});else BMH.mapLot=new google.maps.Polyline({path:path,strokeColor:'#d25d3f',strokeOpacity:1,strokeWeight:3,map:BMH.map,clickable:false});}}
  BMH.updateMapContext();
};
BMH.updateLotDrawStatus = () => {
  const n=BMH.state.project.site.lotPoints?.length||0,el=BMH.$('#lotDrawStatus');if(el)el.textContent=BMH.state.ui.location?.drawingLot?`Đang vẽ · ${n} điểm · cần tối thiểu 3 điểm`:(BMH.state.project.site.lotMode==='custom'?`Ranh tùy chỉnh · ${n} điểm`:'Lô chữ nhật theo kích thước');
};
BMH.startLotDraw = () => {const s=BMH.state.project.site;s.lotMode='custom';s.lotPoints=[];BMH.state.ui.location.drawingLot=true;s.showLotOverlay=true;BMH.save();BMH.render();BMH.toast('Chế độ vẽ ranh đất: bấm lần lượt các góc lô đất trên bản đồ.');};
BMH.handleMapClick = (lat,lng,source='Chọn trên bản đồ') => {
  if(BMH.state.ui.location?.drawingLot){const s=BMH.state.project.site;if((s.lotPoints?.length||0)>=12){BMH.toast('Tối đa 12 điểm cho ranh đất sơ bộ.');return;}s.lotMode='custom';s.lotPoints=[...(s.lotPoints||[]),{lat:Number(lat),lng:Number(lng)}];BMH.save();BMH.updateLotOverlay();BMH.updateLotDrawStatus();return;}
  BMH.applyCoordinates(lat,lng,source);
};
BMH.finishLotDraw = () => {
  const s=BMH.state.project.site,pts=s.lotPoints||[];if(pts.length<3)return BMH.toast('Cần ít nhất 3 điểm để hoàn tất ranh đất.');
  const stats=BMH.siteParcelStats(s),centroid=pts.reduce((a,p)=>({lat:a.lat+p.lat/pts.length,lng:a.lng+p.lng/pts.length}),{lat:0,lng:0});
  s.lat=centroid.lat;s.lng=centroid.lng;s.geoSource='Ranh đất vẽ trên bản đồ';s.lotMode='custom';s.shape=pts.length===4?'Không đều':'Không đều';
  if(stats.frontage>=2&&stats.frontage<=60)s.width=+stats.frontage.toFixed(2);if(stats.approxDepth>=4&&stats.approxDepth<=100)s.depth=+stats.approxDepth.toFixed(2);
  BMH.state.ui.location.drawingLot=false;BMH.liveWeather=null;BMH.save();BMH.render();BMH.toast(`Đã chốt ranh đất khoảng ${Math.round(stats.area)} m² và đồng bộ kích thước sơ bộ.`);
};
BMH.clearCustomLot = () => {const s=BMH.state.project.site;s.lotMode='rect';s.lotPoints=[];BMH.state.ui.location.drawingLot=false;BMH.save();BMH.render();BMH.toast('Đã trở lại lô chữ nhật theo mặt tiền × chiều sâu.');};
BMH.applyCoordinates = (lat,lng,source='Tọa độ tùy chỉnh',{snapRegion=false,render=false}={}) => {
  lat=Number(lat);lng=Number(lng);if(!Number.isFinite(lat)||!Number.isFinite(lng))return false;
  const s=BMH.state.project.site; s.lat=lat;s.lng=lng;s.geoSource=source;
  if(snapRegion){const near=BMH.nearestRegionPoint(lat,lng);if(near&&near.km<180){s.province=near.province;s.district=near.district;}}
  BMH.liveWeather=null;BMH.liveWeatherKey='';BMH.save();
  if(render){BMH.render();return true;}
  if(BMH.mapEngine==='leaflet')BMH.mapMarker?.setLatLng?.([lat,lng]);
  else if(BMH.mapEngine==='google')BMH.mapMarker?.setPosition?.({lat,lng});
  BMH.updateLotOverlay();BMH.updateLocationMeta();BMH.loadLiveWeather(true);return true;
};
BMH.loadLiveWeather = async (force=false) => {
  const s=BMH.state.project.site,key=`${s.lat.toFixed(3)},${s.lng.toFixed(3)}`;
  if(!force&&BMH.liveWeather?.key===key&&Date.now()-(BMH.liveWeather.ts||0)<10*60*1000)return;
  BMH.liveWeatherKey=key;
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),5000);
  try{
    const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(s.lat)}&longitude=${encodeURIComponent(s.lng)}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=3&timezone=auto`;
    const res=await fetch(url,{signal:ctl.signal});if(!res.ok)throw new Error('weather');const data=await res.json();if(BMH.liveWeatherKey!==key)return;
    const c=data.current||{},d=data.daily||{};
    BMH.liveWeather={key,ts:Date.now(),temp:Number(c.temperature_2m),humidity:Number(c.relative_humidity_2m),precip:Number(c.precipitation)||0,wind:Number(c.wind_speed_10m)||0,maxTemp:Number(d.temperature_2m_max?.[0]),minTemp:Number(d.temperature_2m_min?.[0]),rainChance:Number(d.precipitation_probability_max?.[0]),forecast:(d.time||[]).slice(0,3).map((date,i)=>({date,max:Number(d.temperature_2m_max?.[i]),min:Number(d.temperature_2m_min?.[i]),rain:Number(d.precipitation_probability_max?.[i])})),timeLabel:'Open-Meteo'};if(BMH.state.project.dataEngine)BMH.state.project.dataEngine.status.weather='live';
  }catch(_){if(BMH.liveWeatherKey!==key)return;BMH.liveWeather={key,ts:Date.now(),error:true};if(BMH.state.project.dataEngine)BMH.state.project.dataEngine.status.weather='fallback';}
  finally{clearTimeout(timer);try{BMH.save();}catch(_){}}
  const old=BMH.$('#liveWeather');if(old&&BMH.state.ui.step===3){const wrap=document.createElement('div');wrap.innerHTML=BMH.weatherCard();old.replaceWith(wrap.firstElementChild);}
};
BMH.geocodeAddress = async () => {
  const s=BMH.state.project.site,q=[s.address,s.district,s.province,'Việt Nam'].filter(Boolean).join(', ');
  BMH.toast('Đang tìm địa chỉ trên bản đồ…');
  if(s.mapEngine==='google'&&BMH.GOOGLE_MAPS_KEY){const gm=await BMH.ensureGoogleMaps();if(gm){try{const geocoder=new google.maps.Geocoder();const {results}=await geocoder.geocode({address:q,region:'VN'});if(results?.[0]){const loc=results[0].geometry.location,lat=loc.lat(),lng=loc.lng(),near=BMH.nearestRegionPoint(lat,lng);s.lat=lat;s.lng=lng;s.geoSource='Địa chỉ · Google Maps';if(near&&near.km<180){s.province=near.province;s.district=near.district;}BMH.liveWeather=null;BMH.save();BMH.render();BMH.toast('Đã định vị bằng Google Maps.');return;}}catch(_){}}}
  const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),6000);
  try{
    const url=`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&accept-language=vi&q=${encodeURIComponent(q)}`;
    const res=await fetch(url,{signal:ctl.signal,headers:{'Accept':'application/json'}});if(!res.ok)throw new Error('geocode');const rows=await res.json();if(!rows?.length)throw new Error('not-found');
    const row=rows[0],lat=Number(row.lat),lng=Number(row.lon),near=BMH.nearestRegionPoint(lat,lng);
    s.lat=lat;s.lng=lng;s.geoSource='Địa chỉ · OpenStreetMap';
    if(near&&near.km<180){s.province=near.province;s.district=near.district;}
    BMH.liveWeather=null;BMH.save();BMH.render();BMH.toast('Đã cập nhật tọa độ theo địa chỉ. Bạn có thể kéo ghim để tinh chỉnh.');
  }catch(_){const pt=BMH.regionPoint(s.province,s.district);Object.assign(s,{lat:pt.lat,lng:pt.lng,geoSource:'Dữ liệu vùng (fallback)'});BMH.save();BMH.render();BMH.toast('Không tìm được địa chỉ trực tuyến. Đã dùng điểm tham chiếu khu vực.');}
  finally{clearTimeout(timer);}
};
BMH.useDeviceLocation = () => {
  if(!navigator.geolocation){BMH.toast('Trình duyệt không hỗ trợ định vị thiết bị.');return;}
  BMH.toast('Đang xin quyền định vị từ trình duyệt…');
  navigator.geolocation.getCurrentPosition(pos=>{BMH.applyCoordinates(pos.coords.latitude,pos.coords.longitude,'GPS thiết bị',{snapRegion:true,render:true});BMH.toast('Đã dùng vị trí thiết bị. Hãy kiểm tra ghim trước khi tiếp tục.');},()=>BMH.toast('Không lấy được vị trí thiết bị. Bạn vẫn có thể nhập địa chỉ hoặc chọn khu vực.'),{enableHighAccuracy:true,timeout:8000,maximumAge:60000});
};
BMH.afterRender = () => {
  if(BMH.state.ui.step===3){BMH.loadLiveWeather();BMH.loadClimateHistory?.();BMH.initMapStudio();}
  if(BMH.state.ui.step===7)BMH.mountStudio3D?.();
};
BMH.mapTileConfig = style => ({
  roadmap:[['https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png','© OpenStreetMap contributors © CARTO'],['https://tile.openstreetmap.org/{z}/{x}/{y}.png','© OpenStreetMap contributors']],
  satellite:[['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}','Tiles © Esri']],
  hybrid:[['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}','Tiles © Esri']],
  terrain:[['https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png','Map data © OpenStreetMap contributors · SRTM · OpenTopoMap']]
}[style]||[]);
BMH.initLeafletMap = async () => {
  const el=BMH.$('#map'),s=BMH.state.project.site;if(!el)return false;const L=await BMH.ensureLeaflet();if(!L)return false;
  BMH.destroyMap();BMH.mapEngine='leaflet';BMH.map=L.map(el,{zoomControl:true,preferCanvas:true,attributionControl:true,scrollWheelZoom:true,doubleClickZoom:true}).setView([s.lat,s.lng],s.mapZoom||17);
const sources=BMH.mapTileConfig(s.mapStyle);let sourceIndex=0,activeLayer=null,tileErrors=0,loaded=false,labelLayer=null,stallTimer=null;
const clearStall=()=>{if(stallTimer){clearTimeout(stallTimer);stallTimer=null;}};
const setLoaded=()=>{loaded=true;clearStall();el.classList.remove('map-loading','fallback-only');};
const loadTiles=()=>{clearStall();if(activeLayer)BMH.map.removeLayer(activeLayer);if(labelLayer)BMH.map.removeLayer(labelLayer);const [url,attr]=sources[sourceIndex]||BMH.mapTileConfig('roadmap')[0];tileErrors=0;activeLayer=L.tileLayer(url,{maxZoom:s.mapStyle==='terrain'?17:20,attribution:attr,keepBuffer:4,updateWhenIdle:false,crossOrigin:true}).addTo(BMH.map);if(s.mapStyle==='hybrid'){labelLayer=L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',{maxZoom:19,attribution:'Labels © Esri',opacity:.9}).addTo(BMH.map);}activeLayer.on('load',setLoaded);activeLayer.on('tileerror',()=>{tileErrors++;if(tileErrors>=4){if(sourceIndex<sources.length-1){sourceIndex++;loadTiles();}else if(!loaded){BMH.renderMapIframeFallback('Không tải được lớp bản đồ nền trực tuyến, đã chuyển sang bản đồ nhúng dự phòng.');}}});stallTimer=setTimeout(()=>{if(!loaded)BMH.renderMapIframeFallback('Bản đồ nền phản hồi chậm, đã bật lớp dự phòng để bạn tiếp tục thao tác.');},1800);};loadTiles();
  BMH.mapMarker=L.marker([s.lat,s.lng],{draggable:true,autoPan:true}).addTo(BMH.map).bindPopup(`${BMH.esc(s.district||'')} · ${BMH.esc(s.province)}`);
  BMH.mapMarker.on('dragend',ev=>{const ll=ev.target.getLatLng();BMH.applyCoordinates(ll.lat,ll.lng,'Ghim bản đồ');});
  BMH.map.on('click',ev=>BMH.handleMapClick(ev.latlng.lat,ev.latlng.lng,'Chọn trên bản đồ'));
  BMH.map.on('mousemove',ev=>{const hud=BMH.$('#mapHudCoords');if(hud)hud.textContent=`${ev.latlng.lat.toFixed(5)}, ${ev.latlng.lng.toFixed(5)}`;});
  BMH.map.on('mouseout',()=>BMH.updateLocationMeta());
  BMH.map.on('zoomend',()=>{s.mapZoom=BMH.map.getZoom();BMH.save();BMH.syncMapHud(s.mapZoom);});
  BMH.updateLotOverlay();setTimeout(()=>BMH.map?.invalidateSize(true),80);setTimeout(()=>BMH.map?.invalidateSize(true),360);setTimeout(()=>{if(!loaded)BMH.renderMapIframeFallback('Bản đồ nền chưa tải xong, đã hiển thị lớp dự phòng.');},2300);return true;
};
BMH.initGoogleMap = async () => {
  const el=BMH.$('#map'),s=BMH.state.project.site;if(!el||!BMH.GOOGLE_MAPS_KEY)return false;const gm=await BMH.ensureGoogleMaps();if(!gm)return false;BMH.destroyMap();BMH.mapEngine='google';
  BMH.map=new google.maps.Map(el,{center:{lat:s.lat,lng:s.lng},zoom:s.mapZoom||17,mapTypeId:s.mapStyle,streetViewControl:true,mapTypeControl:false,fullscreenControl:false,scaleControl:true,gestureHandling:'greedy'});
  BMH.mapMarker=new google.maps.Marker({position:{lat:s.lat,lng:s.lng},map:BMH.map,draggable:true,title:`${s.district||''} · ${s.province||''}`});
  BMH.mapMarker.addListener('dragend',ev=>{if(ev.latLng)BMH.applyCoordinates(ev.latLng.lat(),ev.latLng.lng(),'Ghim Google Maps');});
  BMH.map.addListener('click',ev=>{if(ev.latLng)BMH.handleMapClick(ev.latLng.lat(),ev.latLng.lng(),'Chọn trên Google Maps');});
  BMH.map.addListener('zoom_changed',()=>{const z=BMH.map.getZoom();if(Number.isFinite(z)){s.mapZoom=z;BMH.save();BMH.syncMapHud(z);}});
  BMH.map.addListener('idle',()=>{el.classList.remove('map-loading','fallback-only');BMH.updateLotOverlay();});
  BMH.updateLotOverlay();return true;
};
BMH.initMapStudio = async () => {
  const el=BMH.$('#map');if(!el)return;const s=BMH.state.project.site;el.classList.add('map-loading');let ok=false;
  if(s.mapEngine==='google'){ok=await BMH.initGoogleMap();if(!ok){s.mapEngine='free';BMH.save();BMH.toast(BMH.GOOGLE_MAPS_KEY?'Google Maps không tải được, đã chuyển sang bản đồ miễn phí.':'Chưa cấu hình Google Maps key, đang dùng vệ tinh miễn phí.');}}
  if(!ok)ok=await BMH.initLeafletMap();if(!ok)BMH.renderMapIframeFallback('Không khởi tạo được bản đồ tương tác, đã dùng bản đồ nhúng dự phòng.');
};
BMH.mapResize = () => {if(BMH.mapEngine==='leaflet')BMH.map?.invalidateSize?.(true);else if(BMH.mapEngine==='google'&&window.google?.maps)google.maps.event.trigger(BMH.map,'resize');};
document.addEventListener('click',e=>{
  if(!e.target.closest?.('#app'))return;
  const nav=e.target.closest('[data-nav]'); if(nav){e.preventDefault();BMH.navigateTo(nav.dataset.nav);return;}
  if(e.target.closest('[data-cloud-open]')){e.preventDefault();BMH.openCloud();return;}
  if(e.target.closest('[data-cloud-close]')){BMH.closeCloud();return;}
  const ca=e.target.closest('[data-cloud-auth]');if(ca){BMH.cloudAuth(ca.dataset.cloudAuth);return;}
  if(e.target.closest('[data-cloud-logout]')){BMH.cloudLogout();return;}
  if(e.target.closest('[data-cloud-save-now]')){BMH.cloudSaveNow();return;}
  if(e.target.closest('[data-cloud-refresh]')){BMH.cloudLoadProjects();return;}
  const cl=e.target.closest('[data-cloud-load]');if(cl){BMH.cloudLoadProject(cl.dataset.cloudLoad);return;}
  const cd=e.target.closest('[data-cloud-delete]');if(cd){BMH.cloudDeleteProject(cd.dataset.cloudDelete);return;}
  if(e.target.closest('[data-payment-create]')){BMH.startPayment();return;}
  if(e.target.closest('[data-payment-refresh]')){BMH.refreshEntitlement().then(ok=>BMH.toast(ok?'Premium đã được server xác nhận.':'Chưa thấy quyền premium trên server.'));return;}
  const start=e.target.closest('[data-start]'); if(start){BMH.state.project.source=start.dataset.start;BMH.save(); if(start.dataset.start==='photo')BMH.$('#uploadPhoto')?.click(); else if(start.dataset.start==='plan')BMH.$('#uploadPlan')?.click(); else BMH.navigateTo(2); return;}
  if(e.target.closest('[data-sidebar]')){BMH.state.ui.sidebarCollapsed=!BMH.state.ui.sidebarCollapsed;BMH.save();BMH.render();return;}
  const bank=e.target.closest('[data-bank]'); if(bank){
    const b=BMH.BANKS.find(x=>x.id===bank.dataset.bank);
    if(b){
      const f=BMH.state.project.finance;
      f.bank=b.id;
      if(BMH.bankHasPreset?.(b)){
        Object.assign(f,{introRate:b.intro,postRate:b.post,promoMonths:b.months});
        BMH.toast(`Đã chọn ${b.name}. Gemini sẽ kiểm tra lãi suất công khai mới nhất.`);
      }else{
        BMH.toast(`Đã chọn ${b.name}. Gemini đang chuẩn bị kiểm tra lãi suất công khai.`);
      }
      f.rateMeta={bankId:b.id,status:'pending',verified:false,product:'',sourceDate:'',fetchedAt:'',provider:'',model:'',introRate:0,postRate:0,promoMonths:0,citations:[],note:''};
      BMH.save();BMH.render({preserveScroll:true});
      setTimeout(()=>BMH.v65RefreshBankRate?.(b,{force:true,silent:true}),80);
    }
    return;
  }
  if(e.target.closest('[data-geocode]')){BMH.geocodeAddress();return;}
  if(e.target.closest('[data-device-location]')){BMH.useDeviceLocation();return;}
  const mapEngine=e.target.closest('[data-map-engine]');if(mapEngine){const s=BMH.state.project.site;s.mapEngine=mapEngine.dataset.mapEngine;if(s.mapEngine==='google'&&!BMH.GOOGLE_MAPS_KEY)BMH.toast('Google Satellite cần Maps JavaScript API key. Bản đồ sẽ fallback sang vệ tinh miễn phí nếu chưa cấu hình.');BMH.save();BMH.render();return;}
  const mapStyle=e.target.closest('[data-map-style]');if(mapStyle){BMH.state.project.site.mapStyle=mapStyle.dataset.mapStyle;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-map-center]')){const s=BMH.state.project.site;if(BMH.mapEngine==='leaflet')BMH.map?.setView?.([s.lat,s.lng],s.mapZoom||17,{animate:true});else BMH.map?.panTo?.({lat:s.lat,lng:s.lng});return;}
  if(e.target.closest('[data-map-lot]')){BMH.state.project.site.showLotOverlay=!BMH.state.project.site.showLotOverlay;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-map-climate]')){BMH.state.project.site.showClimateMap=!BMH.state.project.site.showClimateMap;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-map-context]')){BMH.state.project.site.showContextRings=!BMH.state.project.site.showContextRings;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-map-draw-lot]')){BMH.startLotDraw();return;}
  if(e.target.closest('[data-map-finish-lot]')){BMH.finishLotDraw();return;}
  if(e.target.closest('[data-map-clear-lot]')){BMH.clearCustomLot();return;}
  if(e.target.closest('[data-map-fullscreen]')){const el=BMH.$('.maps-studio');if(el?.requestFullscreen)el.requestFullscreen().then(()=>setTimeout(BMH.mapResize,120)).catch(()=>BMH.toast('Trình duyệt không cho phép toàn màn hình.'));return;}
  if(e.target.closest('[data-map-retry]')){BMH.destroyMap();BMH.leafletPromise=null;BMH.googleMapsPromise=null;const el=BMH.$('#map');if(el){el.classList.remove('fallback-only');el.classList.add('map-loading');}BMH.toast('Đang thử tải lại bản đồ…');BMH.initMapStudio();return;}
  if(e.target.closest('[data-open-google]')){const s=BMH.state.project.site;window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.lat+','+s.lng)}`,'_blank','noopener');return;}
  if(e.target.closest('[data-map-refresh]')){const s=BMH.state.project.site,pt=BMH.regionPoint(s.province,s.district);Object.assign(s,{lat:pt.lat,lng:pt.lng,district:pt.district,geoSource:'Dữ liệu vùng'});BMH.liveWeather=null;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-data-refresh]')){BMH.refreshRealData();return;}
  if(e.target.closest('[data-price-import]')){BMH.$('#priceQuoteUpload')?.click();return;}
  if(e.target.closest('[data-cost-snapshot]')){BMH.costSnapshot();return;}
  if(e.target.closest('[data-price-reset]')){BMH.resetPricingBaseline();return;}
  const nearby=e.target.closest('[data-nearby]');if(nearby){const s=BMH.state.project.site;s.district=nearby.dataset.nearby;s.lat=Number(nearby.dataset.lat);s.lng=Number(nearby.dataset.lng);s.geoSource='Điểm tham chiếu vùng';BMH.liveWeather=null;BMH.save();BMH.render();return;}
  const front=e.target.closest('[data-front-direction]');if(front){BMH.state.project.site.frontDirection=front.dataset.frontDirection;BMH.save();BMH.render();return;}
  const soil=e.target.closest('[data-soil]');if(soil){BMH.state.project.site.soil=soil.dataset.soil;BMH.save();BMH.render();return;}
  const shape=e.target.closest('[data-site-shape]');if(shape){BMH.state.project.site.shape=shape.dataset.siteShape;BMH.save();BMH.render();return;}
  const road=e.target.closest('[data-road-value]');if(road){BMH.state.project.site.road=Number(road.dataset.roadValue);BMH.save();BMH.render();return;}
  const addPerson=e.target.closest('[data-household-add]');if(addPerson){const h=BMH.state.project.household;if(addPerson.dataset.householdAdd==='child')h.children.push({id:BMH.uid('c'),name:`Con ${h.children.length+1}`,birth:new Date().getFullYear()-8,room:'Riêng'});else h.relatives.push({id:BMH.uid('p'),name:`Người thân ${h.relatives.length+1}`,birth:1960,mobility:'Bình thường'});BMH.syncHouseholdSize?.();BMH.save();BMH.render();return;}
  const rem=e.target.closest('[data-person-remove]');if(rem){const h=BMH.state.project.household,key=rem.dataset.personRemove==='child'?'children':'relatives';h[key]=h[key].filter(x=>x.id!==rem.dataset.id);BMH.syncHouseholdSize?.();BMH.save();BMH.render();return;}

  const dtab=e.target.closest('[data-design-tab]');if(dtab){BMH.state.ui.designTab=dtab.dataset.designTab;if(dtab.dataset.designTab==='planner')BMH.state.ui.planner.view='plan';BMH.save();BMH.render();return;}
  const strategy=e.target.closest('[data-design-strategy]');if(strategy){BMH.state.project.site.designStrategy=strategy.dataset.designStrategy;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-auto-plan]')){BMH.autoPlanConcept(BMH.state.project.site.designStrategy);return;}
  if(e.target.closest('[data-generate-variants]')){BMH.generatePlanVariants();return;}
  if(e.target.closest('[data-auto-improve]')){BMH.autoImprovePlan();return;}
  const variant=e.target.closest('[data-apply-variant]');if(variant){BMH.applyPlanVariant(variant.dataset.applyVariant);return;}
  const lock=e.target.closest('[data-room-lock]');if(lock){BMH.toggleRoomLock(lock.dataset.roomLock);return;}
  const suggestion=e.target.closest('[data-room-suggest]');if(suggestion){BMH.applyRoomSuggestion(suggestion.dataset.roomSuggest,Number(suggestion.dataset.x),Number(suggestion.dataset.y));return;}
  if(e.target.closest('[data-save-version]')){const now=new Date(),label=`Mốc ${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;BMH.capturePlanVersion(label);return;}
  const restoreVersion=e.target.closest('[data-restore-version]');if(restoreVersion){BMH.restorePlanVersion(restoreVersion.dataset.restoreVersion);return;}
  const deleteVersion=e.target.closest('[data-delete-version]');if(deleteVersion){BMH.deletePlanVersion(deleteVersion.dataset.deleteVersion);return;}
  const pview=e.target.closest('[data-plan-view]');if(pview){BMH.state.ui.planner.view=pview.dataset.planView;BMH.state.ui.planner.tool='select';BMH.save();BMH.render();return;}
  const mview=e.target.closest('[data-material-view]');if(mview&&!mview.disabled){BMH.state.ui.materialCategory=mview.dataset.materialView;BMH.save();BMH.render();return;}
  const floor=e.target.closest('[data-floor]');if(floor){BMH.state.ui.planner.view='plan';BMH.state.ui.planner.floor=Number(floor.dataset.floor);const first=BMH.floorRooms()[0];BMH.state.ui.planner.selected=first?.id||null;BMH.save();BMH.render();return;}
  const room=e.target.closest('[data-room-select]');if(room){BMH.state.ui.planner.selected=room.dataset.roomSelect;BMH.state.ui.planner.tool='select';BMH.save();BMH.render();return;}
  const wallPlace=e.target.closest('[data-wall-place]');if(wallPlace&&BMH.state.ui.planner.tool!=='select'){const svg=BMH.$('#plannerSvg');if(svg){BMH.placeOpeningAt(BMH.state.ui.planner.tool,wallPlace.dataset.room,wallPlace.dataset.side,BMH.svgPoint(e,svg));}return;}
  const planTool=e.target.closest('[data-plan-tool]');if(planTool){BMH.state.ui.planner.tool=planTool.dataset.planTool;BMH.save();BMH.render();return;}
  const alignFloor=e.target.closest('[data-align-floor]');if(alignFloor){BMH.alignCurrentFloor(alignFloor.dataset.alignFloor);return;}
  const addRoom=e.target.closest('[data-add-room]');if(addRoom){BMH.addRoom(addRoom.dataset.addRoom);return;}
  const opening=e.target.closest('[data-add-opening]');if(opening){BMH.addOpening(opening.dataset.addOpening);return;}
  const openingDelete=e.target.closest('[data-opening-delete]');if(openingDelete){BMH.pushPlanHistory();BMH.state.project.plan.openings=BMH.state.project.plan.openings.filter(o=>o.id!==openingDelete.dataset.openingDelete);BMH.save();BMH.render();return;}
  if(e.target.closest('[data-room-delete]')){BMH.pushPlanHistory();const id=BMH.state.ui.planner.selected;BMH.state.project.plan.rooms=BMH.state.project.plan.rooms.filter(r=>r.id!==id);BMH.state.project.plan.openings=BMH.state.project.plan.openings.filter(o=>o.roomId!==id);BMH.state.ui.planner.selected=BMH.floorRooms()[0]?.id||null;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-plan-undo]')){BMH.undoPlan();return;}
  if(e.target.closest('[data-plan-redo]')){BMH.redoPlan();return;}
  const zoomBtn=e.target.closest('[data-planner-zoom]');if(zoomBtn){const ui=BMH.state.ui.planner;ui.zoom=BMH.clamp(ui.zoom+(zoomBtn.dataset.plannerZoom==='in'?.15:-.15),.75,2.5);BMH.save();BMH.render();return;}
  if(e.target.closest('[data-planner-fit]')){BMH.state.ui.planner.zoom=1;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-planner-layout]')){const ui=BMH.state.ui.planner;ui.layout=ui.layout==='wide'?'compact':'wide';if(ui.layout==='wide'){ui.toolsOpen=false;ui.inspectorOpen=false;}BMH.save();BMH.render();return;}
  const plannerPanel=e.target.closest('[data-planner-panel]');if(plannerPanel){const ui=BMH.state.ui.planner,key=plannerPanel.dataset.plannerPanel==='tools'?'toolsOpen':'inspectorOpen';ui[key]=!ui[key];if(ui[key]&&ui.layout==='wide'){const other=key==='toolsOpen'?'inspectorOpen':'toolsOpen';ui[other]=false;}BMH.save();BMH.render({preserveScroll:true});return;}
  if(e.target.closest('[data-planner-legend]')){const ui=BMH.state.ui.planner;ui.legendOpen=!ui.legendOpen;BMH.save();BMH.render({preserveScroll:true});return;}
  if(e.target.closest('[data-planner-text]')){const ui=BMH.state.ui.planner;ui.textSize=ui.textSize==='large'?'normal':'large';BMH.save();BMH.render();return;}
  if(e.target.closest('[data-planner-fullscreen]')){const el=BMH.$('.technical-sheet'); if(el?.requestFullscreen) el.requestFullscreen().catch(()=>BMH.toast('Trình duyệt không cho phép toàn màn hình.')); return;}
  const cpack=e.target.closest('[data-climate-package]');if(cpack){const before=BMH.estimate().total;BMH.state.project.materials.climatePackage=cpack.dataset.climatePackage;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const performance=e.target.closest('[data-performance]');if(performance){const key=performance.dataset.performance,cfg=BMH.state.project.performance;if(key in cfg){const before=BMH.estimate().total;cfg[key]=!cfg[key];const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();}return;}
  const perfMode=e.target.closest('[data-performance-mode]');if(perfMode){BMH.state.project.performance.mode=perfMode.dataset.performanceMode;BMH.save();BMH.render();return;}
  const tier=e.target.closest('[data-tier]');if(tier){const before=BMH.estimate().total;BMH.state.project.materials.tier=tier.dataset.tier;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const material=e.target.closest('[data-material]');if(material){const before=BMH.estimate().total,cat=material.dataset.materialCat;BMH.state.project.materials.choices[cat]=material.dataset.material;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const sm=e.target.closest('[data-scene-mode]');if(sm){BMH.state.ui.sceneMode=sm.dataset.sceneMode;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-scene-explode]')){BMH.state.ui.sceneExploded=!BMH.state.ui.sceneExploded;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-scene-theme]')){BMH.state.ui.sceneTheme=BMH.state.ui.sceneTheme==='day'?'night':'day';BMH.save();BMH.render();return;}
  const focusBtn=e.target.closest('[data-scene-focus-btn]');if(focusBtn){BMH.state.ui.sceneFocus=focusBtn.dataset.sceneFocusBtn||'all';BMH.save();BMH.render();return;}
  if(e.target.closest('[data-studio3d-reset]')){BMH.resetStudio3D?.();return;}
  if(e.target.closest('[data-cinematic-render]')){BMH.generateCinematicRender?.();return;}
  const wear=e.target.closest('[data-wear]');if(wear){BMH.state.project.wearYear=Number(wear.dataset.wear);BMH.save();BMH.render();return;}
  const copy=e.target.closest('[data-copy]');if(copy){navigator.clipboard?.writeText(copy.dataset.copy).then(()=>BMH.toast('Đã sao chép.')).catch(()=>BMH.toast('Không thể sao chép tự động.'));return;}
  if(e.target.closest('[data-dev-pay]')&&BMH.DEV){BMH.state.access.paid=!BMH.state.access.paid;BMH.state.access.source=BMH.state.access.paid?'dev-local':'none';BMH.state.access.paidAt=BMH.state.access.paid?new Date().toISOString():null;BMH.state.access.verifiedAt=BMH.state.access.paid?new Date().toISOString():null;BMH.save();BMH.render();return;}
  const exp=e.target.closest('[data-export]');if(exp){
    e.preventDefault();e.stopPropagation();
    const actions={loan:BMH.exportLoan,estimate:BMH.exportEstimate,plan:BMH.exportPlanSvg,json:BMH.exportProjectJson,bundle:BMH.exportDossierBundle||BMH.exportBundle,'dossier-pdf':()=>BMH.printDossier(),'mep-pdf':()=>BMH.printDossier({mepOnly:true}),'dossier-excel':BMH.exportDossierExcel,drawings:BMH.exportDrawingsBundle};
    const fn=actions[exp.dataset.export];
    if(typeof fn!=='function'){BMH.toast('Chức năng tải tài liệu này chưa sẵn sàng.');return;}
    exp.classList.add('is-working');exp.setAttribute('aria-busy','true');
    try{
      const out=fn();
      if(out&&typeof out.then==='function')out.catch(err=>{console.error('Build My Home export error',err);BMH.toast('Xuất tài liệu gặp lỗi. Hãy thử lại.');});
    }catch(err){console.error('Build My Home export error',err);BMH.toast('Xuất tài liệu gặp lỗi. Hãy thử lại.');}
    setTimeout(()=>{exp.classList.remove('is-working');exp.removeAttribute('aria-busy');},650);
    return;
  }
  if(e.target.closest('[data-print]')){window.print();return;}
});

document.addEventListener('change',e=>{
  const t=e.target;
  if(t?.id==='uploadPhoto'){if(t.files?.[0]){BMH.toast('Đã nhận ảnh tham khảo. Tiếp tục nhập thông tin dự án.');BMH.navigateTo(2);}t.value='';return;}
  if(t?.id==='uploadPlan'){if(t.files?.[0]){BMH.toast('Đã nhận bản vẽ tham chiếu. Bạn có thể đối chiếu ở Bước 5.');BMH.navigateTo(2);}t.value='';return;}
  if(t?.id==='priceQuoteUpload'){if(t.files?.[0])BMH.importPriceQuote(t.files[0]).catch(()=>BMH.toast('Không đọc được file báo giá. Dùng JSON hoặc CSV theo mẫu V4.8.'));t.value='';return;}
  if(!t.closest?.('#app'))return;
  if(t.dataset.path){let v=t.type==='checkbox'?t.checked:(t.type==='number'?Number(t.value)*(Number(t.dataset.scale)||1):t.value);const path=t.dataset.path;if(path==='project.dossier.progress')v=BMH.clamp(Number(v)||0,0,100);if(path==='project.site.province'){const r=BMH.REGIONS[v];BMH.state.project.site.province=v;if(r){const pt=BMH.regionPoint(v,r.defaultDistrict);Object.assign(BMH.state.project.site,{district:pt.district,lat:pt.lat,lng:pt.lng,geoSource:'Dữ liệu vùng'});}BMH.liveWeather=null;BMH.save();BMH.render();return;}if(path==='project.site.district'){BMH.state.project.site.district=v;const pt=BMH.regionPoint(BMH.state.project.site.province,v);BMH.state.project.site.lat=pt.lat;BMH.state.project.site.lng=pt.lng;BMH.state.project.site.geoSource='Dữ liệu vùng';BMH.liveWeather=null;BMH.save();BMH.render();return;}if(['project.finance.cash','project.finance.reserve','project.finance.loan'].includes(path))BMH.state.project.finance.targetBudget=0;
if(['project.finance.introRate','project.finance.postRate','project.finance.promoMonths'].includes(path)){
  const m=BMH.state.project.finance.rateMeta||{};
  BMH.state.project.finance.rateMeta={...m,status:'manual',verified:false,note:'Lãi suất đã được người dùng chỉnh tay sau lần cập nhật AI.'};
}
BMH.set(path,v);return;}
  if(t.dataset.person){const h=BMH.state.project.household,list=t.dataset.person==='child'?h.children:h.relatives,p=list.find(x=>x.id===t.dataset.id);if(p){p[t.dataset.key]=t.type==='number'?Number(t.value):t.value;BMH.save();BMH.render();}return;}
  if(t.dataset.planner){const ui=BMH.state.ui.planner;if(t.dataset.planner==='snap')ui.snap=Number(t.value);if(t.dataset.planner==='furniture')ui.showFurniture=t.checked;if(t.dataset.planner==='dimensions')ui.showDimensions=t.checked;if(t.dataset.planner==='feng')ui.showFeng=t.checked;if(t.dataset.planner==='below')ui.showBelow=t.checked;if(t.dataset.planner==='structure')ui.showStructure=t.checked;if(t.dataset.planner==='environment')ui.showEnvironment=t.checked;if(t.dataset.planner==='circulation')ui.showCirculation=t.checked;if(t.dataset.planner==='sectionLine')ui.showSectionLine=t.checked;if(t.dataset.planner==='climate')ui.showClimate=t.checked;if(t.dataset.planner==='envelope')ui.showEnvelope=t.checked;BMH.save();BMH.render();return;}
  if(t.dataset.roomField){const r=BMH.selectedRoom();if(!r)return;BMH.pushPlanHistory();const key=t.dataset.roomField,old={...r};r[key]=['x','y','w','h'].includes(key)?Number(t.value):t.value;if(['x','y','w','h'].includes(key)){r[key]=BMH.roundTo(r[key],BMH.state.ui.planner.snap);if(!BMH.roomValid(r)){Object.assign(r,old);BMH.toast('Giá trị mới gây chồng phòng hoặc vượt ranh.');}}BMH.save();BMH.render();return;}
  if(t.dataset.openingField){const o=BMH.state.project.plan.openings.find(x=>x.id===t.dataset.openingId);if(o){const old={...o};BMH.pushPlanHistory();o[t.dataset.openingField]=['width','offset'].includes(t.dataset.openingField)?Number(t.value):t.value;if(!BMH.openingFits(o,o.id)){Object.assign(o,old);BMH.planHistory.undo.pop();BMH.toast('Kích thước/vị trí ô mở đang trùng hoặc vượt chiều dài tường.');}BMH.save();BMH.render();}return;}
  if(t.matches('[data-scene-focus]')){BMH.state.ui.sceneFocus=t.value;BMH.save();BMH.render();return;}
  if(t.dataset.check){BMH.state.project.checklist[t.dataset.check]=t.checked;BMH.save();BMH.render({preserveScroll:true});return;}
});

BMH.paintPlacementHint = (review,invalidText='') => {
  const box=BMH.$('#placementHint');if(!box)return;
  box.classList.remove('placement-good','placement-mid','placement-bad','invalid');
  if(invalidText){box.classList.add('placement-bad','invalid');box.innerHTML=`<strong>KHÔNG HỢP</strong><b>—</b><span>Vị trí đang bị chặn</span><small>${BMH.esc(invalidText)}</small>`;return;}
  if(!review)return;
  box.classList.add(`placement-${review.code}`);box.innerHTML=`<strong>${review.status}</strong><b>${review.score}/100</b><span>${BMH.esc(review.name)} · vùng ${BMH.esc(review.sector)}</span><small>${BMH.esc(review.notes[0]||'Vị trí đang được đánh giá.')}</small>`;
};
BMH.roomDragMatrix = (from,to) => {
  if(!from||!to)return 'matrix(1 0 0 1 0 0)';
  const sx=from.w?to.w/from.w:1,sy=from.h?to.h/from.h:1,e=to.x-sx*from.x,f=to.y-sy*from.y;
  return `matrix(${sx} 0 0 ${sy} ${e} ${f})`;
};
BMH.paintRoomDragPreview = candidate => {
  const d=BMH.drag;if(!d)return;
  for(const next of candidate||[]){
    if(next.floor!==BMH.state.ui.planner.floor)continue;
    const prev=d.originalPlan.rooms.find(x=>x.id===next.id),g=document.querySelector(`#plannerSvg [data-room-id="${CSS.escape(next.id)}"]`);if(!prev||!g)continue;
    const changed=Math.abs(prev.x-next.x)>.001||Math.abs(prev.y-next.y)>.001||Math.abs(prev.w-next.w)>.001||Math.abs(prev.h-next.h)>.001;
    if(changed){g.setAttribute('transform',BMH.roomDragMatrix(prev,next));g.classList.add('drag-preview');}else{g.removeAttribute('transform');g.classList.remove('drag-preview');}
  }
};
BMH.clearRoomDragPreview = () => {document.querySelectorAll('#plannerSvg .drag-preview').forEach(g=>{g.removeAttribute('transform');g.classList.remove('drag-preview');});};

document.addEventListener('wheel',e=>{
  if(BMH.state.ui.step!==5||!e.target.closest?.('.planner-canvas-stage')||!BMH.$('#plannerSvg'))return;
  e.preventDefault();const ui=BMH.state.ui.planner,delta=e.deltaY>0?-.1:.1,next=BMH.clamp(Math.round(((ui.zoom||1)+delta)*10)/10,.75,2.5);if(next===ui.zoom)return;ui.zoom=next;BMH.save();BMH.render({preserveScroll:true});
},{passive:false});

document.addEventListener('pointerdown',e=>{
  if(!e.target.closest?.('#app'))return;
  if(BMH.state.ui.step!==5||BMH.state.ui.planner.tool!=='select')return;
  const edge=e.target.closest('[data-edge-id]'),handle=e.target.closest('[data-resize-id]'),group=e.target.closest('[data-room-id]');
  const id=edge?.dataset.edgeId||handle?.dataset.resizeId||group?.dataset.roomId;if(!id)return;
  const r=BMH.state.project.plan.rooms.find(x=>x.id===id);if(!r)return;if(BMH.isRoomLocked(id)){BMH.state.ui.planner.selected=id;BMH.save();BMH.render({preserveScroll:true});BMH.toast('Phòng này đang khóa. Mở khóa trong bảng thuộc tính nếu muốn di chuyển.');return;}const svg=BMH.$('#plannerSvg');if(!svg)return;
  const selectionChanged=BMH.state.ui.planner.selected!==id,startPoint=BMH.svgPoint(e,svg);
  BMH.drag={id,mode:edge?'edge':handle?'resize':'move',side:edge?.dataset.edgeSide||null,startPoint,originalPlan:BMH.planSnapshot(),changed:false,selectionChanged,invalid:false,historyPushed:false,pointerId:e.pointerId,captureEl:svg,lastCandidate:null};
  BMH.state.ui.planner.selected=id;document.documentElement.classList.add('room-dragging');BMH.paintPlacementHint(BMH.roomPlacementReview(r));
  try{svg.setPointerCapture?.(e.pointerId);}catch(_){}
  e.preventDefault();
});
window.addEventListener('pointermove',e=>{
  const d=BMH.drag;if(!d||e.pointerId!==d.pointerId)return;const svg=BMH.$('#plannerSvg'),pt=svg?BMH.svgPoint(e,svg):d.startPoint,dx=pt.x-d.startPoint.x,dy=pt.y-d.startPoint.y,s=BMH.state.ui.planner.snap,site=BMH.state.project.site;
  let candidate=structuredClone(d.originalPlan.rooms),r=candidate.find(x=>x.id===d.id);if(!r)return;
  if(d.mode==='move'){r.x=BMH.clamp(BMH.roundTo(r.x+dx,s),0,site.width-r.w);r.y=BMH.clamp(BMH.roundTo(r.y+dy,s),0,site.depth-r.h);d.guides=BMH.smartSnapMove(r,candidate);}
  else if(d.mode==='resize'){d.guides=[];r.w=BMH.clamp(BMH.roundTo(r.w+dx,s),.6,site.width-r.x);r.h=BMH.clamp(BMH.roundTo(r.h+dy,s),.6,site.depth-r.y);}
  else {d.guides=[];const delta=BMH.roundTo((d.side==='east'||d.side==='west')?dx:dy,s);candidate=BMH.edgeMoveCandidate(d.originalPlan.rooms,d.id,d.side,delta);}
  if(!candidate||!BMH.layoutValid(candidate)){d.invalid=true;BMH.paintPlacementHint(null,'Phòng đang chồng không gian khác hoặc vượt ranh lô đất. Kéo về vùng trống rồi thả.');return;}
  d.invalid=false;
  if(!d.historyPushed){BMH.planHistory.undo.push(structuredClone(d.originalPlan));if(BMH.planHistory.undo.length>30)BMH.planHistory.undo.shift();BMH.planHistory.redo.length=0;d.historyPushed=true;}
  BMH.state.project.plan.rooms=candidate;d.lastCandidate=candidate;d.changed=true;const moved=candidate.find(x=>x.id===d.id);d.review=BMH.roomPlacementReview(moved);BMH.lastPlacementReview=d.review;BMH.paintPlacementHint(d.review);BMH.paintRoomDragPreview(candidate);
  e.preventDefault();
},{passive:false});
BMH.finishRoomDrag = e => {const d=BMH.drag;if(!d)return;if(e?.pointerId!=null&&e.pointerId!==d.pointerId)return;try{d.captureEl?.releasePointerCapture?.(d.pointerId);}catch(_){}BMH.clearRoomDragPreview();BMH.drag=null;document.documentElement.classList.remove('room-dragging');if(d.changed){BMH.save();const r=BMH.state.project.plan.rooms.find(x=>x.id===d.id),review=r?BMH.roomPlacementReview(r):d.review;BMH.lastPlacementReview=review;BMH.render({preserveScroll:true});if(d.invalid)BMH.toast('Điểm thả cuối không hợp lệ; đã giữ vị trí hợp lệ gần nhất.');else if(review)BMH.toast(`${review.name}: ${review.status} ${review.score}/100 · ${review.notes[0]||'Đã cập nhật vị trí.'}`);}else if(d.selectionChanged){BMH.save();BMH.render({preserveScroll:true});}else if(d.invalid){BMH.toast('Vị trí đó không hợp lệ vì chồng phòng hoặc vượt ranh.');}};
window.addEventListener('pointerup',BMH.finishRoomDrag);
window.addEventListener('pointercancel',BMH.finishRoomDrag);

document.addEventListener('keydown',e=>{
  if(BMH.state.ui.step!==5)return;
  const tag=(e.target?.tagName||'').toLowerCase();if(tag==='input'||tag==='select'||tag==='textarea')return;
  if(e.key==='Escape'&&BMH.state.ui.planner.tool!=='select'){BMH.state.ui.planner.tool='select';BMH.save();BMH.render();BMH.toast('Đã trở về công cụ chọn.');return;}
  if(!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()==='d'){BMH.state.ui.planner.tool='door';BMH.save();BMH.render();BMH.toast('Công cụ cửa đi · nhấp lên cạnh tường.');return;}
  if(!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()==='w'){BMH.state.ui.planner.tool='window';BMH.save();BMH.render();BMH.toast('Công cụ cửa sổ · nhấp lên cạnh tường.');return;}
  if(!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()==='f'){BMH.state.ui.planner.zoom=1;BMH.save();BMH.render();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?BMH.redoPlan():BMH.undoPlan();}
});

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')BMH.save();}); window.addEventListener('pagehide',BMH.save);
window.addEventListener('load',()=>{try{if('serviceWorker'in navigator)navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{});if('caches'in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>String(k).startsWith('bmh-')).map(k=>caches.delete(k)))).catch(()=>{});}catch(_){}});
globalThis.BuildMyHome=BMH;
if(BMH.DEV){const q=new URLSearchParams(location.search);const qs=Number(q.get('step'));if(qs>=1&&qs<=10)BMH.state.ui.step=qs;if(q.get('unlock')==='1'){BMH.state.access.paid=true;BMH.state.access.source='dev-query';BMH.state.access.verifiedAt=new Date().toISOString();}}
BMH.render();
BMH.cloudInit?.().catch(()=>{});
globalThis.__BMH_BOOT_OK=true;
