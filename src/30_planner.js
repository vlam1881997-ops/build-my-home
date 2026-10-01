BMH.roomColor = type => ({living:'#f4f7f1',kitchen:'#fff9ef',bed:'#f4f7fb',bath:'#f0f7f7',stairs:'#f5f2fa',garage:'#f6f3ee',corridor:'#fafaf7',balcony:'#f1f8f0'}[type]||'#f7f8f5');
BMH.floorRooms = (floor=BMH.state.ui.planner.floor) => BMH.state.project.plan.rooms.filter(r=>r.floor===floor);
BMH.selectedRoom = () => BMH.state.project.plan.rooms.find(r=>r.id===BMH.state.ui.planner.selected)||null;
BMH.roomsOverlap = (a,b) => a.floor===b.floor && a.id!==b.id && a.x < b.x+b.w-.001 && a.x+a.w > b.x+.001 && a.y < b.y+b.h-.001 && a.y+a.h > b.y+.001;
BMH.roomValid = room => [room.x,room.y,room.w,room.h].every(Number.isFinite) && room.w>=.6 && room.h>=.6 && room.x>=0 && room.y>=0 && room.x+room.w<=BMH.state.project.site.width+.001 && room.y+room.h<=BMH.state.project.site.depth+.001 && !BMH.state.project.plan.rooms.some(r=>BMH.roomsOverlap(room,r));

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
  const env=BMH.buildableEnvelope?BMH.buildableEnvelope(p.site):null;
  if(env){for(const r of p.plan.rooms){if(r.x<env.side-.01||r.x+r.w>p.site.width-env.side+.01||r.y<env.front-.01||r.y+r.h>p.site.depth-env.rear+.01)issues.push({sev:'info',text:`${r.name}: đang nằm ngoài khung xây dựng mục tiêu theo khoảng lùi sơ bộ ở Bước 3.`});}}
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
  for(let f=0;f<p.site.floors;f++){const ca=BMH.circulationAnalysis?BMH.circulationAnalysis(f):null;if(ca){if(!ca.entries.length)issues.push({sev:'warn',text:`Tầng ${f+1} chưa có cửa ra/vào ngoài nhà được nhận diện.`});ca.unreachable.forEach(r=>issues.push({sev:'warn',text:`${r.name}: chưa có đường lưu thông liên tục qua cửa đi.`}));ca.narrow.forEach(r=>issues.push({sev:'warn',text:`${r.name}: bề rộng lưu thông nhỏ hơn 0,9m.`}));if(!ca.elderlyReady)issues.push({sev:'info',text:'Lối tiếp cận phòng người lớn tuổi/WC tầng trệt cần được kiểm tra lại.'});}}
  const hot=BMH.riskValue(BMH.regionProfile(p.site).heat)>=2; p.plan.rooms.filter(r=>['bed','living'].includes(r.type)).forEach(r=>{const env=BMH.roomEnvironment(r);if(hot&&env.westWidth>=1.2)issues.push({sev:'info',text:`${r.name}: ô mở hướng Tây khá lớn trong vùng nóng; nên kiểm tra lam che, kính và cây xanh.`});if(env.windCapture<55)issues.push({sev:'info',text:`${r.name}: khả năng đón gió chủ đạo còn thấp; cân nhắc thêm ô mở đối lưu.`});});
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
  const rr=w;
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

BMH.openingWallSpan = (opening,rooms=BMH.state.project.plan.rooms) => {
  const r=rooms.find(x=>x.id===opening.roomId);
  if(!r||r.floor!==opening.floor||!['north','south','east','west'].includes(opening.side))return null;
  const horizontal=opening.side==='north'||opening.side==='south',len=horizontal?r.w:r.h;
  const width=Number(opening.width),offset=Number(opening.offset);
  if(!Number.isFinite(width)||width<=0||width>len||!Number.isFinite(offset))return null;
  const start=(horizontal?r.x:r.y)+(len-width)*BMH.clamp(offset,0,1);
  return {o:horizontal?'h':'v',c:horizontal?(opening.side==='north'?r.y:r.y+r.h):(opening.side==='west'?r.x:r.x+r.w),a:start,b:start+width};
};
BMH.wallSolidSegments = (floor=BMH.state.ui.planner.floor) => {
  const holes=BMH.state.project.plan.openings.filter(o=>o.floor===floor).map(o=>BMH.openingWallSpan(o)).filter(Boolean);
  return BMH.wallSegments(floor).flatMap(s=>{
    const cut=holes.filter(h=>h.o===s.o&&Math.abs(h.c-s.c)<.001&&h.a<s.b-.001&&h.b>s.a+.001)
      .map(h=>({a:Math.max(s.a,h.a),b:Math.min(s.b,h.b)})).sort((a,b)=>a.a-b.a);
    const solid=[];let cursor=s.a;
    for(const gap of cut){if(gap.a>cursor+.001)solid.push({...s,a:cursor,b:gap.a});cursor=Math.max(cursor,gap.b);}
    if(cursor<s.b-.001)solid.push({...s,a:cursor,b:s.b});
    return solid;
  });
};
BMH.archWallsSvg = floor => BMH.wallSolidSegments(floor).map(s=>{
  const thickness=s.count>1?.12:.22,half=thickness/2;
  return s.o==='h'
    ? `<rect class="arch-wall-fill ${s.count>1?'internal':'external'}" x="${s.a}" y="${s.c-half}" width="${s.b-s.a}" height="${thickness}"/>`
    : `<rect class="arch-wall-fill ${s.count>1?'internal':'external'}" x="${s.c-half}" y="${s.a}" width="${thickness}" height="${s.b-s.a}"/>`;
}).join('');

