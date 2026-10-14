import test from 'node:test';
import assert from 'node:assert/strict';
import {designClient} from './fixtures/design-client.mjs';
const terms=(extra={})=>({principal:120000000,months:12,method:'equal_principal',graceMonths:0,ratePeriods:[{fromMonth:1,annualRatePct:12}],draws:[{month:1,amount:120000000}],fees:[],prepayments:[{month:3,amount:18000000,feeAmount:360000,sourceReference:'TEST-ONLY customer agreement'}],prepaymentMode:'reduce-payment',sourceReference:'TEST-ONLY customer terms',...extra});
test('end-month prepayment: independent equal-principal reconciliation and fee charged once',()=>{
 const B=designClient(),s=B.simulateLoanTerms(terms());assert.equal(s.status,'simulated');
 assert.equal(s.rows[2].interest,1000000);assert.equal(s.rows[2].scheduledPrincipal,10000000);assert.equal(s.rows[2].principalPaid,28000000);assert.equal(s.rows[2].closingBalance,72000000);assert.equal(s.rows[2].totalPayment,29360000);
 assert.equal(s.rows[3].scheduledPrincipal,8000000);assert.equal(s.rows[3].interest,720000);assert.equal(s.rows.at(-1).closingBalance,0);assert.equal(s.totalPrincipal,120000000);assert.equal(s.totalFees,360000);
 assert.equal(s.totalInterest,1200000+1100000+1000000+Array.from({length:9},(_,i)=>(72000000-i*8000000)*.01).reduce((a,b)=>a+b));
 for(const r of s.rows){assert.equal(r.closingBalance,r.openingBalance+r.loanDraw-r.principalPaid);assert.equal(r.totalPayment,r.principalPaid+r.interest+r.fee);}assert.equal(s.bankApproved,false);
});
test('annuity resets after prepayment and again at supplied rate phase',()=>{
 const B=designClient(),s=B.simulateLoanTerms(terms({method:'annuity',ratePeriods:[{fromMonth:1,annualRatePct:12},{fromMonth:7,annualRatePct:15}]}));
 const payment=(p,r,n)=>p*(r/12)/(1-(1+r/12)**(-n));assert.ok(Math.abs(s.rows[3].payment-payment(s.rows[2].closingBalance,.12,9))<=1);assert.ok(Math.abs(s.rows[6].payment-payment(s.rows[5].closingBalance,.15,6))<=1);
 assert.equal(s.totalPrincipal,120000000);assert.equal(s.rows.at(-1).closingBalance,0);
});
test('draws and grace retain their convention; missing fee is unknown; malformed/overpaid terms reject',()=>{
 const B=designClient();const t=terms({graceMonths:3,draws:[{month:1,amount:60000000},{month:5,amount:60000000}],prepayments:[{month:2,amount:18000000,feeAmount:0,sourceReference:'TEST'}]});
 const s=B.simulateLoanTerms(t);assert.equal(s.rows[1].scheduledPrincipal,0);assert.equal(s.rows[1].interest,600000);assert.equal(s.rows[1].closingBalance,42000000);assert.equal(s.totalPrincipal,120000000);
 const missing=B.simulateLoanTerms(terms({prepayments:[{month:3,amount:18000000,sourceReference:'TEST'}]}));assert.equal(missing.status,'partial');assert.equal(missing.totalFees,null);assert.equal(missing.totalPaid,null);
 for(const patch of [{prepayments:null},{prepaymentMode:'shorten-term'},{prepayments:[{month:3,amount:200000000,feeAmount:0,sourceReference:'TEST'}]},{prepayments:[{month:3,amount:1000,feeAmount:0,sourceReference:''}]}]){const bad=B.simulateLoanTerms(terms(patch));assert.equal(bad.status,'unknown');assert.equal(bad.rows.length,0);}
});
test('scenario persists without changing design revision; cash flow includes repayment and fee once',()=>{
 const B=designClient(),revision=B.drawingRevision();assert.ok(B.setFinanceScenario({...terms(),confirmed:true}));B.save();B.state=B.loadState();assert.equal(B.drawingRevision(),revision);
 const loan=B.simulateLoanTerms(B.state.project.finance.scenario),cash=B.constructionCashflow({openingCash:100000000,reserve:0,income:0,living:0,existingDebt:0,loan,constructionPayments:[]});assert.equal(cash.rows[2].loanPayment,29360000);assert.equal(cash.rows.at(-1).closingBalance,100000000+120000000-loan.totalPaid);
});
