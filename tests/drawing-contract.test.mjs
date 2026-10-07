import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function client(){
 const rooms=[{id:'a',floor:0,name:'Khách',type:'living',x:0,y:0,w:4,h:4},{id:'b',floor:0,name:'Ngủ',type:'bed',x:4,y:0,w:4,h:4},{id:'c',floor:1,name:'Khách trên',type:'living',x:0,y:0,w:8,h:4}];
 const BMH={state:{project:{name:'Nhà thử',style:'Japandi',site:{width:8,depth:8,floors:2},plan:{rooms,openings:[]},materials:{choices:{}}},ui:{planner:{floor:0},sceneFocus:'all'}},esc:String,clamp:(n,a,b)=>Math.min(b,Math.max(a,n)),houseStyle:()=>({form:'gable'}),roomFurnitureLayout:()=>[],roomEditingPanel:()=>'',architectDocument:()=>({}),save(){},render(){},toast(){}};
 const ctx={BMH,document:{addEventListener(){}},window:{},structuredClone,console};
 for(const f of ['30_planner','40_exports','45_studio3d'])vm.runInNewContext(fs.readFileSync('src/'+f+'.js','utf8'),ctx);
 BMH.projectLevels=()=>({floors:2,floorHeight:3.6,slab:.18,ceilingDrop:.2,clearHeight:3.22});
 const source=fs.readFileSync('src/75_completion.js','utf8');vm.runInNewContext(source.slice(source.indexOf('BMH.sceneFootprintBounds='),source.indexOf('// Studio renders from this registry')),ctx);
 vm.runInNewContext(fs.readFileSync('src/79_stair_design.js','utf8'),ctx);return BMH;
}
function entities(dxf){const lines=dxf.trim().split(/\r?\n/),rows=[];let current;
 for(let i=0;i<lines.length;i+=2){const code=Number(lines[i]),value=lines[i+1];if(code===0){if(current)rows.push(current);current={type:value,fields:{}};}else if(current)(current.fields[code]??=[]).push(value);}if(current)rows.push(current);return rows;
}
test('door hinges and inward/outward swing share exact endpoints for all four sides',()=>{
 const b=client();for(const side of ['north','south','east','west'])for(const hinge of ['left','right'])for(const swing of ['in','out']){
  const o={id:'d',roomId:'a',floor:0,kind:'door',side,hinge,swing,width:1.8,height:2.2,offset:.3};b.state.project.plan.openings=[o];const g=b.doorLeafGeometry(o);
  assert.ok(Math.abs(Math.hypot(g.open.x-g.hinge.x,g.open.y-g.hinge.y)-1.8)<1e-8);assert.ok(Math.abs(Math.hypot(g.closed.x-g.hinge.x,g.closed.y-g.hinge.y)-1.8)<1e-8);
  const span=b.openingWallSpan(o);assert.equal(g.horizontal?g.hinge.x:g.hinge.y,hinge==='right'?span.b:span.a);assert.match(b.openingSvg(o),new RegExp('x2="'+g.open.x+'" y2="'+g.open.y+'"'));
  const arc=entities(b.planDxf()).find(e=>e.type==='ARC');assert.ok(arc);assert.equal(Number(arc.fields[40][0]),1800);assert.equal(Number(arc.fields[10][0]),Math.round(g.hinge.x*1000000)/1000);assert.ok(Math.abs(Number(arc.fields[20][0])+Math.round(g.hinge.y*1000000)/1000)<1e-8);
  assert.equal((Number(arc.fields[51][0])-Number(arc.fields[50][0])+360)%360,90);
 }
});
test('an isolated room retains the doorway defined by the adjoining room',()=>{
 const b=client(),p=b.state.project.plan;p.openings=[{id:'shared',roomId:'a',floor:0,kind:'door',side:'east',width:1.2,height:2.2,offset:.5}];
 for(const room of p.rooms.filter(r=>r.floor===0)){const geometry=b.scenePlanGeometry({rooms:[room],wallContext:p.rooms,openings:p.openings},0),opening=geometry.walls.find(w=>w.openingId==='shared');assert.ok(opening,room.id);assert.equal(opening.kind,'door');assert.equal(opening.thickness,.12);assert.ok(Math.abs(opening.b-opening.a-1.2)<1e-8);assert.equal(opening.height,2.2);}
});
test('A3 projections are finite, use the actual cut and share one geometry revision',()=>{
 const b=client();b.state.ui.planner.sectionCutX=2.25;const elevation=b.elevationSvg(),section=b.sectionSvg(),schedule=b.openingSheetSvg(0);
 for(const svg of [elevation,section,schedule]){assert.doesNotMatch(svg,/NaN|undefined/);assert.match(svg,/width="420mm" height="297mm"/);assert.match(svg,new RegExp('data-revision="'+b.drawingRevision()+'"'));}
 assert.match(section,/x = 2.250 m/);assert.match(b.sectionLineSvg(0,8),/M2.25 -.4V8.4/);assert.match(elevation,/sheet-KT-MD/);assert.match(section,/sheet-KT-MC/);
 const before=b.drawingRevision();b.state.ui.planner.zoom=2;b.state.ui.sceneTheme='night';assert.equal(b.drawingRevision(),before);b.state.project.plan.rooms[0].w-=.1;assert.notEqual(b.drawingRevision(),before);
});
test('roof projections use the same measured vertices as the web scene',()=>{
 const b=client(),roof=b.sceneRoofSpec();assert.ok(roof);assert.ok(Math.abs(roof.eave-(2*3.6+.18+.18))<1e-8);assert.equal(roof.faces.length,4);assert.match(b.elevationSvg(),/data-projection-roof="1"/);assert.match(b.sectionSvg(),/data-projection-roof="1"/);
 for(const face of roof.faces)for(const p of face)assert.ok(p.every(Number.isFinite));b.state.project.plan.rooms.push({id:'notch',floor:1,type:'bed',name:'L',x:0,y:4,w:4,h:4});assert.equal(b.sceneRoofSpec(),null);assert.doesNotMatch(b.elevationSvg(),/data-projection-roof/);
});
test('the default section cuts an actual stair flight and opening motion invalidates rendered views',()=>{
 const b=client(),r={id:'stair',name:'Thang',type:'stairs',floor:0,x:0,y:4,w:4,h:4,stairDirection:0};b.state.project.plan.rooms.push(r);
 const cut=b.sectionCutX();assert.ok(b.stairGeometry(r).some(q=>q.base===0&&cut>q.x&&cut<q.x+q.w));assert.match(b.sectionSvg(),/data-section-stair="stair"/);
 const door={id:'d',roomId:'a',floor:0,kind:'door',side:'north',width:1,height:2.1,offset:.5};b.state.project.plan.openings=[door];const original=b.cinematicSignature();door.hinge='right';assert.notEqual(b.cinematicSignature(),original);const changed=b.cinematicSignature();door.swing='out';assert.notEqual(b.cinematicSignature(),changed);
});
test('stair detail sheets show the shared actual flights, storey rise and individual tread count',()=>{
 const b=client(),room={id:'stair',name:'Thang',type:'stairs',floor:0,x:0,y:4,w:4,h:4,stairDirection:0};b.state.project.plan.rooms.push(room);const before=JSON.stringify(b.state.project.plan),spec=b.stairSpec(room),parts=b.stairGeometry(room),svg=b.stairDetailSheetSvg(room);
 assert.equal(b.stairDrawingRooms().length,1);assert.match(svg,/data-sheet-code="KT-CT-01"/);assert.match(svg,/width="420mm" height="297mm"/);assert.match(svg,new RegExp(spec.count+' cao bậc'));assert.match(svg,/>3600</);assert.match(svg,new RegExp('Mặt bậc '+Math.round(spec.tread*1000)+' mm'));assert.ok(svg.includes('>+'+spec.rise.toFixed(3)+'<'));assert.doesNotMatch(svg,/NaN|undefined/);assert.equal((svg.match(/<rect /g)||[]).length,parts.length*2+6);assert.equal(JSON.stringify(b.state.project.plan),before);
});
test('large opening schedules paginate every row without truncation',()=>{
 const b=client();b.state.project.plan.openings=Array.from({length:53},(_,i)=>({id:'o'+i,floor:0,roomId:'a',kind:i%2?'window':'door',side:'north',width:.8,height:1.4,sill:.9,offset:.5}));
 const sheets=[0,1,2].map(i=>b.openingSheetSvg(0,i));assert.deepEqual(sheets.map(s=>(s.match(/>D\d+<|>W\d+</g)||[]).length),[24,24,5]);assert.equal(new Set(sheets.flatMap(s=>s.match(/>D\d+<|>W\d+</g)||[])).size,53);assert.match(sheets[2],/Trang 3\/3/);assert.doesNotMatch(sheets.join(''),/NaN|undefined/);
});
test('drawing scale fits A3 with integer scale selection and a measurable known span',()=>{const b=client();for(const [w,h] of [[25,10],[12,18],[80,40]]){const s=b.drawingScale(w,h);assert.ok(Number.isInteger(s)&&s>0);assert.ok(w*1000/s<=308&&h*1000/s<=218);}});

