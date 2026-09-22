// Generated from domain-kit/src by npm run build. Do not edit.
(()=>{
function number(value, name, min = 0, max = 1e13) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max)
    throw new RangeError(`${name}: cần số hữu hạn trong [${min}, ${max}]`);
  return value;
}
function integer(value, name, min = 0, max = 1e13) {
  number(value, name, min, max);
  if (!Number.isSafeInteger(value)) throw new RangeError(`${name}: cần số nguyên an toàn`);
  return value;
}
function text(value, name) {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(`${name}: không được trống`);
  return value;
}


// VND nguyên. Lãi suất dùng số thập phân: 0.069 = 6.9%/năm.
// Mô hình tháng, giải ngân toàn bộ tại đầu kỳ; chưa mô phỏng lãi theo ngày.
function loanSchedule({ principal, months, method = 'annuity', ratePeriods }) {
  integer(principal, 'principal'); integer(months, 'months', 1, 600);
  if (!['annuity', 'equal_principal'].includes(method)) throw new Error('INVALID_METHOD');
  if (!Array.isArray(ratePeriods) || !ratePeriods.length) throw new Error('MISSING_RATE');
  let previous = 0;
  for (const p of ratePeriods) {
    integer(p.fromMonth, 'fromMonth', 1, months); number(p.annualRate, 'annualRate', 0, 1);
    if (p.fromMonth <= previous) throw new Error('RATE_PERIOD_ORDER');
    previous = p.fromMonth;
  }
  if (ratePeriods[0].fromMonth !== 1) throw new Error('RATE_START_MUST_BE_1');
  let balance = principal, periodIndex = 0, payment = 0;
  const rows = [];
  for (let month = 1; month <= months; month++) {
    if (ratePeriods[periodIndex + 1]?.fromMonth === month) periodIndex++;
    const period = ratePeriods[periodIndex], r = period.annualRate / 12;
    if (period.fromMonth === month) {
      const remaining = months - month + 1;
      payment = r === 0 ? balance / remaining : balance * r / (1 - Math.pow(1 + r, -remaining));
    }
    const interest = Math.round(balance * r);
    const principalPaid = month === months ? balance : Math.min(balance, Math.max(0,
      Math.round(method === 'equal_principal' ? principal / months : payment - interest)));
    const openingBalance = balance;
    balance -= principalPaid;
    rows.push({ month, openingBalance, annualRate: period.annualRate,
      principalPaid, interest, payment: principalPaid + interest, closingBalance: balance });
  }
  return rows;
}

function financialSummary({ cash, emergencyReserve, committedLoan = 0,
  netMonthlyIncome, grossMonthlyIncome = null, livingCosts, existingMonthlyDebt = 0 }, schedule = []) {
  for (const [k, v] of Object.entries({ cash, emergencyReserve, committedLoan, netMonthlyIncome, livingCosts, existingMonthlyDebt })) integer(v, k);
  if (emergencyReserve > cash) throw new Error('RESERVE_EXCEEDS_CASH');
  if (grossMonthlyIncome !== null) integer(grossMonthlyIncome, 'grossMonthlyIncome');
  for (const row of schedule) integer(row.payment, 'payment');
  const peakPayment = Math.max(0, ...schedule.map(row => row.payment));
  const debt = peakPayment + existingMonthlyDebt;
  return { availableCapital: cash - emergencyReserve + committedLoan,
    peakPayment, peakNetDebtRatio: netMonthlyIncome > 0 ? debt / netMonthlyIncome : null,
    peakGrossDTI: grossMonthlyIncome > 0 ? debt / grossMonthlyIncome : null,
    monthlyRemainderAtPeak: netMonthlyIncome - livingCosts - debt,
    incomeMissing: netMonthlyIncome === 0 };
}

// Dòng tiền thực: vốn vay chỉ vào tháng thực giải ngân. Không cộng hạn mức vay vào số dư đầu.
function cashflow({ openingCash, emergencyReserve = 0, months }) {
  integer(openingCash, 'openingCash'); integer(emergencyReserve, 'emergencyReserve');
  if (!Array.isArray(months)) throw new Error('INVALID_MONTHS');
  let balance = openingCash;
  return months.map((row, i) => {
    const r = { income: 0, loanDraw: 0, livingCosts: 0, existingDebt: 0, loanPayment: 0, construction: 0, ...row };
    for (const k of ['income','loanDraw','livingCosts','existingDebt','loanPayment','construction']) integer(r[k], k);
    const openingBalance = balance;
    balance += r.income + r.loanDraw - r.livingCosts - r.existingDebt - r.loanPayment - r.construction;
    return { ...r, month: i + 1, openingBalance, closingBalance: balance,
      reserveGap: Math.max(0, emergencyReserve - balance), cashShortfall: Math.max(0, -balance) };
  });
}


