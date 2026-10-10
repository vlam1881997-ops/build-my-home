/* Shared architectural finish geometry. It decorates measured walls; it never
 * creates a room, opening, balcony or structural member. All dimensions are m. */
(()=>{
 const B=BMH,hex=v=>/^#[0-9a-f]{6}$/i.test(v||''),revision='architectural-identity-2';
 // Each style has a distinct composition, rather than a colour-only variant.
 const rules=[
  ['modern','Khung sâu & đường ngang','metal','frame','horizontal',.075,.20,0,'#394443',0],
  ['minimal','Mảng phẳng & khe âm','plaster','reveal','quiet',.035,.08,0,'#ddd8cd',0],
  ['contemporary','Khung lệch & mảng đá','stone','offset','horizontal',.20,.30,0,'#9e9b8d',0],
  ['classic','Phào nhiều lớp & trụ trang trí','plaster','classical','cornice',.17,.30,.36,'#f1e8d5',2],
  ['neo','Phào gọn & tỷ lệ đứng','plaster','classical','cornice',.105,.22,.24,'#eee8db',1],
  ['indochine','Cửa chớp & vòm trang trí','wood','arched','cornice',.12,.25,.44,'#3c4b3d',2],
  ['mediterranean','Vữa sáng & vòm mềm','plaster','arched','quiet',.14,.26,.50,'#ece2cb',0],
  ['scandi','Gỗ sáng & nhịp đứng','wood','reveal','horizontal',.045,.12,0,'#b5a07b',0],
  ['japandi','Mảng gỗ liền & khung mảnh','wood','reveal','quiet',.055,.18,0,'#a28762',0],
  ['japanese','Nhịp gỗ & lam che nắng','wood','screen','horizontal',.09,.38,0,'#65563e',1],
  ['tropical','Lam thoáng & bóng đổ sâu','wood','screen','horizontal',.10,.48,0,'#788065',0],
  ['artdeco','Khung bậc & nhịp đứng','metal','stepped','deco',.11,.18,0,'#9a7948',1],
  ['french','Khung cửa cao & phào cổ điển','plaster','classical','cornice',.155,.28,.30,'#e9e0cd',2],
  ['spanish','Vòm sâu & sắc đất nung','plaster','arched','cornice',.18,.28,.46,'#aa6747',1],
  ['tuscan','Đá chân tường & cửa chớp','stone','shutter','cornice',.10,.22,.22,'#988261',0],
  ['craftsman','Khung gỗ rộng & chân đá','wood','wide','horizontal',.12,.30,0,'#726749',1],
  ['tudor','Nhịp gỗ chéo trên tường sáng','wood','timber','horizontal',.085,.14,0,'#4f3d2c',2],
  ['barn','Ván đứng & khung kim loại mảnh','metal','reveal','quiet',.055,.075,0,'#343e3b',0],
  ['midcentury','Nhịp ngang thấp & gỗ ấm','wood','wide','horizontal',.065,.32,0,'#977756',0],
  ['industrial','Gạch trần & khung thép','brick','frame','horizontal',.085,.18,0,'#a66e4d',1],
  ['brutalist','Bê tông & khung bóng đổ sâu','concrete','frame','quiet',.24,.34,0,'#aaa99d',0],
  ['coastal','Ván sáng & khung nhẹ','plaster','shutter','horizontal',.065,.17,0,'#bdcfc9',0],
  ['vietnamese','Hiên ngang & nhịp gỗ','wood','screen','cornice',.095,.36,0,'#865a3b',1],
  ['balinese','Lam gỗ & chân đá tự nhiên','wood','screen','horizontal',.12,.44,0,'#7d684a',0]
 ];
 B.ARCHITECTURAL_IDENTITIES=Object.fromEntries(rules.map(([id,name,surface,surround,band,trim,shade,arch,color,grid])=>[id,{id,name,surface,surround,band,trim,shade,arch,color,grid}]));
 B.architecturalIdentity=()=>B.ARCHITECTURAL_IDENTITIES[B.houseStyle()?.id]||{id:null,name:'Phong cách riêng',surface:'plaster',surround:'none',band:'quiet',trim:0,shade:0,arch:0,color:'#c8c2b6',grid:0};
 B.styleModelSummaryHtml=()=>{
  const roof=B.roofDesignSpec(),manual=B.measuredDesignSettings().roof.type!=='auto',rule=B.architecturalIdentity(),f=B.state.project.materials.finish||{};
  const custom=[f.exterior,...Object.values(f.rooms||{})].some(row=>row&&['floor','wall','accent','fabric'].some(role=>row.styleRoles?.[role]!==true&&(hex(row[role])||row.visualMaterials?.[role])));
  return '<p class="style-model-summary">'+B.esc(rule.name)+' · '+B.esc(roof.name)+(manual?' (đã chọn riêng; đổi phong cách giữ mái này).':' (theo phong cách).')+' Phòng, cửa và vật liệu chọn riêng được giữ.</p>'+(custom?'<details class="style-material-reset"><summary>Vật liệu cũ đang được giữ</summary><p>Muốn xem trọn bộ phong cách mới: thay màu và bề mặt mô phỏng bằng gợi ý. Giữ mã hàng đã chọn và phòng phối riêng.</p><button type="button" data-style-material-suggestions>Dùng vật liệu gợi ý</button></details>':'');
 };
 // Older projects may have unmarked cached colours. Never silently discard
 // them; the visible action explicitly asks for suggested generic finishes.
 B.applyStyleMaterialSuggestions=()=>{
  if(!B.houseStyle())return false;B.rememberFinishCamera?.();B.pushPlanHistory();
  const f=B.state.project.materials.finish||={exterior:null,rooms:{}},v=f.interior||{};
  const reset=row=>{if(!row)return;row.styleRoles||={};row.explicitRoles||={};
   for(const role of ['floor','wall','accent','fabric']){
    const bound=Object.entries(row.catalogMaterials||{}).some(([category,binding])=>(binding?.surfaceSlot||B.catalogSurfaceSlots?.[category])===role);
    row.styleRoles[role]=!bound;row.explicitRoles[role]=bound;
   }delete row.pillow;delete row.rug;
  };
  reset(f.exterior);
  for(const [id,row]of Object.entries(f.rooms||{}))if(v.authored?.[id]!=='manual')reset(row);
  B.state.ui.renderMode='interactive';B.customerFrameCache=null;B.finishInvalidate?.();B.save();B.render({preserveScroll:true});return true;
 };
 document.addEventListener('click',event=>{if(event.target.closest?.('[data-style-material-suggestions]'))B.applyStyleMaterialSuggestions();});
 const authored=(raw,role)=>raw.styleRoles?.[role]!==true&&(raw.explicitRoles?raw.explicitRoles[role]===true||Object.values(raw.catalogMaterials||{}).some(v=>v.surfaceSlot===role):hex(raw[role])||!!raw.visualMaterials?.[role]||Object.values(raw.catalogMaterials||{}).some(v=>v.surfaceSlot===role));
 B.facadeFinishPalette=()=>{
  const p=B.state.project,raw=p.materials.finish?.exterior||{},resolved=B.finishPalette(),rule=B.architecturalIdentity(),manualAccent=authored(raw,'accent'),manualWall=authored(raw,'wall');
  return {...resolved,wall:manualWall?resolved.wall:B.houseStyle()?.wall||resolved.wall,accent:manualAccent?resolved.accent:rule.color,visualMaterials:{...resolved.visualMaterials,...(!manualAccent?{accent:''}:{}),...(!manualWall?{wall:'ivory-paint'}:{})},facadeSurface:manualAccent?'selected':rule.surface,manualAccent,manualWall};
 };
 const palette=B.scenePalette;B.scenePalette=()=>{const value=palette(),raw=B.state.project.materials.finish?.exterior||{},rule=B.architecturalIdentity();return {...value,frame:hex(raw.frame)?parseInt(raw.frame.slice(1),16):['classic','neo','french','coastal'].includes(rule.id)?0xddd8c9:value.frame};};
 B.facadeComponentArea=part=>part.polygon?Math.abs(part.polygon.reduce((n,a,i)=>{const b=part.polygon[(i+1)%part.polygon.length];return n+a[0]*b[1]-b[0]*a[1];},0))/2:part.h*(part.horizontal===false?part.d:part.w);
 B.facadeComponents=()=>{
  const p=B.state.project,l=B.studioLevels(),rule=B.architecturalIdentity(),finish=B.facadeFinishPalette(),parts=[],ids=new Set(),W=Number(p.site.width),D=Number(p.site.depth);
  const add=(floor,roomId,kind,x,y,z,w,h,d,role='accent',side='front',polygon=null,openingId=null)=>{
   if(![x,y,z,w,h,d].every(Number.isFinite)||w<=.001||h<=.001||d<=.001)return null;
   // A polygon is never distorted to fit a boundary. Omit an unavailable detail.
   if(polygon&&(x<0||z<0||x+w>W||z+d>D))return null;
   const x2=Math.min(W,x+w),z2=Math.min(D,z+d);x=Math.max(0,x);z=Math.max(0,z);w=x2-x;d=z2-z;if(w<=.001||d<=.001)return null;
   if(p.site.useParcelGeometry&&B.roomInsideParcel&&!B.roomInsideParcel({x,y:z,w,h:d},{...p.site,setbackFront:0,setbackRear:0,setbackSide:0}))return null;
   const componentId=[revision,rule.id||'custom',floor,roomId||'house',openingId||'',kind,...[x,y,z,w,h,d].map(n=>Math.round(n*10000))].join('-');if(ids.has(componentId))return null;ids.add(componentId);
   const color=role==='frame'?'#'+B.scenePalette().frame.toString(16).padStart(6,'0'):role==='base'?'#908c7c':finish[role]||finish.accent;
   const part={id:componentId,floor,roomId,openingId,kind,x,y,z,w,h,d,role,color,projectionSide:side,horizontal:['front','back'].includes(side),styleId:rule.id,generic:true,provisional:true,structural:false,...(polygon?{polygon}: {})};parts.push(part);return part;
  };
  const face=w=>{const r=p.plan.rooms.find(r=>r.id===w.roomIds[0]);if(!r)return null;const near=w.horizontal?w.axis<r.y+r.h/2:w.axis<r.x+r.w/2,side=w.horizontal?(near?'front':'back'):(near?'left':'right');return {r,near,side,axis:w.axis+(near?-1:1)*(w.thickness||B.measuredWallThickness(false))/2};};
  const box=(f,w,kind,a,y,length,height,depth,role='accent',poly=null)=>{
   const q=face(w);if(!q)return null;let constant=q.near?q.axis-depth+.0006:q.axis-.0006;
   // At a legal lot edge an outward millimetre skin used to be clipped away,
   // leaving the long side with interior paint. Put only the finish skin just
   // inside the measured wall face. Never move a reveal, canopy or solid wall.
   if(['exterior-finish','style-cladding'].includes(kind)){
    const limit=w.horizontal?D:W;
    if(q.axis>=-.00001&&q.axis<=limit+.00001)constant=Math.max(0,Math.min(limit-depth,constant));
   }
   return add(f,q.r.id,kind,w.horizontal?a:constant,y,w.horizontal?constant:a,w.horizontal?length:depth,height,w.horizontal?depth:length,role,q.side,poly,w.openingId||null);
  };
  const arch=(width,rise,t)=>{const points=[],segments=20;for(let i=0;i<=segments;i++){const a=Math.PI-i*Math.PI/segments;points.push([width/2+width/2*Math.cos(a),t+rise*Math.sin(a)]);}for(let i=segments;i>=0;i--){const a=Math.PI-i*Math.PI/segments;points.push([width/2+(width/2-t)*Math.cos(a),t+Math.max(.01,rise-t)*Math.sin(a)]);}return points;};
  for(let f=0;f<l.floors;f++){
   const g=B.scenePlanGeometry(p.plan,f),level=B.studioFloorLevel(f),base=level.base,clear=level.height-level.slab,exterior=g.walls.filter(w=>w.roomIds.length===1),front=exterior.filter(w=>face(w)?.side==='front'),seen=new Set();
   // Apply the style's main exterior material to full solid wall areas, not
   // only a tiny feature panel. Opening bands are split at their actual sill
   // and head, so cladding never paints over a door or window.
   const cladding=['industrial','brutalist','barn'].includes(rule.id),skinRole=cladding&&!finish.manualWall?'accent':'wall';
   const skinKind=cladding?'style-cladding':'exterior-finish',skinDepth=cladding?.014:.003;
   const clad=(w,a,y,width,height)=>{
    if(height<.002)return;box(f,w,skinKind,a,y,width,height,skinDepth,skinRole);
    if(['coastal','barn'].includes(rule.id)&&face(w)?.side==='front'&&w.b-w.a>.15){
     if(rule.id==='coastal')for(let v=y+.18;v<y+height-.02;v+=.18)box(f,w,'weatherboard-joint',a,v,width,.009,.009,'wall');
     else for(let u=a+.20;u<a+width-.02;u+=.20)box(f,w,'metal-standing-seam',u,y,.018,height,.032,'accent');
    }
   };
   // A separate outside paint layer keeps room-specific paint inside the house.
   for(const w of exterior){
    const len=w.b-w.a,sill=w.kind==='window'?w.sill:0,top=w.kind==='wall'?0:(w.sill||0)+w.height;
    if(w.kind==='wall')clad(w,w.a,base+l.slab,len,clear);
    else{clad(w,w.a,base+l.slab,len,sill);clad(w,w.a,base+l.slab+top,len,clear-top);}
    if(f===0&&w.kind!=='door'){const height=Math.min(w.kind==='window'?sill:clear,['craftsman','tuscan','balinese','brutalist'].includes(rule.id)?.48:.22);if(height>.01)box(f,w,'plinth',w.a,base+l.slab,len,height,.025,'base');}
   }
   const bays=front.filter(w=>w.kind==='wall'&&w.b-w.a>.60).sort((a,b)=>(b.b-b.a)-(a.b-a.a)||a.a-b.a),feature=bays[0];
   if(feature&&rule.id){
    const span=feature.b-feature.a,width=Math.min(span-.12,['japandi','contemporary','tuscan','brutalist'].includes(rule.id)?2.10:1.35),start=Math.max(feature.a+.06,Math.min(feature.b-.06-width,(feature.a+feature.b-width)/2)),height=clear-.16,y=base+l.slab+.08;
    if(['japandi','scandi','modern','contemporary','tuscan','brutalist','industrial','balinese'].includes(rule.id))box(f,feature,rule.surface==='wood'?'timber-panel':'feature-panel',start,y,width,height,.026);
    if(['japanese','tropical','vietnamese'].includes(rule.id)){for(let a=start;a<start+width-.04;a+=rule.id==='tropical'?.13:.105)box(f,feature,'wood-slat',a,y,.045,height,.065);}
    if(rule.id==='tudor'&&f>0){box(f,feature,'timber-post',start,y,.07,height,.035);box(f,feature,'timber-post',start+width-.07,y,.07,height,.035);box(f,feature,'timber-diagonal',start,y,width,height,.04,'accent',[[0,0],[.08,0],[width,height-.1],[width,height],[width-.08,height],[0,.1]]);}
    if(rule.band==='deco')for(let i=0;i<3;i++)box(f,feature,'deco-fin',start+i*width/3,y+(.12-i*.04),.055,height-(.12-i*.04),.075);
    if(['classic','neo','french','craftsman'].includes(rule.id)){
     const locations=rule.id==='classic'?bays:bays.slice(0,2);for(const wall of locations){const t=Math.min(rule.id==='classic'?.32:.22,(wall.b-wall.a-.1)/2),at=wall.a+(wall.b-wall.a-t)/2;box(f,wall,'pilaster',at,base+l.slab,t,clear-.14,.095,'wall');box(f,wall,'pilaster-base',at-.035,base+l.slab,t+.07,.14,.13,'wall');box(f,wall,'pilaster-capital',at-.05,base+level.height-.24,t+.10,.13,.15,'wall');}
    }
   }
   for(const w of front.filter(w=>w.kind!=='wall')){
    if(seen.has(w.openingId))continue;seen.add(w.openingId);const o=p.plan.openings.find(o=>o.id===w.openingId),span=o&&B.openingWallSpan(o);if(!span)continue;const a=span.a,len=span.b-span.a,bottom=base+l.slab+(w.sill||0),top=bottom+w.height,t=Math.min(rule.trim,len*.12),headroom=base+level.height-top-.12,accent=['frame','reveal','offset'].includes(rule.surround)&&rule.surface==='metal'?'frame':rule.surround==='classical'||rule.surround==='arched'&&rule.surface!=='wood'?'wall':'accent';
    if(t>.001){
     const low=Math.max(base+l.slab,bottom-t),revealHeight=top+t-low;
     box(f,w,'window-reveal',a-t,low,t,revealHeight,Math.max(.025,t),accent);box(f,w,'window-reveal',a+len,low,t,revealHeight,Math.max(.025,t),accent);
     box(f,w,'opening-head',a-t,top,len+t*2,t,Math.max(t,rule.shade*.55),accent);if(w.kind==='window')box(f,w,'window-sill',a-t,bottom-t,len+t*2,t*.7,Math.max(.04,t),accent);
     if(rule.surround==='classical'){for(let i=1;i<3;i++)box(f,w,'window-pediment',a-t*(1+i*.2),top+t*i,len+t*(2+i*.4),t*.45,Math.max(.03,t+i*.02),'wall');}
     if(rule.surround==='offset')box(f,w,'offset-fin',a+len+t,base+l.slab+.08,t*1.4,clear-.16,rule.shade,'accent');
     if(rule.surround==='stepped')for(let i=0;i<3;i++)box(f,w,'deco-step',a-t+i*t*.45,top+t*(i+1),len+t*2-i*t*.9,t*.65,.05+i*.025,'accent');
    }
    if(rule.arch>0&&headroom>.20){const rise=Math.min(rule.arch,headroom-.05),stroke=Math.min(.08,rise*.3);box(f,w,'arch-crown',a-.08,top+.025,len+.16,rise+stroke,.065,rule.id==='indochine'?'accent':'wall',arch(len+.16,rise,stroke));}
    if(['shutter','arched'].includes(rule.surround)&&w.kind==='window'&&['indochine','tuscan','coastal','spanish'].includes(rule.id)){
     const gap=Math.min(.24,len*.12);for(const start of [a-gap-.06,a+len+.06]){const wall=front.find(q=>q.kind==='wall'&&start>=q.a+.01&&start+gap<=q.b-.01);if(!wall)continue;box(f,wall,'shutter-frame',start,bottom,gap,w.height,.03);for(let h=.035;h<w.height-.05;h+=.09)box(f,wall,'shutter',start+.015,bottom+h,gap-.03,.036,.048);}
    }
    if(rule.surround==='screen'&&headroom>.12){const blades=rule.id==='tropical'?4:2;for(let i=0;i<blades&&.08+i*.075<headroom;i++)box(f,w,'shade-blade',a-.06,top+.08+i*.075,len+.12,.027,rule.shade);}
    if(w.kind==='door'&&f===0&&rule.shade>.1&&headroom>.12)box(f,w,'entry-canopy',a-.16,top+.11,len+.32,.07,Math.min(.58,rule.shade+.14),['japanese','japandi','craftsman','vietnamese','balinese'].includes(rule.id)?'accent':'wall');
   }
   for(const w of front){const depth=rule.band==='cornice'?.16:rule.band==='deco'?.16:rule.band==='horizontal'?.14:.035,h=rule.band==='cornice'?.18:rule.band==='deco'?.16:.055;box(f,w,rule.band==='cornice'?'cornice':'horizontal-band',w.a,base+level.height-h,w.b-w.a,h,depth,rule.id==='modern'||rule.id==='midcentury'?'frame':'wall');if(['classic','french','artdeco'].includes(rule.id))box(f,w,'cornice-step',w.a,base+level.height+.025,w.b-w.a,.075,depth+.06,rule.id==='artdeco'?'accent':'wall');}
   if(['barn','coastal','tudor'].includes(rule.id))for(const wall of front.filter(w=>w.kind==='wall'))for(let a=wall.a+.10;a<wall.b-.04;a+=rule.id==='barn'?.20:.30)box(f,wall,'vertical-joint',a,base+l.slab+.04,.016,clear-.08,.012,rule.id==='tudor'?'accent':'wall');
  }
  const roof=B.sceneRoofSpec(),b=B.sceneFootprintBounds(B.floorRooms(l.floors-1)),top=(l.roofBase??l.floors*l.floorHeight)+l.slab;
  if(roof&&b?.rectangular&&roof.eave>top+.001){const t=B.measuredWallThickness(false);for(const [side,x,z,w,d]of [['front',b.x-t/2,b.y-t/2,b.width+t,t],['back',b.x-t/2,b.y+b.depth-t/2,b.width+t,t],['left',b.x-t/2,b.y+t/2,t,b.depth-t],['right',b.x+b.width-t/2,b.y+t/2,t,b.depth-t]])add(l.floors-1,null,'roof-eave-band',x,top,z,w,roof.eave-top,d,'wall',side);}
  return parts;
 };
 B.architecturalFacadeMaterial=(THREE,scene,role)=>{
  const finish=B.facadeFinishPalette(),rule=B.architecturalIdentity(),key=JSON.stringify([role,finish.wall,finish.accent,finish.visualMaterials,finish.facadeSurface,rule.id]),cache=scene.userData.architecturalMaterials||=new Map();if(cache.has(key))return cache.get(key);
  const shared=B.sceneAssetMaterials(THREE,scene,finish);let m;
  if(role==='wall')m=shared.wall.clone();else if(role==='base')m=shared.stone.clone();else if(role==='frame')m=shared.metal.clone();else if(finish.manualAccent||finish.facadeSurface==='wood')m=(finish.manualAccent?shared.wood:shared.slattedWood).clone();else if(finish.facadeSurface==='stone')m=shared.stone.clone();else if(finish.facadeSurface==='metal')m=shared.metal.clone();else m=shared.wall.clone();
  m.color.set(role==='wall'?finish.wall:role==='base'?'#908c7c':role==='frame'?'#'+B.scenePalette().frame.toString(16).padStart(6,'0'):finish.accent);
  if(role==='frame'||role==='accent'&&finish.facadeSurface==='metal'){m.roughness=.42;m.metalness=.5;}if(role==='base'){m.roughness=.9;m.userData.surfaceScale=[.8,.8];}
  if(role==='accent'&&['brick','concrete'].includes(finish.facadeSurface)){for(const [slot,channel]of [['map','color'],['normalMap','normal'],['roughnessMap','roughness']]){const texture=B.sceneSurfaceTexture(THREE,finish.facadeSurface,channel);if(texture){texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.colorSpace=channel==='color'?THREE.SRGBColorSpace:THREE.NoColorSpace;m[slot]=texture;}}m.userData.surfaceScale=finish.facadeSurface==='brick'?[.44,.15]:[2,2];m.normalScale.setScalar(.10);m.roughness=.91;}
  m.polygonOffset=true;m.polygonOffsetFactor=-1;m.polygonOffsetUnits=-1;
  m.userData={...m.userData,finishSlot:'facade-'+role,facadeRole:role,generic:true};cache.set(key,m);return m;
 };
 B.facadePolygonGeometry=(THREE,p,{W,D,explode=0})=>{
  const shape=new THREE.Shape(),points=p.polygon.map(([u,v])=>[p.horizontal?u:p.d-u,v]);shape.moveTo(...points[0]);for(const point of points.slice(1))shape.lineTo(...point);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:p.horizontal?p.d:p.w,bevelEnabled:false,steps:1});
  if(!p.horizontal)g.rotateY(Math.PI/2);g.translate(p.x-W/2,p.y+p.floor*explode,p.z-D/2+(p.horizontal?0:p.d));return g;
 };
 B.addArchitecturalFacade=(options,parts)=>{
  const {THREE,scene,W,D,explode}=options,groups=new Map();for(const p of parts){const key=p.floor+'|'+p.role+'|'+(['exterior-finish','style-cladding'].includes(p.kind)?'skin':p.kind==='timber-panel-joint'?'micro':'detail');if(!groups.has(key))groups.set(key,[]);groups.get(key).push(p);}
  for(const group of groups.values()){
   const first=group[0],material=B.architecturalFacadeMaterial(THREE,scene,first.role),boxes=group.filter(p=>!p.polygon),polygons=group.filter(p=>p.polygon),all=[];
   if(['exterior-finish','style-cladding'].includes(first.kind)){material.polygonOffset=true;material.polygonOffsetFactor=-1;material.polygonOffsetUnits=-1;}
   if(boxes.length)all.push(B.sceneJoinedBoxes(THREE,boxes,{W,D,base:first.floor*explode}));for(const p of polygons)all.push(B.facadePolygonGeometry(THREE,p,{W,D,explode}));
   const positions=[],normals=[],uvs=[];for(const source of all){const g=source.index?source.toNonIndexed():source;positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);uvs.push(...g.attributes.uv.array);if(g!==source)g.dispose();source.dispose();}
   const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));B.sceneSurfaceUvs(geometry,material,{x:0,y:0,z:0});
   const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=!['exterior-finish','style-cladding','timber-panel-joint'].includes(first.kind);mesh.receiveShadow=first.kind!=='timber-panel-joint';mesh.userData={kind:'facade-detail',facadeFinish:true,facadeRole:first.role,facadeSkin:['exterior-finish','style-cladding'].includes(first.kind),floor:first.floor,styleId:first.styleId,componentIds:group.map(p=>p.id),measuredBoxes:group,generic:true,provisional:true};scene.add(mesh);
  }
 };
 const refresh=B.refreshStudioFinishes;
 B.refreshStudioFinishes=(role=null,roomId=null)=>{
  const ok=refresh(role,roomId),s=B.studio3d;if(roomId||!['wall','accent'].includes(role)||!s?.THREE||B.state.ui.step!==6||s.project!==B.state.project||s.scene.userData.disposed||!s.renderer.domElement.isConnected||s.archRender||s.sharpExport||s.structureKey!==B.studioStructureKey())return ok;let changed=false;const retired=new Set();
  s.scene.traverse(mesh=>{if(!mesh.userData.facadeFinish||role&&mesh.userData.facadeRole!==role)return;const old=mesh.material,source=B.architecturalFacadeMaterial(s.THREE,s.scene,mesh.userData.facadeRole);if(old===source)return;B.prepareModelMaterial?.(source,old,mesh,s.scene);mesh.material=source;B.sceneSurfaceUvs(mesh.geometry,source,mesh.position);retired.add(old);changed=true;});
  if(changed){const used=new Set();s.scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])used.add(m);});for(const [key,m]of s.scene.userData.architecturalMaterials||[])if(!used.has(m)){s.scene.userData.architecturalMaterials.delete(key);retired.add(m);}for(const m of retired)if(!used.has(m))m.dispose();(s.requestRender||s.renderFrame)?.call(s);B.finishInvalidate?.();B.save();}
  return ok||changed;
 };
 const windowAssembly=B.windowAssembly;B.windowAssembly=o=>{
  const parts=windowAssembly(o),rule=B.architecturalIdentity();if(!rule.grid||!parts.length)return parts;
  const panes=parts.filter(p=>p.finish==='glass');for(const p of panes)for(let row=1;row<=rule.grid;row++){const horizontal=p.w>p.d,bar={...p,part:'glazing-bar-'+parts.length,kind:'window-frame',finish:'frame',y:p.y+p.h*row/(rule.grid+1)-.012,h:.024,w:horizontal?p.w:.025,d:horizontal?.025:p.d};parts.push(bar);}return parts;
 };
 // Wall treatments follow the room's collection, including a manually mixed
 // collection. They occupy solid wall bays, not doors, glazing or shaft voids.
 B.interiorFeatureComponents=r=>{
  if(!['living','bed'].includes(r.type))return [];const c=B.interiorCollection(r.id),l=B.studioFloorLevel(r.floor),parts=[],fixtures=B.planFixtures?.(r.id)||[],walls=B.scenePlanGeometry(B.state.project.plan,r.floor).walls.filter(w=>w.kind==='wall'&&w.roomIds.includes(r.id)&&w.b-w.a>1.15),side=w=>w.horizontal?(w.axis<r.y+r.h/2?'front':'back'):(w.axis<r.x+r.w/2?'left':'right');
  const candidates=walls.filter(w=>!fixtures.some(q=>({north:'front',south:'back',west:'left',east:'right'}[q.side])===side(w))).sort((a,b)=>(b.b-b.a)-(a.b-a.a)),wall=candidates[0];if(!wall)return parts;
  const near=['front','left'].includes(side(wall)),width=Math.min(2.45,wall.b-wall.a-.28),start=(wall.a+wall.b-width)/2,top=Math.min(2.45,l.clearHeight-.22),bottom=.28;
  const add=(kind,u,y,w,h,depth,role='accent',polygon=null)=>{const axis=wall.axis+(near?1:-1)*(wall.thickness||B.measuredWallThickness(wall.roomIds.length>1))/2,constant=near?axis+.005:axis-depth-.005;parts.push({id:'interior-'+r.id+'-'+kind+'-'+parts.length,kind,roomId:r.id,floor:r.floor,collectionId:c.id,x:wall.horizontal?u:constant,y:l.slab+y,z:wall.horizontal?constant:u,w:wall.horizontal?w:depth,h,d:wall.horizontal?depth:w,horizontal:wall.horizontal,role,generic:true,...(polygon?{polygon}: {})});};
  if(c.id==='neo-elegance'||c.id==='olive-gallery'){
   const n=Math.max(1,Math.min(3,Math.floor(width/.78))),bay=(width-.12*(n-1))/n,t=c.id==='neo-elegance'?.035:.022;
   for(let i=0;i<n;i++){const x=start+i*(bay+.12);for(const u of [x,x+bay-t])add('panel-frame',u,bottom,t,top-bottom,.021,'wall');for(const y of [bottom,top-t])add('panel-frame',x,y,bay,t,.021,'wall');if(c.id==='olive-gallery')for(const u of [x+.07,x+bay-.092])add('deco-inlay',u,bottom+.12,.022,top-bottom-.24,.025,'accent');}
  }else if(c.id==='warm-oak'){for(let u=start;u<start+width-.035;u+=.075)add('timber-flute',u,bottom,.03,top-bottom,.022);}
  else if(c.id==='indochine'){const h=Math.min(.92,top-bottom);add('wainscot',start,bottom,width,h,.012);for(let u=start;u<start+width-.03;u+=.30)add('wainscot-post',u,bottom,.035,h,.024);for(const y of [bottom,bottom+h-.035])add('wainscot-rail',start,y,width,.035,.028);}
  else if(['coastal','nordic-light','mid-century'].includes(c.id)){const h=c.id==='mid-century'?1.10:1.26,role=c.id==='coastal'?'wall':'accent';add('low-wall-panel',start,bottom,width,h,.012,role);for(let u=start+.07;u<start+width-.03;u+=.14)add('panel-joint',u,bottom,.013,h,.018,role);add('panel-cap',start,bottom+h,width,.035,.026,role);}
  else if(['urban-stone','loft-leather'].includes(c.id)){add('mineral-feature',start,bottom,width,top-bottom,.014,'floor');}
  else if(c.id==='soft-curves'){const rise=Math.min(width*.5,.42),h=top-bottom,points=[[0,0],[width,0],[width,h-rise]];for(let i=0;i<=20;i++){const a=i*Math.PI/20;points.push([width/2+width/2*Math.cos(a),h-rise+rise*Math.sin(a)]);}points.push([0,0]);add('curved-feature',start,bottom,width,h,.018,'wall',points);}
  return parts;
 };
 // Small finish details are derived from solid measured wall intervals. They
 // stay inside the room and stop at doors, low glazing, fixtures and shafts.
 // Generic design suggestions; no structure or purchased SKU is inferred.
 B.interiorFinishDetails=r=>{
  if(['stairs','elevator','balcony','garage'].includes(r.type))return [];
  const l=B.studioFloorLevel(r.floor),c=B.interiorCollection(r.id),parts=[],wet=['bath','laundry'].includes(r.type),classical=['neo-elegance','olive-gallery','indochine'].includes(c.id);
  const walls=B.scenePlanGeometry(B.state.project.plan,r.floor).walls.filter(w=>w.roomIds.includes(r.id));
  const fixtures=B.planFixtures?.(r.id)||[];
  const add=(wall,a,b,kind,y,h,depth,role)=>{
   if(b-a<.025||h<=0)return;const near=wall.horizontal?wall.axis<r.y+r.h/2:wall.axis<r.x+r.w/2,t=wall.thickness||B.measuredWallThickness(wall.roomIds.length>1),axis=wall.axis+(near?1:-1)*(t/2+.001),constant=near?axis:axis-depth;
   const part={id:'finish-'+r.id+'-'+kind+'-'+parts.length,kind,roomId:r.id,floor:r.floor,collectionId:c.id,x:wall.horizontal?a:constant,y:l.slab+y,z:wall.horizontal?constant:a,w:wall.horizontal?b-a:depth,h,d:wall.horizontal?depth:b-a,horizontal:wall.horizontal,role,generic:true,provisional:true,structural:false};
   if(part.x>=r.x-.001&&part.z>=r.y-.001&&part.x+part.w<=r.x+r.w+.001&&part.z+part.d<=r.y+r.h+.001)parts.push(part);
  };
  for(const w of walls){
   const a=Math.max(w.a+.002,w.horizontal?r.x+.02:r.y+.02),b=Math.min(w.b-.002,w.horizontal?r.x+r.w-.02:r.y+r.h-.02),near=w.horizontal?w.axis<r.y+r.h/2:w.axis<r.x+r.w/2,side=w.horizontal?(near?'north':'south'):(near?'west':'east');
   if(w.kind==='door'||w.kind==='window'&&w.sill<.14)continue;
   let spans=[[a,b]];for(const q of fixtures.filter(q=>q.side===side&&(Number(q.base)||0)<.14)){const qa=w.horizontal?q.x:q.y,qb=qa+(w.horizontal?q.w:q.d);spans=spans.flatMap(([x,z])=>qb<=x||qa>=z?[[x,z]]:[[x,Math.min(z,qa-.01)],[Math.max(x,qb+.01),z]]).filter(([x,z])=>z>x);}
   for(const [x,z]of spans){add(w,x,z,'skirting',0,classical?.13:.09,.014,wet?'floor':classical?'wall':'accent');if(classical)add(w,x,z,'skirting-cap',.13,.014,.020,'wall');}
   if(w.kind==='wall'&&classical){const y=l.clearHeight-.09;add(w,a,b,'ceiling-cornice',y,.055,.038,'wall');add(w,a,b,'ceiling-cornice-step',y+.055,.026,.022,'wall');}
  }
  return parts;
 };
 const interiorFeatures=B.interiorFeatureComponents;
 B.interiorFeatureComponents=r=>[...interiorFeatures(r),...B.interiorFinishDetails(r)];
 const decorate=B.decorateStudioScene;
 B.decorateStudioScene=options=>{
  decorate(options);const {THREE,scene,visibleFloors,roomFocus,floorFocus,W,D,fh,explode}=options;
  for(const f of visibleFloors)for(const r of B.floorRooms(f).filter(r=>!roomFocus||r.id===roomFocus.id)){
   const parts=B.interiorFeatureComponents(r);if(!parts.length)continue;const base=roomFocus||floorFocus!==null?0:B.studioFloorLevel(f).base+f*explode,materials=B.sceneAssetMaterials(THREE,scene,B.finishPalette(r.id)),groups=new Map();
   for(const p of parts){if(!groups.has(p.role))groups.set(p.role,[]);groups.get(p.role).push(p);}
   for(const [role,group]of groups){let material=materials[role==='accent'?'wood':role],clipped=floorFocus!==null||roomFocus&&B.state.ui.roomCamera!=='inside';if(clipped){material=material.clone();material.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),base+(roomFocus?.85:1.05))];material.clipShadows=true;}
    const boxes=group.filter(p=>!p.polygon),sources=[];if(boxes.length)sources.push(B.sceneJoinedBoxes(THREE,boxes,{W,D,base}));for(const p of group.filter(p=>p.polygon))sources.push(B.facadePolygonGeometry(THREE,{...p,floor:0,y:base+p.y},{W,D}));
    const data={position:[],normal:[],uv:[]};for(const source of sources){const flat=source.index?source.toNonIndexed():source;for(const key of Object.keys(data))data[key].push(...flat.attributes[key].array);if(flat!==source)flat.dispose();source.dispose();}
    const source=new THREE.BufferGeometry();for(const key of Object.keys(data))source.setAttribute(key,new THREE.Float32BufferAttribute(data[key],key==='uv'?2:3));B.sceneSurfaceUvs(source,material,{x:0,y:0,z:0});const mesh=new THREE.Mesh(source,material);mesh.castShadow=mesh.receiveShadow=true;mesh.userData={kind:'interior-feature',roomId:r.id,floor:f,collectionId:group[0].collectionId,componentIds:group.map(p=>p.id),measuredBoxes:group,generic:true};scene.add(mesh);
   }
  }
 };
 B.architecturalIdentityReview=()=>{
  const rule=B.architecturalIdentity(),parts=B.facadeComponents(),roof=B.roofDesignSpec(),settings=B.measuredDesignSettings(),palette=B.facadeFinishPalette(),areas={};
  for(const p of parts)areas[p.role]=(areas[p.role]||0)+B.facadeComponentArea(p);
  const setbackReviewNeeded=!!B.roomInsideParcel&&parts.some(p=>!B.roomInsideParcel({x:p.x,y:p.z,w:p.w,h:p.d}));
  return {revision,styleId:rule.id,name:rule.name,recognized:!!rule.id,roof:{type:roof.type,name:roof.name,manual:settings.roof.type!=='auto'},materialBasis:palette.manualAccent?'Lựa chọn của khách':'Gợi ý theo phong cách',features:[...new Set(parts.filter(p=>p.kind!=='exterior-finish').map(p=>p.kind))],componentCount:parts.length,finishAreas:areas,finishAreaBasis:'Diện tích hình học từng chi tiết mô phỏng, có thể chồng lớp; chưa phải khối lượng báo giá.',setbackReviewNeeded,exactReferenceMatch:null,engineeringApproved:false};
 };
 const review=B.styleOutputReview;B.styleOutputReview=()=>({...review(),architecture:B.architecturalIdentityReview()});
 const html=B.styleOutputHtml;B.styleOutputHtml=()=>{const a=B.architecturalIdentityReview();return html().replace('<div class="customer-style-body">','<div class="customer-style-body"><p class="architectural-identity-summary"><b>'+B.esc(a.name)+'</b><br>'+B.esc(a.roof.name)+(a.roof.manual?' · theo thông số bạn chọn':' · theo phong cách')+'<br>Hoàn thiện mặt ngoài: '+B.esc(a.materialBasis)+'. Màu riêng trong phòng được giữ.'+(a.setbackReviewNeeded?'<br>Chi tiết nhô mặt tiền cần đối chiếu khoảng lùi được phép tại khu đất.':'')+'</p>');};
 const drawingRevision=B.drawingRevision;B.drawingRevision=()=>drawingRevision()+'-AI1';
 B.ARCH_RENDER_REVISION='customer-architectural-identity-9';
})();
