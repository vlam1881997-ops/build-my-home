/* Build My Home Official V3.3 UI + Functional Core
 * One state controller · one navigation controller · one planner controller · one runtime bundle.
 * Generated from src/*.js. Do not patch public/app.js directly.
 */
(()=>{
'use strict';

/* ---- 00_boot.js ---- */
const BMH = {
  VERSION: '3.3.0',
  STORAGE_KEY: 'bmh-v23-visual',
  DEV: ['localhost','127.0.0.1',''].includes(location.hostname),
  map: null,
  mapMarker: null,
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


/* ---- 10_state.js ---- */
BMH.defaultState = () => ({
  version: BMH.VERSION,
  ui: {step:1, sidebarCollapsed:false, designTab:'planner', materialCategory:'floor', planner:{floor:0,selected:'r1',snap:.2,zoom:1,tool:'select',mode:'technical',showFurniture:true,showDimensions:true,showFeng:true}, sceneMode:'reference', sceneTheme:'day', sceneFocus:'all', sceneExploded:false},
  access: {paid:false, source:'none', paidAt:null},
  project: {
    name:'Nhà của mình', source:'suggest', style:'Hiện đại',
    site:{country:'Việt Nam',province:'Bình Dương',district:'Thủ Dầu Một',address:'',lat:11.160,lng:106.650,width:5,depth:20,floors:2,road:4,soil:'Đất thịt đồng bằng'},
    finance:{cash:800000000,income:25000000,living:8000000,reserve:100000000,existingDebt:0,loan:500000000,years:15,bank:'VCB',introRate:6.9,postRate:10.9,promoMonths:12},
    household:{ownerBirth:1988,ownerGender:'Nam',partnerEnabled:true,partnerBirth:1990,partnerGender:'Nữ',children:[{id:'c1',name:'Con 1',birth:2012,room:'Riêng'}],relatives:[{id:'p1',name:'Ba',birth:1962,mobility:'Hạn chế nhẹ'},{id:'p2',name:'Mẹ',birth:1964,mobility:'Bình thường'}]},
    plan:{rooms:[
      {id:'r1',floor:0,name:'Phòng khách',type:'living',x:0,y:0,w:5,h:4},
      {id:'r2',floor:0,name:'Bếp + ăn',type:'kitchen',x:0,y:4,w:5,h:4},
      {id:'r3',floor:0,name:'Phòng ông bà',type:'bed',x:0,y:8,w:3.2,h:4},
      {id:'r4',floor:0,name:'WC',type:'bath',x:3.2,y:8,w:1.8,h:2},
      {id:'r5',floor:0,name:'Cầu thang',type:'stairs',x:3.2,y:10,w:1.8,h:4},
      {id:'r6',floor:1,name:'Phòng ngủ chính',type:'bed',x:0,y:0,w:5,h:4},
      {id:'r7',floor:1,name:'Phòng con',type:'bed',x:0,y:4,w:3.2,h:4},
      {id:'r8',floor:1,name:'WC tầng 2',type:'bath',x:3.2,y:4,w:1.8,h:2},
      {id:'r9',floor:1,name:'Cầu thang',type:'stairs',x:3.2,y:10,w:1.8,h:4}
    ], openings:[
      {id:'o1',floor:0,roomId:'r1',kind:'door',side:'south',offset:.5,width:.9},
      {id:'o2',floor:0,roomId:'r1',kind:'window',side:'east',offset:.35,width:1.6},
      {id:'o3',floor:0,roomId:'r3',kind:'door',side:'east',offset:.25,width:.8},
      {id:'o4',floor:1,roomId:'r6',kind:'window',side:'east',offset:.4,width:1.6}
    ]},
    materials:{tier:'standard',choices:{floor:'viglacera',paint:'dulux',door:'xingfa'},lastDelta:0},
    wearYear:0,
    checklist:{pipe114:false,acWire:false,pressure:false,internet:false,elcb:false}
  },
  meta:{savedAt:null}
});

BMH.mergeState = (base, incoming) => {
  if(!incoming || typeof incoming!=='object') return base;
  const out=structuredClone(base);
  const merge=(a,b)=>{for(const [k,v] of Object.entries(b||{})){if(v && typeof v==='object' && !Array.isArray(v) && a[k] && typeof a[k]==='object' && !Array.isArray(a[k])) merge(a[k],v); else a[k]=v;}return a;};
  return merge(out,incoming);
};
BMH.loadState = () => {
  const base=BMH.defaultState();
  try { const raw=localStorage.getItem(BMH.STORAGE_KEY); if(raw) return BMH.mergeState(base,JSON.parse(raw)); } catch(e){}
  return base;
};
BMH.state = BMH.loadState();
BMH.normalizeState = () => {
  const s=BMH.state.project.site, r=BMH.REGIONS[s.province]||BMH.REGIONS['Bình Dương'];
  const valid=(r.districts||[]).some(d=>d[0]===s.district);
  if(!valid){const pt=BMH.regionPoint(s.province,r.defaultDistrict);Object.assign(s,{district:pt.district,lat:pt.lat,lng:pt.lng});}
  const ui=BMH.state.ui.planner;
  if(!ui.selected || !BMH.state.project.plan.rooms.some(x=>x.id===ui.selected))ui.selected=BMH.state.project.plan.rooms[0]?.id||null;
  if(!['select','door','window'].includes(ui.tool))ui.tool='select';
  ui.zoom=BMH.clamp(Number(ui.zoom)||1,.75,2.5);
  if(typeof BMH.state.ui.sceneExploded!=='boolean')BMH.state.ui.sceneExploded=false;
};
BMH.normalizeState();
BMH.save = () => { BMH.state.version=BMH.VERSION; BMH.state.meta.savedAt=new Date().toISOString(); try{localStorage.setItem(BMH.STORAGE_KEY,JSON.stringify(BMH.state));}catch(e){BMH.toast('Không thể lưu cục bộ. Hãy xuất bản sao dự án.');} };
BMH.get = path => path.split('.').reduce((o,k)=>o?.[k],BMH.state);
BMH.set = (path,value,{render=true}={}) => { const keys=path.split('.'); let o=BMH.state; for(let i=0;i<keys.length-1;i++){if(!o[keys[i]]||typeof o[keys[i]]!=='object')o[keys[i]]={};o=o[keys[i]];} o[keys.at(-1)]=value; BMH.save(); if(render) BMH.render(); };
BMH.isUnlocked = () => BMH.state.access.paid===true;


/* ---- 20_calc.js ---- */
BMH.monthlyPayment = (principal, annualRatePct, months) => {
  principal=Number(principal)||0; months=Math.max(1,Number(months)||1); const r=(Number(annualRatePct)||0)/100/12;
  return r===0?principal/months:principal*r/(1-Math.pow(1+r,-months));
};
BMH.loanSchedule = (finance=BMH.state.project.finance) => {
  const months=finance.years*12, rows=[]; let balance=finance.loan;
  for(let m=1;m<=months;m++){
    const annual=m<=finance.promoMonths?finance.introRate:finance.postRate;
    const remain=months-m+1; const payment=BMH.monthlyPayment(balance,annual,remain); const interest=balance*(annual/100/12); const principal=Math.min(balance,Math.max(0,payment-interest));
    rows.push({month:m,annual,payment,principal,interest,balance:Math.max(0,balance-principal)}); balance=Math.max(0,balance-principal);
  }
  return rows;
};
BMH.financeSummary = (finance=BMH.state.project.finance) => {
  const schedule=BMH.loanSchedule(finance); const first=schedule[0]?.payment||0; const post=schedule[Math.min(finance.promoMonths,schedule.length-1)]?.payment||first; const peak=Math.max(...schedule.map(r=>r.payment),0)+finance.existingDebt;
  const dti=finance.income?peak/finance.income:0; const remainder=finance.income-finance.living-peak; const available=finance.cash-finance.reserve+finance.loan;
  return {first,post,peak,dti,remainder,available,schedule};
};
BMH.planArea = () => BMH.state.project.plan.rooms.reduce((s,r)=>s+r.w*r.h,0);
BMH.materialPremium = (choices=BMH.state.project.materials.choices) => Object.entries(choices).reduce((s,[cat,id])=>s+(BMH.MATERIALS[cat]?.find(x=>x.id===id)?.premium||0),0);
BMH.estimate = () => {
  const p=BMH.state.project, area=Math.max(BMH.planArea(),p.site.width*p.site.depth*Math.min(1,p.site.floors*.72));
  const tierMul={economy:.9,standard:1,premium:1.22}[p.materials.tier]||1;
  const shell=Math.round(area*3600000); const finish=Math.round(area*2350000*tierMul)+BMH.materialPremium(); const transport=Math.round((shell+finish)*(p.site.road<3?0.12:p.site.road<5?0.05:0.02)); const prep=Math.round(area*280000); const subtotal=shell+finish+transport+prep; const contingency=Math.round(subtotal*.10); const total=subtotal+contingency;
  return {area,shell,finish,transport,prep,contingency,total,budget:BMH.financeSummary().available,gap:BMH.financeSummary().available-total};
};
BMH.kua = (birth,gender='Nam') => {
  let y=String(Math.round(Number(birth)||0)); if(y.length!==4) return null; let sum=[...y].reduce((s,d)=>s+Number(d),0); while(sum>9)sum=[...String(sum)].reduce((s,d)=>s+Number(d),0);
  let k=gender==='Nữ'?(Number(birth)>=2000?6:5)+sum:(Number(birth)>=2000?9:10)-sum; while(k>9)k-=9; while(k<=0)k+=9; if(k===5)k=gender==='Nữ'?8:2;
  const east=[1,3,4,9], dirs=east.includes(k)?['Đông Nam','Đông','Nam','Bắc']:['Tây Nam','Tây','Tây Bắc','Đông Bắc'];
  return {number:k,group:east.includes(k)?'Đông tứ mệnh':'Tây tứ mệnh',dirs};
};
BMH.householdAdvice = () => {
  const h=BMH.state.project.household, out=[];
  if(h.relatives.some(r=>r.mobility!=='Bình thường')) out.push('Ưu tiên phòng ngủ người lớn tuổi ở tầng trệt, gần WC và lối ra vào, hạn chế bậc cấp.');
  else if(h.relatives.length) out.push('Nên dành lối đi ngắn, chống trượt và WC thuận tiện cho ba mẹ/người thân.');
  const own=BMH.kua(h.ownerBirth,h.ownerGender); const childCount=h.children.length;
  if(childCount) out.push(`${childCount} con: bố trí khu học tập có ánh sáng tự nhiên; hướng bàn/giường phong thủy chỉ dùng như tham khảo sau công năng.`);
  if(own) out.push(`Gia chủ thuộc ${own.group}; các hướng tham khảo: ${own.dirs.join(', ')}.`);
  return out;
};

BMH.designReview = () => {
  const e=BMH.estimate(), issues=BMH.plannerIssues?BMH.plannerIssues():[], p=BMH.state.project;
  const penalty=issues.reduce((s,i)=>s+(i.sev==='error'?10:i.sev==='warn'?5:2),0);
  const functionScore=BMH.clamp(96-penalty,45,98);
  const budgetRatio=e.budget>0?e.total/e.budget:1.4;
  const budgetScore=BMH.clamp(Math.round(94-Math.max(0,budgetRatio-.82)*85),42,96);
  const reg=BMH.REGIONS[p.site.province]||{};
  const climatePenalty=(String(reg.flood||'').includes('Cao')?9:String(reg.flood||'').includes('Trung bình')?4:1)+(String(reg.storm||'').includes('Cao')?8:String(reg.storm||'').includes('Trung bình')?4:1);
  const climateScore=BMH.clamp(92-climatePenalty,58,95);
  const materialScore={economy:72,standard:84,premium:93}[p.materials.tier]||82;
  const fengScore=BMH.kua(p.household.ownerBirth,p.household.ownerGender)?78:70;
  const durability=BMH.clamp(materialScore+(p.site.soil.includes('cứng')?3:p.site.soil.includes('trũng')?-6:0),55,96);
  const overall=Math.round(budgetScore*.20+functionScore*.25+climateScore*.15+materialScore*.15+fengScore*.10+durability*.15);
  return {overall,budget:budgetScore,function:functionScore,climate:climateScore,material:materialScore,feng:fengScore,durability,issues};
};


/* ---- 30_planner.js ---- */
BMH.roomColor = type => ({living:'#f4f7f1',kitchen:'#fff9ef',bed:'#f4f7fb',bath:'#f0f7f7',stairs:'#f5f2fa',garage:'#f6f3ee',corridor:'#fafaf7',balcony:'#f1f8f0'}[type]||'#f7f8f5');
BMH.floorRooms = (floor=BMH.state.ui.planner.floor) => BMH.state.project.plan.rooms.filter(r=>r.floor===floor);
BMH.selectedRoom = () => BMH.state.project.plan.rooms.find(r=>r.id===BMH.state.ui.planner.selected)||null;
BMH.roomsOverlap = (a,b) => a.floor===b.floor && a.id!==b.id && a.x < b.x+b.w-.001 && a.x+a.w > b.x+.001 && a.y < b.y+b.h-.001 && a.y+a.h > b.y+.001;
BMH.roomValid = room => room.x>=0 && room.y>=0 && room.x+room.w<=BMH.state.project.site.width+.001 && room.y+room.h<=BMH.state.project.site.depth+.001 && !BMH.state.project.plan.rooms.some(r=>BMH.roomsOverlap(room,r));

BMH.plannerIssues = () => {
  const p=BMH.state.project, issues=[];
  for(const r of p.plan.rooms){
    if(r.x<0||r.y<0||r.x+r.w>p.site.width+.001||r.y+r.h>p.site.depth+.001)issues.push({sev:'error',text:`${r.name} vượt ranh khu đất.`});
    if(p.plan.rooms.some(o=>BMH.roomsOverlap(r,o)))issues.push({sev:'error',text:`${r.name} đang chồng lên không gian khác.`});
    const ro=p.plan.openings.filter(o=>o.roomId===r.id);
    if(!['corridor','balcony'].includes(r.type) && !ro.some(o=>o.kind==='door'))issues.push({sev:'warn',text:`${r.name} chưa có cửa đi trên mặt bằng.`});
    if(r.type==='bed' && !ro.some(o=>o.kind==='window'))issues.push({sev:'info',text:`${r.name} chưa có cửa sổ/ô thoáng trên mặt bằng.`});
    if(r.type==='bath' && !ro.some(o=>o.kind==='window'))issues.push({sev:'info',text:`${r.name} nên có ô thoáng hoặc giải pháp hút mùi cưỡng bức.`});
    if(r.type==='bed' && Math.min(r.w,r.h)<2.7)issues.push({sev:'warn',text:`${r.name} có cạnh nhỏ hơn 2,7m; nên kiểm tra lại khả năng bố trí giường và lối đi.`});
    if(r.type==='bath' && Math.min(r.w,r.h)<1.2)issues.push({sev:'warn',text:`${r.name} khá hẹp; cần kiểm tra khoảng thao tác thiết bị vệ sinh.`});
  }
  for(let f=1;f<p.site.floors;f++){
    const prev=p.plan.rooms.find(r=>r.floor===f-1&&r.type==='stairs'), cur=p.plan.rooms.find(r=>r.floor===f&&r.type==='stairs');
    if(prev&&cur && (Math.abs(prev.x-cur.x)>.5||Math.abs(prev.y-cur.y)>.5)) issues.push({sev:'warn',text:`Cầu thang tầng ${f} và tầng ${f+1} lệch nhau quá 0,5m.`});
  }
  const h=p.household;
  if(h.relatives.length && !p.plan.rooms.some(r=>r.floor===0&&r.type==='bed'))issues.push({sev:'warn',text:'Có ba/mẹ/người thân ở cùng nhưng tầng trệt chưa có phòng ngủ.'});
  const requested=h.children.filter(c=>c.room==='Riêng').length;
  const childBeds=p.plan.rooms.filter(r=>r.type==='bed'&&!/chính|ông bà/i.test(r.name)).length;
  if(childBeds<requested)issues.push({sev:'info',text:`Gia đình yêu cầu ${requested} phòng riêng cho con; mặt bằng hiện có ${childBeds} phòng phù hợp.`});
  if(!p.plan.rooms.some(r=>r.type==='bath'))issues.push({sev:'warn',text:'Chưa có WC trong mặt bằng.'});
  return issues.filter((x,i,a)=>a.findIndex(y=>y.text===x.text)===i);
};

BMH.furnitureSvg = r => {
  const x=r.x,y=r.y,w=r.w,h=r.h,c='#8a938d',sw=.035;
  if(r.type==='bed') return `<g class="furniture" stroke="${c}" fill="none" stroke-width="${sw}"><rect x="${x+w*.18}" y="${y+h*.18}" width="${w*.64}" height="${h*.58}" rx=".06"/><line x1="${x+w*.18}" y1="${y+h*.34}" x2="${x+w*.82}" y2="${y+h*.34}"/><rect x="${x+w*.24}" y="${y+h*.20}" width="${w*.20}" height="${h*.12}" rx=".03"/><rect x="${x+w*.56}" y="${y+h*.20}" width="${w*.20}" height="${h*.12}" rx=".03"/><rect x="${x+w*.06}" y="${y+h*.12}" width="${w*.08}" height="${h*.70}"/></g>`;
  if(r.type==='living') return `<g class="furniture" stroke="${c}" fill="none" stroke-width="${sw}"><path d="M${x+w*.10} ${y+h*.18}h${w*.55}v${h*.18}h-${w*.37}v${h*.18}h-${w*.18}z"/><rect x="${x+w*.35}" y="${y+h*.58}" width="${w*.30}" height="${h*.18}" rx=".06"/><line x1="${x+w*.78}" y1="${y+h*.22}" x2="${x+w*.78}" y2="${y+h*.62}"/></g>`;
  if(r.type==='kitchen') return `<g class="furniture" stroke="${c}" fill="none" stroke-width="${sw}"><path d="M${x+w*.06} ${y+h*.10}h${w*.88}v${h*.14}h-${w*.70}v${h*.22}h-${w*.18}z"/><circle cx="${x+w*.28}" cy="${y+h*.17}" r="${Math.min(w,h)*.04}"/><rect x="${x+w*.34}" y="${y+h*.54}" width="${w*.32}" height="${h*.22}" rx=".04"/><circle cx="${x+w*.42}" cy="${y+h*.65}" r="${Math.min(w,h)*.025}"/><circle cx="${x+w*.58}" cy="${y+h*.65}" r="${Math.min(w,h)*.025}"/></g>`;
  if(r.type==='bath') return `<g class="furniture" stroke="${c}" fill="none" stroke-width="${sw}"><ellipse cx="${x+w*.28}" cy="${y+h*.46}" rx="${w*.12}" ry="${h*.18}"/><rect x="${x+w*.55}" y="${y+h*.16}" width="${w*.25}" height="${h*.22}" rx=".04"/><path d="M${x+w*.58} ${y+h*.60}h${w*.28}v${h*.26}h-${w*.28}z"/><line x1="${x+w*.58}" y1="${y+h*.60}" x2="${x+w*.86}" y2="${y+h*.86}"/><line x1="${x+w*.86}" y1="${y+h*.60}" x2="${x+w*.58}" y2="${y+h*.86}"/></g>`;
  if(r.type==='stairs') return `<g class="furniture stairs-symbol" stroke="${c}" fill="none" stroke-width="${sw}">${Array.from({length:10},(_,i)=>`<line x1="${x+w*.14}" y1="${y+h*(.10+i*.078)}" x2="${x+w*.86}" y2="${y+h*(.10+i*.078)}"/>`).join('')}<path d="M${x+w*.5} ${y+h*.82}V${y+h*.18}m0 0l-.10 .16m.10-.16l.10 .16"/><text x="${x+w*.55}" y="${y+h*.20}">UP</text></g>`;
  if(r.type==='garage') return `<g class="furniture" stroke="${c}" fill="none" stroke-width="${sw}"><rect x="${x+w*.22}" y="${y+h*.16}" width="${w*.56}" height="${h*.68}" rx=".28"/><line x1="${x+w*.30}" y1="${y+h*.35}" x2="${x+w*.70}" y2="${y+h*.35}"/><circle cx="${x+w*.28}" cy="${y+h*.25}" r=".07"/><circle cx="${x+w*.72}" cy="${y+h*.25}" r=".07"/><circle cx="${x+w*.28}" cy="${y+h*.75}" r=".07"/><circle cx="${x+w*.72}" cy="${y+h*.75}" r=".07"/></g>`;
  return '';
};

BMH.openingCode = o => {
  const list=BMH.state.project.plan.openings.filter(x=>x.floor===o.floor&&x.kind===o.kind);
  return `${o.kind==='door'?'D':'W'}${Math.max(1,list.findIndex(x=>x.id===o.id)+1)}`;
};

BMH.openingSvg = o => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===o.roomId); if(!r)return'';
  const w=Math.min(o.width||.9, o.side==='north'||o.side==='south'?r.w:r.h), off=BMH.clamp(o.offset??.3,0,1), code=BMH.openingCode(o);
  let x,y; if(o.side==='north'||o.side==='south'){x=r.x+(r.w-w)*off; y=o.side==='north'?r.y:r.y+r.h;} else {y=r.y+(r.h-w)*off; x=o.side==='west'?r.x:r.x+r.w;}
  const tag=(tx,ty)=>`<g class="opening-tag"><rect x="${tx-.18}" y="${ty-.13}" width=".36" height=".26" rx=".04"/><text x="${tx}" y="${ty+.045}">${code}</text></g>`;
  if(o.kind==='window'){
    if(o.side==='north'||o.side==='south') return `<g class="opening window"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x+w}" y2="${y}"/><line x1="${x}" y1="${y-.06}" x2="${x+w}" y2="${y-.06}"/><line x1="${x}" y1="${y+.06}" x2="${x+w}" y2="${y+.06}"/>${tag(x+w/2,y+(o.side==='north'?-.18:.18))}</g>`;
    return `<g class="opening window"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x}" y2="${y+w}"/><line x1="${x-.06}" y1="${y}" x2="${x-.06}" y2="${y+w}"/><line x1="${x+.06}" y1="${y}" x2="${x+.06}" y2="${y+w}"/>${tag(x+(o.side==='west'?-.18:.18),y+w/2)}</g>`;
  }
  const rr=Math.min(.9,w);
  if(o.side==='north')return `<g class="opening door"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x+rr}" y2="${y}"/><line class="door-leaf" x1="${x}" y1="${y}" x2="${x}" y2="${y+rr}"/><path d="M${x+rr} ${y} A${rr} ${rr} 0 0 0 ${x} ${y+rr}"/>${tag(x+rr/2,y-.20)}</g>`;
  if(o.side==='south')return `<g class="opening door"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x+rr}" y2="${y}"/><line class="door-leaf" x1="${x}" y1="${y}" x2="${x}" y2="${y-rr}"/><path d="M${x+rr} ${y} A${rr} ${rr} 0 0 1 ${x} ${y-rr}"/>${tag(x+rr/2,y+.20)}</g>`;
  if(o.side==='west')return `<g class="opening door"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x}" y2="${y+rr}"/><line class="door-leaf" x1="${x}" y1="${y}" x2="${x+rr}" y2="${y}"/><path d="M${x} ${y+rr} A${rr} ${rr} 0 0 1 ${x+rr} ${y}"/>${tag(x-.20,y+rr/2)}</g>`;
  return `<g class="opening door"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x}" y2="${y+rr}"/><line class="door-leaf" x1="${x}" y1="${y}" x2="${x-rr}" y2="${y}"/><path d="M${x} ${y+rr} A${rr} ${rr} 0 0 0 ${x-rr} ${y}"/>${tag(x+.20,y+rr/2)}</g>`;
};

BMH.wallSegments = (floor=BMH.state.ui.planner.floor) => {
  const rooms=BMH.floorRooms(floor), edges=[];
  const add=(o,c,a,b)=>{if(b>a+.001)edges.push({o,c:+c.toFixed(4),a:+a.toFixed(4),b:+b.toFixed(4)});};
  rooms.forEach(r=>{add('h',r.y,r.x,r.x+r.w);add('h',r.y+r.h,r.x,r.x+r.w);add('v',r.x,r.y,r.y+r.h);add('v',r.x+r.w,r.y,r.y+r.h);});
  const groups=new Map(); edges.forEach(e=>{const k=`${e.o}:${e.c}`; if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e);});
  const out=[];
  for(const es of groups.values()){
    const cuts=[...new Set(es.flatMap(e=>[e.a,e.b]))].sort((a,b)=>a-b);
    for(let i=0;i<cuts.length-1;i++){
      const a=cuts[i],b=cuts[i+1],mid=(a+b)/2,count=es.filter(e=>e.a<=mid+.0001&&e.b>=mid-.0001).length;
      if(count)out.push({o:es[0].o,c:es[0].c,a,b,count});
    }
  }
  return out;
};

