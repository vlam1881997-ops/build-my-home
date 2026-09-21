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