// Đầu vào là khối lượng đã được xác nhận, KHÔNG tự suy khối lượng kết cấu từ ảnh.
// Một dòng = một nguồn giá, đơn vị tương thích, giá chưa thuế.
function estimate({ lines, contingencyRate = 0, availableCapital = 0 }) {
  number(contingencyRate, 'contingencyRate', 0, 1); integer(availableCapital, 'availableCapital');
  if (!Array.isArray(lines) || !lines.length) throw new Error('EMPTY_ESTIMATE');
  const ids = new Set();
  const items = lines.map(line => {
    text(line.id, 'id'); text(line.description, 'description');
    if (ids.has(line.id)) throw new Error('DUPLICATE_LINE'); ids.add(line.id);
    if (line.quantityConfirmed !== true) throw new Error('UNCONFIRMED_QUANTITY');
    if (!line.unit || line.unit !== line.priceUnit) throw new Error('UNIT_MISMATCH');
    number(line.quantity, 'quantity'); integer(line.unitPrice, 'unitPrice');
    number(line.wasteRate ?? 0, 'wasteRate', 0, 1); number(line.taxRate ?? 0, 'taxRate', 0, 1);
    text(line.priceSource, 'priceSource');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(line.priceDate ?? '') || Number.isNaN(Date.parse(line.priceDate))) throw new Error('PRICE_DATE_REQUIRED');
    const quantityWithWaste = line.quantity * (1 + (line.wasteRate ?? 0));
    const net = Math.round(quantityWithWaste * line.unitPrice);
    integer(net, 'lineAmount');
    const tax = Math.round(net * (line.taxRate ?? 0));
    return { ...line, quantityWithWaste, net, tax, total: net + tax };
  });
  const baseTotal = items.reduce((sum, row) => sum + row.total, 0);
  integer(baseTotal, 'baseTotal');
  const constructionContingency = Math.round(baseTotal * contingencyRate);
  const total = baseTotal + constructionContingency;
  return { items, baseTotal, constructionContingency, total,
    budgetGap: availableCapital - total, includesEmergencyReserve: false };
}

function milestonePlan(total, milestones) {
  integer(total, 'total');
  if (!Array.isArray(milestones) || !milestones.length) throw new Error('MISSING_MILESTONES');
  const ids = new Set();
  for (const m of milestones) {
    text(m.id, 'milestone.id');
    if(ids.has(m.id)) throw new Error('DUPLICATE_MILESTONE'); ids.add(m.id);
    integer(m.basisPoints, 'basisPoints', 0, 10000);
  }
  if (milestones.reduce((sum, m) => sum + m.basisPoints, 0) !== 10000) throw new Error('MILESTONES_MUST_SUM_100_PERCENT');
  let cumulative = 0, allocated = 0;
  return milestones.map(m => {
    cumulative += m.basisPoints;
    const target = Math.round(total * cumulative / 10000), amount = target - allocated;
    allocated = target;
    return { ...m, amount };
  });
}


