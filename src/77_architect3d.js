/* Architect3D adapter, pinned upstream 52d9a6f7c8a13e6372efb4aadb181ffc6a066091. */
BMH.architectDocument=()=>{
  const p=BMH.state.project,l=BMH.projectLevels();
  const level=f=>{
    const corners={},walls=[],ids=new Map(),corner=(x,y)=>{const key=x.toFixed(4)+','+y.toFixed(4);if(!ids.has(key)){const id='c'+ids.size;ids.set(key,id);corners[id]={x:x*100,y:y*100,elevation:(l.floorHeight-l.slab)*100};}return ids.get(key);};
    BMH.wallSegments(f).forEach(s=>{const c1=corner(s.o==='h'?s.a:s.c,s.o==='h'?s.c:s.a),c2=corner(s.o==='h'?s.b:s.c,s.o==='h'?s.c:s.b);walls.push({corner1:c1,corner2:c2,wallType:'STRAIGHT',thickness:15});});
    const items=p.plan.openings.filter(o=>o.floor===f).flatMap(o=>{const s=BMH.openingWallSpan(o);if(!s)return [];const v=BMH.openingReview(o);return [{id:o.id,item_name:o.kind,item_type:10,xpos:(s.o==='h'?(s.a+s.b)/2:s.c)*100,zpos:(s.o==='h'?s.c:(s.a+s.b)/2)*100,ypos:(v.sill+v.height/2)*100,rotation:s.o==='h'?0:Math.PI/2,scale_x:1,scale_y:1,scale_z:1,fixed:true,opening:{kind:o.kind,width:o.width*100,height:v.height*100,sill:v.sill*100,hinge:o.hinge||'left',swing:90,style:'plain'}}];});
    const furniture={bed:'bedDouble',living:'loungeDesignSofa',bath:'toilet',kitchen:'kitchenSink'};
    BMH.floorRooms(f).forEach(r=>{const name=furniture[r.type];if(!name||Math.min(r.w,r.h)<2.3)return;items.push({id:'furniture-'+r.id,item_name:name,item_type:1,format:'gltf',model_url:'models/'+name+'.glb',xpos:(r.x+r.w/2)*100,zpos:(r.y+r.h/2)*100,ypos:0,rotation:0,scale_x:200,scale_y:200,scale_z:200,fixed:true});});
    return {name:'Tầng '+(f+1),height:l.floorHeight*100,floorplan:{version:'2.0.0',units:'cm',corners,walls,rooms:{},wallTextures:[],floorTextures:{},newFloorTextures:{}},items};
  };
  const levels=Array.from({length:l.floors},(_,f)=>level(f));
  // Bounding-box pitched roofs are unsuitable for concave footprints; omit until designed.
  return {floorplan:levels[0].floorplan,items:levels[0].items,levels:levels.map((v,i)=>i?v:{name:v.name,height:v.height})};
};
let architect3dLoading;
BMH.ensureArchitect3D=()=>{if(window.BP3DJS)return Promise.resolve(window.BP3DJS);if(!architect3dLoading)architect3dLoading=new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='assets/architect3d/architect3d.js';script.onload=()=>resolve(window.BP3DJS);script.onerror=()=>{architect3dLoading=null;script.remove();reject(new Error('Không tải được Architect3D.'));};document.head.appendChild(script);});return architect3dLoading;};
const architectureMount=BMH.mountStudio3D,architectureDispose=BMH.disposeStudio3D,architectureReset=BMH.resetStudio3D;
BMH.disposeStudio3D=()=>{if(BMH.architectViewer){BMH.architectViewer.dispose();BMH.architectViewer=null;}BMH.$('.architect3d-host')?.remove();architectureDispose();};
BMH.resetStudio3D=()=>{if(BMH.architectViewer)BMH.architectViewer.three.centerCamera();else architectureReset();};
BMH.mountStudio3D=async()=>{
  if(BMH.state.ui.architectureEngine!=='architect3d')return architectureMount();
  const stage=BMH.$('#studio3dStage');if(!stage)return;BMH.disposeStudio3D();
  try{
    const A=await BMH.ensureArchitect3D();if(BMH.$('#studio3dStage')!==stage)return;
    const doc=BMH.architectDocument(),parsed=A.DesignDocument.parse(JSON.stringify(doc));if(!parsed.ok)throw new Error(parsed.errors.map(e=>e.path+': '+e.message).join('; '));
    const host=document.createElement('div');host.className='architect3d-host';stage.appendChild(host);
    const viewer=new A.BlueprintJS({threeElement:host,widget:true,assets:new A.AssetResolver({base:'assets/architect3d/'}),configuration:new A.Configuration({wallHeight:(BMH.projectLevels().floorHeight-BMH.projectLevels().slab)*100})});BMH.architectViewer=viewer;
    viewer.model.loadSerialized(JSON.stringify(doc));viewer.three.centerCamera();
    stage.classList.add('three-ready','architect3d-active');BMH.$('#studio3dLoading')?.remove();BMH.$('#studio3dCanvas').style.display='none';
    const tip=stage.querySelector('.v61-3d-tip');if(tip)tip.textContent='Architect3D · xoay / zoom · kích thước từ mặt bằng · nội thất tham khảo Kenney CC0';
  }catch(err){BMH.disposeStudio3D();stage.classList.add('three-failed');BMH.$('#studio3dLoading')?.remove();const tip=stage.querySelector('.v61-3d-tip');if(tip)tip.textContent='Architect3D chưa dựng được: '+String(err.message||err);console.error('Architect3D',err);}
};
