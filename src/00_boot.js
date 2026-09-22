const BMH = {
  VERSION: '4.7.0',
  STORAGE_KEY: 'bmh-v342-stable',
  LEGACY_STORAGE_KEYS: ['bmh-v23-visual'],
  DEV: ['localhost','127.0.0.1',''].includes(location.hostname),
  map: null,
  mapEngine: null,
  mapMarker: null,
  mapLot: null,
  mapLabels: null,
  mapContext: [],
  mapLotPoints: [],
  googleMapsPromise: null,
  GOOGLE_MAPS_KEY: '__BMH_GOOGLE_MAPS_API_KEY__',
  liveWeather: null,
  liveWeatherKey: '',
  drag: null,
  lastPlacementReview: null,
  suggestionCache: new Map(),
  planHistory: {undo:[], redo:[]},
  toastTimer: null,
};

BMH.$ = (s, root=document) => root.querySelector(s);
BMH.$$ = (s, root=document) => [...root.querySelectorAll(s)];
BMH.esc = (v='') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
BMH.clamp = (n,min,max) => Math.min(max,Math.max(min,n));
BMH.roundTo = (n,step=.2) => Math.round(n/step)*step;
BMH.money = n => new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(Math.round(Number(n)||0))+' đ';
BMH.num = (n,d=1) => new Intl.NumberFormat('vi-VN',{maximumFractionDigits:d}).format(Number(n)||0);
BMH.uid = p => `${p}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,7)}`;
BMH.download = (name, content, type='text/plain;charset=utf-8') => {
  const blob = content instanceof Blob ? content : new Blob([content],{type});
  const url = URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1500);
};
BMH.toast = msg => {
  const el=BMH.$('#toast'); if(!el) return; el.textContent=msg; el.classList.add('show'); clearTimeout(BMH.toastTimer); BMH.toastTimer=setTimeout(()=>el.classList.remove('show'),3200);
};
BMH.icon = name => {
  const paths={home:'M3 11l9-8 9 8v10H3z M9 21v-7h6v7',user:'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 21a8 8 0 0 1 16 0',folder:'M3 5h7l2 2h9v13H3z',image:'M3 4h18v16H3z M4 17l5-5 4 4 3-3 5 4',users:'M8 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M2 21a6 6 0 0 1 12 0 M18 11a3 3 0 1 0 0-6',cube:'M12 2l9 5-9 5-9-5z M3 7v10l9 5 9-5V7 M12 12v10',book:'M4 4h7a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4z M20 4h-7a3 3 0 0 0-3 3',gear:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M4 12l-2-1 2-4 2 1 2-2-1-2 4-2 1 2 3 1 2-1 4 2-1 2 2 2 2-1 2 4-2 1v3l2 1-2 4-2-1-2 2 1 2-4 2-1-2-3-1-2 1-4-2 1-2-2-2-2 1-2-4 2-1z',pin:'M12 22s7-7 7-13a7 7 0 1 0-14 0c0 6 7 13 7 13z M12 7a2 2 0 1 0 0 4 2 2 0 0 0 0-4',bell:'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4',arrow:'M5 12h14 M13 6l6 6-6 6',back:'M19 12H5 M11 6l-6 6 6 6',lock:'M6 10h12v11H6z M8 10V7a4 4 0 0 1 8 0v3',check:'M5 12l4 4L19 6',upload:'M12 16V4 M7 9l5-5 5 5 M4 18v3h16v-3',plus:'M12 5v14 M5 12h14',copy:'M9 9h11v11H9z M4 4h11v3 M4 4v11h3',download:'M12 4v12 M7 11l5 5 5-5 M4 20h16',menu:'M4 6h16 M4 12h16 M4 18h16',sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v2 M12 20v2 M2 12h2 M20 12h2',moon:'M20 16a8 8 0 0 1-12-10 8 8 0 1 0 12 10',print:'M6 9V3h12v6 M6 18H4v-7h16v7h-2 M7 14h10v7H7z',trash:'M4 7h16 M9 7V4h6v3 M7 7l1 14h8l1-14'};
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name]||paths.home}"/></svg>`;
};

BMH.STEPS = [
  ['Khởi tạo','Khởi tạo dự án mới'],['Hồ sơ tài chính & DTI','Hồ sơ tài chính & DTI'],['Vị trí & khí hậu vùng','Vị trí & khí hậu vùng'],['Đất, địa chất & phong thủy','Đất, địa chất & phong thủy gia đình'],['Bản vẽ thiết kế','Bản vẽ thiết kế'],['Gói vật liệu','Gói vật liệu'],['Mô phỏng 3D & đánh giá','Mô phỏng 3D & đánh giá'],['Dự toán & thanh toán','Dự toán & thanh toán'],['Giám sát thi công & MEP','Giám sát thi công & checklist MEP'],['Hồ sơ bàn giao & giải ngân','Hồ sơ bàn giao & giải ngân']
];

