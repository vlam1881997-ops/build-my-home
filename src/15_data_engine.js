/* Build My Home V4.8 · Real Data Engine
 * Separates live data, official references and planning assumptions.
 * Exact supplier prices are never presented as live unless the user imports a dated quote.
 */
BMH.BUILD_DATE = '2026-09-22';
BMH.climateHistory = null;
BMH.climateHistoryKey = '';

BMH.DATA_SOURCES = [
  {
    id:'open-meteo-current',kind:'weather',status:'live',name:'Open-Meteo Forecast API',authority:'Open-Meteo',date:'Live',
    url:'https://open-meteo.com/en/docs',note:'Thời tiết hiện tại và dự báo theo tọa độ; cần kiểm tra điều khoản sử dụng khi triển khai thương mại.'
  },
  {
    id:'open-meteo-history',kind:'climate',status:'live',name:'Open-Meteo Historical Weather API',authority:'Open-Meteo / ECMWF reanalysis',date:'Theo truy vấn',
    url:'https://open-meteo.com/en/docs/historical-weather-api',note:'Tóm tắt 12 tháng lịch sử gần nhất dùng để kiểm tra chéo hồ sơ khí hậu vùng.'
  },
  {
    id:'bxd-425-2026',kind:'benchmark',status:'official',name:'Quyết định 425/QĐ-BXD',authority:'Bộ Xây dựng',date:'30/03/2026',
    url:'https://moc.gov.vn/vn/Pages/ChiTietVanBan.aspx?TypeVB=1&vID=4906',note:'Công bố suất vốn đầu tư xây dựng và giá xây dựng tổng hợp bộ phận kết cấu công trình năm 2025.'
  },
  {
    id:'bxd-37-2026',kind:'methodology',status:'official',name:'Thông tư 37/2026/TT-BXD',authority:'Bộ Xây dựng',date:'26/06/2026',
    url:'https://moc.gov.vn/vn/tin-tuc/1196/95131/thong-tu-huong-dan-phuong-phap-xac-dinh-dinh-muc-du-toan-va-cac-chi-tieu-kinh-te-ky-thuat.aspx',note:'Phương pháp khảo sát giá vật liệu, xác định giá nhân công, ca máy và chỉ số giá xây dựng.'
  },
  {
    id:'hcm-market-2026-07',kind:'market',status:'official',name:'Tình hình giá cả thị trường 07/2026',authority:'Sở Tài chính TP.HCM',date:'07/2026',
    url:'https://sotaichinh.hochiminhcity.gov.vn/thong-tin-tra-cuu/thong-tin-quy-hoach/gia-thang/tinh-hinh-gia-ca-thi-truong-thang-7-nam-2026.html',note:'Nguồn tham khảo xu hướng thị trường; không tự động thay thế báo giá từng nhà cung cấp.'
  },
  {
    id:'dongnai-material-2026-08',kind:'market',status:'official',name:'Công bố giá VLXD 08/2026',authority:'Sở Xây dựng Đồng Nai',date:'07/09/2026',
    url:'https://sxd.dongnai.gov.vn/vi/news/gia-vlxd-nhan-cong-may-thi-cong/cong-bo-gia-vat-lieu-xay-dung-tren-dia-ban-thanh-pho-dong-nai-thang-8-nam-2026-13763.html',note:'Nguồn địa phương có file công bố đính kèm; dùng để kiểm tra giá đầu vào theo khu vực.'
  }
];

BMH.REGION_COST_FACTORS = {
  'TP. Hồ Chí Minh':1.02,
  'Hà Nội':1.03,
  'Đà Nẵng':1.00,
  'Đồng Nai':.98,
  'Tây Ninh':.95,
  'Cần Thơ':.97
};

BMH.defaultDataEngineState = () => ({
  pricingMode:'regional',
  cost:{shellPerM2:3600000,finishPerM2:2350000,prepPerM2:280000,marketAdjustmentPct:0},
  quote:{name:'',date:'',reference:'',importedAt:null},
  materialOverrides:{},
  lastRefreshAt:null,
  lastImportAt:null,
  lastImportName:'',
  status:{weather:'idle',climate:'idle',pricing:'planning'},
  climateSummary:null,
  snapshots:[]
});

