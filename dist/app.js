/* Build My Home V2.2 Refactored Core
 * One state controller · one navigation controller · one planner controller · one runtime bundle.
 * Generated from src/*.js. Do not patch public/app.js directly.
 */
(()=>{
'use strict';

/* ---- 00_boot.js ---- */
const BMH = {
  VERSION: '2.2.0',
  STORAGE_KEY: 'bmh-v22-refactored',
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
  'Bình Dương': {lat:11.160, lng:106.650, climate:'Nhiệt đới gió mùa', flood:'Trung bình', storm:'Thấp - Trung bình', labor:'350.000 – 500.000 đ/ngày'},
  'TP. Hồ Chí Minh': {lat:10.7769,lng:106.7009,climate:'Nhiệt đới gió mùa',flood:'Trung bình - Cao',storm:'Thấp',labor:'400.000 – 600.000 đ/ngày'},
  'Đà Nẵng': {lat:16.0544,lng:108.2022,climate:'Nhiệt đới gió mùa',flood:'Trung bình',storm:'Trung bình - Cao',labor:'350.000 – 500.000 đ/ngày'},
  'Hà Nội': {lat:21.0278,lng:105.8342,climate:'Cận nhiệt đới ẩm',flood:'Trung bình',storm:'Trung bình',labor:'400.000 – 600.000 đ/ngày'},
  'Đồng Nai': {lat:10.9574,lng:106.8426,climate:'Nhiệt đới gió mùa',flood:'Trung bình',storm:'Thấp - Trung bình',labor:'350.000 – 500.000 đ/ngày'},
  'Long An': {lat:10.6956,lng:106.2431,climate:'Nhiệt đới gió mùa',flood:'Trung bình - Cao',storm:'Thấp',labor:'330.000 – 480.000 đ/ngày'}
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
  ui: {step:1, sidebarCollapsed:false, planner:{floor:0,selected:'r1',snap:.2,zoom:1,mode:'technical',showFurniture:true,showDimensions:true,showFeng:true}, sceneMode:'model', sceneTheme:'day', sceneFocus:'all'},
  access: {paid:false, source:'none', paidAt:null},
  project: {
    name:'Nhà của mình', source:'suggest', style:'Hiện đại',
    site:{province:'Bình Dương',district:'Thủ Dầu Một',address:'',lat:11.160,lng:106.650,width:5,depth:20,floors:2,road:4,soil:'Đất thịt đồng bằng'},
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


/* ---- 30_planner.js ---- */
BMH.roomColor = type => ({living:'#eef4ea',kitchen:'#fff5e7',bed:'#eef4fa',bath:'#edf6f7',stairs:'#f1eef8',garage:'#f4f0ea',corridor:'#f6f6f2',balcony:'#edf7ed'}[type]||'#f3f4f1');
BMH.floorRooms = (floor=BMH.state.ui.planner.floor) => BMH.state.project.plan.rooms.filter(r=>r.floor===floor);
BMH.selectedRoom = () => BMH.state.project.plan.rooms.find(r=>r.id===BMH.state.ui.planner.selected)||null;
BMH.roomsOverlap = (a,b) => a.floor===b.floor && a.id!==b.id && a.x < b.x+b.w-.001 && a.x+a.w > b.x+.001 && a.y < b.y+b.h-.001 && a.y+a.h > b.y+.001;
BMH.roomValid = room => room.x>=0 && room.y>=0 && room.x+room.w<=BMH.state.project.site.width+.001 && room.y+room.h<=BMH.state.project.site.depth+.001 && !BMH.state.project.plan.rooms.some(r=>BMH.roomsOverlap(room,r));
BMH.plannerIssues = () => {
  const p=BMH.state.project, issues=[];
  for(const r of p.plan.rooms){if(r.x<0||r.y<0||r.x+r.w>p.site.width+.001||r.y+r.h>p.site.depth+.001)issues.push({sev:'error',text:`${r.name} vượt ranh khu đất.`}); if(p.plan.rooms.some(o=>BMH.roomsOverlap(r,o)))issues.push({sev:'error',text:`${r.name} đang chồng lên không gian khác.`});}
  for(let f=1;f<p.site.floors;f++){
    const prev=p.plan.rooms.find(r=>r.floor===f-1&&r.type==='stairs'), cur=p.plan.rooms.find(r=>r.floor===f&&r.type==='stairs');
    if(prev&&cur && (Math.abs(prev.x-cur.x)>.5||Math.abs(prev.y-cur.y)>.5)) issues.push({sev:'warn',text:`Cầu thang tầng ${f} và tầng ${f+1} lệch nhau quá 0,5m.`});
  }
  const h=p.household; if(h.relatives.length && !p.plan.rooms.some(r=>r.floor===0&&r.type==='bed'))issues.push({sev:'warn',text:'Có ba/mẹ/người thân ở cùng nhưng tầng trệt chưa có phòng ngủ.'});
  const requested=h.children.filter(c=>c.room==='Riêng').length; const childBeds=p.plan.rooms.filter(r=>r.type==='bed'&&!/chính|ông bà/i.test(r.name)).length; if(childBeds<requested)issues.push({sev:'info',text:`Gia đình yêu cầu ${requested} phòng riêng cho con; mặt bằng hiện có ${childBeds} phòng phù hợp.`});
  if(!p.plan.rooms.some(r=>r.type==='bath'))issues.push({sev:'warn',text:'Chưa có WC trong mặt bằng.'});
  return issues.filter((x,i,a)=>a.findIndex(y=>y.text===x.text)===i);
};
BMH.furnitureSvg = r => {
  const x=r.x,y=r.y,w=r.w,h=r.h,c='#7f8c83';
  if(r.type==='bed') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".05"><rect x="${x+w*.18}" y="${y+h*.2}" width="${w*.64}" height="${h*.55}" rx=".08"/><rect x="${x+w*.24}" y="${y+h*.22}" width="${w*.22}" height="${h*.14}" rx=".05"/><rect x="${x+w*.54}" y="${y+h*.22}" width="${w*.22}" height="${h*.14}" rx=".05"/></g>`;
  if(r.type==='living') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".05"><rect x="${x+w*.12}" y="${y+h*.18}" width="${w*.54}" height="${h*.22}" rx=".08"/><rect x="${x+w*.34}" y="${y+h*.55}" width="${w*.32}" height="${h*.2}" rx=".08"/></g>`;
  if(r.type==='kitchen') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".05"><rect x="${x+w*.08}" y="${y+h*.12}" width="${w*.84}" height="${h*.16}"/><circle cx="${x+w*.24}" cy="${y+h*.2}" r="${Math.min(w,h)*.05}"/><rect x="${x+w*.3}" y="${y+h*.5}" width="${w*.4}" height="${h*.26}" rx=".05"/></g>`;
  if(r.type==='bath') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".05"><ellipse cx="${x+w*.3}" cy="${y+h*.45}" rx="${w*.13}" ry="${h*.18}"/><rect x="${x+w*.58}" y="${y+h*.18}" width="${w*.25}" height="${h*.22}" rx=".05"/><rect x="${x+w*.55}" y="${y+h*.55}" width="${w*.32}" height="${h*.3}"/></g>`;
  if(r.type==='stairs') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".04">${Array.from({length:8},(_,i)=>`<line x1="${x+w*.15}" y1="${y+h*(.12+i*.095)}" x2="${x+w*.85}" y2="${y+h*(.12+i*.095)}"/>`).join('')}<path d="M${x+w*.5} ${y+h*.82}V${y+h*.18}m0 0l-.12 .18m.12-.18l.12 .18"/></g>`;
  if(r.type==='garage') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".05"><rect x="${x+w*.2}" y="${y+h*.18}" width="${w*.6}" height="${h*.64}" rx=".28"/><circle cx="${x+w*.26}" cy="${y+h*.25}" r=".08"/><circle cx="${x+w*.74}" cy="${y+h*.25}" r=".08"/><circle cx="${x+w*.26}" cy="${y+h*.75}" r=".08"/><circle cx="${x+w*.74}" cy="${y+h*.75}" r=".08"/></g>`;
  return '';
};
BMH.openingSvg = o => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===o.roomId); if(!r)return''; const w=Math.min(o.width||.9, o.side==='north'||o.side==='south'?r.w:r.h); const off=BMH.clamp(o.offset??.3,0,1);
  let x,y;
  if(o.side==='north'||o.side==='south'){x=r.x+(r.w-w)*off; y=o.side==='north'?r.y:r.y+r.h;} else {y=r.y+(r.h-w)*off; x=o.side==='west'?r.x:r.x+r.w;}
  if(o.kind==='window'){
    if(o.side==='north'||o.side==='south') return `<g class="opening window"><line x1="${x}" y1="${y}" x2="${x+w}" y2="${y}"/><line x1="${x}" y1="${y+(o.side==='north'?.08:-.08)}" x2="${x+w}" y2="${y+(o.side==='north'?.08:-.08)}"/></g>`;
    return `<g class="opening window"><line x1="${x}" y1="${y}" x2="${x}" y2="${y+w}"/><line x1="${x+(o.side==='west'?.08:-.08)}" y1="${y}" x2="${x+(o.side==='west'?.08:-.08)}" y2="${y+w}"/></g>`;
  }
  const rr=Math.min(.9,w); if(o.side==='north')return `<g class="opening door"><line x1="${x}" y1="${y}" x2="${x}" y2="${y+rr}"/><path d="M${x+rr} ${y} A${rr} ${rr} 0 0 0 ${x} ${y+rr}"/></g>`;
  if(o.side==='south')return `<g class="opening door"><line x1="${x}" y1="${y}" x2="${x}" y2="${y-rr}"/><path d="M${x+rr} ${y} A${rr} ${rr} 0 0 1 ${x} ${y-rr}"/></g>`;
  if(o.side==='west')return `<g class="opening door"><line x1="${x}" y1="${y}" x2="${x+rr}" y2="${y}"/><path d="M${x} ${y+rr} A${rr} ${rr} 0 0 1 ${x+rr} ${y}"/></g>`;
  return `<g class="opening door"><line x1="${x}" y1="${y}" x2="${x-rr}" y2="${y}"/><path d="M${x} ${y+rr} A${rr} ${rr} 0 0 0 ${x-rr} ${y}"/></g>`;
};
BMH.planSvg = ({interactive=true, floor=BMH.state.ui.planner.floor}={}) => {
  const p=BMH.state.project, ui=BMH.state.ui.planner, rooms=BMH.floorRooms(floor), W=p.site.width,H=p.site.depth, m=2.2, major=1, minor=.2;
  const kua=BMH.kua(p.household.ownerBirth,p.household.ownerGender), good=kua?.dirs?.[0];
  const feng=ui.showFeng&&good?(()=>{const pos={'Bắc':[W*.2,0,W*.6,H*.22],'Nam':[W*.2,H*.78,W*.6,H*.22],'Đông':[W*.78,H*.2,W*.22,H*.6],'Tây':[0,H*.2,W*.22,H*.6],'Đông Nam':[W*.58,H*.58,W*.42,H*.42],'Đông Bắc':[W*.58,0,W*.42,H*.42],'Tây Nam':[0,H*.58,W*.42,H*.42],'Tây Bắc':[0,0,W*.42,H*.42]}[good];return pos?`<g class="feng-zone"><rect x="${pos[0]}" y="${pos[1]}" width="${pos[2]}" height="${pos[3]}"/><text x="${pos[0]+.16}" y="${pos[1]+.34}">Hướng tốt tham khảo · ${good}</text></g>`:''})():'';
  const roomMarkup=rooms.map(r=>`<g class="room ${ui.selected===r.id?'selected':''}" data-room-id="${r.id}"><rect class="room-fill" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${BMH.roomColor(r.type)}"/><rect class="room-wall" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>${ui.showFurniture?BMH.furnitureSvg(r):''}<text class="room-name" x="${r.x+r.w/2}" y="${r.y+r.h/2-.12}">${BMH.esc(r.name)}</text><text class="room-area" x="${r.x+r.w/2}" y="${r.y+r.h/2+.28}">${BMH.num(r.w*r.h)} m²</text>${interactive&&ui.selected===r.id?`<circle class="resize-handle" data-resize-id="${r.id}" cx="${r.x+r.w}" cy="${r.y+r.h}" r=".16"/>`:''}</g>`).join('');
  const openings=p.plan.openings.filter(o=>o.floor===floor).map(BMH.openingSvg).join('');
  const dims=ui.showDimensions?rooms.map(r=>`<g class="room-dims"><text x="${r.x+r.w/2}" y="${r.y-.12}">${BMH.num(r.w)}m</text><text x="${r.x+r.w+.12}" y="${r.y+r.h/2}" transform="rotate(90 ${r.x+r.w+.12} ${r.y+r.h/2})">${BMH.num(r.h)}m</text></g>`).join(''):'';
  const ticksX=Array.from({length:Math.floor(W)+1},(_,i)=>`<text x="${i}" y="-.52">${i}</text><line x1="${i}" y1="-.42" x2="${i}" y2="-.28"/>`).join('');
  const ticksY=Array.from({length:Math.floor(H)+1},(_,i)=>`<text x="-.52" y="${i+.08}">${i}</text><line x1="-.42" y1="${i}" x2="-.28" y2="${i}"/>`).join('');
  const titleY=H+1.2;
  return `<svg id="plannerSvg" class="planner-svg" viewBox="-${m} -${m} ${W+m*2} ${H+m*2.1}" preserveAspectRatio="xMidYMid meet" data-floor="${floor}" aria-label="Mặt bằng kiến trúc sơ bộ tầng ${floor+1}"><defs><pattern id="minorGrid" width="${minor}" height="${minor}" patternUnits="userSpaceOnUse"><path d="M ${minor} 0 L 0 0 0 ${minor}"/></pattern><pattern id="majorGrid" width="${major}" height="${major}" patternUnits="userSpaceOnUse"><path d="M ${major} 0 L 0 0 0 ${major}"/></pattern></defs><rect x="0" y="0" width="${W}" height="${H}" class="paper"/><rect x="0" y="0" width="${W}" height="${H}" class="minor-grid"/><rect x="0" y="0" width="${W}" height="${H}" class="major-grid"/>${feng}<g class="rulers">${ticksX}${ticksY}</g><rect x="0" y="0" width="${W}" height="${H}" class="plot-boundary"/>${roomMarkup}${openings}${dims}<g class="overall-dims"><line x1="0" y1="${H+.45}" x2="${W}" y2="${H+.45}"/><text x="${W/2}" y="${H+.75}">${BMH.num(W)} m</text><line x1="${W+.45}" y1="0" x2="${W+.45}" y2="${H}"/><text x="${W+.78}" y="${H/2}" transform="rotate(90 ${W+.78} ${H/2})">${BMH.num(H)} m</text></g><g class="north" transform="translate(${W+1.3},.4)"><text x="0" y="-.3">N</text><path d="M0 0l-.22 .8 .22-.16 .22 .16z"/></g><g class="title-block" transform="translate(0,${titleY})"><rect x="0" y="0" width="${W}" height=".82"/><text x=".18" y=".28" class="title">MẶT BẰNG KIẾN TRÚC SƠ BỘ · TẦNG ${floor+1}</text><text x=".18" y=".58">Build My Home V2.2 · lưới 0,2m / snap ${ui.snap}m · không phải hồ sơ thi công</text></g></svg>`;
};
BMH.findFreeSpot = (w,h,floor) => { const s=BMH.state.ui.planner.snap, site=BMH.state.project.site; for(let y=0;y<=site.depth-h+.001;y+=s)for(let x=0;x<=site.width-w+.001;x+=s){const r={id:'temp',floor,x:+x.toFixed(2),y:+y.toFixed(2),w,h};if(BMH.roomValid(r))return {x:r.x,y:r.y};} return null; };
BMH.addRoom = type => { const defs={living:['Phòng khách',4,4],kitchen:['Bếp + ăn',4,4],bed:['Phòng ngủ',3.2,4],bath:['WC',1.8,2.2],stairs:['Cầu thang',2,4],garage:['Gara',3,5],corridor:['Hành lang',1.2,4],balcony:['Ban công',1.5,3]}; const d=defs[type]||defs.bed, floor=BMH.state.ui.planner.floor, pos=BMH.findFreeSpot(Math.min(d[1],BMH.state.project.site.width),Math.min(d[2],BMH.state.project.site.depth),floor); if(!pos)return BMH.toast('Không còn vùng trống đủ cho không gian mẫu.'); const r={id:BMH.uid('r'),floor,name:d[0],type,x:pos.x,y:pos.y,w:Math.min(d[1],BMH.state.project.site.width),h:Math.min(d[2],BMH.state.project.site.depth)}; BMH.state.project.plan.rooms.push(r); BMH.state.ui.planner.selected=r.id; BMH.save(); BMH.render(); };
BMH.addOpening = kind => { const r=BMH.selectedRoom(); if(!r)return BMH.toast('Hãy chọn phòng trước.'); const same=BMH.state.project.plan.openings.filter(o=>o.roomId===r.id); const side=['south','east','north','west'][same.length%4]; BMH.state.project.plan.openings.push({id:BMH.uid('o'),floor:r.floor,roomId:r.id,kind,side,offset:.45,width:kind==='door'?.9:1.4}); BMH.save(); BMH.render(); };


/* ---- 40_exports.js ---- */
BMH.csv = rows => rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\r\n');
BMH.exportLoan = () => {
  const f=BMH.state.project.finance, rows=[['Tháng','Lãi suất năm','Gốc','Lãi','Tổng trả','Dư nợ']];
  BMH.loanSchedule().forEach(r=>rows.push([r.month,`${r.annual.toFixed(2)}%`,Math.round(r.principal),Math.round(r.interest),Math.round(r.payment),Math.round(r.balance)]));
  BMH.download('BMH-lich-tra-no.csv','\ufeff'+BMH.csv(rows),'text/csv;charset=utf-8');
};
BMH.exportEstimate = () => { const e=BMH.estimate(), rows=[['Hạng mục','Giá trị'],['Phần thô',e.shell],['Hoàn thiện & vật liệu',e.finish],['Vận chuyển',e.transport],['Chuẩn bị',e.prep],['Dự phòng 10%',e.contingency],['TỔNG',e.total]]; BMH.download('BMH-du-toan.csv','\ufeff'+BMH.csv(rows),'text/csv;charset=utf-8'); };
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
  const e=BMH.estimate(); const loan='\ufeff'+BMH.csv([['Tháng','Lãi suất','Tổng trả','Dư nợ'],...BMH.loanSchedule().map(r=>[r.month,r.annual,Math.round(r.payment),Math.round(r.balance)])]);
  const estimate='\ufeff'+BMH.csv([['Hạng mục','Giá trị'],['Phần thô',e.shell],['Hoàn thiện',e.finish],['Vận chuyển',e.transport],['Dự phòng',e.contingency],['Tổng',e.total]]);
  const files=[['project.json',JSON.stringify(BMH.state,null,2)],['mat-bang-tang-1.svg',BMH.planSvg({interactive:false,floor:0})],['du-toan.csv',estimate],['lich-tra-no.csv',loan]];
  for(let f=1;f<BMH.state.project.site.floors;f++)files.push([`mat-bang-tang-${f+1}.svg`,BMH.planSvg({interactive:false,floor:f})]);
  BMH.download('Build-My-Home-ho-so.zip',BMH.zipStored(files),'application/zip');
};


/* ---- 50_screens.js ---- */
BMH.field = (label,path,{type='number',min=0,max=9999999999,step=1,scale=1,options=null,hint=''}={}) => {
  const value=BMH.get(path); return `<label class="field"><span>${label}</span>${options?`<select data-path="${path}">${options.map(o=>{const v=Array.isArray(o)?o[0]:o,n=Array.isArray(o)?o[1]:o;return `<option value="${BMH.esc(v)}" ${String(value)===String(v)?'selected':''}>${BMH.esc(n)}</option>`}).join('')}</select>`:`<input data-path="${path}" data-scale="${scale}" type="${type}" min="${min}" max="${max}" step="${step}" value="${type==='number'?Number(value)/scale:BMH.esc(value)}">`}${hint?`<small>${hint}</small>`:''}</label>`;
};
BMH.hero = (step,title,accent,desc) => `<section class="step-hero"><div><span class="eyebrow">BƯỚC ${step} TRONG 10</span><h1>${title} <em>${accent||''}</em></h1><p>${desc}</p></div></section>`;
BMH.cardTitle = (title,desc='') => `<div class="card-title"><h2>${title}</h2>${desc?`<p>${desc}</p>`:''}</div>`;

BMH.screen1 = () => `${BMH.hero(1,'Khởi tạo','dự án mới','Chọn đúng điểm bắt đầu để hệ thống đi theo hoàn cảnh thực tế của gia đình bạn.')}<div class="start-flows">
  <article class="flow-card flow-a"><div class="flow-image"><img src="assets/design/flow-a.jpg" alt="Nhà mẫu"></div><span>Luồng A</span><h2>Tôi đã có ảnh nhà mẫu ưng ý</h2><p>Tải ảnh phong cách tham khảo; mặt bằng và vật liệu vẫn được thiết kế theo khu đất thực.</p><button class="clay" data-start="photo">${BMH.icon('upload')} Tải ảnh lên</button></article>
  <article class="flow-card flow-b"><div class="flow-image"><img src="assets/design/flow-b.jpg" alt="Bản vẽ"></div><span>Luồng B</span><h2>Tôi đã có file bản vẽ</h2><p>Dùng ảnh/PDF làm tài liệu đối chiếu khi nhập kích thước, phòng và công năng.</p><button class="clay" data-start="plan">${BMH.icon('upload')} Tải bản vẽ</button></article>
  <article class="flow-card flow-c"><div class="flow-image"><img src="assets/design/flow-c.jpg" alt="Gợi ý từ đầu"></div><span>Luồng C</span><h2>Tôi chưa có gì, cần gợi ý từ đầu</h2><p>Bắt đầu bằng ngân sách, khu đất, thành viên và một mặt bằng mẫu có thể chỉnh sửa.</p><button class="clay" data-start="suggest">Bắt đầu tư vấn ${BMH.icon('arrow')}</button></article>
</div><section class="benefits"><b>Bạn sẽ nhận được gì?</b><div><span>✓ Lộ trình 10 bước rõ ràng</span><span>✓ Kiểm soát chi phí xuyên suốt</span><span>✓ Mặt bằng sơ bộ dễ trao đổi</span><span>✓ Hồ sơ có thể xuất khi mở khóa</span></div></section>`;

BMH.screen2 = () => {const f=BMH.state.project.finance,s=BMH.financeSummary(),bank=BMH.BANKS.find(b=>b.id===f.bank); const stress=[1,2,3].map(x=>{const payment=BMH.monthlyPayment(f.loan,f.postRate+x,f.years*12-f.promoMonths);return `<div><small>+${x}%</small><b>${BMH.money(payment)}/tháng</b><span>${Math.round((payment+f.existingDebt)/f.income*100)}% thu nhập</span></div>`}).join(''); return `${BMH.hero(2,'Hồ sơ tài chính','& DTI','Tách rõ vốn tự có, khoản vay và kịch bản lãi suất để không xây nhà bằng một con số quá lạc quan.')}<div class="finance-layout"><section class="card wide">${BMH.cardTitle('1. Thông tin tài chính cá nhân')}<div class="fields four">${BMH.field('Số tiền hiện có','project.finance.cash',{scale:1000000,step:10,hint:'triệu đồng'})}${BMH.field('Thu nhập hàng tháng','project.finance.income',{scale:1000000,step:1,hint:'triệu đồng'})}${BMH.field('Chi phí cố định','project.finance.living',{scale:1000000,step:1,hint:'triệu đồng'})}${BMH.field('Quỹ dự phòng','project.finance.reserve',{scale:1000000,step:10,hint:'triệu đồng'})}</div></section><section class="card wide">${BMH.cardTitle('2. Khoản vay & ngân hàng','Chọn ngân hàng sẽ điền một kịch bản mặc định có thể sửa tay; đây không phải cam kết lãi suất.')}<div class="bank-grid">${BMH.BANKS.map(b=>`<button class="bank ${f.bank===b.id?'active':''}" data-bank="${b.id}"><img src="${b.img}" alt="${b.name}"><span>${b.name}</span></button>`).join('')}</div><div class="fields five">${BMH.field('Số tiền vay','project.finance.loan',{scale:1000000,step:10,hint:'triệu đồng'})}${BMH.field('Thời hạn','project.finance.years',{min:1,max:35,hint:'năm'})}${BMH.field('Lãi ưu đãi','project.finance.introRate',{step:.1,hint:'%/năm'})}${BMH.field('Lãi sau ưu đãi','project.finance.postRate',{step:.1,hint:'%/năm'})}${BMH.field('Ưu đãi','project.finance.promoMonths',{min:0,max:60,hint:'tháng'})}</div><div class="bank-note"><b>${bank?.name||''}</b><span>${bank?.note||''}</span></div><div class="finance-metrics"><div class="metric clay"><small>Khoản trả tháng đầu</small><strong>${BMH.money(s.first)}</strong></div><div class="metric blue"><small>Ước tính sau ưu đãi</small><strong>${BMH.money(s.post)}</strong></div><div class="metric ${s.dti>.35?'warn':'green'}"><small>DTI cao nhất</small><strong>${Math.round(s.dti*100)}%</strong><span>Còn ${BMH.money(s.remainder)}/tháng tại điểm cao nhất</span></div></div><div class="stress"><div><h3>Kiểm tra sức chịu đựng khi lãi tăng</h3><p>Không đảm bảo lãi tương lai chỉ tăng trong các mức này. Hãy giữ biên an toàn dòng tiền.</p></div>${stress}</div><button class="secondary" data-export="loan">${BMH.icon('download')} Tải bảng dự tính trả nợ theo tháng (CSV/Excel mở được)</button></section></div>`};

BMH.screen3 = () => {const s=BMH.state.project.site,r=BMH.REGIONS[s.province]||BMH.REGIONS['Bình Dương']; return `${BMH.hero(3,'Vị trí','& khí hậu vùng','Một địa phương duy nhất được dùng cho bản đồ, header và các giả định vùng.')}<div class="location-grid"><section class="card location-form">${BMH.cardTitle('Tìm kiếm vị trí')}<div class="stack">${BMH.field('Tỉnh/Thành phố','project.site.province',{options:Object.keys(BMH.REGIONS)})}${BMH.field('Quận/Huyện','project.site.district',{type:'text'})}${BMH.field('Địa chỉ cụ thể','project.site.address',{type:'text'})}</div><button class="clay" data-map-refresh>${BMH.icon('pin')} Cập nhật vị trí</button><small>Tọa độ trung tâm hiện dùng: ${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</small></section><section class="card map-card"><div id="map" class="map"><div class="map-fallback"><b>${BMH.icon('pin')} ${BMH.esc(s.province)}</b><span>${s.lat.toFixed(4)}, ${s.lng.toFixed(4)}</span><small>Nếu tile bản đồ không tải được, tọa độ dự án vẫn giữ chính xác theo vùng đã chọn.</small></div></div></section><section class="card region-info">${BMH.cardTitle('Thông tin khu vực')}<h3>${BMH.icon('pin')} ${BMH.esc(s.district||s.province)}, ${BMH.esc(s.province)}</h3><dl><div><dt>Khí hậu</dt><dd>${r.climate}</dd></div><div><dt>Rủi ro ngập</dt><dd>${r.flood}</dd></div><div><dt>Rủi ro bão</dt><dd>${r.storm}</dd></div><div><dt>Nhân công tham khảo</dt><dd>${r.labor}</dd></div><div><dt>Đường tiếp cận</dt><dd>${s.road} m</dd></div></dl><p class="notice">Thông tin vùng là lớp tham khảo cho lập kế hoạch. Rủi ro cụ thể cần kiểm tra theo địa chỉ, cao độ và dữ liệu địa phương.</p></section></div>`};

BMH.compass = () => {const h=BMH.state.project.household,k=BMH.kua(h.ownerBirth,h.ownerGender),good=new Set(k?.dirs||[]),pts=[['Bắc',100,18],['Đông Bắc',156,45],['Đông',183,104],['Đông Nam',157,164],['Nam',100,193],['Tây Nam',43,164],['Tây',16,104],['Tây Bắc',43,45]];return `<div class="compass"><svg viewBox="0 0 200 210"><circle cx="100" cy="105" r="86"/><circle cx="100" cy="105" r="58"/><g class="rays">${[0,45,90,135].map(a=>`<line x1="100" y1="19" x2="100" y2="191" transform="rotate(${a} 100 105)"/>`).join('')}</g><path class="needle-n" d="M100 38l12 68-12-9-12 9z"/><path class="needle-s" d="M100 172l12-67-12 9-12-9z"/>${pts.map(([n,x,y])=>`<text class="${good.has(n)?'good':''}" x="${x}" y="${y}" text-anchor="middle">${n}</text>`).join('')}</svg><div class="dir-chips">${(k?.dirs||[]).map((d,i)=>`<span>${['Sinh Khí','Thiên Y','Diên Niên','Phục Vị'][i]} · ${d}</span>`).join('')}</div></div>`};
BMH.screen4 = () => {const h=BMH.state.project.household,s=BMH.state.project.site,advice=BMH.householdAdvice();return `${BMH.hero(4,'Đất, địa chất','& phong thủy gia đình','Gắn thông tin gia đình với giải pháp công năng; phong thủy chỉ là lớp tham khảo văn hóa.')}<div class="site-family-grid"><section class="card">${BMH.cardTitle('Thông số lô đất')}<div class="fields">${BMH.field('Mặt tiền','project.site.width',{step:.1,hint:'m'})}${BMH.field('Chiều sâu','project.site.depth',{step:.1,hint:'m'})}${BMH.field('Số tầng','project.site.floors',{min:1,max:5})}${BMH.field('Đường vào','project.site.road',{step:.5,hint:'m'})}</div><div class="lot-diagram"><strong>${BMH.num(s.width*s.depth)} m²</strong><span>${s.width} × ${s.depth}m</span></div></section><section class="card">${BMH.cardTitle('Địa chất & tiếp cận','Không tự chọn móng từ câu trả lời này.')}<div class="soil-grid">${[['Đất đồi cứng','⛰'],['Đất thịt đồng bằng','◒'],['Đất trũng ao hồ / ven sông','≋'],['Chưa biết','?']].map(([n,i])=>`<button class="soil ${s.soil===n?'active':''}" data-soil="${n}"><i>${i}</i><span>${n}</span></button>`).join('')}</div><p class="notice">Móng phải dựa trên khảo sát địa chất, tải trọng và thiết kế kết cấu.</p></section><section class="card feng-card">${BMH.cardTitle('Phong thủy gia đình','La bàn Bát trạch tham khảo — công năng/an toàn ưu tiên trước.')}<div class="fields">${BMH.field('Năm sinh gia chủ','project.household.ownerBirth',{min:1900,max:2100})}${BMH.field('Giới tính','project.household.ownerGender',{options:['Nam','Nữ']})}${BMH.field('Năm sinh người đồng hành','project.household.partnerBirth',{min:1900,max:2100})}${BMH.field('Giới tính người đồng hành','project.household.partnerGender',{options:['Nam','Nữ']})}</div>${BMH.compass()}</section></div><section class="card household-card"><div class="between"><div>${BMH.cardTitle('Thành viên sống cùng','Thêm nhiều con và người thân; dữ liệu được dùng để kiểm tra nhu cầu phòng.')}</div><div class="row"><button data-household-add="child">+ Thêm con</button><button data-household-add="relative">+ Thêm ba/mẹ/người thân</button></div></div><div class="household-columns"><div><h3>Con cái (${h.children.length})</h3>${h.children.map((c,i)=>`<div class="person-row"><input data-person="child" data-id="${c.id}" data-key="name" value="${BMH.esc(c.name)}"><input type="number" data-person="child" data-id="${c.id}" data-key="birth" value="${c.birth}"><select data-person="child" data-id="${c.id}" data-key="room"><option ${c.room==='Riêng'?'selected':''}>Riêng</option><option ${c.room==='Ngủ chung'?'selected':''}>Ngủ chung</option></select><button data-person-remove="child" data-id="${c.id}">${BMH.icon('trash')}</button></div>`).join('')||'<p class="muted">Chưa thêm con.</p>'}</div><div><h3>Ba mẹ / người thân (${h.relatives.length})</h3>${h.relatives.map(r=>`<div class="person-row"><input data-person="relative" data-id="${r.id}" data-key="name" value="${BMH.esc(r.name)}"><input type="number" data-person="relative" data-id="${r.id}" data-key="birth" value="${r.birth}"><select data-person="relative" data-id="${r.id}" data-key="mobility"><option ${r.mobility==='Bình thường'?'selected':''}>Bình thường</option><option ${r.mobility==='Hạn chế nhẹ'?'selected':''}>Hạn chế nhẹ</option><option ${r.mobility==='Hạn chế nhiều'?'selected':''}>Hạn chế nhiều</option></select><button data-person-remove="relative" data-id="${r.id}">${BMH.icon('trash')}</button></div>`).join('')||'<p class="muted">Chưa thêm người thân.</p>'}</div></div><div class="advice-grid">${advice.map(x=>`<span>✓ ${BMH.esc(x)}</span>`).join('')}</div></section>`};

BMH.plannerInspector = () => {const r=BMH.selectedRoom(); if(!r)return `<aside class="planner-panel inspector">${BMH.cardTitle('Thuộc tính')}<p class="muted">Chọn một phòng trên mặt bằng.</p></aside>`;return `<aside class="planner-panel inspector">${BMH.cardTitle('Thuộc tính không gian')}<label>Tên phòng<input data-room-field="name" value="${BMH.esc(r.name)}"></label><label>Loại<select data-room-field="type">${[['living','Phòng khách'],['kitchen','Bếp + ăn'],['bed','Phòng ngủ'],['bath','WC'],['stairs','Cầu thang'],['garage','Gara'],['corridor','Hành lang'],['balcony','Ban công']].map(([v,n])=>`<option value="${v}" ${r.type===v?'selected':''}>${n}</option>`).join('')}</select></label><div class="fields compact">${['x','y','w','h'].map(k=>`<label>${k.toUpperCase()} · m<input type="number" step=".1" min="${(k==='w'||k==='h')?0.5:0}" data-room-field="${k}" value="${r[k]}"></label>`).join('')}</div><div class="room-stats"><span><b>${BMH.num(r.w*r.h)}m²</b>Diện tích</span><span><b>${BMH.state.ui.planner.snap}m</b>Snap</span></div><div class="row wrap"><button data-add-opening="door">+ Cửa đi</button><button data-add-opening="window">+ Cửa sổ</button><button class="danger" data-room-delete>${BMH.icon('trash')} Xóa phòng</button></div><p class="notice">Kích thước và ký hiệu ở đây phục vụ mặt bằng sơ bộ; chưa phải hồ sơ thi công.</p></aside>`};
BMH.screen5 = () => {const ui=BMH.state.ui.planner, rooms=BMH.floorRooms(),issues=BMH.plannerIssues();return `${BMH.hero(5,'Bản vẽ','thiết kế','Không gian làm việc được ưu tiên tối đa: lưới, cửa, cửa sổ, kích thước và kiểm tra xung đột cùng một controller.')}<section class="planner-toolbar"><div class="row wrap">${Array.from({length:BMH.state.project.site.floors},(_,i)=>`<button class="${ui.floor===i?'active':''}" data-floor="${i}">Tầng ${i+1}</button>`).join('')}<span class="sep"></span><label>Snap<select data-planner="snap"><option value="0.1" ${ui.snap===.1?'selected':''}>0,1m</option><option value="0.2" ${ui.snap===.2?'selected':''}>0,2m</option><option value="0.5" ${ui.snap===.5?'selected':''}>0,5m</option></select></label><label><input type="checkbox" data-planner="furniture" ${ui.showFurniture?'checked':''}> Nội thất</label><label><input type="checkbox" data-planner="dimensions" ${ui.showDimensions?'checked':''}> Kích thước</label><label><input type="checkbox" data-planner="feng" ${ui.showFeng?'checked':''}> Hướng tốt</label></div><div class="row"><button data-planner-fit>Fit</button><button data-export="plan">${BMH.icon('download')} SVG</button><button data-print>${BMH.icon('print')} In/PDF</button></div></section><div class="planner-shell"><aside class="planner-panel room-list">${BMH.cardTitle(`Không gian tầng ${ui.floor+1}`)}<div class="room-buttons">${rooms.map(r=>`<button class="${ui.selected===r.id?'active':''}" data-room-select="${r.id}"><i style="background:${BMH.roomColor(r.type)}"></i><span>${BMH.esc(r.name)}</span><small>${BMH.num(r.w*r.h)}m²</small></button>`).join('')}</div><div class="add-room-grid">${[['living','Khách'],['kitchen','Bếp'],['bed','Ngủ'],['bath','WC'],['stairs','Thang'],['garage','Gara'],['corridor','Hành lang'],['balcony','Ban công']].map(([v,n])=>`<button data-add-room="${v}">+ ${n}</button>`).join('')}</div></aside><section class="drawing"><div class="drawing-head"><b>MẶT BẰNG KIẾN TRÚC SƠ BỘ · TẦNG ${ui.floor+1}</b><span>${BMH.state.project.site.width}×${BMH.state.project.site.depth}m · ${rooms.length} không gian</span></div><div class="drawing-canvas" style="--zoom:${ui.zoom}">${BMH.planSvg()}</div><div class="drawing-foot">Kéo phòng để di chuyển · kéo nút tròn góc dưới phải để resize · lưới 0,2m / snap ${ui.snap}m</div></section>${BMH.plannerInspector()}</div><section class="validator"><div class="between"><div>${BMH.cardTitle('Kiểm tra mặt bằng','Rule-based, không dùng AI để tự kết luận kỹ thuật.')}</div><span class="badge ${issues.some(x=>x.sev==='error')?'bad':'good'}">${issues.length?issues.length+' lưu ý':'Không có xung đột cơ bản'}</span></div><div class="issue-grid">${issues.length?issues.map(x=>`<article class="${x.sev}"><b>${x.sev==='error'?'!':x.sev==='warn'?'△':'i'}</b><span>${BMH.esc(x.text)}</span></article>`).join(''):'<article class="ok"><b>✓</b><span>Không phát hiện chồng phòng, vượt ranh hoặc lỗi cơ bản.</span></article>'}</div></section>`};

BMH.screen6 = () => {const m=BMH.state.project.materials,e=BMH.estimate();return `${BMH.hero(6,'Gói','vật liệu','Chọn theo hình ảnh, mức giá và tác động ngân sách; dữ liệu chưa xác minh sẽ không được giả thành giá thị trường.')}<div class="tier-row">${[['economy','Tiết kiệm','Tối ưu chi phí'],['standard','Tiêu chuẩn','Cân bằng chi phí & độ bền'],['premium','Cao cấp','Ưu tiên thẩm mỹ & vật liệu']].map(([v,n,d])=>`<button class="tier ${m.tier===v?'active':''}" data-tier="${v}"><b>${n}</b><span>${d}</span></button>`).join('')}</div><div class="materials-layout"><nav class="material-tabs"><b>Danh mục</b><span>Gạch & sàn</span><span>Sơn</span><span>Cửa & kính</span></nav><section class="material-products">${Object.entries(BMH.MATERIALS).map(([cat,items])=>`<div class="material-section"><h3>${{floor:'Gạch & sàn',paint:'Sơn',door:'Cửa & kính'}[cat]}</h3><div class="product-grid">${items.map(x=>`<button class="product ${m.choices[cat]===x.id?'active':''}" data-material-cat="${cat}" data-material="${x.id}"><img src="${x.img}" alt="${x.name}"><strong>${x.name}</strong><span>${x.sub}</span><small>${x.price}</small>${x.premium?`<em>+${BMH.money(x.premium)}</em>`:'<em>Phương án cơ sở</em>'}</button>`).join('')}</div></div>`).join('')}</section><aside class="card material-impact"><h2>Tác động ngân sách</h2><strong>${BMH.money(e.total)}</strong><span>Dự toán hiện tại</span><div class="delta ${m.lastDelta>=0?'up':'down'}">${m.lastDelta>=0?'+':''}${BMH.money(m.lastDelta)}<small>thay đổi gần nhất</small></div><p>Chọn vật liệu sẽ cập nhật dự toán và bảng vật liệu dùng cho mô hình khối Bước 7.</p></aside></div>`};

BMH.isoModel = () => {const p=BMH.state.project, focus=BMH.state.ui.sceneFocus, rooms=p.plan.rooms.filter(r=>focus==='all'||focus===`floor:${r.floor}`||focus===`room:${r.id}`); const S=24,cx=250,cy=60, wallColor=p.materials.choices.paint==='jotun'?'#e6ddd0':'#eee9df',floorColor=p.materials.choices.floor==='vietceramics'?'#cab9a1':p.materials.choices.floor==='dongtam'?'#d8c8ae':'#d9d2c7'; const poly=rooms.map(r=>{const z=r.floor*2.8, pts=[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]], proj=pts.map(([x,y])=>[cx+(x-y)*S,cy+(x+y)*S*.48-z*S*.7]); const top=proj.map(q=>q.join(',')).join(' '); const p1=proj[1],p2=proj[2],p3=proj[3]; const h=1.2*S; return `<g><polygon points="${top}" fill="${floorColor}" stroke="#5f6b64"/><polygon points="${p1[0]},${p1[1]} ${p2[0]},${p2[1]} ${p2[0]},${p2[1]+h} ${p1[0]},${p1[1]+h}" fill="${wallColor}" stroke="#5f6b64"/><polygon points="${p2[0]},${p2[1]} ${p3[0]},${p3[1]} ${p3[0]},${p3[1]+h} ${p2[0]},${p2[1]+h}" fill="#d9d2c8" stroke="#5f6b64"/><text x="${(proj[0][0]+proj[2][0])/2}" y="${(proj[0][1]+proj[2][1])/2}" text-anchor="middle">${BMH.esc(r.name)}</text></g>`}).join('');return `<svg viewBox="0 0 520 520" class="iso-svg"><rect width="520" height="520" fill="${BMH.state.ui.sceneTheme==='night'?'#17202a':'#eaf0e7'}"/>${poly}</svg>`};
BMH.screen7 = () => {const ui=BMH.state.ui,year=BMH.state.project.wearYear,roomOptions=BMH.state.project.plan.rooms.map(r=>`<option value="room:${r.id}" ${ui.sceneFocus===`room:${r.id}`?'selected':''}>T${r.floor+1} · ${BMH.esc(r.name)}</option>`).join('');const wear={0:['Hiện tại','Bề mặt mới, chưa áp mô phỏng xuống cấp.',0],3:['Năm 3','Có thể bắt đầu ố ron/chân tường ở khu ẩm hoặc thiếu bảo trì.',19000000],5:['Năm 5','Mô phỏng bạc màu sơn và nứt chân chim nhẹ ở bề mặt chịu thời tiết.',35000000],10:['Năm 10','Mô phỏng rõ hơn nguy cơ bạc màu, rêu mốc và nứt bề mặt.',62000000]}[year]||[]; return `${BMH.hero(7,'Mô phỏng 3D','& đánh giá','Tách rõ mô hình khối sinh từ mặt bằng và phối cảnh tham khảo; không đánh tráo ảnh mẫu thành căn nhà của bạn.')}<section class="scene-card"><div class="scene-toolbar"><div class="tabs"><button class="${ui.sceneMode==='model'?'active':''}" data-scene-mode="model">3D phương án của bạn</button><button class="${ui.sceneMode==='reference'?'active':''}" data-scene-mode="reference">Phối cảnh tham khảo</button></div><div class="row"><select data-scene-focus><option value="all">Toàn bộ công trình</option>${Array.from({length:BMH.state.project.site.floors},(_,i)=>`<option value="floor:${i}" ${ui.sceneFocus===`floor:${i}`?'selected':''}>Tầng ${i+1}</option>`).join('')}${roomOptions}</select><button data-scene-theme>${ui.sceneTheme==='day'?BMH.icon('sun')+' Ngày':BMH.icon('moon')+' Đêm'}</button></div></div>${ui.sceneMode==='model'?`<div class="scene-model">${BMH.isoModel()}<div class="callout c1">Mô hình lấy trực tiếp từ phòng/kích thước Bước 5</div><div class="callout c2">Màu mô phỏng lấy từ vật liệu Bước 6</div></div>`:`<div class="reference-scene wear-y${year}"><img src="assets/rooms/facade-render.jpg" alt="Phối cảnh tham khảo"><div class="wear-overlay"></div><div class="callout c1">Mặt Tây nhận nhiều nắng · cân nhắc lam che</div><div class="callout c2">Ban công cần chi tiết chống thấm tốt</div></div>`}<div class="scene-disclaimer">${ui.sceneMode==='model'?'Mô hình khối liên kết mặt bằng, chưa phải render photoreal/PBR.':'Ảnh phối cảnh chỉ để tham khảo phong cách, không sinh trực tiếp từ mặt bằng.'}</div></section><section class="wear-card"><div><h2>Cỗ máy thời gian · hao mòn minh họa</h2><p>Chọn mốc để xem thay đổi thị giác và quỹ bảo trì giả định.</p></div><div class="wear-timeline">${[0,3,5,10].map(y=>`<button class="${year===y?'active':''}" data-wear="${y}">${y===0?'Hiện tại':`Năm ${y}`}</button>`).join('')}</div><div class="wear-info"><b>${wear[0]}</b><span>${wear[1]}</span><strong>${BMH.money(wear[2])} · quỹ bảo trì minh họa</strong></div></section>`};

