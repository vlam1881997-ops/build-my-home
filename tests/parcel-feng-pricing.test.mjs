import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import configHandler from '../api/config.mjs';
import {geminiGenerate} from '../server/_gemini.mjs';

const response=()=>({status(code){this.code=code;return this;},setHeader(){return this;},end(body){this.body=JSON.parse(body);}});

test('public AI capability endpoint reports configured provider without leaking a key',()=>{
  const old=process.env.GEMINI_API_KEY;
  try{
    process.env.GEMINI_API_KEY='secret-test-key';
    const res=response();configHandler({method:'GET'},res);
    assert.equal(res.code,200);
    assert.equal(res.body.aiConfigured,true);
    assert.equal(res.body.geminiConfigured,true);
    assert.equal(res.body.aiProvider,'Gemini');
    assert.ok(!JSON.stringify(res.body).includes('secret-test-key'));
  }finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
});

test('Gemini permission failures stop before retrying other models',async()=>{
  const oldKey=process.env.GEMINI_API_KEY,oldFetch=globalThis.fetch;
  let calls=0;
  try{
    process.env.GEMINI_API_KEY='test-only-key';
    globalThis.fetch=async()=>{calls++;return {ok:false,status:403,text:async()=>JSON.stringify({error:{message:'Grounding is not available for this project'}})};};
    await assert.rejects(geminiGenerate({parts:[{text:'Research'}],tools:[{type:'google_search'}]}),e=>e.statusCode===403);
    assert.equal(calls,1);
  }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});

test('capability flags do not advertise undeployed account or payment routes',()=>{
  const keys=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','SUPABASE_SECRET_KEY','SUPABASE_SERVICE_ROLE_KEY','PAYOS_CLIENT_ID','PAYOS_API_KEY','PAYOS_CHECKSUM_KEY'];
  const old=Object.fromEntries(keys.map(k=>[k,process.env[k]]));
  try{
    Object.assign(process.env,{SUPABASE_URL:'https://example.supabase.co',SUPABASE_PUBLISHABLE_KEY:'test-publishable',PAYOS_CLIENT_ID:'id',PAYOS_API_KEY:'test-api',PAYOS_CHECKSUM_KEY:'test-checksum'});
    delete process.env.SUPABASE_SECRET_KEY;delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    const res=response();configHandler({method:'GET'},res);
    assert.equal(res.body.cloudConfigured,false);
    assert.equal(res.body.paymentConfigured,false);
  }finally{for(const k of keys)if(old[k]===undefined)delete process.env[k];else process.env[k]=old[k];}
});

test('family identities change by birth year and gender and remain unknown without gender',()=>{
  const BMH={clamp:(n,a,b)=>Math.max(a,Math.min(b,n))};
  vm.runInNewContext(fs.readFileSync(new URL('../src/20_calc.js',import.meta.url),'utf8'),{BMH,Date,Math,Number,String,Intl});
  const owner=BMH.fengIdentity(1988,'Nam'),partner=BMH.fengIdentity(1990,'Nữ');
  assert.equal(owner.canChi,'Mậu Thìn');
  assert.equal(owner.kua,2);
  assert.equal(owner.element,'Thổ');
  assert.equal(partner.canChi,'Canh Ngọ');
  assert.equal(partner.kua,6);
  assert.equal(partner.element,'Kim');
  assert.notEqual(BMH.fengIdentity(1990,'Nam').group,partner.group);
  assert.equal(BMH.fengIdentity(2012,''),null);
});

test('supplier quote import rejects missing source/date instead of inventing today',async()=>{
  const state={project:{site:{province:'Hà Nội'},dataEngine:{cost:{shellPerM2:3600000},quote:{},materialOverrides:{},status:{}}}};
  const BMH={state,dataEngineState:()=>state.project.dataEngine,save(){},render(){},toast(){}};
  vm.runInNewContext(fs.readFileSync(new URL('../src/15_data_engine.js',import.meta.url),'utf8'),{BMH,Date,Math,Number,String,Intl});
  const file={name:'gia.csv',size:100,text:async()=> 'key,value,unit,source,date\nshellPerM2,3800000,m2,,\n'};
  await assert.rejects(BMH.importPriceQuote(file),/tên nhà cung cấp và ngày/);
  assert.equal(state.project.dataEngine.cost.shellPerM2,3600000);
  assert.equal(state.project.dataEngine.quote.date,undefined);
});

