import test from 'node:test';
import assert from 'node:assert/strict';
import * as b from '../src/index.mjs';
const loan={principal:120_000_000,months:12,method:'annuity',ratePeriods:[{fromMonth:1,annualRate:0}]};
const line={id:'tile',description:'Demo',quantity:10,quantityConfirmed:true,unit:'m2',priceUnit:'m2',unitPrice:100_000,wasteRate:.1,taxRate:.1,priceSource:'DEMO',priceDate:'2026-09-20'};
test('zero interest amortizes principal exactly',()=>{
 const rows=b.loanSchedule(loan);assert.equal(rows.length,12);assert.ok(rows.every(r=>r.payment===10_000_000));assert.equal(rows.at(-1).closingBalance,0);
});
test('no loan has zero payments',()=>assert.ok(b.loanSchedule({...loan,principal:0}).every(r=>r.payment===0)));
test('known annuity example 1000 at 12 percent over 12 months',()=>{
 const rows=b.loanSchedule({...loan,principal:1000,ratePeriods:[{fromMonth:1,annualRate:.12}]});
 assert.equal(rows[0].payment,89);assert.equal(rows[0].interest,10);assert.equal(rows.at(-1).closingBalance,0);
});
test('equal principal falls as balance decreases',()=>{
 const rows=b.loanSchedule({...loan,method:'equal_principal',ratePeriods:[{fromMonth:1,annualRate:.12}]});
 assert.equal(rows[0].payment,11_200_000);assert.equal(rows[11].payment,10_100_000);
});
test('rate resets on remaining balance and term',()=>{
 const rows=b.loanSchedule({...loan,ratePeriods:[{fromMonth:1,annualRate:0},{fromMonth:7,annualRate:.12}]});
 assert.equal(rows[6].openingBalance,60_000_000);assert.equal(rows[6].interest,600_000);
 assert.ok(rows[6].payment>10_000_000);assert.equal(rows.at(-1).closingBalance,0);
});
test('principal conservation across loan lengths, methods, rates',()=>{
 for(const method of ['annuity','equal_principal']) for(const months of [1,12,180,360]) for(const annualRate of [0,.069,.109]){
  const rows=b.loanSchedule({principal:500_000_003,months,method,ratePeriods:[{fromMonth:1,annualRate}]});
  assert.equal(rows.reduce((s,r)=>s+r.principalPaid,0),500_000_003);
  assert.ok(rows.every(r=>r.closingBalance>=0 && r.payment===r.interest+r.principalPaid));
 }
});
test('reject NaN, negatives, fractional money and invalid periods',()=>{
 for(const principal of [NaN,-1,1.5,Infinity])assert.throws(()=>b.loanSchedule({...loan,principal}));
 assert.throws(()=>b.loanSchedule({...loan,ratePeriods:[]}));
 assert.throws(()=>b.loanSchedule({...loan,ratePeriods:[{fromMonth:2,annualRate:.1}]}));
 assert.throws(()=>b.loanSchedule({...loan,ratePeriods:[{fromMonth:1,annualRate:.1},{fromMonth:1,annualRate:.2}]}));
});
const finance={cash:800_000_000,emergencyReserve:100_000_000,committedLoan:500_000_000,netMonthlyIncome:25_000_000,grossMonthlyIncome:30_000_000,livingCosts:8_000_000,existingMonthlyDebt:1_000_000};
test('monthly remainder subtracts living costs AND existing debt',()=>{
 const r=b.financialSummary(finance,[{payment:5_000_000}]);assert.equal(r.monthlyRemainderAtPeak,11_000_000);assert.equal(r.availableCapital,1_200_000_000);assert.equal(r.peakGrossDTI,.2);assert.equal(r.peakNetDebtRatio,.24);
});
test('zero income is unknown ratio, never safe zero',()=>{
 const r=b.financialSummary({...finance,netMonthlyIncome:0,grossMonthlyIncome:null},[{payment:5_000_000}]);assert.equal(r.peakNetDebtRatio,null);assert.equal(r.peakGrossDTI,null);assert.equal(r.incomeMissing,true);
});
test('reserve cannot exceed cash',()=>assert.throws(()=>b.financialSummary({...finance,emergencyReserve:900_000_000})));
test('cashflow reveals shortage before later drawdown',()=>{
 const r=b.cashflow({openingCash:100,emergencyReserve:20,months:[{construction:120},{loanDraw:200}]});assert.equal(r[0].cashShortfall,20);assert.equal(r[0].reserveGap,40);assert.equal(r[1].closingBalance,180);
});
test('cashflow rejects invalid values',()=>assert.throws(()=>b.cashflow({openingCash:0,months:[{loanDraw:-1}]})));
test('quantity, waste and line tax each counted once',()=>{
 const r=b.estimate({lines:[line],contingencyRate:.1,availableCapital:2_000_000});assert.equal(r.items[0].net,1_100_000);assert.equal(r.items[0].tax,110_000);assert.equal(r.total,1_331_000);assert.equal(r.budgetGap,669_000);
});
test('reject unit mismatch and unconfirmed takeoff',()=>{
 assert.throws(()=>b.estimate({lines:[{...line,priceUnit:'box'}]}));assert.throws(()=>b.estimate({lines:[{...line,quantityConfirmed:false}]}));
});
test('reject duplicate cost lines and missing price evidence',()=>{
 assert.throws(()=>b.estimate({lines:[line,line]}));assert.throws(()=>b.estimate({lines:[{...line,priceSource:''}]}));assert.throws(()=>b.estimate({lines:[{...line,priceDate:'bad'}]}));
});
test('retention belongs inside 100 percent',()=>{
 const r=b.milestonePlan(1001,[{id:'work',basisPoints:9500},{id:'retention',basisPoints:500}]);assert.equal(r.reduce((s,x)=>s+x.amount,0),1001);
 assert.throws(()=>b.milestonePlan(1001,[{id:'work',basisPoints:10000},{id:'retention',basisPoints:500}]));
});
test('cumulative rounding never makes last milestone negative',()=>{
 const r=b.milestonePlan(1,[{id:'a',basisPoints:3000},{id:'b',basisPoints:3000},{id:'c',basisPoints:3000},{id:'d',basisPoints:1000}]);assert.equal(r.reduce((s,x)=>s+x.amount,0),1);assert.ok(r.every(x=>x.amount>=0));
});
test('calibration uses known distance, rejects coincident points',()=>{
 assert.equal(b.calibrate({a:{x:0,y:0},b:{x:300,y:400},knownMeters:5}).metersPerPixel,.01);
 assert.throws(()=>b.calibrate({a:{x:0,y:0},b:{x:0,y:0},knownMeters:5}));
});
const room={id:'living',name:'Living',floor:0,x:0,y:0,width:3,depth:4};
test('room area allows touching boundaries',()=>{
 const r=b.roomAreas([room,{...room,id:'bed',x:3}],{0:{width:6,depth:4}});assert.equal(r.reduce((s,x)=>s+x.netArea,0),24);
});
test('room overlap, outside and duplicate IDs rejected',()=>{
 assert.throws(()=>b.roomAreas([room,{...room,id:'b',x:2}],{0:{width:6,depth:4}}));
 assert.throws(()=>b.roomAreas([room],{0:{width:2,depth:4}}));assert.throws(()=>b.roomAreas([room,room],{0:{width:6,depth:4}}));
});
test('template recommendation returns empty for impossible plot',()=>assert.deepEqual(b.rankTemplates([{width:6,depth:10,bedrooms:2,estimatedCost:1}],{width:5,depth:10,bedrooms:2,availableCapital:10}),[]));
test('lifecycle aggregates transparent assumptions',()=>{
 const r=b.lifecycle({initialCost:100,annualOperatingCost:10,annualMaintenanceCost:5,years:10,repairs:[{year:5,cost:20,assumption:'test'}]});assert.equal(r.nominalTotal,270);assert.equal(r.rows[4].total,35);assert.equal(r.presentValue,270);
});
test('discount affects present value without changing nominal total',()=>{
 const r=b.lifecycle({initialCost:100,annualOperatingCost:10,annualMaintenanceCost:0,years:1,discountRate:.1});assert.equal(r.nominalTotal,110);assert.equal(r.presentValue,109);
});
test('lifecycle rejects repairs outside horizon',()=>assert.throws(()=>b.lifecycle({initialCost:1,annualOperatingCost:0,annualMaintenanceCost:0,years:10,repairs:[{year:11,cost:1,assumption:'test'}]})));
test('editing design invalidates dependent reports and rejects stale revision',()=>{
 const original={id:'p',revision:1,stale:[]};const r=b.invalidate(original,'design',1);assert.equal(r.revision,2);assert.ok(r.stale.includes('estimate'));assert.ok(r.stale.includes('exports'));assert.equal(original.revision,1);assert.throws(()=>b.invalidate(r,'design',1));
});
test('paid step requires matching project and user, active entitlement',()=>{
 const args={stepId:9,projectId:'p',userId:'u',entitlements:[]};assert.equal(b.canAccessStep(args),false);
 const e={projectId:'p',userId:'u',key:'project_package',status:'active'};
 assert.equal(b.canAccessStep({...args,entitlements:[e]}),true);
 for(const override of [{projectId:'other'},{userId:'other'},{status:'revoked'}])assert.equal(b.canAccessStep({...args,entitlements:[{...e,...override}]}),false);
});
test('free steps and explicit trial server policy',()=>{
 const args={projectId:'p',userId:'u',entitlements:[]};assert.equal(b.canAccessStep({...args,stepId:7}),true);assert.equal(b.canAccessStep({...args,stepId:10,paywallEnabled:false}),true);assert.equal(b.canAccessStep({...args,stepId:11}),false);
});
