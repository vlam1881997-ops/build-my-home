/* Detailed generic furniture in metres. These are visual assets, not product SKUs. */
BMH.roomSurfaceStyle=id=>{
 const p=BMH.state.project,r=p.plan.rooms.find(r=>r.id===id),surface=BMH.finishPalette?.(id)?.surface;
 return ['wood','tile','stone'].includes(surface)?surface:/Japandi/i.test(p.style||'')&&['living','bed'].includes(r?.type)?'wood':'tile';
};

// Generic window profiles occupy the existing measured opening. No new opening,
// manufacturer specification or change to the customer's plan is inferred.
BMH.windowAssembly=opening=>{
 const span=BMH.openingWallSpan?.(opening);if(!span||opening.kind!=='window')return [];
 const levels=BMH.studioFloorLevel?.(opening.floor)??BMH.projectLevels(),width=span.b-span.a,sill=Number(opening.sill??.9),height=Math.min(Number(opening.height)||1.4,levels.clearHeight-sill);
 if(width<.2||height<.2)return [];
 const parts=[],border=Math.min(.055,width*.1,height*.1),sash=.028,depth=.075,base=levels.slab+sill,panes=width>1.25?2:1;
 const add=(part,along,up,w,h,normal,d,finish='frame')=>parts.push({part,kind:finish==='glass'?'window-glass':'window-frame',openingId:opening.id,roomId:opening.roomId,floor:opening.floor,finish,x:span.o==='h'?span.a+along:span.c+normal-d/2,y:base+up,z:span.o==='h'?span.c+normal-d/2:span.a+along,w:span.o==='h'?w:d,h,d:span.o==='h'?d:w,generic:true});
 add('jamb-left',0,0,border,height,0,depth);add('jamb-right',width-border,0,border,height,0,depth);
 add('head',border,height-border,width-border*2,border,0,depth);add('sill',border,0,width-border*2,border,0,depth);
 const paneWidth=(width-border*2)/panes,paneHeight=height-border*2;
 for(let i=0;i<panes;i++){
  const start=border+i*paneWidth,normal=(i%2?1:-1)*.012;
  add('sash-left-'+i,start,border,sash,paneHeight,normal,.038);add('sash-right-'+i,start+paneWidth-sash,border,sash,paneHeight,normal,.038);
  add('sash-top-'+i,start+sash,height-border-sash,paneWidth-sash*2,sash,normal,.038);add('sash-bottom-'+i,start+sash,border,paneWidth-sash*2,sash,normal,.038);
  add('pane-'+i,start+sash,border+sash,paneWidth-sash*2,paneHeight-sash*2,normal,.008,'glass');
 }
 return parts;
};

// Batch small profiles into one mesh per material rather than one draw per box.
BMH.sceneJoinedBoxes=(THREE,parts,{W,D,base=0})=>{
 const values={position:[],normal:[],uv:[]},indices=[];let offset=0;
 for(const p of parts){
  const box=new THREE.BoxGeometry(p.w,p.h,p.d);box.translate(p.x+p.w/2-W/2,base+p.y+p.h/2,p.z+p.d/2-D/2);
  for(const key of Object.keys(values))values[key].push(...box.attributes[key].array);
  for(const i of box.index.array)indices.push(offset+i);offset+=box.attributes.position.count;box.dispose();
 }
 const geometry=new THREE.BufferGeometry();for(const key of Object.keys(values))geometry.setAttribute(key,new THREE.Float32BufferAttribute(values[key],key==='uv'?2:3));geometry.setIndex(indices);return geometry;
};

