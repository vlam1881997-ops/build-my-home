import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {nearbyMaterialPlaces} from '../server/_places.mjs';
import {runSiteIntelligence} from '../server/_site_intelligence.mjs';

function client(saved){
 const values=new Map(saved?[['evidence-test',JSON.stringify(saved)]]:[]),ctx={location:{hostname:'localhost'},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},document:{addEventListener(){},querySelectorAll:()=>[]},window:{},structuredClone,console,Date,URL,setTimeout,clearTimeout,AbortController,queueMicrotask(){},Blob,TextEncoder,Uint8Array};
 vm.createContext(ctx);
 for(const file of ['00_boot','01_vn34_catalog','15_data_engine','10_state','20_calc','30_planner','35_dossier','40_exports','45_studio3d']){
  let source=fs.readFileSync('src/'+file+'.js','utf8').replace('const BMH =','var BMH =');
  if(file==='00_boot')source=source.replace("STORAGE_KEY: 'build-my-home-v3-official'","STORAGE_KEY: 'evidence-test'");
  vm.runInContext(source,ctx);
 }
 const B=ctx.BMH;B.STORAGE_KEY='evidence-test';if(saved){B.state=B.mergeState(B.defaultState(),saved);B.normalizeState();}
 for(const fn of ['screen1','screen3','screen5','screen7','screen8','screen9','screen10','houseStylePanel','roomEditingPanel','studioStructureKey'])B[fn]=()=>'';
 B.SCREENS=[];B.v6Esc=B.esc;B.houseStyle=()=>({id:'modern',name:'Hiện đại',form:'flat'});B.$=()=>null;B.toast=()=>{};B.render=()=>{};B.architectDocument=()=>({});B.customerDesignSnapshot=()=>({project:{},checks:[]});B.customerPackageFiles=()=>[];B.exportCustomerPackage=async()=>true;B.guidedDetails=()=>'';
 vm.runInContext(fs.readFileSync('src/76_architecture.js','utf8'),ctx);
 const projection=fs.readFileSync('src/75_completion.js','utf8');vm.runInContext(projection.slice(projection.indexOf('BMH.sceneFootprintBounds='),projection.indexOf('// Studio renders from this registry')),ctx);
 for(const file of ['79_stair_design','87_elevator_design','92_measured_design'])vm.runInContext(fs.readFileSync('src/'+file+'.js','utf8'),ctx);
 const app=fs.readFileSync('src/60_app.js','utf8');vm.runInContext(app.slice(app.indexOf('BMH.siteEvidenceKinds='),app.indexOf('BMH.loadSiteIntelligence=async')),ctx);
 return B;
}
const boundary={kind:'boundary',sourceType:'survey',sourceTitle:'Fixture trích đo',publisher:'Đơn vị khảo sát fixture',sourceUrl:'https://example.com/survey',effectiveAt:'2026-10-01',sourceCrs:'LOCAL_METRES',surveyReference:'A gốc đo; AB mặt tiền',localVertices:'0, 0\n5, 0\n5, 20\n0, 20'};
const json=v=>JSON.parse(JSON.stringify(v));
const professionalReview=B=>({id:'synthetic-review',discipline:'structure',status:'reviewed',reviewer:{name:'Synthetic engineer fixture',role:'engineer'},reportReference:'TEST-ONLY-KS-01',reviewedAt:'2026-10-08',reviewedRevision:B.drawingRevision(),dependencies:['project.site','project.plan','project.materials']});
test('construction schema migration preserves legacy measurements, nulls, zeroes and stable IDs without inventing engineering data',()=>{
 const B=client(),saved=json(B.state),plan=json(saved.project.plan),materials=json(saved.project.materials);
 saved.project.constructionDesign={schemaVersion:1,inputs:{loading:{value:0,unit:'kN/m²',reference:'TEST-ONLY-INPUT'},soil:{value:null,unit:'kPa'}},elements:[{id:'supplied-column',semanticType:'column',status:'provided',source:{reference:'TEST-ONLY-KS-01'},dimensions:{width:.25,depth:.4},floor:1},{semanticType:'beam',status:'provisional',dimensions:{width:null,depth:null},floor:1}],reviews:[],issues:[]};
 const restored=client(saved),c=restored.state.project.constructionDesign;
 assert.equal(c.schemaVersion,2);assert.deepEqual(json(restored.state.project.plan),plan);assert.deepEqual(json(restored.state.project.materials),materials);
 assert.equal(c.inputs.loading.value,0);assert.equal(c.inputs.soil.value,null);assert.equal(c.inputs.soil.reviewState,'missing');assert.equal(c.elements[0].id,'supplied-column');assert.equal(c.elements[0].reviewState,'provided');assert.equal(c.elements[1].dimensions.width,null);
 assert.deepEqual(json(client(json(restored.state)).state.project.constructionDesign),json(c),'migration remains idempotent and keeps generated legacy IDs');
});
test('a reviewed checkbox or incomplete professional evidence stays awaiting review and retains the declaration',()=>{
 const B=client();for(const change of [{reviewer:null},{reviewer:{name:'Fixture',role:'OWNER'}},{reportReference:null},{reviewedAt:null},{reviewedAt:'2026-02-31'},{reviewedRevision:null}]){
  B.state.project.constructionDesign.reviews=[{...professionalReview(B),...change}];B.normalizeConstructionDesign(B.state.project);
  const row=B.state.project.constructionDesign.reviews[0];assert.equal(row.reviewState,'awaiting-review');assert.equal(row.declaredReviewState,'reviewed');assert.equal(B.constructionReview().reviewed,0);
 }
 B.state.project.constructionDesign.elements=[{id:'no-source',status:'provided',dimensions:{width:.25}}];B.normalizeConstructionDesign(B.state.project);assert.equal(B.state.project.constructionDesign.elements[0].reviewState,'provisional');
});
test('unstructured legacy technical records remain stored and pending instead of being discarded or approved',()=>{
 const B=client(),saved=json(B.state);saved.project.constructionDesign={schemaVersion:1,inputs:{legacyLoading:0},elements:[null,'Legacy technical note',17],reviews:['Legacy review note'],issues:[]};
 const restored=client(saved),c=restored.state.project.constructionDesign;assert.deepEqual(json(c.elements),saved.project.constructionDesign.elements);assert.deepEqual(json(c.reviews),saved.project.constructionDesign.reviews);assert.equal(c.inputs.legacyLoading,0);assert.equal(restored.constructionReview().unparsed,5);assert.equal(restored.constructionReview().pending,5);assert.equal(restored.constructionReview().reviewed,0);assert.ok(restored.measuredDesignReview().warnings.some(w=>/mục kỹ thuật cũ/.test(w)));
 assert.deepEqual(json(client(json(restored.state)).state.project.constructionDesign),json(c));
});
test('professional review metadata and stale propagation never create a self-invalidating design revision',()=>{
 const B=client(),p=B.state.project,before=B.drawingRevision();p.constructionDesign.reviews=[professionalReview(B)];B.save();
 assert.equal(B.constructionReview().reviewed,1);assert.equal(B.drawingRevision(),before);assert.equal(p.constructionDesign.reviews[0].reviewState,'reviewed');
 p.plan.rooms[0].w+=.1;const changed=B.drawingRevision();assert.notEqual(changed,before);B.save();assert.equal(p.constructionDesign.reviews[0].reviewState,'stale');assert.equal(p.constructionDesign.reviews[0].reviewedRevision,before);assert.equal(B.drawingRevision(),changed);
 B.save();assert.equal(B.drawingRevision(),changed);assert.equal(B.measuredDesignReview().technical.stale,1);assert.ok(B.measuredDesignReview().warnings.some(w=>/thuộc phiên bản cũ/.test(w)));
 const restored=client(json(B.state));assert.equal(restored.state.project.constructionDesign.reviews[0].reviewState,'stale');assert.equal(restored.state.project.constructionDesign.reviews[0].reviewedRevision,before);
});
test('price and personal finance preserve review validity while SKU and technical dimensions stale the review',()=>{
 const B=client(),p=B.state.project;p.materials.choices.floor='technical-fixture';p.dataEngine.materialOverrides['technical-fixture']={value:100000,product:{sku:'TEST-TILE-A',unit:'m²'}};
 p.constructionDesign.elements=[{id:'technical-beam',semanticType:'beam',status:'provided',source:{reference:'TEST-ONLY-KS-02'},dimensions:{width:.2,depth:.4}}];B.normalizeConstructionDesign(p);
 p.constructionDesign.reviews=[professionalReview(B)];const before=B.drawingRevision();p.dataEngine.materialOverrides['technical-fixture'].value=150000;p.finance.cash+=500000;B.save();assert.equal(B.drawingRevision(),before);assert.equal(B.constructionReview().reviewed,1);
 p.dataEngine.materialOverrides['technical-fixture'].product.sku='TEST-TILE-B';B.save();assert.equal(B.constructionReview().stale,1);
 p.constructionDesign.reviews=[professionalReview(B)];p.constructionDesign.elements[0].dimensions.depth=.45;const changed=B.drawingRevision();B.save();assert.notEqual(changed,before);assert.equal(B.constructionReview().stale,1);assert.equal(B.drawingRevision(),changed);
});
test('reviewing a supplied technical element changes review state without changing its geometry or source identity',()=>{
 const B=client(),p=B.state.project;p.constructionDesign.elements=[{id:'element-reviewed',semanticType:'column',status:'provided',source:{reference:'TEST-ONLY-KS-03'},dimensions:{width:.3,depth:.3}}];B.normalizeConstructionDesign(p);const before=B.drawingRevision(),row=p.constructionDesign.elements[0];
 Object.assign(row,professionalReview(B),{id:row.id,reviewState:'reviewed',reportReference:row.source.reference});const withReport=B.drawingRevision();row.reviewedRevision=withReport;B.save();
 assert.equal(row.reviewState,'reviewed');assert.equal(B.drawingRevision(),withReport);row.dimensions.width=.35;const changed=B.drawingRevision();B.save();assert.equal(row.reviewState,'stale');assert.equal(B.drawingRevision(),changed);assert.notEqual(changed,before);
});
test('material metadata and per-room choices persist; revision responds to product identity, not price',()=>{
 const B=client(),p=B.state.project;
 p.materials.choices.floor='fixture-tile';
 p.dataEngine.materialOverrides['fixture-tile']={value:null,product:{id:'fixture-tile',category:'floor',sku:'TILE-600',spec:'600×600',unit:'m²',priceEvidence:{amountVnd:null,quantityUnit:'m²',quotedAt:null,retrievedAt:'2026-10-07',sourceUrl:'https://example.com/tile',includesVat:null,includesLabour:false,includesTransport:null}}};
 p.materials.finish.rooms.r1={visualMaterials:{floor:'oak-floor'},explicitRoles:{floor:true},catalogMaterials:{floor:{productId:'fixture-tile',sku:'TILE-600',visualProfileId:'oak-floor',exactness:'generic',realWorldScale:[.2,1.4]}}};
 p.designStudio.extraRooms=[{id:'laundry',floor:1,name:'Giặt',width:2.4,depth:2.2}];
 const revision=B.drawingRevision();p.dataEngine.materialOverrides['fixture-tile'].value=200000;assert.equal(B.drawingRevision(),revision);
 p.dataEngine.materialOverrides['fixture-tile'].product.sku='TILE-800';assert.notEqual(B.drawingRevision(),revision);
 const restored=client(json(B.state));assert.deepEqual(json(restored.state.project.materials),json(p.materials));assert.equal(restored.state.project.dataEngine.materialOverrides['fixture-tile'].product.priceEvidence.amountVnd,null);assert.equal(restored.state.project.designStudio.extraRooms[0].width,2.4);
 p.dataEngine.materialOverrides['fixture-tile'].product.priceEvidence.amountVnd=0;assert.equal(client(json(B.state)).state.project.dataEngine.materialOverrides['fixture-tile'].product.priceEvidence.amountVnd,0);
});
test('fresh projects show materials and automatic wall view; saved explicit views survive normalization',()=>{
 const B=client();assert.equal(B.state.ui.modelLook,'materials');assert.equal(B.state.ui.modelWalls,'auto');B.state.ui.modelLook='neon';assert.equal(client(json(B.state)).state.ui.modelLook,'neon');assert.equal(client(json(B.state)).state.ui.modelWalls,'auto');
});
test('measured boundary stays in metres and does not alter pin, rooms, materials or private inputs',()=>{
 const B=client(),p=B.state.project,keep=json({lat:p.site.lat,lng:p.site.lng,plan:p.plan,style:p.style,materials:p.materials,finance:p.finance,household:p.household}),row=B.saveSiteEvidence(boundary),g=B.parcelGeometry();
 assert.equal(g.area,100);assert.equal(g.width,5);assert.equal(g.depth,20);assert.equal(g.basis,'measured');assert.equal(row.unit,'m');assert.equal(row.verifiedState,'provided');assert.equal(p.site.boundaryEvidenceId,row.id);
 assert.deepEqual(json({lat:p.site.lat,lng:p.site.lng,plan:p.plan,style:p.style,materials:p.materials,finance:p.finance,household:p.household}),keep);
 const restored=client(json(B.state));assert.equal(restored.parcelGeometry().area,100);assert.deepEqual(json(restored.state.project.designEvidence),json(p.designEvidence));
});
test('crossed, duplicate or unsupported coordinates leave both evidence and history untouched',()=>{
 const B=client();B.saveSiteEvidence(boundary);const before=JSON.stringify(B.state),history=JSON.stringify(B.planHistory);
 for(const input of [{localVertices:'0,0\n5,20\n5,0\n0,20'},{localVertices:'0,0\n5,0\n5,0\n0,20'},{sourceCrs:'VN-2000'},{localVertices:'0,0\n40,0\n40,20\n0,20'}])assert.throws(()=>B.saveSiteEvidence({...boundary,...input}));
 assert.equal(JSON.stringify(B.state),before);assert.equal(JSON.stringify(B.planHistory),history);
});
test('VN-2000 raw data and technical/feng/material records survive legacy merge and reload without a fabricated transform',()=>{
 const B=client();B.saveSiteEvidence({...boundary,sourceCrs:'VN-2000',localVertices:'',rawCoordinates:'X=1234567.89; Y=567890.12',transformReference:'Chưa có kinh tuyến trục'});
 B.state.project.constructionDesign.inputs={soilReport:{reference:'KS-01',unit:'kPa',value:null}};
 B.state.project.constructionDesign.elements=[{id:'beam-supplied',semanticType:'beam',status:'provided',dimensions:{width:.25,depth:.45}}];
 B.state.project.constructionDesign.reviews=[{discipline:'structure',reviewedRevision:'OLD',reportReference:'Fixture KS-01'}];
 B.state.project.designEvidence.fengSources=[{id:'book-1',sourceUrl:'https://example.com/book',value:{page:12},unit:null}];
 B.state.project.designEvidence.materialSources=[{id:'quote-1',value:{amountVnd:null,sku:'FIXTURE'},sourceType:'quote'}];
 const restored=client(json(B.state));assert.equal(restored.parcelGeometry(),null);assert.equal(restored.state.project.designEvidence.site[0].value.rawCoordinates,'X=1234567.89; Y=567890.12');assert.equal(restored.state.project.designEvidence.site[0].unit,null);assert.equal(restored.state.project.constructionDesign.elements[0].dimensions.width,.25);assert.equal(restored.state.project.designEvidence.fengSources[0].value.page,12);
});
test('pin and boundary changes invalidate scoped sources and supplier cache while preserving old documents and finance snapshots',()=>{
 const B=client();B.saveSiteEvidence(boundary);B.saveSiteEvidence({kind:'planning',sourceType:'authority',sourceTitle:'Fixture quy hoạch',sourceUrl:'https://example.com/planning',notes:'Chưa đối chiếu số thửa'});B.saveSiteEvidence({kind:'supplier',sourceType:'quote',sourceTitle:'Fixture cửa hàng',name:'Cửa hàng trong nguồn',address:'Địa chỉ fixture'});
 B.state.project.dossier.budgetBaselines=[{id:'old-budget',total:123}];B.state.project.siteIntelligence={...B.defaultState().project.siteIntelligence,status:'ready',siteScopeKey:B.siteEvidenceContextKey(),suppliers:[{name:'Old place'}]};
 const revision=B.drawingRevision();B.state.project.site.lat+=.000001;B.save();assert.notEqual(B.drawingRevision(),revision);assert.equal(B.state.project.designEvidence.site.every(e=>e.verifiedState==='stale'),true);assert.equal(B.parcelGeometry(),null);assert.equal(B.state.project.siteIntelligence.suppliers.length,0);assert.equal(B.state.project.siteIntelligence.status,'stale');assert.equal(B.state.project.dossier.budgetBaselines[0].total,123);
 B.activateBoundaryEvidence(B.state.project.site.boundaryEvidenceId);assert.equal(B.parcelGeometry().area,100);assert.equal(B.state.project.designEvidence.site[1].verifiedState,'stale');
});
test('revision covers setbacks, frontage, technical inputs and boundary documents without using finance or stale reviews as approvals',()=>{
 const B=client();B.saveSiteEvidence(boundary);let previous=B.drawingRevision();
 for(const [key,value] of [['setbackFront',2.1],['setbackRear',1.2],['setbackSide',.3],['frontEdge',1]]){B.state.project.site[key]=value;assert.notEqual(B.drawingRevision(),previous);previous=B.drawingRevision();}
 B.state.project.constructionDesign.inputs.loading={reference:'fixture',value:2,unit:'kN/m²'};assert.notEqual(B.drawingRevision(),previous);previous=B.drawingRevision();B.state.project.finance.cash+=1;assert.equal(B.drawingRevision(),previous);
 B.state.project.designEvidence.site[0].sourceUrl='https://example.com/survey-2';assert.notEqual(B.drawingRevision(),previous);
});
test('manual dimensions mode enforces entered setbacks and a concave polygon identifies offending edges',()=>{
 const B=client();assert.equal(B.roomInsideParcel({x:0,y:0,w:2,h:2}),false);assert.equal(B.roomInsideParcel({x:.2,y:2,w:2,h:3}),true);
 const review=B.validateParcelVertices([{x:0,y:0},{x:5,y:20},{x:5,y:0},{x:0,y:20}]);assert.equal(review.valid,false);assert.ok(review.errors.some(text=>/cạnh/.test(text)));
});
test('an irregular three-floor site retains aligned stairs, continuous lift holes and stable room IDs',()=>{
 const B=client();B.state.project.site.floors=3;B.saveSiteEvidence({...boundary,localVertices:'0,0\n8,0\n8,8\n5,8\n5,20\n0,20'});assert.equal(B.parcelGeometry().area,124);
 const p=B.state.project;p.plan={furniture:[],rooms:[0,1,2].flatMap(floor=>[{id:'stairs-'+floor,floor,type:'stairs',name:'Thang',x:.4,y:2.4,w:2.4,h:4.2},{id:'lift-'+floor,floor,type:'elevator',name:'Giếng dự trù',x:3.1,y:2.4,w:1.6,h:1.9,elevator:{shaftId:'same-shaft'}}]),openings:[],outdoor:[],fixtures:[],lockedRoomIds:[],lockedFloors:[]};
 assert.equal(B.stairAlignmentIssues().filter(i=>i.sev==='error').length,0);assert.equal(B.elevatorIssues().filter(i=>i.sev==='error').length,0);for(const floor of [1,2])assert.equal(B.stairFloorHoles(floor).length,2);assert.equal(B.elevatorSpec(p.plan.rooms[1]).pitDepth,null);
 assert.equal(B.roomInsideParcel({x:4,y:7,w:2,h:3}),false,'room crossing the L notch is rejected');
 const restored=client(json(B.state));assert.deepEqual(json(restored.state.project.plan),json(p.plan));assert.equal(restored.parcelGeometry().area,124);
 p.plan.rooms.find(r=>r.id==='stairs-1').x+=.2;assert.ok(B.stairAlignmentIssues().some(i=>i.sev==='error'));p.plan.rooms=p.plan.rooms.filter(r=>r.id!=='lift-1');assert.ok(B.elevatorIssues().some(i=>/gián đoạn/.test(i.text)));
});
test('unsupported imported survey dimensions cannot be activated or silently clamped',()=>{
 const B=client(),row=B.saveSiteEvidence(boundary);row.value.localVertices=[{x:0,y:0},{x:40,y:0},{x:40,y:20},{x:0,y:20}];const before=JSON.stringify(B.state);assert.throws(()=>B.activateBoundaryEvidence(row.id),/2–30/);assert.equal(JSON.stringify(B.state),before);
});
test('physical wall/roof checks and shared exports use the measured boundary without private evidence payloads',()=>{
 const B=client();B.saveSiteEvidence(boundary);const p=B.state.project;
 p.plan={furniture:[],rooms:[0,1].map(floor=>({id:'room-'+floor,floor,type:'living',name:'Fixture room',x:.4,y:2.4,w:4.2,h:4})),openings:[],outdoor:[],fixtures:[],lockedFloors:[],lockedRoomIds:[]};
 assert.equal(B.measuredDesignReview().geometryValid,true);p.measuredDesign.roof.overhang=.8;assert.ok(B.measuredGeometryIssues().some(i=>/Mái đua/.test(i.text)));p.measuredDesign.roof.overhang=0;p.plan.rooms[0].x=.2;assert.ok(B.measuredGeometryIssues().some(i=>/mặt ngoài tường/.test(i.text)));
 p.plan.rooms[0].x=.4;p.designEvidence.site[0].value.rawCoordinates='PRIVATE-RAW-DOCUMENT';p.designEvidence.site[0].notes='PRIVATE-NOTES';p.finance.cash=123456789;p.household.ownerBirth=1971;
 const exported=B.customerDesignSnapshot(),text=JSON.stringify(exported);assert.equal(exported.project.siteBasis.vertices.length,4);assert.equal(exported.project.siteBasis.planningStatus,'unverified');assert.ok(!text.includes('PRIVATE-RAW-DOCUMENT'));assert.ok(!text.includes('PRIVATE-NOTES'));assert.ok(!text.includes('123456789'));assert.ok(!text.includes('ownerBirth'));
});
test('Places needs its own capability permission; Gemini key alone never enables a metered Places request',async()=>{
 const oldKey=process.env.BMH_GOOGLE_PLACES_API_KEY,oldFlag=process.env.BMH_GOOGLE_PLACES_ENABLED,fetch=globalThis.fetch;let calls=0;
 process.env.BMH_GOOGLE_PLACES_API_KEY='fixture-key';delete process.env.BMH_GOOGLE_PLACES_ENABLED;globalThis.fetch=async()=>{calls++;throw Error('Must not request Places');};
 try{const result=await nearbyMaterialPlaces(10,106);assert.equal(result.configured,false);assert.deepEqual(result.places,[]);assert.equal(calls,0);}
 finally{globalThis.fetch=fetch;oldKey===undefined?delete process.env.BMH_GOOGLE_PLACES_API_KEY:process.env.BMH_GOOGLE_PLACES_API_KEY=oldKey;oldFlag===undefined?delete process.env.BMH_GOOGLE_PLACES_ENABLED:process.env.BMH_GOOGLE_PLACES_ENABLED=oldFlag;}
});
test('site scan uses exact coordinates and source scope for cache, and keeps planning unknown',async()=>{
 const fetch=globalThis.fetch,flag=process.env.GEMINI_SITE_SEARCH_ENABLED;delete process.env.GEMINI_SITE_SEARCH_ENABLED;globalThis.__BMH_SITE_INTELLIGENCE__.clear();let calls=0;
 globalThis.fetch=async url=>{calls++;if(String(url).includes('overpass'))return {ok:true,json:async()=>({elements:[{type:'node',id:42,lat:10,lon:106,tags:{shop:'building_materials',name:'Fixture supplier'}}]})};return {ok:true,json:async()=>({elevation:[null]})};};
 try{const first=await runSiteIntelligence({lat:10,lng:106,siteScopeKey:'aa'});assert.equal(first.planning.buildableAreaM2,null);assert.equal(first.planning.status,'unverified');assert.ok(first.suppliers[0].sourceUrl.endsWith('/node/42'));assert.equal(first.suppliers[0].verifiedState,'provided');const same=await runSiteIntelligence({lat:10,lng:106,siteScopeKey:'aa'});assert.equal(same.cached,true);const count=calls;await runSiteIntelligence({lat:10.000001,lng:106,siteScopeKey:'ab'});assert.ok(calls>count);}
 finally{globalThis.fetch=fetch;flag===undefined?delete process.env.GEMINI_SITE_SEARCH_ENABLED:process.env.GEMINI_SITE_SEARCH_ENABLED=flag;}
});
