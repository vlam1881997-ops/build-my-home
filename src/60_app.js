BMH.root = () => document.getElementById('app');
BMH.sidebar = () => `<aside class="sidebar ${BMH.state.ui.sidebarCollapsed?'collapsed':''}"><button class="collapse" data-sidebar aria-label="Thu gọn/mở rộng">${BMH.state.ui.sidebarCollapsed?'›':'‹'}</button><div class="side-brand-mini"><img src="assets/icon.svg"><span>Build My Home</span></div><nav><button data-nav="1" class="${BMH.state.ui.step===1?'active':''}">${BMH.icon('home')}<span>Trang chủ</span></button><button>${BMH.icon('user')}<span>Hồ sơ của tôi</span></button><button>${BMH.icon('folder')}<span>Dự án</span></button><button>${BMH.icon('image')}<span>Thư viện mẫu</span></button><button>${BMH.icon('users')}<span>Nhà thầu</span></button><button data-nav="6">${BMH.icon('cube')}<span>Vật liệu</span></button><button>${BMH.icon('book')}<span>Kiến thức</span></button><button>${BMH.icon('gear')}<span>Cài đặt</span></button></nav><div class="side-quote"><b>⌂</b><span>Ngôi nhà tốt hơn<br>một cuộc sống đẹp hơn</span></div></aside>`;
BMH.header = () => `<header class="topbar"><div class="brand"><img src="assets/icon.svg" alt=""><div><b>Build My Home</b><span>Kiến tạo tổ ấm, vững bền tương lai</span></div></div><div class="header-actions"><button class="location-chip" data-nav="3">${BMH.icon('pin')} ${BMH.esc(BMH.state.project.site.province)}</button><span class="lang">◎ Tiếng Việt</span><button class="icon-btn">${BMH.icon('bell')}</button><div class="profile"><span class="avatar">N</span><div><b>Nguyễn Thị Lan</b><small>Gia đình nhỏ, Ước mơ lớn</small></div></div></div></header>`;
BMH.stepper = () => `<nav class="stepper">${BMH.STEPS.map(([short],i)=>{const n=i+1,locked=n>=9&&!BMH.isUnlocked(),active=BMH.state.ui.step===n,done=n<BMH.state.ui.step&&!locked;return `<button data-nav="${n}" class="step ${active?'active':''} ${done?'done':''} ${locked?'locked':''}" ${locked?'aria-label="Bước đang khóa"':''}><i>${locked?'🔒':done?'✓':n}</i><span>${short}</span></button>`}).join('')}</nav>`;
BMH.footer = () => {const step=BMH.state.ui.step,next=step+1,blocked=step===8&&!BMH.isUnlocked(),e=BMH.estimate();return `<div class="step-footer official-footer"><button class="footer-back" data-nav="${step-1}" ${step===1?'disabled':''}>${BMH.icon('back')} Quay lại</button><div class="footer-budget"><span><small>Ngân sách tối đa</small><b>${BMH.money(e.budget)}</b></span><span><small>Dự toán hiện tại</small><b>${BMH.money(e.total)}</b></span><span class="${e.gap>=0?'good':'bad'}"><small>${e.gap>=0?'Còn dự phòng':'Vượt ngân sách'}</small><b>${BMH.money(Math.abs(e.gap))}</b></span></div>${step<10?`<button class="primary footer-next" data-nav="${next}" ${blocked?'disabled title="Hoàn tất thanh toán để tiếp tục"':''}>${blocked?'🔒 Hoàn tất thanh toán':'Tiếp theo'} ${BMH.icon('arrow')}</button>`:'<button class="primary footer-next" disabled>Hoàn thành</button>'}</div>`};
BMH.amountBar = () => {const e=BMH.estimate();return `<div class="amountbar"><div><small>Ngân sách tối đa</small><strong>${BMH.money(e.budget)}</strong></div><div><small>Dự toán hiện tại</small><strong class="${e.total>e.budget?'bad':''}">${BMH.money(e.total)}</strong></div><div><small>${e.gap>=0?'Còn dự phòng':'Vượt ngân sách'}</small><strong class="${e.gap>=0?'good':'bad'}">${BMH.money(Math.abs(e.gap))}</strong></div></div>`};
BMH.runtimeError = (step,err) => `<section class="runtime-error card"><div>⚠</div><h2>Bước ${step} gặp lỗi hiển thị</h2><p>Dữ liệu dự án vẫn được giữ nguyên. Hãy quay lại hoặc tải lại trang; hệ thống không còn để lỗi một màn làm trắng toàn bộ website.</p>${BMH.DEV&&err?`<code>${BMH.esc(err.message||String(err))}</code>`:''}<div><button class="secondary" data-nav="${Math.max(1,step-1)}">${BMH.icon('back')} Quay lại</button><button class="clay" data-nav="1">Về Bước 1</button></div></section>`;
BMH.render = ({preserveScroll=false}={}) => {
  const sy=window.scrollY, step=BMH.state.ui.step; const screen=BMH.SCREENS[step-1]||BMH.screen1; let body='';
  try{body=screen();}catch(err){console.error(`Build My Home render error at step ${step}`,err);body=BMH.runtimeError(step,err);}
  try{const appRoot=BMH.root();if(!appRoot||typeof appRoot.innerHTML==='undefined')throw new Error('Missing #app root');appRoot.innerHTML=`${BMH.header()}${BMH.sidebar()}<main class="main ${step===5?'planner-page':''}">${BMH.stepper()}<div class="screen">${body}</div>${BMH.footer()}</main>`;}catch(err){console.error('Build My Home shell render error',err);const appRoot=BMH.root();if(appRoot)appRoot.innerHTML=BMH.runtimeError(step,err);}
  document.documentElement.dataset.version=BMH.VERSION; document.title=`Build My Home · ${BMH.STEPS[step-1][1]}`;
  if(preserveScroll)window.scrollTo(0,sy); requestAnimationFrame(BMH.afterRender);
};
BMH.navigateTo = step => {
  step=BMH.clamp(Number(step)||1,1,10); if(step>=9&&!BMH.isUnlocked()){BMH.state.ui.step=8;BMH.save();BMH.render();BMH.toast('Bước 9 và 10 chỉ mở sau khi thanh toán được xác nhận.');return false;}
  BMH.state.ui.step=step; if(step!==5){BMH.drag=null;BMH.state.ui.planner.tool='select';} BMH.save(); BMH.render(); window.scrollTo({top:0,behavior:'smooth'}); return true;
};
BMH.openPaywall = () => {BMH.navigateTo(8);BMH.toast('Hoàn tất thanh toán tại Bước 8 để mở hồ sơ premium.');};
BMH.loadExternalScript = (url, timeout=3500) => new Promise((resolve,reject)=>{
  const script=document.createElement('script'); let settled=false;
  const finish=(ok,err)=>{if(settled)return;settled=true;clearTimeout(timer);ok?resolve():reject(err||new Error('Load failed'));};
  script.src=url;script.async=true;script.crossOrigin='anonymous';script.onload=()=>finish(true);script.onerror=()=>finish(false,new Error('Script unavailable'));
  const timer=setTimeout(()=>finish(false,new Error('Script timeout')),timeout);document.head.appendChild(script);
});
BMH.ensureLeaflet = () => {
  if(window.L)return Promise.resolve(window.L);
  if(BMH.leafletPromise)return BMH.leafletPromise;
  const sources=[
    {js:'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',css:'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'},
    {js:'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.js',css:'https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/leaflet.css'}
  ];
  BMH.leafletPromise=(async()=>{
    for(const src of sources){
      try{
        if(!document.querySelector(`link[data-leaflet-css=\"${src.css}\"]`)){const link=document.createElement('link');link.rel='stylesheet';link.href=src.css;link.dataset.leafletCss=src.css;document.head.appendChild(link);}
        await BMH.loadExternalScript(src.js);if(window.L)return window.L;
      }catch(e){}
    }
    return null;
  })();
  return BMH.leafletPromise;
};
BMH.afterRender = () => {
  if(BMH.state.ui.step===3){
    const mapEl=BMH.$('#map');
    BMH.ensureLeaflet().then(L=>{
      if(BMH.state.ui.step!==3)return;
      if(L)BMH.initMap();
      else if(mapEl){mapEl.classList.remove('map-loading');mapEl.classList.add('fallback-only');}
    });
  }
  if(BMH.state.ui.step===5 && window.innerWidth>1180 && !BMH.state.ui.sidebarCollapsed){BMH.state.ui.sidebarCollapsed=true;BMH.save();BMH.render();}
};
BMH.initMap = () => {
  const el=BMH.$('#map'); if(!el)return; const s=BMH.state.project.site, r=BMH.REGIONS[s.province]||BMH.REGIONS['Bình Dương'];
  try{
    if(BMH.map){BMH.map.remove();BMH.map=null;}
    if(!window.L)throw new Error('Leaflet unavailable');
    BMH.map=L.map(el,{zoomControl:true,preferCanvas:true}).setView([s.lat,s.lng],r.zoom||12);
    let switched=false,errors=0;
    const addLayer=(url,attr)=>{const layer=L.tileLayer(url,{maxZoom:19,attribution:attr,keepBuffer:4,updateWhenIdle:false}).addTo(BMH.map);layer.on('load',()=>{el.classList.remove('map-loading','fallback-only')});layer.on('tileerror',()=>{errors++;if(errors>=5&&!switched){switched=true;BMH.map.removeLayer(layer);errors=0;addLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png','© OpenStreetMap contributors');}else if(errors>=10){el.classList.add('fallback-only');}});return layer;};
    addLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png','© OpenStreetMap contributors © CARTO');
    BMH.mapMarker=L.marker([s.lat,s.lng]).addTo(BMH.map).bindPopup(`${BMH.esc(s.district||'')} · ${BMH.esc(s.province)}`).openPopup();
    setTimeout(()=>BMH.map?.invalidateSize(true),120); setTimeout(()=>BMH.map?.invalidateSize(true),450);
    window.addEventListener('resize',BMH.mapResize,{once:true});
  } catch(e){el.classList.remove('map-loading');el.classList.add('fallback-only');}
};
BMH.mapResize = () => BMH.map?.invalidateSize(true);

document.addEventListener('click',e=>{
  if(!e.target.closest?.('#app'))return;
  const nav=e.target.closest('[data-nav]'); if(nav){e.preventDefault();BMH.navigateTo(nav.dataset.nav);return;}
  const start=e.target.closest('[data-start]'); if(start){BMH.state.project.source=start.dataset.start;BMH.save(); if(start.dataset.start==='photo')BMH.$('#uploadPhoto')?.click(); else if(start.dataset.start==='plan')BMH.$('#uploadPlan')?.click(); else BMH.navigateTo(2); return;}
  if(e.target.closest('[data-sidebar]')){BMH.state.ui.sidebarCollapsed=!BMH.state.ui.sidebarCollapsed;BMH.save();BMH.render();return;}
  const bank=e.target.closest('[data-bank]'); if(bank){const b=BMH.BANKS.find(x=>x.id===bank.dataset.bank);if(b){Object.assign(BMH.state.project.finance,{bank:b.id,introRate:b.intro,postRate:b.post,promoMonths:b.months});BMH.save();BMH.render();BMH.toast(`Đã nạp kịch bản ${b.name}; vẫn có thể chỉnh tay.`);}return;}
  if(e.target.closest('[data-map-refresh]')){const s=BMH.state.project.site,pt=BMH.regionPoint(s.province,s.district);Object.assign(s,{lat:pt.lat,lng:pt.lng,district:pt.district});BMH.save();BMH.render();return;}
  const nearby=e.target.closest('[data-nearby]');if(nearby){const s=BMH.state.project.site;s.district=nearby.dataset.nearby;s.lat=Number(nearby.dataset.lat);s.lng=Number(nearby.dataset.lng);BMH.save();BMH.render();return;}
  const soil=e.target.closest('[data-soil]');if(soil){BMH.state.project.site.soil=soil.dataset.soil;BMH.save();BMH.render();return;}
  const shape=e.target.closest('[data-site-shape]');if(shape){BMH.state.project.site.shape=shape.dataset.siteShape;BMH.save();BMH.render();return;}
  const road=e.target.closest('[data-road-value]');if(road){BMH.state.project.site.road=Number(road.dataset.roadValue);BMH.save();BMH.render();return;}
  const addPerson=e.target.closest('[data-household-add]');if(addPerson){const h=BMH.state.project.household;if(addPerson.dataset.householdAdd==='child')h.children.push({id:BMH.uid('c'),name:`Con ${h.children.length+1}`,birth:new Date().getFullYear()-8,room:'Riêng'});else h.relatives.push({id:BMH.uid('p'),name:`Người thân ${h.relatives.length+1}`,birth:1960,mobility:'Bình thường'});BMH.save();BMH.render();return;}
  const rem=e.target.closest('[data-person-remove]');if(rem){const h=BMH.state.project.household,key=rem.dataset.personRemove==='child'?'children':'relatives';h[key]=h[key].filter(x=>x.id!==rem.dataset.id);BMH.save();BMH.render();return;}

  const dtab=e.target.closest('[data-design-tab]');if(dtab){BMH.state.ui.designTab=dtab.dataset.designTab;if(dtab.dataset.designTab==='planner')BMH.state.ui.planner.view='plan';BMH.save();BMH.render();return;}
  const pview=e.target.closest('[data-plan-view]');if(pview){BMH.state.ui.planner.view=pview.dataset.planView;BMH.state.ui.planner.tool='select';BMH.save();BMH.render();return;}
  const mview=e.target.closest('[data-material-view]');if(mview&&!mview.disabled){BMH.state.ui.materialCategory=mview.dataset.materialView;BMH.save();BMH.render();return;}
  const floor=e.target.closest('[data-floor]');if(floor){BMH.state.ui.planner.view='plan';BMH.state.ui.planner.floor=Number(floor.dataset.floor);const first=BMH.floorRooms()[0];BMH.state.ui.planner.selected=first?.id||null;BMH.save();BMH.render();return;}
  const room=e.target.closest('[data-room-select]');if(room){BMH.state.ui.planner.selected=room.dataset.roomSelect;BMH.state.ui.planner.tool='select';BMH.save();BMH.render();return;}
  const wallPlace=e.target.closest('[data-wall-place]');if(wallPlace&&BMH.state.ui.planner.tool!=='select'){const svg=BMH.$('#plannerSvg');if(svg){BMH.placeOpeningAt(BMH.state.ui.planner.tool,wallPlace.dataset.room,wallPlace.dataset.side,BMH.svgPoint(e,svg));}return;}
  const planTool=e.target.closest('[data-plan-tool]');if(planTool){BMH.state.ui.planner.tool=planTool.dataset.planTool;BMH.save();BMH.render();return;}
  const alignFloor=e.target.closest('[data-align-floor]');if(alignFloor){BMH.alignCurrentFloor(alignFloor.dataset.alignFloor);return;}
  const addRoom=e.target.closest('[data-add-room]');if(addRoom){BMH.addRoom(addRoom.dataset.addRoom);return;}
  const opening=e.target.closest('[data-add-opening]');if(opening){BMH.addOpening(opening.dataset.addOpening);return;}
  const openingDelete=e.target.closest('[data-opening-delete]');if(openingDelete){BMH.pushPlanHistory();BMH.state.project.plan.openings=BMH.state.project.plan.openings.filter(o=>o.id!==openingDelete.dataset.openingDelete);BMH.save();BMH.render();return;}
  if(e.target.closest('[data-room-delete]')){BMH.pushPlanHistory();const id=BMH.state.ui.planner.selected;BMH.state.project.plan.rooms=BMH.state.project.plan.rooms.filter(r=>r.id!==id);BMH.state.project.plan.openings=BMH.state.project.plan.openings.filter(o=>o.roomId!==id);BMH.state.ui.planner.selected=BMH.floorRooms()[0]?.id||null;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-plan-undo]')){BMH.undoPlan();return;}
  if(e.target.closest('[data-plan-redo]')){BMH.redoPlan();return;}
  const zoomBtn=e.target.closest('[data-planner-zoom]');if(zoomBtn){const ui=BMH.state.ui.planner;ui.zoom=BMH.clamp(ui.zoom+(zoomBtn.dataset.plannerZoom==='in'?.15:-.15),.75,2.5);BMH.save();BMH.render();return;}
  if(e.target.closest('[data-planner-fit]')){BMH.state.ui.planner.zoom=1;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-planner-fullscreen]')){const el=BMH.$('.technical-sheet'); if(el?.requestFullscreen) el.requestFullscreen().catch(()=>BMH.toast('Trình duyệt không cho phép toàn màn hình.')); return;}
  const tier=e.target.closest('[data-tier]');if(tier){const before=BMH.estimate().total;BMH.state.project.materials.tier=tier.dataset.tier;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const material=e.target.closest('[data-material]');if(material){const before=BMH.estimate().total,cat=material.dataset.materialCat;BMH.state.project.materials.choices[cat]=material.dataset.material;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const sm=e.target.closest('[data-scene-mode]');if(sm){BMH.state.ui.sceneMode=sm.dataset.sceneMode;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-scene-explode]')){BMH.state.ui.sceneExploded=!BMH.state.ui.sceneExploded;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-scene-theme]')){BMH.state.ui.sceneTheme=BMH.state.ui.sceneTheme==='day'?'night':'day';BMH.save();BMH.render();return;}
  const wear=e.target.closest('[data-wear]');if(wear){BMH.state.project.wearYear=Number(wear.dataset.wear);BMH.save();BMH.render();return;}
  const copy=e.target.closest('[data-copy]');if(copy){navigator.clipboard?.writeText(copy.dataset.copy).then(()=>BMH.toast('Đã sao chép.')).catch(()=>BMH.toast('Không thể sao chép tự động.'));return;}
  if(e.target.closest('[data-dev-pay]')&&BMH.DEV){BMH.state.access.paid=!BMH.state.access.paid;BMH.state.access.source=BMH.state.access.paid?'dev-local':'none';BMH.state.access.paidAt=BMH.state.access.paid?new Date().toISOString():null;BMH.save();BMH.render();return;}
  const exp=e.target.closest('[data-export]');if(exp){({loan:BMH.exportLoan,estimate:BMH.exportEstimate,plan:BMH.exportPlanSvg,json:BMH.exportProjectJson,bundle:BMH.exportBundle}[exp.dataset.export]?.());return;}
  if(e.target.closest('[data-print]')){window.print();return;}
});

document.addEventListener('change',e=>{
  const t=e.target;
  if(t?.id==='uploadPhoto'){if(t.files?.[0]){BMH.toast('Đã nhận ảnh tham khảo. Tiếp tục nhập thông tin dự án.');BMH.navigateTo(2);}t.value='';return;}
  if(t?.id==='uploadPlan'){if(t.files?.[0]){BMH.toast('Đã nhận bản vẽ tham chiếu. Bạn có thể đối chiếu ở Bước 5.');BMH.navigateTo(2);}t.value='';return;}
  if(!t.closest?.('#app'))return;
  if(t.dataset.path){let v=t.type==='number'?Number(t.value)*(Number(t.dataset.scale)||1):t.value;const path=t.dataset.path;if(path==='project.site.province'){const r=BMH.REGIONS[v];BMH.state.project.site.province=v;if(r){const pt=BMH.regionPoint(v,r.defaultDistrict);Object.assign(BMH.state.project.site,{district:pt.district,lat:pt.lat,lng:pt.lng});}BMH.save();BMH.render();return;}if(path==='project.site.district'){BMH.state.project.site.district=v;const pt=BMH.regionPoint(BMH.state.project.site.province,v);BMH.state.project.site.lat=pt.lat;BMH.state.project.site.lng=pt.lng;BMH.save();BMH.render();return;}BMH.set(path,v);return;}
  if(t.dataset.person){const h=BMH.state.project.household,list=t.dataset.person==='child'?h.children:h.relatives,p=list.find(x=>x.id===t.dataset.id);if(p){p[t.dataset.key]=t.type==='number'?Number(t.value):t.value;BMH.save();BMH.render();}return;}
  if(t.dataset.planner){const ui=BMH.state.ui.planner;if(t.dataset.planner==='snap')ui.snap=Number(t.value);if(t.dataset.planner==='furniture')ui.showFurniture=t.checked;if(t.dataset.planner==='dimensions')ui.showDimensions=t.checked;if(t.dataset.planner==='feng')ui.showFeng=t.checked;if(t.dataset.planner==='below')ui.showBelow=t.checked;if(t.dataset.planner==='structure')ui.showStructure=t.checked;if(t.dataset.planner==='environment')ui.showEnvironment=t.checked;BMH.save();BMH.render();return;}
  if(t.dataset.roomField){const r=BMH.selectedRoom();if(!r)return;BMH.pushPlanHistory();const key=t.dataset.roomField,old={...r};r[key]=['x','y','w','h'].includes(key)?Number(t.value):t.value;if(['x','y','w','h'].includes(key)){r[key]=BMH.roundTo(r[key],BMH.state.ui.planner.snap);if(!BMH.roomValid(r)){Object.assign(r,old);BMH.toast('Giá trị mới gây chồng phòng hoặc vượt ranh.');}}BMH.save();BMH.render();return;}
  if(t.dataset.openingField){const o=BMH.state.project.plan.openings.find(x=>x.id===t.dataset.openingId);if(o){const old={...o};BMH.pushPlanHistory();o[t.dataset.openingField]=['width','offset'].includes(t.dataset.openingField)?Number(t.value):t.value;if(!BMH.openingFits(o,o.id)){Object.assign(o,old);BMH.planHistory.undo.pop();BMH.toast('Kích thước/vị trí ô mở đang trùng hoặc vượt chiều dài tường.');}BMH.save();BMH.render();}return;}
  if(t.matches('[data-scene-focus]')){BMH.state.ui.sceneFocus=t.value;BMH.save();BMH.render();return;}
  if(t.dataset.check){BMH.state.project.checklist[t.dataset.check]=t.checked;BMH.save();return;}
});

document.addEventListener('pointerdown',e=>{
  if(!e.target.closest?.('#app'))return;
  if(BMH.state.ui.step!==5||BMH.state.ui.planner.tool!=='select')return;
  const edge=e.target.closest('[data-edge-id]'),handle=e.target.closest('[data-resize-id]'),group=e.target.closest('[data-room-id]');
  const id=edge?.dataset.edgeId||handle?.dataset.resizeId||group?.dataset.roomId;if(!id)return;
  const r=BMH.state.project.plan.rooms.find(x=>x.id===id);if(!r)return;const svg=BMH.$('#plannerSvg');if(!svg)return;
  const rect=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;
  BMH.drag={id,mode:edge?'edge':handle?'resize':'move',side:edge?.dataset.edgeSide||null,startX:e.clientX,startY:e.clientY,scaleX:vb.width/rect.width,scaleY:vb.height/rect.height,originalPlan:BMH.planSnapshot(),changed:false,historyPushed:false,raf:false};
  BMH.state.ui.planner.selected=id;e.preventDefault();
});
window.addEventListener('pointermove',e=>{
  const d=BMH.drag;if(!d)return;const dx=(e.clientX-d.startX)*d.scaleX,dy=(e.clientY-d.startY)*d.scaleY,s=BMH.state.ui.planner.snap,site=BMH.state.project.site;
  let candidate=structuredClone(d.originalPlan.rooms),r=candidate.find(x=>x.id===d.id);if(!r)return;
  if(d.mode==='move'){r.x=BMH.clamp(BMH.roundTo(r.x+dx,s),0,site.width-r.w);r.y=BMH.clamp(BMH.roundTo(r.y+dy,s),0,site.depth-r.h);}
  else if(d.mode==='resize'){r.w=BMH.clamp(BMH.roundTo(r.w+dx,s),.6,site.width-r.x);r.h=BMH.clamp(BMH.roundTo(r.h+dy,s),.6,site.depth-r.y);}
  else {const delta=BMH.roundTo((d.side==='east'||d.side==='west')?dx:dy,s);candidate=BMH.edgeMoveCandidate(d.originalPlan.rooms,d.id,d.side,delta);}
  if(!candidate||!BMH.layoutValid(candidate))return;
  if(!d.historyPushed){BMH.planHistory.undo.push(structuredClone(d.originalPlan));if(BMH.planHistory.undo.length>30)BMH.planHistory.undo.shift();BMH.planHistory.redo.length=0;d.historyPushed=true;}
  BMH.state.project.plan.rooms=candidate;d.changed=true;
  if(!d.raf){d.raf=true;requestAnimationFrame(()=>{d.raf=false;BMH.render({preserveScroll:true});});}
});
window.addEventListener('pointerup',()=>{const d=BMH.drag;if(!d)return;BMH.drag=null;if(d.changed){BMH.save();BMH.render({preserveScroll:true});}});

document.addEventListener('keydown',e=>{
  if(BMH.state.ui.step!==5)return;
  const tag=(e.target?.tagName||'').toLowerCase();if(tag==='input'||tag==='select'||tag==='textarea')return;
  if(e.key==='Escape'&&BMH.state.ui.planner.tool!=='select'){BMH.state.ui.planner.tool='select';BMH.save();BMH.render();BMH.toast('Đã trở về công cụ chọn.');return;}
  if(!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()==='d'){BMH.state.ui.planner.tool='door';BMH.save();BMH.render();BMH.toast('Công cụ cửa đi · nhấp lên cạnh tường.');return;}
  if(!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()==='w'){BMH.state.ui.planner.tool='window';BMH.save();BMH.render();BMH.toast('Công cụ cửa sổ · nhấp lên cạnh tường.');return;}
  if(!e.ctrlKey&&!e.metaKey&&e.key.toLowerCase()==='f'){BMH.state.ui.planner.zoom=1;BMH.save();BMH.render();return;}
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?BMH.redoPlan():BMH.undoPlan();}
});

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')BMH.save();}); window.addEventListener('pagehide',BMH.save);
window.addEventListener('load',()=>{try{if('serviceWorker'in navigator)navigator.serviceWorker.getRegistrations().then(rs=>Promise.all(rs.map(r=>r.unregister()))).catch(()=>{});if('caches'in window)caches.keys().then(keys=>Promise.all(keys.filter(k=>String(k).startsWith('bmh-')).map(k=>caches.delete(k)))).catch(()=>{});}catch(_){}});
globalThis.BuildMyHome=BMH;
if(BMH.DEV){const q=new URLSearchParams(location.search);const qs=Number(q.get('step'));if(qs>=1&&qs<=10)BMH.state.ui.step=qs;if(q.get('unlock')==='1'){BMH.state.access.paid=true;BMH.state.access.source='dev-query';}}
BMH.render();
globalThis.__BMH_BOOT_OK=true;
