import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {designClient} from './fixtures/design-client.mjs';
import {materialPriceEvidence} from '../server/_material_catalog.mjs';
const plain=x=>JSON.parse(JSON.stringify(x));
const make=()=>{const b=designClient({identity:true});b.autoPlanConcept();b.state.project.materials.finish={exterior:null,rooms:{}};b.materialPriceEvidence=materialPriceEvidence;return b;};

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
