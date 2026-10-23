const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function client(){
 const context={location:{hostname:'localhost'},localStorage:{getItem:()=>null,setItem(){}},document:{addEventListener(){},querySelector:()=>null},window:{},structuredClone,console,setTimeout,clearTimeout,URL};vm.createContext(context);
 for(const file of ['00_boot','01_vn34_catalog','15_data_engine','10_state'])vm.runInContext(fs.readFileSync('src/'+file+'.js','utf8').replace('const BMH =','var BMH ='),context);
 const B=context.BMH;B.render=()=>{};B.importProjectJson=async()=>{};B.toast=()=>{};vm.runInContext(fs.readFileSync('src/82_customer_projects.js','utf8'),context);return B;
}
test('local project identity and timestamps survive schema merge while unknown metadata is rejected',()=>{
 const B=client(),s=B.defaultState();Object.assign(s.meta,{localProjectId:'home_saved-1',createdAt:'2026-10-02T04:00:00.000Z',savedAt:'2026-10-02T04:01:00.000Z',unknown:'discard'});
 B.state=B.mergeState(B.defaultState(),s);B.normalizeState();assert.equal(B.state.meta.localProjectId,s.meta.localProjectId);assert.equal(B.state.meta.createdAt,s.meta.createdAt);assert.equal(B.state.meta.savedAt,s.meta.savedAt);assert.equal('unknown'in B.state.meta,false);
 B.state.meta.localProjectId='<unsafe>';B.state.meta.createdAt='invalid';B.normalizeState();assert.equal(B.state.meta.localProjectId,'');assert.equal(B.state.meta.createdAt,null);
});
test('saved snapshots cannot restore paid access and editing a copy does not mutate the source',()=>{
 const B=client(),s=B.defaultState();s.access={paid:true,source:'server-verified',orderCode:123};s.ui.renderMode='quality';const copy=B.projectSnapshot(s);copy.project.plan.rooms[0].name='Copy';assert.notEqual(copy.project.plan.rooms[0].name,s.project.plan.rooms[0].name);assert.equal(copy.access.paid,false);assert.equal(copy.access.orderCode,null);assert.equal(copy.ui.renderMode,'interactive');assert.equal(s.access.paid,true);assert.equal(s.ui.renderMode,'quality');
});
test('queued writes preserve ordering and a failed write does not block the next transaction',async()=>{
 const B=client(),order=[];let release;const first=B.projectEnqueue(()=>new Promise(resolve=>{order.push('start');release=()=>{order.push('finish');resolve();};}));const second=B.projectEnqueue(()=>order.push('next'));await Promise.resolve();await Promise.resolve();assert.deepEqual(order,['start']);release();await Promise.all([first,second]);assert.deepEqual(order,['start','finish','next']);await assert.rejects(B.projectEnqueue(()=>{throw Error('disk');}));await B.projectEnqueue(()=>order.push('recovered'));assert.equal(order.at(-1),'recovered');
});

test('fresh sessions and new project state start empty without changing migration defaults',()=>{
 const B=client();assert.equal(B.localStateLoaded,false);assert.equal(B.state.project.plan.rooms.length,0);assert.equal(B.newProjectState().project.plan.openings.length,0);
 assert.equal(B.defaultState().project.plan.rooms.length,9);
 const old=B.defaultState();old.project.plan.rooms[0].name='Saved customer room';const saved=JSON.stringify(old.project.plan);
 const restored=B.mergeState(B.defaultState(),old);B.state=restored;B.normalizeState();assert.equal(JSON.stringify(B.state.project.plan.rooms),JSON.stringify(JSON.parse(saved).rooms));
 const empty=B.newProjectState();B.state=B.mergeState(B.defaultState(),empty);B.normalizeState();assert.equal(B.state.project.plan.rooms.length,0);
});

test('actual create/copy/open paths preserve saved designs and keep new designs empty',async()=>{
 const B=client(),records=new Map();
 B.saveCustomerProject=async()=>{};B.projectPut=async(state,id)=>records.set(id,{id,state:structuredClone(state)});B.projectGet=async id=>records.get(id);B.projectActivate=async()=>{};B.saveBeforeProjects=()=>{};B.closeProjectLibrary=()=>{};B.projectSaveStatus=()=>{};
 const legacy=B.defaultState();legacy.project.plan.rooms[0].name='My measured design';records.set('legacy',{id:'legacy',state:legacy});const before=JSON.stringify(legacy.project.plan);
 await B.newCustomerProject();assert.equal(B.state.project.plan.rooms.length,0);await B.projects.activation;
 const freshId=B.projects.activeId;await B.openCustomerProject('legacy');assert.equal(B.state.project.plan.rooms[0].name,'My measured design');
 await B.newCustomerProject({copyId:'legacy'});assert.equal(JSON.stringify(B.state.project.plan.rooms),JSON.stringify(legacy.project.plan.rooms));assert.equal(JSON.stringify(legacy.project.plan),before);
 await B.openCustomerProject(freshId);assert.equal(B.state.project.plan.rooms.length,0);
});
