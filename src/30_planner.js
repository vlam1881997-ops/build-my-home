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
    if(r.type==='bed' && !p.plan.openings.some(o=>o.roomId===r.id&&o.kind==='window'))issues.push({sev:'info',text:`${r.name} chưa có cửa sổ/ô thoáng trên mặt bằng.`});
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

BMH.planSvg = ({interactive=true, floor=BMH.state.ui.planner.floor}={}) => {
  const p=BMH.state.project, ui=BMH.state.ui.planner, rooms=BMH.floorRooms(floor), W=p.site.width,H=p.site.depth;
  const usedH=Math.max(6,...rooms.map(r=>r.y+r.h)), Hview=Math.min(H,Math.max(usedH+1,10)), m=2.55, major=1, minor=.2;
  const kua=BMH.kua(p.household.ownerBirth,p.household.ownerGender), good=kua?.dirs?.[0];
  const feng=ui.showFeng&&good?(()=>{const pos={'Bắc':[W*.2,0,W*.6,Hview*.22],'Nam':[W*.2,Hview*.78,W*.6,Hview*.22],'Đông':[W*.78,Hview*.2,W*.22,Hview*.6],'Tây':[0,Hview*.2,W*.22,Hview*.6],'Đông Nam':[W*.58,Hview*.58,W*.42,Hview*.42],'Đông Bắc':[W*.58,0,W*.42,Hview*.42],'Tây Nam':[0,Hview*.58,W*.42,Hview*.42],'Tây Bắc':[0,0,W*.42,Hview*.42]}[good];return pos?`<g class="feng-zone"><rect x="${pos[0]}" y="${pos[1]}" width="${pos[2]}" height="${pos[3]}"/><text x="${pos[0]+.16}" y="${pos[1]+.34}">Hướng tốt tham khảo · ${good}</text></g>`:''})():'';
  const roomMarkup=rooms.map((r,i)=>`<g class="room room-${r.type} ${ui.selected===r.id?'selected':''}" data-room-id="${r.id}"><rect class="room-interior" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>${ui.showFurniture?BMH.furnitureSvg(r):''}<g class="room-label"><text class="room-name" x="${r.x+r.w/2}" y="${r.y+r.h/2-.05}">${BMH.esc(r.name).toUpperCase()}</text><text class="room-area" x="${r.x+r.w/2}" y="${r.y+r.h/2+.22}">${BMH.num(r.w*r.h)} m² · ${BMH.num(r.w)}×${BMH.num(r.h)}m</text></g>${interactive&&ui.selected===r.id?`<rect class="selection-outline" x="${r.x+.04}" y="${r.y+.04}" width="${Math.max(.01,r.w-.08)}" height="${Math.max(.01,r.h-.08)}"/><circle class="resize-handle" data-resize-id="${r.id}" cx="${r.x+r.w}" cy="${r.y+r.h}" r=".18"/>`:''}</g>`).join('');
  const walls=BMH.archWallsSvg(floor), openings=p.plan.openings.filter(o=>o.floor===floor).map(BMH.openingSvg).join('');
  const dims=ui.showDimensions?BMH.dimensionChainSvg(floor,Hview):'';
  const axesX=Array.from({length:Math.max(2,Math.ceil(W/2)+1)},(_,i)=>{const x=Math.min(W,i*2);return `<g class="axis"><circle cx="${x}" cy="-.72" r=".15"/><text x="${x}" y="-.67" text-anchor="middle">${i+1}</text><line x1="${x}" y1="-.55" x2="${x}" y2="0"/></g>`}).join('');
  const letters='ABCDEFGH'; const axesY=Array.from({length:Math.max(2,Math.ceil(Hview/4)+1)},(_,i)=>{const y=Math.min(Hview,i*4);return `<g class="axis"><circle cx="-.72" cy="${y}" r=".15"/><text x="-.72" y="${y+.05}" text-anchor="middle">${letters[i]||i+1}</text><line x1="-.55" y1="${y}" x2="0" y2="${y}"/></g>`}).join('');
  const north=`<g class="north-arrow" transform="translate(${W+.92} .65)"><circle r=".34"/><path d="M0 -.27L.12 .11 0 .05-.12 .11Z"/><text x="0" y="-.44">N</text></g>`;
  const scale=`<g class="scale-bar" transform="translate(${Math.max(.2,W-2.2)} ${Hview+.63})"><rect x="0" y="0" width=".5" height=".10"/><rect x=".5" y="0" width=".5" height=".10" class="alt"/><rect x="1" y="0" width="1" height=".10"/><text x="0" y=".30">0</text><text x="1" y=".30">1m</text><text x="2" y=".30" text-anchor="end">2m</text></g>`;
  return `<svg id="plannerSvg" class="planner-svg architecture-svg" viewBox="-${m} -${m} ${W+m*2+1.45} ${Hview+m*2+1.15}" preserveAspectRatio="xMidYMid meet" data-floor="${floor}" aria-label="Mặt bằng kiến trúc sơ bộ tầng ${floor+1}"><defs><pattern id="minorGrid" width="${minor}" height="${minor}" patternUnits="userSpaceOnUse"><path d="M ${minor} 0 L 0 0 0 ${minor}"/></pattern><pattern id="majorGrid" width="${major}" height="${major}" patternUnits="userSpaceOnUse"><path d="M ${major} 0 L 0 0 0 ${major}"/></pattern></defs><rect x="-${m}" y="-${m}" width="${W+m*2+1.45}" height="${Hview+m*2+1.15}" class="sheet-bg"/><rect x="0" y="0" width="${W}" height="${Hview}" class="paper"/><rect x="0" y="0" width="${W}" height="${Hview}" class="minor-grid"/><rect x="0" y="0" width="${W}" height="${Hview}" class="major-grid"/>${feng}<g class="axis-layer">${axesX}${axesY}</g><g class="room-layer">${roomMarkup}</g><g class="wall-layer">${walls}</g><g class="opening-layer">${openings}</g>${dims}<rect class="plot-boundary" x="0" y="0" width="${W}" height="${Hview}"/>${north}${scale}</svg>`;
};

