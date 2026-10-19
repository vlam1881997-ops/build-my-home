import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {designClient} from './fixtures/design-client.mjs';
import {modernReference} from './team-b-modern-reference.mjs';

function dashboardClient(packageFiles){
 const {B}=modernReference();B.screen2=()=>'';B.money=n=>Number(n).toLocaleString('vi-VN')+' đ';B.estimate=()=>({total:1300000000,budget:1200000000,gap:-100000000,area:160.42,areaSource:'plan'});B.boqSchedule=()=>[{group:'Kế hoạch',amount:1300000000,status:'quoted'},{amount:null},{amount:null}];B.dossierSchedule=()=>[];B.activeBudgetBaseline=()=>null;B.fundingNeed=()=>({ownCapital:500000000,remaining:800000000});B.commercialBoq();
 if(packageFiles)B.customerPackageFiles=(...args)=>packageFiles(B,...args);vm.runInNewContext(fs.readFileSync('src/97_project_dashboard.js','utf8'),{BMH:B,document:{addEventListener(){}},Number,Math,Map,console});return B;
}
const dashboardQuote=extra=>({sku:'TEST-ONLY-FLOOR',specification:'TEST fixture floor m2',unit:'m²',unitPrice:100000,quotedAt:'2026-10-01',validUntil:'2027-01-01',sourceReference:'TEST-ONLY quote, not a supplier price',region:'TP. Hồ Chí Minh',scope:'installed',wastePct:0,vatMode:'included',transportMode:'included',...extra});
function quoteDashboardFloor(B,extra={}){B.setBoqApplication({id:'AP-floor-project',name:'Sàn kiểm thử',roleId:'floor',sku:'TEST-ONLY-FLOOR',specification:'TEST fixture floor m2',quoteId:'test-floor-quote',costTreatment:'purchase'});B.setSourcedQuote('test-floor-quote',dashboardQuote(extra));}
test('commercial dashboard counts the actual sourced BOQ, not two legacy omissions or its estimated total',()=>{
 const B=dashboardClient(),before=JSON.stringify(B.state.project),d=B.projectDashboardData(),s=B.commercialBoq();assert.equal(d.e.total,1300000000);assert.equal(d.planningQuoted,1300000000);assert.equal(d.quoted,0);assert.equal(d.unpriced.length,s.unpricedCount);assert.ok(d.unpriced.length>10);assert.equal(d.source.completeTotal,null);
 const html=B.dashboardCostMetricsHtml(d)+B.dashboardSourcedBudgetHtml(d);assert.match(html,/Ngân sách phương án/);assert.match(html,/Chưa đủ dữ liệu để chốt tổng/);assert.ok(html.includes('>'+s.unpricedCount+'<'));assert.doesNotMatch(html,/Ngân sách đã tính|Báo giá đã đủ phạm vi/);assert.equal(JSON.stringify(B.state.project),before);
});
test('a valid quote, replacement price and expiry update the same public dashboard scope without changing geometry',()=>{
 const B=dashboardClient(),plan=JSON.stringify(B.state.project.plan),rev=B.drawingRevision();quoteDashboardFloor(B);let d=B.projectDashboardData(),row=d.source.rows.find(r=>r.code==='AP-floor-project');assert.ok(row.amount>0);assert.equal(d.quoted,row.amount);assert.equal(d.source.completeTotal,null);const key=d.source.priceKey,count=d.unpriced.length;
 B.setSourcedQuote('test-floor-quote',dashboardQuote({unitPrice:200000}));d=B.projectDashboardData();assert.equal(d.quoted,row.amount*2);assert.notEqual(d.source.priceKey,key);assert.equal(d.unpriced.length,count);
 B.setSourcedQuote('test-floor-quote',dashboardQuote({validUntil:'2020-01-01'}));d=B.projectDashboardData();assert.equal(d.quoted,0);assert.equal(d.unpriced.length,count+1);assert.equal(d.sourceFunding.requiredLoan,null);assert.equal(B.drawingRevision(),rev);assert.equal(JSON.stringify(B.state.project.plan),plan);
});
test('budget UI preserves explicit zero but never converts absent, outdated or provisional complete totals into zero',()=>{
 const B=dashboardClient(),d=B.projectDashboardData();for(const full of [null,undefined,-1,NaN]){d.source={...d.source,completeTotal:full};assert.match(B.dashboardSourcedBudgetHtml(d),/Chưa đủ dữ liệu để chốt tổng/);}
 d.source={...d.source,completeTotal:0};d.unpriced=[];assert.match(B.dashboardSourcedBudgetHtml(d),/Tổng dự toán đủ dữ liệu: 0 đ/);
 d.source.completeTotal=null;assert.match(B.dashboardSourcedBudgetHtml(d),/Cần xác nhận dự phòng/);
 const current=B.commercialBoq;B.commercialBoq=()=>({...current(),revision:'old-revision'});const stale=B.projectDashboardData();assert.equal(stale.source,null);assert.equal(stale.quoted,null);assert.match(B.dashboardCostMetricsHtml(stale),/Chưa đối chiếu/);assert.equal(B.sourcedBudgetCsv(),null);
});
test('sourced CSV retains nulls, exact revision and price identity, escapes formulas and excludes raw private quote fields',()=>{
 const B=dashboardClient();quoteDashboardFloor(B,{sourceReference:'\t=UNTRUSTED()',privateToken:'CONFIDENTIAL_INTERNAL'});B.state.project.costPlan.applications[0].name=' =UNTRUSTED("x")';const before=JSON.stringify(B.state.project),d=B.projectDashboardData(),file=B.sourcedBudgetCsv();
 assert.equal(file.revision,d.source.revision);assert.equal(file.priceKey,d.source.priceKey);assert.match(file.csv,/"Tổng dự toán đủ dữ liệu","Chưa có"/);assert.ok(file.csv.includes('"Phần có nguồn đã tính","'+d.quoted+'"'));assert.ok(file.csv.includes('"\' =UNTRUSTED(""x"")"'));assert.ok(file.csv.includes('"\'\t=UNTRUSTED()"'));assert.doesNotMatch(file.csv,/CONFIDENTIAL_INTERNAL/);assert.equal(JSON.stringify(B.state.project),before);
 let sent;B.download=(...args)=>sent=args;assert.equal(B.exportSourcedBudget(),true);assert.match(sent[0],/^BMH-BOQ-co-nguon-/);assert.equal(sent[1],file.csv);assert.match(sent[2],/text\/csv/);
});
test('CSV rejects a project, design or price identity that changes during export assembly',()=>{
 for(const field of ['project','revision','priceKey']){const B=dashboardClient(),base=B.commercialBoq();let calls=0;B.commercialBoq=()=>{calls++;if(calls===2){if(field==='project')B.state.project=structuredClone(B.state.project);if(field==='revision')B.drawingRevision=()=>'changed';}return {...base,priceKey:field==='priceKey'&&calls===2?'changed':base.priceKey};};
  // Changes during the second read must be caught as well as before it.
  assert.equal(B.sourcedBudgetCsv()===null,true,field);
 }
});
test('customer ZIP reuses the sourced CSV with source/date and rejects changes during package assembly',()=>{
 const other=['other.json','unchanged'],B=dashboardClient(()=>[other,['boq-co-nguon.csv','old source/date adapter']]);quoteDashboardFloor(B);let files=B.customerPackageFiles({revision:B.drawingRevision()});assert.equal(files.length,2);assert.equal(files[0],other);assert.equal(files[1][1],B.sourcedBudgetCsv().csv);assert.match(files[1][1],/TEST-ONLY quote, not a supplier price/);assert.match(files[1][1],/2026-10-01/);assert.throws(()=>B.customerPackageFiles({revision:'stale'}),/Xuất lại hồ sơ/);
 const changing=dashboardClient(b=>{b.setSourcedQuote('test-floor-quote',dashboardQuote({unitPrice:200000}));return [other];});quoteDashboardFloor(changing);assert.throws(()=>changing.customerPackageFiles({revision:changing.drawingRevision()}),/Xuất lại hồ sơ/);
});
test('sourced budget and finance terms survive the real save/load path with the same export identity',()=>{
 const B=dashboardClient();quoteDashboardFloor(B);const before=B.sourcedBudgetCsv();B.save();B.state=B.loadState();const after=B.sourcedBudgetCsv();assert.equal(after.csv,before.csv);assert.equal(after.priceKey,before.priceKey);assert.equal(B.projectDashboardData().sourceFunding.requiredLoan,null);
});
test('finance dashboard uses the canonical scenario and refuses a complete payment peak when fees are unknown',()=>{
 const B=dashboardClient(),t={principal:120000000,months:12,method:'annuity',graceMonths:0,ratePeriods:[{fromMonth:1,annualRatePct:12}],draws:[{month:1,amount:120000000}],fees:[],constructionPayments:[],sourceReference:'TEST-ONLY terms',confirmed:true};B.setFinanceScenario(t);const view=B.dashboardLoanView(),source=B.financeScenarioSummary();assert.equal(view.rows.length,12);assert.equal(view.peak,source.peakPayment);assert.equal(view.partial,false);let html=B.dashboardFinanceMetricsHtml(B.projectDashboardData(),view);assert.match(html,/Vay cần theo BOQ/);assert.match(html,/Chưa đủ dữ liệu/);assert.match(html,/120\.000\.000 đ/);assert.match(html,/chưa phải phê duyệt vay/);
 B.setFinanceScenario({...t,fees:null});const partial=B.dashboardLoanView();assert.equal(partial.peak,null);assert.equal(partial.partial,true);assert.match(B.dashboardFinanceMetricsHtml(B.projectDashboardData(),partial),/Chưa đủ phí/);
});
test('funding follows sourced BOQ and declared capital, including explicit zero, without substituting the planning budget',()=>{
 const B=dashboardClient();assert.equal(B.projectDashboardData().sourceFunding.ownCapital,null);Object.assign(B.state.project.finance,{cash:100000000,reserve:20000000});for(const k of ['cash','reserve'])B.recordProjectInput('finance.'+k,{confirmed:true,sourceReference:'TEST declared '+k});
 let d=B.projectDashboardData();assert.equal(d.sourceFunding.ownCapital,80000000);assert.equal(d.sourceFunding.requiredLoan,null);const base=d.source;B.commercialBoq=()=>({...base,completeTotal:200000000});d=B.projectDashboardData();assert.equal(d.sourceFunding.requiredLoan,120000000);assert.match(B.dashboardFinanceMetricsHtml(d,{peak:null}),/120\.000\.000 đ/);
 B.commercialBoq=()=>({...base,completeTotal:0});d=B.projectDashboardData();assert.equal(d.sourceFunding.requiredLoan,0);assert.match(B.dashboardFinanceMetricsHtml(d,{peak:null}),/Vay cần theo BOQ<\/span><b>0 đ/);assert.equal(d.e.total,1300000000);
});
test('existing bank trial remains available as principal and interest only; invalid explicit terms never fall back to it',()=>{
 const B=dashboardClient(),f=B.state.project.finance;f.scenario={};Object.assign(f,{introRate:10,postRate:12,loan:100000000,years:5});B.financeSummary=()=>({schedule:[{month:1,principal:100,interest:20,payment:120},{month:2,principal:100,interest:15,payment:115}],peak:999999});let view=B.dashboardLoanView();assert.equal(view.legacy,true);assert.equal(view.peak,120);assert.equal(view.rows.length,2);assert.match(B.dashboardFinanceMetricsHtml(B.projectDashboardData(),view),/Đỉnh gốc \+ lãi/);assert.match(B.dashboardFinanceMetricsHtml(B.projectDashboardData(),view),/chưa gồm phí và nợ/);
 B.financeSummary=()=>({schedule:[{month:1,principal:100.14,interest:20.47,payment:120.61},{month:2,principal:100.14,interest:15.23,payment:115.37}]});assert.equal(B.dashboardLoanView().peak,121);B.financeSummary=()=>({schedule:[{payment:NaN}]});assert.equal(B.dashboardLoanView().peak,null);
 f.scenario={sourceReference:'TEST incomplete canonical request',ratePeriods:[]};view=B.dashboardLoanView();assert.equal(view.legacy,false);assert.equal(view.peak,null);assert.equal(view.rows.length,0);
});

