import {loanSchedule,financialSummary,estimate,milestonePlan,lifecycle,cashflow} from '../src/index.mjs';
const schedule=loanSchedule({principal:500_000_000,months:180,method:'annuity',ratePeriods:[{fromMonth:1,annualRate:.069},{fromMonth:13,annualRate:.109}]});
const finance=financialSummary({cash:800_000_000,emergencyReserve:100_000_000,committedLoan:500_000_000,netMonthlyIncome:25_000_000,grossMonthlyIncome:null,livingCosts:8_000_000},schedule);
const quotation=estimate({availableCapital:finance.availableCapital,contingencyRate:.1,lines:[
 {id:'demo-shell',description:'Gói công việc giả định để kiểm thử, không phải báo giá',quantity:1,unit:'gói',priceUnit:'gói',quantityConfirmed:true,unitPrice:800_000_000,taxRate:0,wasteRate:0,priceSource:'DEMO_ONLY',priceDate:'2026-09-20'},
 {id:'demo-floor',description:'Lát sàn minh họa',quantity:160,unit:'m2',priceUnit:'m2',quantityConfirmed:true,unitPrice:300_000,taxRate:0,wasteRate:.05,priceSource:'DEMO_ONLY',priceDate:'2026-09-20'}
]});
const milestones=milestonePlan(quotation.total,[{id:'start',basisPoints:2000},{id:'structure',basisPoints:3000},{id:'finish',basisPoints:4000},{id:'handover',basisPoints:500},{id:'retention',basisPoints:500}]);
const ownership=lifecycle({initialCost:quotation.total,annualOperatingCost:24_000_000,annualMaintenanceCost:5_000_000,repairs:[{year:5,cost:30_000_000,assumption:'Khoản sửa chữa do người dùng giả định, chưa xác minh'}]});
const cash=cashflow({openingCash:800_000_000,emergencyReserve:100_000_000,months:[{income:25_000_000,livingCosts:8_000_000,loanDraw:500_000_000,loanPayment:schedule[0].payment,construction:milestones[0].amount}]});
console.log(JSON.stringify({notice:'DỮ LIỆU MINH HỌA — không phải giá thị trường hoặc đề nghị vay',finance,firstMonth:schedule[0],month13:schedule[12],totalInterest:schedule.reduce((s,r)=>s+r.interest,0),estimateTotal:quotation.total,budgetGap:quotation.budgetGap,milestones,firstMonthCashflow:cash[0],tenYearOwnershipCost:ownership.nominalTotal},null,2));
