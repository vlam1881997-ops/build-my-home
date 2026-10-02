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
 const parts=BMH.stairGeometry(r),spec=BMH.stairSpec(r),finish=BMH.sceneAssetMaterials(THREE,scene,BMH.finishPalette?.(r.id)||{}),concrete=finish.wall;
 const add=(g,m,name,kind)=>{const mesh=new THREE.Mesh(g,m);mesh.name=r.id+'-'+name;mesh.userData={kind,roomId:r.id,floor:r.floor,generic:true};mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);return mesh;};
 const box=(p,h,top,m,name,kind)=>{const g=new THREE.BoxGeometry(p.w,h,p.d);BMH.sceneSurfaceUvs(g,m,{x:p.x,y:top,z:p.y});const mesh=add(g,m,name,kind);mesh.position.set(p.x+p.w/2-site.width/2,base+top-h/2,p.y+p.d/2-site.depth/2);return mesh;};
 // Every tread top and landing still matches stairGeometry exactly; the underside is a continuous flight.
 parts.forEach((p,i)=>box(p,Math.min(.035,p.h),p.base+p.h,finish.wood,'tread-'+i,'stair-tread'));
 const landingIndex=spec.shape==='u'?spec.first-1:-1,flights=spec.shape==='u'?[parts.slice(0,landingIndex),parts.slice(landingIndex+1)]:[parts];
 if(parts[landingIndex])box(parts[landingIndex],.15,parts[landingIndex].base+parts[landingIndex].h-.035,concrete,'landing','stair-landing');
 const rod=(a,b,radius,material,name)=>{const va=new THREE.Vector3(a.x-site.width/2,base+a.h,a.y-site.depth/2),vb=new THREE.Vector3(b.x-site.width/2,base+b.h,b.y-site.depth/2),delta=vb.clone().sub(va),mesh=add(new THREE.CylinderGeometry(radius,radius,delta.length(),12),material,name,'stair-guard');mesh.position.copy(va.clone().add(vb).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());};
 for(let f=0;f<flights.length;f++){
  const flight=flights[f];if(flight.length<2)continue;
  const first=flight[0],last=flight.at(-1),alongX=Math.abs(last.x-first.x)>Math.abs(last.y-first.y),dir=Math.sign(alongX?last.x-first.x:last.y-first.y)||1,width=alongX?first.d:first.w,start=alongX?(dir>0?first.x:first.x+first.w):(dir>0?first.y:first.y+first.d),cross=alongX?first.y:first.x,total=flight.reduce((sum,p)=>sum+(alongX?p.w:p.d),0),contour=[];let run=0;
  contour.push(new THREE.Vector2(0,first.base+first.h-.035));
  for(const p of flight){const top=p.base+p.h-.035;contour.push(new THREE.Vector2(run,top));run+=alongX?p.w:p.d;contour.push(new THREE.Vector2(run,top));}
  contour.push(new THREE.Vector2(total,last.base+last.h-.20),new THREE.Vector2(0,first.base+first.h-.20));
  const triangles=THREE.ShapeUtils.triangulateShape(contour,[]),coords=[],point=(i,side)=>{const q=contour[i],axis=start+dir*q.x;return alongX?[axis-site.width/2,base+q.y,cross+side*width-site.depth/2]:[cross+side*width-site.width/2,base+q.y,axis-site.depth/2];};
  for(const t of triangles){for(const i of t)coords.push(...point(i,0));for(const i of [...t].reverse())coords.push(...point(i,1));}
  for(let i=0;i<contour.length;i++){const j=(i+1)%contour.length;for(const [n,side] of [[i,0],[j,0],[j,1],[i,0],[j,1],[i,1]])coords.push(...point(n,side));}
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geometry.computeVertexNormals();const material=concrete.clone();material.side=THREE.DoubleSide;add(geometry,material,'flight-'+f,'stair-flight');
  if(r.stairGuard!=='none'){
   const inner=spec.shape==='u'?(f===0?cross+width-.04:cross+.04):cross+width-.04,posts=flight.filter((p,i)=>i===0||i===flight.length-1||i%2===0).map(p=>({x:alongX?p.x+p.w/2:inner,y:alongX?inner:p.y+p.d/2,h:p.base+p.h}));
   posts.forEach((q,i)=>rod(q,{...q,h:q.h+.95},.012,finish.dark,'post-'+f+'-'+i));
   if(posts.length>1){rod({...posts[0],h:posts[0].h+.95},{...posts.at(-1),h:posts.at(-1).h+.95},.026,finish.wood,'handrail-'+f);for(const h of [.35,.65])rod({...posts[0],h:posts[0].h+h},{...posts.at(-1),h:posts.at(-1).h+h},.008,finish.dark,'guard-'+f+'-'+h);}
  }
 }
 if(parts[landingIndex]&&r.stairGuard!=='none'){
  const p=parts[landingIndex],alongX=spec.alongX,h=p.base+p.h,edge=spec.direction===0?{a:{x:p.x,y:p.y,h},b:{x:p.x+p.w,y:p.y,h}}:spec.direction===180?{a:{x:p.x,y:p.y+p.d,h},b:{x:p.x+p.w,y:p.y+p.d,h}}:spec.direction===90?{a:{x:p.x+p.w,y:p.y,h},b:{x:p.x+p.w,y:p.y+p.d,h}}:{a:{x:p.x,y:p.y,h},b:{x:p.x,y:p.y+p.d,h}};
  rod(edge.a,{...edge.a,h:h+.95},.012,finish.dark,'landing-post-0');rod(edge.b,{...edge.b,h:h+.95},.012,finish.dark,'landing-post-1');rod({...edge.a,h:h+.95},{...edge.b,h:h+.95},.026,finish.wood,'landing-handrail');
 }

};
const stairDocument=BMH.architectDocument;
BMH.architectDocument=(focus='all')=>{const doc=stairDocument(focus);for(let f=0;f<doc.levels.length;f++){const items=BMH.floorRooms(f).filter(r=>r.type==='stairs'&&(!focus.startsWith('room:')||r.id===focus.slice(5))).flatMap(r=>BMH.stairGeometry(r).map((p,i)=>({id:r.id+'-stair-'+i,item_name:'Bậc / chiếu nghỉ',item_type:1,format:'gltf',model_url:'models/stairStep.glb',xpos:(p.x+p.w/2)*100,zpos:(p.y+p.d/2)*100,ypos:p.base*100,scale_x:p.w*100,scale_y:p.h*100,scale_z:p.d*100,rotation:0,fixed:true})));if(f===0)doc.items.push(...items);else doc.levels[f].items.push(...items);}return doc;};
const stairEditingPanel=BMH.roomEditingPanel;
BMH.roomEditingPanel=()=>{const r=BMH.selectedRoom(),html=stairEditingPanel();if(r?.type!=='stairs')return html;const s=BMH.stairSpec(r);return html.replace('<form data-opening-form','<div class="architecture-fields"><label>Kiểu thang<select data-stair-shape '+(BMH.isRoomLocked(r.id)?'disabled':'')+'><option value="u" '+(s.shape==='u'?'selected':'')+'>Chữ U · hai vế có chiếu nghỉ</option><option value="straight" '+(s.shape==='straight'?'selected':'')+'>Thẳng</option></select></label><label>Lan can minh họa<select data-stair-guard '+(BMH.isRoomLocked(r.id)?'disabled':'')+'><option value="metal" '+(r.stairGuard!=='none'?'selected':'')+'>Thanh kim loại · tay vịn gỗ</option><option value="none" '+(r.stairGuard==='none'?'selected':'')+'>Ẩn để kiểm tra hình thang</option></select></label><p>'+s.count+' cao bậc · cao '+s.riser.toFixed(3)+' m · mặt bậc '+s.tread.toFixed(3)+' m'+(s.shape==='u'?' · rộng vế '+s.flightWidth.toFixed(2)+' m · chiếu nghỉ '+s.landing.toFixed(2)+' m':'')+'<br>'+BMH.esc(s.warning||'Kiểm tra sơ bộ theo kích thước ô thang. Khoảng thông đầu, lan can, kết cấu và PCCC cần KTS/kỹ sư xác nhận.')+'</p></div><form data-opening-form');};
document.addEventListener('change',e=>{if(!e.target.matches?.('[data-stair-shape],[data-stair-guard]'))return;const r=BMH.selectedRoom();if(!r||BMH.isRoomLocked(r.id))return;BMH.pushPlanHistory();r[e.target.matches('[data-stair-guard]')?'stairGuard':'stairShape']=e.target.value;BMH.save();BMH.render({preserveScroll:true});});
const stairSignature=BMH.cinematicSignature;BMH.cinematicSignature=focus=>stairSignature(focus)+'|stairs:'+JSON.stringify(BMH.state.project.plan.rooms.filter(r=>r.type==='stairs').map(r=>[r.id,r.stairShape||'u',BMH.stairSpec(r).direction,r.stairGuard||'metal']));