test('inspection cut removes an unsupported door lintel while the full-height opening keeps its measured head',()=>{
 const B=designClient(),door={kind:'door',height:2.1};
 assert.equal(B.lightPreviewWallBands(door,3.06,1.1).length,0);assert.equal(B.lightPreviewWallBands(door,3.06,1.4).length,0);
 const full=B.lightPreviewWallBands(door,3.06,3.06);assert.equal(full.length,1);assert.equal(full[0].bottom,2.1);assert.ok(Math.abs(full[0].height-.96)<1e-9);
});

test('window, sill and wall stop at the same cut and high windows retain only their solid lower wall',()=>{
 const B=designClient(),window={kind:'window',sill:.9,height:1.4},bands=B.lightPreviewWallBands(window,3.06,1.1);
 assert.equal(bands.length,2);assert.equal(bands[0].material,'wall');assert.equal(bands[0].height,.9);assert.equal(bands[1].material,'glass');assert.ok(Math.abs(bands[1].height-.2)<1e-9);
 for(const cut of [1.1,1.4,3.06])for(const b of B.lightPreviewWallBands(window,3.06,cut))assert.ok(b.bottom+b.height<=cut+1e-9);
 const high=B.lightPreviewWallBands({kind:'window',sill:1.8,height:.6},3.06,1.1);assert.equal(high.length,1);assert.equal(high[0].material,'wall');assert.equal(high[0].height,1.1);
});