BMH.screen8 = () => {const e=BMH.estimate(),paid=BMH.isUnlocked();return `${BMH.hero(8,'Dự toán','& thanh toán','Bảng dự toán và khối mở khóa nằm ngay above-the-fold; không có banner 3D chen vào.')}<div class="estimate-pay"><section class="card estimate-card">${BMH.cardTitle('Bảng dự toán tổng quan')}<table><thead><tr><th>Hạng mục</th><th>Giá trị</th><th>Tỷ trọng</th></tr></thead><tbody>${[['Móng & phần thô',e.shell],['Hoàn thiện & vật liệu',e.finish],['Vận chuyển',e.transport],['Chuẩn bị',e.prep],['Dự phòng',e.contingency]].map(([n,v])=>`<tr><td>${n}</td><td>${BMH.money(v)}</td><td>${Math.round(v/e.total*100)}%</td></tr>`).join('')}<tr class="total"><td>Tổng cộng</td><td>${BMH.money(e.total)}</td><td>100%</td></tr></tbody></table><div class="budget-compare"><span>Ngân sách khả dụng <b>${BMH.money(e.budget)}</b></span><span class="${e.gap>=0?'good':'bad'}">${e.gap>=0?'Còn dự phòng':'Vượt ngân sách'} <b>${BMH.money(Math.abs(e.gap))}</b></span></div><button class="secondary" data-export="estimate">${BMH.icon('download')} Tải dự toán CSV</button></section><aside class="pay-card ${paid?'paid':''}"><div class="pay-head">${paid?'✓':'🔒'} <div><h2>${paid?'Đã mở khóa hồ sơ':'Mở khóa Giám sát & Hồ sơ'}</h2><strong>${paid?'Thanh toán đã xác nhận':'99.000đ'}</strong></div></div>${paid?`<p>Entitlement đã mở chung Bước 9 và Bước 10.</p><button class="clay" data-nav="9">Đi tới Bước 9 ${BMH.icon('arrow')}</button>`:`<img src="assets/design/vietqr-demo.png" alt="QR demo" class="qr"><p class="pay-note"><b>QR DEMO</b> · chưa cấu hình tài khoản nhận tiền thật trong bản refactor.</p><div class="copy-lines"><div><span>Số tài khoản</span><b>Chưa cấu hình</b><button disabled>${BMH.icon('copy')}</button></div><div><span>Nội dung</span><b>BMH DEMO</b><button data-copy="BMH DEMO">${BMH.icon('copy')}</button></div></div><div class="rights"><span>✓ Mở Bước 9 · Checklist MEP</span><span>✓ Mở Bước 10 · PDF/Excel/ZIP</span><span>✓ Cả Stepper và nút Next dùng chung một entitlement</span></div>${BMH.DEV?'<button class="dev-pay" data-dev-pay>DEV local: bật mở khóa để test</button>':''}<p class="pay-note">Production không có nút giả thanh toán. Khi nối webhook thật, server sẽ cấp entitlement.</p>`}</aside></div>`};
BMH.screen9 = () => {if(!BMH.isUnlocked())return BMH.lockedScreen(9); const c=BMH.state.project.checklist,items=[['pipe114','Ống thoát toilet Φ114, độ dốc ≥1%'],['acWire','Dây điện máy lạnh 4.0 mm² đi riêng'],['pressure','Test áp lực ống nước theo hồ sơ kỹ thuật'],['internet','Ống chờ internet/camera'],['elcb','Tiếp địa & chống rò ELCB/RCBO']];return `${BMH.hero(9,'Giám sát thi công','& checklist MEP','Theo dõi các hạng mục kiểm tra theo giai đoạn; nội dung cần đối chiếu hồ sơ kỹ thuật thực tế.')}<div class="supervision-grid"><section class="card"><h2>Tiến độ thi công</h2><div class="phase-row">${['Móng','Kết cấu','Tường','Mái','Điện nước','Hoàn thiện','Bàn giao'].map((x,i)=>`<span class="${i<2?'done':i===2?'active':''}"><i>${i<2?'✓':i+1}</i>${x}</span>`).join('')}</div><div class="progress-big"><b>35%</b><div><i style="width:35%"></i></div><span>Minh họa tiến độ hiện tại</span></div></section><section class="card checklist"><h2>Checklist kỹ thuật MEP</h2>${items.map(([k,n])=>`<label><input type="checkbox" data-check="${k}" ${c[k]?'checked':''}><span>${n}</span></label>`).join('')}<button class="secondary" data-print>${BMH.icon('print')} In / Lưu PDF</button></section></div>`};
BMH.screen10 = () => {if(!BMH.isUnlocked())return BMH.lockedScreen(10);return `${BMH.hero(10,'Hồ sơ bàn giao','& giải ngân','Xuất dữ liệu của chính phương án hiện tại. Các file kỹ thuật vẫn cần người có chuyên môn kiểm tra trước khi dùng thi công.')}<div class="handover-grid"><section class="card download-center"><h2>Trung tâm tải hồ sơ</h2><div class="download-grid"><button data-print>${BMH.icon('print')}<b>Hồ sơ tổng hợp</b><span>In / Lưu PDF</span></button><button data-export="estimate">${BMH.icon('download')}<b>Bóc tách chi phí</b><span>CSV mở bằng Excel</span></button><button data-export="loan">${BMH.icon('download')}<b>Lịch trả nợ</b><span>CSV mở bằng Excel</span></button><button data-export="plan">${BMH.icon('download')}<b>Mặt bằng SVG</b><span>Vector tầng đang chọn</span></button><button data-export="json">${BMH.icon('download')}<b>Dữ liệu dự án</b><span>JSON backup</span></button><button class="accent" data-export="bundle">${BMH.icon('download')}<b>Tải trọn bộ ZIP</b><span>Project + SVG + dự toán + lịch nợ</span></button></div></section><aside class="card"><h2>Trạng thái dự án</h2><p class="success-box">✓ Entitlement hồ sơ đang mở</p><dl class="summary"><div><dt>Tổng dự toán</dt><dd>${BMH.money(BMH.estimate().total)}</dd></div><div><dt>Diện tích phòng</dt><dd>${BMH.num(BMH.planArea())} m²</dd></div><div><dt>Số thành viên</dt><dd>${2+BMH.state.project.household.children.length+BMH.state.project.household.relatives.length}</dd></div></dl><p class="notice">Bản vẽ xuất từ hệ thống là mặt bằng sơ bộ, không thay bản vẽ thi công được ký/kiểm tra bởi KTS, kỹ sư kết cấu và MEP.</p></aside></div>`};
BMH.lockedScreen = step => `${BMH.hero(step,step===9?'Giám sát thi công':'Hồ sơ bàn giao','đang khóa','Quyền truy cập premium được kiểm tra ở một state duy nhất.')}<section class="locked"><div>🔒</div><h2>Bước ${step} đang khóa</h2><p>Vui lòng hoàn tất thanh toán 99.000đ tại Bước 8 để mở khóa checklist và hồ sơ.</p><button class="clay" data-nav="8">Quay về Bước 8</button></section>`;
BMH.SCREENS=[BMH.screen1,BMH.screen2,BMH.screen3,BMH.screen4,BMH.screen5,BMH.screen6,BMH.screen7,BMH.screen8,BMH.screen9,BMH.screen10];


