/* BMH measured model presentation. The geometry and product selections remain
 * owned by the drawing/finish engines. Only the view, overlays and lighting change.
 * Room light falloff is adapted from Mastershort/NeonPlan 3D lighting.ts (MIT),
 * fd0219dc775863754ae00bc561dbdbb2e72a14d2. Full notice: assets/licenses/neonplan3d-MIT.txt. */
(()=>{
 const B=BMH,esc=B.esc,materialPatches=new WeakMap(),thumbs=new Map();
 const template=html=>{const t=document.createElement('template');t.innerHTML=html;return t;};
 const normalize=B.normalizeState;
 B.normalizeState=()=>{normalize();const u=B.state.ui;u.exteriorCamera=['front','overview'].includes(u.exteriorCamera)?u.exteriorCamera:'front';u.modelLook=u.modelLook==='materials'?'materials':'neon';u.modelWalls=['auto','cut','full'].includes(u.modelWalls)?u.modelWalls:'auto';u.modelRoomId=String(u.modelRoomId||'');u.modelLightLevel=B.clamp(Number.isFinite(Number(u.modelLightLevel))?Number(u.modelLightLevel):75,0,100);};
 B.modelLook=()=>B.state.ui.modelLook==='materials'?'materials':'neon';
 B.modelExplodeGap=height=>Math.max(1.8,Math.min(3,Number(height)*.72));
 B.modelVisibleRooms=()=>{const u=B.state.ui,rooms=B.state.project.plan.rooms,f=u.sceneFocus||'all';return f.startsWith('room:')?rooms.filter(r=>'room:'+r.id===f):f.startsWith('floor:')?rooms.filter(r=>r.floor===Number(f.slice(6))):rooms;};
 B.modelSelectedRoom=()=>{const rooms=B.modelVisibleRooms();return rooms.find(r=>r.id===B.state.ui.modelRoomId)||rooms.find(r=>'room:'+r.id===B.state.ui.sceneFocus)||null;};

 // NeonPlan's bounded, room-local light falloff. This is presentation lighting,
 // never an electrical calculation, lux measurement or fabricated live device.
 B.modelLightContribution=(s,p,n)=>{
  const dx=p[0]-s.x,dy=p[1]-s.y,dz=p[2]-s.z,d2=dx*dx+dy*dy+dz*dz,d=Math.sqrt(d2)||1e-6;
  const reach=(s.kind==='spot'?2:s.kind==='wall'?1.4:2.4)*(.55+.45*s.level),q=1/(1+d2/(reach*reach));
  const facing=Math.max(0,-(dx*n[0]+dy*n[1]+dz*n[2])/d),down=Math.max(0,-dy/d),up=Math.max(0,dy/d);
  const characteristic=s.kind==='ceiling'?.3+.7*down:s.kind==='spot'?.06+.94*down**5:s.kind==='pendant'?.25+.85*down**2+.2*up:s.kind==='up'?.25+.75*up:s.kind==='wall'?.45+.35*Math.abs(dy/d):1;
  return s.level*q*Math.sqrt(q)*(.2+.8*facing)*characteristic;
 };
 B.modelRoomLights=(r,base)=>{
  const site=B.state.project.site,fh=B.projectLevels().floorHeight,items=B.roomFurnitureLayout?.(r)||[],lamps=items.filter(x=>/lamp|light|pendant/i.test(x.model||''));
  const points=lamps.length?lamps.slice(0,3).map(x=>({x:x.x+x.w/2-site.width/2,z:x.y+x.d/2-site.depth/2,y:base+B.projectLevels().slab+(Number(x.base)||0)+(Number(x.h)||1.62)*.89})):[{x:r.x+r.w*.53-site.width/2,z:r.y+r.h*.53-site.depth/2,y:base+Math.min(fh-.25,2.6)}];
  return points.map((p,i)=>({...p,level:/corridor|stairs|elevator/.test(r.type)?.38:.82,kind:'pendant',color:i?[.42,.68,1]:r.type==='bath'?[.62,.80,1]:[1,.66,.35]}));
 };
 B.prepareModelMaterial=(m,old,mesh,scene)=>{
  if(!m?.isMeshStandardMaterial&&!m?.isMeshPhysicalMaterial)return;
  const view=old?.userData.bmhWallView;
  if(view)m.userData.bmhWallView={...view};
  let patch=materialPatches.get(m);
  if(!patch){
   const before=m.onBeforeCompile.bind(m),key=m.customProgramCacheKey.bind(m);
   const slot=m.userData.finishSlot;
   patch={look:scene.userData.modelPresentation.look,alpha:{value:1},dim:{value:slot==='wall'?.045:slot==='floor'?.12:.24},emitter:{value:m.userData.bmhPresentationEmitter?1:0}};materialPatches.set(m,patch);
   m.onBeforeCompile=(shader,renderer)=>{before(shader,renderer);shader.uniforms.bmhModelLook=patch.look;shader.uniforms.bmhWallAlpha=patch.alpha;shader.uniforms.bmhSurfaceDim=patch.dim;shader.uniforms.bmhModelEmitter=patch.emitter;shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float bmhModelLook;\nuniform float bmhWallAlpha;\nuniform float bmhSurfaceDim;\nuniform float bmhModelEmitter;').replace('#include <opaque_fragment>','outgoingLight = mix(outgoingLight, vec3(0.004, 0.010, 0.024) + outgoingLight * bmhSurfaceDim, bmhModelLook);\noutgoingLight += vec3(0.85, 0.31, 0.065) * bmhModelLook * bmhModelEmitter;\ndiffuseColor.a *= bmhWallAlpha;\n#include <opaque_fragment>');};
   m.customProgramCacheKey=()=>key()+'-bmh-model-neon-v1';m.needsUpdate=true;
  }
  if(m.userData.bmhWallView){m.transparent=true;m.depthWrite=false;m.side=mesh?.userData.wallSurface==='window'?m.side:2;}
 };
 B.restoreModelMaterial=(copy,source)=>{
  const view=source.userData.bmhWallView;if(view){copy.transparent=view.transparent;copy.depthWrite=view.depthWrite;copy.side=view.side;}
  delete copy.userData.bmhWallView;
  delete copy.userData.bmhPresentationEmitter;
 };
 const ancestor=(o,key)=>{for(let p=o;p;p=p.parent)if(p.userData[key])return p.userData[key];return null;};
 B.mergeModelFringes=(THREE,scene)=>{
  const groups=new Map();scene.updateMatrixWorld(true);
  scene.traverse(o=>{if(o.userData.kind!=='interior-rug'||o.geometry?.type!=='BoxGeometry'||o.geometry.parameters.height!==.003)return;const key=o.userData.roomId+'|'+o.material.uuid;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(o);});
  for(const meshes of groups.values()){
   if(meshes.length<8)continue;const values={position:[],normal:[],uv:[]},first=meshes[0];
   for(const mesh of meshes){const world=mesh.geometry.clone().applyMatrix4(mesh.matrixWorld),geometry=world.index?world.toNonIndexed():world;for(const key of Object.keys(values))values[key].push(...geometry.attributes[key].array);if(geometry!==world)geometry.dispose();world.dispose();mesh.parent.remove(mesh);mesh.geometry.dispose();}
   const geometry=new THREE.BufferGeometry();for(const key of Object.keys(values))geometry.setAttribute(key,new THREE.Float32BufferAttribute(values[key],key==='uv'?2:3));const merged=new THREE.Mesh(geometry,first.material);merged.userData={...first.userData,kind:'interior-rug-fringes',mergedCount:meshes.length};scene.add(merged);
  }
 };
 const addLightSurface=c=>{
  const {THREE,scene,W,D,fh,explode,focus,roomFocus,floorFocus,visibleFloors}=c,pos=[],col=[];
  for(const f of visibleFloors)for(const r of (roomFocus?[roomFocus]:B.floorRooms(f))){
   const base=roomFocus||floorFocus!==null?0:f*(fh+explode),slab=B.projectLevels().slab,lamps=B.modelRoomLights(r,base),holes=B.stairFloorHoles?.(f)||[],panels=B.slabPanels?.(r,holes)||[{x:r.x,y:r.y,w:r.w,d:r.h}];
   for(const panel of panels){const nx=Math.max(1,Math.ceil(panel.w/.4)),nz=Math.max(1,Math.ceil(panel.d/.4));
    const vertex=(x,z)=>{const p=[x-W/2,base+slab+.009,z-D/2],light=[0,0,0];for(const lamp of lamps){const k=B.modelLightContribution(lamp,p,[0,1,0]);for(let ch=0;ch<3;ch++)light[ch]+=Math.pow(lamp.color[ch],1.5)*k;}pos.push(...p);col.push(...light.map(v=>1-Math.exp(-v*.7*1.6)));};
    for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){const a=panel.x+panel.w*i/nx,b=panel.y+panel.d*j/nz,x=panel.x+panel.w*(i+1)/nx,z=panel.y+panel.d*(j+1)/nz;for(const p of [[a,b],[a,z],[x,z],[a,b],[x,z],[x,b]])vertex(...p);}
   }
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
  const material=new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.75,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide});
  const mesh=new THREE.Mesh(geometry,material);mesh.userData={kind:'model-room-light',presentationOnly:true};scene.add(mesh);scene.userData.modelPresentation.lightSurface=mesh;
  const lampLayer=new THREE.Group();lampLayer.userData={kind:'model-lamp-glows',presentationOnly:true};
  const sources=[];for(const f of visibleFloors)for(const r of roomFocus?[roomFocus]:B.floorRooms(f)){if(!B.roomFurnitureLayout(r).some(i=>i.model==='floorLamp'))continue;const base=roomFocus||floorFocus!==null?0:f*(fh+explode);sources.push(...B.modelRoomLights(r,base));}
  scene.add(lampLayer);scene.userData.modelPresentation.lampGlows=lampLayer;if(!sources.length)return;
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d'),gradient=ctx.createRadialGradient(32,32,1,32,32,32);gradient.addColorStop(0,'rgba(255,232,188,.80)');gradient.addColorStop(.16,'rgba(255,193,102,.25)');gradient.addColorStop(1,'rgba(255,176,73,0)');ctx.fillStyle=gradient;ctx.fillRect(0,0,64,64);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  const glowMaterial=new THREE.MeshBasicMaterial({map:texture,transparent:true,opacity:.6,depthWrite:false,toneMapped:false,blending:THREE.AdditiveBlending});
  for(const source of sources){const glow=new THREE.Mesh(new THREE.PlaneGeometry(.95,.95),glowMaterial);glow.position.set(source.x,source.y,source.z);lampLayer.add(glow);}
 };
 const buildEdges=c=>{
  const {THREE,scene}=c,groups={architecture:[],furniture:[]},seen={architecture:new Set(),furniture:new Set()},meshes=[];scene.updateMatrixWorld(true);let count=0;
  scene.traverse(o=>{if(o.isMesh&&!o.userData.presentationOnly&&o.visible&&o.geometry?.attributes.position&&o.userData.kind!=='contact-shadow')meshes.push(o);});
  for(const mesh of meshes){
   const architecture=['wall','floor-slab','door-frame','window-frame','ceiling-slab','roof','roof-gable','facade-detail'].includes(mesh.userData.kind)||ancestor(mesh,'kind')==='door-leaf';
   if(!architecture&&(!ancestor(mesh,'model')&&!ancestor(mesh,'kind')||mesh.geometry.attributes.position.count>4000))continue;
   if(['foliage','upholstery-seam'].includes(mesh.userData.kind))continue;
   const world=mesh.material?.clippingPlanes?.length?B.renderMeshGeometry(THREE,mesh):mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);if(!world.attributes.position.count){world.dispose();continue;}
   world.computeBoundingBox();const mid=world.boundingBox.getCenter(new THREE.Vector3()),edges=new THREE.EdgesGeometry(world,35),p=edges.attributes.position;world.dispose();
   if(count+p.count>90000){edges.dispose();continue;}const kind=architecture?'architecture':'furniture',target=groups[kind];
   for(let i=0;i<p.count;i+=2){const a=[p.getX(i),p.getY(i),p.getZ(i)],b=[p.getX(i+1),p.getY(i+1),p.getZ(i+1)],ka=a.map(v=>Math.round(v*1000)).join(','),kb=b.map(v=>Math.round(v*1000)).join(','),key=ka<kb?ka+'|'+kb:kb+'|'+ka;if(seen[kind].has(key))continue;seen[kind].add(key);count+=2;for(const point of [a,b])target.push(...point.map((v,k)=>v+Math.sign(v-mid.getComponent(k))*.002));}edges.dispose();
  }
  const layer=new THREE.Group();layer.userData={kind:'model-outlines',presentationOnly:true};
  for(const [kind,values] of Object.entries(groups)){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(values,3));const material=new THREE.LineBasicMaterial({color:kind==='architecture'?0x58dcee:0x7f9bd3,transparent:true,opacity:kind==='architecture'?.58:.25,depthTest:true,depthWrite:false,toneMapped:false,blending:THREE.NormalBlending});const lines=new THREE.LineSegments(geometry,material);lines.renderOrder=2;layer.add(lines);}
  scene.add(layer);scene.userData.modelPresentation.edges=layer;scene.userData.modelPresentation.edgeVertices=count;
 };
 const cutCaps=c=>{
  const {THREE,scene}=c,group=new THREE.Group();group.userData={kind:'model-cut-caps',presentationOnly:true};
  scene.updateMatrixWorld(true);scene.traverse(o=>{if(o.userData.kind!=='wall'||o.userData.wallSurface==='window')return;const plane=o.material?.clippingPlanes?.[0];if(!plane||Math.abs(plane.normal.y+1)>.001)return;const bounds=new THREE.Box3().setFromObject(o),y=plane.constant;if(y<=bounds.min.y+.002||y>=bounds.max.y-.002)return;const material=new THREE.MeshStandardMaterial({color:'#408b9d',roughness:.8});B.prepareModelMaterial(material,null,null,scene);const cap=new THREE.Mesh(new THREE.BoxGeometry(bounds.max.x-bounds.min.x,.012,bounds.max.z-bounds.min.z),material);cap.position.set((bounds.max.x+bounds.min.x)/2,y-.005,(bounds.max.z+bounds.min.z)/2);group.add(cap);});scene.add(group);
 };
 B.configureModelPresentation=c=>{
  const {THREE,scene,ground,displayBase,renderer,roomFocus,floorFocus,focus,explode}=c,ui=B.state.ui,look={value:B.modelLook()==='neon'?1:0};
  const state=scene.userData.modelPresentation={look,context:c,walls:[],background:scene.background.clone(),fog:scene.fog,groundColor:ground.material.color.clone(),baseColor:displayBase.material.color.clone(),exposure:renderer.toneMappingExposure,lights:[]};
  B.mergeModelFringes(THREE,scene);
  const groundCompile=ground.material.onBeforeCompile.bind(ground.material);ground.material.onBeforeCompile=(shader,renderer)=>{groundCompile(shader,renderer);shader.uniforms.bmhGroundLook=look;shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nuniform float bmhGroundLook;').replace('#include <opaque_fragment>','outgoingLight = mix(outgoingLight, vec3(0.0024, 0.0047, 0.011), bmhGroundLook);\n#include <opaque_fragment>');};ground.material.customProgramCacheKey=()=> 'bmh-grid-ground-v1';
  const viewOpen=floorFocus!==null||roomFocus&&ui.roomCamera!=='inside'||ui.sceneExploded;
  const retired=new Set();
  scene.traverse(o=>{
   if(o.isLight)state.lights.push({light:o,intensity:o.intensity,color:o.color.clone()});
   if(o.userData.presentationOnly)return;
   if(ui.sceneExploded&&['ceiling-slab','suspended-ceiling','roof','roof-gable'].includes(o.userData.kind))o.visible=false;
   if(!o.isMesh)return;
   if(viewOpen&&(ui.modelWalls!=='cut'||ui.sceneExploded))for(const m of Array.isArray(o.material)?o.material:[o.material])if(m?.clippingPlanes?.length)m.clippingPlanes=[];
   let parent=o;while(parent&&parent.userData.kind!=='door-leaf')parent=parent.parent;
   const wall=viewOpen&&(o.userData.kind==='wall'||o.userData.kind==='door-frame'||o.userData.kind==='window-frame'||parent);
   let old=Array.isArray(o.material)?null:o.material;
   if(old&&ancestor(o,'model')==='floorLamp'&&old.userData.finishSlot==='linen'){const next=old.clone();next.userData.bmhPresentationEmitter=true;retired.add(old);o.material=old=next;}
   if(wall&&old){const m=old.clone();retired.add(old);m.userData.bmhWallView={transparent:old.transparent,depthWrite:old.depthWrite,side:old.side};if(ui.modelWalls!=='cut'||ui.sceneExploded)m.clippingPlanes=[];o.material=m;state.walls.push(o);}
   for(const m of Array.isArray(o.material)?o.material:[o.material])B.prepareModelMaterial(m,null,o,scene);
  });
  const used=new Set();scene.traverse(o=>{for(const m of Array.isArray(o.material)?o.material:[o.material])if(m)used.add(m);});for(const m of retired)if(!used.has(m)&&![...(scene.userData.finishMaterials?.values()||[])].some(entry=>Object.values(entry).includes(m)))m.dispose();
  const grid=new THREE.GridHelper(160,160,0x32526d,0x1a354d);grid.position.y=.002;grid.material.transparent=true;grid.material.opacity=.3;grid.material.depthWrite=false;grid.userData={kind:'model-site-grid',presentationOnly:true};scene.add(grid);state.grid=grid;
  addLightSurface(c);cutCaps(c);buildEdges(c);
  const selection=new THREE.Group();selection.userData={kind:'model-room-selection',presentationOnly:true};scene.add(selection);state.selection=selection;
  B.applyModelLook({THREE,scene,renderer,camera:c.camera});
 };
 B.applyModelLook=s=>{
  const st=s.scene?.userData.modelPresentation;if(!st)return;const neon=B.modelLook()==='neon',c=st.context;st.look.value=neon?1:0;
  s.scene.background=neon?new s.THREE.Color('#080f1e'):st.background.clone();s.scene.fog=neon?new s.THREE.Fog('#080f1e',35,105):st.fog;
  c.ground.material.color.copy(neon?new s.THREE.Color('#101c32'):st.groundColor);c.displayBase.material.color.copy(neon?new s.THREE.Color('#172438'):st.baseColor);
  s.renderer.toneMappingExposure=neon?1:st.exposure;
  for(const item of st.lights){item.light.color.copy(item.color);item.light.intensity=neon?item.intensity*.65:item.intensity;}
  st.grid.visible=st.edges.visible=st.lightSurface.visible=st.lampGlows.visible=neon;st.lightSurface.material.opacity=B.state.ui.modelLightLevel/100;
  const stage=document.querySelector('#studio3dStage');stage?.classList.toggle('model-neon',neon);document.querySelector('.design-studio')?.classList.toggle('model-neon-workspace',neon);
  B.updateModelPresentation(s);
 };
 B.updateModelPresentation=s=>{
  const st=s?.scene?.userData.modelPresentation;if(!st)return;const ui=B.state.ui,site=B.state.project.site,selected=B.modelSelectedRoom(),key=selected?.id||'';
  for(const glow of st.lampGlows.children){glow.quaternion.copy(s.camera.quaternion);glow.material.opacity=.6*ui.modelLightLevel/100;}
  for(const o of st.walls){const m=o.material,patch=materialPatches.get(m);if(!patch)continue;let alpha=1;
   if(ui.modelWalls==='auto'||ui.sceneExploded){const ids=o.userData.roomIds||[ancestor(o,'roomId')].filter(Boolean),rooms=ids.map(id=>B.state.project.plan.rooms.find(r=>r.id===id)).filter(Boolean),exterior=rooms.length===1,r=rooms[0];
    let front=true;if(r&&o.userData.wallAxis){const axis=o.userData.wallAxis,center=axis==='x'?r.x+r.w/2-site.width/2:r.y+r.h/2-site.depth/2,wall=o.userData.wallCoordinate-(axis==='x'?site.width:site.depth)/2,cam=s.camera.position[axis];front=(wall-center)*(cam-wall)>0;}
    alpha=exterior?(front?.16:.86):.44;
   }
   patch.alpha.value=alpha;
  }
  if(st.selectedKey!==key){st.selectedKey=key;for(const o of [...st.selection.children]){st.selection.remove(o);o.geometry.dispose();o.material.dispose();}
   if(selected){const {THREE}=s,r=selected,levels=B.projectLevels(),base=ui.sceneFocus==='all'?r.floor*(levels.floorHeight+st.context.explode):0;for(const p of B.slabPanels(r,B.stairFloorHoles(r.floor))){const mesh=new THREE.Mesh(new THREE.PlaneGeometry(p.w,p.d),new THREE.MeshBasicMaterial({color:0x31d2e8,transparent:true,opacity:.12,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));mesh.rotation.x=-Math.PI/2;mesh.position.set(p.x+p.w/2-site.width/2,base+levels.slab+.013,p.y+p.d/2-site.depth/2);st.selection.add(mesh);}}
  }
 };

 B.modelRoomInspectorHtml=()=>{
  const r=B.modelSelectedRoom(),rooms=B.modelVisibleRooms().filter(r=>r.type!=='corridor'),palette=B.finishPalette?.(r?.id)||{},items=r?B.roomFurnitureLayout(r):[],ui=B.state.ui;
  return '<section class="model-room-inspector" data-model-room-panel><span class="model-eyebrow">KHÔNG GIAN ĐANG XEM</span><label>Chọn phòng<select data-model-room-inspect><option value="">'+(r?'Bỏ chọn phòng':'Chạm một phòng trong 3D')+'</option>'+rooms.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===r?.id?'selected':'')+'>'+esc(x.name)+' · T'+(x.floor+1)+'</option>').join('')+'</select></label>'+(r?'<h2>'+esc(r.name)+'</h2><div class="model-room-dimensions"><b>'+(r.w*r.h).toFixed(1)+'<small>m²</small></b><span>'+r.w.toFixed(2)+' × '+r.h.toFixed(2)+' m<small>Tầng '+(r.floor+1)+' · '+items.length+' món nội thất</small></span></div><div class="model-finish-swatches">'+[['wall','Sơn'],['floor','Sàn'],['accent','Gỗ'],['fabric','Vải']].map(([k,t])=>'<span><i style="background:'+esc(palette[k]||'#d1c4b2')+'"></i>'+t+'</span>').join('')+'</div>'+(ui.sceneFocus==='room:'+r.id?'<button data-model-floor="'+r.floor+'" class="model-room-action">← Trở về tầng '+(r.floor+1)+'</button>':'<button data-design-room="'+esc(r.id)+'" class="model-room-action">Xem riêng phòng này ↗</button>'):'<h2>Khám phá ngôi nhà</h2><p>Chạm vào sàn hoặc tên phòng để xem số đo và vật liệu ở đây.</p>')+'<details class="model-light-settings"><summary>Ánh sáng trình bày</summary><label>Cường độ <output data-model-light-value>'+ui.modelLightLevel+'%</output><input type="range" min="0" max="100" value="'+ui.modelLightLevel+'" data-model-light-level aria-label="Cường độ ánh sáng trình bày"></label><p>Hiệu ứng giúp đọc không gian. Chọn “Vật liệu” để xem màu và bề mặt đã chọn.</p><a href="assets/licenses/neonplan3d-MIT.txt" target="_blank" rel="noopener">NeonPlan 3D · MIT</a></details></section>';
 };
 const scope=()=>{const u=B.state.ui;return u.sceneFocus==='all'?(u.sceneExploded?'stack':'house'):u.sceneFocus.startsWith('floor:')?u.sceneFocus:'room';};
 B.modelThumbnailKey=value=>B.drawingRevision()+'|'+B.state.project.style+'|'+B.cinematicSignature(value.startsWith('floor:')?value:'all')+'|'+value;
 const railHtml=()=>{const p=B.state.project,selected=scope();return '<nav class="model-floor-rail" aria-label="Tầng trong mô hình"><button data-model-scope-btn="house" class="'+(selected==='house'?'active':'')+'" aria-pressed="'+(selected==='house')+'"><span class="model-house-icon">'+B.guidedIcon('cube')+'</span><b>Toàn nhà</b></button>'+Array.from({length:p.site.floors},(_,f)=>{const value='floor:'+f,thumb=thumbs.get(B.modelThumbnailKey(value));return '<button data-model-scope-btn="'+value+'" class="'+(selected===value?'active':'')+'" aria-pressed="'+(selected===value)+'"><span data-model-thumb="'+value+'">'+(thumb?'<img src="'+thumb+'" alt="3D tầng '+(f+1)+'">':B.designPlanPreview(p.plan,f))+'</span><b>Tầng '+(f+1)+'</b></button>';}).join('')+'<button data-model-scope-btn="stack" class="'+(selected==='stack'?'active':'')+'" aria-pressed="'+(selected==='stack')+'"><span class="model-stack-icon">▱<br>▱</span><b>Tách tầng</b></button></nav>';};
 const screen=B.screen7;B.screen7=()=>{
  const t=template(screen()),root=t.content.querySelector('.design-studio'),stage=t.content.querySelector('#studio3dStage'),ui=B.state.ui;if(!root||!stage)return t.innerHTML;
  root.classList.add('model-presentation-workspace');if(B.modelLook()==='neon'){root.classList.add('model-neon-workspace');stage.classList.add('model-neon');}
  const measured=root.querySelector('.measured-contract');if(measured){const details=template(B.guidedDetails('model-dimensions','Thông số mái, tường & đối chiếu','')).content.firstElementChild;measured.replaceWith(details);details.querySelector('.guided-details-body').append(measured);root.append(details);}
  const controls=t.content.querySelector('.design-view-controls');controls.querySelector('.model-scope-select')?.remove();
  controls.querySelector('[data-design-floor]')?.remove();
  controls.insertAdjacentHTML('afterbegin','<label class="guided-select model-look-select">Hiển thị<select data-model-look><option value="neon" '+(B.modelLook()==='neon'?'selected':'')+'>Neon · nhìn rõ bố trí</option><option value="materials" '+(B.modelLook()==='materials'?'selected':'')+'>Vật liệu · màu & bề mặt</option></select></label>');
  const top=t.content.querySelector('.design-model-top>div:first-child');top.querySelector('b').textContent=ui.sceneFocus==='all'?(ui.sceneExploded?'Các tầng · góc xem tách lớp':'Ngôi nhà theo thiết kế'):'Tầng '+((B.modelVisibleRooms()[0]?.floor||0)+1)+' · '+(ui.sceneFocus.startsWith('room:')?B.modelVisibleRooms()[0]?.name:'bố trí & nội thất');
  const wrap=document.createElement('div');wrap.className='model-scene-wrap';stage.replaceWith(wrap);wrap.insertAdjacentHTML('afterbegin',railHtml());wrap.append(stage);
  stage.insertAdjacentHTML('beforeend','<div class="model-view-badge"><i></i><span data-model-look-name>'+(B.modelLook()==='neon'?'NEON / 3D':'VẬT LIỆU / 3D')+'</span><small>Cùng số đo với bản vẽ</small></div>');
  const caption=stage.querySelector('.design-model-caption');if(caption)caption.innerHTML='<span>KÉO ĐỂ XOAY · CHỤM ĐỂ ZOOM</span><b>'+(ui.sceneExploded?'Khoảng tách chỉ phục vụ cách xem':'Chạm sàn / tên phòng để xem chi tiết')+'</b>';
  const brief=t.content.querySelector('.design-brief');brief?.insertAdjacentHTML('afterbegin',B.modelRoomInspectorHtml());
  const preview=brief?.querySelector('.guided-collection-preview');if(preview){const d=document.createElement('details');d.className='model-reference-preview';d.innerHTML='<summary>Xem phòng mẫu của bộ nội thất</summary>';preview.replaceWith(d);d.append(preview);}
  return t.innerHTML;
 };B.SCREENS[5]=B.screen7;
 const signature=B.cinematicSignature;B.cinematicSignature=focus=>signature(focus)+'|look:'+B.modelLook()+'|light:'+B.state.ui.modelLightLevel+'|selection:'+B.state.ui.modelRoomId;
 // Look switches update uniforms in place; the structure key intentionally does not include look.
 const structure=B.studioStructureKey;B.studioStructureKey=()=>structure()+'|model-presentation:1';
 B.selectModelRoom=id=>{
  if(!B.modelVisibleRooms().some(r=>r.id===id))id='';B.state.ui.modelRoomId=id;B.save();
  const old=document.querySelector('[data-model-room-panel]');old?.replaceWith(template(B.modelRoomInspectorHtml()).content);B.studio3d?.renderFrame();
  document.querySelectorAll('.model-room-labels button').forEach(el=>el.classList.toggle('selected',el.dataset.modelRoomInspect===id));
 };
 const updateLabels=B.updateModelRoomLabels;B.updateModelRoomLabels=s=>{updateLabels(s);for(const item of s?.roomLabels||[])item.el.classList.toggle('selected',item.room.id===B.state.ui.modelRoomId);};
 B.cacheModelThumbnail=s=>{
  const value=scope();if(!['house','stack'].includes(value)&&!value.startsWith('floor:')||s.archRender||s.raf)return;
  try{const canvas=document.createElement('canvas');canvas.width=160;canvas.height=100;const ctx=canvas.getContext('2d'),source=s.renderer.domElement;ctx.fillStyle=B.modelLook()==='neon'?'#080f1e':'#efebe2';ctx.fillRect(0,0,160,100);const ratio=Math.min(160/source.width,100/source.height),w=source.width*ratio,h=source.height*ratio;ctx.drawImage(source,(160-w)/2,(100-h)/2,w,h);const src=canvas.toDataURL('image/png'),key=B.modelThumbnailKey(value);thumbs.set(key,src);while(thumbs.size>16)thumbs.delete(thumbs.keys().next().value);const target=document.querySelector('[data-model-thumb="'+value+'"]');if(target)target.innerHTML='<img src="'+src+'" alt="3D '+(value.startsWith('floor:')?'tầng '+(Number(value.slice(6))+1):'toàn nhà')+'">';}catch{}
 };
 const mount=B.mountStudio3D;B.mountStudio3D=async()=>{
  await mount();const s=B.studio3d,stage=document.querySelector('#studio3dStage');if(!s||!stage)return;
  for(const item of s.roomLabels||[]){delete item.el.dataset.designRoom;item.el.dataset.modelRoomInspect=item.room.id;item.el.textContent=item.room.name;}
  if(!s.modelPickBound){
   const canvas=s.renderer.domElement,picker=new s.THREE.Raycaster(),point=new s.THREE.Vector2();let down=null;
   // Use the established pointer controller; clicks are inspected after a drag threshold.
   s.modelDown=e=>{down={x:e.clientX,y:e.clientY,id:e.pointerId,multi:!e.isPrimary};};
   s.modelUp=e=>{if(!down||down.id!==e.pointerId||down.multi||Math.hypot(e.clientX-down.x,e.clientY-down.y)>5||B.studio3d!==s)return;down=null;const r=canvas.getBoundingClientRect();point.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);picker.setFromCamera(point,s.camera);const floors=[];s.scene.traverse(o=>{if(o.userData.kind==='floor-slab'&&o.visible)floors.push(o);});const hit=picker.intersectObjects(floors,false)[0];if(hit)B.selectModelRoom(hit.object.userData.roomId);};
   canvas.addEventListener('pointerdown',s.modelDown);canvas.addEventListener('pointerup',s.modelUp);s.modelPickBound=true;
  }
  B.applyModelLook(s);s.renderFrame();B.cacheModelThumbnail(s);
  Promise.allSettled(s.scene.userData.surfaceLoads||[]).then(()=>{if(B.studio3d===s&&!s.scene.userData.disposed){s.renderFrame();B.cacheModelThumbnail(s);}});
  if(s.scene.userData.furnitureLoads?.length)Promise.allSettled(s.scene.userData.furnitureLoads).then(()=>{if(B.studio3d!==s||s.scene.userData.disposed)return;const st=s.scene.userData.modelPresentation;s.scene.traverse(o=>{if(!o.isMesh||o.userData.presentationOnly)return;for(const m of Array.isArray(o.material)?o.material:[o.material])B.prepareModelMaterial(m,null,o,s.scene);});s.scene.remove(st.edges);for(const lines of st.edges.children){lines.geometry.dispose();lines.material.dispose();}buildEdges(st.context);st.edges.visible=B.modelLook()==='neon';s.renderer.shadowMap.needsUpdate=true;s.renderFrame();B.cacheModelThumbnail(s);});
 };
 const dispose=B.disposeStudio3D;B.disposeStudio3D=()=>{const s=B.studio3d;s?.renderer.domElement.removeEventListener('pointerdown',s.modelDown);s?.renderer.domElement.removeEventListener('pointerup',s.modelUp);return dispose();};
 const refresh=B.refreshStudioFinishes;B.refreshStudioFinishes=(role,id)=>{const ok=refresh(role,id);if(ok){const s=B.studio3d;B.applyModelLook(s);s.renderFrame();B.cacheModelThumbnail(s);}return ok;};
 const start=B.startArchitecturalRender;B.startArchitecturalRender=()=>B.modelLook()==='neon'?B.captureSharpStudioPreview():start();
 document.addEventListener('click',e=>{
  const el=e.target.closest?.('[data-model-scope-btn],[data-model-floor],[data-model-room-inspect]');if(!el)return;
  if(el.hasAttribute('data-model-room-inspect')){if(el.tagName==='BUTTON')B.selectModelRoom(el.dataset.modelRoomInspect);return;}
  const value=el.dataset.modelScopeBtn||'floor:'+el.dataset.modelFloor,u=B.state.ui;
  B.rememberFinishCamera();u.sceneFocus=['house','stack'].includes(value)?'all':value;u.sceneExploded=value==='stack';u.designView=u.sceneFocus==='all'?'exterior':'layout';u.modelRoomId='';B.save();B.render({preserveScroll:true});
 });
 document.addEventListener('change',e=>{
  const el=e.target,u=B.state.ui;
  if(el.matches?.('select[data-model-room-inspect]')){B.selectModelRoom(el.value);return;}
  if(el.matches?.('[data-model-look]')){u.modelLook=el.value==='materials'?'materials':'neon';B.customerFrameCache=null;B.stopArchitecturalRender();B.save();const s=B.studio3d;if(s){B.applyModelLook(s);s.renderFrame();B.cacheModelThumbnail(s);}const badge=document.querySelector('[data-model-look-name]');if(badge)badge.textContent=B.modelLook()==='neon'?'NEON / 3D':'VẬT LIỆU / 3D';}
 });
 document.addEventListener('input',e=>{if(!e.target.matches?.('[data-model-light-level]'))return;const u=B.state.ui;u.modelLightLevel=B.clamp(Number(e.target.value),0,100);B.customerFrameCache=null;const st=B.studio3d?.scene.userData.modelPresentation;if(st)st.lightSurface.material.opacity=u.modelLightLevel/100;B.studio3d?.renderFrame();const out=document.querySelector('[data-model-light-value]');if(out)out.value=u.modelLightLevel+'%';});
 document.addEventListener('change',e=>{if(e.target.matches?.('[data-model-light-level]')){B.save();if(B.studio3d)B.cacheModelThumbnail(B.studio3d);}});
})();
