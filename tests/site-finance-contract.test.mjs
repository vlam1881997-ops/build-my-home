import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {cleanProject} from '../api/ai.mjs';
import {verifyRateEvidence} from '../api/bank-rate.mjs';
import renderHandler,{renderRequestPayload,extractRenderedImage} from '../api/gemini-render.mjs';

function stateEngine(saved){
  const values=new Map(saved?[["bmh-test",JSON.stringify(saved)]]:[]);
  const BMH={VERSION:'test',STORAGE_KEY:'bmh-test',LEGACY_STORAGE_KEYS:[],
    defaultDataEngineState:()=>({cost:{shellPerM2:3600000,finishPerM2:2350000,prepPerM2:280000},quote:{},status:{},pricingMode:'regional'}),
    REGIONS:{'TP. Hồ Chí Minh':{defaultDistrict:'Phường Sài Gòn',districts:[['Phường Sài Gòn',10.77,106.7]]}},
    REGION_ALIASES:{},regionPoint:()=>({district:'Phường Sài Gòn',lat:10.77,lng:106.7}),
    clamp:(n,min,max)=>Math.min(max,Math.max(min,n)),uid:()=> 'test-id'};
  const localStorage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  vm.runInNewContext(fs.readFileSync(new URL('../src/10_state.js',import.meta.url),'utf8'),{BMH,localStorage,structuredClone,Date,console});
  return {BMH,localStorage};
}

test('a manually placed pin and its address review state survive reload and normalization',()=>{
  const {BMH}=stateEngine();
  BMH.state.project.site={...BMH.state.project.site,lat:21.0321,lng:105.8546,district:'Khu vực chưa khớp danh mục',geoSource:'Ghim bản đồ',pinAddressNeedsReview:true};
  BMH.save();
  const restored=stateEngine(BMH.state).BMH.state.project.site;
  assert.equal(restored.lat,21.0321);
  assert.equal(restored.lng,105.8546);
  assert.equal(restored.pinAddressNeedsReview,true);
  assert.equal(restored.district,'Khu vực chưa khớp danh mục');
});

test('an old saved pin without the new flag migrates to address review',()=>{
  const source=stateEngine().BMH.defaultState();
  source.project.site.lat=21.0321;
  source.project.site.lng=105.8546;
  source.project.site.geoSource='Ghim bản đồ';
  delete source.project.site.pinAddressNeedsReview;
  const site=stateEngine(source).BMH.state.project.site;
  assert.equal(site.pinAddressNeedsReview,true);
  assert.equal(site.lat,21.0321);
});

test('locked floors survive a saved project reload',()=>{
  const {BMH}=stateEngine();
  BMH.state.project.plan.lockedFloors=[1];
  BMH.save();
  const restored=stateEngine(BMH.state).BMH;
  restored.normalizeState();
  assert.deepEqual([...restored.state.project.plan.lockedFloors],[1]);
});

test('active opening and stair drawings survive project reload with their selected sheet',()=>{
  for(const view of ['openings','stairs']){
    const {BMH}=stateEngine();
    Object.assign(BMH.state.ui.planner,{view,floor:1,openingPage:2,stairDrawingId:'r5',sectionCutX:2.3});BMH.save();
    const restored=stateEngine(BMH.state).BMH.state.ui.planner;
    assert.equal(restored.view,view);assert.equal(restored.floor,1);assert.equal(restored.openingPage,2);assert.equal(restored.stairDrawingId,'r5');assert.equal(restored.sectionCutX,2.3);
  }
});

test('AI sees the pin and only the Site Intelligence scan matching that pin',()=>{
  const p={site:{lat:21.0321,lng:105.8546,road:3.5,province:'TP. Hồ Chí Minh',district:'Phường cũ',pinAddressNeedsReview:true,geoSource:'Ghim bản đồ'},
    siteIntelligence:{status:'ready',key:'21.0321,105.8546:3.5',elevation_m:null,fetchedAt:'2026-09-26T00:00:00Z',flood:{level:'Chưa đủ dữ liệu'},transport:{surchargePct:8}},
    finance:{rateMeta:{verified:false,status:'preset'},introRate:6.9,postRate:10.9}};
  const current=cleanProject(p);
  assert.equal(current.site.lat,21.0321);
  assert.equal(current.site.province,'');
  assert.equal(current.site.addressStatus,'unverified');
  assert.equal(current.siteIntelligence.elevation_m,null);
  assert.equal(current.siteIntelligence.transport.surchargePct,8);
  assert.equal(current.finance.rateStatus,'unverified_scenario');
  p.site.lat=21.1010;
  assert.equal(cleanProject(p).siteIntelligence,null);
  p.site.lat=21.0321;p.site.geoSource='Dữ liệu vùng';
  assert.equal(cleanProject(p).siteIntelligence,null);
});

