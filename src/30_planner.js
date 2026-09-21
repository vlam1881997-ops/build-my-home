BMH.roomColor = type => ({living:'#eef4ea',kitchen:'#fff5e7',bed:'#eef4fa',bath:'#edf6f7',stairs:'#f1eef8',garage:'#f4f0ea',corridor:'#f6f6f2',balcony:'#edf7ed'}[type]||'#f3f4f1');
BMH.floorRooms = (floor=BMH.state.ui.planner.floor) => BMH.state.project.plan.rooms.filter(r=>r.floor===floor);
BMH.selectedRoom = () => BMH.state.project.plan.rooms.find(r=>r.id===BMH.state.ui.planner.selected)||null;
BMH.roomsOverlap = (a,b) => a.floor===b.floor && a.id!==b.id && a.x < b.x+b.w-.001 && a.x+a.w > b.x+.001 && a.y < b.y+b.h-.001 && a.y+a.h > b.y+.001;
BMH.roomValid = room => room.x>=0 && room.y>=0 && room.x+room.w<=BMH.state.project.site.width+.001 && room.y+room.h<=BMH.state.project.site.depth+.001 && !BMH.state.project.plan.rooms.some(r=>BMH.roomsOverlap(room,r));
BMH.plannerIssues = () => {
  const p=BMH.state.project, issues=[];
  for(const r of p.plan.rooms){if(r.x<0||r.y<0||r.x+r.w>p.site.width+.001||r.y+r.h>p.site.depth+.001)issues.push({sev:'error',text:`${r.name} vượt ranh khu đất.`}); if(p.plan.rooms.some(o=>BMH.roomsOverlap(r,o)))issues.push({sev:'error',text:`${r.name} đang chồng lên không gian khác.`});}
  for(let f=1;f<p.site.floors;f++){
    const prev=p.plan.rooms.find(r=>r.floor===f-1&&r.type==='stairs'), cur=p.plan.rooms.find(r=>r.floor===f&&r.type==='stairs');
    if(prev&&cur && (Math.abs(prev.x-cur.x)>.5||Math.abs(prev.y-cur.y)>.5)) issues.push({sev:'warn',text:`Cầu thang tầng ${f} và tầng ${f+1} lệch nhau quá 0,5m.`});
  }
  const h=p.household; if(h.relatives.length && !p.plan.rooms.some(r=>r.floor===0&&r.type==='bed'))issues.push({sev:'warn',text:'Có ba/mẹ/người thân ở cùng nhưng tầng trệt chưa có phòng ngủ.'});
  const requested=h.children.filter(c=>c.room==='Riêng').length; const childBeds=p.plan.rooms.filter(r=>r.type==='bed'&&!/chính|ông bà/i.test(r.name)).length; if(childBeds<requested)issues.push({sev:'info',text:`Gia đình yêu cầu ${requested} phòng riêng cho con; mặt bằng hiện có ${childBeds} phòng phù hợp.`});
  if(!p.plan.rooms.some(r=>r.type==='bath'))issues.push({sev:'warn',text:'Chưa có WC trong mặt bằng.'});
  return issues.filter((x,i,a)=>a.findIndex(y=>y.text===x.text)===i);
};
BMH.furnitureSvg = r => {
  const x=r.x,y=r.y,w=r.w,h=r.h,c='#7f8c83';
  if(r.type==='bed') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".05"><rect x="${x+w*.18}" y="${y+h*.2}" width="${w*.64}" height="${h*.55}" rx=".08"/><rect x="${x+w*.24}" y="${y+h*.22}" width="${w*.22}" height="${h*.14}" rx=".05"/><rect x="${x+w*.54}" y="${y+h*.22}" width="${w*.22}" height="${h*.14}" rx=".05"/></g>`;
  if(r.type==='living') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".05"><rect x="${x+w*.12}" y="${y+h*.18}" width="${w*.54}" height="${h*.22}" rx=".08"/><rect x="${x+w*.34}" y="${y+h*.55}" width="${w*.32}" height="${h*.2}" rx=".08"/></g>`;
  if(r.type==='kitchen') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".05"><rect x="${x+w*.08}" y="${y+h*.12}" width="${w*.84}" height="${h*.16}"/><circle cx="${x+w*.24}" cy="${y+h*.2}" r="${Math.min(w,h)*.05}"/><rect x="${x+w*.3}" y="${y+h*.5}" width="${w*.4}" height="${h*.26}" rx=".05"/></g>`;
  if(r.type==='bath') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".05"><ellipse cx="${x+w*.3}" cy="${y+h*.45}" rx="${w*.13}" ry="${h*.18}"/><rect x="${x+w*.58}" y="${y+h*.18}" width="${w*.25}" height="${h*.22}" rx=".05"/><rect x="${x+w*.55}" y="${y+h*.55}" width="${w*.32}" height="${h*.3}"/></g>`;
  if(r.type==='stairs') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".04">${Array.from({length:8},(_,i)=>`<line x1="${x+w*.15}" y1="${y+h*(.12+i*.095)}" x2="${x+w*.85}" y2="${y+h*(.12+i*.095)}"/>`).join('')}<path d="M${x+w*.5} ${y+h*.82}V${y+h*.18}m0 0l-.12 .18m.12-.18l.12 .18"/></g>`;
  if(r.type==='garage') return `<g class="furniture" stroke="${c}" fill="none" stroke-width=".05"><rect x="${x+w*.2}" y="${y+h*.18}" width="${w*.6}" height="${h*.64}" rx=".28"/><circle cx="${x+w*.26}" cy="${y+h*.25}" r=".08"/><circle cx="${x+w*.74}" cy="${y+h*.25}" r=".08"/><circle cx="${x+w*.26}" cy="${y+h*.75}" r=".08"/><circle cx="${x+w*.74}" cy="${y+h*.75}" r=".08"/></g>`;
  return '';
};
BMH.openingSvg = o => {
  const r=BMH.state.project.plan.rooms.find(x=>x.id===o.roomId); if(!r)return''; const w=Math.min(o.width||.9, o.side==='north'||o.side==='south'?r.w:r.h); const off=BMH.clamp(o.offset??.3,0,1);
  let x,y;
  if(o.side==='north'||o.side==='south'){x=r.x+(r.w-w)*off; y=o.side==='north'?r.y:r.y+r.h;} else {y=r.y+(r.h-w)*off; x=o.side==='west'?r.x:r.x+r.w;}
  if(o.kind==='window'){
    if(o.side==='north'||o.side==='south') return `<g class="opening window"><line x1="${x}" y1="${y}" x2="${x+w}" y2="${y}"/><line x1="${x}" y1="${y+(o.side==='north'?.08:-.08)}" x2="${x+w}" y2="${y+(o.side==='north'?.08:-.08)}"/></g>`;
    return `<g class="opening window"><line x1="${x}" y1="${y}" x2="${x}" y2="${y+w}"/><line x1="${x+(o.side==='west'?.08:-.08)}" y1="${y}" x2="${x+(o.side==='west'?.08:-.08)}" y2="${y+w}"/></g>`;
  }
  const rr=Math.min(.9,w); if(o.side==='north')return `<g class="opening door"><line x1="${x}" y1="${y}" x2="${x}" y2="${y+rr}"/><path d="M${x+rr} ${y} A${rr} ${rr} 0 0 0 ${x} ${y+rr}"/></g>`;
  if(o.side==='south')return `<g class="opening door"><line x1="${x}" y1="${y}" x2="${x}" y2="${y-rr}"/><path d="M${x+rr} ${y} A${rr} ${rr} 0 0 1 ${x} ${y-rr}"/></g>`;
  if(o.side==='west')return `<g class="opening door"><line x1="${x}" y1="${y}" x2="${x+rr}" y2="${y}"/><path d="M${x} ${y+rr} A${rr} ${rr} 0 0 1 ${x+rr} ${y}"/></g>`;
  return `<g class="opening door"><line x1="${x}" y1="${y}" x2="${x-rr}" y2="${y}"/><path d="M${x} ${y+rr} A${rr} ${rr} 0 0 0 ${x-rr} ${y}"/></g>`;
};
BMH.planSvg = ({interactive=true, floor=BMH.state.ui.planner.floor}={}) => {
  const p=BMH.state.project, ui=BMH.state.ui.planner, rooms=BMH.floorRooms(floor), W=p.site.width,H=p.site.depth, m=2.2, major=1, minor=.2;
  const kua=BMH.kua(p.household.ownerBirth,p.household.ownerGender), good=kua?.dirs?.[0];
  const feng=ui.showFeng&&good?(()=>{const pos={'Bắc':[W*.2,0,W*.6,H*.22],'Nam':[W*.2,H*.78,W*.6,H*.22],'Đông':[W*.78,H*.2,W*.22,H*.6],'Tây':[0,H*.2,W*.22,H*.6],'Đông Nam':[W*.58,H*.58,W*.42,H*.42],'Đông Bắc':[W*.58,0,W*.42,H*.42],'Tây Nam':[0,H*.58,W*.42,H*.42],'Tây Bắc':[0,0,W*.42,H*.42]}[good];return pos?`<g class="feng-zone"><rect x="${pos[0]}" y="${pos[1]}" width="${pos[2]}" height="${pos[3]}"/><text x="${pos[0]+.16}" y="${pos[1]+.34}">Hướng tốt tham khảo · ${good}</text></g>`:''})():'';
  const roomMarkup=rooms.map(r=>`<g class="room ${ui.selected===r.id?'selected':''}" data-room-id="${r.id}"><rect class="room-fill" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" fill="${BMH.roomColor(r.type)}"/><rect class="room-wall" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}"/>${ui.showFurniture?BMH.furnitureSvg(r):''}<text class="room-name" x="${r.x+r.w/2}" y="${r.y+r.h/2-.12}">${BMH.esc(r.name)}</text><text class="room-area" x="${r.x+r.w/2}" y="${r.y+r.h/2+.28}">${BMH.num(r.w*r.h)} m²</text>${interactive&&ui.selected===r.id?`<circle class="resize-handle" data-resize-id="${r.id}" cx="${r.x+r.w}" cy="${r.y+r.h}" r=".16"/>`:''}</g>`).join('');
  const openings=p.plan.openings.filter(o=>o.floor===floor).map(BMH.openingSvg).join('');
  const dims=ui.showDimensions?rooms.map(r=>`<g class="room-dims"><text x="${r.x+r.w/2}" y="${r.y-.12}">${BMH.num(r.w)}m</text><text x="${r.x+r.w+.12}" y="${r.y+r.h/2}" transform="rotate(90 ${r.x+r.w+.12} ${r.y+r.h/2})">${BMH.num(r.h)}m</text></g>`).join(''):'';
  const ticksX=Array.from({length:Math.floor(W)+1},(_,i)=>`<text x="${i}" y="-.52">${i}</text><line x1="${i}" y1="-.42" x2="${i}" y2="-.28"/>`).join('');
  const ticksY=Array.from({length:Math.floor(H)+1},(_,i)=>`<text x="-.52" y="${i+.08}">${i}</text><line x1="-.42" y1="${i}" x2="-.28" y2="${i}"/>`).join('');
  const titleY=H+1.2;
  return `<svg id="plannerSvg" class="planner-svg" viewBox="-${m} -${m} ${W+m*2} ${H+m*2.1}" preserveAspectRatio="xMidYMid meet" data-floor="${floor}" aria-label="Mặt bằng kiến trúc sơ bộ tầng ${floor+1}"><defs><pattern id="minorGrid" width="${minor}" height="${minor}" patternUnits="userSpaceOnUse"><path d="M ${minor} 0 L 0 0 0 ${minor}"/></pattern><pattern id="majorGrid" width="${major}" height="${major}" patternUnits="userSpaceOnUse"><path d="M ${major} 0 L 0 0 0 ${major}"/></pattern></defs><rect x="0" y="0" width="${W}" height="${H}" class="paper"/><rect x="0" y="0" width="${W}" height="${H}" class="minor-grid"/><rect x="0" y="0" width="${W}" height="${H}" class="major-grid"/>${feng}<g class="rulers">${ticksX}${ticksY}</g><rect x="0" y="0" width="${W}" height="${H}" class="plot-boundary"/>${roomMarkup}${openings}${dims}<g class="overall-dims"><line x1="0" y1="${H+.45}" x2="${W}" y2="${H+.45}"/><text x="${W/2}" y="${H+.75}">${BMH.num(W)} m</text><line x1="${W+.45}" y1="0" x2="${W+.45}" y2="${H}"/><text x="${W+.78}" y="${H/2}" transform="rotate(90 ${W+.78} ${H/2})">${BMH.num(H)} m</text></g><g class="north" transform="translate(${W+1.3},.4)"><text x="0" y="-.3">N</text><path d="M0 0l-.22 .8 .22-.16 .22 .16z"/></g><g class="title-block" transform="translate(0,${titleY})"><rect x="0" y="0" width="${W}" height=".82"/><text x=".18" y=".28" class="title">MẶT BẰNG KIẾN TRÚC SƠ BỘ · TẦNG ${floor+1}</text><text x=".18" y=".58">Build My Home V2.2 · lưới 0,2m / snap ${ui.snap}m · không phải hồ sơ thi công</text></g></svg>`;
};
BMH.findFreeSpot = (w,h,floor) => { const s=BMH.state.ui.planner.snap, site=BMH.state.project.site; for(let y=0;y<=site.depth-h+.001;y+=s)for(let x=0;x<=site.width-w+.001;x+=s){const r={id:'temp',floor,x:+x.toFixed(2),y:+y.toFixed(2),w,h};if(BMH.roomValid(r))return {x:r.x,y:r.y};} return null; };
BMH.addRoom = type => { const defs={living:['Phòng khách',4,4],kitchen:['Bếp + ăn',4,4],bed:['Phòng ngủ',3.2,4],bath:['WC',1.8,2.2],stairs:['Cầu thang',2,4],garage:['Gara',3,5],corridor:['Hành lang',1.2,4],balcony:['Ban công',1.5,3]}; const d=defs[type]||defs.bed, floor=BMH.state.ui.planner.floor, pos=BMH.findFreeSpot(Math.min(d[1],BMH.state.project.site.width),Math.min(d[2],BMH.state.project.site.depth),floor); if(!pos)return BMH.toast('Không còn vùng trống đủ cho không gian mẫu.'); const r={id:BMH.uid('r'),floor,name:d[0],type,x:pos.x,y:pos.y,w:Math.min(d[1],BMH.state.project.site.width),h:Math.min(d[2],BMH.state.project.site.depth)}; BMH.state.project.plan.rooms.push(r); BMH.state.ui.planner.selected=r.id; BMH.save(); BMH.render(); };
BMH.addOpening = kind => { const r=BMH.selectedRoom(); if(!r)return BMH.toast('Hãy chọn phòng trước.'); const same=BMH.state.project.plan.openings.filter(o=>o.roomId===r.id); const side=['south','east','north','west'][same.length%4]; BMH.state.project.plan.openings.push({id:BMH.uid('o'),floor:r.floor,roomId:r.id,kind,side,offset:.45,width:kind==='door'?.9:1.4}); BMH.save(); BMH.render(); };