test('stair drawing selection follows the floor, survives a deleted flight and excludes the top-floor well',()=>{
 const b=client();b.state.project.site.floors=3;b.projectLevels=()=>({floors:3,floorHeight:3.6,slab:.18,ceilingDrop:.2,clearHeight:3.22});
 const stairs=[0,1,2].map(floor=>({id:'s'+floor,name:'Thang',type:'stairs',floor,x:0,y:4,w:4,h:4,stairDirection:0}));b.state.project.plan.rooms.push(...stairs);
 b.state.ui.planner.stairDrawingId='s0';assert.equal(b.stairDrawingSelection(1).room.id,'s1');assert.equal(b.stairDrawingSelection(2).room.id,'s1');assert.equal(b.stairDrawingRooms().length,2);
 b.state.project.plan.rooms=b.state.project.plan.rooms.filter(r=>r.id!=='s1');b.state.ui.planner.floor=1;b.state.ui.planner.stairDrawingId='deleted';assert.equal(b.stairDrawingSelection().room.id,'s0');
 b.state.project.plan.rooms=b.state.project.plan.rooms.filter(r=>r.type!=='stairs');b.state.ui.planner.view='stairs';assert.equal(b.stairDrawingSelection().index,-1);assert.equal(b.currentDrawingSvg(),null);
 let downloads=0,message='';b.download=()=>downloads++;b.toast=text=>message=text;b.exportPlanSvg();assert.equal(downloads,0);assert.match(message,/Chưa có vế thang/);
});

