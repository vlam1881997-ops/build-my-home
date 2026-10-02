/* Progressive architectural rendering of the customer's measured scene. */
BMH.ARCH_RENDER_REVISION='physical-light-1';
BMH.ARCH_RENDER_PRESETS={draft:{width:640,samples:32,bounces:5},fine:{width:960,samples:128,bounces:8},print:{width:1920,samples:512,bounces:10}};
BMH.archRenderModules=null;
BMH.archRenderStatus=text=>{const node=BMH.$('#architecturalRenderStatus');if(node&&node.textContent!==text)node.textContent=text;};
// Bake presentation clipping in world space. The plan and original wall meshes remain untouched.
BMH.renderMeshGeometry=(THREE,mesh)=>{
 const source=mesh.geometry,material=Array.isArray(mesh.material)?mesh.material[0]:mesh.material,planes=material?.clippingPlanes||[];let local=source.clone();
 if(source.type==='BoxGeometry'&&THREE.RoundedBoxGeometry&&!(source instanceof THREE.RoundedBoxGeometry)){const p=source.parameters;local.dispose();local=new THREE.RoundedBoxGeometry(p.width,p.height,p.depth,2,Math.min(.004,Math.min(p.width,p.height,p.depth)*.12));BMH.sceneSurfaceUvs?.(local,material,mesh.position);}
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
BMH.architecturalRenderScene=(THREE,source)=>{
 const scene=new THREE.Scene(),materials=new Map(),ownedMaterials=new Set();source.updateMatrixWorld(true);
 source.traverse(o=>{
  if(!o.visible)return;for(let parent=o.parent;parent;parent=parent.parent)if(!parent.visible)return;
  if(o.isMesh){
   if(o.userData.kind==='contact-shadow')return;
   const geometry=BMH.renderMeshGeometry(THREE,o);if(!geometry.attributes.position.count){geometry.dispose();return;}
   const convert=m=>{if(materials.has(m))return materials.get(m);let copy=m.clone();copy.clippingPlanes=[];
    if(m.isMeshPhysicalMaterial&&m.transparent&&m.opacity<.85){const glass=new THREE.MeshPhysicalMaterial({color:m.color.clone().lerp(new THREE.Color('#ffffff'),.65),roughness:.015,transmission:.98,thickness:0,ior:1.45,metalness:0,side:THREE.DoubleSide});copy.dispose();copy=glass;}
    // The physical renderer supports normal maps; height maps stay on the fast viewer.
    copy.envMap=null;materials.set(m,copy);ownedMaterials.add(copy);return copy;};
   const mesh=new THREE.Mesh(geometry,Array.isArray(o.material)?o.material.map(convert):convert(o.material));mesh.name=o.name;mesh.userData={...o.userData};scene.add(mesh);
  }else if(o.isLight&&!o.isHemisphereLight&&o.intensity>0){const light=o.clone();light.castShadow=false;light.position.copy(o.getWorldPosition(new THREE.Vector3()));if(light.isDirectionalLight){light.radius=.035;light.target.position.copy(o.target.getWorldPosition(new THREE.Vector3()));scene.add(light.target);}scene.add(light);}
 });
 const ui=BMH.state.ui,room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===ui.sceneFocus),site=BMH.state.project.site;
 // Eye-height photographs include the measured ceiling; open inspection views keep covers off.
 if(room&&ui.roomCamera==='inside'&&room.type!=='stairs'){
  const levels=BMH.projectLevels(),material=materials.values().next().value?.clone()||new THREE.MeshStandardMaterial({color:'#eee8df',roughness:.92});material.color.set('#eee8df');material.map=null;material.normalMap=null;ownedMaterials.add(material);
  const ceilingY=levels.floorHeight-(levels.ceilingDrop||0);
  for(const p of BMH.slabPanels(room,BMH.stairFloorHoles(room.floor+1))){const mesh=new THREE.Mesh(new THREE.BoxGeometry(p.w,levels.slab,p.d),material);mesh.position.set(p.x+p.w/2-site.width/2,ceilingY+levels.slab/2,p.y+p.d/2-site.depth/2);mesh.userData={kind:'ceiling-slab',roomId:room.id,floor:room.floor};scene.add(mesh);}
  const light=new THREE.RectAreaLight('#fff5e8',BMH.state.ui.sceneTheme==='night'?25:18,Math.min(.8,room.w*.25),Math.min(.8,room.h*.25));light.position.set(room.x+room.w/2-site.width/2,ceilingY-.025,room.y+room.h/2-site.depth/2);light.rotation.x=-Math.PI/2;light.userData.kind='render-lighting';scene.add(light);
 }
 scene.background=source.background?.clone?.()||new THREE.Color('#ece9e0');scene.backgroundRotation=new THREE.Euler();scene.environmentRotation=new THREE.Euler();scene.backgroundIntensity=1;scene.environmentIntensity=1;scene.userData.ownedMaterials=ownedMaterials;return scene;
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
 BMH.disposeArchitecturalRender(s);const epoch=s.renderEpoch,signature=BMH.cinematicSignature();BMH.archRenderStatus('Đang chuẩn bị ánh sáng và vật liệu…');
 try{
  if(!s.renderer.capabilities?.isWebGL2||!s.renderer.extensions.has('EXT_color_buffer_float'))throw Error('Thiết bị này chưa hỗ trợ render chất lượng cao. Bạn vẫn xem và chỉnh 3D được.');
  const modules=await (BMH.archRenderModules||(BMH.archRenderModules=import('./vendor/three/pathtracer.js').catch(e=>{BMH.archRenderModules=null;throw e;}))),THREE=await BMH.ensureThree();
  if(BMH.studio3d!==s||s.renderEpoch!==epoch||signature!==BMH.cinematicSignature())return false;
  const preset=BMH.ARCH_RENDER_PRESETS[BMH.state.ui.renderQuality]||BMH.ARCH_RENDER_PRESETS.fine,scene=BMH.architecturalRenderScene(THREE,s.scene),environment=new modules.GradientEquirectTexture(128);
  environment.topColor.set(BMH.state.ui.sceneTheme==='night'?'#60718e':'#e6eff8');environment.bottomColor.set(BMH.state.ui.sceneTheme==='night'?'#1c242c':'#c4c8c2');environment.exponent=1;environment.update();scene.environment=environment;scene.environmentIntensity=BMH.state.ui.sceneTheme==='night'?.35:1.7;
  s.archRender={scene,environment,preset,signature,raf:0,cancelled:false,samples:0,complete:false};
  const tracer=new modules.WebGLPathTracer(s.renderer);s.archRender.tracer=tracer;const denoise=new modules.FullScreenQuad(new modules.DenoiseMaterial({sigma:1.6,kSigma:1,threshold:.12}));s.archRender.denoise=denoise;
  tracer.bounces=preset.bounces;tracer.transmissiveBounces=6;tracer.filterGlossyFactor=.35;tracer.textureSize.set(256,256);tracer.tiles.set(3,3);tracer.minSamples=1;tracer.renderDelay=0;tracer.fadeDuration=0;tracer.rasterizeScene=false;tracer.renderToCanvas=false;
  const size=s.renderer.getDrawingBufferSize(new THREE.Vector2()),width=Math.min(preset.width,s.renderer.capabilities.maxTextureSize,Math.sqrt(6000000*size.x/size.y));tracer.setScene(scene,s.camera);tracer.synchronizeRenderSize=false;tracer._pathTracer.alpha=true;tracer._pathTracer.setSize(Math.floor(width),Math.floor(width*size.y/size.x));tracer._pathTracer.reset();BMH.state.ui.renderMode='quality';BMH.save();
  const guide=new THREE.WebGLRenderTarget(tracer.target.width,tracer.target.height,{type:THREE.HalfFloatType,depthBuffer:true,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter}),guideMaterial=new modules.ArchitecturalGuideMaterial(),previousTarget=s.renderer.getRenderTarget(),previousClear=s.renderer.getClearColor(new THREE.Color()),previousAlpha=s.renderer.getClearAlpha(),background=scene.background;
  s.archRender.guide=guide;
  try{scene.overrideMaterial=guideMaterial;scene.background=null;s.renderer.setClearColor(0,0);s.renderer.setRenderTarget(guide);s.renderer.render(scene,s.camera);}finally{scene.overrideMaterial=null;scene.background=background;s.renderer.setRenderTarget(previousTarget);s.renderer.setClearColor(previousClear,previousAlpha);guideMaterial.dispose();}
  denoise.material.uniforms.guide.value=guide.texture;denoise.material.uniforms.resolution.value.set(guide.width,guide.height);denoise.material.uniforms.projectionScale.value.set(s.camera.projectionMatrix.elements[0],s.camera.projectionMatrix.elements[5]);
  document.querySelectorAll('[data-architectural-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.architecturalMode==='quality')));
  const render=s.archRender,draw=()=>{
   if(BMH.studio3d!==s||s.archRender!==render||render.cancelled)return;
   if(signature!==BMH.cinematicSignature()){BMH.stopArchitecturalRender();BMH.archRenderStatus('Thiết kế đã đổi. Chọn Render chất lượng cao để tạo ảnh mới.');return;}
   if(document.hidden){render.raf=requestAnimationFrame(draw);return;}
   try{tracer._pathTracer.update();const samples=Math.floor(tracer.samples);if(samples>render.samples){render.samples=samples;denoise.material.map=tracer.target.texture;denoise.material.uniforms.samples.value=samples;denoise.render(s.renderer);}BMH.archRenderStatus(tracer.isCompiling?'Đang chuẩn bị bộ render…':'Ảnh đang nét dần · '+render.samples+'/'+preset.samples+' lượt');
    if(tracer.samples<preset.samples)render.raf=requestAnimationFrame(draw);else{render.complete=true;BMH.archRenderStatus('Ảnh đã hoàn tất · '+Math.round(tracer.target.width)+' × '+Math.round(tracer.target.height)+' px · Có thể tải ảnh.');}
   }catch(e){BMH.stopArchitecturalRender();BMH.archRenderStatus('Không tạo được ảnh trên thiết bị này. Chế độ 3D nhanh vẫn hoạt động.');console.warn('BMH architectural renderer',e);}
  };render.raf=requestAnimationFrame(draw);return true;
 }catch(e){console.warn('BMH render setup',e);if(BMH.studio3d===s&&s.renderEpoch===epoch){BMH.stopArchitecturalRender();BMH.archRenderStatus(e.message?.includes('Thiết bị')?e.message:'Bộ render chưa tải được. Thử lại hoặc tiếp tục xem 3D nhanh.');}return false;}
};
BMH.stopArchitecturalRender=()=>{const s=BMH.studio3d;BMH.disposeArchitecturalRender(s);BMH.state.ui.renderMode='interactive';BMH.save();document.querySelectorAll('[data-architectural-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.architecturalMode==='interactive')));s?.renderFrame();};
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
const archMount=BMH.mountStudio3D;BMH.mountStudio3D=async()=>{await archMount();if(BMH.state.ui.renderMode==='quality')void BMH.startArchitecturalRender();};
const archDispose=BMH.disposeStudio3D;BMH.disposeStudio3D=()=>{BMH.disposeArchitecturalRender();archDispose();};
document.addEventListener('click',e=>{const b=e.target.closest?.('[data-architectural-mode],[data-architectural-download]');if(!b)return;if(b.hasAttribute('data-architectural-download'))void BMH.captureArchitecturalRender();else if(b.dataset.architecturalMode==='quality')void BMH.startArchitecturalRender();else{BMH.stopArchitecturalRender();BMH.archRenderStatus('Xoay, phóng to và chỉnh nhà. Khi chọn được góc, tạo ảnh chất lượng cao.');}});
document.addEventListener('change',e=>{if(!e.target.matches?.('[data-render-quality]'))return;BMH.state.ui.renderQuality=Object.hasOwn(BMH.ARCH_RENDER_PRESETS,e.target.value)?e.target.value:'fine';BMH.save();if(BMH.state.ui.renderMode==='quality')void BMH.startArchitecturalRender();});

BMH.architecturalRenderControlsHtml=()=>'<div class="architectural-render-controls"><div class="architectural-render-actions"><button data-architectural-mode="interactive" aria-pressed="'+(BMH.state.ui.renderMode!=='quality')+'">Xoay / chỉnh nhanh</button><button data-architectural-mode="quality" aria-pressed="'+(BMH.state.ui.renderMode==='quality')+'">Render chất lượng cao</button><select data-render-quality aria-label="Chất lượng ảnh">'+[['draft','Xem thử'],['fine','Ảnh chi tiết'],['print','Ảnh kỹ hơn · chờ lâu hơn']].map(([id,name])=>'<option value="'+id+'" '+(BMH.state.ui.renderQuality===id?'selected':'')+'>'+name+'</option>').join('')+'</select><button data-architectural-download>Tải ảnh PNG</button></div><p id="architecturalRenderStatus" role="status">Chọn góc nhìn rồi tạo ảnh. Ánh sáng, bóng và phản xạ được tính từ chính thiết kế; thời gian tùy thiết bị.</p></div>';
