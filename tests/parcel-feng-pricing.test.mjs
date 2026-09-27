import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import configHandler from '../api/config.mjs';

const response=()=>({status(code){this.code=code;return this;},setHeader(){return this;},end(body){this.body=JSON.parse(body);}});

test('public AI capability endpoint reports configured provider without leaking a key',()=>{
  const old=process.env.GEMINI_API_KEY;
  try{
    process.env.GEMINI_API_KEY='secret-test-key';
    const res=response();configHandler({method:'GET'},res);
    assert.equal(res.code,200);
    assert.equal(res.body.aiConfigured,true);
    assert.equal(res.body.aiProvider,'Gemini');
    assert.ok(!JSON.stringify(res.body).includes('secret-test-key'));
  }finally{if(old===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old;}
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

test('GeoJSON parser accepts WGS84 polygon but rejects projected coordinates',async()=>{
  const source=fs.readFileSync(new URL('../src/60_app.js',import.meta.url),'utf8');
  const fragment=source.slice(source.indexOf('BMH.importParcelGeoJSON ='),source.indexOf('BMH.applyCoordinates ='));
  const state={project:{site:{lotMode:'rect'}},ui:{location:{drawingLot:false}}};
  const BMH={state,polygonAreaMeters:()=>54,applyCoordinates(lat,lng){state.project.site.lat=lat;state.project.site.lng=lng;},toast(){}};
  vm.runInNewContext(fragment,{BMH,Number,Array,JSON,Error,Math});
  const file=ring=>({size:300,text:async()=>JSON.stringify({type:'Polygon',coordinates:[ring]})});
  await assert.rejects(BMH.importParcelGeoJSON(file([[600000,1100000],[600050,1100000],[600050,1100050],[600000,1100000]])),/WGS84/);
  await BMH.importParcelGeoJSON(file([[106.7,10.8],[106.7001,10.8],[106.7001,10.8001],[106.7,10.8]]));
  assert.equal(state.project.site.lotPoints.length,3);
  assert.equal(state.project.site.lotSource,'geojson-user');
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