test('a dated supplier quote must contain a usable price and keeps provenance per cost item',async()=>{
  const state={project:{site:{province:'Hà Nội'},dataEngine:{cost:{shellPerM2:3600000,finishPerM2:2350000},quote:{},costSources:{},materialOverrides:{},status:{}}}};
  const BMH={state,MATERIALS:{floor:[{id:'tile-a'}]},dataEngineState:()=>state.project.dataEngine,regionProfile:()=>({labor:[500000,500000]}),rangeAverage:()=>500000,clamp:(n,min,max)=>Math.min(max,Math.max(min,n)),save(){},render(){},toast(){}};
  vm.runInNewContext(fs.readFileSync(new URL('../src/15_data_engine.js',import.meta.url),'utf8'),{BMH,Date,Math,Number,String,Intl,Set});
  const file=(name,body)=>({name,size:body.length,text:async()=>body});
  await assert.rejects(BMH.importPriceQuote(file('empty.json',JSON.stringify({source:'A',date:'2026-09-25',materials:{}}))),/không có đơn giá hợp lệ/);
  await assert.rejects(BMH.importPriceQuote(file('bad-date.json',JSON.stringify({source:'A',date:'2025-02-31',shellPerM2:3800000}))),/ngày theo YYYY-MM-DD/);
  await assert.rejects(BMH.importPriceQuote(file('unknown.json',JSON.stringify({source:'A',date:'2026-09-25',materials:{unlisted:{value:200000}}}))),/chưa có trong showroom/);
  assert.equal(state.project.dataEngine.cost.shellPerM2,3600000);
  await BMH.importPriceQuote(file('shell.csv','key,value,unit,source,date\nshellPerM2,3.800.000,m2,Nhà cung cấp A,2026-09-25\n'));
  assert.equal(state.project.dataEngine.cost.shellPerM2,3800000);
  assert.equal(state.project.dataEngine.costSources.shellPerM2.name,'Nhà cung cấp A');
  assert.equal(BMH.dataCostBasis().shellPerM2,3800000);
  await BMH.importPriceQuote(file('tile.json',JSON.stringify({source:'Nhà cung cấp B',date:'2026-09-26',materials:{'tile-a':{value:180000,unit:'m2'}}})));
  assert.equal(state.project.dataEngine.costSources.shellPerM2.date,'2026-09-25');
  assert.equal(state.project.dataEngine.materialOverrides['tile-a'].source,'Nhà cung cấp B');
});

