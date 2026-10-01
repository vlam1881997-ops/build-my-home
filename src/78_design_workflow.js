/* Incremental editing, shared room furnishings and usable non-WebGL preview. */
BMH.rotateSelectedRoom=()=>{
 const r=BMH.selectedRoom();if(!r||BMH.isRoomLocked(r.id))return BMH.toast('Chọn một phòng chưa khóa.');
 const plan=BMH.planSnapshot(),next={...r,x:r.x+(r.w-r.h)/2,y:r.y+(r.h-r.w)/2,w:r.h,h:r.w,furnitureRotation:((r.furnitureRotation||0)+90)%360,stairDirection:((r.type==='stairs'?BMH.stairSpec(r).direction:r.stairDirection||0)+90)%360};
 const candidate=plan.rooms.map(x=>x.id===r.id?next:x);if(!BMH.layoutValid(candidate))return BMH.toast('Xoay 90° sẽ chồng phòng hoặc vượt ranh đất. Dời phòng hoặc đổi kích thước trước.');
 BMH.pushPlanHistory();Object.assign(r,next);const sides={north:'east',east:'south',south:'west',west:'north'};
 for(const o of BMH.state.project.plan.openings.filter(x=>x.roomId===r.id)){if(['east','west'].includes(o.side))o.offset=1-o.offset;o.side=sides[o.side];}
 BMH.save();BMH.render({preserveScroll:true});BMH.toast('Đã xoay phòng, ô mở và nội thất 90°. Có thể hoàn tác.');
};
BMH.addOpeningFromInspector=values=>{
 const r=BMH.selectedRoom();if(!r||BMH.isRoomLocked(r.id))return BMH.toast('Chọn một phòng chưa khóa.');
 const o={id:BMH.uid('o'),roomId:r.id,floor:r.floor,kind:values.kind==='window'?'window':'door',side:values.side,offset:Number(values.offset),width:Number(values.width),height:Number(values.height),sill:values.kind==='window'?Number(values.sill):0,hinge:'left',swing:'in'};
 if(!['north','south','east','west'].includes(o.side)||!Number.isFinite(o.offset)||o.offset<0||o.offset>1||!Number.isFinite(o.height)||o.height<.3||!Number.isFinite(o.sill)||o.sill<0||o.height+o.sill>BMH.projectLevels().clearHeight)return BMH.toast('Kiểm tra cạnh, vị trí 0–1 và cao cửa + bậu dưới trần.');
 if(!BMH.openingFits(o))return BMH.toast('Ô mở quá rộng hoặc trùng cửa có sẵn trên cùng tường. Chọn cạnh/vị trí khác.');
 BMH.pushPlanHistory();BMH.state.project.plan.openings.push(o);BMH.save();BMH.render({preserveScroll:true});BMH.toast('Đã thêm '+(o.kind==='door'?'cửa đi':'cửa sổ')+'; bản vẽ và 3D dùng chung ô mở này.');return o;
};
BMH.roomEditingPanel=()=>{
 const r=BMH.selectedRoom();if(!r)return '';const esc=BMH.v6Esc,disabled=BMH.isRoomLocked(r.id)?'disabled':'';
 return '<section class="v6-card room-editing-panel"><h3>Hướng phòng, cầu thang & thêm cửa</h3><p>Đang chọn: <b>'+esc(r.name)+'</b> · '+r.w.toFixed(2)+' × '+r.h.toFixed(2)+' m</p><div class="architecture-fields"><button data-room-rotate '+disabled+'>Xoay phòng 90°</button><label>Hướng nội thất<select data-room-orientation '+disabled+'>'+[0,90,180,270].map(v=>'<option value="'+v+'" '+((r.furnitureRotation||0)===v?'selected':'')+'>'+v+'°</option>').join('')+'</select></label>'+(r.type==='stairs'?'<label>Hướng chạy thang<select data-stair-direction '+disabled+'>'+[[0,'Lên về đầu đất'],[90,'Lên về bên phải'],[180,'Lên về cuối đất'],[270,'Lên về bên trái']].map(([v,n])=>'<option value="'+v+'" '+(BMH.stairSpec(r).direction===v?'selected':'')+'>'+n+'</option>').join('')+'</select></label>':'')+'</div><form data-opening-form class="architecture-fields"><label>Loại<select name="kind"><option value="door">Cửa đi</option><option value="window">Cửa sổ</option></select></label><label>Cạnh tường<select name="side">'+[['north','Đầu đất'],['east','Bên phải'],['south','Cuối đất'],['west','Bên trái']].map(([v,n])=>'<option value="'+v+'">'+n+'</option>').join('')+'</select></label>'+[['width','Rộng / m',.9,.5],['height','Cao / m',2.1,.3],['sill','Bậu cửa sổ / m',0,0],['offset','Vị trí trên cạnh · 0–1',.5,0]].map(([k,n,v,min])=>'<label>'+n+'<input type="number" name="'+k+'" value="'+v+'" min="'+min+'" '+(k==='offset'?'max="1"':'')+' step=".01" required></label>').join('')+'<button '+disabled+'>Thêm vào phòng đang chọn</button></form><p>Đầu/cuối và trái/phải tính theo mặt bằng đất, không theo chiều xoay màn hình. Cửa trên tường chung nối hai phòng. Dùng bảng cửa phía dưới để chỉnh hoặc xóa.</p></section>';
};
const workflowScreen5=BMH.screen5;
BMH.screen5=()=>workflowScreen5().replace('<div class="v72-review">',BMH.roomEditingPanel()+'<div class="v72-review">');BMH.SCREENS[3]=BMH.screen5;
document.addEventListener('submit',e=>{if(!e.target.matches?.('[data-opening-form]'))return;e.preventDefault();BMH.addOpeningFromInspector(Object.fromEntries(new FormData(e.target)));});
document.addEventListener('click',e=>{if(e.target.closest?.('[data-room-rotate]'))BMH.rotateSelectedRoom();});
document.addEventListener('change',e=>{
 if(!e.target.matches?.('[data-stair-direction],[data-room-orientation]'))return;const r=BMH.selectedRoom();if(!r||BMH.isRoomLocked(r.id))return;BMH.pushPlanHistory();r[e.target.matches('[data-stair-direction]')?'stairDirection':'furnitureRotation']=Number(e.target.value);BMH.save();BMH.render({preserveScroll:true});
});
// Accept a touch anywhere on a room and resolve the nearest wall in plan coordinates.
document.addEventListener('pointerdown',e=>{
 if(BMH.state.ui.step!==4||!['door','window'].includes(BMH.state.ui.planner.tool)||!e.target.closest?.('#plannerSvg'))return;
 const svg=BMH.$('#plannerSvg'),p=BMH.svgPoint(e,svg),rooms=BMH.floorRooms().filter(r=>p.x>=r.x-.2&&p.x<=r.x+r.w+.2&&p.y>=r.y-.2&&p.y<=r.y+r.h+.2);
 if(!rooms.length)return;const r=rooms.find(r=>r.id===BMH.state.ui.planner.selected)||rooms[0],side=[['north',Math.abs(p.y-r.y)],['south',Math.abs(p.y-r.y-r.h)],['west',Math.abs(p.x-r.x)],['east',Math.abs(p.x-r.x-r.w)]].sort((a,b)=>a[1]-b[1])[0][0];
 e.preventDefault();e.stopImmediatePropagation();BMH.placeOpeningAt(BMH.state.ui.planner.tool,r.id,side,p);
},true);
// Furniture dimensions are measured from the vendored CC0 GLBs, in metres.
BMH.FURNITURE_DIMENSIONS={"bedDouble": {"w": 1.912, "h": 0.75, "d": 2.25}, "bedSingle": {"w": 1.142, "h": 0.75, "d": 2.25}, "loungeDesignSofa": {"w": 2.24, "h": 0.8, "d": 0.82}, "loungeChair": {"w": 0.98, "h": 0.92, "d": 0.82}, "tableCoffee": {"w": 1.322, "h": 0.46, "d": 0.8}, "table": {"w": 1.683, "h": 0.6535, "d": 0.8947}, "chair": {"w": 0.4, "h": 0.94, "d": 0.4}, "cabinetTelevision": {"w": 1.6, "h": 0.62, "d": 0.5}, "televisionModern": {"w": 1.3696, "h": 0.9095, "d": 0.2568}, "kitchenSink": {"w": 0.86, "h": 0.98, "d": 0.9}, "kitchenStove": {"w": 0.86, "h": 0.9, "d": 0.9}, "kitchenFridge": {"w": 0.86, "h": 1.84, "d": 0.5839}, "bathroomSink": {"w": 0.68, "h": 1.12, "d": 0.58}, "toilet": {"w": 0.6251, "h": 0.9019, "d": 0.9544}, "shower": {"w": 1.1236, "h": 2.1881, "d": 1.1636}, "bookcaseClosedWide": {"w": 1.6, "h": 1.58, "d": 0.5}, "desk": {"w": 1.469, "h": 0.7688, "d": 0.7846}, "chairDesk": {"w": 0.6699, "h": 1.2152, "d": 0.6286}, "pottedPlant": {"w": 0.4241, "h": 1.308, "d": 0.4829}, "cabinetBed": {"w": 0.532, "h": 0.4664, "d": 0.43}};
BMH.roomFurnitureLayout=r=>{
 const rotation=((Number(r.furnitureRotation)||0)%360+360)%360,odd=rotation%180===90,W=odd?r.h:r.w,D=odd?r.w:r.h,items=[];
 const transform=(x,y)=>rotation===90?{x:r.w-y,y:x}:rotation===180?{x:r.w-x,y:r.h-y}:rotation===270?{x:y,y:r.h-x}:{x,y};
 const add=(model,cx,cy,turn=0,base=0)=>{
  const dim=BMH.FURNITURE_DIMENSIONS[model];if(!dim)return;const swapped=turn%180===90,w=swapped?dim.d:dim.w,d=swapped?dim.w:dim.d;
  const p=transform(cx,cy),angle=(turn+rotation)%360,worldW=odd?d:w,worldD=odd?w:d;
  const item={model,x:r.x+p.x-worldW/2,y:r.y+p.y-worldD/2,w:worldW,d:worldD,h:dim.h,base,rotation:angle,roomId:r.id,floor:r.floor};
  if(item.x<r.x+.08||item.y<r.y+.08||item.x+item.w>r.x+r.w-.08||item.y+item.d>r.y+r.h-.08)return;
  if(items.some(o=>o.base+o.h>base+.05&&base+dim.h>o.base+.05&&item.x<o.x+o.w+.05&&item.x+item.w>o.x-.05&&item.y<o.y+o.d+.05&&item.y+item.d>o.y-.05))return;
  const blocked=BMH.state.project.plan.openings.filter(o=>o.roomId===r.id&&o.kind==='door').some(o=>{const g=BMH.openingGeometry(o);if(!g)return false;const c={x:g.x-.45,y:g.y-.45,w:.9,d:.9};return item.x<c.x+c.w&&item.x+item.w>c.x&&item.y<c.y+c.d&&item.y+item.d>c.y;});if(blocked)return;
  items.push(item);
 };
 if(r.type==='living'){add('loungeDesignSofa',W/2,.58,180);add('tableCoffee',W/2,1.8);add('cabinetTelevision',W/2,D-.38);add('televisionModern',W/2,D-.38,0,.64);add('loungeChair',.65,D/2,90);add('pottedPlant',W-.4,D-.4);}
 if(r.type==='bed'){const model=W>=2.7?'bedDouble':'bedSingle';add(model,W/2,1.26);add('cabinetBed',.4,.4);add('bookcaseClosedWide',W/2,D-.42);add('desk',.8,D/2,90);add('chairDesk',1.7,D/2,90);}
 if(r.type==='kitchen'){add('kitchenSink',.55,.62);add('kitchenStove',1.55,.62);add('kitchenFridge',W-.6,.5);add('table',W/2,D*.65);add('chair',W/2-1.1,D*.65,90);add('chair',W/2+1.1,D*.65,270);add('chair',W/2,D*.65+.8,180);}
 if(r.type==='bath'){add('toilet',.48,.63);add('bathroomSink',W-.48,.44);add('shower',W/2,D-.7);}
 if(r.type==='balcony'){add('chair',.4,.4);add('pottedPlant',W-.4,D-.4);}
 // Corridors stay clear; stairs use their actual rise in the shared stair model.
 return items;
};
BMH.stairSpec=r=>{const direction=Number(r.stairDirection)||0,alongX=direction%180===90,run=(alongX?r.w:r.h)-.3,rise=BMH.projectLevels().floorHeight,count=Math.ceil(rise/.18),tread=run/count;return {direction,alongX,run,rise,count,tread,riser:rise/count,warning:tread<.25?'Chiều chạy thang hiện không đủ cho thang thẳng với mặt bậc 0,25 m. Cần thiết kế thang chữ L/U và chiếu nghỉ.':''};};
BMH.furnitureSvg=r=>{
 const esc=BMH.esc,items=BMH.roomFurnitureLayout(r),rects=items.map(i=>'<g data-furniture-model="'+i.model+'"><rect x="'+i.x+'" y="'+i.y+'" width="'+i.w+'" height="'+i.d+'" rx=".04"/><title>'+esc(i.model)+' · '+i.w.toFixed(2)+' × '+i.d.toFixed(2)+' m</title></g>').join('');
 if(r.type==='stairs'){const s=BMH.stairSpec(r),x=r.x,y=r.y,w=r.w,h=r.h,cx=x+w/2,cy=y+h/2,angle=s.direction;const baseW=s.alongX?h:w,baseD=s.alongX?w:h;return '<g class="furniture stairs-symbol" stroke="#8a938d" fill="none" stroke-width=".025" transform="translate('+cx+' '+cy+') rotate('+angle+')">'+Array.from({length:s.count},(_,i)=>'<line x1="'+(-baseW*.35)+'" y1="'+(-baseD/2+.15+i*s.tread)+'" x2="'+baseW*.35+'" y2="'+(-baseD/2+.15+i*s.tread)+'"/>').join('')+'<path d="M0 '+baseD*.36+' V'+(-baseD*.36)+' l-.13 .2 m.13-.2 l.13 .2"/><title>'+esc(s.warning||('Cao bậc '+s.riser.toFixed(3)+' m; mặt bậc '+s.tread.toFixed(3)+' m'))+'</title></g>';}
 if(r.type==='garage')return '<g class="furniture" fill="none" stroke="#8a938d" stroke-width=".035"><rect x="'+(r.x+.2)+'" y="'+(r.y+.2)+'" width="'+Math.max(.5,r.w-.4)+'" height="'+Math.max(.5,r.h-.4)+'" rx=".2"/><text x="'+(r.x+r.w/2)+'" y="'+(r.y+r.h/2)+'">GARA</text></g>';
 return '<g class="furniture" stroke="#8a938d" fill="#e7e0d4" stroke-width=".025">'+rects+'</g>';
};
const workflowIssues=BMH.plannerIssues;BMH.plannerIssues=()=>[...workflowIssues(),...BMH.state.project.plan.rooms.filter(r=>r.type==='stairs').flatMap(r=>{const s=BMH.stairSpec(r);return s.warning?[{sev:'warn',text:r.name+': '+s.warning}]:[];})];
// Both render engines and the drawing consume exactly the same item placements.
const workflowDocument=BMH.architectDocument;
BMH.architectDocument=(focus='all')=>{const doc=workflowDocument(focus),p=BMH.state.project;for(let f=0;f<doc.levels.length;f++){const furniture=BMH.floorRooms(f).filter(r=>!focus.startsWith('room:')||r.id===focus.slice(5)).flatMap(r=>BMH.roomFurnitureLayout(r).map((i,n)=>({id:'furniture-'+r.id+'-'+n,item_name:i.model,item_type:1,format:'gltf',model_url:'models/'+i.model+'.glb',xpos:(i.x+i.w/2)*100,zpos:(i.y+i.d/2)*100,ypos:i.base*100,rotation:-i.rotation*Math.PI/180,scale_x:200,scale_y:200,scale_z:200,fixed:true})));if(f===0)doc.items=[...doc.items.filter(i=>i.item_type!==1),...furniture];else doc.levels[f].items=[...doc.levels[f].items.filter(i=>i.item_type!==1),...furniture];}return doc;};
const workflowContext=BMH.aiContext;BMH.aiContext=options=>{const c=workflowContext(options);if(!options?.lightweight){c.architecture={levels:BMH.projectLevels(),parcel:BMH.parcelGeometry(),issues:BMH.plannerIssues(),circulation:Array.from({length:c.site.floors},(_,f)=>{const a=BMH.circulationAnalysis(f);return {floor:f,unreachable:a.unreachable.map(r=>r.name),narrow:a.narrow.map(r=>r.name),elderlyReady:a.elderlyReady};}),rooms:c.plan.rooms.map(r=>({id:r.id,name:r.name,furniture:BMH.roomFurnitureLayout(r),stairs:r.type==='stairs'?BMH.stairSpec(r):undefined}))};}return c;};
BMH.furnitureModelCache=new Map();
BMH.loadFurnitureModel=model=>{
 if(!BMH.furnitureLoaderPromise)BMH.furnitureLoaderPromise=Promise.all([import('./vendor/three/loaders/GLTFLoader.js'),import('./vendor/three/loaders/DRACOLoader.js')]).then(([g,d])=>{const decoder=new d.DRACOLoader().setDecoderPath('assets/architect3d/draco/').setDecoderConfig({type:'wasm'}).setWorkerLimit(2);return new g.GLTFLoader().setDRACOLoader(decoder);}).catch(e=>{BMH.furnitureLoaderPromise=null;throw e;});
 if(!BMH.furnitureModelCache.has(model))BMH.furnitureModelCache.set(model,BMH.furnitureLoaderPromise.then(loader=>loader.loadAsync('assets/architect3d/models/'+model+'.glb')).then(g=>g.scene).catch(e=>{BMH.furnitureModelCache.delete(model);throw e;}));
 return BMH.furnitureModelCache.get(model);
};
BMH.replaceSceneFurniture=(group,model,THREE,scene)=>{
 const task=BMH.loadFurnitureModel(model).then(source=>{
  if(BMH.studio3d?.scene!==scene)return false;
  const root=source.clone(true);root.traverse(o=>{if(!o.isMesh)return;o.geometry=o.geometry.clone();const copy=m=>{const next=m.clone();for(const k of ['map','normalMap','roughnessMap','metalnessMap','emissiveMap','aoMap'])if(next[k])next[k]=next[k].clone();return next;};o.material=Array.isArray(o.material)?o.material.map(copy):copy(o.material);o.castShadow=true;o.receiveShadow=true;});
  root.scale.setScalar(2);root.updateMatrixWorld(true);const box=new THREE.Box3().setFromObject(root),center=box.getCenter(new THREE.Vector3());root.position.set(-center.x,-box.min.y,-center.z);
  group.traverse(o=>o.geometry?.dispose());group.clear();group.add(root);group.userData.source='glb';BMH.studio3d.state.updateCamera();return true;
 }).catch(()=>false);
 scene.userData.furnitureLoads??=[];scene.userData.furnitureLoads.push(task);
};
BMH.addRoomSceneFurniture=(r,base,THREE,scene,mats,site)=>{
 const material=(color,roughness=.75)=>new THREE.MeshStandardMaterial({color,roughness});
 const wood=mats.accent,cloth=material(0xd4c8b8,.96),white=material(0xf4f1e9,.35),dark=mats.dark;
 for(const i of BMH.roomFurnitureLayout(r)){
  const d=BMH.FURNITURE_DIMENSIONS[i.model],g=new THREE.Group();g.position.set(i.x+i.w/2-site.width/2,base+i.base,i.y+i.d/2-site.depth/2);g.rotation.y=-i.rotation*Math.PI/180;
  const box=(w,h,depth,x,y,z,m=wood)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,depth),m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;};
  const legs=(top,w=d.w,depth=d.d)=>{for(const x of [-w/2+.08,w/2-.08])for(const z of [-depth/2+.08,depth/2-.08])box(.045,top,.045,x,top/2,z,dark);};
  if(/bedDouble|bedSingle/.test(i.model)){box(d.w,.22,d.d,0,.2,0);box(d.w,.13,d.d-.08,0,.38,0,white);box(d.w,.07,d.d*.65,0,.49,d.d*.15,cloth);box(d.w,d.h,.10,0,d.h/2,-d.d/2+.05);for(const x of [-d.w*.24,d.w*.24])box(d.w*.38,.1,.4,x,.49,-d.d*.32,white);}
  else if(/Sofa|loungeChair/.test(i.model)){legs(.18);box(d.w,.28,d.d-.1,0,.31,0,cloth);box(d.w,.48,.14,0,.56,d.d/2-.07,cloth);for(const x of [-d.w/2+.08,d.w/2-.08])box(.16,.5,d.d,x,.43,0,cloth);const n=d.w>1.5?3:1;for(let n0=0;n0<n;n0++)box((d.w-.35)/n-.03,.10,d.d*.68,-d.w/2+.18+(n0+.5)*(d.w-.35)/n,.49,-.04,white);}
  else if(/table|desk/i.test(i.model)){legs(d.h-.06);box(d.w,.06,d.d,0,d.h-.03,0);}
  else if(/chair/i.test(i.model)){legs(.43);box(d.w,.08,d.d,0,.47,0,cloth);box(d.w,d.h-.5,.07,0,(d.h+.5)/2,d.d/2-.035,cloth);}
  else if(/toilet/i.test(i.model)){const o=new THREE.Mesh(new THREE.SphereGeometry(d.w/2,24,16),white);o.scale.set(1,.6,d.d/d.w*.75);o.position.set(0,.4,0);g.add(o);box(d.w*.65,.28,d.d*.45,0,.14,0,white);box(d.w*.85,d.h*.75,.18,0,d.h*.4,-d.d*.38,white);}
  else if(/shower/i.test(i.model)){box(d.w,.08,d.d,0,.04,0,white);box(d.w,.02,.03,0,d.h,-d.d/2,mats.frame);box(.03,d.h,.03,-d.w/2,d.h/2,d.d/2,mats.frame);box(.025,d.h,d.d,d.w/2,d.h/2,0,mats.glass);box(d.w,d.h,.025,0,d.h/2,d.d/2,mats.glass);}
  else if(/television/i.test(i.model)){box(d.w,d.h,.05,0,d.h/2,0,dark);}
  else if(/pottedPlant/.test(i.model)){const pot=new THREE.Mesh(new THREE.CylinderGeometry(.15,.1,.32,18),white);pot.position.y=.16;g.add(pot);for(let n=0;n<5;n++){const leaf=new THREE.Mesh(new THREE.SphereGeometry(.16,12,8),mats.green);leaf.scale.set(.65,2,1);leaf.position.set(Math.sin(n)*.13,.6+n*.1,Math.cos(n)*.12);g.add(leaf);}}
  else {box(d.w,d.h,d.d,0,d.h/2,0,/bathroom|Sink/.test(i.model)?white:wood);if(/Fridge/.test(i.model)){box(d.w,.015,.015,0,d.h*.65,d.d/2+.015,dark);box(.04,.5,.04,d.w*.3,d.h*.4,d.d/2+.04,mats.frame);}else if(/Sink/.test(i.model)){box(d.w*.65,.025,d.d*.5,0,d.h+.012,0,dark);box(.035,.2,.035,d.w*.22,d.h+.1,-d.d*.2,mats.frame);}else if(/Stove/.test(i.model)){for(const x of [-d.w*.2,d.w*.2])for(const z of [-d.d*.2,d.d*.2])box(.16,.02,.16,x,d.h+.01,z,dark);}else if(/bookcase/.test(i.model)){for(let n=1;n<4;n++)box(d.w,.025,.03,0,d.h*n/4,d.d/2+.01,dark);}}
  g.userData={kind:'furniture',roomId:r.id,floor:r.floor,model:i.model,source:'procedural'};scene.add(g);BMH.replaceSceneFurniture(g,i.model,THREE,scene);
 }
 if(r.type==='stairs'){
  const s=BMH.stairSpec(r),g=new THREE.Group(),W=s.alongX?r.h:r.w,D=s.alongX?r.w:r.h;g.position.set(r.x+r.w/2-site.width/2,base,r.y+r.h/2-site.depth/2);g.rotation.y=-s.direction*Math.PI/180;
  for(let n=0;n<s.count;n++){const step=new THREE.Mesh(new THREE.BoxGeometry(Math.max(.6,W-.25),(n+1)*s.riser,s.tread),wood);step.position.set(0,(n+1)*s.riser/2,D/2-.15-(n+.5)*s.tread);step.castShadow=true;step.receiveShadow=true;g.add(step);}scene.add(g);
 }
 if(r.type==='garage'&&r.w>=2.3&&r.h>=4.7){const car=new THREE.Mesh(new THREE.BoxGeometry(1.85,.8,4.3),material(0x567a86,.32));car.position.set(r.x+r.w/2-site.width/2,base+.55,r.y+r.h/2-site.depth/2);scene.add(car);const cab=new THREE.Mesh(new THREE.BoxGeometry(1.65,.6,2),mats.glass);cab.position.copy(car.position);cab.position.y+=.6;scene.add(cab);}
};
BMH.lightPreviewAngle=BMH.lightPreviewAngle??35;BMH.lightPreviewZoom=BMH.lightPreviewZoom??1;
BMH.lightPreviewSvg=()=>{
 const p=BMH.state.project,l=BMH.projectLevels(),focus=BMH.state.ui.sceneFocus||'all',room=focus.startsWith('room:')?p.plan.rooms.find(r=>r.id===focus.slice(5)):null;
 const floors=room?[room.floor]:focus.startsWith('floor:')?[Number(focus.slice(6))]:Array.from({length:l.floors},(_,i)=>i),a=BMH.lightPreviewAngle*Math.PI/180,c=Math.cos(a),s=Math.sin(a),faces=[],labels=[];
 const project=(x,y,h)=>{x-=p.site.width/2;y-=p.site.depth/2;const rx=x*c-y*s,ry=x*s+y*c;return {x:rx,y:ry*.52-h*.85,z:ry+h*.02};};
 const face=(ps,color)=>{const q=ps.map(v=>project(...v));faces.push({z:q.reduce((sum,v)=>sum+v.z,0)/q.length,color,points:q.map(v=>v.x.toFixed(4)+','+v.y.toFixed(4)).join(' ')});};
 const block=(x,y,w,d,base,height,color)=>{face([[x,y,base+height],[x+w,y,base+height],[x+w,y+d,base+height],[x,y+d,base+height]],color);face([[x,y+d,base],[x+w,y+d,base],[x+w,y+d,base+height],[x,y+d,base+height]],color);face([[x+w,y,base],[x+w,y+d,base],[x+w,y+d,base+height],[x+w,y,base+height]],color);};
 for(const f of floors){const rooms=BMH.floorRooms(f).filter(r=>!room||r.id===room.id),base=f*l.floorHeight;
  for(const r of rooms){block(r.x,r.y,r.w,r.h,base,.12,'#ddd4c4');for(const i of BMH.roomFurnitureLayout(r))block(i.x,i.y,i.w,i.d,base+.12+i.base,i.h,/toilet|Sink|shower/.test(i.model)?'#f5f4ee':'#ab8d6d');if(r.type==='stairs'){for(const part of BMH.stairGeometry?.(r)||[])block(part.x,part.y,part.w,part.d,base+part.base,part.h,'#a18d74');}const pos=project(r.x+r.w/2,r.y+r.h/2,base+.25);labels.push('<text x="'+pos.x+'" y="'+pos.y+'" font-size=".22" text-anchor="middle">'+BMH.esc(r.name)+'</text>');}
  const geometry=BMH.scenePlanGeometry({rooms,openings:p.plan.openings.filter(o=>!room||o.roomId===room.id)},f);
  for(const w of geometry.walls){const length=w.b-w.a,x=w.horizontal?w.a:w.axis-.06,y=w.horizontal?w.axis-.06:w.a,width=w.horizontal?length:.12,depth=w.horizontal?.12:length;
   if(w.kind==='door')block(x,y,width,depth,base+w.height,Math.max(.02,l.clearHeight-w.height),'#e9e6df');
   else if(w.kind==='window'){block(x,y,width,depth,base,w.sill,'#e9e6df');block(x,y,width,depth,base+w.sill,w.height,'#afc8ce');block(x,y,width,depth,base+w.sill+w.height,Math.max(.02,l.clearHeight-w.sill-w.height),'#e9e6df');}
   else block(x,y,width,depth,base,Math.min(l.clearHeight,room?1.1:1.4),'#e9e6df');
  }
 }
 faces.sort((x,y)=>x.z-y.z);const points=faces.flatMap(f=>f.points.split(' ').map(p=>p.split(',').map(Number)));if(!points.length)return '<p>Tầng này chưa có phòng. Thêm phòng ở Tab 4.</p>';
 const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),x=Math.min(...xs)-1,y=Math.min(...ys)-1,w=Math.max(...xs)-x+1,h=Math.max(...ys)-y+1;
 return '<svg class="light-model-svg" viewBox="'+[x+w/2-w/(2*BMH.lightPreviewZoom),y+h/2-h/(2*BMH.lightPreviewZoom),w/BMH.lightPreviewZoom,h/BMH.lightPreviewZoom].join(' ')+'" role="img" aria-label="Mô hình không gian nhẹ từ bản vẽ"><rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="#f1eee7"/>'+faces.map(f=>'<polygon points="'+f.points+'" fill="'+f.color+'" stroke="#68766b" stroke-width=".015"/>').join('')+labels.join('')+'</svg>';
};
BMH.mountLightPreview=(reason='WebGL chưa khả dụng')=>{
 const stage=BMH.$('#studio3dStage');if(!stage)return;BMH.$('.light-model-preview')?.remove();stage.classList.add('three-failed');BMH.$('#studio3dLoading')?.remove();const canvas=BMH.$('#studio3dCanvas');if(canvas)canvas.style.display='none';
 const host=document.createElement('div');host.className='light-model-preview';host.innerHTML='<div class="light-model-controls"><b>Chế độ xem nhẹ</b><label>Chọn tầng / phòng<select data-scene-focus>'+[['all','Toàn nhà'],...Array.from({length:BMH.state.project.site.floors},(_,i)=>['floor:'+i,'Tầng '+(i+1)]),...BMH.state.project.plan.rooms.map(r=>['room:'+r.id,'T'+(r.floor+1)+' · '+r.name])].map(([v,n])=>'<option value="'+BMH.esc(v)+'" '+(BMH.state.ui.sceneFocus===v?'selected':'')+'>'+BMH.esc(n)+'</option>').join('')+'</select></label><button data-light-turn="-20">↶ Xoay</button><button data-light-turn="20">Xoay ↷</button><button data-light-zoom="0.8">Thu nhỏ</button><button data-light-zoom="1.25">Phóng to</button><span>'+BMH.esc(reason)+' · vẫn xem được bố trí. Phối cảnh đẹp dùng nút Gemini.</span></div><div data-light-model>'+BMH.lightPreviewSvg()+'</div>';stage.appendChild(host);
};
const workflowMount=BMH.mountStudio3D;BMH.mountStudio3D=async()=>{try{await workflowMount();}catch(e){BMH.mountLightPreview(e.message||'Không dựng được mô hình');return;}const stage=BMH.$('#studio3dStage');if(stage?.classList.contains('three-failed'))BMH.mountLightPreview('Không khởi tạo được WebGL trên trình duyệt này');};
document.addEventListener('click',e=>{const turn=e.target.closest?.('[data-light-turn]');if(turn){BMH.lightPreviewAngle=(BMH.lightPreviewAngle+Number(turn.dataset.lightTurn)+360)%360;const host=BMH.$('[data-light-model]');if(host)host.innerHTML=BMH.lightPreviewSvg();}});