BMH.dateVN = iso => {
  if(!iso)return '—';
  const d=new Date(iso); return Number.isFinite(d.getTime())?d.toLocaleString('vi-VN',{dateStyle:'short',timeStyle:'short'}):String(iso);
};
BMH.dateOnlyVN = iso => {
  if(!iso)return '—';const d=new Date(iso);return Number.isFinite(d.getTime())?d.toLocaleDateString('vi-VN'):String(iso);
};
BMH.sourceById = id => BMH.DATA_SOURCES.find(x=>x.id===id);
BMH.officialSources = () => BMH.DATA_SOURCES.filter(x=>x.status==='official');
BMH.dataEngineState = () => BMH.state?.project?.dataEngine || BMH.defaultDataEngineState();
BMH.regionCostFactor = site => BMH.REGION_COST_FACTORS[site?.province] || 1;

BMH.dataCostBasis = () => {
  const p=BMH.state.project,de=BMH.dataEngineState(),profile=BMH.regionProfile(p.site),cost=de.cost||{},regional=BMH.regionCostFactor(p.site);
  const laborMid=BMH.rangeAverage?.(profile.labor)||500000;
  const laborFactor=BMH.clamp(.92+.08*(laborMid/500000),.94,1.08);
  const market=BMH.clamp(1+(Number(cost.marketAdjustmentPct)||0)/100,.75,1.5);
  const supplier=!!(de.quote?.name&&de.quote?.date);
  const mode=de.pricingMode||'regional';
  const locationFactor=mode==='baseline'?1:regional*laborFactor;
  const shellPerM2=Math.round((Number(cost.shellPerM2)||3600000)*locationFactor*market);
  const finishPerM2=Math.round((Number(cost.finishPerM2)||2350000)*locationFactor*market);
  const prepPerM2=Math.round((Number(cost.prepPerM2)||280000)*locationFactor*market);
  return {
    shellPerM2,finishPerM2,prepPerM2,regionalFactor:regional,laborFactor,marketFactor:market,laborMid,mode,supplier,
    sourceLabel:supplier?`Báo giá nhập: ${de.quote.name}`:'Baseline BMH + hệ số vùng/nhân công',
    sourceDate:supplier?de.quote.date:BMH.BUILD_DATE,
    reference:supplier?(de.quote.reference||'Báo giá do người dùng nhập'):'QĐ 425/QĐ-BXD + TT 37/2026/TT-BXD dùng làm nguồn tham chiếu phương pháp/benchmark'
  };
};

BMH.materialOverride = id => BMH.dataEngineState().materialOverrides?.[id]||null;
BMH.materialPriceLabel = (category,item) => {
  const o=BMH.materialOverride(item?.id);if(!o)return item?.price||'Cần báo giá';
  const val=Number(o.value);return Number.isFinite(val)&&val>0?`${new Intl.NumberFormat('vi-VN').format(Math.round(val))} đ/${BMH.esc(o.unit||'đv')}`:(o.label||item?.price||'Cần báo giá');
};
BMH.materialSourceLabel = item => {
  const o=BMH.materialOverride(item?.id);return o?`${o.source||BMH.dataEngineState().quote?.name||'Báo giá nhập'} · ${o.date||BMH.dataEngineState().quote?.date||'chưa ghi ngày'}`:'Giá hiển thị mẫu · cần xác minh khi mua';
};

BMH.costSnapshot = () => {
  const de=BMH.dataEngineState(),e=BMH.estimate(),b=BMH.dataCostBasis();
  const row={id:BMH.uid('cost'),createdAt:new Date().toISOString(),province:BMH.state.project.site.province,district:BMH.state.project.site.district,total:e.total,area:e.area,shellPerM2:b.shellPerM2,finishPerM2:b.finishPerM2,prepPerM2:b.prepPerM2,sourceLabel:b.sourceLabel,sourceDate:b.sourceDate,marketAdjustmentPct:Number(de.cost?.marketAdjustmentPct)||0};
  de.snapshots=[row,...(de.snapshots||[])].slice(0,12);BMH.save();BMH.render();BMH.toast('Đã chốt snapshot dự toán cùng nguồn và thời điểm.');return row;
};
BMH.resetPricingBaseline = () => {
  const de=BMH.dataEngineState(),fresh=BMH.defaultDataEngineState();de.pricingMode=fresh.pricingMode;de.cost=fresh.cost;de.quote=fresh.quote;de.materialOverrides={};de.status.pricing='planning';BMH.save();BMH.render();BMH.toast('Đã trở về baseline V4.8; các snapshot cũ vẫn được giữ.');
};