BMH.archWallsSvg = floor => BMH.wallSegments(floor).map(s=>s.o==='h'
  ? `<line class="arch-wall ${s.count>1?'internal':'external'}" x1="${s.a}" y1="${s.c}" x2="${s.b}" y2="${s.c}"/>`
  : `<line class="arch-wall ${s.count>1?'internal':'external'}" x1="${s.c}" y1="${s.a}" x2="${s.c}" y2="${s.b}"/>`).join('');

BMH.dimensionChainSvg = (floor,Hview) => {
  const rooms=BMH.floorRooms(floor),W=BMH.state.project.site.width;
  const xs=[0,...rooms.flatMap(r=>[r.x,r.x+r.w]),W].filter(x=>x>=0&&x<=W).map(x=>+x.toFixed(3));
  const ys=[0,...rooms.flatMap(r=>[r.y,r.y+r.h]),Hview].filter(y=>y>=0&&y<=Hview).map(y=>+y.toFixed(3));
  const ux=[...new Set(xs)].sort((a,b)=>a-b),uy=[...new Set(ys)].sort((a,b)=>a-b);
  const chainX=ux.slice(0,-1).map((x,i)=>{const x2=ux[i+1],d=x2-x;return `<g class="dim-seg"><line x1="${x}" y1="-1.25" x2="${x2}" y2="-1.25"/><line x1="${x}" y1="-1.36" x2="${x}" y2="-1.13"/><line x1="${x2}" y1="-1.36" x2="${x2}" y2="-1.13"/><text x="${(x+x2)/2}" y="-1.38">${BMH.num(d,2)}</text></g>`}).join('');
  const chainY=uy.slice(0,-1).map((y,i)=>{const y2=uy[i+1],d=y2-y;return `<g class="dim-seg"><line x1="-1.25" y1="${y}" x2="-1.25" y2="${y2}"/><line x1="-1.36" y1="${y}" x2="-1.13" y2="${y}"/><line x1="-1.36" y1="${y2}" x2="-1.13" y2="${y2}"/><text x="-1.42" y="${(y+y2)/2}" transform="rotate(-90 -1.42 ${(y+y2)/2})">${BMH.num(d,2)}</text></g>`}).join('');
  return `<g class="dimension-chain">${chainX}${chainY}<g class="overall-dim"><line x1="0" y1="-1.72" x2="${W}" y2="-1.72"/><line x1="0" y1="-1.84" x2="0" y2="-1.60"/><line x1="${W}" y1="-1.84" x2="${W}" y2="-1.60"/><text x="${W/2}" y="-1.88">${BMH.num(W,2)} m</text><line x1="-1.72" y1="0" x2="-1.72" y2="${Hview}"/><line x1="-1.84" y1="0" x2="-1.60" y2="0"/><line x1="-1.84" y1="${Hview}" x2="-1.60" y2="${Hview}"/><text x="-1.91" y="${Hview/2}" transform="rotate(-90 -1.91 ${Hview/2})">${BMH.num(Hview,2)} m</text></g></g>`;
};


