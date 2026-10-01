import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
function client(){
 const B={state:{project:{site:{width:5,depth:20,floors:2,designStrategy:'balanced',province:'TP. Hồ Chí Minh'},household:{children:[{name:'Con'}],relatives:[{name:'Mẹ'}]},plan:{rooms:[{id:'old',floor:0,name:'Phòng đang sửa',type:'living',x:0,y:0,w:4,h:4}],openings:[],lockedRoomIds:[],lockedFloors:[]},materials:{choices:{paint:'my-sku'},finish:{exterior:{wall:'#123456'},rooms:{}}},style:'Phong cách riêng',designStudio:{kits:[]}},ui:{planner:{floor:0},sceneFocus:'all',onboardingComplete:true}},screen1:()=>'',footer:()=>'',SCREENS:[],planHistory:{undo:[],redo:[]},save(){},render(){},toast(){},clamp:(n,a,b)=>Math.max(a,Math.min(b,n)),householdNeeds:()=>({bedrooms:3}),buildableEnvelope:()=>({buildWidth:4.6,buildDepth:17,originX:.2,originY:2}),externalSides:()=>['north','west'],normalizeState(){this.state.project.plan.rooms.forEach(r=>r.furnitureRotation??=0);},esc:String};
 const ctx={BMH:B,document:{addEventListener(){}},queueMicrotask(){},window:{},structuredClone,console};vm.runInNewContext(fs.readFileSync('src/30_planner.js','utf8'),ctx);B.externalSides=()=>['north','west'];B.planMetrics=p=>({area:p.rooms.reduce((sum,r)=>sum+r.w*r.h,0)});vm.runInNewContext(fs.readFileSync('src/81_design_studio.js','utf8'),ctx);return B;
}
test('whole design proposals have different valid layouts without changing the current plan',()=>{
 const b=client(),before=JSON.stringify(b.state.project.plan);assert.equal(b.generateDesignKits(),true);assert.equal(b.designState().kits.length,3);assert.equal(JSON.stringify(b.state.project.plan),before);assert.equal(b.planHistory.undo.length,0);
 const plans=b.designState().kits.map(k=>{assert.equal(b.layoutValid(k.plan.rooms),true);assert.equal(k.plan.rooms.filter(r=>r.type==='stairs').length,2);assert.equal(k.plan.rooms.filter(r=>r.type==='corridor').length,2);assert.ok(k.plan.openings.every(o=>k.plan.rooms.some(r=>r.id===o.roomId)));return JSON.stringify(k.plan.rooms);});assert.equal(new Set(plans).size,3);
});
test('an impossible envelope does not masquerade as a generated design',()=>{
 const b=client(),before=JSON.stringify(b.state.project.plan);b.buildableEnvelope=()=>({buildWidth:2,buildDepth:6,side:0,front:0});assert.equal(b.generateAutoPlanSnapshot('balanced'),null);assert.equal(b.generateDesignKits(),false);assert.equal(JSON.stringify(b.state.project.plan),before);
});
test('single-storey proposals use the floor area for rooms without an unused staircase',()=>{
 const b=client();b.state.project.site.floors=1;b.householdNeeds=()=>({bedrooms:2});b.state.project.household={children:[{name:'Con'}],relatives:[]};b.buildableEnvelope=()=>({buildWidth:4.6,buildDepth:12,originX:.2,originY:2});
 assert.equal(b.generateDesignKits(),true);for(const kit of b.designState().kits){assert.equal(kit.plan.rooms.some(r=>r.type==='stairs'),false);assert.equal(kit.plan.rooms.filter(r=>r.type==='bed').length,2);assert.ok(kit.plan.rooms.every(r=>r.floor===0));assert.equal(b.layoutValid(kit.plan.rooms),true);}
});
test('selecting a kit coordinates geometry and all finishes while keeping product SKUs',()=>{
 const b=client(),before=JSON.stringify({plan:b.state.project.plan,style:b.state.project.style,finish:b.state.project.materials.finish});b.generateDesignKits();assert.equal(b.applyDesignKit('B'),true);const p=b.state.project;assert.equal(p.style,'Japandi');assert.equal(p.materials.choices.paint,'my-sku');assert.ok(p.plan.rooms.every(r=>p.materials.finish.rooms[r.id].wall==='#eee6d9'));assert.equal(b.designState().appliedSignature,b.designAppliedKey());assert.equal(b.state.ui.sceneFocus,'all');
 assert.equal(b.restoreDesignKit(),true);assert.equal(JSON.stringify({plan:p.plan,style:p.style,finish:p.materials.finish}),before);assert.equal(p.site.designStrategy,'balanced');
});
test('locked rooms and changed input protect the customer design from replacement',()=>{
 const b=client();b.generateDesignKits();const before=JSON.stringify(b.state.project.plan);b.state.project.plan.lockedRoomIds=['old'];assert.equal(b.applyDesignKit('A'),false);assert.equal(b.state.project.plan.rooms[0].id,'old');b.state.project.plan.lockedRoomIds=[];b.state.project.site.width=6;assert.equal(b.applyDesignKit('A'),false);assert.equal(JSON.stringify(b.state.project.plan),before);
});
test('saved kits and a manually edited plan survive project reload',()=>{
 const b=client();b.generateDesignKits();b.applyDesignKit('C');b.state.project.plan.rooms[0].name='Phòng khách riêng';b.VERSION='test';b.defaultDataEngineState=()=>({});const source=fs.readFileSync('src/10_state.js','utf8');vm.runInNewContext(source.slice(0,source.indexOf('BMH.loadState =')),{BMH:b,structuredClone});const restored=b.mergeState(b.defaultState(),b.state);assert.equal(restored.project.designStudio.activeKit,'C');assert.equal(restored.project.designStudio.kits.length,3);assert.equal(restored.project.plan.rooms[0].name,'Phòng khách riêng');assert.notEqual(b.designState().appliedSignature,b.designAppliedKey());
});

test('standalone drawing previews keep the SVG namespace for all drawing types',()=>{const b=client();b.elevationSvg=()=>'<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>';b.sectionSvg=b.elevationSvg;b.drawingSheetSvg=()=>'<svg xmlns="http://www.w3.org/2000/svg"><text>Plan</text></svg>';for(const type of ['plan','elevation','section'])assert.equal((b.designDrawingSvg(type,0).match(/xmlns=/g)||[]).length,1);});