test('estimate uses all floors while plan is empty or incomplete, then exact planned area',()=>{
  const BMH={state:{project:{site:{floors:3,width:10,depth:20,lat:21,lng:105,road:3},plan:{rooms:[]},materials:{tier:'standard',climatePackage:'basic',choices:{}},finance:{loan:0,cash:0,reserve:0,income:0,living:0,existingDebt:0,years:15,introRate:0,postRate:0,promoMonths:0,targetBudget:1500000000}}},
    clamp:(n,min,max)=>Math.min(max,Math.max(min,n)),buildableEnvelope:()=>({gfa:180,targetPlate:60}),MATERIALS:{},siteAdaptation:()=>({roadPct:.05,climatePct:0})};
  vm.runInNewContext(fs.readFileSync(new URL('../src/20_calc.js',import.meta.url),'utf8'),{BMH,Math,Number,String,Intl});
  BMH.performancePlan=()=>({upgradeCost:0});
  BMH.dataCostBasis=()=>({shellPerM2:3600000,finishPerM2:2350000,prepPerM2:280000});
  const empty=BMH.estimate();
  assert.equal(empty.areaSource,'provisional');
  assert.equal(empty.area,153);
  BMH.state.project.plan.rooms=[0,1].flatMap(floor=>[{floor,x:0,y:0,w:5,h:8},{floor,x:5,y:0,w:5,h:8}]);
  assert.equal(BMH.estimate().area,160);
  assert.equal(BMH.estimate().areaSource,'provisional');
  BMH.state.project.plan.rooms.push({floor:2,x:0,y:0,w:5,h:8},{floor:2,x:5,y:0,w:5,h:8});
  const complete=BMH.estimate();
  assert.equal(complete.areaSource,'plan');
  assert.equal(complete.area,240);
  assert.ok(complete.total>empty.total);
});

test('bank rates require a dated bank-specific source and both rates',()=>{
  const bank={name:'Vietcombank',fullName:'Ngân hàng TMCP Ngoại Thương Việt Nam'};
  const result={verified:true,bank_name:'Vietcombank',product:'Vay xây nhà',source_date:'2026-09-20',rate_kind:'construction_loan',intro_rate_pct:7,post_rate_pct:10.5};
  const citations=[{title:'Vietcombank: vay xây nhà',url:'https://www.vietcombank.com.vn/vay-xay-nha'}];
  const now=new Date('2026-09-26T00:00:00Z');
  assert.equal(verifyRateEvidence(result,citations,bank,now),true);
  assert.equal(verifyRateEvidence({...result,post_rate_pct:0},citations,bank,now),false);
  assert.equal(verifyRateEvidence({...result,source_date:'2025-01-01'},citations,bank,now),false);
  assert.equal(verifyRateEvidence(result,[{title:'Ngân hàng khác',url:'https://example.org'}],bank,now),false);
  assert.equal(verifyRateEvidence(result,[],bank,now),false);
});

test('planning prices never inherit the build date as a supplier source date',()=>{
  const BMH={state:{project:{site:{province:'Hà Nội'},dataEngine:{pricingMode:'regional',cost:{shellPerM2:3600000,finishPerM2:2350000,prepPerM2:280000},quote:{},materialOverrides:{}}}},
    regionProfile:()=>({labor:[500000,500000]}),rangeAverage:()=>500000,clamp:(n,min,max)=>Math.min(max,Math.max(min,n))};
  vm.runInNewContext(fs.readFileSync(new URL('../src/15_data_engine.js',import.meta.url),'utf8'),{BMH,Math,Number,Intl});
  const baseline=BMH.dataCostBasis();
  assert.equal(baseline.sourceDate,'');
  assert.match(baseline.reference,/chưa xác nhận giá mua/);
  assert.match(BMH.materialSourceLabel({id:'floor-sample'}),/Giá hiển thị mẫu/);
  BMH.state.project.dataEngine.quote={name:'Nhà cung cấp A',date:'2026-09-25'};
  assert.equal(BMH.dataCostBasis().sourceDate,'');
  BMH.state.project.dataEngine.costSources={shellPerM2:{name:'Nhà cung cấp A',date:'2026-09-25'}};
  assert.equal(BMH.dataCostBasis().sourceDate,'2026-09-25');
});