BMH.planSnapshot = () => structuredClone(BMH.state.project.plan);
BMH.pushPlanHistory = () => {
  BMH.planHistory.undo.push(BMH.planSnapshot());
  if(BMH.planHistory.undo.length>30)BMH.planHistory.undo.shift();
  BMH.planHistory.redo.length=0;
};
BMH.undoPlan = () => {
  const snap=BMH.planHistory.undo.pop(); if(!snap)return BMH.toast('Chưa có thao tác để hoàn tác.');
  BMH.planHistory.redo.push(BMH.planSnapshot()); BMH.state.project.plan=structuredClone(snap); BMH.normalizeState(); BMH.save(); BMH.render();
};
BMH.redoPlan = () => {
  const snap=BMH.planHistory.redo.pop(); if(!snap)return BMH.toast('Chưa có thao tác để làm lại.');
  BMH.planHistory.undo.push(BMH.planSnapshot()); BMH.state.project.plan=structuredClone(snap); BMH.normalizeState(); BMH.save(); BMH.render();
};
BMH.layoutValid = rooms => {
  const site=BMH.state.project.site,min=.6;
  for(const r of rooms){if(r.w<min||r.h<min||r.x<-.001||r.y<-.001||r.x+r.w>site.width+.001||r.y+r.h>site.depth+.001)return false;}
  for(let i=0;i<rooms.length;i++)for(let j=i+1;j<rooms.length;j++){const a=rooms[i],b=rooms[j];if(a.floor!==b.floor)continue;if(a.x<b.x+b.w-.001&&a.x+a.w>b.x+.001&&a.y<b.y+b.h-.001&&a.y+a.h>b.y+.001)return false;}
  return true;
};
BMH.sharedWallNeighbors = (rooms,room,side) => {
  const eps=.01, overlap=(a1,a2,b1,b2)=>Math.min(a2,b2)-Math.max(a1,b1)>.15;
  return rooms.filter(o=>o.id!==room.id&&o.floor===room.floor&&((side==='east'&&Math.abs(o.x-(room.x+room.w))<eps&&overlap(o.y,o.y+o.h,room.y,room.y+room.h))||(side==='west'&&Math.abs(o.x+o.w-room.x)<eps&&overlap(o.y,o.y+o.h,room.y,room.y+room.h))||(side==='south'&&Math.abs(o.y-(room.y+room.h))<eps&&overlap(o.x,o.x+o.w,room.x,room.x+room.w))||(side==='north'&&Math.abs(o.y+o.h-room.y)<eps&&overlap(o.x,o.x+o.w,room.x,room.x+room.w))));
};
BMH.edgeMoveCandidate = (originalRooms,id,side,delta) => {
  const rooms=structuredClone(originalRooms),r=rooms.find(x=>x.id===id); if(!r)return null;
  const ns=BMH.sharedWallNeighbors(rooms,r,side);
  if(side==='east'){r.w+=delta;ns.forEach(n=>{n.x+=delta;n.w-=delta;});}
  if(side==='west'){r.x+=delta;r.w-=delta;ns.forEach(n=>{n.w+=delta;});}
  if(side==='south'){r.h+=delta;ns.forEach(n=>{n.y+=delta;n.h-=delta;});}
  if(side==='north'){r.y+=delta;r.h-=delta;ns.forEach(n=>{n.h+=delta;});}
  return BMH.layoutValid(rooms)?rooms:null;
};
BMH.svgPoint = (e,svg) => {const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return {x:vb.x+(e.clientX-r.left)*vb.width/r.width,y:vb.y+(e.clientY-r.top)*vb.height/r.height};};
BMH.openingFits = (candidate,ignoreId=null) => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===candidate.roomId);if(!r)return false;
  const len=(candidate.side==='north'||candidate.side==='south')?r.w:r.h,w=Number(candidate.width)||0;if(w<.5||w>len-.08)return false;
  const start=(len-w)*BMH.clamp(Number(candidate.offset)||0,0,1),end=start+w;
  return !BMH.state.project.plan.openings.some(o=>o.id!==ignoreId&&o.roomId===candidate.roomId&&o.side===candidate.side&&(()=>{const ow=Number(o.width)||0,os=(len-ow)*BMH.clamp(Number(o.offset)||0,0,1),oe=os+ow;return start<oe+.08&&end>os-.08;})());
};
BMH.placeOpeningAt = (kind,roomId,side,point) => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===roomId);if(!r)return;const width=kind==='door'?.9:1.4;let offset=.5;
  if(side==='north'||side==='south'){const span=Math.max(.01,r.w-width);offset=BMH.clamp((point.x-r.x-width/2)/span,0,1);}else{const span=Math.max(.01,r.h-width);offset=BMH.clamp((point.y-r.y-width/2)/span,0,1);}
  const candidate={id:BMH.uid('o'),floor:r.floor,roomId:r.id,kind,side,offset:+offset.toFixed(3),width};if(!BMH.openingFits(candidate))return BMH.toast('Vị trí này không đủ khoảng trống hoặc đang trùng một ô mở khác.');
  BMH.pushPlanHistory();BMH.state.project.plan.openings.push(candidate);BMH.state.ui.planner.selected=r.id;BMH.save();BMH.render();BMH.toast(`${kind==='door'?'Cửa đi':'Cửa sổ'} đã được đặt lên tường. Nhấn Esc để thoát công cụ.`);
};
BMH.edgeHandlesSvg = r => `<g class="edge-grips">${[['north',r.x,r.y,r.x+r.w,r.y],['south',r.x,r.y+r.h,r.x+r.w,r.y+r.h],['west',r.x,r.y,r.x,r.y+r.h],['east',r.x+r.w,r.y,r.x+r.w,r.y+r.h]].map(([side,x1,y1,x2,y2])=>`<line class="wall-grip-hit" data-edge-id="${r.id}" data-edge-side="${side}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line class="wall-grip-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('')}</g>`;
BMH.wallPlacementSvg = rooms => rooms.map(r=>`<g class="wall-place-room">${[['north',r.x,r.y,r.x+r.w,r.y],['south',r.x,r.y+r.h,r.x+r.w,r.y+r.h],['west',r.x,r.y,r.x,r.y+r.h],['east',r.x+r.w,r.y,r.x+r.w,r.y+r.h]].map(([side,x1,y1,x2,y2])=>`<line class="wall-place-hit" data-wall-place="1" data-room="${r.id}" data-side="${side}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('')}</g>`).join('');

BMH.planSvg = ({interactive=true, floor=BMH.state.ui.planner.floor}={}) => {
  const p=BMH.state.project, ui=BMH.state.ui.planner, rooms=BMH.floorRooms(floor), W=p.site.width,H=p.site.depth;
  const usedH=Math.max(6,...rooms.map(r=>r.y+r.h)), Hview=Math.min(H,Math.max(usedH+1,10)), m=2.55, major=1, minor=.2, zoom=BMH.clamp(ui.zoom||1,.75,2.5);
  const kua=BMH.kua(p.household.ownerBirth,p.household.ownerGender), good=kua?.dirs?.[0];
  const feng=ui.showFeng&&good?(()=>{const pos={'Bắc':[W*.2,0,W*.6,Hview*.22],'Nam':[W*.2,Hview*.78,W*.6,Hview*.22],'Đông':[W*.78,Hview*.2,W*.22,Hview*.6],'Tây':[0,Hview*.2,W*.22,Hview*.6],'Đông Nam':[W*.58,Hview*.58,W*.42,Hview*.42],'Đông Bắc':[W*.58,0,W*.42,Hview*.42],'Tây Nam':[0,Hview*.58,W*.42,Hview*.42],'Tây Bắc':[0,0,W*.42,Hview*.42]}[good];return pos?`<g class="feng-zone"><rect x="${pos[0]}" y="${pos[1]}" width="${pos[2]}" height="${pos[3]}"/><text x="${pos[0]+.16}" y="${pos[1]+.34}">Hướng tốt tham khảo · ${good}</text></g>`:''})():'';
  const roomMarkup=rooms.map(r=>`<g class="room room-${r.type} ${ui.selected===r.id?'selected':''}" data-room-id="${r.id}"><rect class="room-interior" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>${ui.showFurniture?BMH.furnitureSvg(r):''}<g class="room-label"><text class="room-name" x="${r.x+r.w/2}" y="${r.y+r.h/2-.05}">${BMH.esc(r.name).toUpperCase()}</text><text class="room-area" x="${r.x+r.w/2}" y="${r.y+r.h/2+.22}">${BMH.num(r.w*r.h)} m² · ${BMH.num(r.w)}×${BMH.num(r.h)}m</text></g>${interactive&&ui.selected===r.id&&ui.tool==='select'?`<rect class="selection-outline" x="${r.x+.04}" y="${r.y+.04}" width="${Math.max(.01,r.w-.08)}" height="${Math.max(.01,r.h-.08)}"/>${BMH.edgeHandlesSvg(r)}<circle class="resize-handle" data-resize-id="${r.id}" cx="${r.x+r.w}" cy="${r.y+r.h}" r=".18"/>`:''}</g>`).join('');
  const walls=BMH.archWallsSvg(floor), openings=p.plan.openings.filter(o=>o.floor===floor).map(BMH.openingSvg).join('');
  const dims=ui.showDimensions?BMH.dimensionChainSvg(floor,Hview):'';
  const axesX=Array.from({length:Math.max(2,Math.ceil(W/2)+1)},(_,i)=>{const x=Math.min(W,i*2);return `<g class="axis"><circle cx="${x}" cy="-.72" r=".15"/><text x="${x}" y="-.67" text-anchor="middle">${i+1}</text><line x1="${x}" y1="-.55" x2="${x}" y2="0"/></g>`}).join('');
  const letters='ABCDEFGH'; const axesY=Array.from({length:Math.max(2,Math.ceil(Hview/4)+1)},(_,i)=>{const y=Math.min(Hview,i*4);return `<g class="axis"><circle cx="-.72" cy="${y}" r=".15"/><text x="-.72" y="${y+.05}" text-anchor="middle">${letters[i]||i+1}</text><line x1="-.55" y1="${y}" x2="0" y2="${y}"/></g>`}).join('');
  const north=`<g class="north-arrow" transform="translate(${W+.92} .65)"><circle r=".34"/><path d="M0 -.27L.12 .11 0 .05-.12 .11Z"/><text x="0" y="-.44">N</text></g>`;
  const scale=`<g class="scale-bar" transform="translate(${Math.max(.2,W-2.2)} ${Hview+.63})"><rect x="0" y="0" width=".5" height=".10"/><rect x=".5" y="0" width=".5" height=".10" class="alt"/><rect x="1" y="0" width="1" height=".10"/><text x="0" y=".30">0</text><text x="1" y=".30">1m</text><text x="2" y=".30" text-anchor="end">2m</text></g>`;
  const baseX=-m,baseY=-m,baseW=W+m*2+1.45,baseH=Hview+m*2+1.15,cx=baseX+baseW/2,cy=baseY+baseH/2,vw=baseW/zoom,vh=baseH/zoom,vx=cx-vw/2,vy=cy-vh/2;
  const placement=interactive&&ui.tool!=='select'?`<g class="placement-layer tool-${ui.tool}">${BMH.wallPlacementSvg(rooms)}</g>`:'';
  return `<svg id="plannerSvg" class="planner-svg architecture-svg tool-${ui.tool}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" data-floor="${floor}" aria-label="Mặt bằng kiến trúc sơ bộ tầng ${floor+1}"><defs><pattern id="minorGrid" width="${minor}" height="${minor}" patternUnits="userSpaceOnUse"><path d="M ${minor} 0 L 0 0 0 ${minor}"/></pattern><pattern id="majorGrid" width="${major}" height="${major}" patternUnits="userSpaceOnUse"><path d="M ${major} 0 L 0 0 0 ${major}"/></pattern></defs><rect x="${baseX}" y="${baseY}" width="${baseW}" height="${baseH}" class="sheet-bg"/><rect x="0" y="0" width="${W}" height="${Hview}" class="paper"/><rect x="0" y="0" width="${W}" height="${Hview}" class="minor-grid"/><rect x="0" y="0" width="${W}" height="${Hview}" class="major-grid"/>${feng}<g class="axis-layer">${axesX}${axesY}</g><g class="room-layer">${roomMarkup}</g><g class="wall-layer">${walls}</g><g class="opening-layer">${openings}</g>${placement}${dims}<rect class="plot-boundary" x="0" y="0" width="${W}" height="${Hview}"/>${north}${scale}</svg>`;
};

BMH.findFreeSpot = (w,h,floor) => { const s=BMH.state.ui.planner.snap, site=BMH.state.project.site; for(let y=0;y<=site.depth-h+.001;y+=s)for(let x=0;x<=site.width-w+.001;x+=s){const r={id:'temp',floor,x:+x.toFixed(2),y:+y.toFixed(2),w,h};if(BMH.roomValid(r))return {x:r.x,y:r.y};} return null; };
BMH.addRoom = type => { const defs={living:['Phòng khách',4,4],kitchen:['Bếp + ăn',4,4],bed:['Phòng ngủ',3.2,4],bath:['WC',1.8,2.2],stairs:['Cầu thang',2,4],garage:['Gara',3,5],corridor:['Hành lang',1.2,4],balcony:['Ban công',1.5,3]}; const d=defs[type]||defs.bed, floor=BMH.state.ui.planner.floor, pos=BMH.findFreeSpot(Math.min(d[1],BMH.state.project.site.width),Math.min(d[2],BMH.state.project.site.depth),floor); if(!pos)return BMH.toast('Không còn vùng trống đủ cho không gian mẫu.'); BMH.pushPlanHistory(); const r={id:BMH.uid('r'),floor,name:d[0],type,x:pos.x,y:pos.y,w:Math.min(d[1],BMH.state.project.site.width),h:Math.min(d[2],BMH.state.project.site.depth)}; BMH.state.project.plan.rooms.push(r); BMH.state.ui.planner.selected=r.id; BMH.state.ui.planner.tool='select'; BMH.save(); BMH.render(); };
BMH.addOpening = kind => { const r=BMH.selectedRoom(); if(!r)return BMH.toast('Hãy chọn phòng trước.'); BMH.state.ui.planner.tool=kind; BMH.save(); BMH.render(); BMH.toast(`Đang dùng công cụ ${kind==='door'?'Cửa đi':'Cửa sổ'} — nhấp trực tiếp lên cạnh tường để đặt.`); };


/* ---- 40_exports.js ---- */
BMH.csv = rows => rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\r\n');
BMH.excelXml = (sheet,rows) => {
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const cell=v=>{const isNum=typeof v==='number'&&Number.isFinite(v);return `<Cell><Data ss:Type="${isNum?'Number':'String'}">${esc(v)}</Data></Cell>`};
  return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#EAF2E7" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="${esc(sheet)}"><Table>${rows.map((r,i)=>`<Row>${r.map((v,j)=>i===0?`<Cell ss:StyleID="Header"><Data ss:Type="String">${esc(v)}</Data></Cell>`:cell(v)).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`;
};
BMH.exportLoan = () => {
  const rows=[['Tháng','Lãi suất năm','Gốc','Lãi','Tổng trả','Dư nợ']];
  BMH.loanSchedule().forEach(r=>rows.push([r.month,Number(r.annual.toFixed(2)),Math.round(r.principal),Math.round(r.interest),Math.round(r.payment),Math.round(r.balance)]));
  BMH.download('BMH-lich-tra-no.xls',BMH.excelXml('Lich tra no',rows),'application/vnd.ms-excel');
};
BMH.exportEstimate = () => { const e=BMH.estimate(), rows=[['Hạng mục','Giá trị (VND)'],['Phần thô',e.shell],['Hoàn thiện & vật liệu',e.finish],['Vận chuyển',e.transport],['Chuẩn bị',e.prep],['Dự phòng 10%',e.contingency],['TỔNG',e.total]]; BMH.download('BMH-du-toan.xls',BMH.excelXml('Du toan',rows),'application/vnd.ms-excel'); };
BMH.exportPlanSvg = () => BMH.download(`BMH-mat-bang-tang-${BMH.state.ui.planner.floor+1}.svg`,BMH.planSvg({interactive:false}),'image/svg+xml');
BMH.exportProjectJson = () => BMH.download('BMH-project.json',JSON.stringify(BMH.state,null,2),'application/json');
BMH.zipStored = files => {
  const enc=new TextEncoder(); const crcTable=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
  const crc32=u8=>{let c=0xffffffff;for(const b of u8)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  const parts=[], central=[]; let offset=0;
  const u16=n=>new Uint8Array([n&255,(n>>>8)&255]); const u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
  for(const [name,content] of files){const n=enc.encode(name),d=content instanceof Uint8Array?content:enc.encode(String(content)),crc=crc32(d);const local=[u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(n.length),u16(0),n,d]; const len=local.reduce((s,x)=>s+x.length,0); parts.push(...local); central.push(...[u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(n.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),n]); offset+=len;}
  const centralOffset=offset, centralLen=central.reduce((s,x)=>s+x.length,0); parts.push(...central,...[u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralLen),u32(centralOffset),u16(0)]); return new Blob(parts,{type:'application/zip'});
};
BMH.exportBundle = () => {
  if(!BMH.isUnlocked()) return BMH.openPaywall();
  const e=BMH.estimate();
  const loanRows=[['Tháng','Lãi suất năm','Gốc','Lãi','Tổng trả','Dư nợ'],...BMH.loanSchedule().map(r=>[r.month,Number(r.annual.toFixed(2)),Math.round(r.principal),Math.round(r.interest),Math.round(r.payment),Math.round(r.balance)])];
  const estimateRows=[['Hạng mục','Giá trị (VND)'],['Phần thô',e.shell],['Hoàn thiện & vật liệu',e.finish],['Vận chuyển',e.transport],['Chuẩn bị',e.prep],['Dự phòng',e.contingency],['Tổng',e.total]];
  const files=[['project.json',JSON.stringify(BMH.state,null,2)],['mat-bang-tang-1.svg',BMH.planSvg({interactive:false,floor:0})],['du-toan.xls',BMH.excelXml('Du toan',estimateRows)],['lich-tra-no.xls',BMH.excelXml('Lich tra no',loanRows)]];
  for(let f=1;f<BMH.state.project.site.floors;f++)files.push([`mat-bang-tang-${f+1}.svg`,BMH.planSvg({interactive:false,floor:f})]);
  BMH.download('Build-My-Home-ho-so.zip',BMH.zipStored(files),'application/zip');
};


/* ---- 50_screens.js ---- */
BMH.field = (label,path,{type='number',min=0,max=9999999999,step=1,scale=1,options=null,hint='',prefix='',suffix=''}={}) => {
  const value=BMH.get(path);
  return `<label class="field"><span>${label}</span><div class="field-control">${prefix?`<i>${prefix}</i>`:''}${options?`<select data-path="${path}">${options.map(o=>{const v=Array.isArray(o)?o[0]:o,n=Array.isArray(o)?o[1]:o;return `<option value="${BMH.esc(v)}" ${String(value)===String(v)?'selected':''}>${BMH.esc(n)}</option>`}).join('')}</select>`:`<input data-path="${path}" data-scale="${scale}" type="${type}" min="${min}" max="${max}" step="${step}" value="${type==='number'?Number(value)/scale:BMH.esc(value)}">`}${suffix?`<em>${suffix}</em>`:''}</div>${hint?`<small>${hint}</small>`:''}</label>`;
};
BMH.hero = (step,title,accent,desc,{quote='',banner=true}={}) => `<section class="step-hero step-hero-${step} ${banner?'with-banner':'plain'}"><div class="hero-copy"><span class="eyebrow">BƯỚC ${step} TRONG 10</span><h1>${title} ${accent?`<em>${accent}</em>`:''}</h1><p>${desc}</p></div>${banner?`<div class="hero-art hero-clean"><img src="assets/design/hero-step1.jpg" alt="Nhà hiện đại"><div class="hero-fade"></div>${quote?`<blockquote>“${quote}”</blockquote>`:''}</div>`:''}</section>`;
BMH.cardTitle = (title,desc='') => `<div class="card-title"><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div>`;
BMH.sectionIcon = (char,title,desc='') => `<div class="section-heading"><i>${char}</i><div><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div></div>`;

BMH.screen1 = () => `<section class="official-start-hero"><div class="official-start-copy"><span class="eyebrow">BƯỚC 1 TRONG 10</span><h1>Khởi tạo <em>dự án mới</em></h1><p>Hãy cho chúng tôi biết bạn đã có những gì trước khi xây nhà.<br>Chọn một trong các luồng dưới đây để bắt đầu hành trình kiến tạo tổ ấm của bạn.</p></div><div class="official-start-art hero-clean"><img src="assets/design/hero-step1.jpg" alt="Ngôi nhà mơ ước"><blockquote>“Mọi hành trình lớn<br>đều bắt đầu từ một bước nhỏ.”</blockquote><small>Ngôi nhà mơ ước<br>bắt đầu từ hôm nay</small></div></section>
<div class="official-flow-grid">
  <article class="official-flow flow-a"><div class="flow-visual"><img src="assets/design/flow-a.jpg" alt="Ảnh nhà mẫu"><span>Luồng A</span></div><div class="flow-body"><h2>Tôi đã có ảnh nhà mẫu ưng ý</h2><p>Bạn có thể tải lên ảnh nhà mẫu tìm thấy trên mạng hoặc ảnh chụp thực tế. Những hình ảnh này sẽ được dùng làm tham khảo phong cách cho bước thiết kế.</p><button class="clay" data-start="photo">${BMH.icon('upload')} Tải ảnh lên <b>→</b></button><small>Hỗ trợ JPG, PNG · tối đa 10 ảnh</small></div></article>
  <article class="official-flow flow-b"><div class="flow-visual"><img src="assets/design/flow-b.jpg" alt="Bản vẽ"><span>Luồng B</span></div><div class="flow-body"><h2>Tôi đã có file bản vẽ (ảnh / PDF)</h2><p>Hệ thống ghi nhận bản vẽ làm tài liệu đối chiếu diện tích, số phòng và cấu trúc mặt bằng; bạn vẫn có thể chỉnh sửa phương án ở Bước 5.</p><button class="clay" data-start="plan">${BMH.icon('upload')} Tải bản vẽ <b>→</b></button><small>Hỗ trợ PDF, JPG, PNG · tối đa 20MB</small></div></article>
  <article class="official-flow flow-c"><div class="flow-visual"><img src="assets/design/flow-c.jpg" alt="Tư vấn từ đầu"><span>Luồng C</span></div><div class="flow-body"><h2>Tôi chưa có gì cả, cần gợi ý từ đầu</h2><p>Hệ thống sẽ đồng hành từ ngân sách, khu đất, thành viên gia đình đến vật liệu, dự toán và phương án mặt bằng sơ bộ.</p><button class="clay" data-start="suggest">Bắt đầu tư vấn ${BMH.icon('arrow')}</button><small>Phù hợp với gia đình mới bắt đầu lập kế hoạch</small></div></article>
</div>
<section class="official-benefits"><h2>Bạn sẽ nhận được gì?</h2><div><article><i>▤</i><b>Kế hoạch rõ ràng</b><span>Lộ trình 10 bước minh bạch, dễ theo dõi</span></article><article><i>◉</i><b>Kiểm soát chi phí</b><span>Dự toán thay đổi theo lựa chọn thực tế</span></article><article><i>⌂</i><b>Hỗ trợ chuyên môn</b><span>Mặt bằng và dữ liệu đủ để trao đổi với KTS</span></article><article><i>◇</i><b>Hài hòa gia đình</b><span>Công năng, khả năng tiếp cận và phong thủy tham khảo</span></article></div></section>`;

BMH.screen2 = () => {const f=BMH.state.project.finance,s=BMH.financeSummary(),bank=BMH.BANKS.find(b=>b.id===f.bank); const stress=[1,2,3].map(x=>{const payment=BMH.monthlyPayment(f.loan,f.postRate+x,f.years*12-f.promoMonths);return `<div><small>+${x}%</small><b>${BMH.money(payment)}</b><span>${Math.round((payment+f.existingDebt)/f.income*100)}% thu nhập</span></div>`}).join('');return `${BMH.hero(2,'Hồ sơ tài chính','& DTI','Đánh giá khả năng chi trả để xây nhà an toàn và bền vững.',{banner:false})}<div class="finance-official"><div class="finance-core"><section class="card finance-section">${BMH.sectionIcon('▥','1. Thông tin tài chính cá nhân','Cung cấp thông tin để hệ thống đánh giá khả năng chi trả phù hợp với kế hoạch xây nhà.')}<div class="fields four">${BMH.field('Số tiền hiện có','project.finance.cash',{scale:1000000,step:10,suffix:'triệu'})}${BMH.field('Thu nhập hàng tháng','project.finance.income',{scale:1000000,step:1,suffix:'triệu'})}${BMH.field('Chi phí cố định hàng tháng','project.finance.living',{scale:1000000,step:1,suffix:'triệu'})}${BMH.field('Quỹ dự phòng','project.finance.reserve',{scale:1000000,step:10,suffix:'triệu'})}</div></section><section class="card finance-section">${BMH.sectionIcon('▱','2. Thông tin khoản vay','Chọn ngân hàng để nạp kịch bản tham khảo; người dùng vẫn có thể chỉnh tay theo báo giá tín dụng thực tế.')}<div class="bank-grid official-banks">${BMH.BANKS.map(b=>`<button class="bank ${f.bank===b.id?'active':''}" data-bank="${b.id}"><img src="${b.img}" alt="${b.name}"><span>${b.name}</span><i></i></button>`).join('')}</div><div class="fields five loan-fields">${BMH.field('Số tiền vay','project.finance.loan',{scale:1000000,step:10,suffix:'triệu'})}${BMH.field('Thời hạn vay','project.finance.years',{min:1,max:35,suffix:'năm'})}${BMH.field('Lãi suất ưu đãi','project.finance.introRate',{step:.1,suffix:'%/năm'})}${BMH.field('Lãi suất sau ưu đãi','project.finance.postRate',{step:.1,suffix:'%/năm'})}${BMH.field('Thời gian ưu đãi','project.finance.promoMonths',{min:0,max:60,suffix:'tháng'})}</div><div class="bank-note"><b>${bank?.name||''}</b><span>${bank?.note||''}</span></div><div class="finance-metrics official-metrics"><div class="metric clay"><small>Khoản phải trả tháng đầu</small><strong>${BMH.money(s.first)}</strong><span>Dựa trên lãi ưu đãi ${f.introRate}%/năm</span></div><div class="metric blue"><small>Ước tính sau ưu đãi</small><strong>${BMH.money(s.post)}</strong><span>Dựa trên lãi ${f.postRate}%/năm</span></div><div class="metric ${s.dti>.35?'warn':'green'}"><small>Chỉ số an toàn dòng tiền (DTI)</small><strong>${Math.round(s.dti*100)}%</strong><span>Còn khoảng ${BMH.money(s.remainder)}/tháng</span></div></div><div class="stress official-stress"><div><h3>Kiểm tra sức chịu đựng khi lãi tăng</h3><p>Lãi suất tương lai có thể cao hơn các kịch bản minh họa. Luôn duy trì quỹ dự phòng và biên an toàn.</p></div>${stress}</div><button class="secondary" data-export="loan">${BMH.icon('download')} Tải bảng dự tính trả nợ theo tháng (Excel/CSV)</button></section></div><aside class="finance-knowledge card"><h2>Hiểu đúng để quyết định sáng suốt</h2><p>Một số khái niệm quan trọng giúp bạn lập kế hoạch tài chính an toàn hơn.</p><article><i>◇</i><div><b>Ngân sách an toàn</b><span>Nên có dự phòng 20–30% cho phát sinh và không dùng hết toàn bộ dòng tiền khả dụng.</span></div></article><article><i>%</i><div><b>Lãi thả nổi</b><span>Sau thời gian ưu đãi, lãi suất có thể điều chỉnh theo thị trường và chính sách ngân hàng.</span></div></article><article><i>▥</i><div><b>Chỉ số DTI</b><span>Tỷ lệ trả nợ trên thu nhập giúp nhận biết áp lực dòng tiền hàng tháng.</span></div></article><div class="expert-note"><span class="expert-avatar">KTS</span><div><small>Chia sẻ từ chuyên gia</small><blockquote>“Tài chính vững vàng là nền móng cho một tổ ấm bền lâu.”</blockquote></div></div></aside></div>`};

BMH.screen3 = () => {
  const s=BMH.state.project.site,r=BMH.REGIONS[s.province]||BMH.REGIONS['Bình Dương'];
  const districtOptions=(r.districts||[]).map(d=>[d[0],d[0]]);
  const nearby=(r.districts||[]).slice(0,4);
  return `${BMH.hero(3,'Vị trí','& khí hậu vùng','Chọn vị trí xây nhà và tìm hiểu đặc điểm khí hậu, điều kiện xây dựng tại khu vực.',{banner:false})}<div class="location-official"><section class="card location-search">${BMH.cardTitle('Tìm kiếm vị trí')}<div class="stack">${BMH.field('Quốc gia','project.site.country',{type:'text',hint:'Việt Nam'})}${BMH.field('Tỉnh/Thành phố','project.site.province',{options:Object.keys(BMH.REGIONS)})}${BMH.field('Quận/Huyện','project.site.district',{options:districtOptions})}${BMH.field('Địa chỉ cụ thể','project.site.address',{type:'text'})}</div><button class="clay wide-btn" data-map-refresh>${BMH.icon('pin')} Cập nhật vị trí</button><div class="location-coord"><b>Điểm đang dùng</b><span>${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</span></div></section><section class="card map-card official-map"><div id="map" class="map map-loading"><div class="map-fallback"><div class="fallback-grid"></div><div class="fallback-pin">${BMH.icon('pin')}</div><b>${BMH.esc(s.district||s.province)}</b><span>${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</span><small>Nếu bản đồ nền bị chặn, tọa độ dự án vẫn giữ đúng theo khu vực đã chọn.</small></div></div><button class="map-expand" data-map-refresh>Xem lại vị trí ↗</button></section><section class="card region-info official-region">${BMH.cardTitle('Thông tin khu vực')}<h3>${BMH.icon('pin')} ${BMH.esc(s.district||r.defaultDistrict)}, ${BMH.esc(s.province)}</h3><dl><div><dt>☀ Khí hậu</dt><dd>${r.climate}</dd></div><div><dt>⌁ Rủi ro ngập</dt><dd>${r.flood}</dd></div><div><dt>☂ Rủi ro bão</dt><dd>${r.storm}</dd></div><div><dt>₫ Giá nhân công</dt><dd>${r.labor}</dd></div><div><dt>↔ Đường tiếp cận</dt><dd>${s.road}m</dd></div><div class="cost-row"><dt>▥ Điều chỉnh chi phí</dt><dd>${s.road<3?'+12%':s.road<5?'+5%':'+2%'}</dd></div></dl><div class="region-source">Dữ liệu vùng là kịch bản tham khảo; cần đối chiếu khảo sát và báo giá tại thời điểm xây dựng.</div></section></div><section class="area-suggestions"><h2>Khu vực lân cận gợi ý</h2><div>${nearby.map((x,i)=>`<article data-nearby="${BMH.esc(x[0])}" data-lat="${x[1]}" data-lng="${x[2]}"><div class="area-photo area-${i+1}"></div><b>${BMH.esc(x[0])}</b><span>${i===0?'Trung tâm tham chiếu':i===1?'Khu dân cư hiện hữu':i===2?'Hạ tầng kết nối thuận tiện':'Khu vực cần khảo sát thêm'}</span></article>`).join('')}</div></section>`;
};

BMH.screen4 = () => {const h=BMH.state.project.household,s=BMH.state.project.site,advice=BMH.householdAdvice(),familyCount=2+h.children.length+h.relatives.length;return `${BMH.hero(4,'Đất, địa chất','& phong thủy gia đình','Đánh giá điều kiện đất, địa chất, khả năng tiếp cận và nhu cầu của gia đình.',{quote:'Nền đất vững vàng – Khởi đầu tổ ấm bền lâu'})}<div class="site-official"><section class="card lot-card">${BMH.sectionIcon('▤','Thông số lô đất','Nhập thông tin lô đất để đánh giá sơ bộ điều kiện xây dựng.')}<div class="fields">${BMH.field('Mặt tiền','project.site.width',{step:.1,suffix:'m'})}${BMH.field('Chiều sâu','project.site.depth',{step:.1,suffix:'m'})}${BMH.field('Số tầng dự kiến','project.site.floors',{min:1,max:5,suffix:'tầng'})}${BMH.field('Chiều rộng đường tiếp cận','project.site.road',{step:.5,suffix:'m'})}</div><h3 class="sub-label">Hình dạng lô đất</h3><div class="shape-grid"><button class="active"><i>□</i>Hình chữ nhật</button><button><i>▢</i>Hình vuông</button><button><i>▱</i>Hình thang</button><button><i>◩</i>Không đều</button></div><div class="info-strip">ⓘ Hình dạng lô đất ảnh hưởng phương án thiết kế, nắng, gió và chi phí xây dựng.</div></section><section class="card geology-card">${BMH.sectionIcon('▦','Địa chất & tiếp cận công trình','Đánh giá sơ bộ để lựa chọn phương án thi công phù hợp.')}<h3 class="sub-label">Loại địa chất khu vực</h3><div class="soil-grid">${[['Đất đồi cứng','◢'],['Đất thịt đồng bằng','◒'],['Đất trũng ao hồ / ven sông','≋'],['Chưa biết','?']].map(([n,i])=>`<button class="soil ${s.soil===n?'active':''}" data-soil="${n}"><i>${i}</i><span>${n}</span></button>`).join('')}</div><h3 class="sub-label">Khả năng tiếp cận</h3><div class="access-grid"><button class="${s.road>=5?'active':''}">▥<span>Đường lớn<br>&gt;5m</span></button><button class="${s.road>=3&&s.road<5?'active':''}">▥<span>Hẻm 3–5m</span></button><button class="${s.road>=2.5&&s.road<3?'active':''}">▥<span>Hẻm 2.5–3m</span></button><button class="${s.road<2.5?'active':''}">♙<span>Hẻm nhỏ<br>&lt;2.5m</span></button></div><div class="warning-strip">⚠ Đường tiếp cận hẹp có thể làm tăng chi phí vận chuyển và thi công.</div><div class="foundation-tip"><i>⚙</i><div><small>Đề xuất sơ bộ</small><b>${s.soil.includes('trũng')?'Cần khảo sát nền & xử lý lún':'Móng băng / móng cọc sau khảo sát'}</b><span>Chỉ chốt sau khảo sát địa chất thực tế.</span></div></div></section><section class="card feng-card">${BMH.sectionIcon('◇','Phong thủy gia đình','Bát Trạch tham khảo kết hợp nhu cầu công năng thực tế.')}<div class="family-summary"><article><i>♙</i><b>Gia chủ</b><strong>${h.ownerBirth}</strong><span>${h.ownerGender}</span></article><article><i>♙</i><b>Người đồng hành</b><strong>${h.partnerBirth}</strong><span>${h.partnerGender}</span></article><article><i>♙</i><b>Con cái</b><strong>${h.children.length}</strong><span>người</span></article><article><i>♙</i><b>Ba mẹ/người thân</b><strong>${h.relatives.length}</strong><span>người</span></article></div>${BMH.compass()}</section></div><section class="card household-manager"><div class="between">${BMH.cardTitle(`Thành viên sống cùng · ${familyCount} người`,'Dữ liệu này dùng để tính nhu cầu phòng, khả năng tiếp cận và gợi ý bố trí ở Bước 5.')}<div class="row"><button class="secondary" data-household-add="child">${BMH.icon('plus')} Thêm con</button><button class="secondary" data-household-add="relative">${BMH.icon('plus')} Thêm ba/mẹ/người thân</button></div></div><div class="household-columns"><div class="member-group"><h3>Con cái</h3>${h.children.map(c=>`<div class="person-row"><input data-person="child" data-id="${c.id}" data-key="name" value="${BMH.esc(c.name)}"><input type="number" data-person="child" data-id="${c.id}" data-key="birth" value="${c.birth}"><select data-person="child" data-id="${c.id}" data-key="room"><option ${c.room==='Riêng'?'selected':''}>Riêng</option><option ${c.room==='Ngủ chung'?'selected':''}>Ngủ chung</option></select><button data-person-remove="child" data-id="${c.id}">${BMH.icon('trash')}</button></div>`).join('')||'<p class="empty-member">Chưa thêm con.</p>'}</div><div class="member-group"><h3>Ba mẹ / người thân</h3>${h.relatives.map(r=>`<div class="person-row"><input data-person="relative" data-id="${r.id}" data-key="name" value="${BMH.esc(r.name)}"><input type="number" data-person="relative" data-id="${r.id}" data-key="birth" value="${r.birth}"><select data-person="relative" data-id="${r.id}" data-key="mobility"><option ${r.mobility==='Bình thường'?'selected':''}>Bình thường</option><option ${r.mobility==='Hạn chế nhẹ'?'selected':''}>Hạn chế nhẹ</option><option ${r.mobility==='Hạn chế nhiều'?'selected':''}>Hạn chế nhiều</option></select><button data-person-remove="relative" data-id="${r.id}">${BMH.icon('trash')}</button></div>`).join('')||'<p class="empty-member">Chưa thêm người thân.</p>'}</div></div><div class="architecture-advice"><b>Gợi ý kiến trúc từ cấu trúc gia đình</b><div>${advice.map(x=>`<span>✓ ${BMH.esc(x)}</span>`).join('')}</div></div></section>`};

BMH.plannerInspector = () => {
  const r=BMH.selectedRoom();
  if(!r)return `<div class="inspector-empty"><i>⌖</i><b>Chọn một không gian</b><span>Nhấp vào phòng trên mặt bằng để chỉnh kích thước, loại phòng và cấu kiện mở.</span></div>`;
  const openings=BMH.state.project.plan.openings.filter(o=>o.roomId===r.id);
  return `<div class="inspector-form"><div class="inspector-title"><div><b>${BMH.esc(r.name)}</b><span>${BMH.num(r.w*r.h)}m² · Tầng ${r.floor+1}</span></div><button data-room-delete title="Xóa phòng">${BMH.icon('trash')}</button></div><label>Tên phòng<input data-room-field="name" value="${BMH.esc(r.name)}"></label><label>Loại không gian<select data-room-field="type">${[['living','Phòng khách'],['kitchen','Bếp + ăn'],['bed','Phòng ngủ'],['bath','WC'],['stairs','Cầu thang'],['garage','Gara'],['corridor','Hành lang'],['balcony','Ban công']].map(([k,n])=>`<option value="${k}" ${r.type===k?'selected':''}>${n}</option>`).join('')}</select></label><div class="property-grid">${['x','y','w','h'].map(k=>`<label><span>${({x:'X',y:'Y',w:'Rộng',h:'Sâu'})[k]} (m)</span><input type="number" step=".1" min="${(k==='w'||k==='h')?0.5:0}" data-room-field="${k}" value="${r[k]}"></label>`).join('')}</div><div class="room-spec-row"><span><b>${BMH.num(r.w*r.h)}</b> m²</span><span><b>${BMH.num(2*(r.w+r.h))}</b> m chu vi</span><span><b>${openings.length}</b> ô mở</span></div><div class="opening-actions"><button class="${BMH.state.ui.planner.tool==='door'?'active':''}" data-add-opening="door">↪ Đặt cửa đi</button><button class="${BMH.state.ui.planner.tool==='window'?'active':''}" data-add-opening="window">▥ Đặt cửa sổ</button></div><div class="opening-list"><b>Cấu kiện mở</b>${openings.length?openings.map(o=>`<div class="opening-row"><span class="opening-code">${BMH.openingCode(o)}</span><select data-opening-field="side" data-opening-id="${o.id}">${[['north','Bắc'],['south','Nam'],['east','Đông'],['west','Tây']].map(([k,n])=>`<option value="${k}" ${o.side===k?'selected':''}>${n}</option>`).join('')}</select><label><input type="number" step=".1" min=".5" max="3" data-opening-field="width" data-opening-id="${o.id}" value="${o.width}">m</label><label class="opening-offset" title="Vị trí dọc theo tường"><input type="range" min="0" max="1" step=".05" data-opening-field="offset" data-opening-id="${o.id}" value="${o.offset??.5}"></label><button data-opening-delete="${o.id}" title="Xóa">×</button></div>`).join(''):'<span class="empty-opening">Chưa có cửa/cửa sổ.</span>'}</div></div>`;
};

BMH.screen5 = () => {
  const ui=BMH.state.ui.planner,rooms=BMH.floorRooms(),issues=BMH.plannerIssues(),source=BMH.state.project.source,plannerMode=BMH.state.ui.designTab==='planner';
  const floorOpenings=BMH.state.project.plan.openings.filter(o=>o.floor===ui.floor), wallSegments=BMH.wallSegments(ui.floor);
  const left = plannerMode ? `<section class="card planner-toolrail"><div class="toolrail-head"><div>${BMH.cardTitle('Thư viện không gian','Kéo ý tưởng thành mặt bằng theo lưới kỹ thuật.')}</div><span class="draft-badge">CAD-LITE</span></div><div class="toolrail-grid">${[['living','Phòng khách','▱'],['kitchen','Bếp + ăn','▤'],['bed','Phòng ngủ','▥'],['bath','WC','◫'],['stairs','Cầu thang','⇅'],['garage','Gara','▣'],['corridor','Hành lang','↔'],['balcony','Ban công','⌂']].map(([k,n,ico])=>`<button data-add-room="${k}"><i>${ico}</i><span>${n}</span></button>`).join('')}</div><div class="toolrail-openings"><b>Công cụ kiến trúc</b><button class="${ui.tool==='select'?'active':''}" data-plan-tool="select">⌖ Chọn / kéo tường</button><button class="${ui.tool==='door'?'active':''}" data-add-opening="door">＋ Đặt cửa đi</button><button class="${ui.tool==='window'?'active':''}" data-add-opening="window">＋ Đặt cửa sổ</button></div><div class="draft-standard"><b>Quy ước bản vẽ</b><span><i class="wall-sample ext"></i>Tường bao ~200mm</span><span><i class="wall-sample int"></i>Tường ngăn ~100mm</span><span><i class="window-sample"></i>Cửa sổ / ô thoáng</span></div><div class="reference-mini"><img src="assets/design/flow-a.jpg" alt="Tham khảo"><div><b>${BMH.esc(BMH.state.project.style)}</b><span>Phong cách tham khảo</span></div></div><div class="info-strip">ⓘ Mặt bằng kiến trúc sơ bộ để trao đổi phương án; hồ sơ thi công vẫn cần KTS/kỹ sư kiểm tra.</div></section>` : `<section class="card design-reference">${BMH.cardTitle(source==='plan'?'Bản vẽ đã tải':'Ảnh nhà mẫu đã tải',source==='photo'?'Từ Bước 1 · Luồng A':source==='plan'?'Từ Bước 1 · Luồng B':'Ảnh phong cách tham khảo')}<div class="reference-gallery"><img class="main" src="assets/design/flow-a.jpg" alt="Nhà mẫu"><img src="assets/house.jpg" alt="Nhà mẫu 2"><img src="assets/rooms/living-local.jpg" alt="Nội thất mẫu"></div><div class="info-strip">ⓘ Tài liệu tham khảo này dùng để giữ phong cách nhất quán khi hoàn thiện thiết kế.</div><div class="space-list-mini"><b>Không gian đề xuất</b>${['Phòng khách','Bếp + ăn','Phòng ngủ master','Phòng ông bà','Phòng con','WC'].map(x=>`<span>✓ ${x}</span>`).join('')}</div></section>`;
  const issueMarkup=issues.length?issues.slice(0,4).map(i=>`<span class="issue ${i.sev}">${i.sev==='error'?'✕':i.sev==='warn'?'⚠':'ⓘ'} ${BMH.esc(i.text)}</span>`).join(''):'<span class="issue ok">✓ Không phát hiện chồng phòng, vượt ranh hoặc lỗi hình học cơ bản.</span>';
  return `${BMH.hero(5,'Bản vẽ','thiết kế','Tổ chức mặt bằng kiến trúc sơ bộ với tường, cửa, cửa sổ, kích thước và công năng rõ ràng.',{quote:'Mỗi bản vẽ là một câu chuyện về tổ ấm'})}<div class="design-mode-tabs"><button class="${BMH.state.ui.designTab==='sample'?'active':''}" data-design-tab="sample">▧ Ảnh nhà mẫu</button><button class="${BMH.state.ui.designTab==='upload'?'active':''}" data-design-tab="upload">▤ Tải bản vẽ</button><button class="${plannerMode?'active':''}" data-design-tab="planner">✎ Tự thiết kế</button></div><div class="design-official ${plannerMode?'planner-workspace':''}">${left}<section class="card design-canvas"><div class="drawing-toolbar"><div class="drawing-title"><span class="eyebrow">BẢN VẼ ĐANG LÀM VIỆC</span><b>MẶT BẰNG KIẾN TRÚC SƠ BỘ · TẦNG ${ui.floor+1}</b><small>${BMH.num(BMH.state.project.site.width,1)}m × ${BMH.num(BMH.state.project.site.depth,1)}m · Đơn vị mét</small></div><div class="canvas-actions"><div class="history-actions"><button data-plan-undo title="Hoàn tác · Ctrl+Z">↶</button><button data-plan-redo title="Làm lại · Ctrl+Shift+Z">↷</button></div><label>Snap <select data-planner="snap"><option value="0.1" ${ui.snap===.1?'selected':''}>0,1m</option><option value="0.2" ${ui.snap===.2?'selected':''}>0,2m</option><option value="0.5" ${ui.snap===.5?'selected':''}>0,5m</option></select></label><label class="mini-check"><input type="checkbox" data-planner="furniture" ${ui.showFurniture?'checked':''}> Nội thất</label><label class="mini-check"><input type="checkbox" data-planner="dimensions" ${ui.showDimensions?'checked':''}> Kích thước</label><label class="mini-check"><input type="checkbox" data-planner="feng" ${ui.showFeng?'checked':''}> Hướng tốt</label><div class="zoom-actions"><button data-planner-zoom="out">−</button><span>${Math.round(ui.zoom*100)}%</span><button data-planner-zoom="in">＋</button></div><button data-planner-fit>Fit</button><button data-planner-fullscreen>⛶ Toàn màn hình</button></div></div><div class="canvas-tabs professional-tabs">${Array.from({length:BMH.state.project.site.floors},(_,i)=>`<button class="${ui.floor===i?'active':''}" data-floor="${i}"><span>T${i+1}</span>Mặt bằng tầng ${i+1}</button>`).join('')}<button disabled><span>+</span>Mặt đứng</button><button disabled><span>+</span>Mặt cắt</button></div><div class="technical-sheet"><div class="sheet-toolbar"><span>TRỤC · TƯỜNG · Ô MỞ · NỘI THẤT · KÍCH THƯỚC</span><em>${rooms.length} phòng · ${floorOpenings.length} ô mở · ${wallSegments.length} đoạn tường</em></div>${ui.tool!=='select'?`<div class="placement-hint">${ui.tool==='door'?'↪ ĐẶT CỬA ĐI':'▥ ĐẶT CỬA SỔ'} · Nhấp trực tiếp lên cạnh tường · Esc để thoát</div>`:''}${BMH.planSvg({interactive:true})}<div class="sheet-corner"><b>BMH-A${String(ui.floor+1).padStart(2,'0')}</b><span>Tỷ lệ hiển thị tự động</span></div></div><div class="technical-caption"><span>⌂ MẶT BẰNG TẦNG ${ui.floor+1}</span><em>Grid 0,2m · Snap ${String(ui.snap).replace('.',',')}m · Smart wall · Bản vẽ vector</em></div></section><aside class="card drawing-info"><div class="drawing-info-head">${BMH.sectionIcon('▤','Thông tin bản vẽ')}<span class="drawing-revision">REV 03</span></div><dl><div><dt>⌂ Tổng diện tích sàn</dt><dd>${BMH.num(BMH.planArea())} m²</dd></div><div><dt>▱ Không gian tầng này</dt><dd>${rooms.length}</dd></div><div><dt>╫ Đoạn tường</dt><dd>${wallSegments.length}</dd></div><div><dt>↪ Cửa đi</dt><dd>${floorOpenings.filter(o=>o.kind==='door').length}</dd></div><div><dt>▥ Cửa sổ</dt><dd>${floorOpenings.filter(o=>o.kind==='window').length}</dd></div></dl><div class="info-strip green">ⓘ Các chỉ số cập nhật trực tiếp khi kéo/resize mặt bằng.</div>${BMH.plannerInspector()}</aside></div><section class="room-detail-strip"><div><b>⌂ Không gian trong tầng ${ui.floor+1}</b><span>Chọn phòng để chỉnh thông số; phòng đang chọn được viền xanh trên bản vẽ.</span></div><div>${rooms.map(r=>`<button class="${ui.selected===r.id?'active':''}" data-room-select="${r.id}"><i>${r.type==='bath'?'◫':r.type==='stairs'?'⇅':r.type==='kitchen'?'▤':'▱'}</i>${BMH.esc(r.name)} <small>${BMH.num(r.w*r.h)}m²</small></button>`).join('')}<button class="add-space" data-add-room="bed">+ Thêm phòng</button></div></section><section class="planner-validator ${issues.length?'has-issues':''}"><div><b>Kiểm tra mặt bằng</b><small>${issues.length?`${issues.length} lưu ý cần xem`:'Hình học cơ bản hợp lệ'}</small></div><div class="issue-list">${issueMarkup}</div></section>`;
};

BMH.screen6 = () => {const m=BMH.state.project.materials,e=BMH.estimate(),cat=BMH.state.ui.materialCategory||'floor',items=BMH.MATERIALS[cat]||[];const labels={floor:['Gạch','Gạch xây dựng & gạch ốp lát'],paint:['Sơn','Sơn nội/ngoại thất'],door:['Cửa','Cửa & kính']};return `${BMH.hero(6,'Gói','vật liệu','Chọn gói vật liệu phù hợp với ngân sách, nhu cầu và phong cách sống.',{quote:'Vật liệu tốt, kiến tạo giá trị bền vững'})}<div class="tier-row official-tier">${[['economy','♧','Tiết kiệm','Giải pháp tối ưu chi phí vẫn đảm bảo chất lượng cơ bản.'],['standard','◇','Tiêu chuẩn','Cân bằng giữa chi phí, chất lượng và tính thẩm mỹ.'],['premium','♕','Cao cấp','Vật liệu cao cấp, thẩm mỹ vượt trội cho không gian sống.']].map(([v,ico,n,d])=>`<button class="tier ${m.tier===v?'active':''}" data-tier="${v}"><i>${ico}</i><div><b>${n}</b><span>${d}</span></div><em>${m.tier===v?'Được chọn':''}</em></button>`).join('')}</div><div class="materials-official"><nav class="material-menu">${[['floor','▱','Gạch'],['cement','▤','Xi măng'],['steel','≡','Thép'],['paint','▥','Sơn'],['waterproof','◉','Chống thấm'],['mep','⌁','Điện nước'],['door','▥','Cửa'],['sanitary','▣','Thiết bị vệ sinh']].map(([v,ico,n])=>`<button class="${cat===v?'active':''}" data-material-view="${v}" ${BMH.MATERIALS[v]?'':'disabled'}><i>${ico}</i><span>${n}</span><b>›</b></button>`).join('')}</nav><section class="material-products official-products"><div class="product-heading"><div><h2>${labels[cat]?.[1]||'Danh mục vật liệu'}</h2><p>Vật liệu hoàn thiện quan trọng, ảnh hưởng đến thẩm mỹ, độ bền và cảm giác không gian.</p></div><span>Nguồn & giá cần xác minh lại tại thời điểm mua</span></div><div class="product-grid official-product-grid">${items.map(x=>`<button class="product ${m.choices[cat]===x.id?'active':''}" data-material-cat="${cat}" data-material="${x.id}"><div class="product-img"><img src="${x.img}" alt="${x.name}"><span>♡</span></div><strong>${x.name}</strong><small>${x.sub}</small><dl><div><dt>Đơn giá</dt><dd>${x.price}</dd></div><div><dt>Độ bền</dt><dd>${x.id.includes('viet')?'Rất tốt':'Tốt'}</dd></div><div><dt>Bảo trì</dt><dd>${x.id.includes('viet')?'Rất thấp':'Thấp'}</dd></div></dl><em>${m.choices[cat]===x.id?'Đang chọn':'Xem chi tiết →'}</em></button>`).join('')||`<div class="catalog-coming"><i>▦</i><b>Danh mục đang chuẩn hóa dữ liệu</b><span>Không dùng giá giả. Chỉ hiển thị khi có nguồn hoặc báo giá được xác minh.</span></div>`}</div></section><aside class="card material-impact official-impact"><h2>Tác động đến tổng chi phí và hiệu quả lâu dài</h2><article><i>◉</i><div><small>Chênh lệch chi phí</small><b>${m.lastDelta>=0?'+':''}${BMH.money(m.lastDelta)}</b><span>So với lựa chọn trước</span></div></article><article><i>◷</i><div><small>Ước tính tuổi thọ công trình</small><b>${m.tier==='premium'?'trên 50 năm':'40–50 năm'}</b><span>Với điều kiện thi công và bảo trì đúng</span></div></article><article><i>◇</i><div><small>Chi phí bảo trì 10 năm</small><b>${m.tier==='premium'?'khoảng 35 triệu':'khoảng 45 triệu'}</b><span>Ước tính để so sánh phương án</span></div></article><div class="mini-bars"><b>So sánh tổng chi phí 10 năm</b><div><span style="height:55%"><i>1.2 tỷ</i><em>Tiết kiệm</em></span><span class="active" style="height:72%"><i>1.5 tỷ</i><em>Tiêu chuẩn</em></span><span style="height:90%"><i>1.9 tỷ</i><em>Cao cấp</em></span></div></div><strong class="impact-total">Dự toán hiện tại ${BMH.money(e.total)}</strong></aside></div>`};

BMH.isoModel = () => {
  const p=BMH.state.project,ui=BMH.state.ui,focus=ui.sceneFocus,theme=ui.sceneTheme,zStep=ui.sceneExploded?3.8:3;
  let rooms=p.plan.rooms.filter(r=>focus==='all'||focus===`floor:${r.floor}`||focus===`room:${r.id}`);
  if(!rooms.length) rooms=p.plan.rooms.slice();
  const paint=p.materials.choices.paint==='jotun'?'#e7d6c1':'#f0ebe2', floor=p.materials.choices.floor==='vietceramics'?'#cbb59c':p.materials.choices.floor==='dongtam'?'#d9c8ad':'#ddd7cc', door=p.materials.choices.door==='premium-door'?'#303433':'#544c45';
  const minX=Math.min(...rooms.map(r=>r.x)),minY=Math.min(...rooms.map(r=>r.y)),minF=Math.min(...rooms.map(r=>r.floor));
  const rel=rooms.map(r=>({...r,x:r.x-minX,y:r.y-minY,floor:r.floor-minF})), idMap=new Map(rel.map((r,i)=>[rooms[i].id,r]));
  const maxX=Math.max(...rel.map(r=>r.x+r.w)),maxY=Math.max(...rel.map(r=>r.y+r.h)),maxF=Math.max(...rel.map(r=>r.floor));
  let S=46; const rawW=(maxX+maxY)*S,rawH=(maxX+maxY)*S*.46+(maxF*zStep+2.8)*S*.74;S*=Math.min(1.55,710/Math.max(260,rawW),350/Math.max(180,rawH));S=Math.max(25,S);
  const proj=(x,y,z=0)=>[(x-y)*S,(x+y)*S*.46-z*S*.74];
  const all=[];rel.forEach(r=>[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]].forEach(([x,y])=>all.push(proj(x,y,r.floor*zStep+2.75))));
  const xs=all.map(q=>q[0]),ys=all.map(q=>q[1]),dx=450-(Math.min(...xs)+Math.max(...xs))/2,dy=276-(Math.min(...ys)+Math.max(...ys))/2;
  const P=(x,y,z=0)=>{const q=proj(x,y,z);return [q[0]+dx,q[1]+dy]};
  const pts=a=>a.map(q=>q.join(',')).join(' '),poly=(a,fill,stroke='#5e6c64',extra='')=>`<polygon points="${pts(a)}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
  const floorPoly=r=>poly([[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]].map(([x,y])=>P(x,y,r.floor*3+.03)),floor,'#647168','opacity=".98"');
  const rearWalls=r=>{const z=r.floor*zStep,h=2.7,n=[P(r.x,r.y,z),P(r.x+r.w,r.y,z),P(r.x+r.w,r.y,z+h),P(r.x,r.y,z+h)],e=[P(r.x+r.w,r.y,z),P(r.x+r.w,r.y+r.h,z),P(r.x+r.w,r.y+r.h,z+h),P(r.x+r.w,r.y,z+h)];return poly(n,paint,'#617067','opacity=".94"')+poly(e,r.type==='bath'?'#d9e5e5':'#ddd5ca','#617067','opacity=".94"')};
  const furn=r=>{const z=r.floor*zStep+.10,items=[],rect=(x,y,w,h,c)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]].map(([a,b])=>P(a,b,z)),c,'#7a827e','opacity=".96"');if(r.type==='bed'){items.push(rect(r.x+r.w*.16,r.y+r.h*.18,r.w*.66,r.h*.52,'#f4efe7'));items.push(rect(r.x+r.w*.22,r.y+r.h*.20,r.w*.22,r.h*.12,'#fff'));}else if(r.type==='living'){items.push(rect(r.x+r.w*.10,r.y+r.h*.18,r.w*.58,r.h*.20,'#cfd7cf'));items.push(rect(r.x+r.w*.36,r.y+r.h*.55,r.w*.30,r.h*.18,'#c7b69b'));}else if(r.type==='kitchen'){items.push(rect(r.x+r.w*.06,r.y+r.h*.10,r.w*.88,r.h*.13,'#bca98d'));items.push(rect(r.x+r.w*.32,r.y+r.h*.52,r.w*.36,r.h*.20,'#e8e1d6'));}else if(r.type==='bath'){items.push(rect(r.x+r.w*.10,r.y+r.h*.14,r.w*.30,r.h*.26,'#dce9ea'));items.push(rect(r.x+r.w*.57,r.y+r.h*.58,r.w*.28,r.h*.24,'#edf3f3'));}else if(r.type==='stairs'){for(let i=0;i<8;i++)items.push(rect(r.x+r.w*.16,r.y+r.h*(.10+i*.09),r.w*.68,r.h*.045,'#d8d3c9'));}return items.join('')};
  const openingMarkup=p.plan.openings.map(o=>{const rr=idMap.get(o.roomId);if(!rr)return'';const z=rr.floor*zStep,w=Math.min(o.width||.9,o.side==='north'||o.side==='south'?rr.w:rr.h),off=BMH.clamp(o.offset??.3,0,1);if(o.side==='north'){const x=rr.x+(rr.w-w)*off,a=P(x,rr.y,z+(o.kind==='door'?0:.8)),b=P(x+w,rr.y,z+(o.kind==='door'?0:.8)),c=P(x+w,rr.y,z+(o.kind==='door'?2.1:1.9)),d=P(x,rr.y,z+(o.kind==='door'?2.1:1.9));return poly([a,b,c,d],o.kind==='door'?door:'#9fc7d6','#405850',`opacity="${o.kind==='door'?'.92':'.72'}"`)}if(o.side==='east'){const y=rr.y+(rr.h-w)*off,a=P(rr.x+rr.w,y,z+(o.kind==='door'?0:.8)),b=P(rr.x+rr.w,y+w,z+(o.kind==='door'?0:.8)),c=P(rr.x+rr.w,y+w,z+(o.kind==='door'?2.1:1.9)),d=P(rr.x+rr.w,y,z+(o.kind==='door'?2.1:1.9));return poly([a,b,c,d],o.kind==='door'?door:'#9fc7d6','#405850',`opacity="${o.kind==='door'?'.92':'.72'}"`)}return''}).join('');
  const sorted=[...rel].sort((a,b)=>(a.floor-b.floor)||((a.x+a.y)-(b.x+b.y)));
  const slabs=Array.from({length:maxF+1},(_,f)=>{const rs=rel.filter(r=>r.floor===f);if(!rs.length)return'';const mx=Math.max(...rs.map(r=>r.x+r.w)),my=Math.max(...rs.map(r=>r.y+r.h)),z=f*zStep;return poly([[0,0],[mx,0],[mx,my],[0,my]].map(([x,y])=>P(x,y,z-.10)),theme==='night'?'#2f3735':'#e6e3da','#6f7973','opacity=".68"')}).join('');
  const markup=sorted.map(r=>{const center=P(r.x+r.w/2,r.y+r.h/2,r.floor*zStep+.12);return `<g class="iso-room iso-${r.type}">${floorPoly(r)}${rearWalls(r)}${furn(r)}<text x="${center[0]}" y="${center[1]}" text-anchor="middle">${BMH.esc(r.name)}</text></g>`}).join('');
  const label=focus.startsWith('room:')?rooms[0]?.name:focus.startsWith('floor:')?`Tầng ${Number(focus.split(':')[1])+1}`:'Toàn bộ công trình';
  return `<svg viewBox="0 0 900 520" class="iso-svg iso-cutaway ${theme==='night'?'iso-night':''}" aria-label="Mô hình 3D phương án"><defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${theme==='night'?'#172331':'#dcebdd'}"/><stop offset="1" stop-color="${theme==='night'?'#2c3540':'#f6f3ea'}"/></linearGradient><filter id="shadow"><feDropShadow dx="0" dy="12" stdDeviation="10" flood-opacity=".18"/></filter></defs><rect width="900" height="520" fill="url(#sky)"/><ellipse cx="450" cy="430" rx="330" ry="62" fill="${theme==='night'?'#1e292c':'#dbe3d7'}" opacity=".8"/><g filter="url(#shadow)">${slabs}${markup}${openingMarkup}</g><g class="iso-title"><rect x="28" y="28" width="286" height="64" rx="16"/><text x="48" y="54">3D CUTAWAY · ${BMH.esc(label||'')}</text><text class="sub" x="48" y="76">Mặt bằng Bước 5 + vật liệu Bước 6${ui.sceneExploded?' · tách tầng':''}</text></g><g class="iso-materials"><rect x="637" y="28" width="235" height="88" rx="16"/><circle cx="663" cy="53" r="9" fill="${floor}"/><text x="681" y="57">Sàn · ${BMH.esc(p.materials.choices.floor)}</text><circle cx="663" cy="80" r="9" fill="${paint}"/><text x="681" y="84">Sơn · ${BMH.esc(p.materials.choices.paint)}</text><circle cx="663" cy="104" r="9" fill="${door}"/><text x="681" y="108">Cửa · ${BMH.esc(p.materials.choices.door)}</text></g><g class="iso-note"><rect x="30" y="444" width="312" height="45" rx="12"/><text x="48" y="464">Mô hình sơ bộ · mở mái để nhìn công năng</text><text class="sub" x="48" y="482">Không thay thế phối cảnh kiến trúc / BIM thi công</text></g></svg>`;
};

BMH.screen7 = () => {const ui=BMH.state.ui,review=BMH.designReview(),year=BMH.state.project.wearYear,roomOptions=BMH.state.project.plan.rooms.map(r=>`<option value="room:${r.id}" ${ui.sceneFocus===`room:${r.id}`?'selected':''}>T${r.floor+1} · ${BMH.esc(r.name)}</option>`).join(''),wear={0:['Hiện tại','Bề mặt mới, chưa có dấu hiệu hao mòn.',0,'new'],3:['Năm 3','Bạc màu nhẹ tại khu vực nắng gắt và ron chân tường bắt đầu xỉn.',19000000,'y3'],5:['Năm 5','Nứt chân chim cục bộ, bạc màu sơn và dấu thấm nhẹ tại điểm yếu.',35000000,'y5'],10:['Năm 10','Rêu mốc, bạc màu rõ, nứt bề mặt và nhu cầu bảo trì lớn hơn.',62000000,'y10']}[year];return `${BMH.hero(7,'Mô phỏng 3D','& đánh giá AI','Xem trước ngôi nhà, nội thất và tác động hao mòn theo thời gian trước khi quyết định.',{quote:'Nhìn thấy tương lai của ngôi nhà ngay từ hôm nay'})}<div class="visual-review"><aside class="review-score card"><h2>Đánh giá tổng thể</h2><div class="score-ring" style="--score:${review.overall}"><b>${review.overall}</b><span>/ 100</span></div><p>Phương án của bạn khá tốt!<br>Chỉ cần tối ưu một vài hạng mục.</p>${[['Ngân sách',review.budget],['Công năng',review.function],['Khí hậu',review.climate],['Vật liệu',review.material],['Phong thủy',review.feng],['Độ bền',review.durability]].map(([n,v])=>`<div class="score-row"><span>${n}</span><i><b style="width:${v}%"></b></i><em>${v}/100</em></div>`).join('')}</aside><section class="scene-center"><div class="scene-toolbar official-scene-toolbar"><div class="tabs"><button class="${ui.sceneMode==='reference'?'active':''}" data-scene-mode="reference">▣ 3D ngoại thất</button><button class="${ui.sceneMode==='model'?'active':''}" data-scene-mode="model">▱ 3D phương án</button><button data-wear="5" class="${year===5?'active':''}">◷ Hao mòn 5 năm</button><button data-wear="10" class="${year===10?'active':''}">◷ Hao mòn 10 năm</button></div><div class="scene-select"><button class="scene-explode ${ui.sceneExploded?'active':''}" data-scene-explode>⇳ ${ui.sceneExploded?'Ghép tầng':'Tách tầng'}</button><select data-scene-focus><option value="all">Toàn bộ công trình</option>${Array.from({length:BMH.state.project.site.floors},(_,i)=>`<option value="floor:${i}" ${ui.sceneFocus===`floor:${i}`?'selected':''}>Tầng ${i+1}</option>`).join('')}${roomOptions}</select></div></div><div class="scene-stage official-scene-stage">${ui.sceneMode==='model'?`<div class="scene-model premium-model wear-${wear[3]}">${BMH.isoModel()}<div class="model-glass"><b>3D PHƯƠNG ÁN</b><span>Geometry từ Bước 5 · vật liệu từ Bước 6</span></div></div>`:`<div class="reference-scene wear-${wear[3]} ${ui.sceneTheme==='night'?'night':''}"><div class="wear-badge">${wear[0]}</div><img src="assets/rooms/facade-render.jpg" alt="Phối cảnh"><div class="wear-overlay"></div><div class="weathering weathering-${wear[3]}"><i></i><i></i><i></i></div><div class="callout c1"><i>☀</i><b>Mặt Tây nhận nhiều nắng</b><span>Nên bố trí lam che</span></div><div class="callout c2"><i>◉</i><b>Ban công</b><span>Cần chống thấm kỹ</span></div><div class="callout c3"><i>≋</i><b>Phòng ngủ</b><span>Nên tăng thông gió</span></div></div>`}<button class="theme-toggle floating-theme" data-scene-theme>${ui.sceneTheme==='day'?'Ngày':'Đêm'}</button></div><div class="wear-summary"><b>Dự báo hao mòn sau ${year||0} năm</b><div><article><span class="wear-thumb crack"></span><b>Nứt chân tường</b><small>${year>=5?'Có thể xuất hiện cục bộ':'Nguy cơ thấp'}</small></article><article><span class="wear-thumb fade"></span><b>Bạc màu sơn</b><small>${year>=3?'Màu sơn có thể giảm độ tươi':'Chưa đáng kể'}</small></article><article><span class="wear-thumb damp"></span><b>Nguy cơ thấm nước</b><small>${year>=5?'Cần kiểm tra chi tiết ban công/WC':'Thấp'}</small></article></div></div></section><aside class="review-comments"><article class="card"><h2>✦ Nhận xét từ AI</h2><p>${review.issues.length?`Hệ thống phát hiện ${review.issues.length} lưu ý trên mặt bằng. ${BMH.esc(review.issues[0]?.text||'')}`:'Mặt bằng hiện không có xung đột hình học cơ bản. Tiếp tục kiểm tra ánh sáng, thông gió và chi tiết khu ướt.'}</p></article><article class="card"><h2>Nhận xét từ Kiến trúc sư</h2><p>Phương án cần cân bằng giữa thẩm mỹ, công năng và chi phí. Không gian mở nên kết hợp bóng râm và thông gió chéo.</p></article><article class="card feng-mini"><h2>◇ Nhận xét phong thủy</h2><div class="mini-score"><b>75</b><span>/100</span></div><p>Hướng tham khảo phù hợp: <b>${BMH.kua(BMH.state.project.household.ownerBirth,BMH.state.project.household.ownerGender)?.dirs?.[0]||'—'}</b></p></article></aside></div><section class="time-machine"><span class="eyebrow">TUA NHANH VÒNG ĐỜI</span><div class="wear-timeline">${[0,3,5,10].map(y=>`<button class="${year===y?'active':''}" data-wear="${y}"><i>${y===0?'●':y}</i><span>${y===0?'Hiện tại':`Năm ${y}`}</span></button>`).join('')}</div><div class="wear-info"><b>${wear[0]}</b><span>${wear[1]}</span><strong>${BMH.money(wear[2])}<em>quỹ bảo trì minh họa</em></strong></div></section>`};

BMH.screen8 = () => {const e=BMH.estimate(),paid=BMH.isUnlocked();const rows=[['Móng',e.shell*.25],['Kết cấu',e.shell*.45],['Tường & xây tô',e.shell*.30],['Điện nước (MEP)',e.finish*.22],['Hoàn thiện',e.finish*.58],['Nội thất',e.finish*.20],['Dự phòng',e.contingency]];return `${BMH.hero(8,'Dự toán','& thanh toán','Xem miễn phí dự toán tổng quan, sau đó mở khóa bước giám sát thi công.',{quote:'Dự toán minh bạch – Kiểm soát chi phí, an tâm thi công'})}<div class="estimate-official"><section class="estimate-left card">${BMH.cardTitle('Bảng dự toán tổng quan')}<div class="estimate-two"><div class="tablewrap"><table><thead><tr><th>Hạng mục</th><th>Giá trị</th><th>Tỷ trọng</th></tr></thead><tbody>${rows.map(([n,v])=>`<tr><td>${n}</td><td>${BMH.money(v)}</td><td>${Math.round(v/e.total*100)}%</td></tr>`).join('')}<tr class="total"><td>Tổng cộng</td><td>${BMH.money(e.total)}</td><td>100%</td></tr></tbody></table></div><div class="cost-structure"><h3>Cơ cấu chi phí xây dựng</h3><div class="donut" style="--shell:${Math.round(e.shell/e.total*100)};--finish:${Math.round(e.finish/e.total*100)}"><b>${BMH.num(e.total/1000000,0)}</b><small>triệu VND</small></div><div class="legend"><span><i class="l1"></i>Phần thô <b>${Math.round(e.shell/e.total*100)}%</b></span><span><i class="l2"></i>Hoàn thiện <b>${Math.round(e.finish/e.total*100)}%</b></span><span><i class="l3"></i>Dự phòng <b>${Math.round(e.contingency/e.total*100)}%</b></span></div></div></div><div class="budget-compare official-budget"><article><small>Ngân sách của bạn</small><b>${BMH.money(e.budget)}</b></article><article><small>Tổng dự toán</small><b>${BMH.money(e.total)}</b></article><article class="${e.gap>=0?'good':'bad'}"><small>${e.gap>=0?'Còn dư khoảng':'Vượt ngân sách'}</small><b>${BMH.money(Math.abs(e.gap))}</b></article></div><div class="recommendations"><div><h3>Nhà thầu gợi ý tại ${BMH.state.project.site.province}</h3><span>★ 4.8 · An Phát &nbsp;&nbsp; ★ 4.7 · Kiến Tạo Việt</span></div><div><h3>Nhà cung cấp vật liệu uy tín</h3><span>Dulux · INSEE · INAX · Viglacera</span></div></div></section><aside class="pay-card official-pay ${paid?'paid':''}"><div class="pay-title"><i>${paid?'✓':'🔒'}</i><div><h2>${paid?'Đã mở khóa hồ sơ':'Xuất Trọn Bộ Hồ Sơ & Mở Khóa Giám Sát Thi Công'}</h2><p>${paid?'Quyền truy cập premium đã được xác nhận.':'Thanh toán một lần — mở khóa ngay Bước 9 và nhận trọn bộ hồ sơ chuyên sâu.'}</p><strong>${paid?'ĐÃ THANH TOÁN':'Chỉ 99.000đ'}</strong></div></div>${paid?`<div class="paid-state"><div class="rights"><span>✓ Checklist MEP</span><span>✓ Giám sát thi công</span><span>✓ PDF / Excel / ZIP</span></div><button class="clay" data-nav="9">Đi tới Bước 9 ${BMH.icon('arrow')}</button></div>`:`<div class="payment-box"><div class="qr-wrap"><img src="assets/design/vietqr-demo.png" alt="VietQR demo"><b>VietQR DEMO</b><small>Chưa cấu hình tài khoản nhận tiền thật</small></div><div class="bank-info"><dl><div><dt>Ngân hàng</dt><dd>MB Bank (MBB)</dd></div><div><dt>Số tài khoản</dt><dd>Chưa cấu hình</dd></div><div><dt>Số tiền</dt><dd>99.000 VND</dd></div><div><dt>Nội dung</dt><dd>BMH DEMO</dd></div></dl><button data-copy="BMH DEMO">Sao chép nội dung chuyển khoản</button></div></div><div class="payment-steps"><span><i>1</i>Tạo đơn thanh toán</span><span><i>2</i>Quét VietQR</span><span><i>3</i>Webhook xác nhận</span><span><i>4</i>Tự động mở khóa</span></div><div class="payment-actions"><button class="clay" disabled>Thanh toán ngay</button><button class="secondary" data-export="estimate">Xuất dự toán miễn phí</button></div><div class="pay-alert">🔒 Bước 9 và 10 đang khóa cho đến khi thanh toán thành công.</div>${BMH.DEV?'<button class="dev-pay" data-dev-pay>DEV local: mô phỏng thanh toán thành công</button>':''}`}</aside></div>`};

BMH.screen9 = () => {if(!BMH.isUnlocked())return BMH.lockedScreen(9);const c=BMH.state.project.checklist,items=[['pipe114','Ống thoát toilet Φ114 (độ dốc ≥ 1%)'],['acWire','Dây điện máy lạnh 4.0 mm² đi riêng'],['pressure','Test áp lực ống nước theo hồ sơ kỹ thuật'],['internet','Ống chờ internet/camera'],['elcb','Tiếp địa & chống rò ELCB/RCBO']];const stages=[['Móng','♨'],['Kết cấu','▦'],['Tường','▤'],['Mái','⌂'],['Điện nước','⌁'],['Hoàn thiện','▥'],['Nội thất & bàn giao','▱']];return `<div class="success-banner">✓ <div><b>Thanh toán thành công — Bước 9 đã mở khóa</b><span>Bạn có thể sử dụng đầy đủ tính năng giám sát thi công, checklist MEP và cập nhật tiến độ dự án.</span></div></div>${BMH.hero(9,'Giám sát thi công','& checklist MEP','Giám sát tiến độ, chất lượng và nghiệm thu các hạng mục kỹ thuật.',{banner:false})}<div class="construction-stages">${stages.map(([n,ico],i)=>`<span class="${i===1?'active':''}"><i>${ico}</i><b>${i+1}. ${n}</b></span>`).join('')}</div><div class="supervision-official"><section class="card schedule-card"><h2>Kế hoạch thi công & giải ngân</h2><div class="tablewrap"><table><thead><tr><th>STT</th><th>Hạng mục thi công</th><th>Thời gian dự kiến</th><th>Tỷ lệ</th><th>Số tiền</th></tr></thead><tbody>${[['Móng','Tháng 03/2026',10],['Kết cấu','Tháng 04–05/2026',20],['Tường','Tháng 06/2026',15],['Mái','Tháng 07/2026',10],['Điện nước','Tháng 08/2026',15],['Hoàn thiện','Tháng 09–10/2026',20],['Nội thất & bàn giao','Tháng 11/2026',10]].map((r,i)=>`<tr class="${i===1?'highlight':''}"><td>${i+1}</td><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}%</td><td>${BMH.money(BMH.estimate().total*r[2]/100)}</td></tr>`).join('')}<tr class="total"><td colspan="3">Tổng cộng</td><td>100%</td><td>${BMH.money(BMH.estimate().total)}</td></tr></tbody></table></div></section><section class="card progress-card"><h2>Tiến độ thi công hiện tại</h2><div class="site-photo"></div><div class="progress-figure"><b>35%</b><i><span style="width:35%"></span></i></div><dl><div><dt>Hạng mục hiện tại</dt><dd>Kết cấu</dd></div><div><dt>Dự kiến hoàn thành</dt><dd>Tháng 05/2026</dd></div></dl><div class="month-budget"><b>Kế hoạch chuẩn bị ngân sách theo tháng</b><div><span>T03<br><strong>150tr</strong></span><span>T04<br><strong>200tr</strong></span><span>T05<br><strong>100tr</strong></span><span>T06<br><strong>225tr</strong></span></div></div></section><section class="card checklist official-checklist"><h2>Checklist kỹ thuật MEP</h2>${items.map(([k,n])=>`<label><input type="checkbox" data-check="${k}" ${c[k]?'checked':''}><span>${n}</span></label>`).join('')}<button class="clay" data-print>${BMH.icon('download')} Tải checklist (PDF)</button><small>Đối chiếu hồ sơ kỹ thuật và nghiệm thu thực tế trước khi ký xác nhận.</small></section></div>`};

