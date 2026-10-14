/* Progressive architectural rendering of the customer's measured scene. */
BMH.ARCH_RENDER_REVISION='customer-measured-assemblies-8';
BMH.ARCH_RENDER_PRESETS={draft:{width:640,samples:16,bounces:4,budgetMs:12000},fine:{width:960,samples:128,bounces:8,budgetMs:30000},print:{width:1920,samples:512,bounces:10,budgetMs:120000}};
BMH.archRenderModules=null;
BMH.archRenderStatus=text=>{const node=BMH.$('#architecturalRenderStatus');if(node&&node.textContent!==text)node.textContent=text;};
// The pinned path tracer merges one material per mesh. A six-face slab array
// would otherwise shift every following material index in its flattened list.
// Split only the photographic copy; the measured model keeps its face groups.
BMH.photographicMaterialMeshes=(THREE,geometry,material)=>{
 if(!Array.isArray(material))return [new THREE.Mesh(geometry,material)];
 const groups=new Map(),sourceIndex=geometry.index;
 for(const group of geometry.groups){const m=material[group.materialIndex];if(!m)continue;if(!groups.has(m))groups.set(m,[]);const indices=groups.get(m),end=Math.min(group.start+group.count,sourceIndex?.count??geometry.attributes.position.count);for(let i=group.start;i<end;i++)indices.push(sourceIndex?sourceIndex.getX(i):i);}
 const meshes=[];for(const [m,indices]of groups){const part=new THREE.BufferGeometry();for(const [key,attribute]of Object.entries(geometry.attributes))part.setAttribute(key,attribute.clone());part.setIndex(indices);meshes.push(new THREE.Mesh(part,m));}geometry.dispose();return meshes;
};
// Bake presentation clipping in world space. The plan and original wall meshes remain untouched.
BMH.renderMeshGeometry=(THREE,mesh,{purpose='photograph'}={})=>{
 const source=mesh.geometry,material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material,planes=material?.clippingPlanes||[];let local=source.clone();
 if(purpose!=='model'&&!Array.isArray(mesh.material)&&source.type==='BoxGeometry'&&THREE.RoundedBoxGeometry&&!(source instanceof THREE.RoundedBoxGeometry)){const p=source.parameters;local.dispose();local=new THREE.RoundedBoxGeometry(p.width,p.height,p.depth,2,Math.min(.004,Math.min(p.width,p.height,p.depth)*.12));BMH.sceneSurfaceUvs?.(local,material,mesh.position);}
 const world=local.applyMatrix4(mesh.matrixWorld);
 if(!planes.length)return world;
 const geometry=world.index?world.toNonIndexed():world,attrs=geometry.attributes,positions=[],normals=[],uvs=[],caps=planes.map(()=>[]);
 const vertex=i=>({p:new THREE.Vector3().fromBufferAttribute(attrs.position,i),n:attrs.normal?new THREE.Vector3().fromBufferAttribute(attrs.normal,i):new THREE.Vector3(0,1,0),uv:attrs.uv?new THREE.Vector2().fromBufferAttribute(attrs.uv,i):new THREE.Vector2()});
 const write=v=>{positions.push(v.p.x,v.p.y,v.p.z);normals.push(v.n.x,v.n.y,v.n.z);uvs.push(v.uv.x,v.uv.y);};
 for(let i=0;i<attrs.position.count;i+=3){let polygon=[vertex(i),vertex(i+1),vertex(i+2)];
  for(let pi=0;pi<planes.length;pi++){const plane=planes[pi],out=[];for(let j=0;j<polygon.length;j++){const a=polygon[j],b=polygon[(j+1)%polygon.length],da=plane.distanceToPoint(a.p),db=plane.distanceToPoint(b.p),insideA=da>=-1e-7,insideB=db>=-1e-7;if(insideA)out.push(a);if(insideA!==insideB){const t=da/(da-db),v={p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize(),uv:a.uv.clone().lerp(b.uv,t)};out.push(v);caps[pi].push(v.p.clone());}}polygon=out;if(polygon.length<3)break;}
  for(let j=1;j<polygon.length-1;j++)[polygon[0],polygon[j],polygon[j+1]].forEach(write);
 }
 // Convex box walls/door leaves need a finished cut edge; drapery remains an open surface.
 if(source.type==='BoxGeometry'||source.type==='RoundedBoxGeometry')for(let pi=0;pi<planes.length;pi++){
  const unique=new Map(caps.flat().filter(p=>Math.abs(planes[pi].distanceToPoint(p))<1e-6&&planes.every(plane=>plane.distanceToPoint(p)>=-1e-6)).map(p=>[[p.x,p.y,p.z].map(n=>Math.round(n*1e6)).join(','),p])),points=[...unique.values()];if(points.length<3)continue;
  const normal=planes[pi].normal.clone().negate(),u=new THREE.Vector3(1,0,0);if(Math.abs(normal.dot(u))>.9)u.set(0,0,1);u.cross(normal).normalize();const v=normal.clone().cross(u),center=points.reduce((a,p)=>a.add(p),new THREE.Vector3()).multiplyScalar(1/points.length);
  points.sort((a,b)=>Math.atan2(a.clone().sub(center).dot(v),a.clone().sub(center).dot(u))-Math.atan2(b.clone().sub(center).dot(v),b.clone().sub(center).dot(u)));
  for(let j=0;j<points.length;j++)for(const p of [center,points[j],points[(j+1)%points.length]])write({p,n:normal,uv:new THREE.Vector2(p.x,p.z)});
 }
 if(geometry!==world)geometry.dispose();world.dispose();const result=new THREE.BufferGeometry();result.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));result.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));result.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));result.computeBoundingBox();return result;
};
BMH.architecturalRenderScene=(THREE,source,{purpose='photograph'}={})=>{
 const measured=purpose==='model',ui=BMH.state.ui,room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===ui.sceneFocus),site=BMH.state.project.site,photographicRoom=!measured&&room&&room.type!=='stairs'&&ui.roomCamera==='inside';
 const scene=new THREE.Scene(),materials=new Map(),ownedMaterials=new Set(),revision=BMH.drawingRevision?.()||source.userData.designRevision||'';source.updateMatrixWorld(true);
 source.traverse(o=>{
  if(!o.visible||o.userData.presentationOnly&&(measured||o.userData.kind!=='display-ground'))return;for(let parent=o.parent;parent;parent=parent.parent)if(!parent.visible||parent.userData.presentationOnly)return;
  if(o.isMesh){
   if(photographicRoom&&o.userData.kind==='ceiling-slab')return;
   if(o.userData.kind==='contact-shadow')return;
   const geometry=BMH.renderMeshGeometry(THREE,o,{purpose});if(!geometry.attributes.position.count){geometry.dispose();return;}
   const convert=m=>{if(materials.has(m))return materials.get(m);let copy=m.clone();copy.clippingPlanes=[];BMH.restoreModelMaterial?.(copy,m);
    if(!measured&&m.isMeshPhysicalMaterial&&m.transparent&&m.opacity<.85){const glass=new THREE.MeshPhysicalMaterial({color:m.color.clone().lerp(new THREE.Color('#ffffff'),.65),roughness:.015,transmission:.98,thickness:0,ior:1.45,metalness:0,side:THREE.DoubleSide});copy.dispose();copy=glass;}
    // The physical renderer supports normal maps; height maps stay on the fast viewer.
    // Broad photographic sources replace small preview emitters; their visible
    // measured geometry remains. Duplicate emitters cause rare bright paths.
    if(photographicRoom&&copy.emissive)copy.emissiveIntensity=0;
    copy.envMap=null;materials.set(m,copy);ownedMaterials.add(copy);return copy;};
   const material=Array.isArray(o.material)?o.material.map(convert):convert(o.material),meshes=measured?[new THREE.Mesh(geometry,material)]:BMH.photographicMaterialMeshes(THREE,geometry,material),inherited={};for(let parent=o.parent;parent;parent=parent.parent)for(const key of ['roomId','roomIds','openingId','fixtureId','furnitureId','shaftId','componentId','floor','designRevision'])if(inherited[key]===undefined&&parent.userData[key]!==undefined)inherited[key]=parent.userData[key];for(const mesh of meshes){mesh.name=o.name;mesh.userData={designRevision:revision,...inherited,...o.userData};scene.add(mesh);}
  }else if(o.isLight&&!o.isHemisphereLight&&o.intensity>0){if(photographicRoom&&(o.isPointLight||o.isDirectionalLight))return;const light=o.clone();light.castShadow=false;light.position.copy(o.getWorldPosition(new THREE.Vector3()));if(light.isDirectionalLight){if(!measured&&BMH.state.ui.sceneFocus==='all'&&BMH.state.ui.sceneTheme!=='night')light.intensity=o.castShadow?3.2:.25;light.radius=.035;light.target.position.copy(o.target.getWorldPosition(new THREE.Vector3()));scene.add(light.target);}scene.add(light);}
 });
 // Eye-height photographs include the measured ceiling; open inspection views keep covers off.
 if(photographicRoom){
  const levels=BMH.studioFloorLevel?.(room.floor)||BMH.projectLevels(),material=materials.values().next().value?.clone()||new THREE.MeshStandardMaterial({color:'#eee8df',roughness:.92});material.color.set('#eee8df');material.map=null;material.normalMap=null;ownedMaterials.add(material);
  const ceilingY=(levels.height??levels.floorHeight)-(levels.ceilingDrop||0);
  for(const p of BMH.slabPanels(room,BMH.stairFloorHoles(room.floor+1))){const mesh=new THREE.Mesh(new THREE.BoxGeometry(p.w,levels.slab,p.d),material);mesh.position.set(p.x+p.w/2-site.width/2,ceilingY+levels.slab/2,p.y+p.d/2-site.depth/2);mesh.userData={kind:'ceiling-slab',roomId:room.id,floor:room.floor};scene.add(mesh);}
  // Broad photographic fill converges cleanly; daylight comes from the actual
  // opening locations rather than a small, bright emitter in the room centre.
  const night=BMH.state.ui.sceneTheme==='night',light=new THREE.RectAreaLight('#fff5ec',night?2.8:.18,room.w*.65,room.h*.65);light.position.set(room.x+room.w/2-site.width/2,ceilingY-.025,room.y+room.h/2-site.depth/2);light.rotation.x=-Math.PI/2;light.userData.kind='render-lighting';scene.add(light);
  if(!night)for(const opening of BMH.state.project.plan.openings.filter(o=>o.roomId===room.id&&o.kind==='window')){
   const span=BMH.openingWallSpan?.(opening);if(!span)continue;const horizontal=span.o==='h',inward={north:1,south:-1,west:1,east:-1}[opening.side],height=Number(opening.height)||1.4,windowLight=new THREE.RectAreaLight('#f3f6ff',5.2,span.b-span.a,height);
   windowLight.position.set((horizontal?(span.a+span.b)/2:span.c+inward*.13)-site.width/2,levels.slab+(Number(opening.sill)||0)+height/2,(horizontal?span.c+inward*.13:(span.a+span.b)/2)-site.depth/2);windowLight.rotation.y={north:Math.PI,south:0,west:-Math.PI/2,east:Math.PI/2}[opening.side];windowLight.userData={kind:'render-lighting',openingId:opening.id};scene.add(windowLight);
  }
 }
 scene.background=source.background?.isTexture?source.background:source.background?.clone?.()||new THREE.Color('#ece9e0');scene.backgroundRotation=new THREE.Euler();scene.environmentRotation=new THREE.Euler();scene.backgroundIntensity=1;scene.environmentIntensity=1;scene.userData={purpose,units:'metres',designRevision:revision,ownedMaterials};return scene;
};
BMH.disposeArchitecturalRender=s=>{
 s=s||BMH.studio3d;if(!s)return;s.renderEpoch=(s.renderEpoch||0)+1;const r=s.archRender;if(!r)return;r.cancelled=true;cancelAnimationFrame(r.raf);
 // The pinned engine's public dispose references an obsolete quad name. Dispose its owned targets explicitly.
 const pt=r.tracer,materials=new Set(),resources=new Set();for(const k of ['_pathTracer','_lowResPathTracer']){const item=pt?.[k];if(item){materials.add(item.material);materials.add(item._blendQuad?.material);item.dispose();}}
 for(const material of materials){for(const [key,u] of Object.entries(material?.uniforms||{})){if(['backgroundMap','sobolTexture'].includes(key))continue;const value=u.value,owned=value?.isTexture?value.bmhRenderTarget||value:value;if(owned?.dispose)resources.add(owned);}material?.dispose?.();}
 for(const value of resources){value.fsQuad?.material?.dispose?.();value.dispose();}
 pt?._generator?.geometry?.dispose?.();pt?._quad?.material?.dispose?.();pt?._quad?.dispose?.();pt?._internalBackground?.dispose?.();pt?._colorBackground?.dispose?.();r.denoise?.material?.dispose?.();r.denoise?.dispose?.();r.guide?.dispose?.();r.environment?.dispose?.();r.scene?.traverse(o=>o.geometry?.dispose?.());for(const m of r.scene?.userData.ownedMaterials||[])m.dispose();s.archRender=null;
};
BMH.startArchitecturalRender=async()=>{
 const s=BMH.studio3d;if(!s?.renderer){BMH.archRenderStatus('Mở một góc nhìn 3D trước khi tạo ảnh.');return false;}
 // The default sharp image redraws the measured scene at higher resolution.
 // Expensive light transport is reserved for an explicit detailed-image choice.
 if((BMH.state.ui.renderQuality||'draft')==='draft')return BMH.captureSharpStudioPreview();
 BMH.disposeArchitecturalRender(s);const epoch=s.renderEpoch,signature=BMH.cinematicSignature();BMH.archRenderStatus('Đang chuẩn bị ánh sáng và vật liệu…');
 try{
  if(!s.renderer.capabilities?.isWebGL2||!s.renderer.extensions.has('EXT_color_buffer_float'))throw Error('Thiết bị này chưa hỗ trợ render chất lượng cao. Bạn vẫn xem và chỉnh 3D được.');
  await Promise.allSettled(s.scene.userData.furnitureLoads||[]);
  await Promise.allSettled(s.scene.userData.surfaceLoads||[]);
  if(BMH.studio3d!==s||s.renderEpoch!==epoch||signature!==BMH.cinematicSignature())return false;
  const modules=await (BMH.archRenderModules||(BMH.archRenderModules=import('./vendor/three/pathtracer.js').catch(e=>{BMH.archRenderModules=null;throw e;}))),THREE=await BMH.ensureThree();
  if(BMH.studio3d!==s||s.renderEpoch!==epoch||signature!==BMH.cinematicSignature())return false;
  const preset=BMH.ARCH_RENDER_PRESETS[BMH.state.ui.renderQuality]||BMH.ARCH_RENDER_PRESETS.draft,scene=BMH.architecturalRenderScene(THREE,s.scene),environment=s.scene.userData.houseHDR?.clone()||new modules.GradientEquirectTexture(128);
  if(!s.scene.userData.houseHDR){environment.topColor.set(BMH.state.ui.sceneTheme==='night'?'#60718e':'#e6eff8');environment.bottomColor.set(BMH.state.ui.sceneTheme==='night'?'#1c242c':'#c4c8c2');environment.exponent=1;environment.update();}scene.environment=environment;scene.environmentIntensity=BMH.state.ui.sceneTheme==='night'?.35:BMH.state.ui.sceneFocus==='all'?.75:1.7;
  s.archRender={scene,environment,preset,signature,raf:0,cancelled:false,samples:0,complete:false,paused:false,startedAt:performance.now()};
  const tracer=new modules.WebGLPathTracer(s.renderer);s.archRender.tracer=tracer;const denoise=new modules.FullScreenQuad(new modules.DenoiseMaterial({sigma:1.6,kSigma:1,threshold:.12}));s.archRender.denoise=denoise;
  tracer.bounces=preset.bounces;tracer.transmissiveBounces=6;tracer.filterGlossyFactor=.35;tracer.textureSize.set(512,512);tracer.tiles.set(4,4);tracer.minSamples=1;tracer.renderDelay=0;tracer.fadeDuration=0;tracer.rasterizeScene=false;tracer.renderToCanvas=false;
  const size=s.renderer.getDrawingBufferSize(new THREE.Vector2()),width=Math.min(preset.width,s.renderer.capabilities.maxTextureSize,Math.sqrt(6000000*size.x/size.y));tracer.setScene(scene,s.camera);tracer.synchronizeRenderSize=false;tracer._pathTracer.alpha=true;tracer._pathTracer.setSize(Math.floor(width),Math.floor(width*size.y/size.x));tracer._pathTracer.reset();BMH.state.ui.renderMode='quality';BMH.save();
  const guide=new THREE.WebGLRenderTarget(tracer.target.width,tracer.target.height,{type:THREE.HalfFloatType,depthBuffer:true,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter}),guideMaterial=new modules.ArchitecturalGuideMaterial(),previousTarget=s.renderer.getRenderTarget(),previousClear=s.renderer.getClearColor(new THREE.Color()),previousAlpha=s.renderer.getClearAlpha(),background=scene.background;guideMaterial.side=THREE.DoubleSide;
  s.archRender.guide=guide;
  try{scene.overrideMaterial=guideMaterial;scene.background=null;s.renderer.setClearColor(0,0);s.renderer.setRenderTarget(guide);s.renderer.render(scene,s.camera);}finally{scene.overrideMaterial=null;scene.background=background;s.renderer.setRenderTarget(previousTarget);s.renderer.setClearColor(previousClear,previousAlpha);guideMaterial.dispose();}
  denoise.material.uniforms.guide.value=guide.texture;denoise.material.uniforms.resolution.value.set(guide.width,guide.height);denoise.material.uniforms.projectionScale.value.set(s.camera.projectionMatrix.elements[0],s.camera.projectionMatrix.elements[5]);
  document.querySelectorAll('[data-architectural-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.architecturalMode==='quality')));
  const render=s.archRender,draw=()=>{
   render.raf=0;
   if(BMH.studio3d!==s||s.archRender!==render||render.cancelled)return;
   if(signature!==BMH.cinematicSignature()){BMH.stopArchitecturalRender();BMH.archRenderStatus('Thiết kế đã đổi. Chọn Render chất lượng cao để tạo ảnh mới.');return;}
   if(document.hidden){render.raf=requestAnimationFrame(draw);return;}
   try{tracer._pathTracer.update();const samples=Math.floor(tracer.samples);if(samples>render.samples){render.samples=samples;denoise.material.map=tracer.target.texture;denoise.material.uniforms.samples.value=samples;denoise.render(s.renderer);}BMH.archRenderStatus(tracer.isCompiling?'Đang chuẩn bị bộ render…':'Ảnh đang nét dần · '+render.samples+'/'+preset.samples+' lượt · Có thể tải khi đã có ảnh.');
    if(tracer.samples>=preset.samples){render.complete=true;BMH.archRenderStatus('Ảnh đã hoàn tất · '+Math.round(tracer.target.width)+' × '+Math.round(tracer.target.height)+' px · Có thể tải ảnh.');}
    else if(performance.now()-render.startedAt>=preset.budgetMs){render.paused=true;BMH.archRenderStatus(render.samples>0?'Đã có ảnh · '+render.samples+'/'+preset.samples+' lượt. Tải ảnh hiện tại hoặc chọn Làm nét tiếp.':'Bộ ánh sáng cần thêm thời gian trên thiết bị này. Chọn Xuất ảnh nét nhanh hoặc Làm nét tiếp.');}
    else render.raf=requestAnimationFrame(draw);
   }catch(e){BMH.stopArchitecturalRender();BMH.archRenderStatus('Không tạo được ảnh trên thiết bị này. Chế độ 3D nhanh vẫn hoạt động.');console.warn('BMH architectural renderer',e);}
  };render.draw=draw;render.raf=requestAnimationFrame(draw);return true;
 }catch(e){console.warn('BMH render setup',e);if(BMH.studio3d===s&&s.renderEpoch===epoch){BMH.stopArchitecturalRender();BMH.archRenderStatus(e.message?.includes('Thiết bị')?e.message:'Bộ render chưa tải được. Thử lại hoặc tiếp tục xem 3D nhanh.');}return false;}
};
BMH.stopArchitecturalRender=()=>{const s=BMH.studio3d;BMH.disposeArchitecturalRender(s);BMH.state.ui.renderMode='interactive';BMH.save();document.querySelectorAll('[data-architectural-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.architecturalMode==='interactive')));s?.renderFrame();};
BMH.resumeArchitecturalRender=()=>{const r=BMH.studio3d?.archRender;if(!r?.paused||r.complete||r.cancelled||r.signature!==BMH.cinematicSignature())return false;r.paused=false;r.startedAt=performance.now();r.raf=requestAnimationFrame(r.draw);return true;};
BMH.captureStudioPreview=async()=>{
 const s=BMH.studio3d;if(!s?.renderer){BMH.archRenderStatus('Mô hình đang tải. Khi thấy 3D, bạn có thể lấy ảnh ngay.');return false;}
 const revision=BMH.drawingRevision?.()||'',designKey=BMH.cinematicSignature?.()||'',cameraKey=BMH.cinematicCameraKey?.()||'',view=BMH.state.ui.sceneFocus||'all';
 try{
  // A raster snapshot is immediately available, independent of the physical renderer.
  if(s.composer)s.composer.render();else s.renderer.render(s.scene,s.camera);
  const image=new Promise(resolve=>s.renderer.domElement.toBlob(resolve,'image/png'));
  if(s.archRender?.samples>0)s.archRender.denoise.render(s.renderer);
  const blob=await image;if(!blob||BMH.studio3d!==s||designKey!==(BMH.cinematicSignature?.()||'')||cameraKey!==(BMH.cinematicCameraKey?.()||''))return false;
  BMH.download('BMH-'+view.replace(/[^a-z0-9_-]/gi,'-')+(revision?'-'+revision:'')+'-xem-nhanh.png',blob,'image/png');BMH.lastQuickExport={designRevision:revision,view,cameraKey,width:s.renderer.domElement.width,height:s.renderer.domElement.height};
  BMH.archRenderStatus('Đã lấy ảnh từ 3D đang xem. Chọn Làm nét ảnh nếu muốn tính thêm ánh sáng và phản xạ.');return true;
 }catch(error){console.warn('BMH quick image export',error);BMH.archRenderStatus('Chưa tải được ảnh. Thử lại khi mô hình đã hiện.');return false;}
};
BMH.sharpStudioFrame=async(longEdge)=>{
 const s=BMH.studio3d;if(!s?.renderer)return null;
 if(s.sharpExport)return s.sharpExport;
  const work=(async()=>{
  const designKey=BMH.cinematicSignature?.()||'',cameraKey=BMH.cinematicCameraKey?.()||'',revision=BMH.drawingRevision?.()||'',view=BMH.state.ui.sceneFocus||'all';
  const THREE=await BMH.ensureThree();if(BMH.studio3d!==s)return null;
  const renderer=s.renderer,size=renderer.getSize(new THREE.Vector2()),ratio=renderer.getPixelRatio(),target=renderer.getRenderTarget(),aoEnabled=s.ao?.enabled,fxaaSize=s.fxaa?.material.uniforms.resolution.value.clone(),shadowAutoUpdate=renderer.shadowMap?.autoUpdate;
  const multisamples=[s.composer?.renderTarget1,s.composer?.renderTarget2].filter(Boolean).map(target=>({target,samples:target.samples}));
  const edge=BMH.clamp(Number(longEdge)||Number(BMH.state.ui.sharpResolution)||1280,640,2560),aspect=size.x/size.y,pixels=edge>1920?5000000:edge>1280?3000000:1800000,limit=Math.min(edge,renderer.capabilities.maxTextureSize,Math.sqrt(pixels*Math.max(aspect,1/aspect)));
  const width=Math.max(1,Math.floor(aspect>=1?limit:limit*aspect)),height=Math.max(1,Math.floor(aspect>=1?limit/aspect:limit));let encoded;
  // Keep the exact camera and colour pipeline. Supersampling sharpens edges;
  // existing raster shadows/materials do not need a path-tracer compilation.
  try{
   // The scene and lights have not moved: reuse valid shadow maps for both
   // snapshot and restoration instead of drawing all shadow casters twice.
   if(renderer.shadowMap?.enabled&&!renderer.shadowMap.needsUpdate){let ready=true;s.scene.traverse(o=>{if(o.isLight&&o.castShadow&&(!o.shadow?.map||o.shadow.needsUpdate))ready=false;});if(ready)renderer.shadowMap.autoUpdate=false;}
   // The large raster already supplies extra edge pixels. Avoid multiplying
   // its memory by four MSAA samples on a phone; restore the interactive view.
   for(const {target}of multisamples)target.samples=0;
   renderer.setPixelRatio(1);renderer.setSize(width,height,false);renderer.setRenderTarget(null);
   if(s.composer){s.composer.setSize(width,height);if(s.ao)s.ao.enabled=false;s.fxaa?.material.uniforms.resolution.value.set(1/width,1/height);s.composer.render();}else renderer.render(s.scene,s.camera);
   encoded=new Promise(resolve=>renderer.domElement.toBlob(resolve,'image/png'));
  }finally{
   try{
    for(const {target,samples}of multisamples)target.samples=samples;
    renderer.setPixelRatio(ratio);renderer.setSize(size.x,size.y,false);renderer.setRenderTarget(target);
    if(s.composer){s.composer.setSize(size.x,size.y);if(s.ao)s.ao.enabled=aoEnabled;if(fxaaSize)s.fxaa.material.uniforms.resolution.value.copy(fxaaSize);}
    if(BMH.studio3d===s){if(s.archRender?.samples>0)s.archRender.denoise.render(renderer);else s.renderFrame();}
   }finally{if(renderer.shadowMap)renderer.shadowMap.autoUpdate=shadowAutoUpdate;}
  }
  const blob=await encoded;return blob&&BMH.studio3d===s&&designKey===(BMH.cinematicSignature?.()||'')&&cameraKey===(BMH.cinematicCameraKey?.()||'')?{blob,width,height,designRevision:revision,view,cameraKey}:null;
 })();s.sharpExport=work;try{return await work;}finally{if(s.sharpExport===work)s.sharpExport=null;}
};
BMH.captureSharpStudioPreview=async()=>{
 const started=performance.now();BMH.archRenderStatus('Đang xuất ảnh nét từ góc nhìn hiện tại…');
 const buttons=[...document.querySelectorAll('[data-sharp-download]')];buttons.forEach(b=>b.disabled=true);
 try{const frame=await BMH.sharpStudioFrame();if(!frame){BMH.archRenderStatus('Mở một góc 3D rồi xuất ảnh nét.');return false;}BMH.download('BMH-anh-net-nhanh-'+(frame.designRevision?frame.designRevision+'-':'')+frame.width+'x'+frame.height+'.png',frame.blob,'image/png');BMH.lastSharpExport={width:frame.width,height:frame.height,designRevision:frame.designRevision,view:frame.view,cameraKey:frame.cameraKey,elapsedMs:Math.round(performance.now()-started)};BMH.archRenderStatus('Đã xuất ảnh nét '+frame.width+' × '+frame.height+' px · '+(BMH.lastSharpExport.elapsedMs/1000).toFixed(1)+' giây.');return true;}
 catch(error){console.warn('BMH sharp snapshot',error);BMH.archRenderStatus('Chưa xuất được ảnh nét. Bạn vẫn có thể tải ảnh đang xem.');return false;}finally{buttons.forEach(b=>b.disabled=false);}
};
BMH.captureArchitecturalRender=async()=>{
 const s=BMH.studio3d,r=s?.archRender;if(!r||r.samples<1||r.signature!==BMH.cinematicSignature()){BMH.archRenderStatus('Tạo ảnh từ góc nhìn hiện tại trước khi tải.');return false;}
 const THREE=await BMH.ensureThree();if(BMH.studio3d!==s||s.archRender!==r)return false;const size=s.renderer.getSize(new THREE.Vector2()),ratio=s.renderer.getPixelRatio(),previous=s.renderer.getRenderTarget();let image;
 // Export through the same display pipeline, including exposure, ACES and sRGB.
 // toBlob snapshots the canvas before the editor's drawing buffer is restored.
 try{s.renderer.setPixelRatio(1);s.renderer.setSize(r.tracer.target.width,r.tracer.target.height,false);s.renderer.setRenderTarget(null);r.denoise.material.map=r.tracer.target.texture;r.denoise.render(s.renderer);image=new Promise(resolve=>s.renderer.domElement.toBlob(resolve,'image/png'));}
 catch(e){console.warn('BMH image export',e);BMH.archRenderStatus('Chưa tải được ảnh. Hãy thử lại.');return false;}
 finally{s.renderer.setPixelRatio(ratio);s.renderer.setSize(size.x,size.y,false);s.renderer.setRenderTarget(previous);if(BMH.studio3d===s&&s.archRender===r)r.denoise.render(s.renderer);}
 const blob=await image;if(!blob||BMH.studio3d!==s||s.archRender!==r)return false;
 const name='BMH-'+(BMH.state.ui.sceneFocus||'all').replace(/[^a-z0-9_-]/gi,'-')+'-'+BMH.drawingRevision()+'.png';BMH.download(name,blob,'image/png');return true;
};
// Editing or reopening a project always starts with its instant interactive view.
const archMount=BMH.mountStudio3D;BMH.mountStudio3D=async()=>{BMH.state.ui.renderMode='interactive';await archMount();};
const archDispose=BMH.disposeStudio3D;BMH.disposeStudio3D=()=>{BMH.disposeArchitecturalRender();archDispose();};
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-architectural-mode],[data-architectural-download],[data-preview-download],[data-sharp-download],[data-architectural-continue]');if(!b)return;if(b.hasAttribute('data-sharp-download'))void BMH.captureSharpStudioPreview();else if(b.hasAttribute('data-preview-download'))void BMH.captureStudioPreview();else if(b.hasAttribute('data-architectural-continue'))BMH.resumeArchitecturalRender();else if(b.hasAttribute('data-architectural-download'))void BMH.captureArchitecturalRender();else if(b.dataset.architecturalMode==='quality')void BMH.startArchitecturalRender();else{BMH.stopArchitecturalRender();BMH.archRenderStatus('Xoay, đổi vật liệu và tải ảnh ngay từ góc đang xem.');}});
document.addEventListener('change',e=>{if(!e.target.matches?.('[data-render-quality]'))return;BMH.state.ui.renderQuality=Object.hasOwn(BMH.ARCH_RENDER_PRESETS,e.target.value)?e.target.value:'draft';BMH.save();if(BMH.state.ui.renderMode==='quality')void BMH.startArchitecturalRender();});

BMH.architecturalRenderControlsHtml=()=>'<div class="architectural-render-controls"><div class="architectural-render-actions"><button class="preview-download-primary" data-preview-download>Tải ảnh ngay ↓</button><button data-sharp-download>Xuất ảnh nét nhanh ↓</button><label class="sharp-image-size">Ảnh nét<select data-sharp-resolution aria-label="Độ phân giải ảnh nét">'+[[1280,'Nhanh · 1280 px'],[1920,'Chi tiết · 1920 px'],[2560,'Ảnh lớn · 2560 px']].map(([id,name])=>'<option value="'+id+'" '+((Number(BMH.state.ui.sharpResolution)||1280)===id?'selected':'')+'>'+name+'</option>').join('')+'</select></label><button data-architectural-mode="interactive" aria-pressed="'+(BMH.state.ui.renderMode!=='quality')+'">Xoay / chỉnh</button><details class="render-detail-options"><summary>Ánh sáng chuyên sâu</summary><div><select data-render-quality aria-label="Chất lượng ảnh">'+[['draft','Ảnh nét nhanh · không chờ ánh sáng'],['fine','Ánh sáng chi tiết · có thể chờ'],['print','Ảnh lớn · chờ lâu hơn']].map(([id,name])=>'<option value="'+id+'" '+((BMH.state.ui.renderQuality||'draft')===id?'selected':'')+'>'+name+'</option>').join('')+'</select><button data-architectural-mode="quality" aria-pressed="'+(BMH.state.ui.renderMode==='quality')+'">Tạo ảnh đã chọn</button><button data-architectural-continue>Làm nét tiếp</button><button data-architectural-download>Tải ảnh đã làm nét</button></div></details></div><p id="architecturalRenderStatus" role="status">Đổi vật liệu để xem ngay. Xuất ảnh nét nhanh; chọn ánh sáng chuyên sâu khi cần.</p></div>';

document.addEventListener('change',e=>{if(!e.target.matches?.('[data-sharp-resolution]'))return;const value=Number(e.target.value);if([1280,1920,2560].includes(value)){BMH.state.ui.sharpResolution=value;BMH.save();}});