BMH.dimensionChainSvg = (floor,Hview) => {
  const rooms=BMH.floorRooms(floor),W=BMH.state.project.site.width;
  const xs=[0,...rooms.flatMap(r=>[r.x,r.x+r.w]),W].filter(x=>x>=0&&x<=W).map(x=>+x.toFixed(3));
  const ys=[0,...rooms.flatMap(r=>[r.y,r.y+r.h]),Hview].filter(y=>y>=0&&y<=Hview).map(y=>+y.toFixed(3));
  const ux=[...new Set(xs)].sort((a,b)=>a-b),uy=[...new Set(ys)].sort((a,b)=>a-b);
  const mm=value=>Math.round(value*1000);
  const chainX=ux.slice(0,-1).map((x,i)=>{const x2=ux[i+1],d=x2-x;return `<g class="dim-seg"><line x1="${x}" y1="-1.25" x2="${x2}" y2="-1.25"/><line x1="${x}" y1="-1.36" x2="${x}" y2="-1.13"/><line x1="${x2}" y1="-1.36" x2="${x2}" y2="-1.13"/><text x="${(x+x2)/2}" y="-1.38">${mm(d)}</text></g>`}).join('');
  const chainY=uy.slice(0,-1).map((y,i)=>{const y2=uy[i+1],d=y2-y;return `<g class="dim-seg"><line x1="-1.25" y1="${y}" x2="-1.25" y2="${y2}"/><line x1="-1.36" y1="${y}" x2="-1.13" y2="${y}"/><line x1="-1.36" y1="${y2}" x2="-1.13" y2="${y2}"/><text x="-1.42" y="${(y+y2)/2}" transform="rotate(-90 -1.42 ${(y+y2)/2})">${mm(d)}</text></g>`}).join('');
  return `<g class="dimension-chain">${chainX}${chainY}<g class="overall-dim"><line x1="0" y1="-1.72" x2="${W}" y2="-1.72"/><line x1="0" y1="-1.84" x2="0" y2="-1.60"/><line x1="${W}" y1="-1.84" x2="${W}" y2="-1.60"/><text x="${W/2}" y="-1.88">${mm(W)} mm</text><line x1="-1.72" y1="0" x2="-1.72" y2="${Hview}"/><line x1="-1.84" y1="0" x2="-1.60" y2="0"/><line x1="-1.84" y1="${Hview}" x2="-1.60" y2="${Hview}"/><text x="-1.91" y="${Hview/2}" transform="rotate(-90 -1.91 ${Hview/2})">${mm(Hview)} mm</text></g></g>`;
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
  const profile=BMH.regionProfile(BMH.state.project.site), heatRisk=BMH.riskValue(profile.heat), windAngles=BMH.windDirectionAngles(profile);
  const sideAngle={north:0,east:90,south:180,west:270};
  const westWidth=windows.filter(o=>o.side==='west').reduce((a,o)=>a+(Number(o.width)||0),0);
  const windAligned=windows.filter(o=>Math.min(...windAngles.map(a=>BMH.angleDiff(sideAngle[o.side]??0,a)))<=55);
  const heatExposure=BMH.clamp(Math.round(22+westWidth*18*heatRisk+((ext.includes('west')&&heatRisk>=2)?12:0)),12,96);
  const windCapture=BMH.clamp(Math.round(35+windAligned.length*24+(distinct.length>=2?12:0)),30,98);
  const daylight=BMH.clamp(Math.round(42+(totalWidth/Math.max(2.4,Math.sqrt(area)*2))*55+ext.length*4-westWidth*heatRisk*1.5),30,98);
  const opposite=(distinct.includes('north')&&distinct.includes('south'))||(distinct.includes('east')&&distinct.includes('west'));
  const ventilation=BMH.clamp(Math.round(34+distinct.length*18+(opposite?16:0)+(openings.some(o=>o.kind==='door')?5:0)+windCapture*.12),28,98);
  return {externalSides:ext,windows:windows.length,totalWidth,daylight,ventilation,crossVent:opposite||distinct.length>=2,heatExposure,windCapture,westWidth};
};
BMH.roomSector = room => {
  if(!room)return 'Trung tâm';
  const site=BMH.state.project.site,cx=(Number(site.width)||5)/2,cy=(Number(site.depth)||20)/2,p=BMH.roomCenter?BMH.roomCenter(room):{x:room.x+room.w/2,y:room.y+room.h/2};
  const dx=p.x-cx,dy=p.y-cy,dist=Math.hypot(dx/Math.max(1,cx),dy/Math.max(1,cy));
  if(dist<.16)return 'Trung tâm';
  const front=BMH.directionAngle(site.frontDirection||'Nam')*Math.PI/180, back=front+Math.PI, right=front+Math.PI/2;
  const east=dx*Math.sin(right)+dy*Math.sin(back), north=dx*Math.cos(right)+dy*Math.cos(back);
  const ang=(Math.atan2(east,north)*180/Math.PI+360)%360;
  return BMH.DIRECTIONS.reduce((best,d)=>BMH.angleDiff(ang,d[1])<BMH.angleDiff(ang,best[1])?d:best,BMH.DIRECTIONS[0])[0];
};
BMH.roomPlacementReview = room => {
  if(!room)return null;
  const p=BMH.state.project,site=p.site,env=BMH.roomEnvironment(room),ext=env.externalSides||[],feng=BMH.fengProfile?BMH.fengProfile():null,sector=BMH.roomSector(room),envelope=BMH.buildableEnvelope(site),notes=[];
  let score=66;
  const insideEnvelope=room.x>=envelope.side-.01&&room.x+room.w<=site.width-envelope.side+.01&&room.y>=envelope.front-.01&&room.y+room.h<=site.depth-envelope.rear+.01;
  if(insideEnvelope){score+=7;notes.push('Nằm trong khung xây dựng mục tiêu.');}else{score-=12;notes.push('Đang vượt khung xây dựng mục tiêu/ khoảng lùi sơ bộ.');}
  if(['living','bed','kitchen'].includes(room.type)){
    if(env.daylight>=72){score+=7;notes.push('Ánh sáng tự nhiên tốt.');}else if(env.daylight<55){score-=10;notes.push('Ánh sáng tự nhiên còn yếu.');}
    if(env.ventilation>=70){score+=7;notes.push('Thông gió tự nhiên khá tốt.');}else if(env.ventilation<55){score-=9;notes.push('Thông gió tự nhiên chưa tốt.');}
    if(env.heatExposure>=76){score-=9;notes.push('Vị trí có tải nắng/nóng cao, nên tăng che nắng.');}else if(env.heatExposure<=48)score+=4;
    if(ext.length)score+=3;else{score-=6;notes.push('Không gian thiếu mặt tường ngoài trực tiếp.');}
  }
  if(room.type==='living'){
    if(room.y<=site.depth*.38){score+=6;notes.push('Phòng khách gần vùng tiếp cận phía trước, thuận luồng vào nhà.');}else{score-=4;notes.push('Phòng khách nằm khá sâu so với vùng tiếp cận phía trước.');}
  }
  if(room.type==='garage'){
    if(room.y<=site.depth*.32){score+=9;notes.push('Gara gần mặt tiếp cận, thuận xe ra vào.');}else{score-=12;notes.push('Gara nằm sâu, đường xe ra vào có thể bất tiện.');}
  }
  if(room.type==='bath'){
    if(ext.length){score+=5;notes.push('WC có mặt thoáng ngoài hỗ trợ thoát ẩm.');}else{score-=5;notes.push('WC thiếu mặt thoáng trực tiếp; cần quạt hút/ống thông gió.');}
    if(room.floor>0){const below=p.plan.rooms.filter(r=>r.floor===room.floor-1&&r.type==='bath');const best=below.length?Math.max(...below.map(b=>BMH.rectOverlapArea(room,b))):0;if(best>=room.w*room.h*.35){score+=8;notes.push('Khu ướt phối hợp tốt với tầng dưới.');}else if(below.length){score-=8;notes.push('Khu ướt lệch tầng dưới, đường ống đứng sẽ dài hơn.');}}
  }
  if(room.type==='stairs'&&room.floor>0){const below=p.plan.rooms.find(r=>r.floor===room.floor-1&&r.type==='stairs');if(below){const overlap=BMH.rectOverlapArea(room,below);if(overlap>=room.w*room.h*.45){score+=9;notes.push('Cầu thang đang thẳng trục với tầng dưới.');}else{score-=12;notes.push('Cầu thang lệch trục tầng dưới.');}}}
  if(room.type==='bed'&&/ông bà|ba|mẹ|người thân/i.test(room.name||'')){
    if(room.floor===0){score+=8;notes.push('Phòng người lớn tuổi ở tầng trệt, thuận tiếp cận.');}else{score-=14;notes.push('Phòng người lớn tuổi nên ưu tiên tầng trệt nếu điều kiện cho phép.');}
  }
  if(['living','bed'].includes(room.type)&&sector!=='Trung tâm'&&feng?.dirs?.length){
    if(feng.dirs.includes(sector)){score+=6;notes.push(`Vùng ${sector} nằm trong nhóm hướng phong thủy tham khảo của gia đình.`);}else{score-=3;notes.push(`Vùng ${sector} không nằm trong nhóm hướng ưu tiên chung; chỉ nên xem như lớp tham khảo.`);}
  }
  score=BMH.clamp(Math.round(score),25,98);
  const code=score>=74?'good':score>=57?'mid':'bad',status=code==='good'?'HỢP':code==='mid'?'CÂN NHẮC':'KHÔNG HỢP';
  return {roomId:room.id,name:room.name,type:room.type,score,code,status,sector,daylight:env.daylight,ventilation:env.ventilation,heat:env.heatExposure,notes:notes.slice(0,5)};
};
BMH.roomDragGripSvg = r => {
  const w=Math.min(.92,Math.max(.48,r.w*.30)),h=.30,x=r.x+.10,y=r.y+.10;
  if(r.w<.78||r.h<.62)return `<circle class="room-grab-dot" data-room-id="${r.id}" cx="${r.x+r.w-.15}" cy="${r.y+.15}" r=".09"/>`;
  return `<g class="room-grab-hint" data-room-id="${r.id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".10"/><text x="${x+w/2}" y="${y+.205}">↕ KÉO</text></g>`;
};