BMH.REGIONS = {
  'TP. Hồ Chí Minh': {
    lat:10.7769,lng:106.7009,zoom:11,defaultDistrict:'Phường Sài Gòn',
    adminNote:'Từ 01/07/2025, TP.HCM mới bao gồm khu vực TP.HCM cũ, Bình Dương và Bà Rịa – Vũng Tàu.',
    climate:'Nhiệt đới gió mùa nóng ẩm',temp:'26–29°C',humidity:'75–85%',rainfall:'1.800–2.200 mm/năm',wet:'Tháng 5–11',dry:'Tháng 12–4',wind:'Tây Nam mùa mưa · Đông Bắc mùa khô',sun:'Nắng Tây mạnh 13h–17h',
    flood:'Trung bình - Cao',storm:'Thấp - Trung bình',heat:'Cao',corrosion:'Thấp - Trung bình',labor:'400.000 – 650.000 đ/ngày',
    bestMonths:[12,1,2,3,4],watchMonths:[5,6,11],riskMonths:[7,8,9,10],
    designTips:['Ưu tiên che nắng hướng Tây/Tây Nam bằng lam, ban công hoặc cây xanh.','Tăng thông gió chéo và mái/khối đệm giảm tích nhiệt.','Nâng cao độ nền, bố trí thoát nước mặt và chống thấm chân tường ở khu vực có nguy cơ ngập.','Tách lớp chống nóng mái và kiểm soát ẩm cho WC, ban công, sân thượng.'],
    districts:[
      ['Phường Sài Gòn',10.7769,106.7009,{flood:'Trung bình',heat:'Cao',corrosion:'Thấp'}],
      ['Phường Bến Thành',10.7720,106.6980,{flood:'Trung bình',heat:'Cao'}],
      ['Phường Thủ Đức',10.8494,106.7537,{flood:'Trung bình',heat:'Cao'}],
      ['Phường Thủ Dầu Một',11.1600,106.6500,{flood:'Trung bình',storm:'Thấp',corrosion:'Thấp',labor:'380.000 – 560.000 đ/ngày'}],
      ['Phường Dĩ An',10.9060,106.7690,{flood:'Trung bình',storm:'Thấp',corrosion:'Thấp'}],
      ['Phường Thuận An',10.9320,106.7110,{flood:'Trung bình - Cao',storm:'Thấp',corrosion:'Thấp'}],
      ['Phường Bến Cát',11.1510,106.5940,{flood:'Thấp - Trung bình',storm:'Thấp',heat:'Cao'}],
      ['Phường Vũng Tàu',10.3460,107.0840,{flood:'Trung bình',storm:'Trung bình - Cao',corrosion:'Cao',wind:'Gió biển mạnh · Đông Bắc mùa khô',sun:'Bức xạ cao, hơi muối ven biển',labor:'400.000 – 600.000 đ/ngày'}]
    ]
  },
  'Đà Nẵng': {
    lat:16.0544,lng:108.2022,zoom:10,defaultDistrict:'Sơn Trà (khu vực)',
    adminNote:'Đà Nẵng mới hình thành từ Đà Nẵng và Quảng Nam sau sắp xếp cấp tỉnh năm 2025.',
    climate:'Nhiệt đới gió mùa ven biển',temp:'25–29°C',humidity:'78–86%',rainfall:'2.000–3.000 mm/năm',wet:'Tháng 9–12',dry:'Tháng 1–8',wind:'Gió biển · Đông Bắc mùa mưa bão',sun:'Nắng mạnh mùa khô, bức xạ cao ven biển',
    flood:'Trung bình - Cao',storm:'Cao',heat:'Cao',corrosion:'Cao ven biển',labor:'350.000 – 520.000 đ/ngày',
    bestMonths:[2,3,4,5,6,7],watchMonths:[1,8,12],riskMonths:[9,10,11],
    designTips:['Gia cường mái, liên kết mái–tường và kiểm tra tải gió cho các mặt đứng hứng bão.','Ưu tiên chống thấm mái, ban công và chân tường; bố trí thoát nước mưa lớn.','Dùng vật liệu/phụ kiện chống ăn mòn cho khu vực gần biển.','Bố trí lam che nắng kết hợp thông gió chéo để giảm tải điều hòa mùa khô.'],
    districts:[
      ['Sơn Trà (khu vực)',16.1060,108.2520,{storm:'Cao',corrosion:'Cao',flood:'Trung bình'}],
      ['Hải Châu (khu vực)',16.0600,108.2210,{storm:'Cao',flood:'Trung bình - Cao'}],
      ['Ngũ Hành Sơn (khu vực)',16.0180,108.2600,{storm:'Cao',corrosion:'Cao',flood:'Trung bình - Cao'}],
      ['Liên Chiểu (khu vực)',16.0820,108.1500,{storm:'Cao',flood:'Trung bình'}],
      ['Hội An (khu vực)',15.8801,108.3380,{flood:'Cao',storm:'Cao',corrosion:'Trung bình - Cao'}],
      ['Tam Kỳ (khu vực)',15.5736,108.4740,{flood:'Trung bình - Cao',storm:'Cao'}]
    ]
  },
  'Hà Nội': {
    lat:21.0278,lng:105.8342,zoom:11,defaultDistrict:'Ba Đình (khu vực)',
    adminNote:'Tên khu vực dùng để định vị và khí hậu; khi làm hồ sơ pháp lý cần đối chiếu phường/xã hiện hành.',
    climate:'Cận nhiệt đới ẩm · bốn mùa',temp:'23–25°C trung bình năm',humidity:'75–85%',rainfall:'1.600–1.900 mm/năm',wet:'Tháng 5–10',dry:'Tháng 11–4',wind:'Đông Nam mùa hè · Đông Bắc mùa đông',sun:'Nắng nóng mạnh tháng 5–8',
    flood:'Trung bình',storm:'Trung bình',heat:'Cao mùa hè',corrosion:'Thấp',labor:'400.000 – 650.000 đ/ngày',
    bestMonths:[2,3,4,10,11,12],watchMonths:[1,5,9],riskMonths:[6,7,8],
    designTips:['Tăng che nắng hướng Tây và thông gió mùa hè nhưng vẫn kiểm soát gió lạnh mùa đông.','Chú ý chống ẩm, ngưng tụ và thông thoáng kho/WC trong mùa nồm.','Tổ chức mái và thoát nước mưa lớn cho giai đoạn tháng 6–9.','Ưu tiên lớp bao che có quán tính nhiệt tốt để giảm dao động nóng–lạnh.'],
    districts:[['Ba Đình (khu vực)',21.0338,105.8142,{}],['Hoàn Kiếm (khu vực)',21.0288,105.8522,{flood:'Trung bình'}],['Cầu Giấy (khu vực)',21.0362,105.7906,{}],['Hà Đông (khu vực)',20.9712,105.7788,{flood:'Trung bình - Cao'}]]
  },
  'Đồng Nai': {
    lat:10.9574,lng:106.8426,zoom:10,defaultDistrict:'Biên Hòa (khu vực)',
    adminNote:'Đồng Nai mới bao gồm khu vực Đồng Nai và Bình Phước sau sắp xếp cấp tỉnh năm 2025.',
    climate:'Nhiệt đới gió mùa',temp:'26–28°C',humidity:'74–84%',rainfall:'1.800–2.400 mm/năm',wet:'Tháng 5–11',dry:'Tháng 12–4',wind:'Tây Nam mùa mưa',sun:'Nắng nóng mạnh cuối mùa khô',
    flood:'Trung bình',storm:'Thấp - Trung bình',heat:'Cao',corrosion:'Thấp',labor:'350.000 – 550.000 đ/ngày',
    bestMonths:[12,1,2,3,4],watchMonths:[5,11],riskMonths:[6,7,8,9,10],
    designTips:['Tăng che nắng Tây và thông gió chéo.','Kiểm tra cao độ nền, thoát nước mặt ở khu vực trũng hoặc gần sông.','Tổ chức sân bãi và đường công vụ phù hợp xe vật tư.','Dự phòng chống thấm mái và khe tiếp giáp trong mùa mưa kéo dài.'],
    districts:[['Biên Hòa (khu vực)',10.9574,106.8426,{flood:'Trung bình - Cao'}],['Long Thành (khu vực)',10.7899,107.0551,{flood:'Thấp - Trung bình'}],['Nhơn Trạch (khu vực)',10.7245,106.8835,{flood:'Trung bình - Cao'}],['Đồng Xoài (khu vực)',11.5349,106.8895,{flood:'Thấp',heat:'Cao'}]]
  },
  'Tây Ninh': {
    lat:11.3130,lng:106.0963,zoom:10,defaultDistrict:'Tây Ninh (khu vực)',
    adminNote:'Tây Ninh mới hình thành từ Tây Ninh và Long An sau sắp xếp cấp tỉnh năm 2025.',
    climate:'Nhiệt đới gió mùa · nội địa nóng',temp:'26–29°C',humidity:'72–82%',rainfall:'1.500–1.900 mm/năm',wet:'Tháng 5–11',dry:'Tháng 12–4',wind:'Tây Nam mùa mưa',sun:'Nắng nóng và bức xạ cao mùa khô',
    flood:'Thấp - Trung bình',storm:'Thấp',heat:'Cao',corrosion:'Thấp',labor:'330.000 – 500.000 đ/ngày',
    bestMonths:[12,1,2,3,4],watchMonths:[5,11],riskMonths:[6,7,8,9,10],
    designTips:['Ưu tiên chống nóng mái và che nắng mặt Tây.','Tăng thông gió tự nhiên, sân đệm và cây xanh giảm bức xạ.','Vùng thấp cần kiểm tra thoát nước và cao độ nền trước khi chốt móng.','Dự trù nước tưới/bảo dưỡng bê tông trong các đợt nắng nóng.'],
    districts:[['Tây Ninh (khu vực)',11.3130,106.0963,{flood:'Thấp'}],['Tân An (khu vực)',10.5359,106.4137,{flood:'Trung bình - Cao'}],['Bến Lức (khu vực)',10.6408,106.4937,{flood:'Trung bình'}],['Đức Hòa (khu vực)',10.8772,106.3999,{flood:'Thấp - Trung bình'}]]
  },
  'Cần Thơ': {
    lat:10.0452,lng:105.7469,zoom:10,defaultDistrict:'Ninh Kiều (khu vực)',
    adminNote:'Cần Thơ mới mở rộng sau sắp xếp cấp tỉnh năm 2025; khu vực đồng bằng cần đặc biệt lưu ý nền đất và ngập.',
    climate:'Nhiệt đới gió mùa đồng bằng',temp:'26–29°C',humidity:'78–88%',rainfall:'1.600–2.000 mm/năm',wet:'Tháng 5–11',dry:'Tháng 12–4',wind:'Tây Nam mùa mưa',sun:'Nắng mạnh mùa khô',
    flood:'Cao',storm:'Thấp - Trung bình',heat:'Cao',corrosion:'Trung bình',labor:'330.000 – 500.000 đ/ngày',
    bestMonths:[12,1,2,3],watchMonths:[4,5,11],riskMonths:[6,7,8,9,10],
    designTips:['Khảo sát địa chất và cao độ nền kỹ trước khi chọn móng.','Ưu tiên giải pháp chống ngập, thoát nước mặt và vật liệu chịu ẩm.','Thông gió chéo kết hợp mái chống nóng cho khí hậu nóng ẩm.','Kiểm soát mối mọt, ẩm chân tường và ăn mòn phụ kiện ở môi trường ẩm cao.'],
    districts:[['Ninh Kiều (khu vực)',10.0452,105.7469,{flood:'Cao'}],['Cái Răng (khu vực)',10.0016,105.7850,{flood:'Cao'}],['Sóc Trăng (khu vực)',9.6025,105.9739,{flood:'Trung bình - Cao',corrosion:'Trung bình - Cao'}]]
  }
};
BMH.REGION_ALIASES = {
  'Bình Dương': {province:'TP. Hồ Chí Minh',districts:{'Thủ Dầu Một':'Phường Thủ Dầu Một','Dĩ An':'Phường Dĩ An','Thuận An':'Phường Thuận An','Bến Cát':'Phường Bến Cát'}},
  'Long An': {province:'Tây Ninh',districts:{'Tân An':'Tân An (khu vực)','Bến Lức':'Bến Lức (khu vực)','Đức Hòa':'Đức Hòa (khu vực)'}},
  'TP. Hồ Chí Minh': {province:'TP. Hồ Chí Minh',districts:{'Quận 1':'Phường Sài Gòn','TP Thủ Đức':'Phường Thủ Đức'}},
};
BMH.regionOptions = () => Object.keys(BMH.REGIONS).map(x=>[x,x]);
BMH.regionDistrictMeta = (region,district) => {
  const row=(region?.districts||[]).find(x=>x[0]===district);
  return row?.[3]&&typeof row[3]==='object'?row[3]:{};
};
BMH.regionPoint = (province,district) => {
  const r=BMH.REGIONS[province]||BMH.REGIONS['TP. Hồ Chí Minh'];
  const d=(r.districts||[]).find(x=>x[0]===district);
  return d?{lat:d[1],lng:d[2],district:d[0],zoom:r.zoom||12}:{lat:r.lat,lng:r.lng,district:r.defaultDistrict||district||province,zoom:r.zoom||12};
};
BMH.regionProfile = (site=BMH.state?.project?.site||{}) => {
  const r=BMH.REGIONS[site.province]||BMH.REGIONS['TP. Hồ Chí Minh'];
  return {...r,...BMH.regionDistrictMeta(r,site.district)};
};
BMH.riskValue = value => {
  const s=String(value||'').toLowerCase();
  if(s.includes('cao'))return 3;
  if(s.includes('trung bình'))return 2;
  if(s.includes('thấp'))return 1;
  return 0;
};
BMH.climateCalendar = (profile) => {
  const best=new Set(profile.bestMonths||[]),watch=new Set(profile.watchMonths||[]),risk=new Set(profile.riskMonths||[]);
  return Array.from({length:12},(_,i)=>{const m=i+1;return {month:m,status:risk.has(m)?'risk':watch.has(m)?'watch':best.has(m)?'good':'neutral'};});
};
BMH.siteAdaptation = (site=BMH.state?.project?.site||{}) => {
  const p=BMH.regionProfile(site), roadPct=site.road<3 ? .12 : site.road<5 ? .05 : .02;
  const flood=BMH.riskValue(p.flood),storm=BMH.riskValue(p.storm),corrosion=BMH.riskValue(p.corrosion),heat=BMH.riskValue(p.heat);
  const climatePct=BMH.clamp((Math.max(0,flood-1)*.012)+(Math.max(0,storm-1)*.008)+(Math.max(0,corrosion-1)*.004)+(Math.max(0,heat-1)*.003),0,.07);
  return {roadPct,climatePct,totalPct:roadPct+climatePct,profile:p};
};
BMH.haversineKm = (a,b) => {const R=6371,toRad=x=>x*Math.PI/180,dLat=toRad(b.lat-a.lat),dLng=toRad(b.lng-a.lng),la1=toRad(a.lat),la2=toRad(b.lat);const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;return 2*R*Math.asin(Math.sqrt(h));};
BMH.nearestRegionPoint = (lat,lng) => {
  let best=null;
  for(const [province,r] of Object.entries(BMH.REGIONS))for(const d of (r.districts||[])){const km=BMH.haversineKm({lat,lng},{lat:d[1],lng:d[2]});if(!best||km<best.km)best={province,district:d[0],lat,lng,km};}
  return best;
};