function calibrate({ a, b, knownMeters }) {
  for(const p of [a,b]) { number(p.x, 'x', -1e6, 1e6); number(p.y, 'y', -1e6, 1e6); }
  number(knownMeters, 'knownMeters', 0.001, 10000);
  const pixels = Math.hypot(a.x-b.x, a.y-b.y);
  if(pixels < 1) throw new Error('CALIBRATION_POINTS_TOO_CLOSE');
  return { metersPerPixel: knownMeters / pixels, confirmed: true };
}
// Hỗ trợ phòng chữ nhật theo mét. Chưa phải editor polygon/tường/cửa/cầu thang.
function roomAreas(rooms, floorBounds) {
  if(!Array.isArray(rooms) || !rooms.length) throw new Error('ROOMS_REQUIRED');
  const ids = new Set(), checked = [];
  for(const room of rooms) {
    text(room.id, 'room.id'); text(room.name, 'room.name');
    if(ids.has(room.id)) throw new Error('DUPLICATE_ROOM'); ids.add(room.id);
    integer(room.floor, 'floor', 0, 100);
    number(room.x, 'x'); number(room.y, 'y'); number(room.width, 'width', 0.01, 1000); number(room.depth, 'depth', 0.01, 1000);
    const bound = floorBounds[room.floor];
    if(!bound) throw new Error('MISSING_FLOOR');
    number(bound.width, 'floor.width', 0.01, 1000); number(bound.depth, 'floor.depth', 0.01, 1000);
    if(room.x + room.width > bound.width || room.y + room.depth > bound.depth) throw new Error('ROOM_OUTSIDE_FLOOR');
    if(checked.some(r=> r.floor===room.floor && r.x<room.x+room.width && r.x+r.width>room.x && r.y<room.y+room.depth && r.y+r.depth>room.y)) throw new Error('ROOM_OVERLAP');
    checked.push(room);
  }
  return checked.map(r=>({...r, netArea: r.width*r.depth}));
}

function rankTemplates(templates, requirements) {
  number(requirements.width,'width',0.01); number(requirements.depth,'depth',0.01);
  integer(requirements.bedrooms,'bedrooms',0,50); integer(requirements.availableCapital,'availableCapital');
  return templates.filter(t=>t.width<=requirements.width && t.depth<=requirements.depth && t.bedrooms>=requirements.bedrooms)
    .map(t=>({...t, withinBudget:t.estimatedCost<=requirements.availableCapital,
      reasons:[t.estimatedCost<=requirements.availableCapital?'WITHIN_SCENARIO_BUDGET':'OVER_SCENARIO_BUDGET', 'FITS_RECTANGULAR_PLOT'],
      estimateKind:'template_assumption'}))
    .sort((a,b)=>Number(b.withinBudget)-Number(a.withinBudget) || a.estimatedCost-b.estimatedCost);
}


// Kịch bản đầu vào, không phải dự báo tuổi thọ thật. Không cộng gốc vay lần hai vào LCC.
function lifecycle({ initialCost, annualOperatingCost, annualMaintenanceCost,
  inflationRate = 0, discountRate = 0, repairs = [], years = 10 }) {
  for(const [k,v] of Object.entries({initialCost,annualOperatingCost,annualMaintenanceCost})) integer(v,k);
  number(inflationRate,'inflationRate',0,1); number(discountRate,'discountRate',0,1); integer(years,'years',1,100);
  for(const r of repairs){integer(r.year,'repair.year',1,years);integer(r.cost,'repair.cost');text(r.assumption,'repair.assumption');}
  let nominalTotal=initialCost, presentValue=initialCost;
  const rows=[];
  for(let year=1;year<=years;year++) {
    const factor=(1+inflationRate)**(year-1);
    const operations=Math.round(annualOperatingCost*factor), maintenance=Math.round(annualMaintenanceCost*factor);
    const repair=Math.round(repairs.filter(r=>r.year===year).reduce((s,r)=>s+r.cost,0)*factor);
    const total=operations+maintenance+repair;
    nominalTotal+=total; presentValue+=total/(1+discountRate)**year;
    rows.push({year,operations,maintenance,repair,total,cumulative:nominalTotal});
  }
  return {kind:'illustrative_scenario',rows,nominalTotal,presentValue:Math.round(presentValue), excludes:['loan_principal','loan_interest','resale_value']};
}