BMH.parseCsvLine = line => {
  const out=[];let cur='',quoted=false;for(let i=0;i<line.length;i++){const c=line[i];if(c==='"'){if(quoted&&line[i+1]==='"'){cur+='"';i++;}else quoted=!quoted;}else if(c===','&&!quoted){out.push(cur.trim());cur='';}else cur+=c;}out.push(cur.trim());return out;
};
BMH.importPriceQuote = async file => {
  if(!file)return;const text=await file.text();let payload=null;
  try{if(file.name.toLowerCase().endsWith('.json'))payload=JSON.parse(text);}catch(_){payload=null;}
  if(!payload){
    const lines=text.split(/\r?\n/).filter(x=>x.trim());const rows=lines.map(BMH.parseCsvLine);const head=(rows.shift()||[]).map(x=>x.toLowerCase());payload={materials:{}};
    for(const r of rows){const obj=Object.fromEntries(head.map((h,i)=>[h,r[i]??''])),key=obj.key||obj.id||obj.item,value=Number(String(obj.value||obj.price||'').replace(/[^0-9.-]/g,''));if(!key||!Number.isFinite(value))continue;
      if(['shellperm2','shell_per_m2'].includes(key.toLowerCase()))payload.shellPerM2=value;
      else if(['finishperm2','finish_per_m2'].includes(key.toLowerCase()))payload.finishPerM2=value;
      else if(['prepperm2','prep_per_m2'].includes(key.toLowerCase()))payload.prepPerM2=value;
      else payload.materials[key]={value,unit:obj.unit||'đv',source:obj.source||'',date:obj.date||''};
      payload.source=payload.source||obj.source;payload.date=payload.date||obj.date;payload.reference=payload.reference||obj.reference;
    }
  }
  const de=BMH.dataEngineState(),cost=de.cost||{};
  const shell=Number(payload.shellPerM2??payload.cost?.shellPerM2),finish=Number(payload.finishPerM2??payload.cost?.finishPerM2),prep=Number(payload.prepPerM2??payload.cost?.prepPerM2);
  if(Number.isFinite(shell)&&shell>0)cost.shellPerM2=shell;if(Number.isFinite(finish)&&finish>0)cost.finishPerM2=finish;if(Number.isFinite(prep)&&prep>0)cost.prepPerM2=prep;
  if(Number.isFinite(Number(payload.marketAdjustmentPct)))cost.marketAdjustmentPct=Number(payload.marketAdjustmentPct);
  de.cost=cost;de.quote={name:String(payload.source||payload.supplier||file.name),date:String(payload.date||new Date().toISOString().slice(0,10)),reference:String(payload.reference||''),importedAt:new Date().toISOString()};
  const mats=payload.materials||{};de.materialOverrides={...(de.materialOverrides||{})};for(const [id,v] of Object.entries(mats)){if(v&&Number(v.value)>0)de.materialOverrides[id]={value:Number(v.value),unit:String(v.unit||'đv'),source:String(v.source||de.quote.name),date:String(v.date||de.quote.date)};}
  de.lastImportAt=new Date().toISOString();de.lastImportName=file.name;de.status.pricing='quote';BMH.save();BMH.render();BMH.toast(`Đã nhập báo giá ${file.name}. Dự toán đã gắn nguồn và ngày báo giá.`);
};

BMH.loadClimateHistory = async (force=false) => {
  const s=BMH.state.project.site,key=`${s.lat.toFixed(3)},${s.lng.toFixed(3)}`;
  if(!force&&BMH.climateHistory?.key===key&&Date.now()-(BMH.climateHistory.ts||0)<6*60*60*1000)return BMH.climateHistory;
  BMH.climateHistoryKey=key;const de=BMH.dataEngineState();de.status.climate='syncing';
  const end=new Date();end.setUTCDate(end.getUTCDate()-7);const start=new Date(end);start.setUTCFullYear(start.getUTCFullYear()-1);start.setUTCDate(start.getUTCDate()+1);
  const iso=d=>d.toISOString().slice(0,10),ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),8500);
  try{
    const url=`https://archive-api.open-meteo.com/v1/archive?latitude=${encodeURIComponent(s.lat)}&longitude=${encodeURIComponent(s.lng)}&start_date=${iso(start)}&end_date=${iso(end)}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max&timezone=auto`;
    const res=await fetch(url,{signal:ctl.signal});if(!res.ok)throw new Error('history');const data=await res.json();if(BMH.climateHistoryKey!==key)return null;const d=data.daily||{},max=d.temperature_2m_max||[],min=d.temperature_2m_min||[],rain=d.precipitation_sum||[],wind=d.wind_speed_10m_max||[];
    const nums=a=>a.map(Number).filter(Number.isFinite),mean=a=>{a=nums(a);return a.length?a.reduce((x,y)=>x+y,0)/a.length:NaN;},sum=a=>nums(a).reduce((x,y)=>x+y,0);
    const temps=max.map((v,i)=>(Number(v)+Number(min[i]))/2).filter(Number.isFinite),winds=nums(wind);
    const summary={key,ts:Date.now(),start:iso(start),end:iso(end),days:d.time?.length||0,avgTemp:mean(temps),rainfall:sum(rain),maxWind:winds.length?Math.max(...winds):NaN,source:'Open-Meteo Historical Weather API'};
    BMH.climateHistory=summary;de.climateSummary={...summary};de.status.climate='live';BMH.save();return summary;
  }catch(_){if(BMH.climateHistoryKey!==key)return null;BMH.climateHistory={key,ts:Date.now(),error:true};de.status.climate='fallback';BMH.save();return BMH.climateHistory;}
  finally{clearTimeout(timer);}
};