test('the active stair sheet and its download reflect the selected flight and measured edits',()=>{
 const b=client(),stairs=[{id:'left',name:'Thang A',type:'stairs',floor:0,x:0,y:4,w:3,h:4,stairDirection:0},{id:'right',name:'Thang B',type:'stairs',floor:0,x:4,y:4,w:4,h:4,stairDirection:0}];b.state.project.plan.rooms.push(...stairs);
 Object.assign(b.state.ui.planner,{view:'stairs',floor:0,stairDrawingId:'right'});const svg=b.currentDrawingSvg();assert.match(svg,/data-sheet-code="KT-CT-02"/);assert.match(svg,/Thang B/);
 let download;b.download=(name,content,type)=>download={name,content,type};b.exportPlanSvg();assert.equal(download.name,'BMH-chi-tiet-thang-2-A3.svg');assert.equal(download.content,svg);assert.equal(download.type,'image/svg+xml');
 b.state.ui.planner.zoom=2;assert.equal(b.currentDrawingSvg(),svg);const revision=b.drawingRevision();stairs[1].stairDirection=90;assert.notEqual(b.drawingRevision(),revision);assert.notEqual(b.currentDrawingSvg(),svg);assert.doesNotMatch(b.currentDrawingSvg(),/NaN|undefined/);
});

test('DXF model millimetres, non-centred opening metadata and void panels are native entities',()=>{
 const b=client();b.state.project.plan.rooms.push({id:'stair0',floor:0,name:'Cầu thang',type:'stairs',x:0,y:4,w:3,h:3},{id:'stair1',floor:1,name:'Cầu thang trên',type:'stairs',x:0,y:4,w:3,h:3});b.state.project.plan.openings=[{id:'off-centre-window',floor:0,roomId:'a',kind:'window',side:'north',width:1.2,height:1.4,sill:.9,offset:.137}];b.state.project.site.useParcelGeometry=true;b.parcelGeometry=()=>({basis:'measured',points:[{x:0,y:0},{x:8,y:0},{x:8,y:5},{x:6,y:8},{x:0,y:8}]});const dxf=b.planDxf(0),rows=entities(dxf),plot=rows.find(r=>r.type==='LWPOLYLINE'&&r.fields[8]?.[0]==='PLOT');assert.equal(+plot.fields[90][0],5);assert.deepEqual(plot.fields[10].map(Number),[0,8000,8000,6000,0]);assert.ok(rows.some(r=>r.type==='APPID'&&r.fields[2]?.[0]==='BMH'));const window=rows.find(r=>r.type==='LINE'&&r.fields[8]?.[0]==='WINDOWS'),span=b.openingWallSpan(b.state.project.plan.openings[0]);assert.equal(+window.fields[10][0],Math.round(span.a*1000000)/1000);assert.equal(+window.fields[11][0],Math.round(span.b*1000000)/1000);assert.ok(window.fields[1000].includes('openingId=off-centre-window'));assert.ok(window.fields[1000].includes('revision='+b.drawingRevision()));assert.ok(window.fields[1000].includes('units=mm'));const top=entities(b.planDxf(1));assert.ok(top.some(r=>r.type==='LWPOLYLINE'&&r.fields[8]?.[0]==='VOIDS'));const hole=b.stairFloorHoles(1)[0],slabs=top.filter(r=>r.type==='LWPOLYLINE'&&r.fields[8]?.[0]==='SLABS');for(const q of slabs){const xs=q.fields[10].map(n=>+n/1000),ys=q.fields[20].map(n=>-n/1000);assert.ok(Math.max(...xs)<=hole.x+.00001||Math.min(...xs)>=hole.x+hole.w-.00001||Math.max(...ys)<=hole.y+.00001||Math.min(...ys)>=hole.y+hole.h-.00001);}assert.doesNotMatch(dxf,/NaN|undefined/);
});

test('an imported name longer than one sheet continues without clipping or dropping text',()=>{
 const b=client(),name=Array.from({length:600},(_,i)=>'Phòng'+i).join(' '),rows=[{id:'long-name',values:['P01',name]}],pages=b.drawingTablePages(rows,{widths:[20,72],size:2.5,height:200});assert.ok(pages.length>1);assert.ok(pages.every(p=>p.reduce((s,r)=>s+r.height,0)<=200.00001));assert.equal(pages.flat().flatMap(r=>r.cells[1]).join(' '),name);assert.ok(pages.flat().at(-1).continued);
});
