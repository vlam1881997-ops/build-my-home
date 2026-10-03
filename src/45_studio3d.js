/* V5.0.3 Studio 3D — accurate browser scene + optional Gemini cinematic render */
BMH.threePromise=null;
BMH.studio3d=null;
BMH.cinematicRender=BMH.cinematicRender||{loading:false,dataUrl:'',error:'',generatedAt:'',views:{}};
BMH.ensureThree = () => {
  if(window.THREE)return Promise.resolve(window.THREE);
  if(BMH.threePromise)return BMH.threePromise;
  // The light model is already interactive while this downloads. Keep waiting
  // so a slow connection can still upgrade to WebGL when the module arrives.
  BMH.threePromise=import('./vendor/three/three.module.js').then(async m=>{
    if(m?.Scene&&m?.WebGLRenderer){const extras=await Promise.allSettled([import('./vendor/three/geometries/RoundedBoxGeometry.js'),import('./vendor/three/environments/RoomEnvironment.js')]);return {...m,...(extras[0].status==='fulfilled'?extras[0].value:{}),...(extras[1].status==='fulfilled'?extras[1].value:{})};}
    BMH.threePromise=null;return null;
  }).catch(()=>{BMH.threePromise=null;return null;});
  return BMH.threePromise;
};
BMH.scenePalette = () => {
  const m=BMH.state.project.materials||{},c=m.choices||{},tier=m.tier||'standard';
  const floor={viglacera:0xd6c6ae,dongtam:0xc8b295,vietceramics:0xd8d5cd}[c.floor]||0xd4c5ac;
  const wall={dulux:0xf2eee5,jotun:0xe8e2d7}[c.paint]||0xf2eee5;
  const frame=c.door==='premium-door'?0x292d2c:0x3f4543;
  const styleAccent=BMH.houseStyle?.()?.accent;
  const accent=styleAccent?parseInt(styleAccent.slice(1),16):tier==='premium'?0x7a604d:tier==='economy'?0x9a8a73:0x806a57;
  const focus=BMH.state.ui.sceneFocus||'all',finish=BMH.finishPalette?.(focus.startsWith('room:')?focus.slice(5):null);
  const color=(role,original)=>/^#[0-9a-f]{6}$/i.test(finish?.[role]||'')?parseInt(finish[role].slice(1),16):original;
  return {floor:color('floor',floor),wall:color('wall',wall),frame,accent:color('accent',accent),glass:0xa9c8cf,green:0x6f8666,ground:0xd9d1c3};
};
// The plan and its openings are the only geometry source. Shared room edges are
// merged before cutting openings so a neighbouring wall cannot cover a door.
BMH.scenePlanGeometry = (plan, floor) => {
  const rooms=(plan.rooms||[]).filter(r=>Number(r.floor)===floor&&[r.x,r.y,r.w,r.h].every(Number.isFinite)&&r.w>.2&&r.h>.2);
  const edges=new Map(),round=n=>Math.round(n*1000)/1000;
  for(const r of rooms)for(const side of ['north','east','south','west']){
    const horizontal=side==='north'||side==='south';
    const axis=round(horizontal?(side==='north'?r.y:r.y+r.h):(side==='west'?r.x:r.x+r.w));
    const start=round(horizontal?r.x:r.y),end=round(start+(horizontal?r.w:r.h));
    const key=(horizontal?'h':'v')+':'+axis;
    if(!edges.has(key))edges.set(key,{horizontal,axis,ranges:[],openings:[]});
    const edge=edges.get(key);edge.ranges.push([start,end]);
  }
  for(const o of plan.openings||[]){
   const r=(plan.wallContext||rooms).find(r=>r.id===o.roomId);if(!r||Number(o.floor)!==floor||!['door','window'].includes(o.kind)||!['north','south','east','west'].includes(o.side))continue;
   const horizontal=['north','south'].includes(o.side),axis=round(horizontal?(o.side==='north'?r.y:r.y+r.h):(o.side==='west'?r.x:r.x+r.w)),edge=edges.get((horizontal?'h':'v')+':'+axis);if(!edge)continue;
   const span=horizontal?r.w:r.h,width=Math.min(span,Math.max(.45,Number(o.width)||.9)),start=horizontal?r.x:r.y,offset=Number(o.offset),a=round(start+(span-width)*Math.min(1,Math.max(0,Number.isFinite(offset)?offset:.5))),b=round(a+width);
   if(!edge.ranges.some(([s,e])=>a<e&&b>s))continue;
   edge.openings.push({a,b,openingId:o.id,roomId:o.roomId,side:o.side,hinge:o.hinge,swing:o.swing,kind:o.kind,height:Number(o.height)||(o.kind==='window'?1.4:2.1),sill:o.kind==='window'?(Number.isFinite(Number(o.sill))?Number(o.sill):.9):0});

  }
  const walls=[];
  for(const edge of edges.values()){
    const points=[...new Set([...edge.ranges.flat(),...edge.openings.flatMap(o=>[o.a,o.b])])].sort((a,b)=>a-b);
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],mid=(a+b)/2;
      if(b-a<.015||!edge.ranges.some(([s,e])=>s<=mid&&e>=mid))continue;
      const opening=edge.openings.find(o=>o.a<=mid&&o.b>=mid);
      const adjacent=(plan.wallContext||rooms).filter(r=>Number(r.floor)===floor&&(edge.horizontal?((Math.abs(r.y-edge.axis)<.001||Math.abs(r.y+r.h-edge.axis)<.001)&&mid>r.x-.001&&mid<r.x+r.w+.001):((Math.abs(r.x-edge.axis)<.001||Math.abs(r.x+r.w-edge.axis)<.001)&&mid>r.y-.001&&mid<r.y+r.h+.001)));
      const count=adjacent.length;
      walls.push({roomIds:adjacent.map(r=>r.id),thickness:BMH.measuredWallThickness?.(count>1)??(count>1?.12:.22),horizontal:edge.horizontal,axis:edge.axis,a,b,kind:opening?.kind||'wall',openingId:opening?.openingId,openingRoomId:opening?.roomId,height:opening?.height,sill:opening?.sill});
    }
  }
  return {rooms,walls};
};
BMH.studio3DHtml = () => {
  const ui=BMH.state.ui,p=BMH.state.project,e=BMH.estimate(),review=BMH.designReview();
  const roomOptions=p.plan.rooms.map(r=>`<option value="room:${r.id}" ${ui.sceneFocus===`room:${r.id}`?'selected':''}>T${r.floor+1} · ${BMH.esc(r.name)}</option>`).join('');
  const currentRender=BMH.cinematicRender.views?.[BMH.cinematicSignature()]||'';
  const hero=currentRender||'assets/rooms/facade-render.jpg';
  return `<section class="cinematic-primary-studio">
    <div class="cinematic-primary-visual">
      <img src="${hero}" alt="Phối cảnh ngôi nhà theo phương án hiện tại">
      <div class="cinematic-primary-shade"></div>
      <div class="cinematic-primary-copy"><span>PHỐI CẢNH TRẢI NGHIỆM</span><h2>Hình dung ngôi nhà trước khi bước vào chi tiết kỹ thuật.</h2><p>${currentRender?'Phối cảnh AI được tạo từ góc nhìn hiện tại.':'Phối cảnh tham khảo được dùng làm lớp cảm xúc; mô hình kỹ thuật nằm phía dưới.'}</p></div>
      <div class="cinematic-primary-tabs"><button class="active" data-scene-focus-btn="all">Ngoại thất</button>${Array.from({length:p.site.floors},(_,i)=>`<button data-scene-focus-btn="floor:${i}">Tầng ${i+1}</button>`).join('')}<select data-scene-focus><option value="all">Xem từng phòng…</option>${roomOptions}</select></div>
      <div class="cinematic-primary-actions"><button class="studio-secondary" data-scene-theme>${ui.sceneTheme==='day'?'☀ Ban ngày':'☾ Ban đêm'}</button><button class="studio-primary" data-cinematic-render ${BMH.cinematicRender.loading?'disabled':''}>${BMH.cinematicRender.loading?'Đang tạo phối cảnh…':'✦ Tạo phối cảnh điện ảnh'}</button></div>
    </div>
    <aside class="cinematic-primary-insight">
      <div class="cinematic-score-card"><small>ĐÁNH GIÁ TỔNG THỂ</small><strong>${review.overall}<em>/100</em></strong><p>${review.overall>=82?'Phương án đang cân bằng tốt giữa công năng, khí hậu và ngân sách.':'Còn một số điểm đáng tối ưu trước khi chốt phương án.'}</p></div>
      <div class="cinematic-insight-list"><article><i>⌖</i><div><b>Vị trí & quy hoạch</b><span>${review.site||review.overall}/100 · Site Fit đang được theo dõi</span></div></article><article><i>☀</i><div><b>Ánh sáng & vi khí hậu</b><span>${review.daylight}/100 · ${review.daylight>=75?'Khá tốt':'Nên tăng ô mở/giếng trời'}</span></div></article><article><i>≋</i><div><b>Thông gió</b><span>${review.ventilation}/100 · ${review.ventilation>=75?'Luồng gió ổn':'Nên tạo thông gió chéo'}</span></div></article><article><i>₫</i><div><b>Ngân sách</b><span>${review.budget}/100 · ${e.gap>=0?`còn ${BMH.money(e.gap)} dự phòng`:`vượt ${BMH.money(Math.abs(e.gap))}`}</span></div></article><article><i>♡</i><div><b>Thoải mái gia đình</b><span>${review.comfort}/100 · ưu tiên nhu cầu sống thực tế</span></div></article></div>
      ${BMH.cinematicRender.error?`<div class="studio-ai-error">${BMH.esc(BMH.cinematicRender.error)}</div>`:''}
      <div class="cinematic-project-kpis"><span><small>Diện tích</small><b>${BMH.num(BMH.planArea())}m²</b></span><span><small>Số tầng</small><b>${p.site.floors}</b></span><span><small>Dự toán</small><b>${BMH.money(e.total)}</b></span></div>
    </aside>
  </section>
  <details class="technical-3d-panel" open>
    <summary><span><b>◎ Mở mô hình 3D kỹ thuật tương tác</b><small> Xoay, zoom, tách tầng, xem từng phòng và đối chiếu hình học.</small></span><em>Chi tiết kỹ thuật ↓</em></summary>
    <section class="studio-3d-shell technical-mode">
      <div class="studio-3d-stage" id="studio3dStage">
        <div class="studio-3d-loading" id="studio3dLoading"><i>⌂</i><b>Đang dựng mô hình từ mặt bằng thật…</b><span>Nếu WebGL/CDN bị chặn, hệ thống vẫn giữ phối cảnh dự phòng ở phía trên.</span></div>
        <canvas id="studio3dCanvas" aria-label="Mô hình 3D ngôi nhà"></canvas>
        <div class="studio-3d-fallback"><img src="assets/rooms/facade-render.jpg" alt="Phối cảnh tham khảo"><span>Ảnh tham khảo dự phòng · chưa dùng để đo kích thước</span></div>
        <div class="studio-3d-topbar"><div class="studio-view-tabs"><button class="${ui.sceneFocus==='all'?'active':''}" data-scene-focus-btn="all">Toàn nhà</button>${Array.from({length:p.site.floors},(_,i)=>`<button class="${ui.sceneFocus===`floor:${i}`?'active':''}" data-scene-focus-btn="floor:${i}">Tầng ${i+1}</button>`).join('')}<select data-scene-focus><option value="all">Chọn phòng…</option>${roomOptions}</select></div><div class="studio-view-actions"><button data-scene-theme>${ui.sceneTheme==='day'?'☀ Ban ngày':'☾ Ban đêm'}</button><button data-scene-explode class="${ui.sceneExploded?'active':''}">${ui.sceneExploded?'Ghép tầng':'Tách tầng'}</button><button data-studio3d-reset>⌂ Góc đẹp</button></div></div>
        <div class="studio-3d-hud"><span><small>Tổng dự toán</small><b>${BMH.money(e.total)}</b></span><span><small>Diện tích</small><b>${BMH.num(BMH.planArea())} m²</b></span><span><small>Tiện nghi</small><b>${review.function}/100</b></span></div>
        <div class="studio-3d-tip">Kéo chuột để xoay · Shift + kéo để di chuyển · lăn chuột để zoom · chọn từng phòng để bước vào không gian</div>
      </div>
    </section>
  </details>`;
};
BMH.sceneRoofSpec=(explode=0)=>{
 const p=BMH.state.project,levels=BMH.projectLevels(),bounds=BMH.sceneFootprintBounds(BMH.floorRooms(levels.floors-1));
 if(!bounds?.rectangular||!['gable','wide','arch','classic'].includes(BMH.houseStyle?.()?.form))return null;
 const width=bounds.width+.4,depth=bounds.depth+.4,cx=bounds.cx,cz=bounds.cy,eave=(levels.floors-1)*(levels.floorHeight+explode)+levels.floorHeight+levels.slab+.18,rise=Math.min(2.7,Math.max(.7,Math.min(width,depth)*.31)),hw=width/2,hd=depth/2;
 const c=[[cx-hw,eave,cz-hd],[cx+hw,eave,cz-hd],[cx+hw,eave,cz+hd],[cx-hw,eave,cz+hd]],r=depth>=width?[[cx,eave+rise,cz-(depth-width)/2],[cx,eave+rise,cz+(depth-width)/2]]:[[cx-(width-depth)/2,eave+rise,cz],[cx+(width-depth)/2,eave+rise,cz]];
 const faces=depth>=width?[[c[0],c[1],r[0]],[c[0],r[0],r[1],c[3]],[c[1],c[2],r[1],r[0]],[c[3],r[1],c[2]]]:[[c[0],c[3],r[0]],[c[0],r[0],r[1],c[1]],[c[3],c[2],r[1],r[0]],[c[1],r[1],c[2]]];return {bounds,width,depth,eave,rise,corners:c,ridge:r,faces};
};
BMH.disposeStudio3D = () => {
  const s=BMH.studio3d;if(!s)return;
  if(s.scene){s.scene.userData.disposed=true;for(const cancel of s.scene.userData.surfaceCancels||[])cancel();}
  try{s.raf&&cancelAnimationFrame(s.raf);s.ro?.disconnect?.();const geometries=new Set(),materials=new Set(),textures=new Set();s.scene?.traverse?.(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);});for(const item of s.scene?.userData?.finishMaterials?.values?.()||[])for(const m of Object.values(item))materials.add(m);for(const t of s.scene?.userData?.surfaceTextures?.values?.()||[])if(t)textures.add(t);for(const m of materials){for(const key of ['map','normalMap','bumpMap','roughnessMap','metalnessMap','emissiveMap','aoMap'])if(m[key])textures.add(m[key]);m.dispose?.();}for(const g of geometries)g.dispose?.();for(const t of textures)t.dispose?.();s.scene?.userData?.environmentTarget?.dispose?.();for(const pass of s.composer?.passes||[]){pass.ssaoMaterial?.dispose?.();pass.noiseTexture?.dispose?.();pass.dispose?.();}s.composer?.dispose?.();s.renderer?.dispose?.();s.renderer?.domElement?.removeEventListener?.('pointerdown',s.onDown);window.removeEventListener('pointermove',s.onMove);window.removeEventListener('pointerup',s.onUp);window.removeEventListener('pointercancel',s.onUp);s.renderer?.domElement?.removeEventListener?.('wheel',s.onWheel);s.renderer?.domElement?.removeEventListener?.('webglcontextlost',s.onContextLost);}catch(_){}
  BMH.studio3d=null;
};
BMH.mountStudio3D = async () => {
  const canvas=BMH.$('#studio3dCanvas'),stage=BMH.$('#studio3dStage');if(!canvas||!stage)return;
  BMH.disposeStudio3D();const THREE=await BMH.ensureThree();if(BMH.$('#studio3dCanvas')!==canvas)return;if(!THREE){stage.classList.add('three-failed');BMH.$('#studio3dLoading')?.remove();return;}
  const effects=await Promise.allSettled(['EffectComposer','RenderPass','SSAOPass','OutputPass','ShaderPass'].map(name=>import('./vendor/three/postprocessing/'+name+'.js')).concat([import('./vendor/three/shaders/FXAAShader.js')]));if(BMH.$('#studio3dCanvas')!==canvas)return;const FX=Object.assign({},...effects.filter(r=>r.status==='fulfilled').map(r=>r.value));
  const palette=BMH.scenePalette(),scene=new THREE.Scene();scene.background=new THREE.Color(BMH.state.ui.sceneTheme==='night'?0x293330:0xefebe2);scene.fog=new THREE.Fog(scene.background,38,100);
  const camera=new THREE.PerspectiveCamera(42,1,.05,140);let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});}catch{stage.classList.add('three-failed');BMH.$('#studio3dLoading')?.remove();return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=BMH.state.ui.sceneTheme==='night'?1.1:1.05;
  renderer.localClippingEnabled=true;
  if(THREE.RoomEnvironment){const env=new THREE.RoomEnvironment(),generator=new THREE.PMREMGenerator(renderer);scene.userData.environmentTarget=generator.fromScene(env,.04);scene.environment=scene.userData.environmentTarget.texture;env.dispose();generator.dispose();}
  const hemi=new THREE.HemisphereLight(BMH.state.ui.sceneTheme==='night'?0x8da4cf:0xffffff,0x9ba49b,BMH.state.ui.sceneTheme==='night'?.8:1.5);scene.add(hemi);
  const sun=new THREE.DirectionalLight(BMH.state.ui.sceneTheme==='night'?0xb8c7ff:0xfff0d5,BMH.state.ui.sceneTheme==='night'?1.4:1.65);sun.position.set(-10,18,-12);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.00015;sun.shadow.normalBias=.015;sun.shadow.radius=5;sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-20;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xe5f4ff,BMH.state.ui.sceneTheme==='night'?.3:.85);fill.position.set(12,10,-8);scene.add(fill);
  const warm=new THREE.PointLight(0xffb66a,BMH.state.ui.sceneTheme==='night'?8:0,24,2);warm.position.set(0,4,1);scene.add(warm);
  const mat=(color,rough=.75,metal=.02,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,transparent:opacity<1,opacity});
  const mats={wall:mat(palette.wall,.82),slab:mat(0xe3ddd0,.88),frame:mat(palette.frame,.45,.22),glass:new THREE.MeshPhysicalMaterial({color:0xd3dedb,roughness:.05,metalness:.05,transparent:true,opacity:.28}),floor:mat(palette.floor,.62),accent:mat(palette.accent,.65),ground:mat(0xe7e1d4,1),green:mat(0x788669,.95),dark:mat(0x4a4f4b,.75),roof:BMH.roofSceneMaterial?.(THREE)||mat(0x555e59,.85),rail:mat(0x9a7b49,.37,.62)};
  const surfaces=BMH.sceneAssetMaterials(THREE,scene,{wall:'#'+palette.wall.toString(16).padStart(6,'0'),floor:'#'+palette.floor.toString(16).padStart(6,'0'),accent:'#'+palette.accent.toString(16).padStart(6,'0')});mats.wall=surfaces.wall;mats.floor=surfaces.floor;mats.accent=surfaces.wood;
  const finishMaterials=new Map();
  const roomMaterial=(role,id,fallback)=>{if(id&&['floor','wall','accent'].includes(role)){const finishes=BMH.sceneAssetMaterials(THREE,scene,{...(BMH.finishPalette?.(id)||{}),floor:BMH.finishPalette?.(id)?.floor||'#'+palette.floor.toString(16).padStart(6,'0'),surface:BMH.roomSurfaceStyle(id)});return finishes[role==='accent'?'wood':role];}const hex=BMH.finishPalette?.(id)?.[role];if(!/^#[0-9a-f]{6}$/i.test(hex||''))return fallback;const key=role+hex;if(!finishMaterials.has(key)){const m=fallback.clone();m.color.set(hex);finishMaterials.set(key,m);}return finishMaterials.get(key);};
  const addBox=(w,h,d,x,y,z,material=mats.wall)=>{const g=new THREE.BoxGeometry(w,h,d);BMH.sceneSurfaceUvs(g,material,{x,y,z});const o=new THREE.Mesh(g,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;};
  const site=BMH.state.project.site,W=Number(site.width)||5,D=Number(site.depth)||20,floors=Math.max(1,Number(site.floors)||1),fh=BMH.projectLevels().floorHeight,explode=BMH.state.ui.sceneExploded?(BMH.modelExplodeGap?.(fh)??1.25):0,focus=BMH.state.ui.sceneFocus||'all',classical=/tân cổ điển|tan co dien|neoclassic|classical|cổ điển|co dien/i.test(BMH.state.project.style||'');
  // landscape
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(200,200),mat(0xefebe2,1));ground.userData={kind:'display-ground',presentationOnly:true};ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const displayRoom=focus.startsWith('room:')?BMH.state.project.plan.rooms.find(r=>r.id===focus.slice(5)):null;
  const displayBase=addBox((displayRoom?.w||W)+.25,.065,(displayRoom?.h||D)+.25,displayRoom?displayRoom.x+displayRoom.w/2-W/2:0,.025,displayRoom?displayRoom.y+displayRoom.h/2-D/2:0,mat(0xd4caba,.97));displayBase.userData={kind:'display-base',presentationOnly:true};
  const roomFurniture=(r,y)=>{
    if(BMH.addRoomSceneFurniture)return BMH.addRoomSceneFurniture(r,y,THREE,scene,{...mats,accent:roomMaterial('accent',r.id,mats.accent)},BMH.state.project.site);
    const cx=r.x+r.w/2-W/2,cz=r.y+r.h/2-D/2;
    if(r.type==='living'){
      addBox(Math.min(2.2,r.w*.58),.34,.78,cx,y+.28,cz+.32,mat(0xa78b76,.91));
      addBox(Math.min(2.2,r.w*.58),.66,.13,cx,y+.58,cz+.68,mat(0x876b56,.84));
      addBox(.9,.08,.52,cx,y+.40,cz-.72,mats.accent);
      for(const dx of [-.35,.35])for(const dz of [-.17,.17])addBox(.045,.33,.045,cx+dx,y+.20,cz-.72+dz,mats.dark);
      addBox(Math.min(2.6,r.w*.75),.016,1.6,cx,y+.016,cz-.25,mat(0xb6aaa0,1));
      for(const dx of [-.65,0,.65]){addBox(.57,.13,.59,cx+dx,y+.51,cz+.29,mat(0xc3ad98,.99));addBox(.50,.40,.16,cx+dx,y+.70,cz+.60,mat(0xbda589,.98));}
      addBox(1.3,.72,.055,cx,y+1.20,cz-r.h*.42,mats.dark);addBox(1.7,.30,.32,cx,y+.22,cz-r.h*.42,mats.accent);
    }else if(r.type==='bed'){
      const bw=Math.min(1.85,r.w*.62),bd=Math.min(2,r.h*.58);
      addBox(bw,.34,bd,cx,y+.28,cz,mat(0xe5dbcc,.95));
      addBox(bw,.7,.12,cx,y+.53,cz-bd/2,mat(0x947861,.8));
      addBox(bw*.92,.12,bd*.66,cx,y+.51,cz+bd*.14,mat(0xd7cfbd,.98));
      for(const dx of [-bw*.25,bw*.25])addBox(bw*.40,.15,.46,cx+dx,y+.55,cz-bd*.30,mat(0xf7f1e6,.95));
      for(const dx of [-bw/2-.24,bw/2+.24])if(bw+.8<r.w){addBox(.38,.43,.42,cx+dx,y+.23,cz-bd*.35,mats.accent);const lamp=new THREE.Mesh(new THREE.CylinderGeometry(.10,.17,.18,16),mat(0xf1dfb9,.9));lamp.position.set(cx+dx,y+.61,cz-bd*.35);scene.add(lamp);}
      addBox(Math.min(1.5,r.w*.42),2.05,.50,cx-r.w*.28,y+1.025,cz+r.h*.32,mats.accent);
    }else if(r.type==='kitchen'){
      addBox(Math.min(2.5,r.w*.68),.85,.55,cx,y+.44,cz+r.h*.29,mat(0xc3ad91,.65));
      addBox(Math.min(2.5,r.w*.68),.06,.60,cx,y+.89,cz+r.h*.29,mat(0xd5d0c7,.3));
      addBox(.55,.015,.36,cx,y+.93,cz+r.h*.29,mats.dark);
      addBox(Math.min(2.5,r.w*.68),.6,.34,cx,y+1.75,cz+r.h*.32,mats.accent);
      addBox(1.1,.07,.7,cx,y+.76,cz-.4,mats.accent);
      for(const dx of [-.4,.4])for(const dz of [-.22,.22])addBox(.055,.72,.055,cx+dx,y+.36,cz-.4+dz,mats.dark);
      for(const dx of [-.8,.8])if(r.w>2.8){addBox(.40,.08,.4,cx+dx,y+.44,cz-.4,mats.accent);addBox(.4,.45,.07,cx+dx,y+.66,cz-.15,mats.accent);for(const d of [-.14,.14])addBox(.04,.4,.04,cx+dx+d,y+.2,cz-.4,mats.dark);}
    }else if(r.type==='bath'){
      const bowl=new THREE.Mesh(new THREE.SphereGeometry(.30,24,16),mat(0xf0efea,.20));bowl.scale.set(1,.5,1.3);bowl.position.set(cx-.26,y+.36,cz);scene.add(bowl);addBox(.35,.28,.4,cx-.26,y+.14,cz,mat(0xf0efea,.22));addBox(.40,.58,.18,cx-.26,y+.40,cz-.32,mat(0xf0efea,.22));
      addBox(.48,.72,.38,cx+.28,y+.38,cz+.28,mat(0xe9e9e4,.25));
    }else if(r.type==='stairs'){
      const count=Math.min(9,Math.max(4,Math.floor(r.h/.4)));
      for(let i=0;i<count;i++)addBox(Math.max(.5,r.w*.58),.09+i*.14,Math.min(.32,r.h/count),cx,y+.05+i*.07,cz-r.h*.38+i*r.h*.76/count,mats.accent);
    }
  };
  const roomFocus=focus.startsWith('room:')?BMH.state.project.plan.rooms.find(r=>r.id===focus.slice(5)):null;
  const floorFocus=focus.startsWith('floor:')?BMH.clamp(Number(focus.split(':')[1])||0,0,floors-1):null;
  const visibleFloors=roomFocus?[Number(roomFocus.floor)]:floorFocus!==null?[floorFocus]:Array.from({length:floors},(_,f)=>f);
  const interiorCamera=roomFocus&&['living','bed','kitchen','bath'].includes(roomFocus.type)&&BMH.state.ui.roomCamera==='inside'?BMH.roomInteriorCamera(roomFocus):null,insideRoom=!!interiorCamera;
  const wallHeight=fh-BMH.projectLevels().slab;
  for(const f of visibleFloors){
    const geometry=BMH.scenePlanGeometry(roomFocus?{rooms:[roomFocus],openings:BMH.state.project.plan.openings,wallContext:BMH.state.project.plan.rooms}:BMH.state.project.plan,f);
    const base=roomFocus||floorFocus!==null?0:f*(fh+explode);
    for(const r of geometry.rooms){
      const cx=r.x+r.w/2-W/2,cz=r.y+r.h/2-D/2;
      const slab=BMH.projectLevels().slab,holes=BMH.stairFloorHoles?.(f)||[],panels=BMH.slabPanels?.(r,holes)||[{x:r.x,y:r.y,w:r.w,d:r.h}];
      for(const panel of panels){const mesh=addBox(panel.w,slab,panel.d,panel.x+panel.w/2-W/2,base+slab/2,panel.y+panel.d/2-D/2,roomMaterial('floor',r.id,r.type==='bath'?mat(0xc8cfcb,.5):mats.floor));mesh.userData={kind:'floor-slab',roomId:r.id,floor:f};}
      roomFurniture(r,base+slab);BMH.addWindowDrapery?.(THREE,scene,r,base,site,!!roomFocus&&!insideRoom);
      if(insideRoom){for(const panel of BMH.slabPanels?.(r,BMH.stairFloorHoles?.(f+1)||[])||[{x:r.x,y:r.y,w:r.w,d:r.h}]){const ceiling=addBox(panel.w,slab,panel.d,panel.x+panel.w/2-W/2,base+fh-(BMH.projectLevels().ceilingDrop||0)+slab/2,panel.y+panel.d/2-D/2,roomMaterial('wall',r.id,mats.wall));ceiling.userData={kind:'ceiling-slab',roomId:r.id,floor:f};}}
      if(focus==='all'&&!['stairs','elevator'].includes(r.type)&&(BMH.projectLevels().ceilingDrop||0)>0){for(const panel of BMH.slabPanels?.(r,BMH.stairFloorHoles?.(f+1)||[])||[{x:r.x,y:r.y,w:r.w,d:r.h}]){const ceiling=addBox(panel.w,.02,panel.d,panel.x+panel.w/2-W/2,base+fh-BMH.projectLevels().ceilingDrop+.01,panel.y+panel.d/2-D/2,mats.wall);ceiling.userData={kind:'suspended-ceiling',roomId:r.id,floor:f};}}
      // Keep the cover on the whole house; isolated floors and rooms stay open for inspection.
      if(focus==='all'&&f===floors-1){
        const nextHoles=BMH.stairFloorHoles?.(f+1)||[],ceilingPanels=BMH.slabPanels?.(r,nextHoles)||[{x:r.x,y:r.y,w:r.w,d:r.h}];
        for(const panel of ceilingPanels){const mesh=addBox(panel.w,slab,panel.d,panel.x+panel.w/2-W/2,base+fh+slab/2,panel.y+panel.d/2-D/2,mats.slab);mesh.userData={kind:'ceiling-slab',roomId:r.id,floor:f};}
      }
    }
    for(const w of geometry.walls){
      // Isolated shaft sides use the lift enclosure; shared room walls remain measured walls.
      if(w.roomIds?.length&&w.roomIds.every(id=>BMH.state.project.plan.rooms.find(r=>r.id===id)?.type==='elevator'))continue;
      const len=w.b-w.a,mid=(w.a+w.b)/2,wallT=w.thickness||.12;
      const x=w.horizontal?mid-W/2:w.axis-W/2;
      const z=w.horizontal?w.axis-D/2:mid-D/2;
      const paintedRoom=roomFocus?.id||(w.roomIds||[]).find(id=>BMH.state.project.materials.finish?.rooms?.[id]);
      const wallMaterial=roomMaterial('wall',paintedRoom,mats.wall);
      const near=(roomFocus||floorFocus!==null)&&(w.horizontal?w.axis<=Math.min(...geometry.rooms.map(r=>r.y))+.02:w.axis>=Math.max(...geometry.rooms.map(r=>r.x+r.w))-.02);
      const clipped=new Map();
      const viewMaterial=material=>{if(!(floorFocus!==null||roomFocus&&near&&!insideRoom)||!THREE.Plane)return material;if(!clipped.has(material)){const copy=material.clone();copy.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),base+(roomFocus?.85:1.05))];copy.clipShadows=true;clipped.set(material,copy);}return clipped.get(material);};
      const segment=(h,cy,material=wallMaterial)=>{const mesh=addBox(w.horizontal?len:wallT,h,w.horizontal?wallT:len,x,base+BMH.projectLevels().slab+cy,z,viewMaterial(material));mesh.userData={kind:'wall',roomIds:w.roomIds||[],floor:f,wallAxis:w.horizontal?'z':'x',wallCoordinate:w.axis,base,wallSurface:w.kind==='window'&&material===mats.glass?'window':'solid'};return mesh;};
      if(w.kind==='door'){
        const oh=Math.min(w.height,wallHeight);segment(wallHeight-oh,oh+(wallHeight-oh)/2);
      }else if(w.kind==='window'){
        const sill=w.sill,oh=Math.min(w.height,Math.max(.1,wallHeight-sill)),top=sill+oh;segment(sill,sill/2);segment(Math.max(.001,wallHeight-top),top+(wallHeight-top)/2);segment(oh,sill+oh/2,mats.glass);
        for(const v of [w.a,w.b,mid]){const frame=addBox(w.horizontal?.045:.07,oh,w.horizontal?.07:.045,w.horizontal?v-W/2:x,base+BMH.projectLevels().slab+sill+oh/2,w.horizontal?z:v-D/2,viewMaterial(mats.frame));frame.userData={kind:'window-frame',openingId:w.openingId,roomId:w.openingRoomId,floor:f};}
        for(const height of [sill,top]){const frame=addBox(w.horizontal?len:.045,.045,w.horizontal?.045:len,x,base+BMH.projectLevels().slab+height,z,viewMaterial(mats.frame));frame.userData={kind:'window-frame',openingId:w.openingId,roomId:w.openingRoomId,floor:f};}
      }else{
        // Cut away the near side in an isolated room so the interior stays visible.
        segment(wallHeight,wallHeight/2);
      }
    }
    const openingIds=new Set(geometry.walls.filter(w=>w.kind==='door').map(w=>w.openingId));
    for(const o of BMH.state.project.plan.openings.filter(o=>openingIds.has(o.id))){
     const leaf=BMH.doorLeafGeometry?.(o);if(!leaf)continue;const height=Number(o.height)||2.1,wall=geometry.walls.find(w=>w.openingId===o.id),wallT=wall?.thickness||.12,near=wall&&(wall.horizontal?wall.axis<=Math.min(...geometry.rooms.map(r=>r.y))+.02:wall.axis>=Math.max(...geometry.rooms.map(r=>r.x+r.w))-.02),copies=new Map();
     const viewMaterial=material=>{if(!(floorFocus!==null||roomFocus&&near&&!insideRoom)||!THREE.Plane)return material;if(!copies.has(material)){const copy=material.clone();copy.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),base+(roomFocus?.85:1.05))];copy.clipShadows=true;copies.set(material,copy);}return copies.get(material);};
     const surface=viewMaterial(roomMaterial('accent',o.roomId,mats.accent)),root=new THREE.Group();root.name='door-'+o.id;root.userData={kind:'door-leaf',openingId:o.id,roomId:o.roomId,floor:f};
     const angle=Math.atan2(leaf.closed.y-leaf.hinge.y,leaf.closed.x-leaf.hinge.x),signed=leaf.sweep?1:-1,opened=roomFocus&&!insideRoom?Math.PI/3:0;
     root.position.set(leaf.hinge.x-W/2,base+BMH.projectLevels().slab,leaf.hinge.y-D/2);root.rotation.y=-(angle+signed*opened);
     const panelGeometry=new THREE.BoxGeometry(leaf.width-.06,height-.06,.045);BMH.sceneSurfaceUvs(panelGeometry,surface);const panel=new THREE.Mesh(panelGeometry,surface);panel.position.set(leaf.width/2,height/2,0);panel.castShadow=panel.receiveShadow=true;root.add(panel);
     for(const dz of [-.035,.035]){const handle=new THREE.Mesh(new THREE.BoxGeometry(.12,.025,.025),viewMaterial(mats.rail));handle.position.set(leaf.width-.13,Math.min(1.05,height*.55),dz);root.add(handle);}scene.add(root);
     for(const end of [leaf.hinge,leaf.closed]){const frame=addBox(leaf.horizontal?.055:wallT,height,leaf.horizontal?wallT:.055,end.x-W/2,base+BMH.projectLevels().slab+height/2,end.y-D/2,viewMaterial(mats.frame));frame.userData={kind:'door-frame',openingId:o.id,roomId:o.roomId,floor:f};}
    }

  }
  BMH.decorateStudioScene?.({THREE,scene,mats,addBox,mat,roomMaterial,visibleFloors,roomFocus,floorFocus,W,D,fh,explode,focus});
  const roof=BMH.sceneRoofSpec(explode);
  if(focus==='all'&&roof){
   mats.roof.side=THREE.DoubleSide;
   for(const [polygon,gable]of [...roof.faces.map(p=>[p,false]),...(roof.gables||[]).map(p=>[p,true])]){const coords=[];for(let i=1;i<polygon.length-1;i++)for(const q of [polygon[0],polygon[i],polygon[i+1]])coords.push(q[0]-W/2,q[1],q[2]-D/2);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.computeVertexNormals();if(!gable)BMH.roofSurfaceUvs?.(THREE,geo,polygon);const mesh=new THREE.Mesh(geo,gable?mats.wall:mats.roof);mesh.userData={kind:gable?'roof-gable':'roof',roofType:roof.type||'hip',modelArea:BMH.polygonArea3D?.(polygon),designRevision:BMH.drawingRevision()};mesh.castShadow=mesh.receiveShadow=true;scene.add(mesh);}
   if(roof.type!=='flat')addBox(roof.width,.12,roof.depth,roof.bounds.cx-W/2,roof.eave-.08,roof.bounds.cy-D/2,mats.dark);
  }

  const centerRoom=roomFocus?new THREE.Vector3(roomFocus.x+roomFocus.w/2-W/2,roomFocus.type==='stairs'?fh*.55:1.12,roomFocus.y+roomFocus.h/2-D/2):null;
  const focusedBounds=BMH.sceneFootprintBounds(roomFocus?[roomFocus]:visibleFloors.flatMap(f=>BMH.floorRooms(f)));if(focusedBounds){const cx=focusedBounds.cx-W/2,cz=focusedBounds.cy-D/2,extent=Math.max(focusedBounds.width,focusedBounds.depth,floors*fh)+2;sun.target.position.set(cx,0,cz);scene.add(sun.target);sun.position.set(cx-10,18,cz-12);sun.shadow.camera.left=sun.shadow.camera.bottom=-extent;sun.shadow.camera.right=sun.shadow.camera.top=extent;sun.shadow.camera.updateProjectionMatrix();}
  const facadeCamera=focus==='all'&&BMH.state.ui.exteriorCamera==='front',frameBounds=facadeCamera&&focusedBounds?{...focusedBounds,depth:Math.min(1,focusedBounds.depth)}:focusedBounds;
  BMH.configureModelPresentation?.({THREE,scene,renderer,camera,ground,displayBase,visibleFloors,roomFocus,floorFocus,W,D,fh,explode,focus});
  const defaultPitch=roomFocus?(insideRoom?.13:.62):floorFocus!==null?.84:.38;
  const span=Math.hypot(focusedBounds?.width||W,focusedBounds?.depth||D),aspect=Math.max(.55,stage.getBoundingClientRect().width/Math.max(360,stage.getBoundingClientRect().height)),distance=span*(aspect<1?1.5:1.05);
  const state={yaw:floorFocus!==null?(aspect<1?Math.PI-.5:Math.PI/2+.3):focus==='all'?Math.PI+.42:Math.PI-.5,pitch:focus==='all'?.28:defaultPitch,dist:roomFocus?Math.max(4.2,Math.max(roomFocus.w,roomFocus.h)*(aspect<1?2.1:1.55)):Math.max(10,distance),target:centerRoom||new THREE.Vector3(focusedBounds?focusedBounds.cx-W/2:0,floorFocus!==null?.65:floors*fh*.45,focusedBounds?focusedBounds.cy-D/2:0),drag:false,lastX:0,lastY:0,defaultPitch:focus==='all'?.28:defaultPitch};
  if(facadeCamera&&focusedBounds){state.yaw=Math.PI+.06;state.pitch=state.defaultPitch=.09;state.dist=Math.max(7,Math.max(focusedBounds.width,floors*fh)*1.7);state.target.set(focusedBounds.cx-W/2,Math.max(floors*fh,roof?roof.eave+roof.rise:0)*.46,focusedBounds.y-D/2);}
  if(insideRoom){state.yaw=interiorCamera.yaw;state.dist=interiorCamera.distance;state.pitch=state.defaultPitch=interiorCamera.pitch;state.target.set(interiorCamera.target.x-W/2,interiorCamera.targetHeight??1.15,interiorCamera.target.y-D/2);camera.fov=58;}state.minDist=insideRoom?.45:roomFocus?1.5:4;
  let composer=null,ao=null,fxaa=null;
  const clippedScene=scene.children.some(o=>(Array.isArray(o.material)?o.material:[o.material]).some(m=>m?.clippingPlanes?.length));
  if(BMH.modelLook?.()!=='neon'&&!clippedScene&&renderer.capabilities?.isWebGL2&&FX.EffectComposer&&FX.RenderPass&&FX.SSAOPass&&FX.OutputPass&&FX.ShaderPass&&FX.FXAAShader){
   try{composer=new FX.EffectComposer(renderer);composer.setPixelRatio(1);composer.addPass(new FX.RenderPass(scene,camera));ao=new FX.SSAOPass(scene,camera,512,512,16);ao.kernelRadius=.18;ao.minDistance=.00005;ao.maxDistance=.005;const originalVisibility=ao.overrideVisibility.bind(ao);ao.overrideVisibility=()=>{originalVisibility();ground.visible=false;};composer.addPass(ao);fxaa=new FX.ShaderPass(FX.FXAAShader);composer.addPass(fxaa);composer.addPass(new FX.OutputPass());}catch(_){for(const pass of composer?.passes||[])pass.dispose?.();composer?.dispose?.();composer=null;}
  }
  const renderFrame=()=>{if(BMH.studio3d?.renderer===renderer&&BMH.studio3d.archRender)return;BMH.updateModelPresentation?.({scene,camera,THREE});if(composer)composer.render();else renderer.render(scene,camera);if(renderer.shadowMap.enabled&&sun.shadow.map)renderer.shadowMap.autoUpdate=false;const current=BMH.studio3d;if(current?.renderer===renderer){current.displayedCameraKey=BMH.cinematicCameraKey();current.displayedDesignKey=BMH.cinematicSignature();BMH.updateModelRoomLabels?.(current);}};
  const indoorItems=insideRoom?BMH.roomFurnitureLayout(roomFocus):[];let clearIndoorPose=null;
  const updateCamera=()=>{
   const position=()=>{const cp=Math.cos(state.pitch),sp=Math.sin(state.pitch),cy=Math.cos(state.yaw),sy=Math.sin(state.yaw);camera.position.set(state.target.x+state.dist*cp*sy,state.target.y+state.dist*sp,state.target.z+state.dist*cp*cy);};position();
   if(insideRoom){
    if(!BMH.interiorCameraIsClear(roomFocus,{x:camera.position.x+W/2,y:camera.position.z+D/2,height:camera.position.y},indoorItems)&&clearIndoorPose){Object.assign(state,{yaw:clearIndoorPose.yaw,pitch:clearIndoorPose.pitch,dist:clearIndoorPose.dist});state.target.copy(clearIndoorPose.target);position();}
    else clearIndoorPose={yaw:state.yaw,pitch:state.pitch,dist:state.dist,target:state.target.clone()};
   }
   camera.lookAt(state.target);BMH.refreshCinematicHero?.();if(BMH.studio3d?.archRender)BMH.stopArchitecturalRender();const current=BMH.studio3d;if(current?.renderer===renderer&&!current.raf)current.raf=requestAnimationFrame(()=>{if(BMH.studio3d!==current)return;current.raf=0;renderFrame();});
  };updateCamera();
  const resize=()=>{const r=stage.getBoundingClientRect(),w=Math.max(280,Math.floor(r.width)),h=Math.max(360,Math.floor(r.height));renderer.setSize(w,h,false);if(composer){composer.setSize(w,h);fxaa.material.uniforms.resolution.value.set(1/w,1/h);}camera.aspect=w/h;camera.updateProjectionMatrix();updateCamera();
    if(!state.framed&&focusedBounds&&!insideRoom){
      const b=frameBounds,height=focus==='all'?Math.max(floors*(fh+explode)+BMH.projectLevels().slab,roof?roof.eave+roof.rise:0):fh+(roomFocus?.type==='stairs'?.95:0);
      for(let n=0;n<6;n++){camera.updateMatrixWorld();let edge=0;for(const x of [b.x-.2,b.x+b.width+.2])for(const z of [b.y-.2,b.y+b.depth+.2])for(const y of [0,height]){const v=new THREE.Vector3(x-W/2,y,z-D/2).project(camera);edge=Math.max(edge,Math.abs(v.x)/.88,Math.abs(v.y)/.82);}if(edge<=1)break;state.dist*=Math.min(1.8,Math.max(1.08,edge));updateCamera();}
      state.framed=true;
    }
  };resize();const ro=new ResizeObserver(resize);ro.observe(stage);
  const pointers=new Map(),gesture=()=>{const [a,b]=[...pointers.values()];return b?{distance:Math.hypot(a.x-b.x,a.y-b.y),x:(a.x+b.x)/2,y:(a.y+b.y)/2}:null;};
  const onDown=e=>{pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});state.pan=e.button===2||e.shiftKey;state.drag=true;state.lastX=e.clientX;state.lastY=e.clientY;state.gesture=gesture();canvas.setPointerCapture?.(e.pointerId);};
  const onMove=e=>{
    if(!pointers.has(e.pointerId))return;
    pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});const next=gesture();
    if(next&&state.gesture){const previous=state.gesture;if(next.distance>1)state.dist=BMH.clamp(state.dist*previous.distance/next.distance,state.minDist,60);state.target.x-=(next.x-previous.x)*state.dist*.001;state.target.z-=(next.y-previous.y)*state.dist*.001;}
    else{const dx=e.clientX-state.lastX,dy=e.clientY-state.lastY;if(state.pan){state.target.x-=dx*state.dist*.001;state.target.z-=dy*state.dist*.001;}else{state.yaw-=dx*.006;state.pitch=BMH.clamp(state.pitch-dy*.004,insideRoom?-.2:.12,1.12);}}
    state.lastX=e.clientX;state.lastY=e.clientY;state.gesture=next;updateCamera();
  };
  const onUp=e=>{pointers.delete(e.pointerId);state.drag=pointers.size>0;state.gesture=gesture();const remaining=[...pointers.values()][0];if(remaining){state.lastX=remaining.x;state.lastY=remaining.y;}};
  const onWheel=e=>{e.preventDefault();state.dist=BMH.clamp(state.dist*(1+Math.sign(e.deltaY)*.08),state.minDist,60);updateCamera();};canvas.oncontextmenu=e=>e.preventDefault();canvas.addEventListener('pointerdown',onDown);window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp);window.addEventListener('pointercancel',onUp);canvas.addEventListener('wheel',onWheel,{passive:false});
  const animate=renderFrame;
  state.updateCamera=updateCamera;state.defaultYaw=state.yaw;state.defaultDist=state.dist;state.defaultTarget=state.target.clone();
  const onContextLost=e=>{e.preventDefault();if(BMH.$('#studio3dCanvas')!==canvas)return;BMH.disposeStudio3D();stage.classList.remove('three-ready');BMH.mountLightPreview?.('Đồ họa bị gián đoạn · chế độ tương thích');};canvas.addEventListener('webglcontextlost',onContextLost);
  BMH.studio3d={THREE,project:BMH.state.project,structureKey:BMH.studioStructureKey?.(),scene,camera,renderer,composer,ao,fxaa,renderFrame,state,ro,onDown,onMove,onUp,onWheel,onContextLost,raf:0};animate();stage.classList.add('three-ready');BMH.$('#studio3dLoading')?.remove();
  Promise.allSettled(scene.userData.surfaceLoads||[]).then(()=>{if(BMH.studio3d?.scene===scene)renderFrame();});
  const furnitureLoads=scene.userData.furnitureLoads||[];
  if(furnitureLoads.length){const status=document.createElement('div');status.className='studio-model-status';status.setAttribute('role','status');status.textContent='Đang tải '+furnitureLoads.length+' mô hình nội thất…';stage.appendChild(status);Promise.all(furnitureLoads).then(results=>{if(BMH.studio3d?.scene!==scene)return;renderer.shadowMap.needsUpdate=true;const failed=results.filter(ok=>!ok).length;status.textContent=failed?failed+' món đang dùng mô hình đơn giản · thử tải lại để xem chi tiết':'Đã tải '+results.length+' mô hình nội thất';updateCamera();});}
  if(!visibleFloors.some(f=>BMH.floorRooms(f).length)){const message=document.createElement('div');message.className='studio-empty-floor';message.textContent='Tầng này chưa có phòng trong mặt bằng. Bổ sung ở Bước 4 để dựng 3D.';stage.appendChild(message);}
};
BMH.resetStudio3D = () => {const s=BMH.studio3d;if(!s)return;s.state.yaw=s.state.defaultYaw;s.state.pitch=s.state.defaultPitch;s.state.dist=s.state.defaultDist;s.state.target.copy(s.state.defaultTarget);s.state.updateCamera();};
BMH.cinematicSignature = (focus=BMH.state.ui?.sceneFocus||'all') => {
  const p=BMH.state.project,ui=BMH.state.ui||{};
  return JSON.stringify({sceneDetail:BMH.ARCH_RENDER_REVISION||'continuous-stairs-and-landscape',theme:ui.sceneTheme||'day',exploded:!!ui.sceneExploded,outdoor:p.plan.outdoor||[],style:p.style,focus,viewPreset:focus.startsWith('room:')?(ui.roomCamera||'overview'):focus==='all'?(ui.exteriorCamera||'overview'):'overview',roomInspection:focus.startsWith('room:')?'open':undefined,finish:p.materials?.finish||{},site:{width:p.site.width,depth:p.site.depth,floors:p.site.floors,floorHeight:p.site.floorHeight,slabThickness:p.site.slabThickness,ceilingDrop:p.site.ceilingDrop,frontDirection:p.site.frontDirection},materials:p.materials?.choices||{},productCodes:Object.values(p.materials?.choices||{}).map(id=>[id,p.dataEngine?.materialOverrides?.[id]?.sku||'']),tier:p.materials?.tier,rooms:p.plan.rooms.map(r=>[r.id,r.floor,r.name,r.type,r.x,r.y,r.w,r.h,r.furnitureRotation,r.stairDirection,r.stairShape]),furniture:p.plan.rooms.flatMap(r=>BMH.roomFurnitureLayout?.(r)||[]),openings:(p.plan.openings||[]).map(o=>[o.floor,o.roomId,o.kind,o.side,o.offset,o.width,o.height,o.sill,o.hinge,o.swing])});
};
BMH.cinematicCameraKey=()=>{
 const s=BMH.studio3d?.state,p=BMH.pendingFinishCamera,pose=s?{yaw:s.yaw,pitch:s.pitch,dist:s.dist,target:s.target.toArray()}:p&&p.project===BMH.state.project&&p.focus===BMH.state.ui.sceneFocus?p:null;
 return pose?JSON.stringify([pose.yaw,pose.pitch,pose.dist,...pose.target].map(v=>Math.round(v*100000)/100000)):'';
};
BMH.currentCinematicImage=()=>{const key=BMH.cinematicSignature(),camera=BMH.cinematicCameraKey();return camera&&BMH.cinematicRender.cameraKeys?.[key]===camera?BMH.cinematicRender.views[key]||'':'';};
BMH.refreshCinematicHero=()=>{const node=BMH.$('[data-cinematic-hero]');if(!node)return;const image=BMH.currentCinematicImage();node.hidden=!image;if(image&&node.querySelector('img')?.getAttribute('src')!==image)node.querySelector('img').src=image;};
BMH.generateCinematicRender = async () => {
  if(BMH.cinematicRender.loading)return;
  BMH.cinematicRender.loading=true;
  const scene=BMH.studio3d,viewer=BMH.architectViewer,architect=viewer?.three;
  const signature=BMH.cinematicSignature();let screenshot;
  try{if(scene?.scene?.userData?.furnitureLoads)await Promise.allSettled(scene.scene.userData.furnitureLoads);if(scene?.scene?.userData?.surfaceLoads)await Promise.allSettled(scene.scene.userData.surfaceLoads);if(viewer?.furnitureReady)await viewer.furnitureReady;if(signature!==BMH.cinematicSignature()||(scene&&scene!==BMH.studio3d)||(viewer&&viewer!==BMH.architectViewer))throw new Error('Góc nhìn đã đổi. Hãy tạo lại phối cảnh.');if(scene?.scene)(scene.renderFrame||(()=>scene.renderer.render(scene.scene,scene.camera)))();architect?.render?.(true);screenshot=scene?scene.renderer.domElement.toDataURL('image/jpeg',.8):architect?.renderer?architect.renderer.domElement.toDataURL('image/jpeg',.8):await BMH.capturePlanReference();}catch(err){BMH.cinematicRender.loading=false;BMH.cinematicRender.error=err.message||'Không tạo được ảnh tham chiếu.';BMH.toast(BMH.cinematicRender.error);return;}
  const referenceHash=BMH.finishHash?.(screenshot),cached=BMH.cinematicRender.views?.[signature],cameraKey=BMH.cinematicCameraKey?.()||'';
  if(referenceHash&&cached&&BMH.cinematicRender.referenceHashes?.[signature]===referenceHash){BMH.cinematicRender.loading=false;BMH.cinematicRender.dataUrl=cached;BMH.cinematicRender.signature=signature;(BMH.cinematicRender.cameraKeys||={})[signature]=cameraKey;BMH.cinematicRender.error='';BMH.rememberFinishCamera?.();BMH.render({preserveScroll:true});return;}
  const p=BMH.state.project;
  const selectedMaterials=Object.fromEntries(Object.entries(p.materials.choices||{}).map(([cat,id])=>{const name=(BMH.MATERIALS[cat]||[]).find(x=>x.id===id)?.name||id,sku=p.dataEngine?.materialOverrides?.[id]?.sku;return [cat,sku?`${name} · SKU ${sku}`:name];}));
  const focus=BMH.state.ui?.sceneFocus||'all',focusedRoom=focus.startsWith('room:')?p.plan.rooms.find(r=>r.id===focus.slice(5)):null;
  const payload={image:screenshot,project:{referenceKind:scene||architect?.renderer||(BMH.lightPreviewSvg&&BMH.state.ui.step===6)?'model':'drawing',style:p.style,styleDescription:BMH.houseStyle?.()?.description||'',view:{kind:focusedRoom?'room':focus.startsWith('floor:')?'floor':'house',roomName:focusedRoom?.name||'',roomType:focusedRoom?.type||'',floor:focusedRoom?.floor??(focus.startsWith('floor:')?Number(focus.slice(6)):0)},site:{width:p.site.width,depth:p.site.depth,floors:p.site.floors,floorHeight:p.site.floorHeight,slabThickness:p.site.slabThickness,ceilingDrop:p.site.ceilingDrop,frontDirection:p.site.frontDirection},materials:{choices:selectedMaterials,finish:BMH.visualMaterialContext?.(focusedRoom?.id)||{palette:BMH.finishPalette?.(focusedRoom?.id)||{}},rooms:focusedRoom?[]:p.plan.rooms.filter(r=>['living','bed','kitchen','bath'].includes(r.type)).slice(0,12).map(r=>({roomId:r.id,roomName:r.name,finish:BMH.visualMaterialContext?.(r.id)||{palette:BMH.finishPalette?.(r.id)||{}}}))},rooms:p.plan.rooms.map(r=>({id:r.id,furnitureRotation:r.furnitureRotation,stairDirection:r.stairDirection,furniture:BMH.roomFurnitureLayout?.(r)||[],name:r.name,type:r.type,floor:r.floor,x:r.x,y:r.y,w:r.w,h:r.h})),openings:(p.plan.openings||[]).map(o=>({roomId:o.roomId,kind:o.kind,side:o.side,offset:o.offset,width:o.width,height:o.height,sill:o.sill}))}};
  BMH.cinematicRender.loading=true;BMH.cinematicRender.error='';BMH.rememberFinishCamera?.();BMH.render({preserveScroll:true});
  try{
    const r=await (BMH.aiFetch||fetch)('/api/gemini-render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`Render HTTP ${r.status}`);if(!data.image)throw new Error('Gemini không trả về ảnh render.');
    if(signature!==BMH.cinematicSignature()||cameraKey!==(BMH.cinematicCameraKey?.()||'')){BMH.toast('Thiết kế hoặc góc nhìn đã đổi khi đang render. Hãy tạo lại phối cảnh.');BMH.cinematicRender.error='Thiết kế hoặc góc nhìn đã thay đổi; tạo lại ảnh từ góc hiện tại.';return;}
    const mime=['image/jpeg','image/png','image/webp'].includes(data.mimeType)?data.mimeType:'image/jpeg';
    BMH.cinematicRender.dataUrl=`data:${mime};base64,${data.image}`;BMH.cinematicRender.signature=signature;BMH.cinematicRender.views[signature]=BMH.cinematicRender.dataUrl;(BMH.cinematicRender.cameraKeys||={})[signature]=cameraKey;if(referenceHash)(BMH.cinematicRender.referenceHashes||={})[signature]=referenceHash;BMH.cinematicRender.generatedAt=data.generatedAt||new Date().toISOString();BMH.cinematicRender.error='';
  }catch(err){BMH.cinematicRender.loading=false;BMH.cinematicRender.error=err.message||String(err);BMH.toast(BMH.cinematicRender.error);}finally{BMH.cinematicRender.loading=false;BMH.rememberFinishCamera?.();BMH.render({preserveScroll:true});}
};
