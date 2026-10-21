/* Additive architecture coordination. Coordinates in metres; Architect3D in cm. */
// Validate without repairing or reordering the customer's boundary.
BMH.validateParcelVertices=points=>{
 const errors=[],n=Array.isArray(points)?points.length:0,edgeLabel=i=>'cạnh '+(i+1)+'–'+((i+1)%n+1);
 if(n<3||n>256)return {valid:false,errors:['Ranh cần từ 3 đến 256 đỉnh.'],area:null};
 if(points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)))return {valid:false,errors:['Tọa độ đỉnh phải là số hữu hạn theo mét.'],area:null};
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),eps=1e-8;
 const on=(a,b,c)=>Math.abs(cross(a,b,c))<=eps&&c.x>=Math.min(a.x,b.x)-eps&&c.x<=Math.max(a.x,b.x)+eps&&c.y>=Math.min(a.y,b.y)-eps&&c.y<=Math.max(a.y,b.y)+eps;
 for(let i=0;i<n;i++){
  const a=points[i],b=points[(i+1)%n],c=points[(i+2)%n];
  if(Math.hypot(b.x-a.x,b.y-a.y)<.01)errors.push('Đỉnh trùng hoặc '+edgeLabel(i)+' ngắn dưới 0,01 m.');
  if(on(a,b,c)&&Math.hypot(c.x-b.x,c.y-b.y)>.01)errors.push('Các cạnh tại đỉnh '+((i+1)%n+1)+' đi ngược và chồng nhau.');
  for(let j=i+1;j<n;j++){
   if(j===i+1||i===0&&j===n-1)continue;
   const c=points[j],d=points[(j+1)%n];
   if(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b))errors.push(edgeLabel(i)+' cắt/chạm '+edgeLabel(j)+'.');
  }
 }
 const area=Math.abs(points.reduce((a,p,i)=>a+p.x*points[(i+1)%n].y-points[(i+1)%n].x*p.y,0))/2;
 if(area<.01)errors.push('Ranh không có diện tích hợp lệ.');
 return {valid:errors.length===0,errors:[...new Set(errors)],area,edgeMeasurements:points.map((p,i)=>Math.hypot(points[(i+1)%n].x-p.x,points[(i+1)%n].y-p.y))};
};
BMH.parcelBoundaryReview=(s=BMH.state.project.site)=>{
 if(s.lotMode!=='custom')return {valid:true,points:null,basis:'dimensions',errors:[]};
 if(!Number.isInteger(Number(s.frontEdge??0)))return {valid:false,errors:['Cạnh mặt tiền phải là chỉ số nguyên của đỉnh ranh. Giữ dữ liệu gốc để chọn lại cạnh.']};
 if(s.lotSource==='survey-local'){
  const row=BMH.state.project.designEvidence?.site?.find(e=>e.id===s.boundaryEvidenceId);
  if(!row||row.verifiedState==='stale'||row.scope?.locationKey&&row.scope.locationKey!==BMH.siteLocationKey?.(s))return {valid:false,errors:['Nguồn ranh theo mét đã cũ hoặc chưa được chọn lại cho vị trí này.']};
  if(row.unit!=='m'||row.value?.sourceCrs!=='LOCAL_METRES'||!row.value?.surveyReference||!['customer','survey'].includes(row.sourceType))return {valid:false,errors:['Thiếu đơn vị mét, mốc đo hoặc nguồn số đo. Không tự chuyển hệ VN-2000.']};
  const points=row.value.localVertices;
  return {...BMH.validateParcelVertices(points),points,basis:'measured',evidenceId:row.id};
 }
 const ps=s.lotPoints;if(!Array.isArray(ps)||ps.length<3)return {valid:false,errors:['Chưa có ranh hoàn chỉnh; cần ít nhất 3 đỉnh.']};
 const points=ps.map(p=>BMH.localMeters(p,ps[0]));
 return {...BMH.validateParcelVertices(points),points,basis:'map'};
};
BMH.parcelGeometry=(s=BMH.state.project.site)=>{
 const review=BMH.parcelBoundaryReview(s);if(!review.valid||!review.points)return null;
 return BMH.parcelGeometryFromReview(review,s);
};
BMH.parcelGeometryFromReview=(review,s)=>{
 const ps=review.points,edge=((Number(s.frontEdge)||0)%ps.length+ps.length)%ps.length,origin=ps[edge],xy=ps.map(p=>({x:p.x-origin.x,y:p.y-origin.y})),v=xy[(edge+1)%ps.length],len=Math.hypot(v.x,v.y);
 const ux=v.x/len,uy=v.y/len,avg=xy.reduce((a,p)=>a+p.x*(-uy)+p.y*ux,0)/xy.length,sign=avg<0?-1:1;
 const raw=xy.map(p=>({x:p.x*ux+p.y*uy,y:sign*(-p.x*uy+p.y*ux)})),minX=Math.min(...raw.map(p=>p.x)),minY=Math.min(...raw.map(p=>p.y));
 const points=raw.map(p=>({x:p.x-minX,y:p.y-minY})),width=Math.max(...points.map(p=>p.x)),depth=Math.max(...points.map(p=>p.y));
 // A local survey does not define true north unless the customer provides its direction.
 const bearing=review.basis==='measured'?BMH.directionAngle(s.frontDirection):(Math.atan2(sign*uy,-sign*ux)*180/Math.PI+360)%360;
 const midY=points.map((p,i)=>(p.y+points[(i+1)%points.length].y)/2),furthest=Math.max(...midY);
 return {points,width,depth,frontEdge:edge,frontage:len,area:review.area,bearing,basis:review.basis,evidenceId:review.evidenceId,edgeMeasurements:review.edgeMeasurements,rearEdges:midY.flatMap((y,i)=>i!==edge&&Math.abs(y-furthest)<1e-6?[i]:[])};
};
BMH.assertParcelSize=g=>{if(!g||![g.width,g.depth].every(Number.isFinite)||g.width<2||g.width>30||g.depth<4||g.depth>80)throw new Error('Ranh theo cạnh mặt tiền cần rộng 2–30 m, sâu 4–80 m trong bộ thiết kế hiện tại. Giữ tọa độ gốc để KTS xử lý ngoài phạm vi.');};
BMH.pointInParcel=(p,poly)=>{
  let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
    const a=poly[j],b=poly[i],dx=b.x-a.x,dy=b.y-a.y,cross=dx*(p.y-a.y)-dy*(p.x-a.x);
    if(Math.abs(cross)<1e-7&&p.x>=Math.min(a.x,b.x)-1e-7&&p.x<=Math.max(a.x,b.x)+1e-7&&p.y>=Math.min(a.y,b.y)-1e-7&&p.y<=Math.max(a.y,b.y)+1e-7)return true;
    if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;
  }return inside;
};
BMH.roomInsideParcel=(r,s=BMH.state.project.site)=>{
  if(![r.x,r.y,r.w,r.h].every(Number.isFinite)||r.w<=0||r.h<=0)return false;
  const g=s.useParcelGeometry&&BMH.parcelGeometry(s);
  if(s.useParcelGeometry&&s.lotMode==='custom'&&!g)return false;
  if(!g){const side=Number(s.setbackSide)||0,front=Number(s.setbackFront)||0,rear=Number(s.setbackRear)||0;return r.x>=side-1e-6&&r.y>=front-1e-6&&r.x+r.w<=s.width-side+1e-6&&r.y+r.h<=s.depth-rear+1e-6;}
  const corners=[{x:r.x,y:r.y},{x:r.x+r.w,y:r.y},{x:r.x+r.w,y:r.y+r.h},{x:r.x,y:r.y+r.h}];
  if(!corners.every(p=>BMH.pointInParcel(p,g.points)))return false;
  // Partition each rectangle edge at every polygon intersection: handles narrow concave notches.
  for(let k=0;k<4;k++){
    const a=corners[k],b=corners[(k+1)%4],dx=b.x-a.x,dy=b.y-a.y,cuts=[0,1];
    for(let i=0;i<g.points.length;i++){
      const c=g.points[i],d=g.points[(i+1)%g.points.length],ex=d.x-c.x,ey=d.y-c.y,den=dx*ey-dy*ex;
      if(Math.abs(den)<1e-9)continue;
      const t=((c.x-a.x)*ey-(c.y-a.y)*ex)/den,u=((c.x-a.x)*dy-(c.y-a.y)*dx)/den;
      if(t>0&&t<1&&u>=0&&u<=1)cuts.push(t);
    }cuts.sort((x,y)=>x-y);
    for(let i=1;i<cuts.length;i++){const t=(cuts[i]+cuts[i-1])/2;if(!BMH.pointInParcel({x:a.x+t*dx,y:a.y+t*dy},g.points))return false;}
  }
  const side=Number(s.setbackSide)||0,front=Number(s.setbackFront)||0,rear=Number(s.setbackRear)||0;

  // Each side/notch edge has the configured side setback, measured by segment distance.
  const dist=(p,a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);};
  for(let i=0;i<g.points.length;i++){
    const a=g.points[i],b=g.points[(i+1)%g.points.length],setback=i===g.frontEdge?front:(g.rearEdges||[]).includes(i)?rear:side;
    for(let k=0;k<4;k++){const c=corners[k],d=corners[(k+1)%4];if(Math.min(dist(c,a,b),dist(d,a,b),dist(a,c,d),dist(b,c,d))<setback-1e-6)return false;}
  }return true;
};
const architectureRoomValid=BMH.roomValid;
BMH.roomWithWallClearance=r=>{const half=BMH.state.project.site.useParcelGeometry&&BMH.measuredWallThickness?BMH.measuredWallThickness(false)/2:0;return {...r,x:r.x-half,y:r.y-half,w:r.w+half*2,h:r.h+half*2};};
BMH.roomValid=r=>architectureRoomValid(r)&&BMH.roomInsideParcel(BMH.roomWithWallClearance(r));
const architectureParcelStats=BMH.siteParcelStats;
BMH.siteParcelStats=(s=BMH.state.project.site)=>{const g=BMH.parcelGeometry(s);return g?{mode:'custom',points:s.lotPoints,area:g.area,perimeter:(g.edgeMeasurements||g.points.map((p,i)=>Math.hypot(g.points[(i+1)%g.points.length].x-p.x,g.points[(i+1)%g.points.length].y-p.y))).reduce((a,n)=>a+n,0),frontage:g.frontage,approxDepth:g.area/g.frontage,basis:g.basis}:architectureParcelStats?.(s);};
const architectureEnvelope=BMH.buildableEnvelope;
BMH.buildableEnvelope=(s=BMH.state.project.site)=>{const e=architectureEnvelope(s),g=s.useParcelGeometry&&BMH.parcelGeometry(s);if(g){e.designArea=g.area;e.targetPlate=Math.min(e.envelopeArea,g.area*e.coverage);e.gfa=e.targetPlate*Math.max(1,Number(s.floors)||1);e.openArea=Math.max(0,g.area-e.targetPlate);e.parcelGeometry=g;}return e;};
BMH.projectLevels=()=>BMH.siteLevels();
BMH.levelChangeIssues=site=>{
  const l=BMH.siteLevels(site),p=BMH.state.project,issues=[...l.issues];
  for(const o of p.plan.openings){const level=l.levels[o.floor],height=Number(o.height??(o.kind==='window'?1.4:2.1)),sill=o.kind==='window'?Number(o.sill??.9):0;if(level&&height+sill>level.clearHeight+.001)issues.push('Ô mở '+o.id+': vượt chiều cao thông thủy tầng '+(o.floor+1)+'.');}
  for(const q of p.plan.fixtures||[]){const level=l.levels[q.floor];if(level&&q.h>level.clearHeight+.001)issues.push('Fixture '+q.id+': vượt chiều cao thông thủy.');}
  return issues;
};
BMH.editFloorHeight=(floor,height)=>{
  const s=BMH.state.project.site;if(!Number.isInteger(floor)||floor<0||floor>=Number(s.floors)||height!==null&&(!Number.isFinite(height)||height<2.4||height>6))return false;
  if(BMH.state.project.plan.lockedFloors?.some(f=>f>=floor)){BMH.toast('Tầng chịu ảnh hưởng đang khóa.');return false;}
  const heights=[...(s.floorHeights||[])];heights[floor]=height;const issues=BMH.levelChangeIssues({...s,floorHeights:heights});
  if(issues.length){BMH.toast(issues[0]);return false;}if((s.floorHeights?.[floor]??null)===height)return true;
  BMH.pushPlanHistory();s.floorHeights=heights;BMH.save();return true;
};
BMH.openingReview=o=>{
  const s=BMH.state.project.site,r=BMH.state.project.plan.rooms.find(r=>r.id===o.roomId),span=BMH.openingWallSpan(o);if(!r||!span)return {issues:['Cửa chưa có cạnh tường hợp lệ.'],direction:'',score:0};
  const front=s.useParcelGeometry?BMH.parcelGeometry(s)?.bearing:BMH.directionAngle(s.frontDirection),bearing=((front||0)+({north:0,east:90,south:180,west:270}[o.side]))%360;
  const direction=BMH.DIRECTIONS.reduce((a,b)=>Math.abs(((b[1]-bearing+540)%360)-180)<Math.abs(((a[1]-bearing+540)%360)-180)?b:a)[0];
  const neighbours=BMH.state.project.plan.rooms.filter(n=>n.id!==r.id&&n.floor===r.floor&&((span.o==='h'&&(Math.abs(n.y-span.c)<.01||Math.abs(n.y+n.h-span.c)<.01)&&Math.min(n.x+n.w,span.b)-Math.max(n.x,span.a)>=o.width-.01)||(span.o==='v'&&(Math.abs(n.x-span.c)<.01||Math.abs(n.x+n.w-span.c)<.01)&&Math.min(n.y+n.h,span.b)-Math.max(n.y,span.a)>=o.width-.01)));
  const height=Number(o.height)||(o.kind==='window'?1.4:2.1),sill=o.kind==='window'?(Number.isFinite(Number(o.sill))?Number(o.sill):.9):0,issues=[];
  if(height+sill>BMH.floorLevel(o.floor).clearHeight)issues.push('Đỉnh cửa vượt chiều cao thông thủy dưới trần.');
  if(o.kind==='window'&&neighbours.length)issues.push('Cửa sổ trên tường chung, chưa tiếp xúc sân hoặc khoảng thông thoáng.');
  if(o.kind==='door'&&o.width<.9)issues.push('Lối đi dưới 0,90 m; kiểm tra tiếp cận cho người cao tuổi.');
  return {direction,bearing,score:BMH.fengDirectionScore(direction),height,sill,issues,explanation:(o.kind==='window'?'Ô mở lấy sáng / thông gió':'Lối đi')+(neighbours.length?' thông sang '+neighbours.map(n=>n.name).join(', '):' trên tường ngoài')+'. Hướng '+direction+'; tham khảo '+BMH.fengProfile().title+' ở Tab 3.'};
};
BMH.editOpening=(id,changes)=>{
  const original=BMH.state.project.plan.openings.find(o=>o.id===id);
  if(!original)return false;
  if(BMH.isRoomLocked(original.roomId)){BMH.toast('Phòng hoặc tầng đang khóa.');return false;}
  const candidate={...original,...changes};if(candidate.kind==='door'&&(!['left','right'].includes(candidate.hinge??'left')||!['in','out'].includes(candidate.swing??'in'))){BMH.toast('Kiểm tra bản lề và chiều mở cửa.');return false;}
  const height=Number(candidate.height??(candidate.kind==='window'?1.4:2.1)),sill=Number(candidate.sill??0);
  if(!BMH.openingFits(candidate,id)||!Number.isFinite(height)||height<.3||!Number.isFinite(sill)||sill<0){BMH.toast('Cửa không vừa cạnh tường hoặc trùng ô mở khác.');return false;}
  const review=BMH.openingReview(candidate);
  if(review.height+review.sill>BMH.floorLevel(candidate.floor).clearHeight){BMH.toast('Đỉnh cửa vượt chiều cao dưới trần.');return false;}
  if(Object.keys(changes).every(k=>original[k]===candidate[k]))return true;
  BMH.pushPlanHistory();Object.assign(original,candidate);BMH.save();return true;
};
const architectureIssues=BMH.plannerIssues;
BMH.plannerIssues=()=>[...architectureIssues(),...BMH.state.project.plan.rooms.filter(r=>!BMH.roomInsideParcel(r)).map(r=>({sev:'error',text:r.name+': vượt ranh thửa đất hoặc khoảng lùi đã nhập.'})),...BMH.state.project.plan.openings.flatMap(o=>BMH.openingReview(o).issues.map(text=>({sev:'warn',text})) )];
BMH.architecturePanel=()=>{
  const p=BMH.state.project,s=p.site,l=BMH.projectLevels(),esc=BMH.v6Esc;
  const field=(key,label,value,min,max)=>'<label>'+label+' (m)<input type="number" data-architecture-field="'+key+'" step="0.01" min="'+min+'" max="'+max+'" value="'+value+'"></label>';
  return '<section class="v6-card architecture-spec"><h3>Kích thước & giải thích bố trí</h3><p><button data-auto-plan>Tạo lại mặt bằng từ đất & gia đình</button> · Giữ ranh đất, nhu cầu gia đình và số tầng; thay bố trí hiện tại. Có thể hoàn tác.</p><button data-suggest-openings>Gợi ý lại vị trí cửa theo gia đình & lối đi</button><div class="architecture-fields">'+field('floorHeight','Cao tầng · sàn đến sàn',l.floorHeight,2.4,6)+field('slabThickness','Bề dày sàn dự kiến',l.slab,.08,.5)+field('ceilingDrop','Hạ trần',l.ceilingDrop,0,1)+'<p>Thông thủy dưới trần: <b>'+l.clearHeight.toFixed(2)+' m</b></p></div><p>Kích thước phòng và hành lang sửa bằng chọn phòng trên mặt bằng. Cao tầng chung dùng khi chưa nhập riêng. Cao độ tương đối chưa phải cao độ khảo sát.</p><div class="architecture-fields">'+l.levels.map(v=>'<label>Tầng '+(v.floor+1)+' · cao sàn đến sàn (m)<input type="number" min="2.4" max="6" step=".01" data-floor-height="'+v.floor+'" value="'+(s.floorHeights?.[v.floor]??'')+'" placeholder="Chung: '+l.floorHeight.toFixed(3)+'">Cốt +'+v.base.toFixed(3)+' · thông thủy '+v.clearHeight.toFixed(3)+' m</label>').join('')+'</div><div class="architecture-table"><table><thead><tr><th>Phòng / tầng</th><th>Rộng × dài / m</th><th>Diện tích</th></tr></thead><tbody>'+p.plan.rooms.map(r=>'<tr><td>'+esc(r.name)+' · '+(r.floor+1)+'</td><td>'+r.w.toFixed(2)+' × '+r.h.toFixed(2)+'</td><td>'+(r.w*r.h).toFixed(2)+' m²</td></tr>').join('')+'</tbody></table><table><thead><tr><th>Cửa</th><th>Rộng / cao / bậu · m</th><th>Giải thích từ Tab 3 & kiểm tra</th></tr></thead><tbody>'+p.plan.openings.map(o=>{const v=BMH.openingReview(o),name=p.plan.rooms.find(r=>r.id===o.roomId)?.name||'';return '<tr><td>'+esc(name)+'<br>'+esc(o.kind==='window'?'Cửa sổ':'Cửa đi')+' · '+esc({north:'Đầu đất',south:'Cuối đất',east:'Bên phải',west:'Bên trái'}[o.side]||o.side)+'<br><select data-opening-id="'+esc(o.id)+'" data-opening-side>'+['north','south','east','west'].map(side=>'<option value="'+side+'" '+(o.side===side?'selected':'')+'>'+esc({north:'Đầu đất',south:'Cuối đất',east:'Bên phải',west:'Bên trái'}[side])+'</option>').join('')+'</select><label>Vị trí trên cạnh · 0–1<input min="0" max="1" step="0.01" type="number" data-opening-id="'+esc(o.id)+'" data-opening-dimension="offset" value="'+o.offset+'"></label>'+(o.kind==='door'?'<label>Bản lề<select data-opening-id="'+esc(o.id)+'" data-opening-motion="hinge"><option value="left" '+(o.hinge!=='right'?'selected':'')+'>Đầu cạnh (trái)</option><option value="right" '+(o.hinge==='right'?'selected':'')+'>Cuối cạnh (phải)</option></select></label><label>Chiều mở<select data-opening-id="'+esc(o.id)+'" data-opening-motion="swing"><option value="in" '+(o.swing!=='out'?'selected':'')+'>Vào phòng</option><option value="out" '+(o.swing==='out'?'selected':'')+'>Ra ngoài</option></select></label>':'')+'</td><td>'+['width','height','sill'].map(k=>'<label>'+({width:'Rộng',height:'Cao',sill:'Bậu'}[k])+'<input type="number" min="0" step="0.01" data-opening-id="'+esc(o.id)+'" data-opening-dimension="'+k+'" value="'+(k==='width'?o.width:v[k])+'" '+(k==='sill'&&o.kind==='door'?'disabled':'')+'></label>').join('')+'</td><td>'+esc(v.explanation||'')+'<br>Điểm hướng tham khảo: '+v.score+'/100'+v.issues.map(x=>'<p class="architecture-warning">'+esc(x)+'</p>').join('')+'</td></tr>';}).join('')+'</tbody></table></div></section>';
};
const architectureScreen1=BMH.screen1,architectureScreen3=BMH.screen3,architectureScreen5=BMH.screen5,architectureScreen7=BMH.screen7;
BMH.screen1=()=>architectureScreen1()+BMH.houseStylePanel();
BMH.screen3=()=>{const s=BMH.state.project.site,g=BMH.parcelGeometry(s);return architectureScreen3().replace('Bản vẽ cùng dự toán đang dùng kích thước mặt tiền × chiều sâu do bạn nhập, chưa tự suy diện tích xây từ polygon.',s.useParcelGeometry?'Bản vẽ và dự toán đang dùng diện tích polygon đã áp dụng cùng khoảng lùi bạn khai báo. Đây chưa phải xác minh diện tích được cấp phép.':'Áp dụng ranh thửa ở phần dưới để dùng polygon cho bản vẽ và dự toán.')+(BMH.siteEvidencePanel?.()||'')+'<section class="v6-card architecture-parcel"><h3>Thửa đất dùng cho bản vẽ</h3>'+(g?'<label>Cạnh mặt tiền<select data-parcel-front>'+g.points.map((p,i)=>'<option value="'+i+'" '+(i===g.frontEdge?'selected':'')+'>Cạnh '+(i+1)+' → '+((i+1)%g.points.length+1)+'</option>').join('')+'</select></label><p>Ranh đã chọn: '+g.area.toFixed(2)+' m² · mặt tiền '+g.frontage.toFixed(2)+' m · khung bao '+g.width.toFixed(2)+' × '+g.depth.toFixed(2)+' m.</p><p>Diện tích trên sổ: '+(Number(s.deedArea)>0?Number(s.deedArea).toFixed(2)+' m² · lệch '+Math.abs(g.area-s.deedArea).toFixed(2)+' m²':'chưa nhập')+'</p><div class="architecture-table"><table><thead><tr><th>Cạnh polygon</th><th>Chiều dài theo nguồn ranh · m</th></tr></thead><tbody>'+g.points.map((p,i)=>'<tr><td>'+ (i+1)+' → '+((i+1)%g.points.length+1)+'</td><td>'+Math.hypot(g.points[(i+1)%g.points.length].x-p.x,g.points[(i+1)%g.points.length].y-p.y).toFixed(2)+'</td></tr>').join('')+'</tbody></table></div><button data-use-parcel>Dùng ranh này để giới hạn bản vẽ</button><p>'+(s.useParcelGeometry?'Bản vẽ đang dùng ranh polygon này.':'Ranh chưa được áp dụng cho bản vẽ.')+' Ranh vẽ trên ảnh nền cần đối chiếu tọa độ và số đo trong sổ; vị trí ghim đơn lẻ không xác định thửa đất.</p>':'<p>Vẽ các đỉnh hoặc nhập GeoJSON ranh thửa ở bản đồ phía trên, đối chiếu số đo trên sổ trước khi áp dụng.</p>')+'</section>';};
const architectureStyleSummary=()=>'<p class="architecture-style-summary">Phong cách: <b>'+BMH.v6Esc(BMH.state.project.style)+'</b> · đổi lựa chọn ở Tab 1.</p>';
BMH.screen5=()=>architectureScreen5().replace(BMH.houseStylePanel(),'');
BMH.screen7=()=>architectureScreen7().replace(BMH.houseStylePanel(),architectureStyleSummary());
BMH.SCREENS[0]=BMH.screen1;BMH.SCREENS[1]=BMH.screen3;BMH.SCREENS[3]=BMH.screen5;BMH.SCREENS[5]=BMH.screen7;
document.addEventListener('click',e=>{if(!e.target.closest?.('[data-use-parcel]'))return;const s=BMH.state.project.site,g=BMH.parcelGeometry(s);if(!g)return;try{BMH.assertParcelSize(g);}catch(error){BMH.toast(error.message);return;}s.useParcelGeometry=true;s.width=g.width;s.depth=g.depth;const d=BMH.DIRECTIONS.reduce((a,b)=>Math.abs(((b[1]-g.bearing+540)%360)-180)<Math.abs(((a[1]-g.bearing+540)%360)-180)?b:a);s.frontDirection=d[0];BMH.save();BMH.render();BMH.toast('Đã áp dụng ranh thửa. Phòng vượt ranh được đánh dấu để điều chỉnh.');});
document.addEventListener('change',e=>{
  const t=e.target,s=BMH.state.project.site;
  if(t.matches?.('[data-parcel-front]')){s.frontEdge=Number(t.value);s.useParcelGeometry=false;BMH.save();BMH.render();}
  if(t.dataset.architectureEngine!==undefined){BMH.state.ui.architectureEngine=t.value;BMH.save();BMH.render();}
  if(t.dataset.floorHeight!==undefined){BMH.editFloorHeight(Number(t.dataset.floorHeight),t.value.trim()===''?null:Number(t.value));BMH.render({preserveScroll:true});}
  if(t.dataset.architectureField){const key=t.dataset.architectureField,n=Number(t.value),old=s[key];if(!Number.isFinite(n)||n<Number(t.min)||n>Number(t.max))return BMH.toast('Kích thước không hợp lệ.');const issues=BMH.levelChangeIssues({...s,[key]:n});if(issues.length){t.value=old;return BMH.toast(issues[0]);}if(n!==old){BMH.pushPlanHistory();s[key]=n;BMH.save();}BMH.render();}
  if(t.dataset.openingSide!==undefined){BMH.editOpening(t.dataset.openingId,{side:t.value});BMH.render({preserveScroll:true});}
  if(t.dataset.openingMotion){const key=t.dataset.openingMotion;if((key==='hinge'&&['left','right'].includes(t.value))||(key==='swing'&&['in','out'].includes(t.value)))BMH.editOpening(t.dataset.openingId,{[key]:t.value});BMH.render({preserveScroll:true});}
  if(t.dataset.openingDimension){const key=t.dataset.openingDimension,n=Number(t.value);if(!Number.isFinite(n)||n<0||(!['sill','offset'].includes(key)&&n<=0)||(key==='offset'&&n>1))return BMH.toast('Kích thước cửa không hợp lệ.');BMH.editOpening(t.dataset.openingId,{[key]:n});BMH.render({preserveScroll:true});}
});
const architecturePlanSvg=BMH.planSvg;
BMH.planSvg=options=>{const markup=architecturePlanSvg(options),s=BMH.state.project.site,g=s.useParcelGeometry&&BMH.parcelGeometry(s);if(!g)return markup;return markup.replace(/<rect\b[^>]*class="plot-boundary"[^>]*\/>/,()=>'<polygon class="plot-boundary" points="'+g.points.map(p=>p.x+','+p.y).join(' ')+'"/>');};
const architectureLayoutValid=BMH.layoutValid;
BMH.layoutValid=rooms=>architectureLayoutValid(rooms)&&rooms.every(r=>BMH.roomInsideParcel(BMH.roomWithWallClearance(r)));
let parcelFitCache;
BMH.parcelFitRectangle=(s=BMH.state.project.site)=>{
 const clearance=Math.max(BMH.measuredWallThickness?BMH.measuredWallThickness(false)/2:0,BMH.roofDesignSpec?.().overhang||0);const key=JSON.stringify([s.lotMode,s.lotPoints,s.boundaryEvidenceId,BMH.siteBoundaryKey?.(),s.frontEdge,s.setbackSide,s.setbackFront,s.setbackRear,clearance]);if(parcelFitCache?.key===key)return parcelFitCache.value;
 const g=BMH.parcelGeometry(s);if(!g)return null;
 const side=Number(s.setbackSide)||0,front=Number(s.setbackFront)||0,rear=Number(s.setbackRear)||0;
 const bounded=values=>values.length<=18?values:Array.from({length:18},(_,i)=>values[Math.round(i*(values.length-1)/17)]);
 const xs=bounded([...new Set([side+clearance,g.width-side-clearance,...g.points.flatMap(p=>[p.x-side-clearance,p.x+side+clearance])].filter(x=>x>=0&&x<=g.width))].sort((a,b)=>a-b));
 const ys=bounded([...new Set([front+clearance,g.depth-rear-clearance,...g.points.flatMap(p=>[p.y-side-clearance,p.y+side+clearance])].filter(y=>y>=front&&y<=g.depth-rear))].sort((a,b)=>a-b));
 let best=null;for(let a=0;a<xs.length;a++)for(let b=a+1;b<xs.length;b++)for(let c=0;c<ys.length;c++)for(let d=c+1;d<ys.length;d++){
   const r={x:xs[a],y:ys[c],w:xs[b]-xs[a],h:ys[d]-ys[c]};if(r.w<.6||r.h<.6||best&&r.w*r.h<=best.w*best.h)continue;if(BMH.roomInsideParcel({...r,x:r.x-clearance,y:r.y-clearance,w:r.w+2*clearance,h:r.h+2*clearance},s))best=r;
 }parcelFitCache={key,value:best};return best;
};
const architectureParcelEnvelope=BMH.buildableEnvelope;
BMH.buildableEnvelope=(s=BMH.state.project.site)=>{const e=architectureParcelEnvelope(s);if(s.useParcelGeometry){const r=BMH.parcelFitRectangle(s);if(r){e.originX=r.x;e.originY=r.y;e.buildWidth=r.w;e.buildDepth=r.h;e.envelopeArea=r.w*r.h;e.targetPlate=Math.min(e.envelopeArea,e.designArea*e.coverage);e.gfa=e.targetPlate*Math.max(1,Number(s.floors)||1);e.openArea=e.designArea-e.targetPlate;}else{e.buildWidth=0;e.buildDepth=0;e.envelopeArea=0;e.targetPlate=0;e.gfa=0;e.openArea=e.designArea;}}return e;};
BMH.suggestOpeningPosition=o=>{
 const p=BMH.state.project,r=p.plan.rooms.find(r=>r.id===o.roomId);if(!r||BMH.isRoomLocked(r.id))return null;
 const candidates=['north','south','east','west'].flatMap(side=>{
  const len=['north','south'].includes(side)?r.w:r.h;if(len<o.width+.2)return [];
  return [.25,.5,.75].flatMap(offset=>{
   const candidate={...o,side,offset};if(!BMH.openingFits(candidate))return [];
   const review=BMH.openingReview(candidate),span=BMH.openingWallSpan(candidate),other=p.plan.rooms.filter(n=>n.id!==r.id&&n.floor===r.floor).filter(n=>{
    if(span.o==='h')return (Math.abs(n.y-span.c)<.01||Math.abs(n.y+n.h-span.c)<.01)&&Math.min(n.x+n.w,span.b)-Math.max(n.x,span.a)>=o.width-.01;
    return (Math.abs(n.x-span.c)<.01||Math.abs(n.x+n.w-span.c)<.01)&&Math.min(n.y+n.h,span.b)-Math.max(n.y,span.a)>=o.width-.01;
   });
   if(o.kind==='window'&&other.length)return [];
   if(o.kind==='door'&&!other.length&&!(r.floor===0&&['living','garage','corridor'].includes(r.type)))return [];
   // Circulation has priority: private rooms should open to a hall, not another bedroom.
   const access=other.some(n=>n.type==='corridor')?300:other.some(n=>['living','stairs'].includes(n.type))?200:other.some(n=>n.type==='bed')?-200:100;
   const score=(o.kind==='door'?access:0)+review.score-(o.kind==='window'&&review.direction==='Tây'?30:0)-Math.abs(offset-.5)*5;
   return [{candidate,score,review}];
  });
 });return candidates.sort((a,b)=>b.score-a.score)[0]||null;
};
document.addEventListener('click',e=>{if(!e.target.closest?.('[data-suggest-openings]'))return;const p=BMH.state.project;BMH.pushPlanHistory();let count=0;for(const o of p.plan.openings){const proposal=BMH.suggestOpeningPosition(o);if(proposal){Object.assign(o,proposal.candidate);count++;}}BMH.save();BMH.render();BMH.toast('Đã gợi ý '+count+' vị trí cửa từ lối đi, hướng gia đình và ô mở hiện có. Xem giải thích trong bảng; có thể hoàn tác.');});

const architectureMapContext=BMH.updateMapContext;
BMH.updateMapContext=()=>{if(BMH.state.project.site.lotSource==='survey-local'&&!BMH.state.ui.location?.drawingLot){BMH.clearMapExtras?.();return;}return architectureMapContext?.();};