test('light wall bands preserve actual slab level and never add a terrace guard or mutate geometry',()=>{
 const {B}=modernReference(),r=B.state.project.plan.rooms.find(r=>r.outdoorSpace?.kind==='terrace');B.state.ui.sceneFocus='room:'+r.id;const before=JSON.stringify(B.state.project);
 B.studioFloorLevel=()=>({base:7.3,slab:.27,clearHeight:3.06});const walls=B.scenePlanGeometry({rooms:[r],openings:B.state.project.plan.openings,wallContext:B.state.project.plan.rooms},r.floor).walls,clear=3.06;
 const count=walls.reduce((n,w)=>n+B.lightPreviewWallBands(w,clear,1.1).length,0),svg=B.lightPreviewSvg();assert.equal((svg.match(/data-light-kind="wall"/g)||[]).length,count*5);assert.ok(walls.some(w=>w.kind==='door'));assert.ok(walls.every(w=>!B.outdoorOpenEdge(r,w.horizontal,w.axis,w.a,w.b)));assert.equal(JSON.stringify(B.state.project),before);
 const w=walls.find(w=>w.kind==='wall'),t=w.thickness,x=w.horizontal?w.a:w.axis-t/2,y=w.horizontal?w.axis-t/2:w.a,width=w.horizontal?w.b-w.a:t,depth=w.horizontal?t:w.b-w.a,a=B.lightPreviewAngle*Math.PI/180;
 const project=(x,y)=>{x-=B.state.project.site.width/2;y-=B.state.project.site.depth/2;return (x*Math.cos(a)-y*Math.sin(a)).toFixed(4)+','+((x*Math.sin(a)+y*Math.cos(a))*.52-(7.3+.27+1.1)*.85).toFixed(4);};
 const top=[[x,y],[x+width,y],[x+width,y+depth],[x,y+depth]].map(p=>project(...p)).join(' ');assert.ok(svg.includes('points="'+top+'"'),'wall cut starts at the actual slab top');
});

