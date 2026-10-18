/* Customer intent stays attached to the measured model. Metres internally.
 * Style families and procedural finishes are previews, not vendor replicas. */
(()=>{
 const B=BMH,esc=B.esc,clone=structuredClone;
 const finished=r=>!['stairs','elevator','balcony'].includes(r.type);
 const surfaceRoles=[['floor','Sàn'],['wall','Tường'],['accent','Gỗ / tủ'],['fabric','Vải']];
 const roomTypes=[['living','Phòng khách'],['kitchen','Bếp + ăn'],['bed','Phòng ngủ'],['bath','WC'],['corridor','Hành lang / lối đi'],['worship','Phòng thờ'],['office','Phòng làm việc'],['laundry','Phòng giặt'],['storage','Kho'],['gym','Phòng tập'],['hobby','Phòng sở thích'],['custom','Phòng tự đặt tên'],['utility','Kỹ thuật'],['balcony','Ban công']];
 B.CUSTOMER_ROOM_TYPES=roomTypes;
 B.EXTRA_ROOM_TYPES=roomTypes.filter(([k])=>['laundry','worship','storage','office','gym','hobby','custom'].includes(k));
 const sides=[['north','Đầu đất'],['east','Bên phải'],['south','Cuối đất'],['west','Bên trái']];
 const ui=()=>B.state.ui.planner;
 const finish=()=>B.state.project.materials.finish||=( {exterior:null,rooms:{}} );
 const update=()=>{B.finishInvalidate?.();B.customerFrameCache=null;B.save();B.render({preserveScroll:true});};
 B.customerStyleProfile=()=>{const style=B.houseStyle(),spec=B.styleSpecification(style?.id),id=spec?.collectionId||'warm-oak';return {style,specification:spec,recognized:!!style,name:B.state.project.style,collection:B.INTERIOR_COLLECTIONS.find(c=>c.id===id)||B.INTERIOR_COLLECTIONS[0]};};
 B.interiorCollection=roomId=>{
  const f=finish(),v=f.interior||{},profile=B.customerStyleProfile(),stored=roomId?v.rooms?.[roomId]||v.default:v.default;
  const authored=roomId&&v.rooms?.[roomId]?v.authored?.[roomId]:v.authored?.default;
  const allowed=stored!=='style'&&(authored==='manual'||authored===B.state.project.style||!authored&&stored===profile.collection.id);
  return allowed&&B.INTERIOR_COLLECTIONS.find(c=>c.id===stored)||profile.collection;
 };
 B.styleDefaultPalette=roomId=>{
  const profile=B.customerStyleProfile(),c=B.interiorCollection(roomId),v=finish().interior||{},authored=roomId&&v.rooms?.[roomId]?v.authored?.[roomId]:v.authored?.default;
  const followsStyle=!!profile.specification&&c.id===profile.collection.id&&authored!=='manual',room=B.state.project.plan.rooms.find(r=>r.id===roomId),wetRoom=room?.type==='bath',outdoorRoom=room?.type==='balcony'||room?.outdoorSpace?.kind==='terrace';
  if(!followsStyle&&!wetRoom&&!outdoorRoom)return null;
  const defaults={...c,visualMaterials:{...c.visualMaterials,...(followsStyle?profile.specification.defaultMaterials:{})}};
  // Automatic finishes separate bathroom and outdoor floor proposals. An
  // explicitly authored room floor still overrides this default below.
  if(wetRoom)defaults.visualMaterials.floor='sand-travertine';
  else if(outdoorRoom)defaults.visualMaterials.floor='grey-concrete';
  for(const [role,id]of Object.entries(defaults.visualMaterials)){const material=B.VISUAL_MATERIALS.find(x=>x.id===id&&x.role===role);if(material){defaults[role]=material.color;if(role==='floor')defaults.surface=material.surface;}}
  return defaults;
 };
 B.finishPalette=roomId=>{
  const f=finish(),c=B.interiorCollection(roomId),global=B.roomGlobalFinish?.(f.exterior||{},roomId)||f.exterior||{},room=roomId?f.rooms?.[roomId]||{}:{},r=B.state.project.plan.rooms.find(r=>r.id===roomId);
  const defaults=B.styleDefaultPalette(roomId)||c;
  // Finish writers cache a resolved palette. Only authored roles in that cache
  // override the next style; preserve pre-marker legacy choices conservatively.
  const authoredRow=raw=>{const row={...raw,visualMaterials:{...raw.visualMaterials}};for(const [role]of surfaceRoles)if(raw.styleRoles?.[role]===true||raw.explicitRoles&&raw.explicitRoles[role]!==true){delete row[role];delete row.visualMaterials[role];if(role==='floor')delete row.surface;}return row;};
  const outside=authoredRow(global),inside=authoredRow(room);
  const p={...defaults,...outside,...inside,visualMaterials:{...defaults.visualMaterials,...outside.visualMaterials,...inside.visualMaterials},collectionId:c.id,shape:c.shape,table:c.table};
  const surface=inside.surface??outside.surface;
  if(surface&&surface!=='auto'&&!inside.visualMaterials?.floor&&!outside.visualMaterials?.floor)p.visualMaterials.floor={wood:'oak-floor',tile:'ivory-tile',stone:'sand-travertine'}[surface]||p.visualMaterials.floor;
  if(r?.type==='bath'&&!inside.visualMaterials?.floor&&!outside.visualMaterials?.floor&&surface===undefined){p.visualMaterials.floor='sand-travertine';p.floor='#cfc0a0';}
  const material=B.VISUAL_MATERIALS.find(v=>v.role==='floor'&&v.id===p.visualMaterials.floor);if(material)p.surface=material.surface;
  return B.validatePaletteBindings?.(roomId,p)||p;
 };
 const applyCollection=B.applyInteriorCollection;
 B.applyInteriorCollection=(id,roomId=null)=>{
  const result=applyCollection(id,roomId);if(!result)return result;const f=finish(),v=f.interior;v.authored||={};
  for(const r of B.state.project.plan.rooms.filter(r=>roomId?r.id===roomId:finished(r))){
   v.authored[r.id]=roomId?'manual':B.state.project.style;
   // Whole-house collections follow the style, while per-room mixes and any
   // subsequently edited surface remain explicit customer choices.
   if(!roomId)for(const [role]of surfaceRoles)f.rooms[r.id].styleRoles[role]=true;
  }
  if(!roomId){v.authored.default=B.state.project.style;for(const [role]of surfaceRoles)f.exterior.styleRoles[role]=true;}
  B.save();return result;
 };
 B.returnInteriorToStyle=roomId=>{B.pushPlanHistory();const f=finish();f.interior||={rooms:{}};f.interior.rooms||={};if(roomId){f.interior.rooms[roomId]='style';if(f.interior.authored)delete f.interior.authored[roomId];}else f.interior={default:'',rooms:{},authored:{}};update();};
 B.styleOutputReview=()=>{
  const p=B.state.project,profile=B.customerStyleProfile();return {style:p.style,styleId:profile.style?.id||null,recognized:profile.recognized,expectedCollection:{id:profile.collection.id,name:profile.collection.name},textureBasis:'Procedural preview at metre scale; vendor texture and sample required for exact SKU.',rooms:p.plan.rooms.filter(finished).map(r=>{const palette=B.finishPalette(r.id),c=B.interiorCollection(r.id);return {roomId:r.id,name:r.name,floor:r.floor,collection:{id:c.id,name:c.name,shape:c.shape,table:c.table},styleAligned:profile.recognized&&c.id===profile.collection.id,surfaces:surfaceRoles.map(([role])=>{const v=B.VISUAL_MATERIALS.find(v=>v.id===palette.visualMaterials?.[role]&&v.role===role);return {role,id:v?.id||null,name:v?.name||'Chưa chọn',color:palette[role],scale:v?.scale?clone(v.scale):null};}),supplierSurfaces:B.showroomFinishInfo?.(r.id)||[]};})};
 };
 B.styleOutputHtml=()=>{
  const r=B.styleOutputReview(),mixed=r.rooms.filter(x=>!x.styleAligned),open=B.state.ui.guidedPanels?.['style-output'];
  return '<details class="customer-style-output" data-guided-panel="style-output" '+(open?'open':'')+'><summary><span><b>'+esc(r.style)+'</b><small>'+(r.recognized?(mixed.length?mixed.length+' phòng phối riêng':'Phong cách đang dùng cho hình khối / nội thất'):'Cần ảnh và mô tả để xác nhận phong cách riêng')+'</small></span><span>Phong cách & vật liệu</span></summary><div class="customer-style-body"><label>Phong cách ngôi nhà<select data-customer-style>'+(!r.recognized?'<option value="" selected>'+esc(r.style)+'</option>':'')+B.HOUSE_STYLES.map(s=>'<option value="'+s.id+'" '+(s.id===r.styleId?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></label><p>Hình dáng nội thất dùng bộ '+esc(r.expectedCollection.name)+'. Màu, vật liệu và mã hàng đã chọn được giữ khi đổi bố trí.</p>'+(mixed.length?'<button type="button" data-return-style>Đưa hình dáng các phòng về phong cách này</button>':'')+'<div class="customer-style-rooms">'+r.rooms.map(x=>'<article><b>T'+(x.floor+1)+' · '+esc(x.name)+'</b><small>'+esc(x.collection.name)+(x.styleAligned?'':' · phối riêng')+'</small>'+x.surfaces.map(v=>'<p><i style="background:'+esc(v.color||'#eee')+'"></i>'+esc(surfaceRoles.find(([k])=>k===v.role)[1])+': '+esc(v.name)+'</p>').join('')+x.supplierSurfaces.map(v=>'<small>'+esc([v.name,v.sku].filter(Boolean).join(' · '))+(v.sampleStatus==='sample-unavailable'?' · ảnh mẫu chưa có trên thiết bị':v.exactness==='customer-sample'?' · ảnh mẫu khách cung cấp':' · bề mặt mô phỏng')+'</small>').join('')+'</article>').join('')+'</div><small>Vân mô phỏng có tỷ lệ mét. Muốn khớp tuyệt đối một SKU cần ảnh/texture, kích thước và mẫu thực tế của hãng. Phong cách dùng thư viện hình khối BMH; ảnh tham chiếu riêng cần được đối chiếu thêm.</small></div></details>';
 };
 const refresh=B.refreshStudioFinishes;B.refreshStudioFinishes=(...args)=>{const ok=refresh(...args);if(ok)for(const old of document.querySelectorAll('.customer-style-output')){const t=document.createElement('template');t.innerHTML=B.styleOutputHtml();old.replaceWith(t.content.firstElementChild);}return ok;};

 // Explicit floor intent. Invalid imported counts remain visible until corrected.
 const floorRow=v=>({bedrooms:Number(v?.bedrooms??0),bathrooms:Number(v?.bathrooms??0),living:!!v?.living,kitchen:!!v?.kitchen,office:!!v?.office,garage:!!v?.garage,worship:['none','room','living'].includes(v?.worship)?v.worship:'none',altarSide:sides.some(([k])=>k===v?.altarSide)?v.altarSide:'north',extraRooms:Array.isArray(v?.extraRooms)?v.extraRooms.map((r,i)=>({id:String(r.id||'extra-'+i),type:B.EXTRA_ROOM_TYPES.some(([k])=>k===r.type)?r.type:'custom',name:String(r.name||'').trim().slice(0,60),count:Number(r.count??1),minArea:Number(r.minArea??4),width:r.width===null||r.width===undefined||r.width===''?null:Number(r.width),depth:r.depth===null||r.depth===undefined||r.depth===''?null:Number(r.depth)})):[]});
 B.requestedFloorProgram=()=>{const rows=B.designState().program?.floors;return Array.isArray(rows)&&rows.length===Number(B.state.project.site.floors)?rows.map(floorRow):null;};
 B.floorProgramError=rows=>{for(const [f,r]of rows.entries()){if(!['bedrooms','bathrooms'].every(k=>Number.isInteger(r[k])&&r[k]>=0&&r[k]<=20))return 'Tầng '+(f+1)+': nhập số phòng nguyên từ 0 đến 20.';if(r.garage&&f!==0)return 'Gara tự bố trí chỉ áp dụng ở tầng trệt.';if(r.worship==='living'&&!r.living)return 'Tầng '+(f+1)+': chọn phòng khách để đặt góc thờ tại phòng khách.';if((r.extraRooms||[]).length>20)return 'Tầng '+(f+1)+': tối đa 20 nhóm phòng thêm.';for(const x of r.extraRooms||[]){if(!x.name||!Number.isInteger(x.count)||x.count<1||x.count>20||!Number.isFinite(x.minArea)||x.minArea<2||x.minArea>200)return 'Tầng '+(f+1)+': phòng thêm cần tên, số lượng 1–20 và diện tích tối thiểu 2–200 m².';if((x.width!==null||x.depth!==null)&&(![x.width,x.depth].every(v=>Number.isFinite(v)&&v>=.6&&v<=50)))return 'Tầng '+(f+1)+': nhập cả chiều rộng và chiều dài từ 0,60 đến 50 m, hoặc để trống cả hai.';if(x.width!==null&&x.width*x.depth<x.minArea-1e-9)return 'Tầng '+(f+1)+': kích thước '+x.name+' nhỏ hơn diện tích tối thiểu đã yêu cầu.';}}return '';};
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
  return '<section class="design-program customer-program"><span class="studio-eyebrow">CÔNG NĂNG TỪNG TẦNG</span><h2>Bạn chọn phòng ở tầng nào.</h2><p>'+esc(p.style)+' · '+rows.length+' tầng · khung '+e.buildWidth.toFixed(2)+' × '+e.buildDepth.toFixed(2)+' m</p><div class="customer-floor-rail">'+rows.map((r,i)=>'<button type="button" data-program-floor="'+i+'" aria-pressed="'+(f===i)+'"><b>Tầng '+(i+1)+'</b><small>'+r.bedrooms+' PN · '+r.bathrooms+' WC'+(r.worship!=='none'?' · có thờ':'')+'</small></button>').join('')+'</div><div class="customer-program-fields"><h3>Tầng '+(f+1)+'</h3><div class="customer-counts">'+count('bedrooms','Phòng ngủ')+count('bathrooms','WC')+'</div><div class="customer-program-flags">'+flag('living','Phòng khách')+flag('kitchen','Bếp + ăn')+flag('office','Phòng làm việc')+(f===0?flag('garage','Gara ô tô'):'')+'</div><label>Không gian thờ<select data-floor-program="worship">'+[['none','Không đặt tại tầng này'],['room','Phòng thờ riêng'],['living','Góc thờ trong phòng khách']].map(([k,n])=>'<option value="'+k+'" '+(v.worship===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'+(v.worship!=='none'?'<label>Ưu tiên lưng bàn thờ<select data-floor-program="altarSide">'+sides.map(([k,n])=>'<option value="'+k+'" '+(v.altarSide===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>':'')+'</div><details><summary>Thang máy, sân vườn & bể cá</summary><div class="customer-program-flags">'+[['elevator','Thang máy'],['garden','Sân vườn'],['pond','Bể cá']].map(([key,name])=>'<label><input type="checkbox" data-program-option="'+key+'" '+(s.program?.[key]?'checked':'')+'>'+name+'</label>').join('')+'</div></details><p>Không ép phòng thờ lên một tầng cố định. Bàn thờ dự trù có số đo để bạn chỉnh; điểm phong thủy chỉ để tham khảo.</p>'+(s.programNotice?'<p class="design-notice" role="status">'+esc(s.programNotice)+'</p>':'')+'<div class="program-actions"><button data-program-create>Tạo bố trí theo từng tầng</button><button type="button" data-personal-plan>Tự bố trí trên bản vẽ</button><button data-program-skip>Gợi ý theo hồ sơ gia đình</button></div><p>Gợi ý tự động chỉ là một lựa chọn. Tự bố trí giữ nguyên bản vẽ hiện có; bạn có thể xóa hoặc vẽ từng phòng trên đất trống.</p></section>';
 };
 B.designKitsHtml=()=>{
  const s=B.designState();if(s.programOpen??!s.kits.length)return B.programChooserHtml();const f=B.clamp(Number(B.state.ui.proposalFloor)||0,0,Number(B.state.project.site.floors)-1),stale=s.inputSignature!==B.designInputKey();
  return '<section class="design-proposals"><button data-program-open>← Chỉnh công năng từng tầng</button><div class="design-section-head"><div><span>PHƯƠNG ÁN BỐ TRÍ</span><h2>Cùng phong cách. Khác cách chia phòng.</h2><p>Giữ phong cách & vật liệu của bạn. Xem tất cả tầng trước khi chọn.</p></div><label>Xem tầng<select data-kit-floor>'+Array.from({length:Number(B.state.project.site.floors)},(_,i)=>'<option value="'+i+'" '+(i===f?'selected':'')+'>Tầng '+(i+1)+'</option>').join('')+'</select></label></div><div class="design-kit-grid">'+s.kits.map(k=>'<article class="design-kit"><div class="design-kit-plan">'+B.designPlanPreview(k.plan,f)+'<span>MẶT BẰNG TẦNG '+(f+1)+'</span></div><div class="design-kit-content"><span>PHƯƠNG ÁN '+k.id+'</span><h3>'+esc(k.name)+'</h3><p>'+esc(B.state.project.style)+'</p><p>'+k.plan.rooms.filter(r=>r.type==='bed').length+' phòng ngủ · '+k.plan.rooms.filter(r=>r.type==='bath').length+' WC · '+B.num(k.metrics.area,1)+' m²</p><button data-design-kit="'+k.id+'" '+(stale?'disabled':'')+'>Chọn bố trí '+k.id+' →</button></div></article>').join('')+'</div>'+(stale?'<p class="design-notice">Đầu vào đã đổi. Tạo lại bố trí để khớp yêu cầu.</p><button data-design-generate>Tạo lại phương án</button>':'')+'</section>';
 };
 const generate=B.generateDesignKits;B.generateDesignKits=()=>{const ok=generate();if(ok){const palette=B.finishPalette();for(const kit of B.designState().kits)Object.assign(kit,...surfaceRoles.map(([role])=>({[role]:palette[role]})),{subtitle:'Giữ phong cách & vật liệu của bạn'});B.save();}return ok;};
 // Opening personal editing changes only UI, never regenerates/clears a plan.
 B.openPersonalPlanner=()=>{
  cancelDraw();const s=B.designState(),u=ui();
  B.state.ui.designProposalsOpen=false;Object.assign(u,{floor:B.clamp(Number(u.floor)||0,0,Number(B.state.project.site.floors)-1),view:'plan',tool:'select',directTool:'room',selectedOpening:'',selectedFixture:''});
  s.notice='Tự bố trí: vẽ hai góc hoặc nhập số đo phòng. Đất trống được giữ nguyên; không cần chọn phương án gợi ý.';
  B.navigateTo(4);B.save();return true;
 };
 B.personalRoomFormHtml=()=>{
  const e=B.buildableEnvelope(),margin=B.measuredWallThickness(false)/2+.01,x=(e.originX??e.side??0)+margin,y=(e.originY??e.front??0)+margin;
  return '<details class="customer-room-numeric" open><summary>Vẽ phòng bằng số đo</summary><form data-direct-room-form>'+[['x','Vị trí X / m',x,0],['y','Vị trí Y / m',y,0],['width','Rộng / m',3,.6],['depth','Dài / m',4,.6]].map(([key,label,value,min])=>'<label>'+label+'<input name="'+key+'" type="number" step="any" min="'+min+'" value="'+Number(value.toFixed(3))+'" required></label>').join('')+'<button type="submit">Thêm phòng theo số đo</button></form><small>X / Y tính từ góc đầu khu đất. Phòng phải trong ranh và khoảng lùi đã nhập, không chồng phòng khác.</small></details>';
 };
 document.addEventListener('submit',e=>{if(!e.target.matches?.('[data-direct-room-form]'))return;e.preventDefault();const d=new FormData(e.target),x=Number(d.get('x')),y=Number(d.get('y')),w=Number(d.get('width')),h=Number(d.get('depth'));if(![x,y,w,h].every(Number.isFinite)||w<.6||h<.6){directReject('Nhập vị trí và số đo hợp lệ; chiều rộng / dài tối thiểu 0,60 m.');return;}if(!B.addDirectRoom({x,y},{x:x+w,y:y+h},ui().drawRoomType,{snap:false,dimensions:{width:w,depth:h}}))B.render({preserveScroll:true});});
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
  if(!r||q.kind!=='altar'||q.floor!==r.floor||![q.x,q.y,q.w,q.d,q.h].every(Number.isFinite)||q.w<.3||q.d<.2||q.h<.3||q.h>B.floorLevel(q.floor).clearHeight||q.x<r.x+margin-.001||q.y<r.y+margin-.001||q.x+q.w>r.x+r.w-margin+.001||q.y+q.d>r.y+r.h-margin+.001)return false;
  if((plan.fixtures||[]).some(other=>other.id!==q.id&&other.floor===q.floor&&overlap(q,other,.02)))return false;
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
 B.translatedFixtures=(rooms,source=B.state.project.plan)=>(source.fixtures||[]).flatMap(q=>{const before=source.rooms.find(r=>r.id===q.roomId),after=rooms.find(r=>r.id===q.roomId);if(!before||!after)return [];const dx=after.x-before.x,dy=after.y-before.y;return [{...q,floor:after.floor,x:dx?q.x+dx:q.x,y:dy?q.y+dy:q.y}];});
 const furniture=B.roomFurnitureLayout;B.roomFurnitureLayout=r=>furniture(r).filter(i=>!B.planFixtures(r.id).some(q=>overlap(q,i,.08)));
 const furnitureSvg=B.furnitureSvg;B.furnitureSvg=r=>furnitureSvg(r)+B.planFixtures(r.id).map(q=>'<g class="furniture altar-symbol" data-fixture-reference="'+esc(q.id)+'"><rect x="'+q.x+'" y="'+q.y+'" width="'+q.w+'" height="'+q.d+'" fill="#f0e2c6" stroke="#79624b" stroke-width=".025"/><text x="'+(q.x+q.w/2)+'" y="'+(q.y+q.d/2)+'" font-family="Arial" font-size=".12" text-anchor="middle" fill="#655442">BÀN THỜ</text></g>').join('');
 const schedule=B.architecturalFurnitureSchedule;B.architecturalFurnitureSchedule=(floor=0)=>{const items=schedule(floor);return [...items,...B.planFixtures().filter(q=>q.floor===floor).map((q,i)=>({...q,fixtureId:q.id,model:'altar-parametric',code:'N'+String(items.length+i+1).padStart(2,'0'),room:B.state.project.plan.rooms.find(r=>r.id===q.roomId)?.name||'',base:0,rotation:0}))];};
 const decorate=B.decorateStudioScene;B.decorateStudioScene=options=>{
  decorate(options);const {visibleFloors,roomFocus,floorFocus,W,D,fh,explode,addBox,roomMaterial,mats}=options;
  for(const q of B.planFixtures().filter(q=>visibleFloors.includes(q.floor)&&(!roomFocus||q.roomId===roomFocus.id))){const base=(roomFocus||floorFocus!==null?0:B.floorLevel(q.floor).base+q.floor*explode)+B.projectLevels().slab,material=roomMaterial('wood',q.roomId,mats.wood||mats.accent);
   const box=(w,h,d,x,y,z)=>{const mesh=addBox(w,h,d,x-W/2,base+y,z-D/2,material);mesh.userData={kind:'altar',fixtureId:q.id,roomId:q.roomId,floor:q.floor,provisional:true};};
   box(q.w,q.h*.12,q.d,q.x+q.w/2,q.h*.94,q.y+q.d/2);box(q.w*.9,q.h*.58,q.d*.86,q.x+q.w/2,q.h*.49,q.y+q.d/2);for(const x of [.08,.92])for(const z of [.1,.9])box(.055,q.h*.25,.055,q.x+q.w*x,q.h*.125,q.y+q.d*z);
  }
 };
 // Include the current C01 finish field names. The base drawing contract also
 // accepts legacy names; hashing only those could reuse a stale exported image.
 const revision=B.drawingRevision;B.drawingRevision=()=>{let hash=2166136261;const plan=B.state.project.plan,text=JSON.stringify({fixtures:plan.fixtures||[],furnitureFinishes:(plan.furniture||[]).map(i=>({id:i.id,bindings:(i.materialBindings||[]).map(m=>m&&typeof m==='object'?Object.fromEntries(['role','visualProfileId','textureAssetId','realWorldScale'].filter(k=>m[k]!==undefined).map(k=>[k,m[k]])):m)}))});for(let i=0;i<text.length;i++)hash=Math.imul(hash^text.charCodeAt(i),16777619);return revision()+'-'+(hash>>>0).toString(16).toUpperCase();};
 const geometry=B.measuredGeometryIssues;B.measuredGeometryIssues=()=>[...geometry(),...B.planFixtures().filter(q=>!B.fixtureFits(q)).map(q=>({sev:'error',text:(q.name||'Bàn thờ')+': số đo hoặc vị trí vượt phòng / chắn cửa.'}))];
 const validLayout=B.layoutValid;B.customerBaseLayoutValid=validLayout;
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 const directReject=reason=>{ui().directNotice=reason;B.toast(reason);return false;};
 const wallLocked=(plan,r,side)=>B.sharedWallNeighbors(plan.rooms,r,side).some(q=>B.isRoomLocked(q.id));
 const moved=(a,b)=>!a||!b||['x','y','w','h','floor'].some(k=>a[k]!==b[k]);
 // Validate a detached candidate before touching the project or its timeline.
 B.directPlanError=(plan,source=B.state.project.plan,{stairRepair=false}={})=>{
  for(const key of ['rooms','openings','fixtures']){const items=plan[key]||[];if(items.some(q=>!q?.id)||new Set(items.map(q=>q.id)).size!==items.length)return 'ID đối tượng bị thiếu hoặc trùng.';}
  for(const r of plan.rooms){if(!Number.isInteger(r.floor)||r.floor<0||r.floor>=Number(B.state.project.site.floors))return 'Tầng của phòng không hợp lệ.';if(![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.w<.6||r.h<.6)return 'Phòng cần số đo hữu hạn, rộng và dài tối thiểu 0,60 m.';}
  for(const id of new Set([...source.rooms,...plan.rooms].map(r=>r.id))){const before=source.rooms.find(r=>r.id===id),after=plan.rooms.find(r=>r.id===id);if(same(before,after))continue;
   if(before&&B.isRoomLocked(id)||after&&B.isFloorLocked(after.floor))return 'Phòng hoặc tầng đang khóa. Mở khóa trước khi sửa.';
   if(moved(before,after))for(const [p,r]of [[source,before],[plan,after]])if(r&&sides.some(([side])=>wallLocked(p,r,side)))return 'Tường chung tiếp giáp phòng đang khóa; không thể dời, đổi kích thước hoặc xóa phòng.';
  }
  if(!validLayout(plan.rooms)){
   // A legacy room outside the envelope must not trap the whole editor.
   // Validate every changed/new rectangle; retain warnings for unchanged rooms.
   // Deletion cannot add a collision, and no overlap may be introduced/grown.
   const area=(a,b)=>a&&b&&a.floor===b.floor?Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)):0;
   const old=id=>source.rooms.find(r=>r.id===id),changed=plan.rooms.filter(r=>moved(old(r.id),r));
   const safe=changed.every(r=>validLayout([r]))&&plan.rooms.every((r,i)=>plan.rooms.slice(i+1).every(q=>r.floor!==q.floor||area(r,q)<=area(old(r.id),old(q.id))+1e-8));
   if(!safe)return 'Phòng chồng nhau hoặc vượt ranh / khoảng lùi. Chọn vùng trống trong đất.';
  }
  for(const key of ['openings','fixtures'])for(const id of new Set([...(source[key]||[]),...(plan[key]||[])].map(q=>q.id))){const before=(source[key]||[]).find(q=>q.id===id),after=(plan[key]||[]).find(q=>q.id===id),oldRoom=before&&source.rooms.find(r=>r.id===before.roomId),newRoom=after&&plan.rooms.find(r=>r.id===after.roomId);if(same(before,after)&&!moved(oldRoom,newRoom))continue;
   if(before&&B.isRoomLocked(before.roomId)||after&&(B.isRoomLocked(after.roomId)||B.isFloorLocked(after.floor)))return 'Phòng hoặc tầng của đối tượng đang khóa.';
   if(key==='openings'&&[[source,oldRoom,before],[plan,newRoom,after]].some(([p,r,o])=>r&&o&&wallLocked(p,r,o.side)))return 'Phòng phía bên kia tường đang khóa; không thể thay đổi ô mở.';
  }
  return B.withPlan(plan,()=>{
   for(const o of plan.openings){const r=plan.rooms.find(r=>r.id===o.roomId),height=o.height??(o.kind==='window'?1.4:2.1),sill=o.sill??(o.kind==='window'?.9:0);
    if(!r||o.floor!==r.floor||!['door','window'].includes(o.kind)||!sides.some(([side])=>side===o.side))return 'Ô mở cần phòng, tầng và cạnh tường hợp lệ.';
    if(![o.width,o.offset,height,sill].every(Number.isFinite)||o.width<.5||o.offset<0||o.offset>1||height<.3||sill<0)return 'Ô mở: rộng ≥ 0,50 m, cao ≥ 0,30 m, bậu ≥ 0 m và vị trí từ 0 đến 1.';
    if(o.kind==='door'&&sill!==0)return 'Cửa đi / lối mở cần bậu bằng 0 m.';
    if(height+sill>B.floorLevel(o.floor).clearHeight)return 'Cao ô mở + bậu vượt chiều cao thông thủy dưới trần.';
    if(o.kind==='door'&&(!['left','right'].includes(o.hinge??'left')||!['in','out'].includes(o.swing??'in')))return 'Bản lề hoặc chiều mở cửa không hợp lệ.';
    if(o.width>(['north','south'].includes(o.side)?r.w:r.h)-.08)return 'Ô mở quá rộng cho cạnh tường; cần chừa ít nhất 0,08 m.';
    if(!B.openingFits(o))return 'Ô mở trùng hoặc quá gần ô mở khác trên cùng tường (cần cách 0,08 m).';
   }
   if(!(plan.fixtures||[]).every(q=>B.fixtureFits(q,plan)))return 'Bàn thờ vượt phòng, trùng fixture hoặc chắn cửa. Điều chỉnh kích thước / vị trí trước.';
   return '';
  });
 };
 B.layoutValid=rooms=>{const source=B.drag?.originalPlan||B.state.project.plan,plan={...source,rooms,fixtures:B.translatedFixtures(rooms,source)},reason=B.directPlanError(plan,source);if(B.drag)B.drag.directReason=reason;return !reason;};
 B.commitDirectPlan=(plan,selection,{translateFixtures=true,stairRepair=false}={})=>{
  plan=clone(plan);
  if(translateFixtures)plan.fixtures=B.translatedFixtures(plan.rooms,{...B.state.project.plan,fixtures:plan.fixtures||[]});
  const reason=B.directPlanError(plan,B.state.project.plan,{stairRepair});if(reason)return directReject(reason);
  if(same(plan,B.state.project.plan)){if(selection)Object.assign(ui(),selection);ui().directNotice='';return true;}
  B.pushPlanHistory();B.state.project.plan=plan;if(selection)Object.assign(ui(),selection);ui().directNotice='';update();return true;
 };
 B.removePlanItem=(kind,id)=>{
  if(!['room','opening','fixture'].includes(kind))return directReject('Loại đối tượng cần xóa không hợp lệ.');
  const plan=B.planSnapshot(),q=(kind==='opening'?plan.openings:kind==='fixture'?plan.fixtures||[]:plan.rooms).find(x=>x.id===id);if(!q)return directReject('Đối tượng cần xóa không còn trên bản vẽ.');
  const owner=kind==='room'?q:plan.rooms.find(r=>r.id===q.roomId);if(!owner||B.isRoomLocked(owner.id))return directReject('Phòng hoặc tầng đang khóa.');
  if(kind==='opening'&&wallLocked(plan,owner,q.side))return directReject('Phòng phía bên kia tường đang khóa.');
  if(kind==='room'&&sides.some(([side])=>wallLocked(plan,owner,side)))return directReject('Tường chung tiếp giáp phòng đang khóa; không thể xóa phòng.');
  if(kind==='room'&&q.type==='elevator'&&B.deleteElevatorShaft){ui().selected=q.id;return B.deleteElevatorShaft();}
  if(kind==='room'){plan.rooms=plan.rooms.filter(r=>r.id!==id);plan.openings=plan.openings.filter(o=>o.roomId!==id);plan.fixtures=(plan.fixtures||[]).filter(f=>f.roomId!==id);}
  else if(kind==='opening')plan.openings=plan.openings.filter(o=>o.id!==id);else plan.fixtures=plan.fixtures.filter(f=>f.id!==id);
  return B.commitDirectPlan(plan,{selectedOpening:'',selectedFixture:'',selected:kind==='room'?plan.rooms.find(r=>r.floor===ui().floor)?.id||'':owner.id,...(kind==='room'&&!plan.rooms.some(r=>r.floor===ui().floor)?{directTool:'room',tool:'select',view:'plan'}:{})});
 };
 const rotate=B.rotateSelectedRoom;B.rotateSelectedRoom=()=>{
  const r=B.selectedRoom();if(!r||r.type==='elevator')return rotate();if(B.isRoomLocked(r.id))return directReject('Phòng hoặc tầng đang khóa.');
  const plan=B.planSnapshot(),cx=r.x+r.w/2,cy=r.y+r.h/2,turn={north:'east',east:'south',south:'west',west:'north'},next={...r,x:cx-r.h/2,y:cy-r.w/2,w:r.h,h:r.w,furnitureRotation:((r.furnitureRotation||0)+90)%360,stairDirection:((r.type==='stairs'?B.stairSpec(r).direction:r.stairDirection||0)+90)%360};plan.rooms=plan.rooms.map(q=>q.id===r.id?next:q);
  plan.fixtures=(plan.fixtures||[]).map(q=>q.roomId===r.id?{...q,x:cx+cy-q.y-q.d,y:cy+q.x-cx,w:q.d,d:q.w,side:turn[q.side]}:q);
  for(const o of plan.openings.filter(o=>o.roomId===r.id)){if(wallLocked(B.state.project.plan,r,o.side))return directReject('Phòng phía bên kia tường đang khóa.');if(['east','west'].includes(o.side))o.offset=1-o.offset;o.side=turn[o.side];}
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
  const r=B.state.project.plan.rooms.find(r=>r.id===roomId);if(!r)return directReject('Chọn phòng để đặt ô mở.');if(!['door','window','passage'].includes(kind)||!sides.some(([s])=>s===side)||!point||![point.x,point.y].every(Number.isFinite))return directReject('Loại ô mở, cạnh tường hoặc tọa độ không hợp lệ.');
  if(B.isRoomLocked(roomId))return directReject('Phòng hoặc tầng đang khóa.');if(wallLocked(B.state.project.plan,r,side))return directReject('Phòng phía bên kia tường đang khóa.');
  if(point.x<r.x-.2||point.x>r.x+r.w+.2||point.y<r.y-.2||point.y>r.y+r.h+.2)return directReject('Vị trí đặt nằm ngoài phòng; chọn trong phòng hoặc sát cạnh tường.');
  const horizontal=['north','south'].includes(side),span=horizontal?r.w:r.h,width=Math.min(kind==='window'?1.4:kind==='passage'?1.2:.9,span-.25),position=horizontal?point.x-r.x:point.y-r.y;
  const o={id:B.uid('o'),roomId,floor:r.floor,kind:kind==='window'?'window':'door',side,offset:B.clamp((position-width/2)/(span-width),0,1),width,height:kind==='window'?Math.min(1.4,B.floorLevel(r.floor).clearHeight-.9):Math.min(2.2,B.floorLevel(r.floor).clearHeight),sill:kind==='window'?.9:0,hinge:'left',swing:'in',...(kind==='passage'?{passage:true}:{})};
  const plan=B.planSnapshot();plan.openings.push(o);return B.commitDirectPlan(plan,{selected:r.id,selectedOpening:o.id,selectedFixture:''})?o:false;
 };
 B.placeOpeningAt=(kind,roomId,side,point)=>B.directOpeningAt(kind,roomId,side,point);
 const inspectorOpening=B.addOpeningFromInspector;B.addOpeningFromInspector=values=>{const r=B.selectedRoom();if(!r)return directReject('Chọn phòng để đặt ô mở.');const number=k=>String(values[k]??'').trim()===''?NaN:Number(values[k]),plan=B.planSnapshot();plan.openings.push({id:B.uid('candidate'),roomId:r.id,floor:r.floor,kind:values.kind==='window'?'window':'door',side:values.side,width:number('width'),offset:number('offset'),height:number('height'),sill:values.kind==='window'?number('sill'):0,hinge:values.hinge||'left',swing:values.swing||'in'});const reason=B.directPlanError(plan);if(reason)return directReject(reason);ui().directNotice='';return inspectorOpening(values);};
 B.addDirectRoom=(a,b,type=ui().drawRoomType,{snap=true,dimensions=null}={})=>{if(B.isFloorLocked(ui().floor))return directReject('Tầng đang khóa.');if(!a||!b||![a.x,a.y,b.x,b.y].every(Number.isFinite)||!roomTypes.some(([k])=>k===type))return directReject('Hai góc và loại phòng cần hợp lệ.');const coordinate=n=>snap?B.roundTo(n,ui().snap):n,x=coordinate(Math.min(a.x,b.x)),y=coordinate(Math.min(a.y,b.y)),r={id:B.uid('r'),floor:ui().floor,type,name:type==='custom'?(String(ui().drawRoomName||'').trim().slice(0,60)||'Phòng tự đặt tên'):roomTypes.find(([k])=>k===type)[1],x,y,w:dimensions?.width??coordinate(Math.abs(a.x-b.x)),h:dimensions?.depth??coordinate(Math.abs(a.y-b.y))};if(r.w<.6||r.h<.6)return directReject('Phòng cần rộng và dài tối thiểu 0,60 m. Chọn hai góc xa hơn.');const plan=B.planSnapshot();plan.rooms.push(r);return B.commitDirectPlan(plan,{selected:r.id,selectedOpening:'',selectedFixture:'',directTool:'select'})?r:false;};
 B.addDirectAltar=(roomId,side)=>{const r=B.state.project.plan.rooms.find(r=>r.id===roomId);if(!r)return directReject('Chọn phòng để đặt bàn thờ.');if(B.isRoomLocked(r.id))return directReject('Phòng hoặc tầng đang khóa.');if(!sides.some(([s])=>s===side))return directReject('Cạnh đặt bàn thờ không hợp lệ.');const q=B.altarAtSide(r,side),plan=B.planSnapshot();plan.fixtures||=[];if(plan.fixtures.some(f=>f.roomId===r.id&&overlap(q,f,.08)))return directReject('Vị trí đang có bàn thờ. Chọn cạnh khác.');plan.fixtures.push(q);return B.commitDirectPlan(plan,{selected:r.id,selectedOpening:'',selectedFixture:q.id})?q:false;};
 const openingName=o=>o.passage?'Lối mở không cánh':o.kind==='window'?'Cửa sổ':'Cửa đi';
 const roomName=r=>roomTypes.find(([k])=>k===r.type)?.[1]||({stairs:'Cầu thang',elevator:'Thang máy',garage:'Gara'}[r.type]||r.type);
 // Floor transfer validates one detached measured model, including dependent objects.
 B.moveDirectRoomFloor=(id,target)=>{
  const r=B.state.project.plan.rooms.find(r=>r.id===id),floor=Number(target);if(!r)return directReject('Phòng không còn trên bản vẽ.');
  if(!Number.isInteger(floor)||floor<0||floor>=Number(B.state.project.site.floors))return directReject('Tầng đích không hợp lệ.');
  if(['stairs','elevator'].includes(r.type))return directReject('Thang và giếng thang cần đồng bộ các tầng; không chuyển riêng một phòng.');
  if(B.isRoomLocked(id)||B.isFloorLocked(floor))return directReject('Phòng, tầng hiện tại hoặc tầng đích đang khóa.');
  if(r.floor===floor)return true;
  const plan=B.planSnapshot();plan.rooms.find(q=>q.id===id).floor=floor;
  for(const o of plan.openings.filter(o=>o.roomId===id))o.floor=floor;
  for(const q of plan.fixtures||[])if(q.roomId===id)q.floor=floor;
  return B.commitDirectPlan(plan,{floor,selected:id,selectedOpening:'',selectedFixture:''});
 };
 B.editStairStack=(id,patch={},complete=false)=>{
  const p=B.state.project,source=p.plan.rooms.find(r=>r.id===id&&r.type==='stairs');if(!source)return directReject('Chọn ô cầu thang cần chỉnh.');
  const allowed=['x','y','w','h','stairDirection','stairShape'],values={};
  for(const [key,raw]of Object.entries(patch)){if(!allowed.includes(key))return directReject('Trường cầu thang không hợp lệ.');if(key==='stairShape'){if(!['u','straight'].includes(raw))return directReject('Kiểu thang không hợp lệ.');values[key]=raw;}else{if(String(raw).trim()===''||!Number.isFinite(Number(raw)))return directReject('Nhập số đo cầu thang hữu hạn.');values[key]=Number(raw);}}
  if(values.stairDirection!==undefined&&![0,90,180,270].includes(values.stairDirection))return directReject('Chọn hướng thang 0°, 90°, 180° hoặc 270°.');
  const plan=B.planSnapshot(),floors=Number(p.site.floors),sameWell=r=>['x','y','w','h'].every(k=>Math.abs(r[k]-source[k])<.001),group=[];
  for(let floor=0;floor<floors;floor++){
   const rows=plan.rooms.filter(r=>r.type==='stairs'&&r.floor===floor),exact=rows.filter(sameWell);let room=rows.find(r=>r.id===id)||exact[0];
   if(!room&&rows.length===1)room=rows[0];
   if(!room&&rows.length>1)return directReject('Tầng '+(floor+1)+' có nhiều cầu thang; cần xác định đúng ô cùng trục trước khi đồng bộ.');
   if(room){if(B.isRoomLocked(room.id))return directReject('Ô thang hoặc tầng '+(floor+1)+' đang khóa.');group.push(room);}
   else if(complete){if(B.isFloorLocked(floor))return directReject('Tầng '+(floor+1)+' đang khóa.');room={...clone(source),id:B.uid('stairs'),floor,name:'Cầu thang · tầng '+(floor+1)};plan.rooms.push(room);group.push(room);for(const o of p.plan.openings.filter(o=>o.roomId===source.id&&o.kind==='door'))plan.openings.push({...clone(o),id:B.uid('opening'),roomId:room.id,floor});}
  }
  const common={x:source.x,y:source.y,w:source.w,h:source.h,stairDirection:B.stairSpec(source).direction,stairShape:source.stairShape||'u',...values};
  for(const room of group)Object.assign(room,common);
  // An existing parcel/layout error must not lock a direction-only edit.
  // This path may change no room rectangle, opening, floor or fixture.
  if(!complete&&Object.keys(values).length&&Object.keys(values).every(k=>['stairDirection','stairShape'].includes(k))&&group.every(r=>{const old=p.plan.rooms.find(q=>q.id===r.id);return old&&['x','y','w','h','floor'].every(k=>r[k]===old[k]);})){
   if(!same(plan,p.plan)){B.pushPlanHistory();p.plan=plan;}ui().directNotice='';update();return true;
  }
  return B.commitDirectPlan(plan,{selected:id,selectedOpening:'',selectedFixture:''},{stairRepair:true});
 };
 document.addEventListener('change',e=>{
  const t=e.target;if(!t.matches?.('[data-stair-direction],[data-stair-shape]'))return;const r=B.selectedRoom();if(r?.type!=='stairs')return;
  e.stopImmediatePropagation();if(!B.editStairStack(r.id,{[t.matches('[data-stair-direction]')?'stairDirection':'stairShape']:t.value}))B.render({preserveScroll:true});
 },true);
 B.editDirectItem=(kind,id,key,raw)=>{
  if(kind==='room'&&B.state.project.plan.rooms.find(r=>r.id===id)?.type==='stairs'&&['x','y','w','h','stairDirection','stairShape'].includes(key))return B.editStairStack(id,{[key]:raw});
  if(kind==='room'&&key==='floor')return B.moveDirectRoomFloor(id,String(raw).trim()===''?NaN:Number(raw));
  const plan=B.planSnapshot(),item=(kind==='room'?plan.rooms:kind==='opening'?plan.openings:plan.fixtures||[]).find(q=>q.id===id);if(!item)return directReject('Đối tượng không còn trên tầng này.');
  const room=kind==='room'?item:plan.rooms.find(r=>r.id===item.roomId);if(!room)return directReject('Đối tượng chưa có phòng hợp lệ.');
  const numeric=kind==='room'?['x','y','w','h']:kind==='opening'?['width','height','sill','offset','distance']:['x','y','w','d','h'];
  if(numeric.includes(key)){if(String(raw).trim()===''||!Number.isFinite(Number(raw)))return directReject('Nhập số hữu hạn; không để trống. Đơn vị kích thước là mét.');const value=Number(raw);
   if(kind==='opening'&&key==='distance'){const length=(['north','south'].includes(item.side)?room.w:room.h)-item.width;if(value<0||value>length)return directReject('Khoảng cách đầu ô mở phải nằm từ 0 đến '+length.toFixed(3)+' m.');if(value!==length*item.offset)item.offset=value/length;}else item[key]=value;
  }else if(kind==='opening'&&['side','hinge','swing'].includes(key))item[key]=raw;
  else if(kind==='room'&&key==='type'&&roomTypes.some(([k])=>k===raw))item.type=raw;
  else if(kind==='room'&&key==='name'&&String(raw).trim()&&String(raw).trim().length<=60)item.name=String(raw).trim();
  else if(kind==='fixture'&&key==='side'&&sides.some(([s])=>s===raw)){if(raw!==item.side)Object.assign(item,B.altarAtSide(room,raw,{id:item.id,h:item.h,w:['east','west'].includes(item.side)!==['east','west'].includes(raw)?item.d:item.w,d:['east','west'].includes(item.side)!==['east','west'].includes(raw)?item.w:item.d}));}
  else return directReject('Trường chỉnh sửa hoặc giá trị không hợp lệ.');
  if(kind==='room'&&room.type==='elevator'&&numeric.includes(key))return directReject('Chỉnh kích thước thang máy bằng công cụ trục thang hiện có.');
  if(kind==='opening')return B.editOpening(id,Object.fromEntries(Object.keys(item).filter(k=>!same(item[k],B.state.project.plan.openings.find(o=>o.id===id)[k])).map(k=>[k,item[k]])));
  return B.commitDirectPlan(plan,{selected:room.id,selectedOpening:'',selectedFixture:kind==='fixture'?id:''});
 };
 B.directEditHtml=()=>{
  const u=ui(),selected=B.selectedRoom(),r=selected?.floor===u.floor?selected:null,o=B.state.project.plan.openings.find(o=>o.id===u.selectedOpening&&o.floor===u.floor),q=B.planFixtures().find(q=>q.id===u.selectedFixture&&q.floor===u.floor),kind=o?'opening':q?'fixture':r?'room':'',item=o||q||r,owner=item&&(kind==='room'?item:B.state.project.plan.rooms.find(r=>r.id===item.roomId)),locked=owner&&(B.isRoomLocked(owner.id)||o&&wallLocked(B.state.project.plan,owner,o.side)),disabled=locked?' disabled':'';
  // Labels may round; editable values retain every stored digit.
  const input=(key,label,value,min=.01,max='',off=false)=>'<label>'+label+'<input type="number" inputmode="decimal" data-direct-field="'+key+'" value="'+esc(value)+'" min="'+min+'" '+(max!==''?'max="'+max+'"':'')+' step="any" required'+(off?' disabled':disabled)+'></label>';
  const select=(key,label,value,options)=>'<label>'+label+'<select data-direct-field="'+key+'"'+disabled+'>'+options.map(([k,n])=>'<option value="'+k+'" '+(value===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>';
  const tools=[['select','Chọn / kéo / chỉnh'],['room','Vẽ phòng / lối đi'],['door','Thêm cửa đi'],['window','Thêm cửa sổ'],['passage','Thêm lối mở không cánh'],['altar','Thêm bàn thờ'],['erase','Xóa trực tiếp']];
  const option=(k,v,name)=>'<option value="'+k+':'+esc(v.id)+'" '+(kind===k&&item?.id===v.id?'selected':'')+'>'+esc(name)+' · '+esc(v.id)+'</option>',groups=[['room','Phòng',B.floorRooms(),v=>v.name+' · '+roomName(v)],['opening','Ô mở',B.state.project.plan.openings.filter(v=>v.floor===u.floor),v=>openingName(v)+' '+B.openingCode(v)],['fixture','Fixtures',B.planFixtures().filter(v=>v.floor===u.floor),v=>v.name]];
  const g=o&&B.openingGeometry(o),type=o?openingName(o):q?'Bàn thờ · fixture':r?roomName(r):'';
  const roomFields=r&&!o&&!q?'<label>Tên phòng<input type="text" data-direct-field="name" maxlength="60" required value="'+esc(r.name)+'"'+disabled+'></label>'+('<label>Tầng của phòng<select data-direct-field="floor"'+(locked||['stairs','elevator'].includes(r.type)?' disabled':'')+'>'+Array.from({length:Number(B.state.project.site.floors)},(_,f)=>'<option value="'+f+'" '+(f===r.floor?'selected':'')+'>Tầng '+(f+1)+'</option>').join('')+'</select></label>')+input('x','X / m',r.x,0,'',r.type==='elevator')+input('y','Y / m',r.y,0,'',r.type==='elevator')+input('w','Rộng X / m',r.w,.6,'',r.type==='elevator')+input('h','Dài Y / m',r.h,.6,'',r.type==='elevator')+(roomTypes.some(([k])=>k===r.type)?'<label>Công năng<select data-direct-room-type'+disabled+'>'+roomTypes.map(([k,n])=>'<option value="'+k+'" '+(r.type===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>':''):'';
  const stairFields=r?.type==='stairs'&&!o&&!q?select('stairDirection','Hướng vế đầu đi lên',B.stairSpec(r).direction,[[0,'Về đầu đất'],[90,'Về bên phải'],[180,'Về cuối đất'],[270,'Về bên trái']])+select('stairShape','Kiểu cầu thang',r.stairShape||'u',[['u','Chữ U · có chiếu nghỉ'],['straight','Thẳng']])+'<button type="button" data-direct-stair-sync'+disabled+'>Căn ô thang các tầng</button><small class="stair-stack-note">Số đo và hướng thang được cập nhật cùng các tầng. Mái trên chiếu nghỉ cuối được che kín; chưa bao gồm lối lên sân thượng.</small>':'';
  const fields=o?select('side','Cạnh tường',o.side,sides)+input('distance','Đầu ô mở cách đầu cạnh / m',(['north','south'].includes(o.side)?owner.w:owner.h)-o.width>0?((['north','south'].includes(o.side)?owner.w:owner.h)-o.width)*o.offset:0,0)+input('offset','Vị trí cạnh / tỷ lệ 0–1',o.offset,0,1)+input('width','Rộng / m',o.width,.5)+input('height','Cao / m',o.height??(o.kind==='door'?2.1:1.4),.3,B.floorLevel(o.floor).clearHeight)+input('sill','Bậu / m',o.sill??(o.kind==='door'?0:.9),0,B.floorLevel(o.floor).clearHeight,o.kind==='door')+(o.kind==='door'&&!o.passage?select('hinge','Bản lề',o.hinge??'left',[['left','Đầu cạnh'],['right','Cuối cạnh']])+select('swing','Chiều mở',o.swing??'in',[['in','Vào phòng'],['out','Ra ngoài']]):''):q?input('x','X / m',q.x,0)+input('y','Y / m',q.y,0)+input('w','Rộng X / m',q.w,.3)+input('d','Sâu Y / m',q.d,.2)+input('h','Cao / m',q.h,.3,B.floorLevel(q.floor).clearHeight)+select('side','Lưng bàn thờ',q.side,sides):roomFields;
  return '<section class="customer-direct-editor"><div class="customer-direct-tools"><label>Thao tác trên bản vẽ<select data-direct-tool>'+tools.map(([k,n])=>'<option value="'+k+'" '+(u.directTool===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'+(u.directTool==='room'?'<label>Không gian cần vẽ<select data-direct-draw-type>'+roomTypes.map(([k,n])=>'<option value="'+k+'" '+(u.drawRoomType===k?'selected':'')+'>'+n+'</option>').join('')+'</select></label>':'')+'<label>Chọn đối tượng · tầng '+(u.floor+1)+'<select data-direct-selection><option value="">Chạm bản vẽ hoặc chọn ở đây</option>'+groups.map(([k,label,items,name])=>'<optgroup label="'+label+'">'+items.map(v=>option(k,v,name(v))).join('')+'</optgroup>').join('')+'</select></label>'+(B.planHistory?.redo?.length?'<button type="button" data-plan-redo title="Làm lại thay đổi vừa hoàn tác">↷ Làm lại</button>':'')+'</div><p>'+(u.directTool==='room'?'Kéo hình chữ nhật hoặc chạm hai góc trong vùng trống. Esc để hủy.':u.directTool==='select'?'Chạm đối tượng để chọn; dùng danh sách nếu ô mở nhỏ. Kéo phòng để di chuyển.':u.directTool==='erase'?'Chạm đối tượng cần xóa. Có thể hoàn tác.':'Chạm vị trí trong phòng; BMH lấy cạnh tường gần nhất.')+'</p>'+(u.directTool==='room'?B.personalRoomFormHtml():'')+'<p class="customer-direct-status" role="status" aria-live="polite">'+esc(u.directNotice||'')+'</p>'+(item?'<div class="customer-direct-inspector" data-direct-kind="'+kind+'" data-direct-id="'+esc(item.id)+'"><header><small>ĐANG CHỌN · TẦNG '+(item.floor+1)+'</small><b>'+esc(o?openingName(o)+' '+B.openingCode(o):item.name)+'</b><small>'+esc(type)+' · ID '+esc(item.id)+(kind!=='room'?' · '+esc(owner?.name||'')+' ('+esc(item.roomId)+')':'')+'</small></header><p class="customer-direct-position">'+(g?'Tâm ô mở X '+g.x.toFixed(3)+' / Y '+g.y.toFixed(3)+' m · '+esc(sides.find(([s])=>s===o.side)?.[1]||o.side):'Góc đầu X '+Number(item.x).toFixed(3)+' / Y '+Number(item.y).toFixed(3)+' m')+'</p>'+(locked?'<p>🔒 Phòng / tầng hoặc phía bên kia tường đang khóa.</p>':'')+'<div class="customer-direct-fields">'+fields+stairFields+'</div><small>Kích thước dùng mét; có thể nhập 0,001 m hoặc chính xác hơn. Giá trị đầy đủ được giữ khi lưu.'+(o?' Vị trí 0 = đầu cạnh, 1 = cuối cạnh; đầu cạnh tính theo đất, không theo chiều xoay màn hình.':'')+'</small><button type="button" data-direct-delete'+disabled+'>Xóa '+(o?'ô mở':q?'bàn thờ':'phòng')+'</button>'+(q?'<small>Kích thước dự trù, chưa phải mẫu bàn thờ của hãng.</small>':'')+'</div>':'')+'</section>';
 };
 const planSvg=B.planSvg;B.planSvg=options=>{
  const markup=planSvg(options);if(options?.interactive===false||typeof DOMParser==='undefined')return markup;
  const doc=new DOMParser().parseFromString(markup,'image/svg+xml'),root=doc.documentElement,target=root.querySelector('#planDrawing')||root,ns='http://www.w3.org/2000/svg',f=options?.floor??ui().floor;root.classList.add('customer-direct-plan');
  const element=(tag,attrs)=>{const el=doc.createElementNS(ns,tag);for(const [key,value]of Object.entries(attrs))el.setAttribute(key,String(value));return el;};
  for(const o of B.state.project.plan.openings.filter(o=>o.floor===f)){const span=B.openingWallSpan(o);if(!span)continue;const h=span.o==='h',selected=o.id===ui().selectedOpening,coords={x1:h?span.a:span.c,y1:h?span.c:span.a,x2:h?span.b:span.c,y2:h?span.c:span.b};if(selected)target.append(element('line',{...coords,class:'direct-selection-mark'}));target.append(element('line',{'data-plan-opening':o.id,class:'direct-opening-hit'+(selected?' is-selected':''),...coords,tabindex:0,role:'button','aria-pressed':selected,'aria-label':openingName(o)+' '+B.openingCode(o)+' · '+o.id+' · tầng '+(o.floor+1)}));}
  for(const q of B.planFixtures().filter(q=>q.floor===f))target.append(element('rect',{'data-plan-fixture':q.id,class:'direct-fixture-hit'+(q.id===ui().selectedFixture?' is-selected':''),x:q.x,y:q.y,width:q.w,height:q.d,tabindex:0,role:'button','aria-pressed':q.id===ui().selectedFixture,'aria-label':q.name+' · '+q.id+' · tầng '+(q.floor+1)}));
  for(const group of root.querySelectorAll('[data-room-id]')){const r=B.state.project.plan.rooms.find(r=>r.id===group.getAttribute('data-room-id'));if(!r)continue;group.setAttribute('aria-label',r.name+' · '+roomName(r)+' · '+r.id+' · tầng '+(r.floor+1));group.setAttribute('data-direct-selected',r.id===ui().selected&&!ui().selectedOpening&&!ui().selectedFixture?'true':'false');}
  return new XMLSerializer().serializeToString(root);
 };
 const normalize=B.normalizeState;B.normalizeState=()=>{normalize();const u=ui();if(!['select','room','door','window','passage','altar','erase'].includes(u.directTool))u.directTool='select';if(!roomTypes.some(([k])=>k===u.drawRoomType))u.drawRoomType='bed';const p=B.state.project.plan;p.fixtures=(p.fixtures||[]).filter(q=>q&&q.kind==='altar'&&p.rooms.some(r=>r.id===q.roomId)&&[q.x,q.y,q.w,q.d,q.h].every(Number.isFinite));if(!p.openings.some(o=>o.id===u.selectedOpening))u.selectedOpening='';if(!p.fixtures.some(q=>q.id===u.selectedFixture))u.selectedFixture='';B.state.ui.guidedPanels||={};for(const key of ['style-output','worship-review'])if(typeof B.state.ui.guidedPanels[key]!=='boolean')B.state.ui.guidedPanels[key]=false;};
 B.normalizeState();
 B.editOpening=(id,changes)=>{const plan=B.planSnapshot(),o=plan.openings.find(o=>o.id===id);if(!o)return directReject('Ô mở không còn trên bản vẽ.');if(Object.keys(changes).some(k=>!['kind','passage','side','offset','width','height','sill','hinge','swing'].includes(k)))return directReject('Giữ nguyên ID, tầng và phòng của ô mở.');Object.assign(o,changes);return B.commitDirectPlan(plan,{selected:o.roomId,selectedOpening:id,selectedFixture:''});};
 const snapshot=B.customerDesignSnapshot;B.customerDesignSnapshot=()=>{const result=snapshot();result.project.fixtures=B.planFixtures().map(q=>Object.fromEntries(['id','kind','name','roomId','floor','x','y','w','d','h','side','provisional'].filter(k=>q[k]!==undefined).map(k=>[k,clone(q[k])])));result.project.designIntent={style:B.styleOutputReview(),floorProgram:B.requestedFloorProgram(),worship:B.worshipReview()};return result;};
 const files=B.customerPackageFiles;B.customerPackageFiles=(s,...args)=>[...files(s,...args),['phong-cach-vat-lieu-cong-nang.json',JSON.stringify(s.project.designIntent,null,2)]];
 for(const [name,index]of [['screen1',0],['screen5',3],['screen7',5],['screen10',9]]){const screen=B[name];B[name]=()=>{
  const content=screen();if(name==='screen1')return content+B.styleOutputHtml();
  if(name!=='screen5'||ui().view!=='plan'||typeof document.createElement!=='function')return B.styleOutputHtml()+content;
  const t=document.createElement('template');t.innerHTML=content;const editor=document.createElement('template');editor.innerHTML=B.directEditHtml();const controls=editor.content.firstElementChild,inspector=controls.querySelector('.customer-direct-inspector'),roomFunction=controls.querySelector('.customer-room-function'),side=t.content.querySelector('.v6-inspector'),main=t.content.querySelector('.v6-plan-main');
  if(inspector&&side)side.prepend(inspector);if(roomFunction&&side)side.prepend(roomFunction);const canvas=main?.querySelector('.v6-plan-canvas');if(canvas)canvas.before(controls);else return B.styleOutputHtml()+B.directEditHtml()+B.worshipReviewHtml()+content;
  const selected=B.selectedRoom();if(selected)for(const input of t.content.querySelectorAll('[data-v6-room],[data-room-field]')){const key=input.dataset.v6Room||input.dataset.roomField;if(['x','y','w','h'].includes(key)){input.setAttribute('value',String(selected[key]));input.setAttribute('step','any');input.setAttribute('inputmode','decimal');}}
  main?.insertAdjacentHTML('beforeend',B.worshipReviewHtml());return B.styleOutputHtml()+t.innerHTML;
 };B.SCREENS[index]=B[name];}
 const family=B.screen4;B.screen4=()=>family()+'<section class="customer-family-program"><b>Chọn công năng theo từng tầng</b><p>Phòng ngủ, WC và không gian thờ ở tầng bạn muốn.</p><button data-customer-program-open>Mở công năng từng tầng →</button></section>';B.SCREENS[2]=B.screen4;

 document.addEventListener('change',e=>{
  const t=e.target;if(t.matches?.('[data-floor-program]')){const rows=B.ensureFloorProgram(),f=B.clamp(Number(B.state.ui.programFloor)||0,0,rows.length-1),key=t.dataset.floorProgram;rows[f][key]=t.type==='checkbox'?t.checked:['bedrooms','bathrooms'].includes(key)?Number(t.value):t.value;B.designState().program.floors=rows;B.designState().programNotice='';update();return;}
  if(t.matches?.('[data-kit-floor]')){B.state.ui.proposalFloor=Number(t.value);update();return;}
  if(t.matches?.('[data-customer-style]')){if(B.selectHouseStyle(t.value))update();return;}
  if(t.matches?.('[data-direct-tool]')){cancelDraw();Object.assign(ui(),{directTool:t.value,tool:'select',selectedOpening:'',selectedFixture:''});update();return;}
  if(t.matches?.('[data-direct-selection]')){const split=t.value.indexOf(':');if(split>=0){cancelDraw();ui().directTool='select';ui().tool='select';selectItem(t.value.slice(0,split),t.value.slice(split+1));}return;}
  if(t.matches?.('[data-direct-draw-type]')){ui().drawRoomType=t.value;B.save();return;}
  if(t.matches?.('[data-direct-room-type]')){const r=B.selectedRoom();if(r&&!B.editDirectItem('room',r.id,'type',t.value))B.render({preserveScroll:true});return;}
  if(t.matches?.('[data-direct-field],[data-altar-side]')){const box=t.closest('[data-direct-kind]');if(box&&!B.editDirectItem(box.dataset.directKind,box.dataset.directId,t.dataset.directField||'side',t.value))B.render({preserveScroll:true});}
 });
 // Intercept legacy room coordinate inputs to move owned fixtures atomically.
 document.addEventListener('change',e=>{const t=e.target,key=t.dataset?.roomField||t.dataset?.v6Room,r=B.selectedRoom();if(!['x','y','w','h','name'].includes(key)||!r||r.type==='elevator'&&key!=='name')return;e.stopImmediatePropagation();if(!B.editDirectItem('room',r.id,key,t.value))B.render({preserveScroll:true});},true);
 document.addEventListener('change',e=>{const t=e.target,key=t.dataset?.openingField||t.dataset?.openingDimension||(t.hasAttribute?.('data-opening-side')?'side':t.dataset?.openingMotion);if(!key)return;e.stopImmediatePropagation();B.editDirectItem('opening',t.dataset.openingId,key,t.value);B.render({preserveScroll:true});},true);
 document.addEventListener('click',e=>{if(!e.target.closest?.('[data-direct-stair-sync]'))return;const r=B.selectedRoom();if(r&&!B.editStairStack(r.id,{},true))B.render({preserveScroll:true});});
 document.addEventListener('click',e=>{
  const t=e.target.closest?.('[data-program-floor],[data-return-style],[data-direct-delete],[data-customer-program-open],[data-personal-plan]');if(!t)return;
  if(t.hasAttribute('data-program-floor')){B.state.ui.programFloor=Number(t.dataset.programFloor);update();}
  if(t.hasAttribute('data-return-style'))B.returnInteriorToStyle();
  if(t.hasAttribute('data-direct-delete')){const box=t.closest('[data-direct-kind]');if(!B.removePlanItem(box.dataset.directKind,box.dataset.directId))B.render({preserveScroll:true});}
  if(t.hasAttribute('data-personal-plan')){B.openPersonalPlanner();return;}
  if(t.hasAttribute('data-customer-program-open')){B.designState().programOpen=true;B.state.ui.designProposalsOpen=true;B.navigateTo(4);}
 });
 let drawing=null,anchor=null,ignoreClickUntil=0;
 const cancelDraw=()=>{drawing=null;anchor=null;document.querySelectorAll('.direct-room-preview,.direct-room-anchor').forEach(e=>e.remove());};
 document.addEventListener('change',e=>{if(e.target.matches?.('[data-guided-floor],[data-floor],[data-guided-plan-view]'))cancelDraw();},true);
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-nav]'))cancelDraw();},true);
 const point=e=>{const svg=B.$('#plannerSvg');return svg?B.svgPoint(e,svg):null;};
 const drawPreview=b=>{const svg=B.$('#plannerSvg'),target=svg?.querySelector('#planDrawing')||svg;if(!target||!anchor)return;target.querySelector('.direct-room-preview')?.remove();const r=document.createElementNS('http://www.w3.org/2000/svg','rect');for(const [k,v]of Object.entries({x:Math.min(anchor.x,b.x),y:Math.min(anchor.y,b.y),width:Math.abs(b.x-anchor.x),height:Math.abs(b.y-anchor.y),class:'direct-room-preview'}))r.setAttribute(k,v);target.append(r);};
 const selectItem=(kind,id)=>{const q=(kind==='room'?B.state.project.plan.rooms:kind==='opening'?B.state.project.plan.openings:B.planFixtures()).find(q=>q.id===id&&q.floor===ui().floor);if(!q)return;Object.assign(ui(),{selected:kind==='room'?id:q.roomId,selectedOpening:kind==='opening'?id:'',selectedFixture:kind==='fixture'?id:'',directNotice:''});update();};
 document.addEventListener('pointerdown',e=>{
  if(B.state.ui.step!==4||ui().view!=='plan'||!e.target.closest?.('#plannerSvg')||ui().tool!=='select'||e.button>0)return;const tool=ui().directTool,hit=e.target.closest('[data-plan-opening],[data-plan-fixture]'),kind=hit?.hasAttribute('data-plan-opening')?'opening':'fixture',id=hit?.dataset.planOpening||hit?.dataset.planFixture;
  if(tool==='select'){if(hit){e.preventDefault();e.stopImmediatePropagation();selectItem(kind,id);ignoreClickUntil=Date.now()+500;}else{const changed=!!(ui().selectedOpening||ui().selectedFixture||ui().directNotice);ui().selectedOpening='';ui().selectedFixture='';ui().directNotice='';if(changed)queueMicrotask(()=>{if(B.drag?.pointerId===e.pointerId)B.drag.selectionChanged=true;else B.render({preserveScroll:true});});}return;}
  e.preventDefault();e.stopImmediatePropagation();const at=point(e);if(!at)return;
  if(tool==='erase'){let ok;if(hit)ok=B.removePlanItem(kind,id);else{const room=e.target.closest('[data-room-id]');if(room)ok=B.removePlanItem('room',room.dataset.roomId);else directReject('Chạm phòng, ô mở hoặc fixture cần xóa.');}if(!ok)B.render({preserveScroll:true});return;}
  if(tool==='room'){if(B.isFloorLocked(ui().floor)){directReject('Tầng đang khóa.');B.render({preserveScroll:true});return;}drawing={start:at,pointerId:e.pointerId,second:!!anchor};if(!anchor){anchor=at;const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');dot.setAttribute('cx',at.x);dot.setAttribute('cy',at.y);dot.setAttribute('r','.07');dot.setAttribute('class','direct-room-anchor');(B.$('#plannerSvg #planDrawing')||B.$('#plannerSvg')).append(dot);}return;}
  const rooms=B.floorRooms().filter(r=>at.x>=r.x-.2&&at.x<=r.x+r.w+.2&&at.y>=r.y-.2&&at.y<=r.y+r.h+.2),r=rooms.find(r=>r.id===ui().selected)||rooms[0];if(!r){directReject('Chạm trong phòng hoặc sát cạnh tường để đặt đối tượng.');B.render({preserveScroll:true});return;}const side=[['north',Math.abs(at.y-r.y)],['south',Math.abs(at.y-r.y-r.h)],['west',Math.abs(at.x-r.x)],['east',Math.abs(at.x-r.x-r.w)]].sort((a,b)=>a[1]-b[1])[0][0];
  const ok=tool==='altar'?B.addDirectAltar(r.id,side):B.directOpeningAt(tool,r.id,side,at);if(!ok)B.render({preserveScroll:true});ignoreClickUntil=Date.now()+500;
 },true);
 document.addEventListener('click',e=>{if(e.target.closest?.('#plannerSvg')&&(ui().directTool!=='select'||Date.now()<ignoreClickUntil)){e.preventDefault();e.stopImmediatePropagation();}},true);
 // Reuse the existing drag selection, SVG matrix, snapping and preview, but
 // defer both the plan write and the history push until a valid pointer-up.
 B.directRoomDragCandidate=(d,at)=>{
  const plan=clone(d.originalPlan),r=plan.rooms.find(r=>r.id===d.id);if(!r||!at||![at.x,at.y].every(Number.isFinite))return {reason:'Tọa độ kéo phòng không hợp lệ.'};
  const dx=at.x-d.startPoint.x,dy=at.y-d.startPoint.y,s=ui().snap,site=B.state.project.site;if(Math.hypot(dx,dy)<1e-7)return {plan,reason:''};
  if(d.mode==='move'){r.x=B.clamp(B.roundTo(r.x+dx,s),0,site.width-r.w);r.y=B.clamp(B.roundTo(r.y+dy,s),0,site.depth-r.h);d.guides=B.smartSnapMove?.(r,plan.rooms)||[];}
  else if(d.mode==='resize'){d.guides=[];r.w=B.clamp(B.roundTo(r.w+dx,s),.6,site.width-r.x);r.h=B.clamp(B.roundTo(r.h+dy,s),.6,site.depth-r.y);}
  else{d.guides=[];plan.rooms=B.edgeMoveCandidate(d.originalPlan.rooms,d.id,d.side,B.roundTo(['east','west'].includes(d.side)?dx:dy,s));}
  if(B.expandElevatorGeometry)plan.rooms=B.expandElevatorGeometry(plan.rooms,d.id);
  if(!plan.rooms)return {reason:d.directReason||'Tường chung không thể dời: phòng khóa, chồng phòng hoặc vượt ranh.'};
  plan.fixtures=B.translatedFixtures(plan.rooms,d.originalPlan);return {plan,reason:B.directPlanError(plan,d.originalPlan)};
 };
 B.finishDirectRoomDrag=(e,cancel=false)=>{
  const d=B.drag;if(!d||e?.pointerId!=null&&e.pointerId!==d.pointerId)return false;
  const result=cancel?{plan:d.originalPlan,reason:''}:B.directRoomDragCandidate(d,e?point(e):d.startPoint);
  try{d.captureEl?.releasePointerCapture?.(d.pointerId);}catch(_){}
  B.clearRoomDragPreview?.();B.drag=null;document.documentElement?.classList.remove('room-dragging');
  if(result.reason){directReject(result.reason);B.render({preserveScroll:true});return false;}
  if(!cancel&&!same(result.plan,d.originalPlan))return B.commitDirectPlan(result.plan,{selected:d.id,selectedOpening:'',selectedFixture:''},{translateFixtures:false});
  if(d.selectionChanged||cancel)update();return true;
 };
 window.addEventListener('pointermove',e=>{const d=B.drag;if(!d||e.pointerId!==d.pointerId)return;e.stopImmediatePropagation();const result=B.directRoomDragCandidate(d,point(e));d.invalid=!!result.reason;d.directReason=result.reason;
  if(result.reason){B.paintPlacementHint?.(null,result.reason);return;}
  d.lastCandidate=result.plan.rooms;d.changed=!same(result.plan,d.originalPlan);B.paintRoomDragPreview?.(result.plan.rooms);
  const r=result.plan.rooms.find(r=>r.id===d.id);if(r&&B.roomPlacementReview)B.withPlan(result.plan,()=>B.paintPlacementHint?.(B.roomPlacementReview(r)));e.preventDefault();
 },{capture:true,passive:false});
 window.addEventListener('pointerup',e=>{if(!B.drag||e.pointerId!==B.drag.pointerId)return;e.stopImmediatePropagation();B.finishDirectRoomDrag(e);},true);
 window.addEventListener('pointercancel',e=>{if(!B.drag||e.pointerId!==B.drag.pointerId)return;e.stopImmediatePropagation();B.finishDirectRoomDrag(e,true);},true);
 window.addEventListener('pointermove',e=>{if(!drawing||e.pointerId!==drawing.pointerId)return;const p=point(e);if(p)drawPreview(p);},{passive:true});
 window.addEventListener('pointerup',e=>{if(!drawing||e.pointerId!==drawing.pointerId)return;const p=point(e),drag=p&&Math.hypot(p.x-drawing.start.x,p.y-drawing.start.y)>.2;if(p&&(drawing.second||drag)){const a=anchor;cancelDraw();ignoreClickUntil=Date.now()+500;if(!B.addDirectRoom(a,p))B.render({preserveScroll:true});}drawing=null;},true);
 window.addEventListener('pointercancel',cancelDraw);
 document.addEventListener('keydown',e=>{
  if(B.state.ui.step!==4||e.target.closest?.('input,select,textarea,[contenteditable]'))return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();if(B.drag)B.finishDirectRoomDrag(null,true);cancelDraw();ui().directTool='select';ui().tool='select';update();}
  if(!e.ctrlKey&&!e.metaKey&&['d','w'].includes(e.key.toLowerCase())){e.preventDefault();e.stopImmediatePropagation();cancelDraw();ui().directTool=e.key.toLowerCase()==='d'?'door':'window';ui().tool='select';update();}
  if(['Delete','Backspace'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();const u=ui();if(u.selectedOpening)B.removePlanItem('opening',u.selectedOpening);else if(u.selectedFixture)B.removePlanItem('fixture',u.selectedFixture);else if(u.selected)B.removePlanItem('room',u.selected);}
  if(['Enter',' '].includes(e.key)&&e.target.matches?.('[data-plan-opening],[data-plan-fixture]')){e.preventDefault();selectItem(e.target.hasAttribute('data-plan-opening')?'opening':'fixture',e.target.dataset.planOpening||e.target.dataset.planFixture);}
 },true);
})();

/* Team B / C01 consumer. A owns the default schema and migration. Never keep
 * a second furniture store: editor, drawing, model and exports read plan.furniture. */
(()=>{
 const B=BMH,clone=v=>structuredClone(v),esc=B.esc,legacy=B.roomFurnitureLayout;
 const angle=n=>((Number(n)%360)+360)%360;
 const models={bedDouble:'Giường đôi',bedSingle:'Giường đơn',loungeDesignSofa:'Sofa',loungeChair:'Ghế thư giãn',loungeChairModern:'Ghế thư giãn Modern',tableCoffee:'Bàn trà',tableCoffeeModern:'Bàn trà Modern · gỗ và đá',table:'Bàn ăn',chair:'Ghế',cabinetTelevision:'Tủ TV',televisionModern:'TV',kitchenSink:'Chậu bếp',kitchenStove:'Bếp',kitchenFridge:'Tủ lạnh',bathroomSink:'Lavabo',toilet:'Bồn cầu',shower:'Cabin tắm',bookcaseClosedWide:'Tủ sách',desk:'Bàn làm việc',chairDesk:'Ghế làm việc',cabinetBed:'Tủ đầu giường',pottedPlant:'Cây',sideTable:'Bàn phụ',floorLamp:'Đèn đứng',washingMachine:'Máy giặt',kitchenBaseCabinet:'Tủ bếp dưới',kitchenFillerPanel:'Tấm bù / nối mặt bếp',kitchenWallCabinet:'Tủ bếp treo',kitchenHood:'Hút mùi',wardrobeModern:'Tủ áo Hiện đại',bedsideLamp:'Đèn đầu giường',bedBench:'Ghế cuối giường'};
 const plan=()=>B.state.project.plan;
 const room=id=>plan().rooms.find(r=>r.id===id);
 const selected=()=>B.state.ui.planner.selectedFurniture||'';
 B.furnitureContractReady=()=>Array.isArray(B.defaultState().project.plan.furniture)&&(!('furniture' in plan())||Array.isArray(plan().furniture));
 B.furnitureRecordValid=i=>!!(i&&typeof i.id==='string'&&i.id&&room(i.roomId)&&Number.isInteger(i.floor)&&['present','removed'].includes(i.placementStatus)&&models[i.modelId]&&[i.pose?.x,i.pose?.y,i.pose?.z,i.pose?.rotationDeg,i.size?.width,i.size?.depth,i.size?.height].every(Number.isFinite)&&i.size.width>0&&i.size.depth>0&&i.size.height>0&&i.pose.z>=0);
 B.furnitureFootprint=i=>{
  const a=angle(i.pose.rotationDeg)*Math.PI/180,c=Math.cos(a),s=Math.sin(a),w=i.size.width/2,d=i.size.depth/2;
  return [[-w,-d],[w,-d],[w,d],[-w,d]].map(([x,y])=>({x:i.pose.x+x*c-y*s,y:i.pose.y+x*s+y*c}));
 };
 const intersects=(a,b)=>{
  for(const polygon of [a,b])for(let n=0;n<polygon.length;n++){
   const p=polygon[n],q=polygon[(n+1)%polygon.length],axis={x:-(q.y-p.y),y:q.x-p.x},proj=v=>v.x*axis.x+v.y*axis.y;
   const aa=a.map(proj),bb=b.map(proj);if(Math.max(...aa)<=Math.min(...bb)+1e-7||Math.max(...bb)<=Math.min(...aa)+1e-7)return false;
  }return true;
 };
 const box=(x,y,w,d)=>[{x,y},{x:x+w,y},{x:x+w,y:y+d},{x,y:y+d}];
 B.generatedFurniture=r=>{
  const counts={};return legacy(r).map(i=>{
   const dim=B.FURNITURE_DIMENSIONS[i.model],n=counts[i.model]||0;counts[i.model]=n+1;
   return {id:'furniture:'+r.id+':'+i.model+':'+n,roomId:r.id,floor:r.floor,modelId:i.model,origin:'generated',placementStatus:'present',locked:false,pose:{x:i.x+i.w/2,y:i.y+i.d/2,z:i.base||0,rotationDeg:angle(i.rotation)},size:{width:dim.w,depth:dim.d,height:dim.h},materialBindings:[],costTreatment:'unconfirmed'};
  });
 };
 B.resolvedFurniture=(roomId,{includeRemoved=false}={})=>{
  const rooms=roomId?[room(roomId)].filter(Boolean):plan().rooms;
  return rooms.flatMap(r=>{const saved=(plan().furniture||[]).filter(i=>i.roomId===r.id),rows=saved.length?saved:B.generatedFurniture(r);return rows.filter(i=>B.furnitureRecordValid(i)&&(includeRemoved||i.placementStatus==='present')).map(clone);});
 };
 B.furniturePlacementIssues=(candidate,rows=B.resolvedFurniture(candidate.roomId))=>{
  const r=room(candidate.roomId),out=[];if(!B.furnitureRecordValid(candidate)||candidate.floor!==r?.floor)return ['Dữ liệu vật thể hoặc tầng không hợp lệ.'];
  const polygon=B.furnitureFootprint(candidate),margin=.02,level=B.studioFloorLevel(r.floor);
  if(candidate.pose.z+candidate.size.height>level.clearHeight+.001)out.push('Vật thể vượt chiều cao thông thủy / xuyên trần.');
  if(polygon.some(p=>p.x<r.x+margin||p.x>r.x+r.w-margin||p.y<r.y+margin||p.y>r.y+r.h-margin))out.push('Vật thể sau khi xoay vượt phòng / xuyên tường.');
  for(const other of rows){if(other.id===candidate.id||other.placementStatus==='removed')continue;
   if(candidate.pose.z+candidate.size.height<=other.pose.z+.01||other.pose.z+other.size.height<=candidate.pose.z+.01)continue;
   if(intersects(polygon,B.furnitureFootprint(other)))out.push('Chạm '+(models[other.modelId]||other.modelId)+'.');
  }
  for(const q of B.planFixtures?.(r.id)||[])if(intersects(polygon,box(q.x,q.y,q.w,q.d)))out.push('Chạm bàn thờ / fixture.');
  for(const o of plan().openings.filter(o=>o.roomId===r.id&&o.kind==='door')){
   const g=B.openingGeometry(o);if(!g)continue;const w=Number(o.width)||.9,inward=o.swing!=='out',reach=inward?w:.25;
   const rect=['north','south'].includes(o.side)?box(g.x-w/2-.1,o.side==='north'?r.y-.02:r.y+r.h-reach,w+.2,reach+.02):box(o.side==='west'?r.x-.02:r.x+r.w-reach,g.y-w/2-.1,reach+.02,w+.2);
   if(intersects(polygon,rect))out.push('Chắn cửa / vùng mở cửa.');
  }
  if(['kitchenWallCabinet','kitchenHood','wardrobeModern'].includes(candidate.modelId))for(const o of plan().openings.filter(o=>o.roomId===r.id&&o.kind==='window')){
   const sill=Number.isFinite(Number(o.sill))?Number(o.sill):.9,height=Number(o.height)||1.4;if(candidate.pose.z+candidate.size.height<=sill||candidate.pose.z>=sill+height)continue;
   const g=B.openingGeometry(o);if(!g)continue;const w=Number(o.width)||.9,reach=.25,area=['north','south'].includes(o.side)?box(g.x-w/2,o.side==='north'?r.y:r.y+r.h-reach,w,reach):box(o.side==='west'?r.x:r.x+r.w-reach,g.y-w/2,reach,w);
   if(intersects(polygon,area))out.push('Tủ / thiết bị che cửa sổ tại cao độ đang chọn.');
  }
  const access=['wardrobeModern','kitchenBaseCabinet'].includes(candidate.modelId)?B.furnitureAccessZone?.(candidate):null;if(access){if(access.some(p=>p.x<r.x+.02||p.x>r.x+r.w-.02||p.y<r.y+.02||p.y>r.y+r.h-.02))out.push('Thiếu khoảng đứng sử dụng trước tủ.');for(const other of rows)if(other.id!==candidate.id&&other.placementStatus!=='removed'&&other.pose.z<1.2&&intersects(access,B.furnitureFootprint(other)))out.push('Khoảng sử dụng trước tủ vướng '+(models[other.modelId]||other.modelId)+'.');}
  if(candidate.pose.z<1.2)for(const other of rows){if(other.id===candidate.id||other.placementStatus==='removed'||!setModels.has(candidate.modelId)&&!['wardrobeModern','kitchenBaseCabinet'].includes(other.modelId))continue;const zone=B.furnitureAccessZone?.(other);if(zone&&intersects(polygon,zone))out.push('Chắn khoảng sử dụng trước '+models[other.modelId]+'.');}
  if(r.type==='corridor'||r.type==='stairs'||r.type==='elevator')out.push('Giữ trống hành lang, thang và giếng thang máy.');
  return [...new Set(out)];
 };
 const reject=message=>{B.state.ui.planner.furnitureNotice=message;B.toast(message);return false;};
 const materialize=roomId=>{plan().furniture||=[];if(!plan().furniture.some(i=>i.roomId===roomId))plan().furniture.push(...B.generatedFurniture(room(roomId)));};
 const changed=()=>{B.rememberFinishCamera?.();B.save();B.render({preserveScroll:true});};
 B.editFurniture=(id,changes,{render=true}={})=>{
  if(!B.furnitureContractReady())return reject('Chưa ghép schema nội thất C01; không lưu thay đổi chưa thể khôi phục.');
  const item=B.resolvedFurniture(null,{includeRemoved:true}).find(i=>i.id===id);if(!item)return reject('Vật thể không còn trong dự án.');
  if(B.isRoomLocked(item.roomId)||item.locked&&!(Object.keys(changes).length===1&&changes.locked===false))return reject('Vật thể / phòng / tầng đang khóa.');
  if(Object.keys(changes).some(k=>!['pose','size','locked','placementStatus','materialBindings'].includes(k)))return reject('Chỉ sửa vị trí, góc, kích thước, khóa, xóa hoặc vật liệu; giữ ID và mẫu đồ.');
  if(changes.materialBindings!==undefined&&(!Array.isArray(changes.materialBindings)||changes.materialBindings.length>20))return reject('Danh sách vật liệu không hợp lệ.');
  const next={...item,...clone(changes),pose:{...item.pose,...changes.pose},size:{...item.size,...changes.size}};next.pose.rotationDeg=angle(next.pose.rotationDeg);
  if(next.placementStatus==='present'){const issues=B.furniturePlacementIssues(next);if(issues.length)return reject(issues.join(' '));}
  if(!B.furnitureRecordValid(next))return reject('Số đo không hợp lệ.');
  if(JSON.stringify(next)===JSON.stringify(item))return true;
  B.pushPlanHistory();materialize(item.roomId);const index=plan().furniture.findIndex(i=>i.id===id);plan().furniture[index]=next;
  B.state.ui.planner.selectedFurniture=id;B.state.ui.planner.furnitureNotice=changes.materialBindings!==undefined?'Đã lưu vật liệu riêng của món.':'Đã lưu · góc '+next.pose.rotationDeg+'°.';
  if(changes.materialBindings!==undefined){B.customerFrameCache=null;B.finishInvalidate?.();}
  if(render)changed();else B.save();return true;
 };
 B.rotateFurniture=(id,delta)=>{
  const item=B.resolvedFurniture().find(i=>i.id===id);
  if(!item||!Number.isFinite(delta))return false;
  return B.editFurniture(id,{pose:{rotationDeg:item.pose.rotationDeg+delta}});
 };
 // Facing follows the local mesh: seat backs/TV screens/cabinet fronts face -Z;
 // bed foot and toilet bowl face +Z. Symmetric tables have no asserted front.
 B.furnitureFacing=i=>{
  const negative=['loungeDesignSofa','loungeChair','loungeChairModern','chair','chairDesk','cabinetTelevision','televisionModern','bookcaseClosedWide','cabinetBed','wardrobeModern'];
  const sign=negative.includes(i.modelId)?-1:['bedDouble','bedSingle','toilet','washingMachine','kitchenSink','kitchenStove','kitchenFridge','kitchenBaseCabinet','kitchenWallCabinet','kitchenHood','kitchenFillerPanel'].includes(i.modelId)?1:0;
  const a=i.pose.rotationDeg*Math.PI/180;return {x:-Math.sin(a)*sign,y:Math.cos(a)*sign,defined:sign!==0};
 };
 B.furnitureDirectionSvg=i=>{
  const f=B.furnitureFacing(i);if(!f.defined)return '';
  const length=Math.min(i.size.width,i.size.depth)*.32,x=i.pose.x,y=i.pose.y,tx=x+f.x*length,ty=y+f.y*length,t=Math.min(.075,length*.4);
  return '<path class="furniture-facing" pointer-events="none" fill="none" stroke="#245b53" stroke-width=".025" d="M'+x+' '+y+' L'+tx+' '+ty+' M'+(tx-f.x*t-f.y*t)+' '+(ty-f.y*t+f.x*t)+' L'+tx+' '+ty+' L'+(tx-f.x*t+f.y*t)+' '+(ty-f.y*t-f.x*t)+'"><title>Hướng sử dụng</title></path>';
 };
 B.furnitureRotationHtml=(item,disabled)=>'<div class="team-b-rotation-controls" role="group" aria-label="Xoay món đang chọn"><button type="button" data-furniture-turn="-1" data-furniture-owner="'+esc(item.id)+'" '+disabled+'>↶ Xoay trái</button><label>Bước xoay<select data-furniture-turn-step>'+[15,45,90].map(n=>'<option value="'+n+'" '+((B.state.ui.planner.furnitureRotationStep||90)===n?'selected':'')+'>'+n+'°</option>').join('')+'</select></label><button type="button" data-furniture-turn="1" data-furniture-owner="'+esc(item.id)+'" '+disabled+'>Xoay phải ↷</button></div><small>Góc hiện tại '+item.pose.rotationDeg+'° · xoay quanh tâm món; bản vẽ và 3D dùng cùng hướng. Có thể nhập góc bất kỳ bên dưới.</small>';
 B.focusFurniture=id=>{
  const s=B.studio3d;if(!s?.scene||!s.camera||B.state.ui.designView!=='room'||B.state.ui.roomCamera==='inside')return false;
  let group;s.scene.traverse(o=>{if(o.userData.kind==='furniture'&&o.userData.furnitureId===id)group=o;});if(!group)return false;
  const T=s.THREE,bounds=new T.Box3().setFromObject(group);if(bounds.isEmpty())return false;
  const sphere=bounds.getBoundingSphere(new T.Sphere()),v=s.camera.fov*Math.PI/180,h=2*Math.atan(Math.tan(v/2)*s.camera.aspect);
  if(!Number.isFinite(sphere.radius)||sphere.radius<=0)return false;
  s.resetCameraValidation?.();s.scene.userData.furnitureCloseup=id;s.state.target.copy(sphere.center);s.state.dist=Math.max(s.state.minDist||1.5,sphere.radius/Math.sin(Math.min(v,h)/2)*1.12);s.state.pitch=.4;s.state.framed=true;s.state.updateCamera();B.rememberFinishCamera?.();B.$('#studio3dStage')?.scrollIntoView?.({block:'center',behavior:'smooth'});return true;
 };
 B.furnitureMaterialRoles=i=>{
  if(i.modelId==='tableCoffeeModern')return [['accent','Phần gỗ'],['floor','Đế đá / bề mặt khoáng']];
  if(['televisionModern','kitchenFridge','washingMachine','toilet','shower','floorLamp','pottedPlant','kitchenHood'].includes(i.modelId))return [];
  const roles=[['accent','Gỗ / bề mặt']];
  if(['sideTable','kitchenSink','kitchenStove','bathroomSink','kitchenBaseCabinet','kitchenFillerPanel'].includes(i.modelId)||i.modelId==='tableCoffee'&&['stone','travertine','nested'].includes(B.finishPalette(i.roomId).table))roles.push(['floor','Mặt đá']);
  if(['bedDouble','bedSingle','loungeDesignSofa','loungeChair','loungeChairModern','chair','chairDesk','bedBench','bedsideLamp'].includes(i.modelId))roles.push(['fabric','Vải / da']);
  return roles;
 };
 B.furnitureMaterialChoices=(i,role)=>B.furnitureMaterialRoles(i).some(([key])=>key===role)?B.VISUAL_MATERIALS.filter(p=>p.role===role&&(role!=='floor'||p.surface==='stone')):[];
 B.furnitureFinishPalette=i=>{
  const palette=clone(B.finishPalette(i.roomId));palette.visualMaterials||={};
  for(const binding of i.materialBindings||[]){const profile=B.VISUAL_MATERIALS.find(p=>p.id===binding.visualProfileId&&p.role===binding.role);if(profile&&['tableCoffeeModern','tableCoffee','sideTable','kitchenSink','kitchenStove','bathroomSink','kitchenBaseCabinet','kitchenFillerPanel'].includes(i.modelId||i.model)&&profile.role==='floor'&&profile.surface==='stone'){palette.stoneVisualMaterial=profile.id;}else if(profile&&['accent','fabric'].includes(profile.role)){palette.visualMaterials[profile.role]=profile.id;palette[profile.role]=profile.color;palette.catalogMaterials=B.clearCatalogSurface(palette,profile.role);}}
  return palette;
 };
 B.setFurnitureVisualMaterial=(id,role,profileId)=>{
  const item=B.resolvedFurniture().find(i=>i.id===id);if(!item||!B.furnitureMaterialRoles(item).some(([key])=>key===role))return false;const profile=B.furnitureMaterialChoices(item,role).find(p=>p.id===profileId);if(profileId&&!profile)return false;
  const bindings=clone(item.materialBindings||[]),index=bindings.findIndex(b=>b.role===role),existing=index>=0?bindings[index]:{role};
  const binding={...existing,role,visualProfileId:profile?.id||null,realWorldScale:profile?clone(profile.scale):null,textureAssetId:null,exactness:'generic'};
  if(index>=0)bindings[index]=binding;else bindings.push(binding);
  return B.editFurniture(id,{materialBindings:bindings});
 };
 B.addFurniture=(roomId,modelId)=>{
  if(!B.furnitureContractReady())return reject('Chờ schema nội thất C01 để thêm và lưu vật thể.');
  const r=room(roomId),d=B.FURNITURE_DIMENSIONS[modelId];if(!r||!models[modelId]||!d||B.isRoomLocked(roomId))return reject('Chọn phòng chưa khóa và mẫu hợp lệ.');
  const rows=B.resolvedFurniture(roomId);let candidate;
  for(let y=r.y+d.d/2+.05;y<r.y+r.h-d.d/2-.02&&!candidate;y+=.2)for(let x=r.x+d.w/2+.05;x<r.x+r.w-d.w/2-.02;x+=.2){
   const i={id:B.uid('furniture'),roomId,floor:r.floor,modelId,origin:'customer-added',placementStatus:'present',locked:false,pose:{x,y,z:B.FURNITURE_MOUNTING?.[modelId]||0,rotationDeg:0},size:{width:d.w,depth:d.d,height:d.h},materialBindings:[],costTreatment:'unconfirmed'};
   if(!B.furniturePlacementIssues(i,rows).length){candidate=i;break;}
  }
  if(!candidate)return reject('Không còn vị trí trống cho mẫu này. Dời / xóa đồ trước.');
  B.pushPlanHistory();materialize(roomId);plan().furniture.push(candidate);B.state.ui.planner.selectedFurniture=candidate.id;changed();return candidate;
 };
 // A proposal is derived from the current shared records, never an extra
 // renderer-only layout. The stamp covers geometry/openings/locks/materials.
 let setPreview=null;
 const setModels=new Set(['kitchenBaseCabinet','kitchenFillerPanel','kitchenWallCabinet','kitchenHood','wardrobeModern','bedsideLamp','bedBench']);
 const stampSet=r=>{let h=2166136261;const text=JSON.stringify({revision:B.drawingRevision?.(),r,rows:B.resolvedFurniture(r.id,{includeRemoved:true}),openings:plan().openings,fixtures:plan().fixtures,level:B.studioFloorLevel(r.floor),locked:B.isRoomLocked(r.id),style:B.state.project.style,finish:B.finishPalette(r.id)});for(let n=0;n<text.length;n++)h=Math.imul(h^text.charCodeAt(n),16777619);return(h>>>0).toString(16);};
 B.furnitureAccessZone=i=>{
  const reach={wardrobeModern:.60,kitchenBaseCabinet:.80,kitchenSink:.80,kitchenStove:.80,kitchenFridge:.65}[i.modelId];if(!reach||i.pose.z>.12)return null;
  const sign=i.modelId==='wardrobeModern'?-1:1,a=i.pose.rotationDeg*Math.PI/180,u={x:Math.cos(a),y:Math.sin(a)},f={x:-Math.sin(a)*sign,y:Math.cos(a)*sign},width=i.size.width/2-.005,near=i.size.depth/2+.005;
  return [[-width,near],[width,near],[width,near+reach],[-width,near+reach]].map(([x,y])=>({x:i.pose.x+u.x*x+f.x*y,y:i.pose.y+u.y*x+f.y*y}));
 };
 B.previewFurnitureSet=roomId=>{
  const r=room(roomId),result={ok:false,roomId,stamp:'',additions:[],updates:[],notices:[],skipped:[]};
  if(!r||!['kitchen','bed'].includes(r.type)){result.reason='Chọn phòng bếp hoặc phòng ngủ.';return result;}
  result.stamp=stampSet(r);if(!B.furnitureContractReady()||B.isRoomLocked(roomId)){result.reason='Phòng đang khóa hoặc dữ liệu nội thất chưa sẵn sàng.';return result;}
  const saved=B.resolvedFurniture(roomId,{includeRemoved:true}),rows=saved.filter(i=>i.placementStatus==='present').map(clone),removedModel=id=>saved.some(i=>i.modelId===id&&i.placementStatus==='removed'),has=id=>rows.some(i=>i.modelId===id),near=(a,b)=>Math.abs(a-b)<.002;
  const make=(modelId,x,y,z=0,turn=0,size)=>{const d=B.FURNITURE_DIMENSIONS[modelId];let n=0,id;do{id='furniture-set:'+roomId+':'+modelId+':'+n++;}while(saved.some(i=>i.id===id)||result.additions.some(i=>i.id===id));return{id,roomId,floor:r.floor,modelId,origin:'customer-added',placementStatus:'present',locked:false,pose:{x,y,z,rotationDeg:angle(turn)},size:size||{width:d.w,depth:d.d,height:d.h},materialBindings:[],costTreatment:'unconfirmed'};};
  const offer=(i,against=rows)=>{const issues=removedModel(i.modelId)?['Giữ trạng thái món đã xóa.']:B.furniturePlacementIssues(i,against);if(issues.length){if(!result.skipped.some(s=>s.modelId===i.modelId))result.skipped.push({modelId:i.modelId,reason:issues.join(' ')});return false;}result.additions.push(i);rows.push(i);return i;};
  if(r.type==='kitchen'){
   const stove=rows.find(i=>i.modelId==='kitchenStove'),sink=rows.find(i=>i.modelId==='kitchenSink');
   if(!stove){result.reason='Đặt bếp nấu theo bản vẽ trước khi đề xuất bộ tủ.';return result;}
   if(Math.abs(stove.pose.rotationDeg/90-Math.round(stove.pose.rotationDeg/90))>1e-6){result.reason='Bếp đang xoay góc riêng. Giữ bố trí hiện tại; thêm từng mô-đun ở mục bên dưới.';return result;}
   const a=stove.pose.rotationDeg*Math.PI/180,u={x:Math.cos(a),y:Math.sin(a)},f={x:-Math.sin(a),y:Math.cos(a)},height=B.furnitureWorktopHeight(stove),depth=stove.size.depth,origin=stove.pose;
   const along=p=>(p.x-origin.x)*u.x+(p.y-origin.y)*u.y,toPoint=(x,y)=>({x:origin.x+x*u.x+y*f.x,y:origin.y+x*u.y+y*f.y});
   if(sink&&!sink.locked&&sink.origin==='generated'&&near(sink.size.height,B.FURNITURE_DIMENSIONS.kitchenSink.h)&&!near(B.furnitureWorktopHeight(sink),height)){
    const next={...clone(sink),size:{...sink.size,height:height/.75}};
    if(!B.furniturePlacementIssues(next,rows).length){result.updates.push({before:clone(sink),after:next,reason:'Cân mặt bàn chậu rửa với bếp nấu'});Object.assign(sink,next);}
   }
   if(sink&&!near(B.furnitureWorktopHeight(sink),height))result.notices.push('Giữ chậu rửa đang khóa / có số đo riêng; mặt bàn hiện tại '+Math.round(B.furnitureWorktopHeight(sink)*1000)+' mm cần đối chiếu với bếp '+Math.round(height*1000)+' mm.');
   const row=rows.filter(i=>/^kitchen/.test(i.modelId)&&!['kitchenWallCabinet','kitchenHood'].includes(i.modelId)&&near(i.pose.rotationDeg,stove.pose.rotationDeg)&&i.pose.z<.12);
   const limits=box(r.x+.04,r.y+.04,r.w-.08,r.h-.08).map(along),low=Math.min(...limits),high=Math.max(...limits),spans=row.map(i=>[along(i.pose)-i.size.width/2,along(i.pose)+i.size.width/2]).sort((a,b)=>a[0]-b[0]);let cursor=low;
   for(const [start,end]of [...spans,[high,high]]){
    const gap=start-cursor,width=gap-.02;
    if(width>=.035){const p=toPoint((cursor+start)/2,0),modelId=width<.25?'kitchenFillerPanel':'kitchenBaseCabinet';offer(make(modelId,p.x,p.y,stove.pose.z,stove.pose.rotationDeg,{width,depth,height}));}cursor=Math.max(cursor,end);
   }
   const bases=rows.filter(i=>['kitchenSink','kitchenBaseCabinet'].includes(i.modelId)&&near(i.pose.rotationDeg,stove.pose.rotationDeg));
   for(const i of bases){const p={x:i.pose.x-f.x*(i.size.depth-.34)/2,y:i.pose.y-f.y*(i.size.depth-.34)/2};if(!rows.some(o=>o.modelId==='kitchenWallCabinet'&&Math.hypot(o.pose.x-p.x,o.pose.y-p.y)<.15))offer(make('kitchenWallCabinet',p.x,p.y,stove.pose.z+height+.62,stove.pose.rotationDeg,{width:i.size.width,depth:.34,height:.72}));}
   if(!has('kitchenHood')){const p=toPoint(0,-(depth-.48)/2);offer(make('kitchenHood',p.x,p.y,stove.pose.z+height+.68,stove.pose.rotationDeg));}
   result.notices.push('Mặt bàn đề xuất cao '+Math.round(height*1000)+' mm. Kích thước mô phỏng; khoảng cách hút mùi cần đối chiếu hướng dẫn thiết bị.');
  }else{
   const bed=rows.find(i=>/^bed(Double|Single)$/.test(i.modelId));if(!bed){result.reason='Đặt giường theo bản vẽ trước khi thêm bộ phòng ngủ.';return result;}
   if(!has('wardrobeModern')&&!removedModel('wardrobeModern')){
    const old=rows.find(i=>i.modelId==='bookcaseClosedWide'&&i.origin==='generated'&&!i.locked&&!i.materialBindings?.length),others=rows.filter(i=>i.id!==old?.id),candidates=[];
    if(old)candidates.push(make('wardrobeModern',old.pose.x,old.pose.y,old.pose.z,old.pose.rotationDeg));
    for(const width of [1.8,1.5,1.2,.9])for(const side of ['south','east','west','north']){
     const horizontal=['north','south'].includes(side),span=horizontal?r.w:r.h,step=Math.max(.15,(span-width)/20);if(span<width+.06)continue;
     for(let along=width/2+.03;along<=span-width/2-.03+1e-7;along+=step){const x=horizontal?r.x+along:side==='west'?r.x+.32:r.x+r.w-.32,y=horizontal?(side==='north'?r.y+.32:r.y+r.h-.32):r.y+along,turn={south:0,north:180,west:90,east:270}[side];candidates.push(make('wardrobeModern',x,y,0,turn,{width,depth:.6,height:2.4}));}
    }
    const candidate=candidates.find(i=>!B.furniturePlacementIssues(i,others).length);
    if(candidate){if(old){result.updates.push({before:clone(old),after:{...clone(old),placementStatus:'removed'},reason:'Đổi tủ thấp mặc định sang tủ áo, giữ món cũ trong đồ đã xóa'});rows.splice(rows.indexOf(old),1);}offer(candidate,others);}
    else result.notices.push('Chưa đủ chỗ cho tủ áo và khoảng đứng sử dụng; giữ nguyên bố trí, cần chỉnh phòng / đồ hiện có.');
   }
   const cabinets=rows.filter(i=>i.modelId==='cabinetBed'),angleBed=bed.pose.rotationDeg*Math.PI/180,u={x:Math.cos(angleBed),y:Math.sin(angleBed)};
   if(cabinets.length===1&&!removedModel('cabinetBed')){const old=cabinets[0],side=(old.pose.x-bed.pose.x)*u.x+(old.pose.y-bed.pose.y)*u.y;offer(make('cabinetBed',old.pose.x-2*side*u.x,old.pose.y-2*side*u.y,old.pose.z,old.pose.rotationDeg));}
   for(const c of rows.filter(i=>i.modelId==='cabinetBed'))if(!rows.some(i=>i.modelId==='bedsideLamp'&&Math.hypot(i.pose.x-c.pose.x,i.pose.y-c.pose.y)<.12))offer(make('bedsideLamp',c.pose.x,c.pose.y,c.pose.z+c.size.height,bed.pose.rotationDeg));
   if(!has('bedBench')){const f={x:-Math.sin(angleBed),y:Math.cos(angleBed)},d=B.FURNITURE_DIMENSIONS.bedBench,reach=bed.size.depth/2+d.d/2+.1;offer(make('bedBench',bed.pose.x+f.x*reach,bed.pose.y+f.y*reach,0,bed.pose.rotationDeg));}
  }
  result.ok=true;return result;
 };
 B.applyFurnitureSet=(roomId,expectedStamp)=>{
  const p=B.previewFurnitureSet(roomId);if(!p.ok)return reject(p.reason);if(p.stamp!==expectedStamp)return reject('Bản vẽ hoặc đồ đã đổi. Xem lại đề xuất mới trước khi áp dụng.');
  if(!p.additions.length&&!p.updates.length)return reject('Các món phù hợp đã có; giữ nguyên đồ đang chọn.');
  B.pushPlanHistory();materialize(roomId);
  for(const change of p.updates){const index=plan().furniture.findIndex(i=>i.id===change.before.id);plan().furniture[index]=clone(change.after);}
  plan().furniture.push(...p.additions.map(clone));B.state.ui.planner.furnitureNotice='Đã lưu '+p.additions.length+' món thêm và '+p.updates.length+' điều chỉnh vào cùng bản vẽ /3D.';B.customerFrameCache=null;B.finishInvalidate?.();setPreview=null;changed();return true;
 };
 B.furnitureSetPreviewPlan=p=>{
  if(!p?.ok)return null;const next=clone(plan());next.furniture||=[];
  if(!next.furniture.some(i=>i.roomId===p.roomId))next.furniture.push(...B.resolvedFurniture(p.roomId,{includeRemoved:true}));
  for(const c of p.updates){const n=next.furniture.findIndex(i=>i.id===c.before.id);if(n>=0)next.furniture[n]=clone(c.after);}
  next.furniture.push(...p.additions.map(clone));return next;
 };
 B.furnitureSetDrawingHtml=p=>{
  if(!p.ok||!B.withPlan||!B.interiorSheetSvg||!p.additions.length&&!p.updates.length)return '';const r=room(p.roomId),svg=B.withPlan(B.furnitureSetPreviewPlan(p),()=>B.interiorSheetSvg(r.floor));
  return '<figure class="team-b-depth-drawing"><img src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)+'" alt="Bản vẽ xem trước bộ nội thất · '+esc(r.name)+'"><figcaption>Cùng vị trí / số đo sẽ dùng trong3D · chưa thay bản vẽ đang lưu.</figcaption></figure>';
 };
 // Keep proposal generation and SVG work behind the customer's explicit action.
 // This transient view is scoped to the project and current measured inputs.
 B.showFurnitureSetPreview=roomId=>{
  const r=room(roomId);if(!r||!['kitchen','bed'].includes(r.type))return false;
  const proposal=B.previewFurnitureSet(roomId);
  setPreview={project:B.state.project,roomId,stamp:proposal.stamp,proposal,drawing:proposal.ok?B.furnitureSetDrawingHtml(proposal):''};
  for(const panel of document.querySelectorAll('[data-furniture-set-room]'))if(panel.dataset.furnitureSetRoom===roomId)panel.outerHTML=B.furnitureSetHtml(r);
  return proposal;
 };
 B.furnitureSetHtml=r=>{
  if(!['kitchen','bed'].includes(r.type))return '';
  const cached=setPreview?.project===B.state.project&&setPreview.roomId===r.id?setPreview:null,
   stale=!!cached&&cached.stamp!==stampSet(r),p=cached&&!stale?cached.proposal:null,
   label=r.type==='kitchen'?'Hoàn thiện bộ bếp':'Hoàn thiện bộ phòng ngủ',mm=v=>Math.round(v*1000),
   refresh='<button type="button" data-furniture-set-preview="'+esc(r.id)+'">'+(cached?'Xem lại đề xuất theo số đo':'Xem đề xuất theo số đo')+'</button>';
  const content=!p?(stale?'<p role="status">Thiết kế hoặc vật liệu đã đổi. Xem lại đề xuất trước khi áp dụng.</p>':'')+refresh:
   p.ok?cached.drawing+'<ul>'+p.additions.map(i=>'<li>'+esc(models[i.modelId])+' · '+mm(i.size.width)+' × '+mm(i.size.depth)+' × '+mm(i.size.height)+' mm'+(i.pose.z?' · đáy cao '+mm(i.pose.z)+' mm':'')+'</li>').join('')+p.updates.map(c=>'<li>'+esc(c.reason)+' · '+esc(models[c.before.modelId])+(c.after.placementStatus==='removed'?'':': cao '+mm(c.before.size.height)+' → '+mm(c.after.size.height)+' mm')+'</li>').join('')+'</ul>'+p.notices.map(n=>'<p>'+esc(n)+'</p>').join('')+p.skipped.map(i=>'<small>Chưa thêm '+esc(models[i.modelId])+': '+esc(i.reason)+'</small>').join('')+(p.additions.length||p.updates.length?'<button type="button" data-furniture-set="'+esc(r.id)+'" data-furniture-set-stamp="'+p.stamp+'">Áp dụng các món phù hợp</button>':'<p>Đã có các món phù hợp hoặc không còn chỗ trống. Có thể thêm từng món bên dưới.</p>'):
   '<p role="status">'+esc(p.reason)+'</p>'+refresh;
  return '<details class="team-b-furniture-set" data-furniture-set-room="'+esc(r.id)+'" '+(cached?'open':'')+'><summary>'+label+'</summary><p>Đề xuất từ số đo phòng và đồ hiện có. Xem danh sách trước khi áp dụng; giữ các món đã khóa / xóa.</p>'+content+'<small>Mẫu BMH theo kích thước; chưa phải sản phẩm hãng hoặc cấu tạo lắp đặt được duyệt.</small></details>';
 };
 B.roomFurnitureLayout=r=>B.resolvedFurniture(r.id).map(i=>{
  const poly=B.furnitureFootprint(i),xs=poly.map(p=>p.x),ys=poly.map(p=>p.y);
  return {...i,model:i.modelId,x:Math.min(...xs),y:Math.min(...ys),w:Math.abs(Math.sin(i.pose.rotationDeg*Math.PI/180))<1e-10?i.size.width:Math.abs(Math.cos(i.pose.rotationDeg*Math.PI/180))<1e-10?i.size.depth:Math.max(...xs)-Math.min(...xs),d:Math.abs(Math.sin(i.pose.rotationDeg*Math.PI/180))<1e-10?i.size.depth:Math.abs(Math.cos(i.pose.rotationDeg*Math.PI/180))<1e-10?i.size.width:Math.max(...ys)-Math.min(...ys),h:i.size.height,base:i.pose.z,rotation:i.pose.rotationDeg};
 });
 // Measured plan symbols use the same local axes and pose as the 3D asset.
 // Internal lines are schematic furniture notation, not manufacturer details.
 B.furniturePlanSymbol=i=>{
  const w=i.size?.width,d=i.size?.depth,p=i.pose;
  if(!p||![w,d,p.x,p.y,p.rotationDeg].every(Number.isFinite)||w<=0||d<=0)return '';
  const rect=(x,y,a,b,r=0)=>'<rect x="'+x*w+'" y="'+y*d+'" width="'+a*w+'" height="'+b*d+'" rx="'+r*Math.min(w,d)+'"/>',
   line=(x,y,a,b)=>'<path fill="none" d="M'+x*w+' '+y*d+' L'+a*w+' '+b*d+'"/>',
   ellipse=(x,y,a,b)=>'<ellipse cx="'+x*w+'" cy="'+y*d+'" rx="'+a*w+'" ry="'+b*d+'"/>',id=i.modelId;
  let detail='',kind='cabinet';
  if(/^(bedDouble|bedSingle)$/.test(id)){
   kind='bed';detail=rect(-.48,-.49,.96,.07)+rect(-.45,-.40,.9,.86,.035)+line(-.45,-.12,.45,-.12);
   const n=id==='bedDouble'?2:1;for(let j=0;j<n;j++)detail+=rect(-.4+j*.8/n,-.36,.72/n,.18,.04);
  }else if(/^(lounge|chair)/.test(id)){
   kind='seat';detail=rect(-.47,.32,.94,.15,.04)+rect(-.47,-.45,.12,.77,.035)+rect(.35,-.45,.12,.77,.035);
   const n=id==='loungeDesignSofa'?3:1;for(let j=0;j<n;j++)detail+=rect(-.33+j*.66/n,-.40,.60/n,.67,.04);
  }else if(id==='toilet'){
   kind='toilet';detail=rect(-.40,-.47,.8,.25,.04)+ellipse(0,.1,.38,.35)+ellipse(0,.10,.25,.24);
  }else if(/Sink$/.test(id)){
   kind='sink';detail=rect(-.46,-.46,.92,.92,.03)+ellipse(0,.03,.34,.29)+ellipse(0,.03,.035,.035)+line(0,-.4,0,-.18);
  }else if(id==='kitchenStove'){
   kind='hob';detail=rect(-.46,-.46,.92,.92,.03);for(const x of [-.23,.23])for(const y of [-.23,.23])detail+=ellipse(x,y,.14,.14);
  }else if(id==='shower'){
   kind='shower';detail=rect(-.47,-.47,.94,.94)+line(-.47,-.47,.47,.47)+line(.47,-.47,-.47,.47)+ellipse(0,0,.06,.06);
  }else if(id==='televisionModern'){
   kind='tv';detail=rect(-.48,-.1,.96,.2)+rect(-.18,.1,.36,.25)+line(-.4,-.2,.4,-.2);
  }else if(id==='washingMachine'){
   kind='washer';detail=rect(-.46,-.46,.92,.92,.03)+line(-.46,.32,.46,.32)+line(-.22,.44,.22,.44);
  }else if(id==='pottedPlant'){
   kind='plant';detail=ellipse(0,0,.22,.22);for(let n=0;n<6;n++){const a=n*Math.PI/3;detail+=ellipse(Math.cos(a)*.23,Math.sin(a)*.23,.18,.18);}
  }else if(id==='bedBench'){
   kind='bench';detail=rect(-.47,-.44,.94,.88,.08)+line(-.42,0,.42,0);
  }else if(id==='floorLamp'||id==='bedsideLamp'){
   kind='lamp';detail=ellipse(0,0,.44,.44)+ellipse(0,0,.08,.08);
  }else if(/^(table|sideTable|desk)/.test(id)){
   kind='table';detail=rect(-.46,-.46,.92,.92,.04);if(id==='desk')detail+=rect(-.28,-.3,.56,.30,.01);
  }else{
   detail=rect(-.46,-.46,.92,.92)+line(0,-.46,0,.46)+line(-.30,-.35,-.15,-.35)+line(.15,-.35,.30,-.35);
  }
  return '<g class="furniture-plan-symbol" data-symbol-kind="'+kind+'" data-symbol-model="'+esc(id)+'" data-mount-height="'+(p.z||0)+'" stroke-dasharray="'+((p.z||0)>1.2?'.05 .025':'none')+'" transform="translate('+p.x+' '+p.y+') rotate('+p.rotationDeg+')" pointer-events="none" fill="#faf8f3" stroke="#536b70" stroke-width=".018">'+detail+'</g>';
 };
 const oldSvg=B.furnitureSvg;B.furnitureSvg=r=>{
  if(['stairs','garage'].includes(r.type))return oldSvg(r);
  return '<g class="furniture team-b-furniture" stroke="#687c80" fill="#e7e0d4" stroke-width=".025">'+B.resolvedFurniture(r.id).map(i=>'<g data-furniture-id="'+esc(i.id)+'" tabindex="0" role="button" aria-label="'+esc(models[i.modelId])+'" class="'+(selected()===i.id?'selected':'')+'"><polygon points="'+B.furnitureFootprint(i).map(p=>p.x+','+p.y).join(' ')+'"/>'+B.furniturePlanSymbol(i)+B.furnitureDirectionSvg(i)+'<title>'+esc(models[i.modelId])+' · '+i.size.width+' × '+i.size.depth+' m · '+i.pose.rotationDeg+'° · Ký hiệu quy ước theo kích thước</title></g>').join('')+'</g>'+B.planFixtures(r.id).map(q=>'<g class="furniture altar-symbol" data-fixture-reference="'+esc(q.id)+'"><rect x="'+q.x+'" y="'+q.y+'" width="'+q.w+'" height="'+q.d+'"/><title>Bàn thờ</title></g>').join('');
 };
 // Scale vendored assets from catalog dimensions to the customer's saved size.
 B.furnitureExportScale=i=>{
  const d=B.FURNITURE_DIMENSIONS[i.modelId],factor=(['loungeChairModern','tableCoffeeModern'].includes(i.modelId)||setModels.has(i.modelId))?100:200;
  return d?{scale_x:factor*i.size.width/d.w,scale_y:factor*i.size.height/d.h,scale_z:factor*i.size.depth/d.d}:{scale_x:factor,scale_y:factor,scale_z:factor};
 };
 B.furnitureAssetUrl=id=>id==='tableCoffeeModern'?'../interior/models/modern-coffee-table.glb':id==='loungeChairModern'?'../interior/models/modern-armchair-facing.glb':setModels.has(id)?'../interior/models/'+id+'.glb':'models/'+id+'.glb';
 const doc=B.architectDocument;B.architectDocument=focus=>{
  const result=doc(focus);for(const [f,level] of result.levels.entries()){
   const rows=B.resolvedFurniture().filter(i=>i.floor===f&&(!focus?.startsWith('room:')||i.roomId===focus.slice(5)));
   const items=rows.map(i=>({id:i.id,item_name:i.modelId,item_type:1,format:'gltf',model_url:B.furnitureAssetUrl(i.modelId),xpos:i.pose.x*100,zpos:i.pose.y*100,ypos:i.pose.z*100,rotation:-i.pose.rotationDeg*Math.PI/180,...B.furnitureExportScale(i),fixed:i.locked===true}));
   if(f===0)result.items=[...(result.items||[]).filter(i=>i.item_type!==1),...items];else level.items=[...(level.items||[]).filter(i=>i.item_type!==1),...items];
  }return result;
 };
 const snapshot=B.customerDesignSnapshot;B.customerDesignSnapshot=()=>{const result=snapshot();result.project.furniture=B.resolvedFurniture(null,{includeRemoved:true}).map(i=>({...Object.fromEntries(['id','roomId','floor','modelId','origin','placementStatus','locked','pose','size','costTreatment'].filter(k=>i[k]!==undefined).map(k=>[k,clone(i[k])])),materialBindings:(i.materialBindings||[]).map(b=>Object.fromEntries(['role','productId','sku','specification','quantityUnit','visualProfileId','textureAssetId','realWorldScale','exactness','costTreatment','sourceUrl','licence'].filter(k=>b[k]!==undefined).map(k=>[k,clone(b[k])]))) }));return result;};
 const structure=B.studioStructureKey,signature=B.cinematicSignature;
 B.studioStructureKey=()=>structure()+'|furniture:'+JSON.stringify(B.resolvedFurniture());
 B.cinematicSignature=focus=>signature(focus)+'|furniture:'+JSON.stringify(B.resolvedFurniture());
 const commit=B.commitDirectPlan;B.commitDirectPlan=(next,selection,options)=>{
  if(Array.isArray(plan().furniture)){
   next=clone(next);next.furniture=clone(next.furniture||plan().furniture);
   for(const i of next.furniture){const old=room(i.roomId),r=next.rooms.find(r=>r.id===i.roomId);if(!r){i.placementStatus='removed';continue;}if(old){i.pose.x+=r.x-old.x;i.pose.y+=r.y-old.y;i.floor=r.floor;
    if(i.placementStatus==='present'&&B.furnitureFootprint(i).some(p=>p.x<r.x+.02||p.x>r.x+r.w-.02||p.y<r.y+.02||p.y>r.y+r.h-.02))return reject('Đổi phòng khiến đồ nội thất xuyên tường; dời đồ trước.');
   }}
  }return commit(next,selection,options);
 };
 B.furnitureCatalogueHtml=id=>{
  const d=B.FURNITURE_DIMENSIONS[id];if(!models[id]||!d)return '';
  const mm=n=>Math.round(n*1000).toLocaleString('vi-VN');
  return '<figure class="team-b-catalogue-preview" data-catalogue-model="'+esc(id)+'"><img src="assets/interior/catalogue/'+encodeURIComponent(id)+'.webp" width="480" height="360" loading="lazy" decoding="async" alt="Mô hình '+esc(models[id])+' với bề mặt trung tính"><figcaption><strong>'+esc(models[id])+'</strong><span>Rộng '+mm(d.w)+' × sâu '+mm(d.d)+' × cao '+mm(d.h)+' mm</span><small>'+(['loungeChairModern','tableCoffeeModern'].includes(id)?'Mẫu thư viện Poly Haven · CC0.':'Mẫu mô phỏng BMH; kiểu dáng theo bộ nội thất.')+' Ảnh xem trước dùng bề mặt trung tính, không phải ảnh sản phẩm hãng. Xem vật liệu đã chọn trong phòng 3D.</small></figcaption></figure>';
 };
 B.furnitureEditorHtml=()=>{
  const ui=B.state.ui,r=B.state.ui.step===6?(room((ui.sceneFocus||'').replace(/^room:/,''))||room(ui.modelRoomId)):B.selectedRoom();if(!r)return '';
  const catalogueModel=models[ui.planner.furnitureCatalogueModel]?ui.planner.furnitureCatalogueModel:'bedDouble';
  const rows=B.resolvedFurniture(r.id,{includeRemoved:true}),item=rows.find(i=>i.id===selected()&&i.placementStatus==='present'),ready=B.furnitureContractReady(),disabled=(!ready||B.isRoomLocked(r.id)||item?.locked)?'disabled':'';
  return B.furnitureSetHtml(r)+'<details class="team-b-furniture-editor" '+(selected()?'open':'')+'><summary>Nội thất từng món · '+esc(r.name)+'</summary><div><p>Chọn trên bản vẽ / mô hình; kéo để dời, nhập góc bất kỳ. Vật thể mô phỏng theo số đo.</p>'+(!ready?'<p role="status">Chỉnh từng món nội thất chưa sẵn sàng trong bản này. Bạn vẫn xem được bố trí hiện tại.</p>':'')+'<label>Vật thể<select data-furniture-select><option value="">Chọn một món</option>'+rows.filter(i=>i.placementStatus==='present').map(i=>'<option value="'+esc(i.id)+'" '+(item?.id===i.id?'selected':'')+'>'+esc(models[i.modelId])+(i.locked?' · khóa':'')+'</option>').join('')+'</select></label>'+(item?(ui.step===6&&ui.designView==='room'&&ui.roomCamera!=='inside'?'<button type="button" data-furniture-focus="'+esc(item.id)+'">Xem gần trong 3D</button>':'')+B.furnitureRotationHtml(item,disabled)+'<form data-furniture-pose="'+esc(item.id)+'" class="team-b-pose-fields">'+[['x','Tâm X / m',item.pose.x],['y','Tâm Y / m',item.pose.y],['z','Cao độ đáy / m',item.pose.z],['rotationDeg','Góc / °',item.pose.rotationDeg]].map(([k,label,v])=>'<label>'+label+'<input name="'+k+'" type="number" step="any" value="'+v+'" '+disabled+' required></label>').join('')+'<button '+disabled+'>Áp dụng vị trí / góc</button></form><div class="team-b-item-actions"><button data-furniture-lock="'+esc(item.id)+'" '+(!ready||B.isRoomLocked(r.id)?'disabled':'')+'>'+(item.locked?'Mở khóa':'Khóa món này')+'</button><button data-furniture-remove="'+esc(item.id)+'" '+disabled+'>Xóa món này</button></div>':'')+(item?'<details><summary>Kích thước mẫu · '+esc(models[item.modelId])+'</summary><form data-furniture-size="'+esc(item.id)+'" class="team-b-pose-fields">'+[['width','Rộng / m'],['depth','Sâu / m'],['height','Cao / m']].map(([k,label])=>'<label>'+label+'<input name="'+k+'" type="number" min="0.01" step="any" value="'+item.size[k]+'" '+disabled+' required></label>').join('')+'<button '+disabled+'>Lưu kích thước</button></form><small>Nhập số đo từ sản phẩm bạn chọn. Hình dáng hiện là mẫu mô phỏng BMH, chưa phải model được hãng xác nhận.</small></details><details><summary>Vật liệu riêng của món</summary>'+B.furnitureMaterialRoles(item).map(([role,label])=>'<label>'+label+'<select data-furniture-material="'+role+'" data-furniture-owner="'+esc(item.id)+'" '+disabled+'><option value="">Theo phòng / phong cách</option>'+B.furnitureMaterialChoices(item,role).map(p=>'<option value="'+p.id+'" '+((item.materialBindings||[]).some(b=>b.role===role&&b.visualProfileId===p.id)?'selected':'')+'>'+esc(p.name)+'</option>').join('')+'</select></label>').join('')+'<small>'+(B.furnitureMaterialRoles(item).length?'Bề mặt BMH mô phỏng; giữ SKU đã chọn, cần đối chiếu mẫu thực.':'Mẫu này giữ bề mặt theo mô hình, chưa hỗ trợ đổi vật liệu riêng.')+'</small></details>':'')+'<div class="team-b-item-history"><button type="button" data-plan-undo '+(!B.planHistory.undo.length?'disabled':'')+'>Hoàn tác</button><button type="button" data-plan-redo '+(!B.planHistory.redo.length?'disabled':'')+'>Làm lại</button></div><p role="status" aria-live="polite">'+esc(ui.planner.furnitureNotice||'')+'</p><details '+(rows.some(i=>i.placementStatus==='removed')?'open':'')+'><summary>Thêm món / đồ đã xóa</summary><form data-furniture-add="'+esc(r.id)+'"><label>Mẫu đồ<select name="modelId">'+Object.entries(models).map(([id,label])=>'<option value="'+id+'" '+(id===catalogueModel?'selected':'')+'>'+label+'</option>').join('')+'</select></label><div data-furniture-catalogue aria-live="polite">'+B.furnitureCatalogueHtml(catalogueModel)+'</div><button '+(!ready||B.isRoomLocked(r.id)?'disabled':'')+'>Thêm vào phòng</button></form>'+rows.filter(i=>i.placementStatus==='removed').map(i=>'<button data-furniture-restore="'+esc(i.id)+'" '+(!ready?'disabled':'')+'>Khôi phục '+esc(models[i.modelId])+'</button>').join('')+'</details></div></details>';
 };
 B.roomDepthDrawingHtml=p=>{
  if(!p?.ok||!B.withPlan||!B.interiorSheetSvg)return '';
  const room=p.plan.rooms.find(r=>r.id===p.request.roomId);if(!room)return '';
  const svg=B.withPlan(p.plan,()=>B.interiorSheetSvg(room.floor));
  return '<figure class="team-b-depth-drawing"><img src="data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg)+'" alt="Bản vẽ tầng '+(room.floor+1)+' theo phương án số đo đang xem trước"><figcaption>Bản vẽ xem trước · tầng '+(room.floor+1)+' · chưa thay thiết kế đang lưu. Các ký hiệu nội thất là quy ước theo kích thước.</figcaption></figure>';
 };
 B.roomDepthEditorHtml=()=>{
  const r=B.selectedRoom();if(!r||r.type!=='bed'||!B.previewRoomDepthChange)return '';
  const p=B.roomDepthPreviewProject===B.state.project&&B.roomDepthPreview?.request?.roomId===r.id?B.roomDepthPreview:null,labels={unassigned:'Chưa phân công năng',office:'Phòng làm việc',laundry:'Phòng giặt',storage:'Kho',loggia:'Loggia',terrace:'Sân thượng'};
  const mm=n=>Math.round(n*1000).toLocaleString('vi-VN')+' mm';
  const preview=p?.ok?'<div class="team-b-depth-preview" role="status"><p>Phòng: '+mm(p.room.before.width)+' × '+mm(p.room.before.depth)+' → '+mm(p.room.after.width)+' × '+mm(p.room.after.depth)+'. Phần còn lại: '+mm(p.released.w)+' × '+mm(p.released.h)+' · '+esc(labels[p.request.releasedUse])+'.</p>'+B.roomDepthDrawingHtml(p)+'<p>'+esc(p.notice)+'</p><button type="button" data-room-depth-apply="'+esc(r.id)+'">Áp dụng phương án này vào bản vẽ</button><small>Dự toán cần bóc lại cùng revision; chưa suy số tiền từ diện tích.</small></div>':p?'<p role="alert">'+esc(p.reason)+'</p>':'';
  return '<details class="team-b-room-depth" '+(p?'open':'')+'><summary>Số đo phòng & phân bổ diện tích · '+esc(r.name)+'</summary><p>Hiện tại '+mm(r.w)+' × '+mm(r.h)+'. Xem trước trước khi đổi; bản vẽ và 3D dùng cùng phòng, cửa và nội thất.</p><form data-room-depth-preview="'+esc(r.id)+'"><label>Chiều sâu phòng mới / m<input name="depth" type="number" step="any" min="2.95" max="'+r.h+'" value="'+(p?.request?.depth??r.h)+'" required></label><label>Giữ vị trí cạnh<select name="anchor"><option value="front" '+(p?.request?.anchor!=='rear'?'selected':'')+'>Giữ cạnh trước</option><option value="rear" '+(p?.request?.anchor==='rear'?'selected':'')+'>Giữ cạnh sau</option></select></label><label>Phần diện tích còn lại<select name="releasedUse">'+Object.entries(labels).map(([id,label])=>'<option value="'+id+'" '+(p?.request?.releasedUse===id?'selected':'')+'>'+label+'</option>').join('')+'</select></label><label>Nguồn lựa chọn của khách<input name="sourceReference" maxlength="240" value="'+esc(p?.request?.sourceReference||'')+'" placeholder="Yêu cầu khách / mã hồ sơ"></label><button>Xem phương án theo số đo</button></form>'+preview+'<small>Hiện hỗ trợ thu chiều sâu phòng ngủ. Loggia/sân thượng chỉ hỗ trợ tầng trên cùng, mái bằng không đua. Không tự thay tầng, mái hoặc công năng.</small></details>';
 };
 B.previewSelectedRoomDepth=request=>{B.roomDepthPreviewProject=B.state.project;const result=B.previewRoomDepthChange(request);B.roomDepthPreview=result.ok?result:{...result,request:{...request}};B.render({preserveScroll:true});return B.roomDepthPreview;};
 B.applySelectedRoomDepth=()=>{const p=B.roomDepthPreview;if(!p?.ok||B.roomDepthPreviewProject!==B.state.project||p.request.roomId!==B.selectedRoom()?.id)return false;const applied=B.applyRoomDepthChange(p);if(applied){B.roomDepthPreview=null;B.render({preserveScroll:true});}return applied;};
 document.addEventListener('submit',e=>{if(!e.target.matches?.('[data-room-depth-preview]'))return;e.preventDefault();const v=Object.fromEntries(new FormData(e.target));B.previewSelectedRoomDepth({roomId:e.target.dataset.roomDepthPreview,depth:Number(v.depth),anchor:v.anchor,releasedUse:v.releasedUse,sourceReference:v.sourceReference});});
 document.addEventListener('click',e=>{if(e.target.closest?.('[data-room-depth-apply]'))B.applySelectedRoomDepth();});
 const editor=B.screen5,studio=B.screen7;B.screen5=()=>editor()+B.furnitureEditorHtml()+B.roomDepthEditorHtml();B.SCREENS[3]=B.screen5;B.screen7=()=>studio()+B.furnitureEditorHtml();B.SCREENS[5]=B.screen7;
 const select=id=>{B.state.ui.planner.selectedFurniture=id;const i=B.resolvedFurniture().find(i=>i.id===id);if(i)B.state.ui.planner.selected=i.roomId;B.rememberFinishCamera?.();B.render({preserveScroll:true});};
 document.addEventListener('click',e=>{const preview=e.target.closest?.('[data-furniture-set-preview]');if(preview){B.showFurnitureSetPreview(preview.dataset.furnitureSetPreview);return;}const button=e.target.closest?.('[data-furniture-set]');if(button)B.applyFurnitureSet(button.dataset.furnitureSet,button.dataset.furnitureSetStamp);});
 document.addEventListener('submit',e=>{const form=e.target;if(form.matches?.('[data-furniture-pose]')){e.preventDefault();const data=Object.fromEntries(new FormData(form));B.editFurniture(form.dataset.furniturePose,{pose:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,Number(v)]))});}else if(form.matches?.('[data-furniture-size]')){e.preventDefault();const data=Object.fromEntries(new FormData(form));B.editFurniture(form.dataset.furnitureSize,{size:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,Number(v)]))});}else if(form.matches?.('[data-furniture-add]')){e.preventDefault();B.addFurniture(form.dataset.furnitureAdd,new FormData(form).get('modelId'));}});
 document.addEventListener('change',e=>{if(e.target.matches?.('[data-furniture-add] select[name="modelId"]')){const id=e.target.value;if(models[id]){B.state.ui.planner.furnitureCatalogueModel=id;const preview=e.target.closest('form').querySelector('[data-furniture-catalogue]');if(preview)preview.innerHTML=B.furnitureCatalogueHtml(id);}return;}if(e.target.matches?.('[data-furniture-turn-step]')){const n=Number(e.target.value);if([15,45,90].includes(n))B.state.ui.planner.furnitureRotationStep=n;}else if(e.target.matches?.('[data-furniture-select]'))select(e.target.value);else if(e.target.matches?.('[data-furniture-material]'))B.setFurnitureVisualMaterial(e.target.dataset.furnitureOwner,e.target.dataset.furnitureMaterial,e.target.value);});
 document.addEventListener('click',e=>{
  const focus=e.target.closest?.('[data-furniture-focus]');if(focus){B.focusFurniture(focus.dataset.furnitureFocus);return;}
  const turn=e.target.closest?.('[data-furniture-turn]');if(turn){B.rotateFurniture(turn.dataset.furnitureOwner,Number(turn.dataset.furnitureTurn)*(B.state.ui.planner.furnitureRotationStep||90));return;}
  const t=e.target.closest?.('[data-furniture-lock],[data-furniture-remove],[data-furniture-restore]');if(!t)return;
  if(t.dataset.furnitureLock){const i=B.resolvedFurniture().find(i=>i.id===t.dataset.furnitureLock);if(i)B.editFurniture(i.id,{locked:!i.locked});}
  else B.editFurniture(t.dataset.furnitureRemove||t.dataset.furnitureRestore,{placementStatus:t.dataset.furnitureRemove?'removed':'present'});
 });
 let drag;
 document.addEventListener('pointerdown',e=>{
  const target=e.target.closest?.('[data-furniture-id]');if(!target||B.state.ui.step!==4||B.state.ui.planner.tool!=='select'||B.state.ui.planner.directTool!=='select')return;
  e.stopImmediatePropagation();e.preventDefault();const id=target.dataset.furnitureId,i=B.resolvedFurniture().find(i=>i.id===id),svg=target.closest('svg');if(!i||!svg)return;
  B.state.ui.planner.selectedFurniture=id;B.state.ui.planner.selected=i.roomId;
  drag={id,item:i,svg,target,start:B.svgPoint(e,svg),pointer:e.pointerId,last:i.pose};target.setPointerCapture?.(e.pointerId);
 },true);
 document.addEventListener('pointermove',e=>{
  if(!drag||e.pointerId!==drag.pointer)return;e.preventDefault();const point=B.svgPoint(e,drag.svg),pose={...drag.item.pose,x:drag.item.pose.x+point.x-drag.start.x,y:drag.item.pose.y+point.y-drag.start.y},next={...drag.item,pose};drag.last=pose;
  drag.target.querySelector('polygon').setAttribute('points',B.furnitureFootprint(next).map(p=>p.x+','+p.y).join(' '));drag.target.querySelector('.furniture-facing')?.remove();drag.target.insertAdjacentHTML('beforeend',B.furnitureDirectionSvg(next));
 },true);
 const stop=e=>{if(!drag||e.pointerId!==drag.pointer)return;const d=drag;drag=null;if(e.type!=='pointercancel'&&Math.hypot(d.last.x-d.item.pose.x,d.last.y-d.item.pose.y)>.005){if(!B.editFurniture(d.id,{pose:d.last}))B.render({preserveScroll:true});}else select(d.id);};
 document.addEventListener('pointerup',stop,true);document.addEventListener('pointercancel',stop,true);
 document.addEventListener('keydown',e=>{if(e.target.closest?.('[data-furniture-id]')&&['Enter',' '].includes(e.key)){e.preventDefault();select(e.target.closest('[data-furniture-id]').dataset.furnitureId);}});
})();

