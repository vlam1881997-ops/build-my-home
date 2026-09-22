'use strict';
(()=>{
  const Core17=globalThis.BMHCore;
  if(!Core17||typeof state==='undefined'||!Array.isArray(screens)) return;

  const SUITE_VERSION='1.7.0';
  const STORE_KEY='bmh-project-store-v17';
  const SUITE_KEYS=['bank','ownerGender','cookBirth','cookGender','materialChoices','sceneTheme','aiReview','roomGrid','projectRevision','lastUpdated'];
  const defaultSuite={bank:'vcb',ownerGender:'Nam',cookBirth:1990,cookGender:'Nữ',materialChoices:{floor:'floor-standard',paint:'paint-standard',door:'door-standard'},sceneTheme:'day',aiReview:null,roomGrid:.1,projectRevision:1,lastUpdated:new Date().toISOString()};
  Object.assign(defaults,defaultSuite);

  const banks=[
    {id:'vcb',name:'Vietcombank',short:'VCB',intro:6.9,float:10.9,note:'Kịch bản minh họa'},
    {id:'bidv',name:'BIDV',short:'BIDV',intro:7.2,float:11.0,note:'Kịch bản minh họa'},
    {id:'vtb',name:'VietinBank',short:'VTB',intro:7.0,float:10.8,note:'Kịch bản minh họa'},
    {id:'agr',name:'Agribank',short:'AGR',intro:7.1,float:10.7,note:'Kịch bản minh họa'},
    {id:'tcb',name:'Techcombank',short:'TCB',intro:7.5,float:11.5,note:'Kịch bản minh họa'},
    {id:'acb',name:'ACB',short:'ACB',intro:7.4,float:11.2,note:'Kịch bản minh họa'},
    {id:'mb',name:'MB Bank',short:'MB',intro:7.0,float:11.0,note:'Kịch bản minh họa'}
  ];
  const catalog={
    floor:[
      {id:'floor-economy',name:'Gạch porcelain cơ bản',brand:'Danh mục mẫu',level:0,unit:'m²',price:285000,life:'15–20 năm',care:'Trung bình',look:'Tối giản'},
      {id:'floor-standard',name:'Gạch granite tiêu chuẩn',brand:'Danh mục mẫu',level:1,unit:'m²',price:350000,life:'20–30 năm',care:'Thấp',look:'Hiện đại'},
      {id:'floor-premium',name:'Gạch cao cấp khổ lớn',brand:'Danh mục mẫu',level:2,unit:'m²',price:650000,life:'25–35 năm',care:'Rất thấp',look:'Sang trọng'}
    ],
    paint:[
      {id:'paint-economy',name:'Sơn nội ngoại thất cơ bản',brand:'Danh mục mẫu',level:0,unit:'m²',price:56000,life:'4–6 năm',care:'Trung bình',look:'Cơ bản'},
      {id:'paint-standard',name:'Sơn chống bám bẩn',brand:'Danh mục mẫu',level:1,unit:'m²',price:75000,life:'6–8 năm',care:'Thấp',look:'Mịn'},
      {id:'paint-premium',name:'Sơn ngoại thất bền màu',brand:'Danh mục mẫu',level:2,unit:'m²',price:118000,life:'8–10 năm',care:'Thấp',look:'Cao cấp'}
    ],
    door:[
      {id:'door-economy',name:'Cửa hoàn thiện cơ bản',brand:'Danh mục mẫu',level:0,unit:'m²',price:1450000,life:'10–15 năm',care:'Trung bình',look:'Gọn'},
      {id:'door-standard',name:'Cửa tiêu chuẩn cách âm',brand:'Danh mục mẫu',level:1,unit:'m²',price:1800000,life:'15–20 năm',care:'Thấp',look:'Hiện đại'},
      {id:'door-premium',name:'Cửa nâng cấp hoàn thiện cao',brand:'Danh mục mẫu',level:2,unit:'m²',price:2650000,life:'20–25 năm',care:'Thấp',look:'Tinh tế'}
    ]
  };
  const roomTemplates=[
    {id:'living',name:'Phòng khách',type:'living',w:4,h:4},
    {id:'kitchen',name:'Bếp + ăn',type:'kitchen',w:4,h:3.5},
    {id:'master',name:'Phòng ngủ master',type:'bed',w:4,h:4},
    {id:'bed',name:'Phòng ngủ',type:'bed',w:3.2,h:3.6},
    {id:'bath',name:'WC',type:'bath',w:1.8,h:2.2},
    {id:'stairs',name:'Cầu thang',type:'stairs',w:2,h:3.6}
  ];

  function clone(v){return structuredClone(v);}
  function storeRead(){
    try{
      const raw=localStorage.getItem(STORE_KEY); if(!raw)return null;
      const box=JSON.parse(raw); if(box?.schema!==17||!box.project)return null;
      return box;
    }catch{return null;}
  }
  function storeWrite(project,reason='save'){
    try{
      const box={schema:17,suiteVersion:SUITE_VERSION,reason,updatedAt:new Date().toISOString(),snapshotId:null,project:clone(project)};
      try{box.snapshotId=Core17.buildSnapshot(project).id;}catch{}
      localStorage.setItem(STORE_KEY,JSON.stringify(box));
      return box;
    }catch{return null;}
  }
  function storePatch(patch,reason='patch'){
    const before=clone(state);
    try{
      Object.assign(state,typeof patch==='function'?patch(clone(state)):patch);
      Core17.buildSnapshot(state);
      state.projectRevision=(Number(state.projectRevision)||0)+1;
      state.lastUpdated=new Date().toISOString();
      save(); render();
      document.dispatchEvent(new CustomEvent('bmh:project-change',{detail:{reason,revision:state.projectRevision}}));
      return true;
    }catch(err){state=before;toast('Không áp dụng thay đổi: '+err.message);return false;}
  }
  globalThis.BMHStore={version:SUITE_VERSION,read:storeRead,write:storeWrite,patch:storePatch,getState:()=>clone(state),getSnapshot:()=>snapshot()};

  const savedBox=storeRead();
  if(savedBox?.project){
    try{const candidate={...state,...savedBox.project};Core17.buildSnapshot(candidate);state=candidate;}catch{}
  }
  state={...defaultSuite,...state,materialChoices:{...defaultSuite.materialChoices,...(state.materialChoices||{})}};

  const prevValidateSuite=validateProject;
  validateProject=function(input){
    const base=prevValidateSuite(input);
    for(const k of SUITE_KEYS) if(input?.[k]!==undefined) base[k]=clone(input[k]);
    if(input?.checks&&typeof input.checks==='object'){
      base.checks={...base.checks};
      for(const [k,v] of Object.entries(input.checks)) if(/^[A-Za-z0-9_-]{1,60}$/.test(k)&&typeof v==='boolean') base.checks[k]=v;
    }
    return {...defaultSuite,...base,materialChoices:{...defaultSuite.materialChoices,...(base.materialChoices||{})}};
  };

  const prevSaveSuite=save;
  save=function(){
    const ok=prevSaveSuite();
    if(ok){state.lastUpdated=new Date().toISOString();storeWrite(state,'legacy-save');}
    return ok;
  };

  names.splice(0,names.length,
    'Khởi tạo','Hồ sơ tài chính & DTI','Vị trí & khí hậu vùng','Đất, địa chất & phong thủy','Bản vẽ thiết kế','Gói vật liệu','Mô phỏng 3D & đánh giá AI','Dự toán & thanh toán','Giám sát thi công & checklist MEP','Hồ sơ bàn giao & giải ngân'
  );
  subtitles.splice(0,subtitles.length,
    'Chọn đúng điểm bắt đầu để hệ thống dẫn bạn đi theo luồng phù hợp.',
    'Mô phỏng khả năng chi trả, khoản vay và dòng tiền trước khi quyết định.',
    'Ghi nhận bối cảnh khu đất, khí hậu tham khảo và điều kiện tiếp cận công trình.',
    'Kết hợp kích thước đất, hiện trạng nền và nhu cầu nhiều thế hệ trong gia đình.',
    'Chỉnh trực tiếp phòng, tầng, kích thước; khối lượng và dự toán cập nhật theo.',
    'So sánh gói hoàn thiện, vật liệu và nguồn giá trong cùng một dự toán.',
    'Xem mô hình khối 3D, vòng đời và nhận xét dựa trên dữ liệu của chính phương án.',
    'Một bảng dự toán duy nhất lấy từ mặt bằng, vật liệu, tài chính và tiến độ hiện tại.',
    'Theo dõi tiến độ, checklist MEP và các khoản chi thực tế của dự án.',
    'Xuất hồ sơ nhất quán để trao đổi với kiến trúc sư, nhà thầu và gia đình.'
  );

  function pct(v,max=100){return Math.max(0,Math.min(max,Number(v)||0));}
  function moneyShort(v){const n=Number(v)||0;return n>=1e9?`${num(n/1e9)} tỷ`:n>=1e6?`${num(n/1e6)} triệu`:money(n);}
  function scoreClass(v){return v>=80?'good':v>=60?'mid':'risk';}
  function climateProfile(){
    const loc=(state.location||'').toLowerCase();
    if(loc.includes('đà nẵng')||loc.includes('da nang')) return {temp:'26–28°C',dry:'Tháng 2–8',rain:'Mưa tập trung cuối năm',flood:'Thấp–Trung bình',storm:'Trung bình–Cao',salt:state.environment==='Ven biển'?'Cao':'Trung bình',sun:'Tây và Tây Nam cần che nắng',source:'Hồ sơ khí hậu tham khảo tích hợp; chưa phải dữ liệu thời tiết trực tiếp'};
    if(loc.includes('hồ chí minh')||loc.includes('ho chi minh')) return {temp:'27–29°C',dry:'Tháng 12–4',rain:'Mưa nhiều Tháng 5–11',flood:'Trung bình',storm:'Thấp–Trung bình',salt:'Thấp',sun:'Nắng chiều Tây mạnh',source:'Hồ sơ khí hậu tham khảo tích hợp; chưa phải dữ liệu thời tiết trực tiếp'};
    const coastal=state.environment==='Ven biển';
    return {temp:'Theo dữ liệu địa phương',dry:'Cần xác minh',rain:'Cần xác minh',flood:state.environment==='Vùng trũng'?'Cao':'Chưa xác minh',storm:coastal?'Trung bình–Cao':'Chưa xác minh',salt:coastal?'Cao':'Thấp–Trung bình',sun:'Ưu tiên kiểm tra hướng Tây',source:'Hồ sơ quy tắc theo môi trường người dùng nhập; cần nguồn khí hậu địa phương'};
  }
  function accessFactor(){const r=Number(state.road)||0;return r<2.5?20:r<3?15:r<5?10:r<7?5:0;}
  function rootDigit(n){let x=Math.abs(Math.trunc(n));while(x>9)x=String(x).split('').reduce((a,b)=>a+Number(b),0);return x||9;}
  function kua(year,gender){
    const y=Number(year); if(!Number.isInteger(y)||y<1900||y>2100)return null;
    const sum=rootDigit(y); let k;
    if(gender==='Nữ') k=rootDigit(sum+(y>=2000?6:5)); else k=(y>=2000?9:10)-sum;
    k=rootDigit(k); if(k===5)k=gender==='Nữ'?8:2;
    const east=[1,3,4,9].includes(k);
    const dirs={1:['Đông Nam','Đông','Nam','Bắc'],2:['Đông Bắc','Tây','Tây Bắc','Tây Nam'],3:['Nam','Bắc','Đông Nam','Đông'],4:['Bắc','Nam','Đông','Đông Nam'],6:['Tây','Đông Bắc','Tây Nam','Tây Bắc'],7:['Tây Bắc','Tây Nam','Đông Bắc','Tây'],8:['Tây Nam','Tây Bắc','Tây','Đông Bắc'],9:['Đông','Đông Nam','Bắc','Nam']};
    return {number:k,group:east?'Đông tứ mệnh':'Tây tứ mệnh',dirs:dirs[k]||[]};
  }
  function suiteField(label,key,opts={}){return field(label,key,opts);}
  function gauge(value,label){const v=pct(value);return `<div class="suite-gauge" style="--p:${v*3.6}deg"><div><strong>${num(v)}%</strong><small>${esc(label)}</small></div></div>`;}
  function sectionTitle(iconName,title,sub=''){return `<div class="suite-title"><span class="suite-title-icon">${icon(iconName)}</span><div><h2>${title}</h2>${sub?`<p>${sub}</p>`:''}</div></div>`;}
  function heroStrip(text){return `<div class="suite-banner"><img src="assets/house.jpg" alt="Nhà hiện đại tham khảo"><div class="suite-banner-copy">${text}</div></div>`;}

  function step1(c){return `${heroStrip(`<span>BƯỚC 1 TRONG 10</span><h2>Khởi tạo <b>dự án mới</b></h2><p>Cho hệ thống biết bạn đang có gì để đi đúng luồng từ đầu.</p>`)}<div class="suite-flow-grid">${[
    ['image','Luồng A','Tôi đã có ảnh nhà mẫu ưng ý','Tải ảnh tham khảo phong cách; mặt bằng bên trong vẫn chỉnh độc lập.','Tải ảnh lên','photo'],
    ['upload','Luồng B','Tôi đã có file bản vẽ (ảnh / PDF)','Đưa bản vẽ vào để đối chiếu khi nhập phòng, tầng và kích thước.','Tải bản vẽ','plan'],
    ['plan','Luồng C','Tôi chưa có gì, cần gợi ý từ đầu','Bắt đầu bằng tài chính, khu đất, nhu cầu gia đình rồi dựng mặt bằng.','Bắt đầu tư vấn','suggest']
  ].map(([ic,tag,title,copy,cta,val])=>`<article class="suite-flow-card"><span class="suite-flow-tag">${tag}</span><div class="suite-illus">${icon(ic)}</div><h3>${title}</h3><p>${copy}</p><button class="suite-cta" data-action="start" data-value="${val}">${cta}${icon('arrow')}</button></article>`).join('')}</div><section class="suite-benefits"><div>${icon('file')}<b>Kế hoạch rõ ràng</b><span>Lộ trình 10 bước có thể quay lại bất kỳ lúc nào.</span></div><div>${icon('wallet')}<b>Kiểm soát chi phí</b><span>Mặt bằng, vật liệu và tài chính dùng chung dữ liệu.</span></div><div>${icon('cube')}<b>Mô hình hóa</b><span>Khối lượng và 3D cập nhật từ cùng mặt bằng.</span></div><div>${icon('save')}<b>Tự động lưu</b><span>Dữ liệu được lưu cục bộ và có bản sao JSON.</span></div></section>`;}

  function step2(c){
    const selected=banks.find(b=>b.id===state.bank)||banks[0];
    const dti=c.dt===null?0:c.dt;
    const after=Math.max(0,(state.income-state.living-state.debt)*1e6-c.snapshot.peakPayment);
    return `${heroStrip(`<span>BƯỚC 2 TRONG 10</span><h2>Hồ sơ tài chính <b>& DTI</b></h2><p>Đánh giá khả năng chi trả bằng cùng dòng tiền dùng cho tiến độ xây dựng.</p>`)}<div class="suite-finance-layout"><div class="stack"><section class="card suite-card">${sectionTitle('wallet','1. Thông tin tài chính cá nhân','Các con số được lưu tự động trên thiết bị.')}<div class="fields">${suiteField('Số tiền hiện có · triệu đồng','cash')}${suiteField('Thu nhập hàng tháng · triệu đồng','income')}${suiteField('Chi phí cố định hàng tháng · triệu đồng','living')}${suiteField('Quỹ dự phòng · triệu đồng','reserve')}</div></section><section class="card suite-card">${sectionTitle('chart','2. Kịch bản khoản vay','Các mức lãi bên dưới chỉ là kịch bản để so sánh, không phải báo giá ngân hàng.')}<div class="suite-bank-row">${banks.map(b=>`<button class="suite-bank ${state.bank===b.id?'active':''}" data-suite="select-bank" data-id="${b.id}"><b>${b.short}</b><span>${b.name}</span></button>`).join('')}</div><div class="fields">${suiteField('Số tiền vay · triệu đồng','loan')}${suiteField('Thời hạn vay · năm','years',{min:1,max:40})}${suiteField('Lãi suất ưu đãi · %/năm','rate',{step:.1,max:50})}${suiteField('Lãi suất thả nổi · %/năm','postRate',{step:.1,max:50})}</div><div class="suite-bank-apply"><span>Đang chọn <b>${selected.name}</b>: ${selected.intro}% → ${selected.float}%/năm</span><button class="small" data-suite="apply-bank" data-id="${selected.id}">Áp kịch bản này</button></div></section></div><aside class="stack"><section class="card suite-card suite-finance-summary"><h2>Bức tranh dòng tiền</h2><div class="suite-money-row"><div><span>Khoản trả tháng đầu</span><strong>${money(c.first)}</strong></div><div><span>Sau giai đoạn ưu đãi</span><strong>${money(c.post)}</strong></div></div><div class="suite-dti">${gauge(dti,'DTI mô phỏng')}<div><b class="${scoreClass(100-dti)}">${dti<=35?'Trong vùng thận trọng':'Cần xem lại'}</b><p>DTI ở đây dùng khoản trả cao nhất trong kịch bản + nợ hiện hữu chia thu nhập. Không phải tiêu chí phê duyệt của ngân hàng.</p></div></div><div class="statline"><span>Còn lại sau chi phí & khoản trả cao nhất</span><b>${money(after)}</b></div><div class="statline"><span>Vốn khả dụng xây nhà</span><b>${money(c.budget)}</b></div><button data-action="loanCsv">${icon('download')}Tải lịch trả nợ CSV</button></section><section class="card suite-card"><h3>Liên kết dữ liệu</h3><div class="suite-link-flow"><span>Tài chính</span><i>→</i><span>Dự toán</span><i>→</i><span>Tiến độ</span><i>→</i><span>Dòng tiền</span></div><p class="hint">Sửa khoản vay hoặc thu nhập sẽ cập nhật lại DTI, lịch trả nợ và dòng tiền thi công ngay.</p></section></aside></div>`;
  }

  function step3(){const p=climateProfile(),factor=accessFactor();return `${heroStrip(`<span>BƯỚC 3 TRONG 10</span><h2>Vị trí <b>& khí hậu vùng</b></h2><p>Ghi nhận địa điểm, đường tiếp cận và các rủi ro cần xác minh trước khi chốt thiết kế.</p>`)}<div class="suite-location-layout"><section class="card suite-card">${sectionTitle('pin','Tìm kiếm vị trí','Chưa kết nối bản đồ trực tiếp; đây là hồ sơ vị trí do người dùng nhập.')}<div class="stack">${suiteField('Tỉnh / Thành phố','location',{type:'text'})}${suiteField('Môi trường xung quanh','environment',{options:['Đô thị','Ven biển','Nông thôn','Vùng trũng','Miền núi']})}${suiteField('Chiều rộng đường tiếp cận · m','road',{min:.5,max:40,step:.5})}${suiteField('Hướng mặt tiền','direction',{options:['Bắc','Đông Bắc','Đông','Đông Nam','Nam','Tây Nam','Tây','Tây Bắc']})}</div></section><section class="card suite-map-card"><div class="suite-map"><span class="map-city">${esc(state.location)}</span><i class="pin p1"></i><i class="pin p2"></i><i class="pin p3"></i><div class="map-road r1"></div><div class="map-road r2"></div><div class="map-water"></div></div><div class="suite-map-caption"><b>Bản đồ minh họa vị trí</b><span>Để đưa bản đồ thật vào sản phẩm cần kết nối nhà cung cấp bản đồ/geocoding.</span></div></section><aside class="card suite-card">${sectionTitle('sun','Thông tin khu vực')}<div class="suite-kv"><span>Nhiệt độ tham khảo</span><b>${p.temp}</b></div><div class="suite-kv"><span>Mùa khô</span><b>${p.dry}</b></div><div class="suite-kv"><span>Mưa</span><b>${p.rain}</b></div><div class="suite-kv"><span>Rủi ro ngập</span><b>${p.flood}</b></div><div class="suite-kv"><span>Rủi ro bão</span><b>${p.storm}</b></div><div class="suite-kv"><span>Ăn mòn muối</span><b>${p.salt}</b></div><div class="suite-kv accent"><span>Hệ số tiếp cận cần dự phòng</span><b>+${factor}%</b></div><p class="hint">${p.source}. Hệ số tiếp cận chỉ là cảnh báo kế hoạch, chưa tự cộng vào đơn giá có nguồn.</p></aside></div><section class="suite-region-cards"><article><b>Che nắng</b><span>${p.sun}</span></article><article><b>Thông gió</b><span>Ưu tiên thông gió chéo, kiểm tra hướng gió tại khu đất.</span></article><article><b>Chống thấm</b><span>Ban công, WC và mái cần chi tiết thoát nước rõ ràng.</span></article><article><b>Vật liệu</b><span>${p.salt==='Cao'?'Ưu tiên cấu kiện/phụ kiện chịu môi trường muối.':'Chọn theo báo giá và điều kiện bảo trì thực tế.'}</span></article></section>`;}

  function step4(){const owner=kua(state.birth,state.ownerGender),cook=kua(state.cookBirth,state.cookGender);const ownerDirs=owner?.dirs||[];return `${heroStrip(`<span>BƯỚC 4 TRONG 10</span><h2>Đất, địa chất <b>& phong thủy gia đình</b></h2><p>Đưa nhu cầu nhiều thế hệ vào cùng một hồ sơ trước khi bố trí mặt bằng.</p>`)}<div class="suite-site-grid"><section class="card suite-card">${sectionTitle('plan','Thông số lô đất')}<div class="fields">${suiteField('Mặt tiền · m','width',{min:3,max:30,step:.1})}${suiteField('Chiều sâu · m','depth',{min:5,max:60,step:.1})}${suiteField('Số tầng dự kiến','floors',{min:1,max:5})}${suiteField('Số người sinh sống','people',{min:1,max:20})}</div><div class="suite-land-shape"><div><b>${num(state.width*state.depth)} m²</b><span>Diện tích đất</span></div><svg viewBox="0 0 140 90" aria-label="Hình lô đất"><rect x="20" y="10" width="100" height="70" rx="3" fill="#edf2e8" stroke="#526848" stroke-width="2"/><text x="70" y="49" text-anchor="middle">${num(state.width)} × ${num(state.depth)} m</text></svg></div></section><section class="card suite-card">${sectionTitle('layers','Địa chất & tiếp cận công trình')}<div class="stack">${suiteField('Thông tin nền đất','soil',{options:['Chưa biết','Có hồ sơ khảo sát','Đất từng san lấp','Gần sông / ao hồ','Thông tin khác']})}${suiteField('Chiều rộng đường vào · m','road',{min:.5,max:40,step:.5})}</div><div class="notice ${state.soil==='Có hồ sơ khảo sát'?'green':''}">${state.soil==='Có hồ sơ khảo sát'?'Đã ghi nhận có hồ sơ khảo sát; vẫn cần nhập/đối chiếu thông số kỹ thuật.':'Chưa có dữ liệu đủ để chọn móng hoặc kết luận địa chất. Cần khảo sát chuyên môn.'}</div><div class="suite-kv accent"><span>Dự phòng logistics theo đường vào</span><b>+${accessFactor()}%</b></div></section><section class="card suite-card">${sectionTitle('home','Phong thủy gia đình','Công cụ tham khảo văn hóa theo Bát trạch; năm sinh quanh Tết âm lịch cần xác minh lại năm dùng để tính.')}<div class="fields">${suiteField('Năm sinh gia chủ','birth',{min:1900,max:2100})}${suiteField('Giới tính gia chủ','ownerGender',{options:['Nam','Nữ']})}${suiteField('Năm sinh người nấu chính','cookBirth',{min:1900,max:2100})}${suiteField('Giới tính người nấu chính','cookGender',{options:['Nam','Nữ']})}</div><div class="suite-household"><div><span>Gia chủ</span><b>${owner?`Cung ${owner.number} · ${owner.group}`:'Chưa đủ dữ liệu'}</b></div><div><span>Người nấu chính</span><b>${cook?`Cung ${cook.number} · ${cook.group}`:'Chưa đủ dữ liệu'}</b></div></div><div class="suite-direction-list"><b>Hướng tốt tham khảo cho gia chủ</b>${ownerDirs.length?ownerDirs.map((d,i)=>`<span class="${state.direction===d?'active':''}">${['Sinh Khí','Thiên Y','Diên Niên','Phục Vị'][i]} · ${d}</span>`).join(''):'<span>Chưa tính được</span>'}</div><p class="hint">Không dùng kết quả phong thủy thay cho tiêu chuẩn công năng, kết cấu, PCCC, chiếu sáng hoặc thông gió.</p></section></div><section class="suite-family-strip"><label>${toggle('Có người lớn tuổi','elder')}</label><label>${toggle('Có trẻ nhỏ','kids')}</label><div><b>Ưu tiên bố trí</b><span>${state.elder?'Phòng ngủ thuận tiện tầng trệt; ':''}${state.kids?'khu sinh hoạt an toàn cho trẻ; ':''}lối đi và thông gió theo công năng thực tế.</span></div></section>`;}

  const basePlanSuite=planSvg;
  planSvg=function(interactive=true,floor=state.floor){
    let svg=basePlanSuite(interactive,floor);
    if(!interactive)return svg;
    const r=state.rooms.find(x=>x.id===state.selected&&x.floor===floor);
    if(!r)return svg;
    const x=(r.x+r.w)*30,y=(r.y+r.h)*30;
    const handle=`<g class="resize-handle" data-room="${esc(r.id)}" aria-label="Kéo để đổi kích thước"><rect x="${x-6}" y="${y-6}" width="12" height="12" rx="2" fill="#fff" stroke="#b6795f" stroke-width="2"/><path d="M${x-3} ${y+3}L${x+3} ${y-3}" stroke="#b6795f" stroke-width="1.4"/></g>`;
    return svg.replace('</svg>',handle+'</svg>');
  };

  const baseEditorSuite=editor;
  editor=function(c){
    const g=c.snapshot.geometry;
    return `<div class="suite-design-toolbar"><div class="suite-room-templates">${roomTemplates.map(t=>`<button data-suite="room-template" data-id="${t.id}">${icon(t.type==='stairs'?'layers':t.type==='bath'?'check':t.type==='kitchen'?'home':'plan')}<span>${t.name}</span></button>`).join('')}</div><div class="suite-floor-actions"><button class="small" data-suite="add-floor">${icon('plus')}Thêm tầng</button><button class="small" data-suite="remove-floor" ${state.floors<=1?'disabled':''}>Giảm tầng</button></div></div>${baseEditorSuite(c)}<section class="suite-takeoff"><div><span>Diện tích hợp</span><b>${num(g.floorArea)} m²</b></div><div><span>Chiều dài tường</span><b>${num(g.wallLength)} m</b></div><div><span>Diện tích tường</span><b>${num(g.wallArea)} m²</b></div><div><span>Sơn 2 mặt</span><b>${num(g.paintArea)} m²</b></div><div><span>Cửa đi</span><b>${num(g.doorArea)} m²</b></div><div><span>Cửa sổ</span><b>${num(g.windowArea)} m²</b></div></section>`;
  };

  bindDrag=function(){
    const svg=document.querySelector('#plan'); if(!svg)return; let drag=null;
    const point=e=>new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());
    svg.addEventListener('pointerdown',e=>{
      const handle=e.target.closest('.resize-handle'),g=e.target.closest('[data-room]'); if(!g)return;
      const r=state.rooms.find(x=>x.id===g.dataset.room); if(!r)return;
      history(); const p=point(e); drag={id:r.id,start:p,x:r.x,y:r.y,w:r.w,h:r.h,g,mode:handle?'resize':'move'}; state.selected=r.id; svg.setPointerCapture(e.pointerId);
    });
    svg.addEventListener('pointermove',e=>{
      if(!drag)return; const p=point(e),r=state.rooms.find(x=>x.id===drag.id); if(!r)return; const grid=Number(state.roomGrid)||.1;
      const snap=n=>Math.round(n/grid)*grid;
      if(drag.mode==='resize'){
        r.w=+Math.max(.5,Math.min(state.width-r.x,snap(drag.w+(p.x-drag.start.x)/30))).toFixed(2);
        r.h=+Math.max(.5,Math.min(state.depth-r.y,snap(drag.h+(p.y-drag.start.y)/30))).toFixed(2);
        const rect=drag.g.querySelector('rect'); if(rect){rect.setAttribute('width',r.w*30);rect.setAttribute('height',r.h*30);}
      }else{
        r.x=+Math.max(0,Math.min(state.width-r.w,snap(drag.x+(p.x-drag.start.x)/30))).toFixed(2);
        r.y=+Math.max(0,Math.min(state.depth-r.h,snap(drag.y+(p.y-drag.start.y)/30))).toFixed(2);
        drag.g.setAttribute('transform',`translate(${(r.x-drag.x)*30} ${(r.y-drag.y)*30})`);
      }
    });
    const end=()=>{if(!drag)return;drag=null;save();render();}; svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);
    svg.addEventListener('keydown',e=>{const g=e.target.closest('[data-room]');if(!g)return;const r=state.rooms.find(x=>x.id===g.dataset.room);if(!r)return;if(e.key==='Enter'){state.selected=r.id;render();return;}const d={ArrowLeft:[-.1,0],ArrowRight:[.1,0],ArrowUp:[0,-.1],ArrowDown:[0,.1]}[e.key];if(d){e.preventDefault();history();r.x=+(Math.max(0,Math.min(state.width-r.w,r.x+d[0]))).toFixed(1);r.y=+(Math.max(0,Math.min(state.depth-r.h,r.y+d[1]))).toFixed(1);state.selected=r.id;save();render();document.querySelector(`[data-room="${CSS.escape(r.id)}"]`)?.focus();}});
  };

  function step5(c){return `${heroStrip(`<span>BƯỚC 5 TRONG 10</span><h2>Bản vẽ <b>thiết kế</b></h2><p>Thêm, kéo, đổi kích thước phòng theo từng tầng; khối lượng và chi phí cập nhật cùng dữ liệu.</p>`)}<div class="suite-design-tabs"><button class="active">Ảnh nhà mẫu</button><button data-action="uploadPlan">Tải bản vẽ</button><button data-suite="room-template" data-id="living">Tự thiết kế</button></div>${editor(c)}<section class="card suite-card"><div class="row between"><div><h3>Kiểm tra phương án hiện tại</h3><p class="hint">Các kiểm tra dưới đây là logic hình học/ngân sách, không thay thế thiết kế kỹ thuật.</p></div><span class="badge">Snapshot ${esc(c.snapshot.id.slice(-8))}</span></div><div class="suite-check-grid">${designChecks().map(([ok,t,d])=>`<div class="suite-check ${ok?'ok':'warn'}"><b>${ok?'✓':'!' } ${esc(t)}</b><span>${esc(d)}</span></div>`).join('')}</div></section>`;}

  function materialCards(cat){return catalog[cat].map(p=>{const chosen=state.materialChoices?.[cat]===p.id;return `<article class="suite-material ${chosen?'selected':''}"><div class="suite-material-visual ${cat} level-${p.level}"></div><span class="suite-material-brand">${p.brand}</span><h3>${p.name}</h3><div class="suite-kv"><span>Giá tham khảo</span><b>${money(p.price)} / ${p.unit}</b></div><div class="suite-kv"><span>Tuổi thọ giả định</span><b>${p.life}</b></div><div class="suite-kv"><span>Bảo trì</span><b>${p.care}</b></div><button data-suite="select-material" data-cat="${cat}" data-id="${p.id}">${chosen?'Đang chọn':'Chọn vật liệu'}</button></article>`;}).join('');}
  function step6(c){
    const total10=c.snapshot.quote.total + Math.round(c.snapshot.quote.total*(state.maintenance/100)*10);
    return `${heroStrip(`<span>BƯỚC 6 TRONG 10</span><h2>Gói <b>vật liệu</b></h2><p>Chọn mức hoàn thiện, ghi nguồn giá và xem tác động lên chi phí vòng đời.</p>`)}<div class="suite-package-row">${['Tiết kiệm','Tiêu chuẩn','Cao cấp'].map((n,i)=>`<button class="suite-package ${state.tier===i?'active':''}" data-action="tier" data-value="${i}"><span>${i===0?'♧':i===1?'◇':'♔'}</span><div><b>${n}</b><small>${['Ưu tiên chi phí đầu tư','Cân bằng chi phí & độ bền','Hoàn thiện nâng cấp'][i]}</small></div></button>`).join('')}</div><div class="suite-material-layout"><aside class="suite-category-nav"><button class="active">Gạch / sàn</button><button>Sơn</button><button>Cửa</button><button data-up="exportPrices">Xuất bảng giá</button><button data-up="importPrices">Nhập bảng giá</button></aside><section class="card suite-card"><div class="row between"><div><h2>Vật liệu hoàn thiện chính</h2><p class="hint">Danh mục mẫu chỉ để thử UX. Đơn giá dùng trong dự toán vẫn được kiểm soát tại bảng nguồn giá bên dưới.</p></div><span class="badge">${state.location}</span></div><h3>Sàn</h3><div class="suite-material-grid">${materialCards('floor')}</div><h3>Sơn</h3><div class="suite-material-grid">${materialCards('paint')}</div><h3>Cửa</h3><div class="suite-material-grid">${materialCards('door')}</div></section><aside class="card suite-card suite-impact"><h2>Tác động chi phí</h2><div class="metric"><small>Tổng dự toán hiện tại</small><strong>${money(c.total)}</strong></div><div class="metric"><small>Kịch bản 10 năm</small><strong>${money(total10)}</strong></div><div class="suite-bars"><div><span>Tiết kiệm</span><i style="--h:52%"></i></div><div><span>Tiêu chuẩn</span><i style="--h:70%"></i></div><div><span>Cao cấp</span><i style="--h:92%"></i></div></div><p class="hint">So sánh gói dùng hệ số mô phỏng trên đơn giá DEMO. Báo giá thủ công có nguồn không bị nhân hệ số.</p></aside></div><section class="card suite-card suite-source-table"><div class="row between"><div><h2>Nguồn giá đang dùng trong dự toán</h2><p class="hint">Có thể thay từng dòng bằng báo giá thật, ngày báo giá, vùng và URL nguồn.</p></div><span class="badge ${c.snapshot.priceFlags.length?'warn':''}">${c.snapshot.priceFlags.length} cảnh báo nguồn</span></div>${table(c)}</section>`;
  }

  function localReview(s){
    const insights=[];
    if(s.budgetGap<0)insights.push({text:`Dự toán hiện vượt vốn khả dụng khoảng ${money(Math.abs(s.budgetGap))}. Cần giảm phạm vi, thay mức hoàn thiện hoặc điều chỉnh nguồn vốn trước khi chốt.`,evidenceIds:['budget']});
    else insights.push({text:`Kịch bản hiện còn khoảng ${money(s.budgetGap)} so với vốn khả dụng, nhưng nên giữ khoản dự phòng cho hạng mục chưa bóc tách.`,evidenceIds:['budget','engineering']});
    if(!s.geometry.valid)insights.push({text:'Mặt bằng đang có xung đột hình học. Hãy xử lý phòng chồng lấn/cửa không còn khớp trước khi dùng khối lượng để dự toán.',evidenceIds:['geometry']});
    else insights.push({text:`Mặt bằng hiện có ${num(s.geometry.floorArea)} m² diện tích hợp. Hình học cơ bản hợp lệ nhưng chưa phải kiểm tra công năng hay kết cấu.`,evidenceIds:['geometry','engineering']});
    const short=s.monthly.find(r=>r.cashShortfall>0);insights.push({text:short?`Dòng tiền mô phỏng thiếu tiền từ tháng ${short.month}; cần đổi lịch giải ngân/tiến độ chi hoặc tăng đệm tiền mặt.`:'Trong kịch bản hiện tại chưa xuất hiện tháng âm tiền mặt, nhưng vẫn cần đối chiếu tiến độ thanh toán hợp đồng thực tế.',evidenceIds:['cashflow']});
    if(s.priceFlags.length||s.missing.length)insights.push({text:`Nguồn giá còn ${s.priceFlags.length} cảnh báo và ${s.missing.length} hạng mục thiếu giá. Ưu tiên cập nhật báo giá có ngày/vùng trước khi dùng con số để ra quyết định.`,evidenceIds:['sources']});
    return Core17.validateReview({snapshotId:s.id,insights},s);
  }
  function aiPanel(s){const result=(aiResult?.snapshotId===s.id?aiResult:state.aiReview?.snapshotId===s.id?state.aiReview:null);return result?`<div class="suite-ai-results">${result.insights.map((i,idx)=>`<article><span>${idx+1}</span><div><b>Nhận xét dựa trên dữ liệu</b><p>${esc(i.text)}</p><small>Bằng chứng: ${i.evidenceIds.map(esc).join(', ')}</small></div></article>`).join('')}</div>`:`<div class="suite-ai-empty">${icon('info')}<span>Chưa có nhận xét cho snapshot hiện tại.</span></div>`;}
  function step7(c){const s=c.snapshot;const facts=Core17.reviewFacts(s);return `${heroStrip(`<span>BƯỚC 7 TRONG 10</span><h2>Mô phỏng 3D <b>& đánh giá AI</b></h2><p>Xem mô hình từ chính mặt bằng và nhận nhận xét có dẫn chứng từ dữ liệu hiện tại.</p>`)}<div class="suite-ai-layout"><aside class="card suite-card suite-score"><h2>Đánh giá tổng thể</h2>${gauge(Math.max(0,Math.min(100,88-(s.budgetGap<0?20:0)-(s.geometry.valid?0:25)-Math.min(20,s.priceFlags.length*4))),'điểm dữ liệu')}<div class="suite-score-lines">${[['Ngân sách',s.budgetGap>=0?85:55],['Công năng hình học',s.geometry.valid?90:50],['Nguồn giá',Math.max(40,90-s.priceFlags.length*8)],['Dòng tiền',s.monthly.some(r=>r.cashShortfall)?55:88],['Độ đầy đủ kỹ thuật',48]].map(([n,v])=>`<div><span>${n}</span><i><b style="width:${v}%"></b></i><strong>${v}/100</strong></div>`).join('')}</div></aside><section class="card suite-card suite-3d"><div class="row between"><div><h2>Mô hình khối 3D</h2><p class="hint">Từ cùng tường/cửa của mặt bằng; chưa phải render kiến trúc hoàn thiện.</p></div><div class="tabs"><button class="${state.sceneTheme==='day'?'active':''}" data-suite="scene-theme" data-id="day">Ngày</button><button class="${state.sceneTheme==='night'?'active':''}" data-suite="scene-theme" data-id="night">Đêm</button></div></div><canvas id="scene3d" class="scene-${state.sceneTheme}" tabindex="0" aria-label="Mô hình 3D"></canvas><div class="row between"><select id="sceneFloor"><option value="all">Tất cả tầng</option>${Array.from({length:state.floors},(_,i)=>`<option value="${i}">Tầng ${i+1}</option>`).join('')}</select><button data-up="obj">${icon('download')}Tải OBJ</button></div></section><aside class="card suite-card suite-ai"><div class="row between"><h2>Nhận xét từ dữ liệu</h2><span class="badge">${esc(s.id.slice(-8))}</span></div><div class="suite-facts">${facts.map(f=>`<div class="${f.severity}"><b>${esc(f.id)}</b><span>${esc(f.text)}</span></div>`).join('')}</div><div class="suite-ai-actions"><button class="primary" data-suite="local-ai">Phân tích cục bộ</button><button data-suite="cloud-ai">AI qua máy chủ</button><button data-up="aiPrompt">Xuất prompt</button></div><p class="hint">Phân tích cục bộ là rule engine minh bạch. AI qua máy chủ chỉ hoạt động khi Vercel có OPENAI_API_KEY/OPENAI_MODEL; kết quả luôn phải dẫn evidenceIds.</p>${aiPanel(s)}</aside></div><section class="card suite-card"><div class="row between"><div><h2>Dự báo chi phí sở hữu 10 năm</h2><p class="hint">Kịch bản dựa trên tỷ lệ bảo trì/vận hành do người dùng nhập; không dự đoán hư hỏng thực tế.</p></div><div class="fields compact">${suiteField('Bảo trì · %/năm','maintenance',{min:0,max:10,step:.1})}${suiteField('Vận hành · triệu/năm','annualOperating',{min:0,max:10000,step:1})}${suiteField('Lạm phát · %/năm','annualInflation',{min:0,max:30,step:.1})}</div></div>${lifeTable(s)}</section>`;}

  function costSegments(s){const total=Math.max(1,s.quote.total);return s.quote.items.map((i,idx)=>({name:i.description,value:i.total,pct:i.total/total*100,color:['#6f9874','#e0ae5c','#6ca7d6','#9c8cc5','#7abcb3','#d88080','#9ab56f','#c69b74'][idx%8]}));}
  function step8(c){const s=c.snapshot,segs=costSegments(s);let acc=0;const gradient=segs.map(x=>{const start=acc;acc+=x.pct;return `${x.color} ${start}% ${acc}%`;}).join(',');const coverage=Math.round((s.quote.items.filter(i=>i.kind!=='demo').length/Math.max(1,s.quote.items.length))*100);return `${heroStrip(`<span>BƯỚC 8 TRONG 10</span><h2>Dự toán <b>& thanh toán</b></h2><p>Miễn phí xem dự toán tổng quan; dữ liệu lấy trực tiếp từ mặt bằng, vật liệu và nguồn giá hiện tại.</p>`)}<div class="suite-estimate-layout"><section class="card suite-card"><h2>Bảng dự toán tổng quan</h2>${table(c)}</section><aside class="card suite-card suite-cost-donut"><h2>Cơ cấu chi phí</h2><div class="suite-donut" style="background:conic-gradient(${gradient})"><div><strong>${moneyShort(s.quote.total)}</strong><span>Tổng phần đã tính</span></div></div><div class="suite-legend">${segs.map(x=>`<span><i style="background:${x.color}"></i>${esc(x.name)} <b>${num(x.pct)}%</b></span>`).join('')}</div></aside><aside class="card suite-card suite-budget-compare"><h2>So sánh ngân sách</h2><div class="metric"><small>Ngân sách khả dụng</small><strong>${money(s.budget)}</strong></div><div class="metric"><small>Tổng dự toán</small><strong>${money(s.quote.total)}</strong></div><div class="metric ${s.budgetGap>=0?'positive':'negative'}"><small>${s.budgetGap>=0?'Còn dư khoảng':'Thiếu khoảng'}</small><strong>${money(Math.abs(s.budgetGap))}</strong></div><div class="suite-source-progress"><span>Nguồn giá người dùng nhập / tổng dòng</span><i><b style="width:${coverage}%"></b></i><strong>${coverage}%</strong></div><button data-action="costCsv">${icon('download')}Tải dự toán CSV</button><button data-action="print">${icon('file')}In / lưu PDF</button></aside></div><section class="suite-paywall-preview"><div><span class="suite-lock">${icon('save')}</span><div><h3>Thanh toán thật chưa bật trong V1.7</h3><p>Luồng VietQR/webhook sẽ thuộc giai đoạn thanh toán. Bản này tập trung hoàn thiện UI, dữ liệu, thiết kế, tài chính, vật liệu, AI/3D.</p></div></div><span class="badge">Không tạo giao dịch giả</span></section>`;}

  function step9(c){const checks=[['survey','Móng / tim trục / cao độ'],['structure','Kết cấu cột, dầm, sàn'],['wall','Tường / tô / chống nứt'],['mepDrain','Ống thoát toilet Φ114, độ dốc ≥1%'],['mepAir','Dây điện máy lạnh đi riêng'],['mepPressure','Test áp lực ống nước theo hồ sơ thiết kế'],['mepInternet','Ống chờ internet / camera'],['mepGround','Tiếp địa & thiết bị chống rò'],['finish','Hoàn thiện bề mặt'],['handover','Nghiệm thu tổng thể']];const done=checks.filter(([k])=>state.checks[k]).length,progress=Math.round(done/checks.length*100);return `${heroStrip(`<span>BƯỚC 9 TRONG 10</span><h2>Giám sát thi công <b>& checklist MEP</b></h2><p>Theo dõi tiến độ, việc cần kiểm tra và khoản chi thực tế trên cùng dự án.</p>`)}<div class="suite-progress-strip"><div class="suite-progress-circle"><strong>${progress}%</strong><span>Checklist</span></div><div class="suite-stage-flow">${['Móng','Kết cấu','Tường','Mái','Điện nước','Hoàn thiện','Bàn giao'].map((x,i)=>`<span class="${i<Math.ceil(progress/15)?'done':''}"><i>${i+1}</i>${x}</span>`).join('')}</div></div><div class="suite-monitor-layout"><section class="card suite-card"><h2>Kế hoạch giải ngân theo snapshot</h2><div class="tablewrap"><table><thead><tr><th>Mốc</th><th>Tháng</th><th>Tỷ lệ</th><th class="num">Số tiền</th></tr></thead><tbody>${c.snapshot.milestones.map(m=>`<tr><td>${esc(m.id)}</td><td>${m.month}</td><td>${num(m.basisPoints/100)}%</td><td class="num">${money(m.amount)}</td></tr>`).join('')}</tbody></table></div></section><section class="card suite-card"><div class="row between"><h2>Tiến độ & khoản chi</h2><button data-action="expense">${icon('plus')}Ghi khoản chi</button></div><div class="metric"><small>Đã ghi nhận thực tế</small><strong>${money(state.spending.reduce((a,b)=>a+(Number(b.amount)||0),0))}</strong></div>${state.spending.slice(-5).reverse().map((r,i)=>`<div class="statline"><span>${esc(r.date)} · ${esc(r.name)}</span><b>${money(r.amount)}</b></div>`).join('')||'<p class="hint">Chưa ghi khoản chi.</p>'}</section><aside class="card suite-card"><h2>Checklist kỹ thuật</h2>${checks.map(([k,t])=>`<label class="checkrow"><input type="checkbox" data-check="${k}" ${state.checks[k]?'checked':''}><span>${esc(t)}<small>${state.checks[k]?'Đã đánh dấu kiểm tra':'Chưa đánh dấu'}</small></span></label>`).join('')}</aside></div>`;}

  function step10(c){const s=c.snapshot;return `${heroStrip(`<span>BƯỚC 10 TRONG 10</span><h2>Hồ sơ bàn giao <b>& giải ngân</b></h2><p>Tập hợp các tệp từ cùng một snapshot để tránh mỗi báo cáo mang một con số khác nhau.</p>`)}<div class="suite-handover-layout"><section class="card suite-card"><h2>Trung tâm tải hồ sơ</h2><div class="suite-file-grid">${[
    ['file','Hồ sơ tổng hợp','In / lưu PDF','print'],['chart','Bóc tách chi phí','CSV dự toán','costCsv'],['check','Checklist MEP','Theo dữ liệu đang đánh dấu','print'],['plan','Mặt bằng SVG','Từng tầng cùng kích thước','svg']
  ].map(([ic,t,sub,act])=>`<article><span>${icon(ic)}</span><h3>${t}</h3><p>${sub}</p><button data-action="${act}">${icon('download')}Tải / xuất</button></article>`).join('')}<article><span>${icon('cube')}</span><h3>Mô hình 3D</h3><p>OBJ khối ý tưởng</p><button data-up="obj">${icon('download')}Tải OBJ</button></article></div></section><aside class="card suite-card suite-handover-summary"><div class="suite-complete">✓</div><h2>Snapshot sẵn sàng trao đổi</h2><p>${esc(s.id)}</p><div class="suite-kv"><span>Tổng dự toán</span><b>${money(s.quote.total)}</b></div><div class="suite-kv"><span>Ngân sách còn lại</span><b>${money(s.budgetGap)}</b></div><div class="suite-kv"><span>Giữ lại bảo hành</span><b>${num(state.retentionPercent)}%</b></div><div class="suite-kv"><span>Trạng thái</span><b>${s.status}</b></div><button class="primary" data-up="bundle">${icon('download')}Tải trọn bộ ZIP</button><button data-action="print">Xuất báo cáo cuối cùng</button></aside></div><section class="suite-handover-checks">${['Hồ sơ hoàn công','Danh sách vật liệu đã dùng','Bảo hành','Thiết bị điện nước','Hướng dẫn vận hành','Hình ảnh nghiệm thu'].map((x,i)=>`<span class="${i<3?'done':''}">✓ ${x}</span>`).join('')}</section>`;}

  screens[0]=step1;screens[1]=step2;screens[2]=step3;screens[3]=step4;screens[4]=step5;screens[5]=step6;screens[6]=step7;screens[7]=step8;screens[8]=step9;screens[9]=step10;

  function findSpot(w,h,floor=state.floor){for(let y=0;y<=state.depth-h+.001;y+=.5)for(let x=0;x<=state.width-w+.001;x+=.5){if(!state.rooms.some(r=>r.floor===floor&&x<r.x+r.w&&x+w>r.x&&y<r.y+r.h&&y+h>r.y))return{x:+x.toFixed(1),y:+y.toFixed(1)};}return null;}
  function addRoomTemplate(id){const t=roomTemplates.find(x=>x.id===id);if(!t)return;const w=Math.min(t.w,state.width),h=Math.min(t.h,state.depth),spot=findSpot(w,h);history();const r={id:'r'+Date.now(),floor:state.floor,name:t.name,x:spot?.x||0,y:spot?.y||0,w,h,type:t.type};state.rooms.push(r);state.selected=r.id;save();render();if(!spot)toast('Đã thêm phòng ở góc khu đất; cần di chuyển để tránh chồng lấn.');}
  async function cloudAI(){
    const s=snapshot();
    try{
      const response=await fetch('/api/review',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({snapshotId:s.id,facts:Core17.reviewFacts(s)}),signal:AbortSignal.timeout(45000)});
      const data=await response.json().catch(()=>({})); if(!response.ok)throw Error(data.error||`HTTP ${response.status}`);
      aiResult=Core17.validateReview(data,s);state.aiReview=aiResult;save();render();
    }catch(err){toast('AI máy chủ chưa sẵn sàng: '+err.message+'. Có thể dùng Phân tích cục bộ hoặc Xuất prompt.');}
  }

  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-suite]');if(!b)return;const a=b.dataset.suite,id=b.dataset.id;
    if(a==='select-bank'){state.bank=id;save();render();return;}
    if(a==='apply-bank'){const bk=banks.find(x=>x.id===id);if(!bk)return;state.bank=id;state.rate=bk.intro;state.postRate=bk.float;save();render();toast('Đã áp kịch bản lãi suất minh họa.');return;}
    if(a==='select-material'){const cat=b.dataset.cat,p=catalog[cat]?.find(x=>x.id===id);if(!p)return;state.materialChoices={...(state.materialChoices||{}),[cat]:id};state.material[cat]=p.level;save();render();return;}
    if(a==='room-template'){addRoomTemplate(id);return;}
    if(a==='add-floor'){if(state.floors>=5)return toast('Tối đa 5 tầng trong bản này.');history();state.floors++;state.floor=state.floors-1;state.selected='';save();render();return;}
    if(a==='remove-floor'){if(state.floors<=1)return;if(!confirm('Xóa tầng trên cùng và toàn bộ phòng trên tầng đó?'))return;const last=state.floors-1;let wallIds=new Set();try{wallIds=new Set(snapshot().geometry.walls.filter(w=>w.floor===last).map(w=>w.id));}catch{}history();state.rooms=state.rooms.filter(r=>r.floor!==last);state.openings=(state.openings||[]).filter(o=>!wallIds.has(o.wallId));state.floors--;state.floor=Math.min(state.floor,state.floors-1);state.selected=state.rooms.find(r=>r.floor===state.floor)?.id||'';save();render();return;}
    if(a==='local-ai'){const s=snapshot();aiResult=localReview(s);state.aiReview=aiResult;save();render();return;}
    if(a==='cloud-ai'){cloudAI();return;}
    if(a==='scene-theme'){state.sceneTheme=id==='night'?'night':'day';save();render();return;}
  },true);

  const prevRenderSuite=render;
  render=function(){
    prevRenderSuite();
    document.documentElement.dataset.productSuite=SUITE_VERSION;
    document.body.classList.toggle('suite-night',state.sceneTheme==='night');
    const saved=document.querySelector('.saved');if(saved)saved.title=`Project Store v17 · revision ${state.projectRevision||1}`;
    const side=document.querySelector('.sidebottom');if(side){const p=side.querySelector('p');if(p)p.textContent='Product Suite v1.7 · dữ liệu cục bộ + snapshot engine';}
  };

  // Re-render once after migrations and expose version for diagnostics.
  storeWrite(state,'suite-bootstrap');
  globalThis.BMH_PRODUCT_SUITE={version:SUITE_VERSION,banks,catalog,climateProfile,kua,localReview};
  render();
})();