BMH.screen10 = () => {if(!BMH.isUnlocked())return BMH.lockedScreen(10);const e=BMH.estimate();return `${BMH.hero(10,'Hồ sơ bàn giao','& giải ngân','Tải trọn bộ hồ sơ, kế hoạch giải ngân và tài liệu bàn giao sau khi hoàn tất hành trình.',{quote:'Một hành trình đẹp kết thúc bằng một tổ ấm trọn vẹn'})}<div class="handover-official"><section class="handover-main"><div class="card download-center"><div class="between">${BMH.cardTitle('Trung tâm tải hồ sơ','Tải từng tài liệu hoặc tải trọn bộ để lưu lại toàn bộ hồ sơ dự án của bạn.')}<span class="ready-pill">✓ Sẵn sàng bàn giao</span></div><div class="download-grid official-downloads"><button data-print><i>PDF</i><b>Hồ sơ tổng hợp</b><span>Toàn bộ hồ sơ dự án</span><em>Tải xuống</em></button><button data-export="estimate"><i>X</i><b>Bóc tách chi phí</b><span>Dự toán & thanh toán</span><em>Tải xuống</em></button><button data-print><i>PDF</i><b>Checklist MEP</b><span>Danh mục kiểm tra</span><em>Tải xuống</em></button><button data-export="plan"><i>SVG</i><b>Hồ sơ vật liệu & mặt bằng</b><span>Thông số & bản vẽ vector</span><em>Tải xuống</em></button><button data-export="json"><i>JSON</i><b>Dữ liệu dự án</b><span>Bản sao dữ liệu</span><em>Tải xuống</em></button></div></div><div class="handover-bottom"><section class="card"><h2>Kế hoạch giải ngân & bàn giao</h2><div class="tablewrap"><table><thead><tr><th>Giai đoạn</th><th>Tỷ lệ thanh toán</th><th>Số tiền</th><th>Mốc nghiệm thu</th></tr></thead><tbody>${[['Ký hợp đồng',10,'Ký hợp đồng & tạm ứng'],['Thi công phần móng',15,'Nghiệm thu móng'],['Thi công phần thô',20,'Nghiệm thu kết cấu thô'],['Thi công MEP',15,'Nghiệm thu hệ thống MEP'],['Thi công hoàn thiện',20,'Nghiệm thu hoàn thiện'],['Lắp đặt thiết bị',10,'Nghiệm thu thiết bị'],['Nghiệm thu tổng thể',5,'Bàn giao'],['Giữ lại bảo hành',5,'Sau thời hạn bảo hành']].map(r=>`<tr><td>${r[0]}</td><td>${r[1]}%</td><td>${BMH.money(e.total*r[1]/100)}</td><td>${r[2]}</td></tr>`).join('')}<tr class="total"><td>Tổng cộng</td><td>100%</td><td>${BMH.money(e.total)}</td><td>—</td></tr></tbody></table></div></section><section class="card handover-check"><h2>Bàn giao công trình</h2>${['Hồ sơ hoàn công','Danh sách vật liệu đã dùng','Bảo hành','Thiết bị điện nước','Hướng dẫn vận hành','Hình ảnh nghiệm thu'].map(x=>`<span>✓ <b>${x}</b></span>`).join('')}<div class="info-strip green">✓ Tất cả tài liệu đã được tập hợp. Hãy kiểm tra pháp lý và nghiệm thu thực tế trước khi ký bàn giao.</div></section></div></section><aside class="handover-side"><div class="card completion"><i>✓</i><div><h2>Hoàn thành hành trình!</h2><p>Ngôi nhà mơ ước của bạn đã sẵn sàng bước sang giai đoạn triển khai thực tế.</p></div></div><div class="card finance-summary"><h2>Tổng quan tài chính</h2><dl><div><dt>Tổng chi phí</dt><dd>${BMH.money(e.total)}</dd></div><div><dt>Dự phòng còn lại</dt><dd>${BMH.money(Math.max(0,e.gap))}</dd></div><div><dt>Bảo hành giữ lại 5%</dt><dd>${BMH.money(e.total*.05)}</dd></div></dl><h3>Trạng thái dự án <span>Sẵn sàng bàn giao</span></h3><p>Dữ liệu dự án đã được tổng hợp và có thể tải xuống để tiếp tục làm việc với kiến trúc sư, kỹ sư và nhà thầu.</p><button class="clay" data-export="bundle">${BMH.icon('download')} Tải trọn bộ hồ sơ</button><button class="secondary" data-print>Xuất báo cáo cuối cùng</button></div></aside></div>`};

