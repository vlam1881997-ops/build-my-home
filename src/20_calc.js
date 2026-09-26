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
  const dti=finance.income?peak/finance.income:0; const remainder=finance.income-finance.living-peak; const capacity=finance.cash-finance.reserve+finance.loan;
  const targetBudget=Math.max(0,Number(finance.targetBudget)||0),available=targetBudget>0?targetBudget:capacity;
  return {first,post,peak,dti,remainder,capacity,targetBudget,available,schedule};
};
BMH.planArea = () => BMH.state.project.plan.rooms.reduce((s,r)=>s+r.w*r.h,0);

BMH.rangeAverage = value => {
  const nums=String(value||'').replaceAll('.','').match(/\d+(?:,\d+)?/g)?.map(x=>Number(x.replace(',','.'))).filter(Number.isFinite)||[];
  if(!nums.length)return 0;
  return nums.length>1?(nums[0]+nums[1])/2:nums[0];
};
BMH.performancePlan = () => {
  const p=BMH.state.project, perf=p.performance||{}, site=p.site, profile=BMH.regionProfile(site), build=BMH.buildableEnvelope(site), household=BMH.householdNeeds();
  const roofArea=Math.max(18,build.targetPlate*.88), usableSolarArea=roofArea*.56;
  const solarFactors={'TP. Hồ Chí Minh':1450,'Đà Nẵng':1500,'Hà Nội':1250,'Đồng Nai':1500,'Tây Ninh':1550,'Cần Thơ':1480};
  const solarFactor=solarFactors[site.province]||1420, orient=BMH.orientationAnalysis(site), orientMul=.84+(orient.score/100)*.16;
  const solarCapacity=Math.max(0,Math.round((usableSolarArea/5.5)*10)/10), solarYield=Math.round(solarCapacity*solarFactor*orientMul);
  const floorArea=Math.max(BMH.planArea(),build.gfa*.88), heatRisk=BMH.riskValue(profile.heat), rooms=p.plan.rooms.filter(r=>['living','bed','kitchen'].includes(r.type));
  const env=rooms.map(r=>BMH.roomEnvironment?BMH.roomEnvironment(r):null).filter(Boolean), avgHeat=env.length?env.reduce((a,x)=>a+x.heatExposure,0)/env.length:55, avgVent=env.length?env.reduce((a,x)=>a+x.ventilation,0)/env.length:70;
  const modeMul={economy:.94,balanced:1,comfort:1.10}[perf.mode]||1;
  const baseDemand=Math.round((floorArea*(42+heatRisk*9)+household.people*360)*modeMul);
  const passiveReduction=BMH.clamp((perf.coolRoof?.07:0)+(perf.smartShading?.045:0)+(avgVent>=75?.035:avgVent>=60?.018:0)+(orient.score>=80?.025:0),0,.18);
  const demandAfterPassive=Math.round(baseDemand*(1-passiveReduction));
  const selfUse=perf.solarEnabled?Math.min(demandAfterPassive,Math.round(solarYield*.76)):0, gridDemand=Math.max(0,demandAfterPassive-selfUse);
  const electricityRate=3200, baselineElectricCost=baseDemand*electricityRate, annualElectricCost=gridDemand*electricityRate;
  const rainfall=BMH.rangeAverage(profile.rainfall), rainCollected=Math.round((rainfall/1000)*roofArea*.80*10)/10, rainDemand=Math.round(household.people*.045*365*10)/10;
  const rainReuse=perf.rainwaterEnabled?Math.min(rainCollected,rainDemand):0, waterRate=12000, annualWaterSavings=Math.round(rainReuse*waterRate);
  const tankSize=Math.max(2,Math.min(8,Math.round((roofArea*.045)*2)/2));
  const solarCapex=perf.solarEnabled?Math.round(solarCapacity*13500000):0, rainCapex=perf.rainwaterEnabled?Math.round(tankSize*5200000):0, coolRoofCapex=perf.coolRoof?Math.round(roofArea*185000):0, shadingCapex=perf.smartShading?Math.round(Math.max(10,site.width*site.floors*1.6)*620000):0;
  const upgradeCost=solarCapex+rainCapex+coolRoofCapex+shadingCapex, annualEnergySavings=Math.max(0,baselineElectricCost-annualElectricCost), annualSavings=annualEnergySavings+annualWaterSavings;
  const payback=annualSavings>0?upgradeCost/annualSavings:null;
  const comfortScore=BMH.clamp(Math.round(58+orient.score*.16+avgVent*.13+(perf.coolRoof?6:0)+(perf.smartShading?5:0)-Math.max(0,avgHeat-65)*.10),50,97);
  const waterScore=BMH.clamp(Math.round(58+(perf.rainwaterEnabled?18:0)+(BMH.riskValue(profile.flood)>=2?8:4)+(rainReuse>rainDemand*.55?10:4)),50,96);
  const energyScore=BMH.clamp(Math.round(54+passiveReduction*120+(perf.solarEnabled?18:0)+(selfUse/Math.max(1,demandAfterPassive))*20),50,98);
  const tenYearOps=Math.round(annualElectricCost*10), tenYearSavings=Math.round(annualSavings*10), solarCoverage=Math.round(selfUse/Math.max(1,demandAfterPassive)*100);
  return {roofArea,usableSolarArea,solarFactor,solarCapacity,solarYield,floorArea,baseDemand,passiveReduction,demandAfterPassive,selfUse,gridDemand,electricityRate,baselineElectricCost,annualElectricCost,rainfall,rainCollected,rainDemand,rainReuse,waterRate,annualWaterSavings,tankSize,solarCapex,rainCapex,coolRoofCapex,shadingCapex,upgradeCost,annualEnergySavings,annualSavings,payback,comfortScore,waterScore,energyScore,tenYearOps,tenYearSavings,solarCoverage,avgHeat:Math.round(avgHeat),avgVent:Math.round(avgVent),mode:perf.mode||'balanced'};
};
BMH.materialPremium = (choices=BMH.state.project.materials.choices) => Object.entries(choices).reduce((s,[cat,id])=>s+(BMH.MATERIALS[cat]?.find(x=>x.id===id)?.premium||0),0);
BMH.estimate = () => {
  const p=BMH.state.project, area=Math.max(BMH.planArea(),p.site.width*p.site.depth*Math.min(1,p.site.floors*.72));
  const tierMul={economy:.9,standard:1,premium:1.22}[p.materials.tier]||1;
  const basis=BMH.dataCostBasis?BMH.dataCostBasis():{shellPerM2:3600000,finishPerM2:2350000,prepPerM2:280000};
  const shell=Math.round(area*basis.shellPerM2); const finish=Math.round(area*basis.finishPerM2*tierMul)+BMH.materialPremium();
  const adapt=BMH.siteAdaptation?BMH.siteAdaptation(p.site):{roadPct:(p.site.road<3 ? .12 : p.site.road<5 ? .05 : .02),climatePct:0};
  const si=p.siteIntelligence||{},siteKey=(Number(p.site.lat)||0).toFixed(4)+','+(Number(p.site.lng)||0).toFixed(4)+':'+(Number(p.site.road)||0);
  if(si.status==='ready'&&si.key===siteKey&&Number.isFinite(Number(si.transport?.surchargePct))){
    adapt.roadPct=BMH.clamp(Number(si.transport.surchargePct),0,25)/100;
    adapt.transportSource='Site Intelligence · '+String(si.fetchedAt||'');
  }else adapt.transportSource='Ước tính theo bề rộng đường khai báo';
  const transport=Math.round((shell+finish)*adapt.roadPct);
  const climatePackage=BMH.climatePackageMultiplier?BMH.climatePackageMultiplier(p.materials.climatePackage):1;
  const climatePrep=Math.round((shell+finish)*adapt.climatePct*climatePackage);
  const performance=BMH.performancePlan?BMH.performancePlan():{upgradeCost:0};
  const performanceUpgrade=Math.round(performance.upgradeCost||0);
  const prep=Math.round(area*(basis.prepPerM2||280000)); const subtotal=shell+finish+transport+climatePrep+performanceUpgrade+prep; const contingency=Math.round(subtotal*.10); const total=subtotal+contingency;
  return {area,shell,finish,transport,climatePrep,climatePackage,performanceUpgrade,performance,adaptation:adapt,basis,prep,contingency,total,budget:BMH.financeSummary().available,gap:BMH.financeSummary().available-total};
};
BMH.kua = (birth,gender='Nam') => {
  let y=String(Math.round(Number(birth)||0)); if(y.length!==4) return null; let sum=[...y].reduce((s,d)=>s+Number(d),0); while(sum>9)sum=[...String(sum)].reduce((s,d)=>s+Number(d),0);
  let k=gender==='Nữ'?(Number(birth)>=2000?6:5)+sum:(Number(birth)>=2000?9:10)-sum; while(k>9)k-=9; while(k<=0)k+=9; if(k===5)k=gender==='Nữ'?8:2;
  const east=[1,3,4,9], dirs=east.includes(k)?['Đông Nam','Đông','Nam','Bắc']:['Tây Nam','Tây','Tây Bắc','Đông Bắc'];
  return {number:k,group:east.includes(k)?'Đông tứ mệnh':'Tây tứ mệnh',dirs};
};
BMH.fengProfile = () => {
  const h=BMH.state.project.household||{}, labels=['Sinh Khí','Thiên Y','Diên Niên','Phục Vị'];
  const owner=BMH.kua(h.ownerBirth,h.ownerGender);
  const partner=(h.partnerEnabled===false||!Number(h.partnerBirth))?null:BMH.kua(h.partnerBirth,h.partnerGender||'Nữ');
  const directions=['Bắc','Đông Bắc','Đông','Đông Nam','Nam','Tây Nam','Tây','Tây Bắc'];
  const ownerWeight=new Map((owner?.dirs||[]).map((d,i)=>[d,4-i]));
  const partnerWeight=new Map((partner?.dirs||[]).map((d,i)=>[d,4-i]));
  const rows=directions.map(dir=>({dir,owner:ownerWeight.get(dir)||0,partner:partnerWeight.get(dir)||0})).map(r=>({...r,score:r.owner+r.partner}));
  const overlap=rows.filter(r=>r.owner&&r.partner).sort((a,b)=>b.score-a.score||b.owner-a.owner||b.partner-a.partner);
  const blended=rows.filter(r=>r.score>0).sort((a,b)=>b.score-a.score||b.owner-a.owner||b.partner-a.partner);
  const ranked=(partner?(overlap.length?overlap:blended):blended).slice(0,4);
  const mode=!partner?'owner-only':overlap.length?'consensus':'balanced';
  const title=mode==='owner-only'?'Theo gia chủ':mode==='consensus'?'Điểm giao nhau của gia chủ + người đồng hành':'Kết hợp gia chủ + người đồng hành';
  const note=mode==='owner-only'?'Đang dùng cung mệnh của gia chủ vì chưa có người đồng hành hợp lệ.'
    :mode==='consensus'?'Các hướng dưới đây cùng thuận cho cả gia chủ và người đồng hành.'
    :'Hai người không trùng toàn bộ hướng tốt, nên hệ thống xếp hạng cân bằng để tham khảo.';
  return {owner,partner,dirs:ranked.map(r=>r.dir),rows:ranked,labels,title,note,mode};
};