function lightExportClient({decode='load',encode='ready',context2d=true}={}){
 const B=designClient(),p=B.state.project;p.plan={rooms:[{id:'own-room',floor:0,type:'custom',name:'Phòng tự vẽ',x:0,y:0,w:6,h:6}],openings:[],furniture:[],fixtures:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};B.state.ui.sceneFocus='room:own-room';
 const saved={downloads:[],urls:[],revoked:[],buttons:[{disabled:false},{disabled:true}],status:[],caption:[],image:null,timer:null,draws:0,clears:0},host={};let active=true;
 const stage={querySelector:()=>active?host:null};B.$=s=>s==='#studio3dStage'?stage:null;B.archRenderStatus=s=>saved.status.push(s);B.download=(...args)=>saved.downloads.push(args);
 const canvas={width:0,height:0,getContext:()=>context2d?{fillRect(){},drawImage(){saved.draws++;},fillText(s){saved.caption.push(s);}}:null,toBlob(done,type){assert.equal(type,'image/png');saved.encode=()=>done(encode==='empty'?null:new Blob(['PNG TEST DOUBLE'],{type}));if(encode!=='defer')saved.encode();}};
 const image={set src(value){if(!value)return;saved.image=this;if(decode==='load')queueMicrotask(()=>this.onload?.());else if(decode==='error')queueMicrotask(()=>this.onerror?.());}};
 const ctx={BMH:B,Blob,URL:{createObjectURL(blob){saved.urls.push(blob);return 'blob:local-test';},revokeObjectURL(url){saved.revoked.push(url);}},document:{createElement:tag=>tag==='canvas'?canvas:image,querySelectorAll:()=>saved.buttons},performance:{now:()=>123},setTimeout(fn){saved.timer=fn;return 1;},clearTimeout(){saved.clears++;},console:{warn(){}}};
 const source=fs.readFileSync('src/78_design_workflow.js','utf8');vm.runInNewContext(source.slice(source.indexOf('BMH.lightPreviewFrame='),source.indexOf('const workflowMount=')),ctx);
 return {B,saved,canvas,ctx,hide:()=>active=false};
}

test('fallback PNG is bounded, revision-labelled and design-only; concurrent clicks do not duplicate downloads',async()=>{
 const {B,saved,canvas}=lightExportClient({decode:'defer'}),before=JSON.stringify(B.state.project),revision=B.drawingRevision();B.state.ui.sharpResolution=2560;
 const pending=B.captureLightPreview();assert.equal(B.lightExportBusy,true);assert.ok(saved.buttons.every(b=>b.disabled));assert.equal(await B.captureLightPreview(),false);saved.image.onload();assert.equal(await pending,true);
 assert.equal(saved.downloads.length,1);assert.match(saved.downloads[0][0],/^BMH-khoi-theo-so-do-room-own-room-/);assert.ok(saved.downloads[0][0].includes(revision));assert.equal(saved.downloads[0][2],'image/png');
 assert.ok(B.lastLightExport.width<=2560&&B.lastLightExport.height<=2560);assert.ok(B.lastLightExport.width*B.lastLightExport.height<=5000000);assert.equal(B.lastLightExport.mode,'lightweight');assert.equal(B.lastLightExport.designRevision,revision);assert.ok(saved.caption[0].includes('Khối theo số đo'));
 const svg=await saved.urls[0].text();assert.match(svg,/xmlns="http:\/\/www.w3.org\/2000\/svg"/);assert.ok(svg.includes('data-design-revision="'+revision+'"'));assert.equal(JSON.stringify(B.state.project),before);
 assert.deepEqual(saved.revoked,['blob:local-test']);assert.equal(canvas.width,1);assert.equal(canvas.height,1);assert.equal(B.lightExportBusy,false);assert.deepEqual(saved.buttons.map(b=>b.disabled),[false,true]);assert.equal(B.archRenderModules,undefined);
});

