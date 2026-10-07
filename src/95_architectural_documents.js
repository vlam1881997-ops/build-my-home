/* Print architecture in paper millimetres. Every visible element comes from
 * the measured plan, model openings, stair parts, furniture placements or facade parts. */
(()=>{
 const B=BMH,esc=B.esc,ink='#25313b',light='#7d8991',blue='#244b69';
 const n=value=>Number(Number(value).toFixed(5)),attr=s=>esc(String(s??''));
 const line=(x,y,a,b,width=.18,color=ink,dash='')=>'<line x1="'+n(x)+'" y1="'+n(y)+'" x2="'+n(a)+'" y2="'+n(b)+'" stroke="'+color+'" stroke-width="'+width+'"'+(dash?' stroke-dasharray="'+dash+'"':'')+'/>';
 const rect=(x,y,w,h,fill='none',width=.18,color=ink,extra='')=>'<rect x="'+n(x)+'" y="'+n(y)+'" width="'+n(w)+'" height="'+n(h)+'" fill="'+fill+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const text=(x,y,value,size=2.5,anchor='start',extra='')=>'<text x="'+n(x)+'" y="'+n(y)+'" font-family="Arial,sans-serif" font-size="'+size+'" fill="'+ink+'" text-anchor="'+anchor+'" '+extra+'>'+esc(String(value??''))+'</text>';
 const circle=(x,y,r,fill='white')=>'<circle cx="'+n(x)+'" cy="'+n(y)+'" r="'+r+'" fill="'+fill+'" stroke="'+light+'" stroke-width=".18"/>';
 const polygon=(points,fill='none',width=.2,color=ink,extra='')=>'<polygon points="'+points.map(p=>n(p.x)+','+n(p.y)).join(' ')+'" fill="'+fill+'" stroke="'+color+'" stroke-width="'+width+'" '+extra+'/>';
 const dim=(a,b,shift,label)=>{
  const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);if(len<.01)return '';const nx=-dy/len,ny=dx/len,A={x:a.x+nx*shift,y:a.y+ny*shift},C={x:b.x+nx*shift,y:b.y+ny*shift},angle=Math.abs(dx)<.01?-90:0;
  const tick=p=>line(p.x-1,p.y+1,p.x+1,p.y-1,.23),tx=(A.x+C.x)/2+nx*1.2,ty=(A.y+C.y)/2+ny*1.2;
  return '<g class="sheet-dimension" data-mm="'+attr(label)+'">'+line(a.x+nx*.8,a.y+ny*.8,A.x+nx*1.3,A.y+ny*1.3,.13,light)+line(b.x+nx*.8,b.y+ny*.8,C.x+nx*1.3,C.y+ny*1.3,.13,light)+line(A.x,A.y,C.x,C.y,.15)+tick(A)+tick(C)+text(tx,ty,label,2.25,'middle',angle?'transform="rotate('+angle+' '+tx+' '+ty+')"':'')+'</g>';
 };
 const words=(value,max)=>B.drawingWrap(value,max);
 const blockText=(x,y,value,max=36,size=2.4)=>words(value,max).map((s,i)=>text(x,y+i*4,s,size)).join('');
 const paperFrame=B.sheetFrame;
 B.sheetFrame=options=>{
  // Existing detailed stair/lift sheets share the same restrained frame.
  return paperFrame(options).replace('BUILD MY HOME / ','BMH DESIGN / ').replace('#24342c',ink).replaceAll('#26342e',ink).replace('BẢNG THỐNG KÊ',options.scaleLabel||'BẢNG THỐNG KÊ');
 };
 const sheet=({code,title,scale,scaleLabel,body,sidebar='',caption='',floor})=>{
  const svg=B.sheetFrame({code,title,scale,scaleLabel,content:body,sidebar,caption,floor});
  return svg.replace('<g font-family=', '<g font-family=').replace('data-sheet-code="'+code+'"','data-sheet-code="'+code+'" data-document-version="3"');
 };
 const groupTitle=(x,y,title)=>line(x,y+2,x+73,y+2,.28,blue)+text(x,y,title,2.9,'start','font-weight="bold"');
 const scaleBar=(x,y,scale)=>{const k=1000/scale;let s=text(x,y-2,'THƯỚC TỶ LỆ · m',2.1);for(let i=0;i<4;i++)s+=rect(x+i*k,y,k,1.4,i%2?'white':ink,.15)+text(x+i*k,y+5,i,2.1,'middle');return s+text(x+4*k,y+5,'4',2.1,'middle');};
 const compass=(x,y,rotation)=>'<g transform="translate('+x+' '+y+')"><circle r="5.5" fill="none" stroke="'+light+'" stroke-width=".2"/><g transform="rotate('+rotation+')"><path d="M0 -5L1.8 3L0 1L-1.8 3Z" fill="'+blue+'"/>'+line(0,-5,0,4,.2,blue)+'</g>'+text(0,-8,'BẮC',2.2,'middle')+'</g>';
 const quantityRoom=r=>B.measuredQuantities().floors.find(f=>f.floor===r.floor)?.rooms.find(q=>q.roomId===r.id);
 B.architecturalRoomSchedule=(floor=0)=>B.floorRooms(floor).map((r,i)=>({code:'P'+String(i+1).padStart(2,'0'),...r,net:quantityRoom(r)?.floorFinish??null}));
 B.architecturalFurnitureSchedule=(floor=0)=>B.floorRooms(floor).flatMap(r=>B.roomFurnitureLayout(r).map((p,i)=>({code:'N'+String(B.floorRooms(floor).slice(0,B.floorRooms(floor).indexOf(r)).reduce((a,r)=>a+B.roomFurnitureLayout(r).length,0)+i+1).padStart(2,'0'),...p,name:({washingMachine:'Máy giặt · mẫu 600 × 650',bedDouble:'Giường đôi',bedSingle:'Giường đơn',loungeDesignSofa:'Sofa',loungeChair:'Ghế thư giãn',tableCoffee:'Bàn trà',cabinetTelevision:'Kệ TV',televisionModern:'TV',table:'Bàn ăn',chair:'Ghế ăn',kitchenSink:'Chậu / tủ bếp',kitchenStove:'Bếp nấu',kitchenFridge:'Tủ lạnh',bathroomSink:'Lavabo',toilet:'Bồn cầu',shower:'Tắm kính',bookcaseClosedWide:'Tủ / kệ',cabinetBed:'Tủ đầu giường',desk:'Bàn làm việc',chairDesk:'Ghế làm việc',sideTable:'Bàn phụ',floorLamp:'Đèn đứng',pottedPlant:'Chậu cây'})[p.model]||p.model,room:r.name,roomId:r.id})));
 const planLayout=floor=>{
  const site=B.state.project.site,W=Number(site.width),D=Number(site.depth),rotate=D>W*1.35,spanW=rotate?D:W,spanH=rotate?W:D;
  const scale=B.drawingScale(spanW+2.2,spanH+3,308,188),k=1000/scale,ox=22+(288-spanW*k)/2,oy=40+(185-spanH*k)/2;
  const point=(x,y)=>({x:ox+(rotate?y:x)*k,y:oy+(rotate?W-x:y)*k});
  const box=(x,y,w,h,fill='none',width=.18,color=ink,extra='')=>{const a=point(x,y),b=point(x+w,y+h);return rect(Math.min(a.x,b.x),Math.min(a.y,b.y),Math.abs(a.x-b.x),Math.abs(a.y-b.y),fill,width,color,extra);};
  return {W,D,rotate,scale,k,ox,oy,point,box,spanW,spanH};
 };
 const parcelForSheet=()=>B.state.project.site.useParcelGeometry?B.parcelGeometry?.():null;
 const parcelOutline=p=>{const g=parcelForSheet();return g?polygon(g.points.map(q=>p.point(q.x,q.y)),'none',.22,light,'stroke-dasharray="2 1" data-parcel-basis="'+attr(g.basis)+'" data-parcel-point-count="'+g.points.length+'"'):p.box(0,0,p.W,p.D,'none',.22,light,'stroke-dasharray="2 1" data-parcel-basis="customer-dimensions"');};
 const planNorth=p=>{const parcel=parcelForSheet(),bearing=Number.isFinite(parcel?.bearing)?parcel.bearing:B.directionAngle(B.state.project.site.frontDirection||'Nam'),basis=parcel?.basis==='map'?'map-orientation':'customer-direction';return '<g data-north-bearing="'+n(bearing)+'" data-north-basis="'+basis+'">'+compass(302,39,-bearing+(p.rotate?-90:0))+text(302,51,basis==='map-orientation'?'Theo bản đồ':'Hướng đã nhập',1.8,'middle')+'</g>';};
 const roomLabel=(r,code,p,interior)=>{
  const a=p.point(r.x,r.y),b=p.point(r.x+r.w,r.y+r.h),left=Math.min(a.x,b.x),top=Math.min(a.y,b.y),w=Math.abs(b.x-a.x),h=Math.abs(b.y-a.y),items=B.roomFurnitureLayout(r);
  const candidates=[[.5,.55],[.5,.8],[.5,.3],[.25,.65],[.75,.65],[.5,.92]],f=2.45,nameRows=words(r.name.toUpperCase(),Math.max(4,Math.floor((w-3)/(f*.57)))),maxRows=Math.max(1,Math.min(5,Math.floor((h-8)/3.35))),small=w<14||h<11,rows=small?[code]:nameRows.length>maxRows?(maxRows===1?[code]:[...nameRows.slice(0,maxRows-1),'… '+code]):nameRows,labelW=Math.max(0,Math.min(w-1,Math.max(5,...rows.map(s=>s.length*f*.57))+1)),labelH=(rows.length+(small?0:1))*3.35+2;
  let chosen=candidates[0],best=Infinity;
  for(const c of candidates){const x=r.x+r.w*(p.rotate?1-c[1]:c[0]),y=r.y+r.h*(p.rotate?c[0]:c[1]),clear=items.reduce((sum,i)=>sum+(x>i.x-.2&&x<i.x+i.w+.2&&y>i.y-.2&&y<i.y+i.d+.2?1:0),0);if(clear<best){best=clear;chosen=c;}}
  const cx=left+w*chosen[0],cy=Math.max(top+labelH/2+.5,Math.min(top+h-labelH/2-.5,top+h*chosen[1])),q=quantityRoom(r),area=['stairs','elevator'].includes(r.type)?r.w*r.h:q?.floorFinish;
  return '<g class="architectural-room-label" data-room-id="'+attr(r.id)+'"><title>'+esc(r.name+' · tên đầy đủ: bảng diện tích T'+(r.floor+1))+'</title>'+rect(cx-labelW/2,cy-labelH/2,labelW,labelH,'white',0,'white')+rows.map((s,i)=>text(cx,cy-labelH/2+3.4+i*3.35,s,f,'middle','font-weight="bold"')).join('')+(small?'':text(cx,cy+labelH/2-1.4,code+' · '+(area??r.w*r.h).toFixed(2)+' m²',2.2,'middle'))+'</g>';
 };
 const planOpenings=(floor,p)=>{
  const openings=B.state.project.plan.openings.filter(o=>o.floor===floor);let body='';
  for(const o of openings){const span=B.openingWallSpan(o);if(!span)continue;body+='<g pointer-events="none" data-opening-id="'+attr(o.id)+'" data-room-reference="'+attr(o.roomId)+'" data-span-orientation="'+attr(span.o)+'" data-span-start-m="'+n(span.a)+'" data-span-end-m="'+n(span.b)+'" data-wall-axis-m="'+n(span.c)+'" data-offset="'+n(o.offset||0)+'">';const a=p.point(span.o==='h'?span.a:span.c,span.o==='h'?span.c:span.a),b=p.point(span.o==='h'?span.b:span.c,span.o==='h'?span.c:span.b),dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy),nx=-dy/len,ny=dx/len;
   if(o.kind==='door'&&o.passage){body+='<g data-opening-id="'+attr(o.id)+'" data-door-motion="passage">'+line(a.x,a.y,b.x,b.y,.14,light,'1 .7')+'</g>';}else if(o.kind==='door'){const leaf=B.doorLeafGeometry(o);if(leaf){const h=p.point(leaf.hinge.x,leaf.hinge.y),open=p.point(leaf.open.x,leaf.open.y),closed=p.point(leaf.closed.x,leaf.closed.y),rad=leaf.width*p.k;body+=line(h.x,h.y,open.x,open.y,.20)+'<path d="M'+n(closed.x)+' '+n(closed.y)+' A'+n(rad)+' '+n(rad)+' 0 0 '+leaf.sweep+' '+n(open.x)+' '+n(open.y)+'" fill="none" stroke="'+light+'" stroke-width=".15" data-opening-id="'+attr(o.id)+'"/>';}else{body+='<g data-opening-id="'+attr(o.id)+'" data-door-motion="sliding">'+line(a.x,a.y,b.x,b.y,.3,blue)+line(a.x+nx*.7,a.y+ny*.7,(a.x+b.x)/2+nx*.7,(a.y+b.y)/2+ny*.7,.18)+line((a.x+b.x)/2-nx*.7,(a.y+b.y)/2-ny*.7,b.x-nx*.7,b.y-ny*.7,.18)+'</g>';}}
   else for(const off of [-.04,0,.04])body+=line(a.x+nx*off*p.k,a.y+ny*off*p.k,b.x+nx*off*p.k,b.y+ny*off*p.k,.17,o.sill>1.2?light:blue,o.sill>1.2?'1 .6':'');
   const mx=(a.x+b.x)/2+nx*2.6,my=(a.y+b.y)/2+ny*2.6,code=B.openingCode(o);body+=rect(mx-3.1,my-1.8,6.2,3.6,'white',.12,light)+text(mx,my+.75,code,2.1,'middle')+'</g>';
  }return '<g class="architectural-openings">'+body+'</g>';
 };
 const planDimensions=(floor,p)=>{
  const rooms=B.floorRooms(floor),xs=[...new Set([0,p.W,...rooms.flatMap(r=>[r.x,r.x+r.w])].map(x=>n(x)))].sort((a,b)=>a-b),ys=[...new Set([0,p.D,...rooms.flatMap(r=>[r.y,r.y+r.h])].map(x=>n(x)))].sort((a,b)=>a-b);let body='';
  const chain=(values,horizontal)=>{for(let i=1;i<values.length;i++){if(values[i]-values[i-1]<.25)continue;const a=p.point(horizontal?values[i-1]:0,horizontal?0:values[i-1]),b=p.point(horizontal?values[i]:0,horizontal?0:values[i]);body+=dim(a,b,horizontal?-8:8,Math.round((values[i]-values[i-1])*1000));}};
  chain(xs,true);chain(ys,false);body+=dim(p.point(0,0),p.point(p.W,0),-15,Math.round(p.W*1000))+dim(p.point(0,0),p.point(0,p.D),15,Math.round(p.D*1000));
  // Reference axes are architectural, never inferred structural column lines.
  const pick=values=>values.filter((v,i)=>i===0||i===values.length-1||v-values[i-1]>=1.2);
  for(const [i,x]of pick(xs.filter(x=>x>0&&x<p.W)).entries()){const a=p.point(x,0),b=p.point(x,p.D);body+=line(a.x,a.y,b.x,b.y,.10,'#abb4bb','2 .7 .35 .7')+circle(a.x,a.y,1.8)+text(a.x,a.y+.75,i+1,2.0,'middle');}
  for(const [i,y]of pick(ys.filter(y=>y>0&&y<p.D)).entries()){const a=p.point(0,y),b=p.point(p.W,y);body+=line(a.x,a.y,b.x,b.y,.10,'#abb4bb','2 .7 .35 .7')+circle(a.x,a.y,1.8)+text(a.x,a.y+.75,String.fromCharCode(65+i),2.0,'middle');}
  return '<g class="architectural-reference-dimensions">'+body+'</g>';
 };
 const priorCut=B.sectionCutX;
 B.sectionCutX=()=>{if(Number.isFinite(B.state.ui.planner.sectionCutX))return priorCut();const stair=B.state.project.plan.rooms.find(r=>r.type==='stairs'&&r.floor===0),part=stair&&B.stairGeometry(stair)[0];return part?part.x+part.w/2:priorCut();};
 B.sectionCutY=()=>{const stair=B.state.project.plan.rooms.find(r=>r.type==='stairs'&&r.floor===0),part=stair&&B.stairGeometry(stair)[0];return part?part.y+part.d/2:Number(B.state.project.site.depth)/2;};
 B.architecturalPlanSheet=(floor=0,interior=false)=>{
  const p=planLayout(floor),rooms=B.floorRooms(floor),schedule=B.architecturalRoomSchedule(floor),g=B.scenePlanGeometry(B.state.project.plan,floor),q=B.measuredQuantities().floors.find(f=>f.floor===floor),code=(interior?'NT-':'KT-')+String(floor+1).padStart(2,'0');let body='';
  const parcel=B.state.project.site.useParcelGeometry?B.parcelGeometry?.():null,holes=B.stairFloorHoles(floor);
  body+=parcelOutline(p);
  for(const r of rooms){const f=B.finishPalette(r.id),fill=interior?(f.floor||'#eeeae3'):'white';for(const panel of B.slabPanels(r,holes))body+=p.box(panel.x,panel.y,panel.w,panel.d,fill,0,'white','pointer-events="none" fill-opacity="'+(interior?'.18':'1')+'" data-room-reference="'+attr(r.id)+'" data-slab-panel="1" data-model-x="'+n(panel.x)+'" data-model-y="'+n(panel.y)+'" data-model-width="'+n(panel.w)+'" data-model-depth="'+n(panel.d)+'"');}
  for(const [i,hole]of holes.entries()){body+=p.box(hole.x,hole.y,hole.w,hole.h,'none',.17,blue,'stroke-dasharray="1.4 .7" data-floor-void="'+i+'" data-model-x="'+n(hole.x)+'" data-model-y="'+n(hole.y)+'" data-model-width="'+n(hole.w)+'" data-model-depth="'+n(hole.h)+'"');const a=p.point(hole.x,hole.y),b=p.point(hole.x+hole.w,hole.y+hole.h);body+=line(a.x,a.y,b.x,b.y,.12,light,'1 .7');}
  body+=planDimensions(floor,p);
  // Measured furniture symbols retain their model coordinates and orientation.
  const matrix=p.rotate?'matrix(0 '+(-p.k)+' '+p.k+' 0 '+p.ox+' '+(p.oy+p.W*p.k)+')':'matrix('+p.k+' 0 0 '+p.k+' '+p.ox+' '+p.oy+')';
  body+='<g transform="'+matrix+'" class="measured-furniture-layer">'+rooms.map(B.furnitureSvg).join('')+'</g>';
  for(const w of g.walls){
   if(w.kind==='door'||w.kind==='window'&&(w.sill||0)<1.2)continue;
   const t=w.thickness,x=w.horizontal?w.a:w.axis-t/2,y=w.horizontal?w.axis-t/2:w.a;
   body+=p.box(x,y,w.horizontal?w.b-w.a:t,w.horizontal?t:w.b-w.a,'#3e454b',.22,ink,'pointer-events="none" data-wall-cut="1" data-wall-room-ids="'+attr(w.roomIds.join(','))+'" data-model-x="'+n(x)+'" data-model-y="'+n(y)+'" data-model-width="'+n(w.horizontal?w.b-w.a:t)+'" data-model-depth="'+n(w.horizontal?t:w.b-w.a)+'"');
  }
  body+=planOpenings(floor,p);
  for(const [i,r]of rooms.entries())body+=roomLabel(r,schedule[i].code,p,interior);
  const cut=(a,b,label)=>{const A=p.point(...a),C=p.point(...b);return line(A.x,A.y,C.x,C.y,.25,blue,'3 .8 .4 .8')+circle(A.x,A.y,2.3)+circle(C.x,C.y,2.3)+text(A.x,A.y+.8,label,2.1,'middle')+text(C.x,C.y+.8,label,2.1,'middle');};
  body+=cut([B.sectionCutX(),-.25],[B.sectionCutX(),p.D+.25],'A')+cut([-.25,B.sectionCutY()],[p.W+.25,B.sectionCutY()],'B');
  const front=p.point(p.W/2,-.45);body+=text(front.x,front.y,'MẶT TIỀN / LỐI VÀO',2.4,'middle',p.rotate?'transform="rotate(-90 '+front.x+' '+front.y+')"':'');
  body+=planNorth(p)+scaleBar(22,236,p.scale);
  body+=text(90,237,interior?'Nội thất từ đúng vị trí và kích thước trong mô hình 3D.':'Nét cắt tường đậm · nét cửa / nội thất mảnh · đường cắt A–A / B–B.',2.3);
  let sidebar=groupTitle(330,29,interior?'BỐ TRÍ / NỘI THẤT':'CÔNG NĂNG / DIỆN TÍCH')+blockText(330,39,B.state.project.style,34,2.6)+text(330,52,'Sàn bố trí: '+(q?.grossArea||0).toFixed(2)+' m²')+text(330,59,'Sàn hoàn thiện: '+(q?.floorFinish||0).toFixed(2)+' m²');
  sidebar+=text(330,70,'MÃ / KHÔNG GIAN',2.2,'start','font-weight="bold"')+text(407,70,'m²',2.2,'end','font-weight="bold"')+line(330,73,408,73,.2);
  schedule.slice(0,15).forEach((r,i)=>{const y=80+i*8.3;sidebar+=text(330,y,r.code+' · '+(r.name.length>25?r.name.slice(0,24)+'…':r.name),2.2)+text(407,y,(['stairs','elevator'].includes(r.type)?r.w*r.h:r.net??r.w*r.h).toFixed(2),2.2,'end')+line(330,y+2,408,y+2,.10,'#cbd0d4');});
  const bottom=Math.max(186,84+Math.min(schedule.length,15)*8.3);
  sidebar+=blockText(330,bottom,'Diện tích sàn hoàn thiện trừ phần tường và ô thang. Ô thang / giếng ghi diện tích mốc bố trí.',38,2.15)+blockText(330,bottom+17,'Trục và chuỗi kích thước theo mốc phòng. Xem bảng cửa và bản vẽ chi tiết.',38,2.15);
  sidebar+=text(330,241,'Tên đầy đủ: bảng diện tích T'+(floor+1)+'.',2.2);
  return sheet({code,title:(interior?'MẶT BẰNG NỘI THẤT':'MẶT BẰNG KIẾN TRÚC')+' · TẦNG '+(floor+1),scale:p.scale,body,sidebar,floor,caption:'Đơn vị kích thước mm; diện tích m². Tường ngoài '+Math.round(B.measuredWallThickness(false)*1000)+' / trong '+Math.round(B.measuredWallThickness(true)*1000)+' mm. Trục tham chiếu kiến trúc; chưa phải trục kết cấu.'});
 };
 B.drawingSheetSvg=floor=>B.architecturalPlanSheet(floor??B.state.ui.planner.floor,false);
 B.interiorSheetSvg=floor=>B.architecturalPlanSheet(floor??B.state.ui.planner.floor,true);
 const hull=points=>{const v=[...new Map(points.map(p=>[p.x+','+p.y,p])).values()].sort((a,b)=>a.x-b.x||a.y-b.y),cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x),low=[],high=[];for(const p of v){while(low.length>1&&cross(low.at(-2),low.at(-1),p)<=0)low.pop();low.push(p);}for(const p of [...v].reverse()){while(high.length>1&&cross(high.at(-2),high.at(-1),p)<=0)high.pop();high.push(p);}return low.slice(0,-1).concat(high.slice(0,-1));};
 B.architecturalElevationSheet=(side='front')=>{
  const sides={front:{horizontal:true,near:true,name:'TRƯỚC',code:'KT-MD'},back:{horizontal:true,near:false,name:'SAU',code:'KT-MD-02'},right:{horizontal:false,near:false,name:'PHẢI',code:'KT-MD-03'},left:{horizontal:false,near:true,name:'TRÁI',code:'KT-MD-04'}},v=sides[side]||sides.front,p=B.state.project,l=B.projectLevels(),roof=B.sceneRoofSpec(),span=v.horizontal?p.site.width:p.site.depth,total=Math.max(l.floors*l.floorHeight+l.slab,roof?roof.eave+roof.rise:0),scale=B.drawingScale(span+4,total+3,300,194),k=1000/scale,ox=22+(290-span*k)/2,oy=38+(197-total*k)/2;
  const flip=side==='back'||side==='left',point=(x,z)=>({x:ox+(flip?span-x:x)*k,y:oy+(total-z)*k}),box=(x,z,w,h,fill='white',extra='')=>{const a=point(x,z+h),b=point(x+w,z);return rect(Math.min(a.x,b.x),a.y,Math.abs(a.x-b.x),h*k,fill,.22,ink,extra);};let body='';
  for(let f=0;f<l.floors;f++){
   const rooms=B.floorRooms(f),g=B.scenePlanGeometry(p.plan,f),base=f*l.floorHeight;
   const eligible=g.walls.filter(w=>w.horizontal===v.horizontal&&w.roomIds.length===1&&rooms.some(r=>r.id===w.roomIds[0]&&Math.abs((v.horizontal?(v.near?r.y:r.y+r.h):(v.near?r.x:r.x+r.w))-w.axis)<.001)),xs=[...new Set(eligible.flatMap(w=>[w.a,w.b]))].sort((a,b)=>a-b);
   for(let i=1;i<xs.length;i++){const a=xs[i-1],b=xs[i],mid=(a+b)/2,w=eligible.filter(w=>mid>=w.a&&mid<=w.b).sort((a,b)=>v.near?a.axis-b.axis:b.axis-a.axis)[0];if(!w)continue;
    const color=B.finishPalette(w.roomIds[0]).wall||B.houseStyle()?.wall||'#e9e5dc';
    body+=box(a,base,b-a,l.slab,'#e1e4e6')+box(a,base+l.slab,b-a,l.floorHeight-l.slab,color,'fill-opacity=".22"');
    if(w.kind!=='wall'){const z=base+l.slab+(w.sill||0),h=w.height;body+=box(a,z,b-a,h,w.kind==='window'?'#e6edf1':'#e6ded1','data-opening-id="'+attr(w.openingId)+'"');const P=point(mid,z),Q=point(mid,z+h);body+=line(P.x,P.y,Q.x,Q.y,.2);if(w.kind==='window'){const c=point(a,z+h*.65),d=point(b,z+h*.65);body+=line(c.x,c.y,d.x,d.y,.17);}body+=text((P.x+Q.x)/2,Q.y-1.2,B.openingCode(p.plan.openings.find(o=>o.id===w.openingId)),2.15,'middle');}
   }
  }
  for(const c of B.facadeComponents().filter(c=>c.projectionSide?c.projectionSide===side:side==='front')){body+=box(v.horizontal?c.x:c.z,c.y,v.horizontal?c.w:c.d,c.h,c.color,'fill-opacity=".40" data-facade-component="'+attr(c.id)+'"');}
  if(roof){const projected=hull([...roof.corners,...roof.ridge].map(vv=>point(v.horizontal?vv[0]:vv[2],vv[1])));body+=polygon(projected,B.roofSurfaceSpec().color,.25,ink,'fill-opacity=".16" data-projection-roof="1"');for(const face of roof.faces)for(let i=0;i<face.length;i++){const a=face[i],b=face[(i+1)%face.length],A=point(v.horizontal?a[0]:a[2],a[1]),C=point(v.horizontal?b[0]:b[2],b[1]);body+=line(A.x,A.y,C.x,C.y,.15,light);}}
  const bounds=B.sceneFootprintBounds(p.plan.rooms),wall=B.measuredWallThickness(false),start=(v.horizontal?bounds?.x:bounds?.y)??0,length=(v.horizontal?bounds?.width:bounds?.depth)??span,left=start-wall/2,right=start+length+wall/2;
  const bottom=point(0,0);body+=line(ox-7,bottom.y,ox+span*k+7,bottom.y,.35)+dim(point(left,0),point(right,0),8,Math.round((right-left)*1000));
  for(let f=0;f<=l.floors;f++){const z=f*l.floorHeight,a=point(0,z),b=point(span,z);body+=line(a.x,a.y,b.x,b.y,.12,light,'2 1')+text(ox-3,a.y-1.2,f?'+'+z.toFixed(3):'±0.000',2.35,'end');if(f<l.floors)body+=dim(point(span,z),point(span,z+l.floorHeight),flip?10:-10,Math.round(l.floorHeight*1000));}
  if(roof){const a=point(0,roof.eave+roof.rise);body+=text(ox-3,a.y-1.2,'+'+(roof.eave+roof.rise).toFixed(3),2.35,'end')+line(a.x,a.y,ox+span*k,a.y,.10,light,'1 .7');}
  body+=scaleBar(22,237,scale);
  const sidebar=groupTitle(330,29,'MẶT ĐỨNG / HOÀN THIỆN')+blockText(330,40,p.style,34,2.6)+text(330,59,l.floors+' tầng · cao tầng '+l.floorHeight.toFixed(3)+' m')+text(330,70,'Sàn dự kiến '+Math.round(l.slab*1000)+' mm')+text(330,82,'Mái: '+B.roofDesignSpec().name,2.4)+text(330,92,'Dốc '+B.roofDesignSpec().pitchDeg+'°')+blockText(330,106,B.roofSurfaceSpec().name,34,2.4)+blockText(330,133,'Tường, cửa và chi tiết mặt tiền lấy từ cùng mô hình 3D. Không thêm cửa giả vào phối cảnh.',36,2.35)+blockText(330,180,'Màu và bề mặt là mô phỏng. Quy cách lớp hoàn thiện / liên kết cần hồ sơ chi tiết.',36,2.35);
  return sheet({code:v.code,title:'MẶT ĐỨNG '+v.name,scale,body:'<g class="projection-content">'+body+'</g>',sidebar,caption:'Kích thước mm; cao độ m theo sàn tầng trệt. Mặt đứng chiếu theo tường và ô mở thật, cùng các chi tiết hoàn thiện trong 3D.'});
 };
 B.elevationSvg=side=>B.architecturalElevationSheet(side||'front');
 B.architecturalSectionSheet=(axis='x')=>{
  const p=B.state.project,l=B.projectLevels(),roof=B.sceneRoofSpec(),cut=axis==='x'?B.sectionCutX():B.sectionCutY(),span=axis==='x'?p.site.depth:p.site.width,total=Math.max(l.floors*l.floorHeight+l.slab,roof?roof.eave+roof.rise:0),scale=B.drawingScale(span+4,total+3,300,194),k=1000/scale,ox=22+(290-span*k)/2,oy=38+(197-total*k)/2;
  const point=(u,z)=>({x:ox+u*k,y:oy+(total-z)*k}),box=(u,z,w,h,fill='#c5cbd0',extra='')=>{const a=point(u,z+h);return rect(a.x,a.y,w*k,h*k,fill,.22,ink,extra);},intersects=q=>axis==='x'?cut>q.x+.001&&cut<q.x+q.w-.001:cut>q.y+.001&&cut<q.y+(q.d??q.h)-.001;let body='';
  for(let floor=0;floor<l.floors;floor++){
   const rooms=B.floorRooms(floor),g=B.scenePlanGeometry(p.plan,floor),base=floor*l.floorHeight;
   for(const r of rooms.filter(intersects)){
    for(const q of B.slabPanels(r,B.stairFloorHoles(floor)).filter(intersects))body+=box(axis==='x'?q.y:q.x,base,axis==='x'?q.d:q.w,l.slab,'#646f77','data-section-slab="'+floor+'"');
    if(floor===l.floors-1)for(const q of B.slabPanels(r,B.stairFloorHoles(floor+1)).filter(intersects))body+=box(axis==='x'?q.y:q.x,base+l.floorHeight,axis==='x'?q.d:q.w,l.slab,'#646f77');
    const u=axis==='x'?r.y:r.x,length=axis==='x'?r.h:r.w,center=point(u+length/2,base+l.floorHeight*.51);const fullLabelLines=words(r.name,Math.max(8,Math.floor((length*k-4)/(2.35*.57)))),maxLabelLines=Math.max(1,Math.floor(l.clearHeight*k/3.2)-2),roomCode=B.architecturalRoomSchedule(floor).find(q=>q.id===r.id)?.code||r.id,labelLines=fullLabelLines.length>maxLabelLines?[...fullLabelLines.slice(0,Math.max(0,maxLabelLines-1)),'… '+roomCode]:fullLabelLines;body+='<g data-section-room-id="'+attr(r.id)+'"><title>'+esc(r.name)+'</title>'+labelLines.map((s,i)=>text(center.x,center.y+(i-(labelLines.length-1)/2)*3.2,s,2.35,'middle')).join('')+'</g>';
    if(r.type==='stairs')for(const q of B.stairGeometry(r).filter(intersects))body+=box(axis==='x'?q.y:q.x,base+l.slab+q.base,axis==='x'?q.d:q.w,q.h,'#c8c1b4','data-section-stair="'+attr(r.id)+'"');
    else if(r.type==='elevator'){const A=point(u+.12,base),C=point(u+.12,base+l.floorHeight),D=point(u+length-.12,base),E=point(u+length-.12,base+l.floorHeight);body+=line(A.x,A.y,C.x,C.y,.3)+line(D.x,D.y,E.x,E.y,.3);if(floor===0){const s=B.elevatorSpec(r),depth=axis==='x'?s.cabinDepth:s.cabinWidth;body+=box(u+(length-depth)/2,base+l.slab,depth,2.1,'#e4ecee','data-section-elevator="'+attr(r.id)+'"');}}
    else{const H=point(u+length/2,base+l.floorHeight*.40),a=point(u+.08,base+l.floorHeight-l.ceilingDrop),b=point(u+length-.08,base+l.floorHeight-l.ceilingDrop);body+=line(a.x,a.y,b.x,b.y,.12,light,'1 .6')+text(H.x,H.y,'Htt '+l.clearHeight.toFixed(3)+' m',2.15,'middle');}
   }
   for(const w of g.walls){if(w.horizontal!==(axis==='x')||cut<w.a||cut>w.b)continue;const x=w.axis-w.thickness/2,height=l.floorHeight-l.slab;
    if(w.kind==='wall')body+=box(x,base+l.slab,w.thickness,height,'#3e454b');else{const sill=w.sill||0;if(sill)body+=box(x,base+l.slab,w.thickness,sill,'#3e454b');const head=sill+w.height;if(height>head)body+=box(x,base+l.slab+head,w.thickness,height-head,'#3e454b');}}
  }
  for(const c of B.facadeComponents().filter(c=>c.kind==='roof-eave-band')){const q={x:c.x,y:c.z,w:c.w,d:c.d};if(intersects(q))body+=box(axis==='x'?c.z:c.x,c.y,axis==='x'?c.d:c.w,c.h,'#c5cbd0','data-section-facade="'+attr(c.id)+'"');}
  if(roof)for(const face of roof.faces){const hits=[];for(let i=0;i<face.length;i++){const a=face[i],b=face[(i+1)%face.length],aa=axis==='x'?a[0]:a[2],bb=axis==='x'?b[0]:b[2];if(Math.abs(aa-bb)<1e-8)continue;const t=(cut-aa)/(bb-aa);if(t<0||t>1)continue;hits.push(point((axis==='x'?a[2]:a[0])+t*((axis==='x'?b[2]:b[0])-(axis==='x'?a[2]:a[0])),a[1]+t*(b[1]-a[1])));}if(hits.length>=2)body+=line(hits[0].x,hits[0].y,hits[1].x,hits[1].y,.28,ink);}
  for(let f=0;f<=l.floors;f++){const z=f*l.floorHeight,A=point(0,z),C=point(span,z);body+=line(A.x,A.y,C.x,C.y,.12,light,'2 1')+text(ox-3,A.y-1.1,f?'+'+z.toFixed(3):'±0.000',2.3,'end');if(f<l.floors)body+=dim(C,point(span,z+l.floorHeight),-10,Math.round(l.floorHeight*1000));}
  const bounds=B.sceneFootprintBounds(p.plan.rooms),wall=B.measuredWallThickness(false),start=(axis==='x'?bounds?.y:bounds?.x)??0,length=(axis==='x'?bounds?.depth:bounds?.width)??span;
  body+=dim(point(start-wall/2,0),point(start+length+wall/2,0),8,Math.round((length+wall)*1000))+scaleBar(22,237,scale);
  const name=axis==='x'?'A–A':'B–B',sidebar=groupTitle(330,29,'MẶT CẮT / CAO ĐỘ')+text(330,42,'Đường cắt '+name)+text(330,53,(axis==='x'?'x':'y')+' = '+cut.toFixed(3)+' m')+text(330,67,'Cao tầng '+l.floorHeight.toFixed(3)+' m')+text(330,77,'Sàn '+Math.round(l.slab*1000)+' mm')+text(330,87,'Hạ trần '+Math.round(l.ceilingDrop*1000)+' mm')+blockText(330,108,'Ô sàn, vế thang và vị trí phòng được cắt từ hình học thật. Nét đậm là phần bị cắt.',36,2.4)+blockText(330,164,'Móng, dầm, cột và thép chưa được thiết kế. Không tự thêm cấu kiện chịu lực vào bản vẽ này.',36,2.4)+text(330,231,'Tên đầy đủ: bảng diện tích.',2.15);
  return sheet({code:axis==='x'?'KT-MC':'KT-MC-02',title:'MẶT CẮT '+name,scale,body:'<g class="projection-content">'+body+'</g>',sidebar,caption:'Htt: chiều cao thông thủy. Cao độ tầng trệt ±0.000. Hình cắt kiến trúc dùng chung sàn / ô thang / mái với mô hình; kết cấu cần hồ sơ riêng.'});
 };
 B.sectionSvg=()=>B.architecturalSectionSheet('x');
 const originalRoofSheet=B.roofSheetSvg;
 B.roofSheetSvg=()=>{
  const roof=B.sceneRoofSpec();if(!roof)return originalRoofSheet();const p=planLayout(0),spec=B.roofDesignSpec(),surface=B.roofSurfaceSpec(),bounds=B.sceneFootprintBounds(B.floorRooms(B.projectLevels().floors-1));let body=parcelOutline(p);
  roof.faces.forEach((face,i)=>{body+=polygon(face.map(q=>p.point(q[0],q[2])),surface.color,.25,ink,'fill-opacity=".12" data-roof-face="'+i+'"');const high=face.filter(q=>q[1]>roof.eave+.001),low=face.filter(q=>q[1]<=roof.eave+.001);if(high.length&&low.length){const avg=ps=>[ps.reduce((s,q)=>s+q[0],0)/ps.length,ps.reduce((s,q)=>s+q[2],0)/ps.length],a=avg(high),b=avg(low),A=p.point(a[0]*.65+b[0]*.35,a[1]*.65+b[1]*.35),C=p.point(a[0]*.35+b[0]*.65,a[1]*.35+b[1]*.65),dx=C.x-A.x,dy=C.y-A.y,len=Math.hypot(dx,dy),ux=dx/len,uy=dy/len;body+=line(A.x,A.y,C.x,C.y,.24,blue)+polygon([{x:C.x,y:C.y},{x:C.x-ux*2-uy*.8,y:C.y-uy*2+ux*.8},{x:C.x-ux*2+uy*.8,y:C.y-uy*2-ux*.8}],blue,0,blue)+text((A.x+C.x)/2+uy*2,(A.y+C.y)/2-ux*2,spec.pitchDeg+'°',2.5,'middle');}});
  const t=B.measuredWallThickness(false);if(bounds)body+=p.box(bounds.x-t/2,bounds.y-t/2,bounds.width+t,bounds.depth+t,'none',.18,light,'stroke-dasharray="1.6 .8"');
  const minX=Math.min(...roof.corners.map(q=>q[0])),maxX=Math.max(...roof.corners.map(q=>q[0])),minY=Math.min(...roof.corners.map(q=>q[2])),maxY=Math.max(...roof.corners.map(q=>q[2]));
  body+=dim(p.point(minX,minY),p.point(maxX,minY),-8,Math.round((maxX-minX)*1000))+dim(p.point(minX,minY),p.point(minX,maxY),8,Math.round((maxY-minY)*1000));
  if(roof.ridge.length){const q=roof.ridge[0],a=p.point(q[0],q[2]);body+=circle(a.x,a.y,1.7)+text(a.x+3,a.y-2,'NÓC +'+(roof.eave+roof.rise).toFixed(3),2.5);}
  body+=planNorth(p)+scaleBar(22,236,p.scale)+text(90,237,'Mũi tên dốc mái · nét đứt: tường bên dưới.',2.35);
  const sidebar=groupTitle(330,29,'MÁI / VẬT LIỆU')+blockText(330,40,B.state.project.style,34,2.6)+text(330,59,spec.name)+text(330,70,'Dốc '+spec.pitchDeg+'°')+text(330,81,'Đua mái '+Math.round(spec.overhang*1000)+' mm')+text(330,92,'Diện tích mặt '+roof.area.toFixed(2)+' m²')+text(330,106,'Mép mái +'+roof.eave.toFixed(3)+' m')+text(330,117,'Đỉnh mái +'+(roof.eave+roof.rise).toFixed(3)+' m')+blockText(330,134,surface.name,34,2.5)+blockText(330,161,'Mặt mái, độ dốc và đỉnh dùng cùng hình học trong 3D. Chưa gồm chồng mí và phụ kiện.',36,2.35)+blockText(330,201,'Chưa thiết kế vì kèo, thoát nước, cấu tạo chống thấm và liên kết mái.',36,2.35);
  return sheet({code:'KT-MAI',title:'MẶT BẰNG MÁI',scale:p.scale,body,sidebar,caption:'Kích thước mm; cao độ m. Mái từ đỉnh 3D; diện tích theo mặt dốc, không cộng hệ số mái. Cấu tạo và thoát nước cần KTS/KS xác nhận.'});
 };
 B.elevatorDetailSheetSvg=(room,index=0)=>{
  const s=B.elevatorSpec(room),l=B.projectLevels(),group=B.elevatorRooms(room).toSorted((a,b)=>a.floor-b.floor),r=group[0]||room,planScale=[20,25,50,75,100,150,200,250,500].find(s=>(r.w+1)*1000/s<=140&&(r.h+1)*1000/s<=162)||500,k=1000/planScale,px=25,py=52;
  const pt=(x,y)=>({x:px+(x-r.x)*k,y:py+(y-r.y)*k}),q=pt(r.x,r.y),a=pt(r.x+(r.w-s.cabinWidth)/2,r.y+(r.h-s.cabinDepth)/2);let body=groupTitle(15,29,'1. MẶT BẰNG · 1:'+planScale)+rect(q.x,q.y,r.w*k,r.h*k,'none',.35)+rect(q.x+.12*k,q.y+.12*k,(r.w-.24)*k,(r.h-.24)*k,'none',.16,light,'stroke-dasharray="1.2 .7"')+rect(a.x,a.y,s.cabinWidth*k,s.cabinDepth*k,'#edf1f1',.2)+text(a.x+s.cabinWidth*k/2,a.y+s.cabinDepth*k/2,'CABIN DỰ TRÙ',2.5,'middle');
  const door=B.state.project.plan.openings.find(o=>o.roomId===r.id&&o.kind==='door'),span=door&&B.openingWallSpan(door);if(span){const A=pt(span.o==='h'?span.a:span.c,span.o==='h'?span.c:span.a),C=pt(span.o==='h'?span.b:span.c,span.o==='h'?span.c:span.b);body+=line(A.x,A.y,C.x,C.y,.7,blue)+text(q.x+r.w*k/2,q.y+r.h*k+15,'CỬA TRƯỢT '+Math.round(s.doorWidth*1000)+' mm',2.5,'middle');}
  body+=dim(q,pt(r.x+r.w,r.y),-8,Math.round(r.w*1000))+dim(q,pt(r.x,r.y+r.h),8,Math.round(r.h*1000))+text(15,218,'Giếng: '+Math.round(r.w*1000)+' × '+Math.round(r.h*1000)+' mm',2.6)+text(15,227,'Cabin: '+Math.round(s.cabinWidth*1000)+' × '+Math.round(s.cabinDepth*1000)+' mm',2.6);
  const ex=196,ey=52,total=l.floors*l.floorHeight,u=['north','south'].includes(s.doorSide)?r.w:r.h,elevationScale=B.drawingScale(u+1.5,total+1.4,134,164),ke=1000/elevationScale,height=total*ke,cabin=['north','south'].includes(s.doorSide)?s.cabinWidth:s.cabinDepth;
  body+=groupTitle(170,29,'2. ĐIỂM DỪNG · 1:'+elevationScale)+rect(ex,ey,u*ke,height,'#f0f5f4',.3);
  for(const shaft of group){const y=ey+(total-shaft.floor*l.floorHeight)*ke;body+=line(ex-3,y,ex+u*ke+8,y,.18,light,'1.4 .8')+text(ex+u*ke+10,y+.8,'T'+(shaft.floor+1)+' '+(shaft.floor?'+'+(shaft.floor*l.floorHeight).toFixed(3):'±0.000'),2.5);}
  body+=rect(ex+(u-cabin)*ke/2,ey+(total-l.slab-2.1)*ke,cabin*ke,2.1*ke,'#dbe5e7',.22)+dim({x:ex,y:ey},{x:ex,y:ey+height},8,Math.round(total*1000))+blockText(170,218,'Cabin minh họa tại tầng trệt. Chưa xác nhận pit / đỉnh giếng; không tự thêm chiều cao hãng.',44,2.4);
  const sidebar=groupTitle(330,29,'GIẾNG / XÁC NHẬN')+text(330,42,group.length+' điểm dừng')+text(330,53,'Cửa '+Math.round(s.doorWidth*1000)+' mm')+text(330,67,'Hố pit: '+(s.pitDepth===null?'Chưa xác nhận':Math.round(s.pitDepth*1000)+' mm'))+text(330,80,'Đỉnh giếng: '+(s.headroom===null?'Chưa xác nhận':Math.round(s.headroom*1000)+' mm'))+blockText(330,99,'Hãng / model: '+(s.model||'Chưa xác nhận'),33,2.5)+blockText(330,141,'Giếng và cabin là ô dự trù. Quy cách vách, tải trọng, ray, điện và thông số lắp đặt cần hồ sơ hãng.',35,2.4)+blockText(330,203,'Chưa phải hồ sơ lắp đặt thang máy.',35,2.5);
  return sheet({code:'KT-TM-'+String(index+1).padStart(2,'0'),title:'THANG MÁY / GIẾNG LIÊN THÔNG',scale:0,scaleLabel:'Theo từng hình',body,sidebar,caption:'Mặt bằng 1:'+planScale+'; sơ đồ cao độ 1:'+elevationScale+' trên A3, in 100%. Số đo giếng/cabin theo mô hình; kết cấu và cấu tạo lắp đặt cần hãng / KS xác nhận.'});
 };
 const tableSheet=({floor,page,rows,widths,headers,code,title,caption,minHeight=8,size=2.35})=>{
  const pages=B.drawingTablePages(rows,{widths,size,minHeight,height:193,maxRows:24}),index=B.clamp(Number(page)||0,0,pages.length-1),xs=[15];widths.forEach(w=>xs.push(xs.at(-1)+w));let body=rect(15,31,390,10,'#edf1f4');
  headers.forEach((v,i)=>body+=text(xs[i]+2,37,v,2.5,'start','font-weight="bold"'));let y=41;
  for(const row of pages[index]){body+='<g data-schedule-id="'+attr(row.id)+'" data-room-reference="'+attr(row.roomId)+'">'+line(15,y+row.height,405,y+row.height,.13,light);row.cells.forEach((cell,j)=>cell.forEach((v,k)=>body+=text(xs[j]+2,y+5+k*size*1.42,v,size)));body+='</g>';y+=row.height;}
  body+=text(15,243,caption,2.35);return B.sheetFrame({code:code+'-'+(floor+1)+'-'+(index+1),title:title+' · TẦNG '+(floor+1),floor,scale:0,content:body,page:index+1,pages:pages.length});
 };
 const furnitureRows=floor=>B.architecturalFurnitureSchedule(floor).map(q=>({id:q.code,roomId:q.roomId,values:[q.code,q.name,q.room,q.model,Math.round(q.w*1000),Math.round(q.d*1000),Math.round(q.h*1000)]}));
 const furnitureWidths=[20,69,79,65,44,43,70];
 B.furnitureSchedulePages=floor=>B.drawingTablePages(furnitureRows(floor),{widths:furnitureWidths,size:2.35,minHeight:8,height:193,maxRows:24});
 B.furnitureScheduleSheet=(floor=0,page=0)=>tableSheet({floor,page,rows:furnitureRows(floor),widths:furnitureWidths,headers:['Mã','Đồ nội thất','Không gian','Mã mô hình','Rộng mm','Dài mm','Cao mm'],code:'NT-TK',title:'BẢNG NỘI THẤT',caption:'Kích thước mô hình mm; đồ đạc là mẫu tham khảo, chưa phải bản vẽ sản xuất / xác nhận SKU.'});
 const areaRows=floor=>B.architecturalRoomSchedule(floor).map(r=>({id:r.code,roomId:r.id,values:[r.code,r.name,Math.round(r.w*1000),Math.round(r.h*1000),(r.w*r.h).toFixed(2),r.net===null?'—':r.net.toFixed(2)]}));
 const areaWidths=[21,112,53,54,60,90];
 B.roomAreaSchedulePages=floor=>B.drawingTablePages(areaRows(floor),{widths:areaWidths,size:2.35,minHeight:8,height:193,maxRows:24});
 B.roomAreaScheduleSheet=(floor=0,page=0)=>tableSheet({floor,page,rows:areaRows(floor),widths:areaWidths,headers:['Mã','Không gian','Mốc rộng mm','Mốc sâu mm','Diện tích mốc m²','Sàn hoàn thiện m²'],code:'KT-DT',title:'BẢNG DIỆN TÍCH',caption:'Mốc theo cạnh phòng. Sàn hoàn thiện trừ phần tường và ô thang; đối chiếu mặt bằng cùng mã dữ liệu.'});
 const legacySheets=B.architecturalSheets;
 B.architecturalSheets=()=>{
  const previous=legacySheets(),sheets=[];
  for(let f=0;f<Number(B.state.project.site.floors);f++){
   sheets.push({name:'Kiến trúc tầng '+(f+1),svg:B.drawingSheetSvg(f)},{name:'Nội thất tầng '+(f+1),svg:B.interiorSheetSvg(f)});
   for(let page=0;page<B.roomAreaSchedulePages(f).length;page++)sheets.push({name:'Bảng diện tích T'+(f+1)+' / '+(page+1),svg:B.roomAreaScheduleSheet(f,page)});
   for(let page=0;page<B.furnitureSchedulePages(f).length;page++)sheets.push({name:'Thống kê nội thất T'+(f+1)+' / '+(page+1),svg:B.furnitureScheduleSheet(f,page)});
   sheets.push(...previous.filter(s=>s.svg.includes('data-sheet-code="KT-C'+(f+1)+'-')));
  }
  for(const side of ['front','back','right','left'])sheets.push({name:'Mặt đứng '+({front:'trước',back:'sau',right:'phải',left:'trái'})[side],svg:B.elevationSvg(side)});
  sheets.push({name:'Mặt cắt A–A',svg:B.sectionSvg()},{name:'Mặt cắt B–B',svg:B.architecturalSectionSheet('y')});
  sheets.push(...previous.filter(s=>/data-sheet-code="KT-(CT-|TM-|MAI)/.test(s.svg)));
  return sheets;
 };
 const current=B.currentDrawingSvg;
 B.currentDrawingSvg=()=>B.state.ui.planner.view==='interior'?B.interiorSheetSvg():B.state.ui.planner.view==='architecture'?B.drawingSheetSvg():['back','left','right'].includes(B.state.ui.planner.view)?B.elevationSvg(B.state.ui.planner.view):B.state.ui.planner.view==='section-b'?B.architecturalSectionSheet('y'):current();
 const priorExport=B.exportPlanSvg;
 B.exportPlanSvg=()=>{if(['interior','architecture','back','left','right','section-b'].includes(B.state.ui.planner.view)){if(!B.measuredDesignReview().geometryValid)return B.toast('Sửa lỗi hình học trước khi xuất.');return B.download('BMH-'+B.state.ui.planner.view+'-'+B.drawingRevision()+'-A3.svg',B.currentDrawingSvg(),'image/svg+xml');}return priorExport();};
 const planner=B.screen5;
 B.screen5=()=>{
  const markup=planner(),t=document.createElement('template');t.innerHTML=markup;const select=t.content.querySelector('[data-guided-plan-view]');
  if(select){const choices=[['architecture','Kiến trúc A3'],['interior','Nội thất A3'],['back','Mặt đứng sau'],['right','Mặt đứng phải'],['left','Mặt đứng trái'],['section-b','Mặt cắt B–B']];for(const [value,label]of choices){const o=document.createElement('option');o.value=value;o.textContent=label;select.append(o);}select.value=B.state.ui.planner.view;}
  if(['architecture','interior','back','right','left','section-b'].includes(B.state.ui.planner.view)){const canvas=t.content.querySelector('.v6-plan-canvas');if(canvas){canvas.innerHTML=B.currentDrawingSvg().replace('<svg ','<svg id="plannerSvg" ');canvas.classList.add('architectural-paper-canvas');}}
  return t.innerHTML;
 };B.SCREENS[3]=B.screen5;
 B.architecturalViewerHtml=()=>{
  const sheets=B.architecturalSheets(),index=B.clamp(Number(B.state.ui.architecturalSheet)||0,0,Math.max(0,sheets.length-1)),current=sheets[index];
  if(!current)return '';return '<section class="architectural-viewer"><div class="architectural-viewer-bar"><label>Tờ bản vẽ<select data-architectural-sheet>'+sheets.map((s,i)=>'<option value="'+i+'" '+(i===index?'selected':'')+'>'+esc(s.name)+'</option>').join('')+'</select></label><span>'+sheets.length+' tờ · A3 · '+B.drawingRevision()+'</span><button data-architectural-sheet-download>Tải tờ SVG</button></div><div class="architectural-paper" tabindex="0" aria-label="'+esc(current.name)+'">'+current.svg+'</div><p>Bản vẽ vector; mở SVG để phóng lớn. PDF in khổ A3 ở 100% để giữ tỷ lệ.</p></section>';
 };
 const dossier=B.screen10;
 B.screen10=()=>{const t=document.createElement('template');t.innerHTML=dossier();const root=t.content.querySelector('.guided-dossier');if(root&&B.state.project.plan.rooms.length){const el=document.createElement('template');el.innerHTML=B.architecturalViewerHtml();root.querySelector('.guided-dossier-card')?.after(el.content);root.querySelector('.guided-page-title p').textContent='Xem bộ kiến trúc, nội thất và các mặt đứng của cùng phương án.';}return t.innerHTML;};B.SCREENS[9]=B.screen10;
 document.addEventListener('change',e=>{if(e.target.matches?.('[data-architectural-sheet]')){B.state.ui.architecturalSheet=Number(e.target.value);B.save();B.render({preserveScroll:true});}});
 document.addEventListener('click',e=>{if(!e.target.closest?.('[data-architectural-sheet-download]'))return;if(!B.measuredDesignReview().geometryValid)return B.toast('Sửa lỗi hình học trước khi xuất.');const sheets=B.architecturalSheets(),index=B.state.ui.architecturalSheet||0,s=sheets[index]||sheets[0];if(s)B.download('BMH-to-ban-ve-'+(index+1)+'-'+B.drawingRevision()+'.svg',s.svg,'image/svg+xml');});
 queueMicrotask(()=>B.render({preserveScroll:true}));
})();
