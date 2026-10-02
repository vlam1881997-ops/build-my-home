/* Detailed generic furniture in metres. These are visual assets, not product SKUs. */
BMH.roomSurfaceStyle=id=>{
 const p=BMH.state.project,r=p.plan.rooms.find(r=>r.id===id),surface=BMH.finishPalette?.(id)?.surface;
 return ['wood','tile','stone'].includes(surface)?surface:/Japandi/i.test(p.style||'')&&['living','bed'].includes(r?.type)?'wood':'tile';
};
BMH.sceneSurfaceTexture = (THREE, kind, channel='color') => {
 if(typeof document==='undefined'||typeof document.createElement!=='function')return null;
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');if(!ctx)return null;
 const pixels=ctx.createImageData(256,256);
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const raw=Math.sin(x*12.9898+y*78.233)*43758.5453,n=raw-Math.floor(raw),grain=Math.sin(y*.20+Math.sin(x*.018)*2+Math.sin(x*.067)*.5);let value=248,height=.5,rough=.85;
  if(kind==='wood'||kind==='plank'||kind==='woodVertical'){const cross=kind==='woodVertical'?x:y,along=kind==='woodVertical'?y:x,vein=Math.sin(cross*.20+Math.sin(along*.024)*2+Math.sin(along*.071)*.65),ring=Math.sin(cross*.72+Math.sin(along*.017)*5);height=.5+vein*.06+n*.025;value=239+vein*6+ring*1.2+n*3;rough=.75+n*.055;if(kind==='plank'&&y<2){value=205;height=.1;rough=.95;}}
  else if(kind==='fabric'){const weave=(x%4<2?1:0)+(y%4<2?1:0);value=222+weave*12+n*5;height=.3+weave*.22+n*.08;rough=.95;}
  else if(kind==='tile'||kind==='stone'){const vein=Math.sin(x*.033+Math.sin(y*.023)*3),seam=kind==='tile'&&(x<2||y<2);value=seam?190:245+vein*6+n*3;height=seam?.08:.55+n*.02;rough=seam?.95:kind==='stone'?.78:.65;}
  else{value=244+n*10;height=.35+n*.35;rough=.86+n*.08;}
  if(channel==='height')value=height*255;else if(channel==='roughness')value=rough*255;
  const i=(y*256+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;
 }
 ctx.putImageData(pixels,0,0);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=channel==='color'?THREE.SRGBColorSpace:THREE.NoColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;texture.userData={generic:true,kind,channel};return texture;
};

BMH.sceneAssetMaterials = (THREE, scene, finish = {}) => {
  const cache = scene.userData.finishMaterials ||= new Map();
  const key = JSON.stringify([finish.wall, finish.floor, finish.accent, finish.fabric, finish.surface]);
  if (cache.has(key)) return cache.get(key);
  const textures = scene.userData.surfaceTextures ||= new Map();
  const texture = (kind,channel='color') => {const key=kind+':'+channel;if(!textures.has(key))textures.set(key,BMH.sceneSurfaceTexture(THREE,kind,channel));return textures.get(key);};
  const make = (color, roughness, kind, scale) => {
    const m = new THREE.MeshStandardMaterial({color, roughness});
    if (kind) {
      m.map = texture(kind);
      if (m.map) {
        m.bumpMap = texture(kind,'height');m.roughnessMap=texture(kind,'roughness');
        m.bumpScale = kind === 'fabric' ? .0012 : kind === 'wood' ? .0006 : .0003;
      }
      m.userData.surfaceScale = scale;
    }
    return m;
  };
  const wood = finish.accent || '#98785a';
  const materials = {
    wood: make(wood, .58, 'wood', [.65, .38]),
    slattedWood: make(wood, .7, 'woodVertical', [.22, 2.4]),
    fabric: make(finish.fabric || '#d1c7b6', .96, 'fabric', [.18, .18]),
    linen: make('#f5f1e6', .98, 'fabric', [.18, .18]),
    pillow: make(finish.accent || '#7b8469', .97, 'fabric', [.18, .18]),
    wall: make(finish.wall || '#eee8dd', .9, 'plaster', [.35, .35]),
    tile: make(finish.floor || '#d8d1c3', .6, 'tile', [.6, .6]),
    plank: make(finish.floor || '#d3b998', .62, 'plank', [1.6,.18]),
    floorStone: make(finish.floor || '#d8d1c3', .72, 'stone', [.8,.8]),
    rug: make('#d4ccba', .99, 'fabric', [.2, .2]),
    stone: make('#e7e1d6', .38, 'plaster', [.5, .5]),
    white: make('#f4f2e9', .28),
    dark: make('#343b36', .4),
    green: make('#536b45', .85),
    leaf: make('#79935a', .85),
    metal: new THREE.MeshStandardMaterial({color:'#969080', roughness:.25, metalness:.8}),
    glass: new THREE.MeshPhysicalMaterial({color:'#dce5df', roughness:.06, transparent:true, opacity:.25, metalness:.08}),
    screen: new THREE.MeshPhysicalMaterial({color:'#14252a', roughness:.23, clearcoat:.7,envMapIntensity:.2}),
  };
  materials.floor=finish.surface==='wood'?materials.plank:finish.surface==='stone'?materials.floorStone:materials.tile;
  for (const material of Object.values(materials)) material.envMapIntensity = BMH.state?.ui?.sceneTheme === 'night' ? .3 : .65;
  cache.set(key, materials);
  return materials;
};

