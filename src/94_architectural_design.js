/* Architectural proposals preserve the customer's brief, style and material choices.
 * The rectangular packer exposes its assumptions; it does not infer an approved survey. */
(()=>{
 const B=BMH,esc=B.esc;
 // Roofs and walls use the same millimetre precision. Floating point seams
 // must not turn a fully tiled rectangle into a roofless notched footprint.
 const footprint=B.sceneFootprintBounds;
 B.sceneFootprintBounds=rooms=>{const integerRooms=rooms.map(r=>{const x=Math.round(r.x*1000),y=Math.round(r.y*1000);return {...r,x,y,w:Math.round((r.x+r.w)*1000)-x,h:Math.round((r.y+r.h)*1000)-y};}),b=footprint(integerRooms);if(!b)return b;return {...b,...Object.fromEntries(['x','y','width','depth','cx','cy'].map(k=>[k,b[k]/1000]))};};
 B.architectureProgram=()=>{
  const p=B.state.project,v=B.designState().program||{},text=String(p.briefIdea||''),explicit=p.brief?.userRequirements||{};
  const number=(key,pattern,fallback)=>Number.isInteger(Number(v[key]))&&Number(v[key])>0?Number(v[key]):
   Number.isInteger(Number(explicit[key]))&&Number(explicit[key])>0?Number(explicit[key]):Number(text.match(pattern)?.[1])||fallback;
  const requested=word=>new RegExp('(?:'+word+')','i').test(text)&&!new RegExp('(không|chưa)\\s+(cần\\s+|có\\s+|làm\\s+)?(?:'+word+')','i').test(text);
  return {bedrooms:number('bedrooms',/(\d{1,2})\s*(?:phòng ngủ|pn\b)/i,B.householdNeeds().bedrooms),
   bathrooms:number('bathrooms',/(\d{1,2})\s*(?:wc\b|nhà vệ sinh|phòng vệ sinh)/i,Number(p.site.floors)),
   garage:v.garage??explicit.garage??requested('gara|garage'),elevator:v.elevator??explicit.elevator??requested('thang máy'),
   office:v.office??explicit.office??requested('phòng làm việc'),worship:v.worship??explicit.worship??requested('phòng thờ'),
   garden:v.garden??explicit.garden??requested('sân vườn'),pond:v.pond??explicit.pond??requested('bể cá'),elderly:(p.household.relatives||[]).length>0};
 };
 B.architectureProposal=(strategy='balanced')=>{
  const p=B.state.project,program=B.architectureProgram(),e=B.buildableEnvelope(p.site),t=B.measuredWallThickness(false);
  const W=e.buildWidth-t,D=e.buildDepth-t,x0=(e.originX??e.side??0)+t/2,y0=(e.originY??e.front??0)+t/2;
  const floors=Number(p.site.floors),fail=text=>({ok:false,reason:text,program});
  if(![W,D,x0,y0].every(Number.isFinite)||W<3.35||D<6||!Number.isInteger(floors)||floors<1||floors>10)return fail('Khung xây dựng chưa đủ để bố trí phòng và lối đi. Kiểm tra ranh, khoảng lùi và số tầng.');
  if(program.bedrooms>20||program.bathrooms>20)return fail('Số phòng vượt phạm vi tự bố trí. Cần triển khai công năng riêng.');
  if(program.bathrooms<floors)return fail('Bố trí hiện tại cần một WC ở mỗi tầng. Giảm số tầng hoặc chọn ít nhất '+floors+' WC; không tự thêm ngoài yêu cầu.');
  if(program.elevator&&floors===1)return fail('Nhà một tầng chưa có điểm dừng trên để bố trí thang máy. Điều chỉnh số tầng hoặc bỏ lựa chọn này.');
  const wide=W>=7.2&&!program.garage, hallW=1.2,bank=wide?(W-hallW)/2:W-hallW;
  if(bank<2.65)return fail('Phòng còn quá hẹp sau khi dành hành lang 1,20 m. Điều chỉnh công năng hoặc khung đất.');
  const multi=floors>1,coreD=multi?(wide?4.2:5.4):2.2,mainD=D-coreD;
  const groundBeds=program.elderly?1:0,upperCount=program.bedrooms-groundBeds;
  if(upperCount<0)return fail('Cần ít nhất một phòng ngủ tầng trệt cho người thân đã khai báo.');
  const beds=Array.from({length:Math.max(0,upperCount)},(_,i)=>i===0?'Phòng ngủ chính':p.household.children?.[i-1]?.name?'Phòng '+p.household.children[i-1].name:'Phòng ngủ '+(i+1));
  const extraBaths=Math.max(0,program.bathrooms-floors),names=Array.from({length:floors},()=>[]);
  names[0].push(...(program.garage?[['Gara','garage']]:[]),['Phòng khách','living'],['Bếp + ăn','kitchen']);
  if(groundBeds)names[0].push(['Phòng ông bà','bed']);
  if(program.office)names[0].push(['Phòng làm việc','office']);
  if(program.worship)names[Math.min(1,floors-1)].push(['Phòng thờ','worship']);
  if(floors===1)names[0].push(...beds.map(n=>[n,'bed']));
  else beds.forEach((n,i)=>names[1+i%(floors-1)].push([n,'bed']));
  for(let i=0;i<extraBaths;i++)names[i%floors].push(['WC bổ sung '+(i+1),'bath']);
  const minDepth=type=>({living:3.0,kitchen:2.8,bed:2.95,garage:5.5,office:2.6,worship:2.4,bath:2.2})[type]||2.6;
  const rows=names.map(list=>wide?Array.from({length:Math.max(1,Math.ceil(list.length/2))},(_,i)=>[list[i*2],list[i*2+1]]):list.map(x=>[x]));
  if(rows.some(row=>row.reduce((n,pair)=>n+Math.max(...pair.filter(Boolean).map(x=>minDepth(x[1])),2.6),0)>mainD+.001))return fail('Chưa đủ chiều sâu cho số phòng yêu cầu với kích thước sử dụng được. Giảm công năng, tăng số tầng hoặc điều chỉnh khoảng lùi.');
  if(program.garage&&bank<3)return fail('Bề ngang gara chưa đủ cho chỗ đỗ mẫu. Cần kích thước xe và lối vào thực tế.');
  if(program.elevator&&bank-1.8<1.35&&wide)return fail('Khối thang máy và vệ sinh chưa đủ chỗ. Cần phân chia công năng riêng cho bề ngang này.');
  if(program.elevator&&!wide&&bank-1.8<1.35)return fail('Khối thang máy 1,80 m để lại WC quá hẹp. Tăng bề ngang hoặc điều chỉnh công năng.');
  const rooms=[],openings=[];let rid=0,oid=0;
  const add=(floor,name,type,x,y,w,h)=>{const r={id:'design-r'+(++rid),floor,name,type,x,y,w,h};rooms.push(r);return r;};
  const opening=(r,kind,side,width,offset=.5,extra={})=>{
   const span=['north','south'].includes(side)?r.w:r.h,widthFit=Math.min(width,span-.25);
   const o={id:'design-o'+(++oid),roomId:r.id,floor:r.floor,kind,side,width:widthFit,offset,height:kind==='door'?2.2:1.4,sill:kind==='door'?0:.9,hinge:'left',swing:'in',...extra};
   if(widthFit<.5)return;openings.push(o);return o;
  };
  for(let f=0;f<floors;f++){
   const hx=x0+bank,hall=add(f,'Sảnh / hành lang T'+(f+1),'corridor',hx,y0,hallW,D);
   if(f===0)opening(hall,'door','north',1.0,.5,{height:2.4});
   const list=rows[f],minimum=list.map(pair=>Math.max(...pair.filter(Boolean).map(x=>minDepth(x[1])),2.6));
   const weights=list.map(pair=>pair.some(x=>x?.[1]===(strategy==='climate'?'living':strategy==='balanced'?'kitchen':'bed'))?1.5:1);
   const remaining=mainD-minimum.reduce((a,b)=>a+b,0),weightSum=weights.reduce((a,b)=>a+b,0);let cursor=y0;
   list.forEach((pair,i)=>{
    const depth=minimum[i]+remaining*weights[i]/weightSum;
    for(let side=0;side<(wide?2:1);side++){
     const item=pair[side]||['Sinh hoạt chung','living'],x=side?hx+hallW:x0,r=add(f,item[0],item[1],x,cursor,bank,depth);
     opening(r,'door',side?'west':'east',r.type==='bath'?.8:.9,.76);
     if(r.type==='garage')opening(r,'door','north',2.8,.5,{height:2.4});
     else if(i===0)opening(r,'window','north',r.type==='living'?Math.min(2.4,bank-.4):1.5,.5,{height:r.type==='living'?1.65:1.4,sill:r.type==='living'?.65:.9});
     // Side windows require the side boundary to be open; this remains a brief assumption.
     if(r.type!=='corridor')opening(r,'window',side?'east':'west',r.type==='bath'?.65:1.4,.38,r.type==='bath'?{height:.55,sill:1.7}:{});
    }cursor+=depth;
   });
   if(wide){
    const stairs=add(f,'Cầu thang','stairs',x0,y0+mainD,bank,coreD);
    if(multi){stairs.stairShape='u';stairs.stairDirection=0;opening(stairs,'door','east',.9,.94);}
    else {stairs.type='utility';stairs.name='Giặt / kỹ thuật';opening(stairs,'door','east',.9);}
    const right=hx+hallW;
    if(program.elevator){
     const landing=add(f,'Sảnh thang máy','corridor',right,y0+mainD,1.8,coreD-2.2);opening(landing,'door','west',.9);
     const bath=add(f,'WC T'+(f+1),'bath',right+1.8,y0+mainD,bank-1.8,coreD);opening(bath,'door','west',.8,.15);opening(bath,'window','east',.65,.5,{height:.55,sill:1.7});
     const lift=add(f,'Thang máy','elevator',right,y0+mainD+coreD-2.2,1.8,2.2);
     lift.elevator={shaftId:'design-lift',doorSide:'west',cabinWidth:1.1,cabinDepth:1.3,doorWidth:.8,pitDepth:null,headroom:null,model:''};const o=B.elevatorLanding(lift);if(o)openings.push({...o,id:'design-o'+(++oid)});
    }else{
     const bath=add(f,'WC T'+(f+1),'bath',right,y0+mainD,bank,2.2);opening(bath,'door','west',.8);opening(bath,'window','east',.65,.5,{height:.55,sill:1.7});
     if(coreD>2.3){const laundry=add(f,'Giặt / kỹ thuật','utility',right,y0+mainD+2.2,bank,coreD-2.2);opening(laundry,'door','west',.9);}
    }
   }else{
    const bw=program.elevator?bank-1.8:bank,bath=add(f,'WC T'+(f+1),'bath',x0,y0+mainD,bw,2.2);
    opening(bath,'door','south',.8,.3);opening(bath,'window','west',.65,.5,{height:.55,sill:1.7});
    if(program.elevator){
     const lift=add(f,'Thang máy','elevator',x0+bw,y0+mainD,1.8,2.2);lift.elevator={shaftId:'design-lift',doorSide:'east',cabinWidth:1.1,cabinDepth:1.3,doorWidth:.8,pitDepth:null,headroom:null,model:''};const o=B.elevatorLanding(lift);if(o)openings.push({...o,id:'design-o'+(++oid)});
    }else{
     // WC access is directly from the hall; no route through a bedroom or stair flight.
     openings.pop();openings.pop();opening(bath,'door','east',.8,.6);opening(bath,'window','west',.65,.5,{height:.55,sill:1.7});
    }
    if(multi){const stair=add(f,'Cầu thang','stairs',x0,y0+mainD+2.2,bank,coreD-2.2);stair.stairShape='u';stair.stairDirection=0;opening(stair,'door','east',.9,.93);}
   }
  }
  // When a lift shares the narrow service strip, the WC gets a direct hall opening
  // via the lower stair landing; mark that coordination issue rather than invent a corridor.
  if(program.elevator&&!wide)return fail('Bề ngang này chưa bố trí được WC, sảnh và thang máy với lối vào riêng. Tăng bề ngang hoặc thiết kế khối thang riêng.');
  const plan={rooms,openings,outdoor:B.programOutdoorZones?.({...program,mode:'custom'})||[],lockedRoomIds:[],lockedFloors:[]};
  if(!B.layoutValid(rooms))return fail('Phương án vượt ranh hoặc chồng phòng. Giữ mặt bằng hiện tại.');
  const geometryErrors=B.withPlan(plan,()=>[...B.measuredGeometryIssues(),...B.elevatorIssues().filter(i=>i.sev==='error')]);
  if(geometryErrors.length)return fail(geometryErrors[0].text);
  const disconnected=B.withPlan(plan,()=>Array.from({length:floors},(_,f)=>B.circulationAnalysis(f).unreachable).flat());if(disconnected.length)return fail(disconnected[0].name+': chưa có đường tiếp cận liên tục qua cửa.');
  const requiredOutdoor=['garden','pond'].find(k=>program[k]&&!plan.outdoor.some(z=>z.type===k));if(requiredOutdoor)return fail('Khoảng sân chưa đủ cho '+(requiredOutdoor==='garden'?'sân vườn':'bể cá')+'.');
  return {ok:true,plan,program,assumptions:['Kích thước ranh và khoảng lùi do khách khai báo.','Ô mở bên hông cần khoảng thông thoáng thực tế.','Khối thang máy dự trù; hãng chưa xác nhận model, pit và đỉnh giếng.']};
 };
 B.autoPlanConcept=(strategy='balanced')=>{
  if(B.planHasLocks())return B.toast('Mở khóa phòng / tầng trước khi tạo bố trí mới.');
  const proposal=B.architectureProposal(strategy);if(!proposal.ok){B.designState().programNotice=proposal.reason;B.toast(proposal.reason);return false;}
  B.pushPlanHistory();B.state.project.plan=proposal.plan;B.state.project.site.designStrategy=strategy;
  B.state.ui.planner.floor=0;B.state.ui.planner.selected=proposal.plan.rooms[0]?.id;B.state.ui.planner.view='plan';B.save();B.render({preserveScroll:true});return true;
 };
 // A spatial option is not consent to replace a selected style, color or product.
 const generate=B.generateDesignKits;
 B.generateDesignKits=()=>{const result=generate();if(result){for(const kit of B.designState().kits){kit.style=B.state.project.style;kit.name=({A:'Ưu tiên phòng khách',B:'Cân bằng công năng',C:'Ưu tiên phòng ngủ'})[kit.id]||kit.name;kit.subtitle='Bố trí theo '+B.state.project.style;kit.exterior='Mặt tiền theo tường, ô mở và hoàn thiện đã chọn. Bốn mặt đứng dùng chung mô hình.';kit.interior='Công năng theo số phòng đã khai báo. Đồ nội thất mẫu có số đo và vị trí chung trong 2D / 3D.';kit.lighting='Giữ vật liệu, bảng màu và sản phẩm của khách. Kiểm tra hướng nắng và ô mở theo hiện trạng.';kit.preserveCustomerFinishes=true;}B.save();B.render({preserveScroll:true});}return result;};
 const apply=B.applyDesignKit;
 B.applyDesignKit=id=>{
  const p=B.state.project,kit=B.designState().kits.find(k=>k.id===id);if(!kit)return false;
  const style=p.style,finish=structuredClone(p.materials.finish),oldRooms=structuredClone(p.plan.rooms);
  const result=apply(id);if(!result)return result;
  p.style=style;const rooms={};for(const r of p.plan.rooms){const previous=oldRooms.find(o=>o.id===r.id&&o.type===r.type&&o.floor===r.floor)||oldRooms.find(o=>o.type===r.type&&o.floor===r.floor&&o.name===r.name);if(previous&&finish.rooms?.[previous.id])rooms[r.id]=finish.rooms[previous.id];}
  p.materials.finish={...finish,rooms};B.designState().appliedSignature=B.designAppliedKey();B.designState().inputSignature=B.designInputKey();B.finishInvalidate?.();B.save();B.render({preserveScroll:true});return true;
 };
 const inputKey=B.designInputKey;B.designInputKey=()=>inputKey()+'|customer-style:'+B.state.project.style+'|brief:'+B.state.project.briefIdea;
 B.programChooserHtml=()=>{
  const v=B.architectureProgram(),e=B.buildableEnvelope(),s=B.designState();
  const check=(key,label)=>'<label class="program-option"><input type="checkbox" data-program-option="'+key+'" '+(v[key]?'checked':'')+'><span><b>'+label+'</b></span></label>';
  return '<section class="design-program architectural-program"><span class="studio-eyebrow">YÊU CẦU THIẾT KẾ</span><h2>Bố trí theo hồ sơ của bạn.</h2><p>'+esc(B.state.project.style)+' · khung '+e.buildWidth.toFixed(2)+' × '+e.buildDepth.toFixed(2)+' m · '+B.state.project.site.floors+' tầng</p><div class="architecture-program-counts"><label>Phòng ngủ<input type="number" min="1" max="20" value="'+v.bedrooms+'" data-program-bedrooms></label><label>Phòng vệ sinh<input type="number" min="1" max="20" value="'+v.bathrooms+'" data-architect-program="bathrooms"></label></div><div class="program-grid">'+check('garage','Gara')+check('elevator','Thang máy')+check('office','Phòng làm việc')+check('worship','Phòng thờ')+check('garden','Sân vườn')+check('pond','Bể cá')+'</div><p>Giữ phong cách và vật liệu đã chọn. Bố trí mới có thể hoàn tác.</p>'+(s.programNotice?'<p role="status" class="design-notice">'+esc(s.programNotice)+'</p>':'')+'<div class="program-actions"><button data-program-create>Tạo bố trí theo yêu cầu</button><button data-program-skip>Dùng nhu cầu gia đình</button></div></section>';
 };
 document.addEventListener('change',e=>{if(!e.target.matches?.('[data-architect-program]'))return;const n=Number(e.target.value);if(!Number.isInteger(n)||n<1||n>20)return;const s=B.designState();s.program={...(s.program||{}),mode:'custom',[e.target.dataset.architectProgram]:n};B.save();});
 // Automatic eaves remain inside the declared parcel; explicit edits stay explicit.
 const roofSpec=B.roofDesignSpec;
 B.roofDesignSpec=()=>{const spec=roofSpec();if(B.measuredDesignSettings().roof.overhang>=0)return spec;const p=B.state.project,b=B.sceneFootprintBounds(B.floorRooms(Number(p.site.floors)-1));if(!b)return spec;return {...spec,overhang:Math.max(0,Math.min(spec.overhang,b.x,b.y,p.site.width-b.x-b.width,p.site.depth-b.y-b.depth))};};
 B.facadeComponents=()=>{
  const p=B.state.project,l=B.projectLevels(),s=B.houseStyle(),id=s?.id||'modern',parts=[];
  const add=(floor,roomId,kind,x,y,z,w,h,d,role='accent')=>{if(w<=0||h<=0||d<=0)return;const finish=B.finishPalette(roomId);parts.push({id:'facade-'+parts.length,floor,roomId,kind,x,y,z,w,h,d,role,color:finish[role]||s?.accent||'#746959'});};
  for(let f=0;f<l.floors;f++){
   const g=B.scenePlanGeometry(p.plan,f),base=f*l.floorHeight;
   for(const wall of g.walls.filter(w=>w.roomIds.length===1)){
    const r=p.plan.rooms.find(r=>r.id===wall.roomIds[0]),front=wall.horizontal&&Math.abs(wall.axis-r.y)<.001;if(!front)continue;
    const z=wall.axis-wall.thickness/2,mid=(wall.a+wall.b)/2,len=wall.b-wall.a;
    if(wall.kind==='wall'&&len>.36){
     if(['classic','neo','indochine','artdeco'].includes(id)){
      const width=Math.min(.28,len-.12);for(const x of [wall.a+.06,wall.b-width-.06])add(f,r.id,'pilaster',x,base+l.slab,z-.08,width,l.floorHeight-l.slab-.18,.08);
     }else if(!['minimal','bauhaus'].includes(id)&&len>.55){
      const width=Math.min(.42,len-.2),height=l.floorHeight-l.slab-.22;
      for(let x=mid-width/2;x<mid+width/2-.02;x+=.075)add(f,r.id,'wood-slat',x,base+l.slab+.1,z-.04,.035,height,.04);
     }
    }
    if(wall.kind==='window'){
     const capDepth=['japanese','tropical','vietnamese'].includes(id)?.34:.18;
     add(f,r.id,'window-hood',wall.a-.05,base+l.slab+wall.sill+wall.height+.04,z-capDepth,len+.1,.07,capDepth);
     add(f,r.id,'window-sill',wall.a-.04,base+l.slab+wall.sill-.05,z-.12,len+.08,.05,.12);
     if(['indochine','mediterranean','tuscan'].includes(id))for(const end of [wall.a-.17,wall.b+.03])for(let h=.07;h<wall.height;h+=.11)add(f,r.id,'shutter',end,base+l.slab+wall.sill+h,z-.035,.14,.05,.035);
    }
    if(wall.kind==='door'&&f===0){
     const space=Math.max(0,z),depth=Math.min(.45,space);if(depth>.12)add(f,r.id,'entry-canopy',wall.a-.1,base+l.slab+wall.height+.10,z-depth,len+.2,.10,depth,'wall');
    }
   }
   const b=B.sceneFootprintBounds(g.rooms);if(b&&['classic','neo','indochine','artdeco','vietnamese'].includes(id))add(f,null,'cornice',b.x,base+l.floorHeight-.12,b.y-B.measuredWallThickness(false)/2-.04,b.width,.12,.08,'wall');
  }
  const roof=B.sceneRoofSpec(),b=B.sceneFootprintBounds(B.floorRooms(l.floors-1)),top=l.floors*l.floorHeight+l.slab;
  if(roof&&b?.rectangular&&roof.eave>top+.001){const t=B.measuredWallThickness(false),f=l.floors-1,h=roof.eave-top;
   for(const [side,x,z,w,d]of [['front',b.x-t/2,b.y-t/2,b.width+t,t],['back',b.x-t/2,b.y+b.depth-t/2,b.width+t,t],['left',b.x-t/2,b.y+t/2,t,b.depth-t],['right',b.x+b.width-t/2,b.y+t/2,t,b.depth-t]]){add(f,null,'roof-eave-band',x,top,z,w,h,d,'wall');parts.at(-1).projectionSide=side;}
  }
  return parts;
 };
 const decorate=B.decorateStudioScene;
 B.decorateStudioScene=options=>{
  decorate?.(options);if(options.focus!=='all')return;
  const {addBox,roomMaterial,mats,W,D,explode}=options;
  for(const p of B.facadeComponents()){const material=roomMaterial(p.role,p.roomId,mats[p.role]||mats.accent),mesh=addBox(p.w,p.h,p.d,p.x+p.w/2-W/2,p.y+p.h/2+p.floor*explode,p.z+p.d/2-D/2,material);mesh.userData={kind:'facade-detail',componentId:p.id,componentKind:p.kind,floor:p.floor,roomId:p.roomId,measuredBox:{...p}};}
 };
 B.furniturePlanSvg=item=>{
  const d=B.FURNITURE_DIMENSIONS[item.model];if(!d)return '';const w=d.w,h=d.d,m=item.model,stroke='#697780';
  const rect=(x,y,a,b,r=.025)=>'<rect x="'+x+'" y="'+y+'" width="'+a+'" height="'+b+'" rx="'+r+'"/>';
  const line=(x,y,a,b)=>'<line x1="'+x+'" y1="'+y+'" x2="'+a+'" y2="'+b+'"/>';
  let body=rect(-w/2,-h/2,w,h),detail='';
  if(/^bed/.test(m)){detail=rect(-w/2+.04,-h/2+.08,w-.08,.12)+rect(-w*.4,-h*.37,w*.34,.36,.06)+rect(w*.06,-h*.37,w*.34,.36,.06)+line(-w/2+.04,-h*.08,w/2-.04,-h*.08)+line(-w/2+.1,h*.30,w/2-.1,h*.30);}
  else if(/Sofa|loungeChair/.test(m)){detail=rect(-w/2+.06,h/2-.18,w-.12,.12)+rect(-w/2+.03,-h/2+.04,.13,h-.08)+rect(w/2-.16,-h/2+.04,.13,h-.08);const n=w>1.5?3:1;for(let i=0;i<n;i++)detail+=rect(-w/2+.19+i*(w-.38)/n,-h/2+.08,(w-.38)/n-.03,h-.29,.05);}
  else if(/toilet/.test(m)){body=rect(-w*.4,-h/2,w*.8,h*.27,.05)+'<ellipse cx="0" cy="'+h*.08+'" rx="'+w*.44+'" ry="'+h*.31+'"/><ellipse cx="0" cy="'+h*.08+'" rx="'+w*.29+'" ry="'+h*.22+'"/>';}
  else if(/Sink/.test(m))detail=rect(-w*.34,-h*.25,w*.68,h*.5,.08)+line(w*.22,-h*.37,w*.22,-h*.23);
  else if(/Stove/.test(m))for(const x of [-w*.24,w*.24])for(const y of [-h*.24,h*.24])detail+='<circle cx="'+x+'" cy="'+y+'" r=".11"/>';
  else if(/shower/.test(m))detail=line(-w/2,-h/2,w/2,h/2)+line(w/2,-h/2,-w/2,h/2)+'<circle cx="0" cy="0" r=".045"/>';
  else if(/cabinet|Fridge|bookcase/i.test(m))detail=line(0,-h/2,0,h/2)+line(-.03,h*.2,.03,h*.2);
  else if(/table|desk/i.test(m))detail=rect(-w/2+.06,-h/2+.06,w-.12,h-.12);
  else if(/chair/i.test(m))detail=line(-w/2+.04,h/2-.1,w/2-.04,h/2-.1);
  else if(/Plant/.test(m))body='<circle r="'+Math.min(w,h)*.42+'"/>'+[0,1,2,3,4].map(i=>'<ellipse cx="'+Math.sin(i*1.25)*w*.18+'" cy="'+Math.cos(i*1.25)*h*.18+'" rx="'+w*.14+'" ry="'+h*.23+'" transform="rotate('+i*72+')"/>').join('');
  return '<g class="furniture-symbol" data-model="'+esc(m)+'" data-furniture-room="'+esc(item.roomId)+'" data-model-x="'+item.x+'" data-model-y="'+item.y+'" transform="translate('+(item.x+item.w/2)+' '+(item.y+item.d/2)+') rotate('+item.rotation+')" fill="white" stroke="'+stroke+'" stroke-width=".018">'+body+detail+'</g>';
 };
 const furniture=B.furnitureSvg;
 B.furnitureSvg=r=>['stairs','elevator','garage'].includes(r.type)?furniture(r):'<g class="furniture">'+B.roomFurnitureLayout(r).map(B.furniturePlanSvg).join('')+'</g>';
})();
