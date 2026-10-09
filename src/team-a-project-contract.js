/* A-owned adapters over the final B editor. Plan metres; positive angle in x/y. */
(()=>{
 const B=BMH,copy=structuredClone,angle=n=>((n%360)+360)%360;
 const reject=reason=>{B.state.ui.planner.directNotice=reason;B.toast(reason);return false;};
 const ready=B.furnitureContractReady;
 B.furnitureContractReady=()=>ready()&&Array.isArray(B.state.project.plan.furniture)&&!B.planFurnitureIssues().length;
 const changed=(a,b)=>['x','y','w','h','floor','furnitureRotation'].some(k=>(a[k]??0)!==(b[k]??0));
 const placementError=plan=>B.withPlan(plan,()=>{
  const malformed=B.planFurnitureIssues(plan);if(malformed.length)return malformed[0].text||malformed[0].code;
  for(const row of plan.furniture.filter(i=>i.placementStatus==='present')){
   const issues=B.furniturePlacementIssues(row,plan.furniture.filter(i=>i.roomId===row.roomId&&i.placementStatus==='present'));
   if(issues.length)return row.id+': '+issues[0];
  }return '';
 });
 B.furniturePlanError=placementError;
 const commit=B.commitDirectPlan;
 B.commitDirectPlan=(next,selection,options)=>{
  if(!B.furnitureContractReady())return reject('Nội thất chưa được chuẩn hóa hoặc có dữ liệu lỗi. Giữ bản gốc để kiểm tra.');
  next=copy(next);next.furniture=copy(next.furniture||B.state.project.plan.furniture);
  const prospective=copy(next),oldPlan=B.state.project.plan;
  for(const row of prospective.furniture){
   const old=oldPlan.rooms.find(r=>r.id===row.roomId),r=next.rooms.find(r=>r.id===row.roomId);
   if(row.locked&&old&&(!r||changed(old,r)))return reject('Món '+row.id+' đang khóa. Mở khóa trước khi đổi phòng.');
   if(!r){row.placementStatus='removed';continue;}if(!old)continue;
   const delta=angle((r.furnitureRotation||0)-(old.furnitureRotation||0));
   if(delta&&[90,180,270].includes(delta)){
    const a=delta*Math.PI/180,x=row.pose.x-(old.x+old.w/2),y=row.pose.y-(old.y+old.h/2);
    row.pose.x=r.x+r.w/2+x*Math.cos(a)-y*Math.sin(a);
    row.pose.y=r.y+r.h/2+x*Math.sin(a)+y*Math.cos(a);row.pose.rotationDeg=angle(row.pose.rotationDeg+delta);
   }else{row.pose.x+=r.x-old.x;row.pose.y+=r.y-old.y;}
   row.floor=r.floor;
  }
  const error=placementError(prospective);if(error)return reject(error);
  // B's final wrapper translates every saved row once. Pass pretranslated coordinates.
  next.furniture=copy(prospective.furniture);
  for(const row of next.furniture){const old=oldPlan.rooms.find(r=>r.id===row.roomId),r=next.rooms.find(r=>r.id===row.roomId);if(old&&r){row.pose.x-=r.x-old.x;row.pose.y-=r.y-old.y;}}
  return commit(next,selection,options);
 };
 B.carryFurnitureToPlan=plan=>{
  const next=copy(plan),old=B.state.project.plan;next.furniture=[];
  if(B.planFurnitureIssues(old).length)return {ok:false,reason:'Nội thất hiện có lỗi dữ liệu; không thay bằng phương án mới.'};
  const roomMap=new Map();
  for(const room of old.rooms){
   const exact=next.rooms.find(r=>r.id===room.id&&r.type===room.type&&r.floor===room.floor);
   const matches=next.rooms.filter(r=>r.type===room.type&&r.floor===room.floor&&(room.programRoomId?r.programRoomId===room.programRoomId:r.name===room.name));
   if(exact||matches.length===1)roomMap.set(room.id,exact||matches[0]);
  }
  for(const original of old.furniture||[]){
   const row=copy(original),from=old.rooms.find(r=>r.id===row.roomId),to=roomMap.get(row.roomId);
   if(!to&&row.placementStatus==='present')return {ok:false,reason:'Không còn phòng tương ứng cho '+row.id+'. Giữ phương án hiện tại; khách quyết định thay đổi đồ trước.'};
   if(to&&from){if(row.locked&&changed(from,to))return {ok:false,reason:'Món '+row.id+' đang khóa.'};row.roomId=to.id;row.floor=to.floor;row.pose.x+=to.x-from.x;row.pose.y+=to.y-from.y;}
   next.furniture.push(row);
  }
  const reason=placementError(next);return reason?{ok:false,reason}:{ok:true,plan:next};
 };
 const proposal=B.architectureProposal;
 B.architectureProposal=strategy=>{const result=proposal(strategy);if(!result.ok)return result;const carried=B.carryFurnitureToPlan(result.plan);return carried.ok?{...result,plan:carried.plan}:{...result,ok:false,reason:carried.reason};};
 const apply=B.applyDesignKit;
 B.applyDesignKit=id=>{const kit=B.designState().kits.find(k=>k.id===id);if(!kit)return false;const carried=B.carryFurnitureToPlan(kit.plan);if(!carried.ok)return reject(carried.reason);kit.plan=carried.plan;return apply(id);};
 const inputKey=B.designInputKey;
 B.designInputKey=()=>inputKey()+'|funding:'+JSON.stringify([B.state.project.finance,B.state.project.inputEvidence?.records,B.state.project.costPlan]);
 B.siteInputAssessment=()=>{
  const p=B.state.project,s=p.site,records=B.projectInputRegister(),north=s.north||{};
  const directional=Number.isFinite(north.azimuthDeg)&&north.azimuthDeg>=0&&north.azimuthDeg<360&&north.datum==='true-north'&&!!north.sourceReference&&!!north.observedAt;
  const geometry=s.useParcelGeometry?B.parcelGeometry?.():null;
  return {status:'provisional',boundary:geometry?{area:geometry.area??null,basis:geometry.basis,reference:s.boundaryEvidenceId||null}: {area:Number(s.width)*Number(s.depth),basis:'customer-dimensions',reference:null},north:{...north,usable:directional,status:directional?'provided':'unknown'},elevation:s.elevation,inputs:records,planning:(p.designEvidence?.site||[]).filter(r=>['planning','setbacks'].includes(r.kind)),legalBoundaryVerified:false,notice:'Pin bản đồ và khung kích thước không xác nhận ranh pháp lý; nguồn đo/quy hoạch cần kiểm chứng.'};
 };
 B.fengshuiPlacementAdvice=()=>{
  const p=B.state.project,site=B.siteInputAssessment(),context=p.designEvidence?.context?.fengshui||{},sources=(p.designEvidence?.fengSources||[]).filter(s=>s.sourceReference||s.sourceUrl);
  const missing=[];if(!site.north.usable)missing.push('Hướng Bắc thật và nguồn đo');if(!context.school)missing.push('Trường phái do khách chọn');if(!sources.length)missing.push('Nguồn quy tắc tư vấn');
  const rows=(B.resolvedFurniture?.()||[]).filter(i=>/bed|kitchenStove/i.test(i.modelId)).map(i=>({id:i.id,roomId:i.roomId,floor:i.floor,pose:copy(i.pose),modelId:i.modelId,facingAzimuthDeg:null,status:'awaiting-review',reason:'Góc model không tự xác nhận hướng đầu giường/bếp. Cần quy ước hướng model và thông tin khách xác nhận.'}));
  for(const q of p.plan.fixtures||[])rows.push({id:q.id,roomId:q.roomId,floor:q.floor,side:q.side,status:'awaiting-review',facingAzimuthDeg:null,reason:'Giữ vị trí bàn thờ khách chọn; đối chiếu nguồn Bắc và trường phái.'});
  return {status:missing.length?'unknown':'awaiting-review',school:context.school||null,sources:copy(sources),missing,rows,automaticChanges:false,notice:'Tư vấn văn hóa theo nguồn; không thay yêu cầu khách và không thay kiểm tra an toàn sử dụng.'};
 };
 B.evaluateDesignOption=(plan,{strategy='balanced'}={})=>B.withPlan(plan,()=>{
  const p=B.state.project,errors=B.measuredGeometryIssues(),quantities=B.measuredQuantities(),materialRows=B.styleMaterialSchedule?.(p)?.rows||[],style=B.styleSpecification?.(B.houseStyle?.()?.id),finance=p.finance,register=B.projectInputRegister();
  const known=k=>register.find(r=>r.field==='finance.'+k)?.status==='provided',own=known('cash')&&known('reserve')?Math.max(0,finance.cash-finance.reserve):null;
  const limit=known('targetBudget')&&finance.targetBudget>0?finance.targetBudget:own!==null&&known('loan')?own+finance.loan:null;
  let estimate=null;try{estimate=B.estimate().total;}catch{}
  const comparison=limit===null||estimate===null?'unknown':estimate>limit?'over-provisional-budget':'within-provisional-budget';
  const daylight=B.floorRooms().filter(r=>!['corridor','stairs','elevator'].includes(r.type)).map(r=>({roomId:r.id,windows:plan.openings.filter(o=>o.roomId===r.id&&o.kind==='window').length}));
  const reasons=[...errors.map(i=>i.text),...(comparison==='over-provisional-budget'?['Ngân sách phương án vượt giới hạn đã khai; chưa phải tổng BOQ có nguồn.']:[]),...(comparison==='unknown'?['Chưa đủ dữ liệu vốn/ngân sách có xác nhận nhập hoặc chưa có suất dự trù.']:[])];
  return {strategy,revision:B.drawingRevision(),geometryFeasible:!errors.length,area:quantities.grossArea,styleId:style?.id||null,styleSpecification:style||null,materialRoles:materialRows,financial:{scope:'planning-allowance',estimatedTotal:estimate,available:limit,comparison,fullSourcedTotal:null},daylight,site:B.siteInputAssessment(),fengshui:B.fengshuiPlacementAdvice(),reasons,choices:comparison==='over-provisional-budget'?['So báo giá vật liệu tương đương cùng yêu cầu','Khách chọn giảm diện tích/công năng','Điều chỉnh vốn hoặc tiến độ thi công']:[],score:errors.length?null:daylight.filter(r=>r.windows>0).length-(comparison==='over-provisional-budget'?100:0)};
 });
 B.compareDesignOptions=()=>['climate','balanced','compact'].map(strategy=>{const p=B.architectureProposal(strategy);return p.ok?{...p,assessment:B.evaluateDesignOption(p.plan,{strategy})}:{...p,strategy};}).sort((a,b)=>(b.assessment?.score??-Infinity)-(a.assessment?.score??-Infinity));
 const generate=B.generateDesignKits;
 B.generateDesignKits=()=>{const result=generate();if(result){for(const kit of B.designState().kits)kit.assessment=B.evaluateDesignOption(kit.plan,{strategy:kit.strategy||kit.id});B.save();}return result;};
 // A-owned program panel; B keeps navigation, layout and CSS.
 const programHtml=B.programChooserHtml;
 B.programChooserHtml=()=>programHtml()+'<details><summary>Đối chiếu đất, vốn và các phương án</summary>'+B.compareDesignOptions().map(o=>'<p><b>'+B.esc(o.strategy)+'</b> · '+B.esc(o.ok?(o.assessment.financial.comparison+' · '+o.assessment.area.toFixed(2)+' m²'):o.reason)+'</p>').join('')+'<p>'+B.esc(B.siteInputAssessment().notice)+'</p></details>';
})();
