BMH.app = BMH.$('#app');
BMH.sidebar = () => `<aside class="sidebar ${BMH.state.ui.sidebarCollapsed?'collapsed':''}"><button class="collapse" data-sidebar aria-label="Thu gọn/mở rộng">${BMH.state.ui.sidebarCollapsed?'›':'‹'}</button><div class="side-brand-mini"><img src="assets/icon.svg"><span>Build My Home</span></div><nav><button data-nav="1" class="${BMH.state.ui.step===1?'active':''}">${BMH.icon('home')}<span>Trang chủ</span></button><button>${BMH.icon('user')}<span>Hồ sơ của tôi</span></button><button>${BMH.icon('folder')}<span>Dự án</span></button><button>${BMH.icon('image')}<span>Thư viện mẫu</span></button><button>${BMH.icon('users')}<span>Nhà thầu</span></button><button data-nav="6">${BMH.icon('cube')}<span>Vật liệu</span></button><button>${BMH.icon('book')}<span>Kiến thức</span></button><button>${BMH.icon('gear')}<span>Cài đặt</span></button></nav><div class="side-quote"><b>⌂</b><span>Ngôi nhà tốt hơn<br>một cuộc sống đẹp hơn</span></div></aside>`;
BMH.header = () => `<header class="topbar"><div class="brand"><img src="assets/icon.svg" alt=""><div><b>Build My Home</b><span>Kiến tạo tổ ấm, vững bền tương lai</span></div></div><div class="header-actions"><button class="location-chip" data-nav="3">${BMH.icon('pin')} ${BMH.esc(BMH.state.project.site.province)}</button><span class="lang">◎ Tiếng Việt</span><button class="icon-btn">${BMH.icon('bell')}</button><div class="profile"><span class="avatar">N</span><div><b>Nguyễn Thị Lan</b><small>Gia đình nhỏ, Ước mơ lớn</small></div></div></div></header>`;
BMH.stepper = () => `<nav class="stepper">${BMH.STEPS.map(([short],i)=>{const n=i+1,locked=n>=9&&!BMH.isUnlocked(),active=BMH.state.ui.step===n,done=n<BMH.state.ui.step&&!locked;return `<button data-nav="${n}" class="step ${active?'active':''} ${done?'done':''} ${locked?'locked':''}" ${locked?'aria-label="Bước đang khóa"':''}><i>${locked?'🔒':done?'✓':n}</i><span>${short}</span></button>`}).join('')}</nav>`;
BMH.footer = () => {const step=BMH.state.ui.step,next=step+1,blocked=step===8&&!BMH.isUnlocked(),e=BMH.estimate();return `<div class="step-footer official-footer"><button class="footer-back" data-nav="${step-1}" ${step===1?'disabled':''}>${BMH.icon('back')} Quay lại</button><div class="footer-budget"><span><small>Ngân sách tối đa</small><b>${BMH.money(e.budget)}</b></span><span><small>Dự toán hiện tại</small><b>${BMH.money(e.total)}</b></span><span class="${e.gap>=0?'good':'bad'}"><small>${e.gap>=0?'Còn dự phòng':'Vượt ngân sách'}</small><b>${BMH.money(Math.abs(e.gap))}</b></span></div>${step<10?`<button class="primary footer-next" data-nav="${next}" ${blocked?'disabled title="Hoàn tất thanh toán để tiếp tục"':''}>${blocked?'🔒 Hoàn tất thanh toán':'Tiếp theo'} ${BMH.icon('arrow')}</button>`:'<button class="primary footer-next" disabled>Hoàn thành</button>'}</div>`};
BMH.amountBar = () => {const e=BMH.estimate();return `<div class="amountbar"><div><small>Ngân sách tối đa</small><strong>${BMH.money(e.budget)}</strong></div><div><small>Dự toán hiện tại</small><strong class="${e.total>e.budget?'bad':''}">${BMH.money(e.total)}</strong></div><div><small>${e.gap>=0?'Còn dự phòng':'Vượt ngân sách'}</small><strong class="${e.gap>=0?'good':'bad'}">${BMH.money(Math.abs(e.gap))}</strong></div></div>`};
BMH.render = ({preserveScroll=false}={}) => {
  const sy=window.scrollY, step=BMH.state.ui.step; const screen=BMH.SCREENS[step-1]||BMH.screen1;
  BMH.app.innerHTML=`${BMH.header()}${BMH.sidebar()}<main class="main ${step===5?'planner-page':''}">${BMH.stepper()}<div class="screen">${screen()}</div>${BMH.footer()}</main>`;
  document.documentElement.dataset.version=BMH.VERSION; document.title=`Build My Home · ${BMH.STEPS[step-1][1]}`;
  if(preserveScroll)window.scrollTo(0,sy); requestAnimationFrame(BMH.afterRender);
};
BMH.navigateTo = step => {
  step=BMH.clamp(Number(step)||1,1,10); if(step>=9&&!BMH.isUnlocked()){BMH.state.ui.step=8;BMH.save();BMH.render();BMH.toast('Bước 9 và 10 chỉ mở sau khi thanh toán được xác nhận.');return false;}
  BMH.state.ui.step=step; if(step!==5)BMH.drag=null; BMH.save(); BMH.render(); window.scrollTo({top:0,behavior:'smooth'}); return true;
};
BMH.openPaywall = () => {BMH.navigateTo(8);BMH.toast('Hoàn tất thanh toán tại Bước 8 để mở hồ sơ premium.');};
BMH.afterRender = () => {
  if(BMH.state.ui.step===3) BMH.initMap();
  if(BMH.state.ui.step===5 && window.innerWidth>1180 && !BMH.state.ui.sidebarCollapsed){BMH.state.ui.sidebarCollapsed=true;BMH.save();BMH.render();}
};
BMH.initMap = () => {
  const el=BMH.$('#map'); if(!el)return; const s=BMH.state.project.site;
  try{if(BMH.map){BMH.map.remove();BMH.map=null;} if(!window.L)throw new Error('Leaflet unavailable'); BMH.map=L.map(el,{zoomControl:true}).setView([s.lat,s.lng],12); let tileErrors=0,tileLoads=0; const layer=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'© OpenStreetMap contributors'}).addTo(BMH.map); layer.on('tileerror',()=>{tileErrors++;if(tileErrors>=3)el.classList.add('fallback-only')}); layer.on('tileload',()=>{tileLoads++;if(tileLoads>=3&&tileErrors<3)el.classList.remove('fallback-only')}); BMH.mapMarker=L.marker([s.lat,s.lng]).addTo(BMH.map).bindPopup(`${BMH.esc(s.district||'')} · ${BMH.esc(s.province)}`).openPopup(); setTimeout(()=>BMH.map?.invalidateSize(true),80); window.addEventListener('resize',BMH.mapResize,{once:true});}
  catch(e){el.classList.add('fallback-only');}
};
BMH.mapResize = () => BMH.map?.invalidateSize(true);

