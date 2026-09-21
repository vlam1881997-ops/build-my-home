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
  const shell=Math.round(area*3600000); const finish=Math.round(area*2350000*tierMul)+BMH.materialPremium();
  const adapt=BMH.siteAdaptation?BMH.siteAdaptation(p.site):{roadPct:(p.site.road<3 ? .12 : p.site.road<5 ? .05 : .02),climatePct:0};
  const transport=Math.round((shell+finish)*adapt.roadPct);
  const climatePrep=Math.round((shell+finish)*adapt.climatePct);
  const prep=Math.round(area*280000); const subtotal=shell+finish+transport+climatePrep+prep; const contingency=Math.round(subtotal*.10); const total=subtotal+contingency;
  return {area,shell,finish,transport,climatePrep,adaptation:adapt,prep,contingency,total,budget:BMH.financeSummary().available,gap:BMH.financeSummary().available-total};
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

BMH.householdNeeds = () => {
  const h=BMH.state.project.household;
  const separateChildren=h.children.filter(c=>c.room!=='Ngủ chung').length;
  const sharedChildren=h.children.length-separateChildren;
  const relativeBedrooms=h.relatives.length?1:0;
  const bedrooms=1+separateChildren+(sharedChildren?1:0)+relativeBedrooms;
  const limited=h.relatives.some(r=>r.mobility&&r.mobility!=='Bình thường');
  const bathrooms=Math.max(1,Math.ceil((2+h.children.length+h.relatives.length)/4));
  return {
    bedrooms,
    bathrooms,
    groundFloorBedroom: h.relatives.length>0,
    accessibleWC: limited||h.relatives.length>0,
    studyZones: h.children.length?Math.max(1,Math.ceil(h.children.length/2)):0,
    people:2+h.children.length+h.relatives.length
  };
};

BMH.designReview = () => {
  const e=BMH.estimate(), issues=BMH.plannerIssues?BMH.plannerIssues():[], p=BMH.state.project;
  const penalty=issues.reduce((s,i)=>s+(i.sev==='error'?10:i.sev==='warn'?5:2),0);
  const circulationScores=Array.from({length:p.site.floors},(_,f)=>BMH.circulationAnalysis?BMH.circulationAnalysis(f).score:80);
  const circulation=circulationScores.length?Math.round(circulationScores.reduce((a,b)=>a+b,0)/circulationScores.length):80;
  const functionScore=BMH.clamp(Math.round((96-penalty)*.72+circulation*.28),45,98);
  const budgetRatio=e.budget>0?e.total/e.budget:1.4;
  const budgetScore=BMH.clamp(Math.round(94-Math.max(0,budgetRatio-.82)*85),42,96);
  const reg=BMH.regionProfile?BMH.regionProfile(p.site):(BMH.REGIONS[p.site.province]||{});
  const climatePenalty=(BMH.riskValue?.(reg.flood)||0)*3+(BMH.riskValue?.(reg.storm)||0)*3+(BMH.riskValue?.(reg.heat)||0)*2+(BMH.riskValue?.(reg.corrosion)||0);
  const envRooms=p.plan.rooms.filter(r=>['living','bed','kitchen'].includes(r.type)), envScores=envRooms.map(r=>BMH.roomEnvironment?BMH.roomEnvironment(r):null).filter(Boolean);
  const daylight=envScores.length?Math.round(envScores.reduce((s,x)=>s+x.daylight,0)/envScores.length):70, ventilation=envScores.length?Math.round(envScores.reduce((s,x)=>s+x.ventilation,0)/envScores.length):70;
  const climateScore=BMH.clamp(Math.round((92-climatePenalty)*.55+daylight*.20+ventilation*.25),52,96);
  const materialScore={economy:72,standard:84,premium:93}[p.materials.tier]||82;
  const fengScore=BMH.kua(p.household.ownerBirth,p.household.ownerGender)?78:70;
  const durability=BMH.clamp(materialScore+(p.site.soil.includes('cứng')?3:p.site.soil.includes('trũng')?-6:0),55,96);
  const overall=Math.round(budgetScore*.18+functionScore*.24+climateScore*.18+materialScore*.15+fengScore*.10+durability*.15);
  return {overall,budget:budgetScore,function:functionScore,climate:climateScore,material:materialScore,feng:fengScore,durability,daylight,ventilation,circulation,issues};
};