BMH.fengDirectionScore = (dir, feng=BMH.fengProfile()) => {
  if(!feng?.owner)return 50;
  const ownerGood=!!feng.owner?.dirs?.includes(dir), partnerGood=!!feng.partner?.dirs?.includes(dir);
  if(!feng.partner)return ownerGood?100:35;
  if(ownerGood&&partnerGood)return 100;
  if(ownerGood||partnerGood)return 62;
  return 28;
};
BMH.directionDecisionMatrix = () => {
  const site=BMH.state.project.site, feng=BMH.fengProfile();
  return BMH.DIRECTIONS.map(([dir,angle])=>{
    const climate=BMH.orientationAnalysis({...site,frontDirection:dir}).score;
    const fengScore=BMH.fengDirectionScore(dir,feng);
    const total=BMH.clamp(Math.round(climate*.72+fengScore*.28),35,98);
    const tag=fengScore>=95?'Hợp cả hai':fengScore>=60?'Hợp một người':fengScore<=30?'Không phải hướng tốt chung':'Tham khảo';
    return {dir,angle,climate,feng:fengScore,total,tag};
  }).sort((a,b)=>b.total-a.total);
};
BMH.householdAdvice = () => {
  const h=BMH.state.project.household, out=[];
  if(h.relatives.some(r=>r.mobility!=='Bình thường')) out.push('Ưu tiên phòng ngủ người lớn tuổi ở tầng trệt, gần WC và lối ra vào, hạn chế bậc cấp.');
  else if(h.relatives.length) out.push('Nên dành lối đi ngắn, chống trượt và WC thuận tiện cho ba mẹ/người thân.');
const feng=BMH.fengProfile(), own=feng?.owner; const childCount=h.children.length;
  if(childCount) out.push(`${childCount} con: bố trí khu học tập có ánh sáng tự nhiên; hướng bàn/giường phong thủy chỉ dùng như tham khảo sau công năng.`);
  if(own) out.push(`Gia chủ thuộc ${own.group}; các hướng tham khảo: ${own.dirs.join(', ')}.`);
  if(feng?.partner) out.push(`${feng.title}: ${feng.dirs.join(', ')}.`);
  return out;
};

