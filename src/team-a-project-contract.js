/* A-owned adapters over the final B editor. Plan metres; positive angle in x/y. */
(()=>{
 const B=BMH,copy=structuredClone,angle=n=>((n%360)+360)%360;
 // Shared architectural geometry: open outdoor edges are not masonry walls.
 const planGeometry=B.scenePlanGeometry;
 B.scenePlanGeometry=(plan,floor)=>{
  const g=planGeometry(plan,floor);
  return {...g,walls:g.walls.filter(w=>w.roomIds.length!==1||!g.rooms.some(r=>r.id===w.roomIds[0]&&B.outdoorOpenEdge(r,w.horizontal,w.axis,w.a,w.b)))};
 };
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
 // A measured retraction is an explicit customer choice, never a style side effect.
 // Unassigned release is not a slab; outdoor choices require explicit measured semantics and a source.
 B.previewRoomDepthChange=request=>{
  const source=B.state.project.plan,room=source.rooms.find(r=>r.id===request?.roomId);
  const fail=reason=>({ok:false,reason});
  if(!room||room.type!=='bed')return fail('Chọn phòng ngủ cần xem phương án thu chiều sâu.');
  if(!Number.isFinite(request.depth)||request.depth<2.95||request.depth>=room.h)return fail('Chiều sâu cần từ 2,95 m và nhỏ hơn hiện tại; đây là giới hạn bộ bố trí, không phải chuẩn pháp lý.');
  if(!['front','rear'].includes(request.anchor))return fail('Chọn giữ cạnh trước hoặc cạnh sau của phòng.');
  const use=request.releasedUse??'unassigned',uses={office:['Phòng làm việc',2.6],laundry:['Phòng giặt',1.8],storage:['Kho',1.5],loggia:['Loggia',1.5],terrace:['Sân thượng',1.5]},outdoor=['loggia','terrace'].includes(use);
  if(use!=='unassigned'&&!Object.hasOwn(uses,use))return fail('Chọn công năng được hỗ trợ; loggia/sân thượng cần hợp đồng hình học riêng.');
  if(!B.furnitureContractReady())return fail('Nội thất chưa được chuẩn hóa; giữ bản gốc để kiểm tra.');
  if(outdoor){const roof=B.roofDesignSpec();if(room.floor!==B.resolvedProjectLevels().floors-1||roof.type!=='flat'||roof.overhang!==0)return fail('Ngoài trời hiện hỗ trợ tầng trên cùng với mái bằng không đua. Giữ mái/tầng đã chọn; không tự thay đổi.');if(typeof request.sourceReference!=='string'||!request.sourceReference.trim()||request.sourceReference.trim().length>240)return fail('Ghi nguồn lựa chọn ngoài trời của khách (tối đa 240 ký tự) trước khi xem phương án.');}
  const candidate=B.planSnapshot(),next=candidate.rooms.find(r=>r.id===room.id);
  next.h=request.depth;if(request.anchor==='rear')next.y=room.y+room.h-request.depth;
  const released={floor:room.floor,x:room.x,y:request.anchor==='rear'?room.y:room.y+request.depth,w:room.w,h:room.h-request.depth,use,reviewStatus:'awaiting-review'},changes=[];
  if(use!=='unassigned'){
   if(released.h<uses[use][1]||released.w<1.5)return fail('Phần dư chưa đủ kích thước cho công năng này trong bộ bố trí.');
   const id=room.id+'-released',openingId=id+'-access';
   if(candidate.rooms.some(r=>r.id===id)||candidate.openings.some(o=>o.id===openingId))return fail('ID phần chia đã tồn tại; chỉnh phòng hiện có thay vì tạo trùng.');
   const added={id,floor:room.floor,type:outdoor?'balcony':use,name:uses[use][0],x:released.x,y:released.y,w:released.w,h:released.h};candidate.rooms.push(added);
   if(outdoor){
    const facing=request.anchor==='rear'?'north':'south',sides=['north','east','south','west'].filter(side=>!B.sharedWallNeighbors(candidate.rooms,added,side).length);
    if(!sides.includes(facing))return fail('Cạnh ngoài trời đang tiếp giáp phòng khác; không tự mở tường phòng đó.');
    added.outdoorSpace={kind:use,openSides:use==='loggia'?[facing]:sides,sourceReference:request.sourceReference.trim(),reviewStatus:'awaiting-review',guard:{status:'unknown'},drainage:{status:'unknown'}};
    changes.push({kind:'outdoor-space',roomId:id,openSides:added.outdoorSpace.openSides,roof:use==='terrace'?'open':'covered',reviewStatus:'awaiting-review'});
   }
   const access=['east','west'].flatMap(side=>B.sharedWallNeighbors(candidate.rooms,added,side).filter(r=>r.type==='corridor').map(r=>({side,a:Math.max(r.y,added.y),b:Math.min(r.y+r.h,added.y+added.h)}))).find(s=>s.b-s.a>=1.06);
   if(!access)return fail('Phần dư chưa có cạnh tiếp giáp hành lang đủ để đặt cửa riêng; không tự tạo lối qua phòng ngủ.');
   candidate.openings.push({id:openingId,roomId:id,floor:room.floor,kind:'door',side:access.side,width:.9,offset:((access.a+access.b)/2-added.y-.45)/(added.h-.9),height:2.1,sill:0,hinge:'left',swing:'in'});
   const sharedSide=request.anchor==='rear'?'north':'south';
   for(const o of candidate.openings.filter(o=>!outdoor&&o.roomId===room.id&&o.kind==='window'&&o.side===sharedSide)){o.roomId=id;changes.push({kind:'window-room',id:o.id,from:room.id,to:id,reason:'Giữ cửa sổ trên tường ngoài của phòng mới, không để trên vách ngăn phòng ngủ.'});}
   changes.push({kind:'room-added',id,type:use},{kind:'opening-added',id:openingId});released.roomId=id;
  }
  candidate.fixtures=B.translatedFixtures(candidate.rooms,source);
  if(candidate.fixtures.length!==(source.fixtures||[]).length)return fail('Có fixture mất liên kết phòng; kiểm tra bản gốc trước khi thu chiều sâu.');
  const carried=B.carryFurnitureToPlan(candidate);if(!carried.ok)return fail(carried.reason);
  const plan=carried.plan,reason=B.directPlanError(plan);if(reason)return fail(reason);
  const issues=B.withPlan(plan,()=>[...B.measuredGeometryIssues().filter(i=>i.sev==='error'),...B.elevatorIssues().filter(i=>i.sev==='error')]);
  if(issues.length)return fail(issues[0].text);
  const disconnected=B.withPlan(plan,()=>B.circulationAnalysis(room.floor).unreachable);
  if(disconnected.length)return fail(disconnected[0].name+': chưa có đường tiếp cận liên tục qua cửa.');
  return {ok:true,units:'m',sourceRevision:B.drawingRevision(),sourcePlanKey:JSON.stringify(source),request:{roomId:room.id,depth:request.depth,anchor:request.anchor,releasedUse:use,...(outdoor?{sourceReference:request.sourceReference.trim()}:{})},plan,changes,
   room:{id:room.id,before:{width:room.w,depth:room.h,area:room.w*room.h},after:{width:next.w,depth:next.h,area:next.w*next.h}},released:{...released,area:released.w*released.h},
   cost:{status:'unknown',amount:null,reason:'Cần bóc lại khối lượng và báo giá cùng revision; không suy tiền tiết kiệm từ diện tích.'},
   notice:outdoor?'Không gian ngoài trời có sàn/cạnh mở và cửa đo được; lan can, thoát nước, chống thấm và chịu lực chưa có hồ sơ. Chỉ là phương án chờ KTS/KS, chưa dùng thi công.':'Giữ phòng ngủ và khối thang; công năng mới, cửa và đồ thể hiện trong bản xem trước. Phần dư chưa là loggia/sân thượng; cần khách chấp nhận và KTS/KS kiểm duyệt.'};
 };
 B.applyRoomDepthChange=preview=>{
  if(!preview?.ok||preview.sourceRevision!==B.drawingRevision()||preview.sourcePlanKey!==JSON.stringify(B.state.project.plan))return reject('Phương án đã cũ; xem lại số đo trước khi áp dụng.');
  const current=B.previewRoomDepthChange(preview.request);
  if(!current.ok)return reject(current.reason);
  if(JSON.stringify(current.plan)!==JSON.stringify(preview.plan))return reject('Bản xem trước đã thay đổi; tạo lại phương án.');
  // commitDirectPlan performs fixture/furniture translations once, using source poses.
  const candidate=B.planSnapshot(),r=current.plan.rooms.find(r=>r.id===preview.request.roomId);
  candidate.rooms=copy(current.plan.rooms);candidate.openings=copy(current.plan.openings);
  return B.commitDirectPlan(candidate,{floor:r.floor,selected:r.id,selectedOpening:'',selectedFixture:''});
 };
 B.compareRoomDepthOptions=request=>['unassigned','office','laundry','storage'].map(releasedUse=>{const result=B.previewRoomDepthChange({...request,releasedUse});return {releasedUse,...result,...(result.ok?{assessment:B.evaluateDesignOption(result.plan,{strategy:'customer-room-allocation'})}:{})};});
 B.compareOutdoorDepthOptions=request=>['loggia','terrace'].map(releasedUse=>({releasedUse,...B.previewRoomDepthChange({...request,releasedUse})}));
 B.previewOutdoorSpace=request=>{
  const source=B.state.project.plan,r=source.rooms.find(r=>r.id===request?.roomId),fail=reason=>({ok:false,reason});
  if(!r||r.type!=='balcony'||!['loggia','terrace'].includes(request.kind))return fail('Chọn ban công hiện có và loại loggia/sân thượng.');
  if(typeof request.sourceReference!=='string'||!request.sourceReference.trim()||request.sourceReference.trim().length>240||!Array.isArray(request.openSides)||!request.openSides.length)return fail('Nhập cạnh mở và nguồn lựa chọn (tối đa 240 ký tự).');
  const plan=B.planSnapshot(),next=plan.rooms.find(q=>q.id===r.id);
  next.outdoorSpace={kind:request.kind,openSides:[...request.openSides],sourceReference:request.sourceReference.trim(),reviewStatus:'awaiting-review',guard:{status:'unknown'},drainage:{status:'unknown'}};
  const reason=B.directPlanError(plan)||B.withPlan(plan,()=>B.measuredGeometryIssues().find(i=>i.sev==='error')?.text);
  if(reason)return fail(reason);
  if(source.lockedRoomIds.includes(r.id)||source.lockedFloors.includes(r.floor))return fail('Phòng/tầng đang khóa.');
  return {ok:true,sourceRevision:B.drawingRevision(),sourcePlanKey:JSON.stringify(source),request:copy(request),plan,roomId:r.id,notice:'Xem cạnh mở/mái trước khi chấp nhận; hồ sơ lan can, chống thấm, thoát nước và chịu lực chưa được xác nhận.'};
 };
 B.applyOutdoorSpace=preview=>{
  if(!preview?.ok||preview.sourceRevision!==B.drawingRevision()||preview.sourcePlanKey!==JSON.stringify(B.state.project.plan))return reject('Phương án đã cũ; xem lại trước khi áp dụng.');
  const current=B.previewOutdoorSpace(preview.request);
  if(!current.ok||JSON.stringify(current.plan)!==JSON.stringify(preview.plan))return reject(current.reason||'Bản xem trước đã thay đổi.');
  return B.commitDirectPlan(current.plan,{floor:current.plan.rooms.find(r=>r.id===current.roomId).floor,selected:current.roomId});
 };
 const proposal=B.architectureProposal;
 B.architectureProposal=strategy=>{const result=proposal(strategy);if(!result.ok)return result;const carried=B.carryFurnitureToPlan(result.plan);return carried.ok?{...result,plan:carried.plan}:{...result,ok:false,reason:carried.reason};};
 const apply=B.applyDesignKit;
 B.applyDesignKit=id=>{const kit=B.designState().kits.find(k=>k.id===id);if(!kit)return false;const carried=B.carryFurnitureToPlan(kit.plan);if(!carried.ok)return reject(carried.reason);kit.plan=carried.plan;return apply(id);};
 const inputKey=B.designInputKey;
 B.designInputKey=()=>inputKey()+'|funding:'+JSON.stringify([B.state.project.finance,B.state.project.inputEvidence?.records,B.state.project.costPlan]);
 B.siteInputAssessment=()=>{
  const p=B.state.project,s=p.site,records=B.projectInputRegister(),north=s.north||{};
  const validDay=/^\d{4}-\d{2}-\d{2}$/.test(north.observedAt||'')&&Number.isFinite(Date.parse(north.observedAt))&&new Date(north.observedAt).toISOString().slice(0,10)===north.observedAt&&north.observedAt<=new Date().toISOString().slice(0,10);
  const directional=Number.isFinite(north.azimuthDeg)&&north.azimuthDeg>=0&&north.azimuthDeg<360&&north.datum==='true-north'&&typeof north.sourceReference==='string'&&north.sourceReference.trim().length>0&&validDay;
  const geometry=s.useParcelGeometry?B.parcelGeometry?.():null;
  return {status:'provisional',boundary:geometry?{area:geometry.area??null,basis:geometry.basis,reference:s.boundaryEvidenceId||null}:s.useParcelGeometry?{area:null,basis:'applied-polygon',reference:s.boundaryEvidenceId||null,status:'invalid',errors:B.parcelBoundaryReview?.(s)?.errors?.length?B.parcelBoundaryReview(s).errors:['Ranh đã áp dụng chưa có hình học hợp lệ; kiểm tra nguồn và các đỉnh.']}: {area:Number(s.width)*Number(s.depth),basis:'customer-dimensions',reference:null},north:{...north,usable:directional,status:directional?'provided':'unknown'},elevation:s.elevation,inputs:records,planning:(p.designEvidence?.site||[]).filter(r=>['planning','setbacks'].includes(r.kind)),legalBoundaryVerified:false,notice:'Pin bản đồ và khung kích thước không xác nhận ranh pháp lý; nguồn đo/quy hoạch cần kiểm chứng.'};
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
  const climate={status:'provisional',location:{province:p.site.province,district:p.site.district},sources:p.siteIntelligence?.citations||[],notice:'Khí hậu/vị trí là bối cảnh có nguồn nếu đã tải; ô mở bên hông cần xác nhận thực địa.'},circulation=Array.from({length:Number(p.site.floors)},(_,floor)=>({floor,unreachable:B.circulationAnalysis(floor).unreachable.map(r=>r.id)}));
  return {strategy,revision:B.drawingRevision(),geometryFeasible:!errors.length,area:quantities.grossArea,styleId:B.houseStyle?.()?.id||null,styleSpecification:style||null,materialRoles:materialRows,financial:{scope:'planning-allowance',estimatedTotal:estimate,available:limit,comparison,fullSourcedTotal:null},daylight,climate,circulation,site:B.siteInputAssessment(),fengshui:B.fengshuiPlacementAdvice(),reasons,choices:comparison==='over-provisional-budget'?['So báo giá vật liệu tương đương cùng yêu cầu','Khách chọn giảm diện tích/công năng','Điều chỉnh vốn hoặc tiến độ thi công']:[],score:errors.length?null:daylight.filter(r=>r.windows>0).length-(comparison==='over-provisional-budget'?100:0)};
 });
 B.compareDesignOptions=()=>['climate','balanced','compact'].map(strategy=>{const p=B.architectureProposal(strategy);return p.ok?{...p,assessment:B.evaluateDesignOption(p.plan,{strategy})}:{...p,strategy};}).sort((a,b)=>(b.assessment?.score??-Infinity)-(a.assessment?.score??-Infinity));
 const generate=B.generateDesignKits;
 B.generateDesignKits=()=>{const result=generate();if(result){for(const kit of B.designState().kits)kit.assessment=B.evaluateDesignOption(kit.plan,{strategy:kit.strategy||kit.id});B.save();}return result;};
 // A-owned program panel; B keeps navigation, layout and CSS.
 const programHtml=B.programChooserHtml;
 B.projectInputEvidenceHtml=()=>'<details><summary>Nguồn đầu vào và giá trị cần xác nhận</summary>'+B.projectInputRegister().map(r=>'<p>'+B.esc(r.field)+' = '+B.esc(JSON.stringify(r.value))+' · '+B.esc(r.status)+' · '+B.esc(r.sourceType)+' '+(r.confirmed?'đã xác nhận khai báo':'<button data-team-a-confirm-input="'+B.esc(r.field)+'">Xác nhận đây là thông tin tôi khai</button>')+'</p>').join('')+'<form data-team-a-north><label>Phương vị mặt tiền (cạnh đầu bản vẽ), đo theo chiều kim đồng hồ từ Bắc thật / độ<input name="azimuthDeg" type="number" min="0" max="359.999" step="any" required></label><label>Nguồn đo<input name="sourceReference" required></label><label>Ngày đo<input name="observedAt" type="date" required></label><button>Lưu hướng có nguồn</button></form><p>Thông tin khách xác nhận không tự là dữ liệu khảo sát được KTS/KS duyệt.</p></details>';
 B.programChooserHtml=()=>programHtml()+B.projectInputEvidenceHtml()+'<details><summary>Đối chiếu đất, vốn và các phương án</summary>'+B.compareDesignOptions().map(o=>'<p><b>'+B.esc(o.strategy)+'</b> · '+B.esc(o.ok?(o.assessment.financial.comparison+' · '+o.assessment.area.toFixed(2)+' m²'):o.reason)+'</p>').join('')+'<p>'+B.esc(B.siteInputAssessment().notice)+'</p></details>';
 document.addEventListener('click',e=>{const button=e.target.closest?.('[data-team-a-confirm-input]');if(!button)return;const field=button.dataset.teamAConfirmInput,record=B.state.project.inputEvidence?.records?.[field];if(record&&record.sourceType!=='customer-entered')return B.toast('Nguồn khảo sát/quy hoạch cần review riêng; không đổi thành khai báo khách.');B.recordProjectInput(field,{confirmed:true,sourceReference:record?.sourceReference||'Customer confirms displayed value'});B.render({preserveScroll:true});});
 document.addEventListener('submit',e=>{if(!e.target.matches?.('[data-team-a-north]'))return;e.preventDefault();const v=Object.fromEntries(new FormData(e.target)),a=Number(v.azimuthDeg);if(!Number.isFinite(a)||a<0||a>=360||!/^\d{4}-\d{2}-\d{2}$/.test(v.observedAt)||!v.sourceReference.trim())return;B.state.project.site.north={azimuthDeg:a,datum:'true-north',sourceReference:v.sourceReference,observedAt:v.observedAt,status:'provided'};B.recordProjectInput('site.north',{sourceType:'surveyed',sourceReference:v.sourceReference,effectiveAt:v.observedAt});B.render({preserveScroll:true});});
})();