BMH.localMeters = (point,origin) => {
  const lat0=Number(origin?.lat)||0, lng0=Number(origin?.lng)||0, lat=Number(point?.lat)||0, lng=Number(point?.lng)||0;
  return {x:(lng-lng0)*111320*Math.max(.2,Math.cos(lat0*Math.PI/180)),y:(lat-lat0)*111320};
};
BMH.polygonAreaMeters = points => {
  if(!Array.isArray(points)||points.length<3)return 0;
  const origin=points.reduce((a,p)=>({lat:a.lat+Number(p.lat)/points.length,lng:a.lng+Number(p.lng)/points.length}),{lat:0,lng:0});
  const xy=points.map(p=>BMH.localMeters(p,origin)); let sum=0;
  for(let i=0;i<xy.length;i++){const a=xy[i],b=xy[(i+1)%xy.length];sum+=a.x*b.y-b.x*a.y;}
  return Math.abs(sum)/2;
};
BMH.polygonPerimeterMeters = points => {
  if(!Array.isArray(points)||points.length<2)return 0; let total=0;
  for(let i=0;i<points.length;i++)total+=BMH.haversineKm(points[i],points[(i+1)%points.length])*1000;
  return total;
};
BMH.siteParcelStats = (site=BMH.state?.project?.site||{}) => {
  const custom=site.lotMode==='custom'&&Array.isArray(site.lotPoints)&&site.lotPoints.length>=3;
  const points=custom?site.lotPoints:[];
  const area=custom?BMH.polygonAreaMeters(points):Math.max(0,(Number(site.width)||0)*(Number(site.depth)||0));
  const perimeter=custom?BMH.polygonPerimeterMeters(points):Math.max(0,2*((Number(site.width)||0)+(Number(site.depth)||0)));
  const frontage=custom&&points.length>=2?BMH.haversineKm(points[0],points[1])*1000:(Number(site.width)||0);
  const approxDepth=frontage>0?area/frontage:(Number(site.depth)||0);
  return {mode:custom?'custom':'rect',points,area,perimeter,frontage,approxDepth};
};
BMH.buildableEnvelope = (site=BMH.state?.project?.site||{}) => {
  const width=Math.max(.1,Number(site.width)||5),depth=Math.max(.1,Number(site.depth)||20),plot=BMH.siteParcelStats(site);
  const front=BMH.clamp(Number(site.setbackFront)||0,0,depth*.45),rear=BMH.clamp(Number(site.setbackRear)||0,0,depth*.35),side=BMH.clamp(Number(site.setbackSide)||0,0,width*.25);
  const buildWidth=Math.max(.1,width-side*2),buildDepth=Math.max(.1,depth-front-rear),envelopeArea=buildWidth*buildDepth,coverage=BMH.clamp(Number(site.targetCoverage)||.68,.45,.90);
  const targetPlate=Math.min(envelopeArea,Math.max(0,plot.area)*coverage),floors=Math.max(1,Number(site.floors)||1),gfa=targetPlate*floors;
  return {plotArea:plot.area,width,depth,front,rear,side,buildWidth,buildDepth,envelopeArea,coverage,targetPlate,gfa,openArea:Math.max(0,plot.area-targetPlate)};
};
BMH.siteFeasibility = (site=BMH.state?.project?.site||{}) => {
  const env=BMH.buildableEnvelope(site),h=BMH.state?.project?.household||{},children=Array.isArray(h.children)?h.children.length:0,relatives=Array.isArray(h.relatives)?h.relatives.length:0,people=2+children+relatives;
  const separate=(h.children||[]).filter(c=>c.room!=='Ngủ chung').length,bedrooms=1+separate+((children-separate)>0?1:0)+(relatives?1:0),bathrooms=Math.max(1,Math.ceil(people/4));
  const required=BMH.clamp(54+bedrooms*14+bathrooms*5+people*3,70,260),capacity=required>0?env.gfa/required:1;
  const p=BMH.regionProfile(site),risk=BMH.riskValue(p.flood)+BMH.riskValue(p.storm)+BMH.riskValue(p.heat)+BMH.riskValue(p.corrosion),road=Number(site.road)||0;
  const shapePenalty=String(site.shape||'').includes('Không đều')?8:String(site.shape||'').includes('thang')?4:0;
  const score=BMH.clamp(Math.round(92-Math.max(0,1-capacity)*42-Math.max(0,3.5-road)*6-Math.max(0,risk-6)*2.2-shapePenalty),45,98);
  const notes=[];
  if(capacity<.9)notes.push('Diện tích sàn mục tiêu đang thấp hơn nhu cầu công năng ước tính; cân nhắc tăng tầng, giảm phòng hoặc tối ưu diện tích.');
  else if(capacity>1.55)notes.push('Quỹ diện tích khá dư; có thể tăng sân, giếng trời, khoảng lùi hoặc giảm khối xây để cải thiện vi khí hậu.');
  else notes.push('Quỹ diện tích và nhu cầu gia đình đang ở vùng tương đối cân bằng để phát triển phương án.');
  if(road<3)notes.push('Đường tiếp cận hẹp có thể ảnh hưởng vận chuyển vật tư và tổ chức thi công.');
  if(BMH.riskValue(p.flood)>=3)notes.push('Rủi ro ngập cao: cần xác minh cao độ nền, thoát nước và vị trí thiết bị điện trước khi chốt thiết kế.');
  if(BMH.riskValue(p.storm)>=3)notes.push('Rủi ro gió bão cao: mặt đứng, mái và cửa cần được kỹ sư kiểm tra tải gió khi triển khai hồ sơ kỹ thuật.');
  return {score,people,bedrooms,bathrooms,requiredGFA:required,capacity,env,notes};
};
BMH.climatePackageMultiplier = level => ({basic:.72,recommended:1,robust:1.38}[level]||1);
BMH.resiliencePlan = (site=BMH.state?.project?.site||{}) => {
  const p=BMH.regionProfile(site),pack=BMH.state?.project?.materials?.climatePackage||'recommended',items=[];
  const add=(id,name,reason,weight)=>items.push({id,name,reason,weight});
  if(BMH.riskValue(p.flood)>=2)add('drain','Thoát nước & nâng cốt','Ưu tiên rãnh thu, độ dốc sân, chống trào và cao độ thiết bị nhạy nước.',1.2);
  if(BMH.riskValue(p.heat)>=2)add('heat','Chống nóng & che nắng','Tăng cách nhiệt mái, lam che hướng nắng gắt và lớp bao che giảm hấp thụ nhiệt.',1.0);
  if(BMH.riskValue(p.storm)>=2)add('storm','Gia cường gió mưa','Kiểm soát liên kết mái, cửa, kính và điểm hắt mưa ở mặt đứng.',1.05);
  if(BMH.riskValue(p.corrosion)>=2)add('corrosion','Chống ăn mòn','Ưu tiên phụ kiện, vít, sơn phủ và chi tiết kim loại phù hợp môi trường ẩm/hơi muối.',.75);
  if(!items.length)add('moisture','Kiểm soát ẩm & chống thấm','Duy trì giải pháp chống thấm, thông gió khu ướt và bảo trì định kỳ.',.7);
  const orient=BMH.orientationAnalysis(site);if(orient.sunPenalty>=9)add('shade','Lam che mặt tiền','Mặt tiền có tải nắng đáng kể; nên bổ sung lớp che nắng chủ động.',.65);
  return {level:pack,multiplier:BMH.climatePackageMultiplier(pack),items,orientation:orient};
};