test('fallback export cancels on project, revision, room, angle, zoom, retired host or upgraded renderer',async()=>{
 for(const change of [c=>c.B.state.project=structuredClone(c.B.state.project),c=>c.B.state.project.plan.rooms[0].w=6.1,c=>c.B.state.ui.sceneFocus='all',c=>c.B.lightPreviewAngle+=20,c=>c.B.lightPreviewZoom*=1.25,c=>c.hide(),c=>c.B.studio3d={renderer:{}}]){
  const c=lightExportClient({decode:'defer'}),pending=c.B.captureLightPreview();change(c);c.saved.image.onload();assert.equal(await pending,false);assert.equal(c.saved.downloads.length,0);assert.equal(c.saved.revoked.length,1);assert.equal(c.B.lightExportBusy,false);
 }
});

test('fallback encoding rejects later edits and every decode/canvas/timeout failure restores controls and releases resources',async()=>{
 const c=lightExportClient({encode:'defer'}),pending=c.B.captureLightPreview();await Promise.resolve();await Promise.resolve();assert.equal(typeof c.saved.encode,'function');c.B.state.project.plan.rooms[0].h=6.2;c.saved.encode();assert.equal(await pending,false);assert.equal(c.saved.downloads.length,0);assert.equal(c.saved.revoked.length,1);
 for(const options of [{decode:'error'},{encode:'empty'},{context2d:false},{decode:'defer'}]){
  const f=lightExportClient(options),work=f.B.captureLightPreview();if(options.decode==='defer')f.saved.timer();assert.equal(await work,false);assert.equal(f.saved.downloads.length,0);assert.equal(f.B.lightExportBusy,false);assert.deepEqual(f.saved.buttons.map(b=>b.disabled),[false,true]);assert.equal(f.saved.revoked.length,f.saved.urls.length);
 }
 const empty=lightExportClient();empty.B.state.project.plan.rooms=[];assert.equal(await empty.B.captureLightPreview(),false);assert.equal(empty.saved.urls.length,0);
});

test('existing quick and sharp buttons route only unavailable WebGL to the labelled fallback',async()=>{
 const {B,ctx,saved}=lightExportClient(),source=fs.readFileSync('src/46_architectural_render.js','utf8');
 vm.runInNewContext(source.slice(source.indexOf('BMH.captureStudioPreview='),source.indexOf('BMH.sharpStudioFrame='))+source.slice(source.indexOf('BMH.captureSharpStudioPreview='),source.indexOf('BMH.captureArchitecturalRender=')),ctx);
 let fallbacks=0;B.captureLightPreview=async()=>{fallbacks++;return true;};assert.equal(await B.captureStudioPreview(),true);assert.equal(await B.captureSharpStudioPreview(),true);assert.equal(fallbacks,2);
 let rendered=0;B.studio3d={scene:{},camera:{},renderer:{render(){rendered++;},domElement:{width:800,height:600,toBlob:done=>done(new Blob(['TEST'],{type:'image/png'}))}}};
 assert.equal(await B.captureStudioPreview(),true);assert.equal(fallbacks,2);assert.equal(rendered,1);assert.match(saved.downloads[0][0],/-xem-nhanh.png$/);
 B.sharpStudioFrame=async()=>({blob:new Blob(['TEST'],{type:'image/png'}),width:1280,height:720,designRevision:B.drawingRevision(),view:'all',cameraKey:'native'});assert.equal(await B.captureSharpStudioPreview(),true);assert.equal(fallbacks,2);assert.match(saved.downloads[1][0],/^BMH-anh-net-nhanh-/);
});

