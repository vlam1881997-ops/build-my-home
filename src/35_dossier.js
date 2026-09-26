/* ===== V5.0 construction dossier engine ===== */
BMH.DOSSIER_STAGE_DEFS = [
  {id:'foundation',name:'Móng & hạ tầng',weeks:3,pct:10,milestone:'Nghiệm thu móng'},
  {id:'structure',name:'Kết cấu',weeks:8,pct:20,milestone:'Nghiệm thu kết cấu'},
  {id:'walls',name:'Tường & xây tô',weeks:4,pct:15,milestone:'Nghiệm thu xây tô'},
  {id:'roof',name:'Mái & chống thấm',weeks:3,pct:10,milestone:'Thử nước / nghiệm thu mái'},
  {id:'mep',name:'Điện nước (MEP)',weeks:5,pct:15,milestone:'Test áp lực / cách điện'},
  {id:'finish',name:'Hoàn thiện',weeks:8,pct:20,milestone:'Nghiệm thu hoàn thiện'},
  {id:'handover',name:'Nội thất & bàn giao',weeks:3,pct:10,milestone:'Bàn giao hồ sơ & công trình'}
];
BMH.MEP_ITEMS = [
  ['pipe114','Thoát toilet Φ114, kiểm tra độ dốc và thông khí'],
  ['acWire','Dây điện máy lạnh đi tuyến riêng, đúng tiết diện thiết kế'],
  ['pressure','Test áp lực đường cấp nước trước khi che kín'],
  ['internet','Ống chờ internet / camera / mạng nội bộ'],
  ['elcb','Tiếp địa và bảo vệ chống rò ELCB/RCBO'],
  ['waterTank','Bồn nước, phao và đường tràn có lối bảo trì'],
  ['drainSlope','Thoát sàn / ban công có độ dốc và test thoát nước'],
  ['grounding','Đo kiểm hệ tiếp địa trước nghiệm thu'],
  ['rcbo','Tủ điện phân mạch và nhãn nhận diện tải'],
  ['acDrain','Ống xả ngưng điều hòa có độ dốc, không hồi mùi'],
  ['kitchenHood','Ống hút mùi bếp thoát ra ngoài, có van một chiều'],
  ['conduitReserve','Ống chờ dự phòng cho điện mặt trời / smart home']
];
BMH.toDate = value => {const d=new Date(`${String(value||'').slice(0,10)}T12:00:00`);return Number.isNaN(d.getTime())?new Date():d;};
BMH.addDays = (date,days) => {const d=new Date(date);d.setDate(d.getDate()+days);return d;};
BMH.isoDay = date => {const d=new Date(date),pad=n=>String(n).padStart(2,'0');return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;};
BMH.dateLabel = value => /^\d{4}-\d{2}-\d{2}$/.test(String(value||''))?BMH.toDate(value).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'}):'Chưa đặt lịch';
BMH.dossierSchedule = () => {
  const d=BMH.state.project.dossier||{},hasStart=/^\d{4}-\d{2}-\d{2}$/.test(String(d.startDate||'')),start=BMH.toDate(d.startDate),e=BMH.estimate(),overall=BMH.clamp(Number(d.progress)||0,0,100);
  let cursor=new Date(start),paid=0,physicalCursor=0,allocated=0;
  return BMH.DOSSIER_STAGE_DEFS.map((s,i)=>{
    const stageStart=new Date(cursor),end=BMH.addDays(stageStart,s.weeks*7-1);cursor=BMH.addDays(end,1);
    const amount=i===BMH.DOSSIER_STAGE_DEFS.length-1?Math.max(0,e.total-allocated):Math.round(e.total*s.pct/100);allocated+=amount;
    const p0=physicalCursor,p1=physicalCursor+s.pct;physicalCursor=p1;
    const progress=BMH.clamp(Math.round((overall-p0)/Math.max(1,p1-p0)*100),0,100);
    const status=progress>=100?'done':progress>0?'active':'pending';
    paid+=status==='done'?amount:status==='active'?Math.round(amount*progress/100):0;
    const actualSpent=Math.max(0,Number(d.actualCosts?.[s.id])||0);
    return {...s,start:hasStart?BMH.isoDay(stageStart):'',end:hasStart?BMH.isoDay(end):'',amount,actualSpent,variance:actualSpent-amount,progress,status,paidToDate:paid};
  });
};
BMH.wallFinishArea = () => {
  const rooms=BMH.state.project.plan.rooms||[];
  const perimeter=rooms.reduce((s,r)=>s+2*(Number(r.w||0)+Number(r.h||0)),0);
  return Math.max(BMH.estimate().area*1.8,perimeter*3.0*.62);
};
BMH.boqSchedule = () => {
  const e=BMH.estimate(),area=Math.max(1,e.area),wall=BMH.wallFinishArea(),bath=(BMH.state.project.plan.rooms||[]).filter(r=>r.type==='bath').length||1;
  const doorArea=(BMH.openingSchedule?.()||[]).reduce((s,o)=>s+Number(o.width||0)*Number(o.height||0),0)||area*.08;
  const rows=[];const add=(code,group,name,unit,qty,cost,note='')=>rows.push({code,group,name,unit,qty:+Math.max(.01,qty).toFixed(2),rate:Math.round(cost/Math.max(.01,qty)),amount:Math.round(cost),note});
  add('A01','Chuẩn bị','Chuẩn bị mặt bằng, định vị, che chắn','m²',area,e.prep,'Khối lượng quy đổi theo diện tích xây dựng');
  add('B01','Phần thô','Móng, đào đất và bê tông móng','m³',area*.18,e.shell*.25,'Khối lượng sơ bộ để lập ngân sách');
  add('B02','Phần thô','Bê tông cốt thép khung/sàn','m³',area*.12,e.shell*.30,'Cần kỹ sư kết cấu bóc tách lại');
  add('B03','Phần thô','Cốt thép kết cấu','kg',area*.12*120,e.shell*.27,'Suất thép giả định để phối hợp ngân sách');
  add('B04','Phần thô','Tường xây và xây tô','m²',wall,e.shell*.12,'Diện tích tường quy đổi');
  add('B05','Phần thô','Mái / cấu tạo mái thô','m²',area/Math.max(1,Number(BMH.state.project.site.floors)||1),e.shell*.06,'Theo cấu hình công trình hiện tại');
  add('C01','Hoàn thiện','Điện âm tường, tủ điện, thiết bị cơ bản','điểm',Math.max(24,area*.45),e.finish*.11,'Số điểm quy đổi');
  add('C02','Hoàn thiện','Cấp thoát nước và phụ kiện MEP','điểm',Math.max(12,area*.18),e.finish*.11,'Số điểm quy đổi');
  add('C03','Hoàn thiện','Lát sàn / ốp khu vực chính','m²',area*.92,e.finish*.18,'Đã tính hao hụt sơ bộ');
  add('C04','Hoàn thiện','Cửa đi, cửa sổ và vách kính','m²',Math.max(8,doorArea),e.finish*.12,'Theo danh sách ô mở');
  add('C05','Hoàn thiện','Bả và sơn nội/ngoại thất','m²',wall*1.85,e.finish*.16,'Diện tích sơn quy đổi hai mặt');
  add('C06','Hoàn thiện','Chống thấm WC, mái, ban công','m²',area*.26,e.finish*.08,'Phải test nước trước hoàn thiện');
  add('C07','Hoàn thiện','Thiết bị vệ sinh','bộ',Math.max(1,bath),e.finish*.08,'Bộ quy đổi theo số WC');
  add('C08','Hoàn thiện','Trần, mộc và hoàn thiện phụ trợ','m²',area*.82,e.finish*.16,'Khối lượng quy đổi');
  if(e.transport>0)add('D01','Điều kiện công trường','Vận chuyển / tiếp cận công trường','gói',1,e.transport,'Theo điều kiện đường tiếp cận');
  if(e.climatePrep>0)add('D02','Khí hậu','Gói thích ứng khí hậu','gói',1,e.climatePrep,'Theo dữ liệu vị trí và gói đã chọn');
  if(e.performanceUpgrade>0)add('D03','Hiệu suất','Năng lượng & nước bền vững','gói',1,e.performanceUpgrade,'Theo Performance Studio');
  add('Z01','Dự phòng','Dự phòng phát sinh','gói',1,e.contingency,'Dự phòng kế hoạch; không thay thế báo giá nhà thầu');
  const diff=e.total-rows.reduce((s,r)=>s+r.amount,0);if(rows.length&&diff)rows.at(-1).amount+=diff;
  return rows;
};
BMH.materialSchedule = () => {
  const p=BMH.state.project,e=BMH.estimate(),boq=BMH.boqSchedule(),choice=(cat)=>BMH.MATERIALS[cat]?.find(x=>x.id===p.materials.choices?.[cat]);
  const floor=choice('floor'),paint=choice('paint'),door=choice('door'),pick=code=>boq.find(x=>x.code===code);
  return [
    {group:'Kết cấu',name:'Xi măng / bê tông',spec:'Theo cấp phối và thiết kế kết cấu được duyệt',qty:pick('B02')?.qty||0,unit:'m³',price:'Theo BOQ / báo giá',source:BMH.dataCostBasis().sourceLabel,status:'Cần KTS/KS chốt'},
    {group:'Kết cấu',name:'Thép cốt bê tông',spec:'Chủng loại theo hồ sơ kết cấu',qty:pick('B03')?.qty||0,unit:'kg',price:'Theo BOQ / báo giá',source:BMH.dataCostBasis().sourceLabel,status:'Cần KS chốt'},
    {group:'Hoàn thiện',name:floor?.name||'Gạch lát',spec:floor?.sub||'Chưa chọn',qty:+(e.area*.92).toFixed(1),unit:'m²',price:floor?BMH.materialPriceLabel('floor',floor):'Cần báo giá',source:floor?BMH.materialSourceLabel(floor):'—',status:floor?'Đã chọn':'Chưa chọn'},
    {group:'Hoàn thiện',name:paint?.name||'Sơn',spec:paint?.sub||'Chưa chọn',qty:+(BMH.wallFinishArea()*1.85).toFixed(1),unit:'m²',price:paint?BMH.materialPriceLabel('paint',paint):'Cần báo giá',source:paint?BMH.materialSourceLabel(paint):'—',status:paint?'Đã chọn':'Chưa chọn'},
    {group:'Hoàn thiện',name:door?.name||'Hệ cửa',spec:door?.sub||'Chưa chọn',qty:+Math.max(8,(BMH.openingSchedule?.()||[]).reduce((s,o)=>s+o.width*o.height,0)).toFixed(1),unit:'m²',price:door?BMH.materialPriceLabel('door',door):'Cần báo giá',source:door?BMH.materialSourceLabel(door):'—',status:door?'Đã chọn':'Chưa chọn'},
    {group:'Chống thấm',name:'Hệ chống thấm',spec:`Gói khí hậu: ${p.materials.climatePackage}`,qty:+(e.area*.26).toFixed(1),unit:'m²',price:'Theo BOQ / báo giá',source:BMH.dataCostBasis().sourceLabel,status:'Cần nhà thầu chốt'},
    {group:'MEP',name:'Ống, dây và thiết bị MEP',spec:'Theo checklist và bản vẽ MEP triển khai',qty:1,unit:'gói',price:'Theo BOQ / báo giá',source:BMH.dataCostBasis().sourceLabel,status:'Cần KS MEP chốt'}
  ];
};
BMH.mepChecklistRows = () => BMH.MEP_ITEMS.map(([id,name],i)=>({no:i+1,id,name,checked:!!BMH.state.project.checklist?.[id],note:BMH.state.project.dossier?.mepNotes?.[id]||''}));
BMH.cashflowSchedule = () => BMH.dossierSchedule().map((s,i)=>({no:i+1,stage:s.name,start:s.start,end:s.end,pct:s.pct,amount:s.amount,actualSpent:s.actualSpent,variance:s.variance,milestone:s.milestone,status:s.status,progress:s.progress}));
/* Construction evidence bytes stay in this browser; metadata is kept in the project and ZIP includes both. */
BMH.evidenceDbPromise=null;
BMH.evidenceDb=()=>{
  if(!globalThis.indexedDB)return Promise.reject(new Error('Trình duyệt này không hỗ trợ lưu tệp cục bộ.'));
  if(BMH.evidenceDbPromise)return BMH.evidenceDbPromise;
  BMH.evidenceDbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open('bmh-construction-evidence',1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('files'))req.result.createObjectStore('files',{keyPath:'id'});};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>{BMH.evidenceDbPromise=null;reject(req.error||new Error('Không mở được kho tệp.'));};
  });
  return BMH.evidenceDbPromise;
};
BMH.evidencePut=async(id,blob)=>{
  const db=await BMH.evidenceDb();
  return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').put({id,blob});tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Không lưu được tệp.'));tx.onabort=()=>reject(tx.error||new Error('Lưu tệp bị hủy.'));});
};
BMH.evidenceGet=async id=>{
  const db=await BMH.evidenceDb();
  return new Promise((resolve,reject)=>{const tx=db.transaction('files','readonly'),req=tx.objectStore('files').get(id);req.onsuccess=()=>resolve(req.result?.blob||null);req.onerror=()=>reject(req.error||new Error('Không đọc được tệp.'));});
};
BMH.evidenceRemoveBytes=async id=>{
  const db=await BMH.evidenceDb();
  return new Promise((resolve,reject)=>{const tx=db.transaction('files','readwrite');tx.objectStore('files').delete(id);tx.oncomplete=()=>resolve(true);tx.onerror=()=>reject(tx.error||new Error('Không xóa được tệp.'));});
};
BMH.addEvidenceFiles=async(files,stage)=>{
  const dossier=BMH.state.project.dossier,list=dossier.evidence||[],validStage=BMH.DOSSIER_STAGE_DEFS.some(x=>x.id===stage)?stage:'foundation';let added=0;
  for(const file of [...files].slice(0,12)){
    if(list.length>=30){BMH.toast('Đã đạt giới hạn 30 tệp hiện trường.');break;}
    if(!/^(image\/(jpeg|png|webp)|application\/pdf)$/.test(file.type)||file.size>8*1024*1024){BMH.toast('Chỉ nhận JPG, PNG, WebP hoặc PDF tối đa 8 MB mỗi tệp.');continue;}
    const id=BMH.uid('evidence');
    try{await BMH.evidencePut(id,file);}catch(err){BMH.toast('Không lưu được tệp: '+(err.message||err));break;}
    list.push({id,stage:validStage,name:file.name.slice(0,180),type:file.type,size:file.size,addedAt:new Date().toISOString()});added++;
  }
  if(added&&BMH.state.project.dossier===dossier){dossier.evidence=list;BMH.save();BMH.render({preserveScroll:true});BMH.toast('Đã lưu '+added+' tệp trên trình duyệt này. Tải ZIP hồ sơ để sao lưu.');}
  return added;
};
BMH.openEvidence=async id=>{
  const w=window.open('about:blank','_blank');
  try{
    const blob=await BMH.evidenceGet(id);
    if(!blob)throw new Error('Không còn tệp gốc trên trình duyệt này.');
    const url=URL.createObjectURL(blob);
    if(w)w.location.href=url;else{const a=document.createElement('a');a.href=url;a.download=(BMH.state.project.dossier.evidence||[]).find(x=>x.id===id)?.name||'chung-cu';a.click();}
    setTimeout(()=>URL.revokeObjectURL(url),120000);
  }catch(err){w?.close();BMH.toast(err.message||String(err));}
};
BMH.deleteEvidence=async id=>{
  const list=BMH.state.project.dossier.evidence||[],item=list.find(x=>x.id===id);if(!item)return;
  if(!window.confirm('Xóa tệp '+item.name+' khỏi hồ sơ trên trình duyệt này?'))return;
  try{await BMH.evidenceRemoveBytes(id);}catch(err){BMH.toast(err.message||String(err));return;}
  BMH.state.project.dossier.evidence=list.filter(x=>x.id!==id);BMH.save();BMH.render({preserveScroll:true});
};
BMH.dossierCompleteness = () => {
  const checks=BMH.mepChecklistRows(),mats=BMH.materialSchedule(),s=BMH.state.project.site,d=BMH.state.project.dossier,e=BMH.estimate();
  const parts=[
    {name:'Bản vẽ sơ bộ',ok:e.areaSource==='plan'},
    {name:'Dự toán/BOQ',ok:e.areaSource==='plan'&&e.total>0&&BMH.boqSchedule().length>=10},
    {name:'Vật liệu',ok:mats.filter(x=>x.status==='Đã chọn').length>=3},
    {name:'Tiến độ',ok:!!d?.startDate&&BMH.dossierSchedule().length===7},
    {name:'MEP checklist',ok:checks.some(x=>x.checked)},
    {name:'Vị trí công trình',ok:!!s?.province&&Number.isFinite(Number(s?.lat))&&Number.isFinite(Number(s?.lng))},
    {name:'Ảnh/hồ sơ thực địa',ok:(d?.evidence||[]).length>0}
  ];
  return {parts,done:parts.filter(x=>x.ok).length,total:parts.length,percent:Math.round(parts.filter(x=>x.ok).length/parts.length*100)};
};
BMH.createDossierSnapshot = () => {
  const p=BMH.state.project,e=BMH.estimate(),basis=BMH.dataCostBasis(),area=BMH.areaSchedule(),openings=BMH.openingSchedule(),schedule=BMH.dossierSchedule(),boq=BMH.boqSchedule(),materials=BMH.materialSchedule(),mep=BMH.mepChecklistRows(),cashflow=BMH.cashflowSchedule(),complete=BMH.dossierCompleteness(),now=new Date();
  return {
    schema:'BMH-DOSSIER-5.0',version:BMH.VERSION,generatedAt:now.toISOString(),revision:p.dossier?.revision||'A',
    project:{name:p.name,style:p.style,address:p.site.address||'',province:p.site.province,district:p.site.district,coordinates:[p.site.lat,p.site.lng],lot:`${p.site.width} × ${p.site.depth} m`,floors:p.site.floors,frontDirection:p.site.frontDirection,architect:p.dossier?.architect||'',contractor:p.dossier?.contractor||'',notes:p.dossier?.notes||''},
    summary:{grossArea:e.area,areaSource:e.areaSource,budget:e.budget,estimate:e.total,actualSpent:schedule.reduce((a,x)=>a+x.actualSpent,0),gap:e.gap,progress:p.dossier?.progress||0,currentStage:p.dossier?.currentStage||'foundation',startDate:p.dossier?.startDate,completeness:complete},
    pricing:{source:basis.sourceLabel,date:basis.sourceDate,reference:basis.reference,mode:p.dataEngine?.pricingMode||'regional'},
    areas:area,openings,boq,materials,schedule,cashflow,mep,evidence:(p.dossier?.evidence||[]).map(x=>({...x})),
    drawings:[...Array.from({length:Math.max(1,Number(p.site.floors)||1)},(_,i)=>({code:`A-${String(i+1).padStart(2,'0')}`,name:`Mặt bằng tầng ${i+1}`,file:`mat-bang-tang-${i+1}.svg`})),{code:'A-E01',name:'Mặt đứng chính',file:'mat-dung-chinh.svg'},{code:'A-S01',name:'Mặt cắt A-A',file:'mat-cat-A-A.svg'}],
    disclaimers:['Hồ sơ do web app tạo để lập phương án, dự toán và trao đổi với kiến trúc sư/nhà thầu.','Không thay thế hồ sơ xin phép xây dựng, bản vẽ thi công có thẩm tra, thiết kế kết cấu/MEP hoặc khảo sát địa chất.','Khối lượng BOQ là khối lượng sơ bộ theo mô hình hiện tại; cần bóc tách và xác nhận lại trước khi ký hợp đồng/đặt vật tư.']
  };
};
BMH.dossierTable = (headers,rows) => `<table><thead><tr>${headers.map(x=>`<th>${BMH.esc(x)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(x=>`<td>${BMH.esc(x)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
BMH.dossierPrintHtml = (snap=BMH.createDossierSnapshot(),{mepOnly=false}={}) => {
  const money=n=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(Number(n)||0)+' đ',num=n=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(Number(n)||0),p=snap.project;
  const plans=Array.from({length:Math.max(1,Number(BMH.state.project.site.floors)||1)},(_,i)=>`<section class="page drawing"><h2>Mặt bằng tầng ${i+1}</h2>${BMH.planSvg({interactive:false,floor:i})}</section>`).join('');
  const mepTable=BMH.dossierTable(['#','Hạng mục','Trạng thái','Ghi chú'],snap.mep.map(x=>[x.no,x.name,x.checked?'Đã kiểm tra':'Chưa kiểm tra',x.note||'']));
  const body=mepOnly?`<section class="page"><h1>CHECKLIST MEP</h1><p>${BMH.esc(p.name)} · Rev ${BMH.esc(snap.revision)} · ${BMH.esc(p.district)}, ${BMH.esc(p.province)}</p>${mepTable}<div class="sign"><span>Gia chủ / Đại diện</span><span>Nhà thầu MEP</span><span>Tư vấn/KTS</span></div></section>`:`
    <section class="page cover"><div class="mark">BUILD MY HOME</div><h1>HỒ SƠ XÂY NHÀ TỔNG HỢP</h1><h2>${BMH.esc(p.name)}</h2><p>${BMH.esc([p.address,p.district,p.province].filter(Boolean).join(', '))}</p><div class="meta"><b>Phiên bản ${BMH.esc(snap.version)}</b><b>Revision ${BMH.esc(snap.revision)}</b><b>Ngày xuất ${BMH.dateLabel(snap.generatedAt.slice(0,10))}</b></div><div class="notice">Hồ sơ phối hợp sơ bộ để trao đổi với KTS/KS/nhà thầu; không thay thế hồ sơ pháp lý hoặc bản vẽ thi công được ký duyệt.</div></section>
    <section class="page"><h1>01 · Tổng quan dự án</h1>${BMH.dossierTable(['Nội dung','Giá trị'],[['Phong cách',p.style],['Lô đất',p.lot],['Số tầng',p.floors],['Hướng mặt tiền',p.frontDirection],['Diện tích xây dựng quy đổi',`${num(snap.summary.grossArea)} m²`],['Ngân sách',money(snap.summary.budget)],['Dự toán',money(snap.summary.estimate)],['Đã ghi chi phí thực tế',money(snap.summary.actualSpent)],['Chênh lệch với ngân sách',money(snap.summary.gap)],['KTS',p.architect||'Chưa nhập'],['Nhà thầu',p.contractor||'Chưa nhập'],['Nguồn đơn giá',snap.pricing.source],['Ngày nguồn',snap.pricing.date]])}<h2>Danh mục bản vẽ</h2>${BMH.dossierTable(['Mã','Tên bản vẽ','Tệp'],snap.drawings.map(x=>[x.code,x.name,x.file]))}</section>
    ${plans}<section class="page drawing"><h2>Mặt đứng chính</h2>${BMH.elevationSvg()}</section><section class="page drawing"><h2>Mặt cắt A-A</h2>${BMH.sectionSvg()}</section>
    <section class="page"><h1>02 · Bảng diện tích</h1>${BMH.dossierTable(['Tầng','Không gian','Diện tích m²','Chu vi m','Cửa đi','Cửa sổ'],snap.areas.map(x=>[x.floor,x.name,num(x.area),num(x.perimeter),x.doors,x.windows]))}<h2>Danh sách cửa</h2>${BMH.dossierTable(['Mã','Tầng','Phòng','Loại','Rộng m','Cao m','Hướng'],snap.openings.map(x=>[x.code,x.floor,x.room,x.kind==='door'?'Cửa đi':'Cửa sổ',num(x.width),num(x.height),x.side]))}</section>
    <section class="page"><h1>03 · BOQ / dự toán sơ bộ</h1>${BMH.dossierTable(['Mã','Nhóm','Hạng mục','ĐVT','KL','Đơn giá phân bổ','Thành tiền'],snap.boq.map(x=>[x.code,x.group,x.name,x.unit,num(x.qty),money(x.rate),money(x.amount)]))}<p class="total">TỔNG DỰ TOÁN: ${money(snap.summary.estimate)}</p></section>
    <section class="page"><h1>04 · Vật liệu</h1>${BMH.dossierTable(['Nhóm','Vật liệu','Quy cách','KL','ĐVT','Giá/nguồn','Trạng thái'],snap.materials.map(x=>[x.group,x.name,x.spec,num(x.qty),x.unit,x.price,x.status]))}</section>
    <section class="page"><h1>05 · Dòng tiền & tiến độ</h1>${BMH.dossierTable(['#','Giai đoạn','Bắt đầu','Kết thúc','Tỷ lệ','Số tiền','Tiến độ'],snap.cashflow.map(x=>[x.no,x.stage,BMH.dateLabel(x.start),BMH.dateLabel(x.end),`${x.pct}%`,money(x.amount),`${x.progress}%`]))}</section>
    <section class="page"><h1>06 · Checklist MEP</h1>${mepTable}<h2>Danh mục ảnh/hồ sơ thực địa</h2>${BMH.dossierTable(['Giai đoạn','Tên tệp','Ngày thêm'],(snap.evidence||[]).map(x=>[x.stage,x.name,x.addedAt?.slice(0,10)||'']))}<p>Tệp gốc được đính kèm trong ZIP hồ sơ khi còn lưu trên trình duyệt xuất hồ sơ.</p></section>
    <section class="page"><h1>07 · Ghi chú & xác nhận</h1><p>${BMH.esc(p.notes||'Chưa có ghi chú dự án.')}</p><ul>${snap.disclaimers.map(x=>`<li>${BMH.esc(x)}</li>`).join('')}</ul><div class="sign"><span>Gia chủ / Đại diện</span><span>Kiến trúc sư / Tư vấn</span><span>Nhà thầu</span></div></section>`;
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>BMH Hồ sơ ${BMH.esc(p.name)}</title><style>
    @page{size:A4;margin:12mm}*{box-sizing:border-box}body{font:12px/1.45 Arial,sans-serif;color:#18251d;margin:0;background:#fff}.page{page-break-after:always;min-height:270mm;padding:2mm}.page:last-child{page-break-after:auto}h1{font-size:22px;margin:0 0 14px;color:#365842}h2{font-size:16px;margin:15px 0 8px}.cover{display:flex;flex-direction:column;justify-content:center;text-align:center}.cover h1{font-size:34px}.cover h2{font-size:24px}.mark{letter-spacing:.18em;font-weight:800;color:#56735b}.meta{display:flex;gap:10px;justify-content:center;margin:18px 0}.meta b,.notice{border:1px solid #cdd8d0;border-radius:8px;padding:8px 12px}.notice{max-width:620px;margin:30px auto;background:#f5f8f5}table{width:100%;border-collapse:collapse;margin:8px 0 16px}th,td{border:1px solid #cbd5ce;padding:6px 7px;vertical-align:top}th{background:#eef4ef;text-align:left}.total{font-size:16px;font-weight:800;text-align:right}.drawing svg{width:100%;height:auto;max-height:235mm}.drawing svg text{font-family:Arial,sans-serif!important;fill:#18251d}.drawing svg line,.drawing svg path{vector-effect:non-scaling-stroke}.sign{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:60px}.sign span{text-align:center;border-top:1px solid #777;padding-top:8px}ul{padding-left:20px}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  </style></head><body>${body}</body></html>`;
};
BMH.printDossier = ({mepOnly=false}={}) => {
  if(!BMH.isUnlocked())return BMH.openPaywall();
  const html=BMH.dossierPrintHtml(BMH.createDossierSnapshot(),{mepOnly});
  const fallback=()=>{
    const name=mepOnly?'BMH-MEP-in-luu-PDF.html':'BMH-Ho-so-in-luu-PDF.html';
    BMH.download(name,html,'text/html;charset=utf-8');
    BMH.toast('Trình duyệt chặn cửa sổ in. Đã tải bản hồ sơ in dự phòng.');
  };
  let w=null;try{w=window.open('about:blank','_blank');}catch(_){}
  if(!w)return fallback();
  try{
    w.document.open();w.document.write(html);w.document.close();
    const run=()=>setTimeout(()=>{try{w.focus();w.print();BMH.toast('Hồ sơ đã mở. Chọn “Lưu thành PDF” trong hộp thoại in.');}catch(err){try{w.close();}catch(_){}fallback();}},180);
    if(w.document.readyState==='complete')run();else w.addEventListener('load',run,{once:true});
  }catch(err){
    console.error('Build My Home print dossier error',err);
    try{w.close();}catch(_){}
    fallback();
  }
};