BMH.DIRECTIONS = [
  ['Bắc',0,'north'],['Đông Bắc',45,'north-east'],['Đông',90,'east'],['Đông Nam',135,'south-east'],
  ['Nam',180,'south'],['Tây Nam',225,'south-west'],['Tây',270,'west'],['Tây Bắc',315,'north-west']
];
BMH.directionAngle = name => BMH.DIRECTIONS.find(x=>x[0]===name)?.[1] ?? 180;
BMH.angleDiff = (a,b) => {let d=Math.abs((a-b)%360);return d>180?360-d:d;};
BMH.windDirectionAngles = profile => {
  const t=String(profile?.wind||'').toLowerCase(), out=[];
  const add=(needle,ang)=>{if(t.includes(needle)&&!out.includes(ang))out.push(ang)};
  add('đông bắc',45); add('đông nam',135); add('tây nam',225); add('tây bắc',315); add('gió biển',90);
  return out.length?out:[135,225];
};
BMH.orientationAnalysis = (site=BMH.state?.project?.site||{}) => {
  const p=BMH.regionProfile(site), front=site.frontDirection||'Nam', ang=BMH.directionAngle(front), heat=BMH.riskValue(p.heat), storm=BMH.riskValue(p.storm);
  const westPenalty=Math.max(0,1-BMH.angleDiff(ang,270)/90), eastPenalty=Math.max(0,1-BMH.angleDiff(ang,90)/110);
  const sunPenalty=(westPenalty*18+eastPenalty*5)*Math.max(1,heat)/3;
  const winds=BMH.windDirectionAngles(p), windBest=Math.min(...winds.map(w=>BMH.angleDiff(ang,w))), windScore=BMH.clamp(Math.round(96-windBest*.32),48,96);
  const rainPenalty=storm>=3&&['Đông','Đông Bắc','Đông Nam'].includes(front)?8:0;
  const score=BMH.clamp(Math.round(92-sunPenalty-rainPenalty+Math.max(0,windScore-70)*.18),45,97);
  const heatLevel=sunPenalty>=14?'Cao':sunPenalty>=7?'Trung bình':'Thấp';
  const notes=[];
  if(westPenalty>.55&&heat>=2)notes.push('Mặt tiền có xu hướng nhận nắng Tây mạnh: ưu tiên lam sâu, ban công, cây xanh và lớp bao che chống nóng.');
  if(windScore>=78)notes.push('Hướng mặt tiền khá thuận với một hướng gió chủ đạo; nên tổ chức cửa đối lưu để tận dụng thông gió tự nhiên.');
  else notes.push('Hướng mặt tiền chưa trùng gió chủ đạo; tăng ô mở hai mặt hoặc dùng sân trong/giếng trời để hỗ trợ đối lưu.');
  if(storm>=3)notes.push('Khu vực có rủi ro gió bão cao: cần kiểm tra cửa, mái và liên kết mặt đứng theo hồ sơ kỹ thuật thực tế.');
  return {front,angle:ang,score,windScore,heatLevel,sunPenalty:Math.round(sunPenalty),windAngles:winds,notes};
};
BMH.climateMaterialGuide = (category,site=BMH.state?.project?.site||{}) => {
  const p=BMH.regionProfile(site), flood=BMH.riskValue(p.flood),heat=BMH.riskValue(p.heat),cor=BMH.riskValue(p.corrosion),storm=BMH.riskValue(p.storm);
  const guides={
    floor: flood>=2?'Ưu tiên bề mặt chống trượt, độ hút nước thấp và ron dễ vệ sinh ở khu ẩm/ngập.':'Ưu tiên độ bền bề mặt và hệ ron phù hợp khu sử dụng.',
    paint: heat>=3?'Kiểm tra hệ sơn ngoại thất chịu UV/nhiệt, chống kiềm và chống rêu mốc theo đúng nền tường.':'Kiểm tra hệ sơn phù hợp độ ẩm, nền tường và chu kỳ bảo trì.',
    door: cor>=3?'Vùng ăn mòn cao: xác minh hệ nhôm/phụ kiện, vít và lớp hoàn thiện phù hợp môi trường hơi muối.':storm>=3?'Vùng gió mạnh: kiểm tra hệ cửa, kính, phụ kiện và liên kết khung theo tải gió.':'Ưu tiên kín nước, kín khí và phụ kiện dễ bảo trì.',
    waterproof: flood>=2?'Ưu tiên hệ chống thấm có chi tiết chân tường, ban công, WC và khe tiếp giáp rõ ràng.':'Ưu tiên hệ chống thấm đồng bộ với nền và lớp hoàn thiện.',
    cement:'Đối chiếu cấp phối, điều kiện bảo dưỡng và môi trường sử dụng trước khi chốt.',
    steel: cor>=2?'Kiểm soát lớp bảo vệ bê tông và điều kiện ăn mòn; không thay thế thiết kế kết cấu.':'Chốt mác thép và bảo vệ cốt thép theo hồ sơ kết cấu.',
    mep: flood>=2?'Ưu tiên cao độ tủ điện, ổ cắm, bơm thoát và tuyến kỹ thuật tránh vùng ngập.':'Ưu tiên phân khu kỹ thuật, bảo trì và chống ẩm.',
    sanitary:'Ưu tiên thiết bị dễ bảo trì, phụ kiện thay thế sẵn có và thoát nước phù hợp.'
  };
  return guides[category]||'Đối chiếu thông số kỹ thuật thực tế trước khi chốt vật liệu.';
};
BMH.materialClimateScore = (site=BMH.state?.project?.site||{}, tier=BMH.state?.project?.materials?.tier||'standard') => {
  const p=BMH.regionProfile(site), o=BMH.orientationAnalysis(site), base={economy:68,standard:82,premium:91}[tier]||80,pack=BMH.state?.project?.materials?.climatePackage||'recommended';
  const risk=(BMH.riskValue(p.flood)+BMH.riskValue(p.storm)+BMH.riskValue(p.corrosion)+BMH.riskValue(p.heat)),packBonus={basic:-5,recommended:0,robust:7}[pack]||0;
  return BMH.clamp(Math.round(base-(risk-4)*1.5+(o.score-70)*.12+packBonus),50,98);
};