BMH.findFreeSpot = (w,h,floor) => { const s=BMH.state.ui.planner.snap, site=BMH.state.project.site; for(let y=0;y<=site.depth-h+.001;y+=s)for(let x=0;x<=site.width-w+.001;x+=s){const r={id:'temp',floor,x:+x.toFixed(2),y:+y.toFixed(2),w,h};if(BMH.roomValid(r))return {x:r.x,y:r.y};} return null; };
BMH.addRoom = type => { const defs={living:['Phòng khách',4,4],kitchen:['Bếp + ăn',4,4],bed:['Phòng ngủ',3.2,4],bath:['WC',1.8,2.2],stairs:['Cầu thang',2,4],garage:['Gara',3,5],corridor:['Hành lang',1.2,4],balcony:['Ban công',1.5,3]}; const d=defs[type]||defs.bed, floor=BMH.state.ui.planner.floor, pos=BMH.findFreeSpot(Math.min(d[1],BMH.state.project.site.width),Math.min(d[2],BMH.state.project.site.depth),floor); if(!pos)return BMH.toast('Không còn vùng trống đủ cho không gian mẫu.'); const r={id:BMH.uid('r'),floor,name:d[0],type,x:pos.x,y:pos.y,w:Math.min(d[1],BMH.state.project.site.width),h:Math.min(d[2],BMH.state.project.site.depth)}; BMH.state.project.plan.rooms.push(r); BMH.state.ui.planner.selected=r.id; BMH.save(); BMH.render(); };
BMH.addOpening = kind => { const r=BMH.selectedRoom(); if(!r)return BMH.toast('Hãy chọn phòng trước.'); const same=BMH.state.project.plan.openings.filter(o=>o.roomId===r.id); const side=['south','east','north','west'][same.length%4]; BMH.state.project.plan.openings.push({id:BMH.uid('o'),floor:r.floor,roomId:r.id,kind,side,offset:.45,width:kind==='door'?.9:1.4}); BMH.save(); BMH.render(); };