test('light model uses the saved 37-degree footprint and mounting height rather than the collision box',()=>{
 const B=designClient(),p=B.state.project;
 p.plan={rooms:[{id:'custom',floor:0,type:'custom',name:'Tự bố trí',x:0,y:0,w:6,h:6}],openings:[],fixtures:[],outdoor:[],furniture:[{id:'angled',roomId:'custom',floor:0,modelId:'kitchenWallCabinet',origin:'customer-added',placementStatus:'present',pose:{x:2,y:3,z:1.6,rotationDeg:37},size:{width:.9,depth:.34,height:.72},materialBindings:[{role:'accent',visualProfileId:'dark-walnut'}]}],lockedRoomIds:[],lockedFloors:[]};
 B.state.ui.sceneFocus='room:custom';B.lightPreviewAngle=35;B.studioFloorLevel=()=>({base:4.1,slab:.23,clearHeight:3});
 const before=JSON.stringify(p),svg=B.lightPreviewSvg(),angle=37*Math.PI/180,view=35*Math.PI/180;
 const projected=(x,y,z)=>{x-=p.site.width/2;y-=p.site.depth/2;return (x*Math.cos(view)-y*Math.sin(view)).toFixed(4)+','+((x*Math.sin(view)+y*Math.cos(view))*.52-z*.85).toFixed(4);};
 const top=[[-.45,-.17],[.45,-.17],[.45,.17],[-.45,.17]].map(([x,y])=>projected(2+x*Math.cos(angle)-y*Math.sin(angle),3+x*Math.sin(angle)+y*Math.cos(angle),4.1+.23+1.6+.72)).join(' ');
 const faces=[...svg.matchAll(/<polygon[^>]*data-light-furniture-id="angled"[^>]*points="([^"]+)"[^>]*fill="([^"]+)"/g)];
 assert.equal(faces.length,5);assert.ok(faces.some(m=>m[1]===top),'top follows measured rotated corners and level/slab/mounting height');
 assert.ok(faces.every(m=>m[2]===B.VISUAL_MATERIALS.find(p=>p.id==='dark-walnut').color));assert.equal(JSON.stringify(p),before);
 p.plan.furniture[0].placementStatus='removed';assert.doesNotMatch(B.lightPreviewSvg(),/data-light-furniture-id="angled"/);
});

test('light model retains measured terrace slab, open edges and drawing identity without inventing furniture',()=>{
 const {B}=modernReference(),r=B.state.project.plan.rooms.find(r=>r.outdoorSpace?.kind==='terrace');B.state.ui.sceneFocus='room:'+r.id;
 const before=JSON.stringify(B.state.project),svg=B.lightPreviewSvg();
 assert.equal((svg.match(/data-light-kind="floor-slab"/g)||[]).length,5);
 assert.doesNotMatch(svg,/data-light-furniture-id=/);assert.ok(svg.includes('data-design-revision="'+B.drawingRevision()+'"'));
 const g=B.scenePlanGeometry({rooms:[r],openings:B.state.project.plan.openings,wallContext:B.state.project.plan.rooms},r.floor);
 assert.ok(g.walls.length);assert.ok(g.walls.every(w=>!B.outdoorOpenEdge(r,w.horizontal,w.axis,w.a,w.b)));
 assert.equal(JSON.stringify(B.state.project),before);
});

test('terrace review exposes exact dimensions, real access and missing technical inputs without writing the design',()=>{
 const {B}=modernReference(),r=B.state.project.plan.rooms.find(r=>r.outdoorSpace?.kind==='terrace');B.state.ui.planner.selected=r.id;
 const before=JSON.stringify(B.state.project),history=B.planHistory.undo.length,html=B.roomDepthEditorHtml();
 for(const value of ['3.580 mm','1.890 mm','900 mm × 2.100 mm','ngưỡng 0 mm','Bắc, Tây','Không có mái che','Chưa có tài liệu','lan can','thoát nước','chống thấm'])assert.ok(html.includes(value),value);
 assert.ok(html.includes(r.outdoorSpace.sourceReference));assert.equal(JSON.stringify(B.state.project),before);assert.equal(B.planHistory.undo.length,history);
 B.state.project.plan.openings=B.state.project.plan.openings.filter(o=>!o.id.endsWith('-access'));assert.match(B.roomDepthEditorHtml(),/Chưa có cửa tiếp cận/);
 r.outdoorSpace.sourceReference='<img src=x onerror=alert(1)>';assert.ok(B.roomDepthEditorHtml().includes('&lt;img'));assert.doesNotMatch(B.roomDepthEditorHtml(),/<img src=x/);
});

