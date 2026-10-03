import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

function client(saved){
 let id=0;const values=new Map(saved?[['measured-test',JSON.stringify(saved)]]:[]),B={VERSION:'test',STORAGE_KEY:'measured-test',LEGACY_STORAGE_KEYS:[],SCREENS:[],planHistory:{undo:[],redo:[]},MATERIALS:{floor:[{id:'tile',premium:500000}],paint:[{id:'paint',premium:0}],door:[{id:'door',premium:0}]},HOUSE_STYLES:[{id:'vietnamese',name:'Việt Nam đương đại',form:'wide'},{id:'scandi',name:'Bắc Âu',form:'gable'},{id:'modern',name:'Hiện đại',form:'flat'}],defaultDataEngineState:()=>({cost:{},quote:{},materialOverrides:{},status:{},snapshots:[],pricingMode:'regional'}),REGIONS:{'TP. Hồ Chí Minh':{defaultDistrict:'Phường Sài Gòn',districts:[['Phường Sài Gòn',10,106]]}},REGION_ALIASES:{},regionPoint:()=>({district:'Phường Sài Gòn',lat:10,lng:106}),clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),uid:p=>p+'-'+(++id),esc:v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),render(){},toast(){},$:()=>null,roomEditingPanel:()=>'',architectDocument:()=>({}),roomFurnitureLayout:()=>[],studioStructureKey:()=>'',customerDesignSnapshot:()=>({project:{},checks:[]}),customerPackageFiles:()=>[],exportCustomerPackage:async()=>true,screen5:()=>'',screen7:()=>'',screen8:()=>'',screen9:()=>'',screen10:()=>'',guidedDetails:()=>'',selectHouseStyle:id=>{B.state.project.style=B.HOUSE_STYLES.find(s=>s.id===id).name;return true;}};
 const ctx={BMH:B,localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},document:{addEventListener(){},querySelectorAll:()=>[]},window:{},structuredClone,queueMicrotask(){},console,Date,Blob,TextEncoder,Uint8Array};
 for(const f of ['10_state','20_calc','30_planner','35_dossier','40_exports','45_studio3d'])vm.runInNewContext(fs.readFileSync('src/'+f+'.js','utf8'),ctx);
 B.areaSchedule=()=>[];B.openingSchedule=()=>[];B.sitePinConfirmed=()=>false;B.plannerIssues=()=>[];B.drawingSheetSvg=()=>'<svg/>';B.planSvg=()=>'<svg/>';
 B.houseStyle=()=>B.HOUSE_STYLES.find(s=>s.name===B.state.project.style);
 B.projectLevels=()=>{const s=B.state.project.site;return {floors:s.floors,floorHeight:s.floorHeight,slab:s.slabThickness,ceilingDrop:s.ceilingDrop,clearHeight:s.floorHeight-s.slabThickness-s.ceilingDrop};};
 B.dataEngineState=()=>B.state.project.dataEngine;B.dataCostBasis=()=>({shellPerM2:3600000,finishPerM2:2350000,prepPerM2:280000,sourceLabel:'Test planning rate',sourceDate:'',reference:'Fixture'});B.buildableEnvelope=()=>({gfa:96,targetPlate:48});B.siteAdaptation=()=>({roadPct:0,climatePct:0});B.performancePlan=()=>({upgradeCost:0});
 const projection=fs.readFileSync('src/75_completion.js','utf8');vm.runInNewContext(projection.slice(projection.indexOf('BMH.sceneFootprintBounds='),projection.indexOf('// Studio renders from this registry')),ctx);
 for(const f of ['79_stair_design','87_elevator_design','92_measured_design','93_measured_cost'])vm.runInNewContext(fs.readFileSync('src/'+f+'.js','utf8'),ctx);
 if(!saved){const p=B.state.project;Object.assign(p.site,{width:8,depth:12,floors:2,floorHeight:3.6,slabThickness:.18,ceilingDrop:.2,setbackFront:0,setbackRear:0,setbackSide:0});p.style='Việt Nam đương đại';p.materials.choices={floor:'tile',paint:'paint',door:'door'};p.plan={rooms:[],openings:[],outdoor:[],lockedRoomIds:[],lockedFloors:[]};for(let floor=0;floor<2;floor++)p.plan.rooms.push({id:'a'+floor,floor,name:'Khách',type:'living',x:1,y:1,w:3,h:4},{id:'b'+floor,floor,name:'Ngủ',type:'bed',x:4,y:1,w:3,h:4},{id:'s'+floor,floor,name:'Thang',type:'stairs',x:1,y:5,w:3,h:4},{id:'h'+floor,floor,name:'Sảnh',type:'corridor',x:4,y:5,w:3,h:2},{id:'e'+floor,floor,name:'Thang máy',type:'elevator',x:4,y:7,w:1.8,h:2,elevator:{shaftId:'lift',cabinWidth:1.1,cabinDepth:1.3,doorWidth:.8,doorSide:'north',model:'TEST-FIXTURE',pitDepth:.3,headroom:3}},{id:'c'+floor,floor,name:'Phụ trợ',type:'corridor',x:5.8,y:7,w:1.2,h:2});p.plan.openings=[{id:'d',floor:0,roomId:'a0',kind:'door',side:'east',offset:.17,width:1.1,height:2.2},{id:'w',floor:1,roomId:'b1',kind:'window',side:'east',offset:.72,width:1.6,height:1.45,sill:.8},...p.plan.rooms.filter(r=>r.type==='elevator').map(r=>({...B.elevatorLanding(r),id:'lift-door-'+r.floor}))];}
 return B;
}
const close=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-7,`${actual} ≠ ${expected}`);
test('roof appearance follows the selected style and keeps a customer override separate from supplier SKU',()=>{
 const b=client();assert.equal(b.roofSurfaceSpec().surface,'tile');assert.equal(b.roofSurfaceSpec().color,'#9f5636');b.selectHouseStyle('scandi');assert.equal(b.roofSurfaceSpec().surface,'metal');b.measuredDesignSettings().roof.surface='tile';b.measuredDesignSettings().roof.color='#332211';assert.equal(b.roofSurfaceSpec().surface,'tile');assert.equal(b.roofSurfaceSpec().color,'#332211');assert.match(b.roofSurfaceSpec().notice,/chưa xác nhận quy cách/);assert.equal(b.state.project.materials.choices.floor,'tile');
});
test('style roof vertices and takeoff agree with analytical areas, drawings and elevations',()=>{
 const b=client(),p=b.state.project,d=b.measuredDesignSettings();assert.equal(b.measuredDesignReview().geometryValid,true);
 let roof=b.sceneRoofSpec();assert.equal(roof.type,'hip');close(roof.width,7.2);close(roof.depth,9.2);close(roof.area,roof.width*roof.depth/Math.cos(28*Math.PI/180));assert.match(b.roofSheetSvg(),/7200 mm/);assert.match(b.elevationSvg(),/data-projection-roof/);
 const rev=b.drawingRevision();b.selectHouseStyle('scandi');roof=b.sceneRoofSpec();assert.equal(roof.type,'gable');assert.equal(roof.faces.length,2);assert.equal(roof.gables.length,2);close(roof.area,roof.width*roof.depth/Math.cos(30*Math.PI/180));assert.notEqual(b.drawingRevision(),rev);
 d.roof.type='mono';roof=b.sceneRoofSpec();close(roof.area,roof.width*roof.depth/Math.cos(30*Math.PI/180));assert.ok(roof.rise>0);assert.ok(roof.gables.length===3);assert.doesNotMatch(b.sectionSvg(),/NaN|undefined/);
 d.roof.type='flat';d.roof.overhang=0;roof=b.sceneRoofSpec();assert.equal(roof.type,'flat');assert.ok(roof.area<48);p.plan.rooms=p.plan.rooms.filter(r=>r.id!=='b1');d.roof.type='gable';assert.equal(b.sceneRoofSpec(),null);assert.ok(b.measuredDesignReview().warnings.some(x=>/không chữ nhật/.test(x)));d.roof.type='flat';assert.ok(b.sceneRoofSpec());
});
test('one shared opening is measured once; slabs subtract the same stair and shaft panels as WebGL',()=>{
 const b=client(),q=b.measuredQuantities();close(q.doorArea,1.1*2.2+2*.8*2.1);close(q.windowArea,1.6*1.45);
 for(const f of q.floors){const expected=b.floorRooms(f.floor).flatMap(r=>b.slabPanels(r,b.stairFloorHoles(f.floor))).reduce((n,p)=>n+p.w*p.d,0);close(f.slabArea,expected);assert.ok(f.floorFinish<f.slabArea);}
 assert.equal(q.floors.flatMap(f=>f.rooms).filter(r=>r.type==='elevator').every(r=>r.floorFinish===0),true);
 const before=q.paintArea;b.state.project.site.floorHeight=4;assert.ok(b.measuredQuantities().paintArea>before);close(b.stairSpec(b.state.project.plan.rooms.find(r=>r.id==='s0')).rise,4);assert.notEqual(b.drawingRevision(),q.revision);
});
test('measured wall thickness appears in drawing fills, CAD and finish deductions',()=>{
 const b=client(),q=b.measuredQuantities(),d=b.measuredDesignSettings();d.wallThickness.exterior=.3;d.wallThickness.interior=.2;
 assert.ok(b.measuredQuantities().floorFinish<q.floorFinish);assert.ok(b.scenePlanGeometry(b.state.project.plan,0).walls.some(w=>w.thickness===.3));assert.match(b.archWallsSvg(0),/height="0.3"/);const dxf=b.planDxf(0);assert.ok(dxf.includes('20\r\n-850\r\n'));assert.ok(dxf.includes('20\r\n-1150\r\n')); // .300 m wall boundaries in mm
});
test('invalid and duplicate geometry blocks measured handoff, not project backups',async()=>{
 const b=client();b.state.project.plan.rooms[1].x=3.5;assert.equal(b.measuredDesignReview().geometryValid,false);assert.equal(await b.exportCustomerPackage(),false);
 b.state.project.plan.rooms[1].x=4;b.state.project.plan.openings.push({...b.state.project.plan.openings[0],id:'other'});assert.ok(b.measuredGeometryIssues().some(i=>/trùng một ô/.test(i.text)));assert.equal(await b.exportCustomerPackage(),false);
 b.state.project.plan.openings.pop();b.state.project.plan.openings[0].width=5;assert.ok(b.measuredGeometryIssues().some(i=>/Ô mở/.test(i.text)));
});
test('quotes require scope, source/date and compatible units; supply includes separately entered labour/tax/waste',()=>{
 const b=client(),p=b.state.project,c=b.measuredPriceConfig('floor');p.dataEngine.materialOverrides.tile={value:200000,unit:'m²',source:'Fixture quote',date:'2026-10-01'};
 assert.equal(b.measuredMaterialQuote('floor').valid,false);c.scope='supply';assert.equal(b.measuredMaterialQuote('floor').valid,false);Object.assign(c,{labourPerM2:70000,wastePct:5,taxPct:8});let q=b.measuredMaterialQuote('floor');assert.equal(q.valid,true);close(q.quantity,b.measuredQuantities().floorFinish);close(q.purchasedQuantity,q.quantity*1.05);assert.equal(q.amount,q.supplyAmount+q.labourAmount+q.taxAmount);
 p.dataEngine.materialOverrides.tile.unit='lít';assert.equal(b.measuredMaterialQuote('floor').valid,false);p.dataEngine.materialOverrides.tile.unit='m²';p.dataEngine.materialOverrides.tile.date='2026-02-30';assert.equal(b.measuredMaterialQuote('floor').valid,false);p.dataEngine.materialOverrides.tile.date='2026-10-01';c.quantityOverride=80;q=b.measuredMaterialQuote('floor');assert.equal(q.quantity,80);assert.equal(q.quantitySource,'customer-entry');
 p.dataEngine.materialOverrides.tile.value=Number.MAX_SAFE_INTEGER;assert.equal(b.measuredMaterialQuote('floor').valid,false);assert.ok(Number.isSafeInteger(b.estimate().total));
});
test('BOQ is reconciled without invented structural material quantities; unquoted lift scope stays unknown',()=>{
 const b=client(),e=b.estimate(),boq=b.boqSchedule();assert.equal(e.area,96);assert.equal(e.areaSource,'plan');assert.ok(e.unpricedScopes.some(x=>x.id==='lift'));assert.equal(boq.find(x=>x.code==='EX-lift').amount,null);assert.equal(boq.filter(x=>x.group==='Phần thô').every(x=>x.unit==='gói'),true);assert.equal(boq.reduce((n,r)=>n+(r.amount??0),0),e.total);
 const previous=e.total;b.costPlanState().extras.lift={amount:350000000,source:'Fixture lift installation',date:'2026-10-01'};const after=b.estimate();assert.equal(after.total-previous,385000000);assert.equal(b.boqSchedule().reduce((n,r)=>n+(r.amount??0),0),after.total);
 assert.equal(b.materialSchedule().find(x=>x.group==='Kết cấu / MEP').qty,null);assert.match(b.dossierPrintHtml(),/Chưa giá/);
});
test('quote comparison uses the same waste, tax, labour and quantity without altering geometry',()=>{
 const b=client(),c=b.measuredPriceConfig('floor');Object.assign(c,{scope:'supply',labourPerM2:50000,wastePct:7,taxPct:10,alternativePrice:180000,alternativeSource:'Same SKU supplier',alternativeDate:'2026-10-01'});b.state.project.dataEngine.materialOverrides.tile={value:200000,unit:'m²',source:'Fixture',date:'2026-10-01'};
 const before=b.drawingRevision(),q=b.measuredMaterialQuote('floor'),other=b.measuredComparison('floor');assert.ok(other.saving>0);assert.equal(other.saving,q.amount-other.amount);assert.equal(b.drawingRevision(),before);c.scope='unknown';assert.equal(b.measuredComparison('floor'),null);
});
test('budget snapshots survive edits/reload and progress is individually entered, never inferred from spending',()=>{
 const b=client();b.state.project.dossier.progress=80;assert.equal(b.measuredProgress().known,0);assert.equal(b.dossierSchedule().every(s=>s.progress===null),true);
 const baseline=b.captureBudgetBaseline();assert.ok(baseline);assert.equal(baseline.stages.reduce((n,s)=>n+s.amount,0),baseline.total);const amounts=b.dossierSchedule().map(s=>s.amount);b.state.project.site.floorHeight=4;Object.assign(b.costPlanState().extras,{lift:{amount:300000000,source:'Fixture',date:'2026-10-01'}});assert.notEqual(b.estimate().total,baseline.total);assert.deepEqual(b.dossierSchedule().map(s=>s.amount),amounts);
 b.state.project.dossier.stageProgress.foundation=100;b.state.project.dossier.actualCosts.structure=1000000;assert.equal(b.dossierSchedule().find(s=>s.id==='structure').progress,null);assert.equal(b.measuredProgress().percent,10);assert.equal(b.measuredProgress().complete,false);
 const restored=client(b.state);assert.equal(restored.activeBudgetBaseline().total,baseline.total);assert.equal(restored.dossierSchedule().find(s=>s.id==='foundation').progress,100);assert.equal(restored.measuredPriceConfig('floor').scope,b.measuredPriceConfig('floor').scope);assert.equal(restored.sceneRoofSpec().eave,b.sceneRoofSpec().eave);
});
test('roof and style edits share plan undo while quote edits do not invalidate design revision',()=>{
 const b=client(),before=b.drawingRevision();b.pushPlanHistory();b.measuredDesignSettings().roof.overhang=.8;assert.notEqual(b.drawingRevision(),before);b.undoPlan();assert.equal(b.drawingRevision(),before);b.redoPlan();assert.equal(b.roofDesignSpec().overhang,.8);
 b.selectHouseStyle('scandi');assert.equal(b.roofDesignSpec().type,'gable');b.undoPlan();assert.equal(b.state.project.style,'Việt Nam đương đại');const key=b.drawingRevision();b.costPlanState().contingencyPct=20;assert.equal(b.drawingRevision(),key);
});
test('customer cost export carries geometry and unknown scopes without household/bank/account data',()=>{
 const b=client();b.state.project.finance.cash=987654321;b.state.project.household.children=[{name:'PRIVATE-FAMILY'}];const s=b.measuredCostSnapshot(),data=JSON.stringify(s);assert.doesNotMatch(data,/987654321|PRIVATE-FAMILY|ownerBirth|finance|access/);assert.equal(s.revision,s.quantities.revision);assert.ok(s.unpricedScopes.length);assert.equal(s.boq.reduce((n,r)=>n+(r.amount??0),0),s.totalKnownBudget);
});