BMH.BANKS = [
  {id:'VCB',name:'Vietcombank',img:'assets/banks/vcb.jpg',intro:6.9,post:10.9,months:12,note:'Kịch bản tham khảo; cần đối chiếu báo giá tín dụng thực tế.'},
  {id:'BIDV',name:'BIDV',img:'assets/banks/bidv.jpg',intro:7.0,post:10.5,months:12,note:'Kịch bản tham khảo; mức thực tế thay đổi theo chương trình và hồ sơ.'},
  {id:'AGR',name:'Agribank',img:'assets/banks/agr.jpg',intro:6.5,post:10.0,months:12,note:'Kịch bản tham khảo; cần xác minh điều kiện áp dụng.'},
  {id:'TCB',name:'Techcombank',img:'assets/banks/tcb.jpg',intro:6.8,post:11.0,months:18,note:'Kịch bản tham khảo; không phải cam kết lãi suất.'},
  {id:'MB',name:'MB Bank',img:'assets/banks/mb.jpg',intro:7.2,post:10.8,months:12,note:'Kịch bản tham khảo; cần đối chiếu đề nghị tín dụng.'},
  {id:'ACB',name:'ACB',img:'assets/banks/acb.jpg',intro:7.5,post:11.2,months:12,note:'Kịch bản tham khảo; người dùng có thể chỉnh tay.'}
];