BMH.householdNeeds = () => {
  const h=BMH.state.project.household;
  const baseAdults=1+(h.partnerEnabled!==false?1:0),actualPeople=baseAdults+h.children.length+h.relatives.length;
  const requested=Math.max(0,Number(h.requestedSize)||0),people=Math.max(actualPeople,requested),extraPeople=Math.max(0,people-actualPeople);
  const separateChildren=h.children.filter(c=>c.room!=='Ngủ chung').length;
  const sharedChildren=h.children.length-separateChildren;
  const relativeBedrooms=h.relatives.length?1:0;
  const bedrooms=Math.max(1,1+separateChildren+(sharedChildren?1:0)+relativeBedrooms+Math.ceil(extraPeople/2));
  const limited=h.relatives.some(r=>r.mobility&&r.mobility!=='Bình thường');
  const bathrooms=Math.max(1,Math.ceil(people/4));
  return {
    bedrooms,
    bathrooms,
    groundFloorBedroom: h.relatives.length>0,
    accessibleWC: limited||h.relatives.length>0,
    studyZones: h.children.length?Math.max(1,Math.ceil(h.children.length/2)):0,
    people,
    actualPeople,
    projectedPeople:requested>actualPeople
  };
};

BMH.designReview = () => {
  const e=BMH.estimate(), issues=BMH.plannerIssues?BMH.plannerIssues():[], p=BMH.state.project;
  const penalty=issues.reduce((s,i)=>s+(i.sev==='error'?10:i.sev==='warn'?5:2),0);
  const circulationScores=Array.from({length:p.site.floors},(_,f)=>BMH.circulationAnalysis?BMH.circulationAnalysis(f).score:80);
  const circulation=circulationScores.length?Math.round(circulationScores.reduce((a,b)=>a+b,0)/circulationScores.length):80;
  const feasibility=BMH.siteFeasibility?BMH.siteFeasibility(p.site):{score:80};
  const functionScore=BMH.clamp(Math.round((96-penalty)*.60+circulation*.24+feasibility.score*.16),45,98);
  const budgetRatio=e.budget>0?e.total/e.budget:1.4;
  const budgetScore=BMH.clamp(Math.round(94-Math.max(0,budgetRatio-.82)*85),42,96);
  const reg=BMH.regionProfile?BMH.regionProfile(p.site):(BMH.REGIONS[p.site.province]||{});
  const climatePenalty=(BMH.riskValue?.(reg.flood)||0)*3+(BMH.riskValue?.(reg.storm)||0)*3+(BMH.riskValue?.(reg.heat)||0)*2+(BMH.riskValue?.(reg.corrosion)||0);
  const envRooms=p.plan.rooms.filter(r=>['living','bed','kitchen'].includes(r.type)), envScores=envRooms.map(r=>BMH.roomEnvironment?BMH.roomEnvironment(r):null).filter(Boolean);
  const daylight=envScores.length?Math.round(envScores.reduce((s,x)=>s+x.daylight,0)/envScores.length):70, ventilation=envScores.length?Math.round(envScores.reduce((s,x)=>s+x.ventilation,0)/envScores.length):70;
  const orientation=BMH.orientationAnalysis?BMH.orientationAnalysis(p.site):{score:75};
  const climateScore=BMH.clamp(Math.round((92-climatePenalty)*.44+daylight*.18+ventilation*.20+orientation.score*.18),52,96);
  const materialScore=BMH.materialClimateScore?BMH.materialClimateScore(p.site,p.materials.tier):({economy:72,standard:84,premium:93}[p.materials.tier]||82);
  const fengProfile=BMH.fengProfile?BMH.fengProfile():null, front=p.site.frontDirection; const fengScore=fengProfile?BMH.clamp(Math.round(BMH.fengDirectionScore(front,fengProfile)*.75+75*.25),45,96):70;
  const durability=BMH.clamp(materialScore+(p.site.soil.includes('cứng')?3:p.site.soil.includes('trũng')?-6:0),55,96);
  const perf=BMH.performancePlan?BMH.performancePlan():{energyScore:75,comfortScore:75};
  const overall=Math.round(budgetScore*.15+functionScore*.20+climateScore*.16+materialScore*.12+fengScore*.07+durability*.12+feasibility.score*.06+perf.energyScore*.07+perf.comfortScore*.05);
  return {overall,budget:budgetScore,function:functionScore,climate:climateScore,material:materialScore,feng:fengScore,durability,energy:perf.energyScore,comfort:perf.comfortScore,daylight,ventilation,circulation,orientation:orientation.score,siteFit:feasibility.score,issues};
};
