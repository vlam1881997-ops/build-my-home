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
BMH.exportPlanSvg = () => BMH.download(`BMH-mat-bang-tang-${BMH.state.ui.planner.floor+1}.svg`,BMH.planSvg({interactive:false}),'image/svg+xml');
BMH.exportProjectJson = () => BMH.download('BMH-project.json',JSON.stringify(BMH.state,null,2),'application/json');
BMH.zipStored = files => {
  const enc=new TextEncoder(); const crcTable=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;})();
  const crc32=u8=>{let c=0xffffffff;for(const b of u8)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0;};
  const parts=[], central=[]; let offset=0;
  const u16=n=>new Uint8Array([n&255,(n>>>8)&255]); const u32=n=>new Uint8Array([n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255]);
  for(const [name,content] of files){const n=enc.encode(name),d=content instanceof Uint8Array?content:enc.encode(String(content)),crc=crc32(d);const local=[u32(0x04034b50),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(n.length),u16(0),n,d]; const len=local.reduce((s,x)=>s+x.length,0); parts.push(...local); central.push(...[u32(0x02014b50),u16(20),u16(20),u16(0),u16(0),u16(0),u16(0),u32(crc),u32(d.length),u32(d.length),u16(n.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),n]); offset+=len;}
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
  const files=[['project.json',JSON.stringify(BMH.state,null,2)],['real-data-engine.json',JSON.stringify(BMH.realDataExport(),null,2)],['khi-hau-vi-tri.json',JSON.stringify(climateExport,null,2)],['site-intelligence.json',JSON.stringify(siteIntelligence,null,2)],['performance-studio.json',JSON.stringify(performanceExport,null,2)],['design-optimizer.json',JSON.stringify(optimizerExport,null,2)],['mat-bang-tang-1.svg',BMH.planSvg({interactive:false,floor:0})],['mat-dung-chinh.svg',BMH.elevationSvg()],['mat-cat-A-A.svg',BMH.sectionSvg()],['bang-dien-tich.xls',BMH.excelXml('Dien tich',areaRows)],['bang-cua.xls',BMH.excelXml('Cua',openingRows)],['du-toan.xls',BMH.excelXml('Du toan',estimateRows)],['lich-tra-no.xls',BMH.excelXml('Lich tra no',loanRows)]];
  for(let f=1;f<BMH.state.project.site.floors;f++)files.push([`mat-bang-tang-${f+1}.svg`,BMH.planSvg({interactive:false,floor:f})]);
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
  const summary=[['Nội dung','Giá trị'],['Tên dự án',snap.project.name],['Phiên bản',snap.version],['Revision',snap.revision],['Ngày xuất',snap.generatedAt],['Địa điểm',[snap.project.address,snap.project.district,snap.project.province].filter(Boolean).join(', ')],['Lô đất',snap.project.lot],['Số tầng',snap.project.floors],['Hướng mặt tiền',snap.project.frontDirection],['Diện tích quy đổi (m²)',snap.summary.grossArea],['Ngân sách',snap.summary.budget],['Dự toán',snap.summary.estimate],['Chênh lệch',snap.summary.gap],['Tiến độ (%)',snap.summary.progress],['Mức hoàn thiện dữ liệu hồ sơ (%)',snap.summary.completeness.percent],['Kiến trúc sư',snap.project.architect||''],['Nhà thầu',snap.project.contractor||''],['Nguồn đơn giá',snap.pricing.source],['Ngày nguồn',snap.pricing.date],['Tham chiếu',snap.pricing.reference]];
  const boq=[['Mã','Nhóm','Hạng mục','ĐVT','Khối lượng','Đơn giá phân bổ','Thành tiền','Ghi chú'],...snap.boq.map(x=>[x.code,x.group,x.name,x.unit,x.qty,x.rate,x.amount,x.note])];
  const mats=[['Nhóm','Vật liệu','Quy cách','Khối lượng','ĐVT','Giá / báo giá','Nguồn','Trạng thái'],...snap.materials.map(x=>[x.group,x.name,x.spec,x.qty,x.unit,x.price,x.source,x.status])];
  const areas=[['Tầng','Không gian','Diện tích m²','Chu vi m','Loại','Cửa đi','Cửa sổ','Ánh sáng','Thông gió'],...snap.areas.map(x=>[x.floor,x.name,+x.area.toFixed(2),+x.perimeter.toFixed(2),x.type,x.doors,x.windows,x.daylight,x.ventilation])];
  const openings=[['Mã','Tầng','Phòng','Loại','Rộng m','Cao m','Bậu m','Hướng'],...snap.openings.map(x=>[x.code,x.floor,x.room,x.kind==='door'?'Cửa đi':'Cửa sổ',x.width,x.height,x.sill,x.side])];
  const schedule=[['#','Giai đoạn','Bắt đầu','Kết thúc','Tuần','Tỷ lệ giải ngân %','Số tiền','Tiến độ %','Trạng thái','Mốc nghiệm thu'],...snap.schedule.map((x,i)=>[i+1,x.name,x.start,x.end,x.weeks,x.pct,x.amount,x.progress,x.status,x.milestone])];
  const cash=[['#','Giai đoạn','Bắt đầu','Kết thúc','Tỷ lệ %','Số tiền','Mốc nghiệm thu'],...snap.cashflow.map(x=>[x.no,x.stage,x.start,x.end,x.pct,x.amount,x.milestone])];
  const mep=[['#','Hạng mục','Đã kiểm tra','Ghi chú'],...snap.mep.map(x=>[x.no,x.name,x.checked?'Có':'Chưa',x.note])];
  const drawings=[['Mã','Tên bản vẽ','Tên tệp'],...snap.drawings.map(x=>[x.code,x.name,x.file])];
  const notes=[['Lưu ý'],...snap.disclaimers.map(x=>[x])];
  return BMH.excelWorkbook([{name:'Tong quan',rows:summary},{name:'BOQ',rows:boq},{name:'Vat lieu',rows:mats},{name:'Dien tich',rows:areas},{name:'Cua',rows:openings},{name:'Tien do',rows:schedule},{name:'Dong tien',rows:cash},{name:'MEP',rows:mep},{name:'Ban ve',rows:drawings},{name:'Luu y',rows:notes}]);
};
BMH.exportDossierExcel = () => {
  if(!BMH.isUnlocked())return BMH.openPaywall();
  BMH.download('BMH-Ho-so-xay-nha-V5.0.xls',BMH.dossierWorkbook(),'application/vnd.ms-excel');
};
BMH.exportDrawingsBundle = () => {
  if(!BMH.isUnlocked())return BMH.openPaywall();
  const snap=BMH.createDossierSnapshot(),files=[];
  for(let i=0;i<Math.max(1,Number(BMH.state.project.site.floors)||1);i++)files.push([`mat-bang-tang-${i+1}.svg`,BMH.planSvg({interactive:false,floor:i})]);
  files.push(['mat-dung-chinh.svg',BMH.elevationSvg()],['mat-cat-A-A.svg',BMH.sectionSvg()],['danh-muc-ban-ve.csv',BMH.csv([['Mã','Tên bản vẽ','Tệp'],...snap.drawings.map(x=>[x.code,x.name,x.file])])]);
  BMH.download('BMH-Ban-ve-V5.0.zip',BMH.zipStored(files),'application/zip');
};
BMH.exportDossierBundle = () => {
  if(!BMH.isUnlocked())return BMH.openPaywall();
  const snap=BMH.createDossierSnapshot(),files=[
    ['BMH-Ho-so-xay-nha-V5.0.xls',BMH.dossierWorkbook(snap)],
    ['BMH-Ho-so-in-luu-PDF.html',BMH.dossierPrintHtml(snap)],
    ['BMH-du-lieu-ho-so.json',JSON.stringify(snap,null,2)],
    ['BOQ.csv',BMH.csv([['Mã','Nhóm','Hạng mục','ĐVT','Khối lượng','Đơn giá phân bổ','Thành tiền','Ghi chú'],...snap.boq.map(x=>[x.code,x.group,x.name,x.unit,x.qty,x.rate,x.amount,x.note])])],
    ['vat-lieu.csv',BMH.csv([['Nhóm','Vật liệu','Quy cách','Khối lượng','ĐVT','Giá / báo giá','Nguồn','Trạng thái'],...snap.materials.map(x=>[x.group,x.name,x.spec,x.qty,x.unit,x.price,x.source,x.status])])],
    ['tien-do-dong-tien.csv',BMH.csv([['#','Giai đoạn','Bắt đầu','Kết thúc','Tỷ lệ %','Số tiền','Tiến độ %','Mốc nghiệm thu'],...snap.cashflow.map(x=>[x.no,x.stage,x.start,x.end,x.pct,x.amount,x.progress,x.milestone])])],
    ['MEP-checklist.csv',BMH.csv([['#','Hạng mục','Trạng thái','Ghi chú'],...snap.mep.map(x=>[x.no,x.name,x.checked?'Đã kiểm tra':'Chưa kiểm tra',x.note])])]
  ];
  for(let i=0;i<Math.max(1,Number(BMH.state.project.site.floors)||1);i++)files.push([`ban-ve/mat-bang-tang-${i+1}.svg`,BMH.planSvg({interactive:false,floor:i})]);
  files.push(['ban-ve/mat-dung-chinh.svg',BMH.elevationSvg()],['ban-ve/mat-cat-A-A.svg',BMH.sectionSvg()],['project-backup.json',JSON.stringify(BMH.state,null,2)],['real-data-engine.json',JSON.stringify(BMH.realDataExport(),null,2)]);
  BMH.download('Build-My-Home-Ho-So-V5.0.zip',BMH.zipStored(files),'application/zip');
};
BMH.exportBundle = BMH.exportDossierBundle;
