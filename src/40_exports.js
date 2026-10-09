BMH.csv = rows => rows.map(r=>r.map(v=>{const value=typeof v==='string'&&/^[\s]*[=+@-]/.test(v)?"'"+v:v;return `"${String(value??'').replaceAll('"','""')}"`;}).join(',')).join('\r\n');
BMH.excelXml = (sheet,rows) => {
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const cell=v=>{const isNum=typeof v==='number'&&Number.isFinite(v);return `<Cell><Data ss:Type="${isNum?'Number':'String'}">${esc(v)}</Data></Cell>`};
  return `<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Header"><Font ss:Bold="1"/><Interior ss:Color="#EAF2E7" ss:Pattern="Solid"/></Style></Styles><Worksheet ss:Name="${esc(sheet)}"><Table>${rows.map((r,i)=>`<Row>${r.map((v,j)=>i===0?`<Cell ss:StyleID="Header"><Data ss:Type="String">${esc(v)}</Data></Cell>`:cell(v)).join('')}</Row>`).join('')}</Table></Worksheet></Workbook>`;
};
BMH.exportLoan = () => {
  const rows=[['Tháng','Lãi suất năm','Gốc','Lãi','Tổng trả','Dư nợ']];
  BMH.loanSchedule().forEach(r=>rows.push([r.month,Number(r.annual.toFixed(2)),Math.round(r.principal),Math.round(r.interest),Math.round(r.payment),Math.round(r.balance)]));
  BMH.download('BMH-lich-tra-no.xls',BMH.excelXml('Lich tra no',rows),'application/vnd.ms-excel');
};
BMH.exportEstimate = () => { const e=BMH.estimate(), b=BMH.dataCostBasis(), rows=[['Hạng mục','Giá trị (VND)'],['Đơn giá phần thô / m²',b.shellPerM2],['Đơn giá hoàn thiện / m²',b.finishPerM2],['Đơn giá chuẩn bị / m²',b.prepPerM2],['Phần thô',e.shell],['Hoàn thiện & vật liệu',e.finish],['Vận chuyển',e.transport],['Thích ứng khí hậu',e.climatePrep||0],['Năng lượng & nước bền vững',e.performanceUpgrade||0],['Chuẩn bị',e.prep],['Dự phòng 10%',e.contingency],['TỔNG',e.total],['Nguồn đơn giá',b.sourceLabel],['Ngày nguồn',b.sourceDate],['Tham chiếu',b.reference]]; BMH.download('BMH-du-toan.xls',BMH.excelXml('Du toan',rows),'application/vnd.ms-excel'); };
// CAD geometry uses millimetres at 1:1; annotations are on separate layers.
BMH.planDxf=(floor=BMH.state.ui.planner.floor)=>{
 const p=BMH.state.project,rooms=BMH.floorRooms(floor),parts=[],revision=BMH.drawingRevision(),layers=['PLOT','WALLS','DOORS','WINDOWS','FURNITURE','STAIRS','ELEVATOR','SLABS','VOIDS','DIMENSIONS','LABELS'];
 const pair=(code,value)=>parts.push(String(code),String(value));
 const entity=(type,layer,subclass)=>{pair(0,type);pair(100,'AcDbEntity');pair(8,layer);pair(100,subclass);};
 // Registered XDATA contains only design identities, never raw customer state.
 const metadata=info=>{pair(1001,'BMH');for(const [key,value]of Object.entries({revision,floor,units:'mm',status:'preliminary-architecture',...info}))if(value!==undefined&&value!==null)pair(1000,key+'='+String(value).replace(/[\r\n]/g,' '));};
 const mm=v=>Math.round(v*1000000)/1000;
 const line=(x,y,a,b,layer,info={})=>{entity('LINE',layer,'AcDbLine');pair(10,mm(x));pair(20,-mm(y));pair(30,0);pair(11,mm(a));pair(21,-mm(b));pair(31,0);metadata(info);};
 const poly=(ps,layer,info={})=>{entity('LWPOLYLINE',layer,'AcDbPolyline');pair(90,ps.length);pair(70,1);for(const q of ps){pair(10,mm(q.x));pair(20,-mm(q.y));}metadata(info);};
 const rect=(x,y,w,d,layer,info={})=>poly([{x,y},{x:x+w,y},{x:x+w,y:y+d},{x,y:y+d}],layer,info);
 const text=(x,y,value,layer='LABELS',height=.22,angle=0,info={})=>{entity('TEXT',layer,'AcDbText');pair(10,mm(x));pair(20,-mm(y));pair(30,0);pair(40,mm(height));pair(1,String(value).replace(/[\r\n]/g,' '));pair(50,angle);pair(7,'STANDARD');pair(100,'AcDbText');metadata(info);};
 const mtext=(x,y,width,value,info={})=>{entity('MTEXT','LABELS','AcDbMText');pair(10,mm(x));pair(20,-mm(y));pair(30,0);pair(40,220);pair(41,mm(Math.max(.2,width)));pair(71,1);pair(72,1);const content=String(value).replace(/[\\{}]/g,c=>'\\'+c).replace(/[\r\n]+/g,' ');let start=0;while(content.length-start>240){pair(3,content.slice(start,start+240));start+=240;}pair(1,content.slice(start));pair(7,'STANDARD');metadata(info);};
 const arc=(x,y,r,start,end,info={})=>{entity('ARC','DOORS','AcDbCircle');pair(10,mm(x));pair(20,-mm(y));pair(30,0);pair(40,mm(r));pair(100,'AcDbArc');pair(50,start);pair(51,end);metadata(info);};
 pair(0,'SECTION');pair(2,'HEADER');pair(9,'$ACADVER');pair(1,'AC1021');pair(9,'$INSUNITS');pair(70,4);pair(9,'$MEASUREMENT');pair(70,1);pair(0,'ENDSEC');
 pair(0,'SECTION');pair(2,'TABLES');pair(0,'TABLE');pair(2,'LAYER');pair(5,'10');pair(100,'AcDbSymbolTable');pair(70,layers.length);
 layers.forEach((name,i)=>{pair(0,'LAYER');pair(5,(32+i).toString(16).toUpperCase());pair(330,'10');pair(100,'AcDbSymbolTableRecord');pair(100,'AcDbLayerTableRecord');pair(2,name);pair(70,0);pair(62,name==='WALLS'?7:name==='WINDOWS'?4:8);pair(6,'CONTINUOUS');});pair(0,'ENDTAB');
 pair(0,'TABLE');pair(2,'APPID');pair(5,'11');pair(100,'AcDbSymbolTable');pair(70,1);pair(0,'APPID');pair(5,'12');pair(330,'11');pair(100,'AcDbSymbolTableRecord');pair(100,'AcDbRegAppTableRecord');pair(2,'BMH');pair(70,0);pair(0,'ENDTAB');pair(0,'ENDSEC');pair(0,'SECTION');pair(2,'ENTITIES');
 const parcel=p.site.useParcelGeometry?BMH.parcelGeometry?.():null;
 if(parcel)poly(parcel.points,'PLOT',{kind:'parcel-boundary',basis:parcel.basis});else rect(0,0,p.site.width,p.site.depth,'PLOT',{kind:'dimension-envelope',basis:'customer-dimensions'});
 const holes=BMH.stairFloorHoles?.(floor)||[];
 holes.forEach((q,i)=>rect(q.x,q.y,q.w,q.h,'VOIDS',{kind:'floor-void',voidIndex:i}));
 for(const r of rooms)for(const q of BMH.slabPanels?.(r,holes)||[{x:r.x,y:r.y,w:r.w,d:r.h}])rect(q.x,q.y,q.w,q.d,'SLABS',{kind:'slab-panel',roomId:r.id});
 for(const w of BMH.scenePlanGeometry(p.plan,floor).walls){
  const t=w.thickness||.12,x=w.horizontal?w.a:w.axis-t/2,y=w.horizontal?w.axis-t/2:w.a,width=w.horizontal?w.b-w.a:t,depth=w.horizontal?t:w.b-w.a,info={kind:w.kind,roomIds:(w.roomIds||[]).join(','),openingId:w.openingId};
  if(w.kind==='wall')rect(x,y,width,depth,'WALLS',info);
  if(w.kind==='window'){if(w.horizontal){line(w.a,w.axis-.04,w.b,w.axis-.04,'WINDOWS',info);line(w.a,w.axis+.04,w.b,w.axis+.04,'WINDOWS',info);}else{line(w.axis-.04,w.a,w.axis-.04,w.b,'WINDOWS',info);line(w.axis+.04,w.a,w.axis+.04,w.b,'WINDOWS',info);}}
 }
 for(const o of p.plan.openings.filter(o=>Number(o.floor)===floor)){
  const r=rooms.find(r=>r.id===o.roomId),span=r&&BMH.openingWallSpan(o);if(!span)continue;const horizontal=span.o==='h',w=span.b-span.a,x=horizontal?span.a:span.c,y=horizontal?span.c:span.a,info={kind:o.passage?'passage':o.kind,openingId:o.id,roomId:o.roomId,side:o.side,offset:o.offset,spanStartMm:mm(span.a),spanEndMm:mm(span.b),wallAxisMm:mm(span.c)};
  if(o.kind==='door'){const g=BMH.doorLeafGeometry(o);if(g){line(g.hinge.x,g.hinge.y,g.open.x,g.open.y,'DOORS',info);const angle=q=>(Math.atan2(g.hinge.y-q.y,q.x-g.hinge.x)*180/Math.PI+360)%360;arc(g.hinge.x,g.hinge.y,g.width,angle(g.sweep?g.open:g.closed),angle(g.sweep?g.closed:g.open),info);}else line(x,y,horizontal?span.b:span.c,horizontal?span.c:span.b,'DOORS',info);}
  text(x+(horizontal?w/2:.15),y+(horizontal?-.18:w/2),BMH.openingCode(o)+' / '+Math.round(w*1000),o.kind==='door'?'DOORS':'WINDOWS',.15,0,info);
 }
 const dimension=(x,y,w,d,vertical=false,info={})=>{const length=vertical?d:w;if(length<=0)return;line(x,y,x+w,y+d,'DIMENSIONS',info);for(const [a,b] of [[x,y],[x+w,y+d]])line(a-.07,b+.07,a+.07,b-.07,'DIMENSIONS',info);text(x+w/2+.08,y+d/2-.09,Math.round(length*1000),'DIMENSIONS',.18,vertical?90:0,info);};
 for(const q of (p.plan.fixtures||[]).filter(q=>q.floor===floor)){const info={kind:'fixture',fixtureId:q.id,roomId:q.roomId};rect(q.x,q.y,q.w,q.d,'FURNITURE',info);text(q.x+.08,q.y+q.d/2,q.name||'Bàn thờ · dự trù','LABELS',.22,0,info);}
 for(const z of floor===0?p.plan.outdoor||[]:[]){rect(z.x,z.y,z.w,z.h,'FURNITURE',{kind:'outdoor',outdoorId:z.id});text(z.x+.1,z.y+z.h/2,z.name);}
 for(const r of rooms){const info={roomId:r.id,kind:r.type};mtext(r.x+.18,r.y+r.h/2,Math.max(.2,r.w-.36),r.name,info);text(r.x+.18,r.y+r.h/2+.3,(r.w*r.h).toFixed(2)+' m2','LABELS',.22,0,info);dimension(r.x,r.y+.35,r.w,0,false,info);dimension(r.x+.35,r.y,0,r.h,true,info);if(BMH.resolvedFurniture&&BMH.furnitureFootprint){for(const i of BMH.resolvedFurniture(r.id))poly(BMH.furnitureFootprint(i),'FURNITURE',{...info,kind:'furniture',furnitureId:i.id,modelId:i.modelId,rotationDeg:i.pose.rotationDeg,widthMm:mm(i.size.width),depthMm:mm(i.size.depth),heightMm:mm(i.size.height)});}else for(const i of BMH.roomFurnitureLayout(r))rect(i.x,i.y,i.w,i.d,'FURNITURE',{...info,kind:'furniture',model:i.model});if(r.type==='garage'){const v=BMH.garageVehicle(r);if(v)rect(v.x,v.y,v.w,v.d,'FURNITURE',info);}if(r.type==='stairs')for(const [index,v]of BMH.stairGeometry(r).entries())rect(v.x,v.y,v.w,v.d,'STAIRS',{...info,partIndex:index,baseMm:mm(v.base),heightMm:mm(v.h)});if(r.type==='elevator'&&BMH.elevatorSpec){const v=BMH.elevatorSpec(r);rect(r.x+(r.w-v.cabinWidth)/2,r.y+(r.h-v.cabinDepth)/2,v.cabinWidth,v.cabinDepth,'ELEVATOR',{...info,shaftId:v.shaftId});text(r.x+.15,r.y+.35,'TM / CABIN '+Math.round(v.cabinWidth*1000)+'x'+Math.round(v.cabinDepth*1000),'ELEVATOR',.15);}}
 dimension(0,-1,p.site.width,0);dimension(-1,0,0,p.site.depth,true);
 text(0,p.site.depth+1,'BMH / MẶT BẰNG TẦNG '+(floor+1)+' / ĐƠN VỊ mm / MODEL 1:1 / '+revision);text(0,p.site.depth+1.4,'Kiến trúc sơ bộ; kết cấu và MEP cần thiết kế riêng.');pair(0,'ENDSEC');pair(0,'EOF');return parts.join('\r\n')+'\r\n';
};
// A3 sheets use paper millimetres; the nested model retains measured metres.
BMH.drawingRevision=()=>{
 const p=BMH.state.project,input=JSON.stringify({site:p.site,rooms:p.plan.rooms,openings:p.plan.openings,outdoor:p.plan.outdoor||[],levels:BMH.projectLevels()});let hash=2166136261;
 for(let i=0;i<input.length;i++){hash^=input.charCodeAt(i);hash=Math.imul(hash,16777619);}return (hash>>>0).toString(16).toUpperCase().padStart(8,'0');
};
BMH.drawingScale=(w,h,width=308,height=218)=>[50,75,100,125,150,200,250,300,500,750,1000,2000,5000].find(n=>w*1000/n<=width&&h*1000/n<=height)||Math.ceil(Math.max(w/width,h/height)*1000/100)*100;
BMH.sheetText=(x,y,value,size=2.6,extra='')=>'<text x="'+x+'" y="'+y+'" font-size="'+size+'" '+extra+'>'+BMH.esc(String(value??''))+'</text>';
BMH.sheetFrame=({code,title,scale,content,sidebar='',caption='',page=1,pages=1,floor=''})=>{
 const p=BMH.state.project,t=BMH.sheetText,short=(s,n)=>String(s||'').length>n?String(s).slice(0,n-1)+'…':String(s||''),revision=BMH.drawingRevision();
 return '<svg xmlns="http://www.w3.org/2000/svg" class="architectural-sheet sheet-'+code+'" width="420mm" height="297mm" viewBox="0 0 420 297" data-sheet-code="'+code+'" data-floor="'+floor+'" data-page="'+page+'" data-pages="'+pages+'" data-scale="'+scale+'" data-status="preliminary-architecture" data-model-unit="m" data-dimension-unit="mm" data-print-scale="100%" data-revision="'+revision+'" data-base-viewbox="0 0 420 297" role="img" aria-label="'+BMH.esc(title)+'"><rect width="420" height="297" fill="white"/><g font-family="Arial,sans-serif" fill="#26342e"><rect x="5" y="5" width="410" height="287" fill="none" stroke="#24342c" stroke-width=".35"/><path d="M5 261H415 M208 261V292 M332 261V292" fill="none" stroke="#24342c" stroke-width=".25"/>'+t(12,16,title,4.5,'font-weight="bold"')+t(412,16,'KIẾN TRÚC · A3','2.6','text-anchor="end"')+content+sidebar+t(12,251,caption||'Kích thước: mm · cao độ: m · diện tích bố trí: m². In 100% để giữ tỷ lệ.',2.5)+t(12,269,'BUILD MY HOME / '+short(p.name||'Ngôi nhà của bạn',52),3.3,'font-weight="bold"')+t(12,277,short([p.site.address,p.site.district,p.site.province].filter(Boolean).join(', '),72),2.5)+t(12,286,'Rev '+(p.dossier?.revision||'A')+' · Dữ liệu '+revision+' · '+new Date().toLocaleDateString('vi-VN'),2.5)+t(214,269,title,3.1,'font-weight="bold"')+t(214,277,'HỒ SƠ PHƯƠNG ÁN — CHƯA DÙNG THI CÔNG',2.4)+t(214,285,'Kết cấu, MEP và thi công cần KS/KTS xác nhận.',2.4)+t(338,269,code,4,'font-weight="bold"')+t(338,277,(scale?'Tỷ lệ 1:'+scale:'BẢNG THỐNG KÊ')+' · Trang '+page+'/'+pages,2.6)+t(338,285,'Người kiểm tra: chưa xác nhận',2.5)+'</g></svg>';
};
BMH.drawingReferenceAxesSvg=floor=>{
 const rooms=BMH.floorRooms(floor),p=BMH.state.project,unique=values=>[...new Set(values.map(n=>+n.toFixed(3)))].sort((a,b)=>a-b),xs=unique(rooms.flatMap(r=>[r.x,r.x+r.w])),ys=unique(rooms.flatMap(r=>[r.y,r.y+r.h]));
 const pick=values=>values.filter((v,i)=>i===0||i===values.length-1||v-values[i-1]>.55),letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
 return '<g class="axis-layer">'+pick(xs).map((x,i)=>'<g class="axis"><line x1="'+x+'" y1="-.65" x2="'+x+'" y2="'+p.site.depth+'" stroke-dasharray=".25 .08 .04 .08"/><circle cx="'+x+'" cy="-.85" r=".18"/><text x="'+x+'" y="-.78">'+(i+1)+'</text></g>').join('')+pick(ys).map((y,i)=>'<g class="axis"><line x1="-.65" y1="'+y+'" x2="'+p.site.width+'" y2="'+y+'" stroke-dasharray=".25 .08 .04 .08"/><circle cx="-.85" cy="'+y+'" r=".18"/><text x="-.85" y="'+(y+.07)+'">'+(letters[i]||i+1)+'</text></g>').join('')+'</g>';
};
BMH.drawingSheetSvg=(floor=BMH.state.ui.planner.floor)=>{
 const ns='http://www.w3.org/2000/svg',doc=new DOMParser().parseFromString(BMH.planSvg({interactive:false,floor}),'image/svg+xml'),svg=doc.documentElement;
 const rotated=!!svg.querySelector('#planDrawing'),W=Number(BMH.state.project.site.width),D=Number(BMH.state.project.site.depth);let pad=.22,scale,bounds;
 for(let i=0;i<3;i++){const x=-1.88-pad,y=-1.88-pad,w=W+1.5-x,h=D+.95-y;bounds=rotated?[y,W-x-w,h,w]:[x,y,w,h];scale=BMH.drawingScale(bounds[2],bounds[3]);pad=Math.max(.22,scale*.00275);}
 const [x,y,w,h]=bounds,width=w*1000/scale,height=h*1000/scale;svg.setAttribute('viewBox',bounds.join(' '));
 // Dimension values follow their chain; rotated plans keep vertical values vertical.
 if(rotated)for(const text of svg.querySelectorAll('.dimension-chain text'))if(Number(text.getAttribute('y'))<0)text.removeAttribute('transform');
 const model=svg.querySelector('#planDrawing')||svg,axis=svg.querySelector('.axis-layer'),axes=new DOMParser().parseFromString('<svg xmlns="'+ns+'">'+BMH.drawingReferenceAxesSvg(floor)+'</svg>','image/svg+xml').documentElement.firstChild;
 if(rotated)for(const text of axes.querySelectorAll('text'))text.setAttribute('transform','rotate(90 '+text.getAttribute('x')+' '+text.getAttribute('y')+')');axis?.replaceWith(doc.importNode(axes,true));
 const cut=new DOMParser().parseFromString('<svg xmlns="'+ns+'">'+BMH.sectionLineSvg(floor,Number(BMH.state.project.site.depth))+'</svg>','image/svg+xml').documentElement.firstChild;
 if(rotated)for(const text of cut.querySelectorAll('text'))text.setAttribute('transform','rotate(90 '+text.getAttribute('x')+' '+text.getAttribute('y')+')');model.appendChild(doc.importNode(cut,true));
 const font=scale*.0025,rooms=BMH.floorRooms(floor);
 for(const r of rooms){
  const group=[...svg.querySelectorAll('[data-room-id]')].find(g=>g.getAttribute('data-room-id')===r.id),label=group?.querySelector('.room-label');if(!label)continue;
  const name=label.querySelector('.room-name'),area=label.querySelector('.room-area'),maxWidth=(rotated?r.h:r.w)-.3,maxChars=Math.max(7,Math.floor(maxWidth/(font*.57))),words=r.name.toUpperCase().split(/\s+/),lines=[''];
  for(const word of words){const i=lines.length-1;if(lines[i]&&(lines[i]+' '+word).length>maxChars)lines.push(word);else lines[i]+=(lines[i]?' ':'')+word;}
  const cx=r.x+r.w/2,cy=r.y+r.h/2;name.removeAttribute('textLength');name.removeAttribute('lengthAdjust');name.setAttribute('x',cx);name.setAttribute('y',cy);name.innerHTML=lines.map((line,i)=>'<tspan x="'+cx+'" y="'+(cy+(i-(lines.length-1)/2)*font*1.22-font*.55)+'">'+BMH.esc(line)+'</tspan>').join('');
  if(rotated)label.setAttribute('transform','rotate(90 '+cx+' '+cy+')');
  area.removeAttribute('textLength');area.removeAttribute('lengthAdjust');area.setAttribute('x',cx);area.setAttribute('y',cy+lines.length*font*.62+font*.7);area.textContent=(r.w*r.h).toFixed(2)+' m²';
  group.querySelectorAll('.stairs-symbol>text').forEach(t=>{if(!t.hasAttribute('data-step-number'))t.remove();});
 }
 for(const tag of svg.querySelectorAll('.opening-tag')){const rect=tag.querySelector('rect'),text=tag.querySelector('text');if(!rect||!text)continue;const cx=Number(rect.getAttribute('x'))+Number(rect.getAttribute('width'))/2,cy=Number(rect.getAttribute('y'))+Number(rect.getAttribute('height'))/2,tw=Math.max(font*1.6,text.textContent.length*font*.8*.7+font*.55),th=font*1.3;rect.setAttribute('x',cx-tw/2);rect.setAttribute('y',cy-th/2);rect.setAttribute('width',tw);rect.setAttribute('height',th);text.setAttribute('x',cx);text.setAttribute('y',cy);text.setAttribute('dominant-baseline','central');text.removeAttribute('transform');if(rotated)tag.setAttribute('transform','rotate(90 '+cx+' '+cy+')');}
 svg.setAttribute('x',12+(308-width)/2);svg.setAttribute('y',24+(218-height)/2);svg.setAttribute('width',width);svg.setAttribute('height',height);svg.removeAttribute('id');svg.setAttribute('overflow','hidden');svg.classList.remove('planner-svg','architecture-svg','tool-select','rotated-landscape');svg.classList.add('drawing-plan');
 const style=doc.createElementNS(ns,'style');style.textContent=`.drawing-plan text{font-family:Arial,sans-serif;font-size:${font}px;fill:#27362f;text-anchor:middle}.drawing-plan .sheet-bg,.drawing-plan .paper,.drawing-plan .room-interior{fill:white}.drawing-plan .minor-grid,.drawing-plan .major-grid,.drawing-plan .room-lock-tag{display:none}.drawing-plan .arch-wall{stroke:#26342d;stroke-width:.12;stroke-linecap:square}.drawing-plan .plot-boundary{fill:none;stroke:#64756a;stroke-width:.025;stroke-dasharray:.12 .07}.drawing-plan .room-name{font-size:${font}px;font-weight:bold}.drawing-plan .room-area{font-size:${font*.9}px}.drawing-plan .furniture{opacity:.75}.drawing-plan .opening{fill:none;stroke:#3c5045;stroke-width:.025}.drawing-plan .opening-cut{stroke:white;stroke-width:.23}.drawing-plan .door path{stroke-dasharray:.06 .04}.drawing-plan .opening-tag rect{fill:white;stroke:#85988c;stroke-width:.015}.drawing-plan .opening-tag text{font-size:${font*.8}px}.drawing-plan .axis circle,.drawing-plan .north-arrow circle{fill:white;stroke:#718478;stroke-width:.02}.drawing-plan .axis line{stroke:#b2bbb5;stroke-width:.012}.drawing-plan .dimension-chain line{stroke:#64766a;stroke-width:.018}.drawing-plan .dimension-chain text{font-size:${font*.9}px}.drawing-plan .scale-bar{fill:#3c5045;stroke:#3c5045;stroke-width:.02}.drawing-plan .scale-bar .alt{fill:white}.drawing-plan .scale-bar text{font-size:${font*.85}px;stroke:none}.drawing-plan .north-arrow path{fill:#3c5045}.drawing-plan .stairs-symbol text{font-size:${font*.75}px}`;style.textContent=style.textContent.replaceAll('.drawing-plan','.sheet-KT-'+String(floor+1).padStart(2,'0')+' .drawing-plan');svg.insertBefore(style,svg.firstChild);
 const t=BMH.sheetText,levels=BMH.floorLevel(floor),area=rooms.reduce((n,r)=>n+r.w*r.h,0),stairs=rooms.filter(r=>r.type==='stairs'),right=t(330,29,'THÔNG SỐ TẦNG',3.1,'font-weight="bold"')+t(330,37,rooms.length+' không gian · '+area.toFixed(2)+' m²')+t(330,44,'Cao tầng '+levels.height.toFixed(3)+' m')+t(330,51,'Sàn '+Math.round(levels.slab*1000)+' mm')+t(330,58,'Thông thủy '+levels.clearHeight.toFixed(3)+' m')+t(330,69,'KÍCH THƯỚC / DIỆN TÍCH',2.8,'font-weight="bold"')+rooms.slice(0,11).map((r,i)=>t(330,78+i*12,r.name.length>30?r.name.slice(0,29)+'…':r.name,2.5)+t(330,83+i*12,Math.round(r.w*1000)+' × '+Math.round(r.h*1000)+' · '+(r.w*r.h).toFixed(2)+' m²',2.5)).join('')+t(330,219,'Ô mở: '+BMH.state.project.plan.openings.filter(o=>o.floor===floor).length+' · xem tờ bảng cửa',2.5)+t(330,226,'Mốc kích thước theo cạnh phòng.',2.4)+t(330,233,'Chưa xác định hệ cột chịu lực.',2.4)+t(330,240,stairs.length?'Thang: xem mặt cắt A–A.':'Hướng N theo mặt tiền đã nhập.',2.4);
 return BMH.sheetFrame({code:'KT-'+String(floor+1).padStart(2,'0'),title:'MẶT BẰNG TẦNG '+(floor+1),floor,scale,content:new XMLSerializer().serializeToString(svg),sidebar:right,caption:'Tường ngoài 220 / tường chung 120 mm (mô hình). Chuỗi kích thước theo mốc phòng; cần đối chiếu thực tế.'});
};
// Variable-height tables keep every Vietnamese name; short rows retain 24/page.
BMH.drawingWrap=(value,max)=>{
 const lines=[''];for(const word of String(value??'').normalize('NFC').split(/\s+/)){const chunks=[];let chunk='';for(const c of word){chunk+=c;if([...chunk].length===max){chunks.push(chunk);chunk='';}}if(chunk)chunks.push(chunk);for(const token of chunks){const current=lines.at(-1),next=(current?current+' ':'')+token;if([...next].length>max&&current)lines.push(token);else lines[lines.length-1]=next;}}return lines;
};
BMH.drawingTablePages=(rows,{widths,size=2.5,minHeight=8.3,height=200,maxRows=24}={})=>{
 const pages=[[]],lineHeight=size*1.42,maxLines=Math.max(1,Math.floor((height-3)/lineHeight));let used=0;
 for(const row of rows){const wrapped=row.values.map((v,i)=>BMH.drawingWrap(v,Math.max(3,Math.floor((widths[i]-4)/(size*.57))))),count=Math.max(...wrapped.map(c=>c.length));
  for(let start=0;start<count;start+=maxLines){const cells=wrapped.map(c=>c.slice(start,start+maxLines)),rowHeight=Math.max(minHeight,Math.max(...cells.map(c=>c.length))*lineHeight+3),entry={...row,cells,height:rowHeight,continued:start>0};if(start>0&&!cells[0].length)cells[0]=[String(row.values[0])+' (tiếp)'];if(pages.at(-1).length&&(used+rowHeight>height+.00001||pages.at(-1).length>=maxRows)){pages.push([]);used=0;}pages.at(-1).push(entry);used+=rowHeight;}
 }return pages;
};
BMH.openingSchedulePages=(floor=BMH.state.ui.planner.floor)=>{
 const widths=[22,72,27,28,28,28,32,39,40,40],rows=BMH.state.project.plan.openings.filter(o=>o.floor===floor).map(o=>{const room=BMH.state.project.plan.rooms.find(r=>r.id===o.roomId),span=BMH.openingWallSpan(o),horizontal=span?.o==='h';return {id:o.id,roomId:o.roomId,values:[BMH.openingCode(o),room?.name||'—',o.passage?'Lối mở':o.kind==='door'?'Cửa đi':'Cửa sổ',span?Math.round((span.b-span.a)*1000):Math.round(o.width*1000),Math.round((o.height??(o.kind==='door'?2.1:1.4))*1000),Math.round((o.kind==='door'?0:o.sill??.9)*1000),span&&room?Math.round((span.a-(horizontal?room.x:room.y))*1000):'—',({north:'Đầu đất',south:'Cuối đất',east:'Bên phải',west:'Bên trái'})[o.side],o.kind==='door'&&!o.passage?(o.hinge==='right'?'Phải':'Trái'):'—',o.kind==='door'&&!o.passage?(o.swing==='out'?'Ra ngoài':'Vào phòng'):'—']};});return BMH.drawingTablePages(rows,{widths});
};
BMH.openingSheetSvg=(floor=BMH.state.ui.planner.floor,page=0)=>{
 const pages=BMH.openingSchedulePages(floor),index=BMH.clamp(Number(page)||0,0,pages.length-1),t=BMH.sheetText,columns=[['Mã',22],['Phòng',72],['Loại',27],['Rộng',28],['Cao',28],['Bậu',28],['Mép đầu',32],['Cạnh',39],['Bản lề',40],['Mở',40]],xs=[12];columns.forEach(c=>xs.push(xs.at(-1)+c[1]));let content='<rect x="12" y="27" width="'+(xs.at(-1)-12)+'" height="9" fill="#eef1eb"/>';
 columns.forEach((c,i)=>content+=t(xs[i]+2,33,c[0],2.7,'font-weight="bold"'));let y=36;
 for(const row of pages[index]){content+='<g data-opening-id="'+BMH.esc(row.id)+'" data-room-reference="'+BMH.esc(row.roomId)+'"><line x1="12" x2="'+xs.at(-1)+'" y1="'+y+'" y2="'+y+'" stroke="#d1d9d2" stroke-width=".15"/>';row.cells.forEach((cell,j)=>cell.forEach((v,k)=>content+=t(xs[j]+2,y+5+k*3.55,v,2.5)));content+='</g>';y+=row.height;}
 content+=t(12,241,'Mép đầu đo từ đầu cạnh theo +X / +Y của mặt bằng. Bản lề trái/phải tính theo thứ tự này.',2.5);
 return BMH.sheetFrame({code:'KT-C'+(floor+1)+'-'+String(index+1).padStart(2,'0'),title:'BẢNG CỬA / Ô MỞ · TẦNG '+(floor+1),scale:0,content,floor,page:index+1,pages:pages.length,caption:'Đơn vị: mm. Cửa và kích thước được lấy trực tiếp từ phương án; quy cách sản phẩm cần xác nhận.'});
};
BMH.stairDrawingRooms=()=>BMH.state.project.plan.rooms.filter(r=>r.type==='stairs'&&r.floor<Number(BMH.state.project.site.floors)-1&&(BMH.stairGeometry?.(r)||[]).length).sort((a,b)=>a.floor-b.floor||a.x-b.x||a.y-b.y);
BMH.stairDrawingSelection=(floor=BMH.state.ui.planner.floor)=>{
 const rooms=BMH.stairDrawingRooms(),ui=BMH.state.ui.planner,outgoing=rooms.filter(r=>Number(r.floor)===Number(floor)),incoming=rooms.filter(r=>Number(r.floor)===Number(floor)-1),near=outgoing.length?outgoing:incoming;
 const room=near.find(r=>r.id===ui.stairDrawingId)||near[0]||rooms.find(r=>r.id===ui.stairDrawingId)||rooms[0]||null;
 return {rooms,room,index:room?rooms.findIndex(r=>r.id===room.id):-1};
};
BMH.stairDetailSheetSvg=(room,index=0)=>{
 const s=BMH.stairSpec(room),parts=BMH.stairGeometry(room),l=BMH.projectLevels(),run=s.alongX?room.w:room.h,scale=BMH.drawingScale(Math.max(room.w,run)+2.4,Math.max(room.h,s.rise)+2.2,148,193),font=scale*.0025,t=BMH.sheetText;
 const line=(x,y,a,b)=>'<line x1="'+x+'" y1="'+y+'" x2="'+a+'" y2="'+b+'" stroke="#536557" stroke-width=".02"/>',text=(x,y,value,extra='')=>'<text x="'+x+'" y="'+y+'" '+(extra.includes('text-anchor')?'':'text-anchor="middle" ')+extra+'>'+BMH.esc(value)+'</text>',rect=(x,y,w,h,fill='#f3f1e9')=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+fill+'" stroke="#47574a" stroke-width=".025"/>',dim=(x,y,a,b,value)=>line(x,y,a,b)+line(x-.06,y+.06,x+.06,y-.06)+line(a-.06,b+.06,a+.06,b-.06)+text((x+a)/2,(y+b)/2-.12,value);
 let plan=rect(0,0,room.w,room.h,'white');parts.forEach((q,i)=>{const x=q.x-room.x,y=q.y-room.y;plan+=rect(x,y,q.w,q.d)+text(x+q.w/2,y+q.d/2+font*.27,i+1,'font-size="'+font*.75+'"');});
 plan+=dim(0,room.h+.55,room.w,room.h+.55,Math.round(room.w*1000))+line(-.45,0,-.45,room.h)+text(-.58,room.h/2,Math.round(room.h*1000),'transform="rotate(-90 -.58 '+room.h/2+')"');
 const top=s.rise+.65,project=(q)=>({x:(s.alongX?q.x-room.x:q.y-room.y),w:s.alongX?q.w:q.d}),slab=(x,z,w,h)=>rect(x,top-z-h,w,h,'#a9b1a5');let profile=slab(-.45,-l.slab,run+.9,l.slab)+slab(-.45,s.rise-l.slab,.55,l.slab)+slab(run-.1,s.rise-l.slab,.55,l.slab);
 parts.forEach((q,i)=>{const p=project(q);profile+=rect(p.x,top-q.base-q.h,p.w,q.h,q.base>0?'#dbd4c4':'#eee9dd');if(i===0||i===s.first-1||i===parts.length-1)profile+=text(p.x+p.w/2,top-q.base-q.h-.10,i+1,'font-size="'+font*.75+'"');});
 profile+=line(-.55,top,run+.6,top)+line(-.55,top-s.rise,run+.6,top-s.rise)+text(-.5,top-.15,'±0.000','text-anchor="end"')+text(-.5,top-s.rise-.15,'+'+s.rise.toFixed(3),'text-anchor="end"')+dim(run+.75,top,run+.75,top-s.rise,Math.round(s.rise*1000))+dim(0,top+.5,run,top+.5,Math.round(run*1000));
 const viewport=(x,y,w,h,body,paperX)=>'<svg x="'+paperX+'" y="38" width="'+(w*1000/scale)+'" height="'+(h*1000/scale)+'" viewBox="'+[x,y,w,h].join(' ')+'" class="stair-detail-content"><style>.sheet-KT-CT-'+String(index+1).padStart(2,'0')+' .stair-detail-content text{font: '+font+'px Arial;fill:#354a3b}.sheet-KT-CT-'+String(index+1).padStart(2,'0')+' .stair-detail-content text[font-size]{font-size:'+font*.75+'px}</style>'+body+'</svg>';
 const content=t(12,29,'1. MẶT BẰNG THANG',3,'font-weight="bold"')+t(174,29,'2. HÌNH CHIẾU DỌC VẾ THANG',3,'font-weight="bold"')+viewport(-1.1,-.55,room.w+2.1,room.h+1.55,plan,12)+viewport(-1.15,-.15,run+2.4,s.rise+1.8,profile,174),sidebar=t(330,29,'KÍCH THƯỚC THANG',3,'font-weight="bold"')+t(330,40,'Tầng '+(room.floor+1)+' → '+(room.floor+2))+t(330,49,room.name,2.6)+t(330,62,s.count+' cao bậc · '+Math.round(s.riser*1000)+' mm')+t(330,71,'Mặt bậc '+Math.round(s.tread*1000)+' mm')+t(330,80,'Vế rộng '+Math.round((s.flightWidth||(s.alongX?room.h:room.w)-.24)*1000)+' mm')+t(330,89,'Chiếu nghỉ '+(s.landing?Math.round(s.landing*1000)+' mm':'—'))+t(330,102,'Ô phòng '+Math.round(room.w*1000)+' × '+Math.round(room.h*1000))+t(330,115,'Các vế chiếu theo hướng chạy.',2.4)+t(330,123,'Số bậc khớp mặt bằng và 3D.',2.4)+(s.warning?t(330,143,'Cần tăng ô / đổi hướng thang.',2.5,'font-weight="bold"'):'')+t(330,220,'KS/KTS xác nhận thông đầu,',2.5)+t(330,228,'lan can và cấu tạo chịu lực.',2.5);
 return BMH.sheetFrame({code:'KT-CT-'+String(index+1).padStart(2,'0'),title:'CHI TIẾT CẦU THANG · TẦNG '+(room.floor+1),floor:room.floor,scale,content,sidebar,caption:'Đơn vị mm; cao độ tương đối từ sàn tầng đang xem. Hình chiếu các vế lấy từ hình học thật; kết cấu thang cần thiết kế riêng.'});
};
BMH.architecturalSheets=()=>{
 const sheets=[],floors=Math.max(1,Number(BMH.state.project.site.floors)||1);
 for(let floor=0;floor<floors;floor++){sheets.push({name:'Mặt bằng tầng '+(floor+1),svg:BMH.drawingSheetSvg(floor)});const pages=BMH.openingSchedulePages(floor).length;for(let page=0;page<pages;page++)sheets.push({name:'Bảng cửa tầng '+(floor+1)+' / '+(page+1),svg:BMH.openingSheetSvg(floor,page)});}
 sheets.push({name:'Mặt đứng',svg:BMH.elevationSvg()},{name:'Mặt cắt A–A',svg:BMH.sectionSvg()});BMH.stairDrawingRooms().forEach((r,i)=>sheets.push({name:'Chi tiết cầu thang tầng '+(r.floor+1),svg:BMH.stairDetailSheetSvg(r,i)}));return sheets;
};
BMH.architecturalPrintHtml=()=>'<html lang="vi"><head><meta charset="utf-8"><title>BMH · Bộ bản vẽ A3</title><style>@page{size:A3 landscape;margin:0}*{box-sizing:border-box}body{margin:0;background:#e9ece6;font-family:Arial,sans-serif}.drawing-print-toolbar{padding:18px;text-align:center;position:sticky;top:0;background:#fff;border-bottom:1px solid #ddd}.drawing-print-toolbar button{padding:12px 20px;border:0;border-radius:8px;background:#526449;color:#fff;font-size:16px;cursor:pointer}.drawing-print-page{width:420mm;height:297mm;margin:12px auto;page-break-after:always;background:white}.drawing-print-page:last-child{page-break-after:auto}.drawing-print-page>svg{display:block;width:420mm;height:297mm}@media print{body{background:white}.drawing-print-toolbar{display:none}.drawing-print-page{margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}}</style></head><body><div class="drawing-print-toolbar"><button onclick="window.print()">In / Lưu bộ bản vẽ PDF</button><p>Khổ A3 ngang · tỷ lệ 100% · không bật vừa trang · tắt đầu/chân trang.</p></div>'+BMH.architecturalSheets().map(s=>'<section class="drawing-print-page">'+s.svg+'</section>').join('')+'</body></html>';
BMH.printArchitecturalDrawings=()=>{const w=window.open('','_blank');if(!w)return BMH.toast('Cho phép mở cửa sổ để xem và in bộ bản vẽ.');w.document.write(BMH.architecturalPrintHtml());w.document.close();};
BMH.currentDrawingSvg=()=>{const ui=BMH.state.ui.planner;if(ui.view==='stairs'){const {room,index}=BMH.stairDrawingSelection();return room?BMH.stairDetailSheetSvg(room,index):null;}return ui.view==='elevation'?BMH.elevationSvg():ui.view==='section'?BMH.sectionSvg():ui.view==='openings'?BMH.openingSheetSvg(ui.floor,ui.openingPage):BMH.drawingSheetSvg(ui.floor);};
BMH.exportPlanDxf=()=>BMH.download(`BMH-mat-bang-tang-${BMH.state.ui.planner.floor+1}-${BMH.drawingRevision()}-mm.dxf`,BMH.planDxf(),'application/dxf');
BMH.exportPlanSvg=()=>{
 const ui=BMH.state.ui.planner,svg=BMH.currentDrawingSvg();if(!svg)return BMH.toast('Chưa có vế thang nối tầng để xuất. Thêm cầu thang vào mặt bằng trước.');
 const name=ui.view==='elevation'?'mat-dung':ui.view==='section'?'mat-cat-A-A':ui.view==='openings'?'bang-cua-tang-'+(ui.floor+1)+'-'+((ui.openingPage||0)+1):ui.view==='stairs'?'chi-tiet-thang-'+(BMH.stairDrawingSelection().index+1):'mat-bang-tang-'+(ui.floor+1);
 BMH.download('BMH-'+name+'-A3.svg',svg,'image/svg+xml');
};

