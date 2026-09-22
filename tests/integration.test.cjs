const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function appContext(){
 const el={addEventListener(){},innerHTML:'',style:{},remove(){}};const storage=new Map();
 const ctx={document:{querySelector(){return el}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},structuredClone,Intl,console,Blob,TextEncoder,URL,setTimeout,clearTimeout,navigator:{},location:{protocol:'file:',hostname:''},devicePixelRatio:1};
 vm.createContext(ctx);for(const f of ['core.js','app.js','scene3d.js','upgrade.js'])vm.runInContext(fs.readFileSync(path.join(root,'dist',f),'utf8'),ctx,{filename:f});
 return {ctx,run:code=>vm.runInContext(code,ctx),storage};
}
test('UI and core use exactly the same quote and geometry',()=>{const {run}=appContext();assert.equal(run('calc().total'),run('Core.buildSnapshot(state).quote.total'));assert.equal(run('calc().area'),run('Core.buildSnapshot(state).geometry.floorArea'));});
test('round-trip preserves openings, prices and draw schedules',()=>{const {run}=appContext();run("state.openings=[{id:'o1',wallId:snapshot().geometry.walls[0].id,kind:'door',offset:0,width:1,height:2,sill:0}];state.loanDraws=[{month:1,percent:50},{month:5,percent:50}]");const before=run('snapshot().id');run('state=validateProject(JSON.parse(JSON.stringify(state)))');assert.equal(run('snapshot().id'),before);assert.equal(run('state.openings[0].id'),'o1');});
test('2D SVG has same doors as quantities and 3D mesh',()=>{const {run}=appContext();const before=run('BMHScene.mesh(snapshot()).length');run("state.openings=[{id:'o1',wallId:snapshot().geometry.walls[0].id,kind:'door',offset:.5,width:1,height:2,sill:0}]");assert.equal(run('snapshot().geometry.doorArea'),2);assert.ok(run('planSvg().includes("Cửa đi")'));assert.notEqual(run('BMHScene.mesh(snapshot()).length'),before);});
test('all export formats include same snapshot and quote amount',()=>{const {run}=appContext();for(const fn of ['costCsv','loanCsv','cashCsv','allSvg','reportBody','BMHScene.obj'])assert.ok(run(`${fn}(snapshot()).includes(snapshot().id)`));assert.ok(run('costCsv(snapshot()).includes(String(snapshot().quote.total))'));});
test('ZIP store contains UTF8 content and central directory',async()=>{const {run}=appContext();const bytes=Buffer.from(await run("zipFiles({'test.txt':'Xin chào Việt Nam'})").arrayBuffer());assert.equal(bytes.readUInt32LE(0),0x04034b50);const nameLength=bytes.readUInt16LE(26),size=bytes.readUInt32LE(18);assert.equal(bytes.subarray(30+nameLength,30+nameLength+size).toString(),'Xin chào Việt Nam');assert.equal(bytes.readUInt32LE(bytes.length-22),0x06054b50);});
test('3D orbit, zoom and floor selection produce finite vertices',()=>{const {ctx,run}=appContext();let points=0;const context2d=new Proxy({},{get:(obj,key)=>obj[key]??((...args)=>{for(const n of args)if(typeof n==='number')assert.ok(Number.isFinite(n));if(key==='lineTo')points++;}),set:(obj,key,value)=>{obj[key]=value;return true;}});const handlers={};ctx.testCanvas={clientWidth:700,getContext:()=>context2d,addEventListener:(k,v)=>handlers[k]=v,removeEventListener(){},setPointerCapture(){}};ctx.floorSelect={value:'all'};run('BMHScene.mount(testCanvas,snapshot(),floorSelect)');assert.ok(points>0);ctx.testCanvas.onpointerdown({clientX:0,clientY:0,pointerId:1});ctx.testCanvas.onpointermove({clientX:80,clientY:20});handlers.wheel({deltaY:100,preventDefault(){}});ctx.floorSelect.value='1';ctx.floorSelect.onchange();assert.ok(run('BMHScene.mesh(snapshot(),1).every(o=>o.floor===1)'));});
test('AI notice becomes stale after design change',()=>{const {run}=appContext();run("aiResult={snapshotId:snapshot().id,insights:[{text:'Test',evidenceIds:['budget']}]};state.rooms[0].h=3");assert.ok(run('aiMarkup(snapshot()).includes("Nhận xét cũ")'));});
test('source labels are escaped in reports',()=>{const {run}=appContext();run("state.prices[0].source='<img src=x onerror=alert(1)>'");assert.ok(run('reportBody(snapshot()).includes("&lt;img")'));assert.equal(run('reportBody(snapshot()).includes("<img src=x")'),false);});
test('mobile resilience bundle contains responsive tables, camera input and 3D fallback',()=>{
 const index=fs.readFileSync(path.join(root,'dist','index.html'),'utf8');
 const css=fs.readFileSync(path.join(root,'dist','styles.css'),'utf8');
 const mobile=fs.readFileSync(path.join(root,'dist','mobile-resilience.js'),'utf8');
 assert.match(index,/id="cameraUpload"[^>]*capture="environment"/);
 assert.match(index,/mobile-resilience\.js/);
 assert.match(css,/-webkit-overflow-scrolling:touch/);
 assert.match(css,/safe-area-inset-bottom/);
 assert.match(mobile,/bmh-v13-saved-at/);
 assert.match(mobile,/elapsed>3000/);
 assert.match(mobile,/application\/vnd\.ms-excel/);
});
