/* Two-flight stairs with a landing; one geometry for drawings and both viewers. */
const stairStraightSpec=BMH.stairSpec;
BMH.stairSpec=r=>{
 const shape=r.stairShape||'u';if(shape==='straight')return {...stairStraightSpec(r),shape};
 const direction=r.stairDirection??(r.w>=r.h?90:0),alongX=direction%180===90,W=alongX?r.h:r.w,D=alongX?r.w:r.h,rise=BMH.projectLevels().floorHeight,count=Math.ceil(rise/.18),first=Math.ceil(count/2),second=count-first;
 const flightWidth=Math.min(.9,Math.max(.3,(W-.35)/2)),landing=flightWidth,run=D-.2-landing,tread=run/Math.max(1,first-1,second-1),riser=rise/count;
 const warning=flightWidth<.9||tread<.25||run<=0?'Không đủ chỗ cho thang chữ U với vế 0,90 m và mặt bậc 0,25 m. Đổi hướng chạy hoặc tăng ô thang; cần KTS kiểm tra chiếu nghỉ và khoảng thông đầu.':'';
 return {shape,direction,alongX,W,D,rise,count,first,second,flightWidth,landing,run,tread,riser,warning};
};
BMH.stairGeometry=r=>{
 const s=BMH.stairSpec(r),parts=[];
 if(Number(r.floor)>=BMH.projectLevels().floors-1)return parts;
 if(s.shape==='straight'){for(let n=0;n<s.count;n++){const reverse=[0,270].includes(s.direction),run=(reverse?s.count-1-n:n)*s.tread;parts.push({x:r.x+.12+(s.alongX?run:0),y:r.y+.12+(!s.alongX?run:0),w:s.alongX?s.tread:r.w-.24,d:s.alongX?r.h-.24:s.tread,base:0,h:(n+1)*s.riser});}return parts;}
 const transform=(x,y)=>s.direction===90?{x:r.w-y,y:x}:s.direction===180?{x:r.w-x,y:r.h-y}:s.direction===270?{x:y,y:r.h-x}:{x,y};
 const add=(x,y,w,d,base,h)=>{const a=transform(x,y),b=transform(x+w,y+d);parts.push({x:r.x+Math.min(a.x,b.x),y:r.y+Math.min(a.y,b.y),w:Math.abs(a.x-b.x),d:Math.abs(a.y-b.y),base,h});};
 if(s.run<=0)return [];
 for(let n=1;n<s.first;n++)add(.1,s.D-.1-n*s.tread,s.flightWidth,s.tread,0,n*s.riser);
 const mid=s.first*s.riser;add(.1,.1,s.W-.2,s.landing,mid-.15,.15);
 for(let n=1;n<=s.second;n++)add(s.W-.1-s.flightWidth,.1+s.landing+(n-1)*s.tread,s.flightWidth,s.tread,mid,n===s.second?s.rise-mid:n*s.riser);
 return parts;
};
// Floor slabs must leave the lower flight's well open, including offset wells.
BMH.slabPanels=(r,holes=[])=>{
 let panels=[{x:r.x,y:r.y,w:r.w,d:r.h}];
 for(const hole of holes){panels=panels.flatMap(p=>{
  const x=Math.max(p.x,hole.x),y=Math.max(p.y,hole.y),right=Math.min(p.x+p.w,hole.x+hole.w),bottom=Math.min(p.y+p.d,hole.y+hole.h);
  if(right<=x+.001||bottom<=y+.001)return [p];
  return [{x:p.x,y:p.y,w:x-p.x,d:p.d},{x:right,y:p.y,w:p.x+p.w-right,d:p.d},{x,y:p.y,w:right-x,d:y-p.y},{x,y:bottom,w:right-x,d:p.y+p.d-bottom}].filter(q=>q.w>.001&&q.d>.001);
 });}return panels;
};
BMH.stairFloorHoles=floor=>BMH.floorRooms(floor-1).filter(r=>r.type==='stairs').map(r=>({x:r.x+.1,y:r.y+.1,w:r.w-.2,h:r.h-.2})).filter(h=>h.w>0&&h.h>0);
const stairFurnitureSvg=BMH.furnitureSvg;
BMH.furnitureSvg=r=>{
 if(r.type!=='stairs')return stairFurnitureSvg(r);const parts=BMH.stairGeometry(r),spec=BMH.stairSpec(r),centers=parts.map(p=>({x:p.x+p.w/2,y:p.y+p.d/2})),selected=spec.shape==='u'?[0,spec.first-2,spec.first-1,spec.first,parts.length-1]:[0,parts.length-1],points=selected.map(i=>centers[i]).filter(Boolean),last=points.at(-1),before=points.at(-2);let arrow='';
 if(last&&before){const a=Math.atan2(last.y-before.y,last.x-before.x),dx=Math.cos(a),dy=Math.sin(a);arrow='<polyline points="'+points.map(p=>p.x+','+p.y).join(' ')+'" fill="none" stroke="#425a49" stroke-width=".04"/><path d="M'+last.x+' '+last.y+'l'+(-dx*.18+dy*.09)+' '+(-dy*.18-dx*.09)+'l'+(-dy*.18)+' '+(dx*.18)+'z" fill="#425a49"/>';}
 return '<g class="furniture stairs-symbol" stroke="#697d70" stroke-width=".025" fill="#efede5">'+parts.map((p,i)=>'<rect x="'+p.x+'" y="'+p.y+'" width="'+p.w+'" height="'+p.d+'"/>'+([0,parts.length-1,spec.first-1].includes(i)?'<text data-step-number="'+(i+1)+'" x="'+(p.x+p.w*.72)+'" y="'+(p.y+p.d*.60)+'" font-size=".17" fill="#425a49" stroke="none" text-anchor="middle">'+(i+1)+'</text>':'')).join('')+arrow+(parts.length?'':'<rect x="'+(r.x+.1)+'" y="'+(r.y+.1)+'" width="'+(r.w-.2)+'" height="'+(r.h-.2)+'" fill="none" stroke-dasharray=".12 .08"/><text x="'+(r.x+r.w/2)+'" y="'+(r.y+r.h/2)+'" font-size=".18" text-anchor="middle">Ô THANG TỪ TẦNG DƯỚI</text>')+'<title>'+BMH.esc('Cao bậc '+spec.riser.toFixed(3)+' m · mặt bậc '+spec.tread.toFixed(3)+' m · '+spec.warning)+'</title></g>';
};