// Project texture coordinates in metres so adjoining surfaces keep their scale.
BMH.sceneSurfaceUvs = (geometry, material, origin = {x:0,y:0,z:0}) => {
  const scale = material?.userData?.surfaceScale;
  const p = geometry.attributes.position, n = geometry.attributes.normal, uv = geometry.attributes.uv;
  if (!scale || !p || !n || !uv) return geometry;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + origin.x, y = p.getY(i) + origin.y, z = p.getZ(i) + origin.z;
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    uv.setXY(i, (ax > ay && ax > az ? z : x) / scale[0], (ay >= ax && ay >= az ? z : y) / scale[1]);
  }
  uv.needsUpdate = true;
  return geometry;
};

// Soft window treatments stay inside the measured room and attach to its actual opening.
BMH.addWindowDrapery=(THREE,scene,r,base,site,overview=false)=>{
 if(!['living','bed'].includes(r.type))return;
 const levels=BMH.projectLevels(),materials=BMH.sceneAssetMaterials(THREE,scene,BMH.finishPalette?.(r.id)||{});
 for(const o of BMH.state.project.plan.openings.filter(o=>o.roomId===r.id&&o.kind==='window')){
  const span=BMH.openingWallSpan(o);if(!span)continue;const horizontal=span.o==='h',inward={north:1,south:-1,west:1,east:-1}[o.side],top=Math.min(levels.slab+levels.clearHeight,levels.slab+(o.sill??.9)+(o.height||1.4)+.15),bottom=levels.slab+.06,width=Math.min(.32,(span.b-span.a)*.20),near=overview&&['north','east'].includes(o.side);
  const material=materials.linen.clone();material.side=THREE.DoubleSide;if(near)material.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),base+.85)];
  for(const start of [span.a+.02,span.b-width-.02]){
   const geometry=new THREE.PlaneGeometry(width,top-bottom,20,2),positions=geometry.attributes.position;
   for(let i=0;i<positions.count;i++){const along=positions.getX(i)+width/2+start,h=positions.getY(i)+(top+bottom)/2,z=.05+Math.sin((along-start)/width*Math.PI*10)*.018;positions.setXYZ(i,horizontal?along-site.width/2:span.c+inward*z-site.width/2,base+h,horizontal?span.c+inward*z-site.depth/2:along-site.depth/2);}geometry.computeVertexNormals();BMH.sceneSurfaceUvs(geometry,material);const curtain=new THREE.Mesh(geometry,material);curtain.name='drapery-'+o.id+'-'+start;curtain.userData={kind:'window-drapery',roomId:r.id,openingId:o.id,floor:r.floor,generic:true};curtain.castShadow=curtain.receiveShadow=true;scene.add(curtain);
  }
 }
};