test('image render accepts only a bounded image and keeps plan details in the prompt',()=>{
  const image='data:image/jpeg;base64,'+'A'.repeat(128);
  const request=renderRequestPayload({image,project:{site:{floors:2,width:5,depth:16},style:'Hiện đại',materials:{choices:{floor:'Gạch nhám'}},rooms:[{name:'Phòng khách',floor:0}]}});
  assert.match(request.prompt,/2 floors/);
  assert.match(request.prompt,/Gạch nhám/);
  assert.match(request.prompt,/Phòng khách/);
  const interior=renderRequestPayload({image,project:{site:{floors:2},view:{kind:'room',roomName:'Phòng ngủ chính',floor:1},rooms:[{name:'Phòng ngủ chính',floor:1,x:0,y:4,w:4,h:5}]}});
  assert.match(interior.prompt,/interior of Phòng ngủ chính/);
  assert.match(interior.prompt,/4m x 5m/);
  const classical=renderRequestPayload({image,project:{site:{floors:2,width:13,depth:6},style:'Tân cổ điển'}});
  assert.match(classical.prompt,/dark tiled hip roof/);
  assert.match(classical.prompt,/13m x 6m/);
  assert.equal(request.mimeType,'image/jpeg');
  assert.throws(()=>renderRequestPayload({image:'data:text/html;base64,'+'A'.repeat(128)}),/ảnh chụp mô hình/);
  assert.throws(()=>renderRequestPayload({image:'data:image/png;base64,'+'A'.repeat(1_500_001)}),/ảnh chụp mô hình/);
  assert.equal(extractRenderedImage({candidates:[{content:{parts:[{inlineData:{mimeType:'image/png',data:'B'.repeat(128)}}]}}]}).mimeType,'image/png');
});

test('image endpoint honors explicit disable and returns the Gemini image with a server-only key',async()=>{
  const oldEnabled=process.env.GEMINI_IMAGE_ENABLED,oldKey=process.env.GEMINI_API_KEY,oldFetch=globalThis.fetch;
  const res=()=>({status(code){this.code=code;return this;},setHeader(){return this;},end(text){this.body=JSON.parse(text);}});
  const req={method:'POST',headers:{'x-forwarded-for':'render-test'},body:{image:'data:image/jpeg;base64,'+'A'.repeat(128),project:{site:{floors:2}}}};
  try{
    process.env.GEMINI_IMAGE_ENABLED='false';
    const disabled=res();await renderHandler(req,disabled);assert.equal(disabled.code,503);
    process.env.GEMINI_IMAGE_ENABLED='true';process.env.GEMINI_API_KEY='server-test-key';
    let upstream=null;
    globalThis.fetch=async(url,options)=>{if(String(url).includes('/models?'))return {ok:true,text:async()=>JSON.stringify({models:[{name:'models/gemini-9-flash-image',supportedGenerationMethods:['generateContent']}]})};upstream={url,options};return {ok:true,json:async()=>({status:'completed',steps:[{type:'model_output',content:[{type:'image',mime_type:'image/png',data:'B'.repeat(128)}]}]})};};
    const enabled=res();await renderHandler(req,enabled);
    assert.equal(enabled.code,200);
    assert.equal(enabled.body.mimeType,'image/png');
    assert.match(upstream.url,/\/v1beta\/models\/gemini-9-flash-image:generateContent$/);
    const body=JSON.parse(upstream.options.body);
    assert.equal(body.contents[0].parts[1].inlineData.mimeType,'image/jpeg');
    assert.deepEqual(body.generationConfig.responseModalities,['TEXT','IMAGE']);
    assert.equal(JSON.stringify(enabled.body).includes('server-test-key'),false);
    assert.equal(upstream.options.headers['x-goog-api-key'],'server-test-key');
    assert.equal(enabled.body.image.length,128);
  }finally{
    if(oldEnabled===undefined)delete process.env.GEMINI_IMAGE_ENABLED;else process.env.GEMINI_IMAGE_ENABLED=oldEnabled;
    if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;
    globalThis.fetch=oldFetch;
  }
});