/* ---- 60_app.js ---- */
BMH.app = BMH.$('#app');
BMH.sidebar = () => `<aside class="sidebar ${BMH.state.ui.sidebarCollapsed?'collapsed':''}"><button class="collapse" data-sidebar aria-label="Thu gọn/mở rộng">${BMH.state.ui.sidebarCollapsed?'›':'‹'}</button><div class="side-brand-mini"><img src="assets/icon.svg"><span>Build My Home</span></div><nav><button data-nav="1" class="${BMH.state.ui.step===1?'active':''}">${BMH.icon('home')}<span>Trang chủ</span></button><button>${BMH.icon('user')}<span>Hồ sơ của tôi</span></button><button>${BMH.icon('folder')}<span>Dự án</span></button><button>${BMH.icon('image')}<span>Thư viện mẫu</span></button><button>${BMH.icon('users')}<span>Nhà thầu</span></button><button data-nav="6">${BMH.icon('cube')}<span>Vật liệu</span></button><button>${BMH.icon('book')}<span>Kiến thức</span></button><button>${BMH.icon('gear')}<span>Cài đặt</span></button></nav><div class="side-quote"><b>⌂</b><span>Ngôi nhà tốt hơn<br>một cuộc sống đẹp hơn</span></div></aside>`;
BMH.header = () => `<header class="topbar"><div class="brand"><img src="assets/icon.svg" alt=""><div><b>Build My Home</b><span>Kiến tạo tổ ấm, vững bền tương lai</span></div></div><div class="header-actions"><button class="location-chip" data-nav="3">${BMH.icon('pin')} ${BMH.esc(BMH.state.project.site.province)}</button><span class="lang">◎ Tiếng Việt</span><button class="icon-btn">${BMH.icon('bell')}</button><div class="profile"><span class="avatar">N</span><div><b>Nguyễn Thị Lan</b><small>Gia đình nhỏ, Ước mơ lớn</small></div></div></div></header>`;
BMH.stepper = () => `<nav class="stepper">${BMH.STEPS.map(([short],i)=>{const n=i+1,locked=n>=9&&!BMH.isUnlocked(),active=BMH.state.ui.step===n,done=n<BMH.state.ui.step&&!locked;return `<button data-nav="${n}" class="step ${active?'active':''} ${done?'done':''} ${locked?'locked':''}" ${locked?'aria-label="Bước đang khóa"':''}><i>${locked?'🔒':done?'✓':n}</i><span>${short}</span></button>`}).join('')}</nav>`;
BMH.footer = () => {const step=BMH.state.ui.step, next=step+1, blocked=step===8&&!BMH.isUnlocked();return `<div class="step-footer"><button data-nav="${step-1}" ${step===1?'disabled':''}>${BMH.icon('back')} Quay lại</button><span>Tự động lưu trên thiết bị · có thể quay lại chỉnh bất cứ lúc nào.</span>${step<10?`<button class="primary" data-nav="${next}" ${blocked?'disabled title="Hoàn tất thanh toán để tiếp tục"':''}>${blocked?'🔒 Hoàn tất thanh toán':'Tiếp tục bước tiếp theo'} ${BMH.icon('arrow')}</button>`:'<button class="primary" disabled>Hoàn thành</button>'}</div>`};
BMH.amountBar = () => {const e=BMH.estimate();return `<div class="amountbar"><div><small>Ngân sách tối đa</small><strong>${BMH.money(e.budget)}</strong></div><div><small>Dự toán hiện tại</small><strong class="${e.total>e.budget?'bad':''}">${BMH.money(e.total)}</strong></div><div><small>${e.gap>=0?'Còn dự phòng':'Vượt ngân sách'}</small><strong class="${e.gap>=0?'good':'bad'}">${BMH.money(Math.abs(e.gap))}</strong></div></div>`};
BMH.render = ({preserveScroll=false}={}) => {
  const sy=window.scrollY, step=BMH.state.ui.step; const screen=BMH.SCREENS[step-1]||BMH.screen1;
  BMH.app.innerHTML=`${BMH.header()}${BMH.sidebar()}<main class="main ${step===5?'planner-page':''}">${BMH.stepper()}<div class="screen">${screen()}</div>${BMH.footer()}</main>${BMH.amountBar()}`;
  document.documentElement.dataset.version=BMH.VERSION; document.title=`Build My Home · ${BMH.STEPS[step-1][1]}`;
  if(preserveScroll)window.scrollTo(0,sy); requestAnimationFrame(BMH.afterRender);
};
BMH.navigateTo = step => {
  step=BMH.clamp(Number(step)||1,1,10); if(step>=9&&!BMH.isUnlocked()){BMH.state.ui.step=8;BMH.save();BMH.render();BMH.toast('Bước 9 và 10 chỉ mở sau khi thanh toán được xác nhận.');return false;}
  BMH.state.ui.step=step; if(step!==5)BMH.drag=null; BMH.save(); BMH.render(); window.scrollTo({top:0,behavior:'smooth'}); return true;
};
BMH.openPaywall = () => {BMH.navigateTo(8);BMH.toast('Hoàn tất thanh toán tại Bước 8 để mở hồ sơ premium.');};
BMH.afterRender = () => {
  if(BMH.state.ui.step===3) BMH.initMap();
  if(BMH.state.ui.step===5 && window.innerWidth>1180 && !BMH.state.ui.sidebarCollapsed){BMH.state.ui.sidebarCollapsed=true;BMH.save();BMH.render();}
};
BMH.initMap = () => {
  const el=BMH.$('#map'); if(!el)return; const s=BMH.state.project.site;
  try{if(BMH.map){BMH.map.remove();BMH.map=null;} if(!window.L)throw new Error('Leaflet unavailable'); BMH.map=L.map(el,{zoomControl:true}).setView([s.lat,s.lng],12); let tileErrors=0,tileLoads=0; const layer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(BMH.map); layer.on('tileerror',()=>{tileErrors++;if(tileErrors>=3)el.classList.add('fallback-only')}); layer.on('tileload',()=>{tileLoads++;if(tileLoads>=3&&tileErrors<3)el.classList.remove('fallback-only')}); BMH.mapMarker=L.marker([s.lat,s.lng]).addTo(BMH.map).bindPopup(`${BMH.esc(s.district||'')} · ${BMH.esc(s.province)}`).openPopup(); setTimeout(()=>BMH.map?.invalidateSize(true),80); window.addEventListener('resize',BMH.mapResize,{once:true});}
  catch(e){el.classList.add('fallback-only');}
};
BMH.mapResize = () => BMH.map?.invalidateSize(true);

