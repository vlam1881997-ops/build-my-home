/* House presentation built from the measured plan, never from an AI picture.
 * Finish/roof accessories are generic design details, not approved engineering.
 * Sky and ground are locally authored presentation context, not a surveyed site. */
(()=>{
 const B=BMH,version='measured-house-1',finite=Number.isFinite;
 const noise=(x,y)=>{const h=Math.sin(x*127.1+y*311.7)*43758.5453123;return h-Math.floor(h);};
 const smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;
 const field=(x,y)=>{const a=Math.floor(x),b=Math.floor(y),u=smooth(x-a),v=smooth(y-b);return mix(mix(noise(a,b),noise(a+1,b),u),mix(noise(a,b+1),noise(a+1,b+1),u),v);};
 const cloud=(x,y)=>field(x,y)*.56+field(x*2,y*2)*.27+field(x*4,y*4)*.12+field(x*8,y*8)*.05;

 // Finishes use metre UVs. Fine, irregular mineral veins replace thick parallel
 // cartoon strokes. Colour remains a neutral multiplier of the chosen paint/SKU.
 const oldTexture=B.sceneSurfaceTexture;
 B.sceneSurfaceTexture=(THREE,kind,channel='color')=>{
  if(!['marble','stone','tile','concrete','plaster','roof-tile','roof-metal'].includes(kind)||typeof document.createElement!=='function')return oldTexture(THREE,kind,channel);
  const key=version+':'+kind+':'+channel,templates=B.surfaceTextureTemplates||=new Map();let canvas=templates.get(key);
  if(!canvas){
   canvas=document.createElement('canvas');canvas.width=canvas.height=512;const c=canvas.getContext('2d');if(!c?.createImageData)return oldTexture(THREE,kind,channel);
   const size=512,pixels=c.createImageData(size,size),heights=new Float32Array(size*size);
   for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const u=x/size,v=y/size,n=noise(x,y),f=cloud(u*6,v*6);let value=249,height=.5,rough=.88;
    if(kind==='marble'){
     const warp=cloud(u*3+8,v*3)*1.6+cloud(u*9,v*9+2)*.18,vein=Math.pow(Math.max(0,1-Math.abs(Math.sin((u*.9+v+warp)*Math.PI*5))*14),2),hair=Math.pow(Math.max(0,1-Math.abs(Math.sin((u*1.8-v*.7+warp)*Math.PI*10))*30),3);
     value=246+(f-.5)*9-vein*36-hair*12;rough=.53+f*.06; height=.5+(n-.5)*.0008;
    }else if(kind==='tile'){
     const grout=x<2||y<2;value=grout?205:250+(f-.5)*7+(n-.5)*2;height=grout?.36:.5;rough=grout?.97:.68+f*.05;
    }else if(kind==='roof-tile'){
     const wave=Math.sin(u*Math.PI)*.5+.5,lap=y<16;value=lap?178:224+wave*26+(n-.5)*6;height=lap?.18:.45+wave*.11;rough=.82+n*.07;
    }else if(kind==='roof-metal'){
     const seam=x<12;value=seam?215:248+(n-.5)*4;height=seam?.75:.5;rough=.65+n*.08;
    }else{
     value=249+(f-.5)*(kind==='plaster'?5:16)+(n-.5)*3;height=.5+(n-.5)*(kind==='plaster'?.007:.013);rough=kind==='stone'?.76+f*.08:.91+f*.05;
    }
    heights[y*size+x]=height;if(channel==='height')value=height*255;if(channel==='roughness')value=rough*255;
    const i=(y*size+x)*4;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;
   }
   if(channel==='normal')for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const at=(a,b)=>heights[((b+size)%size)*size+(a+size)%size],dx=(at(x+1,y)-at(x-1,y))*2,dy=(at(x,y+1)-at(x,y-1))*2,l=Math.hypot(dx,dy,1),i=(y*size+x)*4;
    pixels.data[i]=(-dx/l*.5+.5)*255;pixels.data[i+1]=(-dy/l*.5+.5)*255;pixels.data[i+2]=(1/l*.5+.5)*255;
   }
   c.putImageData(pixels,0,0);templates.set(key,canvas);
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=channel==='color'?THREE.SRGBColorSpace:THREE.NoColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;t.userData={generic:true,kind,channel,source:version};return t;
 };
 const roofMaterial=B.roofSceneMaterial;
 B.roofSceneMaterial=THREE=>{
  const m=roofMaterial(THREE),surface=B.roofSurfaceSpec().surface,kind=surface==='tile'?'roof-tile':surface==='metal'?'roof-metal':surface==='concrete'?'concrete':null;if(!kind)return m;
  m.map?.dispose();m.map=B.sceneSurfaceTexture(THREE,kind);m.normalMap=B.sceneSurfaceTexture(THREE,kind,'normal');m.roughnessMap=B.sceneSurfaceTexture(THREE,kind,'roughness');m.normalScale.setScalar(surface==='tile'?.65:.22);m.roughness=surface==='metal'?.55:.88;m.userData.surfaceScale=surface==='tile'?[2,2]:surface==='metal'?[.42,2]:[1.2,1.2];m.userData.generic=true;return m;
 };
 const roofUvs=B.roofSurfaceUvs;
 B.roofSurfaceUvs=(THREE,g,p)=>{roofUvs(THREE,g,p);const spec=B.roofSurfaceSpec(),scale=spec.surface==='tile'?[2,2]:spec.surface==='metal'?[.42,2]:[1.2,1.2],uv=g.attributes.uv;if(uv)for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/scale[0],uv.getY(i)/scale[1]);};

 B.roofParapetSpec=()=>{
  const roof=B.measuredDesignSettings().roof,height=Number(roof.parapetHeight),explicit=roof.parapetHeight!==undefined&&finite(height)&&height>=0&&height<=1.2;
  return {height:B.roofDesignSpec().type==='flat'?(explicit?height:.38):0,source:explicit?'customer':'design-suggestion',notice:'Tường chắn mái là chi tiết phương án; cần KTS/KS xác nhận cấu tạo, chống thấm và thoát nước.'};
 };
 const roofSpec=B.sceneRoofSpec;
 B.sceneRoofSpec=(explode=0)=>{const roof=roofSpec(explode),parapet=B.roofParapetSpec();return roof?{...roof,parapet,envelopeTop:roof.eave+roof.rise+parapet.height+(parapet.height>0?.025:0)}:null;};
 // The very same parts are rendered by Three and projected onto elevations.
 // Parcel clipping never fills a notch or an upper-floor terrace/shaft void.
 B.houseConstructionDetails=()=>{
  const p=B.state.project,l=B.studioLevels(),roof=B.sceneRoofSpec(),parts=[];
  const add=(floor,kind,x,y,z,w,h,d,side,role='wall',openingId=null)=>{
   if(![x,y,z,w,h,d].every(finite)||w<.001||h<.001||d<.001)return;
   const ex=Math.min(p.site.width,x+w),ez=Math.min(p.site.depth,z+d);x=Math.max(0,x);z=Math.max(0,z);w=ex-x;d=ez-z;if(w<.001||d<.001)return;
   if(p.site.useParcelGeometry&&B.roomInsideParcel&&!B.roomInsideParcel({x,y:z,w,h:d},{...p.site,setbackFront:0,setbackRear:0,setbackSide:0}))return;
   const id=[version,kind,floor,openingId||'',x,y,z,w,h,d].join('-');parts.push({id,kind,floor,roomId:null,openingId,x,y,z,w,h,d,horizontal:['front','back'].includes(side),projectionSide:side,role,color:role==='frame'?'#'+B.scenePalette().frame.toString(16).padStart(6,'0'):B.facadeFinishPalette().wall,styleId:B.architecturalIdentity().id,generic:true,provisional:true,structural:false});
  };
  if(roof?.type==='flat'&&roof.parapet.height>0){
   const f=l.floors-1,g=B.scenePlanGeometry(p.plan,f);
   for(const w of g.walls.filter(w=>w.roomIds.length===1)){
    const r=p.plan.rooms.find(r=>r.id===w.roomIds[0]),near=w.horizontal?w.axis<r.y+r.h/2:w.axis<r.x+r.w/2,side=w.horizontal?(near?'front':'back'):(near?'left':'right'),t=w.thickness,len=w.b-w.a;
    const x=w.horizontal?w.a:w.axis-t/2,z=w.horizontal?w.axis-t/2:w.a;
    add(f,'roof-parapet',x,roof.eave,z,w.horizontal?len:t,roof.parapet.height,w.horizontal?t:len,side);
    add(f,'roof-coping',x-.008,roof.eave+roof.parapet.height,z-.008,(w.horizontal?len:t)+.016,.025,(w.horizontal?t:len)+.016,side,'frame');
   }
  }
  // Paint the jamb returns, below the measured window head and above its sill.
  // These millimetre skins never alter the saved opening or its clear size.
  for(let f=0;f<l.floors;f++)for(const w of B.scenePlanGeometry(p.plan,f).walls.filter(w=>w.kind!=='wall'&&w.roomIds.length===1)){
   const r=p.plan.rooms.find(r=>r.id===w.roomIds[0]),near=w.horizontal?w.axis<r.y+r.h/2:w.axis<r.x+r.w/2,side=w.horizontal?(near?'front':'back'):(near?'left':'right'),base=B.studioFloorLevel(f).base+l.slab+(w.sill||0),t=w.thickness,skin=.002;
   for(const u of [w.a-skin,w.b])add(f,'opening-jamb',w.horizontal?u:w.axis-t/2,base,w.horizontal?w.axis-t/2:u,w.horizontal?skin:t,w.height,w.horizontal?t:skin,side,'wall',w.openingId);
  }
  return parts;
 };
 const facade=B.facadeComponents;B.facadeComponents=()=>{
  const original=facade(),joints=[];
  for(const panel of original.filter(p=>p.kind==='timber-panel'))for(let u=.14;u<(panel.horizontal?panel.w:panel.d)-.035;u+=.14){
   const part={...panel,id:panel.id+'-board-joint-'+u,kind:'timber-panel-joint',role:'frame',color:'#'+B.scenePalette().frame.toString(16).padStart(6,'0')};
   if(panel.horizontal){part.x+=u;part.w=.004;part.z=panel.projectionSide==='front'?panel.z-.008:panel.z+panel.d;part.d=.008;}else{part.z+=u;part.d=.004;part.x=panel.projectionSide==='left'?panel.x-.008:panel.x+panel.w;part.w=.008;}
   if(part.x>=0&&part.z>=0&&part.x+part.w<=B.state.project.site.width&&part.z+part.d<=B.state.project.site.depth)joints.push(part);
  }return [...original,...joints,...B.houseConstructionDetails()];
 };
 const assembly=B.windowAssembly;
 B.windowAssembly=o=>{
  const parts=assembly(o);for(const pane of parts.filter(p=>p.finish==='glass')){
   const horizontal=pane.w>pane.d,handle={...pane,kind:'window-frame',part:'sash-handle-'+parts.length,finish:'frame',y:pane.y+pane.h*.45,h:Math.min(.12,pane.h*.2),w:horizontal?.014:.023,d:horizontal?.023:.014};
   if(horizontal){handle.x=pane.x+pane.w-.035;handle.z=pane.z-.009;}else{handle.z=pane.z+pane.d-.035;handle.x=pane.x-.009;}parts.push(handle);
  }return parts;
 };

 // Author a lightweight daylight sky locally. It supplies both the visible
 // horizon and the glass reflection; no street/location or AI output is invented.
 B.houseSkyTexture=THREE=>{
  if(typeof document.createElement!=='function')return null;const templates=B.skyTextureTemplates||=new Map(),key=version+'-sky';let canvas=templates.get(key);
  if(!canvas){
   canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const c=canvas.getContext('2d');if(!c?.createImageData)return null;const pixels=c.createImageData(1024,512);
   for(let y=0;y<512;y++)for(let x=0;x<1024;x++){
    const h=Math.cos(y/512*Math.PI),t=Math.pow(Math.abs(h),.52),horizon=[220,230,232],pole=h>=0?[101,158,203]:[154,163,155],nx=Math.cos(x/1024*Math.PI*2),nz=Math.sin(x/1024*Math.PI*2),f=cloud(nx*3+10,nz*3+y/80),cloudMask=h>0?Math.max(0,(f-.49)*3)*Math.min(1,h*5):0;
    const i=(y*1024+x)*4;for(let ch=0;ch<3;ch++)pixels.data[i+ch]=mix(mix(horizon[ch],pole[ch],t),248,cloudMask*.7);pixels.data[i+3]=255;
   }c.putImageData(pixels,0,0);templates.set(key,canvas);
  }
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;t.mapping=THREE.EquirectangularReflectionMapping;t.userData={generic:true,presentationOnly:true,source:version};return t;
 };
 B.houseEnvironmentData=THREE=>{
  if(!THREE.RGBELoader)return Promise.resolve(null);if(B.houseEnvironmentPromise)return B.houseEnvironmentPromise;
  B.houseEnvironmentPromise=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);try{
   const response=await fetch('assets/interior/environments/daylight-1k.hdr',{signal:controller.signal});if(!response.ok)throw Error('HDR unavailable');
   const data=new THREE.RGBELoader().parse(await response.arrayBuffer());return {data:data.data,width:data.width,height:data.height,type:data.type};
  }catch(_){B.houseEnvironmentPromise=null;return null;}finally{clearTimeout(timer);}})();return B.houseEnvironmentPromise;
 };
 B.installHouseEnvironment=async c=>{
  const {THREE,scene,renderer}=c,data=await B.houseEnvironmentData(THREE);if(!data||scene.userData.disposed)return false;
  const hdr=new THREE.DataTexture(data.data,data.width,data.height,THREE.RGBAFormat,data.type);hdr.mapping=THREE.EquirectangularReflectionMapping;hdr.colorSpace=THREE.LinearSRGBColorSpace;hdr.minFilter=hdr.magFilter=THREE.LinearFilter;hdr.needsUpdate=true;hdr.userData={generic:true,presentationOnly:true,source:'kloppenheim_06_puresky',license:'CC0-1.0'};
  const generator=new THREE.PMREMGenerator(renderer);let target;try{target=generator.fromEquirectangular(hdr);}catch(_){hdr.dispose();return false;}finally{generator.dispose();}
  if(scene.userData.disposed){target.dispose();hdr.dispose();return false;}
  const maps=scene.userData.surfaceTextures||=new Map(),previous=maps.get('house-sky');scene.userData.environmentTarget?.dispose();scene.userData.environmentTarget=target;scene.environment=target.texture;maps.set('house-sky',hdr);scene.userData.houseHDR=hdr;scene.backgroundBlurriness=.015;
  const presentation=scene.userData.modelPresentation;if(presentation)presentation.background=hdr;
  if(B.modelLook()!=='neon')scene.background=hdr;previous?.dispose();
  const s=B.studio3d;if(s?.scene===scene&&!s.archRender&&!s.sharpExport)(s.requestRender||s.renderFrame).call(s);return true;
 };
 B.configureHousePresentation=c=>{
  const {THREE,scene,renderer,ground,displayBase,focus,roomFocus,floorFocus,explode}=c,day=B.state.ui.sceneTheme!=='night',whole=focus==='all'&&!explode;
  scene.userData.realHouse={revision:version,source:'measured-plan',context:'illustrative-sky-and-ground',engineeringApproved:false};
  if(whole){displayBase.visible=false;ground.position.y=-.018;ground.material.color.set('#c4c5bb');const maps=scene.userData.surfaceTextures||=new Map();for(const [slot,channel]of [['map','color'],['normalMap','normal'],['roughnessMap','roughness']]){const t=B.sceneSurfaceTexture(THREE,'concrete',channel);maps.set('house-ground-'+channel,t);ground.material[slot]=t;}ground.material.userData.surfaceScale=[1.2,1.2];ground.material.normalScale.setScalar(.12);B.sceneSurfaceUvs(ground.geometry,ground.material);ground.material.needsUpdate=true;}
  if(whole&&day){
   const sky=B.houseSkyTexture(THREE);if(sky){const generator=new THREE.PMREMGenerator(renderer);try{const target=generator.fromEquirectangular(sky);scene.userData.environmentTarget?.dispose();scene.userData.environmentTarget=target;scene.environment=target.texture;scene.background=sky;(scene.userData.surfaceTextures||=new Map()).set('house-sky',sky);}finally{generator.dispose();}}
   scene.fog=new THREE.Fog('#dce6e8',60,160);
  }
  if(day){
   for(const light of scene.children.filter(o=>o.isLight)){
    if(light.isHemisphereLight){light.color.set('#eef4ff');light.groundColor.set('#c4c7bb');light.intensity=whole?.55:1.65;}
    else if(light.isDirectionalLight){light.color.set(light.castShadow?'#fff5e8':'#dcecff');light.intensity=light.castShadow?2.7:.28;}
   }renderer.toneMappingExposure=whole?1:.98;
  }
  if(whole&&day){
   // Raster environment lighting cannot see roof occlusion. A bounded indoor
   // fill approximation keeps closed rooms from glowing through the windows.
   // The photographic ray tracer computes visibility instead; no colour/SKU is
   // changed, and an inside-room view retains its independent lighting.
   const materials=new Set(),exterior=new Set(['facade-detail','roof','roof-gable','window-frame','window-glass','door-frame','display-ground','display-base']);
   scene.traverse(o=>{if(!o.isMesh||o.userData.presentationOnly||exterior.has(o.userData.kind))return;for(let p=o;p;p=p.parent)if(p.userData.kind==='door-leaf')return;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.isMeshStandardMaterial)materials.add(m);});
   for(const m of materials){const prior=m.onBeforeCompile.bind(m),key=m.customProgramCacheKey.bind(m);m.onBeforeCompile=(shader,renderer)=>{prior(shader,renderer);shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight *= 0.38;\n#include <opaque_fragment>');};m.customProgramCacheKey=()=>key()+'-house-indoor-fill-v1';m.needsUpdate=true;}
  }
  scene.traverse(mesh=>{
   if(mesh.userData.kind==='roof'&&mesh.material.userData.roofSurface==='tile')for(const [slot,channel]of [['map','diff'],['normalMap','nor_gl'],['roughnessMap','rough']]){
    const texture=mesh.material[slot];if(!texture?.image?.getContext)continue;const canvas=texture.image,ctx=canvas.getContext('2d');
    const task=B.scenePhotoSurface(THREE,scene,'roof_07',channel).then(image=>{if(!image||scene.userData.disposed)return false;ctx.drawImage(image,0,0,512,512);texture.needsUpdate=true;texture.userData={...texture.userData,source:'roof_07',license:'CC0-1.0'};return true;});(scene.userData.surfaceLoads||=[]).push(task);
   }
   if(mesh.userData.kind==='window-glass'){
    const m=mesh.material;m.color.set('#e6eff1');m.opacity=1;m.transparent=false;m.transmission=.72;m.thickness=.008;m.ior=1.5;m.roughness=.045;m.envMapIntensity=1.2;m.clearcoat=.15;m.depthWrite=true;m.userData.generic=true;m.needsUpdate=true;
   }
   if(mesh.userData.kind==='ceiling-slab'&&roomFocus&&B.state.ui.roomCamera==='inside'){
    // A separate light ceiling finish prevents brown wood/paint from being
    // assigned to the ceiling merely because it shares a room's material cache.
    const old=mesh.material,ceiling=old.clone();ceiling.color.set('#f3f1e9');ceiling.userData={...old.userData,finishSlot:'ceiling'};mesh.material=ceiling;
   }
  });
 };
 const configure=B.configureModelPresentation;B.configureModelPresentation=c=>{
  B.configureHousePresentation(c);configure(c);
  if(c.focus==='all'&&!c.explode&&B.state.ui.sceneTheme!=='night')(c.scene.userData.surfaceLoads||=[]).push(B.installHouseEnvironment(c));
 };
 const panel=B.measuredDesignPanel;
 B.measuredDesignPanel=()=>{
  const roof=B.roofParapetSpec(),input=B.roofDesignSpec().type==='flat'?'<label>Tường chắn mái (m)<input type="number" data-measured-field="roof.parapetHeight" min="0" max="1.2" step="0.01" value="'+roof.height+'"></label>':'';
  return panel().replace('</div><p>Đổi mái/tường',input+'</div><p>Đổi mái/tường').replace('Bề dày tường, sàn và mái cần hồ sơ kỹ thuật xác nhận.','Bề dày tường, sàn và mái cần hồ sơ kỹ thuật xác nhận. '+(roof.height>0?'Tường chắn mái '+Math.round(roof.height*1000)+' mm '+(roof.source==='customer'?'theo số đo bạn nhập.':'là gợi ý phương án; nhập số đo thực hoặc 0 để bỏ.') :''));
 };
 const review=B.architecturalIdentityReview;
 B.architecturalIdentityReview=()=>({...review(),constructionDetailRevision:version,parapet:B.roofParapetSpec(),context:'Bầu trời và mặt đất minh họa; công trình lấy từ bản vẽ.',engineeringApproved:false});
 const drawingRevision=B.drawingRevision;B.drawingRevision=()=>drawingRevision()+'-RH1';
 B.ARCH_RENDER_REVISION='customer-measured-house-10';
})();