BMH.environmentOverlaySvg = floor => BMH.floorRooms(floor).map(r=>{const a=BMH.roomEnvironment(r),score=Math.round((a.daylight+a.ventilation)/2),cls=score>=78?'good':score>=60?'mid':'low',x=r.x+r.w/2,y=r.y+r.h-.26;return `<g class="env-badge ${cls}"><rect x="${x-.52}" y="${y-.16}" width="1.04" height=".30" rx=".12"/><text x="${x}" y="${y+.035}">☀ ${a.daylight} · ≋ ${a.ventilation}</text></g>`}).join('');

BMH.climateOverlaySvg = floor => {
  const site=BMH.state.project.site, p=BMH.regionProfile(site), orient=BMH.orientationAnalysis(site), W=site.width, rooms=BMH.floorRooms(floor);
  const westRooms=rooms.filter(r=>BMH.externalSides(r).includes('west'));
  const heatBand=BMH.riskValue(p.heat)>=2?`<g class="climate-heat-band"><rect x="-.52" y="0" width=".48" height="${Math.max(4,Math.min(site.depth,18))}" rx=".12"/><text x="-.29" y="1.1" transform="rotate(-90 -.29 1.1)">NẮNG TÂY</text></g>`:'';
  const windAngle=(orient.windAngles?.[0]??135)*Math.PI/180, cx=W*.5, cy=Math.min(site.depth,14)*.52, len=Math.max(2.2,W*.42), x1=cx-Math.sin(windAngle)*len, y1=cy+Math.cos(windAngle)*len, x2=cx+Math.sin(windAngle)*len, y2=cy-Math.cos(windAngle)*len;
  const frontAngle=BMH.directionAngle(site.frontDirection||'Nam')*Math.PI/180, fx=W*.5+Math.sin(frontAngle)*(W*.54), fy=cy-Math.cos(frontAngle)*(W*.54);
  return `<g class="climate-plan-overlay">${heatBand}<g class="wind-arrow"><line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><path d="M${x2} ${y2}l-.28 .16m.28-.16l-.08 .32"/><text x="${(x1+x2)/2}" y="${(y1+y2)/2-.15}">GIÓ CHỦ ĐẠO</text></g><g class="front-arrow"><line x1="${cx}" y1="${cy}" x2="${fx}" y2="${fy}"/><circle cx="${cx}" cy="${cy}" r=".12"/><text x="${fx}" y="${fy-.16}">MẶT TIỀN ${BMH.esc(site.frontDirection||'Nam').toUpperCase()}</text></g>${westRooms.map(r=>`<circle class="heat-dot" cx="${r.x+.12}" cy="${r.y+r.h/2}" r=".09"/>`).join('')}</g>`;
};

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
  if(BMH.isRoomLocked(cur.id))return BMH.toast('Tầng hoặc phòng đang khóa.');
  const rooms=structuredClone(BMH.state.project.plan.rooms),r=rooms.find(x=>x.id===cur.id);const old={...r};Object.assign(r,{x:below.x,y:below.y,w:Math.min(r.w,below.w),h:Math.min(r.h,below.h)});if(!BMH.layoutValid(rooms)){Object.assign(r,old);return BMH.toast('Không thể căn tự động vì sẽ chồng lên không gian khác.');}
  BMH.pushPlanHistory();BMH.state.project.plan.rooms=rooms;BMH.save();BMH.render();BMH.toast(type==='stairs'?'Đã căn cầu thang theo tầng dưới.':'Đã căn khu WC theo tầng dưới.');
};



/* ===== V3.6 circulation + technical drafting helpers ===== */
BMH.roomCenter = r => ({x:r.x+r.w/2,y:r.y+r.h/2});
BMH.openingGeometry = o => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===o.roomId); if(!r)return null;
  const span=(o.side==='north'||o.side==='south')?r.w:r.h, width=Math.min(o.width||.9,span), off=BMH.clamp(o.offset??.5,0,1), start=(span-width)*off;
  if(o.side==='north')return {room:r,x:r.x+start+width/2,y:r.y,spanStart:r.x+start,spanEnd:r.x+start+width};
  if(o.side==='south')return {room:r,x:r.x+start+width/2,y:r.y+r.h,spanStart:r.x+start,spanEnd:r.x+start+width};
  if(o.side==='west')return {room:r,x:r.x,y:r.y+start+width/2,spanStart:r.y+start,spanEnd:r.y+start+width};
  return {room:r,x:r.x+r.w,y:r.y+start+width/2,spanStart:r.y+start,spanEnd:r.y+start+width};
};
BMH.neighborAcrossOpening = o => {
  const g=BMH.openingGeometry(o); if(!g)return null; const r=g.room,eps=.03;
  return BMH.floorRooms(r.floor).find(n=>{
    if(n.id===r.id)return false;
    if(o.side==='north' && Math.abs(n.y+n.h-r.y)<eps) return g.x>n.x-eps&&g.x<n.x+n.w+eps;
    if(o.side==='south' && Math.abs(n.y-(r.y+r.h))<eps) return g.x>n.x-eps&&g.x<n.x+n.w+eps;
    if(o.side==='west' && Math.abs(n.x+n.w-r.x)<eps) return g.y>n.y-eps&&g.y<n.y+n.h+eps;
    if(o.side==='east' && Math.abs(n.x-(r.x+r.w))<eps) return g.y>n.y-eps&&g.y<n.y+n.h+eps;
    return false;
  })||null;
};
BMH.planConnections = (floor=BMH.state.ui.planner.floor) => BMH.state.project.plan.openings.filter(o=>o.floor===floor&&o.kind==='door').map(o=>{const g=BMH.openingGeometry(o),n=BMH.neighborAcrossOpening(o);return g?{opening:o,from:g.room,to:n,point:{x:g.x,y:g.y},external:!n}:null}).filter(Boolean);
BMH.circulationAnalysis = (floor=BMH.state.ui.planner.floor) => {
  const rooms=BMH.floorRooms(floor), conns=BMH.planConnections(floor), graph=new Map(rooms.map(r=>[r.id,new Set()]));
  conns.forEach(c=>{if(c.to){graph.get(c.from.id)?.add(c.to.id);graph.get(c.to.id)?.add(c.from.id);}});
  const stairs=rooms.filter(r=>r.type==='stairs'&&floor>0&&BMH.floorRooms(floor-1).some(b=>b.type==='stairs'&&Math.abs(b.x-r.x)<.03&&Math.abs(b.y-r.y)<.03&&Math.abs(b.w-r.w)<.03&&Math.abs(b.h-r.h)<.03));
  const entries=[...conns.filter(c=>c.external).map(c=>c.from.id),...stairs.map(r=>r.id)], fallback=rooms.find(r=>r.type==='living')?.id||rooms[0]?.id, starts=entries.length?[...new Set(entries)]:fallback?[fallback]:[];
  const reached=new Set(starts),q=[...starts]; while(q.length){const id=q.shift();for(const n of graph.get(id)||[])if(!reached.has(n)){reached.add(n);q.push(n);}}
  const unreachable=rooms.filter(r=>!reached.has(r.id));
  const narrow=rooms.filter(r=>r.type==='corridor'&&Math.min(r.w,r.h)<.9);
  const bed0=rooms.find(r=>r.type==='bed'&&/ông bà|ba|mẹ/i.test(r.name))||rooms.find(r=>r.type==='bed'), bath0=rooms.find(r=>r.type==='bath');
  const elderlyReady=floor!==0||!BMH.state.project.household.relatives.length||!!(bed0&&bath0&&reached.has(bed0.id)&&reached.has(bath0.id));
  let score=rooms.length?Math.round(reached.size/rooms.length*100):100; if(!entries.length)score-=12; score-=narrow.length*8;if(!elderlyReady)score-=10;score=BMH.clamp(score,35,100);
  return {score,entries,reached,unreachable,narrow,elderlyReady,connections:conns};
};
BMH.circulationSvg = floor => {
  const a=BMH.circulationAnalysis(floor), seen=new Set();
  const lines=a.connections.filter(c=>c.to).map(c=>{const key=[c.from.id,c.to.id].sort().join(':');if(seen.has(key))return'';seen.add(key);const A=BMH.roomCenter(c.from),B=BMH.roomCenter(c.to);return `<path class="circulation-path" d="M${A.x} ${A.y} L${c.point.x} ${c.point.y} L${B.x} ${B.y}" marker-end="url(#routeArrow)"/>`;}).join('');
  const entries=a.connections.filter(c=>c.external).map(c=>{const A=BMH.roomCenter(c.from),p=c.point;const dx=p.x-A.x,dy=p.y-A.y,len=Math.hypot(dx,dy)||1,ox=p.x+dx/len*.65,oy=p.y+dy/len*.65;return `<path class="circulation-entry" d="M${ox} ${oy} L${p.x} ${p.y} L${A.x} ${A.y}" marker-end="url(#routeArrow)"/><g class="entry-tag"><circle cx="${ox}" cy="${oy}" r=".16"/><text x="${ox}" y="${oy+.04}">VÀO</text></g>`;}).join('');
  const bad=a.unreachable.map(r=>`<rect class="unreachable-room" x="${r.x+.08}" y="${r.y+.08}" width="${Math.max(.1,r.w-.16)}" height="${Math.max(.1,r.h-.16)}" rx=".08"/>`).join('');
  return `<g class="circulation-layer">${lines}${entries}${bad}</g>`;
};
BMH.sectionLineSvg = (floor,Hview) => {
  const rooms=BMH.floorRooms(floor), stair=rooms.find(r=>r.type==='stairs'), y=stair?stair.y+stair.h/2:Math.min(Hview-.7,Math.max(.7,(Math.max(...rooms.map(r=>r.y+r.h),6))/2));
  const W=BMH.state.project.site.width;return `<g class="section-cut-line"><line x1="-.42" y1="${y}" x2="${W+.42}" y2="${y}"/><circle cx="-.62" cy="${y}" r=".18"/><circle cx="${W+.62}" cy="${y}" r=".18"/><text x="-.62" y="${y+.05}">A</text><text x="${W+.62}" y="${y+.05}">A</text><path d="M-.44 ${y}l.18-.10v.20z"/><path d="M${W+.44} ${y}l-.18-.10v.20z"/></g>`;
};
BMH.roomTechnicalStats = r => {const os=BMH.state.project.plan.openings.filter(o=>o.roomId===r.id),env=BMH.roomEnvironment?BMH.roomEnvironment(r):{daylight:0,ventilation:0};return {area:r.w*r.h,perimeter:2*(r.w+r.h),doors:os.filter(o=>o.kind==='door').length,windows:os.filter(o=>o.kind==='window').length,daylight:env.daylight,ventilation:env.ventilation};};

