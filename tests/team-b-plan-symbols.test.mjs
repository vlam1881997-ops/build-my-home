import test from 'node:test';
import assert from 'node:assert/strict';
import {designClient} from './fixtures/design-client.mjs';

test('all catalogue symbols follow measured dimensions and arbitrary pose without editing the plan',()=>{
 const B=designClient(),before=JSON.stringify(B.state.project);
 for(const [modelId,d] of Object.entries(B.FURNITURE_DIMENSIONS))for(const angle of [0,37,90,180,270]){
  const i={modelId,pose:{x:3.2,y:4.6,rotationDeg:angle},size:{width:d.w*1.1,depth:d.d*.8,height:d.h}};
  const svg=B.furniturePlanSymbol(i);
  assert.match(svg,new RegExp('rotate\\('+angle+'\\)'));
  assert.ok(svg.includes('translate(3.2 4.6)'));
  assert.ok(svg.includes('data-symbol-model="'+modelId+'"'));
  assert.doesNotMatch(svg,/NaN|undefined|Infinity/);
 }
 assert.equal(JSON.stringify(B.state.project),before);
 assert.equal(B.furniturePlanSymbol({pose:{x:0,y:0,rotationDeg:0},size:{width:NaN,depth:1}}),'');
});

test('bed, seating and sanitary fixtures are distinguishable and preserve source front direction',()=>{
 const B=designClient();
 for(const [modelId,kind] of [['bedDouble','bed'],['loungeDesignSofa','seat'],['toilet','toilet'],['kitchenSink','sink'],['kitchenStove','hob'],['washingMachine','washer']]){
  const i={modelId,pose:{x:0,y:0,rotationDeg:0},size:{width:1,depth:1,height:1}};
  assert.ok(B.furniturePlanSymbol(i).includes('data-symbol-kind="'+kind+'"'));
 }
 const bed=B.furniturePlanSymbol({modelId:'bedDouble',pose:{x:0,y:0,rotationDeg:0},size:{width:2,depth:2,height:1}});
 assert.ok(bed.includes('y="-0.98"')); // headboard opposite the +Y foot/front.
 const sofa=B.furniturePlanSymbol({modelId:'loungeDesignSofa',pose:{x:0,y:0,rotationDeg:0},size:{width:2,depth:1,height:1}});
 assert.ok(sofa.includes('y="0.32"')); // backrest opposite the -Y seat front.
});