BMH.roomInteriorCamera = (room, items = BMH.roomFurnitureLayout(room)) => {
  const rotation = Number(room.furnitureRotation) || 0, angle = -rotation*Math.PI/180;
  const run = rotation%180===90 ? room.w : room.h;
  if (run < .8) return null;
  const distance = run*.64;
  let target = {x:room.x+room.w/2-Math.sin(angle)*run*.18,y:room.y+room.h/2-Math.cos(angle)*run*.18};
  const blocksView = (camera, item) => {
    if((item.base||0)+(item.h||0)<1.15||item.model==='shower')return false;
    let enter=0,leave=1;
    for(const [axis,start,end] of [['x',item.x-.025,item.x+item.w+.025],['y',item.y-.025,item.y+item.d+.025]]){
      const delta=target[axis]-camera[axis];
      if(Math.abs(delta)<1e-8){if(camera[axis]<start||camera[axis]>end)return false;continue;}
      const a=(start-camera[axis])/delta,b=(end-camera[axis])/delta;
      enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));
      if(enter>leave)return false;
    }
    return enter<.98&&leave>.02;
  };
  // Narrow bathrooms need a view along the fixtures rather than at the wall
  // above them. Rank clear positions using the actual placed equipment.
  if(room.type==='bath'&&items.length){
    const points=items.map(i=>({x:i.x+i.w/2,y:i.y+i.d/2}));
    target={x:points.reduce((sum,p)=>sum+p.x,0)/points.length,y:points.reduce((sum,p)=>sum+p.y,0)/points.length};
    let best=null;
    for(const [u,v] of [[.94,.86],[.06,.86],[.94,.5],[.06,.5],[.94,.14],[.06,.14],[.5,.86],[.5,.14]]){
      const camera={x:room.x+Math.max(.2,Math.min(room.w-.2,room.w*u)),y:room.y+Math.max(.2,Math.min(room.h-.2,room.h*v))};
      if(items.some(i=>camera.x>i.x-.08&&camera.x<i.x+i.w+.08&&camera.y>i.y-.08&&camera.y<i.y+i.d+.08)||items.some(i=>blocksView(camera,i)))continue;
      const dx=camera.x-target.x,dy=camera.y-target.y,horizontal=Math.hypot(dx,dy);
      if(horizontal<.5)continue;
      const visible=points.reduce((sum,p)=>{const px=p.x-camera.x,py=p.y-camera.y,cos=(-dx*px-dy*py)/(horizontal*Math.hypot(px,py));return sum+(cos>Math.cos(.5)?1:0);},0);
      const score=visible*10+horizontal;
      if(!best||score>best.score)best={score,camera,target,targetHeight:.65,yaw:Math.atan2(dx,dy),pitch:Math.atan2(.9,horizontal),distance:Math.hypot(horizontal,.9)};
    }
    if(best)return best;
  }
  for (const turn of [-.4,.4,-.65,.65,-.85,.85,0]) {
    const yaw = angle+turn, pitch=.13;
    const camera = {x:target.x+distance*Math.cos(pitch)*Math.sin(yaw),y:target.y+distance*Math.cos(pitch)*Math.cos(yaw)};
    if(camera.x<room.x+.12||camera.x>room.x+room.w-.12||camera.y<room.y+.12||camera.y>room.y+room.h-.12)continue;
    if(items.some(i=>camera.x>i.x-.08&&camera.x<i.x+i.w+.08&&camera.y>i.y-.08&&camera.y<i.y+i.d+.08))continue;
    if(items.some(i=>blocksView(camera,i)))continue;
    return {yaw,pitch,distance,target,camera};
  }
  return null;
};