// A small analytic daylight environment gives glass and metal a horizon to
// reflect. It is presentation lighting, not the survey's real surroundings.
BMH.architecturalSkyEnvironment=(THREE,renderer)=>{
 if(typeof document.createElement!=='function')return null;
 const key='architectural-sky-v1',templates=BMH.skyTextureTemplates||=new Map();let faces=templates.get(key);
 if(!faces){
  faces=Array.from({length:6},(_,face)=>{const canvas=document.createElement('canvas');canvas.width=canvas.height=128;const ctx=canvas.getContext('2d');if(!ctx?.createImageData)return null;
   const pixels=ctx.createImageData(128,128);
   for(let y=0;y<128;y++)for(let x=0;x<128;x++){
    const u=(x+.5)/64-1,v=(y+.5)/64-1,dir=[[1,-v,-u],[-1,-v,u],[u,1,v],[u,-1,-v],[u,-v,1],[-u,-v,-1]][face],height=dir[1]/Math.hypot(...dir),t=Math.pow(Math.abs(height),.55),horizon=[224,227,220],pole=height>=0?[133,166,192]:[121,112,96],i=(y*128+x)*4;
    for(let c=0;c<3;c++)pixels.data[i+c]=horizon[c]*(1-t)+pole[c]*t;pixels.data[i+3]=255;
   }ctx.putImageData(pixels,0,0);return canvas;
  });if(faces.some(x=>!x))return null;templates.set(key,faces);
 }
 const cube=new THREE.CubeTexture(faces);cube.colorSpace=THREE.SRGBColorSpace;cube.needsUpdate=true;
 const generator=new THREE.PMREMGenerator(renderer);try{return generator.fromCubemap(cube);}finally{cube.dispose();generator.dispose();}
};
BMH.sceneSurfaceTexture = (THREE, kind, channel='color') => {
 if(typeof document==='undefined'||typeof document.createElement!=='function')return null;
 const templates=BMH.surfaceTextureTemplates||=new Map(),key=kind+':'+channel;
 if(templates.has(key)){const texture=new THREE.CanvasTexture(templates.get(key));texture.colorSpace=channel==='color'?THREE.SRGBColorSpace:THREE.NoColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;texture.userData={generic:true,kind,channel};return texture;}
 const canvas=document.createElement('canvas');canvas.width=canvas.height=256;const ctx=canvas.getContext('2d');if(!ctx)return null;
 const pixels=ctx.createImageData(256,256),heights=channel==='normal'?new Float32Array(256*256):null;
 for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const raw=Math.sin(x*12.9898+y*78.233)*43758.5453,n=raw-Math.floor(raw),grain=Math.sin(y*.20+Math.sin(x*.018)*2+Math.sin(x*.067)*.5);let value=248,height=.5,rough=.85;
  if(kind==='wood'||kind==='plank'||kind==='woodVertical'){const cross=kind==='woodVertical'?x:y,along=kind==='woodVertical'?y:x,vein=Math.sin(cross*.20+Math.sin(along*.024)*2+Math.sin(along*.071)*.65),ring=Math.sin(cross*.72+Math.sin(along*.017)*5);height=.5+vein*.06+n*.025;value=239+vein*6+ring*1.2+n*3;rough=.75+n*.055;if(kind==='plank'&&y<2){value=205;height=.1;rough=.95;}}
  else if(kind==='fabric'){const weave=(x%4<2?1:0)+(y%4<2?1:0);value=238+weave*4+n*2;height=.5+weave*.04+n*.01;rough=.97+n*.02;}
  else if(kind==='tile'||kind==='stone'){const vein=Math.sin(x*.033+Math.sin(y*.023)*3),seam=kind==='tile'&&(x<2||y<2);value=seam?190:245+vein*6+n*3;height=seam?.08:.55+n*.02;rough=seam?.95:kind==='stone'?.78:.65;}
  else if(kind==='marble'){const flow=y+x*.53+9*Math.sin(x*.041)+4*Math.sin(y*.027),vein=Math.pow(Math.max(0,Math.cos(flow*.12)),28);value=250-vein*64-n*3;height=.5+n*.002;rough=.44+vein*.12;}
  else if(kind==='travertine'){const band=Math.sin(y*.09+Math.sin(x*.014)*1.7),pore=n>.986&&Math.sin(x*.8+y*.37)>.1;value=239+band*9-(pore?38:0);height=pore?.24:.5+band*.005;rough=pore?.95:.86;}
  else if(kind==='concrete'){const cloud=Math.sin(x*.031)*Math.cos(y*.028)+Math.sin((x+y)*.064)*.3;value=241+cloud*7+(n-.5)*8;height=.5+(n-.5)*.015;rough=.95;}
  else if(kind==='brick'){const row=Math.floor(y/128),cross=(x+row*128)%256,seam=y%128<7||cross<7;value=seam?216:235+(n-.5)*13+Math.sin(x*.17)*2;height=seam?.12:.58+(n-.5)*.04;rough=seam?.98:.92;}
  else if(kind==='terrazzo'){const cx=Math.floor(x/13),cy=Math.floor(y/13),seed=Math.sin(cx*19.13+cy*87.17)*43758.54,f=seed-Math.floor(seed),dx=x%13-(3+f*7),dy=y%13-(9-f*6),chip=dx*dx+(dy*.8)**2<7+f*10;value=chip?140+f*82:249;height=.5+(n-.5)*.002;rough=chip?.64:.8;}
  else if(kind==='boucle'){const loop=Math.sin(x*1.8)*Math.cos(y*1.6);value=241+loop*8+n*5;height=.5+loop*.11+n*.035;rough=.99;}
  else if(kind==='velvet'){value=245+Math.sin(y*.5)*2+n*3;height=.5+n*.015;rough=.9;}
  else if(kind==='leather'){const pore=Math.sin(x*.8+Math.sin(y*.51))*Math.sin(y*.73+Math.sin(x*.32));value=244+pore*5+n*3;height=.5+pore*.022+n*.005;rough=.76+pore*.04;}
  else{value=248+(n-.5)*5;height=.5+(n-.5)*.04;rough=.92+n*.03;}
  if(channel==='height')value=height*255;else if(channel==='roughness')value=rough*255;
  const i=(y*256+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;
  if(heights)heights[y*256+x]=height;
 }
 if(heights)for(let y=0;y<256;y++)for(let x=0;x<256;x++){
  const at=(a,b)=>heights[((b+256)%256)*256+(a+256)%256],dx=(at(x+1,y)-at(x-1,y))*2,dy=(at(x,y+1)-at(x,y-1))*2,l=Math.hypot(dx,dy,1),i=(y*256+x)*4;
  pixels.data[i]=(-dx/l*.5+.5)*255;pixels.data[i+1]=(-dy/l*.5+.5)*255;pixels.data[i+2]=(1/l*.5+.5)*255;
 }
 ctx.putImageData(pixels,0,0);templates.set(key,canvas);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=channel==='color'?THREE.SRGBColorSpace:THREE.NoColorSpace;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.anisotropy=4;texture.userData={generic:true,kind,channel};return texture;
};

// Decode each photographed channel once per scene. A slow download keeps the
// visible fallback, and a retired scene never receives late image updates.
BMH.scenePhotoSurface = (THREE, scene, asset, channel) => {
 const loads=scene.userData.surfacePhotoLoads||=new Map(),key=asset+':'+channel;
 if(loads.has(key))return loads.get(key);
 const photos=BMH.surfacePhotoCache||=new Map();if(photos.has(key))return Promise.resolve(photos.get(key));
 const cancels=scene.userData.surfaceCancels||=new Set();
 const task=new Promise(resolve=>{
  let settled=false,timer;
  const finish=image=>{if(settled)return;settled=true;clearTimeout(timer);cancels.delete(cancel);resolve(scene.userData.disposed?null:image);};
  const cancel=()=>finish(null);cancels.add(cancel);
  // Begin the deadline after synchronous scene/shader construction yields.
  // Requests start immediately; already downloaded image events get a chance
  // to run before the timeout on a slow GPU. Raster remains immediately usable.
  setTimeout(()=>{if(!settled)timer=setTimeout(cancel,BMH.SCENE_TEXTURE_TIMEOUT||30000);},0);
  try{new THREE.TextureLoader().load('assets/interior/textures/'+asset+'-'+channel+'.png',loaded=>{const image=loaded.image;loaded.dispose();if(!settled&&!scene.userData.disposed)photos.set(key,image);finish(image);},undefined,cancel);}catch(_){cancel();}
 });loads.set(key,task);return task;
};