BMH.app.addEventListener('click',e=>{
  const nav=e.target.closest('[data-nav]'); if(nav){e.preventDefault();BMH.navigateTo(nav.dataset.nav);return;}
  const start=e.target.closest('[data-start]'); if(start){BMH.state.project.source=start.dataset.start;BMH.save(); if(start.dataset.start==='photo')BMH.$('#uploadPhoto')?.click(); else if(start.dataset.start==='plan')BMH.$('#uploadPlan')?.click(); else BMH.navigateTo(2); return;}
  if(e.target.closest('[data-sidebar]')){BMH.state.ui.sidebarCollapsed=!BMH.state.ui.sidebarCollapsed;BMH.save();BMH.render();return;}
  const bank=e.target.closest('[data-bank]'); if(bank){const b=BMH.BANKS.find(x=>x.id===bank.dataset.bank);if(b){Object.assign(BMH.state.project.finance,{bank:b.id,introRate:b.intro,postRate:b.post,promoMonths:b.months});BMH.save();BMH.render();BMH.toast(`Đã nạp kịch bản ${b.name}; vẫn có thể chỉnh tay.`);}return;}
  if(e.target.closest('[data-map-refresh]')){const r=BMH.REGIONS[BMH.state.project.site.province];if(r){BMH.state.project.site.lat=r.lat;BMH.state.project.site.lng=r.lng;BMH.save();BMH.render();}return;}
  const soil=e.target.closest('[data-soil]');if(soil){BMH.state.project.site.soil=soil.dataset.soil;BMH.save();BMH.render();return;}
  const addPerson=e.target.closest('[data-household-add]');if(addPerson){const h=BMH.state.project.household;if(addPerson.dataset.householdAdd==='child')h.children.push({id:BMH.uid('c'),name:`Con ${h.children.length+1}`,birth:new Date().getFullYear()-8,room:'Riêng'});else h.relatives.push({id:BMH.uid('p'),name:`Người thân ${h.relatives.length+1}`,birth:1960,mobility:'Bình thường'});BMH.save();BMH.render();return;}
  const rem=e.target.closest('[data-person-remove]');if(rem){const h=BMH.state.project.household,key=rem.dataset.personRemove==='child'?'children':'relatives';h[key]=h[key].filter(x=>x.id!==rem.dataset.id);BMH.save();BMH.render();return;}

  const dtab=e.target.closest('[data-design-tab]');if(dtab){BMH.state.ui.designTab=dtab.dataset.designTab;BMH.save();BMH.render();return;}
  const mview=e.target.closest('[data-material-view]');if(mview&&!mview.disabled){BMH.state.ui.materialCategory=mview.dataset.materialView;BMH.save();BMH.render();return;}
  const floor=e.target.closest('[data-floor]');if(floor){BMH.state.ui.planner.floor=Number(floor.dataset.floor);const first=BMH.floorRooms()[0];BMH.state.ui.planner.selected=first?.id||null;BMH.save();BMH.render();return;}
  const room=e.target.closest('[data-room-select]');if(room){BMH.state.ui.planner.selected=room.dataset.roomSelect;BMH.save();BMH.render();return;}
  const addRoom=e.target.closest('[data-add-room]');if(addRoom){BMH.addRoom(addRoom.dataset.addRoom);return;}
  const opening=e.target.closest('[data-add-opening]');if(opening){BMH.addOpening(opening.dataset.addOpening);return;}
  if(e.target.closest('[data-room-delete]')){const id=BMH.state.ui.planner.selected;BMH.state.project.plan.rooms=BMH.state.project.plan.rooms.filter(r=>r.id!==id);BMH.state.project.plan.openings=BMH.state.project.plan.openings.filter(o=>o.roomId!==id);BMH.state.ui.planner.selected=BMH.floorRooms()[0]?.id||null;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-planner-fit]')){BMH.state.ui.planner.zoom=1;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-planner-fullscreen]')){const el=BMH.$('.drawing'); if(el?.requestFullscreen) el.requestFullscreen().catch(()=>BMH.toast('Trình duyệt không cho phép toàn màn hình.')); return;}
  const tier=e.target.closest('[data-tier]');if(tier){const before=BMH.estimate().total;BMH.state.project.materials.tier=tier.dataset.tier;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const material=e.target.closest('[data-material]');if(material){const before=BMH.estimate().total,cat=material.dataset.materialCat;BMH.state.project.materials.choices[cat]=material.dataset.material;const after=BMH.estimate().total;BMH.state.project.materials.lastDelta=after-before;BMH.save();BMH.render();return;}
  const sm=e.target.closest('[data-scene-mode]');if(sm){BMH.state.ui.sceneMode=sm.dataset.sceneMode;BMH.save();BMH.render();return;}
  if(e.target.closest('[data-scene-theme]')){BMH.state.ui.sceneTheme=BMH.state.ui.sceneTheme==='day'?'night':'day';BMH.save();BMH.render();return;}
  const wear=e.target.closest('[data-wear]');if(wear){BMH.state.project.wearYear=Number(wear.dataset.wear);BMH.save();BMH.render();return;}
  const copy=e.target.closest('[data-copy]');if(copy){navigator.clipboard?.writeText(copy.dataset.copy).then(()=>BMH.toast('Đã sao chép.')).catch(()=>BMH.toast('Không thể sao chép tự động.'));return;}
  if(e.target.closest('[data-dev-pay]')&&BMH.DEV){BMH.state.access.paid=!BMH.state.access.paid;BMH.state.access.source=BMH.state.access.paid?'dev-local':'none';BMH.state.access.paidAt=BMH.state.access.paid?new Date().toISOString():null;BMH.save();BMH.render();return;}
  const exp=e.target.closest('[data-export]');if(exp){({loan:BMH.exportLoan,estimate:BMH.exportEstimate,plan:BMH.exportPlanSvg,json:BMH.exportProjectJson,bundle:BMH.exportBundle}[exp.dataset.export]?.());return;}
  if(e.target.closest('[data-print]')){window.print();return;}
});

