import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {cleanProject} from '../api/ai.mjs';
import {verifyRateEvidence} from '../api/bank-rate.mjs';

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
});

test('estimate uses all floors while plan is empty or incomplete, then exact planned area',()=>{
  const BMH={state:{project:{site:{floors:3,lat:21,lng:105,road:3},plan:{rooms:[]},materials:{tier:'standard',climatePackage:'basic',choices:{}},finance:{loan:0,cash:0,reserve:0,income:0,living:0,existingDebt:0,years:15,introRate:0,postRate:0,promoMonths:0,targetBudget:1500000000}}},
    clamp:(n,min,max)=>Math.min(max,Math.max(min,n)),buildableEnvelope:()=>({gfa:180,targetPlate:60}),MATERIALS:{},siteAdaptation:()=>({roadPct:.05,climatePct:0})};
  vm.runInNewContext(fs.readFileSync(new URL('../src/20_calc.js',import.meta.url),'utf8'),{BMH,Math,Number,String,Intl});
  BMH.performancePlan=()=>({upgradeCost:0});
  BMH.dataCostBasis=()=>({shellPerM2:3600000,finishPerM2:2350000,prepPerM2:280000});
  const empty=BMH.estimate();
  assert.equal(empty.areaSource,'provisional');
  assert.equal(empty.area,153);
  BMH.state.project.plan.rooms=[0,1].flatMap(floor=>[{floor,w:5,h:8},{floor,w:5,h:8}]);
  assert.equal(BMH.estimate().area,160);
  assert.equal(BMH.estimate().areaSource,'provisional');
  BMH.state.project.plan.rooms.push({floor:2,w:5,h:8},{floor:2,w:5,h:8});
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
    state:{project:{site:{floors:1}}},isUnlocked:()=>true,
    createDossierSnapshot:()=>({evidence:[{id:'evidence-1',stage:'mep',name:'kiem-tra.pdf',type:'application/pdf',size:bytes.length,addedAt:'2026-09-26T00:00:00Z'}],boq:[],materials:[],cashflow:[],mep:[]}),
    evidenceGet:async()=>new Blob([bytes]),planSvg:()=>'<svg/>',elevationSvg:()=>'<svg/>',sectionSvg:()=>'<svg/>',realDataExport:()=>({}),
    download:(name,blob)=>{downloaded={name,blob};},toast:()=>{}
  };
  vm.runInNewContext(fs.readFileSync(new URL('../src/40_exports.js',import.meta.url),'utf8'),{BMH,TextEncoder,Uint8Array,Blob,JSON,Math,Number,String,Intl});
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
