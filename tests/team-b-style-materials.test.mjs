import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {designClient} from './fixtures/design-client.mjs';
import {materialPriceEvidence} from '../server/_material_catalog.mjs';
const plain=x=>JSON.parse(JSON.stringify(x));
const make=()=>{const b=designClient({identity:true});b.autoPlanConcept();b.state.project.materials.finish={exterior:null,rooms:{}};b.materialPriceEvidence=materialPriceEvidence;return b;};

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