// Store generated views outside localStorage so multiple room images survive reload.
BMH.renderCache=async(mode,key,value)=>{
 if(!window.indexedDB)return null;
 const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('bmh-room-renders',1);r.onupgradeneeded=()=>r.result.createObjectStore('views',{keyPath:'key'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
 try{return await new Promise((resolve,reject)=>{const tx=db.transaction('views',mode==='put'?'readwrite':'readonly'),s=tx.objectStore('views'),r=mode==='put'?s.put({key,image:value,at:Date.now()}):s.get(key);let result;r.onsuccess=()=>{result=r.result;if(mode==='put'){const all=s.getAll();all.onsuccess=()=>all.result.sort((a,b)=>b.at-a.at).slice(24).forEach(row=>s.delete(row.key));}};tx.oncomplete=()=>resolve(result?.image||null);tx.onerror=()=>reject(tx.error);});}finally{db.close();}
};
BMH.restoringRenderKeys=new Set();
BMH.restoreRoomRender=signature=>{
 if(BMH.cinematicRender.views[signature]||BMH.restoringRenderKeys.has(signature))return;
 BMH.restoringRenderKeys.add(signature);queueMicrotask(()=>BMH.renderCache('get',signature).then(image=>{if(image){BMH.cinematicRender.views[signature]=image;if(BMH.state.ui.step===6)BMH.render({preserveScroll:true});}}).catch(()=>{}));
};
BMH.roomGalleryHtml=()=>{
 BMH.restoreRoomRender(BMH.cinematicSignature());
 const batch=BMH.roomRenderBatch||{},rooms=BMH.state.project.plan.rooms;
 return '<section class="v6-card room-render-gallery"><h3>Từng phòng trong phương án</h3><p>Chọn phòng để xem bố trí đúng kích thước. Phối cảnh Gemini là hình minh họa từ mặt bằng; mỗi phòng dùng một lượt tạo ảnh.</p><div class="room-render-actions"><button data-room-review>✦ Gemini phân tích bản vẽ & tất cả phòng</button><button data-render-all '+(batch.running||BMH.cinematicRender.loading?'disabled':'')+'>'+ (batch.running?'Đang tạo '+batch.done+'/'+batch.total+' phòng…':'Tạo phối cảnh Gemini cho tất cả phòng')+'</button>'+(batch.running?'<button data-render-stop>Dừng sau phòng hiện tại</button>':'')+'</div><div class="room-render-grid">'+rooms.map(r=>{const key=BMH.cinematicSignature('room:'+r.id);BMH.restoreRoomRender(key);const image=BMH.cinematicRender.views[key];return '<button data-scene-focus-btn="room:'+BMH.esc(r.id)+'">'+(image?'<img src="'+BMH.esc(image)+'" alt="Phối cảnh Gemini · '+BMH.esc(r.name)+'" loading="lazy">':'')+'<b>T'+(r.floor+1)+' · '+BMH.esc(r.name)+'</b><span>'+r.w.toFixed(2)+' × '+r.h.toFixed(2)+' m · '+BMH.roomFurnitureLayout(r).length+' món nội thất</span><small>'+ (image?'Đã lưu phối cảnh · chọn để xem':r.type==='corridor'?'Lối lưu thông để trống':r.type==='stairs'?'Ô thang · hướng '+BMH.stairSpec(r).direction+'°':'Xem bố trí / tạo ảnh phòng này')+'</small></button>';}).join('')+'</div></section>';
};
const workflowScreen7=BMH.screen7;BMH.screen7=()=>workflowScreen7()+BMH.roomGalleryHtml();BMH.SCREENS[5]=BMH.screen7;
const workflowGenerateRender=BMH.generateCinematicRender;
BMH.generateCinematicRender=async()=>{if(BMH.cinematicRender.loading)return;const key=BMH.cinematicSignature();await workflowGenerateRender();const image=BMH.cinematicRender.views[key];if(image)await BMH.renderCache('put',key,image).catch(()=>BMH.toast('Đã tạo ảnh nhưng bộ nhớ trình duyệt chưa lưu được.'));};
BMH.generateAllRoomRenders=async()=>{
 if(BMH.roomRenderBatch?.running||BMH.cinematicRender.loading)return;
 const original=BMH.state.ui.sceneFocus,batch=BMH.roomRenderBatch={running:true,stop:false,done:0,total:BMH.state.project.plan.rooms.length},rooms=[...BMH.state.project.plan.rooms];
 try{for(const room of rooms){if(batch.stop)break;BMH.state.ui.sceneFocus='room:'+room.id;BMH.render({preserveScroll:true});const key=BMH.cinematicSignature(),cached=BMH.cinematicRender.views[key]||await BMH.renderCache('get',key).catch(()=>null);if(cached)BMH.cinematicRender.views[key]=cached;else await BMH.generateCinematicRender();if(BMH.cinematicRender.error||!BMH.cinematicRender.views[key])break;batch.done++;}}finally{batch.running=false;BMH.state.ui.sceneFocus=original;BMH.render({preserveScroll:true});BMH.toast('Đã tạo '+batch.done+'/'+batch.total+' phòng. '+(BMH.cinematicRender.error?'Dừng do lỗi Gemini; có thể tạo riêng từng phòng.':''));}
};
document.addEventListener('click',e=>{if(e.target.closest?.('[data-room-review]'))BMH.aiRun('review','Phân tích toàn bộ phòng và từng tầng trong architecture: vị trí cửa/cửa sổ, hướng phòng và thang, kích thước hành lang, đồ đạc, ánh sáng, thông gió, nhu cầu từng thành viên và phong thủy tham khảo. Nêu phòng nào cần sửa, lý do và thông số đang thiếu.');if(e.target.closest?.('[data-render-all]'))BMH.generateAllRoomRenders();if(e.target.closest?.('[data-render-stop]')&&BMH.roomRenderBatch)BMH.roomRenderBatch.stop=true;});
document.addEventListener('change',e=>{if(e.target.matches?.('[data-opening-form] select[name="kind"]')){const f=e.target.form;f.elements.height.value=e.target.value==='window'?1.4:2.1;f.elements.sill.value=e.target.value==='window'?.9:0;}});

document.addEventListener('click',e=>{const z=e.target.closest?.('[data-light-zoom]');if(z){BMH.lightPreviewZoom=BMH.clamp(BMH.lightPreviewZoom*Number(z.dataset.lightZoom),.5,3);const host=BMH.$('[data-light-model]');if(host)host.innerHTML=BMH.lightPreviewSvg();}});

BMH.materialImageSrc=url=>{try{const u=new URL(url);return ['dongtam.com.vn','jotun.com','eurowindow.biz','inax.com.vn','rangdong.com.vn'].some(d=>u.hostname===d||u.hostname.endsWith('.'+d))?'/api/material-image?url='+encodeURIComponent(url):url;}catch{return url;}};
