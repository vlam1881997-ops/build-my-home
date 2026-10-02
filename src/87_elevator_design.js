/* Shared elevator shafts: measured reservations, landing doors and preliminary drawings. */
BMH.elevatorRooms=(room,rooms=BMH.state.project.plan.rooms)=>rooms.filter(r=>r.type==='elevator'&&(r.elevator?.shaftId||r.id)===(room.elevator?.shaftId||room.id));
BMH.elevatorShafts=()=>[...new Map(BMH.state.project.plan.rooms.filter(r=>r.type==='elevator').sort((a,b)=>a.floor-b.floor).map(r=>[r.elevator?.shaftId||r.id,r])).values()];
BMH.elevatorSpec=r=>{
 const e=r.elevator||{},number=(v,fallback)=>Number.isFinite(Number(v))&&v!==null&&v!==''?Number(v):fallback;
 return {shaftId:String(e.shaftId||r.id),width:r.w,depth:r.h,cabinWidth:number(e.cabinWidth,1.1),cabinDepth:number(e.cabinDepth,1.3),doorWidth:number(e.doorWidth,.8),doorSide:['north','south','east','west'].includes(e.doorSide)?e.doorSide:'south',enclosure:e.enclosure==='solid'?'solid':'glass',pitDepth:number(e.pitDepth,null),headroom:number(e.headroom,null),model:String(e.model||'').slice(0,120),stops:BMH.elevatorRooms(r).map(q=>q.floor).sort((a,b)=>a-b),availableHeadroom:BMH.projectLevels().floorHeight-BMH.projectLevels().slab};
};
BMH.elevatorIssues=()=>BMH.elevatorShafts().flatMap(r=>{
 const s=BMH.elevatorSpec(r),group=BMH.elevatorRooms(r),issues=[],add=(sev,text)=>issues.push({sev,text:r.name+': '+text});
 if(group.some(q=>['x','y','w','h'].some(k=>Math.abs(q[k]-r[k])>.001)))add('error','Giếng thang bị lệch giữa các tầng. Cần đồng bộ vị trí và kích thước.');
 if(new Set(s.stops).size!==s.stops.length)add('error','Một tầng có nhiều ô cùng giếng thang.');
 if(Array.from({length:Number(BMH.state.project.site.floors)},(_,f)=>f).some(f=>!s.stops.includes(f)))add('warn','Chưa có ô giếng tại tất cả các tầng. Chọn Đồng bộ các tầng để bổ sung.');
 if(s.cabinWidth<=0||s.cabinDepth<=0||s.cabinWidth>r.w-.24||s.cabinDepth>r.h-.24)add('error','Cabin vượt phần giếng dự trù. Tăng giếng hoặc sửa kích thước cabin theo hãng.');
 if(s.doorWidth<=0||s.doorWidth>Math.min(s.cabinWidth,['north','south'].includes(s.doorSide)?r.w:r.h)-.08)add('error','Cửa tầng không vừa cabin hoặc cạnh giếng.');
 if(!s.model||s.pitDepth===null||s.headroom===null)add('warn','Chưa xác nhận model, hố pit và khoảng không đỉnh theo hồ sơ hãng. Đây là ô dự trù, chưa phải thiết kế lắp đặt.');
 if(s.headroom!==null&&s.headroom>s.availableHeadroom+.001)add('warn','Khoảng không đỉnh yêu cầu cao hơn phần cao tầng đang dự trù; cần sửa cao độ/đỉnh giếng.');
 if(s.pitDepth!==null&&s.pitDepth<0||s.headroom!==null&&s.headroom<=0)add('error','Hố pit hoặc khoảng không đỉnh không hợp lệ.');
 for(const q of group){const doors=BMH.state.project.plan.openings.filter(o=>o.roomId===q.id&&o.kind==='door');if(doors.length!==1)add('warn','Tầng '+(q.floor+1)+' cần đúng một cửa tầng.');else{const span=BMH.openingWallSpan(doors[0]);if(span){const horizontal=span.o==='h',side=doors[0].side,point={x:horizontal?(span.a+span.b)/2:span.c+(side==='west'?-.2:.2),y:horizontal?span.c+(side==='north'?-.2:.2):(span.a+span.b)/2};if(!BMH.floorRooms(q.floor).some(n=>n.id!==q.id&&point.x>=n.x&&point.x<=n.x+n.w&&point.y>=n.y&&point.y<=n.y+n.h))add('warn','Cửa tầng '+(q.floor+1)+' chưa nối một phòng/sảnh trên mặt bằng. Bố trí sảnh tiếp cận.');}}}
 return issues;
});
const elevatorPlannerIssues=BMH.plannerIssues;BMH.plannerIssues=()=>[...elevatorPlannerIssues(),...BMH.elevatorIssues()];
BMH.elevatorLanding=(r,existing)=>{const s=BMH.elevatorSpec(r);return {id:existing?.id||BMH.uid('lift-door'),floor:r.floor,roomId:r.id,kind:'door',side:s.doorSide,offset:.5,width:s.doorWidth,height:2.1,sill:0,motion:'sliding',elevatorShaftId:s.shaftId};};
BMH.elevatorPlanFits=plan=>{
 if(!BMH.layoutValid(plan.rooms))return false;
 const previous=BMH.state.project.plan;BMH.state.project.plan=plan;
 try{return plan.openings.filter(o=>plan.rooms.find(r=>r.id===o.roomId)?.type==='elevator').every(o=>BMH.openingFits(o));}finally{BMH.state.project.plan=previous;}
};
BMH.commitElevatorPlan=(plan,selected,notice)=>{
 if(!BMH.elevatorPlanFits(plan)){BMH.toast('Giếng/cửa thang không vừa ở một tầng. Dời phòng hoặc tạo vùng trống trước.');return false;}
 BMH.pushPlanHistory();BMH.state.project.plan=plan;BMH.state.ui.planner.selected=selected;BMH.state.ui.planner.tool='select';BMH.save();BMH.render({preserveScroll:true});if(notice)BMH.toast(notice);return true;
};
BMH.addElevator=()=>{
 const site=BMH.state.project.site,floors=Number(site.floors),w=1.8,h=1.9,original=BMH.state.project.plan;
 if(Array.from({length:floors},(_,f)=>f).some(f=>BMH.isFloorLocked(f))){BMH.toast('Mở khóa các tầng trước khi thêm giếng thang liên thông.');return false;}
 const shaftId=BMH.uid('shaft'),settings={shaftId,cabinWidth:1.1,cabinDepth:1.3,doorWidth:.8,doorSide:'south',enclosure:'glass',pitDepth:null,headroom:null,model:''};
 const rooms=Array.from({length:floors},(_,floor)=>({id:BMH.uid('lift'),floor,name:'Thang máy',type:'elevator',x:0,y:0,w,h,elevator:structuredClone(settings)}));
 const step=Math.max(.1,Number(BMH.state.ui.planner.snap)||.2);
 for(let y=0;y<=site.depth-h+.001;y+=step)for(let x=0;x<=site.width-w+.001;x+=step){
  rooms.forEach(r=>{r.x=+x.toFixed(3);r.y=+y.toFixed(3);});const plan={...structuredClone(original),rooms:[...structuredClone(original.rooms),...rooms],openings:[...structuredClone(original.openings),...rooms.map(r=>BMH.elevatorLanding(r))]};
  if(BMH.elevatorPlanFits(plan))return BMH.commitElevatorPlan(plan,rooms.find(r=>r.floor===BMH.state.ui.planner.floor)?.id||rooms[0].id,'Đã thêm giếng thang '+floors+' tầng. Chỉnh cabin, cửa và thông số hãng ở bảng thuộc tính.');
 }
 BMH.toast('Chưa có vùng trống 1,80 × 1,90 m trùng nhau giữa các tầng. Chỉnh mặt bằng rồi thêm thang máy.');return false;
};
const elevatorAddRoom=BMH.addRoom;BMH.addRoom=type=>type==='elevator'?BMH.addElevator():elevatorAddRoom(type);
// Expand a move/resize across the shaft before the planner validates or records it.
BMH.expandElevatorGeometry=(candidate,id)=>{
 if(!candidate)return null;const r=candidate.find(q=>q.id===id);if(r?.type!=='elevator')return candidate;
 const group=BMH.elevatorRooms(r,candidate);if(group.some(q=>BMH.isRoomLocked(q.id)))return null;if(BMH.elevatorSpec(r).doorWidth>(['north','south'].includes(BMH.elevatorSpec(r).doorSide)?r.w:r.h)-.08)return null;
 for(const q of group)for(const k of ['x','y','w','h'])q[k]=r[k];return candidate;
};
BMH.editElevatorGeometry=(key,value)=>{
 const r=BMH.selectedRoom();if(r?.type!=='elevator'||!['x','y','w','h'].includes(key))return false;
 const plan=BMH.planSnapshot(),q=plan.rooms.find(q=>q.id===r.id);q[key]=Number(value);
 const rooms=BMH.expandElevatorGeometry(plan.rooms,r.id);if(!rooms){BMH.toast('Mở khóa tất cả ô của giếng trước khi chỉnh.');return false;}plan.rooms=rooms;return BMH.commitElevatorPlan(plan,r.id);
};
BMH.editElevatorSettings=(key,value)=>{
 const r=BMH.selectedRoom();if(r?.type!=='elevator')return false;const group=BMH.elevatorRooms(r);if(group.some(q=>BMH.isRoomLocked(q.id))){BMH.toast('Giếng có tầng đang khóa.');return false;}
 const numeric=['cabinWidth','cabinDepth','doorWidth','pitDepth','headroom'];
 if(numeric.includes(key)){value=value===''&&['pitDepth','headroom'].includes(key)?null:Number(value);if(value!==null&&(!Number.isFinite(value)||value<0||value>10||(!['pitDepth'].includes(key)&&value===0)))return false;}
 else if(key==='doorSide'){if(!['north','south','east','west'].includes(value))return false;}else if(key==='enclosure'){if(!['glass','solid'].includes(value))return false;}else if(key==='model')value=String(value).slice(0,120);else return false;
 const plan=BMH.planSnapshot(),shaft=BMH.elevatorRooms(r,plan.rooms);shaft.forEach(q=>q.elevator={...q.elevator,[key]:value});
 for(const q of shaft){const old=plan.openings.find(o=>o.roomId===q.id&&o.kind==='door');plan.openings=plan.openings.filter(o=>o.roomId!==q.id);plan.openings.push(BMH.elevatorLanding(q,old));}
 return BMH.commitElevatorPlan(plan,r.id);
};
BMH.syncElevatorFloors=()=>{
 const r=BMH.selectedRoom();if(r?.type!=='elevator')return false;const group=BMH.elevatorRooms(r),floors=Number(BMH.state.project.site.floors);
 if(group.some(q=>BMH.isRoomLocked(q.id))||Array.from({length:floors},(_,f)=>f).some(f=>BMH.isFloorLocked(f))){BMH.toast('Mở khóa các tầng trước khi đồng bộ giếng.');return false;}
 const plan=BMH.planSnapshot();for(const q of BMH.elevatorRooms(r,plan.rooms))for(const k of ['x','y','w','h'])q[k]=r[k];
 for(let floor=0;floor<floors;floor++)if(!BMH.elevatorRooms(r,plan.rooms).some(q=>q.floor===floor)){const q={...structuredClone(r),id:BMH.uid('lift'),floor};plan.rooms.push(q);plan.openings.push(BMH.elevatorLanding(q));}
 return BMH.commitElevatorPlan(plan,r.id,'Đã đồng bộ giếng thang giữa các tầng.');
};
BMH.deleteElevatorShaft=()=>{const r=BMH.selectedRoom();if(r?.type!=='elevator')return false;const group=BMH.elevatorRooms(r);if(group.some(q=>BMH.isRoomLocked(q.id))){BMH.toast('Giếng có ô đang khóa.');return false;}const ids=new Set(group.map(q=>q.id)),plan=BMH.planSnapshot();plan.rooms=plan.rooms.filter(q=>!ids.has(q.id));plan.openings=plan.openings.filter(o=>!ids.has(o.roomId));plan.lockedRoomIds=(plan.lockedRoomIds||[]).filter(id=>!ids.has(id));return BMH.commitElevatorPlan(plan,plan.rooms.find(q=>q.floor===r.floor)?.id||null,'Đã xóa toàn bộ giếng thang. Có thể hoàn tác.');};
const elevatorFloorHoles=BMH.stairFloorHoles;
BMH.stairFloorHoles=floor=>{
 const holes=elevatorFloorHoles(floor);if(floor<=0||floor>=Number(BMH.state.project.site.floors))return holes;
 const lifts=BMH.state.project.plan.rooms.filter(r=>r.type==='elevator'&&(r.floor===floor||r.floor===floor-1));return [...holes,...[...new Map(lifts.map(r=>[[r.x,r.y,r.w,r.h].join(','),{x:r.x+.12,y:r.y+.12,w:r.w-.24,h:r.h-.24}])).values()].filter(h=>h.w>0&&h.h>0)];
};
const elevatorFurnitureSvg=BMH.furnitureSvg;BMH.furnitureSvg=r=>{
 if(r.type!=='elevator')return elevatorFurnitureSvg(r);const s=BMH.elevatorSpec(r),x=r.x+(r.w-s.cabinWidth)/2,y=r.y+(r.h-s.cabinDepth)/2;
 return '<g class="furniture elevator-symbol" data-elevator-shaft="'+BMH.esc(s.shaftId)+'" fill="#e2efed" stroke="#537c79" stroke-width=".025"><rect x="'+(r.x+.12)+'" y="'+(r.y+.12)+'" width="'+Math.max(.01,r.w-.24)+'" height="'+Math.max(.01,r.h-.24)+'" fill="none" stroke-dasharray=".08 .05"/><rect x="'+x+'" y="'+y+'" width="'+s.cabinWidth+'" height="'+s.cabinDepth+'"/><path d="M'+(x+.12)+' '+(y+.35)+'v-.2l-.06 .08m.06-.08l.06 .08 M'+(x+.30)+' '+(y+.15)+'v.2l-.06-.08m.06.08l.06-.08"/><title>'+BMH.esc('Giếng dự trù '+r.w+' × '+r.h+' m; cabin '+s.cabinWidth+' × '+s.cabinDepth+' m; chưa xác nhận lắp đặt')+'</title></g>';
};
const elevatorDoorLeaf=BMH.doorLeafGeometry;BMH.doorLeafGeometry=o=>BMH.state.project.plan.rooms.find(r=>r.id===o.roomId)?.type==='elevator'?null:elevatorDoorLeaf(o);
const elevatorOpeningSvg=BMH.openingSvg;BMH.openingSvg=o=>{
 const r=BMH.state.project.plan.rooms.find(r=>r.id===o.roomId);if(r?.type!=='elevator'||o.kind!=='door')return elevatorOpeningSvg(o);const span=BMH.openingWallSpan(o);if(!span)return '';const horizontal=span.o==='h';return '<g class="opening elevator-door" data-opening-id="'+BMH.esc(o.id)+'"><path d="M'+(horizontal?span.a:span.c)+' '+(horizontal?span.c:span.a)+'L'+(horizontal?span.b:span.c)+' '+(horizontal?span.c:span.b)+'" stroke="white" stroke-width=".15"/><path d="M'+(horizontal?span.a:span.c)+' '+(horizontal?span.c:span.a)+'L'+(horizontal?span.b:span.c)+' '+(horizontal?span.c:span.b)+'" stroke="#557d7a" stroke-width=".04"/><title>Cửa trượt thang máy · '+Math.round(o.width*1000)+' mm</title></g>';
};
BMH.elevatorGeometry=r=>{
 const s=BMH.elevatorSpec(r),fh=BMH.projectLevels().floorHeight,parts=[],add=(x,y,w,d,base,h,kind,finish)=>parts.push({x,y,w,d,base,h,kind,finish});
 for(const x of [r.x+.065,r.x+r.w-.115])for(const y of [r.y+.065,r.y+r.h-.115])add(x,y,.05,.05,0,fh,'elevator-frame','metal');
 add(r.x+.18,r.y+.15,.025,.06,0,fh,'elevator-rail','dark');add(r.x+r.w-.205,r.y+.15,.025,.06,0,fh,'elevator-rail','dark');
 for(const side of ['north','south','west','east']){const horizontal=['north','south'].includes(side),len=horizontal?r.w:r.h,door=side===s.doorSide;
  const segment=(start,length,base,h,kind='elevator-enclosure')=>{if(length<=0||h<=0)return;add(horizontal?r.x+start:side==='west'?r.x+.065:r.x+r.w-.085,horizontal?side==='north'?r.y+.065:r.y+r.h-.085:r.y+start,horizontal?length:.02,horizontal?.02:length,base,h,kind,s.enclosure);};
  if(door){const edge=(len-s.doorWidth)/2;segment(.1,edge-.1,0,fh);segment(edge+s.doorWidth,edge-.1,0,fh);segment(edge,s.doorWidth,2.12,Math.max(.01,fh-2.12));for(let i=0;i<2;i++)segment(edge+i*s.doorWidth/2+.015,s.doorWidth/2-.03,.04,2.04,'elevator-door');}else segment(.1,len-.2,0,fh);
 }
 // One cabin in the whole-house view; a selected floor shows its cabin for inspection.
 if(r.floor===0||BMH.state.ui.sceneFocus==='floor:'+r.floor||BMH.state.ui.sceneFocus==='room:'+r.id){const x=r.x+(r.w-s.cabinWidth)/2,y=r.y+(r.h-s.cabinDepth)/2;add(x,y,s.cabinWidth,s.cabinDepth,0,.06,'elevator-cabin','metal');add(x,y,s.cabinWidth,s.cabinDepth,2.08,.05,'elevator-cabin','metal');add(x,y,s.cabinWidth,.025,.06,2.02,'elevator-cabin','metal');add(x,y,.025,s.cabinDepth,.06,2.02,'elevator-cabin','glass');add(x+s.cabinWidth-.025,y,.025,s.cabinDepth,.06,2.02,'elevator-cabin','glass');add(x+.1,y+.08,s.cabinWidth-.2,.025,1.05,.04,'elevator-handrail','metal');add(x+.08,y+s.cabinDepth-.08,.04,.025,.8,.25,'elevator-control','dark');}
 return parts;
};
const elevatorSceneFurniture=BMH.addRoomSceneFurniture;BMH.addRoomSceneFurniture=(r,base,THREE,scene,mats,site)=>{
 if(r.type!=='elevator')return elevatorSceneFurniture(r,base,THREE,scene,mats,site);
 const metal=new THREE.MeshStandardMaterial({color:'#b5c3c5',metalness:.78,roughness:.25}),glass=new THREE.MeshPhysicalMaterial({color:'#b4d4d2',transparent:true,opacity:.24,roughness:.08,metalness:.05,side:THREE.DoubleSide}),solid=new THREE.MeshStandardMaterial({color:'#d3d6d1',roughness:.85});
 for(const p of BMH.elevatorGeometry(r)){const material=p.finish==='metal'?metal:p.finish==='dark'?mats.dark:p.finish==='solid'?solid:glass,mesh=new THREE.Mesh(new THREE.BoxGeometry(p.w,p.h,p.d),material);mesh.position.set(p.x+p.w/2-site.width/2,base+p.base+p.h/2,p.y+p.d/2-site.depth/2);mesh.name=r.id+'-'+p.kind;mesh.userData={kind:p.kind,roomId:r.id,floor:r.floor,shaftId:BMH.elevatorSpec(r).shaftId,generic:true};mesh.castShadow=p.finish!=='glass';mesh.receiveShadow=true;scene.add(mesh);}
};
const elevatorEditingPanel=BMH.roomEditingPanel;BMH.roomEditingPanel=()=>{
 const r=BMH.selectedRoom();if(r?.type!=='elevator')return elevatorEditingPanel();const s=BMH.elevatorSpec(r),disabled=BMH.elevatorRooms(r).some(q=>BMH.isRoomLocked(q.id))?'disabled':'';
 return '<section class="v6-card elevator-edit-panel"><span class="studio-eyebrow">THANG MÁY LIÊN THÔNG</span><h3>Giếng '+r.w.toFixed(2)+' × '+r.h.toFixed(2)+' m · '+s.stops.length+' điểm dừng</h3><p>Di chuyển hoặc đổi kích thước ô này sẽ cập nhật cả giếng. Kích thước giếng là vùng dự trù trên mặt bằng.</p><div class="architecture-fields">'+[['cabinWidth','Cabin rộng / m',s.cabinWidth],['cabinDepth','Cabin sâu / m',s.cabinDepth],['doorWidth','Cửa thông thủy / m',s.doorWidth],['pitDepth','Hố pit / m · theo hãng',s.pitDepth],['headroom','Khoảng không đỉnh / m · theo hãng',s.headroom]].map(([k,n,v])=>'<label>'+n+'<input data-elevator-field="'+k+'" type="number" min="'+(k==='pitDepth'?0:.1)+'" max="10" step=".01" placeholder="Chưa xác nhận" value="'+(v??'')+'" '+disabled+'></label>').join('')+'<label>Cửa tầng<select data-elevator-field="doorSide" '+disabled+'>'+[['north','Đầu đất'],['south','Cuối đất'],['west','Bên trái'],['east','Bên phải']].map(([v,n])=>'<option value="'+v+'" '+(v===s.doorSide?'selected':'')+'>'+n+'</option>').join('')+'</select></label><label>Vỏ giếng minh họa<select data-elevator-field="enclosure" '+disabled+'><option value="glass" '+(s.enclosure==='glass'?'selected':'')+'>Kính + khung kim loại</option><option value="solid" '+(s.enclosure==='solid'?'selected':'')+'>Vách kín</option></select></label><label>Hãng / model<input data-elevator-field="model" maxlength="120" value="'+BMH.esc(s.model)+'" placeholder="Nhập theo hồ sơ hãng" '+disabled+'></label></div><button data-elevator-sync '+disabled+'>Đồng bộ các tầng</button><button data-elevator-drawing>Xem chi tiết A3</button><button data-elevator-3d>Xem thang trong 3D</button><p>Cabin và cửa là minh họa bố trí. Hãng thang và KS/KTS cần xác nhận tải trọng, kết cấu, điện, pit, khoảng không đỉnh và khả năng tiếp cận.</p></section>';
};
BMH.elevatorBriefHtml=r=>{const s=BMH.elevatorSpec(r);return '<aside class="design-brief"><span>THANG MÁY / GIẾNG LIÊN THÔNG</span><h2>Thang máy của bạn</h2><p>'+s.stops.length+' điểm dừng · '+(s.enclosure==='glass'?'Giếng kính và khung kim loại':'Vỏ giếng kín')+'</p><dl class="elevator-spec-list">'+[['Giếng dự trù',r.w.toFixed(2)+' × '+r.h.toFixed(2)+' m'],['Cabin',s.cabinWidth.toFixed(2)+' × '+s.cabinDepth.toFixed(2)+' m'],['Cửa trượt',Math.round(s.doorWidth*1000)+' mm'],['Hố pit',s.pitDepth===null?'Chưa xác nhận':Math.round(s.pitDepth*1000)+' mm'],['Khoảng không đỉnh',s.headroom===null?'Chưa xác nhận':Math.round(s.headroom*1000)+' mm'],['Hãng / model',s.model||'Chưa xác nhận']].map(([a,b])=>'<div><dt>'+a+'</dt><dd>'+BMH.esc(b)+'</dd></div>').join('')+'</dl><button data-elevator-edit-room="'+BMH.esc(r.id)+'">Chỉnh giếng, cabin & cửa →</button><button data-elevator-sheet-room="'+BMH.esc(r.id)+'">Tải chi tiết thang máy A3 ↓</button><p>Thang là mô hình bố trí. Hồ sơ hãng cần xác nhận tải trọng, khoảng trống lắp đặt, kết cấu, điện và khả năng tiếp cận.</p></aside>';};
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-elevator-edit-room],[data-elevator-sheet-room]');if(!b)return;const r=BMH.state.project.plan.rooms.find(r=>r.id===(b.dataset.elevatorEditRoom||b.dataset.elevatorSheetRoom)&&r.type==='elevator');if(!r)return;if(b.hasAttribute('data-elevator-sheet-room'))BMH.download('BMH-thang-may-A3.svg',BMH.elevatorDetailSheetSvg(r),'image/svg+xml');else{BMH.state.ui.planner.floor=r.floor;BMH.state.ui.planner.selected=r.id;BMH.state.ui.planner.view='plan';BMH.navigateTo(4);}});
BMH.elevatorDetailSheetSvg=(room,index=0)=>{
 const s=BMH.elevatorSpec(room),group=BMH.elevatorRooms(room).filter(q=>q.floor<Number(BMH.state.project.site.floors)),r=group.toSorted((a,b)=>a.floor-b.floor)[0]||room,l=BMH.projectLevels(),total=Number(BMH.state.project.site.floors)*l.floorHeight,t=BMH.sheetText;
 const title=t(12,29,'GIẾNG DỰ TRÙ / MẶT BẰNG',3,'font-weight="bold"'),plan='<svg x="20" y="42" width="130" height="145" viewBox="'+[r.x-.45,r.y-.45,r.w+.9,r.h+.9].join(' ')+'"><rect x="'+r.x+'" y="'+r.y+'" width="'+r.w+'" height="'+r.h+'" fill="white" stroke="#3d6965" stroke-width=".035"/>'+BMH.furnitureSvg(r)+BMH.state.project.plan.openings.filter(o=>o.roomId===r.id).map(BMH.openingSvg).join('')+'<text x="'+(r.x+r.w/2)+'" y="'+(r.y-.18)+'" text-anchor="middle" font-size=".13">'+Math.round(r.w*1000)+' mm</text><text x="'+(r.x+r.w/2)+'" y="'+(r.y+r.h+.28)+'" text-anchor="middle" font-size=".13">Sâu '+Math.round(r.h*1000)+' mm · chưa chốt cấu tạo vách</text></svg>';
 const factor=Math.min(20,180/(total+1),100/r.w),x=198,top=40,w=r.w*factor,height=total*factor;let profile='<rect x="'+x+'" y="'+top+'" width="'+w+'" height="'+height+'" fill="#e5efef" stroke="#577d78" stroke-width=".5"/>';
 for(const q of group){const y=top+height-q.floor*l.floorHeight*factor;profile+='<path d="M'+(x-10)+' '+y+'H'+(x+w+10)+'" stroke="#64766a" stroke-dasharray="2 1"/>'+t(x+w+12,y-1,'T'+(q.floor+1)+' · +'+(q.floor*l.floorHeight).toFixed(3),2.5);if(q.floor===0)profile+='<rect x="'+(x+(r.w-s.cabinWidth)*factor/2)+'" y="'+(y-2.1*factor)+'" width="'+s.cabinWidth*factor+'" height="'+2.1*factor+'" fill="#b9cccb" stroke="#507970" stroke-width=".5"/>';}
 const sidebar=t(330,29,'THÔNG SỐ BỐ TRÍ',3,'font-weight="bold"')+[['Giếng',Math.round(r.w*1000)+' × '+Math.round(r.h*1000)+' mm'],['Cabin',Math.round(s.cabinWidth*1000)+' × '+Math.round(s.cabinDepth*1000)+' mm'],['Cửa',Math.round(s.doorWidth*1000)+' mm · cửa trượt'],['Điểm dừng',s.stops.map(f=>'T'+(f+1)).join(', ')],['Hố pit',s.pitDepth===null?'Chưa xác nhận':Math.round(s.pitDepth*1000)+' mm'],['Khoảng không đỉnh',s.headroom===null?'Chưa xác nhận':Math.round(s.headroom*1000)+' mm'],['Hãng / model',s.model||'Chưa xác nhận']].map(([a,b],i)=>t(330,42+i*23,a,2.6,'font-weight="bold"')+t(330,49+i*23,b.slice(0,40),2.5)).join('')+t(330,222,'Chưa phải hồ sơ lắp đặt.',2.7,'font-weight="bold"')+t(330,231,'Hãng và KS/KTS cần xác nhận.',2.5);
 return BMH.sheetFrame({code:'KT-TM-'+String(index+1).padStart(2,'0'),title:'THANG MÁY / GIẾNG LIÊN THÔNG',scale:0,content:title+plan+t(181,29,'SƠ ĐỒ ĐIỂM DỪNG',3,'font-weight="bold"')+profile,sidebar,caption:'Sơ đồ bố trí có số đo, không in theo tỷ lệ. Cao cabin 2,10 m minh họa; pit, đỉnh giếng và kết cấu theo hồ sơ hãng.'});
};
const elevatorSheets=BMH.architecturalSheets;BMH.architecturalSheets=()=>[...elevatorSheets(),...BMH.elevatorShafts().map((r,i)=>({name:'Chi tiết thang máy '+(i+1),svg:BMH.elevatorDetailSheetSvg(r,i)}))];
const elevatorAIContext=BMH.aiContext;BMH.aiContext=options=>{const c=elevatorAIContext(options);if(!options?.lightweight)c.elevators=BMH.elevatorShafts().map(r=>({...BMH.elevatorSpec(r),x:r.x,y:r.y,preliminary:true}));return c;};
const elevatorSignature=BMH.cinematicSignature;BMH.cinematicSignature=focus=>elevatorSignature(focus)+'|elevators:'+JSON.stringify(BMH.state.project.plan.rooms.filter(r=>r.type==='elevator').map(r=>[r.id,r.elevator]));
document.addEventListener('change',e=>{if(e.target.matches?.('[data-elevator-field]'))BMH.editElevatorSettings(e.target.dataset.elevatorField,e.target.value);});
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-room-delete],[data-room-rotate]');if(!b||BMH.selectedRoom()?.type!=='elevator')return;e.preventDefault();e.stopImmediatePropagation();if(b.hasAttribute('data-room-delete'))BMH.deleteElevatorShaft();else BMH.toast('Đổi hướng cửa trong bảng thang máy; giếng giữ đồng bộ giữa các tầng.');},true);
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-elevator-sync],[data-elevator-drawing],[data-elevator-3d]');if(!b)return;if(b.hasAttribute('data-elevator-sync'))return BMH.syncElevatorFloors();const r=BMH.selectedRoom();if(r?.type!=='elevator')return;if(b.hasAttribute('data-elevator-drawing'))BMH.download('BMH-thang-may-A3.svg',BMH.elevatorDetailSheetSvg(r),'image/svg+xml');else{BMH.state.ui.designView='room';BMH.state.ui.sceneFocus='room:'+r.id;BMH.state.ui.roomCamera='overview';BMH.navigateTo(6);}});