BMH.lockedScreen = step => `${BMH.hero(step,step===9?'Giám sát thi công':'Hồ sơ bàn giao','đang khóa','Quyền truy cập premium được khóa chung và chỉ mở sau khi thanh toán được xác nhận.',{banner:false})}<section class="locked-panel"><div>🔒</div><h2>Bước ${step} đang khóa</h2><p>Vui lòng hoàn tất thanh toán 99.000đ tại Bước 8 để mở khóa checklist, giám sát và hồ sơ bàn giao.</p><button class="clay" data-nav="8">Quay về Bước 8</button></section>`;
BMH.SCREENS=[BMH.screen1,BMH.screen2,BMH.screen3,BMH.screen4,BMH.screen5,BMH.screen6,BMH.screen7,BMH.screen8,BMH.screen9,BMH.screen10];


/* ---- 60_app.js ---- */
BMH.app = BMH.$('#app');
BMH.sidebar = () => `<aside class="sidebar ${BMH.state.ui.sidebarCollapsed?'collapsed':''}"><button class="collapse" data-sidebar aria-label="Thu gọn/mở rộng">${BMH.state.ui.sidebarCollapsed?'›':'‹'}</button><div class="side-brand-mini"><img src="assets/icon.svg"><span>Build My Home</span></div><nav><button data-nav="1" class="${BMH.state.ui.step===1?'active':''}">${BMH.icon('home')}<span>Trang chủ</span></button><button>${BMH.icon('user')}<span>Hồ sơ của tôi</span></button><button>${BMH.icon('folder')}<span>Dự án</span></button><button>${BMH.icon('image')}<span>Thư viện mẫu</span></button><button>${BMH.icon('users')}<span>Nhà thầu</span></button><button data-nav="6">${BMH.icon('cube')}<span>Vật liệu</span></button><button>${BMH.icon('book')}<span>Kiến thức</span></button><button>${BMH.icon('gear')}<span>Cài đặt</span></button></nav><div class="side-quote"><b>⌂</b><span>Ngôi nhà tốt hơn<br>một cuộc sống đẹp hơn</span></div></aside>`;
BMH.header = () => `<header class="topbar"><div class="brand"><img src="assets/icon.svg" alt=""><div><b>Build My Home</b><span>Kiến tạo tổ ấm, vững bền tương lai</span></div></div><div class="header-actions"><button class="location-chip" data-nav="3">${BMH.icon('pin')} ${BMH.esc(BMH.state.project.site.province)}</button><span class="lang">◎ Tiếng Việt</span><button class="icon-btn">${BMH.icon('bell')}</button><div class="profile"><span class="avatar">N</span><div><b>Nguyễn Thị Lan</b><small>Gia đình nhỏ, Ước mơ lớn</small></div></div></div></header>`;
BMH.stepper = () => `<nav class="stepper">${BMH.STEPS.map(([short],i)=>{const n=i+1,locked=n>=9&&!BMH.isUnlocked(),active=BMH.state.ui.step===n,done=n<BMH.state.ui.step&&!locked;return `<button data-nav="${n}" class="step ${active?'active':''} ${done?'done':''} ${locked?'locked':''}" ${locked?'aria-label="Bước đang khóa"':''}><i>${locked?'🔒':done?'✓':n}</i><span>${short}</span></button>`}).join('')}</nav>`;
BMH.footer = () => {const step=BMH.state.ui.step,next=step+1,blocked=step===8&&!BMH.isUnlocked(),e=BMH.estimate();return `<div class="step-footer official-footer"><button class="footer-back" data-nav="${step-1}" ${step===1?'disabled':''}>${BMH.icon('back')} Quay lại</button><div class="footer-budget"><span><small>Ngân sách tối đa</small><b>${BMH.money(e.budget)}</b></span><span><small>Dự toán hiện tại</small><b>${BMH.money(e.total)}</b></span><span class="${e.gap>=0?'good':'bad'}"><small>${e.gap>=0?'Còn dự phòng':'Vượt ngân sách'}</small><b>${BMH.money(Math.abs(e.gap))}</b></span></div>${step<10?`<button class="primary footer-next" data-nav="${next}" ${blocked?'disabled title="Hoàn tất thanh toán để tiếp tục"':''}>${blocked?'🔒 Hoàn tất thanh toán':'Tiếp theo'} ${BMH.icon('arrow')}</button>`:'<button class="primary footer-next" disabled>Hoàn thành</button>'}</div>`};
BMH.amountBar = () => {const e=BMH.estimate();return `<div class="amountbar"><div><small>Ngân sách tối đa</small><strong>${BMH.money(e.budget)}</strong></div><div><small>Dự toán hiện tại</small><strong class="${e.total>e.budget?'bad':''}">${BMH.money(e.total)}</strong></div><div><small>${e.gap>=0?'Còn dự phòng':'Vượt ngân sách'}</small><strong class="${e.gap>=0?'good':'bad'}">${BMH.money(Math.abs(e.gap))}</strong></div></div>`};
BMH.render = ({preserveScroll=false}={}) => {
  const sy=window.scrollY, step=BMH.state.ui.step; const screen=BMH.SCREENS[step-1]||BMH.screen1;
  BMH.app.innerHTML=`${BMH.header()}${BMH.sidebar()}<main class="main ${step===5?'planner-page':''}">${BMH.stepper()}<div class="screen">${screen()}</div>${BMH.footer()}</main>`;
  document.documentElement.dataset.version=BMH.VERSION; document.title=`Build My Home · ${BMH.STEPS[step-1][1]}`;
  if(preserveScroll)window.scrollTo(0,sy); requestAnimationFrame(BMH.afterRender);
};
BMH.navigateTo = step => {
  step=BMH.clamp(Number(step)||1,1,10); if(step>=9&&!BMH.isUnlocked()){BMH.state.ui.step=8;BMH.save();BMH.render();BMH.toast('Bước 9 và 10 chỉ mở sau khi thanh toán được xác nhận.');return false;}
  BMH.state.ui.step=step; if(step!==5){BMH.drag=null;BMH.state.ui.planner.tool='select';} BMH.save(); BMH.render(); window.scrollTo({top:0,behavior:'smooth'}); return true;
};
BMH.openPaywall = () => {BMH.navigateTo(8);BMH.toast('Hoàn tất thanh toán tại Bước 8 để mở hồ sơ premium.');};
BMH.afterRender = () => {
  if(BMH.state.ui.step===3) BMH.initMap();
  if(BMH.state.ui.step===5 && window.innerWidth>1180 && !BMH.state.ui.sidebarCollapsed){BMH.state.ui.sidebarCollapsed=true;BMH.save();BMH.render();}
};
BMH.initMap = () => {
  const el=BMH.$('#map'); if(!el)return; const s=BMH.state.project.site, r=BMH.REGIONS[s.province]||BMH.REGIONS['Bình Dương'];
  try{
    if(BMH.map){BMH.map.remove();BMH.map=null;}
    if(!window.L)throw new Error('Leaflet unavailable');
    BMH.map=L.map(el,{zoomControl:true,preferCanvas:true}).setView([s.lat,s.lng],r.zoom||12);
    let switched=false,errors=0;
    const addLayer=(url,attr)=>{const layer=L.tileLayer(url,{maxZoom:19,attribution:attr,keepBuffer:4,updateWhenIdle:false}).addTo(BMH.map);layer.on('load',()=>{el.classList.remove('map-loading','fallback-only')});layer.on('tileerror',()=>{errors++;if(errors>=5&&!switched){switched=true;BMH.map.removeLayer(layer);errors=0;addLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png','© OpenStreetMap contributors');}else if(errors>=10){el.classList.add('fallback-only');}});return layer;};
    addLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png','© OpenStreetMap contributors © CARTO');
    BMH.mapMarker=L.marker([s.lat,s.lng]).addTo(BMH.map).bindPopup(`${BMH.esc(s.district||'')} · ${BMH.esc(s.province)}`).openPopup();
    setTimeout(()=>BMH.map?.invalidateSize(true),120); setTimeout(()=>BMH.map?.invalidateSize(true),450);
    window.addEventListener('resize',BMH.mapResize,{once:true});
  } catch(e){el.classList.remove('map-loading');el.classList.add('fallback-only');}
};
BMH.mapResize = () => BMH.map?.invalidateSize(true);

BMH.app.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]'); if(nav){e.preventDefault();BMH.navigateTo(nav.dataset.nav);return;}
  const start=e.target.closest('[data-start]'); if(start){BMH.state.project.source=start.dataset.start;BMH.save(); if(start.dataset.start==='photo')BMH.$('#uploadPhoto')?.click(); else if(start.dataset.start==='plan')BMH.$('#uploadPlan')?.click(); else BMH.navigateTo(2); return;}
  if(e.target.closest('[data-sidebar]')){BMH.state.ui.sidebarCollapsed=!BMH.state.ui.sidebarCollapsed;BMH.save();BMH.render();return;}
  const bank=e.target.closest('[data-bank]'); if(bank){const b=BMH.BANKS.find(x=>x.id===bank.dataset.bank);if(b){Object.assign(BMH.state.project.finance,{bank:b.id,introRate:b.intro,postRate:b.post,promoMonths:b.months});BMH.save();BMH.render();BMH.toast(`Đã nạp kịch bản ${b.name}; vẫn có thể chỉnh tay.`);}return;}
  if(e.target.closest('[data-map-refresh]')){const s=BMH.state.project.site,pt=BMH.regionPoint(s.province,s.district);Object.assign(s,{lat:pt.lat,lng:pt.lng,district:pt.district});BMH.save();BMH.render();return;}
  const nearby=e.target.closest('[data-nearby]');if(nearby){const s=BMH.state.project.site;s.district=nearby.dataset.nearby;s.lat=Number(nearby.dataset.lat);s.lng=Number(nearby.dataset.lng);BMH.save();BMH.render();return;}
  const soil=e.target.closest('[data-soil]');if(soil){BMH.state.project.site.soil=soil.dataset.soil;BMH.save();BMH.render();return;}
  const addPerson=e.target.closest('[data-household-add]');if(addPerson){const h=BMH.state.project.household;if(addPerson.dataset.householdAdd==='child')h.children.push({id:BMH.uid('c'),name:`Con ${h.children.length+1}`,birth:new Date().getFullYear()-8,room:'Riêng'});else h.relatives.push({id:BMH.uid('p'),name:`Người thân ${h.relatives.length+1}`,birth:1960,mobility:'Bình thường'});BMH.save();BMH.render();return;}
  const rem=e.target.closest('[data-person-remove]');if(rem){const h=BMH.state.project.household,key=rem.dataset.personRemove==='child'?'children':'relatives';h[key]=h[key].filter(x=>x.id!==rem.dataset.id);BMH.save();BMH.render();return;}

  const dtab=e.target.closest('[data-design-tab]');if(dtab){BMH.state.ui.designTab=dtab.dataset.designTab;BMH.save();BMH.render();return;}
  const mview=e.target.closest('[data-material-view]');if(mview&&!mview.disabled){BMH.state.ui.materialCategory=mview.dataset.materialView;BMH.save();BMH.render();return;}
  const floor=e.target.closest('[data-floor]');if(floor){BMH.state.ui.planner.floor=Number(floor.dataset.floor);const first=BMH.floorRooms()[0];BMH.state.ui.planner.selected=first?.id||null;BMH.save();BMH.render();return;}
  const room=e.target.closest('[data-room-select]');if(room){BMH.state.ui.planner.selected=room.dataset.roomSelect;BMH.state.ui.planner.tool='select';BMH.save();BMH.render();return;}
  const wallPlace=e.target.closest('[data-wall-place]');if(wallPlace&&BMH.state.ui.planner.tool!=='select'){const svg=BMH.$('#plannerSvg');if(svg){BMH.placeOpeningAt(BMH.state.ui.planner.tool,wallPlace.dataset.room,wallPlace.dataset.side,BMH.svgPoint(e,svg));}return;}
  const planTool=e.target.closest('[data-plan-tool]');if(planTool){BMH.state.ui.planner.tool=planTool.dataset.planTool;BMH.save();BMH.render();return;}
  const addRoom=e.target.closest('[data-add-room]');if(addRoom){BMH.addRoom(addRoom.dataset.addRoom);return;}
  const opening=e.target.closest('[data-add-opening]');if(opening){BMH.addOpening(opening.dataset.addOpening);return;}
  const openingDelete=e.target.closest('[data-opening-delete]');if(openingDelete){BMH.pushPlanHistory();BMH.state.project.plan.openings=BMH.state.project.plan.openings.filter(o=>o.id!==openingDelete.dataset.openingDelete);BMH.save();BMH.render();return;}
  if(e.target.closest('[data-room-delete]')){BMH.pushPlanHistory();const id=BMH.state.ui.planner.selected;BMH.state.project.plan.rooms=BMH.state.project.plan.rooms.filter(r=>r.id!==id);BMH.state.project.plan.openings=BMH.state.project.plan.openings.filter(o=>o.roomId!==id);BMH.state.ui.planner.selected=BMH.floorRooms()[0]?.id||null;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-plan-undo]')){BMH.undoPlan();return;}
  if(e.target.closest('[data-plan-redo]')){BMH.redoPlan();return;}
  const zoomBtn=e.target.closest('[data-planner-zoom]');if(zoomBtn){const ui=BMH.state.ui.planner;ui.zoom=BMH.clamp(ui.zoom+(zoomBtn.dataset.plannerZoom==='in'?.15:-.15),.75,2.5);BMH.save();BMH.render();return;}
  if(e.target.closest('[data-planner-fit]')){BMH.state.ui.planner.zoom=1;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-planner-fullscreen]')){const el=BMH.$('.technical-sheet'); if(el?.requestFullscreen) el.requestFullscreen().catch(()=>BMH.toast('Trình duyệt không cho phép toàn màn hình.')); return;}
  const tier=e.target.closest('[data-tier]');if(tier){const before=BMH.estimate().total;BMH.state.project.materials.tier=tier.dataset.tier;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const material=e.target.closest('[data-material]');if(material){const before=BMH.estimate().total,cat=material.dataset.materialCat;BMH.state.project.materials.choices[cat]=material.dataset.material;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const sm=e.target.closest('[data-scene-mode]');if(sm){BMH.state.ui.sceneMode=sm.dataset.sceneMode;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-scene-explode]')){BMH.state.ui.sceneExploded=!BMH.state.ui.sceneExploded;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-scene-theme]')){BMH.state.ui.sceneTheme=BMH.state.ui.sceneTheme==='day'?'night':'day';BMH.save();BMH.render();return;}
  const wear=e.target.closest('[data-wear]');if(wear){BMH.state.project.wearYear=Number(wear.dataset.wear);BMH.save();BMH.render();return;}
  const copy=e.target.closest('[data-copy]');if(copy){navigator.clipboard?.writeText(copy.dataset.copy).then(()=>BMH.toast('Đã sao chép.')).catch(()=>BMH.toast('Không thể sao chép tự động.'));return;}
  if(e.target.closest('[data-dev-pay]')&&BMH.DEV){BMH.state.access.paid=!BMH.state.access.paid;BMH.state.access.source=BMH.state.access.paid?'dev-local':'none';BMH.state.access.paidAt=BMH.state.access.paid?new Date().toISOString():null;BMH.save();BMH.render();return;}
  const exp=e.target.closest('[data-export]');if(exp){({loan:BMH.exportLoan,estimate:BMH.exportEstimate,plan:BMH.exportPlanSvg,json:BMH.exportProjectJson,bundle:BMH.exportBundle}[exp.dataset.export]?.());return;}
  if(e.target.closest('[data-print]')){window.print();return;}
});

BMH.app.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.path){let v=t.type==='number'?Number(t.value)*(Number(t.dataset.scale)||1):t.value;const path=t.dataset.path;if(path==='project.site.province'){const r=BMH.REGIONS[v];BMH.state.project.site.province=v;if(r){const pt=BMH.regionPoint(v,r.defaultDistrict);Object.assign(BMH.state.project.site,{district:pt.district,lat:pt.lat,lng:pt.lng});}BMH.save();BMH.render();return;}if(path==='project.site.district'){BMH.state.project.site.district=v;const pt=BMH.regionPoint(BMH.state.project.site.province,v);BMH.state.project.site.lat=pt.lat;BMH.state.project.site.lng=pt.lng;BMH.save();BMH.render();return;}BMH.set(path,v);return;}
  if(t.dataset.person){const h=BMH.state.project.household,list=t.dataset.person==='child'?h.children:h.relatives,p=list.find(x=>x.id===t.dataset.id);if(p){p[t.dataset.key]=t.type==='number'?Number(t.value):t.value;BMH.save();BMH.render();}return;}
  if(t.dataset.planner){const ui=BMH.state.ui.planner;if(t.dataset.planner==='snap')ui.snap=Number(t.value);if(t.dataset.planner==='furniture')ui.showFurniture=t.checked;if(t.dataset.planner==='dimensions')ui.showDimensions=t.checked;if(t.dataset.planner==='feng')ui.showFeng=t.checked;BMH.save();BMH.render();return;}
  if(t.dataset.roomField){const r=BMH.selectedRoom();if(!r)return;BMH.pushPlanHistory();const key=t.dataset.roomField,old={...r};r[key]=['x','y','w','h'].includes(key)?Number(t.value):t.value;if(['x','y','w','h'].includes(key)){r[key]=BMH.roundTo(r[key],BMH.state.ui.planner.snap);if(!BMH.roomValid(r)){Object.assign(r,old);BMH.toast('Giá trị mới gây chồng phòng hoặc vượt ranh.');}}BMH.save();BMH.render();return;}
  if(t.dataset.openingField){const o=BMH.state.project.plan.openings.find(x=>x.id===t.dataset.openingId);if(o){const old={...o};BMH.pushPlanHistory();o[t.dataset.openingField]=['width','offset'].includes(t.dataset.openingField)?Number(t.value):t.value;if(!BMH.openingFits(o,o.id)){Object.assign(o,old);BMH.planHistory.undo.pop();BMH.toast('Kích thước/vị trí ô mở đang trùng hoặc vượt chiều dài tường.');}BMH.save();BMH.render();}return;}
  if(t.matches('[data-scene-focus]')){BMH.state.ui.sceneFocus=t.value;BMH.save();BMH.render();return;}
  if(t.dataset.check){BMH.state.project.checklist[t.dataset.check]=t.checked;BMH.save();return;}
});

