/* Measured architecture contract. Metres internally, millimetres on sheets/CAD.
 * Geometry is a design model, never a substitute for structural/MEP design. */
(()=>{
 const B=BMH,esc=B.esc,finite=Number.isFinite;
 B.measuredDesignSettings=()=>{
  const p=B.state.project,d=p.measuredDesign||={};
  d.roof={type:'auto',pitchDeg:0,overhang:-1,ridge:'auto',surface:'auto',color:'',...(d.roof||{})};
  d.wallThickness={exterior:.22,interior:.12,...(d.wallThickness||{})};
  if(!['auto','flat','hip','gable','mono'].includes(d.roof.type))d.roof.type='auto';
  if(!['auto','width','depth'].includes(d.roof.ridge))d.roof.ridge='auto';
  if(!['auto','tile','metal','thatch','concrete'].includes(d.roof.surface))d.roof.surface='auto';
  if(!/^#[0-9a-f]{6}$/i.test(d.roof.color||''))d.roof.color='';
  for(const [key,min,max,fallback]of [['pitchDeg',0,60,0],['overhang',-1,2,-1]])if(!finite(d.roof[key])||d.roof[key]<min||d.roof[key]>max)d.roof[key]=fallback;
  for(const key of ['exterior','interior'])if(!finite(d.wallThickness[key])||d.wallThickness[key]<.06||d.wallThickness[key]>.6)d.wallThickness[key]=key==='exterior'?.22:.12;
  return d;
 };
 B.roofSurfaceSpec=()=>{
  const d=B.measuredDesignSettings().roof,s=B.houseStyle?.(),roof=B.roofDesignSpec(),surface=d.surface!=='auto'?d.surface:roof.type==='flat'?'concrete':s?.id==='balinese'?'thatch':['barn','scandi','tudor','coastal'].includes(s?.id)?'metal':'tile';
  const color=d.color||({tile:['vietnamese','mediterranean','spanish','tuscan','indochine'].includes(s?.id)?'#9f5636':'#5b625e',metal:'#3c494c',thatch:'#897147',concrete:'#a1a09a'})[surface];
  return {surface,color,name:{tile:'Ngói mô phỏng',metal:'Tấm kim loại mô phỏng',thatch:'Lớp phủ tự nhiên mô phỏng',concrete:'Bề mặt mái bằng mô phỏng'}[surface],notice:'Bề mặt thị giác; chưa xác nhận quy cách/SKU, khung mái, chồng mí và phụ kiện.'};
 };
 B.roofSceneMaterial=THREE=>{
  const spec=B.roofSurfaceSpec(),canvas=document.createElement('canvas');canvas.width=canvas.height=256;const c=canvas.getContext('2d');c.fillStyle='#c8c8c8';c.fillRect(0,0,256,256);
  // A small, scene-owned procedural preview. No new asset download or AI cost.
  if(spec.surface==='tile'){for(let y=0;y<256;y+=64){const gradient=c.createLinearGradient(0,y,0,y+64);gradient.addColorStop(0,'#888');gradient.addColorStop(.25,'#eee');gradient.addColorStop(.9,'#bbb');gradient.addColorStop(1,'#666');c.fillStyle=gradient;c.fillRect(0,y,256,64);c.strokeStyle='#8c8c8c';c.lineWidth=3;for(let x=0;x<256;x+=64){c.beginPath();c.moveTo(x,y);c.lineTo(x,y+64);c.stroke();}}}
  if(spec.surface==='metal'){for(let x=0;x<256;x+=32){c.fillStyle='#8a8a8a';c.fillRect(x,0,3,256);c.fillStyle='#e4e4e4';c.fillRect(x+3,0,3,256);}}
  if(spec.surface==='thatch'){for(let i=0;i<320;i++){const x=(i*73)%256,y=(i*131)%256;c.strokeStyle=i%2?'#ddd':'#999';c.beginPath();c.moveTo(x,y);c.lineTo(x+7,y+18);c.stroke();}}
  const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.colorSpace=THREE.SRGBColorSpace;
  // The finish shares the exact measured top of the slab. Depth bias prevents
  // coplanar flicker without moving roof vertices or changing areas/dimensions.
  const material=new THREE.MeshStandardMaterial({color:spec.color,map,roughness:spec.surface==='metal'?.45:.88,metalness:spec.surface==='metal'?.4:0,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});material.userData={finishSlot:'roof',visualOnly:true,roofSurface:spec.surface};return material;
 };
 B.roofSurfaceUvs=(THREE,geometry,polygon)=>{
  const origin=new THREE.Vector3(...polygon[0]),u=new THREE.Vector3(...polygon[1]).sub(origin).normalize();let normal;
  for(let i=2;i<polygon.length;i++){const candidate=u.clone().cross(new THREE.Vector3(...polygon[i]).sub(origin));if(candidate.lengthSq()>1e-8){normal=candidate.normalize();break;}}
  if(!normal)return;const v=normal.clone().cross(u).normalize(),positions=geometry.attributes.position,uv=[];
  for(let i=0;i<positions.count;i++){const point=new THREE.Vector3(positions.getX(i)+B.state.project.site.width/2,positions.getY(i),positions.getZ(i)+B.state.project.site.depth/2).sub(origin);uv.push(point.dot(u),point.dot(v));}
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
 };
 B.measuredWallThickness=shared=>B.measuredDesignSettings().wallThickness[shared?'interior':'exterior'];
 B.archWallsSvg=floor=>B.wallSolidSegments(floor).map(s=>{const thickness=B.measuredWallThickness(s.count>1),half=thickness/2;return s.o==='h'?'<rect class="arch-wall-fill '+(s.count>1?'internal':'external')+'" x="'+s.a+'" y="'+(s.c-half)+'" width="'+(s.b-s.a)+'" height="'+thickness+'"/>':'<rect class="arch-wall-fill '+(s.count>1?'internal':'external')+'" x="'+(s.c-half)+'" y="'+s.a+'" width="'+thickness+'" height="'+(s.b-s.a)+'"/>';}).join('');
 B.roofDesignSpec=()=>{
  const d=B.measuredDesignSettings().roof,s=B.houseStyle?.(),form=s?.form||'flat';
  const type=d.type!=='auto'?d.type:form==='gable'?'gable':['wide','arch','classic'].includes(form)?'hip':'flat';
  const suggestedPitch=s?.id==='tudor'?45:s?.id==='coastal'?22:form==='wide'?28:30;
  return {type,name:{flat:'Mái bằng',hip:'Mái bốn dốc',gable:'Mái hai dốc',mono:'Mái một dốc'}[type],pitchDeg:type==='flat'?0:d.pitchDeg||suggestedPitch,overhang:d.overhang>=0?d.overhang:type==='flat'?0:form==='wide'?.6:.25,ridge:d.ridge,source:d.type==='auto'?'Gợi ý từ phong cách; có thể chỉnh':'Thông số khách nhập'};
 };
 B.polygonArea3D=polygon=>{
  let area=0;for(let i=1;i<polygon.length-1;i++){const a=polygon[i].map((v,j)=>v-polygon[0][j]),b=polygon[i+1].map((v,j)=>v-polygon[0][j]);area+=Math.hypot(a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])/2;}return area;
 };
 // One vertex set feeds WebGL, plan, elevation, section and roof takeoff.
 B.sceneRoofSpec=(explode=0)=>{
  const p=B.state.project,l=B.resolvedProjectLevels(),rooms=B.floorRooms(l.floors-1).filter(r=>[r.x,r.y,r.w,r.h].every(finite)&&r.w>0&&r.h>0),bounds=B.sceneFootprintBounds(rooms),spec=B.roofDesignSpec();
  if(!bounds||!bounds.rectangular&&spec.type!=='flat')return null;
  const width=bounds.width+spec.overhang*2,depth=bounds.depth+spec.overhang*2,cx=bounds.cx,cz=bounds.cy;
  const eave=l.roofBase+(l.floors-1)*explode+l.slab+(spec.type==='flat'?0:.18),alongDepth=spec.ridge==='depth'||spec.ridge==='auto'&&depth>=width;
  const hw=width/2,hd=depth/2,c=[[cx-hw,eave,cz-hd],[cx+hw,eave,cz-hd],[cx+hw,eave,cz+hd],[cx-hw,eave,cz+hd]],tan=Math.tan(spec.pitchDeg*Math.PI/180);
  let rise=0,ridge=[],faces=[],gables=[];
  if(spec.type==='flat'){
   // Non-rectangular footprints retain their notches and shaft/stair voids.
   faces=bounds.rectangular&&spec.overhang>0?[c]:rooms.flatMap(r=>B.slabPanels(r,B.stairFloorHoles(l.floors)).map(q=>[[q.x,eave,q.y],[q.x+q.w,eave,q.y],[q.x+q.w,eave,q.y+q.d],[q.x,eave,q.y+q.d]]));
  }else if(spec.type==='mono'){
   rise=(alongDepth?width:depth)*tan;
   for(const i of alongDepth?[1,2]:[2,3])c[i][1]+=rise;
   ridge=(alongDepth?[c[1],c[2]]:[c[3],c[2]]).map(q=>[...q]);faces=[c];
   // Close the raised perimeter in the model and measured projections.
   for(let i=0;i<4;i++){const a=c[i],b=c[(i+1)%4],v=[[a[0],eave,a[2]],[b[0],eave,b[2]],b,a];if(B.polygonArea3D(v)>1e-8)gables.push(v);}
  }else{
   rise=(spec.type==='hip'?Math.min(width,depth):alongDepth?width:depth)/2*tan;
   const inset=spec.type==='hip'?Math.min(width,depth)/2:0;
   ridge=alongDepth?[[cx,eave+rise,cz-hd+inset],[cx,eave+rise,cz+hd-inset]]:[[cx-hw+inset,eave+rise,cz],[cx+hw-inset,eave+rise,cz]];
   if(spec.type==='hip')faces=alongDepth?[[c[0],c[1],ridge[0]],[c[0],ridge[0],ridge[1],c[3]],[c[1],c[2],ridge[1],ridge[0]],[c[3],ridge[1],c[2]]]:[[c[0],c[3],ridge[0]],[c[0],ridge[0],ridge[1],c[1]],[c[3],c[2],ridge[1],ridge[0]],[c[1],ridge[1],c[2]]];
   else if(alongDepth){faces=[[c[0],ridge[0],ridge[1],c[3]],[c[1],c[2],ridge[1],ridge[0]]];gables=[[c[0],c[1],ridge[0]],[c[3],ridge[1],c[2]]];}
   else{faces=[[c[0],c[1],ridge[1],ridge[0]],[c[3],ridge[0],ridge[1],c[2]]];gables=[[c[0],ridge[0],c[3]],[c[1],c[2],ridge[1]]];}
  }
  return {...spec,bounds,width,depth,eave,rise,corners:c,ridge,faces,gables,area:faces.reduce((n,f)=>n+B.polygonArea3D(f),0),gableArea:gables.reduce((n,f)=>n+B.polygonArea3D(f),0)};
 };
 B.measuredGeometryIssues=()=>{
  const p=B.state.project,l=B.resolvedProjectLevels(),issues=(l.issues||[]).map(text=>({sev:'error',text})),add=(text)=>issues.push({sev:'error',text}),ids=new Set(),openingIds=new Set(),spans=[];
  for(const r of p.plan.rooms){
   if(!r.id||ids.has(r.id))add('Mã phòng bị thiếu/trùng: '+(r.id||'—'));ids.add(r.id);
   if(![r.x,r.y,r.w,r.h].every(finite)||r.w<=.2||r.h<=.2||!Number.isInteger(r.floor)||r.floor<0||r.floor>=l.floors){add((r.name||r.id)+': kích thước/tầng không hợp lệ.');continue;}
   if(r.x<0||r.y<0||r.x+r.w>p.site.width+.001||r.y+r.h>p.site.depth+.001||B.roomInsideParcel&&!B.roomInsideParcel(r))add(r.name+': phòng vượt ranh/khoảng lùi đã nhập.');
  }
  for(let f=0;f<l.floors;f++){
   const rooms=B.floorRooms(f);if(!rooms.length)add('Tầng '+(f+1)+' chưa có mặt bằng.');
   for(let i=0;i<rooms.length;i++)for(const o of rooms.slice(i+1)){const r=rooms[i];if(Math.min(r.x+r.w,o.x+o.w)-Math.max(r.x,o.x)>.001&&Math.min(r.y+r.h,o.y+o.h)-Math.max(r.y,o.y)>.001)add('Tầng '+(f+1)+': '+r.name+' chồng '+o.name+'.');}
  }
  for(const o of p.plan.openings){
   const r=p.plan.rooms.find(r=>r.id===o.roomId),span=r?B.openingWallSpan(o):null,h=o.height??(o.kind==='door'?2.1:1.4),s=o.kind==='door'?0:o.sill??.9;
   if(!o.id||openingIds.has(o.id))add('Mã cửa bị thiếu/trùng: '+(o.id||'—'));openingIds.add(o.id);
   if(!r||o.floor!==r.floor||!span||!['door','window'].includes(o.kind)||!finite(o.width)||o.width<.45||o.width>(['north','south'].includes(o.side)?r.w:r.h)+.001||!finite(h)||h<=0||!finite(s)||s<0||h+s>B.floorLevel(o.floor).clearHeight+.001||o.offset!==undefined&&(!finite(o.offset)||o.offset<0||o.offset>1)){add('Ô mở '+(o.id||'—')+': kiểm tra phòng, rộng/cao/bậu và vị trí.');continue;}
   if(spans.some(q=>q.floor===o.floor&&q.o===span.o&&Math.abs(q.c-span.c)<.001&&Math.min(q.b,span.b)-Math.max(q.a,span.a)>.001))add('Ô mở '+o.id+' trùng một ô khác trên cùng tường.');
   spans.push({...span,floor:o.floor});
  }
  if(p.site.useParcelGeometry){
   const boundary=B.parcelBoundaryReview?.();if(boundary&&!boundary.valid)boundary.errors.forEach(add);
   for(let floor=0;floor<l.floors;floor++){
    const invalid=B.scenePlanGeometry(p.plan,floor).walls.some(w=>{const half=w.thickness/2;return !B.roomInsideParcel({x:w.horizontal?w.a:w.axis-half,y:w.horizontal?w.axis-half:w.a,w:w.horizontal?w.b-w.a:w.thickness,h:w.horizontal?w.thickness:w.b-w.a});});
    if(invalid)add('Tầng '+(floor+1)+': mặt ngoài tường vượt ranh/khoảng lùi đã nhập.');
   }
   const roof=B.sceneRoofSpec();
   if(roof?.faces.some(face=>{const xs=face.map(v=>v[0]),ys=face.map(v=>v[2]);return !B.roomInsideParcel({x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)});}))add('Mái đua vượt ranh/khoảng lùi đã nhập. Chỉnh mái hoặc mặt bằng trước khi bàn giao.');
  }
  return issues;
 };
 B.drawingRevision=()=>{
  const p=B.state.project,d=B.measuredDesignSettings(),s=p.site;
  const input=JSON.stringify({units:'m',modelSchema:'measured-openings-facade-2',site:[s.width,s.depth,s.floors,s.floorHeight,s.floorHeights,s.slabThickness,s.ceilingDrop,s.frontDirection,s.useParcelGeometry,s.lotMode,s.lotSource,s.lotPoints,s.frontEdge,s.setbackFront,s.setbackRear,s.setbackSide,s.boundaryEvidenceId],boundary:B.siteBoundaryKey?.(),siteContext:B.siteEvidenceContextKey?.(),technical:B.constructionDesignIdentity?.(p)||{inputs:p.constructionDesign?.inputs,elements:p.constructionDesign?.elements},plan:{rooms:p.plan.rooms,openings:p.plan.openings,outdoor:p.plan.outdoor},style:p.style,design:d,materials:p.materials.choices,productCodes:B.materialSelectionIdentity?.(),finish:p.materials.finish});
  let hash=2166136261;for(let i=0;i<input.length;i++)hash=Math.imul(hash^input.charCodeAt(i),16777619);return (hash>>>0).toString(16).toUpperCase().padStart(8,'0');
 };
 const inputKey=B.designInputKey;if(inputKey)B.designInputKey=()=>inputKey()+'|site-evidence:'+B.siteEvidenceContextKey?.();
 const signature=B.cinematicSignature;B.cinematicSignature=focus=>signature(focus)+'|measured:'+B.drawingRevision();
 const structure=B.studioStructureKey;B.studioStructureKey=()=>structure()+'|measured-structure:'+JSON.stringify([B.measuredDesignSettings(),B.siteGeometryKey?.()]);
 let quantityCache;
 B.measuredQuantities=()=>{
  const p=B.state.project,key=B.drawingRevision();if(quantityCache?.project===p&&quantityCache.key===key)return quantityCache.value;
  const l=B.resolvedProjectLevels(),floors=[],openingMap=new Map();let wallArea=0,interiorWall=0,exteriorWall=0;
  for(let floor=0;floor<l.floors;floor++){
   const g=B.scenePlanGeometry(p.plan,floor),holes=B.stairFloorHoles(floor),nextHoles=B.stairFloorHoles(floor+1),wallRects=g.walls.map(w=>({x:w.horizontal?w.a:w.axis-w.thickness/2,y:w.horizontal?w.axis-w.thickness/2:w.a,w:w.horizontal?w.b-w.a:w.thickness,h:w.horizontal?w.thickness:w.b-w.a}));
   const floorWallRects=wallRects.filter((_,i)=>g.walls[i].kind!=='door');
   const area=panels=>panels.reduce((n,q)=>n+q.w*q.d,0),rooms=g.rooms.map(r=>{
    const slabPanels=B.slabPanels(r,holes),floorPanels=B.slabPanels(r,[...holes,...floorWallRects]),ceilingPanels=B.slabPanels(r,[...nextHoles,...wallRects]);
    return {roomId:r.id,name:r.name,type:r.type,floor,grossArea:r.w*r.h,slabArea:area(slabPanels),floorFinish:['stairs','elevator'].includes(r.type)?0:area(floorPanels),ceilingFinish:['stairs','elevator'].includes(r.type)?0:area(ceilingPanels)};
   });
   for(const w of g.walls){
    const len=w.b-w.a,H=B.floorLevel(floor).height-l.slab,aperture=w.kind==='wall'?0:len*Math.max(0,Math.min(w.height,H-(w.sill||0))),net=len*H-aperture;
    if(w.openingId){let item=openingMap.get(w.openingId);if(!item){item={id:w.openingId,floor,kind:w.kind,passage:!!p.plan.openings.find(o=>o.id===w.openingId)?.passage,area:0,width:0,height:w.height};openingMap.set(w.openingId,item);}item.area+=aperture;item.width+=len;}
    // Isolated lift enclosure is represented by elevatorGeometry, not masonry.
    const ids=w.roomIds.filter(id=>p.plan.rooms.find(r=>r.id===id)?.type!=='elevator');if(!ids.length)continue;
    const visibleHeight=B.floorLevel(floor).clearHeight,visibleOpening=w.kind==='wall'?0:len*Math.max(0,Math.min(w.height,visibleHeight-(w.sill||0)));
    wallArea+=net;interiorWall+=(len*visibleHeight-visibleOpening)*ids.length;if(w.roomIds.length===1)exteriorWall+=net;
   }
   floors.push({floor,level:B.floorLevel(floor),grossArea:B.floorPlanArea(g.rooms,p.site),slabArea:rooms.reduce((n,r)=>n+r.slabArea,0),floorFinish:rooms.reduce((n,r)=>n+r.floorFinish,0),ceilingFinish:rooms.reduce((n,r)=>n+r.ceilingFinish,0),rooms});
  }
  const roof=B.sceneRoofSpec(),openings=[...openingMap.values()],sum=field=>floors.reduce((n,f)=>n+f[field],0);
  const value={revision:key,units:'m²',floors,openings,grossArea:sum('grossArea'),slabArea:sum('slabArea'),floorFinish:sum('floorFinish'),ceilingFinish:sum('ceilingFinish'),wallArea,interiorWall,exteriorWall,paintArea:interiorWall+exteriorWall+(roof?.gableArea||0),doorArea:openings.filter(o=>o.kind==='door'&&!o.passage).reduce((n,o)=>n+o.area,0),windowArea:openings.filter(o=>o.kind==='window').reduce((n,o)=>n+o.area,0),roofArea:roof?.area??null,roof:roof?{type:roof.type,name:roof.name,pitchDeg:roof.pitchDeg,overhang:roof.overhang,width:roof.width,depth:roof.depth,eave:roof.eave,rise:roof.rise,area:roof.area,gableArea:roof.gableArea}:null,basis:{floor:'Sàn hữu dụng trong mô hình: trừ ô thang/giếng và phần tường chiếm chỗ; không gồm mặt bậc thang.',paint:'Mặt trong đến trần và mặt ngoài tường trừ ô cửa; gồm mặt ngoài đầu hồi. Chưa tính cạnh hồi ô mở, phào/giao góc, trần hoặc vùng ốp thay sơn.',roof:'Diện tích từng mặt dốc từ đỉnh 3D; chưa gồm chồng mí/phụ kiện.',openings:'Cửa theo ô mở, không cộng hai lần trên tường chung; quy cách khung/cánh cần báo giá.'}};
  quantityCache={project:p,key,value};return value;
 };
 B.materialQuantity=category=>{const q=B.measuredQuantities();return ({floor:q.floorFinish,paint:q.paintArea,door:q.doorArea+q.windowArea})[category]||0;};
 B.wallFinishArea=()=>B.measuredQuantities().paintArea;
 B.measuredDesignReview=()=>{
  const errors=[...B.measuredGeometryIssues(),...(B.stairAlignmentIssues?.()||[]).filter(i=>i.sev==='error'),...(B.elevatorIssues?.()||[]).filter(i=>i.sev==='error')],q=B.measuredQuantities(),roof=B.roofDesignSpec(),warnings=[];
  if(!q.roof)warnings.push('Mái dốc trên mặt bằng không chữ nhật chưa được dựng. Chia khối mái với KTS hoặc chọn mái bằng; không tự lấp khoảng khuyết.');
  if(B.state.project.plan.rooms.some(r=>r.x<B.measuredWallThickness(false)/2||r.y<B.measuredWallThickness(false)/2||r.x+r.w>B.state.project.site.width-B.measuredWallThickness(false)/2||r.y+r.h>B.state.project.site.depth-B.measuredWallThickness(false)/2))warnings.push('Mốc phòng sát ranh đất: kiểm tra mặt ngoài tường, khoảng lùi và phần mái đua.');
  warnings.push(...(B.elevatorIssues?.()||[]).filter(i=>i.sev!=='error').map(i=>i.text));
  warnings.push(...(B.stairAlignmentIssues?.()||[]).filter(i=>i.sev!=='error').map(i=>i.text));
  const technical=B.constructionReview?.();
  if(!B.resolvedProjectLevels().uniform&&B.STUDIO_LEVELS_CONTRACT!==1)warnings.push('Cao tầng riêng đã có trong 2D; consumer 3D cần tích hợp hợp đồng cao độ trước khi xuất ảnh / GLB / gói có 3D.');
  if(technical?.unparsed)warnings.push('Có '+technical.unparsed+' mục kỹ thuật cũ chưa có cấu trúc; giữ dữ liệu để đối chiếu hồ sơ gốc.');
  for(const record of technical?.records||[])if(record.status==='stale')warnings.push('Hồ sơ rà soát '+(record.discipline||record.id)+' thuộc phiên bản cũ; cần rà soát lại.');else if(record.kind==='review'&&record.status!=='reviewed')warnings.push('Hồ sơ rà soát '+(record.discipline||record.id)+' chưa đủ thông tin KTS/KS, nguồn và phiên bản được duyệt.');
  return {revision:q.revision,errors,warnings,geometryValid:errors.length===0,roof,quantities:q,technical,missing:['Khảo sát ranh/cao độ và địa chất','Kết cấu móng, cột, dầm, sàn','Tuyến điện nước, tải thiết bị và chi tiết chống thấm','Quy hoạch/giấy phép và hồ sơ chuyên môn được duyệt']};
 };
 B.roofSheetSvg=()=>{
  const roof=B.sceneRoofSpec(),q=B.measuredQuantities(),t=B.sheetText,scale=B.drawingScale((roof?.width||B.state.project.site.width)+3,(roof?.depth||B.state.project.site.depth)+3),font=scale*.0025;
  let content='';if(roof){const x=roof.bounds.cx-roof.width/2,y=roof.bounds.cy-roof.depth/2,points=face=>face.map(v=>v[0]+','+v[2]).join(' '),line=(a,b)=>'<line x1="'+a[0]+'" y1="'+a[2]+'" x2="'+b[0]+'" y2="'+b[2]+'" stroke="#546c59" stroke-width=".035"/>';
   const body=roof.faces.map(face=>'<polygon data-roof-face="1" points="'+points(face)+'" fill="#f1eee6" stroke="#526859" stroke-width=".025"/>').join('')+(roof.ridge.length===2?line(...roof.ridge):'')+'<text x="'+roof.bounds.cx+'" y="'+(y-.3)+'" text-anchor="middle">'+Math.round(roof.width*1000)+' mm</text><text x="'+(x+roof.width+.3)+'" y="'+roof.bounds.cy+'" transform="rotate(90 '+(x+roof.width+.3)+' '+roof.bounds.cy+')" text-anchor="middle">'+Math.round(roof.depth*1000)+' mm</text>';
   content='<svg x="18" y="32" width="'+((roof.width+3)*1000/scale)+'" height="'+((roof.depth+3)*1000/scale)+'" viewBox="'+[x-1.5,y-1.5,roof.width+3,roof.depth+3].join(' ')+'" class="measured-roof-plan"><style>.sheet-KT-MAI .measured-roof-plan text{font:'+font+'px Arial;fill:#304b3b}</style>'+body+'</svg>';
  }else content=t(20,50,'Chưa có hình học mái phù hợp mặt bằng. Cần thiết kế khối mái.',3);
  const side=t(330,29,'MÁI / PHONG CÁCH',3,'font-weight="bold"')+t(330,41,B.state.project.style,2.6)+t(330,52,B.roofDesignSpec().name)+t(330,64,'Dốc '+B.roofDesignSpec().pitchDeg+'°')+t(330,76,'Đua mái '+Math.round(B.roofDesignSpec().overhang*1000)+' mm')+t(330,88,'Diện tích '+(q.roofArea===null?'chưa có':q.roofArea.toFixed(2)+' m²'))+(roof?t(330,100,'Mép mái +'+roof.eave.toFixed(3)+' m')+t(330,112,'Đỉnh +'+(roof.eave+roof.rise).toFixed(3)+' m'):'')+t(330,190,'Chưa thiết kế hệ vì kèo,',2.5)+t(330,198,'thoát nước và cấu tạo mái.',2.5);
  return B.sheetFrame({code:'KT-MAI',title:'MẶT BẰNG MÁI',scale,content,sidebar:side,caption:'Kích thước mm; đỉnh/mặt mái dùng chung với 3D và dự toán. Thông số mái là phương án cần KTS/KS xác nhận.'});
 };
 const sheets=B.architecturalSheets;B.architecturalSheets=()=>[...sheets(),{name:'Mặt bằng mái',svg:B.roofSheetSvg()}];
 const currentDrawing=B.currentDrawingSvg;B.currentDrawingSvg=()=>B.state.ui.planner.view==='roof'?B.roofSheetSvg():currentDrawing();
 const exportSheet=B.exportPlanSvg;B.exportPlanSvg=()=>B.state.ui.planner.view==='roof'?B.download('BMH-mat-bang-mai-A3.svg',B.roofSheetSvg(),'image/svg+xml'):exportSheet();
 const planSheet=B.drawingSheetSvg;B.drawingSheetSvg=(...args)=>planSheet(...args).replace('Tường ngoài 220 / tường chung 120 mm (mô hình).','Tường ngoài '+Math.round(B.measuredWallThickness(false)*1000)+' / tường chung '+Math.round(B.measuredWallThickness(true)*1000)+' mm (mô hình).');
 const zip=B.zipStored;B.zipStored=files=>{const svg=files.filter(([name,data])=>name.endsWith('.svg')&&typeof data==='string');if(svg.some(([,data])=>data.includes('data-sheet-code="KT-MD"'))&&!svg.some(([,data])=>data.includes('data-sheet-code="KT-MAI"')))files=[...files,[(files.some(([name])=>name.startsWith('ban-ve/'))?'ban-ve/':'')+'mat-bang-mai.svg',B.roofSheetSvg()]];return zip(files);};
 const snapshot=B.customerDesignSnapshot;B.customerDesignSnapshot=()=>{
  // Explicit design-only allowlist: no raw documents, notes, household, account or finance data.
  const s=snapshot(),r=B.measuredDesignReview(),site=B.state.project.site,g=site.useParcelGeometry?B.parcelGeometry?.():null;
  s.project.siteBasis={schemaVersion:1,units:'m',basis:g?.basis||(site.useParcelGeometry?'invalid-boundary':'customer-dimensions'),vertices:g?structuredClone(g.points):null,frontEdge:site.frontEdge||0,setbacks:{front:site.setbackFront,rear:site.setbackRear,side:site.setbackSide,status:'entered-assumptions'},planningStatus:'unverified',sources:(B.state.project.designEvidence?.site||[]).filter(e=>['boundary','dimensions','setbacks','planning'].includes(e.kind)).map(e=>({id:e.id,kind:e.kind,sourceUrl:B.evidenceUrl?.(e.sourceUrl)||null,sourceType:e.sourceType,retrievedAt:e.retrievedAt,effectiveAt:e.effectiveAt,verifiedState:e.verifiedState}))};
  s.project.measuredDesign=structuredClone(B.measuredDesignSettings());s.project.site||={};s.project.site.floorHeights=structuredClone(site.floorHeights||[]);s.quantities=structuredClone(r.quantities);s.checks.push(...r.errors.map(i=>({severity:'error',text:i.text})),...r.warnings.map(text=>({severity:'warn',text})));s.requiredTechnicalDocuments=r.missing;s.technicalReview=structuredClone(r.technical);s.project.levels=structuredClone(B.resolvedProjectLevels().levels);s.notice='HỒ SƠ PHƯƠNG ÁN — CHƯA DÙNG THI CÔNG. '+(s.notice||'');return s;
 };
 const files=B.customerPackageFiles;B.customerPackageFiles=(s,sheets,html)=>[...files(s,sheets,html),['khoi-luong-mo-hinh.csv',B.csv([['Mã thiết kế','Tầng','Phòng','Diện tích mốc phòng m²','Sàn có ô thang m²','Sàn hoàn thiện m²','Trần m²'],...s.quantities.floors.flatMap(f=>f.rooms.map(r=>[s.revision,f.floor+1,r.name,r.grossArea,r.slabArea,r.floorFinish,r.ceilingFinish]))])]];
 B.measuredDesignPanel=()=>{
  const r=B.measuredDesignReview(),d=B.measuredDesignSettings(),roof=r.roof,q=r.quantities,label=(title,field,value,min,max,step)=>'<label>'+title+'<input type="number" data-measured-field="'+field+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+value+'"></label>';
  const controls='<div class="measured-fields"><label>Hình mái<select data-measured-field="roof.type">'+[['auto','Theo phong cách'],['flat','Mái bằng'],['hip','Bốn dốc'],['gable','Hai dốc'],['mono','Một dốc']].map(([id,name])=>'<option value="'+id+'" '+(d.roof.type===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label>'+label('Dốc mái (độ)','roof.pitchDeg',roof.pitchDeg,0,60,1)+label('Đua mái (m)','roof.overhang',roof.overhang,0,2,.05)+'<label>Hướng sống mái<select data-measured-field="roof.ridge">'+[['auto','Theo cạnh dài'],['depth','Theo chiều sâu'],['width','Theo chiều ngang']].map(([id,name])=>'<option value="'+id+'" '+(d.roof.ridge===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label>'+label('Tường ngoài (m)','wallThickness.exterior',d.wallThickness.exterior,.06,.6,.01)+label('Tường chung (m)','wallThickness.interior',d.wallThickness.interior,.06,.6,.01)+'</div><p>Đổi mái/tường cập nhật bản vẽ, 3D và khối lượng. Kích thước phòng là mốc phân chia trên mặt bằng; sàn hữu dụng đã trừ tường và ô thang. Bề dày tường, sàn và mái cần hồ sơ kỹ thuật xác nhận.</p>';
  return '<section class="measured-contract"><div><b>'+esc(B.state.project.style)+' · '+roof.name+'</b><small>Mã thiết kế '+r.revision+' · dùng chung bản vẽ / 3D / khối lượng</small></div><div class="measured-metrics"><span>Sàn hữu dụng <b>'+q.floorFinish.toFixed(2)+' m²</b></span><span>Mặt mái <b>'+(q.roofArea===null?'Chưa dựng':q.roofArea.toFixed(2)+' m²')+'</b></span></div>'+B.guidedDetails('measured-design','Thông số mái, tường & đối chiếu',controls+(r.errors.length?'<div class="guided-errors">'+r.errors.map(i=>'<p>'+esc(i.text)+'</p>').join('')+'</div>':'')+(r.warnings.length?'<ul>'+r.warnings.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>':'')+'<p>'+esc(q.basis.paint)+'</p><b>Hồ sơ cần bổ sung trước thi công</b><ul>'+r.missing.map(i=>'<li>'+esc(i)+'</li>').join('')+'</ul>')+'</section>';
 };
 for(const [name,index,selector]of [['screen5',3,'.v6-s5'],['screen7',5,'.design-studio'],['screen10',9,'.guided-dossier']]){
  const screen=B[name];B[name]=()=>{const t=document.createElement('template');t.innerHTML=screen();if(name==='screen5'){const picker=t.content.querySelector('[data-guided-plan-view]');picker?.insertAdjacentHTML('beforeend','<option value="roof" '+(B.state.ui.planner.view==='roof'?'selected':'')+'>Mặt bằng mái</option>');if(B.state.ui.planner.view==='roof'){const canvas=t.content.querySelector('.v6-plan-canvas');if(canvas)canvas.innerHTML=B.roofSheetSvg().replace('<svg ','<svg id="plannerSvg" ');}}t.content.querySelector(selector)?.prepend(document.createRange().createContextualFragment(B.measuredDesignPanel()));return t.innerHTML;};B.SCREENS[index]=B[name];
 }
 // Preserve one undo timeline for room edits and measured roof/wall edits.
 const snapshots=new WeakMap(),push=B.pushPlanHistory,undo=B.undoPlan,redo=B.redoPlan;
 B.pushPlanHistory=()=>{push();const snap=B.planHistory.undo.at(-1);if(snap)snapshots.set(snap,{settings:structuredClone(B.measuredDesignSettings()),style:B.state.project.style,levels:Object.fromEntries(['floorHeight','floorHeights','slabThickness','ceilingDrop'].map(k=>[k,structuredClone(B.state.project.site[k]??(k==='floorHeights'?[]:null))]))});};
 const restore=(action,from,to)=>{
  if(B.planHasLocks())return action();const target=B.planHistory[from].at(-1),data=target&&snapshots.get(target),current={settings:structuredClone(B.measuredDesignSettings()),style:B.state.project.style,levels:Object.fromEntries(['floorHeight','floorHeights','slabThickness','ceilingDrop'].map(k=>[k,structuredClone(B.state.project.site[k]??(k==='floorHeights'?[]:null))]))};
  if(data){B.state.project.measuredDesign=structuredClone(data.settings);B.state.project.style=data.style;if(data.levels)Object.assign(B.state.project.site,structuredClone(data.levels));}action();const latest=B.planHistory[to].at(-1);if(target&&latest)snapshots.set(latest,current);
 };
 B.undoPlan=()=>restore(undo,'undo','redo');B.redoPlan=()=>restore(redo,'redo','undo');
 const selectStyle=B.selectHouseStyle;B.selectHouseStyle=id=>{const style=B.HOUSE_STYLES.find(s=>s.id===id);if(style&&style.name!==B.state.project.style)B.pushPlanHistory();return selectStyle(id);};
 document.addEventListener('change',e=>{
  const input=e.target;if(!input.matches?.('[data-measured-field]'))return;const [group,key]=input.dataset.measuredField.split('.'),settings=B.measuredDesignSettings(),old=structuredClone(settings),value=input.tagName==='SELECT'?input.value:Number(input.value);
  if(input.tagName!=='SELECT'&&(!finite(value)||input.value===''||value<Number(input.min)||value>Number(input.max))){input.value=old[group][key];return B.toast('Thông số nằm ngoài khoảng nhập cho mô hình.');}
  if(B.planHasLocks())return B.toast('Mở khóa phòng/tầng trước khi đổi mái hoặc bề dày tường.');
  B.pushPlanHistory();settings[group][key]=value;B.customerFrameCache=null;B.save();B.render({preserveScroll:true});
 });
 B.variableLevelsConsumerReady=()=>B.resolvedProjectLevels().uniform||B.STUDIO_LEVELS_CONTRACT===1;
 const exportDesign=B.exportCustomerPackage;B.exportCustomerPackage=()=>{const r=B.measuredDesignReview();if(!r.geometryValid){B.toast('Sửa lỗi hình học trước khi xuất hồ sơ: '+r.errors[0].text);return Promise.resolve(false);}if(!B.variableLevelsConsumerReady()){B.toast('Gói có 3D cho cao tầng riêng đang chờ tích hợp. Có thể xuất hồ sơ A3 2D.');return Promise.resolve(false);}return exportDesign();};
 for(const name of ['exportPlanSvg','exportPlanDxf','exportStudioGlb','printArchitecturalDrawings','exportDrawingsBundle','exportDossierBundle']){const fn=B[name];if(!fn)continue;B[name]=(...args)=>{const r=B.measuredDesignReview();if(!r.geometryValid){B.toast('Sửa lỗi hình học trước khi xuất: '+r.errors[0].text);return false;}if(name==='exportStudioGlb'&&!B.variableLevelsConsumerReady()){B.toast('GLB cao tầng riêng đang chờ consumer 3D tích hợp cao độ.');return false;}return fn(...args);};}
})();