BMH.app.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]'); if(nav){e.preventDefault();BMH.navigateTo(nav.dataset.nav);return;}
  const start=e.target.closest('[data-start]'); if(start){BMH.state.project.source=start.dataset.start;BMH.save(); if(start.dataset.start==='photo')BMH.$('#uploadPhoto')?.click(); else if(start.dataset.start==='plan')BMH.$('#uploadPlan')?.click(); else BMH.navigateTo(2); return;}
  if(e.target.closest('[data-sidebar]')){BMH.state.ui.sidebarCollapsed=!BMH.state.ui.sidebarCollapsed;BMH.save();BMH.render();return;}
  const bank=e.target.closest('[data-bank]'); if(bank){const b=BMH.BANKS.find(x=>x.id===bank.dataset.bank);if(b){Object.assign(BMH.state.project.finance,{bank:b.id,introRate:b.intro,postRate:b.post,promoMonths:b.months});BMH.save();BMH.render();BMH.toast(`Đã nạp kịch bản ${b.name}; vẫn có thể chỉnh tay.`);}return;}
  if(e.target.closest('[data-map-refresh]')){const r=BMH.REGIONS[BMH.state.project.site.province];if(r){BMH.state.project.site.lat=r.lat;BMH.state.project.site.lng=r.lng;BMH.save();BMH.render();}return;}
  const soil=e.target.closest('[data-soil]');if(soil){BMH.state.project.site.soil=soil.dataset.soil;BMH.save();BMH.render();return;}
  const addPerson=e.target.closest('[data-household-add]');if(addPerson){const h=BMH.state.project.household;if(addPerson.dataset.householdAdd==='child')h.children.push({id:BMH.uid('c'),name:`Con ${h.children.length+1}`,birth:new Date().getFullYear()-8,room:'Riêng'});else h.relatives.push({id:BMH.uid('p'),name:`Người thân ${h.relatives.length+1}`,birth:1960,mobility:'Bình thường'});BMH.save();BMH.render();return;}
  const rem=e.target.closest('[data-person-remove]');if(rem){const h=BMH.state.project.household,key=rem.dataset.personRemove==='child'?'children':'relatives';h[key]=h[key].filter(x=>x.id!==rem.dataset.id);BMH.save();BMH.render();return;}
  const floor=e.target.closest('[data-floor]');if(floor){BMH.state.ui.planner.floor=Number(floor.dataset.floor);const first=BMH.floorRooms()[0];BMH.state.ui.planner.selected=first?.id||null;BMH.save();BMH.render();return;}
  const room=e.target.closest('[data-room-select]');if(room){BMH.state.ui.planner.selected=room.dataset.roomSelect;BMH.save();BMH.render();return;}
  const addRoom=e.target.closest('[data-add-room]');if(addRoom){BMH.addRoom(addRoom.dataset.addRoom);return;}
  const opening=e.target.closest('[data-add-opening]');if(opening){BMH.addOpening(opening.dataset.addOpening);return;}
  if(e.target.closest('[data-room-delete]')){const id=BMH.state.ui.planner.selected;BMH.state.project.plan.rooms=BMH.state.project.plan.rooms.filter(r=>r.id!==id);BMH.state.project.plan.openings=BMH.state.project.plan.openings.filter(o=>o.roomId!==id);BMH.state.ui.planner.selected=BMH.floorRooms()[0]?.id||null;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-planner-fit]')){BMH.state.ui.planner.zoom=1;BMH.save();BMH.render();return;}
  const tier=e.target.closest('[data-tier]');if(tier){const before=BMH.estimate().total;BMH.state.project.materials.tier=tier.dataset.tier;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const material=e.target.closest('[data-material]');if(material){const before=BMH.estimate().total,cat=material.dataset.materialCat;BMH.state.project.materials.choices[cat]=material.dataset.material;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const sm=e.target.closest('[data-scene-mode]');if(sm){BMH.state.ui.sceneMode=sm.dataset.sceneMode;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-scene-theme]')){BMH.state.ui.sceneTheme=BMH.state.ui.sceneTheme==='day'?'night':'day';BMH.save();BMH.render();return;}
  const wear=e.target.closest('[data-wear]');if(wear){BMH.state.project.wearYear=Number(wear.dataset.wear);BMH.save();BMH.render();return;}
  const copy=e.target.closest('[data-copy]');if(copy){navigator.clipboard?.writeText(copy.dataset.copy).then(()=>BMH.toast('Đã sao chép.')).catch(()=>BMH.toast('Không thể sao chép tự động.'));return;}
  if(e.target.closest('[data-dev-pay]')&&BMH.DEV){BMH.state.access.paid=!BMH.state.access.paid;BMH.state.access.source=BMH.state.access.paid?'dev-local':'none';BMH.state.access.paidAt=BMH.state.access.paid?new Date().toISOString():null;BMH.save();BMH.render();return;}
  const exp=e.target.closest('[data-export]');if(exp){({loan:BMH.exportLoan,estimate:BMH.exportEstimate,plan:BMH.exportPlanSvg,json:BMH.exportProjectJson,bundle:BMH.exportBundle}[exp.dataset.export]?.());return;}
  if(e.target.closest('[data-print]')){window.print();return;}
});