function personalPlanClient(){
 const B=designClient({nativeParcel:true}),p=B.state.project;
 // This fixture uses the real parcel/proposal/editor; omit only climate scoring.
 B.planMetrics=plan=>({area:plan.rooms.reduce((n,r)=>n+r.w*r.h,0)});
 Object.assign(p.site,{width:5,depth:20,floors:2,setbackFront:2,setbackRear:1,setbackSide:.2,targetCoverage:.85,useParcelGeometry:false});
 p.household.relatives=[];p.briefIdea='';p.style='Hiện đại';
 p.designStudio={program:{mode:'custom',floors:[{bedrooms:0,bathrooms:0,living:true,kitchen:true,garage:true},{bedrooms:2,bathrooms:1}]}};
 return B;
}
test('spatial suggestions validate their own openings after a customer changes the existing plan',()=>{
 const B=personalPlanClient(),p=B.state.project;
 assert.equal(B.generateDesignKits(),true);assert.equal(B.applyDesignKit('B'),true);
 const room=p.plan.rooms.find(r=>r.type==='living'),old=room.id;room.id='customer-living';
 for(const o of p.plan.openings)if(o.roomId===old)o.roomId=room.id;
 const before=JSON.stringify(p.plan),history=B.planHistory.undo.length;
 assert.equal(B.architectureProposal().ok,true);
 assert.equal(B.generateDesignKits(),true);
 assert.equal(JSON.stringify(p.plan),before);assert.equal(B.planHistory.undo.length,history);
 for(const k of B.designState().kits)assert.equal(B.withPlan(k.plan,()=>B.layoutValid(k.plan.rooms)),true);
});
test('an unsupported auto layout retains exact requests and offers personal drawing with its specific reason',()=>{
 const B=personalPlanClient(),p=B.state.project;p.site.depth=12;
 const before=JSON.stringify(p.plan),program=JSON.stringify(B.requestedFloorProgram());
 assert.equal(B.createProgramDesign(false),false);
 assert.equal(JSON.stringify(p.plan),before);assert.equal(JSON.stringify(B.requestedFloorProgram()),program);
 assert.match(B.designState().programNotice,/chiều sâu/);
 assert.equal(B.openPersonalPlanner(),true);assert.equal(B.state.ui.step,4);
 assert.equal(JSON.stringify(p.plan),before);
});
test('deleting the last room opens drawing tools; empty land survives reload and precise rooms share undo/redo',()=>{
 const B=personalPlanClient(),p=B.state.project;
 p.plan.rooms=[{id:'only',floor:0,type:'living',name:'Khách',x:.3,y:2.1,w:3,h:4}];
 assert.equal(B.removePlanItem('room','only'),true);assert.equal(p.plan.rooms.length,0);
 assert.equal(B.state.ui.planner.directTool,'room');
 B.state=B.mergeState(B.defaultState(),JSON.parse(JSON.stringify(B.state)));B.normalizeState();
 assert.equal(B.state.project.plan.rooms.length,0);const history=B.planHistory.undo.length;
 assert.equal(B.openPersonalPlanner(),true);assert.equal(B.state.ui.designProposalsOpen,false);
 assert.equal(B.planHistory.undo.length,history);assert.equal(B.state.project.plan.rooms.length,0);
 assert.match(B.directEditHtml(),/data-direct-room-form/);
 const r=B.addDirectRoom({x:.317,y:2.113},{x:3.454,y:5.956},'living',{snap:false,dimensions:{width:3.137,depth:3.843}});
 assert.ok(r,B.state.ui.planner.directNotice);assert.equal(r.x,.317);assert.equal(r.w,3.137);assert.equal(r.h,3.843);
 const exact=JSON.stringify(B.state.project.plan);B.undoPlan();assert.equal(B.state.project.plan.rooms.length,0);
 B.redoPlan();assert.equal(JSON.stringify(B.state.project.plan),exact);
 B.state=B.mergeState(B.defaultState(),JSON.parse(JSON.stringify(B.state)));B.normalizeState();
 assert.equal(B.state.project.plan.rooms[0].id,r.id);assert.equal(B.state.project.plan.rooms[0].x,.317);
 const saved=JSON.stringify(B.state.project.plan);assert.equal(B.addDirectRoom({x:.3,y:2.2},{x:2,y:4},'bed',{snap:false}),false);
 assert.equal(JSON.stringify(B.state.project.plan),saved);
 assert.equal(B.addDirectRoom({x:0,y:0},{x:2,y:2},'bed',{snap:false}),false);
});
test('personal drawing preserves existing rooms, selected floor, choices and locks',()=>{
 const B=personalPlanClient(),p=B.state.project;
 p.plan.rooms=[{id:'kept',floor:1,type:'bed',name:'Giữ nguyên',x:.3,y:2.1,w:3,h:4}];
 p.plan.lockedFloors=[1];B.state.ui.planner.floor=1;
 const before=JSON.stringify(p),history=B.planHistory.undo.length;
 assert.equal(B.openPersonalPlanner(),true);assert.equal(B.state.ui.planner.floor,1);
 assert.equal(JSON.stringify(p.plan.rooms),JSON.stringify(JSON.parse(before).plan.rooms));
 assert.equal(JSON.stringify(p.materials),JSON.stringify(JSON.parse(before).materials));
 assert.equal(JSON.stringify(p.designStudio.program),JSON.stringify(JSON.parse(before).designStudio.program));
 assert.equal(B.planHistory.undo.length,history);
 assert.equal(B.addDirectRoom({x:.3,y:7},{x:3,y:10},'living',{snap:false}),false);
 assert.match(B.state.ui.planner.directNotice,/khóa/);
});
const source=fs.readFileSync('src/104_style_reference.js','utf8');
function client(){const B=designClient();B.STEPS=Array.from({length:10},(_,i)=>[i,'step-'+i]);B.V6_STEPS=Array.from({length:10},(_,i)=>['step-'+i,'description']);B.GUIDED_FUNCTIONS=['Ý tưởng','Khu đất','Gia đình','Bản vẽ','Vật liệu','3D','Dự toán','Ngân hàng','Thi công','Bàn giao'];B.restoreProjectRuntime=()=>{};B.screen10=()=>'';B.screen9=()=>'';const ctx={BMH:B,URLSearchParams,location:{search:''},structuredClone,Date,document:{addEventListener(){}},console};vm.runInNewContext(fs.readFileSync('src/91_customer_cloud.js','utf8').split('/* Optional customer account.')[0],ctx);vm.runInNewContext(source.slice(source.indexOf('/* Team B / C03')),ctx);return B;}
test('ten functions retain materials/banking and design handover precedes supervision',()=>{const B=client();assert.equal(B.workflowRoutes.handover,9);assert.equal(B.workflowRoutes.construction,10);assert.equal(B.GUIDED_FUNCTIONS[4],'Vật liệu');assert.equal(B.GUIDED_FUNCTIONS[7],'Ngân hàng');assert.equal(B.GUIDED_FUNCTIONS[8],'Bàn giao');assert.equal(B.GUIDED_FUNCTIONS[9],'Thi công');assert.match(B.SCREENS[8](),/BÀN GIAO THIẾT KẾ/);assert.match(B.SCREENS[9](),/THI CÔNG & GIÁM SÁT/);});
test('legacy route migration is once-only and survives the known dynamic state merge',()=>{const B=client(),s=B.defaultState();s.ui.step=10;B.migrateWorkflowRoute(s);assert.equal(s.ui.step,9);B.migrateWorkflowRoute(s);assert.equal(s.ui.step,9);const merged=B.mergeState(B.defaultState(),s);B.migrateWorkflowRoute(merged);assert.equal(merged.ui.step,9);const old=B.defaultState();old.ui.step=9;B.migrateWorkflowRoute(old);assert.equal(old.ui.step,10);});
test('evidence report links measured location and revision, preserves bytes metadata and remains uncertified through reload',()=>{const B=client();B.state.project.plan.rooms=[{id:'room',floor:1,name:'Phòng ngủ',type:'bed',x:0,y:0,w:4,h:4}];B.state.project.dossier.evidence=[{id:'file-1',name:'ảnh.jpg',stage:'structure',type:'image/jpeg',size:1234,cloudKey:'keep-key'}];const input={floor:1,roomId:'room',reportType:'defect',reportStatus:'open',responsible:'Người kiểm tra',note:'Nứt cần kiểm tra',observedAt:'2026-10-09'};assert.equal(B.annotateProjectEvidence('file-1',input),true);const row=B.state.project.dossier.evidence[0];assert.equal(row.cloudKey,'keep-key');assert.equal(row.size,1234);assert.equal(row.report.engineeringAccepted,false);assert.equal(row.report.designRevision,B.drawingRevision());B.state=B.mergeState(B.defaultState(),JSON.parse(JSON.stringify(B.state)));B.normalizeState();assert.equal(B.supervisionReports().rows[0].report.roomId,'room');assert.equal(B.supervisionReports().certified,false);assert.match(B.supervisionWorkspaceHtml(),/biên bản nghiệm thu kỹ thuật/);});
test('invalid location/status cannot change report and user resolution never certifies',()=>{const B=client();B.state.project.dossier.evidence=[{id:'f',name:'a.pdf'}];const input={floor:'',roomId:'',reportType:'inspection-note',reportStatus:'reported-resolved'};assert.equal(B.annotateProjectEvidence('f',{...input,reportStatus:'approved'}),false);assert.equal(B.annotateProjectEvidence('f',{...input,roomId:'foreign-room',floor:0}),false);assert.equal(B.annotateProjectEvidence('f',input),true);assert.equal(B.state.project.dossier.evidence[0].report.engineeringAccepted,false);assert.equal(B.state.project.dossier.evidence[0].report.source,'user-report');});

test('normalization retains report and private metadata only, rejects impossible dates and cannot import approval',()=>{const B=client(),sha='a'.repeat(64);B.state.project.dossier.evidence=[{id:'file',name:'x.pdf',type:'application/pdf',cloudKey:'12345678-1234-1234-1234-123456789012/12345678-1234-1234-1234-123456789013/file-'+sha+'.pdf',cloudSha256:sha,cloudProjectId:'12345678-1234-1234-1234-123456789013',uploadedAt:'2026-10-09T07:00:00Z',privateToken:'should-drop',report:{reportType:'defect',reportStatus:'open',observedAt:'2026-02-31',engineeringAccepted:true,note:'Keep'}}];B.normalizeState();const row=B.state.project.dossier.evidence[0];assert.equal(row.report.note,'Keep');assert.equal(row.report.engineeringAccepted,false);assert.equal(row.report.observedAt,'');assert.equal(row.cloudSha256,sha);assert.equal(row.privateToken,undefined);assert.equal(row.uploadedAt,'2026-10-09T07:00:00Z');});