BMH.planSnapshot = () => structuredClone(BMH.state.project.plan);
BMH.pushPlanHistory = () => {
  BMH.planHistory.undo.push(BMH.planSnapshot());
  if(BMH.planHistory.undo.length>30)BMH.planHistory.undo.shift();
  BMH.planHistory.redo.length=0;
};
BMH.undoPlan = () => {
  if(BMH.planHasLocks())return BMH.toast('Mở khóa phòng/tầng trước khi hoàn tác mặt bằng.');
  const snap=BMH.planHistory.undo.pop(); if(!snap)return BMH.toast('Chưa có thao tác để hoàn tác.');
  BMH.planHistory.redo.push(BMH.planSnapshot()); BMH.state.project.plan=structuredClone(snap); BMH.normalizeState(); BMH.save(); BMH.render();
};
BMH.redoPlan = () => {
  if(BMH.planHasLocks())return BMH.toast('Mở khóa phòng/tầng trước khi làm lại mặt bằng.');
  const snap=BMH.planHistory.redo.pop(); if(!snap)return BMH.toast('Chưa có thao tác để làm lại.');
  BMH.planHistory.undo.push(BMH.planSnapshot()); BMH.state.project.plan=structuredClone(snap); BMH.normalizeState(); BMH.save(); BMH.render();
};
BMH.isRoomLocked = id => (BMH.state.project.plan.lockedRoomIds||[]).includes(id)||(BMH.state.project.plan.lockedFloors||[]).includes(BMH.state.project.plan.rooms.find(r=>r.id===id)?.floor);
BMH.isFloorLocked = floor => (BMH.state.project.plan.lockedFloors||[]).includes(Number(floor));
BMH.planHasLocks = () => !!((BMH.state.project.plan.lockedRoomIds||[]).length||(BMH.state.project.plan.lockedFloors||[]).length);
BMH.toggleFloorLock = floor => {
  const list=BMH.state.project.plan.lockedFloors||(BMH.state.project.plan.lockedFloors=[]),f=Number(floor),i=list.indexOf(f);
  if(i>=0)list.splice(i,1);else list.push(f);
  BMH.save();BMH.render({preserveScroll:true});BMH.toast(i>=0?'Đã mở khóa tầng.':'Đã khóa tầng để tránh sửa nhầm.');
};
BMH.toggleRoomLock = id => {
  const room=BMH.state.project.plan.rooms.find(r=>r.id===id);if(room&&BMH.isFloorLocked(room.floor))return BMH.toast('Tầng đang khóa; hãy mở tầng trước.');
  const list=BMH.state.project.plan.lockedRoomIds||(BMH.state.project.plan.lockedRoomIds=[]),i=list.indexOf(id);
  if(i>=0)list.splice(i,1);else list.push(id);
  BMH.save();BMH.render({preserveScroll:true});
  BMH.toast(i>=0?'Đã mở khóa phòng.':'Đã khóa phòng để tránh kéo nhầm.');
};
BMH.withPlan = (plan,fn) => {
  const old=BMH.state.project.plan;BMH.state.project.plan=structuredClone(plan);
  try{return fn();}finally{BMH.state.project.plan=old;}
};
BMH.planMetrics = plan => BMH.withPlan(plan,()=>{
  const reviews=BMH.state.project.plan.rooms.map(r=>BMH.roomPlacementReview(r)).filter(Boolean);
  const placement=reviews.length?Math.round(reviews.reduce((a,r)=>a+r.score,0)/reviews.length):70;
  const circs=Array.from({length:Math.max(1,BMH.state.project.site.floors)},(_,f)=>BMH.circulationAnalysis(f).score);
  const circulation=Math.round(circs.reduce((a,b)=>a+b,0)/Math.max(1,circs.length));
  const issues=BMH.plannerIssues(),review=BMH.designReview(),area=BMH.planArea();
  const score=BMH.clamp(Math.round(review.overall*.58+placement*.24+circulation*.18-issues.filter(i=>i.sev==='error').length*4),35,98);
  return {score,placement,circulation,overall:review.overall,area,issues:issues.length};
});
BMH.roomSuggestionSpots = (room,limit=3) => {
  if(!room)return[];
  const plan=BMH.planSnapshot(),site=BMH.state.project.site,env=BMH.buildableEnvelope(site),step=Math.max(.5,Number(BMH.state.ui.planner.snap)||.2),spots=[];
  const xs=[],ys=[];for(let x=0;x<=site.width-room.w+.001;x+=step)xs.push(+x.toFixed(2));for(let y=0;y<=site.depth-room.h+.001;y+=step)ys.push(+y.toFixed(2));
  for(const y of ys)for(const x of xs){
    if(Math.abs(x-room.x)<.05&&Math.abs(y-room.y)<.05)continue;
    const candidate=structuredClone(plan),r=candidate.rooms.find(q=>q.id===room.id);if(!r)continue;r.x=x;r.y=y;
    if(!BMH.layoutValid(candidate.rooms))continue;
    const review=BMH.withPlan(candidate,()=>BMH.roomPlacementReview(r));if(!review)continue;
    const inside=x>=env.side-.01&&x+room.w<=site.width-env.side+.01&&y>=env.front-.01&&y+room.h<=site.depth-env.rear+.01;
    const distance=Math.hypot(x-room.x,y-room.y),rank=review.score+(inside?2:0)-Math.min(6,distance*.12);
    spots.push({x,y,score:review.score,rank,sector:review.sector,status:review.status,note:review.notes[0]||''});
  }
  spots.sort((a,b)=>b.rank-a.rank||b.score-a.score||a.y-b.y||a.x-b.x);
  const out=[];for(const spot of spots){if(out.every(x=>Math.hypot(x.x-spot.x,x.y-spot.y)>1.1))out.push(spot);if(out.length>=limit)break;}return out;
};
BMH.applyRoomSuggestion = (id,x,y) => {
  const r=BMH.state.project.plan.rooms.find(q=>q.id===id);if(!r)return;
  if(BMH.isRoomLocked(id))return BMH.toast('Phòng này đang khóa. Hãy mở khóa trước khi di chuyển.');
  BMH.pushPlanHistory();const old={x:r.x,y:r.y};r.x=Number(x);r.y=Number(y);
  if(!BMH.layoutValid(BMH.state.project.plan.rooms)){r.x=old.x;r.y=old.y;BMH.planHistory.undo.pop();return BMH.toast('Vị trí gợi ý hiện không còn trống.');}
  BMH.save();BMH.render({preserveScroll:true});const rev=BMH.roomPlacementReview(r);BMH.toast(`${r.name}: ${rev.status} ${rev.score}/100.`);
};
BMH.autoImprovePlan = () => {
  const candidates=BMH.state.project.plan.rooms.filter(r=>!BMH.isRoomLocked(r.id)).map(r=>({r,rev:BMH.roomPlacementReview(r)})).sort((a,b)=>a.rev.score-b.rev.score);
  if(!candidates.length)return BMH.toast('Tất cả phòng đang khóa.');
  BMH.pushPlanHistory();let moved=0;
  for(const item of candidates.slice(0,5)){
    const current=BMH.state.project.plan.rooms.find(r=>r.id===item.r.id),best=BMH.roomSuggestionSpots(current,1)[0];
    if(best&&best.score>=item.rev.score+3){current.x=best.x;current.y=best.y;moved++;}
  }
  if(!moved){BMH.planHistory.undo.pop();return BMH.toast('Phương án hiện đã khá ổn; không tìm được bước cải thiện an toàn rõ rệt.');}
  BMH.state.project.planVariants=[];BMH.save();BMH.render({preserveScroll:true});BMH.toast(`Đã tối ưu lại ${moved} phòng chưa khóa.`);
};
BMH.capturePlanVersion = label => {
  const versions=BMH.state.project.planVersions||(BMH.state.project.planVersions=[]),metrics=BMH.planMetrics(BMH.state.project.plan);
  versions.unshift({id:BMH.uid('ver'),label:label||`Mốc ${versions.length+1}`,createdAt:new Date().toISOString(),metrics,plan:BMH.planSnapshot()});
  if(versions.length>6)versions.length=6;BMH.save();BMH.render({preserveScroll:true});BMH.toast('Đã lưu mốc phương án.');
};
BMH.restorePlanVersion = id => {
  if(BMH.planHasLocks())return BMH.toast('Mở khóa phòng/tầng trước khi khôi phục phương án.');
  const v=(BMH.state.project.planVersions||[]).find(x=>x.id===id);if(!v)return;
  BMH.pushPlanHistory();BMH.state.project.plan=structuredClone(v.plan);BMH.normalizeState();BMH.save();BMH.render({preserveScroll:true});BMH.toast(`Đã khôi phục ${v.label}.`);
};
BMH.deletePlanVersion = id => {BMH.state.project.planVersions=(BMH.state.project.planVersions||[]).filter(x=>x.id!==id);BMH.save();BMH.render({preserveScroll:true});};
BMH.generateAutoPlanSnapshot = strategy => {
  if(BMH.planHasLocks())return null;
  const oldPlan=BMH.planSnapshot(),oldUi=structuredClone(BMH.state.ui.planner),oldStrategy=BMH.state.project.site.designStrategy,oldUndo=BMH.planHistory.undo.slice(),oldRedo=BMH.planHistory.redo.slice();
  const save=BMH.save,render=BMH.render,toast=BMH.toast,push=BMH.pushPlanHistory;let result=null;
  BMH.save=()=>{};BMH.render=()=>{};BMH.toast=()=>{};BMH.pushPlanHistory=()=>{};
  try{const before=BMH.state.project.plan;BMH.autoPlanConcept(strategy);if(BMH.state.project.plan!==before)result=BMH.planSnapshot();}catch(_){result=null;}
  finally{BMH.state.project.plan=oldPlan;BMH.state.ui.planner=oldUi;BMH.state.project.site.designStrategy=oldStrategy;BMH.planHistory.undo=oldUndo;BMH.planHistory.redo=oldRedo;BMH.save=save;BMH.render=render;BMH.toast=toast;BMH.pushPlanHistory=push;}
  return result;
};
BMH.generatePlanVariants = () => {
  if(BMH.planHasLocks())return BMH.toast('Mở khóa phòng/tầng trước khi tạo phương án khác.');
  const defs=[['A','climate','Ưu tiên khí hậu'],['B','balanced','Cân bằng'],['C','budget','Gọn chi phí']],variants=[];
  for(const [code,strategy,label] of defs){const plan=BMH.generateAutoPlanSnapshot(strategy);if(!plan)continue;const metrics=BMH.planMetrics(plan);variants.push({id:`variant-${code}`,code,strategy,label,metrics,plan});}
  BMH.state.project.planVariants=variants;BMH.save();BMH.render({preserveScroll:true});BMH.toast(variants.length===3?'Đã tạo 3 phương án A/B/C để so sánh.':'Đã tạo các phương án khả dụng.');
};
BMH.applyPlanVariant = id => {
  if(BMH.planHasLocks())return BMH.toast('Mở khóa phòng/tầng trước khi thay phương án.');
  const v=(BMH.state.project.planVariants||[]).find(x=>x.id===id);if(!v)return;
  BMH.pushPlanHistory();BMH.state.project.plan=structuredClone(v.plan);BMH.state.project.site.designStrategy=v.strategy;BMH.normalizeState();BMH.save();BMH.render({preserveScroll:true});BMH.toast(`Đã áp dụng phương án ${v.code} · ${v.label}.`);
};
BMH.smartSnapMove = (room,rooms) => {
  const site=BMH.state.project.site,env=BMH.buildableEnvelope(site),others=rooms.filter(r=>r.id!==room.id&&r.floor===room.floor),threshold=Math.max(.12,(BMH.state.ui.planner.snap||.2)*.75),guides=[];
  const xTargets=[env.side,site.width-env.side-room.w,0,site.width-room.w],yTargets=[env.front,site.depth-env.rear-room.h,0,site.depth-room.h];
  others.forEach(o=>{xTargets.push(o.x,o.x+o.w,o.x-room.w,o.x+o.w-room.w,o.x+o.w/2-room.w/2);yTargets.push(o.y,o.y+o.h,o.y-room.h,o.y+o.h-room.h,o.y+o.h/2-room.h/2);});
  const snapAxis=(value,targets,axis)=>{let best=value,dist=threshold;for(const t of targets){const d=Math.abs(t-value);if(d<dist){dist=d;best=t;}}if(best!==value)guides.push({axis,value:axis==='x'?best+(room.w/2):best+(room.h/2)});return best;};
  room.x=BMH.clamp(snapAxis(room.x,xTargets,'x'),0,site.width-room.w);room.y=BMH.clamp(snapAxis(room.y,yTargets,'y'),0,site.depth-room.h);return guides;
};
BMH.smartGuideSvg = floor => {
  if(!BMH.drag?.guides?.length)return'';const site=BMH.state.project.site;
  return `<g class="smart-guides">${BMH.drag.guides.map(g=>g.axis==='x'?`<line x1="${g.value}" y1="-.4" x2="${g.value}" y2="${site.depth+.4}"/>`:`<line x1="-.4" y1="${g.value}" x2="${site.width+.4}" y2="${g.value}"/>`).join('')}</g>`;
};