BMH.app.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.path){let v=t.type==='number'?Number(t.value)*(Number(t.dataset.scale)||1):t.value;BMH.set(t.dataset.path,v); if(t.dataset.path==='project.site.province'){const r=BMH.REGIONS[v];if(r){BMH.state.project.site.lat=r.lat;BMH.state.project.site.lng=r.lng;BMH.save();BMH.render();}} return;}
  if(t.dataset.person){const h=BMH.state.project.household,list=t.dataset.person==='child'?h.children:h.relatives,p=list.find(x=>x.id===t.dataset.id);if(p){p[t.dataset.key]=t.type==='number'?Number(t.value):t.value;BMH.save();BMH.render();}return;}
  if(t.dataset.planner){const ui=BMH.state.ui.planner;if(t.dataset.planner==='snap')ui.snap=Number(t.value);if(t.dataset.planner==='furniture')ui.showFurniture=t.checked;if(t.dataset.planner==='dimensions')ui.showDimensions=t.checked;if(t.dataset.planner==='feng')ui.showFeng=t.checked;BMH.save();BMH.render();return;}
  if(t.dataset.roomField){const r=BMH.selectedRoom();if(!r)return;const key=t.dataset.roomField,old={...r};r[key]=['x','y','w','h'].includes(key)?Number(t.value):t.value;if(['x','y','w','h'].includes(key)){r[key]=BMH.roundTo(r[key],BMH.state.ui.planner.snap);if(!BMH.roomValid(r)){Object.assign(r,old);BMH.toast('Giá trị mới gây chồng phòng hoặc vượt ranh.');}}BMH.save();BMH.render();return;}
  if(t.matches('[data-scene-focus]')){BMH.state.ui.sceneFocus=t.value;BMH.save();BMH.render();return;}
  if(t.dataset.check){BMH.state.project.checklist[t.dataset.check]=t.checked;BMH.save();return;}
});

