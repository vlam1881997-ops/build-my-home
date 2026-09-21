const BMH = {
  VERSION: '3.2.0',
  STORAGE_KEY: 'bmh-v23-visual',
  DEV: ['localhost','127.0.0.1',''].includes(location.hostname),
  map: null,
  mapMarker: null,
  drag: null,
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
  'Bình Dương': {lat:11.160, lng:106.650, zoom:12, defaultDistrict:'Thủ Dầu Một', districts:[['Thủ Dầu Một',11.160,106.650],['Dĩ An',10.9060,106.7690],['Thuận An',10.9320,106.7110],['Bến Cát',11.1510,106.5940]], climate:'Nhiệt đới gió mùa', flood:'Trung bình', storm:'Thấp - Trung bình', labor:'350.000 – 500.000 đ/ngày'},
  'TP. Hồ Chí Minh': {lat:10.7769,lng:106.7009,zoom:12,defaultDistrict:'Quận 1',districts:[['Quận 1',10.7769,106.7009],['TP Thủ Đức',10.8494,106.7537],['Quận 7',10.7340,106.7216],['Bình Thạnh',10.8106,106.7091]],climate:'Nhiệt đới gió mùa',flood:'Trung bình - Cao',storm:'Thấp',labor:'400.000 – 600.000 đ/ngày'},
  'Đà Nẵng': {lat:16.0544,lng:108.2022,zoom:12,defaultDistrict:'Sơn Trà',districts:[['Sơn Trà',16.1060,108.2520],['Hải Châu',16.0600,108.2210],['Ngũ Hành Sơn',16.0180,108.2600],['Liên Chiểu',16.0820,108.1500]],climate:'Nhiệt đới gió mùa',flood:'Trung bình',storm:'Trung bình - Cao',labor:'350.000 – 500.000 đ/ngày'},
  'Hà Nội': {lat:21.0278,lng:105.8342,zoom:12,defaultDistrict:'Ba Đình',districts:[['Ba Đình',21.0338,105.8142],['Hoàn Kiếm',21.0288,105.8522],['Cầu Giấy',21.0362,105.7906],['Hà Đông',20.9712,105.7788]],climate:'Cận nhiệt đới ẩm',flood:'Trung bình',storm:'Trung bình',labor:'400.000 – 600.000 đ/ngày'},
  'Đồng Nai': {lat:10.9574,lng:106.8426,zoom:11,defaultDistrict:'Biên Hòa',districts:[['Biên Hòa',10.9574,106.8426],['Long Thành',10.7899,107.0551],['Nhơn Trạch',10.7245,106.8835],['Trảng Bom',10.9537,107.0054]],climate:'Nhiệt đới gió mùa',flood:'Trung bình',storm:'Thấp - Trung bình',labor:'350.000 – 500.000 đ/ngày'},
  'Long An': {lat:10.6956,lng:106.2431,zoom:11,defaultDistrict:'Tân An',districts:[['Tân An',10.5359,106.4137],['Bến Lức',10.6408,106.4937],['Đức Hòa',10.8772,106.3999],['Cần Giuộc',10.6084,106.6715]],climate:'Nhiệt đới gió mùa',flood:'Trung bình - Cao',storm:'Thấp',labor:'330.000 – 480.000 đ/ngày'}
};
BMH.regionPoint = (province,district) => {
  const r=BMH.REGIONS[province]||BMH.REGIONS['Bình Dương'];
  const d=(r.districts||[]).find(x=>x[0]===district);
  return d?{lat:d[1],lng:d[2],district:d[0],zoom:r.zoom||12}:{lat:r.lat,lng:r.lng,district:r.defaultDistrict||district||province,zoom:r.zoom||12};
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