BMH.app.addEventListener('change',e=>{
  const t=e.target;
  if(t.dataset.path){let v=t.type==='number'?Number(t.value)*(Number(t.dataset.scale)||1):t.value;BMH.set(t.dataset.path,v); if(t.dataset.path==='project.site.province'){const r=BMH.REGIONS[v];if(r){BMH.state.project.site.lat=r.lat;BMH.state.project.site.lng=r.lng;BMH.save();BMH.render();}} return;}
  if(t.dataset.person){const h=BMH.state.project.household,list=t.dataset.person==='child'?h.children:h.relatives,p=list.find(x=>x.id===t.dataset.id);if(p){p[t.dataset.key]=t.type==='number'?Number(t.value):t.value;BMH.save();BMH.render();}return;}
  if(t.dataset.planner){const ui=BMH.state.ui.planner;if(t.dataset.planner==='snap')ui.snap=Number(t.value);if(t.dataset.planner==='furniture')ui.showFurniture=t.checked;if(t.dataset.planner==='dimensions')ui.showDimensions=t.checked;if(t.dataset.planner==='feng')ui.showFeng=t.checked;BMH.save();BMH.render();return;}
  if(t.dataset.roomField){const r=BMH.selectedRoom();if(!r)return;const key=t.dataset.roomField,old={...r};r[key]=['x','y','w','h'].includes(key)?Number(t.value):t.value;if(['x','y','w','h'].includes(key)){r[key]=BMH.roundTo(r[key],BMH.state.ui.planner.snap);if(!BMH.roomValid(r)){Object.assign(r,old);BMH.toast('Giá trị mới gây chồng phòng hoặc vượt ranh.');}}BMH.save();BMH.render();return;}
  if(t.matches('[data-scene-focus]')){BMH.state.ui.sceneFocus=t.value;BMH.save();BMH.render();return;}
  if(t.dataset.check){BMH.state.project.checklist[t.dataset.check]=t.checked;BMH.save();return;}
});