BMH.app.addEventListener('pointerdown',e=>{
  if(BMH.state.ui.step!==5)return; const handle=e.target.closest('[data-resize-id]'),group=e.target.closest('[data-room-id]'); const id=handle?.dataset.resizeId||group?.dataset.roomId;if(!id)return; const r=BMH.state.project.plan.rooms.find(x=>x.id===id);if(!r)return; const svg=BMH.$('#plannerSvg');if(!svg)return; const rect=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal; BMH.drag={id,mode:handle?'resize':'move',startX:e.clientX,startY:e.clientY,scaleX:vb.width/rect.width,scaleY:vb.height/rect.height,original:{...r},raf:false}; BMH.state.ui.planner.selected=id; e.preventDefault();
});
window.addEventListener('pointermove',e=>{const d=BMH.drag;if(!d)return; const r=BMH.state.project.plan.rooms.find(x=>x.id===d.id);if(!r)return; const dx=(e.clientX-d.startX)*d.scaleX,dy=(e.clientY-d.startY)*d.scaleY,s=BMH.state.ui.planner.snap,site=BMH.state.project.site;if(d.mode==='move'){r.x=BMH.clamp(BMH.roundTo(d.original.x+dx,s),0,site.width-r.w);r.y=BMH.clamp(BMH.roundTo(d.original.y+dy,s),0,site.depth-r.h);}else{r.w=BMH.clamp(BMH.roundTo(d.original.w+dx,s),.6,site.width-r.x);r.h=BMH.clamp(BMH.roundTo(d.original.h+dy,s),.6,site.depth-r.y);} if(!d.raf){d.raf=true;requestAnimationFrame(()=>{d.raf=false;BMH.render({preserveScroll:true});});}});
window.addEventListener('pointerup',()=>{const d=BMH.drag;if(!d)return; const r=BMH.state.project.plan.rooms.find(x=>x.id===d.id); if(r&&!BMH.roomValid(r)){Object.assign(r,d.original);BMH.toast('Không thể đặt phòng chồng lên không gian khác. Vị trí cũ đã được giữ lại.');} BMH.drag=null;BMH.save();BMH.render({preserveScroll:true});});

BMH.$('#uploadPhoto')?.addEventListener('change',e=>{if(e.target.files?.[0]){BMH.toast('Đã nhận ảnh tham khảo. Tiếp tục nhập thông tin dự án.');BMH.navigateTo(2);}});
BMH.$('#uploadPlan')?.addEventListener('change',e=>{if(e.target.files?.[0]){BMH.toast('Đã nhận bản vẽ tham chiếu. Bạn có thể đối chiếu ở Bước 5.');BMH.navigateTo(2);}});

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')BMH.save();}); window.addEventListener('pagehide',BMH.save);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
globalThis.BuildMyHome=BMH;
BMH.render();

})();