BMH.sceneMaterialTexture = (THREE, scene, kind, channel='color') => {
  const textures = scene.userData.surfaceTextures ||= new Map();
  const photoSets={wood:'wood_table_001',woodVertical:'wood_table_001',plank:'wood_floor',fabric:'terlenka',marble:'marble_01',plaster:'white_plaster_02',leather:'brown_leather',concrete:'concrete_floor_02',brick:'brick_wall_001',terrazzo:'terrazzo_tiles'},photoChannels={color:'diff',normal:'nor_gl',roughness:'rough'};
   const key=kind+':'+channel;if(!textures.has(key)){
    const fallback=BMH.sceneSurfaceTexture(THREE,kind,channel);textures.set(key,fallback);
    if(fallback&&photoSets[kind]&&THREE.TextureLoader&&typeof document.createElementNS==='function'){
     // Keep one canvas and one GPU allocation throughout the upgrade. Browser
     // drivers must not upload a differently sized HTML image into the old map.
     const canvas=document.createElement('canvas'),ctx=canvas.getContext?.('2d');
     if(ctx?.drawImage){canvas.width=canvas.height=512;ctx.drawImage(fallback.image,0,0,512,512);fallback.image=canvas;}
     const task=BMH.scenePhotoSurface(THREE,scene,photoSets[kind],photoChannels[channel]).then(image=>{if(!image||scene.userData.disposed)return false;if(ctx?.drawImage){
      // This plaster photograph is a texture, not the colour of the selected
      // paint. Keep its mineral variation subtle for a painted interior wall.
      ctx.globalAlpha=kind==='plaster'&&channel==='color'?.08:1;ctx.drawImage(image,0,0,512,512);ctx.globalAlpha=1;
     }else fallback.image=image;fallback.needsUpdate=true;fallback.userData={...fallback.userData,source:photoSets[kind],license:'CC0-1.0'};return true;});
     (scene.userData.surfaceLoads||=[]).push(task);
    }
   }return textures.get(key);
};

BMH.sceneAssetMaterials = (THREE, scene, finish = {}) => {
  const cache = scene.userData.finishMaterials ||= new Map();
  const key = JSON.stringify([finish.wall, finish.floor, finish.accent, finish.fabric, finish.surface,finish.pillow,finish.rug,finish.shape,finish.table,finish.visualMaterials,finish.stoneVisualMaterial,finish.catalogMaterials]);
  if (cache.has(key)) return cache.get(key);
  const texture=(kind,channel='color')=>BMH.sceneMaterialTexture(THREE,scene,kind,channel);
  const make = (color, roughness, kind, scale) => {
    const m = new THREE.MeshStandardMaterial({color, roughness});
    if (kind) {
      m.map = texture(kind);
      if (m.map) {
        m.normalMap=texture(kind,'normal');m.roughnessMap=texture(kind,'roughness');m.normalScale.setScalar(kind==='fabric'?.42:kind==='plaster'?.06:.20);
        m.bumpScale = kind === 'fabric' ? .0012 : kind === 'wood' ? .0006 : .0003;
      }
      m.userData.surfaceScale = scale;
      if(kind==='wood')m.userData.surfaceRotation=Math.PI/2;
    }
    return m;
  };
  const wood = finish.accent || '#98785a';
  const materials = {
    wood: make(wood, .58, 'wood', [1.5,1.5]),
    slattedWood: make(wood, .7, 'woodVertical', [1.5,1.5]),
    fabric: make(finish.fabric || '#d1c7b6', .96, 'fabric', [.3, .3]),
    linen: make('#f5f1e6', .98, 'fabric', [.3, .3]),
    pillow: make(finish.pillow || '#7b8469', .97, 'fabric', [.3, .3]),
    wall: make(finish.wall || '#eee8dd', .9, 'plaster', [.35, .35]),
    tile: make(finish.floor || '#d8d1c3', .6, 'tile', [.6, .6]),
    plank: make(finish.floor || '#d3b998', .62, 'plank', [1.7,1.7]),
    floorStone: make(finish.floor || '#d8d1c3', .72, 'stone', [.8,.8]),
    rug: make(finish.rug || '#d4ccba', .99, 'fabric', [.2, .2]),
    stone: make('#e7e1d6', .38, 'stone', [.8, .8]),
    white: make('#f4f2e9', .28),
    dark: make('#343b36', .4),
    green: make('#536b45', .85),
    leaf: make('#79935a', .85),
    metal: new THREE.MeshStandardMaterial({color:'#969080', roughness:.25, metalness:.8}),
    glass: new THREE.MeshPhysicalMaterial({color:'#dce5df', roughness:.06, transparent:true, opacity:.25, metalness:.08}),
    screen: new THREE.MeshPhysicalMaterial({color:'#14252a', roughness:.23, clearcoat:.7,envMapIntensity:.2}),
  };
  materials.collection={shape:finish.shape||'soft',table:finish.table||'oak'};
  materials.floor=finish.surface==='wood'?materials.plank:finish.surface==='stone'?materials.floorStone:materials.tile;
  const replace=(key,material)=>{const previous=materials[key];materials[key]=material;if(previous?.isMaterial&&!Object.values(materials).includes(previous))previous.dispose();};
  // Apply the selected finish's physical properties as well as its colour.
  for(const [role,id]of Object.entries(finish.visualMaterials||{})){
   const profile=BMH.VISUAL_MATERIALS?.find(p=>p.id===id&&p.role===role);if(!profile)continue;
   const target={floor:'floor',wall:'wall',accent:'wood',fabric:'fabric'}[role];if(!target)continue;
   const material=make(finish[role]||profile.color,profile.roughness,profile.kind,profile.scale);
   material.normalScale?.setScalar(profile.normalStrength);material.userData.visualMaterial=profile.id;
   if(profile.kind==='velvet'){const physical=new THREE.MeshPhysicalMaterial({color:material.color.clone(),map:material.map,normalMap:material.normalMap,roughnessMap:material.roughnessMap,roughness:material.roughness,sheen:.6,sheenRoughness:.85,sheenColor:finish.fabric||profile.color});physical.normalScale.copy(material.normalScale);physical.userData={...material.userData};material.dispose();replace(target,physical);}else replace(target,material);
   if(role==='accent')replace('slattedWood',make(finish.accent||profile.color,profile.roughness,profile.kind==='wood'?'woodVertical':profile.kind,profile.scale));
  }
  const stoneProfile=BMH.VISUAL_MATERIALS?.find(p=>p.id===finish.stoneVisualMaterial&&p.role==='floor'&&p.surface==='stone');
  if(stoneProfile){const material=make(stoneProfile.color,stoneProfile.roughness,stoneProfile.kind,stoneProfile.scale);material.normalScale?.setScalar(stoneProfile.normalStrength);material.userData.visualMaterial=stoneProfile.id;replace('stone',material);}
  // A customer-provided sample replaces the generic colour map only on its
  // validated product/room binding. Physical response remains a preview.
  for(const [category,binding] of Object.entries(finish.catalogMaterials||{})){
   const sample=BMH.materialSampleForBinding?.(binding),role=BMH.catalogSurfaceSlots?.[category],target={floor:'floor',wall:'wall',accent:'wood'}[role];
   if(!sample||!target)continue;
   const textures=scene.userData.surfaceTextures||=new Map(),key='catalog-sample:'+sample.mediaId;
   if(!textures.has(key)){const t=new THREE.Texture(sample.image);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.needsUpdate=true;textures.set(key,t);}
   const previous=materials[target],material=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:previous.roughness,map:textures.get(key)});
   material.userData={...previous.userData,surfaceScale:[...binding.sample.realWorldScale],surfaceRotation:binding.sample.rotationDeg*Math.PI/180,catalogProductId:binding.productId,catalogSku:binding.sku,materialSampleId:sample.mediaId,sampleBasis:'customer-provided-colour-sample'};
   replace(target,material);
   if(role==='accent'){const slatted=material.clone();slatted.userData={...material.userData};replace('slattedWood',slatted);}
  }
  for (const material of Object.values(materials)) if(material.isMaterial)material.envMapIntensity = BMH.state?.ui?.sceneTheme === 'night' ? .3 : .65;
  for(const [slot,material] of Object.entries(materials))if(material?.isMaterial)material.userData.finishSlot=slot;
  materials.floor.userData.finishSlot='floor';
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
    const u=ax > ay && ax > az ? z : x,v=ay >= ax && ay >= az ? z : y,angle=material.userData.surfaceRotation||0;
    uv.setXY(i,(u*Math.cos(angle)-v*Math.sin(angle))/scale[0],(u*Math.sin(angle)+v*Math.cos(angle))/scale[1]);
  }
  uv.needsUpdate = true;
  return geometry;
};