test('a dated m² quote flows through material choice, estimate, BOQ, funding and handover',async()=>{
  const rooms=[0,1].flatMap(floor=>[{id:`a${floor}`,floor,x:0,y:0,w:5,h:10,type:'living'},{id:`b${floor}`,floor,x:5,y:0,w:5,h:10,type:'bed'}]);
  const BMH={state:{project:{site:{width:10,depth:20,floors:2,lat:10,lng:106,road:4,province:'TP. Hồ Chí Minh',geoSource:'Ghim bản đồ'},plan:{rooms,openings:[]},materials:{tier:'standard',climatePackage:'basic',choices:{floor:'viglacera',paint:'dulux',door:'xingfa'}},finance:{cash:800000000,reserve:100000000,loan:0,targetBudget:0,income:25000000,living:8000000,existingDebt:0,years:15,promoMonths:12,introRate:7,postRate:11},dossier:{progress:0,actualCosts:{},evidence:[]},checklist:{},dataEngine:{cost:{shellPerM2:3600000,finishPerM2:2350000,prepPerM2:280000,marketAdjustmentPct:0},costSources:{},materialOverrides:{},quote:{},status:{}}}},
    MATERIALS:{floor:[{id:'viglacera',name:'Gạch',premium:18000000}],paint:[{id:'dulux',name:'Sơn',premium:0}],door:[{id:'xingfa',name:'Cửa',premium:0}]},
    clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),buildableEnvelope:()=>({gfa:100,targetPlate:50}),siteAdaptation:()=>({roadPct:.05,climatePct:0}),save(){},render(){},toast(){},esc:x=>String(x),openingSchedule:()=>[],areaSchedule:()=>[],uid:()=> 'test',dateLabel:x=>x,plannerIssues:()=>[]};
  const ctx={BMH,Date,Math,Number,String,Intl,Set,Map,structuredClone,Blob};
  for(const name of ['15_data_engine.js','20_calc.js','35_dossier.js'])vm.runInNewContext(fs.readFileSync(new URL('../src/'+name,import.meta.url),'utf8'),ctx);
  BMH.performancePlan=()=>({upgradeCost:0});BMH.dataCostBasis=()=>({shellPerM2:3600000,finishPerM2:2350000,prepPerM2:280000,sourceLabel:'Baseline',sourceDate:'',reference:'Planning'});
  const first=BMH.estimate();assert.equal(first.areaSource,'plan');assert.equal(first.area,200);
  assert.equal(BMH.boqSchedule().find(x=>x.code==='C03').amount,Math.round(first.finishAllowance*.18)+18000000);
  const file={name:'bao-gia.json',size:180,text:async()=>JSON.stringify({source:'Đại lý A',date:'2026-09-26',materials:{viglacera:{value:600000,unit:'m²'}}})};
  await BMH.importPriceQuote(file);
  const priced=BMH.estimate(),q=priced.materialQuotes[0];
  assert.equal(q.quantity,184);assert.equal(q.amount,110400000);
  assert.equal(q.allowance,Math.round(first.finishAllowance*.18)+18000000);
  assert.equal(priced.finish-first.finish,q.delta);
  assert.equal(priced.gap,first.gap-(priced.total-first.total));
  const boq=BMH.boqSchedule();assert.equal(boq.find(x=>x.code==='C03').amount,q.amount);
  assert.equal(boq.reduce((sum,row)=>sum+row.amount,0),priced.total);
  const snapshot=BMH.createDossierSnapshot();assert.equal(snapshot.pricing.materialQuotes[0].source,'Đại lý A');
  assert.equal(snapshot.summary.estimate,priced.total);
  BMH.state.project.plan.rooms[1].x=0; // overlap must not become a confirmed 200 m² plan
  assert.equal(BMH.estimate().areaSource,'provisional');
  assert.ok(BMH.planArea()<200);
});

test('a local project backup restores its plan and prices without importing payment rights or linking a cloud project',async()=>{
  const initial={access:{paid:false,source:'none'},project:{site:{width:5,depth:20,floors:2},plan:{rooms:[]},finance:{},materials:{}}};
  const BMH={state:initial,cloud:{activeProjectId:'old-id',syncStatus:'synced'},CLOUD_ACTIVE_KEY:'active',defaultState:()=>structuredClone(initial),mergeState:(_base,value)=>structuredClone(value),normalizeState(){},save(){this.saved=true;},render(){this.rendered=true;},toast(){},clamp:(n,a,b)=>Math.max(a,Math.min(b,n))};
  vm.runInNewContext(fs.readFileSync(new URL('../src/40_exports.js',import.meta.url),'utf8'),{BMH,Number,String,JSON,Math,Date,Blob,Uint8Array,TextEncoder,structuredClone,clearTimeout,localStorage:{removeItem(){}}});
  const backup={access:{paid:true,source:'server-verified'},ui:{step:7},project:{site:{width:7,depth:20,floors:2},plan:{rooms:[{id:'room1',floor:0,x:0,y:0,w:4,h:5}]},finance:{cash:900000000},materials:{choices:{floor:'viglacera'}},dataEngine:{materialOverrides:{viglacera:{value:600000,unit:'m²',source:'Đại lý A',date:'2026-09-26'}}}}};
  const file={size:500,text:async()=>JSON.stringify(backup)};
  await assert.rejects(BMH.importProjectJson({size:500,text:async()=>'{oops'}),/JSON/);
  assert.equal(BMH.state,initial);
  await BMH.importProjectJson(file);
  assert.equal(BMH.state.project.site.width,7);
  assert.equal(BMH.state.project.dataEngine.materialOverrides.viglacera.value,600000);
  assert.equal(BMH.state.access.paid,false);
  assert.equal(BMH.cloud.activeProjectId,'');
  assert.equal(BMH.saved&&BMH.rendered,true);
});

