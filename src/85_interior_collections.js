/* Measured, editable interior collections. Original BMH parametric designs; no product SKU claims. */
BMH.INTERIOR_COLLECTIONS=[
 {id:'warm-oak',name:'Gỗ ấm · Japandi',note:'Sofa vải thô, bàn oval chân nan, gỗ sồi sáng.',shape:'soft',table:'oak',wall:'#f4eee4',floor:'#c7aa80',accent:'#a47e51',fabric:'#e4dbca',pillow:'#8b947c',rug:'#e1dacb',surface:'wood'},
 {id:'urban-stone',name:'Đá & đường nét',note:'Sofa thấp, bàn đá chân thép, tông xám dịu.',shape:'linear',table:'stone',wall:'#ecebe5',floor:'#c5c2b9',accent:'#645647',fabric:'#aaaead',pillow:'#626f72',rug:'#d2d2cb',surface:'stone'},
 {id:'soft-curves',name:'Đường cong mềm',note:'Sofa bo tròn, bàn đôi tròn, sắc kem và đất nung.',shape:'curved',table:'nested',wall:'#f3e9df',floor:'#cab393',accent:'#b08567',fabric:'#e8dfd0',pillow:'#b77c61',rug:'#ddd3c1',surface:'wood'},
 {id:'indochine',name:'Đông Dương',note:'Khung gỗ tối, mây đan, vải kem và xanh lá.',shape:'timber',table:'rattan',wall:'#eee4cd',floor:'#b39974',accent:'#4b382b',fabric:'#e0d9c7',pillow:'#4e6c5b',rug:'#c5b795',surface:'wood'},
 {id:'coastal',name:'Nhẹ nhàng ven biển',note:'Vải linen, gỗ tẩy sáng, đệm xanh biển nhạt.',shape:'linen',table:'oak',wall:'#f1f2e8',floor:'#d3c2a2',accent:'#b6a17e',fabric:'#e5e4d8',pillow:'#91acb1',rug:'#dce0d4',surface:'wood'},
 {id:'olive-gallery',name:'Xanh trầm & đồng',note:'Sofa xanh olive, bàn travertine và kim loại ấm.',shape:'channel',table:'stone',wall:'#eae5d9',floor:'#c2b99e',accent:'#816349',fabric:'#6f7962',pillow:'#c6ad7c',rug:'#ddd5c1',surface:'stone'},
 {id:'nordic-light',name:'Bắc Âu sáng',note:'Gỗ sồi sáng, sofa linen, tường trắng và terrazzo kem.',shape:'linen',table:'oak',wall:'#f2f0e8',floor:'#e7e0cd',accent:'#ae8658',fabric:'#d9cfbb',pillow:'#7e9294',rug:'#ece6d7',surface:'stone'},
 {id:'mid-century',name:'Mid-century ấm',note:'Sofa chân gỗ thanh, da cognac, bàn tròn chân trụ và óc chó.',shape:'midcentury',table:'pedestal',wall:'#e8dfcc',floor:'#795038',accent:'#65432e',fabric:'#a66738',pillow:'#ba9954',rug:'#c7bba2',surface:'wood'},
 {id:'loft-leather',name:'Loft & da cognac',note:'Bê tông xám, sofa da, bàn kính và kim loại đen.',shape:'linear',table:'glass',wall:'#c7c6be',floor:'#a9aaa4',accent:'#65432e',fabric:'#a66738',pillow:'#676c62',rug:'#bab6a9',surface:'stone'},
 {id:'neo-elegance',name:'Tân cổ điển thanh lịch',note:'Sofa lưng đệm nút, nhung olive, marble trắng và gỗ trầm.',shape:'tufted',table:'stone',wall:'#f1ebde',floor:'#f0ede6',accent:'#65432e',fabric:'#6f7962',pillow:'#c2ad7a',rug:'#dbd0bb',surface:'stone'}
];
const collectionSurfaces={
 'warm-oak':['oak-floor','natural-oak','natural-linen'], 'urban-stone':['grey-concrete','dark-walnut','natural-linen'],
 'soft-curves':['oak-floor','natural-oak','cream-boucle'], 'indochine':['walnut-floor','dark-walnut','natural-linen'],
 'coastal':['oak-floor','natural-oak','natural-linen'], 'olive-gallery':['sand-travertine','dark-walnut','olive-velvet'],
 'nordic-light':['ivory-terrazzo','natural-oak','natural-linen'], 'mid-century':['walnut-floor','dark-walnut','cognac-leather'],
 'loft-leather':['grey-concrete','dark-walnut','cognac-leather'], 'neo-elegance':['white-marble','dark-walnut','olive-velvet']
};
for(const c of BMH.INTERIOR_COLLECTIONS){const [floor,accent,fabric]=collectionSurfaces[c.id];c.visualMaterials={floor,accent,fabric,wall:c.id==='loft-leather'?'grey-paint':'ivory-paint'};}
BMH.interiorCollection=roomId=>{
 const f=BMH.state.project.materials?.finish||{},stored=roomId?f.interior?.rooms?.[roomId]||f.interior?.default:f.interior?.default;
 const byStyle=/Đông Dương|Indochine/i.test(BMH.state.project.style||'')?'indochine':/cổ điển|classic/i.test(BMH.state.project.style||'')?'neo-elegance':/Bắc Âu|Scandinavian/i.test(BMH.state.project.style||'')?'nordic-light':/Đương đại/i.test(BMH.state.project.style||'')?'urban-stone':/Art Deco/i.test(BMH.state.project.style||'')?'olive-gallery':/Nhiệt đới/i.test(BMH.state.project.style||'')?'coastal':'warm-oak';
 return BMH.INTERIOR_COLLECTIONS.find(c=>c.id===stored)||BMH.INTERIOR_COLLECTIONS.find(c=>c.id===byStyle);
};
const collectionFinish=BMH.finishPalette;
BMH.finishPalette=roomId=>{const original=collectionFinish?.(roomId);if(!roomId)return original;const collection=BMH.interiorCollection(roomId),visualMaterials={...(original?.visualMaterials||collection.visualMaterials)};if(!original?.visualMaterials&&['wood','tile','stone','auto'].includes(original?.surface))visualMaterials.floor={wood:'oak-floor',tile:'ivory-tile',stone:'sand-travertine'}[original.surface];return {...collection,...original,visualMaterials,collectionId:collection.id,shape:collection.shape,table:collection.table,pillow:original?.pillow||collection.pillow,rug:original?.rug||collection.rug};};
BMH.applyInteriorCollection=(id,roomId=null)=>{
 const c=BMH.INTERIOR_COLLECTIONS.find(c=>c.id===id),p=BMH.state.project;if(!c||roomId&&!p.plan.rooms.some(r=>r.id===roomId))return false;
 BMH.rememberFinishCamera?.();
 const f=p.materials.finish||=( {exterior:null,rooms:{}} );f.rooms||={};f.interior||={default:'',rooms:{}};f.interior.rooms||={};
 const target=roomId?p.plan.rooms.filter(r=>r.id===roomId):p.plan.rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type));
 for(const r of target){f.interior.rooms[r.id]=id;f.rooms[r.id]={...f.rooms[r.id],wall:c.wall,floor:c.floor,accent:c.accent,fabric:c.fabric,pillow:c.pillow,rug:c.rug,surface:r.type==='bath'?'stone':c.surface,visualMaterials:{...c.visualMaterials,...(r.type==='bath'?{floor:'sand-travertine'}:{})}};}
 if(!roomId){f.interior.default=id;f.exterior={...f.exterior,wall:c.wall,floor:c.floor,accent:c.accent,fabric:c.fabric,pillow:c.pillow,rug:c.rug,surface:c.surface,visualMaterials:{...c.visualMaterials}};}
 BMH.finishInvalidate?.();BMH.save();return true;
};
BMH.interiorCollectionsHtml=()=>{
 const focus=BMH.state.ui.sceneFocus||'',room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===focus),current=BMH.interiorCollection(room?.id),esc=BMH.esc;
 return '<section class="interior-collections"><div class="interior-collections-heading"><div><span>BỘ SƯU TẬP NỘI THẤT</span><h2>Chọn một cách sống trong nhà.</h2><p>Áp dụng cho '+esc(room?room.name:'các phòng trong nhà')+'. Đồ, vải, gỗ và đá đổi cùng nhau; bạn chỉnh tiếp được.</p></div><small>Ảnh phòng mẫu từ 3D BMH · mô hình tham khảo, không phải mã sản phẩm bán sẵn.</small></div><div class="interior-collection-grid">'+BMH.INTERIOR_COLLECTIONS.map(c=>'<button type="button" data-interior-collection="'+c.id+'" aria-pressed="'+(c.id===current.id)+'" class="interior-collection-card"><img src="assets/interior/collections/'+c.id+'.jpg" alt="Phòng mẫu 3D · '+esc(c.name)+'" loading="lazy" decoding="async"><span class="interior-collection-palette" aria-hidden="true">'+[c.wall,c.floor,c.fabric,c.pillow].map(color=>'<i style="background:'+color+'"></i>').join('')+'</span><b>'+esc(c.name)+'</b><span>'+esc(c.note)+'</span><em>'+(c.id===current.id?'Đang xem · chọn lại':'Áp dụng & xem 3D →')+'</em></button>').join('')+'</div></section>';
};
const collectionScreen=BMH.screen7;BMH.screen7=()=>collectionScreen().replace('<section class="design-room-list">',BMH.interiorCollectionsHtml()+'<section class="design-room-list">');BMH.SCREENS[5]=BMH.screen7;
document.addEventListener('click',event=>{const button=event.target.closest?.('[data-interior-collection]');if(!button)return;const room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===BMH.state.ui.sceneFocus);if(BMH.applyInteriorCollection(button.dataset.interiorCollection,room?.id)){BMH.state.ui.renderMode='interactive';BMH.render({preserveScroll:true});BMH.toast('Đã phối nội thất '+(room?room.name:'các phòng trong nhà')+'.');}});

