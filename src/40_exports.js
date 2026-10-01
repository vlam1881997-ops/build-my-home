BMH.csv = rows => rows.map(r=>r.map(v=>`"${String(v??'').replaceAll('"','""')}"`).join(',')).join('\r\n');
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
 const p=BMH.state.project,rooms=BMH.floorRooms(floor),parts=[],layers=['PLOT','WALLS','DOORS','WINDOWS','FURNITURE','STAIRS','DIMENSIONS','LABELS'];
 const pair=(code,value)=>parts.push(String(code),String(value));
 const entity=(type,layer,subclass)=>{pair(0,type);pair(100,'AcDbEntity');pair(8,layer);pair(100,subclass);};
 const mm=v=>Math.round(v*1000000)/1000;
 const line=(x,y,a,b,layer)=>{entity('LINE',layer,'AcDbLine');pair(10,mm(x));pair(20,-mm(y));pair(30,0);pair(11,mm(a));pair(21,-mm(b));pair(31,0);};
 const poly=(ps,layer)=>{entity('LWPOLYLINE',layer,'AcDbPolyline');pair(90,ps.length);pair(70,1);for(const q of ps){pair(10,mm(q.x));pair(20,-mm(q.y));}};
 const rect=(x,y,w,d,layer)=>poly([{x,y},{x:x+w,y},{x:x+w,y:y+d},{x,y:y+d}],layer);
 const text=(x,y,value,layer='LABELS',height=.22,angle=0)=>{entity('TEXT',layer,'AcDbText');pair(10,mm(x));pair(20,-mm(y));pair(30,0);pair(40,mm(height));pair(1,String(value).replace(/[\r\n]/g,' '));pair(50,angle);pair(7,'STANDARD');pair(100,'AcDbText');};
 const arc=(x,y,r,start,end)=>{entity('ARC','DOORS','AcDbCircle');pair(10,mm(x));pair(20,-mm(y));pair(30,0);pair(40,mm(r));pair(100,'AcDbArc');pair(50,start);pair(51,end);};
 pair(0,'SECTION');pair(2,'HEADER');pair(9,'$ACADVER');pair(1,'AC1021');pair(9,'$INSUNITS');pair(70,4);pair(9,'$MEASUREMENT');pair(70,1);pair(0,'ENDSEC');
 pair(0,'SECTION');pair(2,'TABLES');pair(0,'TABLE');pair(2,'LAYER');pair(5,'10');pair(100,'AcDbSymbolTable');pair(70,layers.length);
 layers.forEach((name,i)=>{pair(0,'LAYER');pair(5,(32+i).toString(16).toUpperCase());pair(330,'10');pair(100,'AcDbSymbolTableRecord');pair(100,'AcDbLayerTableRecord');pair(2,name);pair(70,0);pair(62,i===1?7:i===3?4:8);pair(6,'CONTINUOUS');});pair(0,'ENDTAB');pair(0,'ENDSEC');pair(0,'SECTION');pair(2,'ENTITIES');
 const parcel=p.site.useParcelGeometry?BMH.parcelGeometry()?.points:null;
 if(parcel)poly(parcel,'PLOT');else rect(0,0,p.site.width,p.site.depth,'PLOT');
 for(const w of BMH.scenePlanGeometry(p.plan,floor).walls){
  const t=w.thickness||.12,x=w.horizontal?w.a:w.axis-t/2,y=w.horizontal?w.axis-t/2:w.a,width=w.horizontal?w.b-w.a:t,depth=w.horizontal?t:w.b-w.a;
  if(w.kind==='wall')rect(x,y,width,depth,'WALLS');
  if(w.kind==='window'){if(w.horizontal){line(w.a,w.axis-.04,w.b,w.axis-.04,'WINDOWS');line(w.a,w.axis+.04,w.b,w.axis+.04,'WINDOWS');}else{line(w.axis-.04,w.a,w.axis-.04,w.b,'WINDOWS');line(w.axis+.04,w.a,w.axis+.04,w.b,'WINDOWS');}}
 }
 for(const o of p.plan.openings.filter(o=>Number(o.floor)===floor)){
  const r=rooms.find(r=>r.id===o.roomId);if(!r)continue;const horizontal=['north','south'].includes(o.side),w=Math.min(Number(o.width)||.9,(horizontal?r.w:r.h)),offset=BMH.clamp(Number(o.offset)||0,0,1),x=horizontal?r.x+(r.w-w)*offset:o.side==='west'?r.x:r.x+r.w,y=horizontal?(o.side==='north'?r.y:r.y+r.h):r.y+(r.h-w)*offset;
  if(o.kind==='door'){if(o.side==='north'){line(x,y,x,y+w,'DOORS');arc(x,y,w,270,360);}else if(o.side==='south'){line(x,y,x,y-w,'DOORS');arc(x,y,w,0,90);}else if(o.side==='west'){line(x,y,x+w,y,'DOORS');arc(x,y,w,270,360);}else{line(x,y,x-w,y,'DOORS');arc(x,y,w,180,270);}}
  text(x+(horizontal?w/2:.15),y+(horizontal?-.18:w/2),BMH.openingCode(o)+' / '+Math.round(w*1000),o.kind==='door'?'DOORS':'WINDOWS',.15);
 }
 const dimension=(x,y,w,d,vertical=false)=>{const length=vertical?d:w;if(length<=0)return;line(x,y,x+w,y+d,'DIMENSIONS');for(const [a,b] of [[x,y],[x+w,y+d]])line(a-.07,b+.07,a+.07,b-.07,'DIMENSIONS');text(x+w/2+.08,y+d/2-.09,Math.round(length*1000),'DIMENSIONS',.18,vertical?90:0);};
 for(const r of rooms){text(r.x+.18,r.y+r.h/2,r.name);text(r.x+.18,r.y+r.h/2+.3,(r.w*r.h).toFixed(2)+' m2');dimension(r.x,r.y+.35,r.w,0);dimension(r.x+.35,r.y,0,r.h,true);for(const i of BMH.roomFurnitureLayout(r))rect(i.x,i.y,i.w,i.d,'FURNITURE');if(r.type==='garage'){const v=BMH.garageVehicle(r);if(v)rect(v.x,v.y,v.w,v.d,'FURNITURE');}if(r.type==='stairs')for(const v of BMH.stairGeometry(r))rect(v.x,v.y,v.w,v.d,'STAIRS');}
 dimension(0,-1,p.site.width,0);dimension(-1,0,0,p.site.depth,true);
 text(0,p.site.depth+1,'BMH / MẶT BẰNG TẦNG '+(floor+1)+' / ĐƠN VỊ mm / MODEL 1:1');text(0,p.site.depth+1.4,'Kiến trúc theo phương án; kết cấu và MEP cần thiết kế riêng.');pair(0,'ENDSEC');pair(0,'EOF');return parts.join('\r\n')+'\r\n';
};
BMH.drawingSheetSvg=(floor=BMH.state.ui.planner.floor)=>{
 const ns='http://www.w3.org/2000/svg',doc=new DOMParser().parseFromString(BMH.planSvg({interactive:false,floor}),'image/svg+xml'),svg=doc.documentElement;
 const [x,y,w,h]=svg.getAttribute('viewBox').split(/\s+/).map(Number),scale=[50,75,100,150,200,250,500,1000,2000,5000].find(s=>w*1000/s<=307&&h*1000/s<=260)||Math.ceil(Math.max(w/307,h/260)*1000),width=w*1000/scale,height=h*1000/scale;
 svg.setAttribute('x',10+(307-width)/2);svg.setAttribute('y',10+(260-height)/2);svg.setAttribute('width',width);svg.setAttribute('height',height);svg.removeAttribute('id');svg.setAttribute('overflow','visible');
 // Export styles are self-contained and measured in drawing metres.
 const style=doc.createElementNS(ns,'style');style.textContent='text{font-family:Arial,sans-serif;font-size:.15px;fill:#27362f;text-anchor:middle}.sheet-bg,.paper,.room-interior{fill:white}.minor-grid,.major-grid,.room-lock-tag{display:none}.arch-wall{stroke:#26342d;stroke-width:.12;stroke-linecap:square}.plot-boundary{fill:none;stroke:#526458;stroke-width:.025;stroke-dasharray:.12 .07}.room-name{font-size:.22px;font-weight:bold}.room-area{font-size:.15px}.furniture{opacity:.8}.opening{fill:none;stroke:#3c5045;stroke-width:.025}.opening-cut{stroke:white;stroke-width:.18}.door path{stroke-dasharray:.06 .04}.opening-tag rect{fill:white;stroke:#85988c;stroke-width:.015}.opening-tag text{font-size:.12px}.axis circle,.north-arrow circle{fill:white;stroke:#718478;stroke-width:.02}.axis line,.dimension-chain line{stroke:#64766a;stroke-width:.018}.dimension-chain text{font-size:.13px}.scale-bar{fill:#3c5045;stroke:#3c5045;stroke-width:.02}.scale-bar .alt{fill:white}.scale-bar text{font-size:.13px;stroke:none}.north-arrow path{fill:#3c5045}';svg.classList.add('drawing-plan');style.textContent=style.textContent.replace(/(^|})([^{}]+){/g,(_,start,selectors)=>start+selectors.split(',').map(s=>'.drawing-plan '+s.trim()).join(',')+'{');svg.insertBefore(style,svg.firstChild);
 const esc=BMH.esc,p=BMH.state.project,openings=p.plan.openings.filter(o=>Number(o.floor)===floor),levels=BMH.projectLevels();
 const title=(y,t,bold=false)=>'<text x="324" y="'+y+'" font-size="'+(bold?4:3)+'" '+(bold?'font-weight="bold"':'')+'>'+esc(t)+'</text>';
 const rows=openings.map((o,i)=>title(100+i*5,BMH.openingCode(o)+' · '+Math.round(o.width*1000)+' × '+Math.round((o.height||(o.kind==='door'?2.1:1.4))*1000)+' · B '+Math.round((o.sill||0)*1000))).slice(0,24).join('');
 return '<svg xmlns="'+ns+'" width="420mm" height="297mm" viewBox="0 0 420 297"><rect width="420" height="297" fill="white"/><g font-family="Arial,sans-serif" fill="#26382d"><rect x="5" y="5" width="410" height="287" fill="none" stroke="#26382d" stroke-width=".35"/><path d="M319 5V292 M5 276H319" fill="none" stroke="#26382d" stroke-width=".25"/>'+new XMLSerializer().serializeToString(svg)+title(16,'BUILD MY HOME',true)+title(27,'MẶT BẰNG TẦNG '+(floor+1),true)+title(36,'Mã bản vẽ: KT-'+String(floor+1).padStart(2,'0'))+title(43,'Tỷ lệ in: 1:'+scale+' · Khổ A3')+title(50,'In 100% để giữ đúng tỷ lệ')+title(57,'Kích thước CAD: mm; mặt bằng: m')+title(64,'Cao tầng: '+levels.floorHeight.toFixed(2)+' m')+title(71,'Ngày: '+new Date().toISOString().slice(0,10))+title(83,'BẢNG Ô MỞ · rộng × cao · bậu',true)+rows+title(242,'PHƯƠNG ÁN KIẾN TRÚC',true)+title(251,'Đối chiếu ranh và số đo thực tế.')+title(258,'Kết cấu, điện nước, PCCC cần')+title(264,'hồ sơ chuyên môn và kiểm tra.')+'<text x="12" y="283" font-size="3">Mặt bằng và 3D dùng chung dữ liệu phòng, tường, cửa và cầu thang.</text><text x="12" y="289" font-size="3">Trục trên bản vẽ là mốc kích thước; chưa xác định hệ cột chịu lực.</text></g></svg>';
};
BMH.exportPlanDxf=()=>BMH.download(`BMH-mat-bang-tang-${BMH.state.ui.planner.floor+1}-mm.dxf`,BMH.planDxf(),'application/dxf');
BMH.exportPlanSvg=()=>BMH.download(`BMH-mat-bang-tang-${BMH.state.ui.planner.floor+1}-A3.svg`,BMH.drawingSheetSvg(),'image/svg+xml');

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
  const openingRows=[['Mã','Tầng','Phòng','Loại','Rộng m','Cao m','Bậu m','Hướng'],...BMH.openingSchedule().map(o=>[o.code,o.floor,o.room,o.kind==='door'?'Cửa đi':'Cửa sổ',o.width,o.height,o.sill,o.side])];
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
  const openings=[['Mã','Tầng','Phòng','Loại','Rộng m','Cao m','Bậu m','Hướng'],...snap.openings.map(x=>[x.code,x.floor,x.room,x.kind==='door'?'Cửa đi':'Cửa sổ',x.width,x.height,x.sill,x.side])];
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
  files.push(['mat-dung-chinh.svg',BMH.elevationSvg()],['mat-cat-A-A.svg',BMH.sectionSvg()],['danh-muc-ban-ve.csv',BMH.csv([['Mã','Tên bản vẽ','Tệp'],...snap.drawings.map(x=>[x.code,x.name,x.file])])]);
  BMH.download('BMH-Ban-ve-V5.0.zip',BMH.zipStored(files),'application/zip');
};
BMH.exportDossierBundle = async () => {
  if(!BMH.isUnlocked())return BMH.openPaywall();
  const snap=BMH.createDossierSnapshot(),files=[
    ['BMH-Ho-so-xay-nha-V5.0.xls',BMH.dossierWorkbook(snap)],
    ['BMH-Ho-so-in-luu-PDF.html',BMH.dossierPrintHtml(snap)],
    ['BMH-du-lieu-ho-so.json',JSON.stringify(snap,null,2)],
    ['BOQ.csv',BMH.csv([['Mã','Nhóm','Hạng mục','ĐVT','Khối lượng','Đơn giá phân bổ','Thành tiền','Ghi chú'],...snap.boq.map(x=>[x.code,x.group,x.name,x.unit,x.qty,x.rate,x.amount,x.note])])],
    ['vat-lieu.csv',BMH.csv([['Nhóm','Vật liệu','Quy cách','Mã hàng','Trang sản phẩm','Ảnh sản phẩm','Khối lượng','ĐVT','Giá / báo giá','Nguồn','Trạng thái'],...snap.materials.map(x=>[x.group,x.name,x.spec,x.sku||'',x.productUrl||'',x.imageUrl||'',x.qty,x.unit,x.price,x.source,x.status])])],
    ['tien-do-dong-tien.csv',BMH.csv([['#','Giai đoạn','Bắt đầu','Kết thúc','Tỷ lệ %','Số tiền dự toán','Chi thực tế','Chênh lệch','Tiến độ %','Mốc nghiệm thu'],...snap.cashflow.map(x=>[x.no,x.stage,x.start,x.end,x.pct,x.amount,x.actualSpent,x.variance,x.progress,x.milestone])])],
    ['MEP-checklist.csv',BMH.csv([['#','Hạng mục','Trạng thái','Ghi chú'],...snap.mep.map(x=>[x.no,x.name,x.checked?'Đã kiểm tra':'Chưa kiểm tra',x.note])])]
  ];
  for(let i=0;i<Math.max(1,Number(BMH.state.project.site.floors)||1);i++)files.push([`ban-ve/mat-bang-tang-${i+1}.svg`,BMH.drawingSheetSvg(i)],[`ban-ve/mat-bang-tang-${i+1}-mm.dxf`,BMH.planDxf(i)]);
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
