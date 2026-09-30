/* V5.0.3 Studio 3D — accurate browser scene + optional Gemini cinematic render */
BMH.threePromise=null;
BMH.studio3d=null;
BMH.cinematicRender=BMH.cinematicRender||{loading:false,dataUrl:'',error:'',generatedAt:'',views:{}};
BMH.ensureThree = () => {
  if(window.THREE)return Promise.resolve(window.THREE);
  if(BMH.threePromise)return BMH.threePromise;
  const urls=[
    './vendor/three/three.module.js',
    'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js',
    'https://unpkg.com/three@0.160.1/build/three.module.js'
  ];
  BMH.threePromise=(async()=>{
    for(const url of urls){try{const module=await import(url);if(module.Scene&&module.WebGLRenderer)return module;}catch(_){} }
    return null;
  })();
  return BMH.threePromise;
};
BMH.scenePalette = () => {
  const m=BMH.state.project.materials||{},c=m.choices||{},tier=m.tier||'standard';
  const floor={viglacera:0xd6c6ae,dongtam:0xc8b295,vietceramics:0xd8d5cd}[c.floor]||0xd4c5ac;
  const wall={dulux:0xf2eee5,jotun:0xe8e2d7}[c.paint]||0xf2eee5;
  const frame=c.door==='premium-door'?0x292d2c:0x3f4543;
  const styleAccent=BMH.houseStyle?.()?.accent;
  const accent=styleAccent?parseInt(styleAccent.slice(1),16):tier==='premium'?0x7a604d:tier==='economy'?0x9a8a73:0x806a57;
  return {floor,wall,frame,accent,glass:0xa9c8cf,green:0x6f8666,ground:0xd9d1c3};
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
    for(const o of plan.openings||[]){
      if(o.roomId!==r.id||o.side!==side||Number(o.floor)!==floor||!['door','window'].includes(o.kind))continue;
      const span=end-start,width=Math.min(span-.12,Math.max(.45,Number(o.width)||.9));
      if(width<=0)continue;
      const offset=Number(o.offset);
      const a=round(start+(span-width)*Math.min(1,Math.max(0,Number.isFinite(offset)?offset:.5)));
      edge.openings.push({a,b:round(a+width),kind:o.kind,height:Number(o.height)||(o.kind==='window'?1.4:2.1),sill:o.kind==='window'?(Number.isFinite(Number(o.sill))?Number(o.sill):.9):0});
    }
  }
  const walls=[];
  for(const edge of edges.values()){
    const points=[...new Set([...edge.ranges.flat(),...edge.openings.flatMap(o=>[o.a,o.b])])].sort((a,b)=>a-b);
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],mid=(a+b)/2;
      if(b-a<.015||!edge.ranges.some(([s,e])=>s<=mid&&e>=mid))continue;
      const opening=edge.openings.find(o=>o.a<=mid&&o.b>=mid);
      walls.push({horizontal:edge.horizontal,axis:edge.axis,a,b,kind:opening?.kind||'wall',height:opening?.height,sill:opening?.sill});
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
BMH.disposeStudio3D = () => {
  const s=BMH.studio3d;if(!s)return;
  try{s.raf&&cancelAnimationFrame(s.raf);s.ro?.disconnect?.();s.scene?.traverse?.(o=>{o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m.dispose?.());else {o.material?.map?.dispose?.();o.material?.dispose?.();}});s.renderer?.dispose?.();s.renderer?.domElement?.removeEventListener?.('pointerdown',s.onDown);window.removeEventListener('pointermove',s.onMove);window.removeEventListener('pointerup',s.onUp);s.renderer?.domElement?.removeEventListener?.('wheel',s.onWheel);}catch(_){}
  BMH.studio3d=null;
};
BMH.mountStudio3D = async () => {
  const canvas=BMH.$('#studio3dCanvas'),stage=BMH.$('#studio3dStage');if(!canvas||!stage)return;
  BMH.disposeStudio3D();const THREE=await BMH.ensureThree();if(BMH.$('#studio3dCanvas')!==canvas)return;if(!THREE){stage.classList.add('three-failed');BMH.$('#studio3dLoading')?.remove();return;}
  const palette=BMH.scenePalette(),scene=new THREE.Scene();scene.background=new THREE.Color(BMH.state.ui.sceneTheme==='night'?0x18222e:0xeaf3f5);scene.fog=new THREE.Fog(scene.background,45,110);
  const camera=new THREE.PerspectiveCamera(42,1,.1,140);let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});}catch{stage.classList.add('three-failed');BMH.$('#studio3dLoading')?.remove();return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=BMH.state.ui.sceneTheme==='night'?1.1:1.05;
  const hemi=new THREE.HemisphereLight(BMH.state.ui.sceneTheme==='night'?0x8da4cf:0xffffff,0x9ba49b,BMH.state.ui.sceneTheme==='night'?.8:1.1);scene.add(hemi);
  const sun=new THREE.DirectionalLight(BMH.state.ui.sceneTheme==='night'?0xb8c7ff:0xfff0d5,BMH.state.ui.sceneTheme==='night'?1.4:2.1);sun.position.set(-10,18,-12);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.bias=-.0002;sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-20;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xe5f4ff,BMH.state.ui.sceneTheme==='night'?.3:.45);fill.position.set(12,10,-8);scene.add(fill);
  const warm=new THREE.PointLight(0xffb66a,BMH.state.ui.sceneTheme==='night'?8:0,24,2);warm.position.set(0,4,1);scene.add(warm);
  const mat=(color,rough=.75,metal=.02,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,transparent:opacity<1,opacity});
  const mats={wall:mat(BMH.houseStyle?.()?.wall||palette.wall,.82),slab:mat(0xd8d0c4,.88),frame:mat(palette.frame,.45,.22),glass:new THREE.MeshPhysicalMaterial({color:palette.glass,roughness:.08,metalness:.05,transmission:.3,transparent:true,opacity:.62}),floor:mat(palette.floor,.62),accent:mat(palette.accent,.65),ground:mat(palette.ground,1),green:mat(palette.green,.95),dark:mat(0x4a4f4b,.75),roof:mat(0x303c48,.85),rail:mat(0x9a7b49,.37,.62)};
  const makeTexture=(kind,color)=>{const c=document.createElement('canvas');c.width=c.height=256;const ctx=c.getContext('2d');ctx.fillStyle=color;ctx.fillRect(0,0,256,256);if(kind==='tile'){ctx.strokeStyle='#a99e8b';ctx.lineWidth=2;ctx.strokeRect(1,1,254,254);ctx.strokeStyle='#ffffff22';for(let i=0;i<12;i++){ctx.beginPath();ctx.moveTo(i*23,0);ctx.lineTo(i*17+30,256);ctx.stroke();}}else{for(let i=0;i<64;i++){ctx.strokeStyle=i%3?'#3b281814':'#ffffff18';ctx.beginPath();ctx.moveTo(0,i*4);ctx.bezierCurveTo(70,i*4+7,180,i*4-5,256,i*4);ctx.stroke();}}const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(kind==='tile'?3:2,kind==='tile'?3:2);return t;};
  mats.floor.map=makeTexture('tile','#ddd2bc');mats.floor.color.set(0xffffff);mats.accent.map=makeTexture('wood','#947b5c');mats.accent.color.set(0xffffff);
  const addBox=(w,h,d,x,y,z,material=mats.wall)=>{const g=new THREE.BoxGeometry(w,h,d),o=new THREE.Mesh(g,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;};
  const site=BMH.state.project.site,W=Math.max(4,Number(site.width)||5),D=Math.max(8,Number(site.depth)||20),floors=Math.max(1,Number(site.floors)||1),fh=BMH.projectLevels().floorHeight,explode=BMH.state.ui.sceneExploded?1.25:0,focus=BMH.state.ui.sceneFocus||'all',classical=/tân cổ điển|tan co dien|neoclassic|classical|cổ điển|co dien/i.test(BMH.state.project.style||'');
  // landscape
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(28,W+18),Math.max(42,D+18)),mats.ground);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const lawn=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(8,W+5),Math.max(14,D+5)),mats.green);lawn.rotation.x=-Math.PI/2;lawn.position.y=.012;lawn.receiveShadow=true;scene.add(lawn);
  addBox(Math.min(2.2,W*.42),.035,D+2,-W*.22,.04,0,mat(0xb9aa91,.95));
  const tree=(x,z,s=1)=>{addBox(.18*s,1.5*s,.18*s,x,.75*s,z,mat(0x6d523d,.95));const crown=new THREE.Mesh(new THREE.SphereGeometry(.72*s,16,12),mats.green);crown.position.set(x,1.85*s,z);crown.castShadow=true;scene.add(crown);};
  tree(-W/2-2,-D/2+3,.9);tree(W/2+2,D/2-3,1.05);tree(W/2+2,-D/2+6,.7);
  const roomFurniture=(r,y)=>{
    if(BMH.addRoomSceneFurniture)return BMH.addRoomSceneFurniture(r,y,THREE,scene,mats,BMH.state.project.site);
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
  const wallHeight=BMH.projectLevels().clearHeight,wallT=.15;
  for(const f of visibleFloors){
    const geometry=BMH.scenePlanGeometry(roomFocus?{rooms:[roomFocus],openings:BMH.state.project.plan.openings}:BMH.state.project.plan,f);
    const base=roomFocus||floorFocus!==null?0:f*(fh+explode);
    for(const r of geometry.rooms){
      const cx=r.x+r.w/2-W/2,cz=r.y+r.h/2-D/2;
      addBox(r.w,.13,r.h,cx,base+.065,cz,r.type==='bath'?mat(0xc8cfcb,.5):mats.floor);
      roomFurniture(r,base+.13);
      if(focus==='all')addBox(r.w,BMH.projectLevels().slab,r.h,cx,base+wallHeight+BMH.projectLevels().slab/2,cz,mats.slab);
    }
    for(const w of geometry.walls){
      const len=w.b-w.a,mid=(w.a+w.b)/2;
      const x=w.horizontal?mid-W/2:w.axis-W/2;
      const z=w.horizontal?w.axis-D/2:mid-D/2;
      const segment=(h,cy,material=mats.wall)=>addBox(w.horizontal?len:wallT,h,w.horizontal?wallT:len,x,base+cy,z,material);
      if(w.kind==='door'){
        const oh=Math.min(w.height,wallHeight);segment(wallHeight-oh,oh+(wallHeight-oh)/2);
        const jamb=(v)=>addBox(w.horizontal?.055:wallT,oh,w.horizontal?wallT:.055,
          w.horizontal?v-W/2:x,base+oh/2,w.horizontal?z:v-D/2,mats.frame);
        jamb(w.a);jamb(w.b);
        const leaf=addBox(w.horizontal?len-.10:.055,oh-.08,w.horizontal?.055:len-.10,x,base+oh/2,z,mats.accent);if(roomFocus)leaf.rotation.y=.5;
      }else if(w.kind==='window'){
        const sill=w.sill,oh=Math.min(w.height,Math.max(.1,wallHeight-sill)),top=sill+oh;segment(sill,sill/2);segment(Math.max(.001,wallHeight-top),top+(wallHeight-top)/2);segment(oh,sill+oh/2,mats.glass);
        for(const v of [w.a,w.b,mid])addBox(w.horizontal?.045:.07,oh,w.horizontal?.07:.045,w.horizontal?v-W/2:x,base+sill+oh/2,w.horizontal?z:v-D/2,mats.frame);
        addBox(w.horizontal?len:.045,.045,w.horizontal?.045:len,x,base+sill,z,mats.frame);
        addBox(w.horizontal?len:.045,.045,w.horizontal?.045:len,x,base+top,z,mats.frame);
      }else{
        // Cut away the near side in an isolated room so the interior stays visible.
        const focusRooms=geometry.rooms,maxY=Math.max(...focusRooms.map(r=>r.y+r.h)),maxX=Math.max(...focusRooms.map(r=>r.x+r.w));const near=(roomFocus||floorFocus!==null)&&(w.horizontal?w.axis>=maxY-.02:w.axis>=maxX-.02);
        segment(near?.72:wallHeight,(near?.72:wallHeight)/2);
      }
    }
  }
  const topRooms=BMH.state.project.plan.rooms.filter(r=>Number(r.floor)===floors-1),topBounds=BMH.sceneFootprintBounds(topRooms);
  if(focus==='all'&&topBounds?.rectangular&&(classical||['gable','wide','arch','classic'].includes(BMH.houseStyle?.()?.form))){
    const depth=topBounds.depth,width=topBounds.width+.40,roofDepth=depth+.40,cx=topBounds.cx-W/2,cz=topBounds.cy-D/2,eave=(floors-1)*(fh+explode)+wallHeight+.18,rise=Math.min(2.7,Math.max(.7,Math.min(width,depth)*.31)),hw=width/2,hd=roofDepth/2;
    const corners=[[cx-hw,eave,cz-hd],[cx+hw,eave,cz-hd],[cx+hw,eave,cz+hd],[cx-hw,eave,cz+hd]];
    const ridge=roofDepth>=width?[[cx,eave+rise,cz-(roofDepth-width)/2],[cx,eave+rise,cz+(roofDepth-width)/2]]:[[cx-(width-roofDepth)/2,eave+rise,cz],[cx+(width-roofDepth)/2,eave+rise,cz]];
    const faces=roofDepth>=width?[[corners[0],corners[1],ridge[0]],[corners[0],ridge[0],ridge[1],corners[3]],[corners[1],corners[2],ridge[1],ridge[0]],[corners[3],ridge[1],corners[2]]]:[[corners[0],corners[3],ridge[0]],[corners[0],ridge[0],ridge[1],corners[1]],[corners[3],corners[2],ridge[1],ridge[0]],[corners[1],ridge[1],corners[2]]];
    mats.roof.side=THREE.DoubleSide;
    for(const polygon of faces){const coords=[];for(let i=1;i<polygon.length-1;i++)coords.push(...polygon[0],...polygon[i],...polygon[i+1]);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mats.roof);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}
    addBox(width,.12,roofDepth,cx,eave-.08,cz,mats.dark);
  }
  const centerRoom=roomFocus?new THREE.Vector3(roomFocus.x+roomFocus.w/2-W/2,1.12,roomFocus.y+roomFocus.h/2-D/2):null;
  const state={yaw:Math.PI-.55,pitch:.42,dist:roomFocus?Math.max(4.2,Math.max(roomFocus.w,roomFocus.h)*1.45):Math.max(12,Math.max(W,D)*1.05),target:centerRoom||new THREE.Vector3(0,floorFocus!==null?1.2:floors*fh*.42,-D*.16),drag:false,lastX:0,lastY:0};
  const updateCamera=()=>{const cp=Math.cos(state.pitch),sp=Math.sin(state.pitch),cy=Math.cos(state.yaw),sy=Math.sin(state.yaw);camera.position.set(state.target.x+state.dist*cp*sy,state.target.y+state.dist*sp,state.target.z+state.dist*cp*cy);camera.lookAt(state.target);const current=BMH.studio3d;if(current?.renderer===renderer&&!current.raf)current.raf=requestAnimationFrame(()=>{if(BMH.studio3d!==current)return;current.raf=0;renderer.render(scene,camera);});};updateCamera();
  const resize=()=>{const r=stage.getBoundingClientRect(),w=Math.max(280,Math.floor(r.width)),h=Math.max(360,Math.floor(r.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();updateCamera();};resize();const ro=new ResizeObserver(resize);ro.observe(stage);
  const onDown=e=>{state.pan=e.button===2||e.shiftKey;state.drag=true;state.lastX=e.clientX;state.lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);};const onMove=e=>{if(!state.drag)return;const dx=e.clientX-state.lastX,dy=e.clientY-state.lastY;state.lastX=e.clientX;state.lastY=e.clientY;if(state.pan){state.target.x-=dx*state.dist*.001;state.target.z-=dy*state.dist*.001;}else{state.yaw-=dx*.006;state.pitch=BMH.clamp(state.pitch-dy*.004,.12,1.12);}updateCamera();};const onUp=()=>{state.drag=false;};const onWheel=e=>{e.preventDefault();state.dist=BMH.clamp(state.dist*(1+Math.sign(e.deltaY)*.08),4,60);updateCamera();};canvas.oncontextmenu=e=>e.preventDefault();canvas.addEventListener('pointerdown',onDown);window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp);canvas.addEventListener('wheel',onWheel,{passive:false});
  const animate=()=>{renderer.render(scene,camera);};
  state.updateCamera=updateCamera;
  BMH.studio3d={scene,camera,renderer,state,ro,onDown,onMove,onUp,onWheel,raf:0};animate();stage.classList.add('three-ready');BMH.$('#studio3dLoading')?.remove();if(!visibleFloors.some(f=>BMH.floorRooms(f).length)){const message=document.createElement('div');message.className='studio-empty-floor';message.textContent='Tầng này chưa có phòng trong mặt bằng. Bổ sung ở Bước 4 để dựng 3D.';stage.appendChild(message);}
};
BMH.resetStudio3D = () => {const s=BMH.studio3d;if(!s)return;s.state.yaw=Math.PI-.55;s.state.pitch=.42;const focus=BMH.state.ui.sceneFocus||'all',r=focus.startsWith('room:')?BMH.state.project.plan.rooms.find(x=>x.id===focus.slice(5)):null;s.state.dist=r?Math.max(4.2,Math.max(r.w,r.h)*1.45):Math.max(18,(Number(BMH.state.project.site.depth)||20)*1.15);s.state.updateCamera();};
BMH.cinematicSignature = () => {
  const p=BMH.state.project;
  return JSON.stringify({style:p.style,focus:BMH.state.ui?.sceneFocus||'all',site:{width:p.site.width,depth:p.site.depth,floors:p.site.floors,floorHeight:p.site.floorHeight,slabThickness:p.site.slabThickness,ceilingDrop:p.site.ceilingDrop,frontDirection:p.site.frontDirection},materials:p.materials?.choices||{},productCodes:Object.values(p.materials?.choices||{}).map(id=>[id,p.dataEngine?.materialOverrides?.[id]?.sku||'']),tier:p.materials?.tier,rooms:p.plan.rooms.map(r=>[r.id,r.floor,r.name,r.type,r.x,r.y,r.w,r.h,r.furnitureRotation,r.stairDirection]),openings:(p.plan.openings||[]).map(o=>[o.floor,o.roomId,o.kind,o.side,o.offset,o.width,o.height,o.sill])});
};
BMH.generateCinematicRender = async () => {
  if(BMH.cinematicRender.loading)return;
  const canvas=BMH.$('#studio3dCanvas'),scene=BMH.studio3d;
  let screenshot;
  try{screenshot=scene?scene.renderer.domElement.toDataURL('image/jpeg',.8):await BMH.capturePlanReference();}catch(err){BMH.toast(err.message||'Không tạo được ảnh tham chiếu.');return;}
  const signature=BMH.cinematicSignature(),p=BMH.state.project;
  const selectedMaterials=Object.fromEntries(Object.entries(p.materials.choices||{}).map(([cat,id])=>{const name=(BMH.MATERIALS[cat]||[]).find(x=>x.id===id)?.name||id,sku=p.dataEngine?.materialOverrides?.[id]?.sku;return [cat,sku?`${name} · SKU ${sku}`:name];}));
  const focus=BMH.state.ui?.sceneFocus||'all',focusedRoom=focus.startsWith('room:')?p.plan.rooms.find(r=>r.id===focus.slice(5)):null;
  const payload={image:screenshot,project:{referenceKind:scene?'model':'drawing',style:p.style,styleDescription:BMH.houseStyle?.()?.description||'',view:{kind:focusedRoom?'room':focus.startsWith('floor:')?'floor':'house',roomName:focusedRoom?.name||'',roomType:focusedRoom?.type||'',floor:focusedRoom?.floor??(focus.startsWith('floor:')?Number(focus.slice(6)):0)},site:{width:p.site.width,depth:p.site.depth,floors:p.site.floors,floorHeight:p.site.floorHeight,slabThickness:p.site.slabThickness,ceilingDrop:p.site.ceilingDrop,frontDirection:p.site.frontDirection},materials:{choices:selectedMaterials},rooms:p.plan.rooms.map(r=>({id:r.id,furnitureRotation:r.furnitureRotation,stairDirection:r.stairDirection,furniture:BMH.roomFurnitureLayout?.(r)||[],name:r.name,type:r.type,floor:r.floor,x:r.x,y:r.y,w:r.w,h:r.h})),openings:(p.plan.openings||[]).map(o=>({roomId:o.roomId,kind:o.kind,side:o.side,offset:o.offset,width:o.width,height:o.height,sill:o.sill}))}};
  BMH.cinematicRender.loading=true;BMH.cinematicRender.error='';BMH.render({preserveScroll:true});
  try{
    const r=await fetch('/api/gemini-render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`Render HTTP ${r.status}`);if(!data.image)throw new Error('Gemini không trả về ảnh render.');
    if(signature!==BMH.cinematicSignature()){BMH.toast('Thiết kế đã đổi khi đang render. Hãy tạo lại phối cảnh cho phương án mới.');BMH.cinematicRender.error='Thiết kế đã thay đổi; dừng tạo ảnh để tránh dùng sai phương án.';return;}
    const mime=['image/jpeg','image/png','image/webp'].includes(data.mimeType)?data.mimeType:'image/jpeg';
    BMH.cinematicRender.dataUrl=`data:${mime};base64,${data.image}`;BMH.cinematicRender.signature=signature;BMH.cinematicRender.views[signature]=BMH.cinematicRender.dataUrl;BMH.cinematicRender.generatedAt=data.generatedAt||new Date().toISOString();BMH.cinematicRender.error='';
  }catch(err){BMH.cinematicRender.error=err.message||String(err);BMH.toast(BMH.cinematicRender.error);}finally{BMH.cinematicRender.loading=false;BMH.render({preserveScroll:true});}
};