test('GeoJSON parser accepts WGS84 polygon but rejects projected coordinates',async()=>{
  const source=fs.readFileSync(new URL('../src/60_app.js',import.meta.url),'utf8');
  const fragment=source.slice(source.indexOf('BMH.importParcelGeoJSON ='),source.indexOf('BMH.applyCoordinates ='));
  const state={project:{site:{lotMode:'rect'}},ui:{location:{drawingLot:false}}};
  const BMH={state,polygonAreaMeters:()=>54,polygonIsSimple:()=>true,applyCoordinates(lat,lng){state.project.site.lat=lat;state.project.site.lng=lng;},toast(){}};
  vm.runInNewContext(fragment,{BMH,Number,Array,JSON,Error,Math});
  const file=ring=>({size:300,text:async()=>JSON.stringify({type:'Polygon',coordinates:[ring]})});
  await assert.rejects(BMH.importParcelGeoJSON(file([[600000,1100000],[600050,1100000],[600050,1100050],[600000,1100000]])),/WGS84/);
  await BMH.importParcelGeoJSON(file([[106.7,10.8],[106.7001,10.8],[106.7001,10.8001],[106.7,10.8]]));
  assert.equal(state.project.site.lotPoints.length,3);
  assert.equal(state.project.site.lotSource,'geojson-user');
});

test('crossing parcel edges are rejected before a drawn or imported area is trusted',()=>{
  const source=fs.readFileSync(new URL('../src/00_boot.js',import.meta.url),'utf8');
  const fragment=source.slice(source.indexOf('BMH.polygonIsSimple ='),source.indexOf('BMH.siteParcelStats ='));
  const BMH={localMeters:p=>({x:p.lng,y:p.lat})};
  vm.runInNewContext(fragment,{BMH,Math,Number,Array});
  assert.equal(BMH.polygonIsSimple([{lat:0,lng:0},{lat:0,lng:3},{lat:3,lng:3},{lat:3,lng:0}]),true);
  assert.equal(BMH.polygonIsSimple([{lat:0,lng:0},{lat:0,lng:3},{lat:3,lng:0},{lat:3,lng:3},{lat:1,lng:1}]),false);
});

test('moving a shared wall cannot shift a locked neighboring room',()=>{
  const source=fs.readFileSync(new URL('../src/30_planner.js',import.meta.url),'utf8');
  const fragment=source.slice(source.indexOf('BMH.edgeMoveCandidate ='),source.indexOf('BMH.svgPoint ='));
  const locked=new Set(['b']);
  const BMH={sharedWallNeighbors:(rooms)=>[rooms.find(x=>x.id==='b')],isRoomLocked:id=>locked.has(id),layoutValid:()=>true};
  vm.runInNewContext(fragment,{BMH,structuredClone});
  const rooms=[{id:'a',floor:0,x:0,y:0,w:2,h:2},{id:'b',floor:0,x:2,y:0,w:2,h:2}];
  assert.equal(BMH.edgeMoveCandidate(rooms,'a','east',.5),null);
  locked.clear();
  const moved=BMH.edgeMoveCandidate(rooms,'a','east',.5);
  assert.equal(moved[1].x,2.5);
  assert.equal(rooms[1].x,2);
});

