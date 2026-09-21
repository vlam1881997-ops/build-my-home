// Actual 3D geometry, software perspective renderer. No external network or dependencies.
(()=>{
 const faces=[[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]];
 function box(x,y,z,w,h,d,color,floor){return {floor,color,vertices:[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]],faces};}
 function mesh(snapshot,selection='all'){
  const g=snapshot.geometry,objects=[],height=snapshot.inputs.geometry.wallHeight;
  for(const r of snapshot.inputs.geometry.rooms){if(selection!=='all'&&r.floor!==Number(selection))continue;objects.push(box(r.x,r.floor*(height+.22),r.y,r.w,.12,r.h,'#bcc9ad',r.floor));}
  for(const w of g.walls){
   if(selection!=='all'&&w.floor!==Number(selection))continue;
   const openings=g.openings.filter(o=>o.wallId===w.id),cuts=[...new Set([0,w.length,...openings.flatMap(o=>[o.offset,o.offset+o.width])])].sort((a,b)=>a-b);
   for(let i=1;i<cuts.length;i++){
    const start=cuts[i-1],length=cuts[i]-start,cover=openings.filter(o=>o.offset<=start+.00001&&o.offset+o.width>=cuts[i]-.00001).sort((a,b)=>a.sill-b.sill);let bottom=0;
    const pieces=[];
    for(const o of cover){if(o.sill>bottom)pieces.push([bottom,o.sill]);bottom=Math.max(bottom,o.sill+o.height);}
    if(bottom<height)pieces.push([bottom,height]);
    for(const [lo,hi] of pieces){const y=w.floor*(height+.22)+.12+lo;
     objects.push(w.axis==='h'?box(w.a+start,y,w.c-w.thickness/2,length,hi-lo,w.thickness,'#e2d2be',w.floor):box(w.c-w.thickness/2,y,w.a+start,w.thickness,hi-lo,length,'#e2d2be',w.floor));
    }
    for(const o of cover)if(o.kind==='window'){
     const y=w.floor*(height+.22)+.12+o.sill;
     objects.push(w.axis==='h'?box(w.a+start,y,w.c-.012,length,o.height,.024,'#72a9b9',w.floor):box(w.c-.012,y,w.a+start,.024,o.height,length,'#72a9b9',w.floor));
    }
   }
  }
  return objects;
 }
 function obj(s){let index=1;const rows=[`# ${s.id}`,`# ${s.status} - conceptual meters, Y up; not structural design`];for(const [i,b] of mesh(s).entries()){rows.push(`o part_${i}`,...b.vertices.map(v=>'v '+v.map(n=>n.toFixed(5)).join(' ')),...b.faces.map(f=>'f '+f.map(n=>n+index).join(' ')));index+=b.vertices.length;}return rows.join('\n');}
 let clean=()=>{};
 function mount(canvas,snapshot,select){clean();if(!canvas)return;const ctx=canvas.getContext('2d');if(!ctx)return;
  let yaw=-.7,pitch=.65,zoom=1,drag=null,selection='all';let objects=mesh(snapshot);
  const plot=snapshot.inputs.geometry,maxHeight=plot.floors*(plot.wallHeight+.22),center=[plot.width/2,maxHeight/2,plot.depth/2],radius=Math.max(plot.width,plot.depth,maxHeight)*1.9;
  function draw(){
   const width=canvas.clientWidth||700,height=460,dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#eff2e9';ctx.fillRect(0,0,width,height);
   const projected=[];const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),scale=Math.min(width,height)*1.35*zoom;
   function transform(p){const x=p[0]-center[0],y=p[1]-center[1],z=p[2]-center[2],rx=x*cy-z*sy,rz=x*sy+z*cy;return[rx,y*cp-rz*sp,y*sp+rz*cp];}
   for(const b of objects){const points=b.vertices.map(transform);for(let fi=0;fi<b.faces.length;fi++){const f=b.faces[fi],verts=f.map(i=>points[i]);projected.push({verts,color:b.color,shade:[.85,1,.92,.76,.85,.95][fi],depth:verts.reduce((n,p)=>n+p[2],0)/4});}}
   projected.sort((a,b)=>b.depth-a.depth);
   for(const face of projected){ctx.beginPath();face.verts.forEach((p,i)=>{const depth=radius+p[2],x=width/2+p[0]*scale/depth,y=height/2-p[1]*scale/depth;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();const rgb=face.color.match(/\w\w/g).map(h=>Math.round(parseInt(h,16)*face.shade));ctx.fillStyle=`rgb(${rgb.join(',')})`;ctx.fill();ctx.strokeStyle='#5e6c6540';ctx.lineWidth=.5;ctx.stroke();}
   ctx.fillStyle='#42533d';ctx.font='12px system-ui';ctx.fillText(`${snapshot.id} · ${objects.length} khối · ${selection==='all'?'toàn nhà':'tầng '+(+selection+1)}`,12,24);
  }
  canvas.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY};canvas.setPointerCapture(e.pointerId);};canvas.onpointermove=e=>{if(!drag)return;yaw+=(e.clientX-drag.x)*.008;pitch=Math.max(.12,Math.min(1.4,pitch+(e.clientY-drag.y)*.006));drag={x:e.clientX,y:e.clientY};draw();};canvas.onpointerup=canvas.onpointercancel=()=>{drag=null;};
  const wheel=e=>{e.preventDefault();zoom=Math.max(.4,Math.min(2.5,zoom*Math.exp(-e.deltaY*.001)));draw();};canvas.addEventListener('wheel',wheel,{passive:false});
  canvas.onkeydown=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','-','='].includes(e.key)){e.preventDefault();if(e.key==='ArrowLeft')yaw-=.1;if(e.key==='ArrowRight')yaw+=.1;if(e.key==='ArrowUp')pitch=Math.min(1.4,pitch+.1);if(e.key==='ArrowDown')pitch=Math.max(.12,pitch-.1);if(e.key==='+'||e.key==='=')zoom=Math.min(2.5,zoom+.1);if(e.key==='-')zoom=Math.max(.4,zoom-.1);draw();}};
  if(select)select.onchange=()=>{selection=select.value;objects=mesh(snapshot,selection);draw();};
  const observer=typeof ResizeObserver!=='undefined'?new ResizeObserver(draw):null;observer?.observe(canvas);draw();clean=()=>{observer?.disconnect();canvas.removeEventListener('wheel',wheel);};
 }
 globalThis.BMHScene={mesh,obj,mount};
})();