// Soft window treatments stay inside the measured room and attach to its actual opening.
BMH.addWindowDrapery=(THREE,scene,r,base,site,overview=false)=>{
 if(!['living','bed'].includes(r.type))return;
 const levels=BMH.studioFloorLevel?.(r.floor)??BMH.projectLevels(),materials=BMH.sceneAssetMaterials(THREE,scene,BMH.finishPalette?.(r.id)||{});
 for(const o of BMH.state.project.plan.openings.filter(o=>o.roomId===r.id&&o.kind==='window')){
  const span=BMH.openingWallSpan(o);if(!span)continue;const horizontal=span.o==='h',inward={north:1,south:-1,west:1,east:-1}[o.side],top=levels.slab+levels.clearHeight-.12,bottom=levels.slab+.03,width=Math.min(.48,(span.b-span.a)*.28),near=overview&&['north','east'].includes(o.side),lo=horizontal?r.x+.13:r.y+.13,hi=horizontal?r.x+r.w-.13:r.y+r.h-.13;
  const material=materials.linen.clone();material.side=THREE.DoubleSide;if(near)material.clippingPlanes=[new THREE.Plane(new THREE.Vector3(0,-1,0),base+.85)];
  for(const start of [Math.max(lo,span.a-width*.52),Math.min(hi-width,span.b-width*.48)]){
   const geometry=new THREE.PlaneGeometry(width,top-bottom,32,12),positions=geometry.attributes.position;
   for(let i=0;i<positions.count;i++){const along=positions.getX(i)+width/2+start,t=(positions.getY(i)+(top-bottom)/2)/(top-bottom),h=positions.getY(i)+(top+bottom)/2,z=.132+Math.sin((along-start)/width*Math.PI*10)*(.010+(1-t)*.004);positions.setXYZ(i,horizontal?along-site.width/2:span.c+inward*z-site.width/2,base+h,horizontal?span.c+inward*z-site.depth/2:along-site.depth/2);}geometry.computeVertexNormals();BMH.sceneSurfaceUvs(geometry,material);const curtain=new THREE.Mesh(geometry,material);curtain.name='drapery-'+o.id+'-'+start;curtain.userData={kind:'window-drapery',roomId:r.id,openingId:o.id,floor:r.floor,generic:true};curtain.castShadow=curtain.receiveShadow=true;scene.add(curtain);
  }
  const rodA=Math.max(lo,span.a-.28),rodB=Math.min(hi,span.b+.28),rodMaterial=materials.metal.clone();if(near)rodMaterial.clippingPlanes=material.clippingPlanes;
  const rod=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,rodB-rodA,16),rodMaterial);rod.rotation.z=horizontal?Math.PI/2:0;if(!horizontal)rod.rotation.x=Math.PI/2;rod.position.set((horizontal?(rodA+rodB)/2:span.c+inward*.16)-site.width/2,base+top+.035,(horizontal?span.c+inward*.16:(rodA+rodB)/2)-site.depth/2);rod.userData={kind:'window-drapery',roomId:r.id,openingId:o.id,floor:r.floor,generic:true};scene.add(rod);
 }
};