test('a user drawn boundary cannot silently change the unverified design area',()=>{
  const source=fs.readFileSync(new URL('../src/00_boot.js',import.meta.url),'utf8');
  const fragment=source.slice(source.indexOf('BMH.siteParcelStats ='),source.indexOf('BMH.siteFeasibility ='));
  const BMH={state:{project:{}},polygonAreaMeters:()=>54,polygonPerimeterMeters:()=>31,haversineKm:()=>.009,clamp:(n,a,b)=>Math.min(b,Math.max(a,n))};
  vm.runInNewContext(fragment,{BMH,Math,Number,Array});
  const site={width:5,depth:20,floors:2,targetCoverage:.68,setbackFront:2,setbackRear:1,setbackSide:.2,lotMode:'rect',lotPoints:[]};
  const baseline=BMH.buildableEnvelope(site);
  site.lotMode='custom';site.lotPoints=[{lat:10,lng:106},{lat:10,lng:106.01},{lat:10.01,lng:106}];
  const drawn=BMH.buildableEnvelope(site);
  assert.equal(drawn.plotArea,54);
  assert.equal(drawn.targetPlate,baseline.targetPlate);
  assert.equal(drawn.gfa,baseline.gfa);
  assert.equal(drawn.legalVerified,false);
});

test('keyless map fallback keeps the parcel pin available when imagery fails',()=>{
  const source=fs.readFileSync(new URL('../src/60_app.js',import.meta.url),'utf8');
  const embed=source.slice(source.indexOf('BMH.mapEmbedUrl ='),source.indexOf('BMH.renderMapIframeFallback ='));
  const tiles=source.slice(source.indexOf('BMH.mapTileConfig ='),source.indexOf('BMH.siteIntelClientKey='));
  const BMH={state:{project:{site:{lat:10.85,lng:106.75,mapZoom:17,mapStyle:'hybrid'}}},clamp:(n,min,max)=>Math.min(max,Math.max(min,n))};
  vm.runInNewContext(embed+tiles,{BMH,Number,Math});
  const url=BMH.mapEmbedUrl();
  assert.match(url,/openstreetmap\.org\/export\/embed\.html/);
  assert.doesNotMatch(url,/google|api.key/i);
  assert.equal(BMH.mapTileConfig('hybrid').length,2);
  assert.match(BMH.mapTileConfig('hybrid')[1][0],/tile\.openstreetmap\.org/);
});

test('planner shows the active tool, position controls and placement feedback',()=>{
  const source=fs.readFileSync(new URL('../src/70_v60_product_ui.js',import.meta.url),'utf8');
  const fragment=source.slice(source.indexOf('BMH.screen5=()=>'),source.indexOf('BMH.screen6=()=>'));
  const room={id:'bed-1',name:'Phòng ngủ',type:'bed',floor:0,x:1,y:2,w:3,h:4};
  const BMH={state:{ui:{planner:{view:'plan',floor:0,selected:'bed-1',tool:'select'}},project:{site:{floors:2,width:5,depth:20},plan:{rooms:[room]}}},
    floorRooms:()=>[room],designReview:()=>({overall:78}),planSvg:()=>'<svg id="plannerSvg"></svg>',plannerIssues:()=>[{sev:'warn',text:'Cần một lối đi'}],
    roomPlacementReview:()=>({code:'mid',status:'CÂN NHẮC',score:68,name:'Phòng ngủ',sector:'Đông',notes:['Kiểm tra cửa sổ']}),
    isFloorLocked:()=>false,isRoomLocked:()=>false,v6Title:()=>'',v6PanelTitle:()=>'',v6Kpi:()=>'',v6Esc:x=>String(x),num:n=>String(n)};
  vm.runInNewContext(fragment,{BMH,Number,Array,Math});
  const html=BMH.screen5();
  assert.match(html,/data-plan-tool="select" class="active"/);
  assert.match(html,/id="placementHint"/);
  assert.match(html,/data-v6-room="x"/);
  assert.match(html,/data-v6-room="y"/);
  assert.match(html,/Cần một lối đi/);
});
