'use strict';
(()=>{
  if(typeof state==='undefined'||!Array.isArray(screens)||typeof render!=='function'||typeof calc!=='function') return;
  const V2_VERSION='2.0.0';
  const DEV_MODE=location.protocol==='file:'||['localhost','127.0.0.1'].includes(location.hostname);
  const baseScreens=screens.slice();
  const baseRender=render;
  const baseValidate=validateProject;
  const basePlanSvg=planSvg;
  const bankData=globalThis.BMH_DESIGN_POLISH?.banks||[];
  const roomViews=globalThis.BMH_DESIGN_POLISH?.roomViews||{};
  const vnd=new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0});
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  const snap=(n,g)=>Math.round(n/g)*g;
  const uid=p=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,6);

  Object.assign(defaults,{
    v2Version:V2_VERSION,
    householdChildren:[],
    householdParents:[],
    partnerPresent:true,
    plannerGrid:.2,
    plannerShowFeng:true,
    sidebarCollapsed:false,
    wearYear:0,
    lastCostDelta:0,
    paymentEntitlement:'locked',
    paymentOrderId:'',
    paymentAccount:'',
    paymentContent:'',
    paymentBank:'MB Bank'
  });

  function normalizeChild(x,i){return {id:String(x?.id||`child-${i+1}`),name:String(x?.name||`Con ${i+1}`),birth:clamp(Number(x?.birth)||2012-i*2,1900,2100),gender:['Nam','Nữ','Không chọn'].includes(x?.gender)?x.gender:'Không chọn',room:['Riêng','Ngủ chung','Chưa quyết định'].includes(x?.room)?x.room:'Chưa quyết định'};}
  function normalizeParent(x,i){return {id:String(x?.id||`parent-${i+1}`),name:String(x?.name||`Ba/mẹ ${i+1}`),birth:clamp(Number(x?.birth)||1962-i*2,1900,2100),mobility:['Bình thường','Hạn chế vận động','Cần hỗ trợ'].includes(x?.mobility)?x.mobility:'Bình thường'};}
  if(!Array.isArray(state.householdChildren)) state.householdChildren=state.childBirth?[normalizeChild({birth:state.childBirth},0)]:[];
  else state.householdChildren=state.householdChildren.slice(0,8).map(normalizeChild);
  if(!Array.isArray(state.householdParents)){
    state.householdParents=[];
    if(state.parent1Birth)state.householdParents.push(normalizeParent({birth:state.parent1Birth},0));
    if(state.parent2Birth)state.householdParents.push(normalizeParent({birth:state.parent2Birth},1));
  } else state.householdParents=state.householdParents.slice(0,6).map(normalizeParent);
  state.partnerPresent=state.partnerPresent!==false;
  state.plannerGrid=[.1,.2,.5].includes(Number(state.plannerGrid))?Number(state.plannerGrid):.2;
  state.plannerShowFeng=state.plannerShowFeng!==false;
  state.sidebarCollapsed=state.sidebarCollapsed===true;
  state.wearYear=[0,3,5,10].includes(Number(state.wearYear))?Number(state.wearYear):0;
  state.lastCostDelta=Number(state.lastCostDelta)||0;
  state.paymentEntitlement=['verified','dev'].includes(state.paymentEntitlement)?state.paymentEntitlement:'locked';
  if(!DEV_MODE&&state.paymentEntitlement==='dev')state.paymentEntitlement='locked';
  state.paymentOrderId=state.paymentOrderId||`BMH-${String(Date.now()).slice(-6)}`;
  state.paymentContent=state.paymentContent||state.paymentOrderId;
  state.v2Version=V2_VERSION;
  if(!DEV_MODE) state.paymentUnlocked=state.paymentEntitlement==='verified';
  if(!isUnlocked()&&state.step>7)state.step=7;
  syncPeople();

  validateProject=function(input){
    const base=baseValidate(input);
    base.v2Version=V2_VERSION;
    base.householdChildren=(Array.isArray(input?.householdChildren)?input.householdChildren:[]).slice(0,8).map(normalizeChild);
    base.householdParents=(Array.isArray(input?.householdParents)?input.householdParents:[]).slice(0,6).map(normalizeParent);
    base.partnerPresent=input?.partnerPresent!==false;
    base.plannerGrid=[.1,.2,.5].includes(Number(input?.plannerGrid))?Number(input.plannerGrid):.2;
    base.plannerShowFeng=input?.plannerShowFeng!==false;
    base.sidebarCollapsed=input?.sidebarCollapsed===true;
    base.wearYear=[0,3,5,10].includes(Number(input?.wearYear))?Number(input.wearYear):0;
    base.lastCostDelta=Number(input?.lastCostDelta)||0;
    base.paymentEntitlement=['verified','dev'].includes(input?.paymentEntitlement)?input.paymentEntitlement:'locked';
    base.paymentOrderId=String(input?.paymentOrderId||'').slice(0,80);
    base.paymentAccount=String(input?.paymentAccount||'').slice(0,80);
    base.paymentContent=String(input?.paymentContent||'').slice(0,120);
    base.paymentBank=String(input?.paymentBank||'MB Bank').slice(0,80);
    base.people=1+(base.partnerPresent?1:0)+base.householdChildren.length+base.householdParents.length;
    return base;
  };

  function syncPeople(){state.people=1+(state.partnerPresent?1:0)+state.householdChildren.length+state.householdParents.length;state.elder=state.householdParents.length>0;state.kids=state.householdChildren.length>0;}
  function isUnlocked(){return state.paymentEntitlement==='verified'||(DEV_MODE&&(state.paymentEntitlement==='dev'||state.paymentUnlocked===true));}
  function compactHeader(step,title,accent,sub){return `<section class="v2-stephead"><div><span>BƯỚC ${step} TRONG 10</span><h1>${title} <b>${accent||''}</b></h1><p>${sub}</p></div><div class="v2-stepmeta"><strong>${esc(state.location||'Chưa chọn vị trí')}</strong><small>Build My Home V2</small></div></section>`;}
  function stripHero(html){return String(html).replace(/<section class="polish-hero">[\s\S]*?<\/section>/,'');}
  function paywallModal(){modal(`<div class="v2-lock-modal"><div class="v2-lock-icon">🔒</div><h2>Hồ sơ chuyên sâu đang khóa</h2><p>Vui lòng hoàn tất thanh toán 99.000đ tại Bước 8 để mở Bước 9, Bước 10 và bộ hồ sơ premium.</p><div class="row"><button class="primary" data-v2="go-pay">Đến Bước 8</button><button onclick="document.querySelector('#modal').close()">Đóng</button></div></div>`);}

  const legacyGo=go;
  go=function(n){n=Number(n);if(n>=8&&!isUnlocked()){state.step=7;view='steps';save();render();paywallModal();return;}return legacyGo(n);};

  function stressPayment(rate){const p=(Number(state.loan)||0)*1e6,n=Math.max(1,(Number(state.years)||1)*12),r=Math.max(0,Number(rate)||0)/1200;return state.method==='equal'?p/n+p*r:payment(p,r,n);}
  function financeStress(){const base=Number(state.postRate)||0;return `<section class="card v2-stress"><div class="row between"><div><h3>Kiểm tra sức chịu đựng khi lãi tăng</h3><p class="hint">Không phải dự báo. Lãi thả nổi thực tế có thể cao hơn các kịch bản này.</p></div><span class="badge">Stress test</span></div><div class="v2-stress-grid">${[2,3,5].map(d=>`<div><small>+${d} điểm %</small><b>${vnd.format(stressPayment(Math.min(50,base+d)))} ₫/tháng</b><span>${num(base+d)}%/năm</span></div>`).join('')}</div></section>`;}

  function householdDirections(){const kua=globalThis.BMH_PRODUCT_SUITE?.kua;return kua?.(state.birth,state.ownerGender)?.dirs||[];}
  function childRow(c,i){return `<article class="v2-family-row"><div class="v2-family-avatar">${i+1}</div><label>Tên<input data-v2-child="${esc(c.id)}" data-field="name" value="${esc(c.name)}" maxlength="30"></label><label>Năm sinh<input type="number" min="1900" max="2100" data-v2-child="${esc(c.id)}" data-field="birth" value="${c.birth}"></label><label>Giới tính<select data-v2-child="${esc(c.id)}" data-field="gender">${['Không chọn','Nam','Nữ'].map(x=>`<option ${c.gender===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Phòng ngủ<select data-v2-child="${esc(c.id)}" data-field="room">${['Chưa quyết định','Riêng','Ngủ chung'].map(x=>`<option ${c.room===x?'selected':''}>${x}</option>`).join('')}</select></label><button class="small danger" data-v2="remove-child" data-id="${esc(c.id)}">Xóa</button></article>`;}
  function parentRow(p,i){return `<article class="v2-family-row"><div class="v2-family-avatar elder">${i+1}</div><label>Tên<input data-v2-parent="${esc(p.id)}" data-field="name" value="${esc(p.name)}" maxlength="30"></label><label>Năm sinh<input type="number" min="1900" max="2100" data-v2-parent="${esc(p.id)}" data-field="birth" value="${p.birth}"></label><label class="wide">Khả năng đi lại<select data-v2-parent="${esc(p.id)}" data-field="mobility">${['Bình thường','Hạn chế vận động','Cần hỗ trợ'].map(x=>`<option ${p.mobility===x?'selected':''}>${x}</option>`).join('')}</select></label><button class="small danger" data-v2="remove-parent" data-id="${esc(p.id)}">Xóa</button></article>`;}
  function step4V2(){const kua=globalThis.BMH_PRODUCT_SUITE?.kua,owner=kua?.(state.birth,state.ownerGender),partner=state.partnerPresent?kua?.(state.partnerBirth,state.partnerGender):null,dirs=owner?.dirs||[];return `${compactHeader(4,'Đất, địa chất','& gia đình','Mô hình hộ gia đình động, địa chất sơ bộ và phong thủy tham khảo; công năng/an toàn luôn được ưu tiên trước phong thủy.')}<div class="v2-site-grid"><section class="card">${field('Mặt tiền · m','width',{min:3,max:30,step:.1})}${field('Chiều sâu · m','depth',{min:5,max:60,step:.1})}${field('Số tầng dự kiến','floors',{min:1,max:5})}<div class="v2-lot"><strong>${num(state.width*state.depth)} m²</strong><span>${num(state.width)} × ${num(state.depth)} m</span></div></section><section class="card"><h2>Địa chất & tiếp cận</h2><div class="soil-cards">${[['Đất đồi cứng','⛰'],['Đất thịt đồng bằng','◒'],['Đất trũng ao hồ / ven sông','≋'],['Chưa biết','?']].map(([n,ic])=>`<button class="soil-card ${state.soil===n?'active':''}" data-polish="soil" data-id="${n}"><i>${ic}</i><b>${n}</b></button>`).join('')}</div>${field('Chiều rộng đường vào · m','road',{min:.5,max:40,step:.5})}<p class="notice">Không tự suy ra móng. Cần khảo sát địa chất và thiết kế kết cấu trước thi công.</p></section><section class="card v2-feng"><h2>Gia chủ & người đồng hành</h2><div class="fields">${field('Năm sinh gia chủ','birth',{min:1900,max:2100})}${field('Giới tính gia chủ','ownerGender',{options:['Nam','Nữ']})}</div><label class="checkrow"><input type="checkbox" data-v2="partner-toggle" ${state.partnerPresent?'checked':''}><span>Có người đồng hành sống cùng</span></label>${state.partnerPresent?`<div class="fields">${field('Năm sinh người đồng hành','partnerBirth',{min:1900,max:2100})}${field('Giới tính người đồng hành','partnerGender',{options:['Nam','Nữ']})}</div>`:''}<div class="v2-kua"><span>Gia chủ: <b>${owner?`Cung ${owner.number} · ${owner.group}`:'Chưa đủ dữ liệu'}</b></span>${partner?`<span>Người đồng hành: <b>Cung ${partner.number} · ${partner.group}</b></span>`:''}</div><div class="v2-dir-chips">${dirs.map((d,i)=>`<span>${['Sinh Khí','Thiên Y','Diên Niên','Phục Vị'][i]} · ${d}</span>`).join('')}</div><p class="hint">Phong thủy là tham khảo văn hóa, không thay thế yêu cầu công năng, thông gió, thoát hiểm và an toàn.</p></section></div><section class="card v2-household"><div class="row between"><div><h2>Thành viên sống cùng</h2><p class="hint">Tổng hiện tại: ${state.people} người. Có thể thêm nhiều con và nhiều người thân ở cùng.</p></div><div class="row"><button data-v2="add-child">+ Thêm con</button><button data-v2="add-parent">+ Thêm ba/mẹ/người thân</button></div></div><div class="v2-family-list"><h3>Con cái (${state.householdChildren.length})</h3>${state.householdChildren.length?state.householdChildren.map(childRow).join(''):'<p class="hint">Chưa thêm con.</p>'}<h3>Ba mẹ / người thân (${state.householdParents.length})</h3>${state.householdParents.length?state.householdParents.map(parentRow).join(''):'<p class="hint">Chưa thêm người thân.</p>'}</div><div class="v2-family-advice"><span>${state.householdParents.some(p=>p.mobility!=='Bình thường')?'✓ Ưu tiên phòng tầng trệt + WC gần cho người hạn chế vận động':'○ Chưa có nhu cầu tiếp cận đặc biệt'}</span><span>${state.householdChildren.filter(c=>c.room==='Riêng').length} phòng riêng cho con được yêu cầu</span><span>${state.householdChildren.filter(c=>c.room==='Ngủ chung').length} con có thể dùng phòng chung</span></div></section>`;}

  function collides(room,ignoreId=room.id){return state.rooms.some(r=>r.floor===room.floor&&r.id!==ignoreId&&room.x<r.x+r.w-.001&&room.x+room.w>r.x+.001&&room.y<r.y+r.h-.001&&room.y+room.h>r.y+.001);}
  function overlapIds(){const ids=new Set();for(let i=0;i<state.rooms.length;i++)for(let j=i+1;j<state.rooms.length;j++){const a=state.rooms[i],b=state.rooms[j];if(a.floor===b.floor&&a.x<b.x+b.w-.001&&a.x+a.w>b.x+.001&&a.y<b.y+b.h-.001&&a.y+a.h>b.y+.001){ids.add(a.id);ids.add(b.id);}}return ids;}
  function plannerIssues(){const issues=[];const overlapsNow=overlaps();if(overlapsNow.length)issues.push({sev:'error',text:`Có ${overlapsNow.length} cặp phòng chồng lấn.`});for(let f=0;f<state.floors-1;f++){const a=state.rooms.filter(r=>r.floor===f&&r.type==='stairs'),b=state.rooms.filter(r=>r.floor===f+1&&r.type==='stairs');if(a.length&&b.length){const aligned=a.some(x=>b.some(y=>Math.max(0,Math.min(x.x+x.w,y.x+y.w)-Math.max(x.x,y.x))*Math.max(0,Math.min(x.y+x.h,y.y+y.h)-Math.max(x.y,y.y))>=Math.min(x.w*x.h,y.w*y.h)*.5));if(!aligned)issues.push({sev:'warn',text:`Cầu thang tầng ${f+1} và ${f+2} chưa thẳng trục.`});}else issues.push({sev:'warn',text:`Thiếu khối cầu thang liên kết tầng ${f+1}–${f+2}.`});}
    const upperBaths=state.rooms.filter(r=>r.floor>0&&r.type==='bath');for(const r of upperBaths){const below=state.rooms.filter(x=>x.floor===r.floor-1&&x.type==='bath').some(x=>r.x<x.x+x.w&&r.x+r.w>x.x&&r.y<x.y+x.h&&r.y+r.h>x.y);if(!below)issues.push({sev:'info',text:`${r.name} tầng ${r.floor+1} chưa xếp chồng vùng ướt với WC tầng dưới; nên kiểm tra đường ống.`});}
    for(const r of state.rooms.filter(r=>r.type==='bed')){const ext=Math.abs(r.x)<.001||Math.abs(r.y)<.001||Math.abs(r.x+r.w-state.width)<.001||Math.abs(r.y+r.h-state.depth)<.001;if(!ext)issues.push({sev:'info',text:`${r.name} chưa chạm mặt thoáng ngoài trong sơ đồ; cần kiểm tra lấy sáng/thông gió.`});}
    if(state.householdParents.length&&!state.rooms.some(r=>r.floor===0&&r.type==='bed'))issues.push({sev:'warn',text:'Có ba/mẹ/người thân ở cùng nhưng chưa có phòng ngủ tầng trệt.'});
    const needBedrooms=1+state.householdChildren.filter(c=>c.room==='Riêng').length+(state.householdChildren.some(c=>c.room==='Ngủ chung')?1:0)+(state.householdParents.length?1:0);const actual=state.rooms.filter(r=>r.type==='bed').length;if(actual<needBedrooms)issues.push({sev:'warn',text:`Nhu cầu đang gợi ý khoảng ${needBedrooms} phòng ngủ, mặt bằng hiện có ${actual}.`});
    return issues.slice(0,12);
  }

  const planBase=basePlanSvg;
  planSvg=function(interactive=true,floor=state.floor){let svg=planBase(interactive,floor);const grid=Number(state.plannerGrid)||.2,px=grid*30,W=state.width*30,H=state.depth*30,ov=overlapIds(),dirs=householdDirections();
    const defs=`<defs><pattern id="v2grid" width="${px}" height="${px}" patternUnits="userSpaceOnUse"><path d="M ${px} 0 L 0 0 0 ${px}" fill="none" stroke="#d9e1d7" stroke-width=".35"/></pattern><linearGradient id="v2feng" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dff1dd" stop-opacity=".65"/><stop offset="1" stop-color="#dff1dd" stop-opacity=".08"/></linearGradient></defs>`;
    svg=svg.replace(/<svg([^>]*)>/,`<svg$1>${defs}`);
    svg=svg.replace(/<rect x="0" y="0" width="([^"]+)" height="([^"]+)" fill="#fff"/,`<rect x="0" y="0" width="$1" height="$2" fill="url(#v2grid)"`);
    let overlay='';
    if(state.plannerShowFeng&&dirs.length){const d=dirs[0],pos={Bắc:[W*.25,0,W*.5,H*.28],Nam:[W*.25,H*.72,W*.5,H*.28],Đông:[W*.72,H*.25,W*.28,H*.5],Tây:[0,H*.25,W*.28,H*.5],'Đông Nam':[W*.58,H*.58,W*.42,H*.42],'Đông Bắc':[W*.58,0,W*.42,H*.42],'Tây Nam':[0,H*.58,W*.42,H*.42],'Tây Bắc':[0,0,W*.42,H*.42]}[d];if(pos)overlay+=`<g class="v2-feng-zone" pointer-events="none"><rect x="${pos[0]}" y="${pos[1]}" width="${pos[2]}" height="${pos[3]}" fill="url(#v2feng)" stroke="#6a956f" stroke-dasharray="4 3"/><text x="${pos[0]+6}" y="${pos[1]+14}" font-size="7" fill="#426349">Gợi ý phong thủy · ${esc(d)}</text></g>`;}
    for(const r of state.rooms.filter(x=>x.floor===floor)){const x=r.x*30,y=r.y*30,w=r.w*30,h=r.h*30;const iconType=r.type==='garage'?'car':r.type;let mark='';if(iconType==='garage')mark=`<g stroke="#7c8981" fill="none" opacity=".55"><rect x="${x+w*.18}" y="${y+h*.28}" width="${w*.64}" height="${h*.34}" rx="4"/><circle cx="${x+w*.3}" cy="${y+h*.67}" r="3"/><circle cx="${x+w*.7}" cy="${y+h*.67}" r="3"/></g>`;if(ov.has(r.id))mark+=`<rect x="${x+1}" y="${y+1}" width="${Math.max(0,w-2)}" height="${Math.max(0,h-2)}" fill="none" stroke="#d74337" stroke-width="3" class="v2-collision-mark"/>`;overlay+=mark;}
    overlay+=`<g class="v2-plan-dim" pointer-events="none"><text x="${W/2}" y="${H+39}" text-anchor="middle" font-size="7" fill="#5d6c61">SNAP ${grid.toFixed(1)}m · ${state.rooms.filter(r=>r.floor===floor).length} không gian · chưa phải hồ sơ thi công</text></g>`;
    return svg.replace('</svg>',overlay+'</svg>');
  };

  roomColors.garage='#e9e5de';
  bindDrag=function(){const svg=document.querySelector('#plan');if(!svg)return;let drag=null;const point=e=>new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse());svg.addEventListener('pointerdown',e=>{const handle=e.target.closest('.resize-handle'),g=e.target.closest('[data-room]');if(!g)return;const r=state.rooms.find(x=>x.id===g.dataset.room);if(!r)return;history();const p=point(e);drag={id:r.id,start:p,x:r.x,y:r.y,w:r.w,h:r.h,g,mode:handle?'resize':'move',valid:true};state.selected=r.id;svg.setPointerCapture(e.pointerId);});svg.addEventListener('pointermove',e=>{if(!drag)return;const p=point(e),r=state.rooms.find(x=>x.id===drag.id),grid=Number(state.plannerGrid)||.2;if(!r)return;const candidate={...r};if(drag.mode==='resize'){candidate.w=+clamp(snap(drag.w+(p.x-drag.start.x)/30,grid),.5,state.width-r.x).toFixed(2);candidate.h=+clamp(snap(drag.h+(p.y-drag.start.y)/30,grid),.5,state.depth-r.y).toFixed(2);}else{candidate.x=+clamp(snap(drag.x+(p.x-drag.start.x)/30,grid),0,state.width-r.w).toFixed(2);candidate.y=+clamp(snap(drag.y+(p.y-drag.start.y)/30,grid),0,state.depth-r.h).toFixed(2);}drag.valid=!collides(candidate);drag.g.classList.toggle('v2-collision',!drag.valid);if(drag.mode==='resize'){const rect=drag.g.querySelector('rect');if(rect){rect.setAttribute('width',candidate.w*30);rect.setAttribute('height',candidate.h*30);}}else drag.g.setAttribute('transform',`translate(${(candidate.x-drag.x)*30} ${(candidate.y-drag.y)*30})`);drag.candidate=candidate;});const end=()=>{if(!drag)return;const r=state.rooms.find(x=>x.id===drag.id);if(r&&drag.candidate&&drag.valid)Object.assign(r,drag.candidate);else if(drag.candidate&&!drag.valid)toast('Không thể đặt phòng chồng lên không gian khác. Vị trí cũ được giữ lại.');drag=null;save();render();};svg.addEventListener('pointerup',end);svg.addEventListener('pointercancel',end);svg.addEventListener('keydown',e=>{const g=e.target.closest('[data-room]');if(!g)return;const r=state.rooms.find(x=>x.id===g.dataset.room);if(!r)return;if(e.key==='Enter'){state.selected=r.id;render();return;}const step=Number(state.plannerGrid)||.2,d={ArrowLeft:[-step,0],ArrowRight:[step,0],ArrowUp:[0,-step],ArrowDown:[0,step]}[e.key];if(d){e.preventDefault();const c={...r,x:+clamp(snap(r.x+d[0],step),0,state.width-r.w).toFixed(2),y:+clamp(snap(r.y+d[1],step),0,state.depth-r.h).toFixed(2)};if(collides(c))return toast('Di chuyển này làm phòng chồng lấn.');history();Object.assign(r,c);state.selected=r.id;save();render();document.querySelector(`[data-room="${CSS.escape(r.id)}"]`)?.focus();}});};

  function plannerScreen(c){const issues=plannerIssues();return `${compactHeader(5,'Bản vẽ','thiết kế','Planner V2 có lưới từ tính, chống chồng phòng, kiểm tra liên tầng và gợi ý công năng; vẫn là mặt bằng kiến trúc sơ bộ, không thay hồ sơ thi công.')}<section class="card v2-planner-tools"><div class="row between"><div><h3>Công cụ mặt bằng</h3><p class="hint">Snap theo lưới để tránh khe 5–10cm và sai lệch kích thước.</p></div><div class="row"><label class="v2-inline">Lưới<select data-v2="planner-grid"><option value="0.1" ${state.plannerGrid===.1?'selected':''}>0,1 m</option><option value="0.2" ${state.plannerGrid===.2?'selected':''}>0,2 m</option><option value="0.5" ${state.plannerGrid===.5?'selected':''}>0,5 m</option></select></label><label class="checkrow compact"><input type="checkbox" data-v2="planner-feng" ${state.plannerShowFeng?'checked':''}><span>Hiện vùng phong thủy</span></label><button data-v2="add-garage">+ Gara</button></div></div></section>${editor(c)}<section class="card v2-validator"><div class="row between"><div><h2>Kiểm tra mặt bằng V2</h2><p class="hint">Kiểm tra hình học/công năng sơ bộ. Các kết luận kết cấu, PCCC, MEP và pháp lý vẫn cần chuyên gia có thẩm quyền.</p></div><span class="badge ${issues.some(x=>x.sev==='error')?'warn':''}">${issues.length?issues.length+' lưu ý':'Không có xung đột cơ bản'}</span></div><div class="v2-issue-grid">${issues.length?issues.map(x=>`<article class="${x.sev}"><b>${x.sev==='error'?'!':x.sev==='warn'?'△':'i'}</b><span>${esc(x.text)}</span></article>`).join(''):'<article class="ok"><b>✓</b><span>Không phát hiện chồng phòng hoặc lỗi liên tầng cơ bản.</span></article>'}</div><div class="v2-technical-scope"><span><b>Đã kiểm tra</b>Ranh đất, chồng phòng, snap lưới, liên kết cầu thang, vùng ướt, nhu cầu phòng ngủ.</span><span><b>Chưa thay thế KTS/KC</b>Cột/dầm/móng, tải trọng, kích thước thang chi tiết, MEP, PCCC, hồ sơ xin phép.</span></div></section>`;}

  function wearPanel(c){const y=state.wearYear,ratio=y===0?0:y===3?.25:y===5?.48:.88,paint=Math.round((c.snapshot.geometry.paintArea||0)*85000*(y===10?1:y===5?.55:y===3?.3:0));const note=y===0?'Bề mặt mới — dùng làm mốc so sánh.':y===3?'Có thể xuất hiện bạc màu nhẹ ở hướng nắng/gió mạnh.':y===5?'Nên kiểm tra nứt chân chim, ron ngoài trời và lớp phủ chống thấm.':'Đến mốc 10 năm nên lập kế hoạch sơn lại, xử lý chống thấm và kiểm tra cửa/ron.';return `<section class="card v2-wear"><div class="row between"><div><h2>Tua nhanh vòng đời công trình</h2><p class="hint">Minh họa kế hoạch bảo trì, không phải dự đoán hư hỏng chắc chắn.</p></div><strong>Năm ${y}</strong></div><div class="v2-wear-slider">${[0,3,5,10].map(n=>`<button data-v2="wear" data-year="${n}" class="${y===n?'active':''}">${n===0?'Hiện tại':'Năm '+n}</button>`).join('')}</div><div class="v2-wear-note"><i style="--wear:${Math.round(ratio*100)}%"></i><div><b>${note}</b><span>${y?`Quỹ sơn/bề mặt tham khảo ở mốc này: khoảng ${money(paint)}.`:'Chưa phát sinh bảo trì theo mô phỏng.'}</span></div></div></section>`;}

  function paymentCardV2(){const configured=Boolean(state.paymentAccount),content=state.paymentContent||state.paymentOrderId;return `<aside class="paywall-card v2-pay"><div class="pay-head"><span class="pay-lock">🔒</span><div><small>MỞ KHÓA BƯỚC 9 + 10 & HỒ SƠ PREMIUM</small><h2>99.000đ</h2><p>Một lần thanh toán cho checklist giám sát và bộ hồ sơ PDF/Excel/ZIP.</p></div></div><div class="qr-zone"><div class="qr-box"><img src="assets/design/vietqr-demo.png" alt="QR minh họa VietQR"><b>VietQR · ${esc(state.paymentBank)}</b><small>${configured?'QR cần thay bằng mã thật của đơn hàng':'DEMO — CHƯA CẤU HÌNH NHẬN TIỀN'}</small></div><div class="bank-pay-info"><img src="assets/banks/mb.jpg" alt="MB Bank"><dl><dt>Ngân hàng</dt><dd>${esc(state.paymentBank)}</dd><dt>Số tài khoản</dt><dd>${configured?esc(state.paymentAccount):'Chưa cấu hình'}</dd><dt>Số tiền</dt><dd><b>99.000 VND</b></dd><dt>Nội dung</dt><dd>${esc(content)}</dd></dl><div class="v2-copy-row"><button data-v2="copy" data-copy="account" ${configured?'':'disabled'}>Sao chép số tài khoản</button><button data-v2="copy" data-copy="content">Sao chép nội dung</button></div></div></div><div class="pay-process">${[['1','Tạo đơn'],['2','Quét VietQR'],['3','Webhook xác minh'],['4','Mở khóa 9 + 10']].map(([n,t])=>`<span><i>${n}</i>${t}</span>`).join('')}</div><div class="pay-rights"><b>Sau khi xác minh thanh toán:</b><span>✓ Bước 9 · giám sát & checklist MEP</span><span>✓ Bước 10 · PDF / Excel / ZIP</span><span>✓ Entitlement dùng chung, không thể bỏ qua Bước 9 để tải file</span></div>${DEV_MODE?'<button class="v2-devpay" data-v2="dev-unlock">DEV: bật/tắt thanh toán</button>':''}<p class="pay-warning">Production chỉ mở khóa khi có entitlement được xác minh. Bản V2 không giả giao dịch ngân hàng khi chưa có backend/webhook thật.</p></aside>`;}

  // Remove repeated cinematic banners from all working steps except the dedicated 3D step.
  screens[0]=()=>baseScreens[0]().replace('assets/design/hero-step1.jpg','assets/rooms/facade-render.jpg');
  screens[1]=c=>compactHeader(2,'Hồ sơ tài chính','& DTI','Chọn ngân hàng để tự điền dữ liệu công khai có nguồn; người dùng vẫn có thể chỉnh theo đề nghị tín dụng thực tế.')+stripHero(baseScreens[1](c))+financeStress();
  screens[2]=c=>compactHeader(3,'Vị trí','& khí hậu vùng','Một địa phương duy nhất được dùng xuyên suốt header, bản đồ và dữ liệu dự án.')+stripHero(baseScreens[2](c));
  screens[3]=()=>step4V2();
  screens[4]=c=>plannerScreen(c);
  screens[5]=c=>compactHeader(6,'Gói','vật liệu','Chọn vật liệu bằng hình ảnh, nguồn và ngày; mọi thay đổi hiển thị chênh lệch chi phí tức thời.')+stripHero(baseScreens[5](c))+`<div class="v2-cost-delta ${state.lastCostDelta>=0?'up':'down'}"><span>Thay đổi gần nhất</span><b>${state.lastCostDelta>=0?'+':''}${money(state.lastCostDelta)}</b><small>so với phương án ngay trước thao tác vật liệu/gói</small></div>`;
  screens[6]=c=>baseScreens[6](c)+wearPanel(c);
  screens[7]=c=>{let html=compactHeader(8,'Dự toán','& thanh toán','Above-the-fold: bảng dự toán bên trái, VietQR/paywall bên phải; không còn banner 3D chiếm chỗ.')+stripHero(baseScreens[7](c));html=html.replace(/<aside class="paywall-card">[\s\S]*?<\/aside>/,paymentCardV2());return html;};
  screens[8]=c=>compactHeader(9,'Giám sát thi công','& checklist MEP','Bước premium dùng chung entitlement với Bước 10; chưa thanh toán sẽ không cho vượt qua Stepper.')+stripHero(baseScreens[8](c));
  screens[9]=c=>compactHeader(10,'Hồ sơ bàn giao','& giải ngân','Tất cả PDF/Excel/ZIP premium kiểm tra cùng entitlement; không còn lỗ hổng bỏ qua Bước 9.')+stripHero(baseScreens[9](c));

  function estimateTotalFor(patch){try{return globalThis.BMHCore.buildSnapshot({...state,...patch}).quote.total;}catch{return calc().total;}}
  function applyTier(next){const before=calc().total,after=estimateTotalFor({tier:next});state.lastCostDelta=after-before;state.tier=next;save();render();toast(`${state.lastCostDelta>=0?'+':''}${vnd.format(state.lastCostDelta)}đ so với phương án trước.`);}
  function applyMaterial(cat,id){const data=globalThis.BMH_DESIGN_POLISH?.materials?.[cat]||[];const p=data.find(x=>x.id===id);if(!p)return;const before=calc().total;const materialChoices={...(state.materialChoices||{}),[cat]:id},material={...state.material,[cat]:p.level};const after=estimateTotalFor({materialChoices,material});state.materialChoices=materialChoices;state.material=material;state.lastCostDelta=after-before;save();render();toast(`${state.lastCostDelta>=0?'+':''}${vnd.format(state.lastCostDelta)}đ do thay đổi vật liệu.`);}

  document.addEventListener('click',e=>{
    const step=e.target.closest('[data-action="step"]');if(step&&Number(step.dataset.value)>=8&&!isUnlocked()){e.preventDefault();e.stopPropagation();paywallModal();return;}
    const premium=e.target.closest('[data-up="bundle"],[data-polish="estimate-excel"],[data-polish="checklist-excel"]');if(premium&&!isUnlocked()&&state.step>=8){e.preventDefault();e.stopPropagation();paywallModal();return;}
    const premiumPrint=e.target.closest('[data-action="print"]');if(premiumPrint&&!isUnlocked()&&state.step===9){e.preventDefault();e.stopPropagation();paywallModal();return;}
    const tier=e.target.closest('[data-action="tier"]');if(tier){e.preventDefault();e.stopPropagation();applyTier(Number(tier.dataset.value));return;}
    const mat=e.target.closest('[data-polish="material"]');if(mat){e.preventDefault();e.stopPropagation();applyMaterial(mat.dataset.cat,mat.dataset.id);return;}
    const bank=e.target.closest('[data-polish="bank"]');if(bank){e.preventDefault();e.stopPropagation();const b=bankData.find(x=>x.id===bank.dataset.id);state.bank=bank.dataset.id;if(b?.rate!==null&&Number.isFinite(b?.rate)){state.rate=b.rate;if(Number.isFinite(b.promo))state.promo=b.promo;if(Number.isFinite(b.post))state.postRate=b.post;}save();render();toast(b?.rate!==null?'Đã đồng bộ mức công khai có nguồn; vẫn có thể chỉnh tay.':'Ngân hàng chưa có mức đủ căn cứ để tự điền; giữ kịch bản người dùng.');return;}
    const x=e.target.closest('[data-v2]');if(!x)return;const a=x.dataset.v2;
    if(a==='go-pay'){document.querySelector('#modal')?.close();legacyGo(7);return;}
    if(a==='add-child'){if(state.householdChildren.length>=8)return toast('Bản V2 hỗ trợ tối đa 8 hồ sơ con trong giao diện này.');state.householdChildren.push(normalizeChild({id:uid('child-'),name:`Con ${state.householdChildren.length+1}`,birth:new Date().getFullYear()-8},state.householdChildren.length));syncPeople();save();render();return;}
    if(a==='remove-child'){state.householdChildren=state.householdChildren.filter(c=>c.id!==x.dataset.id);syncPeople();save();render();return;}
    if(a==='add-parent'){if(state.householdParents.length>=6)return toast('Đã đạt giới hạn 6 người thân ở cùng trong giao diện này.');state.householdParents.push(normalizeParent({id:uid('parent-'),name:`Người thân ${state.householdParents.length+1}`,birth:1960},state.householdParents.length));syncPeople();save();render();return;}
    if(a==='remove-parent'){state.householdParents=state.householdParents.filter(p=>p.id!==x.dataset.id);syncPeople();save();render();return;}
    if(a==='add-garage'){const floor=state.floor,w=Math.min(3,state.width),h=Math.min(5,state.depth);let pos=null;for(let y=0;y<=state.depth-h&&!pos;y+=state.plannerGrid)for(let xx=0;xx<=state.width-w&&!pos;xx+=state.plannerGrid){const r={floor,x:xx,y,w,h,id:'tmp'};if(!collides(r,'tmp'))pos={x:+xx.toFixed(2),y:+y.toFixed(2)};}if(!pos)return toast('Không còn vùng trống đủ cho gara mẫu.');history();const r={id:uid('garage-'),floor,name:'Gara',x:pos.x,y:pos.y,w,h,type:'garage'};state.rooms.push(r);state.selected=r.id;save();render();return;}
    if(a==='wear'){state.wearYear=Number(x.dataset.year);save();render();return;}
    if(a==='copy'){const text=x.dataset.copy==='account'?state.paymentAccount:(state.paymentContent||state.paymentOrderId);if(!text)return toast('Chưa có dữ liệu để sao chép.');navigator.clipboard?.writeText(text).then(()=>toast('Đã sao chép.')).catch(()=>toast('Không thể sao chép tự động; hãy nhấn giữ để sao chép.'));return;}
    if(a==='dev-unlock'&&DEV_MODE){state.paymentUnlocked=!isUnlocked();state.paymentEntitlement=state.paymentUnlocked?'dev':'locked';save();render();toast(state.paymentUnlocked?'DEV: đã mở khóa 9 + 10':'DEV: đã khóa lại');return;}
    if(a==='sidebar'){state.sidebarCollapsed=!state.sidebarCollapsed;save();render();return;}
  },true);

  document.addEventListener('change',e=>{
    const t=e.target;
    if(t.matches('[data-v2="partner-toggle"]')){state.partnerPresent=t.checked;syncPeople();save();render();return;}
    if(t.matches('[data-v2="planner-grid"]')){state.plannerGrid=Number(t.value);save();render();return;}
    if(t.matches('[data-v2="planner-feng"]')){state.plannerShowFeng=t.checked;save();render();return;}
    if(t.dataset.v2Child){const c=state.householdChildren.find(x=>x.id===t.dataset.v2Child);if(!c)return;const f=t.dataset.field;c[f]=f==='birth'?clamp(Number(t.value),1900,2100):t.value;syncPeople();save();return;}
    if(t.dataset.v2Parent){const p=state.householdParents.find(x=>x.id===t.dataset.v2Parent);if(!p)return;const f=t.dataset.field;p[f]=f==='birth'?clamp(Number(t.value),1900,2100):t.value;syncPeople();save();return;}
  },true);

  document.addEventListener('keydown',e=>{if(DEV_MODE&&e.ctrlKey&&e.shiftKey&&e.key.toLowerCase()==='u'){e.preventDefault();state.paymentUnlocked=!isUnlocked();state.paymentEntitlement=state.paymentUnlocked?'dev':'locked';save();render();toast(`DEV entitlement: ${state.paymentUnlocked?'UNLOCKED':'LOCKED'}`);}},true);

  const previousRenderV2=render;
  render=function(){previousRenderV2();document.documentElement.dataset.bmhVersion=V2_VERSION;document.body.dataset.wearYear=String(state.wearYear||0);document.body.classList.toggle('v2-sidebar-collapsed',state.sidebarCollapsed);const sb=document.querySelector('.sidebar');if(sb&&!sb.querySelector('.v2-collapse'))sb.insertAdjacentHTML('afterbegin',`<button class="v2-collapse" data-v2="sidebar" aria-label="${state.sidebarCollapsed?'Mở rộng':'Thu gọn'} thanh bên">${state.sidebarCollapsed?'›':'‹'}</button>`);const sideVersion=sb?.querySelector('.sidebottom span:nth-of-type(3)');if(sideVersion)sideVersion.textContent='Build My Home V2.0 · Design & Planner Stabilization';if(!isUnlocked()){document.querySelectorAll('.stepper .step').forEach((el,i)=>{if(i>=8){el.classList.add('pay-locked');const bubble=el.querySelector('span');if(bubble)bubble.textContent='🔒';el.setAttribute('aria-label',`${names[i]} đang khóa`);}});}const bar=document.querySelector('.amountbar');if(bar&&state.lastCostDelta){bar.insertAdjacentHTML('beforeend',`<div class="v2-footer-delta ${state.lastCostDelta>=0?'up':'down'}"><small>Thay đổi gần nhất</small><b>${state.lastCostDelta>=0?'+':''}${money(state.lastCostDelta)}</b></div>`);}document.body.classList.remove('suite-night');if(state.step===6&&state.sceneTheme==='night')document.querySelector('#scene3d')?.classList.add('scene-night');};

  globalThis.BMH_V2={version:V2_VERSION,isUnlocked,plannerIssues,devMode:DEV_MODE};
  save();render();
})();
