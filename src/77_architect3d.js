/* Architect3D adapter, pinned upstream 52d9a6f7c8a13e6372efb4aadb181ffc6a066091. */
BMH.architectDocument=(focus='all')=>{
  const p=BMH.state.project,l=BMH.projectLevels();
  const focusedRoom=focus.startsWith('room:')?p.plan.rooms.find(r=>r.id===focus.slice(5)):null;
  const level=f=>{
    const corners={},walls=[],ids=new Map(),corner=(x,y)=>{const key=x.toFixed(4)+','+y.toFixed(4);if(!ids.has(key)){const id='c'+ids.size;ids.set(key,id);corners[id]={x:x*100,y:y*100,elevation:(l.floorHeight-l.slab)*100};}return ids.get(key);};
    const segments=focusedRoom?(f===focusedRoom.floor?['north','south','east','west'].map(side=>({o:['north','south'].includes(side)?'h':'v',a:['north','south'].includes(side)?focusedRoom.x:focusedRoom.y,b:['north','south'].includes(side)?focusedRoom.x+focusedRoom.w:focusedRoom.y+focusedRoom.h,c:side==='north'?focusedRoom.y:side==='south'?focusedRoom.y+focusedRoom.h:side==='west'?focusedRoom.x:focusedRoom.x+focusedRoom.w})):[]):BMH.wallSegments(f);
    segments.forEach(s=>{const c1=corner(s.o==='h'?s.a:s.c,s.o==='h'?s.c:s.a),c2=corner(s.o==='h'?s.b:s.c,s.o==='h'?s.c:s.b);walls.push({corner1:c1,corner2:c2,wallType:'STRAIGHT',thickness:15});});
    const items=p.plan.openings.filter(o=>o.floor===f&&(!focusedRoom||o.roomId===focusedRoom.id)).flatMap(o=>{const s=BMH.openingWallSpan(o);if(!s)return [];const v=BMH.openingReview(o);return [{id:o.id,item_name:o.kind,item_type:10,xpos:(s.o==='h'?(s.a+s.b)/2:s.c)*100,zpos:(s.o==='h'?s.c:(s.a+s.b)/2)*100,ypos:(v.sill+v.height/2)*100,rotation:s.o==='h'?0:Math.PI/2,scale_x:1,scale_y:1,scale_z:1,fixed:true,opening:{kind:o.kind,width:o.width*100,height:v.height*100,sill:v.sill*100,hinge:o.hinge||'left',swing:90,style:'plain'}}];});
    const furniture={bed:'bedDouble',living:'loungeDesignSofa',bath:'toilet',kitchen:'kitchenSink'};
    BMH.floorRooms(f).filter(r=>!focusedRoom||r.id===focusedRoom.id).forEach(r=>{const name=furniture[r.type];if(!name||Math.min(r.w,r.h)<2.3)return;items.push({id:'furniture-'+r.id,item_name:name,item_type:1,format:'gltf',model_url:'models/'+name+'.glb',xpos:(r.x+r.w/2)*100,zpos:(r.y+r.h/2)*100,ypos:0,rotation:0,scale_x:200,scale_y:200,scale_z:200,fixed:true});});
    return {name:'Tầng '+(f+1),height:l.floorHeight*100,floorplan:{version:'2.0.0',units:'cm',corners,walls,rooms:{},wallTextures:[],floorTextures:{},newFloorTextures:{}},items};
  };
  const levels=Array.from({length:l.floors},(_,f)=>level(f));
  // Bounding-box pitched roofs are unsuitable for concave footprints; omit until designed.
  return {floorplan:levels[0].floorplan,items:levels[0].items,levels:levels.map((v,i)=>i?v:{name:v.name,height:v.height})};
};
BMH.syncArchitectRoomNames=model=>{model.levels.forEach((level,f)=>{for(const room of level.floorplan.getRooms()){const xs=room.corners.map(c=>c.x/100),ys=room.corners.map(c=>c.y/100),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y;const source=BMH.floorRooms(f).find(r=>Math.abs(r.x-x)<.01&&Math.abs(r.y-y)<.01&&Math.abs(r.w-w)<.01&&Math.abs(r.h-h)<.01);if(source){room.name=source.name;room.type=source.type;}}});};
BMH.syncArchitectFloorOpenings=model=>{model.levels.forEach((level,f)=>level.floorplan.setFloorOpenings((BMH.stairFloorHoles?.(f)||[]).map(h=>[{x:h.x*100,y:h.y*100},{x:(h.x+h.w)*100,y:h.y*100},{x:(h.x+h.w)*100,y:(h.y+h.h)*100},{x:h.x*100,y:(h.y+h.h)*100}])));};
let architect3dLoading;
BMH.ensureArchitect3D=()=>{if(window.BP3DJS)return Promise.resolve(window.BP3DJS);if(!architect3dLoading)architect3dLoading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='assets/architect3d/architect3d.js';script.onload=()=>resolve(window.BP3DJS);script.onerror=()=>{architect3dLoading=null;script.remove();reject(new Error('Không tải được Architect3D.'));};document.head.appendChild(script);});return architect3dLoading;};
const architectureMount=BMH.mountStudio3D,architectureDispose=BMH.disposeStudio3D,architectureReset=BMH.resetStudio3D;
BMH.disposeStudio3D=()=>{BMH.architectCleanup?.();BMH.architectCleanup=null;BMH.$('.architect3d-controls')?.remove();if(BMH.architectViewer){BMH.architectViewer.dispose();BMH.architectViewer=null;}BMH.$('.architect3d-host')?.remove();architectureDispose();};
BMH.resetStudio3D=()=>{if(BMH.architectViewer)BMH.architectViewer.three.centerCamera();else architectureReset();};
BMH.mountStudio3D=async()=>{
  if(BMH.state.ui.architectureEngine!=='architect3d')return architectureMount();
  const stage=BMH.$('#studio3dStage');if(!stage)return;BMH.disposeStudio3D();
  try{
    const A=await BMH.ensureArchitect3D();if(BMH.$('#studio3dStage')!==stage)return;
    const focus=BMH.state.ui.sceneFocus||'all',doc=BMH.architectDocument(focus),parsed=A.DesignDocument.parse(JSON.stringify(doc));if(!parsed.ok)throw new Error(parsed.errors.map(e=>e.path+': '+e.message).join('; '));
    const host=document.createElement('div');host.className='architect3d-host';stage.appendChild(host);
    const assets=new A.AssetResolver({base:'assets/architect3d/'}),resolveAsset=assets.resolve.bind(assets);
    // These optional upstream textures are disabled; use the bundled neutral map.
    assets.resolve=name=>resolveAsset(['rooms/textures/walllightmap.png','rooms/textures/Ground_4K.ktx2'].includes(name)?'rooms/textures/wallmap.png':name);
    const renderProfile=A.createRenderProfile('studio',{environment:false,groundTexture:false,wallLightMapIntensity:0,shadowMapSize:1024,hemisphereIntensity:.8});
    const viewer=new A.BlueprintJS({threeElement:host,widget:true,assets,renderProfile,configuration:new A.Configuration({wallHeight:(BMH.projectLevels().floorHeight-BMH.projectLevels().slab)*100})});BMH.architectViewer=viewer;
    const controls=document.createElement('div');controls.className='architect3d-controls';
    controls.innerHTML='<label>Xem không gian <select data-scene-focus><option value="all" '+(focus==='all'?'selected':'')+'>Toàn bộ nhà</option>'+doc.levels.map((l,i)=>'<option value="floor:'+i+'" '+(focus==='floor:'+i?'selected':'')+'>Tầng '+(i+1)+'</option>').join('')+BMH.state.project.plan.rooms.map(r=>'<option value="room:'+BMH.esc(r.id)+'" '+(focus==='room:'+r.id?'selected':'')+'>T'+(r.floor+1)+' · '+BMH.esc(r.name)+'</option>').join('')+'</select></label><button type="button" data-architect-reset>Đặt lại góc nhìn</button><button type="button" data-architect-export>Tải mô hình JSON</button><span role="status" data-architect-status></span>';
    stage.appendChild(controls);
    const status=controls.querySelector('[data-architect-status]');let pending=0,failures=0,finishLoading,loadingDocument=true;
    viewer.furnitureReady=new Promise(resolve=>{finishLoading=resolve;});
    const loading=()=>{pending++;status.textContent='Đang tải nội thất…';};
    const loaded=e=>{pending=Math.max(0,pending-1);if(!e.item&&!e.stale)failures++;status.textContent=failures?'Thiếu '+failures+' mô hình nội thất':pending?'Đang tải nội thất…':'Mô hình đã tải';BMH.syncArchitectFloorOpenings(viewer.model);if(!loadingDocument&&!pending)finishLoading();};
    viewer.model.scene.addEventListener(A.EVENT_ITEM_LOADING,loading);viewer.model.scene.addEventListener(A.EVENT_ITEM_LOADED,loaded);
    BMH.architectCleanup=()=>{finishLoading();viewer.model.scene.removeEventListener(A.EVENT_ITEM_LOADING,loading);viewer.model.scene.removeEventListener(A.EVENT_ITEM_LOADED,loaded);};
    const frame=()=>{if(focus==='all')viewer.three.showExterior();else{const room=BMH.state.project.plan.rooms.find(r=>'room:'+r.id===focus),f=room?room.floor:Number(focus.slice(6));viewer.model.setActiveLevel(f);viewer.three.showStoreys(false);viewer.three.centerCamera();}BMH.syncArchitectFloorOpenings(viewer.model);viewer.three.render(true);};
    controls.addEventListener('click',e=>{if(e.target.closest('[data-architect-reset]'))frame();if(e.target.closest('[data-architect-export]'))BMH.download('BMH-Architect3D.json',JSON.stringify(BMH.architectDocument(),null,2),'application/json');});
    viewer.model.loadSerialized(JSON.stringify(doc));loadingDocument=false;if(!pending)finishLoading();BMH.syncArchitectRoomNames(viewer.model);viewer.three.setReadOnly(true);frame();
    stage.classList.add('three-ready','architect3d-active');BMH.$('#studio3dLoading')?.remove();const canvas=BMH.$('#studio3dCanvas');if(canvas)canvas.style.display='none';
    const tip=stage.querySelector('.v61-3d-tip');if(tip)tip.textContent='Architect3D · xoay / zoom · kích thước từ mặt bằng · nội thất tham khảo Kenney CC0';
  }catch(err){BMH.disposeStudio3D();stage.classList.add('three-failed');BMH.$('#studio3dLoading')?.remove();const tip=stage.querySelector('.v61-3d-tip');if(tip)tip.textContent='Architect3D chưa dựng được: '+String(err.message||err);console.error('Architect3D',err);}
};
