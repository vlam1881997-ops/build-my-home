// Build My Home V2.1 conceptual 3D renderer. Geometry comes from the current plan;
// material colors follow the selected material tiers. This is not a photoreal/PBR renderer.
(()=>{
 const faces=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
 function box(x,y,z,w,h,d,color,floor,kind='part'){return {floor,color,kind,vertices:[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]],faces};}
 function palette(snapshot){const m=snapshot?.inputs?.material||{},tier=Number(snapshot?.inputs?.tier)||1;const floors=['#d8d0c3','#d9c8ae','#c4b092'],walls=['#e6dfd4','#eee5d8','#f2eadf'],doors=['#9a8469','#625c52','#3f4543'];return{floor:floors[Math.max(0,Math.min(2,Number(m.floor??tier)))],wall:walls[Math.max(0,Math.min(2,Number(m.paint??tier)))],door:doors[Math.max(0,Math.min(2,Number(m.door??tier)))],glass:'#72a9b9'};}
 function selectionFilter(selection){if(selection==='all')return{kind:'all'};if(String(selection).startsWith('room:'))return{kind:'room',id:String(selection).slice(5)};const floor=Number(selection);return Number.isInteger(floor)?{kind:'floor',floor}:{kind:'all'};}
 function mesh(snapshot,selection='all'){
  const g=snapshot.geometry,objects=[],height=snapshot.inputs.geometry.wallHeight,pal=palette(snapshot),filter=selectionFilter(selection),rooms=snapshot.inputs.geometry.rooms;
  const roomAllowed=r=>filter.kind==='all'||(filter.kind==='floor'&&r.floor===filter.floor)||(filter.kind==='room'&&r.id===filter.id);
  const wallAllowed=w=>filter.kind==='all'||(filter.kind==='floor'&&w.floor===filter.floor)||(filter.kind==='room'&&w.roomIds?.includes(filter.id));
  for(const r of rooms){if(!roomAllowed(r))continue;objects.push(box(r.x,r.floor*(height+.22),r.y,r.w,.12,r.h,pal.floor,r.floor,'floor'));}
  for(const w of g.walls){if(!wallAllowed(w))continue;const openings=g.openings.filter(o=>o.wallId===w.id),cuts=[...new Set([0,w.length,...openings.flatMap(o=>[o.offset,o.offset+o.width])])].sort((a,b)=>a-b);
   for(let i=1;i<cuts.length;i++){
    const start=cuts[i-1],length=cuts[i]-start,cover=openings.filter(o=>o.offset<=start+.00001&&o.offset+o.width>=cuts[i]-.00001).sort((a,b)=>a.sill-b.sill);let bottom=0;const pieces=[];
    for(const o of cover){if(o.sill>bottom)pieces.push([bottom,o.sill]);bottom=Math.max(bottom,o.sill+o.height);}if(bottom<height)pieces.push([bottom,height]);
    for(const [lo,hi] of pieces){const y=w.floor*(height+.22)+.12+lo;objects.push(w.axis==='h'?box(w.a+start,y,w.c-w.thickness/2,length,hi-lo,w.thickness,pal.wall,w.floor,'wall'):box(w.c-w.thickness/2,y,w.a+start,w.thickness,hi-lo,length,pal.wall,w.floor,'wall'));}
    for(const o of cover)if(o.kind==='window'){const y=w.floor*(height+.22)+.12+o.sill;objects.push(w.axis==='h'?box(w.a+start,y,w.c-.012,length,o.height,.024,pal.glass,w.floor,'window'):box(w.c-.012,y,w.a+start,.024,o.height,length,pal.glass,w.floor,'window'));}
   }
   for(const o of openings)if(o.kind==='door'){
    const a=w.a+o.offset,y=w.floor*(height+.22)+.12+o.sill,th=.035;
    objects.push(w.axis==='h'?box(a,y,w.c-th/2,o.width,o.height,th,pal.door,w.floor,'door'):box(w.c-th/2,y,a,th,o.height,o.width,pal.door,w.floor,'door'));
   }
  }
  return objects;
 }
 function obj(s){let index=1;const rows=[`# ${s.id}`,`# ${s.status} - conceptual meters, Y up; not structural design`];for(const [i,b] of mesh(s).entries()){rows.push(`o ${b.kind}_${i}`,...b.vertices.map(v=>'v '+v.map(n=>n.toFixed(5)).join(' ')),...b.faces.map(f=>'f '+f.map(n=>n+index).join(' ')));index+=b.vertices.length;}return rows.join('\n');}
 function bounds(objects,plot){if(!objects.length)return{center:[plot.width/2,plot.floors*(plot.wallHeight+.22)/2,plot.depth/2],radius:Math.max(plot.width,plot.depth,plot.floors*(plot.wallHeight+.22))*1.9};const pts=objects.flatMap(o=>o.vertices),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(const p of pts)for(let i=0;i<3;i++){min[i]=Math.min(min[i],p[i]);max[i]=Math.max(max[i],p[i]);}const center=min.map((n,i)=>(n+max[i])/2),span=Math.max(...max.map((n,i)=>n-min[i]));return{center,radius:Math.max(2,span)*2.1};}
 let clean=()=>{};
 function mount(canvas,snapshot,select){clean();if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;let yaw=-.7,pitch=.65,zoom=1,drag=null,selection='all',objects=mesh(snapshot,selection),frame=bounds(objects,snapshot.inputs.geometry);
  function draw(){const width=canvas.clientWidth||700,height=460,dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);const night=canvas.classList?.contains?.('scene-night')||false;ctx.fillStyle=night?'#17211f':'#eff2e9';ctx.fillRect(0,0,width,height);const projected=[],cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),scale=Math.min(width,height)*1.35*zoom,{center,radius}=frame;
   function transform(p){const x=p[0]-center[0],y=p[1]-center[1],z=p[2]-center[2],rx=x*cy-z*sy,rz=x*sy+z*cy;return[rx,y*cp-rz*sp,y*sp+rz*cp];}
   for(const b of objects){const points=b.vertices.map(transform);for(let fi=0;fi<b.faces.length;fi++){const f=b.faces[fi],verts=f.map(i=>points[i]);projected.push({verts,color:b.color,shade:(night?[.52,.68,.61,.46,.55,.62]:[.85,1,.92,.76,.85,.95])[fi],depth:verts.reduce((n,p)=>n+p[2],0)/4,kind:b.kind});}}
   projected.sort((a,b)=>b.depth-a.depth);for(const face of projected){ctx.beginPath();face.verts.forEach((p,i)=>{const depth=radius+p[2],x=width/2+p[0]*scale/depth,y=height/2-p[1]*scale/depth;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();const hex=face.color.match(/\w\w/g)||['cc','cc','cc'],rgb=hex.slice(0,3).map(h=>Math.max(0,Math.min(255,Math.round(parseInt(h,16)*face.shade))));ctx.fillStyle=`rgb(${rgb.join(',')})`;ctx.fill();ctx.strokeStyle=face.kind==='window'?'#9ad4e4aa':'#5e6c6545';ctx.lineWidth=face.kind==='door'?1:.55;ctx.stroke();}
   ctx.fillStyle=night?'#dce8dc':'#42533d';ctx.font='12px system-ui';const label=selection==='all'?'toàn nhà':String(selection).startsWith('room:')?'phòng đang chọn':'tầng '+(+selection+1);ctx.fillText(`${snapshot.id} · ${objects.length} khối · ${label}`,12,24);ctx.font='10px system-ui';ctx.fillText('Màu vật liệu mô phỏng theo lựa chọn Bước 6 · kéo để xoay, lăn chuột để zoom',12,42);
  }
  canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.008;pitch=Math.max(.12,Math.min(1.4,pitch+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY};draw();};canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};const wheel=e=>{e.preventDefault();zoom=Math.max(.4,Math.min(2.5,zoom*Math.exp(-e.deltaY*.001)));draw();};canvas.addEventListener('wheel',wheel,{passive:false});canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch=Math.min(1.4,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(.12,pitch-.1);if(e.key==='+'||e.key==='=')zoom=Math.min(2.5,zoom+.1);if(e.key==='-')zoom=Math.max(.4,zoom-.1);draw();}};
  if(select)select.onchange=()=>{selection=select.value;objects=mesh(snapshot,selection);frame=bounds(objects,snapshot.inputs.geometry);zoom=1;draw();};const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(draw):null;observer?.observe(canvas);draw();clean=()=>{observer?.disconnect();canvas.removeEventListener('wheel',wheel);};
 }
 globalThis.BMHScene={mesh,obj,mount};
})();