BMH.app.addEventListener('pointerdown',e=>{
  if(BMH.state.ui.step!==5||BMH.state.ui.planner.tool!=='select')return;
  const edge=e.target.closest('[data-edge-id]'),handle=e.target.closest('[data-resize-id]'),group=e.target.closest('[data-room-id]');
  const id=edge?.dataset.edgeId||handle?.dataset.resizeId||group?.dataset.roomId;if(!id)return;
  const r=BMH.state.project.plan.rooms.find(x=>x.id===id);if(!r)return;const svg=BMH.$('#plannerSvg');if(!svg)return;
  const rect=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;
  BMH.drag={id,mode:edge?'edge':handle?'resize':'move',side:edge?.dataset.edgeSide||null,startX:e.clientX,startY:e.clientY,scaleX:vb.width/rect.width,scaleY:vb.height/rect.height,originalPlan:BMH.planSnapshot(),changed:false,historyPushed:false,raf:false};
  BMH.state.ui.planner.selected=id;e.preventDefault();
});
window.addEventListener('pointermove',e=>{
  const d=BMH.drag;if(!d)return;const dx=(e.clientX-d.startX)*d.scaleX,dy=(e.clientY-d.startY)*d.scaleY,s=BMH.state.ui.planner.snap,site=BMH.state.project.site;
  let candidate=structuredClone(d.originalPlan.rooms),r=candidate.find(x=>x.id===d.id);if(!r)return;
  if(d.mode==='move'){r.x=BMH.clamp(BMH.roundTo(r.x+dx,s),0,site.width-r.w);r.y=BMH.clamp(BMH.roundTo(r.y+dy,s),0,site.depth-r.h);}
  else if(d.mode==='resize'){r.w=BMH.clamp(BMH.roundTo(r.w+dx,s),.6,site.width-r.x);r.h=BMH.clamp(BMH.roundTo(r.h+dy,s),.6,site.depth-r.y);}
  else {const delta=BMH.roundTo((d.side==='east'||d.side==='west')?dx:dy,s);candidate=BMH.edgeMoveCandidate(d.originalPlan.rooms,d.id,d.side,delta);}
  if(!candidate||!BMH.layoutValid(candidate))return;
  if(!d.historyPushed){BMH.planHistory.undo.push(structuredClone(d.originalPlan));if(BMH.planHistory.undo.length>30)BMH.planHistory.undo.shift();BMH.planHistory.redo.length=0;d.historyPushed=true;}
  BMH.state.project.plan.rooms=candidate;d.changed=true;
  if(!d.raf){d.raf=true;requestAnimationFrame(()=>{d.raf=false;BMH.render({preserveScroll:true});});}
});
window.addEventListener('pointerup',()=>{const d=BMH.drag;if(!d)return;BMH.drag=null;if(d.changed){BMH.save();BMH.render({preserveScroll:true});}});