BMH.exportProjectJson = () => BMH.download('BMH-project.json',JSON.stringify(BMH.state,null,2),'application/json');
BMH.importProjectJson = async file => {
  if(!file||file.size>5_000_000)throw new Error('Bản sao dự án cần là JSON nhỏ hơn 5 MB.');
  let incoming;try{incoming=JSON.parse(await file.text());}catch(_){throw new Error('Tệp không phải JSON dự án hợp lệ.');}
  if(!incoming||typeof incoming!=='object'||Array.isArray(incoming)||!incoming.project?.site||!Array.isArray(incoming.project?.plan?.rooms)||!incoming.project?.finance||!incoming.project?.materials)throw new Error('Tệp thiếu dữ liệu khu đất, bản vẽ hoặc tài chính của Build My Home.');
  const site=incoming.project.site,rooms=incoming.project.plan.rooms;
  if(rooms.length>300||!Number.isFinite(Number(site.width))||Number(site.width)<=0||Number(site.width)>1000||!Number.isFinite(Number(site.depth))||Number(site.depth)<=0||Number(site.depth)>1000||!Number.isInteger(Number(site.floors))||Number(site.floors)<1||Number(site.floors)>10)throw new Error('Kích thước khu đất hoặc số phòng trong bản sao không hợp lệ.');
  if(rooms.some(r=>![r.x,r.y,r.w,r.h,r.floor].every(x=>Number.isFinite(Number(x)))||Number(r.w)<=0||Number(r.h)<=0||Number(r.floor)<0||Number(r.floor)>=Number(site.floors)))throw new Error('Bản vẽ trong tệp có phòng không hợp lệ.');
  const oldAccess=structuredClone(BMH.state.access);
  const next=BMH.mergeState(BMH.defaultState(),incoming);
  next.access=oldAccess;next.ui.step=BMH.clamp(Number(next.ui.step)||1,1,10);
  if(BMH.cloud){clearTimeout(BMH.cloud.saveTimer);BMH.cloud.activeProjectId='';BMH.cloud.syncStatus='local';try{localStorage.removeItem(BMH.CLOUD_ACTIVE_KEY);}catch(_){}}
  BMH.state=next;BMH.normalizeState();BMH.save();BMH.render();
  BMH.toast('Đã mở bản sao dự án. Tệp ảnh hiện trường chỉ được khôi phục từ ZIP trên thiết bị đã lưu.');
  return BMH.state;
};
BMH.zipStored = files => {
  const enc=new TextEncoder(); const crcTable=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
  const crc32=u8=>{let c=0xffffffff;for(const b of u8)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  const parts=[], central=[]; let offset=0;
  const u16=n=>new Uint8Array([n&255,(n>>>8)&255]); const u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
  for(const [name,content] of files){const n=enc.encode(name),d=content instanceof Uint8Array?content:enc.encode(String(content)),crc=crc32(d);const local=[u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(n.length),u16(0),n,d]; const len=local.reduce((s,x)=>s+x.length,0); parts.push(...local); central.push(...[u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(n.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),n]); offset+=len;}
  const centralOffset=offset, centralLen=central.reduce((s,x)=>s+x.length,0); parts.push(...central,...[u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralLen),u32(centralOffset),u16(0)]); return new Blob(parts,{type:'application/zip'});
};
BMH.exportBundle = () => {
  if(!BMH.isUnlocked()) return BMH.openPaywall();
  const e=BMH.estimate();
  const loanRows=[['Tháng','Lãi suất năm','Gốc','Lãi','Tổng trả','Dư nợ'],...BMH.loanSchedule().map(r=>[r.month,Number(r.annual.toFixed(2)),Math.round(r.principal),Math.round(r.interest),Math.round(r.payment),Math.round(r.balance)])];
  const basis=BMH.dataCostBasis();
  const estimateRows=[['Hạng mục','Giá trị (VND)'],['Đơn giá phần thô / m²',basis.shellPerM2],['Đơn giá hoàn thiện / m²',basis.finishPerM2],['Phần thô',e.shell],['Hoàn thiện & vật liệu',e.finish],['Vận chuyển',e.transport],['Thích ứng khí hậu',e.climatePrep||0],['Năng lượng & nước bền vững',e.performanceUpgrade||0],['Chuẩn bị',e.prep],['Dự phòng',e.contingency],['Tổng',e.total]];
  const areaRows=[['Tầng','Không gian','Diện tích m²','Chu vi m','Cửa đi','Cửa sổ','Ánh sáng','Thông gió'],...BMH.areaSchedule().map(r=>[r.floor,r.name,Number(r.area.toFixed(2)),Number(r.perimeter.toFixed(2)),r.doors,r.windows,r.daylight,r.ventilation])];
  const openingRows=[['Mã','Tầng','Phòng','Loại','Rộng m','Cao m','Bậu m','Hướng'],...BMH.openingSchedule().map(o=>[o.code,o.floor,o.room,o.passage?'Lối mở':o.kind==='door'?'Cửa đi':'Cửa sổ',o.width,o.height,o.sill,o.side])];
  const climateExport={site:BMH.state.project.site,profile:BMH.regionProfile(BMH.state.project.site),calendar:BMH.climateCalendar(BMH.regionProfile(BMH.state.project.site)),adaptation:BMH.siteAdaptation(BMH.state.project.site),resilience:BMH.resiliencePlan(BMH.state.project.site)};
  const siteIntelligence={parcel:BMH.siteParcelStats(BMH.state.project.site),buildable:BMH.buildableEnvelope(BMH.state.project.site),feasibility:BMH.siteFeasibility(BMH.state.project.site),orientation:BMH.orientationAnalysis(BMH.state.project.site),resilience:BMH.resiliencePlan(BMH.state.project.site)};
  const performanceExport={config:BMH.state.project.performance,model:BMH.performancePlan(),note:'Mô phỏng lập kế hoạch, không thay thế thiết kế MEP, khảo sát bóng che, báo giá thiết bị hoặc tính toán kỹ thuật.'};
  const optimizerExport={lockedRoomIds:BMH.state.project.plan.lockedRoomIds||[],variants:(BMH.state.project.planVariants||[]).map(v=>({id:v.id,code:v.code,strategy:v.strategy,label:v.label,metrics:v.metrics})),versions:(BMH.state.project.planVersions||[]).map(v=>({id:v.id,label:v.label,createdAt:v.createdAt,metrics:v.metrics})),currentMetrics:BMH.planMetrics?BMH.planMetrics(BMH.state.project.plan):null};
  const files=[['project.json',JSON.stringify(BMH.state,null,2)],['real-data-engine.json',JSON.stringify(BMH.realDataExport(),null,2)],['khi-hau-vi-tri.json',JSON.stringify(climateExport,null,2)],['site-intelligence.json',JSON.stringify(siteIntelligence,null,2)],['performance-studio.json',JSON.stringify(performanceExport,null,2)],['design-optimizer.json',JSON.stringify(optimizerExport,null,2)],['mat-bang-tang-1.svg',BMH.drawingSheetSvg(0)],['mat-dung-chinh.svg',BMH.elevationSvg()],['mat-cat-A-A.svg',BMH.sectionSvg()],['bang-dien-tich.xls',BMH.excelXml('Dien tich',areaRows)],['bang-cua.xls',BMH.excelXml('Cua',openingRows)],['du-toan.xls',BMH.excelXml('Du toan',estimateRows)],['lich-tra-no.xls',BMH.excelXml('Lich tra no',loanRows)]];
  for(let f=1;f<BMH.state.project.site.floors;f++)files.push([`mat-bang-tang-${f+1}.svg`,BMH.drawingSheetSvg(f)]);
  BMH.download('Build-My-Home-ho-so.zip',BMH.zipStored(files),'application/zip');
};

