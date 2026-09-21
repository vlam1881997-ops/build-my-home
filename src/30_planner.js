BMH.roomColor = type => ({living:'#f4f7f1',kitchen:'#fff9ef',bed:'#f4f7fb',bath:'#f0f7f7',stairs:'#f5f2fa',garage:'#f6f3ee',corridor:'#fafaf7',balcony:'#f1f8f0'}[type]||'#f7f8f5');
BMH.floorRooms = (floor=BMH.state.ui.planner.floor) => BMH.state.project.plan.rooms.filter(r=>r.floor===floor);
BMH.selectedRoom = () => BMH.state.project.plan.rooms.find(r=>r.id===BMH.state.ui.planner.selected)||null;
BMH.roomsOverlap = (a,b) => a.floor===b.floor && a.id!==b.id && a.x < b.x+b.w-.001 && a.x+a.w > b.x+.001 && a.y < b.y+b.h-.001 && a.y+a.h > b.y+.001;
BMH.roomValid = room => room.x>=0 && room.y>=0 && room.x+room.w<=BMH.state.project.site.width+.001 && room.y+room.h<=BMH.state.project.site.depth+.001 && !BMH.state.project.plan.rooms.some(r=>BMH.roomsOverlap(room,r));

BMH.plannerIssues = () => {
  const p=BMH.state.project, issues=[];
  for(const r of p.plan.rooms){
    if(r.x<0||r.y<0||r.x+r.w>p.site.width+.001||r.y+r.h>p.site.depth+.001)issues.push({sev:'error',text:`${r.name} vượt ranh khu đất.`});
    if(p.plan.rooms.some(o=>BMH.roomsOverlap(r,o)))issues.push({sev:'error',text:`${r.name} đang chồng lên không gian khác.`});
    const ro=p.plan.openings.filter(o=>o.roomId===r.id);
    if(!['corridor','balcony'].includes(r.type) && !ro.some(o=>o.kind==='door'))issues.push({sev:'warn',text:`${r.name} chưa có cửa đi trên mặt bằng.`});
    if(r.type==='bed' && !ro.some(o=>o.kind==='window'))issues.push({sev:'info',text:`${r.name} chưa có cửa sổ/ô thoáng trên mặt bằng.`});
    if(r.type==='bath' && !ro.some(o=>o.kind==='window'))issues.push({sev:'info',text:`${r.name} nên có ô thoáng hoặc giải pháp hút mùi cưỡng bức.`});
    if(r.type==='bed' && Math.min(r.w,r.h)<2.7)issues.push({sev:'warn',text:`${r.name} có cạnh nhỏ hơn 2,7m; nên kiểm tra lại khả năng bố trí giường và lối đi.`});
    if(r.type==='bath' && Math.min(r.w,r.h)<1.2)issues.push({sev:'warn',text:`${r.name} khá hẹp; cần kiểm tra khoảng thao tác thiết bị vệ sinh.`});
  }
  for(let f=1;f<p.site.floors;f++){
    const prev=p.plan.rooms.find(r=>r.floor===f-1&&r.type==='stairs'), cur=p.plan.rooms.find(r=>r.floor===f&&r.type==='stairs');
    if(prev&&cur && (Math.abs(prev.x-cur.x)>.5||Math.abs(prev.y-cur.y)>.5)) issues.push({sev:'warn',text:`Cầu thang tầng ${f} và tầng ${f+1} lệch nhau quá 0,5m.`});
  }
  const h=p.household;
  if(h.relatives.length && !p.plan.rooms.some(r=>r.floor===0&&r.type==='bed'))issues.push({sev:'warn',text:'Có ba/mẹ/người thân ở cùng nhưng tầng trệt chưa có phòng ngủ.'});
  const requested=h.children.filter(c=>c.room==='Riêng').length;
  const childBeds=p.plan.rooms.filter(r=>r.type==='bed'&&!/chính|ông bà/i.test(r.name)).length;
  if(childBeds<requested)issues.push({sev:'info',text:`Gia đình yêu cầu ${requested} phòng riêng cho con; mặt bằng hiện có ${childBeds} phòng phù hợp.`});
  if(!p.plan.rooms.some(r=>r.type==='bath'))issues.push({sev:'warn',text:'Chưa có WC trong mặt bằng.'});
  for(const r of p.plan.rooms){
    if(['living','bed','kitchen'].includes(r.type)){const env=BMH.roomEnvironment?BMH.roomEnvironment(r):null;if(env&&env.daylight<58)issues.push({sev:'info',text:`${r.name}: ánh sáng tự nhiên đang thấp; nên tăng ô mở trên tường ngoài.`});if(env&&env.ventilation<58)issues.push({sev:'info',text:`${r.name}: thông gió tự nhiên còn yếu; cân nhắc thêm cửa sổ hoặc thông gió chéo.`});}
  }
  for(let f=1;f<p.site.floors;f++)issues.push(...(BMH.coordinationIssues?BMH.coordinationIssues(f):[]));
  return issues.filter((x,i,a)=>a.findIndex(y=>y.text===x.text)===i);
};

