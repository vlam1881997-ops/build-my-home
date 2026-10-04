/* Select a brief before generating a new plan. Dimensions below are proposal assumptions. */
BMH.programOutdoorZones=(program=BMH.designState().program||{})=>{
 if(program.mode!=='custom'||program.garage)return [];
 const site=BMH.state.project.site,e=BMH.buildableEnvelope(site),x=(e.originX??e.side??0)+.1,y=.2,w=e.buildWidth-1.4,h=(e.originY??e.front??0)-.4,zones=[];
 const inside=z=>!site.useParcelGeometry||BMH.roomInsideParcel?.({...z,floor:0},{...site,setbackFront:0,setbackRear:0,setbackSide:0});
 if(w<1.4||h<1.2)return [];
 if(program.pond){const z={id:'outdoor-pond',type:'pond',name:'Bể cá cảnh',x:x+w-1.4,y,w:1.4,h:.8};if(inside(z))zones.push(z);}
 if(program.garden){const gw=w-(program.pond?1.55:0),z={id:'outdoor-garden',type:'garden',name:'Sân vườn',x,y,w:gw,h};if(gw>=1&&inside(z))zones.push(z);}
 return zones;
};
BMH.programOptions=()=>{
 const p=BMH.state.project,e=BMH.buildableEnvelope(p.site),program=BMH.designState().program||{},bedrooms=Math.max((p.household.relatives||[]).length?2:1,Number(program.bedrooms)||BMH.householdNeeds().bedrooms),old=BMH.designState().program;
 let garage=false;try{BMH.designState().program={mode:'custom',bedrooms,garage:true};garage=!!BMH.generateAutoPlanSnapshot('balanced');}finally{if(old===undefined)delete BMH.designState().program;else BMH.designState().program=old;}
 const candidates=BMH.programOutdoorZones({mode:'custom',garden:true,pond:false}),pond=BMH.programOutdoorZones({mode:'custom',pond:true});
 return {e,bedrooms,garage,garden:!program.garage&&candidates.length>0,pond:!program.garage&&pond.length>0};
};
BMH.programChooserHtml=()=>{
 const p=BMH.state.project,s=BMH.designState(),v=s.program||{},o=BMH.programOptions(),e=o.e,esc=BMH.esc;
 const card=(key,title,description,available=true)=>'<label class="program-option '+(!available?'unavailable':'')+'"><input type="checkbox" data-program-option="'+key+'" '+(v[key]?'checked ':'')+(!available?'disabled':'')+'><span><b>'+title+'</b><small>'+description+'</small></span></label>';
 return '<section class="design-program"><div class="design-section-head"><div><span>01 / NHU CẦU CỦA BẠN</span><h2>Trên khu đất này, bạn muốn có gì?</h2><p>'+esc(p.site.width+' × '+p.site.depth+' m · '+p.site.floors+' tầng')+' · Khung bố trí '+e.buildWidth.toFixed(2)+' × '+e.buildDepth.toFixed(2)+' m sau khoảng lùi.</p></div></div><div class="program-core"><b>Phòng khách · Bếp + ăn · WC'+(Number(p.site.floors)>1?' · Cầu thang':'')+'</b><span>Các không gian sinh hoạt cơ bản được giữ trong mọi phương án.</span><label>Phòng ngủ <input aria-label="Số phòng ngủ mong muốn" data-program-bedrooms type="number" min="'+((p.household.relatives||[]).length?2:1)+'" max="12" value="'+o.bedrooms+'"></label></div><div class="program-grid">'+card('garage','Gara ô tô',o.garage?'Dành ô tối thiểu 3,00 × 5,50 m; giảm diện tích sinh hoạt tầng 1.':'Chưa đủ chiều rộng hoặc chiều sâu để thêm gara cùng số phòng hiện tại.',o.garage)+card('garden','Sân vườn',o.garden?'Bố trí trong khoảng sân trước, giữ riêng lối vào nhà.':'Cần sân trước sâu tối thiểu 1,60 m và chỗ trống ngoài lối vào / gara.',o.garden)+card('pond','Bể cá cảnh',o.pond?'Bể tham khảo 1,40 × 0,80 m trong sân; có thể kết hợp vườn nếu đủ chỗ.':'Chưa có khoảng sân trống phù hợp ngoài lối vào / gara.',o.pond)+'</div><p class="design-notice">Đây là kiểm tra bố trí theo kích thước đã nhập. Kích thước xe thực tế, lối ra vào, ranh đất và quy hoạch cần được xác nhận trước thiết kế thi công.</p>'+(s.programNotice?'<p role="status" class="design-notice">'+esc(s.programNotice)+'</p>':'')+'<div class="program-actions"><button data-program-create>Tạo phương án theo lựa chọn →</button><button data-program-skip>Không có nhu cầu thêm · Gợi ý theo hồ sơ ban đầu</button></div></section>';
};
BMH.createProgramDesign=skip=>{
 const s=BMH.designState(),old=structuredClone(s.program||{});
 s.program=skip?{mode:'initial'}:{...old,mode:'custom',bedrooms:Number(old.bedrooms)||BMH.householdNeeds().bedrooms};
 if(!BMH.generateDesignKits()){s.programNotice='Chưa bố trí đủ các lựa chọn trên khu đất hiện tại. Hãy giảm số phòng / công năng hoặc tăng số tầng trong hồ sơ.';s.programOpen=true;BMH.save();BMH.render({preserveScroll:true});return false;}
 s.programOpen=false;s.programNotice='';BMH.save();BMH.render({preserveScroll:true});return true;
};
BMH.outdoorPlanSvg=plan=>'<g class="outdoor-plan">'+(plan.outdoor||[]).map(z=>'<g data-outdoor-id="'+BMH.esc(z.id)+'"><rect x="'+z.x+'" y="'+z.y+'" width="'+z.w+'" height="'+z.h+'" rx=".08" fill="'+(z.type==='pond'?'#bdd8d3':'#d6dec8')+'" stroke="#72866e" stroke-width=".025"/>'+ (z.type==='garden'?[.25,.6,.85].map(t=>'<circle cx="'+(z.x+z.w*t)+'" cy="'+(z.y+z.h*.5)+'" r="'+Math.min(.25,z.w*.15,z.h*.2)+'" fill="#9aac87"/>').join(''):'')+'<title>'+BMH.esc(z.name)+' · '+z.w.toFixed(2)+' × '+z.h.toFixed(2)+' m</title></g>').join('')+'</g>';
/* A coordinated design kit is a proposal; only explicit selection replaces a plan. */
BMH.designState=()=>{const p=BMH.state.project;const s=p.designStudio||(p.designStudio={});if(!Array.isArray(s.kits))s.kits=[];return s;};
BMH.designInputKey=()=>{const s=BMH.state.project.site;return JSON.stringify({site:Object.fromEntries(['width','depth','floors','floorHeight','slabThickness','ceilingDrop','frontDirection','setbackFront','setbackRear','setbackSide','targetCoverage','province','district','useParcelGeometry','lotPoints','frontEdge'].map(k=>[k,s[k]])),household:BMH.state.project.household,program:BMH.state.project.designStudio?.program||null});};
BMH.designAppliedKey=()=>JSON.stringify({plan:BMH.state.project.plan,finish:BMH.state.project.materials.finish,style:BMH.state.project.style});
BMH.designApprovalKey=()=>{
 const p=BMH.state.project;
 return JSON.stringify({design:BMH.designAppliedKey(),input:BMH.designInputKey(),products:p.materials.choices,productCodes:Object.values(p.materials.choices||{}).map(id=>[id,p.dataEngine?.materialOverrides?.[id]?.sku||''])});
};
BMH.designCanApprove=()=>{
 const p=BMH.state.project,rooms=p.plan.rooms,floors=Number(p.site.floors);
 return BMH.state.ui.onboardingComplete!==false&&rooms.length>0&&Number.isInteger(floors)&&floors>0&&BMH.layoutValid(rooms)&&rooms.every(r=>Number.isInteger(r.floor)&&r.floor>=0&&r.floor<floors)&&Array.from({length:floors},(_,f)=>rooms.some(r=>r.floor===f)).every(Boolean);
};
BMH.designSatisfied=()=>BMH.designCanApprove()&&BMH.designState().approval?.signature===BMH.designApprovalKey();
BMH.acceptDesign=()=>{
 if(!BMH.designCanApprove()){BMH.toast('Kiểm tra mặt bằng của từng tầng trước khi lưu thiết kế bạn hài lòng.');return false;}
 BMH.designState().approval={signature:BMH.designApprovalKey(),confirmedAt:new Date().toISOString()};BMH.save();BMH.render({preserveScroll:true});return true;
};
BMH.designDecisionHtml=()=>{
 const satisfied=BMH.designSatisfied(),changed=!!BMH.designState().approval&&!satisfied,ready=BMH.designCanApprove();
 return '<section class="design-decision" aria-label="Xác nhận thiết kế"><div><span>03 / QUYẾT ĐỊNH CỦA BẠN</span><h2>'+(satisfied?'Đã lưu thiết kế bạn hài lòng.':'Xem kỹ, chỉnh theo ý mình, rồi quyết định.')+'</h2><p>'+(satisfied?'Bạn có thể tiếp tục chỉnh. Nếu bản vẽ, thông tin ngôi nhà hoặc vật liệu đổi, BMH sẽ chờ bạn xem lại.':changed?'Thiết kế đã thay đổi sau lần xác nhận trước. Xem lại mặt bằng, ngoại thất và các phòng rồi lưu phương án bạn hài lòng.':'Xem mặt bằng, ngoại thất và từng phòng. Bạn quyết định khi nào thiết kế đã phù hợp với mình.')+'</p>'+(!ready?'<p class="design-notice">Mặt bằng cần nằm trong khu đất và có bố trí cho từng tầng trước khi xác nhận.</p>':'')+'</div><div class="design-decision-actions"><button data-design-accept '+(!ready?'disabled':'')+'>'+(satisfied?'✓ Đã hài lòng với thiết kế này':'Lưu thiết kế tôi hài lòng')+'</button>'+(satisfied?'<button data-design-service>Xem hồ sơ & dịch vụ →</button><button data-design-clear-approval>Bỏ xác nhận</button>':'')+'</div></section>';
};
BMH.DESIGN_KITS=[
 {id:'A',strategy:'climate',name:'Nhà đón sáng',style:'Nhiệt đới',subtitle:'Thoáng, xanh và dịu mát',wall:'#eee9dd',floor:'#dfd2bd',accent:'#536855',fabric:'#d9d4c5',exterior:'Sơn sáng, nhịp lam màu xanh trầm tại mảng tường đặc và cây trong khoảng sân đã khai báo.',interior:'Gỗ sáng, vải màu cát, phòng khách được ưu tiên diện tích và các ô mở bổ sung ở cạnh phù hợp.',lighting:'Ánh sáng ấm, tập trung tại bàn ăn và đầu giường; giữ cửa sổ lấy sáng tự nhiên.'},
 {id:'B',strategy:'balanced',name:'Tổ ấm Japandi',style:'Japandi',subtitle:'Gọn gàng, ấm và cân bằng',wall:'#eee6d9',floor:'#d3b998',accent:'#8f7052',fabric:'#cfc5b8',exterior:'Tường kem, chi tiết gỗ ấm và khung cửa tối; đường nét thống nhất với vị trí cửa trên mặt bằng.',interior:'Bếp và bàn ăn được ưu tiên; nội thất thấp, bảng màu trung tính, lưu trữ kín và lối đi rõ ràng.',lighting:'Đèn màu ấm tại khu sinh hoạt; ánh sáng đọc riêng ở mỗi phòng ngủ.'},
 {id:'C',strategy:'budget',name:'Tinh giản hiện đại',style:'Tối giản',subtitle:'Ít chi tiết, dễ hoàn thiện',wall:'#f2efe8',floor:'#d7d1c7',accent:'#5a605c',fabric:'#c8c9c3',exterior:'Sơn trắng ấm, khung cửa màu than, tiết chế lớp trang trí và dùng bề mặt dễ bảo trì.',interior:'Chia diện tích đều hơn, đồ đạc vừa kích thước phòng; ưu tiên món cần thiết trước khi thêm trang trí.',lighting:'Đèn tổng thể kết hợp đèn bàn; hạn chế chi tiết trần phức tạp.'}
];
BMH.generateDesignKits=()=>{
 if(BMH.planHasLocks())return BMH.toast('Có phòng hoặc tầng đã khóa. Mở khóa nếu bạn muốn tạo bố trí mới.');
 const s=BMH.designState(),kits=[];
 for(const def of BMH.DESIGN_KITS){const plan=BMH.generateAutoPlanSnapshot(def.strategy);if(!plan||!BMH.layoutValid(plan.rooms))continue;const metrics=BMH.planMetrics(plan);kits.push({...def,plan,metrics});}
 if(!kits.length){BMH.toast('Khu đất chưa đủ cho nhu cầu hiện tại. Kiểm tra số phòng, số tầng và khoảng lùi để gợi ý bố trí phù hợp.');return false;}
 BMH.state.ui.designProposalsOpen=true;s.kits=kits;s.inputSignature=BMH.designInputKey();s.notice='Chọn một bộ để áp dụng đồng thời mặt bằng, cửa, cầu thang và bảng hoàn thiện. Mọi phần đều chỉnh tiếp được.';BMH.save();BMH.render({preserveScroll:true});return true;
};
BMH.prepareDesignPlanner=()=>{
 const ui=BMH.state.ui,room=BMH.state.project.plan.rooms.find(r=>r.floor===0)||BMH.state.project.plan.rooms[0];
 ui.step=4;ui.designProposalsOpen=false;Object.assign(ui.planner,{floor:room?.floor||0,selected:room?.id||'',view:'plan',tool:'select',zoom:1});
};
BMH.applyDesignKit=id=>{
 const s=BMH.designState(),kit=s.kits.find(k=>k.id===id),p=BMH.state.project;
 if(!kit||BMH.planHasLocks())return false;
 if(s.inputSignature!==BMH.designInputKey()){BMH.toast('Đầu vào đã đổi. Tạo lại các phương án để khớp khu đất và gia đình.');return false;}
 s.previous={plan:BMH.planSnapshot(),style:p.style,designStrategy:p.site.designStrategy,finish:structuredClone(p.materials.finish||{exterior:null,rooms:{}})};
 BMH.pushPlanHistory();p.plan=structuredClone(kit.plan);p.style=kit.style;
 const colors={wall:kit.wall,floor:kit.floor,accent:kit.accent,fabric:kit.fabric,name:kit.name};p.materials.finish={exterior:{...colors},rooms:Object.fromEntries(p.plan.rooms.map(r=>[r.id,{...colors,...(r.type==='bath'?{floor:'#d8d9d2'}:{})}]))};
 p.site.designStrategy=kit.strategy;s.inputSignature=BMH.designInputKey();s.activeKit=id;s.appliedSignature=BMH.designAppliedKey();s.notice='Đã áp dụng '+kit.name+'. Bạn có thể chỉnh từng phòng, cửa, vật liệu và màu theo ý mình.';
 BMH.state.ui.sceneFocus='all';BMH.state.ui.sceneExploded=false;BMH.state.ui.architectureEngine='existing';BMH.state.ui.designView='exterior';BMH.finishInvalidate?.();BMH.normalizeState();BMH.prepareDesignPlanner();s.appliedSignature=BMH.designAppliedKey();s.inputSignature=BMH.designInputKey();BMH.save();BMH.render({preserveScroll:true});return true;
};
BMH.restoreDesignKit=()=>{const s=BMH.designState(),p=BMH.state.project;if(!s.previous||BMH.planHasLocks())return false;const previous=s.previous;BMH.pushPlanHistory();p.plan=structuredClone(previous.plan);p.style=previous.style;if('designStrategy'in previous)p.site.designStrategy=previous.designStrategy;p.materials.finish=structuredClone(previous.finish);delete s.previous;s.activeKit='';s.appliedSignature='';BMH.prepareDesignPlanner();BMH.finishInvalidate?.();BMH.save();BMH.render({preserveScroll:true});return true;};
BMH.designPlanPreview=(plan,floor=0)=>{
 const rooms=plan.rooms.filter(r=>r.floor===floor),s=BMH.state.project.site,one=rooms.length===1?rooms[0]:null,W=one?.w||Number(s.width),D=one?.h||Number(s.depth),ox=one?.x||0,oy=one?.y||0,esc=BMH.esc;
 const colors={living:'#e7d9c7',kitchen:'#e0d4bf',bed:'#dfdfd1',bath:'#d8e1dd',stairs:'#c4b89d',corridor:'#f2eee6',balcony:'#d1d9c2'};
 const openings=(plan.openings||[]).filter(o=>o.floor===floor).map(o=>{const r=rooms.find(r=>r.id===o.roomId);if(!r)return '';const h=['north','south'].includes(o.side),span=h?r.w:r.h,w=Math.min(span,o.width),a=(h?r.x:r.y)+(span-w)*o.offset,axis=h?(o.side==='north'?r.y:r.y+r.h):(o.side==='west'?r.x:r.x+r.w);return '<line x1="'+(h?a:axis)+'" y1="'+(h?axis:a)+'" x2="'+(h?a+w:axis)+'" y2="'+(h?axis:a+w)+'" stroke="'+(o.kind==='door'?'#aa8159':'#89b1b4')+'" stroke-width=".12"/>';}).join('');
 const furniture=BMH.withPlan(plan,()=>rooms.filter(r=>r.type!=='stairs').map(r=>BMH.furnitureSvg(r))).join('');
 const labels=rooms.filter(r=>r.type!=='corridor').map(r=>{const cx=r.x+r.w/2,cy=r.y+r.h/2;return '<g transform="rotate(-90 '+cx+' '+cy+')"><rect x="'+(cx-.8)+'" y="'+(cy-.15)+'" width="1.6" height=".42" rx=".06" fill="#fffdf6" fill-opacity=".91"/><text x="'+cx+'" y="'+cy+'" font-family="Arial,sans-serif" text-anchor="middle" font-size=".12" fill="#364236">'+BMH.esc(r.name)+'</text><text x="'+cx+'" y="'+(cy+.15)+'" font-family="Arial,sans-serif" text-anchor="middle" font-size=".10" fill="#647362">'+(r.w*r.h).toFixed(1)+' m²</text></g>';}).join('');

 const stairs=rooms.filter(r=>r.type==='stairs').flatMap(r=>BMH.stairGeometry(r)).map(i=>'<rect x="'+i.x+'" y="'+i.y+'" width="'+i.w+'" height="'+i.d+'" fill="none" stroke="#84765c" stroke-width=".025"/>').join('');
 return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-.35 -.35 '+(D+.7)+' '+(W+.7)+'" role="img" aria-label="Mặt bằng tầng '+(floor+1)+'"><g transform="translate('+(D+oy)+' '+(-ox)+') rotate(90)"><rect x="'+ox+'" y="'+oy+'" width="'+W+'" height="'+D+'" fill="#f6f3eb" stroke="#d6d0c4" stroke-width=".035"/>'+rooms.map(r=>'<rect x="'+r.x+'" y="'+r.y+'" width="'+r.w+'" height="'+r.h+'" fill="'+(colors[r.type]||'#e5dfd2')+'" stroke="#667064" stroke-width=".075"><title>'+esc(r.name)+' · '+r.w.toFixed(2)+' × '+r.h.toFixed(2)+' m</title></rect>').join('')+BMH.outdoorPlanSvg(plan)+furniture+stairs+openings+labels+'</g></svg>';
};
BMH.designWelcomeHtml=()=>'<section class="design-welcome"><div><span>THIẾT KẾ TOÀN BỘ NGÔI NHÀ</span><h2>Một phương án hoàn chỉnh. Rồi chỉnh theo ý bạn.</h2><p>Từ khu đất và gia đình: gợi ý mặt bằng, cửa, cầu thang, ngoại thất, nội thất và bảng vật liệu trong cùng một bộ thiết kế.</p></div><button data-design-start>Gợi ý thiết kế cho nhà tôi <span>↗</span></button></section>';
BMH.designDrawingSvg=(type,floor)=>{const svg=type==='elevation'?BMH.elevationSvg():type==='section'?BMH.sectionSvg():BMH.drawingSheetSvg(floor);return svg.replace(/<svg(?![^>]*xmlns=)/,'<svg xmlns="http://www.w3.org/2000/svg"');};
const designHome=BMH.screen1;BMH.screen1=()=>BMH.state.ui.homeMode==='finish'?designHome():BMH.designWelcomeHtml()+designHome();BMH.SCREENS[0]=BMH.screen1;
BMH.designKitsHtml=()=>{const s=BMH.designState();if(s.programOpen??!s.kits.length)return BMH.programChooserHtml();const stale=s.inputSignature!==BMH.designInputKey();return '<section class="design-proposals"><button class="program-reopen" data-program-open>← Chỉnh nhu cầu & công năng</button><div class="design-section-head"><div><span>01 / KHÁM PHÁ PHƯƠNG ÁN</span><h2>Chọn cách ngôi nhà sẽ trở thành tổ ấm.</h2><p>Mỗi bộ gồm bố trí, cửa, thang, màu và gợi ý hoàn thiện. Chọn xong vẫn sửa được từng phần.</p></div><button data-design-generate>↻ '+(s.kits.length?'Gợi ý lại toàn bộ':'Gợi ý ba bộ thiết kế')+'</button></div>'+(s.kits.length?'<div class="design-kit-grid">'+s.kits.map(k=>'<article class="design-kit '+(s.activeKit===k.id?'selected':'')+'"><div class="design-kit-plan">'+BMH.designPlanPreview(k.plan)+'<span>MẶT BẰNG TẦNG 1</span></div><div class="design-kit-content"><span>PHƯƠNG ÁN '+k.id+' · '+BMH.esc(k.style)+'</span><h3>'+BMH.esc(k.name)+'</h3><p>'+BMH.esc(k.subtitle)+'</p><div class="design-kit-colors">'+[k.wall,k.floor,k.accent,k.fabric].map(c=>'<i style="background:'+c+'"></i>').join('')+'<small>Bảng màu & chất liệu</small></div><p class="design-kit-summary">'+k.plan.rooms.filter(r=>r.type==='bed').length+' phòng ngủ · '+k.plan.rooms.filter(r=>r.type==='bath').length+' WC · '+BMH.num(k.metrics.area,1)+' m²</p><button data-design-kit="'+k.id+'" '+(stale?'disabled':'')+'>'+(s.activeKit===k.id?'Áp dụng lại bộ này':'Chọn toàn bộ phương án '+k.id)+' →</button></div></article>').join('')+'</div>':'<div class="design-kit-empty"><b>BMH sẽ chuẩn bị bố trí và cách hoàn thiện cùng lúc.</b><p>Bấm gợi ý để nhận các bộ thiết kế theo hồ sơ hiện tại. Phương án đang chỉnh được giữ đến khi bạn chọn một bộ mới.</p></div>')+(stale&&s.kits.length?'<p class="design-notice">Khu đất hoặc gia đình đã đổi. Gợi ý lại trước khi chọn một bộ thiết kế.</p>':'')+'</section>';};
// Proposals and geometry edits share the drawing workspace before the 3D review.
BMH.designPlannerProposalsHtml=()=>{
 const s=BMH.designState(),kit=s.kits.find(k=>k.id===s.activeKit),open=BMH.state.ui.designProposalsOpen??!kit,changed=kit&&s.appliedSignature!==BMH.designAppliedKey();
 return '<section class="design-studio design-planner-proposals"><details data-design-proposals '+(open?'open':'')+'><summary><div><span>THIẾT KẾ NGÔI NHÀ</span><h2>Chọn phương án, rồi chỉnh trên bản vẽ.</h2><p>'+BMH.esc(kit?kit.name+(changed?' · Đã chỉnh theo ý bạn':' · Đang áp dụng'):'Ba gợi ý đồng bộ mặt bằng, cửa, cầu thang và hoàn thiện.')+'</p></div><span class="design-proposals-toggle">Xem phương án</span></summary>'+BMH.designKitsHtml()+'</details><div class="design-planner-next"><p role="status">'+BMH.esc(s.notice||'Thêm bớt phòng, chỉnh cửa và cầu thang ở bản vẽ bên dưới. Khi sẵn sàng, mở 3D để xem thiết kế.')+'</p><div>'+(s.previous?'<button data-design-restore>↶ Trở về thiết kế trước</button>':'')+'<button data-nav="6">Xem thiết kế trong 3D →</button></div></div></section>';
};
document.addEventListener('click',e=>{const t=e.target.closest?.('[data-plan-presentation]');if(!t)return;BMH.state.ui.planner.mode=t.dataset.planPresentation;BMH.save();BMH.render({preserveScroll:true});});
const designPlanner=BMH.screen5;
BMH.screen5=()=>designPlanner().replace('<div class="v6-s5 ','<div class="v6-s5 v6-design-planner ').replace('<aside class="v6-card v6-plan-tools">',BMH.designPlannerProposalsHtml()+'<div class="plan-presentation-controls" aria-label="Cách trình bày mặt bằng"><button data-plan-presentation="technical" aria-pressed="'+(BMH.state.ui.planner.mode!=='presentation')+'">Bản vẽ kỹ thuật</button><button data-plan-presentation="presentation" aria-pressed="'+(BMH.state.ui.planner.mode==='presentation')+'">Mặt bằng màu & nội thất</button><span>Cùng số đo; bản xuất A3 giữ nét kỹ thuật.</span></div><aside class="v6-card v6-plan-tools">');BMH.SCREENS[3]=BMH.screen5;
BMH.screen7=()=>{
 const p=BMH.state.project,s=BMH.designState(),ui=BMH.state.ui,esc=BMH.esc,focus=ui.sceneFocus||'all',room=p.plan.rooms.find(r=>'room:'+r.id===focus),floor=room?.floor??(focus.startsWith('floor:')?Number(focus.slice(6)):0),view=focus==='all'?'exterior':room?'room':ui.designView==='drawing'?'drawing':'layout';
 const kit=s.kits.find(k=>k.id===s.activeKit),changed=s.activeKit&&s.appliedSignature!==BMH.designAppliedKey(),image=BMH.cinematicRender.views[BMH.cinematicSignature()]||'';BMH.restoreRoomRender?.(BMH.cinematicSignature());
 const brief=kit||BMH.DESIGN_KITS.find(k=>k.style===p.style)||BMH.DESIGN_KITS[1],levelOptions=Array.from({length:p.site.floors},(_,f)=>'<option value="'+f+'" '+(floor===f?'selected':'')+'>Tầng '+(f+1)+'</option>').join('');
 const rooms=p.plan.rooms.filter(r=>r.floor===floor),shownArea=room?room.w*room.h:view==='exterior'?BMH.planArea():rooms.reduce((sum,r)=>sum+r.w*r.h,0);
 const drawingType=['plan','elevation','section'].includes(ui.designDrawing)?ui.designDrawing:'plan';
 const controls='<div class="design-view-controls">'+(view==='exterior'?'<button data-exterior-camera="'+(ui.exteriorCamera==='front'?'overview':'front')+'">'+(ui.exteriorCamera==='front'?'Xem toàn nhà':'Xem mặt tiền')+'</button>':'')+(view==='room'&&!['stairs','elevator','corridor','balcony'].includes(room?.type)?'<button data-room-camera="'+(ui.roomCamera==='overview'?'inside':'overview')+'">'+(ui.roomCamera==='overview'?'Bước vào phòng':'Xem toàn phòng')+'</button>':'')+(view==='drawing'?'<select data-design-drawing aria-label="Loại bản vẽ">'+[['plan','Mặt bằng'],['elevation','Mặt đứng'],['section','Mặt cắt A–A']].map(([id,name])=>'<option value="'+id+'" '+(drawingType===id?'selected':'')+'>'+name+'</option>').join('')+'</select>':'')+(view==='room'?'<select data-scene-focus aria-label="Chọn phòng">'+p.plan.rooms.map(r=>'<option value="room:'+r.id+'" '+(room?.id===r.id?'selected':'')+'>T'+(r.floor+1)+' · '+esc(r.name)+'</option>').join('')+'</select>':view!=='exterior'?'<select data-design-floor aria-label="Chọn tầng">'+levelOptions+'</select>':'')+'<button data-scene-theme>'+(ui.sceneTheme==='night'?'☾ Ban đêm':'☀ Ban ngày')+'</button><button data-studio3d-reset>↺ Đặt lại góc</button><button data-scene-explode class="'+(ui.sceneExploded?'active':'')+'">'+(ui.sceneExploded?'Ghép tầng':'Tách tầng')+'</button></div>';
 const drawing=view==='drawing'?'<div class="design-drawing"><img src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(BMH.designDrawingSvg(drawingType,floor))+'" alt="'+(drawingType==='plan'?'Mặt bằng có kích thước tầng '+(floor+1):drawingType==='elevation'?'Mặt đứng theo cửa trên bản vẽ':'Mặt cắt A–A theo số đo thiết kế')+'"><button data-nav="4">Mở bản vẽ để chỉnh phòng, cửa & cầu thang →</button></div>':'';
 return '<div class="design-studio"><header class="design-heading"><div><span>BUILD MY HOME / DESIGN STUDIO</span><h1>Ngôi nhà của bạn,<br><em>được thiết kế cùng nhau.</em></h1><p>'+esc(p.site.width+' × '+p.site.depth+' m · '+p.site.floors+' tầng · '+p.style)+' · '+(kit?esc(kit.name)+(changed?' · Đã chỉnh riêng':''):'Phương án hiện tại')+'</p></div><div class="design-heading-actions"><button data-nav="4">Chọn phương án & chỉnh bản vẽ ↗</button></div></header><nav class="design-view-tabs" aria-label="Cách xem thiết kế">'+[['exterior','Ngoại thất'],['layout','Bố trí từng tầng'],['room','Nội thất từng phòng'],['drawing','Bản vẽ & số đo']].map(([id,name])=>'<button data-design-view="'+id+'" aria-pressed="'+(view===id)+'" class="'+(view===id?'active':'')+'">'+name+'</button>').join('')+'</nav><div class="design-workspace"><section class="design-model"><div class="design-model-top"><div><b>'+esc(view==='exterior'?'Ngoại thất theo mặt bằng':view==='room'?room?.name||'Nội thất':view==='drawing'?'Bản vẽ có kích thước':'Mặt bằng nội thất · tầng '+(floor+1))+'</b><span>'+ (view==='layout'?'Cắt lớp tường để xem bố trí; số đo gốc được giữ nguyên.':'Phòng, cửa và cầu thang dùng chung dữ liệu với bản vẽ.')+'</span></div>'+controls+'</div>'+(drawing||BMH.architecturalRenderControlsHtml()+'<div class="design-canvas" id="studio3dStage"><canvas id="studio3dCanvas" aria-label="Mô hình 3D ngôi nhà đang thiết kế"></canvas><div id="studio3dLoading" class="design-loading">Đang dựng ngôi nhà từ mặt bằng…</div><div class="design-model-caption"><span>3D TỪ THIẾT KẾ CỦA BẠN</span><b>Kéo để xoay · Cuộn / chụm để phóng to</b></div></div>')+'<div class="design-model-footer"><span><b>'+BMH.num(shownArea,1)+' m²</b> '+(room?'diện tích phòng':view==='exterior'?'diện tích phòng':'diện tích tầng')+'</span><span><b>'+(room?room.w.toFixed(2)+' × '+room.h.toFixed(2):p.plan.rooms.filter(r=>r.type==='bed').length)+'</b> '+(room?'m':'phòng ngủ')+'</span><button data-finish-open>Hoàn thiện từ ảnh nhà đang xây →</button></div></section><aside class="design-brief"><span>BẢN THIẾT KẾ ĐỒNG BỘ</span><h2>'+esc(kit?.name||p.style)+'</h2><p>'+esc(brief.subtitle)+'</p><div class="design-brief-colors">'+['wall','floor','accent'].map(role=>{const colors=BMH.finishPalette?.(room?.id)||{wall:brief.wall,floor:brief.floor,accent:brief.accent};return '<label><input type="color" data-design-color="'+role+'" value="'+esc(colors[role]||brief[role])+'"><span>'+({wall:'Sơn tường',floor:'Sàn',accent:'Điểm nhấn'}[role])+'</span></label>';}).join('')+'</div><label class="design-surface-control">Chất liệu sàn mô phỏng<select data-design-surface>'+[['auto','Theo phong cách'],['wood','Sàn gỗ'],['tile','Gạch 600 × 600'],['stone','Đá 800 × 800']].map(([id,name])=>'<option value="'+id+'" '+((BMH.finishPalette?.(room?.id)?.surface||'auto')===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label><details open><summary>Ngoại thất</summary><p>'+esc(brief.exterior)+'</p></details><details open><summary>Nội thất & bố trí</summary><p>'+esc(brief.interior)+'</p></details><details><summary>Ánh sáng & vật liệu</summary><p>'+esc(brief.lighting)+'</p><p>Bảng màu là vật liệu minh họa. Chọn sản phẩm và báo giá thật tại showroom.</p><button data-nav="5">Chọn vật liệu & sản phẩm →</button></details><button class="design-ai-button" data-cinematic-render '+(BMH.cinematicRender.loading?'disabled':'')+'>'+(BMH.cinematicRender.loading?'Đang tạo phối cảnh…':'Tạo phối cảnh đẹp từ thiết kế này ↗')+'</button><small>Phối cảnh Gemini là ảnh minh họa từ mô hình hiện tại.</small>'+(BMH.cinematicRender.error?'<p class="design-error" role="alert">'+esc(BMH.cinematicRender.error)+'</p>':'')+'</aside></div>'+(image?'<section class="design-render" data-cinematic-hero hidden><img src="'+esc(image)+'" alt="Phối cảnh Gemini của thiết kế đang chọn"><div><h2>Phối cảnh của phương án hiện tại</h2><p>Đối chiếu với bản vẽ trước khi chốt. Bạn có thể chỉnh và tạo lại.</p><button data-render-download>Tải phối cảnh ↓</button></div></section>':'')+'<section class="design-room-list"><div class="design-section-head"><div><span>02 / TỪNG KHÔNG GIAN</span><h2>Đi qua từng phòng của bạn.</h2></div><button data-room-review>Gemini phân tích bản vẽ & tất cả phòng</button></div><div class="design-room-grid">'+rooms.map(r=>{const key=BMH.cinematicSignature('room:'+r.id);BMH.restoreRoomRender?.(key);const img=BMH.cinematicRender.views[key];return '<button data-design-room="'+esc(r.id)+'"><div>'+(img?'<img src="'+esc(img)+'" alt="Phối cảnh '+esc(r.name)+'">':BMH.designPlanPreview({rooms:[r],openings:p.plan.openings},floor))+'</div><span>'+esc(r.name)+'</span><small>'+r.w.toFixed(2)+' × '+r.h.toFixed(2)+' m · '+BMH.roomFurnitureLayout(r).length+' món</small></button>';}).join('')+'</div><div class="design-room-actions"><button data-render-all>Tạo phối cảnh Gemini cho tất cả phòng</button><button data-nav="4">Chỉnh mặt bằng</button><button data-nav="5">Chọn vật liệu</button></div></section>'+BMH.designDecisionHtml()+'</div>';
};BMH.SCREENS[5]=BMH.screen7;
document.addEventListener('click',e=>{
 const t=e.target.closest?.('[data-design-start],[data-design-generate],[data-design-kit],[data-design-view],[data-design-room],[data-design-restore],[data-room-camera],[data-exterior-camera],[data-design-accept],[data-design-service],[data-design-clear-approval],[data-program-open],[data-program-create],[data-program-skip]');if(!t)return;const d=t.dataset;
 if('programOpen'in d){BMH.designState().programOpen=true;BMH.state.ui.designProposalsOpen=true;BMH.save();BMH.render({preserveScroll:true});return;}
 if('programCreate'in d)return void BMH.createProgramDesign(false);
 if('programSkip'in d)return void BMH.createProgramDesign(true);
 if('designStart'in d){if(BMH.state.ui.onboardingComplete===false){BMH.designState().openRequested=true;BMH.navigateTo(4);}else{BMH.designState().programOpen=true;BMH.state.ui.designProposalsOpen=true;BMH.navigateTo(4);}return;}
 if('designGenerate'in d){BMH.designState().programOpen=true;BMH.save();BMH.render({preserveScroll:true});return;}
 if(d.designKit){if(BMH.applyDesignKit(d.designKit))document.querySelector?.('.v6-plan-main')?.scrollIntoView({block:'start'});return;}
 if('designRestore'in d)return void BMH.restoreDesignKit();
 if('designAccept'in d)return void BMH.acceptDesign();
 if('designService'in d){if(BMH.designSatisfied())BMH.navigateTo(10);return;}
 if('designClearApproval'in d){delete BMH.designState().approval;BMH.save();BMH.render({preserveScroll:true});return;}
 if(d.exteriorCamera){BMH.state.ui.exteriorCamera=d.exteriorCamera;BMH.save();BMH.render({preserveScroll:true});return;}
 if(d.roomCamera){BMH.state.ui.roomCamera=d.roomCamera;BMH.save();BMH.render({preserveScroll:true});return;}
 if(d.designView||d.designRoom){const v=d.designRoom?'room':d.designView,rooms=BMH.state.project.plan.rooms;BMH.state.ui.designView=v;if(v==='room')BMH.state.ui.roomCamera='overview';BMH.state.ui.sceneFocus=v==='exterior'?'all':v==='room'?'room:'+(d.designRoom||rooms.find(r=>r.type==='living')?.id||rooms[0]?.id):'floor:0';BMH.state.ui.sceneExploded=false;BMH.save();BMH.render({preserveScroll:true});}
});
document.addEventListener('click',e=>{if(!e.target.closest?.('[data-setup-finish]')||BMH.state.ui.onboardingComplete===false||!BMH.designState().openRequested)return;BMH.designState().openRequested=false;BMH.designState().programOpen=true;BMH.state.ui.designProposalsOpen=true;BMH.navigateTo(4);});
document.addEventListener('toggle',e=>{if(e.target.isConnected&&e.target.matches?.('[data-design-proposals]')){BMH.state.ui.designProposalsOpen=e.target.open;BMH.save();}},true);
document.addEventListener('change',e=>{
 if(e.target.matches?.('[data-program-option],[data-program-bedrooms]')){const s=BMH.designState(),v=s.program??={mode:'custom'};v.mode='custom';if(e.target.hasAttribute('data-program-bedrooms'))v.bedrooms=BMH.clamp(Math.round(Number(e.target.value)||1),(BMH.state.project.household.relatives||[]).length?2:1,12);else{v[e.target.dataset.programOption]=e.target.checked;if(v.garage){v.garden=false;v.pond=false;}}s.programNotice='';BMH.save();BMH.render({preserveScroll:true});return;}

 const t=e.target;
 if(t.hasAttribute?.('data-design-surface')&&['auto','wood','tile','stone'].includes(t.value)){const p=BMH.state.project,focus=BMH.state.ui.sceneFocus||'all',f=p.materials.finish||(p.materials.finish={exterior:null,rooms:{}});f.rooms??={};const ids=focus.startsWith('room:')?[focus.slice(5)]:p.plan.rooms.map(r=>r.id);for(const id of ids){const previous=BMH.finishPalette(id)||{},visualMaterials={...previous.visualMaterials};delete visualMaterials.floor;f.rooms[id]={...previous,surface:t.value,visualMaterials};}if(!focus.startsWith('room:'))f.exterior={...(f.exterior||{}),surface:t.value};BMH.finishInvalidate?.();BMH.save();BMH.render({preserveScroll:true});return;}
 if(t.hasAttribute?.('data-design-drawing')&&['plan','elevation','section'].includes(t.value)){BMH.state.ui.designDrawing=t.value;BMH.save();BMH.render({preserveScroll:true});}
 if(t.hasAttribute?.('data-design-floor')){BMH.state.ui.sceneFocus='floor:'+Number(t.value);BMH.save();BMH.render({preserveScroll:true});}
 if(t.dataset?.designColor&&/^#[0-9a-f]{6}$/i.test(t.value)){const p=BMH.state.project,focus=BMH.state.ui.sceneFocus||'all',f=p.materials.finish||(p.materials.finish={exterior:null,rooms:{}});f.rooms??={};const role=t.dataset.designColor;if(focus.startsWith('room:')){const id=focus.slice(5);f.rooms[id]={...(BMH.finishPalette(id)||{}),[role]:t.value};}else{f.exterior={...(f.exterior||{}),[role]:t.value};for(const id of Object.keys(f.rooms))f.rooms[id][role]=t.value;}BMH.finishInvalidate?.();BMH.save();BMH.render({preserveScroll:true});}
});
queueMicrotask(()=>BMH.render({preserveScroll:true}));
// Visible finish details follow existing walls and room bounds. Cutaway is presentation only.
BMH.decorateStudioScene=({THREE,scene,mats,addBox,mat,roomMaterial,visibleFloors,roomFocus,floorFocus,W,D,fh,explode,focus})=>{
 const levels=BMH.projectLevels(),p=BMH.state.project;
 const detail=(mesh,roomId)=>{mesh.userData={...mesh.userData,kind:'finish-detail',roomId};return mesh;};
 for(const f of visibleFloors){
  const rooms=BMH.floorRooms(f).filter(r=>!roomFocus||r.id===roomFocus.id),base=roomFocus||floorFocus!==null?0:f*(fh+explode),geometry=BMH.scenePlanGeometry({rooms,openings:p.plan.openings,wallContext:p.plan.rooms},f),bounds=BMH.sceneFootprintBounds(rooms);
  for(const w of geometry.walls){
   if(w.kind==='door')continue;const len=w.b-w.a,mid=(w.a+w.b)/2,thickness=(w.thickness||.12)+.025;
   const mesh=addBox(w.horizontal?len:thickness,.085,w.horizontal?thickness:len,w.horizontal?mid-W/2:w.axis-W/2,base+levels.slab+.043,w.horizontal?w.axis-D/2:mid-D/2,mat(0xddd4c6,.8));detail(mesh,w.roomIds?.[0]);
   if(focus==='all'&&!BMH.facadeComponents&&w.roomIds?.length===1&&w.kind==='wall'){
    const dark=roomMaterial('accent',w.roomIds[0],mats.accent),z=w.horizontal?w.axis-D/2:mid-D/2,x=w.horizontal?mid-W/2:w.axis-W/2;
    // Narrow trim at the actual slab line rather than a new facade or opening.
    detail(addBox(w.horizontal?len:thickness,.09,w.horizontal?thickness:len,x,base+fh-.11,z,dark),w.roomIds[0]);
   }
   if(focus==='all'&&!BMH.facadeComponents&&bounds&&w.horizontal&&Math.abs(w.axis-bounds.y)<.01&&w.roomIds?.length===1){
    const finish=roomMaterial('accent',w.roomIds[0],mats.accent),z=w.axis-D/2-(w.thickness||.12)/2-.025;
    // Finish layers cover existing solid front walls only; openings stay clear.
    if(w.kind==='wall'&&len>.45&&p.style!=='Tối giản'&&(Math.abs(w.a-bounds.x)<.12||Math.abs(w.b-bounds.x-bounds.width)<.12)){
     const width=Math.min(.55,len-.12),slats=BMH.sceneAssetMaterials(THREE,scene,BMH.finishPalette?.(w.roomIds[0])||{}).slattedWood;
     detail(addBox(width,fh-levels.slab-.16,.025,mid-W/2,base+levels.slab+(fh-levels.slab)/2,z,finish),w.roomIds[0]);
     for(let sx=mid-width/2+.025;sx<mid+width/2;sx+=.065)detail(addBox(.035,fh-levels.slab-.16,.045,sx-W/2,base+levels.slab+(fh-levels.slab)/2,z-.023,slats),w.roomIds[0]);
    }
    if(w.kind==='window'){
     detail(addBox(len+.10,.07,.22,mid-W/2,base+levels.slab+w.sill+w.height+.075,z-.075,finish),w.roomIds[0]);
     detail(addBox(len+.10,.06,.14,mid-W/2,base+levels.slab+w.sill-.035,z-.035,finish),w.roomIds[0]);
    }
   }
  }
  for(const r of rooms){
   const cx=r.x+r.w/2-W/2,cz=r.y+r.h/2-D/2,finish=BMH.finishPalette?.(r.id)||{};
   if(['living','bed'].includes(r.type)){
    const rug=BMH.sceneAssetMaterials(THREE,scene,finish).rug;detail(addBox(Math.min(r.w-.3,2.75),.012,Math.min(r.h-.3,2.15),cx,base+levels.slab+.012,cz,rug),r.id);
    const width=Math.min(1.3,r.w*.4),height=.7,art=mat(0xb8b19b,.92),border=roomMaterial('accent',r.id,mats.accent);
    // Wall art is on the existing rear surface, within the room perimeter.
    if(roomFocus&&r.type==='bed'){detail(addBox(width+.08,height+.08,.035,cx,base+1.7,r.y+r.h-.13-D/2,border),r.id);detail(addBox(width,height,.014,cx,base+1.7,r.y+r.h-.154-D/2,art),r.id);}
   }
   if(r.type==='living'){
    const tv=BMH.roomFurnitureLayout(r).find(i=>i.model==='televisionModern'),rotation=((r.furnitureRotation||0)%360+360)%360,side={0:'south',90:'west',180:'north',270:'east'}[rotation],blocked=p.plan.openings.some(o=>o.roomId===r.id&&o.side===side);
    if(tv&&!blocked){const materials=BMH.sceneAssetMaterials(THREE,scene,finish),panel=new THREE.Group(),along=rotation%180===90?r.h:r.w,width=Math.min(2.2,along-.3),angle=-rotation*Math.PI/180,back=.26;
     panel.position.set(tv.x+tv.w/2-W/2+Math.sin(angle)*back,base+levels.slab,tv.y+tv.d/2-D/2+Math.cos(angle)*back);panel.rotation.y=angle;
     for(let x=-width/2+.025;x<width/2;x+=.055){const g=new THREE.BoxGeometry(.026,1.95,.034);BMH.sceneSurfaceUvs(g,materials.slattedWood);const slat=new THREE.Mesh(g,materials.slattedWood);slat.position.set(x,1.14,0);slat.castShadow=slat.receiveShadow=true;panel.add(slat);}
     panel.userData={kind:'finish-detail',roomId:r.id,generic:true};scene.add(panel);
    }
   }
   if(['living','kitchen','bed'].includes(r.type)){
    const glow=new THREE.MeshStandardMaterial({color:'#fff6d9',emissive:'#f3c077',emissiveIntensity:.5,roughness:.8});
    const fixture=new THREE.Mesh(new THREE.CylinderGeometry(.17,.25,.2,28),glow);fixture.position.set(cx,base+fh-.55,cz);detail(fixture,r.id);scene.add(fixture);
    const light=new THREE.PointLight(0xffe2b5,BMH.state.ui.sceneTheme==='night'?(roomFocus?9:3):(roomFocus?2:0),8,2);light.position.set(cx,base+fh-.7,cz);scene.add(light);
   }
  }
 }
 if(focus==='all'||floorFocus===0){
  for(const zone of p.plan.outdoor||[]){
   const cx=zone.x+zone.w/2-W/2,cz=zone.y+zone.h/2-D/2;
   if(zone.type==='pond'){
    const stone=BMH.sceneAssetMaterials(THREE,scene,{}).floorStone;
    for(const [w,d,x,z] of [[zone.w,.10,cx,zone.y-D/2],[zone.w,.10,cx,zone.y+zone.h-D/2],[.10,zone.h,zone.x-W/2,cz],[.10,zone.h,zone.x+zone.w-W/2,cz]])detail(addBox(w,.24,d,x,.17,z,stone),zone.id);
    const water=new THREE.MeshPhysicalMaterial({color:'#467f79',roughness:.15,metalness:.1,transparent:true,opacity:.82,clearcoat:1});detail(addBox(zone.w-.10,.015,zone.h-.10,cx,.22,cz,water),zone.id);
    for(let n=0;n<3;n++){const fish=new THREE.Mesh(new THREE.SphereGeometry(.06,12,8),mat(n%2?'#df9c45':'#dfd8c9',.45));fish.scale.set(1.6,.35,.55);fish.position.set(cx+(n-1)*.25,.19,cz+Math.sin(n)*.14);detail(fish,zone.id);scene.add(fish);}
   }else{
    detail(addBox(zone.w,.025,zone.h,cx,.095,cz,mat('#748563',.97)),zone.id);
    for(let n=0;n<5;n++){const x=zone.x+.2+(zone.w-.4)*(n/4),z=zone.y+zone.h*.55,plant=BMH.createSceneFoliage(THREE,{w:Math.min(.36,zone.w-.1),h:.45,d:Math.min(.36,zone.h-.1)},mats.green,36);plant.position.set(x-W/2,.12,z-D/2);detail(plant,zone.id);scene.add(plant);}
   }
  }
 }
 if(focus==='all'){
  const frontRooms=BMH.floorRooms(0),bounds=BMH.sceneFootprintBounds(frontRooms);
  if(bounds&&bounds.y>.7){
   const entrance=p.plan.openings.find(o=>o.floor===0&&o.kind==='door'&&o.side==='north'),r=p.plan.rooms.find(r=>r.id===entrance?.roomId),x=r?r.x+(r.w-entrance.width)*entrance.offset+entrance.width/2:bounds.cx;
   detail(addBox(Math.min(1.05,W-.2),.055,bounds.y,x-W/2,.095,bounds.y/2-D/2,mat(0xc0b69f,.92)),r?.id);
   for(const px of [.32,W-.32]){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.2,.16,.4,24),mat(0xb5ac94,.92));pot.position.set(px-W/2,.22,bounds.y*.5-D/2);detail(pot,'garden');scene.add(pot);const plant=BMH.createSceneFoliage(THREE,{w:.38,h:.7,d:.38},mats.green,48);plant.position.set(px-W/2,.42,bounds.y*.5-D/2);detail(plant,'garden');scene.add(plant);}
  }
 }
};

const designFooter=BMH.footer;BMH.footer=()=>BMH.state.ui.step===6?'<div class="demo-nextbar design-studio-footer"><button data-nav="4">← Chỉnh bản vẽ</button><span>Thiết kế và 3D dùng chung một phương án.</span><button data-nav="7">Xem dự toán của thiết kế →</button></div>':designFooter();