BMH.buildableEnvelopeSvg = floor => {
  const s=BMH.state.project.site,e=BMH.buildableEnvelope(s),x=e.side,y=e.front,w=Math.max(.05,s.width-e.side*2),h=Math.max(.05,s.depth-e.front-e.rear);
  return `<g class="buildable-envelope"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx=".08"/><text x="${x+.16}" y="${y+.34}">KHUNG XÂY DỰNG MỤC TIÊU · ${Math.round(e.coverage*100)}%</text><text class="setback-label front" x="${s.width/2}" y="${Math.max(.18,y-.14)}">LÙI TRƯỚC ${BMH.num(e.front,1)}m</text><text class="setback-label rear" x="${s.width/2}" y="${Math.min(s.depth-.12,y+h+.34)}">LÙI SAU ${BMH.num(e.rear,1)}m</text></g>`;
};
BMH.autoPlanConcept = (strategy=BMH.state.project.site.designStrategy||'climate') => {
  if(BMH.planHasLocks())return BMH.toast('Mở khóa phòng/tầng trước khi tạo lại mặt bằng.');
  const p=BMH.state.project,s=p.site,h=p.household,e=BMH.buildableEnvelope(s),W=e.buildWidth,D=e.buildDepth,x0=e.originX??e.side,y0=e.originY??e.front,floors=Math.max(1,Number(s.floors)||1);
  if(W<3||D<7)return BMH.toast('Khung xây dựng hiện quá nhỏ để tự bố trí. Hãy giảm khoảng lùi hoặc điều chỉnh kích thước đất.');
  const hasRelative=(h.relatives||[]).length>0, oneFloor=floors===1;
  const childNames=(h.children||[]).map((c,i)=>c.name||`Con ${i+1}`), upperBeds=['Phòng ngủ chính',...childNames.map(n=>`Phòng ${n}`)];
  const bedroomTarget=Math.max(1,BMH.householdNeeds?.().bedrooms||upperBeds.length);
  while(upperBeds.length+(hasRelative?1:0)<bedroomTarget)upperBeds.push(`Phòng ngủ ${upperBeds.length+1}`);
  const hallW=1.2, roomW=W-hallW, stairD=oneFloor?0:3.2,bathD=1.8,mainD=D-stairD-bathD;
  const groundNames=[['Phòng khách','living'],['Bếp + ăn','kitchen'],...(hasRelative?[['Phòng ông bà','bed']]:[]),...(oneFloor?upperBeds.map(n=>[n,'bed']):[])];
  const maxUpperCount=oneFloor?0:Math.ceil(upperBeds.length/(floors-1));
  if(roomW<2.2||mainD<Math.max(groundNames.length,maxUpperCount)*2.4)return BMH.toast('Khung đất chưa đủ cho các phòng và hành lang 1,2m. Hãy tăng số tầng, điều chỉnh nhu cầu hoặc bố trí thủ công.');
  const oldPlan=BMH.planSnapshot(); BMH.pushPlanHistory();
  const rooms=[],openings=[];let rid=0,oid=0;
  // Retain exact parcel coordinates: rounding individual room edges can cross a setback.
  const add=(floor,name,type,x,y,w,hh)=>{const r={id:`auto-r${++rid}`,floor,name,type,x,y,w,h:hh};rooms.push(r);return r;};
  const door=(r,side='east',offset=.5,width=.9)=>openings.push({id:`auto-o${++oid}`,floor:r.floor,roomId:r.id,kind:'door',side,offset,width,height:2.1,sill:0});
  const win=(r,side='west',offset=.5,width=1.4)=>{const len=side==='north'||side==='south'?r.w:r.h;if(len>.8)openings.push({id:`auto-o${++oid}`,floor:r.floor,roomId:r.id,kind:'window',side,offset,width:Math.min(width,len-.3),height:1.4,sill:.9});};
  const addService=f=>{
    const hall=add(f,`Hành lang tầng ${f+1}`,'corridor',x0+roomW,y0,hallW,D);
    if(f===0)door(hall,'north',.5,1.0);
    const bath=add(f,`WC tầng ${f+1}`,'bath',x0,y0+mainD,roomW,bathD);
    door(bath);win(bath,'west',.5,.7);
    if(!oneFloor){const stairs=add(f,'Cầu thang','stairs',x0,y0+mainD+bathD,roomW,stairD);door(stairs);}
  };
  let bedIndex=0;
  for(let f=0;f<floors;f++){
    const count=f===0?groundNames.length:Math.max(1,Math.ceil((upperBeds.length-bedIndex)/(floors-f)));
    const names=f===0?groundNames:Array.from({length:count},()=>[upperBeds[bedIndex++]||'Phòng đa năng','bed']);
    const weights=names.map(([,type],i)=>strategy==='climate'?(type==='living'?1.6:type==='kitchen'?1.2:1):strategy==='balanced'?(type==='kitchen'?1.5:i===0?1.25:1):1);
    const total=weights.reduce((a,b)=>a+b,0),extra=Math.max(0,mainD-count*2.4);let cursor=y0;
    names.forEach(([name,type],i)=>{const size=2.4+extra*weights[i]/total,r=add(f,name,type,x0,cursor,roomW,size);cursor+=size;door(r);win(r,'west',.5,type==='living'?1.8:1.4);});
    addService(f);
  }
  // Window pass: add a second opening when climate strategy needs cross-ventilation and the side is externally available.
  p.plan={rooms,openings,lockedRoomIds:[]};
  if(strategy==='climate'){
    for(const r of rooms.filter(r=>['living','kitchen','bed'].includes(r.type))){const ext=BMH.externalSides(r);const current=new Set(openings.filter(o=>o.roomId===r.id&&o.kind==='window').map(o=>o.side));const alt=ext.find(side=>!current.has(side)&&side!=='west')||ext.find(side=>!current.has(side));if(alt)win(r,alt,.6,Math.min(1.2,(alt==='north'||alt==='south'?r.w:r.h)*.38));}
  }
  for(const o of openings.filter(o=>o.kind==='window')){const proposal=BMH.suggestOpeningPosition?.(o);if(proposal)Object.assign(o,proposal.candidate);}
  if(!BMH.layoutValid(rooms)){p.plan=oldPlan;BMH.planHistory.undo.pop();BMH.toast('Không thể tạo phương án hợp lệ với kích thước hiện tại.');return;}
  s.designStrategy=strategy;BMH.state.ui.planner.floor=0;BMH.state.ui.planner.selected=rooms[0]?.id||null;BMH.state.ui.planner.tool='select';BMH.state.ui.planner.view='plan';BMH.save();BMH.render();BMH.toast(`Đã tạo phương án ${strategy==='climate'?'ưu tiên khí hậu':strategy==='budget'?'tối ưu diện tích':'cân bằng'} từ khu đất + gia đình.`);
};
BMH.layoutValid = rooms => {
  const site=BMH.state.project.site,min=.6;
  for(const r of rooms){if(![r.w,r.h,r.x,r.y].every(Number.isFinite)||r.w<min||r.h<min||r.x<-.001||r.y<-.001||r.x+r.w>site.width+.001||r.y+r.h>site.depth+.001)return false;}
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
  if(BMH.isRoomLocked(id)||ns.some(n=>BMH.isRoomLocked(n.id)))return null;
  if(side==='east'){r.w+=delta;ns.forEach(n=>{n.x+=delta;n.w-=delta;});}
  if(side==='west'){r.x+=delta;r.w-=delta;ns.forEach(n=>{n.w+=delta;});}
  if(side==='south'){r.h+=delta;ns.forEach(n=>{n.y+=delta;n.h-=delta;});}
  if(side==='north'){r.y+=delta;r.h-=delta;ns.forEach(n=>{n.h+=delta;});}
  return BMH.layoutValid(rooms)?rooms:null;
};
BMH.svgPoint = (e,svg) => {
  try{const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const ctm=(svg.querySelector?.('#planDrawing')||svg).getScreenCTM();if(ctm)return pt.matrixTransform(ctm.inverse());}catch(_){}
  const r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;return {x:vb.x+(e.clientX-r.left)*vb.width/Math.max(1,r.width),y:vb.y+(e.clientY-r.top)*vb.height/Math.max(1,r.height)};
};
BMH.openingFits = (candidate,ignoreId=candidate?.id) => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===candidate.roomId);if(!r)return false;
  if(!['north','south','east','west'].includes(candidate.side)||!Number.isFinite(Number(candidate.offset))||Number(candidate.offset)<0||Number(candidate.offset)>1||Number(candidate.floor)!==Number(r.floor))return false;
  const len=(candidate.side==='north'||candidate.side==='south')?r.w:r.h,w=Number(candidate.width)||0;if(w<.5||w>len-.08)return false;
  const span=BMH.openingWallSpan(candidate);if(!span)return false;
  return !BMH.state.project.plan.openings.some(o=>{
    if(o.id===ignoreId||o.floor!==candidate.floor)return false;
    const other=BMH.openingWallSpan(o);
    return other&&span.o===other.o&&Math.abs(span.c-other.c)<.001&&span.a<other.b+.08&&span.b>other.a-.08;
  });
};
BMH.placeOpeningAt = (kind,roomId,side,point) => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===roomId);if(!r)return;const width=kind==='door'?.9:1.4;let offset=.5;
  if(BMH.isRoomLocked(roomId))return BMH.toast('Phòng hoặc tầng đang khóa.');
  if(side==='north'||side==='south'){const span=Math.max(.01,r.w-width);offset=BMH.clamp((point.x-r.x-width/2)/span,0,1);}else{const span=Math.max(.01,r.h-width);offset=BMH.clamp((point.y-r.y-width/2)/span,0,1);}
  const candidate={id:BMH.uid('o'),floor:r.floor,roomId:r.id,kind,side,offset:+offset.toFixed(3),width};if(!BMH.openingFits(candidate))return BMH.toast('Vị trí này không đủ khoảng trống hoặc đang trùng một ô mở khác.');
  BMH.pushPlanHistory();BMH.state.project.plan.openings.push(candidate);BMH.state.ui.planner.selected=r.id;BMH.save();BMH.render();BMH.toast(`${kind==='door'?'Cửa đi':'Cửa sổ'} đã được đặt lên tường. Nhấn Esc để thoát công cụ.`);
};
BMH.edgeHandlesSvg = r => `<g class="edge-grips">${[['north',r.x,r.y,r.x+r.w,r.y],['south',r.x,r.y+r.h,r.x+r.w,r.y+r.h],['west',r.x,r.y,r.x,r.y+r.h],['east',r.x+r.w,r.y,r.x+r.w,r.y+r.h]].map(([side,x1,y1,x2,y2])=>`<line class="wall-grip-hit" data-edge-id="${r.id}" data-edge-side="${side}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/><line class="wall-grip-line" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('')}</g>`;
BMH.wallPlacementSvg = rooms => rooms.map(r=>`<g class="wall-place-room">${[['north',r.x,r.y,r.x+r.w,r.y],['south',r.x,r.y+r.h,r.x+r.w,r.y+r.h],['west',r.x,r.y,r.x,r.y+r.h],['east',r.x+r.w,r.y,r.x+r.w,r.y+r.h]].map(([side,x1,y1,x2,y2])=>`<line class="wall-place-hit" data-wall-place="1" data-room="${r.id}" data-side="${side}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join('')}</g>`).join('');

BMH.planSvg = ({interactive=true, floor=BMH.state.ui.planner.floor}={}) => {
  const p=BMH.state.project, ui=interactive?BMH.state.ui.planner:{...BMH.state.ui.planner,zoom:1,selected:'',tool:'select',showFurniture:true,showDimensions:true,showFeng:false,showBelow:false,showStructure:false,showEnvironment:false,showClimate:false,showEnvelope:false,showCirculation:false,showSectionLine:false}, rooms=BMH.floorRooms(floor), W=p.site.width,H=p.site.depth;
  const Hview=H, m=2.55, major=1, minor=.2, zoom=BMH.clamp(ui.zoom||1,.75,2.5);
  const fengProfile=BMH.fengProfile?BMH.fengProfile():null, good=fengProfile?.dirs?.[0];
  const feng=ui.showFeng&&good?(()=>{const pos={'Bắc':[W*.2,0,W*.6,Hview*.22],'Nam':[W*.2,Hview*.78,W*.6,Hview*.22],'Đông':[W*.78,Hview*.2,W*.22,Hview*.6],'Tây':[0,Hview*.2,W*.22,Hview*.6],'Đông Nam':[W*.58,Hview*.58,W*.42,Hview*.42],'Đông Bắc':[W*.58,0,W*.42,Hview*.42],'Tây Nam':[0,Hview*.58,W*.42,Hview*.42],'Tây Bắc':[0,0,W*.42,Hview*.42]}[good];return pos?`<g class="feng-zone"><rect x="${pos[0]}" y="${pos[1]}" width="${pos[2]}" height="${pos[3]}"/><text x="${pos[0]+.16}" y="${pos[1]+.34}">Hướng tốt tham khảo · ${good}</text></g>`:''})():'';
  const roomMarkup=rooms.map(r=>{const review=BMH.roomPlacementReview(r),selected=ui.selected===r.id,locked=BMH.isRoomLocked(r.id);return `<g class="room room-${r.type} placement-${review?.code||'mid'} ${selected?'selected':''} ${locked?'locked':''}" data-room-id="${r.id}"><rect class="room-interior" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>${ui.showFurniture?BMH.furnitureSvg(r):''}<g class="room-label"><text class="room-name" textLength="${Math.min(Math.max(.4,(Hview>W*1.45?r.h:r.w)-.4),r.name.length*.16)}" lengthAdjust="spacingAndGlyphs" x="${r.x+r.w/2}" y="${r.y+r.h/2-.07}">${BMH.esc(r.name).toUpperCase()}</text><text class="room-area" textLength="${Math.min(2.5,Math.max(.4,(Hview>W*1.45?r.h:r.w)-.4))}" lengthAdjust="spacingAndGlyphs" x="${r.x+r.w/2}" y="${r.y+r.h/2+.25}">${BMH.num(r.w*r.h)} m² · ${BMH.num(r.w)}×${BMH.num(r.h)}m</text></g>${locked?`<g class="room-lock-tag"><rect x="${r.x+r.w-.48}" y="${r.y+.10}" width=".36" height=".28" rx=".08"/><text x="${r.x+r.w-.30}" y="${r.y+.30}">LOCK</text></g>`:''}${interactive&&ui.tool==='select'&&!locked?BMH.roomDragGripSvg(r):''}${interactive&&selected&&ui.tool==='select'&&!locked?`<rect class="selection-outline" x="${r.x+.04}" y="${r.y+.04}" width="${Math.max(.01,r.w-.08)}" height="${Math.max(.01,r.h-.08)}"/>${BMH.edgeHandlesSvg(r)}<circle class="resize-handle" data-resize-id="${r.id}" cx="${r.x+r.w}" cy="${r.y+r.h}" r=".20"/>`:''}</g>`}).join('');
  const below=ui.showBelow?BMH.belowFloorSvg(floor):'';
  const structure=ui.showStructure?BMH.structureSvg(floor):'';
  const environment=ui.showEnvironment?BMH.environmentOverlaySvg(floor):'';
  const climate=ui.showClimate?BMH.climateOverlaySvg(floor):'';
  const envelope=ui.showEnvelope?BMH.buildableEnvelopeSvg(floor):'';
  const circulation=ui.showCirculation?BMH.circulationSvg(floor):'';
  const sectionLine=ui.showSectionLine?BMH.sectionLineSvg(floor,Hview):'';
  const walls=BMH.archWallsSvg(floor), openings=p.plan.openings.filter(o=>o.floor===floor).map(BMH.openingSvg).join('');
  const dims=ui.showDimensions?BMH.dimensionChainSvg(floor,Hview):'';
  const axesX=Array.from({length:Math.max(2,Math.ceil(W/2)+1)},(_,i)=>{const x=Math.min(W,i*2);return `<g class="axis"><circle cx="${x}" cy="-.72" r=".15"/><text x="${x}" y="-.67" text-anchor="middle">${i+1}</text><line x1="${x}" y1="-.55" x2="${x}" y2="0"/></g>`}).join('');
  const letters='ABCDEFGH'; const axesY=Array.from({length:Math.max(2,Math.ceil(Hview/4)+1)},(_,i)=>{const y=Math.min(Hview,i*4);return `<g class="axis"><circle cx="-.72" cy="${y}" r=".15"/><text x="-.72" y="${y+.05}" text-anchor="middle">${letters[i]||i+1}</text><line x1="-.55" y1="${y}" x2="0" y2="${y}"/></g>`}).join('');
  const north=`<g class="north-arrow" transform="translate(${W+.92} .65) rotate(${-BMH.directionAngle(p.site.frontDirection||'Nam')})"><circle r=".34"/><path d="M0 -.27L.12 .11 0 .05-.12 .11Z"/><text x="0" y="-.44">N</text></g>`;
  const scale=`<g class="scale-bar" transform="translate(${Math.max(.2,W-2.2)} ${Hview+.63})"><rect x="0" y="0" width=".5" height=".10"/><rect x=".5" y="0" width=".5" height=".10" class="alt"/><rect x="1" y="0" width="1" height=".10"/><text x="0" y=".30">0</text><text x="1" y=".30">1m</text><text x="2" y=".30" text-anchor="end">2m</text></g>`;
  const baseX=-m,baseY=-m,baseW=W+m*2+1.45,baseH=Hview+m*2+1.15,cx=baseX+baseW/2,cy=baseY+baseH/2,vw=baseW/zoom,vh=baseH/zoom,vx=cx-vw/2,vy=cy-vh/2;
  const placement=interactive&&ui.tool!=='select'?`<g class="placement-layer tool-${ui.tool}">${BMH.wallPlacementSvg(rooms)}</g>`:'';
  const smartGuides=interactive?BMH.smartGuideSvg(floor):'';
  return `<svg xmlns="http://www.w3.org/2000/svg" id="plannerSvg" class="planner-svg architecture-svg tool-${ui.tool} ${Hview>W*1.45?'rotated-landscape':''}" data-auto-rotate="${Hview>W*1.45?'1':'0'}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid meet" data-floor="${floor}" aria-label="Mặt bằng kiến trúc sơ bộ tầng ${floor+1}"><defs><pattern id="minorGrid" width="${minor}" height="${minor}" patternUnits="userSpaceOnUse"><path d="M ${minor} 0 L 0 0 0 ${minor}"/></pattern><pattern id="majorGrid" width="${major}" height="${major}" patternUnits="userSpaceOnUse"><path d="M ${major} 0 L 0 0 0 ${major}"/></pattern><pattern id="wallHatch" width=".14" height=".14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width=".14" height=".14" fill="#f8f8f6"/><line x1="0" y1="0" x2="0" y2=".14" stroke="#434343" stroke-width=".025"/></pattern><marker id="routeArrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#6a8a6c"/></marker></defs><rect x="${baseX}" y="${baseY}" width="${baseW}" height="${baseH}" class="sheet-bg"/><rect x="0" y="0" width="${W}" height="${Hview}" class="paper"/><rect x="0" y="0" width="${W}" height="${Hview}" class="minor-grid"/><rect x="0" y="0" width="${W}" height="${Hview}" class="major-grid"/>${feng}${below}${envelope}${smartGuides}<g class="axis-layer">${axesX}${axesY}</g><g class="room-layer">${roomMarkup}</g><g class="wall-layer">${walls}</g>${structure}<g class="opening-layer">${openings}</g>${climate}${environment}${circulation}${sectionLine}${placement}${dims}<rect class="plot-boundary" x="0" y="0" width="${W}" height="${Hview}"/>${north}${scale}</svg>`;
};

BMH.findFreeSpot = (w,h,floor) => { const s=BMH.state.ui.planner.snap, site=BMH.state.project.site; for(let y=0;y<=site.depth-h+.001;y+=s)for(let x=0;x<=site.width-w+.001;x+=s){const r={id:'temp',floor,x:+x.toFixed(2),y:+y.toFixed(2),w,h};if(BMH.roomValid(r))return {x:r.x,y:r.y};} return null; };
BMH.addRoom = type => { const defs={living:['Phòng khách',4,4],kitchen:['Bếp + ăn',4,4],bed:['Phòng ngủ',3.2,4],bath:['WC',1.8,2.2],stairs:['Cầu thang',2,4],garage:['Gara',3,5],corridor:['Hành lang',1.2,4],balcony:['Ban công',1.5,3]}; const d=defs[type]||defs.bed, floor=BMH.state.ui.planner.floor;if(BMH.isFloorLocked(floor))return BMH.toast('Tầng đang khóa.'); const pos=BMH.findFreeSpot(Math.min(d[1],BMH.state.project.site.width),Math.min(d[2],BMH.state.project.site.depth),floor); if(!pos)return BMH.toast('Không còn vùng trống đủ cho không gian mẫu.'); BMH.pushPlanHistory(); const r={id:BMH.uid('r'),floor,name:d[0],type,x:pos.x,y:pos.y,w:Math.min(d[1],BMH.state.project.site.width),h:Math.min(d[2],BMH.state.project.site.depth)}; BMH.state.project.plan.rooms.push(r); BMH.state.ui.planner.selected=r.id; BMH.state.ui.planner.tool='select'; BMH.save(); BMH.render(); };
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
BMH.areaSchedule = () => BMH.state.project.plan.rooms.map(r=>{const t=BMH.roomTechnicalStats(r);return {floor:r.floor+1,name:r.name,area:t.area,perimeter:t.perimeter,type:r.type,doors:t.doors,windows:t.windows,daylight:t.daylight,ventilation:t.ventilation};});
BMH.openingSchedule = () => BMH.state.project.plan.openings.map(o=>{const r=BMH.state.project.plan.rooms.find(x=>x.id===o.roomId),v=BMH.openingReview(o);return {code:BMH.openingCode(o),floor:o.floor+1,room:r?.name||'—',kind:o.kind,width:o.width||0,height:v.height,sill:v.sill,side:o.side};});