const stairSceneFurniture=BMH.addRoomSceneFurniture;
BMH.addRoomSceneFurniture=(r,base,THREE,scene,mats,site)=>{
 if(r.type!=='stairs')return stairSceneFurniture(r,base,THREE,scene,mats,site);
 for(const p of BMH.stairGeometry(r)){const mesh=new THREE.Mesh(new THREE.BoxGeometry(p.w,p.h,p.d),mats.accent);mesh.position.set(p.x+p.w/2-site.width/2,base+p.base+p.h/2,p.y+p.d/2-site.depth/2);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}
};
const stairDocument=BMH.architectDocument;
BMH.architectDocument=(focus='all')=>{const doc=stairDocument(focus);for(let f=0;f<doc.levels.length;f++){const items=BMH.floorRooms(f).filter(r=>r.type==='stairs'&&(!focus.startsWith('room:')||r.id===focus.slice(5))).flatMap(r=>BMH.stairGeometry(r).map((p,i)=>({id:r.id+'-stair-'+i,item_name:'Bậc / chiếu nghỉ',item_type:1,format:'gltf',model_url:'models/stairStep.glb',xpos:(p.x+p.w/2)*100,zpos:(p.y+p.d/2)*100,ypos:p.base*100,scale_x:p.w*100,scale_y:p.h*100,scale_z:p.d*100,rotation:0,fixed:true})));if(f===0)doc.items.push(...items);else doc.levels[f].items.push(...items);}return doc;};
const stairEditingPanel=BMH.roomEditingPanel;
BMH.roomEditingPanel=()=>{const r=BMH.selectedRoom(),html=stairEditingPanel();if(r?.type!=='stairs')return html;const s=BMH.stairSpec(r);return html.replace('<form data-opening-form','<div class="architecture-fields"><label>Kiểu thang<select data-stair-shape '+(BMH.isRoomLocked(r.id)?'disabled':'')+'><option value="u" '+(s.shape==='u'?'selected':'')+'>Chữ U · hai vế có chiếu nghỉ</option><option value="straight" '+(s.shape==='straight'?'selected':'')+'>Thẳng</option></select></label><p>'+s.count+' cao bậc · cao '+s.riser.toFixed(3)+' m · mặt bậc '+s.tread.toFixed(3)+' m'+(s.shape==='u'?' · rộng vế '+s.flightWidth.toFixed(2)+' m · chiếu nghỉ '+s.landing.toFixed(2)+' m':'')+'<br>'+BMH.esc(s.warning||'Kiểm tra sơ bộ theo kích thước ô thang. Khoảng thông đầu, lan can, kết cấu và PCCC cần KTS/kỹ sư xác nhận.')+'</p></div><form data-opening-form');};
document.addEventListener('change',e=>{if(!e.target.matches?.('[data-stair-shape]'))return;const r=BMH.selectedRoom();if(!r||BMH.isRoomLocked(r.id))return;BMH.pushPlanHistory();r.stairShape=e.target.value;BMH.save();BMH.render({preserveScroll:true});});
const stairSignature=BMH.cinematicSignature;BMH.cinematicSignature=focus=>stairSignature(focus)+'|stairs:'+JSON.stringify(BMH.state.project.plan.rooms.filter(r=>r.type==='stairs').map(r=>[r.id,r.stairShape||'u',BMH.stairSpec(r).direction]));