BMH.furnitureSvg = r => {
  const x=r.x,y=r.y,w=r.w,h=r.h,c='#8a938d',sw=.035;
  if(r.type==='bed') return `<g class="furniture" stroke="${c}" fill="none" stroke-width="${sw}"><rect x="${x+w*.18}" y="${y+h*.18}" width="${w*.64}" height="${h*.58}" rx=".06"/><line x1="${x+w*.18}" y1="${y+h*.34}" x2="${x+w*.82}" y2="${y+h*.34}"/><rect x="${x+w*.24}" y="${y+h*.20}" width="${w*.20}" height="${h*.12}" rx=".03"/><rect x="${x+w*.56}" y="${y+h*.20}" width="${w*.20}" height="${h*.12}" rx=".03"/><rect x="${x+w*.06}" y="${y+h*.12}" width="${w*.08}" height="${h*.70}"/></g>`;
  if(r.type==='living') return `<g class="furniture" stroke="${c}" fill="none" stroke-width="${sw}"><path d="M${x+w*.10} ${y+h*.18}h${w*.55}v${h*.18}h-${w*.37}v${h*.18}h-${w*.18}z"/><rect x="${x+w*.35}" y="${y+h*.58}" width="${w*.30}" height="${h*.18}" rx=".06"/><line x1="${x+w*.78}" y1="${y+h*.22}" x2="${x+w*.78}" y2="${y+h*.62}"/></g>`;
  if(r.type==='kitchen') return `<g class="furniture" stroke="${c}" fill="none" stroke-width="${sw}"><path d="M${x+w*.06} ${y+h*.10}h${w*.88}v${h*.14}h-${w*.70}v${h*.22}h-${w*.18}z"/><circle cx="${x+w*.28}" cy="${y+h*.17}" r="${Math.min(w,h)*.04}"/><rect x="${x+w*.34}" y="${y+h*.54}" width="${w*.32}" height="${h*.22}" rx=".04"/><circle cx="${x+w*.42}" cy="${y+h*.65}" r="${Math.min(w,h)*.025}"/><circle cx="${x+w*.58}" cy="${y+h*.65}" r="${Math.min(w,h)*.025}"/></g>`;
  if(r.type==='bath') return `<g class="furniture" stroke="${c}" fill="none" stroke-width="${sw}"><ellipse cx="${x+w*.28}" cy="${y+h*.46}" rx="${w*.12}" ry="${h*.18}"/><rect x="${x+w*.55}" y="${y+h*.16}" width="${w*.25}" height="${h*.22}" rx=".04"/><path d="M${x+w*.58} ${y+h*.60}h${w*.28}v${h*.26}h-${w*.28}z"/><line x1="${x+w*.58}" y1="${y+h*.60}" x2="${x+w*.86}" y2="${y+h*.86}"/><line x1="${x+w*.86}" y1="${y+h*.60}" x2="${x+w*.58}" y2="${y+h*.86}"/></g>`;
  if(r.type==='stairs') return `<g class="furniture stairs-symbol" stroke="${c}" fill="none" stroke-width="${sw}">${Array.from({length:10},(_,i)=>`<line x1="${x+w*.14}" y1="${y+h*(.10+i*.078)}" x2="${x+w*.86}" y2="${y+h*(.10+i*.078)}"/>`).join('')}<path d="M${x+w*.5} ${y+h*.82}V${y+h*.18}m0 0l-.10 .16m.10-.16l.10 .16"/><text x="${x+w*.55}" y="${y+h*.20}">UP</text></g>`;
  if(r.type==='garage') return `<g class="furniture" stroke="${c}" fill="none" stroke-width="${sw}"><rect x="${x+w*.22}" y="${y+h*.16}" width="${w*.56}" height="${h*.68}" rx=".28"/><line x1="${x+w*.30}" y1="${y+h*.35}" x2="${x+w*.70}" y2="${y+h*.35}"/><circle cx="${x+w*.28}" cy="${y+h*.25}" r=".07"/><circle cx="${x+w*.72}" cy="${y+h*.25}" r=".07"/><circle cx="${x+w*.28}" cy="${y+h*.75}" r=".07"/><circle cx="${x+w*.72}" cy="${y+h*.75}" r=".07"/></g>`;
  return '';
};

BMH.openingCode = o => {
  const list=BMH.state.project.plan.openings.filter(x=>x.floor===o.floor&&x.kind===o.kind);
  return `${o.kind==='door'?'D':'W'}${Math.max(1,list.findIndex(x=>x.id===o.id)+1)}`;
};

BMH.openingSvg = o => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===o.roomId); if(!r)return'';
  const w=Math.min(o.width||.9, o.side==='north'||o.side==='south'?r.w:r.h), off=BMH.clamp(o.offset??.3,0,1), code=BMH.openingCode(o);
  let x,y; if(o.side==='north'||o.side==='south'){x=r.x+(r.w-w)*off; y=o.side==='north'?r.y:r.y+r.h;} else {y=r.y+(r.h-w)*off; x=o.side==='west'?r.x:r.x+r.w;}
  const tag=(tx,ty)=>`<g class="opening-tag"><rect x="${tx-.18}" y="${ty-.13}" width=".36" height=".26" rx=".04"/><text x="${tx}" y="${ty+.045}">${code}</text></g>`;
  if(o.kind==='window'){
    if(o.side==='north'||o.side==='south') return `<g class="opening window"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x+w}" y2="${y}"/><line x1="${x}" y1="${y-.06}" x2="${x+w}" y2="${y-.06}"/><line x1="${x}" y1="${y+.06}" x2="${x+w}" y2="${y+.06}"/>${tag(x+w/2,y+(o.side==='north'?-.18:.18))}</g>`;
    return `<g class="opening window"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x}" y2="${y+w}"/><line x1="${x-.06}" y1="${y}" x2="${x-.06}" y2="${y+w}"/><line x1="${x+.06}" y1="${y}" x2="${x+.06}" y2="${y+w}"/>${tag(x+(o.side==='west'?-.18:.18),y+w/2)}</g>`;
  }
  const rr=Math.min(.9,w);
  if(o.side==='north')return `<g class="opening door"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x+rr}" y2="${y}"/><line class="door-leaf" x1="${x}" y1="${y}" x2="${x}" y2="${y+rr}"/><path d="M${x+rr} ${y} A${rr} ${rr} 0 0 0 ${x} ${y+rr}"/>${tag(x+rr/2,y-.20)}</g>`;
  if(o.side==='south')return `<g class="opening door"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x+rr}" y2="${y}"/><line class="door-leaf" x1="${x}" y1="${y}" x2="${x}" y2="${y-rr}"/><path d="M${x+rr} ${y} A${rr} ${rr} 0 0 1 ${x} ${y-rr}"/>${tag(x+rr/2,y+.20)}</g>`;
  if(o.side==='west')return `<g class="opening door"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x}" y2="${y+rr}"/><line class="door-leaf" x1="${x}" y1="${y}" x2="${x+rr}" y2="${y}"/><path d="M${x} ${y+rr} A${rr} ${rr} 0 0 1 ${x+rr} ${y}"/>${tag(x-.20,y+rr/2)}</g>`;
  return `<g class="opening door"><line class="opening-cut" x1="${x}" y1="${y}" x2="${x}" y2="${y+rr}"/><line class="door-leaf" x1="${x}" y1="${y}" x2="${x-rr}" y2="${y}"/><path d="M${x} ${y+rr} A${rr} ${rr} 0 0 0 ${x-rr} ${y}"/>${tag(x+.20,y+rr/2)}</g>`;
};