BMH.addFurnitureContact = (THREE, scene, item, base, site) => {
  if(item.base>0 || typeof document==='undefined' || typeof document.createElement!=='function')return;
  if(!scene.userData.contactMaterial){
    const canvas=document.createElement('canvas');canvas.width=canvas.height=64;
    const ctx=canvas.getContext('2d'),pixels=ctx.createImageData(64,64);
    for(let y=0;y<64;y++)for(let x=0;x<64;x++){
      const edge=Math.max(Math.abs(x-31.5),Math.abs(y-31.5))/32;
      pixels.data[(y*64+x)*4+3]=Math.round(90*Math.pow(Math.max(0,1-edge),.7));
    }
    ctx.putImageData(pixels,0,0);
    scene.userData.contactMaterial=new THREE.MeshBasicMaterial({map:new THREE.CanvasTexture(canvas),transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
  }
  const plane=new THREE.Mesh(new THREE.PlaneGeometry(item.w,item.d),scene.userData.contactMaterial);
  plane.rotation.x=-Math.PI/2;
  plane.position.set(item.x+item.w/2-site.width/2,base+.02,item.y+item.d/2-site.depth/2);
  plane.userData={kind:'contact-shadow',roomId:item.roomId,model:item.model};
  scene.add(plane);
};

BMH.createRoomAsset = (model, d, THREE, m) => {
  const supported = /^(bedDouble|bedSingle|loungeDesignSofa|loungeChair|tableCoffee|table|desk|chair|chairDesk|cabinetTelevision|televisionModern|kitchenSink|kitchenStove|kitchenFridge|bookcaseClosedWide|cabinetBed|pottedPlant|bathroomSink|toilet|shower)$/;
  if (!supported.test(model) || !d || ![d.w,d.h,d.d].every(v => Number.isFinite(v) && v > 0)) return null;
  const root = new THREE.Group();
  root.name = model;
  let part = 0;
  const mesh = (geometry, material, x, y, z) => {
    BMH.sceneSurfaceUvs(geometry, material);
    const o = new THREE.Mesh(geometry, material);
    o.position.set(x, y, z);
    o.name = model + '-part-' + (++part);
    o.castShadow = o.receiveShadow = true;
    root.add(o);
    return o;
  };
  const box = (w,h,depth,x,y,z,material=m.wood,radius=.015) => mesh(
    THREE.RoundedBoxGeometry ? new THREE.RoundedBoxGeometry(w,h,depth,2,Math.min(radius,w*.49,h*.49,depth*.49)) : new THREE.BoxGeometry(w,h,depth), material,x,y,z);
  const cylinder = (top,bottom,h,x,y,z,material=m.wood) => mesh(new THREE.CylinderGeometry(top,bottom,h,24),material,x,y,z);
  const sphere = (w,h,depth,x,y,z,material) => {
    const o = mesh(new THREE.SphereGeometry(1,24,16),material,x,y,z);
    o.scale.set(w/2,h/2,depth/2);
    return o;
  };
  const legs = (height,w=d.w,depth=d.d,material=m.wood) => {
    for (const x of [-w/2+.075,w/2-.075]) for (const z of [-depth/2+.075,depth/2-.075]) cylinder(.025,.018,height,x,height/2,z,material);
  };
  const front = (width,height,y,z,count=2) => {
    for (let i=0;i<count;i++) {
      const w=width/count-.012,x=-width/2+(i+.5)*width/count;
      box(w,height,.026,x,y,z,m.wood,.006);
      box(.022,Math.min(.18,height*.4),.018,x+w*.36,y,z+(z<0?-.022:.022),m.metal,.006);
    }
  };
  if (/^lounge/.test(model)) {
    const chair=model==='loungeChair',arms=.13,seatW=d.w-2*arms;
    legs(.16,d.w-.1,d.d-.08,m.dark);
    box(d.w-.035,.2,d.d-.06,0,.27,0,m.fabric,.075);
    box(d.w-.035,.43,.17,0,d.h-.22,d.d/2-.095,m.fabric,.07);
    for(const x of [-d.w/2+arms/2,d.w/2-arms/2]) box(arms,.41,d.d-.035,x,.43,0,m.fabric,.06);
    const count=chair?1:2;
    for(let i=0;i<count;i++) {
      const x=-seatW/2+(i+.5)*seatW/count;
      box(seatW/count-.025,.16,d.d-.24,x,.45,-.055,m.fabric,.075);
      const back=box(seatW/count-.025,.31,.15,x,.67,d.d/2-.185,m.fabric,.06);
      back.rotation.x=-.12;
    }
    for (const [x,angle,material] of [[-seatW*.32,.16,m.linen],[seatW*.33,-.18,m.pillow]]) {
      const pillow=box(chair?.28:.33,.3,.12,x,.62,d.d/2-.31,material,.065);
      pillow.rotation.z=angle; pillow.rotation.x=.16;
    }
  } else if (/^bed/.test(model)) {
    legs(.16,d.w-.1,d.d-.05);
    box(d.w,.18,d.d-.025,0,.23,0,m.wood,.03);
    box(d.w-.055,.19,d.d-.12,0,.405,.015,m.linen,.07);
    box(d.w,.7,.10,0,.35,-d.d/2+.05,m.fabric,.025);
    box(d.w-.08,.065,d.d*.64,0,.52,d.d*.16,m.linen,.028);
    box(d.w-.06,.034,.38,0,.563,d.d*.32,m.pillow,.02);
    const count=model==='bedDouble'?2:1;
    for(let i=0;i<count;i++) {
      const pillow=box((d.w-.24)/count,.12,.43,-(d.w-.24)/2+(i+.5)*(d.w-.24)/count,.535,-d.d*.31,m.linen,.058);
      pillow.rotation.x=.07;
    }
    for(let i=1;i<6;i++)box((d.w-.08)/6,.008,d.d*.48,-d.w/2+.08+i*(d.w-.16)/6,.559,d.d*.17,m.linen,.003);
  } else if (/^(table|desk)/.test(model)) {
    if(model==='tableCoffee') {
      for(const x of [-d.w*.28,d.w*.28])cylinder(.11,.15,d.h-.05,x,(d.h-.05)/2,0,m.wood);
      box(d.w,.055,d.d,0,d.h-.028,0,m.wood,.19);
      box(.24,.012,.18,-d.w*.2,d.h+.006,-.06,m.linen,.009);
      cylinder(.055,.035,.055,d.w*.18,d.h+.028,.05,m.stone);
    } else {
      legs(d.h-.045,d.w-.08,d.d-.08);
      box(d.w,.045,d.d,0,d.h-.023,0,m.wood,.07);
      if(model==='table') {
        cylinder(.105,.105,.012,0,d.h+.006,0,m.white);
        cylinder(.055,.04,.14,d.w*.22,d.h+.07,0,m.stone);
      } else box(.3,.014,.2,d.w*.15,d.h+.007,-d.d*.15,m.linen,.015);
    }
  } else if (/^chair/.test(model)) {
    legs(.4,d.w-.03,d.d-.04);
    box(d.w,.10,d.d-.02,0,.45,0,m.fabric,.07);
    box(d.w,.35,.08,0,.70,d.d/2-.045,m.wood,.065);
    for(const x of [-d.w*.38,d.w*.38])cylinder(.018,.018,.39,x,.58,d.d*.32,m.wood);
  } else if (model==='televisionModern') {
    for(const x of [-d.w*.32,d.w*.32])box(.025,.13,.18,x,.065,0,m.dark,.01);
    const height=d.w*9/16;
    box(d.w,height,.05,0,.16+height/2,0,m.dark,.015);
    box(d.w-.035,height-.035,.006,0,.16+height/2,-.029,m.screen,.01);
  } else if (/^(cabinet|bookcase)/.test(model)) {
    const tv=model==='cabinetTelevision',bed=model==='cabinetBed',leg=tv?.1:.07;
    legs(leg,d.w-.04,d.d-.04,m.dark);
    box(d.w,d.h-leg,d.d,0,(d.h+leg)/2,0,m.wood,.016);
    front(d.w-.02,bed?(d.h-leg)/2-.012:d.h-leg-.035,bed?leg+(d.h-leg)*.75:(d.h+leg)/2,-d.d/2-.012,tv?3:bed?1:2);
    if(bed)front(d.w-.02,(d.h-leg)/2-.012,leg+(d.h-leg)*.25,-d.d/2-.012,1);
    if(tv){box(.32,.015,.20,-d.w*.32,d.h+.008,.025,m.linen,.01);cylinder(.055,.045,.11,d.w*.37,d.h+.055,0,m.stone);}
  } else if (/^kitchen/.test(model)) {
    if(model==='kitchenFridge') {
      box(d.w,d.h,d.d,0,d.h/2,0,m.white,.025);
      front(d.w-.03,d.h*.62,d.h*.32,d.d/2+.008,1);
      box(d.w-.025,d.h*.32,.024,0,d.h*.82,d.d/2+.01,m.white,.012);
      box(.022,.37,.025,d.w*.34,d.h*.44,d.d/2+.035,m.metal,.009);
    } else {
      box(d.w-.01,d.h-.08,d.d-.03,0,(d.h-.08)/2,0,m.wood,.008);
      box(d.w,.055,d.d,0,d.h-.025,0,m.stone,.015);
      front(d.w-.025,d.h-.15,(d.h-.15)/2+.04,d.d/2-.004,2);
      box(d.w-.055,.07,.02,0,.035,d.d/2-.018,m.dark,.004);
      if(model==='kitchenStove') {
        box(d.w*.8,.012,d.d*.56,0,d.h+.004,0,m.dark,.02);
        for(const x of [-d.w*.19,d.w*.19])for(const z of [-d.d*.14,d.d*.14]){
          const ring=mesh(new THREE.TorusGeometry(.072,.003,8,24),m.metal,x,d.h+.012,z);ring.rotation.x=Math.PI/2;
        }
        box(d.w*.6,.27,.017,0,d.h*.5,d.d/2+.018,m.dark,.025);
      } else {
        box(d.w*.65,.012,d.d*.55,0,d.h+.004,0,m.metal,.035);
        box(d.w*.53,.008,d.d*.42,0,d.h+.012,0,m.dark,.025);
        const faucet=mesh(new THREE.TorusGeometry(.09,.014,10,24,Math.PI),m.metal,0,d.h+.18,-d.d*.32);
        faucet.rotation.y=Math.PI/2;
        cylinder(.014,.014,.16,0,d.h+.08,-d.d*.32,m.metal);
      }
    }
  } else if(model==='pottedPlant') {
    cylinder(.15,.11,.32,0,.16,0,m.stone);
    cylinder(.139,.139,.01,0,.324,0,m.dark);
    for(let i=0;i<9;i++) {
      const a=i*2.4,h=.50+(i%4)*.15;
      cylinder(.005,.008,h,Math.sin(a)*.035,.34+h/2,Math.cos(a)*.035,m.green);
      const leaf=sphere(.12,.48,.025,Math.sin(a)*.115,.48+h*.7,Math.cos(a)*.12,i%2?m.green:m.leaf);
      leaf.rotation.set(.25*Math.cos(a),a,.28*Math.sin(a));
    }
  } else if(model==='bathroomSink') {
    box(d.w,.54,d.d-.04,0,.41,0,m.wood,.025);
    front(d.w-.03,.45,.42,d.d/2-.012,2);
    box(d.w,.055,d.d,0,.715,0,m.stone,.018);
    sphere(d.w*.75,.14,d.d*.72,0,.79,.025,m.white);
    sphere(d.w*.60,.035,d.d*.55,0,.85,.025,m.stone);
    cylinder(.012,.012,.20,0,.82,-d.d*.3,m.metal);
    box(.025,.025,.15,0,.92,-d.d*.19,m.metal,.01);
    box(d.w*.75,.30,.02,0,.965,-d.d/2+.015,m.screen,.02);
  } else if(model==='toilet') {
    sphere(d.w*.72,.4,d.d*.58,0,.22,.1,m.white);
    sphere(d.w,.22,d.d*.75,0,.43,.075,m.white);
    sphere(d.w*.75,.03,d.d*.59,0,.55,.085,m.stone);
    box(d.w*.85,d.h*.65,.19,0,d.h*.57,-d.d/2+.095,m.white,.055);
    cylinder(.025,.025,.008,0,d.h*.9,-d.d/2+.11,m.metal);
  } else if(model==='shower') {
    box(d.w,.06,d.d,0,.03,0,m.white,.02);
    box(.018,d.h,d.d, -d.w/2+.02,d.h/2,0,m.glass,.004);
    box(d.w,d.h,.018,0,d.h/2,d.d/2-.02,m.glass,.004);
    for(const x of [-d.w/2+.02,d.w/2-.02])box(.025,d.h,.025,x,d.h/2,d.d/2-.02,m.metal,.006);
    box(d.w,.025,.025,0,d.h-.015,d.d/2-.02,m.metal,.006);
    cylinder(.018,.018,d.h*.65,0,d.h*.55,-d.d/2+.08,m.metal);
    cylinder(.105,.105,.018,0,d.h*.91,-d.d/2+.15,m.metal);
    box(.018,.20,.035,d.w*.22,d.h*.48,d.d/2-.04,m.metal,.006);
  }
  // Decorative seams and cushions cannot expand the approved furniture envelope.
  root.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(root), size = bounds.getSize(new THREE.Vector3());
  root.scale.set(d.w/size.x,d.h/size.y,d.d/size.z);
  root.position.set(-(bounds.min.x+bounds.max.x)/2*root.scale.x,-bounds.min.y*root.scale.y,-(bounds.min.z+bounds.max.z)/2*root.scale.z);
  root.userData = {source:'parametric',model,generic:true,dimensions:{...d}};
  return root;
};

// Generic passenger vehicle; its envelope is fitted to garageVehicle, never scaled to fit an undersized garage.
BMH.addGarageVehicle=(r,base,THREE,scene,site)=>{
 const v=BMH.garageVehicle(r);if(!v||v.kind!=='car')return false;
 const group=new THREE.Group(),body=new THREE.MeshPhysicalMaterial({color:'#526c6e',roughness:.28,metalness:.38,clearcoat:.8}),glass=new THREE.MeshPhysicalMaterial({color:'#273c42',roughness:.12,metalness:.3,clearcoat:1}),rubber=new THREE.MeshStandardMaterial({color:'#242722',roughness:.94}),metal=new THREE.MeshStandardMaterial({color:'#929b97',roughness:.25,metalness:.85}),lamp=new THREE.MeshStandardMaterial({color:'#ebe8d5',roughness:.2});
 const box=(w,h,d,x,y,z,m,radius=.04)=>{const g=THREE.RoundedBoxGeometry?new THREE.RoundedBoxGeometry(w,h,d,3,Math.min(radius,h*.45,w*.45,d*.45)):new THREE.BoxGeometry(w,h,d),o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;group.add(o);return o;};
 box(1.75,.46,4.22,0,.61,0,body,.16);box(1.66,.36,2.1,0,1.06,.12,glass,.16);box(1.52,.085,1.7,0,1.28,.18,body,.04);box(1.65,.09,1.1,0,.9,-1.5,body,.07);box(1.65,.09,.64,0,.91,1.72,body,.06);
 for(const x of [-.43,.43]){box(.52,.11,.025,x,.75,-2.12,lamp,.03);box(.45,.08,.025,x,.76,2.12,new THREE.MeshStandardMaterial({color:'#88392f',roughness:.32}),.02);}
 box(.7,.19,.025,0,.47,-2.14,rubber,.02);box(.28,.02,2.1,0,1.16,.12,body,.01);
 for(const x of [-.80,.80])for(const z of [-1.3,1.3]){const tyre=new THREE.Mesh(new THREE.CylinderGeometry(.31,.31,.19,24),rubber);tyre.rotation.z=Math.PI/2;tyre.position.set(x,.33,z);tyre.castShadow=tyre.receiveShadow=true;group.add(tyre);const rim=new THREE.Mesh(new THREE.CylinderGeometry(.19,.19,.20,20),metal);rim.rotation.z=Math.PI/2;rim.position.copy(tyre.position);group.add(rim);}
 group.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(group),size=bounds.getSize(new THREE.Vector3());group.scale.set(1.85/size.x,1.45/size.y,4.3/size.z);group.rotation.y=v.w>v.d?Math.PI/2:0;group.position.set(v.x+v.w/2-site.width/2,base-bounds.min.y*group.scale.y,v.y+v.d/2-site.depth/2);group.userData={kind:'vehicle',roomId:r.id,vehicle:'car',generic:true,placement:{...v}};scene.add(group);return true;
};