test('cinematic capture completes even when the loading view disposes WebGL',async()=>{
  let posted=null,renderCount=0;
  const BMH={state:{project:{style:'Hiện đại',site:{width:5,depth:16,floors:2},materials:{choices:{floor:'tile'}},plan:{rooms:[]}}},
    MATERIALS:{floor:[{id:'tile',name:'Gạch nhám'}]},
    $:()=>({}),toast:()=>{},render:()=>{renderCount++;BMH.studio3d=null;}};
  const fetch=async(url,options)=>{posted={url,body:JSON.parse(options.body)};return {ok:true,json:async()=>({image:'B'.repeat(128),mimeType:'image/png',generatedAt:'2026-09-26T00:00:00Z'})};};
  vm.runInNewContext(fs.readFileSync(new URL('../src/45_studio3d.js',import.meta.url),'utf8'),{BMH,window:{},document:{createElement(){const canvas={toDataURL(){return canvas.reference.toDataURL();},getContext(){return {drawImage(reference){canvas.reference=reference;}};}};return canvas;}},fetch,JSON,Math,Number,Object,Date});
  BMH.studio3d={project:BMH.state.project,renderer:{domElement:{width:2560,height:1600,toDataURL:()=> 'data:image/jpeg;base64,'+'A'.repeat(128)}}};
  await BMH.generateCinematicRender();
  assert.equal(posted.url,'/api/gemini-render');
  assert.equal(posted.body.project.materials.choices.floor,'Gạch nhám');
  assert.equal(renderCount,2);
  assert.equal(BMH.cinematicRender.dataUrl,'data:image/png;base64,'+'B'.repeat(128));
  assert.equal(BMH.cinematicRender.signature,BMH.cinematicSignature());
});

test('3D plan shares adjoining walls and cuts the specified doorway',()=>{
  const BMH={};
  vm.runInNewContext(fs.readFileSync(new URL('../src/45_studio3d.js',import.meta.url),'utf8'),{BMH,window:{},JSON,Math,Number,Object,Date});
  const plan={rooms:[{id:'a',floor:0,x:0,y:0,w:4,h:4},{id:'b',floor:0,x:4,y:0,w:3,h:4}],openings:[{roomId:'a',floor:0,side:'east',kind:'door',offset:.5,width:.9}]};
  const shared=BMH.scenePlanGeometry(plan,0).walls.filter(w=>!w.horizontal&&w.axis===4);
  assert.equal(shared.filter(w=>w.kind==='door').length,1);
  assert.ok(Math.abs(shared.filter(w=>w.kind==='wall').reduce((sum,w)=>sum+w.b-w.a,0)-3.1)<.001);
});

test('a new construction dossier starts at zero and records actual spending by stage',()=>{
  const {BMH}=stateEngine();
  assert.equal(BMH.state.project.dossier.progress,0);
  assert.equal(BMH.state.project.dossier.startDate,'');
  BMH.estimate=()=>({total:1000000000});
  vm.runInNewContext(fs.readFileSync(new URL('../src/35_dossier.js',import.meta.url),'utf8'),{BMH,Date,String,Number,Math});
  const initial=BMH.dossierSchedule();
  assert.equal(initial[0].status,'pending');
  assert.equal(initial[0].start,'');
  BMH.state.project.dossier.progress=10;
  BMH.state.project.dossier.startDate='2026-10-01';
  BMH.state.project.dossier.actualCosts.foundation=120000000;
  BMH.save();
  const restored=stateEngine(BMH.state).BMH.state.project.dossier;
  assert.equal(restored.actualCosts.foundation,120000000);
  assert.equal(restored.progress,10);
  assert.equal(BMH.dossierSchedule()[0].status,'done');
  assert.equal(BMH.dossierSchedule()[0].actualSpent,120000000);
  assert.equal(BMH.dossierSchedule()[0].variance,20000000);
});

test('construction evidence metadata survives project save and reload',()=>{
  const {BMH}=stateEngine();
  BMH.state.project.dossier.evidence.push({id:'evidence-1',stage:'mep',name:'test-ap-luc.pdf',type:'application/pdf',size:1042,addedAt:'2026-09-26T00:00:00Z'});
  BMH.save();
  const evidence=stateEngine(BMH.state).BMH.state.project.dossier.evidence;
  assert.equal(evidence.length,1);
  assert.equal(evidence[0].stage,'mep');
  assert.equal(evidence[0].name,'test-ap-luc.pdf');
});