BMH.wallSegments = (floor=BMH.state.ui.planner.floor) => {
  const rooms=BMH.floorRooms(floor), edges=[];
  const add=(o,c,a,b)=>{if(b>a+.001)edges.push({o,c:+c.toFixed(4),a:+a.toFixed(4),b:+b.toFixed(4)});};
  rooms.forEach(r=>{add('h',r.y,r.x,r.x+r.w);add('h',r.y+r.h,r.x,r.x+r.w);add('v',r.x,r.y,r.y+r.h);add('v',r.x+r.w,r.y,r.y+r.h);});
  const groups=new Map(); edges.forEach(e=>{const k=`${e.o}:${e.c}`; if(!groups.has(k))groups.set(k,[]);groups.get(k).push(e);});
  const out=[];
  for(const es of groups.values()){
    const cuts=[...new Set(es.flatMap(e=>[e.a,e.b]))].sort((a,b)=>a-b);
    for(let i=0;i<cuts.length-1;i++){
      const a=cuts[i],b=cuts[i+1],mid=(a+b)/2,count=es.filter(e=>e.a<=mid+.0001&&e.b>=mid-.0001).length;
      if(count)out.push({o:es[0].o,c:es[0].c,a,b,count});
    }
  }
  return out;
};

BMH.archWallsSvg = floor => BMH.wallSegments(floor).map(s=>s.o==='h'
  ? `<line class="arch-wall ${s.count>1?'internal':'external'}" x1="${s.a}" y1="${s.c}" x2="${s.b}" y2="${s.c}"/>`
  : `<line class="arch-wall ${s.count>1?'internal':'external'}" x1="${s.c}" y1="${s.a}" x2="${s.c}" y2="${s.b}"/>`).join('');

BMH.dimensionChainSvg = (floor,Hview) => {
  const rooms=BMH.floorRooms(floor),W=BMH.state.project.site.width;
  const xs=[0,...rooms.flatMap(r=>[r.x,r.x+r.w]),W].filter(x=>x>=0&&x<=W).map(x=>+x.toFixed(3));
  const ys=[0,...rooms.flatMap(r=>[r.y,r.y+r.h]),Hview].filter(y=>y>=0&&y<=Hview).map(y=>+y.toFixed(3));
  const ux=[...new Set(xs)].sort((a,b)=>a-b),uy=[...new Set(ys)].sort((a,b)=>a-b);
  const chainX=ux.slice(0,-1).map((x,i)=>{const x2=ux[i+1],d=x2-x;return `<g class="dim-seg"><line x1="${x}" y1="-1.25" x2="${x2}" y2="-1.25"/><line x1="${x}" y1="-1.36" x2="${x}" y2="-1.13"/><line x1="${x2}" y1="-1.36" x2="${x2}" y2="-1.13"/><text x="${(x+x2)/2}" y="-1.38">${BMH.num(d,2)}</text></g>`}).join('');
  const chainY=uy.slice(0,-1).map((y,i)=>{const y2=uy[i+1],d=y2-y;return `<g class="dim-seg"><line x1="-1.25" y1="${y}" x2="-1.25" y2="${y2}"/><line x1="-1.36" y1="${y}" x2="-1.13" y2="${y}"/><line x1="-1.36" y1="${y2}" x2="-1.13" y2="${y2}"/><text x="-1.42" y="${(y+y2)/2}" transform="rotate(-90 -1.42 ${(y+y2)/2})">${BMH.num(d,2)}</text></g>`}).join('');
  return `<g class="dimension-chain">${chainX}${chainY}<g class="overall-dim"><line x1="0" y1="-1.72" x2="${W}" y2="-1.72"/><line x1="0" y1="-1.84" x2="0" y2="-1.60"/><line x1="${W}" y1="-1.84" x2="${W}" y2="-1.60"/><text x="${W/2}" y="-1.88">${BMH.num(W,2)} m</text><line x1="-1.72" y1="0" x2="-1.72" y2="${Hview}"/><line x1="-1.84" y1="0" x2="-1.60" y2="0"/><line x1="-1.84" y1="${Hview}" x2="-1.60" y2="${Hview}"/><text x="-1.91" y="${Hview/2}" transform="rotate(-90 -1.91 ${Hview/2})">${BMH.num(Hview,2)} m</text></g></g>`;
};