BMH.app.addEventListener('pointerdown',e=>{
  if(BMH.state.ui.step!==5)return; const handle=e.target.closest('[data-resize-id]'),group=e.target.closest('[data-room-id]'); const id=handle?.dataset.resizeId||group?.dataset.roomId;if(!id)return; const r=BMH.state.project.plan.rooms.find(x=>x.id===id);if(!r)return; const svg=BMH.$('#plannerSvg');if(!svg)return; const rect=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal; BMH.drag={id,mode:handle?'resize':'move',startX:e.clientX,startY:e.clientY,scaleX:vb.width/rect.width,scaleY:vb.height/rect.height,original:{...r},raf:false}; BMH.state.ui.planner.selected=id; e.preventDefault();
});
window.addEventListener('pointermove',e=>{const d=BMH.drag;if(!d)return; const r=BMH.state.project.plan.rooms.find(x=>x.id===d.id);if(!r)return; const dx=(e.clientX-d.startX)*d.scaleX,dy=(e.clientY-d.startY)*d.scaleY,s=BMH.state.ui.planner.snap,site=BMH.state.project.site;if(d.mode==='move'){r.x=BMH.clamp(BMH.roundTo(d.original.x+dx,s),0,site.width-r.w);r.y=BMH.clamp(BMH.roundTo(d.original.y+dy,s),0,site.depth-r.h);}else{r.w=BMH.clamp(BMH.roundTo(d.original.w+dx,s),.6,site.width-r.x);r.h=BMH.clamp(BMH.roundTo(d.original.h+dy,s),.6,site.depth-r.y);} if(!d.raf){d.raf=true;requestAnimationFrame(()=>{d.raf=false;BMH.render({preserveScroll:true});});}});
window.addEventListener('pointerup',()=>{const d=BMH.drag;if(!d)return; const r=BMH.state.project.plan.rooms.find(x=>x.id===d.id); if(r&&!BMH.roomValid(r)){Object.assign(r,d.original);BMH.toast('Không thể đặt phòng chồng lên không gian khác. Vị trí cũ đã được giữ lại.');} BMH.drag=null;BMH.save();BMH.render({preserveScroll:true});});

BMH.$('#uploadPhoto')?.addEventListener('change',e=>{if(e.target.files?.[0]){BMH.toast('Đã nhận ảnh tham khảo. Tiếp tục nhập thông tin dự án.');BMH.navigateTo(2);}});
BMH.$('#uploadPlan')?.addEventListener('change',e=>{if(e.target.files?.[0]){BMH.toast('Đã nhận bản vẽ tham chiếu. Bạn có thể đối chiếu ở Bước 5.');BMH.navigateTo(2);}});

document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')BMH.save();}); window.addEventListener('pagehide',BMH.save);
if('serviceWorker' in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
globalThis.BuildMyHome=BMH;
if(BMH.DEV){const q=new URLSearchParams(location.search);const qs=Number(q.get('step'));if(qs>=1&&qs<=10)BMH.state.ui.step=qs;if(q.get('unlock')==='1'){BMH.state.access.paid=true;BMH.state.access.source='dev-query';}}
BMH.render();
