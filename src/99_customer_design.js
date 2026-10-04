/* Customer intent stays attached to the measured model. Metres internally.
 * Style families and procedural finishes are previews, not vendor replicas. */
(()=>{
 const B=BMH,esc=B.esc,clone=structuredClone;
 const styleCollections={modern:'urban-stone',minimal:'urban-stone',contemporary:'urban-stone',brutalist:'urban-stone',barn:'urban-stone',classic:'neo-elegance',neo:'neo-elegance',french:'neo-elegance',indochine:'indochine',vietnamese:'indochine',tudor:'indochine',mediterranean:'coastal',spanish:'coastal',tropical:'coastal',coastal:'coastal',scandi:'nordic-light',japandi:'warm-oak',japanese:'warm-oak',craftsman:'warm-oak',balinese:'warm-oak',artdeco:'olive-gallery',tuscan:'olive-gallery',midcentury:'mid-century',industrial:'loft-leather'};
 const finished=r=>!['stairs','elevator','balcony'].includes(r.type);
 const surfaceRoles=[['floor','Sàn'],['wall','Tường'],['accent','Gỗ / tủ'],['fabric','Vải']];
 const roomTypes=[['living','Phòng khách'],['kitchen','Bếp + ăn'],['bed','Phòng ngủ'],['bath','WC'],['corridor','Hành lang / lối đi'],['worship','Phòng thờ'],['office','Phòng làm việc'],['utility','Giặt / kỹ thuật'],['balcony','Ban công']];
 const sides=[['north','Đầu đất'],['east','Bên phải'],['south','Cuối đất'],['west','Bên trái']];
 const ui=()=>B.state.ui.planner;
 const finish=()=>B.state.project.materials.finish||=( {exterior:null,rooms:{}} );
 const update=()=>{B.finishInvalidate?.();B.customerFrameCache=null;B.save();B.render({preserveScroll:true});};
 B.customerStyleProfile=()=>{const style=B.houseStyle(),id=styleCollections[style?.id]||'warm-oak';return {style,recognized:!!style,name:B.state.project.style,collection:B.INTERIOR_COLLECTIONS.find(c=>c.id===id)||B.INTERIOR_COLLECTIONS[0]};};
 B.interiorCollection=roomId=>{
  const f=finish(),v=f.interior||{},profile=B.customerStyleProfile(),stored=roomId?v.rooms?.[roomId]||v.default:v.default;
  const authored=roomId&&v.rooms?.[roomId]?v.authored?.[roomId]:v.authored?.default;
  const allowed=stored!=='style'&&(authored===B.state.project.style||!authored&&stored===profile.collection.id);
  return allowed&&B.INTERIOR_COLLECTIONS.find(c=>c.id===stored)||profile.collection;
 };
 B.finishPalette=roomId=>{
  const f=finish(),c=B.interiorCollection(roomId),global=f.exterior||{},room=roomId?f.rooms?.[roomId]||{}:{},r=B.state.project.plan.rooms.find(r=>r.id===roomId);
  const p={...c,wall:B.houseStyle()?.wall||c.wall,...global,...room,visualMaterials:{...c.visualMaterials,...global.visualMaterials,...room.visualMaterials},collectionId:c.id,shape:c.shape,table:c.table};
  const surface=room.surface??global.surface;
  if(surface&&surface!=='auto'&&!room.visualMaterials?.floor&&!global.visualMaterials?.floor)p.visualMaterials.floor={wood:'oak-floor',tile:'ivory-tile',stone:'sand-travertine'}[surface]||p.visualMaterials.floor;
  if(r?.type==='bath'&&!room.visualMaterials?.floor&&!global.visualMaterials?.floor&&surface===undefined){p.visualMaterials.floor='sand-travertine';p.floor='#cfc0a0';}
  const material=B.VISUAL_MATERIALS.find(v=>v.role==='floor'&&v.id===p.visualMaterials.floor);if(material)p.surface=material.surface;
  return p;
 };
 const applyCollection=B.applyInteriorCollection;
 B.applyInteriorCollection=(id,roomId=null)=>{const result=applyCollection(id,roomId);if(!result)return result;const v=finish().interior;v.authored||={};for(const r of B.state.project.plan.rooms.filter(r=>roomId?r.id===roomId:finished(r)))v.authored[r.id]=B.state.project.style;if(!roomId)v.authored.default=B.state.project.style;B.save();return result;};
 B.returnInteriorToStyle=roomId=>{B.pushPlanHistory();const f=finish();f.interior||={rooms:{}};f.interior.rooms||={};if(roomId){f.interior.rooms[roomId]='style';if(f.interior.authored)delete f.interior.authored[roomId];}else f.interior={default:'',rooms:{},authored:{}};update();};
 B.styleOutputReview=()=>{
  const p=B.state.project,profile=B.customerStyleProfile();return {style:p.style,styleId:profile.style?.id||null,recognized:profile.recognized,expectedCollection:{id:profile.collection.id,name:profile.collection.name},textureBasis:'Procedural preview at metre scale; vendor texture and sample required for exact SKU.',rooms:p.plan.rooms.filter(finished).map(r=>{const palette=B.finishPalette(r.id),c=B.interiorCollection(r.id);return {roomId:r.id,name:r.name,floor:r.floor,collection:{id:c.id,name:c.name,shape:c.shape,table:c.table},styleAligned:profile.recognized&&c.id===profile.collection.id,surfaces:surfaceRoles.map(([role])=>{const v=B.VISUAL_MATERIALS.find(v=>v.id===palette.visualMaterials?.[role]&&v.role===role);return {role,id:v?.id||null,name:v?.name||'Chưa chọn',color:palette[role],scale:v?.scale?clone(v.scale):null};}),supplierSurfaces:B.showroomFinishInfo?.(r.id)||[]};})};
 };
 B.styleOutputHtml=()=>{
  const r=B.styleOutputReview(),mixed=r.rooms.filter(x=>!x.styleAligned),open=B.state.ui.guidedPanels?.['style-output'];
  return '<details class="customer-style-output" data-guided-panel="style-output" '+(open?'open':'')+'><summary><span><b>'+esc(r.style)+'</b><small>'+(r.recognized?(mixed.length?mixed.length+' phòng phối riêng':'Phong cách đang dùng cho hình khối / nội thất'):'Cần ảnh và mô tả để xác nhận phong cách riêng')+'</small></span><span>Phong cách & vật liệu</span></summary><div class="customer-style-body"><label>Phong cách ngôi nhà<select data-customer-style>'+(!r.recognized?'<option value="" selected>'+esc(r.style)+'</option>':'')+B.HOUSE_STYLES.map(s=>'<option value="'+s.id+'" '+(s.id===r.styleId?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></label><p>Hình dáng nội thất dùng bộ '+esc(r.expectedCollection.name)+'. Màu, vật liệu và mã hàng đã chọn được giữ khi đổi bố trí.</p>'+(mixed.length?'<button type="button" data-return-style>Đưa hình dáng các phòng về phong cách này</button>':'')+'<div class="customer-style-rooms">'+r.rooms.map(x=>'<article><b>T'+(x.floor+1)+' · '+esc(x.name)+'</b><small>'+esc(x.collection.name)+(x.styleAligned?'':' · phối riêng')+'</small>'+x.surfaces.map(v=>'<p><i style="background:'+esc(v.color||'#eee')+'"></i>'+esc(surfaceRoles.find(([k])=>k===v.role)[1])+': '+esc(v.name)+'</p>').join('')+x.supplierSurfaces.map(v=>'<small>'+esc([v.name,v.sku].filter(Boolean).join(' · '))+' · bề mặt mô phỏng</small>').join('')+'</article>').join('')+'</div><small>Vân mô phỏng có tỷ lệ mét. Muốn khớp tuyệt đối một SKU cần ảnh/texture, kích thước và mẫu thực tế của hãng. Phong cách dùng thư viện hình khối BMH; ảnh tham chiếu riêng cần được đối chiếu thêm.</small></div></details>';
 };
 const refresh=B.refreshStudioFinishes;B.refreshStudioFinishes=(...args)=>{const ok=refresh(...args);if(ok)for(const old of document.querySelectorAll('.customer-style-output')){const t=document.createElement('template');t.innerHTML=B.styleOutputHtml();old.replaceWith(t.content.firstElementChild);}return ok;};

 // Explicit floor intent. Invalid imported counts remain visible until corrected.
 const floorRow=v=>({bedrooms:Number(v?.bedrooms??0),bathrooms:Number(v?.bathrooms??0),living:!!v?.living,kitchen:!!v?.kitchen,office:!!v?.office,garage:!!v?.garage,worship:['none','room','living'].includes(v?.worship)?v.worship:'none',altarSide:sides.some(([k])=>k===v?.altarSide)?v.altarSide:'north'});
 B.requestedFloorProgram=()=>{const rows=B.designState().program?.floors;return Array.isArray(rows)&&rows.length===Number(B.state.project.site.floors)?rows.map(floorRow):null;};
 B.floorProgramError=rows=>{for(const [f,r]of rows.entries()){if(!['bedrooms','bathrooms'].every(k=>Number.isInteger(r[k])&&r[k]>=0&&r[k]<=20))return 'Tầng '+(f+1)+': nhập số phòng nguyên từ 0 đến 20.';if(r.garage&&f!==0)return 'Gara tự bố trí chỉ áp dụng ở tầng trệt.';if(r.worship==='living'&&!r.living)return 'Tầng '+(f+1)+': chọn phòng khách để đặt góc thờ tại phòng khách.';}return '';};
 B.ensureFloorProgram=(persist=true)=>{
  const s=B.designState(),n=Number(B.state.project.site.floors),stored=s.program?.floors;let rows;
  if(Array.isArray(stored))rows=Array.from({length:n},(_,f)=>floorRow(stored[f]||{bathrooms:1}));
  else{const v=B.architectureProgram();rows=Array.from({length:n},(_,f)=>floorRow({bathrooms:Math.floor(v.bathrooms/n)+(f<v.bathrooms%n?1:0),living:f===0,kitchen:f===0,office:f===0&&v.office,garage:f===0&&v.garage,worship:f===Math.min(1,n-1)&&v.worship?'room':'none'}));let remaining=v.bedrooms;if(v.elderly&&remaining){rows[0].bedrooms++;remaining--;}for(let i=0;i<remaining;i++)rows[n===1?0:1+i%(n-1)].bedrooms++;}
  if(persist)s.program={...s.program,mode:'custom',floors:clone(rows)};return rows;
 };
 const createProgram=B.createProgramDesign;B.createProgramDesign=skip=>{if(!skip){const rows=B.ensureFloorProgram(),error=B.floorProgramError(rows);if(error){B.designState().programNotice=error;update();return false;}}return createProgram(skip);};
 B.programChooserHtml=()=>{
  const rows=B.ensureFloorProgram(false),s=B.designState(),f=B.clamp(Number(B.state.ui.programFloor)||0,0,rows.length-1),v=rows[f],p=B.state.project,e=B.buildableEnvelope();
  const count=(key,label)=>'<label>'+label+'<input type="number" min="0" max="20" step="1" value="'+v[key]+'" data-floor-program="'+key+'"></label>';
  const flag=(key,label)=>'<label><input type="checkbox" data-floor-program="'+key+'" '+(v[key]?'checked':'')+'>'+label+'</label>';
  return '<section class="design-program customer-program"><span class="studio-eyebrow">CÔNG NĂNG TỪNG TẦNG</span><h2>Bạn chọn phòng ở tầng nào.</h2><p>'+esc(p.style)+' · '+rows.length+' tầng · khung '+e.buildWidth.toFixed(2)+' × '+e.buildDepth.toFixed(2)+' m</p><div class="customer-floor-rail">'+rows.map((r,i)=>'<button type="button" data-program-floor="'+i+'" aria-pressed="'+(f===i)+'"><b>Tầng '+(i+1)+'</b><small>'+r.bedrooms+' PN · '+r.bathrooms+' WC'+(r.worship!=='none'?' · có thờ':'')+'</small></button>').join('')+'</div><div class="customer-program-fields"><h3>Tầng '+(f+1)+'</h3><div class="customer-counts">'+count('bedrooms','Phòng ngủ')+count('bathrooms','WC')+'</div><div class="customer-program-flags">'+flag('living','Phòng khách')+flag('kitchen','Bếp + ăn')+flag('office','Phòng làm việc')+(f===0?flag('garage','Gara ô tô'):'')+'</div><label>Không gian thờ<select data-floor-program="worship">'+[['none','Không đặt tại tầng này'],['room','Phòng thờ riêng'],['living','Góc thờ trong phòng khách']].map(([k,n])=>'<option value="'+k+'" '+(v.worship===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'+(v.worship!=='none'?'<label>Ưu tiên lưng bàn thờ<select data-floor-program="altarSide">'+sides.map(([k,n])=>'<option value="'+k+'" '+(v.altarSide===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>':'')+'</div><details><summary>Thang máy, sân vườn & bể cá</summary><div class="customer-program-flags">'+[['elevator','Thang máy'],['garden','Sân vườn'],['pond','Bể cá']].map(([key,name])=>'<label><input type="checkbox" data-program-option="'+key+'" '+(s.program?.[key]?'checked':'')+'>'+name+'</label>').join('')+'</div></details><p>Không ép phòng thờ lên một tầng cố định. Bàn thờ dự trù có số đo để bạn chỉnh; điểm phong thủy chỉ để tham khảo.</p>'+(s.programNotice?'<p class="design-notice" role="status">'+esc(s.programNotice)+'</p>':'')+'<div class="program-actions"><button data-program-create>Tạo bố trí theo từng tầng</button><button data-program-skip>Gợi ý theo hồ sơ gia đình</button></div></section>';
 };
 B.designKitsHtml=()=>{
  const s=B.designState();if(s.programOpen??!s.kits.length)return B.programChooserHtml();const f=B.clamp(Number(B.state.ui.proposalFloor)||0,0,Number(B.state.project.site.floors)-1),stale=s.inputSignature!==B.designInputKey();
  return '<section class="design-proposals"><button data-program-open>← Chỉnh công năng từng tầng</button><div class="design-section-head"><div><span>PHƯƠNG ÁN BỐ TRÍ</span><h2>Cùng phong cách. Khác cách chia phòng.</h2><p>Giữ phong cách & vật liệu của bạn. Xem tất cả tầng trước khi chọn.</p></div><label>Xem tầng<select data-kit-floor>'+Array.from({length:Number(B.state.project.site.floors)},(_,i)=>'<option value="'+i+'" '+(i===f?'selected':'')+'>Tầng '+(i+1)+'</option>').join('')+'</select></label></div><div class="design-kit-grid">'+s.kits.map(k=>'<article class="design-kit"><div class="design-kit-plan">'+B.designPlanPreview(k.plan,f)+'<span>MẶT BẰNG TẦNG '+(f+1)+'</span></div><div class="design-kit-content"><span>PHƯƠNG ÁN '+k.id+'</span><h3>'+esc(k.name)+'</h3><p>'+esc(B.state.project.style)+'</p><p>'+k.plan.rooms.filter(r=>r.type==='bed').length+' phòng ngủ · '+k.plan.rooms.filter(r=>r.type==='bath').length+' WC · '+B.num(k.metrics.area,1)+' m²</p><button data-design-kit="'+k.id+'" '+(stale?'disabled':'')+'>Chọn bố trí '+k.id+' →</button></div></article>').join('')+'</div>'+(stale?'<p class="design-notice">Đầu vào đã đổi. Tạo lại bố trí để khớp yêu cầu.</p><button data-design-generate>Tạo lại phương án</button>':'')+'</section>';
 };
 const generate=B.generateDesignKits;B.generateDesignKits=()=>{const ok=generate();if(ok){const palette=B.finishPalette();for(const kit of B.designState().kits)Object.assign(kit,...surfaceRoles.map(([role])=>({[role]:palette[role]})),{subtitle:'Giữ phong cách & vật liệu của bạn'});B.save();}return ok;};
 const applyKit=B.applyDesignKit;B.applyDesignKit=id=>{
  const p=B.state.project,before=clone(finish()),oldRooms=clone(p.plan.rooms),ok=applyKit(id);if(!ok)return ok;
  const used=new Set(),mapping=new Map();for(const r of p.plan.rooms){const candidates=oldRooms.filter(o=>o.floor===r.floor&&o.type===r.type&&!used.has(o.id)),old=candidates.find(o=>o.name===r.name)||candidates[0];if(old){used.add(old.id);mapping.set(r.id,old.id);}}
  const remap=obj=>Object.fromEntries([...mapping].filter(([,old])=>obj?.[old]).map(([id,old])=>[id,clone(obj[old])]));
  p.materials.finish={...before,rooms:remap(before.rooms),...(before.interior?{interior:{...before.interior,rooms:remap(before.interior.rooms),authored:{...remap(before.interior.authored),...(before.interior.authored?.default?{default:before.interior.authored.default}:{})}}}:{})};
  B.designState().appliedSignature=B.designAppliedKey();B.designState().inputSignature=B.designInputKey();update();return true;
 };
 // One undo timeline includes material intent and per-floor requests.
 const history=new WeakMap(),push=B.pushPlanHistory,undo=B.undoPlan,redo=B.redoPlan;
 const intent=()=>({finish:clone(finish()),program:clone(B.designState().program||{})});
 B.pushPlanHistory=()=>{push();const snapshot=B.planHistory.undo.at(-1);if(snapshot)history.set(snapshot,intent());};
 const travel=(fn,from,to)=>{if(B.planHasLocks())return fn();const target=B.planHistory[from].at(-1),stored=target&&history.get(target),current=intent();if(stored){B.state.project.materials.finish=clone(stored.finish);B.designState().program=clone(stored.program);}fn();const latest=B.planHistory[to].at(-1);if(latest)history.set(latest,current);};
 B.undoPlan=()=>travel(undo,'undo','redo');B.redoPlan=()=>travel(redo,'redo','undo');

 // Altar dimensions are provisional, editable and shared by SVG, CAD and GLB.
 B.planFixtures=roomId=>(B.state.project.plan.fixtures||[]).filter(q=>!roomId||q.roomId===roomId);
 const overlap=(a,b,pad=0)=>a.x<b.x+b.w+pad&&a.x+a.w>b.x-pad&&a.y<b.y+b.d+pad&&a.y+a.d>b.y-pad;
 B.fixtureFits=(q,plan=B.state.project.plan)=>{
  const r=plan.rooms.find(r=>r.id===q.roomId),margin=B.measuredWallThickness(false)/2+.025;
  if(!r||q.kind!=='altar'||q.floor!==r.floor||![q.x,q.y,q.w,q.d,q.h].every(Number.isFinite)||q.w<.3||q.d<.2||q.h<.3||q.h>B.projectLevels().clearHeight||q.x<r.x+margin-.001||q.y<r.y+margin-.001||q.x+q.w>r.x+r.w-margin+.001||q.y+q.d>r.y+r.h-margin+.001)return false;
  return !B.withPlan(plan,()=>plan.openings.filter(o=>o.roomId===r.id&&o.kind==='door').some(o=>{const g=B.openingGeometry(o);return g&&overlap(q,{x:g.x-.5,y:g.y-.5,w:1,d:1});}));
 };
 B.altarAtSide=(r,side='north',dims={})=>{
  const vertical=['east','west'].includes(side),w=dims.w??(vertical?.61:1.27),d=dims.d??(vertical?1.27:.61),m=B.measuredWallThickness(false)/2+.04;
  return {id:dims.id||B.uid('altar'),kind:'altar',name:'Bàn thờ · dự trù',roomId:r.id,floor:r.floor,x:side==='west'?r.x+m:side==='east'?r.x+r.w-m-w:r.x+(r.w-w)/2,y:side==='north'?r.y+m:side==='south'?r.y+r.h-m-d:r.y+(r.h-d)/2,w,d,h:dims.h??1.27,side,provisional:true};
 };
 B.createWorshipFixtures=(plan,program)=>{
  const rows=program.floorProgram;if(!rows)return [];const fixtures=[];
  rows.forEach((v,f)=>{if(v.worship==='none')return;const r=plan.rooms.find(r=>r.floor===f&&r.type===(v.worship==='living'?'living':'worship'));if(!r)return;const items=B.withPlan(plan,()=>B.roomFurnitureLayout(r));const score=q=>items.filter(i=>overlap(q,i,.22)).length*10+plan.openings.filter(o=>o.roomId===r.id&&o.side===q.side).length;
   const candidates=[v.altarSide,...sides.map(([s])=>s).filter(s=>s!==v.altarSide)].map(s=>B.altarAtSide(r,s)).filter(q=>B.fixtureFits(q,plan));candidates.sort((a,b)=>score(a)-score(b));if(candidates[0])fixtures.push(candidates[0]);
  });return fixtures;
 };
 B.translatedFixtures=(rooms,source=B.state.project.plan)=>(source.fixtures||[]).flatMap(q=>{const before=source.rooms.find(r=>r.id===q.roomId),after=rooms.find(r=>r.id===q.roomId);return before&&after?[{...q,floor:after.floor,x:q.x+after.x-before.x,y:q.y+after.y-before.y}]:[];});
 const furniture=B.roomFurnitureLayout;B.roomFurnitureLayout=r=>furniture(r).filter(i=>!B.planFixtures(r.id).some(q=>overlap(q,i,.08)));
 const furnitureSvg=B.furnitureSvg;B.furnitureSvg=r=>furnitureSvg(r)+B.planFixtures(r.id).map(q=>'<g class="furniture altar-symbol" data-fixture-reference="'+esc(q.id)+'"><rect x="'+q.x+'" y="'+q.y+'" width="'+q.w+'" height="'+q.d+'" fill="#f0e2c6" stroke="#79624b" stroke-width=".025"/><text x="'+(q.x+q.w/2)+'" y="'+(q.y+q.d/2)+'" font-family="Arial" font-size=".12" text-anchor="middle" fill="#655442">BÀN THỜ</text></g>').join('');
 const schedule=B.architecturalFurnitureSchedule;B.architecturalFurnitureSchedule=(floor=0)=>{const items=schedule(floor);return [...items,...B.planFixtures().filter(q=>q.floor===floor).map((q,i)=>({...q,fixtureId:q.id,model:'altar-parametric',code:'N'+String(items.length+i+1).padStart(2,'0'),room:B.state.project.plan.rooms.find(r=>r.id===q.roomId)?.name||'',base:0,rotation:0}))];};
 const decorate=B.decorateStudioScene;B.decorateStudioScene=options=>{
  decorate(options);const {visibleFloors,roomFocus,floorFocus,W,D,fh,explode,addBox,roomMaterial,mats}=options;
  for(const q of B.planFixtures().filter(q=>visibleFloors.includes(q.floor)&&(!roomFocus||q.roomId===roomFocus.id))){const base=(roomFocus||floorFocus!==null?0:q.floor*(fh+explode))+B.projectLevels().slab,material=roomMaterial('wood',q.roomId,mats.wood||mats.accent);
   const box=(w,h,d,x,y,z)=>{const mesh=addBox(w,h,d,x-W/2,base+y,z-D/2,material);mesh.userData={kind:'altar',fixtureId:q.id,roomId:q.roomId,floor:q.floor,provisional:true};};
   box(q.w,q.h*.12,q.d,q.x+q.w/2,q.h*.94,q.y+q.d/2);box(q.w*.9,q.h*.58,q.d*.86,q.x+q.w/2,q.h*.49,q.y+q.d/2);for(const x of [.08,.92])for(const z of [.1,.9])box(.055,q.h*.25,.055,q.x+q.w*x,q.h*.125,q.y+q.d*z);
  }
 };
 const revision=B.drawingRevision;B.drawingRevision=()=>{let hash=2166136261;const text=JSON.stringify(B.state.project.plan.fixtures||[]);for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return revision()+'-'+(hash>>>0).toString(16).toUpperCase();};
 const geometry=B.measuredGeometryIssues;B.measuredGeometryIssues=()=>[...geometry(),...B.planFixtures().filter(q=>!B.fixtureFits(q)).map(q=>({sev:'error',text:(q.name||'Bàn thờ')+': số đo hoặc vị trí vượt phòng / chắn cửa.'}))];
 const validLayout=B.layoutValid;B.customerBaseLayoutValid=validLayout;
 B.layoutValid=rooms=>{if(!validLayout(rooms))return false;const source=B.drag?.originalPlan||B.state.project.plan,plan={...source,rooms,fixtures:B.translatedFixtures(rooms,source)};return plan.fixtures.every(q=>B.fixtureFits(q,plan));};
 const preview=B.paintRoomDragPreview;if(preview)B.paintRoomDragPreview=rooms=>{if(B.drag)B.state.project.plan.fixtures=B.translatedFixtures(rooms,B.drag.originalPlan);return preview(rooms);};
 B.commitDirectPlan=(plan,selection,{translateFixtures=true}={})=>{
  if(!validLayout(plan.rooms)){B.toast('Phòng chồng nhau hoặc vượt ranh. Giữ thiết kế hiện tại.');return false;}
  if(translateFixtures)plan.fixtures=B.translatedFixtures(plan.rooms,{...B.state.project.plan,fixtures:plan.fixtures||[]});
  if(!(plan.fixtures||[]).every(q=>B.fixtureFits(q,plan))){B.toast('Bàn thờ vượt phòng hoặc chắn cửa. Điều chỉnh kích thước / vị trí trước.');return false;}
  B.pushPlanHistory();B.state.project.plan=plan;if(selection)Object.assign(ui(),selection);update();return true;
 };
 B.removePlanItem=(kind,id)=>{
  const plan=B.planSnapshot(),q=(kind==='opening'?plan.openings:kind==='fixture'?plan.fixtures||[]:plan.rooms).find(x=>x.id===id);if(!q)return false;
  const owner=kind==='room'?q:plan.rooms.find(r=>r.id===q.roomId);if(!owner||B.isRoomLocked(owner.id))return void B.toast('Phòng hoặc tầng đang khóa.');
  if(kind==='opening'&&B.sharedWallNeighbors(plan.rooms,owner,q.side).some(r=>B.isRoomLocked(r.id)))return void B.toast('Phòng phía bên kia tường đang khóa.');
  if(kind==='room'&&q.type==='elevator'&&B.deleteElevatorShaft)return B.deleteElevatorShaft(B.elevatorSpec(q).shaftId);
  if(kind==='room'){plan.rooms=plan.rooms.filter(r=>r.id!==id);plan.openings=plan.openings.filter(o=>o.roomId!==id);plan.fixtures=(plan.fixtures||[]).filter(f=>f.roomId!==id);}
  else if(kind==='opening')plan.openings=plan.openings.filter(o=>o.id!==id);else plan.fixtures=plan.fixtures.filter(f=>f.id!==id);
  return B.commitDirectPlan(plan,{selectedOpening:'',selectedFixture:'',selected:kind==='room'?plan.rooms.find(r=>r.floor===ui().floor)?.id||'':owner.id});
 };
 const rotate=B.rotateSelectedRoom;B.rotateSelectedRoom=()=>{
  const r=B.selectedRoom();if(!r||!B.planFixtures(r.id).length)return rotate();if(B.isRoomLocked(r.id))return void B.toast('Phòng hoặc tầng đang khóa.');
  const plan=B.planSnapshot(),cx=r.x+r.w/2,cy=r.y+r.h/2,turn={north:'east',east:'south',south:'west',west:'north'},next={...r,x:cx-r.h/2,y:cy-r.w/2,w:r.h,h:r.w,furnitureRotation:((r.furnitureRotation||0)+90)%360};plan.rooms=plan.rooms.map(q=>q.id===r.id?next:q);
  plan.fixtures=plan.fixtures.map(q=>q.roomId===r.id?{...q,x:cx+cy-q.y-q.d,y:cy+q.x-cx,w:q.d,d:q.w,side:turn[q.side]}:q);
  for(const o of plan.openings.filter(o=>o.roomId===r.id)){if(B.sharedWallNeighbors(B.state.project.plan.rooms,r,o.side).some(q=>B.isRoomLocked(q.id)))return false;if(['east','west'].includes(o.side))o.offset=1-o.offset;o.side=turn[o.side];}
  if(!B.withPlan(plan,()=>plan.openings.filter(o=>o.roomId===r.id).every(o=>B.openingFits(o)&&!B.sharedWallNeighbors(plan.rooms,next,o.side).some(q=>B.isRoomLocked(q.id))))){B.toast('Ô mở hoặc tường chung không phù hợp sau xoay.');return false;}
  return B.commitDirectPlan(plan,{selected:r.id},{translateFixtures:false});
 };
 B.altarFacing=q=>{const front=B.DIRECTIONS.find(([name])=>name===B.state.project.site.frontDirection);if(!front)return null;const angle=(front[1]+({north:180,east:270,south:0,west:90}[q.side]??0))%360;return B.DIRECTIONS.reduce((a,b)=>Math.abs(((b[1]-angle+540)%360)-180)<Math.abs(((a[1]-angle+540)%360)-180)?b:a)[0];};
 B.worshipReview=()=>B.planFixtures().map(q=>{
  const p=B.state.project,r=p.plan.rooms.find(r=>r.id===q.roomId),facing=B.altarFacing(q),feng=B.fengProfile(),safeWc=!p.plan.rooms.some(b=>b.type==='bath'&&[q.floor,q.floor+1].includes(b.floor)&&overlap(q,{...b,d:b.h},.15));
  const span=['north','south'].includes(q.side)?[q.x,q.x+q.w]:[q.y,q.y+q.d],solid=!p.plan.openings.some(o=>{if(o.roomId!==q.roomId||o.side!==q.side)return false;const w=B.openingWallSpan(o);return w&&w.a<span[1]+.1&&w.b>span[0]-.1;});
  const criteria=[{label:'Nằm trong phòng, không chắn cửa',weight:30,known:true,ok:B.fixtureFits(q)},{label:'Tách WC tại tầng này / tầng phía trên',weight:25,known:true,ok:safeWc},{label:'Không nằm tại WC, thang hay lối đi',weight:10,known:true,ok:!!r&&!['bath','stairs','elevator','corridor'].includes(r.type)},{label:'Lưng dựa tường đặc',weight:10,known:true,ok:solid},{label:'Hướng tham khảo gia đình: '+(facing||'chưa rõ'),weight:25,known:!!facing&&!!feng.owner,ok:!!facing&&feng.dirs.includes(facing)}];
  const available=criteria.filter(c=>c.known).reduce((n,c)=>n+c.weight,0),earned=criteria.filter(c=>c.known&&c.ok).reduce((n,c)=>n+c.weight,0);return {fixtureId:q.id,floor:q.floor,room:r?.name||'',facing,score:available?Math.round(earned/available*100):null,coverage:available,criteria,method:'BMH cultural reference v1; customer controls placement'};
 });
 B.worshipReviewHtml=()=>{const rows=B.worshipReview();if(!rows.length)return '';return '<details class="customer-worship-review" data-guided-panel="worship-review" '+(B.state.ui.guidedPanels?.['worship-review']?'open':'')+'><summary>Góc thờ & phong thủy · '+rows.length+' vị trí</summary><p>Điểm tham khảo văn hóa theo tiêu chí hiển thị dưới đây. Bạn quyết định vị trí; BMH không tự đổi tầng hay hướng bàn thờ.</p>'+rows.map(r=>'<article><b>T'+(r.floor+1)+' · '+esc(r.room)+' · '+r.score+'/100</b><small>Dữ liệu đủ cho '+r.coverage+'% tiêu chí</small><ul>'+r.criteria.map(c=>'<li>'+(c.known?(c.ok?'✓ ':'○ '):'? ')+esc(c.label)+' · '+c.weight+' điểm'+(!c.known?' · thiếu dữ liệu':'')+'</li>').join('')+'</ul></article>').join('')+'</details>';};

 // Direct edits use the SVG's inverse screen matrix, including rotated plans.
 B.directOpeningAt=(kind,roomId,side,point)=>{
  const r=B.state.project.plan.rooms.find(r=>r.id===roomId);if(!r||B.isRoomLocked(roomId)||B.sharedWallNeighbors(B.state.project.plan.rooms,r,side).some(q=>B.isRoomLocked(q.id)))return false;
  const horizontal=['north','south'].includes(side),span=horizontal?r.w:r.h,width=Math.min(kind==='window'?1.4:kind==='passage'?1.2:.9,span-.25),position=horizontal?point.x-r.x:point.y-r.y;
  const o={id:B.uid('o'),roomId,floor:r.floor,kind:kind==='window'?'window':'door',side,offset:B.clamp((position-width/2)/(span-width),0,1),width,height:kind==='window'?Math.min(1.4,B.projectLevels().clearHeight-.9):Math.min(2.2,B.projectLevels().clearHeight),sill:kind==='window'?.9:0,hinge:'left',swing:'in',...(kind==='passage'?{passage:true}:{})};
  if(!B.openingFits(o)||o.height<.3)return void B.toast('Ô mở không vừa cạnh tường hoặc trùng cửa. Chọn vị trí khác.');
  const plan=B.planSnapshot();plan.openings.push(o);return B.commitDirectPlan(plan,{selected:r.id,selectedOpening:o.id,selectedFixture:''})?o:false;
 };
 B.addDirectRoom=(a,b,type=ui().drawRoomType)=>{if(B.isFloorLocked(ui().floor))return false;const snap=n=>B.roundTo(n,ui().snap),x=snap(Math.min(a.x,b.x)),y=snap(Math.min(a.y,b.y)),r={id:B.uid('r'),floor:ui().floor,type,name:roomTypes.find(([k])=>k===type)?.[1]||'Phòng',x,y,w:snap(Math.abs(a.x-b.x)),h:snap(Math.abs(a.y-b.y))};if(r.w<.6||r.h<.6)return false;const plan=B.planSnapshot();plan.rooms.push(r);return B.commitDirectPlan(plan,{selected:r.id,selectedOpening:'',selectedFixture:'',directTool:'select'})?r:false;};
 B.addDirectAltar=(roomId,side)=>{const r=B.state.project.plan.rooms.find(r=>r.id===roomId);if(!r||B.isRoomLocked(r.id))return false;const q=B.altarAtSide(r,side),plan=B.planSnapshot();plan.fixtures||=[];if(plan.fixtures.some(f=>f.roomId===r.id&&overlap(q,f,.08)))return void B.toast('Vị trí đang có bàn thờ. Chọn cạnh khác.');plan.fixtures.push(q);return B.commitDirectPlan(plan,{selected:r.id,selectedOpening:'',selectedFixture:q.id})?q:false;};
 B.directEditHtml=()=>{
  const u=ui(),r=B.selectedRoom(),o=B.state.project.plan.openings.find(o=>o.id===u.selectedOpening),q=B.planFixtures().find(q=>q.id===u.selectedFixture),kind=o?'opening':q?'fixture':'',item=o||q;
  const input=(key,label,value,min=.01,max='')=>'<label>'+label+'<input type="number" data-direct-field="'+key+'" value="'+value+'" min="'+min+'" '+(max!==''?'max="'+max+'"':'')+' step=".01"></label>';
  const tools=[['select','Chọn / kéo / chỉnh'],['room','Vẽ phòng / lối đi'],['door','Thêm cửa đi'],['window','Thêm cửa sổ'],['passage','Thêm lối mở không cánh'],['altar','Thêm bàn thờ'],['erase','Xóa trực tiếp']];
  return '<section class="customer-direct-editor"><div class="customer-direct-tools"><label>Thao tác trên bản vẽ<select data-direct-tool>'+tools.map(([k,n])=>'<option value="'+k+'" '+(u.directTool===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'+(u.directTool==='room'?'<label>Không gian cần vẽ<select data-direct-draw-type>'+roomTypes.map(([k,n])=>'<option value="'+k+'" '+(u.drawRoomType===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>':'')+'</div><p>'+(u.directTool==='room'?'Kéo một hình chữ nhật hoặc chạm hai góc trong vùng trống. Esc để hủy.':u.directTool==='select'?'Chọn cửa, cửa sổ hoặc bàn thờ ngay trên bản vẽ để sửa. Kéo phòng để di chuyển.':u.directTool==='erase'?'Chạm đối tượng cần xóa. Có thể hoàn tác.':'Chạm vị trí trong phòng; BMH lấy cạnh tường gần nhất.')+'</p>'+(item?'<div class="customer-direct-inspector" data-direct-kind="'+kind+'" data-direct-id="'+esc(item.id)+'"><b>'+esc(o?(o.passage?'Lối mở':o.kind==='window'?'Cửa sổ':'Cửa đi'):q.name)+'</b><div>'+ (o?input('width','Rộng / m',o.width,.5)+input('height','Cao / m',o.height??(o.kind==='door'?2.1:1.4),.3,B.projectLevels().clearHeight)+input('sill','Bậu / m',o.kind==='door'?0:o.sill??.9,0)+input('offset','Vị trí cạnh · 0–1',o.offset??.5,0,1):input('x','X / m',q.x,0)+input('y','Y / m',q.y,0)+input('w','Rộng theo X / m',q.w,.3)+input('d','Sâu theo Y / m',q.d,.2)+input('h','Cao / m',q.h,.3,B.projectLevels().clearHeight)+'<label>Lưng bàn thờ<select data-altar-side>'+sides.map(([k,n])=>'<option value="'+k+'" '+(q.side===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>')+'</div><button data-direct-delete>Xóa '+(o?'ô mở':'bàn thờ')+'</button>'+(q?'<small>Kích thước dự trù, chưa phải mẫu bàn thờ của hãng.</small>':'')+'</div>':r&&roomTypes.some(([k])=>k===r.type)?'<label class="customer-room-function">Công năng '+esc(r.name)+'<select data-direct-room-type>'+roomTypes.map(([k,n])=>'<option value="'+k+'" '+(r.type===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>':'')+'</section>';
 };
 const planSvg=B.planSvg;B.planSvg=options=>{
  const markup=planSvg(options);if(options?.interactive===false||typeof DOMParser==='undefined')return markup;
  const doc=new DOMParser().parseFromString(markup,'image/svg+xml'),root=doc.documentElement,target=root.querySelector('#planDrawing')||root,ns='http://www.w3.org/2000/svg',f=options?.floor??ui().floor;
  const element=(tag,attrs)=>{const el=doc.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,String(value));return el;};
  for(const o of B.state.project.plan.openings.filter(o=>o.floor===f)){const span=B.openingWallSpan(o);if(!span)continue;const h=span.o==='h';target.append(element('line',{'data-plan-opening':o.id,class:'direct-opening-hit'+(o.id===ui().selectedOpening?' is-selected':''),x1:h?span.a:span.c,y1:h?span.c:span.a,x2:h?span.b:span.c,y2:h?span.c:span.b,tabindex:0,role:'button','aria-label':(o.passage?'Lối mở':o.kind==='window'?'Cửa sổ':'Cửa đi')+' '+B.openingCode(o)}));}
  for(const q of B.planFixtures().filter(q=>q.floor===f))target.append(element('rect',{'data-plan-fixture':q.id,class:'direct-fixture-hit'+(q.id===ui().selectedFixture?' is-selected':''),x:q.x,y:q.y,width:q.w,height:q.d,tabindex:0,role:'button','aria-label':q.name}));
  return new XMLSerializer().serializeToString(root);
 };
 const normalize=B.normalizeState;B.normalizeState=()=>{normalize();const u=ui();if(!['select','room','door','window','passage','altar','erase'].includes(u.directTool))u.directTool='select';if(!roomTypes.some(([k])=>k===u.drawRoomType))u.drawRoomType='bed';const p=B.state.project.plan;p.fixtures=(p.fixtures||[]).filter(q=>q&&q.kind==='altar'&&p.rooms.some(r=>r.id===q.roomId)&&[q.x,q.y,q.w,q.d,q.h].every(Number.isFinite));if(!p.openings.some(o=>o.id===u.selectedOpening))u.selectedOpening='';if(!p.fixtures.some(q=>q.id===u.selectedFixture))u.selectedFixture='';B.state.ui.guidedPanels||={};for(const key of ['style-output','worship-review'])if(typeof B.state.ui.guidedPanels[key]!=='boolean')B.state.ui.guidedPanels[key]=false;};
 B.normalizeState();
 const snapshot=B.customerDesignSnapshot;B.customerDesignSnapshot=()=>{const result=snapshot();result.project.fixtures=B.planFixtures().map(q=>Object.fromEntries(['id','kind','name','roomId','floor','x','y','w','d','h','side','provisional'].filter(k=>q[k]!==undefined).map(k=>[k,clone(q[k])])));result.project.designIntent={style:B.styleOutputReview(),floorProgram:B.requestedFloorProgram(),worship:B.worshipReview()};return result;};
 const files=B.customerPackageFiles;B.customerPackageFiles=(s,...args)=>[...files(s,...args),['phong-cach-vat-lieu-cong-nang.json',JSON.stringify(s.project.designIntent,null,2)]];
 for(const [name,index]of [['screen1',0],['screen5',3],['screen7',5],['screen10',9]]){const screen=B[name];B[name]=()=>{const content=screen();return name==='screen1'?content+B.styleOutputHtml():B.styleOutputHtml()+(name==='screen5'&&ui().view==='plan'?B.directEditHtml()+B.worshipReviewHtml():'')+content;};B.SCREENS[index]=B[name];}
 const family=B.screen4;B.screen4=()=>family()+'<section class="customer-family-program"><b>Chọn công năng theo từng tầng</b><p>Phòng ngủ, WC và không gian thờ ở tầng bạn muốn.</p><button data-customer-program-open>Mở công năng từng tầng →</button></section>';B.SCREENS[2]=B.screen4;

 document.addEventListener('change',e=>{
  const t=e.target;if(t.matches?.('[data-floor-program]')){const rows=B.ensureFloorProgram(),f=B.clamp(Number(B.state.ui.programFloor)||0,0,rows.length-1),key=t.dataset.floorProgram;rows[f][key]=t.type==='checkbox'?t.checked:['bedrooms','bathrooms'].includes(key)?Number(t.value):t.value;B.designState().program.floors=rows;B.designState().programNotice='';update();return;}
  if(t.matches?.('[data-kit-floor]')){B.state.ui.proposalFloor=Number(t.value);update();return;}
  if(t.matches?.('[data-customer-style]')){if(B.selectHouseStyle(t.value))update();return;}
  if(t.matches?.('[data-direct-tool]')){cancelDraw();Object.assign(ui(),{directTool:t.value,tool:'select',selectedOpening:'',selectedFixture:''});update();return;}
  if(t.matches?.('[data-direct-draw-type]')){ui().drawRoomType=t.value;B.save();return;}
  if(t.matches?.('[data-direct-room-type]')){const r=B.selectedRoom();if(!r||B.isRoomLocked(r.id))return;const p=B.planSnapshot();p.rooms.find(q=>q.id===r.id).type=t.value;B.commitDirectPlan(p,{selected:r.id});return;}
  if(t.matches?.('[data-direct-field],[data-altar-side]')){const box=t.closest('[data-direct-kind]'),kind=box?.dataset.directKind,id=box?.dataset.directId,plan=B.planSnapshot(),item=(kind==='opening'?plan.openings:plan.fixtures).find(q=>q.id===id),room=item&&plan.rooms.find(r=>r.id===item.roomId);if(!item||!room||B.isRoomLocked(room.id))return;
   if(kind==='opening'&&B.sharedWallNeighbors(plan.rooms,room,item.side).some(r=>B.isRoomLocked(r.id)))return void B.toast('Phòng bên kia tường đang khóa.');
   if(t.matches('[data-altar-side]'))Object.assign(item,B.altarAtSide(room,t.value,{id:item.id,h:item.h,w:['east','west'].includes(item.side)!==['east','west'].includes(t.value)?item.d:item.w,d:['east','west'].includes(item.side)!==['east','west'].includes(t.value)?item.w:item.d}));
   else{const value=Number(t.value);if(t.value===''||!Number.isFinite(value))return;item[t.dataset.directField]=value;}
   if(kind==='opening'){item.height??=item.kind==='door'?2.1:1.4;item.sill=item.kind==='door'?0:item.sill??.9;if(!B.withPlan(plan,()=>B.openingFits(item))||item.height<.3||item.sill<0||item.height+item.sill>B.projectLevels().clearHeight){B.toast('Ô mở không vừa tường hoặc vượt trần.');B.render({preserveScroll:true});return;}}
   B.commitDirectPlan(plan,{selectedOpening:kind==='opening'?id:'',selectedFixture:kind==='fixture'?id:''});
  }
 });
 // Intercept legacy room coordinate inputs to move owned fixtures atomically.
 document.addEventListener('change',e=>{const t=e.target,key=t.dataset?.roomField,r=B.selectedRoom();if(!['x','y','w','h'].includes(key)||!r||r.type==='elevator')return;e.stopImmediatePropagation();if(B.isRoomLocked(r.id))return;const plan=B.planSnapshot(),value=Number(t.value);if(t.value===''||!Number.isFinite(value))return;plan.rooms.find(q=>q.id===r.id)[key]=B.roundTo(value,ui().snap);B.commitDirectPlan(plan,{selected:r.id});},true);
 document.addEventListener('click',e=>{
  const t=e.target.closest?.('[data-program-floor],[data-return-style],[data-direct-delete],[data-customer-program-open]');if(!t)return;
  if(t.hasAttribute('data-program-floor')){B.state.ui.programFloor=Number(t.dataset.programFloor);update();}
  if(t.hasAttribute('data-return-style'))B.returnInteriorToStyle();
  if(t.hasAttribute('data-direct-delete')){const box=t.closest('[data-direct-kind]');B.removePlanItem(box.dataset.directKind,box.dataset.directId);}
  if(t.hasAttribute('data-customer-program-open')){B.designState().programOpen=true;B.state.ui.designProposalsOpen=true;B.navigateTo(4);}
 });
 let drawing=null,anchor=null,ignoreClickUntil=0;
 const cancelDraw=()=>{drawing=null;anchor=null;document.querySelectorAll('.direct-room-preview,.direct-room-anchor').forEach(e=>e.remove());};
 const point=e=>{const svg=B.$('#plannerSvg');return svg?B.svgPoint(e,svg):null;};
 const drawPreview=b=>{const svg=B.$('#plannerSvg'),target=svg?.querySelector('#planDrawing')||svg;if(!target||!anchor)return;target.querySelector('.direct-room-preview')?.remove();const r=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [k,v]of Object.entries({x:Math.min(anchor.x,b.x),y:Math.min(anchor.y,b.y),width:Math.abs(b.x-anchor.x),height:Math.abs(b.y-anchor.y),class:'direct-room-preview'}))r.setAttribute(k,v);target.append(r);};
 const selectItem=(kind,id)=>{const q=(kind==='opening'?B.state.project.plan.openings:B.planFixtures()).find(q=>q.id===id);if(!q)return;Object.assign(ui(),{selected:q.roomId,selectedOpening:kind==='opening'?id:'',selectedFixture:kind==='fixture'?id:''});update();};
 document.addEventListener('pointerdown',e=>{
  if(B.state.ui.step!==4||ui().view!=='plan'||!e.target.closest?.('#plannerSvg')||ui().tool!=='select'||e.button>0)return;const tool=ui().directTool,hit=e.target.closest('[data-plan-opening],[data-plan-fixture]'),kind=hit?.hasAttribute('data-plan-opening')?'opening':'fixture',id=hit?.dataset.planOpening||hit?.dataset.planFixture;
  if(tool==='select'){if(hit){e.preventDefault();e.stopImmediatePropagation();selectItem(kind,id);}else{ui().selectedOpening='';ui().selectedFixture='';}return;}
  e.preventDefault();e.stopImmediatePropagation();const at=point(e);if(!at)return;
  if(tool==='erase'){if(hit)B.removePlanItem(kind,id);else{const room=e.target.closest('[data-room-id]');if(room)B.removePlanItem('room',room.dataset.roomId);}return;}
  if(tool==='room'){if(B.isFloorLocked(ui().floor))return;drawing={start:at,pointerId:e.pointerId,second:!!anchor};if(!anchor){anchor=at;const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('cx',at.x);dot.setAttribute('cy',at.y);dot.setAttribute('r','.07');dot.setAttribute('class','direct-room-anchor');(B.$('#plannerSvg #planDrawing')||B.$('#plannerSvg')).append(dot);}return;}
  const rooms=B.floorRooms().filter(r=>at.x>=r.x-.2&&at.x<=r.x+r.w+.2&&at.y>=r.y-.2&&at.y<=r.y+r.h+.2),r=rooms.find(r=>r.id===ui().selected)||rooms[0];if(!r)return;const side=[['north',Math.abs(at.y-r.y)],['south',Math.abs(at.y-r.y-r.h)],['west',Math.abs(at.x-r.x)],['east',Math.abs(at.x-r.x-r.w)]].sort((a,b)=>a[1]-b[1])[0][0];
  if(tool==='altar')B.addDirectAltar(r.id,side);else B.directOpeningAt(tool,r.id,side,at);ignoreClickUntil=Date.now()+500;
 },true);
 document.addEventListener('click',e=>{if(e.target.closest?.('#plannerSvg')&&(ui().directTool!=='select'||Date.now()<ignoreClickUntil)){e.preventDefault();e.stopImmediatePropagation();}},true);
 window.addEventListener('pointermove',e=>{if(!drawing||e.pointerId!==drawing.pointerId)return;const p=point(e);if(p)drawPreview(p);},{passive:true});
 window.addEventListener('pointerup',e=>{if(!drawing||e.pointerId!==drawing.pointerId)return;const p=point(e),drag=p&&Math.hypot(p.x-drawing.start.x,p.y-drawing.start.y)>.2;if(p&&(drawing.second||drag)){const a=anchor;cancelDraw();B.addDirectRoom(a,p);}drawing=null;},true);
 window.addEventListener('pointercancel',cancelDraw);
 document.addEventListener('keydown',e=>{
  if(B.state.ui.step!==4||e.target.closest?.('input,select,textarea,[contenteditable]'))return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();cancelDraw();ui().directTool='select';ui().tool='select';update();}
  if(['Delete','Backspace'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();const u=ui();if(u.selectedOpening)B.removePlanItem('opening',u.selectedOpening);else if(u.selectedFixture)B.removePlanItem('fixture',u.selectedFixture);else if(u.selected)B.removePlanItem('room',u.selected);}
  if(['Enter',' '].includes(e.key)&&e.target.matches?.('[data-plan-opening],[data-plan-fixture]')){e.preventDefault();selectItem(e.target.hasAttribute('data-plan-opening')?'opening':'fixture',e.target.dataset.planOpening||e.target.dataset.planFixture);}
 },true);
})();