BMH.rectOverlapArea = (a,b) => Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))*Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
BMH.externalSides = room => {
  const rooms=BMH.floorRooms(room.floor), eps=.01, overlap=(a1,a2,b1,b2)=>Math.min(a2,b2)-Math.max(a1,b1)>.15;
  const blocked=side=>rooms.some(o=>o.id!==room.id&&(
    (side==='east'&&Math.abs(o.x-(room.x+room.w))<eps&&overlap(o.y,o.y+o.h,room.y,room.y+room.h))||
    (side==='west'&&Math.abs(o.x+o.w-room.x)<eps&&overlap(o.y,o.y+o.h,room.y,room.y+room.h))||
    (side==='south'&&Math.abs(o.y-(room.y+room.h))<eps&&overlap(o.x,o.x+o.w,room.x,room.x+room.w))||
    (side==='north'&&Math.abs(o.y+o.h-room.y)<eps&&overlap(o.x,o.x+o.w,room.x,room.x+room.w))
  ));
  return ['north','east','south','west'].filter(side=>!blocked(side));
};
BMH.roomEnvironment = room => {
  const ext=BMH.externalSides(room), openings=BMH.state.project.plan.openings.filter(o=>o.roomId===room.id), windows=openings.filter(o=>o.kind==='window'&&ext.includes(o.side));
  const totalWidth=windows.reduce((s,o)=>s+(Number(o.width)||0),0), area=Math.max(.1,room.w*room.h), distinct=[...new Set(windows.map(o=>o.side))];
  const daylight=BMH.clamp(Math.round(42+(totalWidth/Math.max(2.4,Math.sqrt(area)*2))*55+ext.length*4),30,98);
  const opposite=(distinct.includes('north')&&distinct.includes('south'))||(distinct.includes('east')&&distinct.includes('west'));
  const ventilation=BMH.clamp(Math.round(38+distinct.length*22+(opposite?18:0)+(openings.some(o=>o.kind==='door')?5:0)),28,98);
  return {externalSides:ext,windows:windows.length,totalWidth,daylight,ventilation,crossVent:opposite||distinct.length>=2};
};
BMH.environmentOverlaySvg = floor => BMH.floorRooms(floor).map(r=>{const a=BMH.roomEnvironment(r),score=Math.round((a.daylight+a.ventilation)/2),cls=score>=78?'good':score>=60?'mid':'low',x=r.x+r.w/2,y=r.y+r.h-.26;return `<g class="env-badge ${cls}"><rect x="${x-.52}" y="${y-.16}" width="1.04" height=".30" rx=".12"/><text x="${x}" y="${y+.035}">☀ ${a.daylight} · ≋ ${a.ventilation}</text></g>`}).join('');
BMH.belowFloorSvg = floor => {
  if(floor<=0)return''; const rs=BMH.floorRooms(floor-1); if(!rs.length)return'';
  return `<g class="below-floor">${rs.map(r=>`<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/><text x="${r.x+r.w/2}" y="${r.y+r.h/2}">T${floor} · ${BMH.esc(r.name)}</text>`).join('')}</g>`;
};
BMH.suggestedColumns = floor => {
  const rooms=BMH.floorRooms(floor), pts=new Map(), add=(x,y)=>{const k=`${x.toFixed(3)}:${y.toFixed(3)}`;pts.set(k,{x,y,n:(pts.get(k)?.n||0)+1});};
  rooms.forEach(r=>[[r.x,r.y],[r.x+r.w,r.y],[r.x+r.w,r.y+r.h],[r.x,r.y+r.h]].forEach(([x,y])=>add(x,y)));
  const W=BMH.state.project.site.width,H=Math.max(0,...rooms.map(r=>r.y+r.h));
  return [...pts.values()].filter(p=>p.n>=2||(Math.abs(p.x)<.01||Math.abs(p.x-W)<.01)&&(Math.abs(p.y)<.01||Math.abs(p.y-H)<.01));
};
BMH.structureSvg = floor => `<g class="structure-layer">${BMH.suggestedColumns(floor).map((p,i)=>`<g class="column-symbol"><rect x="${p.x-.11}" y="${p.y-.11}" width=".22" height=".22"/><text x="${p.x+.15}" y="${p.y-.14}">C${i+1}</text></g>`).join('')}</g>`;
BMH.coordinationIssues = floor => {
  const out=[]; if(floor<=0)return out; const cur=BMH.floorRooms(floor), below=BMH.floorRooms(floor-1);
  const stairs=cur.filter(r=>r.type==='stairs'); stairs.forEach(r=>{const match=below.filter(b=>b.type==='stairs').sort((a,b)=>BMH.rectOverlapArea(r,b)-BMH.rectOverlapArea(r,a))[0]; if(match&&BMH.rectOverlapArea(r,match)<Math.min(r.w*r.h,match.w*match.h)*.65)out.push({sev:'warn',text:`${r.name}: cầu thang lệch tầng dưới; nên giữ tim thang và ô thông tầng thẳng đứng.`});});
  cur.filter(r=>r.type==='bath').forEach(r=>{const wet=below.filter(b=>b.type==='bath'),best=wet.length?Math.max(...wet.map(b=>BMH.rectOverlapArea(r,b))):0;if(wet.length&&best<r.w*r.h*.35)out.push({sev:'info',text:`${r.name}: khu ướt lệch tầng dưới, đường ống đứng có thể dài và khó bảo trì hơn.`});});
  return out;
};
BMH.alignCurrentFloor = type => {
  const floor=BMH.state.ui.planner.floor;if(floor<=0)return BMH.toast('Tầng 1 không có tầng dưới để căn.');
  const below=BMH.floorRooms(floor-1).find(r=>r.type===type),cur=BMH.floorRooms(floor).find(r=>r.type===type);if(!below||!cur)return BMH.toast(`Chưa có ${type==='stairs'?'cầu thang':'WC'} ở cả hai tầng.`);
  const rooms=structuredClone(BMH.state.project.plan.rooms),r=rooms.find(x=>x.id===cur.id);const old={...r};Object.assign(r,{x:below.x,y:below.y,w:Math.min(r.w,below.w),h:Math.min(r.h,below.h)});if(!BMH.layoutValid(rooms)){Object.assign(r,old);return BMH.toast('Không thể căn tự động vì sẽ chồng lên không gian khác.');}
  BMH.pushPlanHistory();BMH.state.project.plan.rooms=rooms;BMH.save();BMH.render();BMH.toast(type==='stairs'?'Đã căn cầu thang theo tầng dưới.':'Đã căn khu WC theo tầng dưới.');
};