BMH.collectionArtTexture=(THREE,c)=>{
 if(typeof document.createElement!=='function')return null;
 const canvas=document.createElement('canvas');canvas.width=384;canvas.height=512;const ctx=canvas.getContext('2d');if(!ctx?.fillRect)return null;
 ctx.fillStyle=c.wall;ctx.fillRect(0,0,384,512);
 ctx.fillStyle=c.pillow;ctx.beginPath();ctx.arc(220,186,103,Math.PI,0);ctx.lineTo(323,417);ctx.lineTo(117,417);ctx.closePath();ctx.fill();
 ctx.fillStyle=c.accent;ctx.beginPath();ctx.ellipse(110,339,85,134,-.15,0,Math.PI*2);ctx.fill();
 ctx.strokeStyle=c.floor;ctx.lineWidth=6;for(let n=0;n<5;n++){ctx.beginPath();ctx.arc(239,160,36+n*12,Math.PI,Math.PI*2);ctx.lineTo(275+n*12,272);ctx.stroke();}
 ctx.fillStyle=c.fabric;ctx.beginPath();ctx.arc(116,182,39,0,Math.PI*2);ctx.fill();
 const map=new THREE.CanvasTexture(canvas);map.colorSpace=THREE.SRGBColorSpace;map.userData={generic:true,kind:'collection-art'};return map;
};
const collectionDecorate=BMH.decorateStudioScene;
BMH.decorateStudioScene=options=>{
 collectionDecorate(options);
 const {THREE,scene,visibleFloors,roomFocus,floorFocus,W,D,fh,explode,focus}=options,levels=BMH.projectLevels();
 for(const f of visibleFloors)for(const r of BMH.floorRooms(f).filter(r=>!roomFocus||r.id===roomFocus.id)){
  if(!['living','bed'].includes(r.type))continue;
  const base=roomFocus||floorFocus!==null?0:f*(fh+explode),finish=BMH.finishPalette(r.id),c=BMH.interiorCollection(r.id),materials=BMH.sceneAssetMaterials(THREE,scene,finish),items=BMH.roomFurnitureLayout(r);
  const table=items.find(i=>i.model==='tableCoffee'),bed=items.find(i=>/^bed/.test(i.model));
  // Place the rug under the actual seating/bed group rather than in an empty room centre.
  for(const old of [...scene.children])if(old.userData.kind==='finish-detail'&&old.userData.roomId===r.id&&old.geometry?.parameters?.height===.012){scene.remove(old);old.geometry.dispose();}
  const anchor=table||bed;if(anchor){
   const rotated=anchor.rotation%180===90,w=Math.min(r.w-.3,rotated?2.10:2.65),d=Math.min(r.h-.3,rotated?2.65:2.10),x=Math.max(r.x+.15+w/2,Math.min(r.x+r.w-.15-w/2,anchor.x+anchor.w/2)),z=Math.max(r.y+.15+d/2,Math.min(r.y+r.h-.15-d/2,anchor.y+anchor.d/2));
   const geometry=THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(w,.014,d,2,.006):new THREE.BoxGeometry(w,.014,d);BMH.sceneSurfaceUvs(geometry,materials.rug);const rug=new THREE.Mesh(geometry,materials.rug);rug.position.set(x-W/2,base+levels.slab+.011,z-D/2);rug.receiveShadow=true;rug.userData={kind:'interior-rug',roomId:r.id,generic:true};scene.add(rug);
   for(const edge of [-1,1])for(let i=0;i<Math.min(60,Math.floor(w/.055));i++){const fringe=new THREE.Mesh(new THREE.BoxGeometry(.008,.003,.035),materials.rug);fringe.position.set(x-w/2+.03+i*.055-W/2,base+levels.slab+.006,z+edge*(d/2+.012)-D/2);fringe.userData={kind:'interior-rug',roomId:r.id,generic:true};scene.add(fringe);}
  }
  const walls=BMH.scenePlanGeometry({rooms:[r],openings:BMH.state.project.plan.openings,wallContext:BMH.state.project.plan.rooms},f).walls;
  const view=BMH.roomInteriorCamera(r,items),score=w=>{const x=w.horizontal?(w.a+w.b)/2:w.axis,z=w.horizontal?w.axis:(w.a+w.b)/2,dx=x-(view?.camera.x||r.x+r.w/2),dz=z-(view?.camera.y||r.y+r.h),tx=(view?.target.x||r.x+r.w/2)-(view?.camera.x||r.x+r.w/2),tz=(view?.target.y||r.y)-(view?.camera.y||r.y+r.h);return (dx*tx+dz*tz)/(Math.hypot(dx,dz)*Math.hypot(tx,tz)||1)*5+Math.min(w.b-w.a,2);};
  const candidates=walls.filter(w=>w.kind==='wall'&&w.b-w.a>.95).sort((a,b)=>score(b)-score(a));
  const wall=candidates[0];if(wall){
   const width=Math.min(1.05,wall.b-wall.a-.25),height=1.35,side=wall.horizontal?(Math.abs(wall.axis-r.y)<.01?'north':'south'):(Math.abs(wall.axis-r.x)<.01?'west':'east'),inward={north:1,south:-1,west:1,east:-1}[side],middle=(wall.a+wall.b)/2;
   const group=new THREE.Group();group.position.set((wall.horizontal?middle:wall.axis+inward*.13)-W/2,base+levels.slab+1.75,(wall.horizontal?wall.axis+inward*.13:middle)-D/2);group.rotation.y={north:0,south:Math.PI,west:Math.PI/2,east:-Math.PI/2}[side];
   const frameMaterial=materials.wood.clone(),paper=materials.white.clone(),inspection=floorFocus!==null||roomFocus&&BMH.state.ui.roomCamera!=='inside'&&['north','east'].includes(side);if(inspection){const planes=[new THREE.Plane(new THREE.Vector3(0,-1,0),base+(roomFocus?.85:1.05))];frameMaterial.clippingPlanes=planes;paper.clippingPlanes=planes;}
   const frame=new THREE.Mesh(new THREE.BoxGeometry(width+.065,height+.065,.035),frameMaterial);paper.map=BMH.collectionArtTexture(THREE,c);paper.roughness=.94;
   const picture=new THREE.Mesh(new THREE.PlaneGeometry(width,height),paper);picture.position.z=.021;frame.castShadow=true;group.add(frame,picture);group.userData={kind:'interior-art',roomId:r.id,generic:true,side};scene.add(group);
  }
 }
};
