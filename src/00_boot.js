const BMH = {
  VERSION: '3.7.0',
  STORAGE_KEY: 'bmh-v342-stable',
  LEGACY_STORAGE_KEYS: ['bmh-v23-visual'],
  DEV: ['localhost','127.0.0.1',''].includes(location.hostname),
  map: null,
  mapMarker: null,
  liveWeather: null,
  liveWeatherKey: '',
  drag: null,
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