// Keep an orbiting indoor camera out of measured walls, ceilings and furniture.
// A camera inside a television/cabinet can otherwise produce a dark, unusable image.
BMH.interiorCameraIsClear=(room,point,items=BMH.roomFurnitureLayout(room))=>{
 const margin=.08,levels=BMH.studioFloorLevel?.(room.floor)??BMH.projectLevels(),height=point.height;
 if(![point.x,point.y,height].every(Number.isFinite)||['stairs','elevator'].includes(room.type))return false;
 if(point.x<room.x+.12||point.x>room.x+room.w-.12||point.y<room.y+.12||point.y>room.y+room.h-.12)return false;
 if(!Number.isFinite(height)||height<levels.slab+.12||height>(levels.height??levels.floorHeight)-(levels.ceilingDrop||0)-.12)return false;
 if((BMH.stairFloorHoles?.(room.floor)||[]).some(h=>point.x>h.x-.08&&point.x<h.x+h.w+.08&&point.y>h.y-.08&&point.y<h.y+(h.d??h.h)+.08))return false;
 if((BMH.planFixtures?.()||[]).some(q=>q.roomId===room.id&&height>levels.slab+(Number(q.base)||0)-margin&&height<levels.slab+(Number(q.base)||0)+q.h+margin&&point.x>q.x-margin&&point.x<q.x+q.w+margin&&point.y>q.y-margin&&point.y<q.y+q.d+margin))return false;
 return !items.some(i=>height>levels.slab+(i.base||0)-margin&&height<levels.slab+(i.base||0)+(i.h||0)+margin&&point.x>i.x-margin&&point.x<i.x+i.w+margin&&point.y>i.y-margin&&point.y<i.y+i.d+margin);
};
// Test the whole movement, including native orbit/pan/pinch controls. A clear
// destination alone would allow a large pointer movement through a wardrobe.
BMH.measuredWalkPathIsClear=(room,from,to,items=BMH.roomFurnitureLayout(room),{walking=false}={})=>{
 if(!from||!to||![from.x,from.y,from.height,to.x,to.y,to.height].every(Number.isFinite))return false;
 const distance=Math.hypot(to.x-from.x,to.y-from.y,to.height-from.height),steps=Math.max(1,Math.ceil(distance/.04));
 if(steps>2500)return false;
 for(let i=0;i<=steps;i++){
  const t=i/steps,p={x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t,height:from.height+(to.height-from.height)*t};
  if(!BMH.interiorCameraIsClear(room,p,items))return false;
  // Walking has a body below the camera; low tables and fitted equipment
  // occupy that path even when an orbiting camera can see above them.
  if(walking&&items.some(q=>(q.base||0)<1.55&&(q.h||0)>.15&&p.x>q.x-.10&&p.x<q.x+q.w+.10&&p.y>q.y-.10&&p.y<q.y+q.d+.10))return false;
 }
 return true;
};
// Frame the actual bed, not an empty room centre. Check several sightlines:
// a clear centre ray alone can leave a wardrobe across half of the picture.
BMH.bedroomPresentationCamera=(room,items)=>{
 if(!BMH.studioFloorLevel&&!BMH.projectLevels)return null;
 const bed=items.find(i=>/^bed(Double|Single)$/.test(i.model));if(!bed)return null;
 const levels=BMH.studioFloorLevel?.(room.floor)??BMH.projectLevels(),eye=Math.min(1.65,(levels.height??levels.floorHeight)-(levels.ceilingDrop||0)-.18),targetHeight=levels.slab+(bed.base||0)+Math.min(.72,bed.h*.7);
 const target={x:bed.x+bed.w/2,y:bed.y+bed.d/2},samples=[[.12,.12],[.88,.12],[.12,.88],[.88,.88],[.5,.5]].map(([u,v])=>({x:bed.x+bed.w*u,y:bed.y+bed.d*v}));
 const blocked=(camera,aim,item)=>{
  if(item===bed)return false;let enter=0,leave=1;
  for(const [axis,lo,hi]of [['x',item.x-.025,item.x+item.w+.025],['y',item.y-.025,item.y+item.d+.025],['height',levels.slab+(item.base||0)-.025,levels.slab+(item.base||0)+item.h+.025]]){
   const from=axis==='height'?eye:camera[axis],to=axis==='height'?targetHeight:aim[axis],delta=to-from;
   if(Math.abs(delta)<1e-8){if(from<lo||from>hi)return false;continue;}
   const a=(lo-from)/delta,b=(hi-from)/delta;enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));if(enter>leave)return false;
  }return enter<.98&&leave>.02;
 };
 let best=null;
 for(const u of [.08,.18,.32,.5,.68,.82,.92])for(const v of [.08,.18,.32,.5,.68,.82,.92]){
  const camera={x:room.x+room.w*u,y:room.y+room.h*v,height:eye};
  if(!BMH.interiorCameraIsClear(room,camera,items)||items.some(i=>(i.base||0)<eye&&i.h>.15&&camera.x>i.x-.1&&camera.x<i.x+i.w+.1&&camera.y>i.y-.1&&camera.y<i.y+i.d+.1))continue;
  const dx=camera.x-target.x,dy=camera.y-target.y,horizontal=Math.hypot(dx,dy);if(horizontal<1.2)continue;
  const visible=samples.filter(p=>{const px=p.x-camera.x,py=p.y-camera.y;return (-dx*px-dy*py)/(horizontal*Math.hypot(px,py))>Math.cos(.42)&&!items.some(i=>blocked(camera,p,i));}).length;
  if(visible<samples.length)continue;
  const score=-Math.abs(horizontal-3.2);if(!best||score>best.score)best={score,camera,target,targetHeight,yaw:Math.atan2(dx,dy),pitch:Math.atan2(eye-targetHeight,horizontal),distance:Math.hypot(horizontal,eye-targetHeight)};
 }
 return best;
};
BMH.roomInteriorCamera = (room, items = BMH.roomFurnitureLayout(room)) => {
  if(room.type==='bed'){const view=BMH.bedroomPresentationCamera(room,items);if(view)return view;}
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
  // The long-room orbit may miss every usable point in a narrow furnished
  // living room. Search bounded, body-clear eye positions before falling back
  // to an overhead inspection; do not remove or move the customer's furniture.
  const levels=BMH.studioFloorLevel?.(room.floor)??BMH.projectLevels(),eye=Math.min(1.65,(levels.height??levels.floorHeight)-(levels.ceilingDrop||0)-.18),targetHeight=Math.min(1.1,eye-.15),targets=[target,{x:room.x+room.w/2,y:room.y+room.h/2}];let best=null;
  const obstructs=(camera,aim,item)=>{
   let enter=0,leave=1;
   for(const [axis,start,end]of [['x',item.x-.025,item.x+item.w+.025],['y',item.y-.025,item.y+item.d+.025],['height',levels.slab+(item.base||0)-.025,levels.slab+(item.base||0)+(item.h||0)+.025]]){
    const from=axis==='height'?eye:camera[axis],to=axis==='height'?targetHeight:aim[axis],delta=to-from;
    if(Math.abs(delta)<1e-8){if(from<start||from>end)return false;continue;}
    const a=(start-from)/delta,b=(end-from)/delta;enter=Math.max(enter,Math.min(a,b));leave=Math.min(leave,Math.max(a,b));if(enter>leave)return false;
   }return enter<.98&&leave>.02;
  };
  for(const u of [.08,.18,.32,.5,.68,.82,.92])for(const v of [.08,.18,.32,.5,.68,.82,.92]){
   const camera={x:room.x+room.w*u,y:room.y+room.h*v,height:eye};
   if(!BMH.interiorCameraIsClear(room,camera,items)||items.some(i=>(i.base||0)<eye&&(i.h||0)>.15&&camera.x>i.x-.10&&camera.x<i.x+i.w+.10&&camera.y>i.y-.10&&camera.y<i.y+i.d+.10))continue;
   for(const aim of targets){const dx=camera.x-aim.x,dy=camera.y-aim.y,horizontal=Math.hypot(dx,dy);if(horizontal<.7||items.some(i=>obstructs(camera,aim,i)))continue;
    const alignment=(Math.cos(angle)*dy+Math.sin(angle)*dx)/horizontal,score=horizontal+Math.max(0,alignment)*.6;
    if(!best||score>best.score)best={score,camera,target:aim,targetHeight,yaw:Math.atan2(dx,dy),pitch:Math.atan2(eye-targetHeight,horizontal),distance:Math.hypot(horizontal,eye-targetHeight)};
   }
  }
  if(best)return best;
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

// Curved leaves share one bounded mesh instead of solid ellipsoids. The fixed
// seed keeps a customer's plant identical after edits, reload and PNG export.
BMH.createSceneFoliage=(THREE,dimensions,material,count=48)=>{
 const positions=[],colors=[],base=new THREE.Color(material.color),random=n=>{const a=Math.sin(n*127.1+31.7)*43758.5453;return a-Math.floor(a);};count=Math.max(12,Math.min(72,count));
 for(let i=0;i<count;i++){
  const angle=i*2.39996,level=.12+random(i+5)*.7,spread=.05+random(i+15)*.16,origin=new THREE.Vector3(Math.sin(angle)*spread,level,Math.cos(angle)*spread),rotation=new THREE.Euler(.3+random(i+25)*.65,angle,.15+random(i+35)*.4),quaternion=new THREE.Quaternion().setFromEuler(rotation),length=.17+random(i+45)*.15,width=.05+random(i+55)*.045,vertices=[];
  for(let row=0;row<=5;row++)for(let col=0;col<=2;col++){const t=row/5,s=col-1,v=new THREE.Vector3(s*width*.5*Math.sin(Math.PI*t),t*length,.018*Math.sin(Math.PI*t)-Math.abs(s)*.01*Math.sin(Math.PI*t));vertices.push(v.applyQuaternion(quaternion).add(origin));}
  const tint=base.clone().multiplyScalar(.72+random(i+65)*.5);
  for(let row=0;row<5;row++)for(let col=0;col<2;col++){const a=row*3+col;for(const triangle of [[a,a+3,a+1],[a+1,a+3,a+4]]){const [v0,v1,v2]=triangle.map(n=>vertices[n]);if(v1.clone().sub(v0).cross(v2.clone().sub(v0)).lengthSq()<1e-14)continue;for(const n of triangle){const p=vertices[n],vein=n%3===1?.88:1;positions.push(p.x,p.y,p.z);colors.push(tint.r*vein,tint.g*vein,tint.b*vein);}}}
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingBox();const bounds=geometry.boundingBox,size=bounds.getSize(new THREE.Vector3()),p=geometry.attributes.position;
 for(let i=0;i<p.count;i++)p.setXYZ(i,(p.getX(i)-(bounds.min.x+bounds.max.x)/2)*dimensions.w/size.x,(p.getY(i)-bounds.min.y)*dimensions.h/size.y,(p.getZ(i)-(bounds.min.z+bounds.max.z)/2)*dimensions.d/size.z);geometry.computeVertexNormals();geometry.computeBoundingBox();
 const leaves=material.clone();leaves.vertexColors=true;leaves.color.set('#ffffff');leaves.side=THREE.DoubleSide;leaves.roughness=.78;const mesh=new THREE.Mesh(geometry,leaves);mesh.castShadow=mesh.receiveShadow=true;mesh.userData={generic:true,kind:'foliage',dimensions:{...dimensions},leafCount:count};return mesh;
};

BMH.createRoomAsset = (model, d, THREE, m) => {
  const selectedModel=model;if(model==='loungeChairModern')model='loungeChair';
  if(model==='tableCoffeeModern')model='tableCoffee';
  const supported = /^(bedDouble|bedSingle|loungeDesignSofa|loungeChair|tableCoffee|table|desk|chair|chairDesk|cabinetTelevision|televisionModern|kitchenSink|kitchenStove|kitchenFridge|bookcaseClosedWide|cabinetBed|pottedPlant|washingMachine|bathroomSink|toilet|shower|sideTable|floorLamp)$/;
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
  const ovalTop = (w,h,depth,x,y,z,material=m.wood) => {
    if(!THREE.Shape||!THREE.ExtrudeGeometry)return box(w,h,depth,x,y,z,material,.02);
    const edge=Math.min(.012,h*.22),shape=new THREE.Shape();
    shape.absellipse(0,0,w/2-edge,depth/2-edge,0,Math.PI*2,false,0);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:h-2*edge,bevelEnabled:true,bevelThickness:edge,bevelSize:edge,bevelSegments:3,curveSegments:32,steps:1});
    geometry.translate(0,0,-(h-2*edge)/2);geometry.rotateX(-Math.PI/2);
    const top=mesh(geometry,material,x,y,z);top.userData={kind:'oval-tabletop',generic:true};return top;
  };
  const sphere = (w,h,depth,x,y,z,material) => {
    const o = mesh(new THREE.SphereGeometry(1,24,16),material,x,y,z);
    o.scale.set(w/2,h/2,depth/2);
    return o;
  };
  // A soft, slightly compressed superellipsoid gives upholstery a continuous
  // silhouette. It remains inside the same measured furniture envelope.
  const cushion = (w,h,depth,x,y,z,material=m.fabric,orientation='seat',tufted=false) => {
    const geometry=new THREE.SphereGeometry(1,tufted?64:32,tufted?32:16),p=geometry.attributes.position,power=v=>Math.sign(v)*Math.pow(Math.abs(v),.48);
    for(let i=0;i<p.count;i++){
      let px=power(p.getX(i))*w/2,py=power(p.getY(i))*h/2,pz=power(p.getZ(i))*depth/2;
      const centre=Math.max(0,1-(px/(w/2))**2)*Math.max(0,1-(pz/(depth/2))**2);
      if(orientation==='seat'&&py>0)py-=Math.min(.009,h*.06)*centre*(py/(h/2));
      if(tufted&&pz<0){
       // Recess the real textile surface around buttons; folds are geometry,
       // not dark dots floating in front of a flat backrest.
       const u=px/(w/2),v=py/(h/2),front=Math.max(0,-pz/(depth/2));let dent=0;
       for(const a of [-.62,0,.62])for(const b of [-.4,.4])dent+=Math.exp(-((u-a)**2/.014+(v-b)**2/.024));
       const diagonal=Math.pow(Math.abs(Math.cos((u/.62+v/.8)*Math.PI)),18)+Math.pow(Math.abs(Math.cos((u/.62-v/.8)*Math.PI)),18);
       pz+=Math.min(depth*.24,.032)*(dent*.8+diagonal*.08)*front;
      }
      p.setXYZ(i,px,py,pz);
    }
    geometry.computeVertexNormals();geometry.computeBoundingBox();
    const o=mesh(geometry,material,x,y,z);o.userData={kind:'upholstery',generic:true,tufted};
    if(tufted)for(const a of [-.62,0,.62])for(const b of [-.4,.4]){
     const front=-depth/2*Math.pow(Math.max(0,1-Math.pow(Math.abs(a),2/.48)-Math.pow(Math.abs(b),2/.48)),.48/2)+Math.min(depth*.24,.032)*.8;
     const button=sphere(.014,.014,.007,x+a*w/2,y+b*h/2,z+front-.002,material);o.add(button);button.position.set(a*w/2,b*h/2,front-.002);button.userData={kind:'upholstery-button',generic:true};
    }
    // Welt follows the actual cushion perimeter, with no painted-on stripe.
    if(THREE.CatmullRomCurve3&&THREE.TubeGeometry){
      const points=[],backRadius=Math.sqrt(1-Math.pow(.76,2/.48));for(let i=0;i<48;i++){const a=i/48*Math.PI*2;points.push(orientation==='seat'?new THREE.Vector3(power(Math.cos(a))*w*.502,0,power(Math.sin(a))*depth*.502):new THREE.Vector3(power(Math.cos(a)*backRadius)*w*.502,power(Math.sin(a)*backRadius)*h*.502,-depth*.381));}
      const curve=new THREE.CatmullRomCurve3(points,true),seam=mesh(new THREE.TubeGeometry(curve,64,.0022,4,true),material,x,y,z);seam.userData={kind:'upholstery-seam',generic:true};o.add(seam);seam.position.set(0,0,0);
    }
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
    const chair=model==='loungeChair',shape=m.collection?.shape||'soft',timber=['timber','midcentury'].includes(shape),curved=shape==='curved',linear=shape==='linear',arms=timber?.085:curved?.17:.13,seatW=d.w-2*arms;
    legs(shape==='midcentury'?.24:.16,d.w-.1,d.d-.08,shape==='midcentury'?m.wood:m.dark);
    box(d.w-.035,.16,d.d-.06,0,.24,0,timber?m.wood:m.fabric,linear?.018:.065);
    box(d.w-.035,.40,.14,0,d.h-.22,d.d/2-.095,timber?m.wood:m.fabric,curved?.12:linear?.018:.065);
    for(const x of [-d.w/2+arms/2,d.w/2-arms/2]){
     if(timber){box(arms,.065,d.d-.035,x,.55,0,m.wood,.015);for(const z of [-d.d*.34,d.d*.34])box(.04,.37,.04,x,.345,z,m.wood,.008);for(let z=-d.d*.3;z<d.d*.3;z+=.045)box(.015,.29,.014,x,.38,z,m.slattedWood,.003);}
     else if(shape==='tufted'){
      box(arms*.75,.25,d.d-.06,x,.32,0,m.fabric,.065);
      const roll=cylinder(arms*.68,arms*.68,d.d-.045,x,.54,0,m.fabric);roll.rotation.x=Math.PI/2;roll.userData={kind:'rolled-arm',generic:true};
     }
     else if(curved)cushion(arms,.42,d.d-.06,x,.43,0,m.fabric,'back');
     else box(arms,.41,d.d-.035,x,.43,0,m.fabric,linear?.028:.06);
    }
    const count=chair?1:curved?3:linear?3:2;
    for(let i=0;i<count;i++) {
      const x=-seatW/2+(i+.5)*seatW/count;
      cushion(seatW/count-.025,.16,d.d-.24,x,.45,-.055,m.fabric);
      const back=cushion(seatW/count-.025,curved?.35:.31,curved?.20:.15,x,curved?.63:.67,d.d/2-.185,m.fabric,'back',shape==='tufted');
      back.rotation.x=-.12;
      if(shape==='channel')for(let j=0;j<4;j++)cushion((seatW/count-.04)/4,.29,.055,x-seatW/count*.375+j*seatW/count*.25,.67,d.d/2-.265,m.fabric,'back');

    }
    for (const [x,angle,material] of [[-seatW*.32,.16,m.linen],[seatW*.33,-.18,m.pillow]]) {
      const pillow=cushion(chair?.28:.33,.3,.12,x,.62,d.d/2-.31,material,'back');
      pillow.rotation.z=angle; pillow.rotation.x=.16;
    }
    if(shape==='linen')for(let j=0;j<7;j++){const line=box(.018,.008,.18,-seatW*.35+j*seatW*.12,.38,-d.d*.47,m.fabric,.003);line.rotation.y=.04*Math.sin(j);}
  } else if (/^bed/.test(model)) {
    legs(.16,d.w-.1,d.d-.05);
    box(d.w,.18,d.d-.025,0,.23,0,m.wood,.03);
    box(d.w-.055,.19,d.d-.12,0,.405,.015,m.linen,.07);
    const shape=m.collection?.shape||'soft';
    box(d.w,.7,.10,0,.35,-d.d/2+.05,shape==='timber'?m.wood:m.fabric,shape==='curved'?.12:.025);
    if(['channel','linen'].includes(shape))for(let x=-d.w/2+.07;x<d.w/2-.04;x+=.11)box(.005,.56,.005,x,.36,-d.d/2+.105,m.fabric,.001);
    if(['timber','midcentury'].includes(shape))for(let x=-d.w/2+.05;x<d.w/2-.04;x+=.045)box(.015,.55,.015,x,.35,-d.d/2+.105,m.slattedWood,.003);
    if(shape==='tufted')for(let x=-d.w/2+.12;x<d.w/2-.1;x+=.2)for(const y of [.22,.42,.62])sphere(.019,.019,.009,x,y,-d.d/2+.112,m.fabric);
    box(d.w-.08,.065,d.d*.64,0,.52,d.d*.16,m.linen,.028);
    box(d.w-.06,.034,.38,0,.563,d.d*.32,m.pillow,.02);
    const count=model==='bedDouble'?2:1;
    for(let i=0;i<count;i++) {
      const pillow=cushion((d.w-.24)/count,.12,.43,-(d.w-.24)/2+(i+.5)*(d.w-.24)/count,.535,-d.d*.31,m.linen);
      pillow.rotation.x=.07;
    }
    // A single draped textile surface replaces rigid stripe blocks. Its folds
    // stay within the existing bed envelope and follow the selected linen.
    const cover=new THREE.PlaneGeometry(d.w-.08,d.d*.59,32,24);cover.rotateX(-Math.PI/2);const cp=cover.attributes.position;
    for(let i=0;i<cp.count;i++){const x=cp.getX(i),z=cp.getZ(i),u=x/(d.w-.08),v=z/(d.d*.59),edge=Math.max(0,(Math.abs(u)-.37)/.13),fold=Math.sin(u*26+v*4)*.005+Math.sin(v*19-u*5)*.003;cp.setY(i,fold-.018*edge);}
    cover.computeVertexNormals();mesh(cover,m.linen,0,.555,d.d*.13).userData={kind:'draped-bed-textile',generic:true};
  } else if (/^(table|desk)/.test(model)) {
    if(model==='tableCoffee') {
      const table=m.collection?.table||'oak';
      if(table==='nested'){
       for(const [x,z,r,h]of [[-d.w*.19,-.05,d.d*.47,d.h-.025],[d.w*.25,.13,d.d*.32,d.h*.72]]){cylinder(r,r,.045,x,h,z,m.stone);cylinder(r*.34,r*.38,h-.025,x,(h-.025)/2,z,m.wood);}
      }else if(table==='pedestal'){
       cylinder(d.d*.46,d.d*.46,.045,0,d.h-.023,0,m.wood);cylinder(.08,.15,d.h-.07,0,(d.h-.07)/2+.025,0,m.wood);cylinder(d.d*.31,d.d*.34,.035,0,.025,0,m.wood);
      }else if(table==='glass'){
       const glass=new THREE.MeshPhysicalMaterial({color:'#dce6e1',roughness:.08,transparent:true,opacity:.45,transmission:.35,thickness:.012});
       box(d.w,.035,d.d,0,d.h-.018,0,glass,.018);for(const x of [-d.w*.36,d.w*.36])for(const z of [-d.d*.32,d.d*.32])cylinder(.018,.018,d.h-.04,x,(d.h-.04)/2,z,m.dark);
       box(d.w*.75,.015,d.d*.68,0,.12,0,m.dark,.006);
      }else{
       for(const x of [-d.w*.28,d.w*.28]){
        if(table==='stone')box(.11,d.h-.07,d.d*.64,x,(d.h-.07)/2,0,m.dark,.009);
        else{cylinder(.12,.14,d.h-.05,x,(d.h-.05)/2,0,m.wood);for(let j=0;j<20;j++){const a=j/20*Math.PI*2;cylinder(.008,.008,d.h-.065,x+Math.sin(a)*.127,(d.h-.065)/2,Math.cos(a)*.127,m.wood);}}
       }
       if(table==='oak')ovalTop(d.w,.055,d.d,0,d.h-.028,0,m.wood);
       else box(d.w,.055,d.d,0,d.h-.028,0,table==='stone'?m.stone:m.wood,table==='stone'?.025:.035);
       if(table==='rattan'){box(d.w*.76,.025,d.d*.68,0,.14,0,m.wood,.025);for(let x=-d.w*.34;x<d.w*.34;x+=.035)box(.012,.012,d.d*.62,x,.16,0,m.slattedWood,.003);}
      }
      const book=box(.28,.034,.20,-d.w*.19,d.h+.017,-.055,m.pillow,.003);book.rotation.y=.1;box(.24,.023,.18,-d.w*.20,d.h+.046,-.06,m.linen,.003);
      cylinder(.10,.10,.013,d.w*.22,d.h+.008,.04,m.wood);cylinder(.043,.035,.08,d.w*.22,d.h+.053,.04,m.stone);
      const handle=mesh(new THREE.TorusGeometry(.026,.006,6,14),m.stone,d.w*.22+.04,d.h+.055,.04);handle.rotation.y=Math.PI/2;
    } else {
      legs(d.h-.045,d.w-.08,d.d-.08);
      box(d.w,.045,d.d,0,d.h-.023,0,m.wood,.07);
      if(model==='table') {
        cylinder(.105,.105,.012,0,d.h+.006,0,m.white);
        cylinder(.055,.04,.14,d.w*.22,d.h+.07,0,m.stone);
      } else box(.3,.014,.2,d.w*.15,d.h+.007,-d.d*.15,m.linen,.015);
    }
  } else if(model==='sideTable'){
    cylinder(d.w*.48,d.w*.48,.035,0,d.h-.018,0,m.stone);cylinder(.075,.095,d.h-.04,0,(d.h-.04)/2,0,m.wood);
    cylinder(.048,.063,.11,.025,d.h+.055,0,m.white);sphere(.07,.08,.07,.025,d.h+.135,0,m.green);
  } else if(model==='floorLamp'){
    cylinder(.145,.15,.025,0,.013,0,m.dark);cylinder(.012,.015,d.h*.76,0,d.h*.38,0,m.metal);
    cylinder(d.w*.33,d.w*.49,d.h*.18,0,d.h*.89,0,m.linen);cylinder(.035,.035,.04,0,d.h*.76,0,m.metal);
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
    if(tv&&['soft','channel','timber'].includes(m.collection?.shape))for(let x=-d.w/2+.025;x<d.w/2-.02;x+=.04)box(.022,d.h-leg-.055,.012,x,(d.h+leg)/2,-d.d/2-.032,m.slattedWood,.003);
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
    }
    const foliage=BMH.createSceneFoliage(THREE,{w:.40,h:.96,d:.43},m.leaf);foliage.position.y=.32;root.add(foliage);
  } else if(model==='washingMachine') {
    box(d.w,d.h,d.d,0,d.h/2,0,m.white,.025);
    box(d.w-.05,.13,.012,0,d.h-.08,d.d/2+.008,m.stone,.008);
    const rim=cylinder(.19,.19,.024,0,.40,d.d/2+.016,m.metal);rim.rotation.x=Math.PI/2;
    const glass=cylinder(.151,.151,.026,0,.40,d.d/2+.020,m.screen);glass.rotation.x=Math.PI/2;
    box(.18,.035,.014,-.13,d.h-.08,d.d/2+.018,m.dark,.005);
    const dial=cylinder(.023,.023,.02,.20,d.h-.08,d.d/2+.029,m.metal);dial.rotation.x=Math.PI/2;
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
  root.userData = {source:'parametric',model:selectedModel,generic:true,dimensions:{...d},collection:{...m.collection}};
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
