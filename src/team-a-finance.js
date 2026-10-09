/* Extends the existing monthly calculator; integer VND, beginning-of-month draws. */
(()=>{
 const B=BMH,money=n=>Number.isSafeInteger(n)&&n>=0,whole=(n,min,max)=>Number.isInteger(n)&&n>=min&&n<=max;
 B.simulateLoanTerms=terms=>{
  const issues=[],months=terms?.months,principal=terms?.principal,method=terms?.method,grace=terms?.graceMonths??0,rates=terms?.ratePeriods,draws=terms?.draws;
  if(!money(principal)||!whole(months,1,600)||!['annuity','equal_principal'].includes(method)||!whole(grace,0,(months||1)-1))issues.push('Gốc/kỳ hạn/phương thức/ân hạn không hợp lệ');
  if(!Array.isArray(rates)||!rates.length||rates[0]?.fromMonth!==1||rates.some((r,i)=>!r||typeof r!=='object'||!whole(r.fromMonth,1,months)||!Number.isFinite(r.annualRatePct)||r.annualRatePct<0||r.annualRatePct>100||i>0&&r.fromMonth<=rates[i-1].fromMonth))issues.push('Cần các kỳ lãi năm (%) có thứ tự, bắt đầu tháng 1');
  if(!Array.isArray(draws)||draws.some(d=>!d||typeof d!=='object'||!whole(d.month,1,months)||!money(d.amount))||draws?.reduce((n,d)=>n+(d?.amount??NaN),0)!==principal)issues.push('Lịch giải ngân phải có tháng/số tiền và tổng đúng tiền gốc');
  if(terms?.interestConvention&&terms.interestConvention!=='monthly-opening-balance')issues.push('Chưa hỗ trợ lãi ngày/thả nổi chưa có lãi cụ thể');
  if(terms?.capitalizeInterest||terms?.balloon||terms?.prepayment)issues.push('Chưa hỗ trợ vốn hóa lãi/balloon/trả trước; cần hợp đồng và phương pháp riêng');
  if(issues.length)return {schemaVersion:1,status:'unknown',rows:[],issues,bankApproved:false,totalPrincipal:null,totalInterest:null,totalFees:null,totalPaid:null};
  const fees=terms.fees,feeIssues=[];
  if(!Array.isArray(fees))feeIssues.push('Phí chưa xác nhận; nhập [] chỉ khi xác nhận không có phí');
  else if(fees.some(f=>!f||typeof f!=='object'||!whole(f.month,1,months)||!['fixed','draw-percent','balance-percent'].includes(f.type)||f.type==='fixed'&&!money(f.amount)||f.type!=='fixed'&&(!Number.isFinite(f.ratePct)||f.ratePct<0||f.ratePct>100)))feeIssues.push('Thông số phí không hợp lệ');
  const feeKnown=!feeIssues.length,rows=[];let balance=0,index=0,payment=0,equalBase=0,previousRate=null;
  for(let month=1;month<=months;month++){
   if(rates[index+1]?.fromMonth===month)index++;
   const annual=rates[index].annualRatePct,rate=annual/100/12,openingBalance=balance,draw=draws.filter(d=>d.month===month).reduce((n,d)=>n+d.amount,0);balance+=draw;
   if(draw)equalBase+=draw/(months-Math.max(grace,month-1));
   if(month>grace&&(draw||previousRate!==annual||month===grace+1))payment=B.monthlyPayment(balance,annual,months-month+1);
   const interest=Math.round(balance*rate),paid=month<=grace?0:month===months?balance:Math.min(balance,Math.max(0,Math.round(method==='equal_principal'?equalBase:payment-interest))),fee=feeKnown?fees.filter(f=>f.month===month).reduce((n,f)=>n+(f.type==='fixed'?f.amount:Math.round((f.type==='draw-percent'?draw:balance)*f.ratePct/100)),0):null;
   balance-=paid;previousRate=annual;
   const debtPayment=paid+interest,totalPayment=fee===null?null:debtPayment+fee;
   if(![openingBalance,draw,balance,interest,paid,debtPayment,...(feeKnown?[fee,totalPayment]:[])].every(money))return {status:'unknown',rows:[],issues:['Dòng tiền vượt giới hạn số nguyên VND'],bankApproved:false,totalPaid:null};
   rows.push({month,openingBalance,loanDraw:draw,interestBalance:openingBalance+draw,annual,annualRate:annual/100,principalPaid:paid,principal:paid,interest,fee,payment:debtPayment,totalPayment,closingBalance:balance,balance,grace:month<=grace});
  }
  const totalPrincipal=rows.reduce((n,r)=>n+r.principalPaid,0),totalInterest=rows.reduce((n,r)=>n+r.interest,0),totalFees=feeKnown?rows.reduce((n,r)=>n+r.fee,0):null;
  return {schemaVersion:1,status:feeKnown?'simulated':'partial',rows,issues:feeIssues,totalPrincipal,totalInterest,totalFees,totalPaid:totalFees===null?null:totalPrincipal+totalInterest+totalFees,bankApproved:false,sourceReference:terms.sourceReference||null,notice:'Mô phỏng tháng: giải ngân đầu tháng, lãi trên dư nợ đầu tháng sau giải ngân; ân hạn gốc, lãi trả hàng tháng. Chưa mô phỏng lãi ngày hay cam kết ngân hàng.'};
 };
 B.setFinanceScenario=terms=>{
  const result=B.simulateLoanTerms({...terms,principal:terms.principal??B.state.project.finance.loan});if(!result.rows.length)return false;
  B.state.project.finance.scenario=B.evidenceValue({...terms,principal:terms.principal??B.state.project.finance.loan,schemaVersion:1});B.recordProjectInput('finance.scenario',{confirmed:terms.confirmed===true,sourceReference:terms.sourceReference});return result;
 };
 B.scopedFundingNeed=(cost=B.commercialBoq(),finance=B.state.project.finance)=>{
  const records=B.projectInputRegister(),has=key=>records.find(r=>r.field==='finance.'+key)?.status==='provided',own=has('cash')&&has('reserve')&&finance.reserve<=finance.cash?finance.cash-finance.reserve:null;
  const full=money(cost.completeTotal)?cost.completeTotal:null,known=money(cost.totalKnown)?cost.totalKnown:null;
  return {revision:cost.revision,scope:full===null?'partial-sourced-boq':'complete-sourced-boq',ownCapital:own,requiredLoan:own!==null&&full!==null?Math.max(0,full-own):null,knownScopeLoan:own!==null&&known!==null?Math.max(0,known-own):null,fullTotal:full,knownTotal:known,unpricedCount:cost.unpricedCount,bankApproved:false};
 };
 B.constructionCashflow=({openingCash,reserve,income,living,existingDebt,loan,constructionPayments,months=loan?.rows?.length}={})=>{
  const issues=[];if(![openingCash,reserve,income,living,existingDebt].every(money)||reserve>openingCash||!whole(months,1,600))issues.push('Cần vốn/thu nhập/chi tiêu/nợ và quỹ dự phòng hợp lệ');
  if(!loan?.rows?.length||loan.rows.some(r=>r.totalPayment===null))issues.push('Lịch vay/phí chưa đủ dữ liệu');
  if(!Array.isArray(constructionPayments)||constructionPayments.some(p=>!p||typeof p!=='object'||!whole(p.month,1,months)||!money(p.amount)||typeof p.sourceReference!=='string'||!p.sourceReference.trim()))issues.push('Cần lịch chi xây dựng theo tháng có nguồn, chưa tự chia từ % giai đoạn');
  if(issues.length)return {status:'unknown',rows:[],issues};
  let balance=openingCash;const rows=[];
  for(let month=1;month<=months;month++){
   const payment=loan.rows.find(r=>r.month===month),construction=constructionPayments.filter(p=>p.month===month).reduce((n,p)=>n+p.amount,0),before=balance,draw=payment?.loanDraw||0,debtPayment=payment?.totalPayment||0;
   balance+=income+draw-living-existingDebt-debtPayment-construction;
   if(!Number.isSafeInteger(balance))return {status:'unknown',rows:[],issues:['Dòng tiền vượt giới hạn VND']};
   rows.push({month,openingBalance:before,income,loanDraw:draw,living,existingDebt,loanPayment:debtPayment,construction,closingBalance:balance,reserveGap:Math.max(0,reserve-balance),cashShortfall:Math.max(0,-balance)});
  }
  return {status:rows.some(r=>r.reserveGap)?'reserve-shortfall':'simulated',rows,issues:[],bankApproved:false};
 };
 B.simulateFinanceStress=(stress,finance=B.state.project.finance)=>{
  const scenario=finance.scenario||{},changes=['rateIncreasePct','incomeChangePct','constructionIncreasePct'];
  if(!stress||changes.some(k=>!Number.isFinite(stress[k]))||stress.rateIncreasePct<0||stress.rateIncreasePct>100||stress.incomeChangePct< -100||stress.incomeChangePct>100||stress.constructionIncreasePct<0||stress.constructionIncreasePct>100)return {status:'unknown',issues:['Nhập mức tăng lãi, thay đổi thu nhập và tăng chi xây; app không tự đặt kịch bản'],bankApproved:false};
  const base=B.simulateLoanTerms({...scenario,principal:scenario.principal??finance.loan});
  if(!base.rows.length)return {status:'unknown',issues:base.issues,bankApproved:false};
  const loan=B.simulateLoanTerms({...scenario,principal:scenario.principal??finance.loan,ratePeriods:scenario.ratePeriods.map(r=>({...r,annualRatePct:r.annualRatePct+stress.rateIncreasePct}))});
  const records=B.projectInputRegister(),missing=['cash','reserve','income','living','existingDebt'].filter(k=>records.find(r=>r.field==='finance.'+k)?.status!=='provided');
  const payments=Array.isArray(scenario.constructionPayments)?scenario.constructionPayments.map(p=>p&&typeof p==='object'?{...p,amount:Math.round(p.amount*(1+stress.constructionIncreasePct/100))}:p):null;
  const cashflow=missing.length?{status:'unknown',rows:[],issues:['Chưa ghi nguồn nhập: '+missing.join(', ')]}:B.constructionCashflow({openingCash:finance.cash,reserve:finance.reserve,income:Math.round(finance.income*(1+stress.incomeChangePct/100)),living:finance.living,existingDebt:finance.existingDebt,loan,constructionPayments:payments,months:scenario.months});
  return {status:loan.rows.length?cashflow.status:'unknown',parameters:structuredClone(stress),loan,cashflow,extraInterest:loan.totalInterest===null?null:loan.totalInterest-base.totalInterest,worstReserveGap:cashflow.rows.length?Math.max(...cashflow.rows.map(r=>r.reserveGap)):null,issues:[...loan.issues,...cashflow.issues],bankApproved:false,notice:'Kịch bản giả định do khách nhập; xem lại phương án hoặc BOQ khi thiếu vốn, không tự sửa thiết kế.'};
 };
 B.financeStressHtml=()=>{
  const t=B.state.project.finance.scenario?.stress||{},s=B.simulateFinanceStress(t),esc=B.esc;
  return '<section class="v6-card"><h3>Thử lãi tăng và thiếu vốn</h3><form data-team-a-stress>'+[['rateIncreasePct','Tăng lãi (điểm %/năm)',0],['incomeChangePct','Thay đổi thu nhập (%)',-100],['constructionIncreasePct','Tăng chi xây (%)',0]].map(([k,label,min])=>'<label>'+label+'<input name="'+k+'" type="number" min="'+min+'" max="100" step="any" value="'+esc(t[k]??'')+'" required></label>').join('')+'<button>So kịch bản đã nhập</button></form><p>'+esc(s.status)+' · Lãi thêm '+esc(s.extraInterest??'unknown')+' VND · Thiếu dự phòng lớn nhất '+esc(s.worstReserveGap??'unknown')+' VND</p><p>'+esc(s.issues.join('; ')||s.notice)+'</p><button data-nav="4">Xem lại phương án</button><button data-nav="7">Xem lại BOQ / tối ưu</button></section>';
 };
 B.financeScenarioSummary=()=>{
  const f=B.state.project.finance,s=f.scenario||{},loan=B.simulateLoanTerms({...s,principal:s.principal??f.loan}),records=B.projectInputRegister(),missing=['cash','reserve','income','living','existingDebt'].filter(k=>records.find(r=>r.field==='finance.'+k)?.status!=='provided');
  const cashflow=missing.length?{status:'unknown',rows:[],issues:['Chưa ghi nguồn nhập: '+missing.join(', ')]}:B.constructionCashflow({openingCash:f.cash,reserve:f.reserve,income:f.income,living:f.living,existingDebt:f.existingDebt,loan,constructionPayments:s.constructionPayments,months:s.months});
  const peak=Math.max(0,...loan.rows.map(r=>r.totalPayment??r.payment)),ratio=missing.some(k=>['income','existingDebt'].includes(k))||!f.income?null:(peak+f.existingDebt)/f.income;
  return {revision:B.drawingRevision(),funding:B.scopedFundingNeed(),loan,cashflow,peakPayment:loan.rows.length?peak:null,netDebtRatio:ratio,status:s.confirmed&&s.sourceReference?'customer-terms':'unconfirmed-terms',bankApproved:false};
 };
 const legacySchedule=B.loanSchedule;
 B.loanSchedule=(finance=B.state.project.finance)=>finance.scenario?.ratePeriods?.length?B.simulateLoanTerms({...finance.scenario,principal:finance.scenario.principal??finance.loan}).rows:legacySchedule(finance);
 B.financeScenarioHtml=()=>{
  const s=B.financeScenarioSummary(),f=B.state.project.finance,t=f.scenario||{},esc=B.esc;
  const number=(name,label,value,min=0)=>'<label>'+label+'<input type="number" name="'+name+'" min="'+min+'" step="any" value="'+esc(value??'')+'" required></label>';
  return '<section class="v6-card"><h3>Điều kiện vay và dòng tiền theo tháng</h3><p>Tổng BOQ toàn công trình: '+(s.funding.fullTotal===null?'unknown':B.num(s.funding.fullTotal))+' · '+s.funding.unpricedCount+' dòng thiếu. Không dùng tổng phần đã biết làm tổng khoản vay.</p><form data-team-a-loan>'+number('months','Số tháng',t.months,1)+'<label>Phương thức<select name="method"><option value="annuity">Trả góp đều, điều chỉnh khi lãi đổi</option><option value="equal_principal" '+(t.method==='equal_principal'?'selected':'')+'>Gốc đều</option></select></label>'+number('principal','Gốc VND',t.principal??f.loan)+number('graceMonths','Ân hạn gốc (tháng)',t.graceMonths??0)+'<label>Các kỳ lãi: tháng bắt đầu = %/năm<textarea name="rates" required>'+esc((t.ratePeriods||[]).map(r=>r.fromMonth+'='+r.annualRatePct).join('\n'))+'</textarea></label><label>Giải ngân: tháng = VND<textarea name="draws" required>'+esc((t.draws||[]).map(r=>r.month+'='+r.amount).join('\n'))+'</textarea></label><label>Phí: tháng = VND; hoặc tháng = draw-percent:% / balance-percent:% (để trống khi xác nhận không phí)<textarea name="fees">'+esc((t.fees||[]).map(r=>r.month+'='+(r.type==='fixed'?r.amount:r.type+':'+r.ratePct)).join('\n'))+'</textarea></label><label>Chi xây dựng: tháng = VND<textarea name="construction">'+esc((t.constructionPayments||[]).map(r=>r.month+'='+r.amount).join('\n'))+'</textarea></label><label>Ngày hiệu lực điều kiện<input name="effectiveAt" type="date" value="'+esc(t.effectiveAt||'')+'" required></label><label>Nguồn điều kiện / chứng từ<input name="source" value="'+esc(t.sourceReference||'')+'" required></label><label><input type="checkbox" name="confirmed" required> Tôi xác nhận các thông số đã nhập, gồm phạm vi phí</label><button>Mô phỏng theo thông số này</button></form><p>'+esc([...s.loan.issues,...s.cashflow.issues].join('; ')||s.loan.notice)+'</p><p>Đây là mô phỏng, chưa có phê duyệt vay.</p><div style="max-width:100%;overflow-x:auto"><table><thead><tr><th>Tháng</th><th>Giải ngân</th><th>Gốc</th><th>Lãi</th><th>Phí</th><th>Dư nợ</th><th>Tiền còn / thiếu dự phòng</th></tr></thead><tbody>'+s.loan.rows.map(r=>{const cf=s.cashflow.rows.find(c=>c.month===r.month);return '<tr>'+[r.month,r.loanDraw,r.principal,r.interest,r.fee??'unknown',r.balance,cf?cf.closingBalance+' / '+cf.reserveGap:'unknown'].map(v=>'<td>'+esc(v)+'</td>').join('')+'</tr>';}).join('')+'</tbody></table></div></section>';
 };
 const route=(B.workflowRoutes?.bank||8)-1,screen=B.SCREENS[route];if(screen)B.SCREENS[route]=()=>screen()+B.financeScenarioHtml()+B.financeStressHtml();
 document.addEventListener('submit',e=>{if(!e.target.matches?.('[data-team-a-stress]'))return;e.preventDefault();const v=Object.fromEntries(new FormData(e.target)),stress=Object.fromEntries(Object.entries(v).map(([k,value])=>[k,value===''?null:Number(value)])),result=B.simulateFinanceStress(stress);if(!result.loan?.rows.length)return B.toast(result.issues.join('; '));B.state.project.finance.scenario.stress={...stress,sourceReference:'Customer-entered hypothetical stress scenario',enteredAt:new Date().toISOString()};B.save();B.render({preserveScroll:true});});
 document.addEventListener('submit',e=>{if(!e.target.matches?.('[data-team-a-loan]'))return;e.preventDefault();const v=Object.fromEntries(new FormData(e.target)),parse=s=>String(s).trim()?String(s).trim().split(/\n/).map(row=>row.split('=').length===2?row.split('=').map(Number):[NaN,NaN]):[],rates=parse(v.rates),draws=parse(v.draws),fees=String(v.fees||'').trim()?String(v.fees).trim().split(/\n/).map(row=>{if(row.split('=').length!==2)return {month:NaN,type:'fixed',amount:NaN};const [month,value]=row.split('='),[type,n]=String(value).includes(':')?String(value).split(':'):['fixed',value];return {month:Number(month),type,...(type==='fixed'?{amount:Number(n)}:{ratePct:Number(n)})};}):[],construction=parse(v.construction),source=String(v.source||'').trim();
  const result=B.setFinanceScenario({effectiveAt:v.effectiveAt,months:Number(v.months),principal:Number(v.principal),method:v.method,graceMonths:Number(v.graceMonths),ratePeriods:rates.map(([fromMonth,annualRatePct])=>({fromMonth,annualRatePct})),draws:draws.map(([month,amount])=>({month,amount})),fees,constructionPayments:construction.map(([month,amount])=>({month,amount,sourceReference:source})),sourceReference:source,confirmed:v.confirmed==='on',interestConvention:'monthly-opening-balance'});if(result){B.save();B.render({preserveScroll:true});}else B.toast('Kiểm tra gốc, số tháng, các kỳ lãi và tổng giải ngân.');
 });
})();