BMH.planSnapshot = () => structuredClone(BMH.state.project.plan);
BMH.pushPlanHistory = () => {
  BMH.planHistory.undo.push(BMH.planSnapshot());
  if(BMH.planHistory.undo.length>30)BMH.planHistory.undo.shift();
  BMH.planHistory.redo.length=0;
};
BMH.undoPlan = () => {
  const snap=BMH.planHistory.undo.pop(); if(!snap)return BMH.toast('Chưa có thao tác để hoàn tác.');
  BMH.planHistory.redo.push(BMH.planSnapshot()); BMH.state.project.plan=structuredClone(snap); BMH.normalizeState(); BMH.save(); BMH.render();
};
BMH.redoPlan = () => {
  const snap=BMH.planHistory.redo.pop(); if(!snap)return BMH.toast('Chưa có thao tác để làm lại.');
  BMH.planHistory.undo.push(BMH.planSnapshot()); BMH.state.project.plan=structuredClone(snap); BMH.normalizeState(); BMH.save(); BMH.render();
};
BMH.layoutValid = rooms => {
  const site=BMH.state.project.site,min=.6;
  for(const r of rooms){if(r.w<min||r.h<min||r.x<-.001||r.y<-.001||r.x+r.w>site.width+.001||r.y+r.h>site.depth+.001)return false;}
  for(let i=0;i<rooms.length;i++)for(let j=i+1;j<rooms.length;j++){const a=rooms[i],b=rooms[j];if(a.floor!==b.floor)continue;if(a.x<b.x+b.w-.001&&a.x+a.w>b.x+.001&&a.y<b.y+b.h-.001&&a.y+a.h>b.y+.001)return false;}
  return true;
};
BMH.sharedWallNeighbors = (rooms,room,side) => {
  const eps=.01, overlap=(a1,a2,b1,b2)=>Math.min(a2,b2)-Math.max(a1,b1)>.15;
  return rooms.filter(o=>o.id!==room.id&&o.floor===room.floor&&((side==='east'&&Math.abs(o.x-(room.x+room.w))<eps&&overlap(o.y,o.y+o.h,room.y,room.y+room.h))||(side==='west'&&Math.abs(o.x+o.w-room.x)<eps&&overlap(o.y,o.y+o.h,room.y,room.y+room.h))||(side==='south'&&Math.abs(o.y-(room.y+room.h))<eps&&overlap(o.x,o.x+o.w,room.x,room.x+room.w))||(side==='north'&&Math.abs(o.y+o.h-room.y)<eps&&overlap(o.x,o.x+o.w,room.x,room.x+room.w))));
};
BMH.edgeMoveCandidate = (originalRooms,id,side,delta) => {
  const rooms=structuredClone(originalRooms),r=rooms.find(x=>x.id===id); if(!r)return null;
  const ns=BMH.sharedWallNeighbors(rooms,r,side);
  if(side==='east'){r.w+=delta;ns.forEach(n=>{n.x+=delta;n.w-=delta;});}
  if(side==='west'){r.x+=delta;r.w-=delta;ns.forEach(n=>{n.w+=delta;});}
  if(side==='south'){r.h+=delta;ns.forEach(n=>{n.y+=delta;n.h-=delta;});}
  if(side==='north'){r.y+=delta;r.h-=delta;ns.forEach(n=>{n.h+=delta;});}
  return BMH.layoutValid(rooms)?rooms:null;
};
BMH.svgPoint = (e,svg) => {const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return {x:vb.x+(e.clientX-r.left)*vb.width/r.width,y:vb.y+(e.clientY-r.top)*vb.height/r.height};};
BMH.openingFits = (candidate,ignoreId=null) => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===candidate.roomId);if(!r)return false;
  const len=(candidate.side==='north'||candidate.side==='south')?r.w:r.h,w=Number(candidate.width)||0;if(w<.5||w>len-.08)return false;
  const start=(len-w)*BMH.clamp(Number(candidate.offset)||0,0,1),end=start+w;
  return !BMH.state.project.plan.openings.some(o=>o.id!==ignoreId&&o.roomId===candidate.roomId&&o.side===candidate.side&&(()=>{const ow=Number(o.width)||0,os=(len-ow)*BMH.clamp(Number(o.offset)||0,0,1),oe=os+ow;return start<oe+.08&&end>os-.08;})());
};
BMH.placeOpeningAt = (kind,roomId,side,point) => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===roomId);if(!r)return;const width=kind==='door'?.9:1.4;let offset=.5;
  if(side==='north'||side==='south'){const span=Math.max(.01,r.w-width);offset=BMH.clamp((point.x-r.x-width/2)/span,0,1);}else{const span=Math.max(.01,r.h-width);offset=BMH.clamp((point.y-r.y-width/2)/span,0,1);}
  const candidate={id:BMH.uid('o'),floor:r.floor,roomId:r.id,kind,side,offset:+offset.toFixed(3),width};if(!BMH.openingFits(candidate))return BMH.toast('Vị trí này không đủ khoảng trống hoặc đang trùng một ô mở khác.');
  BMH.pushPlanHistory();BMH.state.project.plan.openings.push(candidate);BMH.state.ui.planner.selected=r.id;BMH.save();BMH.render();BMH.toast(`${kind==='door'?'Cửa đi':'Cửa sổ'} đã được đặt lên tường. Nhấn Esc để thoát công cụ.`);
};
BMH.edgeHandlesSvg = r => `<g class="edge-grips">${[['north',r.x,r.y,r.x+r.w,r.y],['south',r.x,r.y+r.h,r.x+r.w,r.y+r.h],['west',r.x,r.y,r.x,r.y+r.h],['east',r.x+r.w,r.y,r.x+r.w,r.y+r.h]].map(([side,x1,y1,x2,y2])=>`<line class="wall-grip-hit" data-edge-id="${r.id}" data-edge-side="${side}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line class="wall-grip-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('')}</g>`;
BMH.wallPlacementSvg = rooms => rooms.map(r=>`<g class="wall-place-room">${[['north',r.x,r.y,r.x+r.w,r.y],['south',r.x,r.y+r.h,r.x+r.w,r.y+r.h],['west',r.x,r.y,r.x,r.y+r.h],['east',r.x+r.w,r.y,r.x+r.w,r.y+r.h]].map(([side,x1,y1,x2,y2])=>`<line class="wall-place-hit" data-wall-place="1" data-room="${r.id}" data-side="${side}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('')}</g>`).join('');

BMH.planSvg = ({interactive=true, floor=BMH.state.ui.planner.floor}={}) => {
  const p=BMH.state.project, ui=BMH.state.ui.planner, rooms=BMH.floorRooms(floor), W=p.site.width,H=p.site.depth;
  const usedH=Math.max(6,...rooms.map(r=>r.y+r.h)), Hview=Math.min(H,Math.max(usedH+1,10)), m=2.55, major=1, minor=.2, zoom=BMH.clamp(ui.zoom||1,.75,2.5);
  const kua=BMH.kua(p.household.ownerBirth,p.household.ownerGender), good=kua?.dirs?.[0];
  const feng=ui.showFeng&&good?(()=>{const pos={'Bắc':[W*.2,0,W*.6,Hview*.22],'Nam':[W*.2,Hview*.78,W*.6,Hview*.22],'Đông':[W*.78,Hview*.2,W*.22,Hview*.6],'Tây':[0,Hview*.2,W*.22,Hview*.6],'Đông Nam':[W*.58,Hview*.58,W*.42,Hview*.42],'Đông Bắc':[W*.58,0,W*.42,Hview*.42],'Tây Nam':[0,Hview*.58,W*.42,Hview*.42],'Tây Bắc':[0,0,W*.42,Hview*.42]}[good];return pos?`<g class="feng-zone"><rect x="${pos[0]}" y="${pos[1]}" width="${pos[2]}" height="${pos[3]}"/><text x="${pos[0]+.16}" y="${pos[1]+.34}">Hướng tốt tham khảo · ${good}</text></g>`:''})():'';
  const roomMarkup=rooms.map(r=>`<g class="room room-${r.type} ${ui.selected===r.id?'selected':''}" data-room-id="${r.id}"><rect class="room-interior" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>${ui.showFurniture?BMH.furnitureSvg(r):''}<g class="room-label"><text class="room-name" x="${r.x+r.w/2}" y="${r.y+r.h/2-.05}">${BMH.esc(r.name).toUpperCase()}</text><text class="room-area" x="${r.x+r.w/2}" y="${r.y+r.h/2+.22}">${BMH.num(r.w*r.h)} m² · ${BMH.num(r.w)}×${BMH.num(r.h)}m</text></g>${interactive&&ui.selected===r.id&&ui.tool==='select'?`<rect class="selection-outline" x="${r.x+.04}" y="${r.y+.04}" width="${Math.max(.01,r.w-.08)}" height="${Math.max(.01,r.h-.08)}"/>${BMH.edgeHandlesSvg(r)}<circle class="resize-handle" data-resize-id="${r.id}" cx="${r.x+r.w}" cy="${r.y+r.h}" r=".18"/>`:''}</g>`).join('');
  const below=ui.showBelow?BMH.belowFloorSvg(floor):'';
  const structure=ui.showStructure?BMH.structureSvg(floor):'';
  const environment=ui.showEnvironment?BMH.environmentOverlaySvg(floor):'';
  const walls=BMH.archWallsSvg(floor), openings=p.plan.openings.filter(o=>o.floor===floor).map(BMH.openingSvg).join('');
  const dims=ui.showDimensions?BMH.dimensionChainSvg(floor,Hview):'';
  const axesX=Array.from({length:Math.max(2,Math.ceil(W/2)+1)},(_,i)=>{const x=Math.min(W,i*2);return `<g class="axis"><circle cx="${x}" cy="-.72" r=".15"/><text x="${x}" y="-.67" text-anchor="middle">${i+1}</text><line x1="${x}" y1="-.55" x2="${x}" y2="0"/></g>`}).join('');
  const letters='ABCDEFGH'; const axesY=Array.from({length:Math.max(2,Math.ceil(Hview/4)+1)},(_,i)=>{const y=Math.min(Hview,i*4);return `<g class="axis"><circle cx="-.72" cy="${y}" r=".15"/><text x="-.72" y="${y+.05}" text-anchor="middle">${letters[i]||i+1}</text><line x1="-.55" y1="${y}" x2="0" y2="${y}"/></g>`}).join('');
  const north=`<g class="north-arrow" transform="translate(${W+.92} .65)"><circle r=".34"/><path d="M0 -.27L.12 .11 0 .05-.12 .11Z"/><text x="0" y="-.44">N</text></g>`;
  const scale=`<g class="scale-bar" transform="translate(${Math.max(.2,W-2.2)} ${Hview+.63})"><rect x="0" y="0" width=".5" height=".10"/><rect x=".5" y="0" width=".5" height=".10" class="alt"/><rect x="1" y="0" width="1" height=".10"/><text x="0" y=".30">0</text><text x="1" y=".30">1m</text><text x="2" y=".30" text-anchor="end">2m</text></g>`;
  const baseX=-m,baseY=-m,baseW=W+m*2+1.45,baseH=Hview+m*2+1.15,cx=baseX+baseW/2,cy=baseY+baseH/2,vw=baseW/zoom,vh=baseH/zoom,vx=cx-vw/2,vy=cy-vh/2;
  const placement=interactive&&ui.tool!=='select'?`<g class="placement-layer tool-${ui.tool}">${BMH.wallPlacementSvg(rooms)}</g>`:'';
  return `<svg id="plannerSvg" class="planner-svg architecture-svg tool-${ui.tool}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" data-floor="${floor}" aria-label="Mặt bằng kiến trúc sơ bộ tầng ${floor+1}"><defs><pattern id="minorGrid" width="${minor}" height="${minor}" patternUnits="userSpaceOnUse"><path d="M ${minor} 0 L 0 0 0 ${minor}"/></pattern><pattern id="majorGrid" width="${major}" height="${major}" patternUnits="userSpaceOnUse"><path d="M ${major} 0 L 0 0 0 ${major}"/></pattern></defs><rect x="${baseX}" y="${baseY}" width="${baseW}" height="${baseH}" class="sheet-bg"/><rect x="0" y="0" width="${W}" height="${Hview}" class="paper"/><rect x="0" y="0" width="${W}" height="${Hview}" class="minor-grid"/><rect x="0" y="0" width="${W}" height="${Hview}" class="major-grid"/>${feng}${below}<g class="axis-layer">${axesX}${axesY}</g><g class="room-layer">${roomMarkup}</g><g class="wall-layer">${walls}</g>${structure}<g class="opening-layer">${openings}</g>${environment}${placement}${dims}<rect class="plot-boundary" x="0" y="0" width="${W}" height="${Hview}"/>${north}${scale}</svg>`;
};

BMH.findFreeSpot = (w,h,floor) => { const s=BMH.state.ui.planner.snap, site=BMH.state.project.site; for(let y=0;y<=site.depth-h+.001;y+=s)for(let x=0;x<=site.width-w+.001;x+=s){const r={id:'temp',floor,x:+x.toFixed(2),y:+y.toFixed(2),w,h};if(BMH.roomValid(r))return {x:r.x,y:r.y};} return null; };
BMH.addRoom = type => { const defs={living:['Phòng khách',4,4],kitchen:['Bếp + ăn',4,4],bed:['Phòng ngủ',3.2,4],bath:['WC',1.8,2.2],stairs:['Cầu thang',2,4],garage:['Gara',3,5],corridor:['Hành lang',1.2,4],balcony:['Ban công',1.5,3]}; const d=defs[type]||defs.bed, floor=BMH.state.ui.planner.floor, pos=BMH.findFreeSpot(Math.min(d[1],BMH.state.project.site.width),Math.min(d[2],BMH.state.project.site.depth),floor); if(!pos)return BMH.toast('Không còn vùng trống đủ cho không gian mẫu.'); BMH.pushPlanHistory(); const r={id:BMH.uid('r'),floor,name:d[0],type,x:pos.x,y:pos.y,w:Math.min(d[1],BMH.state.project.site.width),h:Math.min(d[2],BMH.state.project.site.depth)}; BMH.state.project.plan.rooms.push(r); BMH.state.ui.planner.selected=r.id; BMH.state.ui.planner.tool='select'; BMH.save(); BMH.render(); };
BMH.addOpening = kind => { const r=BMH.selectedRoom(); if(!r)return BMH.toast('Hãy chọn phòng trước.'); BMH.state.ui.planner.tool=kind; BMH.save(); BMH.render(); BMH.toast(`Đang dùng công cụ ${kind==='door'?'Cửa đi':'Cửa sổ'} — nhấp trực tiếp lên cạnh tường để đặt.`); };

/* ===== V3.5 architectural documentation helpers ===== */
BMH.projectLevels = () => {
  const floors=Math.max(1,Number(BMH.state.project.site.floors)||1),floorHeight=3.4,slab=.14;
  return {floors,floorHeight,slab,total:floors*floorHeight+.9};
};
BMH.elevationOpenings = floor => {
  const p=BMH.state.project, rooms=BMH.floorRooms(floor), frontSides=['north','south'];
  const list=p.plan.openings.filter(o=>o.floor===floor&&frontSides.includes(o.side));
  return list.map(o=>{const r=rooms.find(x=>x.id===o.roomId);return r?{...o,room:r}:null}).filter(Boolean);
};
BMH.elevationSvg = () => {
  const p=BMH.state.project,{floors,floorHeight,total}=BMH.projectLevels(),W=Math.max(4,p.site.width),paint=p.materials.choices.paint==='jotun'?'#e6d4bd':'#eee9df',door=p.materials.choices.door==='premium-door'?'#323735':'#514a44';
  const sx=120, usable=720, scale=usable/W, baseY=430, levelY=f=>baseY-f*floorHeight*42;
  const floorGroups=Array.from({length:floors},(_,f)=>{const y=levelY(f+1),h=floorHeight*42,open=BMH.elevationOpenings(f),win=open.filter(o=>o.kind==='window'),doors=open.filter(o=>o.kind==='door');
    const winMarkup=win.map((o,i)=>{const x=sx+40+(i+1)*(usable-80)/(win.length+1),w=Math.max(58,Math.min(132,(o.width||1.4)*scale*.72));return `<g class="elev-window"><rect x="${x-w/2}" y="${y+h*.32}" width="${w}" height="${h*.42}" rx="3"/><line x1="${x}" y1="${y+h*.32}" x2="${x}" y2="${y+h*.74}"/><line x1="${x-w/2}" y1="${y+h*.53}" x2="${x+w/2}" y2="${y+h*.53}"/></g>`}).join('');
    const doorMarkup=doors.map((o,i)=>{const x=sx+usable*.20+i*120,w=Math.max(48,Math.min(84,(o.width||.9)*scale*.72));return `<g class="elev-door"><rect x="${x}" y="${y+h*.38}" width="${w}" height="${h*.62}"/><line x1="${x+w*.78}" y1="${y+h*.70}" x2="${x+w*.78+2}" y2="${y+h*.70}"/></g>`}).join('');
    const balcony=f>0?`<g class="elev-balcony"><rect x="${sx+usable*.56}" y="${y+h*.72}" width="${usable*.28}" height="9"/><line x1="${sx+usable*.56}" y1="${y+h*.72}" x2="${sx+usable*.56}" y2="${y+h*.46}"/><line x1="${sx+usable*.84}" y1="${y+h*.72}" x2="${sx+usable*.84}" y2="${y+h*.46}"/>${Array.from({length:6},(_,i)=>`<line x1="${sx+usable*(.58+i*.045)}" y1="${y+h*.48}" x2="${sx+usable*(.58+i*.045)}" y2="${y+h*.70}"/>`).join('')}</g>`:'';
    return `<g class="elev-floor"><rect x="${sx}" y="${y}" width="${usable}" height="${h}" fill="${paint}"/><rect x="${sx}" y="${y+h-8}" width="${usable}" height="8" class="elev-slab"/>${winMarkup}${doorMarkup}${balcony}<text x="${sx+12}" y="${y+24}" class="elev-floor-label">TẦNG ${f+1}</text></g>`;
  }).join('');
  const top=levelY(floors),roofY=top-18;
  const levels=Array.from({length:floors+1},(_,i)=>{const y=levelY(i);return `<g class="level-marker"><line x1="70" y1="${y}" x2="${sx-8}" y2="${y}"/><path d="M70 ${y}l10 -6v12z"/><text x="54" y="${y+4}" text-anchor="end">${i===0?'±0.000':`+${(i*floorHeight).toFixed(3)}`}</text></g>`}).join('');
  return `<svg class="technical-view-svg elevation-svg" viewBox="0 0 960 520" aria-label="Mặt đứng kiến trúc sơ bộ"><defs><linearGradient id="elevSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f8faf7"/><stop offset="1" stop-color="#eef3ed"/></linearGradient></defs><rect width="960" height="520" fill="url(#elevSky)"/><line x1="58" y1="430" x2="900" y2="430" class="ground-line"/><g class="elevation-building">${floorGroups}<rect x="${sx-10}" y="${roofY}" width="${usable+20}" height="18" rx="4" class="elev-roof"/><rect x="${sx+usable*.08}" y="${roofY-34}" width="${usable*.22}" height="34" class="roof-feature"/><rect x="${sx+usable*.60}" y="${roofY-22}" width="${usable*.25}" height="22" class="roof-feature soft"/></g>${levels}<g class="overall-height"><line x1="880" y1="430" x2="880" y2="${roofY}"/><line x1="870" y1="430" x2="890" y2="430"/><line x1="870" y1="${roofY}" x2="890" y2="${roofY}"/><text x="895" y="${(430+roofY)/2}" transform="rotate(-90 895 ${(430+roofY)/2})">CAO ĐỘ SƠ BỘ ${total.toFixed(2)}m</text></g><g class="doc-title"><text x="70" y="482">MẶT ĐỨNG CHÍNH · SƠ BỘ</text><text x="70" y="503">Tỷ lệ hiển thị tự động · Sơn ${BMH.esc(p.materials.choices.paint)} · Cửa ${BMH.esc(p.materials.choices.door)}</text></g></svg>`;
};
BMH.sectionSvg = () => {
  const p=BMH.state.project,{floors,floorHeight,slab}=BMH.projectLevels(),baseY=438,left=120,right=830,span=right-left,fh=82;
  const floorsSvg=Array.from({length:floors},(_,f)=>{const y=baseY-(f+1)*fh;const rooms=BMH.floorRooms(f).slice(0,3);return `<g class="section-floor"><rect x="${left}" y="${y}" width="${span}" height="${fh}" class="section-space"/><rect x="${left-5}" y="${y+fh-8}" width="${span+10}" height="8" class="section-slab"/>${rooms.map((r,i)=>{const x=left+i*span/Math.max(1,rooms.length),w=span/Math.max(1,rooms.length);return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y+fh}" class="section-wall"/><text x="${x+w/2}" y="${y+fh*.58}" text-anchor="middle">${BMH.esc(r.name)}</text>`}).join('')}<text x="${left+12}" y="${y+20}" class="section-level-name">TẦNG ${f+1}</text></g>`}).join('');
  const stairs=Array.from({length:9},(_,i)=>{const x=left+span*.58+i*18,y=baseY-14-i*8;return `<line x1="${x}" y1="${y}" x2="${x+18}" y2="${y}"/>`}).join('');
  const levels=Array.from({length:floors+1},(_,i)=>{const y=baseY-i*fh;return `<g class="level-marker"><line x1="72" y1="${y}" x2="${left-8}" y2="${y}"/><path d="M72 ${y}l10 -6v12z"/><text x="56" y="${y+4}" text-anchor="end">${i===0?'±0.000':`+${(i*floorHeight).toFixed(3)}`}</text></g>`}).join('');
  return `<svg class="technical-view-svg section-svg" viewBox="0 0 960 520" aria-label="Mặt cắt kiến trúc sơ bộ"><rect width="960" height="520" class="section-bg"/><path d="M80 438H900" class="ground-line"/><g class="foundation"><path d="M135 438v30h-28l16 22h44l16-22h-28v-30M795 438v30h-28l16 22h44l16-22h-28v-30"/></g>${floorsSvg}<g class="section-stairs">${stairs}<path d="M${left+span*.58} ${baseY-14}L${left+span*.58+162} ${baseY-78}"/></g><g class="section-roof"><path d="M${left-14} ${baseY-floors*fh}H${right+14}l-16-18H${left+16}z"/></g>${levels}<g class="section-height"><line x1="880" y1="${baseY}" x2="880" y2="${baseY-floors*fh-18}"/><line x1="870" y1="${baseY}" x2="890" y2="${baseY}"/><line x1="870" y1="${baseY-floors*fh-18}" x2="890" y2="${baseY-floors*fh-18}"/><text x="895" y="${baseY-floors*fh/2}" transform="rotate(-90 895 ${baseY-floors*fh/2})">CHIỀU CAO TẦNG ${floorHeight.toFixed(1)}m</text></g><g class="doc-title"><text x="70" y="500">MẶT CẮT A–A · SƠ BỘ</text><text x="520" y="500">Sàn ${Math.round(slab*1000)}mm · Cao tầng ${floorHeight.toFixed(1)}m · Móng minh họa</text></g></svg>`;
};
BMH.areaSchedule = () => BMH.state.project.plan.rooms.map(r=>({floor:r.floor+1,name:r.name,area:r.w*r.h,type:r.type}));
BMH.openingSchedule = () => BMH.state.project.plan.openings.map(o=>{const r=BMH.state.project.plan.rooms.find(x=>x.id===o.roomId);return {code:BMH.openingCode(o),floor:o.floor+1,room:r?.name||'—',kind:o.kind,width:o.width||0,side:o.side};});
