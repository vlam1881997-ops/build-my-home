import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {designClient} from './fixtures/design-client.mjs';
import {materialPriceEvidence} from '../server/_material_catalog.mjs';
const plain=x=>JSON.parse(JSON.stringify(x));
const make=()=>{const b=designClient({identity:true});b.autoPlanConcept();b.state.project.materials.finish={exterior:null,rooms:{}};b.materialPriceEvidence=materialPriceEvidence;return b;};

test('picture-first showroom exposes all 17 finishes with visible selection and honest photo versus simulation labels',()=>{
 const b=make(),p=b.state.project,room=p.plan.rooms.find(r=>r.type==='living');b.state.ui.step=5;b.state.ui.sceneFocus='room:'+room.id;b.selectShowroomFinish('white-marble',room.id);
 const seen=new Set();for(const category of ['floor','paint','cabinetry']){b.state.ui.materialCategory=category;const html=b.showroomChoiceBoardHtml();for(const m of html.matchAll(/data-showroom-finish="([^"]+)"/g))seen.add(m[1]);assert.match(html,/Phòng áp dụng/);assert.match(html,/data-showroom-choice-view/);assert.match(html,/chưa phải ảnh đúng mã hàng/);assert.doesNotMatch(html,/data-cinematic-render|data-render-sharp/);}
 assert.equal(seen.size,17);b.state.ui.materialCategory='floor';let html=b.showroomChoiceBoardHtml();assert.match(html,/data-showroom-finish="white-marble" aria-pressed="true"/);assert.match(html,/Ảnh bề mặt · phối màu BMH/);assert.match(html,/Mẫu bề mặt mô phỏng/);assert.match(html,/data-picked-finish="floor"/);
 room.name='<img src=x onerror=bad>';html=b.showroomChoiceBoardHtml();assert.ok(html.includes('&lt;img src=x onerror=bad&gt;'));assert.doesNotMatch(html,/<img src=x/);
});
test('choosing a pictured finish stays in materials, changes the target room only and survives real save/load',()=>{
 const b=make(),p=b.state.project,living=p.plan.rooms.find(r=>r.type==='living'),bed=p.plan.rooms.find(r=>r.type==='bed');b.state.ui.step=5;
 const plan=JSON.stringify(p.plan),choices=JSON.stringify(p.materials.choices),cost=JSON.stringify(p.costPlan),other=JSON.stringify(b.finishPalette(bed.id)),style=p.style;
 assert.equal(b.selectShowroomFinish('dark-walnut',living.id),true);assert.equal(b.state.ui.step,5);assert.equal(b.state.ui.sceneFocus,'room:'+living.id);assert.equal(b.finishPalette(living.id).visualMaterials.accent,'dark-walnut');assert.equal(JSON.stringify(b.finishPalette(bed.id)),other);assert.equal(JSON.stringify(p.plan),plan);assert.equal(JSON.stringify(p.materials.choices),choices);assert.equal(JSON.stringify(p.costPlan),cost);assert.equal(p.style,style);
 b.save();b.state=b.loadState();assert.equal(b.state.ui.step,5);assert.equal(b.finishPalette(living.id).visualMaterials.accent,'dark-walnut');
});
test('only the explicit preview action enters 3D with the same room and finishes; invalid targets do nothing',()=>{
 const b=make(),p=b.state.project,room=p.plan.rooms.find(r=>r.type==='living'),stair=p.plan.rooms.find(r=>r.type==='stairs');b.state.ui.step=5;
 const before=JSON.stringify(b.state);for(const [profile,id]of [['missing',room.id],['white-marble','gone'],['white-marble',stair.id]])assert.equal(b.selectShowroomFinish(profile,id),false);assert.equal(b.openShowroomFinishPreview('gone'),false);assert.equal(JSON.stringify(b.state),before);
 b.selectShowroomFinish('natural-linen',room.id);const saved=JSON.stringify(p);assert.equal(b.state.ui.step,5);assert.equal(b.openShowroomFinishPreview(room.id),true);assert.equal(b.state.ui.step,6);assert.equal(b.state.ui.sceneFocus,'room:'+room.id);assert.equal(b.state.ui.designView,'room');assert.equal(b.state.ui.modelLook,'materials');assert.equal(JSON.stringify(p),saved);
});
test('empty showroom retains browsable pictures and prevents roomless choices',()=>{
 const b=make();b.state.project.plan.rooms=[];const before=JSON.stringify(b.state.project),html=b.showroomChoiceBoardHtml();assert.match(html,/Chưa có phòng/);assert.match(html,/data-showroom-finish="oak-floor"[^>]*disabled/);assert.match(html,/data-showroom-choice-view disabled/);assert.equal(b.selectShowroomFinish('oak-floor','gone'),false);assert.equal(JSON.stringify(b.state.project),before);
});

test('the chosen palette displays the exact available room sample and never borrows another room or stale SKU image',()=>{
 const b=make(),p=b.state.project,room=p.plan.rooms.find(r=>r.type==='living'),bed=p.plan.rooms.find(r=>r.type==='bed'),product={id:'qa-sample-floor',category:'floor',sku:'QA-700',specification:'700x1100 mm',unit:'m²'};
 p.materials.choices.floor=product.id;p.dataEngine.materialOverrides[product.id]={product};b.applyCatalogMaterial('floor','white-marble',{roomId:room.id,scope:'room'});const binding=p.materials.finish.rooms[room.id].catalogMaterials.floor;
 binding.sample={mediaId:'material-sample-board-123',productId:binding.productId,sku:binding.sku,specification:binding.specification,realWorldScale:[.7,1.1],rotationDeg:0,sourceReference:'QA ONLY supplied sample'};b.materialSampleForBinding=x=>x?.sample?.mediaId===binding.sample.mediaId?{image:{src:'data:image/jpeg;base64,QA_SAMPLE'}}:null;
 b.state.ui.sceneFocus='room:'+room.id;assert.ok(b.showroomRoomSample('floor',room.id));let html=b.showroomChoiceBoardHtml();assert.match(html,/data-showroom-room-sample/);assert.match(html,/Ảnh mẫu đã gắn · QA-700/);assert.match(html,/data:image\/jpeg;base64,QA_SAMPLE/);
 b.state.ui.sceneFocus='room:'+bed.id;assert.equal(b.showroomRoomSample('floor',bed.id),null);assert.doesNotMatch(b.showroomChoiceBoardHtml(),/QA_SAMPLE/);
 product.sku='CHANGED';assert.equal(b.showroomRoomSample('floor',room.id),null);b.state.ui.sceneFocus='room:'+room.id;assert.doesNotMatch(b.showroomChoiceBoardHtml(),/QA_SAMPLE/);
});
test('saving a supplier sample stays in materials and rejects a late UI jump after navigation or project switch',async()=>{
 const b=make(),room=b.state.project.plan.rooms.find(r=>r.type==='living');b.state.ui.step=5;b.applyCatalogSample=async()=>({ok:true});let r=await b.saveShowroomSample('floor',{scope:'room',roomId:room.id});assert.equal(r.showInMaterials,true);assert.equal(b.state.ui.step,5);assert.equal(b.state.ui.sceneFocus,'room:'+room.id);
 for(const move of ['navigate','project']){let finish;b.applyCatalogSample=()=>new Promise(resolve=>finish=resolve);const pending=b.saveShowroomSample('floor',{scope:'room',roomId:room.id});b.state.ui.sceneFocus='unchanged';if(move==='navigate')b.state.ui.step=6;else b.state.project=structuredClone(b.state.project);finish({ok:true});r=await pending;assert.equal(r.showInMaterials,false);assert.equal(b.state.ui.sceneFocus,'unchanged');b.state.ui.step=5;}
 const before=JSON.stringify(b.state);b.applyCatalogSample=async()=>({ok:false,reason:'invalid fixture'});assert.equal((await b.saveShowroomSample('floor',{})).ok,false);assert.equal(JSON.stringify(b.state),before);
});

test('photographed surface choices change only the target room and survive project serialization',()=>{
 const b=make(),p=b.state.project,living=p.plan.rooms.find(r=>r.type==='living'),bed=p.plan.rooms.find(r=>r.type==='bed');
 const plan=JSON.stringify(p.plan),choices=JSON.stringify(p.materials.choices),other=JSON.stringify(b.finishPalette(bed.id)),style=p.style;
 assert.equal(b.applyMaterialPhoto('marble_01',living.id),true);assert.equal(b.finishPalette(living.id).visualMaterials.floor,'white-marble');
 assert.equal(JSON.stringify(p.plan),plan);assert.equal(JSON.stringify(p.materials.choices),choices);assert.equal(JSON.stringify(b.finishPalette(bed.id)),other);assert.equal(p.style,style);
 const restored=make();restored.state.project=plain(p);assert.equal(restored.finishPalette(living.id).visualMaterials.floor,'white-marble');
 assert.equal(b.applyMaterialPhoto('terrazzo_tiles',living.id),true);assert.equal(b.finishPalette(living.id).visualMaterials.floor,'ivory-terrazzo');
});
test('photograph selection cannot target a removed room, shaft or a reference-only image',()=>{
 const b=make(),p=b.state.project,room=p.plan.rooms.find(r=>r.type==='living'),stair=p.plan.rooms.find(r=>r.type==='stairs'),before=JSON.stringify(p);
 for(const [photo,id] of [['unknown',room.id],['wood_floor','missing'],['brick_wall_001',room.id],['wood_floor',stair.id]])assert.equal(b.applyMaterialPhoto(photo,id),false);
 assert.equal(JSON.stringify(p),before);
});
test('every selectable surface photograph has local colour/normal/roughness maps and honest SKU wording',()=>{
 const b=make(),manifest=JSON.parse(fs.readFileSync('assets/interior/photographic-provenance.json'));
 assert.equal(manifest.license,'CC0-1.0');
 for(const photo of b.MATERIAL_PHOTOS.filter(p=>p.profileId)){
  assert.ok(b.VISUAL_MATERIALS.some(p=>p.id===photo.profileId));assert.ok(fs.existsSync('assets/interior/photos/'+photo.id+'.jpg'));
  for(const channel of ['diff','nor_gl','rough'])assert.ok(fs.existsSync('assets/interior/textures/'+photo.id+'-'+channel+'.png'),photo.id+':'+channel);
 }
 const html=b.materialPhotoGallery('floor');assert.match(html,/data-material-photo-room/);assert.match(html,/data-material-photo-apply="marble_01"/);assert.match(html,/chưa phải ảnh đúng mã hàng/);assert.doesNotMatch(html,/<option value="all"/);
 b.state.project.plan.rooms=[];assert.match(b.materialPhotoGallery('floor'),/data-material-photo-apply="marble_01" disabled/);
});

test('whole-house collection defaults follow a new style without freezing colours or losing subsequent manual surfaces',()=>{
 const b=make(),p=b.state.project,r=p.plan.rooms.find(x=>x.type==='living');b.selectHouseStyle('japandi');b.applyInteriorCollection('warm-oak');
 const floorId=p.materials.choices.floor;b.applyVisualMaterial('floor','white-marble',r.id);b.applyFinishColor('wall','#abc123',r.id);
 const saved=JSON.stringify(p.materials),plan=JSON.stringify(p.plan);b.selectHouseStyle('industrial');
 const palette=b.finishPalette(r.id);assert.equal(b.interiorCollection(r.id).id,'loft-leather');assert.equal(palette.visualMaterials.fabric,'cognac-leather');assert.equal(palette.visualMaterials.accent,'dark-walnut');assert.equal(palette.visualMaterials.floor,'white-marble');assert.equal(palette.wall,'#abc123');
 const untouched=p.plan.rooms.find(x=>x.id!==r.id&&x.type==='bed');assert.equal(b.finishPalette(untouched.id).visualMaterials.floor,'grey-concrete');assert.equal(b.facadeFinishPalette().facadeSurface,'brick');assert.equal(p.materials.choices.floor,floorId);assert.equal(JSON.stringify(p.materials),saved);assert.equal(JSON.stringify(p.plan),plan);
 const restored=make();restored.state.project=plain(p);assert.equal(restored.finishPalette(r.id).visualMaterials.fabric,'cognac-leather');assert.equal(restored.finishPalette(r.id).wall,'#abc123');
});

test('large-area style cladding follows solid exterior bands and never covers the measured opening',()=>{
 const b=make(),p=b.state.project,plan=JSON.stringify(p.plan);
 for(const id of ['industrial','brutalist','barn']){b.selectHouseStyle(id);const parts=b.facadeComponents().filter(x=>x.kind==='style-cladding');assert.ok(parts.length>0,id);assert.ok(parts.reduce((area,x)=>area+b.facadeComponentArea(x),0)>30,id);
  for(const part of parts){assert.equal(part.role,'accent');assert.equal(part.styleId,id);for(const o of p.plan.openings.filter(o=>o.floor===part.floor)){const span=b.openingWallSpan(o);if(!span)continue;const horizontal=span.o==='h';if(horizontal!==part.horizontal)continue;const clear=b.openingReview(o),level=b.studioFloorLevel(part.floor),lo=level.base+level.slab+(clear.sill||0),hi=lo+clear.height,a=horizontal?part.x:part.z,end=a+(horizontal?part.w:part.d),axis=horizontal?part.z:part.x,depth=horizontal?part.d:part.w;if(Math.abs(axis-span.c)>b.measuredWallThickness(false)+depth)continue;assert.ok(Math.min(end,span.b)-Math.max(a,span.a)<1e-8||Math.min(part.y+part.h,hi)-Math.max(part.y,lo)<1e-8,id+' '+o.id);}}
 }
 assert.equal(JSON.stringify(p.plan),plan);
});

test('style selection leaves a stale presentation image and explains an explicitly retained roof',()=>{
 const b=make();b.state.ui.renderMode='cinematic';b.customerFrameCache={old:true};b.measuredDesignSettings().roof.type='flat';
 b.selectHouseStyle('scandi');assert.equal(b.state.ui.renderMode,'interactive');assert.equal(b.customerFrameCache,null);assert.match(b.styleModelSummaryHtml(),/đã chọn riêng/);assert.equal(b.roofDesignSpec().type,'flat');
 b.measuredDesignSettings().roof.type='auto';assert.equal(b.roofDesignSpec().type,'gable');assert.match(b.styleModelSummaryHtml(),/theo phong cách/);
});

test('outside finish survives both lot-edge walls without expanding the footprint or changing interior paint',()=>{
 const b=make(),p=b.state.project;p.site.floors=1;p.site.width=5;p.site.depth=20;
 p.plan={rooms:[{id:'edge-room',type:'living',name:'Khách',floor:0,x:.11,y:1.5,w:4.78,h:16}],openings:[],fixtures:[],outdoor:[],furniture:[],lockedRoomIds:[],lockedFloors:[]};
 p.materials.finish.rooms['edge-room']={wall:'#abc123',explicitRoles:{wall:true},visualMaterials:{wall:'ivory-paint'}};
 const plan=JSON.stringify(p.plan);b.selectHouseStyle('industrial');
 const parts=b.facadeComponents().filter(x=>x.kind==='style-cladding'),left=parts.filter(x=>x.projectionSide==='left'),right=parts.filter(x=>x.projectionSide==='right');assert.ok(left.length>0);assert.ok(right.length>0);
 assert.ok(left.every(x=>Math.abs(x.x)<1e-8));assert.ok(right.every(x=>Math.abs(x.x+x.w-5)<1e-8));assert.ok(parts.every(x=>x.x>=0&&x.x+x.w<=5+1e-8));
 assert.equal(b.finishPalette('edge-room').wall,'#abc123');assert.equal(JSON.stringify(p.plan),plan);
});

test('explicitly requesting suggested finishes releases legacy generic colours, retaining SKU bindings and manually mixed rooms',()=>{
 const b=make(),p=b.state.project,r=p.plan.rooms.find(x=>x.type==='living'),bed=p.plan.rooms.find(x=>x.type==='bed');
 const product={id:p.materials.choices.floor,category:'floor',sku:'test-only',specification:'test-only 20x100',unit:'m²'};b.materialResearch={products:[product]};
 p.materials.finish.exterior={wall:'#aabbcc',accent:'#776655',floor:'#eeccbb',visualMaterials:{wall:'grey-paint',accent:'natural-oak',floor:'oak-floor'},catalogMaterials:{floor:b.createCatalogMaterialBinding(product,'oak-floor')}};
 b.applyInteriorCollection('neo-elegance',bed.id);const mixed=JSON.stringify(p.materials.finish.rooms[bed.id]),products=JSON.stringify(p.materials.choices),plan=JSON.stringify(p.plan),bound=JSON.stringify(p.materials.finish.exterior.catalogMaterials);
 b.selectHouseStyle('industrial');assert.match(b.styleModelSummaryHtml(),/Vật liệu cũ đang được giữ/);assert.equal(b.applyStyleMaterialSuggestions(),true);
 assert.equal(b.facadeFinishPalette().wall,b.houseStyle().wall);assert.equal(b.facadeFinishPalette().facadeSurface,'brick');assert.equal(b.finishPalette(r.id).visualMaterials.fabric,'cognac-leather');assert.equal(b.finishPalette(r.id).visualMaterials.floor,'oak-floor');
 assert.equal(JSON.stringify(p.materials.finish.exterior.catalogMaterials),bound);assert.equal(JSON.stringify(p.materials.finish.rooms[bed.id]),mixed);assert.equal(JSON.stringify(p.materials.choices),products);assert.equal(JSON.stringify(p.plan),plan);
});

test('all locked 24 styles supply ten roles, traceable defaults and pending visual acceptance',()=>{
 const b=make(),scope=JSON.parse(fs.readFileSync('docs/team-v1/work-plan.json'));
 assert.deepEqual(Object.keys(b.STYLE_SPECIFICATIONS).sort(),scope.styleIds.slice().sort());
 const signatures=new Set();
 for(const id of scope.styleIds){
  const spec=b.styleSpecification(id),matrix=b.styleMaterialMatrix(id);assert.equal(matrix.length,10);assert.equal(new Set(matrix.map(x=>x.id)).size,10);
  assert.ok(b.INTERIOR_COLLECTIONS.some(x=>x.id===spec.collectionId));assert.equal(spec.acceptance.exterior,'pending');assert.equal(spec.source.engineeringApproved,false);
  signatures.add(JSON.stringify([spec.defaultMaterials,spec.roofIntent,spec.facadeIntent]));
  for(const row of matrix){assert.equal(row.styleId,id);assert.equal(row.quantity,null);assert.equal(row.selectedProductId,null);assert.equal(row.engineeringApproved,false);assert.ok(row.requirements.length>=3);if(row.visualPreview){assert.equal(row.visualPreview.exactness,'generic');assert.equal(row.visualPreview.textureAssetId,null);assert.ok(row.visualPreview.realWorldScale.every(n=>n>0));}}
  assert.equal(spec.budgetOptions.savingsVnd,null);
 }
 assert.equal(signatures.size,24);
 const copy=b.styleSpecification('japandi');copy.defaultMaterials.floor='broken';assert.equal(b.styleSpecification('japandi').defaultMaterials.floor,'oak-floor');
});

test('style defaults reach resolved finishes without moving any measured element or vendor selection',()=>{
 const b=make(),p=b.state.project,room=p.plan.rooms.find(x=>x.type==='living'),before=JSON.stringify({plan:p.plan,materials:p.materials});
 for(const style of b.HOUSE_STYLES){b.selectHouseStyle(style.id);const spec=b.styleSpecification(style.id),palette=b.finishPalette(room.id);assert.deepEqual(plain(palette.visualMaterials),plain(spec.defaultMaterials));assert.equal(b.customerStyleProfile().collection.id,spec.collectionId);assert.equal(JSON.stringify({plan:p.plan,materials:p.materials}),before);}
});

test('room colour, surface and manually chosen collection survive style changes and JSON restoration',()=>{
 const b=make(),p=b.state.project,room=p.plan.rooms.find(x=>x.type==='living');b.selectHouseStyle('japandi');b.applyInteriorCollection('neo-elegance',room.id);b.applyVisualMaterial('floor','white-marble',room.id);b.applyFinishColor('wall','#abcdef',room.id);const chosen=JSON.stringify(p.materials);
 for(const id of ['modern','minimal','coastal','japanese']){b.selectHouseStyle(id);assert.equal(b.interiorCollection(room.id).id,'neo-elegance');assert.equal(b.finishPalette(room.id).visualMaterials.floor,'white-marble');assert.equal(b.finishPalette(room.id).wall,'#abcdef');assert.equal(JSON.stringify(p.materials),chosen);}
 const restored=make();restored.state.project=plain(p);assert.equal(restored.finishPalette(room.id).visualMaterials.floor,'white-marble');assert.equal(restored.finishPalette(room.id).wall,'#abcdef');assert.equal(restored.interiorCollection(room.id).id,'neo-elegance');
});

test('automatic floor control follows the style brief while other explicit choices stay put',()=>{
 const b=make(),room=b.state.project.plan.rooms.find(x=>x.type==='living');b.selectHouseStyle('minimal');b.applyFinishSurface('auto',room.id);assert.equal(b.finishPalette(room.id).visualMaterials.floor,'ivory-tile');b.selectHouseStyle('japanese');assert.equal(b.finishPalette(room.id).visualMaterials.floor,'walnut-floor');
 b.applyFinishColor('wall','#abcdef',room.id);b.selectHouseStyle('industrial');assert.equal(b.finishPalette(room.id).wall,'#abcdef');assert.equal(b.finishPalette(room.id).visualMaterials.floor,'grey-concrete');
});

test('stale supplier binding falls back to the actual style surface rather than the shared collection',()=>{
 const b=make(),p=b.state.project,room=p.plan.rooms.find(x=>x.type==='living');b.selectHouseStyle('minimal');const product={id:'tile',category:'floor',sku:'TILE-600',unit:'m²',spec:'600×600'};b.materialResearch={products:[product]};p.materials.choices.floor=product.id;assert.equal(b.applyCatalogMaterial('floor','grey-concrete',{roomId:room.id}),true);const binding=plain(p.materials.finish.rooms[room.id].catalogMaterials.floor);product.sku='TILE-800';
 assert.equal(b.finishPalette(room.id).visualMaterials.floor,'ivory-tile');assert.equal(b.finishPalette(room.id).materialBindingStatuses.floor.status,'stale');assert.deepEqual(plain(p.materials.finish.rooms[room.id].catalogMaterials.floor),binding);
});

test('applying only a supplier floor does not freeze cached wall/wood/fabric defaults on the next style',()=>{
 const b=make(),p=b.state.project,room=p.plan.rooms.find(x=>x.type==='living');b.selectHouseStyle('japandi');const product={id:'tile',category:'floor',sku:'TILE-600',unit:'m²',spec:'600×600'};b.materialResearch={products:[product]};p.materials.choices.floor=product.id;assert.equal(b.applyCatalogMaterial('floor','oak-floor',{roomId:room.id}),true);
 b.selectHouseStyle('industrial');const palette=b.finishPalette(room.id),spec=b.styleSpecification('industrial');assert.equal(palette.visualMaterials.floor,'oak-floor');assert.equal(palette.visualMaterials.fabric,spec.defaultMaterials.fabric);assert.equal(palette.fabric,b.VISUAL_MATERIALS.find(x=>x.id==='cognac-leather').color);assert.equal(palette.visualMaterials.wall,'grey-paint');assert.equal(b.showroomFinishInfo(room.id)[0].id,product.id);
});

test('facade uses its style identity when a saved finish cache only marks the floor as authored',()=>{
 const b=make(),p=b.state.project;p.materials.finish.exterior={wall:'#f4eee4',accent:'#a47e51',floor:'#c7aa80',visualMaterials:{wall:'ivory-paint',accent:'natural-oak',floor:'oak-floor'},explicitRoles:{floor:true}};
 b.selectHouseStyle('industrial');const facade=b.facadeFinishPalette();assert.equal(facade.manualAccent,false);assert.equal(facade.manualWall,false);assert.equal(facade.facadeSurface,'brick');
 p.materials.finish.exterior.explicitRoles.accent=true;assert.equal(b.facadeFinishPalette().manualAccent,true);assert.equal(b.facadeFinishPalette().facadeSurface,'selected');
});

test('catalog filtering distinguishes curation from a source/sample check and checks role categories',()=>{
 const b=make();b.selectHouseStyle('japandi');const product={id:'x',category:'floor',name:'Vật liệu chưa có mẫu'};
 assert.equal(b.styleMaterialCompatibility(product).status,'needs-sample');assert.equal(b.materialStyleFits(product),true);
 assert.equal(b.styleMaterialCompatibility({...product,styleIds:['classic']}).status,'different-style');assert.equal(b.materialStyleFits({...product,styleIds:['classic']}),false);
 assert.equal(b.styleMaterialCompatibility({...product,styleIds:['japandi']}).status,'design-suggestion');assert.equal(b.styleMaterialCompatibility(product,{roleId:'joinery'}).status,'different-role');assert.equal(b.styleMaterialCompatibility(product,{roleId:'missing'}).recommended,false);
 b.state.project.style='Phong cách riêng';assert.equal(b.styleSpecification(),null);assert.equal(b.styleMaterialCompatibility(product).status,'unknown-style');
});

test('C02 bridge carries SKU, specification, unit and price evidence without inventing quantities or totals',()=>{
 const b=make(),p=b.state.project;b.selectHouseStyle('japandi');const product={id:'tile',category:'floor',sku:'TILE-600',specification:'600×600 mm',unit:'m²',price:null,priceEvidence:{amountVnd:null,quantityUnit:'m²',sourceUrl:'https://manufacturer.example/tile',retrievedAt:'2026-10-09'}};p.materials.choices.floor='tile';
 const before=JSON.stringify(p),schedule=b.styleMaterialSchedule(p,{products:[product]}),floor=schedule.rows.find(x=>x.id==='floor');assert.equal(schedule.rows.length,10);assert.equal(floor.sku,'TILE-600');assert.equal(floor.productUnit,'m²');assert.equal(floor.priceEvidence.amountVnd,null);assert.equal(floor.quantity,null);assert.equal(schedule.totalVnd,null);assert.equal(floor.applicationStatus,'requires-role-confirmation');assert.ok(floor.missing.includes('supplierSample'));assert.equal(schedule.rows.find(x=>x.id==='upholstery').selectionStatus,'missing');assert.equal(JSON.stringify(p),before);
 p.dataEngine.materialOverrides.tile={product:{...product,sku:'TILE-800',priceEvidence:{...product.priceEvidence,amountVnd:210000,priceType:'project-quote',quotedAt:'2026-10-09',validUntil:'2020-01-01'}}};const newer=b.styleMaterialSchedule(p,{products:[product]}).rows.find(x=>x.id==='floor');assert.equal(newer.sku,'TILE-800');assert.equal(newer.priceEvidence.priceType,'expired');assert.ok(newer.missing.includes('price'));assert.equal(newer.quantity,null);
 const missing=b.styleMaterialSchedule(p,{products:[]});assert.equal(missing.totalVnd,null);
});

test('another project/custom style never inherits the active project style, bindings or drawing revision',()=>{
 const b=make();b.selectHouseStyle('japandi');const other=plain(b.state.project);other.style='Phong cách khách tự đặt';const result=b.styleMaterialSchedule(other);assert.equal(result.recognized,false);assert.equal(result.styleId,null);assert.equal(result.designRevision,null);assert.equal(result.rows.length,0);
 other.style=b.HOUSE_STYLES.find(x=>x.id==='industrial').name;const schedule=b.styleMaterialSchedule(other);assert.equal(schedule.styleId,'industrial');assert.equal(schedule.designRevision,null);schedule.bindings.rooms.hacked={wall:'#abcdef'};assert.equal(other.materials.finish.rooms.hacked,undefined);
});

test('showroom brief is compact, escapes custom input and has no action that changes customer choices',()=>{
 const b=make();b.selectHouseStyle('minimal');const before=JSON.stringify(b.state.project),html=b.styleMaterialBriefHtml('floor');assert.match(html,/Tối giản/);assert.match(html,/Quy cách cần chốt/);assert.match(html,/Khu ướt/);assert.doesNotMatch(html,/<button/);assert.equal(JSON.stringify(b.state.project),before);assert.ok(b.styleMaterialMatrix('minimal').some(x=>x.id==='roof'&&x.category==='waterproof'));
});


function sampleScopeFixture(){const B=designClient();B.state.ui.sceneFocus='room:sample-room';B.state.project.plan.rooms=[{id:'sample-room',type:'living',name:'Sample fixture',floor:0,x:1,y:1,w:4,h:5}];const product={id:'sample-product',category:'floor',sku:'TEST-700-1100',specification:'700x1100 mm',unit:'m²'};B.state.project.materials.choices.floor=product.id;B.state.project.dataEngine.materialOverrides[product.id]={product};B.applyCatalogMaterial('floor','ivory-tile',{roomId:'sample-room',scope:'room'});const binding=B.state.project.materials.finish.rooms['sample-room'].catalogMaterials.floor;binding.sample={mediaId:'material-sample-test-123',productId:binding.productId,sku:binding.sku,specification:binding.specification,realWorldScale:[.7,1.1],rotationDeg:37,sourceReference:'Synthetic test'};return {B,product,binding};}

test('reapplying a SKU preserves only its own valid same-profile room sample',()=>{
 const {B,product,binding}=sampleScopeFixture(),expected=plain(binding.sample),p=B.state.project;
 p.plan.rooms.push({id:'other-room',name:'Other room',type:'bed',floor:0,x:5,y:1,w:4,h:5});
 assert.equal(B.applyCatalogMaterial('floor','ivory-tile',{scope:'all'}),true);
 assert.deepEqual(plain(B.finishPalette('sample-room').catalogMaterials.floor.sample),expected);
 assert.equal(B.finishPalette('other-room').catalogMaterials.floor.sample,undefined);
 assert.equal(p.materials.finish.exterior.catalogMaterials.floor.sample,undefined);
 B.applyCatalogMaterial('floor','grey-concrete',{scope:'room',roomId:'sample-room'});
 assert.equal(B.finishPalette('sample-room').catalogMaterials.floor.sample,undefined);
 B.applyCatalogMaterial('floor','ivory-tile',{scope:'room',roomId:'sample-room'});
 p.materials.finish.rooms['sample-room'].catalogMaterials.floor.sample=expected;product.sku='CHANGED-SKU';
 B.applyCatalogMaterial('floor','ivory-tile',{scope:'room',roomId:'sample-room'});
 assert.equal(B.finishPalette('sample-room').catalogMaterials.floor.sample,undefined);
});

test('saving showroom product stays in materials and explicit preview does not rewrite bindings',()=>{
 const {B,binding}=sampleScopeFixture();B.state.ui.step=5;
 assert.equal(B.applyShowroomProduct('floor','ivory-tile','room:sample-room'),true);
 assert.equal(B.state.ui.step,5);const before=JSON.stringify(B.state.project);
 assert.equal(B.openShowroomProductPreview('floor','ivory-tile','room:sample-room'),true);
 assert.equal(B.state.ui.step,6);assert.equal(JSON.stringify(B.state.project),before);
 assert.equal(B.finishPalette('sample-room').catalogMaterials.floor.sample.mediaId,binding.sample.mediaId);
 for(const target of ['room:removed','exterior','unknown'])assert.equal(B.openShowroomProductPreview('floor','ivory-tile',target),false);
 assert.equal(B.openShowroomProductPreview('floor','grey-concrete','room:sample-room'),false);
});

test('showroom product defaults to focused room and exposes separate save, preview and sample inspection',()=>{
 const {B,binding}=sampleScopeFixture();B.materialSampleForBinding=b=>b?.sample?{image:{src:'data:image/jpeg;base64,AAAA'},mediaId:b.sample.mediaId}:null;
 const html=B.showroomPreviewHtml('floor');assert.match(html,/value="room:sample-room" selected/);assert.match(html,/data-showroom-apply="floor"/);assert.match(html,/data-showroom-3d="floor"/);assert.match(html,/data-showroom-apply-view/);assert.match(html,/Lưu và xem 3D/);
 assert.match(html,/data-material-sample-open="material-sample-test-123"/);
 const details=B.materialSampleDetails(binding.sample.mediaId);assert.equal(details.binding.sample.sourceReference,'Synthetic test');assert.deepEqual(plain(details.binding.sample.realWorldScale),[.7,1.1]);
 B.state.project=structuredClone(B.state.project);B.state.project.materials.finish={exterior:null,rooms:{}};assert.equal(B.materialSampleDetails(binding.sample.mediaId),null);
});

test('exterior reapply and explicit preview preserve the exterior sample and interior state',()=>{
 const {B}=sampleScopeFixture(),p=B.state.project,product={id:'outside-paint',category:'paint',sku:'PAINT-OUTSIDE',specification:'Exterior paint sample',unit:'m²'};
 p.materials.choices.paint=product.id;p.dataEngine.materialOverrides[product.id]={product};B.applyShowroomProduct('paint','sand-plaster','exterior');
 const binding=p.materials.finish.exterior.facadeMaterials.paint;binding.sample={mediaId:'material-sample-outside',productId:product.id,sku:product.sku,specification:product.specification,sourceReference:'Synthetic exterior',realWorldScale:[1,1],rotationDeg:0};
 const before=plain(p);B.applyShowroomProduct('paint','sand-plaster','exterior');assert.deepEqual(plain(p),before);
 const html=B.showroomPreviewHtml('paint');assert.match(html,/value="exterior" selected/);assert.match(html,/value="sand-plaster" selected/);
 assert.equal(B.openShowroomProductPreview('paint','sand-plaster','exterior'),true);assert.equal(B.state.ui.sceneFocus,'all');assert.equal(B.state.ui.designView,'exterior');assert.deepEqual(plain(p),before);
});

test('image storage reports success only after commit and rejects a late disk abort',async()=>{
 for(const abort of [false,true]){
  let openRequest,request,transaction;
  const B={projectMediaScope:async()=> 'scope-a',projectMediaKey:(scope,id)=>scope+':'+id};
  const indexedDB={open(){openRequest={};return openRequest;}};
  const source=fs.readFileSync('src/104_style_reference.js','utf8');vm.runInNewContext(source.slice(0,source.indexOf(' const preview=B.v6FilePreview;'))+'})();',{BMH:B,indexedDB,Error});
  let settled=false;const pending=B.styleReferenceStore.put('sample','pixels').then(()=>{settled=true;return true;},()=>{settled=true;return false;});
  await new Promise(setImmediate);
  openRequest.result={transaction(){transaction={objectStore:()=>({put(){request={};return request;}})};return transaction;}};openRequest.onsuccess();
  await new Promise(setImmediate);request.result='key';request.onsuccess();
  await new Promise(setImmediate);assert.equal(settled,false,'request success is not transaction durability');
  if(abort)transaction.onabort();else transaction.oncomplete();assert.equal(await pending,!abort);
 }
});

async function portableSampleFixture(){
 const {B,binding}=sampleScopeFixture(),bytes='data:image/jpeg;base64,/9j/AAAA',storage=new Map([['source-project:'+binding.sample.mediaId,bytes]]),writes=[];
 B.state.meta.localProjectId='source-project';B.clearCloudLink=state=>Object.assign(state.meta,{cloudProjectId:'',cloudOwnerId:'',cloudRevision:null,cloudUpdatedAt:null});
 let sequence=0;const document={addEventListener(){},querySelector:()=>null},window={addEventListener(){}};
 vm.runInNewContext(fs.readFileSync('src/82_customer_projects.js','utf8'),{BMH:B,document,window,structuredClone,Blob,console,Date,URL,clearTimeout(){},setTimeout(){return 1;},crypto:{randomUUID:()=> 'home-import-'+(++sequence)}});
 await B.projects.ready;B.projectDb=async()=>({});B.projects.activeId='source-project';
 B.saveCustomerProject=async()=>{B.projects.activeId||='home-created-'+(++sequence);B.state.meta.localProjectId=B.projects.activeId;writes.push({id:B.projects.activeId,state:structuredClone(B.state)});return B.projects.activeId;};
 B.projectMediaScope=async()=>B.state.meta.localProjectId;B.styleReferenceStore={get:async(id,options)=>{assert.equal(options.legacy,false);return storage.get(options.scope+':'+id)||null;},putMany:async(rows,{scope})=>{for(const row of rows)storage.set(scope+':'+row.mediaId,row.dataUrl);}};
 B.validateMaterialSamplePixels=async files=>{for(const row of files)assert.equal(row.dataUrl,bytes);};
 return {B,binding,bytes,storage,writes};
}

test('portable backup imports exact sample bytes into a fresh project scope and preserves SKU/scale/room',async()=>{
 const {B,binding,bytes,storage}=await portableSampleFixture(),snapshot=await B.prepareProjectBackup();
 assert.equal(snapshot.materialSampleFiles.files.length,1);assert.equal(snapshot.materialSampleFiles.files[0].dataUrl,bytes);assert.deepEqual(plain(snapshot.materialSampleFiles.missing),[]);assert.equal(snapshot.access.paid,false);
 snapshot.meta.localProjectId='forged-other-project';snapshot.meta.cloudProjectId='foreign-cloud';const before=plain(snapshot.project.materials.finish);
 const imported=await B.importProjectJson(new Blob([JSON.stringify(snapshot)]));assert.notEqual(imported.meta.localProjectId,'source-project');assert.notEqual(imported.meta.localProjectId,'forged-other-project');assert.equal(imported.meta.cloudProjectId,'');
 assert.equal(storage.get(imported.meta.localProjectId+':'+binding.sample.mediaId),bytes);assert.equal(storage.get('source-project:'+binding.sample.mediaId),bytes);assert.deepEqual(plain(imported.project.materials.finish),before);
 const again=await B.prepareProjectBackup();assert.equal(again.materialSampleFiles.files[0].dataUrl,bytes);assert.deepEqual(plain(again.project.materials.finish),before);
});

test('portable backups disclose missing pixels, never read another project and reject stale assembly',async()=>{
 const {B,binding,bytes,storage}=await portableSampleFixture();storage.delete('source-project:'+binding.sample.mediaId);storage.set('other-project:'+binding.sample.mediaId,bytes);
 const snapshot=await B.prepareProjectBackup();assert.deepEqual(plain(snapshot.materialSampleFiles.files),[]);assert.deepEqual(plain(snapshot.materialSampleFiles.missing),[binding.sample.mediaId]);
 B.styleReferenceStore.get=async()=>{B.state.project.name='Edited while exporting';return bytes;};await assert.rejects(()=>B.prepareProjectBackup(),/thay đổi/);
});

test('portable import rejects unbound, duplicate, forged images and disk failure before replacing the open design',async()=>{
 const {B,binding}=await portableSampleFixture(),snapshot=await B.prepareProjectBackup(),old=B.state;
 const attempts=[s=>s.materialSampleFiles.files[0].mediaId='material-sample-foreign',s=>s.materialSampleFiles.files.push({...s.materialSampleFiles.files[0]}),s=>s.materialSampleFiles.files[0].dataUrl='data:text/html;base64,AAAA',s=>s.materialSampleFiles.missing.push(binding.sample.mediaId),s=>s.materialSampleFiles.files=[]];
 for(const change of attempts){const input=structuredClone(snapshot);change(input);await assert.rejects(()=>B.importProjectJson(new Blob([JSON.stringify(input)])));assert.equal(B.state,old);}
 B.styleReferenceStore.putMany=async()=>{throw Error('disk aborted');};await assert.rejects(()=>B.importProjectJson(new Blob([JSON.stringify(snapshot)])),/disk aborted/);assert.equal(B.state,old);assert.equal(B.projects.activeId,'source-project');
});

test('portable import preserves a concurrent edit and rolls back a failed project write',async()=>{
 const {B}=await portableSampleFixture(),snapshot=await B.prepareProjectBackup(),old=B.state,oldId=B.projects.activeId;
 B.validateMaterialSamplePixels=async()=>{B.state.project.name='Keep this edit';};
 await assert.rejects(()=>B.importProjectJson(new Blob([JSON.stringify(snapshot)])),/đã thay đổi/);assert.equal(B.state,old);assert.equal(B.state.project.name,'Keep this edit');
 B.validateMaterialSamplePixels=async()=>{};let saves=0;const save=B.saveCustomerProject;B.saveCustomerProject=async()=>{if(++saves===2)throw Error('project disk full');return save();};
 await assert.rejects(()=>B.importProjectJson(new Blob([JSON.stringify(snapshot)])),/project disk full/);assert.equal(B.state,old);assert.equal(B.projects.activeId,oldId);assert.equal(B.state.project.name,'Keep this edit');
});

test('batch sample writes abort together if a later write cannot be queued',async()=>{
 let openRequest,aborted=false,count=0;const B={projectMediaKey:(scope,id)=>scope+':'+id},indexedDB={open(){openRequest={};return openRequest;}};
 const source=fs.readFileSync('src/104_style_reference.js','utf8');vm.runInNewContext(source.slice(0,source.indexOf(' const preview=B.v6FilePreview;'))+'})();',{BMH:B,indexedDB,Error});
 const pending=B.styleReferenceStore.putMany([{mediaId:'a',dataUrl:'a'},{mediaId:'b',dataUrl:'b'}],{scope:'new-project'});
 openRequest.result={transaction(){return {objectStore:()=>({put(){if(++count===2)throw Error('quota');return {};}}),abort(){aborted=true;this.onabort();}};}};openRequest.onsuccess();
 await assert.rejects(pending);assert.equal(count,2);assert.equal(aborted,true);
});

function sampleHandoverFixture(upstream){
 const fixture=sampleScopeFixture(),{B}=fixture;B.customerDesignSnapshot=()=>({revision:B.drawingRevision(),project:{}});B.customerPackageFiles=()=>{upstream?.(B);return [['original.svg','keep-original']];};
 vm.runInNewContext(fs.readFileSync('src/97_project_dashboard.js','utf8'),{BMH:B,document:{addEventListener(){}},Number,Math,Map,console});
 B.sourcedBudgetCsv=()=>({revision:B.drawingRevision(),priceKey:'test-price-key',csv:'canonical-csv'});
 B.materialSampleForBinding=b=>b?.sample?{image:{src:'data:image/jpeg;base64,/9j/AAAA'},mediaId:b.sample.mediaId}:null;return fixture;
}
test('customer handover includes room/SKU sample images and traceable scale/source without private finance',()=>{
 const {B,binding}=sampleHandoverFixture();binding.sample.sourceReference='<script>UNTRUSTED</script>';B.state.project.finance.secret='PRIVATE-FINANCE-TEST';
 const before=plain(B.state.project),snapshot=B.customerDesignSnapshot(),files=B.customerPackageFiles(snapshot),json=JSON.parse(files.find(([n])=>n==='anh-mau-vat-lieu.json')[1]),html=files.find(([n])=>n==='anh-mau-vat-lieu.html')[1];
 assert.deepEqual(plain(files[0]),['original.svg','keep-original']);assert.equal(json.revision,snapshot.revision);assert.equal(json.materialSampleKey,snapshot.materialSampleKey);assert.equal(json.rows[0].roomId,'sample-room');assert.equal(json.rows[0].sku,'TEST-700-1100');assert.equal(json.rows[0].kind,'customer-surface-sample');assert.deepEqual(json.rows[0].realWorldScale,[.7,1.1]);assert.equal(json.rows[0].rotationDeg,37);
 assert.match(html,/data:image\/jpeg;base64,\/9j\/AAAA/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script>/);assert.doesNotMatch(JSON.stringify(files),/PRIVATE-FINANCE-TEST/);assert.deepEqual(plain(B.state.project),before);
});
test('handover discloses unavailable/stale samples and refuses material changes before or during export',()=>{
 const {B,binding}=sampleHandoverFixture(),snapshot=B.customerDesignSnapshot();B.materialSampleForBinding=()=>null;
 let files=B.customerPackageFiles(snapshot),json=JSON.parse(files.find(([n])=>n==='anh-mau-vat-lieu.json')[1]);assert.equal(json.rows[0].status,'sample-unavailable');assert.doesNotMatch(files.find(([n])=>n.endsWith('.html'))[1],/data:image/);
 binding.sample.rotationDeg=25;assert.throws(()=>B.customerPackageFiles(snapshot),/Xuất lại hồ sơ/);
 binding.sku='CHANGED-SKU';files=B.customerPackageFiles(B.customerDesignSnapshot());json=JSON.parse(files.find(([n])=>n==='anh-mau-vat-lieu.json')[1]);assert.equal(json.rows[0].status,'stale');assert.doesNotMatch(files.find(([n])=>n.endsWith('.html'))[1],/data:image/);
 binding.sku=binding.sample.sku;binding.roomId='another-room';files=B.customerPackageFiles(B.customerDesignSnapshot());json=JSON.parse(files.find(([n])=>n==='anh-mau-vat-lieu.json')[1]);assert.equal(json.rows[0].status,'stale');assert.match(json.rows[0].notice,/phạm vi khác/);
 const changed=sampleHandoverFixture(b=>{b.state.project.materials.finish.rooms['sample-room'].catalogMaterials.floor.sample.sourceReference='changed during export';});
 changed.B.drawingRevision=()=> 'fixed-geometry-revision';
 assert.throws(()=>changed.B.customerPackageFiles(changed.B.customerDesignSnapshot()),/Xuất lại hồ sơ/);
 const removed=sampleHandoverFixture();removed.B.drawingRevision=()=> 'fixed-geometry-revision';const prior=removed.B.customerDesignSnapshot();delete removed.binding.sample;assert.throws(()=>removed.B.customerPackageFiles(prior),/Xuất lại hồ sơ/);
});
test('selected product image never borrows a sample from another room',()=>{
 const {B,product,binding}=sampleScopeFixture();B.materialSampleForBinding=b=>b===binding?{image:{src:'data:image/png;base64,FIRST_ROOM'}}:null;
 B.state.project.plan.rooms.push({id:'second',type:'bed',name:'Second',floor:0,x:5,y:1,w:4,h:5});
 B.state.ui.sceneFocus='room:sample-room';assert.equal(B.catalogProductSample(product).roomId,'sample-room');
 B.state.ui.sceneFocus='room:second';assert.equal(B.catalogProductSample(product),null);assert.doesNotMatch(B.showroomPreviewHtml('floor'),/FIRST_ROOM|data-selected-material-sample/);
 B.state.ui.sceneFocus='all';assert.equal(B.catalogProductSample(product),null);
 B.state.ui.sceneFocus='room:removed';assert.equal(B.catalogProductSample(product),null);
});
test('exterior sample editor preserves its explicit exterior target',()=>{
 const {B}=sampleScopeFixture(),product={id:'paint-sample',category:'paint',name:'Paint fixture',sku:'PAINT-QA',specification:'test paint',unit:'m²'};
 B.state.project.materials.choices.paint=product.id;B.state.project.dataEngine.materialOverrides[product.id]={product};B.applyCatalogMaterial('paint','sand-plaster',{scope:'exterior'});
 const binding=B.state.project.materials.finish.exterior.facadeMaterials.paint;binding.sample={mediaId:'material-sample-exterior-123',productId:binding.productId,sku:binding.sku,specification:binding.specification,realWorldScale:[.7,1.1],rotationDeg:0,sourceReference:'Synthetic exterior fixture'};
 B.materialSampleForBinding=b=>b===binding?{image:{src:'data:image/png;base64,EXTERIOR'}}:null;B.state.ui.sceneFocus='all';
 assert.equal(B.catalogProductSample(product).roomId,null);assert.match(B.showroomPreviewHtml('paint'),/<option value="__exterior__" selected>/);
 B.state.ui.sceneFocus='room:sample-room';assert.equal(B.catalogProductSample(product),null);assert.doesNotMatch(B.showroomPreviewHtml('paint'),/data:image\/png;base64,EXTERIOR/);
});

test('Modern SKU image handoff keeps unresolved defaults and candidate products separate from confirmed room applications',async()=>{
 const {skuImageRegister}=await import('./team-b-sku-image-register.mjs');const r=skuImageRegister();
 assert.equal(r.fixture.styleId,'modern');assert.equal(r.fixture.testOnly,true);assert.equal(r.fixture.designRevision,'7BADC039-9AD609B4-AI4-RH3');
 const roomIds=new Set(r.fixture.rooms.map(x=>x.id)),productIds=new Set(r.products.map(x=>x.productId));
 assert.ok(r.applications.length>0);assert.ok(r.furniture.length>0);assert.equal(r.summary.confirmedApplications,0);
 for(const row of r.applications){assert.equal(row.commercialAccepted,false);assert.equal(row.productId,null);assert.equal(row.quantity,null);assert.ok(!row.roomId||roomIds.has(row.roomId));assert.ok(row.candidateProductIds.every(id=>productIds.has(id)));assert.ok(row.missing.includes('confirmed-role-product'));}
 assert.ok(r.products.every(x=>!x.commercialAccepted&&!x.exactSkuPhotoReviewed));assert.ok(r.products.every(x=>!x.displayableSourcePhoto));assert.ok(r.products.some(x=>x.price.amountVnd===null));
 assert.equal(new Set(r.furniture.map(x=>x.id)).size,r.furniture.length);assert.ok(r.furniture.every(x=>roomIds.has(x.roomId)&&!x.supplierPhotoReviewed));
});

test('finish comparison is read-only, keeps a supplied sample on its current side and never borrows another room',()=>{
 const {B,product,binding}=sampleScopeFixture();B.state.ui.step=5;
 B.state.project.plan.rooms.push({id:'other-room',type:'bed',name:'Other',floor:0,x:6,y:1,w:3,h:4});
 B.materialSampleForBinding=b=>b?.sample?.mediaId===binding.sample.mediaId?{image:{src:'data:image/jpeg;base64,COMPARISON_TEST'}}:null;
 binding.sample.sourceReference='<script>bad</script>';const before=JSON.stringify(B.state);let html=B.showroomFinishComparisonHtml('sample-room','floor','oak-floor');
 assert.equal(JSON.stringify(B.state),before);assert.match(html,/Mẫu đang xem · chưa áp dụng/);assert.match(html,/700 × 1100 mm/);assert.match(html,/Góc vân: 37°/);assert.match(html,/&lt;script&gt;bad&lt;\/script&gt;/);assert.doesNotMatch(html,/<script>/);
 const sides=html.split('data-finish-comparison-side="candidate"');assert.match(sides[0],/COMPARISON_TEST/);assert.doesNotMatch(sides[1],/COMPARISON_TEST/);
 assert.doesNotMatch(B.showroomFinishComparisonHtml('other-room','floor','oak-floor'),/COMPARISON_TEST/);
 product.sku='NEW-SKU';assert.doesNotMatch(B.showroomFinishComparisonHtml('sample-room','floor','oak-floor'),/COMPARISON_TEST/);
 assert.match(B.showroomFinishComparisonHtml('removed','floor'),/Phòng hoặc bề mặt đã đổi/);
});


test('finish comparison and chosen palette preserve custom colour with its existing material pattern',()=>{
 const B=make(),room=B.state.project.plan.rooms.find(r=>!['stairs','elevator','balcony'].includes(r.type));
 B.applyVisualMaterial('floor','oak-floor',room.id);
 B.state.project.materials.finish.rooms[room.id].floor='#123abc';
 B.state.ui.sceneFocus='room:'+room.id;B.state.ui.materialView='floor';
 const before=JSON.stringify(B.state),profile=B.VISUAL_MATERIALS.find(p=>p.id==='oak-floor');
 const current=B.showroomFinishComparisonHtml(room.id,'floor','ivory-tile').split('data-finish-comparison-side="candidate"')[0];
 assert.match(current,/--finish-color:#123abc/);assert.match(current,/finish-plank/);assert.match(current,/màu riêng/);
 assert.match(current,new RegExp(profile.scale.map(n=>Math.round(n*1000)).join(' × ')+' mm'));
 const chosen=B.showroomChoiceBoardHtml().split('data-picked-finish="floor"')[1].split('data-picked-finish="wall"')[0];
 assert.match(chosen,/--finish-color:#123abc/);assert.match(chosen,/màu riêng/);
 assert.equal(JSON.stringify(B.state),before);assert.notEqual(profile.color,'#123abc');
});


test('sample zoom resolves only the active room or explicit exterior, including shared image IDs',()=>{
 const {B,binding}=sampleScopeFixture();B.materialSampleForBinding=b=>b?.sample?{image:{src:'data:image/jpeg;base64,AAAA'}}:null;
 B.state.project.plan.rooms.push({id:'second-room',name:'Second room',type:'bed',floor:0,x:6,y:1,w:3,h:4});
 B.state.ui.sceneFocus='room:second-room';assert.equal(B.materialSampleDetails(binding.sample.mediaId),null);
 const copied=structuredClone(B.state.project.materials.finish.rooms['sample-room']);
 copied.catalogMaterials.floor.roomId='second-room';copied.catalogMaterials.floor.sample.sourceReference='Second source';copied.catalogMaterials.floor.sample.realWorldScale=[.2,.3];
 B.state.project.materials.finish.rooms['second-room']=copied;
 const before=JSON.stringify(B.state),details=B.materialSampleDetails(binding.sample.mediaId);
 assert.equal(details.name,'Second room');assert.equal(details.binding.sample.sourceReference,'Second source');assert.deepEqual(plain(details.binding.sample.realWorldScale),[.2,.3]);
 B.state.ui.sceneFocus='all';assert.equal(B.materialSampleDetails(binding.sample.mediaId),null);
 B.state.ui.sceneFocus='room:removed';assert.equal(B.materialSampleDetails(binding.sample.mediaId),null);
 B.state.ui.sceneFocus='room:second-room';assert.equal(JSON.stringify(B.state),before);
});

test('whole-house save and preview uses the measured rooms and persists bindings without changing geometry',()=>{
 const {B}=sampleScopeFixture(),p=B.state.project;p.plan.rooms.push({id:'second',name:'Second',type:'bed',floor:1,x:1,y:2,w:3,h:4});
 const geometry=JSON.stringify(p.plan);B.state.ui.step=5;
 const result=B.saveAndPreviewShowroomProduct('floor','ivory-tile','all');assert.equal(result.saved,true);assert.equal(result.opened,true);assert.equal(B.state.ui.step,6);
 for(const r of p.plan.rooms){const palette=B.finishPalette(r.id),binding=palette.catalogMaterials.floor;assert.equal(binding.visualProfileId,'ivory-tile');assert.equal(binding.roomId,r.id);}
 assert.equal(JSON.stringify(p.plan),geometry);
 const saved=JSON.stringify(p.materials.finish);B.state=B.mergeState(B.defaultState(),JSON.parse(JSON.stringify(B.state)));B.normalizeState();assert.equal(JSON.stringify(B.state.project.materials.finish),saved);
 assert.equal(B.openShowroomProductPreview('floor','ivory-tile','all'),true);
 B.applyVisualMaterial('floor','oak-floor','second');const before=JSON.stringify(B.state);assert.equal(B.openShowroomProductPreview('floor','ivory-tile','all'),false);assert.equal(JSON.stringify(B.state),before);
});

test('unassigned save keeps a custom room and previews a matching room only',()=>{
 const {B}=sampleScopeFixture(),p=B.state.project;p.plan.rooms.push({id:'unassigned',name:'New room',type:'bed',floor:0,x:6,y:1,w:3,h:4});
 B.applyVisualMaterial('floor','oak-floor','sample-room');const kept=JSON.stringify(p.materials.finish.rooms['sample-room']);B.state.ui.sceneFocus='room:sample-room';
 const result=B.saveAndPreviewShowroomProduct('floor','ivory-tile','unassigned');assert.equal(result.saved,true);assert.equal(result.opened,true);assert.equal(B.state.ui.sceneFocus,'room:unassigned');assert.equal(JSON.stringify(p.materials.finish.rooms['sample-room']),kept);
 const before=JSON.stringify(B.state);assert.equal(B.saveAndPreviewShowroomProduct('floor','ivory-tile','room:removed').saved,false);assert.equal(JSON.stringify(B.state),before);
});

test('empty materials guide returns to the measured drawing without creating demo rooms',()=>{
 const B=make();B.state.project.plan.rooms=[];const before=JSON.stringify(B.state.project),html=B.showroomChoiceBoardHtml();
 assert.match(html,/data-nav="4" class="showroom-primary"/);assert.match(html,/Dựng phòng theo kích thước/);assert.equal(JSON.stringify(B.state.project),before);
});

test('room material preview leaves exploded inspection mode and persists the assembled room without changing the design',()=>{
 const B=make(),room=B.state.project.plan.rooms.find(r=>r.type==='living');
 B.selectShowroomFinish('natural-linen',room.id);B.state.ui.sceneExploded=true;B.state.ui.sceneFocus='all';B.state.ui.modelWalls='full';
 const project=JSON.stringify(B.state.project),before=JSON.stringify(B.state);
 assert.equal(B.openShowroomFinishPreview('removed'),false);assert.equal(JSON.stringify(B.state),before);
 assert.equal(B.openShowroomFinishPreview(room.id),true);assert.equal(B.state.ui.sceneExploded,false);
 assert.equal(B.state.ui.sceneFocus,'room:'+room.id);assert.equal(B.state.ui.roomCamera,'inside');assert.equal(B.state.ui.modelWalls,'full');assert.equal(JSON.stringify(B.state.project),project);
 const finish=JSON.stringify(B.state.project.materials.finish);B.state=B.loadState();assert.equal(B.state.ui.sceneExploded,false);assert.equal(B.state.ui.sceneFocus,'room:'+room.id);assert.equal(JSON.stringify(B.state.project.materials.finish),finish);
});

test('exterior material preview assembles the house only after a valid binding is found',()=>{
 const {B}=sampleScopeFixture(),p=B.state.project,product={id:'outside-paint-preview',category:'paint',sku:'PAINT-PREVIEW',specification:'Exterior paint',unit:'m²'};
 p.materials.choices.paint=product.id;p.dataEngine.materialOverrides[product.id]={product};
 assert.equal(B.applyShowroomProduct('paint','sand-plaster','exterior'),true);B.state.ui.sceneExploded=true;
 const project=JSON.stringify(p),before=JSON.stringify(B.state);
 assert.equal(B.openShowroomProductPreview('paint','white-plaster','exterior'),false);assert.equal(JSON.stringify(B.state),before);
 assert.equal(B.openShowroomProductPreview('paint','sand-plaster','exterior'),true);assert.equal(B.state.ui.sceneExploded,false);
 assert.equal(B.state.ui.sceneFocus,'all');assert.equal(B.state.ui.designView,'exterior');assert.equal(JSON.stringify(p),project);
});

test('finish camera capture rejects a retained renderer from another room, view or project',()=>{
 const B=make(),p=B.state.project,rooms=p.plan.rooms.filter(r=>!['stairs','elevator','balcony'].includes(r.type));
 Object.assign(B.state.ui,{sceneFocus:'room:'+rooms[0].id,roomCamera:'inside',sceneExploded:false});
 const scene=B.studio3d={project:p,cameraScope:{focus:B.state.ui.sceneFocus,roomCamera:B.state.ui.roomCamera,exteriorCamera:B.state.ui.exteriorCamera,exploded:false},scene:{userData:{}},state:{yaw:.3,pitch:.2,dist:2,target:{toArray:()=>[1,2,3]}}};
 const geometry=JSON.stringify(p.plan),finish=JSON.stringify(p.materials.finish);B.rememberFinishCamera();assert.equal(B.pendingFinishCamera.project,p);assert.deepEqual(plain(B.pendingFinishCamera.target),[1,2,3]);
 for(const [key,value]of [['sceneFocus','room:'+rooms[1].id],['roomCamera','overview'],['exteriorCamera','overview'],['sceneExploded',true]]){
  const previous=B.state.ui[key];B.state.ui[key]=value;B.rememberFinishCamera();assert.equal(B.pendingFinishCamera,null,'reject changed '+key);B.state.ui[key]=previous;
 }
 B.state.project=structuredClone(p);B.rememberFinishCamera();assert.equal(B.pendingFinishCamera,null,'same geometry in another project is not the same camera owner');B.state.project=p;
 scene.scene.userData.disposed=true;B.rememberFinishCamera();assert.equal(B.pendingFinishCamera,null);scene.scene.userData.disposed=false;
 scene.cameraScope=null;B.rememberFinishCamera();assert.equal(B.pendingFinishCamera,null);
 assert.equal(JSON.stringify(p.plan),geometry);assert.equal(JSON.stringify(p.materials.finish),finish);
});

test('finish camera restore rejects a late mount from another project or view and retains a valid pose',async()=>{
 const prefix=fs.readFileSync('src/86_visual_materials.js','utf8').split('BMH.VISUAL_MATERIALS=')[0];
 for(const mode of ['valid','project','view','exploded']){
  const project={},ui={sceneFocus:'room:r',roomCamera:'inside',exteriorCamera:'front',sceneExploded:false};let updates=0,reset=0;
  const B={state:{project,ui},$:()=>null,mountStudio3D:async()=>{
   B.studio3d={project:mode==='project'?{}:project,cameraScope:{...ui,focus:mode==='view'?'room:other':ui.sceneFocus,exploded:mode==='exploded'},scene:{userData:{}},state:{yaw:0,pitch:0,dist:5,target:{fromArray(v){this.value=v;}},resetCameraValidation(){reset++;},updateCamera(){updates++;}}};
  }};
  vm.runInNewContext(prefix,{BMH:B,JSON});
  B.pendingFinishCamera={project,focus:ui.sceneFocus,preset:ui.roomCamera,exterior:ui.exteriorCamera,exploded:false,yaw:.3,pitch:.2,dist:2,target:[1,2,3]};
  await B.mountStudio3D();assert.equal(updates,mode==='valid'?1:0,mode);assert.equal(reset,mode==='valid'?1:0,mode);
  if(mode==='valid'){assert.equal(B.studio3d.state.dist,2);assert.deepEqual(B.studio3d.state.target.value,[1,2,3]);assert.equal(B.pendingFinishCamera,null);}
 }
});

test('AI preview cannot publish into a different project with the same design signature',async()=>{
 for(const switched of [false,true]){
  const B=make(),project=B.state.project;let calls=0;
  B.cinematicSignature=()=> 'identical-copy';B.cinematicCameraKey=()=> 'same-camera';B.capturePlanReference=async()=> 'data:image/jpeg;base64,REFERENCE';
  B.aiFetch=async()=>{calls++;if(switched)B.state.project=structuredClone(project);return {ok:true,json:async()=>({image:'SYNTHETIC',mimeType:'image/png'})};};
  await B.generateCinematicRender();assert.equal(calls,1);assert.equal(B.cinematicRender.loading,false);
  if(switched){assert.equal(B.cinematicRender.views['identical-copy'],undefined);assert.ok(!B.cinematicRender.dataUrl);}
  else assert.equal(B.cinematicRender.views['identical-copy'],'data:image/png;base64,SYNTHETIC');
 }
});

test('AI preview rejects a retained renderer owned by another project before capturing or calling the service',async()=>{
 const B=make();let captures=0,calls=0;B.studio3d={project:{},renderer:{domElement:{}},scene:{userData:{}},renderFrame(){}};
 B.cinematicReferenceImage=()=>{captures++;return 'OLD-PROJECT';};B.aiFetch=async()=>{calls++;throw Error('must not call');};
 await B.generateCinematicRender();assert.equal(captures,0);assert.equal(calls,0);assert.equal(B.cinematicRender.loading,false);
});

test('AI preview stops before the service if the project changes while preparing reference bytes',async()=>{
 const B=make();let calls=0;B.cinematicSignature=()=> 'identical-copy';
 B.capturePlanReference=async()=>{B.state.project=structuredClone(B.state.project);return 'data:image/jpeg;base64,REFERENCE';};
 B.aiFetch=async()=>{calls++;throw Error('must not call');};
 await B.generateCinematicRender();assert.equal(calls,0);assert.equal(B.cinematicRender.loading,false);assert.ok(!B.cinematicRender.dataUrl);
});