BMH.refreshRealData = async () => {
  const de=BMH.dataEngineState();de.status.weather='syncing';de.status.climate='syncing';BMH.save();BMH.render();
  await Promise.allSettled([BMH.loadLiveWeather?.(true),BMH.loadClimateHistory(true)]);
  de.lastRefreshAt=new Date().toISOString();BMH.save();BMH.render();BMH.toast('Đã làm mới dữ liệu vị trí/khí hậu. Giá nhà cung cấp vẫn giữ nguyên cho đến khi có báo giá mới.');
};

BMH.dataSourceRows = (limit=6) => BMH.DATA_SOURCES.slice(0,limit).map(s=>`<article class="data-source-row"><span class="source-badge ${s.status}">${s.status==='live'?'LIVE':'OFFICIAL'}</span><div><b>${BMH.esc(s.name)}</b><small>${BMH.esc(s.authority)} · ${BMH.esc(s.date)}</small><em>${BMH.esc(s.note)}</em></div><a href="${BMH.esc(s.url)}" target="_blank" rel="noopener">Mở nguồn ↗</a></article>`).join('');

BMH.siteDataPanel = () => {
  const de=BMH.dataEngineState(),h=BMH.climateHistory?.error?de.climateSummary:(BMH.climateHistory||de.climateSummary),weather=BMH.liveWeather&&!BMH.liveWeather.error?'live':de.status.weather;
  const hist=h&&!h.error&&Number.isFinite(Number(h.avgTemp));
  return `<section class="card real-data-site"><div class="between">${BMH.cardTitle('Real Data Engine 4.8','Tách rõ dữ liệu trực tuyến, dữ liệu lịch sử và dữ liệu vùng fallback để không đánh đồng tất cả là “live”.')}<button class="clay" data-data-refresh>↻ Làm mới dữ liệu</button></div><div class="data-health-grid"><article><small>Thời tiết tức thời</small><b class="data-state ${weather==='live'?'ok':'mid'}">${weather==='live'?'LIVE':'FALLBACK'}</b><span>Open-Meteo theo tọa độ</span></article><article><small>Khí hậu 12 tháng</small><b class="data-state ${hist?'ok':'mid'}">${hist?'ĐÃ ĐỐI CHIẾU':'ĐANG NẠP'}</b><span>${hist?`${BMH.num(h.avgTemp,1)}°C TB · ${BMH.num(h.rainfall,0)} mm mưa`:'Hồ sơ vùng vẫn hoạt động khi offline'}</span></article><article><small>Nguồn chi phí</small><b class="data-state official">OFFICIAL REF</b><span>BXD + nguồn địa phương</span></article><article><small>Lần đồng bộ</small><b>${de.lastRefreshAt?BMH.dateVN(de.lastRefreshAt):'Chưa đồng bộ thủ công'}</b><span>Không xóa dữ liệu dự án khi lỗi mạng</span></article></div>${hist?`<div class="climate-history-strip"><span><small>Khoảng dữ liệu</small><b>${BMH.dateOnlyVN(h.start)} → ${BMH.dateOnlyVN(h.end)}</b></span><span><small>Số ngày</small><b>${h.days}</b></span><span><small>Nhiệt độ TB</small><b>${BMH.num(h.avgTemp,1)}°C</b></span><span><small>Tổng mưa</small><b>${BMH.num(h.rainfall,0)} mm</b></span><span><small>Gió cực đại ngày</small><b>${BMH.num(h.maxWind,0)} km/h</b></span></div>`:''}</section>`;
};

