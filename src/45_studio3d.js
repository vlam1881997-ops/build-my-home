/* V5.0.3 Studio 3D — accurate browser scene + optional Gemini cinematic render */
BMH.threePromise=null;
BMH.studio3d=null;
BMH.cinematicRender=BMH.cinematicRender||{loading:false,dataUrl:'',error:'',generatedAt:''};
BMH.ensureThree = () => {
  if(window.THREE)return Promise.resolve(window.THREE);
  if(BMH.threePromise)return BMH.threePromise;
  const urls=[
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
  const accent=tier==='premium'?0x7a604d:tier==='economy'?0x9a8a73:0x806a57;
  return {floor,wall,frame,accent,glass:0xa9c8cf,green:0x6f8666,ground:0xd9d1c3};
};
BMH.studio3DHtml = () => {
  const ui=BMH.state.ui,p=BMH.state.project,e=BMH.estimate(),review=BMH.designReview();
  const roomOptions=p.plan.rooms.map(r=>`<option value="room:${r.id}" ${ui.sceneFocus===`room:${r.id}`?'selected':''}>T${r.floor+1} · ${BMH.esc(r.name)}</option>`).join('');
  const hero=BMH.cinematicRender.dataUrl||'assets/rooms/facade-render.jpg';
  return `<section class="cinematic-primary-studio">
    <div class="cinematic-primary-visual">
      <img src="${hero}" alt="Phối cảnh ngôi nhà theo phương án hiện tại">
      <div class="cinematic-primary-shade"></div>
      <div class="cinematic-primary-copy"><span>PHỐI CẢNH TRẢI NGHIỆM</span><h2>Hình dung ngôi nhà trước khi bước vào chi tiết kỹ thuật.</h2><p>${BMH.cinematicRender.dataUrl?'Phối cảnh AI được tạo từ mô hình hiện tại.':'Phối cảnh tham khảo được dùng làm lớp cảm xúc; mô hình kỹ thuật nằm phía dưới.'}</p></div>
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
  <details class="technical-3d-panel">
    <summary><span><b>◎ Mở mô hình 3D kỹ thuật tương tác</b><small> Xoay, zoom, tách tầng, xem từng phòng và đối chiếu hình học.</small></span><em>Chi tiết kỹ thuật ↓</em></summary>
    <section class="studio-3d-shell technical-mode">
      <div class="studio-3d-stage" id="studio3dStage">
        <div class="studio-3d-loading" id="studio3dLoading"><i>⌂</i><b>Đang dựng mô hình từ mặt bằng thật…</b><span>Nếu WebGL/CDN bị chặn, hệ thống vẫn giữ phối cảnh dự phòng ở phía trên.</span></div>
        <canvas id="studio3dCanvas" aria-label="Mô hình 3D ngôi nhà"></canvas>
        <div class="studio-3d-fallback"><img src="assets/rooms/facade-render.jpg" alt="Phối cảnh tham khảo"><span>Ảnh tham khảo dự phòng · chưa dùng để đo kích thước</span></div>
        <div class="studio-3d-topbar"><div class="studio-view-tabs"><button class="${ui.sceneFocus==='all'?'active':''}" data-scene-focus-btn="all">Toàn nhà</button>${Array.from({length:p.site.floors},(_,i)=>`<button class="${ui.sceneFocus===`floor:${i}`?'active':''}" data-scene-focus-btn="floor:${i}">Tầng ${i+1}</button>`).join('')}<select data-scene-focus><option value="all">Chọn phòng…</option>${roomOptions}</select></div><div class="studio-view-actions"><button data-scene-theme>${ui.sceneTheme==='day'?'☀ Ban ngày':'☾ Ban đêm'}</button><button data-scene-explode class="${ui.sceneExploded?'active':''}">${ui.sceneExploded?'Ghép tầng':'Tách tầng'}</button><button data-studio3d-reset>⌂ Góc đẹp</button></div></div>
        <div class="studio-3d-hud"><span><small>Tổng dự toán</small><b>${BMH.money(e.total)}</b></span><span><small>Diện tích</small><b>${BMH.num(BMH.planArea())} m²</b></span><span><small>Tiện nghi</small><b>${review.function}/100</b></span></div>
        <div class="studio-3d-tip">Kéo chuột để xoay · lăn chuột để zoom · chọn từng phòng để bước vào không gian</div>
      </div>
    </section>
  </details>`;
};
BMH.disposeStudio3D = () => {
  const s=BMH.studio3d;if(!s)return;
  try{s.raf&&cancelAnimationFrame(s.raf);s.ro?.disconnect?.();s.renderer?.dispose?.();s.renderer?.domElement?.removeEventListener?.('pointerdown',s.onDown);window.removeEventListener('pointermove',s.onMove);window.removeEventListener('pointerup',s.onUp);s.renderer?.domElement?.removeEventListener?.('wheel',s.onWheel);}catch(_){}
  BMH.studio3d=null;
};
BMH.mountStudio3D = async () => {
  const canvas=BMH.$('#studio3dCanvas'),stage=BMH.$('#studio3dStage');if(!canvas||!stage)return;
  BMH.disposeStudio3D();const THREE=await BMH.ensureThree();if(BMH.$('#studio3dCanvas')!==canvas)return;if(!THREE){stage.classList.add('three-failed');BMH.$('#studio3dLoading')?.remove();return;}
  const palette=BMH.scenePalette(),scene=new THREE.Scene();scene.background=new THREE.Color(BMH.state.ui.sceneTheme==='night'?0x18222e:0xeaf3f5);scene.fog=new THREE.Fog(scene.background,45,110);
  const camera=new THREE.PerspectiveCamera(42,1,.1,140);let renderer;
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false,preserveDrawingBuffer:true});}catch{stage.classList.add('three-failed');BMH.$('#studio3dLoading')?.remove();return;}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=BMH.state.ui.sceneTheme==='night'?1.25:1.45;
  const hemi=new THREE.HemisphereLight(BMH.state.ui.sceneTheme==='night'?0x8da4cf:0xffffff,0x9ba49b,BMH.state.ui.sceneTheme==='night'?1.1:2.15);scene.add(hemi);
  const sun=new THREE.DirectionalLight(BMH.state.ui.sceneTheme==='night'?0xb8c7ff:0xfff0d5,BMH.state.ui.sceneTheme==='night'?1.6:2.85);sun.position.set(-12,22,10);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.bias=-.0002;sun.shadow.camera.left=-25;sun.shadow.camera.right=25;sun.shadow.camera.top=30;sun.shadow.camera.bottom=-20;scene.add(sun);
  const fill=new THREE.DirectionalLight(0xe5f4ff,BMH.state.ui.sceneTheme==='night'?.4:.9);fill.position.set(12,10,-8);scene.add(fill);
  const warm=new THREE.PointLight(0xffb66a,BMH.state.ui.sceneTheme==='night'?8:0,24,2);warm.position.set(0,4,1);scene.add(warm);
  const mat=(color,rough=.75,metal=.02,opacity=1)=>new THREE.MeshStandardMaterial({color,roughness:rough,metalness:metal,transparent:opacity<1,opacity});
  const mats={wall:mat(palette.wall,.82),slab:mat(0xd8d0c4,.88),frame:mat(palette.frame,.45,.22),glass:new THREE.MeshPhysicalMaterial({color:palette.glass,roughness:.08,metalness:.05,transmission:.3,transparent:true,opacity:.62}),floor:mat(palette.floor,.62),accent:mat(palette.accent,.65),ground:mat(palette.ground,1),green:mat(palette.green,.95),dark:mat(0x4a4f4b,.75),roof:mat(0x303c48,.85),rail:mat(0x9a7b49,.37,.62)};
  const addBox=(w,h,d,x,y,z,material=mats.wall)=>{const g=new THREE.BoxGeometry(w,h,d),o=new THREE.Mesh(g,material);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;scene.add(o);return o;};
  const site=BMH.state.project.site,W=Math.max(4,Number(site.width)||5),D=Math.max(8,Number(site.depth)||20),floors=Math.max(1,Number(site.floors)||1),fh=3.25,explode=BMH.state.ui.sceneExploded?1.25:0,focus=BMH.state.ui.sceneFocus||'all',classical=/tân cổ điển|tan co dien|neoclassic|classical|cổ điển|co dien/i.test(BMH.state.project.style||'');
  // landscape
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(28,W+18),Math.max(42,D+18)),mats.ground);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const lawn=new THREE.Mesh(new THREE.PlaneGeometry(Math.max(8,W+5),Math.max(14,D+5)),mats.green);lawn.rotation.x=-Math.PI/2;lawn.position.y=.012;lawn.receiveShadow=true;scene.add(lawn);
  addBox(Math.min(2.2,W*.42),.035,D+2,-W*.22,.04,0,mat(0xb9aa91,.95));
  const tree=(x,z,s=1)=>{addBox(.18*s,1.5*s,.18*s,x,.75*s,z,mat(0x6d523d,.95));const crown=new THREE.Mesh(new THREE.SphereGeometry(.72*s,16,12),mats.green);crown.position.set(x,1.85*s,z);crown.castShadow=true;scene.add(crown);};
  tree(-W/2-2,-D/2+3,.9);tree(W/2+2,D/2-3,1.05);tree(W/2+2,-D/2+6,.7);
  const floorRooms=f=>BMH.state.project.plan.rooms.filter(r=>r.floor===f);
  const hipRoof=(width,depth,centerZ,eave,rise)=>{
    const hw=width/2,hd=depth/2,frontL=[-hw,eave,centerZ-hd],frontR=[hw,eave,centerZ-hd],backR=[hw,eave,centerZ+hd],backL=[-hw,eave,centerZ+hd];
    const ridge=depth>=width?[[0,eave+rise,centerZ-(depth-width)/2],[0,eave+rise,centerZ+(depth-width)/2]]:[[-(width-depth)/2,eave+rise,centerZ],[(width-depth)/2,eave+rise,centerZ]];
    const faces=depth>=width?[[frontL,frontR,ridge[0]],[frontL,ridge[0],ridge[1],backL],[frontR,backR,ridge[1],ridge[0]],[backL,ridge[1],backR]]:[[frontL,backL,ridge[0]],[frontL,ridge[0],ridge[1],frontR],[backL,backR,ridge[1],ridge[0]],[frontR,ridge[1],backR]];
    for(const polygon of faces){const coords=[];for(let i=1;i<polygon.length-1;i++)coords.push(...polygon[0],...polygon[i],...polygon[i+1]);const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.computeVertexNormals();const mesh=new THREE.Mesh(geo,mats.roof);mesh.material.side=THREE.DoubleSide;mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);}
    addBox(width,.14,depth,0,eave-.09,centerZ,mats.dark);
  };
  const buildWhole=()=>{
    for(let f=0;f<floors;f++){
      const y=f*(fh+explode),rooms=floorRooms(f),usedDepth=Math.min(D,Math.max(7,...rooms.map(r=>r.y+r.h))),bw=W,bd=usedDepth;
      addBox(bw,.16,bd,0,y+.08,(bd-D)/2,mats.slab);
      // side and rear walls
      addBox(.16,fh,bd,-bw/2,y+fh/2,(bd-D)/2,mats.wall);addBox(.16,fh,bd,bw/2,y+fh/2,(bd-D)/2,mats.wall);addBox(bw,fh,.16,0,y+fh/2,-D/2+bd,mats.wall);
      // front facade with generous glazing and warm accent
      const frontZ=-D/2+.10;addBox(bw,fh,.12,0,y+fh/2,frontZ,mats.wall);
      const glassW=Math.max(1.15,bw*.26),cols=Math.max(2,Math.floor(bw/1.8));for(let i=0;i<cols;i++){const x=-bw/2+(i+.5)*bw/cols;const win=addBox(glassW,1.45,.09,x,y+1.75,frontZ-.075,mats.glass);win.castShadow=false;addBox(glassW+.08,.055,.12,x,y+2.49,frontZ-.11,mats.frame);}
      if(f>0){addBox(Math.min(bw*.58,3.2),.12,1.25,bw*.12,y+.95,frontZ-.72,mats.slab);for(let i=0;i<5;i++)addBox(.04,.75,.04,bw*.12-Math.min(bw*.5,2.7)/2+i*Math.min(bw*.5,2.7)/4,y+1.3,frontZ-1.25,mats.frame);addBox(Math.min(bw*.55,3.0),.06,.04,bw*.12,y+1.68,frontZ-1.25,mats.frame);}
      addBox(Math.min(.9,bw*.2),fh*.86,.13,-bw*.28,y+fh*.48,frontZ-.10,mats.accent);
      if(classical){
        addBox(bw+.35,.15,.58,0,y+.17,frontZ-.25,mats.slab);addBox(bw+.28,.18,.48,0,y+fh-.16,frontZ-.20,mats.slab);
        for(const x of [-bw*.42,bw*.42]){addBox(.28,fh*.82,.28,x,y+fh*.52,frontZ-.36,mats.wall);addBox(.48,.15,.47,x,y+.27,frontZ-.36,mats.slab);addBox(.5,.16,.49,x,y+fh-.27,frontZ-.36,mats.slab);}
        if(f>0){const bwRail=Math.min(bw*.6,3.5),bx=bw*.12,bz=frontZ-1.33;for(let i=0;i<=8;i++)addBox(.045,.72,.045,bx-bwRail/2+i*bwRail/8,y+1.32,bz,mats.rail);addBox(bwRail,.065,.065,bx,y+1.69,bz,mats.rail);}
      }
    }
    const top=(floors-1)*(fh+explode)+fh,bd=Math.min(D,Math.max(7,...floorRooms(floors-1).map(r=>r.y+r.h))),cz=(bd-D)/2;
    if(classical)hipRoof(W+.8,bd+.8,cz,top+.28,Math.min(2.7,Math.max(1.25,Math.min(W,bd)*.31)));
    else{addBox(W+.25,.18,bd,0,top+.08,cz,mats.slab);addBox(Math.min(W*.46,2.8),1.25,.16,W*.17,top+.7,-D/2+.4,mats.accent);for(let i=0;i<5;i++)addBox(.08,.9,2.5,-W*.25+i*.55,top+.55,-D/2+1.7,mats.dark);}
  };
  const roomFurniture=(r,y,z0)=>{const cx=r.x+r.w/2-W/2,cz=r.y+r.h/2-D/2;
    if(r.type==='living'){addBox(Math.min(2.2,r.w*.6),.45,.85,cx,y+.28,cz+.35,mat(0xa7896d,.9));addBox(1.0,.32,.58,cx,y+.18,cz-.8,mat(0x755f4d,.85));}
    if(r.type==='bed'){addBox(Math.min(2,r.w*.72),.32,Math.min(2.15,r.h*.58),cx,y+.22,cz,mat(0xe3d7c5,.95));addBox(Math.min(2,r.w*.72),.62,.12,cx,y+.55,cz-Math.min(2.15,r.h*.58)/2,mat(0x8b6c58,.75));}
    if(r.type==='kitchen'){addBox(Math.min(2.4,r.w*.7),.88,.62,cx,y+.44,cz+r.h*.25,mat(0xb7a38a,.55));addBox(1.25,.76,.7,cx,y+.38,cz-.45,mat(0x7f6d5a,.8));}
    if(r.type==='bath'){addBox(.48,.42,.72,cx-.35,y+.23,cz,mat(0xf0eee8,.25));addBox(.5,.74,.4,cx+.35,y+.38,cz+.28,mat(0xe6e8e7,.25));}
  };
  const buildFloor=f=>{const y=.12,rooms=floorRooms(f);for(const r of rooms){const cx=r.x+r.w/2-W/2,cz=r.y+r.h/2-D/2;const floorMat=r.type==='bath'?mat(0xc9d0cc,.45):mats.floor;addBox(r.w,.10,r.h,cx,.05,cz,floorMat);const h=2.75,t=.09;addBox(r.w,h,t,cx,h/2,cz-r.h/2,mats.wall);addBox(r.w,h,t,cx,h/2,cz+r.h/2,mats.wall);addBox(t,h,r.h,cx-r.w/2,h/2,cz,mats.wall);addBox(t,h,r.h,cx+r.w/2,h/2,cz,mats.wall);roomFurniture(r,y,cz);}}
  const buildRoom=r=>{const y=.12,cx=0,cz=0;addBox(r.w,.10,r.h,cx,.05,cz,mats.floor);const h=2.8,t=.09;addBox(r.w,h,t,cx,h/2,-r.h/2,mats.wall);addBox(r.w,h,t,cx,h/2,r.h/2,mats.wall);addBox(t,h,r.h,-r.w/2,h/2,0,mats.wall);addBox(t,h,r.h,r.w/2,h/2,0,mats.wall);const rr={...r,x:W/2-r.w/2,y:D/2-r.h/2};roomFurniture(rr,y,0);addBox(Math.min(1.5,r.w*.5),1.3,.04,0,1.6,-r.h/2-.06,mats.glass);}
  if(focus.startsWith('floor:'))buildFloor(BMH.clamp(Number(focus.split(':')[1])||0,0,floors-1));else if(focus.startsWith('room:')){const r=BMH.state.project.plan.rooms.find(x=>x.id===focus.slice(5));r?buildRoom(r):buildWhole();}else buildWhole();
  const state={yaw:-2.5,pitch:.52,dist:focus.startsWith('room:')?8:Math.max(18,D*.92),target:new THREE.Vector3(0,focus.startsWith('room:')?1.1:floors*fh*.42,focus.startsWith('room:')?0:-1.2),drag:false,lastX:0,lastY:0};
  const updateCamera=()=>{const cp=Math.cos(state.pitch),sp=Math.sin(state.pitch),cy=Math.cos(state.yaw),sy=Math.sin(state.yaw);camera.position.set(state.target.x+state.dist*cp*sy,state.target.y+state.dist*sp,state.target.z+state.dist*cp*cy);camera.lookAt(state.target);};updateCamera();
  const resize=()=>{const r=stage.getBoundingClientRect(),w=Math.max(280,Math.floor(r.width)),h=Math.max(360,Math.floor(r.height));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};resize();const ro=new ResizeObserver(resize);ro.observe(stage);
  const onDown=e=>{state.drag=true;state.lastX=e.clientX;state.lastY=e.clientY;canvas.setPointerCapture?.(e.pointerId);};const onMove=e=>{if(!state.drag)return;const dx=e.clientX-state.lastX,dy=e.clientY-state.lastY;state.lastX=e.clientX;state.lastY=e.clientY;state.yaw-=dx*.006;state.pitch=BMH.clamp(state.pitch-dy*.004,.12,1.12);updateCamera();};const onUp=()=>{state.drag=false;};const onWheel=e=>{e.preventDefault();state.dist=BMH.clamp(state.dist*(1+Math.sign(e.deltaY)*.08),4,60);updateCamera();};canvas.addEventListener('pointerdown',onDown);window.addEventListener('pointermove',onMove);window.addEventListener('pointerup',onUp);canvas.addEventListener('wheel',onWheel,{passive:false});
  const animate=()=>{renderer.render(scene,camera);BMH.studio3d.raf=requestAnimationFrame(animate);};
  BMH.studio3d={scene,camera,renderer,state,ro,onDown,onMove,onUp,onWheel,raf:0};animate();stage.classList.add('three-ready');BMH.$('#studio3dLoading')?.remove();
};
BMH.resetStudio3D = () => {const s=BMH.studio3d;if(!s)return;s.state.yaw=-2.5;s.state.pitch=.52;s.state.dist=(BMH.state.ui.sceneFocus||'all').startsWith('room:')?8:Math.max(18,(Number(BMH.state.project.site.depth)||20)*.92);};
BMH.cinematicSignature = () => {
  const p=BMH.state.project;
  return JSON.stringify({style:p.style,site:{width:p.site.width,depth:p.site.depth,floors:p.site.floors,frontDirection:p.site.frontDirection},materials:p.materials?.choices||{},productCodes:Object.values(p.materials?.choices||{}).map(id=>[id,p.dataEngine?.materialOverrides?.[id]?.sku||'']),tier:p.materials?.tier,rooms:p.plan.rooms.map(r=>[r.floor,r.name,r.type,r.x,r.y,r.w,r.h])});
};
BMH.generateCinematicRender = async () => {
  if(BMH.cinematicRender.loading)return;
  const canvas=BMH.$('#studio3dCanvas'),scene=BMH.studio3d;
  if(!canvas||!scene){BMH.toast('Mô hình 3D chưa sẵn sàng để render.');return;}
  let screenshot;
  try{screenshot=scene.renderer.domElement.toDataURL('image/jpeg',.8);}catch{BMH.toast('Không chụp được mô hình 3D trên thiết bị này.');return;}
  const signature=BMH.cinematicSignature(),p=BMH.state.project;
  const selectedMaterials=Object.fromEntries(Object.entries(p.materials.choices||{}).map(([cat,id])=>{const name=(BMH.MATERIALS[cat]||[]).find(x=>x.id===id)?.name||id,sku=p.dataEngine?.materialOverrides?.[id]?.sku;return [cat,sku?`${name} · SKU ${sku}`:name];}));
  const payload={image:screenshot,project:{style:p.style,site:{width:p.site.width,depth:p.site.depth,floors:p.site.floors,frontDirection:p.site.frontDirection},materials:{choices:selectedMaterials},rooms:p.plan.rooms.map(r=>({name:r.name,type:r.type,floor:r.floor,w:r.w,h:r.h}))}};
  BMH.cinematicRender.loading=true;BMH.cinematicRender.error='';BMH.render({preserveScroll:true});
  try{
    const r=await fetch('/api/gemini-render',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`Render HTTP ${r.status}`);if(!data.image)throw new Error('Gemini không trả về ảnh render.');
    if(signature!==BMH.cinematicSignature()){BMH.toast('Thiết kế đã đổi khi đang render. Hãy tạo lại phối cảnh cho phương án mới.');return;}
    const mime=['image/jpeg','image/png','image/webp'].includes(data.mimeType)?data.mimeType:'image/jpeg';
    BMH.cinematicRender.dataUrl=`data:${mime};base64,${data.image}`;BMH.cinematicRender.signature=signature;BMH.cinematicRender.generatedAt=data.generatedAt||new Date().toISOString();BMH.cinematicRender.error='';
  }catch(err){BMH.cinematicRender.error=err.message||String(err);BMH.toast(BMH.cinematicRender.error);}finally{BMH.cinematicRender.loading=false;BMH.render({preserveScroll:true});}
};
