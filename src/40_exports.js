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
BMH.exportEstimate = () => { const e=BMH.estimate(), rows=[['Hạng mục','Giá trị (VND)'],['Phần thô',e.shell],['Hoàn thiện & vật liệu',e.finish],['Vận chuyển',e.transport],['Chuẩn bị',e.prep],['Dự phòng 10%',e.contingency],['TỔNG',e.total]]; BMH.download('BMH-du-toan.xls',BMH.excelXml('Du toan',rows),'application/vnd.ms-excel'); };
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
  const estimateRows=[['Hạng mục','Giá trị (VND)'],['Phần thô',e.shell],['Hoàn thiện & vật liệu',e.finish],['Vận chuyển',e.transport],['Chuẩn bị',e.prep],['Dự phòng',e.contingency],['Tổng',e.total]];
  const files=[['project.json',JSON.stringify(BMH.state,null,2)],['mat-bang-tang-1.svg',BMH.planSvg({interactive:false,floor:0})],['du-toan.xls',BMH.excelXml('Du toan',estimateRows)],['lich-tra-no.xls',BMH.excelXml('Lich tra no',loanRows)]];
  for(let f=1;f<BMH.state.project.site.floors;f++)files.push([`mat-bang-tang-${f+1}.svg`,BMH.planSvg({interactive:false,floor:f})]);
  BMH.download('Build-My-Home-ho-so.zip',BMH.zipStored(files),'application/zip');
};