/* ===== V5.0 unified dossier exports ===== */
BMH.excelWorkbook = sheets => {
  const esc=v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const cell=(v,header=false)=>{const isNum=typeof v==='number'&&Number.isFinite(v),style=header?' ss:StyleID="Header"':'';return `<Cell${style}><Data ss:Type="${isNum?'Number':'String'}">${esc(v)}</Data></Cell>`};
  const cleanName=(name,i)=>String(name||`Sheet${i+1}`).replace(/[\\\/?*\[\]:]/g,' ').slice(0,31)||`Sheet${i+1}`;
  return `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Styles><Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Top"/><Font ss:FontName="Arial" ss:Size="10"/></Style><Style ss:ID="Header"><Font ss:FontName="Arial" ss:Size="10" ss:Bold="1"/><Interior ss:Color="#EAF2E7" ss:Pattern="Solid"/><Alignment ss:Vertical="Top" ss:WrapText="1"/></Style></Styles>${sheets.map((s,i)=>`<Worksheet ss:Name="${esc(cleanName(s.name,i))}"><Table>${(s.rows||[]).map((r,ri)=>`<Row>${r.map(v=>cell(v,ri===0)).join('')}</Row>`).join('')}</Table></Worksheet>`).join('')}</Workbook>`;
};
BMH.dossierWorkbook = (snap=BMH.createDossierSnapshot()) => {
  const summary=[['Nội dung','Giá trị'],['Tên dự án',snap.project.name],['Phiên bản',snap.version],['Revision',snap.revision],['Ngày xuất',snap.generatedAt],['Địa điểm',[snap.project.address,snap.project.district,snap.project.province].filter(Boolean).join(', ')],['Lô đất',snap.project.lot],['Số tầng',snap.project.floors],['Hướng mặt tiền',snap.project.frontDirection],['Diện tích quy đổi (m²)',snap.summary.grossArea],['Ngân sách',snap.summary.budget],['Dự toán',snap.summary.estimate],['Đã ghi chi phí thực tế',snap.summary.actualSpent],['Chênh lệch với ngân sách',snap.summary.gap],['Tiến độ (%)',snap.summary.progress],['Mức hoàn thiện dữ liệu hồ sơ (%)',snap.summary.completeness.percent],['Kiến trúc sư',snap.project.architect||''],['Nhà thầu',snap.project.contractor||''],['Nguồn đơn giá',snap.pricing.source],['Ngày nguồn',snap.pricing.date],['Tham chiếu',snap.pricing.reference]];
  const boq=[['Mã','Nhóm','Hạng mục','ĐVT','Khối lượng','Đơn giá phân bổ','Thành tiền','Ghi chú'],...snap.boq.map(x=>[x.code,x.group,x.name,x.unit,x.qty,x.rate,x.amount,x.note])];
  const mats=[['Nhóm','Vật liệu','Quy cách','Mã hàng','Trang sản phẩm','Ảnh sản phẩm','Khối lượng','ĐVT','Giá / báo giá','Nguồn','Trạng thái'],...snap.materials.map(x=>[x.group,x.name,x.spec,x.sku||'',x.productUrl||'',x.imageUrl||'',x.qty,x.unit,x.price,x.source,x.status])];
  const areas=[['Tầng','Không gian','Diện tích m²','Chu vi m','Loại','Cửa đi','Cửa sổ','Ánh sáng','Thông gió'],...snap.areas.map(x=>[x.floor,x.name,+x.area.toFixed(2),+x.perimeter.toFixed(2),x.type,x.doors,x.windows,x.daylight,x.ventilation])];
  const openings=[['Mã','Tầng','Phòng','Loại','Rộng m','Cao m','Bậu m','Hướng'],...snap.openings.map(x=>[x.code,x.floor,x.room,x.passage?'Lối mở':x.kind==='door'?'Cửa đi':'Cửa sổ',x.width,x.height,x.sill,x.side])];
  const schedule=[['#','Giai đoạn','Bắt đầu','Kết thúc','Tuần','Tỷ lệ giải ngân %','Số tiền dự toán','Chi thực tế','Chênh lệch','Tiến độ %','Trạng thái','Mốc nghiệm thu'],...snap.schedule.map((x,i)=>[i+1,x.name,x.start,x.end,x.weeks,x.pct,x.amount,x.actualSpent,x.variance,x.progress,x.status,x.milestone])];
  const cash=[['#','Giai đoạn','Bắt đầu','Kết thúc','Tỷ lệ %','Số tiền dự toán','Chi thực tế','Chênh lệch','Mốc nghiệm thu'],...snap.cashflow.map(x=>[x.no,x.stage,x.start,x.end,x.pct,x.amount,x.actualSpent,x.variance,x.milestone])];
  const mep=[['#','Hạng mục','Đã kiểm tra','Ghi chú'],...snap.mep.map(x=>[x.no,x.name,x.checked?'Có':'Chưa',x.note])];
  const drawings=[['Mã','Tên bản vẽ','Tên tệp'],...snap.drawings.map(x=>[x.code,x.name,x.file])];
  const evidence=[['Giai đoạn','Tên tệp','Loại','Dung lượng (byte)','Ngày thêm'],...(snap.evidence||[]).map(x=>[x.stage,x.name,x.type,x.size,x.addedAt])];
  const notes=[['Lưu ý'],...snap.disclaimers.map(x=>[x])];
  return BMH.excelWorkbook([{name:'Tong quan',rows:summary},{name:'BOQ',rows:boq},{name:'Vat lieu',rows:mats},{name:'Dien tich',rows:areas},{name:'Cua',rows:openings},{name:'Tien do',rows:schedule},{name:'Dong tien',rows:cash},{name:'MEP',rows:mep},{name:'Ban ve',rows:drawings},{name:'Thuc dia',rows:evidence},{name:'Luu y',rows:notes}]);
};
BMH.exportDossierExcel = () => {
  if(!BMH.isUnlocked())return BMH.openPaywall();
  BMH.download('BMH-Ho-so-xay-nha-V5.0.xls',BMH.dossierWorkbook(),'application/vnd.ms-excel');
};
BMH.exportDrawingsBundle = () => {
  if(!BMH.isUnlocked())return BMH.openPaywall();
  const snap=BMH.createDossierSnapshot(),files=[];
  for(let i=0;i<Math.max(1,Number(BMH.state.project.site.floors)||1);i++)files.push([`mat-bang-tang-${i+1}.svg`,BMH.drawingSheetSvg(i)],[`mat-bang-tang-${i+1}-mm.dxf`,BMH.planDxf(i)]);
  for(let f=0;f<BMH.state.project.site.floors;f++)for(let page=0;page<Math.max(1,Math.ceil(BMH.state.project.plan.openings.filter(o=>o.floor===f).length/24));page++)files.push(['bang-cua-tang-'+(f+1)+'-'+(page+1)+'.svg',BMH.openingSheetSvg(f,page)]);
  BMH.stairDrawingRooms().forEach((r,i)=>files.push(['chi-tiet-thang-'+(i+1)+'.svg',BMH.stairDetailSheetSvg(r,i)]));
  files.push(['mat-dung-chinh.svg',BMH.elevationSvg()],['mat-cat-A-A.svg',BMH.sectionSvg()],['danh-muc-ban-ve.csv',BMH.csv([['Mã','Tên bản vẽ','Tệp'],...snap.drawings.map(x=>[x.code,x.name,x.file])])]);
  BMH.download('BMH-Ban-ve-V5.0.zip',BMH.zipStored(files),'application/zip');
};
BMH.exportDossierBundle = async () => {
  if(!BMH.isUnlocked())return BMH.openPaywall();
  const snap=BMH.createDossierSnapshot(),files=[
    ['BMH-Ho-so-xay-nha-V5.0.xls',BMH.dossierWorkbook(snap)],
    ['BMH-Ho-so-in-luu-PDF.html',BMH.dossierPrintHtml(snap)],
    ['BMH-du-lieu-ho-so.json',JSON.stringify(snap,null,2)],
    ['ban-ve/bo-ban-ve-A3.html',BMH.architecturalPrintHtml()],
    ['BOQ.csv',BMH.csv([['Mã','Nhóm','Hạng mục','ĐVT','Khối lượng','Đơn giá phân bổ','Thành tiền','Ghi chú'],...snap.boq.map(x=>[x.code,x.group,x.name,x.unit,x.qty,x.rate,x.amount,x.note])])],
    ['vat-lieu.csv',BMH.csv([['Nhóm','Vật liệu','Quy cách','Mã hàng','Trang sản phẩm','Ảnh sản phẩm','Khối lượng','ĐVT','Giá / báo giá','Nguồn','Trạng thái'],...snap.materials.map(x=>[x.group,x.name,x.spec,x.sku||'',x.productUrl||'',x.imageUrl||'',x.qty,x.unit,x.price,x.source,x.status])])],
    ['tien-do-dong-tien.csv',BMH.csv([['#','Giai đoạn','Bắt đầu','Kết thúc','Tỷ lệ %','Số tiền dự toán','Chi thực tế','Chênh lệch','Tiến độ %','Mốc nghiệm thu'],...snap.cashflow.map(x=>[x.no,x.stage,x.start,x.end,x.pct,x.amount,x.actualSpent,x.variance,x.progress,x.milestone])])],
    ['MEP-checklist.csv',BMH.csv([['#','Hạng mục','Trạng thái','Ghi chú'],...snap.mep.map(x=>[x.no,x.name,x.checked?'Đã kiểm tra':'Chưa kiểm tra',x.note])])]
  ];
  for(let i=0;i<Math.max(1,Number(BMH.state.project.site.floors)||1);i++)files.push([`ban-ve/mat-bang-tang-${i+1}.svg`,BMH.drawingSheetSvg(i)],[`ban-ve/mat-bang-tang-${i+1}-mm.dxf`,BMH.planDxf(i)]);
  for(let f=0;f<BMH.state.project.site.floors;f++)for(let page=0;page<Math.max(1,Math.ceil(BMH.state.project.plan.openings.filter(o=>o.floor===f).length/24));page++)files.push(['ban-ve/bang-cua-tang-'+(f+1)+'-'+(page+1)+'.svg',BMH.openingSheetSvg(f,page)]);
  BMH.stairDrawingRooms().forEach((r,i)=>files.push(['ban-ve/chi-tiet-thang-'+(i+1)+'.svg',BMH.stairDetailSheetSvg(r,i)]));
  files.push(['ban-ve/mat-dung-chinh.svg',BMH.elevationSvg()],['ban-ve/mat-cat-A-A.svg',BMH.sectionSvg()],['project-backup.json',JSON.stringify(BMH.state,null,2)],['real-data-engine.json',JSON.stringify(BMH.realDataExport(),null,2)]);
  const evidenceRows=[['Giai đoạn','Tên tệp','Dung lượng (byte)','Ngày thêm','Tệp trong ZIP','Trạng thái']];let missing=0;
  for(const x of snap.evidence||[]){
    let blob=null;try{blob=await BMH.evidenceGet(x.id);}catch(_){}
    const cleanName=String(x.name||'tep').replace(/[\\/\x00-\x1f<>:"|?*]/g,'_').slice(0,100),zipName=`thuc-dia/${x.stage}/${x.id}-${cleanName}`;
    if(blob){files.push([zipName,new Uint8Array(await blob.arrayBuffer())]);evidenceRows.push([x.stage,x.name,x.size,x.addedAt,zipName,'Có tệp gốc']);}
    else{missing++;evidenceRows.push([x.stage,x.name,x.size,x.addedAt,'','Thiếu tệp gốc trên trình duyệt này']);}
  }
  files.push(['thuc-dia/danh-muc.csv',BMH.csv(evidenceRows)]);
  BMH.download('Build-My-Home-Ho-So-V5.0.zip',BMH.zipStored(files),'application/zip');
  if(missing)BMH.toast(missing+' tệp thực địa không còn trên trình duyệt này; xem danh mục trong ZIP.');
};
BMH.exportBundle = BMH.exportDossierBundle;
