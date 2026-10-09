/* C03/C04: a design package precedes construction; field reports are not signoffs. */
(()=>{
 const B=BMH,copy=structuredClone,collections=['wbs','journal','inspections','issues','changes','payments','drawdowns','decisions','outputs','warranties'],text=s=>typeof s==='string'&&s.trim();
 const register=()=>{const d=B.state.project.dossier;d.register||={schemaVersion:1};for(const key of collections)if(!Array.isArray(d.register[key]))d.register[key]=[];return d.register;};
 const validDay=s=>typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 const disposition=row=>{
  const stale=row.designRevision!==B.drawingRevision();
  if(row.kind==='inspections'){const evidence={...row,reviewedRevision:row.designRevision};return stale?'stale':row.requestedState==='accepted'&&B.technicalReviewEvidence(evidence)?'accepted':'awaiting-review';}
  return stale?'stale':row.reportedState||'open';
 };
 B.supervisionAdapter={
  schemaVersion:1,
  list(kind){if(!collections.includes(kind))return [];return register()[kind].map(row=>({...copy(row),state:disposition(row),stale:row.designRevision!==B.drawingRevision(),certified:kind==='inspections'&&disposition(row)==='accepted'}));},
  append(kind,input){
   if(!collections.includes(kind)||!input||!text(input.title)||!validDay(input.observedAt)||!text(input.sourceReference))return false;
   const p=B.state.project,room=input.roomId?p.plan.rooms.find(r=>r.id===input.roomId):null;
   if(input.roomId&&!room||input.floor!==undefined&&input.floor!==null&&(!Number.isInteger(input.floor)||input.floor<0||input.floor>=p.site.floors))return false;
   if(input.wbsId&&!register().wbs.some(w=>w.id===input.wbsId))return false;
   if(['payments','drawdowns'].includes(kind)&&(!Number.isSafeInteger(input.amount)||input.amount<0))return false;
   if(input.evidenceIds&&(!Array.isArray(input.evidenceIds)||input.evidenceIds.some(id=>!p.dossier.evidence.some(e=>e.id===id))))return false;
   const id=input.id||B.uid(kind);if(collections.some(k=>register()[k].some(r=>r.id===id)))return false;
   const row={...B.evidenceValue(input),id,kind,title:input.title.slice(0,160),note:String(input.note||'').slice(0,2000),responsible:String(input.responsible||'').slice(0,160),roomId:room?.id||null,floor:room?.floor??input.floor??null,designRevision:input.designRevision||B.drawingRevision(),recordedAt:new Date().toISOString(),reportedState:['open','active','reported-complete','reported-resolved'].includes(input.reportedState)?input.reportedState:'open',engineeringAccepted:false};
   if(kind==='inspections')row.requestedState=input.requestedState==='accepted'?'accepted':'awaiting-review';
   row.history=[{at:row.recordedAt,action:'recorded',state:row.reportedState}];register()[kind].push(row);B.save();return {...copy(row),state:disposition(row)};
  },
  resolve(kind,id,{note,sourceReference,observedAt}={}){
   if(!['issues','wbs','changes'].includes(kind)||!text(note)||!text(sourceReference)||!validDay(observedAt))return false;
   const row=register()[kind].find(r=>r.id===id);if(!row)return false;
   row.reportedState=kind==='wbs'?'reported-complete':'reported-resolved';row.history.push({at:new Date().toISOString(),action:'user-reported-resolution',note:note.slice(0,2000),sourceReference,observedAt,designRevision:B.drawingRevision()});B.save();return true;
  },
  html(){const esc=B.esc;return '<form data-team-a-log><label>Sổ<select name="kind">'+collections.filter(k=>k!=='outputs').map(k=>'<option value="'+k+'">'+esc(({wbs:'Công việc WBS',journal:'Nhật ký',inspections:'Ghi nhận nghiệm thu',issues:'Lỗi',changes:'Thay đổi',payments:'Thanh toán',drawdowns:'Giải ngân',decisions:'Quyết định khách',warranties:'Bảo hành'})[k])+'</option>').join('')+'</select></label><label>Nội dung<input name="title" maxlength="160" required></label><label>Ngày ghi nhận<input type="date" name="observedAt" required></label><label>Người phụ trách<input name="responsible"></label><label>Mã tài liệu / chứng từ<input name="sourceReference" required></label><label>Số tiền VND (thanh toán/giải ngân)<input name="amount" type="number" min="0" step="1"></label><label>Ghi chú<textarea name="note"></textarea></label><button>Thêm ghi nhận</button><p>Nghiệm thu cần người KTS/KS, tài liệu và revision. Form ghi nhận này chưa cấp chứng nhận.</p></form>'+collections.map(k=>'<details><summary>'+esc(k)+' · '+register()[k].length+'</summary>'+this.list(k).map(r=>'<p>'+esc(r.title)+' · '+esc(r.state)+' · '+esc(r.responsible)+' · Rev '+esc(r.designRevision)+'</p>').join('')+'</details>').join('');}
 };
 B.handoverStatus=()=>{
  const revision=B.drawingRevision(),review=B.measuredDesignReview(),ledger=register(),outputs=B.supervisionAdapter.list('outputs'),missing=[],professional=B.constructionReview(),decisions=B.supervisionAdapter.list('decisions');
  const required=['plans','roof','elevations','sections','openings','areas','materials','furniture','technical-register','boq'];
  for(const name of required)if(!outputs.some(r=>r.outputType===name&&!r.stale&&r.fileHash&&r.fileReference))missing.push('output:'+name);
  const designReview=(B.state.project.constructionDesign.reviews||[]).some(r=>['architect','KTS'].includes(r.reviewer?.role||r.reviewerRole)&&B.technicalReviewEvidence(r)&&r.reviewedRevision===revision);
  if(!designReview)missing.push('KTS rà soát thiết kế cùng revision');
  if(!decisions.some(r=>!r.stale&&r.decisionType==='design-selection'&&r.customerConfirmed===true))missing.push('Quyết định chọn thiết kế của khách');
  const inputs=B.state.project.constructionDesign.inputs||{},buildMissing=['geotechnical','loads','structuralSystem','mep','planning'].filter(k=>!inputs[k]||B.technicalRecordState(inputs[k],'input')!=='reviewed'||inputs[k].reviewedRevision!==revision);
  const inspections=B.supervisionAdapter.list('inspections'),wbs=B.supervisionAdapter.list('wbs'),issues=B.supervisionAdapter.list('issues'),changes=B.supervisionAdapter.list('changes'),warranties=B.supervisionAdapter.list('warranties');
  const designReady=review.geometryValid&&!B.planFurnitureIssues().length&&!missing.length,constructionInputsReady=designReady&&!buildMissing.length&&professional.records.length>0&&professional.pending===0,asBuiltReady=constructionInputsReady&&wbs.length>0&&wbs.every(w=>w.reportedState==='reported-complete'&&!w.stale&&inspections.some(i=>i.wbsId===w.id&&i.certified))&&issues.every(i=>i.state==='reported-resolved')&&changes.every(i=>i.state==='reported-resolved')&&warranties.length>0&&warranties.every(w=>!w.stale&&w.sourceReference);
  return {revision,proposalAvailable:review.geometryValid,preliminaryDownloadAllowed:review.geometryValid,designReady,constructionInputsReady,constructionStarted:!!ledger.journal.length,asBuiltReady,status:asBuiltReady?'as-built-records-ready':constructionInputsReady?'construction-inputs-ready':designReady?'design-handover-ready':'proposal',missingDesign:missing,missingConstruction:buildMissing,technical:professional,unknownCostScopes:B.commercialBoq().unpricedCount,certifiedForConstruction:false,notice:'Đủ gói phương án, bàn giao thiết kế, đầu vào thi công và hoàn công là các mốc riêng. Checklist, tiền đã trả và khai báo hoàn thành không xác nhận kỹ thuật.'};
 };
 B.designHandoverManifest=()=>{
  const revision=B.drawingRevision(),status=B.handoverStatus(),boq=B.commercialBoq();
  return {format:'BMH-design-handover',schemaVersion:1,revision,units:{model:'m',dxf:'mm',paper:'A3 420x297mm'},status,boq,outputs:B.supervisionAdapter.list('outputs').map(r=>({id:r.id,outputType:r.outputType,fileReference:r.fileReference,fileHash:r.fileHash,designRevision:r.designRevision,state:r.state})),openIssues:B.supervisionAdapter.list('issues').map(r=>({id:r.id,title:r.title,roomId:r.roomId,floor:r.floor,state:r.state,designRevision:r.designRevision})),decisions:B.supervisionAdapter.list('decisions').map(r=>({id:r.id,decisionType:r.decisionType,title:r.title,customerConfirmed:r.customerConfirmed===true,designRevision:r.designRevision,state:r.state})),financeIncluded:false};
 };
 const files=B.customerPackageFiles;
 B.customerPackageFiles=(snapshot,sheets,html)=>[...files(snapshot,sheets,html),['revision-va-ban-giao.json',JSON.stringify(B.designHandoverManifest(),null,2)]];
 B.privateFinancePackageFiles=({includeFinance=false}={})=>includeFinance===true?[['tai-chinh-rieng-'+B.drawingRevision()+'.json',JSON.stringify({...B.financeScenarioSummary(),private:true},null,2)]]:[];
 B.exportFinanceScenario=()=>{const [file]=B.privateFinancePackageFiles({includeFinance:true});B.download(file[0],file[1],'application/json');return true;};
 B.handoverStatusHtml=()=>{const s=B.handoverStatus();return '<section class="v6-card"><h3>Trạng thái bàn giao · Rev '+s.revision+'</h3><p>'+B.esc(s.notice)+'</p><p>'+B.esc(s.status)+' · '+s.missingDesign.length+' mục thiết kế chờ · '+s.missingConstruction.length+' đầu vào thi công chờ · '+s.unknownCostScopes+' dòng BOQ thiếu</p><button data-team-a-private-finance>Xuất riêng tài chính cá nhân</button><p>Chỉ nút này xuất thông tin vốn và dòng tiền; gói bản vẽ mặc định không chứa tài chính gia đình.</p></section>';};
 const screen=B.screen10;if(screen){B.screen10=()=>screen()+B.handoverStatusHtml();for(let i=0;i<B.SCREENS.length;i++)if(B.SCREENS[i]===screen)B.SCREENS[i]=B.screen10;}
 const completeness=B.dossierCompleteness;
 B.dossierCompleteness=()=>{const legacy=completeness(),s=B.handoverStatus();return {...legacy,designReady:s.designReady,constructionReady:s.constructionInputsReady,asBuiltReady:s.asBuiltReady,notice:s.notice};};
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-team-a-private-finance]'))B.exportFinanceScenario();});
 document.addEventListener('submit',e=>{if(!e.target.matches?.('[data-team-a-log]'))return;e.preventDefault();const v=Object.fromEntries(new FormData(e.target)),input={...v,...(['payments','drawdowns'].includes(v.kind)?{amount:v.amount===''?null:Number(v.amount)}:{})};const result=B.supervisionAdapter.append(v.kind,input);if(result)B.render({preserveScroll:true});else B.toast('Kiểm tra nội dung, ngày, nguồn chứng từ và số tiền nếu áp dụng.');});
})();