const steps = [
  {id:1,key:'start',title:'Khởi tạo',access:'free'},
  {id:2,key:'finance',title:'Tài chính & khoản vay',access:'free'},
  {id:3,key:'location',title:'Vị trí & khí hậu',access:'free'},
  {id:4,key:'site',title:'Đất & nhu cầu gia đình',access:'free'},
  {id:5,key:'design',title:'Thiết kế từng tầng/phòng',access:'free'},
  {id:6,key:'materials',title:'Vật liệu',access:'free'},
  {id:7,key:'simulation',title:'Mô phỏng & đánh giá',access:'free'},
  {id:8,key:'estimate',title:'Dự toán & gói hồ sơ',access:'free'},
  {id:9,key:'construction',title:'Theo dõi thi công',access:'project_package'},
  {id:10,key:'handover',title:'Hồ sơ & giải ngân',access:'project_package'}
];
// Tất cả là trạng thái triển khai rõ ràng, không dùng nút demo giả kết quả AI/thanh toán.
const capabilities = {
  financeCore:'implemented', estimateCore:'implemented', rectangleGeometry:'implemented',
  lifecycleScenarios:'implemented', templateFilter:'implemented',
  webUI:'implemented_static', database:'draft_schema', authentication:'not_integrated',
  payment:'not_integrated', aiReview:'server_adapter_requires_configuration', drawingOCR:'not_integrated',
  geometry3D:'concept_mesh', regionalPrices:'manual_source_records',
  pdfExcelExports:'csv_html_svg_obj_zip', marketplace:'deferred', nativeMobile:'deferred'
};
const downstream = {
  finance:['recommendations','financeReport','review','estimateReport','cashflow','exports'],
  location:['prices','recommendations','estimate','lifecycle','review','cashflow','exports'],
  site:['recommendations','designValidation','quantities','estimate','lifecycle','review','cashflow','exports'],
  design:['quantities','estimate','scene3D','lifecycle','review','cashflow','exports'],
  materials:['estimate','scene3D','lifecycle','review','cashflow','exports']
};
function invalidate(project, changedSection, expectedRevision) {
  if (project.revision!==expectedRevision) throw new Error('REVISION_CONFLICT');
  if (!downstream[changedSection]) throw new Error('UNKNOWN_SECTION');
  return {...project,revision:project.revision+1,stale:[...new Set([...(project.stale??[]),...downstream[changedSection]])]};
}
// Hàm thuần phục vụ rule/test. Backend phải load entitlement thật từ DB trước khi gọi.
function canAccessStep({stepId,projectId,userId,entitlements,paywallEnabled=true}) {
  const step=steps.find(s=>s.id===stepId);
  if(!step) return false;
  if(step.access==='free') return true;
  if(!paywallEnabled) return true;
  return entitlements.some(e=>e.projectId===projectId && e.userId===userId && e.key==='project_package' && e.status==='active');
}