test('dossier ZIP contains the original construction evidence bytes',async()=>{
  let downloaded=null;
  const bytes=new Uint8Array([0x25,0x50,0x44,0x46,0x00,0xff]);
  const BMH={
    state:{project:{site:{floors:1},plan:{rooms:[],openings:[]}}},isUnlocked:()=>true,
    createDossierSnapshot:()=>({evidence:[{id:'evidence-1',stage:'mep',name:'kiem-tra.pdf',type:'application/pdf',size:bytes.length,addedAt:'2026-09-26T00:00:00Z'}],boq:[],materials:[],cashflow:[],mep:[]}),
    evidenceGet:async()=>new Blob([bytes]),planSvg:()=>'<svg/>',elevationSvg:()=>'<svg/>',sectionSvg:()=>'<svg/>',realDataExport:()=>({}),
    download:(name,blob)=>{downloaded={name,blob};},toast:()=>{}
  };
  vm.runInNewContext(fs.readFileSync(new URL('../src/40_exports.js',import.meta.url),'utf8'),{BMH,TextEncoder,Uint8Array,Blob,JSON,Math,Number,String,Intl});
  BMH.drawingSheetSvg=()=>'<svg/>';BMH.openingSheetSvg=()=>'<svg/>';BMH.planDxf=()=> '0\r\nEOF\r\n';
  BMH.dossierWorkbook=()=>'<Workbook/>';
  BMH.dossierPrintHtml=()=>'<html/>';
  await BMH.exportDossierBundle();
  assert.equal(downloaded.name,'Build-My-Home-Ho-So-V5.0.zip');
  const buffer=Buffer.from(await downloaded.blob.arrayBuffer());
  let cursor=0,found=false;
  while(buffer.readUInt32LE(cursor)===0x04034b50){
    assert.equal(buffer.readUInt16LE(cursor+6)&0x0800,0x0800);
    const size=buffer.readUInt32LE(cursor+18),nameLength=buffer.readUInt16LE(cursor+26),extraLength=buffer.readUInt16LE(cursor+28);
    const name=buffer.toString('utf8',cursor+30,cursor+30+nameLength),start=cursor+30+nameLength+extraLength;
    if(name==='thuc-dia/mep/evidence-1-kiem-tra.pdf'){
      assert.deepEqual(buffer.subarray(start,start+size),Buffer.from(bytes));found=true;
    }
    cursor=start+size;
  }
  assert.equal(found,true);
});


test('house style survives reload, preserves plan and SKU, and invalidates the old render',()=>{
  const {BMH}=stateEngine();
  const context={BMH,document:{addEventListener(){}},window:{},console};
  vm.runInNewContext(fs.readFileSync(new URL('../src/44_house_styles.js',import.meta.url),'utf8'),context);
  vm.runInNewContext(fs.readFileSync(new URL('../src/45_studio3d.js',import.meta.url),'utf8'),context);
  const plan=JSON.stringify(BMH.state.project.plan),materials=JSON.stringify(BMH.state.project.materials);
  const before=BMH.cinematicSignature();
  assert.equal(BMH.selectHouseStyle('indochine'),true);
  assert.notEqual(BMH.cinematicSignature(),before);
  assert.equal(JSON.stringify(BMH.state.project.plan),plan);
  assert.equal(JSON.stringify(BMH.state.project.materials),materials);
  assert.equal(stateEngine(BMH.state).BMH.state.project.style,'Đông Dương · Indochine');
  assert.equal(BMH.selectHouseStyle('invalid'),false);
  const payload=renderRequestPayload({image:'data:image/jpeg;base64,'+'A'.repeat(120),project:{style:BMH.state.project.style,styleDescription:BMH.houseStyle().description}});
  assert.match(payload.prompt,/Đông Dương/);
  assert.match(payload.prompt,/cửa chớp/);
});

test('new material categories retain their selected products after state reload',()=>{
 const {BMH}=stateEngine();BMH.state.project.materials.choices.cabinetry='catalog-wood';BMH.state.project.materials.choices.mep='catalog-wire';BMH.save();const restored=stateEngine(BMH.state).BMH.state.project.materials.choices;assert.equal(restored.cabinetry,'catalog-wood');assert.equal(restored.mep,'catalog-wire');assert.equal(restored.floor,BMH.state.project.materials.choices.floor);
});