document.addEventListener('keydown',e=>{
  if(BMH.state.ui.step!==5)return;
  const tag=(e.target?.tagName||'').toLowerCase();if(tag==='input'||tag==='select'||tag==='textarea')return;
  if(e.key==='Escape'&&BMH.state.ui.planner.tool!=='select'){BMH.state.ui.planner.tool='select';BMH.save();BMH.render();BMH.toast('Đã trở về công cụ chọn.');return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?BMH.redoPlan():BMH.undoPlan();}
});

BMH.$('#uploadPhoto')?.addEventListener('change',e=>{if(e.target.files?.[0]){BMH.toast('Đã nhận ảnh tham khảo. Tiếp tục nhập thông tin dự án.');BMH.navigateTo(2);}});
BMH.$('#uploadPlan')?.addEventListener('change',e=>{if(e.target.files?.[0]){BMH.toast('Đã nhận bản vẽ tham chiếu. Bạn có thể đối chiếu ở Bước 5.');BMH.navigateTo(2);}});

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')BMH.save();}); window.addEventListener('pagehide',BMH.save);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
globalThis.BuildMyHome=BMH;
if(BMH.DEV){const q=new URLSearchParams(location.search);const qs=Number(q.get('step'));if(qs>=1&&qs<=10)BMH.state.ui.step=qs;if(q.get('unlock')==='1'){BMH.state.access.paid=true;BMH.state.access.source='dev-query';}}
BMH.render();

})();
