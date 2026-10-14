import test from 'node:test';
import assert from 'node:assert/strict';
import {designClient} from './fixtures/design-client.mjs';
import {loanSchedule as domainLoan} from '../domain-kit/src/finance.mjs';
const plain=v=>JSON.parse(JSON.stringify(v));
function fixture(){const B=designClient();B.state.project.site.floors=1;B.state.project.plan={rooms:[{id:'room',type:'custom',name:'Phòng riêng',floor:0,x:1,y:2,w:6,h:4}],openings:[],fixtures:[],furniture:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};B.state.ui.planner.selected='room';return B;}
const chair=(id='chair')=>({id,roomId:'room',floor:0,modelId:'chair',origin:'customer-added',placementStatus:'present',locked:false,pose:{x:3,y:4,z:0,rotationDeg:37},size:{width:.4,depth:.4,height:.94},materialBindings:[{sku:'TEST-ONLY',specification:'Fixture chair',quoteId:'chair-quote'}],costTreatment:'purchase'});
const terms=(overrides={})=>({principal:120000000,months:12,method:'annuity',graceMonths:0,ratePeriods:[{fromMonth:1,annualRatePct:12},{fromMonth:7,annualRatePct:15}],draws:[{month:1,amount:120000000}],fees:[],sourceReference:'TEST-ONLY user terms',...overrides});
const quote=(extra={})=>({sku:'TEST-ONLY',specification:'Fixture chair',unit:'cái',unitPrice:100000,quotedAt:'2026-10-01',validUntil:'2027-01-01',sourceReference:'TEST-ONLY supplier Q1',region:'TP. Hồ Chí Minh',scope:'supply',labourPerQuantity:10000,wastePct:0,vatMode:'excluded',taxPct:8,vatBasis:'all',transportMode:'excluded',transportAmount:5000,...extra});
test('room rotation uses one atomic transform, preserving 37-degree pose, local size and history',()=>{
 const B=fixture();B.state.project.plan.furniture=[chair()];const before=plain(B.state.project.plan),revision=B.drawingRevision();
 assert.equal(B.rotateSelectedRoom(),true);let i=B.resolvedFurniture()[0];assert.equal(i.pose.rotationDeg,127);assert.equal(i.pose.x,4);assert.equal(i.pose.y,3);assert.deepEqual(plain(i.size),chair().size);assert.notEqual(B.drawingRevision(),revision);
 B.undoPlan();assert.deepEqual(plain(B.state.project.plan),before);B.redoPlan();assert.equal(B.resolvedFurniture()[0].pose.rotationDeg,127);
 B.save();B.state=B.loadState();assert.equal(B.resolvedFurniture()[0].pose.rotationDeg,127);
});
test('locked furniture and door collisions reject a room edit without consuming history',()=>{
 const B=fixture();B.state.project.plan.furniture=[{...chair(),locked:true}];const next=B.planSnapshot();next.rooms[0].x+=.5;const n=B.planHistory.undo.length;
 assert.equal(B.commitDirectPlan(next),false);assert.equal(B.planHistory.undo.length,n);B.state.project.plan.furniture[0].locked=false;
 B.state.project.plan.openings=[{id:'door',roomId:'room',floor:0,side:'north',offset:.5,width:.9,kind:'door',height:2.1,sill:0}];const edit=B.planSnapshot();edit.furniture[0].pose.y=2.2;edit.furniture[0].pose.x=4;assert.equal(B.commitDirectPlan(edit),false);assert.equal(B.planHistory.undo.length,n);
});
test('regeneration remaps authored records and tombstones, or refuses a lost/colliding room',()=>{
 const B=fixture();B.state.project.plan.furniture=[chair(),{...chair('removed'),placementStatus:'removed'}];let next=B.planSnapshot();next.rooms[0].id='new-room';next.rooms[0].x+=1;
 const carried=B.carryFurnitureToPlan(next);assert.equal(carried.ok,true);assert.equal(carried.plan.furniture[0].roomId,'new-room');assert.equal(carried.plan.furniture[0].pose.x,4);assert.equal(carried.plan.furniture[1].placementStatus,'removed');
 next.rooms[0].type='bath';assert.equal(B.carryFurnitureToPlan(next).ok,false);assert.equal(B.state.project.plan.furniture[0].pose.x,3);
});
test('DXF and schedule carry stable identity, true rotated corners and local dimensions in mm',()=>{
 const B=fixture();B.state.project.plan.furniture=[chair()];const dxf=B.planDxf(0),row=B.architecturalFurnitureSchedule(0)[0];
 assert.match(dxf,/furnitureId=chair/);assert.match(dxf,/rotationDeg=37/);assert.match(dxf,/widthMm=400/);assert.equal(row.furnitureId,'chair');assert.equal(row.w,.4);assert.equal(row.d,.4);assert.equal(row.rotationDeg,37);
 const x=B.furnitureFootprint(chair())[0].x*1000;assert.ok(dxf.includes(String(Math.round(x*1000)/1000)));assert.match(dxf,/\$INSUNITS\r\n70\r\n4/);
});
test('drawing revision invalidates pose/fixture/SKU, while price and finance edits remain separate',()=>{
 const B=fixture();B.state.project.plan.furniture=[chair()];let rev=B.drawingRevision();B.state.project.finance.cash+=1;B.state.project.plan.furniture[0].materialBindings[0].unitPrice=456;assert.equal(B.drawingRevision(),rev);
 B.state.project.plan.furniture[0].materialBindings[0].sku='TEST-CHANGED';assert.notEqual(B.drawingRevision(),rev);rev=B.drawingRevision();B.state.project.plan.fixtures.push({id:'test-fixture',floor:0,roomId:'room',x:1.5,y:2.5,w:1,d:.5});assert.notEqual(B.drawingRevision(),rev);
});
test('BOQ reconciles sourced furniture, VAT/labour/transport, keeping full project scope unknown',()=>{
 const B=fixture();B.state.project.plan.furniture=[chair()];B.setSourcedQuote('chair-quote',quote());let s=B.commercialBoq(),row=s.rows.find(r=>r.furnitureId==='chair');
 assert.equal(row.qty,1);assert.equal(row.supplyAmount,100000);assert.equal(row.labourAmount,10000);assert.equal(row.transportAmount,5000);assert.equal(row.taxAmount,9200);assert.equal(row.amount,124200);assert.equal(s.knownSubtotal,124200);assert.equal(s.completeTotal,null);assert.ok(s.unpricedCount>5);
 assert.equal(B.editFurniture('chair',{placementStatus:'removed'}),true);s=B.commercialBoq();assert.equal(s.knownSubtotal,0);assert.ok(!s.rows.some(r=>r.furnitureId==='chair'));assert.ok(s.excluded.some(r=>r.furnitureId==='chair'));assert.equal(s.completeTotal,null);
});
test('explicit owned/bundled costs and shared transport cannot silently duplicate purchases',()=>{
 const B=fixture();B.state.project.plan.furniture=[chair('a'),{...chair('b'),pose:{x:5,y:4,z:0,rotationDeg:37}}];B.setSourcedQuote('chair-quote',quote({transportGroup:'TEST-DELIVERY'}));
 let s=B.commercialBoq();assert.equal(s.rows.filter(r=>r.furnitureId).reduce((n,r)=>n+r.transportAmount,0),5000);
 B.state.project.plan.furniture[0].costTreatment='owned';assert.equal(B.commercialBoq().rows.find(r=>r.furnitureId==='a').amount,null);B.state.project.plan.furniture[0].costReference='TEST owned evidence';assert.equal(B.commercialBoq().rows.find(r=>r.furnitureId==='a').amount,0);
});
test('sourced unit conversion, expired/missing prices and duplicate application scope remain visible',()=>{
 const B=fixture(),rev=B.drawingRevision(),a={id:'paint',roleId:'wall',costTreatment:'purchase',sku:'PAINT-TEST',specification:'Fixture coat',quoteId:'paint-q',quantity:{value:100,unit:'m²',sourceReference:'TEST survey',revision:rev},conversionId:'conv'};B.setBoqApplication(a);B.setSourcedQuote('paint-q',quote({sku:'PAINT-TEST',specification:'Fixture coat',unit:'lít',wastePct:5}));assert.equal(B.commercialBoq().rows[0].amount,null);
 B.state.project.costPlan.conversions=[{id:'conv',from:'m²',to:'lít',factor:.2,sourceReference:'TEST manufacturer coverage, 2 coats',sku:'PAINT-TEST',specification:'Fixture coat'}];let row=B.commercialBoq().rows[0];assert.equal(row.purchasedQuantity,21);assert.equal(row.labourAmount,1000000);
 B.state.project.costPlan.quotes['paint-q'].validUntil='2026-09-01';assert.equal(B.commercialBoq().rows[0].amount,null);B.state.project.costPlan.quotes['paint-q'].validUntil='2027-01-01';B.setBoqApplication({...a,id:'duplicate'});assert.equal(B.commercialBoq().rows.find(r=>r.code==='duplicate').amount,null);
});
test('A5 monthly schedules agree with existing domain formulas across methods/rate resets/zero rate',()=>{
 const B=fixture();for(const method of ['annuity','equal_principal'])for(const rate of [0,12]){const t=terms({method,ratePeriods:[{fromMonth:1,annualRatePct:rate},{fromMonth:7,annualRatePct:15}]}),s=B.simulateLoanTerms(t),expected=domainLoan({principal:t.principal,months:12,method,ratePeriods:t.ratePeriods.map(r=>({fromMonth:r.fromMonth,annualRate:r.annualRatePct/100}))});assert.deepEqual(plain(s.rows.map(r=>[r.principalPaid,r.interest,r.balance])),expected.map(r=>[r.principalPaid,r.interest,r.closingBalance]));assert.equal(s.totalPrincipal,120000000);assert.equal(s.rows.at(-1).balance,0);}
});
test('draws/grace/fees reconcile month balances and actual cash, preserving reserve',()=>{
 const B=fixture(),loan=B.simulateLoanTerms(terms({graceMonths:2,draws:[{month:1,amount:60000000},{month:3,amount:60000000}],fees:[{month:1,type:'draw-percent',ratePct:1}]}));assert.equal(loan.rows[0].principal,0);assert.equal(loan.rows[0].interest,600000);assert.equal(loan.rows[0].fee,600000);assert.equal(loan.totalPrincipal,120000000);
 for(const r of loan.rows)assert.equal(r.openingBalance+r.loanDraw-r.principal,r.balance);
 const cash=B.constructionCashflow({openingCash:20000000,reserve:10000000,income:5000000,living:3000000,existingDebt:0,loan,constructionPayments:[{month:1,amount:80000000,sourceReference:'TEST contract'}]});assert.equal(cash.rows[0].closingBalance,800000);assert.equal(cash.rows[0].reserveGap,9200000);assert.equal(cash.status,'reserve-shortfall');assert.equal(loan.bankApproved,false);
 const missingFees=B.simulateLoanTerms(terms({fees:null}));assert.equal(missingFees.totalPaid,null);assert.equal(missingFees.rows[0].fee,null);assert.equal(B.constructionCashflow({openingCash:20,reserve:10,income:5,living:3,existingDebt:0,loan:missingFees,constructionPayments:[]}).status,'unknown');
});
test('finance terms, zero fees, ledger and sourced application persist through whitelist merge',()=>{
 const B=fixture();B.setFinanceScenario({...terms(),confirmed:true,constructionPayments:[]});B.setSourcedQuote('chair-quote',quote());B.supervisionAdapter.append('journal',{title:'TEST nhật ký',observedAt:'2026-10-09',sourceReference:'TEST log',floor:0});B.save();const restored=B.loadState();assert.deepEqual(plain(restored.project.finance.scenario.fees),[]);assert.equal(restored.project.finance.scenario.principal,120000000);assert.equal(restored.project.dossier.register.journal[0].floor,0);assert.equal(restored.project.costPlan.quotes['chair-quote'].unitPrice,100000);
});
test('handover distinguishes design/field reports/as-built; only documented professional inspection accepts current revision',()=>{
 const B=fixture(),input={title:'TEST check',observedAt:'2026-10-09',sourceReference:'TEST inspection'};const user=B.supervisionAdapter.append('inspections',{...input,requestedState:'accepted'});assert.equal(user.state,'awaiting-review');assert.equal(B.handoverStatus().asBuiltReady,false);
 const professional=B.supervisionAdapter.append('inspections',{...input,reviewer:{name:'TEST KS',role:'engineer'},reviewEvidence:{reference:'TEST signed document'},reviewedAt:'2026-10-09',requestedState:'accepted'});assert.equal(professional.state,'documented-acceptance');assert.equal(B.supervisionAdapter.list('inspections').find(r=>r.id===professional.id).certified,false);B.state.project.plan.rooms[0].w+=.1;assert.equal(B.supervisionAdapter.list('inspections').find(r=>r.id===professional.id).state,'stale');assert.equal(B.handoverStatus().certifiedForConstruction,false);
});
test('North/fengshui are explicitly missing, and public handoff never includes private finance',()=>{
 const B=fixture();B.state.project.finance.cash=987654321;B.state.project.household.ownerBirth=1997;assert.equal(B.siteInputAssessment().north.usable,false);assert.equal(B.fengshuiPlacementAdvice().status,'unknown');const data=JSON.stringify(B.designHandoverManifest());assert.doesNotMatch(data,/987654321|1997|ownerBirth|bankAccount/);assert.equal(B.privateFinancePackageFiles().length,0);assert.equal(B.privateFinancePackageFiles({includeFinance:true}).length,1);
});
test('shared delivery conflicts and incomplete professional system scopes cannot become a complete quote',()=>{
 const B=fixture();B.state.project.plan.furniture=[chair('a'),{...chair('b'),pose:{x:5,y:4,z:0,rotationDeg:37},materialBindings:[{sku:'TEST-ONLY',specification:'Fixture chair',quoteId:'other-q'}]}];
 B.setSourcedQuote('chair-quote',quote({transportGroup:'trip'}));B.setSourcedQuote('other-q',quote({transportGroup:'trip',transportAmount:6000}));
 let s=B.commercialBoq();assert.ok(s.rows.filter(r=>r.furnitureId).every(r=>r.amount===null&&r.issues.some(i=>i.includes('mâu thuẫn'))));
 B.state.project.constructionDesign.elements=[{id:'column',discipline:'structure',name:'TEST column'}];s=B.commercialBoq();assert.ok(s.rows.some(r=>r.code==='COVERAGE-structure'&&r.amount===null));
 B.state.project.costPlan.scopeCoverage=[{roleId:'structure',confirmed:true,sourceReference:'TEST unverified scope',revision:B.drawingRevision(),elementIds:['column']}];assert.ok(B.commercialBoq().rows.some(r=>r.code==='COVERAGE-structure'));
});
test('malformed saved application/ledger/payment rows are retained and block readiness without crashing',()=>{
 const B=fixture();B.state.project.costPlan.applications=[null];B.state.project.dossier.register.journal=[null];const raw=plain(B.state.project.dossier.register.journal);
 assert.ok(B.commercialBoq().rows.some(r=>r.code==='INVALID-APPLICATION-0'&&r.amount===null));assert.equal(B.supervisionAdapter.list('journal')[0].state,'invalid-record');assert.ok(B.handoverStatus().missingDesign.includes('invalid-register:journal'));assert.deepEqual(plain(B.state.project.dossier.register.journal),raw);
 const loan=B.simulateLoanTerms(terms());assert.equal(B.constructionCashflow({openingCash:100,reserve:0,income:10,living:1,existingDebt:0,loan,constructionPayments:[null]}).status,'unknown');assert.equal(B.simulateLoanTerms(terms({ratePeriods:[null]})).status,'unknown');
});
test('customer-entered rate/income/build-cost stress preserves the base design and financial terms',()=>{
 const B=fixture();B.setFinanceScenario({...terms(),confirmed:true,constructionPayments:[{month:1,amount:10000000,sourceReference:'TEST payment'}]});Object.assign(B.state.project.finance,{cash:20000000,reserve:10000000,income:5000000,living:3000000,existingDebt:0});for(const k of ['cash','reserve','income','living','existingDebt'])B.recordProjectInput('finance.'+k,{confirmed:true,sourceReference:'TEST user input'});
 const revision=B.drawingRevision(),before=plain(B.state.project.finance.scenario),stress=B.simulateFinanceStress({rateIncreasePct:3,incomeChangePct:-20,constructionIncreasePct:10});assert.ok(stress.extraInterest>0);assert.equal(stress.cashflow.rows[0].income,4000000);assert.equal(stress.cashflow.rows[0].construction,11000000);assert.equal(stress.loan.bankApproved,false);assert.equal(B.drawingRevision(),revision);assert.deepEqual(plain(B.state.project.finance.scenario),before);assert.equal(B.simulateFinanceStress({}).status,'unknown');
});
test('sourced North rejects impossible/future dates, and exported BOQ review stales independently of geometry',()=>{
 const B=fixture();B.state.project.site.north={azimuthDeg:37,datum:'true-north',sourceReference:'TEST azimuth',observedAt:'2026-02-30',status:'provided'};assert.equal(B.siteInputAssessment().north.usable,false);B.state.project.site.north.observedAt='2099-01-01';assert.equal(B.siteInputAssessment().north.usable,false);
 const revision=B.drawingRevision(),output=B.supervisionAdapter.append('outputs',{title:'TEST BOQ',outputType:'boq',priceKey:B.commercialBoq().priceKey,fileHash:'TEST-HASH',fileReference:'test.csv',sourceReference:'TEST export',observedAt:'2026-10-09'});B.setSourcedQuote('changed',quote());assert.equal(B.drawingRevision(),revision);assert.equal(B.supervisionAdapter.list('outputs').find(r=>r.id===output.id).state,'stale');
});
test('A3 material pages consume the same complete BOQ rows and furniture tables retain identity/angle',()=>{
 const B=fixture();B.state.project.plan.furniture=[chair()];B.setSourcedQuote('chair-quote',quote());const sheets=B.architecturalMaterialSheets().join('');for(const row of B.commercialBoq().rows)assert.ok(sheets.includes('data-schedule-id="'+row.code+'"'));assert.match(sheets,/124200 VND/);assert.match(sheets,/tổng công trình unknown/);const furniture=B.furnitureScheduleSheet(0);assert.match(furniture,/data-schedule-id="chair"/);assert.match(furniture,/>37<\/text>/);assert.match(furniture,/ID món/);
});
test('public BOQ quote metadata excludes unrelated imported personal fields while retaining the saved original',()=>{
 const B=fixture();B.state.project.plan.furniture=[chair()];B.setSourcedQuote('chair-quote',quote({bankAccount:'PRIVATE-FIXTURE',income:987654321}));assert.equal(B.state.project.costPlan.quotes['chair-quote'].bankAccount,'PRIVATE-FIXTURE');assert.doesNotMatch(JSON.stringify(B.designHandoverManifest()),/PRIVATE-FIXTURE|987654321|bankAccount/);assert.equal(B.commercialBoq().knownSubtotal,124200);
});