BMH.realDataPanel = () => {
  const de=BMH.dataEngineState(),b=BMH.dataCostBasis(),snaps=(de.snapshots||[]).slice(0,3);
  return `<section class="card real-data-pricing"><div class="between">${BMH.cardTitle('Real Data Engine 4.8 · Giá & nguồn','Đơn giá dự toán có nguồn gốc, ngày cập nhật và khả năng nhập báo giá thật thay vì để số cố định nằm ẩn trong code.')}<div class="data-actions"><button class="secondary" data-data-refresh>↻ Đồng bộ khí hậu</button><button class="secondary" data-price-import>⇧ Nhập báo giá</button><button class="clay" data-cost-snapshot>◎ Chốt snapshot</button></div></div><div class="price-basis-grid"><div>${BMH.field('Baseline phần thô','project.dataEngine.cost.shellPerM2',{step:50000,scale:1000000,suffix:'triệu/m²',hint:'Có thể thay bằng báo giá thực tế.'})}</div><div>${BMH.field('Baseline hoàn thiện','project.dataEngine.cost.finishPerM2',{step:50000,scale:1000000,suffix:'triệu/m²'})}</div><div>${BMH.field('Chuẩn bị công trường','project.dataEngine.cost.prepPerM2',{step:10000,scale:1000000,suffix:'triệu/m²'})}</div><div>${BMH.field('Điều chỉnh thị trường','project.dataEngine.cost.marketAdjustmentPct',{min:-25,max:50,step:.1,suffix:'%'})}</div></div><div class="price-basis-summary"><article><small>Đơn giá đang áp dụng · thô</small><b>${BMH.money(b.shellPerM2)}/m²</b><span>Hệ số vùng ${BMH.num(b.regionalFactor,2)} · nhân công ${BMH.num(b.laborFactor,2)}</span></article><article><small>Đơn giá đang áp dụng · hoàn thiện</small><b>${BMH.money(b.finishPerM2)}/m²</b><span>${BMH.esc(b.sourceLabel)}</span></article><article><small>Ngày nguồn</small><b>${BMH.esc(b.sourceDate||'—')}</b><span>${de.quote?.reference?BMH.esc(de.quote.reference):'Baseline lập kế hoạch; cần báo giá trước khi ký hợp đồng.'}</span></article><article><small>Trạng thái giá</small><b class="data-state ${b.supplier?'ok':'mid'}">${b.supplier?'BÁO GIÁ NHẬP':'PLANNING'}</b><span>${de.lastImportName?BMH.esc(de.lastImportName):'Chưa nhập báo giá nhà cung cấp'}</span></article></div><div class="data-source-list">${BMH.dataSourceRows()}</div>${snaps.length?`<div class="snapshot-mini"><b>Snapshot gần nhất</b>${snaps.map(x=>`<span><em>${BMH.dateVN(x.createdAt)}</em><strong>${BMH.money(x.total)}</strong><small>${BMH.esc(x.province)} · ${BMH.esc(x.sourceLabel)}</small></span>`).join('')}</div>`:''}<div class="data-engine-note"><b>Nguyên tắc V4.8:</b> nguồn nhà nước dùng để tham chiếu/phương pháp; giá mua thực tế chỉ được coi là báo giá khi có file hoặc nguồn người dùng nhập. <button data-price-reset>Trở về baseline</button></div></section>`;
};

BMH.estimateDataStrip = () => {
  const de=BMH.dataEngineState(),b=BMH.dataCostBasis(),latest=de.snapshots?.[0];
  return `<div class="estimate-source-strip"><div><small>Cơ sở đơn giá</small><b>${BMH.esc(b.sourceLabel)}</b><span>${BMH.esc(b.reference)}</span></div><div><small>Phần thô / m²</small><b>${BMH.money(b.shellPerM2)}</b><span>Hoàn thiện ${BMH.money(b.finishPerM2)}/m²</span></div><div><small>Ngày nguồn</small><b>${BMH.esc(b.sourceDate||'—')}</b><span>${de.lastRefreshAt?`Khí hậu sync ${BMH.dateVN(de.lastRefreshAt)}`:'Chưa sync thủ công'}</span></div><div><small>Snapshot</small><b>${latest?BMH.dateVN(latest.createdAt):'Chưa chốt'}</b><span>${latest?BMH.money(latest.total):'Nên chốt trước khi gửi KTS/nhà thầu'}</span></div><button class="secondary" data-cost-snapshot>Chốt snapshot</button></div>`;
};

BMH.realDataExport = () => ({
  generatedAt:new Date().toISOString(),buildDate:BMH.BUILD_DATE,site:{province:BMH.state.project.site.province,district:BMH.state.project.site.district,lat:BMH.state.project.site.lat,lng:BMH.state.project.site.lng},
  config:BMH.dataEngineState(),costBasis:BMH.dataCostBasis(),liveWeather:BMH.liveWeather||null,climateHistory:BMH.climateHistory||BMH.dataEngineState().climateSummary||null,sources:BMH.DATA_SOURCES
});