const ENGINE_VERSION='1.2.0';
const round=n=>Math.round(n*1e6)/1e6;
function unionArea(rects){
 const xs=[...new Set(rects.flatMap(r=>[r.x,r.x+r.w]))].sort((a,b)=>a-b);let area=0;
 for(let i=1;i<xs.length;i++){
  const intervals=rects.filter(r=>r.x<xs[i]&&r.x+r.w>xs[i-1]).map(r=>[r.y,r.y+r.h]).sort((a,b)=>a[0]-b[0]);
  let sum=0,start=null,end=0;
  for(const [a,b] of intervals){if(start===null){start=a;end=b;}else if(a<=end)end=Math.max(end,b);else{sum+=end-start;start=a;end=b;}}
  if(start!==null)sum+=end-start;
  area+=(xs[i]-xs[i-1])*sum;
 }return round(area);
}
// Rectangle coordinates represent conceptual wall centerlines, not finished clear dimensions.
function takeoff(s){
 const height=s.wallHeight??3,thickness=s.wallThickness??.15;
 number(height,'height',2,6);number(thickness,'thickness',.05,.6);
 number(s.width,'width',3,30);number(s.depth,'depth',5,60);integer(s.floors,'floors',1,5);
 if(!Array.isArray(s.rooms)||s.rooms.length>250)throw Error('INVALID_ROOMS');
 const ids=new Set(),groups=new Map(),issues=[],floors=[];
 if(!s.rooms.length)issues.push("Chưa có phòng trong mặt bằng");
 for(const r of s.rooms){
  text(r.id,'room.id');if(ids.has(r.id))throw Error('DUPLICATE_ROOM');ids.add(r.id);
  integer(r.floor,'floor',0,s.floors-1);number(r.x,'x');number(r.y,'y');number(r.w,'w',.5,30);number(r.h,'h',.5,60);
  if(r.x+r.w>s.width+.001||r.y+r.h>s.depth+.001)throw Error('ROOM_OUTSIDE_PLOT');
  for(const [axis,c,a,b] of [['h',r.y,r.x,r.x+r.w],['h',r.y+r.h,r.x,r.x+r.w],['v',r.x,r.y,r.y+r.h],['v',r.x+r.w,r.y,r.y+r.h]]){
   const key=`${r.floor}:${axis}:${round(c)}`;if(!groups.has(key))groups.set(key,[]);groups.get(key).push({a:round(a),b:round(b),roomId:r.id});
  }
 }
 for(let f=0;f<s.floors;f++){
  const rs=s.rooms.filter(r=>r.floor===f),area=unionArea(rs),sum=rs.reduce((a,r)=>a+r.w*r.h,0);
  floors.push({floor:f,area});if(sum-area>.001)issues.push(`Tầng ${f+1}: phòng chồng lấn ${round(sum-area)} m²`);
 }
 const walls=[];
 for(const [key,segments] of groups){
  const [floor,axis,c]=key.split(':'),ends=[...new Set(segments.flatMap(s=>[s.a,s.b]))].sort((a,b)=>a-b);
  for(let i=1;i<ends.length;i++){
   const a=ends[i-1],b=ends[i],members=segments.filter(s=>s.a<=a&&s.b>=b);if(!members.length)continue;
   walls.push({id:`${key}:${a}:${b}`,floor:+floor,axis,c:+c,a,b,length:round(b-a),height,thickness,roomIds:[...new Set(members.map(m=>m.roomId))]});
  }
 }
 const openingIds=new Set(),openings=[];
 for(const o of s.openings??[]){
  const wall=walls.find(w=>w.id===o.wallId);
  const valid=wall&&['door','window'].includes(o.kind)&&[o.width,o.height,o.offset,o.sill].every(n=>typeof n==='number'&&Number.isFinite(n))&&o.width>0&&o.height>0&&o.offset>=0&&o.sill>=0&&o.offset+o.width<=wall.length+.001&&o.sill+o.height<=height+.001&&typeof o.id==='string'&&!openingIds.has(o.id);
  openingIds.add(o.id);
  if(!valid){issues.push(`Cửa ${o.id}: không còn khớp đoạn tường; cần sửa hoặc xóa`);continue;}
  if(openings.some(p=>p.wallId===o.wallId&&p.offset<o.offset+o.width&&p.offset+p.width>o.offset&&p.sill<o.sill+o.height&&p.sill+p.height>o.sill)){issues.push(`Cửa ${o.id}: chồng lên cửa khác`);continue;}
  openings.push({...o});
 }
 const floorArea=round(floors.reduce((s,f)=>s+f.area,0)),wallLength=round(walls.reduce((s,w)=>s+w.length,0));
 const openingArea=round(openings.reduce((s,o)=>s+o.width*o.height,0)),wallArea=round(wallLength*height-openingArea);
 return {floors,walls,openings,issues,valid:!issues.length,floorArea,wallLength,wallArea,wallVolume:round(wallArea*thickness),paintArea:round(wallArea*2),doorArea:round(openings.filter(o=>o.kind==='door').reduce((s,o)=>s+o.width*o.height,0)),windowArea:round(openings.filter(o=>o.kind==='window').reduce((s,o)=>s+o.width*o.height,0)),basis:'Hình học ý tưởng theo tim tường; chưa trừ nút giao tường, chưa phải khối lượng thi công'};
}
const PRICE_ITEMS=[
 {id:'structure',name:'Dự trù kết cấu theo diện tích (chưa bóc thép/móng)',unit:'m2',quantity:'floorArea',price:3150000},
 {id:'floor',name:'Vật liệu sàn',unit:'m2',quantity:'floorArea',price:300000},
 {id:'wall',name:'Xây tường (tạm tính theo diện tích)',unit:'m2',quantity:'wallArea',price:240000},
 {id:'paint',name:'Sơn hai mặt tường',unit:'m2',quantity:'paintArea',price:75000},
 {id:'door',name:'Cửa đi',unit:'m2',quantity:'doorArea',price:1800000},
 {id:'window',name:'Cửa sổ',unit:'m2',quantity:'windowArea',price:1500000},
 {id:'labor',name:'Nhân công hoàn thiện (tách riêng)',unit:'m2',quantity:'floorArea',price:800000},
 {id:'preparation',name:'Chuẩn bị công trường (khoản dự trù)',unit:'gói',quantity:'one',price:25000000}
];
function defaultUpgrade(){return {wallHeight:3,wallThickness:.15,openings:[],prices:PRICE_ITEMS.map(p=>({id:p.id,unit:p.unit,price:p.price,source:'DEMO — dữ liệu minh họa',sourceUrl:'',date:'2026-09-21',region:'DEMO',kind:'demo',taxRate:0,wasteRate:0})),contingencyRate:.12,constructionMonths:8,retentionPercent:5,retentionDelay:12,loanDraws:[{month:1,percent:100}],incomeFactor:1,loanFeePercent:0,annualInflation:3,annualOperating:24};}
function validateUpgrade(raw){
 const out={...defaultUpgrade(),...raw};
 for(const [k,min,max] of [['wallHeight',2,6],['wallThickness',.05,.6],['contingencyRate',0,1],['retentionPercent',0,30],['loanFeePercent',0,20],['incomeFactor',0,2],['annualInflation',0,30],['annualOperating',0,10000]])number(out[k],k,min,max);
 integer(out.constructionMonths,'constructionMonths',1,60);integer(out.retentionDelay,'retentionDelay',0,60);
 if(!Array.isArray(out.openings)||out.openings.length>500)throw Error('INVALID_OPENINGS');
 if(!Array.isArray(out.prices)||out.prices.length>50)throw Error('INVALID_PRICES');
 const ids=new Set();out.prices=out.prices.map(p=>{
  const item=PRICE_ITEMS.find(i=>i.id===p.id);if(!item||ids.has(p.id)||p.unit!==item.unit)throw Error('PRICE_UNIT_OR_ID');ids.add(p.id);
  if(p.price!==null)integer(p.price,'price',0,1e12);
  for(const k of ['source','date','region'])text(p[k],k);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||new Date(p.date).toISOString().slice(0,10)!==p.date)throw Error('PRICE_DATE');
  if(!['demo','manual_quote'].includes(p.kind))throw Error('PRICE_KIND');
  if(p.sourceUrl&&!/^https?:\/\//.test(p.sourceUrl))throw Error('SOURCE_URL');
  number(p.taxRate??0,'taxRate',0,1);number(p.wasteRate??0,'wasteRate',0,1);
  return {...p,source:p.source.slice(0,300),region:p.region.slice(0,100),sourceUrl:(p.sourceUrl??'').slice(0,1000)};
 });
 if(!Array.isArray(out.loanDraws)||!out.loanDraws.length||out.loanDraws.length>60)throw Error('LOAN_DRAWS');
 for(const d of out.loanDraws){integer(d.month,'drawMonth',1,480);number(d.percent,'drawPercent',0,100);}
 if(Math.abs(out.loanDraws.reduce((s,d)=>s+d.percent,0)-100)>.001)throw Error('Tổng tỷ lệ giải ngân vay phải bằng 100%');
 return out;
}
function projectLoan(s){
 const principal=Math.round(s.loan*1e6),months=s.years*12;
 integer(principal,'principal',0,1e14);integer(months,'months',1,480);integer(s.promo,'promo',0,480);
 number(s.rate,'rate',0,50);number(s.postRate,'postRate',0,50);
 if(!['annuity','equal'].includes(s.method))throw Error('METHOD');
 const draws=s.loanDraws??[{month:1,percent:100}];let allocated=0,cumulative=0;
 const disbursements=draws.map(d=>{integer(d.month,'drawMonth',1,months);number(d.percent,'drawPercent',0,100);cumulative+=d.percent;const target=Math.round(principal*cumulative/100),amount=target-allocated;allocated=target;return{month:d.month,amount};});
 if(Math.abs(cumulative-100)>.001)throw Error('DRAW_TOTAL');
 let balance=0,payment=0,equalPrincipal=0,previousRate=-1;const rows=[];
 for(let month=1;month<=months;month++){
  const openingBalance=balance,draw=disbursements.filter(d=>d.month===month).reduce((a,d)=>a+d.amount,0);balance+=draw;
  const rate=(month<=s.promo?s.rate:s.postRate)/1200,remaining=months-month+1;
  if(draw||rate!==previousRate){payment=rate===0?balance/remaining:balance*rate/(1-Math.pow(1+rate,-remaining));equalPrincipal=balance/remaining;}
  const interest=Math.round(balance*rate),paid=month===months?balance:Math.min(balance,Math.max(0,Math.round(s.method==='equal'?equalPrincipal:payment-interest)));
  const fee=Math.round(draw*(s.loanFeePercent??0)/100);balance-=paid;
  rows.push({month,openingBalance,loanDraw:draw,principalPaid:paid,interest,fee,payment:paid+interest+fee,closingBalance:balance});previousRate=rate;
 }return rows;
}
function fingerprint(value){const str=JSON.stringify(value);let h=2166136261;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(16).padStart(8,'0');}
function buildSnapshot(state,asOf=new Date().toISOString().slice(0,10)){
 const upgrade=validateUpgrade(Object.fromEntries(Object.keys(defaultUpgrade()).filter(k=>state[k]!==undefined).map(k=>[k,state[k]])));
 const s={...state,...upgrade},geometry=takeoff(s),loans=projectLoan(s),warnings=[...geometry.issues],missing=[],priceFlags=[];
 const lines=[];
 for(const def of PRICE_ITEMS){
  const quantity=def.quantity==='one'?1:geometry[def.quantity],p=s.prices.find(p=>p.id===def.id);
  if(quantity===0)continue;
  if(!p||p.price===null){missing.push(def.name);continue;}
  if(p.kind==='demo')priceFlags.push(`${def.name}: giá minh họa`);
  else if(p.region.trim().toLowerCase()!==s.location.trim().toLowerCase())priceFlags.push(`${def.name}: báo giá khác địa điểm dự án`);
  const age=(Date.parse(asOf)-Date.parse(p.date))/86400000;
  if(age>90||age<0)priceFlags.push(`${def.name}: ngày báo giá ${age<0?'ở tương lai':'quá 90 ngày'}`);
  // Manual quotes are assumed applicable exactly as entered. Preset multiplier only for demo.
  const factor=p.kind==='demo'?([.9,1,1.25][s.tier??1])*(def.id==='floor'?[.85,1,1.25][s.material?.floor??1]:def.id==='paint'?[.85,1,1.25][s.material?.paint??1]:def.id==='door'?[.85,1,1.25][s.material?.door??1]:1):1;
  lines.push({id:def.id,description:def.name,quantity,unit:def.unit,priceUnit:def.unit,quantityConfirmed:true,unitPrice:Math.round(p.price*factor),taxRate:p.taxRate??0,wasteRate:p.wasteRate??0,priceSource:p.source,priceDate:p.date,sourceUrl:p.sourceUrl,region:p.region,kind:p.kind});
 }
 const budget=Math.round((s.cash+s.loan-s.reserve)*1e6);
 const quote=lines.length?estimate({lines,contingencyRate:s.contingencyRate,availableCapital:Math.max(0,budget)}):{items:[],baseTotal:0,constructionContingency:0,total:0};
 const retain=Math.round(s.retentionPercent*100),count=s.constructionMonths,regular=10000-retain;
 const stages=Array.from({length:count},(_,i)=>({id:`month-${i+1}`,month:i+1,basisPoints:Math.floor(regular/count)+(i<regular%count?1:0)}));
 if(retain)stages.push({id:'retention',month:count+s.retentionDelay,basisPoints:retain});
 const milestones=milestonePlan(quote.total,stages),horizon=Math.max(loans.length,count+s.retentionDelay);
 const monthly=cashflow({openingCash:Math.round(s.cash*1e6),emergencyReserve:Math.round(s.reserve*1e6),months:Array.from({length:horizon},(_,i)=>({income:Math.round(s.income*1e6*s.incomeFactor),livingCosts:Math.round(s.living*1e6),existingDebt:Math.round(s.debt*1e6),loanDraw:loans[i]?.loanDraw??0,loanPayment:loans[i]?.payment??0,construction:milestones.filter(m=>m.month===i+1).reduce((a,m)=>a+m.amount,0)}))});
 const peak=Math.max(0,...loans.map(r=>r.payment));
 if(budget<0)warnings.push('Quỹ giữ lại lớn hơn tổng nguồn vốn');
 if(s.reserve>s.cash)warnings.push('Quỹ khẩn cấp lớn hơn tiền mặt hiện có');
 if(monthly.some(r=>r.cashShortfall>0))warnings.push('Có tháng thiếu tiền mặt');
 const inputs={name:s.name,location:s.location,geometry:{rooms:s.rooms,width:s.width,depth:s.depth,floors:s.floors,wallHeight:s.wallHeight,wallThickness:s.wallThickness,openings:s.openings},prices:s.prices,finance:{cash:s.cash,reserve:s.reserve,income:s.income,living:s.living,debt:s.debt,loan:s.loan,years:s.years,rate:s.rate,postRate:s.postRate,promo:s.promo,method:s.method,loanDraws:s.loanDraws,loanFeePercent:s.loanFeePercent,incomeFactor:s.incomeFactor},construction:{months:count,retentionPercent:s.retentionPercent,retentionDelay:s.retentionDelay},tier:s.tier,material:s.material,contingencyRate:s.contingencyRate,assumptions:{maintenance:s.maintenance,annualInflation:s.annualInflation,annualOperating:s.annualOperating},actualSpending:s.spending??[],checklist:s.checks??{},household:{elder:s.elder,kids:s.kids,people:s.people,soil:s.soil,style:s.style,direction:s.direction,partnerPresent:s.partnerPresent!==false,partnerBirth:s.partnerBirth??null,partnerGender:s.partnerGender??null,children:Array.isArray(s.householdChildren)?s.householdChildren.map(c=>({id:c.id,name:c.name,birth:c.birth,gender:c.gender,room:c.room})):[],parents:Array.isArray(s.householdParents)?s.householdParents.map(p=>({id:p.id,name:p.name,birth:p.birth,mobility:p.mobility})):[]},asOf};
 const id=`BMH-${ENGINE_VERSION}-${fingerprint(inputs)}`;
 return {id,engineVersion:ENGINE_VERSION,asOf,inputs,geometry,quote,loans,monthly,milestones,budget,budgetGap:budget-quote.total,peakPayment:peak,monthlyRemainder:Math.round((s.income*s.incomeFactor-s.living-s.debt)*1e6)-peak,netDebtRatio:s.income*s.incomeFactor>0?(peak+s.debt*1e6)/(s.income*s.incomeFactor*1e6):null,missing,warnings,priceFlags,status:!geometry.valid?'invalid_geometry':missing.length?'incomplete':'concept_estimate',exclusions:['Móng/thép/bê tông chưa bóc tách kỹ thuật; khoản kết cấu chỉ là dự trù diện tích','MEP, mái, sân cổng, nội thất rời, thủ tục chưa xác định','Đơn giá cần kiểm tra phạm vi để không trùng nhân công/vật liệu','Lãi theo tháng; giải ngân đầu tháng, chưa có lãi theo ngày/ân hạn/tất toán sớm']};
}
function reviewFacts(snapshot){return [
 {id:'budget',text:`Chênh ngân sách: ${snapshot.budgetGap} VND`,severity:snapshot.budgetGap<0?'warning':'info'},
 {id:'geometry',text:snapshot.geometry.valid?'Hình học phòng không chồng lấn; không phải xác nhận công năng/kết cấu':snapshot.geometry.issues.join('; '),severity:snapshot.geometry.valid?'info':'warning'},
 {id:'cashflow',text:`Tháng đầu thiếu tiền: ${snapshot.monthly.find(r=>r.cashShortfall>0)?.month??'không có trong kịch bản'}`,severity:snapshot.monthly.some(r=>r.cashShortfall>0)?'warning':'info'},
 {id:'sources',text:`${snapshot.priceFlags.length} cảnh báo nguồn giá; ${snapshot.missing.length} hạng mục thiếu giá`,severity:snapshot.priceFlags.length||snapshot.missing.length?'warning':'info'},
 {id:'engineering',text:'Chưa có hồ sơ khảo sát, kết cấu và nghiệm thu chuyên môn; không kết luận an toàn công trình.',severity:'warning'}
];}
function validateReview(data,snapshot){
 if(data?.snapshotId!==snapshot.id)throw Error('AI_STALE_SNAPSHOT');
 if(!Array.isArray(data.insights)||!data.insights.length||data.insights.length>12)throw Error('AI_SCHEMA');
 const ids=new Set(reviewFacts(snapshot).map(f=>f.id));
 return {snapshotId:snapshot.id,insights:data.insights.map(i=>{if(typeof i.text!=='string'||!i.text.trim()||i.text.length>1500||!Array.isArray(i.evidenceIds)||!i.evidenceIds.length||!i.evidenceIds.every(id=>ids.has(id)))throw Error('AI_EVIDENCE');return{text:i.text,evidenceIds:i.evidenceIds};})};
}

globalThis.BMHCore={number,integer,text,loanSchedule,financialSummary,cashflow,estimate,milestonePlan,calibrate,roomAreas,rankTemplates,lifecycle,steps,capabilities,invalidate,canAccessStep,ENGINE_VERSION,unionArea,takeoff,PRICE_ITEMS,defaultUpgrade,validateUpgrade,projectLoan,fingerprint,buildSnapshot,reviewFacts,validateReview};
})();