BMH.MATERIALS = {
  floor:[
    {id:'viglacera',name:'Gạch Viglacera',sub:'Porcelain 600×600',img:'assets/materials/tile-viglacera.jpg',premium:0,price:'320.000 đ/m²'},
    {id:'dongtam',name:'Gạch Đồng Tâm',sub:'Granite hoàn thiện',img:'assets/materials/tile-dongtam.jpg',premium:18000000,price:'350.000 đ/m²'},
    {id:'vietceramics',name:'Gạch Vietceramics',sub:'Dòng cao cấp',img:'assets/materials/tile-vietceramics.jpg',premium:62000000,price:'650.000 đ/m²'}
  ],
  paint:[
    {id:'dulux',name:'Dulux',sub:'Sơn hoàn thiện nội/ngoại thất',img:'assets/materials/paint-fallback.jpg',premium:0,price:'Theo quy cách & báo giá'},
    {id:'jotun',name:'Jotun',sub:'Hệ sơn cao cấp',img:'assets/materials/paint-fallback.jpg',premium:26000000,price:'Theo quy cách & báo giá'}
  ],
  door:[
    {id:'xingfa',name:'Nhôm kính Xingfa',sub:'Cửa & vách kính',img:'assets/materials/aluminium-fallback.jpg',premium:0,price:'Theo hệ nhôm/kính'},
    {id:'premium-door',name:'Hệ cửa cách âm nâng cấp',sub:'Kính hộp / phụ kiện nâng cấp',img:'assets/materials/aluminium-fallback.jpg',premium:42000000,price:'Cần báo giá thực tế'}
  ]
};
